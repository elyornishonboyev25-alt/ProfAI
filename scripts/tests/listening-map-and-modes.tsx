import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ListeningInterface from '../../src/components/IELTSReadingInterface'
import { MemoryRouter } from 'react-router-dom'
import { listeningFullTest3 } from '../../src/data/listeningFullTest3'
import { mockListeningTests } from '../../src/data/listeningPassages'
import { evaluateReadingAnswers } from '../../src/utils/ieltsUtils'
import type { TestResult } from '../../src/types/ieltsTypes'

const container = document.getElementById('root')!
const IELTSReadingInterface = (props: React.ComponentProps<typeof ListeningInterface>) => <MemoryRouter><ListeningInterface {...props} /></MemoryRouter>
const delay = () => act(async () => { await new Promise(resolve => setTimeout(resolve, 25)) })
const click = async (label: string) => {
  const button = [...container.querySelectorAll('button')].find(el => el.textContent?.trim() === label)
  assert.ok(button, label)
  await act(async () => button.click())
}
async function part3() {
  const tab = [...container.querySelectorAll('span')].find(el => el.textContent === 'Part 3')!
  await act(async () => tab.click())
}
async function selectText() {
  const area = container.querySelector('[data-reading-markable="1"]')!
  const range = document.createRange()
  range.selectNodeContents(area.querySelector('p') ?? area)
  const selection = window.getSelection()!
  selection.removeAllRanges(); selection.addRange(range)
  await act(async () => document.dispatchEvent(new window.Event('selectionchange')))
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 150)) })
  assert.ok(container.querySelector('[data-reading-selection-toolbar]'), 'Selection toolbar appears')
}
function map() {
  assert.ok(container.querySelector('svg[data-old-water-mill] path'))
  assert.equal(container.querySelector('svg[data-old-water-mill]')!.getAttribute('viewBox'), '0 0 1194 610')
  assert.equal(container.querySelector('img, image'), null)
  for (const number of [27, 28, 29, 30]) {
    assert.equal(container.querySelectorAll(`#question-card-lt3-q${number}`).length, 1)
    assert.ok(container.querySelector(`[data-diagram-answer="${number}"] input`))
  }
}

