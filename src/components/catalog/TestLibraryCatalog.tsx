import { useContext, useMemo, useState, type ComponentProps } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BarChart3, BookOpenText, Bookmark, Check, CheckCircle2, ChevronDown, Clock3, FileText, Grid2X2, Headphones, Layers3, Lock, Mic2, PenLine, RotateCcw, Search, SlidersHorizontal, Users } from 'lucide-react'
import CompactIeltsCatalog, { type CompactIeltsTestRow } from './CompactIeltsCatalog'
import { TestLibraryContext } from './TestLibraryContext'
import { useStudyAccessPrompt } from '@/features/billing/useStudyAccessPrompt'
import StudyAccessChip from '@/features/billing/StudyAccessChip'
import { useAuthStore } from '@/store/authStore'
import { accountStorageFor } from '@/utils/accountStorage'
import { useAccountDataRevision } from '@/hooks/useAccountDataRevision'
import { useCopy } from '@/i18n/interface'
import UiText from '@/components/common/UiText'

type Props = ComponentProps<typeof CompactIeltsCatalog>
const meta = {
  listening: { label: 'Listening Tests', icon: Headphones, description: 'Focused audio practice with complete academic simulations.' },
  reading: { label: 'Reading Tests', icon: BookOpenText, description: 'Build understanding with complete academic reading tests.' },
  writing: { label: 'Writing Tests', icon: PenLine, description: 'Develop clear, confident answers for Task 1 and Task 2.' },
  speaking: { label: 'Speaking Tests', icon: Mic2, description: 'Practice your fluency, pronunciation, and confidence.' },
}
const partIcons = [Layers3, Search, Users, BarChart3, Grid2X2]
const bookmarkKey = 'ielts-library-bookmarks-v1'

function readBookmarks(owner: string): string[] {
  try {
    const value: unknown = JSON.parse(accountStorageFor(owner).getItem(bookmarkKey) ?? '[]')
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : []
  } catch { return [] }
}

function Performance({ row }: { row: CompactIeltsTestRow }) {
  const band = row.result ? (row.result.maximum === 9 ? row.result.score : undefined) : row.band
  const detail = row.result?.detail ?? row.scoreLabel
  const counts = detail?.match(/^(\d+)\s*\/\s*(\d+) correct$/)
  const numerator = counts ? Number(counts[1]) : row.result?.score
  const denominator = counts ? Number(counts[2]) : row.result?.maximum
  const percent = numerator !== undefined && denominator && denominator > 0
    ? Math.max(0, Math.min(100, numerator / denominator * 100)) : undefined
  return <div className="tl-performance">
    <div className="tl-score-line">
      {band !== undefined && Number.isFinite(band) ? <span><UiText text="Band" /> <strong>{band.toFixed(1)}</strong><small> / 9.0</small></span>
        : row.progressLabel ? <span><UiText text={row.progressLabel} /></span> : <span><UiText text="Completed" /></span>}
      {detail && <span><UiText text={detail} /></span>}
    </div>
    {percent !== undefined && <progress className="tl-performance-track" value={percent} max={100} aria-label={detail} />}
  </div>
}

