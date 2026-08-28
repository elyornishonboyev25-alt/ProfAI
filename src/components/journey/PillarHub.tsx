import type { ReactNode } from 'react'
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { cn } from '@/components/ui/utils'
import {
  ArenaBackdrop,
  PILLAR_GLASS_SURFACE,
  StudyIllustration,
  type StudyIllustrationVariant,
} from '@/components/visuals/ArenaVisuals'

export type PillarHubCard = {
  title: string
  description: string
  eyebrow: string
  action: string
  path: string
  details: string[]
  visual: StudyIllustrationVariant
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
  showBack?: boolean
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
  showBack = true,
}: PillarHubProps) {
  const navigate = useNavigate()
  const { minimalMotion } = useMotionPreferences()
  const isTrackLayout = layout === 'tracks'

  return (
    <main className="workspace-page relative min-h-screen overflow-hidden px-3 py-5 sm:px-6 sm:py-6 lg:px-10">
      <ArenaBackdrop compact fixed />

      <div className="relative z-10 mx-auto min-w-0 w-full max-w-[112rem]">
        {showBack ? (
          <button type="button" onClick={() => navigate(backPath)} className="route-back-button">
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </button>
        ) : null}

        <motion.header
          initial={minimalMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.44, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            'relative mx-auto min-w-0 w-full max-w-5xl overflow-hidden px-3 pb-6 text-center sm:pb-7',
            showBack ? 'pt-7 sm:pt-8' : 'pt-1 sm:pt-2',
          )}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/65 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-red-600 shadow-[0_9px_25px_rgba(30,41,59,.06)] backdrop-blur-xl sm:text-xs">
            <Sparkles className="h-3.5 w-3.5" />
            {eyebrow}
          </div>
          <h1 className="mt-3 max-w-full break-words text-[clamp(2.1rem,5.8vw,4rem)] font-black leading-[.98] tracking-[-.05em] text-[#070a18] [overflow-wrap:anywhere] sm:leading-[.94] sm:tracking-[-.055em]">
            {title}
          </h1>
          <p className="mx-auto mt-3 max-w-4xl text-sm font-medium leading-6 text-slate-600 sm:text-base sm:leading-7 lg:text-lg">
            {description}
          </p>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {highlights.map((highlight) => (
              <span
                key={highlight}
                className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/46 px-3.5 py-2 text-xs font-extrabold text-slate-700 shadow-[0_8px_22px_rgba(30,41,59,.05),inset_0_1px_0_rgba(255,255,255,.96)] backdrop-blur-xl sm:text-sm"
              >
                <Check className="h-3.5 w-3.5 text-red-600" strokeWidth={3} />
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
            return (
              <motion.article
                key={card.path}
                initial={minimalMotion ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.16 }}
                transition={{ duration: 0.42, delay: minimalMotion ? 0 : Math.min(index * 0.05, 0.2) }}
                className={cn(
                  PILLAR_GLASS_SURFACE,
                  'group min-w-0 w-full max-w-full',
                  isTrackLayout ? 'min-h-[23.5rem] p-6 sm:p-7' : 'min-h-[19.5rem] p-5 sm:p-6',
                )}
              >
                <div className="pointer-events-none absolute inset-y-[-35%] left-[58%] w-24 rotate-[26deg] bg-white/55 blur-xl transition-transform duration-700 group-hover:translate-x-10" />
                <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-red-100/28 blur-3xl" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white/32 to-transparent" />

                <div className="relative flex h-full min-w-0 flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <StudyIllustration variant={card.visual} compact={!isTrackLayout} />
                    <span className="rounded-full border border-white/90 bg-white/55 px-3 py-1.5 text-[10px] font-black tracking-[0.16em] text-slate-500 backdrop-blur-md">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>

                  <p className="mt-4 text-[10px] font-black uppercase tracking-[0.22em] text-red-600 sm:text-xs">{card.eyebrow}</p>
                  <h2 className={cn('mt-2 max-w-full break-words font-black leading-[1.02] tracking-[-.04em] text-[#080b18]', isTrackLayout ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-[1.7rem]')}>
                    {card.title}
                  </h2>
                  <p className="mt-3 text-sm font-medium leading-6 text-slate-600 sm:text-base">{card.description}</p>

                  <div className={cn('mt-4 grid gap-2', isTrackLayout && 'sm:grid-cols-2')}>
                    {card.details.map((detail) => (
                      <span key={detail} className="inline-flex min-w-0 items-center gap-2 rounded-xl border border-white/75 bg-white/36 px-3 py-2.5 text-xs font-bold text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,.88)] backdrop-blur-lg sm:text-sm">
                        <Check className="h-3.5 w-3.5 shrink-0 text-red-600" strokeWidth={3} />
                        {detail}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(card.path)}
                    className={cn(
                      'mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#e52d35] to-[#f43f4a] px-5 text-sm font-black text-white shadow-[0_14px_30px_rgba(220,38,38,.22)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(220,38,38,.3)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-200/70 sm:w-auto sm:self-start',
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

        <div className="mx-auto max-w-4xl px-2 pb-10 pt-6 text-center sm:pb-14 sm:pt-7">
          <p className="rounded-2xl border border-white/90 bg-white/58 px-5 py-3 text-xs font-medium leading-5 text-slate-500 shadow-[0_12px_34px_rgba(30,41,59,.06)] backdrop-blur-xl sm:text-sm sm:leading-6">
            {note}
          </p>
        </div>
      </div>
    </main>
  )
}
