import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import IELTSReadingInterface from '../../src/components/IELTSReadingInterface'
import { listeningFullTest16 as test } from '../../src/data/listeningFullTest16'
import { mockListeningTests } from '../../src/data/listeningPassages'
import { getIeltsFullTestCatalog, isAvailableIeltsTrackTest } from '../../src/utils/ieltsTrackCatalog'
import { evaluateReadingAnswers } from '../../src/utils/ieltsUtils'
import type { TestResult } from '../../src/types/ieltsTypes'

// The user's answer image, independently matched to MKL036 and Vol 8 Test 7.
const key = [
  'Thorn', '5 days', 'gold coast', 'apartment', 'C', 'A', 'C', 'B', 'E', 'F',
  'cars', '1928', 'cinema', 'quality', 'factory', 'waste', 'safety', 'website', 'customers', 'money',
  'B', 'B', 'C', 'A', 'C', 'C', 'E', 'C', 'D', 'B',
  'infection', 'wall', 'stress', 'heart', 'immune', 'interviews', 'fountain', 'furniture', 'birds', 'society',
]
const perfect = Object.fromEntries(key.map((answer, index) => [`lt16-q${index + 1}`, answer]))
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
  assert.equal(getIeltsFullTestCatalog('listening')[15].testId, test.id)
  assert.ok(isAvailableIeltsTrackTest('listening', test.id))
  assert.equal(mockListeningTests.filter(item => item.id === test.id).length, 1)
  assert.ok(!isAvailableIeltsTrackTest('listening', getIeltsFullTestCatalog('listening')[17].testId))
  const audio = readFileSync(`public${test.continuousAudioUrl}`)
  assert.equal(audio.length, 21988323)
  assert.equal(createHash('sha256').update(audio).digest('hex'), '90d52e39e76842302de3b02da5ca3a6510b7d0e0b538ce92162ec9479699e5d0')
  assert.deepEqual(test.sections.flatMap(section => section.questions.map(q => q.number)), Array.from({ length: 40 }, (_, i) => i + 1))
  const full = evaluateReadingAnswers(test.sections, perfect)
  assert.equal(full.summary.correctAnswers, 40)
  assert.deepEqual(full.sectionSummaries.map(section => section.correctAnswers), [10, 10, 10, 10])
  assert.equal(evaluateReadingAnswers(test.sections, {}).summary.skippedAnswers, 40)
  for (const [number, wrong] of [[1, 'Thorne'], [2, '5'], [2, '5 weeks'], [3, 'gold'], [12, '1927'], [22, 'C'], [25, 'B'], [27, 'use of lettering'], [35, 'immune system'], [38, 'furnitures']] as const) {
    assert.equal(evaluateReadingAnswers(test.sections, { ...perfect, [`lt16-q${number}`]: wrong }).summary.correctAnswers, 39, `Q${number}: reject ${wrong}`)
  }
  for (const order of ['BEF', 'BFE', 'EBF', 'EFB', 'FBE', 'FEB']) {
    assert.equal(evaluateReadingAnswers(test.sections, { ...perfect, 'lt16-q8': order[0], 'lt16-q9': order[1], 'lt16-q10': order[2] }).summary.correctAnswers, 40)
  }
  assert.equal(evaluateReadingAnswers(test.sections, { ...perfect, 'lt16-q8': 'B', 'lt16-q9': 'B', 'lt16-q10': 'B' }).summary.correctAnswers, 38)
  assert.equal(evaluateReadingAnswers(test.sections, { ...perfect, 'lt16-q8': '', 'lt16-q9': 'F', 'lt16-q10': 'A' }).summary.correctAnswers, 38)
  assert.equal(evaluateReadingAnswers(test.sections, { ...perfect, 'lt16-q2': 'five days', 'lt16-q3': 'GOLD COAST', 'lt16-q4': 'an apartment' }).summary.correctAnswers, 40)
  assert.ok(test.sections.every(section => section.questions.every(q => q.explanation && q.location)))
  console.log('PASS: catalog, audio checksum, 40-answer key, permutations, duplicate/partial credit, distractors')

  localStorage.clear()
  let submitted: TestResult | undefined
  let root = createRoot(container)
  await act(async () => root.render(<IELTSReadingInterface test={test} launchPreset={{ mode: 'practice' }} onComplete={result => { submitted = result }} onExit={() => {}} />))
  await delay(2400)
  const audioElement = container.querySelector('audio')!
  assert.equal(audioElement.getAttribute('src'), test.continuousAudioUrl)
  audioElement.currentTime = 135
  assert.match(container.textContent!, /0\/40 answered/)
  for (let n = 1; n <= 4; n++) {
    if (n > 1) await part(n)
    assert.equal(container.querySelector('audio'), audioElement, 'Part changes preserve the continuous player')
    assert.equal(audioElement.currentTime, 135)
    for (const question of test.sections[n - 1].questions) {
      if (question.number === 9 || question.number === 10) continue
      if (question.type === 'multiple-choice') {
        const choices = [...container.querySelectorAll<HTMLButtonElement>(`#question-card-${question.id} button`)].filter(element => element.textContent?.trim())
        assert.equal(choices.length, question.number === 8 ? 7 : 3)
        const letters = question.number === 8 ? ['F', 'E', 'B'] : [key[question.number - 1]]
        for (const letter of letters) await act(async () => choices[letter.charCodeAt(0) - 65].click())
        if (question.number === 8) {
          await act(async () => choices[0].click())
          const saved = JSON.parse(localStorage.getItem(`ielts_test_session_${test.id}`)!).answers
          assert.deepEqual([saved['lt16-q8'], saved['lt16-q9'], saved['lt16-q10']], ['B', 'E', 'F'], 'A fourth selection must not replace the chosen three')
        }
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
  assert.match(container.textContent!, /40\/40 answered/)
  const saved = JSON.parse(localStorage.getItem(`ielts_test_session_${test.id}`)!).answers
  assert.equal(evaluateReadingAnswers(test.sections, saved).summary.correctAnswers, 40)
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
  for (let n = 1; n <= 4; n++) {
    if (n > 1) await part(n)
    for (const input of container.querySelectorAll<HTMLInputElement>('input[placeholder]')) {
      const number = Number(input.placeholder)
      if (!number) continue
      assert.equal(input.value, key[number - 1])
      assert.ok(input.disabled)
    }
  }
  await act(async () => root.unmount())
  console.log('PASS: all controls, selection limit, continuous audio, saved answers, submission, band 9, four-part Analyze review')
}
