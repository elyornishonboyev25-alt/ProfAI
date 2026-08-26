import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  Crown,
  Flame,
  Medal,
  Minus,
  Shield,
  Sparkles,
  Trophy,
  Users,
  RefreshCw,
  Zap,
} from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import type { LeaderboardResponse, LeaderboardRow, TestCategory } from '@/types/platform'
import { Skeleton } from '@/components/common/Skeleton'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { isPremiumUser } from '@/utils/premiumAccess'
import { motion } from 'framer-motion'
import { Burst, CountUp, CrownBadge, Reveal, Stagger, StaggerItem, Tilt3D, XPGem } from '@/components/fx'
import { ArenaMetricMark } from '@/components/ui/ArenaMetricMark'
import { ProfileAvatar } from '@/components/profile/ProfileAvatar'
import PremiumFeatureLock from '@/components/premium/PremiumFeatureLock'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { useNavigate } from 'react-router-dom'

type PeriodValue = 'today' | 'week' | 'month'

const periods: Array<{ label: string; value: PeriodValue }> = [
  { label: 'Daily', value: 'today' },
  { label: 'Weekly', value: 'week' },
  { label: 'Monthly', value: 'month' },
]

const categories: Array<{ label: string; value: TestCategory | 'ALL' }> = [
  { label: 'Combined', value: 'ALL' },
  { label: 'IELTS', value: 'IELTS' },
  { label: 'SAT', value: 'SAT' },
]

function getMovement(row: LeaderboardRow) {
  if (row.rankTrend === 'same') {
    return {
      icon: Minus,
      label: '0',
      className: 'border-slate-200 bg-white text-slate-500',
    }
  }
  const up = row.rankTrend === 'up'
  return {
    icon: up ? ArrowUpRight : ArrowDownRight,
    label: `${up ? '+' : '-'}${Math.abs(row.rankDelta)}`,
    className: up
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : 'border-blue-200 bg-blue-50 text-blue-700',
  }
}

/** Podium card styling per rank — gold / silver / bronze. */
function podiumTheme(rank: number) {
  if (rank === 1) {
    return {
      cardBg: 'from-amber-100 via-amber-50/40 to-orange-100/60',
      cardBorder: 'border-amber-300/80',
      cardShadow: 'shadow-[0_24px_50px_rgba(245,158,11,0.25)]',
      ringFrom: '#FBBF24',
      ringTo: '#D97706',
      crown: 'text-amber-500',
      label: 'Gold',
      labelBg: 'bg-gradient-to-r from-amber-400 to-orange-500',
      barH: 'h-32',
    }
  }
  if (rank === 2) {
    return {
      cardBg: 'from-slate-100 via-slate-50/40 to-zinc-100/60',
      cardBorder: 'border-slate-300/80',
      cardShadow: 'shadow-[0_22px_44px_rgba(100,116,139,0.22)]',
      ringFrom: '#CBD5E1',
      ringTo: '#64748B',
      crown: 'text-slate-400',
      label: 'Silver',
      labelBg: 'bg-gradient-to-r from-slate-300 to-slate-500',
      barH: 'h-24',
    }
  }
  return {
    cardBg: 'from-orange-100 via-orange-50/40 to-blue-100/60',
    cardBorder: 'border-orange-300/70',
    cardShadow: 'shadow-[0_22px_44px_rgba(234,88,12,0.22)]',
    ringFrom: '#FB923C',
    ringTo: '#C2410C',
    crown: 'text-orange-600',
    label: 'Bronze',
    labelBg: 'bg-gradient-to-r from-orange-400 to-blue-500',
    barH: 'h-20',
  }
}

