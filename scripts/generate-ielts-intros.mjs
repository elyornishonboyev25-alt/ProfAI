// Intentional product media: original neural-narrated walkthroughs at natural speed.
// Set up local Piper and Chromium/Edge as documented in docs/FULL_MOCK_INTROS.md.
import assert from 'node:assert/strict'
import { renderPage } from './render-ielts-intro.mjs'
import { spawn, execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { mkdir, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { createServer } from 'node:http'
import { resolve, join } from 'node:path'
const requireBackend = createRequire(new URL('../backend/package.json', import.meta.url))
const WebSocket = requireBackend('ws')
const catalog = JSON.parse(await readFile(new URL('../src/data/fullMockIntros.json', import.meta.url), 'utf8'))
if (process.env.IELTS_INTRO_SMOKE) for (const intro of Object.values(catalog)) intro.scenes = intro.scenes.slice(0, 1)
const workspace = resolve('tmp')
await mkdir(workspace, { recursive: true })
const directory = process.env.IELTS_INTRO_VOICE_DIR ? resolve(process.env.IELTS_INTRO_VOICE_DIR) : await mkdtemp(join(workspace, 'ielts-intro-media-'))
const output = resolve(process.env.IELTS_INTRO_SMOKE ? 'tmp/ielts-intro-smoke' : 'public/media/ielts-intros')
await mkdir(output, { recursive: true })
execFileSync(process.execPath, [resolve('scripts/record-ielts-intro-voice.mjs'), directory], { windowsHide: true, stdio: 'inherit' })
const mediaMetadata = {}
const browserDirectory = await mkdtemp(join(workspace, 'ielts-intro-browser-'))

const server = createServer(async (req, res) => {
  if (req.url === '/') { res.setHeader('Content-Type', 'text/html'); res.end(renderPage(catalog)); return }
  const match = req.url?.match(/^\/voice\/(listening|reading|writing|speaking)-([0-9]+)\.wav$/)
  if (match) { res.setHeader('Content-Type', 'audio/wav'); res.end(await readFile(join(directory, `${match[1]}-${match[2]}.wav`))); return }
  res.writeHead(404); res.end()
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const browser = spawn(process.env.IELTS_INTRO_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--autoplay-policy=no-user-gesture-required',
  '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--remote-debugging-port=0', '--user-data-dir='+browserDirectory, 'about:blank',
], { windowsHide: true, stdio: 'ignore' })
let socket
try {
  let port
  for (let n=0;n<100;n++) { try { port=(await readFile(join(browserDirectory,'DevToolsActivePort'),'utf8')).split('\n')[0]; break } catch {} await new Promise(resolve=>setTimeout(resolve,100)) }
  assert.ok(port,'Set IELTS_INTRO_BROWSER to an installed Chromium executable')
  const targets=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json()
  socket=new WebSocket(targets.find(target=>target.type==='page').webSocketDebuggerUrl)
  await new Promise(resolve=>socket.once('open',resolve))
  let id=0;const pending=new Map()
  socket.on('message',data=>{const message=JSON.parse(data),call=pending.get(message.id);if(!call)return;pending.delete(message.id);message.error?call.reject(message.error):call.resolve(message.result)})
  const send=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const requestId=++id;const timeout=setTimeout(()=>{pending.delete(requestId);reject(new Error(method+' timed out'))},method==='Runtime.evaluate'?300000:20000);pending.set(requestId,{resolve:value=>{clearTimeout(timeout);resolve(value)},reject:error=>{clearTimeout(timeout);reject(error)}});socket.send(JSON.stringify({id:requestId,method,params,sessionId}))})
  const sessions = []
  for (const key of Object.keys(catalog)) {
    const { targetId } = await send('Target.createTarget', { url: `http://127.0.0.1:${server.address().port}/` })
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
    sessions.push({ key, sessionId })
  }
  await new Promise(resolve=>setTimeout(resolve,1200))
  // Each page owns its canvas/audio graph; record independently without speeding narration up.
  const recordings = await Promise.all(sessions.map(async ({key,sessionId}) => {
    console.log('Recording '+key+' (natural-speed British English narration)…')
    const result=await send('Runtime.evaluate',{expression:`window.record(${JSON.stringify(key)})`,returnByValue:true,awaitPromise:true,userGesture:true},sessionId)
    assert.ok(!result.exceptionDetails,JSON.stringify(result.exceptionDetails))
    return { key, ...result.result.value }
  }))
  for (const { key, base64, ...metadata } of recordings) {
    const data=Buffer.from(base64,'base64')
    mediaMetadata[key] = metadata
    assert.ok(data.length>100000,'Video and audio must be present')
    await writeFile(join(output,key+'.webm'),data)
    console.log('Saved '+key+': '+Math.round(mediaMetadata[key].duration)+' seconds, '+(data.length/1024/1024).toFixed(2)+' MB')
  }
  await writeFile(resolve(process.env.IELTS_INTRO_SMOKE ? 'tmp/ielts-intro-smoke/timing.json' : 'src/data/fullMockIntroMedia.json'), JSON.stringify(mediaMetadata, null, 2)+'\n')
} finally {
  socket?.close();browser.kill();server.close()
  await new Promise(resolve=>setTimeout(resolve,600))
  assert.ok(browserDirectory.startsWith(workspace + '\\'), 'Temporary browser profile must remain inside the workspace')
  await rm(browserDirectory,{recursive:true,force:true,maxRetries:5,retryDelay:300})
  if (!process.env.IELTS_INTRO_VOICE_DIR) await rm(directory,{recursive:true,force:true,maxRetries:5,retryDelay:300})
}
