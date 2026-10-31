import assert from 'node:assert/strict'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { isFreeStudyResource, remainingPercent } from '@/features/billing/studyResources'
import { routeStudyResource } from '@/features/billing/BillingBoundary'
import BillingBoundary from '@/features/billing/BillingBoundary'
import UsageBalance from '@/features/billing/UsageBalance'
import BillingNotice from '@/features/billing/BillingNotice'
import { getIeltsFullTestCatalog, getIeltsReadingUnifiedCatalog } from '@/utils/ieltsTrackCatalog'
import { getWritingFullTestCatalog } from '@/data/writingTestData'
import { getIeltsSpeakingFullMockCatalog } from '@/utils/ieltsSpeakingCatalog'
import { getFullMockCatalog, saveFullMockSectionResult, retakeFullMock } from '@/utils/ieltsMockCatalog'
import { vocabularyCollections } from '@/data/vocabularyCollections'
import { apiClient } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import { useBillingStore, type WalletOverview } from '@/features/billing/store'
import i18n from '@/i18n'

export async function run() {
  await i18n.changeLanguage('en')
  const catalogs = {
    reading: getIeltsReadingUnifiedCatalog().map(entry => entry.testId),
    listening: getIeltsFullTestCatalog('listening').map(entry => entry.testId),
    writing: getWritingFullTestCatalog().map(entry => entry.id),
    speaking: getIeltsSpeakingFullMockCatalog().map(entry => entry.id),
  }
  for (const [skill, ids] of Object.entries(catalogs)) {
    ids.forEach((id, index) => assert.equal(isFreeStudyResource(`test:${skill}:${id}`), index < 5, `${skill}: ${id} must match its visible catalog position`))
    const book = vocabularyCollections.ielts.find(item => item.skill === skill)!
    book.tests.forEach((test, index) => {
      const route = routeStudyResource(`/vocabulary/ielts/${book.id}/${test.id}/${test.sections[0].id}`, '')!
      assert.ok(route)
      assert.equal(isFreeStudyResource(route.resource), index < 5, `${skill} vocabulary follows the same first five tests`)
    })
  }
  getFullMockCatalog().forEach((mock, index) => assert.equal(isFreeStudyResource(`mock:ielts:${mock.id}`), index < 5))
  vocabularyCollections.sat.forEach((pack, index) => {
    const route = routeStudyResource(`/vocabulary/sat/${pack.id}/${pack.sections[0].id}`, '')!
    assert.equal(isFreeStudyResource(route.resource), index < 5)
  })
  assert.equal(isFreeStudyResource(routeStudyResource('/vocabulary/ielts', '?skill=reading&test=6')!.resource), false)
  assert.equal(isFreeStudyResource(routeStudyResource('/vocabulary/sat', '?mock=sat_full_mock_6&module=rw1')!.resource), false)
  assert.equal(routeStudyResource('/vocabulary/articles/example', ''), null)
  assert.equal(isFreeStudyResource('test:writing:writing-full-5-task-2'), true)
  assert.equal(isFreeStudyResource('test:writing:writing-full-6-task-1'), false)
  assert.equal(remainingPercent(1, 50), 98)
  const previousUser = useAuthStore.getState().user
  const previousBilling = useBillingStore.getState()
  const previousGet = apiClient.get
  const element = document.getElementById('root')!
  const root = createRoot(element)
  const free = { kind: 'FREE' as const, tier: 'FREE' as const, active: false, startsAt: null, expiresAt: null, trialDays: null, daysRemaining: null }
  const wallet: WalletOverview = { access: free, subscriptions: [], orders: [], canJoinClass: false, canCreateClass: false,
    usage: { ai: { used: 1, limit: 50 } } as WalletOverview['usage'] }
  useAuthStore.setState({ user: { id: 'catalog-free', email: 'catalog@example.com', fullName: 'Catalog', role: 'USER', access: free } as NonNullable<typeof previousUser> })
  useBillingStore.setState({ userId: 'catalog-free', wallet })
  apiClient.get = async <T,>(path: string) => {
    if (path.startsWith('/billing/access?')) {
      const resource = new URL(path, 'http://localhost').searchParams.get('resource')!
      return { unlocked: wallet.access?.active || isFreeStudyResource(resource), tier: wallet.access?.tier } as T
    }
    return wallet as T
  }
  const settle = () => act(async () => { await new Promise(resolve => setTimeout(resolve, 25)) })
  let renderCount = 0
  const render = async (path: string, state?: object) => {
    await act(async () => root.render(<MemoryRouter key={`${path}:${++renderCount}`} initialEntries={[state ? { pathname: path, state } : path]}><BillingBoundary><p data-study-content>Test vocabulary</p></BillingBoundary></MemoryRouter>))
    await settle()
  }
  try {
    for (const path of ['/test/reading/reading-roadmap-full-5', '/ielts/writing/test/writing-full-5', '/ielts/speaking/test/speaking-full-5', '/vocabulary/sat/sat_full_mock_5/rw1', '/mock/ielts/full-mock-5']) {
      await render(path); assert.ok(element.querySelector('[data-study-content]'), `free access: ${path}`)
    }
    for (const path of ['/test/reading/reading-roadmap-full-6', '/test/listening/ielts-listening-6', '/ielts/writing/test/writing-full-6', '/ielts/speaking/test/speaking-full-6', '/vocabulary/sat/sat_full_mock_6/rw1', '/vocabulary/ielts?skill=reading&test=6', '/mock/ielts/full-mock-6']) {
      await render(path); assert.equal(element.querySelector('[data-study-content]'), null, `locked direct route: ${path}`)
      assert.ok(element.textContent?.includes('IvyGoo Pro'))
    }
    await render('/test/reading/reading-roadmap-full-6', { reviewPayload: { result: { testId: 'reading-roadmap-full-6', answers: { q1: 'saved' } } } })
    assert.ok(element.querySelector('[data-study-content]'), 'saved Reading review remains open after subscription expiry')
    const mock = getFullMockCatalog().find(item => item.id === 'full-mock-6')!
    for (const section of mock.sections) saveFullMockSectionResult(mock.id, section.key, { band: 7, testId: section.launchPath!.split('/').pop()!, completedAt: new Date().toISOString() })
    await render('/mock/ielts/full-mock-6')
    assert.ok(element.querySelector('[data-study-content]'), 'completed paid IELTS mock review remains open')
    assert.ok(retakeFullMock(mock.id))
    await render('/mock/ielts/full-mock-6')
    assert.equal(element.querySelector('[data-study-content]'), null, 'retaking a paid mock checks the plan again')
    await act(async () => root.render(<MemoryRouter><UsageBalance /><BillingNotice /></MemoryRouter>))
    await settle()
    assert.ok(element.textContent?.includes('98%'))
    assert.equal(/50|300|1,?500/.test(element.textContent ?? ''), false, 'raw message capacities never appear')
    const event = () => window.dispatchEvent(new CustomEvent('profai:premium-required', { detail: 'content' }))
    await act(async () => { event() })
    const dialog = document.querySelector('[role="dialog"]')!
    assert.ok(dialog.textContent?.includes('IvyGoo Pro'))
    assert.equal(document.body.style.overflow, 'hidden')
    await act(async () => document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })))
    assert.equal(document.querySelector('[role="dialog"]'), null)
    wallet.access = { ...free, kind: 'PREMIUM', active: true, tier: 'PRO' }
    await act(async () => { useBillingStore.setState({ wallet: { ...wallet } }) })
    await act(async () => window.dispatchEvent(new CustomEvent('profai:premium-required', { detail: 'Your Live AI time is used up.' })))
    assert.ok(document.querySelector('[role="dialog"]')?.textContent?.includes('IvyGoo Elite'))
    console.log('PASS: live catalog first-five policy, vocabulary parity, direct-route locks, private percentage balance, accessible contextual upgrade prompts')
  } finally {
    await act(async () => root.unmount())
    apiClient.get = previousGet
    useAuthStore.setState({ user: previousUser })
    useBillingStore.setState(previousBilling)
  }
}
