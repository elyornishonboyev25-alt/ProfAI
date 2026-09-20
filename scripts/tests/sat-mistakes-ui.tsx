import React, { act, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, useLocation } from 'react-router-dom'
import assert from 'node:assert/strict'
import SATMistakes from '../../src/pages/SATMistakes'
import SATReview from '../../src/components/sat/SATReview'
import { SAT_TEST_CATALOG, getSATSectionTest } from '../../src/features/sat/catalog'
import { createSATAttempt } from '../../src/features/sat/practiceTest4'
import { loadSATAttemptHistory, saveSATAttempt, saveSATAttemptToHistory } from '../../src/features/sat/attemptStorage'
import { useBadgeStore } from '../../src/store/badgeStore'

const container = document.getElementById('root')!
let root: ReturnType<typeof createRoot>
function Location() {
  const location = useLocation()
  return <output data-location>{location.pathname}{location.search}</output>
}
async function render(path = '/sat/mistakes', content = <SATMistakes />) {
  if (root) await act(async () => root.unmount())
  root = createRoot(container)
  await act(async () => root.render(
    <StrictMode><MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Location />{content}
    </MemoryRouter></StrictMode>,
  ))
}
const button = (text: string) => [...container.querySelectorAll('button')].find((node) => node.textContent?.trim() === text)
async function click(node: HTMLElement | null | undefined) {
  assert.ok(node, 'Expected an interactive element')
  await act(async () => node.click())
}
const text = () => container.textContent!
const rows = () => [...container.querySelectorAll<HTMLButtonElement>('button[aria-label^="Review "]')]

export async function run() {
  localStorage.clear()
  let badgeCalls = 0
  useBadgeStore.setState({ awardIfEligible: () => { badgeCalls++; return { celebrated: false, tier: null } } })
  const test = SAT_TEST_CATALOG[8]
  const questions = test.modules.flatMap((module) => module.questions)
  assert.equal(questions.length, 98)
  const old = { ...createSATAttempt(test.id, test.modules, 'exam'), attemptId: 'older-result', status: 'submitted' as const, submittedAt: 1000 }
  old.answers = { [questions[0].id]: questions[0].correctAnswer, [questions[1].id]: 'wrong' }
  old.flagged = [questions[1].id]
  old.notes = { [questions[1].id]: 'Saved note from the older attempt' }
  saveSATAttemptToHistory(old, 'submitted')
  const newer = { ...old, attemptId: 'newer-result', submittedAt: 2000, answers: Object.fromEntries(questions.map((q) => [q.id, q.correctAnswer])) }
  saveSATAttempt(newer)
  const currentRaw = localStorage.getItem(`profai:sat:${test.id}:attempt:v1`)

  await render()
  assert.equal(rows().length, 2)
  assert.match(rows()[1].textContent!, /Correct answers1\/98/)
  assert.match(rows()[1].textContent!, /1 incorrect · 96 unanswered/)
  assert.match(text(), /Mistakes to review97/)
  await click(rows()[1])
  assert.match(text(), /Question navigator/)
  assert.match(text(), /Correct1\/98/)
  assert.match(text(), /Saved note from the older attempt/)
  assert.match(container.querySelector('[data-location]')!.textContent!, /attempt=older-result/)
  assert.ok(!button('Start fresh'))
  assert.equal(localStorage.getItem(`profai:sat:${test.id}:attempt:v1`), currentRaw)
  const reviewPath = container.querySelector('[data-location]')!.textContent!
  await render(reviewPath)
  assert.match(text(), /Correct1\/98/)
  await click(button('correct'))
  assert.equal(container.querySelectorAll('aside button[class*="w-full"]').length, 1)
  await click(container.querySelector('aside button[class*="w-full"]'))
  assert.match(container.querySelector('article')!.textContent!, /Question 1Correct/)
  await click(button('incorrect'))
  assert.equal(container.querySelectorAll('aside button[class*="w-full"]').length, 1)
  await click(button('unanswered'))
  assert.equal(container.querySelectorAll('aside button[class*="w-full"]').length, 96)
  await click(button('Back to SAT Mistake Lab'))
  assert.equal(rows().length, 2)
  await click(rows()[0])
  assert.match(text(), /Correct98\/98/)
  assert.equal(badgeCalls, 0, 'Reviewing history must not award badges or write to the profile')
  await click(button('Back to SAT Mistake Lab'))

  let confirmCalls = 0
  window.confirm = () => { confirmCalls++; return true }
  await click(container.querySelector('button[aria-label^="Delete "]'))
  assert.equal(confirmCalls, 1)
  assert.equal(rows().length, 1)
  assert.doesNotMatch(text(), /Question navigator/)
  assert.equal(loadSATAttemptHistory()[0].id, old.attemptId)

  const incomplete = { ...newer, attemptId: 'unfinished', status: 'active' as const, submittedAt: undefined }
  saveSATAttemptToHistory(incomplete, 'exit')
  await render('/sat/mistakes?attempt=unfinished')
  assert.match(text(), /Saved incomplete/)
  assert.match(text(), /saved before submission/)
  assert.doesNotMatch(text(), /Estimated score range/)
  assert.equal(badgeCalls, 0)

  const section = getSATSectionTest(8, 'math')
  const sectionAttempt = { ...old, attemptId: 'math-section', testId: section.id, submittedAt: 3000 }
  const mathQuestions = section.modules.flatMap((module) => module.questions)
  sectionAttempt.answers = Object.fromEntries(mathQuestions.slice(0, 20).map((q) => [q.id, q.correctAnswer]))
  saveSATAttemptToHistory(sectionAttempt, 'submitted')
  await render()
  const sectionRow = rows().find((row) => row.textContent!.includes('· Math'))!
  const range = sectionRow.textContent!.match(/Estimated score(\d+–\d+)/)![1]
  await click(sectionRow)
  assert.match(text(), /Correct20\/44/)
  assert.ok(text().includes(`Estimated Math range${range}`))

  await render('/sat/mistakes?attempt=deleted')
  assert.match(container.querySelector('[role="status"]')!.textContent!, /no longer available/)
  assert.ok(rows().length)

  // The existing end-of-test screen retains its restart action and badge behavior.
  let restarted = false
  await render('/mock/sat/8/run', <SATReview attempt={newer} test={test} onStartAgain={() => { restarted = true }} />)
  assert.ok(badgeCalls > 0)
  await click(button('Start fresh'))
  assert.ok(restarted)
  await act(async () => root.unmount())
  console.log('SAT mistake lab UI: historical answers, counts, filters, refresh, deletion, incomplete and section reviews passed.')
}
