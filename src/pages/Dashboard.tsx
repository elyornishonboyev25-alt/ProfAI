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
  Medal,
  Mic2,
  Settings,
  Sparkles,
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
import { mergeLocalDashboardPerformance } from '@/utils/localProfilePerformance'
import { loadOnboardingProfile } from '@/utils/weeklyPlanner'

const emptyWeek = Array.from({ length: 7 }, (_, index) => {
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() - (6 - index))
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return {
    date: `${year}-${month}-${day}`,
    label: date.toLocaleDateString('en-US', { weekday: 'short' }),
    testsCompleted: 0,
    questionsAnswered: 0,
    studyTimeSec: 0,
    active: false,
  }
})

const EMPTY_OVERVIEW: DashboardOverview = {
  metrics: { totalTests: 0, averageScore: 0, weeklyStudySeconds: 0, currentRank: null, currentStreak: 0 },
  weeklyProgress: emptyWeek,
  recommendedTests: [],
  activityTimeline: [],
  miniLeaderboard: [],
}

const learningCards = [
  { title: 'IELTS Mock', subtitle: 'Full exam simulation', path: '/mock/ielts', icon: BookOpen, progress: 68 },
  { title: 'SAT Mock', subtitle: 'Official-style practice', path: '/sat', icon: CheckCircle2, progress: 45 },
  { title: 'Admission Hub', subtitle: 'Explore top universities', path: '/admission/universities', icon: GraduationCap, progress: 27 },
  { title: 'Speaking Practice', subtitle: 'Build confidence', path: '/speaking-community', icon: Mic2, progress: 52 },
  { title: 'Vocabulary', subtitle: 'Daily word set', path: '/vocabulary', icon: Sparkles, progress: 80 },
] as const

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

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
    <article className="dashboard-stat-card group">
      <span className="dashboard-stat-icon"><Icon className="h-[18px] w-[18px]" /></span>
      <p className="mt-4 text-[13px] font-semibold text-slate-600">{label}</p>
      <p className="mt-1 text-[1.65rem] font-black leading-none tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">{note}</p>
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

  const baseOverview = data ?? EMPTY_OVERVIEW
  const overview = useMemo(
    () => (user ? mergeLocalDashboardPerformance(baseOverview, user.id) : baseOverview),
    [baseOverview, user],
  )
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
    () => overview.weeklyProgress.map((day) => ({ ...day, activity: Number(((day.studyTimeSec ?? 0) / 3600).toFixed(2)) })),
    [overview.weeklyProgress],
  )
  const weeklyHours = overview.metrics.weeklyStudySeconds / 3600
  const weeklyHoursLabel = weeklyHours > 0 && weeklyHours < 0.1 ? '<0.1h' : `${weeklyHours.toFixed(1)}h`
  const leaderboard = overview.miniLeaderboard.length
    ? overview.miniLeaderboard.slice(0, 3)
    : [
        { rank: 1, fullName: firstName, totalXp: user?.xp ?? 2436, accuracy: 0, rankTrend: 'same' as const, isCurrentUser: true },
        { rank: 2, fullName: 'Amina', totalXp: 1430, accuracy: 91, rankTrend: 'up' as const, isCurrentUser: false },
        { rank: 3, fullName: 'Daniel', totalXp: 1379, accuracy: 88, rankTrend: 'same' as const, isCurrentUser: false },
      ]
  const podium = [leaderboard[1], leaderboard[0], leaderboard[2]].filter(Boolean)

  return (
    <div className="workspace-page profai-dashboard relative min-h-screen px-3 pb-24 pt-3 sm:px-5 sm:pt-5 lg:px-5 lg:pb-5">
      <div className="dashboard-main-shell mx-auto max-w-[98rem]">
        <motion.header
          initial={minimalMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between gap-4 px-1 pb-5"
        >
          <div className="flex min-w-0 items-center gap-4">
            <div className="dashboard-avatar-ring">
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-red-50 to-slate-100 text-sm font-black text-red-700">
                {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="profile-avatar-media" /> : initials(user?.fullName || 'ProfAI Learner')}
              </div>
              <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-[3px] border-white bg-emerald-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-500">Your learning dashboard</p>
              <h1 className="truncate text-2xl font-black tracking-[-0.04em] text-[#101222] sm:text-4xl">
                Welcome back, {firstName} <span aria-hidden>👋</span>
              </h1>
              <p className="mt-1 text-xs font-medium text-slate-500">Small steps today. Big results tomorrow.</p>
            </div>
            <span className="dashboard-streak hidden sm:inline-flex" title="Current streak">
              <Flame className="h-5 w-5 fill-current" />
              <strong>{overview.metrics.currentStreak || user?.currentStreak || 0}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <NotificationsBell />
            <button type="button" onClick={() => navigate('/account')} aria-label="Profile settings" className="dashboard-icon-button">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </motion.header>

        <section className="grid gap-4 xl:grid-cols-[17.5rem_minmax(30rem,1fr)_18rem]">
          <motion.article
            initial={minimalMotion ? false : { opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            className="dashboard-target-card"
          >
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/70">Your target</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {examTargets.map((exam) => (
                  <span key={exam.label} className="rounded-full border border-white/25 bg-white/15 px-3 py-1 text-sm font-black shadow-inner">
                    {exam.label} <span className="text-white/75">{exam.target}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="dashboard-progress-orbit">
              <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
                <circle cx="50" cy="50" r="41" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="8" />
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
                <p className="text-4xl font-black tracking-[-0.05em]">{targetProgress}%</p>
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/70">on track</p>
              </div>
            </div>

            <div className={`relative z-10 mt-5 grid gap-2 ${examTargets.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {examTargets.map((exam) => (
                <div key={exam.label} className="rounded-xl border border-white/15 bg-white/10 px-3 py-2">
                  <span className="block text-[9px] font-black uppercase tracking-wider text-white/65">{exam.label} current</span>
                  <strong className="mt-0.5 block text-base">{exam.current}</strong>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => navigate(targetExam === 'SAT' ? '/sat' : '/mock/ielts')}
              className="relative z-10 mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-red-700 shadow-lg transition hover:-translate-y-0.5"
            >
              Continue preparing <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </motion.article>

          <div className="min-w-0 space-y-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard label="Study hours" value={weeklyHoursLabel} note="This week" icon={Clock3} />
              <StatCard label="Mocks completed" value={String(overview.metrics.totalTests)} note="All attempts" icon={CheckCircle2} />
              <StatCard label="Average score" value={`${overview.metrics.averageScore.toFixed(0)}%`} note="All practice" icon={BarChart3} />
              <StatCard label="Current rank" value={overview.metrics.currentRank ? `#${overview.metrics.currentRank}` : '—'} note="Global board" icon={Trophy} />
            </div>

            <article className="dashboard-glass-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.17em] text-red-500">Weekly activity</p>
                  <h2 className="mt-1 text-lg font-black text-slate-950">Your study rhythm</h2>
                </div>
                <button type="button" onClick={() => navigate('/profile')} className="inline-flex items-center gap-1 text-xs font-black text-red-600 hover:text-red-800">
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
                          <stop offset="0%" stopColor="#8f303e" />
                          <stop offset="52%" stopColor="#d94350" />
                          <stop offset="100%" stopColor="#fb7185" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="#e8dfe1" strokeDasharray="4 4" />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <Tooltip contentStyle={{ border: '1px solid #fecdd3', borderRadius: 14, fontSize: 12 }} cursor={{ fill: 'rgba(244,63,94,.05)' }} />
                      <Bar dataKey="activity" fill="url(#dashboardBars)" radius={[10, 10, 3, 3]} maxBarSize={42} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </article>
          </div>

          <div className="space-y-4">
            <article className="dashboard-glass-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.17em] text-red-500">Leaderboard</p>
                  <h2 className="mt-1 text-lg font-black text-slate-950">Top learners</h2>
                </div>
                <Medal className="h-6 w-6 text-amber-500" />
              </div>

              <div className="mt-5 flex items-end justify-center gap-2">
                {podium.map((row, index) => {
                  const place = index === 1 ? 1 : index === 0 ? 2 : 3
                  return (
                    <div key={`${row.rank}-${row.fullName}`} className={place === 1 ? 'order-2 text-center' : place === 2 ? 'order-1 text-center' : 'order-3 text-center'}>
                      <div className={`dashboard-podium-avatar dashboard-podium-${place}`}>{initials(row.fullName)}</div>
                      <p className="mt-2 text-[11px] font-black text-slate-800">{place}{place === 1 ? 'st' : place === 2 ? 'nd' : 'rd'}</p>
                    </div>
                  )
                })}
              </div>

              <div className="mt-5 divide-y divide-slate-200/75">
                {leaderboard.map((row) => (
                  <button key={`${row.rank}-${row.fullName}`} type="button" onClick={() => navigate('/leaderboard')} className="flex w-full items-center gap-2.5 py-2.5 text-left">
                    <span className="w-4 text-center text-xs font-black text-slate-400">{row.rank}</span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-slate-200 text-[9px] font-black text-slate-700">{initials(row.fullName)}</span>
                    <span className="min-w-0 flex-1 truncate text-xs font-bold text-slate-800">{row.fullName}</span>
                    <span className="text-[10px] font-black text-slate-500">{row.totalXp.toLocaleString('en-US')}</span>
                  </button>
                ))}
              </div>
            </article>

            <article className="dashboard-glass-card p-5">
              <div className="flex items-center gap-3">
                <span className="dashboard-medal-icon"><Award className="h-5 w-5" /></span>
                <div>
                  <p className="text-sm font-black text-slate-900">Next achievement</p>
                  <p className="text-[10px] font-semibold text-slate-500">Complete 3 practice sessions</p>
                </div>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200/75">
                <motion.div initial={{ width: 0 }} animate={{ width: '66%' }} className="h-full rounded-full bg-gradient-to-r from-red-800 via-red-500 to-rose-300" />
              </div>
              <p className="mt-2 text-right text-[10px] font-bold text-slate-400">2 / 3 complete</p>
            </article>
          </div>
        </section>

        <motion.section
          initial={minimalMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.12 }}
          className="dashboard-glass-card mt-4 p-5"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.17em] text-red-500">Continue learning</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">Pick up where you left off</h2>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {learningCards.map((card) => {
              const Icon = card.icon
              return (
                <button key={card.title} type="button" onClick={() => navigate(card.path)} className="dashboard-learning-card group">
                  <div className="flex items-start justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600"><Icon className="h-4 w-4" /></span>
                    <span className="text-[10px] font-black text-red-600">{card.progress}%</span>
                  </div>
                  <h3 className="mt-3 text-sm font-black text-slate-900">{card.title}</h3>
                  <p className="mt-0.5 text-[11px] font-medium text-slate-500">{card.subtitle}</p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200/75">
                    <div className="h-full rounded-full bg-gradient-to-r from-red-900 via-red-500 to-rose-300" style={{ width: `${card.progress}%` }} />
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
