import type { ReactNode } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  CheckCircle2,
  Clock3,
  Headphones,
  Lock,
  Mic2,
  PenLine,
  Search,
  Sparkles,
} from 'lucide-react'

export type IeltsCatalogSection = 'reading' | 'listening' | 'writing' | 'speaking'

export type CompactIeltsTestRow = {
  id: string
  number: number
  title: string
  subtitle: string
  badge: string
  durationMinutes: number
  detail: string
  available: boolean
  completed?: boolean
}

type CompactIeltsCatalogProps = {
  section: IeltsCatalogSection
  rows: CompactIeltsTestRow[]
  searchTerm: string
  onSearchChange: (value: string) => void
  onBack: () => void
  onLaunch: (row: CompactIeltsTestRow) => void
  headerExtra?: ReactNode
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
}: CompactIeltsCatalogProps) {
  const meta = SECTION_META[section]
  const HeroIcon = meta.icon
  const completedCount = rows.filter((row) => row.completed).length
  const availableCount = rows.filter((row) => row.available).length

  return (
    <main className="mx-auto w-full max-w-[1480px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <section className="relative isolate overflow-hidden rounded-[2.25rem] border border-white/90 bg-[linear-gradient(125deg,rgba(255,255,255,.92),rgba(255,247,247,.72)_46%,rgba(232,241,255,.76))] px-5 py-5 shadow-[0_28px_70px_rgba(30,64,175,.1),inset_0_1px_0_white] sm:px-8 sm:py-7 lg:px-10">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_0%_0%,rgba(248,113,113,.2),transparent_34%),radial-gradient(circle_at_100%_0%,rgba(96,165,250,.22),transparent_38%)]" />
        <div className="pointer-events-none absolute inset-x-[12%] top-0 -z-10 h-px bg-gradient-to-r from-transparent via-white to-transparent" />

        <div className="grid min-h-[15rem] items-center gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="relative">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-white/95 bg-white/82 px-4 text-xs font-black text-slate-700 shadow-[0_10px_28px_rgba(30,64,175,.08),inset_0_1px_0_white] transition-colors hover:bg-white hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>

            <p className="mt-7 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-red-600">
              <Sparkles className="h-3.5 w-3.5" /> IELTS Academic
            </p>
            <h1 className="mt-2 text-[2.7rem] font-black leading-none tracking-[-0.065em] text-slate-950 sm:text-6xl lg:text-[4.8rem]">
              IELTS <span className="bg-gradient-to-r from-red-700 via-red-600 to-rose-500 bg-clip-text text-transparent">{meta.label}</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-slate-600 sm:text-base">{meta.summary}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-red-100 bg-white/72 px-3 py-1.5 text-[11px] font-black text-red-700">{rows.length} tests</span>
              <span className="rounded-full border border-slate-200/80 bg-white/72 px-3 py-1.5 text-[11px] font-black text-slate-600">{meta.detail}</span>
              <span className="rounded-full border border-emerald-100 bg-emerald-50/80 px-3 py-1.5 text-[11px] font-black text-emerald-700">Progress saved</span>
            </div>
          </div>

          <div className="relative hidden h-[13rem] overflow-hidden rounded-[2rem] border border-white/90 bg-white/48 p-6 shadow-[0_20px_50px_rgba(30,64,175,.09),inset_0_1px_0_white] lg:block" aria-hidden="true">
            <div className="absolute -right-10 -top-12 h-44 w-44 rounded-full border border-blue-200/60" />
            <div className="absolute -right-2 -top-2 h-24 w-24 rounded-full border border-red-200/70" />
            <div className="absolute bottom-5 left-5 right-5 h-px bg-gradient-to-r from-red-400/70 via-blue-400/60 to-transparent" />
            <div className="relative flex h-full items-center gap-5">
              <span className="grid h-24 w-24 shrink-0 place-items-center rounded-[1.75rem] border border-white bg-gradient-to-br from-red-50 to-blue-50 text-red-600 shadow-[0_18px_38px_rgba(185,28,28,.12)]">
                <HeroIcon className="h-11 w-11" strokeWidth={1.55} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.17em] text-slate-400">Test library</p>
                <p className="mt-1 text-3xl font-black tracking-[-0.05em] text-slate-950">{availableCount}</p>
                <p className="text-xs font-bold text-slate-500">available now</p>
                <div className="mt-4 flex items-center gap-2 text-xs font-black text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" /> {completedCount} completed
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative mt-5 overflow-hidden rounded-[2.25rem] border border-white/90 bg-white/86 p-4 shadow-[0_24px_64px_rgba(30,64,175,.09),inset_0_1px_0_white] sm:p-5 lg:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_92%_0%,rgba(59,130,246,.1),transparent_28%),radial-gradient(circle_at_6%_100%,rgba(239,68,68,.06),transparent_30%)]" />

        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-600">IELTS Academic</p>
            <h2 className="mt-0.5 text-xl font-black tracking-tight text-slate-950">{meta.label} tests</h2>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            {headerExtra}
            <label className="relative block w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search test..."
                className="h-11 w-full rounded-full border border-white/90 bg-white/86 pl-10 pr-4 text-sm text-slate-900 shadow-[0_8px_22px_rgba(30,64,175,.06)] outline-none transition placeholder:text-slate-400 focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-100"
              />
            </label>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="relative mt-5 rounded-[1.75rem] border border-dashed border-blue-200 bg-white/64 px-4 py-12 text-center text-sm font-semibold text-slate-500">
            No tests found.
          </div>
        ) : (
          <div className="relative mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((row) => (
              <button
                key={row.id}
                type="button"
                disabled={!row.available}
                onClick={() => onLaunch(row)}
                className={`ielts-catalog-card group relative flex min-h-[14.5rem] w-full flex-col overflow-hidden rounded-[1.75rem] border p-6 text-left shadow-[0_12px_34px_rgba(30,64,175,.07),inset_0_1px_0_white] transition-[border-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100 ${
                  row.available
                    ? 'border-red-100/90 bg-[linear-gradient(145deg,rgba(255,255,255,.96),rgba(254,242,242,.62)_58%,rgba(239,246,255,.58))] hover:border-red-200 hover:shadow-[0_18px_42px_rgba(185,28,28,.1),inset_0_1px_0_white]'
                    : 'cursor-not-allowed border-slate-200/80 bg-white/48 opacity-75'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-red-600">
                      IELTS {meta.label} {String(row.number).padStart(2, '0')}
                    </p>
                    <h3 className="mt-3 text-2xl font-black tracking-[-0.04em] text-slate-950">{row.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm font-medium leading-6 text-slate-500">{row.subtitle}</p>
                  </div>
                  {row.completed ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                    </span>
                  ) : !row.available ? (
                    <Lock className="h-5 w-5 shrink-0 text-slate-400" />
                  ) : null}
                </div>

                <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-7">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold text-slate-500">
                    <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4" />{row.durationMinutes} min</span>
                    <span>{row.detail}</span>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 text-sm font-black ${row.available ? 'text-red-700' : 'text-amber-600'}`}>
                    {row.available ? 'Open' : 'Coming soon'}
                    {row.available ? <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /> : null}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
