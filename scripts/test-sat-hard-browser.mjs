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
  const directory = await mkdtemp(join(tmpdir(), 'profai-sat-hard-browser-'))
  const source = `
    import React from 'react'; import {createRoot} from 'react-dom/client';
    import {MemoryRouter, Routes, Route, useNavigate} from 'react-router-dom';
    import Hard from './src/pages/SATHardQuestions';
    import {HARD_QUESTIONS} from './src/features/sat/hardQuestions';
    import {useAuthStore} from './src/store/authStore';
    useAuthStore.setState({user:null}); window.hardRows=HARD_QUESTIONS;
    function Bridge(){window.hardNavigate=useNavigate();return null}
    createRoot(document.getElementById('root')).render(<MemoryRouter initialEntries={['/sat/hard-questions']}>
      <Bridge/><Routes><Route path="/sat/hard-questions" element={<Hard/>}/></Routes>
    </MemoryRouter>);
  `
  const bundle = await build({ stdin: { contents: source, loader: 'tsx', resolveDir: process.cwd() }, bundle: true, write: false, format: 'iife', tsconfig: 'tsconfig.json', define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"production"' }, loader: { '.css': 'empty' } })
  const base = await readFile('src/index.css', 'utf8')
  const extras = await Promise.all(['src/pages/SATHardQuestions.css', 'src/components/sat/DesmosDrawer.css', 'src/components/sat/SATSourceContent.css'].map(file=>readFile(file,'utf8')))
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
    await until(`document.querySelectorAll('.hard-tile').length===100`)
    const destination=resolve(process.env.SAT_TEST_SCREENSHOTS || '/tmp/profai-sat-hard-screenshots')
    await mkdir(destination,{recursive:true})
    const capture = async name => {
      const shot=await send('Page.captureScreenshot',{format:'png'});
      await writeFile(join(destination,name+'.png'),Buffer.from(shot.data,'base64'));
    }
    for(const [width,height] of [[1366,900],[768,1024],[390,844],[320,568]]) {
      await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<768})
      await evaluate(`window.hardNavigate('/sat/hard-questions');true`)
      await until(`document.querySelectorAll('.hard-tile').length===100`)
      assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'),true,`${width}: map has no horizontal overflow`)
      await evaluate('window.scrollTo(0,0);true')
      await capture(width+'-map')
      await evaluate(`document.querySelector('.hard-tile').click()`)
      await until(`!!document.querySelector('.hard-choice')`)
      await evaluate(`document.querySelector('.hard-choice').click()`)
      await until(`!!document.querySelector('.hard-feedback')`)
      assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'),true,`${width}: question has no horizontal overflow`)
      assert.ok(await evaluate(`document.querySelector('.hard-explanation').innerText.length>100`))
      await until(`document.querySelector('.hard-feedback-result').getBoundingClientRect().top>=100 && document.querySelector('.hard-feedback-result').getBoundingClientRect().top<innerHeight`)
      await capture(width+'-feedback')
      console.log(`PASS ${width}x${height}: topic map, question, feedback and responsive layout`)
    }
    await send('Emulation.setDeviceMetricsOverride',{width:1366,height:900,deviceScaleFactor:1,mobile:false})
    // Inspect every selected question in the real renderer for broken visuals.
    for(const section of ['reading-writing','math']) {
      const count = await evaluate(`window.hardRows['${section}'].length`)
      for(let index=0;index<count;index++) {
        await evaluate(`window.hardNavigate('/sat/hard-questions?section=${section}&q='+encodeURIComponent(window.hardRows['${section}'][${index}].key));true`)
        await until(`document.querySelector('.hard-question-toolbar')?.innerText.includes('Question ${index+1} / 100')`)
        await until(`[...document.querySelectorAll('.hard-question img')].every(i=>i.complete)`)
        assert.equal(await evaluate(`[...document.querySelectorAll('.hard-question img')].every(i=>i.naturalWidth>0)`),true,`${section} ${index+1}: source visuals load`)
        assert.ok(await evaluate(`document.querySelector('.hard-task').innerText.trim().length>0`))
        if(index===0 && section==='math') {
          await capture('math-question')
          await clickText('Calculator')
          await until(`document.querySelector('.desmos-panel')?.getAttribute('aria-hidden')==='false'`)
          assert.equal(await evaluate(`!!document.querySelector('[aria-label="Dock Desmos on the right"]')`),false)
          await clickLabel('Close Desmos')
        }
      }
      console.log(`PASS all 100 ${section} questions render, source tasks and visual assets load`)
    }
    console.log(`Screenshots: ${destination}`)
    await send('Browser.close').catch(()=>{})
  } finally {
    socket?.close();browser.kill();await exited
    await new Promise(resolve=>server.close(resolve))
    await rm(directory,{recursive:true,force:true,maxRetries:5,retryDelay:200})
  }
}
main().catch(error=>{console.error(error);process.exitCode=1})
