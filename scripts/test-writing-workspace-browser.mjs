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
const directory = await mkdtemp(join(tmpdir(), 'profai-writing-workspace-'))
const source = `
  import React from 'react'; import { createRoot } from 'react-dom/client'; import { MemoryRouter } from 'react-router-dom';
  import i18n from './src/i18n'; i18n.changeLanguage('en');
  import Full from './src/components/IELTSWritingFullTestInterface'; import Practice from './src/components/IELTSWritingTestInterface';
  import FullscreenToggle from './src/components/common/FullscreenToggle';
  import { getWritingFullTestById } from './src/data/writingTestData'; import { accountStorageFor } from './src/utils/accountStorage';
  const root=createRoot(document.getElementById('root')); let run=0;
  let test=getWritingFullTestById('writing-full-4'); const storage=accountStorageFor('guest');
  window.sessionKey='profai:writing:draft:guest:'+test.id+':session';
  window.getSession=()=>JSON.parse(storage.getItem(window.sessionKey));
  window.show=(practice=false, timed=true)=>{
    const key=practice?'profai:writing:draft:guest:'+test.tasks[0].id+':session':window.sessionKey;
    if(!storage.getItem(key))storage.setItem(key,JSON.stringify({timerEnabled:timed,deadline:timed?Date.now()+3600000:null}));
    root.render(<MemoryRouter key={++run} initialEntries={['/ielts/writing/test/'+test.id]}><div className='app-shell relative min-h-screen'><div className='relative z-10 flex min-h-screen flex-col'><div className='flex min-h-0 flex-1'><main className='workspace-main min-w-0 w-full flex-1 overflow-x-clip'><div className='flex flex-col min-h-full min-h-[calc(100vh-80px)]'><div className='arena-route h-full'>
      {practice?<Practice task={test.tasks[0]} onExit={()=>{}}/>:<Full fullTest={test} onExit={()=>{}}/>}</div></div></main></div></div><FullscreenToggle/>
    </div></MemoryRouter>);
  };
  window.showOther=()=>root.render(<MemoryRouter key={++run} initialEntries={['/ielts/reading/test/1']}><FullscreenToggle/></MemoryRouter>);
  window.showImported=()=>{test=getWritingFullTestById('writing-full-32');window.sessionKey='profai:writing:draft:guest:'+test.id+':session';window.show(false,false)};
  window.show();

import './src/styles/premium-identity.css';import './src/styles/liquid.css';import './src/styles/liquid-completion.css';import './src/styles/workspace-refinement.css';import './src/styles/ielts-exam-workspace.css';import './src/styles/ivygoo-glass.css';
`

