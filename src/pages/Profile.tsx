import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Activity,
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  Award,
  BrainCircuit,
  CheckCircle2,
  Flame,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { apiClient } from '@/lib/apiClient'
import { useAsyncData } from '@/hooks/useAsyncData'
import type { AuthUser, ProfileOverview } from '@/types/platform'
import { Skeleton } from '@/components/common/Skeleton'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { AnimatedBar, CountUp, ProgressRing, Reveal, Stagger, StaggerItem, Tilt3D, XPGem } from '@/components/fx'

function CompactSkeletonCard() {
  return <Skeleton className="h-28 w-full rounded-2xl" />
}

const guestProfilePreview: ProfileOverview = {
  profile: {
    id: 'guest-preview',
    fullName: 'Guest Learner',
    email: 'preview@profai.app',
    level: 1,
    xp: 0,
    currentStreak: 0,
    longestStreak: 0,
    memberSince: new Date().toISOString(),
  },
  stats: {
    totalAttempts: 0,
    averageScore: 0,
    averageAccuracy: 0,
    totalXpFromAttempts: 0,
  },
  levelProgress: {
    currentLevelThreshold: 0,
    nextLevelThreshold: 200,
    xpIntoCurrent: 0,
    levelSpan: 200,
    progressPercent: 0,
  },
  competitive: {
    rank: 0,
    previousRank: 0,
    rankDelta: 0,
    rankTrend: 'same',
    division: 'BRONZE',
    divisionLabel: 'Bronze',
    rankScore: 0,
    uniqueTests: 0,
    validatedAttempts: 0,
    discardedAttempts: 0,
    integrityScore: 100,
    breakdown: {
      accuracy: 0,
      speedEfficiency: 0,
      consistencyScore: 0,
      engagementScore: 0,
      inactivityDays: 0,
      inactivityPenalty: 0,
      activityDecay: 0,
      difficultyMultiplier: 1,
      normalizedDifficulty: 0,
      improvementDelta: 0,
      validatedAttempts: 0,
      discardedAttempts: 0,
      integrityScore: 100,
      rankScore: 0,
    },
  },
  skillAnalytics: {
    overall: {
      skillPower: 0,
      percentile: 0,
      projectedSatScore: 0,
      projectedPercentScore: 0,
      growthRate: 0,
      totalUsers: 0,
    },
    radar: [
      { category: 'IELTS', label: 'Reading', attempts: 0, accuracy: 0, speed: 0, consistency: 0, skillPower: 0 },
      { category: 'IELTS', label: 'Listening', attempts: 0, accuracy: 0, speed: 0, consistency: 0, skillPower: 0 },
      { category: 'IELTS', label: 'Writing', attempts: 0, accuracy: 0, speed: 0, consistency: 0, skillPower: 0 },
      { category: 'IELTS', label: 'Speaking', attempts: 0, accuracy: 0, speed: 0, consistency: 0, skillPower: 0 },
      { category: 'SAT', label: 'SAT Math', attempts: 0, accuracy: 0, speed: 0, consistency: 0, skillPower: 0 },
      { category: 'SAT', label: 'SAT R/W', attempts: 0, accuracy: 0, speed: 0, consistency: 0, skillPower: 0 },
    ],
    trackBreakdown: [
      { key: 'IELTS_READING', label: 'IELTS Reading', group: 'IELTS', attempts: 0, accuracy: 0, speed: 0, consistency: 0, skillPower: 0 },
      { key: 'IELTS_LISTENING', label: 'IELTS Listening', group: 'IELTS', attempts: 0, accuracy: 0, speed: 0, consistency: 0, skillPower: 0 },
      { key: 'IELTS_WRITING', label: 'IELTS Writing', group: 'IELTS', attempts: 0, accuracy: 0, speed: 0, consistency: 0, skillPower: 0 },
      { key: 'IELTS_SPEAKING', label: 'IELTS Speaking', group: 'IELTS', attempts: 0, accuracy: 0, speed: 0, consistency: 0, skillPower: 0 },
      { key: 'SAT_MATH', label: 'SAT Math', group: 'SAT', attempts: 0, accuracy: 0, speed: 0, consistency: 0, skillPower: 0 },
      { key: 'SAT_READING_WRITING', label: 'SAT Reading/Writing', group: 'SAT', attempts: 0, accuracy: 0, speed: 0, consistency: 0, skillPower: 0 },
    ],
    distribution: {
      mean: 0,
      standardDeviation: 0,
      userSkillPower: 0,
      curve: [],
    },
    xpMomentum: [
      { label: 'W1', xp: 0, score: 0, accuracy: 0 },
      { label: 'W2', xp: 0, score: 0, accuracy: 0 },
      { label: 'W3', xp: 0, score: 0, accuracy: 0 },
      { label: 'W4', xp: 0, score: 0, accuracy: 0 },
    ],
    insights: [
      {
        id: 'guest-tip-register',
        type: 'tip',
        title: 'Sign up to unlock analytics',
        message: 'Create an account to start tracking real XP, accuracy, and ranking on this dashboard.',
      },
    ],
  },
  weeklyActivity: [
    { date: '2026-04-11', label: 'Sat', testsCompleted: 0, questionsAnswered: 0, xpEarned: 0, active: false },
    { date: '2026-04-12', label: 'Sun', testsCompleted: 0, questionsAnswered: 0, xpEarned: 0, active: false },
    { date: '2026-04-13', label: 'Mon', testsCompleted: 0, questionsAnswered: 0, xpEarned: 0, active: false },
    { date: '2026-04-14', label: 'Tue', testsCompleted: 0, questionsAnswered: 0, xpEarned: 0, active: false },
    { date: '2026-04-15', label: 'Wed', testsCompleted: 0, questionsAnswered: 0, xpEarned: 0, active: false },
    { date: '2026-04-16', label: 'Thu', testsCompleted: 0, questionsAnswered: 0, xpEarned: 0, active: false },
    { date: '2026-04-17', label: 'Fri', testsCompleted: 0, questionsAnswered: 0, xpEarned: 0, active: false },
  ],
  achievements: [],
  recentAttempts: [],
}

