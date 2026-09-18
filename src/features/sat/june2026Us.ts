import questionsData from '@/data/sat/june2026UsQuestions.json'
import type { SATModule, SATQuestion } from './practiceTest4'

type JuneUsQuestion = Omit<SATQuestion, 'section' | 'explanation'> & {
  rationale: string
  sourcePages: number[]
}

const questions = questionsData as JuneUsQuestion[]

const MODULE_META: Array<Omit<SATModule, 'questions'>> = [
  { id: 'rw1', title: 'Reading and Writing · Module 1', shortTitle: 'R&W Module 1', section: 'reading-writing', durationSeconds: 32 * 60 },
  { id: 'rw2', title: 'Reading and Writing · Module 2', shortTitle: 'R&W Module 2', section: 'reading-writing', durationSeconds: 32 * 60 },
  { id: 'math1', title: 'Math · Module 1', shortTitle: 'Math Module 1', section: 'math', durationSeconds: 35 * 60 },
  { id: 'math2', title: 'Math · Module 2', shortTitle: 'Math Module 2', section: 'math', durationSeconds: 35 * 60 },
]

export const SAT_JUNE_2026_US_MODULES: SATModule[] = MODULE_META.map((module) => ({
  ...module,
  questions: questions
    .filter((question) => question.moduleId === module.id)
    .sort((first, second) => first.number - second.number)
    .map(({ rationale, sourcePages: _sourcePages, ...question }): SATQuestion => ({
      ...question,
      section: module.section,
      // Difficulty, domain, and skill are reviewed individually in the bank.
      explanation: `**Correct answer: ${question.correctAnswer}**\n\n${rationale}`,
    })),
}))

export const SAT_JUNE_2026_US = {
  id: 'june-2026-us-v1' as const,
  title: 'Digital SAT Practice Test 8',
  subtitle: 'June 2026 US · Version 1',
  questionCount: questions.length,
  totalDurationSeconds: SAT_JUNE_2026_US_MODULES.reduce(
    (total, module) => total + module.durationSeconds,
    0,
  ),
  modules: SAT_JUNE_2026_US_MODULES,
}
