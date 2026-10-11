/** Preserve real caption boundaries: never invent word timestamps to fit a clip length. */
export type TimedSpeech = { startSec: number; endSec: number; text: string }
export const SHADOWING_LIMIT = 120
const sentenceEnd = (text: string) => /[.!?]["'’”)\]]?$/.test(text.trim())

export function prepareShadowingLesson<T extends TimedSpeech>(input: T[], sourceDuration: number) {
  const limit = Number.isFinite(sourceDuration) ? Math.min(SHADOWING_LIMIT, Math.max(0, sourceDuration)) : SHADOWING_LIMIT
  const sorted = input.filter(cue => Number.isFinite(cue.startSec) && Number.isFinite(cue.endSec)
    && cue.startSec >= 0 && cue.startSec < limit && cue.endSec > cue.startSec && cue.text.trim())
    .map(cue => ({ ...cue, endSec: Math.min(limit, cue.endSec), text: cue.text.replace(/\s+/g, ' ').trim() }))
    .sort((a, b) => a.startSec - b.startSec || b.text.length - a.text.length)
    .filter((cue, index, all) => !index || cue.startSec !== all[index - 1].startSec)
  // Rolling captions repeat the tail of the previous display. Remove only
  // shared words on overlapping cues; genuine repetitions across pauses stay.
  const cleaned: typeof sorted = []
  sorted.forEach((cue, index) => {
    const previous = sorted[index - 1]
    if (!previous || previous.endSec <= cue.startSec) { cleaned.push(cue); return }
    const words = cue.text.split(' ')
    const before = previous.text.split(' ')
    let overlap = Math.min(before.length, words.length)
    while (overlap > 0 && before.slice(-overlap).join(' ').toLowerCase() !== words.slice(0, overlap).join(' ').toLowerCase()) overlap--
    const text = words.slice(overlap).join(' ')
    if (text) cleaned.push({ ...cue, text })
    else if (cleaned.length) cleaned[cleaned.length - 1].endSec = Math.max(cleaned[cleaned.length - 1].endSec, cue.endSec)
  })
  const captions = cleaned.map((cue, index) => ({ ...cue,
    endSec: Math.min(cue.endSec, cleaned[index + 1]?.startSec ?? limit),
  })).filter(cue => cue.endSec > cue.startSec)
  const durationSec = captions.length ? Math.max(...captions.map(cue => cue.endSec)) : limit
  const segments: Array<TimedSpeech & { orderIndex: number; textTimingEstimated?: boolean }> = []
  if (!captions.length) return { captions, segments, durationSec }

  // Every candidate is a real cue boundary. A complete coarse cue is safer
  // than cutting its audio and distributing words by a fabricated proportion.
  const boundaries = [0, ...captions.slice(1).map(cue => cue.startSec), durationSec]
  const costs = boundaries.map(() => Infinity)
  const next = boundaries.map(() => -1)
  costs[costs.length - 1] = 0
  for (let i = captions.length - 1; i >= 0; i--) {
    for (let j = i + 1; j <= captions.length; j++) {
      const span = boundaries[j] - boundaries[i]
      if (span > 24 && j > i + 1) break
      const prior = captions[j - 1]
      const pause = j === captions.length || captions[j].startSec - prior.endSec >= 0.35
      const natural = sentenceEnd(prior.text) || pause
      const cost = costs[j] + Math.abs(span - 15) + (span < 6 ? 12 : 0)
        + (natural ? 0 : 24) + (span > 18 ? (span - 18) * 4 : 0)
      if (cost < costs[i]) { costs[i] = cost; next[i] = j }
    }
  }
  for (let i = 0; i < captions.length;) {
    const end = next[i]
    segments.push({ orderIndex: segments.length, startSec: boundaries[i], endSec: boundaries[end],
      text: captions.slice(i, end).map(cue => cue.text).join(' '),
    })
    i = end
  }
  return { captions, segments, durationSec }
}
