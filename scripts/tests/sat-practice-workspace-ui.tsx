import assert from 'node:assert/strict'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import SATHardQuestions from '@/pages/SATHardQuestions'
import { HARD_QUESTIONS, PRACTICE_QUESTIONS, loadHardProgress, practiceLevel, selectHardQuestions } from '@/features/sat/hardQuestions'
import { isSATAnswerCorrect } from '@/features/sat/practiceTest4'
import { useAuthStore } from '@/store/authStore'

export async function run() {
  localStorage.clear(); window.sessionStorage.clear()
  useAuthStore.setState({ user: { id: 'practice-workspace-owner' } as never })
  const owner = 'practice-workspace-owner'
  const element = document.getElementById('root')!
  let root = createRoot(element)
  const mount = async (path: string) => {
    await act(async () => root.unmount()); root = createRoot(element)
    await act(async () => root.render(<MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SATHardQuestions /></MemoryRouter>))
  }
  const click = async (node: Element | null | undefined) => { assert.ok(node); await act(async () => (node as HTMLElement).click()) }
  const button = (text: string) => [...document.querySelectorAll<HTMLButtonElement>('button')].find(node => node.textContent?.trim() === text)
  const pathFor = (section: string, key: string) => `/sat/hard-questions?section=${section}&q=${encodeURIComponent(key)}`
  const setInput = async (node: HTMLInputElement, value: string) => {
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(node, value)
      node.dispatchEvent(new Event('input', { bubbles: true }))
    })
  }
  try {
    for (const section of ['math', 'reading-writing'] as const) {
      const rows = PRACTICE_QUESTIONS[section]
      assert.equal(new Set(rows.map(row => row.key)).size, rows.length)
      for (const level of ['easy','medium','hard']) {
        const subset = rows.filter(row => practiceLevel(row.question.difficulty) === level)
        assert.ok(subset.length > 0 && subset.length <= 100, `${section} ${level} has real reviewed questions`)
        assert.ok(subset.every(row => row.question.sourceContent?.explanation.trim()))
      }
      assert.equal(HARD_QUESTIONS[section].length, 100, 'Original deep links retain the same hard collection')
      assert.deepEqual(HARD_QUESTIONS[section].map(row => row.key), selectHardQuestions(section).map(row => row.key))
      for (const row of rows) {
        assert.equal(row.question.section, section)
        assert.ok(row.question.sourceContent?.task.trim())
        assert.ok(isSATAnswerCorrect(row.question, row.question.correctAnswer))
        if (row.question.kind === 'multiple-choice') assert.equal(row.question.choices.filter(choice => choice.key === row.question.correctAnswer).length, 1)
      }
    }
    await mount('/sat/hard-questions?section=math&level=all')
    for (const level of ['easy','medium','hard']) assert.ok(element.querySelector(`.hard-tile.is-${level}`))
    await click(button('Jump to question Ctrl Shift F'))
    assert.ok(document.querySelector('[role=dialog]'))
    await click(document.querySelector('[aria-label="Close question search"]'))
    const row = HARD_QUESTIONS['reading-writing'][0]
    const wrong = row.question.choices.find(choice => choice.key !== row.question.correctAnswer)!
    await mount(pathFor('reading-writing', row.key))
    const choose = (letter: string) => element.querySelector<HTMLButtonElement>(`[role=radio] [data-sat-highlight-block="choice-${letter}"]`)?.closest('button')
    await click(choose(wrong.key))
    assert.equal(loadHardProgress(owner)[row.key].checked, false)
    assert.equal(element.querySelector('[role=status]'), null, 'Selecting an answer does not grade it')
    assert.equal(element.querySelector('#practice-solution'), null)
    await click(button('Check answer'))
    assert.ok(element.textContent?.includes('Incorrect answer'))
    assert.equal(element.querySelector('#practice-solution'), null, 'A wrong answer never reveals its solution')
    assert.equal(element.querySelector('[class*="border-emerald"]'), null, 'The correct choice is not revealed')
    assert.equal(loadHardProgress(owner)[row.key].attempts?.length, 1)
    await click(button('See solution'))
    assert.ok(element.querySelector('#practice-solution .sat-source-content')?.textContent?.trim())
    await mount(pathFor('reading-writing', row.key))
    assert.ok(element.textContent?.includes('Incorrect answer'), 'Reload keeps grading state')
    assert.equal(element.querySelector('#practice-solution'), null, 'Reload keeps the solution private until requested')
    await click(choose(row.question.correctAnswer))
    assert.equal(loadHardProgress(owner)[row.key].checked, false, 'A different choice starts a deliberate retry without opening the solution')
    await act(async () => window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true })))
    assert.ok(element.textContent?.includes('Correct answer'), 'Enter checks the selected choice once')
    assert.equal(loadHardProgress(owner)[row.key].attempts?.length, 2)
    assert.equal(element.querySelector('#practice-solution'), null)
    await click(button('Show history'))
    assert.equal(element.querySelectorAll('.practice-history li').length, 2)
    await click(document.querySelector('[aria-label="Bookmark question"]'))
    assert.equal(loadHardProgress(owner)[row.key].bookmarked, true)
    await click(button('Try this question again'))
    await click(element.querySelector('[aria-label="Answer eliminator"]'))
    await click(element.querySelector(`[aria-label="Eliminate choice ${wrong.key}"]`))
    assert.ok(loadHardProgress(owner)[row.key].eliminatedChoices?.includes(wrong.key))
    await mount(pathFor('reading-writing', row.key))
    assert.ok(element.querySelector(`[aria-label="Restore choice ${wrong.key}"]`), 'Eliminations survive reload')
    await click(element.querySelector('[aria-label="Pause timer"]'))
    assert.ok(element.textContent?.includes('Practice paused'))
    await click(button('Continue practicing'))
    const numeric = HARD_QUESTIONS.math.find(row => row.question.kind === 'student-response')!
    await mount(pathFor('math', numeric.key))
    assert.ok(button('Check answer')?.disabled)
    await setInput(element.querySelector<HTMLInputElement>('#student-response')!, numeric.question.correctAnswer)
    assert.equal(element.querySelector('[role=status]'), null)
    await act(async () => window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true })))
    assert.ok(element.textContent?.includes('Correct answer'))
    assert.equal(element.querySelector('#practice-solution'), null)
    await mount(pathFor('math', numeric.key))
    assert.equal(element.querySelector<HTMLInputElement>('#student-response')?.value, numeric.question.correctAnswer)
    assert.ok(element.textContent?.includes('Correct answer'))
    assert.deepEqual(loadHardProgress('another-account'), {})
    await mount('/sat/hard-questions?section=math&q=missing')
    assert.equal(element.querySelectorAll('.hard-tile').length, 100)

  } finally { await act(async () => root.unmount()) }
  console.log('PASS: SAT levels, deliberate grading, Enter, private solutions, history, elimination and reload')
}
