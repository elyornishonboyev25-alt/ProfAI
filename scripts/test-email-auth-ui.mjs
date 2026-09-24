import { build } from 'esbuild'
import { createRequire } from 'node:module'
import { mkdtemp, unlink, rmdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const requireBackend = createRequire(new URL('../backend/package.json', import.meta.url))
const { JSDOM } = requireBackend('jsdom')
const directory = await mkdtemp(join(tmpdir(), 'profai-email-auth-'))
const outfile = join(directory, 'suite.cjs')
const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost:5173' })
try {
  for (const key of ['window', 'document', 'HTMLElement', 'HTMLInputElement', 'Event', 'Node']) globalThis[key] = dom.window[key]
  Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true })
  globalThis.localStorage = dom.window.localStorage
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  await build({
    stdin: { contents: `
      import assert from 'node:assert/strict'
      import React, { act } from 'react'
      import { createRoot } from 'react-dom/client'
      import EmailCodeForm from './src/components/auth/EmailCodeForm'
      export async function run() {
        let calls = [], received = null, recovered = null, fail = false
        globalThis.fetch = async (url, options) => {
          calls.push({ url, body: JSON.parse(options.body) })
          return new Response(JSON.stringify(fail ? { message: 'Email delivery is not configured.' } : url.endsWith('/email/login')
            ? { user: { id: 'existing-user' }, accessToken: 'access', refreshToken: 'refresh' }
            : { delivered: true, expiresInSec: 600 }), { status: fail ? 503 : 200 })
        }
        const root = createRoot(document.getElementById('root'))
        const render = async (key) => act(async () => root.render(<EmailCodeForm key={key} initialEmail="learner@gmail.com" onAuthenticated={async (session) => { received = session }} onRecover={(email) => { recovered = email }} />))
        const submit = async () => act(async () => { document.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); await new Promise(resolve => setTimeout(resolve, 0)) })
        const input = async (element, value) => act(async () => {
          Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(element, value)
          element.dispatchEvent(new Event('input', { bubbles: true }))
        })
        try {
          await render('success')
          await submit()
          assert.equal(calls[0].body.purpose, 'SIGN_IN')
          assert.match(document.querySelector('[role=status]').textContent, /learner@gmail.com/)
          assert.equal(document.querySelector('[autocomplete=one-time-code]').value, '')
          assert.equal([...document.querySelectorAll('button')].find(button => button.textContent.includes('Resend')).disabled, true)
          await input(document.querySelector('[autocomplete=one-time-code]'), '123456')
          await submit()
          assert.equal(received.user.id, 'existing-user')
          assert.equal(calls[1].body.verificationCode, '123456')
          await act(async () => [...document.querySelectorAll('button')].find(button => button.textContent.includes('Forgot password')).click())
          assert.equal(recovered, 'learner@gmail.com')
          await input(document.querySelector('[type=email]'), 'different@gmail.com')
          assert.equal(document.querySelector('[autocomplete=one-time-code]'), null)
          fail = true
          await render('failure')
          await submit()
          assert.match(document.querySelector('[role=alert]').textContent, /not configured/)
          assert.equal(document.querySelector('[autocomplete=one-time-code]'), null)
          console.log('PASS: send, empty code field, cooldown, verify, recovery, email change, delivery failure')
        } finally { await act(async () => root.unmount()) }
      }
    `, resolveDir: process.cwd(), loader: 'tsx' },
    bundle: true, platform: 'node', format: 'cjs', outfile, tsconfig: 'tsconfig.json',
    define: { 'import.meta.env': '{}' }, external: ['node:assert/strict'],
    plugins: [{ name: 'test-copy', setup(builder) {
      builder.onResolve({ filter: /^@\/i18n\/interface$/ }, () => ({ path: 'copy', namespace: 'test-copy' }))
      builder.onLoad({ filter: /.*/, namespace: 'test-copy' }, () => ({ contents: 'export const useCopy = () => ({ c: text => text })' }))
    } }],
  })
  await createRequire(import.meta.url)(outfile).run()
} finally {
  dom.window.close()
  await unlink(outfile).catch(() => {})
  await rmdir(directory)
}

// Imported application stores may retain timers after the component unmounts.
process.exit(0)
