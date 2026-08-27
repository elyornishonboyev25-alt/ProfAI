import type { ComponentType, ReactNode } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, type LucideProps } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AmbientBackdrop, Reveal, Stagger, StaggerItem } from '@/components/fx'
import { cn } from '@/components/ui/utils'

export type PillarHubCard = {
  title: string
  description: string
  eyebrow: string
  action: string
  path: string
  icon: ComponentType<LucideProps>
  tone: 'blue' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate'
}

type PillarHubProps = {
  eyebrow: string
  title: ReactNode
  description: string
  highlights: string[]
  cards: PillarHubCard[]
  note: string
}

const TONES: Record<PillarHubCard['tone'], { icon: string; glow: string; link: string }> = {
  blue: {
    icon: 'bg-blue-600 text-white shadow-[0_14px_30px_rgba(37,99,235,0.28)]',
    glow: 'bg-blue-300/30',
    link: 'text-blue-700',
  },
  indigo: {
    icon: 'bg-indigo-600 text-white shadow-[0_14px_30px_rgba(79,70,229,0.26)]',
    glow: 'bg-indigo-300/30',
    link: 'text-indigo-700',
  },
  emerald: {
    icon: 'bg-emerald-600 text-white shadow-[0_14px_30px_rgba(5,150,105,0.24)]',
    glow: 'bg-emerald-300/30',
    link: 'text-emerald-700',
  },
  amber: {
    icon: 'bg-amber-500 text-white shadow-[0_14px_30px_rgba(245,158,11,0.24)]',
    glow: 'bg-amber-300/30',
    link: 'text-amber-700',
  },
  rose: {
    icon: 'bg-rose-600 text-white shadow-[0_14px_30px_rgba(225,29,72,0.24)]',
    glow: 'bg-rose-300/30',
    link: 'text-rose-700',
  },
  slate: {
    icon: 'bg-slate-900 text-white shadow-[0_14px_30px_rgba(15,23,42,0.22)]',
    glow: 'bg-slate-300/30',
    link: 'text-slate-800',
  },
}

export default function PillarHub({ eyebrow, title, description, highlights, cards, note }: PillarHubProps) {
  const navigate = useNavigate()

  return (
    <main className="workspace-page relative min-h-screen overflow-hidden px-4 py-7 sm:px-6 sm:py-9 lg:px-10">
      <AmbientBackdrop variant="red" />

      <div className="relative mx-auto w-full max-w-6xl space-y-6">
        <Reveal>
          <section className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.09)] backdrop-blur-xl sm:p-9">
            <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-blue-200/45 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 left-1/3 h-60 w-60 rounded-full bg-rose-100/50 blur-3xl" />

            <div className="relative">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-bold text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Journey home
              </button>

              <p className="mt-7 text-[11px] font-black uppercase tracking-[0.22em] text-blue-600">{eyebrow}</p>
              <h1 className="mt-3 max-w-4xl text-4xl font-black leading-[1.03] tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-6xl">
                {title}
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">{description}</p>

              <div className="mt-7 flex flex-wrap gap-2">
                {highlights.map((highlight) => (
                  <span
                    key={highlight}
                    className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50/80 px-3 py-1.5 text-xs font-bold text-blue-800"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {highlight}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </Reveal>

        <Stagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon
            const tone = TONES[card.tone]

            return (
              <StaggerItem key={card.path} className="h-full">
                <button
                  type="button"
                  onClick={() => navigate(card.path)}
                  className="group relative flex h-full min-h-64 w-full flex-col overflow-hidden rounded-[1.65rem] border border-slate-200/80 bg-white/[0.92] p-6 text-left shadow-[0_16px_44px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_24px_58px_rgba(37,99,235,0.13)]"
                >
                  <span className={cn('pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full blur-3xl', tone.glow)} />
                  <span className={cn('relative inline-flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-2xl', tone.icon)}>
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="relative mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{card.eyebrow}</span>
                  <h2 className="relative mt-2 text-xl font-black tracking-tight text-slate-950">{card.title}</h2>
                  <p className="relative mt-2 flex-1 text-sm leading-6 text-slate-600">{card.description}</p>
                  <span className={cn('relative mt-5 inline-flex items-center gap-1.5 text-sm font-black transition-all group-hover:gap-2.5', tone.link)}>
                    {card.action}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </button>
              </StaggerItem>
            )
          })}
        </Stagger>

        <Reveal delay={0.05}>
          <p className="rounded-2xl border border-slate-200/80 bg-white/75 px-5 py-4 text-sm leading-6 text-slate-600 shadow-sm">
            {note}
          </p>
        </Reveal>
      </div>
    </main>
  )
}
