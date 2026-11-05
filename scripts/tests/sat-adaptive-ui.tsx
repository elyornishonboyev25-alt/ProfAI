import React, { act } from 'react'
import assert from 'node:assert/strict'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import SATMockRun from '../../src/pages/SATMockRun'
import SATResultReview from '../../src/pages/SATResultReview'
import { getSATReviewTests, SAT_TEST_CATALOG, LEGACY_SAT_TEST_CATALOG, resolveSATTest } from '../../src/features/sat/catalog'
import { getSATSessionTest, satRunSearch } from '../../src/features/sat/sessionTest'
import { createSATAttempt, scoreSATModules, type SATAttempt } from '../../src/features/sat/practiceTest4'
import { loadSATAttempt, loadSATAttemptHistory, saveSATAttempt } from '../../src/features/sat/attemptStorage'
import { saveActiveTestPaper, readActiveTestPaper } from '../../src/utils/activeTestPaper'
import { accountStorage } from '../../src/utils/accountStorage'
import { getInProcessAttempts } from '../../src/utils/inProcessAttempts'
import { useAuthStore } from '../../src/store/authStore'
import { hasActiveTest } from '../../src/hooks/useActiveTest'
import { analyzeSATResult } from '../../src/features/sat/resultAnalysis'
import i18n from '../../src/i18n'

