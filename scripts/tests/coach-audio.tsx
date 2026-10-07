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
  class FakeAudio {
    src = ''
    onplaying: (() => void) | null = null
    onended: (() => void) | null = null
    onerror: (() => void) | null = null
    paused = true
    constructor() { players.push(this) }
    setAttribute() {}
    async play() { this.paused = false; this.onplaying?.() }
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
    if (failVoice) return new Response(JSON.stringify({ message: 'Unavailable' }), { status: 503 })
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
    for (let part = 0; part < 4 && canRetryCoachAudio(); part++) { players[0].onended?.(); await settle() }
    assert.equal(requests.slice(before).map(part => part.text).join(' '), longReply, 'Long replies keep every word while using bounded audio requests')
    assert.equal(canRetryCoachAudio(), false)
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
    assert.equal(players.length, 1)
    console.log('PASS: Speaking mock voice parity, native-language requests, actual playback completion, bounded full replies, cancellation and natural-audio retry')
  } finally {
    cancelCoachAudio()
    globalThis.fetch = originalFetch
    Object.defineProperty(globalThis, 'Audio', { configurable: true, value: originalAudio })
  }
}
