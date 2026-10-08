import { apiClient } from '@/lib/apiClient'
import type { AiVoiceState } from '@/store/aiAssistantStore'
import type { GeminiChatResponse } from '@/services/geminiAI'

export type VoiceContext = {
  pathname: string; workspace: 'general' | 'ielts' | 'sat' | 'english' | 'admission'; language: 'en' | 'uz' | 'ru'
  mode: 'coach' | 'examiner'; threadId?: string; studyContext: string; screenContext: string; siteKnowledge: string
  coachPreferences?: import('@/services/ai/coachPreferences').CoachPreferences
}
type VoiceOptions = {
  context: VoiceContext
  history: Array<{ role: 'user' | 'assistant'; content: string }>
  state: (state: AiVoiceState) => void
  level: (level: number) => void
  caption: (text: string) => void
  message: (role: 'user' | 'assistant', text: string, id: string, interrupted?: boolean) => void
  coachResult: (result: GeminiChatResponse, id: string) => void
  error: (error: Error) => void
}

// One connection owns its microphone, playback, requests and event handlers.
// No browser SpeechRecognition / speechSynthesis is involved in natural voice.
export class RealtimeCoach {
  private peer: RTCPeerConnection | null = null
  private channel: RTCDataChannel | null = null
  private stream: MediaStream | null = null
  private audio: HTMLAudioElement | null = null
  private audioContext: AudioContext | null = null
  private inputAnalyser: AnalyserNode | null = null
  private outputAnalyser: AnalyserNode | null = null
  private meterSources: MediaStreamAudioSourceNode[] = []
  private controller = new AbortController()
  private raf = 0
  private timer = 0
  private connectionTimer = 0
  private responseTimer = 0
  private sessionId: string | null = null
  private closed = false
  private muted = false
  private speaking = false
  private responding = false
  private activeResponseId = ''
  private interruptedResponses = new Set<string>()
  private inputCaptions = new Map<string, string>()
  private options: VoiceOptions
  private pending = new Map<string, { id: string; responseId: string; text: string; interrupted: boolean }>()
  private completedResponses = new Set<string>()
  private seen = new Set<string>()
  constructor(options: VoiceOptions) { this.options = options }

  private send(event: unknown) {
    if (this.channel?.readyState === 'open') this.channel.send(JSON.stringify(event))
  }
  private fail(error: Error) { if (!this.closed) { this.options.error(error); this.stop() } }
  private waitForResponse() {
    window.clearTimeout(this.responseTimer)
    this.responseTimer = window.setTimeout(() => this.fail(new Error('The voice reply timed out. Please retry.')), 45_000)
  }

