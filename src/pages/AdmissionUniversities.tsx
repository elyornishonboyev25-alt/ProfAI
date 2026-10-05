import UiText from '@/components/common/UiText'
import { memo, useCallback, useDeferredValue, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Building2,
  Check,
  ChevronDown,
  Compass,
  GraduationCap,
  Heart,
  MapPin,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react'
import { useCopy } from '@/i18n/interface'
import UniversityLogo from '@/components/admission/UniversityLogo'
import './admission-universities.css'
import { formatUniversityRank, getUniversities, QS_EDITION, QS_2027_RANKED_UNIVERSITY_COUNT, UNIVERSITY_COUNT } from '@/data/admission'
import { estimateRequirements, scoreUniversity } from '@/data/admission/match'
import type { University } from '@/data/admission'
import { useAdmissionScores, type AdmissionScores } from '@/hooks/useAdmissionScores'
import { prefetchUniversityCampusImage } from '@/hooks/useUniversityCampusImage'
import { useUniversityShortlist } from '@/hooks/useUniversityShortlist'
import { useToastStore, type ToastState } from '@/store/toastStore'

type BudgetFilter = 'all' | 'published' | 'under-20k-usd'
type IeltsFilter = 'all' | 'up-to-6.5' | 'up-to-7.0' | '7.5-plus' | 'no-cutoff'
type RankFilter = 'all' | 'top-10' | 'top-25' | 'top-50' | 'unranked'
const UNIVERSITY_PAGE_SIZE = 12

function yearlyCostLabel(university: University, c: (text: string) => string) {
  const cost = university.costOfLiving
  if (!cost) return c('Budget not published')

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: cost.currency,
    notation: cost.amount >= 100_000 ? 'compact' : 'standard',
    maximumFractionDigits: 0,
  })
  const min = formatter.format(cost.amount)
  const max = cost.maxAmount ? formatter.format(cost.maxAmount) : null
  const period = cost.period === 'month' ? c('/ month') : cost.period === 'academic-year' ? c('/ academic year') : c('/ year')
  return `${min}${max ? `–${max}` : ''} ${period}`
}

function ieltsLabel(university: University) {
  const requirements = university.admission?.bachelor ?? []
  const requirement = requirements.find((item) => item.comparison === 'ieltsOverall')
    ?? requirements.find((item) => item.label === 'IELTS')
  return requirement?.value ?? null
}

