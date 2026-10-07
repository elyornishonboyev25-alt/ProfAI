import UiText from '@/components/common/UiText'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { Award, Bell, CheckCheck, ChevronRight, ClipboardCheck, Flame, Loader2, MessageSquareText, RefreshCw, Sparkles, X } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { fetchBadges, type SkillBadgeRecord } from '@/lib/profileApi'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import type { DashboardOverview } from '@/types/platform'
import './notifications.css'
import { ownerText } from '@/i18n/owner'
import { premiumLanguage } from '@/i18n/premium'
import { classText } from '@/features/learningCenter/messages'

const TRACK_LABELS: Record<string, string> = {
  IELTS_LISTENING: 'Listening',
  IELTS_READING: 'Reading',
  IELTS_WRITING: 'Writing',
  IELTS_SPEAKING: 'Speaking',
  IELTS_OVERALL: 'IELTS Full Mock',
  SAT_MATH: 'SAT Math',
  SAT_ENGLISH: 'SAT English',
  SAT_OVERALL: 'SAT Full Mock',
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

function relativeTime(value: string, language: string) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000))
  if (!Number.isFinite(minutes)) return ''
  const formatter = new Intl.RelativeTimeFormat(language, { numeric: 'auto', style: 'short' })
  if (minutes < 1) return formatter.format(0, 'second')
  if (minutes < 60) return formatter.format(-minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (hours < 24) return formatter.format(-hours, 'hour')
  return formatter.format(-Math.round(hours / 24), 'day')
}