// When the live /profile/overview call is unavailable (e.g. it's Premium-gated
// or the user simply has no attempts yet), fall back to a complete overview
// built from the signed-in user so the page always renders — real XP, level and
// streak up top, with zeroed analytics that show friendly empty states.
function buildProfileFallback(user: AuthUser | null): ProfileOverview {
  if (!user) return guestProfilePreview
  const xp = Math.max(0, user.xp ?? 0)
  const level = Math.max(1, user.level ?? 1)
  const span = 200
  const intoCurrent = xp % span
  return {
    ...guestProfilePreview,
    profile: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      level,
      xp,
      currentStreak: user.currentStreak ?? 0,
      longestStreak: user.currentStreak ?? 0,
      memberSince: new Date().toISOString(),
    },
    levelProgress: {
      currentLevelThreshold: level * span - span,
      nextLevelThreshold: level * span,
      xpIntoCurrent: intoCurrent,
      levelSpan: span,
      progressPercent: Math.round((intoCurrent / span) * 100),
    },
  }
}

const tickStyle = { fill: '#64748B', fontSize: 11 }
const gridColor = '#FEE2E2'
const tooltipStyle = {
  borderRadius: 12,
  borderColor: '#FECACA',
  boxShadow: '0 14px 30px rgba(15,23,42,0.12)',
  fontSize: 12,
  fontWeight: 600,
}

function ChartEmpty({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-white/40 to-white/70 text-center backdrop-blur-[1px]">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500">
        <Activity className="h-5 w-5" />
      </span>
      <p className="mt-2 text-sm font-bold text-slate-600">{label}</p>
      <p className="text-[11px] text-slate-400">Complete a test to see this fill in.</p>
    </div>
  )
}

