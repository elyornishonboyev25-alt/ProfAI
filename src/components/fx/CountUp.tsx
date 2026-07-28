import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'

interface CountUpProps {
  value: number
  /** Seconds */
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
  className?: string
}

/**
 * Animated number that counts from 0 → value the first time it scrolls into
 * view. Respects reduced-motion / low-power (shows the final value instantly).
 */
export default function CountUp({ value, duration = 1.1, decimals = 0, prefix = '', suffix = '', className }: CountUpProps) {
  const { minimalMotion } = useMotionPreferences()
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '50px 0px 50px 0px' })
  const [display, setDisplay] = useState(minimalMotion ? value : 0)

  useEffect(() => {
    if (minimalMotion) {
      setDisplay(value)
      return
    }
    if (!inView) return

    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / (duration * 1000))
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(value * eased)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, value, duration, minimalMotion])

  const formatted = display.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}
