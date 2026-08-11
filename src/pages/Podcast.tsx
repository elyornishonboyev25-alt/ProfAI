import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Atom,
  Bookmark,
  BookmarkPlus,
  BriefcaseBusiness,
  Captions,
  CaptionsOff,
  Check,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  Ear,
  Gauge,
  Headphones,
  Keyboard,
  Languages,
  ListMusic,
  Loader2,
  Maximize,
  Minimize,
  Monitor,
  MoreHorizontal,
  Moon,
  Pause,
  Palette,
  PictureInPicture2,
  Play,
  Plus,
  Repeat,
  Repeat1,
  RotateCcw,
  RotateCw,
  Settings,
  Sparkles,
  ShieldCheck,
  SkipBack,
  SkipForward,
  Timer,
  Trash2,
  Volume1,
  Volume2,
  VolumeX,
  X,
  Youtube,
} from 'lucide-react'
import '@/styles/podcast-library.css'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { loadYouTubeApi, type YTPlayer } from '@/lib/youtube'
import { PODCAST_EPISODES, getPodcastEpisode, type PodcastEpisode } from '@/data/podcasts'
import { ApiError } from '@/lib/apiClient'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { canSubmitCommunityVideo } from '@/utils/videoSubmissionAccess'
import {
  getCommunityPodcast,
  listCommunityPodcasts,
  submitCommunityPodcast,
  type CommunityPodcastDetail,
  type CommunityPodcastSummary,
} from '@/services/podcasts'

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

// These use the same subtitle-checked source as Shadowing Lab. They make a
// submitted clip immediately useful as a listening episode, including a synced
// transcript in the podcast player.
const SUGGESTED_PODCASTS = [
  { label: 'Everyday English', url: 'https://www.youtube.com/watch?v=P26AE7NLx4Q' },
  { label: 'Inspiring 3-min talk', url: 'https://www.youtube.com/watch?v=mgmVOuLgFB0' },
  { label: 'Steve Jobs — Stay Hungry', url: 'https://www.youtube.com/watch?v=UF8uR6Z6KLc' },
]

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

function podcastLevel(level: string): PodcastEpisode['level'] {
  if (level === 'Beginner' || level === 'A2') return 'Beginner'
  if (level === 'Advanced' || level === 'C1' || level === 'C2') return 'Advanced'
  return 'Intermediate'
}

type CefrLevel = 'A2' | 'B1' | 'B2' | 'C1'
type PodcastCategory = 'Daily Life' | 'Science' | 'Business' | 'Culture'

const LEVELS: CefrLevel[] = ['A2', 'B1', 'B2', 'C1']
const CATEGORIES: { label: PodcastCategory; icon: typeof Ear }[] = [
  { label: 'Daily Life', icon: Ear },
  { label: 'Science', icon: Atom },
  { label: 'Business', icon: BriefcaseBusiness },
  { label: 'Culture', icon: Palette },
]

function episodeCefr(item: PodcastEpisode): CefrLevel {
  if (item.level === 'Beginner') return 'A2'
  if (item.level === 'Advanced') return 'C1'
  return item.id === 'ep-001' || item.youtubeId.charCodeAt(0) % 2 === 0 ? 'B2' : 'B1'
}

function episodeCategory(item: PodcastEpisode): PodcastCategory {
  const value = `${item.topic} ${item.title}`.toLowerCase()
  if (/science|technology|health|nature|brain|habit/.test(value)) return 'Science'
  if (/business|career|work|success|startup|money/.test(value)) return 'Business'
  if (/culture|travel|history|art|food/.test(value)) return 'Culture'
  return 'Daily Life'
}

