import type { ComponentType, SVGProps } from 'react'
import {
  ArrowRight,
  BookOpen,
  Calculator,
  Database,
  FileText,
  Headphones,
  Layers,
  Mic2,
  PenSquare,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CountUp, Reveal, Stagger, StaggerItem, Tilt3D } from '@/components/fx'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'

type Tone = 'red' | 'blue' | 'rose' | 'amber'

type TrackCard = {
  id: string
  index: string
  tag: string
  title: string
  subtitle: string
  detail: string
  path: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  tone: Tone
  chips: string[]
}

type ToneStyle = {
  card: string
  glow: string
  iconGradient: string
  badge: string
  chip: string
  link: string
  ghost: string
}

const toneStyles: Record<Tone, ToneStyle> = {
  red: {
    card: 'border-red-200/80 from-white via-red-50/60 to-rose-100/55',
    glow: 'rgba(220,38,38,0.20)',
    iconGradient: 'from-[#EF4444] to-[#B91C1C]',
    badge: 'border-red-200 bg-white/90 text-red-700',
    chip: 'bg-white/80 text-red-700 ring-1 ring-red-100',
    link: 'text-red-700',
    ghost: 'text-red-500/[0.07]',
  },
  blue: {
    card: 'border-blue-200/80 from-white via-blue-50/60 to-indigo-100/55',
    glow: 'rgba(37,99,235,0.20)',
    iconGradient: 'from-[#3B82F6] to-[#4338CA]',
    badge: 'border-blue-200 bg-white/90 text-blue-700',
    chip: 'bg-white/80 text-blue-700 ring-1 ring-blue-100',
    link: 'text-blue-700',
    ghost: 'text-blue-500/[0.07]',
  },
  rose: {
    card: 'border-rose-200/80 from-white via-rose-50/60 to-pink-100/55',
    glow: 'rgba(244,63,94,0.20)',
    iconGradient: 'from-[#F43F5E] to-[#BE185D]',
    badge: 'border-rose-200 bg-white/90 text-rose-700',
    chip: 'bg-white/80 text-rose-700 ring-1 ring-rose-100',
    link: 'text-rose-700',
    ghost: 'text-rose-500/[0.07]',
  },
  amber: {
    card: 'border-orange-200/80 from-white via-amber-50/60 to-orange-100/55',
    glow: 'rgba(217,119,6,0.20)',
    iconGradient: 'from-[#F59E0B] to-[#C2410C]',
    badge: 'border-orange-200 bg-white/90 text-orange-700',
    chip: 'bg-white/80 text-orange-700 ring-1 ring-orange-100',
    link: 'text-orange-700',
    ghost: 'text-orange-500/[0.07]',
  },
}

const trackCards: TrackCard[] = [
  {
    id: 'ielts',
    index: '01',
    tag: 'IELTS',
    title: 'IELTS Arena',
    subtitle: 'Reading · Listening · Writing · Speaking',
    detail: 'Open the IELTS hub with four dedicated section pages and a premium section-level workflow.',
    path: '/ielts',
    icon: Headphones,
    tone: 'red',
    chips: ['4 sections', 'Independent pages', 'Premium flow'],
  },
  {
    id: 'sat',
    index: '02',
    tag: 'SAT',
    title: 'SAT Arena',
    subtitle: 'Math · Reading / Writing',
    detail: 'Launch the SAT in two focused sections with dedicated pages and section-specific analytics.',
    path: '/sat',
    icon: Calculator,
    tone: 'blue',
    chips: ['2 sections', 'Adaptive mode', 'Separate workspace'],
  },
  {
    id: 'writing',
    index: '03',
    tag: 'Studio',
    title: 'Writing Studio',
    subtitle: 'Shared with IELTS Writing',
    detail: 'Directly linked to IELTS Writing — both entries open the same premium scoring workspace.',
    path: '/writing-lab',
    icon: PenSquare,
    tone: 'rose',
    chips: ['Task 1 + Task 2', 'Timed drafts', 'AI scoring'],
  },
  {
    id: 'speaking',
    index: '04',
    tag: 'Studio',
    title: 'Speaking Studio',
    subtitle: 'Shared with IELTS Speaking',
    detail: 'Directly linked to IELTS Speaking — both entries open the same premium recording workspace.',
    path: '/speaking-lab',
    icon: Mic2,
    tone: 'amber',
    chips: ['3 parts', 'Recording flow', 'AI feedback'],
  },
]

