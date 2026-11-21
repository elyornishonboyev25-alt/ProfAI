import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { mkdir, readFile } from 'node:fs/promises'
import { build } from 'esbuild'
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'postgresql://fixture:fixture@127.0.0.1:1/nova_browser_fixture'
process.env.ACCESS_TOKEN_SECRET = 'nova-browser-fixture-access-secret'
process.env.REFRESH_TOKEN_SECRET = 'nova-browser-fixture-refresh-secret'
for (const key of ['GEMINI_API_KEY', 'GEMINI_API_KEY_2', 'GEMINI_API_KEY_3', 'GEMINI_API_KEY_4', 'GEMINI_API_KEY_5', 'OPENAI_API_KEY', 'HF_ACCESS_TOKEN']) process.env[key] = ''
const { prisma } = await import('../backend/dist/lib/prisma.js')
const { app } = await import('../backend/dist/app.js')
const { env } = await import('../backend/dist/config/env.js')
const { fixtureAccessToken, installSessionFixtures } = await import('../backend/scripts/helpers/authSessions.mjs')
const { novaCatalog } = await import('../backend/dist/services/novaStudy.service.js')
const { runNovaTool } = await import('../backend/dist/services/novaTools.service.js')
const { writingVersion } = await import('../backend/dist/services/novaStudy.js')
installSessionFixtures(prisma)
prisma.user.findUnique = async ({ where }) => ({ id: where.id, role: 'USER' })
prisma.user.findUniqueOrThrow = async () => ({ role: 'ADMIN', email: 'fixture@example.invalid', nickname: null })
prisma.premiumGrant.findUnique = async () => null
prisma.billingSubscription.findMany = async () => []
prisma.freeTrial.findUnique = async () => null
prisma.voiceAllowanceSession.findMany = async () => []
prisma.$transaction = async operation => operation({ $queryRaw: async () => [], authSession: prisma.authSession })
const owner = 'nova-browser-learner', token = fixtureAccessToken({ sub: owner, role: 'USER' })
const catalog = await novaCatalog(), listening = catalog.find(t => t.skill === 'listening' && t.questions.some(q => q.audioUrl)), speaking = catalog.find(t => t.skill === 'speaking'), sat = catalog.find(t => t.skill === 'sat-math')
assert.ok(listening && speaking && sat)
const question = listening.questions.find(q => q.audioUrl)
const entry = { attemptKey: 'browser-owned-attempt', savedAt: '2026-11-20T08:00:00Z', testId: listening.id, testTitle: listening.title, isPartial: false, resultPayload: { testId: listening.id, date: '2026-11-20T08:00:00Z', answers: { [question.id]: 'my original answer' } } }
let activeExam = false
prisma.accountLearningData.findMany = async ({ where }) => where.userId === owner ? [{ key: `smarttest-reading-analysis-history-v1:${owner}`, value: JSON.stringify([entry]) }, ...(activeExam ? [{ key: 'ielts_test_session_fixture', value: JSON.stringify({ isTestActive: true, testMode: 'simulation' }) }] : [])] : []
const text = '😊 O‘zbekcha: I has a plan.', start = text.indexOf('has')
const annotations = [{ id: 'agreement', version: writingVersion(text), start, end: start + 3, quote: 'has', kind: 'grammar', message: 'Check the verb with I.', hint: 'Try have.' }]
const fixture = await build({ stdin: { resolveDir: process.cwd(), loader: 'tsx', contents: `
import React,{useRef,useState}from'react';import{createRoot}from'react-dom/client';import{MemoryRouter,useLocation,useNavigate}from'react-router-dom';import i18n from'./src/i18n';
import NovaStudyDock from'./src/components/ai/NovaStudyDock';import NovaLessonBoard from'./src/components/ai/NovaLessonBoard';import NovaAnnotatedEditor from'./src/components/ai/NovaAnnotatedEditor';
import{apiClient}from'./src/lib/apiClient';import{useAuthStore}from'./src/store/authStore';import{useAiAssistantStore}from'./src/store/aiAssistantStore';import{accountStorageFor}from'./src/utils/accountStorage';
import{receiveNovaToolResults,openNovaStudy,currentNovaStudy}from'./src/services/ai/novaStudySession';import{getAllSavedWords}from'./src/utils/myVocabularyStore';import{usePushToTalk}from'./src/components/ai/usePushToTalk';
const owner=${JSON.stringify(owner)};useAuthStore.setState({user:{id:owner,role:'USER',fullName:'Fixture'},accessToken:${JSON.stringify(token)},refreshToken:null,hydrated:true});useAiAssistantStore.setState({threadsLoaded:{['user:'+owner]:true}});accountStorageFor(owner).setItem('smarttest-reading-analysis-history-v1:'+owner,JSON.stringify([${JSON.stringify(entry)}]));
const get=apiClient.get,post=apiClient.post;apiClient.get=async(path,options)=>path.startsWith('/ai/assistant/study/')?get(path,options):path==='/ai-workspace/threads'?{items:[]}:path==='/ai-workspace/memories'?{items:[]}:{};apiClient.post=async(path,body,options)=>path.startsWith('/ai/assistant/study/')?post(path,body,options):{};
function Fixture(){const location=useLocation(),navigate=useNavigate(),[value,setValue]=useState(${JSON.stringify(text)}),ref=useRef(null);const ptt=usePushToTalk(false,()=>{window.dispatchEvent(new Event('nova:interrupt'));window.pttStarts=(window.pttStarts||0)+1},()=>{});window.applyResults=results=>receiveNovaToolResults(results,navigate);window.words=()=>getAllSavedWords();window.study=()=>currentNovaStudy();window.annotate=()=>window.dispatchEvent(new CustomEvent('nova:writing-annotations',{detail:{text:${JSON.stringify(text)},anchors:${JSON.stringify(annotations)}}}));window.setExam=value=>useAiAssistantStore.setState({isExamModeActive:value});return <><main><h1>IELTS source question</h1><p data-source-question>${question.text.replaceAll('<','&lt;')}</p><output data-path>{location.pathname}</output><div className="ielts-writing-workspace writing-desk"><div className="writing-response-pane"><NovaAnnotatedEditor id="student-writing" value={value} onChange={setValue} textareaRef={ref} placeholder="Your writing" describedBy="writing-description" fontSize={16}/></div></div><p id="writing-description">Your saved paragraph</p><button onClick={()=>navigate('/admission/universities')}>Go to universities</button><span data-held>{String(ptt.held)}</span></main><NovaStudyDock/></>};i18n.changeLanguage('uz').then(()=>createRoot(document.getElementById('root')).render(<MemoryRouter initialEntries={['/dashboard']}><Fixture/></MemoryRouter>));
` }, bundle: true, write: false, outdir: 'fixture', format: 'iife', tsconfig: 'tsconfig.json', define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"production"' }, loader: { '.png': 'dataurl', '.jpg': 'dataurl', '.woff2': 'dataurl', '.woff': 'dataurl', '.ttf': 'dataurl' } })
const js = fixture.outputFiles.find(f => f.path.endsWith('.js')).contents, css = fixture.outputFiles.find(f => f.path.endsWith('.css'))?.text ?? ''
const server = createServer(async (req, res) => {
  if (req.url === '/fixture.js') { res.setHeader('Content-Type', 'text/javascript'); res.end(js); return }
  if (req.url?.startsWith('/audio/')) {
    try { const path = new URL(req.url, 'http://fixture').pathname; const data = await readFile(new URL(`../public${path}`, import.meta.url)); res.setHeader('Content-Type','audio/mpeg'); res.setHeader('Accept-Ranges','bytes'); res.end(data) } catch { res.statusCode=404;res.end() };return
  }
  if (req.url?.startsWith('/api/')) { app(req,res);return }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');res.end(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}*{box-sizing:border-box}body{margin:0;background:#eef2f6;color:#233146;font:15px Arial,sans-serif}main{padding:32px;max-width:1000px}.writing-response-pane{height:240px;display:flex;flex-direction:column}button,select{cursor:pointer}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}</style></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>`)
})
await new Promise(resolve => server.listen(0,'127.0.0.1',resolve))
env.CORS_ORIGIN = `http://127.0.0.1:${server.address().port}`
const { chromium } = createRequire('C:/Users/User/.codex/skill-tools/node/package.json')('playwright')
let browser
try {
  browser = await chromium.launch({ headless:true,...(process.platform==='win32'?{channel:'msedge'}:{}) })
  const page = await browser.newPage({viewport:{width:1366,height:900},reducedMotion:'reduce'}), errors=[]
  page.on('pageerror',error=>errors.push(error.message))
  page.setDefaultTimeout(12000)
  await page.goto(`http://127.0.0.1:${server.address().port}`)
  await page.getByRole('button',{name:'Nova',exact:true}).click()
  const selects=page.locator('.nova-study-scroll>label>select')
  await selects.nth(1).selectOption('browser-owned-attempt')
  await page.getByRole('button',{name:'Ruxsat berish',exact:true}).click()
  await page.locator('[data-path]').filter({hasText:`/results/${listening.id}/review`}).waitFor()
  assert.ok(await page.evaluate(()=>localStorage.getItem('profai:account:nova-browser-learner:nova:writing-navigation-backup:v1')!==null || Object.keys(localStorage).some(k=>k.includes('nova:writing-navigation-backup:'))))
  try { await page.locator('.nova-study-question').getByText(question.text,{exact:true}).waitFor() }
  catch(error) { console.log('Study state:', await page.evaluate(()=>window.study()), 'Dock:',await page.locator('.nova-study-scroll').innerText(),'Browser errors:',errors);throw error }
  assert.equal(await page.locator('.nova-study-evidence').count(),0)
  await page.locator('.nova-study-steps').getByRole('button',{name:'Dalil',exact:true}).click()
  await page.locator('.nova-study-evidence').waitFor()
  if (question.transcript) assert.ok((await page.locator('.nova-study-evidence details').innerText()).includes(question.transcript.slice(0,40)))
  else await page.getByText('Bu manbada transcript mavjud emas.',{exact:true}).waitFor()
  await page.getByRole('button',{name:'Eshitish / qayta',exact:true}).click()
  await page.waitForFunction(()=>document.querySelector('.nova-source-player [role=status]')?.textContent==='playing',null,{timeout:15000})
  await page.evaluate(()=>document.activeElement?.blur());await page.keyboard.down('Space')
  assert.equal(await page.getByRole('button',{name:'Hold to talk to Nova',exact:true}).getAttribute('aria-pressed'),'true')
  await page.keyboard.up('Space')
  assert.equal(await page.getByRole('button',{name:'Hold to talk to Nova',exact:true}).getAttribute('aria-pressed'),'false')
  await page.waitForFunction(()=>document.querySelector('.nova-source-player [role=status]')?.textContent==='idle')
  const control = async (id,action) => {
    const reference = (await page.evaluate(()=>window.study())).studyReference
    const result = await runNovaTool(owner,{id,name:'control_study',args:{action}},{reference})
    assert.equal(result.ok,true);await page.evaluate(result=>window.applyResults([result]),result)
  }
  await control('browser-next','next_question')
  await page.waitForFunction(id=>window.study().studyReference.questionId===id,listening.questions[1].id)
  await page.locator('.nova-study-question').getByText(listening.questions[1].text,{exact:true}).waitFor()
  await control('browser-previous','previous_question')
  await page.locator('.nova-study-question').getByText(question.text,{exact:true}).waitFor()
  await control('browser-replay','replay')
  await page.waitForFunction(()=>window.study().actionReceipts.some(r=>r.id==='browser-replay'&&r.status==='applied'))
  await control('browser-pause','pause')
  await page.waitForFunction(()=>document.querySelector('.nova-source-player [role=status]')?.textContent==='paused')
  const before = await page.evaluate(()=>window.study())
  await page.getByRole('button',{name:'Doska yopilsin',exact:true}).click();await page.getByRole('button',{name:'Nova',exact:true}).click()
  assert.equal((await page.evaluate(()=>window.study())).studyReference.attemptId,before.studyReference.attemptId)
  const vocabulary = await runNovaTool(owner,{id:'browser-save',name:'save_vocabulary',args:{term:'resilient',definition:'Able to recover',uzbek:'Qiyinchilikdan keyin tiklana oladigan',example:'She remained resilient.',context:'listening',origin:listening.title}})
  await page.evaluate(result=>window.applyResults([result]),vocabulary)
  await page.getByRole('button',{name:'Ruxsat berish',exact:true}).click()
  assert.equal((await page.evaluate(()=>window.words())).length,1)
  await page.evaluate(result=>window.applyResults([result]),vocabulary);assert.equal((await page.evaluate(()=>window.words())).length,1)
  await selects.nth(0).selectOption('speaking');await selects.nth(2).selectOption(speaking.id)
  await page.getByRole('region',{name:'Speaking qayta urinish'}).waitFor();assert.ok((await page.locator('.nova-study-question').innerText()).includes(speaking.questions[0].text))
  await page.getByRole('button',{name:'Doska yopilsin',exact:true}).click()
  await page.evaluate(()=>window.annotate());await page.locator('.nova-editor-mark--grammar').waitFor()
  const editor=page.locator('#student-writing');await editor.focus();await editor.press('Control+End');await page.keyboard.insertText(' ')
  assert.equal(await page.locator('.nova-editor-mark').count(),0)
  await editor.press('Control+z');await page.locator('.nova-editor-mark--grammar').waitFor()
  await editor.press('Control+Shift+z');assert.equal(await page.locator('.nova-editor-mark').count(),0)
  await editor.fill('😊 O‘zbekcha: I have a plan.');assert.equal(await page.locator('.nova-editor-mark').count(),0)
  await page.getByRole('button',{name:'Nova',exact:true}).click();await page.setViewportSize({width:390,height:844})
  await mkdir('output/playwright/nova-study',{recursive:true});await page.screenshot({path:'output/playwright/nova-study/mobile.png',fullPage:true})
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
  await page.setViewportSize({width:1366,height:900});await selects.nth(0).selectOption('sat-math');await selects.nth(2).selectOption(sat.id)
  await page.locator('.nova-study-question').waitFor();await page.screenshot({path:'output/playwright/nova-study/desktop.png',fullPage:true})
  activeExam=true
  const blocked=await page.evaluate(async({token,ref})=>{const r=await fetch('/api/v1/ai/assistant/study/context',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({reference:ref,reveal:true})});return{status:r.status,body:await r.json()}},{token,ref:{skill:'listening',testId:listening.id,attemptId:entry.attemptKey,mode:'practice'}})
  assert.equal(blocked.status,409);assert.equal(blocked.body.code,'ACTIVE_EXAM')
  await page.evaluate(()=>window.setExam(true));assert.equal(await page.locator('.nova-study-dock').count(),0)
  assert.deepEqual(errors,[])
  console.log('PASS browser: real authenticated study API + repository source, owned Analyze route, separate Practice/Speaking bank, original MP3 replay and Space cancellation, progressive transcript, real My Vocab save/replay dedup, Unicode editor stale-anchor removal, mobile layout, restored lesson and backend exam rejection. Fixtures: auth/account rows; no live model or microphone-quality claim.')
} finally {await browser?.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve))}
