import { cancelCoachAudio } from './coachAudio'

/** Only source replay owned by Nova. It has no access to runner completion callbacks. */
export class NovaSourceAudio {
  private audio: HTMLAudioElement | null = null
  private generation = 0
  private owned = false
  private end: number | undefined
  constructor(private changed: (state: 'idle' | 'playing' | 'paused' | 'error') => void) {}
  async play(url: string, start: number, end?: number, rate = 1) {
    this.stop()
    if (!url.startsWith('/audio/') && !url.startsWith('/assets/') && !/^https:\/\/(?:[^/]+\.)?(?:ivygoo\.[a-z]+|supabase\.co)\//.test(url)) { this.changed('error'); return }
    const generation = ++this.generation
    window.dispatchEvent(new CustomEvent('nova:interrupt', { detail: { source: 'original' } })); cancelCoachAudio()
    window.dispatchEvent(new CustomEvent('nova:audio-owner', { detail: 'original' }))
    this.owned = true
    const audio = new Audio(url); this.audio = audio; this.end = end
    audio.preload = 'metadata'; audio.playbackRate = Math.max(.5, Math.min(1.5, rate)); audio.preservesPitch = true
    audio.ontimeupdate = () => { if (this.end !== undefined && audio.currentTime >= this.end) this.pause() }
    audio.onended = () => { if (generation === this.generation) { this.changed('idle'); this.release() } }
    audio.onerror = () => { if (generation === this.generation) { this.changed('error'); this.release() } }
    try {
      await new Promise<void>((resolve, reject) => {
        audio.onloadedmetadata = () => { if (generation !== this.generation) { resolve(); return }; audio.currentTime = Math.max(0, Math.min(start, Number.isFinite(audio.duration) ? Math.max(0, audio.duration - .05) : start)); resolve() }
        audio.addEventListener('error', () => reject(new Error('Source audio unavailable')), { once: true })
      })
      if (generation !== this.generation) return
      await audio.play()
      if (generation !== this.generation) { audio.pause(); return }
      this.changed('playing')
    } catch { if (generation === this.generation) { this.changed('error'); this.release() } }
  }
  pause() { this.audio?.pause(); this.changed('paused'); this.release() }
  async resume() {
    if (!this.audio) return
    window.dispatchEvent(new CustomEvent('nova:interrupt', { detail: { source: 'original' } })); cancelCoachAudio(); this.owned = true
    window.dispatchEvent(new CustomEvent('nova:audio-owner', { detail: 'original' }))
    try { await this.audio.play(); this.changed('playing') } catch { this.changed('error'); this.release() }
  }
  setRate(rate: number) { if (this.audio) this.audio.playbackRate = Math.max(.5, Math.min(1.5, rate)) }
  private release() { if (!this.owned) return; this.owned = false; window.dispatchEvent(new CustomEvent('nova:audio-owner', { detail: null })) }
  stop() { this.generation++; if (this.audio) { this.audio.pause(); this.audio.removeAttribute('src'); this.audio.load(); this.audio = null }; this.release(); this.changed('idle') }
}
