import { validWritingAnchors, writingVersion, type WritingAnchor } from './novaStudy'

/** Rebase only untouched spans. Never guess a new location from a repeated quote. */
export function mapWritingAnchors(before: string, after: string, anchors: WritingAnchor[], edit?: { start: number; end: number }): WritingAnchor[] {
  const valid = validWritingAnchors(before, anchors)
  if (before === after) return valid
  let start = 0, oldEnd = before.length, newEnd = after.length
  while (start < oldEnd && start < newEnd && before[start] === after[start]) start++
  while (oldEnd > start && newEnd > start && before[oldEnd - 1] === after[newEnd - 1]) { oldEnd--; newEnd-- }
  // Native beforeinput disambiguates insertions beside repeated words.
  if (edit && edit.start >= 0 && edit.end >= edit.start && edit.end <= before.length) {
    const insertedEnd = edit.end + after.length - before.length
    if (insertedEnd >= edit.start && before.slice(0, edit.start) === after.slice(0, edit.start) && before.slice(edit.end) === after.slice(insertedEnd)) {
      start = edit.start; oldEnd = edit.end; newEnd = insertedEnd
    }
  }
  const delta = newEnd - oldEnd, version = writingVersion(after)
  return validWritingAnchors(after, valid.flatMap(anchor => {
    if (anchor.end <= start) return [{ ...anchor, version }]
    if (anchor.start >= oldEnd) return [{ ...anchor, start: anchor.start + delta, end: anchor.end + delta, version }]
    return []
  }))
}
