import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ProfileAvatar } from '@/components/profile/ProfileAvatar'
import {
  ArrowLeft,
  AtSign,
  Award,
  BarChart3,
  Flame,
  GraduationCap,
  Loader2,
  Lock,
  MapPin,
  Pencil,
  Trophy,
  Zap,
} from 'lucide-react'
import { ApiError } from '@/lib/apiClient'
import { fetchPublicProfile, type PublicProfilePayload } from '@/lib/profileApi'
import { getUniversityBySlug } from '@/data/admission'
import { CountUp, ProgressRing, Reveal } from '@/components/fx'
import SkillBadge from '@/components/achievements/SkillBadge'
import { TIER_NAME, TRACK_META, formatAchievementScore } from '@/components/achievements/badgeMeta'
import { useAuthStore } from '@/store/authStore'
import { mergeLocalPublicProfilePerformance } from '@/utils/localProfilePerformance'

function Shell({ children, onBack }: { children: React.ReactNode; onBack: () => void }) {
  return (
    <div className="workspace-page relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-10">
      <div className="relative mx-auto w-full max-w-6xl space-y-6">
        <button onClick={onBack} className="premium-back-btn">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </button>
        {children}
      </div>
    </div>
  )
}

function Info({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="surface-card flex flex-col items-center p-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">{icon}</span>
      <h2 className="mt-3 text-xl font-black text-slate-900">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-slate-600">{text}</p>
    </div>
  )
}

