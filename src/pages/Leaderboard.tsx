import UiText from '@/components/common/UiText'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownRight,
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
import type { LeaderboardResponse, LeaderboardRow } from '@/types/platform'
import { Skeleton } from '@/components/common/Skeleton'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { isPremiumUser } from '@/utils/premiumAccess'
import { motion } from 'framer-motion'
import { Burst, CountUp, CrownBadge, Reveal, Stagger, StaggerItem, Tilt3D, XPGem } from '@/components/fx'
import { ArenaMetricMark } from '@/components/ui/ArenaMetricMark'
import PremiumFeatureLock from '@/components/premium/PremiumFeatureLock'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { useNavigate } from 'react-router-dom'
import { syncSavedSATAttemptResults } from '@/features/sat/resultSync'

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
      : 'border-red-200 bg-red-50 text-red-700',
  }
}

/** Podium card styling per rank — gold / silver / bronze. */
function podiumTheme(rank: number) {
  if (rank === 1) {
    return {
      cardBg: 'from-white via-red-50/60 to-slate-100/75',
      cardBorder: 'border-red-200/80',
      cardShadow: 'shadow-[0_24px_50px_rgba(174,39,54,0.17)]',
      ringFrom: '#d83d4b',
      ringTo: '#9e1d2b',
      crown: 'text-amber-500',
      label: 'Gold',
      labelBg: 'bg-gradient-to-r from-red-800 to-red-500',
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
    cardBg: 'from-white via-rose-50/40 to-slate-100/75',
    cardBorder: 'border-slate-200/80',
    cardShadow: 'shadow-[0_22px_44px_rgba(71,80,95,0.13)]',
    ringFrom: '#b9bdc8',
    ringTo: '#8d6470',
    crown: 'text-orange-600',
    label: 'Bronze',
    labelBg: 'bg-gradient-to-r from-slate-600 to-red-500',
    barH: 'h-20',
  }
}

export default function Leaderboard() {
  const navigate = useNavigate()
  const user = useAuthStore((state: AuthState) => state.user)
  const { minimalMotion } = useMotionPreferences()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<LeaderboardResponse | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week')

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
        const payload = await apiClient.get<LeaderboardResponse>(`/leaderboard?period=${period}`, { auth: true })
        if (!active) return
        setData(payload)
        void syncSavedSATAttemptResults(user.id).then((sync) => {
          if (!active || sync.failed || useAuthStore.getState().user?.id !== user.id) return
          void apiClient.get<LeaderboardResponse>(`/leaderboard?period=${period}`, { auth: true })
            .then((latest) => { if (active) setData(latest) })
            .catch(() => {})
        }).catch(() => {})
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
  }, [user, reloadKey, period])

  const rows = useMemo(() => data?.rows ?? [], [data])
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
  const leader = rows[0] ?? null
  const currentXp = currentUserRow?.totalXp ?? (period === 'all' ? user?.xp ?? 0 : 0)
  const nextRank = currentUserRow ? rows.find((row) => row.rank === currentUserRow.rank - 1) : null
  const xpToNextRank = nextRank ? Math.max(0, nextRank.totalXp - currentXp + 1) : 0
  const leaderProgress = leader && leader.totalXp > 0 ? Math.min(100, currentXp / leader.totalXp * 100) : 0
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
        <section className="relative overflow-hidden rounded-[2rem] border border-white/90 bg-[radial-gradient(circle_at_8%_12%,rgba(213,218,225,0.6),transparent_38%),radial-gradient(circle_at_90%_10%,rgba(251,113,133,0.2),transparent_42%),linear-gradient(150deg,#fff,#f3f4f6_62%,#fff5f5)] p-6 shadow-[0_28px_70px_rgba(15,23,42,0.16)] sm:p-8">

          <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700">
                  <Sparkles className="h-3.5 w-3.5" />
                   <UiText text={"XP Ranking Board"} /> </p>
                {isPremiumUser(user) ? <CrownBadge size="sm" /> : null}
              </div>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                 <UiText text={"Global"} /> <span className="arena-title-accent-red"> <UiText text={"Leaderboard"} /> </span>
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                {period === 'all' ? 'All time profile XP across every activity.' : `Verified XP earned ${period === 'week' ? 'this week' : 'this month'}.`} See the leaders and your place on the board.
              </p>
              <div className="mt-5 inline-flex flex-wrap gap-1 rounded-2xl border border-white/90 bg-white/75 p-1.5 shadow-sm" role="group" aria-label="Leaderboard period">
                {([['week', 'This Week'], ['month', 'Month'], ['all', 'All Time']] as const).map(([value, label]) => <button key={value} type="button" onClick={() => setPeriod(value)} aria-pressed={period === value} className={`rounded-xl px-4 py-2 text-sm font-black transition ${period === value ? 'bg-gradient-to-r from-red-500 to-red-700 text-white shadow-[0_9px_20px_rgba(220,38,38,.24)]' : 'text-slate-600 hover:bg-red-50 hover:text-red-700'}`}>{label}</button>)}
              </div>
            </div>

            <Tilt3D className="w-full rounded-3xl sm:w-auto" max={5}>
              <div className="relative overflow-hidden rounded-3xl border border-amber-200/70 bg-gradient-to-br from-white via-amber-50/40 to-orange-50/60 px-5 py-4 shadow-[0_18px_44px_rgba(245,158,11,0.18)] sm:min-w-[18rem]">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />
                <div className="flex items-center gap-4">
                  <XPGem size={56} />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700"> <UiText text={"Your XP"} /> </p>
                    <p className="text-3xl font-black tracking-tight text-slate-900">
                      <CountUp value={currentXp} />
                    </p>
                    <p className="mt-0.5 text-[11px] font-semibold text-slate-600">
                       <UiText text={"Rank"} /> {' '}
                      <span className="text-red-700">
                        #{data?.currentUserRank ?? '--'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </Tilt3D>
          </div>

          <p className="relative z-10 mt-6 text-xs font-semibold text-red-700">
            {period === 'all' ? 'All time · All activities · Same XP as your profile' : `Current ${period === 'week' ? 'week' : 'month'} · Verified activity XP`}
          </p>
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
              <RefreshCw className="h-3.5 w-3.5" />  <UiText text={"Retry"} /> </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/login', { state: { from: { pathname: '/leaderboard' } } })}
              className="rounded-full bg-slate-950 px-4 py-2 text-xs font-black text-white transition hover:bg-red-800"
            >
               <UiText text={"Sign in"} /> </button>
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
          <h2 className="text-lg font-black tracking-tight text-slate-900"> <UiText text={"Podium · Top 3"} /> </h2>
        </div>
        {loading ? (
          <div className="grid gap-3 lg:grid-cols-3">
            <Skeleton className="h-72 w-full rounded-3xl" />
            <Skeleton className="h-72 w-full rounded-3xl" />
            <Skeleton className="h-72 w-full rounded-3xl" />
          </div>
        ) : visualPodium.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            Earn XP from learning activities to claim the top spot.
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
                          {row.avatarUrl ? <img src={row.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" /> : row.fullName.slice(0, 1).toUpperCase()}
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
                        <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500"> <UiText text={"Accuracy"} /> </p>
                        <p className="mt-0.5 text-xs font-black text-slate-900">{row.accuracy.toFixed(1)}%</p>
                      </div>
                      <div className="rounded-xl border border-white/50 bg-white/70 px-2.5 py-1.5 text-center backdrop-blur">
                        <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500"> <UiText text={"Tests"} /> </p>
                        <p className="mt-0.5 text-xs font-black text-slate-900">{row.testsCompleted}</p>
                      </div>
                    </div>

                    {row.streak > 0 ? (
                      <div className="mt-3 inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50/85 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                        <Flame className="h-3 w-3" />
                        {row.streak}  <UiText text={"day streak"} /> </div>
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
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-red-400/55 to-transparent" />
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ArenaMetricMark icon={Medal} tone="red" size="sm" />
                <h3 className="text-lg font-black tracking-tight text-slate-900"> <UiText text={"Top 10 · Pure XP"} /> </h3>
              </div>
              {summary ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                  <Zap className="h-3 w-3 fill-amber-400 text-amber-500" />
                   <UiText text={"Total"} /> <CountUp value={summary.totalXp} /> XP
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
                            ? 'border-red-300 bg-gradient-to-r from-red-50/70 to-slate-50/60 shadow-[0_8px_18px_rgba(37,99,235,0.1)]'
                            : 'border-slate-100 bg-white hover:border-red-200 hover:bg-red-50/30'
                        }`}
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-xs font-black text-slate-600">
                          {isTopThree ? <Crown className={`h-4 w-4 ${medalColor}`} /> : `#${row.rank}`}
                        </span>
                        <div className="flex min-w-0 items-center gap-2.5">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-900">
                              {row.fullName}
                              {row.isCurrentUser ? (
                                <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-700"> <UiText text={"YOU"} /> </span>
                              ) : null}
                            </p>
                            <p className="text-[10px] font-medium text-slate-500">{row.testsCompleted}  <UiText text={"tests ·"} /> {row.accuracy.toFixed(0)} <UiText text={"% acc"} /> </p>
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
              <div className="rounded-xl border border-slate-200 bg-red-50/30 p-5 text-sm text-slate-600">
                No rankings yet. Earn XP to start climbing!
              </div>
            )}
            {currentUserRow && currentUserRow.rank > 10 ? <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-red-300 bg-gradient-to-r from-red-50 to-white px-4 py-3 shadow-[0_12px_25px_rgba(220,38,38,.1)]"><span className="inline-flex items-center gap-3"><b className="text-lg font-black text-red-700">#{currentUserRow.rank}</b><span><strong className="block text-sm font-black text-slate-950">You · {currentUserRow.fullName}</strong><small className="text-xs font-medium text-slate-500">{currentUserRow.testsCompleted} tests · {currentUserRow.accuracy.toFixed(0)}% accuracy</small></span></span><strong className="text-sm font-black text-red-700">{currentUserRow.totalXp.toLocaleString('en-US')} XP</strong></div> : null}
          </article>
          </PremiumFeatureLock>
        </Reveal>

        <div className="space-y-4">
          <Reveal>
            <article className="surface-card overflow-hidden border-red-100 bg-[linear-gradient(140deg,#fff,#fff3f3_55%,#edf4ff)] p-5">
              <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-red-50 text-red-600"><Shield size={22} /></span><div><p className="text-[10px] font-black uppercase tracking-[.15em] text-red-600">YOUR LEAGUE</p><h3 className="text-lg font-black text-slate-950">{currentUserRow?.divisionLabel ?? 'Build your ranking'}</h3></div></div>
              <p className="mt-4 text-sm leading-6 text-slate-600">{currentUserRow ? `You are #${currentUserRow.rank} on the ${period === 'all' ? 'all time' : period === 'week' ? 'weekly' : 'monthly'} board. Keep earning XP to move up.` : 'Complete activities to appear on the leaderboard.'}</p>
              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-red-100"><div className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-700 transition-all" style={{ width: `${currentUserRow ? Math.max(8, Math.min(100, (11 - Math.min(currentUserRow.rank, 10)) * 10)) : 0}%` }} /></div>
              <p className="mt-2 text-xs font-bold text-red-700">{currentUserRow?.rank && currentUserRow.rank <= 10 ? 'Top 10 achieved' : 'Top 10 goal'}</p>
            </article>
          </Reveal>
          <Reveal>
            <PremiumFeatureLock locked={premiumLocked} title="Unlock Your XP Progress" compact>
            <article className="surface-card relative overflow-hidden border-amber-200 p-5">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
              <div className="flex items-center gap-3">
                <ArenaMetricMark icon={Crown} tone="amber" />
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-amber-600">{period === 'all' ? 'Total profile XP' : `${period === 'week' ? 'Weekly' : 'Monthly'} XP`}</p>
                  <h3 className="text-lg font-black text-slate-900">Your XP Progress</h3>
                </div>
              </div>
              <div className="mt-5 overflow-hidden rounded-full bg-amber-100">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${leaderProgress}%` }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="h-3 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 shadow-[0_0_18px_rgba(245,158,11,.48)]"
                />
              </div>
              <p className="mt-4 text-center text-sm font-black text-slate-800">
                {currentUserRow?.rank === 1
                  ? 'You lead the leaderboard!'
                  : nextRank
                    ? `${xpToNextRank.toLocaleString('en-US')} XP to pass #${nextRank.rank}`
                    : 'Earn XP to climb the leaderboard'}
              </p>
              <p className="mt-1 text-center text-xs font-semibold text-slate-500">
                Your rank #{data?.currentUserRank ?? '—'} · {currentXp.toLocaleString('en-US')} XP
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
                <h3 className="text-base font-black tracking-tight text-slate-900"> <UiText text={"How XP Works"} /> </h3>
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-600">
                {period === 'all' ? 'Your leaderboard XP is the same total shown on your profile. Tests, vocabulary, speaking, writing and other rewarded learning activities all contribute.' : 'This period shows XP earned during the selected time window. Keep practicing to climb the board.'}
              </p>
              <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50/40 px-3 py-2 text-[11px] font-bold text-amber-900">
                More total XP = a higher rank
              </div>
              <p className="mt-3 text-[11px] text-slate-500">
                Equal XP is ranked by test accuracy, then completed tests. Learning activities
                count even if you have not completed a test.
              </p>
            </article>
          </Reveal>

          {/* Overall XP leader */}
          <Reveal delay={0.06}>
            <PremiumFeatureLock locked={premiumLocked} title="Unlock XP Leader" compact>
            <article className="surface-card relative overflow-hidden p-5">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-red-400/55 to-transparent" />
              <div className="flex items-center gap-2">
                <ArenaMetricMark icon={Trophy} tone="red" size="sm" />
                <h3 className="text-base font-black tracking-tight text-slate-900">XP Leader</h3>
              </div>
              {leader ? (
                <div className="mt-3">
                  <p className="text-lg font-black text-slate-900">{leader.fullName}</p>
                  <p className="mt-1 text-xs font-medium text-slate-600">
                    {leader.totalXp.toLocaleString('en-US')} total XP · Rank #1
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">No XP leader yet.</p>
              )}
            </article>
            </PremiumFeatureLock>
          </Reveal>

          {/* Stats snapshot */}
          {summary ? (
            <Reveal delay={0.1}>
              <PremiumFeatureLock locked={premiumLocked} title="Unlock Board Snapshot" compact>
              <article className="surface-card relative overflow-hidden p-5">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-red-400/55 to-transparent" />
                <div className="flex items-center gap-2">
                  <ArenaMetricMark icon={Users} tone="red" size="sm" />
                  <h3 className="text-base font-black tracking-tight text-slate-900"> <UiText text={"Board Snapshot"} /> </h3>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-xl border border-slate-200 bg-red-50/40 px-3 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-red-700"> <UiText text={"Players"} /> </p>
                    <p className="mt-1 text-lg font-black text-slate-900">
                      <CountUp value={summary.players} />
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-red-50/40 px-3 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-red-700"> <UiText text={"Avg Accuracy"} /> </p>
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
                <h3 className="text-base font-black tracking-tight text-slate-900">Ranking Rules</h3>
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
