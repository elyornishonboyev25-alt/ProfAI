import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
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
    description: 'Academic passages and exam questions.',
    icon: BookOpenText,
    route: '/ielts/reading/tests',
    accent: 'from-blue-600 to-indigo-600',
    soft: 'bg-blue-50 text-blue-700 border-blue-100',
  },
  listening: {
    label: 'Listening',
    description: 'Audio sections and answer practice.',
    icon: Headphones,
    route: '/ielts/listening/tests',
    accent: 'from-sky-500 to-blue-600',
    soft: 'bg-sky-50 text-sky-700 border-sky-100',
  },
  writing: {
    label: 'Writing',
    description: 'Task 1 and Task 2 writing practice.',
    icon: PenLine,
    route: '/ielts/writing/tests',
    accent: 'from-rose-500 to-red-600',
    soft: 'bg-rose-50 text-rose-700 border-rose-100',
  },
  speaking: {
    label: 'Speaking',
    description: 'Speaking tasks with AI feedback.',
    icon: Mic2,
    route: '/ielts/speaking/tests',
    accent: 'from-violet-500 to-indigo-600',
    soft: 'bg-violet-50 text-violet-700 border-violet-100',
  },
} as const

const SECTIONS = Object.keys(SECTION_META) as IeltsCatalogSection[]

export default function CompactIeltsCatalog({
  section,
  rows,
  searchTerm,
  onSearchChange,
  onBack,
  onLaunch,
  headerExtra,
}: CompactIeltsCatalogProps) {
  const navigate = useNavigate()
  const meta = SECTION_META[section]
  const SectionIcon = meta.icon
  const liveCount = rows.filter((row) => row.available).length

  return (
    <main className="mx-auto w-full max-w-[1480px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-5 py-5 text-white shadow-[0_24px_70px_rgba(15,23,42,0.22)] sm:px-7 lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_86%_10%,rgba(59,130,246,.32),transparent_27%),radial-gradient(circle_at_58%_120%,rgba(239,68,68,.18),transparent_32%)]" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3.5 text-xs font-bold text-white/90 transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <ArrowLeft className="h-4 w-4" />
            IELTS
          </button>
          {headerExtra}
        </div>

        <div className="relative mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <span className={`inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${meta.accent} shadow-lg`}>
              <SectionIcon className="h-7 w-7" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-300">IELTS Academic</p>
              <h1 className="mt-1 text-3xl font-black tracking-[-0.035em] sm:text-4xl">{meta.label} Full Tests</h1>
              <p className="mt-1 text-sm text-slate-300">{meta.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-center backdrop-blur">
              <strong className="block text-lg font-black">{rows.length}</strong>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tests</span>
            </span>
            <span className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-center backdrop-blur">
              <strong className="block text-lg font-black text-emerald-300">{liveCount}</strong>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200/70">Live</span>
            </span>
          </div>
        </div>

        <nav className="relative mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="IELTS sections">
          {SECTIONS.map((item) => {
            const itemMeta = SECTION_META[item]
            const ItemIcon = itemMeta.icon
            const active = item === section
            return (
              <button
                key={item}
                type="button"
                onClick={() => !active && navigate(itemMeta.route)}
                className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                  active
                    ? 'border-white bg-white text-slate-950 shadow-lg'
                    : 'border-white/10 bg-white/[0.06] text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <ItemIcon className={`h-4 w-4 ${active ? 'text-blue-600' : ''}`} />
                {itemMeta.label}
              </button>
            )
          })}
        </nav>
      </section>

      <section className="mt-5 rounded-[2rem] border border-slate-200/80 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-5 lg:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-950">{meta.label} tests</h2>
            <p className="text-sm text-slate-500">Choose a test and start.</p>
          </div>
          <label className="relative block w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search test..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </label>
        </div>

        {rows.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 px-4 py-12 text-center text-sm font-semibold text-slate-500">
            No tests found.
          </div>
        ) : (
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((row) => (
              <motion.button
                key={row.id}
                type="button"
                disabled={!row.available}
                onClick={() => onLaunch(row)}
                whileHover={row.available ? { y: -2 } : undefined}
                className={`group relative flex min-h-[132px] w-full items-stretch overflow-hidden rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 ${
                  row.available
                    ? 'border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)] hover:border-blue-200 hover:shadow-[0_14px_32px_rgba(37,99,235,0.12)]'
                    : 'cursor-not-allowed border-slate-200/80 bg-slate-50/80'
                }`}
              >
                <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${row.available ? meta.accent : 'from-slate-200 to-slate-300'}`} />
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm font-black ${row.available ? meta.soft : 'border-slate-200 bg-white text-slate-400'}`}>
                  {String(row.number).padStart(2, '0')}
                </span>
                <span className="ml-3 min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2">
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-black text-slate-950">{row.title}</span>
                      <span className="mt-1 block line-clamp-1 text-xs font-medium text-slate-500">{row.subtitle}</span>
                    </span>
                    {row.completed ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" aria-label="Completed" />
                    ) : row.available ? (
                      <ArrowRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-600" />
                    ) : (
                      <Lock className="h-4 w-4 shrink-0 text-slate-400" />
                    )}
                  </span>
                  <span className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-slate-500">
                    <span className={`rounded-md border px-2 py-1 ${row.available ? meta.soft : 'border-slate-200 bg-white text-slate-400'}`}>
                      {row.badge}
                    </span>
                    <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{row.durationMinutes} min</span>
                    <span>{row.detail}</span>
                    {!row.available ? <span className="text-amber-600">Coming soon</span> : null}
                  </span>
                </span>
              </motion.button>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
