import { motion, useReducedMotion } from 'framer-motion'
import { BookOpen, Headphones, Mic2, PenSquare } from 'lucide-react'

const EASE = [0.22, 1, 0.36, 1] as const

const SKILL_CARDS = [
  { icon: Headphones, label: 'Listening', pos: 'left-0 top-[22%]', delay: 0.35, float: 4.4 },
  { icon: PenSquare, label: 'Writing', pos: 'left-2 bottom-[20%]', delay: 0.55, float: 5.1 },
  { icon: BookOpen, label: 'Reading', pos: 'right-0 top-[24%]', delay: 0.45, float: 4.8 },
  { icon: Mic2, label: 'Speaking', pos: 'right-1 bottom-[18%]', delay: 0.65, float: 5.4 },
] as const

const ORBS = [
  { className: 'left-[6%] top-[26%] h-10 w-10', delay: 0 },
  { className: 'right-[2%] top-[16%] h-6 w-6', delay: 0.8 },
  { className: 'left-[10%] bottom-[10%] h-9 w-9', delay: 1.4 },
  { className: 'right-[8%] bottom-[14%] h-11 w-11', delay: 0.5 },
  { className: 'right-[24%] top-[40%] h-4 w-4', delay: 1.1 },
] as const

/**
 * The floating "Dashboard" band-score panel from the ProfAI landing concept —
 * a liquid-glass card with an animated 7.5 Overall Band ring, four drifting
 * frosted skill cards and soft red glow orbs. Decorative; honours reduced motion.
 */
export default function LiquidGlassHero() {
  const reduce = !!useReducedMotion()
  const R = 120
  const CIRC = 2 * Math.PI * R
  const target = 7.5
  const dash = CIRC * (target / 9)

  return (
    <div className="relative mx-auto h-[440px] w-full max-w-[560px]">
      {/* floating red glow orbs */}
      {!reduce &&
        ORBS.map((orb, i) => (
          <motion.span
            key={i}
            className={`lg-orb pointer-events-none absolute ${orb.className}`}
            animate={{ y: [0, -14, 0], opacity: [0.5, 0.95, 0.5] }}
            transition={{ duration: 5.5, delay: orb.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}

      {/* main glass dashboard panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, rotate: -3, y: 26 }}
        animate={{ opacity: 1, scale: 1, rotate: -2, y: 0 }}
        transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
        className="lg-glass lg-glass-sheen absolute left-1/2 top-1/2 flex h-[300px] w-[380px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-[28px]"
      >
        <p className="absolute left-6 top-5 text-lg font-black italic tracking-tight text-slate-800">Dashboard</p>

        {/* band ring */}
        <svg viewBox="0 0 280 280" className="h-[220px] w-[220px] -rotate-90">
          <circle cx="140" cy="140" r={R} fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth="16" />
          <motion.circle
            cx="140"
            cy="140"
            r={R}
            fill="none"
            stroke="url(#lg-band)"
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            initial={{ strokeDashoffset: reduce ? CIRC - dash : CIRC }}
            animate={{ strokeDashoffset: CIRC - dash }}
            transition={{ duration: reduce ? 0 : 1.4, delay: 0.5, ease: EASE }}
          />
          <defs>
            <linearGradient id="lg-band" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="55%" stopColor="#9f1239" />
              <stop offset="100%" stopColor="#DC2626" />
            </linearGradient>
          </defs>
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-black tracking-tight text-slate-900">{target.toFixed(1)}</span>
          <span className="mt-1 text-center text-xs font-semibold leading-tight text-slate-500">
            Overall Band
            <br />
            Score
          </span>
        </div>
      </motion.div>

      {/* floating frosted skill cards */}
      {SKILL_CARDS.map((card) => {
        const Icon = card.icon
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: card.delay }}
            className={`absolute ${card.pos}`}
          >
            <motion.div
              animate={reduce ? undefined : { y: [0, -9, 0] }}
              transition={{ duration: card.float, repeat: Infinity, ease: 'easeInOut' }}
              className="lg-glass lg-glass-sheen flex h-24 w-24 flex-col items-center justify-center gap-1.5 rounded-3xl"
            >
              <Icon className="h-6 w-6 text-red-600" strokeWidth={1.8} />
              <span className="text-xs font-bold text-slate-700">{card.label}</span>
            </motion.div>
          </motion.div>
        )
      })}
    </div>
  )
}
