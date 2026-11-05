import { useCopy } from '@/i18n/interface'
import UiText from '@/components/common/UiText'
import TestLeaderboard from '@/components/results/TestLeaderboard'
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
import ImprovedResponse from '@/components/ielts/ImprovedResponse'

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
  testId,
  evaluation,
  modeLabel,
  transcript,
  reviewMode = false,
  onRetry,
  onRegrade,
  onExit,
  embedded = false,
  onImprovedAnswers,
}: {
  testId?: string
  evaluation: SpeakingEvaluation
  modeLabel: string
  transcript?: ExaminerTurn[]
  reviewMode?: boolean
  onRetry: () => void
  onRegrade?: () => void
  onExit: () => void
  hideVocabularyReview?: boolean
  embedded?: boolean
  onImprovedAnswers?: (answers: NonNullable<SpeakingEvaluation['improvedAnswers']>) => void
}) {
  const { c: uiCopy } = useCopy()
  const stats = evaluation.stats
  const unavailable = evaluation.source === 'offline'

  return (
    <div className={embedded ? 'speaking-result-embedded' : 'speaking-result-page mx-auto max-w-5xl px-4 pb-10 sm:px-6'}>
      {!embedded && <button onClick={onExit} className="premium-back-btn mb-4">
        <ArrowLeft className="h-3.5 w-3.5" /> {reviewMode ? <UiText text={"Close review"} /> : <UiText text={"Back to Speaking Hub"} />}
      </button>}

      {/* Overall band hero */}
      {!embedded && <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2rem] border border-red-100 bg-gradient-to-br from-white via-red-50/40 to-rose-50/60 p-6 text-center shadow-[0_24px_60px_rgba(220,38,38,0.14)] sm:p-8"
      >
        <Burst count={26} play />
        <span className="soft-chip mx-auto"><UiText text={modeLabel} /></span>
        <p className="mt-3 text-sm font-semibold uppercase tracking-[0.16em] text-red-600">{unavailable ? <UiText text={"Assessment unavailable"} /> : evaluation.assessmentMode === 'audio' ? <UiText text={"Estimated Speaking Band"} /> : <UiText text={"Text Practice Estimate"} />}</p>
        <div className="mt-2 flex items-center justify-center">
          {unavailable ? <span className="flex h-[150px] items-center text-6xl text-slate-400">—</span> : <BandGauge band={evaluation.overallBand} size={150} />}
        </div>
        <p className="mt-1 text-lg font-black text-slate-900">{unavailable ? <UiText text={"Retry assessment for your band"} /> : evaluation.overallBand === 0 ? <UiText text={"No assessable speech captured"} /> : <UiText text={"{{value1}} performance"} values={{ value1: String(bandWord(evaluation.overallBand)) }} />}</p>
        {evaluation.source === 'offline' ? (
          <span className="mt-2 inline-block rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700">
            {stats.wordCount === 0 ? <UiText text={"Check your microphone and try again"} /> : <UiText text={"Answers saved — retry grading"} />}
          </span>
        ) : (
          <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
            <Sparkles className="h-3 w-3" /> {evaluation.assessmentMode === 'audio' ? <UiText text={"AI audio assessment"} /> : <UiText text={"AI feedback on text"} />}
          </span>
        )}
      </motion.div>}

      <p className="mt-3 text-center text-xs leading-5 text-slate-500">{unavailable ? <UiText text={"No band was awarded. Your answers are available for another assessment."} /> : evaluation.assessmentMode === 'audio' ? <UiText text={"IELTS-style practice estimate using your answers and recordings. Four criteria carry equal weight. This is not an official IELTS score."} /> : <UiText text={"This estimate uses your transcribed answers. Pronunciation was not assessed; it needs audio or examiner review."} />}</p>
      <p className="mt-2 text-center"><a href="https://ielts.org/cdn/ielts-guides/ielts-speaking-band-descriptors.pdf" target="_blank" rel="noreferrer" className="text-xs font-semibold text-red-700 underline"><UiText text={"Official IELTS Speaking descriptors"} /></a></p>
      {evaluation.source === 'offline' && onRegrade && !reviewMode ? <div className="surface-card mt-4 p-4 text-center"><p role="alert" className="mb-2 text-sm text-slate-700">{evaluation.summary}</p><p className="mb-3 text-sm text-slate-600"><UiText text={"Retry AI feedback without taking the test again."} /></p><button onClick={onRegrade} className="speaking-record-button"><Sparkles className="h-4 w-4" /> <UiText text={"Retry AI feedback"} /></button></div> : null}

      {/* Criteria gauges */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {CRITERIA.map(({ key, label }) => (
          <div key={key} className="surface-card flex flex-col items-center p-4">
            {unavailable || key === 'pronunciationBand' && evaluation.assessmentMode !== 'audio' ? <span className="flex h-[84px] w-[84px] items-center justify-center text-3xl text-slate-400">—</span> : <BandGauge band={evaluation[key] as number} size={84} />}
            <p className="mt-2 text-center text-xs font-semibold text-slate-600"><UiText text={label} /></p>
            {key === 'pronunciationBand' ? <p className="mt-1 text-center text-[10px] text-amber-700">{evaluation.assessmentMode === 'audio' ? <UiText text={"Audio assessed"} /> : <UiText text={"Not assessed"} />}</p> : null}
          </div>
        ))}
      </div>

      {/* Summary */}
      {evaluation.evidence?.length ? <div className="surface-card mt-5 p-5"><h3 className="text-base font-bold text-slate-900"><UiText text={"Evidence and next practice"} /></h3><div className="mt-3 space-y-3">{evaluation.evidence.map((item, index) => <div key={index} className="rounded-xl border border-slate-200 p-3 text-sm"><p className="font-semibold capitalize text-slate-900"><UiText text={item.criterion} /> <UiText text={"· Answer"} /> {item.answerIndex + 1}</p>{item.quote ? <blockquote className="mt-1 border-l-2 border-red-300 pl-3 text-slate-600">“{item.quote}”</blockquote> : null}<p className="mt-2 leading-6 text-slate-700">{item.explanation}</p><p className="mt-1 leading-6 text-red-700"><UiText text={"Practice:"} /> {item.exercise}</p></div>)}</div></div> : null}
      <div className="surface-card mt-5 p-5">
        <h3 className="inline-flex items-center gap-2 text-base font-black text-slate-900">
          <Gauge className="h-4 w-4 text-red-600" /> <UiText text={"Examiner’s Verdict"} />
        </h3>
        <p className="mt-2 text-sm leading-7 text-slate-700">{evaluation.summary}</p>
      </div>

      {/* Strengths + Weaknesses */}
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="surface-card p-5">
          <h3 className="inline-flex items-center gap-2 text-base font-black text-emerald-700">
            <TrendingUp className="h-4 w-4" /> <UiText text={"Strengths"} />
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
            <TriangleAlert className="h-4 w-4" /> <UiText text={"Areas to Improve"} />
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
            <Lightbulb className="h-4 w-4 text-amber-500" /> <UiText text={"Your Improvement Plan"} />
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
        <details className="surface-card mt-5 p-5" open>
          <summary className="flex cursor-pointer items-center gap-2 text-base font-black text-slate-900"><BookOpen className="h-4 w-4 text-red-600" /> <UiText text={"Review your answers"} /></summary>
          <div className="mt-4 space-y-3">
            {transcript.filter((turn) => turn.role === 'candidate').map((turn, index) => {
              const question = transcript.slice(0, transcript.indexOf(turn)).reverse().find((item) => item.role === 'examiner')
              return <div key={`${index}-${turn.text.slice(0, 12)}`} className="rounded-2xl border border-red-100 bg-white/80 p-4 text-sm">
                <p className="text-xs font-black uppercase tracking-wide text-red-600"><UiText text={"Question"} /> {index + 1}</p>
                <p className="mt-1 font-semibold leading-6 text-slate-800">{question?.text || <UiText text={"Examiner question"} />}</p>
                <p className="mt-2 border-l-2 border-red-300 pl-3 leading-6 text-slate-600">{turn.text || <UiText text={"No clear speech captured for this question."} />}</p>
                {turn.text.trim() ? <ImprovedResponse text={evaluation.improvedAnswers?.find((item) => item.answerIndex === index && item.original === turn.text)?.improved} speakingAnswer={turn.text} onImproved={improved => onImprovedAnswers?.([...(evaluation.improvedAnswers ?? []).filter(item => item.answerIndex !== index), { answerIndex: index, original: turn.text, improved }].sort((a, b) => a.answerIndex - b.answerIndex))} /> : null}
              </div>
            })}
          </div>
        </details>
      ) : null}

      {/* Speech stats */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={uiCopy("Words spoken")} value={String(stats.wordCount)} />
        <StatCard label={uiCopy("Speaking pace")} value={`${stats.wordsPerMinute} wpm`} />
        <StatCard label={uiCopy("Filler words")} value={String(stats.fillerCount)} tone={stats.fillerCount > 5 ? 'warn' : 'ok'} />
        <StatCard label={uiCopy("Lexical variety")} value={`${Math.round(stats.typeTokenRatio * 100)}%`} />
      </div>
      {stats.fillerWords.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500"><UiText text={"Detected fillers:"} /></span>
          {stats.fillerWords.map((f) => (
            <span key={f} className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
              {f}
            </span>
          ))}
        </div>
      ) : null}

      {testId && <details className="ir-glass mt-6 p-5"><summary className="cursor-pointer font-bold"><UiText text={"Test leaderboard"} /></summary><div className="mt-5"><TestLeaderboard testId={testId} title={modeLabel} eligible={!unavailable} /></div></details>}
      {/* Actions */}
      {!embedded && <div className="mt-6 flex flex-wrap gap-3">
        {!reviewMode ? <button onClick={onRetry} className="arena-primary-btn cta-sheen px-6 py-3">
          <RotateCcw className="mr-2 h-4 w-4" /> <UiText text={"Practice again"} />
        </button> : null}
        <button onClick={onExit} className="arena-secondary-btn px-6 py-3">
          {reviewMode ? <UiText text={"Close review"} /> : <UiText text={"Back to Speaking Hub"} />}
        </button>
      </div>}
    </div>
  )
}

function StatCard({ label, value, tone = 'ok' }: { label: string; value: string; tone?: 'ok' | 'warn' }) {
  return (
    <div className="surface-card p-4 text-center">
      <p className={`text-2xl font-black ${tone === 'warn' ? 'text-red-600' : 'text-slate-900'}`}>{value}</p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500"><UiText text={label} /></p>
    </div>
  )
}
