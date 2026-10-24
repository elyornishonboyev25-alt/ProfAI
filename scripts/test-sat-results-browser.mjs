import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { build } from 'esbuild'
import postcss from 'postcss'
import tailwindcss from 'tailwindcss'

const WebSocket = createRequire(new URL('../backend/package.json', import.meta.url))('ws')
const directory = await mkdtemp(join(tmpdir(), 'ivygoo-sat-results-'))
const artifacts = resolve(process.env.SAT_RESULTS_ARTIFACTS || '/tmp/ivygoo-sat-results-artifacts')
const source = `
import React from 'react'; import {createRoot} from 'react-dom/client'; import {MemoryRouter} from 'react-router-dom';
import SATReview from './src/components/sat/SATReview'; import {getSATSectionTest,getSATReviewTests} from './src/features/sat/catalog';
import {createSATAttempt} from './src/features/sat/practiceTest4'; import {useAuthStore} from './src/store/authStore'; import {useBadgeStore} from './src/store/badgeStore';
import {analyzeSATResult} from './src/features/sat/resultAnalysis'; import {buildSATReportHtml} from './src/features/sat/resultReport';
useAuthStore.setState({user:null}); useBadgeStore.setState({awardIfEligible:()=>({celebrated:false,tier:null})});
const root=createRoot(document.getElementById('root')); let run=0;
window.show=(kind='full')=>{
 const test=kind==='legacy'?getSATReviewTests().find(t=>t.id==='may-2026-us-v1'):getSATSectionTest(8,kind==='math'?'math':kind==='reading'?'reading-writing':null);
 const attempt=createSATAttempt(test.id,test.modules,'exam'); const questions=test.modules.flatMap(m=>m.questions);
 questions.forEach((q,i)=>{if(kind==='perfect'||i%9>1)attempt.answers[q.id]=q.correctAnswer;else if(i%9===1)attempt.answers[q.id]='wrong'});
 attempt.status=kind==='unfinished'?'active':'submitted';attempt.submittedAt=kind==='unfinished'?undefined:Date.parse('2026-10-24T14:00:00Z');attempt.updatedAt=attempt.submittedAt??Date.parse('2026-10-24T14:00:00Z');
 attempt.moduleElapsedSeconds=Object.fromEntries(test.modules.map((m,i)=>[m.id,1500+i*60]));attempt.moduleStartedAt=Object.fromEntries(test.modules.map((m,i)=>[m.id,1000+i*1500000]));
 attempt.notes[questions[1].id]='Check the evidence before choosing an answer.';attempt.flagged=[questions[1].id];
 window.expected=analyzeSATResult(test,attempt);window.reportHtml=buildSATReportHtml({analysis:window.expected,title:test.title,candidate:'Aziza O‘ktamova <script>window.injected=true</script>',timestamp:attempt.updatedAt,mode:attempt.mode});
 root.render(<MemoryRouter key={++run}><SATReview test={test} attempt={attempt} onStartAgain={()=>{}} /></MemoryRouter>);
};window.show();`
const bundle = await build({
  stdin: { contents: source, loader: 'tsx', resolveDir: process.cwd() },
  bundle: true,
  write: false,
  outfile: '/tmp/sat-results-fixture.js',
  format: 'iife',
  tsconfig: 'tsconfig.json',
  define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"production"' },
})
const css =
  (await postcss([tailwindcss()]).process(await readFile('src/index.css', 'utf8'), { from: 'src/index.css' })).css +
  bundle.outputFiles
    .filter((file) => file.path.endsWith('.css'))
    .map((file) => file.text)
    .join('\n')
