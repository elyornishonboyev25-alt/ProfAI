import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import IELTSReadingInterface from '../../src/components/IELTSReadingInterface'
import { listeningFullTest19 as test, listeningTest19SourceNumbers } from '../../src/data/listeningFullTest19'
import { mockListeningTests } from '../../src/data/listeningPassages'
import { getIeltsFullTestCatalog, isAvailableIeltsTrackTest } from '../../src/utils/ieltsTrackCatalog'
import { evaluateReadingAnswers } from '../../src/utils/ieltsUtils'
import type { TestResult } from '../../src/types/ieltsTypes'

// Independent transcription of all 49 answers from the user's image.
const originalKey = [
  '0406774008', 'WHITBY', 'Summer', '16', 'families', 'cabins', 'beach', 'comments', 'caravan', 'cleaning', 'garden', 'September', '35.70',
  'A', 'A', 'B', 'B', 'C', 'A', 'B', 'D', 'D', 'A',
  'C', 'E', 'B', 'D', 'A', 'D', 'D', 'B', 'C', 'G', 'F', 'I', 'E',
  'night', 'babies', 'illness', 'vegetation', 'birds', 'temperature', 'media', 'forest', 'fence', 'weeds', 'sand', 'fur', 'water',
]
const retained = [1, 2, 3, 4, 5, 8, 9, 10, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 35, 36, 37, 39, 40, 41, 42, 44, 45, 47, 48, 49]
const key = retained.map(number => originalKey[number - 1])
const perfect = Object.fromEntries(key.map((answer, index) => [`lt19-q${index + 1}`, answer]))
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
  assert.deepEqual(listeningTest19SourceNumbers, retained)
  assert.equal(getIeltsFullTestCatalog('listening')[18].testId, test.id)
  assert.ok(isAvailableIeltsTrackTest('listening', test.id))
  assert.equal(mockListeningTests.filter(item => item.id === test.id).length, 1)
  assert.ok(!isAvailableIeltsTrackTest('listening', getIeltsFullTestCatalog('listening')[19].testId))
  assert.ok(readFileSync(`public${test.continuousAudioUrl}`).length > 10000000)
  assert.equal(test.totalQuestions, 40)
  assert.deepEqual(test.sections.map(section => section.questions.length), [10, 10, 10, 10])
  assert.deepEqual(test.sections.flatMap(section => section.questions.map(q => q.number)), Array.from({ length: 40 }, (_, i) => i + 1))
  assert.equal(evaluateReadingAnswers(test.sections, perfect).summary.correctAnswers, 40)
  assert.equal(evaluateReadingAnswers(test.sections, {}).summary.skippedAnswers, 40)
  for (const [number, wrong] of [[1, '406774008'], [1, '0406774009'], [2, 'Whitby Park'], [4, '60'], [5, 'family'], [6, 'comment'], [9, 'November'], [10, '35'], [28, 'A'], [34, 'bird'], [40, 'food']] as const) {
    assert.equal(evaluateReadingAnswers(test.sections, { ...perfect, [`lt19-q${number}`]: wrong }).summary.correctAnswers, 39, `Q${number}: reject ${wrong}`)
  }
  assert.equal(evaluateReadingAnswers(test.sections, { ...perfect, 'lt19-q1': '0406 774 008', 'lt19-q4': 'sixteen', 'lt19-q10': '35.7' }).summary.correctAnswers, 40)
  for (const first of [21, 23, 25]) {
    const left = `lt19-q${first}`, right = `lt19-q${first + 1}`
    assert.equal(evaluateReadingAnswers(test.sections, { ...perfect, [left]: perfect[right], [right]: perfect[left] }).summary.correctAnswers, 40)
    assert.equal(evaluateReadingAnswers(test.sections, { ...perfect, [left]: perfect[right] }).summary.correctAnswers, 39)
    assert.equal(evaluateReadingAnswers(test.sections, { ...perfect, [left]: '' }).summary.correctAnswers, 39)
  }
  assert.ok(test.sections.every(section => section.questions.every(q => q.explanation && q.location)))
  console.log('PASS: slot 19, 49-to-40 source mapping, 10 per part, supplied key, strict marking, paired answers and partial credit')

  localStorage.clear()
  let submitted: TestResult | undefined
  let root = createRoot(container)
  await act(async () => root.render(<IELTSReadingInterface test={test} launchPreset={{ mode: 'practice' }} onComplete={result => { submitted = result }} onExit={() => {}} />))
  await delay(2400)
  const audioElement = container.querySelector('audio')!
  assert.equal(audioElement.getAttribute('src'), test.continuousAudioUrl)
  audioElement.currentTime = 135
  for (let n = 1; n <= 4; n++) {
    if (n > 1) await part(n)
    assert.equal(container.querySelector('audio'), audioElement)
    assert.equal(audioElement.currentTime, 135)
    assert.match(container.textContent!, /spoken question numbers differ/)
    if (n === 1) {
      assert.equal(container.querySelectorAll('table tbody tr').length, 2)
      assert.ok(container.querySelector('table .whitespace-pre-line'))
    }
    for (const question of test.sections[n - 1].questions) {
      if ([22, 24, 26].includes(question.number)) continue
      if (question.type === 'multiple-choice') {
        const choices = [...container.querySelectorAll<HTMLButtonElement>(`#question-card-${question.id} button`)].filter(element => element.textContent?.trim())
        const paired = question.number >= 21
        assert.equal(choices.length, paired ? 5 : 3)
        const letters = paired ? [key[question.number], key[question.number - 1]] : [key[question.number - 1]]
        for (const letter of letters) await act(async () => choices[letter.charCodeAt(0) - 65].click())
        if (paired) {
          const extra = ['A', 'B', 'C', 'D', 'E'].find(letter => !letters.includes(letter))!
          await act(async () => choices[extra.charCodeAt(0) - 65].click())
          const saved = JSON.parse(localStorage.getItem(`ielts_test_session_${test.id}`)!).answers
          assert.deepEqual([saved[question.id], saved[`lt19-q${question.number + 1}`]], [...letters].sort(), 'Selection limit is two')
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
  await act(async () => root.render(<IELTSReadingInterface test={JSON.parse(JSON.stringify(test))} reviewPayload={{ result: JSON.parse(JSON.stringify(submitted)), showCorrectAnswers: true }} onComplete={() => {}} onExit={() => {}} />))
  for (let n = 1; n <= 4; n++) {
    if (n > 1) await part(n)
    for (const input of container.querySelectorAll<HTMLInputElement>('input[placeholder]')) {
      const number = Number(input.placeholder)
      if (!number) continue
      assert.equal(input.value, key[number - 1])
      assert.ok(input.disabled)
    }
    if (n === 3) for (const first of [21, 23, 25]) {
      const choices = [...container.querySelectorAll<HTMLButtonElement>(`#question-card-lt19-q${first} button`)].filter(element => element.textContent?.trim())
      assert.equal(choices.length, 5)
      choices.forEach((choice, index) => {
        assert.ok(choice.disabled)
        assert.equal(choice.className.includes('border-emerald-300'), [key[first - 1], key[first]].includes(String.fromCharCode(65 + index)))
      })
    }
  }
  await act(async () => root.unmount())
  console.log('PASS: all controls, two-choice limits, continuous audio, saved answers, band 9 and saved Analyze across all four parts')
}
