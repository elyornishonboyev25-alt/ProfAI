import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import assert from 'node:assert/strict'
import IELTSReadingInterface from '../../src/components/IELTSReadingInterface'
import { listeningFullTest15 } from '../../src/data/listeningFullTest15'
import type { IELTSTest, TestResult } from '../../src/types/ieltsTypes'

const container = document.getElementById('root')!
const delay = (ms: number) => act(async () => { await new Promise(resolve => setTimeout(resolve, ms)) })
const base: IELTSTest = { ...listeningFullTest15, duration: 0.01 }

export async function run() {
  const originalTimeout = window.setTimeout.bind(window)
  const originalClear = window.clearTimeout.bind(window)
  const originalNow = Date.now
  let now = originalNow()
  Date.now = () => now
  const deadlines = new Map<number, () => void>()
  let counter = 100000
  window.setTimeout = ((fn: () => void, ms: number, ...args: unknown[]) => {
    if (ms === 20000) { const id = ++counter; deadlines.set(id, fn); return id }
    return originalTimeout(fn, ms, ...args)
  }) as typeof window.setTimeout
  window.clearTimeout = id => { deadlines.delete(id); originalClear(id) }
  const fire = async () => {
    now += 20001
    await act(async () => { for (const fn of [...deadlines.values()]) fn() })
  }
  const ended = () => act(async () => { container.querySelector('audio')!.dispatchEvent(new window.Event('ended')) })
  const click = async (label: string) => {
    const button = [...container.querySelectorAll('button')].find(el => el.textContent?.trim() === label)
    assert.ok(button, label)
    await act(async () => button.click())
  }
  try {
    for (const playlist of [false, true]) {
      localStorage.clear()
      const results: TestResult[] = []
      const test = playlist ? { ...base, continuousAudioUrl: undefined, sections: base.sections.map((s, i) => ({ ...s, audioUrl: `/part-${i}.mp3` })) } : base
      const root = createRoot(container)
      await act(async () => root.render(<IELTSReadingInterface test={test} launchPreset={{ mode: 'simulation' }} onComplete={r => results.push(r)} onExit={() => {}} />))
      await delay(2400)
      assert.ok(!container.querySelector('.reading-toolbar')!.textContent!.match(/\d+:\d{2}/), 'Listening has no countdown')
      assert.equal(results.length, 0, 'Short nominal duration must not submit Listening')
      await click('Play')
      if (playlist) {
        for (let i = 1; i < 4; i++) {
          await ended()
          assert.equal(container.querySelector('audio')!.getAttribute('src'), `/part-${i}.mp3`)
          assert.equal(deadlines.size, 0, 'Intermediate tracks must not start grace period')
        }
      }
      await act(async () => container.querySelector('audio')!.dispatchEvent(new window.Event('error')))
      assert.equal(deadlines.size, 0, 'Audio failure must not submit')
      await act(async () => container.querySelector('audio')!.dispatchEvent(new window.Event('canplay')))
      await ended()
      assert.equal(deadlines.size, 1)
      const deadlineId = [...deadlines.keys()][0]
      const input = container.querySelector('input[placeholder="1"]')!
      await act(async () => {
        Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!.call(input, '14 September')
        input.dispatchEvent(new window.Event('input', { bubbles: true }))
      })
      assert.equal([...deadlines.keys()][0], deadlineId, 'Editing answers must not restart the 20 seconds')
      await act(async () => deadlines.get(deadlineId)!())
      assert.equal(results.length, 0, 'No submission before the deadline')
      await fire()
      assert.equal(results.length, 1)
      assert.equal(results[0].answers['lt15-q1'], '14 September', 'Submit latest answers')
      assert.equal(results[0].correctAnswers, 1)
      await fire()
      assert.equal(results.length, 1, 'Submit once')
      await act(async () => root.unmount())
      assert.equal(deadlines.size, 0)

      const reviewRoot = createRoot(container)
      await act(async () => reviewRoot.render(<IELTSReadingInterface test={test} reviewPayload={{ result: results[0], showCorrectAnswers: true }} onComplete={() => assert.fail('Review must not submit')} onExit={() => {}} />))
      await ended()
      assert.equal(deadlines.size, 0, 'Review is not a timed attempt')
      await act(async () => reviewRoot.unmount())
    }

    localStorage.clear()
    const manualResults: TestResult[] = []
    const manualRoot = createRoot(container)
    await act(async () => manualRoot.render(<IELTSReadingInterface test={base} launchPreset={{ mode: 'practice' }} onComplete={r => manualResults.push(r)} onExit={() => {}} />))
    await delay(2400)
    await click('Play')
    await ended()
    assert.equal(deadlines.size, 1)
    await click('Submit')
    await click('Submit test')
    await click('Check score')
    assert.equal(deadlines.size, 0, 'Manual submit cancels automatic submission')
    await delay(3200)
    assert.equal(manualResults.length, 1)
    await fire()
    assert.equal(manualResults.length, 1)
    await act(async () => manualRoot.unmount())

    localStorage.clear()
    const root = createRoot(container)
    await act(async () => root.render(<IELTSReadingInterface test={base} launchPreset={{ mode: 'practice' }} onComplete={() => assert.fail('Unmounted test submitted')} onExit={() => {}} />))
    await delay(2400)
    await click('Play')
    await ended()
    assert.equal(deadlines.size, 1, 'Practice also follows audio')
    await act(async () => root.unmount())
    assert.equal(deadlines.size, 0, 'Leaving clears automatic submission')

    localStorage.clear()
    const reading = { ...base, id: 'reading-timer-control', module: 'Reading' as const, duration: 60 }
    const readingRoot = createRoot(container)
    await act(async () => readingRoot.render(<IELTSReadingInterface test={reading} launchPreset={{ mode: 'simulation' }} onComplete={() => {}} onExit={() => {}} />))
    await delay(2400)
    assert.match(container.querySelector('.reading-toolbar')!.textContent!, /\d+:\d{2}/, 'Reading keeps its timer')
    await act(async () => readingRoot.unmount())
    console.log('PASS: no Listening countdown; final audio + 20s; latest answers; playlists; errors; review; unmount; Reading timer')
  } finally {
    window.setTimeout = originalTimeout
    window.clearTimeout = originalClear
    Date.now = originalNow
  }
}
