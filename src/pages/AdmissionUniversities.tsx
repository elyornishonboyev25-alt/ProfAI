import { memo, useCallback, useDeferredValue, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Compass,
  Globe2,
  MapPin,
  RotateCcw,
  Search,
  Sparkles,
} from 'lucide-react'
import { BrandMark } from '@/components/brand/BrandLogo'
import UniversityLogo from '@/components/admission/UniversityLogo'
import UniversityGlobe from '@/components/admission/UniversityGlobe'
import { getUniversities, QS_EDITION, QS_TOP_50_COUNT, UNIVERSITY_COUNT } from '@/data/admission'
import { estimateRequirements, scoreUniversity } from '@/data/admission/match'
import type { University } from '@/data/admission'
import { useAdmissionScores, type AdmissionScores } from '@/hooks/useAdmissionScores'

type BudgetFilter = 'all' | 'published' | 'under-20k-usd'
type IeltsFilter = 'all' | 'up-to-6.5' | 'up-to-7.0' | '7.5-plus' | 'no-cutoff'
type RankFilter = 'all' | 'top-10' | 'top-25' | 'top-50' | 'unranked'

function yearlyCostLabel(university: University) {
  const cost = university.costOfLiving
  if (!cost) return 'Budget not published'

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: cost.currency,
    notation: cost.amount >= 100_000 ? 'compact' : 'standard',
    maximumFractionDigits: 0,
  })
  const min = formatter.format(cost.amount)
  const max = cost.maxAmount ? formatter.format(cost.maxAmount) : null
  const period = cost.period === 'month' ? '/mo' : '/yr'
  return `${min}${max ? `–${max}` : ''}${period}`
}

function ieltsLabel(university: University) {
  const requirements = university.admission?.bachelor ?? []
  const requirement = requirements.find((item) => item.comparison === 'ieltsOverall')
    ?? requirements.find((item) => item.label === 'IELTS')
  return requirement?.value ?? 'No IELTS cutoff'
}

const UniversityCard = memo(function UniversityCard({
  university,
  scores,
  onOpen,
}: {
  university: University
  scores: AdmissionScores
  onOpen: (slug: string) => void
}) {
  const fit = scoreUniversity(university, scores)
  const hasProfileScores = scores.satTotal !== null || scores.ieltsOverall !== null

  return (
    <article
      className="admission-university-card"
      onClick={() => onOpen(university.slug)}
    >
      <div
        className="admission-card-glow"
        style={{ '--university-accent': university.brand.accent } as React.CSSProperties}
        aria-hidden="true"
      />
      <div className="admission-card-topline">
        <UniversityLogo name={university.name} brand={university.brand} website={university.website} size={82} rounded="1.15rem" />
        <span className="admission-rank-badge" style={{ '--university-accent': university.brand.accent } as React.CSSProperties}>
          <small>QS rank</small>
          <strong>{typeof university.rank === 'number' ? `${university.rankTied ? '=' : ''}${university.rank}` : '—'}</strong>
        </span>
      </div>

      <div className="admission-card-copy">
        <p className="admission-card-kicker">{university.shortName}</p>
        <h2>{university.name}</h2>
        <p className="admission-card-location"><MapPin className="h-3.5 w-3.5" /> {university.city}, {university.country}</p>
      </div>

      <div className="admission-card-tags">
        <span>IELTS {ieltsLabel(university)}</span>
        {university.groups?.includes('ivy-league') && <span>Ivy League</span>}
      </div>

      <div className="admission-card-footer">
        <div>
          <small>Living budget</small>
          <strong>{yearlyCostLabel(university)}</strong>
        </div>
        <div
          className="admission-match-ring"
          style={{ '--match-value': `${fit.fitPercent * 3.6}deg`, '--university-accent': university.brand.accent } as React.CSSProperties}
          title={hasProfileScores ? 'Fit based on your saved scores' : 'Add your SAT or IELTS score for a more precise fit'}
        >
          <span><small>{hasProfileScores ? 'Match' : 'Fit'}</small><strong>{fit.fitPercent}%</strong></span>
        </div>
      </div>

      <button className="admission-card-open" aria-label={`Explore ${university.name}`}>
        Explore <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </article>
  )
})

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
}) {
  return (
    <label className="admission-filter-control">
      <span className="admission-filter-dot" aria-hidden="true" />
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} aria-label={label}>
        {children}
      </select>
      <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden="true" />
    </label>
  )
}

