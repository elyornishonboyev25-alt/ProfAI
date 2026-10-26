import { useEffect, useRef, useState } from 'react'
import { Coffee, Headphones, Music2, VolumeX } from 'lucide-react'
import { useCopy } from '@/i18n/interface'
import { SAT_SECTION_BREAK_SECONDS } from '@/features/sat/sectionBreak'
import './SATSectionBreak.css'

// Official Soothing Relaxation uploads, embedded directly from YouTube.
const tracks = [
  { id: '77ZozI0rw7w', label: 'Piano & water sounds' },
  { id: 'QQ-WACJqc4Y', label: 'Peaceful piano' },
]

export default function SATSectionBreak({ endsAt, now, onExit }: { endsAt: number; now: number; onExit: () => void }) {
  const { c } = useCopy()
  const [musicEnabled, setMusicEnabled] = useState(false)
  const [trackIndex, setTrackIndex] = useState(0)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const remaining = Math.max(0, Math.ceil((endsAt - now) / 1000))
  const minutes = String(Math.floor(remaining / 60)).padStart(2, '0')
  const seconds = String(remaining % 60).padStart(2, '0')
  const track = tracks[trackIndex]

  useEffect(() => { headingRef.current?.focus() }, [])

  return (
    <main className="sat-section-break">
      <section className="sat-section-break__card" aria-labelledby="sat-break-title">
        <div className="sat-section-break__intro">
          <span className="sat-section-break__icon"><Coffee size={26} aria-hidden="true" /></span>
          <p className="sat-section-break__eyebrow">{c('SAT Exam Mode')}</p>
          <h1 id="sat-break-title" tabIndex={-1} ref={headingRef}>{c('Time for a break')}</h1>
          <p>{c('Reading and Writing is complete. Take 10 minutes to rest before Math.')}</p>
        </div>

        <div className="sat-section-break__body">
          <div className="sat-section-break__rest">
            <div className="sat-section-break__clock" role="timer" aria-label={c('Break time remaining')} aria-live="off">
              <svg viewBox="0 0 200 200" aria-hidden="true">
                <circle cx="100" cy="100" r="90" className="sat-section-break__ring-track" />
                <circle cx="100" cy="100" r="90" className="sat-section-break__ring" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - Math.min(1, remaining / SAT_SECTION_BREAK_SECONDS)} />
              </svg>
              <span>{minutes}:{seconds}</span>
            </div>
            <p className="sat-section-break__next">{c('Up next: Math Module 1')}</p>
            <p>{c('Math starts automatically when the break ends. Your Math time is reserved until then.')}</p>
            <p className="sat-section-break__tip">{c('Look away from the screen, stretch and take a few slow breaths.')}</p>
          </div>

          <div className="sat-section-break__music">
            <Headphones size={24} aria-hidden="true" />
            <h2>{c('Relaxing music')}</h2>
            <p>{c('Enjoy a quiet moment. Music is optional and starts only when you turn it on.')}</p>
            <label htmlFor="sat-break-track">{c('Choose music')}</label>
            <select id="sat-break-track" value={trackIndex} onChange={event => setTrackIndex(Number(event.target.value))}>
              <option value={0}>{c('Piano & water sounds')}</option>
              <option value={1}>{c('Peaceful piano')}</option>
            </select>
            <button type="button" className="sat-section-break__music-toggle" aria-pressed={musicEnabled} onClick={() => setMusicEnabled(enabled => !enabled)}>
              {musicEnabled ? <VolumeX size={18} aria-hidden="true" /> : <Music2 size={18} aria-hidden="true" />}
              {musicEnabled ? c('Turn music off') : c('Play relaxing music')}
            </button>
            {musicEnabled && (
              <div className="sat-section-break__player">
                <iframe
                  key={track.id}
                  title={`${c('Relaxing music')}: ${c(track.label)}`}
                  src={`https://www.youtube-nocookie.com/embed/${track.id}?autoplay=1&playsinline=1&rel=0`}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
                <p>{c('If playback does not start, use the player controls. You can continue your break without music.')}</p>
              </div>
            )}
            <span className="sat-section-break__credit">Peder B. Helland · Soothing Relaxation · YouTube</span>
          </div>
        </div>

        <footer className="sat-section-break__footer">
          <p>{c('The break countdown continues if you reload or leave this page.')}</p>
          <button type="button" onClick={onExit}>{c('Save and exit')}</button>
        </footer>
      </section>
    </main>
  )
}
