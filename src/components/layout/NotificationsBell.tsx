import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Award, Bell, ChevronRight, Flame, Sparkles, X } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { fetchBadges, type SkillBadgeRecord } from '@/lib/profileApi'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import type { DashboardOverview } from '@/types/platform'

const TRACK_LABELS: Record<string, string> = {
  IELTS_LISTENING: 'Listening',
  IELTS_READING: 'Reading',
  IELTS_WRITING: 'Writing',
  IELTS_SPEAKING: 'Speaking',
  SAT_MATH: 'SAT Math',
  SAT_ENGLISH: 'SAT English',
}

/**
 * Bell button + slide-in notifications panel (concept: 31-Notifications-Streak).
 * Pulls the streak week from the existing dashboard overview endpoint and the
 * learner's latest badges — no new backend. Fails silent on any fetch error.
 */
export default function NotificationsBell() {
  const navigate = useNavigate()
  const user = useAuthStore((state: AuthState) => state.user)
  const { minimalMotion } = useMotionPreferences()
  const [open, setOpen] = useState(false)
  const [week, setWeek] = useState<DashboardOverview['weeklyProgress']>([])
  const [badges, setBadges] = useState<SkillBadgeRecord[]>([])
  const panelRef = useRef<HTMLDivElement>(null)

  const streak = Math.max(0, user?.currentStreak ?? 0)

  useEffect(() => {
    if (!open || !user) return
    let cancelled = false
    apiClient
      .get<DashboardOverview>('/dashboard/overview', { auth: true })
      .then((overview) => {
        if (!cancelled) setWeek(overview.weeklyProgress ?? [])
      })
      .catch(() => {})
    fetchBadges()
      .then((list) => {
        if (cancelled) return
        const sorted = [...list].sort(
          (a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime(),
        )
        setBadges(sorted.slice(0, 3))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [open, user])

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!user) return null

  const todayActive = week.length > 0 ? week[week.length - 1]?.active : false

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((value) => !value)}
        aria-label="Notifications"
        aria-expanded={open}
        className="interactive-lift relative rounded-xl border border-red-200 bg-white/90 p-2 text-slate-700 transition hover:bg-red-50 hover:text-red-700"
      >
        <Bell className="h-4 w-4" />
        {streak > 0 && !todayActive ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
          </span>
        ) : null}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={minimalMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={minimalMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed right-4 top-20 z-[120] w-[min(23rem,calc(100vw-2rem))] overflow-hidden rounded-[1.5rem] border border-red-100 bg-white/98 shadow-[0_32px_80px_rgba(15,23,42,0.25)] backdrop-blur-xl"
          >
            <div className="flex items-center justify-between border-b border-red-50 px-4 py-3">
              <p className="text-sm font-black tracking-tight text-slate-900">Notifications</p>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close notifications"
                className="rounded-lg p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[26rem] space-y-3 overflow-y-auto p-4">
              {/* Streak card */}
              <div className="rounded-2xl bg-gradient-to-br from-[#DC2626] to-[#B91C1C] p-4 text-white">
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-amber-300" />
                  <p className="text-sm font-black">
                    {streak > 0 ? `${streak}-day streak` : 'Start your streak today'}
                  </p>
                </div>
                <p className="mt-1 text-[12px] leading-5 text-red-100">
                  {streak > 0 && !todayActive
                    ? 'Practice today to keep it alive!'
                    : streak > 0
                      ? 'Today is done — see you tomorrow.'
                      : 'One session a day builds the habit.'}
                </p>
                {week.length > 0 ? (
                  <div className="mt-3 flex items-center gap-1.5" aria-label="This week's activity">
                    {week.slice(-7).map((day) => (
                      <span
                        key={day.date}
                        className={`flex h-8 w-8 flex-col items-center justify-center rounded-lg border text-[8px] font-bold uppercase ${
                          day.active ? 'border-white/40 bg-white/20 text-white' : 'border-white/15 bg-white/5 text-red-100/60'
                        }`}
                      >
                        <Flame className={`h-3 w-3 ${day.active ? 'text-amber-300' : 'text-red-100/40'}`} />
                        {day.label.slice(0, 2)}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Latest badges */}
              {badges.length > 0 ? (
                <div>
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                    Latest achievements
                  </p>
                  <div className="space-y-2">
                    {badges.map((badge) => (
                      <button
                        key={badge.id}
                        onClick={() => {
                          setOpen(false)
                          navigate('/account')
                        }}
                        className="flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5 text-left transition hover:border-red-200 hover:bg-red-50/40"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-[0_6px_14px_rgba(245,158,11,0.3)]">
                          <Award className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-bold text-slate-900">
                            {TRACK_LABELS[badge.track] ?? badge.track} · Tier {badge.tier}
                          </span>
                          <span className="block text-[11px] text-slate-500">
                            Band {badge.band.toFixed(1)} ·{' '}
                            {new Date(badge.unlockedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Suggestion */}
              <button
                onClick={() => {
                  setOpen(false)
                  navigate('/mock/ielts')
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-red-100 bg-gradient-to-r from-red-50/80 to-rose-50/50 px-3 py-2.5 text-left transition hover:border-red-200"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white">
                  <Sparkles className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-bold text-slate-900">Full Mock is waiting</span>
                  <span className="block text-[11px] text-slate-500">Run all four sections in official order</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
