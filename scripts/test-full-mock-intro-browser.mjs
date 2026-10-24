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
  window.showCompleted=(catalog=false)=>{localStorage.clear();const mock=getFullMockById('full-mock-1');for(const [n,item]of mock.sections.entries())saveFullMockSectionResult(mock.id,item.key,{band:[7,7,6.5,7.5][n],testId:item.launchPath.split('/').pop(),completedAt:'2026-10-12',...(n<2?{result:{testId:'qa',date:'2026-10-12',score:7,correctAnswers:32-n*2,totalQuestions:40,answers:{},timeSpent:1800}}:{review:[{label:n===2?'Task 1':'Your answer',response:'Recorded response',feedback:'Recorded feedback'}]})});root.render(<MemoryRouter key={'completed-'+Date.now()} initialEntries={[catalog?'/mock/ielts':'/mock/ielts/full-mock-1']}><Routes><Route path='/mock/ielts' element={<MockIELTS embedded/>}/><Route path='/mock/ielts/:mockId' element={<MockIELTSRun/>}/><Route path='/test/:type/:id' element={<FullMockSectionGate><div data-runner>Exam has started</div></FullMockSectionGate>}/></Routes></MemoryRouter>)};
  window.showSection('listening');
`
const bundle = await build({ stdin: { contents: source, loader: 'tsx', resolveDir: process.cwd() }, bundle: true, write: false, outfile: join(directory, 'fixture.js'), format: 'iife', tsconfig: 'tsconfig.json', define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"production"' }, loader: { '.jpg': 'dataurl', '.png': 'dataurl' } })
const css = (await postcss([tailwindcss()]).process(await readFile('src/index.css', 'utf8'), { from: 'src/index.css' })).css + (bundle.outputFiles.find(file => file.path.endsWith('.css'))?.text ?? '')
const server = createServer(async (req, res) => {
  if (req.url === '/') { res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(`<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><div id="root"></div><script src="/fixture.js"></script>`); return }
  if (req.url === '/fixture.js') { res.setHeader('Content-Type', 'text/javascript; charset=utf-8'); res.end(bundle.outputFiles.find(file => file.path.endsWith('.js')).text); return }
  res.writeHead(404); res.end()
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const browser = spawn(process.env.IELTS_INTRO_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--autoplay-policy=no-user-gesture-required', '--remote-debugging-port=0', '--user-data-dir='+directory, 'about:blank'], { windowsHide: true, stdio: 'ignore' })
let socket
try {
  let port
  for (let n=0;n<100;n++) { try { port=(await readFile(join(directory,'DevToolsActivePort'),'utf8')).split('\n')[0]; break } catch { /* Wait for Chromium to publish its debugging port. */ } await new Promise(resolve=>setTimeout(resolve,100)) }
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
  await until('!!document.querySelector("[data-runner]")')
  for (const section of ['listening','reading','writing','speaking']) {
    await evaluate("window.showSection('"+section+"')")
    await until('!!document.querySelector("[data-runner]")')
    assert.equal(await evaluate('!!document.querySelector("video")'),false,section+': no video before runner')
  }
  await evaluate('window.showCatalog()')
  await until('!!document.querySelector("button.mock-ielts-card-open")')
  await evaluate('document.querySelector("button.mock-ielts-card-open").click()')
  await until('!!document.querySelector("[data-runner]")')
  assert.equal(await evaluate('!!document.querySelector("video")'),false)
  assert.equal(await evaluate('!!document.fullscreenElement'),true,'Start enters browser fullscreen')
  console.log('PASS: four sections and catalog Start open directly without a video; native fullscreen works')
  await evaluate('window.showCompleted()')
  await until('document.querySelectorAll(".full-mock-result-card").length===4')
  assert.ok((await evaluate('document.querySelector(".mock-run-band").textContent')).startsWith('7.0'))
  assert.equal(await evaluate('!!document.querySelector("#full-mock-result-detail")'),false,'Only overall and cards initially')
  for(const [width,height]of [[1366,900],[920,500],[768,1024],[390,844],[320,568]]){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<600})
    assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'),'Results fit '+width)
    assert.ok(await evaluate('[...document.querySelectorAll(".full-mock-result-card")].every(card=>card.getBoundingClientRect().height>=44)'),'Cards remain tappable')
    const shot=await send('Page.captureScreenshot',{format:'png'})
    await writeFile(join(screenshots,'results-'+width+'.png'),Buffer.from(shot.data,'base64'))
  }
  await send('Emulation.setDeviceMetricsOverride',{width:1366,height:900,deviceScaleFactor:1,mobile:false})
  await send('Page.bringToFront')
  for(const section of ['listening','reading','writing','speaking']){
    await evaluate("document.getElementById('result-card-"+section+"').focus()")
    assert.equal(await evaluate('document.activeElement.id'),'result-card-'+section)
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r',unmodifiedText:'\r'})
    await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13})
    await until('!!document.querySelector("#full-mock-result-detail")')
    assert.equal(await evaluate("document.getElementById('result-card-"+section+"').getAttribute('aria-expanded')"),'true')
    assert.ok((await evaluate('document.querySelector(".mock-run-band").textContent')).startsWith('7.0'))
    for(const [width,height]of [[1366,900],[390,844],[320,568]]){
      await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<600})
      assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'),section+' review fits '+width)
    }
    await evaluate(`document.querySelector('[aria-label="Close section review"]').click()`)
    assert.equal(await evaluate('!!document.querySelector("#full-mock-result-detail")'),false)
    assert.equal(await evaluate('document.activeElement.id'),'result-card-'+section)
  }
  await evaluate('window.showCompleted()')
  await until('document.querySelectorAll(".full-mock-result-card").length===4')
  assert.equal(await evaluate('!!document.querySelector("#full-mock-result-detail")'),false,'Reopening a saved result returns to overall')
  await evaluate('window.showCompleted(true)')
  await until('!!document.querySelector(".mock-ielts-retake")')
  await evaluate('document.querySelector(".mock-ielts-retake").click()')
  await until('!!document.querySelector("[data-runner]")')
  assert.equal(await evaluate('!!document.querySelector("video")'),false)
  assert.equal(errors.length,0,JSON.stringify(errors))
  console.log('PASS: overall and four cards; five responsive sizes; keyboard reviews and focus recovery; saved report; immediate retake')
} finally {
  socket?.close()
  const stopped = browser.exitCode !== null ? Promise.resolve() : new Promise(resolve => browser.once('exit', resolve))
  browser.kill();server.close()
  await Promise.race([stopped, new Promise(resolve => setTimeout(resolve, 2000))])
  await new Promise(resolve=>setTimeout(resolve,600))
  await rm(directory,{recursive:true,force:true,maxRetries:10,retryDelay:500})
}