/** Bell button and notification panel with class assignments and activity. */
export default function NotificationsBell() {
  const { i18n } = useTranslation()
  const language = premiumLanguage(i18n.resolvedLanguage ?? i18n.language ?? 'en')
  const supportLabel = ownerText('Support team', language)
  const textFor = (text: Parameters<typeof classText>[0]) => classText(text, language)
  const navigate = useNavigate()
  const user = useAuthStore((state: AuthState) => state.user)
  const userId = user?.id
  const { minimalMotion } = useMotionPreferences()
  const [open, setOpen] = useState(false)
  const [week, setWeek] = useState<DashboardOverview['weeklyProgress']>([])
  const [badges, setBadges] = useState<SkillBadgeRecord[]>([])
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [expandedReply, setExpandedReply] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [readError, setReadError] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const revision = useRef(0)
  const readingIds = useRef(new Set<string>())
  const bellRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  const streak = Math.max(0, user?.currentStreak ?? 0)

  useEffect(() => {
    if (!open || !userId) return
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
  }, [open, userId])

  useEffect(() => {
    setNotifications([]); setUnreadCount(0); setWeek([]); setBadges([])
    setLoaded(false); setLoadError(false); setReadError(false); setExpandedReply(null); setOpen(false)
    setMarkingAll(false); readingIds.current.clear(); revision.current++
  }, [userId])

  useEffect(() => {
    if (!userId) return
    let active = true
    let inFlight = false
    const refresh = () => {
      if (inFlight || document.visibilityState === 'hidden') return
      inFlight = true
      const requestedRevision = revision.current
      void apiClient.get<{ notifications: NotificationItem[]; unreadCount?: number }>('/dashboard/notifications', { auth: true })
        .then((payload) => {
          if (!active || requestedRevision !== revision.current) return
          const items = payload.notifications ?? []
          setNotifications(items)
          setUnreadCount(payload.unreadCount ?? items.filter(item => !item.readAt).length)
          setLoaded(true); setLoadError(false)
        })
        .catch(() => { if (active) setLoadError(true) })
        .finally(() => { inFlight = false })
    }
    refresh()
    const timer = window.setInterval(refresh, 20_000)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => { active = false; window.clearInterval(timer); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh) }
  }, [userId, open, refreshKey])

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return
    const previousFocus = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusTimer = window.setTimeout(() => dialogRef.current?.focus(), 0)
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node
      if (!panelRef.current?.contains(target) && !dialogRef.current?.contains(target)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
      if (event.key === 'Tab') {
        const items = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], [tabindex="0"]') ?? [])
        const first = items[0], last = items[items.length - 1]
        if (!first) { event.preventDefault(); return }
        if (event.shiftKey && (document.activeElement === first || !dialogRef.current?.contains(document.activeElement))) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current?.contains(document.activeElement))) { event.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
      window.clearTimeout(focusTimer)
      document.body.style.overflow = previousOverflow
      if (bellRef.current?.isConnected) bellRef.current.focus()
      else if (previousFocus?.isConnected) previousFocus.focus()
    }
  }, [open])

  if (!user) return null

  const todayActive = week.length > 0 ? week[week.length - 1]?.active : false
  const markAllRead = async () => {
    if (markingAll) return
    setMarkingAll(true); setReadError(false)
    const itemsAtStart = new Set(notifications.map(item => item.id))
    try {
      await apiClient.patch('/dashboard/notifications/read-all', {}, { auth: true })
      if (useAuthStore.getState().user?.id !== userId) return
      revision.current++
      setNotifications(current => current.map(item => itemsAtStart.has(item.id) ? { ...item, readAt: item.readAt ?? new Date().toISOString() } : item))
      setRefreshKey(value => value + 1)
    } catch { if (useAuthStore.getState().user?.id === userId) setReadError(true) }
    finally { if (useAuthStore.getState().user?.id === userId) setMarkingAll(false) }
  }

  const markRead = async (notificationId: string) => {
    if (notifications.find(item => item.id === notificationId)?.readAt || readingIds.current.has(notificationId)) return
    readingIds.current.add(notificationId); setReadError(false)
    try {
      await apiClient.patch(`/dashboard/notifications/${encodeURIComponent(notificationId)}/read`, {}, { auth: true })
      if (useAuthStore.getState().user?.id !== userId) return
      revision.current++
      setNotifications(current => current.map(item => item.id === notificationId ? { ...item, readAt: item.readAt ?? new Date().toISOString() } : item))
      setUnreadCount(count => Math.max(0, count - 1))
    } catch { if (useAuthStore.getState().user?.id === userId) setReadError(true) }
    finally { readingIds.current.delete(notificationId) }
  }

  const openNotification = (notification: NotificationItem) => {
    void markRead(notification.id)
    if (notification.metadata?.kind === 'ISSUE_REPORT_REPLY' || notification.metadata?.kind === 'TEACHER_NOTE') {
      setExpandedReply(current => current === notification.id ? null : notification.id)
    }
    const slug = notification.metadata?.centerSlug
    if (notification.metadata?.kind === 'CLASS_ASSIGNMENT' && typeof slug === 'string') {
      setOpen(false)
      navigate(`/learning-center/${encodeURIComponent(slug)}/assignments`)
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        ref={bellRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Notifications"
        title={unreadCount > 0 ? `${unreadCount} unread notifications` : 'No unread notifications'}
        aria-expanded={open}
        className="profai-notifications-bell interactive-lift relative rounded-xl border border-slate-200 bg-white/90 p-2 text-slate-700 transition hover:bg-red-50 hover:text-red-700"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="profai-notifications-count" aria-live="polite">{unreadCount > 99 ? '99+' : unreadCount}</span>
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
              transition={{ duration: minimalMotion ? 0 : 0.2 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[110] cursor-default bg-slate-950/10 backdrop-blur-[1px]"
            />
            <motion.div
              ref={dialogRef}
              initial={minimalMotion ? { opacity: 0 } : { opacity: 0, x: 14, y: -6, scale: 0.975 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={minimalMotion ? { opacity: 0 } : { opacity: 0, x: 10, y: -4, scale: 0.98 }}
              transition={{ duration: minimalMotion ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
              role="dialog"
              aria-modal="true"
              aria-label="Notifications panel"
              tabIndex={-1}
              className="profai-notifications-panel fixed bottom-4 left-4 right-4 top-[4.75rem] z-[120] flex min-h-0 flex-col overflow-hidden rounded-[1.8rem] sm:left-auto sm:w-[27rem]"
            >
            <div className="profai-notifications-header flex shrink-0 flex-wrap items-center justify-between gap-3 px-5 pb-4 pt-5">
              <div>
                <p className="mb-1 text-[9px] font-bold uppercase tracking-[.2em] text-red-700">{textFor('Student inbox')}</p>
                <h2 className="text-2xl font-black tracking-tight text-slate-950">{textFor('Notifications')}</h2>
                <p className="mt-1 text-xs font-semibold text-slate-600">{unreadCount ? `${unreadCount} ${language === 'uz' ? 'o‘qilmagan' : language === 'ru' ? 'непрочитанных' : 'unread'}` : textFor('You are all caught up')}</p>
              </div>
              <div className="flex items-center gap-1">
              {unreadCount ? (
                <button
                  disabled={markingAll}
                  onClick={() => void markAllRead()}
                  className="profai-notifications-action inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-50"
                >
                  {markingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
                  {textFor('Mark all read')}
                </button>
              ) : null}
              <button
                onClick={() => setOpen(false)}
                aria-label="Close notifications"
                className="profai-notifications-close rounded-full p-2 text-slate-500 transition hover:bg-white hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </button>
              </div>
            </div>

            <div className="no-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 pb-5">
              {loadError && <div role="alert" className="profai-notifications-error"><p>{textFor('Notifications could not be refreshed.')}</p><button type="button" onClick={() => setRefreshKey(value => value + 1)} className="mt-2 inline-flex min-h-9 items-center gap-2 font-bold"><RefreshCw className="h-3.5 w-3.5" />{textFor('Try again')}</button></div>}
              {readError && <p role="alert" className="profai-notifications-error">{textFor('Could not mark notifications as read. Please try again.')}</p>}
              {!loaded && !loadError && <p role="status" className="flex items-center gap-2 py-4 text-xs font-semibold text-slate-600"><Loader2 className="h-4 w-4 animate-spin" />{textFor('Loading notifications…')}</p>}
              {notifications.length > 0 ? (
                <div>
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">{textFor('Latest updates')}</p>
                  <div className="space-y-2">
                    {notifications.map((notification) => (
                      <button
                        key={notification.id}
                        aria-expanded={['ISSUE_REPORT_REPLY', 'TEACHER_NOTE'].includes(String(notification.metadata?.kind)) ? expandedReply === notification.id : undefined}
                        onClick={() => void openNotification(notification)}
                        className={`profai-notification-row relative flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                          notification.readAt
                            ? 'border-white/80 bg-white/50'
                            : 'profai-notification-unread border-red-100 bg-white/75'
                        }`}
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white bg-red-50 text-red-600 shadow-[0_6px_14px_rgba(190,35,52,.12)]">
                          {notification.metadata?.kind === 'CLASS_ASSIGNMENT' ? <ClipboardCheck className="h-4 w-4" /> : ['ISSUE_REPORT_REPLY', 'TEACHER_NOTE'].includes(String(notification.metadata?.kind)) ? <MessageSquareText className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          {notification.metadata?.kind === 'ISSUE_REPORT_REPLY' && <span className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-red-700">{supportLabel}</span>}
                          {notification.metadata?.kind === 'TEACHER_NOTE' && <span className="mb-1 block text-[10px] font-bold text-red-700">{textFor('Teacher note')}{typeof notification.metadata.authorName === 'string' ? ` · ${notification.metadata.authorName}` : ''}</span>}
                          {notification.metadata?.kind === 'CLASS_ASSIGNMENT' && <span className="mb-1 block text-[10px] font-bold text-red-700">{textFor('Class assignment')}{typeof notification.metadata.examTrack === 'string' ? ` · ${notification.metadata.examTrack}` : ''}</span>}
                          <span className={`block text-[13px] font-black text-slate-900 ${expandedReply === notification.id ? 'break-words' : 'truncate'}`}>{notification.title}</span>
                          <span className={`mt-0.5 text-[11px] leading-5 text-slate-600 ${expandedReply === notification.id ? 'block whitespace-pre-wrap break-words' : 'line-clamp-2'}`}>{notification.message}</span>
                          <span className="mt-1 block text-[10px] font-semibold text-slate-500">{relativeTime(notification.createdAt, language)}</span>
                          {notification.metadata?.kind === 'ISSUE_REPORT_REPLY' && <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-red-700">{ownerText(expandedReply === notification.id ? 'Collapse message' : 'Read full message', language)}<ChevronRight className={`h-3 w-3 ${expandedReply === notification.id ? '-rotate-90' : 'rotate-90'}`} /></span>}
                          {notification.metadata?.kind === 'TEACHER_NOTE' && <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-red-700">{textFor(expandedReply === notification.id ? 'Collapse message' : 'Read full message')}<ChevronRight className={`h-3 w-3 ${expandedReply === notification.id ? '-rotate-90' : 'rotate-90'}`} /></span>}
                          {notification.metadata?.kind === 'CLASS_ASSIGNMENT' && <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-red-700">{textFor('Open assignment')}<ChevronRight className="h-3 w-3" /></span>}
                        </span>
                        {!notification.readAt ? <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-red-500" /> : null}
                      </button>
                    ))}
                  </div>
                </div>
              ) : loaded && <div className="profai-notifications-empty rounded-2xl p-5 text-center"><Bell className="mx-auto h-6 w-6 text-slate-500" /><p className="mt-3 text-sm font-bold text-slate-800">{textFor('No updates yet')}</p><p className="mt-1 text-xs leading-5 text-slate-600">{textFor('Teacher notes and assignments will appear here.')}</p></div>}

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
                  navigate('/ielts/tests#mocks')
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