const UniversityCard = memo(function UniversityCard({
  university,
  scores,
  preferredCountry,
  priority = false,
  shortlisted,
  onToggleShortlist,
  returnTo,
}: {
  university: University
  scores: AdmissionScores
  preferredCountry?: string | null
  priority?: boolean
  shortlisted: boolean
  onToggleShortlist: (university: University) => void
  returnTo: '/admission/universities' | '/admission/shortlist'
}) {
  const { c } = useCopy()
  const fit = scoreUniversity(university, { ...scores, preferredCountry })
  const hasProfileScores = scores.satTotal !== null || scores.ieltsOverall !== null

  return (
    <article
      className="admission-university-card"
      onPointerEnter={() => prefetchUniversityCampusImage(university.name)}
      onPointerDown={() => prefetchUniversityCampusImage(university.name)}
    >
      <Link
        className="admission-university-card-link"
        to={`/admission/universities/${university.slug}`}
        state={{ admissionReturnTo: returnTo }}
        aria-label={`Explore ${university.name}`}
        onFocus={() => prefetchUniversityCampusImage(university.name)}
      />
      <div
        className="admission-card-glow"
        style={{ '--university-accent': university.brand.accent } as React.CSSProperties}
        aria-hidden="true"
      />
      <div className="admission-card-topline">
        <UniversityLogo id={university.id} name={university.name} brand={university.brand} website={university.website} size={68} rounded="1rem" priority={priority} />
        <div className="admission-card-rank-actions">
          <span className="admission-rank-badge" style={{ '--university-accent': university.brand.accent } as React.CSSProperties}>
            <small> <UiText text={"QS rank"} /> </small>
            <strong>{formatUniversityRank(university)}</strong>
          </span>
          <button
            type="button"
            className={`admission-card-shortlist${shortlisted ? ' is-shortlisted' : ''}`}
            aria-label={`${c(shortlisted ? 'Remove from shortlist' : 'Add to shortlist')}: ${university.name}`}
            aria-pressed={shortlisted}
            title={c(shortlisted ? 'Remove from shortlist' : 'Add to shortlist')}
            onClick={() => onToggleShortlist(university)}
          >
            <Heart className="h-4 w-4" fill={shortlisted ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      <div className="admission-card-copy">
        <p className="admission-card-kicker">{university.shortName}</p>
        <h2>{university.name}</h2>
        <p className="admission-card-location"><MapPin className="h-3.5 w-3.5" /> {university.city}, {university.country}</p>
      </div>

      <div className="admission-card-tags">
        <span>IELTS: {ieltsLabel(university) ?? c('No numeric cutoff')}</span>
        {university.groups?.includes('ivy-league') && <span>Ivy League</span>}
      </div>

      <div className="admission-card-footer">
        <div>
          <small><UiText text="Living costs" /></small>
          <strong>{yearlyCostLabel(university, c)}</strong>
        </div>
        <div
          className="admission-match-ring"
          title={hasProfileScores ? 'Planning fit from saved scores; not admission probability' : 'Planning fit only; add your scores and check full admission requirements'}
        >
          <span><small><UiText text="Fit" /></small><strong>{fit.fitPercent}%</strong></span>
        </div>
      </div>

      <span className="admission-card-open" aria-label={`Explore ${university.name}`}>
         <UiText text={"Explore"} /> <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </article>
  )
})

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const optionsRef = useRef<HTMLUListElement>(null)
  const { c } = useCopy()
  const listId = useId()
  const selected = options.find((option) => option.value === value) ?? options[0]
  const visible = options.filter((option) => c(option.label).toLowerCase().includes(query.trim().toLowerCase()))
  const activeOptionId = open && visible[activeIndex] ? `${listId}-${activeIndex}` : undefined

  useEffect(() => {
    if (!open) { setQuery(''); return }
    const list = optionsRef.current
    const option = list?.children[activeIndex] as HTMLElement | undefined
    if (list && option) {
      const listBounds = list.getBoundingClientRect()
      const optionBounds = option.getBoundingClientRect()
      if (optionBounds.top < listBounds.top) list.scrollTop += optionBounds.top - listBounds.top
      else if (optionBounds.bottom > listBounds.bottom) list.scrollTop += optionBounds.bottom - listBounds.bottom
    }
  }, [activeIndex, open, query])

  const showOptions = () => {
    setQuery('')
    setActiveIndex(Math.max(0, options.findIndex((option) => option.value === value)))
    setOpen(true)
  }

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [])

  const choose = (nextValue: string) => {
    onChange(nextValue)
    setOpen(false)
    setQuery('')
    triggerRef.current?.focus()
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); setOpen(false); triggerRef.current?.focus(); return }
    if (event.key === 'Tab') { setOpen(false); return }
    const inSearch = (event.target as HTMLElement).tagName === 'INPUT'
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) { showOptions(); return }
      const delta = event.key === 'ArrowDown' ? 1 : -1
      setActiveIndex((index) => Math.max(0, Math.min(visible.length - 1, index + delta)))
    }
    if (open && !inSearch && (event.key === 'Home' || event.key === 'End')) {
      event.preventDefault()
      setActiveIndex(event.key === 'Home' ? 0 : Math.max(0, visible.length - 1))
    }
    if (event.key === 'Enter' || (event.key === ' ' && !inSearch)) {
      event.preventDefault()
      if (!open) showOptions()
      else if (visible[activeIndex]) choose(visible[activeIndex].value)
    }
  }

  return (
    <div ref={rootRef} className={`admission-filter-control admission-listbox${open ? ' is-open' : ''}`} onKeyDown={onKeyDown}>
      <span className="admission-filter-label">{c(label)}</span>
      <button ref={triggerRef} type="button" role="combobox" aria-label={c(label)} aria-controls={open ? listId : undefined} aria-activedescendant={activeOptionId} aria-haspopup="listbox" aria-expanded={open} onClick={() => open ? setOpen(false) : showOptions()}>
        <span>{c(selected?.label ?? '')}</span><ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open ? <div className="admission-listbox-popover">
        {options.length > 6 ? <label className="admission-listbox-search"><Search className="h-4 w-4" /><input type="search" autoFocus aria-label={c(label)} aria-controls={listId} aria-activedescendant={activeOptionId} value={query} onChange={(event) => { setQuery(event.target.value); setActiveIndex(0) }} placeholder={c('Search countries')} /></label> : null}
        <ul ref={optionsRef} id={listId} role="listbox" aria-label={c(label)}>
          {visible.map((option, index) => <li id={`${listId}-${index}`} key={option.value} role="option" aria-selected={option.value === value} onMouseEnter={() => setActiveIndex(index)} onClick={() => choose(option.value)} className={index === activeIndex ? 'is-active' : ''}>{c(option.label)}{option.value === value ? <Check className="h-4 w-4" /> : null}</li>)}
        </ul>
        {!visible.length ? <p className="admission-listbox-empty" role="status"><UiText text="No options found" /></p> : null}
      </div> : null}
    </div>
  )
}

