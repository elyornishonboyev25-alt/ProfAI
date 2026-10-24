export type SATNote = { id: string; text: string }

// Older attempts stored one string per question. Keep those notes readable.
export function readSATNotes(value?: string | SATNote[]): SATNote[] {
  if (typeof value === 'string') return value.trim() ? [{ id: 'legacy', text: value }] : []
  return Array.isArray(value) ? value.filter(note => note && typeof note.id === 'string' && typeof note.text === 'string' && note.text.trim()) : []
}
