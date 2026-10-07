import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Check, Headphones, Loader2, Mic, Pause, Play, RotateCcw, Share2, Square } from 'lucide-react'
import { formatClock, loadYouTubeApi, type YTPlayer } from '@/lib/youtube'
import { shareShadowingRecording, type ShadowingVideoDetail } from '@/services/shadowing'
import { prepareShadowingLesson } from '../../../backend/src/services/shadowingLesson'
import { useCopy } from '@/i18n/interface'
import VideoPlaybackError from '@/components/learning/VideoPlaybackError'

type Props = { video: ShadowingVideoDetail; onBack: () => void }
type Playback = { kind: 'video' | 'audio'; index: number; pendingSeek: boolean; playing: boolean }

export default function ShadowingPlayer({ video, onBack }: Props) {
  const { c } = useCopy()
  const lesson = useMemo(() => prepareShadowingLesson(video.captions ?? video.segments, video.durationSec), [video])
  const mainHost = useRef<HTMLDivElement>(null)
  const audioHost = useRef<HTMLDivElement>(null)
  const sectionHosts = useRef<Array<HTMLDivElement | null>>([])
  const sectionsPanel = useRef<HTMLElement>(null)
  const [sectionVideoBox, setSectionVideoBox] = useState({ top: 0, left: 0, width: 0, height: 0 })
  const main = useRef<YTPlayer | null>(null)
  const audio = useRef<YTPlayer | null>(null)
  const seekRequestedAt = useRef(0)
  const playback = useRef<Playback>({ kind: 'video', index: 0, pendingSeek: false, playing: false })
  const [ready, setReady] = useState({ video: false, audio: false })
  const [errors, setErrors] = useState({ video: false, audio: false })
  const [playing, setPlaying] = useState(false)
  const [activeAudio, setActiveAudio] = useState<number | null>(null)
  const [position, setPosition] = useState(0)
  const [audioPosition, setAudioPosition] = useState(0)
  const [completed, setCompleted] = useState<Set<number>>(new Set())
  const [practice, setPractice] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [retry, setRetry] = useState(0)
  const [recording, setRecording] = useState(false)
  const [requestingMicrophone, setRequestingMicrophone] = useState(false)
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null)
  const [controlsVisible, setControlsVisible] = useState(true)
  const hideControlsTimer = useRef<number | null>(null)
  const recordTimer = useRef<number | null>(null)
  const recorded = useRef<{ blob: Blob; durationSec: number; key: string } | null>(null)
  const [sharing, setSharing] = useState(false)
  const [shareLink, setShareLink] = useState('')
  const [shareStatus, setShareStatus] = useState('')
  const [recordError, setRecordError] = useState('')
  const recordPlayback = useRef<HTMLAudioElement>(null)
  const recorder = useRef<MediaRecorder | null>(null)
  const stream = useRef<MediaStream | null>(null)
  const mounted = useRef(true)
  const recordingBusy = useRef(false)
  const objectUrl = useRef<string | null>(null)
  const duration = Math.min(120, lesson.durationSec || video.durationSec)

  // Position the persistent player over the selected card's video slot.
  // Moving an iframe between parents reloads it in Safari, so keep it mounted.
  useLayoutEffect(() => {
    const panel = sectionsPanel.current
    const target = activeAudio === null ? null : sectionHosts.current[activeAudio]
    if (!panel || !target) return
    const measure = () => {
      const origin = panel.getBoundingClientRect()
      const box = target.getBoundingClientRect()
      setSectionVideoBox({ top: box.top - origin.top, left: box.left - origin.left, width: box.width, height: box.height })
    }
    measure()
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    observer?.observe(panel)
    observer?.observe(target)
    window.addEventListener('resize', measure)
    return () => { observer?.disconnect(); window.removeEventListener('resize', measure) }
  }, [activeAudio])

  useEffect(() => {
    let cancelled = false
    setReady({ video: false, audio: false })
    setErrors({ video: false, audio: false })
    const timers: number[] = []
    const nodes: HTMLElement[] = []
    void loadYouTubeApi().then(() => {
      if (cancelled || !window.YT) return
      for (const kind of ['video', 'audio'] as const) {
        const host = kind === 'video' ? mainHost.current : audioHost.current
        if (!host) continue
        const target = document.createElement('div')
        host.appendChild(target)
        nodes.push(target)
        const timer = window.setTimeout(() => { if (!cancelled) setErrors(prev => ({ ...prev, [kind]: true })) }, 15000)
        timers.push(timer)
        const player = new window.YT.Player(target, {
          videoId: video.youtubeId,
          playerVars: { controls: 0, autoplay: 0, end: kind === 'video' ? Math.ceil(Math.min(120, video.durationSec)) : undefined, rel: 0, fs: 0, playsinline: 1, disablekb: 1, cc_load_policy: 1, origin: window.location.origin },
          events: {
            onReady: ({ target: loaded }) => {
              if (cancelled) return
              window.clearTimeout(timer)
              loaded.setPlaybackRate(1)
              host.querySelector('iframe')?.setAttribute('title', kind === 'video' ? video.title : c('Audio sections'))
              setErrors(prev => ({ ...prev, [kind]: false }))
              setReady(prev => ({ ...prev, [kind]: true }))
            },
            onError: () => {
              if (cancelled) return
              window.clearTimeout(timer)
              setErrors(prev => ({ ...prev, [kind]: true }))
              if (playback.current.kind === kind) { playback.current.playing = false; setPlaying(false) }
            },
            onStateChange: ({ data }) => {
              if (cancelled || playback.current.kind !== kind) return
              playback.current.playing = data === window.YT?.PlayerState.PLAYING
              setPlaying(playback.current.playing)
              if (data === window.YT?.PlayerState.ENDED && kind === 'video' && recorder.current?.state === 'recording') recorder.current.stop()
              if (data === window.YT?.PlayerState.ENDED && kind === 'audio') {
                setCompleted(prev => new Set(prev).add(playback.current.index))
              }
            },
          },
        })
        if (kind === 'video') main.current = player
        else audio.current = player
      }
    }).catch(() => { if (!cancelled) setErrors({ video: true, audio: true }) })
    return () => {
      cancelled = true
      timers.forEach(window.clearTimeout)
      main.current?.destroy()
      audio.current?.destroy()
      main.current = null
      audio.current = null
      nodes.forEach(node => node.remove())
      mainHost.current?.replaceChildren()
      audioHost.current?.replaceChildren()
    }
  }, [video.youtubeId, retry])

  useEffect(() => {
    const poll = window.setInterval(() => {
      const state = playback.current
      const player = state.kind === 'video' ? main.current : audio.current
      if (!player || !ready[state.kind] || errors[state.kind]) return
      const time = player.getCurrentTime()
      if (state.kind === 'video') setPosition(Math.min(duration, time))
      else setAudioPosition(time)
      if (!state.playing) return
      const segment = lesson.segments[state.index]
      const end = state.kind === 'video' ? duration : segment?.endSec
      // Wait for the seek to land. The previous section's position can persist
      // during YouTube buffering, which used to end the new section immediately.
      if (state.pendingSeek) {
        const start = state.kind === 'audio' ? segment?.startSec ?? 0 : 0
        if ((time < start - 0.25 || time > start + 1.5) && Date.now() - seekRequestedAt.current < 2000) return
        state.pendingSeek = false
      }
      if (end !== undefined && time >= end) {
        state.playing = false
        player.pauseVideo()
        setPlaying(false)
        if (state.kind === 'audio') setCompleted(prev => new Set(prev).add(state.index))
        else if (recorder.current?.state === 'recording') recorder.current.stop()
      }
    }, 80)
    return () => window.clearInterval(poll)
  }, [lesson, duration, ready, errors])

  useEffect(() => {
    if (hideControlsTimer.current !== null) window.clearTimeout(hideControlsTimer.current)
    setControlsVisible(true)
    if (playing && activeAudio === null) hideControlsTimer.current = window.setTimeout(() => setControlsVisible(false), 1500)
    return () => { if (hideControlsTimer.current !== null) window.clearTimeout(hideControlsTimer.current) }
  }, [playing, activeAudio])

  function revealControls() {
    if (hideControlsTimer.current !== null) window.clearTimeout(hideControlsTimer.current)
    setControlsVisible(true)
    if (playing && activeAudio === null) hideControlsTimer.current = window.setTimeout(() => setControlsVisible(false), 1500)
  }

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      if (recordTimer.current !== null) window.clearTimeout(recordTimer.current)
      if (recorder.current?.state === 'recording') recorder.current.stop()
      stream.current?.getTracks().forEach(track => track.stop())
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current)
    }
  }, [])

  function toggleVideo() {
    if (!ready.video || errors.video) return
    const state = playback.current
    recordPlayback.current?.pause()
    if (state.kind === 'video' && state.playing) {
      state.playing = false
      if (ready.video) main.current?.pauseVideo()
      setPlaying(false)
      return
    }
    if (ready.audio) audio.current?.pauseVideo()
    setActiveAudio(null)
    playback.current = { kind: 'video', index: 0, pendingSeek: false, playing: false }
    if ((main.current?.getCurrentTime() ?? 0) >= duration - 0.1) main.current?.seekTo(0, true)
    main.current?.playVideo()
  }

  function playSection(index: number) {
    if (!ready.audio || errors.audio || recording || requestingMicrophone) return
    const state = playback.current
    recordPlayback.current?.pause()
    if (activeAudio === index && state.kind === 'audio' && state.playing) {
      state.playing = false
      if (ready.audio) audio.current?.pauseVideo()
      setPlaying(false)
      return
    }
    if (ready.video) main.current?.pauseVideo()
    setPractice(false)
    setActiveAudio(index)
    const section = lesson.segments[index]
    seekRequestedAt.current = Date.now()
    playback.current = { kind: 'audio', index, pendingSeek: true, playing: false }
    setAudioPosition(section.startSec)
    audio.current?.seekTo(section.startSec, true)
    audio.current?.playVideo()
  }

  function startPractice() {
    recordPlayback.current?.pause()
    if (ready.audio) audio.current?.pauseVideo()
    if (ready.video) main.current?.pauseVideo()
    seekRequestedAt.current = Date.now()
    playback.current = { kind: 'video', index: 0, pendingSeek: true, playing: false }
    setActiveAudio(null)
    setPosition(0)
    setPractice(true)
    main.current?.seekTo(0, true)
    main.current?.playVideo()
  }

  async function record() {
    if (recordingBusy.current) return
    recordingBusy.current = true
    recordPlayback.current?.pause()
    setRequestingMicrophone(true)
    setRecordError('')
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') throw new Error('unsupported')
      const input = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (!mounted.current) { input.getTracks().forEach(track => track.stop()); return }
      stream.current = input
      const chunks: BlobPart[] = []
      const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus'].find(type => MediaRecorder.isTypeSupported(type))
      const instance = new MediaRecorder(input, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: 64000 })
      const recordingStart = Date.now()
      recorder.current = instance
      instance.ondataavailable = event => { if (event.data.size) chunks.push(event.data) }
      instance.onstop = () => {
        input.getTracks().forEach(track => track.stop())
        if (recordTimer.current !== null) window.clearTimeout(recordTimer.current)
        recordingBusy.current = false
        if (!mounted.current) return
        if (objectUrl.current) URL.revokeObjectURL(objectUrl.current)
        const blob = new Blob(chunks, { type: instance.mimeType || chunks.find(chunk => chunk instanceof Blob)?.type || 'audio/webm' })
        recorded.current = { blob, durationSec: Math.max(0.1, Math.min(120, (Date.now() - recordingStart) / 1000)), key: crypto.randomUUID() }
        setShareLink('')
        setShareStatus('')
        objectUrl.current = URL.createObjectURL(blob)
        setRecordingUrl(objectUrl.current)
        setRecording(false)
      }
      instance.start()
      recordTimer.current = window.setTimeout(() => { if (instance.state === 'recording') instance.stop() }, 120000)
      setRecording(true)
    } catch {
      recordingBusy.current = false
      stream.current?.getTracks().forEach(track => track.stop())
      setRecordError(c('Microphone unavailable. Allow microphone access and try again.'))
    } finally {
      if (mounted.current) setRequestingMicrophone(false)
    }
  }

  async function shareRecording() {
    if (!recorded.current || sharing || recording) return
    setSharing(true)
    setShareStatus('')
    let url = shareLink
    try {
      if (!url) {
        const saved = recorded.current
        const result = await shareShadowingRecording(saved.blob, video.youtubeId, saved.durationSec, saved.key)
        if (!mounted.current) return
        url = new URL(result.path, window.location.origin).href
        setShareLink(url)
      }
      if (navigator.share) {
        try { await navigator.share({ title: video.title, text: c('My shadowing practice on ProfAI'), url }); return }
        catch (error) { if (error instanceof DOMException && error.name === 'AbortError') return }
      }
      try { await navigator.clipboard.writeText(url); setShareStatus(c('Link copied')) }
      catch { setShareStatus(c('Copy this link to share your recording.')) }
    } catch { if (mounted.current) setShareStatus(c('Could not share the recording. Please try again.')) }
    finally { if (mounted.current) setSharing(false) }
  }

  const caption = lesson.captions.find(cue => position >= cue.startSec && position < cue.endSec)
  const mainPlaying = playing && playback.current.kind === 'video'
  return <div className="mx-auto max-w-6xl space-y-5">
    <button type="button" onClick={onBack} className="premium-back-btn-sm"><ArrowLeft size={16} />{c('Library')}</button>
    <header><h1 className="text-2xl font-bold text-slate-900">{video.title}</h1><p className="mt-2 text-sm text-slate-600">{c('Watch the video, prepare with audio sections, then practise the whole lesson.')} · {formatClock(duration)}</p></header>
    <div className="grid items-start gap-5 lg:grid-cols-[1.5fr_1fr]">
      <section className="space-y-4">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="relative aspect-video bg-black" data-testid="shadowing-stage" onPointerMove={revealControls} onPointerLeave={() => { if (mainPlaying) setControlsVisible(false) }} onClick={() => { if (mainPlaying && controlsVisible) setControlsVisible(false); else revealControls() }}>
            <div ref={mainHost} className="pointer-events-none absolute inset-0 [&_iframe]:h-full [&_iframe]:w-full" />
            <div className="absolute inset-0" aria-hidden="true" />
            {errors.video ? <VideoPlaybackError youtubeId={video.youtubeId} /> : !ready.video ? <div className="absolute inset-0 flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div> : <button type="button" onClick={event => { event.stopPropagation(); toggleVideo() }} onFocus={revealControls} data-controls-visible={controlsVisible || !mainPlaying} aria-label={c(mainPlaying ? 'Pause video' : 'Play video')} className={`transition-opacity duration-200 ${controlsVisible || !mainPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'} absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white ring-2 ring-white/80 hover:bg-black/80 focus-visible:outline focus-visible:outline-4 focus-visible:outline-red-400`}>{mainPlaying ? <Pause size={24} /> : <Play size={24} />}</button>}
          </div>
          <div className="space-y-3 p-4">
            <div className="flex items-center justify-between gap-3 text-sm"><span className="font-semibold">{c(practice ? 'Full video practice' : 'Full video')} · {formatClock(position)} / {formatClock(duration)}</span><label className="flex items-center gap-2">{c('Speed')}<select aria-label={c('Playback speed')} value={speed} disabled={!ready.video || errors.video} onChange={event => { const value = Number(event.target.value); setSpeed(value); main.current?.setPlaybackRate(value); if (ready.audio) audio.current?.setPlaybackRate(value) }} className="rounded-lg border border-slate-200 p-1">{[0.75, 1, 1.25].map(value => <option key={value} value={value}>{value}x</option>)}</select></label></div>
            <input type="range" aria-label={c('Video position')} min={0} max={duration} step={0.1} value={position} disabled={!ready.video || errors.video} onChange={event => { const time = Number(event.target.value); main.current?.seekTo(time, true); setPosition(time) }} className="w-full accent-red-500" />
            <p className="min-h-12 text-center text-sm leading-6 text-slate-800" aria-live="off">{caption?.text ?? c('English captions appear in the video when available.')}</p>
          </div>
        </div>
        {(errors.video || errors.audio) && <button type="button" onClick={() => { playback.current.playing = false; setPlaying(false); setSpeed(1); setRetry(value => value + 1) }} className="learning-secondary"><RotateCcw size={16} />{c('Retry player')}</button>}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold">{c('Ready for the whole video?')}</h2><p className="mt-2 text-sm text-slate-600">{c('Practise the audio sections at your own pace. Start the final practice when you feel ready.')}</p>
          <button type="button" disabled={!ready.video || errors.video || recording || requestingMicrophone} onClick={startPractice} className="learning-primary mt-4 disabled:opacity-50"><Play size={17} />{c('I am ready — start practice')}</button>
          {practice && <div className="mt-4 space-y-3"><button type="button" disabled={sharing || requestingMicrophone} onClick={() => recording ? recorder.current?.stop() : void record()} className="learning-secondary">{requestingMicrophone ? <Loader2 size={16} className="animate-spin" /> : recording ? <Square size={16} /> : <Mic size={16} />}{c(requestingMicrophone ? 'Opening microphone…' : recording ? 'Stop recording' : 'Record yourself')}</button>{recordingUrl && <><audio ref={recordPlayback} controls src={recordingUrl} className="w-full" onPlay={() => { if (ready.video) main.current?.pauseVideo(); if (ready.audio) audio.current?.pauseVideo() }} /><button type="button" disabled={sharing || recording || requestingMicrophone} onClick={() => void shareRecording()} className="learning-secondary disabled:opacity-50">{sharing ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}{c(sharing ? 'Creating share link…' : 'Share recording')}</button><p className="text-xs text-slate-500">{c('Anyone with this link can listen.')}</p>{shareLink && <label className="block text-xs font-semibold text-slate-600">{c('Share link')}<input readOnly value={shareLink} onFocus={event => event.target.select()} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>}{shareStatus && <p role="status" className="text-sm text-slate-600">{shareStatus}</p>}</>}{recordError && <p role="alert" className="text-sm text-red-600">{recordError}</p>}</div>}
        </div>
      </section>
      <section ref={sectionsPanel} className="relative rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 font-bold"><Headphones size={19} />{c('Video sections')}</h2><span className="text-xs text-slate-500">{completed.size}/{lesson.segments.length}</span></div>
        <p className="mb-4 mt-2 text-sm text-slate-600">{c('Each section plays once. Replay whenever you need.')}</p>
        <div ref={audioHost} data-testid="shadowing-section-video" data-section-index={activeAudio} style={activeAudio === null ? undefined : sectionVideoBox} className={`pointer-events-none overflow-hidden rounded-lg bg-black [&_iframe]:h-full [&_iframe]:w-full ${activeAudio === null ? 'sr-only' : 'absolute z-10'}`} />
        {errors.audio && <p role="alert" className="mb-3 text-sm text-red-600">{c('Audio playback could not load. Retry the player.')}</p>}
        {!lesson.segments.length && <p role="status" className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">{c('Audio sections need timed English captions. Retry captions if they are unavailable; the video preview still works.')}</p>}
        {lesson.segments.some(section => section.endSec - section.startSec < 12) && <p className="mb-3 text-xs text-slate-500">{c('The final section may be shorter to keep the speech intact.')}</p>}
        <div className="space-y-3">{lesson.segments.map((section, index) => {
          const selected = activeAudio === index
          const audioPlaying = selected && playing && playback.current.kind === 'audio'
          const progress = selected ? Math.max(0, Math.min(1, (audioPosition - section.startSec) / (section.endSec - section.startSec))) : 0
          return <article data-testid="shadowing-section" key={`${section.startSec}:${section.endSec}`} className={`rounded-xl border p-3 ${selected ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}>
            <div ref={node => { sectionHosts.current[index] = node }} className="relative mb-3 aspect-video overflow-hidden rounded-lg bg-black">
              <img src={video.thumbnailUrl || `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`} alt="" className="h-full w-full object-cover" />
              <button type="button" aria-label={`${c('Play video')} ${index + 1}`} disabled={!ready.audio || errors.audio || recording || requestingMicrophone} onClick={() => playSection(index)} className="absolute inset-0 z-20 flex items-center justify-center text-white disabled:opacity-40">
                <span className={`rounded-full bg-black/60 p-3 ${audioPlaying ? 'opacity-0 hover:opacity-100 focus-visible:opacity-100' : ''}`}>{audioPlaying ? <Pause size={24} /> : <Play size={24} />}</span>
              </button>
            </div>
            <div className="mb-2 flex items-center gap-3"><button type="button" disabled={!ready.audio || errors.audio || recording || requestingMicrophone} onClick={() => playSection(index)} aria-label={`${c(audioPlaying ? 'Pause audio' : 'Play audio')} ${index + 1}`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-600 text-white disabled:opacity-40">{audioPlaying ? <Pause size={17} /> : <Play size={17} />}</button><span className="text-xs font-semibold text-slate-600">{index + 1} · {formatClock(section.startSec)} – {formatClock(section.endSec)} · {Math.round(section.endSec - section.startSec)} {c('seconds')}</span>{completed.has(index) && <Check size={17} className="ml-auto text-emerald-600" aria-label={c('Completed')} />}</div>
            <p className="text-sm leading-6 text-slate-800">{section.text}</p>
            {section.textTimingEstimated && <p className="mt-2 text-xs text-slate-500">{c('Subtitle timing is approximate for this section.')}</p>}
            {selected && <div role="progressbar" aria-label={c('Audio progress')} aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100} className="mt-3 h-1 overflow-hidden rounded bg-red-100"><div className="h-full bg-red-500" style={{ width: `${progress * 100}%` }} /></div>}
          </article>
        })}</div>
      </section>
    </div>
  </div>
}
