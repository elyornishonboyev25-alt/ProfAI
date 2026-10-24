import type { ReactNode } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import UiText from '@/components/common/UiText'
import { useAuthStore } from '@/store/authStore'
import type { TestResult } from '@/types/ieltsTypes'
import { getReadingAnalysisHistory } from '@/utils/readingAnalysisStorage'
import { loadReviewState } from '@/utils/resultsReviewState'
import { downloadTestResult } from '@/utils/downloadTestResult'

// This recovery view deliberately uses the submitted payload directly. It
// remains available if catalog resolution, diagrams or rich analysis fail.
function SavedResult({ result }: { result: TestResult }) {
  const answers = Object.entries(result.answers ?? {}).sort(([a], [b]) => Number(a.match(/\d+$/)?.[0] ?? 0) - Number(b.match(/\d+$/)?.[0] ?? 0))
  return (
    <main className="mx-auto my-12 w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 text-slate-900" data-result-recovery>
      <h1 className="text-2xl font-bold"><UiText text="Your saved result" /></h1>
      <p className="mt-3 text-sm"><UiText text="Detailed review is temporarily unavailable. You can still view and download your submitted answers." /></p>
      <p className="mt-5 text-xl font-bold"><UiText text="Band" /> {Number.isFinite(result.score) ? result.score.toFixed(1) : '—'}</p>
      <p className="mt-2"><UiText text="Correct" />: {result.correctAnswers} / {result.totalQuestions}</p>
      <button type="button" className="arena-primary-btn mt-5" onClick={() => downloadTestResult(result)}><UiText text="Download result" /></button>
      <h2 className="mt-6 text-lg font-bold"><UiText text="Answer Sheet" /></h2>
      <ol className="mt-3 grid gap-2 sm:grid-cols-2">
        {answers.map(([id, answer]) => <li key={id} className="rounded-lg border border-slate-200 p-3">
          <span className="font-semibold">{id.match(/\d+$/)?.[0] ?? id}.</span>{' '}{Array.isArray(answer) ? answer.join(', ') : String(answer ?? '')}
        </li>)}
      </ol>
    </main>
  )
}

export default function ResultBoundary({ children }: { children: ReactNode }) {
  const location = useLocation()
  const { testId } = useParams<{ testId: string }>()
  const owner = useAuthStore(state => state.user?.id)
  const state = location.state as { result?: TestResult } | null
  let result = state?.result && state.result.testId === testId ? state.result : undefined
  if (!result && testId) {
    try { result = loadReviewState(testId)?.result ?? getReadingAnalysisHistory(owner).find(entry => entry.testId === testId)?.resultPayload }
    catch { /* The boundary still handles pages without any saved attempt. */ }
  }
  return <ErrorBoundary key={`${owner ?? 'guest'}:${location.key}`} fallback={result ? <SavedResult result={result} /> : undefined}>{children}</ErrorBoundary>
}
