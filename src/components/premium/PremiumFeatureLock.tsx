import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, Crown, LockKeyhole, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'

type PremiumFeatureLockProps = {
  locked: boolean
  title: string
  description?: string
  compact?: boolean
  className?: string
  children: ReactNode
}

/**
 * Card-level premium affordance. The real feature remains recognisable behind
 * a light privacy veil while all interaction is routed to the upgrade page.
 * This is intentionally smaller than the route-level PremiumGate.
 */
export default function PremiumFeatureLock({
  locked,
  title,
  description = 'Unlock live analytics, deeper insights and the complete history.',
  compact = false,
  className = '',
  children,
}: PremiumFeatureLockProps) {
  const navigate = useNavigate()
  const { minimalMotion } = useMotionPreferences()

  if (!locked) return <>{children}</>

  return (
    <div className={`premium-feature-lock relative isolate h-full overflow-hidden rounded-[1.5rem] ${className}`}>
      <div className="pointer-events-none h-full select-none opacity-55 blur-[1.5px] saturate-[0.72]" aria-hidden>
        {children}
      </div>

      <div className="absolute inset-0 z-20 flex items-center justify-center bg-[linear-gradient(145deg,rgba(255,255,255,.38),rgba(255,247,237,.64))] p-3 backdrop-blur-[2px]">
        <motion.button
          type="button"
          onClick={() => navigate('/premium')}
          initial={minimalMotion ? false : { opacity: 0, y: 10, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          whileHover={minimalMotion ? undefined : { y: -2, scale: 1.01 }}
          className={`group relative overflow-hidden border border-white/90 bg-white/88 text-left shadow-[0_18px_44px_rgba(127,29,29,.18)] backdrop-blur-2xl ${
            compact ? 'w-full max-w-[15rem] rounded-2xl p-3' : 'w-full max-w-sm rounded-[1.35rem] p-4 sm:p-5'
          }`}
        >
          <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
          <span className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-amber-200/45 blur-2xl" />
          <span className="relative flex items-start gap-3">
            <span className={`flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 text-white shadow-[0_10px_24px_rgba(245,158,11,.34)] ${compact ? 'h-9 w-9' : 'h-11 w-11'}`}>
              <LockKeyhole className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.16em] text-amber-700">
                <Crown className="h-3 w-3" /> Premium analytics
              </span>
              <span className={`mt-1 block font-black tracking-tight text-slate-950 ${compact ? 'text-xs' : 'text-sm'}`}>{title}</span>
              {!compact ? <span className="mt-1 block text-[11px] leading-5 text-slate-600">{description}</span> : null}
            </span>
          </span>
          <span className={`relative mt-3 flex items-center justify-between rounded-xl bg-gradient-to-r from-red-700 via-red-600 to-rose-600 font-black text-white shadow-[0_10px_24px_rgba(220,38,38,.26)] ${compact ? 'px-3 py-2 text-[10px]' : 'px-3.5 py-2.5 text-xs'}`}>
            <span className="inline-flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Upgrade to Premium</span>
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </motion.button>
      </div>
    </div>
  )
}