export async function run() {
  localStorage.clear()
  await i18n.changeLanguage('en')
  const owner = 'adaptive-regression'
  useAuthStore.setState({ user: { id: owner } as never })
  const container = document.getElementById('root')!
  let root: ReturnType<typeof createRoot> | undefined
  const unmount = async () => { if (root) { await act(async () => root!.unmount()); root = undefined } }
  const render = async (path: string, review = false) => {
    await unmount()
    root = createRoot(container)
    await act(async () => root!.render(<MemoryRouter initialEntries={[{ pathname: path.split('?')[0], search: path.includes('?') ? `?${path.split('?')[1]}` : '', state: { resumeIntent: true } }]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes><Route path={review ? '/sat/results/:attemptId' : '/sat/mock/:mockId/run'} element={review ? <SATResultReview /> : <SATMockRun />} /></Routes>
    </MemoryRouter>))
  }
  const click = async (text: string) => {
    const button = [...container.querySelectorAll('button')].find(node => node.textContent?.trim() === text)
    assert.ok(button, `Missing button: ${text}`)
    await act(async () => button.click())
  }
  try {
    // An old unversioned URL resumes the old fixed form, including snapshots.
    const old = LEGACY_SAT_TEST_CATALOG[11]
    const oldAttempt = createSATAttempt(old.id, old.modules, 'practice')
    oldAttempt.currentQuestionIndex = 4
    oldAttempt.answers[old.modules[0].questions[0].id] = old.modules[0].questions[0].correctAnswer
    oldAttempt.notes['rw1-1'] = 'Keep my original note'
    saveSATAttempt(oldAttempt)
    saveActiveTestPaper(`profai:sat:${old.id}:attempt:v1`, old)
    const original = accountStorage.getItem(`profai:sat:${old.id}:attempt:v1`)
    assert.equal(getSATSessionTest(11).id, old.id)
    assert.equal(accountStorage.getItem(`profai:sat:${old.id}:attempt:v1`), original, 'Resolving a version never rewrites the attempt')
    const link = getInProcessAttempts('SAT', owner).find(item => item.satId === old.id)!
    assert.equal(new URLSearchParams(link.search).get('testId'), old.id)
    await render(`${link.pathname}${link.search}`)
    assert.ok(hasActiveTest(), 'A deployment must not reload the active test document')
    assert.match(container.textContent!, /Question 5 of 27/)
    assert.deepEqual(loadSATAttempt(old.id)!.answers, oldAttempt.answers)
    assert.deepEqual(loadSATAttempt(old.id)!.notes, oldAttempt.notes)
    await unmount()

    // Both route decisions survive navigation, reload, annotations and review.
    const test = SAT_TEST_CATALOG[31]
    for (const correct of [17, 18]) {
      let attempt = createSATAttempt(test.id, test.modules, 'practice')
      attempt.currentQuestionIndex = 26
      attempt.answers = Object.fromEntries(test.modules[0].questions.slice(0, correct).map(q => [q.id, q.correctAnswer]))
      saveSATAttempt(attempt)
      saveActiveTestPaper(`profai:sat:${test.id}:attempt:v1`, test)
      const path = `/sat/mock/31/run${satRunSearch(test)}`
      await render(path)
      await click('Review module')
      await click('Continue to next module')
      attempt = loadSATAttempt(test.id)!
      assert.equal(attempt.currentModuleIndex, 1)
      assert.equal(attempt.adaptiveRoutes!.rw2, correct === 18 ? 'higher' : 'lower')
      const delivered = resolveSATTest(test, attempt).modules[1].questions
      assert.equal(delivered, test.modules[1].adaptive![attempt.adaptiveRoutes!.rw2!])
      const snapshot = readActiveTestPaper<typeof test>(`profai:sat:${test.id}:attempt:v1`)!
      assert.equal(snapshot.modules[1].adaptiveRoute, undefined, 'The base snapshot never prematurely locks an unstarted branch')
      await render(path)
      assert.equal(loadSATAttempt(test.id)!.adaptiveRoutes!.rw2, attempt.adaptiveRoutes!.rw2)
      assert.match(container.textContent!, /Question 1 of 27/)
      await unmount()
      attempt = loadSATAttempt(test.id)!
      const q = delivered[0]
      attempt.answers[q.id] = q.correctAnswer
      attempt.flagged = [q.id]
      attempt.notes[q.id] = 'My selected branch note'
      attempt.status = 'submitted'
      attempt.submittedAt = Date.now()
      saveSATAttempt(attempt)
      const report = analyzeSATResult(test, attempt)
      assert.equal(report.questions.find(item => item.id === q.id)!.sourceQuestionId, q.sourceQuestionId)
      assert.equal(report.report.correct, correct + 1)
      await render(`/sat/results/${encodeURIComponent(attempt.attemptId)}`, true)
      assert.ok(container.querySelector('.sat-results'), 'Submitted adaptive results open in Analyze')
      assert.deepEqual(loadSATAttemptHistory().find(entry => entry.id === attempt.attemptId)!.attempt.adaptiveRoutes, attempt.adaptiveRoutes)
      await unmount()
    }

    // Expiring Math 1 routes independently and gives Math 2 its full time.
    for (const correct of [13, 14]) {
      const startedAt = Date.now() - 35 * 60 * 1000
      const attempt = createSATAttempt(test.id, test.modules, 'exam')
      attempt.currentModuleIndex = 2
      attempt.currentQuestionIndex = 21
      attempt.adaptiveRoutes = { rw2: 'higher' }
      attempt.answers = Object.fromEntries([...test.modules[0].questions, ...test.modules[2].questions.slice(0, correct)].map(q => [q.id, q.correctAnswer]))
      attempt.moduleStartedAt.math1 = startedAt
      attempt.moduleDeadlines.math1 = Date.now() - 1
      attempt.moduleTimerStartedAt = startedAt
      saveSATAttempt(attempt)
      const path = `/sat/mock/31/run${satRunSearch(test)}`
      await render(path)
      const saved = loadSATAttempt(test.id)!
      assert.equal(saved.currentModuleIndex, 3)
      assert.equal(saved.adaptiveRoutes!.math2, correct === 14 ? 'higher' : 'lower')
      assert.equal(saved.adaptiveRoutes!.rw2, 'higher')
      assert.equal(saved.moduleDeadlines.math2 - saved.moduleStartedAt.math2, 35 * 60 * 1000)
      const math = resolveSATTest(test, saved).modules[3].questions
      assert.equal(math, test.modules[3].adaptive![saved.adaptiveRoutes!.math2!])
      await unmount()
      const paused = loadSATAttempt(test.id)!
      assert.ok(paused.moduleElapsedSeconds!.math1 >= 35 * 60)
      assert.equal(paused.adaptiveRoutes!.math2, saved.adaptiveRoutes!.math2)
      await render(path)
      assert.equal(loadSATAttempt(test.id)!.currentModuleIndex, 3)
      assert.equal(loadSATAttempt(test.id)!.adaptiveRoutes!.math2, saved.adaptiveRoutes!.math2)
      await unmount()
    }

    // Historical results retain original questions and score calculations.
    for (const paper of getSATReviewTests().filter(item => !item.modules.some(module => module.adaptive))) {
      const attempt = createSATAttempt(paper.id, paper.modules, 'practice')
      const answers = Object.fromEntries(paper.modules.flatMap(module => module.questions).filter((_, index) => index % 3 === 0).map(q => [q.id, q.correctAnswer]))
      attempt.answers = answers
      const before = scoreSATModules(paper.modules, answers)
      const resolved = resolveSATTest(paper, attempt)
      assert.deepEqual(resolved.modules, paper.modules)
      assert.deepEqual(analyzeSATResult(paper, attempt).report, before)
    }
    const oldResult: SATAttempt = { ...oldAttempt, status: 'submitted', submittedAt: Date.now() }
    saveSATAttempt(oldResult)
    await render(`/sat/results/${encodeURIComponent(oldResult.attemptId)}`, true)
    assert.ok(container.querySelector('.sat-results'), 'Historical fixed results still open in Analyze')
    assert.equal(loadSATAttemptHistory().find(entry => entry.id === oldResult.attemptId)!.attempt.testId, old.id)
    console.log('Adaptive UI: old active URL/snapshot/answers/notes; versioned resume links; both routes, reload and branch review; historical questions and scores preserved.')
  } finally { await unmount() }
}
