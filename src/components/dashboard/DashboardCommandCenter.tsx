import { type ComponentType, type ReactNode } from 'react'
import {
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  Clock3,
  FileCheck2,
  Flame,
  Mic2,
  PenSquare,
  Settings,
  Sparkles,
  Target,
  Trophy,
  TrendingUp,
  Users,
} from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { DashboardOverview } from '@/types/platform'

type IconType = ComponentType<{ className?: string }>

type DashboardCommandCenterProps = {
  data: DashboardOverview | null
  loading: boolean
  error: string | null
  displayName: string
  level: number
  xp: number
  onNavigate: (path: string) => void
  onRetry: () => void
}

const courses = [
  { title: 'IELTS Writing Task 2', meta: 'AI Writing Studio', progress: 60, icon: PenSquare, path: '/ielts/writing' },
  { title: 'Speaking Practice', meta: 'Fluency & pronunciation', progress: 45, icon: Mic2, path: '/ielts/speaking' },
  { title: 'Advanced Vocabulary', meta: 'High-frequency academic words', progress: 80, icon: BookOpen, path: '/vocabulary' },
] as const

function GlassCard({
  className = '',
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return <div className={`profai-glass-panel rounded-[1.75rem] ${className}`}>{children}</div>
}

function MetricCard({
  icon: Icon,
  label,
  value,
  trend,
}: {
  icon: IconType
  label: string
  value: string
  trend?: string
}) {
  return (
    <GlassCard className="min-h-[132px] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-2xl border border-red-100 bg-white/65 text-red-600 shadow-[0_10px_22px_rgba(220,38,38,0.1)]">
          <Icon className="h-5 w-5" />
        </span>
        {trend ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-600">
            <TrendingUp className="h-3 w-3" />
            {trend}
          </span>
        ) : null}
      </div>
      <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-black tracking-[-0.055em] text-slate-950">{value}</p>
    </GlassCard>
  )
}

function TargetRing({ currentBand }: { currentBand: number }) {
  const goal = 7.5
  const progress = Math.min(100, Math.max(8, (currentBand / goal) * 100))
  const degrees = progress * 3.6

  return (
    <div className="relative mx-auto grid h-56 w-56 place-items-center">
      <div
        className="absolute inset-0 rounded-full p-[15px] shadow-[0_28px_52px_rgba(127,29,29,0.28),inset_0_2px_4px_rgba(255,255,255,0.75)]"
        style={{
          background: `conic-gradient(from 210deg, #7f1d1d 0deg, #ef4444 ${degrees}deg, rgba(255,255,255,.28) ${degrees}deg 360deg)`,
        }}
      >
        <div className="h-full w-full rounded-full border border-white/65 bg-[radial-gradient(circle_at_35%_28%,rgba(255,255,255,.54),rgba(127,29,29,.18)_42%,rgba(127,29,29,.42))] shadow-[inset_0_4px_12px_rgba(255,255,255,.45)]" />
      </div>
      <div className="relative text-center text-white">
        <p className="text-6xl font-black tracking-[-0.075em]">{Math.round(progress)}%</p>
        <p className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-red-100">Target progress</p>
      </div>
    </div>
  )
}

