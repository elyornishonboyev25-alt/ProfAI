import { useId } from 'react'
import { BookOpen, Headphones, Mic, PenLine, Sigma, Trophy, Type } from 'lucide-react'
import { TRACK_META, TIER_NAME, formatAchievementScore, tierForAchievement, type SkillTrackKey, type TrackMeta } from './badgeMeta'
import './achievements.css'

const ICONS: Record<TrackMeta['icon'], typeof BookOpen> = { BookOpen, Headphones, Mic, PenLine, Sigma, Trophy, Type }

// One minted medal for every exam: brand ribbon, reeded metal rim, engraved
// legend ring and a clean centre that carries the skill emblem and the score.
// [highlight, base, ink/shadow, face]
const METAL = {
  6: ['#ffe6cc', '#c98a57', '#6b3a1b', '#efc39c'],
  7: ['#fff7d9', '#e2b24f', '#74470c', '#f5d991'],
  8: ['#ffffff', '#c6cdd8', '#4c586b', '#e7ebf1'],
  9: ['#f1fdff', '#9bd3e3', '#21536a', '#d2eff7'],
} as const

const CX = 120
const CY = 172

export type SkillBadgeProps = { track: SkillTrackKey; band: number; size?: number; showBand?: boolean; showLabel?: boolean; className?: string }

// Fine milled edge, like a struck coin.
function reedPath(): string {
  return Array.from({ length: 96 }, (_, i) => {
    const a = (i / 96) * Math.PI * 2
    const c = Math.cos(a)
    const s = Math.sin(a)
    return `M${(CX + c * 83.2).toFixed(2)} ${(CY + s * 83.2).toFixed(2)}L${(CX + c * 87.6).toFixed(2)} ${(CY + s * 87.6).toFixed(2)}`
  }).join('')
}

function star(cx: number, cy: number, r: number, points = 5, inner = 0.45): string {
  return `${Array.from({ length: points * 2 }, (_, i) => {
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2
    const radius = i % 2 ? r * inner : r
    return `${i ? 'L' : 'M'}${(cx + Math.cos(a) * radius).toFixed(2)} ${(cy + Math.sin(a) * radius).toFixed(2)}`
  }).join('')}Z`
}

