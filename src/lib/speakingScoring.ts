// Offline transcript analysis. Runs instantly in the browser with no API call.
// Compute descriptive statistics for the learner. Counts and pace cannot
// substitute for assessment against IELTS language-performance descriptors.

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

export type FallbackBands = {
  fluencyBand: number
  lexicalBand: number
  grammarBand: number
  pronunciationBand: number
  overallBand: number
}

/** Compatibility placeholders. Statistics cannot assess IELTS descriptors.
 * Display these as unassessed, never as a zero performance band. */
export function estimateBandsFromStats(_stats: SpeechStats): FallbackBands {
  return { fluencyBand: 0, lexicalBand: 0, grammarBand: 0, pronunciationBand: 0, overallBand: 0 }
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
