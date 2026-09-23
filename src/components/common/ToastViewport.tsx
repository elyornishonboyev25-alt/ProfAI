import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { useCopy } from '@/i18n/interface'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { useToastStore, type ToastItem, type ToastState, type ToastType } from '@/store/toastStore'

const tone = {
  success: {
    icon: CheckCircle2,
    className: 'border-green-200 bg-green-50 text-green-700',
  },
  error: {
    icon: AlertCircle,
    className: 'border-red-200 bg-red-50 text-red-700',
  },
  info: {
    icon: Info,
    className: 'border-blue-200 bg-blue-50 text-blue-700',
  },
}

export function ToastViewport() {
  const { c } = useCopy()
  const { minimalMotion } = useMotionPreferences()
  const toasts = useToastStore((state: ToastState) => state.toasts)
  const removeToast = useToastStore((state: ToastState) => state.removeToast)

  useEffect(() => {
    if (toasts.length === 0) return

    const timers = toasts.map((toast: ToastItem) =>
      window.setTimeout(() => {
        removeToast(toast.id)
      }, 3800),
    )

    return () => {
      timers.forEach((timer: number) => window.clearTimeout(timer))
    }
  }, [toasts, removeToast])

  return (
    <div className="pointer-events-none fixed right-4 top-24 z-[90] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast: ToastItem) => {
          const toastTone = tone[toast.type as ToastType]
          const Icon = toastTone.icon

          return (
            <motion.div
              key={toast.id}
              initial={minimalMotion ? false : { opacity: 0, y: -14, scale: 0.95, rotateX: -8 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
              exit={{ opacity: 0, y: -12, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 360, damping: 24, mass: 0.9 }}
              className={`pointer-events-auto relative overflow-hidden rounded-xl border px-4 py-3 shadow-lg [transform-style:preserve-3d] ${toastTone.className}`}
              role="status"
              aria-live="polite"
            >
              <div className="flex gap-2">
                <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">{c(toast.title)}</p>
                  {toast.message ? <p className="mt-0.5 break-words text-xs">{c(toast.message)}</p> : null}
                </div>
              </div>
              <motion.span
                aria-hidden="true"
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: 3.8, ease: 'linear' }}
                className="absolute bottom-0 left-0 h-0.5 w-full origin-left bg-current/45"
              />
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

