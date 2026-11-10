/* Continuous microphone PCM for Gemini Live. No browser speech recognition. */
class NovaPcmCapture extends AudioWorkletProcessor {
  constructor() {
    super()
    this.ratio = sampleRate / 16000
    this.weight = 0
    this.total = 0
    this.index = 0
    this.bytes = new ArrayBuffer(3200)
    this.view = new DataView(this.bytes)
  }
  process(inputs) {
    const channels = inputs[0]
    if (!channels?.length) return true
    for (let index = 0; index < channels[0].length; index++) {
      let sample = 0
      for (const channel of channels) sample += channel[index] / channels.length
      let available = 1
      while (available > 0) {
        const amount = Math.min(available, this.ratio - this.weight)
        this.total += sample * amount
        this.weight += amount
        available -= amount
        if (this.weight + 1e-8 >= this.ratio) {
          const value = Math.max(-1, Math.min(1, this.total / this.ratio))
          this.view.setInt16(this.index * 2, Math.round(value * (value < 0 ? 32768 : 32767)), true)
          this.index++
          this.weight = 0
          this.total = 0
          if (this.index === 1600) {
            this.port.postMessage({ pcm: this.bytes, capturedAt: currentTime }, [this.bytes])
            this.bytes = new ArrayBuffer(3200)
            this.view = new DataView(this.bytes)
            this.index = 0
          }
        }
      }
    }
    return true
  }
}
registerProcessor('nova-pcm-capture', NovaPcmCapture)
