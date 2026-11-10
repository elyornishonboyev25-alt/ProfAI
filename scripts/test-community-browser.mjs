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
    import {MemoryRouter,useNavigate,useLocation} from 'react-router-dom';
    import Community from './src/pages/Community';
    import {apiClient} from './src/lib/apiClient';
    import {useAuthStore} from './src/store/authStore';
    import i18n from './src/i18n/index';
    // English assertions must not depend on the machine's time zone.
    void i18n.changeLanguage('en');
    window.setFixtureLanguage = language => i18n.changeLanguage(language);
    window.captureStreams=[];
    window.peerConnections=[];
    window.communitySockets=[];
    const NativeSocket=window.WebSocket;
    window.WebSocket=class extends NativeSocket {constructor(url){super(url);window.communitySockets.push(this);}};
    const NativePC=window.RTCPeerConnection;
    window.RTCPeerConnection=class extends NativePC {constructor(options){super(options);window.peerConnections.push(this);}};
    const getMedia=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia=async options=>{if(window.rejectMicrophoneOnce){window.rejectMicrophoneOnce=false;throw new DOMException('Permission denied','NotAllowedError');}const stream=await getMedia(options);window.captureStreams.push(stream);return stream;};
    const name = new URLSearchParams(location.search).get('name') || 'Host';
    // Each fixture represents a separate learner; production syncs account changes between tabs.
    useAuthStore.persist.setOptions({storage:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}}});
    useAuthStore.setState({user:{id:name,nickname:name,fullName:name,premium:true,xp:100,level:2,currentStreak:3},accessToken:'account:'+name,refreshToken:'fixture'});
    window.switchFixtureAccount=id=>useAuthStore.setState({user:{...useAuthStore.getState().user,id,nickname:id,fullName:id},accessToken:'account:'+id});
    const learner = (nickname, xp, dailyChampion=false) => ({nickname,xp:nickname===window.champion&&nickname!=='Leader'?950:xp,dailyChampion,avatarUrl:null,level:2,streak:3,badgeCount:2,country:'Uzbekistan',targetExam:'IELTS',targetScore:7,online:true});
    window.champion='Leader';
    window.failSearch=false;
    window.accountFailures=1;
    apiClient.get = async path => {
      if(!path.startsWith('/profile/search')) {if(window.accountFailures-->0)throw new Error('Temporary account failure');return {nickname:name,xp:100,profile:{country:'Uzbekistan',targetExam:'IELTS',targetScore:'7'}};}
      if(window.failSearch){window.failSearch=false;throw new Error('Discovery is temporarily unavailable');}
      const params=new URL(path,'http://localhost').searchParams;
      const people=[learner(name==='Host'?'Guest':'Host',200),learner('Leader',900,window.champion==='Leader'),
        {...learner('DifferentBand',100),targetScore:8}, {...learner('SatSameScore',150),targetExam:'SAT'},
        {...learner('OtherCountry',120),country:'France'}, {...learner('OfflineLearner',90),online:false},
        ...Array.from({length:10},(_,i)=>learner('Learner'+i,100+i))];
      return {results:people.filter(person=>(!params.get('q')||person.nickname.toLowerCase().includes(params.get('q').toLowerCase()))&&(!params.get('targetExam')||person.targetExam===params.get('targetExam'))&&(!params.get('country')||person.country===params.get('country'))&&(!params.get('online')||person.online)),topLearner:{nickname:window.champion,xp:window.champion==='Leader'?900:950,avatarUrl:null}};
    };
    const root = createRoot(document.getElementById('root'));
    function Location(){window.navigateCommunity=useNavigate();window.communityPath=useLocation().pathname;return null;}
    root.render(<MemoryRouter initialEntries={['/community']}><Location/><div className="app-shell-community-people"><Community /></div></MemoryRouter>);
  `
  const bundle = await build({ stdin: { contents: fixture, loader: 'tsx', resolveDir: process.cwd() }, bundle: true, write: false, outfile: join(directory, 'fixture.js'), format: 'iife', tsconfig: 'tsconfig.json', define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"production"' }, loader: { '.jpg': 'dataurl', '.png': 'dataurl' } })
  const base = (await postcss([tailwindcss()]).process(await readFile('src/index.css', 'utf8'), { from: 'src/index.css' })).css
  const css = base + '\n' + (bundle.outputFiles.find(file => file.path.endsWith('.css'))?.text ?? '')
  const server = createServer((req, res) => {
    if (req.url.startsWith('/fixture.js')) { res.setHeader('Content-Type', 'text/javascript; charset=utf-8'); res.end(bundle.outputFiles.find(file => file.path.endsWith('.js'))?.text ?? bundle.outputFiles[0].text) }
    else { res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(`<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><div id="root"></div><script src="/fixture.js"></script>`) }
  })
  const blockedCallers = new Map()
  const signaling = attachSpeakingSignaling(server, async token => token.startsWith('account:') ? { userId: token.slice(8), name: token.slice(8), avatarUrl: null, public: true } : null, {
    load: async userId => [...(blockedCallers.get(userId)?.values() ?? [])],
    set: async (blockerId, blockedId, blocked) => {
      const people = blockedCallers.get(blockerId) ?? new Map()
      if (blocked) people.set(blockedId, { userId: blockedId, name: blockedId, avatarUrl: null })
      else people.delete(blockedId)
      blockedCallers.set(blockerId, people)
    },
  })
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
        const timeout = setTimeout(() => { pending.delete(requestId); reject(new Error(`${method}: ${params.expression ?? ''}`)) }, method === 'Page.captureScreenshot' ? 45000 : 15000)
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
        await until(`[...document.querySelectorAll('button,summary')].some(b=>!b.disabled && b.textContent.includes(${JSON.stringify(text)}))`)
        return evaluate(`(()=>{const buttons=[...document.querySelectorAll('button,summary')].filter(b=>!b.disabled);(buttons.find(b=>b.textContent.trim()===${JSON.stringify(text)})||buttons.find(b=>b.textContent.includes(${JSON.stringify(text)}))).click();})()`)
      }
      await send('Runtime.enable')
      await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] })
      await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 950, deviceScaleFactor: 1, mobile: false })
      await send('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/?name=${name}` })
      await until(`document.querySelector('.hub-connection.is-live') && document.querySelector('.hub-partner-discovery')`); assert.equal(await evaluate("document.querySelectorAll('.community-main-nav button').length"),2)
      return { send, evaluate, until, click, errors }
    }
    const host = await page('Host'), guest = await page('Guest', true)
    const screenshots = resolve('output/playwright/community-browser')
    await mkdir(screenshots, { recursive: true })
    async function layout(page, label) {
      await page.send('Page.bringToFront');
      for (const [width, height] of [[1440, 950], [1024, 768], [390, 844], [320, 568]]) {
        await page.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 760 })
        assert.equal(await page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), true, `${label}: ${width}px has no horizontal overflow`)
        if (label === 'room' || label === 'private-room') assert.equal(await page.evaluate(`(() => { const rect=document.querySelector('.hub-call-controls').getBoundingClientRect(); return rect.top>=0 && rect.bottom<=innerHeight+1; })()`), true, 'Call controls stay visible on desktop and mobile')
        if (process.env.COMMUNITY_SCREENSHOTS !== '1' || (width !== 1440 && width !== 390)) continue
        const screenshot = await page.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
        await writeFile(join(screenshots, `${label}-${width}.png`), Buffer.from(screenshot.data, 'base64'))
      }
    }
    const setInput = async (page, selector, value) => page.evaluate('(()=>{const input=document.querySelector('+JSON.stringify(selector)+');Object.getOwnPropertyDescriptor(input instanceof HTMLSelectElement?HTMLSelectElement.prototype:HTMLInputElement.prototype,"value").set.call(input,'+JSON.stringify(value)+');input.dispatchEvent(new Event(input instanceof HTMLSelectElement?"change":"input",{bubbles:true}));})()');
    const assertAudio = page => page.until("(async()=>{for(const pc of window.peerConnections){if(pc.connectionState!=='connected')continue;const stats=await pc.getStats();for(const report of stats.values()){if(report.type==='inbound-rtp'&&report.kind==='audio'&&report.bytesReceived>0)return true;}}return false;})()");
    const createRoom = async (page, title, topic = '') => {
      await page.click('Create a room');
      await page.until("document.querySelector('dialog[open]')");
      if (title) await setInput(page, 'dialog input', title);
      if (topic) await setInput(page, 'dialog label:nth-of-type(2) input', topic);
      await page.evaluate("document.querySelector('dialog button[type=submit]').click()");
      await page.until("document.querySelector('.hub-room-header') && !document.querySelector('dialog')");
    };
    await host.until("document.querySelector('.hub-partner-card')?.innerText.includes('Guest')");
    assert.equal(await host.evaluate("!!document.querySelector('.zone-launchpad,.zone-discovery-grid,.community-layout,.hub-starters,.hub-mode-bar')"), false, 'Speaking Zone contains only partner and room flows');
    await layout(host, 'partner');
    await host.send('Emulation.setDeviceMetricsOverride', {width:1440,height:950,deviceScaleFactor:1,mobile:false});
    await host.evaluate("window.scrollTo(0,0)");
    await host.click('Call settings');
    await host.evaluate("document.querySelector('.hub-audio-setup').open=true");
    await host.click('Test microphone');
    await host.until("document.querySelector('.hub-audio-setup').innerText.includes('Say a few words')");
    await host.click('Stop test');
    assert.equal(await host.evaluate("window.captureStreams.every(stream=>stream.getTracks().every(track=>track.readyState==='ended'))"), true, 'Microphone check releases capture');
    await host.click('Call settings');
    const micTests = await host.evaluate('window.captureStreams.length');
    await host.click('Voice rooms');
    await guest.click('Voice rooms');
    await host.until("document.querySelector('.hub-lobby-empty')");
    await layout(host,'rooms-empty');
    await host.click('Create a room');
    await host.until("document.querySelector('dialog[open]')");
    assert.equal(await host.evaluate("document.querySelectorAll('dialog input:not([type=checkbox])').length"),2,'Create form has only a name and topic');
    await layout(host,'create');
    await host.evaluate("document.querySelector('dialog button[aria-label=Close]').click()");
    await host.until("!document.querySelector('dialog')");
    await createRoom(host);
    await host.until("document.querySelector('.hub-room-header')?.innerText.includes('Say hello')");
    assert.equal(await host.evaluate('window.captureStreams.length'),micTests,'Room creation starts with the microphone off');
    assert.equal(await host.evaluate("!!document.querySelector('.hub-mode-bar,.hub-conversation-toolkit,.community-main-nav')"),false,'Active conversation has no extra modes or launchers');
    await host.click('Leave room');
    await host.until("document.querySelector('.hub-lobby')");
    await createRoom(host,'Evening conversation','Travel and everyday life');
    await guest.until("document.querySelector('.hub-room-card')?.innerText.includes('Evening conversation')");
    await layout(guest,'rooms');
    await setInput(guest,'.hub-room-search input',' unmatched ');
    await guest.until("document.querySelector('.hub-lobby-empty')?.innerText.includes('No rooms match')");
    await guest.click('Clear search');
    await guest.until("document.querySelector('.hub-room-card')");
    await host.click('Invite friends');
    const invitation = await host.evaluate("document.querySelector('.hub-share-link input').value");
    const invitePath = new URL(invitation).pathname + new URL(invitation).search;
    await guest.evaluate('window.navigateCommunity('+JSON.stringify(invitePath)+')');
    await guest.until("document.querySelector('.hub-invitation') && !document.querySelector('.hub-lobby')");
    await guest.click('Join invited room');
    await guest.until("document.querySelector('.hub-listener')?.innerText.includes('Guest')");
    assert.equal(await guest.evaluate('window.captureStreams.length'),0,'Joining as a listener does not request microphone permission');
    await guest.click('Raise hand');
    await host.until("document.querySelector('.hub-listener i')");
    await guest.evaluate('window.rejectMicrophoneOnce=true');
    await guest.click('Take a seat');
    await guest.until("document.querySelector('.hub-feedback.is-error')?.innerText.includes('Microphone access is blocked')");
    assert.equal(await guest.evaluate("!!document.querySelector('.hub-room-header') && document.querySelector('.hub-listener')?.innerText.includes('Guest')"),true,'Denied microphone keeps the listener in the room');
    await guest.click('Take a seat');
    await host.until("document.querySelector('.hub-speaker.is-speaking')?.innerText.includes('Guest')");
    await assertAudio(host);
    await guest.click('Mute');
    await guest.until("[...document.querySelectorAll('.hub-call-controls button')].some(b=>b.textContent.includes('Unmute'))");
    assert.equal(await guest.evaluate('window.captureStreams.at(-1).getAudioTracks()[0].enabled'),false);
    await guest.click('Unmute');
    await guest.click('Listen instead');
    await host.until("document.querySelector('.hub-listener')?.innerText.includes('Guest')");
    assert.equal(await guest.evaluate("window.captureStreams.every(stream=>stream.getTracks().every(track=>track.readyState==='ended'))"),true,'Listening releases microphone tracks');
    await guest.click('Take a seat');
    await host.until("document.querySelector('.hub-speaker.is-speaking')?.innerText.includes('Guest')");
    assert.equal(await guest.evaluate("window.peerConnections.filter(pc=>pc.connectionState==='connected').length"),1,'Returning to speak reuses the connection');
    await setInput(guest,'.hub-chat input','Hello from the live room');
    await guest.evaluate("document.querySelector('.hub-chat button[type=submit]').click()");
    await host.until("document.querySelector('.hub-chat-messages').innerText.includes('Hello from the live room')");
    await layout(host,'room');
    await host.click('Unmute');
    await assertAudio(guest);
    await guest.click('Leave room');
    await host.click('Leave room');
    await host.click('Partner');
    await guest.click('Partner');
    await host.until("document.querySelector('.hub-partner-card')?.innerText.includes('Guest')");
    await setInput(host,'.hub-partner-discovery input',' nobody ');
    await host.until("document.querySelector('.zone-partner-empty')?.innerText.includes('No partner found')");
    await host.click('Clear search');
    await host.until("document.querySelector('.hub-partner-card')");
    await setInput(host,'.hub-partner-discovery input','  gUeSt  ');
    await host.until("document.querySelectorAll('.hub-partner-card').length===1");
    await host.click('Call now');
    await host.until("document.querySelector('.hub-pending.is-inviting')?.innerText.includes('@Guest')");
    await guest.until("document.querySelector('.hub-invitation')?.innerText.includes('Host')");
    await host.click('Cancel');
    await guest.until("!document.querySelector('.hub-invitation')");
    await host.until("!document.querySelector('.hub-pending') && document.querySelector('.hub-partner-card')");
    await host.click('Call now');
    await guest.until("document.querySelector('.hub-invitation')?.innerText.includes('Host')");
    await guest.click('Decline');
    await host.until("!document.querySelector('.hub-pending') && document.querySelector('.hub-partner-card')");
    await host.click('Call now');
    await guest.until("document.querySelector('.hub-invitation')?.innerText.includes('Host')");
    assert.equal(await guest.evaluate("window.captureStreams.every(stream=>stream.getTracks().every(track=>track.readyState==='ended'))"),true,'Ringing leaves the microphone off');
    await guest.click('Block caller');
    await guest.until("document.querySelector('[role=alertdialog]')");
    await guest.click('Cancel');
    await guest.until("!document.querySelector('[role=alertdialog]')");
    await guest.click('Block caller');
    await guest.evaluate("document.querySelector('[role=alertdialog] .is-danger').click()");
    await guest.until("document.querySelector('.hub-blocked-callers')?.textContent.includes('Host')");
    await host.until("!document.querySelector('.hub-pending') && !document.querySelector('.hub-partner-card')");
    await guest.evaluate("document.querySelector('.hub-blocked-callers').open=true");
    await guest.click('Unblock');
    await guest.until("!document.querySelector('.hub-blocked-callers')");
    await host.until("document.querySelector('.hub-partner-card')?.innerText.includes('Guest')");
    await host.click('Call now');
    await guest.until("document.querySelector('.hub-invitation')?.innerText.includes('Host')");
    await guest.click('Accept & join');
    await host.until("document.querySelector('.hub-room-header')?.innerText.includes('Private room')");
    await guest.until("document.querySelector('.hub-room-header')?.innerText.includes('Private room')");
    await host.click('Unmute');
    await guest.click('Unmute');
    await assertAudio(host); await assertAudio(guest);
    await layout(host,'private-room');
    await host.click('Leave room'); await guest.click('Leave room');
    await host.until("document.querySelector('.hub-partner-card')");
    const microphoneCount = await host.evaluate('window.captureStreams.length');
    await host.click('Find a random partner');
    await host.until("document.querySelector('.hub-pending')?.innerText.includes('Looking for your next conversation')");
    await host.click('Cancel');
    await host.until("!document.querySelector('.hub-pending')");
    await host.click('Find a random partner');
    await host.until("document.querySelector('.hub-pending')");
    const recovery = await page('Host',true);
    await recovery.until("document.querySelector('.hub-activity-recovery')?.innerText.includes('active session')");
    await recovery.click('End session & start again');
    await host.until("!document.querySelector('.hub-pending') && !document.querySelector('.hub-activity-recovery')");
    assert.deepEqual(recovery.errors,[]);
    await recovery.send('Page.close').catch(()=>{});
    await host.click('Find a random partner');
    await host.until("document.querySelector('.hub-pending')");
    await guest.click('Find a random partner');
    await host.until("document.querySelector('.hub-room-header')?.innerText.includes('Private room')");
    await guest.until("document.querySelector('.hub-room-header')?.innerText.includes('Private room')");
    assert.equal(await host.evaluate('window.captureStreams.length'),microphoneCount,'Matching does not request microphone permission');
    await guest.click('Find next partner');
    await guest.until("document.querySelector('.hub-pending')");
    await host.click('Leave room');
    await host.until("document.querySelector('.hub-partner-discovery')");
    await host.click('Find a random partner');
    await guest.until("document.querySelector('.hub-room-header')");
    await host.until("document.querySelector('.hub-room-header')");
    await guest.click('Leave room'); await host.click('Leave room');
    for(const p of [host,guest]) assert.equal(await p.evaluate("window.captureStreams.every(stream=>stream.getTracks().every(track=>track.readyState==='ended'))"),true,'Leaving releases every microphone track');
    for(const mode of ['questions','admissions','people']) {
      await host.evaluate('window.navigateCommunity('+JSON.stringify('/community?mode='+mode)+')');
      await host.until(mode==='people'?"document.querySelector('.hub-partner-discovery')":"document.querySelector('.hub-lobby')");
      assert.equal(await host.evaluate("document.querySelectorAll('.community-main-nav button').length"),2);
    }
    await host.click('Voice rooms');
    await createRoom(host,'Account switch');
    await host.click('Unmute');
    await host.until("window.captureStreams.at(-1)?.getAudioTracks()[0]?.enabled");
    const previousSockets = await host.evaluate('window.communitySockets.length');
    await host.evaluate("window.switchFixtureAccount('SwitchedAccount')");
    await host.until('window.communitySockets.length>'+previousSockets+" && document.querySelector('.hub-connection.is-live') && !document.querySelector('.hub-room-header')");
    assert.equal(await host.evaluate("window.captureStreams.every(stream=>stream.getTracks().every(track=>track.readyState==='ended'))"),true,'Switching accounts releases the microphone');
    for(const language of ['uz','ru']) {
      await host.evaluate('window.setFixtureLanguage('+JSON.stringify(language)+')');
      await host.evaluate("window.navigateCommunity('/community?mode=voice');window.scrollTo(0,0)");
      await host.until("document.querySelector('.hub-lobby') && document.documentElement.lang==="+JSON.stringify(language));
      await layout(host,'rooms-'+language);
      await host.evaluate("window.navigateCommunity('/community?mode=partner');window.scrollTo(0,0)");
      await host.until("document.querySelector('.zone-partner-start')");
      await layout(host,'partner-'+language);
    }
    assert.deepEqual(host.errors,[],'No host browser errors');
    assert.deepEqual(guest.errors,[],'No guest browser errors');
    console.log('Community browser passed: minimal partner/room navigation; creation, search, deep links, chat, two-way WebRTC audio, denied microphone recovery and release; invitation acceptance/cancellation/decline, blocking/unblocking, random matching, next partner, cross-tab recovery and account switching; English/Uzbek/Russian layouts at 320-1440px and visible call controls.');
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
