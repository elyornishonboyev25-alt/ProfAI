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
const requireBackend = createRequire(new URL('../backend/package.json', import.meta.url))
const WebSocket = requireBackend('ws')
const directory = await mkdtemp(join(tmpdir(), 'profai-intro-browser-'))
const screenshots = resolve('tmp/full-mock-intro-browser')
await mkdir(screenshots, { recursive: true })
const source = `
  import React from 'react'; import {createRoot} from 'react-dom/client';
  import {MemoryRouter,Routes,Route} from 'react-router-dom';
  import FullMockSectionGate from './src/components/ielts/FullMockSectionGate';
  import MockIELTS from './src/pages/MockIELTS'; import MockIELTSRun from './src/pages/MockIELTSRun';
  import {saveFullMockSectionResult,fullMockLaunchState,getFullMockById} from './src/utils/ieltsMockCatalog';
  import {accountStorage} from './src/utils/accountStorage';
  const root=createRoot(document.getElementById('root'));
  window.showSection=(section)=>{
    localStorage.clear();const mock=getFullMockById('full-mock-1');
    for(const item of mock.sections){if(item.key===section)break;saveFullMockSectionResult(mock.id,item.key,{band:7,testId:'qa',completedAt:'2026-10-12'})}
    const route=mock.sections.find(s=>s.key===section);
    root.render(<MemoryRouter key={section} initialEntries={[{pathname:route.launchPath,state:fullMockLaunchState(mock.id,section)}]}><Routes>
      <Route path='/test/:type/:id' element={<FullMockSectionGate><div data-runner>Exam has started</div></FullMockSectionGate>}/>
      <Route path='/ielts/:section/test/:id' element={<FullMockSectionGate><div data-runner>Exam has started</div></FullMockSectionGate>}/>
      <Route path='/mock/ielts/:mockId' element={<MockIELTSRun/>}/>
    </Routes></MemoryRouter>);
  };
  window.showCatalog=()=>{localStorage.clear();root.render(<MemoryRouter key='catalog' initialEntries={['/mock/ielts']}><Routes><Route path='/mock/ielts' element={<MockIELTS embedded/>}/><Route path='/mock/ielts/:mockId' element={<MockIELTSRun/>}/><Route path='/test/:type/:id' element={<FullMockSectionGate><div data-runner>Exam has started</div></FullMockSectionGate>}/></Routes></MemoryRouter>)};
  window.showSection('listening');
`
const bundle = await build({ stdin: { contents: source, loader: 'tsx', resolveDir: process.cwd() }, bundle: true, write: false, outfile: join(directory, 'fixture.js'), format: 'iife', tsconfig: 'tsconfig.json', define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"production"' }, loader: { '.jpg': 'dataurl', '.png': 'dataurl' } })
const css = (await postcss([tailwindcss()]).process(await readFile('src/index.css', 'utf8'), { from: 'src/index.css' })).css + (bundle.outputFiles.find(file => file.path.endsWith('.css'))?.text ?? '')
const server = createServer(async (req, res) => {
  if (req.url === '/') { res.setHeader('Content-Type', 'text/html'); res.end(`<meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><div id="root"></div><script src="/fixture.js"></script>`); return }
  if (req.url === '/fixture.js') { res.setHeader('Content-Type', 'text/javascript'); res.end(bundle.outputFiles.find(file => file.path.endsWith('.js')).text); return }
  const media = req.url?.match(/^\/media\/ielts-intros\/(listening|reading|writing|speaking)\.webm$/)
  if (media) {
    const data = await readFile(resolve('public/media/ielts-intros', media[1]+'.webm'))
    res.setHeader('Content-Type', 'video/webm'); res.setHeader('Accept-Ranges', 'bytes')
    const range = req.headers.range?.match(/^bytes=(\d+)-(\d*)$/)
    if (range) {
      const start = Number(range[1]), end = range[2] ? Math.min(Number(range[2]), data.length - 1) : data.length - 1
      res.writeHead(206, { 'Content-Range': `bytes ${start}-${end}/${data.length}`, 'Content-Length': end - start + 1 }); res.end(data.subarray(start, end + 1))
    } else { res.setHeader('Content-Length', data.length); res.end(data) }
    return
  }
  res.writeHead(404); res.end()
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const browser = spawn(process.env.IELTS_INTRO_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--autoplay-policy=no-user-gesture-required', '--remote-debugging-port=0', '--user-data-dir='+directory, 'about:blank'], { windowsHide: true, stdio: 'ignore' })
let socket
try {
  let port
  for (let n=0;n<100;n++) { try { port=(await readFile(join(directory,'DevToolsActivePort'),'utf8')).split('\n')[0]; break } catch {} await new Promise(resolve=>setTimeout(resolve,100)) }
  assert.ok(port,'Set IELTS_INTRO_BROWSER to a Chromium executable')
  const targets=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json()
  socket=new WebSocket(targets.find(target=>target.type==='page').webSocketDebuggerUrl)
  await new Promise(resolve=>socket.once('open',resolve))
  let id=0;const pending=new Map(), errors=[]
  socket.on('message',data=>{const message=JSON.parse(data);if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails);const call=pending.get(message.id);if(!call)return;clearTimeout(call.timeout);pending.delete(message.id);message.error?call.reject(message.error):call.resolve(message.result)})
  const send=(method,params={})=>new Promise((resolve,reject)=>{const requestId=++id;const timeout=setTimeout(()=>{pending.delete(requestId);reject(new Error(method))},20000);pending.set(requestId,{resolve,reject,timeout});socket.send(JSON.stringify({id:requestId,method,params}))})
  const evaluate=async(expression)=>{const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});assert.ok(!result.exceptionDetails,JSON.stringify(result.exceptionDetails));return result.result.value}
  const until=async(expression)=>{for(let n=0;n<150;n++){if(await evaluate(expression))return;await new Promise(resolve=>setTimeout(resolve,100))}throw new Error('Timed out: '+expression+' '+JSON.stringify(errors)+' '+await evaluate('document.body.innerText'))}
  await send('Runtime.enable')
  await send('Emulation.setDeviceMetricsOverride',{width:1366,height:900,deviceScaleFactor:1,mobile:false})
  await send('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/`})
  await until('!!document.querySelector("video")')
  for(const section of ['listening','reading','writing','speaking']) {
    if(section!=='listening')await evaluate(`window.showSection('${section}')`)
    await until(`document.querySelector('video')?.getAttribute('src').includes('${section}.webm') && document.querySelector('video').readyState>=2`)
    const data=await evaluate(`(async()=>{const video=document.querySelector('video');video.pause();const context=new AudioContext();const buffer=await context.decodeAudioData(await(await fetch(video.src)).arrayBuffer());const samples=buffer.getChannelData(0);let energy=0;for(const v of samples)energy+=v*v;await context.close();return {duration:video.duration,width:video.videoWidth,height:video.videoHeight,rms:Math.sqrt(energy/samples.length),audioDuration:buffer.duration}})()`)
    assert.ok(data.duration>=23.5&&data.duration<=24.5,section+': duration '+data.duration)
    assert.deepEqual([data.width,data.height],[1280,720])
    assert.ok(data.rms>.01,section+': narration must be audible')
    assert.ok(data.audioDuration>=16,section+': four narrated scenes are present '+JSON.stringify(data))
    await evaluate(`document.querySelector('video').currentTime=13`)
    await until('document.querySelector("video").currentTime>=13 && !document.querySelector("video").seeking')
    assert.equal(await evaluate(`document.querySelector('.full-mock-intro-caption strong').textContent`),section==='listening'?'Follow the word limit':section==='reading'?'Move between questions':section==='writing'?'Task 2 · at least 250 words':'Part 2 · your long turn')
    const screenshot=await send('Page.captureScreenshot',{format:'png'})
    await writeFile(join(screenshots,section+'.png'),Buffer.from(screenshot.data,'base64'))
    for(const [width,height] of [[1366,900],[920,500],[768,1024],[390,844],[320,568]]) {
      await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<600})
      const layout=await evaluate(`(()=>{const button=document.querySelector('.full-mock-intro-start');button.scrollIntoView({block:'center',behavior:'instant'});const r=button.getBoundingClientRect();return {fits:document.documentElement.scrollWidth<=innerWidth+1,visible:r.top>=0&&r.bottom<=innerHeight,height:r.height}})()`)
      assert.ok(layout.fits&&layout.visible&&layout.height>=40,section+': responsive controls '+width+'x'+height+JSON.stringify(layout))
    }
    await send('Emulation.setDeviceMetricsOverride',{width:1366,height:900,deviceScaleFactor:1,mobile:false})
    await evaluate(`document.querySelector('video').currentTime=23.7;document.querySelector('video').play()`)
    await until(`document.querySelector('.full-mock-intro-start').textContent.includes('Start ')`)
    assert.equal(await evaluate('!!document.querySelector("[data-runner]")'),false)
    await evaluate(`document.querySelector('.full-mock-intro-start').click()`)
    await until('!!document.querySelector("[data-runner]")')
    console.log('PASS: '+section+' '+data.duration.toFixed(2)+'s, 720p, audible English track, synced captions, five responsive sizes, native ended and Start')
  }
  await evaluate('window.showCatalog()')
  await until('!!document.querySelector("button.mock-ielts-glass-card")')
  await evaluate('document.querySelector("button.mock-ielts-glass-card").click()')
  await until('!!document.querySelector("video")')
  assert.equal(await evaluate('!!document.fullscreenElement'),true,'Open enters browser fullscreen')
  await evaluate(`document.querySelector('.full-mock-intro-header button').click()`)
  await until('!!document.querySelector(".mock-run-start")')
  await evaluate('document.querySelector(".mock-run-start").click()')
  await until('!!document.querySelector("video")')
  assert.equal(await evaluate('!!document.fullscreenElement'),true,'Fullscreen survives route transitions')
  console.log('PASS: Open enters instructions immediately; native browser fullscreen persists through overview and section Start')
} finally {
  socket?.close();browser.kill();server.close();await new Promise(resolve=>setTimeout(resolve,600))
  await rm(directory,{recursive:true,force:true,maxRetries:5,retryDelay:300})
}
