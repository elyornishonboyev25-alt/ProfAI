import { getSATReviewTests, isSATTestComplete, type SATTestDefinition } from '@/features/sat/catalog'
import { loadSATAttemptHistory } from '@/features/sat/attemptStorage'
import { scoreSATModules } from '@/features/sat/practiceTest4'
import type { SpeakingSessionRecord } from '@/store/speakingStore'
import type { TestResult } from '@/types/ieltsTypes'
import type { ProfileOverview } from '@/types/platform'
import { resolveIeltsTestById } from '@/utils/ieltsTestCatalog'
import { getReadingAnalysisHistory } from '@/utils/readingAnalysisStorage'
import { getWritingAnalysisHistory, type WritingAnalysisEntry } from '@/utils/writingAnalysisStorage'

export type ResultExam = 'IELTS' | 'SAT'
export type ResultSkill = 'reading' | 'listening' | 'writing' | 'speaking' | 'sat'
export type ResultTone = 'high' | 'mid' | 'low'

export type ResultAnalyzeTarget =
  | { type: 'ielts-result'; testId: string; result: TestResult }
  | { type: 'writing'; entry: WritingAnalysisEntry }
  | { type: 'speaking'; entry: SpeakingSessionRecord }
  | { type: 'sat'; attemptId: string }

export type ResultRecord = {
  id: string
  /** 1 = the learner's first saved result; assigned in chronological order. */
  sequence: number
  exam: ResultExam
  skill: ResultSkill
  skillLabel: string
  title: string
  completedAt: number
  durationSec: number | null
  /** Native exam score as shown on the official scale (band, SAT points). */
  score: { value: string; label: string } | null
  /** Score position on its own scale, 0–1, used only for colour tone. */
  scoreRatio: number | null
  tone: ResultTone
  stats: Array<{ label: string; value: string; emphasis?: 'good' | 'bad' }>
  partial: boolean
  analyze: ResultAnalyzeTarget | null
}

type UnsequencedRecord = Omit<ResultRecord, 'sequence'>

const SAT_TESTS_BY_ID = new Map<string, SATTestDefinition>()

function satTestById(id: string) {
  if (!SAT_TESTS_BY_ID.size) getSATReviewTests().forEach((test) => SAT_TESTS_BY_ID.set(test.id, test))
  return SAT_TESTS_BY_ID.get(id)
}

function safeRead<T>(reader: () => T[]): T[] {
  try {
    return reader()
  } catch {
    return []
  }
}

function toneFor(ratio: number | null): ResultTone {
  if (ratio === null) return 'mid'
  if (ratio >= 0.75) return 'high'
  if (ratio >= 0.55) return 'mid'
  return 'low'
}

function band(value: number) {
  return Number.isFinite(value) ? value.toFixed(1) : '—'
}

function timeOf(value: string | number) {
  const time = typeof value === 'number' ? value : new Date(value).getTime()
  return Number.isFinite(time) ? time : 0
}

function readingRecords(userId: string): UnsequencedRecord[] {
  return safeRead(() => getReadingAnalysisHistory(userId))
    .filter((entry) => entry.totalQuestions > 0)
    .map((entry) => {
      const test = resolveIeltsTestById(entry.testId, entry.resultPayload)
      const isListening = test?.module === 'Listening' || `${entry.testId} ${entry.testTitle}`.toLowerCase().includes('listening')
      const ratio = entry.isPartial ? null : entry.bandScore / 9
      return {
        id: `reading-${entry.attemptKey}`,
        exam: 'IELTS',
        skill: isListening ? 'listening' : 'reading',
        skillLabel: isListening ? 'Listening' : 'Reading',
        title: entry.testTitle,
        completedAt: timeOf(entry.savedAt),
        durationSec: entry.timeSpent > 0 ? Math.round(entry.timeSpent) : null,
        score: entry.isPartial ? null : { value: band(entry.bandScore), label: 'Band' },
        scoreRatio: ratio,
        tone: toneFor(ratio),
        stats: [
          { label: 'Correct', value: `${entry.correctAnswers}/${entry.totalQuestions}`, emphasis: 'good' },
          { label: 'Mistakes', value: String(entry.incorrectAnswers), emphasis: entry.incorrectAnswers ? 'bad' : undefined },
          { label: 'Skipped', value: String(entry.skippedAnswers) },
        ],
        partial: entry.isPartial,
        analyze: test ? { type: 'ielts-result', testId: entry.testId, result: entry.resultPayload } : null,
      }
    })
}

