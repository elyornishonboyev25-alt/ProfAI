import type { ReadingAnalysisHistoryEntry } from './readingAnalysisStorage'
import type { WritingAnalysisEntry } from './writingAnalysisStorage'
import type { SpeakingSessionRecord } from '@/store/speakingStore'
import { accountStorageFor } from './accountStorage'
import { TOTAL_FULL_MOCKS, getFullMockResults, type FullMockSectionResult, type MockSectionKey } from './ieltsMockCatalog'

export type IeltsCatalogResult = {
  completed?: boolean
  band?: number
  progressLabel?: string
  scoreLabel?: string
}

const validBand = (band: unknown): band is number => typeof band === 'number' && Number.isFinite(band) && band >= 0 && band <= 9
const newest = <T,>(items: T[], date: (item: T) => string): T[] => [...items].sort((a, b) => Date.parse(date(b)) - Date.parse(date(a)))

/** Mock sections finish without visiting the standalone Results page. */
export function getCatalogMockResults(owner: string | undefined, skill: MockSectionKey): FullMockSectionResult[] {
  return Array.from({ length: TOTAL_FULL_MOCKS }, (_, index) => index + 1).flatMap(index => {
    const result = getFullMockResults(`full-mock-${index}`, owner ?? 'guest')[skill]
    return result ? [result] : []
  })
}

type ObjectiveAttempt = Pick<ReadingAnalysisHistoryEntry, 'testId' | 'savedAt' | 'isPartial' | 'bandScore' | 'correctAnswers' | 'totalQuestions' | 'sectionSummaries'>

export function objectiveCatalogResult(history: ObjectiveAttempt[], testId: string, partCount: number, partNumber?: number, mocks: FullMockSectionResult[] = []): IeltsCatalogResult {
  const attempts = newest([
    ...history.filter(entry => entry.testId === testId && entry.totalQuestions > 0),
    ...mocks.filter(entry => entry.testId === testId && entry.result && entry.result.totalQuestions > 0).map(entry => ({
      testId, savedAt: entry.completedAt, isPartial: Boolean(entry.result!.isPartial), bandScore: entry.band,
      correctAnswers: entry.result!.correctAnswers, totalQuestions: entry.result!.totalQuestions,
      sectionSummaries: entry.result!.detailedBreakdown?.readingAnalysis?.sectionSummaries ?? [],
    })),
  ], entry => entry.savedAt)
  const full = attempts.find(entry => !entry.isPartial)
  const parts = new Map<number, ObjectiveAttempt['sectionSummaries'][number]>()
  for (const entry of attempts) {
    for (const section of entry.sectionSummaries ?? []) {
      if (section.totalQuestions > 0 && section.partNumber >= 1 && section.partNumber <= partCount && !parts.has(section.partNumber)) parts.set(section.partNumber, section)
    }
  }
  if (partNumber) {
    const part = parts.get(partNumber)
    return part ? {
      completed: true,
      // Part practice is scored by correct answers, without a full-paper band.
      scoreLabel: `${part.correctAnswers}/${part.totalQuestions} correct`,
    } : { completed: Boolean(full) }
  }
  if (full) return { completed: true, band: validBand(full.bandScore) ? full.bandScore : undefined, scoreLabel: `${full.correctAnswers}/${full.totalQuestions} correct` }
  if (!parts.size) return {}
  const totals = [...parts.values()].reduce((sum, part) => ({ correct: sum.correct + part.correctAnswers, total: sum.total + part.totalQuestions }), { correct: 0, total: 0 })
  return { completed: false, progressLabel: `${parts.size}/${partCount} parts completed`, scoreLabel: `${totals.correct}/${totals.total} correct` }
}

export function writingCatalogResult(history: WritingAnalysisEntry[], test: { id: string; tasks: { id: string; taskType: string }[] }, taskId?: string, mocks: FullMockSectionResult[] = []): IeltsCatalogResult {
  const sorted = newest(history, entry => entry.savedAt)
  if (taskId) {
    const entry = sorted.find(item => item.testId === taskId)
    return entry ? { completed: true, band: validBand(entry.overallBand) ? entry.overallBand : undefined } : {}
  }
  const full = sorted.find(entry => entry.fullTest?.id === test.id && validBand(entry.fullTest.overallBand))
  const mock = newest(mocks.filter(entry => entry.testId === test.id), entry => entry.completedAt)[0]
  if (mock && (!full || Date.parse(mock.completedAt) > Date.parse(full.savedAt))) return { completed: true, band: mock.assessmentStatus !== 'pending' && validBand(mock.band) ? mock.band : undefined }
  if (full) return { completed: true, band: full.fullTest!.overallBand }
  const tasks = test.tasks.map(task => ({ task, entry: sorted.find(entry => entry.testId === task.id) })).filter(item => item.entry)
  if (test.tasks.length === 2 && tasks.length === 2 && tasks.every(item => validBand(item.entry!.overallBand))) {
    const weighted = tasks.reduce((sum, item) => {
      const entry = item.entry!
      const criteria = [entry.taskAchievement, entry.coherenceCohesion, entry.lexicalResource, entry.grammaticalRange]
      const mean = criteria.every(validBand) ? criteria.reduce((total, band) => total + band, 0) / 4 : entry.overallBand
      return sum + mean * (item.task.taskType === 'task2' ? 2 : 1)
    }, 0) / 3
    return { completed: true, band: Math.round(weighted * 2) / 2 }
  }
  return tasks.length ? { progressLabel: `${tasks.length}/${test.tasks.length} tasks completed` } : {}
}

export function speakingCatalogResult(sessions: SpeakingSessionRecord[], owner: string | undefined, test: { id: string; title: string }, mocks: FullMockSectionResult[] = []): IeltsCatalogResult {
  const session = newest(sessions.filter(entry => entry.userId === (owner ?? null) && entry.modeLabel === test.title), entry => entry.date)[0]
  const mock = newest(mocks.filter(entry => entry.testId === test.id), entry => entry.completedAt)[0]
  if (mock && (!session || Date.parse(mock.completedAt) > Date.parse(session.date))) return { completed: true, band: mock.assessmentStatus !== 'pending' && validBand(mock.band) ? mock.band : undefined }
  if (session) return { completed: true, band: (!session.evaluation || session.evaluation.source === 'ai') && validBand(session.overallBand) ? session.overallBand : undefined }
  // Daily attempts from older builds can exist before history recovery runs.
  try {
    const saved = JSON.parse(accountStorageFor(owner ?? 'guest').getItem(`profai:speaking:day:${test.id}`) ?? 'null')
    if (saved?.finished && saved.evaluation?.source === 'ai' && validBand(saved.evaluation.overallBand)) return { completed: true, band: saved.evaluation.overallBand }
  } catch { /* Other catalog cards remain available if an old attempt is damaged. */ }
  return {}
}
