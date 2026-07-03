import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Bookmark,
  BookmarkPlus,
  Captions,
  CaptionsOff,
  Check,
  ChevronRight,
  Ear,
  Gauge,
  Headphones,
  Keyboard,
  Languages,
  ListMusic,
  ListVideo,
  Loader2,
  Maximize,
  Minimize,
  Monitor,
  Moon,
  Pause,
  PictureInPicture2,
  Play,
  Plus,
  Repeat,
  Repeat1,
  RotateCcw,
  RotateCw,
  Settings,
  Sparkles,
  Timer,
  Trash2,
  Volume1,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { loadYouTubeApi, type YTPlayer } from '@/lib/youtube'
import { PODCAST_EPISODES, getPodcastEpisode, type PodcastEpisode } from '@/data/podcasts'

/* ── Helpers ─────────────────────────────────────────────────────── */
function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  const hh = Math.floor(total / 3600)
  const mm = Math.floor((total % 3600) / 60)
  const ss = total % 60
  if (hh > 0) return `${hh}:${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`
  return `${mm}:${ss.toString().padStart(2, '0')}`
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const
const SLEEP_OPTIONS = [5, 10, 15, 30, 45] as const
const CAPTION_SIZES = [
  { label: 'Small', value: -1 },
  { label: 'Normal', value: 0 },
  { label: 'Large', value: 2 },
  { label: 'XL', value: 3 },
] as const

type Prefs = {
  speed: number
  volume: number
  captionsOn: boolean
  captionSize: number
  theater: boolean
}

const PREFS_KEY = 'smarttest-podcast-prefs'

function loadPrefs(): Prefs {
  const fallback: Prefs = { speed: 1, volume: 100, captionsOn: true, captionSize: 0, theater: false }
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(PREFS_KEY)
    if (!raw) return fallback
    return { ...fallback, ...(JSON.parse(raw) as Partial<Prefs>) }
  } catch {
    return fallback
  }
}

function savePrefs(prefs: Prefs) {
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
  } catch {
    /* storage may be unavailable */
  }
}

type Progress = { position: number; bookmarks: number[] }

function progressKey(id: string) {
  return `smarttest-podcast:${id}`
}

function loadProgress(id: string): Progress {
  const fallback: Progress = { position: 0, bookmarks: [] }
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(progressKey(id))
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Partial<Progress>
    return {
      position: typeof parsed.position === 'number' ? parsed.position : 0,
      bookmarks: Array.isArray(parsed.bookmarks) ? parsed.bookmarks.filter((n) => typeof n === 'number') : [],
    }
  } catch {
    return fallback
  }
}

function levelBadge(level: PodcastEpisode['level']) {
  if (level === 'Beginner') return 'border-emerald-300/60 bg-emerald-400/15 text-emerald-200'
  if (level === 'Advanced') return 'border-rose-300/60 bg-rose-400/15 text-rose-200'
  return 'border-amber-300/60 bg-amber-400/15 text-amber-200'
}

const LISTEN_STEPS = [
  { icon: Ear, title: 'Listen once', detail: 'Play through and catch the gist — no captions yet.' },
  { icon: Captions, title: 'Turn on CC', detail: 'Replay with English captions and read along.' },
  { icon: Gauge, title: 'Slow it down', detail: 'Drop to 0.75× on fast or tricky sections.' },
  { icon: Repeat, title: 'Loop & repeat', detail: 'Set an A–B loop and replay until it’s clear.' },
]

const SHORTCUTS: { keys: string; action: string }[] = [
  { keys: 'Space / K', action: 'Play / Pause' },
  { keys: '← / →', action: 'Rewind / Forward 10s' },
  { keys: 'J / L', action: 'Rewind / Forward 10s' },
  { keys: '↑ / ↓', action: 'Volume up / down' },
  { keys: '0 – 9', action: 'Jump to 0% – 90%' },
  { keys: 'M', action: 'Mute / Unmute' },
  { keys: 'C', action: 'Captions on / off' },
  { keys: 'F', action: 'Fullscreen' },
  { keys: 'T', action: 'Theater mode' },
  { keys: 'A / B', action: 'Set loop start / end' },
  { keys: 'X', action: 'Clear loop' },
  { keys: 'N', action: 'Add bookmark' },
  { keys: '< / >', action: 'Speed down / up' },
  { keys: '?', action: 'Toggle this help' },
]

