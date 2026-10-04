import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { animate, motion, useInView, useMotionValue, useTransform } from 'framer-motion'
import UiText from '@/components/common/UiText'
import { Skeleton } from '@/components/common/Skeleton'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'

const EASE = [.16, 1, .3, 1] as const
const CIRCUMFERENCE = 2 * Math.PI * 41
const ACTIVITY_DURATION = 1.3
const ChartSequence = createContext({ activityStartedAt: null as number | null, startActivity: () => {} })
const ActivityMotion = createContext({ visible: true, reducedMotion: false, isLowPowerDevice: false })

/** Coordinate visible charts without making mobile wait for an offscreen chart. */
export function DashboardChartSequence({ children }: { children: ReactNode }) {
  const [activityStartedAt, setActivityStartedAt] = useState<number | null>(null)
  const startActivity = useCallback(() => setActivityStartedAt(current => current ?? performance.now()), [])
  return <ChartSequence.Provider value={{ activityStartedAt, startActivity }}>{children}</ChartSequence.Provider>
}

/** Observe the stable chart frame, rather than the bars while their height is zero. */
export function DashboardActivityChart({ children, className, ready = true }: { children: ReactNode; className?: string; ready?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const visible = useInView(ref, { once: true, amount: .15 })
  const { reducedMotion, isLowPowerDevice } = useMotionPreferences()
  const { startActivity } = useContext(ChartSequence)
  useEffect(() => { if (visible && ready) startActivity() }, [visible, ready, startActivity])
  return <div ref={ref} className={`dashboard-activity-stage ${className ?? ''}`} data-visible={visible && ready} data-motion={reducedMotion ? 'reduced' : 'full'}><ActivityMotion.Provider value={{ visible: visible && ready, reducedMotion, isLowPowerDevice }}>{children}</ActivityMotion.Provider></div>
}

/** Animate the actual geometry: rounded caps stay round throughout the reveal. */
export function DashboardActivityBar({ x = 0, y = 0, width = 0, height = 0, fill, index = 0 }: {
  x?: number; y?: number; width?: number; height?: number; fill?: string; index?: number
}) {
  const { visible, reducedMotion, isLowPowerDevice } = useContext(ActivityMotion)
  const growth = useMotionValue(reducedMotion ? 1 : 0)
  const path = useTransform(growth, current => {
    const h = Math.max(0, height * current), top = y + height - h
    const radius = Math.min(10, width / 2, h / 2), bottom = Math.min(3, h / 2)
    return `M${x + radius},${top}H${x + width - radius}Q${x + width},${top} ${x + width},${top + radius}V${y + height - bottom}Q${x + width},${y + height} ${x + width - bottom},${y + height}H${x + bottom}Q${x},${y + height} ${x},${y + height - bottom}V${top + radius}Q${x},${top} ${x + radius},${top}Z`
  })
  const opacity = useTransform(growth, [0, .04, 1], [0, 1, 1])
  useEffect(() => {
    if (reducedMotion) { growth.set(1); return }
    if (!visible) return
    const controls = animate(growth, 1, { duration: isLowPowerDevice ? .6 : .85, delay: .12 + index * .055, ease: EASE })
    return () => controls.stop()
  }, [visible, reducedMotion, isLowPowerDevice, index, growth])
  return <g className="dashboard-activity-bar" data-day-index={index}>
    <motion.path d={path} fill={fill} style={{ opacity }} />
  </g>
}

/** The arc and number share one motion value, so they always finish together. */
export function DashboardTargetProgress({ value, hasScore, ready }: { value: number; hasScore: boolean; ready: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const visible = useInView(ref, { once: true, amount: .4 })
  const { reducedMotion, isLowPowerDevice } = useMotionPreferences()
  const { activityStartedAt } = useContext(ChartSequence)
  const finishedEntrance = useRef(false)
  const [settled, setSettled] = useState(false)
  const progress = useMotionValue(reducedMotion ? value : 0)
  const offset = useTransform(progress, current => CIRCUMFERENCE * (1 - current / 100))
  const label = useTransform(progress, current => `${Math.round(current)}%`)
  const arcOpacity = useTransform(progress, current => current > 0 ? 1 : 0)
  const tipX = useTransform(progress, current => 50 + 41 * Math.cos(current / 100 * 2 * Math.PI))
  const tipY = useTransform(progress, current => 50 + 41 * Math.sin(current / 100 * 2 * Math.PI))

  useEffect(() => {
    if (!ready || (!visible && !reducedMotion)) return
    const target = hasScore ? Math.max(0, Math.min(100, value)) : 0
    if (reducedMotion) {
      progress.set(target)
      finishedEntrance.current = true
      return
    }
    const firstEntrance = !finishedEntrance.current
    // The chart reports its real start after loading. Small screens reveal the
    // ring independently because weekly activity is further down the page.
    const delay = activityStartedAt !== null
      ? Math.max(0, ACTIVITY_DURATION - (performance.now() - activityStartedAt) / 1000)
      : window.matchMedia('(min-width: 1280px)').matches ? ACTIVITY_DURATION : .25
    const controls = animate(progress, target, {
      duration: firstEntrance ? isLowPowerDevice ? .85 : 1.45 : .4,
      delay: firstEntrance ? delay : 0,
      ease: EASE,
      onComplete: () => { finishedEntrance.current = true; setSettled(true) },
    })
    return () => controls.stop()
  }, [ready, visible, reducedMotion, isLowPowerDevice, hasScore, value, progress, activityStartedAt])

  return <div ref={ref} className="dashboard-progress-orbit dashboard-instrument" data-settled={settled && hasScore} data-motion={reducedMotion ? 'reduced' : 'full'} aria-busy={!ready}>
    <span className="dashboard-progress-completion" aria-hidden="true" />
    <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
      <g className="dashboard-progress-ticks" stroke="rgba(255,255,255,.28)" strokeWidth=".6">
        {Array.from({ length: 40 }, (_, index) => <line key={index} x1="50" y1={index % 5 === 0 ? '3' : '4.5'} x2="50" y2="6" transform={`rotate(${index * 9} 50 50)`} />)}
      </g>
      <circle cx="50" cy="50" r="41" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="6" />
      <g opacity={hasScore && ready ? 1 : 0}>
        <motion.circle className="dashboard-target-progress-arc" cx="50" cy="50" r="41" fill="none" stroke="#fff" strokeLinecap="round" strokeWidth="6" strokeDasharray={CIRCUMFERENCE} style={{ strokeDashoffset: offset, opacity: arcOpacity }} />
        <motion.circle cx={tipX} cy={tipY} r="4.4" fill="white" fillOpacity=".16" style={{ opacity: arcOpacity }} />
        <motion.circle className="dashboard-progress-tip" cx={tipX} cy={tipY} r="2.2" fill="white" style={{ opacity: arcOpacity }} />
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
