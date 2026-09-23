import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import assert from 'node:assert/strict'
import { statSync } from 'node:fs'
import IELTSReadingInterface from '../../src/components/IELTSReadingInterface'
import { listeningFullTest14 as test } from '../../src/data/listeningFullTest14'
import { getIeltsFullTestCatalog, isAvailableIeltsTrackTest } from '../../src/utils/ieltsTrackCatalog'
import { evaluateReadingAnswers } from '../../src/utils/ieltsUtils'
import type { TestResult } from '../../src/types/ieltsTypes'

// Independently verified against the user's timed 57262 transcript; Q29 corrects the public key.
const key = [
  'money', '168', 'maths', 'language', 'swim', 'illness', 'cultures', 'Eurontas', 'team', 'uniform',
  'D', 'E', 'C', 'D', 'B', 'B', 'A', 'C', 'C', 'A',
  'F', 'G', 'B', 'H', 'E', 'C', 'B', 'A', 'B', 'A',
  'engineering', 'printed', 'global market', 'documentation', 'traditional', 'tutorials', 'reflective', 'business plan', 'journalism', 'interview',
]
const perfect = Object.fromEntries(key.map((answer, index) => [`lt14-q${index + 1}`, answer]))
const container = document.getElementById('root')!
const delay = (ms: number) => act(async () => { await new Promise(resolve => setTimeout(resolve, ms)) })

async function part(number: number) {
  const tab = [...container.querySelectorAll('span')].find(element => element.textContent === `Part ${number}`)
  assert.ok(tab)
  await act(async () => tab.click())
}
async function click(label: string) {
  const button = [...container.querySelectorAll('button')].find(element => element.textContent?.trim() === label)
  assert.ok(button, label)
  await act(async () => button.click())
}

