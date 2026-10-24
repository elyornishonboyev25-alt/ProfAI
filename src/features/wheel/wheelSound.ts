/**
 * Synthesised wheel sounds (no audio files): a pointer tick for every segment,
 * a whoosh when the spin starts and a short win jingle — a brighter fanfare for the jackpot.
 * Browsers only allow audio after a tap, so call `unlock()` from the spin button handler.
 */
type AudioContextClass = typeof AudioContext

export class WheelSound {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private noise: AudioBuffer | null = null
  muted = false

  unlock() {
    if (!this.ctx) {
      const Context = (window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextClass }).webkitAudioContext) as AudioContextClass | undefined
      if (!Context) return
      this.ctx = new Context()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0.9
      this.master.connect(this.ctx.destination)
      const length = Math.floor(this.ctx.sampleRate * 0.6)
      this.noise = this.ctx.createBuffer(1, length, this.ctx.sampleRate)
      const data = this.noise.getChannelData(0)
      for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
  }

  private ready() {
    return !this.muted && this.ctx && this.master && this.ctx.state === 'running' ? { ctx: this.ctx, out: this.master } : null
  }

  /** The pointer flapping against a peg: a short filtered click with a small wooden body. */
  tick(speed = 1) {
    const audio = this.ready()
    if (!audio || !this.noise) return
    const { ctx, out } = audio
    const now = ctx.currentTime
    const level = 0.32 + Math.min(1, speed) * 0.22

    const click = ctx.createBufferSource()
    click.buffer = this.noise
    const band = ctx.createBiquadFilter()
    band.type = 'bandpass'
    band.frequency.value = 3200
    band.Q.value = 1.4
    const clickGain = ctx.createGain()
    clickGain.gain.setValueAtTime(level, now)
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.028)
    click.connect(band).connect(clickGain).connect(out)
    click.start(now, Math.random() * 0.4, 0.035)

    const body = ctx.createOscillator()
    body.type = 'triangle'
    body.frequency.setValueAtTime(1350, now)
    body.frequency.exponentialRampToValueAtTime(620, now + 0.045)
    const bodyGain = ctx.createGain()
    bodyGain.gain.setValueAtTime(level * 0.55, now)
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05)
    body.connect(bodyGain).connect(out)
    body.start(now)
    body.stop(now + 0.06)
  }

  /** A soft rising whoosh as the wheel is released. */
  whoosh() {
    const audio = this.ready()
    if (!audio || !this.noise) return
    const { ctx, out } = audio
    const now = ctx.currentTime
    const source = ctx.createBufferSource()
    source.buffer = this.noise
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.Q.value = 0.9
    filter.frequency.setValueAtTime(400, now)
    filter.frequency.exponentialRampToValueAtTime(2400, now + 0.45)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.28, now + 0.12)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55)
    source.connect(filter).connect(gain).connect(out)
    source.start(now)
    source.stop(now + 0.6)
  }

  private note(frequency: number, start: number, duration: number, level: number, type: OscillatorType = 'triangle') {
    const audio = this.ready()
    if (!audio) return
    const { ctx, out } = audio
    const oscillator = ctx.createOscillator()
    oscillator.type = type
    oscillator.frequency.value = frequency
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(level, start + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
    oscillator.connect(gain).connect(out)
    oscillator.start(start)
    oscillator.stop(start + duration + 0.02)
  }

  /** A bright major arpeggio; the jackpot adds a held chord and sparkles. */
  win(jackpot: boolean) {
    const audio = this.ready()
    if (!audio) return
    const now = audio.ctx.currentTime + 0.05
    const arpeggio = [523.25, 659.25, 783.99, 1046.5]
    arpeggio.forEach((frequency, index) => this.note(frequency, now + index * 0.09, 0.32, 0.22))
    if (!jackpot) return
    const chordAt = now + arpeggio.length * 0.09 + 0.05
    for (const frequency of [523.25, 659.25, 783.99, 1046.5, 1318.5]) this.note(frequency, chordAt, 1.3, 0.12, 'sine')
    for (let i = 0; i < 10; i += 1) this.note(1800 + Math.random() * 1600, chordAt + 0.1 + i * 0.07, 0.16, 0.06, 'sine')
  }
}
