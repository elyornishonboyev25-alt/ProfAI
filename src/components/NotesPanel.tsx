import { accountStorageFor } from '@/utils/accountStorage'
import { useAuthStore } from '@/store/authStore'
import { useState, useEffect, useRef } from 'react'
import { XMarkIcon, DocumentTextIcon } from '@heroicons/react/24/outline'

interface NotesPanelProps { testId: string; storageKey?: string; isOpen: boolean; onClose: () => void }
export default function NotesPanel({ testId, storageKey, isOpen, onClose }: NotesPanelProps) {
  const owner = useAuthStore(state => state.user?.id ?? 'guest')
  const storage = accountStorageFor(owner)
  const key = storageKey ?? `ielts-note-${testId}`
  const [note, setNote] = useState('')
  const [error, setError] = useState(false)
  const input = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    const personal = accountStorageFor(owner)
    setNote(personal.getItem(key) ?? personal.getItem(`ielts-note-${testId}`) ?? '')
    setError(false)
  }, [owner, key, testId])
  useEffect(() => {
    if (!isOpen) return
    const before = document.activeElement as HTMLElement | null
    input.current?.focus()
    return () => { if (before?.isConnected) before.focus() }
  }, [isOpen])
  if (!isOpen) return null
  return <aside className="ielts-notes-panel" aria-label="Test notes" onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); onClose() } }}>
    <header><div><DocumentTextIcon className="h-5 w-5 text-red-600" /><h3>Test notes</h3><button type="button" aria-label="Close notes" onClick={onClose}><XMarkIcon className="h-5 w-5" /></button></div><p>Keep key clues and vocabulary here. Notes save as you type.</p></header>
    <textarea ref={input} aria-label="Your test notes" value={note} onChange={event => {
      const value = event.target.value
      setNote(value)
      try { storage.setItem(key, value); setError(false) } catch { setError(true) }
    }} placeholder="Write a note..." spellCheck={false} />
    <footer><span role="status">{error ? 'Could not save. Keep this page open.' : 'Saved on this device'}</span><span>{note.length} characters</span></footer>
  </aside>
}
