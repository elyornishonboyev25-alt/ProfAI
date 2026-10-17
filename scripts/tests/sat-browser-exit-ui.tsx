import React, { act, useEffect } from 'react'
import assert from 'node:assert/strict'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import SATBrowserExitGuard from '../../src/components/sat/SATBrowserExitGuard'
import { useActiveTest } from '../../src/hooks/useActiveTest'
import { getSATSectionTest } from '../../src/features/sat/catalog'
import { createSATAttempt } from '../../src/features/sat/practiceTest4'
import { loadSATAttempt, saveSATAttempt } from '../../src/features/sat/attemptStorage'
import { pauseModule } from '../../src/features/sat/timing'
import { useAuthStore } from '../../src/store/authStore'
import '../../src/i18n'

// Model the runner's existing save-on-unmount behavior without rendering question assets.
function ActiveAttempt() {
  useActiveTest(true)
  useEffect(() => () => {
    const test = getSATSectionTest('1', null)
    const attempt = loadSATAttempt(test.id)!
    saveSATAttempt(pauseModule(attempt, test.modules))
  }, [])
  return <p>Active SAT test</p>
}

export async function run() {
  localStorage.clear()
  useAuthStore.setState({ user: null })
  const container = document.getElementById('root')!
  const test = getSATSectionTest('1', null)
  Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => document.documentElement })
  document.documentElement.requestFullscreen = async () => {}
  document.exitFullscreen = async () => {}
  let root = createRoot(container)
  const settle = () => new Promise(resolve => setTimeout(resolve, 80))
  const render = async (mode: 'exam' | 'practice') => {
    const attempt = createSATAttempt(test.id, test.modules, mode)
    attempt.answers[test.modules[0].questions[0].id] = 'B'
    saveSATAttempt(attempt)
    window.history.replaceState({ idx: 0, key: 'previous' }, '', '/previous')
    window.history.pushState({ idx: 1, key: 'test' }, '', '/sat/mock/1/run')
    await act(async () => root.render(
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/sat/mock/:mockId/run" element={<SATBrowserExitGuard><ActiveAttempt /></SATBrowserExitGuard>} />
          <Route path="/previous" element={<p>Previous page</p>} />
          <Route path="/sat" element={<p>SAT Arena</p>} />
        </Routes>
      </BrowserRouter>,
    ))
  }
  const click = async (label: string) => {
    const button = [...container.querySelectorAll('button')].find(node => node.textContent?.trim() === label)
    assert.ok(button, `Missing ${label}`)
    await act(async () => { button.click(); await settle() })
  }
  const back = async () => act(async () => { window.history.back(); await settle() })
  try {
    await render('exam')
    const deadline = loadSATAttempt(test.id)!.moduleDeadlines[test.modules[0].id]
    for (let i = 0; i < 2; i++) {
      await back()
      assert.ok(container.querySelector('[aria-labelledby="sat-browser-exit-title"]'), 'Back opens confirmation')
      assert.equal(window.location.pathname, '/sat/mock/1/run', 'History returns to the active test')
      assert.equal(loadSATAttempt(test.id)!.status, 'active')
      assert.equal(loadSATAttempt(test.id)!.answers[test.modules[0].questions[0].id], 'B')
      await click('Continue test')
      assert.equal(container.querySelector('[aria-labelledby="sat-browser-exit-title"]'), null)
      assert.equal(loadSATAttempt(test.id)!.moduleDeadlines[test.modules[0].id], deadline)
    }
    const unload = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(unload)
    assert.ok(unload.defaultPrevented, 'Document exits request browser confirmation')
    assert.equal(loadSATAttempt(test.id)!.pausedModuleSeconds, undefined, 'Canceled document exits do not pause the timer')
    await back()
    await click('Exit & Save')
    assert.match(container.textContent!, /Previous page/, 'Confirmation follows the requested history destination')
    assert.equal(loadSATAttempt(test.id)!.answers[test.modules[0].questions[0].id], 'B', 'Confirmed browser exit preserves answers')

    await act(async () => root.unmount())
    root = createRoot(container)
    await render('practice')
    await back()
    assert.ok(container.querySelector('[aria-labelledby="sat-browser-exit-title"]'))
    await click('Continue test')
    await back()
    await click('Exit & Save')
    assert.match(container.textContent!, /Previous page/)
    assert.equal(loadSATAttempt(test.id)!.answers[test.modules[0].questions[0].id], 'B', 'Practice exit saves answers')
    const completedUnload = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(completedUnload)
    assert.equal(completedUnload.defaultPrevented, false, 'No warning after leaving the test')
    console.log('SAT browser back: repeated cancellation, live timer, unload confirmation, confirmed destination and practice saving passed.')
  } finally {
    await act(async () => root.unmount())
  }
}
