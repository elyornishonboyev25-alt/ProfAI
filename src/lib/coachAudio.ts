import { validateDeliverySegments, type DeliverySegment } from './novaLearning'
import type { NovaPerformance } from './novaPersona'
import { ExaminerPlayback } from './examinerPlayback'
import { examinerAudio } from './speakingAudio'
import type { SpeechLang } from './speech'

type VoiceCallbacks = {
  loading: (value: boolean) => void
  started: (performance?: NovaPerformance) => void
  ended: () => void
  failed: () => void
  level?: (level: number) => void
}

let playback: ExaminerPlayback | null = null
let replay: (() => void) | null = null
let sequence = 0
let releasePreparedAudio: (() => void) | null = null

export function unlockCoachAudio() {
  if (typeof Audio === 'undefined') return
  playback ??= new ExaminerPlayback()
  playback.enableMeter()
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
export function speakCoachAudio(text: string, language: SpeechLang, callbacks: VoiceCallbacks, performance?: NovaPerformance, segments?: DeliverySegment[]) {
  cancelCoachAudio()
  if (typeof Audio === 'undefined') { callbacks.failed(); return }
  playback ??= new ExaminerPlayback()
  const current = sequence
  let meterFrame = 0
  const stopMeter = () => { cancelAnimationFrame(meterFrame); callbacks.level?.(0) }
  const meter = () => {
    if (current !== sequence) return
    callbacks.level?.(playback?.sampleLevel() ?? 0)
    meterFrame = requestAnimationFrame(meter)
  }
  const parts: Array<{ text: string; performance?: NovaPerformance }> = []
  const valid = validateDeliverySegments(text, segments)
  const logical = valid.length ? valid : [{ text, performance }]
  for (const segment of logical) {
  let remaining = segment.text.trim()
  // Prepare a shorter opening, then synthesize the next part while it plays.
  // Prefer sentence boundaries so the voice keeps its natural intonation.
  while (remaining.length > (parts.length ? 900 : 360)) {
    const limit = parts.length ? 900 : 360
    const opening = remaining.slice(0, limit)
    const sentence = [...opening.matchAll(/[.!?](?:\s|$)/g)].pop()?.index
    const boundary = sentence !== undefined && sentence >= limit / 2 ? sentence + 1 : opening.lastIndexOf(' ')
    const end = boundary >= limit / 2 ? boundary : limit
    parts.push({ text: remaining.slice(0, end).trim(), performance: segment.performance })
    remaining = remaining.slice(end).trim()
  }
  if (remaining) parts.push({ text: remaining, performance: segment.performance })
  }
  const controller = new AbortController()
  const prepared = new Map<number, { promise: Promise<string>; url?: string; claimed: boolean }>()
  releasePreparedAudio = () => {
    controller.abort()
    stopMeter()
    for (const part of prepared.values()) if (part.url && !part.claimed) URL.revokeObjectURL(part.url)
    prepared.clear()
  }
  const prepare = (partIndex: number) => {
    let entry = prepared.get(partIndex)
    if (!entry) {
      const part = { claimed: false } as { promise: Promise<string>; url?: string; claimed: boolean }
      part.promise = examinerAudio(parts[partIndex].text, 'marin', controller.signal, language, true, { performance: parts[partIndex].performance }).then((url) => {
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
    playback!.ask(parts[index].text, 'marin', 'female', {
      loading: (value) => { if (current === sequence) callbacks.loading(value) },
      started: () => {
        if (current !== sequence) return
        cancelAnimationFrame(meterFrame); meter()
        callbacks.started(parts[index].performance)
        if (index + 1 < parts.length) prepare(index + 1)
      },
      ended: () => {
        if (current !== sequence) return
        stopMeter()
        index++
        if (index < parts.length) play()
        else { replay = null; callbacks.ended() }
      },
      failed: () => { if (current === sequence) { stopMeter(); callbacks.failed() } },
    }, false, { language, deviceFallback: false, audio: part.promise })
  }
  if (parts.length) play()
  else callbacks.ended()
}
