import React, { act } from 'react'
import assert from 'node:assert/strict'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import SATMockRun from '../../src/pages/SATMockRun'
import { getSATSectionTest } from '../../src/features/sat/catalog'
import { createSATAttempt } from '../../src/features/sat/practiceTest4'
import { loadSATAttempt, saveSATAttempt, loadSATAttemptHistory } from '../../src/features/sat/attemptStorage'
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
  const render = async () => act(async () => root.render(
    <MemoryRouter initialEntries={['/sat/mock/1/run']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
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
  const reload = async () => {
    await act(async () => root.unmount())
    root = createRoot(container)
    await render()
  }
  try {
    const attempt = createSATAttempt(test.id, test.modules, 'exam')
    attempt.answers[test.modules[0].questions[0].id] = 'B'
    saveSATAttempt(attempt)
    await render()
    assert.equal(container.querySelector('[aria-labelledby="sat-exit-title"]'), null)
    await act(async () => document.exitFullscreen())
    assert.ok(container.querySelector('[aria-labelledby="sat-exit-title"]'))
    assert.match(container.textContent!, /cannot resume it/)
    const remaining = loadSATAttempt(test.id)!.pausedModuleSeconds
    offset += 120_000
    await act(async () => new Promise(resolve => setTimeout(resolve, 300)))
    assert.equal(loadSATAttempt(test.id)!.status, 'active', 'No automatic termination after 30 seconds')
    assert.equal(loadSATAttempt(test.id)!.pausedModuleSeconds, remaining)
    await reload()
    assert.ok(container.querySelector('[aria-labelledby="sat-exit-title"]'), 'Reload keeps the exit choice')
    denyFullscreen = true
    await click('Continue test')
    assert.ok(container.querySelector('[aria-labelledby="sat-exit-title"]'), 'Failed fullscreen request keeps the choice open')
    denyFullscreen = false
    await click('Continue test')
    assert.equal(container.querySelector('[aria-labelledby="sat-exit-title"]'), null)
    const restoredSeconds = (loadSATAttempt(test.id)!.moduleDeadlines[test.modules[0].id] - Date.now()) / 1000
    assert.ok(Math.abs(restoredSeconds - remaining!) < 1, 'Continue restores the remaining time')
    assert.equal(loadSATAttempt(test.id)!.answers[test.modules[0].questions[0].id], 'B')
    await click('More')
    await click('Exit test')
    assert.ok(container.querySelector('[aria-labelledby="sat-exit-title"]'), 'Menu exit requires the same choice')
    await click('Continue test')
    await act(async () => document.exitFullscreen())
    await click('Leave and end attempt')
    assert.match(container.textContent!, /SAT Arena/)
    assert.equal(loadSATAttempt(test.id)!.status, 'terminated')
    assert.equal(loadSATAttemptHistory()[0].attempt.status, 'terminated')
    await reload()
    assert.match(container.textContent!, /Attempt ended/)
    assert.equal(container.querySelector('[aria-labelledby="sat-exit-title"]'), null)
    await click('Return to SAT Arena')
    assert.equal(loadSATAttempt(test.id)!.status, 'terminated', 'Returning does not unlock the attempt')

    saveSATAttempt(createSATAttempt(test.id, test.modules, 'practice'))
    await reload()
    assert.equal(container.querySelector('[aria-labelledby="sat-exit-title"]'), null)
    await click('More')
    await click('Exit & Save')
    assert.equal(loadSATAttempt(test.id)!.status, 'active', 'Practice remains resumable')
    console.log('SAT fullscreen exit: choice, paused timer, no timeout, reload, denied permission, resume, menu exit, permanent attempt closure and practice passed.')
  } finally {
    await act(async () => root.unmount())
    Date.now = originalNow
  }
}
