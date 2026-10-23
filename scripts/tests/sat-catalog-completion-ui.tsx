import React, { act } from 'react'
import assert from 'node:assert/strict'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import SATSection from '../../src/pages/SATSection'
import { SAT_TEST_CATALOG, getSATSectionTest } from '../../src/features/sat/catalog'
import { createSATAttempt } from '../../src/features/sat/practiceTest4'
import { clearSATAttempt, saveSATAttempt, saveSATAttemptToHistory } from '../../src/features/sat/attemptStorage'
import { useAuthStore } from '../../src/store/authStore'
import '../../src/i18n'

export async function run() {
  localStorage.clear()
  useAuthStore.setState({ user: { id: 'catalog-user' } as never })
  const full = SAT_TEST_CATALOG[1]
  const math = getSATSectionTest(2, 'math')
  const finished = createSATAttempt(full.id, full.modules, 'exam')
  finished.status = 'submitted'
  finished.submittedAt = Date.now()
  saveSATAttempt(finished)
  clearSATAttempt(full.id)
  // A new unfinished attempt must not hide a previous completion.
  saveSATAttempt(createSATAttempt(full.id, full.modules, 'exam'))
  const mathAttempt = createSATAttempt(math.id, math.modules, 'exam')
  mathAttempt.status = 'submitted'
  mathAttempt.submittedAt = Date.now()
  saveSATAttempt(mathAttempt)
  const terminated = createSATAttempt(SAT_TEST_CATALOG[3].id, SAT_TEST_CATALOG[3].modules, 'exam')
  terminated.status = 'terminated'
  saveSATAttemptToHistory(terminated, 'exit')
  let root: ReturnType<typeof createRoot> | undefined
  const container = document.getElementById('root')!
  const render = async (section: string) => {
    if (root) await act(async () => root!.unmount())
    root = createRoot(container)
    await act(async () => root!.render(<MemoryRouter initialEntries={[`/sat/${section}`]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes><Route path="/sat/:section" element={<SATSection />} /></Routes>
    </MemoryRouter>))
  }
  const completedCards = () => [...container.querySelectorAll('[data-sat-completed]')].map(badge => badge.closest('button')!)
  try {
    await render('mocks')
    assert.equal(completedCards().length, 1)
    assert.match(completedCards()[0].textContent!, /Full Mock 1/)
    assert.match(completedCards()[0].textContent!, /Continue/)
    await render('mocks')
    assert.equal(completedCards().length, 1, 'Completion survives a reload')
    await render('math')
    assert.equal(completedCards().length, 1)
    assert.match(completedCards()[0].textContent!, /Practice Test 2/)
    await render('reading-writing')
    assert.equal(completedCards().length, 0, 'Section completion stays separate')
    await render('mocks')
    await act(async () => useAuthStore.setState({ user: { id: 'other-user' } as never }))
    assert.equal(completedCards().length, 0, 'Completion belongs to the signed-in account')
    console.log('SAT catalog completion: history, retries, reloads, section isolation and account isolation passed.')
  } finally {
    if (root) await act(async () => root!.unmount())
  }
}
