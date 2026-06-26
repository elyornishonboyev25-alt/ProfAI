import type { ComponentType, SVGProps } from 'react'
import { ArrowRight, BookOpen, Calculator, Headphones, Mic2, PenSquare, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { CountUp, Reveal, Stagger, StaggerItem, Tilt3D } from '@/components/fx'

type TrackCard = {
  id: string
  title: string
  subtitle: string
  detail: string
  path: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  tone: 'red' | 'blue' | 'rose' | 'amber'
  chips: string[]
}

const trackCards: TrackCard[] = [
  {
    id: 'ielts',
    title: 'IELTS Arena',
    subtitle: 'Reading, Listening, Writing, Speaking',
    detail: 'Open the IELTS hub with 4 dedicated section pages and premium section-level workflow.',
    path: '/ielts',
    icon: Headphones,
    tone: 'red',
    chips: ['4 sections', 'independent pages', 'premium flow'],
  },
  {
    id: 'sat',
    title: 'SAT Arena',
    subtitle: 'Math + Reading/Writing',
    detail: 'Launch SAT in two focused sections with dedicated pages and section-specific analytics.',
    path: '/sat',
    icon: Calculator,
    tone: 'blue',
    chips: ['2 sections', 'adaptive mode', 'separate workspace'],
  },
  {
    id: 'writing',
    title: 'Writing Studio',
    subtitle: 'Shared with IELTS Writing',
    detail: 'This page is directly linked to IELTS Writing so both entries open the same premium workspace.',
    path: '/writing-lab',
    icon: PenSquare,
    tone: 'rose',
    chips: ['Task 1 + Task 2', 'timed drafts', 'AI scoring'],
  },
  {
    id: 'speaking',
    title: 'Speaking Studio',
    subtitle: 'Shared with IELTS Speaking',
    detail: 'This page is directly linked to IELTS Speaking so both entries open the same premium workspace.',
    path: '/speaking-lab',
    icon: Mic2,
    tone: 'amber',
    chips: ['3 parts', 'recording flow', 'AI feedback'],
  },
]

function toneClass(tone: TrackCard['tone']) {
  if (tone === 'blue') {
    return 'border-blue-200 bg-gradient-to-br from-white via-blue-50 to-indigo-100/75 shadow-[0_18px_36px_rgba(37,99,235,0.16)]'
  }
  if (tone === 'rose') {
    return 'border-rose-200 bg-gradient-to-br from-white via-rose-50 to-pink-100/70 shadow-[0_18px_36px_rgba(244,63,94,0.16)]'
  }
  if (tone === 'amber') {
    return 'border-orange-200 bg-gradient-to-br from-white via-amber-50 to-orange-100/70 shadow-[0_18px_36px_rgba(217,119,6,0.16)]'
  }
  return 'border-red-200 bg-gradient-to-br from-white via-red-50 to-rose-100/70 shadow-[0_18px_36px_rgba(220,38,38,0.16)]'
}

function iconToneClass(tone: TrackCard['tone']) {
  if (tone === 'blue') return 'border-blue-200 text-blue-700'
  if (tone === 'rose') return 'border-rose-200 text-rose-700'
  if (tone === 'amber') return 'border-orange-200 text-orange-700'
  return 'border-red-200 text-red-700'
}

function linkToneClass(tone: TrackCard['tone']) {
  if (tone === 'blue') return 'text-blue-700'
  if (tone === 'rose') return 'text-rose-700'
  if (tone === 'amber') return 'text-orange-700'
  return 'text-red-700'
}

export default function Tests() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Reveal>
        <section className="premium-hero p-6 sm:p-9">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-14 top-0 h-52 w-52 rounded-full bg-red-200/35 blur-3xl" />
            <div className="absolute -right-16 bottom-0 h-56 w-56 rounded-full bg-rose-200/35 blur-3xl" />
          </div>

          <div className="relative grid gap-4 xl:grid-cols-[minmax(0,1fr)_25rem] xl:items-start">
            <div className="xl:pr-2">
              <span className="premium-top-chip">Track Navigation</span>
              <h1 className="premium-section-title mt-4 md:whitespace-nowrap">
                Choose your <span className="arena-title-accent-red">Test Library</span>
              </h1>
              <p className="premium-section-subtitle">
                IELTS, SAT, Writing, and Speaking run as dedicated premium pages with real exam environment flow.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-3 xl:w-full">
              <div className="hero-metric-card interactive-lift">
                <p className="hero-metric-label">Tracks</p>
                <p className="hero-metric-value-sm">
                  <CountUp value={trackCards.length} />
                </p>
                <p className="hero-metric-note">Learning arenas</p>
              </div>
              <div className="hero-metric-card interactive-lift">
                <p className="hero-metric-label">Total Sections</p>
                <p className="hero-metric-value-sm">
                  <CountUp value={8} />
                </p>
                <p className="hero-metric-note">Independent pages</p>
              </div>
              <div className="hero-metric-card interactive-lift">
                <p className="hero-metric-label">Question Bank</p>
                <p className="hero-metric-value-sm hero-metric-value-compact">Refresh</p>
                <p className="hero-metric-note">New premium sets loading</p>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.06} className="mt-6">
        <section className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50/80 to-orange-50/60 p-4 text-sm text-amber-900">
          <p className="font-semibold">Current test questions are temporarily removed.</p>
          <p className="mt-1">
            New sets will be added next. For now, continue via IELTS/SAT section pages and shared Writing/Speaking studios.
          </p>
          <button
            onClick={() => navigate('/mock', { state: { from: 'tests' } })}
            className="mt-3 inline-flex items-center rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-red-700 transition hover:bg-red-50"
          >
            Open Mock Arena
          </button>
        </section>
      </Reveal>

      <Stagger className="mt-6 grid gap-4 md:grid-cols-2">
        {trackCards.map((track) => {
          const Icon = track.icon
          return (
            <StaggerItem key={track.id} className="h-full">
              <Tilt3D className="h-full rounded-[1.8rem]" max={6}>
                <button
                  onClick={() => navigate(track.path)}
                  className={`interactive-lift group h-full w-full rounded-[1.8rem] border p-6 text-left ${toneClass(track.tone)}`}
                >
                  <div className={`inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs font-semibold ${iconToneClass(track.tone)}`}>
                    <Icon className="h-3.5 w-3.5" />
                    {track.subtitle}
                  </div>
                  <h2 className="mt-4 text-3xl font-black text-slate-900">{track.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{track.detail}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                    {track.chips.map((chip) => (
                      <span key={chip} className="rounded-full bg-white px-3 py-1 text-slate-700">
                        {chip}
                      </span>
                    ))}
                  </div>
                  <p className={`mt-6 inline-flex items-center text-sm font-semibold transition group-hover:translate-x-1 ${linkToneClass(track.tone)}`}>
                    Open {track.title}
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </p>
                </button>
              </Tilt3D>
            </StaggerItem>
          )
        })}
      </Stagger>

      <Reveal delay={0.08} className="mt-6">
        <section className="rounded-2xl border border-red-100 bg-white/90 p-4">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-red-700">
            <Sparkles className="h-4 w-4" />
            Vocabulary Arena remains available as a separate immersive track.
          </p>
          <button
            onClick={() => navigate('/vocabulary')}
            className="mt-3 inline-flex items-center rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
          >
            <BookOpen className="mr-2 h-4 w-4" />
            Open Vocabulary Arena
          </button>
        </section>
      </Reveal>
    </div>
  )
}
