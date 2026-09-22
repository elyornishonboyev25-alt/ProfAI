import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import assert from 'node:assert/strict'
import { statSync } from 'node:fs'
import IELTSReadingInterface from '../../src/components/IELTSReadingInterface'
import { listeningFullTest12 as test } from '../../src/data/listeningFullTest12'
import { getIeltsFullTestCatalog, isAvailableIeltsTrackTest } from '../../src/utils/ieltsTrackCatalog'
import { evaluateReadingAnswers } from '../../src/utils/ieltsUtils'
import type { TestResult } from '../../src/types/ieltsTypes'

// Independently checked against the user's 56658_eng.pdf, pages 2–12.
const key = [
  'age', '21.50', '2', 'parking', 'Argentina', 'singing', 'piano', '1922', 'comedy', 'talk',
  'A', 'A', 'B', 'A', 'B', 'F', 'A', 'D', 'B', 'C',
  'B', 'C', 'C', 'A', 'B', 'G', 'B', 'D', 'H', 'C',
  'typing', 'desks', 'screens', 'share', 'privacy', 'security', 'health', 'energy', 'training', 'noise',
]
const perfect = Object.fromEntries(key.map((answer, index) => [`lt12-q${index + 1}`, answer]))
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
  const entry = getIeltsFullTestCatalog('listening')[11]
  assert.equal(entry.testId, test.id)
  assert.ok(isAvailableIeltsTrackTest('listening', test.id))
  assert.ok(!isAvailableIeltsTrackTest('listening', getIeltsFullTestCatalog('listening')[14].testId))
  assert.ok(statSync(`public${test.continuousAudioUrl}`).size > 10_000_000)
  assert.deepEqual(test.sections.flatMap(section => section.questions.map(q => q.number)), Array.from({ length: 40 }, (_, i) => i + 1))
  const full = evaluateReadingAnswers(test.sections, perfect)
  assert.equal(full.summary.correctAnswers, 40)
  assert.deepEqual(full.sectionSummaries.map(section => section.correctAnswers), [10, 10, 10, 10])
  assert.equal(evaluateReadingAnswers(test.sections, {}).summary.skippedAnswers, 40)
  // Reject the incorrect online answer and the transcript's explicit distractors.
  for (const [number, wrong] of [[2, '24'], [6, 'dance'], [8, '1923'], [12, 'B'], [17, 'E'], [21, 'A'], [23, 'B'], [29, 'E']] as const) {
    assert.equal(evaluateReadingAnswers(test.sections, { ...perfect, [`lt12-q${number}`]: wrong }).summary.correctAnswers, 39)
  }
  assert.equal(evaluateReadingAnswers(test.sections, { ...perfect, 'lt12-q3': 'two', 'lt12-q5': 'ARGENTINA', 'lt12-q16': 'f' }).summary.correctAnswers, 40)
  assert.ok(test.sections.every(section => section.questions.every(q => q.explanation && q.location)))
  console.log('PASS: catalog, PDF answer key, 40/40 grading, all four analysis sections, distractor rejection')

  localStorage.clear()
  let submitted: TestResult | undefined
  let root = createRoot(container)
  await act(async () => root.render(<IELTSReadingInterface test={test} launchPreset={{ mode: 'practice' }} onComplete={result => { submitted = result }} onExit={() => {}} />))
  await delay(2400)
  assert.equal(container.querySelector('audio')?.getAttribute('src'), test.continuousAudioUrl)
  assert.match(container.textContent!, /0\/40 answered/)
  for (let n = 1; n <= 4; n++) {
    if (n > 1) await part(n)
    if (n === 2 || n === 3) {
      const words = n === 2 ? ['cook', 'gardener', 'construction worker', 'tour guide', 'farm labourer', 'Editor', 'swimming pool cleaner'] : ['use of own memories', 'full use of the stage', 'relaxation techniques', 'physical expression of character', 'play readings', 'acting without preparation', 'using a range of accents', 'following instructions']
      const options = [...container.querySelectorAll('li')].map(element => element.textContent)
      words.forEach((word, index) => assert.ok(options.includes(`${String.fromCharCode(65 + index)}${word}`), `Visible matching option: ${word}`))
    }
    for (const question of test.sections[n - 1].questions) {
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
  assert.deepEqual(JSON.parse(localStorage.getItem(`ielts_test_session_${test.id}`)!).answers, perfect)
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
  await act(async () => root.render(<IELTSReadingInterface test={test} reviewPayload={{ result: submitted!, showCorrectAnswers: true }} onComplete={() => {}} onExit={() => {}} />))
  await part(3)
  assert.match(container.textContent!, /Question 21 - Correct/)
  assert.ok([...container.querySelectorAll('#question-card-lt12-q21 button')].every(element => (element as HTMLButtonElement).disabled || !element.textContent?.trim()))
  await part(4)
  assert.equal((container.querySelector('input[placeholder="40"]') as HTMLInputElement).value, 'noise')
  await act(async () => root.unmount())
  console.log('PASS: all question controls, matching option banks, saved answers, submission, band 9 and shared answer review')
}
