import type { ReactNode } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Lock,
  Search,
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
  reading: { label: 'Reading', accent: 'from-blue-600 via-blue-500 to-indigo-600' },
  listening: { label: 'Listening', accent: 'from-sky-500 via-blue-500 to-indigo-600' },
  writing: { label: 'Writing', accent: 'from-blue-600 via-indigo-500 to-red-500' },
  speaking: { label: 'Speaking', accent: 'from-indigo-600 via-violet-500 to-red-500' },
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

  return (
    <main className="mx-auto w-full max-w-[1480px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <section className="relative isolate min-h-[13rem] overflow-hidden rounded-[2.25rem] border border-white/90 bg-white/58 px-5 py-5 shadow-[0_30px_80px_rgba(30,64,175,.15),inset_0_1px_0_white] backdrop-blur-xl sm:min-h-[15rem] sm:px-8">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(115deg,rgba(254,242,242,.78),rgba(255,255,255,.46)_42%,rgba(219,234,254,.76))]" />
        <div className="pointer-events-none absolute -left-16 -top-24 -z-10 h-64 w-64 rounded-full bg-red-200/38 blur-3xl" />
        <div className="pointer-events-none absolute -right-12 -top-28 -z-10 h-72 w-72 rounded-full bg-blue-300/42 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-[12%] bottom-0 -z-10 h-px bg-gradient-to-r from-transparent via-blue-300/70 to-transparent" />

        <button
          type="button"
          onClick={onBack}
          aria-label="Back to IELTS"
          className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/90 bg-white/78 text-slate-700 shadow-[0_10px_28px_rgba(30,64,175,.1)] transition hover:-translate-y-0.5 hover:bg-white hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="relative flex min-h-[8.5rem] items-center justify-center px-2 pb-4 text-center sm:min-h-[10rem]">
          <h1 className="text-[2.8rem] font-black leading-none tracking-[-0.065em] text-slate-950 sm:text-6xl lg:text-[5rem]">
            IELTS <span className={`bg-gradient-to-r ${meta.accent} bg-clip-text text-transparent`}>{meta.label}</span>
          </h1>
        </div>
      </section>

      <section className="relative mt-5 overflow-hidden rounded-[2.25rem] border border-white/90 bg-white/58 p-4 shadow-[0_24px_64px_rgba(30,64,175,.11),inset_0_1px_0_white] backdrop-blur-lg sm:p-5 lg:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_92%_0%,rgba(59,130,246,.1),transparent_28%),radial-gradient(circle_at_6%_100%,rgba(239,68,68,.06),transparent_30%)]" />

        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-black tracking-tight text-slate-950">Tests</h2>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            {headerExtra}
            <label className="relative block w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search test..."
                className="h-11 w-full rounded-full border border-white/90 bg-white/76 pl-10 pr-4 text-sm text-slate-900 shadow-[0_8px_22px_rgba(30,64,175,.07)] outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
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
                className={`group relative flex min-h-[15.5rem] w-full flex-col overflow-hidden rounded-[2rem] border p-6 text-left shadow-[0_18px_50px_rgba(30,64,175,.1),inset_0_1px_0_white] transition-[transform,border-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 ${
                  row.available
                    ? 'border-blue-100/90 bg-[linear-gradient(145deg,rgba(255,255,255,.86),rgba(239,246,255,.72))] hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_26px_62px_rgba(37,99,235,.15),inset_0_1px_0_white]'
                    : 'cursor-not-allowed border-slate-200/80 bg-white/48 opacity-75'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-600">
                      IELTS {meta.label} {String(row.number).padStart(2, '0')}
                    </p>
                    <h3 className="mt-3 text-2xl font-black tracking-[-0.04em] text-slate-950">{row.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm font-medium leading-6 text-slate-500">{row.subtitle}</p>
                  </div>
                  {row.completed ? (
                    <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-500" aria-label="Completed" />
                  ) : !row.available ? (
                    <Lock className="h-5 w-5 shrink-0 text-slate-400" />
                  ) : null}
                </div>

                <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-7">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold text-slate-500">
                    <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4" />{row.durationMinutes} min</span>
                    <span>{row.detail}</span>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 text-sm font-black ${row.available ? 'text-blue-700' : 'text-amber-600'}`}>
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
