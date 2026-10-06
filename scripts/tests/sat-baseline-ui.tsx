import React, { act } from 'react'
import assert from 'node:assert/strict'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, useLocation } from 'react-router-dom'
import QuickOnboarding from '../../src/pages/QuickOnboarding'
import { apiClient } from '../../src/lib/apiClient'
import { useAuthStore } from '../../src/store/authStore'
import { SAT_TEST_CATALOG, getSATSectionTest } from '../../src/features/sat/catalog'
import { createSATAttempt, scoreSATModules } from '../../src/features/sat/practiceTest4'
import { saveSATBaseline } from '../../src/features/sat/baseline'
import { loadOnboardingProfile } from '../../src/utils/weeklyPlanner'
import '../../src/i18n'

const container = document.getElementById('root')!
function Location() {
  const location = useLocation()
  return <output data-location>{location.pathname}{location.search}</output>
}

export async function run() {
  localStorage.clear()
  useAuthStore.setState({ user: { id: 'baseline-user', fullName: 'Test Learner', nickname: 'learner', onboardingCompleted: false } as never })
  let currentSatScore: number | null = null
  const puts: Array<Record<string, unknown>> = []
  let failSave = false
  const originalGet = apiClient.get
  const originalPut = apiClient.put
  apiClient.get = (async () => ({ nickname: 'learner', avatarUrl: null, profile: {
    currentIeltsScore: null, targetIeltsScore: null, currentSatScore, targetSatScore: null,
  } })) as typeof apiClient.get
  apiClient.put = (async (_path: string, patch: Record<string, unknown>) => {
    if (failSave) throw new Error('Offline')
    puts.push(patch)
    if (typeof patch.currentSatScore === 'number') currentSatScore = patch.currentSatScore
    return { profile: { currentSatScore } }
  }) as typeof apiClient.put
  const root = createRoot(container)
  const click = async (label: string) => {
    const node = [...container.querySelectorAll('button')].find(button => button.textContent?.trim() === label || button.getAttribute('aria-label') === label)
    assert.ok(node, `Missing ${label}`)
    await act(async () => node.click())
  }
  const input = async (id: string, value: string) => {
    const node = container.querySelector<HTMLInputElement>(`#${id}`)!
    await act(async () => {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!.call(node, value)
      node.dispatchEvent(new Event('input', { bubbles: true }))
    })
  }
  try {
    await act(async () => root.render(<MemoryRouter initialEntries={['/onboarding']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Location /><QuickOnboarding /></MemoryRouter>))
    await click('Continue')
    assert.match(container.textContent!, /Not sure of your current score/)
    await click('Increase SAT target score')
    assert.equal(container.querySelector<HTMLInputElement>('#sat-target-score')!.value, '1000')
    await input('sat-target-score', '900')
    await click('Open my workspace')
    assert.match(container.querySelector('[role="alert"]')!.textContent!, /targets: 1000–1600/)
    assert.equal(puts.length, 0)
    await input('sat-target-score', '1000')
    await click('Take a full SAT mock')
    assert.equal(container.querySelector('[data-location]')!.textContent, '/mock/sat/1?diagnostic=1')
    assert.equal(puts[0].currentSatScore, null)
    assert.equal(puts[0].targetSatScore, 1000)
    await act(async () => root.unmount())

    const test = SAT_TEST_CATALOG[1]
    const attempt = createSATAttempt(test.id, test.modules, 'exam')
    attempt.status = 'submitted'
    attempt.submittedAt = Date.now()
    for (const question of test.modules.flatMap(module => module.questions)) attempt.answers[question.id] = question.correctAnswer
    const expected = scoreSATModules(test.modules, attempt.answers).midpoint
    puts.length = 0
    await Promise.all([saveSATBaseline('baseline-user', test, attempt), saveSATBaseline('baseline-user', test, attempt)])
    assert.equal(puts.length, 1, 'Concurrent React effects save the baseline once')
    assert.deepEqual(puts[0], { currentSatScore: expected })
    assert.equal(loadOnboardingProfile('baseline-user')!.currentSatScore, expected)
    currentSatScore = 730
    await saveSATBaseline('baseline-user', test, attempt)
    assert.equal(puts.length, 1, 'Keep an already known score')
    assert.equal(loadOnboardingProfile('baseline-user')!.currentSatScore, 730)
    const section = getSATSectionTest(1, 'math')
    const sectionAttempt = { ...attempt, testId: section.id }
    await saveSATBaseline('baseline-user', section, sectionAttempt)
    await saveSATBaseline('baseline-user', test, { ...attempt, status: 'active' })
    await saveSATBaseline('baseline-user', test, { ...attempt, status: 'terminated' })
    assert.equal(puts.length, 1, 'Incomplete, terminated and section attempts do not set a total score')
    currentSatScore = null
    failSave = true
    await assert.rejects(saveSATBaseline('baseline-user', test, attempt), /Offline/)
    assert.equal(loadOnboardingProfile('baseline-user')!.currentSatScore, 730, 'Do not claim a failed save succeeded')
    failSave = false
    await saveSATBaseline('baseline-user', test, attempt)
    assert.equal(puts.length, 2, 'Failed saves can be retried')
    assert.equal(loadOnboardingProfile('baseline-user')!.currentSatScore, expected)
    // A delayed response cannot update a different account's score.
    let respond!: (value: unknown) => void
    apiClient.get = (() => new Promise(resolve => { respond = resolve })) as typeof apiClient.get
    const late = saveSATBaseline('baseline-user', test, attempt)
    useAuthStore.setState({ user: { id: 'other-user' } as never })
    respond({ profile: { currentSatScore: null } })
    await late
    assert.equal(puts.length, 2)
    console.log('SAT baseline: onboarding, target bounds, mock handoff, single save, existing-score protection, section exclusion, failed-save retry and account changes passed.')
  } finally {
    apiClient.get = originalGet
    apiClient.put = originalPut
  }
}
