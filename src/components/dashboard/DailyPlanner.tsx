import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { createPortal } from 'react-dom'
import { Bell, CalendarClock, CheckCircle2, Clock3, Plus, X } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { useAuthStore, type AuthState } from '@/store/authStore'
import type { PlannerTask } from '@/types/platform'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'

type PlannerApiResponse = {
  tasks: PlannerTask[]
}

type PlannerCreateResponse = {
  task: PlannerTask
}

type PlannerUpdateResponse = {
  task: PlannerTask
}

type TaskStatus = 'upcoming' | 'completed' | 'missed'

const NOTIFICATION_REQUEST_KEY = 'daily_planner_notifications_requested'

function formatInputDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatInputTime(date: Date) {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

function resolveTaskStatus(task: PlannerTask, now: number): TaskStatus {
  if (task.completed) return 'completed'
  const scheduled = new Date(task.scheduledAt).getTime()
  if (now > scheduled) return 'missed'
  return 'upcoming'
}

function statusBadgeClass(status: TaskStatus) {
  if (status === 'completed') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }
  if (status === 'missed') {
    return 'border-slate-300 bg-slate-100 text-slate-700'
  }
  return 'border-blue-200 bg-blue-50 text-blue-700'
}

function statusLabel(status: TaskStatus) {
  if (status === 'completed') return 'Completed'
  if (status === 'missed') return 'Missed'
  return 'Upcoming'
}

