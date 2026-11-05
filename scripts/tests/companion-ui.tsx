import assert from 'node:assert/strict'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import i18next from 'i18next'
import { I18nextProvider } from 'react-i18next'
import CompanionPrompts from '@/features/companion/CompanionPrompts'
import { beginCompanionVisit, companionAudienceKey, COMPANION_KEY, markCompanionOfferShown, nextCompanionOffer, readCompanionState, updateCompanionState, TELEGRAM_DELAY_MS } from '@/features/companion/promotionState'
import { isInstalledApp } from '@/features/companion/installRuntime'
import { useAuthStore } from '@/store/authStore'
import { apiClient } from '@/lib/apiClient'

export async function run() {
  const originalNow = Date.now
  const originalGet = apiClient.get
  const originalPost = apiClient.post
  const originalMedia = window.matchMedia
  window.matchMedia = query => ({ ...originalMedia(query), matches: query.includes('prefers-reduced-motion') })
  let now = 1_800_000_000_000
  Date.now = () => now
  let linked = false
  let statusCalls = 0
  apiClient.get = (async () => { statusCalls++; return { enabled: true, linked } }) as typeof apiClient.get
  apiClient.post = (async () => { throw new Error('Connection unavailable') }) as typeof apiClient.post
  const i18n = i18next.createInstance()
  await i18n.init({ lng: 'uz', resources: { uz: { translation: {} } } })
  const container = document.getElementById('root')!
  let root = createRoot(container)
  const reset = () => updateCompanionState({ installed: false, audiences: {} })
  const audience = (owner = 'companion-owner') => readCompanionState().audiences[companionAudienceKey(owner)]
  const signIn = async (id?: string, hydrated = true) => act(async () => useAuthStore.setState({
    user: id ? { id, createdAt: '2020-01-01T00:00:00Z' } as never : null, hydrated,
  }))
  const mount = async (enabled = true) => {
    await act(async () => root.unmount())
    root = createRoot(container)
    await act(async () => root.render(<I18nextProvider i18n={i18n}><CompanionPrompts enabled={enabled} /></I18nextProvider>))
  }
  const advance = async (ms: number) => {
    now += ms
    await act(async () => { window.dispatchEvent(new Event('focus')); await Promise.resolve(); await Promise.resolve() })
  }
  const clickPrimary = async () => act(async () => container.ownerDocument.querySelector<HTMLButtonElement>('.companion-primary')!.click())
  const dismiss = async () => act(async () => document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })))
  try {
    useAuthStore.setState({ user: { id: 'companion-owner' } as never, hydrated: true })
    reset()
    localStorage.removeItem(COMPANION_KEY)
    localStorage.setItem('ivygoo:companion:v1', JSON.stringify({
      firstSeenAt: now - TELEGRAM_DELAY_MS, installShownAt: now - TELEGRAM_DELAY_MS,
      installed: false, telegramShown: { 'companion-owner': now - 1000 },
    }))
    await mount()
    await advance(4999)
    assert.equal(document.querySelector('[data-companion]'), null, 'The first page gets time to settle')
    const blocker = document.createElement('div')
    blocker.setAttribute('role', 'dialog')
    blocker.getClientRects = () => [{ width: 20, height: 20 }] as unknown as DOMRectList
    document.body.append(blocker)
    await advance(1)
    assert.equal(document.querySelector('[data-companion]'), null, 'Existing welcome dialogs are not covered')
    blocker.remove()
    await advance(1)
    assert.ok(document.querySelector('[data-companion="install"]'))
    const shownAt = audience().installShownAt!
    assert.equal(shownAt, now, 'The legacy browser-wide flag does not hide the invitation for an existing account')
    assert.equal(document.body.style.overflow, 'hidden')
    await clickPrimary()
    assert.equal(document.querySelectorAll('.companion-steps li').length, 3, 'Unsupported native prompts fall back to browser-specific instructions')
    assert.equal(readCompanionState().installed, false, 'Instructions never claim an app was installed')
    await dismiss()
    assert.equal(document.body.style.overflow, '')
    await mount()
    await advance(6000)
    assert.equal(document.querySelector('[data-companion]'), null, 'Reload does not repeat the first invitation')
    assert.equal(audience().installShownAt, shownAt, 'The original 48-hour anchor survives reload')
    assert.equal(statusCalls, 0, 'Telegram is not requested before two full days')
    assert.equal(nextCompanionOffer(readCompanionState(), shownAt + TELEGRAM_DELAY_MS - 1, 'companion-owner'), null)
    assert.equal(nextCompanionOffer(readCompanionState(), shownAt + TELEGRAM_DELAY_MS, 'companion-owner'), 'telegram')
    now = shownAt + TELEGRAM_DELAY_MS
    await advance(0)
    assert.ok(document.querySelector('[data-companion="telegram"]'))
    await clickPrimary()
    assert.ok(document.querySelector('.companion-error'), 'A failed connection has a retryable error')
    assert.equal(document.querySelector('.companion-primary')?.hasAttribute('disabled'), false)
    await dismiss()
    await mount()
    await advance(6000)
    assert.equal(document.querySelector('[data-companion]'), null, 'Dismissed Telegram invitations do not repeat')

    reset()
    await signIn()
    await mount()
    await advance(6000)
    assert.ok(document.querySelector('[data-companion="install"]'))
    const guestShownAt = readCompanionState().audiences.guest.installShownAt!
    await dismiss()
    now += TELEGRAM_DELAY_MS
    await signIn('companion-owner')
    await advance(4999)
    assert.equal(document.querySelector('[data-companion]'), null)
    await advance(1)
    assert.ok(document.querySelector('[data-companion="install"]'), 'An existing member still gets the invitation after seeing it as a guest')
    assert.equal(audience().installShownAt, now)
    assert.ok(audience().installShownAt! > guestShownAt + TELEGRAM_DELAY_MS)
    assert.equal(nextCompanionOffer(readCompanionState(), now + TELEGRAM_DELAY_MS - 1, 'companion-owner'), null, 'The guest timer cannot cause an early Telegram invitation')
    await dismiss()
    await signIn('second-existing-member')
    await advance(5000)
    assert.ok(document.querySelector('[data-companion="install"]'), 'Existing accounts sharing a browser each receive the invitation')
    await dismiss()
    await signIn('companion-owner')
    await advance(5000)
    assert.equal(document.querySelector('[data-companion]'), null, 'Returning to an account preserves its own invitation history')

    reset()
    await signIn('companion-owner', false)
    await mount()
    await advance(6000)
    assert.equal(document.querySelector('[data-companion]'), null)
    await signIn('companion-owner')
    await advance(5000)
    assert.ok(document.querySelector('[data-companion="install"]'), 'A restored session is eligible after hydration without registering again')
    await dismiss()

    reset()
    window.matchMedia = query => ({ ...originalMedia(query), matches: query === '(display-mode: fullscreen)' })
    assert.equal(isInstalledApp(), false, 'F11/browser fullscreen is not an installed app')
    await mount()
    await advance(6000)
    assert.ok(document.querySelector('[data-companion="install"]'))
    await dismiss()
    window.matchMedia = query => ({ ...originalMedia(query), matches: query.includes('prefers-reduced-motion') })

    reset()
    await mount(false)
    await advance(6000)
    assert.equal(document.querySelector('[data-companion]'), null, 'Exam and other disabled screens never interrupt a learner')
    await mount()
    updateCompanionState({ installed: true })
    let prompts = 0
    const installEvent = new Event('beforeinstallprompt', { cancelable: true })
    Object.assign(installEvent, { prompt: async () => { prompts++ }, userChoice: Promise.resolve({ outcome: 'accepted' }) })
    await act(async () => window.dispatchEvent(installEvent))
    assert.equal(readCompanionState().installed, false, 'A new native installation offer clears an obsolete installed flag')
    await advance(6000)
    assert.equal(prompts, 0, 'An installation prompt is never invoked automatically')
    await clickPrimary()
    assert.equal(prompts, 1)
    assert.equal(readCompanionState().installed, false, 'Accepting a prompt still waits for actual installation')
    await act(async () => window.dispatchEvent(new Event('appinstalled')))
    assert.equal(readCompanionState().installed, true)
    assert.match(document.querySelector('#companion-title')!.textContent!, /tayyor/)
    await dismiss()

    reset()
    beginCompanionVisit('companion-owner', now - TELEGRAM_DELAY_MS)
    markCompanionOfferShown('install', 'companion-owner', now - TELEGRAM_DELAY_MS)
    linked = true
    await mount()
    await advance(6000)
    assert.equal(document.querySelector('[data-companion]'), null, 'Already linked accounts are never asked to reconnect')
    assert.equal(nextCompanionOffer({ ...readCompanionState(), installed: true }, now, undefined, true), null)
  } finally {
    await act(async () => root.unmount())
    apiClient.get = originalGet; apiClient.post = originalPost; Date.now = originalNow; window.matchMedia = originalMedia
  }
  console.log('PASS: existing-member rollout, legacy/guest/account isolation, restored sessions, fullscreen, native install/reinstall, persistent per-account 48-hour boundary, Telegram retry and exam suppression')
}
