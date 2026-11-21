import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { mkdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { build } from 'esbuild'
import postcss from 'postcss'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

let chromium
try { ({ chromium } = createRequire(import.meta.url)('playwright')) }
catch { ({ chromium } = createRequire('C:/Users/User/.codex/skill-tools/node/package.json')('playwright')) }
const fixture = await build({ stdin: { resolveDir: process.cwd(), loader: 'tsx', contents: `
import React,{useState} from 'react';import{createRoot}from'react-dom/client';import'./src/i18n';
import i18n from'./src/i18n';import{useAuthStore}from'./src/store/authStore';
import{apiClient}from'./src/lib/apiClient';
import NovaMemoryCard from'./src/components/ai/NovaMemoryCard';import NovaLearningNotes from'./src/components/ai/NovaLearningNotes';import CoachMascot from'./src/components/ai/CoachMascot';
i18n.changeLanguage('uz');useAuthStore.setState({user:{id:'fixture',role:'USER'},accessToken:'fixture'});
apiClient.get=async()=>({items:[{topicKey:'fractions',topic:'Adding fractions',status:'developing',evidenceCount:1,independentAttempts:0,lastPractice:{quote:'After a hint: 1/2.',assistance:'hinted',observedAt:'2026-11-21'},nextExercise:'1/3 + 1/6'}]});
function Fixture(){const[memory,setMemory]=useState({id:'m',key:'address_preference',value:'Use sen',revision:1,origin:'user',createdAt:'2026-11-21',updatedAt:'2026-11-21'});const[practice,setPractice]=useState('');return <main className="mx-auto max-w-4xl p-4 sm:p-8"><h1 className="text-xl font-bold">Nova</h1><div className="grid grid-cols-3 gap-2 my-4">{['ready','reconnecting','error'].map(activity=><div className="text-center" key={activity}><CoachMascot size={100} activity={activity as any}/><span className="text-xs">{activity}</span></div>)}</div><div className="max-w-md mx-auto"><NovaMemoryCard memory={memory} onSave={async(_id,value,revision)=>{if(value==='Use sen')throw Error('Conflict');setMemory({...memory,value,revision:revision+1})}} onDelete={async()=>{throw Error('Offline')}}/><NovaLearningNotes userId="fixture" onPractice={setPractice}/><p data-practice>{practice}</p></div></main>};createRoot(document.getElementById('root')!).render(<Fixture/>);
` }, bundle: true, write: false, outdir: 'fixture', format: 'iife', tsconfig: 'tsconfig.json', define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"production"' } })
const js = fixture.outputFiles.find(file => file.path.endsWith('.js')).contents
const utilities = await postcss([tailwindcss({ content: ['./src/components/ai/NovaMemoryCard.tsx', './src/components/ai/NovaLearningNotes.tsx', { raw: 'mx-auto max-w-4xl p-4 sm:p-8 text-xl font-bold grid grid-cols-3 gap-2 my-4 text-center text-xs max-w-md', extension: 'html' }] }), autoprefixer]).process(await readFile('src/index.css', 'utf8'), { from: 'src/index.css' })
const css = utilities.css + (fixture.outputFiles.find(file => file.path.endsWith('.css'))?.text ?? '')
const server = createServer((req, res) => {
  if (req.url === '/fixture.js') { res.setHeader('Content-Type', 'text/javascript'); res.end(js); return }
  if (req.url === '/styles.css') { res.setHeader('Content-Type', 'text/css'); res.end(css); return }
  if (req.url === '/api/v1/ai-workspace/skills') {
    res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ items: [{ topicKey: 'fractions', topic: 'Kasrlarni qo‘shish', status: 'developing', evidenceCount: 1, independentAttempts: 0, lastPractice: { quote: 'Ishoradan keyin 1/2 topdim.', assistance: 'hinted', observedAt: '2026-11-21' }, nextExercise: '1/3 + 1/6 ni mustaqil hisoblang.' }] })); return
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end('<!doctype html><html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/styles.css"><div id="root"></div><script src="/fixture.js"></script></html>')
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
let browser
try {
  browser = await chromium.launch({ headless: true, ...(process.platform === 'win32' ? { channel: 'msedge' } : {}) })
  const page = await browser.newPage({ viewport: { width: 1000, height: 850 }, reducedMotion: 'reduce' })
  const errors = []; page.on('pageerror', error => errors.push(error.message)); page.on('dialog', dialog => dialog.accept())
  await page.goto(`http://127.0.0.1:${server.address().port}`)
  await page.getByText('Adding fractions', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'Tahrirlash' }).click(); await page.getByRole('button', { name: 'Saqlash', exact: true }).click()
  await page.getByRole('alert').waitFor(); assert.equal(await page.locator('textarea').count(), 1)
  await page.getByRole('textbox').fill('Use siz'); await page.getByRole('button', { name: 'Saqlash', exact: true }).click()
  await page.getByText('Use siz', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'Keyingi mashqni bajarish' }).click()
  assert.equal(await page.locator('[data-practice]').textContent(), '1/3 + 1/6')
  await page.getByRole('button', { name: 'O‘chirish', exact: true }).click(); await page.getByRole('alert').waitFor()
  assert.equal(await page.getByText('Use siz', { exact: true }).count(), 1, 'Failed delete retains the record')
  const directory = resolve('outputs/nova-v2'); await mkdir(directory, { recursive: true })
  await page.screenshot({ path: resolve(directory, 'memory-desktop.png'), fullPage: true })
  await page.setViewportSize({ width: 360, height: 800 }); await page.screenshot({ path: resolve(directory, 'memory-mobile.png'), fullPage: true })
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Memory and notes fit a small phone')
  assert.equal(await page.locator('[data-activity="reconnecting"][data-expression="thinking"]').count(), 1)
  assert.equal(await page.locator('[data-activity="error"][data-expression="focused"]').count(), 1)
  assert.deepEqual(errors, [])
  console.log('PASS: real browser memory edit/conflict/delete recovery, next exercise, reconnect/error avatar states and 360px layout')
} finally { await browser?.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)) }
