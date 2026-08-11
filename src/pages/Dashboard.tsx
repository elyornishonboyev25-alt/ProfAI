import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock3,
  Flame,
  GraduationCap,
  Headphones,
  Medal,
  Mic2,
  PenSquare,
  Settings,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import NotificationsBell from '@/components/layout/NotificationsBell'
import { Skeleton } from '@/components/common/Skeleton'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { apiClient } from '@/lib/apiClient'
import { useAuthStore, type AuthState } from '@/store/authStore'
import type { DashboardOverview } from '@/types/platform'
import { loadOnboardingProfile } from '@/utils/weeklyPlanner'

const EMPTY_OVERVIEW: DashboardOverview = {
  metrics: { totalTests: 0, averageScore: 0, currentRank: null, currentStreak: 0 },
  weeklyProgress: [
    { date: '', label: 'Mon', testsCompleted: 0, questionsAnswered: 0, active: false },
    { date: '', label: 'Tue', testsCompleted: 0, questionsAnswered: 0, active: false },
    { date: '', label: 'Wed', testsCompleted: 0, questionsAnswered: 0, active: false },
    { date: '', label: 'Thu', testsCompleted: 0, questionsAnswered: 0, active: false },
    { date: '', label: 'Fri', testsCompleted: 0, questionsAnswered: 0, active: false },
    { date: '', label: 'Sat', testsCompleted: 0, questionsAnswered: 0, active: false },
    { date: '', label: 'Sun', testsCompleted: 0, questionsAnswered: 0, active: false },
  ],
  recommendedTests: [],
  activityTimeline: [],
  miniLeaderboard: [],
}

const learningCards = [
  { title: 'IELTS Reading', subtitle: 'Precision & timing', path: '/ielts/reading', icon: BookOpen, progress: 68 },
  { title: 'Speaking Practice', subtitle: 'Fluency session', path: '/ielts/speaking', icon: Mic2, progress: 45 },
  { title: 'SAT Full Mock', subtitle: 'Official simulation', path: '/sat', icon: CheckCircle2, progress: 20 },
  { title: 'Advanced Vocabulary', subtitle: 'Daily word set', path: '/vocabulary/ielts', icon: Sparkles, progress: 80 },
  { title: 'Study Abroad Academy', subtitle: 'Lessons & universities', path: '/admission', icon: GraduationCap, progress: 27 },
] as const

