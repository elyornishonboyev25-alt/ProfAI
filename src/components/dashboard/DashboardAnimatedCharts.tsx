import { createContext, type ReactNode, useContext, useEffect, useRef } from 'react'
import { animate, motion, useInView, useMotionValue, useTransform } from 'framer-motion'
import { Rectangle } from 'recharts'
import UiText from '@/components/common/UiText'
import { Skeleton } from '@/components/common/Skeleton'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'

const EASE = [.22, 1, .36, 1] as const
const CIRCUMFERENCE = 2 * Math.PI * 41
const ActivityMotion = createContext({ visible: true, reducedMotion: false, isLowPowerDevice: false })

/** Observe the stable chart frame, rather than the bars while their height is zero. */
export function DashboardActivityChart({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const visible = useInView(ref, { once: true, amount: .15 })
  const { reducedMotion, isLowPowerDevice } = useMotionPreferences()
  return <div ref={ref} className={className}><ActivityMotion.Provider value={{ visible, reducedMotion, isLowPowerDevice }}>{children}</ActivityMotion.Provider></div>
}

/** Grow each Recharts bar from its own baseline, preserving its real geometry. */
export function DashboardActivityBar({ x = 0, y = 0, width = 0, height = 0, fill, index = 0 }: {
  x?: number; y?: number; width?: number; height?: number; fill?: string; index?: number
}) {
  const { visible, reducedMotion, isLowPowerDevice } = useContext(ActivityMotion)
  return <motion.g
    className="dashboard-activity-bar"
    data-day-index={index}
    initial={reducedMotion ? false : { scaleY: 0, opacity: 0 }}
    animate={{ scaleY: visible || reducedMotion ? 1 : 0, opacity: visible || reducedMotion ? 1 : 0 }}
    transition={{ duration: reducedMotion ? 0 : isLowPowerDevice ? .45 : .65, delay: reducedMotion ? 0 : .18 + index * .085, ease: EASE }}
    style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }}
  ><Rectangle x={x} y={y} width={width} height={height} fill={fill} radius={[10, 10, 3, 3]} /></motion.g>
}

/** The arc and number share one motion value, so they always finish together. */
export function DashboardTargetProgress({ value, hasScore, ready }: { value: number; hasScore: boolean; ready: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const visible = useInView(ref, { once: true, amount: .4 })
  const { reducedMotion, isLowPowerDevice } = useMotionPreferences()
  const finishedEntrance = useRef(false)
  const progress = useMotionValue(reducedMotion ? value : 0)
  const offset = useTransform(progress, current => CIRCUMFERENCE * (1 - current / 100))
  const label = useTransform(progress, current => `${Math.round(current)}%`)
  const arcOpacity = useTransform(progress, current => current > 0 ? 1 : 0)

  useEffect(() => {
    if (!ready || (!visible && !reducedMotion)) return
    const target = hasScore ? value : 0
    if (reducedMotion) {
      progress.set(target)
      finishedEntrance.current = true
      return
    }
    const firstEntrance = !finishedEntrance.current
    const controls = animate(progress, target, {
      duration: firstEntrance ? isLowPowerDevice ? .8 : 1.2 : .35,
      delay: firstEntrance ? 1.4 : 0,
      ease: EASE,
      onComplete: () => { finishedEntrance.current = true },
    })
    return () => controls.stop()
  }, [ready, visible, reducedMotion, isLowPowerDevice, hasScore, value, progress])

  return <div ref={ref} className="dashboard-progress-orbit" aria-busy={!ready}>
    <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="41" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="8" />
      <g opacity={hasScore && ready ? 1 : 0}>
        <motion.circle className="dashboard-target-progress-arc" cx="50" cy="50" r="41" fill="none" stroke="#fff" strokeLinecap="round" strokeWidth="8" strokeDasharray={CIRCUMFERENCE} style={{ strokeDashoffset: offset, opacity: arcOpacity }} />
      </g>
    </svg>
    <div className="relative text-center">
      {!ready ? <Skeleton className="mx-auto mb-2 h-10 w-20 !bg-white/20" /> : <p className="dashboard-target-progress-number text-4xl font-black tracking-[-0.05em]">
        {hasScore ? <><span className="sr-only">{value}%</span><motion.span aria-hidden="true">{label}</motion.span></> : '—'}
      </p>}
      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/80"><UiText text={hasScore ? 'toward target' : 'No score yet'} /></p>
    </div>
  </div>
}
