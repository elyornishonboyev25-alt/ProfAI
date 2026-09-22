import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import assert from 'node:assert/strict'
import { statSync } from 'node:fs'
import IELTSReadingInterface from '../../src/components/IELTSReadingInterface'
import { listeningFullTest11 as test } from '../../src/data/listeningFullTest11'
import { mockListeningTests } from '../../src/data/listeningPassages'
import { getIeltsFullTestCatalog, isAvailableIeltsTrackTest } from '../../src/utils/ieltsTrackCatalog'
import { calculateBandScore, evaluateReadingAnswers } from '../../src/utils/ieltsUtils'
import type { TestResult } from '../../src/types/ieltsTypes'

// Independently transcribed from the user's answer-key image.
const key = [
  'microwave', 'reception', 'shower', 'lake', '18', 'tennis', 'fishing', 'farm', 'forest', 'ARATAKI',
  'B', 'B', '40', '25', 'B', 'C', 'A', 'C', 'B', 'E',
  'A', 'E', 'A', 'D', 'C', 'D', 'B', 'A', 'A', 'C',
  'homes', 'solar', 'experience', 'boiler', 'air', 'bacteria', 'radiators', 'training', 'simple', 'supervisor',
]
const perfect = Object.fromEntries(key.map((answer, index) => [`lt11-q${index + 1}`, answer]))
const pairs = [[19, 20], [21, 22], [23, 24], [25, 26]]
const container = document.getElementById('root')!
const delay = (ms: number) => act(async () => { await new Promise(resolve => setTimeout(resolve, ms)) })

function button(text: string) {
  const match = [...container.querySelectorAll('button')].find(element => element.textContent?.trim() === text)
  assert.ok(match, `Button: ${text}`)
  return match
}

async function part(number: number) {
  const tab = [...container.querySelectorAll('span')].find(element => element.textContent === `Part ${number}`)
  assert.ok(tab, `Part ${number} navigation`)
  await act(async () => tab.click())
}

async function fillPart(number: number) {
  const section = test.sections[number - 1]
  for (const question of section.questions) {
    const pair = pairs.find(numbers => numbers.includes(question.number))
    if (pair) {
      if (question.number !== pair[0]) continue
      const choices = [...container.querySelectorAll(`#question-card-${question.id} button`)].filter(element => element.textContent?.trim())
      for (const n of pair) await act(async () => (choices[key[n - 1].charCodeAt(0) - 65] as HTMLButtonElement).click())
    } else if (question.type === 'multiple-choice') {
      const choices = [...container.querySelectorAll(`#question-card-${question.id} button`)].filter(element => element.textContent?.trim())
      await act(async () => (choices[key[question.number - 1].charCodeAt(0) - 65] as HTMLButtonElement).click())
    } else {
      const input = container.querySelector(`input[placeholder="${question.number}"]`)!
      assert.ok(input)
      await act(async () => {
        Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!.call(input, key[question.number - 1])
        input.dispatchEvent(new window.Event('input', { bubbles: true }))
      })
    }
  }
}

