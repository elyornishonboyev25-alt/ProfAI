import { build } from 'esbuild'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { resolve, sep } from 'node:path'
import postcss from 'postcss'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

const port = Number(process.argv[process.argv.indexOf('--port') + 1]) || 5195
const bundle = await build({ entryPoints: ['scripts/tests/exam-flow-fixture.tsx'], bundle: true, platform: 'browser', format: 'esm', outfile: 'fixture.js', write: false,
  tsconfig: 'tsconfig.json', define: { 'import.meta.env': '{}' }, loader: { '.jpg': 'dataurl', '.png': 'dataurl' },
  plugins: [{ name: 'fixture-tailwind', setup(builder) {
    builder.onLoad({ filter: /\.css$/ }, async args => {
      const raw = await readFile(args.path, 'utf8')
      const contents = /@tailwind|@apply/.test(raw) ? (await postcss([tailwindcss({ config: 'tailwind.config.js' }), autoprefixer]).process(raw, { from: args.path })).css : raw
      return { contents, loader: 'css', resolveDir: resolve(args.path, '..') }
    })
  } }],
})
const publicRoot = resolve('public')
const css = bundle.outputFiles.find(file => file.path.endsWith('.css'))?.text ?? ''
createServer(async (req, res) => {
  if (req.url === '/fixture.js' || req.url === '/fixture.css') {
    const extension = req.url.endsWith('.css') ? '.css' : '.js'
    res.setHeader('Content-Type', extension === '.css' ? 'text/css' : 'text/javascript')
    res.end(extension === '.css' ? css : bundle.outputFiles.find(file => file.path.endsWith(extension))?.text ?? '')
    return
  }
  if (/\.(png|svg|webp|jpg|woff2?)(\?|$)/.test(req.url)) {
    const file = resolve(publicRoot, '.' + new URL(req.url, 'http://localhost').pathname)
    if (!file.startsWith(publicRoot + sep)) { res.writeHead(404).end(); return }
    try { res.setHeader('Content-Type', file.endsWith('.svg') ? 'image/svg+xml' : file.endsWith('.png') ? 'image/png' : 'application/octet-stream'); res.end(await readFile(file)) } catch { res.writeHead(404).end() }
    return
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.end('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>')
}).listen(port, '127.0.0.1', () => console.log(`Exam flow fixture: http://127.0.0.1:${port}`))