export default function DashboardCommandCenter({
  data,
  loading,
  error,
  displayName,
  level,
  xp,
  onNavigate,
  onRetry,
}: DashboardCommandCenterProps) {
  const metrics = data?.metrics
  const currentBand = Math.max(0, Math.min(9, ((metrics?.averageScore ?? 0) / 100) * 9))
  const targetDisplay = currentBand > 0 ? currentBand.toFixed(1) : '—'

  return (
    <section className="relative">
      <div className="pointer-events-none absolute -left-20 top-12 h-72 w-72 rounded-full bg-cyan-100/55 blur-[100px]" />
      <div className="pointer-events-none absolute -right-20 -top-16 h-80 w-80 rounded-full bg-red-200/55 blur-[110px]" />

      <GlassCard className="relative overflow-hidden p-4 sm:p-6 lg:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-60 w-60 rounded-full bg-red-500/16 blur-3xl" />

        <header className="relative flex flex-col gap-5 border-b border-white/75 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative grid h-16 w-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-red-400 via-red-600 to-red-900 p-[4px] shadow-[0_16px_32px_rgba(220,38,38,0.32)]">
              <div className="grid h-full w-full place-items-center rounded-full border border-white/70 bg-white text-xl font-black text-slate-900">
                {displayName.slice(0, 2).toUpperCase()}
              </div>
              <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-red-600 text-[11px] font-black text-white">
                {level}
              </span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-black tracking-[-0.045em] text-slate-950 sm:text-4xl">
                  Welcome back, {displayName} <span aria-hidden="true">👋</span>
                </h1>
                <span className="grid h-11 w-11 place-items-center rounded-2xl border border-red-100 bg-white/60 text-red-600 shadow-[0_12px_26px_rgba(220,38,38,0.12)]">
                  <Flame className="h-6 w-6 fill-red-500/25" />
                </span>
              </div>
              <p className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500">
                Your study cockpit is ready
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span className="text-red-600">{xp.toLocaleString('en-US')} XP</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('/account')}
              aria-label="Notifications"
              className="grid h-12 w-12 place-items-center rounded-full border border-white/80 bg-white/60 text-slate-700 shadow-[0_12px_28px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 hover:text-red-600"
            >
              <Bell className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/account')}
              aria-label="Settings"
              className="grid h-12 w-12 place-items-center rounded-full border border-white/80 bg-white/60 text-slate-700 shadow-[0_12px_28px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 hover:text-red-600"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </header>

        {error ? (
          <div className="relative mt-6 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-sm font-semibold text-red-700">
            {error}
            <button type="button" onClick={onRetry} className="ml-3 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-black text-white">
              Retry
            </button>
          </div>
        ) : null}

        <div className="relative mt-6 grid gap-5 xl:grid-cols-[0.92fr_1.8fr_0.95fr]">
          <div className="profai-glossy-button flex min-h-[420px] flex-col rounded-[2rem] p-5 sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-red-100">Your goal</p>
                <h2 className="mt-1 text-2xl font-black text-white">IELTS 7.5</h2>
              </div>
              <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/30 bg-white/15">
                <Target className="h-5 w-5" />
              </span>
            </div>
            <div className="flex flex-1 items-center justify-center py-6">
              <TargetRing currentBand={currentBand} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/20 bg-white/12 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-red-100">Current band</p>
                <p className="mt-1 text-2xl font-black">{targetDisplay}</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('/mock/ielts')}
                className="rounded-2xl border border-white/35 bg-white/90 p-3 text-left text-red-700 shadow-[inset_0_1px_0_rgba(255,255,255,.9)]"
              >
                <p className="text-[10px] font-bold uppercase tracking-wider">Next step</p>
                <p className="mt-1 inline-flex items-center gap-1 text-sm font-black">
                  Take a mock <ArrowRight className="h-3.5 w-3.5" />
                </p>
              </button>
            </div>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <MetricCard icon={Clock3} label="Study streak" value={`${metrics?.currentStreak ?? 0} days`} />
              <MetricCard icon={FileCheck2} label="Mocks completed" value={`${metrics?.totalTests ?? 0}`} />
              <MetricCard icon={BarChart3} label="Average score" value={metrics ? `${metrics.averageScore.toFixed(1)}%` : '—'} trend="+4.8%" />
              <MetricCard icon={Trophy} label="Current rank" value={metrics?.currentRank ? `#${metrics.currentRank}` : '—'} />
            </div>

            <GlassCard className="min-h-[270px] p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-lg font-black tracking-tight text-slate-950">Weekly activity</p>
                  <p className="text-[11px] font-semibold text-slate-500">Tests completed during the last 7 days</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-3 py-1 text-[10px] font-black text-red-700">
                  <Sparkles className="h-3 w-3" />
                  Live
                </span>
              </div>
              <div className="h-[205px]">
                {loading ? (
                  <div className="h-full animate-pulse rounded-2xl bg-white/55" />
                ) : (
                  <ResponsiveContainer>
                    <BarChart data={data?.weeklyProgress ?? []} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                      <defs>
                        <linearGradient id="dashboard-v2-bar" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#7f1d1d" />
                          <stop offset="55%" stopColor="#ef4444" />
                          <stop offset="100%" stopColor="#fca5a5" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="rgba(148,163,184,.18)" />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                      <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <Tooltip
                        cursor={{ fill: 'rgba(220,38,38,.05)' }}
                        contentStyle={{ borderRadius: 16, border: '1px solid rgba(254,202,202,.9)', boxShadow: '0 18px 40px rgba(15,23,42,.12)' }}
                      />
                      <Bar dataKey="testsCompleted" fill="url(#dashboard-v2-bar)" radius={[10, 10, 4, 4]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </GlassCard>
          </div>

          <GlassCard className="min-h-[420px] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-black tracking-tight text-slate-950">Leaderboard</p>
                <p className="text-[11px] font-semibold text-slate-500">Top learners this week</p>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-50 text-amber-500">
                <Trophy className="h-5 w-5" />
              </span>
            </div>

            <div className="mt-5 flex items-end justify-center gap-3">
              {[1, 0, 2].map((index, position) => {
                const row = data?.miniLeaderboard[index]
                const rank = position === 1 ? 1 : position === 0 ? 2 : 3
                return (
                  <div key={`${row?.fullName ?? 'learner'}-${rank}`} className={`text-center ${rank === 1 ? '-translate-y-3' : ''}`}>
                    <div
                      className={`mx-auto grid place-items-center rounded-full p-[3px] ${
                        rank === 1
                          ? 'h-16 w-16 bg-gradient-to-br from-amber-200 via-amber-500 to-amber-700'
                          : rank === 2
                            ? 'h-14 w-14 bg-gradient-to-br from-slate-200 to-slate-500'
                            : 'h-14 w-14 bg-gradient-to-br from-orange-200 to-orange-700'
                      }`}
                    >
                      <div className="grid h-full w-full place-items-center rounded-full bg-white text-sm font-black text-slate-800">
                        {(row?.fullName ?? `#${rank}`).slice(0, 2).toUpperCase()}
                      </div>
                    </div>
                    <p className="mt-2 text-xs font-black text-slate-900">{rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd'}</p>
                  </div>
                )
              })}
            </div>

            <div className="mt-6 space-y-2">
              {(data?.miniLeaderboard ?? []).slice(0, 5).map((row) => (
                <div
                  key={`${row.rank}-${row.fullName}`}
                  className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 ${
                    row.isCurrentUser ? 'border-red-200 bg-red-50/70' : 'border-white/80 bg-white/46'
                  }`}
                >
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-white text-xs font-black text-slate-600 shadow-sm">#{row.rank}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-black text-slate-900">{row.fullName}</p>
                    <p className="text-[10px] font-semibold text-slate-500">{row.totalXp} XP</p>
                  </div>
                </div>
              ))}
              {!loading && !(data?.miniLeaderboard.length ?? 0) ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white/40 p-5 text-center">
                  <Users className="mx-auto h-5 w-5 text-slate-400" />
                  <p className="mt-2 text-xs font-bold text-slate-500">Complete a test to enter the leaderboard.</p>
                </div>
              ) : null}
            </div>
          </GlassCard>
        </div>

        <div className="relative mt-6">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-[-0.035em] text-slate-950">Continue learning</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">Pick up exactly where you stopped.</p>
            </div>
            <button type="button" onClick={() => onNavigate('/tests')} className="hidden text-xs font-black text-red-600 hover:text-red-700 sm:inline-flex">
              View all courses
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {courses.map((course) => {
              const Icon = course.icon
              return (
                <GlassCard key={course.title} className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl border border-red-100 bg-red-50/80 text-red-600">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-black text-slate-900">{course.progress}%</span>
                  </div>
                  <h3 className="mt-4 text-base font-black tracking-tight text-slate-950">{course.title}</h3>
                  <p className="mt-1 text-[11px] font-semibold text-slate-500">{course.meta}</p>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/75">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-red-900 via-red-500 to-rose-400"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate(course.path)}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/72 px-4 py-2 text-xs font-black text-slate-800 shadow-[0_8px_18px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 hover:text-red-700"
                  >
                    Continue <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </GlassCard>
              )
            })}
          </div>
        </div>
      </GlassCard>
    </section>
  )
}
