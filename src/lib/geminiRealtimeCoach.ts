import { NovaPlayback } from './novaPlayback'
import type { NovaPerformance } from './novaPersona'
import { apiClient, publicApiUrl } from '@/lib/apiClient'
import type { VoiceContext, VoiceOptions } from './realtimeCoach'
import { openVoiceSession, releaseVoiceSession, maintainVoiceLease } from './voiceSessionLifecycle'
import { VoiceStreamError, voiceSocketClosed } from './voiceStreamError'

type Session = { id: string; ticket: string; expiresAt: string; streamPath: string; model: string }

/** PCM over a server-owned Gemini Live connection; credentials never enter the browser. */
export class GeminiRealtimeCoach {
  private options: VoiceOptions
  private stream: MediaStream | null = null
  private audio: AudioContext | null = null
  private capture: AudioWorkletNode | null = null
  private input: MediaStreamAudioSourceNode | null = null
  private silent: GainNode | null = null
  private inputMeter: AnalyserNode | null = null
  private outputMeter: AnalyserNode | null = null
  private socket: WebSocket | null = null
  private controller = new AbortController()
  private sources = new Map<AudioBufferSourceNode, string>()
  private expressions = new NovaPlayback((value, id) => this.options.expression?.(value, id))
  private playbackTimers = new Set<number>()
  private outputs = new Map<string, { text: string; parts: Array<{ text: string; at: number }>; done: boolean; started: boolean }>()
  private cancelledOutputs = new Set<string>()
  private responseId = ''
  private session: Session | null = null
  private releaseLease: (() => void) | null = null
  private closed = false
  private muted = false
  private frame = 0
  private deadline = 0
  private replyTimer = 0
  private readyTimer = 0
  private nextPlayback = 0
  private turn = 0
  private inputText = ''
  private inputId = 0
  private interrupted = false
  private speed: number
  private outputStarted = 0
  private firstAudioReported = false
  private replyStarted: number | null = null
  private started = 0
  private lastContext = ''
  private contextSync = Promise.resolve()
  private pageHide = () => this.stop()

  constructor(options: VoiceOptions) { this.options = options; this.speed = options.speechSpeed ?? 1.1 }
  private send(message: unknown) {
    if (this.socket?.readyState !== WebSocket.OPEN) return
    if (this.socket.bufferedAmount > 256000) { this.fail(new Error('Your connection is too slow for live voice. Please reconnect.')); return }
    this.socket.send(JSON.stringify(message))
  }
  private fail(error: Error) { if (!this.closed) { this.options.error(error); this.stop() } }
  private waitForReply() {
    window.clearTimeout(this.replyTimer)
    this.replyTimer = window.setTimeout(() => this.fail(new Error('Gemini Live did not reply in time. Please retry.')), 45000)
  }

