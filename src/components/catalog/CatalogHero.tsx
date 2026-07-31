import type { ReactNode } from 'react'
import { ArrowLeft, Sparkles } from 'lucide-react'

type CatalogTone = 'rose' | 'sky' | 'blue'

type CatalogFilterOption = {
  id: string
  label: string
  count?: number
}

type CatalogSummaryItem = {
  label: string
  value: string | number
}

type CatalogHeroProps = {
  tone?: CatalogTone
  backLabel: string
  onBack: () => void
  eyebrow: string
  title: ReactNode
  subtitle: ReactNode
  filters: CatalogFilterOption[]
  activeFilter: string
  onFilterChange: (id: string) => void
  summary: CatalogSummaryItem[]
  badge?: ReactNode
  actions?: ReactNode
}

const TONES: Record<CatalogTone, {
  accent: string
  active: string
  focus: string
  sheen: string
  summaryGlow: string
}> = {
  rose: {
    accent: 'text-rose-600',
    active: 'border-rose-400/70 bg-[linear-gradient(135deg,#be123c_0%,#ef4444_55%,#f97316_130%)] text-white shadow-[0_14px_30px_rgba(225,29,72,0.28),inset_0_1px_0_rgba(255,255,255,0.52)]',
    focus: 'focus-visible:ring-rose-300',
    sheen: 'via-rose-100/70',
    summaryGlow: 'shadow-[0_12px_32px_rgba(225,29,72,0.12)]',
  },
  sky: {
    accent: 'text-sky-600',
    active: 'border-sky-400/70 bg-[linear-gradient(135deg,#0284c7_0%,#0ea5e9_55%,#06b6d4_120%)] text-white shadow-[0_14px_30px_rgba(14,165,233,0.27),inset_0_1px_0_rgba(255,255,255,0.52)]',
    focus: 'focus-visible:ring-sky-300',
    sheen: 'via-sky-100/70',
    summaryGlow: 'shadow-[0_12px_32px_rgba(14,165,233,0.12)]',
  },
  blue: {
    accent: 'text-blue-600',
    active: 'border-blue-400/70 bg-[linear-gradient(135deg,#2563eb_0%,#4f46e5_60%,#06b6d4_135%)] text-white shadow-[0_14px_30px_rgba(37,99,235,0.28),inset_0_1px_0_rgba(255,255,255,0.52)]',
    focus: 'focus-visible:ring-blue-300',
    sheen: 'via-blue-100/70',
    summaryGlow: 'shadow-[0_12px_32px_rgba(37,99,235,0.12)]',
  },
}

export default function CatalogHero({
  tone = 'rose',
  backLabel,
  onBack,
  eyebrow,
  title,
  subtitle,
  filters,
  activeFilter,
  onFilterChange,
  summary,
  badge,
  actions,
}: CatalogHeroProps) {
  const theme = TONES[tone]

  return (
    <section className="relative isolate w-full min-w-0 max-w-full overflow-hidden rounded-[2rem] border border-white/85 bg-white/64 px-5 py-6 shadow-[0_24px_64px_rgba(15,23,42,0.1)] backdrop-blur-2xl sm:px-7 sm:py-7 lg:px-9">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className={`absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent ${theme.sheen} to-transparent`} />
        <div className="absolute -right-20 -top-28 h-64 w-64 rounded-full bg-white/70 blur-3xl" />
      </div>

      <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className={`inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/90 bg-white/78 px-4 text-[11px] font-black uppercase tracking-[0.14em] text-slate-700 shadow-[0_8px_20px_rgba(15,23,42,0.08)] backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 ${theme.focus}`}
        >
          <ArrowLeft className={`h-4 w-4 ${theme.accent}`} />
          {backLabel}
        </button>
        <span className={`inline-flex min-h-11 min-w-0 max-w-full items-center gap-2 overflow-hidden rounded-xl border border-white/85 bg-white/48 px-4 text-[11px] font-black uppercase tracking-[0.14em] ${theme.accent} backdrop-blur-xl`}>
          <Sparkles className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{eyebrow}</span>
        </span>
        {badge}
      </div>

      <div className="mt-5 grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
        <div className="min-w-0">
          <h1 className="max-w-4xl break-words text-[2.35rem] font-black leading-[0.98] tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-[3.45rem]">
            {title}
          </h1>
          <p className="mt-3 max-w-3xl break-words text-sm font-medium leading-6 text-slate-600 sm:text-base">
            {subtitle}
          </p>
          {actions ? <div className="mt-5 flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>

        <div className={`flex w-fit max-w-full items-center divide-x divide-slate-200/80 rounded-full border border-white/90 bg-white/72 px-2 py-2 backdrop-blur-xl ${theme.summaryGlow}`}>
          {summary.map((item) => (
            <div key={item.label} className="min-w-0 px-3 text-center sm:px-4">
              <p className="whitespace-nowrap text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">{item.label}</p>
              <p className="mt-0.5 whitespace-nowrap text-sm font-black text-slate-900 sm:text-base">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex w-full min-w-0 max-w-full gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {filters.map((filter) => {
          const selected = activeFilter === filter.id
          return (
            <button
              key={filter.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onFilterChange(filter.id)}
              className={`group relative isolate inline-flex min-h-12 shrink-0 items-center justify-center gap-2 overflow-hidden rounded-full border px-5 text-sm font-bold transition duration-300 focus-visible:outline-none focus-visible:ring-2 ${theme.focus} ${
                selected
                  ? theme.active
                  : 'border-white/95 bg-white/52 text-slate-700 shadow-[0_8px_22px_rgba(15,23,42,0.07),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-xl hover:-translate-y-0.5 hover:bg-white/82'
              }`}
            >
              {selected ? <span className="fx-shimmer absolute inset-y-0 left-0 w-1/2 skew-x-[-20deg]" /> : null}
              <span className="relative">{filter.label}</span>
              {typeof filter.count === 'number' ? (
                <span className={`relative rounded-full px-2 py-0.5 text-[11px] font-black ${selected ? 'bg-white/18 text-white' : 'bg-slate-900/5 text-slate-500'}`}>
                  {filter.count}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
    </section>
  )
}