  async start() {
    this.options.state('thinking')
    try {
      const history: VoiceOptions['history'] = []
      let historyChars = 0
      for (const turn of this.options.history.slice(-24).reverse()) {
        if (historyChars + turn.content.length > 26000) break
        historyChars += turn.content.length
        history.unshift(turn)
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })
      if (this.closed) { stream.getTracks().forEach((track) => track.stop()); return }
      this.stream = stream
      this.peer = new RTCPeerConnection()
      this.audio = new Audio()
      this.audio.autoplay = true
      this.audio.setAttribute('playsinline', '')
      const peer = this.peer
      peer.ontrack = (event) => {
        if (this.closed || !this.audio) return
        this.audio.srcObject = event.streams[0] ?? new MediaStream([event.track])
        this.attachOutputMeter(this.audio.srcObject as MediaStream)
        void this.audio.play().catch(() => this.fail(new Error('Tap Retry to allow voice playback.')))
      }
      stream.getTracks().forEach((track) => {
        peer.addTrack(track, stream)
        track.onended = () => this.fail(new Error('The microphone disconnected. Reconnect it and retry.'))
      })
      peer.onconnectionstatechange = () => {
        window.clearTimeout(this.connectionTimer)
        if (peer.connectionState === 'failed') this.fail(new Error('Voice lost its connection. Your chat is saved; retry to continue.'))
        else if (peer.connectionState === 'disconnected') {
          // ICE can recover a brief network change without ending the call.
          this.connectionTimer = window.setTimeout(() => {
            if (peer.connectionState === 'disconnected') this.fail(new Error('Voice lost its connection. Your chat is saved; retry to continue.'))
          }, 5000)
        }
      }
      this.channel = peer.createDataChannel('oai-events')
      const opened = new Promise<void>((resolve, reject) => {
        const timer = window.setTimeout(() => {
          const error = new Error('Voice connection timed out. Please retry.')
          reject(error)
          this.fail(error)
        }, 35000)
        this.controller.signal.addEventListener('abort', () => { window.clearTimeout(timer); reject(new DOMException('Cancelled', 'AbortError')) }, { once: true })
        this.channel!.onopen = () => { window.clearTimeout(timer); resolve() }
      })
      // Attach rejection immediately while SDP negotiation is still running.
      void opened.catch(() => {})
      this.channel.onmessage = (event) => { try { this.handle(JSON.parse(event.data)) } catch { /* Ignore unrelated or malformed provider events. */ } }
      this.channel.onclose = () => this.fail(new Error('Voice ended. Retry to start a new session.'))
      await peer.setLocalDescription(await peer.createOffer())
      if (this.closed) return
      const session = await apiClient.post<{ id: string; sdp: string; maxMinutes: number }>('/ai/voice/connect', {
        sdp: peer.localDescription?.sdp, context: this.options.context, history,
      }, { signal: this.controller.signal })
      if (this.closed) { void apiClient.post('/ai/voice/end', { id: session.id }).catch(() => {}); return }
      this.sessionId = session.id
      await peer.setRemoteDescription({ type: 'answer', sdp: session.sdp })
      await opened
      if (this.closed) return
      for (const turn of history) this.send({ type: 'conversation.item.create', item: { type: 'message', role: turn.role,
        content: [{ type: turn.role === 'user' ? 'input_text' : 'output_text', text: turn.content }] } })
      this.send({ type: 'response.create', response: { instructions: this.options.context.mode === 'examiner'
        ? 'Begin the IELTS speaking mock: greet the candidate briefly and ask their full name. Ask one question only.'
        : 'Briefly greet the learner in their selected language and invite their next question. Use existing context naturally, without listing private memories.' } })
      this.waitForResponse()
      this.meter(stream)
      this.timer = window.setTimeout(() => this.fail(new Error('This voice session has finished. Start another session to continue.')), session.maxMinutes * 60000)
    } catch (error) {
      if (!this.closed) this.fail(error instanceof Error ? error : new Error('Voice could not connect. Please retry.'))
    }
  }

  private meter(stream: MediaStream) {
    try {
      this.audioContext ??= new AudioContext()
      void this.audioContext.resume().catch(() => {})
      this.inputAnalyser = this.audioContext.createAnalyser()
      this.inputAnalyser.fftSize = 512
      const source = this.audioContext.createMediaStreamSource(stream)
      source.connect(this.inputAnalyser)
      this.meterSources.push(source)
      const bytes = new Uint8Array(512)
      let smoothed = 0
      const tick = () => {
        if (this.closed) return
        const analyser = this.speaking ? this.outputAnalyser : this.inputAnalyser
        if (!analyser || (!this.speaking && this.muted)) {
          smoothed = 0; this.options.level(0); this.raf = requestAnimationFrame(tick); return
        }
        analyser.getByteTimeDomainData(bytes)
        const rms = Math.sqrt(bytes.reduce((sum, byte) => sum + ((byte - 128) / 128) ** 2, 0) / bytes.length)
        const target = Math.min(1, Math.max(0, (rms - .008) * 6))
        smoothed += (target - smoothed) * (target > smoothed ? .7 : .4)
        this.options.level(smoothed)
        this.raf = requestAnimationFrame(tick)
      }
      tick()
    } catch { this.options.level(0) }
  }

  private attachOutputMeter(stream: MediaStream) {
    try {
      this.audioContext ??= new AudioContext()
      void this.audioContext.resume().catch(() => {})
      this.outputAnalyser = this.audioContext.createAnalyser()
      this.outputAnalyser.fftSize = 512
      const source = this.audioContext.createMediaStreamSource(stream)
      source.connect(this.outputAnalyser)
      this.meterSources.push(source)
      // HTMLAudioElement handles playback; the analyser never duplicates it.
    } catch { this.outputAnalyser = null }
  }

  private flush(responseId: string, interrupted = false) {
    // Transcript is committed only after playback finishes or is interrupted.
    for (const [key, value] of this.pending) {
      if (responseId && value.responseId !== responseId) continue
      if (value.text.trim()) this.options.message('assistant', value.text.trim(), value.id, interrupted || value.interrupted)
      this.pending.delete(key)
      this.seen.add(`assistant:${key}`)
    }
  }

  private handle(event: any) {
    if (this.closed) return
    const type = event.type as string
    if (type === 'error') {
      if (['response_cancel_not_active', 'conversation_already_has_active_response'].includes(event.error?.code)) return
      this.fail(new Error('Voice could not complete this turn. Please retry.')); return
    }
    if (type === 'input_audio_buffer.speech_started') {
      window.clearTimeout(this.responseTimer)
      if (this.speaking || this.responding) {
        if (this.activeResponseId) this.interruptedResponses.add(this.activeResponseId)
        this.flush('', true)
      }
      this.speaking = false; this.options.caption(''); this.options.state('listening')
    }
    if (type === 'input_audio_buffer.speech_stopped' || type === 'response.created') {
      this.options.state('thinking')
      this.waitForResponse()
    }
    if (type === 'response.created') { this.responding = true; this.activeResponseId = event.response?.id ?? '' }
    if (type === 'output_audio_buffer.started') { window.clearTimeout(this.responseTimer); this.speaking = true; this.activeResponseId = event.response_id ?? this.activeResponseId; this.options.state('speaking') }
    if (type === 'output_audio_buffer.stopped' || type === 'output_audio_buffer.cleared') {
      window.clearTimeout(this.responseTimer)
      this.speaking = false
      this.completedResponses.add(event.response_id)
      this.flush(event.response_id ?? '', type === 'output_audio_buffer.cleared')
      this.options.state('listening')
    }
    if (type === 'conversation.item.input_audio_transcription.delta') {
      const caption = (this.inputCaptions.get(event.item_id) ?? '') + (event.delta ?? '')
      this.inputCaptions.set(event.item_id, caption); this.options.caption(caption)
    }
    if (type === 'conversation.item.input_audio_transcription.completed') {
      const key = `user:${event.item_id}`
      if (typeof event.transcript === 'string' && event.transcript.trim() && !this.seen.has(key)) {
        this.seen.add(key); this.options.caption(event.transcript)
        this.inputCaptions.delete(event.item_id)
        this.options.message('user', event.transcript.trim(), event.item_id)
      }
    }
    if (type === 'response.output_audio_transcript.delta' || type === 'response.output_audio_transcript.done') {
      if (this.interruptedResponses.has(event.response_id)) return
      const key = `${event.item_id}:${event.content_index ?? 0}`
      if (this.seen.has(`assistant:${key}`)) return
      const previous = this.pending.get(key)
      const value = { id: event.item_id, responseId: event.response_id ?? previous?.responseId ?? '', text: type.endsWith('.done') ? event.transcript ?? previous?.text ?? '' : (previous?.text ?? '') + (event.delta ?? ''), interrupted: false }
      this.pending.set(key, value); this.options.caption(value.text)
      if (type.endsWith('.done') && this.completedResponses.has(value.responseId)) this.flush(value.responseId)
    }
    if ((type === 'conversation.item.added' || type === 'conversation.item.created') && event.item?.type === 'function_call_output') {
      const key = `tool:${event.item.call_id}`
      if (this.seen.has(key)) return
      const result = JSON.parse(event.item.output ?? '{}')
      if (result.profai_coach_result && typeof result.reply === 'string') {
        this.seen.add(key); this.options.coachResult(result, event.item.id ?? event.item.call_id)
      }
    }
    if (type === 'response.done' && event.response?.status === 'failed') this.fail(new Error('The voice service could not answer. Retry to continue.'))
    if (type === 'response.done') {
      this.responding = false
      if (event.response?.status === 'cancelled') { this.interruptedResponses.add(event.response.id); this.flush(event.response.id, true) }
    }
  }

  mute(muted: boolean) { this.muted = muted; this.stream?.getAudioTracks().forEach((track) => { track.enabled = !muted }) }
  async updateContext(context: VoiceContext) {
    this.options.context = context
    if (!this.closed && this.sessionId) await apiClient.post('/ai/voice/context', { id: this.sessionId, context }, { signal: this.controller.signal })
  }
  interrupt() {
    window.clearTimeout(this.responseTimer)
    if (this.activeResponseId) this.interruptedResponses.add(this.activeResponseId)
    if (this.responding) this.send({ type: 'response.cancel' })
    if (this.speaking) this.send({ type: 'output_audio_buffer.clear' })
    this.flush('', true); this.speaking = false; this.options.state('listening')
  }
  requestFeedback() {
    this.interrupt()
    this.send({ type: 'conversation.item.create', item: { type: 'message', role: 'user', content: [{ type: 'input_text', text: 'End this examiner practice and give written feedback on my actual answers. Use ask_coach. Do not invent a pronunciation band when the tool only receives text.' }] } })
    this.send({ type: 'response.create' })
  }
  stop() {
    if (this.closed) return
    this.closed = true
    this.flush('', true)
    this.controller.abort()
    window.clearTimeout(this.timer); cancelAnimationFrame(this.raf)
    window.clearTimeout(this.connectionTimer); window.clearTimeout(this.responseTimer)
    this.channel?.close(); this.peer?.close()
    this.stream?.getTracks().forEach((track) => { track.onended = null; track.stop() })
    this.audio?.pause(); if (this.audio) this.audio.srcObject = null
    this.meterSources.forEach((source) => source.disconnect()); this.meterSources = []
    this.inputAnalyser?.disconnect(); this.outputAnalyser?.disconnect()
    void this.audioContext?.close().catch(() => {})
    if (this.sessionId) void apiClient.post('/ai/voice/end', { id: this.sessionId }, { keepalive: true }).catch(() => {})
    this.options.state('idle'); this.options.level(0)
  }
}
