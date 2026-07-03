import { motion } from 'framer-motion'
import { GraduationCap, Sparkles } from 'lucide-react'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'

const particles = [
  { left: '14%', top: '20%', size: 5, delay: 0 },
  { left: '78%', top: '14%', size: 4, delay: 0.8 },
  { left: '30%', top: '68%', size: 6, delay: 1.6 },
  { left: '66%', top: '58%', size: 4, delay: 0.4 },
  { left: '48%', top: '30%', size: 3, delay: 2.2 },
  { left: '84%', top: '76%', size: 5, delay: 1.2 },
  { left: '10%', top: '82%', size: 4, delay: 2.8 },
  { left: '58%', top: '86%', size: 3, delay: 0.2 },
] as const

const stats = [
  { value: '30', label: 'Full Mocks' },
  { value: 'AI', label: 'Writing Coach' },
  { value: 'Live', label: 'Speaking Arena' },
] as const

/**
 * Dark aspirational side panel for the auth pages (concept: 11-Login-Desktop) —
 * floating world-cap logo among red particles with a quote and trust stats.
 * Rendered only on lg+ screens; the form column stays fully functional alone.
 */
export default function AuthShowcasePanel({ quote = 'Your journey abroad starts here' }: { quote?: string }) {
  const { minimalMotion } = useMotionPreferences()

  return (
    <div className="relative hidden overflow-hidden rounded-[1.85rem] bg-gradient-to-br from-slate-900 via-slate-900 to-[#3f0d12] p-10 text-white lg:flex lg:flex-col lg:justify-between">
      {/* glow orbs */}
      <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-red-600/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-12 h-64 w-64 rounded-full bg-rose-500/15 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-400/50 to-transparent" />

      {/* drifting particles */}
      {!minimalMotion &&
        particles.map((particle) => (
          <motion.span
            key={`${particle.left}-${particle.top}`}
            className="pointer-events-none absolute rounded-full bg-red-400/70"
            style={{ left: particle.left, top: particle.top, width: particle.size, height: particle.size }}
            animate={{ y: [0, -18, 0], opacity: [0.25, 0.9, 0.25] }}
            transition={{ duration: 5.5, delay: particle.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}

      <div className="relative">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-red-200 backdrop-blur-sm">
          <Sparkles className="h-3 w-3" />
          ProfAI
        </span>
      </div>

      <div className="relative flex flex-col items-center py-8">
        <motion.div
          animate={minimalMotion ? undefined : { y: [0, -10, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          className="relative"
        >
          <div className="pointer-events-none absolute inset-0 -z-10 scale-125 rounded-full bg-red-500/30 blur-2xl" />
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-[#DC2626] via-[#E11D48] to-[#B91C1C] shadow-[0_24px_50px_rgba(220,38,38,0.45)]">
            <GraduationCap className="h-12 w-12" />
          </div>
        </motion.div>

        <motion.h2
          initial={minimalMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 max-w-xs text-center text-2xl font-black leading-snug tracking-tight"
        >
          {quote}
        </motion.h2>
        <p className="mt-2 max-w-xs text-center text-sm leading-6 text-slate-300">
          SAT &amp; IELTS prep, AI feedback and admission guidance — one platform, one goal.
        </p>
      </div>

      <div className="relative grid grid-cols-3 gap-3">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={minimalMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 + idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-center backdrop-blur-sm"
          >
            <p className="text-lg font-black text-red-300">{stat.value}</p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-300">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