export default function SkillBadge({ track, band, size = 120, showBand = true, showLabel = false, className = '' }: SkillBadgeProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const tier = tierForAchievement(track, band) ?? (band < 7 ? 6 : 7)
  const meta = TRACK_META[track]
  const [light, mid, dark, face] = METAL[tier]
  const score = formatAchievementScore(track, band)
  const isSat = meta.group === 'SAT'
  const Icon = ICONS[meta.icon]
  const title = meta.title.toUpperCase()
  const longTitle = title.length > 18
  const id = (name: string) => `${name}-${uid}`
  const url = (name: string) => `url(#${id(name)})`
  return (
    <div className={`achievement-medal ${className}`} data-tier={tier} style={{ width: size, flex: 'none' }}>
      <svg viewBox="0 0 240 268" width="100%" style={{ display: 'block' }} role="img" aria-label={`${meta.title}, ${TIER_NAME[tier]}, Tier ${tier}, ${isSat ? 'score' : 'band'} ${score}`}>
        <defs>
          <linearGradient id={id('rim')} x1="0" y1="0" x2="1" y2="1"><stop stopColor={light} /><stop offset="28%" stopColor={mid} /><stop offset="50%" stopColor={light} /><stop offset="74%" stopColor={mid} /><stop offset="100%" stopColor={dark} /></linearGradient>
          <linearGradient id={id('bevel')} x1="1" y1="1" x2="0" y2="0"><stop stopColor={light} /><stop offset="45%" stopColor={mid} /><stop offset="100%" stopColor={dark} /></linearGradient>
          <radialGradient id={id('face')} cx=".38" cy=".3" r=".85"><stop stopColor={light} /><stop offset="55%" stopColor={face} /><stop offset="100%" stopColor={mid} /></radialGradient>
          <radialGradient id={id('core')} cx=".42" cy=".32" r=".9"><stop stopColor="#fff" stopOpacity=".95" /><stop offset="45%" stopColor={face} /><stop offset="100%" stopColor={mid} /></radialGradient>
          <linearGradient id={id('ribbonL')} gradientUnits="userSpaceOnUse" x1="56" y1="0" x2="95.5" y2="-13.4">
            <stop offset="0" stopColor="#141c31" /><stop offset=".1" stopColor="#1d2843" /><stop offset=".1" stopColor="#f4f6fa" /><stop offset=".15" stopColor="#f4f6fa" /><stop offset=".15" stopColor="#1d2843" />
            <stop offset=".38" stopColor="#1d2843" /><stop offset=".38" stopColor="#c81e2c" /><stop offset=".62" stopColor="#e2313e" /><stop offset=".62" stopColor="#1d2843" />
            <stop offset=".85" stopColor="#1d2843" /><stop offset=".85" stopColor="#f4f6fa" /><stop offset=".9" stopColor="#f4f6fa" /><stop offset=".9" stopColor="#1d2843" /><stop offset="1" stopColor="#141c31" />
          </linearGradient>
          <linearGradient id={id('ribbonR')} gradientUnits="userSpaceOnUse" x1="140" y1="0" x2="179.5" y2="13.4" href={`#${id('ribbonL')}`} />
          <linearGradient id={id('fold')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fff" stopOpacity=".16" /><stop offset=".55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".42" /></linearGradient>
          <linearGradient id={id('sheen')} x1="0" y1="0" x2="1" y2="1"><stop offset=".3" stopColor="#fff" stopOpacity="0" /><stop offset=".42" stopColor="#fff" stopOpacity=".5" /><stop offset=".5" stopColor="#fff" stopOpacity="0" /></linearGradient>
          <radialGradient id={id('glow')}><stop stopColor={mid} stopOpacity=".35" /><stop offset="100%" stopColor={mid} stopOpacity="0" /></radialGradient>
          <clipPath id={id('clip')}><circle cx={CX} cy={CY} r="74" /></clipPath>
          <path id={id('top')} d={`M ${CX - 55} ${CY} A 55 55 0 0 1 ${CX + 55} ${CY}`} />
          <path id={id('bottom')} d={`M ${CX - 62} ${CY} A 62 62 0 0 0 ${CX + 62} ${CY}`} />
        </defs>

        <circle cx={CX} cy={CY} r="112" fill={url('glow')} />

        {/* Ribbon: navy with ProfAI red centre stripe, crossed into a V. */}
        <path d="M140 0 H184 L146 112 H102 Z" fill={url('ribbonR')} />
        <path d="M140 0 H184 L146 112 H102 Z" fill={url('fold')} />
        <path d="M56 0 H100 L138 112 H94 Z" fill={url('ribbonL')} />
        <path d="M56 0 H100 L138 112 H94 Z" fill={url('fold')} />
        <path d="M94 112 L120 104 L146 112 L120 122 Z" fill="#0d1324" opacity=".55" />

        {/* Bail */}
        <rect x="104" y="72" width="32" height="20" rx="10" fill="none" stroke={url('rim')} strokeWidth="5" />
        <rect x="104" y="72" width="32" height="20" rx="10" fill="none" stroke={dark} strokeWidth=".8" opacity=".55" />

        {/* Rim with reeded edge and bevel */}
        <circle cx={CX} cy={CY + 2.5} r="88" fill={dark} opacity=".35" />
        <circle cx={CX} cy={CY} r="88" fill={url('rim')} stroke={dark} strokeWidth="1.2" />
        <path d={reedPath()} stroke={dark} strokeWidth="1.1" opacity=".38" />
        <circle cx={CX} cy={CY} r="82" fill={url('bevel')} />
        <circle cx={CX} cy={CY} r="76" fill={url('face')} stroke={dark} strokeWidth="1" strokeOpacity=".6" />
        <circle cx={CX} cy={CY} r="74.5" fill="none" stroke={light} strokeWidth="1" opacity=".9" />

        {/* Legend ring */}
        <text fill={dark} fontSize={longTitle ? 7.6 : 9.4} fontFamily="Inter, system-ui, sans-serif" fontWeight="800" letterSpacing={longTitle ? 0.7 : 2.2} textAnchor="middle">
          <textPath href={`#${id('top')}`} startOffset="50%">{title}</textPath>
        </text>
        <text fill={dark} fontSize="7.4" fontFamily="Inter, system-ui, sans-serif" fontWeight="700" letterSpacing="2.4" textAnchor="middle" opacity=".85">
          <textPath href={`#${id('bottom')}`} startOffset="50%">{`${meta.group} · ${TIER_NAME[tier].toUpperCase()} · TIER ${tier}`}</textPath>
        </text>
        <path d={star(CX - 58, CY, 4.2)} fill={dark} opacity=".75" />
        <path d={star(CX + 58, CY, 4.2)} fill={dark} opacity=".75" />

        {/* Centre medallion */}
        <circle cx={CX} cy={CY} r="49" fill={dark} opacity=".18" transform={`translate(0 1.4)`} />
        <circle cx={CX} cy={CY} r="49" fill={url('core')} stroke={dark} strokeWidth="1" strokeOpacity=".55" />
        <circle cx={CX} cy={CY} r="45.5" fill="none" stroke={dark} strokeWidth=".6" strokeOpacity=".3" strokeDasharray="1.2 2.4" />
        {showBand ? (
          <>
            <Icon x={CX - 10} y={CY - 38.5} width={20} height={20} color="#fff" strokeWidth={2.2} opacity={0.8} />
            <Icon x={CX - 10} y={CY - 39.2} width={20} height={20} color={dark} strokeWidth={2.2} />
            <text x={CX} y={CY + 15.8} textAnchor="middle" fontSize={isSat ? 25 : 31} fontFamily="Inter, system-ui, sans-serif" fontWeight="800" letterSpacing="-1.2" fill="#fff" opacity=".85">{score}</text>
            <text x={CX} y={CY + 15} textAnchor="middle" fontSize={isSat ? 25 : 31} fontFamily="Inter, system-ui, sans-serif" fontWeight="800" letterSpacing="-1.2" fill={dark}>{score}</text>
            <text x={CX} y={CY + 30} textAnchor="middle" fontSize="6.8" fontFamily="Inter, system-ui, sans-serif" fontWeight="800" letterSpacing="2.6" fill={dark} opacity=".7">{isSat ? 'SCORE' : 'BAND'}</text>
          </>
        ) : (
          <Icon x={CX - 26} y={CY - 26} width={52} height={52} color={dark} strokeWidth={2} />
        )}

        {/* Light */}
        <g clipPath={url('clip')}><rect x="30" y="80" width="180" height="180" fill={url('sheen')} /></g>
        <path d={`M ${CX - 80} ${CY - 26} A 84 84 0 0 1 ${CX - 22} ${CY - 81}`} fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" opacity=".75" />
        {tier === 9 && (
          <g fill="#fff">
            <path d={star(CX + 56, CY - 62, 9, 4, 0.18)} opacity=".95" />
            <path d={star(CX - 68, CY + 48, 5, 4, 0.2)} opacity=".8" />
          </g>
        )}
      </svg>
      {showLabel && <span className="mt-1 block text-center text-xs font-bold leading-normal text-slate-800">{meta.title}</span>}
    </div>
  )
}
