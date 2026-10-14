import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { readSATNotes, type SATNote } from '@/features/sat/notes'

export function SATNoteList({ value }: { value?: string | SATNote[] }) {
  const notes = readSATNotes(value)
  return <div className="space-y-2">
    {notes.map((note, index) => <article key={note.id} className="rounded-xl border border-violet-100 bg-violet-50 p-3">
      <p className="text-xs font-bold text-violet-700">Note {index + 1}</p>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{note.text}</p>
    </article>)}
    {!notes.length && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No notes yet. Add your reasoning, a formula, or a reminder for this question.</p>}
  </div>
}

export default function SATNotes({ value, onChange }: { value?: string | SATNote[]; onChange: (notes: SATNote[]) => void }) {
  const notes = readSATNotes(value)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [composing, setComposing] = useState(!notes.length)
  const save = () => {
    const text = draft.trim()
    if (!text) return
    onChange(editingId ? notes.map(note => note.id === editingId ? { ...note, text } : note) : [...notes, { id: crypto.randomUUID(), text }])
    setDraft('')
    setEditingId(null)
    setComposing(false)
  }
  return <div className="mt-4 space-y-3">
    <p className="text-xs font-semibold text-slate-500">{notes.length} saved {notes.length === 1 ? 'note' : 'notes'} · Saved with this question</p>
    {notes.map((note, index) => <article key={note.id} className="rounded-xl border border-violet-100 bg-violet-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-violet-700">Note {index + 1}</p>
        <div className="flex gap-1">
          <button type="button" aria-label={`Edit note ${index + 1}`} onClick={() => { setEditingId(note.id); setDraft(note.text); setComposing(true) }} className="rounded-lg p-2 text-slate-600 hover:bg-white"><Pencil className="h-4 w-4" /></button>
          <button type="button" aria-label={`Delete note ${index + 1}`} onClick={() => {
            onChange(notes.filter(item => item.id !== note.id))
            if (editingId === note.id) { setEditingId(null); setDraft(''); setComposing(false) }
          }} className="rounded-lg p-2 text-red-600 hover:bg-white"><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{note.text}</p>
    </article>)}
    {!composing && <button type="button" onClick={() => { setEditingId(null); setDraft(''); setComposing(true) }} className="flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-sm font-bold text-white"><Plus className="h-4 w-4" /> Add note</button>}
    {composing && <form onSubmit={event => { event.preventDefault(); save() }} className="rounded-xl border border-slate-200 p-3">
      <label htmlFor="sat-note-text" className="text-sm font-bold">{editingId ? 'Edit note' : 'New note'}</label>
      <textarea id="sat-note-text" autoFocus value={draft} onChange={event => setDraft(event.target.value)} placeholder="Write your reasoning, a formula, or a reminder…" className="mt-2 min-h-32 w-full resize-y rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm leading-6 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
      <div className="mt-2 flex justify-end gap-2">
        <button type="button" onClick={() => { setComposing(false); setEditingId(null); setDraft('') }} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button>
        <button type="submit" disabled={!draft.trim()} className="rounded-lg bg-black px-4 py-2 text-sm font-bold text-white disabled:opacity-40">Save note</button>
      </div>
    </form>}
  </div>
}
