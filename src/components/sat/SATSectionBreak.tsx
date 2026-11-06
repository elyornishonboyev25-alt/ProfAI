import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Coffee, LogOut, MoonStar, Pause, Play, SlidersHorizontal, Volume2 } from 'lucide-react'
import { useCopy } from '@/i18n/interface'
import { SAT_SECTION_BREAK_SECONDS } from '@/features/sat/sectionBreak'
import { createSATBreakMusic, type SATBreakMusicPreset } from '@/features/sat/breakMusic'
import './SATSectionBreak.css'

const tracks: { id: SATBreakMusicPreset; label: string }[] = [
  { id: 'ambient', label: 'Soft ambient' },
  { id: 'piano', label: 'Peaceful piano' },
]

export default function SATSectionBreak({ endsAt, now, onExit, onContinue }: { endsAt: number; now: number; onExit: () => void; onContinue: () => void }) {
  const { c } = useCopy()
  const [musicEnabled, setMusicEnabled] = useState(false)
  const [musicPending, setMusicPending] = useState(false)
  const [musicError, setMusicError] = useState(false)
  const [trackIndex, setTrackIndex] = useState(0)
  const [volume, setVolume] = useState(.45)
  const audioRef = useRef<ReturnType<typeof createSATBreakMusic> | null>(null)
  const playRequest = useRef(0)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const settingsRef = useRef<HTMLDetailsElement>(null)
  const remaining = Math.max(0, Math.ceil((endsAt - now) / 1000))
  const minutes = String(Math.floor(remaining / 60)).padStart(2, '0')
  const seconds = String(remaining % 60).padStart(2, '0')

  useEffect(() => {
    headingRef.current?.focus()
    return () => { playRequest.current += 1; audioRef.current?.stop() }
  }, [])

  const stopMusic = () => {
    playRequest.current += 1
    audioRef.current?.stop()
    audioRef.current = null
    setMusicEnabled(false)
    setMusicPending(false)
  }

  const playMusic = async (index = trackIndex) => {
    const request = ++playRequest.current
    audioRef.current?.stop()
    setMusicPending(true)
    setMusicEnabled(false)
    setMusicError(false)
    try {
      const audio = createSATBreakMusic(tracks[index].id, volume)
      audioRef.current = audio
      await audio.play()
      if (playRequest.current === request) setMusicEnabled(true)
    } catch {
      if (playRequest.current === request) {
        audioRef.current?.stop()
        audioRef.current = null
        setMusicError(true)
      }
    } finally {
      if (playRequest.current === request) setMusicPending(false)
    }
  }

  const leaveBreak = (action: () => void) => { stopMusic(); action() }

  return (
    <main className="sat-section-break">
      <header className="sat-section-break__header">
        <span className="sat-section-break__mode"><Coffee size={17} aria-hidden="true" />{c('SAT Exam Mode')}</span>
        <button type="button" className="sat-section-break__exit" onClick={() => leaveBreak(onExit)}>
          <LogOut size={16} aria-hidden="true" />{c('Save and exit')}
        </button>
      </header>

      <section className="sat-section-break__content" aria-labelledby="sat-break-title">
        <MoonStar className="sat-section-break__moon" size={28} strokeWidth={1.35} aria-hidden="true" />
        <h1 id="sat-break-title" tabIndex={-1} ref={headingRef}>{c('Time for a break')}</h1>
        <div className="sat-section-break__clock" role="timer" aria-label={c('Break time remaining')} aria-live="off">
          <span>{minutes}:{seconds}</span>
        </div>
        <div className="sat-section-break__progress" aria-hidden="true">
          <span style={{ width: (Math.min(1, remaining / SAT_SECTION_BREAK_SECONDS) * 100) + '%' }} />
        </div>
        <p className="sat-section-break__next">{c('Up next: Math Module 1')}</p>
        <button type="button" className="sat-section-break__continue" onClick={() => leaveBreak(onContinue)}>
          {c('Start Math now')}<ArrowRight size={17} aria-hidden="true" />
        </button>

        <div className="sat-section-break__music" data-playing={musicEnabled}>
          <button type="button" className="sat-section-break__music-toggle" aria-label={c(musicEnabled ? 'Turn music off' : 'Play relaxing music')}
            aria-pressed={musicEnabled} aria-busy={musicPending} disabled={musicPending}
            onClick={() => musicEnabled ? stopMusic() : void playMusic()}>
            <span className="sat-section-break__play-icon">{musicEnabled ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}</span>
            <span className="sat-section-break__track"><span>{c('Relaxing music')}</span><small>{c(tracks[trackIndex].label)}</small></span>
          </button>
          <details ref={settingsRef} className="sat-section-break__settings" onKeyDown={event => {
            if (event.key === 'Escape' && settingsRef.current?.open) {
              settingsRef.current.open = false
              settingsRef.current.querySelector('summary')?.focus()
              event.stopPropagation()
            }
          }}>
            <summary aria-label={c('Choose music')} title={c('Choose music')}><SlidersHorizontal size={17} aria-hidden="true" /></summary>
            <div className="sat-section-break__settings-panel">
              <label htmlFor="sat-break-track">{c('Choose music')}</label>
              <select id="sat-break-track" value={trackIndex} onChange={event => {
                const index = Number(event.target.value)
                setTrackIndex(index)
                if (musicEnabled || musicPending) void playMusic(index)
              }}>
                {tracks.map((track, index) => <option key={track.id} value={index}>{c(track.label)}</option>)}
              </select>
              <label htmlFor="sat-break-volume" className="sat-section-break__volume-label"><Volume2 size={15} aria-hidden="true" />{c('Volume')}<span>{Math.round(volume * 100)}%</span></label>
              <input id="sat-break-volume" type="range" min="0" max="100" value={Math.round(volume * 100)} onChange={event => {
                const value = Number(event.target.value) / 100
                setVolume(value)
                audioRef.current?.setVolume(value)
              }} />
            </div>
          </details>
        </div>
        {musicError && <p className="sat-section-break__audio-error" role="status">{c('Music could not start. Try again.')}</p>}
        <p className="sat-section-break__rest-note">{c('Look away from the screen, stretch and take a few slow breaths.')}</p>
      </section>

      <footer className="sat-section-break__footer">
        <p>{c('Math starts automatically when the break ends. Your Math time is reserved until then.')}</p>
        <p>{c('The break countdown continues if you reload or leave this page.')}</p>
      </footer>
    </main>
  )
}
