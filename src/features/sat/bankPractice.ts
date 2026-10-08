import { accountStorageFor } from '@/utils/accountStorage'
import { getSATReviewTests, SAT_TEST_CATALOG } from './catalog'
import type { SATQuestion } from './practiceTest4'

export type QuestionRow = { key: string; question: SATQuestion; testNumber: number }
export type Result = {
  key: string
  section: string
  domain: string
  skill: string
  correct: boolean
  at: string
  answer?: string
  setId?: string
  flagged?: boolean
}
export const difficulty = (value: SATQuestion['difficulty']) =>
  value === 'Foundation' ? 'Easy' : value === 'Advanced' ? 'Hard' : value
export const historyKey = (userId: string) => `profai:sat:question-bank:${userId}:v1`
export function readHistory(userId: string): Result[] {
  try {
    const data: unknown = JSON.parse(
      accountStorageFor(userId ?? 'guest').getItem(historyKey(userId)) ?? '[]',
    )
    return Array.isArray(data)
      ? data.filter((row): row is Result =>
          Boolean(
            row &&
            typeof row.key === 'string' &&
            typeof row.section === 'string' &&
            typeof row.domain === 'string' &&
            typeof row.skill === 'string' &&
            typeof row.correct === 'boolean' &&
            typeof row.at === 'string' &&
            Number.isFinite(Date.parse(row.at)) &&
            (row.answer === undefined || typeof row.answer === 'string') &&
            (row.setId === undefined || typeof row.setId === 'string') &&
            (row.flagged === undefined || typeof row.flagged === 'boolean'),
          ),
        ).map((row) => ({ ...row, key: reviewQuestions.get(row.key)?.key ?? row.key }))
      : []
  } catch {
    return []
  }
}
export const questionKey = (question: SATQuestion, testId: string) =>
  `${question.section}:${question.sourceQuestionId ?? `${testId.replace(/-(math|reading-writing)$/, '')}:${question.id}`}`
export const allQuestions: QuestionRow[] = (() => {
  const used = new Set<string>()
  return Object.values(SAT_TEST_CATALOG)
    .sort((a, b) => a.mockId - b.mockId)
    .flatMap((test) =>
      test.modules.flatMap((module) =>
        module.questions.flatMap((question) => {
          const key = questionKey(question, test.id)
          if (used.has(key)) return []
          used.add(key)
          return [{ key, question, testNumber: test.mockId }]
        }),
      ),
    )
})()
// Include retired catalog questions when reopening older practice sets.
export const reviewQuestions = new Map(
  getSATReviewTests().flatMap((test) =>
    test.modules.flatMap((module) =>
      module.questions.map(
        (question) =>
          [
            questionKey(question, test.id),
            { key: questionKey(question, test.id), question, testNumber: test.mockId },
          ] as const,
      ),
    ),
  ),
)
allQuestions.forEach((row) => reviewQuestions.set(row.key, row))
// Older bank sets used module positions as keys. They selected the first
// catalog occurrence, so preserve that exact question when reopening them.
allQuestions.forEach((row) => {
  const legacyKey = `${row.question.section}:${row.question.sourceQuestionId ?? row.question.id}`
  if (!reviewQuestions.has(legacyKey)) reviewQuestions.set(legacyKey, row)
})

export type BankSession = {
  id: string
  keys: string[]
  index: number
  answers: Record<string, string>
  flagged: string[]
  createdAt: string
}
const sessionKey = (userId: string) => `profai:sat:question-bank:${userId}:active:v1`
export function loadBankSession(userId: string): BankSession | null {
  try {
    const data = JSON.parse(accountStorageFor(userId ?? 'guest').getItem(sessionKey(userId)) ?? 'null')
    if (!data || typeof data.id !== 'string' || !data.id ||
      typeof data.createdAt !== 'string' || !Number.isFinite(Date.parse(data.createdAt)) ||
      !Array.isArray(data.keys) || !data.keys.length || data.keys.length > 30 ||
      !data.keys.every((key: unknown) => typeof key === 'string' && reviewQuestions.has(key)) ||
      new Set(data.keys).size !== data.keys.length ||
      !Number.isInteger(data.index) || data.index < 0 || data.index >= data.keys.length ||
      !data.answers || typeof data.answers !== 'object' || Array.isArray(data.answers) ||
      !Object.entries(data.answers).every(([key, value]) => data.keys.includes(key) && typeof value === 'string') ||
      !Array.isArray(data.flagged) || !data.flagged.every((key: unknown) => data.keys.includes(key))) return null
    if (readHistory(userId).some((row) => row.setId === data.id)) return null
    return data as BankSession
  } catch {
    return null
  }
}
export function saveBankSession(userId: string, session: BankSession) {
  accountStorageFor(userId ?? 'guest').setItem(sessionKey(userId), JSON.stringify(session))
}
export function clearBankSession(userId: string, id: string) {
  if (loadBankSession(userId)?.id === id) accountStorageFor(userId ?? 'guest').removeItem(sessionKey(userId))
}
