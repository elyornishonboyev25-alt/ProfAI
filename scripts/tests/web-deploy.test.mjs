import assert from 'node:assert/strict'
import { once } from 'node:events'
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import test from 'node:test'
import { pathToFileURL } from 'node:url'

const root = resolve(import.meta.dirname, '../..')
const config = JSON.parse(await readFile(join(root, 'railpack.json'), 'utf8'))

test('the filtered web runtime starts and serves pages and seekable media without build dependencies', async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'ivygoo-deploy-'))
  const source = join(workspace, 'build')
  const runtime = join(workspace, 'runtime')
  const fixtures = {
    'dist/index.html': '<h1>Release</h1>',
    'dist/assets/index-release.js': 'console.log("release")',
    'dist/audio/listening.mp3': '0123456789',
    'dist/media/intro.webm': 'intro',
    'dist/sat/diagram.svg': '<svg/>',
    'public/audio/listening.mp3': 'unneeded source copy',
    'src/main.tsx': 'unneeded source',
    'node_modules/build-only/index.js': 'unneeded dependency',
    'backend/package.json': '{}',
  }
  let server
  try {
    for (const [path, content] of Object.entries(fixtures)) {
      await mkdir(dirname(join(source, path)), { recursive: true })
      await writeFile(join(source, path), content)
    }
    for (const path of ['package.json', 'scripts/serve-web.mjs', 'shared/retiredPages.mjs']) {
      await mkdir(dirname(join(source, path)), { recursive: true })
      await cp(join(root, path), join(source, path))
    }

    // Materialize the actual deploy allowlist, as separate copies, into an
    // empty runtime. This catches missing local imports and lost media paths.
    const copies = new Map()
    for (const layer of config.deploy.inputs.filter(input => input.step === 'build')) {
      const excludes = (layer.exclude ?? []).map(path => path.replace(/^\/app\//, ''))
      for (const included of layer.include) {
        assert.ok(included.startsWith('/app/'))
        const relative = included.slice('/app/'.length)
        await cp(join(source, relative), join(runtime, relative), {
          recursive: true,
          filter(path) {
            const normalized = path.replaceAll('\\', '/')
            const base = source.replaceAll('\\', '/') + '/'
            const name = normalized.slice(base.length)
            if (excludes.some(excluded => name === excluded || name.startsWith(excluded + '/'))) return false
            if (Object.hasOwn(fixtures, name)) copies.set(name, (copies.get(name) ?? 0) + 1)
            return true
          },
        })
      }
    }
    for (const path of Object.keys(fixtures)) {
      assert.equal(copies.get(path) ?? 0, path.startsWith('dist/') ? 1 : 0, path)
    }

    const { createWebServer } = await import(pathToFileURL(join(runtime, 'scripts/serve-web.mjs')))
    server = createWebServer({ dist: join(runtime, 'dist') })
    await once(server.listen(0, '127.0.0.1'), 'listening')
    const base = `http://127.0.0.1:${server.address().port}`
    assert.equal((await fetch(base + '/healthz')).status, 200)
    assert.equal(await (await fetch(base + '/dashboard')).text(), fixtures['dist/index.html'])
    for (const path of ['assets/index-release.js', 'media/intro.webm', 'sat/diagram.svg']) {
      assert.equal(await (await fetch(base + '/' + path)).text(), fixtures['dist/' + path])
    }
    const audio = await fetch(base + '/audio/listening.mp3', { headers: { Range: 'bytes=2-5' } })
    assert.equal(audio.status, 206)
    assert.equal(audio.headers.get('content-range'), 'bytes 2-5/10')
    assert.equal(await audio.text(), '2345')
  } finally {
    if (server) await new Promise(resolve => { server.close(resolve); server.closeAllConnections() })
    await rm(workspace, { recursive: true, force: true })
  }
})
