import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import IELTSReadingInterface from '../../src/components/IELTSReadingInterface'
import { listeningFullTest17 as test } from '../../src/data/listeningFullTest17'
import { mockListeningTests } from '../../src/data/listeningPassages'
import { getIeltsFullTestCatalog, isAvailableIeltsTrackTest } from '../../src/utils/ieltsTrackCatalog'
import { evaluateReadingAnswers } from '../../src/utils/ieltsUtils'
import type { TestResult } from '../../src/types/ieltsTypes'

// Supplied key, with the missing Q10 independently recovered from Test 73.
const key = [
  'CWX576884', '9 months', 'GO194KE', 'Middle St.', 'wood', 'water', 'switched off', 'engineer', 'Tuesday', 'post office',
  'C', 'A', 'A', 'C', 'B', 'J', 'C', 'B', 'E', 'F',
  'A', 'B', 'C', 'B', 'B', 'E', 'C', 'G', 'B', 'D',
  'ice', 'animals', 'teeth', 'resources', 'weapons', 'boats', 'plants', 'climate', 'navigational', 'current',
]
const perfect = Object.fromEntries(key.map((answer, index) => [`lt17-q${index + 1}`, answer]))
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
  const svg = container.querySelector('svg[data-college-plan]')
  assert.ok(svg, 'College plan renders inline')
  assert.equal(svg.getAttribute('viewBox'), '125 180 415 450')
  assert.ok(!svg.querySelector('image, foreignObject'), 'No raster or external image decoder')
  for (const letter of 'ABCDEFGHIJ') assert.ok([...svg.querySelectorAll('text')].some(el => el.textContent === letter))
  assert.equal(svg.querySelectorAll('ellipse').length, 10)
  assert.equal(svg.querySelectorAll('use').length, 3)
}

export async function run() {
  assert.equal(getIeltsFullTestCatalog('listening')[16].testId, test.id)
  assert.ok(isAvailableIeltsTrackTest('listening', test.id))
  assert.equal(mockListeningTests.filter(item => item.id === test.id).length, 1)
  assert.ok(!isAvailableIeltsTrackTest('listening', getIeltsFullTestCatalog('listening')[18].testId))
  const audio = readFileSync(`public${test.continuousAudioUrl}`)
  assert.equal(audio.length, 23874861)
  assert.equal(createHash('sha256').update(audio).digest('hex'), '374bd5f847d50bbfb88c20369f95b7b569a4a3423cec83bb43211a48327dda4a')
  assert.deepEqual(test.sections.flatMap(section => section.questions.map(q => q.number)), Array.from({ length: 40 }, (_, i) => i + 1))
  assert.equal(evaluateReadingAnswers(test.sections, perfect).summary.correctAnswers, 40)
  assert.equal(evaluateReadingAnswers(test.sections, {}).summary.skippedAnswers, 40)
  for (const [number, wrong] of [[1, 'CWX576AA4'], [2, '9'], [2, '9 years'], [4, 'Middle'], [7, 'switched on'], [10, 'post'], [16, 'Office'], [21, 'C'], [33, 'tooth'], [36, 'boat'], [39, 'navigation skills']] as const) {
    assert.equal(evaluateReadingAnswers(test.sections, { ...perfect, [`lt17-q${number}`]: wrong }).summary.correctAnswers, 39, `Q${number}: reject ${wrong}`)
  }
  assert.equal(evaluateReadingAnswers(test.sections, { ...perfect, 'lt17-q1': 'CWX 576884', 'lt17-q2': 'nine months', 'lt17-q3': 'GO19 4KE', 'lt17-q4': 'Middle Street', 'lt17-q10': 'POST OFFICE' }).summary.correctAnswers, 40)
  assert.ok(test.sections.every(section => section.questions.every(q => q.explanation && q.location)))
  console.log('PASS: slot 17, audio checksum, supplied answer key, recovered Q10, strict marking and variants')

  localStorage.clear()
  let submitted: TestResult | undefined
  let root = createRoot(container)
  const render = () => root.render(<IELTSReadingInterface test={test} launchPreset={{ mode: 'practice' }} onComplete={result => { submitted = result }} onExit={() => {}} />)
  await act(async () => render())
  await delay(2400)
  const audioElement = container.querySelector('audio')!
  assert.equal(audioElement.getAttribute('src'), test.continuousAudioUrl)
  audioElement.currentTime = 135
  assert.match(container.textContent!, /0\/40 answered/)
  for (let n = 1; n <= 4; n++) {
    if (n > 1) await part(n)
    if (n === 2) diagram()
    assert.equal(container.querySelector('audio'), audioElement)
    assert.equal(audioElement.currentTime, 135, 'Part switches preserve playback position')
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
  await part(2)
  diagram()
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
  // JSON round-trip represents saved attempts reopened by Results/Analyze.
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
  }
  await act(async () => root.unmount())
  console.log('PASS: 40 controls, continuous audio, saved answers, submission, band 9, saved Analyze with SVG plan')
}
