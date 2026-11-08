import allocation from '@/data/sat/adaptiveForms.v1.json'
import bank from '@/data/sat/questionBankMocks.json'
import { SAT_TEST_9_MATH_2, SAT_QUESTION_BANK_TESTS } from './questionBank'
import type { SATTestDefinition } from './catalog'
import type { SATModule, SATModuleId, SATQuestion } from './practiceTest4'

// The historical source bank is immutable. The allocation contains source IDs,
// never copied/reworded questions, and must be versioned for every future edit.
const source = new Map<string, SATQuestion>([
  ...Object.values(SAT_QUESTION_BANK_TESTS).flatMap(test => test.modules.flatMap(module => module.questions)),
  ...SAT_TEST_9_MATH_2.questions,
].map(question => [question.sourceQuestionId!, question]))
// Guard against an accidental source-pool change that would break saved forms.
if (source.size !== bank.tests.reduce((count, test) => count + test.questions.length, bank.test9Math2.length)) {
  throw new Error('SAT adaptive source bank contains duplicate IDs')
}

function module(id: SATModuleId, ids: string[]): SATModule {
  const math = id.startsWith('math')
  return {
    id,
    section: math ? 'math' : 'reading-writing',
    title: `${math ? 'Math' : 'Reading and Writing'} · Module ${id.endsWith('1') ? 1 : 2}`,
    shortTitle: `${math ? 'Math' : 'R&W'} Module ${id.endsWith('1') ? 1 : 2}`,
    durationSeconds: (math ? 35 : 32) * 60,
    questions: ids.map((sourceId, index) => {
      const question = source.get(sourceId)
      if (!question) throw new Error(`Missing SAT source question ${sourceId}`)
      return { ...question, id: `${id}-${index + 1}`, moduleId: id, number: index + 1 }
    }),
  }
}

function second(id: 'rw2' | 'math2', lower: string[], higher: string[]): SATModule {
  const result = module(id, higher)
  return { ...result, adaptive: {
    version: '2026-11-02-v1',
    firstModuleId: id === 'rw2' ? 'rw1' : 'math1',
    // Our transparent practice cutoffs, not proprietary College Board routing.
    higherMinimumCorrect: id === 'rw2' ? 18 : 14,
    lower: module(id, lower).questions,
    higher: result.questions,
  } }
}

export const ADAPTIVE_SAT_TESTS: Record<number, SATTestDefinition> = Object.fromEntries(
  allocation.forms.map(form => [form.mockId, {
    mockId: form.mockId,
    id: `adaptive-${allocation.version}-${form.mockId}`,
    title: `Digital SAT Practice Test ${form.mockId}`,
    subtitle: 'Balanced adaptive SAT practice',
    badge: 'Adaptive · College Board Question Bank',
    difficulty: 'Medium',
    questionCount: 98,
    totalDurationSeconds: 134 * 60,
    modules: [module('rw1', form.rw1), second('rw2', form.rw2Lower, form.rw2Higher),
      module('math1', form.math1), second('math2', form.math2Lower, form.math2Higher)],
  }]),
)
