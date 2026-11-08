/** Text offsets survive inline formatting, repeated words and DOM mark wrappers. */
export function annotationText(container: HTMLElement): string {
  const walker = document.createTreeWalker(container, window.NodeFilter.SHOW_TEXT)
  let text = ''
  while (walker.nextNode()) {
    if (!walker.currentNode.parentElement?.closest('[data-annotation-ignore]')) text += walker.currentNode.textContent ?? ''
  }
  return text
}

/** Recover an older annotation when nearby question labels or formatting changed. */
export function resolveTextQuote(container: HTMLElement, quote: { start: number; end: number; text: string; prefix?: string; suffix?: string }): Range | null {
  const original = textRange(container, quote.start, quote.end)
  if (!quote.text) return null
  if (original?.toString() === quote.text && !quote.prefix && !quote.suffix) return original
  const text = annotationText(container)
  if (original?.toString() === quote.text && (!quote.prefix || text.slice(0, quote.start).endsWith(quote.prefix)) &&
    (!quote.suffix || text.slice(quote.end).startsWith(quote.suffix))) return original
  let best = -1
  let bestScore = -Infinity
  for (let index = text.indexOf(quote.text); index >= 0; index = text.indexOf(quote.text, index + 1)) {
    const prefix = quote.prefix && text.slice(0, index).endsWith(quote.prefix) ? 1 : 0
    const suffix = quote.suffix && text.slice(index + quote.text.length).startsWith(quote.suffix) ? 1 : 0
    const score = (prefix + suffix) * (text.length + 1) - Math.abs(index - quote.start)
    if (score > bestScore) { bestScore = score; best = index }
  }
  return best < 0 ? null : textRange(container, best, best + quote.text.length)
}

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
  const length = (part: Range) => {
    // Measure text leaves without cloning potentially large SVG path drawings.
    const walker = document.createTreeWalker(container, window.NodeFilter.SHOW_TEXT)
    let total = 0
    while (walker.nextNode()) {
      const node = walker.currentNode as Text
      if (node.parentElement?.closest('[data-annotation-ignore]') || !part.intersectsNode(node)) continue
      const start = node === part.startContainer ? part.startOffset : 0
      const end = node === part.endContainer ? part.endOffset : node.length
      total += Math.max(0, end - start)
    }
    return total
  }
  const start = length(prefix)
  return { start, end: start + length(range) }
}

export function textRange(container: HTMLElement, start: number, end: number): Range | null {
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end <= start) return null
  const walker = document.createTreeWalker(container, window.NodeFilter.SHOW_TEXT)
  const range = document.createRange()
  let offset = 0
  let started = false
  while (walker.nextNode()) {
    const node = walker.currentNode
    if (node.parentElement?.closest('[data-annotation-ignore]')) continue
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
export function textClientRects(container: HTMLElement, range: Range, measureCharacters = false): DOMRect[] {
  const walker = document.createTreeWalker(container, window.NodeFilter.SHOW_TEXT)
  const rectangles: DOMRect[] = []
  while (walker.nextNode()) {
    const node = walker.currentNode
    if (!range.intersectsNode(node)) continue
    const start = node === range.startContainer ? range.startOffset : 0
    const end = node === range.endContainer ? range.endOffset : node.textContent?.length ?? 0
    if (end <= start) continue
    const leaf = document.createRange()
    if (!measureCharacters) {
      leaf.setStart(node, start)
      leaf.setEnd(node, end)
      rectangles.push(...Array.from(leaf.getClientRects()).filter(rect => rect.width > 0 && rect.height > 0))
      continue
    }
    // Older browsers lack native CSS highlights. Measure individual characters
    // so even an aggregated multiline range box cannot color an adjacent line.
    let offset = start
    const lines: DOMRect[] = []
    for (const character of Array.from(node.textContent!.slice(start, end))) {
      leaf.setStart(node, offset)
      offset += character.length
      leaf.setEnd(node, offset)
      for (const rect of Array.from(leaf.getClientRects())) {
        if (!rect.width || !rect.height) continue
        const previous = lines[lines.length - 1]
        if (previous && Math.abs(previous.top - rect.top) < 0.5 && Math.abs(previous.height - rect.height) < 0.5 &&
          rect.left <= previous.right + 0.5 && rect.right >= previous.left - 0.5) {
          const left = Math.min(previous.left, rect.left)
          lines[lines.length - 1] = new window.DOMRect(left, previous.top, Math.max(previous.right, rect.right) - left, previous.height)
        } else lines.push(rect)
      }
    }
    rectangles.push(...lines)
  }
  return rectangles
}
