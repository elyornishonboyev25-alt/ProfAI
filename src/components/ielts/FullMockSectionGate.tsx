import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Headphones, BookOpen, PenSquare, Mic2, Maximize2, Pause, Play, RotateCcw, SkipForward, Volume2, VolumeX } from 'lucide-react'
import { useFullscreen } from '@/hooks/useFullscreen'
import { useAuthStore } from '@/store/authStore'
import { accountStorageFor } from '@/utils/accountStorage'
import { fullMockLaunchState, getFullMockPendingSection, getFullMockSectionRedirect, type MockSectionKey } from '@/utils/ieltsMockCatalog'
import intros from '@/data/fullMockIntros.json'
import mediaMetadata from '@/data/fullMockIntroMedia.json'
import './full-mock-intro.css'

const keys: MockSectionKey[] = ['listening', 'reading', 'writing', 'speaking']
const icons = { listening: Headphones, reading: BookOpen, writing: PenSquare, speaking: Mic2 }
const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`

/** The runner stays unmounted until the candidate starts: no audio or exam time is consumed. */
export default function FullMockSectionGate({ children }: { children: ReactNode }) {
  const location = useLocation()
  const { id, type } = useParams()
  const owner = useAuthStore(state => state.user?.id ?? 'guest')
  const state = location.state as { mock?: { id: string; section: MockSectionKey }; from?: string; reviewPayload?: unknown } | null
  const section: MockSectionKey | null = location.pathname.startsWith('/ielts/writing/test/') ? 'writing'
    : location.pathname.startsWith('/ielts/speaking/test/') ? 'speaking'
      : type === 'listening' || type === 'reading' ? type : null
  if (!state?.mock?.id || !section || state.reviewPayload) return <>{children}</>
  const redirect = getFullMockSectionRedirect(state.mock.id, section, location.pathname)
  if (redirect) {
    const pending = getFullMockPendingSection(state.mock.id)
    return <Navigate to={redirect} replace state={pending ? fullMockLaunchState(state.mock.id, pending.key, state.from) : { from: state.from }} />
  }
  return <SectionIntro key={`${owner}:${state.mock.id}:${section}`} owner={owner} mockId={state.mock.id} testId={id ?? ''} section={section} from={state.from}>{children}</SectionIntro>
}

function SectionIntro({ owner, mockId, testId, section, from, children }: {
  owner: string; mockId: string; testId: string; section: MockSectionKey; from?: string; children: ReactNode
}) {
  const navigate = useNavigate()
  const fullscreen = useFullscreen()
  const storage = accountStorageFor(owner)
  const readyKey = `profai:full-mock:intro:v1:${mockId}:${section}`
  const [ready, setReady] = useState(() => {
    try {
      if (storage.getItem(readyKey) === 'started') return true
      // Sessions begun before intros were added keep their original exam deadlines.
      if (section === 'listening' || section === 'reading') {
        const session = JSON.parse(storage.getItem(`ielts_test_session_${testId}:mock:${mockId}`) ?? 'null')
        return Boolean(session?.isTestActive)
      }
      if (section === 'writing') return Boolean(storage.getItem(`profai:writing:draft:${owner}:${testId}:mock:${mockId}:session`))
    } catch { /* Storage unavailable: candidate can still start normally. */ }
    return false
  })
  const video = useRef<HTMLVideoElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const [position, setPosition] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [ended, setEnded] = useState(false)
  const [failed, setFailed] = useState(false)
  const [audioBlocked, setAudioBlocked] = useState(false)
  const [soundChecked, setSoundChecked] = useState(false)
  const candidate = useAuthStore(state => state.user?.fullName ?? 'Practice candidate')
  const intro = intros[section]
  const index = keys.indexOf(section)
  const mediaInfo = mediaMetadata[section]
  const [duration, setDuration] = useState(mediaInfo.duration)
  const sceneIndex = Math.max(0, mediaInfo.scenes.reduce((active, item, n) => position >= item.start ? n : active, 0))
  const scene = intro.scenes[sceneIndex]

  useEffect(() => {
    if (ready) return
    heading.current?.focus()
    let cancelled = false
    const media = video.current
    if (media) void media.play().catch(() => {
      if (cancelled) return
      // Browser autoplay policies sometimes require another click for sound.
      setAudioBlocked(true)
      setMuted(true)
      media.muted = true
      void media.play().catch(() => { if (!cancelled) setPlaying(false) })
    })
    return () => { cancelled = true; media?.pause() }
  }, [ready])

  const start = () => {
    video.current?.pause()
    try { storage.setItem(readyKey, 'started') } catch { /* Keep the in-memory gate usable. */ }
    void fullscreen.enter()
    setReady(true)
  }
  const replay = () => {
    const media = video.current
    if (!media) return
    media.currentTime = 0
    setPosition(0)
    setEnded(false)
    void media.play().catch(() => setPlaying(false))
  }
  const toggleAudio = () => {
    const media = video.current
    if (!media) return
    const next = audioBlocked ? false : !muted
    setMuted(next)
    setAudioBlocked(false)
    media.muted = next
    if (media.paused && !ended) void media.play().catch(() => setPlaying(false))
  }

  if (ready) return <>{children}</>
  return (
    <main className="full-mock-intro">
      <header className="full-mock-intro-header">
        <button type="button" onClick={() => navigate(`/mock/ielts/${mockId}`, { state: { from } })}><ArrowLeft size={17} /> Exam overview</button>
        <span>PROFAI <b>IELTS ACADEMIC</b><small>{candidate}</small></span>
        {fullscreen.supported && <button type="button" onClick={() => void fullscreen.enter()} disabled={fullscreen.isFullscreen}><Maximize2 size={17} /> {fullscreen.isFullscreen ? 'Full screen' : 'Enter full screen'}</button>}
      </header>
      <div className="full-mock-intro-content">
        <ol className="full-mock-intro-journey" aria-label="Exam sections">
          {keys.map((key, n) => { const Icon = icons[key]; return <li key={key} className={n === index ? 'is-current' : n < index ? 'is-done' : ''} aria-current={n === index ? 'step' : undefined}><Icon size={17} /><span>{intros[key].title}</span><small>0{n + 1}</small></li> })}
        </ol>
        <div className="full-mock-intro-heading">
          <p>SECTION {index + 1} OF 4 · INSTRUCTIONS TO CANDIDATES</p>
          <h1 ref={heading} tabIndex={-1}>{intro.title} — before you start</h1>
          <span>{intro.meta}</span>
        </div>
        <div className="full-mock-intro-workspace">
        <section aria-label="Video instructions">
        <div className="full-mock-intro-player">
          <video ref={video} src={`/media/ielts-intros/${section}.webm?v=2`} preload="auto" playsInline muted={muted}
            aria-label={`${intro.title} instructions video with English narration`} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
            onTimeUpdate={event => setPosition(event.currentTarget.currentTime)}
            onLoadedMetadata={event => { const value = event.currentTarget.duration; if (Number.isFinite(value) && value > 0) setDuration(value) }}
            onEnded={() => { setEnded(true); setPosition(duration); setPlaying(false) }} onError={() => { setFailed(true); setPlaying(false) }} />
          {failed && <div className="full-mock-intro-fallback"><strong>Video unavailable</strong><p>Read the instructions below, then start when you are ready.</p></div>}
          <div className="full-mock-intro-controls">
            <button type="button" disabled={failed} aria-label={ended ? 'Replay video' : playing ? 'Pause video' : 'Play video'} onClick={() => {
              if (ended) replay()
              else if (playing) video.current?.pause()
              else void video.current?.play().catch(() => setPlaying(false))
            }}>{ended ? <RotateCcw size={18} /> : playing ? <Pause size={18} /> : <Play size={18} />}</button>
            <span>{formatTime(position)} / {formatTime(duration)}</span>
            <progress value={position} max={duration} aria-label="Instruction video progress" />
            <button type="button" disabled={failed} onClick={toggleAudio} aria-label={muted ? 'Enable narration' : 'Mute narration'}>{muted ? <VolumeX size={18} /> : <Volume2 size={18} />}{audioBlocked && <span>Enable sound</span>}</button>
          </div>
        </div>
        <div className="full-mock-intro-caption" aria-label="Video captions"><strong>{scene.title}</strong><p>{scene.text}</p></div>
        </section>
        <aside className="full-mock-intro-guide" aria-label="Before starting your test">
          <h2>Test information</h2>
          <p>{intro.meta}</p>
          <p>Watch the instructions to learn how to use the test screen. You can pause, replay or skip the video.</p>
          {(section === 'listening' || section === 'speaking') && <div className="full-mock-intro-sound-check">
            <h3>{section === 'listening' ? 'Headphone check' : 'Audio check'}</h3>
            <p>Make sure you can hear the narration clearly. Adjust your device volume if needed.</p>
            <button type="button" aria-pressed={soundChecked} onClick={() => { if (muted) toggleAudio(); setSoundChecked(true) }}>{soundChecked ? 'Sound checked' : 'I can hear clearly'}</button>
            {section === 'speaking' && <p>Allow microphone access when the practice begins.</p>}
          </div>}
          <h3>Video chapters</h3>
          <ol className="full-mock-intro-chapters">{intro.scenes.map((item, n) => <li key={item.title}><button type="button" disabled={failed} aria-current={n === sceneIndex ? 'true' : undefined} onClick={() => {
            if (!video.current) return
            video.current.currentTime = mediaInfo.scenes[n].start
            setPosition(mediaInfo.scenes[n].start)
            setEnded(false)
            void video.current.play().catch(() => setPlaying(false))
          }}><span>{formatTime(mediaInfo.scenes[n].start)}</span>{item.title}</button></li>)}</ol>
          <small>Original ProfAI walkthrough · AI-generated English narration</small>
        </aside>
        </div>
        <div className="full-mock-intro-actions">
          <span>Your test has not started. Select Start Test when you are ready.</span>
          <div>{!ended && !failed && <button type="button" className="full-mock-intro-skip" onClick={start}>Skip video & start <SkipForward size={16} /></button>}
          <button type="button" className="full-mock-intro-start" aria-label={`Start ${intro.title}`} onClick={start}>Start Test <ArrowRight size={18} /></button></div>
        </div>
        <details className="full-mock-intro-transcript"><summary>Read all instructions</summary>{intro.scenes.map(item => <p key={item.title}><strong>{item.title}</strong> {item.text}</p>)}</details>
      </div>
    </main>
  )
}
