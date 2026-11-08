import assert from 'node:assert/strict'
import { apiClient, ApiError } from '@/lib/apiClient'
import { ExaminerPlayback } from '@/lib/examinerPlayback'

// Exercise interrupted browser audio without microphone permissions, real
// provider calls, or waiting for wall-clock watchdogs.
export async function run() {
  const originalTimeout = globalThis.setTimeout
  const originalClear = globalThis.clearTimeout
  const originalPost = apiClient.post
  const timers = new Map<number, { callback: () => void; ms: number }>()
  let nextTimer = 1000000
  globalThis.setTimeout = ((callback: () => void, ms = 0) => {
    if (ms >= 10000) { const id = ++nextTimer; timers.set(id, { callback, ms }); return id }
    return originalTimeout(callback, ms)
  }) as typeof setTimeout
  globalThis.clearTimeout = ((id: number) => { timers.delete(id); originalClear(id) }) as typeof clearTimeout
  const tick = () => new Promise(resolve => originalTimeout(resolve, 30))
  const until = async (ready: () => boolean, label: string) => {
    for (let attempt = 0; attempt < 40; attempt++) {
      if (ready()) return
      await tick()
    }
    assert.fail(`Timed out: ${label}`)
  }
  const fire = (ms: number) => {
    const entry = [...timers].find(([, timer]) => timer.ms === ms)
    assert.ok(entry, `Expected ${ms} ms watchdog`)
    timers.delete(entry[0]); entry[1].callback()
  }
  let player: FakeAudio
  let blocked = false
  class FakeAudio {
    src = ''; currentTime = 0; ended = false; plays = 0
    onplaying: (() => void) | null = null
    onended: (() => void) | null = null
    ontimeupdate: (() => void) | null = null
    onerror: (() => void) | null = null
    constructor() { player = this }
    play() {
      this.plays++
      if (blocked) return Promise.reject(new DOMException('Gesture required', 'NotAllowedError'))
      this.onplaying?.()
      return Promise.resolve()
    }
    pause() {}
    setAttribute() {}
  }
  let utterance: { onstart?: () => void; onend?: () => void; onerror?: () => void }
  class FakeUtterance { constructor(readonly text: string) {} }
  Object.defineProperty(globalThis, 'Audio', { value: FakeAudio, configurable: true })
  Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', { value: FakeUtterance, configurable: true })
  Object.defineProperty(window, 'speechSynthesis', { value: Object.assign(new window.EventTarget(), {
    getVoices: () => [{ name: 'Daniel', lang: 'en-GB' }], cancel() {}, resume() {}, speaking: false,
    speak(value: typeof utterance) { utterance = value; value.onstart?.() },
  }), configurable: true })
  URL.createObjectURL = () => 'blob:examiner-test'
  URL.revokeObjectURL = () => {}
  let failure: Error | null = null
  let requests = 0
  apiClient.post = (async () => {
    requests++
    if (failure) throw failure
    return { audioBase64: btoa('audio') }
  }) as typeof apiClient.post
  let ended = 0
  const errors: string[] = []
  const sources: string[] = []
  const callbacks = { loading() {}, started(source: string) { sources.push(source) }, ended() { ended++ }, failed(message: string) { errors.push(message) } }
  const playback = new ExaminerPlayback()
  try {
    playback.ask('First question?', 'cedar', 'male', callbacks)
    await tick()
    const oldEnd = player!.onended!
    const watchdog = [...timers.keys()][0]
    player!.ontimeupdate?.()
    assert.ok(timers.has(watchdog), 'Events without media progress cannot postpone stall detection')
    fire(15000)
    assert.equal(player!.plays, 2, 'An interrupted prompt resumes once using the same audio')
    assert.equal(requests, 1, 'Recovery does not regenerate the question')
    assert.equal(ended, 0, 'A stall cannot start candidate recording')
    fire(15000)
    await tick()
    assert.equal(sources.at(-1), 'device', 'Persistent interruptions fall back to a matching device voice')
    oldEnd()
    assert.equal(ended, 0, 'A late neural ended event cannot finish the replacement device voice')
    utterance!.onend?.()
    assert.equal(ended, 1)
    utterance!.onend?.()
    assert.equal(ended, 1, 'A prompt advances exactly once')
    playback.cancel()
    console.log('PASS: stalled examiner audio resumes once, then falls back; stale events never start recording')

    playback.ask('Second question?', 'cedar', 'male', callbacks)
    await tick()
    player!.ended = true
    fire(15000)
    assert.equal(ended, 2, 'A lost ended event recovers only after the player actually ended')
    playback.cancel()

    const before = requests
    blocked = true
    playback.ask('Blocked question?', 'cedar', 'male', callbacks)
    await tick()
    assert.equal(ended, 2)
    assert.match(errors.at(-1)!, /Tap Play examiner/)
    assert.equal(timers.size, 0, 'Blocked autoplay waits for a user gesture')
    blocked = false
    playback.resume()
    player!.onended?.()
    assert.equal(ended, 3)
    assert.equal(requests, before + 1, 'A user gesture reuses the existing audio')
    playback.cancel()
    console.log('PASS: lost completion events recover safely; autoplay requires a gesture and keeps the same audio')

    failure = new Error('Provider unavailable')
    playback.ask('Device interruption?', 'cedar', 'male', callbacks)
    await until(() => sources.at(-1) === 'device', 'device fallback starts after provider failure')
    assert.equal(sources.at(-1), 'device')
    utterance!.onerror?.()
    const deviceRequests = requests
    failure = null
    playback.resume()
    await until(() => requests === deviceRequests + 1 && sources.at(-1) === 'neural', 'natural voice recovers after a device failure')
    assert.equal(requests, deviceRequests + 1, 'A failed device voice can reconnect to the recovered provider')
    assert.equal(sources.at(-1), 'neural')
    player!.onended?.()
    assert.equal(ended, 4)
    playback.cancel()

    for (const status of [401, 403, 409, 429]) {
      failure = new ApiError(`Specific failure ${status}`, status)
      const sourceCount = sources.length
      playback.ask('Rejected question?', 'cedar', 'male', callbacks)
      await tick()
      assert.equal(errors.at(-1), failure.message, 'Account and rate-limit errors keep their real explanation')
      assert.equal(sources.length, sourceCount, 'Rejected API access cannot silently switch voices')
      assert.equal(ended, 4)
      playback.cancel()
    }
    console.log('PASS: device failures can retry natural voice; account and rate-limit errors remain visible')
  } finally {
    playback.cancel()
    apiClient.post = originalPost
    globalThis.setTimeout = originalTimeout
    globalThis.clearTimeout = originalClear
  }
}
