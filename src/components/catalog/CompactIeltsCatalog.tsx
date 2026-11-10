import { useCopy } from '@/i18n/interface'
import { useStudyAccessPrompt } from '@/features/billing/useStudyAccessPrompt'
import StudyAccessChip from '@/features/billing/StudyAccessChip'
import UiText from '@/components/common/UiText'
import CatalogScore, { type CatalogResult } from './CatalogScore'
import type { ReactNode } from 'react'
import type { IeltsCatalogResult } from '@/utils/ieltsCatalogResults'
import '@/styles/exam-catalog.css'
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  Check,
  CheckCircle2,
  Clock3,
  Headphones,
  Mic2,
  PenLine,
  Search,
  Sparkles,
} from 'lucide-react'

export type IeltsCatalogSection = 'reading' | 'listening' | 'writing' | 'speaking'

export type CompactIeltsTestRow = IeltsCatalogResult & {
  id: string
  number: number
  title: string
  subtitle: string
  badge: string
  durationMinutes?: number
  detail?: string
  available: boolean
  result?: CatalogResult
}

type CompactIeltsCatalogProps = {
  section: IeltsCatalogSection
  rows: CompactIeltsTestRow[]
  searchTerm: string
  onSearchChange: (value: string) => void
  onBack: () => void
  onLaunch: (row: CompactIeltsTestRow) => void
  headerExtra?: ReactNode
  embedded?: boolean
  filters?: readonly { value: string; label: string }[]
  activeFilter?: string
  onFilterChange?: (value: string) => void
}

const SECTION_META = {
  reading: {
    label: 'Reading',
    icon: BookOpenText,
    summary: 'Academic passages, evidence and exam-accurate questions.',
    detail: '3 passages · 60 minutes',
  },
  listening: {
    label: 'Listening',
    icon: Headphones,
    summary: 'Focused audio practice with complete academic simulations.',
    detail: '4 parts · 30 minutes',
  },
  writing: {
    label: 'Writing',
    icon: PenLine,
    summary: 'Task 1 and Task 2 practice in official exam format.',
    detail: '2 tasks · 60 minutes',
  },
  speaking: {
    label: 'Speaking',
    icon: Mic2,
    summary: 'Interview, long-turn and discussion practice with feedback.',
    detail: '3 parts · AI feedback',
  },
} as const

