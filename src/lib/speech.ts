// Thin wrappers around the free browser Speech APIs.
//  - Speech-to-Text via the Web Speech API (SpeechRecognition / webkitSpeechRecognition)
//  - Text-to-Speech via speechSynthesis
// Both are free, need no API key, and work in Chrome/Edge (desktop + Android).
// Where the API is missing (e.g. Firefox/iOS Safari STT) the UI falls back to typing.

import { useCallback, useEffect, useRef, useState } from 'react'

// ── Minimal typings (not in the default DOM lib) ────────────────────────────
interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}
interface SpeechRecognitionResult {
  readonly isFinal: boolean
  readonly length: number
  [index: number]: SpeechRecognitionAlternative
}
interface SpeechRecognitionResultList {
  readonly length: number
  [index: number]: SpeechRecognitionResult
}
interface SpeechRecognitionEventLike extends Event {
  readonly resultIndex: number
  readonly results: SpeechRecognitionResultList
}
interface SpeechRecognitionErrorEventLike extends Event {
  readonly error: string
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export const isSpeechRecognitionSupported = (): boolean => getRecognitionCtor() !== null
export const isSpeechSynthesisSupported = (): boolean =>
  typeof window !== 'undefined' && 'speechSynthesis' in window

// ── Speech-to-Text hook ─────────────────────────────────────────────────────
export type UseSpeechRecognitionResult = {
  supported: boolean
  listening: boolean
  /** Words that are still being recognised (greyed-out preview). */
  interimTranscript: string
  /** Everything finalised so far in the current capture. */
  finalTranscript: string
  error: string | null
  start: () => boolean
  /** Stops capture and resolves after the browser delivers its final words. */
  stop: () => Promise<string>
  reset: () => void
}

export function useSpeechRecognition(lang = 'en-US'): UseSpeechRecognitionResult {
  const supported = isSpeechRecognitionSupported()
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const committedRef = useRef('')
  const currentResultsRef = useRef(new Map<number, { text: string; final: boolean }>())
  const finalRef = useRef('')
  const interimRef = useRef('')
  const pendingStopRef = useRef<((transcript: string) => void) | null>(null)
  const restartTimerRef = useRef<number | null>(null)
  // Set when the user asks to stop so the auto-restart loop knows to halt.
  const stoppingRef = useRef(false)

  const [listening, setListening] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState('')
  const [finalTranscript, setFinalTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)

  const ensureRecognition = useCallback((): SpeechRecognitionLike | null => {
    if (!supported) return null
    // Keep the language in sync — the learner may switch EN/UZ/RU between turns,
    // and a stale recognizer language is the #1 cause of bad transcripts.
    if (recognitionRef.current) {
      recognitionRef.current.lang = lang
      return recognitionRef.current
    }

    const Ctor = getRecognitionCtor()
    if (!Ctor) return null
    const recognition = new Ctor()
    recognition.lang = lang
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onresult = (event) => {
      const results = currentResultsRef.current
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        results.set(i, { text: result[0]?.transcript ?? '', final: result.isFinal })
      }
      for (const index of results.keys()) if (index >= event.results.length) results.delete(index)
      const ordered = [...results.entries()].sort(([a], [b]) => a - b).map(([, value]) => value)
      finalRef.current = [committedRef.current, ...ordered.filter((value) => value.final).map((value) => value.text)].join(' ').replace(/\s+/g, ' ').trim()
      const interim = ordered.filter((value) => !value.final).map((value) => value.text).join(' ').replace(/\s+/g, ' ').trim()
      setFinalTranscript(finalRef.current)
      interimRef.current = interim
      setInterimTranscript(interim)
    }

    recognition.onerror = (event) => {
      // "no-speech" and a cancelled recognition are routine during a long answer.
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setError('Microphone permission was blocked. Allow audio access and try again.')
        stoppingRef.current = true
        setListening(false)
      } else if (event.error === 'audio-capture') {
        setError('No microphone was found. Connect one and try again.')
        stoppingRef.current = true
        setListening(false)
      } else if (event.error === 'network') {
        setError('Speech recognition lost its connection. You can retry or edit the transcript.')
        stoppingRef.current = true
      }
    }

    recognition.onend = () => {
      const transcript = `${finalRef.current} ${interimRef.current}`.replace(/\s+/g, ' ').trim()
      // Desktop recognition can end after a network/service error before the
      // recorder is stopped. Keep the last interim phrase for audio fallback.
      finalRef.current = transcript
      setFinalTranscript(transcript)
      if (pendingStopRef.current) {
        pendingStopRef.current(transcript)
        pendingStopRef.current = null
      }
      // Chrome ends recognition every ~minute; restart unless the user stopped.
      if (!stoppingRef.current) {
        committedRef.current = transcript
        currentResultsRef.current.clear()
        interimRef.current = ''
        setInterimTranscript('')
        restartTimerRef.current = window.setTimeout(() => {
          restartTimerRef.current = null
          if (stoppingRef.current) return
          try {
            recognition.start()
            setListening(true)
          } catch {
            stoppingRef.current = true
            setError('Speech recognition stopped unexpectedly. Review the captured words or record again.')
            setListening(false)
          }
        }, 150)
        return
      }
      setListening(false)
      interimRef.current = ''
      setInterimTranscript('')
    }

    recognitionRef.current = recognition
    return recognition
  }, [lang, supported])

  const start = useCallback(() => {
    if (restartTimerRef.current !== null) {
      window.clearTimeout(restartTimerRef.current)
      restartTimerRef.current = null
    }
    const recognition = ensureRecognition()
    if (!recognition) {
      setError('Speech recognition is not supported in this browser. You can type your answer instead.')
      return false
    }
    setError(null)
    stoppingRef.current = false
    committedRef.current = ''
    currentResultsRef.current.clear()
    finalRef.current = ''
    interimRef.current = ''
    setFinalTranscript('')
    setInterimTranscript('')
    try {
      recognition.start()
      setListening(true)
      return true
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === 'InvalidStateError') {
        setListening(true)
        return true
      }
      stoppingRef.current = true
      setListening(false)
      setError('Could not start the microphone. Check browser permissions and try again.')
      return false
    }
  }, [ensureRecognition])

  const stop = useCallback((): Promise<string> => {
    stoppingRef.current = true
    if (restartTimerRef.current !== null) {
      window.clearTimeout(restartTimerRef.current)
      restartTimerRef.current = null
    }
    const recognition = recognitionRef.current
    const currentTranscript = () => `${finalRef.current} ${interimRef.current}`.replace(/\s+/g, ' ').trim()
    if (!recognition) {
      setListening(false)
      return Promise.resolve(currentTranscript())
    }
    setListening(false)

    // SpeechRecognition emits its last result after stop() in Chrome. Waiting for
    // onend prevents the final phrase from being silently dropped.
    return new Promise((resolve) => {
      let settled = false
      const finish = (transcript: string) => {
        if (settled) return
        settled = true
        resolve(transcript)
      }
      pendingStopRef.current = finish
      try {
        recognition.stop()
      } catch {
        pendingStopRef.current = null
        finish(currentTranscript())
      }
      window.setTimeout(() => {
        if (pendingStopRef.current === finish) pendingStopRef.current = null
        finish(currentTranscript())
      }, 2500)
    })
  }, [])

  const reset = useCallback(() => {
    committedRef.current = ''
    currentResultsRef.current.clear()
    finalRef.current = ''
    interimRef.current = ''
    setFinalTranscript('')
    setInterimTranscript('')
    setError(null)
  }, [])

  useEffect(() => {
    return () => {
      stoppingRef.current = true
      if (restartTimerRef.current !== null) window.clearTimeout(restartTimerRef.current)
      const recognition = recognitionRef.current
      if (recognition) {
        recognition.onend = null
        recognition.onerror = null
        recognition.onresult = null
        recognitionRef.current = null
        try {
          recognition.abort()
        } catch {
          // ignore
        }
      }
      pendingStopRef.current?.(`${finalRef.current} ${interimRef.current}`.replace(/\s+/g, ' ').trim())
      pendingStopRef.current = null
    }
  }, [])

  return { supported, listening, interimTranscript, finalTranscript, error, start, stop, reset }
}

