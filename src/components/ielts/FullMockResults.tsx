import { useState } from 'react'
import { ArrowLeft, ArrowUpRight, BookOpen, CheckCircle2, Headphones, Mic2, PenSquare, Trophy } from 'lucide-react'
import TestVocabulary from '@/components/vocab/TestVocabulary'
import ReviewPracticeLink from './ReviewPracticeLink'
import ImprovedResponse from './ImprovedResponse'
import SpeakingResult from '@/components/speaking/SpeakingResult'
import { getFullMockResults, saveFullMockSectionResult } from '@/utils/ieltsMockCatalog'
import type { FullMockEntry, FullMockSectionResult, MockSection, MockSectionKey } from '@/utils/ieltsMockCatalog'
import './full-mock-results.css'

const icons = { listening: Headphones, reading: BookOpen, writing: PenSquare, speaking: Mic2 }

export default function FullMockResults({ mock, results, overall, onBack, onReview, onRegrade }: {
  mock: FullMockEntry
  results: Partial<Record<MockSectionKey, FullMockSectionResult>>
  overall: number | null
  onRegrade?: () => Promise<void>
  onBack: () => void
  onReview: (section: MockSection) => void
}) {
  const [selected, setSelected] = useState<MockSectionKey>(results.speaking?.assessmentStatus === 'pending' ? 'speaking' : 'listening')
  const [regrading, setRegrading] = useState(false)
  const [error, setError] = useState('')
  const regrade = async () => {
    if (regrading || !onRegrade) return
    setRegrading(true); setError('')
    try { await onRegrade() } catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not complete the assessment. Please retry.') }
    finally { setRegrading(false) }
  }
  const section = mock.sections.find(item => item.key === selected)!
  const saved = results[selected]!
  const objective = selected === 'listening' || selected === 'reading'
  const pending = saved.assessmentStatus === 'pending'
  const average = mock.sections.reduce((sum, item) => sum + (results[item.key]?.band ?? 0), 0) / 4
  return <main className="full-mock-results workspace-page">
    <div className="full-mock-results-content">
      <nav><button type="button" onClick={onBack}><ArrowLeft size={16} /> All mocks</button><span>IELTS ACADEMIC · FULL MOCK {String(mock.index).padStart(2, '0')}</span><span className="full-mock-results-complete"><CheckCircle2 size={15} /> Completed</span></nav>
      <header className="full-mock-results-hero">
        <div><p className="full-mock-results-eyebrow">YOUR TEST REPORT</p><h1>Full Mock {mock.index}<br /><span>Your results.</span></h1><p>All four skills, together. Select a section below to explore your answers and feedback.</p><div className="full-mock-results-calculation">Four skill average <strong>{overall === null ? 'Pending assessment' : average.toFixed(2)}</strong><span>→</span> Overall band <strong>{overall === null ? '—' : overall.toFixed(1)}</strong></div></div>
        <aside aria-label="Overall band" className="mock-run-overall is-complete"><div><Trophy size={18} /> OVERALL BAND</div><p className="mock-run-band">{overall === null ? '—' : overall.toFixed(1)}<span>/ 9.0</span></p><small>{overall === null ? 'Test complete · Speaking assessment pending' : 'IELTS overall rounding · Practice result'}</small></aside>
      </header>
      <div className="full-mock-results-heading"><h2>Your four skills</h2><p>Select a card to see the section result</p></div>
      <div className="full-mock-results-skills" role="tablist" aria-label="Section results">
        {mock.sections.map(item => {
          const result = results[item.key]!
          const Icon = icons[item.key]
          return <button type="button" role="tab" id={`result-tab-${item.key}`} aria-selected={selected === item.key} aria-controls="full-mock-result-detail" tabIndex={selected === item.key ? 0 : -1}
            onKeyDown={event => { const index = mock.sections.findIndex(s => s.key === item.key); const next = event.key === 'ArrowRight' ? (index + 1) % 4 : event.key === 'ArrowLeft' ? (index + 3) % 4 : event.key === 'Home' ? 0 : event.key === 'End' ? 3 : null; if (next !== null) { event.preventDefault(); setSelected(mock.sections[next].key); document.getElementById(`result-tab-${mock.sections[next].key}`)?.focus() } }}
            key={item.key} className={`mock-run-section full-mock-result-card ${selected === item.key ? 'is-selected' : ''}`} onClick={() => setSelected(item.key)}>
            <span><Icon size={21} /><span>{item.title}</span><CheckCircle2 size={15} /></span><strong className="mock-run-skill-band">{result.assessmentStatus === 'pending' ? '—' : result.band.toFixed(1)}<small>{result.assessmentStatus === 'pending' ? 'Assessment pending' : 'band score'}</small></strong>
            <span className="full-mock-result-meta">{result.result ? `${result.result.correctAnswers} / ${result.result.totalQuestions} correct` : item.key === 'writing' ? 'Task 1 + Task 2' : 'Parts 1–3'}</span>
            <span className="full-mock-result-review">Review {item.title.toLowerCase()} <ArrowUpRight size={14} /></span>
          </button>
        })}
      </div>
      <section role="tabpanel" id="full-mock-result-detail" aria-labelledby={`result-tab-${selected}`} className="full-mock-result-detail" key={selected}>
        <header><div><p className="full-mock-results-eyebrow">SECTION RESULT</p><h2>{section.title} <span>{pending ? 'Assessment pending' : saved.band.toFixed(1)}</span></h2></div>{objective && saved.result && <button type="button" className="mock-run-review" onClick={() => onReview(section)}>Review answers <ArrowUpRight size={16} /></button>}</header>
        {saved.result && <div className="full-mock-result-stats"><div><strong>{saved.result.correctAnswers}<small> / {saved.result.totalQuestions}</small></strong><span>Correct answers</span></div><div><strong>{Math.round(saved.result.correctAnswers / Math.max(1, saved.result.totalQuestions) * 100)}<small>%</small></strong><span>Accuracy</span></div><div><strong>{Math.round(saved.result.timeSpent / 60)}<small> min</small></strong><span>Time used</span></div></div>}
        {selected === 'speaking' && pending && <div className="full-mock-assessment-notice" role="status"><div><h3>Your answers are saved</h3><p>All four sections are complete. Your overall band will appear after Speaking is assessed.</p></div><button type="button" disabled={regrading} className="mock-run-review" onClick={() => void regrade()}>{regrading ? 'Assessing your saved recordings...' : 'Retry Speaking assessment'}</button></div>}
        {error && <p role="alert" className="full-mock-assessment-error">{error}</p>}
        {saved.summary && <p className="mock-run-summary">{saved.summary}</p>}
        <div className="mock-run-section-review">
          {selected === 'speaking' && saved.speaking ? <SpeakingResult evaluation={saved.speaking.evaluation} transcript={saved.speaking.transcript} modeLabel={section.title} reviewMode embedded hideVocabularyReview onRetry={() => {}} onExit={onBack} onImprovedAnswers={improvedAnswers => {
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
            const current = getFullMockResults(mock.id)[selected]
            if (!current || current.completedAt !== saved.completedAt) return
            saveFullMockSectionResult(mock.id, selected, { ...current, review: current.review?.map((response, position) => position === index ? { ...response, improvedVersion } : response) })
          }} />}</div>)}</div></details>}
          <TestVocabulary testId={saved.testId} skill={selected} variant="review" compact />
          {selected !== 'writing' && <ReviewPracticeLink skill={selected} />}
        </div>
      </section>
      <footer>Overall is the average of the four skill bands, rounded to the nearest half band. Writing Task 2 carries twice the weight of Task 1. Listening and Reading use answer keys; Writing and Speaking use AI assessment against IELTS criteria. These are practice estimates.</footer>
    </div>
  </main>
}