export default function PublicProfile() {
  const { nickname = '' } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [serverData, setServerData] = useState<PublicProfilePayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<{ status: number; message: string } | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    setServerData(null)
    fetchPublicProfile(nickname)
      .then((payload) => active && setServerData(payload))
      .catch((e) => {
        if (!active) return
        const status = e instanceof ApiError ? e.status : 0
        setError({ status, message: e instanceof Error ? e.message : 'Could not load this profile.' })
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [nickname])

  const data = useMemo(
    () => (serverData && user ? mergeLocalPublicProfilePerformance(serverData, user.id) : serverData),
    [serverData, user],
  )

  const targetUniversity = useMemo(
    () => (data?.university?.slug ? getUniversityBySlug(data.university.slug) : undefined),
    [data?.university?.slug],
  )

  const showcaseBadges = useMemo(() => {
    if (!data?.badges?.length) return []
    const pinned = data.badges.filter((b) => b.pinned)
    const source = pinned.length ? pinned : data.badges
    return [...source].sort((a, b) => b.tier - a.tier).slice(0, 8)
  }, [data?.badges])

  const xpBreakdown = useMemo(() => {
    const grouped = new Map<string, number>()
    ;(data?.xpBreakdown ?? []).forEach((item) => {
      const label = item.source === 'TEST'
        ? 'Tests'
        : item.source === 'DAILY_LOGIN'
          ? 'Daily login'
          : item.source.startsWith('VOCAB_') || item.source === 'STUDY_VOCABULARY'
            ? 'Vocabulary'
            : item.source === 'WRITING'
              ? 'Writing'
              : item.source === 'SPEAKING'
                ? 'Speaking'
                : item.source === 'DEVICE_HISTORY'
                  ? 'Saved practice'
                  : 'Learning activities'
      grouped.set(label, (grouped.get(label) ?? 0) + item.amount)
    })
    return [...grouped.entries()]
      .map(([label, amount]) => ({ label, amount }))
      .filter((item) => item.amount > 0)
      .sort((left, right) => right.amount - left.amount)
  }, [data?.xpBreakdown])

  if (loading) {
    return (
      <Shell onBack={() => navigate('/dashboard')}>
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </Shell>
    )
  }

  if (error) {
    return (
      <Shell onBack={() => navigate('/dashboard')}>
        {error.status === 403 ? (
          <Info icon={<Lock className="h-6 w-6" />} title="This profile is private" text="This learner has chosen to keep their profile hidden." />
        ) : (
          <Info icon={<AtSign className="h-6 w-6" />} title="Profile not found" text={error.message} />
        )}
      </Shell>
    )
  }

  if (!data) return null

  const p = data.profile
  const v = data.visibility

  return (
    <Shell onBack={() => navigate('/dashboard')}>
      {/* Identity hero */}
      <Reveal>
        <section className="premium-hero p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 text-3xl font-black text-white shadow-[0_16px_36px_rgba(37,99,235,0.32)]">
                <ProfileAvatar src={p.avatarUrl} alt="" />
              </div>
              <span className={`absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-4 border-white ${p.online ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="inline-flex items-center gap-1 text-3xl font-black tracking-tight text-slate-900">
                  <AtSign className="h-6 w-6 text-blue-500" />
                  {p.nickname}
                </h1>
                {p.isSelf ? <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">YOU</span> : null}
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {p.online ? <span className="text-emerald-600">● Online now</span> : 'Offline'}
                {' · '}Member since {new Date(p.memberSince).toLocaleDateString()}
              </p>
              {p.bio ? <p className="mt-2 max-w-xl text-sm text-slate-600">{p.bio}</p> : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-bold text-slate-700"><Zap className="h-3.5 w-3.5 text-amber-500" /> Level {p.level}</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-bold text-slate-700"><Zap className="h-3.5 w-3.5 text-amber-500" /> {p.xp} XP</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-bold text-slate-700"><Flame className="h-3.5 w-3.5 text-orange-500" /> {p.streak} day streak</span>
                {p.country ? <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-bold text-slate-700"><MapPin className="h-3.5 w-3.5 text-blue-500" /> {p.country}</span> : null}
              </div>
            </div>
            {p.isSelf ? (
              <button onClick={() => navigate('/account')} className="arena-secondary-btn justify-center">
                <Pencil className="mr-2 h-4 w-4" /> Edit profile
              </button>
            ) : null}
          </div>
        </section>
      </Reveal>

      {/* Stats + rank */}
      {v.showResults && data.stats ? (
        <Reveal>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Kpi icon={<BarChart3 className="h-4 w-4" />} label="Tests" value={<CountUp value={data.stats.totalAttempts} />} />
            <Kpi icon={<Trophy className="h-4 w-4" />} label="Avg Score" value={<CountUp value={data.stats.averageScore} decimals={1} suffix="%" />} />
            <Kpi icon={<Award className="h-4 w-4" />} label="Accuracy" value={<CountUp value={data.stats.averageAccuracy} decimals={1} suffix="%" />} />
            <Kpi
              icon={<Trophy className="h-4 w-4" />}
              label="Rank"
              value={v.showLeaderboard && data.competitive ? `#${data.competitive.rank}` : '—'}
            />
          </div>
        </Reveal>
      ) : null}

      {xpBreakdown.length ? (
        <Reveal>
          <article className="surface-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="inline-flex items-center gap-2 text-base font-black text-slate-900">
                <Zap className="h-4 w-4 text-amber-500" /> XP sources
              </h3>
              <span className="text-xs font-bold text-slate-400">Exact earned totals</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {xpBreakdown.map((item) => (
                <div key={item.label} className="rounded-xl border border-blue-100 bg-gradient-to-br from-white to-blue-50 px-3 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{item.label}</p>
                  <p className="mt-1 text-lg font-black text-slate-900">{item.amount.toLocaleString()} XP</p>
                </div>
              ))}
            </div>
          </article>
        </Reveal>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Skill performance */}
        {v.showResults ? (
          <Reveal>
            <article className="surface-card p-5">
              <h3 className="mb-2 inline-flex items-center gap-2 text-base font-black text-slate-900">
                <BarChart3 className="h-4 w-4 text-blue-600" /> Skill averages
              </h3>
              {data.skillAnalytics?.trackBreakdown.some((metric) => metric.attempts > 0) ? (
                <div className="mt-5 space-y-4">
                  {data.skillAnalytics.trackBreakdown
                    .filter((metric) => metric.attempts > 0)
                    .map((metric) => (
                      <div key={metric.key}>
                        <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                          <span className="font-bold text-slate-700">{metric.label}</span>
                          <span className="font-black text-blue-600">{metric.accuracy.toFixed(1)}%</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-blue-50">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all"
                            style={{ width: `${Math.max(0, Math.min(100, metric.accuracy))}%` }}
                          />
                        </div>
                        <p className="mt-1 text-[10px] font-semibold text-slate-400">
                          {metric.attempts} {metric.attempts === 1 ? 'attempt' : 'attempts'} · skill power {metric.skillPower.toFixed(1)}
                        </p>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="flex min-h-[13rem] flex-col items-center justify-center text-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                    <BarChart3 className="h-5 w-5" />
                  </span>
                  <p className="mt-3 text-sm font-bold text-slate-600">No scored practice yet</p>
                  <p className="mt-1 max-w-xs text-xs text-slate-400">Completed IELTS and SAT results will appear here automatically.</p>
                </div>
              )}
            </article>
          </Reveal>
        ) : null}

        {/* Rank + university */}
        <div className="space-y-6">
          {v.showLeaderboard && data.competitive ? (
            <Reveal>
              <article className="surface-card flex items-center gap-4 p-5">
                <ProgressRing value={Math.min(100, data.competitive.rankingScore)} size={96} from="#f59e0b" to="#2563eb">
                  <div className="text-center leading-none">
                    <p className="text-xl font-black text-slate-900">#{data.competitive.rank}</p>
                    <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">rank</p>
                  </div>
                </ProgressRing>
                <div>
                  <h3 className="inline-flex items-center gap-2 text-base font-black text-slate-900">
                    <Trophy className="h-4 w-4 text-blue-600" /> Leaderboard
                  </h3>
                  <p className="mt-1 text-sm font-bold text-slate-700">{data.competitive.divisionLabel} division</p>
                  <p className="text-xs text-slate-500">Ranking score {Math.round(data.competitive.rankingScore)}</p>
                </div>
              </article>
            </Reveal>
          ) : null}

          {v.showUniversity && targetUniversity ? (
            <Reveal>
              <article className="surface-card min-h-[12rem] p-5">
                <img src="/assets/admission/campus-hero.webp" alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />
                <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/45" />
                <h3 className="relative inline-flex items-center gap-2 text-base font-black text-slate-900">
                  <GraduationCap className="h-4 w-4 text-blue-600" /> Dream university
                </h3>
                <button
                  onClick={() => navigate(`/admission/universities/${targetUniversity.slug}`)}
                  className="relative mt-7 flex w-full items-center justify-between gap-3 rounded-xl border border-white/80 bg-white/75 px-3 py-2.5 text-left shadow-lg backdrop-blur transition hover:border-blue-200"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{targetUniversity.name}</p>
                    <p className="text-xs text-slate-500">{targetUniversity.city}, {targetUniversity.country}{typeof targetUniversity.rank === 'number' ? ` · QS #${targetUniversity.rank}` : ''}</p>
                  </div>
                  <span className="text-xs font-bold text-blue-600">View</span>
                </button>
              </article>
            </Reveal>
          ) : null}
        </div>
      </div>

      {/* Badges showcase */}
      {v.showBadges && showcaseBadges.length ? (
        <Reveal>
          <article className="surface-card p-6">
            <h3 className="inline-flex items-center gap-2 text-base font-black text-slate-900">
              <Award className="h-4 w-4 text-blue-600" /> Achievement badges
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {showcaseBadges.map((b) => (
                <div key={b.id} className="flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-3">
                  <SkillBadge track={b.track} band={b.band} size={104} showBand />
                  <p className="mt-1 text-xs font-bold text-slate-800">{TRACK_META[b.track]?.short}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{TIER_NAME[b.tier]} · {formatAchievementScore(b.track, b.band)}</p>
                </div>
              ))}
            </div>
          </article>
        </Reveal>
      ) : null}
    </Shell>
  )
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="surface-card p-4">
      <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-blue-600">{icon} {label}</span>
      <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
    </div>
  )
}
