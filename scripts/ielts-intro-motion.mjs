// Evaluate entire pointer gestures, rather than easing every screenshot interval.
export function cursorAt(motions, time) {
  const index = motions.findLastIndex(motion => time >= motion.start)
  const motion = motions[index]
  if (!motion) return motions[0]?.from ?? { x: 640, y: 360 }
  const duration = motion.end - motion.start
  const t = duration <= 0 ? 1 : Math.max(0, Math.min(1, (time - motion.start) / duration))
  const ease = motion.easing === 'linear' ? t : t * t * t * (10 + t * (-15 + 6 * t))
  return {
    x: motion.from.x + (motion.to.x - motion.from.x) * ease,
    y: motion.from.y + (motion.to.y - motion.from.y) * ease,
  }
}
