// Study-Abroad lesson completion (concept 23: path nodes with checkmarks).
// Dedicated key — never touches existing smarttest-* stores.

const STORAGE_KEY = 'profai-admission-lessons-v1'
const EVENT = 'profai:admission-lessons'

function read(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]') as unknown
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

export function getCompletedLessons(): Set<string> {
  return new Set(read())
}

export function isLessonCompleted(slug: string): boolean {
  return read().includes(slug)
}

export function toggleLessonCompleted(slug: string): boolean {
  const set = new Set(read())
  const nowCompleted = !set.has(slug)
  if (nowCompleted) set.add(slug)
  else set.delete(slug)
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)))
    window.dispatchEvent(new CustomEvent(EVENT))
  } catch {
    /* storage blocked — completion simply won't persist */
  }
  return nowCompleted
}

export function subscribeLessonProgress(callback: () => void): () => void {
  window.addEventListener(EVENT, callback)
  return () => window.removeEventListener(EVENT, callback)
}
