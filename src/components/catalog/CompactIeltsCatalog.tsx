import type { ReactNode } from 'react'
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

function IeltsSectionArtwork({
  section,
  tests,
  live,
}: {
  section: IeltsCatalogSection
  tests: number
  live: number
}) {
  return (
    <div className="relative min-h-[12.5rem] overflow-hidden rounded-[1.75rem] border border-blue-100/80 bg-[linear-gradient(145deg,rgba(255,255,255,.96),rgba(239,246,255,.88)_52%,rgba(238,242,255,.92))] shadow-[0_22px_52px_rgba(30,64,175,.13),inset_0_1px_0_white]" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_86%_12%,rgba(59,130,246,.2),transparent_30%),radial-gradient(circle_at_14%_100%,rgba(239,68,68,.1),transparent_35%)]" />
      <svg viewBox="0 0 430 220" className="absolute inset-0 h-full w-full" fill="none">
        <defs>
          <linearGradient id={`ielts-visual-${section}`} x1="54" y1="32" x2="363" y2="190" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1D4ED8" />
            <stop offset="1" stopColor="#4F46E5" />
          </linearGradient>
          <linearGradient id={`ielts-line-${section}`} x1="0" y1="0" x2="1" y2="0">
            <stop stopColor="#2563EB" stopOpacity=".12" />
            <stop offset=".55" stopColor="#2563EB" stopOpacity=".5" />
            <stop offset="1" stopColor="#E52B32" stopOpacity=".22" />
          </linearGradient>
        </defs>
        <path d="M24 42H406M24 82H406M24 122H406M24 162H406" stroke="#2563EB" strokeOpacity=".055" />
        <path d="M82 18V202M142 18V202M202 18V202M262 18V202M322 18V202" stroke="#2563EB" strokeOpacity=".045" />
        <rect x="42" y="30" width="346" height="158" rx="25" fill="white" fillOpacity=".78" stroke="white" strokeWidth="2" />
        <circle cx="340" cy="73" r="31" stroke="#DBEAFE" strokeWidth="8" />
        <path d="M340 42A31 31 0 0 1 370 79" stroke={`url(#ielts-visual-${section})`} strokeWidth="8" strokeLinecap="round" />
        <path d="M316 132H363" stroke={`url(#ielts-line-${section})`} strokeWidth="8" strokeLinecap="round" />
        <path d="M316 151H351" stroke="#CBD5E1" strokeWidth="7" strokeLinecap="round" />

        {section === 'reading' ? (
          <g stroke={`url(#ielts-visual-${section})`} strokeLinecap="round" strokeLinejoin="round">
            <path d="M87 72C117 62 143 65 164 80V150C142 136 116 133 87 142V72Z" fill="#EFF6FF" strokeWidth="4" />
            <path d="M241 72C211 62 185 65 164 80V150C186 136 212 133 241 142V72Z" fill="#EEF2FF" strokeWidth="4" />
            <path d="M164 80V150" strokeWidth="4" />
            <path d="M104 91H145M104 108H145M104 125H135M183 91H224M183 108H224M183 125H214" strokeWidth="5" strokeOpacity=".55" />
          </g>
        ) : null}

        {section === 'listening' ? (
          <g stroke={`url(#ielts-visual-${section})`} strokeLinecap="round" strokeLinejoin="round">
            <path d="M101 118V101C101 66 129 48 164 48C199 48 227 66 227 101V118" strokeWidth="8" />
            <rect x="88" y="103" width="28" height="48" rx="13" fill="#EFF6FF" strokeWidth="5" />
            <rect x="212" y="103" width="28" height="48" rx="13" fill="#EEF2FF" strokeWidth="5" />
            <path d="M132 103V130M148 91V141M164 108V126M180 83V149M196 100V132" strokeWidth="7" />
          </g>
        ) : null}

        {section === 'writing' ? (
          <g stroke={`url(#ielts-visual-${section})`} strokeLinecap="round" strokeLinejoin="round">
            <path d="M105 52H200L228 80V157H105V52Z" fill="#F8FAFC" strokeWidth="4" />
            <path d="M200 52V80H228" strokeWidth="4" />
            <path d="M125 91H190M125 111H185M125 131H170" strokeWidth="6" strokeOpacity=".45" />
            <path d="M202 144L250 96L267 113L219 161L197 166L202 144Z" fill="#EEF2FF" strokeWidth="5" />
          </g>
        ) : null}

        {section === 'speaking' ? (
          <g stroke={`url(#ielts-visual-${section})`} strokeLinecap="round" strokeLinejoin="round">
            <rect x="139" y="48" width="50" height="82" rx="25" fill="#EFF6FF" strokeWidth="6" />
            <path d="M118 108C118 135 138 151 164 151C190 151 210 135 210 108M164 151V172M139 172H189" strokeWidth="7" />
            <path d="M98 78C85 93 85 112 98 127M230 78C243 93 243 112 230 127" strokeWidth="6" strokeOpacity=".45" />
          </g>
        ) : null}
      </svg>

      <div className="absolute left-5 top-4 inline-flex items-center gap-2 rounded-full border border-white bg-white/88 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-blue-700 shadow-sm">
        Academic simulation
      </div>
      <div className="absolute bottom-4 right-4 flex items-center gap-2">
        <span className="rounded-full border border-white bg-white/90 px-3 py-1.5 text-[10px] font-black text-slate-700 shadow-sm">{tests} tests</span>
        <span className="rounded-full border border-emerald-100 bg-emerald-50/95 px-3 py-1.5 text-[10px] font-black text-emerald-700 shadow-sm">{live} live</span>
      </div>
    </div>
  )
}

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
  const liveCount = rows.filter((row) => row.available).length

  return (
    <main className="mx-auto w-full max-w-[1480px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/90 bg-[linear-gradient(135deg,rgba(255,255,255,.97),rgba(247,250,255,.95)_52%,rgba(239,246,255,.94))] px-5 py-5 text-slate-950 shadow-[0_26px_70px_rgba(30,64,175,.12),inset_0_1px_0_white] sm:px-7 lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_92%_0%,rgba(59,130,246,.13),transparent_28%),radial-gradient(circle_at_8%_100%,rgba(239,68,68,.07),transparent_30%)]" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white/88 px-3.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <ArrowLeft className="h-4 w-4" />
            IELTS
          </button>
          {headerExtra}
        </div>

        <div className="relative mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,30rem)] lg:items-center">
          <div className="min-w-0 py-2">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-700">IELTS Academic</p>
            <h1 className="mt-2 max-w-3xl text-4xl font-black leading-[.96] tracking-[-0.05em] text-slate-950 sm:text-5xl lg:text-[3.65rem]">
              {meta.label} <span className="bg-gradient-to-r from-blue-700 via-indigo-600 to-red-500 bg-clip-text text-transparent">Full Tests</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-600 sm:text-base">{meta.description}</p>
            <div className="mt-5 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.12em]">
              <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-blue-700">Exam format</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600">Instant access</span>
              <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-emerald-700">Progress saved</span>
            </div>
          </div>
          <IeltsSectionArtwork section={section} tests={rows.length} live={liveCount} />
        </div>

        <nav className="relative mt-6 grid grid-cols-2 gap-2 rounded-[1.35rem] border border-slate-200/80 bg-white/72 p-2 shadow-[0_14px_34px_rgba(30,64,175,.07)] sm:grid-cols-4" aria-label="IELTS sections">
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
                    ? 'border-blue-600 bg-gradient-to-r from-blue-700 to-indigo-600 text-white shadow-[0_10px_24px_rgba(37,99,235,.24)]'
                    : 'border-transparent bg-transparent text-slate-500 hover:border-blue-100 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                <ItemIcon className="h-4 w-4" />
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
              <button
                key={row.id}
                type="button"
                disabled={!row.available}
                onClick={() => onLaunch(row)}
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
              </button>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
