import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  Captions,
  CaptionsOff,
  Check,
  CheckCircle2,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  Gauge,
  Keyboard,
  Loader2,
  Maximize,
  Minimize,
  Mic,
  Monitor,
  Pause,
  PictureInPicture2,
  Play,
  Repeat,
  RotateCcw,
  Settings,
  SkipBack,
  SkipForward,
  Sparkles,
  Square,
  Volume1,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { loadYouTubeApi, formatClock, type YTPlayer } from '@/lib/youtube'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import type { ShadowingVideoDetail } from '@/services/shadowing'

const SPEEDS = [0.5, 0.75, 1, 1.25] as const
// Repeat target for the active line: how many times it loops before stopping /
// advancing. 0 means loop forever until the user moves on.
const REPEAT_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 1, label: '×1' },
  { value: 2, label: '×2' },
  { value: 3, label: '×3' },
  { value: 0, label: 'Loop' },
]

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

function levelBadge(level: string) {
  if (level === 'Beginner') return 'border-emerald-300/60 bg-emerald-400/15 text-emerald-200'
  if (level === 'Advanced') return 'border-rose-300/60 bg-rose-400/15 text-rose-200'
  return 'border-amber-300/60 bg-amber-400/15 text-amber-200'
}

const SHORTCUTS: { keys: string; action: string }[] = [
  { keys: 'Space / K', action: 'Play / Pause line' },
  { keys: '← / J', action: 'Previous line' },
  { keys: '→ / L', action: 'Next line' },
  { keys: 'R', action: 'Replay this line' },
  { keys: '↑ / ↓', action: 'Volume up / down' },
  { keys: 'M', action: 'Mute / Unmute' },
  { keys: 'B', action: 'Blind mode (hide text)' },
  { keys: 'C', action: 'Captions on / off' },
  { keys: 'F', action: 'Fullscreen' },
  { keys: 'T', action: 'Theater mode' },
  { keys: '1 – 4', action: 'Speed 0.5× – 1.25×' },
  { keys: 'A', action: 'Toggle auto-next' },
  { keys: '?', action: 'Toggle this help' },
]

function resumeKey(youtubeId: string) {
  return `smarttest-shadowing:${youtubeId}`
}

type Props = {
  video: ShadowingVideoDetail
  onBack: () => void
}

