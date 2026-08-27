import type { ComponentType, ReactNode } from 'react'
import { ArrowLeft, ArrowRight, Check, Sparkles, type LucideProps } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { cn } from '@/components/ui/utils'

export type PillarHubCard = {
  title: string
  description: string
  eyebrow: string
  action: string
  path: string
  icon: ComponentType<LucideProps>
  tone: 'red' | 'blue'
  details: string[]
}

type PillarHubProps = {
  eyebrow: string
  title: ReactNode
  description: string
  highlights: string[]
  cards: PillarHubCard[]
  note: string
  layout?: 'tracks' | 'skills'
  backPath?: string
  backLabel?: string
}

const GLASS_SURFACE =
  'relative isolate overflow-hidden rounded-[2rem] border border-white/80 bg-[linear-gradient(145deg,rgba(255,255,255,.78),rgba(255,255,255,.53)_54%,rgba(239,246,255,.4))] shadow-[0_24px_70px_rgba(55,65,100,.11),inset_0_1px_0_rgba(255,255,255,.96)] backdrop-blur-xl'

const TONES: Record<
  PillarHubCard['tone'],
  { icon: string; eyebrow: string; button: string; glow: string; detail: string }
> = {
  red: {
    icon: 'bg-gradient-to-br from-red-500 to-rose-600 shadow-[0_16px_34px_rgba(225,29,72,.28)]',
    eyebrow: 'text-red-600',
    button:
      'bg-gradient-to-r from-red-600 to-rose-500 shadow-[0_14px_30px_rgba(220,38,38,.24)] hover:shadow-[0_18px_38px_rgba(220,38,38,.34)]',
    glow: 'bg-red-200/45',
    detail: 'border-red-100/80 bg-red-50/65 text-red-950',
  },
  blue: {
    icon: 'bg-gradient-to-br from-blue-600 to-indigo-600 shadow-[0_16px_34px_rgba(37,99,235,.28)]',
    eyebrow: 'text-blue-700',
    button:
      'bg-gradient-to-r from-blue-700 to-blue-500 shadow-[0_14px_30px_rgba(37,99,235,.24)] hover:shadow-[0_18px_38px_rgba(37,99,235,.34)]',
    glow: 'bg-blue-200/50',
    detail: 'border-blue-100/80 bg-blue-50/65 text-blue-950',
  },
}

function GlassOrb({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute rounded-full border border-white/80 bg-[radial-gradient(circle_at_32%_28%,rgba(255,255,255,.96),rgba(219,234,254,.43)_38%,rgba(248,113,113,.15)_68%,rgba(255,255,255,.08))] shadow-[inset_-12px_-16px_30px_rgba(37,99,235,.1),0_18px_45px_rgba(30,64,175,.1)] backdrop-blur-md',
        className,
      )}
    />
  )
}

