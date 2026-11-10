import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { mkdir, readFile } from 'node:fs/promises'
import { build } from 'esbuild'
import postcss from 'postcss'
import tailwindcss from 'tailwindcss'

const require = createRequire(import.meta.url)
let chromium
try { ({ chromium } = require('playwright')) }
catch { ({ chromium } = createRequire(process.env.ASSESSMENT_PLAYWRIGHT_PACKAGE || 'C:/Users/User/.codex/skill-tools/node/package.json')('playwright')) }
const source = `
import React from 'react'; import {createRoot} from 'react-dom/client'; import {MemoryRouter,useLocation} from 'react-router-dom';
import i18n from './src/i18n'; import Announcement from './src/features/productRelease/NovaReleaseAnnouncement';
import {useAuthStore} from './src/store/authStore'; import {useAiAssistantStore} from './src/store/aiAssistantStore';
const root=createRoot(document.getElementById('root'));
function Fixture(){const location=useLocation();return <><main style={{minHeight:'100vh',padding:40,background:'linear-gradient(130deg,#f5f6fa,#e0e5ee)',color:'#293142'}}><h1 style={{fontSize:26,fontWeight:750}}>Welcome back</h1><p style={{marginTop:12}}>Your next step starts here.</p><div style={{display:'flex',flexWrap:'wrap',gap:20,marginTop:40}}>{['IELTS','SAT','English'].map(name=><div key={name} style={{background:'#ffffffb0',padding:40,borderRadius:24,width:250}}>{name}</div>)}</div><output data-path>{location.pathname}</output></main><Announcement enabled={true}/></>}
window.setLearner=(owner)=>useAuthStore.setState({user:owner?{id:owner,fullName:'Learner',email:owner+'@example.invalid',role:'USER'}:null,accessToken:owner?'fixture-'+owner:null,refreshToken:null,hydrated:true});
window.setVoice=(active)=>useAiAssistantStore.setState({talkOpen:active});
window.setExam=(active)=>useAiAssistantStore.setState({isExamModeActive:active});
window.setLearner('existing');i18n.changeLanguage('uz').then(()=>root.render(<MemoryRouter><Fixture/></MemoryRouter>));
`
const bundle = await build({ stdin: { contents: source, loader: 'tsx', resolveDir: process.cwd() }, bundle: true, write: false, outfile: 'tmp/nova-release-fixture.js', format: 'iife', tsconfig: 'tsconfig.json', define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"production"' }, loader: { '.jpg': 'dataurl', '.png': 'dataurl' } })
const css = (await postcss([tailwindcss()]).process(await readFile('src/index.css', 'utf8'), { from: 'src/index.css' })).css + bundle.outputFiles.filter(file => file.path.endsWith('.css')).map(file => file.text).join('\n')
const server = createServer((req, res) => {
  res.setHeader('Content-Type', (req.url === '/fixture.js' ? 'application/javascript' : req.url === '/fixture.css' ? 'text/css' : 'text/html') + '; charset=utf-8')
  res.end(req.url === '/fixture.js' ? bundle.outputFiles.find(file => file.path.endsWith('.js')).text : req.url === '/fixture.css' ? css : '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>')
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
let browser
try {
  browser = await chromium.launch({ ...(process.platform === 'win32' ? { channel: 'msedge' } : {}), headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
  const page = await context.newPage()
  const errors = [], seen = new Set(), requests = []
  page.on('pageerror', error => errors.push(error.message))
  let rejectReceipt = false, rejectedReceipts = 0
  await page.route('**/api/v1/releases/nova-studio**', async route => {
    const request = route.request(), owner = request.headers().authorization?.replace('Bearer fixture-', '')
    requests.push({ owner, method: request.method() })
    if (request.method() === 'POST') {
      if (rejectReceipt) { rejectedReceipts++; return route.fulfill({ status: 503, json: { message: 'Fixture offline' } }) }
      seen.add(owner); return route.fulfill({ json: { recorded: true } })
    }
    await route.fulfill({ json: { releaseId: 'nova-studio-2026-11', eligible: owner !== 'new' && !seen.has(owner) } })
  })
  const url = `http://127.0.0.1:${server.address().port}`
  await page.goto(url)
  const dialog = page.getByRole('dialog')
  await dialog.waitFor()
  assert.equal(await dialog.getByRole('img').count(), 1, 'One illustration')
  assert.equal(await dialog.locator('h2').count(), 1, 'One short sentence')
  await page.getByRole('button', { name: 'Novani sinab ko‘rish' }).waitFor()
  await page.waitForFunction(() => document.activeElement?.textContent?.includes('Novani'))
  await mkdir('artifacts/assessment-studio', { recursive: true })
  await page.screenshot({ path: 'artifacts/assessment-studio/nova-announcement-desktop.png', fullPage: true })
  await page.keyboard.press('Tab')
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')), 'E’lonni yopish')
  await page.keyboard.press('Tab')
  assert.ok(await page.evaluate(() => document.activeElement?.textContent?.includes('Novani')))
  await page.keyboard.press('Escape')
  await dialog.waitFor({ state: 'hidden' })
  await page.reload(); await page.waitForTimeout(2100)
  assert.equal(await dialog.count(), 0, 'A reload does not repeat the announcement')
  await page.evaluate(() => { localStorage.removeItem('ivygoo:nova-studio-2026-11:existing:shown') })
  await page.reload(); await page.waitForTimeout(2100)
  assert.equal(await dialog.count(), 0, 'The server receipt suppresses it on a fresh browser too')
  await page.evaluate(() => window.setLearner('new')); await page.waitForTimeout(2100)
  assert.equal(await dialog.count(), 0, 'New registrations receive no old-user announcement')
  await page.evaluate(() => window.setLearner(null)); await page.waitForTimeout(200)
  const guestRequests = requests.length
  await page.waitForTimeout(2100)
  assert.equal(requests.length, guestRequests, 'Guests never request an announcement')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.evaluate(() => { window.setVoice(true); window.setLearner('mobile-existing') })
  await page.waitForTimeout(2100)
  assert.equal(await dialog.count(), 0, 'Voice sessions are never interrupted')
  await page.evaluate(() => { window.setVoice(false); window.setExam(true) })
  await page.waitForTimeout(2100)
  assert.equal(await dialog.count(), 0, 'Exams are never interrupted')
  await page.evaluate(() => window.setExam(false))
  await dialog.waitFor()
  const bounds = await dialog.boundingBox()
  assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 390 && bounds.height <= 844, 'Mobile dialog stays within the viewport')
  await page.screenshot({ path: 'artifacts/assessment-studio/nova-announcement-mobile.png', fullPage: true })
  await page.getByRole('button', { name: 'Novani sinab ko‘rish' }).click()
  assert.equal(await page.locator('[data-path]').textContent(), '/ai-tutor')
  await dialog.waitFor({ state: 'hidden' })
  // A dialog hidden by starting voice must not reappear when voice ends.
  await page.evaluate(() => window.setLearner('interrupted-existing'))
  await dialog.waitFor()
  await page.evaluate(() => window.setVoice(true)); await dialog.waitFor({ state: 'hidden' })
  await page.evaluate(() => window.setVoice(false)); await page.waitForTimeout(2100)
  assert.equal(await dialog.count(), 0)
  rejectReceipt = true
  const receiptRejected = page.waitForResponse(response => response.url().endsWith('/nova-studio/shown') && response.status() === 503)
  await page.evaluate(() => window.setLearner('offline-receipt'))
  await dialog.waitFor()
  await receiptRejected
  assert.equal(rejectedReceipts, 1)
  await page.keyboard.press('Escape')
  rejectReceipt = false
  await page.evaluate(() => window.dispatchEvent(new Event('online')))
  await page.waitForFunction(() => localStorage.getItem('ivygoo:nova-studio-2026-11:offline-receipt:shown') === 'saved')
  assert.ok(seen.has('offline-receipt'), 'A failed impression receipt is retried when the connection returns')
  assert.deepEqual(errors, [])
  console.log('PASS: existing-account audience, once-only cross-device receipt, guest/new exclusions, voice/exam deferral, keyboard focus, mobile layout, CTA and offline receipt recovery (fixture API)')
} finally { await browser?.close(); await new Promise(resolve => server.close(resolve)) }
