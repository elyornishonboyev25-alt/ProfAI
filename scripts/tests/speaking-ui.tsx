import React, { act, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import assert from 'node:assert/strict'
import ExaminerSession from '../../src/components/speaking/ExaminerSession'
import IELTSSpeakingTest from '../../src/pages/IELTSSpeakingTest'
import IeltsSpeaking from '../../src/components/speaking/sections/IeltsSpeaking'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { apiClient } from '../../src/lib/apiClient'
import { AnswerRecording, canRecognizeWhileRecording } from '../../src/lib/speakingMedia'
import { ExaminerPlayback } from '../../src/lib/examinerPlayback'
import { getExaminerVoice } from '../../src/lib/speech'

const container = document.getElementById('root')!
const players: FakeAudio[] = []
let blockPlayback = false
let recognitionStarts = 0
let recorderStarts = 0
let transcriptionFails = false
let transcribedFiles: Array<{ audioBase64: string; mimeType: string }> = []
let requestedVoices: string[] = []

class FakeAudio {
  src = ''
  onplaying: (() => void) | null = null
  onended: (() => void) | null = null
  onerror: (() => void) | null = null
  paused = true
  constructor() { players.push(this) }
  setAttribute() {}
  play() {
    if (blockPlayback && this.onended) return Promise.reject(new Error('NotAllowedError'))
    this.paused = false
    this.onplaying?.()
    return Promise.resolve()
  }
  pause() { this.paused = true }
}

class FakeRecorder {
  static isTypeSupported(type: string) { return type === 'audio/mp4' }
  mimeType = 'audio/mp4'
  state = 'inactive'
  ondataavailable: ((event: { data: Blob }) => void) | null = null
  onstop: (() => void) | null = null
  onerror: (() => void) | null = null
  start() { this.state = 'recording'; recorderStarts++ }
  stop() {
    this.state = 'inactive'
    this.ondataavailable?.({ data: new Blob(['a'.repeat(100)], { type: this.mimeType }) })
    setTimeout(() => {
      this.ondataavailable?.({ data: new Blob(['b'.repeat(100)], { type: this.mimeType }) })
      this.onstop?.()
    }, 5)
  }
}

class FakeRecognition {
  start() { recognitionStarts++ }
  stop() { (this as unknown as { onend?: () => void }).onend?.() }
  abort() {}
}

const wait = async (ms = 20) => act(async () => { await new Promise((resolve) => setTimeout(resolve, ms)) })
const button = (label: string) => [...container.querySelectorAll('button')].find((item) => item.textContent?.includes(label))!
const click = async (label: string) => { assert.ok(button(label), label); await act(async () => button(label).click()); await wait() }
const endAudio = async () => { const player = players.at(-1)!; assert.ok(player.onended); await act(async () => player.onended?.()); await wait() }

export async function run() {
  Object.defineProperty(globalThis, 'Audio', { value: FakeAudio, configurable: true })
  Object.defineProperty(globalThis, 'MediaRecorder', { value: FakeRecorder, configurable: true })
  Object.defineProperty(globalThis, 'Blob', { value: window.Blob, configurable: true })
  Object.defineProperty(globalThis, 'FileReader', { value: window.FileReader, configurable: true })
  let urlNumber = 0
  URL.createObjectURL = () => `blob:test-${urlNumber++}`
  URL.revokeObjectURL = () => {}
  Object.defineProperty(navigator, 'userAgent', { value: 'iPhone Safari', configurable: true })
  Object.defineProperty(navigator, 'vendor', { value: 'Apple Computer, Inc.', configurable: true })
  assert.equal(canRecognizeWhileRecording(), false)
  Object.defineProperty(window, 'webkitSpeechRecognition', { value: FakeRecognition, configurable: true })
  Object.defineProperty(navigator, 'mediaDevices', { value: {
    getUserMedia: async () => {
      const track = { readyState: 'live', onended: null, stop() { this.readyState = 'ended' } }
      return { active: true, getTracks: () => [track], getAudioTracks: () => [track] }
    },
  }, configurable: true })
  const voices = [
    { name: 'Google UK English Female', lang: 'en-GB' },
    { name: 'Daniel', lang: 'en-GB' },
    { name: 'Samantha', lang: 'en-US' },
  ]
  Object.defineProperty(window, 'speechSynthesis', { value: { getVoices: () => voices, cancel() {} }, configurable: true })
  assert.equal(getExaminerVoice('male')?.name, 'Daniel')
  assert.equal(getExaminerVoice('female')?.name, 'Google UK English Female')
  voices.splice(1)
  assert.equal(getExaminerVoice('male'), null, 'Never assign the female installed voice to Alex')

  apiClient.post = (async (path: string, body: any) => {
    if (path.endsWith('/voice')) { requestedVoices.push(body.voice); return { audioBase64: btoa('test-audio') } }
    if (path.endsWith('/transcribe')) {
      transcribedFiles.push(body)
      if (transcriptionFails) throw new Error('offline')
      return { text: 'I study English because I want to communicate with people around the world.' }
    }
    return { text: JSON.stringify({ reply: 'What do you enjoy about that?', overallBand: 6, fluencyBand: 6, lexicalBand: 6, grammarBand: 6, pronunciationBand: 6, summary: 'Practice assessment.', strengths: [], weaknesses: [], improvementPriorities: [] }) }
  }) as typeof apiClient.post

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const recording = new AnswerRecording(stream)
  const [first, second] = await Promise.all([recording.stop(), recording.stop()])
  assert.equal(first.size, 200, 'Last async recording chunk is retained')
  assert.equal(first.type, 'audio/mp4', 'Safari MP4 is never mislabeled as WebM')
  assert.equal(first, second, 'Concurrent stops share the final recording')
  console.log('PASS: MP4 format, final chunks, duplicate stops, and matching male/female device voices')

  const playback = new ExaminerPlayback()
  let ended = 0, failed = 0
  blockPlayback = true
  playback.ask('Test question?', 'cedar', 'male', { loading() {}, started() {}, ended() { ended++ }, failed() { failed++ } })
  await wait()
  assert.equal(ended, 0, 'Blocked autoplay cannot end a question')
  assert.equal(failed, 1)
  blockPlayback = false
  playback.resume()
  const staleEnd = players.at(-1)!.onended!
  playback.cancel()
  staleEnd()
  assert.equal(ended, 0, 'Cancelled callbacks cannot advance a session')
  console.log('PASS: blocked playback and cancelled callbacks never start recording')

  let saved: any = null
  const root = createRoot(container)
  await act(async () => root.render(<StrictMode><ExaminerSession config={{ mode: 'full_mock', mockSeed: {
    part1: ['What do you study?'],
    part2: { title: 'Describe a useful skill.', bullets: ['What it is', 'How you learned it'], followUp: 'Do you use this skill every day?' },
    part3: ['How do people learn new skills?'],
  } }} modeLabel="Speaking Mock 1" onExit={() => {}} onSaved={(result, transcript) => { saved = { result, transcript } }} /></StrictMode>))
  try {
    blockPlayback = true
    await click('Begin speaking test')
    assert.ok(button('Play examiner'), 'Autoplay block has a user gesture recovery')
    assert.equal(recorderStarts, 1, 'Only the earlier helper test recorded, never the unheard examiner question')
    blockPlayback = false
    await click('Play examiner')
    await endAudio() // greeting
    await endAudio() // first part instructions
    await endAudio() // full name question
    assert.ok(button('Finish answer'))
    assert.equal(recognitionStarts, 0, 'Safari speech recognition cannot take over the recorder')
    transcriptionFails = true
    await click('Finish answer')
    assert.ok(button('Retry processing saved answer'))
    assert.ok(container.querySelector('audio[aria-label="Your saved answer"]'))
    assert.equal(saved, null)
    transcriptionFails = false
    await click('Retry processing saved answer')
    assert.equal(transcribedFiles[0].mimeType, 'audio/mp4')
    assert.equal(atob(transcribedFiles[0].audioBase64).length, 200)
    assert.equal(transcribedFiles[0].audioBase64, transcribedFiles[1].audioBase64, 'Retry reuses the exact answer file')
    await endAudio() // seeded question
    await click('Finish answer')
    await endAudio() // adaptive Part 1 follow-up
    await click('Finish answer')
    await endAudio() // Part 2 transition
    await endAudio() // cue card instructions
    assert.match(container.textContent!, /Preparation time/)
    const now = Date.now
    Date.now = () => now() + 61_000
    await wait(300)
    Date.now = now
    await endAudio() // Please begin
    assert.ok(button('Finish answer'))
    await click('Finish answer')
    assert.match(container.textContent!, /Do you use this skill every day\?/, 'Part 2 follow-up must not be skipped')
    await endAudio()
    await click('Finish answer')
    await endAudio() // Part 3 transition
    await endAudio() // Part 3 seed
    await click('Finish answer')
    await endAudio() // Part 3 follow-up
    await click('Finish answer')
    await wait()
    assert.ok(saved)
    assert.equal(saved.transcript.filter((turn: any) => turn.role === 'candidate').length, 7)
    assert.ok(requestedVoices.every((voice) => voice === 'cedar'), 'Alex always uses the male neural voice')
    assert.ok(saved.transcript.some((turn: any) => turn.text === 'Do you use this skill every day?'))
    assert.equal(saved.result.stats.wordCount, 91)
    console.log('PASS: full Safari mock, autoplay recovery, saved-audio retry, Part 2 follow-up, and seven scored answers')
  } finally { await act(async () => root.unmount()) }

  requestedVoices = []
  const femaleRoot = createRoot(container)
  await act(async () => femaleRoot.render(<ExaminerSession config={{ mode: 'part1' }} modeLabel="Speaking Mock 2" onExit={() => {}} onSaved={() => {}} />))
  await click('Begin speaking test')
  assert.deepEqual(requestedVoices, ['marin'])
  assert.match(container.textContent!, /Maya/)
  await act(async () => femaleRoot.unmount())
  console.log('PASS: Maya always uses the female neural voice')

  const practiceRoot = createRoot(container)
  await act(async () => practiceRoot.render(<MemoryRouter initialEntries={['/speaking/speaking-day-1']}><Routes><Route path="/speaking/:id" element={<IELTSSpeakingTest />} /></Routes></MemoryRouter>))
  try {
    assert.ok(button('Record answer'), 'Safari can record without a browser speech recognizer')
    const before = recorderStarts
    await act(async () => { button('Record answer').click(); button('Record answer').click() })
    assert.equal(recorderStarts, before + 1, 'Repeated taps cannot start duplicate recorders')
    transcriptionFails = true
    await click('Stop & save')
    assert.ok(button('Retry processing saved answer'))
    assert.ok(container.querySelector('audio'))
    transcriptionFails = false
    await click('Retry processing saved answer')
    assert.ok(button('Send for AI analysis'))
    assert.equal(recognitionStarts, 0)
    console.log('PASS: daily Safari practice recording, repeated taps, audio playback and transcription retry')
  } finally { await act(async () => practiceRoot.unmount()) }

  const libraryRoot = createRoot(container)
  await act(async () => libraryRoot.render(<IeltsSpeaking />))
  await click('Part 2')
  await click('Record')
  await click('Stop')
  assert.ok(container.querySelector('audio'), 'Self-recording provides playback')
  await act(async () => libraryRoot.unmount())
  console.log('PASS: library self-recording and cleanup')
}
