import UiText from '@/components/common/UiText'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Award, Bell, CheckCheck, ChevronRight, Flame, Sparkles, X } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { fetchBadges, type SkillBadgeRecord } from '@/lib/profileApi'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import type { DashboardOverview } from '@/types/platform'
import './notifications.css'

const TRACK_LABELS: Record<string, string> = {
  IELTS_LISTENING: 'Listening',
  IELTS_READING: 'Reading',
  IELTS_WRITING: 'Writing',
  IELTS_SPEAKING: 'Speaking',
  SAT_MATH: 'SAT Math',
  SAT_ENGLISH: 'SAT English',
}

type NotificationItem = {
  id: string
  type: string
  title: string
  message: string
  metadata: Record<string, unknown> | null
  readAt: string | null
  createdAt: string
}

function relativeTime(value: string) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000))
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
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
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const panelRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

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
    apiClient
      .get<{ notifications: NotificationItem[] }>('/dashboard/notifications', { auth: true })
      .then((payload) => {
        if (!cancelled) setNotifications(payload.notifications ?? [])
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
      const target = event.target as Node
      if (!panelRef.current?.contains(target) && !dialogRef.current?.contains(target)) setOpen(false)
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
  const unreadCount = notifications.filter((notification) => !notification.readAt).length

  const markAllRead = async () => {
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, readAt: notification.readAt ?? new Date().toISOString() })),
    )
    await apiClient.patch('/dashboard/notifications/read-all', {}, { auth: true }).catch(() => {})
  }

  const markRead = async (notificationId: string) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? { ...notification, readAt: notification.readAt ?? new Date().toISOString() }
          : notification,
      ),
    )
    await apiClient.patch(`/dashboard/notifications/${notificationId}/read`, {}, { auth: true }).catch(() => {})
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((value) => !value)}
        aria-label="Notifications"
        aria-expanded={open}
        className="interactive-lift relative rounded-xl border border-slate-200 bg-white/90 p-2 text-slate-700 transition hover:bg-red-50 hover:text-red-700"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 || (streak > 0 && !todayActive) ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
          </span>
        ) : null}
      </button>

      {typeof document !== 'undefined' ? createPortal(<AnimatePresence>
        {open ? (
          <>
            <motion.button
              type="button"
              aria-label="Close notifications"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[110] cursor-default bg-slate-950/10 backdrop-blur-[1px]"
            />
            <motion.div
              ref={dialogRef}
              initial={minimalMotion ? { opacity: 0 } : { opacity: 0, x: 14, y: -6, scale: 0.975 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={minimalMotion ? { opacity: 0 } : { opacity: 0, x: 10, y: -4, scale: 0.98 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              role="dialog"
              aria-modal="true"
              aria-label="Notifications panel"
              className="profai-notifications-panel fixed bottom-4 left-4 right-4 top-[4.75rem] z-[120] flex min-h-0 flex-col overflow-hidden rounded-[1.8rem] sm:left-auto sm:w-[27rem]"
            >
            <div className="flex shrink-0 items-center justify-between gap-3 px-5 pb-3 pt-5">
              <div>
                <p className="text-2xl font-black tracking-tight text-slate-950"> <UiText text={"Notifications"} /> </p>
                <p className="text-xs font-semibold text-slate-500">{unreadCount ? `${unreadCount} unread` : 'You are all caught up'}</p>
              </div>
              <div className="flex items-center gap-1">
              {unreadCount ? (
                <button
                  onClick={() => void markAllRead()}
                  className="profai-notifications-action inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-50"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              ) : null}
              <button
                onClick={() => setOpen(false)}
                aria-label="Close notifications"
                className="rounded-full p-2 text-slate-500 transition hover:bg-white hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </button>
              </div>
            </div>

            <div className="no-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 pb-5">
              {/* Streak card */}
              <div className="profai-streak-card relative overflow-hidden rounded-[1.5rem] p-4 text-white">
                <span className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/15 blur-2xl" />
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-white" />
                  <p className="text-sm font-black">
                    {streak > 0 ? `${streak}-day streak` : 'Start your streak today'}
                  </p>
                </div>
                <p className="mt-1 text-[12px] leading-5 text-white/90">
                  {streak > 0 && !todayActive
                    ? 'Practice today to keep it alive!'
                    : streak > 0
                      ? 'Today is done — see you tomorrow.'
                      : 'One session a day builds the habit.'}
                </p>
                {week.length > 0 ? (
                  <div className="mt-3 grid grid-cols-7 gap-1.5" aria-label="This week's activity">
                    {week.slice(-7).map((day) => (
                      <span
                        key={day.date}
                        className={`flex aspect-square min-w-0 flex-col items-center justify-center rounded-xl border text-[8px] font-bold uppercase ${
                          day.active ? 'border-white/60 bg-white/25 text-white shadow-[0_0_14px_rgba(255,255,255,.3)]' : 'border-white/20 bg-white/10 text-white/65'
                        }`}
                      >
                        <Flame className={`h-3.5 w-3.5 ${day.active ? 'text-white' : 'text-white/50'}`} />
                        {day.label.slice(0, 2)}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              {notifications.length > 0 ? (
                <div>
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Latest updates</p>
                  <div className="space-y-2">
                    {notifications.slice(0, 5).map((notification) => (
                      <button
                        key={notification.id}
                        onClick={() => void markRead(notification.id)}
                        className={`profai-notification-row relative flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                          notification.readAt
                            ? 'border-white/80 bg-white/50'
                            : 'border-red-100 bg-white/75'
                        }`}
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white bg-red-50 text-red-600 shadow-[0_6px_14px_rgba(190,35,52,.12)]">
                          <Bell className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-black text-slate-900">{notification.title}</span>
                          <span className="mt-0.5 line-clamp-2 block text-[11px] leading-4 text-slate-500">{notification.message}</span>
                          <span className="mt-1 block text-[9px] font-bold uppercase tracking-wide text-slate-400">{relativeTime(notification.createdAt)}</span>
                        </span>
                        {!notification.readAt ? <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-red-500" /> : null}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

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
                        className="profai-notification-row flex w-full items-center gap-3 rounded-2xl border border-white bg-white/65 px-3 py-3 text-left transition hover:border-red-200 hover:bg-white"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-[0_6px_14px_rgba(245,158,11,0.3)]">
                          <Award className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-bold text-slate-900">
                            {TRACK_LABELS[badge.track] ?? badge.track} · Tier {badge.tier}
                          </span>
                          <span className="block text-[11px] text-slate-500">
                             <UiText text={"Band"} /> {badge.band.toFixed(1)} ·{' '}
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
                className="profai-notification-row flex w-full items-center gap-3 rounded-2xl border border-white bg-white/65 px-3 py-3 text-left transition hover:border-red-200 hover:bg-white"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-700 text-white">
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
          </>
        ) : null}
      </AnimatePresence>, document.body) : null}
    </div>
  )
}
