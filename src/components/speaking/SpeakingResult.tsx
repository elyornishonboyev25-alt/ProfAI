import { motion } from 'framer-motion'
import {
  ArrowLeft,
  BookOpen,
  Gauge,
  Lightbulb,
  RotateCcw,
  Sparkles,
  TrendingUp,
  TriangleAlert,
} from 'lucide-react'
import type { ExaminerTurn, SpeakingEvaluation } from '@/services/speakingAI'
import { Burst } from '@/components/fx'
import BandGauge from './BandGauge'

const CRITERIA: Array<{ key: keyof SpeakingEvaluation; label: string }> = [
  { key: 'fluencyBand', label: 'Fluency & Coherence' },
  { key: 'lexicalBand', label: 'Lexical Resource' },
  { key: 'grammarBand', label: 'Grammar' },
  { key: 'pronunciationBand', label: 'Pronunciation' },
]

// The AI sometimes returns raw JSON field names as the "area" — show friendly labels.
const AREA_LABELS: Record<string, string> = {
  fluencyBand: 'Fluency & Coherence',
  lexicalBand: 'Lexical Resource',
  grammarBand: 'Grammar',
  pronunciationBand: 'Pronunciation',
  overallBand: 'Overall',
}
function niceArea(area: string): string {
  return AREA_LABELS[area] ?? area
}

function bandWord(band: number): string {
  if (band >= 8) return 'Excellent'
  if (band >= 7) return 'Good'
  if (band >= 6) return 'Competent'
  if (band >= 5) return 'Modest'
  return 'Developing'
}