/* ── Component ───────────────────────────────────────────────────── */
export default function Podcast() {
  const navigate = useNavigate()
  const { minimalMotion } = useMotionPreferences()
  const prefs0 = useRef<Prefs>(loadPrefs())

  const episode = getPodcastEpisode()

  const playerRef = useRef<YTPlayer | null>(null)
  const shellRef = useRef<HTMLDivElement | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const trackRef = useRef<HTMLDivElement | null>(null)
  const pollRef = useRef<number | null>(null)
  const hideTimerRef = useRef<number | null>(null)
  const sleepTimerRef = useRef<number | null>(null)
  const saveTickRef = useRef(0)

  /* playback */
  const [ready, setReady] = useState(false)
  const [started, setStarted] = useState(false)
  const [ended, setEnded] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(episode.startSeconds)
  const [buffered, setBuffered] = useState(0)

  /* controls */
  const [speed, setSpeed] = useState<number>(prefs0.current.speed)
  const [volume, setVolume] = useState<number>(prefs0.current.volume)
  const [muted, setMuted] = useState(false)
  const [captionsOn, setCaptionsOn] = useState(prefs0.current.captionsOn)
  const [captionSize, setCaptionSize] = useState<number>(prefs0.current.captionSize)
  const [loopA, setLoopA] = useState<number | null>(null)
  const [loopB, setLoopB] = useState<number | null>(null)
  const [loopVideo, setLoopVideo] = useState(false)
  const [bookmarks, setBookmarks] = useState<number[]>([])
  const [sleepUntil, setSleepUntil] = useState<number | null>(null)

  /* layout / chrome */
  const [isFs, setIsFs] = useState(false)
  const [theater, setTheater] = useState(prefs0.current.theater)
  const [mini, setMini] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(true)
  const [openMenu, setOpenMenu] = useState<null | 'settings' | 'speed' | 'bookmarks' | 'sleep'>(null)
  const [showHelp, setShowHelp] = useState(false)
  const [hover, setHover] = useState<{ x: number; t: number } | null>(null)
  const [toast, setToast] = useState<{ id: number; msg: string } | null>(null)

  /* refs mirroring state for stable callbacks / intervals */
  const loopRef = useRef<{ a: number | null; b: number | null }>({ a: null, b: null })
  const loopVideoRef = useRef(false)
  const playingRef = useRef(false)
  const startedRef = useRef(false)
  const progressRef = useRef<Progress>({ position: 0, bookmarks: [] })

  useEffect(() => {
    loopRef.current = { a: loopA, b: loopB }
  }, [loopA, loopB])
  useEffect(() => {
    loopVideoRef.current = loopVideo
  }, [loopVideo])
  useEffect(() => {
    playingRef.current = playing
  }, [playing])
  useEffect(() => {
    startedRef.current = started
  }, [started])

  const flash = useCallback((msg: string) => {
    setToast({ id: Date.now(), msg })
  }, [])

  useEffect(() => {
    if (!toast) return
    const handle = window.setTimeout(() => setToast(null), 1500)
    return () => window.clearTimeout(handle)
  }, [toast])

  /* persist progress (position + bookmarks) */
  const persistProgress = useCallback(() => {
    try {
      window.localStorage.setItem(progressKey(episode.id), JSON.stringify(progressRef.current))
    } catch {
      /* ignore */
    }
  }, [episode.id])

  useEffect(() => {
    progressRef.current.bookmarks = bookmarks
    persistProgress()
  }, [bookmarks, persistProgress])

  /* persist prefs whenever a sticky pref changes */
  useEffect(() => {
    savePrefs({ speed, volume, captionsOn, captionSize, theater })
  }, [speed, volume, captionsOn, captionSize, theater])

  /* Build the player once the API + container are ready. */
  useEffect(() => {
    let cancelled = false
    const saved = loadProgress(episode.id)
    progressRef.current = saved
    setBookmarks(saved.bookmarks)

    void loadYouTubeApi().then(() => {
      if (cancelled || !containerRef.current || !window.YT) return
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: episode.youtubeId,
        playerVars: {
          start: episode.startSeconds,
          autoplay: 0,
          controls: 0,
          rel: 0,
          fs: 0,
          disablekb: 1,
          modestbranding: 1,
          cc_load_policy: prefs0.current.captionsOn ? 1 : 0,
          cc_lang_pref: 'en',
          iv_load_policy: 3,
          playsinline: 1,
          color: 'white',
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            if (cancelled) return
            const player = event.target
            setReady(true)
            // Rename the injected iframe so the original YouTube video/channel
            // title never leaks via the DOM or screen readers.
            const iframe = stageRef.current?.querySelector('iframe')
            if (iframe) {
              iframe.setAttribute('title', episode.title)
              iframe.setAttribute('aria-label', episode.title)
            }
            const total = player.getDuration()
            setDuration(total)
            player.setPlaybackRate(prefs0.current.speed)
            player.setVolume(prefs0.current.volume)
            // Resume where the listener left off, if it's a meaningful spot.
            const resumeAt = saved.position
            if (resumeAt > episode.startSeconds + 5 && (!total || resumeAt < total - 5)) {
              player.seekTo(resumeAt, true)
              setCurrentTime(resumeAt)
              flash(`Resumed from ${formatTime(resumeAt)}`)
            }
          },
          onStateChange: (event) => {
            const YTState = window.YT?.PlayerState
            if (!YTState) return
            const state = event.data
            if (state === YTState.PLAYING) {
              setPlaying(true)
              setStarted(true)
              setEnded(false)
              if (!duration) setDuration(event.target.getDuration())
            } else if (state === YTState.PAUSED) {
              setPlaying(false)
              persistProgress()
            } else if (state === YTState.ENDED) {
              setPlaying(false)
              if (loopVideoRef.current) {
                event.target.seekTo(episode.startSeconds, true)
                event.target.playVideo()
              } else {
                setEnded(true)
              }
            }
          },
        },
      })
    })

    return () => {
      cancelled = true
      if (pollRef.current) window.clearInterval(pollRef.current)
      persistProgress()
      try {
        playerRef.current?.destroy()
      } catch {
        /* player already gone */
      }
      playerRef.current = null
    }
    // Episode is fixed for this page instance; deps intentionally minimal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episode.youtubeId, episode.startSeconds])

  /* Poll time, buffered, A–B loop + throttled position save. */
  useEffect(() => {
    if (!ready) return
    if (pollRef.current) window.clearInterval(pollRef.current)
    pollRef.current = window.setInterval(() => {
      const player = playerRef.current
      if (!player) return
      const time = player.getCurrentTime()
      setCurrentTime(time)
      progressRef.current.position = time
      try {
        setBuffered(player.getVideoLoadedFraction())
      } catch {
        /* ignore */
      }
      if (!duration) {
        const total = player.getDuration()
        if (total) setDuration(total)
      }
      const { a, b } = loopRef.current
      if (a !== null && b !== null && b > a && time >= b) {
        player.seekTo(a, true)
      }
      saveTickRef.current += 1
      if (saveTickRef.current % 20 === 0) persistProgress() // ~every 5s
    }, 250)

    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current)
    }
  }, [ready, duration, persistProgress])

  /* Fullscreen tracking */
  useEffect(() => {
    const onChange = () => setIsFs(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  /* Sleep timer */
  useEffect(() => {
    if (sleepTimerRef.current) window.clearTimeout(sleepTimerRef.current)
    if (sleepUntil === null) return
    const ms = Math.max(0, sleepUntil - Date.now())
    sleepTimerRef.current = window.setTimeout(() => {
      playerRef.current?.pauseVideo()
      setSleepUntil(null)
      flash('Sleep timer — paused')
    }, ms)
    return () => {
      if (sleepTimerRef.current) window.clearTimeout(sleepTimerRef.current)
    }
  }, [sleepUntil, flash])

  /* ── Actions ───────────────────────────────────────────────────── */
  const togglePlay = useCallback(() => {
    const player = playerRef.current
    if (!player) return
    if (playingRef.current) player.pauseVideo()
    else player.playVideo()
  }, [])

  const seekTo = useCallback((seconds: number) => {
    const player = playerRef.current
    if (!player) return
    const clamped = Math.max(0, seconds)
    player.seekTo(clamped, true)
    setCurrentTime(clamped)
    setEnded(false)
  }, [])

  const skip = useCallback(
    (delta: number) => {
      const player = playerRef.current
      if (!player) return
      seekTo(player.getCurrentTime() + delta)
      flash(delta > 0 ? `+${delta}s` : `${delta}s`)
    },
    [seekTo, flash],
  )

  const changeSpeed = useCallback(
    (rate: number) => {
      playerRef.current?.setPlaybackRate(rate)
      setSpeed(rate)
      flash(`Speed ${rate}×`)
    },
    [flash],
  )

  const stepSpeed = useCallback(
    (dir: 1 | -1) => {
      const idx = SPEEDS.indexOf(speed as (typeof SPEEDS)[number])
      const next = SPEEDS[clamp((idx < 0 ? 2 : idx) + dir, 0, SPEEDS.length - 1)]
      changeSpeed(next)
    },
    [speed, changeSpeed],
  )

  const applyVolume = useCallback((value: number) => {
    const player = playerRef.current
    const next = clamp(Math.round(value), 0, 100)
    setVolume(next)
    if (player) {
      player.setVolume(next)
      if (next === 0) {
        player.mute()
        setMuted(true)
      } else {
        player.unMute()
        setMuted(false)
      }
    }
  }, [])

  const nudgeVolume = useCallback(
    (delta: number) => {
      applyVolume(volume + delta)
      flash(`Volume ${clamp(Math.round(volume + delta), 0, 100)}%`)
    },
    [applyVolume, volume, flash],
  )

  const toggleMute = useCallback(() => {
    const player = playerRef.current
    if (!player) return
    if (muted || volume === 0) {
      player.unMute()
      const restore = volume === 0 ? 60 : volume
      player.setVolume(restore)
      setVolume(restore)
      setMuted(false)
    } else {
      player.mute()
      setMuted(true)
    }
  }, [muted, volume])

  const applyCaptionSize = useCallback((size: number) => {
    setCaptionSize(size)
    try {
      playerRef.current?.setOption('captions', 'fontSize', size)
    } catch {
      /* module may not be ready */
    }
  }, [])

  const toggleCaptions = useCallback(() => {
    const player = playerRef.current
    if (!player) return
    try {
      if (captionsOn) {
        player.unloadModule('captions')
        player.unloadModule('cc')
      } else {
        player.loadModule('captions')
        player.setOption('captions', 'track', { languageCode: 'en' })
        player.setOption('captions', 'fontSize', captionSize)
      }
    } catch {
      /* caption module may be unavailable; state still flips */
    }
    setCaptionsOn((value) => !value)
  }, [captionsOn, captionSize])

  const setLoopPoint = useCallback(
    (point: 'a' | 'b') => {
      const time = Math.floor(currentTime)
      if (point === 'a') {
        setLoopA(time)
        flash(`Loop A · ${formatTime(time)}`)
      } else {
        setLoopB(time)
        flash(`Loop B · ${formatTime(time)}`)
      }
    },
    [currentTime, flash],
  )

  const clearLoop = useCallback(() => {
    setLoopA(null)
    setLoopB(null)
    flash('Loop cleared')
  }, [flash])

  const addBookmark = useCallback(() => {
    const time = Math.floor(currentTime)
    setBookmarks((list) => {
      if (list.some((t) => Math.abs(t - time) < 1)) return list
      return [...list, time].sort((a, b) => a - b)
    })
    flash(`Bookmark · ${formatTime(time)}`)
  }, [currentTime, flash])

  const removeBookmark = useCallback((time: number) => {
    setBookmarks((list) => list.filter((t) => t !== time))
  }, [])

  const toggleFullscreen = useCallback(() => {
    const el = shellRef.current as (HTMLDivElement & { webkitRequestFullscreen?: () => void }) | null
    if (!el) return
    const doc = document as Document & { webkitExitFullscreen?: () => void }
    if (document.fullscreenElement) {
      ;(doc.exitFullscreen || doc.webkitExitFullscreen)?.call(doc)
    } else {
      setMini(false)
      ;(el.requestFullscreen || el.webkitRequestFullscreen)?.call(el)
    }
  }, [])

  const toggleTheater = useCallback(() => setTheater((value) => !value), [])
  const toggleMini = useCallback(() => {
    if (document.fullscreenElement) return
    setMini((value) => !value)
  }, [])

  const setSleep = useCallback(
    (minutes: number | null) => {
      setSleepUntil(minutes === null ? null : Date.now() + minutes * 60_000)
      flash(minutes === null ? 'Sleep timer off' : `Sleep in ${minutes} min`)
      setOpenMenu(null)
    },
    [flash],
  )

  /* ── Controls auto-hide ────────────────────────────────────────── */
  const revealControls = useCallback(() => {
    setControlsVisible(true)
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current)
    if (playingRef.current && startedRef.current && !openMenu && !showHelp) {
      hideTimerRef.current = window.setTimeout(() => setControlsVisible(false), 2600)
    }
  }, [openMenu, showHelp])

  useEffect(() => {
    if (!playing || !started || openMenu || showHelp || ended) {
      setControlsVisible(true)
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current)
    } else {
      revealControls()
    }
  }, [playing, started, openMenu, showHelp, ended, revealControls])

  /* ── Keyboard shortcuts ────────────────────────────────────────── */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return
      }
      const k = event.key
      let handled = true
      switch (k) {
        case ' ':
        case 'k':
        case 'K':
          togglePlay()
          break
        case 'ArrowLeft':
        case 'j':
        case 'J':
          skip(-10)
          break
        case 'ArrowRight':
        case 'l':
        case 'L':
          skip(10)
          break
        case 'ArrowUp':
          nudgeVolume(10)
          break
        case 'ArrowDown':
          nudgeVolume(-10)
          break
        case 'm':
        case 'M':
          toggleMute()
          break
        case 'c':
        case 'C':
          toggleCaptions()
          break
        case 'f':
        case 'F':
          toggleFullscreen()
          break
        case 't':
        case 'T':
          toggleTheater()
          break
        case 'a':
        case 'A':
          setLoopPoint('a')
          break
        case 'b':
        case 'B':
          setLoopPoint('b')
          break
        case 'x':
        case 'X':
          clearLoop()
          break
        case 'n':
        case 'N':
          addBookmark()
          break
        case '<':
          stepSpeed(-1)
          break
        case '>':
          stepSpeed(1)
          break
        case '?':
          setShowHelp((value) => !value)
          break
        default:
          if (/^[0-9]$/.test(k) && duration > 0) {
            seekTo((Number(k) / 10) * duration)
          } else {
            handled = false
          }
      }
      if (handled) event.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [
    togglePlay,
    skip,
    nudgeVolume,
    toggleMute,
    toggleCaptions,
    toggleFullscreen,
    toggleTheater,
    setLoopPoint,
    clearLoop,
    addBookmark,
    stepSpeed,
    seekTo,
    duration,
  ])

  /* ── Derived ──────────────────────────────────────────────────── */
  const progress = duration > 0 ? clamp((currentTime / duration) * 100, 0, 100) : 0
  const bufferedPct = clamp(buffered * 100, 0, 100)
  const loopActive = loopA !== null && loopB !== null && loopB > loopA
  const sleepRemaining = sleepUntil ? Math.max(0, Math.ceil((sleepUntil - Date.now()) / 60_000)) : 0

  const transcriptCues = episode.transcript ?? []
  const activeCueIndex = useMemo(() => {
    if (transcriptCues.length === 0) return -1
    return transcriptCues.findIndex((cue) => currentTime >= cue.start && currentTime < cue.end)
  }, [transcriptCues, currentTime])

  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2

  const onTrackHover = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const el = trackRef.current
      if (!el || !duration) return
      const rect = el.getBoundingClientRect()
      const ratio = clamp((event.clientX - rect.left) / rect.width, 0, 1)
      setHover({ x: ratio * rect.width, t: ratio * duration })
    },
    [duration],
  )

  const immersive = playing && started && !controlsVisible && !openMenu

  /* ── Render: control bar (shared by all modes) ─────────────────── */
  const controlButton =
    'inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-200 transition hover:bg-white/15 hover:text-white active:scale-95'

  const renderControlBar = (
    <div
      className={`pointer-events-none absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-3 pb-2.5 pt-10 transition-opacity duration-300 sm:px-4 ${
        controlsVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Seek track */}
      <div
        ref={trackRef}
        className="group/track pointer-events-auto relative mb-2 flex h-4 cursor-pointer items-center"
        onMouseMove={onTrackHover}
        onMouseLeave={() => setHover(null)}
      >
        <div className="relative h-1.5 w-full overflow-visible rounded-full bg-white/25">
          {/* buffered */}
          <div className="absolute inset-y-0 left-0 rounded-full bg-white/30" style={{ width: `${bufferedPct}%` }} />
          {/* loop region */}
          {loopActive && duration > 0 ? (
            <div
              className="absolute inset-y-0 rounded-full bg-emerald-400/40"
              style={{ left: `${(loopA! / duration) * 100}%`, width: `${((loopB! - loopA!) / duration) * 100}%` }}
            />
          ) : null}
          {/* played */}
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-400 to-sky-400"
            style={{ width: `${progress}%` }}
          />
          {/* bookmark pips */}
          {duration > 0 &&
            bookmarks.map((time) => (
              <span
                key={time}
                className="absolute top-1/2 h-2.5 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-300 shadow"
                style={{ left: `${(time / duration) * 100}%` }}
                title={formatTime(time)}
              />
            ))}
          {/* thumb */}
          <div
            className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 scale-0 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.5)] transition-transform group-hover/track:scale-100"
            style={{ left: `${progress}%` }}
          />
        </div>
        {/* hover tooltip */}
        {hover ? (
          <div
            className="pointer-events-none absolute -top-7 -translate-x-1/2 rounded-md bg-black/85 px-1.5 py-0.5 font-mono text-[11px] text-white"
            style={{ left: `${hover.x}px` }}
          >
            {formatTime(hover.t)}
          </div>
        ) : null}
        {/* native range — handles drag + a11y, sits transparent on top */}
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={Math.min(currentTime, duration || 0)}
          onChange={(event) => seekTo(Number(event.target.value))}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label="Seek"
        />
      </div>

      {/* Buttons */}
      <div className="pointer-events-auto flex items-center justify-between gap-1 sm:gap-2">
        <div className="flex items-center gap-0.5 sm:gap-1">
          <button type="button" onClick={togglePlay} className={controlButton} aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 translate-x-0.5" />}
          </button>
          <button type="button" onClick={() => skip(-10)} className={controlButton} aria-label="Back 10 seconds" title="Back 10s (J)">
            <RotateCcw className="h-[18px] w-[18px]" />
          </button>
          <button type="button" onClick={() => skip(10)} className={controlButton} aria-label="Forward 10 seconds" title="Forward 10s (L)">
            <RotateCw className="h-[18px] w-[18px]" />
          </button>

          {/* Volume cluster */}
          <div className="group/vol flex items-center">
            <button type="button" onClick={toggleMute} className={controlButton} aria-label={muted ? 'Unmute' : 'Mute'}>
              <VolumeIcon className="h-[18px] w-[18px]" />
            </button>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={muted ? 0 : volume}
              onChange={(event) => applyVolume(Number(event.target.value))}
              className="podcast-volume h-1 w-0 cursor-pointer opacity-0 transition-all duration-200 group-hover/vol:w-16 group-hover/vol:opacity-100 sm:w-16 sm:opacity-100"
              aria-label="Volume"
            />
          </div>

          <span className="ml-1 select-none font-mono text-[11px] text-slate-200 sm:text-xs">
            {formatTime(currentTime)}
            <span className="hidden text-slate-400 sm:inline"> / {formatTime(duration)}</span>
          </span>
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1">
          {sleepUntil ? (
            <span className="hidden items-center gap-1 rounded-lg bg-indigo-500/25 px-2 py-1 text-[11px] font-bold text-indigo-100 sm:inline-flex">
              <Moon className="h-3 w-3" />
              {sleepRemaining}m
            </span>
          ) : null}

          {/* Speed */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenMenu((m) => (m === 'speed' ? null : 'speed'))}
              className="inline-flex h-9 items-center gap-0.5 rounded-xl px-1.5 text-xs font-bold text-slate-200 transition hover:bg-white/15 hover:text-white sm:gap-1 sm:px-2"
              aria-label="Playback speed"
              title="Speed"
            >
              <Gauge className="h-4 w-4" />
              {speed}×
            </button>
            <AnimatePresence>
              {openMenu === 'speed' ? (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: minimalMotion ? 0 : 0.16 }}
                  className="absolute bottom-12 right-0 z-50 w-28 overflow-hidden rounded-xl border border-white/10 bg-slate-900/95 p-1 shadow-2xl backdrop-blur"
                >
                  {SPEEDS.map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => {
                        changeSpeed(rate)
                        setOpenMenu(null)
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                        speed === rate ? 'bg-indigo-500/30 text-white' : 'text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {rate}×{speed === rate ? <Check className="h-3.5 w-3.5" /> : null}
                    </button>
                  ))}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={toggleCaptions}
            className={`${controlButton} ${captionsOn ? 'bg-white/15 text-white' : ''}`}
            aria-pressed={captionsOn}
            aria-label="Captions"
            title="Captions (C)"
          >
            {captionsOn ? <Captions className="h-[18px] w-[18px]" /> : <CaptionsOff className="h-[18px] w-[18px]" />}
          </button>

          <button type="button" onClick={addBookmark} className={`${controlButton} hidden sm:inline-flex`} aria-label="Add bookmark" title="Bookmark (N)">
            <BookmarkPlus className="h-[18px] w-[18px]" />
          </button>

          {/* Settings */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenMenu((m) => (m === 'settings' ? null : 'settings'))}
              className={`${controlButton} ${openMenu === 'settings' ? 'bg-white/15 text-white' : ''}`}
              aria-label="Settings"
              title="Settings"
            >
              <Settings className="h-[18px] w-[18px]" />
            </button>
            <AnimatePresence>
              {openMenu === 'settings' ? (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: minimalMotion ? 0 : 0.16 }}
                  className="absolute bottom-12 right-0 z-50 w-64 space-y-3 rounded-2xl border border-white/10 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur"
                >
                  {/* A–B loop */}
                  <div>
                    <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      <Repeat className="h-3.5 w-3.5" /> A–B repeat
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setLoopPoint('a')}
                        className={`rounded-lg px-2 py-1 text-[11px] font-bold transition ${
                          loopA !== null ? 'bg-indigo-500/30 text-indigo-100' : 'bg-white/10 text-slate-300 hover:bg-white/20'
                        }`}
                      >
                        A {loopA !== null ? formatTime(loopA) : ''}
                      </button>
                      <button
                        type="button"
                        onClick={() => setLoopPoint('b')}
                        className={`rounded-lg px-2 py-1 text-[11px] font-bold transition ${
                          loopB !== null ? 'bg-indigo-500/30 text-indigo-100' : 'bg-white/10 text-slate-300 hover:bg-white/20'
                        }`}
                      >
                        B {loopB !== null ? formatTime(loopB) : ''}
                      </button>
                      {loopA !== null || loopB !== null ? (
                        <button
                          type="button"
                          onClick={clearLoop}
                          className="rounded-lg bg-white/10 px-2 py-1 text-[11px] font-bold text-slate-300 transition hover:bg-white/20"
                        >
                          Clear
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {/* Loop video */}
                  <button
                    type="button"
                    onClick={() => setLoopVideo((v) => !v)}
                    className="flex w-full items-center justify-between rounded-lg bg-white/5 px-2.5 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
                  >
                    <span className="flex items-center gap-1.5">
                      <Repeat1 className="h-4 w-4" /> Loop whole video
                    </span>
                    <span className={`h-4 w-7 rounded-full p-0.5 transition ${loopVideo ? 'bg-indigo-500' : 'bg-slate-600'}`}>
                      <span className={`block h-3 w-3 rounded-full bg-white transition ${loopVideo ? 'translate-x-3' : ''}`} />
                    </span>
                  </button>

                  {/* Caption size */}
                  <div>
                    <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">Caption size</p>
                    <div className="flex gap-1">
                      {CAPTION_SIZES.map((size) => (
                        <button
                          key={size.value}
                          type="button"
                          onClick={() => applyCaptionSize(size.value)}
                          className={`flex-1 rounded-lg px-1.5 py-1 text-[11px] font-bold transition ${
                            captionSize === size.value ? 'bg-indigo-500/30 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'
                          }`}
                        >
                          {size.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sleep timer */}
                  <div>
                    <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      <Timer className="h-3.5 w-3.5" /> Sleep timer
                    </p>
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => setSleep(null)}
                        className={`rounded-lg px-2 py-1 text-[11px] font-bold transition ${
                          sleepUntil === null ? 'bg-indigo-500/30 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'
                        }`}
                      >
                        Off
                      </button>
                      {SLEEP_OPTIONS.map((min) => (
                        <button
                          key={min}
                          type="button"
                          onClick={() => setSleep(min)}
                          className="rounded-lg bg-white/10 px-2 py-1 text-[11px] font-bold text-slate-300 transition hover:bg-white/20"
                        >
                          {min}m
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setOpenMenu(null)
                      setShowHelp(true)
                    }}
                    className="flex w-full items-center justify-between rounded-lg bg-white/5 px-2.5 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
                  >
                    <span className="flex items-center gap-1.5">
                      <Keyboard className="h-4 w-4" /> Keyboard shortcuts
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {!isFs ? (
            <button
              type="button"
              onClick={toggleMini}
              className={`${controlButton} hidden sm:inline-flex ${mini ? 'bg-white/15 text-white' : ''}`}
              aria-label="Mini player"
              title="Mini player"
            >
              <PictureInPicture2 className="h-[18px] w-[18px]" />
            </button>
          ) : null}

          {!isFs && !mini ? (
            <button
              type="button"
              onClick={toggleTheater}
              className={`${controlButton} hidden sm:inline-flex ${theater ? 'bg-white/15 text-white' : ''}`}
              aria-label="Theater mode"
              title="Theater (T)"
            >
              <Monitor className="h-[18px] w-[18px]" />
            </button>
          ) : null}

          <button type="button" onClick={toggleFullscreen} className={controlButton} aria-label="Fullscreen" title="Fullscreen (F)">
            {isFs ? <Minimize className="h-[18px] w-[18px]" /> : <Maximize className="h-[18px] w-[18px]" />}
          </button>
        </div>
      </div>
    </div>
  )

  /* ── Player shell (stage + overlays + controls) ────────────────── */
  const playerShell = (
    <div
      ref={shellRef}
      className={`podcast-shell overflow-hidden bg-black ${
        mini
          ? 'fixed bottom-4 right-4 z-[70] w-[22rem] max-w-[90vw] rounded-2xl border border-white/15 shadow-[0_24px_70px_rgba(0,0,0,0.6)]'
          : 'relative rounded-[1.6rem] border border-white/10 shadow-[0_30px_70px_rgba(15,23,42,0.45)]'
      }`}
    >
      <div
        ref={stageRef}
        className={`podcast-stage relative aspect-video w-full bg-black ${immersive ? 'cursor-none' : 'cursor-default'}`}
        onMouseMove={revealControls}
        onClick={(event) => {
          if (openMenu) {
            setOpenMenu(null)
            return
          }
          if (event.target === event.currentTarget || (event.target as HTMLElement).dataset.hit === 'stage') {
            togglePlay()
          }
        }}
        onDoubleClick={toggleFullscreen}
        onWheel={(event) => {
          event.preventDefault()
          nudgeVolume(event.deltaY < 0 ? 5 : -5)
        }}
      >
        {/* The iframe lives here; pointer-events disabled so YouTube chrome never reacts. */}
        <div className="pointer-events-none absolute inset-0">
          <div ref={containerRef} className="h-full w-full" />
        </div>

        {/* Interaction layer — catches play/pause clicks, hides YouTube hover UI. */}
        <div data-hit="stage" className="absolute inset-0 z-10" />

        {/* Top scrim masks any residual title bar. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-16 bg-gradient-to-b from-black/45 to-transparent" />
        {/* Permanent thin bottom scrim — masks YouTube's modest-branding watermark even when controls hide. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[15] h-10 bg-gradient-to-t from-black/55 to-transparent" />

        {/* Mini badge / restore */}
        {mini ? (
          <div className="absolute left-2 top-2 z-40 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400" /> Mini
            </span>
            <button
              type="button"
              onClick={() => setMini(false)}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80"
              aria-label="Close mini player"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}

        {/* Loading */}
        {!ready ? (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950">
            <div className="flex flex-col items-center gap-3 text-slate-300">
              <Loader2 className="h-9 w-9 animate-spin text-indigo-400" />
              <p className="text-sm font-semibold">Loading player…</p>
            </div>
          </div>
        ) : null}

        {/* Poster (before first play) — hides YouTube's own title/thumbnail */}
        <AnimatePresence>
          {ready && !started ? (
            <motion.button
              type="button"
              onClick={togglePlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: minimalMotion ? 0 : 0.25 }}
              className="group absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-slate-950 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-center"
            >
              <div className="pointer-events-none absolute inset-0 opacity-60">
                <div className="absolute -left-16 top-6 h-56 w-56 rounded-full bg-indigo-500/30 blur-3xl" />
                <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-sky-500/20 blur-3xl" />
              </div>
              <span className={`relative inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${levelBadge(episode.level)}`}>
                <Headphones className="h-3.5 w-3.5" /> {episode.level} · {episode.topic}
              </span>
              <h3 className="relative max-w-lg px-6 text-2xl font-black text-white sm:text-3xl">{episode.title}</h3>
              <span className="relative flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20 backdrop-blur transition group-hover:scale-105">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 text-white shadow-[0_12px_30px_rgba(79,70,229,0.55)]">
                  <Play className="h-7 w-7 translate-x-0.5" />
                </span>
              </span>
              <p className="relative text-xs font-medium text-slate-300">Press play to start listening</p>
            </motion.button>
          ) : null}
        </AnimatePresence>

        {/* Replay (ended) */}
        <AnimatePresence>
          {ended ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-slate-950/85 backdrop-blur-sm"
            >
              <button
                type="button"
                onClick={() => {
                  seekTo(episode.startSeconds)
                  playerRef.current?.playVideo()
                }}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 text-white shadow-[0_12px_30px_rgba(79,70,229,0.55)] transition hover:scale-105"
                aria-label="Replay"
              >
                <RotateCcw className="h-7 w-7" />
              </button>
              <p className="text-sm font-bold text-white">Watch again</p>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Paused cover — opaque so YouTube's pause chrome (title, channel,
            logo, "More videos") never shows while paused. */}
        <AnimatePresence>
          {started && !playing && !ended ? (
            <motion.button
              type="button"
              onClick={togglePlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: minimalMotion ? 0 : 0.2 }}
              className="group absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-slate-950 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 px-6 text-center"
              aria-label="Play"
            >
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-indigo-200">
                <Pause className="h-3 w-3" /> Paused
              </span>
              <p className="max-w-xl text-base font-semibold leading-7 text-white sm:text-lg">{episode.title}</p>
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 text-white shadow-[0_12px_30px_rgba(79,70,229,0.55)] transition group-hover:scale-105">
                <Play className="h-7 w-7 translate-x-0.5" />
              </span>
            </motion.button>
          ) : null}
        </AnimatePresence>

        {/* Toast */}
        <AnimatePresence>
          {toast ? (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute left-1/2 top-4 z-40 -translate-x-1/2 rounded-full bg-black/75 px-3.5 py-1.5 text-xs font-bold text-white backdrop-blur"
            >
              {toast.msg}
            </motion.div>
          ) : null}
        </AnimatePresence>

        {renderControlBar}
      </div>
    </div>
  )

  const containerWidth = theater ? 'max-w-[88rem]' : 'max-w-6xl'

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#0b1020] via-[#0c1228] to-[#0a0f22] px-4 py-8 text-slate-100 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-6 h-80 w-80 rounded-full bg-indigo-600/25 blur-3xl" />
        <div className="absolute bottom-[-6rem] right-[-3rem] h-96 w-96 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-violet-600/20 blur-3xl" />
      </div>

      <div className={`relative mx-auto w-full ${containerWidth}`}>
        {/* Hero */}
        <section className="overflow-hidden rounded-[1.9rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_56px_rgba(2,6,23,0.5)] backdrop-blur sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex min-h-[38px] items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-200 transition hover:bg-white/10"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
            <span className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full border border-indigo-400/30 bg-indigo-500/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-indigo-200">
              <Headphones className="h-3.5 w-3.5" />
              English Podcast · Listening
            </span>
            <button
              type="button"
              onClick={() => setShowHelp(true)}
              className="ml-auto inline-flex min-h-[38px] items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-200 transition hover:bg-white/10"
            >
              <Keyboard className="h-3.5 w-3.5" />
              Shortcuts
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                Train your ear with{' '}
                <span className="bg-gradient-to-r from-indigo-400 to-sky-300 bg-clip-text text-transparent">English Podcasts</span>
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                A distraction-free cinema player — captions, adjustable speed, A–B loops, bookmarks and fullscreen. The fastest
                way to level up your IELTS &amp; everyday listening.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`rounded-full border px-3 py-1 text-xs font-bold ${levelBadge(episode.level)}`}>{episode.level}</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                <Languages className="h-3.5 w-3.5" />
                English captions
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
                <ListMusic className="h-3.5 w-3.5" />
                {PODCAST_EPISODES.length} episode{PODCAST_EPISODES.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        </section>

        <div className={`mt-6 ${theater ? 'space-y-6' : 'grid gap-6 lg:grid-cols-[1.6fr_1fr]'}`}>
          {/* Player column */}
          <div>
            <div className="relative">
              {/* keeps layout height while the player floats as a mini window */}
              {mini ? <div className="aspect-video w-full rounded-[1.6rem] border border-dashed border-white/15 bg-white/[0.03]" /> : null}
              {mini ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <PictureInPicture2 className="h-7 w-7" />
                  <p className="text-sm font-semibold">Playing in mini player</p>
                  <button
                    type="button"
                    onClick={() => setMini(false)}
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
                  >
                    Return here
                  </button>
                </div>
              ) : null}
              {playerShell}
            </div>

            {/* Episode meta */}
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${levelBadge(episode.level)}`}>
                  {episode.level}
                </span>
                <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-300">
                  {episode.topic}
                </span>
              </div>
              <h2 className="mt-2.5 text-xl font-black text-white">{episode.title}</h2>
              <p className="mt-1.5 text-sm leading-6 text-slate-300">{episode.description}</p>
            </div>
          </div>

          {/* Side column */}
          <div className={theater ? 'grid gap-6 lg:grid-cols-3' : 'space-y-6'}>
            {/* Transcript */}
            <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
              <h3 className="inline-flex items-center gap-2 text-base font-black text-white">
                <Captions className="h-4 w-4 text-indigo-300" />
                Transcript &amp; subtitles
              </h3>
              {transcriptCues.length > 0 ? (
                <div className="pod-scroll mt-3 max-h-[22rem] space-y-1.5 overflow-y-auto pr-1">
                  {transcriptCues.map((cue, index) => {
                    const active = index === activeCueIndex
                    return (
                      <button
                        key={`${cue.start}-${index}`}
                        type="button"
                        onClick={() => seekTo(cue.start)}
                        className={`block w-full rounded-xl border px-3 py-2 text-left text-sm leading-6 transition ${
                          active
                            ? 'border-indigo-400/50 bg-indigo-500/15 font-semibold text-white shadow-sm'
                            : 'border-transparent text-slate-300 hover:border-white/10 hover:bg-white/5'
                        }`}
                      >
                        <span className="mr-2 font-mono text-[11px] text-indigo-300">{formatTime(cue.start)}</span>
                        {cue.text}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="mt-3 rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-4">
                  <p className="text-sm font-bold text-slate-100">Subtitles are on the player</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    Use the <span className="font-bold text-indigo-300">CC</span> button (or press <kbd className="rounded bg-white/10 px-1">C</kbd>) to
                    show or hide English captions. Adjust caption size in player settings.
                  </p>
                </div>
              )}
            </article>

            {/* Bookmarks */}
            <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
              <div className="flex items-center justify-between">
                <h3 className="inline-flex items-center gap-2 text-base font-black text-white">
                  <Bookmark className="h-4 w-4 text-amber-300" />
                  Bookmarks
                </h3>
                <button
                  type="button"
                  onClick={addBookmark}
                  className="inline-flex items-center gap-1 rounded-lg border border-amber-300/40 bg-amber-400/15 px-2.5 py-1 text-[11px] font-bold text-amber-200 transition hover:bg-amber-400/25"
                >
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              </div>
              {bookmarks.length > 0 ? (
                <div className="mt-3 space-y-1.5">
                  {bookmarks.map((time) => (
                    <div
                      key={time}
                      className="group flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 transition hover:border-amber-300/40"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          seekTo(time)
                          playerRef.current?.playVideo()
                        }}
                        className="flex flex-1 items-center gap-2 text-left"
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400/20 text-amber-200">
                          <Bookmark className="h-3.5 w-3.5" />
                        </span>
                        <span className="font-mono text-sm font-semibold text-slate-100">{formatTime(time)}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeBookmark(time)}
                        className="text-slate-500 opacity-0 transition hover:text-rose-300 group-hover:opacity-100"
                        aria-label="Remove bookmark"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-4 text-xs leading-5 text-slate-400">
                  Press <kbd className="rounded bg-white/10 px-1">N</kbd> or tap <span className="font-bold text-amber-200">Add</span> to save the current
                  moment. Bookmarks appear on the seek bar and are saved on this device.
                </p>
              )}
            </article>

            {/* How to use */}
            <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
              <h3 className="inline-flex items-center gap-2 text-base font-black text-white">
                <Sparkles className="h-4 w-4 text-indigo-300" />
                How to practise listening
              </h3>
              <div className="mt-3 space-y-2.5">
                {LISTEN_STEPS.map((step, index) => {
                  const Icon = step.icon
                  return (
                    <div key={step.title} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-sky-500 text-white">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-white">
                          <span className="mr-1 text-indigo-300">{index + 1}.</span>
                          {step.title}
                        </p>
                        <p className="mt-0.5 text-xs leading-5 text-slate-400">{step.detail}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </article>

            {/* Playlist */}
            <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
              <h3 className="inline-flex items-center gap-2 text-base font-black text-white">
                <ListVideo className="h-4 w-4 text-indigo-300" />
                Episodes
              </h3>
              <div className="mt-3 space-y-2">
                {PODCAST_EPISODES.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-200 ${
                      item.id === episode.id
                        ? 'border-indigo-400/50 bg-indigo-500/15'
                        : 'border-white/10 bg-white/[0.03] hover:-translate-y-0.5 hover:border-indigo-400/30 hover:bg-white/[0.07]'
                    }`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-sky-500 text-white">
                      <Headphones className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">{item.title}</p>
                      <p className="text-[11px] text-slate-400">
                        {item.level} · {item.topic}
                      </p>
                    </div>
                    {item.id === episode.id ? (
                      <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-indigo-500 px-2 py-0.5 text-[10px] font-bold text-white">
                        {playing ? (
                          <span className="flex items-end gap-[2px]">
                            <span className="pod-eq-bar h-2 w-[2px] rounded bg-white" />
                            <span className="pod-eq-bar h-3 w-[2px] rounded bg-white" style={{ animationDelay: '0.15s' }} />
                            <span className="pod-eq-bar h-1.5 w-[2px] rounded bg-white" style={{ animationDelay: '0.3s' }} />
                          </span>
                        ) : null}
                        Now
                      </span>
                    ) : null}
                  </div>
                ))}
                <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.03] px-3 py-3 text-center text-xs font-medium text-slate-500">
                  More episodes coming soon
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>

      {/* Keyboard shortcuts modal */}
      <AnimatePresence>
        {showHelp ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ duration: minimalMotion ? 0 : 0.2 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="inline-flex items-center gap-2 text-lg font-black text-white">
                  <Keyboard className="h-5 w-5 text-indigo-300" /> Keyboard shortcuts
                </h3>
                <button
                  type="button"
                  onClick={() => setShowHelp(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
                {SHORTCUTS.map((row) => (
                  <div key={row.keys + row.action} className="flex items-center justify-between gap-3 py-1">
                    <span className="text-sm text-slate-300">{row.action}</span>
                    <kbd className="shrink-0 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-200">
                      {row.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
