import { Crown, Sparkles, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { FREE_ATTEMPT_LIMIT } from '@/utils/premiumAccess'

interface UpgradeOverlayProps {
  /** How many free attempts have been used (for the message). */
  used?: number
  onClose?: () => void
  className?: string
}

/**
 * "Upgrade to Premium" overlay shown on top of gated content once a free user
 * runs out of attempts. Only rendered while premium enforcement is active
 * (see ENFORCE_PREMIUM) — dormant in the current open product state.
 */
export default function UpgradeOverlay({ used = FREE_ATTEMPT_LIMIT, onClose, className = '' }: UpgradeOverlayProps) {
  const navigate = useNavigate()
  const { minimalMotion } = useMotionPreferences()

  return (
    <div className={`absolute inset-0 z-30 flex items-center justify-center p-4 ${className}`}>
      <div
        className="absolute inset-0 bg-white/70 backdrop-blur-md"
        onClick={onClose}
        aria-hidden
      />
      <motion.div
        initial={minimalMotion ? false : { opacity: 0, y: 18, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={minimalMotion ? { duration: 0.14 } : { duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        className="premium-hero relative w-full max-w-md p-7 text-center"
      >
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-xl border border-blue-100 bg-white p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-700"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 text-white shadow-[0_16px_32px_rgba(245,158,11,0.36)]">
          <Crown className="h-8 w-8" />
        </div>

        <span className="premium-top-chip mt-5 inline-flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          Premium
        </span>

        <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-900">Upgrade to Premium</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          You&apos;ve used your {used}/{FREE_ATTEMPT_LIMIT} free test attempts. Unlock unlimited attempts, full mock
          arenas, and every premium track. AI coaching stays free for everyone.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/premium')}
            className="cta-sheen interactive-lift inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#1D4ED8] px-5 py-2.5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(37,99,235,0.32)]"
          >
            <Crown className="h-4 w-4" />
            View Plans
          </button>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center rounded-xl border border-blue-200 bg-white px-5 py-2.5 text-sm font-bold text-blue-700 transition hover:bg-blue-50"
            >
              Maybe later
            </button>
          ) : null}
        </div>
      </motion.div>
    </div>
  )
}
