import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Trophy } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAccountDataRevision } from '@/hooks/useAccountDataRevision'
import { getFullMockAttempts, getFullMockById, type FullMockAttempt } from '@/utils/ieltsMockCatalog'
import FullMockResults from './FullMockResults'
import '@/styles/mistake-labs.css'

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
  return <section className="mlab-card mlab-section" aria-label="Full mock attempt history">
    <div className="mlab-section-head">
      <div>
        <span className="mlab-eyebrow"><Trophy size={14} aria-hidden="true" />IELTS full mocks</span>
        <h2>Full mock results</h2>
      </div>
      <span className="mlab-count">{attempts.length}</span>
    </div>
    <div className="mlab-tile-grid">
      {attempts.map((attempt, index) => <button type="button" key={`${attempt.mockId}:${attempt.completedAt}:${index}`}
        className="mlab-tile" onClick={() => {
          if (!attempt.archived) { navigate(`/mock/ielts/${attempt.mockId}`); return }
          setSelected(attempt)
        }}>
        <strong>Full Mock {getFullMockById(attempt.mockId)?.index}</strong>
        <time dateTime={attempt.completedAt}>{new Date(attempt.completedAt).toLocaleString()}</time>
        <span className="mlab-tile-band">4/4 completed <b>{attempt.overallBand === null ? 'Assessment pending' : `Band ${attempt.overallBand.toFixed(1)}`}</b></span>
        <span className="mlab-row-cta">Review{attempt.archived ? ' previous attempt' : ''}<ChevronRight aria-hidden="true" /></span>
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
