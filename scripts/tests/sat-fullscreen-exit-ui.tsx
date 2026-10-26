import React, { act } from 'react'
import assert from 'node:assert/strict'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import SATMockRun from '../../src/pages/SATMockRun'
import MockSAT from '../../src/pages/MockSAT'
import { getSATSectionTest } from '../../src/features/sat/catalog'
import { createSATAttempt } from '../../src/features/sat/practiceTest4'
import { loadSATAttempt, saveSATAttempt, loadSATAttemptHistory, saveSATAttemptToHistory } from '../../src/features/sat/attemptStorage'
import { moduleSeconds, totalTime } from '../../src/features/sat/timing'
import { useAuthStore } from '../../src/store/authStore'
import i18n from '../../src/i18n'

export async function run() {
  localStorage.clear()
  await i18n.changeLanguage('en')
  useAuthStore.setState({ user: null })
  const container = document.getElementById('root')!
  const test = getSATSectionTest('1', null)
  const originalNow = Date.now
  let offset = 0
  Date.now = () => originalNow() + offset
  let fullscreen: Element | null = document.documentElement
  let denyFullscreen = false
  Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => fullscreen })
  document.documentElement.requestFullscreen = async () => {
    if (denyFullscreen) throw new Error('Permission denied')
    fullscreen = document.documentElement
    document.dispatchEvent(new Event('fullscreenchange'))
  }
  document.exitFullscreen = async () => {
    fullscreen = null
    document.dispatchEvent(new Event('fullscreenchange'))
  }
  let root = createRoot(container)
  const render = async (path = '/sat/mock/1/run') => act(async () => root.render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/mock/sat/:mockId" element={<MockSAT />} />
        <Route path="/sat/mock/:mockId/run" element={<SATMockRun />} />
        <Route path="/sat" element={<p>SAT Arena</p>} />
        <Route path="/sat/math" element={<p>SAT Math</p>} />
      </Routes>
    </MemoryRouter>,
  ))
  const click = async (label: string) => {
    const button = [...container.querySelectorAll('button')].find(node => node.textContent?.trim() === label || node.getAttribute('aria-label') === label)
    assert.ok(button, `Missing ${label}: ${container.textContent?.slice(0, 800)}`)
    await act(async () => button.click())
  }
  const reload = async (path = '/sat/mock/1/run') => {
    await act(async () => root.unmount())
    root = createRoot(container)
    await render(path)
  }
  try {
    const attempt = createSATAttempt(test.id, test.modules, 'exam')
    const firstQuestion = test.modules[0].questions[0].id
    attempt.answers[firstQuestion] = 'B'
    attempt.notes[firstQuestion] = 'Keep this exam note'
    attempt.highlights[firstQuestion] = [{
      id: 'saved-highlight', color: '#fde68a', width: 1, points: [], surface: 'question',
      textRange: { block: 'prompt', start: 0, end: 4, text: 'Keep' },
    }]
    attempt.flagged = [firstQuestion]
    attempt.eliminatedChoices = { [firstQuestion]: ['A', 'C'] }
    attempt.currentQuestionIndex = 2
    saveSATAttempt(attempt)
    await render()
    const deadline = loadSATAttempt(test.id)!.moduleDeadlines[test.modules[0].id]
    await act(async () => document.exitFullscreen())
    assert.ok(!container.querySelector('[aria-labelledby="sat-exit-title"]'), 'Leaving fullscreen does not interrupt the test')
    assert.equal(loadSATAttempt(test.id)!.pausedModuleSeconds, undefined)
    offset += 120_000
    await act(async () => new Promise(resolve => setTimeout(resolve, 300)))
    assert.equal(loadSATAttempt(test.id)!.status, 'active')
    assert.equal(loadSATAttempt(test.id)!.moduleDeadlines[test.modules[0].id], deadline, 'Windowed mode keeps the original timer')
    await click('More')
    await click('Enter fullscreen')
    assert.ok(fullscreen)
    await click('Exit fullscreen')
    assert.ok(!fullscreen)
    assert.ok(!container.querySelector('[aria-labelledby="sat-exit-title"]'))
    await click('Save and exit')
    assert.ok(container.querySelector('[aria-labelledby="sat-exit-title"]'))
    assert.match(container.textContent!, /Save and exit\?/)
    assert.match(container.textContent!, /answers and remaining time will be saved/)
    assert.doesNotMatch(container.textContent!, /answers will be deleted|Leave and end attempt/)
    assert.equal(loadSATAttempt(test.id)!.pausedModuleSeconds, undefined, 'Exit confirmation does not pause the exam')
    denyFullscreen = true
    await click('Continue test')
    await act(async () => new Promise(resolve => setTimeout(resolve, 350)))
    assert.ok(!fullscreen, 'Continue works without fullscreen permission')
    assert.ok(!container.querySelector('[aria-labelledby="sat-exit-title"]'))
    assert.equal(loadSATAttempt(test.id)!.answers[test.modules[0].questions[0].id], 'B')
    await reload()
    assert.ok(!container.querySelector('[aria-labelledby="sat-exit-title"]'), 'Reload can continue in windowed mode')
    assert.equal(loadSATAttempt(test.id)!.pausedModuleSeconds, undefined)
    assert.equal(loadSATAttempt(test.id)!.answers[test.modules[0].questions[0].id], 'B')
    const otherAttempt = { ...attempt, attemptId: 'previous-completed', status: 'submitted' as const, submittedAt: Date.now() }
    saveSATAttemptToHistory(otherAttempt, 'submitted')
    assert.ok(loadSATAttemptHistory().some(entry => entry.id === attempt.attemptId), 'Reload saved an unfinished history entry')
    const exitDeadline = loadSATAttempt(test.id)!.moduleDeadlines[test.modules[0].id]
    await click('More')
    await click('Save and exit')
    offset += 10_000
    await act(async () => new Promise(resolve => setTimeout(resolve, 300)))
    assert.equal(loadSATAttempt(test.id)!.moduleDeadlines[test.modules[0].id], exitDeadline, 'Confirmation keeps the exam timer running')
    await click('Save and exit')
    assert.match(container.textContent!, /SAT Arena/)
    const saved = loadSATAttempt(test.id)!
    assert.equal(saved.status, 'active', 'Exam remains resumable')
    assert.equal(saved.mode, 'exam')
    for (const key of ['answers', 'notes', 'highlights', 'flagged', 'eliminatedChoices', 'currentModuleIndex', 'currentQuestionIndex'] as const) {
      assert.deepEqual(saved[key], attempt[key], `${key} survives saving and exiting`)
    }
    assert.ok(saved.pausedModuleSeconds! > 0 && saved.pausedModuleSeconds! < test.modules[0].durationSeconds)
    assert.ok(Math.abs(saved.pausedModuleSeconds! - Math.ceil((exitDeadline - Date.now()) / 1000)) <= 1, 'Save pauses the remaining exam time')
    assert.equal(saved.moduleTimerStartedAt, undefined)
    const history = loadSATAttemptHistory().find(entry => entry.id === attempt.attemptId)!
    assert.equal(history.saveReason, 'exit')
    assert.deepEqual(history.attempt.answers, attempt.answers, 'Saved history retains exam answers')
    assert.deepEqual(history.attempt.notes, attempt.notes)
    assert.deepEqual(history.attempt.highlights, attempt.highlights)
    assert.ok(loadSATAttemptHistory().some(entry => entry.id === otherAttempt.attemptId), 'Previous results remain saved')
    offset += 3_600_000
    assert.equal(moduleSeconds(saved, test.modules), saved.pausedModuleSeconds, 'Time away does not use remaining exam time')
    const elapsedBeforeResume = totalTime(saved, test.modules)
    await reload('/mock/sat/1')
    assert.match(container.textContent!, /Saved attempt/)
    assert.doesNotMatch(container.textContent!, /discards your answers|Answers discarded on exit/)
    await click('Resume')
    assert.ok(!container.querySelector('[aria-labelledby="sat-exit-title"]'))
    const resumed = loadSATAttempt(test.id)!
    assert.equal(resumed.attemptId, attempt.attemptId, 'Resume opens the saved attempt')
    assert.equal(resumed.currentQuestionIndex, 2)
    assert.deepEqual(resumed.answers, attempt.answers)
    assert.equal(resumed.pausedModuleSeconds, undefined)
    assert.ok(Math.abs(moduleSeconds(resumed, test.modules) - saved.pausedModuleSeconds!) <= 1, 'Resume restores the saved remaining time')
    assert.ok(Math.abs(totalTime(resumed, test.modules) - elapsedBeforeResume) < 1, 'Elapsed exam time excludes time away')

    await act(async () => root.unmount())
    root = createRoot(container)
    saveSATAttempt(createSATAttempt(test.id, test.modules, 'practice'))
    await render()
    assert.ok(!container.querySelector('[aria-labelledby="sat-exit-title"]'))
    await click('More')
    await click('Save and exit')
    assert.equal(loadSATAttempt(test.id)!.status, 'active', 'Practice remains resumable')
    assert.ok(loadSATAttempt(test.id)!.pausedModuleSeconds !== undefined, 'Practice timing is still paused on exit')

    const mathTest = getSATSectionTest('1', 'math')
    const mathAttempt = createSATAttempt(mathTest.id, mathTest.modules, 'exam')
    mathAttempt.currentQuestionIndex = 2
    mathAttempt.answers[mathTest.modules[0].questions[0].id] = 'B'
    saveSATAttempt(mathAttempt)
    await reload('/sat/mock/1/run?section=math')
    await click('More')
    await click('Save and exit')
    await click('Save and exit')
    assert.match(container.textContent!, /SAT Math/, 'Section exams return to their section')
    assert.deepEqual(loadSATAttempt(mathTest.id)!.answers, mathAttempt.answers)
    await reload('/mock/sat/1?section=math')
    await click('Resume')
    assert.equal(loadSATAttempt(mathTest.id)!.attemptId, mathAttempt.attemptId)
    assert.equal(loadSATAttempt(mathTest.id)!.currentQuestionIndex, 2, 'Section exams resume at the saved question')
    // A denied initial fullscreen request still starts Exam Mode.
    await reload('/mock/sat/1?diagnostic=1')
    await click('Start Exam Mode')
    assert.equal(loadSATAttempt(test.id)!.mode, 'exam')
    assert.equal(loadSATAttempt(test.id)!.status, 'active')
    assert.ok(!container.querySelector('[aria-labelledby="sat-exit-title"]'))
    // Module timing still advances automatically outside fullscreen.
    offset += test.modules[0].durationSeconds * 1000 + 1000
    await act(async () => new Promise(resolve => setTimeout(resolve, 300)))
    assert.equal(loadSATAttempt(test.id)!.currentModuleIndex, 1)
    console.log('SAT exam: optional fullscreen, live confirmation timer, save and exit, preserved answers/annotations/history, paused time away, full/section resume, prior-result preservation, denied fullscreen start, module expiry and practice passed.')
  } finally {
    await act(async () => root.unmount())
    Date.now = originalNow
  }
}