function communityPodcast(video: CommunityPodcastSummary | CommunityPodcastDetail): PodcastEpisode {
  return {
    id: `community-${video.youtubeId}`,
    slug: `community-${video.youtubeId}`,
    title: video.title,
    description: video.topic
      ? `Community-added English listening practice about ${video.topic}. Use captions, speed control and A–B loops to master each part.`
      : 'Community-added English listening practice. Use captions, speed control and A–B loops to master each part.',
    youtubeId: video.youtubeId,
    startSeconds: 0,
    level: podcastLevel(video.level),
    durationLabel: video.durationSec > 0 ? formatTime(video.durationSec) : 'Full episode',
    topic: video.topic || 'English listening',
    source: 'Community · YouTube',
    transcript: 'segments' in video
      ? video.segments.map((segment) => ({ start: segment.startSec, end: segment.endSec, text: segment.text }))
      : undefined,
  }
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
  const user = useAuthStore((state: AuthState) => state.user)
  const canSubmitVideo = canSubmitCommunityVideo(user)
  const prefs0 = useRef<Prefs>(loadPrefs())

  const [communityVideos, setCommunityVideos] = useState<CommunityPodcastSummary[]>([])
  const [selectedEpisode, setSelectedEpisode] = useState<PodcastEpisode | null>(null)
  const [podcastUrl, setPodcastUrl] = useState('')
  const [addingPodcast, setAddingPodcast] = useState(false)
  const [podcastError, setPodcastError] = useState<string | null>(null)
  const [podcastNotice, setPodcastNotice] = useState<string | null>(null)
  const [openingPodcastId, setOpeningPodcastId] = useState<string | null>(null)
  const [activeLevel, setActiveLevel] = useState<CefrLevel>('B2')
  const [activeCategory, setActiveCategory] = useState<PodcastCategory>('Daily Life')
  const [showAddPanel, setShowAddPanel] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const episodes = useMemo(
    () => [...PODCAST_EPISODES, ...communityVideos.map(communityPodcast)],
    [communityVideos],
  )
  const episode = selectedEpisode ?? getPodcastEpisode()

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
    let cancelled = false
    void listCommunityPodcasts()
      .then((videos) => {
        if (!cancelled) setCommunityVideos(videos)
      })
      .catch(() => {
        // The core podcast remains available if the community library is not
        // reachable (for example, while signed out or offline).
      })
    return () => {
      cancelled = true
    }
  }, [])

  const addPodcast = useCallback(
    async (rawUrl?: string) => {
      const target = (rawUrl ?? podcastUrl).trim()
      if (!canSubmitVideo || !target || addingPodcast) return

      setAddingPodcast(true)
      setPodcastError(null)
      setPodcastNotice(null)
      try {
        const { video, created } = await submitCommunityPodcast(target)
        const podcast = communityPodcast(video)
        setCommunityVideos((current) => [
          { ...video },
          ...current.filter((item) => item.youtubeId !== video.youtubeId),
        ])
        setSelectedEpisode(podcast)
        setPodcastUrl('')
        setPodcastNotice(
          created
            ? 'Podcast added to the community library — ready to listen.'
            : 'This podcast is already in the library — opening it now.',
        )
      } catch (error) {
        setPodcastError(
          error instanceof ApiError || error instanceof Error
            ? error.message
            : 'Something went wrong. Try another link.',
        )
      } finally {
        setAddingPodcast(false)
      }
    },
    [addingPodcast, canSubmitVideo, podcastUrl],
  )

  const openEpisode = useCallback(async (item: PodcastEpisode) => {
    if (!item.id.startsWith('community-')) {
      setSelectedEpisode(item)
      return
    }

    const youtubeId = item.youtubeId
    setOpeningPodcastId(youtubeId)
    setPodcastError(null)
    try {
      const video = await getCommunityPodcast(youtubeId)
      setSelectedEpisode(communityPodcast(video))
    } catch (error) {
      setPodcastError(error instanceof Error ? error.message : 'Could not open this podcast.')
    } finally {
      setOpeningPodcastId(null)
    }
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
    setReady(false)
    setStarted(false)
    setEnded(false)
    setPlaying(false)
    setDuration(0)
    setBuffered(0)
    setCurrentTime(episode.startSeconds)
    setBookmarks(saved.bookmarks)
    setLoopA(null)
    setLoopB(null)

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
    // Rebuild when the listener changes episode; the player API has no safe
    // way to swap the caption transcript and source as one atomic update.
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

  const visibleEpisodes = useMemo(
    () => episodes.filter((item) => episodeCefr(item) === activeLevel && episodeCategory(item) === activeCategory),
    [activeCategory, activeLevel, episodes],
  )

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
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-red-600 via-red-500 to-rose-300 shadow-[0_0_12px_rgba(239,68,68,0.85)]"
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
            <span className="hidden items-center gap-1 rounded-lg bg-red-500/25 px-2 py-1 text-[11px] font-bold text-red-100 sm:inline-flex">
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
                        speed === rate ? 'bg-red-500/30 text-white' : 'text-slate-300 hover:bg-white/10'
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
                          loopA !== null ? 'bg-red-500/30 text-red-100' : 'bg-white/10 text-slate-300 hover:bg-white/20'
                        }`}
                      >
                        A {loopA !== null ? formatTime(loopA) : ''}
                      </button>
                      <button
                        type="button"
                        onClick={() => setLoopPoint('b')}
                        className={`rounded-lg px-2 py-1 text-[11px] font-bold transition ${
                          loopB !== null ? 'bg-red-500/30 text-red-100' : 'bg-white/10 text-slate-300 hover:bg-white/20'
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
                    <span className={`h-4 w-7 rounded-full p-0.5 transition ${loopVideo ? 'bg-red-500' : 'bg-slate-600'}`}>
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
                            captionSize === size.value ? 'bg-red-500/30 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'
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
                          sleepUntil === null ? 'bg-red-500/30 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'
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
          : 'relative rounded-[2rem] border border-white/30 shadow-[0_30px_80px_rgba(15,23,42,0.38),0_12px_38px_rgba(220,38,38,0.16)]'
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
              <Loader2 className="h-9 w-9 animate-spin text-red-400" />
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
              className="podcast-cover group absolute inset-0 z-40 flex items-end justify-start overflow-hidden text-left"
              style={{ backgroundImage: "url('/assets/podcast/science-habits-hero.png')" }}
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#06121d]/95 via-[#091725]/55 to-[#2b0711]/25" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10" />
              <div className="relative z-10 flex w-full flex-col items-start gap-3 p-5 pb-16 sm:p-8 sm:pb-20">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white backdrop-blur-xl">
                  <Headphones className="h-3.5 w-3.5 text-red-300" /> {episodeCefr(episode)} · {episodeCategory(episode)}
                </span>
                <h3 className="max-w-[62%] text-2xl font-black leading-tight tracking-[-0.04em] text-white sm:text-4xl">{episode.title}</h3>
                <span className="flex items-center gap-4">
                  <span className="podcast-play-orb flex h-16 w-16 items-center justify-center rounded-full text-white transition duration-300 group-hover:scale-110">
                    <Play className="h-7 w-7 translate-x-0.5 fill-current" />
                  </span>
                  <span className="text-base font-semibold text-white/70">{episode.durationLabel}</span>
                </span>
              </div>
              <span className="absolute bottom-16 right-5 z-10 rounded-xl border border-red-300/50 bg-red-600/80 px-3 py-2 text-sm font-black text-white shadow-[0_0_25px_rgba(239,68,68,0.55)] backdrop-blur-xl sm:bottom-20 sm:right-8">
                {episodeCefr(episode)}
              </span>
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
                className="podcast-play-orb flex h-16 w-16 items-center justify-center rounded-full text-white transition hover:scale-105"
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
              className="podcast-cover group absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-slate-950 px-6 text-center"
              style={{ backgroundImage: "linear-gradient(135deg, rgba(2,6,23,.88), rgba(69,10,10,.55)), url('/assets/podcast/science-habits-hero.png')" }}
              aria-label="Play"
            >
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-red-100 backdrop-blur-xl">
                <Pause className="h-3 w-3" /> Paused
              </span>
              <p className="max-w-xl text-base font-semibold leading-7 text-white sm:text-lg">{episode.title}</p>
              <span className="podcast-play-orb flex h-16 w-16 items-center justify-center rounded-full text-white transition group-hover:scale-105">
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

  return (
    <div className="podcast-library min-h-screen overflow-hidden px-3 pb-12 pt-4 text-slate-900 sm:px-6 lg:px-8">
      <div className="podcast-aurora podcast-aurora-one" />
      <div className="podcast-aurora podcast-aurora-two" />
      <div className="podcast-aurora podcast-aurora-three" />

      <div className={`relative z-10 mx-auto w-full ${theater ? 'max-w-[1680px]' : 'max-w-[1500px]'}`}>
        <motion.header
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: minimalMotion ? 0 : 0.55 }}
          className="podcast-glass relative rounded-[2rem] px-4 pb-14 pt-5 sm:px-7 sm:pb-16"
        >
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={() => navigate('/dashboard')} className="podcast-soft-button group">
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
            <div className="flex items-center gap-3">
              <span className="podcast-logo-orb"><GraduationCap className="h-6 w-6" /></span>
              <span className="text-xl font-black tracking-[-0.04em] text-white sm:text-2xl">Prof<span className="text-red-500">AI</span></span>
            </div>
            <div className="flex items-center gap-2">
              {canSubmitVideo ? (
                <button type="button" onClick={() => setShowAddPanel((value) => !value)} className="podcast-soft-button text-red-700">
                  <Plus className="h-4 w-4" /><span className="hidden sm:inline">Add podcast</span>
                </button>
              ) : null}
              <button type="button" onClick={() => setShowHelp(true)} className="podcast-icon-button" aria-label="Keyboard shortcuts">
                <Keyboard className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="mt-5 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-red-300/90">Listen · Learn · Level up</p>
            <h1 className="mt-2 text-4xl font-black tracking-[-0.055em] text-white sm:text-6xl">English Podcasts</h1>
            <p className="mt-2 text-base font-medium text-white/55 sm:text-xl">Train your ears daily</p>
          </div>
          <div className="podcast-level-dock absolute -bottom-8 left-1/2 flex -translate-x-1/2 gap-2 rounded-[1.75rem] p-2 sm:gap-3">
            {LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setActiveLevel(level)}
                className={`podcast-level-button ${activeLevel === level ? 'is-active' : ''}`}
              >
                {level}
              </button>
            ))}
          </div>
        </motion.header>

        <AnimatePresence>
          {canSubmitVideo && showAddPanel ? (
            <motion.section
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: minimalMotion ? 0 : 0.32 }}
              className="podcast-add-panel mt-12 overflow-hidden rounded-[1.75rem]"
            >
              <div className="p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/70 text-red-600 shadow-sm"><Sparkles className="h-5 w-5" /></span>
                    <div><h2 className="text-lg font-black">Add a podcast to listen</h2><p className="text-xs text-slate-500">Paste any public English YouTube video — AI creates synced subtitles when needed.</p></div>
                  </div>
                  <button type="button" onClick={() => setShowAddPanel(false)} className="podcast-icon-button"><X className="h-4 w-4" /></button>
                </div>
                <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={(event) => { event.preventDefault(); void addPodcast() }}>
                  <div className="relative flex-1">
                    <Youtube className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-red-500" />
                    <input type="text" value={podcastUrl} onChange={(event) => setPodcastUrl(event.target.value)} disabled={addingPodcast} placeholder="Paste a YouTube link — youtube.com/watch?v=… or youtu.be/…" className="podcast-url-input" />
                  </div>
                  <button type="submit" disabled={addingPodcast || !podcastUrl.trim()} className="podcast-add-button">
                    {addingPodcast ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{addingPodcast ? 'Analyzing…' : 'Add & listen'}
                  </button>
                </form>
                {addingPodcast ? <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-red-700"><Loader2 className="h-3.5 w-3.5 animate-spin" />Checking captions and building the transcript…</p> : null}
                {podcastError ? <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50/80 px-3 py-2 text-xs font-semibold text-rose-700">{podcastError}</p> : null}
                {podcastNotice ? <p className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" />{podcastNotice}</p> : null}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Try:</span>
                  {SUGGESTED_PODCASTS.map((suggestion) => <button key={suggestion.url} type="button" disabled={addingPodcast} onClick={() => void addPodcast(suggestion.url)} className="podcast-suggestion"><Sparkles className="h-3 w-3" />{suggestion.label}</button>)}
                </div>
                <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-slate-400"><ShieldCheck className="h-3.5 w-3.5" />Public, embeddable English videos only. Audio is processed securely and is never stored.</p>
              </div>
            </motion.section>
          ) : null}
        </AnimatePresence>

        <div className="mt-14 grid items-start gap-6 xl:grid-cols-[155px_minmax(0,1fr)_280px]">
          <motion.aside initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: minimalMotion ? 0 : 0.15 }} className="podcast-glass podcast-category-rail xl:sticky xl:top-5">
            {CATEGORIES.map(({ label, icon: Icon }) => (
              <button key={label} type="button" onClick={() => setActiveCategory(label)} className={`podcast-category-button ${activeCategory === label ? 'is-active' : ''}`}>
                <Icon className="h-6 w-6" /><span>{label}</span>
              </button>
            ))}
          </motion.aside>

          <main className="min-w-0">
            <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: minimalMotion ? 0 : 0.2, duration: 0.5 }}>
              <div className="mb-4 flex items-end justify-between gap-4 px-1">
                <div><p className="text-[10px] font-black uppercase tracking-[0.24em] text-red-600">Featured episode</p><h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{episode.title}</h2></div>
                <span className="hidden rounded-full border border-white/80 bg-white/55 px-3 py-1 text-xs font-bold text-slate-600 backdrop-blur-xl sm:inline-flex"><Languages className="mr-1.5 h-3.5 w-3.5 text-red-500" />English captions</span>
              </div>
              <div className="relative">
                {mini ? <div className="aspect-video w-full rounded-[2rem] border border-dashed border-slate-300 bg-white/30" /> : null}
                {mini ? <button type="button" onClick={() => setMini(false)} className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm font-bold text-slate-500"><PictureInPicture2 className="h-7 w-7" />Return player here</button> : null}
                {playerShell}
              </div>
            </motion.div>

            <div className="mt-7 flex items-center justify-between gap-3 px-1">
              <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Explore library</p><h2 className="text-xl font-black text-slate-950">{activeCategory} · {activeLevel}</h2></div>
              <span className="rounded-full bg-white/50 px-3 py-1 text-xs font-bold text-slate-500 backdrop-blur">{visibleEpisodes.length} episode{visibleEpisodes.length === 1 ? '' : 's'}</span>
            </div>
            {visibleEpisodes.length > 0 ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visibleEpisodes.map((item, index) => (
                  <motion.button key={item.id} type="button" onClick={() => void openEpisode(item)} disabled={openingPodcastId === item.youtubeId} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: minimalMotion ? 0 : index * 0.06 }} className={`podcast-episode-card group text-left ${item.id === episode.id ? 'is-current' : ''}`}>
                    <span className="relative block aspect-[16/10] overflow-hidden rounded-[1.3rem]">
                      <img src={`https://i.ytimg.com/vi/${item.youtubeId}/hqdefault.jpg`} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                      <span className="absolute inset-0 bg-gradient-to-t from-slate-950/45 to-transparent" />
                      <span className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-white opacity-0 shadow-[0_0_22px_rgba(239,68,68,.65)] transition group-hover:opacity-100"><Play className="h-4 w-4 fill-current" /></span>
                      {item.id === episode.id ? <span className="absolute right-3 top-3 rounded-full bg-emerald-500 p-1.5 text-white shadow-lg"><Check className="h-3.5 w-3.5" /></span> : null}
                    </span>
                    <span className="mt-3 block line-clamp-2 text-base font-black leading-5 text-slate-900">{item.title}</span>
                    <span className="mt-2 flex items-center justify-between text-xs font-medium text-slate-500"><span>{item.durationLabel}</span><span className="h-1.5 w-14 overflow-hidden rounded-full bg-slate-200"><span className="block h-full rounded-full bg-red-500" style={{ width: item.id === episode.id ? `${Math.max(10, progress)}%` : '22%' }} /></span></span>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="podcast-empty mt-4 rounded-[1.5rem] p-7 text-center"><ListMusic className="mx-auto h-7 w-7 text-red-400" /><p className="mt-2 font-black text-slate-800">No {activeLevel} {activeCategory.toLowerCase()} episodes yet</p><p className="mt-1 text-sm text-slate-500">Choose another level or category{canSubmitVideo ? ', or add a podcast.' : '.'}</p></div>
            )}

            <button type="button" onClick={() => setShowDetails((value) => !value)} className="podcast-details-toggle mt-6 w-full">
              <span className="flex items-center gap-2"><Captions className="h-4 w-4 text-red-500" />Transcript, bookmarks &amp; practice tools</span><ChevronRight className={`h-4 w-4 transition ${showDetails ? 'rotate-90' : ''}`} />
            </button>
            <AnimatePresence>
              {showDetails ? (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="mt-4 grid gap-4 lg:grid-cols-3">
                    <article className="podcast-detail-card"><h3><Captions className="h-4 w-4 text-red-500" />Transcript</h3>{transcriptCues.length ? <div className="pod-scroll mt-3 max-h-72 space-y-1 overflow-y-auto">{transcriptCues.map((cue, index) => <button key={`${cue.start}-${index}`} type="button" onClick={() => seekTo(cue.start)} className={`block w-full rounded-xl px-3 py-2 text-left text-xs leading-5 ${index === activeCueIndex ? 'bg-red-50 font-bold text-slate-950' : 'text-slate-600 hover:bg-white/60'}`}><span className="mr-2 font-mono text-red-500">{formatTime(cue.start)}</span>{cue.text}</button>)}</div> : <p className="mt-3 text-xs leading-5 text-slate-500">Captions are available directly on the player. Press <b className="text-red-600">C</b> to toggle them.</p>}</article>
                    <article className="podcast-detail-card"><div className="flex items-center justify-between"><h3><Bookmark className="h-4 w-4 text-amber-500" />Bookmarks</h3><button type="button" onClick={addBookmark} className="podcast-mini-action"><Plus className="h-3 w-3" />Add</button></div>{bookmarks.length ? <div className="mt-3 space-y-2">{bookmarks.map((time) => <div key={time} className="flex items-center gap-2 rounded-xl bg-white/55 p-2"><button type="button" onClick={() => { seekTo(time); playerRef.current?.playVideo() }} className="flex-1 text-left font-mono text-xs font-bold">{formatTime(time)}</button><button type="button" onClick={() => removeBookmark(time)} aria-label="Remove bookmark"><Trash2 className="h-3.5 w-3.5 text-slate-400" /></button></div>)}</div> : <p className="mt-3 text-xs leading-5 text-slate-500">Press <b>N</b> to save the current moment on this device.</p>}</article>
                    <article className="podcast-detail-card"><h3><Sparkles className="h-4 w-4 text-red-500" />Practice flow</h3><div className="mt-3 space-y-2">{LISTEN_STEPS.map((step, index) => { const Icon = step.icon; return <div key={step.title} className="flex items-center gap-2 rounded-xl bg-white/50 p-2"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500 text-white"><Icon className="h-3.5 w-3.5" /></span><p className="text-xs font-bold"><span className="text-red-500">{index + 1}.</span> {step.title}</p></div> })}</div></article>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </main>

          <motion.aside initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: minimalMotion ? 0 : 0.28 }} className="podcast-glass podcast-continue xl:sticky xl:top-5">
            <div className="flex items-center justify-between"><h2 className="text-lg font-black text-slate-950">Continue listening</h2><button type="button" className="text-slate-500" aria-label="More"><MoreHorizontal className="h-5 w-5" /></button></div>
            <div className="mt-5 flex items-center gap-3">
              <img src="/assets/podcast/science-habits-hero.png" alt="" className="h-20 w-20 rounded-2xl object-cover object-right shadow-lg" />
              <div className="min-w-0"><p className="line-clamp-2 font-black leading-5 text-slate-900">{episode.title}</p><p className="mt-1 text-sm font-semibold text-slate-500">{formatTime(duration || currentTime)}</p></div>
            </div>
            <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/65"><div className="h-full rounded-full bg-gradient-to-r from-red-700 to-red-400 transition-all duration-300" style={{ width: `${Math.max(3, progress)}%` }} /></div>
            <div className="mt-6 flex items-center justify-center gap-7">
              <button type="button" onClick={() => skip(-10)} className="podcast-skip-button" aria-label="Back 10 seconds"><SkipBack className="h-5 w-5 fill-current" /></button>
              <button type="button" onClick={togglePlay} className="podcast-play-orb flex h-16 w-16 items-center justify-center rounded-full text-white" aria-label={playing ? 'Pause' : 'Play'}>{playing ? <Pause className="h-6 w-6 fill-current" /> : <Play className="h-6 w-6 translate-x-0.5 fill-current" />}</button>
              <button type="button" onClick={() => skip(10)} className="podcast-skip-button" aria-label="Forward 10 seconds"><SkipForward className="h-5 w-5 fill-current" /></button>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-2 border-t border-white/55 pt-5 text-center">
              <button type="button" onClick={toggleCaptions} className={`podcast-quick-tool ${captionsOn ? 'is-active' : ''}`}><Captions className="h-4 w-4" /><span>CC</span></button>
              <button type="button" onClick={addBookmark} className="podcast-quick-tool"><BookmarkPlus className="h-4 w-4" /><span>Save</span></button>
              <button type="button" onClick={toggleMini} className={`podcast-quick-tool ${mini ? 'is-active' : ''}`}><PictureInPicture2 className="h-4 w-4" /><span>Mini</span></button>
            </div>
          </motion.aside>
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