export default function AdmissionUniversities({ shortlistOnly = false }: { shortlistOnly?: boolean }) {
  const navigate = useNavigate()
  const { c } = useCopy()
  const all = useMemo(() => getUniversities(), [])
  const countries = useMemo(() => Array.from(new Set(all.map((university) => university.country))).sort(), [all])
  const { scores, country: profileCountry } = useAdmissionScores()
  const { shortlistedSet, shortlistCount, toggleShortlist } = useUniversityShortlist()
  const pushToast = useToastStore((state: ToastState) => state.pushToast)
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [country, setCountry] = useState('all')
  const [budget, setBudget] = useState<BudgetFilter>('all')
  const [ielts, setIelts] = useState<IeltsFilter>('all')
  const [rank, setRank] = useState<RankFilter>('all')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [visibleCount, setVisibleCount] = useState(UNIVERSITY_PAGE_SIZE)

  const visibleCatalog = useMemo(
    () => shortlistOnly ? all.filter((university) => shortlistedSet.has(university.slug)) : all,
    [all, shortlistedSet, shortlistOnly],
  )

  const filtered = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase()
    return visibleCatalog.filter((university) => {
      const matchesQuery = !normalizedQuery || [university.name, university.shortName, university.city, university.country]
        .some((value) => value.toLowerCase().includes(normalizedQuery))
      const matchesCountry = country === 'all' || university.country === country

      const cost = university.costOfLiving
      const matchesBudget = budget === 'all'
        || (budget === 'published' && Boolean(cost))
        || (budget === 'under-20k-usd' && cost?.currency === 'USD' && cost.period === 'academic-year' && (cost.maxAmount ?? cost.amount) <= 20_000)

      const ieltsRequirement = estimateRequirements(university).ielts
      const matchesIelts = ielts === 'all'
        || (ielts === 'up-to-6.5' && ieltsRequirement !== null && ieltsRequirement <= 6.5)
        || (ielts === 'up-to-7.0' && ieltsRequirement !== null && ieltsRequirement <= 7)
        || (ielts === '7.5-plus' && ieltsRequirement !== null && ieltsRequirement >= 7.5)
        || (ielts === 'no-cutoff' && ieltsRequirement === null)

      const matchesRank = rank === 'all'
        || (rank === 'top-10' && typeof university.rank === 'number' && university.rank <= 10)
        || (rank === 'top-25' && typeof university.rank === 'number' && university.rank <= 25)
        || (rank === 'top-50' && typeof university.rank === 'number' && university.rank <= 50)
        || (rank === 'unranked' && typeof university.rank !== 'number')

      return matchesQuery && matchesCountry && matchesBudget && matchesIelts && matchesRank
    })
  }, [budget, country, deferredQuery, ielts, rank, visibleCatalog])

  useEffect(() => {
    setVisibleCount(UNIVERSITY_PAGE_SIZE)
  }, [budget, country, deferredQuery, ielts, rank, shortlistOnly])

  const displayedUniversities = shortlistOnly ? filtered : filtered.slice(0, visibleCount)

  const handleToggleShortlist = useCallback((university: University) => {
    const added = toggleShortlist(university.slug)
    pushToast({
      type: added ? 'success' : 'info',
      title: added ? 'Added to shortlist' : 'Removed from shortlist',
      message: added
        ? `${university.shortName} is saved in your shortlist.`
        : `${university.shortName} was removed from your shortlist.`,
    })
  }, [pushToast, toggleShortlist])

  const hasFilters = Boolean(query || country !== 'all' || budget !== 'all' || ielts !== 'all' || rank !== 'all')
  const clearFilters = () => {
    setQuery('')
    setCountry('all')
    setBudget('all')
    setIelts('all')
    setRank('all')
  }

  const activeFilterCount = [country !== 'all', budget !== 'all', ielts !== 'all', rank !== 'all'].filter(Boolean).length

  return (
    <div className="workspace-page admission-universities-page relative min-h-screen overflow-x-clip px-3 py-4 sm:px-5 lg:px-7">
      <div className="admission-universities-shell relative mx-auto w-full max-w-[104rem]">
        <div className="admission-discovery-layout">
          <header className="admission-universities-intro-column">
            <div className="admission-university-top-actions">
              <Link to={shortlistOnly ? '/admission/universities' : '/admission'} className="admission-dashboard-back route-back-button">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" /> <UiText text={shortlistOnly ? 'Back to Universities' : 'Back to Applications'} />
              </Link>
              {!shortlistOnly && <button type="button" className="admission-university-top-shortlist" aria-label={c('My shortlist')} onClick={() => navigate('/admission/shortlist')}>
                <BookmarkCheck size={17} /> <span className="admission-shortlist-label"><UiText text="My shortlist" /></span> <span className="admission-shortlist-count">{shortlistCount}</span> <ArrowRight size={15} className="admission-shortlist-arrow" />
              </button>}
            </div>
            <div className="admission-university-intro-sticky">
              {shortlistOnly ? (
                <div className="admission-shortlist-summary">
                  <span className="admission-shortlist-summary-icon"><BookmarkCheck /></span>
                  <p className="admission-shortlist-summary-kicker"><UiText text="Your university plan" /></p>
                  <h1><UiText text="Your shortlist" /> <span>{shortlistCount}</span></h1>
                  <p><UiText text="Keep your strongest options together, open their profiles and remove choices as your plan becomes clearer." /></p>
                  <button onClick={() => navigate('/admission/universities')}>
                    <Compass className="h-4 w-4" /> <UiText text="Browse universities" />
                  </button>
                </div>
              ) : (
                <div className="admission-university-intro">
                  <div className="admission-university-intro-main">
                    <span className="admission-university-intro-kicker"><GraduationCap size={17} /> <UiText text="University discovery" /></span>
                    <h1><UiText text="Find your" /> <em><UiText text="next chapter." /></em></h1>
                    <p><UiText text="Explore universities, compare real details and save the places that belong on your shortlist." /></p>
                  </div>
                  <div className="admission-university-intro-stats" aria-label="University catalog at a glance">
                    <div><strong>{UNIVERSITY_COUNT.toLocaleString('en-US')}</strong><span><UiText text="Universities" /></span></div>
                    <div><strong>{QS_2027_RANKED_UNIVERSITY_COUNT.toLocaleString('en-US')}</strong><span><UiText text="QS ranked" /></span></div>
                    <div><strong>{countries.length}</strong><span><UiText text="Countries" /></span></div>
                  </div>
                </div>
              )}
            </div>
          </header>

          <section className="admission-universities-results-column min-w-0">
            <div className="admission-search-panel">
              <div className="admission-catalog-heading"><div><span><Building2 size={15} /> <UiText text={shortlistOnly ? 'Saved universities' : 'University catalog'} /></span><h2><UiText text={shortlistOnly ? 'Your shortlist' : 'Explore universities'} /></h2></div><p><UiText text={shortlistOnly ? 'Keep your chosen options close while you plan your next step.' : 'Discover institutions that match your goals, location and budget.'} /></p></div>
              <div className="admission-search-box">
                <Search aria-hidden="true" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={c(shortlistOnly ? 'Search your shortlist' : 'Find your university')}
                  aria-label={c(shortlistOnly ? 'Search shortlisted universities' : 'Search universities')}
                />
              </div>

              <button type="button" className="admission-filter-toggle" aria-controls="admission-university-filters" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((open) => !open)}>
                <SlidersHorizontal size={16} /> <UiText text="Filters" />{activeFilterCount > 0 && <span>{activeFilterCount}</span>}<ChevronDown size={16} aria-hidden="true" />
              </button>
              <div id="admission-university-filters" className={`admission-filter-row${filtersOpen ? ' is-expanded' : ''}`}>
                <FilterSelect label="Country" value={country} onChange={setCountry} options={[{ value: 'all', label: 'All countries' }, ...countries.map((item) => ({ value: item, label: item }))]} />
                <FilterSelect label="Living-cost budget" value={budget} onChange={(value) => setBudget(value as BudgetFilter)} options={[{ value: 'all', label: 'Any budget' }, { value: 'published', label: 'Published cost' }, { value: 'under-20k-usd', label: 'Under $20k / year' }]} />
                <FilterSelect label="IELTS requirement" value={ielts} onChange={(value) => setIelts(value as IeltsFilter)} options={[{ value: 'all', label: 'Any IELTS' }, { value: 'up-to-6.5', label: 'IELTS up to 6.5' }, { value: 'up-to-7.0', label: 'IELTS up to 7.0' }, { value: '7.5-plus', label: 'IELTS 7.5+' }, { value: 'no-cutoff', label: 'No numeric cutoff' }]} />
                <FilterSelect label="QS rank" value={rank} onChange={(value) => setRank(value as RankFilter)} options={[{ value: 'all', label: 'Any QS rank' }, { value: 'top-10', label: 'QS top 10' }, { value: 'top-25', label: 'QS top 25' }, { value: 'top-50', label: 'QS top 50' }, { value: 'unranked', label: 'Not QS ranked' }]} />
              </div>

              <div className="admission-results-meta">
                <span role="status" aria-live="polite"><Compass className="h-3.5 w-3.5" /> {filtered.length.toLocaleString('en-US')} <UiText text={shortlistOnly ? 'Shortlisted' : 'universities found'} /></span>
                <span className="hidden sm:inline">{shortlistOnly ? <UiText text="Saved on this device" /> : <>QS 2027 · {QS_2027_RANKED_UNIVERSITY_COUNT.toLocaleString('en-US')} <UiText text="QS ranked" /></>}</span>
                {hasFilters && (
                  <button type="button" onClick={clearFilters}><RotateCcw className="h-3.5 w-3.5" />  <UiText text={"Reset filters"} /> </button>
                )}
              </div>
            </div>

            <div
              className="admission-university-scroll"
              role="region"
              aria-label="University results"
            >
              {shortlistOnly && shortlistCount === 0 ? (
                <div className="admission-empty-state admission-shortlist-empty">
                  <Bookmark className="h-7 w-7" />
                  <h2> <UiText text={"Your shortlist is empty"} /> </h2>
                  <p> <UiText text={"Save universities you want to compare and revisit."} /> </p>
                  <button onClick={() => navigate('/admission/universities')}><UiText text="Browse universities" /></button>
                </div>
              ) : filtered.length === 0 ? (
                <div className="admission-empty-state">
                  <Search className="h-7 w-7" />
                  <h2> <UiText text={"No universities found"} /> </h2>
                  <p> <UiText text={"Try a wider country, score, budget or ranking filter."} /> </p>
                  <button type="button" onClick={clearFilters}><UiText text="Clear all filters" /></button>
                </div>
              ) : (
                <div className="admission-university-grid">
                  {displayedUniversities.map((university, index) => (
                    <UniversityCard
                      key={university.id}
                      university={university}
                      scores={scores}
                      preferredCountry={profileCountry}
                      priority={index < 4}
                      shortlisted={shortlistedSet.has(university.slug)}
                      onToggleShortlist={handleToggleShortlist}
                      returnTo={shortlistOnly ? '/admission/shortlist' : '/admission/universities'}
                    />
                  ))}
                </div>
              )}

              {!shortlistOnly && displayedUniversities.length < filtered.length ? (
                <div className="mt-5 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((count) => Math.min(filtered.length, count + UNIVERSITY_PAGE_SIZE))}
                    className="admission-show-more"
                  >
                     <UiText text={"Show more universities"} /> <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs">{filtered.length - displayedUniversities.length}</span>
                  </button>
                </div>
              ) : null}

              <p className="admission-catalog-note">
                <Sparkles className="h-3.5 w-3.5" /> Rankings: {QS_EDITION}, published 18 June 2026. Admission and cost details appear only where they have been independently verified.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
