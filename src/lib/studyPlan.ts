import { apiClient } from '@/lib/apiClient'

export type StudySkill = 'IELTS_READING' | 'IELTS_LISTENING' | 'IELTS_WRITING' | 'IELTS_SPEAKING' | 'SAT_MATH' | 'SAT_READING_WRITING' | 'SAT_OVERALL'
export type StudyAnswers = {
  examTrack: 'IELTS' | 'SAT' | 'BOTH'
  ieltsExamDate: string | null
  satExamDate: string | null
  currentIeltsScore: number | null
  currentSatScore: number | null
  targetIeltsScore: number | null
  targetSatScore: number | null
  weeklyAvailability: number[]
}
export type StudyTask = {
  id: string
  contentKey: string
  title: string
  outcome: string
  route: string
  minutes: number
  category: 'IELTS' | 'SAT'
  skill: StudySkill | null
  kind: 'PRACTICE' | 'REVIEW' | 'ENRICHMENT'
  completionMode: 'ASSESSMENT' | 'MANUAL'
  status: 'TODO' | 'DONE'
  completedAt: string | null
  resultPercent?: number
  reviewOf?: string
}
export type StudyDay = { date: string; tasks: StudyTask[] }
export type StudyWeek = {
  id: string
  weekStart: string
  days: StudyDay[]
  review: { asOf: string; headline: string; reasons: string[]; focusSkill: StudySkill | null; previousCompleted: number; previousTotal: number }
}
export type StudyPlanResponse = {
  today: string
  timeZone: string
  defaults: StudyAnswers & { timeZone: string }
  evidence: Array<{ skill: StudySkill; attempts: number; accuracy: number | null }>
  plan: null | {
    id: string
    answers: StudyAnswers
    currentWeek: StudyWeek | null
    history: Array<{ id: string; weekStart: string; days: StudyDay[]; legacy: boolean }>
    summary: { completed: number; total: number }
    updatedAt: string
  }
}

export const studyPlanApi = {
  get: () => apiClient.get<StudyPlanResponse>('/study-plan'),
  save: (answers: StudyAnswers) => apiClient.put<StudyPlanResponse>('/study-plan', answers),
  complete: (taskId: string, completed: boolean) => apiClient.patch<StudyPlanResponse>(`/study-plan/tasks/${encodeURIComponent(taskId)}`, { completed }),
}

type ExactEntry = { sourceKey: string; contentKey: string; skill: StudySkill; title: string; accuracy: number; completedAt: string; skills?: Array<{ skill: string; correct: number; total: number }> }

