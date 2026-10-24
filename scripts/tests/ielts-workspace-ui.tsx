import assert from 'node:assert/strict'
import { act, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import IELTSReadingInterface from '@/components/IELTSReadingInterface'
import Timer from '@/components/Timer'
import { accountStorageFor } from '@/utils/accountStorage'
import i18n from '@/i18n'
import { workspaceReading as test } from '../fixtures/ielts-workspace'

export async function run() {
  await i18n.changeLanguage('en')
  localStorage.clear()
  const container = document.getElementById('root')!
  let root = createRoot(container)
  const storage = accountStorageFor('guest')
  const sessionKey = `ielts_test_session_${test.id}`
  const mount = async (preset = true) => {
    await act(async () => root.render(<StrictMode><MemoryRouter><IELTSReadingInterface test={test} launchPreset={preset ? { mode: 'practice', partIndex: 2, durationMinutes: 20 } : undefined} onComplete={() => {}} onExit={() => {}} /></MemoryRouter></StrictMode>))
  }
  const click = async (text: string) => {
    const button = Array.from(container.querySelectorAll('button')).find(node => node.textContent?.trim() === text)
    assert.ok(button, `Button: ${text}`)
    await act(async () => button.click())
  }
  const flush = async () => { await act(async () => window.dispatchEvent(new window.Event('pagehide'))) }
  try {
    await mount()
    assert.ok(container.querySelector('[role="dialog"]'))
    assert.equal(container.querySelector('.reading-toolbar'), null, 'Selecting Part 2 cannot start an exam')
    assert.ok(container.textContent?.includes('20 Minutes'))
    await act(async () => container.querySelector<HTMLButtonElement>('[role="switch"]')!.click())
    assert.equal(storage.getItem('ielts:ask-ai-enabled'), 'false')
    await click('Start Training Session')
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 400)) })
    assert.equal(container.querySelector('[role="dialog"]'), null)
    assert.equal(container.querySelector('[aria-label="Go to Part 1"]'), null)
    assert.ok(container.querySelector('[aria-label="Go to Part 2"]'))
    const choice = container.querySelector<HTMLSelectElement>('select')!
    assert.ok(choice, 'Matching uses a keyboard accessible select')
    await act(async () => { choice.value = 'B'; choice.dispatchEvent(new window.Event('change', { bubbles: true })) })
    await flush()
    let saved = JSON.parse(storage.getItem(sessionKey)!)
    assert.equal(saved.answers['p1-q1'], 'B')
    assert.deepEqual(saved.selectedParts, [1])
    assert.equal(saved.customTime, 20)
    const deadline = saved.deadline
    await act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Hide remaining time"]')!.click())
    await flush()
    assert.equal(container.querySelector('[aria-label="Show remaining time"] > span')?.hasAttribute('hidden'), true)
    assert.equal(JSON.parse(storage.getItem(sessionKey)!).deadline, deadline, 'Hiding time never resets the deadline')
    assert.equal(container.querySelector('.animate-ping'), null, 'Active question remains still')
    const divider = container.querySelector<HTMLElement>('[role="separator"]')!
    await act(async () => divider.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })))
    assert.equal(divider.getAttribute('aria-valuenow'), '52')
    await act(async () => divider.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true })))
    assert.equal(divider.getAttribute('aria-valuenow'), '50')
    await act(async () => root.unmount())
    root = createRoot(container)
    await mount(false)
    saved = JSON.parse(storage.getItem(sessionKey)!)
    assert.equal(saved.deadline, deadline)
    assert.equal(container.querySelector<HTMLSelectElement>('select')!.value, 'B')
    assert.ok(container.querySelector('[aria-label="Show remaining time"]'))
    await act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Display settings"]')!.click())
    assert.equal(container.querySelector('[role="switch"]')?.getAttribute('aria-checked'), 'false', 'Ask AI preference survives reload')
    await act(async () => document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })))
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 600)) })
    assert.equal(container.querySelector('[role="dialog"]'), null)
    await act(async () => root.unmount())
    root = createRoot(container)
    localStorage.clear()
    await mount()
    await click('Simulation Mode')
    await click('Start Simulation')
    await flush()
    saved = JSON.parse(storage.getItem(sessionKey)!)
    assert.equal(saved.testMode, 'simulation')
    assert.equal(saved.timeRemaining, 1200, 'A single Reading part gets a 20-minute simulation')
    assert.ok(container.querySelector('[aria-label="Go to Part 2"]'))
    assert.equal(container.querySelector('[aria-label="Go to Part 1"]'), null)
    await act(async () => root.unmount())
    root = createRoot(container)
    await mount(false)
    assert.ok(container.querySelector('[aria-label="Go to Part 2"]'))
    assert.equal(container.querySelector('[aria-label="Go to Part 1"]'), null, 'Reload preserves a single-part simulation')
    await act(async () => root.unmount())
    root = createRoot(container)
    let expired = 0
    const now = Date.now
    let clock = now()
    Date.now = () => clock
    try {
      await act(async () => root.render(<Timer duration={60} timeLeft={60} setTimeLeft={() => {}} isActive deadline={clock + 60_000} onTimeUp={() => expired++} />))
      clock += 45_000
      await act(async () => document.dispatchEvent(new window.Event('visibilitychange')))
      assert.ok(container.textContent?.includes('00:15'), 'Timer accounts for background-tab throttling')
      clock += 20_000
      await act(async () => document.dispatchEvent(new window.Event('visibilitychange')))
      await act(async () => document.dispatchEvent(new window.Event('visibilitychange')))
      assert.equal(expired, 1, 'An elapsed deadline fires once')
    } finally { Date.now = now }
    console.log('PASS: Part setup, practice/simulation scope, native matching, Ask AI preference, hidden running timer, original deadline, reload, keyboard resize and background timekeeping')
  } finally { await act(async () => root.unmount()) }
}
