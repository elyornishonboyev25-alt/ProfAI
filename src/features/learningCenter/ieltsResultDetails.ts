import type { IELTSTest, TestResult } from '@/types/ieltsTypes'
import type { ReadingAnalysisHistoryEntry } from '@/utils/readingAnalysisStorage'
import { calculateBandScore } from '@/utils/ieltsUtils'

export type IeltsClassPart = Pick<ReadingAnalysisHistoryEntry['sectionSummaries'][number], 'partNumber' | 'sectionTitle' | 'totalQuestions' | 'correctAnswers' | 'incorrectAnswers' | 'skippedAnswers'>

export function ieltsResultDetails(test: IELTSTest, result: TestResult, savedParts?: IeltsClassPart[]) {
  const source = result.detailedBreakdown?.readingAnalysis?.sectionSummaries ?? savedParts
  const parts = Array.isArray(source) ? source.filter(part => part && typeof part === 'object') : []
  const sectionSummaries = parts.map(({ partNumber, sectionTitle, totalQuestions, correctAnswers, incorrectAnswers, skippedAnswers }) => ({
    partNumber, sectionTitle: String(sectionTitle ?? '').slice(0, 180), totalQuestions, correctAnswers, incorrectAnswers, skippedAnswers,
  }))
  if (!sectionSummaries.length || sectionSummaries.some(part => !Number.isInteger(part.partNumber) || part.partNumber < 1 || part.partNumber > 4
    || ![part.totalQuestions, part.correctAnswers, part.incorrectAnswers, part.skippedAnswers].every(value => Number.isInteger(value) && value >= 0) || part.totalQuestions <= 0
    || part.correctAnswers + part.incorrectAnswers + part.skippedAnswers !== part.totalQuestions)
    || new Set(sectionSummaries.map(part => part.partNumber)).size !== sectionSummaries.length) return undefined
  const sum = (key: 'totalQuestions' | 'correctAnswers' | 'incorrectAnswers' | 'skippedAnswers') => sectionSummaries.reduce((total, part) => total + part[key], 0)
  if (sum('totalQuestions') !== result.totalQuestions || sum('correctAnswers') !== result.correctAnswers) return undefined
  const partial = Boolean(result.isPartial) || result.totalQuestions !== 40
  const skipped = sum('skippedAnswers')
  return { version: 1 as const, testId: test.id, partial, total: result.totalQuestions, correct: result.correctAnswers,
    incorrect: sum('incorrectAnswers'), skipped,
    ...(!partial ? { bandScore: calculateBandScore(result.correctAnswers, result.totalQuestions - skipped) } : {}), sectionSummaries }
}

export function ieltsDetailsSyncKey(type: 'reading' | 'listening', result: TestResult) {
  return `smarttest-ielts-class-breakdown:v1:${type}:${result.testId}-${result.date}`
}
