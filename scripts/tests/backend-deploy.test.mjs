import assert from 'node:assert/strict'
import { once } from 'node:events'
import http from 'node:http'
import { cp, mkdir, mkdtemp, readFile, rm, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import test from 'node:test'
import { pathToFileURL } from 'node:url'

const root = resolve(import.meta.dirname, '../..')
const config = JSON.parse(await readFile(join(root, 'backend/railpack.json'), 'utf8'))

test('the API install layer contains its own lockfile and Prisma schema before npm ci', async () => {
  const install = await mkdtemp(join(tmpdir(), 'ivygoo-api-install-'))
  try {
    let checked = false
    for (const command of config.steps.install.commands) {
      if (typeof command === 'object' && command.src) {
        await mkdir(dirname(join(install, command.dest)), { recursive: true })
        await cp(join(root, command.src), join(install, command.dest), { recursive: true })
      } else if (command === 'npm ci --prefix backend --include=dev') {
        const pkg = JSON.parse(await readFile(join(install, 'backend/package.json'), 'utf8'))
        const lock = JSON.parse(await readFile(join(install, 'backend/package-lock.json'), 'utf8'))
        assert.ok(lock.lockfileVersion >= 1)
        assert.equal(lock.name, pkg.name)
        assert.deepEqual(lock.packages[''].dependencies, pkg.dependencies)
        assert.deepEqual(lock.packages[''].devDependencies, pkg.devDependencies)
        assert.match(await readFile(join(install, 'backend/prisma/schema.prisma'), 'utf8'), /provider\s*=\s*"postgresql"/)
        checked = true
      }
    }
    assert.ok(checked, 'the API clean install must execute with its inputs already present')
  } finally { await rm(install, { recursive: true, force: true }) }
})

test('the filtered API runtime imports and serves health without frontend files or dependencies', async () => {
  const runtime = await mkdtemp(join(tmpdir(), 'ivygoo-api-runtime-'))
  let server
  try {
    for (const layer of config.deploy.inputs.filter(input => input.step === 'build')) {
      for (const included of layer.include) {
        assert.ok(included.startsWith('/app/'))
        const relative = included.slice('/app/'.length)
        await mkdir(dirname(join(runtime, relative)), { recursive: true })
        if (relative === 'backend/node_modules') {
          // Installed dependencies are the sole shared input; application files
          // come only from the production runtime allowlist.
          await symlink(join(root, relative), join(runtime, relative), process.platform === 'win32' ? 'junction' : 'dir')
        } else if (relative === 'public/audio') {
          await mkdir(join(runtime, relative), { recursive: true })
        } else {
          await cp(join(root, relative), join(runtime, relative), { recursive: true })
        }
      }
    }
    Object.assign(process.env, {
      NODE_ENV: 'test', DATABASE_URL: 'postgresql://test:test@127.0.0.1:5432/test',
      ACCESS_TOKEN_SECRET: 'api-deploy-test-access-000000', REFRESH_TOKEN_SECRET: 'api-deploy-test-refresh-00000',
    })
    const { app } = await import(pathToFileURL(join(runtime, 'backend/dist/app.js')))
    server = http.createServer(app)
    await once(server.listen(0, '127.0.0.1'), 'listening')
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/health`)
    assert.equal(response.status, 200)
    assert.equal((await response.json()).status, 'ok')
    const catalog = JSON.parse(await readFile(join(runtime, 'backend/dist/data/nova-catalog.json'), 'utf8'))
    assert.ok(catalog.tests.length > 0)
    const { PrismaClient } = await import(pathToFileURL(join(runtime, 'backend/node_modules/@prisma/client/default.js')))
    const prisma = new PrismaClient()
    assert.equal(typeof prisma.writingSubmission.findMany, 'function')
    await prisma.$disconnect()
  } finally {
    if (server) await new Promise(resolve => { server.close(resolve); server.closeAllConnections() })
    await rm(runtime, { recursive: true, force: true })
  }
})
