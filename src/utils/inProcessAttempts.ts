import { accountStorageFor } from './accountStorage'
import { discardIeltsAttempt, getIeltsAttemptResumes, type IeltsAttemptResume } from './ieltsAttemptResume'
import { clearSATAttempt, loadSATAttempt, loadSATAttemptHistory, deleteSATAttemptHistoryEntry } from '@/features/sat/attemptStorage'
import { getSATReviewTests } from '@/features/sat/catalog'
import { clearBankSession, loadBankSession } from '@/features/sat/bankPractice'
import { fullMockLaunchState, getFullMockById, getFullMockCatalog, getFullMockCompletedSections, getFullMockPendingSection, FULL_MOCK_PROGRESS_STORAGE_KEY, FULL_MOCK_PROGRESS_EVENT } from './ieltsMockCatalog'

export type InProcessAttempt = {
  id: string; exam: 'IELTS' | 'SAT'; title: string; detail: string
  pathname: string; search?: string; state?: unknown; answered: number; total: number
  savedAt?: number; ielts?: IeltsAttemptResume; satId?: string; bankId?: string; mockId?: string
}

function parsed(owner: string, key: string) {
  try { return JSON.parse(accountStorageFor(owner).getItem(key) ?? '{}') ?? {} } catch { return {} }
}
function meaningful(value: unknown): boolean {
  if (typeof value === 'string') return !!value.trim()
  if (Array.isArray(value)) return value.some(meaningful)
  if (value && typeof value === 'object') {
    const answer = value as Record<string, unknown>
    return ['answer', 'spoken', 'transcript', 'text', 'response'].some(key => meaningful(answer[key])) || answer.recorded === true
  }
  return false
}
function ieltsMockId(attempt: IeltsAttemptResume): string | undefined {
  return (attempt.state as { mock?: { id?: string } } | null)?.mock?.id ?? new URLSearchParams(attempt.search).get('mock') ?? undefined
}

export function getInProcessAttempts(exam: 'IELTS' | 'SAT', owner: string): InProcessAttempt[] {
  if (exam === 'SAT') {
    const attempts: InProcessAttempt[] = getSATReviewTests().flatMap(test => {
      const attempt = loadSATAttempt(test.id)
      if (attempt?.status !== 'active') return []
      const section = test.modules.every(module => module.section === test.modules[0]?.section) ? test.modules[0]?.section : null
      return [{ id: `sat:${test.id}`, exam, title: test.title, detail: attempt.mode === 'exam' ? 'Exam mode · timer paused on exit' : 'Practice mode',
        pathname: `/sat/mock/${test.mockId}/run`, search: section ? `?section=${section}` : '',
        answered: Object.values(attempt.answers).filter(meaningful).length, total: test.questionCount,
        savedAt: attempt.updatedAt ?? attempt.startedAt, satId: test.id }]
    })
    const bank = loadBankSession(owner)
    if (bank) attempts.push({ id: `sat-bank:${bank.id}`, exam, title: 'Question Bank practice set', detail: 'Custom question set',
      pathname: `/sat/question-bank/run/${bank.id}`, answered: Object.values(bank.answers).filter(meaningful).length,
      total: bank.keys.length, savedAt: Date.parse(bank.createdAt), bankId: bank.id })
    return attempts.sort((a, b) => (b.savedAt ?? 0) - (a.savedAt ?? 0))
  }
  const resumes = getIeltsAttemptResumes(owner)
  const standalone: InProcessAttempt[] = resumes.filter(attempt => !ieltsMockId(attempt)).map(attempt => {
    const session = parsed(owner, attempt.sessionKey)
    const paper = parsed(owner, `${attempt.sessionKey}:paper`)
    const answered = Object.values(session.answers ?? (session.answer ? { answer: session.answer } : {})).filter(meaningful).length
    const total = paper.sections?.reduce((count: number, section: { questions?: unknown[] }) => count + (section.questions?.length ?? 0), 0)
      ?? paper.tasks?.length ?? (Array.isArray(session.answers) ? session.answers.length : session.answer !== undefined ? 1 : 0)
    return { id: attempt.sessionKey, exam, title: attempt.title, detail: attempt.pathname.includes('/writing/') ? 'Writing' : attempt.pathname.includes('/speaking/') ? 'Speaking' : attempt.pathname.includes('/listening/') ? 'Listening' : 'Reading',
      pathname: attempt.pathname, search: attempt.search, state: attempt.state, answered, total,
      savedAt: session.savedAt ?? session.startedAt, ielts: attempt }
  })
  // A mock remains one in-progress test, even between its four sections.
  for (const mock of getFullMockCatalog()) {
    const completed = getFullMockCompletedSections(mock.id)
    const active = resumes.find(attempt => ieltsMockId(attempt) === mock.id)
    if (completed.length === 4 || (!completed.length && !active)) continue
    const next = getFullMockPendingSection(mock.id)
    standalone.push({ id: `ielts-mock:${mock.id}`, exam, title: mock.title, detail: `${completed.length} of 4 sections completed${next ? ` · Next: ${next.title}` : ''}`,
      pathname: active?.pathname ?? next?.launchPath ?? `/mock/ielts/${mock.id}`, search: active?.search ?? `?mock=${mock.id}`,
      state: active?.state ?? (next ? fullMockLaunchState(mock.id, next.key) : undefined),
      answered: completed.length, total: 4, mockId: mock.id, ielts: active })
  }
  return standalone
}

