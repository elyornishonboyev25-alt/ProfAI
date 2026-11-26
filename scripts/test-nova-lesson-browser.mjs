import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { readFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { build } from 'esbuild'
import postcss from 'postcss'
import tailwindcss from 'tailwindcss'
let chromium
try { ({ chromium } = createRequire(import.meta.url)('playwright')) } catch { ({ chromium } = createRequire('C:/Users/User/.codex/skill-tools/node/package.json')('playwright')) }
const lesson = { version: 1, id: 'square', language: 'uz', title: 'Kvadrat funksiya: qiymatdan grafikkacha', blocks: [
  { id: 'rule', type: 'formula', title: 'Qoida va belgilar', latex: 'y=x^2,\\quad x\\in[-2,2]', explanation: 'Har bir x qiymatini o‘ziga ko‘paytiramiz.', narration: 'Bu formula bilan y qiymatini topamiz.', symbols: [{ symbol: 'x', meaning: 'Kirish qiymati' }, { symbol: 'y', meaning: 'Natija' }] },
  { id: 'example', type: 'worked_example', title: 'Birga hisoblaymiz', problem: 'x = 2 bo‘lganda y ni topamiz.', steps: [{ id: 'one', text: 'Formuladagi x o‘rniga 2 yozamiz.', latex: 'y=2^2' }, { id: 'two', text: 'Ikkini o‘ziga ko‘paytiramiz.', latex: 'y=2\\cdot2=4' }] },
  { id: 'graph', type: 'graph', title: 'Koordinatalarda ko‘ramiz', xLabel: 'x', yLabel: 'y', domain: [-2, 2], coefficients: [0, 0, 1], points: [{ x: 1, y: 1, label: '(1; 1)' }], caption: 'Bu grafikda har bir nuqta formula bilan mos keladi.' },
  { id: 'exercise', type: 'exercise', title: 'Endi siz', prompt: 'x = −2 bo‘lsa, y ni mustaqil toping.', hint: 'Manfiy sonning kvadrati musbat.' },
] }
const pcm = Buffer.alloc(16044); pcm.write('RIFF'); pcm.writeUInt32LE(16036, 4); pcm.write('WAVEfmt ', 8); pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(1, 22); pcm.writeUInt32LE(8000, 24); pcm.writeUInt32LE(16000, 28); pcm.writeUInt16LE(2, 32); pcm.writeUInt16LE(16, 34); pcm.write('data', 36); pcm.writeUInt32LE(16000, 40)
const fixture = await build({ stdin: { resolveDir: process.cwd(), loader: 'tsx', contents: `
import React,{useState} from 'react';import{createRoot}from'react-dom/client';import NovaLessonBoard from './src/components/ai/NovaLessonBoard';import CoachMascot from './src/components/ai/CoachMascot';import{usePushToTalk}from'./src/components/ai/usePushToTalk';import{apiClient}from'./src/lib/apiClient';
window.requests=0;window.starts=0;window.ends=0;window.lastAttempt='';apiClient.post=async()=>{window.requests++;return{audioBase64:${JSON.stringify(pcm.toString('base64'))},mimeType:'audio/wav'}};
function Fixture(){const[state,setState]=useState('idle');const[block,setBlock]=useState('');const ptt=usePushToTalk(true,()=>{window.starts++;window.dispatchEvent(new Event('nova:interrupt'));setState('listening')},()=>{window.ends++});return <main><header><CoachMascot size={72} state={state as any}/><div><b>Nova</b><p>{state}</p></div></header><NovaLessonBoard lesson={${JSON.stringify(lesson)}} onProgress={p=>setBlock(p.activeBlockId??'')} onPlayback={s=>setState(s==='speaking'?'speaking':s==='loading'?'thinking':'idle')} onAttempt={text=>{window.lastAttempt=text}}/><footer>Space · Hold to speak <span data-held>{String(ptt.held)}</span><span data-block>{block}</span></footer></main>};createRoot(document.getElementById('root')!).render(<Fixture/>);
` }, bundle: true, write: false, outdir: 'fixture', format: 'iife', tsconfig: 'tsconfig.json', loader: { '.woff2': 'dataurl', '.woff': 'dataurl', '.ttf': 'dataurl' }, define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"production"' } })
const js = fixture.outputFiles.find(file => file.path.endsWith('.js')).contents
const css = fixture.outputFiles.find(file => file.path.endsWith('.css'))?.text ?? ''
const server = createServer((req, res) => { res.setHeader('Content-Type', req.url === '/fixture.js' ? 'text/javascript' : 'text/html; charset=utf-8'); res.end(req.url === '/fixture.js' ? js : `<!doctype html><html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}*{box-sizing:border-box}body{margin:0;background:#101520;font:15px system-ui;color:#fff}main{max-width:850px;margin:auto;padding:20px}header{display:flex;align-items:center;gap:12px}header p{font-size:12px;color:#9da9b9}footer{padding:20px;text-align:center}button{cursor:pointer}</style><div id="root"></div><script src="/fixture.js"></script></html>`) })
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
let browser
try {
  browser = await chromium.launch({ headless: true, ...(process.platform === 'win32' ? { channel: 'msedge' } : {}) })
  const page = await browser.newPage({ viewport: { width: 1100, height: 900 }, reducedMotion: 'reduce' })
  const errors = []; page.on('pageerror', error => errors.push(error.message))
  await page.goto(`http://127.0.0.1:${server.address().port}`)
  await page.locator('.katex').first().waitFor(); assert.equal(await page.evaluate(() => window.requests), 0)
  assert.equal(await page.locator('.nova-graph polyline').count(), 1)
  await page.getByRole('button', { name: 'Keyingi qadam', exact: true }).click(); await page.getByText('Ikkini o‘ziga ko‘paytiramiz.', { exact: true }).waitFor()
  await page.getByRole('textbox').fill('4'); await page.getByRole('button', { name: 'Nova tekshirsin' }).click(); assert.ok((await page.evaluate(() => window.lastAttempt)).includes('4'))
  await page.getByRole('button', { name: 'Boshidan', exact: true }).click(); await page.waitForFunction(() => window.requests > 0)
  await page.locator('.nova-lesson-block[data-speaking=true]').waitFor()
  await page.evaluate(() => document.activeElement?.blur()); await page.keyboard.down('Space'); await page.keyboard.down('Space')
  assert.equal(await page.evaluate(() => window.starts), 1); await page.locator('.nova-lesson [data-speaking=true]').waitFor({ state: 'detached' }); assert.equal(await page.locator('[data-speaking=true],[data-active-step=true]').count(), 0, 'Interruption clears the narration highlight'); await page.keyboard.up('Space'); assert.equal(await page.evaluate(() => window.ends), 1)
  const requestsAfterStop = await page.evaluate(() => window.requests); await page.waitForTimeout(1200); assert.equal(await page.evaluate(() => window.requests), requestsAfterStop, 'Interruption cancels automatic next-block narration')
  await mkdir('outputs/nova-v3', { recursive: true }); await page.screenshot({ path: resolve('outputs/nova-v3/lesson-desktop.png'), fullPage: true })
  await page.setViewportSize({ width: 360, height: 800 }); await page.screenshot({ path: resolve('outputs/nova-v3/lesson-mobile.png'), fullPage: true })
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Formula and graph fit a small phone')
  assert.deepEqual(errors, []); console.log('PASS: real browser formula, graph, step reveal, exercise input, held-Space cancellation, no autoplay and 360px lesson layout (synthetic audio)')
} finally { await browser?.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)) }
