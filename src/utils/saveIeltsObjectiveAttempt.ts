import type { IELTSTest, TestResult } from '@/types/ieltsTypes'
import { evaluateReadingAnswers, formatQuestionTypeLabel } from './ieltsUtils'
import { saveReadingAnalysisHistory } from './readingAnalysisStorage'

/** Persist before navigating: full mocks do not mount the standalone Results page. */
export function saveIeltsObjectiveAttempt(test: IELTSTest, result: TestResult, userId?: string) {
  const ids = result.detailedBreakdown?.activeSectionIds
  const analysis = result.detailedBreakdown?.readingAnalysis ?? evaluateReadingAnswers(
    test.sections.filter(section => !ids?.length || ids.includes(section.id)), result.answers,
  )
  saveReadingAnalysisHistory({
    userId, attemptKey: `${result.testId}-${result.date}`, savedAt: result.date,
    testId: test.id, testTitle: test.title, score: result.score, bandScore: result.score,
    isPartial: Boolean(result.isPartial), ...analysis.summary, timeSpent: result.timeSpent,
    sectionSummaries: analysis.sectionSummaries, questionResults: analysis.questionResults,
    focusAreas: analysis.typeInsights.filter(issue => issue.incorrectAnswers > 0).map(issue => ({
      label: issue.label, incorrectAnswers: issue.incorrectAnswers, accuracy: issue.accuracy,
    })),
    incorrectQuestions: analysis.questionResults.filter(question => question.status !== 'correct').map(question => ({
      questionId: question.questionId, displayNumber: question.displayNumber, partNumber: question.partNumber,
      prompt: question.prompt, paragraphLabel: question.paragraphLabel, location: question.location,
      typeLabel: formatQuestionTypeLabel(question.questionType),
    })),
    resultPayload: { ...result, detailedBreakdown: { ...result.detailedBreakdown, activeSectionIds: ids ?? test.sections.map(section => section.id), paperSnapshot: test } },
  })
}
