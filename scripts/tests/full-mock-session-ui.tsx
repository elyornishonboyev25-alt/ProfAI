import assert from 'node:assert/strict'
import { StrictMode, act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import IELTSReadingInterface from '@/components/IELTSReadingInterface'
import { listeningFullTest15 } from '@/data/listeningFullTest15'
import { fullReadingTest } from '@/data/fullReadingTest'
import { accountStorageFor } from '@/utils/accountStorage'
import { calculateBandScore } from '@/utils/ieltsUtils'
import type { IELTSTest, TestResult } from '@/types/ieltsTypes'
import i18n from '@/i18n'

export async function run() {
  await i18n.changeLanguage('en')
  const element = document.getElementById('root')!
  const storage = accountStorageFor('guest')
  const originalTimeout = globalThis.setTimeout
  const originalWindowTimeout = window.setTimeout.bind(window)
  const originalClear = window.clearTimeout.bind(window)
  const originalNow = Date.now
  let now = originalNow()
  Date.now = () => now
  globalThis.setTimeout = ((fn: (...args: unknown[]) => void, ms?: number, ...args: unknown[]) => originalTimeout(fn, ms === 2200 ? 0 : ms, ...args)) as typeof setTimeout
  let captureGrace = false
  let nextTimer = 100000
  const graceTimers = new Map<number, { fn: () => void; ms: number }>()
  window.setTimeout = ((fn: () => void, ms?: number, ...args: unknown[]) => {
    if (captureGrace && (ms === 20000 || ms === 1000 || ms === 0)) { const id = ++nextTimer; graceTimers.set(id, { fn, ms: ms! }); return id }
    return originalWindowTimeout(fn, ms, ...args)
  }) as typeof window.setTimeout
  window.clearTimeout = id => { graceTimers.delete(id); originalClear(id) }
  let root: ReturnType<typeof createRoot> | undefined
  const results: TestResult[] = []
  const unmount = async () => { if (root) { await act(async () => root!.unmount()); root = undefined } }
  const mount = async (test: IELTSTest, mockId: string, strict = false) => {
    await unmount()
    root = createRoot(element)
    const node = <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><IELTSReadingInterface test={test} fullMockId={mockId} launchPreset={{ mode: 'simulation' }} onComplete={result => results.push(result)} onExit={() => {}} /></MemoryRouter>
    await act(async () => root!.render(strict ? <StrictMode>{node}</StrictMode> : node))
    await act(async () => { await new Promise(resolve => originalTimeout(resolve, 30)) })
  }
  const click = async (label: string) => {
    const button = [...element.querySelectorAll<HTMLButtonElement>('button')].find(node => node.textContent?.trim() === label)
    assert.ok(button, label)
    await act(async () => button.click())
  }
  const enterAnswer = async () => {
    const input = element.querySelector<HTMLInputElement>('input:not([type="range"])')!
    assert.ok(input)
    await act(async () => {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!.call(input, 'Preserved answer')
      input.dispatchEvent(new window.Event('input', { bubbles: true }))
    })
  }
  try {
    assert.equal(calculateBandScore(0, 0), 0)
    assert.equal(calculateBandScore(0, 40), 2, 'Answered but incorrect papers keep their existing conversion')
    assert.equal(calculateBandScore(40, 40), 9)
    for (const strict of [false, true]) {
      for (const playlist of [false, true]) {
        localStorage.clear()
        const test = playlist ? { ...listeningFullTest15, continuousAudioUrl: undefined, sections: listeningFullTest15.sections.map((section, i) => ({ ...section, audioUrl: `/audio/part-${i}.mp3` })) } : listeningFullTest15
        const mockId = strict ? 'full-mock-30' : 'full-mock-15'
        const key = `ielts_test_session_${test.id}:mock:${mockId}`
        await mount(test, mockId, strict)
        await click('Play')
        await enterAnswer()
        if (playlist) {
          await act(async () => element.querySelector('audio')!.dispatchEvent(new window.Event('ended')))
          await act(async () => element.querySelector('audio')!.dispatchEvent(new window.Event('ended')))
        }
        const audio = element.querySelector('audio')!
        audio.currentTime = 123
        await act(async () => audio.dispatchEvent(new window.Event('timeupdate')))
        const before = JSON.parse(storage.getItem(key)!)
        assert.ok(Object.values(before.answers).includes('Preserved answer'))
        assert.equal(before.audioCurrentTime, 123)
        assert.equal(before.currentAudioIndex, playlist ? 2 : 0)
        await unmount()
        now += 15_000
        await mount(test, mockId, strict)
        assert.equal(element.querySelector<HTMLInputElement>('input:not([type="range"])')!.value, 'Preserved answer')
        assert.deepEqual(JSON.parse(storage.getItem(key)!).answers, before.answers, 'Launch preset must not overwrite restored answers')
        const resumed = element.querySelector('audio')!
        Object.defineProperty(resumed, 'duration', { configurable: true, value: 600 })
        await act(async () => resumed.dispatchEvent(new window.Event('loadedmetadata')))
        assert.equal(resumed.currentTime, 123)
        assert.equal(resumed.getAttribute('src'), playlist ? '/audio/part-2.mp3' : test.continuousAudioUrl)
        await click('Play')
        assert.equal(resumed.currentTime, 123, 'User gesture resumes the saved position')
        assert.equal(storage.getItem(`ielts_test_session_${test.id}`), null, 'Mock session does not write over practice')
        await unmount()
        console.log(`PASS: Listening reload: ${playlist ? 'playlist' : 'continuous'}, StrictMode=${strict}; answers, track and position retained`)
      }
      localStorage.clear()
      const key = `ielts_test_session_${fullReadingTest.id}:mock:full-mock-1`
      await mount(fullReadingTest, 'full-mock-1', strict)
      await enterAnswer()
      await unmount()
      const saved = JSON.parse(storage.getItem(key)!)
      saved.timeRemaining = 1200
      saved.deadline = now + 1200_000
      storage.setItem(key, JSON.stringify(saved))
      now += 15_000
      await mount(fullReadingTest, 'full-mock-1', strict)
      assert.equal(element.querySelector<HTMLInputElement>('input:not([type="range"])')!.value, 'Preserved answer')
      assert.ok(element.querySelector('.ielts-exam-timer')?.textContent?.includes('19:45'), 'Reload continues the original deadline, not 60:00')
      assert.equal(JSON.parse(storage.getItem(key)!).deadline, saved.deadline)
      await unmount()
      console.log(`PASS: Reading reload, StrictMode=${strict}: answers retained, deadline never extended`)
    }

    localStorage.clear()
    results.length = 0
    await mount(listeningFullTest15, 'full-mock-15')
    await click('Play')
    await enterAnswer()
    captureGrace = true
    await act(async () => element.querySelector('audio')!.dispatchEvent(new window.Event('ended')))
    assert.equal([...graceTimers.values()][0]?.ms, 20000)
    await unmount()
    assert.equal(graceTimers.size, 0)
    now += 19_000
    await mount(listeningFullTest15, 'full-mock-15')
    assert.equal([...graceTimers.values()][0]?.ms, 1000, 'Refresh keeps only the remaining grace time')
    await act(async () => { for (const timer of graceTimers.values()) timer.fn() })
    assert.equal(results.length, 0, 'Never submit before 20 seconds')
    now += 1001
    await act(async () => { for (const timer of [...graceTimers.values()]) timer.fn() })
    assert.equal(results.length, 1)
    assert.ok(Object.values(results[0].answers).includes('Preserved answer'))
    assert.equal(storage.getItem(`ielts_test_session_${listeningFullTest15.id}:mock:full-mock-15`), null, 'Submitted session stays cleared')
    assert.equal(element.querySelector('.ielts-exam-timer'), null)
    console.log('PASS: Reload during final audio grace period: exactly original +20 seconds, latest answers, no countdown or duplicate submission')
    await unmount()
    captureGrace = false
    results.length = 0
    const expiredKey = `ielts_test_session_${fullReadingTest.id}:mock:full-mock-1`
    storage.setItem(expiredKey, JSON.stringify({
      isTestActive: true, testMode: 'simulation', timeRemaining: 0, deadline: now - 1,
      timestamp: now, startedAt: now - 3_600_000,
      answers: { [fullReadingTest.sections[0].questions[0].id]: 'Preserved answer' },
    }))
    await mount(fullReadingTest, 'full-mock-1')
    await act(async () => { await new Promise(resolve => originalTimeout(resolve, 3200)) })
    assert.equal(results.length, 1, 'Expired Reading resumes by submitting, never freezing at 00:00 or restarting')
    assert.ok(Object.values(results[0].answers).includes('Preserved answer'))
    assert.equal(storage.getItem(expiredKey), null)
    console.log('PASS: Expired Reading reload submits once with the saved answers')
  } finally {
    await unmount()
    globalThis.setTimeout = originalTimeout
    window.setTimeout = originalWindowTimeout
    window.clearTimeout = originalClear
    Date.now = originalNow
    localStorage.clear()
  }
}