export async function run() {
  const entry = getIeltsFullTestCatalog('listening')[10]
  assert.equal(entry.testId, test.id)
  assert.ok(isAvailableIeltsTrackTest('listening', entry.testId))
  assert.ok(!isAvailableIeltsTrackTest('listening', getIeltsFullTestCatalog('listening')[12].testId))
  assert.equal(mockListeningTests.filter(item => item.id === test.id).length, 1)
  assert.ok(statSync(`public${test.continuousAudioUrl}`).size > 20_000_000)
  assert.deepEqual(test.sections.flatMap(section => section.questions.map(q => q.number)), Array.from({ length: 40 }, (_, i) => i + 1))
  assert.equal(new Set(mockListeningTests.flatMap(item => item.sections.flatMap(section => section.questions.map(q => q.id)))).size,
    mockListeningTests.flatMap(item => item.sections.flatMap(section => section.questions)).length)

  const full = evaluateReadingAnswers(test.sections, perfect)
  assert.equal(full.summary.correctAnswers, 40)
  assert.equal(full.summary.totalQuestions, 40)
  assert.equal(calculateBandScore(full.summary.correctAnswers), 9)
  assert.deepEqual(full.sectionSummaries.map(section => section.correctAnswers), [10, 10, 10, 10])
  assert.equal(evaluateReadingAnswers(test.sections, {}).summary.skippedAnswers, 40)
  assert.equal(evaluateReadingAnswers(test.sections, Object.fromEntries(key.map((_, i) => [`lt11-q${i + 1}`, 'wrong']))).summary.correctAnswers, 0)

  for (const [first, second] of pairs) {
    const a = `lt11-q${first}`, b = `lt11-q${second}`
    for (const [left, right, expected] of [
      [perfect[b], perfect[a], 40], // reversed order
      [perfect[b], '', 39], // either valid answer earns a mark in either slot
      ['', perfect[a], 39],
      ['Z', perfect[a], 39],
      [perfect[b], 'Z', 39],
      [perfect[a], perfect[a], 39], // duplicate is only credited once
    ] as const) {
      assert.equal(evaluateReadingAnswers(test.sections, { ...perfect, [a]: left, [b]: right }).summary.correctAnswers, expected, `${first}/${second}: ${left}, ${right}`)
    }
  }
  // All existing Listening keys still score 40/40; earlier paired-choice tests
  // also grant credit when their two individually stored answers are reversed.
  for (const existing of mockListeningTests) {
    if (existing.id === test.id) continue
    const answers = Object.fromEntries(existing.sections.flatMap(section => section.questions.map(q => [q.id,
      Array.isArray(q.correctAnswer) ? [...q.correctAnswer] : q.correctAnswer.split(/[|;/]/)[0].trim(),
    ])))
    assert.equal(evaluateReadingAnswers(existing.sections, answers).summary.correctAnswers, 40, existing.id)
    for (const section of existing.sections) {
      for (const block of (section.groups ?? []).flatMap(group => group.blocks)) {
        if (block.kind !== 'multi-mcq') continue
        const ids = block.blanks.map(number => section.questions.find(q => q.number === number)!.id)
        const reversed = ids.map(id => answers[id]).reverse()
        ids.forEach((id, index) => { answers[id] = reversed[index] })
      }
    }
    assert.equal(evaluateReadingAnswers(existing.sections, answers).summary.correctAnswers, 40, `${existing.id} reversed pairs`)
  }
  console.log('PASS: catalog, 40-question source key, four-part analysis, unordered/partial/duplicate choices, existing test keys')

  localStorage.clear()
  let submitted: TestResult | undefined
  let root = createRoot(container)
  await act(async () => root.render(<IELTSReadingInterface test={test} launchPreset={{ mode: 'practice' }} onComplete={result => { submitted = result }} onExit={() => {}} />))
  await delay(2400)
  assert.match(container.textContent!, /0\/40 answered/)
  assert.equal(container.querySelector('audio')?.getAttribute('src'), test.continuousAudioUrl)
  assert.equal(container.querySelectorAll('table th').length, 4)
  for (let number = 1; number <= 10; number++) assert.ok(container.querySelector(`input[placeholder="${number}"]`))
  await fillPart(1)
  await part(2)
  assert.ok(container.querySelector('input[placeholder="13"]'))
  assert.ok(container.querySelector('input[placeholder="14"]'))
  for (let number = 15; number <= 18; number++) assert.ok(container.querySelector(`input[placeholder="${number}"]`))
  const pairCard = container.querySelector('#question-card-lt11-q19')!
  assert.ok(pairCard)
  const choices = [...pairCard.querySelectorAll('button')].filter(element => element.textContent?.trim())
  assert.equal(choices.length, 5)
  await act(async () => choices[4].click())
  await act(async () => choices[1].click())
  let session = JSON.parse(localStorage.getItem(`ielts_test_session_${test.id}`)!)
  assert.equal(session.answers['lt11-q19'], 'B')
  assert.equal(session.answers['lt11-q20'], 'E')
  await act(async () => choices[0].click())
  session = JSON.parse(localStorage.getItem(`ielts_test_session_${test.id}`)!)
  assert.equal(session.answers['lt11-q19'], 'B')
  assert.equal(session.answers['lt11-q20'], 'E', 'two-choice limit')
  await act(async () => choices[1].click())
  await act(async () => choices[4].click())
  await fillPart(2)
  await part(3)
  for (const number of [21, 23, 25, 27, 28, 29, 30]) assert.ok(container.querySelector(`#question-card-lt11-q${number}`))
  await fillPart(3)
  await part(4)
  for (let number = 31; number <= 40; number++) assert.ok(container.querySelector(`input[placeholder="${number}"]`))
  await fillPart(4)
  console.log('PASS: shared Listening UI renders all four parts, audio, table, matching, and limited paired choices')

  session = JSON.parse(localStorage.getItem(`ielts_test_session_${test.id}`)!)
  assert.deepEqual(session.answers, perfect)
  assert.match(container.textContent!, /40\/40 answered/)
  await act(async () => button('Submit').click())
  await act(async () => button('Submit test').click())
  await act(async () => button('Check score').click())
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
  assert.match(container.textContent!, /Question 22 - Correct/)
  assert.ok([...container.querySelectorAll('#question-card-lt11-q21 button')].every(element => (element as HTMLButtonElement).disabled || !element.textContent?.trim()))
  await part(4)
  assert.equal((container.querySelector('input[placeholder="40"]') as HTMLInputElement).value, 'supervisor')
  await act(async () => root.unmount())
  console.log('PASS: entered answers persist, submit as 40/40, band 9, and reopen in the shared answer review')
}
