import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { mkdir, readFile } from 'node:fs/promises'
import { build } from 'esbuild'
import postcss from 'postcss'
import tailwindcss from 'tailwindcss'

const requireLocal = createRequire(import.meta.url)
let chromium
try { ({ chromium } = requireLocal('playwright')) }
catch {
  const toolsPackage = process.env.ASSESSMENT_PLAYWRIGHT_PACKAGE || (process.platform === 'win32' ? 'C:/Users/User/.codex/skill-tools/node/package.json' : '')
  if (!toolsPackage) throw new Error('Install Playwright in the test toolchain or set ASSESSMENT_PLAYWRIGHT_PACKAGE to its package.json.')
  ;({ chromium } = createRequire(toolsPackage)('playwright'))
}
const source = `
import React from 'react'; import {createRoot} from 'react-dom/client'; import {MemoryRouter} from 'react-router-dom';
import i18n from './src/i18n';
import Writing from './src/components/writing/WritingReviewWorkbench';
import Speaking from './src/components/speaking/SpeakingResult';
import {useAiAssistantStore} from './src/store/aiAssistantStore';
import CoachMascot from './src/components/ai/CoachMascot';
import {useAuthStore} from './src/store/authStore';
import {saveTestAudio} from './src/utils/testAudioStorage';
import {analyseTranscript} from './src/lib/speakingScoring';
const root=createRoot(document.getElementById('root'));
useAuthStore.setState({user:{id:'browser-studio',fullName:'Learner',role:'USER'},accessToken:'fixture-token'});
const original='Many student believes that technology makes learning easier. In my experience, online lessons give students access to useful explanations and allow them to study at their own pace. However, a teacher is still needed to identify misunderstandings and encourage regular practice.';
const errors=[{original:'Many student believes',corrected:'Many students believe',explanation:'Many is followed by a plural noun; the plural subject takes believe.',category:'grammar'}];
const feedback={taskAchievement:'A clear position with relevant points, but examples need further development.',coherenceCohesion:'Ideas progress logically across the response.',lexicalResource:'Appropriate topic vocabulary, with limited flexibility.',grammaticalRange:'An agreement error reduces accuracy in the opening sentence.'};
const writing={overallBand:6,taskAchievement:6,coherenceCohesion:6.5,lexicalResource:6,grammaticalRange:5.5,criterionFeedback:feedback,summary:'A clear response with room to develop ideas.',errors,strengths:['Your position remains consistent.','The contrast between technology and a teacher is relevant.'],improvements:['Support your main argument with one specific example.','Check subject and verb agreement after quantifiers.'],correctedVersion:original.replace(errors[0].original,errors[0].corrected),improvedVersion:'Many students believe that technology makes learning easier. In my experience, online lessons offer useful explanations and let students learn at their own pace. Nevertheless, teachers remain essential for identifying misunderstandings and encouraging consistent practice.',correctedAssessment:{overallBand:6.5,taskAchievement:6,coherenceCohesion:6.5,lexicalResource:6,grammaticalRange:7,criterionFeedback:feedback,summary:'More accurate language improves the estimate; developing the ideas is still the next priority.'},assessment:{provider:'gemini',model:'gemini-3.1-pro-preview',assessedAt:new Date().toISOString(),rubricVersion:'ielts-public-2023'}};
const transcript=[{role:'examiner',text:'Do you enjoy reading?'},{role:'candidate',text:'I like read books about the world because they help me understand different cultures.'},{role:'examiner',text:'When do you usually read?'},{role:'candidate',text:'Usually in the evening, when the house is quiet.'}];
const speaking={overallBand:6.5,fluencyBand:6.5,lexicalBand:6.5,grammarBand:6,pronunciationBand:6.5,summary:'You communicate your ideas clearly and support them with relevant reasons. Improve verb patterns and make the final consonant in world more distinct.',strengths:['Relevant answers with clear supporting reasons.'],weaknesses:['Check verb patterns after like.'],improvementPriorities:[{area:'Grammar',target:7,action:'Say three sentences using like + -ing, then answer the question again.'}],stats:analyseTranscript(transcript.filter(x=>x.role==='candidate').map(x=>x.text).join(' '),30),source:'ai',assessmentMode:'audio',improvedAnswers:[{answerIndex:0,original:transcript[1].text,improved:'I enjoy reading books about the world because they help me understand different cultures.'},{answerIndex:1,original:transcript[3].text,improved:transcript[3].text}],answerFeedback:[{answerIndex:0,summary:'A relevant answer with a clear reason. Correct the verb pattern after like.',corrections:[{original:'like read',corrected:'like reading',explanation:'Use like + -ing when describing an activity you enjoy.'}]},{answerIndex:1,summary:'A natural, concise answer. No clear grammar error.',corrections:[]}],pronunciationTargets:[{answerIndex:0,word:'world',ipa:'/w\u025c\u02d0ld/',heard:'The final consonant is weak in this fixture example.',tip:'Round your lips for w, keep one syllable, then release the final d.',example:'Books about the world.',confidence:.9}],recording:{audioKey:'browser-fixture',layout:'session'},assessment:writing.assessment};
function wav(){const b=new ArrayBuffer(6444),v=new DataView(b);const w=(o,s)=>[...s].forEach((c,i)=>v.setUint8(o+i,c.charCodeAt(0)));w(0,'RIFF');v.setUint32(4,6436,true);w(8,'WAVEfmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,16000,true);v.setUint32(28,32000,true);v.setUint16(32,2,true);v.setUint16(34,16,true);w(36,'data');v.setUint32(40,6400,true);return new Blob([b],{type:'audio/wav'})}
window.fixtureReady=Promise.all(['examiner:0','answer:0','examiner:1','answer:1'].map(key=>saveTestAudio('browser-studio','browser-fixture:'+key,wav())));
window.show=async(mode='writing')=>{await i18n.changeLanguage('en');root.render(<MemoryRouter><main style={{minHeight:'100vh',padding:'24px 16px',background:'linear-gradient(135deg,#f5f6fa,#e1e6ee)'}}><div style={{maxWidth:960,margin:'0 auto'}}>{mode==='writing'?<><h1 style={{fontSize:26,fontWeight:750,color:'#252b38',letterSpacing:'-.8px'}}>Your Writing review</h1><p style={{fontSize:13,color:'#677184',marginTop:6}}>A clear view of your work and what to practise next.</p><Writing evaluation={writing} original={original}/></>:mode==='speaking'?<Speaking evaluation={speaking} transcript={transcript} modeLabel='Speaking practice' onExit={()=>{}} onRetry={()=>{}}/>:<div style={{maxWidth:440,margin:'40px auto',textAlign:'center'}}><CoachMascot state='speaking' level={.5} size={200}/><h1 style={{fontSize:24,fontWeight:700,marginBottom:20}}>Meet your study companion</h1></div>}</div></main></MemoryRouter>)};
window.setReplyExpression=(expression)=>{const owner='user:browser-studio';const store=useAiAssistantStore.getState();const threadId=store.activeThreadIds[owner]||store.startNewThread(owner);store.pushMessage(owner,threadId,{id:'reply-'+Date.now(),role:'assistant',content:'Asalim, let us practise.',expression,createdAt:new Date().toISOString()})};window.show();
import './src/styles/premium-identity.css'; import './src/styles/ivygoo-glass.css';
`
const bundle = await build({ stdin: { contents: source, loader: 'tsx', resolveDir: process.cwd() }, bundle: true, write: false, outfile: 'tmp/assessment-fixture.js', format: 'iife', tsconfig: 'tsconfig.json', define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"production"' }, loader: { '.jpg': 'dataurl', '.png': 'dataurl' } })
const css = (await postcss([tailwindcss()]).process(await readFile('src/index.css', 'utf8'), { from: 'src/index.css' })).css + bundle.outputFiles.filter(file => file.path.endsWith('.css')).map(file => file.text).join('\n')
const server = createServer((req, res) => {
  res.setHeader('Content-Type', (req.url === '/fixture.js' ? 'application/javascript' : req.url === '/fixture.css' ? 'text/css' : 'text/html') + '; charset=utf-8')
  res.end(req.url === '/fixture.js' ? bundle.outputFiles.find(file => file.path.endsWith('.js')).text : req.url === '/fixture.css' ? css : '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>')
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
let browser
try {
  browser = await chromium.launch({ ...(process.platform === 'win32' ? { channel: 'msedge' } : {}), headless: true, args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] })
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, permissions: ['microphone'], reducedMotion: 'reduce' })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  let pronunciationRequests = 0
  await page.route('**/api/v1/ai/speaking-audio/pronunciation', async route => {
    pronunciationRequests++
    const body = route.request().postDataJSON()
    assert.equal(body.word, 'world'); assert.ok(body.audioBase64.length > 100)
    await route.fulfill({ json: { accuracyPercent: 82, needsWorkPercent: 18, heard: 'world', feedback: 'Your final consonant is clearer.', nextTry: 'Keep the vowel steady.' } })
  })
  await page.goto(`http://127.0.0.1:${server.address().port}`)
  await page.waitForLoadState('networkidle')
  await page.getByRole('tab', { name: 'Corrections' }).waitFor()
  await mkdir('artifacts/assessment-studio', { recursive: true })
  await page.screenshot({ path: 'artifacts/assessment-studio/writing-desktop.png', fullPage: true })
  await page.getByRole('tab', { name: 'Corrected text', exact: true }).click()
  await page.getByText('More accurate language improves the estimate', { exact: false }).waitFor()
  await page.getByRole('tab', { name: 'Corrected text', exact: true }).press('ArrowRight')
  await page.getByText('A coaching rewrite of your ideas.', { exact: false }).waitFor()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('tab', { name: 'Corrections' }).click()
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'Writing has no horizontal page overflow')
  await page.screenshot({ path: 'artifacts/assessment-studio/writing-mobile.png', fullPage: true })
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.evaluate(async () => { await window.fixtureReady; await window.show('speaking') })
  await page.getByRole('tab', { name: 'Answer analysis' }).waitFor()
  await page.getByRole('button', { name: 'Question 2', exact: true }).click()
  await page.getByText('A natural, concise answer. No clear grammar error.', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'Question 1', exact: true }).click()
  await page.screenshot({ path: 'artifacts/assessment-studio/speaking-desktop.png', fullPage: true })
  await page.getByRole('tab', { name: 'Pronunciation arena' }).click()
  await page.getByRole('button', { name: 'Try saying it', exact: true }).click()
  await page.getByRole('button', { name: 'Finish attempt', exact: true }).waitFor()
  await page.waitForTimeout(1200)
  await page.getByRole('button', { name: 'Finish attempt', exact: true }).click()
  await page.getByText('82%', { exact: true }).waitFor({ timeout: 15000 })
  assert.equal(pronunciationRequests, 1)
  await page.screenshot({ path: 'artifacts/assessment-studio/pronunciation.png', fullPage: true })
  await page.getByRole('tab', { name: 'Conversation replay' }).click()
  await page.getByRole('button', { name: 'Download both voices' }).waitFor({ state: 'visible' })
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download both voices' }).click()
  const download = await downloadPromise
  assert.equal(download.suggestedFilename(), 'ivygoo-speaking-conversation.wav')
  await download.saveAs('artifacts/assessment-studio/replay-fixture.wav')
  const bytes = await readFile('artifacts/assessment-studio/replay-fixture.wav')
  assert.equal(bytes.subarray(0, 4).toString(), 'RIFF'); assert.equal(bytes.length, 25644)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('tab', { name: 'Answer analysis' }).click()
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'Speaking has no horizontal page overflow')
  await page.screenshot({ path: 'artifacts/assessment-studio/speaking-mobile.png', fullPage: true })
  await page.evaluate(() => window.show('coach'))
  assert.equal(await page.locator('fieldset').count(), 0, 'No manual coach settings are shown')
  await page.evaluate(() => window.setReplyExpression('affectionate'))
  await page.locator('[data-expression="affectionate"]').waitFor()
  await page.screenshot({ path: 'artifacts/assessment-studio/coach-mobile.png', fullPage: true })
  assert.deepEqual(errors, [])
  console.log('PASS: desktop/mobile layouts, keyboard tabs, per-answer review, actual browser microphone lifecycle, pronunciation request and complete WAV export (fixture API/audio)')
} finally { await browser?.close(); await new Promise(resolve => server.close(resolve)) }
