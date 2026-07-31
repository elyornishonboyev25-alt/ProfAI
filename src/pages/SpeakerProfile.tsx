import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  AtSign,
  BadgeCheck,
  BarChart3,
  Flame,
  Gauge,
  Headphones,
  Mic,
  Radar as RadarIcon,
  Trophy,
  Zap,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useAuthStore, type AuthState } from '@/store/authStore'
import {
  computeBandTrend,
  computeCriteriaBreakdown,
  computeDailyActivity,
  computeSkillRadar,
  computeSummary,
  type SpeakingSessionRecord,
} from '@/store/speakingStore'
import { fetchSpeakerByNickname, type SpeakerProfilePayload } from '@/lib/speakingApi'
import { initialsOf } from '@/store/speakerSocialStore'
import { lastSeenLabel } from '@/components/speaking/SpeakerDirectory'
import { CountUp, ProgressRing, Reveal } from '@/components/fx'

export default function SpeakerProfile() {
  const { id = 'me' } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore((state: AuthState) => state.user)

  const nickname = id === 'me' ? user?.nickname ?? null : id
  const isSelf = id === 'me' || (!!user?.nickname && id === user.nickname)

  const [data, setData] = useState<SpeakerProfilePayload | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user || !nickname) return
    let active = true
    setLoading(true)
    setError(null)
    fetchSpeakerByNickname(nickname)
      .then((payload) => active && setData(payload))
      .catch((e) => active && setError(e instanceof Error ? e.message : 'Could not load this profile.'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [user, nickname])

  const records: SpeakingSessionRecord[] = useMemo(() => {
    if (!data) return []
    return data.sessions.map((s) => ({
      id: s.id,
      userId: data.profile.id,
      date: s.createdAt,
      modeLabel: s.modeLabel,
      kind: 'examiner',
      overallBand: s.overallBand,
      fluencyBand: s.fluencyBand,
      lexicalBand: s.lexicalBand,
      grammarBand: s.grammarBand,
      pronunciationBand: s.pronunciationBand,
      durationSec: s.durationSec,
      wordCount: s.wordCount,
      fillerCount: 0,
      summary: '',
    }))
  }, [data])

  const summary = useMemo(() => computeSummary(records), [records])

  // ── Guards ────────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <Shell onBack={() => navigate('/dashboard')}>
        <Info text="Sign in to view speaker profiles." />
      </Shell>
    )
  }
  if (id === 'me' && !user.nickname) {
    return (
      <Shell onBack={() => navigate('/dashboard')}>
        <div className="surface-card flex flex-col items-center p-10 text-center">
          <AtSign className="h-10 w-10 text-red-400" />
          <h2 className="mt-3 text-xl font-black text-slate-900">Choose a nickname first</h2>
          <p className="mt-1 max-w-sm text-sm text-slate-600">Your public profile uses your nickname. Set one to appear in the community and share your progress.</p>
        </div>
      </Shell>
    )
  }
  if (loading) return <Shell onBack={() => navigate('/dashboard')}><Info text="Loading profile…" /></Shell>
  if (error || !data) return <Shell onBack={() => navigate('/dashboard')}><Info text={error ?? 'Profile not found.'} /></Shell>

  const p = data.profile
  const percentile = p.rank && p.totalSpeakers ? Math.max(1, Math.round(100 - ((p.rank - 1) / p.totalSpeakers) * 100)) : null

  return (
    <Shell onBack={() => navigate('/dashboard')}>
      {/* Identity hero */}
      <Reveal>
        <section className="premium-hero p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-red-600 to-rose-600 text-3xl font-black text-white shadow-[0_16px_36px_rgba(220,38,38,0.32)]">
                {initialsOf(p.displayName)}
              </div>
              <span className={`absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-4 border-white ${p.online ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-black tracking-tight text-slate-900">{p.displayName}</h1>
                {isSelf ? <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">YOU</span> : null}
                {p.nickname ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-white px-2 py-0.5 text-xs font-semibold text-red-700">
                    <BadgeCheck className="h-3.5 w-3.5" /> @{p.nickname}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {p.online ? <span className="text-emerald-600">● Online now</span> : `Last seen ${lastSeenLabel(p.lastSeen)}`}
                {' · '}Member since {new Date(p.memberSince).toLocaleDateString()}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Pill icon={<Trophy className="h-3.5 w-3.5" />} label={p.rank ? `Speaking rank #${p.rank}` : 'Unranked'} />
                <Pill icon={<Mic className="h-3.5 w-3.5" />} label={`Best band ${summary.bestBand.toFixed(1)}`} />
                <Pill icon={<Flame className="h-3.5 w-3.5" />} label={`${p.streak} day streak`} />
                <Pill icon={<Zap className="h-3.5 w-3.5" />} label={`Level ${p.level}`} />
              </div>
            </div>

            <div className="flex flex-col items-center rounded-3xl border border-red-100 bg-white/80 p-4">
              <ProgressRing value={percentile ?? 0} size={104} from="#f59e0b" to="#dc2626">
                <div className="text-center leading-none">
                  <p className="text-xl font-black text-slate-900">{p.rank ? `#${p.rank}` : '—'}</p>
                  <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">of {p.totalSpeakers}</p>
                </div>
              </ProgressRing>
              <p className="mt-2 text-[11px] font-semibold text-slate-500">{percentile !== null ? `Top ${100 - percentile + 1}%` : 'No sessions yet'}</p>
            </div>
          </div>
        </section>
      </Reveal>

      {records.length === 0 ? (
        <div className="surface-card mt-5 flex flex-col items-center p-10 text-center">
          <Headphones className="h-10 w-10 text-red-300" />
          <h2 className="mt-3 text-xl font-black text-slate-900">No speaking sessions yet</h2>
          <p className="mt-1 text-sm text-slate-600">{isSelf ? 'Take a Full Mock to start building your profile.' : 'This speaker hasn’t completed a graded session yet.'}</p>
        </div>
      ) : (
        <RealCharts records={records} summary={summary} />
      )}
    </Shell>
  )
}

