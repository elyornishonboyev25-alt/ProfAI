import { CheckIcon, ClockIcon } from '@heroicons/react/24/outline'
import { useCopy } from '@/i18n/interface'
import { LISTENING_REVIEW_SECONDS } from '@/hooks/useListeningAutoSubmit'
import '@/styles/listening-review-countdown.css'

export default function ListeningReviewCountdown({ secondsRemaining, showTime = true, onToggleTime }: { secondsRemaining: number; showTime?: boolean; onToggleTime?: () => void }) {
  const { c } = useCopy()
  const urgent = secondsRemaining <= 30
  const time = `${String(Math.floor(secondsRemaining / 60)).padStart(2, '0')}:${String(secondsRemaining % 60).padStart(2, '0')}`
  const progress = secondsRemaining / LISTENING_REVIEW_SECONDS

  return (
    <section
      className={`listening-review-countdown${urgent ? ' is-urgent' : ''}`}
      aria-label={c('Listening answer review')}
    >
      <div className="listening-review-countdown__inner">
        <div className="listening-review-countdown__icon" aria-hidden="true">
          <CheckIcon />
        </div>
        <div className="listening-review-countdown__copy">
          <p className="listening-review-countdown__eyebrow">{c('Audio complete')}</p>
          <h2>{c('Check your answers')}</h2>
          <p className="listening-review-countdown__hint">
            {c('Finish writing and review your answers. They will be submitted automatically when time runs out.')}
          </p>
        </div>
        <div className="listening-review-countdown__clock">
          {onToggleTime ? <button type="button" className="ielts-clock-toggle" onClick={onToggleTime} aria-label={showTime ? 'Hide time' : 'Show time'} title={showTime ? 'Hide time' : 'Show time'} aria-pressed={!showTime}><ClockIcon aria-hidden="true" /></button> : <ClockIcon aria-hidden="true" />}
          <div hidden={!showTime}>
            <span className="listening-review-countdown__time" role="timer" aria-live="off" aria-label={c('Time remaining')}>{time}</span>
            <span className="listening-review-countdown__label">{c('Time remaining')}</span>
          </div>
        </div>
      </div>
      <div className="listening-review-countdown__track" aria-hidden="true">
        <div style={{ transform: `scaleX(${progress})` }} />
      </div>
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {urgent ? c('30 seconds or less remaining. Your answers will be submitted automatically.') : c('Audio complete. You have 2 minutes to check your answers.')}
      </p>
    </section>
  )
}
