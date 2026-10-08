import { useId } from 'react'
import { TRACK_META, TIER_NAME, formatAchievementScore, tierForAchievement, type SkillTrackKey } from './badgeMeta'
import './achievements.css'

// One minted crest for every exam, with the official ProfAI mark.
const METAL = {
  6: ['#fff0db', '#d8a178', '#87502d', '#f0c6a4'],
  7: ['#fff8dc', '#e8bd65', '#8c591b', '#f8dfa0'],
  8: ['#ffffff', '#cbd3df', '#627084', '#e9edf4'],
  9: ['#f4ffff', '#a8dce8', '#386c81', '#dbf3f8'],
} as const

export type SkillBadgeProps = { track: SkillTrackKey; band: number; size?: number; showBand?: boolean; showLabel?: boolean; className?: string }

function sealPath(): string {
  return `M${Array.from({ length: 144 }, (_, i) => {
    const angle = (i / 144) * Math.PI * 2 - Math.PI / 2
    const radius = 83 + 2.6 * Math.cos(angle * 18)
    return `${(120 + Math.cos(angle) * radius).toFixed(2)} ${(174 + Math.sin(angle) * radius).toFixed(2)}`
  }).join(' L')} Z`
}

export default function SkillBadge({ track, band, size = 120, showBand = true, showLabel = false, className = '' }: SkillBadgeProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const tier = tierForAchievement(track, band) ?? (band < 7 ? 6 : 7)
  const meta = TRACK_META[track]
  const [light, mid, dark, face] = METAL[tier]
  const score = formatAchievementScore(track, band)
  return (
    <div className={`achievement-medal ${className}`} style={{ width: size, flex: 'none' }}>
      <svg viewBox="0 0 240 268" width="100%" style={{ display: 'block' }} role="img" aria-label={`${meta.title}, ${TIER_NAME[tier]}, Tier ${tier}, ${meta.group === 'SAT' ? 'score' : 'band'} ${score}`}>
        <defs>
          <linearGradient id={`metal-${uid}`} x1="0" y1="0" x2="1" y2="1"><stop stopColor={light} /><stop offset="23%" stopColor={mid} /><stop offset="43%" stopColor={light} /><stop offset="61%" stopColor={mid} /><stop offset="83%" stopColor={dark} /><stop offset="100%" stopColor={light} /></linearGradient>
          <linearGradient id={`face-${uid}`} x1="0" y1="0" x2=".8" y2="1"><stop stopColor={light} /><stop offset="48%" stopColor={face} /><stop offset="100%" stopColor={mid} /></linearGradient>
          <linearGradient id={`ribbon-${uid}`} x1="0" y1="0" x2="1" y2="0"><stop stopColor={dark} /><stop offset="18%" stopColor={mid} /><stop offset="48%" stopColor={light} /><stop offset="66%" stopColor={mid} /><stop offset="100%" stopColor={dark} /></linearGradient>
          <radialGradient id={`glow-${uid}`}><stop stopColor={mid} stopOpacity=".28" /><stop offset="100%" stopColor={light} stopOpacity="0" /></radialGradient>
          <path id={`arc-${uid}`} d="M 58 173 A 62 62 0 0 1 182 173" />
        </defs>
        <circle cx="120" cy="168" r="108" fill={`url(#glow-${uid})`} />
        <path d="M56 4 H97 L133 94 L99 109 Z" fill={`url(#ribbon-${uid})`} stroke={dark} strokeWidth="1" />
        <path d="M143 4 H184 L145 109 L109 94 Z" fill={`url(#ribbon-${uid})`} stroke={dark} strokeWidth="1" />
        <path d="M60 5 H65 L102 101 M174 5 H179 L142 103" fill="none" stroke={light} strokeWidth="2" opacity=".65" />
        <rect x="97" y="86" width="46" height="28" rx="9" fill={`url(#metal-${uid})`} stroke={dark} strokeWidth="2" />
        <rect x="103" y="91" width="34" height="16" rx="5" fill="none" stroke={light} strokeWidth="2" />
        <path d={sealPath()} fill={`url(#metal-${uid})`} stroke={dark} strokeWidth="1.5" />
        <circle cx="120" cy="174" r="77" fill="none" stroke={light} strokeWidth="1.5" />
        <circle cx="120" cy="174" r="71" fill={`url(#face-${uid})`} stroke={dark} strokeWidth="1.8" />
        <circle cx="120" cy="174" r="67" fill="none" stroke={light} strokeWidth="1.8" />
        <circle cx="120" cy="179" r="46" fill="none" stroke={dark} strokeWidth=".8" opacity=".4" />
        <text fill={dark} fontSize={meta.title.length > 20 ? 10.5 : 12} fontFamily="Inter, system-ui, sans-serif" fontWeight="750" textAnchor="middle">
          <textPath href={`#arc-${uid}`} startOffset="50%">{meta.title} · Tier {tier}</textPath>
        </text>
        <image href="/logo.svg" x="86" y="137" width="68" height="68" />
        {showBand && <text x="120" y="211" textAnchor="middle" fontSize={meta.group === 'SAT' ? 21 : 24} fontFamily="Inter, system-ui, sans-serif" fontWeight="800" letterSpacing="-1" fill={dark}>{score}</text>}
        <g fill={`url(#metal-${uid})`} stroke={dark} strokeWidth=".45">
          <path d="M62 177 Q63 217 107 236 M178 177 Q177 217 133 236" fill="none" strokeWidth="1.5" />
          {Array.from({ length: 7 }, (_, i) => {
            const angle = (.04 + i * .06) * Math.PI
            const x = 120 - Math.cos(angle) * 57
            const y = 176 + Math.sin(angle) * 57
            return <g key={i}><ellipse cx={x} cy={y} rx="3.3" ry="7" transform={`rotate(${-35 - i * 9} ${x} ${y})`} /><ellipse cx={240 - x} cy={y} rx="3.3" ry="7" transform={`rotate(${35 + i * 9} ${240 - x} ${y})`} /></g>
          })}
          <path d="m120 226 2.5 5.5 6 .7-4.5 4 1.3 6-5.3-3-5.3 3 1.3-6-4.5-4 6-.7Z" />
        </g>
        <path d="M49 155 A75 75 0 0 1 142 103" fill="none" stroke="white" strokeWidth="2" opacity=".6" />
      </svg>
      {showLabel && <span className="mt-1 block text-center text-xs font-bold leading-normal text-slate-800">{meta.title}</span>}
    </div>
  )
}
