import { useId } from 'react'
import { BookOpen, Headphones, Mic, PenLine, Sigma, Type, type LucideIcon } from 'lucide-react'
import {
  TRACK_META,
  TIER_NAME,
  formatAchievementScore,
  tierForAchievement,
  type SkillTrackKey,
} from './badgeMeta'

const ICONS: Record<string, LucideIcon> = { Headphones, BookOpen, PenLine, Mic, Sigma, Type }

type TierStyle = {
  /** metal gradient stops: light → mid → dark */
  stops: [string, string, string]
  ring: string
  ringHi: string
  panel: [string, string]
  ink: string
  rays: boolean
  sparkles: number
  gems: number
  glow: number
}

// 6 = simplest/least shiny, 9 = most ornate. This is what makes a higher band look
// visibly more prestigious.
const TIER_STYLE: Record<6 | 7 | 8 | 9, TierStyle> = {
  6: { stops: ['#ECC08C', '#B6772F', '#6B3C16'], ring: '#8A4F22', ringHi: '#F0C79B', panel: ['#4A2A12', '#2C1708'], ink: '#FBE7CE', rays: false, sparkles: 0, gems: 0, glow: 0 },
  7: { stops: ['#F6F9FC', '#B7C3D3', '#6A7889'], ring: '#5E6A79', ringHi: '#FFFFFF', panel: ['#39434F', '#232A33'], ink: '#EAF1F9', rays: false, sparkles: 0, gems: 0, glow: 0.2 },
  8: { stops: ['#FDEFB8', '#F2B739', '#A9711A'], ring: '#B07A1E', ringHi: '#FFF7DC', panel: ['#46330E', '#291D07'], ink: '#FFF6DA', rays: true, sparkles: 3, gems: 0, glow: 0.5 },
  9: { stops: ['#EAFCFF', '#7FE6F4', '#29B6D8'], ring: '#1A9FBE', ringHi: '#FFFFFF', panel: ['#0E3B47', '#07242D'], ink: '#ECFEFF', rays: true, sparkles: 6, gems: 4, glow: 0.78 },
}

const SPARKLE_POS = [
  { x: 26, y: 30, r: 3.2 },
  { x: 96, y: 34, r: 2.6 },
  { x: 22, y: 70, r: 2.2 },
  { x: 100, y: 74, r: 3 },
  { x: 40, y: 18, r: 2 },
  { x: 82, y: 20, r: 2.4 },
]

const GEM_POS = [
  { x: 60, y: 16 },
  { x: 104, y: 44 },
  { x: 16, y: 44 },
  { x: 60, y: 128 },
]

function Sparkle({ x, y, r, fill }: { x: number; y: number; r: number; fill: string }) {
  return (
    <path
      d={`M${x} ${y - r} L${x + r * 0.32} ${y - r * 0.32} L${x + r} ${y} L${x + r * 0.32} ${y + r * 0.32} L${x} ${y + r} L${x - r * 0.32} ${y + r * 0.32} L${x - r} ${y} L${x - r * 0.32} ${y - r * 0.32} Z`}
      fill={fill}
    />
  )
}

export type SkillBadgeProps = {
  track: SkillTrackKey
  band: number
  size?: number
  showBand?: boolean
  showLabel?: boolean
  className?: string
}

/**
 * Self-contained SVG crest for an earned skill band. IELTS tracks render as a
 * shield, SAT tracks as a hex medal; the metal/ornaments scale with the band tier
 * (6 bronze → 9 diamond). No external assets, so it always renders crisply.
 */
