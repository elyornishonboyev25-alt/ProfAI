import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { runInNewContext } from 'node:vm'
const source = await readFile(new URL('../../public/audio/nova-pcm-capture.js', import.meta.url), 'utf8')

test('microphone resampling preserves PCM duration, clipping, stereo downmix and little endian at common device rates', () => {
  for (const sampleRate of [16000, 44100, 48000]) {
    let Capture
    const frames = []
    runInNewContext(source, { sampleRate, AudioWorkletProcessor: class { port = { postMessage(bytes) { frames.push(bytes) } } }, registerProcessor: (_name, processor) => { Capture = processor } })
    const capture = new Capture()
    for (let index = 0; index < sampleRate; index += 128) {
      const length = Math.min(128, sampleRate - index)
      assert.equal(capture.process([[new Float32Array(length).fill(2), new Float32Array(length).fill(1)]]), true)
    }
    assert.equal(frames.length, 10, `${sampleRate}Hz input yields exactly one second of 16kHz output`)
    for (const bytes of frames) {
      assert.equal(bytes.byteLength, 3200)
      const view = new DataView(bytes)
      for (let offset = 0; offset < bytes.byteLength; offset += 2) assert.equal(view.getInt16(offset, true), 32767)
    }
    frames.length = 0
    for (let index = 0; index < sampleRate; index += 128) {
      const length = Math.min(128, sampleRate - index)
      capture.process([[new Float32Array(length).fill(1), new Float32Array(length).fill(-1)]])
    }
    assert.equal(frames.length, 10)
    for (const bytes of frames) assert.ok(new Uint8Array(bytes).every(byte => byte === 0), 'Opposite stereo channels downmix to silence')
  }
})
