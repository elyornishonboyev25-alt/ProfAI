import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { build } from 'esbuild'

const require = createRequire(import.meta.url)
let chromium
try { ({ chromium } = require('playwright')) }
catch { ({ chromium } = createRequire('C:/Users/User/.codex/skill-tools/node/package.json')('playwright')) }
const result = await build({ stdin: { resolveDir: process.cwd(), loader: 'tsx', contents: `
import React from 'react'; import {createRoot} from 'react-dom/client';
import CoachMascot from './src/components/ai/CoachMascot'; import {novaExpressions} from './src/lib/novaPersona';
createRoot(document.getElementById('root')!).render(<main>{novaExpressions.map(expression=><article key={expression}><CoachMascot expression={expression} size={165}/><p>{expression}</p></article>)}</main>);
` }, bundle: true, write: false, outdir: 'fixture', format: 'iife', tsconfig: 'tsconfig.json', define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"production"' } })
const js = result.outputFiles.find(file => file.path.endsWith('.js')).text
const css = result.outputFiles.find(file => file.path.endsWith('.css'))?.text ?? ''
const server = createServer((req, res) => {
  res.setHeader('Content-Type', req.url === '/fixture.js' ? 'text/javascript' : 'text/html; charset=utf-8')
  res.end(req.url === '/fixture.js' ? js : `<!doctype html><html><meta charset="utf-8"><title>Nova vector expressions</title><style>${css}body{margin:0;background:#eef0f4;font:15px system-ui;color:#343644}main{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;padding:24px}article{text-align:center;background:white;border-radius:18px;padding:12px}p{margin:0 0 6px}</style><div id="root"></div><script src="/fixture.js"></script></html>`)
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
let browser
try {
  browser = await chromium.launch({ headless: true, ...(process.platform === 'win32' ? { channel: 'msedge' } : {}) })
  const page = await browser.newPage({ viewport: { width: 1000, height: 800 }, reducedMotion: 'reduce' })
  const errors = []; page.on('pageerror', error => errors.push(error.message))
  await page.goto(`http://127.0.0.1:${server.address().port}`, { waitUntil: 'networkidle' })
  assert.equal(await page.locator('[data-expression]').count(), 12)
  assert.equal(await page.locator('[data-reduced-motion="true"]').count(), 12)
  const before = await page.locator('[data-expression="curious"] .nova-eyes').evaluate(element => element.getAttribute('style'))
  await page.locator('[data-expression="curious"]').hover({ position: { x: 10, y: 10 } })
  const after = await page.locator('[data-expression="curious"] .nova-eyes').evaluate(element => element.getAttribute('style'))
  assert.equal(after, before, 'Reduced motion disables pointer tracking')
  const screenshot = resolve('outputs/nova-avatar-expressions.png')
  await mkdir(resolve('outputs'), { recursive: true })
  await page.screenshot({ path: screenshot, fullPage: true })
  assert.deepEqual(errors, [])
  console.log(`PASS: 12 inline SVG expressions, reduced motion, browser rendering. Screenshot: ${screenshot}`)
} finally {
  await browser?.close()
  server.closeAllConnections(); await new Promise(resolve => server.close(resolve))
}
