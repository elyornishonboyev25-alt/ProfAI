import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import IELTSReadingInterface from '../../src/components/IELTSReadingInterface'
import { listeningFullTest21 as test } from '../../src/data/listeningFullTest21'
import { mockListeningTests } from '../../src/data/listeningPassages'
import { getIeltsFullTestCatalog, isAvailableIeltsTrackTest } from '../../src/utils/ieltsTrackCatalog'
import { evaluateReadingAnswers } from '../../src/utils/ieltsUtils'
import type { TestResult } from '../../src/types/ieltsTypes'

// Independent transcription of the user's 40-answer sheet.
const key = [
  'Monterey', 'Library', 'Dentist', 'Transportation', 'Parents', 'Youth', 'Mail', 'Teacher', 'August 19', '2.05',
  'F', 'B', 'I', 'D', 'A', 'A', 'C', 'A', 'B', 'C',
  'A', 'C', 'A', 'B', 'A', 'F', 'A', 'B', 'E', 'C',
  'Threat', 'Astronomy', 'Cities', 'Sound', 'Culture', 'Wars', 'Style', 'Blog', 'Speed', 'Ceremony',
]
const answers = Object.fromEntries(key.map((answer, index) => [`lt21-q${index + 1}`, answer]))
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

function checkMap() {
  const svg = container.querySelector('svg[data-brightwater-park]')
  assert.ok(svg, 'inline Brightwater map is rendered')
  assert.equal(svg.querySelectorAll('image, img, foreignObject').length, 0)
  const labels = [...svg.querySelectorAll('text')].map(node => node.textContent)
  for (const letter of 'ABCDEFGHI') assert.ok(labels.includes(letter), letter)
  for (const name of ['Station', 'Railway', 'pool', 'Lake', 'YoungFun', 'MegaAdventure', 'CrazyGolf', 'Entrance']) {
    assert.ok(labels.includes(name), name)
  }
}

export async function run() {
  assert.equal(getIeltsFullTestCatalog('listening')[20].testId, test.id)
  assert.ok(isAvailableIeltsTrackTest('listening', test.id))
  assert.equal(mockListeningTests.filter(item => item.id === test.id).length, 1)
  assert.deepEqual(test.sections.map(section => section.questions.length), [10, 10, 10, 10])
  assert.deepEqual(test.sections.flatMap(section => section.questions.map(question => question.number)), Array.from({ length: 40 }, (_, i) => i + 1))
  assert.equal(evaluateReadingAnswers(test.sections, answers).summary.correctAnswers, 40)
  assert.equal(evaluateReadingAnswers(test.sections, {}).summary.skippedAnswers, 40)
  for (const [number, wrong] of [[1, 'Monterey Bay'], [9, 'August 18'], [10, '2.30'], [11, 'G'], [13, 'H'], [21, 'B'], [26, 'G'], [39, 'ceremony']] as const) {
    assert.equal(evaluateReadingAnswers(test.sections, { ...answers, [`lt21-q${number}`]: wrong }).summary.correctAnswers, 39)
  }
  assert.equal(evaluateReadingAnswers(test.sections, { ...answers, 'lt21-q9': '19th August', 'lt21-q10': '2:05' }).summary.correctAnswers, 40)
  const audio = readFileSync(`public${test.continuousAudioUrl}`)
  assert.equal(audio.length, 23698969)
  assert.equal(createHash('sha256').update(audio).digest('hex'), 'd109b72573454a0a706bc9efaca812b41a4e211f52a4fc8714237720196806ca')
  assert.ok(test.sections.every(section => section.questions.every(question => question.explanation && question.location)))

  localStorage.clear()
  let submitted: TestResult | undefined
  let root = createRoot(container)
  await act(async () => root.render(<IELTSReadingInterface test={test} launchPreset={{ mode: 'practice' }} onComplete={result => { submitted = result }} onExit={() => {}} />))
  await delay(2400)
  const audioElement = container.querySelector('audio')!
  assert.equal(audioElement.getAttribute('src'), test.continuousAudioUrl)
  audioElement.currentTime = 120
  assert.ok(!container.querySelector('.reading-toolbar')!.textContent!.match(/\d+:\d{2}/), 'Listening has no countdown')
  for (let number = 1; number <= 4; number++) {
    if (number > 1) await part(number)
    assert.equal(container.querySelector('audio'), audioElement)
    assert.equal(audioElement.currentTime, 120)
    if (number === 2) checkMap()
    if (number === 3) assert.equal(container.querySelectorAll('.whitespace-pre-line.border-red-200').length, 5)
    for (const question of test.sections[number - 1].questions) {
      if (question.type === 'multiple-choice') {
        const choices = [...container.querySelectorAll<HTMLButtonElement>(`#question-card-${question.id} button`)].filter(element => element.textContent?.trim())
        assert.equal(choices.length, 3)
        await act(async () => choices[key[question.number - 1].charCodeAt(0) - 65].click())
      } else {
        const input = container.querySelector(`input[placeholder="${question.number}"]`)
        assert.ok(input, `Question ${question.number} input`)
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
  await part(2)
  checkMap()
  await act(async () => root.unmount())
  console.log('PASS: slot 21, audio, 40 answers, continuous playback, saved result and inline map in Analyze')
}
