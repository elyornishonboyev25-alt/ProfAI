import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { DURATION_OPTIONS, type MediaDuration } from '@/data/educationalMedia'
import { useCopy } from '@/i18n/interface'

type Props = {
  query: string; onQuery: (query: string) => void; level: string; onLevel: (level: string) => void
  duration?: MediaDuration; onDuration?: (duration: MediaDuration) => void
  category: string; onCategory: (category: string) => void; categories: string[]
}
export function LibraryControls({ query, onQuery, level, onLevel, category, onCategory, categories, duration, onDuration }: Props) {
  const { c } = useCopy()
  return <div className="learning-controls">
    <div className="learning-search-row">
      <label className="learning-search"><Search size={18} /><input value={query} onChange={event => onQuery(event.target.value)} placeholder={c('Search lessons, topics or sources')} aria-label={c('Search lessons, topics or sources')} />{query && <button type="button" onClick={() => onQuery('')} aria-label={c('Clear search')}><X size={16} /></button>}</label>
      <label className="learning-level"><span>{c('Level')}</span><select value={level} onChange={event => onLevel(event.target.value)} aria-label={c('Level')}>{['All', 'A2', 'B1', 'B2', 'C1'].map(value => <option key={value} value={value}>{value === 'All' ? c('All levels') : value}</option>)}</select></label>
      {onDuration && <label className="learning-level"><span>{c('Duration')}</span><select value={duration ?? 'All'} onChange={event => onDuration(event.target.value as MediaDuration)} aria-label={c('Duration')}>{DURATION_OPTIONS.map(option => <option key={option.value} value={option.value}>{c(option.label)}</option>)}</select></label>}
    </div>
    <div className="learning-topics" role="group" aria-label={c('Topics')}>{['All', ...categories].map(value => <button type="button" key={value} aria-pressed={category === value} className={category === value ? 'is-active' : ''} onClick={() => onCategory(value)}>{c(value === 'All' ? 'All topics' : value)}</button>)}</div>
  </div>
}
export const LIBRARY_PAGE_SIZE = 12
export function LibraryPagination({ page, total, onPage }: { page: number; total: number; onPage: (page: number) => void }) {
  const { c } = useCopy()
  const pages = Math.ceil(total / LIBRARY_PAGE_SIZE)
  if (pages < 2) return null
  return <nav className="learning-pagination" aria-label={c('Library pages')}>
    <button type="button" disabled={page === 1} onClick={() => onPage(page - 1)} aria-label={c('Previous page')}><ChevronLeft size={17} />{c('Previous')}</button>
    <span>{c('Page')} {page} / {pages}</span>
    <button type="button" disabled={page === pages} onClick={() => onPage(page + 1)} aria-label={c('Next page')}>{c('Next')}<ChevronRight size={17} /></button>
  </nav>
}
