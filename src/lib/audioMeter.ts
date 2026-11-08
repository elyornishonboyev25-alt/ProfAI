// Real microphone loudness meter via the Web Audio API. Used to make the voice orb
// pulse with the learner's ACTUAL voice while listening (not a fake animation), and to
// detect when they've stopped talking (silence) for hands-free turn-taking.
//
// Runs alongside SpeechRecognition (which captures speech separately) — Chrome/Edge
// allow both to read the mic at once. If permission/API is unavailable, the caller
// falls back to a synthetic pulse, so nothing ever breaks.

export type MicMeter = {
  /** Current loudness, ~0 (silence) → ~1 (loud), already smoothed + scaled. */
  getLevel: () => number
  stop: () => void
}

export async function createMicMeter(): Promise<MicMeter> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  let ctx: AudioContext | undefined
  let source: MediaStreamAudioSourceNode | undefined
  let analyser: AnalyserNode
  let stopped = false
  const stop = () => {
    if (stopped) return
    stopped = true
    for (const track of stream.getTracks()) { try { track.stop() } catch { /* Release the remaining tracks too. */ } }
    try { source?.disconnect() } catch { /* Already disconnected. */ }
    try { void ctx?.close().catch(() => {}) } catch { /* Already closed. */ }
  }
  try {
    const AudioCtx: typeof AudioContext =
      window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) throw new DOMException('Web Audio is unavailable.', 'NotSupportedError')
    ctx = new AudioCtx()
    source = ctx.createMediaStreamSource(stream)
    analyser = ctx.createAnalyser()
    analyser.fftSize = 512
    analyser.smoothingTimeConstant = 0.82
    source.connect(analyser)
  } catch (error) {
    stop()
    throw error
  }

  const data = new Uint8Array(analyser.frequencyBinCount)

  const getLevel = () => {
    if (stopped) return 0
    analyser.getByteTimeDomainData(data)
    let sum = 0
    for (let i = 0; i < data.length; i += 1) {
      const v = (data[i] - 128) / 128
      sum += v * v
    }
    const rms = Math.sqrt(sum / data.length)
    // Scale so normal speech lands in a lively 0.3–0.9 range.
    return Math.min(1, rms * 3.2)
  }

  return { getLevel, stop }
}
