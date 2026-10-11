import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Headphones, BookOpen, PenSquare, Mic2, Maximize2, Pause, Play, RotateCcw, SkipForward, Volume2, VolumeX } from 'lucide-react'
import { useFullscreen } from '@/hooks/useFullscreen'
import { useAuthStore } from '@/store/authStore'
import { accountStorageFor } from '@/utils/accountStorage'
import { fullMockLaunchState, getFullMockPendingSection, getFullMockSectionRedirect, type MockSectionKey } from '@/utils/ieltsMockCatalog'
import intros from '@/data/fullMockIntros.json'
import './full-mock-intro.css'

const keys: MockSectionKey[] = ['listening', 'reading', 'writing', 'speaking']
const icons = { listening: Headphones, reading: BookOpen, writing: PenSquare, speaking: Mic2 }
const DURATION = 24

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
  const intro = intros[section]
  const index = keys.indexOf(section)
  const scene = intro.scenes[Math.min(3, Math.floor(position / 6))]

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
        <span>PROFAI <b>IELTS ACADEMIC</b></span>
        {fullscreen.supported && <button type="button" onClick={() => void fullscreen.enter()} disabled={fullscreen.isFullscreen}><Maximize2 size={17} /> {fullscreen.isFullscreen ? 'Full screen' : 'Enter full screen'}</button>}
      </header>
      <div className="full-mock-intro-content">
        <ol className="full-mock-intro-journey" aria-label="Exam sections">
          {keys.map((key, n) => { const Icon = icons[key]; return <li key={key} className={n === index ? 'is-current' : n < index ? 'is-done' : ''} aria-current={n === index ? 'step' : undefined}><Icon size={17} /><span>{intros[key].title}</span><small>0{n + 1}</small></li> })}
        </ol>
        <div className="full-mock-intro-heading">
          <p>SECTION 0{index + 1} / 04 · BEFORE YOU BEGIN</p>
          <h1 ref={heading} tabIndex={-1}>Your {intro.title.toLowerCase()} test</h1>
          <span>{intro.meta}</span>
        </div>
        <div className="full-mock-intro-player">
          <video ref={video} src={`/media/ielts-intros/${section}.webm`} preload="auto" playsInline muted={muted}
            aria-label={`${intro.title} instructions video with English narration`} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
            onTimeUpdate={event => setPosition(event.currentTarget.currentTime)}
            onEnded={() => { setEnded(true); setPosition(DURATION); setPlaying(false) }} onError={() => { setFailed(true); setPlaying(false) }} />
          {failed && <div className="full-mock-intro-fallback"><strong>Video unavailable</strong><p>Read the instructions below, then start when you are ready.</p></div>}
          <div className="full-mock-intro-controls">
            <button type="button" disabled={failed} aria-label={ended ? 'Replay video' : playing ? 'Pause video' : 'Play video'} onClick={() => {
              if (ended) replay()
              else if (playing) video.current?.pause()
              else void video.current?.play().catch(() => setPlaying(false))
            }}>{ended ? <RotateCcw size={18} /> : playing ? <Pause size={18} /> : <Play size={18} />}</button>
            <span>{`00:${String(Math.floor(position)).padStart(2, '0')}`} / 00:24</span>
            <progress value={position} max={DURATION} aria-label="Instruction video progress" />
            <button type="button" disabled={failed} onClick={toggleAudio} aria-label={muted ? 'Enable narration' : 'Mute narration'}>{muted ? <VolumeX size={18} /> : <Volume2 size={18} />}{audioBlocked && <span>Enable sound</span>}</button>
          </div>
        </div>
        <div className="full-mock-intro-caption" aria-label="Video captions"><strong>{scene.title}</strong><p>{scene.text}</p></div>
        <div className="full-mock-intro-actions">
          <span>Your test timer starts when you begin the section.</span>
          <button type="button" className="full-mock-intro-start" onClick={start}>{ended || failed ? <>Start {intro.title} <ArrowRight size={18} /></> : <>Skip video & start <SkipForward size={18} /></>}</button>
        </div>
        <details className="full-mock-intro-transcript"><summary>Read all instructions</summary>{intro.scenes.map(item => <p key={item.title}><strong>{item.title}</strong> {item.text}</p>)}</details>
      </div>
    </main>
  )
}
