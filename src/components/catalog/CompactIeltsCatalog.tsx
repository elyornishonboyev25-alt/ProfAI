import { useState, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, Search } from 'lucide-react'
import { useCopy } from '@/i18n/interface'
import StudyObject, { type StudyObjectKind } from '@/components/visuals/StudyObject'

export type IeltsCatalogSection = 'reading' | 'listening' | 'writing' | 'speaking'
export type CompactIeltsTestRow = {
  id: string; number: number; title: string; subtitle: string; badge: string
  durationMinutes: number; detail: string; available: boolean; completed?: boolean
}
type Props = {
  section: IeltsCatalogSection; rows: CompactIeltsTestRow[]; searchTerm: string
  onSearchChange: (value: string) => void; onBack: () => void
  onLaunch: (row: CompactIeltsTestRow) => void; headerExtra?: ReactNode
}
const META: Record<IeltsCatalogSection, { label: string; description: string; object: StudyObjectKind }> = {
  reading: { label: 'Reading', description: 'Academic passages, evidence and exam-accurate questions.', object: 'book' },
  listening: { label: 'Listening', description: 'Focused audio practice with complete academic simulations.', object: 'headphones' },
  writing: { label: 'Writing', description: 'Task 1 and Task 2 practice in official exam format.', object: 'notebook' },
  speaking: { label: 'Speaking', description: 'Interview, long-turn and discussion practice with feedback.', object: 'microphone' },
}
export default function CompactIeltsCatalog({ section, rows, searchTerm, onSearchChange, onBack, onLaunch, headerExtra }: Props) {
  const { c } = useCopy()
  const [showPlanned, setShowPlanned] = useState(false)
  const meta = META[section]
  const available = rows.filter(row => row.available)
  const visible = showPlanned ? rows : available
  return <main className="workspace-page liquid-page">
    <button type="button" onClick={onBack} className="liquid-text-link mb-6"><ArrowLeft size={16} />{c('Back')}</button>
    <header className="liquid-page-heading liquid-catalog-heading">
      <div><p className="liquid-eyebrow">IELTS Academic</p><h1>IELTS {c(meta.label)}</h1><p>{c(meta.description)}</p></div>
      <StudyObject kind={meta.object} />
    </header>
    <section className="glass-surface liquid-library-controls" aria-label={c('Find a test')}>
      <label className="liquid-search-field"><Search size={18} /><span className="sr-only">{c('Search tests')}</span><input type="search" value={searchTerm} onChange={event => onSearchChange(event.target.value)} placeholder={c('Search tests')} /></label>
      {headerExtra}
      <label className="liquid-checkbox-label"><input type="checkbox" checked={showPlanned} onChange={event => setShowPlanned(event.target.checked)} />{c('Show planned tests')}</label>
    </section>
    <p className="liquid-catalog-note" role="status">{c('Available tests')}: {available.length} · {c('Completed')}: {available.filter(row => row.completed).length}</p>
    {!visible.length ? <section className="glass-surface liquid-university-empty"><Search size={28} /><h2>{c('No tests found.')}</h2><p>{c(searchTerm ? 'Try another search or clear your filters.' : 'New tests will appear here when they are ready.')}</p>{searchTerm && <button className="liquid-button secondary" onClick={() => onSearchChange('')}>{c('Clear search')}</button>}</section> :
      <div className="liquid-test-grid">{visible.map(row => <button type="button" key={row.id} disabled={!row.available} onClick={() => onLaunch(row)} className="glass-surface liquid-test-card">
        <div className="liquid-test-card-top"><span className="liquid-eyebrow">{c(row.badge)}</span>{row.completed && <span className="liquid-completed"><CheckCircle2 size={15} />{c('Completed')}</span>}</div>
        <h2>{row.title}</h2><p>{c(row.subtitle)}</p>
        <div className="liquid-test-card-meta"><span><Clock3 size={14} />{row.durationMinutes} {c('min')}</span><span>{c(row.detail)}</span></div>
        <span className="liquid-text-link">{c(row.available ? 'Open test' : 'Coming soon')}{row.available && <ArrowRight size={16} />}</span>
      </button>)}</div>}
  </main>
}
