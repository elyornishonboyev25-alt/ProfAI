import { accountStorage } from '@/utils/accountStorage'
import { useState, useEffect } from 'react'
import { XMarkIcon, DocumentTextIcon } from '@heroicons/react/24/outline'

interface NotesPanelProps {
    testId: string
    isOpen: boolean
    onClose: () => void
}

export default function NotesPanel({ testId, isOpen, onClose }: NotesPanelProps) {
    const [note, setNote] = useState('')

    useEffect(() => {
        const savedNote = accountStorage.getItem(`ielts-note-${testId}`)
        if (savedNote) {
            setNote(savedNote)
        }
    }, [testId])

    const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newNote = e.target.value
        setNote(newNote)
        accountStorage.setItem(`ielts-note-${testId}`, newNote)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-y-0 right-0 z-50 flex w-80 transform flex-col border-l border-red-200 bg-white/95 shadow-[0_28px_48px_rgba(220,38,38,0.2)] backdrop-blur-sm transition-transform duration-300 ease-in-out">
            <div className="border-b border-red-100 bg-gradient-to-r from-red-50/90 to-rose-50/80 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-red-600">
                        <DocumentTextIcon className="h-5 w-5" />
                        <h3 className="font-semibold text-slate-900">Reading Notes</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-600"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>
                <p className="mt-2 text-xs text-slate-500">Auto-saved instantly. Use this for quick vocabulary and evidence notes.</p>
            </div>

            <div className="flex-1 bg-gradient-to-b from-white to-red-50/35 p-4">
                <textarea
                    value={note}
                    onChange={handleNoteChange}
                    placeholder="Write key clues, synonyms, and passage evidence..."
                    className="h-full w-full resize-none rounded-2xl border border-red-100 bg-white/90 p-3 text-sm leading-relaxed text-slate-800 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] outline-none placeholder:text-slate-400 focus:border-red-300 focus:ring-2 focus:ring-red-100"
                    spellCheck={false}
                />
            </div>

            <div className="border-t border-red-100 bg-white px-4 py-3">
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    <span>Saved</span>
                    <span>{note.length} chars</span>
                </div>
            </div>
        </div>
    )
}

