import React, { act } from 'react'
import assert from 'node:assert/strict'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import SATMockRun from '../../src/pages/SATMockRun'
import MockSAT from '../../src/pages/MockSAT'
import { getSATSectionTest } from '../../src/features/sat/catalog'
import { createSATAttempt } from '../../src/features/sat/practiceTest4'
import { loadSATAttempt, saveSATAttempt, loadSATAttemptHistory, saveSATAttemptToHistory } from '../../src/features/sat/attemptStorage'
import { useAuthStore } from '../../src/store/authStore'
import '../../src/i18n'

export async function run() {
  localStorage.clear()
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
      </Routes>
    </MemoryRouter>,
  ))
  const click = async (label: string) => {
    const button = [...container.querySelectorAll('button')].find(node => node.textContent?.trim() === label)
    assert.ok(button, `Missing ${label}`)
    await act(async () => button.click())
  }
  const reload = async (path = '/sat/mock/1/run') => {
    await act(async () => root.unmount())
    root = createRoot(container)
    await render(path)
  }
  try {
    const attempt = createSATAttempt(test.id, test.modules, 'exam')
    attempt.answers[test.modules[0].questions[0].id] = 'B'
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
    await click('Exit test')
    assert.ok(container.querySelector('[aria-labelledby="sat-exit-title"]'))
    assert.match(container.textContent!, /answers will be deleted/)
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
    await click('More')
    await click('Exit test')
    await click('Leave and end attempt')
    assert.match(container.textContent!, /SAT Arena/)
    const discarded = loadSATAttempt(test.id)!
    assert.equal(discarded.status, 'terminated')
    assert.deepEqual(discarded.answers, {})
    assert.deepEqual(discarded.notes, {})
    assert.deepEqual(discarded.highlights, {})
    assert.deepEqual(discarded.flagged, [])
    assert.ok(!loadSATAttemptHistory().some(entry => entry.id === attempt.attemptId), 'Discard removes previously saved answers from history')
    assert.ok(loadSATAttemptHistory().some(entry => entry.id === otherAttempt.attemptId), 'Previous results remain saved')
    await reload()
    assert.match(container.textContent!, /Attempt ended/)
    assert.ok(!container.querySelector('[aria-labelledby="sat-exit-title"]'))
    await click('Return to SAT Arena')
    assert.equal(loadSATAttempt(test.id)!.status, 'terminated', 'Returning does not unlock the attempt')

    saveSATAttempt(createSATAttempt(test.id, test.modules, 'practice'))
    await reload()
    assert.ok(!container.querySelector('[aria-labelledby="sat-exit-title"]'))
    await click('More')
    await click('Exit & Save')
    assert.equal(loadSATAttempt(test.id)!.status, 'active', 'Practice remains resumable')
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
    console.log('SAT exam: optional fullscreen, uninterrupted timing, windowed reload, exit cancellation, discarded answers/history, prior-result preservation, denied fullscreen start, module expiry and practice passed.')
  } finally {
    await act(async () => root.unmount())
    Date.now = originalNow
  }
}
