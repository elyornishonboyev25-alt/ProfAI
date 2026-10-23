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
const mediaMetadata = JSON.parse(await readFile('src/data/fullMockIntroMedia.json', 'utf8'))
const catalog = JSON.parse(await readFile('src/data/fullMockIntros.json', 'utf8'))
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
  window.showCompleted=()=>{localStorage.clear();const mock=getFullMockById('full-mock-1');for(const [n,item]of mock.sections.entries())saveFullMockSectionResult(mock.id,item.key,{band:[7,7,6.5,7.5][n],testId:item.launchPath.split('/').pop(),completedAt:'2026-10-12',...(n<2?{result:{testId:'qa',date:'2026-10-12',score:7,correctAnswers:32-n*2,totalQuestions:40,answers:{},timeSpent:1800}}:{review:[{label:n===2?'Task 1':'Your answer',response:'Recorded response',feedback:'Recorded feedback'}]})});root.render(<MemoryRouter key={'completed-'+Date.now()} initialEntries={['/mock/ielts']}><Routes><Route path='/mock/ielts' element={<MockIELTS embedded/>}/><Route path='/mock/ielts/:mockId' element={<MockIELTSRun/>}/><Route path='/test/:type/:id' element={<FullMockSectionGate><div data-runner>Exam has started</div></FullMockSectionGate>}/></Routes></MemoryRouter>)};
  window.showSection('listening');
