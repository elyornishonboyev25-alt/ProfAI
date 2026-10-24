import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useAccountDataRevision } from '@/hooks/useAccountDataRevision'
import { getFullMockAttempts, getFullMockById, type FullMockAttempt } from '@/utils/ieltsMockCatalog'
import FullMockResults from './FullMockResults'

export default function FullMockAttemptHistory() {
  const owner = useAuthStore(state => state.user?.id ?? 'guest')
  useAccountDataRevision()
  const navigate = useNavigate()
  const attempts = getFullMockAttempts(owner)
  const [selected, setSelected] = useState<FullMockAttempt | null>(null)
  useEffect(() => { setSelected(null) }, [owner])
  useEffect(() => {
    if (!selected) return
    const previous = document.body.style.overflow
    const focused = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setSelected(null) }
    window.addEventListener('keydown', escape)
    return () => { document.body.style.overflow = previous; window.removeEventListener('keydown', escape); focused?.focus() }
  }, [selected])
  if (!attempts.length) return null
  const mock = selected ? getFullMockById(selected.mockId) : null
  return <section className="glass-surface p-5" aria-label="Full mock attempt history">
    <h2 className="text-xl font-black text-slate-900">Full mock results</h2>
    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {attempts.map((attempt, index) => <button type="button" key={`${attempt.mockId}:${attempt.completedAt}:${index}`}
        className="rounded-xl border border-emerald-100 bg-white p-4 text-left" onClick={() => {
          if (!attempt.archived) { navigate(`/mock/ielts/${attempt.mockId}`); return }
          setSelected(attempt)
        }}>
        <strong className="block">Full Mock {getFullMockById(attempt.mockId)?.index}</strong>
        <span className="block text-xs text-slate-500">{new Date(attempt.completedAt).toLocaleString()}</span>
        <span className="mt-2 block text-sm font-bold text-emerald-700">4/4 completed · {attempt.overallBand === null ? 'Assessment pending' : `Band ${attempt.overallBand.toFixed(1)}`}</span>
        <span className="mt-2 block text-sm font-bold text-red-700">Review{attempt.archived ? ' previous attempt' : ''}</span>
      </button>)}
    </div>
    {selected && mock && createPortal(<div role="dialog" aria-modal="true" aria-label="Saved full mock result" className="fixed inset-0 z-[270] overflow-y-auto bg-white">
      <button autoFocus type="button" onClick={() => setSelected(null)} className="sticky left-4 top-4 z-10 rounded-xl border bg-white px-4 py-2 font-bold">Close review</button>
      <FullMockResults mock={mock} results={selected.sections} overall={selected.overallBand} readOnly
        onBack={() => setSelected(null)} onReview={section => {
          const saved = selected.sections[section.key]
          if (!section.launchPath || !saved?.result) return
          navigate(section.launchPath, { state: { reviewPayload: { result: saved.result, showCorrectAnswers: true }, fromResults: false } })
        }} />
    </div>, document.body)}
  </section>
}
