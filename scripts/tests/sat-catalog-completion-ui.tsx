import React, { act } from 'react'
import assert from 'node:assert/strict'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom'
import SATSection from '../../src/pages/SATSection'
import { SAT_TEST_CATALOG, getSATSectionTest } from '../../src/features/sat/catalog'
import { createSATAttempt } from '../../src/features/sat/practiceTest4'
import { clearSATAttempt, loadSATAttempt, saveSATAttempt, saveSATAttemptToHistory } from '../../src/features/sat/attemptStorage'
import { accountStorage } from '../../src/utils/accountStorage'
import { useAuthStore } from '../../src/store/authStore'
import i18n from '../../src/i18n'

function ResumeTarget() {
  const { mockId } = useParams()
  return <div data-sat-resume-target={mockId}>Saved test runner</div>
}

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
        <Route path="/sat/mock/:mockId/run" element={<ResumeTarget />} />
      </Routes>
    </MemoryRouter>))
  }
  const completedCards = () => [...container.querySelectorAll('[data-sat-completed]')].map(badge => badge.closest('button')!)
  const inProcess = () => container.querySelector('[data-sat-in-process]')
  try {
    await render('mocks')
    assert.equal(completedCards().length, 1)
    assert.match(completedCards()[0].textContent!, /Full Mock 1/)
    assert.match(completedCards()[0].textContent!, /Continue/)
    assert.match(inProcess()!.textContent!, /In process.*Full Mock 1/)
    await render('mocks')
    assert.equal(completedCards().length, 1, 'Completion survives a reload')
    await render('math')
    assert.equal(inProcess(), null, 'The full-mock resume banner is not shown in section practice')
    assert.equal(completedCards().length, 1)
    assert.match(completedCards()[0].textContent!, /Practice Test 2/)
    await render('reading-writing')
    assert.equal(completedCards().length, 0, 'Section completion stays separate')
    await render('mocks')
    await act(async () => useAuthStore.setState({ user: { id: 'other-user' } as never }))
    assert.equal(completedCards().length, 0, 'Completion belongs to the signed-in account')
    assert.equal(inProcess(), null, 'Unfinished tests belong to the signed-in account')

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
    assert.equal(container.querySelectorAll('[data-sat-in-process]').length, 1)
    assert.match(inProcess()!.textContent!, /Full Mock 2/)
    assert.match(inProcess()!.textContent!, new RegExp(`1 of ${newestTest.questionCount} questions answered`))
    assert.equal(inProcess()!.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow'), '1')
    await render('mocks')
    assert.match(inProcess()!.textContent!, /Full Mock 2/, 'The latest unfinished full mock survives a reload')
    await act(async () => inProcess()!.querySelector('button')!.click())
    assert.equal(container.querySelector('[data-sat-resume-target]')?.getAttribute('data-sat-resume-target'), '2', 'Continue opens the matching saved test runner')
    assert.deepEqual(loadSATAttempt(newestTest.id), newest, 'Continuing preserves the attempt, answers, notes and question position')

    await render('mocks')
    await act(async () => {
      saveSATAttempt({ ...newest, status: 'submitted', submittedAt: Date.now() })
      await new Promise(resolve => setTimeout(resolve, 80))
    })
    assert.match(inProcess()!.textContent!, /Full Mock 1/, 'Finishing a mock reveals the remaining unfinished mock')
    await act(async () => {
      clearSATAttempt(full.id)
      await new Promise(resolve => setTimeout(resolve, 80))
    })
    assert.equal(inProcess(), null, 'There is no banner when no unfinished full mocks remain')
    console.log('SAT catalog: completion, latest unfinished mock, resume preservation, live updates, reloads, section and account isolation passed.')
  } finally {
    if (root) await act(async () => root!.unmount())
  }
}
