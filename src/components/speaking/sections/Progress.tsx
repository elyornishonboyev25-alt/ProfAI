import { useCopy } from '@/i18n/interface'
import UiText from '@/components/common/UiText'
import { useMemo } from 'react'
import {
  Award,
  BarChart3,
  Clock3,
  Flame,
  Headphones,
  Lock,
  Mic,
  Radar as RadarIcon,
  Sparkles,
  Trophy,
  Wand2,
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
  selectUserSessions,
  useSpeakingStore,
} from '@/store/speakingStore'
import { xpForBand } from '@/lib/speakingScoring'
import { CountUp, Reveal } from '@/components/fx'

// "My Progress" section — the personal speaking dashboard (real data from the store).
export default function Progress({ onStart }: { onStart: () => void }) {
  const { c: uiCopy } = useCopy()
  const user = useAuthStore((state: AuthState) => state.user)
  const sessions = useSpeakingStore((s) => s.sessions)

  const userSessions = useMemo(() => selectUserSessions(sessions, user?.id ?? null), [sessions, user?.id])
  const summary = useMemo(() => computeSummary(userSessions), [userSessions])
  const speakingXp = useMemo(() => userSessions.reduce((a, s) => a + xpForBand(s.overallBand), 0), [userSessions])
  const bandTrend = useMemo(() => computeBandTrend(userSessions), [userSessions])
  const skillRadar = useMemo(() => computeSkillRadar(userSessions), [userSessions])
  const dailyActivity = useMemo(() => computeDailyActivity(userSessions), [userSessions])
  const criteria = useMemo(() => computeCriteriaBreakdown(userSessions), [userSessions])
  const recent = useMemo(() => [...userSessions].reverse().slice(0, 6), [userSessions])

  if (userSessions.length === 0) {
    return (
      <Reveal>
        <section className="surface-card flex flex-col items-center p-10 text-center">
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-[0_16px_32px_rgba(220,38,38,0.3)]">
            <Mic className="h-8 w-8" />
          </span>
          <h2 className="mt-4 text-2xl font-black text-slate-900"><UiText text={"Your progress starts here"} /></h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
            <UiText text={"Finish an AI Full Mock and your band trend, skill radar, speaking time and achievements will appear here."} />
          </p>
          <button onClick={onStart} className="arena-primary-btn cta-sheen mt-6 px-6 py-3">
            <Wand2 className="mr-2 h-5 w-5" /> <UiText text={"Take a Full Mock"} />
          </button>
        </section>
      </Reveal>
    )
  }

  const badges = computeBadges(summary)

  return (
    <Reveal>
      <section className="space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Kpi icon={<Trophy className="h-4 w-4" />} label={uiCopy("Best Band")} value={summary.bestBand.toFixed(1)} />
          <Kpi icon={<Sparkles className="h-4 w-4" />} label={uiCopy("Speaking XP")} value={<CountUp value={speakingXp} />} />
          <Kpi icon={<Headphones className="h-4 w-4" />} label={uiCopy("Sessions")} value={<CountUp value={summary.sessionCount} />} />
          <Kpi icon={<Flame className="h-4 w-4" />} label={uiCopy("Streak")} value={`${summary.currentStreak}d`} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title={uiCopy("Band Trend")} icon={<BarChart3 className="h-4 w-4 text-red-600" />}>
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

          <ChartCard title={uiCopy("Skill Radar")} icon={<RadarIcon className="h-4 w-4 text-red-600" />}>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={skillRadar}>
                <PolarGrid stroke="#fecaca" />
                <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: '#64748b' }} />
                <Radar dataKey="band" stroke="#dc2626" fill="#ef4444" fillOpacity={0.45} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title={uiCopy("Speaking Activity (7 days)")} icon={<Clock3 className="h-4 w-4 text-red-600" />}>
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

          <ChartCard title={uiCopy("Criteria Breakdown")} icon={<RadarIcon className="h-4 w-4 text-red-600" />}>
            <ResponsiveContainer width="100%" height={220}>
              <RadialBarChart data={criteria} innerRadius="25%" outerRadius="100%" startAngle={90} endAngle={-270}>
                <RadialBar background dataKey="band" cornerRadius={8} />
                <Tooltip />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {criteria.map((c) => (
                <span key={c.criterion} className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.fill }} /> <UiText text={c.criterion} /> {c.band.toFixed(1)}
                </span>
              ))}
            </div>
          </ChartCard>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="surface-card p-5">
            <h3 className="inline-flex items-center gap-2 text-base font-black text-slate-900">
              <Award className="h-4 w-4 text-amber-500" /> <UiText text={"Achievements"} />
            </h3>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {badges.map((b) => (
                <div
                  key={b.label}
                  className={`rounded-2xl border p-3 text-center ${
                    b.unlocked ? 'border-amber-200 bg-gradient-to-br from-amber-50 to-white' : 'border-slate-100 bg-slate-50/60 opacity-60'
                  }`}
                >
                  <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full">
                    {b.unlocked ? <span className="text-xl">{b.emoji}</span> : <Lock className="h-4 w-4 text-slate-400" />}
                  </div>
                  <p className="mt-1 text-[11px] font-bold text-slate-700"><UiText text={b.label} /></p>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-card p-5">
            <h3 className="inline-flex items-center gap-2 text-base font-black text-slate-900">
              <Headphones className="h-4 w-4 text-red-600" /> <UiText text={"Recent Sessions"} />
            </h3>
            <div className="mt-3 space-y-2">
              {recent.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-xl border border-red-50 bg-white px-3 py-2">
                  <div>
                    <p className="text-sm font-bold text-slate-900"><UiText text={s.modeLabel} /></p>
                    <p className="text-[11px] text-slate-500">{new Date(s.date).toLocaleDateString()} · {Math.round(s.durationSec / 60)} <UiText text={"min"} /></p>
                  </div>
                  <span className="rounded-full bg-gradient-to-r from-red-600 to-rose-600 px-3 py-1 text-sm font-black text-white">
                    {s.overallBand.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Reveal>
  )
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="surface-card p-4">
      <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-red-600">{icon} <UiText text={label} /></span>
      <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
    </div>
  )
}

function ChartCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="surface-card p-5">
      <h3 className="mb-2 inline-flex items-center gap-2 text-sm font-black text-slate-900">{icon} <UiText text={title} /></h3>
      {children}
    </div>
  )
}

function computeBadges(summary: ReturnType<typeof computeSummary>) {
  return [
    { label: 'First Words', emoji: '🎙️', unlocked: summary.sessionCount >= 1 },
    { label: '10 Sessions', emoji: '🔥', unlocked: summary.sessionCount >= 10 },
    { label: 'Band 7 Club', emoji: '🏅', unlocked: summary.bestBand >= 7 },
    { label: '7-Day Streak', emoji: '⚡', unlocked: summary.currentStreak >= 7 },
    { label: '30-Day Streak', emoji: '🌟', unlocked: summary.currentStreak >= 30 },
    { label: '100-Day Streak', emoji: '👑', unlocked: summary.currentStreak >= 100 },
  ]
}
