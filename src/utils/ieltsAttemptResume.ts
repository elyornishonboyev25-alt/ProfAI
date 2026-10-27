import { accountStorageFor } from './accountStorage'
import { deleteTestAudioPrefix } from './testAudioStorage'

const KEY = 'ielts:active-attempts:v1'

function isUnfinishedSession(raw: string | null): boolean {
  if (!raw) return false
  try {
    const session = JSON.parse(raw)
    if (session.finished === true) return false
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

export async function discardIeltsAttempt(owner: string, sessionKey: string) {
  const storage = accountStorageFor(owner)
  const attempts = getIeltsAttemptResumes(owner)
  const attempt = attempts.find(item => item.sessionKey === sessionKey)
  if (!attempt) return
  let session: { audioKey?: string } = {}
  let paper: { sections?: { id: string }[] } = {}
  try { session = JSON.parse(storage.getItem(sessionKey) ?? '{}') ?? {} } catch { /* Malformed draft. */ }
  try { paper = JSON.parse(storage.getItem(`${sessionKey}:paper`) ?? '{}') ?? {} } catch { /* Optional paper cache. */ }
  for (const section of Array.isArray(paper.sections) ? paper.sections : []) {
    if (typeof section?.id !== 'string') continue
    storage.removeItem(`${sessionKey}:annotations:${section.id}`)
    storage.removeItem(`${sessionKey}:annotations:${section.id}:scroll`)
  }
  if (sessionKey.startsWith('profai:writing:draft:') && sessionKey.endsWith(':session')) storage.removeItem(sessionKey.slice(0, -8))
  if (sessionKey.startsWith('profai:speaking:examiner:test:')) {
    storage.removeItem(sessionKey.replace('profai:speaking:examiner:test:', 'profai:speaking:launch:'))
  }
  if (storage.getItem('ielts_test_route_reading_random') === sessionKey) storage.removeItem('ielts_test_route_reading_random')
  storage.removeItem(sessionKey)
  storage.removeItem(`${sessionKey}:paper`)
  storage.setItem(KEY, JSON.stringify(attempts.filter(item => item.sessionKey !== sessionKey)))
  if (typeof session.audioKey === 'string') await deleteTestAudioPrefix(owner, `${session.audioKey}:`)
}