export default function Profile() {
  const navigate = useNavigate()
  const user = useAuthStore((state: AuthState) => state.user)
  const isGuestPreview = !user
  const { data: fetchedData, loading } = useAsyncData<ProfileOverview | null>(
    () => (user ? apiClient.get('/profile/overview') : Promise.resolve(null)),
    [user],
  )
  // Always resolve to a usable overview so the page never goes blank.
  const data = fetchedData ?? buildProfileFallback(user)
  const usingFallback = !fetchedData
  const hasActivity = (data?.stats.totalAttempts ?? 0) > 0

  const xpToNext = useMemo(() => {
    if (!data) return 0
    return Math.max(0, data.levelProgress.nextLevelThreshold - data.profile.xp)
  }, [data])

  const heroMetrics = useMemo(() => {
    if (!data) return []
    return [
      {
        label: 'Total XP',
        value: data.profile.xp,
        format: (v: number) => v.toLocaleString('en-US'),
        icon: Zap,
        accent: 'from-amber-400 to-orange-500',
        ring: 'rgba(251,191,36,0.45)',
      },
      {
        label: 'Tests Completed',
        value: data.stats.totalAttempts,
        format: (v: number) => v.toString(),
        icon: Activity,
        accent: 'from-red-500 to-rose-600',
        ring: 'rgba(244,63,94,0.35)',
      },
      {
        label: 'Average Accuracy',
        value: data.stats.averageAccuracy,
        format: (v: number) => `${v.toFixed(1)}%`,
        icon: Target,
        accent: 'from-rose-500 to-red-600',
        ring: 'rgba(220,38,38,0.4)',
      },
      {
        label: 'Streak',
        value: data.profile.currentStreak,
        format: (v: number) => `${v} d`,
        icon: Flame,
        accent: 'from-orange-500 to-red-500',
        ring: 'rgba(249,115,22,0.4)',
      },
    ]
  }, [data])

  const ieltsSkills = useMemo(
    () => data?.skillAnalytics.trackBreakdown.filter((item) => item.group === 'IELTS') ?? [],
    [data],
  )
  const satSkills = useMemo(
    () => data?.skillAnalytics.trackBreakdown.filter((item) => item.group === 'SAT') ?? [],
    [data],
  )

  return (
    <div className="relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Reveal>
        <section className="premium-hero relative overflow-hidden p-6 sm:p-9">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gradient-to-br from-amber-200/30 to-orange-300/15 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 bottom-0 h-60 w-60 rounded-full bg-rose-200/25 blur-3xl" />

          {loading ? (
            <>
              <Skeleton className="h-8 w-64" />
              <Skeleton className="mt-3 h-4 w-80" />
            </>
          ) : data ? (
            <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] xl:items-center">
              <div>
                <div className="premium-top-controls">
                  <button
                    type="button"
                    onClick={() => navigate('/tests')}
                    className="premium-back-btn"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>
                  <span className="premium-top-chip">
                    <Trophy className="h-3.5 w-3.5" />
                    Performance Studio
                  </span>
                </div>
                <h1 className="premium-section-title mt-4">
                  Welcome back, <span className="arena-title-accent-red">{data.profile.fullName.split(' ')[0]}</span>
                </h1>
                <p className="premium-section-subtitle">
                  Track your XP, ranking, and skill power. Earn XP on every test — higher scores on harder tests rank you higher.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-1.5">
                    <Award className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-bold text-amber-700">
                      Level <CountUp value={data.profile.level} />
                    </span>
                  </div>
                  {data.competitive && data.competitive.rank > 0 ? (
                    <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-3 py-1.5">
                      <Trophy className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-bold text-red-700">
                        Rank #<CountUp value={data.competitive.rank} />
                      </span>
                      {data.competitive.rankTrend === 'up' && data.competitive.rankDelta !== 0 ? (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                          <ArrowUpRight className="h-3 w-3" />+{Math.abs(data.competitive.rankDelta)}
                        </span>
                      ) : data.competitive.rankTrend === 'down' && data.competitive.rankDelta !== 0 ? (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                          <ArrowDownRight className="h-3 w-3" />-{Math.abs(data.competitive.rankDelta)}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* XP gem progress card */}
              <Tilt3D className="rounded-3xl" max={5}>
                <div className="relative overflow-hidden rounded-3xl border border-red-100/80 bg-gradient-to-br from-white via-amber-50/30 to-rose-50/50 p-5 shadow-[0_18px_44px_rgba(220,38,38,0.12)]">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-600">XP Vault</p>
                      <p className="mt-1 text-4xl font-black tracking-tight text-slate-900">
                        <CountUp value={data.profile.xp} />
                      </p>
                      <p className="mt-1 text-[11px] font-medium text-slate-500">Total XP earned</p>
                    </div>
                    <XPGem size={64} />
                  </div>

                  <div className="mt-4">
                    <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-slate-600">
                      <span>Level {data.profile.level}</span>
                      <span>{xpToNext} XP to L{data.profile.level + 1}</span>
                    </div>
                    <AnimatedBar value={data.levelProgress.progressPercent} height={9} />
                  </div>
                </div>
              </Tilt3D>
            </div>
          ) : null}
        </section>
      </Reveal>

      {isGuestPreview ? (
        <Reveal className="mt-6">
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="interactive-lift flex w-full items-center gap-3 rounded-2xl border border-red-200/80 bg-gradient-to-r from-red-50 via-white to-rose-50 p-4 text-left shadow-[0_10px_24px_rgba(220,38,38,0.1)]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white">
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-black text-slate-900">Preview mode</span>
              <span className="block text-[12px] text-slate-500">Create an account to track real XP, ranking and saved attempts.</span>
            </span>
            <ArrowUpRight className="h-5 w-5 shrink-0 text-red-500" />
          </button>
        </Reveal>
      ) : usingFallback && !loading ? (
        <Reveal className="mt-6">
          <button
            type="button"
            onClick={() => navigate('/premium')}
            className="interactive-lift flex w-full items-center gap-3 rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50 via-white to-orange-50 p-4 text-left shadow-[0_10px_24px_rgba(245,158,11,0.12)]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white">
              <BrainCircuit className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-black text-slate-900">Live AI analytics are Premium</span>
              <span className="block text-[12px] text-slate-500">
                Your XP, level and streak are shown below. Unlock the AI skill matrix, ranking and insights with Premium.
              </span>
            </span>
            <span className="hidden shrink-0 items-center gap-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-2 text-xs font-bold text-white sm:inline-flex">
              Go Premium <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </button>
        </Reveal>
      ) : null}

      {/* ── Hero metrics ────────────────────────────────────────── */}
      <Stagger className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => <CompactSkeletonCard key={index} />)
          : heroMetrics.map((card) => {
            const Icon = card.icon
            return (
              <StaggerItem key={card.label} className="h-full">
                <Tilt3D className="h-full rounded-3xl" max={6}>
                  <article className="group relative h-full overflow-hidden rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.06)] transition-shadow hover:shadow-[0_20px_40px_rgba(220,38,38,0.12)]">
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-red-300/55 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">{card.label}</p>
                      <span
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${card.accent} text-white`}
                        style={{ boxShadow: `0 10px 22px ${card.ring}` }}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                    </div>
                    <p className="mt-4 text-[2rem] font-black leading-none tracking-tight text-slate-900">
                      {card.label === 'Average Accuracy' ? (
                        <CountUp value={card.value} decimals={1} suffix="%" />
                      ) : card.label === 'Streak' ? (
                        <CountUp value={card.value} suffix=" d" />
                      ) : (
                        <CountUp value={card.value} />
                      )}
                    </p>
                    <div className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                      <span className="fx-pulse-dot h-1.5 w-1.5 rounded-full bg-red-400" />
                      Live data
                    </div>
                  </article>
                </Tilt3D>
              </StaggerItem>
            )
          })}
      </Stagger>

      {/* ── Skill matrix radar + Average accuracy ring ─────────── */}
      <section className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Reveal>
          <article className="surface-card relative overflow-hidden p-6">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-red-400/55 to-transparent" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-[0_10px_22px_rgba(220,38,38,0.32)]">
                  <BrainCircuit className="h-4 w-4" />
                </span>
                <h2 className="text-lg font-black tracking-tight text-slate-900">Skill Matrix</h2>
              </div>
              <span className="rounded-full border border-red-100 bg-red-50 px-2.5 py-0.5 text-[10px] font-bold text-red-700">
                IELTS + SAT
              </span>
            </div>

            {loading ? (
              <Skeleton className="mt-4 h-72 w-full rounded-2xl" />
            ) : data ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr]">
                <div className="relative h-64">
                  {!hasActivity ? <ChartEmpty label="No skill data yet" /> : null}
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={data.skillAnalytics.radar}>
                      <PolarGrid stroke="#FECACA" />
                      <PolarAngleAxis dataKey="label" tick={{ fill: '#64748B', fontSize: 10 }} />
                      <Radar
                        name="Skill Power"
                        dataKey="skillPower"
                        stroke="#DC2626"
                        fill="#DC2626"
                        fillOpacity={0.32}
                        animationDuration={900}
                      />
                      <Tooltip contentStyle={tooltipStyle} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-red-700">IELTS Tracks</p>
                  {ieltsSkills.map((skill) => (
                    <div key={skill.key}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-[12px] font-semibold text-slate-700">{skill.label}</span>
                        <span className="text-[11px] font-bold text-slate-900">{skill.skillPower.toFixed(1)}</span>
                      </div>
                      <AnimatedBar value={skill.skillPower} height={6} />
                    </div>
                  ))}
                  <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.14em] text-blue-700">SAT Tracks</p>
                  {satSkills.map((skill) => (
                    <div key={skill.key}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-[12px] font-semibold text-slate-700">{skill.label}</span>
                        <span className="text-[11px] font-bold text-slate-900">{skill.skillPower.toFixed(1)}</span>
                      </div>
                      <AnimatedBar value={skill.skillPower} height={6} from="#2563EB" to="#1D4ED8" track="rgba(59,130,246,0.14)" />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </article>
        </Reveal>

        <Reveal delay={0.08}>
          <article className="surface-card relative overflow-hidden p-6">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-rose-400/55 to-transparent" />
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-[0_10px_22px_rgba(220,38,38,0.32)]">
                <Target className="h-4 w-4" />
              </span>
              <h2 className="text-lg font-black tracking-tight text-slate-900">Accuracy Score</h2>
            </div>

            {loading ? (
              <Skeleton className="mt-4 h-56 w-full rounded-2xl" />
            ) : data ? (
              <div className="mt-4 flex flex-col items-center">
                <ProgressRing value={data.stats.averageAccuracy} size={170} stroke={14}>
                  <div className="text-center">
                    <p className="text-3xl font-black tracking-tight text-slate-900">
                      <CountUp value={data.stats.averageAccuracy} decimals={1} suffix="%" />
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Avg accuracy</p>
                  </div>
                </ProgressRing>
                <div className="mt-5 grid w-full grid-cols-2 gap-3">
                  <div className="rounded-xl border border-red-100 bg-red-50/60 p-3 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-red-600">Avg Score</p>
                    <p className="mt-1 text-lg font-black text-slate-900">
                      <CountUp value={data.stats.averageScore} decimals={1} suffix="%" />
                    </p>
                  </div>
                  <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">From Tests</p>
                    <p className="mt-1 inline-flex items-center gap-1 text-lg font-black text-slate-900">
                      <Zap className="h-4 w-4 fill-amber-400 text-amber-500" />
                      <CountUp value={data.stats.totalXpFromAttempts} />
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </article>
        </Reveal>
      </section>

      {/* ── XP Momentum ─────────────────────────────────────────── */}
      <Reveal className="mt-6">
        <article className="surface-card relative overflow-hidden p-6">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-red-400/55 to-transparent" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-[0_10px_22px_rgba(220,38,38,0.32)]">
                <TrendingUp className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-lg font-black tracking-tight text-slate-900">XP Momentum</h2>
                <p className="text-[11px] font-medium text-slate-500">Cumulative XP earned over recent attempts</p>
              </div>
            </div>
          </div>

          {loading ? (
            <Skeleton className="mt-4 h-72 w-full rounded-2xl" />
          ) : data ? (
            <div className="relative mt-4 h-72 w-full">
              {!hasActivity ? <ChartEmpty label="No XP history yet" /> : null}
              <ResponsiveContainer>
                <AreaChart data={data.skillAnalytics.xpMomentum} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EF4444" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#EF4444" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="label" tick={tickStyle} axisLine={false} tickLine={false} />
                  <YAxis tick={tickStyle} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area
                    type="monotone"
                    dataKey="xp"
                    stroke="#DC2626"
                    strokeWidth={2.5}
                    fill="url(#xpGradient)"
                    animationDuration={900}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : null}
        </article>
      </Reveal>

      {/* ── Weekly activity + Achievements ──────────────────────── */}
      <section className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <Reveal>
          <article className="surface-card relative overflow-hidden p-6">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-rose-400/55 to-transparent" />
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-[0_10px_22px_rgba(220,38,38,0.32)]">
                <Activity className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-lg font-black tracking-tight text-slate-900">Weekly Activity</h2>
                <p className="text-[11px] font-medium text-slate-500">Tests and XP earned each day</p>
              </div>
            </div>
            {loading ? (
              <Skeleton className="mt-4 h-64 w-full rounded-2xl" />
            ) : data ? (
              <div className="relative mt-4 h-64 w-full">
                {!hasActivity ? <ChartEmpty label="No activity this week" /> : null}
                <ResponsiveContainer>
                  <BarChart data={data.weeklyActivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={tickStyle} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={tickStyle} />
                    <Tooltip cursor={{ fill: 'rgba(220,38,38,0.06)' }} contentStyle={tooltipStyle} />
                    <Bar dataKey="xpEarned" radius={[10, 10, 4, 4]} fill="url(#weeklyXpGradient)" animationDuration={700} />
                    <defs>
                      <linearGradient id="weeklyXpGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#F59E0B" />
                        <stop offset="100%" stopColor="#DC2626" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : null}
          </article>
        </Reveal>

        <Reveal delay={0.08}>
          <article className="surface-card relative overflow-hidden p-6">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/55 to-transparent" />
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-[0_10px_22px_rgba(245,158,11,0.32)]">
                <Sparkles className="h-4 w-4" />
              </span>
              <h2 className="text-lg font-black tracking-tight text-slate-900">Achievements</h2>
            </div>
            {loading ? (
              <div className="mt-4 space-y-3">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : data?.achievements.length ? (
              <Stagger className="mt-4 space-y-2.5">
                {data.achievements.slice(0, 5).map((entry) => (
                  <StaggerItem key={entry.achievement.id}>
                    <div className="group flex items-start gap-2.5 rounded-xl border border-amber-100 bg-gradient-to-r from-amber-50/60 to-white p-3 transition hover:border-amber-200 hover:shadow-[0_8px_18px_rgba(245,158,11,0.15)]">
                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm">
                        <CheckCircle2 className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900">{entry.achievement.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">{entry.achievement.description}</p>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                        <Zap className="h-3 w-3 fill-amber-400 text-amber-500" />+{entry.achievement.xpReward}
                      </span>
                    </div>
                  </StaggerItem>
                ))}
              </Stagger>
            ) : (
              <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-amber-200 bg-amber-50/40 px-4 py-8 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                  <Sparkles className="h-5 w-5" />
                </span>
                <p className="mt-3 text-sm font-bold text-slate-700">No achievements yet</p>
                <p className="mt-1 text-xs text-slate-500">Complete tests to unlock badges and bonus XP.</p>
              </div>
            )}
          </article>
        </Reveal>
      </section>

      {/* ── Recent attempts ─────────────────────────────────────── */}
      <Reveal className="mt-6">
        <article className="surface-card relative overflow-hidden p-6">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-red-400/55 to-transparent" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-[0_10px_22px_rgba(220,38,38,0.32)]">
                <Activity className="h-4 w-4" />
              </span>
              <h2 className="text-lg font-black tracking-tight text-slate-900">Recent Attempts</h2>
            </div>
          </div>

          {loading ? (
            <div className="mt-4 space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : data?.recentAttempts.length ? (
            <Stagger className="mt-4 grid gap-3 md:grid-cols-2">
              {data.recentAttempts.slice(0, 6).map((attempt) => (
                <StaggerItem key={attempt.id}>
                  <motion.div
                    whileHover={{ y: -2 }}
                    className="group rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-red-200 hover:shadow-[0_10px_22px_rgba(220,38,38,0.1)]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-bold text-slate-900">{attempt.test.title}</p>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                        <Zap className="h-3 w-3 fill-amber-400 text-amber-500" />+{attempt.xpEarned}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-500">
                        {attempt.test.category} · {attempt.test.difficulty}
                      </span>
                      <span className="text-[11px] font-bold text-slate-700">
                        {attempt.percentage.toFixed(1)}% ({attempt.finalScore.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-red-100/60">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-red-500 to-rose-500"
                        style={{ width: `${Math.max(2, Math.min(100, attempt.percentage))}%` }}
                      />
                    </div>
                    <p className="mt-2 text-[10px] font-medium text-slate-400">
                      {new Date(attempt.completedAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </motion.div>
                </StaggerItem>
              ))}
            </Stagger>
          ) : (
            <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-red-200 bg-red-50/40 px-4 py-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <Activity className="h-5 w-5" />
              </span>
              <p className="mt-3 text-sm font-bold text-slate-700">No attempts yet</p>
              <p className="mt-1 text-xs text-slate-500">Complete a test to start earning XP and build your history.</p>
              <button
                type="button"
                onClick={() => navigate('/tests')}
                className="interactive-lift mt-4 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2 text-sm font-bold text-white shadow-[0_10px_22px_rgba(220,38,38,0.28)]"
              >
                Browse tests
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </article>
      </Reveal>
    </div>
  )
}
