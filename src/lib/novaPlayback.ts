import { readNovaPerformance, type NovaPerformance } from './novaPersona'
import type { PerformanceCue } from './novaLearning'

/** Response-scoped cues use the playback clock, not transcript arrival time. */
export class NovaPlayback {
  private cues = new Map<string, NovaPerformance>()
  private cancelled = new Set<string>()
  private active: string | null = null
  private starts = new Map<string, number>()
  private scheduled: Array<{ id: string; at: number; value: NovaPerformance }> = []
  private histories = new Map<string, PerformanceCue[]>()
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
  timeline(responseId: string) { return this.histories.get(responseId)?.slice() ?? [] }
  begin(responseId: string, at: number) {
    if (!this.cancelled.has(responseId) && Number.isFinite(at)) this.starts.set(responseId, at)
  }
  schedule(responseId: string, value: unknown, at: number) {
    const performance = readNovaPerformance(value)
    if (!performance || !Number.isFinite(at) || this.cancelled.has(responseId)) return
    const previous = this.scheduled.filter(cue => cue.id === responseId)
    const history = this.histories.get(responseId) ?? []
    if (previous.length + history.length >= 6) return
    const last = previous[previous.length - 1]
    if (last && (at - last.at < .35 || JSON.stringify(last.value) === JSON.stringify(performance))) return
    this.scheduled.push({ id: responseId, at, value: performance })
    this.scheduled.sort((a, b) => a.at - b.at)
  }
  /** Called from the audio render/meter loop: suspension cannot advance a cue. */
  advance(audioSeconds: number) {
    for (const [id, at] of this.starts) if (at <= audioSeconds && !this.cancelled.has(id) && !this.histories.has(id)) {
      this.histories.set(id, [])
      this.start(id)
      const value = this.cues.get(id)
      if (value) this.histories.get(id)!.push({ atMs: 0, performance: value, alignment: 'audio_clock' })
    }
    while (this.scheduled[0]?.at <= audioSeconds) {
      const cue = this.scheduled.shift()!
      if (this.cancelled.has(cue.id)) continue
      this.cue(cue.id, cue.value)
      const start = this.starts.get(cue.id)
      if (start !== undefined) {
        const history = this.histories.get(cue.id) ?? []
        if (history.length < 6) history.push({ atMs: Math.max(0, Math.round((cue.at - start) * 1000)), performance: cue.value, alignment: 'audio_clock' })
        this.histories.set(cue.id, history)
      }
    }
  }
  finish(responseId: string) {
    if (this.active === responseId) { this.active = null; this.publish(null, responseId) }
    this.cues.delete(responseId)
    this.starts.delete(responseId); this.histories.delete(responseId)
    this.scheduled = this.scheduled.filter(cue => cue.id !== responseId)
    this.cancelled.add(responseId)
    // Provider sessions are bounded; retain recent tombstones against late events.
    if (this.cancelled.size > 256) this.cancelled.delete(this.cancelled.values().next().value!)
  }
  reset() {
    if (this.active) this.publish(null, this.active)
    this.active = null; this.cues.clear(); this.cancelled.clear(); this.starts.clear(); this.scheduled = []; this.histories.clear()
  }
}
