import { useEffect, useState } from 'react'

/** Read source text before focus moves to the dock; never collect editable drafts. */
export function useNovaSelection(pathname: string) {
  const [text, setText] = useState(''), [context, setContext] = useState('')
  const [position, setPosition] = useState({ x: 16, y: 16 })
  useEffect(() => { setText(''); setContext('') }, [pathname])
  useEffect(() => {
    const read = () => {
      const selection = window.getSelection()
      const node = selection?.anchorNode
      const element = node instanceof Element ? node : node?.parentElement
      if (element?.closest('.nova-study-dock,.nova-selection-action,input,textarea,[contenteditable]')) return
      const value = selection?.toString().trim().slice(0, 2400) ?? ''
      if (!value || !selection?.rangeCount) { setText(''); return }
      const rect = selection.getRangeAt(0).getBoundingClientRect()
      setPosition({ x: Math.max(12, Math.min(rect.left, window.innerWidth - 200)), y: Math.max(12, Math.min(rect.bottom + 8, window.innerHeight - 56)) })
      setText(value)
    }
    const dismiss = () => setText('')
    document.addEventListener('mouseup', read)
    document.addEventListener('keyup', read)
    document.addEventListener('touchend', read)
    window.addEventListener('scroll', dismiss, true)
    return () => { document.removeEventListener('mouseup', read); document.removeEventListener('keyup', read); document.removeEventListener('touchend', read); window.removeEventListener('scroll', dismiss, true) }
  }, [])
  return { text, context, position, commit: (value = text) => { setContext(value); setText(''); window.getSelection()?.removeAllRanges(); return value } }
}
