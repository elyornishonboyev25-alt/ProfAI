import { accountStorageFor } from '@/utils/accountStorage'
import type { ReadingQuestionResult, ReadingSectionSummary } from '../types/ieltsTypes'
import type { TestResult } from '../types/ieltsTypes'

const HISTORY_VERSION = 'v1'
const ENTRY_LIMIT = 30

export interface ReadingFocusAreaSnapshot {
  label: string
  incorrectAnswers: number
  accuracy: number
}

export interface ReadingIncorrectQuestionSnapshot {
  questionId: string
  displayNumber: string
  partNumber: number
  prompt: string
  paragraphLabel?: string
  location?: string
  typeLabel: string
}

export interface ReadingAnalysisHistoryEntry {
  attemptKey: string
  savedAt: string
  testId: string
  testTitle: string
  score: number
  bandScore: number
  isPartial: boolean
  accuracy: number
  correctAnswers: number
  totalQuestions: number
  incorrectAnswers: number
  skippedAnswers: number
  timeSpent: number
  sectionSummaries: Array<{
    partNumber: number
    sectionTitle: string
    correctAnswers: number
    totalQuestions: number
    incorrectAnswers: number
    skippedAnswers: number
    accuracy: number
  }>
  focusAreas: ReadingFocusAreaSnapshot[]
  incorrectQuestions: ReadingIncorrectQuestionSnapshot[]
  questionResults: ReadingQuestionResult[]
  resultPayload: TestResult
}

export interface SaveReadingHistoryInput {
  userId?: string
  attemptKey: string
  savedAt: string
  testId: string
  testTitle: string
  score: number
  bandScore: number
  isPartial: boolean
  accuracy: number
  correctAnswers: number
  totalQuestions: number
  incorrectAnswers: number
  skippedAnswers: number
  timeSpent: number
  sectionSummaries: ReadingSectionSummary[]
  focusAreas: ReadingFocusAreaSnapshot[]
  incorrectQuestions: ReadingIncorrectQuestionSnapshot[]
  questionResults: ReadingQuestionResult[]
  resultPayload: TestResult
}

function getStorageKey(userId?: string): string {
  const owner = userId?.trim() ? userId.trim() : 'guest'
  return `smarttest-reading-analysis-history-${HISTORY_VERSION}:${owner}`
}

function safeParseHistory(value: string | null): ReadingAnalysisHistoryEntry[] {
  if (!value) return []

  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((entry) => typeof entry?.attemptKey === 'string')
      .map((entry) => ({
        ...entry,
        bandScore: typeof entry.bandScore === 'number' ? entry.bandScore : entry.score ?? 0,
        questionResults: Array.isArray(entry.questionResults) ? entry.questionResults : [],
        resultPayload: entry.resultPayload ?? {
          testId: entry.testId,
          date: entry.savedAt,
          score: entry.score ?? 0,
          correctAnswers: entry.correctAnswers ?? 0,
          totalQuestions: entry.totalQuestions ?? 0,
          timeSpent: entry.timeSpent ?? 0,
          answers: {},
          isPartial: entry.isPartial ?? true,
          detailedBreakdown: {
            activeSectionIds: [],
          },
        },
      }))
  } catch {
    return []
  }
}

export function getReadingAnalysisHistory(userId?: string): ReadingAnalysisHistoryEntry[] {
  if (typeof window === 'undefined') return []
  const storageKey = getStorageKey(userId)
  return safeParseHistory(accountStorageFor(userId ?? 'guest').getItem(storageKey))
}

export function saveReadingAnalysisHistory(input: SaveReadingHistoryInput): void {
  if (typeof window === 'undefined') return

  const storageKey = getStorageKey(input.userId)
  const current = safeParseHistory(accountStorageFor(input.userId ?? 'guest').getItem(storageKey))
  const withoutSameAttempt = current.filter((entry) => entry.attemptKey !== input.attemptKey)

  const nextEntry: ReadingAnalysisHistoryEntry = {
    attemptKey: input.attemptKey,
    savedAt: input.savedAt,
    testId: input.testId,
    testTitle: input.testTitle,
    score: input.score,
    bandScore: input.bandScore,
    isPartial: input.isPartial,
    accuracy: input.accuracy,
    correctAnswers: input.correctAnswers,
    totalQuestions: input.totalQuestions,
    incorrectAnswers: input.incorrectAnswers,
    skippedAnswers: input.skippedAnswers,
    timeSpent: input.timeSpent,
    sectionSummaries: input.sectionSummaries.map((section) => ({
      partNumber: section.partNumber,
      sectionTitle: section.sectionTitle,
      correctAnswers: section.correctAnswers,
      totalQuestions: section.totalQuestions,
      incorrectAnswers: section.incorrectAnswers,
      skippedAnswers: section.skippedAnswers,
      accuracy: section.accuracy,
    })),
    focusAreas: input.focusAreas.slice(0, 4),
    incorrectQuestions: input.incorrectQuestions.slice(0, 16),
    questionResults: input.questionResults,
    resultPayload: input.resultPayload,
  }

  const merged = [nextEntry, ...withoutSameAttempt]
    .sort(
      (a, b) =>
        new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
    )
    .slice(0, ENTRY_LIMIT)

  accountStorageFor(input.userId ?? 'guest').setItem(storageKey, JSON.stringify(merged))
}

export function clearReadingAnalysisHistory(userId?: string): void {
  if (typeof window === 'undefined') return
  accountStorageFor(userId ?? 'guest').removeItem(getStorageKey(userId))
}

export function removeReadingAnalysisAttempt(attemptKey: string, userId?: string): ReadingAnalysisHistoryEntry[] {
  if (typeof window === 'undefined') return []
  const normalizedKey = attemptKey.trim()
  if (!normalizedKey) return getReadingAnalysisHistory(userId)

  const storageKey = getStorageKey(userId)
  const current = safeParseHistory(accountStorageFor(userId ?? 'guest').getItem(storageKey))
  const next = current.filter((entry) => entry.attemptKey !== normalizedKey)
  accountStorageFor(userId ?? 'guest').setItem(storageKey, JSON.stringify(next))
  return next
}

