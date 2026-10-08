import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import assert from 'node:assert/strict'
import { apiClient } from '../../src/lib/apiClient'
import { useAuthStore } from '../../src/store/authStore'
import { useXpNotificationStore, XP_NOTIFICATION_DURATION } from '../../src/store/xpNotificationStore'
import { XpNotification } from '../../src/components/common/XpNotification'

export async function run() {
  useAuthStore.setState({ user: { id: 'learner' } as never, accessToken: 'token', refreshToken: null })
  const store = useXpNotificationStore.getState
  let payload: unknown = { xpEarned: 12 }
  let status = 200
  globalThis.fetch = async () => new Response(JSON.stringify(payload), { status })
  await apiClient.get('/profile')
  assert.equal(store().rewards.length, 0, 'Loading historical XP does not celebrate')
  await apiClient.post('/profile/xp/activity', { source: 'VOCAB_QUIZ' })
  assert.equal(store().rewards[0].amount, 12)
  await apiClient.post('/profile/heartbeat')
  assert.equal(store().rewards[0].amount, 24, 'Nearby awards combine into one unobtrusive notification')
  for (const ignored of [{ xpEarned: 12, duplicate: true }, { xpEarned: 0 }, { xpEarned: -1 }, { xpEarned: '12' }]) {
    payload = ignored
    await apiClient.post('/profile/xp/activity')
    assert.equal(store().rewards[0].amount, 24, 'Duplicate and invalid awards do not notify')
  }
  status = 500
  await assert.rejects(apiClient.post('/profile/xp/activity'))
  assert.equal(store().rewards[0].amount, 24, 'Failed requests do not notify')
  status = 200
  payload = { xpEarned: 30 }
  const container = document.getElementById('root')!
  const root = createRoot(container)
  const timers = new Map<number, () => void>()
  const originalSetTimeout = window.setTimeout.bind(window)
  const originalClearTimeout = window.clearTimeout.bind(window)
  let timerId = 90000
  window.setTimeout = ((callback: () => void, delay?: number) => {
    if (delay !== XP_NOTIFICATION_DURATION) return originalSetTimeout(callback, delay)
    const id = ++timerId
    timers.set(id, callback)
    return id
  }) as typeof window.setTimeout
  window.clearTimeout = (id) => {
    if (id && timers.delete(id)) return
    originalClearTimeout(id)
  }
  const visible = () => document.querySelector('[aria-atomic="true"]')?.textContent
  try {
    await act(async () => root.render(<XpNotification deferActivityRewards />))
    assert.equal(visible(), '', 'Background activity XP stays hidden during tests')
    assert.equal(timers.size, 0, 'Deferred awards do not expire unseen')
    await act(async () => { await apiClient.post('/tests/listening-sync') })
    assert.equal(visible(), '+30 XP', 'Test completion shows its reward immediately')
    assert.equal(timers.size, 1)
    assert.equal(document.querySelector('[aria-atomic="true"]')?.parentElement, document.body, 'Notification renders above test and result overlays')
    const expire = () => { const callbacks = [...timers.values()]; timers.clear(); callbacks.forEach((callback) => callback()) }
    await act(async () => expire())
    assert.equal(store().rewards.length, 1, 'Only the visible reward expires')
    await act(async () => root.render(<XpNotification />))
    assert.equal(visible(), '+24 XP', 'Deferred activity rewards appear after leaving the test')
    await act(async () => expire())
    assert.equal(store().rewards.length, 0, 'Notification dismisses automatically after 2.2 seconds')
    await act(async () => { await apiClient.post('/profile/xp/activity', { source: 'WRITING' }) })
    assert.equal(store().rewards[0].testCompleted, true, 'Writing completion counts as a test reward')
    const fullscreen = document.createElement('section')
    document.body.append(fullscreen)
    Object.defineProperty(document, 'fullscreenElement', { value: fullscreen, configurable: true })
    await act(async () => document.dispatchEvent(new Event('fullscreenchange')))
    assert.equal(document.querySelector('[aria-atomic="true"]')?.parentElement, fullscreen, 'Rewards remain visible inside a fullscreen workspace')
    Object.defineProperty(document, 'fullscreenElement', { value: null, configurable: true })
    await act(async () => document.dispatchEvent(new Event('fullscreenchange')))
    fullscreen.remove()
    await act(async () => useAuthStore.setState({ user: null }))
    assert.equal(store().rewards.length, 0, 'Signing out clears pending rewards')
    await act(async () => useAuthStore.setState({ user: { id: 'learner' } as never }))
    globalThis.fetch = async () => {
      useAuthStore.setState({ user: { id: 'another-user' } as never })
      return new Response(JSON.stringify({ xpEarned: 90 }))
    }
    await act(async () => { await assert.rejects(apiClient.post('/profile/heartbeat'), /Account changed/) })
    assert.equal(store().rewards.length, 0, 'Late responses cannot celebrate another account’s XP')
  } finally {
    await act(async () => root.unmount())
    window.setTimeout = originalSetTimeout
    window.clearTimeout = originalClearTimeout
  }
  console.log('XP notification API and UI checks passed')
}
