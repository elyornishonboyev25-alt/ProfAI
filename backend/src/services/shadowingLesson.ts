/** Prepare bounded practice clips from caption timestamps, including rolling captions. */
export type TimedSpeech = { startSec: number; endSec: number; text: string }
export const SHADOWING_LIMIT = 120
const sentenceEnd = (text: string) => /[.!?]["'’”)\]]?$/.test(text.trim())

export function prepareShadowingLesson<T extends TimedSpeech>(input: T[], sourceDuration: number) {
  const limit = Math.min(SHADOWING_LIMIT, Math.max(0, sourceDuration))
  const sorted = input.filter(cue => Number.isFinite(cue.startSec) && Number.isFinite(cue.endSec)
    && cue.startSec >= 0 && cue.startSec < limit && cue.endSec > cue.startSec && cue.text.trim())
    .map(cue => ({ ...cue, endSec: Math.min(limit, cue.endSec), text: cue.text.trim() }))
    .sort((a, b) => a.startSec - b.startSec)
  // Caption display durations can overlap across an entire YouTube video.
  // A new caption start replaces the preceding display; it does not mean
  // that the whole transcript is one indivisible speech unit.
  const captions = sorted.map((cue, index) => ({ ...cue,
    endSec: Math.min(cue.endSec, sorted[index + 1]?.startSec ?? limit),
  })).filter(cue => cue.endSec > cue.startSec)
  const durationSec = sorted[sorted.length - 1]?.endSec ?? limit
  const segments: Array<TimedSpeech & { orderIndex: number; textTimingEstimated?: boolean }> = []
  if (!captions.length) return { captions, segments, durationSec }

  // Prefer real caption starts. All sections cover consecutive video ranges;
  // shorter tails are necessary only for clips shorter than 24 seconds.
  const boundaries = [...new Set([0, ...captions.map(cue => cue.startSec), durationSec])].sort((a, b) => a - b)
  const costs = boundaries.map(() => Infinity)
  const next = boundaries.map(() => -1)
  costs[costs.length - 1] = 0
  for (let i = boundaries.length - 2; i >= 0; i--) {
    for (let j = i + 1; j < boundaries.length; j++) {
      const span = boundaries[j] - boundaries[i]
      if (span > 18) break
      if (span < 12 && !(durationSec < 24 && j === boundaries.length - 1)) continue
      const prior = captions.find(cue => cue.endSec === boundaries[j])
      const cost = costs[j] + Math.abs(span - 15) + (prior && sentenceEnd(prior.text) ? 0 : 3)
      if (cost < costs[i]) { costs[i] = cost; next[i] = j }
    }
  }
  const ranges: Array<[number, number]> = []
  if (Number.isFinite(costs[0])) {
    for (let i = 0; i < boundaries.length - 1;) {
      const end = next[i]
      ranges.push([boundaries[i], boundaries[end]])
      i = end
    }
  } else {
    // Coarse saved captions sometimes have no usable 12–18s boundaries.
    // Balance the video into bounded clips rather than keeping an 84s section.
    if (durationSec > 18 && durationSec < 24) ranges.push([0, 12], [12, durationSec])
    else {
      const count = Math.max(1, Math.ceil(durationSec / 18), Math.round(durationSec / 15))
      const length = durationSec / count
      for (let index = 0; index < count; index++) ranges.push([index * length, (index + 1) * length])
    }
  }
  for (const [startSec, endSec] of ranges) {
    let textTimingEstimated = false
    const parts: string[] = []
    for (const cue of captions) {
      if (cue.startSec >= endSec || cue.endSec <= startSec) continue
      if (cue.startSec >= startSec && cue.endSec <= endSec) { parts.push(cue.text); continue }
      // A coarse cue spanning a clip boundary has no word timestamps. Divide
      // its displayed text proportionally, flagging the estimate explicitly.
      const words = cue.text.split(/\s+/)
      const span = cue.endSec - cue.startSec
      const first = Math.round(Math.max(0, startSec - cue.startSec) / span * words.length)
      const last = Math.round(Math.min(span, endSec - cue.startSec) / span * words.length)
      parts.push(words.slice(first, last).join(' '))
      textTimingEstimated = true
    }
    segments.push({ orderIndex: segments.length, startSec, endSec, text: parts.filter(Boolean).join(' '),
      ...(textTimingEstimated ? { textTimingEstimated: true } : {}),
    })
  }
  return { captions, segments, durationSec }
}
