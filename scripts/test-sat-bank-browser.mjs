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
    import {MemoryRouter, Routes, Route, useLocation, useNavigate} from 'react-router-dom';
    import Bank from './src/pages/SATQuestionBank'; import Run from './src/pages/SATQuestionBankRun';
    import {useAuthStore} from './src/store/authStore';
    import {allQuestions,historyKey} from './src/features/sat/bankPractice'; import {accountStorageFor} from './src/utils/accountStorage';
    useAuthStore.setState({user:null});
    window.fullscreenRequests=0; window.confirm=()=>true;
    document.documentElement.requestFullscreen=async()=>{window.fullscreenRequests++};
    function Location(){const l=useLocation();window.bankNavigate=useNavigate();return <output data-location>{l.pathname}{l.search}</output>}
    window.seedLongReview=()=>{
      const rows=allQuestions.filter(row=>row.question.section==='math'&&row.question.sourceContent?.explanation.includes('<math')).sort((a,b)=>b.question.sourceContent.explanation.length-a.question.sourceContent.explanation.length).slice(0,3);
      if(rows.length!==3)throw Error('Expected sourced math review fixtures');
      const at=new Date().toISOString();accountStorageFor('guest').setItem(historyKey('guest'),JSON.stringify(rows.map(row=>({key:row.key,section:'math',domain:row.question.domain,skill:row.question.skill,correct:true,answer:row.question.correctAnswer,at,setId:'long-review'}))));
      window.dispatchEvent(new Event('focus'));window.bankNavigate('/sat/question-bank?view=history&review=long-review');
    };
    createRoot(document.getElementById('root')).render(<MemoryRouter initialEntries={['/sat/question-bank?section=math&count=4']}>
      <Location/><Routes><Route path="/sat/question-bank" element={<Bank/>}/><Route path="/sat/question-bank/run/:setId" element={<Run/>}/></Routes>
    </MemoryRouter>);
  `
  const bundle = await build({ stdin: { contents: source, loader: 'tsx', resolveDir: process.cwd() }, bundle: true, write: false, format: 'iife', tsconfig: 'tsconfig.json', define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"production"' }, loader: { '.css': 'empty' } })
  const base = await readFile('src/index.css', 'utf8')
  const extras = await Promise.all(['src/pages/SATQuestionBank.css', 'src/pages/SATQuestionBankRun.css', 'src/components/sat/DesmosDrawer.css', 'src/components/sat/sat-exam-layout.css', 'src/components/sat/SATSourceContent.css', 'src/components/sat/SATQuestionCanvas.css'].map(file=>readFile(file,'utf8')))
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
      const timeout = setTimeout(() => { pending.delete(requestId); reject(new Error(method)) }, method === 'Page.navigate' ? 60_000 : 15_000)
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
    const checkExamControls = async () => {
      const chrome = await evaluate(`(()=>{
        const tools=document.querySelector('.sat-bank-run-tools').getBoundingClientRect();
        const status=document.querySelector('.sat-bank-run-status').getBoundingClientRect();
        const menu=document.querySelector('.sat-bank-run-question-menu').getBoundingClientRect();
        const navigation=document.querySelector('.sat-bank-run-navigation').getBoundingClientRect();
        const buttons=[...document.querySelectorAll('.sat-bank-run-header button,.sat-bank-run-footer button')];
        return {noOverlap:tools.top>=status.bottom || tools.left>=status.right,footerSeparated:menu.right<=navigation.left+1,reachable:buttons.every(button=>{const r=button.getBoundingClientRect();return r.left>=0 && r.right<=innerWidth+1 && r.bottom<=innerHeight+1}),serif:getComputedStyle(document.querySelector('.sat-bank-run-heading h1')).fontFamily.includes('serif')};
      })()`)
      assert.equal(chrome.noOverlap,true,'Toolbar and practice status must not overlap')
      assert.equal(chrome.footerSeparated,true,'Question navigator and navigation buttons must not overlap')
      assert.equal(chrome.reachable,true,'Header and footer controls remain visible')
      assert.equal(chrome.serif,true,'Heading matches the SAT mock font')
    }
    await send('Runtime.enable')
    await send('Page.enable')
    await send('Emulation.setDeviceMetricsOverride',{width:1366,height:768,deviceScaleFactor:1,mobile:false})
    await send('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/`})
    await until(`document.body?.innerText.includes('Start 4 questions')`)
    const destination=resolve(process.env.SAT_TEST_SCREENSHOTS || '/tmp/profai-sat-bank-screenshots')
    await mkdir(destination,{recursive:true})
    const selectOption = async (label, option) => {
      const radio = `fieldset[aria-label="${label}"] input[aria-label="${option}"]`
      if (await evaluate(`!!document.querySelector(${JSON.stringify(radio)})`)) {
        await evaluate(`document.querySelector(${JSON.stringify(radio)}).click()`)
        return
      }
      await clickLabel(label)
      await evaluate(`[...document.querySelectorAll('[role="option"]')].find(node=>node.textContent.trim()===${JSON.stringify(option)}).click()`)
    }
    for (const width of [1366, 390]) {
      await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:width<1024})
      for (const [label, count] of [['Domain / topic', 5], ['Skill / question type', 10]]) {
        await clickLabel(label)
        assert.equal(await evaluate(`document.querySelectorAll('[role="option"]').length`), count)
        const menu = await evaluate(`(()=>{const trigger=document.querySelector('[aria-label="${label}"][role="combobox"]'); const list=document.querySelector('[role="listbox"]'); list.scrollIntoView({block:'nearest'}); const r=list.getBoundingClientRect(); return {height:trigger.getBoundingClientRect().height, option: list.firstElementChild.getBoundingClientRect().height,left:r.left,right:r.right,menuHeight:r.height}})()`)
        assert.ok(menu.height>=52 && menu.option>=48, 'Readable controls and touch targets')
        assert.ok(menu.left>=0 && menu.right<=width && menu.menuHeight<=302, 'Bounded menu without horizontal overflow')
        await evaluate(`document.querySelector('[aria-label="${label}"][role="combobox"]').dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))`)
        assert.equal(await evaluate(`document.querySelector('[role="listbox"]')===null`),true)
      }
    }
    // Native radio groups support arrow keys and expose the selected value.
    for (const [name, next] of [['bank-section', 'reading-writing'], ['bank-difficulty', 'Easy'], ['bank-progress', 'unanswered'], ['bank-count', '6']]) {
      await evaluate(`document.querySelector('input[name="${name}"]:checked').focus()`)
      await send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39})
      await send('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39})
      await until(`document.querySelector('input[name="${name}"]:checked').value===${JSON.stringify(next)}`)
    }
    await selectOption('Section','Math')
    await selectOption('Difficulty','All levels')
    await selectOption('Progress','All questions')
    await selectOption('Questions in set','4')
    for (const width of [1366, 768, 390, 320]) {
      await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:width<1024})
      await evaluate(`document.activeElement?.blur();document.querySelector('.sat-bank-filters').scrollIntoView({block:'start'});true`)
      const layout = await evaluate(`(()=>{
        const labels=[...document.querySelectorAll('.sat-bank-choice-field label')];
        return {noOverflow:document.documentElement.scrollWidth<=innerWidth+1,
          touchTargets:labels.every(label=>{const r=label.getBoundingClientRect();return r.width>=44 && r.height>=44}),
          inBounds:labels.every(label=>{const r=label.getBoundingClientRect();return r.left>=0 && r.right<=innerWidth+1})};
      })()`)
      assert.deepEqual(layout,{noOverflow:true,touchTargets:true,inBounds:true},`Builder controls fit at ${width}px`)
      const {contentSize}=await send('Page.getLayoutMetrics')
      const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width:contentSize.width,height:contentSize.height,scale:1}})
      await writeFile(join(destination,`builder-${width}.png`),Buffer.from(shot.data,'base64'))
    }
    await send('Emulation.setDeviceMetricsOverride',{width:1366,height:768,deviceScaleFactor:1,mobile:false})
    await selectOption('Domain / topic','Algebra')
    await clickLabel('Skill / question type')
    assert.equal(await evaluate(`document.querySelectorAll('[role="option"]').length`), 4)
    await selectOption('Section','Reading & Writing')
    assert.equal(await evaluate(`document.querySelector('[aria-label="Domain / topic"]').textContent`),'All domains')
    await selectOption('Section','Math')
    await clickText('Start 4 questions')
    await until(`!!document.querySelector('.sat-bank-run')`)
    assert.equal(await evaluate('window.fullscreenRequests'),1)
    assert.equal(await evaluate(`document.querySelector('.sat-bank-hero')===null`),true)
    await evaluate(`document.querySelector('.sat-bank-run-directions').focus();document.querySelector('.sat-bank-run-directions').click()`)
    await until(`!!document.querySelector('[aria-labelledby="bank-directions-title"]')`)
    await evaluate(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));true`)
    await until(`!document.querySelector('[aria-labelledby="bank-directions-title"]')`)
    assert.equal(await evaluate(`document.activeElement===document.querySelector('.sat-bank-run-directions')`),true,'Directions restore keyboard focus')
    await evaluate(`document.querySelector('[role="radio"]').click()`)
    await clickText('Mark for Review')
    await clickLabel('Open Desmos calculator')
    await until(`document.querySelector('iframe')!==null`)
    await evaluate(`document.querySelector('[aria-label="Open question navigator"]').focus();document.querySelector('[aria-label="Open question navigator"]').click()`)
    await until(`!!document.querySelector('#bank-question-navigator')`)
    assert.equal(await evaluate(`(()=>{const button=document.querySelector('[aria-label="Close question navigator"]');const r=button.getBoundingClientRect();return button.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))})()`),true,'Question navigator stays above the calculator')
    await evaluate(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));true`)
    await until(`!document.querySelector('#bank-question-navigator')`)
    assert.equal(await evaluate(`document.querySelector('[aria-label="Close Desmos calculator"]')!==null`),true,'Closing the navigator preserves the open calculator')
    await evaluate(`window.calculatorFrame=document.querySelector('iframe');true`)
    const screenshots=join(directory,'screenshots');await mkdir(screenshots)
    for(const [width,height] of [[1366,768],[1024,640],[920,500],[768,1024],[390,844],[320,568]]) {
      await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<1024})
      await new Promise(resolve=>setTimeout(resolve,150))
      await checkExamControls()
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
      if(width>=900) assert.ok(Math.abs(layout.panel[0]-width/2)<=1, `Calculator starts at the screen midpoint: ${JSON.stringify(layout)}`)
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
    await clickLabel('Save and exit practice')
    await until(`document.body?.innerText.includes('Resume practice')`)
    await selectOption('Section','Reading & Writing')
    await selectOption('Questions in set','4')
    await clickText('Start 4 questions')
    await until(`!!document.querySelector('.sat-question-source')`)
    for (const width of [1366, 390]) {
      await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:width<1024})
      await checkExamControls()
      const layout=await evaluate(`(()=>{const source=document.querySelector('.sat-question-source'); const panel=document.querySelector('.sat-question-panel'); const answer=document.querySelector('[role="radio"]');const s=source.getBoundingClientRect(),p=panel.getBoundingClientRect();return {sourceBottom:s.bottom,sourceTop:s.top,sourceRight:s.right,panelTop:p.top,panelLeft:p.left,border:getComputedStyle(source).borderRightWidth,answerBorder:getComputedStyle(answer).borderTopColor,answerWeight:getComputedStyle(answer.lastElementChild).fontWeight,textAlign:getComputedStyle(answer).textAlign,bankLayout:document.querySelector('.sat-bank-run .sat-bank-canvas')!==null,overflow:document.documentElement.scrollWidth>innerWidth}})()`)
      if (width >= 768) {
        assert.ok(Math.abs(layout.sourceRight-layout.panelLeft)<=1, 'Passage and question use the same two-column layout as SAT mock')
        assert.equal(layout.sourceTop,layout.panelTop)
        assert.equal(layout.border,'1px')
      } else {
        assert.ok(layout.sourceBottom<=layout.panelTop, 'Mobile passages stack above the question')
        assert.equal(layout.border,'0px')
      }
      assert.equal(layout.bankLayout,false, 'Practice uses the standard mock question canvas')
      assert.equal(layout.answerBorder,'rgb(0, 0, 0)')
      assert.equal(layout.answerWeight,'600')
      assert.equal(layout.textAlign,'left')
      assert.equal(layout.overflow,false)
      const shot=await send('Page.captureScreenshot',{format:'png'})
      await writeFile(join(screenshots,`reading-${width}.png`),Buffer.from(shot.data,'base64'))
    }
    await evaluate(`document.querySelector('[role="radio"]').click()`)
    for(let index=0;index<3;index++) await clickText('Next')
    await send('Emulation.setDeviceMetricsOverride',{width:320,height:568,deviceScaleFactor:1,mobile:true})
    await checkExamControls()
    await clickText('Finish set')
    await until(`!!document.querySelector('.sat-bank-question')`)
    assert.equal(await evaluate(`getComputedStyle(document.querySelector('.sat-bank-question')).borderRightWidth`),'0px')
    assert.equal(await evaluate(`!!document.querySelector('.sat-bank-canvas')`),true)
    // Retain review screenshots outside the repo; no generated artifacts in commits.
    await evaluate('window.seedLongReview()')
    await until('!!document.querySelector(".sat-bank-explanation math")')
    await until(`document.querySelector('.sat-bank-detail-title h3').getBoundingClientRect().top>=90 && document.querySelector('.sat-bank-detail-title h3').getBoundingClientRect().bottom<innerHeight`)
    const checkReviewNavigation = async () => {
      assert.equal(await evaluate(`([...document.querySelectorAll('.sat-bank-review-pagination button')].every(button=>{const r=button.getBoundingClientRect();return r.top>=0 && r.bottom<=innerHeight && r.left>=0 && r.right<=innerWidth && button.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}))`), true, 'Review navigation stays visible and clickable above long explanations')
    }
    for(const [width,height] of [[1366,768],[768,1024],[390,844],[320,568]]) {
      await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<1024})
      await evaluate(`document.querySelector('.sat-bank-detail-title h3').scrollIntoView({block:'start',behavior:'instant'});true`)
      await checkReviewNavigation()
      await evaluate(`document.querySelector('.sat-bank-explanation').scrollIntoView({block:'start',behavior:'instant'});true`)
      await checkReviewNavigation()
      assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'),true,'Math explanations fit the viewport')
      const shot=await send('Page.captureScreenshot',{format:'png'})
      await writeFile(join(destination,`review-${width}.png`),Buffer.from(shot.data,'base64'))
      await clickText('Next')
      await until('document.querySelector(".sat-bank-detail-title h3").textContent==="Question 2"')
      await checkReviewNavigation()
      const headingLayout=await evaluate(`(()=>{const r=document.querySelector('.sat-bank-detail-title h3').getBoundingClientRect(),nav=document.querySelector('.sat-bank-review-pagination').getBoundingClientRect();return {top:r.top,bottom:r.bottom,navBottom:nav.bottom,height:innerHeight,scroll:scrollY}})()`)
      assert.ok(headingLayout.top>=headingLayout.navBottom && headingLayout.bottom<headingLayout.height,`Next brings the new heading into view below navigation: ${JSON.stringify(headingLayout)}`)
      await clickText('Previous')
      await until('document.querySelector(".sat-bank-detail-title h3").textContent==="Question 1"')
    }
    for(const [width,height] of [[1366,768],[1024,640],[920,500],[768,1024],[390,844],[320,568]]) await writeFile(join(destination,`${width}x${height}.png`),await readFile(join(screenshots,`${width}x${height}.png`)))
    for(const width of [1366,390]) await writeFile(join(destination,`reading-${width}.png`),await readFile(join(screenshots,`reading-${width}.png`)))
    console.log(`PASS comfortable filters, grouped topics, mock Reading layout, saved review; saved answers and marks resume; screenshots: ${destination}`)
    await send('Browser.close').catch(()=>{})
  } finally {
    socket?.close();browser.kill();await exited
    await new Promise(resolve=>server.close(resolve))
    await rm(directory,{recursive:true,force:true,maxRetries:5,retryDelay:200})
  }
}
main().catch(error=>{console.error(error);process.exitCode=1})
