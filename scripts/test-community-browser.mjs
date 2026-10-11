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
    import './src/i18n/index';
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
    useAuthStore.setState({user:{id:name,nickname:name,fullName:name,premium:true,xp:100,level:2,currentStreak:3},accessToken:'account:'+name,refreshToken:'fixture'});
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
        return evaluate(`(()=>{const buttons=[...document.querySelectorAll('button')].filter(b=>!b.disabled);(buttons.find(b=>b.textContent.trim()===${JSON.stringify(text)})||buttons.find(b=>b.textContent.includes(${JSON.stringify(text)}))).click();})()`)
      }
      await send('Runtime.enable')
      await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] })
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
      await page.send('Page.bringToFront');
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
    await host.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 950, deviceScaleFactor: 1, mobile: false });
    await host.send('Page.bringToFront');
    // Render hover directly; pointer synthesis after mobile emulation varies by host.
    await host.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'},{name:'hover',value:'hover'},{name:'pointer',value:'fine'}]});
    await host.send('DOM.enable');await host.send('CSS.enable');
    const dom = await host.send('DOM.getDocument');
    const {nodeId:cardNode} = await host.send('DOM.querySelector',{nodeId:dom.root.nodeId,selector:'.community-learner-card'});
    await host.send('CSS.forcePseudoState',{nodeId:cardNode,forcedPseudoClasses:['hover']});
    await host.until("(()=>{const transform=getComputedStyle(document.querySelector('.community-learner-card')).transform;return transform!=='none' && new DOMMatrixReadOnly(transform).m42 < -4;})()");
    await host.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'},{name:'hover',value:'hover'},{name:'pointer',value:'fine'}]});
    await host.until("getComputedStyle(document.querySelector('.community-learner-card')).transform==='none'");
    await host.send('CSS.forcePseudoState',{nodeId:cardNode,forcedPseudoClasses:[]});
    assert.equal(await host.evaluate("!!document.querySelector('.community-room-list') || !!document.querySelector('.community-suggestions')"), false, 'Section shortcuts and learner lists are not duplicated');
    for (const width of [1440,1024,390,320]) {
      await host.send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:width<760});
      assert.equal(await host.evaluate("(()=>{const v=document.querySelector('.community-card-viewport');v.scrollTop=100;return getComputedStyle(v).overflowY==='auto'&&v.scrollHeight>v.clientHeight&&v.scrollTop>0;})()"),true,'Learner directory scrolls independently at '+width+'px');
    }
    const setInput=async(selector,value)=>host.evaluate('(()=>{const input=document.querySelector('+JSON.stringify(selector)+');Object.getOwnPropertyDescriptor(input instanceof HTMLSelectElement?HTMLSelectElement.prototype:HTMLInputElement.prototype,"value").set.call(input,'+JSON.stringify(value)+');input.dispatchEvent(new Event(input instanceof HTMLSelectElement?"change":"input",{bubbles:true}));})()');
    await setInput('.community-search-field input','DifferentBand');
    await host.until("document.querySelectorAll('.community-learner-card').length===1 && document.querySelector('.community-learner-card').innerText.includes('DifferentBand')");
    await host.click('Same target band');
    await host.until("document.querySelector('.community-empty')");
    await host.click('Show all learners');
    await host.until("document.querySelectorAll('.community-learner-card').length===16 && document.querySelector('.community-search-field input').value===''");
    await host.click('Same target band');
    await host.until("document.querySelectorAll('.community-learner-card').length===14");
    assert.equal(await host.evaluate("document.querySelector('.community-card-grid').innerText.includes('SatSameScore')"),false,'Same band also respects the exam');
    await host.click('Clear filters');
    await setInput('.community-exam-filter select','SAT');
    await host.until("document.querySelectorAll('.community-learner-card').length===1 && document.querySelector('.community-learner-card').innerText.includes('SatSameScore')");
    await host.click('Clear filters');
    await host.click('Same country');
    await host.until("document.querySelectorAll('.community-learner-card').length===15");
    await host.click('Online now');
    await host.until("document.querySelectorAll('.community-learner-card').length===14");
    await host.click('Clear filters');
    await host.evaluate("window.failSearch=true;window.dispatchEvent(new Event('focus'))");
    await host.until("document.querySelector('.community-error')");
    await host.click('Try again');
    await host.until("!document.querySelector('.community-error')&&document.querySelectorAll('.community-learner-card').length===16");
    await setInput('.community-sort select','xp');
    await host.until("document.querySelectorAll('.community-learner-card')[2]?.innerText.includes('SatSameScore')");
    await host.evaluate("document.querySelector('.community-card-footer button').click()");
    await host.until("window.communityPath==='/u/Leader'");
    await host.evaluate("window.navigateCommunity('/community')");
    await host.click('Voice rooms');
    await guest.click('Voice rooms');
    await layout(host, 'voice');
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
    await host.click('Invite friends');
    const invitation = await host.evaluate("document.querySelector('.hub-share-link input').value");
    const invitePath = new URL(invitation).pathname + new URL(invitation).search;
    await guest.evaluate(`window.navigateCommunity(${JSON.stringify(invitePath)})`);
    await guest.until("document.querySelector('.hub-invitation') && !document.querySelector('.hub-lobby')");
    await guest.click('Join invited room');
    await guest.until("document.querySelector('.hub-room-header')?.innerText.includes('Climate debate')");
    await guest.click('Leave room');
    await guest.evaluate("window.navigateCommunity('/community?mode=voice')");
    await guest.until("document.querySelector('.hub-room-card')?.innerText.includes('Climate debate')");
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
    await host.click('Explore')
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
    await setInput('.hub-partner-discovery .hub-room-search input',' nobody ');
    await host.until("document.querySelector('.hub-partner-discovery .hub-lobby-empty')?.innerText.includes('No partner found')");
    await host.click('Clear search');
    await host.until("document.querySelector('.hub-partner-card')?.innerText.includes('Guest')");
    await setInput('.hub-partner-discovery .hub-room-search input','  gUeSt  ');
    await host.until("document.querySelectorAll('.hub-partner-card').length===1");
    await host.click('Invite to talk');
    await host.until("document.querySelector('.hub-pending.is-inviting')?.innerText.includes('@Guest')");
    await guest.until("document.querySelector('.hub-invitation')?.innerText.includes('Host')");
    await host.click('Cancel');
    await guest.until("!document.querySelector('.hub-invitation')");
    await host.until("!document.querySelector('.hub-pending') && document.querySelector('.hub-partner-card')");
    await host.click('Invite to talk');
    await guest.until("document.querySelector('.hub-invitation')?.innerText.includes('Host')");
    await guest.click('Decline');
    await host.until("!document.querySelector('.hub-pending') && document.querySelector('.hub-partner-card')");
    await host.click('Invite to talk');
    await guest.until("document.querySelector('.hub-invitation')?.innerText.includes('Host')");
    await guest.click('Accept & join');
    await host.until("document.querySelector('.hub-room-header')?.innerText.includes('Private room')");
    await guest.until("document.querySelector('.hub-room-header')?.innerText.includes('Private room')");
    await host.click('Leave room');await guest.click('Leave room');
    await host.until("document.querySelector('.hub-partner-card')");
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
    for (const section of ['Hard Questions','Study Abroad Lounge']) {
      await host.click(section);await guest.click(section);
      await host.until("document.querySelector('.discussion-status .is-live')");
      await guest.until("document.querySelector('.discussion-status .is-live')");
      assert.equal(await host.evaluate("document.querySelector('.discussion-messages').innerText.includes('Live room question')"),false,'Switching discussion rooms clears unrelated messages');
      await host.evaluate("(()=>{const input=document.querySelector('.discussion-composer textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(input,'Live room question');input.dispatchEvent(new Event('input',{bubbles:true}));})()");
      await host.evaluate("document.querySelector('.discussion-composer button').click()");
      await guest.until("document.querySelector('.discussion-messages').innerText.includes('Live room question')");
      assert.equal(await host.evaluate("document.querySelector('.discussion-message.is-self')?.innerText.includes('You')"),true);
      const socketCount = await host.evaluate('window.communitySockets.length');
      await host.evaluate('window.communitySockets.at(-1).close()');
      await host.until(`window.communitySockets.length>${socketCount} && document.querySelector('.discussion-status .is-live') && document.querySelector('.discussion-messages').innerText.includes('Live room question')`);
      await layout(host,section==='Hard Questions'?'questions':'admissions');
    }
    await host.click('Explore');
    await host.send('Page.bringToFront')
    await host.evaluate(`window.champion='Guest'; window.dispatchEvent(new Event('focus'))`)
    await host.until(`document.querySelector('.hub-champion').innerText.includes('@Guest')`)
    await host.until("document.querySelectorAll('.community-learner-card.is-featured').length===1 && document.querySelector('.community-learner-card.is-featured').innerText.includes('@Guest') && document.querySelector('.community-learner-card.is-featured').innerText.includes('950')");
    await setInput('.community-search-field input','Leader');
    await host.until("document.querySelectorAll('.community-learner-card').length===1 && document.querySelector('.community-learner-card').innerText.includes('@Leader')");
    assert.equal(await host.evaluate("!!document.querySelector('.community-learner-card.is-featured')"),false,'Filtering never awards the crown to a lower-XP learner');
    assert.equal(await host.evaluate("document.querySelector('.hub-champion').innerText.includes('@Guest')"),true,'The global highest-XP learner stays visible across filters');
    assert.deepEqual(host.errors, [], 'Host has no browser exceptions')
    assert.deepEqual(guest.errors, [], 'Guest has no browser exceptions')
    console.log('Community browser passed: two-way WebRTC audio, debate modes/teams/turns, random matching/cancellation/next partner, private invitations and deep links, microphone release, chat, both discussion rooms, learner search/filters/reset/sorting/profile navigation/retry, independent learner scrolling and layouts at 320–1440px, visible call controls and champion refresh.')
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