export default function SpeakingResult({
  evaluation,
  modeLabel,
  transcript,
  reviewMode = false,
  onRetry,
  onRegrade,
  onExit,
}: {
  evaluation: SpeakingEvaluation
  modeLabel: string
  transcript?: ExaminerTurn[]
  reviewMode?: boolean
  onRetry: () => void
  onRegrade?: () => void
  onExit: () => void
}) {
  const stats = evaluation.stats

  return (
    <div className="speaking-result-page mx-auto max-w-5xl px-4 pb-10 sm:px-6">
      <button onClick={onExit} className="premium-back-btn mb-4">
        <ArrowLeft className="h-3.5 w-3.5" /> {reviewMode ? 'Close review' : 'Back to Speaking Hub'}
      </button>

      {/* Overall band hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2rem] border border-red-100 bg-gradient-to-br from-white via-red-50/40 to-rose-50/60 p-6 text-center shadow-[0_24px_60px_rgba(220,38,38,0.14)] sm:p-8"
      >
        <Burst count={26} play />
        <span className="soft-chip mx-auto">{modeLabel}</span>
        <p className="mt-3 text-sm font-semibold uppercase tracking-[0.16em] text-red-600">Overall Band</p>
        <div className="mt-2 flex items-center justify-center">
          <BandGauge band={evaluation.overallBand} size={150} />
        </div>
        <p className="mt-1 text-lg font-black text-slate-900">{evaluation.overallBand === 0 ? 'No assessable speech captured' : `${bandWord(evaluation.overallBand)} performance`}</p>
        {evaluation.source === 'offline' ? (
          <span className="mt-2 inline-block rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700">
            {stats.wordCount === 0 ? 'Check your microphone and try again' : 'Offline estimate — try again for full AI grading'}
          </span>
        ) : (
          <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
            <Sparkles className="h-3 w-3" /> AI examiner assessment
          </span>
        )}
      </motion.div>

      <p className="mt-3 text-center text-xs leading-5 text-slate-500">IELTS-style practice estimate from your transcribed answers. Pronunciation needs audio or examiner review; this is not an official IELTS score.</p>
      {evaluation.source === 'offline' && onRegrade && !reviewMode ? <div className="surface-card mt-4 p-4 text-center"><p className="mb-3 text-sm text-slate-600">Your answers are kept in this session. Retry AI feedback without taking the test again.</p><button onClick={onRegrade} className="speaking-record-button"><Sparkles className="h-4 w-4" /> Retry AI feedback</button></div> : null}

      {/* Criteria gauges */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {CRITERIA.map(({ key, label }) => (
          <div key={key} className="surface-card flex flex-col items-center p-4">
            <BandGauge band={evaluation[key] as number} size={84} />
            <p className="mt-2 text-center text-xs font-semibold text-slate-600">{label}</p>
            {key === 'pronunciationBand' ? <p className="mt-1 text-center text-[10px] text-amber-700">Transcript estimate</p> : null}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="surface-card mt-5 p-5">
        <h3 className="inline-flex items-center gap-2 text-base font-black text-slate-900">
          <Gauge className="h-4 w-4 text-red-600" /> Examiner’s Verdict
        </h3>
        <p className="mt-2 text-sm leading-7 text-slate-700">{evaluation.summary}</p>
      </div>

      {/* Strengths + Weaknesses */}
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="surface-card p-5">
          <h3 className="inline-flex items-center gap-2 text-base font-black text-emerald-700">
            <TrendingUp className="h-4 w-4" /> Strengths
          </h3>
          <ul className="mt-3 space-y-2">
            {evaluation.strengths.map((s, i) => (
              <li key={i} className="flex gap-2 rounded-xl border border-emerald-100 bg-emerald-50/50 px-3 py-2 text-sm text-slate-700">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                {s}
              </li>
            ))}
            {evaluation.strengths.length === 0 ? <li className="text-sm text-slate-500">—</li> : null}
          </ul>
        </div>
        <div className="surface-card p-5">
          <h3 className="inline-flex items-center gap-2 text-base font-black text-red-700">
            <TriangleAlert className="h-4 w-4" /> Areas to Improve
          </h3>
          <ul className="mt-3 space-y-2">
            {evaluation.weaknesses.map((w, i) => (
              <li key={i} className="flex gap-2 rounded-xl border border-red-100 bg-red-50/50 px-3 py-2 text-sm text-slate-700">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                {w}
              </li>
            ))}
            {evaluation.weaknesses.length === 0 ? <li className="text-sm text-slate-500">—</li> : null}
          </ul>
        </div>
      </div>

      {/* Improvement priorities */}
      {evaluation.improvementPriorities.length > 0 ? (
        <div className="surface-card mt-5 p-5">
          <h3 className="inline-flex items-center gap-2 text-base font-black text-slate-900">
            <Lightbulb className="h-4 w-4 text-amber-500" /> Your Improvement Plan
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {evaluation.improvementPriorities.map((p, i) => (
              <div key={i} className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/60 to-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-900">{niceArea(p.area)}</p>
                  <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-bold text-white">→ {p.target.toFixed(1)}</span>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-600">{p.action}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {transcript?.length ? (
        <details className="surface-card mt-5 p-5" open={reviewMode}>
          <summary className="flex cursor-pointer items-center gap-2 text-base font-black text-slate-900"><BookOpen className="h-4 w-4 text-red-600" /> Review your answers</summary>
          <div className="mt-4 space-y-3">
            {transcript.filter((turn) => turn.role === 'candidate').map((turn, index) => {
              const question = transcript.slice(0, transcript.indexOf(turn)).reverse().find((item) => item.role === 'examiner')
              return <div key={`${index}-${turn.text.slice(0, 12)}`} className="rounded-2xl border border-red-100 bg-white/80 p-4 text-sm">
                <p className="text-xs font-black uppercase tracking-wide text-red-600">Question {index + 1}</p>
                <p className="mt-1 font-semibold leading-6 text-slate-800">{question?.text || 'Examiner question'}</p>
                <p className="mt-2 border-l-2 border-red-300 pl-3 leading-6 text-slate-600">{turn.text || 'No clear speech captured for this question.'}</p>
              </div>
            })}
          </div>
        </details>
      ) : null}

      {/* Speech stats */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Words spoken" value={String(stats.wordCount)} />
        <StatCard label="Speaking pace" value={`${stats.wordsPerMinute} wpm`} />
        <StatCard label="Filler words" value={String(stats.fillerCount)} tone={stats.fillerCount > 5 ? 'warn' : 'ok'} />
        <StatCard label="Lexical variety" value={`${Math.round(stats.typeTokenRatio * 100)}%`} />
      </div>
      {stats.fillerWords.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Detected fillers:</span>
          {stats.fillerWords.map((f) => (
            <span key={f} className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
              {f}
            </span>
          ))}
        </div>
      ) : null}

      {/* Actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        {!reviewMode ? <button onClick={onRetry} className="arena-primary-btn cta-sheen px-6 py-3">
          <RotateCcw className="mr-2 h-4 w-4" /> Practice again
        </button> : null}
        <button onClick={onExit} className="arena-secondary-btn px-6 py-3">
          {reviewMode ? 'Close review' : 'Back to Speaking Hub'}
        </button>
      </div>
    </div>
  )
}

function StatCard({ label, value, tone = 'ok' }: { label: string; value: string; tone?: 'ok' | 'warn' }) {
  return (
    <div className="surface-card p-4 text-center">
      <p className={`text-2xl font-black ${tone === 'warn' ? 'text-red-600' : 'text-slate-900'}`}>{value}</p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  )
}
