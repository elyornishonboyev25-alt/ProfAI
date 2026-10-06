/** Shared, caption-boundary-only lesson preparation. Never interpolate word timings. */
export type TimedSpeech = { startSec: number; endSec: number; text: string }
export const SHADOWING_LIMIT = 120
const sentenceEnd = (text: string) => /[.!?]["'’”)\]]?$/.test(text.trim())

export function prepareShadowingLesson<T extends TimedSpeech>(input: T[], sourceDuration: number) {
  const limit = Math.min(SHADOWING_LIMIT, Math.max(0, sourceDuration))
  let captions = input.filter(cue => Number.isFinite(cue.startSec) && Number.isFinite(cue.endSec)
    && cue.startSec >= 0 && cue.endSec > cue.startSec && cue.endSec <= limit && cue.text.trim())
    .map(cue => ({ ...cue, text: cue.text.trim() })).sort((a, b) => a.startSec - b.startSec)
  // End a long source on a complete sentence near the two-minute boundary.
  if (sourceDuration > limit) {
    let sentence = -1
    captions.forEach((cue, index) => { if (cue.endSec >= limit - 18 && sentenceEnd(cue.text)) sentence = index })
    if (sentence >= 0) captions = captions.slice(0, sentence + 1)
  }
  // Overlapping rolling captions cannot be used as independent audio boundaries.
  const units: TimedSpeech[] = []
  for (const cue of captions) {
    const previous = units[units.length - 1]
    if (previous && cue.startSec < previous.endSec - 0.05) {
      previous.endSec = Math.max(previous.endSec, cue.endSec)
      previous.text = cue.text.startsWith(previous.text) ? cue.text : `${previous.text} ${cue.text}`
    } else units.push({ ...cue })
  }
  // First prefer a complete 12–18 second partition. Cached transcripts may
  // already be grouped into phrases, and rolling captions may overlap into a
  // longer indivisible unit. If strict grouping fails, allow shorter sections
  // and preserve long units intact instead of disabling the entire lesson.
  const costs = Array(units.length + 1).fill(Infinity) as number[]
  const next = Array(units.length).fill(-1) as number[]
  for (const relaxed of [false, true]) {
    costs.fill(Infinity)
    next.fill(-1)
    costs[units.length] = 0
    for (let i = units.length - 1; i >= 0; i--) {
      for (let j = i; j < units.length; j++) {
        const span = units[j].endSec - units[i].startSec
        if (span > 18 && !(relaxed && j === i)) break
        const final = j === units.length - 1
        if (span < 12 && !final && !relaxed) continue
        const natural = sentenceEnd(units[j].text) || (units[j + 1]?.startSec ?? Infinity) - units[j].endSec >= 0.25
        const cost = costs[j + 1] + Math.abs(span - 15) + (natural ? 0 : 8) + (span < 12 || span > 18 ? 20 : 0)
        if (cost < costs[i]) { costs[i] = cost; next[i] = j + 1 }
      }
    }
    if (Number.isFinite(costs[0])) break
  }
  const segments: Array<TimedSpeech & { orderIndex: number }> = []
  if (Number.isFinite(costs[0])) {
    for (let i = 0; i < units.length;) {
      const end = next[i]
      segments.push({ orderIndex: segments.length, startSec: units[i].startSec,
        endSec: units[end - 1].endSec, text: units.slice(i, end).map(cue => cue.text).join(' ') })
      i = end
    }
  }
  return { captions, segments, durationSec: captions[captions.length - 1]?.endSec ?? limit }
}