export default function DailyPlanner() {
  const { allowHoverMotion } = useMotionPreferences()
  const user = useAuthStore((state: AuthState) => state.user)
  const notificationTimersRef = useRef<number[]>([])

  const [tasks, setTasks] = useState<PlannerTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openModal, setOpenModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null)
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('unsupported')

  const defaultDate = useMemo(() => {
    const nextSlot = new Date()
    nextSlot.setMinutes(nextSlot.getMinutes() + 30)
    return {
      date: formatInputDate(nextSlot),
      time: formatInputTime(nextSlot),
    }
  }, [])

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(defaultDate.date)
  const [time, setTime] = useState(defaultDate.time)

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((left, right) => {
      const leftTime = new Date(left.scheduledAt).getTime()
      const rightTime = new Date(right.scheduledAt).getTime()
      return leftTime - rightTime
    })
  }, [tasks])

  const requestNotificationPermission = useCallback(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported')
      return
    }

    setPermission(Notification.permission)

    const wasRequested = window.localStorage.getItem(NOTIFICATION_REQUEST_KEY) === '1'
    if (Notification.permission === 'default' && !wasRequested) {
      window.localStorage.setItem(NOTIFICATION_REQUEST_KEY, '1')
      void Notification.requestPermission().then((nextPermission) => {
        setPermission(nextPermission)
      })
    }
  }, [])

  const fetchTasks = useCallback(async () => {
    if (!user) {
      setTasks([])
      setLoading(false)
      setError('Sign in required to use Daily Planner.')
      return
    }

    try {
      setError(null)
      const payload = await apiClient.get<PlannerApiResponse>('/planner/tasks', { auth: true })
      setTasks(payload.tasks)
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load planner tasks.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    void fetchTasks()
  }, [fetchTasks])

  useEffect(() => {
    if (!user) return
    const intervalId = window.setInterval(() => {
      void fetchTasks()
    }, 15000)

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void fetchTasks()
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [fetchTasks, user])

  useEffect(() => {
    if (!user) return
    requestNotificationPermission()
  }, [requestNotificationPermission, user])

  useEffect(() => {
    if (!openModal || typeof document === 'undefined') return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [openModal])

  useEffect(() => {
    if (!openModal || typeof window === 'undefined') return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenModal(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [openModal])

  useEffect(() => {
    notificationTimersRef.current.forEach((timerId) => window.clearTimeout(timerId))
    notificationTimersRef.current = []

    if (!user || permission !== 'granted' || typeof window === 'undefined' || !('Notification' in window)) {
      return
    }

    const now = Date.now()
    sortedTasks.forEach((task) => {
      if (task.completed) return

      const scheduledAt = new Date(task.scheduledAt).getTime()
      const delay = scheduledAt - now
      if (delay <= 0 || delay > 2_147_000_000) return

      const timerId = window.setTimeout(() => {
        if (document.visibilityState !== 'visible') return
        new Notification('Scheduled Task Reminder', {
          body: task.title,
        })
      }, delay)

      notificationTimersRef.current.push(timerId)
    })

    return () => {
      notificationTimersRef.current.forEach((timerId) => window.clearTimeout(timerId))
      notificationTimersRef.current = []
    }
  }, [permission, sortedTasks, user])

  const createTask = async () => {
    if (!user || !title.trim()) return
    const scheduledDate = new Date(`${date}T${time}:00`)
    if (Number.isNaN(scheduledDate.getTime())) {
      setError('Invalid date/time selected.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const payload = await apiClient.post<PlannerCreateResponse>(
        '/planner/tasks',
        {
          title: title.trim(),
          description: description.trim() || null,
          scheduledAt: scheduledDate.toISOString(),
        },
        { auth: true },
      )
      setTasks((previous) => [...previous, payload.task])
      setTitle('')
      setDescription('')
      const nextSlot = new Date()
      nextSlot.setMinutes(nextSlot.getMinutes() + 30)
      setDate(formatInputDate(nextSlot))
      setTime(formatInputTime(nextSlot))
      setOpenModal(false)
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create task.')
    } finally {
      setSubmitting(false)
    }
  }

  const markCompleted = async (taskId: string) => {
    if (!user) return
    setUpdatingTaskId(taskId)
    setError(null)

    try {
      const payload = await apiClient.patch<PlannerUpdateResponse>(
        `/planner/tasks/${taskId}`,
        { completed: true },
        { auth: true },
      )
      setTasks((previous) =>
        previous.map((task) => (task.id === taskId ? payload.task : task)),
      )
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Failed to update task.')
    } finally {
      setUpdatingTaskId(null)
    }
  }

  const permissionLabel =
    permission === 'granted'
      ? 'Notifications enabled'
      : permission === 'denied'
        ? 'Notifications blocked'
        : permission === 'default'
          ? 'Notifications pending'
          : 'Notifications unavailable'

  const taskModal = openModal ? (
    <div
      className="fixed inset-0 z-[240] overflow-y-auto bg-slate-900/45 px-4 py-6 sm:py-10"
      onClick={() => setOpenModal(false)}
    >
      <div className="flex min-h-full items-start justify-center sm:items-center">
        <div
          className="w-full max-w-md rounded-3xl border border-blue-100 bg-white/95 p-5 shadow-[0_30px_72px_rgba(15,23,42,0.24)] backdrop-blur-xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Create Task</h3>
            <button
              type="button"
              onClick={() => setOpenModal(false)}
              className="rounded-lg border border-blue-100 bg-white p-1.5 text-slate-500 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            <label className="block">
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-blue-600">Task title</p>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Enter task title"
                className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <label className="block">
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-blue-600">Description (optional)</p>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Optional details"
                rows={3}
                className="w-full resize-none rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-blue-600">Date</p>
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block">
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-blue-600">Time</p>
                <input
                  type="time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1 text-xs text-slate-500">
              <CalendarClock className="h-3.5 w-3.5" />
              <Clock3 className="h-3.5 w-3.5" />
              Planner reminder uses active-tab notifications.
            </div>
            <button
              type="button"
              onClick={() => void createTask()}
              disabled={submitting || !title.trim()}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(37,99,235,0.28)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Creating...' : 'Add Task'}
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null

  return (
    <section className="panel-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Daily Planner</h2>
          <p className="mt-1 text-sm text-slate-600">Time-based tasks with reminder notifications while this tab is open.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            <Bell className="h-3.5 w-3.5" />
            {permissionLabel}
          </span>
          <button
            type="button"
            onClick={() => setOpenModal(true)}
            className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(37,99,235,0.28)]"
          >
            <Plus className="h-4 w-4" />
            Add Task
          </button>
        </div>
      </div>

      {error ? (
        <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
          {error}
        </div>
      ) : null}

      <div className="mt-4 space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-blue-100 bg-white/80 px-4 py-6 text-sm text-slate-500">
            Loading planner tasks...
          </div>
        ) : sortedTasks.length === 0 ? (
          <div className="rounded-2xl border border-blue-100 bg-white/80 px-4 py-6 text-sm text-slate-500">
            No tasks yet. Create your first plan.
          </div>
        ) : (
          sortedTasks.map((task) => {
            const now = Date.now()
            const status = resolveTaskStatus(task, now)
            const scheduled = new Date(task.scheduledAt)
            const timeLabel = scheduled.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })
            const dateLabel = scheduled.toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
            })

            return (
              <motion.article
                key={task.id}
                whileHover={allowHoverMotion ? { y: -2 } : undefined}
                className={`rounded-2xl border p-4 shadow-[0_12px_24px_rgba(15,23,42,0.08)] ${
                  status === 'upcoming'
                    ? 'border-blue-200 bg-gradient-to-r from-white to-blue-50/70'
                    : status === 'completed'
                      ? 'border-emerald-200 bg-emerald-50/45'
                      : 'border-slate-300 bg-slate-100/70'
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl border border-blue-100 bg-white/90 px-3 py-2 text-center">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-600">{dateLabel}</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">{timeLabel}</p>
                    </div>
                    <div>
                      <p className="text-base font-semibold text-slate-900">{task.title}</p>
                      {task.description ? (
                        <p className="mt-1 text-sm text-slate-600">{task.description}</p>
                      ) : null}
                      <span className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(status)}`}>
                        {statusLabel(status)}
                      </span>
                    </div>
                  </div>
                  {!task.completed ? (
                    <button
                      type="button"
                      onClick={() => void markCompleted(task.id)}
                      disabled={updatingTaskId === task.id}
                      className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {updatingTaskId === task.id ? 'Saving...' : 'Mark as Completed'}
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" />
                      Completed
                    </span>
                  )}
                </div>
              </motion.article>
            )
          })
        )}
      </div>

      {typeof document !== 'undefined' && taskModal ? createPortal(taskModal, document.body) : taskModal}
    </section>
  )
}
