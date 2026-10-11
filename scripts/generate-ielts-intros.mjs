// Intentional product media: four original 24-second narrated walkthroughs.
// Regenerate on Windows with an English SAPI voice and Chromium/Edge installed.
import assert from 'node:assert/strict'
import { spawn, execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { mkdir, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { createServer } from 'node:http'
import { resolve, join } from 'node:path'
const requireBackend = createRequire(new URL('../backend/package.json', import.meta.url))
const WebSocket = requireBackend('ws')
const catalog = JSON.parse(await readFile(new URL('../src/data/fullMockIntros.json', import.meta.url), 'utf8'))
const workspace = resolve('tmp')
await mkdir(workspace, { recursive: true })
const directory = await mkdtemp(join(workspace, 'ielts-intro-media-'))
const output = resolve('public/media/ielts-intros')
await mkdir(output, { recursive: true })
execFileSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', resolve('scripts/record-ielts-intro-voice.ps1'), '-OutputDirectory', directory], { windowsHide: true, stdio: 'pipe' })

function renderPage() {
  return `<meta charset="utf-8"><canvas width="1280" height="720"></canvas><script>
  const catalog=${JSON.stringify(catalog)};
  const canvas=document.querySelector('canvas'), ctx=canvas.getContext('2d');
  const red='#ba203e', ink='#202632', muted='#687589', border='#e0e5ef';
  function box(x,y,w,h,color='#ffffff',stroke=border,r=14) { ctx.fillStyle=color; ctx.beginPath(); ctx.roundRect(x,y,w,h,r); ctx.fill(); if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke()} }
  function label(t,x,y,size=18,color=ink,weight=400){ctx.fillStyle=color;ctx.font=weight+' '+size+'px Segoe UI';ctx.fillText(t,x,y)}
  function line(x,y,w){ctx.fillStyle=border;ctx.fillRect(x,y,w,2)}
  function paragraph(text,x,y,width,size=18,color=muted){let row='',offset=0;ctx.font='400 '+size+'px Segoe UI';for(const word of text.split(' ')){const next=row+word+' ';if(ctx.measureText(next).width>width && row){label(row,x,y+offset,size,color);offset+=size*1.55;row=word+' '}else row=next}if(row)label(row,x,y+offset,size,color);return offset+size*1.55}
  function icon(name,x,y){ctx.strokeStyle=red;ctx.lineWidth=3;ctx.beginPath();if(name==='listening'){ctx.arc(x+14,y+15,13,Math.PI,0);ctx.moveTo(x+1,y+15);ctx.lineTo(x+1,y+29);ctx.moveTo(x+27,y+15);ctx.lineTo(x+27,y+29);ctx.stroke();box(x-2,y+16,7,15,red,null,3);box(x+23,y+16,7,15,red,null,3)}else if(name==='reading'){ctx.moveTo(x+14,y+5);ctx.lineTo(x+14,y+30);ctx.moveTo(x+14,y+8);ctx.lineTo(x,y+3);ctx.lineTo(x,y+27);ctx.lineTo(x+14,y+31);ctx.lineTo(x+28,y+27);ctx.lineTo(x+28,y+3);ctx.lineTo(x+14,y+8);ctx.stroke()}else if(name==='writing'){ctx.moveTo(x+4,y+28);ctx.lineTo(x+9,y+16);ctx.lineTo(x+24,y+1);ctx.lineTo(x+29,y+6);ctx.lineTo(x+14,y+21);ctx.closePath();ctx.stroke();ctx.moveTo(x,y+32);ctx.lineTo(x+29,y+32);ctx.stroke()}else{box(x+7,y,14,23,'#fff',red,7);ctx.beginPath();ctx.arc(x+14,y+15,12,0,Math.PI);ctx.moveTo(x+14,y+27);ctx.lineTo(x+14,y+33);ctx.moveTo(x+7,y+33);ctx.lineTo(x+21,y+33);ctx.stroke()}}
  function frame(key,t) {
    const intro=catalog[key], keys=Object.keys(catalog), current=keys.indexOf(key), scene=Math.min(3,Math.floor(t/6));
    ctx.clearRect(0,0,1280,720);ctx.fillStyle='#f5f7fc';ctx.fillRect(0,0,1280,720);
    const wash=ctx.createLinearGradient(0,0,1280,720);wash.addColorStop(0,'#fff0f2');wash.addColorStop(.6,'#f8faff');wash.addColorStop(1,'#eaf1fc');ctx.fillStyle=wash;ctx.fillRect(0,0,1280,720);
    box(0,0,1280,62,'#fff',null,0);label('PROFAI',36,40,24,ink,800);label('IELTS ACADEMIC',150,39,13,red,700);label('FULL MOCK  /  SECTION 0'+(current+1),964,38,12,muted,700);
    keys.forEach((k,n)=>{const x=60+n*292;box(x,82,280,52,k===key?'#fff1f4':'#ffffffcc',k===key?'#e2a0ae':border);icon(k,x+17,94);label(catalog[k].title,x+62,115,18,k===key?red:muted,600);label('0'+(n+1),x+240,115,13,muted,600)});
    label('YOUR '+key.toUpperCase()+' TEST',60,184,13,red,700);label(intro.scenes[scene].title,60,226,32,ink,800);label(intro.meta,60,256,16,muted);
    box(60,278,1160,338,'#fff',border,18);
    box(60,278,1160,42,'#fafbfe',null,18);label(intro.title+' · '+(key==='writing' ? 'Task '+(scene<2?'1':'2'):key==='speaking' ? 'Part '+Math.max(1,scene):'Part 1'),84,305,14,ink,700);label(key==='listening'?'Recording plays once':key==='speaking'?'AI examiner':'Time remaining  60:00',956,305,14,red,600);
    if(key==='listening'){
      label('Questions 1–10',90,355,19,ink,700);label('Complete the notes below.',90,384,15,muted);box(90,404,515,147,'#f8faff');label('VISITOR INFORMATION',110,435,14,ink,700);label('1   Name:',110,477,18);box(285,450,268,39,scene===1?'#fff3f5':'#fff',scene===1?red:border,7);if(scene>=1)label('Taylor',300,477,18,red,500);label('2   Arrival date:',110,527,18);box(285,500,268,39,'#fff',border,7);
      box(637,344,549,207,'#fff8fa','#f1d2d9');label(scene===3?'Answer review':'Listening audio',662,380,21,ink,700);
      if(scene===3){label('02:00',662,436,43,red,800);label('Check all forty answers before submission.',662,476,17,muted)}else{for(let i=0;i<46;i++){const h=12+Math.abs(Math.sin(t*3+i*.63))*48;box(663+i*10,437-h/2,4,h,red,null,2)}label('Read the questions. Then listen and answer.',662,505,16,muted)}
    } else if(key==='reading'){
      box(82,339,540,214,'#f8faff');label('READING PASSAGE 1',103,371,14,red,700);label('The changing world of cities',103,408,23,ink,700);paragraph('Cities change as people develop new ways to live and work. Researchers study how public spaces bring communities together.',103,444,480,18);line(103,531,460);
      label('Questions 1–13',651,371,19,ink,700);paragraph('Do the following statements agree with the information in the passage?',651,411,495,17);label('1  Public spaces can connect communities.',651,479,17);['TRUE','FALSE','NOT GIVEN'].forEach((v,n)=>{box(651+n*176,501,162,42,n===0&&scene>=1?'#fff0f3':'#fff',n===0&&scene>=1?red:border,8);label(v,668+n*176,528,14,n===0&&scene>=1?red:muted,600)})
    } else if(key==='writing'){
      box(82,339,507,214,'#f8faff');const task=scene<2?1:2;label('TASK '+task,103,371,14,red,700);
      if(task===1){paragraph('The chart shows changes over time. Summarise the information and make comparisons where relevant.',103,408,443,16);[56,96,125,79,140].forEach((h,n)=>{box(125+n*82,536-h*.6,35,h*.6,red,null,3)})}else{paragraph('Some people believe that technology has improved education. To what extent do you agree or disagree?',103,418,435,20);label('Give reasons and relevant examples.',103,532,16,muted)}
      box(613,339,574,214,'#fff',border,10);label('Your response',635,371,15,muted,600);const response=task===1?'The chart illustrates changes across five categories. Overall, the final category shows the highest figure.':'Technology plays an important role in modern education. In my view, it offers significant benefits when used thoughtfully.';paragraph(response.slice(0,Math.min(response.length,Math.floor((t%6)*30)+1)),635,414,530,18,ink);label('Word count: '+(task===1?'150':'250')+' minimum',635,536,13,muted)
    } else {
      box(83,339,328,214,'#fff8fa','#f1d2d9');icon('speaking',220,369);label('AI examiner',172,441,23,ink,700);label('Listen · speak · explain',151,479,17,muted);for(let i=0;i<25;i++){const h=5+Math.abs(Math.sin(t*4+i*.8))*20;box(127+i*10,515-h/2,4,h,red,null,2)}
      label(scene===2?'Part 2 · Cue card':scene===3?'Part 3 · Discussion':'Part 1 · Interview',446,377,19,ink,700);paragraph(scene===2?'Describe a skill you would like to learn. Say what it is, why it interests you, and how you would learn it.':scene===3?'How has technology changed the way people learn new skills?':'What do you enjoy about your studies or work?',446,420,710,24,ink);label(scene===2?'Preparation  01:00     ·     Speaking  up to 02:00':'Speak clearly and develop your answers.',446,537,16,red,600)
    }
    if(key==='listening'||key==='reading'){for(let n=0;n<10;n++){box(90+n*43,570,34,29,n===scene?'#ba203e':'#f4f6fb',null,6);label(String(n+1),101+n*43,591,12,n===scene?'#fff':muted,600)}label('Navigate by question number',818,590,13,muted)}else{label(key==='writing'?'Task 1                   Task 2':'Part 1                    Part 2                    Part 3',91,588,14,red,600)}
    box(60,645,1160,5,'#e2e7ef',null,3);box(60,645,1160*Math.min(1,t/24),5,red,null,3);label('SECTION INSTRUCTIONS  ·  ENGLISH NARRATION',60,686,11,muted,700);label('PROFAI COMPUTER TEST EXPERIENCE',938,686,11,muted,700);
  }
  window.record=async(key)=>{
    const context=new AudioContext();await context.resume();const destination=context.createMediaStreamDestination();
    const clips=await Promise.all(catalog[key].scenes.map(async(_,i)=>context.decodeAudioData(await(await fetch('/voice/'+key+'-'+i+'.wav')).arrayBuffer())));
    const stream=canvas.captureStream(24);destination.stream.getAudioTracks().forEach(track=>stream.addTrack(track));
    const recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9,opus',videoBitsPerSecond:1600000});const chunks=[];
    recorder.ondataavailable=e=>chunks.push(e.data);const stopped=new Promise(resolve=>recorder.onstop=resolve);
    const start=context.currentTime+.15;clips.forEach((clip,i)=>{const source=context.createBufferSource();source.buffer=clip;source.playbackRate.value=Math.max(1,clip.duration/5.6);source.connect(destination);source.start(start+i*6+.15)});
    frame(key,0);recorder.start();const began=performance.now();let raf;const draw=()=>{frame(key,Math.min(24,(performance.now()-began)/1000));raf=requestAnimationFrame(draw)};draw();
    await new Promise(resolve=>setTimeout(resolve,24000));cancelAnimationFrame(raf);frame(key,24);recorder.stop();await stopped;stream.getTracks().forEach(track=>track.stop());await context.close();
    const blob=new Blob(chunks,{type:'video/webm'});return await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(blob)});
  };
  frame('listening',0);
  </script>`
}
const server = createServer(async (req, res) => {
  if (req.url === '/') { res.setHeader('Content-Type', 'text/html'); res.end(renderPage()); return }
  const match = req.url?.match(/^\/voice\/(listening|reading|writing|speaking)-([0-3])\.wav$/)
  if (match) { res.setHeader('Content-Type', 'audio/wav'); res.end(await readFile(join(directory, `${match[1]}-${match[2]}.wav`))); return }
  res.writeHead(404); res.end()
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const browser = spawn(process.env.IELTS_INTRO_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--autoplay-policy=no-user-gesture-required',
  '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--remote-debugging-port=0', '--user-data-dir='+join(directory, 'browser'), 'about:blank',
], { windowsHide: true, stdio: 'ignore' })
let socket
try {
  let port
  for (let n=0;n<100;n++) { try { port=(await readFile(join(directory,'browser/DevToolsActivePort'),'utf8')).split('\n')[0]; break } catch {} await new Promise(resolve=>setTimeout(resolve,100)) }
  assert.ok(port,'Set IELTS_INTRO_BROWSER to an installed Chromium executable')
  const targets=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json()
  socket=new WebSocket(targets.find(target=>target.type==='page').webSocketDebuggerUrl)
  await new Promise(resolve=>socket.once('open',resolve))
  let id=0;const pending=new Map()
  socket.on('message',data=>{const message=JSON.parse(data),call=pending.get(message.id);if(!call)return;pending.delete(message.id);message.error?call.reject(message.error):call.resolve(message.result)})
  const send=(method,params={})=>new Promise((resolve,reject)=>{const requestId=++id;pending.set(requestId,{resolve,reject});socket.send(JSON.stringify({id:requestId,method,params}))})
  await send('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/`})
  await new Promise(resolve=>setTimeout(resolve,800))
  for (const key of Object.keys(catalog)) {
    console.log('Recording '+key+' (24 seconds, English narration)…')
    const result=await send('Runtime.evaluate',{expression:`window.record(${JSON.stringify(key)})`,returnByValue:true,awaitPromise:true,userGesture:true})
    assert.ok(!result.exceptionDetails,JSON.stringify(result.exceptionDetails))
    const data=Buffer.from(result.result.value,'base64')
    assert.ok(data.length>100000,'Video and audio must be present')
    await writeFile(join(output,key+'.webm'),data)
    console.log('Saved '+key+': '+(data.length/1024/1024).toFixed(2)+' MB')
  }
} finally {
  socket?.close();browser.kill();server.close()
  await new Promise(resolve=>setTimeout(resolve,600))
  await rm(directory,{recursive:true,force:true,maxRetries:5,retryDelay:300})
}
