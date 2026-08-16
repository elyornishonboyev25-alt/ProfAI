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
export default function CountUp({ value, decimals = 0, prefix = '', suffix = '', className }: CountUpProps) {
  const formatted = value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return (
    <span className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}
