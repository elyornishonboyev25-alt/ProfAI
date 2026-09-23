import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import assert from 'node:assert/strict'
import { statSync } from 'node:fs'
import { createHash } from 'node:crypto'
import IELTSReadingInterface from '../../src/components/IELTSReadingInterface'
import { listeningFullTest15 as test } from '../../src/data/listeningFullTest15'
import { getIeltsFullTestCatalog, isAvailableIeltsTrackTest } from '../../src/utils/ieltsTrackCatalog'
import { evaluateReadingAnswers } from '../../src/utils/ieltsUtils'
import type { TestResult } from '../../src/types/ieltsTypes'

// Independently derived from the user-supplied version 54768 transcript.
const key = [
  '14 September', '835', 'school', 'deck', 'river', 'towels', 'garage', 'Chinese', '200', 'July',
  'A', 'B', 'A', 'B', 'F', 'A', 'B', 'H', 'G', 'I',
  'A', 'C', 'B', 'A', 'B', 'B', 'G', 'E', 'D', 'B',
  'wool', 'bird', 'rain', 'desert', 'prison', 'clothing', 'family', 'rainbow', 'snake', 'carpet',
]
const perfect = Object.fromEntries(key.map((answer, index) => [`lt15-q${index + 1}`, answer]))
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
  const entry = getIeltsFullTestCatalog('listening')[14]
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
  for (const [number, wrong] of [[1, '21 September'], [1, '14'], [1, '14 August'], [1, 'September 21'], [2, '790'], [6, 'towel'], [6, 'towels bedding'], [10, 'August'], [15, 'Stage'], [18, 'G'], [23, 'C'], [29, 'C'], [32, 'birds'], [36, 'cotton']] as const) {
    assert.equal(evaluateReadingAnswers(test.sections, { ...perfect, [`lt15-q${number}`]: wrong }).summary.correctAnswers, 39, `Q${number} must reject ${wrong}`)
  }
  for (const date of ['14th September', 'September 14', 'September 14th']) {
    assert.equal(evaluateReadingAnswers(test.sections, { ...perfect, 'lt15-q1': date, 'lt15-q8': 'CHINESE', 'lt15-q18': 'h' }).summary.correctAnswers, 40)
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
    if (n === 2) {
      const diagram = container.querySelector('figure img')?.getAttribute('src')
      assert.match(diagram!, /^data:image\/png;base64,/)
      assert.equal(createHash('sha256').update(Buffer.from(diagram!.split(',')[1], 'base64')).digest('hex'), '09c1b757957715253de91c61032e2e6ac282dd378d33a463906f02c97b2f0627')
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
  for (const group of oldSnapshot.sections[1].groups!) {
    for (const block of group.blocks) {
      if (block.kind === 'image') block.src = '/images/ielts-listening-test15-race-village.png'
    }
  }
  await act(async () => root.render(<IELTSReadingInterface test={oldSnapshot} reviewPayload={{ result: submitted!, showCorrectAnswers: true }} onComplete={() => {}} onExit={() => {}} />))
  await part(2)
  assert.match(container.querySelector('figure img')!.getAttribute('src')!, /^data:image\/png;base64,/)
  await act(async () => container.querySelector('figure img')!.dispatchEvent(new window.Event('error')))
  assert.match(container.querySelector('figure img')!.getAttribute('src')!, /race-village\.png\?v=/)
  await delay(1100)
  assert.match(container.querySelector('figure img')!.getAttribute('src')!, /race-village\.png\?v=/)
  assert.equal((container.querySelector('input[placeholder="15"]') as HTMLInputElement).value, 'F')
  assert.ok((container.querySelector('input[placeholder="15"]') as HTMLInputElement).disabled)
  await part(4)
  assert.equal((container.querySelector('input[placeholder="40"]') as HTMLInputElement).value, 'carpet')
  await act(async () => root.unmount())
  console.log('PASS: all question controls, matching option banks, saved answers, submission, band 9 and shared answer review')
}
