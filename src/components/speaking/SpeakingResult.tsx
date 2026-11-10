import SpeakingReviewWorkbench from './SpeakingReviewWorkbench'
import '@/styles/assessment-studio.css'
import { useEffect, useRef, useState } from 'react'

import UiText from '@/components/common/UiText'
import TestLeaderboard from '@/components/results/TestLeaderboard'
import { ArrowLeft, RotateCcw, Sparkles } from 'lucide-react'
import type { ExaminerTurn, SpeakingEvaluation } from '@/services/speakingAI'
import { improveSpeakingAnswers } from '@/services/speakingAI'
import { useAuthStore } from '@/store/authStore'
import { readSpeakingRewrite, saveSpeakingRewrite } from '@/utils/speakingRewriteCache'

import BandGauge from './BandGauge'

const CRITERIA: Array<{ key: keyof SpeakingEvaluation; label: string }> = [
  { key: 'fluencyBand', label: 'Fluency & Coherence' },
  { key: 'lexicalBand', label: 'Lexical Resource' },
  { key: 'grammarBand', label: 'Grammar' },
  { key: 'pronunciationBand', label: 'Pronunciation' },
]

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
  autoImprove = false,
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
  autoImprove?: boolean
}) {
  const unavailable = evaluation.source === 'offline'
  const owner = useAuthStore(state => state.user?.id ?? 'guest')
  const [coaching, setCoaching] = useState<NonNullable<SpeakingEvaluation['improvedAnswers']>>([])
  const [coachingPending, setCoachingPending] = useState(false)
  const onImprovedRef = useRef(onImprovedAnswers)
  onImprovedRef.current = onImprovedAnswers
  const answerKey = JSON.stringify(transcript?.filter(turn => turn.role === 'candidate') ?? [])
  useEffect(() => {
    let disposed = false
    const candidates = JSON.parse(answerKey) as ExaminerTurn[]
    setCoaching([])
    setCoachingPending(false)
    if (!autoImprove || unavailable) return
    const missing = candidates.flatMap((turn, answerIndex) => turn.text.trim() &&
      !evaluation.improvedAnswers?.some(item => item.answerIndex === answerIndex && item.original === turn.text) &&
      !readSpeakingRewrite(owner, turn.text) ? [{ ...turn, answerIndex }] : [])
    if (!missing.length) return
    setCoachingPending(true)
    // Coaching recovery never blocks or repeats the paid audio assessment.
    void improveSpeakingAnswers(missing.map(({ role, text }) => ({ role, text }))).then(answers => {
      if (disposed) return
      const repaired = answers.map(item => ({ ...item, answerIndex: missing[item.answerIndex].answerIndex }))
      for (const item of repaired) saveSpeakingRewrite(owner, item.original, item.improved)
      setCoaching(repaired)
      onImprovedRef.current?.([...(evaluation.improvedAnswers ?? []), ...repaired].sort((a, b) => a.answerIndex - b.answerIndex))
    }).catch(() => { /* The score stays visible; each original answer retains its retry action. */ })
      .finally(() => { if (!disposed) setCoachingPending(false) })
    return () => { disposed = true }
    // One automatic recovery per set of answers; callback/result updates must
    // not start duplicate requests or create an automatic retry loop.
  }, [answerKey, autoImprove, unavailable, owner])
  const improvedAnswers = [...(evaluation.improvedAnswers ?? []).filter(item => !coaching.some(answer => answer.answerIndex === item.answerIndex)), ...coaching]

  return (
    <div className={`speaking-review-studio ${embedded ? 'speaking-result-embedded' : 'speaking-result-page mx-auto max-w-5xl px-4 pb-10 sm:px-6'}`}>
      {!embedded && <button onClick={onExit} className="premium-back-btn mb-4">
        <ArrowLeft className="h-3.5 w-3.5" /> {reviewMode ? <UiText text={"Close review"} /> : <UiText text={"Back to Speaking Hub"} />}
      </button>}

      {!embedded && <section className="assessment-studio speaking-result-overview">
        <div className="speaking-summary-compact">
          {unavailable ? <span className="text-5xl text-slate-400">&mdash;</span> : <BandGauge band={evaluation.overallBand} size={96} />}
          <div><p className="text-xs font-semibold text-red-700"><UiText text={modeLabel} /></p>
            <h2>{unavailable ? <UiText text={"Assessment unavailable"} /> : evaluation.assessmentMode === 'audio' ? <UiText text={"Estimated Speaking Band"} /> : <UiText text={"Text Practice Estimate"} />}</h2>
            <p>{unavailable ? <UiText text={"Retry assessment for your band"} /> : evaluation.overallBand === 0 ? <UiText text={"No assessable speech captured"} /> : <UiText text={"{{value1}} performance"} values={{ value1: String(bandWord(evaluation.overallBand)) }} />}</p>
            {!unavailable && <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700"><Sparkles size={12} />{evaluation.assessmentMode === 'audio' ? <UiText text={"AI audio assessment"} /> : <UiText text={"AI feedback on text"} />}</span>}
          </div>
        </div>
        <details className="speaking-result-verdict"><summary><UiText text={"Examiner\u2019s Verdict"} /></summary><p>{evaluation.summary}</p></details>
      </section>}
      {embedded && <p className="mt-3 text-sm leading-7 text-slate-600">{evaluation.summary}</p>}
      <div className="speaking-criteria-compact">
        {CRITERIA.map(({ key, label }) => <div key={key} className="surface-card"><p><UiText text={label} /></p><strong>{unavailable || key === 'pronunciationBand' && evaluation.assessmentMode !== 'audio' ? <span>&mdash;</span> : (evaluation[key] as number).toFixed(1)}</strong>{key === 'pronunciationBand' && evaluation.assessmentMode !== 'audio' && <small><UiText text={"Not assessed"} /></small>}</div>)}
      </div>
      <p className="mt-3 text-[10px] leading-5 text-slate-500">{unavailable ? <UiText text={"No band was awarded. Your answers are available for another assessment."} /> : evaluation.assessmentMode === 'audio' ? <UiText text={"IELTS-style practice estimate using your answers and recordings. Four criteria carry equal weight. This is not an official IELTS score."} /> : <UiText text={"This estimate uses your transcribed answers. Pronunciation was not assessed; it needs audio or examiner review."} />}{' '}<a href="https://ielts.org/cdn/ielts-guides/ielts-speaking-band-descriptors.pdf" target="_blank" rel="noreferrer" className="font-semibold text-red-700 underline"><UiText text={"Official IELTS Speaking descriptors"} /></a></p>
      {unavailable && onRegrade && !reviewMode && <div className="surface-card mt-4 p-4"><p role="alert" className="mb-2 text-sm text-slate-700">{evaluation.summary}</p><p className="mb-3 text-sm text-slate-600"><UiText text={"Retry AI feedback without taking the test again."} /></p><button onClick={onRegrade} className="assessment-primary"><Sparkles size={15} /><UiText text={"Retry AI feedback"} /></button></div>}
      <SpeakingReviewWorkbench evaluation={{ ...evaluation, improvedAnswers }} transcript={transcript ?? []} pending={coachingPending} onImprovedAnswers={onImprovedAnswers} />

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