function writingRecords(userId: string): UnsequencedRecord[] {
  return safeRead(() => getWritingAnalysisHistory(userId)).map((entry) => {
    const ratio = entry.overallBand / 9
    return {
      id: `writing-${entry.attemptKey}`,
      exam: 'IELTS',
      skill: 'writing',
      skillLabel: entry.taskType === 'task1' ? 'Writing · Task 1' : 'Writing · Task 2',
      title: entry.testTitle,
      completedAt: timeOf(entry.savedAt),
      durationSec: entry.timeSpent > 0 ? Math.round(entry.timeSpent) : null,
      score: { value: band(entry.overallBand), label: 'Band' },
      scoreRatio: ratio,
      tone: toneFor(ratio),
      stats: [
        { label: 'TA', value: band(entry.taskAchievement) },
        { label: 'CC', value: band(entry.coherenceCohesion) },
        { label: 'LR', value: band(entry.lexicalResource) },
        { label: 'GRA', value: band(entry.grammaticalRange) },
        { label: 'Words', value: String(entry.wordCount) },
      ],
      partial: false,
      analyze: { type: 'writing', entry },
    }
  })
}

function speakingRecords(userId: string, sessions: SpeakingSessionRecord[]): UnsequencedRecord[] {
  return sessions
    .filter((session) => session.userId === userId && session.kind === 'examiner')
    .map((session) => {
      const ratio = session.overallBand / 9
      return {
        id: `speaking-${session.id}`,
        exam: 'IELTS',
        skill: 'speaking',
        skillLabel: 'Speaking',
        title: session.modeLabel,
        completedAt: timeOf(session.date),
        durationSec: session.durationSec > 0 ? Math.round(session.durationSec) : null,
        score: { value: band(session.overallBand), label: 'Band' },
        scoreRatio: ratio,
        tone: toneFor(ratio),
        stats: [
          { label: 'FC', value: band(session.fluencyBand) },
          { label: 'LR', value: band(session.lexicalBand) },
          { label: 'GRA', value: band(session.grammarBand) },
          { label: 'P', value: band(session.pronunciationBand) },
        ],
        partial: false,
        analyze: session.evaluation ? { type: 'speaking', entry: session } : null,
      }
    })
}

