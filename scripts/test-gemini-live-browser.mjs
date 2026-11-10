import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { readFile, mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createWebServer } from './serve-web.mjs'
import { build } from 'esbuild'

const require = createRequire(import.meta.url)
const { WebSocketServer } = createRequire(new URL('../backend/package.json', import.meta.url))('ws')
let chromium
try { ({ chromium } = require('playwright')) }
catch { ({ chromium } = createRequire(process.env.ASSESSMENT_PLAYWRIGHT_PACKAGE || 'C:/Users/User/.codex/skill-tools/node/package.json')('playwright')) }
const source = `
import {GeminiRealtimeCoach} from './src/lib/geminiRealtimeCoach'; import {useAuthStore} from './src/store/authStore';
window.RTCPeerConnection=undefined; window.SpeechRecognition=undefined; window.webkitSpeechRecognition=undefined;
useAuthStore.setState({user:{id:'gemini-browser',role:'USER'},accessToken:'fixture-token',refreshToken:null});
window.states=[];window.messages=[];window.previews=[];window.errors=[];window.levels=[];window.tracks=[];window.measurements=[];
const getMedia=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
navigator.mediaDevices.getUserMedia=async(...args)=>{const stream=await getMedia(...args);window.tracks.push(...stream.getTracks());return stream};
window.begin=()=>{window.voice=new GeminiRealtimeCoach({context:{pathname:'/ai-tutor',workspace:'english',language:'uz',mode:'coach',threadId:'owned',studyContext:'',screenContext:'',siteKnowledge:''},history:[{role:'user',content:'Call me Elyor.'}],speechSpeed:1.1,state:s=>window.states.push(s),level:l=>window.levels.push(l),caption:t=>{document.getElementById('caption').textContent=t},message:(...v)=>window.messages.push(v),preview:(...v)=>window.previews.push(v),coachResult:(...v)=>window.messages.push(['coach',...v]),error:e=>window.errors.push(e.message),performance:m=>window.measurements.push(m)});window.startPromise=window.voice.start()};
document.getElementById('begin').onclick=window.begin;
document.getElementById('stop').onclick=()=>window.voice.stop();
`
const bundle = await build({ stdin: { contents: source, loader: 'ts', resolveDir: process.cwd() }, bundle: true, write: false, format: 'iife', tsconfig: 'tsconfig.json', define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"production"' } })
const worklet = await readFile('public/audio/nova-pcm-capture.js')
let connects = 0, ends = 0
const server = createServer(async (req, res) => {
  if (req.url === '/fixture.js') { res.setHeader('Content-Type', 'text/javascript; charset=utf-8'); res.end(bundle.outputFiles[0].contents); return }
  if (req.url?.split('?')[0] === '/audio/nova-pcm-capture.js') { res.setHeader('Content-Type', 'text/javascript'); res.end(worklet); return }
  if (req.url?.startsWith('/api/')) {
    assert.equal(req.headers.authorization, 'Bearer fixture-token')
    const chunks = []; for await (const chunk of req) chunks.push(chunk)
    const body = chunks.length ? JSON.parse(Buffer.concat(chunks)) : null
    res.setHeader('Content-Type', 'application/json')
    if (req.url.endsWith('/gemini/connect')) {
      connects++; assert.equal(body.context.language, 'uz'); assert.equal(body.history[0].content, 'Call me Elyor.')
      res.end(JSON.stringify({ id: `fixture-${connects}`, ticket: 'fixture-single-use', expiresAt: new Date(Date.now() + 60000).toISOString(), streamPath: '/ws/ai-coach', model: 'gemini-3.8-live' })); return
    }
    if (req.url.endsWith('/end')) { ends++; res.statusCode = 204; res.end(); return }
    if (req.url.endsWith('/heartbeat')) { res.statusCode = 204; res.end(); return }
    if (req.url.endsWith('/context')) { assert.equal(body.context.threadId, 'owned'); res.statusCode = 204; res.end(); return }
    assert.fail(`Unexpected API request: ${req.url}`)
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.end('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><button id="begin">Begin live voice</button><button id="stop">End live voice</button><p id="caption"></p><script src="/fixture.js"></script></body></html>')
})
const connections = new Set()
server.on('connection', socket => { connections.add(socket); socket.on('close', () => connections.delete(socket)) })
const wss = new WebSocketServer({ server, path: '/ws/ai-coach' })
const received = [], sockets = []
let pongs = 0
const heartbeat = setInterval(() => { for (const socket of wss.clients) if (socket.readyState === 1) socket.ping() }, 15000)
heartbeat.unref()
function audio(seconds = .2) {
  const data = Buffer.alloc(Math.round(24000 * seconds) * 2)
  for (let index = 0; index < data.length / 2; index++) data.writeInt16LE(Math.round(Math.sin(index / 24000 * Math.PI * 2 * 440) * 18000), index * 2)
  return data.toString('base64')
}
function say(socket, text, seconds = .2) {
  socket.send(JSON.stringify({ type: 'content', content: { outputTranscription: { text }, modelTurn: { parts: [{ inlineData: { mimeType: 'audio/pcm;rate=24000', data: audio(seconds) } }] } } }))
  socket.send(JSON.stringify({ type: 'content', content: { turnComplete: true } }))
}
wss.on('connection', socket => {
  sockets.push(socket)
  socket.on('pong', () => { pongs++ })
  socket.on('message', raw => {
    const event = JSON.parse(String(raw)); received.push(event)
    if (event.ticket) { assert.equal(event.ticket, 'fixture-single-use'); socket.send(JSON.stringify({ type: 'ready' })) }
    if (event.type === 'start') say(socket, 'Salom, Elyor!')
    if (event.type === 'audio') assert.equal(Buffer.from(event.data, 'base64').length, 3200, 'Each microphone frame is 100ms of PCM16 at 16kHz')
  })
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const dist = await mkdtemp(join(tmpdir(), 'nova-live-proxy-'))
await mkdir(join(dist, 'audio'))
await writeFile(join(dist, 'audio/nova-pcm-capture.js'), worklet)
await writeFile(join(dist, 'fixture.js'), bundle.outputFiles[0].contents)
await writeFile(join(dist, 'index.html'), '<!doctype html><html><head><meta charset="utf-8"></head><body><button id="begin">Begin live voice</button><button id="stop">End live voice</button><p id="caption"></p><script src="/fixture.js"></script></body></html>')
const proxy = createWebServer({ dist, upstream: `http://127.0.0.1:${server.address().port}` })
proxy.on('connection', socket => { connections.add(socket); socket.on('close', () => connections.delete(socket)) })
await new Promise(resolve => proxy.listen(0, '127.0.0.1', resolve))
let browser
try {
  browser = await chromium.launch({ ...(process.platform === 'win32' ? { channel: 'msedge' } : {}), headless: true, args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] })
  const context = await browser.newContext({ permissions: ['microphone'] })
  const page = await context.newPage()
  const errors = []; page.on('pageerror', error => errors.push(error.message))
  await page.goto(`http://127.0.0.1:${proxy.address().port}`)
  assert.deepEqual(errors, [], 'Fixture initializes without browser errors')
  await page.getByRole('button', { name: 'Begin live voice' }).click()
  await page.waitForFunction(() => window.messages.some(message => message[0] === 'assistant' && message[1] === 'Salom, Elyor!'))
  await page.waitForFunction(() => window.states.includes('speaking') && window.states.at(-1) === 'listening')
  assert.ok(await page.evaluate(() => window.levels.some(level => level > .05)), 'The mascot receives measured playback or microphone amplitude')
  assert.ok(received.some(event => event.type === 'audio'), 'Actual browser microphone samples reach the WebSocket')
  const beforeStall = received.filter(event => event.type === 'audio').length
  await page.evaluate(() => { const until = performance.now() + 2800; while (performance.now() < until) { /* Simulate a busy tab, while the audio thread keeps capturing. */ } })
  await page.waitForTimeout(150)
  assert.ok(received.filter(event => event.type === 'audio').length - beforeStall < 12, 'Old microphone buffers are discarded after a main-thread stall instead of flooding the live connection')
  await page.evaluate(() => window.voice.mute(true))
  await page.waitForTimeout(150)
  const mutedFrames = received.filter(event => event.type === 'audio').length
  await page.waitForTimeout(350)
  assert.equal(received.filter(event => event.type === 'audio').length, mutedFrames)
  assert.equal(await page.evaluate(() => window.tracks[0].enabled), false)
  await page.evaluate(() => window.voice.mute(false))
  sockets[0].send(JSON.stringify({ type: 'content', content: { inputTranscription: { text: 'Men Elyorman.', finished: true } } }))
  say(sockets[0], 'Tanishganimdan xursandman.')
  await page.waitForFunction(() => window.messages.some(message => message[0] === 'user' && message[1] === 'Men Elyorman.'))
  await page.waitForFunction(() => window.messages.some(message => message[0] === 'assistant' && message[1] === 'Tanishganimdan xursandman.'))
  say(sockets[0], 'This long response has not finished playing.', 2)
  await page.waitForFunction(() => window.previews.some(preview => preview[1].startsWith('This long response')))
  await page.evaluate(() => window.voice.interrupt())
  sockets[0].send(JSON.stringify({ type: 'content', content: { interrupted: true, turnComplete: true } }))
  await page.waitForTimeout(100)
  assert.equal(await page.evaluate(() => window.messages.some(message => message[0] === 'assistant' && message[1] === 'This long response has not finished playing.' && !message[3])), false, 'Unheard speech is not committed as a completed answer')
  await page.evaluate(() => window.voice.requestFeedback())
  await page.waitForTimeout(50)
  assert.ok(received.some(event => event.type === 'feedback'))
  sockets[0].send(JSON.stringify({ type: 'coach', id: 'tool-1', result: { reply: 'Here is your checked practice feedback.', actions: [], memoryUpdates: [] } }))
  sockets[0].send(JSON.stringify({ type: 'content', content: { interrupted: true } }))
  await page.waitForFunction(() => window.messages.some(message => message[0] === 'coach'))
  await page.evaluate(() => window.voice.updateContext({ pathname: '/ielts', workspace: 'ielts', language: 'uz', mode: 'coach', studyContext: 'Updated page', screenContext: '', siteKnowledge: '' }))
  // Stay connected across proxy/socket heartbeats, then hold another full turn.
  await page.waitForTimeout(32000)
  assert.ok(pongs >= 2, 'The production proxy forwards repeated WebSocket ping/pong heartbeats')
  say(sockets[0], 'The conversation is still connected.')
  await page.waitForFunction(() => window.messages.some(message => message[1] === 'The conversation is still connected.'))
  assert.deepEqual(await page.evaluate(() => window.errors), [], 'A sustained conversation survives the production WebSocket proxy')
  await page.getByRole('button', { name: 'End live voice' }).click()
  await page.waitForFunction(() => window.tracks.every(track => track.readyState === 'ended') && window.states.at(-1) === 'idle')
  await page.waitForTimeout(100)
  assert.equal(ends, 1)
  assert.ok(await page.evaluate(() => window.measurements.some(value => value.stage === 'first_audio')))
  // A provider error closes the actual microphone and leaves a useful retry error.
  await page.getByRole('button', { name: 'Begin live voice' }).click()
  await page.waitForFunction(() => window.messages.filter(message => message[1] === 'Salom, Elyor!').length === 2)
  sockets[1].send(JSON.stringify({ type: 'error', message: 'Fixture quota rejected the session.' }))
  await page.waitForFunction(() => window.errors.includes('Fixture quota rejected the session.') && window.tracks.every(track => track.readyState === 'ended'))
  assert.deepEqual(errors, [])
  console.log('PASS: sustained AudioWorklet voice through the production WebSocket proxy, delayed-buffer discard, PCM playback, transcripts, mute, interruption, feedback, context updates, provider errors and hardware cleanup (fixture provider)')
} catch (error) { console.error('Live browser regression failed:', error); throw error } finally {
  clearInterval(heartbeat)
  await browser?.close()
  for (const socket of wss.clients) socket.terminate()
  for (const socket of connections) socket.destroy()
  wss.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve))
  proxy.closeAllConnections(); await new Promise(resolve => proxy.close(resolve))
  await rm(dist, { recursive: true, force: true })
}
