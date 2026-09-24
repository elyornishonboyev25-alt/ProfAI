import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import IELTSReadingInterface from '../../src/components/IELTSReadingInterface'
import { listeningFullTest20 as test } from '../../src/data/listeningFullTest20'
import { mockListeningTests } from '../../src/data/listeningPassages'
import { getIeltsFullTestCatalog, isAvailableIeltsTrackTest } from '../../src/utils/ieltsTrackCatalog'
import { evaluateReadingAnswers } from '../../src/utils/ieltsUtils'
import type { TestResult } from '../../src/types/ieltsTypes'

// Independently checked against the user's version 55124 transcript, including
// the DDT statement at 15:50 that resolves the conflicting public Q23 key.
const key = ['TCJ700785', 'Ocean', '0718849923', 'computer', 'carpet', 'suitcase', 'camping', 'roof', 'window', 'photographs',
  'B', 'A', 'C', 'A', 'C', 'E', 'G', 'H', 'F', 'B', 'A', 'C', 'B', 'C', 'A', 'G', 'D', 'B', 'A', 'F',
  'army', 'safety', 'learning', 'reasons', 'trust', 'writing', 'open', 'leaders', 'training', 'time']
const perfect = Object.fromEntries(key.map((answer, i) => [`lt20-q${i + 1}`, answer]))
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
function diagram() {
  const svg = container.querySelector('svg[data-rivermead-campus]')!
  assert.ok(svg)
  assert.equal(svg.getAttribute('viewBox'), '104 162 540 540')
  assert.equal(svg.querySelectorAll('img, image, foreignObject').length, 0)
  const texts = [...svg.querySelectorAll('text')].map(node => node.textContent)
  for (const label of 'ABCDEFGHIJ') assert.ok(texts.includes(label), label)
  for (const label of ['Rivermead School Campus', 'Park Road', 'Rennies Drive', 'Carpark P1', 'Carpark P2', 'Classroomblock', 'Mainentrance']) assert.ok(texts.includes(label), label)
}

export async function run() {
  assert.equal(getIeltsFullTestCatalog('listening')[19].testId, test.id)
  assert.ok(isAvailableIeltsTrackTest('listening', test.id))
  assert.equal(mockListeningTests.filter(item => item.id === test.id).length, 1)
  assert.ok(!isAvailableIeltsTrackTest('listening', getIeltsFullTestCatalog('listening')[20].testId))
  const audio = readFileSync(`public${test.continuousAudioUrl}`)
  assert.equal(audio.length, 25008632)
  assert.equal(createHash('sha256').update(audio).digest('hex'), 'd54104a204a288728b822c297c6f0e97dbab4d23899df34e9f7f41de2465007b')
  assert.deepEqual(test.sections.map(section => section.questions.length), [10, 10, 10, 10])
  assert.deepEqual(test.sections.flatMap(section => section.questions.map(question => question.number)), Array.from({ length: 40 }, (_, i) => i + 1))
  assert.equal(evaluateReadingAnswers(test.sections, perfect).summary.correctAnswers, 40)
  assert.equal(evaluateReadingAnswers(test.sections, {}).summary.skippedAnswers, 40)
  for (const [number, wrong] of [[1, 'TCJ700786'], [1, 'TCJ7OO785'], [2, 'Ocean Drive'], [3, '718849923'], [4, 'television'], [6, 'tools'], [10, 'photograph'], [10, 'receipts'], [15, 'D'], [23, 'A'], [26, 'C'], [30, 'E'], [34, 'reason'], [38, 'leader']] as const) {
    assert.equal(evaluateReadingAnswers(test.sections, { ...perfect, [`lt20-q${number}`]: wrong }).summary.correctAnswers, 39, `Q${number}: reject ${wrong}`)
  }
  assert.equal(evaluateReadingAnswers(test.sections, { ...perfect, 'lt20-q1': 'tcj 700785', 'lt20-q3': '071 884 9923', 'lt20-q10': 'photos' }).summary.correctAnswers, 40)
  assert.ok(test.sections.every(section => section.questions.every(question => question.explanation && question.location)))
  console.log('PASS: slot 20, 40-question key, strict marking, Q23 correction and explanations')

  localStorage.clear()
  let submitted: TestResult | undefined
  let root = createRoot(container)
  await act(async () => root.render(<IELTSReadingInterface test={test} launchPreset={{ mode: 'practice' }} onComplete={result => { submitted = result }} onExit={() => {}} />))
  await delay(2400)
  const audioElement = container.querySelector('audio')!
  assert.equal(audioElement.getAttribute('src'), test.continuousAudioUrl)
  audioElement.currentTime = 135
  assert.ok(!container.querySelector('.reading-toolbar')!.textContent!.match(/\d+:\d{2}/), 'No Listening countdown')
  for (let n = 1; n <= 4; n++) {
    if (n > 1) await part(n)
    assert.equal(container.querySelector('audio'), audioElement)
    assert.equal(audioElement.currentTime, 135)
    if (n === 2) diagram()
    if (n === 3) {
      assert.equal(container.querySelectorAll('.whitespace-pre-line.border-red-200').length, 3, 'Three flow-chart boxes preserve line breaks')
      assert.match(container.textContent!, /sources of funding/)
      assert.match(container.textContent!, /future developments/)
    }
    for (const question of test.sections[n - 1].questions) {
      if (question.type === 'multiple-choice') {
        const choices = [...container.querySelectorAll<HTMLButtonElement>(`#question-card-${question.id} button`)].filter(element => element.textContent?.trim())
        assert.equal(choices.length, 3)
        await act(async () => choices[key[question.number - 1].charCodeAt(0) - 65].click())
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
  await act(async () => root.render(<IELTSReadingInterface test={JSON.parse(JSON.stringify(test))} reviewPayload={{ result: JSON.parse(JSON.stringify(submitted)), showCorrectAnswers: true }} onComplete={() => {}} onExit={() => {}} />))
  for (let n = 1; n <= 4; n++) {
    if (n > 1) await part(n)
    if (n === 2) diagram()
    for (const input of container.querySelectorAll<HTMLInputElement>('input[placeholder]')) {
      const number = Number(input.placeholder)
      if (!number) continue
      assert.equal(input.value, key[number - 1])
      assert.ok(input.disabled)
    }
    for (const question of test.sections[n - 1].questions.filter(question => question.type === 'multiple-choice')) {
      const choices = [...container.querySelectorAll<HTMLButtonElement>(`#question-card-${question.id} button`)].filter(element => element.textContent?.trim())
      choices.forEach((choice, i) => {
        assert.ok(choice.disabled)
        assert.equal(choice.className.includes('border-emerald-300'), i === key[question.number - 1].charCodeAt(0) - 65)
      })
    }
  }
  await part(2)
  diagram()
  await act(async () => root.unmount())
  console.log('PASS: all 40 controls, continuous audio, saved answers, band 9 and saved Analyze with native map')
}
