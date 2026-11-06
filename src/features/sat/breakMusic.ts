export type SATBreakMusicPreset = 'ambient' | 'piano'

// Original, quiet chord patterns. Audio is produced locally after a user gesture.
const chords = [[48, 55, 59, 64], [45, 52, 57, 60], [41, 48, 52, 57], [43, 50, 55, 60]]

export function createSATBreakMusic(preset: SATBreakMusicPreset, volume: number) {
  const Context = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Context) throw new Error('Audio is unavailable')
  const context = new Context()
  const master = context.createGain()
  master.gain.value = 0
  master.connect(context.destination)
  let disposed = false
  let timer: ReturnType<typeof setInterval> | undefined
  let nextChord = context.currentTime + .06
  let chordIndex = 0

  const setVolume = (value: number) => {
    if (disposed) return
    master.gain.setTargetAtTime(Math.max(0, Math.min(1, value)) * .6, context.currentTime, .12)
  }

  const note = (midi: number, start: number, duration: number, peak: number) => {
    const oscillator = context.createOscillator()
    const envelope = context.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = 440 * 2 ** ((midi - 69) / 12)
    envelope.gain.setValueAtTime(.0001, start)
    envelope.gain.exponentialRampToValueAtTime(peak, start + (preset === 'ambient' ? 1.8 : .025))
    envelope.gain.exponentialRampToValueAtTime(.0001, start + duration)
    oscillator.connect(envelope)
    envelope.connect(master)
    oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect() }
    oscillator.start(start)
    oscillator.stop(start + duration + .05)
  }

  const schedule = () => {
    if (disposed || context.state !== 'running') return
    // A backgrounded tab may wake late. Resume softly instead of queuing old notes.
    nextChord = Math.max(nextChord, context.currentTime + .06)
    while (nextChord < context.currentTime + 12) {
      const chord = chords[chordIndex % chords.length]
      if (preset === 'ambient') {
        chord.forEach((midi, index) => note(midi, nextChord + index * .12, 10, .1))
      } else {
        ;[0, 2, 1, 3, 2, 1, 3, 2].forEach((index, beat) => {
          note(chord[index] + 12, nextChord + beat, 3.8, .15)
          note(chord[index] + 24, nextChord + beat, 2.4, .018)
        })
      }
      chordIndex += 1
      nextChord += 8
    }
  }

  return {
    async play() {
      await context.resume()
      if (disposed) return
      if (context.state !== 'running') throw new Error('Audio did not start')
      setVolume(volume)
      schedule()
      timer = setInterval(schedule, 1000)
    },
    setVolume,
    stop() {
      if (disposed) return
      disposed = true
      clearInterval(timer)
      master.gain.cancelScheduledValues(context.currentTime)
      master.gain.setTargetAtTime(.0001, context.currentTime, .035)
      // A short release avoids a click when pausing, switching tracks or leaving.
      setTimeout(() => { void context.close().catch(() => {}) }, 160)
    },
  }
}
