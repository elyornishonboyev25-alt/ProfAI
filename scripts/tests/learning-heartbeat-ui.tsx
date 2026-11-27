import assert from 'node:assert/strict'
import { startLearningHeartbeat } from '@/lib/learningHeartbeat'

export async function run() {
  const originalInterval = window.setInterval
  const originalClear = window.clearInterval
  let tick: () => void = () => {}
  let visible = true
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => !visible })
  window.setInterval = ((callback: () => void) => { tick = callback; return 1 }) as typeof window.setInterval
  window.clearInterval = () => {}
  const settle = async () => { for (let i = 0; i < 8; i++) await Promise.resolve() }
  const received: number[] = []
  let calls = 0
  let finish: ((value: number) => void) | undefined
  const stop = startLearningHeartbeat(async () => {
    calls++
    if (calls === 1) throw new Error('Offline')
    return new Promise<number>(resolve => { finish = resolve })
  }, reward => received.push(reward))
  try {
    await settle()
    assert.equal(calls, 1)
    window.dispatchEvent(new Event('online'))
    await settle()
    assert.equal(calls, 2, 'Reconnection retries immediately')
    window.dispatchEvent(new Event('focus'))
    tick()
    await settle()
    assert.equal(calls, 2, 'Focus and timer do not overlap an in-flight save')
    finish!(37)
    await settle()
    assert.deepEqual(received, [37])
    visible = false
    tick()
    window.dispatchEvent(new Event('online'))
    await settle()
    assert.equal(calls, 2, 'A hidden tab does not manufacture active days')
    visible = true
    document.dispatchEvent(new Event('visibilitychange'))
    await settle()
    assert.equal(calls, 3, 'Returning to the tab saves a new visit immediately')
    stop()
    finish!(38)
    await settle()
    assert.deepEqual(received, [37], 'A disposed account session cannot apply a late reward')
    window.dispatchEvent(new Event('focus'))
    tick()
    await settle()
    assert.equal(calls, 3)
    console.log('Learning heartbeat: reconnect, midnight resume, overlap and cleanup passed.')
  } finally {
    stop()
    window.setInterval = originalInterval
    window.clearInterval = originalClear
  }
}
