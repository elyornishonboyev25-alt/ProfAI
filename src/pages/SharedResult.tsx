import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Share2,
  Sparkles,
  Target,
  TriangleAlert,
} from 'lucide-react'

import { getSharedResult, type PublicSharedResult } from '@/lib/sharedResultsApi'
import { useToastStore } from '@/store/toastStore'
import { ProfileAvatar } from '@/components/profile/ProfileAvatar'

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return `${minutes}m ${String(remainder).padStart(2, '0')}s`
}

export default function SharedResult() {
  const { shareId = '' } = useParams()
  const pushToast = useToastStore((state) => state.pushToast)
  const [result, setResult] = useState<PublicSharedResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(false)

    void getSharedResult(shareId)
      .then(({ result: payload }) => {
        if (active) setResult(payload)
      })
      .catch(() => {
        if (active) setError(true)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [shareId])

  const learnerName = result?.user.nickname ? `@${result.user.nickname}` : result?.user.fullName
  const attempted = useMemo(
    () => result ? new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(result.attemptedAt)) : '',
    [result],
  )

  const shareAgain = async () => {
    if (!result) return
    const payload = {
      title: `${learnerName}'s IELTS result`,
      text: `${result.testTitle}: Band ${result.bandScore.toFixed(1)}`,
      url: window.location.href,
    }

    try {
      if (navigator.share) {
        await navigator.share(payload)
      } else {
        await navigator.clipboard.writeText(payload.url)
        pushToast({ type: 'success', title: 'Link copied', message: 'The result link is ready to share.' })
      }
    } catch (shareError) {
      if (shareError instanceof DOMException && shareError.name === 'AbortError') return
      pushToast({ type: 'error', title: 'Could not share', message: 'Please copy the page address from your browser.' })
    }
  }

  if (loading) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
        <div className="relative z-10 rounded-3xl border border-white/90 bg-white/75 px-8 py-7 text-center shadow-2xl backdrop-blur-2xl">
          <span className="mx-auto block h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
          <p className="mt-4 text-sm font-bold text-slate-600">Opening verified result…</p>
        </div>
      </main>
    )
  }

  if (error || !result) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
        <div className="relative z-10 max-w-md rounded-[2rem] border border-white/90 bg-white/80 p-8 text-center shadow-2xl backdrop-blur-2xl">
          <TriangleAlert className="mx-auto h-11 w-11 text-indigo-600" />
          <h1 className="mt-4 text-2xl font-black text-slate-950">This result is unavailable</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">The link may be incomplete or the result may no longer exist.</p>
          <Link to="/" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-black text-white">Explore ProfAI <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </main>
    )
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="relative z-10 mx-auto max-w-6xl">
        <section className="relative overflow-hidden rounded-[2.25rem] border border-white/90 bg-white/68 p-6 shadow-[0_30px_80px_rgba(79,70,229,0.16)] backdrop-blur-2xl sm:p-9">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-indigo-200/45 blur-3xl" />
          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-xl border border-white/90 bg-white/72 px-4 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-indigo-600 shadow-sm">
                <GraduationCap className="h-4 w-4" /> Verified learning result
              </span>
              <div className="mt-5 flex items-center gap-3">
                <ProfileAvatar src={result.user.avatarUrl} alt="" className="h-12 w-12 rounded-2xl border border-white shadow-md" />
                <div>
                  <p className="font-black text-slate-950">{learnerName}</p>
                  <p className="text-xs font-semibold text-slate-500">Shared from ProfAI</p>
                </div>
              </div>
              <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[0.98] tracking-[-0.045em] text-slate-950 sm:text-6xl">
                {result.testTitle}
              </h1>
              <p className="mt-3 text-sm font-semibold text-slate-500">Completed {attempted}</p>
            </div>

            <div className="flex items-end gap-3">
              <div className="rounded-[1.8rem] border border-white/90 bg-gradient-to-br from-indigo-600 via-blue-500 to-orange-500 px-7 py-5 text-white shadow-[0_18px_42px_rgba(225,29,72,0.3)]">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/75">IELTS band</p>
                <p className="mt-1 text-5xl font-black tracking-tight">{result.bandScore.toFixed(1)}</p>
              </div>
              <button type="button" onClick={shareAgain} aria-label="Share this result" className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/90 bg-white/78 text-indigo-600 shadow-lg transition hover:-translate-y-1 hover:bg-white">
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
          <div className="rounded-[2rem] border border-white/90 bg-white/72 p-5 shadow-[0_22px_58px_rgba(15,23,42,0.09)] backdrop-blur-2xl sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.17em] text-indigo-600">Performance</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">A clear look at the attempt</h2>
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">{result.accuracy}% accuracy</span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Correct', value: result.correctAnswers, icon: CheckCircle2, tone: 'text-emerald-600' },
                { label: 'Incorrect', value: result.incorrectAnswers, icon: Target, tone: 'text-indigo-600' },
                { label: 'Skipped', value: result.skippedAnswers, icon: Sparkles, tone: 'text-amber-600' },
                { label: 'Time', value: formatTime(result.timeSpentSec), icon: Clock3, tone: 'text-blue-600' },
              ].map((metric) => {
                const Icon = metric.icon
                return (
                  <article key={metric.label} className="rounded-2xl border border-white bg-white/78 p-4 shadow-sm">
                    <Icon className={`h-5 w-5 ${metric.tone}`} />
                    <p className="mt-3 text-2xl font-black text-slate-950">{metric.value}</p>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-400">{metric.label}</p>
                  </article>
                )
              })}
            </div>

            {result.sectionSummaries.length > 0 ? (
              <div className="mt-6 space-y-3">
                {result.sectionSummaries.map((section) => (
                  <div key={section.title} className="rounded-2xl border border-indigo-100/80 bg-white/62 p-4">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-black text-slate-800">{section.title}</span>
                      <span className="font-black text-indigo-600">{section.correctAnswers}/{section.totalQuestions} · {section.accuracy}%</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-indigo-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-indigo-600 via-blue-500 to-orange-400" style={{ width: `${section.accuracy}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <aside className="rounded-[2rem] border border-white/90 bg-white/72 p-5 shadow-[0_22px_58px_rgba(15,23,42,0.09)] backdrop-blur-2xl sm:p-7">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-700 text-white shadow-lg"><Sparkles className="h-5 w-5" /></span>
            <h2 className="mt-4 text-2xl font-black text-slate-950">Next best moves</h2>
            <div className="mt-5 space-y-3">
              {result.recommendations.map((recommendation, index) => (
                <div key={recommendation} className="flex gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/55 p-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-indigo-600 shadow-sm">{index + 1}</span>
                  <p className="text-sm font-semibold leading-5 text-slate-600">{recommendation}</p>
                </div>
              ))}
            </div>
            <Link to="/login" className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-5 text-sm font-black text-white shadow-[0_14px_30px_rgba(225,29,72,0.26)] transition hover:-translate-y-0.5">
              Start your own journey <ArrowRight className="h-4 w-4" />
            </Link>
          </aside>
        </section>
      </div>
    </main>
  )
}
