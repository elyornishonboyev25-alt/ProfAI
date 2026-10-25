import type { IELTSTest, TestResult } from '../types/ieltsTypes'
import { readIeltsPaperSnapshot } from './ieltsPaperSnapshots'
import { archivedListeningFullTest3 } from '../data/listeningFullTest1'
import { fullReadingTest } from '../data/fullReadingTest'
import { fullReadingTest2 } from '../data/fullReadingTest2'
import { fullReadingTest3 } from '../data/fullReadingTest3'
import { fullReadingTest4 } from '../data/fullReadingTest4'
import { fullReadingTest5 } from '../data/fullReadingTest5'
import { fullReadingTest6 } from '../data/fullReadingTest6'
import { fullReadingTest7 } from '../data/fullReadingTest7'
import { fullReadingTest8 } from '../data/fullReadingTest8'
import { fullReadingTest9 } from '../data/fullReadingTest9'
import { fullReadingTest10 } from '../data/fullReadingTest10'
import { readingFullTests23to30 } from '../data/readingFullTests23to30'
import { mockReadingTests } from '../data/ieltsReadingPassages'
import { mockListeningTests } from '../data/listeningPassages'
import { resolveGeneratedTestById } from './generatedIeltsTests'
import { readingEvidenceKeyConflicts } from '../data/readingAnswerEvidence'

const CATALOG: IELTSTest[] = [
  fullReadingTest,
  fullReadingTest2,
  fullReadingTest3,
  fullReadingTest4,
  fullReadingTest5,
  fullReadingTest6,
  fullReadingTest7,
  fullReadingTest8,
  fullReadingTest9,
  fullReadingTest10,
  ...readingFullTests23to30,
  ...mockReadingTests,
  ...mockListeningTests,
]

export function resolveIeltsTestById(testId: string, result?: Pick<TestResult, 'answers' | 'detailedBreakdown'>): IELTSTest | null {
  if (!testId) return null
  const normalized = testId.trim()
  if (normalized === 'ielts-listening-3' && result && (
    Object.keys(result.answers ?? {}).some(id => /^lt3-q\d+$/.test(id))
    || result.detailedBreakdown?.activeSectionIds?.some(id => /^lt3-part[1-4]$/.test(id))
    || result.detailedBreakdown?.readingAnalysis?.sectionSummaries.some(section => /^lt3-part[1-4]$/.test(section.sectionId))
  )) return archivedListeningFullTest3
  const known = CATALOG.find((test) => test.id === normalized)
  const repairVerifiedReadingCorrections = (paper: IELTSTest): IELTSTest => {
    if (paper.module !== 'Reading' || !known) return paper
    let repaired = false
    const sections = paper.sections.map(section => {
      const current = known.sections.find(item => item.id === section.id)
      if (!current) return section
      if (!section.questions.some(question => {
        const correction = readingEvidenceKeyConflicts[question.id]
        return correction && question.correctAnswer === correction.storedAnswer
          && current.questions.some(item => item.id === question.id && item.correctAnswer === correction.sourceAnswer)
      })) {
        const questions = section.questions.map(question => {
          const prompt = current.questions.find(item => item.id === question.id)?.text
          if (prompt === undefined || prompt === question.text) return question
          repaired = true
          return { ...question, text: prompt }
        })
        return questions.some((question, index) => question !== section.questions[index]) ? { ...section, questions } : section
      }
      repaired = true
      // These specific archived sections contain verified source/key errors.
      // Use the repaired passage and options together; submitted answers stay intact.
      return current
    })
    return repaired ? { ...paper, sections } : paper
  }
  const snapshot = result?.detailedBreakdown?.paperSnapshot
  if (snapshot?.id === normalized && Array.isArray(snapshot.sections) && snapshot.sections.length) return repairVerifiedReadingCorrections(snapshot)
  const stored = readIeltsPaperSnapshot(result?.detailedBreakdown?.paperSnapshotKey, normalized)
  if (stored) return repairVerifiedReadingCorrections(stored)
  if (known) return known
  return resolveGeneratedTestById(normalized)
}

export function listKnownIeltsTests(): IELTSTest[] {
  return CATALOG
}


