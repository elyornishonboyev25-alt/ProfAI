/**
 * Synthesised wheel sound design (no audio files):
 * - press: a soft tactile click on the hub
 * - spin: a low tension pad and a release whoosh while the wheel turns
 * - tick: a layered peg click whose body gets heavier as the wheel slows
 * - stop: a soft thud when the wheel settles
 * - win: FM bell arpeggio with room reverb; the jackpot adds a brass fanfare and sparkles
 * Browsers only allow audio after a tap, so call `unlock()` from a click handler.
 */
type AudioContextClass = typeof AudioContext

export class WheelSound {
  private ctx: AudioContext | null = null
  private bus: GainNode | null = null
  private reverb: GainNode | null = null
  private noise: AudioBuffer | null = null
  private pad: { stop: (at: number) => void } | null = null
  muted = false

  unlock() {
    if (!this.ctx) {
      const Context = (window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextClass }).webkitAudioContext) as AudioContextClass | undefined
      if (!Context) return
      const ctx = new Context()
      const compressor = ctx.createDynamicsCompressor()
      compressor.threshold.value = -16
      compressor.ratio.value = 3.5
      compressor.attack.value = 0.004
      compressor.release.value = 0.2
      compressor.connect(ctx.destination)
      const bus = ctx.createGain()
      bus.gain.value = 0.85
      bus.connect(compressor)
      // A short generated room impulse gives every sound the same soft space.
      const convolver = ctx.createConvolver()
      convolver.buffer = this.impulse(ctx, 1.8)
      const reverb = ctx.createGain()
      reverb.gain.value = 0.22
      reverb.connect(convolver).connect(compressor)
      const length = Math.floor(ctx.sampleRate * 0.8)
      const noise = ctx.createBuffer(1, length, ctx.sampleRate)
      const data = noise.getChannelData(0)
      for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1
      Object.assign(this, { ctx, bus, reverb, noise })
    }
    if (this.ctx?.state === 'suspended') void this.ctx.resume()
  }

  private impulse(ctx: AudioContext, seconds: number) {
    const length = Math.floor(ctx.sampleRate * seconds)
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate)
    for (let channel = 0; channel < 2; channel += 1) {
      const data = buffer.getChannelData(channel)
      for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3.2)
    }
    return buffer
  }

  private live() {
    const { ctx, bus, reverb } = this
    return !this.muted && ctx && bus && reverb && ctx.state === 'running' ? { ctx, bus, reverb } : null
  }

  /** Routes a node to the dry bus and, optionally, to the reverb. */
  private out(node: AudioNode, wet = 0) {
    const live = this.live()
    if (!live) return
    node.connect(live.bus)
    if (wet > 0) {
      const send = live.ctx.createGain()
      send.gain.value = wet
      node.connect(send).connect(live.reverb)
    }
  }

  private envelope(ctx: AudioContext, start: number, peak: number, attack: number, decay: number) {
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(peak, start + attack)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + attack + decay)
    return gain
  }

  press() {
    const live = this.live()
    if (!live) return
    const { ctx } = live
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(720, now)
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.07)
    const gain = this.envelope(ctx, now, 0.35, 0.004, 0.08)
    osc.connect(gain)
    this.out(gain, 0.08)
    osc.start(now)
    osc.stop(now + 0.1)
  }

  /** Starts the spin bed: a release whoosh plus a low pad that fades out on stop(). */
  spinStart() {
    const live = this.live()
    if (!live || !this.noise) return
    const { ctx } = live
    const now = ctx.currentTime

    const whoosh = ctx.createBufferSource()
    whoosh.buffer = this.noise
    const band = ctx.createBiquadFilter()
    band.type = 'bandpass'
    band.Q.value = 0.8
    band.frequency.setValueAtTime(300, now)
    band.frequency.exponentialRampToValueAtTime(2600, now + 0.5)
    band.frequency.exponentialRampToValueAtTime(900, now + 1.1)
    const whooshGain = ctx.createGain()
    whooshGain.gain.setValueAtTime(0.0001, now)
    whooshGain.gain.exponentialRampToValueAtTime(0.3, now + 0.16)
    whooshGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1)
    whoosh.connect(band).connect(whooshGain)
    this.out(whooshGain, 0.3)
    whoosh.start(now)
    whoosh.stop(now + 1.2)

    const lowpass = ctx.createBiquadFilter()
    lowpass.type = 'lowpass'
    lowpass.frequency.value = 520
    const padGain = ctx.createGain()
    padGain.gain.setValueAtTime(0.0001, now)
    padGain.gain.exponentialRampToValueAtTime(0.05, now + 0.8)
    const tremolo = ctx.createOscillator()
    tremolo.frequency.value = 5.5
    const tremoloDepth = ctx.createGain()
    tremoloDepth.gain.value = 0.012
    tremolo.connect(tremoloDepth).connect(padGain.gain)
    const voices = [110, 164.81, 220.5].map(frequency => {
      const osc = ctx.createOscillator()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(frequency, now)
      osc.frequency.linearRampToValueAtTime(frequency * 1.06, now + 5)
      osc.connect(lowpass)
      osc.start(now)
      return osc
    })
    lowpass.connect(padGain)
    this.out(padGain, 0.25)
    tremolo.start(now)
    this.pad = { stop: at => {
      padGain.gain.cancelScheduledValues(at)
      padGain.gain.setValueAtTime(Math.max(0.0001, padGain.gain.value), at)
      padGain.gain.exponentialRampToValueAtTime(0.0001, at + 0.6)
      for (const osc of [...voices, tremolo]) osc.stop(at + 0.7)
    } }
  }

  /** One peg passing the pointer. `speed` is roughly 0 (crawling) to 1+ (fast). */
  tick(speed = 1) {
    const live = this.live()
    if (!live || !this.noise) return
    const { ctx } = live
    const now = ctx.currentTime
    const fast = Math.min(1, Math.max(0, speed))
    const level = 0.22 + fast * 0.16
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null
    if (pan) pan.pan.value = (Math.random() - 0.5) * 0.24
    const target: AudioNode = pan ?? ctx.createGain()

    const click = ctx.createBufferSource()
    click.buffer = this.noise
    const high = ctx.createBiquadFilter()
    high.type = 'highpass'
    high.frequency.value = 2200
    const peak = ctx.createBiquadFilter()
    peak.type = 'peaking'
    peak.frequency.value = 4600
    peak.gain.value = 8
    const clickGain = this.envelope(ctx, now, level, 0.001, 0.018)
    click.connect(high).connect(peak).connect(clickGain).connect(target)
    click.start(now, Math.random() * 0.6, 0.03)

    const body = ctx.createOscillator()
    body.type = 'sine'
    const pitch = 1750 + Math.random() * 160
    body.frequency.setValueAtTime(pitch, now)
    body.frequency.exponentialRampToValueAtTime(pitch * 0.48, now + 0.035)
    const bodyGain = this.envelope(ctx, now, level * 0.5, 0.002, 0.045)
    body.connect(bodyGain).connect(target)
    body.start(now)
    body.stop(now + 0.06)

    // Slow ticks get a heavier wooden knock, like a real wheel losing speed.
    const weight = 1 - fast
    if (weight > 0.25) {
      const knock = ctx.createOscillator()
      knock.type = 'sine'
      knock.frequency.setValueAtTime(210, now)
      knock.frequency.exponentialRampToValueAtTime(120, now + 0.05)
      const knockGain = this.envelope(ctx, now, 0.28 * weight, 0.002, 0.06)
      knock.connect(knockGain).connect(target)
      knock.start(now)
      knock.stop(now + 0.08)
    }
    this.out(target, 0.06)
  }

  stop() {
    const live = this.live()
    if (!live) return
    const { ctx } = live
    const now = ctx.currentTime
    this.pad?.stop(now)
    this.pad = null
    const thud = ctx.createOscillator()
    thud.type = 'sine'
    thud.frequency.setValueAtTime(140, now)
    thud.frequency.exponentialRampToValueAtTime(70, now + 0.16)
    const gain = this.envelope(ctx, now, 0.4, 0.004, 0.2)
    thud.connect(gain)
    this.out(gain, 0.15)
    thud.start(now)
    thud.stop(now + 0.25)
  }

  /** FM bell: bright attack, warm tail. */
  private bell(frequency: number, start: number, level: number, duration = 1.4) {
    const live = this.live()
    if (!live) return
    const { ctx } = live
    const carrier = ctx.createOscillator()
    carrier.frequency.value = frequency
    const modulator = ctx.createOscillator()
    modulator.frequency.value = frequency * 3.5
    const index = ctx.createGain()
    index.gain.setValueAtTime(frequency * 2.2, start)
    index.gain.exponentialRampToValueAtTime(1, start + duration * 0.7)
    modulator.connect(index).connect(carrier.frequency)
    const gain = this.envelope(ctx, start, level, 0.006, duration)
    carrier.connect(gain)
    this.out(gain, 0.45)
    modulator.start(start); carrier.start(start)
    modulator.stop(start + duration + 0.1); carrier.stop(start + duration + 0.1)
  }

  private brass(frequencies: number[], start: number, duration: number, level: number) {
    const live = this.live()
    if (!live) return
    const { ctx } = live
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(600, start)
    filter.frequency.exponentialRampToValueAtTime(3200, start + 0.08)
    filter.frequency.exponentialRampToValueAtTime(1400, start + duration)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(level, start + 0.04)
    gain.gain.setValueAtTime(level, start + duration * 0.7)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
    filter.connect(gain)
    this.out(gain, 0.35)
    for (const frequency of frequencies) {
      for (const detune of [-6, 6]) {
        const osc = ctx.createOscillator()
        osc.type = 'sawtooth'
        osc.frequency.value = frequency
        osc.detune.value = detune
        osc.connect(filter)
        osc.start(start)
        osc.stop(start + duration + 0.05)
      }
    }
  }

  win(jackpot: boolean) {
    const live = this.live()
    if (!live) return
    const now = live.ctx.currentTime + 0.08
    if (!jackpot) {
      ;[783.99, 987.77, 1174.66, 1567.98].forEach((frequency, index) => this.bell(frequency, now + index * 0.11, 0.16))
      this.bell(2093, now + 0.5, 0.06, 1.8)
      return
    }
    // Jackpot: a short brass fanfare under a rising bell cascade, then sparkles.
    this.brass([261.63, 329.63, 392], now, 0.22, 0.07)
    this.brass([349.23, 440, 523.25], now + 0.24, 0.22, 0.07)
    this.brass([392, 493.88, 587.33], now + 0.48, 0.22, 0.075)
    this.brass([523.25, 659.25, 783.99, 1046.5], now + 0.74, 1.3, 0.085)
    ;[1046.5, 1318.5, 1567.98, 2093].forEach((frequency, index) => this.bell(frequency, now + 0.74 + index * 0.09, 0.12, 1.6))
    for (let i = 0; i < 14; i += 1) this.bell(2400 + Math.random() * 2200, now + 1.1 + i * 0.06, 0.035, 0.5)
  }
}
