import type { Question, Section } from '@/types/ieltsTypes'
import { parseSectionParagraphs } from './readingReview'
import { optionDisplayText } from './readingPresentation'
import { readingAnswerEvidence, readingEvidenceKeyConflicts } from '@/data/readingAnswerEvidence'

export type EvidenceBlock = { id: string; label?: string; text: string }
export type EvidenceRange = { blockId: string; start: number; end: number; kind: 'answer' | 'context'; answerIndex?: number }
export type AnswerEvidence = {
  blocks: EvidenceBlock[]
  ranges: EvidenceRange[]
  state: 'answer' | 'context' | 'not-given' | 'not-mentioned' | 'unavailable' | 'key-conflict'
}

/** Normalise typography while retaining offsets into the untouched source. */
function indexedText(text: string) {
  const offsets: number[] = []
  let normalized = ''
  for (let index = 0; index < text.length; index++) {
    const char = text[index].normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      .replace(/[‘’]/g, "'").replace(/[–—]/g, '-')
    for (const value of char) {
      if (/\s/.test(value)) {
        if (normalized.endsWith(' ')) continue
        normalized += ' '
      } else normalized += value
      offsets.push(index)
    }
  }
  return { normalized, offsets }
}

export function findSourceRanges(text: string, quote: string): { start: number; end: number }[] {
  const source = indexedText(text)
  const needle = indexedText(quote.trim()).normalized
  if (!needle) return []
  const ranges: { start: number; end: number }[] = []
  let from = 0
  while (from < source.normalized.length) {
    const index = source.normalized.indexOf(needle, from)
    if (index < 0) break
    const before = source.normalized[index - 1] ?? ''
    const after = source.normalized[index + needle.length] ?? ''
    if (!(/[\p{L}\p{N}]/u.test(needle[0]) && /[\p{L}\p{N}]/u.test(before))
      && !(/[\p{L}\p{N}]/u.test(needle[needle.length - 1]) && /[\p{L}\p{N}]/u.test(after))) {
      ranges.push({ start: source.offsets[index], end: source.offsets[index + needle.length - 1] + 1 })
    }
    from = index + needle.length
  }
  return ranges
}

export function sourceBlocks(section: Section): EvidenceBlock[] {
  return parseSectionParagraphs(section).map((paragraph, index) => ({
    id: `paragraph-${index}`, label: paragraph.label.startsWith('TEXT') ? undefined : paragraph.label, text: paragraph.content,
  }))
}

function locationBlocks(blocks: EvidenceBlock[], location?: string): EvidenceBlock[] {
  const reference = location?.match(/\b(?:paragraphs?|sections?)\s+((?:[A-Z]|\d+)(?:\s*(?:[-–—]|and|,)\s*(?:[A-Z]|\d+))*)\b/i)?.[1]
  if (!reference) return []
  const labels: string[] = reference.toUpperCase().match(/\b(?:[A-Z]|\d+)\b/g) ?? []
  const range = reference.match(/^([A-Z]|\d+)\s*[-–—]\s*([A-Z]|\d+)$/i)
  if (range) {
    const numeric = /^\d+$/.test(range[1])
    const start = numeric ? Number(range[1]) : range[1].toUpperCase().charCodeAt(0)
    const end = numeric ? Number(range[2]) : range[2].toUpperCase().charCodeAt(0)
    if (end >= start && end - start < 30) labels.splice(0, labels.length, ...Array.from({ length: end - start + 1 }, (_, i) => numeric ? String(start + i) : String.fromCharCode(start + i)))
  }
  return blocks.filter((block, index) => labels.includes(block.label ?? '')
    || (labels.some(label => /^\d+$/.test(label) && Number(label) === index + 1)))
}

