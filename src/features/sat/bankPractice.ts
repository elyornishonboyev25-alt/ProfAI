import { accountStorageFor } from '@/utils/accountStorage'
import { getSATReviewTests, satSourceModules, type SATTestDefinition } from './catalog'
import type { HighlightStroke, SATAttempt, SATModule, SATQuestion } from './practiceTest4'

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
  highlights?: HighlightStroke[]
  eliminatedChoices?: string[]
  /** Active seconds spent on the whole set; absent in older history. */
  seconds?: number
}
// Older sets have no highlights. Ignore malformed annotations without losing answers.
function readHighlights(value: unknown): HighlightStroke[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((stroke) => {
    const range = stroke?.textRange
    if (!stroke || typeof stroke.id !== 'string' || typeof stroke.color !== 'string' ||
      !range || typeof range.block !== 'string' || typeof range.text !== 'string' ||
      !Number.isInteger(range.start) || !Number.isInteger(range.end) ||
      range.start < 0 || range.end <= range.start || range.end - range.start !== range.text.length) return []
    return [{ id: stroke.id, color: stroke.color, width: 0, points: [],
      textRange: { block: range.block, start: range.start, end: range.end, text: range.text } }]
  })
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
            (row.flagged === undefined || typeof row.flagged === 'boolean') &&
            (row.seconds === undefined || (Number.isFinite(row.seconds) && row.seconds >= 0)),
          ),
        ).map((row) => ({ ...row, key: reviewQuestions.get(row.key)?.key ?? row.key,
          highlights: readHighlights(row.highlights) }))
      : []
  } catch {
    return []
  }
}
export const questionKey = (question: SATQuestion, testId: string) =>
  `${question.section}:${question.sourceQuestionId ?? `${testId.replace(/-(math|reading-writing)$/, '')}:${question.id}`}`
