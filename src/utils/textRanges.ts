/** Text offsets survive inline formatting, repeated words and DOM mark wrappers. */
export function clipTextRange(container: HTMLElement, source: Range): Range | null {
  const contents = document.createRange()
  contents.selectNodeContents(container)
  const range = source.cloneRange()
  if (range.compareBoundaryPoints(window.Range.START_TO_START, contents) < 0) range.setStart(contents.startContainer, contents.startOffset)
  if (range.compareBoundaryPoints(window.Range.END_TO_END, contents) > 0) range.setEnd(contents.endContainer, contents.endOffset)
  return range.collapsed || !container.contains(range.startContainer) || !container.contains(range.endContainer) ? null : range
}

export function textOffsets(container: HTMLElement, range: Range) {
  const prefix = document.createRange()
  prefix.selectNodeContents(container)
  prefix.setEnd(range.startContainer, range.startOffset)
  const start = prefix.toString().length
  return { start, end: start + range.toString().length }
}

export function textRange(container: HTMLElement, start: number, end: number): Range | null {
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end <= start) return null
  const walker = document.createTreeWalker(container, window.NodeFilter.SHOW_TEXT)
  const range = document.createRange()
  let offset = 0
  let started = false
  while (walker.nextNode()) {
    const node = walker.currentNode
    const length = node.textContent?.length ?? 0
    if (!started && start < offset + length) {
      range.setStart(node, start - offset)
      started = true
    }
    if (started && end <= offset + length) {
      range.setEnd(node, end - offset)
      return range
    }
    offset += length
  }
  return null
}

/** Measure text leaves only: element rectangles can cover several wrapped lines. */
export function textClientRects(container: HTMLElement, range: Range): DOMRect[] {
  const walker = document.createTreeWalker(container, window.NodeFilter.SHOW_TEXT)
  const rectangles: DOMRect[] = []
  while (walker.nextNode()) {
    const node = walker.currentNode
    if (!range.intersectsNode(node)) continue
    const start = node === range.startContainer ? range.startOffset : 0
    const end = node === range.endContainer ? range.endOffset : node.textContent?.length ?? 0
    if (end <= start) continue
    const leaf = document.createRange()
    leaf.setStart(node, start)
    leaf.setEnd(node, end)
    rectangles.push(...Array.from(leaf.getClientRects()).filter(rect => rect.width > 0 && rect.height > 0))
  }
  return rectangles
}
