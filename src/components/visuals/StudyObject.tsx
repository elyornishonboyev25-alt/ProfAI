import type { CSSProperties } from 'react'

export type StudyObjectKind = 'headphones' | 'book' | 'microphone' | 'calculator' | 'notebook' | 'globe'
const positions: Record<StudyObjectKind, string> = {
  headphones: '0% 0%', book: '50% 0%', microphone: '100% 0%',
  calculator: '0% 100%', notebook: '50% 100%', globe: '100% 100%',
}

/** Decorative product illustration; UI labels carry the accessible meaning. */
export default function StudyObject({ kind, className = '' }: { kind: StudyObjectKind; className?: string }) {
  return <span aria-hidden="true" className={`study-object ${className}`} style={{ '--object-position': positions[kind] } as CSSProperties} />
}
