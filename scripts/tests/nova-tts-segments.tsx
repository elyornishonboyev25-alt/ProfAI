import assert from 'node:assert/strict'
import { apiClient } from '@/lib/apiClient'
import { speakCoachAudio, cancelCoachAudio } from '@/lib/coachAudio'
import { defaultNovaPerformance } from '@/lib/novaPersona'

export async function run() {
  let player: FakeAudio
  class FakeAudio {
    src = ''; currentTime = 0; paused = false; ended = false
    onplaying: (() => void) | null = null; onended: (() => void) | null = null
    play() { this.onplaying?.(); return Promise.resolve() }
    pause() { this.paused = true }
    setAttribute() {}
    removeAttribute() {}
    load() {}
    constructor() { player = this }
  }
  const oldAudio = globalThis.Audio, oldPost = apiClient.post, oldUrl = URL.createObjectURL, oldRevoke = URL.revokeObjectURL
  Object.defineProperty(globalThis, 'Audio', { value: FakeAudio, configurable: true })
  const requests: any[] = [], started: any[] = []
  let ended = 0, failed = 0
  URL.createObjectURL = () => `blob:fixture-${requests.length}`; URL.revokeObjectURL = () => {}
  apiClient.post = (async (_url, body) => { requests.push(body); return { audioBase64: btoa('fixture') } }) as any
  const wait = async (condition: () => boolean) => { for (let n = 0; n < 40 && !condition(); n++) await new Promise(resolve => setTimeout(resolve, 10)); assert.ok(condition()) }
  try {
    const segments = [{ text: 'A short joke.', performance: defaultNovaPerformance('playful_angry') }, { text: 'The checked explanation.', performance: defaultNovaPerformance('focused') }]
    speakCoachAudio(segments.map(part => part.text).join(' '), 'uz', { loading() {}, started: p => started.push(p), ended: () => ended++, failed: () => failed++ }, undefined, segments)
    await wait(() => started.length === 1 && requests.length === 2)
    assert.deepEqual(requests.map(body => body.text), segments.map(part => part.text), 'Only spoken text reaches TTS')
    assert.ok(requests.every(body => body.purpose === 'nova' && body.voice === 'marin'), 'Delivery changes keep one Nova voice, outside examiner purpose')
    assert.equal(started[0].expression, 'playful_angry')
    const staleEnd = player!.onended!
    player!.onended?.(); await wait(() => started.length === 2)
    assert.equal(started[1].expression, 'focused')
    assert.equal(requests.length, 2, 'Playback reuses prefetched audio rather than synthesizing it again')
    cancelCoachAudio(); staleEnd(); player!.onended?.()
    assert.equal(ended, 0, 'Cancellation fences stale completion callbacks'); assert.equal(failed, 0)
    console.log('PASS: segmented TTS keeps one Nova voice, passes delivery separately, changes the face on playback and cancels late events without duplicate synthesis')
  } finally {
    cancelCoachAudio(); apiClient.post = oldPost; URL.createObjectURL = oldUrl; URL.revokeObjectURL = oldRevoke
    Object.defineProperty(globalThis, 'Audio', { value: oldAudio, configurable: true })
  }
}
