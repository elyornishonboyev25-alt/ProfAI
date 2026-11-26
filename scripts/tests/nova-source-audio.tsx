import assert from 'node:assert/strict'
import { NovaSourceAudio } from '@/lib/novaSourceAudio'
import { novaAudioOwner } from '@/lib/novaAudioOwnership'

export async function run() {
  const originalAudio = globalThis.Audio
  const media: FakeAudio[] = [], states: string[] = []
  class FakeAudio extends window.EventTarget {
    duration = 10; currentTime = 0; paused = true; ended = false
    preload = ''; playbackRate = 1; preservesPitch = false
    onloadedmetadata: (() => void) | null = null
    ontimeupdate: (() => void) | null = null
    onended: (() => void) | null = null
    onerror: (() => void) | null = null
    constructor(public src: string) { super(); media.push(this); queueMicrotask(() => this.onloadedmetadata?.()) }
    async play() { this.paused = false }
    pause() { this.paused = true }
    load() {}
    removeAttribute() { this.src = '' }
  }
  globalThis.Audio = FakeAudio as unknown as typeof Audio
  const player = new NovaSourceAudio(state => states.push(state))
  try {
    for (const [start, end] of [[NaN, 5], [-1, 5], [5, 5], [5, 4], [0, Infinity]]) {
      assert.equal(await player.play('/audio/source.mp3', start, end), false)
    }
    assert.equal(media.length, 0, 'Invalid ranges must not request a recording')
    assert.equal(await player.play('https://unknown.invalid/source.mp3', 0, 2), false)
    assert.equal(await player.play('/audio/source.mp3', 11, 12), false)
    assert.equal(await player.resume(), false, 'An invalid/failed segment cannot be played through Resume')
    assert.equal(novaAudioOwner(), null)
    assert.equal(await player.play('/audio/source.mp3', 2, 4, .75), true)
    const first = media.at(-1)!
    assert.equal(first.currentTime, 2); assert.equal(first.preservesPitch, true)
    assert.equal(novaAudioOwner(), 'original')
    player.pause(); assert.equal(novaAudioOwner(), null)
    assert.equal(await player.resume(), true)
    first.currentTime = 4.2
    first.ontimeupdate?.()
    assert.equal(first.currentTime, 4, 'Replay stops at the chosen source boundary')
    assert.equal(states.at(-1), 'paused'); assert.equal(novaAudioOwner(), null)
    assert.equal(await player.resume(), false, 'Resume cannot leak into the next segment')
    assert.equal(await player.play('/audio/source.mp3', 8, 12), true)
    const second = media.at(-1)!
    player.pause(); assert.equal(await player.resume(), true)
    second.currentTime = 10; second.ended = true; second.onended?.()
    assert.equal(novaAudioOwner(), null, 'EOF after pause/resume releases audio ownership')
    assert.equal(states.at(-1), 'idle')
    const pending = player.play('/audio/source.mp3', 0, 2)
    player.stop()
    assert.equal(await pending, false, 'Interrupted loading cannot start a stale clip')
    assert.equal(novaAudioOwner(), null)
    console.log('PASS: validated source ranges, boundaries, EOF after resume, ownership and cancellation; synthetic media transport, not acoustic alignment')
  } finally { player.stop(); globalThis.Audio = originalAudio }
}
