import assert from 'node:assert/strict'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import InProcessPanel from '@/components/tests/InProcessPanel'
import AttemptEntryBoundary from '@/components/tests/AttemptEntryBoundary'
import Results from '@/pages/Results'
import TestInterface from '@/pages/TestInterface'
import IELTSReadingInterface from '@/components/IELTSReadingInterface'
import { useAuthStore } from '@/store/authStore'
import { apiClient } from '@/lib/apiClient'
import { accountStorageFor } from '@/utils/accountStorage'
import { saveIeltsAttemptResume } from '@/utils/ieltsAttemptResume'
import { saveActiveTestPaper } from '@/utils/activeTestPaper'
import { resolveIeltsTestById } from '@/utils/ieltsTestCatalog'
import { SAT_TEST_CATALOG } from '@/features/sat/catalog'
import { createSATAttempt } from '@/features/sat/practiceTest4'
import { loadSATAttempt, saveSATAttempt } from '@/features/sat/attemptStorage'
import { testReturnPath } from '@/utils/testNavigation'
import type { TestResult } from '@/types/ieltsTypes'
import i18n from '@/i18n'
import { fullReadingTest } from '@/data/fullReadingTest'
import { getFullMockCatalog, getFullMockCompletedSections, saveFullMockSectionResult } from '@/utils/ieltsMockCatalog'
import { getInProcessAttempts, discardInProcessAttempt } from '@/utils/inProcessAttempts'

