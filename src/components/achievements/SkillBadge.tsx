import { useId } from 'react'
import { BookOpen, Headphones, Mic, PenLine, Sigma, Trophy, Type, type LucideIcon } from 'lucide-react'
import { TRACK_META, formatAchievementScore, tierForAchievement, type SkillTrackKey } from './badgeMeta'

const ICONS: Record<string, LucideIcon> = { BookOpen, Headphones, Mic, PenLine, Sigma, Trophy, Type }
const METAL = {
  6: ['#f2d4ab', '#aa7040', '#724222', '#603b26'],
  7: ['#fff4c1', '#e6ae4c', '#98601e', '#78501f'],
  8: ['#f9fcff', '#b8c8dc', '#687c9a', '#455570'],
  9: ['#edffff', '#83dce9', '#258ca8', '#15526b'],
} as const

export type SkillBadgeProps = { track: SkillTrackKey; band: number; size?: number; showBand?: boolean; showLabel?: boolean; className?: string }

function sealPath(): string {
  return `M${Array.from({ length: 48 }, (_, i) => {
    const angle = (i / 48) * Math.PI * 2 - Math.PI / 2
    const r = i % 2 ? 82 : 86
    return `${(120 + Math.cos(angle) * r).toFixed(2)} ${(170 + Math.sin(angle) * r).toFixed(2)}`
  }).join(' L')} Z`
}

export default function SkillBadge({ track, band, size = 120, showBand = true, showLabel = false, className }: SkillBadgeProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const tier = tierForAchievement(track, band) ?? 7
  const meta = TRACK_META[track]
  const Icon = ICONS[meta?.icon ?? 'Trophy']
  const [light, mid, dark, face] = METAL[tier]
  const title = meta?.title ?? 'Achievement'
  const score = formatAchievementScore(track, band)
  return (
    <div className={className} style={{ width: size, height: size * 268 / 240, flex: 'none', lineHeight: 0 }}>
      <svg viewBox="0 0 240 268" width="100%" height="100%" role="img" aria-label={`${title}, Tier ${tier}, ${meta?.group === 'SAT' ? 'score' : 'band'} ${score}`}>
        <defs>
          <linearGradient id={`metal-${uid}`} x1="0" y1="0" x2="1" y2="1"><stop stopColor={light} /><stop offset="44%" stopColor={mid} /><stop offset="75%" stopColor={dark} /><stop offset="100%" stopColor={light} /></linearGradient>
          <linearGradient id={`face-${uid}`} x1="0" y1="0" x2="1" y2="1"><stop stopColor={dark} /><stop offset="52%" stopColor={face} /><stop offset="100%" stopColor={dark} /></linearGradient>
          <linearGradient id={`ribbon-${uid}`} x1="0" y1="0" x2="1" y2="0"><stop stopColor="#694018" /><stop offset="42%" stopColor={mid} /><stop offset="56%" stopColor={light} /><stop offset="100%" stopColor="#805021" /></linearGradient>
          <radialGradient id={`glow-${uid}`}><stop stopColor={light} stopOpacity=".5" /><stop offset="100%" stopColor={light} stopOpacity="0" /></radialGradient>
          <path id={`arc-${uid}`} d="M 57 153 A 63 63 0 0 1 183 153" />
        </defs>
        <circle cx="120" cy="151" r="113" fill={`url(#glow-${uid})`} />
        <path d="M55 3 H96 L130 91 L94 108 Z M144 3 H185 L146 108 L110 91 Z" fill={`url(#ribbon-${uid})`} stroke={dark} strokeWidth="2" />
        <path d="M91 3 H103 L134 87 H122 Z M137 3 H149 L118 87 H106 Z" fill={light} opacity=".5" />
        <rect x="96" y="83" width="48" height="28" rx="8" fill={`url(#metal-${uid})`} stroke={dark} strokeWidth="2" />
        <path d={sealPath()} fill={`url(#metal-${uid})`} stroke={dark} strokeWidth="3" />
        <circle cx="120" cy="170" r="78" fill="none" stroke={light} strokeWidth="2" opacity=".8" />
        <circle cx="120" cy="170" r="69" fill={`url(#face-${uid})`} stroke={dark} strokeWidth="3" />
        <circle cx="120" cy="170" r="62" fill="none" stroke={light} strokeWidth="2" opacity=".95" />
        <circle cx="120" cy="170" r="54" fill="none" stroke={mid} strokeWidth="1" opacity=".7" />
        <text fill="#fff8df" fontSize={title.length > 20 ? 10 : 13} fontFamily="Georgia, serif" fontWeight="700" letterSpacing=".2" textAnchor="middle">
          <textPath href={`#arc-${uid}`} startOffset="50%">{title} · Tier {tier}</textPath>
        </text>
        <Icon x="92" y="135" width="56" height="46" color="#fff8df" strokeWidth={1.8} />
        {showBand && <text x="120" y="199" textAnchor="middle" fontSize={meta?.group === 'SAT' ? 22 : 27} fontFamily="Georgia, serif" fontWeight="700" fill="#fff8df">{score}</text>}
        <g fill={light} opacity=".93">
          {Array.from({ length: 7 }, (_, i) => {
            const y = 174 + i * 8
            const left = 63 + i * 4
            return <g key={i}><ellipse cx={left} cy={y} rx="3.5" ry="7" transform={`rotate(-42 ${left} ${y})`} /><ellipse cx={240 - left} cy={y} rx="3.5" ry="7" transform={`rotate(42 ${240 - left} ${y})`} /></g>
          })}
        </g>
        <text x="120" y="226" textAnchor="middle" fill={light} fontSize="17">✦</text>
      </svg>
      {showLabel && <span className="block text-center text-xs font-bold text-slate-800">{title}</span>}
    </div>
  )
}