function PremiumCatalog({ search, resetSearch, ...props }: Props & { search: string; resetSearch: () => void }) {
  const { section, rows, filters, activeFilter, onFilterChange, onLaunch, headerExtra } = props
  const { c: uiCopy } = useCopy()
  const access = useStudyAccessPrompt()
  const owner = useAuthStore(state => state.user?.id ?? 'guest')
  const revision = useAccountDataRevision()
  const [bookmarkRevision, setBookmarkRevision] = useState(0)
  const bookmarks = useMemo(() => readBookmarks(owner), [owner, revision, bookmarkRevision])
  const [sort, setSort] = useState('catalog')
  const [status, setStatus] = useState('all')
  const [savedOnly, setSavedOnly] = useState(false)
  const info = meta[section]
  const Icon = info.icon
  const available = rows.filter(row => row.available)
  const completed = available.filter(row => row.completed).length
  const percentage = available.length ? Math.round(completed / available.length * 100) : 0
  const query = `${search} ${props.searchTerm}`.trim().toLowerCase()
  const visible = useMemo(() => {
    const matching = rows.filter(row => (!query || `${row.title} ${row.subtitle} ${row.badge} ${section}`.toLowerCase().includes(query))
      && (status === 'all' || (status === 'completed' ? row.completed : status === 'available' ? row.available : !row.completed))
      && (!savedOnly || bookmarks.includes(`${section}:${row.id}`)))
    return [...matching].sort((a, b) => sort === 'newest' ? b.number - a.number : sort === 'title' ? a.title.localeCompare(b.title, undefined, { numeric: true }) : a.number - b.number)
  }, [rows, query, status, savedOnly, bookmarks, section, sort])
  const toggleBookmark = (id: string) => {
    const current = readBookmarks(owner)
    accountStorageFor(owner).setItem(bookmarkKey, JSON.stringify(current.includes(id) ? current.filter(value => value !== id) : [...current, id]))
    setBookmarkRevision(value => value + 1)
  }

  return <section className="tl-panel" aria-labelledby={`tl-${section}-heading`}>
    <header className="tl-section-header">
      <div className="tl-section-copy">
        <span className="tl-section-icon" aria-hidden="true"><Icon size={36} strokeWidth={1.65} /></span>
        <div><h2 id={`tl-${section}-heading`}><UiText text={info.label} /></h2><p><UiText text={info.description} /></p></div>
      </div>
      <div className="tl-stats" aria-label={uiCopy('Test progress')}>
        <div><Layers3 size={23} aria-hidden="true" /><span><strong>{available.length}</strong><small><UiText text="Available" /></small></span></div>
        <div><CheckCircle2 size={23} aria-hidden="true" /><span><strong>{completed}</strong><small><UiText text="Completed" /></small></span></div>
        <div className="tl-ring" role="img" aria-label={uiCopy('{{value1}}% completed', { value1: String(percentage) })}>
          <svg viewBox="0 0 72 72" aria-hidden="true"><circle className="tl-ring-track" cx="36" cy="36" r="29" />{percentage > 0 && <circle className="tl-ring-value" cx="36" cy="36" r="29" pathLength="100" strokeDasharray={`${percentage} 100`} />}</svg><strong>{percentage}%</strong>
        </div>
      </div>
    </header>
    <div className="tl-toolbar">
      {filters && onFilterChange ? <div className="tl-segments" role="group" aria-label={uiCopy('Test type')}>
        {filters.map((filter, index) => { const PartIcon = partIcons[index % partIcons.length]; return <button key={filter.value} type="button" aria-pressed={activeFilter === filter.value} onClick={() => onFilterChange(filter.value)}><PartIcon size={21} strokeWidth={1.65} aria-hidden="true" /><UiText text={filter.label} /></button> })}
      </div> : <span />}
      <div className="tl-toolbar-tools">
        <label className="tl-sort"><span><UiText text="Sort" />:</span><select aria-label={uiCopy('Sort tests')} value={sort} onChange={event => setSort(event.target.value)}><option value="catalog">{uiCopy('Test number')}</option><option value="newest">{uiCopy('Newest')}</option><option value="title">{uiCopy('Title')}</option></select><ChevronDown size={16} aria-hidden="true" /></label>
        <details className="tl-filter">
          <summary aria-label={uiCopy('Filter tests')} title={uiCopy('Filter tests')}><SlidersHorizontal size={22} aria-hidden="true" />{(status !== 'all' || savedOnly) && <span className="tl-filter-dot" />}</summary>
          <div className="tl-filter-popover">
            <label><UiText text="Status" /><select aria-label={uiCopy('Status')} value={status} onChange={event => setStatus(event.target.value)}><option value="all">{uiCopy('All tests')}</option><option value="available">{uiCopy('Available')}</option><option value="completed">{uiCopy('Completed')}</option><option value="uncompleted">{uiCopy('Not completed')}</option></select></label>
            <label className="tl-checkbox"><input type="checkbox" checked={savedOnly} onChange={event => setSavedOnly(event.target.checked)} /><UiText text="Bookmarked only" /></label>
            <button type="button" onClick={() => { setStatus('all'); setSavedOnly(false) }}><UiText text="Reset filters" /></button>
          </div>
        </details>
      </div>
    </div>
    {headerExtra && <div className="tl-access-note">{headerExtra}</div>}
    <div className="tl-grid" aria-live="polite" aria-relevant="additions removals">
      {visible.map(row => {
        const saved = bookmarks.includes(`${section}:${row.id}`)
        const details = row.detail?.split(/\s*[·•]\s*/) ?? []
        return <article key={row.id} className={`tl-card ielts-catalog-card${row.completed ? ' is-completed' : ''}${!row.available ? ' is-unavailable' : ''}`}>
          <img className="tl-card-landscape" src={`/assets/test-library/${section}/${row.number}.webp`} alt="" width={640} height={180} loading={row.number <= 6 ? 'eager' : 'lazy'} decoding="async" />
          <div className="tl-card-top">
            {row.completed ? <span className="tl-status"><Check size={13} aria-hidden="true" /><UiText text="Completed" /></span> : <StudyAccessChip resource={`test:${section}:${row.id}`} />}
            <button className="tl-bookmark" type="button" aria-label={uiCopy(saved ? 'Remove bookmark' : 'Bookmark test')} aria-pressed={saved} onClick={() => toggleBookmark(`${section}:${row.id}`)}><Bookmark size={19} fill={saved ? 'currentColor' : 'none'} aria-hidden="true" /></button>
          </div>
          <h3><Icon size={24} strokeWidth={1.7} aria-hidden="true" />{row.title}</h3>
          <div className="tl-card-meta">
            {row.durationMinutes ? <span><Clock3 size={16} aria-hidden="true" />{row.durationMinutes} <UiText text="min" /></span> : null}
            {details.map((detail, index) => <span key={detail}>{index === 0 ? <Layers3 size={17} aria-hidden="true" /> : <FileText size={16} aria-hidden="true" />}<UiText text={detail} /></span>)}
          </div>
          {(row.completed || row.progressLabel || row.scoreLabel) && <Performance row={row} />}
          {section === 'writing' && !/^(Complete academic|New full test)/.test(row.subtitle) && <p className="tl-card-subtitle">{row.subtitle}</p>}
          <div className="tl-card-actions">
            <button type="button" className={`tl-launch${row.completed ? ' tl-dark' : ''}`} disabled={!row.available} onClick={() => { if (access.open(`test:${section}:${row.id}`)) onLaunch(row) }}>
              <UiText text={!row.available ? 'Coming soon' : row.completed ? 'Retake' : 'Start Test'} />
              {!row.available ? <Lock size={16} aria-hidden="true" /> : row.completed ? <RotateCcw size={16} aria-hidden="true" /> : <ArrowRight size={20} aria-hidden="true" />}
            </button>
            {row.completed && <Link className="tl-card-secondary" to="/profile" aria-label={uiCopy('My Results')} title={uiCopy('My Results')}><BarChart3 size={19} aria-hidden="true" /></Link>}
          </div>
        </article>
      })}
    </div>
    {!visible.length && <div className="tl-empty" role="status"><Search size={26} aria-hidden="true" /><p><UiText text="No tests found." /></p><button type="button" onClick={() => { setStatus('all'); setSavedOnly(false); props.onSearchChange(''); resetSearch() }}><UiText text="Reset filters" /></button></div>}
  </section>
}

export default function TestLibraryCatalog(props: Props) {
  const library = useContext(TestLibraryContext)
  return library ? <PremiumCatalog key={props.section} {...props} search={library.search} resetSearch={() => library.onSearchChange('')} /> : <CompactIeltsCatalog {...props} />
}