function Probe() { const location = useLocation(); return <output data-location>{location.pathname}{location.search}</output> }
export async function run() {
  await i18n.changeLanguage('en')
  localStorage.clear()
  const owner = 'unified-owner'
  const previousUser = useAuthStore.getState().user
  const originalGet = apiClient.get, originalPost = apiClient.post
  useAuthStore.setState({ user: { id: owner, fullName: 'Test Learner', email: 'flow@example.test', role: 'USER' } as never })
  const requests: string[] = []
  apiClient.get = (async (path: string) => {
    requests.push(path)
    if (path.includes('/standing')) return { participants: 1, average: 7.5, percentiles: { total: null, rw: null, math: null }, me: null,
      rows: [{ rank: 1, name: 'Test Learner', nickname: null, avatarUrl: null, country: null, total: 7.5, maxScore: 9, rw: null, math: null, correct: 32, durationSec: 1800, completedAt: '2026-10-30T09:00:00Z', isMe: true }] }
    throw new Error('offline')
  }) as typeof apiClient.get
  apiClient.post = (async () => { throw new Error('offline') }) as typeof apiClient.post
  const element = document.getElementById('root')!
  let root = createRoot(element)
  const mount = async (node: React.ReactNode, entry: string | { pathname: string; state: unknown } = '/ielts') => {
    await act(async () => root.unmount()); root = createRoot(element)
    await act(async () => root.render(<MemoryRouter initialEntries={[entry]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Probe />{node}</MemoryRouter>))
  }
  const click = async (label: string) => {
    const button = [...document.querySelectorAll<HTMLButtonElement>('button')].find(node => node.textContent?.trim() === label)
    assert.ok(button, `Button exists: ${label}`)
    await act(async () => button.click())
  }
  const paper = fullReadingTest
  assert.ok(paper)
  const path = `/test/reading/${paper.id}`, key = `ielts_test_session_${paper.id}`
  const storage = accountStorageFor(owner)
  const seedReading = () => {
    storage.setItem(key, JSON.stringify({ isTestActive: true, testMode: 'practice', selectedParts: [0], partsSelectionVersion: 2,
      timeRemaining: 1000, deadline: Date.now() + 1_000_000, answers: { [paper.sections[0].questions[0].id]: 'saved answer' }, elapsedSeconds: 75 }))
    saveActiveTestPaper(key, paper, owner)
    saveIeltsAttemptResume(owner, { sessionKey: key, title: paper.title, pathname: path, search: '', state: null })
  }
  try {
    seedReading()
    await mount(<InProcessPanel exam="IELTS" showEmpty />)
    assert.ok(element.textContent?.includes('In process'))
    const deletion = element.querySelector<HTMLButtonElement>('[aria-label^="Delete unfinished test:"]')!
    await act(async () => deletion.click())
    assert.ok(document.querySelector('[role="alertdialog"]'), 'Discard uses an in-site dialog')
    await click('Keep test'); assert.ok(storage.getItem(key), 'Cancel retains every saved answer')
    await act(async () => deletion.click())
    await click('Delete progress')
    assert.equal(storage.getItem(key), null)
    assert.equal(storage.getItem(`${key}:paper`), null)
    console.log('PASS: in-site delete dialog, cancel and precise draft cleanup')

    seedReading()
    const sentinel = <AttemptEntryBoundary exam="IELTS"><p data-runner>Runner mounted</p></AttemptEntryBoundary>
    await mount(sentinel, path)
    assert.equal(element.querySelector('[data-runner]'), null, 'Ordinary launch waits before mounting the saved test')
    await click('Continue saved test'); assert.ok(element.querySelector('[data-runner]'))
    assert.ok(storage.getItem(key)?.includes('saved answer'))
    await mount(sentinel, { pathname: path, state: { resumeIntent: true } })
    assert.ok(element.querySelector('[data-runner]'), 'In process opens the exact saved session directly')
    await mount(sentinel, path)
    await click('Start a new attempt'); await click('Keep saved test')
    assert.ok(storage.getItem(key))
    await click('Start a new attempt'); await click('Replace & start again')
    assert.ok(element.querySelector('[data-runner]'))
    assert.equal(storage.getItem(key), null, 'Only confirmed replacement removes saved answers')
    console.log('PASS: normal launch choice, direct resume and confirmed fresh start')

    const sat = SAT_TEST_CATALOG[3]
    const saved = createSATAttempt(sat.id, sat.modules, 'practice')
    saved.answers[sat.modules[0].questions[0].id] = 'A'
    await act(async () => saveSATAttempt(saved))
    await mount(<InProcessPanel exam="SAT" />)
    const resume = element.querySelector<HTMLAnchorElement>('.in-process-card a')!
    assert.equal(resume.getAttribute('href'), '/sat/mock/3/run')
    await act(async () => element.querySelector<HTMLButtonElement>('[aria-label^="Delete unfinished test:"]')!.click())
    await click('Keep test'); assert.equal(loadSATAttempt(sat.id)?.answers[sat.modules[0].questions[0].id], 'A')
    await act(async () => useAuthStore.setState({ user: { id: 'other-owner' } as never }))
    assert.equal(element.querySelector('.in-process-card'), null, 'Drafts are account scoped')
    await act(async () => useAuthStore.setState({ user: { id: owner, fullName: 'Test Learner' } as never }))
    assert.ok(element.querySelector('.in-process-card'))
    console.log('PASS: SAT unified collection, exact resume URL, safe cancellation and account isolation')

    const mock = getFullMockCatalog()[0]
    const writingId = mock.sections.find(section => section.key === 'writing')!.launchPath!.split('/').pop()!
    const previousEssay = `profai:writing:draft:${owner}:${writingId}:mock:${mock.id}:session`
    await act(async () => {
      saveFullMockSectionResult(mock.id, 'listening', { band: 7, testId: 'listening-fixture', completedAt: '2026-10-30T09:00:00Z' })
      storage.setItem(previousEssay, JSON.stringify({ phase: 'submitted', evaluation: { overallBand: 7 }, answer: 'Previous completed section' }))
      const pendingMock = getInProcessAttempts('IELTS', owner).find(attempt => attempt.mockId === mock.id)!
      assert.ok(pendingMock, 'An unfinished full mock appears once, even between sections')
      await discardInProcessAttempt(owner, pendingMock)
    })
    assert.equal(storage.getItem(previousEssay), null, 'Replacement clears old submitted section checkpoints too')
    assert.deepEqual(getFullMockCompletedSections(mock.id), [])
    console.log('PASS: full mock grouping and replacement cannot restore a previous essay')

    const activePaper = { ...paper, id: 'reading-active-clock-fixture' }
    const clockKey = `ielts_test_session_${activePaper.id}`
    storage.setItem(clockKey, JSON.stringify({ isTestActive: true, testMode: 'practice', selectedParts: [0], partsSelectionVersion: 2,
      customTime: -1, timeRemaining: -1, startedAt: Date.now() - 3 * 86400000, elapsedSeconds: 120, answers: {} }))
    await mount(<IELTSReadingInterface test={activePaper} onComplete={() => {}} onExit={() => {}} />)
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 250)) })
    const realNow = Date.now
    let clock = realNow()
    Date.now = () => clock
    try {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true })
      await act(async () => document.dispatchEvent(new Event('visibilitychange')))
      clock += 3 * 3600000
      Object.defineProperty(document, 'hidden', { configurable: true, value: false })
      await act(async () => document.dispatchEvent(new Event('visibilitychange')))
      await act(async () => window.dispatchEvent(new Event('pagehide')))
      const elapsed = JSON.parse(storage.getItem(clockKey)!).elapsedSeconds
      assert.ok(elapsed >= 120 && elapsed < 125, 'Three days away and three hours in a hidden tab are excluded from active time')
    } finally { Date.now = realNow }
    console.log('PASS: untimed active time flushes on exit without counting time away')

    const result: TestResult = { testId: paper.id, date: '2026-10-30T09:00:00Z', score: 7.5, correctAnswers: 32, totalQuestions: 40,
      timeSpent: 1830, answers: Object.fromEntries(paper.sections.flatMap(section => section.questions).slice(0, 32).map(question => [question.id, question.correctAnswer])) }
    const routes = <Routes><Route path="/results/:testId" element={<Results />} /><Route path="/test/:type/:id" element={<TestInterface />} /><Route path="*" element={<h1>Destination</h1>} /></Routes>
    await mount(routes, { pathname: `/results/${paper.id}`, state: { result, test: paper, returnTo: '/profile' } })
    assert.doesNotMatch(element.textContent!, /AI recommendations|Performance map|Unified Result Flow/)
    assert.equal(element.querySelector('[aria-label="Performance radar chart"]'), null)
    assert.ok(element.textContent?.includes('30m 30s'))
    await click('Leaderboard')
    assert.ok(requests.includes(`/exam-results/ielts/${paper.id}/standing`))
    assert.ok(element.querySelector('[aria-label="Test leaderboard"]')?.textContent?.includes('7.5'))
    await click('Answer Sheet')
    await click('Full Review')
    assert.equal(element.querySelector('[data-location]')?.textContent, `/test/reading/${paper.id}`)
    const back = element.querySelector<HTMLButtonElement>('.premium-back-btn-sm') ?? [...element.querySelectorAll<HTMLButtonElement>('button')].find(node => /Back to Results|Back/.test(node.textContent ?? ''))
    assert.ok(back)
    await act(async () => back.click())
    assert.equal(element.querySelector('[data-location]')?.textContent, `/results/${paper.id}`)
    await click('My Results')
    assert.equal(element.querySelector('[data-location]')?.textContent, '/profile', 'Review back keeps the originating My Results destination')
    await mount(routes, { pathname: `/results/${paper.id}`, state: { result, test: paper } })
    await click('Reading Tests')
    assert.equal(element.querySelector('[data-location]')?.textContent, '/ielts/reading/tests', 'Fresh completion returns to its catalog')
    assert.equal(testReturnPath({ returnTo: 'https://example.test' }, '/ielts'), '/ielts')
    console.log('PASS: results design, real per-test leaderboard and full review → result → original destination')
  } finally {
    await act(async () => root.unmount())
    apiClient.get = originalGet; apiClient.post = originalPost
    useAuthStore.setState({ user: previousUser })
  }
}