export default function PillarHub({
  eyebrow,
  title,
  description,
  highlights,
  cards,
  note,
  layout = 'skills',
  backPath = '/dashboard',
  backLabel = 'Dashboard',
}: PillarHubProps) {
  const navigate = useNavigate()
  const { minimalMotion } = useMotionPreferences()
  const isTrackLayout = layout === 'tracks'

  return (
    <main className="workspace-page relative min-h-screen overflow-hidden bg-[#f7f9ff] px-3 py-5 sm:px-6 sm:py-7 lg:px-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-[48rem] bg-[radial-gradient(circle_at_10%_10%,rgba(254,202,202,.58),transparent_33%),radial-gradient(circle_at_86%_8%,rgba(191,219,254,.78),transparent_38%),linear-gradient(120deg,#fff9fa_0%,#f8faff_47%,#eef5ff_100%)]" />
        <div className="absolute left-[36%] top-[26rem] h-72 w-72 rounded-full bg-red-100/45 blur-[80px]" />
        <div className="absolute right-[13%] top-[39rem] h-80 w-80 rounded-full bg-blue-200/40 blur-[90px]" />
      </div>

      <GlassOrb className="left-[4%] top-40 hidden h-28 w-28 md:block" />
      <GlassOrb className="right-[3%] top-[22rem] h-36 w-36 sm:h-44 sm:w-44" />
      <GlassOrb className="bottom-24 left-[14%] hidden h-20 w-20 lg:block" />

      <div className="relative mx-auto min-w-0 w-full max-w-[112rem]">
        <button
          type="button"
          onClick={() => navigate(backPath)}
          className="group inline-flex min-h-12 items-center gap-2.5 rounded-2xl border border-white/90 bg-white/70 px-4 text-sm font-black text-slate-700 shadow-[0_12px_30px_rgba(30,41,59,.08),inset_0_1px_0_rgba(255,255,255,.96)] backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:bg-white hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/70 sm:px-5"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          {backLabel}
        </button>

        <motion.header
          initial={minimalMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto min-w-0 w-full max-w-5xl overflow-hidden px-3 pb-10 pt-11 text-center sm:pb-14 sm:pt-14"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/65 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-red-600 shadow-[0_9px_25px_rgba(30,41,59,.06)] backdrop-blur-xl sm:text-xs">
            <Sparkles className="h-3.5 w-3.5" />
            {eyebrow}
          </div>
          <h1 className="mt-6 max-w-full break-words text-[clamp(2.2rem,9.5vw,6.8rem)] font-black leading-[.92] tracking-[-.06em] text-[#070a18] [overflow-wrap:anywhere] sm:leading-[.88] sm:tracking-[-.065em]">
            {title}
          </h1>
          <p className="mx-auto mt-6 max-w-4xl text-base font-medium leading-7 text-slate-600 sm:text-xl sm:leading-8 lg:text-2xl">
            {description}
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-2.5">
            {highlights.map((highlight, index) => (
              <span
                key={highlight}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-extrabold shadow-[inset_0_1px_0_rgba(255,255,255,.95)] backdrop-blur-md sm:text-sm',
                  index % 2 === 0
                    ? 'border-red-100/90 bg-red-50/65 text-red-900'
                    : 'border-blue-100/90 bg-blue-50/65 text-blue-900',
                )}
              >
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
                {highlight}
              </span>
            ))}
          </div>
        </motion.header>

        <section
          aria-label={`${eyebrow} workspaces`}
          className={cn('grid min-w-0 gap-5 lg:gap-6', isTrackLayout ? 'lg:grid-cols-2' : 'md:grid-cols-2 xl:grid-cols-3')}
        >
          {cards.map((card, index) => {
            const Icon = card.icon
            const tone = TONES[card.tone]

            return (
              <motion.article
                key={card.path}
                initial={minimalMotion ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.16 }}
                transition={{ duration: 0.45, delay: minimalMotion ? 0 : Math.min(index * 0.055, 0.22) }}
                className={cn(GLASS_SURFACE, 'group min-w-0 w-full max-w-full', isTrackLayout ? 'min-h-[27rem] p-7 sm:p-9' : 'min-h-[22rem] p-6 sm:p-7')}
              >
                <div className="pointer-events-none absolute inset-y-[-35%] left-[58%] w-24 rotate-[26deg] bg-white/55 blur-xl transition-transform duration-700 group-hover:translate-x-10" />
                <div className={cn('pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full blur-3xl', tone.glow)} />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white/40 to-transparent" />

                <div className="relative flex h-full min-w-0 flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <span className={cn('inline-flex items-center justify-center rounded-[1.35rem] text-white', tone.icon, isTrackLayout ? 'h-16 w-16' : 'h-14 w-14')}>
                      <Icon className={isTrackLayout ? 'h-7 w-7' : 'h-6 w-6'} strokeWidth={2.1} />
                    </span>
                    <span className="rounded-full border border-white/90 bg-white/55 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 backdrop-blur-md">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>

                  <p className={cn('mt-7 text-[10px] font-black uppercase tracking-[0.22em] sm:text-xs', tone.eyebrow)}>{card.eyebrow}</p>
                  <h2 className={cn('mt-2.5 max-w-full break-words font-black leading-[1.02] tracking-[-.04em] text-[#080b18]', isTrackLayout ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-[1.7rem]')}>
                    {card.title}
                  </h2>
                  <p className="mt-4 text-sm font-medium leading-6 text-slate-600 sm:text-base sm:leading-7">{card.description}</p>

                  <div className={cn('mt-6 grid gap-2', isTrackLayout && 'sm:grid-cols-2')}>
                    {card.details.map((detail) => (
                      <span key={detail} className={cn('inline-flex min-w-0 items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold sm:text-sm', tone.detail)}>
                        <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={3} />
                        {detail}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(card.path)}
                    className={cn(
                      'mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 text-sm font-black text-white transition duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/70 sm:w-auto sm:self-start',
                      tone.button,
                    )}
                    aria-label={`${card.action}: ${card.title}`}
                  >
                    {card.action}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </motion.article>
            )
          })}
        </section>

        <div className="mx-auto max-w-4xl px-2 pb-12 pt-7 text-center sm:pb-16 sm:pt-9">
          <p className="rounded-2xl border border-white/90 bg-white/58 px-5 py-4 text-xs font-medium leading-5 text-slate-500 shadow-[0_12px_34px_rgba(30,41,59,.06)] backdrop-blur-xl sm:text-sm sm:leading-6">
            {note}
          </p>
        </div>
      </div>
    </main>
  )
}
