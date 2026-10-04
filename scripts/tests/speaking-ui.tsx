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
import { analyseTranscript, mergeStats } from '../../src/lib/speakingScoring'
import { evaluateSpeaking } from '../../src/services/speakingAI'
import { getIeltsSpeakingFullMockCatalog } from '../../src/utils/ieltsSpeakingCatalog'
import { saveSpeakingSession } from '../../src/lib/speakingApi'

const container = document.getElementById('root')!
const players: FakeAudio[] = []
let blockPlayback = false
let recognitionStarts = 0
let recorderStarts = 0
let transcriptionFails = false
let transcribedFiles: Array<{ audioBase64: string; mimeType: string }> = []
let requestedVoices: string[] = []
let recordingMimeType = 'audio/mp4'
let browserTranscript = ''
let voiceFails = false
let syncedDuration = 0
let evaluationPayload: unknown = {
  overallBand: 9, fluencyBand: 6, lexicalBand: 6, grammarBand: 6, pronunciationBand: 6,
  summary: 'Practice assessment from your answers.', strengths: ['Relevant answers.'], weaknesses: ['Develop your ideas further.'],
  improvementPriorities: [{ area: 'Fluency', target: 6.5, action: 'Explain each idea with an example.' }],
}
const utterances: FakeUtterance[] = []
const recognizers: FakeRecognition[] = []

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
  static isTypeSupported(type: string) { return type === recordingMimeType }
  mimeType = recordingMimeType
  state = 'inactive'
  ondataavailable: ((event: { data: Blob }) => void) | null = null
  onstop: (() => void) | null = null
  onerror: (() => void) | null = null
  constructor(_stream: MediaStream, options?: MediaRecorderOptions) { if (options) assert.equal(options.audioBitsPerSecond, 96_000) }
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

class FakeUtterance {
  onstart: (() => void) | null = null
  onend: (() => void) | null = null
  onerror: (() => void) | null = null
  voice?: SpeechSynthesisVoice
  constructor(readonly text: string) {}
}

class FakeRecognition {
  onresult: ((event: any) => void) | null = null
  onend: (() => void) | null = null
  onerror: ((event: any) => void) | null = null
  constructor() { recognizers.push(this) }
  start() { recognitionStarts++ }
  words(text: string, isFinal = false) {
    const result = Object.assign([{ transcript: text, confidence: 0.9 }], { isFinal })
    this.onresult?.({ resultIndex: 0, results: [result] })
  }
  stop() { if (browserTranscript) this.words(browserTranscript, true); this.onend?.() }
  abort() {}
}

