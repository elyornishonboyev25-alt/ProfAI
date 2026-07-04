import { motion, useReducedMotion } from 'framer-motion'
import { BookOpen, Headphones, Mic2, PenSquare } from 'lucide-react'

const EASE = [0.22, 1, 0.36, 1] as const

// Four skill tiles hugging the panel edges. `edge` anchors to the panel's left
// or right side; `v` is the vertical position within the panel.
const SKILL_TILES = [
  { icon: Headphones, label: 'Listening', edge: 'left', v: 'top-[14%]', delay: 0.35, float: 4.4 },
  { icon: PenSquare, label: 'Writing', edge: 'left', v: 'bottom-[10%]', delay: 0.5, float: 5.1 },
  { icon: BookOpen, label: 'Reading', edge: 'right', v: 'top-[16%]', delay: 0.45, float: 4.8 },
  { icon: Mic2, label: 'Speaking', edge: 'right', v: 'bottom-[12%]', delay: 0.6, float: 5.4 },
] as const

// Small red glow dots peeking around the tiles (concept: 3-Dashboard close-up).
const GLOW_DOTS = [
  { className: 'left-[3%] top-[30%] h-3 w-3', delay: 0 },
  { className: 'left-[22%] top-[22%] h-2 w-2', delay: 0.7 },
  { className: 'left-[-4%] bottom-[26%] h-9 w-9', delay: 1.3 },
  { className: 'left-[26%] bottom-[20%] h-2.5 w-2.5', delay: 0.4 },
  { className: 'right-[4%] top-[26%] h-2.5 w-2.5', delay: 1.0 },
  { className: 'right-[24%] top-[40%] h-2 w-2', delay: 1.6 },
  { className: 'right-[2%] bottom-[24%] h-3.5 w-3.5', delay: 0.9 },
  { className: 'right-[-3%] top-[46%] h-7 w-7', delay: 1.9 },
] as const

/**
 * The "Dashboard" band-score composition from the ProfAI landing concept — one
 * tilted liquid-glass panel with an animated 7.5 Overall Band ring, and four
 * frosted skill tiles hugging the panel's left/right edges (each with its own
 * drop shadow so it hovers above the glass), plus small red glow dots.
 * Decorative; honours reduced motion.
 */
export default function LiquidGlassHero() {
  const reduce = !!useReducedMotion()
  const R = 116
  const CIRC = 2 * Math.PI * R
  const target = 7.5
  const dash = CIRC * (target / 9)

  return (
    <div className="relative mx-auto h-[440px] w-full max-w-[600px] [perspective:1600px]">
      {/* the composition: panel is the positioning context so tiles hug its edges */}
      <div className="absolute left-1/2 top-1/2 h-[330px] w-[430px] -translate-x-1/2 -translate-y-1/2">
        {/* glow dots + spheres around the tiles */}
        {GLOW_DOTS.map((dot, i) => (
          <motion.span
            key={i}
            className={`lg-orb pointer-events-none absolute ${dot.className}`}
            animate={reduce ? undefined : { y: [0, -10, 0], opacity: [0.5, 0.95, 0.5] }}
            transition={{ duration: 5, delay: dot.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}

        {/* tilted glass panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
          className="lg-glass lg-glass-sheen absolute inset-0 rounded-[30px] [transform:perspective(1400px)_rotateY(-9deg)_rotateX(3deg)]"
        >
          <p className="absolute left-6 top-5 text-xl font-black italic tracking-tight text-slate-800">Dashboard</p>

          {/* band ring + score, centred */}
          <div className="absolute inset-0 grid place-items-center">
            <svg viewBox="0 0 280 280" className="h-[238px] w-[238px] -rotate-90 drop-shadow-[0_10px_22px_rgba(220,38,38,0.2)]">
              <circle cx="140" cy="140" r={R} fill="none" stroke="rgba(148,163,184,0.16)" strokeWidth="17" />
              <motion.circle
                cx="140"
                cy="140"
                r={R}
                fill="none"
                stroke="url(#lg-band)"
                strokeWidth="17"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                initial={{ strokeDashoffset: reduce ? CIRC - dash : CIRC }}
                animate={{ strokeDashoffset: CIRC - dash }}
                transition={{ duration: reduce ? 0 : 1.4, delay: 0.5, ease: EASE }}
              />
              <defs>
                <linearGradient id="lg-band" x1="1" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="50%" stopColor="#b91c1c" />
                  <stop offset="100%" stopColor="#1e293b" />
                </linearGradient>
              </defs>
            </svg>
            <div className="pointer-events-none absolute flex flex-col items-center">
              <span className="text-[3.4rem] font-black leading-none tracking-tight text-slate-900">{target.toFixed(1)}</span>
              <span className="mt-2 text-center text-sm font-semibold leading-tight text-slate-500">
                Overall Band
                <br />
                Score
              </span>
            </div>
          </div>
        </motion.div>

        {/* skill tiles hugging the panel's left / right edges */}
        {SKILL_TILES.map((tile) => {
          const Icon = tile.icon
          const anchor = tile.edge === 'left' ? 'left-0 -translate-x-1/2' : 'right-0 translate-x-1/2'
          return (
            <motion.div
              key={tile.label}
              initial={{ opacity: 0, scale: 0.8, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.55, ease: EASE, delay: tile.delay }}
              className={`absolute z-10 ${anchor} ${tile.v}`}
            >
              <motion.div
                animate={reduce ? undefined : { y: [0, -8, 0] }}
                transition={{ duration: tile.float, repeat: Infinity, ease: 'easeInOut' }}
                className="lg-glass lg-glass-sheen flex h-[104px] w-[104px] flex-col items-center justify-center gap-2 rounded-[24px] [box-shadow:0_18px_38px_rgba(15,23,42,0.18),0_3px_10px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)]"
              >
                <Icon className="h-7 w-7 text-red-600" strokeWidth={1.8} />
                <span className="text-[13px] font-bold text-slate-700">{tile.label}</span>
              </motion.div>
            </motion.div>
          )
        })}
      </div>
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
          {SKILL_TILES.map((tile) => {
            const Icon = tile.icon
            return (
              <div
                key={tile.label}
                className="lg-glass lg-glass-sheen flex items-center gap-2.5 rounded-2xl px-3 py-3"
              >
                <Icon className="h-5 w-5 shrink-0 text-red-600" strokeWidth={1.8} />
                <span className="text-sm font-bold text-slate-700">{tile.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
