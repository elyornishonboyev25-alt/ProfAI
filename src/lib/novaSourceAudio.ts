import { cancelCoachAudio } from './coachAudio'
import { acquireNovaAudio } from './novaAudioOwnership'

/** Only source replay owned by Nova. It has no access to runner completion callbacks. */
export class NovaSourceAudio {
  private audio: HTMLAudioElement | null = null
  private generation = 0
  private releaseOwnership: (() => void) | null = null
  private end: number | undefined
  private cancelLoading: (() => void) | null = null
  private boundaryTimer: number | null = null
  private ready = false
  get atBoundary() { return !!this.audio && (this.audio.ended || this.end !== undefined && this.audio.currentTime >= this.end - .05) }
  constructor(private changed: (state: 'idle' | 'playing' | 'paused' | 'error') => void) {}
  async play(url: string, start: number, end?: number, rate = 1) {
    this.stop()
    if (!Number.isFinite(start) || start < 0 || !Number.isFinite(rate) || end !== undefined && (!Number.isFinite(end) || end <= start)) { this.changed('error'); return false }
    if (!url.startsWith('/audio/') && !url.startsWith('/assets/') && !/^https:\/\/(?:[^/]+\.)?(?:ivygoo\.[a-z]+|supabase\.co)\//.test(url)) { this.changed('error'); return false }
    const generation = ++this.generation
    window.dispatchEvent(new CustomEvent('nova:interrupt', { detail: { source: 'original' } })); cancelCoachAudio()
    this.releaseOwnership = acquireNovaAudio('original', () => this.stop())
    const audio = new Audio(url); this.audio = audio; this.end = end
    audio.preload = 'metadata'; audio.playbackRate = Math.max(.5, Math.min(1.5, rate)); audio.preservesPitch = true
    audio.ontimeupdate = () => this.checkBoundary(audio)
    // Pause/resume changes generation; the same media element still owns its EOF.
    audio.onended = () => { if (this.audio === audio) { this.clearBoundaryTimer(); this.changed('idle'); this.release() } }
    audio.onerror = () => { if (this.audio === audio) { this.ready = false; this.clearBoundaryTimer(); this.changed('error'); this.release() } }
    try {
      await new Promise<void>((resolve, reject) => {
        const timeout = window.setTimeout(() => reject(new Error('Source audio timed out')), 15_000)
        const finish = () => { window.clearTimeout(timeout); resolve() }
        this.cancelLoading = finish
        audio.onloadedmetadata = () => {
          if (generation !== this.generation) { finish(); return }
          if (Number.isFinite(audio.duration) && start >= audio.duration) { window.clearTimeout(timeout); reject(new Error('Range is outside the source recording')); return }
          if (Number.isFinite(audio.duration)) this.end = Math.min(end ?? audio.duration, audio.duration)
          audio.currentTime = start; this.ready = true; finish()
        }
        audio.addEventListener('error', () => { window.clearTimeout(timeout); reject(new Error('Source audio unavailable')) }, { once: true })
      })
      if (generation !== this.generation) return false
      this.cancelLoading = null
      await audio.play()
      if (generation !== this.generation) { audio.pause(); return false }
      this.watchBoundary(audio)
      this.changed('playing')
      return true
    } catch { if (generation === this.generation) { this.ready = false; this.changed('error'); this.release() }; return false }
  }
  pause() { this.generation++; this.clearBoundaryTimer(); this.cancelLoading?.(); this.cancelLoading = null; this.audio?.pause(); this.changed('paused'); this.release() }
  async resume() {
    if (!this.audio || !this.ready || this.atBoundary) return false
    if (!this.audio.paused) return true
    const audio = this.audio, generation = this.generation
    window.dispatchEvent(new CustomEvent('nova:interrupt', { detail: { source: 'original' } })); cancelCoachAudio()
    this.releaseOwnership = acquireNovaAudio('original', () => this.stop())
    try { await audio.play(); if (generation !== this.generation) { audio.pause(); return false }; this.watchBoundary(audio); this.changed('playing'); return true } catch { if (generation === this.generation) { this.changed('error'); this.release() }; return false }
  }
  setRate(rate: number) { if (this.audio && Number.isFinite(rate)) this.audio.playbackRate = Math.max(.5, Math.min(1.5, rate)) }
  private checkBoundary(audio: HTMLAudioElement) {
    if (this.audio === audio && !audio.paused && this.end !== undefined && audio.currentTime >= this.end) {
      audio.currentTime = this.end; this.pause()
    }
  }
  private watchBoundary(audio: HTMLAudioElement) { this.clearBoundaryTimer(); this.boundaryTimer = window.setInterval(() => this.checkBoundary(audio), 25) }
  private clearBoundaryTimer() { if (this.boundaryTimer !== null) window.clearInterval(this.boundaryTimer); this.boundaryTimer = null }
  private release() { this.releaseOwnership?.(); this.releaseOwnership = null }
  stop() { this.generation++; this.ready = false; this.clearBoundaryTimer(); this.cancelLoading?.(); this.cancelLoading = null; if (this.audio) { this.audio.onended = this.audio.onerror = this.audio.ontimeupdate = this.audio.onloadedmetadata = null; this.audio.pause(); this.audio.removeAttribute('src'); this.audio.load(); this.audio = null }; this.release(); this.changed('idle') }
}
