import { Star } from 'lucide-react'
import UiText from '@/components/common/UiText'
import { learnerLevel } from '@/utils/learnerLevel'
import './learner-level.css'

export function LevelBadge({ xp }: { xp: number }) {
  const { level } = learnerLevel(xp)
  return <span className={`learner-level-badge${level === 10 ? ' is-max' : ''}`}><Star size={13} fill="currentColor" /><UiText text="Level" /> {level}</span>
}

export default function LearnerLevel({ xp }: { xp: number }) {
  const progress = learnerLevel(xp)
  return <section className="learner-level-panel" aria-label="Learning level">
    <div className="learner-level-heading"><LevelBadge xp={xp} /><span>{Math.max(0, xp).toLocaleString()} XP</span></div>
    <h2><UiText text={progress.level === 10 ? 'You reached the highest level' : 'Every study session moves you forward'} /></h2>
    <div className="learner-level-steps" aria-label={`Level ${progress.level} of 10`}>{Array.from({ length: 10 }, (_, index) => <span key={index} className={index < progress.level ? 'is-earned' : ''} aria-current={index + 1 === progress.level ? 'step' : undefined}>{index + 1}</span>)}</div>
    <div className="learner-level-progress" role="progressbar" aria-label="Progress to next level" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress.progressPercent)}><span style={{ width: `${progress.progressPercent}%` }} /></div>
    <p>{progress.level === 10 ? <UiText text="Level 10 unlocked. Keep building your lifetime XP." /> : <>{progress.remaining.toLocaleString()} XP <UiText text="to the next level" /></>}</p>
    <details><summary><UiText text="How levels work" /></summary><p><UiText text="Earn XP from completed tests, vocabulary practice and active study. Higher levels need more XP. Daily limits and duplicate checks keep progress fair. Your level uses lifetime XP, even when the leaderboard shows a weekly or monthly score." /></p></details>
  </section>
}
