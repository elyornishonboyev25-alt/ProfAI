import assert from 'node:assert/strict'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Results from '@/pages/Results'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { resolveIeltsTestById } from '@/utils/ieltsTestCatalog'
import type { TestResult } from '@/types/ieltsTypes'
import i18n from '@/i18n'
import { loadReviewState, saveReviewState } from '@/utils/resultsReviewState'
import { useAuthStore } from '@/store/authStore'
import type { AuthUser } from '@/types/platform'
import { apiClient } from '@/lib/apiClient'

export async function run() {
  await i18n.changeLanguage('en')
  localStorage.clear()
  const container = document.getElementById('root')!
  const root = createRoot(container)
  const user = (id: string): AuthUser => ({ id, email: `${id}@example.test`, fullName: id, role: 'USER', premium: false, xp: 0, level: 1, currentStreak: 0, onboardingCompleted: true })
  useAuthStore.setState({ user: user('results-owner') })
  const test = resolveIeltsTestById('ielts-listening-3')!
  const result: TestResult = {
    testId: test.id, date: '2026-10-21T10:00:00Z', score: 9,
    correctAnswers: 40, totalQuestions: 40, timeSpent: 1800,
    answers: Object.fromEntries(test.sections.flatMap(section => section.questions.map(question => [question.id, question.correctAnswer]))),
    leaderboardEligible: false,
  }
  let renderId = 0
  const render = (state?: { result: TestResult; test: typeof test }) => act(async () => root.render(<MemoryRouter key={++renderId} initialEntries={[{ pathname: `/results/${test.id}`, state }]}><Routes><Route path="/results/:testId" element={<ErrorBoundary><Results /></ErrorBoundary>} /></Routes></MemoryRouter>))
  try {
    await render({ result, test })
    assert.ok(container.textContent?.includes('IELTS Listening Result'), container.textContent ?? '')
    assert.ok(container.textContent?.includes('Answer Sheet'))
    console.log('PASS: Listening 3 result renders with saved answers')
    await render()
    assert.ok(container.textContent?.includes('Answer Sheet'), 'Reload without navigation state restores completed answers')
    window.sessionStorage.clear()
    assert.deepEqual(loadReviewState(test.id)?.result.answers, result.answers, 'Persistent backup restores all submitted answers')
    window.sessionStorage.setItem('smarttest-review-state:results-owner:ielts-listening-3', '{broken')
    assert.deepEqual(loadReviewState(test.id)?.result.answers, result.answers, 'Corrupt session data falls back to the independent backup')
    await act(async () => { useAuthStore.setState({ user: user('other-owner') }) })
    assert.equal(loadReviewState(test.id), null, 'Other accounts cannot restore these answers')
    assert.ok(container.textContent?.includes('No Results Found'))
    assert.equal(container.querySelector('a')?.getAttribute('href'), '/ielts/listening/tests')
    await act(async () => { useAuthStore.setState({ user: user('results-owner') }) })
    const legacyResult = { ...result, answers: { 'lt3-q1': 'answer' } }
    saveReviewState(test.id, { result: legacyResult, test })
    await render()
    assert.ok(container.textContent?.includes('IELTS Listening Result'), 'Old Listening 3 attempts still render')
    assert.equal(resolveIeltsTestById(test.id, loadReviewState(test.id)?.result)?.sections[0].id, 'lt3-part1', 'Old Listening 3 attempts retain their original paper')
    saveReviewState(test.id, { result, test })
    const storagePrototype = Object.getPrototypeOf(window.localStorage)
    const setItem = storagePrototype.setItem
    storagePrototype.setItem = () => { throw new window.DOMException('Storage full', 'QuotaExceededError') }
    try {
      await render({ result, test })
      assert.ok(container.textContent?.includes('IELTS Listening Result'), 'A storage write failure must not hide a completed result')
    } finally { storagePrototype.setItem = setItem }
    const getItem = storagePrototype.getItem
    const post = apiClient.post
    const calls: string[] = []
    storagePrototype.getItem = () => { throw new window.DOMException('Storage blocked', 'SecurityError') }
    apiClient.post = (async (path: string) => { calls.push(path); return {} }) as typeof apiClient.post
    try {
      await render({ result: { ...result, leaderboardEligible: true }, test })
      assert.ok(container.textContent?.includes('Answer Sheet'), 'Unavailable storage must not prevent rendering')
      assert.deepEqual(calls, ['/tests/listening-sync'], 'Server sync still runs when the local sync marker cannot be read')
    } finally { storagePrototype.getItem = getItem; apiClient.post = post }
    console.log('PASS: quota and blocked storage, reload, persistent backup, corrupt session, account isolation, original Listening 3 paper and server sync')
  } finally {
    await act(async () => root.unmount())
    localStorage.clear()
    window.sessionStorage.clear()
    useAuthStore.setState({ user: null })
  }
}
