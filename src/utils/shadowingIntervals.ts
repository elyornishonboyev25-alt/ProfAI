import type { ShadowingSegment } from '@/services/shadowing'
import { formatClock } from '@/lib/youtube'

/** Time ranges are practice aids; these labels are never presented as speech transcripts. */
export function shadowingIntervals(youtubeId: string, duration: number, interval: number): ShadowingSegment[] {
  if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(interval) || interval <= 0) return []
  return Array.from({ length: Math.ceil(duration / interval) }, (_, index) => {
    const startSec = index * interval
    const endSec = Math.min(duration, startSec + interval)
    return { id: `${youtubeId}:interval:${interval}:${index}`, orderIndex: index, startSec, endSec, text: `${formatClock(startSec)} – ${formatClock(endSec)}` }
  })
}
