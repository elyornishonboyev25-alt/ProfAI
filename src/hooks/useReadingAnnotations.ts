import { useLayoutEffect, type RefObject } from 'react'
import { accountStorageFor } from '@/utils/accountStorage'
import { textOffsets, textRange } from '@/utils/textRanges'

type Mark = { start: number; end: number; text: string; type: 'highlight' | 'note'; group: string; note: string }

/** Store text coordinates, never HTML, so restored notes cannot inject markup. */
export function useReadingAnnotations(shell: RefObject<HTMLDivElement>, key: string, owner: string, active: boolean) {
  useLayoutEffect(() => {
    if (!active || !shell.current) return
    const storage = accountStorageFor(owner)
    const containers = Array.from(shell.current.querySelectorAll<HTMLElement>('[data-reading-markable="1"]'))
    let saved: Mark[][] = []
    try { saved = JSON.parse(storage.getItem(key) ?? '[]') } catch { /* Optional annotations. */ }
    containers.forEach((container, index) => {
      if (container.querySelector('[data-reading-mark="1"]')) return
      for (const mark of saved[index] ?? []) {
        const range = textRange(container, mark.start, mark.end)
        if (!range || range.toString() !== mark.text) continue
        // Wrap each text fragment independently to preserve the React element tree.
        const walker = document.createTreeWalker(container, 4)
        const fragments: { node: Text; start: number; end: number }[] = []
        while (walker.nextNode()) {
          const node = walker.currentNode as Text
          if (node.parentElement?.closest('[data-annotation-ignore]')) continue
          if (!range.intersectsNode(node)) continue
          const start = node === range.startContainer ? range.startOffset : 0
          const end = node === range.endContainer ? range.endOffset : node.length
          if (end > start) fragments.push({ node, start, end })
        }
        for (const fragment of fragments) {
          const text = fragment.start ? fragment.node.splitText(fragment.start) : fragment.node
          if (fragment.end - fragment.start < text.length) text.splitText(fragment.end - fragment.start)
          const span = document.createElement('span')
          span.className = mark.type === 'note' ? 'ielts-note' : 'ielts-highlight ielts-highlight--primary'
          span.dataset.readingMark = '1'
          span.dataset.markType = mark.type
          span.dataset.markGroup = mark.group
          if (mark.type === 'note') { span.dataset.note = mark.note; span.title = `Note: ${mark.note}` }
          text.parentNode?.insertBefore(span, text)
          span.appendChild(text)
        }
      }
    })
    let scroll: { top: number; left: number }[] = []
    try { scroll = JSON.parse(storage.getItem(`${key}:scroll`) ?? '[]') } catch { /* Optional viewport cache. */ }
    containers.forEach((container, index) => {
      container.scrollTop = scroll[index]?.top ?? 0
      container.scrollLeft = scroll[index]?.left ?? 0
    })
    const saveScroll = () => {
      try { storage.setItem(`${key}:scroll`, JSON.stringify(containers.map(container => ({ top: container.scrollTop, left: container.scrollLeft })))) } catch { /* Keep the viewport usable. */ }
    }
    let scrollTimer: number | undefined
    const scheduleScroll = () => {
      window.clearTimeout(scrollTimer)
      scrollTimer = window.setTimeout(() => { saveScroll(); scrollTimer = undefined }, 200)
    }
    containers.forEach(container => container.addEventListener('scroll', scheduleScroll, { passive: true }))
    const save = () => {
      const marks = containers.map(container => Array.from(container.querySelectorAll<HTMLElement>('[data-reading-mark="1"]')).map(node => {
        const range = document.createRange()
        range.selectNodeContents(node)
        return { ...textOffsets(container, range), text: range.toString(), type: node.dataset.markType === 'note' ? 'note' : 'highlight', group: node.dataset.markGroup ?? '', note: node.dataset.note ?? '' }
      }))
      try { storage.setItem(key, JSON.stringify(marks)) } catch { /* Keep marks visible. */ }
    }
    const observer = new window.MutationObserver(save)
    containers.forEach(container => observer.observe(container, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-note', 'data-mark-type'] }))
    const flush = () => {
      save()
      if (scrollTimer !== undefined) { window.clearTimeout(scrollTimer); saveScroll(); scrollTimer = undefined }
    }
    window.addEventListener('pagehide', flush)
    window.addEventListener('beforeunload', flush)
    return () => {
      // Consume pending edits before switching to another section.
      if (observer.takeRecords().length) save()
      observer.disconnect()
      if (scrollTimer !== undefined) { window.clearTimeout(scrollTimer); saveScroll() }
      containers.forEach(container => container.removeEventListener('scroll', scheduleScroll))
      window.removeEventListener('pagehide', flush)
      window.removeEventListener('beforeunload', flush)
    }
  }, [shell, key, owner, active])
}
