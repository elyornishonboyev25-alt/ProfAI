import { apiClient, publicApiUrl } from '@/lib/apiClient'
import type { VoiceContext, VoiceOptions } from './realtimeCoach'

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
  private sources = new Set<AudioBufferSourceNode>()
  private session: Session | null = null
  private closed = false
  private muted = false
  private frame = 0
  private deadline = 0
  private replyTimer = 0
  private readyTimer = 0
  private nextPlayback = 0
  private turn = 0
  private outputText = ''
  private inputText = ''
  private inputId = 0
  private generationDone = false
  private interrupted = false
  private outputParts: Array<{ text: string; at: number }> = []
  private speed: number
  private outputStarted = 0
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
      await this.audio.audioWorklet.addModule('/audio/nova-pcm-capture.js')
      if (this.closed) return
      const initial = this.options.context
      const history = this.options.history.slice(-24).map(turn => ({ ...turn, content: turn.content.slice(0, 12000) }))
      let length = history.reduce((sum, turn) => sum + turn.content.length, 0)
      while (length > 26000 && history.length) length -= history.shift()!.content.length
      const session = await apiClient.post<Session>('/ai/voice/gemini/connect', { context: initial, history }, { signal: this.controller.signal })
      if (this.closed) { void apiClient.post('/ai/voice/end', { id: session.id }, { keepalive: true }).catch(() => {}); return }
      this.session = session; this.lastContext = JSON.stringify(initial)
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
        socket.onerror = () => reject(new Error('Could not connect live voice. Please retry.'))
        socket.onclose = () => reject(new Error('The live voice connection closed. Please retry.'))
      })
      if (this.closed) return
      socket.onerror = () => this.fail(new Error('Voice lost its connection. Your chat is saved; retry to continue.'))
      socket.onclose = () => this.fail(new Error('Voice ended. Retry to start another session.'))
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
        const bytes = new Uint8Array(event.data)
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

  private play(data: string, mimeType: string) {
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
    this.sources.add(source)
    source.onended = () => {
      this.sources.delete(source); source.disconnect()
      if (!this.closed && !this.sources.size && this.generationDone) this.finishOutput(false)
    }
    if (!this.outputStarted) {
      this.outputStarted = performance.now()
      this.options.performance?.({ stage: this.turn === 0 ? 'first_audio' : 'reply', durationMs: Math.round(this.outputStarted - this.started) })
    }
    window.clearTimeout(this.replyTimer)
    this.options.state('speaking'); source.start(start)
  }

  private commitInput() {
    if (this.inputText.trim()) this.options.message('user', this.inputText.trim(), `gemini-input-${this.session?.id}-${this.inputId++}`)
    this.inputText = ''
  }
  private finishOutput(interrupted: boolean) {
    const text = interrupted && this.audio
      ? this.outputParts.filter(part => part.at <= this.audio!.currentTime + .08).map(part => part.text).join('')
      : this.outputText
    if (text.trim()) this.options.message('assistant', text.trim(), `gemini-output-${this.session?.id}-${this.turn}`, interrupted)
    else if (interrupted && this.outputText) this.options.message('assistant', '', `gemini-output-${this.session?.id}-${this.turn}`, true)
    this.turn++; this.outputText = ''; this.outputParts = []; this.generationDone = false; this.outputStarted = 0
    this.options.caption(''); if (!this.closed) this.options.state('listening')
  }

  private handle(message: any) {
    if (this.closed) return
    if (message.type === 'error') { this.fail(new Error(typeof message.message === 'string' ? message.message : 'Gemini Live could not connect.')); return }
    if (message.type === 'coach' && message.result?.reply) { this.options.coachResult(message.result, message.id); return }
    const content = message.content
    if (message.type !== 'content' || !content) return
    if (content.interrupted) {
      this.clearPlayback(); this.finishOutput(true); this.interrupted = true
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
    for (const part of content.modelTurn?.parts ?? []) if (part.inlineData?.data && /^audio\/pcm/.test(part.inlineData.mimeType ?? '')) this.play(part.inlineData.data, part.inlineData.mimeType)
    if (content.outputTranscription?.text && !this.interrupted) {
      const text = content.outputTranscription.text
      this.outputText += text
      this.outputParts.push({ text, at: Math.max(this.audio?.currentTime ?? 0, this.nextPlayback - .2) })
      this.options.caption(this.outputText)
      this.options.preview?.('assistant', this.outputText, `gemini-output-${this.session?.id}-${this.turn}`)
    }
    if (content.turnComplete) {
      window.clearTimeout(this.replyTimer); this.commitInput(); this.generationDone = true; this.interrupted = false
      if (!this.sources.size) this.finishOutput(false)
    }
  }

  private clearPlayback() {
    for (const source of this.sources) { source.onended = null; try { source.stop(); source.disconnect() } catch { /* Already ended. */ } }
    this.sources.clear(); this.nextPlayback = this.audio?.currentTime ?? 0
  }
  mute(muted: boolean) { this.muted = muted; this.stream?.getAudioTracks().forEach(track => { track.enabled = !muted }); this.send({ type: 'mute', muted }) }
  interrupt() { this.clearPlayback(); this.finishOutput(true); this.interrupted = true; window.clearTimeout(this.replyTimer); this.send({ type: 'interrupt' }) }
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
    this.clearPlayback(); safely(() => this.finishOutput(true)); safely(() => this.commitInput())
    if (this.socket) { this.socket.onclose = null; this.socket.onerror = null; this.socket.onmessage = null; safely(() => this.socket?.close()) }
    if (this.capture) { this.capture.port.onmessage = null; safely(() => this.capture?.disconnect()) }
    safely(() => this.input?.disconnect()); safely(() => this.silent?.disconnect()); safely(() => this.inputMeter?.disconnect()); safely(() => this.outputMeter?.disconnect())
    safely(() => this.audio?.close().catch(() => {}))
    if (this.session) void apiClient.post('/ai/voice/end', { id: this.session.id }, { keepalive: true }).catch(() => {})
    safely(() => this.options.state('idle')); safely(() => this.options.level(0))
  }
}
