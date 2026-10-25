import { accountStorageFor } from './accountStorage'

const KEY = 'ielts:active-attempts:v1'

function isUnfinishedSession(raw: string | null): boolean {
  if (!raw) return false
  try {
    const session = JSON.parse(raw)
    if (session.phase === 'result' && session.evaluation?.source === 'ai') return false
    if (session.phase === 'submitted') {
      if (session.evaluation) return false
      const taskIds = Object.keys(session.answers ?? {})
      if (taskIds.length && taskIds.every(id => session.evaluations?.[id])) return false
    }
    return true
  } catch { return false }
}
export type IeltsAttemptResume = {
  sessionKey: string
  title: string
  pathname: string
  search: string
  state: unknown
}

export function getIeltsAttemptResumes(owner: string): IeltsAttemptResume[] {
  try {
    const storage = accountStorageFor(owner)
    const saved: unknown = JSON.parse(storage.getItem(KEY) ?? '[]')
    if (!Array.isArray(saved)) return []
    return saved.filter((item): item is IeltsAttemptResume =>
      typeof item?.sessionKey === 'string' && typeof item.title === 'string'
      && typeof item.pathname === 'string' && /^\/(test\/(reading|listening)\/|ielts\/(writing|speaking)\/test\/)/.test(item.pathname)
      && isUnfinishedSession(storage.getItem(item.sessionKey)),
    )
  } catch { return [] }
}

export function saveIeltsAttemptResume(owner: string, attempt: IeltsAttemptResume) {
  const items = getIeltsAttemptResumes(owner).filter(item => item.sessionKey !== attempt.sessionKey)
  accountStorageFor(owner).setItem(KEY, JSON.stringify([attempt, ...items]))
}