export default function Leaderboard() {
  const navigate = useNavigate()
  const user = useAuthStore((state: AuthState) => state.user)
  const { minimalMotion } = useMotionPreferences()

  const [period, setPeriod] = useState<PeriodValue>('week')
  const [category, setCategory] = useState<TestCategory | 'ALL'>('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<LeaderboardResponse | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true

    const fetchData = async () => {
      if (!user) {
        setLoading(false)
        setData(null)
        setError('Sign in required to view the leaderboard.')
        return
      }

      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({ period })
        if (category !== 'ALL') params.set('category', category)

        const payload = await apiClient.get<LeaderboardResponse>(`/leaderboard?${params.toString()}`, { auth: true })
        if (!active) return
        setData(payload)
      } catch (fetchError) {
        if (!active) return
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load leaderboard.')
      } finally {
        if (active) setLoading(false)
      }
    }

    void fetchData()
    return () => {
      active = false
    }
  }, [period, category, user, reloadKey])

  const rows = data?.rows ?? []
  const currentUserRow = useMemo(() => rows.find((row) => row.isCurrentUser) ?? null, [rows])
  const podiumRows = useMemo(() => {
    if (data?.podium?.length) return data.podium.slice(0, 3)
    return rows.slice(0, 3)
  }, [data, rows])

  const summary = useMemo(() => {
    if (rows.length === 0) return null
    const totalXp = rows.reduce((sum, row) => sum + row.totalXp, 0)
    const avgAccuracy = rows.reduce((sum, row) => sum + row.accuracy, 0) / rows.length
    return { totalXp, avgAccuracy, players: rows.length }
  }, [rows])

  const topTen = rows.slice(0, 10)
  // Competition and progress visibility are core learning features. Keep the
  // complete board free for every signed-in learner.
  const premiumLocked = false

  // Re-order podium so #1 is in the middle: [#2, #1, #3]
  const visualPodium = useMemo(() => {
    if (podiumRows.length < 3) return podiumRows
    return [podiumRows[1], podiumRows[0], podiumRows[2]]
  }, [podiumRows])

  return (
    <div className="workspace-page premium-page-stage relative min-h-screen w-full overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="relative mx-auto w-full max-w-7xl">
      {/* ── Hero ──────────────────────────────────────────────── */}
      <Reveal>
        <section className="relative overflow-hidden rounded-[2rem] border border-blue-100 bg-[radial-gradient(circle_at_8%_12%,rgba(147,197,253,0.35),transparent_38%),radial-gradient(circle_at_90%_10%,rgba(251,113,133,0.25),transparent_42%),linear-gradient(150deg,#fff,#fff5f5)] p-6 shadow-[0_28px_70px_rgba(15,23,42,0.16)] sm:p-8">

          <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => navigate('/dashboard')} className="premium-back-btn-sm">
                  <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
                </button>
                <p className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  XP Ranking Board
                </p>
                {isPremiumUser(user) ? <CrownBadge size="sm" /> : null}
              </div>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                Global <span className="arena-title-accent-red">Leaderboard</span>
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Pure XP ranking — earn more XP on harder tests to climb. Ties broken by accuracy then attempts.
              </p>
            </div>

            <Tilt3D className="w-full rounded-3xl sm:w-auto" max={5}>
              <div className="relative overflow-hidden rounded-3xl border border-amber-200/70 bg-gradient-to-br from-white via-amber-50/40 to-orange-50/60 px-5 py-4 shadow-[0_18px_44px_rgba(245,158,11,0.18)] sm:min-w-[18rem]">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />
                <div className="flex items-center gap-4">
                  <XPGem size={56} />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700">Your XP</p>
                    <p className="text-3xl font-black tracking-tight text-slate-900">
                      <CountUp value={currentUserRow ? currentUserRow.totalXp : user?.xp ?? 0} />
                    </p>
                    <p className="mt-0.5 text-[11px] font-semibold text-slate-600">
                      Rank{' '}
                      <span className="text-blue-700">
                        #{data?.currentUserRank ?? '--'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </Tilt3D>
          </div>

          {/* Filters */}
          <div className="relative z-10 mt-6 grid gap-3 lg:grid-cols-2">
            <div className="rounded-2xl border border-blue-100 bg-white p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-600">Period</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {periods.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setPeriod(item.value)}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      period === item.value
                        ? 'cta-sheen bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_10px_22px_rgba(37,99,235,0.28)]'
                        : 'border border-blue-100 bg-white text-slate-600 hover:text-blue-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-white p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-600">Track</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {categories.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setCategory(item.value)}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      category === item.value
                        ? 'cta-sheen bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_10px_22px_rgba(37,99,235,0.28)]'
                        : 'border border-blue-100 bg-white text-slate-600 hover:text-blue-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {error ? (
        <div role="alert" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-900 shadow-sm">
          <span>{error}</span>
          {user ? (
            <button
              type="button"
              onClick={() => setReloadKey((key) => key + 1)}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-amber-800 shadow-sm transition hover:bg-amber-100"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/login', { state: { from: { pathname: '/leaderboard' } } })}
              className="rounded-full bg-slate-950 px-4 py-2 text-xs font-black text-white transition hover:bg-blue-800"
            >
              Sign in
            </button>
          )}
        </div>
      ) : null}

      {/* ── Podium ────────────────────────────────────────────── */}
      <Reveal delay={0.05} className="mt-8">
        <PremiumFeatureLock
          locked={premiumLocked}
          title="Unlock the Live Podium"
          description="See verified leaders, rank movement, accuracy and competitive streak intelligence."
        >
        <div className="mb-3 flex items-center gap-2">
          <ArenaMetricMark icon={Trophy} tone="amber" size="sm" />
          <h2 className="text-lg font-black tracking-tight text-slate-900">Podium · Top 3</h2>
        </div>
        {loading ? (
          <div className="grid gap-3 lg:grid-cols-3">
            <Skeleton className="h-72 w-full rounded-3xl" />
            <Skeleton className="h-72 w-full rounded-3xl" />
            <Skeleton className="h-72 w-full rounded-3xl" />
          </div>
        ) : visualPodium.length === 0 ? (
          <div className="rounded-2xl border border-blue-100 bg-white p-6 text-sm text-slate-600">
            Be the first to complete a test and claim the top spot.
          </div>
        ) : (
          <div className="grid items-end gap-4 lg:grid-cols-3">
            {visualPodium.map((row, podiumIndex) => {
              if (!row) return null
              const theme = podiumTheme(row.rank)
              const movement = getMovement(row)
              const MovementIcon = movement.icon
              const isFirst = row.rank === 1

              return (
                <motion.div
                  key={row.userId}
                  initial={minimalMotion ? false : { opacity: 0, y: 48 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-10% 0px' }}
                  transition={
                    minimalMotion
                      ? { duration: 0.1 }
                      : { type: 'spring', stiffness: 220, damping: 24, delay: (isFirst ? 0.2 : 0) + podiumIndex * 0.08 }
                  }
                >
                <Tilt3D
                  className={`rounded-3xl ${isFirst ? 'lg:-translate-y-3' : ''}`}
                  max={5}
                >
                  <article
                    className={`fx-medal-shine relative overflow-hidden rounded-3xl border bg-gradient-to-br ${theme.cardBg} ${theme.cardBorder} ${theme.cardShadow} p-5`}
                  >
                    {isFirst ? <Burst count={20} play={!minimalMotion} /> : null}
                    {/* Rank ribbon */}
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1 rounded-full ${theme.labelBg} px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white shadow-sm`}>
                        <Crown className="h-3 w-3" />
                        {theme.label} · #{row.rank}
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${movement.className}`}>
                        <MovementIcon className="h-3 w-3" />
                        {movement.label}
                      </span>
                    </div>

                    {/* Avatar + crown */}
                    <div className="mt-4 flex flex-col items-center text-center">
                      <div className="relative">
                        <div
                          className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white text-xl font-black text-slate-700 shadow-lg"
                          style={{
                            background: `linear-gradient(135deg, ${theme.ringFrom}, ${theme.ringTo})`,
                            color: 'white',
                          }}
                        >
                          <ProfileAvatar src={row.avatarUrl} alt="" className="rounded-full" />
                        </div>
                        {isFirst ? (
                          <Crown
                            className={`absolute -top-5 left-1/2 h-7 w-7 -translate-x-1/2 ${theme.crown} drop-shadow-md`}
                          />
                        ) : null}
                      </div>
                      <p className="mt-3 truncate text-base font-black text-slate-900">{row.fullName}</p>
                      <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                        <Zap className="h-3 w-3 fill-amber-400 text-amber-500" />
                        <CountUp value={row.totalXp} /> XP
                      </div>
                    </div>

                    {/* XP bar visual */}
                    <div
                      className={`mt-4 w-full rounded-t-xl ${theme.barH}`}
                      style={{
                        background: `linear-gradient(180deg, ${theme.ringFrom}, ${theme.ringTo})`,
                        boxShadow: `inset 0 8px 16px rgba(255,255,255,0.35)`,
                      }}
                    />

                    {/* Quick stats */}
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-white/50 bg-white/70 px-2.5 py-1.5 text-center backdrop-blur">
                        <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Accuracy</p>
                        <p className="mt-0.5 text-xs font-black text-slate-900">{row.accuracy.toFixed(1)}%</p>
                      </div>
                      <div className="rounded-xl border border-white/50 bg-white/70 px-2.5 py-1.5 text-center backdrop-blur">
                        <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Tests</p>
                        <p className="mt-0.5 text-xs font-black text-slate-900">{row.testsCompleted}</p>
                      </div>
                    </div>

                    {row.streak > 0 ? (
                      <div className="mt-3 inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50/85 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                        <Flame className="h-3 w-3" />
                        {row.streak} day streak
                      </div>
                    ) : null}
                  </article>
                </Tilt3D>
                </motion.div>
              )
            })}
          </div>
        )}
        </PremiumFeatureLock>
      </Reveal>

      {/* ── Top 10 leaderboard + side rail ────────────────────── */}
      <section className="mt-8 grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
        <Reveal>
          <PremiumFeatureLock
            locked={premiumLocked}
            title="Unlock the Top 10 Board"
            description="Access the live XP table, rank movement, accuracy and streak comparisons."
          >
          <article className="surface-card relative overflow-hidden p-5 sm:p-6">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-blue-400/55 to-transparent" />
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ArenaMetricMark icon={Medal} tone="red" size="sm" />
                <h3 className="text-lg font-black tracking-tight text-slate-900">Top 10 · Pure XP</h3>
              </div>
              {summary ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                  <Zap className="h-3 w-3 fill-amber-400 text-amber-500" />
                  Total <CountUp value={summary.totalXp} /> XP
                </span>
              ) : null}
            </div>

            {loading ? (
              <div className="space-y-2.5">
                {Array.from({ length: 10 }).map((_, index) => (
                  <Skeleton key={index} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            ) : topTen.length > 0 ? (
              <Stagger className="space-y-2">
                {topTen.map((row) => {
                  const movement = getMovement(row)
                  const MovementIcon = movement.icon
                  const isTopThree = row.rank <= 3
                  const medalColor =
                    row.rank === 1
                      ? 'text-amber-500'
                      : row.rank === 2
                      ? 'text-slate-400'
                      : 'text-orange-600'

                  return (
                    <StaggerItem key={row.userId}>
                      <div
                        className={`group grid grid-cols-[40px_minmax(0,1.5fr)_0.6fr_0.6fr_0.5fr] items-center gap-3 rounded-xl border px-3 py-2.5 transition ${
                          row.isCurrentUser
                            ? 'border-blue-300 bg-gradient-to-r from-blue-50/70 to-indigo-50/40 shadow-[0_8px_18px_rgba(37,99,235,0.1)]'
                            : 'border-slate-100 bg-white hover:border-blue-200 hover:bg-blue-50/30'
                        }`}
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-xs font-black text-slate-600">
                          {isTopThree ? <Crown className={`h-4 w-4 ${medalColor}`} /> : `#${row.rank}`}
                        </span>
                        <div className="flex min-w-0 items-center gap-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 text-[11px] font-bold text-blue-700">
                            <ProfileAvatar src={row.avatarUrl} alt="" className="rounded-full" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-900">
                              {row.fullName}
                              {row.isCurrentUser ? (
                                <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-700">YOU</span>
                              ) : null}
                            </p>
                            <p className="text-[10px] font-medium text-slate-500">{row.testsCompleted} tests · {row.accuracy.toFixed(0)}% acc</p>
                          </div>
                        </div>
                        <p className="inline-flex items-center gap-1 text-sm font-black text-slate-900">
                          <Zap className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                          <CountUp value={row.totalXp} />
                        </p>
                        <p className="text-xs font-semibold text-slate-700">
                          {row.streak > 0 ? (
                            <span className="inline-flex items-center gap-0.5">
                              <Flame className="h-3 w-3 text-amber-500" />
                              {row.streak}d
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </p>
                        <span
                          className={`inline-flex w-fit items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${movement.className}`}
                        >
                          <MovementIcon className="h-3 w-3" />
                          {movement.label}
                        </span>
                      </div>
                    </StaggerItem>
                  )
                })}
              </Stagger>
            ) : (
              <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-5 text-sm text-slate-600">
                No verified rankings yet for this filter. Be the first to climb!
              </div>
            )}
          </article>
          </PremiumFeatureLock>
        </Reveal>

        <div className="space-y-4">
          <Reveal>
            <PremiumFeatureLock locked={premiumLocked} title="Unlock League Promotion" compact>
            <article className="surface-card relative overflow-hidden border-amber-200 p-5">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
              <div className="flex items-center gap-3">
                <ArenaMetricMark icon={Crown} tone="amber" />
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-amber-600">Gold League</p>
                  <h3 className="text-lg font-black text-slate-900">League Promotion</h3>
                </div>
              </div>
              <div className="mt-5 overflow-hidden rounded-full bg-amber-100">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.max(16, ((11 - Math.min(10, data?.currentUserRank ?? 10)) / 10) * 100))}%` }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="h-3 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-blue-500 shadow-[0_0_18px_rgba(245,158,11,.48)]"
                />
              </div>
              <p className="mt-4 text-center text-sm font-black text-slate-800">Top 10 advance to Platinum</p>
              <p className="mt-1 text-center text-xs font-semibold text-slate-500">
                2 days left · Your rank #{data?.currentUserRank ?? '—'}
              </p>
            </article>
            </PremiumFeatureLock>
          </Reveal>

          {/* XP formula explainer */}
          <Reveal>
            <article className="surface-card relative overflow-hidden p-5">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/55 to-transparent" />
              <div className="flex items-center gap-2">
                <ArenaMetricMark icon={Zap} tone="amber" size="sm" />
                <h3 className="text-base font-black tracking-tight text-slate-900">How XP Works</h3>
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-600">
                Each attempt awards XP based on how much you scored. The formula is fully transparent:
              </p>
              <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50/40 px-3 py-2 text-[11px] font-bold text-amber-900">
                XP = max(difficulty) × score%²
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 px-2 py-1.5">
                  <p className="font-bold text-emerald-700">Easy</p>
                  <p className="text-emerald-900">up to 40 XP</p>
                </div>
                <div className="rounded-lg border border-amber-100 bg-amber-50/50 px-2 py-1.5">
                  <p className="font-bold text-amber-700">Medium</p>
                  <p className="text-amber-900">up to 70 XP</p>
                </div>
                <div className="rounded-lg border border-blue-100 bg-blue-50/50 px-2 py-1.5">
                  <p className="font-bold text-blue-700">Hard</p>
                  <p className="text-blue-900">up to 100 XP</p>
                </div>
                <div className="rounded-lg border border-violet-100 bg-violet-50/50 px-2 py-1.5">
                  <p className="font-bold text-violet-700">Olympiad</p>
                  <p className="text-violet-900">up to 150 XP</p>
                </div>
              </div>
              <p className="mt-3 text-[11px] text-slate-500">
                100% score = full XP. 70% score = 49% XP. Daily streak adds up to +20% bonus.
              </p>
            </article>
          </Reveal>

          {/* Weekly winner */}
          <Reveal delay={0.06}>
            <PremiumFeatureLock locked={premiumLocked} title="Unlock Weekly Champion" compact>
            <article className="surface-card relative overflow-hidden p-5">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-400/55 to-transparent" />
              <div className="flex items-center gap-2">
                <ArenaMetricMark icon={Trophy} tone="red" size="sm" />
                <h3 className="text-base font-black tracking-tight text-slate-900">Weekly Champion</h3>
              </div>
              {data?.weeklyPremiumWinner ? (
                <div className="mt-3">
                  <p className="text-lg font-black text-slate-900">{data.weeklyPremiumWinner.fullName}</p>
                  <p className="mt-1 text-xs font-medium text-slate-600">
                    {data.weeklyPremiumWinner.testsCompleted} tests · Score {data.weeklyPremiumWinner.rankingScore.toFixed(0)} XP
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">No champion yet this week.</p>
              )}
            </article>
            </PremiumFeatureLock>
          </Reveal>

          {/* Stats snapshot */}
          {summary ? (
            <Reveal delay={0.1}>
              <PremiumFeatureLock locked={premiumLocked} title="Unlock Board Snapshot" compact>
              <article className="surface-card relative overflow-hidden p-5">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-blue-400/55 to-transparent" />
                <div className="flex items-center gap-2">
                  <ArenaMetricMark icon={Users} tone="red" size="sm" />
                  <h3 className="text-base font-black tracking-tight text-slate-900">Board Snapshot</h3>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-xl border border-blue-100 bg-blue-50/40 px-3 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-blue-600">Players</p>
                    <p className="mt-1 text-lg font-black text-slate-900">
                      <CountUp value={summary.players} />
                    </p>
                  </div>
                  <div className="rounded-xl border border-blue-100 bg-blue-50/40 px-3 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-blue-600">Avg Accuracy</p>
                    <p className="mt-1 text-lg font-black text-slate-900">
                      <CountUp value={summary.avgAccuracy} decimals={1} suffix="%" />
                    </p>
                  </div>
                </div>
              </article>
              </PremiumFeatureLock>
            </Reveal>
          ) : null}

          {/* Anti-cheat rules */}
          <Reveal delay={0.14}>
            <article className="surface-card relative overflow-hidden p-5">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400/55 to-transparent" />
              <div className="flex items-center gap-2">
                <ArenaMetricMark icon={Shield} tone="emerald" size="sm" />
                <h3 className="text-base font-black tracking-tight text-slate-900">Integrity Rules</h3>
              </div>
              <div className="mt-3 space-y-2">
                {(data?.antiCheatRules ?? []).slice(0, 5).map((rule) => (
                  <p key={rule} className="rounded-lg border border-emerald-100 bg-emerald-50/40 px-3 py-2 text-[11px] leading-5 text-slate-700">
                    {rule}
                  </p>
                ))}
              </div>
            </article>
          </Reveal>
        </div>
      </section>
      </div>
    </div>
  )
}