  async start() {
    if (this.closed) return
    this.started = performance.now()
    window.addEventListener('pagehide', this.pageHide)
    this.options.state('thinking')
    try {
      // Resume playback during the initial user action, before network negotiation.
      this.audio = new AudioContext({ latencyHint: 'interactive' })
      await this.audio.resume()
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true } })
      if (this.closed) { stream.getTracks().forEach(track => track.stop()); return }
      this.stream = stream
      stream.getAudioTracks().forEach(track => { track.enabled = !this.muted; track.onended = () => this.fail(new Error('The microphone disconnected. Please reconnect it.')) })
      this.options.performance?.({ stage: 'microphone', durationMs: Math.round(performance.now() - this.started) })
      await this.audio.audioWorklet.addModule('/audio/nova-pcm-capture.js?v=2')
      if (this.closed) return
      const initial = this.options.context
      const history = this.options.history.slice(-24).map(turn => ({ ...turn, content: turn.content.slice(0, 12000) }))
      let length = history.reduce((sum, turn) => sum + turn.content.length, 0)
      while (length > 26000 && history.length) length -= history.shift()!.content.length
      const session = await openVoiceSession<Session>('/ai/voice/gemini/connect', { context: initial, history }, this.controller.signal)
      if (this.closed) { void releaseVoiceSession(session.id); return }
      this.session = session; this.lastContext = JSON.stringify(initial)
      this.releaseLease = maintainVoiceLease(session.id, () => this.fail(new Error('This voice session ended. Reconnect to continue.')))
      if (session.streamPath !== '/ws/ai-coach') throw new Error('The voice server returned an invalid connection.')
      const url = new URL(publicApiUrl(session.streamPath), window.location.href)
      // API origins may include /api/v1; signaling lives at the origin's /ws path.
      url.pathname = session.streamPath; url.search = ''; url.hash = ''
      url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
      const socket = new WebSocket(url)
      this.socket = socket
      await new Promise<void>((resolve, reject) => {
        this.readyTimer = window.setTimeout(() => reject(new Error('The live voice connection timed out. Please retry.')), 15000)
        this.controller.signal.addEventListener('abort', () => reject(new DOMException('Cancelled', 'AbortError')), { once: true })
        socket.onopen = () => this.send({ ticket: session.ticket })
        socket.onmessage = event => {
          try {
            const message = JSON.parse(event.data)
            if (message.type === 'ready') { window.clearTimeout(this.readyTimer); resolve() }
            else this.handle(message)
          } catch { this.fail(new Error('The live voice connection returned invalid audio. Please retry.')) }
        }
        socket.onerror = () => reject(new VoiceStreamError('Could not connect live voice. Please retry.', 'VOICE_TRANSPORT_ERROR', true))
        socket.onclose = event => reject(voiceSocketClosed(event))
      })
      if (this.closed) return
      socket.onerror = () => this.fail(new VoiceStreamError('The voice connection was interrupted. Your chat is saved.', 'VOICE_TRANSPORT_ERROR', true))
      socket.onclose = event => this.fail(voiceSocketClosed(event))
      this.input = this.audio.createMediaStreamSource(stream)
      this.inputMeter = this.audio.createAnalyser(); this.inputMeter.fftSize = 512
      this.outputMeter = this.audio.createAnalyser(); this.outputMeter.fftSize = 512
      this.outputMeter.connect(this.audio.destination)
      this.input.connect(this.inputMeter)
      this.capture = new AudioWorkletNode(this.audio, 'nova-pcm-capture')
      this.silent = this.audio.createGain(); this.silent.gain.value = 0
      this.input.connect(this.capture); this.capture.connect(this.silent); this.silent.connect(this.audio.destination)
      this.capture.port.onmessage = event => {
        if (this.closed || this.muted) return
        // Discard stale capture after a busy tab resumes; replaying a backlog
        // floods the socket and makes live conversation lag behind the speaker.
        const frame = event.data
        if (frame?.pcm && this.audio && this.audio.currentTime - frame.capturedAt > .35) return
        const bytes = new Uint8Array(frame?.pcm ?? frame)
        let text = ''
        for (const byte of bytes) text += String.fromCharCode(byte)
        this.send({ type: 'audio', data: btoa(text) })
      }
      this.options.performance?.({ stage: 'connection', durationMs: Math.round(performance.now() - this.started) })
      this.send({ type: 'start' })
      this.deadline = window.setTimeout(() => this.fail(new Error('This voice session has finished. Start another session to continue.')), Math.max(0, Date.parse(session.expiresAt) - Date.now()))
      this.waitForReply(); this.meter()
      void this.updateContext(this.options.context).catch(() => {})
    } catch (error) { if (!this.closed) this.fail(error instanceof Error ? error : new Error('Gemini Live could not connect.')) }
  }

  private meter() {
    const bytes = new Uint8Array(512)
    let smoothed = 0
    const tick = () => {
      if (this.closed) return
      const speaking = this.sources.size > 0
      const analyser = speaking ? this.outputMeter : this.inputMeter
      if (!analyser || (!speaking && this.muted)) smoothed = 0
      else {
        analyser.getByteTimeDomainData(bytes)
        const rms = Math.sqrt(bytes.reduce((sum, byte) => sum + ((byte - 128) / 128) ** 2, 0) / bytes.length)
        const target = Math.min(1, Math.max(0, (rms - .008) * 6))
        smoothed += (target - smoothed) * (target > smoothed ? .7 : .4)
      }
      this.options.level(smoothed)
      this.frame = requestAnimationFrame(tick)
    }
    tick()
  }

  private output(id: string) {
    let output = this.outputs.get(id)
    if (!output) { output = { text: '', parts: [], done: false, started: false }; this.outputs.set(id, output) }
    return output
  }

  private play(data: string, mimeType: string, responseId: string) {
    const audio = this.audio
    if (!audio || this.interrupted) return
    const rate = Number(/rate=(\d+)/.exec(mimeType)?.[1] ?? 24000)
    if (rate < 8000 || rate > 48000) throw new Error('Unsupported audio rate')
    const text = atob(data)
    if (!text.length || text.length % 2) throw new Error('Invalid PCM audio')
    if (this.nextPlayback - audio.currentTime > 18) throw new Error('Audio connection fell behind. Please retry.')
    const bytes = Uint8Array.from(text, char => char.charCodeAt(0))
    const view = new DataView(bytes.buffer)
    const buffer = audio.createBuffer(1, bytes.length / 2, rate)
    const samples = buffer.getChannelData(0)
    for (let index = 0; index < samples.length; index++) samples[index] = view.getInt16(index * 2, true) / 32768
    const source = audio.createBufferSource()
    source.buffer = buffer; source.playbackRate.value = this.speed
    source.connect(this.outputMeter!)
    const start = Math.max(audio.currentTime + .02, this.nextPlayback)
    this.nextPlayback = start + buffer.duration / this.speed
    this.sources.set(source, responseId)
    source.onended = () => {
      this.sources.delete(source); source.disconnect()
      if (!this.closed && ![...this.sources.values()].includes(responseId) && this.outputs.get(responseId)?.done) this.finishOutput(false, responseId)
    }
    if (!this.outputStarted) {
      this.outputStarted = performance.now()
      if (!this.firstAudioReported) {
        this.options.performance?.({ stage: 'first_audio', durationMs: Math.round(this.outputStarted - this.started) })
        this.firstAudioReported = true
      } else if (this.replyStarted !== null) {
        this.options.performance?.({ stage: 'reply', durationMs: Math.round(this.outputStarted - this.replyStarted) })
      }
      this.replyStarted = null
    }
    window.clearTimeout(this.replyTimer)
    const output = this.output(responseId)
    if (!output.started) {
      output.started = true
      const timer = window.setTimeout(() => {
        this.playbackTimers.delete(timer)
        if (!this.closed && !this.cancelledOutputs.has(responseId)) { this.expressions.start(responseId); this.options.state('speaking') }
      }, Math.max(0, (start - audio.currentTime) * 1000))
      this.playbackTimers.add(timer)
    }
    source.start(start)
  }

  private commitInput() {
    if (this.inputText.trim()) {
      this.options.message('user', this.inputText.trim(), `gemini-input-${this.session?.id}-${this.inputId++}`)
      this.replyStarted ??= performance.now()
    }
    this.inputText = ''
  }
  private finishOutput(interrupted: boolean, responseId = this.responseId) {
    const output = this.outputs.get(responseId)
    if (!output) return
    const text = interrupted && this.audio
      ? output.parts.filter(part => part.at <= this.audio!.currentTime + .08).map(part => part.text).join('')
      : output.text
    const performance = this.expressions.get(responseId)
    if (text.trim()) this.options.message('assistant', text.trim(), responseId, interrupted, performance)
    else if (interrupted && output.text) this.options.message('assistant', '', responseId, true)
    this.outputs.delete(responseId); this.cancelledOutputs.add(responseId)
    if (this.cancelledOutputs.size > 256) this.cancelledOutputs.delete(this.cancelledOutputs.values().next().value!)
    this.expressions.finish(responseId)
    this.turn++; this.outputStarted = 0
    if (!this.sources.size) { this.options.caption(''); if (!this.closed) this.options.state('listening') }
  }

  private handle(message: any) {
    if (this.closed) return
    if (message.type === 'error') { this.fail(new VoiceStreamError(typeof message.message === 'string' ? message.message : 'Gemini Live could not connect.', typeof message.code === 'string' ? message.code : 'VOICE_PROVIDER_ERROR', message.retryable === true)); return }
    if (message.type === 'coach' && message.result?.reply) { this.options.coachResult(message.result, message.id); return }
    if (message.type === 'expression' && typeof message.responseId === 'string') {
      if (!this.interrupted && !this.cancelledOutputs.has(message.responseId)) {
        const output = this.output(message.responseId)
        if (output.started && this.expressions.get(message.responseId) && this.audio && this.nextPlayback > this.audio.currentTime) {
          const timer = window.setTimeout(() => {
            this.playbackTimers.delete(timer)
            if (!this.closed && !this.cancelledOutputs.has(message.responseId)) this.expressions.cue(message.responseId, message.performance)
          }, (this.nextPlayback - this.audio.currentTime) * 1000)
          this.playbackTimers.add(timer)
        } else this.expressions.cue(message.responseId, message.performance)
      }
      return
    }
    const content = message.content
    if (message.type !== 'content' || !content) return
    const responseId = typeof message.responseId === 'string' ? message.responseId : `gemini-output-${this.session?.id}-${this.turn}`
    if (responseId !== this.responseId && !this.cancelledOutputs.has(responseId)) this.interrupted = false
    this.responseId = responseId
    if (content.interrupted) {
      this.clearPlayback(); for (const id of this.outputs.keys()) this.finishOutput(true, id)
      this.expressions.finish(responseId); this.cancelledOutputs.add(responseId); this.interrupted = false
      if (!message.responseId) this.turn++ // Older gateways do not supply response IDs.
      return
    }
    if (content.inputTranscription?.text) {
      this.inputText += content.inputTranscription.text
      this.options.caption(this.inputText)
      this.options.preview?.('user', this.inputText, `gemini-input-${this.session?.id}-${this.inputId}`)
      // The model's speech interruption is authoritative; microphone levels alone
      // never cancel a turn (speaker echo and background noise are not words).
      if (!this.sources.size) this.options.state('thinking')
      this.waitForReply()
      if (content.inputTranscription.finished) this.commitInput()
    }
    if (content.modelTurn?.parts?.length || content.outputTranscription?.text) {
      this.commitInput()
    }
    if (this.cancelledOutputs.has(responseId)) return
    for (const part of content.modelTurn?.parts ?? []) if (part.inlineData?.data && /^audio\/pcm/.test(part.inlineData.mimeType ?? '')) this.play(part.inlineData.data, part.inlineData.mimeType, responseId)
    if (content.outputTranscription?.text && !this.interrupted) {
      const text = content.outputTranscription.text
      const output = this.output(responseId)
      output.text += text
      output.parts.push({ text, at: Math.max(this.audio?.currentTime ?? 0, this.nextPlayback - .2) })
      this.options.caption(output.text)
      this.options.preview?.('assistant', output.text, responseId)
    }
    if (content.turnComplete) {
      window.clearTimeout(this.replyTimer); this.commitInput(); this.output(responseId).done = true; this.interrupted = false
      if (![...this.sources.values()].includes(responseId)) this.finishOutput(false, responseId)
    }
  }

  private clearPlayback() {
    for (const timer of this.playbackTimers) window.clearTimeout(timer)
    this.playbackTimers.clear()
    for (const source of this.sources.keys()) { source.onended = null; try { source.stop(); source.disconnect() } catch { /* Already ended. */ } }
    this.sources.clear(); this.nextPlayback = this.audio?.currentTime ?? 0
  }
  mute(muted: boolean) { this.muted = muted; this.stream?.getAudioTracks().forEach(track => { track.enabled = !muted }); this.send({ type: 'mute', muted }) }
  interrupt() { this.clearPlayback(); for (const id of this.outputs.keys()) this.finishOutput(true, id); this.expressions.finish(this.responseId); this.interrupted = true; this.replyStarted = null; window.clearTimeout(this.replyTimer); this.send({ type: 'interrupt' }) }
  requestFeedback() { this.interrupt(); this.send({ type: 'feedback' }); this.options.state('thinking'); this.waitForReply() }
  setSpeechSpeed(speed: number) { if (Number.isFinite(speed)) this.speed = Math.max(.75, Math.min(1.35, speed)) }
  async updateContext(context: VoiceContext) {
    this.options.context = { ...context, threadId: this.options.context.threadId ?? context.threadId }
    this.contextSync = this.contextSync.catch(() => {}).then(async () => {
      if (this.closed || !this.session) return
      const next = this.options.context
      if (JSON.stringify(next) === this.lastContext) return
      await apiClient.post('/ai/voice/context', { id: this.session.id, context: next }, { signal: this.controller.signal })
      this.lastContext = JSON.stringify(next)
    })
    await this.contextSync
  }
  stop() {
    if (this.closed) return
    this.closed = true
    window.removeEventListener('pagehide', this.pageHide)
    const safely = (callback: () => unknown) => { try { callback() } catch { /* Continue releasing hardware. */ } }
    this.stream?.getTracks().forEach(track => { track.onended = null; safely(() => track.stop()) }); this.stream = null
    this.controller.abort(); window.clearTimeout(this.deadline); window.clearTimeout(this.replyTimer); window.clearTimeout(this.readyTimer); cancelAnimationFrame(this.frame)
    this.releaseLease?.(); this.releaseLease = null
    this.clearPlayback(); for (const id of this.outputs.keys()) safely(() => this.finishOutput(true, id)); this.expressions.reset(); safely(() => this.commitInput())
    if (this.socket) { this.socket.onclose = null; this.socket.onerror = null; this.socket.onmessage = null; safely(() => this.socket?.close()) }
    if (this.capture) { this.capture.port.onmessage = null; safely(() => this.capture?.disconnect()) }
    safely(() => this.input?.disconnect()); safely(() => this.silent?.disconnect()); safely(() => this.inputMeter?.disconnect()); safely(() => this.outputMeter?.disconnect())
    safely(() => this.audio?.close().catch(() => {}))
    if (this.session) void releaseVoiceSession(this.session.id)
    safely(() => this.options.state('idle')); safely(() => this.options.level(0))
  }
}
