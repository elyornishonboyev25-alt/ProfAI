import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { AiVoiceState } from '@/store/aiAssistantStore'

type VoiceOrbProps = {
  state?: AiVoiceState
  /** Live amplitude 0–1 — makes the core pulse with the voice. */
  level?: number
  size?: number
  className?: string
}

// Per-state palette. The orb is the emotional centre of the tutor, so each state
// reads at a glance: rose at rest, teal when it's hearing you, amber while it
// thinks, and a vivid red-rose pulse while it speaks.
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

export function VoiceOrb({ state = 'idle', level = 0, size = 120, className }: VoiceOrbProps) {
  const palette = PALETTES[state]
  const active = state === 'speaking' || state === 'listening'
  // Speaking/listening react to amplitude; idle/thinking just breathe gently.
  const coreScale = active ? 1 + Math.min(0.22, level * 0.35) : 1

  // A few orbiting sparks give the orb a sense of life.
  const sparks = useMemo(() => Array.from({ length: 6 }, (_, i) => i), [])

  return (
    <div
      className={className}
      style={{ width: size, height: size, position: 'relative', display: 'inline-flex' }}
      aria-hidden="true"
    >
      {/* Ambient glow */}
      <motion.div
        style={{
          position: 'absolute',
          inset: '-22%',
          borderRadius: '9999px',
          background: `radial-gradient(circle, ${palette.glow} 0%, transparent 68%)`,
          filter: 'blur(8px)',
        }}
        animate={{ opacity: active ? [0.7, 1, 0.7] : [0.45, 0.65, 0.45], scale: [1, 1.06, 1] }}
        transition={{ duration: active ? 1.6 : 3.4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Expanding rings — stronger when listening/speaking */}
      <AnimatePresence>
        {active
          ? [0, 1].map((ring) => (
              <motion.span
                key={ring}
                initial={{ opacity: 0.5, scale: 0.7 }}
                animate={{ opacity: 0, scale: 1.7 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.8, repeat: Infinity, delay: ring * 0.9, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  inset: '6%',
                  borderRadius: '9999px',
                  border: `2px solid ${palette.ring}`,
                }}
              />
            ))
          : null}
      </AnimatePresence>

      {/* Slow rotating halo with sparks */}
      <motion.div
        style={{ position: 'absolute', inset: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: state === 'thinking' ? 6 : 16, repeat: Infinity, ease: 'linear' }}
      >
        {sparks.map((i) => {
          const angle = (i / sparks.length) * Math.PI * 2
          const r = size * 0.46
          const x = Math.cos(angle) * r + size / 2
          const y = Math.sin(angle) * r + size / 2
          return (
            <motion.span
              key={i}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                width: Math.max(3, size * 0.035),
                height: Math.max(3, size * 0.035),
                marginLeft: -size * 0.0175,
                marginTop: -size * 0.0175,
                borderRadius: '9999px',
                background: palette.spark,
                boxShadow: `0 0 ${size * 0.06}px ${palette.spark}`,
              }}
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.3, 0.8] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.22, ease: 'easeInOut' }}
            />
          )
        })}
      </motion.div>

      {/* Core sphere */}
      <motion.div
        style={{
          position: 'absolute',
          inset: '16%',
          borderRadius: '9999px',
          background: palette.core,
          boxShadow: `inset 0 ${size * 0.04}px ${size * 0.09}px rgba(255,255,255,0.55), inset 0 -${size * 0.05}px ${size * 0.12}px rgba(0,0,0,0.28), 0 ${size * 0.08}px ${size * 0.18}px ${palette.glow}`,
        }}
        animate={{
          scale: active ? coreScale : [1, 1.04, 1],
          // Subtle organic wobble while speaking.
          borderRadius: state === 'speaking' ? ['48% 52% 53% 47%', '52% 48% 47% 53%', '48% 52% 53% 47%'] : '9999px',
        }}
        transition={
          active
            ? { scale: { duration: 0.18, ease: 'easeOut' }, borderRadius: { duration: 1.1, repeat: Infinity, ease: 'easeInOut' } }
            : { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }
        }
      >
        {/* Specular highlight */}
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
      </motion.div>
    </div>
  )
}

export default VoiceOrb
