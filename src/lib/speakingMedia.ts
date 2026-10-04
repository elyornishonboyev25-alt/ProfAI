export function canRecordAudio(): boolean {
  return typeof navigator.mediaDevices?.getUserMedia === 'function' && typeof MediaRecorder !== 'undefined'
}

export function requestSpeakingMicrophone(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    audio: { channelCount: { ideal: 1 }, sampleRate: { ideal: 48_000 }, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    video: false,
  })
}

// WebKit's speech recognizer can take over the microphone/audio session from
// MediaRecorder. Record first on Apple devices and transcribe the actual file.
export function canRecognizeWhileRecording(): boolean {
  return !(/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
    (/Apple/.test(navigator.vendor) && /Safari/.test(navigator.userAgent)))
}

export function microphoneError(error: unknown): string {
  const name = error instanceof Error ? error.name : ''
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'Microphone access is blocked. Allow microphone access in your browser settings, then retry.'
  if (name === 'NotFoundError') return 'No microphone was found. Connect a microphone, then retry.'
  if (name === 'NotReadableError' || name === 'AbortError') return 'The microphone is busy or unavailable. Close other apps using it, then retry.'
  return 'Could not start recording. Check your microphone connection and browser permissions, then retry.'
}

export function createAudioContext(): AudioContext | null {
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  return Ctor ? new Ctor() : null
}

/** Owns chunks from one recording, including the last dataavailable on stop. */
export class AnswerRecording {
  readonly recorder: MediaRecorder
  private chunks: Blob[] = []
  private result: Promise<Blob>
  private stopping = false

  constructor(stream: MediaStream, onError?: () => void) {
    const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus']
      .find((type) => MediaRecorder.isTypeSupported(type))
    const options = { audioBitsPerSecond: 96_000, ...(mimeType ? { mimeType } : {}) }
    try { this.recorder = new MediaRecorder(stream, options) }
    catch { this.recorder = new MediaRecorder(stream) }
    this.result = new Promise((resolve) => {
      this.recorder.ondataavailable = (event) => { if (event.data.size) this.chunks.push(event.data) }
      this.recorder.onstop = () => resolve(this.blob())
    })
    this.recorder.onerror = () => onError?.()
    this.recorder.start(1000)
  }

  private blob(): Blob {
    return new Blob(this.chunks, { type: this.recorder.mimeType || this.chunks[0]?.type || 'audio/webm' })
  }

  async stop(): Promise<Blob> {
    if (!this.stopping) {
      this.stopping = true
      if (this.recorder.state !== 'inactive') {
        try { this.recorder.stop() } catch { /* A disconnected recorder can still have flushed chunks. */ }
      }
    }
    let timer: ReturnType<typeof setTimeout> | undefined
    try {
      // Some interrupted WebKit sessions omit onstop; keep any flushed chunks.
      return await Promise.race([this.result, new Promise<Blob>((resolve) => {
        timer = setTimeout(() => resolve(this.blob()), 5000)
      })])
    } finally { clearTimeout(timer) }
  }
}
