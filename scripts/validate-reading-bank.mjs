import { build } from 'esbuild'
const result = await build({
  entryPoints: ['scripts/tests/reading-bank.ts'], bundle: true, platform: 'node', format: 'esm', write: false,
  tsconfig: 'tsconfig.json', loader: { '.png': 'dataurl', '.jpg': 'dataurl' },
})
const suite = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'))
suite.run()
