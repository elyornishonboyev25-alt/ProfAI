import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import assert from 'node:assert/strict'
import SATQuestionBankRun from '../../src/pages/SATQuestionBankRun'
import SATQuestionCanvas from '../../src/components/sat/SATQuestionCanvas'
import { allQuestions, loadBankSession, readHistory, saveBankSession } from '../../src/features/sat/bankPractice'
import { createSATAttempt } from '../../src/features/sat/practiceTest4'
import { loadSATAttempt, loadSATAttemptHistory, saveSATAttempt, saveSATAttemptToHistory } from '../../src/features/sat/attemptStorage'
import { getSATSectionTest } from '../../src/features/sat/catalog'

const container = document.getElementById('root')!
let root: ReturnType<typeof createRoot>
async function render(element: React.ReactNode) {
  if (root) await act(async () => root.unmount())
  root = createRoot(container)
  await act(async () => root.render(element))
}
async function click(label: string) {
  const button = container.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`)
  assert.ok(button, `Missing ${label}`)
  await act(async () => button.click())
}
const bank = () => <MemoryRouter initialEntries={['/sat/question-bank/run/eliminator-test']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
  <Routes><Route path="/sat/question-bank/run/:setId" element={<SATQuestionBankRun />} /><Route path="/sat/question-bank" element={<p>Saved results</p>} /></Routes>
</MemoryRouter>
export async function run() {
  localStorage.clear()
  const rows = allQuestions.filter(row => row.question.kind === 'multiple-choice').slice(0, 2)
  const first = rows[0]
  const choice = first.question.choices[0].key
  saveBankSession('guest', { id: 'eliminator-test', keys: rows.map(row => row.key), index: 0,
    answers: { [first.key]: choice }, flagged: [], highlights: {}, createdAt: new Date().toISOString() })
  await render(bank())
  assert.equal(container.querySelector('[aria-label="Answer eliminator"]')?.getAttribute('aria-pressed'), 'false')
  await click('Answer eliminator')
  await click(`Eliminate choice ${choice}`)
  assert.equal(loadBankSession('guest')!.answers[first.key], '', 'Eliminating the selected answer clears the response')
  assert.deepEqual(loadBankSession('guest')!.eliminatedChoices?.[first.key], [choice])
  assert.equal(container.querySelector<HTMLButtonElement>('[role="radio"]')!.disabled, true)
  await click('Answer eliminator')
  assert.ok(container.querySelector(`[aria-label="Restore choice ${choice}"]`), 'Undo remains available when tool closes')
  await render(bank())
  assert.equal(container.querySelector<HTMLButtonElement>('[role="radio"]')!.disabled, true, 'Crossed out choice survives reload')
  await click(`Restore choice ${choice}`)
  assert.equal(container.querySelector<HTMLButtonElement>('[role="radio"]')!.disabled, false)
  await click('Answer eliminator')
  await click(`Eliminate choice ${choice}`)
  const next = [...container.querySelectorAll('button')].find(node => node.textContent?.trim() === 'Next')!
  await act(async () => next.click())
  assert.equal(container.querySelector('[aria-label="Answer eliminator"]')?.getAttribute('aria-pressed'), 'false')
  assert.ok(!container.querySelector(`[aria-label="Restore choice ${choice}"]`), 'Eliminations do not leak to the next question')
  const finish = [...container.querySelectorAll('button')].find(node => node.textContent?.trim() === 'Finish set')!
  await act(async () => finish.click())
  const result = readHistory('guest').find(row => row.key === first.key)!
  assert.deepEqual(result.eliminatedChoices, [choice], 'Finished history retains eliminated choices')
  assert.equal(loadBankSession('guest'), null)
  await render(<SATQuestionCanvas question={first.question} answer="" onAnswer={() => {}} strokes={[]} onChange={() => {}}
    flagged={false} onToggleFlag={() => {}} readOnly eliminatedChoices={result.eliminatedChoices} />)
  assert.ok(!container.querySelector('[aria-label="Answer eliminator"]'), 'Review cannot edit eliminations')
  assert.ok(container.querySelector('[role="radio"]')?.className.includes('opacity-50'))
  const gridIn = allQuestions.find(row => row.question.kind === 'student-response')!.question
  await render(<SATQuestionCanvas question={gridIn} answer="" onAnswer={() => {}} strokes={[]} onChange={() => {}}
    flagged={false} onToggleFlag={() => {}} onEliminatedChoicesChange={() => {}} />)
  assert.ok(!container.querySelector('[aria-label="Answer eliminator"]'), 'Grid-in questions have no eliminator')
  const test = getSATSectionTest('1', null)
  const attempt = createSATAttempt(test.id, test.modules, 'practice')
  attempt.eliminatedChoices = { [test.modules[0].questions[0].id]: ['A'] }
  saveSATAttempt(attempt)
  assert.deepEqual(loadSATAttempt(test.id)?.eliminatedChoices, attempt.eliminatedChoices)
  saveSATAttemptToHistory(attempt, 'exit')
  assert.deepEqual(loadSATAttemptHistory()[0].attempt.eliminatedChoices, attempt.eliminatedChoices)
  await act(async () => root.unmount())
  console.log('SAT answer eliminator: interaction, reload, question isolation, review and mock history passed.')
}