function RealCharts({ records, summary }: { records: SpeakingSessionRecord[]; summary: ReturnType<typeof computeSummary> }) {
  const bandTrend = useMemo(() => computeBandTrend(records), [records])
  const skillRadar = useMemo(() => computeSkillRadar(records), [records])
  const dailyActivity = useMemo(() => computeDailyActivity(records), [records])
  const criteria = useMemo(() => computeCriteriaBreakdown(records), [records])
  const recent = useMemo(() => [...records].reverse().slice(0, 6), [records])

  return (
    <Reveal>
      <section className="mt-5 space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Kpi icon={<Trophy className="h-4 w-4" />} label="Best Band" value={summary.bestBand.toFixed(1)} />
          <Kpi icon={<Gauge className="h-4 w-4" />} label="Avg Band" value={summary.averageBand.toFixed(1)} />
          <Kpi icon={<Headphones className="h-4 w-4" />} label="Sessions" value={<CountUp value={summary.sessionCount} />} />
          <Kpi icon={<Mic className="h-4 w-4" />} label="Minutes" value={<CountUp value={summary.totalMinutes} />} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Band Trend" icon={<BarChart3 className="h-4 w-4 text-red-600" />}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={bandTrend} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#fee2e2" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis domain={[0, 9]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip />
                <Line type="monotone" dataKey="band" stroke="#dc2626" strokeWidth={3} dot={{ r: 4, fill: '#dc2626' }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Skill Radar" icon={<RadarIcon className="h-4 w-4 text-red-600" />}>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={skillRadar}>
                <PolarGrid stroke="#fecaca" />
                <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: '#64748b' }} />
                <Radar dataKey="band" stroke="#dc2626" fill="#ef4444" fillOpacity={0.45} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Speaking Activity (7 days)" icon={<BarChart3 className="h-4 w-4 text-red-600" />}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dailyActivity} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#fee2e2" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip />
                <Bar dataKey="minutes" radius={[6, 6, 0, 0]} fill="#f43f5e" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Criteria Breakdown" icon={<RadarIcon className="h-4 w-4 text-red-600" />}>
            <ResponsiveContainer width="100%" height={220}>
              <RadialBarChart data={criteria} innerRadius="25%" outerRadius="100%" startAngle={90} endAngle={-270}>
                <RadialBar background dataKey="band" cornerRadius={8} />
                <Tooltip />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {criteria.map((c) => (
                <span key={c.criterion} className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.fill }} /> {c.criterion} {c.band.toFixed(1)}
                </span>
              ))}
            </div>
          </ChartCard>
        </div>

        <div className="surface-card p-5">
          <h3 className="inline-flex items-center gap-2 text-base font-black text-slate-900">
            <Headphones className="h-4 w-4 text-red-600" /> Recent Sessions
          </h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {recent.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-xl border border-red-50 bg-white px-3 py-2">
                <div>
                  <p className="text-sm font-bold text-slate-900">{s.modeLabel}</p>
                  <p className="text-[11px] text-slate-500">{new Date(s.date).toLocaleDateString()} · {Math.round(s.durationSec / 60)} min</p>
                </div>
                <span className="rounded-full bg-gradient-to-r from-red-600 to-rose-600 px-3 py-1 text-sm font-black text-white">
                  {s.overallBand.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Reveal>
  )
}

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

function Info({ text }: { text: string }) {
  return <div className="surface-card p-6 text-sm text-slate-600">{text}</div>
}

function Pill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-white px-3 py-1 text-xs font-bold text-slate-700">
      <span className="text-red-600">{icon}</span> {label}
    </span>
  )
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="surface-card p-4">
      <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-red-600">{icon} {label}</span>
      <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
    </div>
  )
}

function ChartCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="surface-card p-5">
      <h3 className="mb-2 inline-flex items-center gap-2 text-sm font-black text-slate-900">{icon} {title}</h3>
      {children}
    </div>
  )
}
