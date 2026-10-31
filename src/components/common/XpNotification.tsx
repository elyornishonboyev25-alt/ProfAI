import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import UiText from '@/components/common/UiText'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { useAuthStore } from '@/store/authStore'
import { useXpNotificationStore, XP_NOTIFICATION_DURATION } from '@/store/xpNotificationStore'

function notificationContainer() {
  const fullscreen = document.fullscreenElement ?? (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement
  return fullscreen instanceof HTMLElement && !['VIDEO', 'AUDIO'].includes(fullscreen.tagName) ? fullscreen : document.body
}

export function XpNotification({ deferActivityRewards = false }: { deferActivityRewards?: boolean }) {
  const [container, setContainer] = useState(notificationContainer)
  const userId = useAuthStore((state) => state.user?.id)
  const rewards = useXpNotificationStore((state) => state.rewards)
  const dismiss = useXpNotificationStore((state) => state.dismiss)
  const clear = useXpNotificationStore((state) => state.clear)
  const { minimalMotion } = useMotionPreferences()
  const eligible = rewards.filter((reward) => reward.userId === userId && (!deferActivityRewards || reward.testCompleted))
  const current = eligible.find((reward) => reward.testCompleted) ?? eligible[0]

  useEffect(() => {
    const update = () => setContainer(notificationContainer())
    document.addEventListener('fullscreenchange', update)
    document.addEventListener('webkitfullscreenchange', update)
    return () => {
      document.removeEventListener('fullscreenchange', update)
      document.removeEventListener('webkitfullscreenchange', update)
    }
  }, [])

  useEffect(() => {
    if (rewards.some((reward) => reward.userId !== userId)) clear()
  }, [userId, rewards, clear])

  useEffect(() => {
    if (!current) return
    const timer = window.setTimeout(() => dismiss(current.id), XP_NOTIFICATION_DURATION)
    return () => window.clearTimeout(timer)
  }, [current?.id, dismiss])

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 top-[max(1rem,env(safe-area-inset-top))] z-[200] flex justify-center" role="status" aria-live="polite" aria-atomic="true">
      <AnimatePresence>
        {current ? (
          <motion.div
            key="xp-reward"
            initial={minimalMotion ? false : { opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={minimalMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: minimalMotion ? 0 : 0.18 }}
            className="flex items-center gap-3 rounded-2xl border border-white bg-gradient-to-br from-white to-slate-100 px-5 py-3 text-slate-900 shadow-xl"
          >
            <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-700 text-white"><Zap className="h-5 w-5" fill="currentColor" /></span>
            <span className="text-base font-extrabold tabular-nums">{current.levelUp ? <span className="block text-sm text-red-700"><UiText text="Level up" /> · <UiText text="Level" /> {current.levelUp}</span> : null}+{current.amount} XP</span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>,
    container,
  )
}
