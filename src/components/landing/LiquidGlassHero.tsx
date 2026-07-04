import { motion, useReducedMotion } from 'framer-motion'
import { BookOpen, Headphones, Mic2, PenSquare } from 'lucide-react'

const EASE = [0.22, 1, 0.36, 1] as const

const SKILL_CARDS = [
  { icon: Headphones, label: 'Listening', pos: '-left-3 top-[20%]', delay: 0.35, float: 4.4 },
  { icon: PenSquare, label: 'Writing', pos: 'left-1 bottom-[16%]', delay: 0.55, float: 5.1 },
  { icon: BookOpen, label: 'Reading', pos: '-right-3 top-[22%]', delay: 0.45, float: 4.8 },
  { icon: Mic2, label: 'Speaking', pos: 'right-0 bottom-[14%]', delay: 0.65, float: 5.4 },
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
    <div className="relative mx-auto h-[500px] w-full max-w-[620px] [perspective:1400px]">
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

      {/* main glass dashboard panel — large, tilted in 3D perspective, thick glass edge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 26 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
        className="lg-glass lg-glass-sheen absolute left-1/2 top-1/2 flex h-[366px] w-[470px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-[34px] [transform:perspective(1200px)_rotateY(-8deg)_rotateX(2deg)]"
      >
        <p className="absolute left-7 top-6 text-xl font-black italic tracking-tight text-slate-800">Dashboard</p>

        {/* white circular glass disc behind the ring */}
        <div
          className="absolute h-[190px] w-[190px] rounded-full"
          style={{
            background: 'radial-gradient(circle at 40% 32%, rgba(255,255,255,0.95), rgba(255,255,255,0.7))',
            boxShadow: '0 10px 30px rgba(15,23,42,0.1), inset 0 1px 0 rgba(255,255,255,0.95)',
          }}
        />

        {/* band ring */}
        <svg viewBox="0 0 280 280" className="relative h-[252px] w-[252px] -rotate-90 drop-shadow-[0_12px_26px_rgba(220,38,38,0.22)]">
          <circle cx="140" cy="140" r={R} fill="none" stroke="rgba(148,163,184,0.14)" strokeWidth="18" />
          <motion.circle
            cx="140"
            cy="140"
            r={R}
            fill="none"
            stroke="url(#lg-band)"
            strokeWidth="18"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            initial={{ strokeDashoffset: reduce ? CIRC - dash : CIRC }}
            animate={{ strokeDashoffset: CIRC - dash }}
            transition={{ duration: reduce ? 0 : 1.4, delay: 0.5, ease: EASE }}
          />
          <defs>
            <linearGradient id="lg-band" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7f1d1d" />
              <stop offset="45%" stopColor="#b91c1c" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>
          </defs>
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-6xl font-black tracking-tight text-slate-900">{target.toFixed(1)}</span>
          <span className="mt-1.5 text-center text-sm font-semibold leading-tight text-slate-500">
            Overall Band
            <br />
            Score
          </span>
        </div>
      </motion.div>

      {/* floating frosted skill cards — larger, popped forward in 3D, own drop shadow */}
      {SKILL_CARDS.map((card) => {
        const Icon = card.icon
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: card.delay }}
            className={`absolute ${card.pos} [transform-style:preserve-3d]`}
          >
            <motion.div
              animate={reduce ? undefined : { y: [0, -9, 0] }}
              transition={{ duration: card.float, repeat: Infinity, ease: 'easeInOut' }}
              className="lg-glass lg-glass-sheen flex h-[104px] w-[104px] flex-col items-center justify-center gap-2 rounded-[26px] [transform:translateZ(40px)] [box-shadow:0_16px_34px_rgba(15,23,42,0.16),0_2px_8px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.9)]"
            >
              <Icon className="h-7 w-7 text-red-600" strokeWidth={1.8} />
              <span className="text-[13px] font-bold text-slate-700">{card.label}</span>
            </motion.div>
          </motion.div>
        )
      })}
    </div>
  )
}

/**
 * Compact stacked version for phones (concept: dashboard drops below the text,
 * tiles reflow into a 2x2 grid). Rendered on < lg screens.
 */
export function LiquidGlassHeroMobile() {
  const reduce = !!useReducedMotion()
  const R = 120
  const CIRC = 2 * Math.PI * R
  const target = 7.5
  const dash = CIRC * (target / 9)

  return (
    <div className="mx-auto mt-8 w-full max-w-sm">
      <div className="lg-glass lg-glass-sheen relative flex flex-col items-center overflow-hidden rounded-[28px] p-6">
        <p className="self-start text-lg font-black italic tracking-tight text-slate-800">Dashboard</p>
        <div className="relative my-2 grid place-items-center">
          <svg viewBox="0 0 280 280" className="h-44 w-44 -rotate-90">
            <circle cx="140" cy="140" r={R} fill="none" stroke="rgba(148,163,184,0.14)" strokeWidth="18" />
            <motion.circle
              cx="140"
              cy="140"
              r={R}
              fill="none"
              stroke="url(#lg-band-m)"
              strokeWidth="18"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              initial={{ strokeDashoffset: reduce ? CIRC - dash : CIRC }}
              whileInView={{ strokeDashoffset: CIRC - dash }}
              viewport={{ once: true }}
              transition={{ duration: reduce ? 0 : 1.3, ease: EASE }}
            />
            <defs>
              <linearGradient id="lg-band-m" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#7f1d1d" />
                <stop offset="45%" stopColor="#b91c1c" />
                <stop offset="100%" stopColor="#f43f5e" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-4xl font-black tracking-tight text-slate-900">{target.toFixed(1)}</span>
            <span className="text-center text-[11px] font-semibold leading-tight text-slate-500">Overall Band Score</span>
          </div>
        </div>
        <div className="mt-3 grid w-full grid-cols-2 gap-3">
          {SKILL_CARDS.map((card) => {
            const Icon = card.icon
            return (
              <div
                key={card.label}
                className="lg-glass lg-glass-sheen flex items-center gap-2.5 rounded-2xl px-3 py-3"
              >
                <Icon className="h-5 w-5 shrink-0 text-red-600" strokeWidth={1.8} />
                <span className="text-sm font-bold text-slate-700">{card.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
