import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Crown, Lock, Sparkles } from 'lucide-react'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'

type PremiumGateProps = {
  /** When true the children are shown blurred behind the premium overlay. */
  locked: boolean
  title?: string
  description?: string
  eyebrow?: string
  /** Small bullet list of what premium unlocks here. */
  perks?: string[]
  /** Full-page teaser (no rounded card frame); overlay card sits near the top. */
  fullBleed?: boolean
  children: ReactNode
  className?: string
}

/**
 * Wraps a premium feature. While `locked`, the real content stays visible but
 * blurred and non-interactive behind a glass overlay that invites the learner
 * to subscribe — so they can see exactly what they're unlocking. While unlocked
 * (premium owner, or free trial remaining) it renders the children untouched.
 */
export default function PremiumGate({
  locked,
  title = 'Premium feature',
  description = 'This section is part of ProfAI Premium. Subscribe to unlock full access.',
  eyebrow = 'Premium only',
  perks,
  fullBleed = false,
  children,
  className = '',
}: PremiumGateProps) {
  const navigate = useNavigate()
  const { minimalMotion } = useMotionPreferences()

  if (!locked) return <>{children}</>

  return (
    <div className={`${fullBleed ? 'relative' : 'relative isolate overflow-hidden rounded-[1.6rem]'} ${className}`}>
      {/* Real feature, teased behind a blur */}
      <div className="pointer-events-none select-none blur-[7px] saturate-[0.85] [filter:blur(7px)_brightness(0.98)]" aria-hidden>
        {children}
      </div>

      {/* Overlay */}
      <div
        className={`absolute inset-0 z-10 flex justify-center bg-[linear-gradient(160deg,rgba(255,255,255,0.62),rgba(255,244,245,0.74))] p-4 backdrop-blur-[2px] ${
          fullBleed ? 'items-start pt-20 sm:pt-28' : 'items-center'
        }`}
      >
        <motion.div
          initial={minimalMotion ? false : { opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: minimalMotion ? 0.16 : 0.34, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-md overflow-hidden rounded-[1.6rem] border border-amber-200/80 bg-white/95 p-7 text-center shadow-[0_30px_70px_rgba(30,64,175,0.22)]"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-amber-400 via-blue-500 to-indigo-500" />
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-amber-200/40 blur-3xl" />

          <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 text-white shadow-[0_16px_32px_rgba(245,158,11,0.4)]">
            <Crown className="h-8 w-8" />
          </div>

          <span className="premium-top-chip mt-5 inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            {eyebrow}
          </span>

          <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-900">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>

          {perks && perks.length > 0 ? (
            <ul className="mx-auto mt-4 grid max-w-xs gap-1.5 text-left">
              {perks.map((perk) => (
                <li key={perk} className="flex items-start gap-2 text-[13px] font-medium text-slate-600">
                  <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                    <Sparkles className="h-2.5 w-2.5" />
                  </span>
                  {perk}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/premium')}
              className="cta-sheen interactive-lift inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#1D4ED8] px-5 py-2.5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(37,99,235,0.34)]"
            >
              <Crown className="h-4 w-4" />
              Subscribe to Premium
            </button>
          </div>

          <p className="mt-3 inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-400">
            <Lock className="h-3 w-3" />
            Your free trial for this feature is used up
          </p>
        </motion.div>
      </div>
    </div>
  )
}

/** Small "N free left" pill the caller can show above a trial-gated feature. */
export function TrialBadge({ remaining, limit }: { remaining: number; limit: number }) {
  if (!Number.isFinite(remaining)) return null
  const used = limit - remaining
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-700">
      <Sparkles className="h-3 w-3" />
      Free trial · {Math.max(0, remaining)}/{limit} left
      {used > 0 ? <span className="text-amber-500">({used} used)</span> : null}
    </span>
  )
}