export const allQuestions: QuestionRow[] = (() => {
  const used = new Set<string>()
  return getSATReviewTests().filter(test => test.modules.length === 4)
    .sort((a, b) => a.mockId - b.mockId)
    .flatMap((test) =>
      satSourceModules(test).flatMap((module) =>
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
    satSourceModules(test).flatMap((module) =>
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
  questions?: Record<string, QuestionRow>
  id: string
  keys: string[]
  index: number
  answers: Record<string, string>
  flagged: string[]
  highlights: Record<string, HighlightStroke[]>
  eliminatedChoices?: Record<string, string[]>
  createdAt: string
  /** Active practice seconds, excluding time the page was hidden. */
  elapsedSeconds?: number
}
const sessionKey = (userId: string) => `profai:sat:question-bank:${userId}:active:v1`
const attemptedKey = (userId: string) => `profai:sat:question-bank:${userId}:attempted:v1`

// Keep answered questions attempted even when an unfinished set is replaced.
// Completed history remains separate so draft answers do not become past mistakes.
export function readAttemptedKeys(userId: string): Set<string> {
  const keys = new Set<string>()
  const add = (key: string) => keys.add(reviewQuestions.get(key)?.key ?? key)
  try {
    const data: unknown = JSON.parse(accountStorageFor(userId).getItem(attemptedKey(userId)) ?? '[]')
    if (Array.isArray(data)) data.forEach(key => { if (typeof key === 'string') add(key) })
  } catch { /* Saved session answers still count if the progress record is damaged. */ }
  const session = loadBankSession(userId)
  session?.keys.forEach(key => { if (session.answers[key]?.trim()) add(key) })
  return keys
}

export function loadBankSession(userId: string): BankSession | null {
  try {
    const data = JSON.parse(accountStorageFor(userId ?? 'guest').getItem(sessionKey(userId)) ?? 'null')
    if (!data || typeof data.id !== 'string' || !data.id ||
      typeof data.createdAt !== 'string' || !Number.isFinite(Date.parse(data.createdAt)) ||
      !Array.isArray(data.keys) || !data.keys.length || data.keys.length > 30 ||
      !data.keys.every((key: unknown) => typeof key === 'string' && (reviewQuestions.has(key) || data.questions?.[key]?.question?.id)) ||
      new Set(data.keys).size !== data.keys.length ||
      !Number.isInteger(data.index) || data.index < 0 || data.index >= data.keys.length ||
      !data.answers || typeof data.answers !== 'object' || Array.isArray(data.answers) ||
      !Object.entries(data.answers).every(([key, value]) => data.keys.includes(key) && typeof value === 'string') ||
      !Array.isArray(data.flagged) || !data.flagged.every((key: unknown) => data.keys.includes(key))) return null
    if (readHistory(userId).some((row) => row.setId === data.id)) return null
    const highlights = data.highlights && typeof data.highlights === 'object' && !Array.isArray(data.highlights)
      ? data.highlights : {}
    return { ...data, highlights: Object.fromEntries(
      data.keys.map((key: string) => [key, readHighlights(highlights[key])]),
    ) } as BankSession
  } catch {
    return null
  }
}
export function saveBankSession(userId: string, session: BankSession) {
  const attempted = readAttemptedKeys(userId)
  session.keys.forEach(key => {
    if (session.answers[key]?.trim()) attempted.add(reviewQuestions.get(key)?.key ?? key)
  })
  if (attempted.size) accountStorageFor(userId).setItem(attemptedKey(userId), JSON.stringify([...attempted]))
  accountStorageFor(userId ?? 'guest').setItem(sessionKey(userId), JSON.stringify({ ...session, questions: session.questions ?? Object.fromEntries(session.keys.flatMap(key => {
    const row = reviewQuestions.get(key)
    return row ? [[key, row]] : []
  })) }))
}
export function clearBankSession(userId: string, id: string) {
  if (loadBankSession(userId)?.id === id) accountStorageFor(userId ?? 'guest').removeItem(sessionKey(userId))
}

// A finished set opens in the same analysis screen as full SAT tests. Each
// bank key becomes the question id, so repeated catalog ids never collide.
export function bankSetReview(setId: string, results: Result[]): { test: SATTestDefinition; attempt: SATAttempt } | null {
  const items = results.flatMap((result) => {
    const row = reviewQuestions.get(result.key)
    return row ? [{ result, question: row.question }] : []
  })
  if (!items.length) return null
  const modules: SATModule[] = (['reading-writing', 'math'] as const).flatMap((section) => {
    const rows = items.filter((item) => item.question.section === section)
    if (!rows.length) return []
    const id = section === 'math' ? 'math1' as const : 'rw1' as const
    return [{
      id,
      section,
      title: section === 'math' ? 'Math questions' : 'Reading and Writing questions',
      shortTitle: section === 'math' ? 'Math' : 'Reading & Writing',
      durationSeconds: 0,
      questions: rows.map((item) => ({ ...item.question, id: item.result.key, moduleId: id, number: items.indexOf(item) + 1 })),
    }]
  })
  // Older history kept only correctness: a correct row matched the key, and a
  // missed one shows that its answer was not recorded instead of a blank skip.
  const answerOf = ({ result, question }: (typeof items)[number]) =>
    result.answer ?? (result.correct ? question.correctAnswer : 'Not recorded')
  const finishedAt = Date.parse(results[0].at)
  const seconds = results[0].seconds
  const startedAt = finishedAt - (seconds ?? 0) * 1000
  const id = `question-bank-${setId}`
  return {
    test: {
      mockId: 0,
      id,
      title: `${items.length}-question practice set`,
      subtitle: 'Question Bank',
      questionCount: items.length,
      totalDurationSeconds: 0,
      modules,
      badge: 'Question Bank',
      difficulty: 'Medium',
    },
    attempt: {
      version: 1,
      attemptId: id,
      testId: id,
      mode: 'practice',
      status: 'submitted',
      currentModuleIndex: 0,
      currentQuestionIndex: 0,
      answers: Object.fromEntries(items.map((item) => [item.result.key, answerOf(item)])),
      flagged: items.filter((item) => item.result.flagged).map((item) => item.result.key),
      notes: {},
      highlights: Object.fromEntries(items.map((item) => [item.result.key, item.result.highlights ?? []])),
      eliminatedChoices: Object.fromEntries(items.map((item) => [item.result.key, item.result.eliminatedChoices ?? []])),
      startedAt,
      updatedAt: finishedAt,
      submittedAt: finishedAt,
      moduleStartedAt: Object.fromEntries(modules.map((module) => [module.id, startedAt])),
      moduleDeadlines: {},
      ...(seconds === undefined ? {} : {
        moduleElapsedSeconds: Object.fromEntries(modules.map((module) => [
          module.id,
          Math.round((seconds * module.questions.length) / items.length),
        ])),
      }),
    },
  }
}
