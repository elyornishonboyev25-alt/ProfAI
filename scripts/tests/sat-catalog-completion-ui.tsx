import React, { act } from 'react'
import assert from 'node:assert/strict'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import SATSection from '../../src/pages/SATSection'
import { SAT_TEST_CATALOG, getSATSectionTest } from '../../src/features/sat/catalog'
import { createSATAttempt } from '../../src/features/sat/practiceTest4'
import { clearSATAttempt, loadSATAttempt, saveSATAttempt, saveSATAttemptToHistory } from '../../src/features/sat/attemptStorage'
import { accountStorage } from '../../src/utils/accountStorage'
import { useAuthStore } from '../../src/store/authStore'
import i18n from '../../src/i18n'


export async function run() {
  localStorage.clear()
  await i18n.changeLanguage('en')
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
      <Routes>
        <Route path="/sat/:section" element={<SATSection />} />
      </Routes>
    </MemoryRouter>))
  }
  const completedCards = () => [...container.querySelectorAll('[data-sat-completed]')].map(badge => badge.closest('button')!)
  // Saved tests live in the In process tab; the catalog shows progress on each card only.
  const inProcess = () => container.querySelector('[data-sat-in-process]')
  const card = (title: string) => [...container.querySelectorAll('button')].find(button => button.querySelector('h2')?.textContent === title)!
  try {
    await render('mocks')
    assert.equal(completedCards().length, 1)
    assert.match(completedCards()[0].textContent!, /Full Mock 1/)
    assert.match(completedCards()[0].textContent!, /Continue/)
    assert.equal(inProcess(), null, 'The catalog has no separate in-process banner')
    assert.match(card('Full Mock 1').textContent!, /Saved progress/)
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
    assert.doesNotMatch(card('Full Mock 1').textContent!, /Saved progress/, 'Unfinished tests belong to the signed-in account')

    await act(async () => useAuthStore.setState({ user: { id: 'catalog-user' } as never }))
    const newestTest = SAT_TEST_CATALOG[2]
    const newest = createSATAttempt(newestTest.id, newestTest.modules, 'practice')
    newest.currentModuleIndex = 1
    newest.currentQuestionIndex = 3
    newest.answers[newestTest.modules[0].questions[0].id] = 'A'
    newest.answers[newestTest.modules[0].questions[1].id] = '  '
    newest.notes[newestTest.modules[0].questions[0].id] = 'Keep this note'
    newest.updatedAt = Date.now() + 1000
    const saveFixture = (attempt: typeof newest) => accountStorage.setItem(`profai:sat:${attempt.testId}:attempt:v1`, JSON.stringify(attempt))
    // A more recent section practice must not displace a full mock.
    const sectionAttempt = createSATAttempt(math.id, math.modules, 'practice')
    sectionAttempt.updatedAt = newest.updatedAt + 1000
    await act(async () => {
      saveFixture(newest)
      saveFixture(sectionAttempt)
      const ended = { ...terminated, updatedAt: newest.updatedAt + 2000 }
      saveFixture(ended)
      await new Promise(resolve => setTimeout(resolve, 80))
    })
    assert.equal(inProcess(), null)
    assert.match(card('Full Mock 2').textContent!, new RegExp(`Saved progress1/${newestTest.questionCount}`))
    assert.match(card('Full Mock 2').textContent!, /Continue/)
    await render('mocks')
    assert.match(card('Full Mock 2').textContent!, /Continue/, 'Saved progress survives a reload')
    assert.deepEqual(loadSATAttempt(newestTest.id), newest, 'The catalog preserves the attempt, answers, notes and question position')
    console.log('SAT catalog: completion, saved progress on cards, no duplicate in-process banner, reloads, section and account isolation passed.')
  } finally {
    if (root) await act(async () => root!.unmount())
  }
}
