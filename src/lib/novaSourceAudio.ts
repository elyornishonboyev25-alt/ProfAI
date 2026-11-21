import { cancelCoachAudio } from './coachAudio'
import { acquireNovaAudio } from './novaAudioOwnership'

/** Only source replay owned by Nova. It has no access to runner completion callbacks. */
export class NovaSourceAudio {
  private audio: HTMLAudioElement | null = null
  private generation = 0
  private releaseOwnership: (() => void) | null = null
  private end: number | undefined
  private cancelLoading: (() => void) | null = null
  get atBoundary() { return !!this.audio && (this.audio.ended || this.end !== undefined && this.audio.currentTime >= this.end - .05) }
  constructor(private changed: (state: 'idle' | 'playing' | 'paused' | 'error') => void) {}
  async play(url: string, start: number, end?: number, rate = 1) {
    this.stop()
    if (!url.startsWith('/audio/') && !url.startsWith('/assets/') && !/^https:\/\/(?:[^/]+\.)?(?:ivygoo\.[a-z]+|supabase\.co)\//.test(url)) { this.changed('error'); return false }
    const generation = ++this.generation
    window.dispatchEvent(new CustomEvent('nova:interrupt', { detail: { source: 'original' } })); cancelCoachAudio()
    this.releaseOwnership = acquireNovaAudio('original', () => this.stop())
    const audio = new Audio(url); this.audio = audio; this.end = end
    audio.preload = 'metadata'; audio.playbackRate = Math.max(.5, Math.min(1.5, rate)); audio.preservesPitch = true
    audio.ontimeupdate = () => { if (this.end !== undefined && audio.currentTime >= this.end) this.pause() }
    audio.onended = () => { if (generation === this.generation) { this.changed('idle'); this.release() } }
    audio.onerror = () => { if (generation === this.generation) { this.changed('error'); this.release() } }
    try {
      await new Promise<void>((resolve, reject) => {
        const timeout = window.setTimeout(() => reject(new Error('Source audio timed out')), 15_000)
        const finish = () => { window.clearTimeout(timeout); resolve() }
        this.cancelLoading = finish
        audio.onloadedmetadata = () => { if (generation !== this.generation) { finish(); return }; audio.currentTime = Math.max(0, Math.min(start, Number.isFinite(audio.duration) ? Math.max(0, audio.duration - .05) : start)); finish() }
        audio.addEventListener('error', () => { window.clearTimeout(timeout); reject(new Error('Source audio unavailable')) }, { once: true })
      })
      if (generation !== this.generation) return false
      this.cancelLoading = null
      await audio.play()
      if (generation !== this.generation) { audio.pause(); return false }
      this.changed('playing')
      return true
    } catch { if (generation === this.generation) { this.changed('error'); this.release() }; return false }
  }
  pause() { this.generation++; this.cancelLoading?.(); this.cancelLoading = null; this.audio?.pause(); this.changed('paused'); this.release() }
  async resume() {
    if (!this.audio) return false
    if (!this.audio.paused) return true
    const audio = this.audio, generation = this.generation
    window.dispatchEvent(new CustomEvent('nova:interrupt', { detail: { source: 'original' } })); cancelCoachAudio()
    this.releaseOwnership = acquireNovaAudio('original', () => this.stop())
    try { await audio.play(); if (generation !== this.generation) { audio.pause(); return false }; this.changed('playing'); return true } catch { if (generation === this.generation) { this.changed('error'); this.release() }; return false }
  }
  setRate(rate: number) { if (this.audio) this.audio.playbackRate = Math.max(.5, Math.min(1.5, rate)) }
  private release() { this.releaseOwnership?.(); this.releaseOwnership = null }
  stop() { this.generation++; this.cancelLoading?.(); this.cancelLoading = null; if (this.audio) { this.audio.pause(); this.audio.removeAttribute('src'); this.audio.load(); this.audio = null }; this.release(); this.changed('idle') }
}
