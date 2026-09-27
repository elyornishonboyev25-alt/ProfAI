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
    core: 'radial-gradient(circle at 30% 25%, #ffffff 0%, #f5e9eb 26%, #d3495a 62%, #921c31 100%)',
    glow: 'rgba(196,39,59,0.28)',
    ring: 'rgba(211,73,90,0.48)',
  },
  listening: {
    core: 'radial-gradient(circle at 30% 25%, #fff 0%, #f8cbd0 28%, #e33c51 64%, #a51c32 100%)',
    glow: 'rgba(225,55,77,0.4)',
    ring: 'rgba(230,83,101,0.72)',
  },
  thinking: {
    core: 'radial-gradient(circle at 30% 25%, #fff 0%, #e7e3e6 26%, #ba8d98 62%, #a5293d 100%)',
    glow: 'rgba(159,64,84,0.34)',
    ring: 'rgba(190,108,124,0.62)',
  },
  speaking: {
    core: 'radial-gradient(circle at 30% 25%, #fff 0%, #f8bfc7 25%, #df354c 61%, #8f152b 100%)',
    glow: 'rgba(211,42,65,0.46)',
    ring: 'rgba(232,80,101,0.74)',
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
          position: 'absolute',
          inset: '10%',
          display: 'block',
          borderRadius: '9999px',
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
