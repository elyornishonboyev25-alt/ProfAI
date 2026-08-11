import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, MapPin, Search, Sparkles, Trophy } from 'lucide-react'
import { AmbientBackdrop, Reveal, Stagger, StaggerItem } from '@/components/fx'
import UniversityLogo from '@/components/admission/UniversityLogo'
import AdmissionScoreComparison from '@/components/admission/AdmissionScoreComparison'
import UniversityGlobe from '@/components/admission/UniversityGlobe'
import { getUniversities, indicatorOrder, QS_EDITION, QS_TOP_50_COUNT, UNIVERSITY_COUNT } from '@/data/admission'
import { useAdmissionScores } from '@/hooks/useAdmissionScores'

// The two headline indicators QS prints under each ranking row.
const ROW_KEYS = ['citationsPerFaculty', 'academicReputation'] as const

export default function AdmissionUniversities() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const all = getUniversities()
  const { scores } = useAdmissionScores()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return all
    return all.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.shortName.toLowerCase().includes(q) ||
        u.city.toLowerCase().includes(q) ||
        u.country.toLowerCase().includes(q),
    )
  }, [all, query])

  return (
    <div className="workspace-page admission-universities-page relative min-h-screen overflow-x-clip px-4 py-8 sm:px-6 lg:px-8">
      <div className="admission-universities-blur-field" aria-hidden="true">
        <span className="admission-blur-glow admission-blur-glow-left" />
        <span className="admission-blur-glow admission-blur-glow-right" />
      </div>
      <AmbientBackdrop variant="red" grid={false} className="admission-universities-ambient" />

      <div className="relative mx-auto w-full max-w-[90rem] space-y-6">
        <Reveal>
          <section className="premium-hero admission-universities-hero p-6 sm:p-8">
            <div className="relative z-10">
              <div className="premium-top-controls">
                <button onClick={() => navigate('/dashboard')} className="premium-back-btn">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to Dashboard
                </button>
                <span className="premium-top-chip">
                  <Trophy className="h-3.5 w-3.5" />
                  {QS_EDITION}
                </span>
              </div>
              <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h1 className="premium-section-title">
                    World University <span className="arena-title-accent-red">Rankings</span>
                  </h1>
                  <p className="premium-section-subtitle max-w-3xl">
                    Explore {UNIVERSITY_COUNT} verified profiles: the complete QS 2027 top {QS_TOP_50_COUNT}, every Ivy League university, and
                    selected universities in Uzbekistan. Admission policies link directly to each university’s official website.
                  </p>
                </div>
                <div className="relative w-full shrink-0 sm:w-80">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name or country…"
                    className="h-11 w-full rounded-xl border border-red-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  />
                </div>
              </div>
            </div>
          </section>
        </Reveal>

        <div className="admission-universities-layout">
          <aside className="admission-universities-globe-column">
            <UniversityGlobe />
          </aside>

          <div className="min-w-0">
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-red-100 bg-white p-10 text-center text-slate-500">
                No universities match your search.
              </div>
            ) : (
              <Stagger key={query} className="space-y-3.5">
            {filtered.map((u) => {
              const rowMetrics = ROW_KEYS.map((key) => ({
                label: indicatorOrder.find((m) => m.key === key)?.short ?? key,
                value: u.indicators[key],
              })).filter((m) => typeof m.value === 'number') as { label: string; value: number }[]

              return (
                <StaggerItem key={u.id}>
                  <button
                    onClick={() => navigate(`/admission/universities/${u.slug}`)}
                    className="group grid w-full grid-cols-[auto_1fr] gap-0 overflow-hidden rounded-[1.4rem] border border-slate-200 bg-white text-left shadow-[0_12px_30px_rgba(15,23,42,0.05)] transition hover:border-red-200 hover:shadow-[0_20px_46px_rgba(220,38,38,0.14)] sm:grid-cols-[7.25rem_minmax(0,1fr)]"
                  >
                    {/* Rank + overall score rail */}
                    <div
                      className="flex flex-row items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white px-4 py-3 sm:flex-col sm:items-center sm:justify-center sm:border-b-0 sm:border-r sm:py-6"
                      style={{ boxShadow: `inset 3px 0 0 ${u.brand.accent}` }}
                    >
                      <div className="text-center">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Rank</p>
                        <p className="text-3xl font-black leading-none text-slate-900 sm:text-4xl">{typeof u.rank === 'number' ? `${u.rankTied ? '=' : ''}${u.rank}` : '—'}</p>
                      </div>
                      <div className="text-center sm:mt-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Overall</p>
                        <p className="text-xl font-black leading-none" style={{ color: u.brand.accent }}>
                          {typeof u.overallScore === 'number' ? u.overallScore : '—'}
                        </p>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="grid min-w-0 grid-cols-1 gap-4 p-4 sm:grid-cols-[4rem_minmax(0,1fr)] sm:items-center sm:p-5 xl:grid-cols-[4rem_minmax(0,1fr)_auto]">
                      <UniversityLogo id={u.id} brand={u.brand} size={64} className="hidden sm:inline-flex" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 sm:hidden">
                          <UniversityLogo id={u.id} brand={u.brand} size={46} />
                          <div className="min-w-0">
                            <h2 className="truncate text-base font-black tracking-tight text-slate-900">{u.name}</h2>
                            <p className="mt-0.5 inline-flex items-center gap-1 text-[12px] font-medium text-slate-500">
                              <MapPin className="h-3 w-3" />
                              {u.countryEmoji} {u.city}, {u.country}
                            </p>
                          </div>
                        </div>
                        <h2 className="hidden break-words text-lg font-black leading-tight tracking-tight text-slate-900 sm:block">
                          {u.name}
                        </h2>
                        <p className="hidden items-center gap-1 text-[13px] font-medium text-slate-500 sm:inline-flex">
                          <MapPin className="h-3.5 w-3.5" />
                          {u.countryEmoji} {u.city}, {u.country}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {u.groups?.map((group) => (
                            <span key={group} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] text-slate-500">
                              {group === 'qs-top-50' ? 'QS Top 50' : group === 'ivy-league' ? 'Ivy League' : 'Uzbekistan'}
                            </span>
                          ))}
                        </div>

                        {/* indicator mini-bars */}
                        <div className="mt-3 grid max-w-md grid-cols-2 gap-x-5 gap-y-2">
                          {rowMetrics.map((m) => (
                            <div key={m.label}>
                              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                                <span className="truncate">{m.label}</span>
                                <span className="text-slate-800">{m.value}</span>
                              </div>
                              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className="h-full rounded-full"
                                  style={{ width: `${m.value}%`, background: u.brand.accent }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 max-w-xl">
                          <AdmissionScoreComparison university={u} scores={scores} compact />
                        </div>
                      </div>

                      <div className="flex items-center justify-end sm:col-start-2 xl:col-start-3 xl:row-start-1">
                        <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-red-200 bg-red-50/60 px-3.5 py-1.5 text-[12px] font-bold text-red-700 transition group-hover:gap-2 group-hover:bg-red-100">
                          Explore
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  </button>
                </StaggerItem>
              )
            })}
              </Stagger>
            )}
          </div>
        </div>

        <Reveal delay={0.05}>
          <p className="flex items-center justify-center gap-2 pb-2 text-center text-[12px] font-medium text-slate-400">
            <Sparkles className="h-3.5 w-3.5" />
            Rankings: {QS_EDITION}. Catalog and official source links verified 6 August 2026.
          </p>
        </Reveal>
      </div>
    </div>
  )
}
