/** Shared local VAD for Gemini manual activity + held-space control. PCM remains native. */
export class NovaTurnGate {
  private active = false
  private held = false
  private heard = false
  private silenceMs = 0
  private prefix: Uint8Array[] = []
  private ending = false
  constructor(private callbacks: { start: () => void; audio: (pcm: Uint8Array) => void; end: () => void }, private pauseMs = 1100) {}
  hold() { if (this.held) return; this.held = true; this.ending = false }
  release() { if (!this.held) return; this.held = false; this.ending = this.active; this.silenceMs = 0 }
  push(bytes: Uint8Array) {
    if (!bytes.length || bytes.length % 2) return
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    let energy = 0
    for (let at = 0; at < bytes.length; at += 2) energy += (view.getInt16(at, true) / 32768) ** 2
    const speech = Math.sqrt(energy / (bytes.length / 2)) > .018
    const durationMs = bytes.length / 32
    if (speech) this.heard = true
    if (!this.active) {
      this.prefix.push(bytes.slice()); if (this.prefix.length > 3) this.prefix.shift()
      if (!speech) return
      this.active = true; this.callbacks.start()
      for (const frame of this.prefix) this.callbacks.audio(frame)
      this.prefix = []
    } else this.callbacks.audio(bytes)
    this.silenceMs = speech ? 0 : this.silenceMs + durationMs
    if (!this.held && (this.ending ? this.silenceMs >= 200 : this.silenceMs >= this.pauseMs)) this.finish()
  }
  finish() { if (this.active && this.heard) this.callbacks.end(); this.active = false; this.heard = false; this.silenceMs = 0; this.prefix = []; this.ending = false }
  cancel() { this.active = false; this.heard = false; this.held = false; this.ending = false; this.silenceMs = 0; this.prefix = [] }
}
