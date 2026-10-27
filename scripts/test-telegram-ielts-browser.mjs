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
const directory = await mkdtemp(join(tmpdir(), 'profai-telegram-maps-'))
const artifacts = resolve('tmp/telegram-design-browser')
await mkdir(artifacts, { recursive: true })
const bundle = await build({ stdin: { loader: 'tsx', resolveDir: process.cwd(), contents: `
  import React,{useState,useEffect} from 'react';import {createRoot} from 'react-dom/client';
  import Source from './src/components/ielts/SourceQuestionLayout';
  import {telegramListeningTests,telegramReadingTests} from './src/data/telegramIeltsPapers';
  import {evaluateReadingAnswers} from './src/utils/ieltsUtils';
  const banks={listening:telegramListeningTests,reading:telegramReadingTests};window.banks=banks;
  const root=createRoot(document.getElementById('root'));let version=0;
  function Paper({kind,index,part,review,show}){
    const section=banks[kind][index].sections[part],key='browser-source-'+section.id;
    const [answers,setAnswers]=useState(()=>JSON.parse(localStorage.getItem(key)||'{}'));
    const [flags,setFlags]=useState(new Set());const[,setTick]=useState(0);window.tick=()=>setTick(x=>x+1);
    window.savedAnswers=answers;window.currentSectionId=section.id;
    useEffect(()=>localStorage.setItem(key,JSON.stringify(answers)),[answers]);
    const report=evaluateReadingAnswers([section],answers);
    const results=new Map(report.questionResults.map(q=>[q.questionId,{status:q.status,correctAnswer:q.correctAnswer}]));
    return <main className='fixture-paper'><header><p>IELTS {kind}</p><h1>{banks[kind][index].title} · {section.title}</h1></header>
      <Source html={section.sourceQuestionsHtml} questions={section.questions} answers={answers} onAnswer={(id,value)=>setAnswers(p=>({...p,[id]:value}))}
        flaggedQuestionIds={flags} onFlagQuestion={id=>setFlags(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n})}
        review={review} showCorrectAnswers={show} reviewQuestions={results}/></main>;
  }
  window.show=(kind='listening',index=3,part=1,review=false,show=false)=>{
    sessionStorage.setItem('source-browser-selection',JSON.stringify([kind,index,part,review,show]));
    root.render(<Paper key={++version} {...{kind,index,part,review,show}}/>);
  };
  window.show(...JSON.parse(sessionStorage.getItem('source-browser-selection')||'[]'));
` }, bundle: true, write: false, outfile: 'tmp/source-design-fixture.js', format: 'iife', tsconfig: 'tsconfig.json',
  define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"production"' }, loader: { '.jpg': 'dataurl', '.png': 'dataurl' } })
const css = (await postcss([tailwindcss()]).process(await readFile('src/index.css', 'utf8'), { from: 'src/index.css' })).css
  + bundle.outputFiles.filter(file => file.path.endsWith('.css')).map(file => file.text).join('\n')
  + '\nbody{margin:0;background:#f8fafc}.fixture-paper{max-width:1000px;margin:0 auto;padding:24px;min-width:0;background:white}header{border-radius:16px;background:linear-gradient(120deg,#dc2626,#f43f5e);color:white;padding:16px;margin-bottom:20px}header h1{font-size:18px;font-weight:700}@media(max-width:640px){.fixture-paper{padding:12px}}'
const images = new Set(['/images/ielts-telegram-16428-image-1.png', '/images/ielts-telegram-16539-image-1.jpg'])
const server = createServer(async (req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname
  if (images.has(path)) {
    const bytes = await readFile(resolve('public' + path))
    res.setHeader('Content-Type', path.endsWith('.png') ? 'image/png' : 'image/jpeg'); res.end(bytes); return
  }
  res.setHeader('Content-Type', (path === '/fixture.js' ? 'application/javascript' : path === '/fixture.css' ? 'text/css' : 'text/html') + '; charset=utf-8')
  res.end(path === '/fixture.js' ? bundle.outputFiles.find(file => file.path.endsWith('.js')).text : path === '/fixture.css' ? css
    : '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"><div id="root"></div><script src="/fixture.js"></script>')
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const browser = spawn(process.env.READING_TEST_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', '--user-data-dir=' + directory, 'about:blank'], { windowsHide: true, stdio: 'ignore' })
const exited = new Promise(resolve => { browser.once('exit', resolve); browser.once('error', resolve) })
let socket
try {
  let port
  for (let attempt = 0; attempt < 100; attempt++) {
    try { port = (await readFile(join(directory, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break } catch {}
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  assert.ok(port, 'A Chromium browser must be installed')
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
  socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl)
  await new Promise(resolve => socket.once('open', resolve))
  let id = 0
  const pending = new Map(), exceptions = []
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const requestId = ++id
    const timeout = setTimeout(() => { pending.delete(requestId); reject(new Error(method)) }, 20000)
    pending.set(requestId, { resolve, reject, timeout }); socket.send(JSON.stringify({ id: requestId, method, params }))
  })
  socket.on('message', data => {
    const message = JSON.parse(data), call = pending.get(message.id)
    if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails)
    if (!call) return
    clearTimeout(call.timeout); pending.delete(message.id)
    message.error ? call.reject(message.error) : call.resolve(message.result)
  })
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true })
    assert.ok(!result.exceptionDetails, JSON.stringify(result.exceptionDetails)); return result.result.value
  }
  const until = async expression => {
    for (let attempt = 0; attempt < 100; attempt++) {
      if (await evaluate(`Boolean(${expression})`)) return
      await new Promise(resolve => setTimeout(resolve, 80))
    }
    throw new Error(`Timed out: ${expression}; ${JSON.stringify(exceptions)}`)
  }
  const show = async (kind, index, part, review = false, answers = false) => {
    await evaluate(`window.show('${kind}',${index},${part},${review},${answers})`)
    await until(`window.currentSectionId===window.banks.${kind}[${index}].sections[${part}].id && document.querySelector('.source-question-flag,input:disabled,select:disabled')`)
  }
  const screenshot = async name => {
    const { cssContentSize: size } = await send('Page.getLayoutMetrics')
    const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: size.width, height: Math.min(size.height, 4200), scale: 1 } })
    await writeFile(join(artifacts, name + '.png'), Buffer.from(result.data, 'base64'))
  }
  await send('Runtime.enable'); await send('Page.enable')
  await send('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/` })
  await until('window.show && document.querySelector(".source-map-image")')
  for (const width of [1366, 390, 320]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 640 })
    for (const kind of ['listening', 'reading']) for (let index = 0; index < 5; index++) {
      for (let part = 0; part < (kind === 'listening' ? 4 : 3); part++) {
        await show(kind, index, part)
        assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'), `${width}px ${kind} ${index + 31}/${part + 1}: no page overflow`)
      }
    }
    for (const index of [3, 4]) {
      await show('listening', index, 1)
      await until('document.querySelector("svg.source-map-image")')
      const geometry = await evaluate(`(()=>{const image=document.querySelector('svg.source-map-image'),r=image.getBoundingClientRect(),v=image.viewBox.baseVal;return{width:v.width,height:v.height,ratio:r.width/r.height,
        fits:[...document.querySelectorAll('.source-map-answer input')].every(input=>{const b=input.getBoundingClientRect();return b.left>=r.left-1&&b.right<=r.right+1&&b.top>=r.top&&b.bottom<=r.bottom+1})}})()`)
      assert.deepEqual([geometry.width, geometry.height], index === 3 ? [924, 1023] : [815, 682])
      assert.ok(Math.abs(geometry.ratio - geometry.width / geometry.height) < .002, 'Original image aspect ratio is unchanged')
      assert.equal(geometry.fits, true, `${width}px: every answer field stays inside its original map`)
      if (index === 3) {
        const workspace = await evaluate(`(()=>{const map=document.querySelector('svg.source-map-image').getBoundingClientRect(),fields=document.querySelector('.source-word-map-fields').getBoundingClientRect();return {height:map.height,sideBySide:fields.left>=map.right,fields:[...document.querySelectorAll('[data-map-question]')].every(input=>input.getBoundingClientRect().width>=100)};})()`)
        assert.ok(workspace.height <= 900 - 180 + 1, 'The complete Library plan fits vertically')
        assert.equal(workspace.fields, true, 'Answers retain a readable width')
        if (width === 1366) assert.equal(workspace.sideBySide, true, 'Complete plan and answer panel remain visible together')
        if (width === 1366) {
          await send('Emulation.setDeviceMetricsOverride', { width, height: 630, deviceScaleFactor: 1, mobile: false })
          assert.ok(await evaluate('document.querySelector(".source-word-map").getBoundingClientRect().height <= 480'), 'The entire map and all five answers also fit a short test viewport')
          await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false })
        }
      }
      if (width === 1366) {
        const difference = await evaluate(`(async()=>{
          const svg=document.querySelector('svg.source-map-image').cloneNode(true),w=svg.viewBox.baseVal.width,h=svg.viewBox.baseVal.height;
          svg.setAttribute('xmlns','http://www.w3.org/2000/svg');svg.setAttribute('width',w);svg.setAttribute('height',h);svg.removeAttribute('class');
          const vector=new Image(),original=new Image(),url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'}));
          vector.src=url;original.src='${index === 3 ? '/images/ielts-telegram-16428-image-1.png' : '/images/ielts-telegram-16539-image-1.jpg'}';
          await Promise.all([vector.decode(),original.decode()]);const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');
          ctx.drawImage(original,0,0);const expected=ctx.getImageData(0,0,w,h).data;ctx.clearRect(0,0,w,h);ctx.drawImage(vector,0,0);const actual=ctx.getImageData(0,0,w,h).data;
          let difference=0,count=0;for(let i=${index === 3 ? 30 : 0}*w*4;i<actual.length;i++){if(i%4===3)continue;difference+=Math.abs(actual[i]-expected[i]);count++;}
          URL.revokeObjectURL(url);return difference/count;
        })()`)
        assert.ok(difference < (index === 3 ? .001 : 1), `Source geometry, lettering and details match the original (${difference} mean channel difference)`)
      }
      await screenshot(`map-${index + 31}-${width}`)
    }
  }
  await evaluate('localStorage.clear()')
  await show('listening', 3, 1)
  await evaluate(`document.querySelector('[data-map-question="tg-l34-q16"]').focus()`)
  await send('Input.insertText', { text: 'Conference Centre' })
  await until(`window.savedAnswers['tg-l34-q16']==='Conference Centre'`)
  const mapBefore = await evaluate(`(()=>{const r=document.querySelector('svg.source-map-image').getBoundingClientRect();return {top:r.top,left:r.left,height:r.height};})()`)
  await evaluate(`window.beforeInput=document.activeElement;window.tick()`)
  assert.equal(await evaluate('document.activeElement===window.beforeInput'), true, 'Clock rerenders retain input focus')
  assert.deepEqual(await evaluate(`(()=>{const r=document.querySelector('svg.source-map-image').getBoundingClientRect();return {top:r.top,left:r.left,height:r.height};})()`), mapBefore, 'Typing and timer updates do not move or resize the plan')
  await send('Page.reload')
  await until(`document.querySelector('[data-map-question="tg-l34-q16"]')?.value==='Conference Centre'`)
  await show('listening', 4, 1)
  assert.equal(await evaluate('document.querySelector(".source-map-answer")'), null, 'Community Centre has no map overlays')
  await evaluate(`(()=>{const n=document.querySelector('[data-map-answer-select="tg-l35-q15"]');n.focus();n.value='A';n.dispatchEvent(new Event('change',{bubbles:true}));})()`)
  await until(`window.savedAnswers['tg-l35-q15']==='A'`)
  assert.equal(await evaluate(`document.querySelector('select[data-source-question="tg-l35-q15"]')`), null)
  await show('listening', 4, 1, true, true)
  assert.equal(await evaluate(`document.querySelector('[data-map-answer-select="tg-l35-q15"]').disabled`), true)
  assert.equal(await evaluate(`document.querySelector('[data-map-answer-select="tg-l35-q15"]').value`), 'A')
  assert.ok(await evaluate(`document.querySelector('.source-map-question-correct').textContent.includes('C')`))
  await screenshot('map-35-review')
  await show('listening', 4, 1, true, false)
  assert.equal(await evaluate('document.querySelector(".source-map-question-correct")'), null)
  assert.deepEqual(exceptions, [], 'No browser runtime errors')
  console.log('PASS: all 35 source sections at 1366/390/320px; original map geometry, real typing, reload, focus and review')
} finally {
  if (socket?.readyState === WebSocket.OPEN) await new Promise(resolve => { socket.send(JSON.stringify({ id: 999999, method: 'Browser.close' })); setTimeout(resolve, 400) })
  socket?.close(); browser.kill()
  await Promise.race([exited, new Promise(resolve => setTimeout(resolve, 3000))])
  await new Promise(resolve => server.close(resolve))
  assert.ok(resolve(directory).startsWith(resolve(tmpdir()) + sep))
  await rm(directory, { recursive: true, force: true, maxRetries: 15, retryDelay: 200 })
}
