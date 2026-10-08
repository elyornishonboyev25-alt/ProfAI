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
async function main() {
  assert.ok(process.env.SAT_TEST_BROWSER, 'Set SAT_TEST_BROWSER to an installed Chromium browser')
  const directory = await mkdtemp(join(tmpdir(), 'profai-sat-bank-browser-'))
  const source = `
    import React from 'react'; import {createRoot} from 'react-dom/client';
    import {MemoryRouter, Routes, Route, useLocation} from 'react-router-dom';
    import Bank from './src/pages/SATQuestionBank'; import Run from './src/pages/SATQuestionBankRun';
    import {useAuthStore} from './src/store/authStore';
    useAuthStore.setState({user:null});
    window.fullscreenRequests=0;
    document.documentElement.requestFullscreen=async()=>{window.fullscreenRequests++};
    function Location(){const l=useLocation();return <output data-location>{l.pathname}{l.search}</output>}
    createRoot(document.getElementById('root')).render(<MemoryRouter initialEntries={['/sat/question-bank?section=math&count=4']}>
      <Location/><Routes><Route path="/sat/question-bank" element={<Bank/>}/><Route path="/sat/question-bank/run/:setId" element={<Run/>}/></Routes>
    </MemoryRouter>);
  `
  const bundle = await build({ stdin: { contents: source, loader: 'tsx', resolveDir: process.cwd() }, bundle: true, write: false, format: 'iife', tsconfig: 'tsconfig.json', define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"production"' }, loader: { '.css': 'empty' } })
  const base = await readFile('src/index.css', 'utf8')
  const extras = await Promise.all(['src/pages/SATQuestionBank.css', 'src/pages/SATQuestionBankRun.css', 'src/components/sat/DesmosDrawer.css', 'src/components/sat/sat-exam-layout.css', 'src/components/sat/SATSourceContent.css'].map(file=>readFile(file,'utf8')))
  const css = (await postcss([tailwindcss()]).process(base, {from:'src/index.css'})).css + '\n' + extras.join('\n')
  const server = createServer(async (req,res)=>{
    if(req.url==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(`<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><div id="root"></div><script src="/fixture.js"></script>`)}
    else if(req.url==='/fixture.js'){res.setHeader('Content-Type','text/javascript; charset=utf-8');res.end(bundle.outputFiles[0].text)}
    else {
      const file=resolve('public', '.' + decodeURIComponent(new URL(req.url,'http://localhost').pathname))
      if(!file.startsWith(resolve('public')+'/')){res.writeHead(404);res.end();return}
      try {const content=await readFile(file);res.setHeader('Content-Type',file.endsWith('.svg')?'image/svg+xml':'image/png');res.end(content)}catch{res.writeHead(404);res.end()}
    }
  })
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve))
  const browser = spawn(process.env.SAT_TEST_BROWSER, ['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--user-data-dir='+directory,'about:blank'], {stdio:'ignore'})
  const exited = new Promise(resolve=>{browser.once('exit',resolve);browser.once('error',resolve)})
  let socket
  try {
    let port
    for (let n = 0; n < 100; n++) {
      try { port = (await readFile(join(directory, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break } catch { /* Starting browser. */ }
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    assert.ok(port, 'Set SPEAKING_TEST_BROWSER to an installed Chromium browser')
    const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
    socket = new WebSocket(targets.find((target) => target.type === 'page').webSocketDebuggerUrl)
    await new Promise((resolve) => socket.once('open', resolve))
    let id = 0
    const pending = new Map()
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const requestId = ++id
      const timeout = setTimeout(() => { pending.delete(requestId); reject(new Error(method)) }, 15000)
      pending.set(requestId, { resolve, reject, timeout })
      socket.send(JSON.stringify({ id: requestId, method, params }))
    })
    socket.on('message', (data) => {
      const diagnostic = JSON.parse(data)
      if(diagnostic.method==='Runtime.exceptionThrown') console.error('Browser exception:', JSON.stringify(diagnostic.params.exceptionDetails))
      const message = JSON.parse(data), call = pending.get(message.id)
      if (!call) return
      clearTimeout(call.timeout); pending.delete(message.id)
      if (message.error) call.reject(message.error); else call.resolve(message.result)
    })
    const evaluate = async (expression) => {
      const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true })
      assert.ok(!result.exceptionDetails, JSON.stringify(result.exceptionDetails))
      return result.result.value
    }
    const until = async (expression) => {
      for (let n = 0; n < 100; n++) {
        if (await evaluate(expression)) return
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
      throw new Error(`Timed out: ${expression}; ${await evaluate('document.documentElement.outerHTML.slice(-1500)')}`)
    }

    const clickLabel = label => evaluate(`document.querySelector('[aria-label="${label}"]').click()`)
    const clickText = text => evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='${text}').click()`)
    await send('Runtime.enable')
    await send('Page.enable')
    await send('Emulation.setDeviceMetricsOverride',{width:1366,height:768,deviceScaleFactor:1,mobile:false})
    await send('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/`})
    await until(`document.body?.innerText.includes('Start 4 questions')`)
    await clickText('Start 4 questions')
    await until(`!!document.querySelector('.sat-bank-run')`)
    assert.equal(await evaluate('window.fullscreenRequests'),1)
    assert.equal(await evaluate(`document.querySelector('.sat-bank-hero')===null`),true)
    await evaluate(`document.querySelector('[role="radio"]').click()`)
    await clickText('Mark for Review')
    await clickLabel('Open Desmos calculator')
    await until(`document.querySelector('iframe')!==null`)
    await evaluate(`window.calculatorFrame=document.querySelector('iframe');true`)
    const screenshots=join(directory,'screenshots');await mkdir(screenshots)
    for(const [width,height] of [[1366,768],[1024,640],[920,500],[768,1024],[390,844],[320,568]]) {
      await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<1024})
      await new Promise(resolve=>setTimeout(resolve,150))
      const layout=await evaluate(`(()=>{
        const panel=document.querySelector('.desmos-panel').getBoundingClientRect();
        const footer=document.querySelector('.sat-bank-run-footer').getBoundingClientRect();
        const close=document.querySelector('[aria-label="Close Desmos"]').getBoundingClientRect();
        const viewport=document.querySelector('.sat-bank-run-viewport');
        const canvas=document.querySelector('.sat-exam-canvas').getBoundingClientRect();
        return {horizontal:document.documentElement.scrollWidth<=innerWidth+1,panel:[panel.left,panel.top,panel.right,panel.bottom],footer:[footer.top,footer.bottom],close:[close.width,close.height],canvasRight:canvas.right,canvasWidth:canvas.width,framePreserved:window.calculatorFrame===document.querySelector('iframe'),paddingRight:parseFloat(getComputedStyle(viewport).paddingRight)};
      })()`)
      assert.equal(layout.horizontal,true,`${width}x${height}: horizontal overflow ${JSON.stringify(layout)}`)
      assert.ok(layout.panel[0]>=0 && layout.panel[1]>=0 && layout.panel[2]<=width+1 && layout.panel[3]<=layout.footer[0]+1,`${width}x${height}: calculator and footer stay reachable ${JSON.stringify(layout)}`)
      assert.ok(layout.close[0]>=36 && layout.close[1]>=36,'Calculator touch controls')
      assert.equal(layout.framePreserved,true)
      if(width>=900) assert.ok(layout.canvasRight<=layout.panel[0]+1,`Question and calculator must not overlap ${JSON.stringify(layout)}`)
      if(width>=900) {
        const before=await evaluate(`document.querySelector('.desmos-panel').getBoundingClientRect().width`)
        await evaluate(`document.querySelector('[role="separator"]').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));true`)
        await new Promise(resolve=>setTimeout(resolve,100))
        const resized=await evaluate(`document.querySelector('.desmos-panel').getBoundingClientRect().width`)
        assert.ok(resized<before,'Keyboard resize adjusts the calculator width')
        await evaluate(`document.querySelector('[role="separator"]').dispatchEvent(new MouseEvent('dblclick',{bubbles:true}));true`)
      }
      // Answers remain reachable in the question pane while the sheet is open.
      const reachable=await evaluate(`(()=>{
        const answers=document.querySelectorAll('[role="radio"]'), last=answers[answers.length-1];
        last.scrollIntoView({block:'start',behavior:'instant'});
        const r=last.getBoundingClientRect(),p=document.querySelector('.desmos-panel').getBoundingClientRect();
        return r.top>=90 && (innerWidth>=900 || r.bottom<=p.top+1);
      })()`)
      assert.equal(reachable,true,`${width}x${height}: answers stay reachable with the calculator open`)
      await evaluate(`document.querySelector('.sat-bank-run-viewport').scrollTop=0;true`)
      await clickLabel('Expand Desmos')
      assert.equal(await evaluate(`document.querySelector('.desmos-panel').classList.contains('desmos-expanded')`),true)
      await clickLabel('Restore Desmos size')
      await clickLabel('Close Desmos')
      assert.equal(await evaluate(`document.querySelector('.desmos-panel').getAttribute('aria-hidden')`),'true')
      assert.equal(await evaluate(`document.querySelector('[role="radio"][aria-checked="true"]')!==null`),true)
      await clickLabel('Open Desmos calculator')
      const screenshot=await send('Page.captureScreenshot',{format:'png'})
      await writeFile(join(screenshots,`${width}x${height}.png`),Buffer.from(screenshot.data,'base64'))
      console.log(`PASS ${width}x${height}: separate runner, split/sheet layout, footer, expansion, preserved iframe and answer`)
    }
    await clickLabel('Close Desmos')
    await clickLabel('Save and exit practice')
    await until(`document.body?.innerText.includes('Resume practice')`)
    await clickText('Resume practice')
    await until(`!!document.querySelector('[role="radio"][aria-checked="true"]')`)
    assert.equal(await evaluate(`document.querySelector('[aria-pressed="true"]').textContent.includes('Marked for Review')`),true)
    // Retain review screenshots outside the repo; no generated artifacts in commits.
    const destination=resolve(process.env.SAT_TEST_SCREENSHOTS || '/tmp/profai-sat-bank-screenshots')
    await mkdir(destination,{recursive:true})
    for(const [width,height] of [[1366,768],[1024,640],[920,500],[768,1024],[390,844],[320,568]]) await writeFile(join(destination,`${width}x${height}.png`),await readFile(join(screenshots,`${width}x${height}.png`)))
    console.log(`PASS saved answers and marks resume; screenshots: ${destination}`)
    await send('Browser.close').catch(()=>{})
  } finally {
    socket?.close();browser.kill();await exited
    await new Promise(resolve=>server.close(resolve))
    await rm(directory,{recursive:true,force:true,maxRetries:5,retryDelay:200})
  }
}
main().catch(error=>{console.error(error);process.exitCode=1})
