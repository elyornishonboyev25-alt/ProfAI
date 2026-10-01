import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import assert from 'node:assert/strict'
import IELTSReadingInterface from '../../src/components/IELTSReadingInterface'
import { readingTests, answerKey } from './reading-bank'
import { optionDisplayText } from '../../src/utils/readingPresentation'
import { saveReviewState, loadReviewState } from '../../src/utils/resultsReviewState'
import { resolveIeltsTestById } from '../../src/utils/ieltsTestCatalog'
import { buildReadingDayTest } from '../../src/utils/generatedIeltsTests'
import ResultsReview from '../../src/pages/ResultsReview'
import { evaluateReadingAnswers } from '../../src/utils/ieltsUtils'
import type { TestResult } from '../../src/types/ieltsTypes'

const container = document.getElementById('root')!
const compact = (text: string) => text.replace(/\s+/g, ' ').trim()
export async function run() {
  const seen = new Set<string>()
  let reviewed = 0
  for (const test of readingTests) for (const section of test.sections) {
    const signature = JSON.stringify([section.id, section.premiumQuestionGroups, section.questions.map(q => [q.id, q.number])])
    if (seen.has(signature)) continue
    seen.add(signature)
    const onePassage = { ...test, sections: [section] }
    const result: TestResult = { testId: test.id, date: '2026-10-01', score: 9, correctAnswers: test.totalQuestions, totalQuestions: test.totalQuestions, timeSpent: 3600, answers: answerKey(onePassage) }
    const root = createRoot(container)
    await act(async () => root.render(<IELTSReadingInterface test={onePassage} reviewPayload={{ result, showCorrectAnswers: true }} onComplete={() => { throw new Error('Review must never submit') }} onExit={() => {}} />))
    const pane = container.querySelector('#reading-questions-pane')!
    assert.ok(pane, section.id)
    for (const question of section.questions) {
      if (question.type === 'drag-drop-summary') {
        assert.ok(pane.textContent!.includes(String((result.answers[question.id] as string[])[0])), `${question.id}: saved drag answer is visible`)
        continue
      }
      const card = pane.querySelector(`[id="question-card-${question.id}"]`)
      assert.ok(card, `${test.id} ${question.id}: visible answer card`)
      if (question.type === 'summary-completion' || question.type === 'note-completion') {
        const input = card.querySelector('input')!
        assert.ok(input, `${question.id}: inline input`)
        assert.equal(card.querySelectorAll('input').length, 1, `${question.id}: one answer input`)
        assert.equal(input.value, result.answers[question.id], `${question.id}: saved answer`)
        assert.ok(input.disabled, `${question.id}: review is read-only`)
        const sentence = card.querySelector('p')!
        assert.equal(compact(sentence.textContent!), compact(question.text.replace(/_+/g, '')), `${question.id}: only its sentence, all letters intact`)
      }
      if (question.type === 'multiple-choice' || question.type === 'five-true-statements') for (const option of question.options ?? []) {
        assert.ok(pane.textContent!.includes(optionDisplayText(option, question.options)), `${question.id}: complete choice text: ${option}`)
      }
      reviewed++
    }
    const prose = container.querySelector('.ielts-reading-prose')!
    assert.ok(prose)
    const paragraphTexts = section.paragraphs?.map(p => p.content) ?? [section.content!]
    for (const paragraph of paragraphTexts) assert.ok(compact(prose.textContent!).includes(compact(paragraph)), `${section.id}: all passage text renders`)
    await act(async () => root.unmount())
  }
  console.log(`PASS: ${seen.size} passage layouts, ${reviewed} saved question cards, complete passages/options, and isolated inline answers`)

  const source = resolveIeltsTestById('ielts-reading-full-vol26')!
  for (const mode of ['practice', 'simulation'] as const) {
    localStorage.clear()
    const test = { ...source, sections: [source.sections[1]] }
    const root = createRoot(container)
    await act(async () => root.render(<IELTSReadingInterface test={test} launchPreset={{ mode }} onComplete={() => {}} onExit={() => {}} />))
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 2300)) })
    const input = container.querySelector<HTMLInputElement>('input[aria-label="Answer for question 19"]')!
    assert.ok(input && !input.disabled, `${mode}: question 19 can be answered`)
    await act(async () => {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!.call(input, 'physical health')
      input.dispatchEvent(new window.Event('input', { bubbles: true }))
    })
    const saved = JSON.parse(localStorage.getItem(`ielts_test_session_${test.id}`)!)
    assert.equal(saved.answers['rd26-q19'], 'physical health', `${mode}: input is stored against its question ID`)
    await act(async () => root.unmount())
    const result: TestResult = { testId: source.id, date: '2026-10-01', score: 1, correctAnswers: 1, totalQuestions: 40, timeSpent: 3600, answers: saved.answers }
    saveReviewState(source.id, { test: source, result })
    const review = loadReviewState(source.id)!
    const reviewRoot = createRoot(container)
    await act(async () => reviewRoot.render(<IELTSReadingInterface test={test} reviewPayload={{ result: review.result }} onComplete={() => {}} onExit={() => {}} />))
    assert.equal(container.querySelector<HTMLInputElement>('input[aria-label="Answer for question 19"]')!.value, 'physical health')
    await act(async () => reviewRoot.unmount())
    console.log(`PASS: ${mode} entry, answer persistence and saved review`)
  }
  localStorage.clear()
  const endings = buildReadingDayTest(22)
  const root = createRoot(container)
  await act(async () => root.render(<IELTSReadingInterface test={endings} launchPreset={{ mode: 'practice' }} onComplete={() => {}} onExit={() => {}} />))
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 2300)) })
  const card = container.querySelector('#question-card-day22-q12')!
  await act(async () => card.querySelector<HTMLButtonElement>('button')!.click())
  const choice = [...card.querySelectorAll('button')].find(button => button.textContent === 'C')!
  assert.ok(choice, 'space-labelled sentence endings show a compact letter choice')
  await act(async () => choice.click())
  assert.equal(JSON.parse(localStorage.getItem(`ielts_test_session_${endings.id}`)!).answers['day22-q12'], 'C', 'dropdown stores its letter, not a whole sentence')
  await act(async () => root.unmount())
  console.log('PASS: sentence-ending dropdown stores the correct option letter')

  const staleTest = structuredClone(source)
  staleTest.sections[1].questions.find(q => q.number === 19)!.text = 'OBSOLETE REPEATED SUMMARY FROM SAVED SNAPSHOT'
  const result: TestResult = {
    testId: source.id, date: '2026-10-01', score: 9, correctAnswers: 40, totalQuestions: 40, timeSpent: 3600,
    answers: answerKey(source), detailedBreakdown: { readingAnalysis: evaluateReadingAnswers(staleTest.sections, answerKey(source)) },
  }
  saveReviewState(source.id, { test: staleTest, result })
  const reviewRoot = createRoot(container)
  await act(async () => reviewRoot.render(<MemoryRouter initialEntries={[`/review/${source.id}`]}><Routes><Route path="/review/:testId" element={<ResultsReview />} /></Routes></MemoryRouter>))
  assert.ok(!container.textContent!.includes('OBSOLETE REPEATED SUMMARY'), 'saved test snapshots and old analysis prompts use corrected catalog text')
  assert.ok(compact(container.textContent!).includes(compact(source.sections[1].questions.find(q => q.number === 19)!.text)), 'saved review renders the individual question sentence')
  await act(async () => reviewRoot.unmount())
  console.log('PASS: ResultsReview refreshes stale stored prompts while retaining answers')
}
