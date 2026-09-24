import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import IELTSReadingInterface from '../../src/components/IELTSReadingInterface'
import { listeningFullTest18 as test } from '../../src/data/listeningFullTest18'
import { mockListeningTests } from '../../src/data/listeningPassages'
import { getIeltsFullTestCatalog, isAvailableIeltsTrackTest } from '../../src/utils/ieltsTrackCatalog'
import { evaluateReadingAnswers } from '../../src/utils/ieltsUtils'
import type { TestResult } from '../../src/types/ieltsTypes'

// All 40 answers transcribed independently from the user's answer image.
const key = [
  '59 Franklyn', 'TY1260S', '019488536', 'traditional', 'central heating', 'garage', 'village', '120000', 'Park Square', 'collect',
  'C', 'B', 'C', 'A', 'A', 'B', 'A', 'D', 'C', 'E',
  'D', 'F', 'A', 'B', 'C', 'A', 'reference', 'products', 'computers', 'knowledge sharing',
  'vitamins', 'rivers', 'space', 'antibiotic', 'bacteria', 'cities', 'taste', 'disease', 'cleaning', 'marketing',
]
const perfect = Object.fromEntries(key.map((answer, index) => [`lt18-q${index + 1}`, answer]))
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
  const svg = container.querySelector('svg[data-pennyfield-plan]')
  assert.ok(svg, 'Pennyfield plan renders inline')
  assert.equal(svg.getAttribute('viewBox'), '15 220 520 280')
  assert.ok(!svg.querySelector('image, foreignObject'), 'No raster or external image decoder')
  for (const label of [...'ABCDEFG', 'Car park', 'Storeroom', 'Shop', 'Field', 'IndoorArena', 'Stable block', 'You are here']) {
    assert.ok([...svg.querySelectorAll('text')].some(el => el.textContent === label), label)
  }
}

export async function run() {
  assert.equal(getIeltsFullTestCatalog('listening')[17].testId, test.id)
  assert.ok(isAvailableIeltsTrackTest('listening', test.id))
  assert.equal(mockListeningTests.filter(item => item.id === test.id).length, 1)
  assert.ok(!isAvailableIeltsTrackTest('listening', getIeltsFullTestCatalog('listening')[18].testId))
  const audio = readFileSync(`public${test.continuousAudioUrl}`)
  assert.equal(audio.length, 25489868)
  assert.equal(createHash('sha256').update(audio).digest('hex'), '4c0b9a0439c23e812ae0b4322cdcf359d19834997244320673b853b650b41c1b')
  assert.deepEqual(test.sections.flatMap(section => section.questions.map(q => q.number)), Array.from({ length: 40 }, (_, i) => i + 1))
  assert.equal(evaluateReadingAnswers(test.sections, perfect).summary.correctAnswers, 40)
  assert.equal(evaluateReadingAnswers(test.sections, {}).summary.skippedAnswers, 40)
  for (const [number, wrong] of [[1, 'Franklyn'], [1, '59 Franklin'], [2, 'TY126OS'], [3, '19488536'], [5, 'central'], [8, '12000'], [9, 'Park'], [18, 'C'], [28, 'product'], [30, 'knowledge'], [31, 'vitamin'], [36, 'city']] as const) {
    assert.equal(evaluateReadingAnswers(test.sections, { ...perfect, [`lt18-q${number}`]: wrong }).summary.correctAnswers, 39, `Q${number}: reject ${wrong}`)
  }
  assert.equal(evaluateReadingAnswers(test.sections, { ...perfect, 'lt18-q2': 'TY12 60S', 'lt18-q8': '120,000', 'lt18-q9': 'PARK SQUARE' }).summary.correctAnswers, 40)
  for (const order of ['ADF', 'AFD', 'DAF', 'DFA', 'FAD', 'FDA']) {
    assert.equal(evaluateReadingAnswers(test.sections, { ...perfect, 'lt18-q21': order[0], 'lt18-q22': order[1], 'lt18-q23': order[2] }).summary.correctAnswers, 40)
  }
  assert.equal(evaluateReadingAnswers(test.sections, { ...perfect, 'lt18-q21': 'A', 'lt18-q22': 'A', 'lt18-q23': 'A' }).summary.correctAnswers, 38)
  assert.equal(evaluateReadingAnswers(test.sections, { ...perfect, 'lt18-q21': '', 'lt18-q22': 'F', 'lt18-q23': 'B' }).summary.correctAnswers, 38)
  assert.ok(test.sections.every(section => section.questions.every(q => q.explanation && q.location)))
  console.log('PASS: slot 18, audio checksum, supplied key, strict marking, permutations, duplicate and partial credit')

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
    if (n === 2) diagram()
    assert.equal(container.querySelector('audio'), audioElement)
    assert.equal(audioElement.currentTime, 135, 'Part switches preserve playback position')
    for (const question of test.sections[n - 1].questions) {
      if (question.number === 22 || question.number === 23) continue
      if (question.type === 'multiple-choice') {
        const choices = [...container.querySelectorAll<HTMLButtonElement>(`#question-card-${question.id} button`)].filter(element => element.textContent?.trim())
        assert.equal(choices.length, question.number === 21 ? 8 : 3)
        const letters = question.number === 21 ? ['F', 'D', 'A'] : [key[question.number - 1]]
        for (const letter of letters) await act(async () => choices[letter.charCodeAt(0) - 65].click())
        if (question.number === 21) {
          await act(async () => choices[1].click())
          const selected = JSON.parse(localStorage.getItem(`ielts_test_session_${test.id}`)!).answers
          assert.deepEqual([selected['lt18-q21'], selected['lt18-q22'], selected['lt18-q23']], ['A', 'D', 'F'], 'Only three selections allowed')
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
  // Saved Results/Analyze snapshots must retain the map and all answers.
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
    if (n === 3) {
      const choices = [...container.querySelectorAll<HTMLButtonElement>('#question-card-lt18-q21 button')].filter(element => element.textContent?.trim())
      assert.equal(choices.length, 8)
      choices.forEach((choice, index) => {
        assert.ok(choice.disabled)
        assert.equal(choice.className.includes('border-emerald-300'), [0, 3, 5].includes(index))
      })
    }
  }
  await act(async () => root.unmount())
  console.log('PASS: 40 controls, selection limit, continuous audio, saved answers, band 9 and saved Analyze with SVG plan')
}
