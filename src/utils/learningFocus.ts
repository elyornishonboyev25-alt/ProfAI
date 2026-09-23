export type LearningFocus = 'IELTS' | 'SAT' | 'APPLICATIONS' | 'EXPLORE'
export function loadLearningFocus(userId?: string): LearningFocus | null {
  try {
    const value = localStorage.getItem(`profai-focus:${userId || 'guest'}`)
    return value === 'IELTS' || value === 'SAT' || value === 'APPLICATIONS' || value === 'EXPLORE' ? value : null
  } catch { return null }
}
export function saveLearningFocus(focus: LearningFocus, userId?: string) {
  try { localStorage.setItem(`profai-focus:${userId || 'guest'}`, focus) } catch { /* Other account fields remain server-backed. */ }
}
