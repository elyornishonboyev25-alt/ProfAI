import assert from 'node:assert/strict'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import i18n from '../../src/i18n'
import Matcher from '../../src/components/admission/UniversityMatcher'
import AdmissionUniversity from '../../src/pages/AdmissionUniversity'
import { useAuthStore } from '../../src/store/authStore'
import { apiClient } from '../../src/lib/apiClient'
import { run as checkUniversityRequirements } from './university-requirements'

export async function run() {
  await i18n.changeLanguage('en')
  Object.defineProperty(globalThis, 'sessionStorage', { value: window.sessionStorage, configurable: true })
  const host = document.getElementById('root')!
  const root = createRoot(host)
  const originalGet = apiClient.get
  const originalPut = apiClient.put
  const originalFetch = globalThis.fetch
  const originalSetItem = window.Storage.prototype.setItem
  const key = 'ivygoo-university-matches-v2:matcher-a'
  let path = ''
  let navigate: ReturnType<typeof useNavigate>
  let rejectSave = false
  let resolveProfile: ((value: any) => void) | undefined
  const profile = { currentSatScore: 1400, currentIeltsScore: 7, gpa: '3.6', budgetUsd: 20000, fieldOfStudy: 'Computer Science', degreeLevel: 'bachelor', country: 'United States', targetUniversitySlug: null }
  const tick = async () => { await act(async () => { await new Promise((r) => setTimeout(r, 10)) }) }
  function Probe() { path = useLocation().pathname + useLocation().search; navigate = useNavigate(); return null }
  const render = async (route = '/admission/matches', id = 'initial') => {
    await act(async () => root.render(<MemoryRouter key={id} initialEntries={[route]}><Probe /><Routes>
      <Route path="/admission/matches" element={<Matcher />} />
      <Route path="/admission/universities/:slug" element={<AdmissionUniversity />} />
    </Routes></MemoryRouter>))
  }
  const click = async (selector: string) => { const element = host.querySelector<HTMLElement>(selector); assert.ok(element, selector); await act(async () => element.click()) }
  const set = async (selector: string, value: string) => {
    const element = host.querySelector<HTMLInputElement | HTMLSelectElement>(selector)!
    assert.ok(element, selector)
    const prototype = element instanceof HTMLInputElement ? window.HTMLInputElement.prototype : window.HTMLSelectElement.prototype
    await act(async () => {
      Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(element, value)
      element.dispatchEvent(new Event(element instanceof HTMLInputElement ? 'input' : 'change', { bubbles: true }))
    })
  }
  try {
    localStorage.clear(); sessionStorage.clear()
    useAuthStore.setState({ user: { id: 'matcher-a', fullName: 'Learner', role: 'USER' } as any, accessToken: 'fixture', refreshToken: 'fixture' })
    apiClient.get = (async () => ({ profile })) as any
    apiClient.put = (async (_path: string, data: any) => {
      if (rejectSave) throw new Error('Save failed')
      assert.equal(data.showUniversity, true)
      return { profile: { ...profile, targetUniversitySlug: data.targetUniversitySlug } }
    }) as any
    globalThis.fetch = (async () => new Response('{}', { status: 200 })) as any
    await render()
    assert.equal(host.querySelector('select')?.value, 'Computer Science', 'Account preferences prefill the form')
    await click('button[type="submit"]')
    await set('input', '1700')
    await click('button[type="submit"]')
    assert.match(host.querySelector('[role="alert"]')!.textContent!, /400 to 1600/)
    await set('input', '1450')
    await set('input[max="9"]', '7.2')
    await click('button[type="submit"]')
    assert.match(host.querySelector('[role="alert"]')!.textContent!, /half-band/)
    await set('input[max="9"]', '7.5')
    await click('button[type="submit"]')
    await set('input[max="4"]', '4.5')
    await click('button[type="submit"]')
    assert.match(host.querySelector('[role="alert"]')!.textContent!, /0 and 4/)
    await set('input[max="4"]', '3.8')
    await set('input:not([max])', '-1')
    await click('button[type="submit"]')
    assert.match(host.querySelector('[role="alert"]')!.textContent!, /zero or greater/)
    await set('input:not([max])', '25000')
    await click('button[type="submit"]')
    assert.equal(path, '/admission/matches?view=results')
    assert.equal(host.querySelectorAll('.um-result-card').length, 12)
    assert.ok(!host.textContent?.includes('gap was invented'), 'Results use clear learner-facing language')
    await click('.um-more button')
    assert.equal(host.querySelectorAll('.um-result-card').length, 24)
    await click('.um-save')
    await click('.um-filter-tabs button:last-child')
    assert.equal(host.querySelectorAll('.um-result-card').length, 1)
    await click('.um-filter-tabs button:first-child')
    await set('[type="search"]', 'Stanford')
    assert.equal(host.querySelectorAll('.um-result-card').length, 1)
    rejectSave = true
    await click('.um-target')
    assert.equal(host.querySelector<HTMLButtonElement>('.um-target')!.disabled, false, 'A failed save stays retryable')
    rejectSave = false
    await click('.um-target')
    assert.match(host.querySelector('.um-target')!.textContent!, /Saved as target/)
    await click('.um-view-profile')
    assert.match(path, /^\/admission\/universities\//)
    assert.match(host.querySelector('h1')!.textContent!, /Stanford/)
    await click('.route-back-button')
    assert.equal(path, '/admission/matches?view=results')
    assert.equal(host.querySelector<HTMLInputElement>('[type="search"]')!.value, 'Stanford')
    assert.match(host.querySelector('.um-summary-scores')!.textContent!, /1450/)
    await render('/admission/matches?view=results', 'reload')
    assert.equal(host.querySelector<HTMLInputElement>('[type="search"]')!.value, 'Stanford', 'Filters survive reload')
    await set('[type="search"]', 'no-such-university-12345')
    assert.ok(host.querySelector('.um-empty'))
    await click('.um-empty button')
    assert.equal(host.querySelectorAll('.um-result-card').length, 12)
    await act(async () => i18n.changeLanguage('uz'))
    assert.match(host.querySelector('h1')!.textContent!, /Sizga mos/)
    assert.match(host.querySelector('.um-filter-tabs')!.textContent!, /Barcha natijalar/)
    assert.ok(!host.querySelector('.um-result-reasons')!.textContent!.includes('Check programme'), 'Match evidence is translated')
    await act(async () => i18n.changeLanguage('en'))
    assert.equal(JSON.parse(sessionStorage.getItem(key)!).form.sat, '1450')
    await act(async () => useAuthStore.setState({ user: { id: 'matcher-b', fullName: 'Other', role: 'USER' } as any, accessToken: 'fixture-b', refreshToken: 'fixture' }))
    assert.match(host.querySelector('.um-summary-scores')!.textContent!, /—/, 'Another account never sees the previous account’s scores')
    await act(async () => navigate!('/admission/matches'))
    await click('button[type="submit"]')
    await set('input', '')
    await set('input[max="9"]', '')
    await click('button[type="submit"]')
    await set('input[max="4"]', '')
    await set('input:not([max])', '')
    window.Storage.prototype.setItem = () => { throw new Error('Storage unavailable') }
    await click('button[type="submit"]')
    assert.equal(host.querySelectorAll('.um-result-card').length, 12, 'Blank scores and unavailable storage still produce usable results')
    window.Storage.prototype.setItem = originalSetItem

    // A slow profile response must not replace a learner's edits.
    apiClient.get = (() => new Promise((resolve) => { resolveProfile = resolve })) as any
    await act(async () => useAuthStore.setState({ user: { id: 'matcher-c', role: 'USER' } as any, accessToken: 'fixture-c', refreshToken: 'fixture' }))
    await act(async () => navigate!('/admission/matches'))
    await set('select', 'Economics')
    await act(async () => { resolveProfile?.({ profile }) })
    await tick()
    assert.equal(host.querySelector('select')!.value, 'Economics')
    checkUniversityRequirements()
    console.log('PASS: university matching validation, routes, persistence, filters, shortlist, save retry, locales, account isolation, blank scores, storage failures and profile race')
  } finally {
    apiClient.get = originalGet; apiClient.put = originalPut; globalThis.fetch = originalFetch
    window.Storage.prototype.setItem = originalSetItem
    await act(async () => root.unmount())
  }
}
