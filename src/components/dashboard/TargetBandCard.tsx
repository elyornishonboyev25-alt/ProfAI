import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Flame, Target } from 'lucide-react'
import { fetchAccount } from '@/lib/profileApi'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { CountUp, ProgressRing } from '@/components/fx'
import type { DashboardOverview } from '@/types/platform'

interface TargetBandCardProps {
  metrics: DashboardOverview['metrics']
  weeklyProgress: DashboardOverview['weeklyProgress']
}

/**
 * Red-gradient "Target" hero strip: the learner's target score, an animated
 * overall-progress ring and a 7-day streak calendar (concept: 2-Dashboard +
 * 31-Notifications-Streak). Guests see the default IELTS 7.5 target.
 */
export default function TargetBandCard({ metrics, weeklyProgress }: TargetBandCardProps) {
  const navigate = useNavigate()
  const user = useAuthStore((state: AuthState) => state.user)
  const { minimalMotion } = useMotionPreferences()
  const [targetLabel, setTargetLabel] = useState<string | null>(null)
  const [targetPath, setTargetPath] = useState('/ielts')

  useEffect(() => {
    let cancelled = false
    if (!user) {
      setTargetLabel(null)
      setTargetPath('/ielts')
      return
    }
    fetchAccount()
      .then((account) => {
        if (cancelled) return
        const exam = account.profile.targetExam
        setTargetPath(exam === 'SAT' ? '/sat' : '/ielts')
        const score = account.profile.targetScore?.trim()
        if (!score) return
        const prefix = exam === 'SAT' ? 'SAT' : exam === 'BOTH' ? '' : 'IELTS'
        setTargetLabel(score.toUpperCase().includes('IELTS') || score.toUpperCase().includes('SAT') ? score : `${prefix} ${score}`.trim())
      })
      .catch(() => {
        /* profile backend optional — keep the default target */
      })
    return () => {
      cancelled = true
    }
  }, [user])

  const progress = Math.max(0, Math.min(100, metrics.averageScore ?? 0))
  const streak = Math.max(0, metrics.currentStreak ?? 0)

  return (
    <motion.section
      initial={minimalMotion ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-8% 0px' }}
      transition={minimalMotion ? { duration: 0.15 } : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#DC2626] via-[#E11D48] to-[#B91C1C] p-6 text-white shadow-[0_22px_50px_rgba(220,38,38,0.35)] sm:p-7"
    >
      {/* ambient glow orbs */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-rose-300/20 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

      <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-sm">
            <Target className="h-3 w-3" />
            Your Target
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{targetLabel ?? 'IELTS 7.5'}</h2>
          <p className="mt-1.5 max-w-md text-sm font-medium text-red-50/90">
            Keep your streak alive — every practice session moves this ring forward.
          </p>

          {/* 7-day streak strip */}
          <div className="mt-4 flex items-center gap-1.5" aria-label="Weekly activity streak">
            {weeklyProgress.slice(-7).map((day, idx) => (
              <motion.span
                key={day.date}
                initial={minimalMotion ? false : { opacity: 0, scale: 0.6 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={minimalMotion ? { duration: 0 } : { duration: 0.3, delay: 0.35 + idx * 0.06 }}
                className={`flex h-9 w-9 flex-col items-center justify-center rounded-xl border text-[9px] font-bold uppercase ${
                  day.active
                    ? 'border-white/40 bg-white/20 text-white shadow-[0_4px_12px_rgba(0,0,0,0.15)]'
                    : 'border-white/15 bg-white/5 text-red-100/70'
                }`}
              >
                <Flame className={`h-3.5 w-3.5 ${day.active ? 'text-amber-300' : 'text-red-100/40'}`} />
                {day.label.slice(0, 2)}
              </motion.span>
            ))}
            <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[11px] font-black">
              <Flame className="h-3.5 w-3.5 text-amber-300" />
              <CountUp value={streak} /> day{streak === 1 ? '' : 's'}
            </span>
          </div>

          <button
            onClick={() => navigate(targetPath)}
            className="interactive-lift mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-red-700 shadow-[0_10px_24px_rgba(0,0,0,0.18)] transition hover:bg-red-50"
          >
            Continue preparing
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex shrink-0 items-center justify-center">
          <ProgressRing
            value={progress}
            size={132}
            stroke={11}
            from="#FFFFFF"
            to="#FECACA"
            trackColor="rgba(255,255,255,0.18)"
          >
            <div className="text-center">
              <p className="text-2xl font-black leading-none">
                <CountUp value={progress} suffix="%" />
              </p>
              <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-red-100">Overall</p>
            </div>
          </ProgressRing>
        </div>
      </div>
    </motion.section>
  )
}
