import assert from 'node:assert/strict'
import { cancelCoachAudio, canRetryCoachAudio, retryCoachAudio, speakCoachAudio, unlockCoachAudio } from '@/lib/coachAudio'
import { useAuthStore } from '@/store/authStore'

export async function run() {
  const originalFetch = globalThis.fetch
  const originalAudio = globalThis.Audio
  const players: FakeAudio[] = []
  const requests: any[] = []
  let deviceSpeech = 0
  let failVoice = false
  let transientFailures = 0
  let stallStart = false
  const nativeTimeout = globalThis.setTimeout
  let watchdog: (() => void) | null = null
  globalThis.setTimeout = ((callback: () => void, delay?: number, ...args: unknown[]) => {
    if (delay === 10_000 || delay === 15_000) { watchdog = callback; return 999999 }
    return nativeTimeout(callback, delay, ...args)
  }) as typeof setTimeout
  class FakeAudio {
    src = ''
    onplaying: (() => void) | null = null
    onended: (() => void) | null = null
    onerror: (() => void) | null = null
    paused = true
    constructor() { players.push(this) }
    setAttribute() {}
    async play() { this.paused = false; if (!stallStart) this.onplaying?.() }
    pause() { this.paused = true }
  }
  Object.defineProperty(globalThis, 'Audio', { configurable: true, value: FakeAudio })
  Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: { getVoices: () => [{ name: 'Google UK English Female', lang: 'en-GB' }], speak: () => { deviceSpeech++ }, cancel() {}, resume() {} } })
  useAuthStore.setState({ user: { id: 'voice-audio', role: 'ADMIN' } as any, accessToken: 'test-token' })
  globalThis.fetch = async (url, options) => {
    assert.ok(String(url).endsWith('/ai/speaking-audio/voice'), 'Nova calls the exact Speaking mock audio endpoint')
    const payload = JSON.parse(String(options?.body))
    requests.push(payload)
    assert.equal(payload.voice, 'marin')
    assert.ok(payload.text.length <= 1500)
    if (failVoice || transientFailures-- > 0) return new Response(JSON.stringify({ message: 'Unavailable' }), { status: 503 })
    return new Response(JSON.stringify({ audioBase64: btoa('fake-audio'), mimeType: 'audio/mpeg' }), { headers: { 'Content-Type': 'application/json' } })
  }
  const settle = () => new Promise(resolve => setTimeout(resolve, 20))
  const events: string[] = []
  const callbacks = { loading: (loading: boolean) => { if (loading) events.push('loading') }, started: () => events.push('started'), ended: () => events.push('ended'), failed: () => events.push('failed') }
  try {
    unlockCoachAudio(); unlockCoachAudio()
    assert.equal(players.length, 1, 'The same mobile media element is unlocked and retained across turns')
    speakCoachAudio('Let’s practise your answer.', 'en', callbacks)
    await settle()
    assert.ok(events.includes('started'))
    assert.ok(!events.includes('ended'), 'Recording must wait until audio actually finishes')
    assert.equal(requests[0].language, undefined, 'English uses the exact Speaking mock request')
    players[0].onended?.()
    assert.equal(events.at(-1), 'ended')
    assert.equal(canRetryCoachAudio(), false)
    events.length = 0
    speakCoachAudio('O‘zbekcha tushuntirish.', 'uz', callbacks)
    await settle()
    assert.equal(requests.at(-1).language, 'uz')
    cancelCoachAudio()
    assert.equal(players[0].paused, true)
    assert.equal(players[0].onended, null, 'Cancellation detaches callbacks so old audio cannot start a new turn')
    assert.equal(canRetryCoachAudio(), false)
    const before = requests.length
    const longReply = Array.from({ length: 230 }, (_, index) => `Sentence ${index}.`).join(' ')
    speakCoachAudio(longReply, 'ru', callbacks)
    await settle()
    assert.ok(requests[before].text.length <= 360, 'The opening starts without synthesizing a whole long reply')
    assert.equal(requests.length, before + 2, 'Only the next part is prefetched during current playback')
    for (let part = 0; part < 20 && canRetryCoachAudio(); part++) { players[0].onended?.(); await settle() }
    assert.equal(requests.slice(before).map(part => part.text).join(' '), longReply, 'Long replies keep every word while using bounded audio requests')
    assert.equal(canRetryCoachAudio(), false)
    transientFailures = 1; events.length = 0
    const retryCount = requests.length
    speakCoachAudio('A transient gateway failure.', 'en', callbacks)
    await settle()
    assert.equal(requests.length, retryCount + 2, 'A transient synthesis failure retries once automatically')
    assert.equal(events.at(-1), 'started')
    assert.ok(!events.includes('failed'))
    players[0].onended?.()
    failVoice = true; events.length = 0
    speakCoachAudio('Try this reply.', 'en', callbacks)
    await settle()
    assert.equal(events.at(-1), 'failed')
    assert.equal(deviceSpeech, 0, 'Nova never silently falls back to the robotic device voice')
    assert.equal(canRetryCoachAudio(), true)
    failVoice = false
    retryCoachAudio(); await settle()
    assert.equal(events.at(-1), 'started')
    players[0].onended?.()
    assert.equal(events.at(-1), 'ended')
    events.length = 0; stallStart = true
    speakCoachAudio('Recover a stalled player.', 'en', callbacks)
    await settle()
    const stalledEnd = players[0].onended
    ;(watchdog as (() => void) | null)?.()
    assert.equal(events.at(-1), 'failed', 'A player that never starts surfaces a retry instead of hanging')
    stalledEnd?.()
    players[0].onplaying?.()
    assert.equal(events.filter(event => event === 'failed').length, 1, 'Late media events cannot repeat a failure')
    assert.ok(!events.includes('ended') && !events.includes('started'), 'A late event cannot reopen the microphone after failure')
    stallStart = false
    retryCoachAudio(); await settle()
    assert.equal(events.at(-1), 'started', 'The same unlocked player resumes after a start stall')
    players[0].onended?.()
    assert.equal(players.length, 1)
    console.log('PASS: Speaking mock voice parity, native-language requests, actual playback completion, bounded full replies, cancellation and natural-audio retry')
  } finally {
    cancelCoachAudio()
    globalThis.fetch = originalFetch
    globalThis.setTimeout = nativeTimeout
    Object.defineProperty(globalThis, 'Audio', { configurable: true, value: originalAudio })
  }
}