export async function discardInProcessAttempt(owner: string, attempt: InProcessAttempt) {
  if (attempt.mockId) {
    for (const saved of getIeltsAttemptResumes(owner).filter(item => ieltsMockId(item) === attempt.mockId)) await discardIeltsAttempt(owner, saved.sessionKey)
    // Completed sections can retain submitted checkpoints outside the active registry.
    // Remove those checkpoints too, so a new mock cannot restore the previous essay/audio.
    for (const section of getFullMockById(attempt.mockId)?.sections ?? []) {
      const testId = section.launchPath?.split('/').pop()
      if (!testId) continue
      const key = section.key === 'writing' ? `profai:writing:draft:${owner}:${testId}:mock:${attempt.mockId}:session`
        : section.key === 'speaking' ? `profai:speaking:examiner:test:${testId}:mock:${attempt.mockId}`
          : `ielts_test_session_${testId}:mock:${attempt.mockId}`
      await discardIeltsAttempt(owner, key)
    }
    const storage = accountStorageFor(owner)
    for (const key of [FULL_MOCK_PROGRESS_STORAGE_KEY, 'smarttest:full-mock-results:v1']) {
      const data = parsed(owner, key); delete data[attempt.mockId]; storage.setItem(key, JSON.stringify(data))
    }
    for (const section of ['listening', 'reading', 'writing', 'speaking']) storage.removeItem(`profai:full-mock:intro:v1:${attempt.mockId}:${section}`)
    window.dispatchEvent(new CustomEvent(FULL_MOCK_PROGRESS_EVENT))
  } else if (attempt.ielts) await discardIeltsAttempt(owner, attempt.ielts.sessionKey)
  if (attempt.satId) {
    const saved = loadSATAttempt(attempt.satId)
    if (saved?.status === 'active') {
      clearSATAttempt(attempt.satId)
      // Exit snapshots belong to the draft; submitted result history stays intact.
      if (loadSATAttemptHistory().find(entry => entry.id === saved.attemptId)?.attempt.status === 'active') deleteSATAttemptHistoryEntry(saved.attemptId)
      accountStorageFor(owner).removeItem(`profai:sat:${attempt.satId}:attempt:v1:paper`)
    }
  }
  if (attempt.bankId) clearBankSession(owner, attempt.bankId)
}