export async function run() {
  const entry = getIeltsFullTestCatalog('listening')[13]
  assert.equal(entry.testId, test.id)
  assert.ok(isAvailableIeltsTrackTest('listening', test.id))
  assert.ok(!isAvailableIeltsTrackTest('listening', getIeltsFullTestCatalog('listening')[16].testId))
  assert.ok(statSync(`public${test.continuousAudioUrl}`).size > 10_000_000)
  assert.deepEqual(test.sections.flatMap(section => section.questions.map(q => q.number)), Array.from({ length: 40 }, (_, i) => i + 1))
  const full = evaluateReadingAnswers(test.sections, perfect)
  assert.equal(full.summary.correctAnswers, 40)
  assert.deepEqual(full.sectionSummaries.map(section => section.correctAnswers), [10, 10, 10, 10])
  assert.equal(evaluateReadingAnswers(test.sections, {}).summary.skippedAnswers, 40)
  // Reject wrong options and words supplied where the task requires letters.
  for (const [number, wrong] of [[2, '169'], [8, 'Euromtas'], [12, 'A'], [17, 'B'], [21, 'old air is removed'], [24, 'I'], [29, 'A'], [30, 'C']] as const) {
    assert.equal(evaluateReadingAnswers(test.sections, { ...perfect, [`lt14-q${number}`]: wrong }).summary.correctAnswers, 39)
  }
  assert.equal(evaluateReadingAnswers(test.sections, { ...perfect, 'lt14-q3': 'math', 'lt14-q8': 'EURONTAS', 'lt14-q16': 'b' }).summary.correctAnswers, 40)
  for (const pair of [[11, 12], [13, 14]]) {
    const [a, b] = pair
    assert.equal(evaluateReadingAnswers(test.sections, { ...perfect, [`lt14-q${a}`]: key[b - 1], [`lt14-q${b}`]: key[a - 1] }).summary.correctAnswers, 40)
    assert.equal(evaluateReadingAnswers(test.sections, { ...perfect, [`lt14-q${b}`]: key[a - 1] }).summary.correctAnswers, 39)
  }
  assert.ok(test.sections.every(section => section.questions.every(q => q.explanation && q.location)))
  console.log('PASS: catalog, supplied answer key, 40/40 grading, all four analysis sections, distractor rejection')

  localStorage.clear()
  let submitted: TestResult | undefined
  let root = createRoot(container)
  await act(async () => root.render(<IELTSReadingInterface test={test} launchPreset={{ mode: 'practice' }} onComplete={result => { submitted = result }} onExit={() => {}} />))
  await delay(2400)
  assert.equal(container.querySelector('audio')?.getAttribute('src'), test.continuousAudioUrl)
  assert.match(container.textContent!, /0\/40 answered/)
  for (let n = 1; n <= 4; n++) {
    if (n > 1) await part(n)
    if (n === 3) {
      const diagram = container.querySelector('svg[data-education-house]')
      assert.equal(diagram?.getAttribute('viewBox'), '0 0 860 680')
      assert.equal(container.querySelectorAll('figure img, figure image').length, 0)
      assert.equal(container.querySelectorAll('[data-diagram-answer] input').length, 6)
      for (let number = 21; number <= 26; number++) {
        assert.equal(container.querySelectorAll(`#question-card-lt14-q${number}`).length, 1)
      }
      const flag = container.querySelector('[aria-label="Flag question 21"]') as HTMLButtonElement
      await act(async () => flag.click())
      assert.equal(flag.getAttribute('aria-pressed'), 'true')
      assert.equal(container.querySelectorAll('li').length, 9)
    }
    for (const question of test.sections[n - 1].questions) {
      if ([11, 12, 13, 14].includes(question.number)) {
        if (question.number === 12 || question.number === 14) continue
        const choices = [...container.querySelectorAll(`#question-card-${question.id} button`)].filter(element => element.textContent?.trim())
        assert.equal(choices.length, 5)
        // Select in reverse order: the answer pair must be order-independent.
        for (const number of [question.number + 1, question.number]) await act(async () => (choices[key[number - 1].charCodeAt(0) - 65] as HTMLButtonElement).click())
        continue
      }
      if (question.type === 'multiple-choice') {
        const choices = [...container.querySelectorAll(`#question-card-${question.id} button`)].filter(element => element.textContent?.trim())
        assert.equal(choices.length, 3)
        await act(async () => (choices[key[question.number - 1].charCodeAt(0) - 65] as HTMLButtonElement).click())
      } else {
        const input = container.querySelector(`input[placeholder="${question.number}"]`)
        assert.ok(input)
        await act(async () => {
          Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!.call(input, key[question.number - 1])
          input.dispatchEvent(new window.Event('input', { bubbles: true }))
        })
      }
    }
  }
  const saved = JSON.parse(localStorage.getItem(`ielts_test_session_${test.id}`)!).answers
  assert.equal(evaluateReadingAnswers(test.sections, saved).summary.correctAnswers, 40)
  assert.match(container.textContent!, /40\/40 answered/)
  await click('Submit')
  await click('Submit test')
  await click('Check score')
  await delay(3200)
  assert.ok(submitted)
  assert.equal(submitted.correctAnswers, 40)
  assert.equal(submitted.score, 9)
  assert.equal(submitted.detailedBreakdown?.readingAnalysis?.sectionSummaries.length, 4)
  await act(async () => root.unmount())
  root = createRoot(container)
  // Analyze can reopen a test snapshot saved before the diagram was embedded.
  const oldSnapshot = JSON.parse(JSON.stringify(test)) as typeof test
  for (const group of oldSnapshot.sections[2].groups!) {
    group.blocks = group.blocks.flatMap(block => block.kind === 'diagram' ? [
      { kind: 'image' as const, src: '/images/ielts-listening-test14-education-house.jpg', alt: 'Education House' },
      { kind: 'grid' as const, columns: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'], inputMode: true, rows: [21, 22, 23, 24, 25, 26].map(blank => ({ blank, label: String(blank) })) },
    ] : [block])
  }
  await act(async () => root.render(<IELTSReadingInterface test={oldSnapshot} reviewPayload={{ result: submitted!, showCorrectAnswers: true }} onComplete={() => {}} onExit={() => {}} />))
  await part(3)
  const nativeDiagram = container.querySelector('svg[data-education-house]')
  assert.ok(nativeDiagram)
  assert.equal(container.querySelectorAll('figure img').length, 0)
  assert.equal(container.querySelectorAll('[data-diagram-answer] input:disabled').length, 6)
  await delay(1100)
  assert.equal(container.querySelector('svg[data-education-house]'), nativeDiagram)
  assert.equal((container.querySelector('input[placeholder="21"]') as HTMLInputElement).value, 'F')
  assert.ok((container.querySelector('input[placeholder="21"]') as HTMLInputElement).disabled)
  await part(4)
  assert.equal((container.querySelector('input[placeholder="40"]') as HTMLInputElement).value, 'interview')
  await act(async () => root.unmount())
  console.log('PASS: all question controls, matching option banks, saved answers, submission, band 9 and shared answer review')
}