export async function run() {
  const timeout = globalThis.setTimeout
  // Skip the launch animation, while preserving real audio completion deadlines.
  globalThis.setTimeout = ((fn: (...args: unknown[]) => void, ms?: number, ...args: unknown[]) => timeout(fn, ms === 2200 ? 0 : ms, ...args)) as typeof setTimeout
  window.Range.prototype.getClientRects = () => [new window.DOMRect(20, 100, 120, 20)] as unknown as DOMRectList
  window.Range.prototype.getBoundingClientRect = () => new window.DOMRect(20, 100, 120, 20)
  try {
    for (const { mode, savedPractice } of [
      { mode: 'simulation', savedPractice: true },
      { mode: 'simulation', savedPractice: false },
      { mode: 'practice', savedPractice: false },
    ] as const) {
      for (const test of mockListeningTests) {
        localStorage.clear()
        const sessionKey = `ielts_test_session_${test.id}`
        if (savedPractice) {
          localStorage.setItem(sessionKey, JSON.stringify({
            testMode: 'practice', selectedParts: [0], partsSelectionVersion: 2,
          }))
        }
        const root = createRoot(container)
        await act(async () => root.render(<IELTSReadingInterface test={test} launchPreset={savedPractice ? undefined : { mode }} onComplete={() => {}} onExit={() => {}} />))
        if (savedPractice) {
          const launch = [...container.querySelectorAll('button')].find(el => el.textContent?.trim() === 'Launch Final Simulation')
          assert.ok(launch, `${test.id}: simulation launch card`)
          await act(async () => launch.click())
        }
        await delay()
        await click('Play')
        assert.equal(JSON.parse(localStorage.getItem(sessionKey)!).testMode, mode, `${test.id}: launched mode`)
        const audio = container.querySelector('audio')!
        const controls = container.querySelector('[aria-label="Practice audio controls"]')
        assert.equal(Boolean(controls), mode === 'practice', `${test.id}: mode controls`)
        assert.equal(audio.controls, false)
        Object.defineProperty(audio, 'duration', { configurable: true, value: 100 })
        await act(async () => audio.dispatchEvent(new window.Event('loadedmetadata')))
        audio.currentTime = 20
        await act(async () => audio.dispatchEvent(new window.Event('timeupdate')))
        audio.currentTime = 70
        await act(async () => audio.dispatchEvent(new window.Event('seeking')))
        assert.equal(audio.currentTime, mode === 'simulation' ? 20 : 70, `${test.id}: seek restriction`)
        audio.playbackRate = 2
        await act(async () => audio.dispatchEvent(new window.Event('ratechange')))
        assert.equal(audio.playbackRate, mode === 'simulation' ? 1 : 2, `${test.id}: playback speed`)
        await act(async () => audio.dispatchEvent(new window.Event('pause')))
        if (mode === 'simulation') assert.match(container.textContent!, /Playing/)
        await selectText()
        const ask = [...container.querySelectorAll('button')].find(el => el.textContent?.trim() === 'Ask AI')
        assert.equal(Boolean(ask), mode === 'practice', `${test.id}: Ask AI availability`)
        if (mode === 'practice') {
          await click('Resume')
          await act(async () => controls!.querySelector<HTMLButtonElement>('[aria-label="Back 10 seconds"]')!.click())
          assert.equal(audio.currentTime, 60)
          await act(async () => controls!.querySelector<HTMLButtonElement>('[aria-label="Forward 10 seconds"]')!.click())
          assert.equal(audio.currentTime, 70)
          await click('Pause')
          assert.match(controls!.textContent!, /Resume/)
        }
        await act(async () => root.unmount())
      }
    }
    console.log('PASS: all 30 Listening tests hide Ask AI, pause and seek in Simulation, including launches after saved Practice; Practice retains AI, pause and +/-10s; external seeking and speed changes are blocked only in Simulation')

    localStorage.clear()
    const root = createRoot(container)
    await act(async () => root.render(<IELTSReadingInterface test={listeningFullTest3} launchPreset={{ mode: 'practice' }} onComplete={() => {}} onExit={() => {}} />))
    await delay(); await click('Play'); await part3(); map()
    for (const [number, letter] of [[27, 'b'], [28, 'a'], [29, 'e'], [30, 'g']] as const) {
      const input = container.querySelector<HTMLInputElement>(`[data-diagram-answer="${number}"] input`)!
      assert.equal(input.maxLength, 1)
      await act(async () => {
        Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!.call(input, letter)
        input.dispatchEvent(new window.Event('input', { bubbles: true }))
      })
      assert.equal(input.value, letter.toUpperCase())
    }
    const saved = JSON.parse(localStorage.getItem(`ielts_test_session_${listeningFullTest3.id}`)!).answers
    assert.equal(evaluateReadingAnswers(listeningFullTest3.sections, saved).summary.correctAnswers, 4)
    await act(async () => root.unmount())

    const source = JSON.parse(readFileSync('scripts/fixtures/listening-audit-source-keys.json', 'utf8'))['3'].answers as string[]
    const perfect = Object.fromEntries(source.map((answer, i) => [`lt3-q${i + 1}`, answer]))
    assert.equal(evaluateReadingAnswers(listeningFullTest3.sections, perfect).summary.correctAnswers, 40)
    const result = { testId: listeningFullTest3.id, answers: saved, correctAnswers: 4, totalQuestions: 40, score: 2, date: new Date().toISOString(), timeSpent: 100 } as TestResult
    const legacy = JSON.parse(JSON.stringify(listeningFullTest3))
    legacy.sections[2].groups[1].blocks = [
      { kind: 'image', src: 'https://www.profai.uz/images/ielts-listening/test3-old-water-mill.svg?v=old', caption: 'Old water-mill' },
      { kind: 'grid', columns: ['A', 'B', 'C', 'D', 'E', 'F', 'G'], rows: [27, 28, 29, 30].map(blank => ({ blank, label: `Location ${blank}` })) },
    ]
    const review = createRoot(container)
    await act(async () => review.render(<IELTSReadingInterface test={legacy} reviewPayload={{ result: JSON.parse(JSON.stringify(result)), showCorrectAnswers: true }} onComplete={() => assert.fail('Review submitted')} onExit={() => {}} />))
    await part3(); map()
    for (const number of [27, 28, 29, 30]) {
      const input = container.querySelector<HTMLInputElement>(`[data-diagram-answer="${number}"] input`)!
      assert.ok(input.disabled)
      assert.equal(input.value, saved[`lt3-q${number}`])
    }
    await act(async () => review.unmount())
    console.log('PASS: original Full Test 3 plan, four unique letter fields, persistence, unchanged 40/40 key and legacy saved Analyze')
  } finally {
    globalThis.setTimeout = timeout
  }
}
