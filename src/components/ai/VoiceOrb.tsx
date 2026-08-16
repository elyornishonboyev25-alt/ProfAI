import type { AiVoiceState } from '@/store/aiAssistantStore'

type VoiceOrbProps = {
  state?: AiVoiceState
  /** Live amplitude from 0 to 1. */
  level?: number
  size?: number
  className?: string
}

const PALETTES: Record<AiVoiceState, { core: string; glow: string; ring: string }> = {
  idle: {
    core: 'radial-gradient(circle at 32% 28%, #dbeafe 0%, #60a5fa 38%, #2563eb 72%, #1e3a8a 100%)',
    glow: 'rgba(37,99,235,0.34)',
    ring: 'rgba(96,165,250,0.58)',
  },
  listening: {
    core: 'radial-gradient(circle at 32% 28%, #bfdbfe 0%, #38bdf8 38%, #0284c7 72%, #075985 100%)',
    glow: 'rgba(2,132,199,0.42)',
    ring: 'rgba(56,189,248,0.66)',
  },
  thinking: {
    core: 'radial-gradient(circle at 32% 28%, #e0e7ff 0%, #a5b4fc 36%, #6366f1 70%, #3730a3 100%)',
    glow: 'rgba(99,102,241,0.4)',
    ring: 'rgba(129,140,248,0.62)',
  },
  speaking: {
    core: 'radial-gradient(circle at 32% 28%, #e0e7ff 0%, #818cf8 34%, #4f46e5 66%, #312e81 100%)',
    glow: 'rgba(79,70,229,0.48)',
    ring: 'rgba(129,140,248,0.68)',
  },
}

export function VoiceOrb({ state = 'idle', level = 0, size = 120, className }: VoiceOrbProps) {
  const palette = PALETTES[state]
  const active = state === 'speaking' || state === 'listening'
  const coreScale = active ? 1 + Math.min(0.2, level * 0.32) : 1

  return (
    <span
      className={className}
      style={{ width: size, height: size, position: 'relative', display: 'inline-flex' }}
      aria-hidden="true"
    >
      <span
        style={{
          position: 'absolute',
          inset: '-18%',
          borderRadius: '9999px',
          background: `radial-gradient(circle, ${palette.glow} 0%, transparent 68%)`,
          filter: 'blur(7px)',
          opacity: active ? 0.72 : 0.5,
        }}
      />

      {active ? (
        <span
          className="voice-orb-active-ring"
          style={{ position: 'absolute', inset: '5%', borderRadius: '9999px', border: `2px solid ${palette.ring}` }}
        />
      ) : null}

      <span
        className="transition-transform duration-150"
        style={{
          background: palette.core,
          boxShadow: `inset 0 ${size * 0.04}px ${size * 0.09}px rgba(255,255,255,0.55), inset 0 -${size * 0.05}px ${size * 0.12}px rgba(15,23,42,0.24), 0 ${size * 0.08}px ${size * 0.18}px ${palette.glow}`,
          transform: `scale(${coreScale})`,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: '14%',
            left: '20%',
            width: '38%',
            height: '30%',
            borderRadius: '9999px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, transparent 70%)',
            filter: 'blur(2px)',
          }}
        />
      </span>
    </span>
  )
}

export default VoiceOrb
