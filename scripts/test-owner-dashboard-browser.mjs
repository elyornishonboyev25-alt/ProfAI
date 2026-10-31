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
const directory = await mkdtemp(join(tmpdir(), 'profai-owner-browser-'))
const screenshots = resolve('tmp/owner-dashboard-browser')
const bundle = await build({ stdin: { contents: `
  import React from 'react'; import {createRoot} from 'react-dom/client';
  import {MemoryRouter} from 'react-router-dom'; import OwnerDashboard from './src/pages/OwnerDashboard';
  import i18n from './src/i18n'; import {installOwnerDashboardFixture} from './scripts/tests/owner-dashboard-fixture';
  window.fixture=installOwnerDashboardFixture().fixture; window.setLanguage=language=>i18n.changeLanguage(language);
  void i18n.changeLanguage('en').then(()=>createRoot(document.getElementById('root')).render(<MemoryRouter><OwnerDashboard/></MemoryRouter>));
`, loader: 'tsx', resolveDir: process.cwd() }, bundle: true, write: false, outfile: join(directory, 'fixture.js'), format: 'iife', tsconfig: 'tsconfig.json', define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"production"' }, loader: { '.jpg': 'dataurl', '.png': 'dataurl' } })
const css = (await postcss([tailwindcss()]).process(await readFile('src/index.css', 'utf8'), { from: 'src/index.css' })).css + '\n' + bundle.outputFiles.filter(file => file.path.endsWith('.css')).map(file => file.text).join('\n')
const server = createServer((req, res) => {
  if (req.url === '/fixture.js') { res.setHeader('Content-Type', 'text/javascript'); res.end(bundle.outputFiles.find(file => file.path.endsWith('.js')).text) }
  else { res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(`<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css}</style><body style="background:#e9edf4"><div id="root"></div><script src="/fixture.js"></script></body>`) }
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const executable = process.env.OWNER_TEST_BROWSER || (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : 'google-chrome')
const browser = spawn(executable, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', '--user-data-dir=' + directory, 'about:blank'], { stdio: 'ignore' })
let socket, launchError
browser.on('error', error => { launchError = error })
try {
  let port
  for (let i = 0; i < 100; i++) {
    if (launchError) throw launchError
    try { port = (await readFile(join(directory, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break } catch { await new Promise(resolve => setTimeout(resolve, 100)) }
  }
  assert.ok(port, 'Set OWNER_TEST_BROWSER to an installed Chromium browser')
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
  socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl)
  await new Promise(resolve => socket.once('open', resolve))
  let id = 0
  const pending = new Map(), errors = []
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const requestId = ++id
    const timer = setTimeout(() => { pending.delete(requestId); reject(new Error(method)) }, 15000)
    pending.set(requestId, { resolve, reject, timer }); socket.send(JSON.stringify({ id: requestId, method, params }))
  })
  socket.on('message', raw => {
    const message = JSON.parse(raw)
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params)
    const call = pending.get(message.id)
    if (!call) return
    pending.delete(message.id); clearTimeout(call.timer)
    if (message.error) call.reject(message.error); else call.resolve(message.result)
  })
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
    assert.ok(!result.exceptionDetails, JSON.stringify(result.exceptionDetails)); return result.result.value
  }
  const until = async expression => {
    for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await new Promise(resolve => setTimeout(resolve, 50)) }
    throw new Error(`Timed out: ${expression}; ${await evaluate('document.body.innerText')}`)
  }
  await send('Runtime.enable')
  await send('Page.navigate', { url: `http://127.0.0.1:${server.address().port}` })
  await until('document.querySelectorAll(".owner-navigation button").length===5')
  await mkdir(screenshots, { recursive: true })
  for (const [width, height] of [[1440, 1000], [390, 844]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 640 })
    for (const [section, name] of [[1, 'users'], [2, 'payments']]) {
      await evaluate(`document.querySelectorAll('.owner-navigation button')[${section}].click()`)
      await until(name === 'users' ? '!!document.querySelector(".owner-users-list")' : '!!document.querySelector(".owner-promotions-list")')
      assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'), true, `${name} overflows at ${width}px`)
      assert.equal(await evaluate(`[...document.querySelectorAll('.owner-update-badge')].every(node=>{const r=node.getBoundingClientRect();return r.width>=22&&r.left>=0&&r.right<=innerWidth&&r.top>=0})`), true, 'badges remain visible')
      if (name === 'users') {
        await evaluate('document.querySelectorAll("button.owner-metric")[1].click()')
        await until('document.querySelector(".owner-users-list")?.innerText.includes("Today Learner")')
      } else {
        assert.equal(await evaluate('document.querySelector(".owner-promotions-list").innerText.includes("IVYEXAMPLE")'), true)
        assert.equal(await evaluate('document.querySelector(".owner-promotions-list").innerText.includes("USD 3.00")'), true)
      }
      const screenshot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
      await writeFile(join(screenshots, `${name}-${width}.png`), Buffer.from(screenshot.data, 'base64'))
    }
    await evaluate('window.setLanguage("uz")')
    await until('document.querySelector(".owner-promotions-list")?.innerText.includes("Promokod: IVYEXAMPLE")')
    assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'), true, `Uzbek layout overflows at ${width}px`)
    await evaluate('window.setLanguage("en")')
  }
  assert.deepEqual(errors, [])
  console.log(`PASS: owner dashboard at 1440px and 390px; filters, badges, discounted amounts, promo users, Uzbek, no overflow or browser errors. Screenshots: ${screenshots}`)
} finally {
  socket?.close(); browser.kill()
  await new Promise(resolve => server.close(resolve))
  await rm(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
}
