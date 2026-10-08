import { accountStorageFor } from '@/utils/accountStorage'
export type LearningFocus = 'IELTS' | 'SAT' | 'APPLICATIONS' | 'EXPLORE'
export function loadLearningFocus(userId?: string): LearningFocus | null {
  try {
    const value = accountStorageFor(userId ?? 'guest').getItem(`profai-focus:${userId || 'guest'}`)
    return value === 'IELTS' || value === 'SAT' || value === 'APPLICATIONS' || value === 'EXPLORE' ? value : null
  } catch { return null }
}
export function saveLearningFocus(focus: LearningFocus, userId?: string) {
  try { accountStorageFor(userId ?? 'guest').setItem(`profai-focus:${userId || 'guest'}`, focus) } catch { /* Other account fields remain server-backed. */ }
}
