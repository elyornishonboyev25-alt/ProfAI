// Offline transcript analysis. Runs instantly in the browser with no API call.
// Two jobs:
//   1) Compute speech stats (fillers, words-per-minute, lexical variety) that we
//      show to the user AND feed to the AI examiner so its scoring is grounded.
//   2) Provide a sensible FALLBACK band estimate when the AI is unavailable
//      (e.g. all Gemini keys hit their daily quota) so a result always appears.

export type SpeechStats = {
  wordCount: number
  uniqueWords: number
  /** Lexical variety 0–1 (unique / total) — higher = richer vocabulary. */
  typeTokenRatio: number
  fillerCount: number
  fillerWords: string[]
  /** Words per minute over the speaking duration. */
  wordsPerMinute: number
  /** Rough sentence count from punctuation / long pauses. */
  sentenceCount: number
  durationSec: number
}

const FILLER_PATTERNS: Array<{ label: string; re: RegExp }> = [
  { label: 'um', re: /\b(um+)\b/gi },
  { label: 'uh', re: /\b(uh+|er+|erm+|ah+)\b/gi },
  // Count discourse markers conservatively; "I like music" and "actually
  // happened" are meaningful English, not evidence of hesitation.
  { label: 'like', re: /(?:^|[,;.!?]\s*)like\s*,/gi },
  { label: 'you know', re: /\byou know\b/gi },
  { label: 'basically', re: /(?:^|[,;.!?]\s*)basically\s*,/gi },
  { label: 'actually', re: /(?:^|[,;.!?]\s*)actually\s*,/gi },
  { label: 'sort of', re: /\b(sort of|kind of|kinda)\b/gi },
  { label: 'I mean', re: /\bi mean\b/gi },
  { label: 'so', re: /\b(so so)\b/gi },
]

export function analyseTranscript(transcript: string, durationSec: number): SpeechStats {
  const clean = transcript.trim()
  const tokens = clean.length ? clean.toLowerCase().match(/[a-zA-Z']+/g) ?? [] : []
  const wordCount = tokens.length
  const unique = new Set(tokens)
  const uniqueWords = unique.size

  const fillerWords: string[] = []
  let fillerCount = 0
  for (const { label, re } of FILLER_PATTERNS) {
    const matches = clean.match(re)
    if (matches && matches.length > 0) {
      fillerCount += matches.length
      fillerWords.push(`${label} ×${matches.length}`)
    }
  }

  const sentenceCount = wordCount ? Math.max(1, (clean.match(/[.!?]+/g) ?? []).length || Math.round(wordCount / 14)) : 0
  const safeDuration = Number.isFinite(durationSec) ? Math.max(0, durationSec) : 0
  const minutes = Math.max(safeDuration / 60, 1 / 60)
  const wordsPerMinute = Math.round(wordCount / minutes)

  return {
    wordCount,
    uniqueWords,
    typeTokenRatio: wordCount ? +(uniqueWords / wordCount).toFixed(3) : 0,
    fillerCount,
    fillerWords,
    wordsPerMinute: Number.isFinite(wordsPerMinute) ? wordsPerMinute : 0,
    sentenceCount,
    durationSec: +safeDuration.toFixed(2),
  }
}

/** Combine multiple answers' stats into one session-level summary. */
export function mergeStats(parts: SpeechStats[], transcript: string): SpeechStats {
  const durationSec = parts.reduce((sum, part) => sum + part.durationSec, 0)
  return analyseTranscript(transcript, durationSec)
}

function clampBand(value: number): number {
  return Math.round(Math.max(0, Math.min(9, value)) * 2) / 2
}

export type FallbackBands = {
  fluencyBand: number
  lexicalBand: number
  grammarBand: number
  pronunciationBand: number
  overallBand: number
}

// Heuristic band estimate from stats alone — only used when the AI can't be reached.
// Deliberately conservative: it rewards length, lexical variety and pace while
// penalising heavy filler use. Real grading still comes from the AI when available.
export function estimateBandsFromStats(stats: SpeechStats): FallbackBands {
  const { wordCount, typeTokenRatio, fillerCount, wordsPerMinute } = stats
  if (wordCount === 0) return { fluencyBand: 0, lexicalBand: 0, grammarBand: 0, pronunciationBand: 0, overallBand: 0 }

  // Fluency: enough words at a natural pace, not too many fillers.
  const fillerRate = wordCount ? fillerCount / wordCount : 1
  let fluency = 5
  if (wordCount >= 40) fluency += 0.5
  if (wordCount >= 90) fluency += 0.5
  if (wordsPerMinute >= 100 && wordsPerMinute <= 170) fluency += 1
  else if (wordsPerMinute >= 80) fluency += 0.5
  fluency -= Math.min(2, fillerRate * 18)

  // Lexical resource: vocabulary variety, scaled by how much they actually said.
  let lexical = 5
  if (wordCount >= 30) {
    if (typeTokenRatio >= 0.62) lexical += 1.5
    else if (typeTokenRatio >= 0.52) lexical += 1
    else if (typeTokenRatio >= 0.42) lexical += 0.5
  }
  if (wordCount >= 120) lexical += 0.5

  // Grammar: proxied by sentence development & length (weak proxy, kept modest).
  let grammar = 5
  if (wordCount >= 50) grammar += 0.5
  if (stats.sentenceCount >= 4 && wordCount / stats.sentenceCount >= 9) grammar += 0.5

  // Pronunciation can't be measured from text — anchor near fluency.
  const pronunciation = clampBand(fluency - 0.5)

  const fluencyBand = clampBand(fluency)
  const lexicalBand = clampBand(lexical)
  const grammarBand = clampBand(grammar)
  const pronunciationBand = pronunciation
  const overallBand = clampBand((fluencyBand + lexicalBand + grammarBand + pronunciationBand) / 4)

  if (wordCount < 20) {
    const ceiling = wordCount < 5 ? 2 : 4.5
    const limited = (band: number) => Math.min(ceiling, band)
    return {
      fluencyBand: limited(fluencyBand), lexicalBand: limited(lexicalBand),
      grammarBand: limited(grammarBand), pronunciationBand: limited(pronunciationBand),
      overallBand: limited(overallBand),
    }
  }

  return { fluencyBand, lexicalBand, grammarBand, pronunciationBand, overallBand }
}

/** Highlight filler spans in a transcript for rendering (returns segments). */
export function splitFillerSegments(transcript: string): Array<{ text: string; filler: boolean }> {
  if (!transcript.trim()) return []
  const combined = new RegExp(
    `(${FILLER_PATTERNS.map((f) => f.re.source).join('|')})`,
    'gi',
  )
  const segments: Array<{ text: string; filler: boolean }> = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  combined.lastIndex = 0
  while ((match = combined.exec(transcript)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: transcript.slice(lastIndex, match.index), filler: false })
    }
    segments.push({ text: match[0], filler: true })
    lastIndex = match.index + match[0].length
    if (match.index === combined.lastIndex) combined.lastIndex++
  }
  if (lastIndex < transcript.length) {
    segments.push({ text: transcript.slice(lastIndex), filler: false })
  }
  return segments
}

export function xpForBand(band: number): number {
  if (band >= 8.5) return 140
  if (band >= 7.5) return 110
  if (band >= 6.5) return 80
  if (band >= 5.5) return 55
  if (band >= 4.5) return 35
  return 20
}
