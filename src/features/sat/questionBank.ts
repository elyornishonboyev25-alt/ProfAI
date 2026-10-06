import data from '@/data/sat/questionBankMocks.json'
import legacyAllocation from '@/data/sat/questionBankLegacyAllocation.json'
import type { SATModule, SATModuleId, SATQuestion } from './practiceTest4'
import type { SATTestDefinition } from './catalog'

const metadata: Array<Omit<SATModule, 'questions'>> = [
  { id: 'rw1', title: 'Reading and Writing · Module 1', shortTitle: 'R&W Module 1', section: 'reading-writing', durationSeconds: 32 * 60 },
  { id: 'rw2', title: 'Reading and Writing · Module 2', shortTitle: 'R&W Module 2', section: 'reading-writing', durationSeconds: 32 * 60 },
  { id: 'math1', title: 'Math · Module 1', shortTitle: 'Math Module 1', section: 'math', durationSeconds: 35 * 60 },
  { id: 'math2', title: 'Math · Module 2', shortTitle: 'Math Module 2', section: 'math', durationSeconds: 35 * 60 },
]

function moduleFrom(id: SATModuleId, questions: SATQuestion[]): SATModule {
  return {
    ...metadata.find((module) => module.id === id)!,
    questions: questions.map((question) => {
      // The source's decimal example transposed the digits of 7/24.
      if (question.sourceQuestionId !== 'c6e85cd7') return question
      return {
        ...question,
        explanation: question.explanation.replace(/0\.219/g, '0.291'),
        sourceContent: question.sourceContent ? {
          ...question.sourceContent,
          explanation: question.sourceContent.explanation.replace(/0\.219/g, '0.291'),
        } : undefined,
      }
    }),
  }
}

export const SAT_TEST_9_MATH_2 = moduleFrom('math2', data.test9Math2 as SATQuestion[])

const questionBySourceId = new Map(
  data.tests.flatMap((test) => test.questions as SATQuestion[])
    .map((question) => [question.sourceQuestionId, question] as const),
)

const difficultyForMock = (mockId: number): SATTestDefinition['difficulty'] =>
  mockId < 20 ? 'Easy' : mockId < 31 ? 'Medium' : 'Hard'

function definition(mockId: number, questions: SATQuestion[], legacy = false): SATTestDefinition {
  const difficulty = difficultyForMock(mockId)
  return {
    mockId,
    id: `question-bank-${legacy ? '2026-09-20' : '2026-09-28'}-${mockId}`,
    title: `Digital SAT Practice Test ${mockId}`,
    subtitle: `SAT Question Bank · ${difficulty} difficulty`,
    badge: legacy ? 'Question Bank Practice · Original version' : 'Question Bank Practice · Fixed modules',
    difficulty,
    questionCount: 98,
    totalDurationSeconds: 134 * 60,
    modules: metadata.map((module) => moduleFrom(module.id,
      questions.filter((question) => question.moduleId === module.id))),
  }
}

export const SAT_QUESTION_BANK_TESTS: Record<number, SATTestDefinition> = Object.fromEntries(
  data.tests.map((test) => [test.mockId, definition(test.mockId, test.questions as SATQuestion[])]),
)

/** Preserve the question order of attempts saved before the difficulty regrouping. */
export const SAT_QUESTION_BANK_LEGACY_TESTS: SATTestDefinition[] = Object.entries(legacyAllocation)
  .map(([id, modules]) => {
    const sourceIds = modules as Record<SATModuleId, string[]>
    const questions = metadata.flatMap((module) =>
      sourceIds[module.id].map((sourceId, index) => ({
        ...questionBySourceId.get(sourceId)!,
        id: `${module.id}-${index + 1}`,
        number: index + 1,
        moduleId: module.id,
      })),
    )
    const test = definition(Number(id), questions, true)
    return { ...test, subtitle: 'SAT Question Bank · Original mixed difficulty', difficulty: 'Medium' as const }
  })
