import { ExaminerPlayback } from './examinerPlayback'
import { examinerAudio } from './speakingAudio'
import type { SpeechLang } from './speech'

type VoiceCallbacks = {
  loading: (value: boolean) => void
  started: () => void
  ended: () => void
  failed: () => void
}

let playback: ExaminerPlayback | null = null
let replay: (() => void) | null = null
let sequence = 0
let releasePreparedAudio: (() => void) | null = null

export function unlockCoachAudio() {
  if (typeof Audio === 'undefined') return
  playback ??= new ExaminerPlayback()
  playback.unlock()
}

export function cancelCoachAudio() {
  sequence++
  replay = null
  releasePreparedAudio?.()
  releasePreparedAudio = null
  playback?.cancel()
}

export function canRetryCoachAudio() { return replay !== null }
export function coachAudioVersion() { return sequence }

export function retryCoachAudio() {
  if (playback?.canResume) playback.resume()
  else replay?.()
}

/** Nova shares the Speaking mock's audio service, voice and mobile player.
 * Keep all text, but split long replies to fit the existing audio endpoint. */
export function speakCoachAudio(text: string, language: SpeechLang, callbacks: VoiceCallbacks) {
  cancelCoachAudio()
  if (typeof Audio === 'undefined') { callbacks.failed(); return }
  playback ??= new ExaminerPlayback()
  const current = sequence
  const parts: string[] = []
  let remaining = text.trim()
  // Prepare a shorter opening, then synthesize the next part while it plays.
  // Prefer sentence boundaries so the voice keeps its natural intonation.
  while (remaining.length > (parts.length ? 900 : 360)) {
    const limit = parts.length ? 900 : 360
    const opening = remaining.slice(0, limit)
    const sentence = [...opening.matchAll(/[.!?](?:\s|$)/g)].pop()?.index
    const boundary = sentence !== undefined && sentence >= limit / 2 ? sentence + 1 : opening.lastIndexOf(' ')
    const end = boundary >= limit / 2 ? boundary : limit
    parts.push(remaining.slice(0, end).trim())
    remaining = remaining.slice(end).trim()
  }
  if (remaining) parts.push(remaining)
  const controller = new AbortController()
  const prepared = new Map<number, { promise: Promise<string>; url?: string; claimed: boolean }>()
  releasePreparedAudio = () => {
    controller.abort()
    for (const part of prepared.values()) if (part.url && !part.claimed) URL.revokeObjectURL(part.url)
    prepared.clear()
  }
  const prepare = (partIndex: number) => {
    let entry = prepared.get(partIndex)
    if (!entry) {
      const part = { claimed: false } as { promise: Promise<string>; url?: string; claimed: boolean }
      part.promise = examinerAudio(parts[partIndex], 'marin', controller.signal, language, true).then((url) => {
        if (current !== sequence || controller.signal.aborted) { URL.revokeObjectURL(url); throw new DOMException('Cancelled', 'AbortError') }
        part.url = url
        return url
      }).catch((error: unknown) => { prepared.delete(partIndex); throw error })
      // Prefetch failures are surfaced only when that part is played.
      void part.promise.catch(() => {})
      prepared.set(partIndex, part)
      entry = part
    }
    return entry
  }
  let index = 0
  const play = () => {
    if (current !== sequence) return
    replay = play
    // A player owns and revokes claimed URLs. A manual synthesis retry needs
    // a fresh URL rather than the one cancelled by the previous attempt.
    if (prepared.get(index)?.claimed) prepared.delete(index)
    const part = prepare(index)
    part.claimed = true
    playback!.ask(parts[index], 'marin', 'female', {
      loading: callbacks.loading,
      started: () => {
        if (current !== sequence) return
        callbacks.started()
        if (index + 1 < parts.length) prepare(index + 1)
      },
      ended: () => {
        if (current !== sequence) return
        index++
        if (index < parts.length) play()
        else { replay = null; callbacks.ended() }
      },
      failed: () => { if (current === sequence) callbacks.failed() },
    }, false, { language, deviceFallback: false, audio: part.promise })
  }
  if (parts.length) play()
  else callbacks.ended()
}