const server = createServer(async (req, res) => {
  if (req.url === '/fixture.js') {
    res.setHeader('Content-Type', 'application/javascript')
    res.end(bundle.outputFiles.find((file) => file.path.endsWith('.js')).text)
    return
  }
  if (req.url === '/fixture.css') {
    res.setHeader('Content-Type', 'text/css')
    res.end(css)
    return
  }
  if (req.url === '/') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.end(
      '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>',
    )
    return
  }
  const path = resolve('public', '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname))
  if (!path.startsWith(resolve('public') + '/')) {
    res.writeHead(404)
    res.end()
    return
  }
  try {
    res.setHeader('Content-Type', path.endsWith('.svg') ? 'image/svg+xml' : 'image/png')
    res.end(await readFile(path))
  } catch {
    res.writeHead(404)
    res.end()
  }
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const browser = spawn(
  process.env.SAT_TEST_BROWSER || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-debugging-port=0',
    '--user-data-dir=' + directory,
    'about:blank',
  ],
  { stdio: 'ignore' },
)
const exited = new Promise((resolve) => {
  browser.once('exit', resolve)
  browser.once('error', resolve)
})
let socket
try {
  let port
  for (let i = 0; i < 100; i++) {
    try {
      port = (await readFile(join(directory, 'DevToolsActivePort'), 'utf8')).split('\n')[0]
      break
    } catch {
      /* Chromium is starting. */
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  assert.ok(port, 'Set SAT_TEST_BROWSER to an installed Chromium browser')
  const connect = async (url) => {
    const ws = new WebSocket(url)
    await new Promise((resolve) => ws.once('open', resolve))
    let id = 0
    const pending = new Map()
    ws.on('message', (data) => {
      const message = JSON.parse(data),
        call = pending.get(message.id)
      if (!call) return
      clearTimeout(call.timeout)
      pending.delete(message.id)
      message.error ? call.reject(message.error) : call.resolve(message.result)
    })
    return {
      ws,
      send: (method, params = {}) =>
        new Promise((resolve, reject) => {
          const requestId = ++id
          const timeout = setTimeout(() => {
            pending.delete(requestId)
            reject(new Error(method))
          }, 15000)
          pending.set(requestId, { resolve, reject, timeout })
          ws.send(JSON.stringify({ id: requestId, method, params }))
        }),
    }
  }
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
  const client = await connect(targets.find((t) => t.type === 'page').webSocketDebuggerUrl)
  socket = client.ws
  const send = client.send
  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true })
    assert.ok(!r.exceptionDetails, JSON.stringify(r.exceptionDetails))
    return r.result.value
  }
  const until = async (expression) => {
    for (let i = 0; i < 100; i++) {
      if (await evaluate(`Boolean(${expression})`)) return
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    throw Error('Timed out: ' + expression)
  }
  const clickTab = async (tab) => {
    await evaluate(`document.querySelector('#sat-result-tab-${tab}').click()`)
    await until(`document.querySelector('#sat-result-panel-${tab}')`)
  }
  const layout = () =>
    evaluate(
      '({width:innerWidth,content:document.documentElement.scrollWidth,selected:document.querySelector(\'[role="tab"][aria-selected="true"]\').textContent})',
    )
  await send('Page.enable')
  await send('Runtime.enable')
  await send('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/` })
  await until('window.expected && document.querySelector(".sr-total-number")')
  await mkdir(artifacts, { recursive: true })
  for (const [width, height] of [
    [1440, 1050],
    [1024, 900],
    [768, 1024],
    [390, 844],
    [320, 740],
  ]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 640 })
    await evaluate('window.show()')
    await until('document.querySelector("#sat-result-panel-scores")')
    await new Promise((resolve) => setTimeout(resolve, 300))
    assert.equal(
      await evaluate('Number(document.querySelector(".sr-total-number").textContent)===window.expected.score'),
      true,
    )
    for (const tab of ['scores', 'performance', 'domains', 'questions']) {
      await clickTab(tab)
      await new Promise((resolve) => setTimeout(resolve, 270))
      const size = await layout()
      assert.ok(size.content <= width + 1, `${width}px ${tab}: overflow ${JSON.stringify(size)}`)
      const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
      await writeFile(join(artifacts, `${width}-${tab}.png`), Buffer.from(shot.data, 'base64'))
    }
    await evaluate('document.querySelector(".sr-question-number.is-correct").click()')
    await until('document.querySelector("article").textContent.includes("Your answer · Correct")')
    assert.ok((await layout()).content <= width + 1, `${width}px: selected correct answer stays readable`)
    await evaluate('document.querySelectorAll(".sr-review-filters button")[1].click()')
    await until(
      'document.querySelectorAll(".sr-question-number").length===window.expected.report.incorrect+window.expected.report.unanswered',
    )
    assert.equal(
      await evaluate(
        '[...document.querySelectorAll(".sr-question-number")].every(q=>!q.classList.contains("is-correct"))',
      ),
      true,
    )
    await clickTab('domains')
    await evaluate('document.querySelector(".sr-domain-card button").click()')
    await until('document.querySelector(".sr-domain-filter")')
    assert.equal(
      await evaluate('document.querySelector("#sat-result-tab-questions").getAttribute("aria-selected")'),
      'true',
    )
    console.log(
      `PASS ${width}px: four tabs, exact totals, no horizontal overflow, missed-question and domain navigation`,
    )
  }
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false })
  await evaluate('window.show()')
  await until('document.querySelector("#sat-result-panel-scores")')
  await evaluate(
    'document.querySelector("#sat-result-tab-scores").focus();document.querySelector("#sat-result-tab-scores").dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowRight",bubbles:true}))',
  )
  await until('document.querySelector("#sat-result-panel-performance")')
  assert.equal(await evaluate('document.activeElement.id'), 'sat-result-tab-performance')
  for (const kind of ['math', 'reading', 'legacy', 'unfinished', 'perfect']) {
    await evaluate(`window.show('${kind}')`)
    await until('document.querySelector("#sat-result-panel-scores")')
    assert.equal(
      await evaluate('document.querySelector(".sr-total-number").textContent.trim()'),
      kind === 'unfinished'
        ? '—'
        : kind === 'legacy'
          ? `${await evaluate('window.expected.report.percent')}%`
          : String(await evaluate('window.expected.score')),
    )
    assert.equal(await evaluate('document.querySelector(".sr-download button").disabled'), kind === 'unfinished')
    if (kind === 'legacy') assert.equal(await evaluate('window.expected.sections.find(s=>s.id==="math").score'), null)
    if (kind === 'perfect') {
      assert.equal(
        await evaluate('document.querySelector(".sr-focus-card h2").textContent'),
        'A clean sweep. Keep going.',
      )
      assert.equal(await evaluate('window.expected.score'), 1600)
    }
  }
  await evaluate('window.show()')
  await until('document.querySelector("#sat-result-panel-scores")')
  await evaluate(
    'window.savedOpen=window.open;window.open=()=>null;document.querySelector(".sr-download button").click()',
  )
  await until('document.querySelector("[role=alert]")')
  await evaluate('window.open=window.savedOpen;document.querySelector(".sr-download button").click()')
  let reportTarget
  for (let i = 0; i < 30; i++) {
    reportTarget = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(
      (t) => t.type === 'page' && t.id !== targets.find((t) => t.type === 'page').id,
    )
    if (reportTarget) break
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  assert.ok(reportTarget, 'Download opens a new report tab')
  const reportClient = await connect(reportTarget.webSocketDebuggerUrl)
  const reportEval = async (expression) =>
    (await reportClient.send('Runtime.evaluate', { expression, returnByValue: true })).result.value
  assert.equal(await reportEval('window.opener===null'), true)
  assert.equal(
    await reportEval('document.querySelector(".big-score").textContent'),
    String(await evaluate('window.expected.score')),
  )
  await reportClient.send('Page.enable')
  const unicodeHtml = await evaluate('window.reportHtml')
  const frame = await reportClient.send('Page.getFrameTree')
  await reportClient.send('Page.setDocumentContent', { frameId: frame.frameTree.frame.id, html: unicodeHtml })
  assert.equal(await reportEval('window.injected'), undefined)
  assert.ok((await reportEval('document.querySelector(".identity strong").textContent')).includes('O‘ktamova <script>'))
  const pdf = await reportClient.send('Page.printToPDF', {
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: false,
  })
  const pdfBytes = Buffer.from(pdf.data, 'base64')
  assert.equal(
    (pdfBytes.toString('latin1').match(/\/Type\s*\/Page\b/g) || []).length,
    1,
    'The A4 report fits one page, including its Ivygoo footer',
  )
  await writeFile(join(artifacts, 'ivygoo-sat-report.pdf'), pdfBytes)
  await reportClient.send('Emulation.setDeviceMetricsOverride', {
    width: 1000,
    height: 1250,
    deviceScaleFactor: 1,
    mobile: false,
  })
  const reportShot = await reportClient.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
  await writeFile(join(artifacts, 'report.png'), Buffer.from(reportShot.data, 'base64'))
  for (const width of [390, 320]) {
    await reportClient.send('Emulation.setDeviceMetricsOverride', {
      width,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    })
    assert.equal(await reportEval('document.documentElement.scrollWidth<=innerWidth+1'), true)
  }
  reportClient.ws.close()
  console.log(
    'PASS section-only, unavailable modules, unfinished and perfect attempts; keyboard tabs; blocked popup recovery; real report tab; Unicode and HTML escaping; PDF print and mobile report',
  )
  console.log('Artifacts: ' + artifacts)
} finally {
  if (socket) socket.close()
  browser.kill()
  await exited
  await new Promise((resolve) => server.close(resolve))
  await rm(directory, { recursive: true, force: true })
}
