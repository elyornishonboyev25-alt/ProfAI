import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, BrainCircuit, CheckCircle2, Clock3, Target, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '@/lib/apiClient'
import type { ProfileOverview } from '@/types/platform'

export default function SATMistakes() {
  const navigate = useNavigate()
  const [overview, setOverview] = useState<ProfileOverview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    apiClient
      .get<ProfileOverview>('/profile/overview')
      .then((value) => {
        if (active) setOverview(value)
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const attempts = useMemo(
    () => (overview?.recentAttempts ?? []).filter((attempt) => attempt.test.category === 'SAT'),
    [overview?.recentAttempts],
  )

  const average = attempts.length
    ? attempts.reduce((sum, attempt) => sum + attempt.finalScore, 0) / attempts.length
    : 0

  return (
    <div className="workspace-page relative min-h-screen overflow-hidden px-4 py-7 sm:px-6 lg:px-8">
      <div className="relative mx-auto max-w-6xl space-y-5">
        <section className="rounded-[2rem] border border-white/90 bg-white/75 p-6 shadow-[0_24px_60px_rgba(37,99,235,0.12)] backdrop-blur-2xl sm:p-8">
          <button onClick={() => navigate('/sat')} className="route-back-button">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to SAT Prep
          </button>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">SAT-only workspace</p>
              <h1 className="mt-1 text-4xl font-black tracking-tight text-slate-950">Analyze SAT Mistakes</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Only SAT attempts appear here. IELTS Reading and Writing reviews stay inside IELTS Prep, so the two exam workflows never mix.</p>
            </div>
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-[0_14px_30px_rgba(37,99,235,.3)]">
              <BrainCircuit className="h-6 w-6" />
            </span>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          {[
            { label: 'SAT attempts', value: attempts.length.toString(), icon: CheckCircle2 },
            { label: 'Average score', value: attempts.length ? `${average.toFixed(0)}%` : '—', icon: Target },
            { label: 'Recovery queue', value: attempts.length ? `${Math.max(1, attempts.length * 3)}` : '0', icon: TrendingUp },
          ].map((metric) => {
            const Icon = metric.icon
            return (
              <article key={metric.label} className="rounded-2xl border border-white bg-white/75 p-4 shadow-[0_12px_30px_rgba(37,99,235,.08)] backdrop-blur">
                <Icon className="h-4 w-4 text-blue-600" />
                <p className="mt-3 text-[10px] font-black uppercase tracking-wider text-slate-400">{metric.label}</p>
                <p className="mt-1 text-2xl font-black text-slate-950">{metric.value}</p>
              </article>
            )
          })}
        </section>

        <section className="rounded-[2rem] border border-white/90 bg-white/78 p-5 shadow-[0_22px_55px_rgba(37,99,235,.1)] backdrop-blur-2xl sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-blue-600">Attempt history</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">Your SAT review queue</h2>
            </div>
            <Clock3 className="h-5 w-5 text-blue-500" />
          </div>

          <div className="mt-4 space-y-2.5">
            {loading ? (
              <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-8 text-center text-sm font-semibold text-slate-500">Loading SAT attempts…</div>
            ) : attempts.length ? (
              attempts.map((attempt) => (
                <article key={attempt.id} className="grid gap-3 rounded-2xl border border-slate-100 bg-white p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
                  <div>
                    <p className="text-sm font-black text-slate-900">{attempt.test.title}</p>
                    <p className="mt-1 text-[11px] font-semibold text-slate-400">{new Date(attempt.completedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <div className="rounded-xl bg-blue-50 px-3 py-2 text-center">
                    <p className="text-[9px] font-black uppercase text-blue-500">Score</p>
                    <p className="text-sm font-black text-blue-800">{attempt.finalScore.toFixed(0)}%</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2 text-center">
                    <p className="text-[9px] font-black uppercase text-slate-400">Accuracy</p>
                    <p className="text-sm font-black text-slate-800">{attempt.percentage.toFixed(0)}%</p>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-[1.7rem] border border-dashed border-blue-200 bg-blue-50/45 px-5 py-12 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm"><BrainCircuit className="h-5 w-5" /></span>
                <h3 className="mt-4 text-lg font-black text-slate-900">No SAT mistakes yet</h3>
                <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-500">Complete a full SAT mock and its missed questions will automatically appear in this SAT-only recovery workspace.</p>
                <button onClick={() => navigate('/sat')} className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white shadow-[0_10px_24px_rgba(37,99,235,.25)]">Choose a full mock</button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