export default function CompactIeltsCatalog({
  section,
  rows,
  searchTerm,
  onSearchChange,
  onBack,
  onLaunch,
  headerExtra,
  embedded = false,
  filters,
  activeFilter,
  onFilterChange,
}: CompactIeltsCatalogProps) {
  const { c: uiCopy } = useCopy()
  const studyAccess = useStudyAccessPrompt()
  const meta = SECTION_META[section]
  const HeroIcon = meta.icon
  const completedCount = rows.filter((row) => row.completed).length
  const availableCount = rows.filter((row) => row.available).length

  return (
    <div id={embedded ? section : undefined} className={`${embedded ? 'scroll-mt-24' : 'mx-auto w-full max-w-[1480px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7'}`}>
      {!embedded ? <section className="relative isolate overflow-hidden rounded-3xl border border-white/90 bg-gradient-to-br from-white/90 to-slate-200/80 px-5 py-5 shadow-[0_28px_70px_rgba(30,64,175,.1),inset_0_1px_0_white] sm:px-8 sm:py-7 lg:px-10">
        <div className="pointer-events-none absolute inset-x-[12%] top-0 -z-10 h-px bg-gradient-to-r from-transparent via-white to-transparent" />

        <div className="grid min-h-[15rem] items-center gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="relative">
            <button
              type="button"
              onClick={onBack}
              className="exam-catalog-back"
            >
              <ArrowLeft className="h-4 w-4" />  <UiText text={"Back"} /> </button>

            <p className="mt-7 inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
              <Sparkles className="h-3.5 w-3.5" /> IELTS Academic
            </p>
            <h1 className="mt-2 text-[2.7rem] font-black leading-none tracking-[-0.065em] text-slate-950 sm:text-6xl lg:text-[4.8rem]">
              IELTS <UiText text={meta.label} />
            </h1>
            <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-slate-600 sm:text-base"><UiText text={meta.summary} /></p>
            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-slate-600">
              <span>{rows.length} <UiText text="tests" /></span>
              <span><UiText text={meta.detail} /></span>
            </div>
          </div>

          <div className="relative hidden h-[13rem] overflow-hidden rounded-[2rem] border border-white/90 bg-white/48 p-6 shadow-[0_20px_50px_rgba(30,64,175,.09),inset_0_1px_0_white] lg:block" aria-hidden="true">
            <div className="absolute -right-10 -top-12 h-44 w-44 rounded-full border border-blue-200/60" />
            <div className="absolute -right-2 -top-2 h-24 w-24 rounded-full border border-slate-300/70" />
            <div className="absolute bottom-5 left-5 right-5 h-px bg-gradient-to-r from-slate-400/70 to-transparent" />
            <div className="relative flex h-full items-center gap-5">
              <span className="grid h-24 w-24 shrink-0 place-items-center text-slate-700">
                <HeroIcon className="h-11 w-11" strokeWidth={1.55} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.17em] text-slate-400"><UiText text={"Test library"} /></p>
                <p className="mt-1 text-3xl font-black tracking-[-0.05em] text-slate-950">{availableCount}</p>
                <p className="text-xs font-bold text-slate-500"><UiText text={"available now"} /></p>
                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <CheckCircle2 className="h-4 w-4" /> {completedCount} <UiText text={"completed"} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section> : null}

      <section className={`exam-catalog ielts-catalog-panel relative overflow-hidden rounded-[2.25rem] border border-white/90 bg-white/86 p-4 shadow-[0_24px_64px_rgba(30,64,175,.09),inset_0_1px_0_white] sm:p-5 lg:p-6 ${embedded ? '' : 'mt-5'}`}>
        <div className="ielts-catalog-header relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="exam-catalog-heading-copy">
            <span className="exam-catalog-heading-icon" aria-hidden="true"><HeroIcon size={24} strokeWidth={1.6} /></span>
            <div><h2 className="mt-0.5 text-xl font-black tracking-tight text-slate-950"><UiText text={meta.label} />  <UiText text={"tests"} /> </h2>
              <p className="exam-catalog-description"><UiText text={meta.summary} /></p></div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            {headerExtra}
            <label className="relative block w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={uiCopy("Search test...")}
                aria-label={uiCopy("Search test...")}
                className="exam-catalog-search h-11 w-full pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-500"
              />
            </label>
          </div>
        </div>

        <div className="exam-catalog-toolbar">
          {filters && activeFilter && onFilterChange ? (
          <div className="exam-catalog-filters" role="group" aria-label={uiCopy("{{value1}} test type", { value1: String(meta.label) })}>
            {filters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                aria-pressed={activeFilter === filter.value}
                onClick={() => onFilterChange(filter.value)}
              >
                <UiText text={filter.label} />
              </button>
            ))}
          </div>
          ) : <span />}
          <div className="exam-catalog-overview" aria-live="polite"><span><strong>{availableCount}</strong> <UiText text="available now" /></span>{completedCount > 0 && <span><CheckCircle2 size={13} /><strong>{completedCount}</strong> <UiText text="completed" /></span>}</div>
        </div>

        {rows.length === 0 ? (
          <div className="relative mt-5 rounded-[1.75rem] border border-dashed border-blue-200 bg-white/64 px-4 py-12 text-center text-sm font-semibold text-slate-500">
            <UiText text={"No tests found."} />
          </div>
        ) : (
          <div className="test-card-grid mt-5">
            {rows.map((row) => {
              const correct = row.band === undefined && row.scoreLabel ? /^(\d+)\/(\d+) correct$/.exec(row.scoreLabel) : null
              const topic = row.badge !== 'Full test' && (section === 'writing' || section === 'speaking')
                ? row.subtitle.replace(/^(?:Task [12]|Part [123]) · /, '')
                : null
              return (
                <button
                  key={row.id}
                  type="button"
                  disabled={!row.available}
                  onClick={() => { if (studyAccess.open(`test:${section}:${row.id}`)) onLaunch(row) }}
                  className="test-card ielts-catalog-card"
                >
                  <div className="test-card-heading">
                    <span className="test-card-icon"><HeroIcon size={21} strokeWidth={1.7} aria-hidden="true" /></span>
                    <h3 className="test-card-title">{row.title}</h3>
                  </div>
                  <div className="test-card-info">
                    <StudyAccessChip resource={`test:${section}:${row.id}`} />
                    {row.completed ? (
                      <span><Check size={14} aria-hidden="true" /><UiText text="Completed" /></span>
                    ) : row.progressLabel ? (
                      <span><UiText text={row.progressLabel} /></span>
                    ) : null}
                  </div>
                  {topic && <p className="test-card-note"><UiText text={topic} /></p>}
                  {(row.durationMinutes || row.detail) && <div className="test-card-meta">
                    {row.durationMinutes ? <span><Clock3 size={15} aria-hidden="true" />{row.durationMinutes} <UiText text="min" /></span> : null}
                    {row.detail && <span><UiText text={row.detail} /></span>}
                  </div>}
                  {row.result ? <CatalogScore {...row.result} /> : row.band !== undefined ? <CatalogScore score={row.band} maximum={9} label={uiCopy('Band')} detail={row.scoreLabel} /> : correct && Number(correct[2]) > 0 ? (
                    <CatalogScore score={Number(correct[1])} maximum={Number(correct[2])} label={uiCopy('Correct answers')} band={false} />
                  ) : row.scoreLabel ? <span className="test-card-note"><UiText text={row.scoreLabel} /></span> : null}

                  <span className="test-card-action">
                    <UiText text={row.available ? row.completed ? 'Retake' : 'Open' : 'Coming soon'} />
                    {row.available && <ArrowRight size={16} aria-hidden="true" />}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
