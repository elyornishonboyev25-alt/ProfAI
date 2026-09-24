import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { build } from 'esbuild'
import postcss from 'postcss'
import tailwind from 'tailwindcss'

// Real Chromium, real components and CSS; API fixtures never touch live accounts.
const requireBackend = createRequire(new URL('../backend/package.json', import.meta.url))
const WebSocket = requireBackend('ws')
const directory = await mkdtemp(join(tmpdir(), 'profai-center-browser-'))
const bundle = await build({ entryPoints: ['scripts/tests/learning-center-ui.tsx'], bundle: true, write: false, outdir: directory, format: 'iife', tsconfig: 'tsconfig.json', loader: { '.jpg': 'dataurl' }, define: { 'process.env.NODE_ENV': '"development"', 'import.meta.env': '{}' }, plugins: [{ name: 'test-copy', setup(builder) {
  builder.onResolve({ filter: /^@\/i18n\/interface$/ }, () => ({ path: 'copy', namespace: 'test-copy' }))
  builder.onLoad({ filter: /.*/, namespace: 'test-copy' }, () => ({ contents: 'export const useCopy = () => ({ c: text => text })' }))
} }] })
const css = await postcss([tailwind()]).process(await readFile('src/index.css', 'utf8'), { from: 'src/index.css' })
const script = bundle.outputFiles.find(file => file.path.endsWith('.js')).text
const centerCss = bundle.outputFiles.find(file => file.path.endsWith('.css')).text
const server = createServer((req, res) => {
  if (req.url === '/fixture.js') { res.setHeader('Content-Type', 'text/javascript'); res.end(script) }
  else if (req.url === '/fixture.css') { res.setHeader('Content-Type', 'text/css'); res.end(css.css + centerCss) }
  else { res.setHeader('Content-Type', 'text/html'); res.end('<meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"><div id="root"></div><script src="/fixture.js"></script>') }
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const browser = spawn(process.env.CENTER_TEST_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new', '--no-sandbox', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', '--user-data-dir=' + directory, 'about:blank'], { windowsHide: true, stdio: 'ignore' })
const exited = new Promise(resolve => { browser.once('exit', resolve); browser.once('error', resolve) })
let socket
try {
  let port
  for (let n = 0; n < 100; n++) {
    try { port = (await readFile(join(directory, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break } catch { /* Browser starting. */ }
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  assert.ok(port, 'Set CENTER_TEST_BROWSER to an installed Chromium browser')
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
  socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl)
  await new Promise((resolve, reject) => { socket.once('open', resolve); socket.once('error', reject) })
  let id = 0
  const pending = new Map()
  const errors = []
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const requestId = ++id
    const timeout = setTimeout(() => { pending.delete(requestId); reject(new Error(`CDP timeout: ${method}`)) }, 15000)
    pending.set(requestId, { resolve, reject, timeout })
    socket.send(JSON.stringify({ id: requestId, method, params }))
  })
  socket.on('message', data => {
    const message = JSON.parse(data)
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text)
    const call = pending.get(message.id)
    if (!call) return
    clearTimeout(call.timeout); pending.delete(message.id)
    if (message.error) call.reject(message.error); else call.resolve(message.result)
  })
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text)
    return result.result.value
  }
  const until = async expression => {
    for (let n = 0; n < 100; n++) { if (await evaluate(`Boolean(${expression})`)) return; await new Promise(resolve => setTimeout(resolve, 50)) }
    throw new Error('Timed out: ' + expression)
  }
  const click = text => evaluate(`(() => { const button = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(text)}); button.focus(); button.click(); })()`)
  const input = (selector, value) => evaluate(`(() => { const element = document.querySelector(${JSON.stringify(selector)}); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(element, ${JSON.stringify(value)}); element.dispatchEvent(new Event('input', { bubbles: true })); })()`)
  const go = async path => { await evaluate(`window.go(${JSON.stringify(path)})`); await new Promise(resolve => setTimeout(resolve, 350)) }
  const resize = (width, height) => send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 768 })
  const screenshot = async name => { await evaluate('window.scrollTo(0, 0)'); await new Promise(resolve => setTimeout(resolve, 500)); const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: !name.includes('menu') }); await writeFile(join('artifacts/learning-center-redesign', name + '.png'), Buffer.from(shot.data, 'base64')) }
  await mkdir('artifacts/learning-center-redesign', { recursive: true })
  await send('Runtime.enable')
  await resize(1440, 1100)
  await send('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/` })
  await until(`document.querySelector('.lc-workspace-card')`)
  await screenshot('portal-desktop')
  await input('[aria-label="Search workspaces"]', 'missing')
  await until(`document.body.textContent.includes('No matching workspaces')`)
  await click('Clear search')
  await until(`document.querySelector('.lc-workspace-card')`)
  await click('Create a workspace')
  await until(`document.querySelector('[role=dialog]')`)
  assert.equal(await evaluate(`document.activeElement.placeholder`), 'Oxford Learning Center')
  await input('[placeholder="Oxford Learning Center"]', '   ')
  await evaluate(`document.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))`)
  await until(`document.querySelector('[role=alert]')`)
  assert.equal(await evaluate(`window.calls.filter(c => c.action === 'create').length`), 0)
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' })
  await until(`!document.querySelector('[role=dialog]')`)
  assert.equal(await evaluate('document.activeElement.textContent.trim()'), 'Create a workspace')
  await click('Create a workspace')
  await input('[placeholder="Oxford Learning Center"]', '  New Center  ')
  await evaluate(`document.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))`)
  await until(`window.route === '/learning-center/oxford' && document.body.textContent.includes('Total students')`)
  assert.equal(await evaluate(`window.calls.find(c => c.action === 'create').input.name`), 'New Center')
  await screenshot('workspace-desktop')
  await go('/learning-center/oxford/students?groupId=group-a')
  await until(`window.calls.some(c => c.action === 'students' && c.query.groupId === 'group-a')`)
  await go('/learning-center/oxford/students?status=NEEDS_ATTENTION')
  await until(`window.calls.some(c => c.action === 'students' && c.query.status === 'NEEDS_ATTENTION' && !c.query.groupId)`)
  await click('Add student')
  await click('Add or invite')
  await until(`document.body.textContent.includes('Invitation ready')`)
  await evaluate(`document.querySelector('[aria-label="Close dialog"]').click()`)
  await click('Add student')
  assert.equal(await evaluate(`!!document.querySelector('[type=email]')`), true)
  await evaluate(`document.querySelector('[aria-label="Close dialog"]').click()`)
  await go('/learning-center/oxford/assignments')
  await click('New assignment')
  await evaluate(`(() => { const element = [...document.querySelectorAll('select')].find(s => [...s.options].some(o => o.value === 'WRITING')); element.value = 'WRITING'; element.dispatchEvent(new Event('change', { bubbles: true })); })()`)
  assert.equal(await evaluate(`document.querySelector('[placeholder="/sat or /ielts/writing/tests"]').value`), '/ielts/writing/tests')
  await input('[placeholder="30 Advanced Math Questions"]', 'Writing practice')
  await input('[type="datetime-local"]', '2020-01-01T12:00')
  await evaluate(`document.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))`)
  await until(`document.querySelector('[role=dialog]').textContent.includes('Choose a deadline in the future')`)
  assert.equal(await evaluate(`window.calls.filter(c => c.action === 'assignment').length`), 0)
  await evaluate(`document.querySelector('[aria-label="Close dialog"]').click()`)
  await go('/copy')
  await evaluate(`window.workspace.role = 'STUDENT'; window.failSubmission = true; window.assignmentRows = [{ id: 'task-1', title: 'SAT practice', kind: 'TEST', examTrack: 'SAT', routePath: '/sat?mode=practice#start', dueAt: '2027-01-01', pipeline: { assigned: 0, inProgress: 0, completed: 0, overdue: 1 }, submissions: [{ id: 'submission-1', status: 'OVERDUE', progress: 40, student: { fullName: 'Learner' } }], createdBy: { fullName: 'Teacher' } }]`)
  await go('/learning-center/oxford/assignments')
  await click('Open assignment')
  await until(`document.querySelector('[role=alert]')?.textContent.includes('Progress could not be saved')`)
  assert.equal(await evaluate('window.route'), '/learning-center/oxford/assignments')
  await evaluate('window.failSubmission = false')
  await click('Open assignment')
  await until(`window.route === '/sat?mode=practice&assignmentId=task-1'`)
  assert.equal(await evaluate(`window.calls.find(c => c.action === 'submission').input.progress`), 40)
  await evaluate(`window.workspace.role = 'OWNER'`)
  await go('/copy')
  await evaluate(`Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Denied') } } })`)
  await click('Copy invitation link')
  await until(`document.querySelector('[role=status]').textContent.includes('Copy is unavailable')`)
  await evaluate(`Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async value => { window.copied = value } } })`)
  await click('Copy invitation link')
  await until(`document.querySelector('[role=status]').textContent.includes('Link copied')`)
  await go('/learning-center/join/ABC123')
  assert.equal(await evaluate(`window.calls.filter(c => c.action === 'join').length`), 0)
  await click('Accept invitation')
  await until(`window.route === '/learning-center/oxford'`)
  assert.equal(await evaluate(`window.calls.filter(c => c.action === 'join').length`), 1)
  await go('/race')
  await until(`window.pending.first`)
  await evaluate(`window.query('second')`)
  await until(`window.pending.second`)
  await evaluate(`window.pending.second.resolve('Latest result')`)
  await until(`document.querySelector('#race').textContent === 'Latest result'`)
  await evaluate(`window.pending.first.reject(new Error('Stale failure'))`)
  assert.equal(await evaluate(`document.querySelector('#race').textContent`), 'Latest result')
  await go('/learning-center')
  for (const width of [320, 390, 768]) {
    await resize(width, 844)
    await new Promise(resolve => setTimeout(resolve, 150))
    assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'), true, `Portal overflow at ${width}px`)
  }
  await resize(390, 844)
  await screenshot('portal-mobile')
  await go('/learning-center/oxford')
  await until(`document.body.textContent.includes('Total students')`)
  assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'), true, 'Workspace mobile overflow')
  await evaluate(`document.querySelector('[aria-label="Open navigation"]').click()`)
  await until(`document.querySelector('[aria-label="Workspace navigation"]')`)
  await screenshot('workspace-mobile-menu')
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' })
  await until(`!document.querySelector('[aria-label="Workspace navigation"]')`)
  await evaluate(`window.failWorkspaces = true`)
  await go('/learning-center')
  await until(`document.body.textContent.includes('Workspace service unavailable')`)
  await evaluate(`window.failWorkspaces = false`)
  await click('Try again')
  await until(`document.querySelector('.lc-workspace-card')`)
  await evaluate(`window.guest()`)
  await click('Create a workspace')
  await until(`window.route === '/login'`)
  assert.equal(await evaluate('window.routeState.from.pathname'), '/learning-center')
  await go('/learning-center/join/ABC123')
  await click('Sign In')
  await until(`window.route === '/login'`)
  assert.equal(await evaluate('window.routeState.from.pathname'), '/learning-center/join/ABC123')
  assert.deepEqual(errors, [], 'No uncaught browser errors')
  console.log('PASS: responsive portal/workspace, search, create validation, modal focus/Escape, URL filters, fresh invitation forms, clipboard success/failure, explicit join, assignment destinations/deadlines/retry, request race, mobile menu, workspace retry and sign-in return paths.')
  await send('Browser.close').catch(() => {})
} finally {
  socket?.close(); browser.kill(); await exited
  await new Promise(resolve => server.close(resolve))
  // Keep the isolated browser profile in the OS temp directory; screenshots are untracked artifacts.
}
