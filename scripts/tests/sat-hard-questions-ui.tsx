import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import assert from 'node:assert/strict'
import SATHardQuestions from '../../src/pages/SATHardQuestions'
import SATSection from '../../src/pages/SATSection'
import { HARD_QUESTIONS, loadHardProgress, selectHardQuestions } from '../../src/features/sat/hardQuestions'
import { allQuestions } from '../../src/features/sat/bankPractice'
import { isSATAnswerCorrect } from '../../src/features/sat/practiceTest4'
import { useAuthStore } from '../../src/store/authStore'

let root: ReturnType<typeof createRoot> | undefined
const container = document.getElementById('root')!
const text = () => container.textContent ?? ''
async function render(path = '/sat/hard-questions') {
  if (root) await act(async () => root!.unmount())
  root = createRoot(container)
  await act(async () => root!.render(<MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Routes><Route path="/sat/hard-questions" element={<SATHardQuestions />} /><Route path="/sat/:section" element={<SATSection />} /></Routes></MemoryRouter>))
}
async function click(node: Element | null | undefined) {
  assert.ok(node, 'Expected clickable element')
  await act(async () => (node as HTMLElement).click())
}
const byText = (label: string) => [...container.querySelectorAll('button')].find(button => button.textContent?.trim() === label)
const pathFor = (section: string, key: string) => `/sat/hard-questions?section=${section}&q=${encodeURIComponent(key)}`
export async function run() {
  localStorage.clear()
  useAuthStore.setState({ user: null })
  for (const section of ['math', 'reading-writing'] as const) {
    const rows = HARD_QUESTIONS[section]
    assert.equal(rows.length, 100)
    assert.equal(new Set(rows.map(row => row.key)).size, 100)
    assert.deepEqual(rows.map(row => row.key), selectHardQuestions(section).map(row => row.key))
    const eligible = allQuestions.filter(row => row.testNumber >= 10 && row.question.section === section && row.question.difficulty === 'Advanced' && row.question.sourceContent?.explanation.trim())
    assert.deepEqual(new Set(rows.map(row => row.question.skill)), new Set(eligible.map(row => row.question.skill)), 'Every source skill must be represented')
    for (const row of rows) {
      assert.equal(row.question.section, section)
      assert.equal(row.question.difficulty, 'Advanced')
      assert.ok(row.question.sourceContent?.task.trim())
      assert.ok(row.question.sourceContent?.explanation.trim())
      assert.ok(isSATAnswerCorrect(row.question, row.question.correctAnswer))
      if (row.question.kind === 'multiple-choice') assert.equal(row.question.choices.filter(choice => choice.key === row.question.correctAnswer).length, 1)
    }
  }
  await render('/sat/mocks')
  assert.deepEqual([...container.querySelectorAll('[role=tab] strong')].map(node => node.textContent), ['Full Mocks', 'Reading & Writing', 'Math', 'Hard Questions'])
  await click(container.querySelector('#sat-tab-hard-questions'))
  assert.equal(container.querySelectorAll('.hard-tile').length, 100)
  assert.ok(text().includes('English challenge map'))
  assert.equal(container.querySelectorAll('.hard-topic').length, 10)
  const row = HARD_QUESTIONS['reading-writing'][0]
  await click(container.querySelector('.hard-tile'))
  assert.ok(!container.querySelector('.hard-feedback'))
  const wrong = row.question.choices.find(choice => choice.key !== row.question.correctAnswer)!
  await click([...container.querySelectorAll('.hard-choice')].find(button => button.querySelector('.hard-choice-key')?.textContent === wrong.key))
  assert.ok(container.querySelector('.hard-feedback.incorrect'))
  assert.ok(container.querySelector('.hard-choice.correct'))
  assert.ok(container.querySelector('.hard-explanation .sat-source-content')?.textContent?.trim())
  assert.ok([...container.querySelectorAll<HTMLButtonElement>('.hard-choice')].every(button => button.disabled))
  assert.equal(loadHardProgress('guest')[row.key].answer, wrong.key)
  await render(pathFor('reading-writing', row.key))
  assert.ok(container.querySelector('.hard-feedback.incorrect'), 'Reload preserves checked answer and explanation')
  await click(container.querySelector('[aria-label="Bookmark question"]'))
  await click(byText('All topics'))
  await click(byText('Bookmarked'))
  assert.equal(container.querySelectorAll('.hard-tile').length, 1)
  await click(container.querySelector('.hard-tile'))
  await click(byText('Try this question again'))
  assert.ok(!container.querySelector('.hard-feedback'))
  await click([...container.querySelectorAll('.hard-choice')].find(button => button.querySelector('.hard-choice-key')?.textContent === row.question.correctAnswer))
  assert.ok(container.querySelector('.hard-feedback.correct'))
  await click([...container.querySelectorAll('.hard-subject')].find(button => button.querySelector('strong')?.textContent === 'Math'))
  assert.equal(container.querySelectorAll('.hard-tile').length, 100)
  assert.equal(container.querySelectorAll('.hard-topic').length, 19)
  assert.ok(!container.querySelector('.hard-feedback'), 'Subject switch clears active question')
  const numeric = HARD_QUESTIONS.math.find(row => row.question.kind === 'student-response')!
  await render(pathFor('math', numeric.key))
  assert.ok(container.querySelector<HTMLButtonElement>('button[type=submit]')?.disabled)
  const input = container.querySelector<HTMLInputElement>('#hard-answer')!
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
    setter.call(input, numeric.question.correctAnswer)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  assert.ok(!container.querySelector('.hard-feedback'), 'Typing does not grade a partial numeric answer')
  await click(container.querySelector('button[type=submit]'))
  assert.ok(container.querySelector('.hard-feedback.correct'))
  await render(pathFor('math', numeric.key))
  assert.ok(container.querySelector('.hard-feedback.correct'))
  assert.ok(text().includes(numeric.question.correctAnswer))
  // Explicit account storage ownership isolates learner progress.
  assert.deepEqual(loadHardProgress('different-learner'), {})
  // Corrupt saved progress must not crash the workspace.
  await render('/sat/hard-questions?section=math&q=missing')
  assert.equal(container.querySelectorAll('.hard-tile').length, 100)
  await act(async () => root!.unmount())
  console.log('Hard questions: 200 unique Advanced questions, all 29 skills, ordered navigation, instant grading, explanations, retries, bookmarking, numeric submission, reload and account isolation passed.')
}
