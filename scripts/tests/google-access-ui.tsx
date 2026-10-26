import assert from 'node:assert/strict'
import '@/i18n'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import GoogleAuthButton from '@/components/auth/GoogleAuthButton'

export async function run() {
  const root = createRoot(document.getElementById('root')!)
  const originalFetch = globalThis.fetch
  let callback: (value: { credential: string }) => void = () => {}
  let prompts = 0, cancellations = 0, deliveries = 0
  window.google = { accounts: { id: {
    initialize(options) {
      assert.equal(options.auto_select, false, 'Account choice requires consent')
      assert.equal(options.button_auto_select, false)
      callback = options.callback
    },
    renderButton(parent) { const button = document.createElement('button'); button.textContent = 'Google'; parent.append(button) },
    prompt() { prompts++ }, cancel() { cancellations++ },
  } } }
  globalThis.fetch = async () => new Response(JSON.stringify({ enabled: true, clientId: 'test-client' }))
  const credential = async (token: string) => { assert.equal(token, 'verified-google-token'); deliveries++ }
  const pause = () => new Promise(resolve => window.setTimeout(resolve, 400))
  try {
    await act(async () => root.render(<React.StrictMode><GoogleAuthButton mode="signin" promptOnMount onCredential={credential} /></React.StrictMode>))
    await act(pause)
    assert.equal(prompts, 1, 'Strict Mode must not show two account choosers')
    await act(async () => callback({ credential: 'verified-google-token' }))
    assert.equal(deliveries, 1, 'Google credentials reach the account handler')
    await act(async () => root.render(<GoogleAuthButton mode="signin" promptOnMount={false} onCredential={credential} />))
    assert.ok(cancellations > 0, 'Switching away dismisses the Google chooser')
    const before = prompts
    await act(pause)
    assert.equal(prompts, before, 'Email access does not reopen Google')
    await act(async () => root.render(<GoogleAuthButton mode="signin" disabled onCredential={credential} />))
    await act(async () => callback({ credential: 'verified-google-token' }))
    assert.equal(deliveries, 1, 'Disabled access cannot deliver a credential')
    console.log('PASS Google chooser consent, Strict Mode, credential delivery, cancellation, email fallback and disabled access')
  } finally {
    await act(async () => root.unmount())
    globalThis.fetch = originalFetch
    delete window.google
  }
}
