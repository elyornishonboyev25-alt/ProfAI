import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { build } from 'esbuild'

const requireBackend = createRequire(new URL('../backend/package.json', import.meta.url))
const WebSocket = requireBackend('ws')
async function main() {
const directory = await mkdtemp(join(tmpdir(), 'profai-avatar-browser-'))
const source = `
  import React from 'react';
  import { createRoot } from 'react-dom/client';
  import { ProfileAvatar, DEFAULT_PROFILE_AVATAR } from './src/components/profile/ProfileAvatar';
  const root = createRoot(document.getElementById('root'));
  const cases = [null, '', ' ', '/missing.jpg', 'data:image/png;base64,broken', '/unavailable.jpg', DEFAULT_PROFILE_AVATAR];
  const draw = (updated = false) => root.render(<div>{cases.map((src, index) =>
    <div key={index} data-case={index} style={{width:24+index*16,height:24+index*16,overflow:'hidden',borderRadius:'50%',margin:12}}>
      <ProfileAvatar src={updated && index === 3 ? DEFAULT_PROFILE_AVATAR : src} />
    </div>)}</div>);
  draw(); window.replaceFailedAvatar = () => draw(true);
`
const bundle = await build({ stdin: { contents: source, loader: 'tsx', resolveDir: process.cwd() }, bundle: true, write: false, format: 'iife', tsconfig: 'tsconfig.json', loader: { '.jpg': 'dataurl' }, define: { 'process.env.NODE_ENV': '"production"' } })
const css = await readFile('src/index.css', 'utf8')
const avatarCss = css.match(/\.profile-avatar-media\s*\{[^}]+\}/)?.[0]
assert.ok(avatarCss)
const requests = []
const server = createServer((req, res) => {
  requests.push(req.url)
  if (req.url === '/') {
    res.setHeader('Content-Type', 'text/html')
    res.end(`<style>${avatarCss}</style><div id="root"></div><script src="/fixture.js"></script>`)
  } else if (req.url === '/fixture.js') {
    res.setHeader('Content-Type', 'text/javascript'); res.end(bundle.outputFiles[0].text)
  } else { res.writeHead(req.url === '/unavailable.jpg' ? 503 : 404); res.end() }
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const executable = process.env.AVATAR_TEST_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const browser = spawn(executable, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', '--user-data-dir=' + directory, 'about:blank'], { windowsHide: true, stdio: 'ignore' })
const exited = new Promise(resolve => { browser.once('exit', resolve); browser.once('error', resolve) })
let socket
try {
  let port
  for (let n = 0; n < 100; n++) {
    try { port = (await readFile(join(directory, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break } catch { /* Browser starting. */ }
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  assert.ok(port, 'Set AVATAR_TEST_BROWSER to an installed Chromium browser')
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
  socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl)
  await new Promise((resolve, reject) => { socket.once('open', resolve); socket.once('error', reject) })
  let id = 0
  const pending = new Map()
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const requestId = ++id
    const timeout = setTimeout(() => { pending.delete(requestId); reject(new Error(`CDP timeout: ${method}`)) }, 10000)
    pending.set(requestId, { resolve, reject, timeout })
    socket.send(JSON.stringify({ id: requestId, method, params }))
  })
  socket.on('message', data => {
    const message = JSON.parse(data)
    const call = pending.get(message.id)
    if (!call) return
    clearTimeout(call.timeout); pending.delete(message.id)
    if (message.error) call.reject(message.error); else call.resolve(message.result)
  })
  const evaluate = async expression => (await send('Runtime.evaluate', { expression, returnByValue: true })).result.value
  await send('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/` })
  for (let n = 0; n < 100; n++) {
    if (await evaluate(`document.querySelectorAll('img').length === 7 && [...document.images].every(i => i.complete && i.naturalWidth > 0)`)) break
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  const images = await evaluate(`[...document.images].map(i => ({decoded:i.complete && i.naturalWidth > 0,width:i.getBoundingClientRect().width,height:i.getBoundingClientRect().height,inline:i.src.startsWith('data:image/jpeg;base64,')}))`)
  assert.equal(images.length, 7)
  images.forEach((image, index) => {
    assert.equal(image.decoded, true, `Case ${index} must decode a real photo`)
    assert.equal(image.width, 24 + index * 16)
    assert.equal(image.height, 24 + index * 16)
    assert.equal(image.inline, true, `Case ${index} must recover without network access`)
  })
  assert.ok(!requests.some(url => url.startsWith('/assets/')), 'Fallback must not depend on a second asset request')
  await evaluate('window.replaceFailedAvatar()')
  await new Promise(resolve => setTimeout(resolve, 200))
  assert.equal(await evaluate(`document.querySelector('[data-case="3"] img').naturalWidth > 0`), true)
  console.log('Avatar browser tests passed: 7 decoded photos, 24–120px layouts, missing/corrupt/offline images and source replacement.')
  await send('Browser.close').catch(() => {})
} finally {
  socket?.close()
  browser.kill()
  await exited
  await new Promise(resolve => server.close(resolve))
  await rm(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
}
}

main().catch(error => { console.error(error); process.exitCode = 1 })
