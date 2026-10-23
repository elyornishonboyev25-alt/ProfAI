import assert from 'node:assert/strict'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import AccountUsageBoundary from '@/components/auth/AccountUsageBoundary'
import { apiClient, ApiError } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import { useAccountUsageStore } from '@/store/accountUsageStore'
import i18n from '@/i18n'
import type { AuthUser } from '@/types/platform'

export async function run() {
  await i18n.changeLanguage('uz')
  const post = apiClient.post
  const container = document.getElementById('root')!
  const root = createRoot(container)
  const workspaceVisible = () => Boolean(container.querySelector('[data-account-workspace]:not([hidden])'))
  let mode: 'pending' | 'blocked' | 'allowed' | 'offline' = 'pending'
  let resolve: (() => void) | undefined
  let heartbeatCount = 0
  apiClient.post = async <T,>(path: string) => {
    if (path === '/auth/logout') return {} as T
    assert.equal(path, '/auth/activity/heartbeat')
    heartbeatCount++
    if (mode === 'pending') await new Promise<void>(done => { resolve = done })
    if (mode === 'blocked') throw new ApiError('Another device is active.', 409, 'ACCOUNT_IN_USE')
    if (mode === 'offline') throw new Error('Offline')
    return {} as T
  }
  useAuthStore.getState().setSession({ user: { id: 'usage-ui', role: 'USER' } as AuthUser, accessToken: 'access', refreshToken: 'refresh' })
  useAuthStore.getState().setHydrated(true)
  useAccountUsageStore.getState().resetUsage()
  try {
    await act(async () => { root.render(<AccountUsageBoundary><p>Protected saved test</p><input aria-label="Draft answer" defaultValue="Unsaved answer" /></AccountUsageBoundary>) })
    assert.equal(container.textContent?.includes('Protected saved test'), false, 'Cached routes cannot mount before server verification')
    mode = 'blocked'
    await act(async () => { resolve?.(); await new Promise(done => setTimeout(done, 10)) })
    assert.ok(container.textContent?.includes('boshqa qurilmada ishlatilmoqda'))
    assert.equal(container.textContent?.includes('Protected saved test'), false)
    assert.equal(useAuthStore.getState().refreshToken, 'refresh')
    mode = 'allowed'
    await act(async () => { (container.querySelector('button') as HTMLButtonElement).click(); await new Promise(done => setTimeout(done, 10)) })
    assert.ok(container.textContent?.includes('Protected saved test'), 'Retry resumes once the active device releases access')
    const draft = container.querySelector<HTMLInputElement>('input')!
    draft.value = 'Keep the latest answer'
    const actualNow = Date.now
    let clock = actualNow(), hidden = false
    const hiddenDescriptor = Object.getOwnPropertyDescriptor(document, 'hidden')
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden })
    Date.now = () => clock
    try {
      // Return within the lease: background verification must not hide the test.
      hidden = true
      await act(async () => document.dispatchEvent(new window.Event('visibilitychange')))
      mode = 'pending'
      hidden = false
      await act(async () => document.dispatchEvent(new window.Event('visibilitychange')))
      assert.equal(workspaceVisible(), true, 'Returning to a verified tab has no blocking loading screen')
      assert.equal(container.querySelector('input'), draft)
      mode = 'allowed'
      await act(async () => { resolve?.(); await new Promise(done => setTimeout(done, 10)) })
      // Return after suspension: gate the expired lease, retain the mounted attempt.
      hidden = true
      clock += 91_000
      await act(async () => document.dispatchEvent(new window.Event('visibilitychange')))
      mode = 'pending'
      hidden = false
      await act(async () => document.dispatchEvent(new window.Event('visibilitychange')))
      assert.equal(workspaceVisible(), false)
      assert.equal(container.querySelector('input'), draft, 'A suspended tab retains its live test while reconnecting')
      mode = 'allowed'
      await act(async () => { resolve?.(); await new Promise(done => setTimeout(done, 10)) })
      assert.equal(workspaceVisible(), true)
      assert.equal(container.querySelector('input'), draft)
      assert.equal(draft.value, 'Keep the latest answer')
    } finally {
      Date.now = actualNow
      if (hiddenDescriptor) Object.defineProperty(document, 'hidden', hiddenDescriptor)
      else Reflect.deleteProperty(document, 'hidden')
    }
    mode = 'offline'
    await act(async () => {
      useAccountUsageStore.getState().setUsage('usage-ui', 'active', Date.now() - 1)
      await new Promise(done => setTimeout(done, 1100))
    })
    assert.equal(workspaceVisible(), false, 'Offline cached work is hidden and inert when the verification expires')
    assert.equal(container.querySelector('[data-account-workspace]')?.getAttribute('aria-hidden'), 'true')
    await act(async () => { await new Promise(done => setTimeout(done, 1300)) })
    await act(async () => { (container.querySelector('button') as HTMLButtonElement).click(); await new Promise(done => setTimeout(done, 1300)) })
    assert.ok(container.textContent?.includes('tekshirib bo‘lmadi'))
    mode = 'allowed'
    await act(async () => { (container.querySelector('button') as HTMLButtonElement).click(); await new Promise(done => setTimeout(done, 10)) })
    assert.ok(container.textContent?.includes('Protected saved test'), 'A timed-out or failed request does not prevent the next retry')
    assert.equal(workspaceVisible(), true)
    assert.equal(container.querySelector('input'), draft, 'Verification must not remount the test')
    assert.equal(draft.value, 'Keep the latest answer', 'Temporary connectivity failures retain in-memory answers')
    await act(async () => { useAccountUsageStore.getState().setUsage('usage-ui', 'blocked') })
    await act(async () => { (container.querySelectorAll('button')[1] as HTMLButtonElement).click(); await new Promise(done => setTimeout(done, 10)) })
    assert.equal(useAuthStore.getState().user, null, 'Blocked device can sign out')
    assert.ok(heartbeatCount >= 4)
    console.log('PASS: account usage verification, blocked cached routes, retry, offline expiry and sign-out')
  } finally {
    await act(async () => root.unmount())
    apiClient.post = post
    useAuthStore.getState().clearSession()
  }
}
