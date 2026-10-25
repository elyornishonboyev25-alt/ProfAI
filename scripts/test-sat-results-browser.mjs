import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve, sep } from 'node:path'
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
 const test=kind==='legacy'?getSATReviewTests().find(t=>t.id==='may-2026-us-v1'):getSATSectionTest(kind==='math3'?3:8,(kind==='math'||kind==='math3')?'math':kind==='reading'?'reading-writing':null);
 const attempt=createSATAttempt(test.id,test.modules,kind==='math3'?'practice':'exam'); const questions=test.modules.flatMap(m=>m.questions);
 questions.forEach((q,i)=>{if(kind==='math3'){if(i<9)attempt.answers[q.id]=q.correctAnswer;else if(i<33)attempt.answers[q.id]='wrong'}else if(kind==='perfect'||i%9>1)attempt.answers[q.id]=q.correctAnswer;else if(i%9===1)attempt.answers[q.id]='wrong'});
 attempt.status=kind==='unfinished'?'active':'submitted';attempt.submittedAt=kind==='unfinished'?undefined:Date.parse('2026-10-24T14:00:00Z');attempt.updatedAt=attempt.submittedAt??Date.parse('2026-10-24T14:00:00Z');
 attempt.moduleElapsedSeconds=Object.fromEntries(test.modules.map((m,i)=>[m.id,kind==='math3'?56:1500+i*60]));attempt.moduleStartedAt=Object.fromEntries(test.modules.map((m,i)=>[m.id,1000+i*1500000]));
 attempt.notes[questions[1].id]='Check the evidence before choosing an answer.';attempt.flagged=[questions[1].id];
 window.expected=analyzeSATResult(test,attempt);window.reportHtml=buildSATReportHtml({analysis:window.expected,title:test.title,candidate:'Aziza O‘ktamova <script>window.injected=true</script>',timestamp:attempt.updatedAt,mode:attempt.mode,attempt});
 if(kind==='math3')window.mathReportHtml=buildSATReportHtml({analysis:window.expected,title:test.title,candidate:'Ivygoo learner',timestamp:attempt.updatedAt,mode:attempt.mode,attempt});
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
  if (!path.startsWith(resolve('public') + sep)) {
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
  await until('window.expected && document.querySelector(".srx-total-number")')
  await mkdir(artifacts, { recursive: true })
  const viewports = process.env.SAT_REPORT_ONLY
    ? []
    : [
        [1440, 1050],
        [1024, 900],
        [768, 1024],
        [390, 844],
        [320, 740],
      ]
  for (const [width, height] of viewports) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 640 })
    await evaluate('window.show()')
    await until('document.querySelector("#sat-result-panel-scores")')
    await new Promise((resolve) => setTimeout(resolve, 300))
    assert.equal(
      await evaluate('Number(document.querySelector(".srx-total-number strong").textContent)===window.expected.score'),
      true,
    )
    for (const tab of ['scores', 'performance', 'leaderboard', 'domains', 'questions', 'discussion']) {
      await clickTab(tab)
      await new Promise((resolve) => setTimeout(resolve, 270))
      const size = await layout()
      assert.ok(size.content <= width + 1, `${width}px ${tab}: overflow ${JSON.stringify(size)}`)
      const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
      await writeFile(join(artifacts, `${width}-${tab}.png`), Buffer.from(shot.data, 'base64'))
    }
    await clickTab('questions')
    assert.equal(
      await evaluate('document.querySelectorAll(".srx-q-row").length'),
      await evaluate('window.expected.questions.length'),
    )
    assert.equal(
      await evaluate('document.querySelectorAll(".srx-row-unanswered").length'),
      await evaluate('window.expected.report.unanswered'),
    )
    await evaluate('document.querySelector(".srx-row-correct .srx-review-button").click()')
    await until('document.querySelector(".sqm-dialog")')
    await until('document.querySelector(".sqm-dialog").textContent.includes("Your answer · Correct")')
    assert.ok(await evaluate('Boolean(document.querySelector(".sqm-explanation"))'))
    const checkModalNavigation = async () => {
      assert.equal(await evaluate(`([...document.querySelectorAll('.sqm-nav')].every(button=>{const r=button.getBoundingClientRect();return r.top>=0 && r.bottom<=innerHeight+1 && r.left>=0 && r.right<=innerWidth+1 && button.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}))`),true,'Full mock review navigation stays visible and clickable')
    }
    await checkModalNavigation()
    await evaluate('document.querySelector(".sqm-body").scrollTop=1e6')
    await checkModalNavigation()
    const shot = await send('Page.captureScreenshot', { format: 'png' })
    await writeFile(join(artifacts, `${width}-modal.png`), Buffer.from(shot.data, 'base64'))
    const before = await evaluate('document.querySelector(".sqm-progress strong").textContent')
    await evaluate('document.querySelector(".sqm-nav.is-next").click()')
    await until(`document.querySelector(".sqm-progress strong").textContent!==${JSON.stringify(before)}`)
    assert.equal(await evaluate('document.querySelector(".sqm-body").scrollTop'),0,'Next mock review starts at the top')
    assert.ok(
      await evaluate('Boolean(document.querySelector(".sqm-explanation"))'),
      'Explanations remain visible while moving between questions',
    )
    await evaluate('window.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true}))')
    await until('!document.querySelector(".sqm-dialog")')
    await evaluate('document.querySelector(".srx-status-chips .chip-incorrect").click()')
    await until('document.querySelectorAll(".srx-q-row").length===window.expected.report.incorrect')
    assert.equal(await evaluate('document.querySelectorAll(".srx-q-row:not(.srx-row-incorrect)").length'), 0)
    await clickTab('domains')
    await evaluate('document.querySelector(".srx-domain-card button").click()')
    await until('document.querySelector(".srx-question-list")')
    assert.equal(
      await evaluate('document.querySelector("#sat-result-tab-questions").getAttribute("aria-selected")'),
      'true',
    )
    await clickTab('questions')
    assert.equal(
      await evaluate('document.querySelectorAll(".srx-q-row").length'),
      await evaluate('window.expected.questions.length'),
      'Question review always reopens with all questions, clearing previous domain/status filters',
    )
    console.log(
      `PASS ${width}px: six tabs, exact totals, no horizontal overflow, missed-question and domain navigation`,
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
  for (const kind of ['math', 'reading', 'legacy', 'unfinished', 'perfect', 'math3']) {
    await evaluate(`window.show('${kind}')`)
    await until('document.querySelector("#sat-result-panel-scores")')
    assert.equal(
      await evaluate('document.querySelector(".srx-total-number strong").textContent.trim()'),
      kind === 'unfinished'
        ? '—'
        : kind === 'legacy'
          ? `${await evaluate('window.expected.report.percent')}%`
          : String(await evaluate('window.expected.score')),
    )
    assert.equal(await evaluate('document.querySelector(".srx-download").disabled'), kind === 'unfinished')
    if (kind === 'legacy') assert.equal(await evaluate('window.expected.sections.find(s=>s.id==="math").score'), null)
    if (kind === 'math3') {
      assert.equal(await evaluate('window.expected.report.correct'), 9)
      assert.equal(await evaluate('window.expected.report.incorrect'), 24)
      assert.equal(await evaluate('window.expected.report.unanswered'), 11)
      for (const width of [1440, 390, 320]) {
        await send('Emulation.setDeviceMetricsOverride', {
          width,
          height: width > 640 ? 1050 : 844,
          deviceScaleFactor: 1,
          mobile: width < 640,
        })
        assert.ok((await layout()).content <= width + 1, `${width}px Math section fits`)
        await new Promise((resolve) => setTimeout(resolve, 280))
        const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
        await writeFile(join(artifacts, `${width}-math3-scores.png`), Buffer.from(shot.data, 'base64'))
      }
      await clickTab('questions')
      assert.equal(await evaluate('document.querySelectorAll(".srx-q-row").length'), 44)
      await send('Emulation.setDeviceMetricsOverride', {
        width: 1440,
        height: 1050,
        deviceScaleFactor: 1,
        mobile: false,
      })
      const shot = await send('Page.captureScreenshot', { format: 'png' })
      await writeFile(join(artifacts, '1440-math3-questions.png'), Buffer.from(shot.data, 'base64'))
    }
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
  await evaluate('window.savedOpen=window.open;window.open=()=>null;document.querySelector(".srx-download").click()')
  await until('document.querySelector("[role=alert]")')
  await evaluate('window.open=window.savedOpen;document.querySelector(".srx-download").click()')
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
    await reportEval('document.querySelector(".score-line.is-total strong").textContent'),
    String(await evaluate('window.expected.score')),
  )
  await reportClient.send('Page.enable')
  const unicodeHtml = await evaluate('window.reportHtml')
  const frame = await reportClient.send('Page.getFrameTree')
  await reportClient.send('Page.setDocumentContent', { frameId: frame.frameTree.frame.id, html: unicodeHtml })
  assert.equal(await reportEval('window.injected'), undefined)
  assert.ok((await reportEval('document.querySelector(".identity div").textContent')).includes('O‘ktamova <script>'))
  await reportClient.send('Runtime.evaluate', {
    expression: 'Promise.all(Array.from(document.images, image => image.decode()))',
    awaitPromise: true,
  })
  assert.equal(
    await reportEval('document.querySelector(".report-brand img").naturalWidth'),
    1672,
    'Original Ivygoo logo loads before printing',
  )
  const pdf = await reportClient.send('Page.printToPDF', {
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: false,
  })
  const pdfBytes = Buffer.from(pdf.data, 'base64')
  await writeFile(join(artifacts, 'ivygoo-sat-report.pdf'), pdfBytes)
  const pageCount = (bytes) => (bytes.toString('latin1').match(/\/Type\s*\/Page\b/g) || []).length
  if (pageCount(pdfBytes) < 2 || pageCount(pdfBytes) > 3) {
    await reportClient.send('Emulation.setEmulatedMedia', { media: 'print' })
    console.log(
      'Report print layout:',
      await reportEval(
        'Array.from(document.querySelector(".sheet").children, node => ({class:node.className,height:node.getBoundingClientRect().height,margin:getComputedStyle(node).margin}))',
      ),
    )
    await reportClient.send('Emulation.setEmulatedMedia', { media: 'screen' })
    const shot = await reportClient.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
    await writeFile(join(artifacts, 'report-overflow.png'), Buffer.from(shot.data, 'base64'))
  }
  assert.ok(
    pageCount(pdfBytes) >= 2 && pageCount(pdfBytes) <= 3,
    'The A4 report keeps scores on page one and the answer sheet on the following pages',
  )
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
  const mathHtml = await evaluate('window.mathReportHtml')
  await reportClient.send('Page.setDocumentContent', { frameId: frame.frameTree.frame.id, html: mathHtml })
  await reportClient.send('Runtime.evaluate', {
    expression: 'Promise.all(Array.from(document.images, image => image.decode()))',
    awaitPromise: true,
  })
  const mathPdf = await reportClient.send('Page.printToPDF', {
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: false,
  })
  const mathBytes = Buffer.from(mathPdf.data, 'base64')
  assert.equal(pageCount(mathBytes), 2, 'The section report fits a score page and a details page')
  await writeFile(join(artifacts, 'ivygoo-math-report.pdf'), mathBytes)
  await reportClient.send('Emulation.setDeviceMetricsOverride', {
    width: 1000,
    height: 1300,
    deviceScaleFactor: 1,
    mobile: false,
  })
  const mathShot = await reportClient.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
  await writeFile(join(artifacts, 'math-report.png'), Buffer.from(mathShot.data, 'base64'))
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
