import { readFile } from 'node:fs/promises'
import { prisma } from '../lib/prisma.js'
import { AiGenerationError } from './aiProvider.service.js'
import { studyReferenceSchema, type StudyReference, type StudyAttempt, type StudyTest } from './novaStudy.js'

let catalogPromise: Promise<StudyTest[]> | undefined
export function novaCatalog(): Promise<StudyTest[]> {
  return catalogPromise ??= readFile(new URL('../data/nova-catalog.json', import.meta.url), 'utf8')
    .catch(() => readFile(new URL('../../dist/data/nova-catalog.json', import.meta.url), 'utf8'))
    .then(raw => { const data = JSON.parse(raw); if (data.version !== 1 || !Array.isArray(data.tests)) throw new Error('Invalid catalog'); return data.tests as StudyTest[] })
    .catch(() => { catalogPromise = undefined; throw new AiGenerationError(503, 'STUDY_CATALOG_UNAVAILABLE', 'Build the Nova source catalog before starting the API.') })
}
export type AccountRow = { key: string; value: string | null }
const json = (value: string | null): any => { try { return JSON.parse(value ?? 'null') } catch { return null } }
export async function novaAccountRows(userId: string) {
  return prisma.accountLearningData.findMany({ where: { userId, OR: [
    { key: { startsWith: 'smarttest-reading-analysis-history-' } }, { key: { startsWith: 'smarttest-writing-analysis-' } },
    { key: { startsWith: 'profai:sat:' } }, { key: { startsWith: 'profai:speaking:' } },
    { key: { startsWith: 'profai:writing:' } }, { key: { startsWith: 'ielts:' } },
    { key: { startsWith: 'ielts_test_' } }, { key: { startsWith: 'smarttest-speaking-' } },
    { key: 'speaking-sessions' }, { key: { startsWith: 'smarttest:full-mock-' } },
  ] }, select: { key: true, value: true } })
}
/** Histories are account-owned synced records, not independent score verification. */
export function attemptsFromRows(rows: AccountRow[], userId: string): StudyAttempt[] {
  const found: StudyAttempt[] = []
  for (const row of rows) {
    const data = json(row.value)
    if (row.key === `smarttest-reading-analysis-history-v1:${userId}` && Array.isArray(data)) for (const entry of data) {
      if (!entry?.attemptKey || !entry?.testId || !entry?.resultPayload) continue
      const skill = /listening/i.test(`${entry.testId} ${entry.testTitle}`) ? 'listening' : 'reading'
      const questionStatuses: NonNullable<StudyAttempt['questionStatuses']> = {}
      if (Array.isArray(entry.questionResults)) for (const result of entry.questionResults) {
        if (typeof result?.questionId === 'string' && ['correct', 'incorrect', 'skipped'].includes(result.status)) questionStatuses[result.questionId] = result.status
      }
      // isPartial describes a completed subset of a paper, not an ongoing attempt.
      found.push({ id: entry.attemptKey, testId: entry.testId, skill, title: entry.testTitle, completedAt: entry.savedAt, completed: true, answers: entry.resultPayload.answers ?? {}, questionStatuses, provenance: 'account_sync' })
    }
    if (row.key === `smarttest-writing-analysis-v1:${userId}` && Array.isArray(data)) for (const entry of data) {
      if (!entry?.attemptKey || typeof entry.studentResponse !== 'string') continue
      found.push({ id: entry.attemptKey, testId: entry.testId, skill: 'writing', title: entry.testTitle, completedAt: entry.savedAt, completed: true, answers: {}, writing: entry.studentResponse, provenance: 'account_sync' })
    }
    if (row.key === 'profai:sat:attempt-history:v1' && Array.isArray(data)) for (const entry of data) {
      const a = entry?.attempt
      if (!a?.attemptId || !a.testId) continue
      for (const skill of ['sat-math', 'sat-rw'] as const) found.push({ id: a.attemptId, testId: a.testId, skill, title: a.testId, completedAt: new Date(entry.savedAt).toISOString(), completed: a.status === 'submitted', answers: a.answers ?? {}, provenance: 'account_sync' })
    }
    // Full examiner history is stored by the existing speaking account adapter.
    if (row.key === 'speaking-sessions' && Array.isArray(data)) for (const entry of data) {
      if (entry?.userId !== userId || !entry?.id || !entry.testId) continue
      found.push({ id: entry.attemptKey ?? entry.id, testId: entry.testId, skill: 'speaking', title: entry.modeLabel, completedAt: entry.date, completed: true, answers: {}, transcript: entry.transcript, speakingEvaluation: entry.evaluation, provenance: 'account_sync' })
    }
  }
  return found.sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt))
}
export function hasActiveExam(rows: AccountRow[]) {
  for (const row of rows) {
    const value = json(row.value)
    if (!value || typeof value !== 'object') continue
    if (row.key.startsWith('profai:sat:') && !row.key.includes('history') && value.status === 'active' && value.mode === 'exam') return true
    if (row.key.startsWith('ielts_test_session_') && !row.key.endsWith(':paper') && value.isTestActive && value.testMode !== 'practice' && value.testMode !== 'untimed') return true
    if (row.key.startsWith('ielts:full-mock:') && !value.finished && !value.completedAt && value.mode === 'exam') return true
  }
  const modes = json(rows.find(row => row.key === 'smarttest:full-mock-mode:v1')?.value ?? null)
  const progress = json(rows.find(row => row.key === 'smarttest:full-mock-progress:v1')?.value ?? null)
  if (modes && progress) for (const [id, mode] of Object.entries(modes)) {
    const completed = progress[id]
    if (mode === 'exam' && Array.isArray(completed) && completed.length > 0 && completed.length < 4) return true
  }
  const resumes = json(rows.find(row => row.key === 'ielts:active-attempts:v1')?.value ?? null)
  if (Array.isArray(resumes)) for (const resume of resumes) {
    const value = json(rows.find(row => row.key === resume.sessionKey)?.value ?? null)
    if (!value || value.finished || ['result', 'submitted', 'completed'].includes(value.phase)) continue
    // Existing timed runners have several session versions. Unknown active mode fails closed.
    if (value.testMode === 'practice' || value.testMode === 'untimed') continue
    if (value.timerEnabled !== false && value.mode !== 'practice' && value.launchMode !== 'practice') return true
  }
  return false
}
export async function getStudyContext(userId: string, input: unknown, pathname = '', dependencies = { rows: novaAccountRows, catalog: novaCatalog }) {
  const reference = studyReferenceSchema.parse(input)
  const [rows, catalog] = await Promise.all([dependencies.rows(userId), dependencies.catalog()])
  if (hasActiveExam(rows) || reference.mode === 'exam' || /^\/mock\/.*(?:\/run|\/\d+)/.test(pathname) || /^\/tests\/[^/]+\/attempt/.test(pathname)) throw new AiGenerationError(409, 'ACTIVE_EXAM', 'Coaching and answer evidence are unavailable while a timed attempt is active. Finish it before reviewing.')
  let attempt: StudyAttempt | undefined
  if (reference.attemptId) {
    attempt = attemptsFromRows(rows, userId).find(a => a.id === reference.attemptId && a.skill === reference.skill)
    if (!attempt) throw new AiGenerationError(404, 'ATTEMPT_NOT_FOUND', 'This attempt is not in your synced account history.')
    if (!attempt.completed) throw new AiGenerationError(409, 'ATTEMPT_NOT_COMPLETED', 'This attempt is unfinished; it cannot be analyzed as a completed result.')
    if (reference.testId && reference.testId !== attempt.testId) throw new AiGenerationError(409, 'ATTEMPT_TEST_MISMATCH', 'The attempt belongs to a different test.')
  }
  if (reference.mode === 'analyze' && !attempt) throw new AiGenerationError(403, 'OWNED_ATTEMPT_REQUIRED', 'Select your completed attempt for Analyze.')
  if (!['analyze', 'practice'].includes(reference.mode)) throw new AiGenerationError(403, 'STUDY_MODE_REQUIRED', 'Open completed Analyze or a separate Practice session.')
  const test = catalog.find(test => test.id === (attempt?.testId ?? reference.testId) && test.skill === reference.skill)
  if (!test) throw new AiGenerationError(404, 'TEST_NOT_FOUND', 'This source test is not in the current repository catalog.')
  const question = reference.questionId ? test.questions.find(q => q.id === reference.questionId) : test.questions[0]
  if (!question) throw new AiGenerationError(404, 'QUESTION_NOT_FOUND', 'This question does not belong to the selected source test.')
  const { answer, explanation, evidence, transcript, ...publicQuestion } = question
  return { reference: { ...reference, testId: test.id, questionId: question.id }, test: { id: test.id, title: test.title, skill: test.skill, route: test.route, questionIds: test.questions.map(q => q.id) },
    attempt: attempt ? { id: attempt.id, completedAt: attempt.completedAt, answers: attempt.answers, questionStatuses: attempt.questionStatuses ? Object.fromEntries(Object.entries(attempt.questionStatuses).filter(([id]) => test.questions.some(q => q.id === id))) : undefined, provenance: attempt.provenance, writing: attempt.writing, transcript: attempt.transcript, speakingEvaluation: attempt.speakingEvaluation } : undefined,
    question: { ...publicQuestion, userAnswer: attempt?.answers[question.id] },
    // Kept separate so progressive disclosure can omit it on the initial fetch.
    evidence: { answer, explanation, quotes: evidence ?? [], transcript, alignment: 'unavailable' as const },
  }
}
export function publicStudyContext(context: Awaited<ReturnType<typeof getStudyContext>>) {
  const { evidence: _evidence, ...rest } = context
  return rest
}
export async function assertNovaVoiceStudyAllowed(userId: string, context: { mode: string; studyReference?: StudyReference }) {
  if (context.mode === 'examiner') return
  if (context.studyReference?.mode === 'exam' || hasActiveExam(await novaAccountRows(userId))) throw new AiGenerationError(409, 'ACTIVE_EXAM', 'Live coaching is unavailable during an active timed attempt.')
}
