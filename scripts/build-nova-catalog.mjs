import { mkdir, writeFile, rm } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { resolve, dirname } from 'node:path'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
// API-only CI/deploys install backend dependencies without a frontend node_modules.
const { build } = createRequire(resolve(root, 'backend/package.json'))('esbuild')
const out = resolve(root, 'backend/dist/data')
await mkdir(out, { recursive: true })
const bundle = resolve(out, 'nova-catalog-build.cjs')
try {
  await build({ absWorkingDir: root, entryPoints: ['scripts/lib/novaCatalogSource.ts'], outfile: bundle, bundle: true, platform: 'node', format: 'cjs', tsconfig: 'tsconfig.json', loader: { '.png': 'dataurl', '.jpg': 'dataurl', '.svg': 'dataurl' }, define: { 'import.meta.env': '{}' }, plugins: [{ name: 'catalog-without-account-state', setup(builder) {
    builder.onResolve({ filter: /(?:^|\/)accountStorage$/ }, () => ({ path: 'accountStorage', namespace: 'nova-build' }))
    builder.onLoad({ filter: /.*/, namespace: 'nova-build' }, () => ({ contents: 'export const accountStorageFor=()=>({getItem:()=>null,setItem:()=>{},removeItem:()=>{}});export const accountStorage=accountStorageFor();', loader: 'js' }))
  } }] })
  const tests = createRequire(import.meta.url)(bundle).buildNovaCatalog()
  if (!tests.length || tests.some(test => !test.id || !test.questions.length)) throw new Error('Empty or invalid Nova source catalog')
  await writeFile(resolve(out, 'nova-catalog.json'), JSON.stringify({ version: 1, tests }))
  console.log(`Nova: ${tests.length} catalog entries built from repository sources`)
} finally { await rm(bundle, { force: true }) }
