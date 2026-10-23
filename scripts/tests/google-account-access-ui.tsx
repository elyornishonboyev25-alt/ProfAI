import React, { act } from 'react'
import assert from 'node:assert/strict'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import GoogleAuthButton from '../../src/components/auth/GoogleAuthButton'
import GoogleOneTap from '../../src/components/auth/GoogleOneTap'
import EmailCodeForm from '../../src/components/auth/EmailCodeForm'
import AnalyticsRuntime from '../../src/components/analytics/AnalyticsRuntime'
import { apiClient } from '../../src/lib/apiClient'
import { useAuthStore } from '../../src/store/authStore'
import type { GoogleIdentity } from '../../src/lib/googleIdentity'
import '../../src/i18n'

export async function run() {
  globalThis.sessionStorage = window.sessionStorage
  sessionStorage.clear(); localStorage.clear()
  const root = createRoot(document.getElementById('root')!)
  const originalGet = apiClient.get, originalPost = apiClient.post
  const originalSetTimeout = window.setTimeout, originalClearTimeout = window.clearTimeout
  let time = 0, timerId = 900_000, prompts = 0, cancellations = 0, initializations = 0, received = 0
  const timers = new Map<number, { at: number; run: () => void }>()
  window.setTimeout = ((run: () => void, delay: number, ...args: unknown[]) => {
    if (delay !== 2500) return originalSetTimeout.call(window, run, delay, ...args)
    const id = ++timerId; timers.set(id, { at: time + delay, run }); return id
  }) as typeof window.setTimeout
  window.clearTimeout = ((id: number) => { if (!timers.delete(id)) originalClearTimeout.call(window, id) }) as typeof window.clearTimeout
  const advance = async (milliseconds: number) => { time += milliseconds; await act(async () => { for (const [id, timer] of timers) if (timer.at <= time) { timers.delete(id); timer.run() }; await Promise.resolve() }) }
  let callback: Parameters<GoogleIdentity['initialize']>[0]['callback'] = () => {}
  window.google = { accounts: { id: {
    initialize: options => { initializations++; callback = options.callback; assert.equal(options.client_id, 'backend-client'); assert.equal(options.auto_select, false); assert.equal(options.button_auto_select, false) },
    renderButton: (parent, options) => { assert.equal(options.text, 'continue_with'); assert.equal(options.shape, 'pill'); assert.ok(options.width >= 200 && options.width <= 400); const button = document.createElement('button'); button.textContent = 'Continue with Google'; parent.appendChild(button) },
    prompt: () => { prompts++ }, cancel: () => { cancellations++ },
  } } }
  const posts: unknown[] = []
  apiClient.get = (async () => ({ enabled: true, clientId: 'backend-client' })) as typeof apiClient.get
  apiClient.post = (async (path, body) => { posts.push({ path, body }); throw new Error('Google sign-in failed') }) as typeof apiClient.post
  useAuthStore.setState({ user: null, hydrated: true, accessToken: null, refreshToken: null })
  try {
    await act(async () => root.render(<GoogleOneTap />))
    assert.equal(prompts, 0)
    await advance(2499); assert.equal(prompts, 0, 'Never interrupts the first 2.5 seconds')
    await advance(1); assert.equal(prompts, 1)
    assert.equal(sessionStorage.getItem('ivygoo:google-one-tap-attempted'), '1')
    await act(async () => root.render(<div />))
    assert.equal(cancellations, 1, 'Leaving the landing page cancels its chooser')
    await act(async () => { callback({ credential: 'stale-credential' }); await Promise.resolve() })
    assert.equal(posts.length, 0, 'An unmounted prompt cannot sign in on another route')
    await act(async () => root.render(<GoogleOneTap />))
    await advance(3000); assert.equal(prompts, 1, 'Does not nag again during the same session')
    await act(async () => root.render(<div><EmailCodeForm onAuthenticated={async () => {}} /><GoogleAuthButton mode="signup" onCredential={async credential => { assert.equal(credential, 'button-credential'); received++ }} /></div>))
    assert.ok(document.body.textContent?.includes('Continue with Google'))
    assert.equal(document.querySelector('input[type=password]'), null)
    assert.equal(initializations, 1, 'Button and One Tap share the same Google initialization')
    await act(async () => { callback({ credential: 'button-credential' }); await Promise.resolve() })
    assert.equal(received, 1)
    await act(async () => root.render(<GoogleAuthButton mode="signin" onCredential={async () => { throw new Error('Google sign-in failed') }} />))
    await act(async () => { callback({ credential: 'bad-credential' }); await Promise.resolve() })
    assert.ok(document.querySelector('[role=alert]'), 'Failed Google authentication has a useful inline error')
    sessionStorage.clear()
    await act(async () => root.render(<GoogleOneTap />))
    await act(async () => root.render(<div />))
    await advance(3000); assert.equal(prompts, 1, 'Unmount before the delay does not show a prompt')
    useAuthStore.setState({ user: { id: 'signed-in' } as never })
    await act(async () => root.render(<GoogleOneTap />))
    await advance(3000); assert.equal(prompts, 1, 'Signed-in learners never see the signup prompt')
    await act(async () => root.render(<MemoryRouter><AnalyticsRuntime /></MemoryRouter>))
    assert.equal(document.querySelector('[role=dialog]'), null)
    assert.equal(document.body.textContent, '', 'No analytics entrance banner is rendered')
    console.log('Google button, delayed One Tap, lifecycle cancellation, existing sessions, no passwords and removed analytics banner passed.')
  } finally {
    await act(async () => root.unmount())
    apiClient.get = originalGet; apiClient.post = originalPost
    window.setTimeout = originalSetTimeout; window.clearTimeout = originalClearTimeout
    delete window.google; useAuthStore.getState().clearSession()
  }
}
