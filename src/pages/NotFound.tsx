import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, ArrowLeft, GraduationCap, Send, Sparkles } from 'lucide-react'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'

const paperPlanes = [
  { left: '12%', top: '18%', delay: 0, size: 22, rotate: -18 },
  { left: '82%', top: '24%', delay: 1.2, size: 18, rotate: 24 },
  { left: '20%', top: '72%', delay: 0.6, size: 16, rotate: 10 },
  { left: '74%', top: '68%', delay: 1.8, size: 24, rotate: -30 },
] as const

export default function NotFound() {
  const { minimalMotion } = useMotionPreferences()

  return (
    <div className="relative min-h-[80vh] overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="ambient-mesh" />
        <div className="ambient-grid" />
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-red-200/45 blur-3xl" />
        <div className="absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-rose-200/35 blur-3xl" />
        {/* drifting paper planes (concept: 33-404-Page) */}
        {!minimalMotion &&
          paperPlanes.map((plane) => (
            <motion.span
              key={`${plane.left}-${plane.top}`}
              className="absolute text-red-300/70"
              style={{ left: plane.left, top: plane.top }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1, 0.6], y: [0, -14, 4, -10], x: [0, 10, -6, 8], rotate: [plane.rotate, plane.rotate + 8, plane.rotate - 6, plane.rotate] }}
              transition={{ duration: 9, delay: plane.delay, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Send style={{ width: plane.size, height: plane.size }} />
            </motion.span>
          ))}
      </div>

      <motion.div
        initial={minimalMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={minimalMotion ? { duration: 0.14 } : { duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="premium-hero relative mx-auto flex max-w-2xl flex-col items-center p-10 text-center"
      >
        <span className="premium-top-chip">
          <Sparkles className="h-3.5 w-3.5" />
          ProfAI
        </span>

        <motion.div
          initial={minimalMotion ? false : { opacity: 0, scale: 0.85, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={minimalMotion ? { duration: 0.14 } : { duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className={`mt-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-[#DC2626] via-[#EF4444] to-[#B91C1C] text-white shadow-[0_18px_38px_rgba(220,38,38,0.36)] ${minimalMotion ? '' : 'fx-float'}`}
        >
          <GraduationCap className="h-10 w-10 rotate-180" />
        </motion.div>

        <motion.h1
          initial={minimalMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={minimalMotion ? { duration: 0.14 } : { duration: 0.55, delay: 0.08 }}
          className="mt-6 text-6xl font-black tracking-tight text-slate-900 sm:text-7xl"
        >
          <span className="arena-title-accent-red">404</span>
        </motion.h1>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">This page took a gap year</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
          The page you are looking for went studying abroad. Let&apos;s get you back to where the practice happens.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/dashboard"
            className="cta-sheen interactive-lift inline-flex items-center rounded-xl bg-gradient-to-r from-[#DC2626] via-[#EF4444] to-[#B91C1C] px-5 py-2.5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(220,38,38,0.32)]"
          >
            <Home className="mr-2 h-4 w-4" />
            Go to Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="interactive-lift inline-flex items-center rounded-xl border border-red-200 bg-white px-5 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </button>
        </div>
      </motion.div>
    </div>
  )
}