`
const bundle = await build({ stdin: { contents: source, loader: 'tsx', resolveDir: process.cwd() }, bundle: true, write: false, outfile: join(directory, 'fixture.js'), format: 'iife', tsconfig: 'tsconfig.json', define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"production"' }, loader: { '.jpg': 'dataurl', '.png': 'dataurl' } })
const css = (await postcss([tailwindcss()]).process(await readFile('src/index.css', 'utf8'), { from: 'src/index.css' })).css + (bundle.outputFiles.find(file => file.path.endsWith('.css'))?.text ?? '')
const server = createServer(async (req, res) => {
  if (req.url === '/') { res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(`<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><div id="root"></div><script src="/fixture.js"></script>`); return }
  if (req.url === '/fixture.js') { res.setHeader('Content-Type', 'text/javascript; charset=utf-8'); res.end(bundle.outputFiles.find(file => file.path.endsWith('.js')).text); return }
  const media = req.url?.match(/^\/media\/ielts-intros\/(listening|reading|writing|speaking)\.webm(?:\?v=4)?$/)
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
    const info = mediaMetadata[section]
    assert.ok(Math.abs(data.duration - info.duration) < 1, section+': media duration matches audio-derived chapters '+data.duration)
    assert.equal(info.playbackRate, 1, 'Narration is never accelerated')
    assert.equal(info.voice, 'kokoro-bf_emma', 'All sections use the improved British English neural narration')
    assert.equal(info.frameRate, 60)
    assert.ok(info.renderStats.averageFps >= 50, section + ': export maintains smooth cursor cadence')
    assert.equal(info.scenes.length, catalog[section].scenes.length)
    const wordCount = catalog[section].scenes.reduce((total,scene)=>total+scene.text.split(/\s+/).length,0)
    const spokenMinutes = info.scenes.reduce((total,scene)=>total+scene.audioDuration,0)/60
    assert.ok(wordCount/spokenMinutes>=95 && wordCount/spokenMinutes<=190, section+': natural speaking speed '+wordCount/spokenMinutes)
    assert.deepEqual([data.width,data.height],[1280,720])
    assert.ok(data.rms>.01,section+': narration must be audible')
    assert.ok(data.audioDuration>=info.duration-1,section+': complete narrated scenes are present '+JSON.stringify(data))
    const cadence = await evaluate(`(async()=>{const video=document.querySelector('video');const seeked=new Promise(r=>video.addEventListener('seeked',r,{once:true}));video.currentTime=1;await seeked;await video.play();await new Promise(r=>setTimeout(r,500));const start=performance.now(),before=video.getVideoPlaybackQuality();await new Promise(r=>setTimeout(r,2500));video.pause();const after=video.getVideoPlaybackQuality();return{fps:(after.totalVideoFrames-before.totalVideoFrames)/((performance.now()-start)/1000),dropped:after.droppedVideoFrames-before.droppedVideoFrames}})()`)
    assert.ok(cadence.fps >= 40, section + ': encoded video contains smooth frame cadence ' + JSON.stringify(cadence))
    const seekTime = info.scenes[2].start + 1
    await evaluate(`document.querySelector('video').currentTime=${seekTime}`)
    await until(`Math.abs(document.querySelector('video').currentTime-${seekTime})<.05 && !document.querySelector('video').seeking`)
    assert.equal(await evaluate(`document.querySelector('.full-mock-intro-caption strong').textContent`),catalog[section].scenes[2].title)
    const screenshot=await send('Page.captureScreenshot',{format:'png'})
    await writeFile(join(screenshots,section+'.png'),Buffer.from(screenshot.data,'base64'))
    if (section === 'listening' || section === 'reading') {
      const highlightIndex = catalog[section].scenes.findIndex(scene => scene.view === 'highlight')
      const chapter = info.scenes[highlightIndex]
      assert.equal(info.source, 'IELTSReadingInterface', 'Tutorial records the live website component')
      assert.equal(info.cursorMotion, 'continuous-smootherstep', 'Cursor follows continuous paths independently of screenshot cadence')
      const motion = info.motionChecks.find(check => check.view === 'highlight')
      assert.ok(motion?.point && motion.stages.length === 3, 'Native cursor demonstration records all annotation stages')
      assert.ok(info.motionChecks.some(check => check.view === 'answer' && check.stages.some(stage => stage.stage === 'answered')), 'Real answer entry changes the answered count')
      assert.ok(info.motionChecks.some(check => check.view === 'finish' && check.stages.some(stage => stage.stage === 'submitted')), 'Submit confirmation ends the section and opens the next skill')
      const colors = []
      for (const {stage, fraction} of motion.stages) {
        const time = chapter.start + (chapter.end - chapter.start) * fraction
        await evaluate(`document.querySelector('video').currentTime=${time}`)
        await until(`!document.querySelector('video').seeking && Math.abs(document.querySelector('video').currentTime-${time})<.05`)
        await new Promise(resolve => setTimeout(resolve, 300))
        colors.push(await evaluate(`(()=>{const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=720;const context=canvas.getContext('2d');context.drawImage(document.querySelector('video'),0,0);return [...context.getImageData(${Math.round(motion.point.x)},${Math.round(motion.point.y)},1,1).data].slice(0,3)})()`))
        const frame = await send('Page.captureScreenshot', {format:'png'})
        await writeFile(join(screenshots,`${section}-${stage}.png`),Buffer.from(frame.data,'base64'))
      }
      assert.ok(colors[0][2] > colors[0][0] + 30, section+': pointer drag creates blue selection '+JSON.stringify(colors))
      assert.ok(colors[1][0] > 200 && colors[1][1] > 150 && colors[1][2] < 190, section+': Highlight changes selection to yellow '+JSON.stringify(colors))
      assert.ok(colors[2].every(value => value > 230), section+': Delete highlight restores plain text '+JSON.stringify(colors))
      console.log('PASS: '+section+' native video demonstrates selection, highlight and removal')
    }
    for(const [width,height] of [[1366,900],[920,500],[768,1024],[390,844],[320,568]]) {
      await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<600})
      const layout=await evaluate(`(()=>{const button=document.querySelector('.full-mock-intro-start');button.scrollIntoView({block:'center',behavior:'instant'});const r=button.getBoundingClientRect();return {fits:document.documentElement.scrollWidth<=innerWidth+1,visible:r.top>=0&&r.bottom<=innerHeight,height:r.height}})()`)
      assert.ok(layout.fits&&layout.visible&&layout.height>=40,section+': responsive controls '+width+'x'+height+JSON.stringify(layout))
    }
    await send('Emulation.setDeviceMetricsOverride',{width:1366,height:900,deviceScaleFactor:1,mobile:false})
    await evaluate(`document.querySelector('video').currentTime=${data.duration-.25};document.querySelector('video').play()`)
    await until('!!document.querySelector("[data-runner]")')
    assert.equal(await evaluate(`!!document.querySelector('.full-mock-intro-skip')`),false)
    assert.equal(await evaluate('!!document.querySelector("video")'),false)
    console.log('PASS: '+section+' '+data.duration.toFixed(2)+'s, 720p, audible English track, synced captions, five responsive sizes, video completion automatically starts test')
  }
  await evaluate('window.showCatalog()')
  await until('!!document.querySelector("button.mock-ielts-card-open")')
  await evaluate('document.querySelector("button.mock-ielts-card-open").click()')
  await until('!!document.querySelector("video")')
  assert.equal(await evaluate('!!document.fullscreenElement'),true,'Open enters browser fullscreen')
  await evaluate(`document.querySelector('.full-mock-intro-header button').click()`)
  await until('!!document.querySelector(".mock-run-start")')
  await evaluate('document.querySelector(".mock-run-start").click()')
  await until('!!document.querySelector("video")')
  assert.equal(await evaluate('!!document.fullscreenElement'),true,'Fullscreen survives route transitions')
  console.log('PASS: Open enters instructions immediately; native browser fullscreen persists through overview and section Start')
  await evaluate('window.showCompleted()')
  await until('!!document.querySelector(".mock-ielts-retake")')
  const cardSize=await evaluate(`(()=>{const card=document.querySelector('.mock-ielts-glass-card'),retake=card.querySelector('.mock-ielts-retake'),review=card.querySelector('.mock-ielts-card-open');const a=card.getBoundingClientRect(),x=retake.getBoundingClientRect(),y=review.getBoundingClientRect();retake.style.display='none';const b=card.getBoundingClientRect();retake.style.display='';return {before:a.height,after:b.height,sameRow:Math.abs(x.top-y.top)<2,left:x.right<=y.left}})()`)
  assert.ok(Math.abs(cardSize.before-cardSize.after)<1&&cardSize.sameRow&&cardSize.left,'Retake sits beside Review without increasing the card height')
  await evaluate('document.querySelector(".mock-ielts-card-open").click()')
  await until('document.querySelectorAll("[role=tab]").length===4')
  assert.ok((await evaluate('document.querySelector(".mock-run-band").textContent')).startsWith('7.0'))
  for(const section of ['listening','reading','writing','speaking']){
    await evaluate(`document.getElementById('result-tab-${section}').click()`)
    assert.equal(await evaluate('document.querySelector("[role=tabpanel]").getAttribute("aria-labelledby")'),'result-tab-'+section)
    assert.ok((await evaluate('document.querySelector(".mock-run-band").textContent')).startsWith('7.0'),'Overall remains visible while changing skill cards')
  }
  for(const [width,height]of [[1366,900],[390,844],[320,568]]){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<600})
    assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'),'Results fit '+width)
    const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(join(screenshots,'results-'+width+'.png'),Buffer.from(shot.data,'base64'))
  }
  await send('Emulation.setDeviceMetricsOverride',{width:1366,height:900,deviceScaleFactor:1,mobile:false})
  await evaluate('window.showCompleted()');await until('!!document.querySelector(".mock-ielts-retake")');await evaluate('document.querySelector(".mock-ielts-retake").click()');await until('!!document.querySelector("video")')
  assert.ok((await evaluate('document.querySelector("video").src')).includes('listening.webm'))
  assert.equal(await evaluate('!!document.querySelector("[data-runner]")'),false)
  console.log('PASS: Retake beside Review keeps card dimensions; completed review shows overall and four responsive section cards; Retake starts fresh Listening instructions')
} finally {
  socket?.close();browser.kill();server.close();await new Promise(resolve=>setTimeout(resolve,600))
  await rm(directory,{recursive:true,force:true,maxRetries:5,retryDelay:300})
}
