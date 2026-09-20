import { build } from 'esbuild'
import { createRequire } from 'node:module'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const directory = await mkdtemp(join(tmpdir(), 'profai-sat-result-sync-'))
try {
  const values = new Map()
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
  }
  globalThis.window = { localStorage }
  const outfile = join(directory, 'suite.cjs')
  await build({
    entryPoints: ['scripts/tests/sat-result-sync.ts'], bundle: true, platform: 'node', format: 'cjs',
    outfile, tsconfig: 'tsconfig.json', define: { 'import.meta.env': '{}' }, external: ['node:assert/strict'],
  })
  await createRequire(import.meta.url)(outfile).run()
} finally {
  await rm(directory, { recursive: true, force: true })
}
