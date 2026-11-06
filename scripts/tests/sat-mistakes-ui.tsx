import SATMockRun from '../../src/pages/SATMockRun'
import { renderToStaticMarkup } from 'react-dom/server'
import SATQuestionCanvas from '../../src/components/sat/SATQuestionCanvas'
import { finishModule, migrateModuleTiming, moduleSeconds, moduleTimes, pauseModule, resumeModule, totalTime } from '../../src/features/sat/timing'
import React, { act, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import assert from 'node:assert/strict'
import SATResultReview from '../../src/pages/SATResultReview'
import SATReview from '../../src/components/sat/SATReview'
import { SAT_TEST_CATALOG, getSATSectionTest, getSATReviewTests } from '../../src/features/sat/catalog'
import { createSATAttempt, scoreSATModules } from '../../src/features/sat/practiceTest4'
import { loadSATAttemptHistory, saveSATAttempt, saveSATAttemptToHistory } from '../../src/features/sat/attemptStorage'
import { useBadgeStore } from '../../src/store/badgeStore'
import { accountStorage } from '../../src/utils/accountStorage'
import i18n from '../../src/i18n'

const container = document.getElementById('root')!
let root: ReturnType<typeof createRoot>
function Location() {
  const location = useLocation()
  return <output data-location>{location.pathname}{location.search}</output>
}
async function render(path = '/sat/results/older-result', content = <SATResultReview />) {
  if (root) await act(async () => root.unmount())
  root = createRoot(container)
  await act(async () => root.render(
    <StrictMode><MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Location />
      <Routes>
        <Route path="/sat/results/:attemptId" element={content} />
        <Route path="/profile" element={<h1>My Results</h1>} />
        <Route path="*" element={content} />
      </Routes>
    </MemoryRouter></StrictMode>,
  ))
}
const button = (text: string) => [...container.querySelectorAll('button')].find((node) => node.textContent?.trim() === text || (node.closest('.sr-review-filters') && node.firstChild?.textContent === text))
async function click(node: HTMLElement | null | undefined) {
  assert.ok(node, 'Expected an interactive element')
  await act(async () => node.click())
}
const text = () => container.textContent!

export async function run({ reviewOnly = false } = {}) {
  await i18n.changeLanguage('en')
  localStorage.clear()
  const timingModules = SAT_TEST_CATALOG[1].modules
  for (const mode of ['exam', 'practice'] as const) {
    let timed = createSATAttempt('timing', timingModules, mode)
    const start = timed.startedAt
    assert.equal(moduleSeconds(timed, timingModules, start), mode === 'exam' ? 1920 : 0)
    timed = pauseModule(timed, timingModules, start + 65000)
    assert.equal(totalTime(timed, timingModules, start + 600000), 65)
    timed = resumeModule(timed, timingModules, start + 600000)
    assert.equal(moduleSeconds(timed, timingModules, start + 610000), mode === 'exam' ? 1845 : 75)
    timed = finishModule(timed, timingModules, start + 620000)
    timed = { ...timed, currentModuleIndex: 1, moduleTimerStartedAt: start + 620000,
      moduleStartedAt: { ...timed.moduleStartedAt, rw2: start + 620000 },
      moduleDeadlines: { ...timed.moduleDeadlines, rw2: start + 620000 + 1920000 } }
    assert.equal(moduleSeconds(timed, timingModules, start + 620000), mode === 'exam' ? 1920 : 0)
    timed = { ...finishModule(timed, timingModules, start + 650000), status: 'submitted', submittedAt: start + 650000 }
    assert.equal(totalTime(timed, timingModules, start + 900000), 115)
    assert.deepEqual(moduleTimes(timed, timingModules), { rw1: 85, rw2: 30, math1: 0, math2: 0 })
    saveSATAttemptToHistory(timed, 'submitted')
    assert.equal(totalTime(loadSATAttemptHistory()[0].attempt, timingModules), 115)
  }
  const legacy = createSATAttempt('legacy', timingModules, 'exam')
  delete legacy.moduleElapsedSeconds
  delete legacy.moduleTimerStartedAt
  legacy.moduleDeadlines = { __test__: legacy.startedAt + 8040000 }
  const migrated = migrateModuleTiming(legacy, timingModules, legacy.startedAt + 60000)
  assert.equal(moduleSeconds(migrated, timingModules, legacy.startedAt + 60000), 1860)
  assert.equal(migrated.moduleDeadlines.__test__, undefined)
  const expired = createSATAttempt('expired', timingModules, 'exam')
  assert.equal(moduleSeconds(expired, timingModules, expired.startedAt + 2000000), 0)
  assert.equal(totalTime(finishModule(expired, timingModules, expired.startedAt + 2000000), timingModules), 1920)

  // Audit every current and historical Math question through the actual canvas.
  let audited = 0
  if (!reviewOnly) for (const test of getSATReviewTests().filter((test) => !test.id.endsWith('-math') && !test.id.endsWith('-reading-writing'))) {
    for (const question of test.modules.filter((module) => module.section === 'math').flatMap((module) => module.questions)) {
      const markup = renderToStaticMarkup(<SATQuestionCanvas question={question} answer="" onAnswer={() => {}} strokes={[]} highlightEnabled={false} highlightColor="#ffff00" onChange={() => {}} flagged={false} onToggleFlag={() => {}} />)
      const node = document.createElement('div')
      node.innerHTML = markup
      if (question.sourceContent && !question.sourceContent.context) {
        assert.equal(node.querySelectorAll('.mb-4.font-serif').length, 0, `${test.id}/${question.id}: duplicate fallback context`)
      }
      assert.ok(node.textContent?.includes('Mark for Review'))
      audited++
    }
  }
  if (!reviewOnly) console.log(`Audited ${audited} current and historical Math question renders; module timing and persistence passed.`)
  localStorage.clear()
  // Full mocks retain the 400 floor even with every answer wrong or missing.
  for (const test of Object.values(SAT_TEST_CATALOG)) {
    const wrongAnswers = Object.fromEntries(test.modules.flatMap((module) => module.questions).map((q) => [q.id, 'wrong']))
    for (const answers of [{}, wrongAnswers]) {
      const report = scoreSATModules(test.modules, answers)
      assert.deepEqual(report.readingWritingRange, [200, 200], test.id)
      assert.deepEqual(report.mathRange, [200, 200], test.id)
      assert.deepEqual(report.totalRange, [400, 400], test.id)
    }
  }
  let badgeCalls = 0
  useBadgeStore.setState({ awardIfEligible: () => { badgeCalls++; return { celebrated: false, tier: null } } })
  const test = SAT_TEST_CATALOG[8]
  const questions = test.modules.flatMap((module) => module.questions)
  assert.equal(questions.length, 98)
  const old = { ...createSATAttempt(test.id, test.modules, 'exam'), attemptId: 'older-result', status: 'submitted' as const, submittedAt: 1000 }
  old.answers = { [questions[0].id]: questions[0].correctAnswer, [questions[1].id]: 'wrong' }
  old.moduleElapsedSeconds = { rw1: 65, rw2: 120, math1: 180, math2: 240 }
  old.moduleStartedAt = { rw1: 0, rw2: 65000, math1: 185000, math2: 365000 }
  old.flagged = [questions[1].id]
  old.notes = { [questions[1].id]: 'Saved note from the older attempt' }
  saveSATAttemptToHistory(old, 'submitted')
  const newer = { ...old, attemptId: 'newer-result', submittedAt: 2000, answers: Object.fromEntries(questions.map((q) => [q.id, q.correctAnswer])) }
  saveSATAttempt(newer)
  const currentRaw = accountStorage.getItem(`profai:sat:${test.id}:attempt:v1`)

  await render()
  assert.doesNotMatch(text(), /Mistake Lab/)
  assert.ok(container.querySelector('.srx-score-stage'), 'History opens with compact scores')
  assert.equal(container.querySelectorAll('.srx-q-row').length, 0, 'Detailed review starts collapsed')
  await click(container.querySelector('#sat-result-tab-questions'))
  assert.equal(container.querySelectorAll('.srx-q-row').length, 98, 'Opening review shows every saved answer')
  assert.equal(container.querySelectorAll('.srx-row-correct').length, 1)
  await click(container.querySelector('#sat-result-tab-performance'))
  assert.match(container.querySelector('.srx-module')!.textContent!, /Reading and Writing.*Module 1.*1m 5s/)
  assert.match([...container.querySelectorAll('.srx-module')].at(-1)!.textContent!, /Math.*Module 2.*4m 0s/)
  await click(container.querySelector('#sat-result-tab-questions'))
  await click(container.querySelector('.srx-row-incorrect button'))
  assert.match(document.body.textContent!, /Saved note from the older attempt/)
  await click(document.querySelector('[aria-label="Close question"]'))
  assert.match(container.querySelector('[data-location]')!.textContent!, /\/sat\/results\/older-result/)
  assert.ok(!button('Start fresh'))
  assert.equal(accountStorage.getItem(`profai:sat:${test.id}:attempt:v1`), currentRaw)
  const reviewPath = container.querySelector('[data-location]')!.textContent!
  await render(reviewPath)
  await click(container.querySelector('#sat-result-tab-questions'))
  assert.equal(container.querySelectorAll('.srx-row-correct').length, 1)
  await click(container.querySelector('.chip-correct'))
  assert.equal(container.querySelectorAll('.srx-q-row').length, 1)
  await click(container.querySelector('.chip-incorrect'))
  assert.equal(container.querySelectorAll('.srx-q-row').length, 1)
  await click(container.querySelector('.chip-unanswered'))
  assert.equal(container.querySelectorAll('.srx-q-row').length, 96)
  await click(container.querySelector('.sr-back'))
  assert.equal(container.querySelector('h1')?.textContent, 'My Results')
  await render('/sat/results/newer-result')
  await click(container.querySelector('#sat-result-tab-questions'))
  assert.equal(container.querySelectorAll('.srx-row-correct').length, 98)
  assert.equal(badgeCalls, 0, 'Reviewing history must not award badges or write to the profile')
  await click(container.querySelector('.sr-back'))
  assert.equal(loadSATAttemptHistory().length, 2, 'Review keeps both saved attempts')

  const incomplete = { ...newer, attemptId: 'unfinished', status: 'active' as const, submittedAt: undefined }
  saveSATAttemptToHistory(incomplete, 'exit')
  await render('/sat/results/unfinished')
  assert.match(text(), /Saved incomplete/)
  assert.match(text(), /saved before submission/)
  assert.doesNotMatch(text(), /Estimated score range/)
  assert.equal(badgeCalls, 0)

  const section = getSATSectionTest(8, 'math')
  const sectionAttempt = { ...old, attemptId: 'math-section', testId: section.id, submittedAt: 3000 }
  const mathQuestions = section.modules.flatMap((module) => module.questions)
  sectionAttempt.answers = Object.fromEntries(mathQuestions.slice(0, 20).map((q) => [q.id, q.correctAnswer]))
  saveSATAttemptToHistory(sectionAttempt, 'submitted')
  await render('/sat/results/math-section')
  await click(container.querySelector('#sat-result-tab-questions'))
  const range = scoreSATModules(section.modules, sectionAttempt.answers).mathRange.join('–')
  assert.equal(container.querySelectorAll('.srx-row-correct').length, 20)
  await click(container.querySelector('#sat-result-tab-scores'))
  assert.equal(container.querySelector('.srx-total-range b')!.textContent, range)

  const oldMath = getSATSectionTest(1, 'math')
  const lowMathAttempt = {
    ...old,
    attemptId: 'old-math-low-score',
    testId: oldMath.id,
    answers: Object.fromEntries(oldMath.modules.flatMap((module) => module.questions).slice(0, 18).map((q) => [q.id, q.correctAnswer])),
  }
  saveSATAttemptToHistory(lowMathAttempt, 'submitted')
  const readingWriting = getSATSectionTest(1, 'reading-writing')
  saveSATAttemptToHistory({ ...old, attemptId: 'rw-minimum', testId: readingWriting.id, answers: {} }, 'submitted')
  await render('/sat/results/old-math-low-score')
  assert.equal(container.querySelector('.srx-total-range b')!.textContent, scoreSATModules(oldMath.modules, lowMathAttempt.answers).mathRange.join('–'))
  await render('/sat/results/rw-minimum')
  assert.equal(container.querySelector('.srx-total-range b')!.textContent, '200–200')

  // Adding Test 9 Math 2 must not reinterpret a saved original 76-question result.
  const legacyNine = getSATReviewTests().find((entry) => entry.id === 'may-2026-us-v1')!
  const legacyAnswers = Object.fromEntries(legacyNine.modules.flatMap((module) => module.questions).map((q) => [q.id, q.correctAnswer]))
  saveSATAttemptToHistory({ ...old, attemptId: 'legacy-nine', testId: legacyNine.id, answers: legacyAnswers }, 'submitted')
  await render('/sat/results/legacy-nine')
  await click(container.querySelector('#sat-result-tab-questions'))
  assert.equal(container.querySelectorAll('.srx-row-correct').length, 76)
  assert.match(text(), /Math Module 2 is unavailable/)
  assert.doesNotMatch(text(), /Estimated SAT range/)

  await render('/sat/results/deleted')
  assert.equal(container.querySelector('[data-location]')!.textContent, '/profile', 'Missing result returns to My Results')
  assert.equal(container.querySelector('h1')?.textContent, 'My Results')

  // The existing end-of-test screen retains its restart action and badge behavior.
  let restarted = false
  await render('/mock/sat/8/run', <SATReview attempt={newer} test={test} onStartAgain={() => { restarted = true }} />)
  assert.ok(badgeCalls > 0)
  await click(button('Start fresh'))
  assert.ok(restarted)
  console.log('PASS: SAT exact-attempt review, reload, answer filters, notes, incomplete/section/legacy results and My Results return')
  if (reviewOnly) {
    await act(async () => root.unmount())
    return
  }
  // Exercise the actual runner: automatic exam progression, final submission,
  // manual practice progression, and resume after a saved pause.
  const runTest = SAT_TEST_CATALOG[1]
  Object.defineProperty(document, 'fullscreenElement', { value: document.documentElement, configurable: true })
  let exam = createSATAttempt(runTest.id, runTest.modules, 'exam')
  exam.moduleDeadlines.rw1 = Date.now() - 1
  saveSATAttempt(exam)
  await render('/mock/sat/1/run', <SATMockRun />)
  assert.ok(container.querySelector('.sat-module-transition'))
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 1800)) })
  assert.match(text(), /Section 1, Module 2/)
  assert.match(container.querySelector('button[title="Hide timer"]')!.textContent!, /32:00/)
  let stored = JSON.parse(accountStorage.getItem(`profai:sat:${runTest.id}:attempt:v1`)!)
  assert.equal(stored.status, 'active')
  assert.equal(stored.currentModuleIndex, 1)
  await render('/empty', <div />)
  exam = createSATAttempt(runTest.id, runTest.modules, 'exam')
  exam.currentModuleIndex = 3
  exam.moduleStartedAt.math2 = Date.now() - 2100000
  exam.moduleTimerStartedAt = exam.moduleStartedAt.math2
  exam.moduleDeadlines.math2 = Date.now() - 1
  saveSATAttempt(exam)
  await render('/mock/sat/1/run', <SATMockRun />)
  stored = JSON.parse(accountStorage.getItem(`profai:sat:${runTest.id}:attempt:v1`)!)
  assert.equal(stored.status, 'submitted')
  assert.match(text(), /Your SAT results/i)
  await render('/empty', <div />)
  Object.defineProperty(document, 'fullscreenElement', { value: null, configurable: true })
  let practice = createSATAttempt(runTest.id, runTest.modules, 'practice')
  practice.moduleTimerStartedAt = Date.now() - 65000
  practice = pauseModule(practice, runTest.modules)
  saveSATAttempt(practice)
  await render('/mock/sat/1/run', <SATMockRun />)
  assert.match(container.querySelector('button[title="Hide timer"]')!.textContent!, /01:05/)
  await click([...container.querySelectorAll('button')].find((node) => node.textContent?.includes('Question 1 of')))
  await click(button('Finish module'))
  await click(button('Continue to next module'))
  assert.ok(container.querySelector('.sat-module-transition'))
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 1800)) })
  assert.match(container.querySelector('button[title="Hide timer"]')!.textContent!, /00:00/)
  stored = JSON.parse(accountStorage.getItem(`profai:sat:${runTest.id}:attempt:v1`)!)
  assert.equal(stored.currentModuleIndex, 1)
  assert.ok(stored.moduleElapsedSeconds.rw1 >= 65)
  await act(async () => root.unmount())
  console.log('SAT result review: exact attempts, reload, answer filters, saved notes, incomplete attempts, section scores and My Results return passed.')
}
