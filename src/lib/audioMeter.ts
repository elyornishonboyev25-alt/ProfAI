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
  const AudioCtx: typeof AudioContext =
    window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  const ctx = new AudioCtx()
  const source = ctx.createMediaStreamSource(stream)
  const analyser = ctx.createAnalyser()
  analyser.fftSize = 512
  analyser.smoothingTimeConstant = 0.82
  source.connect(analyser)

  const data = new Uint8Array(analyser.frequencyBinCount)

  const getLevel = () => {
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

  const stop = () => {
    try {
      stream.getTracks().forEach((track) => track.stop())
    } catch {
      /* ignore */
    }
    try {
      source.disconnect()
    } catch {
      /* ignore */
    }
    try {
      void ctx.close()
    } catch {
      /* ignore */
    }
  }

  return { getLevel, stop }
}