const bundle = await build({ stdin: { contents: source, loader: 'tsx', resolveDir: process.cwd() }, bundle: true, write: false, external: ['/assets/*'], outfile: 'tmp/workspace-fixture.js', format: 'iife', tsconfig: 'tsconfig.json', define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"production"' }, loader: { '.jpg': 'dataurl', '.png': 'dataurl' } })
const css = (await postcss([tailwindcss()]).process(await readFile('src/index.css', 'utf8'), { from: 'src/index.css' })).css + bundle.outputFiles.filter(file => file.path.endsWith('.css')).map(file => file.text).join('\n')
const server = createServer((req, res) => {
  res.setHeader('Content-Type', (req.url === '/fixture.js' ? 'application/javascript' : req.url === '/fixture.css' ? 'text/css' : 'text/html') + '; charset=utf-8')
  res.end(req.url === '/fixture.js' ? bundle.outputFiles.find(file => file.path.endsWith('.js')).text : req.url === '/fixture.css' ? css : '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>')
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const browser = spawn(process.env.WRITING_TEST_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', '--user-data-dir=' + directory, 'about:blank'], { windowsHide: true, stdio: 'ignore' })
const exited = new Promise(resolve => { browser.once('exit', resolve); browser.once('error', resolve) })
let socket
try {
  let port
  for (let attempt = 0; attempt < 100; attempt++) {
    try { port = (await readFile(join(directory, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break } catch { /* Browser startup. */ }
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  assert.ok(port, 'Set READING_TEST_BROWSER to an installed Chromium browser')
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
  socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl)
  await new Promise(resolve => socket.once('open', resolve))
  let id = 0
  const pending = new Map(), exceptions = [], dialogs = []
  let acceptNativeDialog = false
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const requestId = ++id
    const timeout = setTimeout(() => { pending.delete(requestId); reject(new Error(method)) }, 15000)
    pending.set(requestId, { resolve, reject, timeout })
    socket.send(JSON.stringify({ id: requestId, method, params }))
  })
  socket.on('message', data => {
    const message = JSON.parse(data), call = pending.get(message.id)
    if (message.method === 'Page.javascriptDialogOpening') {
      dialogs.push(message.params.type)
      void send('Page.handleJavaScriptDialog', { accept: acceptNativeDialog })
    }
    if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails)
    if (!call) return
    clearTimeout(call.timeout); pending.delete(message.id)
    if (message.error) call.reject(message.error); else call.resolve(message.result)
  })
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true })
    assert.ok(!result.exceptionDetails, JSON.stringify(result.exceptionDetails))
    return result.result.value
  }
  const until = async expression => {
    for (let attempt = 0; attempt < 100; attempt++) {
      if (await evaluate(`Boolean(${expression})`)) return
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    throw new Error(`Timed out: ${expression}; ${JSON.stringify(exceptions)}; ${JSON.stringify(await evaluate('({path:location.pathname,state:history.state,active:window.hasActiveTest?.(),events:window.fixtureHistoryEvents,dialog:!!document.querySelector("[role=alertdialog]"),text:document.body.textContent.slice(0,200)})'))}`)
  }
  const click = text => evaluate(`[...document.querySelectorAll('button')].find(node=>node.textContent.trim()===${JSON.stringify(text)}).click()`)
  await send('Runtime.enable')
  await send('Page.enable')
  await send('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/` })

  await until('window.show && document.querySelector(".writing-desk")');
  const screenshots=resolve('tmp/writing-workspace-browser'); await mkdir(screenshots,{recursive:true});
  const type=async value=>evaluate(`(()=>{const n=document.querySelector('textarea');const set=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set;set.call(n,${JSON.stringify(value)});n.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  for(const [width,height] of [[1366,900],[768,900],[390,844],[320,568]]){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<768});
    await evaluate('localStorage.clear();window.show()');
    await until('document.querySelector(".writing-desk textarea")');
    const layout=await evaluate(`(()=>{const f=document.querySelector('.writing-desk-footer').getBoundingClientRect();return {horizontal:document.documentElement.scrollWidth<=innerWidth+1,footer:f.bottom<=innerHeight+1&&f.top>0,floating:!!document.querySelector('.site-fullscreen-control'),fullscreen:document.querySelectorAll('.writing-fullscreen').length,source:document.querySelector('.writing-source-visual').innerHTML}})()`);
    if(!layout.footer) console.log(await evaluate(`(()=>{let n=document.querySelector('.writing-desk-footer'),items=[];while(n){const r=n.getBoundingClientRect(),c=getComputedStyle(n);items.push({node:n.className,top:r.top,height:r.height,min:c.minHeight,flex:c.flex,display:c.display,overflow:c.overflow});n=n.parentElement}return items})()`));
    assert.equal(layout.horizontal,true,width+'px no horizontal overflow');assert.equal(layout.footer,true,width+'px footer always visible');
    assert.equal(layout.floating,false,'No duplicate floating fullscreen');assert.equal(layout.fullscreen,1,'One working footer fullscreen control');
    const deadline=await evaluate('window.getSession().deadline');
    await evaluate(`document.querySelector('[aria-label="Increase response text size"]').click()`);
    assert.equal(await evaluate('getComputedStyle(document.querySelector("textarea")).fontSize'),'18px');
    assert.equal(await evaluate('document.querySelector(".writing-source-visual").innerHTML'),layout.source,'Font controls preserve original source');
    if(width>=768){
      await evaluate(`document.querySelector('[role=separator]').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}))`);
      await until(`document.querySelector('[role=separator]').getAttribute('aria-valuenow')==='52'`);
      assert.equal(await evaluate('document.querySelector(".writing-source-visual").innerHTML'),layout.source,'Resizing preserves original source');
      const divider=await evaluate(`(()=>{const r=document.querySelector('[role=separator]').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);
      await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,x:divider.x,y:divider.y});
      await send('Input.dispatchMouseEvent',{type:'mouseMoved',button:'left',buttons:1,x:divider.x+80,y:divider.y});
      await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,x:divider.x+80,y:divider.y});
      await until('Number(document.querySelector("[role=separator]").getAttribute("aria-valuenow"))>52');
    }else{
      await evaluate(`document.querySelectorAll('.writing-mobile-panels button')[1].click()`);
      await until('document.querySelector(".writing-response-pane").getClientRects().length>0');
      assert.ok(await evaluate('document.querySelector("textarea").getBoundingClientRect().height>140'),'Readable mobile writing area');
    }
    const answer=Array.from({length:151},(_,i)=>'word'+i).join(' ');await type(answer);
    await until('document.querySelector("[role=progressbar]").getAttribute("aria-valuenow")==="150"');
    assert.equal(await evaluate('document.querySelector("textarea").spellcheck'),false,'Exam editor disables spellcheck');
    await evaluate(`document.querySelector('[aria-label="Mark Task 1 for review"]').click()`);
    await click('Next: Task 2');await until('document.querySelector("textarea").value===""');
    if(width<768){assert.equal(await evaluate('document.querySelector(".writing-desk-body").dataset.mobilePanel'),'question');await evaluate(`document.querySelectorAll('.writing-mobile-panels button')[1].click()`);}
    await type('This is my Task 2 response.');
    await evaluate('document.querySelector(".writing-desk-tasks button").click()');await until(`document.querySelector('textarea').value===${JSON.stringify(answer)}`);
    assert.equal(await evaluate(`document.querySelector('[aria-label="Mark Task 1 for review"]').getAttribute('aria-pressed')`),'true');
    await evaluate(`document.querySelector('[aria-label="Hide remaining time"]').click()`);
    await until(`document.querySelector('[aria-label="Show remaining time"]')`);
    assert.equal(await evaluate('window.getSession().deadline'),deadline,'Hiding timer does not change deadline');
    await send('Page.reload');await until('window.show && document.querySelector("textarea")');
    assert.equal(await evaluate('document.querySelector("textarea").value'),answer,'Reload restores Task 1');
    assert.equal(await evaluate('window.getSession().deadline'),deadline,'Reload preserves original timer deadline');
    await evaluate('document.querySelectorAll(".writing-desk-tasks button")[1].click()');await until('document.querySelector("textarea").value==="This is my Task 2 response."');
    await click('Submit Full Test');await until('document.body.textContent.includes("Submit both responses?")');await click('Keep writing');
    assert.equal(await evaluate('document.querySelector("textarea").value'),'This is my Task 2 response.','Cancel submission retains answer');
    await evaluate('document.querySelector(".writing-desk-tasks button").click()');
    const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(join(screenshots,width+'-writing.png'),Buffer.from(shot.data,'base64'));
    if(width<768){await evaluate(`document.querySelectorAll('.writing-mobile-panels button')[1].click()`);const response=await send('Page.captureScreenshot',{format:'png'});await writeFile(join(screenshots,width+'-response.png'),Buffer.from(response.data,'base64'));}
    console.log('PASS: '+width+'px layout, original source, font size, panel resize/views, word counts, independent answers, bookmarks, reload deadline and submission confirmation');
  }
  await evaluate(`document.querySelector('.writing-fullscreen').click()`);await until('document.fullscreenElement');
  await evaluate(`document.querySelector('.writing-fullscreen').click()`);await until('!document.fullscreenElement');
  await evaluate('window.show(true,false)');await until('document.querySelector(".writing-practice-badge")');
  await evaluate(`document.querySelectorAll('.writing-mobile-panels button')[1].click()`);await type('Saved practice response.');
  await evaluate('window.show(true,false)');await until('document.querySelector("textarea")?.value==="Saved practice response."');
  assert.equal(await evaluate('Boolean(document.querySelector(".site-fullscreen-control"))'),false);
  await evaluate('window.showOther()');await until('document.querySelector(".site-fullscreen-control")');
  assert.deepEqual(exceptions,[],'No browser runtime errors');console.log('PASS: standalone practice persistence, fullscreen enter/exit, and other sections retain their fullscreen control');
  await send('Emulation.setDeviceMetricsOverride',{width:1366,height:900,deviceScaleFactor:1,mobile:false});
  await evaluate('window.showImported()');await until('document.querySelector("[data-supplied-writing-diagram=mobile-phone-sales]")');
  assert.equal(await evaluate('document.querySelector(".writing-source-visual").querySelector("image, img")'),null,'Test 32 uses native drawing');
  const controls=await evaluate(`(()=>{const b=document.querySelector('[aria-label="Enlarge Task 1 image"]').getBoundingClientRect();const s=document.querySelector('[data-supplied-writing-diagram=mobile-phone-sales]').getBoundingClientRect();return b.bottom<=s.top})()`);
  assert.equal(controls,true,'Enlarge control never covers chart labels');
  const imported=await send('Page.captureScreenshot',{format:'png'});await writeFile(join(screenshots,'1366-writing-test-32.png'),Buffer.from(imported.data,'base64'));
  await evaluate(`document.querySelector('[aria-label="Enlarge Task 1 image"]').click()`);await until('document.querySelector("[role=dialog] [data-supplied-writing-diagram=mobile-phone-sales]")');
  await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))`);await until('!document.querySelector("[role=dialog]")');
  assert.deepEqual(exceptions,[],'No runtime errors in imported test or enlargement');
  console.log('PASS: username-free Test 32 workspace and enlargement preserve chart labels');

} finally {
  if (socket?.readyState === WebSocket.OPEN) await new Promise(resolve => {
    socket.send(JSON.stringify({ id: 999999, method: 'Browser.close' }))
    setTimeout(resolve, 500)
  })
  socket?.close()
  browser.kill()
  await Promise.race([exited, new Promise(resolve => setTimeout(resolve, 3000))])
  await new Promise(resolve => server.close(resolve))
  assert.ok(resolve(directory).startsWith(resolve(tmpdir()) + sep))
  await rm(directory, { recursive: true, force: true, maxRetries: 15, retryDelay: 200 })
}
