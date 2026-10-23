import type { ReactNode } from 'react'
import SkillBadge from './SkillBadge'
import { TRACK_META, TIER_NAME, formatAchievementScore, type SkillTrackKey } from './badgeMeta'

type AchievementCardProps = {
  track: SkillTrackKey
  band: number
  tier: number
  pinned?: boolean
  compact?: boolean
  children?: ReactNode
}

export default function AchievementCard({ track, band, tier, pinned = false, compact = false, children }: AchievementCardProps) {
  const meta = TRACK_META[track]
  const tierName = TIER_NAME[tier] ?? 'Honor'
  return (
    <article className={`achievement-glass achievement-card ${compact ? 'achievement-card--compact' : ''}`} data-pinned={pinned} data-tier={tier}>
      <p className="achievement-card__eyebrow">{meta.label}</p>
      <div className="achievement-card__stage">
        <SkillBadge track={track} band={band} size={compact ? 128 : 176} showBand />
      </div>
      <h3 className="achievement-card__title">{meta.title}</h3>
      <dl className="achievement-card__stats">
        <div>
          <dt>{meta.group === 'SAT' ? 'Score' : 'Band'}</dt>
          <dd className="achievement-card__score">{formatAchievementScore(track, band)}</dd>
        </div>
        <div>
          <dt>Medal</dt>
          <dd><span className="achievement-card__tier"><i aria-hidden="true" />{tierName}</span><small>Tier {tier}</small></dd>
        </div>
      </dl>
      {children}
    </article>
  )
}
