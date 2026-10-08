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
  return (
    <article className={`achievement-glass achievement-card ${compact ? 'achievement-card--compact' : ''}`} data-pinned={pinned}>
      <p className="achievement-card__eyebrow">{meta.group} Honors</p>
      <SkillBadge track={track} band={band} size={compact ? 132 : 190} showBand />
      <h3 className="achievement-card__title">{meta.title}</h3>
      <p className="achievement-card__rank">{TIER_NAME[tier] ?? 'Honor'} medal <span aria-hidden="true">·</span> Tier {tier}</p>
      <p className="achievement-card__score"><strong>{formatAchievementScore(track, band)}</strong><span>{meta.group === 'SAT' ? 'score' : 'band'}</span></p>
      {children}
    </article>
  )
}
