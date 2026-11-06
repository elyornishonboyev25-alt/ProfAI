export const SAT_BREAK_NATURE_AUDIO = '/audio/sat/quiet-nature.mp3'

/** One real field recording, streamed only after Play; Web Audio supplies soft fades. */
export function createSATBreakMusic(volume: number, onError?: () => void) {
  const Context = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Context) throw new Error('Audio is unavailable')
  const context = new Context()
  const audio = new window.Audio()
  audio.preload = 'none'
  audio.src = SAT_BREAK_NATURE_AUDIO
  audio.loop = true
  const master = context.createGain()
  master.gain.value = 0
  let source: MediaElementAudioSourceNode
  try {
    source = context.createMediaElementSource(audio)
    source.connect(master)
    master.connect(context.destination)
  } catch (error) {
    void context.close().catch(() => {})
    throw error
  }
  let disposed = false
  let started = false
  let volumeLevel = volume
  const playbackError = () => { if (started && !disposed) onError?.() }
  audio.addEventListener('error', playbackError)

  const applyVolume = (value: number, fade: number) => {
    if (disposed) return
    master.gain.setTargetAtTime(Math.max(0, Math.min(1, value)) * .6, context.currentTime, fade)
  }

  return {
    async play() {
      // Start both inside the user gesture, including on mobile Safari.
      await Promise.all([context.resume(), audio.play()])
      if (disposed) { audio.pause(); return }
      if (context.state !== 'running' || audio.paused) throw new Error('Audio did not start')
      started = true
      applyVolume(volumeLevel, .45)
    },
    setVolume(value: number) {
      volumeLevel = value
      if (started) applyVolume(value, .12)
    },
    stop() {
      if (disposed) return
      disposed = true
      audio.removeEventListener('error', playbackError)
      master.gain.cancelScheduledValues(context.currentTime)
      master.gain.setTargetAtTime(.0001, context.currentTime, .035)
      setTimeout(() => {
        audio.pause()
        audio.removeAttribute('src')
        audio.load()
        source.disconnect()
        master.disconnect()
        void context.close().catch(() => {})
      }, 160)
    },
  }
}
