import assert from 'node:assert/strict'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import FullMockResults from '@/components/ielts/FullMockResults'
import { getFullMockById, type FullMockSectionResult } from '@/utils/ieltsMockCatalog'
import i18n from '@/i18n'

export async function run() {
  await i18n.changeLanguage('en')
  const element = document.getElementById('root')!
  const root = createRoot(element)
  const mock = getFullMockById('full-mock-1')!
  const section: FullMockSectionResult = { band: 7, testId: 'saved', completedAt: '2026-11-06T10:00:00Z' }
  const results = { listening: section, reading: section, writing: section, speaking: { ...section, band: 0, assessmentStatus: 'pending' as const } }
  const originalTimeout = window.setTimeout
  const originalClearTimeout = window.clearTimeout
  const timers = new Map<number, () => void>()
  let timerId = 90000
  window.setTimeout = ((callback: () => void, delay?: number) => {
    if (delay === 5000) { timers.set(++timerId, callback); return timerId }
    return originalTimeout(callback, delay)
  }) as typeof window.setTimeout
  window.clearTimeout = ((id?: number) => {
    if (id && timers.delete(id)) return
    originalClearTimeout(id)
  }) as typeof window.clearTimeout
  let calls = 0
  let finish!: () => void
  const onRegrade = () => { calls++; return new Promise<void>(resolve => { finish = resolve }) }
  const render = (readOnly = false, graded = false) => act(async () => root.render(
    <FullMockResults mock={mock} results={graded ? { ...results, speaking: section } : results}
      overall={null} readOnly={readOnly} onRegrade={onRegrade} onBack={() => {}} onReview={() => {}} />,
  ))
  try {
    await render()
    assert.equal(timers.size, 1, 'Opening an old pending report schedules recovery')
    await act(async () => [...timers.values()][0]())
    assert.equal(calls, 1)
    await act(async () => {
      window.dispatchEvent(new Event('online'))
      window.dispatchEvent(new Event('online'))
    })
    assert.equal(calls, 1, 'Concurrent recovery triggers cannot send duplicate assessments')
    await act(async () => finish())
    await render()
    assert.equal(timers.size, 0, 'A render does not start an endless assessment loop')
    await render(true)
    await act(async () => window.dispatchEvent(new Event('online')))
    assert.equal(calls, 1, 'Archived reports do not assess or modify the active attempt')
    await render(false, true)
    await act(async () => window.dispatchEvent(new Event('online')))
    assert.equal(calls, 1, 'Graded reports never retry')
    await render()
    assert.equal(timers.size, 1)
    await act(async () => root.unmount())
    assert.equal(timers.size, 0, 'Leaving the report cancels scheduled recovery')
    await act(async () => window.dispatchEvent(new Event('online')))
    assert.equal(calls, 1, 'Leaving the report removes the reconnect handler')
    console.log('PASS: old pending report recovery, concurrent trigger deduplication, bounded retries, archive isolation and cleanup')
  } finally {
    window.setTimeout = originalTimeout
    window.clearTimeout = originalClearTimeout
  }
}