const wait = async (ms = 20) => act(async () => { await new Promise((resolve) => setTimeout(resolve, ms)) })
const until = async (ready: () => unknown, label: string) => {
  for (let attempt = 0; attempt < 75; attempt++) { if (ready()) return; await wait() }
  assert.fail(`Timed out: ${label}`)
}
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
  const synthesis = Object.assign(new window.EventTarget(), {
    getVoices: () => voices, cancel() {}, resume() {}, speaking: false,
    speak(utterance: FakeUtterance) { utterances.push(utterance); utterance.onstart?.() },
  })
  Object.defineProperty(window, 'speechSynthesis', { value: synthesis, configurable: true })
  Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', { value: FakeUtterance, configurable: true })
  assert.equal(getExaminerVoice('male')?.name, 'Daniel')
  assert.equal(getExaminerVoice('female')?.name, 'Google UK English Female')
  voices.splice(1)
  assert.equal(getExaminerVoice('male'), null, 'Never assign the female installed voice to Alex')
  voices.push({ name: 'Daniel', lang: 'en-GB' })

  apiClient.post = (async (path: string, body: any) => {
    if (path.endsWith('/speaking/session')) { assert.equal(Number.isInteger(body.durationSec), true); syncedDuration = body.durationSec; return {} }
    if (path.endsWith('/voice')) { requestedVoices.push(body.voice); if (voiceFails) throw new Error('Voice provider unavailable'); return { audioBase64: btoa('test-audio') } }
    if (path.endsWith('/transcribe')) {
      transcribedFiles.push(body)
      if (transcriptionFails) throw new Error('offline')
      return { text: 'I study English because I want to communicate with people around the world.' }
    }
    return { text: JSON.stringify(body.purpose === 'speaking_examiner' ? { reply: 'What do you enjoy about that?' } : evaluationPayload) }
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
    await until(() => button('Retry processing saved answer'), 'saved full-mock answer after failed transcription')
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
    assert.equal(saved.result.stats.uniqueWords, 12, 'Repeated answers cannot inflate distinct vocabulary')
    assert.equal(saved.result.overallBand, 6, 'Overall is recomputed from criteria, not the provider total')
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

  voiceFails = true
  for (const [mock, name, voiceName] of [[1, 'Alex', 'Daniel'], [2, 'Maya', 'Google UK English Female']] as const) {
    const fallbackRoot = createRoot(container)
    requestedVoices = []
    await act(async () => fallbackRoot.render(<ExaminerSession config={{ mode: 'part1' }} modeLabel={`Speaking Mock ${mock}`} onExit={() => {}} onSaved={() => {}} />))
    try {
      const before = recorderStarts
      await click('Begin speaking test')
      await wait(40)
      assert.match(container.textContent!, new RegExp(name))
      assert.match(container.textContent!, /English device voice/)
      assert.equal(utterances.at(-1)!.voice?.name, voiceName)
      assert.equal(recorderStarts, before, 'Fallback cannot record before the question ends')
      for (let i = 0; i < 3; i++) { await act(async () => utterances.at(-1)!.onend?.()); await wait(40) }
      assert.ok(button('Finish answer'), 'Provider failure automatically recovers to the matching device voice')
      assert.equal(requestedVoices.length, 1, 'Keep the working fallback voice throughout the session')
    } finally { await act(async () => fallbackRoot.unmount()) }
  }
  voiceFails = false
  console.log('PASS: unavailable natural voice automatically recovers with matching male/female voice')

  const normalEvaluation = evaluationPayload
  const history = [{ role: 'candidate' as const, text: 'I like music. I actually enjoy playing piano every day with my friends.' }]
  const stats = analyseTranscript(history[0].text, 10.4)
  assert.equal(stats.fillerCount, 0, 'Meaningful like/actually are not penalized')
  assert.equal(mergeStats([stats, stats], `${history[0].text}\n${history[0].text}`).uniqueWords, stats.uniqueWords)
  assert.equal(mergeStats([stats, stats], `${history[0].text}\n${history[0].text}`).durationSec, 20.8)
  await saveSpeakingSession({ mode: 'full_mock', modeLabel: 'Speaking Mock', overallBand: 6, fluencyBand: 6, lexicalBand: 6, grammarBand: 6, pronunciationBand: 6, durationSec: 20.8, wordCount: stats.wordCount })
  assert.equal(syncedDuration, 21, 'API persistence rounds only after summing accurate recording durations')
  for (const invalid of [{}, { ...(normalEvaluation as object), fluencyBand: true }, { ...(normalEvaluation as object), strengths: [null] }, { ...(normalEvaluation as object), improvementPriorities: [{ area: 'Grammar', target: 'not a number', action: 'Practise.' }] }]) {
    evaluationPayload = invalid
    assert.equal((await evaluateSpeaking({ modeLabel: 'Speaking Mock', history, stats })).source, 'offline')
  }
  evaluationPayload = normalEvaluation
  console.log('PASS: invalid assessment data falls back safely; vocabulary and recording duration are accurate')

  const practiceRoot = createRoot(container)
  await act(async () => practiceRoot.render(<MemoryRouter initialEntries={['/speaking/speaking-day-1']}><Routes><Route path="/speaking/:id" element={<IELTSSpeakingTest />} /></Routes></MemoryRouter>))
  try {
    assert.ok(button('Record answer'), 'Safari can record without a browser speech recognizer')
    const before = recorderStarts
    await act(async () => { button('Record answer').click(); button('Record answer').click() })
    assert.equal(recorderStarts, before + 1, 'Repeated taps cannot start duplicate recorders')
    transcriptionFails = true
    await click('Stop & save')
    await until(() => button('Retry processing saved answer'), 'saved daily answer after failed transcription')
    assert.ok(button('Retry processing saved answer'))
    assert.ok(container.querySelector('audio'))
    transcriptionFails = false
    await click('Retry processing saved answer')
    await until(() => button('Send for AI analysis'), 'daily transcription retry completed')
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

  for (const desktop of [
    { name: 'Windows Chrome', userAgent: 'Windows Chrome/130 Safari/537.36', vendor: 'Google Inc.', recognition: true, mime: 'audio/webm;codecs=opus', simultaneous: true },
    { name: 'Windows Edge', userAgent: 'Windows Chrome/130 Safari/537.36 Edg/130', vendor: 'Google Inc.', recognition: true, mime: 'audio/webm;codecs=opus', simultaneous: true },
    { name: 'Windows Firefox', userAgent: 'Windows Firefox/130', vendor: '', recognition: false, mime: 'audio/ogg;codecs=opus', simultaneous: true },
    { name: 'Mac Safari', userAgent: 'Macintosh Version/18 Safari/605.1.15', vendor: 'Apple Computer, Inc.', recognition: true, mime: 'audio/mp4', simultaneous: false },
  ]) {
    Object.defineProperty(navigator, 'userAgent', { value: desktop.userAgent, configurable: true })
    Object.defineProperty(navigator, 'vendor', { value: desktop.vendor, configurable: true })
    Object.defineProperty(window, 'webkitSpeechRecognition', { value: desktop.recognition ? FakeRecognition : undefined, configurable: true })
    assert.equal(canRecognizeWhileRecording(), desktop.simultaneous, desktop.name)
    recordingMimeType = desktop.mime
    browserTranscript = 'I enjoy studying languages in my spare time.'
    transcribedFiles = []
    const starts = recognitionStarts
    const desktopRoot = createRoot(container)
    await act(async () => desktopRoot.render(<ExaminerSession config={{ mode: 'part1' }} modeLabel="Speaking Mock 1" onExit={() => {}} onSaved={() => {}} />))
    try {
      await click('Begin speaking test')
      await endAudio() // greeting
      await endAudio() // first part instructions
      await endAudio() // first question
      assert.ok(button('Finish answer'), `${desktop.name} starts recording after the question`)
      assert.equal(recognitionStarts > starts, desktop.recognition && desktop.simultaneous)
      if (desktop.recognition && desktop.simultaneous) {
        // Preserve words when the browser recognition service disconnects while
        // MediaRecorder keeps the user's recording running.
        const recognizer = recognizers.at(-1)!
        await act(async () => {
          recognizer.words(browserTranscript)
          recognizer.onerror?.({ error: 'network' })
          recognizer.onend?.()
        })
        browserTranscript = '' // There will be no new final results on stop.
        transcriptionFails = true
      }
      await click('Finish answer')
      assert.equal(transcribedFiles[0].mimeType, desktop.mime.split(';')[0])
      assert.equal(atob(transcribedFiles[0].audioBase64).length, 200)
      assert.equal(button('Retry processing saved answer'), undefined, `${desktop.name} retains browser words when server transcription fails`)
      assert.ok(players.at(-1)?.onended, `${desktop.name} advances to the next examiner question`)
      console.log(`PASS: ${desktop.name} recording format, examiner playback and answer capture`)
    } finally {
      transcriptionFails = false
      browserTranscript = ''
      await act(async () => desktopRoot.unmount())
    }
  }

  const mocks = getIeltsSpeakingFullMockCatalog()
  assert.equal(mocks.length, 30)
  for (const mock of mocks) {
    saved = null
    requestedVoices = []
    const completedRoot = createRoot(container)
    const card = mock.parts.part2
    await act(async () => completedRoot.render(<StrictMode><ExaminerSession config={{ mode: 'full_mock', mockSeed: {
      part1: mock.parts.part1.questions.map((item) => item.q),
      part2: { title: card.title, bullets: card.bullets, followUp: card.followUp },
      part3: mock.parts.part3.questions.map((item) => item.q),
    } }} modeLabel={mock.title} onExit={() => {}} onSaved={(result, transcript) => { saved = { result, transcript } }} /></StrictMode>))
    try {
      if (mock.index === 30) evaluationPayload = {}
      await click('Begin speaking test')
      for (let step = 0; step < 80 && !saved; step++) {
        if (button('Retry AI feedback')) {
          const before = recorderStarts
          assert.equal(mock.index, 30)
          assert.equal(saved, null, 'Offline scoring cannot complete a mock or award a band')
          evaluationPayload = normalEvaluation
          await click('Retry AI feedback')
          assert.equal(recorderStarts, before, 'Regrading retains the completed answers without recording again')
        } else if (button('Finish answer')) {
          await act(async () => { button('Finish answer').click(); button('Finish answer')?.click() })
          await wait(40)
        } else if (container.querySelector('#speaking-prep-notes')) {
          const originalNow = Date.now
          try { Date.now = () => originalNow() + 61_000; await wait(300) }
          finally { Date.now = originalNow }
        } else if (players.at(-1)?.onended) await endAudio()
        else await wait(40)
      }
      assert.ok(saved, `${mock.title} reaches a result`)
      assert.equal(saved.transcript.filter((turn: any) => turn.role === 'candidate').length, 15, `${mock.title} retains all answers once`)
      for (const question of [...mock.parts.part1.questions, ...mock.parts.part3.questions]) {
        assert.ok(saved.transcript.some((turn: any) => turn.role === 'examiner' && turn.text === question.q), `${mock.title}: ${question.q}`)
      }
      assert.ok(saved.transcript.some((turn: any) => turn.text === card.followUp), `${mock.title} includes Part 2 follow-up`)
      assert.ok(requestedVoices.length > 10)
      assert.ok(requestedVoices.every((voice) => voice === (mock.index % 2 ? 'cedar' : 'marin')), `${mock.title} keeps the matching voice`)
      assert.equal(saved.result.source, 'ai')
      assert.equal(saved.result.stats.uniqueWords, 12)
      console.log(`PASS: ${mock.title} — all three parts, 15 answers, voice profile, assessment and review`)
    } finally { evaluationPayload = normalEvaluation; await act(async () => completedRoot.unmount()) }
  }
}
