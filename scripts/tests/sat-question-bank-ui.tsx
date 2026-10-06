import React, { act, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import assert from 'node:assert/strict'
import SATQuestionBank from '../../src/pages/SATQuestionBank'
import { SAT_TEST_CATALOG } from '../../src/features/sat/catalog'
import { useAuthStore } from '../../src/store/authStore'

const container = document.getElementById('root')!
let root: ReturnType<typeof createRoot>
const text = () => container.textContent!
function Location() {
  const location = useLocation()
  const navigate = useNavigate()
  return (
    <>
      <output data-location>
        {location.pathname}
        {location.search}
      </output>
      <button data-router-back onClick={() => navigate(-1)}>
        Browser back
      </button>
    </>
  )
}
async function render(path = '/sat/question-bank') {
  if (root) await act(async () => root.unmount())
  root = createRoot(container)
  await act(async () =>
    root.render(
      <StrictMode>
        <MemoryRouter
          initialEntries={[path]}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <Location />
          <SATQuestionBank />
        </MemoryRouter>
      </StrictMode>,
    ),
  )
}
const button = (label: string) =>
  [...container.querySelectorAll('button')].find(
    (node) => node.textContent?.trim() === label,
  )
async function click(node: HTMLElement | null | undefined) {
  assert.ok(
    node,
    `Expected interactive element. Buttons: ${[...container.querySelectorAll('button')].map((node) => node.textContent).join(' | ')}`,
  )
  await act(async () => node.click())
}
async function change(label: string, value: string) {
  const node = [...container.querySelectorAll('label')]
    .find((node) => node.firstChild?.textContent === label)
    ?.querySelector('select')
  assert.ok(node, `Expected ${label} select`)
  await act(async () => {
    node.value = value
    node.dispatchEvent(new Event('change', { bubbles: true }))
  })
}
const path = () => container.querySelector('[data-location]')!.textContent!
export async function run() {
  localStorage.clear()
  useAuthStore.setState({ user: null })
  const key = 'profai:sat:question-bank:guest:v1'
  await render()
  await click(
    [...container.querySelectorAll('button')].find((node) =>
      node.textContent?.trim().startsWith('History & review'),
    ),
  )
  assert.match(text(), /Your next result starts here/)
  await click(button('Build a question set'))
  await change('Questions in set', '4')
  await click(button('Start 4 questions'))
  const questions = SAT_TEST_CATALOG[1].modules[0].questions.slice(0, 4)
  await click(
    container.querySelector(
      `button[role="radio"]:nth-child(${questions[0].correctAnswer.charCodeAt(0) - 64})`,
    ),
  )
  await click(button('Mark for Review'))
  assert.ok(button('Marked for Review'))
  await click(button('Next'))
  const wrong = questions[1].choices.find(
    (choice) => choice.key !== questions[1].correctAnswer,
  )!.key
  await click(
    [...container.querySelectorAll<HTMLButtonElement>('[role="radio"]')].find(
      (node) => node.textContent?.trim().startsWith(wrong),
    ),
  )
  await click(button('Previous'))
  assert.ok(button('Marked for Review'))
  assert.equal(
    container
      .querySelector('[role="radio"][aria-checked="true"]')
      ?.textContent?.trim()[0],
    questions[0].correctAnswer,
  )
  await click(button('Next'))
  await click(button('Next'))
  await click(button('Next'))
  // Saving failures must preserve the session rather than claiming success.
  const originalSetItem = window.Storage.prototype.setItem
  window.Storage.prototype.setItem = () => {
    throw new Error('quota')
  }
  await click(button('Finish set'))
  assert.match(
    container.querySelector('[role="alert"]')!.textContent!,
    /could not be saved/,
  )
  assert.ok(button('Finish set'))
  window.Storage.prototype.setItem = originalSetItem
  await click(button('Finish set'))
  assert.match(text(), /1 of 4 correct/)
  assert.match(text(), /Question 1/)
  assert.match(text(), /Explanation/)
  assert.equal(container.querySelectorAll('[role="radio"]:disabled').length, 4)
  const saved = JSON.parse(localStorage.getItem(key)!)
  assert.equal(saved.length, 4)
  assert.equal(saved[0].answer, questions[0].correctAnswer)
  assert.equal(saved[1].answer, wrong)
  assert.equal(saved[2].answer, '')
  const reviewPath = path()
  await render(reviewPath)
  assert.match(text(), /1 of 4 correct/)
  assert.match(text(), /Explanation/)
  const beforeReview = localStorage.getItem(key)
  await click(
    [...container.querySelectorAll('button')].find((node) =>
      node.textContent?.trim().startsWith('Incorrect '),
    ),
  )
  assert.equal(container.querySelectorAll('.sat-bank-number').length, 1)
  assert.match(
    container.querySelector('.sat-bank-answer-summary')!.textContent!,
    new RegExp(`Your answer${wrong}`),
  )
  await click(
    [...container.querySelectorAll('button')].find((node) =>
      node.textContent?.trim().startsWith('Skipped '),
    ),
  )
  assert.equal(container.querySelectorAll('.sat-bank-number').length, 2)
  assert.match(text(), /Your answerSkipped/)
  await click(button('Next'))
  assert.match(
    container.querySelector('.sat-bank-detail-title')!.textContent!,
    /Question 4/,
  )
  await click(button('All saved sets'))
  assert.equal(container.querySelectorAll('.sat-bank-history-card').length, 1)
  await click(container.querySelector('.sat-bank-history-card'))
  await click(container.querySelector('[data-router-back]'))
  assert.equal(container.querySelectorAll('.sat-bank-history-card').length, 1)
  assert.equal(
    localStorage.getItem(key),
    beforeReview,
    'Review must never overwrite saved answers',
  )

  // Legacy records retain review access without inventing the missing answer.
  const legacy = { ...saved[1], at: '2026-08-01T12:00:00.000Z' }
  delete legacy.answer
  delete legacy.setId
  localStorage.setItem(key, JSON.stringify([...saved, legacy]))
  await render('/sat/question-bank?view=history')
  assert.equal(container.querySelectorAll('.sat-bank-history-card').length, 2)
  await click(
    container.querySelectorAll<HTMLButtonElement>('.sat-bank-history-card')[1],
  )
  assert.match(text(), /Not recorded in older results/)
  assert.match(text(), /Explanation/)
  await click(
    [...container.querySelectorAll('button')].find((node) =>
      node.textContent?.trim().startsWith('Correct '),
    ),
  )
  assert.match(text(), /No correct questions in this set/)
  await render('/sat/question-bank?review=deleted')
  assert.match(text(), /This saved set is unavailable/)
  assert.equal(container.querySelectorAll('.sat-bank-history-card').length, 2)
  // Malformed local entries do not crash the workspace.
  localStorage.setItem(key, JSON.stringify([null, { key: 1 }, saved[0]]))
  await render('/sat/question-bank?view=history')
  assert.equal(container.querySelectorAll('.sat-bank-history-card').length, 1)
  // A different account cannot see the previous account's practice history.
  await act(async () =>
    useAuthStore.setState({ user: { id: 'another-user' } as never }),
  )
  assert.equal(container.querySelectorAll('.sat-bank-history-card').length, 0)
  assert.match(text(), /Your next result starts here/)
  await act(async () => root.unmount())
  console.log(
    'SAT question bank: saved answers, failed-save recovery, full review, filters, refresh, browser back, legacy results and account isolation passed.',
  )
}
