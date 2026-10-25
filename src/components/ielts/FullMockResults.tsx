import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowUpRight, BookOpen, CheckCircle2, Headphones, Mic2, PenSquare, Trophy, X } from 'lucide-react'
import ImprovedResponse from './ImprovedResponse'
import SpeakingResult from '@/components/speaking/SpeakingResult'
import { calculateFullMockOverallBand, getFullMockResults, saveFullMockSectionResult } from '@/utils/ieltsMockCatalog'
import type { FullMockEntry, FullMockSectionResult, MockSection, MockSectionKey } from '@/utils/ieltsMockCatalog'
import './full-mock-results.css'

const icons = { listening: Headphones, reading: BookOpen, writing: PenSquare, speaking: Mic2 }

export default function FullMockResults({ mock, results, onBack, onReview, onRegrade, readOnly = false }: {
  mock: FullMockEntry
  results: Partial<Record<MockSectionKey, FullMockSectionResult>>
  overall: number | null
  onRegrade?: () => Promise<void>
  onBack: () => void
  onReview: (section: MockSection) => void
  readOnly?: boolean
}) {
  const [selected, setSelected] = useState<MockSectionKey | null>(null)
  const [regrading, setRegrading] = useState(false)
  const [error, setError] = useState('')
  const overall = calculateFullMockOverallBand(results)
  const detailRef = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!selected) return
    detailRef.current?.focus({ preventScroll: true })
    detailRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' })
  }, [selected])
  const regrade = async () => {
    if (regrading || !onRegrade) return
    setRegrading(true); setError('')
    try { await onRegrade() } catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not complete the assessment. Please retry.') }
    finally { setRegrading(false) }
  }
  const section = mock.sections.find(item => item.key === selected)
  const saved = selected ? results[selected] : undefined
  const objective = selected === 'listening' || selected === 'reading'
  const pending = saved?.assessmentStatus === 'pending'
  const speakingPending = results.speaking?.assessmentStatus === 'pending'
  const closeSection = () => {
    const card = document.getElementById(`result-card-${selected}`)
    setSelected(null)
    card?.focus()
  }
  const average = mock.sections.reduce((sum, item) => sum + (results[item.key]?.band ?? 0), 0) / 4
  return <main className="full-mock-results workspace-page">
    <div className="full-mock-results-content">
      <nav><button type="button" onClick={onBack}><ArrowLeft size={16} /> All mocks</button><span>IELTS ACADEMIC · FULL MOCK {String(mock.index).padStart(2, '0')}</span><span className="full-mock-results-complete"><CheckCircle2 size={15} /> Completed</span></nav>
      <header className="full-mock-results-hero">
        <div><p className="full-mock-results-eyebrow">IELTS ACADEMIC · PRACTICE TEST REPORT</p><h1>Full Mock {mock.index}<br /><span>Your overall result.</span></h1><p>Your complete test result in one place. Select a skill card below to review that section.</p><div className="full-mock-results-calculation" aria-label="Overall band calculation">{overall === null ? <span>Overall will appear when all four section scores are ready.</span> : <><span>({mock.sections.map(item => results[item.key]!.band.toFixed(1)).join(' + ')}) ÷ 4</span><strong>= {Number(average.toFixed(3))}</strong><span>→</span><strong>Band {overall.toFixed(1)}</strong></>}</div></div>
        <aside aria-label="Overall band" className="mock-run-overall is-complete"><div><Trophy size={18} /> OVERALL BAND</div><p className="mock-run-band">{overall === null ? '—' : overall.toFixed(1)}<span>/ 9.0</span></p><small>{overall === null ? 'Test complete · Speaking assessment pending' : 'IELTS overall rounding · Practice result'}</small></aside>
      </header>
      <div className="full-mock-results-heading"><h2>Your four skills</h2><p>Select a card to see the section result</p></div>
      <div className="full-mock-results-skills" role="group" aria-label="Section results">
        {mock.sections.map(item => {
          const result = results[item.key] ?? { band: 0, assessmentStatus: 'pending', testId: '', completedAt: '' }
          const Icon = icons[item.key]
          return <button type="button" id={`result-card-${item.key}`} aria-expanded={selected === item.key} aria-controls={selected === item.key ? 'full-mock-result-detail' : undefined}
            key={item.key} className={`mock-run-section full-mock-result-card ${selected === item.key ? 'is-selected' : ''}`} onClick={() => setSelected(current => current === item.key ? null : item.key)}>
            <span><Icon size={21} /><span>{item.title}</span><CheckCircle2 size={15} /></span><strong className="mock-run-skill-band">{result.assessmentStatus === 'pending' ? '—' : result.band.toFixed(1)}<small>{result.assessmentStatus === 'pending' ? 'Assessment pending' : 'band score'}</small></strong>
            <span className="full-mock-result-meta">{result.result ? `${result.result.correctAnswers} / ${result.result.totalQuestions} correct` : item.key === 'writing' ? 'Task 1 + Task 2' : 'Parts 1–3'}</span>
            <span className="full-mock-result-review">Review {item.title.toLowerCase()} <ArrowUpRight size={14} /></span>
          </button>
        })}
      </div>
      {speakingPending && <div className="full-mock-assessment-notice" role="status"><div><h3>Your answers are saved</h3><p>All four sections are complete. Your overall band will appear after Speaking is assessed.</p></div>{onRegrade && <button type="button" disabled={regrading} className="mock-run-review" onClick={() => void regrade()}>{regrading ? 'Assessing your saved recordings...' : 'Retry Speaking assessment'}</button>}</div>}
      {error && <p role="alert" className="full-mock-assessment-error">{error}</p>}
      {selected && section && saved && <section ref={detailRef} tabIndex={-1} aria-labelledby="full-mock-section-title" id="full-mock-result-detail" className="full-mock-result-detail" key={selected}>
        <header><div><p className="full-mock-results-eyebrow">SECTION RESULT</p><h2 id="full-mock-section-title">{section.title} <span>{pending ? 'Assessment pending' : saved.band.toFixed(1)}</span></h2></div>{objective && saved.result && <button type="button" className="mock-run-review" onClick={() => onReview(section)}>Review answers <ArrowUpRight size={16} /></button>}<button type="button" className="full-mock-result-close" onClick={closeSection} aria-label="Close section review"><X size={18} /></button></header>
        {saved.result && <div className="full-mock-result-stats"><div><strong>{saved.result.correctAnswers}<small> / {saved.result.totalQuestions}</small></strong><span>Correct answers</span></div><div><strong>{Math.round(saved.result.correctAnswers / Math.max(1, saved.result.totalQuestions) * 100)}<small>%</small></strong><span>Accuracy</span></div><div><strong>{Math.round(saved.result.timeSpent / 60)}<small> min</small></strong><span>Time used</span></div></div>}
        {saved.summary && <p className="mock-run-summary">{saved.summary}</p>}
        <div className="mock-run-section-review">
          {selected === 'speaking' && saved.speaking ? <SpeakingResult evaluation={saved.speaking.evaluation} transcript={saved.speaking.transcript} modeLabel={section.title} reviewMode embedded hideVocabularyReview onRetry={() => {}} onExit={onBack} onImprovedAnswers={improvedAnswers => {
            if (readOnly) return
            const current = getFullMockResults(mock.id).speaking
            if (!current?.speaking || current.completedAt !== saved.completedAt) return
            improvedAnswers = [...(current.speaking.evaluation.improvedAnswers ?? []).filter(item => !improvedAnswers.some(answer => answer.answerIndex === item.answerIndex)), ...improvedAnswers].sort((a, b) => a.answerIndex - b.answerIndex)
            let answerIndex = 0
            saveFullMockSectionResult(mock.id, 'speaking', { ...current, speaking: { ...current.speaking, evaluation: { ...current.speaking.evaluation, improvedAnswers } }, review: current.review?.map(item => {
              if (item.label !== 'Your answer') return item
              const index = answerIndex++
              return { ...item, improvedVersion: improvedAnswers.find(answer => answer.answerIndex === index && answer.original === item.response)?.improved }
            }) })
          }} /> : !!saved.review?.length && <details open><summary>Your responses and feedback</summary><div className="mock-run-responses">{saved.review.map((item, index) => <div key={index}><h4>{item.label}</h4><p>{item.response || 'No response recorded.'}</p>{item.feedback && <p className="mock-run-feedback">{item.feedback}</p>}{(selected === 'writing' || (selected === 'speaking' && item.label === 'Your answer')) && item.response.trim() && <ImprovedResponse text={item.improvedVersion} speakingAnswer={selected === 'speaking' ? item.response : undefined} onImproved={improvedVersion => {
            if (readOnly) return
            const current = getFullMockResults(mock.id)[selected]
            if (!current || current.completedAt !== saved.completedAt) return
            saveFullMockSectionResult(mock.id, selected, { ...current, review: current.review?.map((response, position) => position === index ? { ...response, improvedVersion } : response) })
          }} />}</div>)}</div></details>}
        </div>
      </section>}
      <footer>Each skill contributes equally: add the four bands, divide by 4 and round to the nearest half band. Averages ending in .25 round up to .5; .75 rounds up to the next whole band. Writing Task 2 carries twice the weight of Task 1. Listening and Reading use answer keys; Writing and Speaking use AI assessment against IELTS criteria. These are practice estimates.</footer>
    </div>
  </main>
}
