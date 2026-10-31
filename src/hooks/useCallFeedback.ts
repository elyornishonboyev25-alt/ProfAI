import { useEffect, useRef, useState } from 'react'

/** Quiet call cues. Browsers unlock audio only after a learner's interaction. */
export function useCallFeedback(incoming: boolean, outgoing: boolean) {
  const [sound, setSound] = useState(true)
  const context = useRef<AudioContext | null>(null)
  useEffect(() => {
    const unlock = () => {
      if (!window.AudioContext) return
      context.current ??= new AudioContext()
      void context.current.resume().catch(() => {})
    }
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    return () => { window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock); void context.current?.close().catch(() => {}); context.current = null }
  }, [])
  useEffect(() => {
    if (!sound || (!incoming && !outgoing)) return
    const active = new Set<OscillatorNode>()
    const cue = () => {
      const audio = context.current
      if (!audio || audio.state !== 'running') return
      ;(incoming ? [523.25, 659.25] : [440, 523.25]).forEach((frequency, index) => {
        const oscillator = audio.createOscillator()
        const gain = audio.createGain()
        oscillator.type = 'sine'; oscillator.frequency.value = frequency
        const start = audio.currentTime + index * .18
        gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(.035, start + .025); gain.gain.exponentialRampToValueAtTime(.001, start + .3)
        oscillator.connect(gain); gain.connect(audio.destination)
        active.add(oscillator)
        oscillator.onended = () => { active.delete(oscillator); oscillator.disconnect(); gain.disconnect() }
        oscillator.start(start); oscillator.stop(start + .32)
      })
    }
    cue()
    const interval = window.setInterval(cue, incoming ? 3200 : 4500)
    return () => { window.clearInterval(interval); active.forEach(node => { try { node.stop() } catch { /* already ended */ } }); active.clear() }
  }, [incoming, outgoing, sound])
  return { sound, toggleSound: () => setSound(value => !value) }
}
