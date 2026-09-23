import data from '@/data/sat/questionBankMocks.json'
import type { SATModule, SATModuleId, SATQuestion } from './practiceTest4'
import type { SATTestDefinition } from './catalog'

const metadata: Array<Omit<SATModule, 'questions'>> = [
  { id: 'rw1', title: 'Reading and Writing · Module 1', shortTitle: 'R&W Module 1', section: 'reading-writing', durationSeconds: 32 * 60 },
  { id: 'rw2', title: 'Reading and Writing · Module 2', shortTitle: 'R&W Module 2', section: 'reading-writing', durationSeconds: 32 * 60 },
  { id: 'math1', title: 'Math · Module 1', shortTitle: 'Math Module 1', section: 'math', durationSeconds: 35 * 60 },
  { id: 'math2', title: 'Math · Module 2', shortTitle: 'Math Module 2', section: 'math', durationSeconds: 35 * 60 },
]

function moduleFrom(id: SATModuleId, questions: SATQuestion[]): SATModule {
  return { ...metadata.find((module) => module.id === id)!, questions }
}

export const SAT_TEST_9_MATH_2 = moduleFrom('math2', data.test9Math2 as SATQuestion[])

export const SAT_QUESTION_BANK_TESTS: Record<number, SATTestDefinition> = Object.fromEntries(
  data.tests.map((test) => [test.mockId, {
    mockId: test.mockId,
    id: `question-bank-2026-09-20-${test.mockId}`,
    title: `Digital SAT Practice Test ${test.mockId}`,
    subtitle: 'SAT Question Bank · Mixed difficulty',
    badge: 'Question Bank Practice · Fixed modules',
    difficulty: 'Medium',
    questionCount: 98,
    totalDurationSeconds: 134 * 60,
    modules: metadata.map((module) => moduleFrom(module.id,
      (test.questions as SATQuestion[]).filter((question) => question.moduleId === module.id))),
  }]),
)