export function resolveAnswerEvidence(section: Section, question: Question): AnswerEvidence {
  const blocks = sourceBlocks(section)
  const base = { blocks }
  const conflict = readingEvidenceKeyConflicts[question.id]
  if (conflict && question.correctAnswer === conflict.storedAnswer) return { ...base, ranges: [], state: 'key-conflict' }
  if (String(question.correctAnswer).toUpperCase() === 'NOT GIVEN') {
    return { ...base, ranges: [], state: 'not-given' }
  }
  if (question.type === 'multiple-choice' && /\bNOT\s+(?:mentioned|included|discussed)\b/i.test(question.text)) {
    return { ...base, ranges: [], state: 'not-mentioned' }
  }
  const storedQuotes = readingAnswerEvidence[question.id]
  const quotations: NonNullable<Question['answerEvidence']> = question.answerEvidence ?? storedQuotes?.map((quote, index) => ({ quote,
    answerIndex: Array.isArray(question.correctAnswer) && storedQuotes.length === question.correctAnswer.length ? index : undefined,
  })) ?? []
  const explicit = quotations.flatMap(evidence => blocks
    .filter(block => !evidence.paragraphLabel || block.label === evidence.paragraphLabel.toUpperCase())
    .flatMap(block => findSourceRanges(block.text, evidence.quote).map(range => ({ ...range, blockId: block.id, kind: 'answer' as const, answerIndex: evidence.answerIndex }))))
  if (explicit.length) return { ...base, ranges: mergeEvidenceRanges(explicit), state: 'answer' }

  let located = locationBlocks(blocks, question.location)
  if (!located.length && question.type === 'matching-headings') located = locationBlocks(blocks, question.text)
  if (!located.length && question.type === 'matching-information'
    && question.options?.every(option => /^(?:[A-Z][.)]?\s*)?(?:Paragraph\s+)?[A-Z]$/.test(option.trim()))) {
    located = blocks.filter(block => block.label === String(question.correctAnswer))
  }
  if (!located.length && question.type === 'matching-information' && question.options && typeof question.correctAnswer === 'string') {
    const index = /^[A-Z]$/.test(question.correctAnswer) ? question.correctAnswer.charCodeAt(0) - 65 : -1
    const name = question.options[index] ? optionDisplayText(question.options[index], question.options) : ''
    // A named person's unique source paragraph is contextual evidence for
    // matching researchers, rather than a guessed sentence or a letter match.
    if (/^[A-Z][\p{L}.'-]+(?:\s+[A-Z][\p{L}.'-]+)+$/u.test(name)) {
      const matches = blocks.filter(block => findSourceRanges(block.text, name).length)
      if (matches.length === 1) located = matches
    }
  }
  const relevant = located.length ? located : blocks
  const completion = ['note-completion', 'summary-completion', 'short-answer', 'drag-drop-summary'].includes(question.type)
  if (completion) {
    const answers = (Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer])
      .flatMap((answer, answerIndex) => answer.split(/\s*(?:\/|\||;)\s*/).filter(answer => answer.trim()).map(answer => ({ answer, answerIndex })))
    const ranges = answers.flatMap(({ answer, answerIndex }) => relevant.flatMap(block => findSourceRanges(block.text, answer)
      .map(range => ({ ...range, blockId: block.id, kind: 'answer' as const, answerIndex }))))
    const merged = mergeEvidenceRanges(ranges)
    // A repeated word across several paragraphs is not enough to identify evidence.
    if (merged.length && (located.length || new Set(merged.map(range => range.blockId)).size === 1)) {
      return { ...base, ranges: merged, state: 'answer' }
    }
  }
  // Published paragraph locations provide context for paraphrases, headings and
  // TRUE/FALSE items. Do not present a keyword similarity guess as proof.
  if (located.length) {
    return { ...base, ranges: located.map(block => ({ blockId: block.id, start: 0, end: block.text.length, kind: 'context' })), state: 'context' }
  }
  return { ...base, ranges: [], state: 'unavailable' }
}

export function mergeEvidenceRanges(ranges: EvidenceRange[]): EvidenceRange[] {
  const merged: EvidenceRange[] = []
  for (const range of ranges.slice().sort((a, b) => a.blockId.localeCompare(b.blockId) || a.start - b.start || b.end - a.end)) {
    const previous = merged[merged.length - 1]
    if (previous?.blockId === range.blockId && range.start < previous.end) previous.end = Math.max(previous.end, range.end)
    else merged.push({ ...range })
  }
  return merged
}
