import { fetchAccount, updateAccount } from '@/lib/profileApi'
import { useAuthStore } from '@/store/authStore'
import { loadOnboardingProfile, saveOnboardingProfile } from '@/utils/weeklyPlanner'
import { isSATTestComplete, type SATTestDefinition } from './catalog'
import { scoreSATModules, type SATAttempt } from './practiceTest4'

const pending = new Map<string, Promise<void>>()

/** Set an unknown current score after an explicitly requested full diagnostic. */
export async function saveSATBaseline(userId: string, test: SATTestDefinition, attempt: SATAttempt): Promise<void> {
  if (attempt.status !== 'submitted' || !isSATTestComplete(test) ||
    !test.modules.some(module => module.section === 'math') ||
    !test.modules.some(module => module.section === 'reading-writing') ||
    attempt.testId !== test.id || useAuthStore.getState().user?.id !== userId) return
  const key = `${userId}:${attempt.attemptId}`
  const existing = pending.get(key)
  if (existing) return existing
  const request = (async () => {
    const account = await fetchAccount()
    if (useAuthStore.getState().user?.id !== userId) return
    const score = account.profile.currentSatScore ?? scoreSATModules(test.modules, attempt.answers).midpoint
    if (account.profile.currentSatScore === null) await updateAccount({ currentSatScore: score })
    if (useAuthStore.getState().user?.id !== userId) return
    const local = loadOnboardingProfile(userId)
    if (local) saveOnboardingProfile({ ...local, currentSatScore: score }, userId)
  })().finally(() => pending.delete(key))
  pending.set(key, request)
  return request
}