export default function ShadowingPlayer({ video, onBack }: Props) {
  const segments = video.segments
  const lastIndex = segments.length - 1
  const { minimalMotion } = useMotionPreferences()

  const playerRef = useRef<YTPlayer | null>(null)
  const shellRef = useRef<HTMLDivElement | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const pollRef = useRef<number | null>(null)
  const hideTimerRef = useRef<number | null>(null)
  const lineRefs = useRef<Array<HTMLButtonElement | null>>([])

  const [ready, setReady] = useState(false)
  const [started, setStarted] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState<number>(0.75)
  const [repeatTarget, setRepeatTarget] = useState<number>(2)
  const [autoAdvance, setAutoAdvance] = useState(true)
  const [blindMode, setBlindMode] = useState(false)
  const [captionsOn, setCaptionsOn] = useState(false)
  const [completed, setCompleted] = useState<Set<number>>(new Set())
  const [currentRepeat, setCurrentRepeat] = useState(0)
  const [lineProgress, setLineProgress] = useState(0)

  const [volume, setVolume] = useState(100)
  const [muted, setMuted] = useState(false)

  // layout / chrome
  const [isFs, setIsFs] = useState(false)
  const [theater, setTheater] = useState(false)
  const [mini, setMini] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(true)
  const [openMenu, setOpenMenu] = useState<null | 'settings' | 'speed'>(null)
  const [showHelp, setShowHelp] = useState(false)
  const [toast, setToast] = useState<{ id: number; msg: string } | null>(null)

  // Voice recording (kept in-memory only, per segment, for instant compare).
  const [recording, setRecording] = useState(false)
  const [recordError, setRecordError] = useState<string | null>(null)
  const [, setRecordingsVersion] = useState(0)
  const recordingsRef = useRef<Map<number, string>>(new Map())
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<BlobPart[]>([])

  // The poll loop reads the latest control values through this ref so it never
  // closes over stale state.
  const ctrl = useRef({ activeIndex: 0, repeatTarget: 2, autoAdvance: true, repeats: 0, segmentActive: false })
  useEffect(() => {
    ctrl.current.activeIndex = activeIndex
    ctrl.current.repeatTarget = repeatTarget
    ctrl.current.autoAdvance = autoAdvance
  }, [activeIndex, repeatTarget, autoAdvance])

  const playingRef = useRef(false)
  const startedRef = useRef(false)
  useEffect(() => {
    playingRef.current = playing
  }, [playing])
  useEffect(() => {
    startedRef.current = started
  }, [started])

  const flash = useCallback((msg: string) => setToast({ id: Date.now(), msg }), [])
  useEffect(() => {
    if (!toast) return
    const handle = window.setTimeout(() => setToast(null), 1500)
    return () => window.clearTimeout(handle)
  }, [toast])

  /* Build the player once. */
  useEffect(() => {
    let cancelled = false
    // Resume the last line shadowed for this clip (saved per device).
    let resumeIndex = 0
    try {
      const raw = window.localStorage.getItem(resumeKey(video.youtubeId))
      if (raw) {
        const parsed = Number(raw)
        if (Number.isFinite(parsed) && parsed > 0 && parsed <= segments.length - 1) resumeIndex = parsed
      }
    } catch {
      /* ignore */
    }

    void loadYouTubeApi().then(() => {
      if (cancelled || !containerRef.current || !window.YT) return
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: video.youtubeId,
        playerVars: {
          start: Math.floor(segments[resumeIndex]?.startSec ?? 0),
          autoplay: 0,
          controls: 0,
          rel: 0,
          fs: 0,
          modestbranding: 1,
          cc_load_policy: 0,
          iv_load_policy: 3,
          playsinline: 1,
          disablekb: 1,
          color: 'white',
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            if (cancelled) return
            event.target.setPlaybackRate(0.75)
            event.target.setVolume(100)
            // Rename the injected iframe so the original YouTube video / channel
            // title never leaks via the DOM or screen readers.
            const iframe = stageRef.current?.querySelector('iframe')
            if (iframe) {
              iframe.setAttribute('title', video.title)
              iframe.setAttribute('aria-label', video.title)
            }
            if (resumeIndex > 0) {
              ctrl.current.activeIndex = resumeIndex
              setActiveIndex(resumeIndex)
              flash(`Resumed at line ${resumeIndex + 1}`)
            }
            setReady(true)
          },
          onStateChange: (event) => {
            const YTState = window.YT?.PlayerState
            if (!YTState) return
            const isPlaying = event.data === YTState.PLAYING
            setPlaying(isPlaying)
            if (isPlaying) setStarted(true)
          },
        },
      })
    })

    return () => {
      cancelled = true
      if (pollRef.current) window.clearInterval(pollRef.current)
      try {
        playerRef.current?.destroy()
      } catch {
        /* already gone */
      }
      playerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video.youtubeId])

  const goToSegment = useCallback(
    (index: number, autoplay = true) => {
      const seg = segments[index]
      if (!seg || !playerRef.current) return
      ctrl.current.activeIndex = index
      ctrl.current.repeats = 0
      ctrl.current.segmentActive = autoplay
      setActiveIndex(index)
      setCurrentRepeat(0)
      playerRef.current.seekTo(seg.startSec, true)
      if (autoplay) playerRef.current.playVideo()
      else playerRef.current.pauseVideo()
    },
    [segments],
  )

  /* Poll playback + enforce per-segment looping / advancing. */
  useEffect(() => {
    if (!ready) return
    if (pollRef.current) window.clearInterval(pollRef.current)
    pollRef.current = window.setInterval(() => {
      const player = playerRef.current
      if (!player) return
      const c = ctrl.current
      const seg = segments[c.activeIndex]
      if (!seg) return
      const time = player.getCurrentTime()
      const span = Math.max(0.001, seg.endSec - seg.startSec)
      setLineProgress(clamp((time - seg.startSec) / span, 0, 1))

      if (!c.segmentActive) return

      // Reached the end of the active line.
      if (time >= seg.endSec - 0.06) {
        const target = c.repeatTarget
        c.repeats += 1
        setCurrentRepeat(c.repeats)

        const shouldRepeat = target === 0 || c.repeats < target
        if (shouldRepeat) {
          player.seekTo(seg.startSec, true)
          return
        }

        // Done repeating this line.
        setCompleted((prev) => {
          const next = new Set(prev)
          next.add(c.activeIndex)
          return next
        })

        if (c.autoAdvance && c.activeIndex < segments.length - 1) {
          const nextIndex = c.activeIndex + 1
          const nextSeg = segments[nextIndex]
          c.activeIndex = nextIndex
          c.repeats = 0
          setActiveIndex(nextIndex)
          setCurrentRepeat(0)
          player.seekTo(nextSeg.startSec, true)
        } else {
          c.segmentActive = false
          player.pauseVideo()
        }
      } else if (time < seg.startSec - 0.4) {
        // Drifted before the line (manual seek) — snap back.
        player.seekTo(seg.startSec, true)
      }
    }, 180)

    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current)
    }
  }, [ready, segments])

  // Keep the active line scrolled into view + persist resume point.
  useEffect(() => {
    lineRefs.current[activeIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    try {
      window.localStorage.setItem(resumeKey(video.youtubeId), String(activeIndex))
    } catch {
      /* ignore */
    }
  }, [activeIndex, video.youtubeId])

  /* Fullscreen tracking */
  useEffect(() => {
    const onChange = () => setIsFs(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  /* ── Transport ─────────────────────────────────────────────────── */
  const togglePlay = useCallback(() => {
    const player = playerRef.current
    if (!player) return
    if (playingRef.current) {
      ctrl.current.segmentActive = false
      player.pauseVideo()
    } else {
      // Resume shadowing the active line from its start.
      goToSegment(ctrl.current.activeIndex, true)
    }
  }, [goToSegment])

  const replaySegment = useCallback(() => {
    goToSegment(ctrl.current.activeIndex, true)
    flash('Replay line')
  }, [goToSegment, flash])

  const prevSegment = useCallback(() => {
    goToSegment(Math.max(0, ctrl.current.activeIndex - 1), true)
  }, [goToSegment])

  const nextSegment = useCallback(() => {
    goToSegment(Math.min(lastIndex, ctrl.current.activeIndex + 1), true)
  }, [goToSegment, lastIndex])

  const changeSpeed = useCallback(
    (rate: number) => {
      playerRef.current?.setPlaybackRate(rate)
      setSpeed(rate)
      flash(`Speed ${rate}×`)
    },
    [flash],
  )

  const seekWithinLine = useCallback(
    (ratio: number) => {
      const player = playerRef.current
      const seg = segments[ctrl.current.activeIndex]
      if (!player || !seg) return
      const span = seg.endSec - seg.startSec
      player.seekTo(seg.startSec + clamp(ratio, 0, 1) * span, true)
    },
    [segments],
  )

  /* ── Volume + captions ─────────────────────────────────────────── */
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
      }
    } catch {
      /* caption module may be unavailable */
    }
    setCaptionsOn((v) => !v)
  }, [captionsOn])

  /* ── Layout toggles ────────────────────────────────────────────── */
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

  const toggleTheater = useCallback(() => setTheater((v) => !v), [])
  const toggleMini = useCallback(() => {
    if (document.fullscreenElement) return
    setMini((v) => !v)
  }, [])

  /* ── Voice recording ─────────────────────────────────────────────── */
  const stopStream = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop())
    mediaStreamRef.current = null
  }, [])

  const startRecording = useCallback(async () => {
    setRecordError(null)
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setRecordError('Recording is not supported in this browser.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream
      chunksRef.current = []
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      const index = ctrl.current.activeIndex
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        const url = URL.createObjectURL(blob)
        const prev = recordingsRef.current.get(index)
        if (prev) URL.revokeObjectURL(prev)
        recordingsRef.current.set(index, url)
        setRecordingsVersion((v) => v + 1)
        stopStream()
      }
      recorder.start()
      setRecording(true)
    } catch {
      setRecordError('Microphone permission was blocked. Allow it to record.')
      stopStream()
    }
  }, [stopStream])

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }, [])

  const downloadRecording = useCallback(() => {
    const url = recordingsRef.current.get(activeIndex)
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = `shadowing-line-${activeIndex + 1}.webm`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }, [activeIndex])

  useEffect(() => {
    return () => {
      // Clean up any object URLs + the mic stream on unmount.
      recordingsRef.current.forEach((url) => URL.revokeObjectURL(url))
      recordingsRef.current.clear()
      try {
        mediaRecorderRef.current?.stop()
      } catch {
        /* ignore */
      }
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  /* ── Controls auto-hide ────────────────────────────────────────── */
  const revealControls = useCallback(() => {
    setControlsVisible(true)
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current)
    if (playingRef.current && startedRef.current && !openMenu && !showHelp) {
      hideTimerRef.current = window.setTimeout(() => setControlsVisible(false), 2600)
    }
  }, [openMenu, showHelp])

  useEffect(() => {
    if (!playing || !started || openMenu || showHelp) {
      setControlsVisible(true)
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current)
    } else {
      revealControls()
    }
  }, [playing, started, openMenu, showHelp, revealControls])

  /* ── Keyboard shortcuts ────────────────────────────────────────── */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return
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
          prevSegment()
          break
        case 'ArrowRight':
        case 'l':
        case 'L':
          nextSegment()
          break
        case 'r':
        case 'R':
          replaySegment()
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
        case 'b':
        case 'B':
          setBlindMode((v) => !v)
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
          setAutoAdvance((v) => !v)
          break
        case '?':
          setShowHelp((v) => !v)
          break
        default:
          if (/^[1-4]$/.test(k)) changeSpeed(SPEEDS[Number(k) - 1])
          else handled = false
      }
      if (handled) event.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [
    togglePlay,
    prevSegment,
    nextSegment,
    replaySegment,
    nudgeVolume,
    toggleMute,
    toggleCaptions,
    toggleFullscreen,
    toggleTheater,
    changeSpeed,
  ])

  /* ── Derived ──────────────────────────────────────────────────── */
  const activeRecording = recordingsRef.current.get(activeIndex) ?? null
  const progressPct = segments.length > 0 ? (completed.size / segments.length) * 100 : 0
  const activeSegment = segments[activeIndex]
  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2
  const immersive = playing && started && !controlsVisible && !openMenu

  const repeatLabel = useMemo(() => {
    if (repeatTarget === 0) return 'Looping'
    return `${currentRepeat}/${repeatTarget}`
  }, [repeatTarget, currentRepeat])

  const controlButton =
    'inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-200 transition hover:bg-white/15 hover:text-white active:scale-95 disabled:opacity-40 disabled:hover:bg-transparent'

  /* ── Stage control overlay (works in fullscreen too) ───────────── */
  const renderControlBar = (
    <div
      className={`pointer-events-none absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-3 pb-2.5 pt-12 transition-opacity duration-300 sm:px-4 ${
        controlsVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Per-line progress */}
      <div
        className="group/track pointer-events-auto relative mb-2 flex h-4 cursor-pointer items-center"
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          seekWithinLine((event.clientX - rect.left) / rect.width)
        }}
      >
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/25">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-red-400 to-rose-400"
            style={{ width: `${lineProgress * 100}%` }}
          />
        </div>
        <div
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 scale-0 rounded-full bg-white shadow transition-transform group-hover/track:scale-100"
          style={{ left: `${lineProgress * 100}%` }}
        />
      </div>

      <div className="pointer-events-auto flex items-center justify-between gap-1 sm:gap-2">
        <div className="flex items-center gap-0.5 sm:gap-1">
          <button type="button" onClick={prevSegment} disabled={activeIndex === 0} className={controlButton} aria-label="Previous line" title="Previous (←)">
            <SkipBack className="h-[18px] w-[18px]" />
          </button>
          <button type="button" onClick={togglePlay} className={controlButton} aria-label={playing ? 'Pause' : 'Play line'}>
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 translate-x-0.5" />}
          </button>
          <button type="button" onClick={replaySegment} className={controlButton} aria-label="Replay line" title="Replay (R)">
            <RotateCcw className="h-[18px] w-[18px]" />
          </button>
          <button type="button" onClick={nextSegment} disabled={activeIndex === lastIndex} className={controlButton} aria-label="Next line" title="Next (→)">
            <SkipForward className="h-[18px] w-[18px]" />
          </button>

          <div className="group/vol flex items-center">
            <button type="button" onClick={toggleMute} className={controlButton} aria-label={muted ? 'Unmute' : 'Mute'}>
              <VolumeIcon className="h-[18px] w-[18px]" />
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={muted ? 0 : volume}
              onChange={(e) => applyVolume(Number(e.target.value))}
              className="podcast-volume h-1 w-0 cursor-pointer opacity-0 transition-all duration-200 group-hover/vol:w-14 group-hover/vol:opacity-100 sm:w-14 sm:opacity-100"
              aria-label="Volume"
            />
          </div>

          <span className="ml-1 select-none text-[11px] font-semibold text-slate-200">
            Line <span className="text-white">{activeIndex + 1}</span>
            <span className="text-slate-400">/{segments.length}</span>
            <span className="ml-1.5 inline-flex items-center gap-0.5 text-rose-300">
              <Repeat className="h-3 w-3" />
              {repeatLabel}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1">
          {/* Speed */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenMenu((m) => (m === 'speed' ? null : 'speed'))}
              className="inline-flex h-9 items-center gap-0.5 rounded-xl px-1.5 text-xs font-bold text-slate-200 transition hover:bg-white/15 hover:text-white sm:px-2"
              aria-label="Playback speed"
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
                  className="absolute bottom-12 right-0 z-50 w-24 overflow-hidden rounded-xl border border-white/10 bg-slate-900/95 p-1 shadow-2xl backdrop-blur"
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
                        speed === rate ? 'bg-rose-500/30 text-white' : 'text-slate-300 hover:bg-white/10'
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
            onClick={() => setBlindMode((v) => !v)}
            className={`${controlButton} ${blindMode ? 'bg-rose-500/25 text-rose-200' : ''}`}
            aria-pressed={blindMode}
            aria-label="Blind mode"
            title="Blind — hide text (B)"
          >
            {blindMode ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
          </button>

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

          {/* Settings */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenMenu((m) => (m === 'settings' ? null : 'settings'))}
              className={`${controlButton} ${openMenu === 'settings' ? 'bg-white/15 text-white' : ''}`}
              aria-label="Settings"
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
                  className="absolute bottom-12 right-0 z-50 w-60 space-y-3 rounded-2xl border border-white/10 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur"
                >
                  <div>
                    <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      <Repeat className="h-3.5 w-3.5" /> Repeat each line
                    </p>
                    <div className="flex gap-1">
                      {REPEAT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setRepeatTarget(opt.value)}
                          className={`flex-1 rounded-lg px-1.5 py-1 text-[11px] font-bold transition ${
                            repeatTarget === opt.value ? 'bg-rose-500/30 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAutoAdvance((v) => !v)}
                    className="flex w-full items-center justify-between rounded-lg bg-white/5 px-2.5 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
                  >
                    <span className="flex items-center gap-1.5">
                      <SkipForward className="h-4 w-4" /> Auto-advance
                    </span>
                    <span className={`h-4 w-7 rounded-full p-0.5 transition ${autoAdvance ? 'bg-rose-500' : 'bg-slate-600'}`}>
                      <span className={`block h-3 w-3 rounded-full bg-white transition ${autoAdvance ? 'translate-x-3' : ''}`} />
                    </span>
                  </button>

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

  /* ── Player shell ──────────────────────────────────────────────── */
  const playerShell = (
    <div
      ref={shellRef}
      className={`shadowing-shell overflow-hidden bg-black ${
        mini
          ? 'fixed bottom-4 right-4 z-[70] w-[22rem] max-w-[90vw] rounded-2xl border border-white/15 shadow-[0_24px_70px_rgba(0,0,0,0.6)]'
          : 'relative rounded-[1.6rem] border border-white/10 shadow-[0_30px_70px_rgba(15,23,42,0.45)]'
      }`}
    >
      <div
        ref={stageRef}
        className={`shadowing-stage relative aspect-video w-full bg-black ${immersive ? 'cursor-none' : 'cursor-default'}`}
        onMouseMove={revealControls}
        onClick={(event) => {
          if (openMenu) {
            setOpenMenu(null)
            return
          }
          if (event.target === event.currentTarget || (event.target as HTMLElement).dataset.hit === 'stage') togglePlay()
        }}
        onDoubleClick={toggleFullscreen}
        onWheel={(event) => {
          event.preventDefault()
          nudgeVolume(event.deltaY < 0 ? 5 : -5)
        }}
      >
        {/* iframe — pointer-events off so YouTube chrome never reacts */}
        <div className="pointer-events-none absolute inset-0">
          <div ref={containerRef} className="h-full w-full" />
        </div>
        <div data-hit="stage" className="absolute inset-0 z-10" />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-16 bg-gradient-to-b from-black/45 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[15] h-10 bg-gradient-to-t from-black/55 to-transparent" />

        {/* Karaoke active-line caption */}
        {ready && started && activeSegment ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-12 z-20 px-5">
            <p className={`text-center text-base font-semibold leading-7 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] sm:text-lg ${blindMode ? 'blur-md' : ''}`}>
              {activeSegment.text}
            </p>
          </div>
        ) : null}

        {/* Mini badge */}
        {mini ? (
          <div className="absolute left-2 top-2 z-40 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400" /> Mini
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
              <Loader2 className="h-9 w-9 animate-spin text-rose-400" />
              <p className="text-sm font-semibold">Loading player…</p>
            </div>
          </div>
        ) : null}

        {/* Poster — hides YouTube's thumbnail / title before first play */}
        <AnimatePresence>
          {ready && !started ? (
            <motion.button
              type="button"
              onClick={togglePlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: minimalMotion ? 0 : 0.25 }}
              className="group absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-slate-950 bg-gradient-to-br from-slate-950 via-rose-950 to-slate-900 text-center"
            >
              <div className="pointer-events-none absolute inset-0 opacity-60">
                <div className="absolute -left-16 top-6 h-56 w-56 rounded-full bg-rose-500/30 blur-3xl" />
                <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-red-500/20 blur-3xl" />
              </div>
              <span className={`relative inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${levelBadge(video.level)}`}>
                <Mic className="h-3.5 w-3.5" /> {video.level} · {segments.length} lines
              </span>
              <h3 className="relative max-w-lg px-6 text-xl font-black text-white sm:text-2xl">{video.title}</h3>
              <span className="relative flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20 backdrop-blur transition group-hover:scale-105">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-rose-500 text-white shadow-[0_12px_30px_rgba(225,29,72,0.55)]">
                  <Play className="h-7 w-7 translate-x-0.5" />
                </span>
              </span>
              <p className="relative text-xs font-medium text-slate-300">Press play to start shadowing</p>
            </motion.button>
          ) : null}
        </AnimatePresence>

        {/* Paused cover — opaque so YouTube's pause chrome (title, channel,
            logo, "More videos") never shows. Doubles as a clean shadowing rest
            screen with the current line. */}
        <AnimatePresence>
          {started && !playing ? (
            <motion.button
              type="button"
              onClick={togglePlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: minimalMotion ? 0 : 0.2 }}
              className="group absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-slate-950 bg-gradient-to-br from-slate-950 via-rose-950 to-slate-900 px-6 text-center"
              aria-label="Play"
            >
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-rose-200">
                <Pause className="h-3 w-3" /> Paused · Line {activeIndex + 1}/{segments.length}
              </span>
              {!blindMode && activeSegment ? (
                <p className="max-w-xl text-base font-semibold leading-7 text-white sm:text-lg">{activeSegment.text}</p>
              ) : null}
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-rose-500 text-white shadow-[0_12px_30px_rgba(225,29,72,0.55)] transition group-hover:scale-105">
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
    <div className="relative mx-auto w-full max-w-6xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button onClick={onBack} className="premium-back-btn-sm">
          <ArrowLeft className="h-3.5 w-3.5" />
          Library
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${levelBadge(video.level).replace('/15', '/10')}`}>
            {video.level}
          </span>
          <button
            type="button"
            onClick={() => setShowHelp(true)}
            className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-white px-3 py-1 text-[11px] font-semibold text-red-700 transition hover:bg-red-50"
          >
            <Keyboard className="h-3.5 w-3.5" />
            Shortcuts
          </button>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600">
            {segments.length} lines
          </span>
        </div>
      </div>

      <div className={`mt-4 ${theater ? 'space-y-6' : 'grid gap-6 lg:grid-cols-[1.6fr_1fr]'}`}>
        {/* Player + record */}
        <div>
          <div className="relative">
            {mini ? <div className="aspect-video w-full rounded-[1.6rem] border border-dashed border-slate-300 bg-white/40" /> : null}
            {mini ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-500">
                <PictureInPicture2 className="h-7 w-7" />
                <p className="text-sm font-semibold">Playing in mini player</p>
                <button
                  type="button"
                  onClick={() => setMini(false)}
                  className="rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                >
                  Return here
                </button>
              </div>
            ) : null}
            {playerShell}
          </div>

          {/* Record + compare */}
          <div className="mt-4 rounded-2xl border border-red-100 bg-white/90 p-4 shadow-[0_14px_30px_rgba(225,29,72,0.08)]">
            <div className="flex flex-wrap items-center gap-2">
              {!recording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100"
                >
                  <Mic className="h-4 w-4" />
                  Record yourself
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="inline-flex items-center gap-2 rounded-xl border border-rose-400 bg-rose-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-rose-600"
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                  Stop · recording…
                </button>
              )}

              {activeRecording ? (
                <>
                  <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5">
                    <Volume2 className="h-3.5 w-3.5 text-slate-500" />
                    <audio src={activeRecording} controls className="h-7 w-44" />
                  </div>
                  <button
                    type="button"
                    onClick={downloadRecording}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                    title="Download your recording"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Save
                  </button>
                </>
              ) : (
                <span className="text-[11px] font-medium text-slate-500">Record this line, then play it back to compare with the original.</span>
              )}
            </div>
            {recordError ? <p className="mt-2 text-[11px] font-semibold text-rose-600">{recordError}</p> : null}
          </div>

          {/* Meta */}
          <div className="mt-4 rounded-2xl border border-red-100 bg-white/90 p-5 shadow-[0_14px_30px_rgba(225,29,72,0.08)]">
            <h2 className="text-lg font-black text-slate-900">{video.title}</h2>
            {video.author ? <p className="mt-0.5 text-xs font-semibold text-slate-500">{video.author}</p> : null}
            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                <span>Lines shadowed</span>
                <span>
                  {completed.size}/{segments.length}
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-red-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-500 to-rose-500 transition-[width] duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Script / segment list */}
        <div className={theater ? 'grid gap-4 lg:grid-cols-2' : 'space-y-4'}>
          <article className="rounded-2xl border border-red-100 bg-white/90 p-5 shadow-[0_14px_30px_rgba(225,29,72,0.08)]">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="inline-flex items-center gap-2 text-base font-black text-slate-900">
                <Captions className="h-4 w-4 text-red-600" />
                Shadowing script
              </h3>
              <span className="text-[11px] font-semibold text-slate-400">Tap a line to jump</span>
            </div>
            <div className="pod-scroll max-h-[30rem] space-y-1.5 overflow-y-auto pr-1">
              {segments.map((seg, index) => {
                const active = index === activeIndex
                const done = completed.has(index)
                return (
                  <button
                    key={seg.id}
                    ref={(el) => {
                      lineRefs.current[index] = el
                    }}
                    type="button"
                    onClick={() => goToSegment(index, true)}
                    className={`flex w-full items-start gap-2.5 rounded-xl border px-3 py-2 text-left text-sm leading-6 transition ${
                      active
                        ? 'border-red-300 bg-red-50 font-semibold text-red-900 shadow-sm'
                        : 'border-transparent text-slate-600 hover:border-red-100 hover:bg-red-50/50'
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                        done ? 'bg-emerald-500 text-white' : active ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}
                    </span>
                    <span className={blindMode && !active ? 'select-none blur-sm' : ''}>{seg.text}</span>
                  </button>
                )
              })}
            </div>
          </article>

          <article className="rounded-2xl border border-red-100 bg-white/90 p-5 shadow-[0_14px_30px_rgba(225,29,72,0.08)]">
            <h3 className="inline-flex items-center gap-2 text-base font-black text-slate-900">
              <Sparkles className="h-4 w-4 text-red-600" />
              How to shadow
            </h3>
            <ol className="mt-3 space-y-2 text-xs leading-5 text-slate-600">
              <li><span className="font-bold text-red-600">1.</span> Listen to the line once at <b>0.75×</b>.</li>
              <li><span className="font-bold text-red-600">2.</span> Repeat out loud <b>together</b> with the audio — copy the rhythm.</li>
              <li><span className="font-bold text-red-600">3.</span> Turn on <b>Blind</b> mode and shadow by ear.</li>
              <li><span className="font-bold text-red-600">4.</span> <b>Record</b> yourself and compare with the original.</li>
            </ol>
          </article>
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
                  <Keyboard className="h-5 w-5 text-rose-300" /> Keyboard shortcuts
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
