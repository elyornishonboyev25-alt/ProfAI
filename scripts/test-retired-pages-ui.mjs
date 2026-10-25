import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { createRequire } from 'node:module'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const requireBackend = createRequire(new URL('../backend/package.json', import.meta.url))
const { JSDOM } = requireBackend('jsdom')
const directory = await mkdtemp(join(tmpdir(), 'ivygoo-retired-ui-'))
const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost', pretendToBeVisual: true })
try {
  for (const key of ['window', 'document', 'HTMLElement', 'HTMLInputElement', 'Element', 'Node', 'CustomEvent', 'Event', 'SVGElement', 'getComputedStyle']) globalThis[key] = dom.window[key]
  Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true })
  globalThis.localStorage = dom.window.localStorage
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window)
  globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window)
  dom.window.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })
  globalThis.fetch = async () => new Response('{}', { status: 503 })
  const outfile = join(directory, 'suite.cjs')
  await build({
    stdin: { contents: `
      import React, { act } from 'react'
      import { createRoot } from 'react-dom/client'
      import { MemoryRouter } from 'react-router-dom'
      import App from './src/App'
      import './src/i18n'
      import { useAuthStore } from './src/store/authStore'
      import assert from 'node:assert/strict'
      export async function run() {
        const root = createRoot(document.getElementById('root'))
        let revision = 0
        const render = async path => {
          globalThis.retiredPageGateCalls = 0
          await act(async () => {
            root.render(<MemoryRouter key={++revision} initialEntries={[path]}><App /></MemoryRouter>)
            await new Promise(resolve => setTimeout(resolve, 0))
          })
        }
        try {
          for (const session of [
            { hydrated: false, user: null, accessToken: null },
            { hydrated: true, user: null, accessToken: null },
            { hydrated: true, user: { id: 'layout-test-user' }, accessToken: 'test-access' },
          ]) {
            useAuthStore.setState(session)
            for (const path of ['/test-preparation', '/tests', '/mock', '/test-preparation/old', '/TEST-PREPARATION/', '/test%2Dpreparation', '/tests/?source=old']) {
              await render(path)
              assert.match(document.querySelector('h1')?.textContent || '', /404/, path)
              assert.equal(globalThis.retiredPageGateCalls, 0, 'Retired page bypasses auth/device gates: ' + path)
              assert.ok(!document.body.textContent.includes('Choose your exam'), path)
              for (const link of document.querySelectorAll('a[href]')) assert.ok(!['/test-preparation', '/tests', '/mock'].includes(link.getAttribute('href')), '404 links to an active page')
            }
          }
          for (const path of ['/dashboard', '/ielts/tests', '/sat', '/mock/ielts/full-mock-1', '/mock/sat/1', '/tests/custom-test/attempt']) {
            await render(path)
            assert.equal(globalThis.retiredPageGateCalls, 1, 'Active route retains its account gate: ' + path)
            assert.ok(document.querySelector('[data-account-gate]'), path)
          }
          console.log('PASS: retired pages show 404 before hydration, for guests and signed-in users; active exam routes retain their account gate')
        } finally { await act(async () => root.unmount()) }
      }
    `, resolveDir: process.cwd(), loader: 'tsx' },
    bundle: true, platform: 'node', format: 'cjs', outfile, tsconfig: 'tsconfig.json',
    define: { 'import.meta.env': '{}' }, external: ['node:assert/strict'],
    loader: { '.css': 'empty', '.jpg': 'dataurl', '.png': 'dataurl', '.svg': 'dataurl' },
    plugins: [{ name: 'retired-page-gates', setup(builder) {
      builder.onResolve({ filter: /^@\/pages\// }, args => args.path === '@/pages/NotFound' ? undefined : { path: args.path, external: true })
      builder.onResolve({ filter: /^@\/components\/auth\/AccountUsageBoundary$/ }, () => ({ path: 'gate', namespace: 'test-gate' }))
      builder.onLoad({ filter: /.*/, namespace: 'test-gate' }, () => ({ resolveDir: process.cwd(), loader: 'tsx', contents: 'import React from "react"; export default function AccountGate() { globalThis.retiredPageGateCalls++; return <div data-account-gate>Account gate</div> }' }))
    } }],
  })
  await createRequire(import.meta.url)(outfile).run()
} finally {
  dom.window.close()
  assert.ok(resolve(directory).startsWith(join(resolve(tmpdir()), 'ivygoo-retired-ui-')))
  await rm(directory, { recursive: true, force: true })
}
process.exit(0)
