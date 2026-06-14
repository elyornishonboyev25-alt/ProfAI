// Shared helpers for driving an embedded YouTube player with the IFrame API.
// Used by the Shadowing player (and re-usable elsewhere) so segment looping,
// speed and seek behaviour stay consistent.

export type YTPlayer = {
  playVideo: () => void
  pauseVideo: () => void
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  getCurrentTime: () => number
  getDuration: () => number
  getVideoLoadedFraction: () => number
  setPlaybackRate: (rate: number) => void
  getVolume: () => number
  setVolume: (volume: number) => void
  getPlayerState: () => number
  mute: () => void
  unMute: () => void
  loadModule: (module: string) => void
  unloadModule: (module: string) => void
  setOption: (module: string, option: string, value: unknown) => void
  destroy: () => void
}

export type YTNamespace = {
  Player: new (
    el: HTMLElement | string,
    options: {
      videoId: string
      playerVars?: Record<string, unknown>
      events?: {
        onReady?: (event: { target: YTPlayer }) => void
        onStateChange?: (event: { data: number; target: YTPlayer }) => void
      }
    },
  ) => YTPlayer
  PlayerState: { PLAYING: number; PAUSED: number; ENDED: number; BUFFERING: number; CUED: number }
}

declare global {
  interface Window {
    YT?: YTNamespace
    onYouTubeIframeAPIReady?: () => void
  }
}

let ytApiPromise: Promise<void> | null = null

export function loadYouTubeApi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.YT?.Player) return Promise.resolve()
  if (ytApiPromise) return ytApiPromise

  ytApiPromise = new Promise<void>((resolve) => {
    const previous = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previous?.()
      resolve()
    }
    if (!document.getElementById('youtube-iframe-api')) {
      const tag = document.createElement('script')
      tag.id = 'youtube-iframe-api'
      tag.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(tag)
    }
  })
  return ytApiPromise
}

export function formatClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  const mm = Math.floor(total / 60)
  const ss = total % 60
  return `${mm}:${ss.toString().padStart(2, '0')}`
}