function StatCard({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string
  value: string
  note: string
  icon: typeof Clock3
}) {
  return (
    <article className="apple-glass-card group rounded-[1.35rem] p-4 transition hover:-translate-y-1 hover:border-red-200 hover:shadow-[0_22px_48px_rgba(220,38,38,0.14)]">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600">
        <Icon className="h-4.5 w-4.5" />
      </span>
      <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-black tracking-tight text-slate-950">{value}</p>
      <p className="mt-1 text-[11px] font-semibold text-slate-500">{note}</p>
    </article>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((state: AuthState) => state.user)
  const { minimalMotion } = useMotionPreferences()
  const profile = loadOnboardingProfile(user?.id)
  const firstName = (profile?.firstName || user?.fullName || 'Learner').split(' ')[0]

  const { data, loading } = useAsyncData<DashboardOverview>(
    async () => {
      try {
        return await apiClient.get('/dashboard/overview', { auth: Boolean(user) })
      } catch {
        return EMPTY_OVERVIEW
      }
    },
    [user?.id],
  )

  const overview = data ?? EMPTY_OVERVIEW
  const targetExam = profile?.targetExam ?? 'IELTS'
  const ieltsCurrent = profile?.currentIeltsScore ?? (Math.max(4.5, Math.min(8.5, Number((overview.metrics.averageScore / 100 * 9).toFixed(1)))) || 6.5)
  const satCurrent = profile?.currentSatScore ?? 1050
  const examTargets = [
    ...(targetExam !== 'SAT'
      ? [{ label: 'IELTS' as const, current: ieltsCurrent, target: profile?.targetIeltsScore ?? 7.5 }]
      : []),
    ...(targetExam !== 'IELTS'
      ? [{ label: 'SAT' as const, current: satCurrent, target: profile?.targetSatScore ?? 1450 }]
      : []),
  ]
  const targetProgress = Math.max(
    8,
    Math.min(100, Math.round(examTargets.reduce((sum, exam) => sum + exam.current / exam.target, 0) / examTargets.length * 100)),
  )

  const chartData = useMemo(
    () =>
      overview.weeklyProgress.map((day) => ({
        ...day,
        activity: Math.max(day.testsCompleted * 12, Math.min(40, day.questionsAnswered)),
      })),
    [overview.weeklyProgress],
  )

  const weeklyHours = useMemo(
    () => (chartData.reduce((total, day) => total + day.activity, 0) / 10).toFixed(1),
    [chartData],
  )

  const leaderboard = overview.miniLeaderboard.length
    ? overview.miniLeaderboard.slice(0, 5)
    : [
        { rank: 1, fullName: firstName, totalXp: user?.xp ?? 0, accuracy: 0, rankTrend: 'same' as const, isCurrentUser: true },
        { rank: 2, fullName: 'Amina', totalXp: 1280, accuracy: 91, rankTrend: 'up' as const, isCurrentUser: false },
        { rank: 3, fullName: 'Daniel', totalXp: 1140, accuracy: 88, rankTrend: 'same' as const, isCurrentUser: false },
      ]

  return (
    <div className="workspace-page premium-page-stage relative min-h-screen overflow-hidden px-4 py-5 sm:px-6 lg:px-8 lg:py-7">

      <div className="relative mx-auto max-w-[94rem]">
        <motion.header
          initial={minimalMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-40 flex flex-wrap items-center justify-between gap-4 rounded-[1.8rem] border border-white/80 bg-white/78 px-5 py-4 shadow-[0_18px_55px_rgba(51,65,85,0.09)] sm:px-6"
        >
          <div className="flex min-w-0 items-center gap-3.5">
            <div className="relative h-14 w-14 shrink-0 rounded-full bg-gradient-to-br from-red-500 via-rose-500 to-red-700 p-[4px] shadow-[0_10px_28px_rgba(220,38,38,0.3)]">
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white text-sm font-black text-red-700">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="profile-avatar-media" />
                ) : (
                  (user?.fullName || 'PL').slice(0, 2).toUpperCase()
                )}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-[3px] border-white bg-emerald-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.15em] text-red-500">Your learning cockpit</p>
              <h1 className="truncate text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                Welcome back, {firstName} <span aria-hidden>👋</span>
              </h1>
              <p className="mt-0.5 text-xs font-medium text-slate-500">One focused session today keeps your momentum moving.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden rounded-xl border border-red-100 bg-white/75 px-3 py-2 text-xs font-black text-red-700 sm:inline-flex">
              <Flame className="mr-1.5 h-4 w-4" />
              {overview.metrics.currentStreak || user?.currentStreak || 0} day streak
            </span>
            <NotificationsBell />
            <button
              type="button"
              onClick={() => navigate('/account')}
              aria-label="Profile settings"
              className="rounded-xl border border-white bg-white/80 p-2 text-slate-600 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </motion.header>

        <section className="mt-5 grid gap-5 xl:grid-cols-[19rem_minmax(0,1fr)_20rem]">
          <motion.article
            initial={minimalMotion ? false : { opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            className="target-glass-card relative overflow-hidden rounded-[1.8rem] p-5 text-white"
          >
            <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/20 blur-2xl" />
            <p className="relative text-[10px] font-black uppercase tracking-[0.17em] text-red-100">Your target</p>
            <div className="relative mt-2 flex flex-wrap gap-2">
              {examTargets.map((exam) => (
                <span key={exam.label} className="inline-flex items-center rounded-full border border-white/25 bg-white/14 px-3 py-1 text-sm font-black shadow-inner backdrop-blur-md">
                  {exam.label} <span className="ml-1.5 text-red-100">{exam.target}</span>
                </span>
              ))}
            </div>
            <div className="relative mx-auto mt-5 flex h-40 w-40 items-center justify-center rounded-full bg-white/10">
              <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden>
                <circle cx="50" cy="50" r="41" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="8" />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="41"
                  fill="none"
                  stroke="#fff"
                  strokeLinecap="round"
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 41}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 41 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 41 * (1 - targetProgress / 100) }}
                  transition={{ duration: minimalMotion ? 0.1 : 1.1, ease: 'easeOut' }}
                />
              </svg>
              <div className="relative text-center">
                <p className="text-4xl font-black">{targetProgress}%</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-red-100">on track</p>
              </div>
            </div>
            <div className={`relative mt-5 grid gap-2 ${examTargets.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {examTargets.map((exam) => (
                <div key={`current-${exam.label}`} className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs backdrop-blur-md">
                  <span className="block text-[9px] font-black uppercase tracking-wider text-red-100">{exam.label} current</span>
                  <strong className="mt-0.5 block text-base">{exam.current}</strong>
                </div>
              ))}
            </div>
            <button onClick={() => navigate(targetExam === 'SAT' ? '/sat' : targetExam === 'IELTS' ? '/ielts' : '/tests')} className="relative mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-red-700 shadow-lg transition hover:-translate-y-0.5">
              Continue preparing <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </motion.article>

          <div className="min-w-0 space-y-5">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard label="Study hours" value={`${weeklyHours}h`} note="This week" icon={Clock3} />
              <StatCard label="Tests done" value={String(overview.metrics.totalTests)} note="All-time attempts" icon={CheckCircle2} />
              <StatCard label="Average" value={`${overview.metrics.averageScore.toFixed(0)}%`} note="Across practice" icon={BarChart3} />
              <StatCard label="Current rank" value={overview.metrics.currentRank ? `#${overview.metrics.currentRank}` : '—'} note="Global board" icon={Trophy} />
            </div>

            <article className="apple-glass-card rounded-[1.8rem] p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-red-500">Weekly activity</p>
                  <h2 className="mt-1 text-lg font-black text-slate-950">Your study rhythm</h2>
                </div>
                <button onClick={() => navigate('/profile')} className="inline-flex items-center gap-1 text-xs font-black text-red-600 hover:text-red-700">
                  Full performance <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-3 h-52">
                {loading ? (
                  <Skeleton className="h-full w-full rounded-2xl" />
                ) : (
                  <ResponsiveContainer>
                    <BarChart data={chartData} margin={{ top: 8, right: 2, left: -24, bottom: 0 }}>
                      <defs>
                        <linearGradient id="dashboardBars" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ef4444" />
                          <stop offset="100%" stopColor="#fda4af" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 4" />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <Tooltip contentStyle={{ border: '1px solid #fecaca', borderRadius: 14, fontSize: 12 }} cursor={{ fill: 'rgba(248,113,113,.08)' }} />
                      <Bar dataKey="activity" fill="url(#dashboardBars)" radius={[9, 9, 3, 3]} maxBarSize={42} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </article>
          </div>

          <div className="space-y-5">
            <article className="apple-glass-card rounded-[1.8rem] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-red-500">Leaderboard</p>
                  <h2 className="mt-1 text-lg font-black text-slate-950">Top learners</h2>
                </div>
                <Medal className="h-5 w-5 text-amber-500" />
              </div>
              <div className="mt-4 space-y-2">
                {leaderboard.map((row) => (
                  <button
                    key={`${row.rank}-${row.fullName}`}
                    onClick={() => navigate('/leaderboard')}
                    className={`flex w-full items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition ${
                      row.isCurrentUser ? 'border-red-200 bg-red-50/80' : 'border-slate-100 bg-white/65 hover:border-red-100'
                    }`}
                  >
                    <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-black ${row.rank === 1 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                      {row.rank}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-black text-slate-800">{row.fullName}</span>
                      <span className="block text-[10px] font-semibold text-slate-400">{row.totalXp.toLocaleString('en-US')} XP</span>
                    </span>
                    {row.isCurrentUser ? <span className="text-[9px] font-black uppercase text-red-600">You</span> : null}
                  </button>
                ))}
              </div>
              <button onClick={() => navigate('/leaderboard')} className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-xl border border-slate-100 bg-white/75 py-2 text-[11px] font-black text-slate-600 hover:border-red-200 hover:text-red-700">
                View leaderboard <ArrowRight className="h-3 w-3" />
              </button>
            </article>

            <article className="apple-glass-card rounded-[1.8rem] p-5">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600"><Award className="h-4 w-4" /></span>
                <div>
                  <p className="text-sm font-black text-slate-900">Next achievement</p>
                  <p className="text-[10px] font-semibold text-slate-500">Complete 3 practice sessions</p>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <motion.div initial={{ width: 0 }} animate={{ width: '66%' }} className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500" />
              </div>
              <p className="mt-2 text-right text-[10px] font-bold text-slate-400">2 / 3 complete</p>
            </article>
          </div>
        </section>

        <motion.section
          initial={minimalMotion ? false : { opacity: 0, y: 26, scale: 0.992 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: 0.68, ease: [0.16, 1, 0.3, 1] }}
          className="apple-glass-card mt-5 rounded-[1.8rem] p-5"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-red-500">Continue learning</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">Pick up where you left off</h2>
            </div>
            <button onClick={() => navigate('/tests')} className="inline-flex items-center gap-1 text-xs font-black text-red-600">
              Test Library <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {learningCards.map((card) => {
              const Icon = card.icon
              return (
                <button key={card.title} onClick={() => navigate(card.path)} className="glass-tile group rounded-2xl p-4 text-left transition hover:-translate-y-1 hover:border-red-200 hover:shadow-[0_18px_36px_rgba(220,38,38,0.13)]">
                  <div className="flex items-start justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600"><Icon className="h-4 w-4" /></span>
                    <span className="text-[10px] font-black text-red-600">{card.progress}%</span>
                  </div>
                  <h3 className="mt-3 text-sm font-black text-slate-900">{card.title}</h3>
                  <p className="mt-0.5 text-[11px] font-medium text-slate-500">{card.subtitle}</p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-gradient-to-r from-red-700 via-red-500 to-rose-300" style={{ width: `${card.progress}%` }} />
                  </div>
                  <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-black text-slate-700 transition group-hover:text-red-700">
                    Continue <ArrowRight className="h-3 w-3" />
                  </span>
                </button>
              )
            })}
          </div>
        </motion.section>
      </div>
    </div>
  )
}
