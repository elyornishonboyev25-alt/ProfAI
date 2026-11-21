import { readNovaPerformance, type NovaPerformance } from './novaPersona'

/** Response-scoped cues use the playback clock, not transcript arrival time. */
export class NovaPlayback {
  private cues = new Map<string, NovaPerformance>()
  private cancelled = new Set<string>()
  private active: string | null = null
  constructor(private publish: (performance: NovaPerformance | null, responseId: string) => void) {}

  cue(responseId: string, value: unknown) {
    const performance = readNovaPerformance(value)
    if (!performance || this.cancelled.has(responseId)) return
    this.cues.set(responseId, performance)
    if (this.active === responseId) this.publish(performance, responseId)
  }
  start(responseId: string) {
    if (this.cancelled.has(responseId)) return
    this.active = responseId
    this.publish(this.cues.get(responseId) ?? null, responseId)
  }
  get(responseId: string) { return this.cues.get(responseId) }
  finish(responseId: string) {
    if (this.active === responseId) { this.active = null; this.publish(null, responseId) }
    this.cues.delete(responseId)
    this.cancelled.add(responseId)
    // Provider sessions are bounded; retain recent tombstones against late events.
    if (this.cancelled.size > 256) this.cancelled.delete(this.cancelled.values().next().value!)
  }
  reset() {
    if (this.active) this.publish(null, this.active)
    this.active = null; this.cues.clear(); this.cancelled.clear()
  }
}
