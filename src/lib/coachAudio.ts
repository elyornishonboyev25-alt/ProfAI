import { ExaminerPlayback } from './examinerPlayback'
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

export function unlockCoachAudio() {
  if (typeof Audio === 'undefined') return
  playback ??= new ExaminerPlayback()
  playback.unlock()
}

export function cancelCoachAudio() {
  sequence++
  replay = null
  playback?.cancel()
}

export function canRetryCoachAudio() { return replay !== null }

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
  while (remaining.length > 1400) {
    const boundary = remaining.slice(0, 1400).lastIndexOf(' ')
    const end = boundary >= 700 ? boundary : 1400
    parts.push(remaining.slice(0, end).trim())
    remaining = remaining.slice(end).trim()
  }
  if (remaining) parts.push(remaining)
  let index = 0
  const play = () => {
    if (current !== sequence) return
    replay = play
    playback!.ask(parts[index], 'marin', 'female', {
      loading: callbacks.loading,
      started: () => { if (current === sequence) callbacks.started() },
      ended: () => {
        if (current !== sequence) return
        index++
        if (index < parts.length) play()
        else { replay = null; callbacks.ended() }
      },
      failed: () => { if (current === sequence) callbacks.failed() },
    }, false, { language, deviceFallback: false })
  }
  if (parts.length) play()
  else callbacks.ended()
}
