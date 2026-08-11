import type { CSSProperties } from 'react'
import type { AiVoiceState } from '@/store/aiAssistantStore'

type VoiceOrbProps = {
  state?: AiVoiceState
  /** Live amplitude 0–1 — makes the core pulse with the voice. */
  level?: number
  size?: number
  className?: string
}

const PALETTES: Record<AiVoiceState, { core: string; glow: string; ring: string; spark: string }> = {
  idle: {
    core: 'radial-gradient(circle at 32% 28%, #fecdd3 0%, #fb7185 38%, #e11d48 72%, #9f1239 100%)',
    glow: 'rgba(244,63,94,0.45)',
    ring: 'rgba(251,113,133,0.55)',
    spark: '#fda4af',
  },
  listening: {
    core: 'radial-gradient(circle at 32% 28%, #a7f3d0 0%, #34d399 38%, #10b981 72%, #047857 100%)',
    glow: 'rgba(16,185,129,0.5)',
    ring: 'rgba(52,211,153,0.6)',
    spark: '#6ee7b7',
  },
  thinking: {
    core: 'radial-gradient(circle at 32% 28%, #fde68a 0%, #fbbf24 36%, #f59e0b 70%, #b45309 100%)',
    glow: 'rgba(245,158,11,0.48)',
    ring: 'rgba(251,191,36,0.6)',
    spark: '#fcd34d',
  },
  speaking: {
    core: 'radial-gradient(circle at 32% 28%, #fecaca 0%, #fb7185 34%, #ef4444 66%, #be123c 100%)',
    glow: 'rgba(239,68,68,0.6)',
    ring: 'rgba(251,113,133,0.7)',
    spark: '#fca5a5',
  },
}

const SPARKS = [0, 1, 2, 3, 4, 5] as const

export function VoiceOrb({ state = 'idle', level = 0, size = 120, className }: VoiceOrbProps) {
  const palette = PALETTES[state]
  const active = state === 'speaking' || state === 'listening'
  const animated = state !== 'idle'
  const coreScale = active ? 1 + Math.min(0.22, level * 0.35) : 1

  return (
    <div
      className={`voice-orb ${animated ? 'voice-orb--animated' : ''} ${className ?? ''}`}
      style={{ width: size, height: size, position: 'relative', display: 'inline-flex' }}
      aria-hidden="true"
    >
      <div
        className={`voice-orb-glow ${active ? 'voice-orb-glow--active' : ''}`}
        style={{ background: `radial-gradient(circle, ${palette.glow} 0%, transparent 68%)` }}
      />

      {active
        ? [0, 1].map((ring) => (
            <span
              key={ring}
              className="voice-orb-ring"
              style={{ borderColor: palette.ring, animationDelay: `${ring * 0.9}s` }}
            />
          ))
        : null}

      <div className={`voice-orb-halo ${state === 'thinking' ? 'voice-orb-halo--thinking' : ''}`}>
        {SPARKS.map((spark) => {
          const angle = (spark / SPARKS.length) * Math.PI * 2
          const radius = size * 0.46
          const x = Math.cos(angle) * radius + size / 2
          const y = Math.sin(angle) * radius + size / 2
          const sparkSize = Math.max(3, size * 0.035)
          const sparkStyle: CSSProperties = {
            left: x,
            top: y,
            width: sparkSize,
            height: sparkSize,
            marginLeft: -size * 0.0175,
            marginTop: -size * 0.0175,
            background: palette.spark,
            boxShadow: `0 0 ${size * 0.06}px ${palette.spark}`,
            animationDelay: `${spark * 0.22}s`,
          }

          return <span key={spark} className="voice-orb-spark" style={sparkStyle} />
        })}
      </div>

      <div
        className={`voice-orb-core ${active ? 'voice-orb-core--active' : 'voice-orb-core--rest'} ${state === 'speaking' ? 'voice-orb-core--speaking' : ''}`}
        style={{
          background: palette.core,
          boxShadow: `inset 0 ${size * 0.04}px ${size * 0.09}px rgba(255,255,255,0.55), inset 0 -${size * 0.05}px ${size * 0.12}px rgba(0,0,0,0.28), 0 ${size * 0.08}px ${size * 0.18}px ${palette.glow}`,
          transform: active ? `scale(${coreScale})` : undefined,
        }}
      >
        <span className="voice-orb-highlight" />
      </div>
    </div>
  )
}

export default VoiceOrb
