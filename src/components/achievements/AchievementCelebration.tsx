import { useEffect, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Share2, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCelebrationStore } from '@/store/celebrationStore'
import { useToastStore } from '@/store/toastStore'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { playAchievementFanfare } from '@/utils/sound'
import SkillBadge from './SkillBadge'
import { TRACK_META, formatAchievementScore, nextAchievementThreshold, tierForAchievement } from './badgeMeta'

const COLORS = ['#f7cd6b', '#e24653', '#fff4ca', '#a04e37']

export default function AchievementCelebration() {
  const current = useCelebrationStore((state) => state.current)
  const dismiss = useCelebrationStore((state) => state.dismiss)
  const pushToast = useToastStore((state) => state.pushToast)
  const navigate = useNavigate()
  const { minimalMotion } = useMotionPreferences()

  useEffect(() => { if (current) playAchievementFanfare() }, [current])
  useEffect(() => {
    if (!current) return
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') dismiss() }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [current, dismiss])

  const confetti = useMemo(() => Array.from({ length: minimalMotion ? 0 : 38 }, (_, id) => ({
    id, x: Math.round((Math.random() - .5) * 690), rotate: Math.round(Math.random() * 620 - 310),
    delay: Math.random() * .6, duration: 1.7 + Math.random() * 1.5, color: COLORS[id % COLORS.length],
  })), [current?.id, minimalMotion])

  if (!current) return null
  const meta = TRACK_META[current.track]
  const tier = tierForAchievement(current.track, current.band) ?? 7
  const next = nextAchievementThreshold(current.track, tier)
  const start = tier === 7 ? (meta.group === 'IELTS' ? 7 : current.track === 'SAT_OVERALL' ? 1400 : 700)
    : tier === 8 ? (meta.group === 'IELTS' ? 8 : current.track === 'SAT_OVERALL' ? 1550 : 750)
      : current.band
  const progress = next ? Math.min(100, Math.max(0, (current.band - start) / (next - start) * 100)) : 100
  const gap = next === null ? 0 : Math.max(0, next - current.band)

  const share = async () => {
    const message = `I unlocked ${meta.title} · Tier ${tier} with ${meta.group === 'IELTS' ? 'band' : 'score'} ${formatAchievementScore(current.track, current.band)} on ProfAI.`
    try {
      if (navigator.share) await navigator.share({ title: 'ProfAI Achievement', text: message, url: window.location.origin })
      else {
        await navigator.clipboard.writeText(`${message} ${window.location.origin}`)
        pushToast({ type: 'success', title: 'Copied', message: 'Achievement link is ready to share.' })
      }
    } catch { /* Native share may be dismissed. */ }
  }

  return (
    <AnimatePresence>
      <motion.div key={current.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] flex items-center justify-center overflow-y-auto bg-[#161b28]/75 p-3 backdrop-blur-lg sm:p-5"
        onClick={dismiss}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {confetti.map((piece) => <motion.span key={piece.id} className="absolute left-1/2 top-0 h-2 w-3 rounded-sm"
            style={{ background: piece.color }} initial={{ x: piece.x, y: -20, opacity: 0, rotate: 0 }}
            animate={{ y: '95vh', opacity: [0, 1, 1, 0], rotate: piece.rotate }}
            transition={{ delay: piece.delay, duration: piece.duration, ease: 'easeIn' }} />)}
        </div>
        <motion.section role="dialog" aria-modal="true" aria-label={`${meta.title} achievement unlocked`}
          initial={minimalMotion ? { opacity: 0 } : { opacity: 0, scale: .83, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .94 }}
          transition={{ type: 'spring', stiffness: 230, damping: 22 }} onClick={(event) => event.stopPropagation()}
          className="relative my-auto w-full max-w-[600px] overflow-hidden rounded-[2rem] border border-white/50 bg-[linear-gradient(145deg,rgba(112,116,125,.84),rgba(55,57,65,.90))] px-6 pb-8 pt-9 text-center text-white shadow-[0_35px_100px_rgba(0,0,0,.5),inset_0_1px_2px_rgba(255,255,255,.55)] backdrop-blur-3xl sm:px-11">
          <div className="pointer-events-none absolute left-1/2 top-28 h-80 w-80 -translate-x-1/2 rounded-full bg-amber-300/35 blur-[75px]" />
          <div className="pointer-events-none absolute inset-x-0 top-28 h-48 bg-[radial-gradient(ellipse_at_center,rgba(255,214,99,.35),transparent_70%)]" />
          <button type="button" onClick={dismiss} aria-label="Close achievement" className="absolute right-4 top-4 z-10 rounded-full border border-white/30 bg-white/10 p-2 text-white/80 transition hover:bg-white/20 hover:text-white"><X className="h-4 w-4" /></button>
          <p className="relative text-[11px] font-bold uppercase tracking-[.28em] text-amber-200">ProfAI Honors</p>
          <h2 className="relative mt-2 text-[clamp(2rem,5.5vw,3.35rem)] font-black leading-tight tracking-[-.05em] drop-shadow-[0_3px_12px_rgba(0,0,0,.3)]">Achievement Unlocked!</h2>
          <motion.div className="relative mx-auto mt-1 flex justify-center drop-shadow-[0_18px_22px_rgba(0,0,0,.32)]"
            initial={minimalMotion ? undefined : { scale: .5, rotate: -15 }} animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: .16, type: 'spring', stiffness: 170, damping: 15 }}>
            <SkillBadge track={current.track} band={current.band} size={238} />
          </motion.div>
          <p className="relative mt-1 font-serif text-xl font-bold text-amber-100">{meta.title} · Tier {tier}</p>
          <p className="relative mt-1 text-sm text-white/80">{meta.label} · {meta.group === 'IELTS' ? 'Band' : 'Score'} {formatAchievementScore(current.track, current.band)}</p>
          <div className="relative mx-auto mt-6 max-w-md">
            <div className="flex items-center justify-between gap-3 text-xs font-semibold text-white/85">
              <span>{next === null ? 'Highest tier achieved' : `Progress to Tier ${tier + 1}`}</span>
              <span>{next === null ? 'Complete' : `${formatAchievementScore(current.track, next)} target`}</span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full border border-white/45 bg-white/30 shadow-inner">
              <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ delay: .5, duration: .8 }}
                className="h-full rounded-full bg-[linear-gradient(90deg,#a52738,#ef424a,#ffc1b2)] shadow-[0_0_12px_rgba(255,85,96,.6)]" />
            </div>
            <p className="mt-2 text-sm text-white/85">{next === null ? 'You reached the highest honor for this exam.' : `${formatAchievementScore(current.track, gap)} more ${meta.group === 'IELTS' ? 'band points' : 'points'} to Tier ${tier + 1}`}</p>
          </div>
          <div className="relative mt-7 grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => { dismiss(); navigate('/account#achievements') }}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/50 bg-white/25 px-5 font-bold text-white shadow-[inset_0_1px_3px_rgba(255,255,255,.4)] transition hover:bg-white/35">
              View collection <ArrowRight className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => void share()}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-red-300/70 bg-[linear-gradient(120deg,#bd121e,#ee3f48,#f1787b)] px-5 font-bold text-white shadow-[0_8px_22px_rgba(177,18,32,.38),inset_0_1px_3px_rgba(255,255,255,.5)] transition hover:brightness-110">
              <Share2 className="h-4 w-4" /> Share
            </button>
          </div>
        </motion.section>
      </motion.div>
    </AnimatePresence>
  )
}
