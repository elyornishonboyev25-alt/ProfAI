// Record real pointer actions in the production Reading/Listening component.
import assert from 'node:assert/strict'
import {build} from 'esbuild'
import postcss from 'postcss'
import tailwindcss from 'tailwindcss'
import {createRequire} from 'node:module'
import {spawn} from 'node:child_process'
import {createServer} from 'node:http'
import {mkdir,mkdtemp,readFile,writeFile,rm} from 'node:fs/promises'
import {resolve,join} from 'node:path'
const WebSocket=createRequire(new URL('../backend/package.json',import.meta.url))('ws')
const catalog=JSON.parse(await readFile('src/data/fullMockIntros.json','utf8'))
const output=resolve(process.argv[2]||'tmp/ielts-intro-screens')
await mkdir(output,{recursive:true})
const profile=await mkdtemp(resolve('tmp/ielts-screen-browser-'))
const bundle=await build({entryPoints:['scripts/ielts-intro-fixture.tsx'],bundle:true,write:false,outfile:'tmp/intro-fixture.js',format:'esm',tsconfig:'tsconfig.json',define:{'import.meta.env':'{}','process.env.NODE_ENV':'"production"'},loader:{'.jpg':'dataurl','.png':'dataurl'}})
const css=(await postcss([tailwindcss()]).process(await readFile('src/index.css','utf8'),{from:'src/index.css'})).css+bundle.outputFiles.filter(f=>f.path.endsWith('.css')).map(f=>f.text).join('\n')
const server=createServer((req,res)=>{
  if(req.url==='/fixture.js'){res.setHeader('Content-Type','text/javascript; charset=utf-8');res.end(bundle.outputFiles.find(f=>f.path.endsWith('.js')).text);return}
  if(req.url==='/fixture.css'){res.setHeader('Content-Type','text/css; charset=utf-8');res.end(css);return}
  if(req.url==='/demo-audio.wav'){const data=Buffer.alloc(44+44100);data.write('RIFF');data.writeUInt32LE(data.length-8,4);data.write('WAVEfmt ',8);data.writeUInt32LE(16,16);data.writeUInt16LE(1,20);data.writeUInt16LE(1,22);data.writeUInt32LE(22050,24);data.writeUInt32LE(44100,28);data.writeUInt16LE(2,32);data.writeUInt16LE(16,34);data.write('data',36);data.writeUInt32LE(44100,40);res.setHeader('Content-Type','audio/wav');res.end(data);return}
  res.setHeader('Content-Type','text/html; charset=utf-8');res.end('<meta charset="utf-8"><link rel="stylesheet" href="/fixture.css"><div id="root"></div><script type="module" src="/fixture.js"></script>')
})
await new Promise(r=>server.listen(0,'127.0.0.1',r))
const browser=spawn(process.env.IELTS_INTRO_BROWSER||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--autoplay-policy=no-user-gesture-required','--disable-background-timer-throttling','--disable-renderer-backgrounding','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'})
let socket
const sleep=ms=>new Promise(r=>setTimeout(r,ms))
try{
 let port;for(let n=0;n<100;n++){try{port=(await readFile(join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0];break}catch{}await sleep(100)}assert.ok(port)
 const targets=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>socket.once('open',r))
 let id=0;const pending=new Map();socket.on('message',d=>{const m=JSON.parse(d),p=pending.get(m.id);if(!p)return;pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result)})
 const send=(method,params={})=>new Promise((resolve,reject)=>{const req=++id;pending.set(req,{resolve,reject});socket.send(JSON.stringify({id:req,method,params}))})
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});assert.ok(!r.exceptionDetails,JSON.stringify(r.exceptionDetails));return r.result.value}
 const until=async expression=>{for(let n=0;n<80;n++){if(await evaluate(expression))return;await sleep(100)}throw new Error('Not found: '+expression)}
 await send('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:1,mobile:false})
 await send('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/`});await until('!!window.show')
 let pointer={x:640,y:360},stage='screen',frames=[],motions=[],clicks=[],began=0,capturing=false,clickedAt=-100
 const move=async(x,y,buttons=0)=>{const from={...pointer},start=(Date.now()-began)/1000,steps=24;for(let n=1;n<=steps;n++){const f=n/steps,e=f*f*f*(10+f*(-15+6*f));pointer={x:from.x+(x-from.x)*e,y:from.y+(y-from.y)*e};await send('Input.dispatchMouseEvent',{type:'mouseMoved',...pointer,buttons});await sleep(20)}if(capturing)motions.push({start,end:(Date.now()-began)/1000,from,to:{...pointer},easing:'smootherstep'})}
 const clickAt=async(x,y)=>{await move(x,y);clickedAt=(Date.now()-began)/1000;clicks.push({time:clickedAt,...pointer});await send('Input.dispatchMouseEvent',{type:'mousePressed',...pointer,button:'left',clickCount:1});await sleep(80);await send('Input.dispatchMouseEvent',{type:'mouseReleased',...pointer,button:'left',clickCount:1});await sleep(350)}
 const rect=async(selector,text)=>evaluate(`(()=>{const e=[...document.querySelectorAll(${JSON.stringify(selector)})].findLast(e=>{const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return r.width>0&&r.height>0&&r.top>=0&&r.bottom<=720&&(hit===e||e.contains(hit)||hit?.contains(e))&&(${text?`e.textContent.trim()===${JSON.stringify(text)}||e.querySelector('p:first-child,span:first-child')?.textContent.trim()===${JSON.stringify(text)}`:'true'})});if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`)
 const click=async(selector,text)=>{let r;for(let n=0;n<30;n++){r=await rect(selector,text);if(r)break;await sleep(100)}if(!r){const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(join(output,'capture-error.png'),Buffer.from(shot.data,'base64'));await writeFile(join(output,'capture-error.txt'),await evaluate('document.body.innerText'));}assert.ok(r,selector+' '+text);await clickAt(r.x,r.y)}
 const part=async n=>{await until(`!![...document.querySelectorAll('.reading-toolbar span')].find(e=>e.textContent.trim()===${JSON.stringify('Part ')}+${n})`);await click('.reading-toolbar span',`Part ${n}`);await sleep(200)}
 const type=async(selector,text)=>{await click(selector);for(const char of text){await send('Input.insertText',{text:char});await sleep(60)}}
 const selectText=async section=>{
  const r=await evaluate(`(()=>{const pane=document.querySelector(${JSON.stringify(section==='reading'?'#reading-passage-pane':'[data-reading-markable="1"]')});const walker=document.createTreeWalker(pane,NodeFilter.SHOW_TEXT);let node;while(node=walker.nextNode()){if(node.textContent.trim().length<45||!node.parentElement.closest(${JSON.stringify(section==='reading'?'.ielts-reading-prose':'p,h3,h2,div')}))continue;const range=document.createRange();range.setStart(node,0);range.setEnd(node,Math.min(35,node.textContent.length));const box=range.getClientRects()[0];if(box&&box.top>90&&box.bottom<600&&box.width>100){const textNode=node;window.demoSelect=count=>{const selection=window.getSelection();selection.setBaseAndExtent(textNode,0,textNode,Math.min(count,textNode.textContent.length));document.dispatchEvent(new Event('selectionchange'))};return {x:box.left+2,y:box.top+box.height/2,end:box.right-2,point:{x:box.left+8,y:box.top+3}}}}throw Error('Selectable text missing')})()`)
  await move(r.x,r.y);await send('Input.dispatchMouseEvent',{type:'mousePressed',...pointer,button:'left',clickCount:1});stage='selecting';const dragStart=(Date.now()-began)/1000,from={...pointer};for(let n=1;n<=24;n++){const x=r.x+(r.end-r.x)*n/24;await send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y:r.y,buttons:1});pointer={x,y:r.y};await evaluate(`window.demoSelect(${Math.round(35*n/24)})`);await sleep(35)}motions.push({start:dragStart,end:(Date.now()-began)/1000,from,to:{...pointer},easing:'linear'});await sleep(600);await send('Input.dispatchMouseEvent',{type:'mouseReleased',...pointer,button:'left',clickCount:1});await evaluate('window.demoSelect(35)');await until('!!document.querySelector(\'[data-reading-selection-toolbar="1"]\')');await sleep(400);return r.point
 }
 const manifest=process.env.IELTS_INTRO_SCREEN_RESUME ? JSON.parse(await readFile(join(output,'manifest.json'),'utf8')) : {}
 for(const key of ['listening','reading']){
  manifest[key]??=[]
  for(const [index,scene] of catalog[key].scenes.entries()){
   if(process.env.IELTS_INTRO_SCREEN_VIEW&&scene.view!==process.env.IELTS_INTRO_SCREEN_VIEW)continue
   if(manifest[key][index]&&!process.env.IELTS_INTRO_SCREEN_VIEW)continue
   await evaluate(`window.show(${JSON.stringify(key)})`);await until('!!document.querySelector(".ielts-exam-header")');await sleep(400);if(key==='listening')await click('button','Play');await part(scene.part)
   await evaluate(`(()=>{document.getElementById('demo-pointer')?.remove();const p=document.createElement('div');p.id='demo-pointer';p.style.cssText='position:fixed;left:640px;top:360px;width:25px;height:35px;pointer-events:none;z-index:10000;filter:drop-shadow(0 1px 2px #fff)';p.innerHTML='<svg width="25" height="35" viewBox="0 0 25 35"><path d="M2 2v25l6-6 6 12 5-3-6-12h10z" fill="#171c27" stroke="white" stroke-width="1.7"/></svg>';document.body.append(p);document.onmousemove=e=>{p.style.left=e.clientX+'px';p.style.top=e.clientY+'px'};document.onmousedown=()=>{p.style.filter='drop-shadow(0 0 5px #c21d38)'};document.onmouseup=()=>{p.style.filter='drop-shadow(0 1px 2px #fff)'}})()`)
   pointer={x:640,y:360};stage='screen';frames=[];motions=[];clicks=[];began=Date.now();clickedAt=-100;capturing=true;let point
   // Capture clean native frames and the real pointer trace separately. The
   // video renders continuous motion segments independently of screenshot cadence.
   const capture=(async()=>{while(capturing){const time=(Date.now()-began)/1000,currentStage=stage,currentPointer={...pointer},clickTime=clickedAt;await evaluate("document.getElementById('demo-pointer').style.visibility='hidden'");const shot=await send('Page.captureScreenshot',{format:'jpeg',quality:90});const file=`${key}-${index}-${frames.length}.jpg`;await writeFile(join(output,file),Buffer.from(shot.data,'base64'));frames.push({file,time,stage:currentStage,pointer:currentPointer,clickTime});await sleep(35)}})()
   try{
    await sleep(450)
    if(scene.view==='highlight'){
     point=await selectText(key);await click('button','Highlight');stage='highlighted';await until('!!document.querySelector(".ielts-highlight")');await move(850,400);await sleep(900);await click('.ielts-highlight');await click('button','Delete highlight');stage='deleted';await until('!document.querySelector(".ielts-highlight")');await sleep(850)
    }else if(scene.view==='display'){
     await click('[aria-label="Display settings"]');await click('button','Text size');await click('button','Large');await sleep(700);await click('[aria-label="Close display settings"]');await click('[aria-label="Display settings"]');await click('button','Contrast');await click('button','White on black');await sleep(700);await click('[aria-label="Close display settings"]');await sleep(400)
    }else if(scene.view==='notes'){
     await selectText(key);await click('button','Note');await type('textarea','Check this detail');await click('button','Save note');await sleep(450);await click('[aria-label="Notes"]');await type('textarea','Check the word limit.');await move(900,380);await sleep(600)
    }else if(scene.view==='navigate'){
     await part(2);await click('.reading-toolbar button',key==='listening'?'12':'15');await click('[title="Flag Question"]');await click('button','Review');await sleep(900);await click('button',key==='listening'?'12.':'15.');await sleep(600)
    }else if(scene.view==='answer'){
     const pane=key==='listening'?'[data-reading-markable="1"]':'#reading-questions-pane';const input=await rect(pane+' input[type="text"]');if(input)await type(pane+' input[type="text"]','Sample answer');else{const dropdown=await evaluate(`(()=>{const button=[...document.querySelectorAll(${JSON.stringify(pane+' button')})].find(e=>e.textContent.trim()==='?');if(!button)return null;const r=button.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);assert.ok(dropdown,'An actual answer control must be available');await clickAt(dropdown.x,dropdown.y);await click('button','A')}
     stage='answered';await until('document.querySelector(".ielts-exam-header").textContent.includes("1/40 answered")')
     await move(470,430);await send('Input.dispatchMouseEvent',{type:'mouseWheel',x:460,y:430,deltaY:180,deltaX:0});await sleep(700)
    }else if(scene.view==='timer'){
     if(key==='listening'){await evaluate('window.finishAudio()');await until('!!document.querySelector(".listening-review-countdown")');await move(635,130);await sleep(1200)}else{await move(635,34);await sleep(900);await part(1);await sleep(600)}
    }else if(scene.view==='finish'){
     await click('button','Submit');await sleep(900);await click('button','Cancel');await sleep(600);await click('button','Submit');await sleep(450);await click('button','Submit test');await until('!!document.querySelector(".mock-run-hero")');stage='submitted';await move(700,370);await sleep(1100)
    }else if(scene.view==='review'){
     await click('button','Review');await sleep(850);await move(680,440);await sleep(600)
    }else{
     await move(key==='reading'?240:370,270);await sleep(500);await send('Input.dispatchMouseEvent',{type:'mouseWheel',x:key==='reading'?330:650,y:430,deltaY:110,deltaX:0});await move(890,455);await sleep(650);await move(650,34);await sleep(500)
    }
    await sleep(450)
   }catch(error){console.error(key,scene.title,error);const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(join(output,'capture-error.png'),Buffer.from(shot.data,'base64'));throw error}finally{capturing=false;await capture}
   const duration=(Date.now()-began)/1000
   assert.ok(frames.length>=8,key+': moving capture must contain multiple real frames')
   manifest[key][index]={view:scene.view,duration,frames,motions,clicks,...(point?{point}:{})}
   await writeFile(join(output,'manifest.json'),JSON.stringify(manifest,null,2))
   console.log(`Captured ${key}: ${scene.title} (${frames.length} moving frames)`)
  }
 }
}finally{socket?.close();browser.kill();server.close();await sleep(600);await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:300}).catch(error=>console.warn('Temporary browser profile cleanup:',error.code))}
