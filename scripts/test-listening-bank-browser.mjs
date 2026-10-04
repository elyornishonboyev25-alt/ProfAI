import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { mkdtemp, readFile, readdir, rm, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve, sep } from 'node:path'
import { build } from 'esbuild'

const requireBackend = createRequire(new URL('../backend/package.json', import.meta.url))
const WebSocket = requireBackend('ws')
const profile = await mkdtemp(join(tmpdir(), 'profai-listening-bank-'))
const artifacts = resolve('tmp/listening-bank-audit')
await mkdir(artifacts, { recursive: true })
const bundle = await build({
  stdin: { loader: 'tsx', resolveDir: process.cwd(), contents: `
    import React from 'react'; import {createRoot} from 'react-dom/client';
    import Interface from './src/components/IELTSReadingInterface';
    import {mockListeningTests as tests} from './src/data/listeningPassages';
    const root=createRoot(document.getElementById('root'));let version=0;
    window.tests=tests;
    window.mount=(index,review=true,part=null)=>{
      const test=tests[index];const answers=Object.fromEntries(test.sections.flatMap(s=>s.questions.map(q=>[q.id,Array.isArray(q.correctAnswer)?q.correctAnswer[0]:q.correctAnswer.split(/[\\/;|]/)[0].trim()])));
      for(const s of test.sections)for(const b of s.groups.flatMap(g=>g.blocks))if(b.kind==='multi-mcq'){
        const pool=[...new Set(b.blanks.flatMap(n=>test.sections.flatMap(s=>s.questions).find(q=>q.number===n).correctAnswer.split(/[\\/;|]/).map(s=>s.trim())))];
        b.blanks.forEach((n,i)=>answers[test.sections.flatMap(s=>s.questions).find(q=>q.number===n).id]=pool[i]);
      }
      const result={testId:test.id,date:'2026-10-04',score:9,correctAnswers:40,totalQuestions:40,timeSpent:1800,answers,
        detailedBreakdown:{activeSectionIds:part?[test.sections[part-1].id]:test.sections.map(s=>s.id)}};
      window.currentTest=test;window.expectedAnswers=answers;window.completed=[];
      root.render(<Interface key={++version} test={test} reviewPayload={review?{result,showCorrectAnswers:true}:undefined} launchPreset={review?undefined:{mode:'practice'}} onComplete={r=>window.completed.push(r)} onExit={()=>{}}/>);
    };
    window.mount(0);
  ` },
  bundle: true, write: false, format: 'iife', tsconfig: 'tsconfig.json', loader: { '.jpg': 'dataurl', '.png': 'dataurl' },
  define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env': '{}' },
})
const cssName = (await readdir('dist/assets')).find(name => name.startsWith('index-') && name.endsWith('.css'))
assert.ok(cssName, 'Run npm run build first')
const css = await readFile(`dist/assets/${cssName}`)
const publicRoot = resolve('public')
const server = createServer(async (req, res) => {
  try {
    if (req.url === '/') { res.setHeader('Content-Type', 'text/html'); res.end('<meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><div id="root"></div><script src="/fixture.js"></script>') }
    else if (req.url === '/fixture.js') { res.setHeader('Content-Type', 'text/javascript'); res.end(bundle.outputFiles[0].text) }
    else if (req.url === '/style.css') { res.setHeader('Content-Type', 'text/css'); res.end(css) }
    else {
      const path = resolve(publicRoot, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname))
      if (!path.startsWith(publicRoot + sep)) { res.writeHead(403); res.end(); return }
      const bytes = await readFile(path)
      res.setHeader('Content-Type', path.endsWith('.mp3') ? 'audio/mpeg' : path.endsWith('.svg') ? 'image/svg+xml' : path.endsWith('.png') ? 'image/png' : 'image/jpeg')
      res.setHeader('Content-Length', bytes.length); res.end(bytes)
    }
  } catch { res.writeHead(404); res.end() }
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const browser = spawn(process.env.LISTENING_TEST_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--autoplay-policy=no-user-gesture-required',
  '--js-flags=--expose-gc', '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank',
], { windowsHide: true, stdio: 'ignore' })
const exited = new Promise(resolve => { browser.once('exit', resolve); browser.once('error', resolve) })
let socket
try {
  let port
  for (let n = 0; n < 100; n++) {
    try { port = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break } catch { /* startup */ }
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  assert.ok(port, 'Browser startup')
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
  socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl)
  await new Promise(resolve => socket.once('open', resolve))
  let nextId = 0
  const pending = new Map()
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(method + ' timed out')) }, 120000)
    pending.set(id, { resolve, reject, timer }); socket.send(JSON.stringify({ id, method, params }))
  })
  socket.on('message', data => {
    const message = JSON.parse(data), call = pending.get(message.id)
    if (!call) return
    clearTimeout(call.timer); pending.delete(message.id)
    if (message.error) call.reject(message.error); else call.resolve(message.result)
  })
  const evaluate = async expression => {
    const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    assert.ok(!response.exceptionDetails, JSON.stringify(response.exceptionDetails))
    return response.result.value
  }
  const until = async expression => {
    for (let n = 0; n < 100; n++) {
      if (await evaluate(`Boolean(${expression})`)) return
      await new Promise(resolve => setTimeout(resolve, 75))
    }
    assert.fail(expression)
  }
  await send('Page.navigate', { url: `http://127.0.0.1:${server.address().port}` })
  await until('window.tests && document.querySelector(".reading-pane")')
  const failures = []
  for (const width of [1440, 390]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width === 390 })
    for (let index = 0; index < 30; index++) {
      await evaluate(`window.mount(${index})`)
      await until(`document.querySelector('#question-card-' + window.tests[${index}].sections[0].questions[0].id)`)
      for (let part = 1; part <= 4; part++) {
        await evaluate(`[...document.querySelectorAll('span')].find(el=>el.textContent==='Part ${part}').click()`)
        await until(`document.querySelector('#question-card-' + window.tests[${index}].sections[${part - 1}].questions[0].id)`)
        const issues = await evaluate(`(()=>{
          const issues=[]; const section=window.currentTest.sections[${part - 1}];
          for(const q of section.questions){
            const cards=document.querySelectorAll('#question-card-'+q.id);
            if(cards.length!==1)issues.push('Q'+q.number+' anchors '+cards.length);
          }
          if(document.body.scrollWidth>innerWidth+1)issues.push('page overflows');
          const pane=document.querySelector('.reading-pane');if(pane.scrollWidth>pane.clientWidth+1)issues.push('question pane overflows');
          const inputs=[...pane.querySelectorAll('input[type="text"]')];
          for(const el of inputs){
            if(!el.disabled)issues.push('review is editable');
            if(!el.getAttribute('aria-label'))issues.push('unlabelled Q'+el.placeholder);
            if(el.value!==window.expectedAnswers[section.questions.find(q=>q.number===Number(el.placeholder))?.id])issues.push('wrong saved value Q'+el.placeholder);
            const r=el.getBoundingClientRect();
            for(const other of inputs){if(el===other)continue;const s=other.getBoundingClientRect();if(Math.min(r.right,s.right)>Math.max(r.left,s.left)&&Math.min(r.bottom,s.bottom)>Math.max(r.top,s.top))issues.push('overlap '+el.placeholder+'/'+other.placeholder);}
          }
          for(const img of pane.querySelectorAll('img'))if(img.complete&&!img.naturalWidth)issues.push('broken diagram '+img.src);
          const ids=[...document.querySelectorAll('[id]')].map(el=>el.id);if(new Set(ids).size!==ids.length)issues.push('duplicate DOM IDs');
          return [...new Set(issues)];
        })()`)
        if (issues.length) failures.push({ test: index + 1, part, width, issues })
      }
      console.log(`Rendered ${index + 1}/30: four saved-review parts at ${width}px`)
    }
  }
  await writeFile(join(artifacts, 'layout-issues.json'), JSON.stringify(failures, null, 2))
  assert.equal(failures.length, 0, `Layout issues: ${JSON.stringify(failures.slice(0, 5))}`)
  // The reported form: real keyboard input, focus, neighbouring fields and reload.
  await evaluate('localStorage.clear();window.mount(3,false)')
  await until(`document.querySelector('input[placeholder="1"]') && [...document.querySelectorAll('button')].some(el=>el.textContent.trim()==='Play')`)
  await evaluate('[...document.querySelectorAll("button")].find(el=>el.textContent.trim()==="Play").click();document.querySelector("audio").muted=true')
  await evaluate(`document.querySelector('input[placeholder="1"]').focus()`)
  await send('Input.insertText', { text: 'edwinari' })
  await evaluate(`document.querySelector('input[placeholder="2"]').focus()`)
  await send('Input.insertText', { text: 'New Zealander' })
  assert.equal(await evaluate(`document.querySelector('input[placeholder="1"]').value`), 'edwinari')
  assert.equal(await evaluate('JSON.parse(localStorage.getItem("ielts_test_session_ielts-listening-4")).answers["lt4-q2"]'), 'New Zealander')
  for (const width of [1440, 390]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width === 390 })
    await evaluate(`document.querySelector('input[placeholder="1"]').focus();document.querySelector('input[placeholder="1"]').scrollIntoView({block:'center'})`)
    const gap = await evaluate(`document.querySelector('input[placeholder="2"]').getBoundingClientRect().top-document.querySelector('input[placeholder="1"]').getBoundingClientRect().bottom`)
    assert.ok(gap >= 10, 'Focus outlines need vertical clearance: ' + gap)
    const shot = await send('Page.captureScreenshot', { format: 'png' })
    await writeFile(join(artifacts, `prime-recruitment-${width}.png`), Buffer.from(shot.data, 'base64'))
  }
  await evaluate('window.mount(3,true,4)')
  await until(`document.querySelector('input[placeholder="31"]')`)
  assert.ok(await evaluate('[...document.querySelectorAll("span")].some(el=>el.textContent==="Part 4")'), 'Saved Part 4 keeps its original number')
  assert.equal(await evaluate('window.completed.length'), 0, 'Review never submits')
  console.log('PASS: 240 review views, typed fields, saved answers, focus spacing, partial review and all question anchors')
  if (!process.argv.includes('--skip-audio')) {
    const paths = await evaluate('[...new Set(window.tests.flatMap(t=>t.continuousAudioUrl?[t.continuousAudioUrl]:t.sections.map(s=>s.audioUrl)))]')
    for (const path of paths) {
      const info = await evaluate(`(async()=>{
        const context=new AudioContext();try{
          const response=await fetch(${JSON.stringify(path)});if(!response.ok)throw new Error('Audio HTTP '+response.status);
          const decoded=await context.decodeAudioData(await response.arrayBuffer());
          const samples=decoded.getChannelData(0);let peak=0;for(let i=0;i<samples.length;i+=1009)peak=Math.max(peak,Math.abs(samples[i]));
          return {duration:decoded.duration,channels:decoded.numberOfChannels,peak};
        }finally{await context.close();}
      })()`)
      assert.ok(info.duration > 60 && info.duration < 3600 && info.peak > 0.01, `${path}: ${JSON.stringify(info)}`)
      await evaluate('window.gc?.()')
      console.log(`Decoded entire recording: ${path} (${info.duration.toFixed(1)}s)`)
    }
    console.log(`PASS: all ${paths.length} referenced MP3s fully decoded, non-silent and within duration bounds`)
  }
  await send('Browser.close').catch(() => {})
} finally {
  socket?.close()
  browser.kill()
  await exited
  await new Promise(resolve => server.close(resolve))
  // profile is a mkdtemp child of the OS temporary directory, never user data.
  assert.ok(resolve(profile).startsWith(resolve(tmpdir()) + sep))
  await rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
}
