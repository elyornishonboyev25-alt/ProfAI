import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Share2, Sparkles, Trophy, X } from 'lucide-react'
import { useCelebrationStore } from '@/store/celebrationStore'
import { useToastStore, type ToastState } from '@/store/toastStore'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { playAchievementFanfare } from '@/utils/sound'
import { fetchBadges, pinBadge } from '@/lib/profileApi'
import { CountUp } from '@/components/fx'
import SkillBadge from './SkillBadge'
import { TIER_NAME, TRACK_META, formatAchievementScore, tierForAchievement } from './badgeMeta'

const CONFETTI_COLORS = ['#F59E0B', '#2563EB', '#818CF8', '#FDE68A', '#F97316', '#FBBF24']

export default function AchievementCelebration() {
  const current = useCelebrationStore((state) => state.current)
  const dismiss = useCelebrationStore((state) => state.dismiss)
  const pushToast = useToastStore((state: ToastState) => state.pushToast)
  const { minimalMotion } = useMotionPreferences()
  const [pinned, setPinned] = useState(false)
  const [pinning, setPinning] = useState(false)

  useEffect(() => {
    if (!current) return
    setPinned(false)
    setPinning(false)
    playAchievementFanfare()
  }, [current])

  const confetti = useMemo(
    () =>
      Array.from({ length: minimalMotion ? 0 : 34 }, (_, index) => ({
        id: index,
        x: Math.round((Math.random() - 0.5) * 620),
        rotate: Math.round(Math.random() * 720 - 360),
        delay: Math.random() * 0.55,
        duration: 1.7 + Math.random() * 1.5,
        color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
        size: 6 + Math.round(Math.random() * 9),
      })),
    [current?.id, minimalMotion],
  )

  if (!current) return null

  const meta = TRACK_META[current.track]
  const tier = tierForAchievement(current.track, current.band)
  const accent = meta?.group === 'SAT' ? '#2563EB' : '#2563EB'
  const scoreProgress = Math.min(
    100,
    Math.max(4, meta?.group === 'SAT' ? (current.band / 1600) * 100 : (current.band / 9) * 100),
  )

  const addToProfile = async () => {
    setPinning(true)
    try {
      let id = current.serverBadgeId ?? null
      if (!id) {
        const list = await fetchBadges()
        id = list.find((badge) => badge.track === current.track && badge.tier === tier)?.id ?? null
      }
      if (id) {
        await pinBadge(id, true)
        setPinned(true)
        pushToast({ type: 'success', title: 'Pinned to profile', message: 'This badge now shows on your public profile.' })
      } else {
        pushToast({ type: 'info', title: 'Saved', message: 'Badge saved — pin it from your profile any time.' })
      }
    } catch {
      pushToast({ type: 'info', title: 'Saved offline', message: 'Badge saved on this device; it will sync when you reconnect.' })
    } finally {
      setPinning(false)
    }
  }

  const shareAchievement = async () => {
    const prefix = meta?.group === 'SAT' ? 'Score' : 'Band'
    const text = `I unlocked ${meta?.label ?? 'a ProfAI achievement'} — ${prefix} ${formatAchievementScore(current.track, current.band)} on ProfAI.`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'ProfAI Achievement', text, url: window.location.origin })
      } else {
        await navigator.clipboard.writeText(`${text} ${window.location.origin}`)
        pushToast({ type: 'success', title: 'Share text copied', message: 'Your achievement is ready to share.' })
      }
    } catch {
      // Closing the native share sheet is not an error.
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        key={current.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] flex items-center justify-center overflow-y-auto bg-slate-950/72 p-4 backdrop-blur-md"
        onClick={dismiss}
      >
        <div className="pointer-events-none absolute inset-0 flex items-start justify-center overflow-hidden">
          {confetti.map((item) => (
            <motion.span
              key={item.id}
              initial={{ y: -40, x: item.x, opacity: 0, rotate: 0 }}
              animate={{ y: '92vh', opacity: [0, 1, 1, 0], rotate: item.rotate }}
              transition={{ delay: item.delay, duration: item.duration, ease: 'easeIn' }}
              style={{ width: item.size, height: item.size * 0.52, backgroundColor: item.color, borderRadius: 2 }}
              className="absolute top-0"
            />
          ))}
        </div>

        <motion.section
          initial={minimalMotion ? { opacity: 0 } : { scale: 0.78, opacity: 0, y: 26 }}
          animate={minimalMotion ? { opacity: 1 } : { scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          onClick={(event) => event.stopPropagation()}
          className="relative my-auto w-full max-w-lg overflow-hidden rounded-[2.25rem] border border-amber-200/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(255,249,231,0.97),rgba(255,241,242,0.97))] p-7 text-center shadow-[0_45px_110px_rgba(0,0,0,0.5)] sm:p-9"
        >
          <div className="pointer-events-none absolute left-1/2 top-28 h-64 w-64 -translate-x-1/2 rounded-full bg-amber-300/55 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-blue-300/35 blur-3xl" />
          <button
            onClick={dismiss}
            className="absolute right-4 top-4 z-20 rounded-xl border border-slate-200 bg-white/85 p-2 text-slate-400 transition hover:text-slate-950"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="relative inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-amber-800"
          >
            <Trophy className="h-3.5 w-3.5" />
            Achievement unlocked
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="relative mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl"
          >
            A new personal milestone
          </motion.h2>

          <motion.div
            initial={minimalMotion ? { opacity: 0 } : { scale: 0, rotate: -20, opacity: 0 }}
            animate={minimalMotion ? { opacity: 1 } : { scale: 1, rotate: 0, opacity: 1 }}
            transition={{ delay: 0.28, type: 'spring', stiffness: 200, damping: 14 }}
            className="relative mx-auto mt-4 flex justify-center"
          >
            <SkillBadge track={current.track} band={current.band} size={154} showBand={false} />
          </motion.div>

          <p className="relative mt-2 text-lg font-black text-slate-950">{meta?.label}</p>
          <p className="relative text-xs font-black uppercase tracking-[0.16em]" style={{ color: accent }}>
            {tier ? TIER_NAME[tier] : ''} tier
          </p>
          <div className="relative mt-2">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              {meta?.group === 'SAT' ? 'SAT score' : 'Band score'}
            </p>
            <p className="text-5xl font-black text-slate-950">
              {minimalMotion
                ? formatAchievementScore(current.track, current.band)
                : <CountUp value={current.band} decimals={current.track === 'SAT_OVERALL' ? 0 : 1} />}
            </p>
          </div>

          <div className="relative mt-4 rounded-2xl border border-amber-100 bg-white/75 p-4">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-500">
              <span>Score journey</span>
              <span style={{ color: accent }}>{Math.round(scoreProgress)}%</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${scoreProgress}%` }}
                transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-400 to-blue-500"
              />
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-500">Saved to your ProfAI achievement collection.</p>
          </div>

          <div className="relative mt-5 grid gap-2 sm:grid-cols-2">
            <button
              onClick={() => void addToProfile()}
              disabled={pinning || pinned}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 text-sm font-black text-slate-950 shadow-[0_12px_28px_rgba(245,158,11,0.36)] transition hover:-translate-y-0.5 disabled:opacity-60"
            >
              {pinned ? <Check className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
              {pinned ? 'Added to profile' : pinning ? 'Adding…' : 'Add to profile'}
            </button>
            <button
              onClick={() => void shareAchievement()}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-blue-500 px-5 text-sm font-black text-white shadow-[0_12px_28px_rgba(37,99,235,0.3)] transition hover:-translate-y-0.5"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
          </div>
          <button onClick={dismiss} className="mt-2 rounded-xl px-5 py-2 text-sm font-bold text-slate-500 transition hover:text-slate-950">
            {pinned ? 'Done' : 'Maybe later'}
          </button>
        </motion.section>
      </motion.div>
    </AnimatePresence>
  )
}