export default function AdmissionUniversities() {
  const navigate = useNavigate()
  const all = useMemo(() => getUniversities(), [])
  const countries = useMemo(() => Array.from(new Set(all.map((university) => university.country))).sort(), [all])
  const { scores } = useAdmissionScores()
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [country, setCountry] = useState('all')
  const [budget, setBudget] = useState<BudgetFilter>('all')
  const [ielts, setIelts] = useState<IeltsFilter>('all')
  const [rank, setRank] = useState<RankFilter>('all')

  const filtered = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase()
    return all.filter((university) => {
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
  }, [all, budget, country, deferredQuery, ielts, rank])

  const openUniversity = useCallback((universitySlug: string) => {
    navigate(`/admission/universities/${universitySlug}`)
  }, [navigate])

  const hasFilters = Boolean(query || country !== 'all' || budget !== 'all' || ielts !== 'all' || rank !== 'all')
  const clearFilters = () => {
    setQuery('')
    setCountry('all')
    setBudget('all')
    setIelts('all')
    setRank('all')
  }

  return (
    <div className="workspace-page admission-universities-page relative min-h-screen overflow-x-clip px-3 py-4 sm:px-5 lg:px-7">
      <div className="admission-universities-blur-field" aria-hidden="true">
        <span className="admission-blur-glow admission-blur-glow-left" />
        <span className="admission-blur-glow admission-blur-glow-right" />
        <span className="admission-blur-glow admission-blur-glow-center" />
      </div>

      <div className="admission-universities-shell relative mx-auto w-full max-w-[104rem]">
        <header className="admission-hub-nav">
          <button className="admission-hub-brand" onClick={() => navigate('/admission')} aria-label="Open Admission Hub">
            <span className="admission-hub-brand-mark"><BrandMark size={60} /></span>
            <span className="admission-hub-wordmark">Prof<span>AI</span></span>
            <span className="admission-hub-divider" aria-hidden="true" />
            <span className="admission-hub-title">Admission Hub</span>
          </button>

          <nav className="admission-journey" aria-label="Admission journey">
            <button className="is-active" onClick={() => navigate('/admission/universities')}>Choose</button>
            <ArrowRight aria-hidden="true" />
            <button onClick={() => navigate('/admission/lessons')}>Prepare</button>
            <ArrowRight aria-hidden="true" />
            <button onClick={() => navigate('/admission/lessons')}>Apply</button>
            <ArrowRight aria-hidden="true" />
            <button onClick={() => navigate('/admission')}>Admitted</button>
          </nav>
        </header>

        <main className="admission-discovery-layout">
          <aside className="admission-universities-globe-column">
            <button onClick={() => navigate('/dashboard')} className="admission-dashboard-back">
              <ArrowLeft className="h-4 w-4" /> <span>Back to Dashboard</span>
            </button>
            <div className="admission-globe-sticky">
              <UniversityGlobe />
              <div className="admission-globe-caption">
                <Globe2 className="h-4 w-4" />
                <span>{UNIVERSITY_COUNT} verified university profiles</span>
              </div>
            </div>
          </aside>

          <section className="admission-universities-results-column min-w-0">
            <div className="admission-search-panel">
              <div className="admission-search-box">
                <Search aria-hidden="true" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Find your university"
                  aria-label="Search universities"
                />
                <span className="admission-search-action"><Search aria-hidden="true" /></span>
              </div>

              <div className="admission-filter-row">
                <FilterSelect label="Country" value={country} onChange={setCountry}>
                  <option value="all">All countries</option>
                  {countries.map((item) => <option key={item} value={item}>{item}</option>)}
                </FilterSelect>
                <FilterSelect label="Living-cost budget" value={budget} onChange={(value) => setBudget(value as BudgetFilter)}>
                  <option value="all">Any budget</option>
                  <option value="published">Published cost</option>
                  <option value="under-20k-usd">Under $20k / year</option>
                </FilterSelect>
                <FilterSelect label="IELTS requirement" value={ielts} onChange={(value) => setIelts(value as IeltsFilter)}>
                  <option value="all">Any IELTS</option>
                  <option value="up-to-6.5">IELTS up to 6.5</option>
                  <option value="up-to-7.0">IELTS up to 7.0</option>
                  <option value="7.5-plus">IELTS 7.5+</option>
                  <option value="no-cutoff">No numeric cutoff</option>
                </FilterSelect>
                <FilterSelect label="QS rank" value={rank} onChange={(value) => setRank(value as RankFilter)}>
                  <option value="all">Any QS rank</option>
                  <option value="top-10">QS top 10</option>
                  <option value="top-25">QS top 25</option>
                  <option value="top-50">QS top 50</option>
                  <option value="unranked">Not QS ranked</option>
                </FilterSelect>
              </div>

              <div className="admission-results-meta">
                <span><Compass className="h-3.5 w-3.5" /> {filtered.length} universities found</span>
                <span className="hidden sm:inline">Complete QS 2027 top {QS_TOP_50_COUNT}</span>
                {hasFilters && (
                  <button onClick={clearFilters}><RotateCcw className="h-3.5 w-3.5" /> Reset filters</button>
                )}
              </div>
            </div>

            <div
              className="admission-university-scroll"
              role="region"
              aria-label="University results"
              tabIndex={0}
            >
              {filtered.length === 0 ? (
                <div className="admission-empty-state">
                  <Search className="h-7 w-7" />
                  <h2>No universities found</h2>
                  <p>Try a wider country, score, budget or ranking filter.</p>
                  <button onClick={clearFilters}>Clear all filters</button>
                </div>
              ) : (
                <div className="admission-university-grid">
                  {filtered.map((university) => (
                    <UniversityCard key={university.id} university={university} scores={scores} onOpen={openUniversity} />
                  ))}
                </div>
              )}

              <p className="admission-catalog-note">
                <Sparkles className="h-3.5 w-3.5" /> Rankings: {QS_EDITION}. Catalog refreshed 12 August 2026; official admission and cost sources open from each profile.
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
