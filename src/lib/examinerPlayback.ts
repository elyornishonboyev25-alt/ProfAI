import { examinerAudio, type ExaminerVoice } from './speakingAudio'
import { ApiError } from './apiClient'
import { getExaminerVoice, speak, waitForExaminerVoice } from './speech'

type Callbacks = {
  loading: (value: boolean) => void
  started: (source: 'neural' | 'device') => void
  ended: () => void
  failed: (message: string) => void
}
type PlaybackOptions = { language?: 'en' | 'uz' | 'ru'; deviceFallback?: boolean; audio?: Promise<string> }

// Keep one media element for the entire session. A new Audio() for each async
// response loses the user's playback permission on mobile browsers.
export class ExaminerPlayback {
  private player = new Audio()
  private sequence = 0
  private controller: AbortController | null = null
  private url: string | null = null
  private stopSpeech: (() => void) | null = null
  private timer: ReturnType<typeof setTimeout> | undefined
  private retry: (() => void) | null = null

  unlock(): void {
    if (this.url) return
    // A short silent PCM wave unlocks this exact element in the start gesture.
    const wav = new Uint8Array(204)
    const view = new DataView(wav.buffer)
    const write = (offset: number, value: string) => [...value].forEach((char, i) => { wav[offset + i] = char.charCodeAt(0) })
    write(0, 'RIFF'); view.setUint32(4, 196, true); write(8, 'WAVEfmt ')
    view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true)
    view.setUint32(24, 8000, true); view.setUint32(28, 16000, true)
    view.setUint16(32, 2, true); view.setUint16(34, 16, true)
    write(36, 'data'); view.setUint32(40, 160, true)
    this.url = URL.createObjectURL(new Blob([wav], { type: 'audio/wav' }))
    this.player.setAttribute('playsinline', '')
    this.player.src = this.url
    void this.player.play().catch(() => {})
  }

  resume(): void { this.retry?.() }

  ask(text: string, voice: ExaminerVoice, gender: 'male' | 'female', callbacks: Callbacks, device = false, options: PlaybackOptions = {}): void {
    this.cancel()
    const sequence = this.sequence
    const current = () => sequence === this.sequence
    const controller = new AbortController()
    this.controller = controller
    let completed = false
    let failed = false
    const finish = () => {
      if (!current() || completed || failed) return
      completed = true
      clearTimeout(this.timer)
      this.retry = null
      callbacks.loading(false)
      callbacks.ended()
    }
    const fail = (message: string) => {
      if (!current() || completed || failed) return
      failed = true
      clearTimeout(this.timer)
      this.player.pause()
      callbacks.loading(false)
      callbacks.failed(message)
    }
    callbacks.loading(true)
    const playDevice = async () => {
      if (!current() || completed || controller.signal.aborted) return
      failed = false
      // A failed device voice must allow a fresh provider request on the next
      // user gesture, rather than trapping every retry on the broken voice.
      this.retry = () => this.ask(text, voice, gender, callbacks, false, { ...options, audio: undefined })
      if (options.deviceFallback === false) { fail('Natural voice could not play. Please retry audio.'); return }
      const installedVoice = getExaminerVoice(gender) ?? await waitForExaminerVoice(gender, controller.signal)
      if (!current() || completed || controller.signal.aborted) return
      if (!installedVoice) { fail('Examiner audio is unavailable and a matching English voice is not installed. Check your connection and retry audio.'); return }
      this.stopSpeech = speak(text, {
        lang: 'en', voice: installedVoice, rate: 0.98,
        onStart: () => { if (current()) { callbacks.loading(false); callbacks.started('device') } },
        onEnd: finish, onError: () => fail('Examiner playback was interrupted. Tap Play examiner to hear the question.'),
      })
    }
    if (device) { void playDevice(); return }
    void (options.audio ?? examinerAudio(text, voice, controller.signal, options.language, true)).then((url) => {
      if (!current()) { URL.revokeObjectURL(url); return }
      this.url = url
      this.player.src = url
      let switchingToDevice = false
      let heardAudio = false
      let lastPosition = this.player.currentTime
      let recoveries = 0
      const fallback = () => {
        if (!current() || completed || switchingToDevice) return
        switchingToDevice = true
        this.retry = null
        clearTimeout(this.timer)
        this.player.onplaying = this.player.onended = this.player.onerror = null
        this.player.ontimeupdate = null
        this.player.pause()
        void playDevice()
      }
      const interrupted = () => {
        if (!current() || completed || failed || switchingToDevice) return
        // Some browsers omit the ended event when an audio session changes.
        // Only trust the media element's ended flag after playback has started.
        if (heardAudio && this.player.ended) { finish(); return }
        if (recoveries++ === 0) { play(); return }
        fallback()
      }
      const play = () => {
        if (!current() || completed || switchingToDevice) return
        failed = false
        callbacks.loading(true)
        clearTimeout(this.timer)
        this.timer = setTimeout(interrupted, 10_000)
        void this.player.play().catch((error: unknown) => {
          if (switchingToDevice) return
          if (error instanceof Error && error.name === 'NotSupportedError') fallback()
          else fail('Tap Play examiner to enable sound and hear the question.')
        })
      }
      this.retry = () => { recoveries = 0; play() }
      const watchProgress = () => {
        if (!current() || completed || failed || switchingToDevice) return
        clearTimeout(this.timer)
        this.timer = setTimeout(interrupted, 15_000)
      }
      this.player.onplaying = () => { if (current() && !completed && !failed && !switchingToDevice) { heardAudio = true; watchProgress(); callbacks.loading(false); callbacks.started('neural') } }
      this.player.ontimeupdate = () => {
        // timeupdate may also fire while paused or buffering. Only advancing
        // playback can extend the watchdog, otherwise a stalled prompt hangs.
        if (this.player.currentTime > lastPosition) {
          lastPosition = this.player.currentTime
          watchProgress()
        }
      }
      this.player.onended = () => {
        if (!current() || completed || failed || switchingToDevice) return
        if (heardAudio) finish()
        else fail('Examiner audio did not start. Tap Play examiner to hear the question.')
      }
      this.player.onerror = fallback
      play()
    }).catch((error: unknown) => {
      if (!current() || controller.signal.aborted) return
      if (error instanceof ApiError && [401, 403, 409, 429].includes(error.status)) {
        this.retry = () => this.ask(text, voice, gender, callbacks, false, { ...options, audio: undefined })
        fail(error.message)
        return
      }
      void playDevice()
    })
  }

  cancel(): void {
    this.sequence++
    this.controller?.abort()
    this.controller = null
    clearTimeout(this.timer)
    this.stopSpeech?.()
    this.stopSpeech = null
    this.player.onplaying = this.player.onended = this.player.onerror = null
    this.player.ontimeupdate = null
    this.player.pause()
    this.retry = null
    if (this.url) URL.revokeObjectURL(this.url)
    this.url = null
  }

  get canResume(): boolean { return this.retry !== null }
}