function satRecords(): UnsequencedRecord[] {
  return safeRead(() => loadSATAttemptHistory())
    .filter((entry) => entry.attempt.status === 'submitted')
    .flatMap((entry) => {
      const test = satTestById(entry.attempt.testId)
      if (!test) return []
      const report = scoreSATModules(test.modules, entry.attempt.answers)
      const sections = new Set(test.modules.map((module) => module.section))
      const onlyMath = sections.size === 1 && sections.has('math')
      const onlyReadingWriting = sections.size === 1 && sections.has('reading-writing')
      const scored = isSATTestComplete(test)
      const range = onlyMath ? report.mathRange : onlyReadingWriting ? report.readingWritingRange : report.totalRange
      const points = Math.round((range[0] + range[1]) / 20) * 10
      const max = onlyMath || onlyReadingWriting ? 800 : 1600
      const ratio = scored ? points / max : report.percent / 100
      const endedAt = entry.attempt.submittedAt ?? entry.attempt.updatedAt ?? entry.savedAt
      const activeSeconds = Object.values(entry.attempt.moduleElapsedSeconds ?? {}).reduce((total, value) => total + (value || 0), 0)
      const elapsed = activeSeconds > 0
        ? activeSeconds
        : Math.min(test.totalDurationSeconds, Math.max(0, Math.round((endedAt - entry.attempt.startedAt) / 1000)))
      const total = report.correct + report.incorrect + report.unanswered
      const isQuestionBank = test.id.startsWith('question-bank')
      return [{
        id: `sat-${entry.id}`,
        exam: 'SAT' as const,
        skill: 'sat' as const,
        skillLabel: isQuestionBank
          ? 'Question Bank'
          : onlyMath ? 'Math' : onlyReadingWriting ? 'Reading & Writing' : 'Full test',
        title: test.title,
        completedAt: endedAt,
        durationSec: elapsed > 0 ? elapsed : null,
        score: scored
          ? { value: String(points), label: onlyMath ? 'Math' : onlyReadingWriting ? 'R&W' : 'SAT score' }
          : null,
        scoreRatio: ratio,
        tone: toneFor(ratio),
        stats: [
          { label: 'Correct', value: `${report.correct}/${total}`, emphasis: 'good' as const },
          { label: 'Mistakes', value: String(report.incorrect), emphasis: report.incorrect ? 'bad' as const : undefined },
          { label: 'Skipped', value: String(report.unanswered) },
          ...(!onlyMath && !onlyReadingWriting && scored
            ? [
                { label: 'R&W', value: String(Math.round((report.readingWritingRange[0] + report.readingWritingRange[1]) / 20) * 10) },
                { label: 'Math', value: String(Math.round((report.mathRange[0] + report.mathRange[1]) / 20) * 10) },
              ]
            : []),
        ],
        partial: false,
        analyze: { type: 'sat' as const, attemptId: entry.id },
      }]
    })
}

/** Server results recorded on another device; local records carry the full review data. */
function serverRecords(
  attempts: ProfileOverview['recentAttempts'],
  local: UnsequencedRecord[],
): UnsequencedRecord[] {
  return attempts
    .filter((attempt) => {
      const exam: ResultExam = attempt.test.category === 'SAT' ? 'SAT' : 'IELTS'
      const time = timeOf(attempt.completedAt)
      return !local.some((record) => record.exam === exam && Math.abs(record.completedAt - time) <= 180_000)
    })
    .map((attempt) => {
      const exam: ResultExam = attempt.test.category === 'SAT' ? 'SAT' : 'IELTS'
      const title = attempt.test.title
      const lower = title.toLowerCase()
      const skill: ResultSkill = exam === 'SAT'
        ? 'sat'
        : lower.includes('listening') ? 'listening'
          : lower.includes('writing') ? 'writing'
            : lower.includes('speaking') ? 'speaking'
              : 'reading'
      const ratio = Math.min(1, Math.max(0, attempt.percentage / 100))
      return {
        id: `server-${attempt.id}`,
        exam,
        skill,
        skillLabel: exam === 'SAT' ? 'Practice' : skill[0].toUpperCase() + skill.slice(1),
        title,
        completedAt: timeOf(attempt.completedAt),
        durationSec: null,
        score: null,
        scoreRatio: ratio,
        tone: toneFor(ratio),
        stats: [{ label: 'Correct', value: `${Math.round(attempt.percentage)}%`, emphasis: 'good' as const }],
        partial: false,
        analyze: null,
      }
    })
}

export function getResultsHistory(
  userId: string | undefined,
  speakingSessions: SpeakingSessionRecord[],
  serverAttempts: ProfileOverview['recentAttempts'] = [],
): ResultRecord[] {
  if (!userId || typeof window === 'undefined') return []
  const local = [
    ...readingRecords(userId),
    ...writingRecords(userId),
    ...speakingRecords(userId, speakingSessions),
    ...satRecords(),
  ]
  const unique = [...new Map([...local, ...serverRecords(serverAttempts, local)].map((record) => [record.id, record])).values()]
  return unique
    .sort((left, right) => left.completedAt - right.completedAt)
    .map((record, index) => ({ ...record, sequence: index + 1 }))
}
