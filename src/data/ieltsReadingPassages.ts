import type { IELTSTest, Section } from '../types/ieltsTypes'
import { fullReadingTest } from './fullReadingTest'
import { fullReadingTest2 } from './fullReadingTest2'
import { fullReadingTest3 } from './fullReadingTest3'
import { fullReadingTest5 } from './fullReadingTest5'
import { fullReadingTest7 } from './fullReadingTest7'

export const calculateBandScore = (score: number): number => {
  if (score >= 39) return 9.0
  if (score >= 37) return 8.5
  if (score >= 35) return 8.0
  if (score >= 33) return 7.5
  if (score >= 30) return 7.0
  if (score >= 27) return 6.5
  if (score >= 23) return 6.0
  if (score >= 19) return 5.5
  if (score >= 15) return 5.0
  if (score >= 13) return 4.5
  if (score >= 10) return 4.0
  return 3.5
}

function cloneSection(section: Section, suffix: string): Section {
  return {
    ...section,
    id: section.id,
    paragraphs: section.paragraphs?.map((paragraph) => ({ ...paragraph })),
    questions: section.questions.map((question) => ({
      ...question,
      id: `${question.id}-${suffix}`,
      options: question.options ? [...question.options] : undefined,
      correctAnswer: Array.isArray(question.correctAnswer) ? [...question.correctAnswer] : question.correctAnswer,
    })),
  }
}

function cloneReadingTest(test: IELTSTest, index: number): IELTSTest {
  return {
    ...test,
    id: `reading-test-${index}`,
    title: `IELTS Academic Reading Test ${index}`,
    sections: test.sections.map((section, sectionIndex) => cloneSection(section, `mock-${index}-p${sectionIndex + 1}`)),
    totalQuestions: test.totalQuestions,
  }
}

const completeFallbackTests = [
  fullReadingTest,
  fullReadingTest2,
  fullReadingTest3,
  fullReadingTest5,
  fullReadingTest7,
]

export const mockReadingTests: IELTSTest[] = completeFallbackTests.map((test, index) =>
  cloneReadingTest(test, index + 1),
)

export const passage1Data: Section = mockReadingTests[0].sections[0]
export const passage2Data: Section = mockReadingTests[0].sections[1]
export const passage3Data: Section = mockReadingTests[0].sections[2]

export const generateRandomReadingTest = (): IELTSTest => {
  const index = Math.floor(Math.random() * completeFallbackTests.length)
  return {
    ...cloneReadingTest(completeFallbackTests[index], index + 1),
    id: `reading-test-${Date.now()}`,
    title: 'Random IELTS Academic Reading Test',
  }
}
