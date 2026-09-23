import { useState } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, Search } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { loadSATAttempt } from '@/features/sat/attemptStorage'
import { getSATSectionTest, satAvailabilityNote, isSATSection, SAT_TEST_CATALOG } from '@/features/sat/catalog'
import StudyObject from '@/components/visuals/StudyObject'
import { useCopy } from '@/i18n/interface'

export default function SATSection() {
  const { section } = useParams<{ section: string }>()
  const { c } = useCopy()
  const [search, setSearch] = useState('')
  const [limit, setLimit] = useState(12)
  if (!isSATSection(section)) return <Navigate to="/sat" replace />
  const isMath = section === 'math'
  const tests = Object.values(SAT_TEST_CATALOG)
    .sort((a, b) => a.mockId - b.mockId)
    .map(test => getSATSectionTest(test.mockId, section))
    .filter(test => `${c('Practice Test')} ${test.mockId} ${test.badge}`.toLowerCase().includes(search.trim().toLowerCase()))

  return <main className="workspace-page liquid-page">
    <Link to="/sat" className="liquid-text-link mb-6"><ArrowLeft size={16} />{c('SAT Prep')}</Link>
    <header className="liquid-page-heading liquid-catalog-heading">
      <div><p className="liquid-eyebrow">{c('Section practice')}</p><h1>SAT {c(isMath ? 'Math' : 'Reading & Writing')}</h1><p>{c(isMath ? 'Practice the two Math modules at your own pace.' : 'Build confidence with the two Reading & Writing modules.')}</p></div>
      <StudyObject kind={isMath ? 'calculator' : 'book'} />
    </header>
    <section className="glass-surface liquid-library-controls" aria-label={c('Find a test')}>
      <label className="liquid-search-field"><Search size={18} /><span className="sr-only">{c('Search tests')}</span><input type="search" placeholder={c('Search tests')} value={search} onChange={event => { setSearch(event.target.value); setLimit(12) }} /></label>
    </section>
    <p className="liquid-catalog-note" role="status">{c('Available tests')}: {tests.length}</p>
    {!tests.length && <section className="glass-surface liquid-university-empty"><h2>{c('No tests found.')}</h2><button className="liquid-button secondary" onClick={() => setSearch('')}>{c('Clear search')}</button></section>}
    <div className="liquid-test-grid">{tests.slice(0, limit).map(test => {
      const attempt = loadSATAttempt(test.id)
      const answered = Object.values(attempt?.answers ?? {}).filter(answer => answer.trim()).length
      const completed = attempt?.status === 'submitted'
      return <article key={test.id} className="glass-surface liquid-test-card">
        <div className="liquid-test-card-top"><span className="liquid-eyebrow">{c(isMath ? 'Math' : 'Reading & Writing')}</span>{completed && <span className="liquid-completed"><CheckCircle2 size={15} />{c('Completed')}</span>}</div>
        <h2>{c('Practice Test')} {test.mockId}</h2><p>{c(test.badge)}</p>{satAvailabilityNote(test) && <p>{c(satAvailabilityNote(test)!)}</p>}
        <div className="liquid-test-card-meta"><span><Clock3 size={14} />{Math.round(test.totalDurationSeconds / 60)} {c('min')}</span><span>{test.questionCount} {c('questions')}</span><span>{test.modules.length} {c('modules')}</span></div>
        {attempt && <p>{c(completed ? 'Completed' : 'Saved progress')}: {answered}/{test.questionCount}</p>}
        <Link className="liquid-button primary" to={`/mock/sat/${test.mockId}?section=${section}`}>{c(completed ? 'Review' : attempt?.status === 'active' ? 'Continue' : 'Start test')}<ArrowRight size={16} /></Link>
      </article>
    })}</div>
    {tests.length > limit && <button className="liquid-button secondary mt-6" onClick={() => setLimit(value => value + 12)}>{c('Show more tests')}</button>}
  </main>
}
