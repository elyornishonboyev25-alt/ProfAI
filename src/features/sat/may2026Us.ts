import questionsData from '@/data/sat/may2026UsQuestions.json'
import type { SATModule, SATQuestion } from './practiceTest4'

type SourceQuestion = Omit<SATQuestion, 'section' | 'explanation'> & {
  rationale: string
  sourcePages: number[]
  sourceImage?: string
}

const questions = questionsData as SourceQuestion[]
const metadata: Array<Omit<SATModule, 'questions'>> = [
  { id: 'rw1', title: 'Reading and Writing · Module 1', shortTitle: 'R&W Module 1', section: 'reading-writing', durationSeconds: 32 * 60 },
  { id: 'rw2', title: 'Reading and Writing · Module 2', shortTitle: 'R&W Module 2', section: 'reading-writing', durationSeconds: 32 * 60 },
  { id: 'math1', title: 'Math · Module 1', shortTitle: 'Math Module 1', section: 'math', durationSeconds: 35 * 60 },
]

const modules: SATModule[] = metadata.map((module) => ({
  ...module,
  questions: questions.filter((question) => question.moduleId === module.id)
    .map(({ rationale, sourcePages: _pages, sourceImage: _image, ...question }) => ({
      ...question,
      section: module.section,
      explanation: `**Correct answer: ${question.correctAnswer}**\n\n${rationale}`,
    })),
}))

export const SAT_MAY_2026_US = {
  id: 'may-2026-us-v1',
  title: 'Digital SAT Practice Test 9',
  subtitle: 'May 2026 US · Version 1',
  questionCount: questions.length,
  totalDurationSeconds: modules.reduce((total, module) => total + module.durationSeconds, 0),
  modules,
  missingModuleIds: ['math2'] as const,
}