export async function syncExactStudyEvidence(userId: string): Promise<void> {
  const [reading, writing, speaking, satStorage, satCatalog, satMath] = await Promise.all([
    import('@/utils/readingAnalysisStorage'),
    import('@/utils/writingAnalysisStorage'),
    import('@/utils/ieltsSpeakingCatalog'),
    import('@/features/sat/attemptStorage'),
    import('@/features/sat/catalog'),
    import('@/features/sat/practiceTest4'),
  ])
  const entries: ExactEntry[] = []
  const seen = new Set<string>()
  const push = (entry: ExactEntry) => { if (!seen.has(entry.sourceKey)) { seen.add(entry.sourceKey); entries.push(entry) } }
  for (const item of [...reading.getReadingAnalysisHistory(userId), ...reading.getReadingAnalysisHistory()]) {
    if (!item.totalQuestions || item.isPartial) continue
    const listening = item.testId.includes('listening') || item.testTitle.toLowerCase().includes('listening')
    push({ sourceKey: `reading:${item.attemptKey}`, contentKey: `ielts:${listening ? 'listening' : 'reading'}:${item.testId}`, skill: listening ? 'IELTS_LISTENING' : 'IELTS_READING', title: item.testTitle, accuracy: item.accuracy, completedAt: item.savedAt })
  }
  for (const item of [...writing.getWritingAnalysisHistory(userId), ...writing.getWritingAnalysisHistory()]) {
    push({ sourceKey: `writing:${item.attemptKey}`, contentKey: `ielts:writing:${item.testId}`, skill: 'IELTS_WRITING', title: item.testTitle, accuracy: Math.max(0, Math.min(100, item.overallBand / 9 * 100)), completedAt: item.savedAt })
  }
  for (const [id, completedAt] of Object.entries(speaking.getSpeakingCompletionDates(userId))) {
    if (!id.startsWith('speaking-day-')) continue
    push({ sourceKey: `speaking:${id}`, contentKey: `ielts:speaking:${id}`, skill: 'IELTS_SPEAKING', title: `Speaking ${id}`, accuracy: 100, completedAt })
  }
  const byId = new Map(satCatalog.getSATReviewTests().map(test => [test.id, test]))
  for (const { attempt } of satStorage.loadSATAttemptHistory()) {
    if (attempt.status !== 'submitted') continue
    const test = byId.get(attempt.testId)
    if (!test) continue
    const completedAt = new Date(attempt.submittedAt ?? attempt.updatedAt).toISOString()
    for (const section of new Set(test.modules.map(module => module.section))) {
      const skill: StudySkill = section === 'math' ? 'SAT_MATH' : 'SAT_READING_WRITING'
      const questions = test.modules.filter(module => module.section === section).flatMap(module => module.questions)
      const accuracy = Math.round(questions.filter(question => satMath.isSATAnswerCorrect(question, attempt.answers[question.id])).length / Math.max(1, questions.length) * 100)
      push({ sourceKey: `sat:${attempt.attemptId ?? `${attempt.testId}-${attempt.startedAt}`}:${section}`, contentKey: `sat:${section}:${test.mockId}`, skill, title: test.title, accuracy, completedAt })
    }
    if (new Set(test.modules.map(module => module.section)).size === 2) {
      const all = test.modules.flatMap(module => module.questions)
      const accuracy = Math.round(all.filter(question => satMath.isSATAnswerCorrect(question, attempt.answers[question.id])).length / Math.max(1, all.length) * 100)
      push({ sourceKey: `sat:${attempt.attemptId ?? `${attempt.testId}-${attempt.startedAt}`}:full`, contentKey: `sat:full:${test.mockId}`, skill: 'SAT_OVERALL', title: test.title, accuracy, completedAt })
    }
  }
  type BankRow = { section: string; skill: string; correct: boolean; at: string; planKey?: string }
  try {
    const rows = JSON.parse(window.localStorage.getItem(`profai:sat:question-bank:${userId}:v1`) ?? '[]') as BankRow[]
    const groups = new Map<string, BankRow[]>()
    if (Array.isArray(rows)) for (const row of rows) {
      if (!row || typeof row.at !== 'string' || !['math', 'reading-writing'].includes(row.section)) continue
      const key = `${row.at}:${row.section}`
      groups.set(key, [...(groups.get(key) ?? []), row])
    }
    for (const [key, group] of groups) {
      const section = group[0].section
      const bySkill = new Map<string, { skill: string; correct: number; total: number }>()
      for (const row of group) { const stats = bySkill.get(row.skill) ?? { skill: row.skill, correct: 0, total: 0 }; stats.total++; if (row.correct) stats.correct++; bySkill.set(row.skill, stats) }
      const planKey = rows.every(row => row.at !== group[0].at || row.section === section) && group[0].planKey?.startsWith(`sat:bank:${section}:`) ? group[0].planKey : null
      push({ sourceKey: `bank:${key}`, contentKey: planKey ?? `sat:bank:session:${section}:${group[0].at}`, skill: section === 'math' ? 'SAT_MATH' : 'SAT_READING_WRITING', title: `SAT Question Bank · ${group.length} questions`, accuracy: Math.round(group.filter(row => row.correct).length / group.length * 100), completedAt: group[0].at, skills: [...bySkill.values()] })
    }
  } catch { /* Existing exam results still sync if question bank history is unavailable. */ }
  const now = Date.now()
  const valid = entries.filter(entry => Number.isFinite(Date.parse(entry.completedAt)) && Date.parse(entry.completedAt) <= now + 86_400_000 && Date.parse(entry.completedAt) >= now - 3 * 365 * 86_400_000)
  for (let index = 0; index < valid.length; index += 100) await apiClient.post('/study-plan/evidence', { entries: valid.slice(index, index + 100) })
}