const heroStats = [
  { label: 'Tracks', value: 4, display: null, note: 'Learning arenas', icon: Layers },
  { label: 'Total Sections', value: 8, display: null, note: 'Independent pages', icon: FileText },
  { label: 'Question Bank', value: null, display: 'Fresh', note: 'New premium sets loading', icon: Database },
] as const

const featureCards = [
  {
    id: 'mock',
    title: 'Mock Arena',
    detail: 'Full IELTS + SAT exam simulations under real timing and official section order.',
    path: '/mock',
    icon: ShieldCheck,
    tone: 'red' as Tone,
    cta: 'Enter Mock Arena',
  },
  {
    id: 'vocab',
    title: 'Vocabulary Arena',
    detail: 'An immersive word-power track with Articles and My-Words spaced practice.',
    path: '/vocabulary',
    icon: BookOpen,
    tone: 'rose' as Tone,
    cta: 'Open Vocabulary',
  },
]

export default function Tests() {
  const navigate = useNavigate()
  const { reducedMotion } = useMotionPreferences()

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* ── Hero ──────────────────────────────────────────────── */}
      <Reveal>
        <section className="premium-hero overflow-hidden p-6 sm:p-9">
          <div className="pointer-events-none absolute inset-0">
            <motion.div
              className="absolute -left-16 -top-10 h-56 w-56 rounded-full bg-red-300/30 blur-3xl"
              animate={reducedMotion ? undefined : { y: [0, -22, 0], scale: [1, 1.08, 1] }}
              transition={reducedMotion ? undefined : { duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute -right-16 bottom-0 h-60 w-60 rounded-full bg-rose-300/25 blur-3xl"
              animate={reducedMotion ? undefined : { y: [0, 20, 0], scale: [1, 1.06, 1] }}
              transition={reducedMotion ? undefined : { duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          <div className="relative grid gap-7 xl:grid-cols-[minmax(0,1fr)_26rem] xl:items-center">
            <div>
              <span className="premium-top-chip inline-flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5" />
                Track Navigation
              </span>
              <h1 className="premium-section-title mt-4">
                Choose your <span className="arena-title-accent-red">Test Library</span>
              </h1>
              <p className="premium-section-subtitle">
                IELTS, SAT, Writing and Speaking each run as dedicated premium pages with a real exam-environment
                flow — pick a track below and dive straight in.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => navigate('/mock', { state: { from: 'tests' } })}
                  className="cta-sheen interactive-lift inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#DC2626] via-[#EF4444] to-[#B91C1C] px-5 py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(239,68,68,0.32)] hover:-translate-y-0.5"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Open Mock Arena
                </button>
                <button
                  onClick={() => navigate('/ielts')}
                  className="interactive-lift inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-white/80 px-5 py-3 text-sm font-bold text-red-700 shadow-sm transition hover:border-red-300 hover:bg-red-50"
                >
                  <Headphones className="h-4 w-4" />
                  Start IELTS
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:w-full">
              {heroStats.map((stat) => {
                const Icon = stat.icon
                return (
                  <div key={stat.label} className="hero-metric-card interactive-lift">
                    <div className="relative z-10 flex items-center justify-between gap-2">
                      <p className="hero-metric-label">{stat.label}</p>
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-200/70 bg-white/80 text-red-600">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                    </div>
                    <p className="hero-metric-value-sm">
                      {stat.value !== null ? (
                        <CountUp value={stat.value} />
                      ) : (
                        <span className="hero-metric-value-compact">{stat.display}</span>
                      )}
                    </p>
                    <p className="hero-metric-note">{stat.note}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── Section heading ───────────────────────────────────── */}
      <Reveal delay={0.05} className="mt-9">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-red-600">Learning arenas</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Pick your track</h2>
          </div>
          <span className="hidden rounded-full border border-red-100 bg-red-50 px-3 py-1 text-[11px] font-bold text-red-700 sm:inline-flex">
            {trackCards.length} arenas
          </span>
        </div>
      </Reveal>

      {/* ── Track cards ───────────────────────────────────────── */}
      <Stagger className="mt-5 grid gap-5 lg:grid-cols-2">
        {trackCards.map((track) => {
          const Icon = track.icon
          const t = toneStyles[track.tone]
          return (
            <StaggerItem key={track.id} className="h-full">
              <Tilt3D className="h-full rounded-[1.9rem]" max={6} lift={6}>
                <button
                  onClick={() => navigate(track.path)}
                  className={`group relative h-full w-full overflow-hidden rounded-[1.9rem] border bg-gradient-to-br p-7 text-left transition-shadow duration-300 ${t.card}`}
                  style={{ boxShadow: `0 18px 40px ${t.glow}` }}
                >
                  <span className={`pointer-events-none absolute -right-2 -top-8 select-none text-[7.5rem] font-black leading-none ${t.ghost}`}>
                    {track.index}
                  </span>
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-white/80 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  <div className="relative flex items-start justify-between gap-3">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${t.iconGradient}`}>
                      <Icon className="h-7 w-7" />
                    </div>
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${t.badge}`}>
                      {track.tag}
                    </span>
                  </div>

                  <h3 className="relative mt-5 text-3xl font-black tracking-tight text-slate-900">{track.title}</h3>
                  <p className="relative mt-1 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">{track.subtitle}</p>
                  <p className="relative mt-3 text-sm leading-6 text-slate-600">{track.detail}</p>

                  <div className="relative mt-5 flex flex-wrap gap-2">
                    {track.chips.map((chip) => (
                      <span key={chip} className={`rounded-full px-3 py-1 text-[11px] font-semibold ${t.chip}`}>
                        {chip}
                      </span>
                    ))}
                  </div>

                  <p className={`relative mt-6 inline-flex items-center gap-1.5 text-sm font-bold ${t.link}`}>
                    Open {track.title}
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                  </p>
                </button>
              </Tilt3D>
            </StaggerItem>
          )
        })}
      </Stagger>

      {/* ── Coming-soon notice ────────────────────────────────── */}
      <Reveal delay={0.06} className="mt-6">
        <section className="relative overflow-hidden rounded-2xl border border-amber-200/70 bg-gradient-to-r from-amber-50/85 via-white to-orange-50/60 p-5">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-[0_8px_18px_rgba(217,119,6,0.28)]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">Fresh question sets are on the way</p>
              <p className="mt-1 text-xs leading-5 text-amber-800/80">
                The standalone question bank is being refreshed. For now, keep practising through the IELTS / SAT
                section pages and the shared Writing &amp; Speaking studios above.
              </p>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── Feature cards (Mock + Vocabulary) ─────────────────── */}
      <Stagger className="mt-6 grid gap-5 sm:grid-cols-2">
        {featureCards.map((feature) => {
          const Icon = feature.icon
          const t = toneStyles[feature.tone]
          return (
            <StaggerItem key={feature.id} className="h-full">
              <button
                onClick={() => navigate(feature.path)}
                className="group relative flex h-full w-full items-center gap-4 overflow-hidden rounded-2xl border border-red-100 bg-white/90 p-5 text-left shadow-[0_12px_28px_rgba(15,23,42,0.05)] transition hover:border-red-200 hover:shadow-[0_18px_38px_rgba(220,38,38,0.12)]"
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${t.iconGradient}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-black tracking-tight text-slate-900">{feature.title}</h3>
                  <p className="mt-0.5 text-xs leading-5 text-slate-500">{feature.detail}</p>
                  <p className={`mt-2 inline-flex items-center gap-1 text-xs font-bold ${t.link}`}>
                    {feature.cta}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </p>
                </div>
              </button>
            </StaggerItem>
          )
        })}
      </Stagger>
    </div>
  )
}