export default function SkillBadge({ track, band, size = 120, showBand = true, showLabel = false, className }: SkillBadgeProps) {
  const rawId = useId()
  const uid = rawId.replace(/[^a-zA-Z0-9]/g, '')
  const tier = tierForAchievement(track, band)
  const meta = TRACK_META[track]
  const Icon = ICONS[meta?.icon ?? 'BookOpen'] ?? BookOpen
  const isIelts = meta?.group === 'IELTS'
  const accent = isIelts ? '#2563EB' : '#2563EB'

  if (!tier) {
    // No badge earned (band < 6). Render a muted, locked placeholder.
    return (
      <div className={className} style={{ width: size, height: (size * 144) / 120 }} aria-hidden>
        <svg viewBox="0 0 120 144" width="100%" height="100%">
          <path d="M60 12 L106 30 L106 74 C106 106 86 124 60 134 C34 124 14 106 14 74 L14 30 Z" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="2" />
          <text x="60" y="84" textAnchor="middle" fontSize="34" fontWeight="800" fill="#94A3B8">?</text>
        </svg>
      </div>
    )
  }

  const s = TIER_STYLE[tier]
  const metalId = `metal-${uid}`
  const ringId = `ring-${uid}`
  const panelId = `panel-${uid}`
  const glowId = `glow-${uid}`
  const shineId = `shine-${uid}`

  // Shape paths differ by exam family.
  const outerPath = isIelts
    ? 'M60 12 L106 30 L106 74 C106 106 86 124 60 134 C34 124 14 106 14 74 L14 30 Z'
    : 'M60 12 L104 38 L104 90 L60 116 L16 90 L16 38 Z'
  const framePath = isIelts
    ? 'M60 20 L99 35 L99 73 C99 100 82 116 60 125 C38 116 21 100 21 73 L21 35 Z'
    : 'M60 20 L97 42 L97 86 L60 108 L23 86 L23 42 Z'
  const panelPath = isIelts
    ? 'M60 30 L91 42 L91 72 C91 94 77 107 60 114 C43 107 29 94 29 72 L29 42 Z'
    : 'M60 30 L90 47 L90 83 L60 100 L30 83 L30 47 Z'

  const rays = s.rays
    ? Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2
        const inner = 40
        const outer = 70
        const w = 0.05
        const cx = 60
        const cy = 72
        const p1 = [cx + Math.cos(a - w) * inner, cy + Math.sin(a - w) * inner]
        const p2 = [cx + Math.cos(a) * outer, cy + Math.sin(a) * outer]
        const p3 = [cx + Math.cos(a + w) * inner, cy + Math.sin(a + w) * inner]
        return `M${p1[0].toFixed(1)} ${p1[1].toFixed(1)} L${p2[0].toFixed(1)} ${p2[1].toFixed(1)} L${p3[0].toFixed(1)} ${p3[1].toFixed(1)} Z`
      })
    : []

  const iconSize = 40
  const iconY = isIelts ? 46 : 48

  return (
    <div className={className} style={{ width: size, height: (size * 144) / 120, lineHeight: 0 }}>
      <svg viewBox="0 0 120 144" width="100%" height="100%" role="img" aria-label={`${meta?.label ?? track} score ${formatAchievementScore(track, band)}`}>
        <defs>
          <linearGradient id={metalId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={s.stops[0]} />
            <stop offset="48%" stopColor={s.stops[1]} />
            <stop offset="100%" stopColor={s.stops[2]} />
          </linearGradient>
          <linearGradient id={ringId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={s.ringHi} />
            <stop offset="50%" stopColor={s.ring} />
            <stop offset="100%" stopColor={s.stops[2]} />
          </linearGradient>
          <linearGradient id={panelId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={s.panel[0]} />
            <stop offset="100%" stopColor={s.panel[1]} />
          </linearGradient>
          <linearGradient id={shineId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          {s.glow > 0 ? (
            <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation={3 + s.glow * 4} result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ) : null}
        </defs>

        {/* Glow halo for higher tiers */}
        {s.glow > 0 ? <ellipse cx="60" cy="72" rx="52" ry="58" fill={s.stops[1]} opacity={s.glow * 0.45} filter={`url(#${glowId})`} /> : null}

        {/* Rays behind the crest */}
        {rays.length ? (
          <g opacity={tier === 9 ? 0.85 : 0.6}>
            {rays.map((d, i) => (
              <path key={i} d={d} fill={tier === 9 ? '#BDF3FB' : '#FCE4A6'} opacity={i % 2 === 0 ? 0.9 : 0.4} />
            ))}
          </g>
        ) : null}

        {/* Group accent outline (IELTS warm / SAT cool) */}
        <path d={outerPath} fill="none" stroke={accent} strokeOpacity="0.55" strokeWidth="5" />

        {/* Metal body */}
        <path d={outerPath} fill={`url(#${metalId})`} stroke={s.ring} strokeWidth="1.5" />
        {/* Frame ring */}
        <path d={framePath} fill="none" stroke={`url(#${ringId})`} strokeWidth="4" />
        {/* Inner panel */}
        <path d={panelPath} fill={`url(#${panelId})`} stroke={s.ring} strokeWidth="1" />
        {/* Top shine on metal for 7+ */}
        {tier >= 7 ? <path d={panelPath} fill={`url(#${shineId})`} opacity="0.35" /> : null}

        {/* Gems on the frame (tier 9) */}
        {Array.from({ length: s.gems }).map((_, i) => {
          const g = GEM_POS[i]
          return <circle key={i} cx={g.x} cy={g.y} r="3.4" fill="#E0FBFF" stroke={accent} strokeWidth="1" />
        })}

        {/* Sparkles */}
        {SPARKLE_POS.slice(0, s.sparkles).map((sp, i) => (
          <Sparkle key={i} x={sp.x} y={sp.y} r={sp.r} fill={tier === 9 ? '#ECFEFF' : '#FFF7DC'} />
        ))}

        {/* Track emblem */}
        <Icon x={60 - iconSize / 2} y={iconY} width={iconSize} height={iconSize} color={s.ink} strokeWidth={2.1} />

        {/* Band number */}
        {showBand ? (
          <text x="60" y={isIelts ? 108 : 100} textAnchor="middle" fontSize="22" fontWeight="900" fill={s.ink} style={{ paintOrder: 'stroke' }} stroke={s.panel[1]} strokeWidth="0.6">
            {formatAchievementScore(track, band)}
          </text>
        ) : null}
      </svg>

      {showLabel ? (
        <div style={{ textAlign: 'center', marginTop: 4 }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', margin: 0 }}>{meta?.short}</p>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: accent, margin: 0 }}>
            {TIER_NAME[tier]}
          </p>
        </div>
      ) : null}
    </div>
  )
}