// ── Text-to-Speech ──────────────────────────────────────────────────────────
let cachedVoices: SpeechSynthesisVoice[] = []

function loadVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSynthesisSupported()) return []
  const voices = window.speechSynthesis.getVoices()
  if (voices.length > 0) cachedVoices = voices
  return cachedVoices
}

// Voices load asynchronously in some browsers — warm the cache early.
if (isSpeechSynthesisSupported()) {
  loadVoices()
  window.speechSynthesis.onvoiceschanged = () => loadVoices()
}

export type SpeechLang = 'uz' | 'ru' | 'en'

const BCP47: Record<SpeechLang, string> = { uz: 'uz-UZ', ru: 'ru-RU', en: 'en-US' }
export const speechLangToBcp47 = (lang: SpeechLang): string => BCP47[lang]

// Best-effort language detection from the reply text so TTS uses a matching voice
// (English text → English voice, Russian → Russian, Uzbek → Uzbek/closest).
const UZBEK_HINT =
  /[ʻʼ‘’]|\b(men|sen|biz|siz|bu|shu|uchun|qil|qanday|kerak|rahmat|salom|tushuntir|yoki|lekin|bilan|bo['ʻ]l|yax|endi|ochib|test|savol)\b/i

export function detectSpeechLang(text: string): SpeechLang {
  if (/[Ѐ-ӿ]/.test(text)) return 'ru' // Cyrillic
  if (UZBEK_HINT.test(text)) return 'uz'
  return 'en'
}

// Pick the most natural installed voice for a language, with close linguistic
// fallbacks only. Returning null lets the browser honor utterance.lang instead of
// forcing an unrelated installed voice with incorrect pronunciation.
export function pickVoiceForLang(lang: SpeechLang): SpeechSynthesisVoice | null {
  const voices = cachedVoices.length ? cachedVoices : loadVoices()
  if (voices.length === 0) return null
  const byPrefix = (...prefixes: string[]) =>
    voices.find((v) => prefixes.some((p) => v.lang?.toLowerCase().startsWith(p)))

  if (lang === 'ru') return byPrefix('ru') ?? null
  if (lang === 'uz') return byPrefix('uz', 'tr', 'az') ?? null
  return (
    voices.find((v) => v.name.toLowerCase().includes('google us english')) ??
    byPrefix('en-us', 'en-gb', 'en') ??
    null
  )
}

/** Prefer a natural English (UK first) voice for the examiner. */
export function getExaminerVoice(profile: 'male' | 'female' = 'female'): SpeechSynthesisVoice | null {
  const voices = loadVoices()
  if (voices.length === 0) return null
  const names = profile === 'male'
    ? /\b(male|ryan|george|oliver|daniel|james|david|guy|alex|tom|aaron|arthur|rishi|gordon|reed|rocko|evan)\b/i
    : /\b(female|sonia|libby|hazel|susan|aria|jenny|zira|samantha|serena|karen|moira|tessa|fiona|ava|allison|shelley|sandy|nicky)\b/i
  const english = voices.filter((voice) => voice.lang?.toLowerCase().startsWith('en') && names.test(voice.name))
  if (english.length === 0) return null
  const score = (voice: SpeechSynthesisVoice) => {
    const name = voice.name.toLowerCase()
    const locale = voice.lang.toLowerCase()
    let rating = locale.startsWith('en-gb') ? 30 : locale.startsWith('en-us') ? 10 : 0
    if (name.includes('natural') || name.includes('neural') || name.includes('online')) rating += 50
    const preferredNames = profile === 'male'
      ? ['ryan', 'george', 'oliver', 'daniel', 'james', 'david', 'guy']
      : ['sonia', 'libby', 'hazel', 'susan', 'aria', 'jenny', 'zira']
    if (preferredNames.some((candidate) => name.includes(candidate))) rating += 100
    if (name.includes('google uk english')) rating += 15
    if (voice.localService === false) rating += 8
    return rating
  }
  return english.sort((left, right) => score(right) - score(left))[0]
}

/** Browsers can populate installed voices only after the first user gesture. */
export async function waitForExaminerVoice(profile: 'male' | 'female', signal: AbortSignal): Promise<SpeechSynthesisVoice | null> {
  const ready = getExaminerVoice(profile)
  if (ready || signal.aborted || !isSpeechSynthesisSupported()) return ready
  return new Promise((resolve) => {
    const synth = window.speechSynthesis
    const finish = (voice: SpeechSynthesisVoice | null) => {
      clearTimeout(timer)
      synth.removeEventListener('voiceschanged', changed)
      signal.removeEventListener('abort', aborted)
      resolve(voice)
    }
    const changed = () => { const voice = getExaminerVoice(profile); if (voice) finish(voice) }
    const aborted = () => finish(null)
    const timer = setTimeout(() => finish(getExaminerVoice(profile)), 2000)
    synth.addEventListener('voiceschanged', changed)
    signal.addEventListener('abort', aborted, { once: true })
    changed()
  })
}

export type SpeakOptions = {
  onStart?: () => void
  onEnd?: () => void
  onError?: () => void
  rate?: number
  pitch?: number
  /** Language of the text — selects a matching voice. Defaults to auto-detect. */
  lang?: SpeechLang
  /** Exact installed voice to use when a screen has a specific voice profile. */
  voice?: SpeechSynthesisVoice | null
}

/** Speak `text` aloud. Cancels any in-flight utterance first. Returns a stop fn. */
export function speak(text: string, options: SpeakOptions = {}): () => void {
  if (!isSpeechSynthesisSupported() || !text.trim()) {
    if (options.onError) { options.onError(); return () => {} }
    options.onStart?.()
    options.onEnd?.()
    return () => {}
  }
  const synth = window.speechSynthesis
  synth.cancel()

  // Guard so onEnd fires exactly once, whether via onend, onerror or the watchdog.
  let finished = false
  let watchdog = 0
  let startTimer = 0
  const finish = (failed = false) => {
    if (finished) return
    finished = true
    window.clearTimeout(startTimer)
    window.clearTimeout(watchdog)
    if (failed && options.onError) options.onError()
    else options.onEnd?.()
  }

  const lang = options.lang ?? detectSpeechLang(text)
  const utterance = new SpeechSynthesisUtterance(text)
  const voice = options.voice ?? pickVoiceForLang(lang)
  if (voice) {
    utterance.voice = voice
    utterance.lang = voice.lang
  } else {
    utterance.lang = speechLangToBcp47(lang)
  }
  // A touch above 1.0 sounds natural and responsive (was sluggish at 0.96).
  utterance.rate = options.rate ?? 1.04
  utterance.pitch = options.pitch ?? 1
  let actuallyStarted = false
  utterance.onstart = () => { actuallyStarted = true; options.onStart?.() }
  utterance.onend = () => finish(!actuallyStarted)
  utterance.onerror = () => finish(true)

  // Browser voices can speak long IELTS cue cards for more than 22 seconds.
  // Wait while speech is actually playing so recording never overlaps a prompt.
  const estimateMs = Math.min(90000, Math.max(5000, (text.length / 11) * 1000 + 5000))
  const watchdogStarted = Date.now()
  const checkSpeech = () => {
    if (finished) return
    if (synth.speaking && Date.now() - watchdogStarted < 120000) {
      watchdog = window.setTimeout(checkSpeech, 3000)
      return
    }
    if (synth.speaking) synth.cancel()
    finish(true)
  }
  watchdog = window.setTimeout(checkSpeech, estimateMs)

  // Chrome needs a brief tick after cancel() before speak() takes — keep it minimal
  // so speech starts almost immediately (the long pause was perceived latency).
  startTimer = window.setTimeout(() => {
    if (!finished) {
      try { synth.resume(); synth.speak(utterance) } catch { finish(true) }
    }
  }, 15)

  return () => {
    finished = true
    window.clearTimeout(startTimer)
    window.clearTimeout(watchdog)
    synth.cancel()
  }
}

export function cancelSpeech(): void {
  if (isSpeechSynthesisSupported()) window.speechSynthesis.cancel()
}
