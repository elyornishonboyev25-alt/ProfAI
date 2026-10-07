import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import ListeningInterface from '../../src/components/IELTSReadingInterface'
import TestInterface from '../../src/pages/TestInterface'
import { listeningFullTest3 as test } from '../../src/data/listeningFullTest3'
import { listeningFullTest1, archivedListeningFullTest3 } from '../../src/data/listeningFullTest1'
import { mockListeningTests } from '../../src/data/listeningPassages'
import { getIeltsFullTestCatalog } from '../../src/utils/ieltsTrackCatalog'
import { resolveIeltsTestById } from '../../src/utils/ieltsTestCatalog'
import { evaluateReadingAnswers } from '../../src/utils/ieltsUtils'
import type { TestResult } from '../../src/types/ieltsTypes'

// Independent transcription of the user's answer screenshot.
const key = [
  'C', 'A', 'B', 'B', 'B', 'C', 'C', 'A', 'COTEHELE', 'SH12 1LQ',
  'travelling', 'get good shoes', 'wearing formal clothes', 'large office', 'good pay', 'live nearby', 'B', 'C', 'B', 'A',
  'share ideas', 'deeper research', 'Mountain building', '17th May', '29th May', '30-40 minutes', 'questions', 'articles', 'internet', 'photocopy',
  'a huge increase', 'internal clock', 'light dark', 'unsocial hours', 'stomach', 'depression', 'mental ability', 'performance', 'family life', 'peer group',
]
const answers = Object.fromEntries(key.map((answer, i) => [`lt3-jan2026-q${i + 1}`, answer]))
const container = document.getElementById('root')!
const Interface = (props: React.ComponentProps<typeof ListeningInterface>) => <MemoryRouter><ListeningInterface {...props} /></MemoryRouter>
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
  assert.equal(getIeltsFullTestCatalog('listening')[2].testId, test.id)
  assert.equal(mockListeningTests.filter(item => item.id === test.id).length, 1)
  assert.equal(evaluateReadingAnswers(test.sections, answers).summary.correctAnswers, 40)
  assert.equal(evaluateReadingAnswers(test.sections, {}).summary.skippedAnswers, 40)
  for (const [number, wrong] of [[1, 'A'], [9, 'COTEHELE Rd'], [10, 'SH12 1LO'], [13, 'wearing'], [24, '16th May'], [26, '30 minutes'], [33, 'light'], [37, 'mental'], [39, 'family']] as const) {
    assert.equal(evaluateReadingAnswers(test.sections, { ...answers, [`lt3-jan2026-q${number}`]: wrong }).summary.correctAnswers, 39)
  }
  for (const [number, variant] of [[10, 'SH121LQ'], [11, 'traveling'], [22, 'much deeper research'], [27, 'discussion'], [27, 'questions and discussion'], [28, 'articles from journal'], [33, 'light and dark'], [40, 'friends']] as const) {
    assert.equal(evaluateReadingAnswers(test.sections, { ...answers, [`lt3-jan2026-q${number}`]: variant }).summary.correctAnswers, 40)
  }
  const audio = readFileSync(`public${test.continuousAudioUrl}`)
  assert.equal(audio.length, 10606015)
  assert.equal(createHash('sha256').update(audio).digest('hex'), '95f1c226a60f064a8982036a90d83be8bd11e0f2aa1718a1759bbc1910944979')
  assert.ok(test.sections.every(section => section.questions.every(question => question.explanation && question.location)))
  assert.equal(listeningFullTest1.sections[0].title, 'Cycling Holiday in Austria')
  assert.equal(listeningFullTest1.continuousAudioUrl, '/audio/ielts-listening/test1-part1.mp3')
  assert.equal(resolveIeltsTestById(test.id), test)
  const oldAnswers = Object.fromEntries(archivedListeningFullTest3.sections.flatMap(s => s.questions.map(q => [q.id, Array.isArray(q.correctAnswer) ? q.correctAnswer[0] : q.correctAnswer.split(/[\/;|]/)[0].trim()])))
  assert.equal(resolveIeltsTestById(test.id, { answers: oldAnswers }), archivedListeningFullTest3)
  assert.equal(resolveIeltsTestById(test.id, { answers: {}, detailedBreakdown: { activeSectionIds: ['lt3-part4'] } }), archivedListeningFullTest3)
  assert.equal(evaluateReadingAnswers(archivedListeningFullTest3.sections, oldAnswers).summary.correctAnswers, 40)
  assert.equal(evaluateReadingAnswers(test.sections, oldAnswers).summary.skippedAnswers, 40)

  localStorage.clear()
  let submitted: TestResult | undefined
  let root = createRoot(container)
  await act(async () => root.render(<Interface test={test} launchPreset={{ mode: 'practice' }} onComplete={result => { submitted = result }} onExit={() => {}} />))
  await delay(2400)
  const audioElement = container.querySelector('audio')!
  assert.equal(audioElement.getAttribute('src'), test.continuousAudioUrl)
  audioElement.currentTime = 120
  assert.ok(!container.querySelector('.reading-toolbar')!.textContent!.match(/\d+:\d{2}/), 'Listening has no countdown')
  for (let number = 1; number <= 4; number++) {
    if (number > 1) await part(number)
    assert.equal(container.querySelector('audio'), audioElement, 'Part navigation keeps the audio element')
    assert.equal(audioElement.currentTime, 120)
    for (const question of test.sections[number - 1].questions) {
      assert.equal(container.querySelectorAll(`#question-card-${question.id}`).length, 1)
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
  const persisted = JSON.parse(JSON.stringify(submitted))
  const reviewTest = resolveIeltsTestById(test.id, persisted)!
  await act(async () => root.render(<Interface test={reviewTest} reviewPayload={{ result: persisted, showCorrectAnswers: true }} onComplete={() => assert.fail('Review submitted')} onExit={() => {}} />))
  for (let number = 1; number <= 4; number++) {
    if (number > 1) await part(number)
    assert.equal(container.querySelector('audio')!.getAttribute('src'), test.continuousAudioUrl)
    for (const question of test.sections[number - 1].questions) {
      const card = container.querySelector(`#question-card-${question.id}`)!
      assert.ok(card)
      if (question.type !== 'multiple-choice') {
        const input = card.querySelector<HTMLInputElement>('input')!
        assert.equal(input.value, key[question.number - 1])
        assert.equal(input.disabled, true)
      }
    }
  }
  await act(async () => root.unmount())
  // Both Analyze and Full Mock entry routes must recover the replaced paper.
  const oldResult: TestResult = {
    testId: test.id, date: '2026-10-06', score: 9, correctAnswers: 40,
    totalQuestions: 40, timeSpent: 1800, answers: oldAnswers,
    detailedBreakdown: { activeSectionIds: archivedListeningFullTest3.sections.map(section => section.id) },
  }
  for (const sourceTest of [undefined, test]) {
    root = createRoot(container)
    await act(async () => root.render(
      <MemoryRouter initialEntries={[{ pathname: `/test/listening/${test.id}`, state: { sourceTest, reviewPayload: { result: oldResult, showCorrectAnswers: true } } }]}>
        <Routes><Route path="/test/:type/:id" element={<TestInterface />} /></Routes>
      </MemoryRouter>,
    ))
    assert.ok(container.querySelector('#question-card-lt3-q1'))
    assert.equal(container.querySelector('audio')!.getAttribute('src'), '/audio/ielts-listening/test1-part1.mp3')
    assert.match(container.textContent!, /Cycling holiday in Austria/i)
    await act(async () => root.unmount())
  }
  console.log('PASS: slot 3, original MP3 checksum, 40 screenshot answers, strict variants, saved session, submission, band 9, persisted Analyze and archived-paper review')
}
