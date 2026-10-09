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
import { attachSpeakingSignaling } from '../backend/dist/realtime/speakingSignaling.js'

const requireBackend = createRequire(new URL('../backend/package.json', import.meta.url))
const WebSocket = requireBackend('ws')
async function main() {
  const directory = await mkdtemp(join(tmpdir(), 'profai-community-browser-'))
  const fixture = `
    import React from 'react'; import {createRoot} from 'react-dom/client';
    import {MemoryRouter} from 'react-router-dom';
    import Community from './src/pages/Community';
    import {apiClient} from './src/lib/apiClient';
    import {useAuthStore} from './src/store/authStore';
    import './src/i18n/index';
    window.captureStreams=[];
    window.peerConnections=[];
    const NativePC=window.RTCPeerConnection;
    window.RTCPeerConnection=class extends NativePC {constructor(options){super(options);window.peerConnections.push(this);}};
    const getMedia=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia=async options=>{if(window.rejectMicrophoneOnce){window.rejectMicrophoneOnce=false;throw new DOMException('Permission denied','NotAllowedError');}const stream=await getMedia(options);window.captureStreams.push(stream);return stream;};
    const name = new URLSearchParams(location.search).get('name') || 'Host';
    useAuthStore.setState({user:{id:name,nickname:name,fullName:name,premium:true,xp:100,level:2,currentStreak:3},accessToken:'account:'+name,refreshToken:'fixture'});
    const learner = (nickname, xp, dailyChampion=false) => ({nickname,xp,dailyChampion,avatarUrl:null,level:2,streak:3,badgeCount:2,country:'Uzbekistan',targetExam:'IELTS',targetScore:7,online:true});
    window.champion='Leader';
    apiClient.get = async path => path.startsWith('/profile/search') ? {results:[learner(name==='Host'?'Guest':'Host',200),learner('Leader',900,window.champion==='Leader')],topLearner:{nickname:window.champion,xp:900,avatarUrl:null}} : {nickname:name,xp:100,profile:{country:'Uzbekistan',targetExam:'IELTS',targetScore:'7'}};
    const root = createRoot(document.getElementById('root'));
    root.render(<MemoryRouter initialEntries={['/community']}><div className="app-shell-community-people"><Community /></div></MemoryRouter>);
  `
  const bundle = await build({ stdin: { contents: fixture, loader: 'tsx', resolveDir: process.cwd() }, bundle: true, write: false, outfile: join(directory, 'fixture.js'), format: 'iife', tsconfig: 'tsconfig.json', define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"production"' }, loader: { '.jpg': 'dataurl', '.png': 'dataurl' } })
  const base = (await postcss([tailwindcss()]).process(await readFile('src/index.css', 'utf8'), { from: 'src/index.css' })).css
  const css = base + '\n' + (await Promise.all(['src/styles/community.css', 'src/styles/speaking-hub.css'].map(file => readFile(file, 'utf8')))).join('\n')
  const server = createServer((req, res) => {
    if (req.url.startsWith('/fixture.js')) { res.setHeader('Content-Type', 'text/javascript; charset=utf-8'); res.end(bundle.outputFiles.find(file => file.path.endsWith('.js'))?.text ?? bundle.outputFiles[0].text) }
    else { res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(`<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><div id="root"></div><script src="/fixture.js"></script>`) }
  })
  const signaling = attachSpeakingSignaling(server, async token => token.startsWith('account:') ? { userId: token.slice(8), name: token.slice(8), avatarUrl: null, public: true } : null)
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const browser = spawn(process.env.COMMUNITY_TEST_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--autoplay-policy=no-user-gesture-required', '--remote-debugging-port=0', '--user-data-dir=' + directory, 'about:blank'], { windowsHide: true, stdio: 'ignore' })
  const exited = new Promise(resolve => { browser.once('exit', resolve); browser.once('error', resolve) })
  const connections = []
  try {
    let port
    for (let n = 0; n < 100; n++) { try { port = (await readFile(join(directory, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break } catch { await new Promise(resolve => setTimeout(resolve, 100)) } }
    assert.ok(port, 'Set COMMUNITY_TEST_BROWSER to an installed Chromium browser')
    async function page(name, create = false) {
      if (create) await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })
      const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
      const target = targets.find(target => target.type === 'page' && target.url === 'about:blank')
      const socket = new WebSocket(target.webSocketDebuggerUrl)
      connections.push(socket)
      await new Promise(resolve => socket.once('open', resolve))
      let id = 0
      const pending = new Map()
      const errors = []
      const send = (method, params = {}) => new Promise((resolve, reject) => {
        const requestId = ++id
        const timeout = setTimeout(() => { pending.delete(requestId); reject(new Error(method)) }, method === 'Page.captureScreenshot' ? 45000 : 15000)
        pending.set(requestId, { resolve, reject, timeout })
        socket.send(JSON.stringify({ id: requestId, method, params }))
      })
      socket.on('message', raw => {
        const message = JSON.parse(raw)
        if (message.method === 'Runtime.exceptionThrown') errors.push(message.params)
        const call = pending.get(message.id)
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
        for (let n = 0; n < 150; n++) { if (await evaluate(`(async()=>Boolean(await (${expression})))()`)) return; await new Promise(resolve => setTimeout(resolve, 100)) }
        throw new Error(`Timed out: ${expression}; ${await evaluate('document.body.innerText')}; browser errors: ${JSON.stringify(errors)}`)
      }
      const click = async text => {
        await until(`[...document.querySelectorAll('button')].some(b=>!b.disabled && b.textContent.includes(${JSON.stringify(text)}))`)
        return evaluate(`[...document.querySelectorAll('button')].find(b=>!b.disabled && b.textContent.includes(${JSON.stringify(text)})).click()`)
      }
      await send('Runtime.enable')
      await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
      await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 950, deviceScaleFactor: 1, mobile: false })
      await send('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/?name=${name}` })
      await until(`document.querySelector('.hub-connection.is-live') && document.querySelector('.community-learner-card')`)
      return { send, evaluate, until, click, errors }
    }
    const host = await page('Host'), guest = await page('Guest', true)
    await host.until(`document.querySelector('.community-speak-button')`)
    const screenshots = resolve('tmp/community-browser')
    await mkdir(screenshots, { recursive: true })
    async function layout(page, label) {
      for (const [width, height] of [[1440, 950], [1024, 768], [390, 844], [320, 568]]) {
        await page.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 760 })
        assert.equal(await page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), true, `${label}: ${width}px has no horizontal overflow`)
        if (label === 'room' || label === 'private-room') assert.equal(await page.evaluate(`(() => { const rect=document.querySelector('.hub-call-controls').getBoundingClientRect(); return rect.top>=0 && rect.bottom<=innerHeight+1; })()`), true, 'Call controls stay visible on desktop and mobile')
        if (label === 'learners') await page.evaluate(`document.querySelector('.community-layout').scrollIntoView({block:'start'})`)
        if (process.env.COMMUNITY_SCREENSHOTS !== '1' || (width !== 1440 && width !== 390)) continue
        const screenshot = await page.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
        await writeFile(join(screenshots, `${label}-${width}.png`), Buffer.from(screenshot.data, 'base64'))
      }
    }
    await layout(host, 'lobby')
    await layout(host, 'learners')
    await host.evaluate('window.scrollTo(0,0)')
    // Topic tiles start a room directly, without a form or typing.
    await host.click('Say hello')
    await host.until(`document.querySelector('.hub-room-header')?.innerText.includes('Say hello')`)
    assert.equal(await host.evaluate(`!!document.querySelector('dialog')`), false)
    assert.equal(await host.evaluate('window.captureStreams.length'), 0, 'One-tap creation never waits for microphone permission')
    await host.click('Leave room')
    await host.until(`document.querySelector('.hub-connection.is-live')`)
    // The custom launcher also works with its defaults, with settings optional.
    await host.click('Create a room')
    await host.until(`document.querySelector('dialog[open]')`)
    assert.equal(await host.evaluate(`document.querySelector('dialog button[type=submit]').disabled`), false)
    await host.click('Open my room')
    await host.until(`document.querySelector('.hub-room-header')?.innerText.includes('Say hello')`)
    await host.click('Leave room')
    await host.until(`document.querySelector('.hub-connection.is-live')`)
    await host.click('Create a room')
    await host.until(`document.querySelector('dialog[open]')`)
    await host.evaluate(`[...document.querySelectorAll('dialog button')].find(b=>b.textContent.includes('Debate club')).click()`)
    await host.evaluate(`(() => { const input=document.querySelector('dialog input'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'Climate debate'); input.dispatchEvent(new Event('input',{bubbles:true})); document.querySelector('.hub-optional-settings').open=true; const topic=document.querySelector('dialog textarea'); Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(topic,'Should cities ban private cars?'); topic.dispatchEvent(new Event('input',{bubbles:true})); })()`)
    await host.evaluate(`document.querySelector('dialog button[type=submit]').click()`)
    await host.until(`document.querySelector('.hub-room-header')?.innerText.includes('Climate debate')`)
    assert.equal(await host.evaluate('window.captureStreams.length'), 0, 'Custom creation also opens without microphone permission')
    await guest.until(`document.querySelector('.hub-room-card')?.innerText.includes('Climate debate')`)
    await layout(guest, 'feed')
    await guest.click('Enter room')
    await guest.until(`document.querySelector('.hub-listener')?.innerText.includes('Guest')`)
    assert.equal(await guest.evaluate('window.captureStreams.length'), 0, 'Entering to listen never requests the microphone')
    await host.until(`window.peerConnections.some(pc=>pc.connectionState==='connected') && document.querySelectorAll('audio').length===1`)
    await guest.click('Raise hand')
    await host.until(`document.querySelector('.hub-listener i')`)
    await guest.evaluate(`window.rejectMicrophoneOnce=true`)
    await guest.click('Take a seat')
    await guest.until(`document.querySelector('.hub-feedback.is-error')?.innerText.includes('Allow microphone access')`)
    assert.equal(await guest.evaluate(`!!document.querySelector('.hub-room-header') && document.querySelector('.hub-listener')?.innerText.includes('Guest')`), true, 'A denied microphone keeps the learner listening in the room')
    await guest.click('Take a seat')
    await guest.until(`document.querySelectorAll('.hub-speaker:not(.is-empty)').length===2`)
    await host.until(`document.querySelector('.hub-speaker.is-speaking')?.innerText.includes('Guest')`)
    await host.until(`(async()=>{for(const pc of window.peerConnections){if(pc.connectionState!=='connected')continue;const stats=await pc.getStats();for(const report of stats.values()){if(report.type==='inbound-rtp'&&report.kind==='audio'&&report.bytesReceived>0)return true;}}return false;})()`)
    await guest.click('Mute')
    await guest.until(`[...document.querySelectorAll('.hub-call-controls button')].some(b=>b.textContent.includes('Unmute'))`)
    assert.equal(await guest.evaluate('window.captureStreams.at(-1).getAudioTracks()[0].enabled'), false)
    await guest.click('Unmute')
    await host.until(`document.querySelector('.hub-speaker.is-speaking')?.innerText.includes('Guest')`)
    await guest.click('Listen instead')
    await host.until(`document.querySelector('.hub-listener')?.innerText.includes('Guest')`)
    assert.equal(await guest.evaluate('window.captureStreams.every(stream=>stream.getTracks().every(track=>track.readyState===\'ended\'))'), true, 'Stepping down releases microphone tracks')
    await guest.click('Take a seat')
    await host.until(`document.querySelector('.hub-speaker.is-speaking')?.innerText.includes('Guest')`)
    assert.equal(await guest.evaluate('window.peerConnections.filter(pc=>pc.connectionState===\'connected\').length'), 1, 'Switching from listening to speaking reuses the audio connection')
    await host.until(`document.querySelector('.team-for')?.innerText.includes('Host') && document.querySelector('.team-against')?.innerText.includes('Guest')`)
    const peerCount = await host.evaluate('window.peerConnections.length')
    await host.click('Conversation')
    await guest.until(`!document.querySelector('.hub-debate-teams') && document.querySelectorAll('.hub-speaker:not(.is-empty)').length===2`)
    await host.click('Debate')
    await guest.until(`document.querySelector('.team-against')?.innerText.includes('Guest')`)
    assert.equal(await host.evaluate('window.peerConnections.length'), peerCount, 'Switching room modes preserves voice connections')
    await host.click('Start debate')
    await guest.until(`document.querySelector('.hub-debate-clock')?.innerText.includes('Current turn: @Host')`)
    await host.click('Next turn')
    await guest.until(`document.querySelector('.hub-debate-clock')?.innerText.includes('Current turn: @Guest')`)
    await host.click('Pause')
    await guest.until(`document.querySelector('.hub-debate-clock')?.innerText.includes('Ready for a friendly debate?')`)
    await guest.evaluate(`(() => { const input=document.querySelector('.hub-chat input'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'Hello from the live room'); input.dispatchEvent(new Event('input',{bubbles:true})); })()`)
    await guest.evaluate(`document.querySelector('.hub-chat button[type=submit]').click()`)
    await host.until(`document.querySelector('.hub-chat-messages').innerText.includes('Hello from the live room')`)
    await layout(host, 'room')
    await host.click('Unmute')
    await host.until(`window.captureStreams.at(-1)?.getAudioTracks()[0]?.enabled`)
    await guest.until(`(async()=>{for(const pc of window.peerConnections){if(pc.connectionState!=='connected')continue;const stats=await pc.getStats();for(const report of stats.values()){if(report.type==='inbound-rtp'&&report.kind==='audio'&&report.bytesReceived>0)return true;}}return false;})()`)
    await guest.click('Leave room')
    await host.click('Leave room')
    await host.until(`document.querySelector('.community-speak-button')`)
    await host.click('Speak together')
    await guest.until(`document.querySelector('.hub-invitation')?.innerText.includes('Host')`)
    await guest.click('Accept & join')
    await host.until(`document.querySelector('.hub-room-header')?.innerText.includes('Private room')`)
    await guest.until(`document.querySelector('.hub-room-header')?.innerText.includes('Private room')`)
    await host.click('Unmute')
    await guest.click('Unmute')
    for (const page of [host, guest]) await page.until(`(async()=>{for(const pc of window.peerConnections){if(pc.connectionState!=='connected')continue;const stats=await pc.getStats();for(const report of stats.values()){if(report.type==='inbound-rtp'&&report.kind==='audio'&&report.bytesReceived>0)return true;}}return false;})()`)
    await host.click('Leave room')
    await guest.click('Leave room')
    await host.click('Partner')
    await guest.click('Partner')
    await host.until(`document.querySelector('.hub-partner-card')?.innerText.includes('Guest')`)
    await layout(host, 'partner')
    const microphoneCount = await host.evaluate('window.captureStreams.length')
    await host.click('Find a random partner')
    await host.until(`document.querySelector('.hub-pending')?.innerText.includes('Looking for your next conversation')`)
    await host.click('Cancel')
    await host.until(`!document.querySelector('.hub-pending')`)
    await host.click('Find a random partner')
    await host.until(`document.querySelector('.hub-pending')?.innerText.includes('Looking for your next conversation')`)
    await guest.click('Find a random partner')
    await host.until(`document.querySelector('.hub-room-header')?.innerText.includes('Private room')`)
    await guest.until(`document.querySelector('.hub-room-header')?.innerText.includes('Private room')`)
    assert.equal(await host.evaluate('window.captureStreams.length'), microphoneCount, 'Random matching connects without requesting a microphone')
    await host.click('Unmute')
    await guest.click('Unmute')
    for (const page of [host, guest]) await page.until(`(async()=>{for(const pc of window.peerConnections){if(pc.connectionState!=='connected')continue;const stats=await pc.getStats();for(const report of stats.values()){if(report.type==='inbound-rtp'&&report.kind==='audio'&&report.bytesReceived>0)return true;}}return false;})()`)
    await layout(host, 'private-room')
    await guest.click('Find next partner')
    await guest.until(`document.querySelector('.hub-pending')?.innerText.includes('Looking for your next conversation')`)
    await host.click('Leave room')
    await host.until(`document.querySelector('.hub-partner-discovery')`)
    await host.click('Find a random partner')
    await guest.until(`document.querySelector('.hub-room-header')?.innerText.includes('Private room')`)
    await host.until(`document.querySelector('.hub-room-header')?.innerText.includes('Private room')`)
    await guest.click('Leave room')
    await host.click('Leave room')
    assert.equal(await host.evaluate('window.captureStreams.every(stream=>stream.getTracks().every(track=>track.readyState===\'ended\'))'), true, 'Leaving stops every host microphone track')
    assert.equal(await guest.evaluate('window.captureStreams.every(stream=>stream.getTracks().every(track=>track.readyState===\'ended\'))'), true, 'Leaving stops every guest microphone track')
    await host.send('Page.bringToFront')
    await host.evaluate(`window.champion='Guest'; window.dispatchEvent(new Event('focus'))`)
    await host.until(`document.querySelector('.hub-champion').innerText.includes('@Guest')`)
    assert.deepEqual(host.errors, [], 'Host has no browser exceptions')
    assert.deepEqual(guest.errors, [], 'Guest has no browser exceptions')
    console.log('Community browser passed: real two-way WebRTC audio, mode switching without reconnecting, automatic debate teams and turns, random matching/cancellation/next partner, private invitations, microphone release, chat, visible call controls and layouts at 320–1440px, learner cards and champion refresh.')
    await host.send('Browser.close').catch(() => {})
  } finally {
    connections.forEach(socket => socket.close())
    browser.kill(); await exited
    signaling.close()
    await new Promise(resolve => server.close(resolve))
    const target = resolve(directory), parent = resolve(tmpdir()) + sep
    assert.ok(target.startsWith(parent) && target.includes('profai-community-browser-'))
    await rm(target, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
  }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
