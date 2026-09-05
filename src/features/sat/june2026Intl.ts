import questionsData from '@/data/sat/june2026IntlQuestions.json'
import type { SATModule, SATModuleId, SATQuestion, SATSection } from './practiceTest4'
import type { SATStructuredChoice } from './practiceTest4QuestionCorrections'

type JuneQuestion = {
  id: string
  moduleId: SATModuleId
  number: number
  prompt: string
  kind: SATQuestion['kind']
  correctAnswer: string
  acceptedAnswers?: string[]
  tolerance?: number
  choices: SATStructuredChoice[]
  rationale: string
  asset: string
  assetWidth: number
  assetHeight: number
  visual?: { asset: string; alt: string }
}

const MODULE_META: Array<Omit<SATModule, 'questions'>> = [
  { id: 'rw1', title: 'Reading and Writing · Module 1', shortTitle: 'R&W Module 1', section: 'reading-writing', durationSeconds: 32 * 60 },
  { id: 'rw2', title: 'Reading and Writing · Module 2', shortTitle: 'R&W Module 2', section: 'reading-writing', durationSeconds: 32 * 60 },
  { id: 'math1', title: 'Math · Module 1', shortTitle: 'Math Module 1', section: 'math', durationSeconds: 35 * 60 },
  { id: 'math2', title: 'Math · Module 2', shortTitle: 'Math Module 2', section: 'math', durationSeconds: 35 * 60 },
]

function sectionFor(moduleId: SATModuleId): SATSection {
  return moduleId.startsWith('rw') ? 'reading-writing' : 'math'
}

function difficulty(moduleId: SATModuleId, number: number): SATQuestion['difficulty'] {
  const adjusted = number + (moduleId === 'rw2' || moduleId === 'math2' ? 3 : 0)
  if (adjusted <= 8) return 'Foundation'
  if (adjusted <= 18) return 'Medium'
  return 'Advanced'
}

function readingSkill(prompt: string): [string, string] {
  const text = prompt.toLowerCase()
  if (text.includes('conventions of standard english')) return ['Standard English Conventions', 'Grammar & Usage']
  if (text.includes('transition')) return ['Expression of Ideas', 'Transitions']
  if (text.includes('student wants') || text.includes('while researching')) return ['Expression of Ideas', 'Rhetorical Synthesis']
  if (text.includes('data from the') || text.includes('finding, if true') || text.includes('claim')) return ['Information and Ideas', 'Evidence & Inference']
  if (text.includes('word or phrase')) return ['Craft and Structure', 'Words in Context']
  return ['Information and Ideas', 'Central Ideas & Details']
}

function mathSkill(prompt: string): [string, string] {
  const text = prompt.toLowerCase()
  if (/circle|triangle|angle|pyramid|prism|surface area/.test(text)) return ['Geometry and Trigonometry', 'Geometry & Trigonometry']
  if (/percent|rate|map|table|population|interest/.test(text)) return ['Problem-Solving and Data Analysis', 'Data, Ratios & Probability']
  if (/quadratic|exponential|minimum|maximum|vertex|real solution|factor/.test(text)) return ['Advanced Math', 'Nonlinear Functions']
  return ['Algebra', 'Linear Equations & Functions']
}

function explanationFor(question: JuneQuestion) {
  const answerText = question.kind === 'multiple-choice'
    ? question.choices.find((choice) => choice.key === question.correctAnswer)?.text
    : question.correctAnswer

  return `**Step 1:** Read the exact source notation in the original paper view and identify the relationship being tested.

**Step 2:** ${question.rationale}

**Step 3:** Therefore the correct answer is **${question.correctAnswer}${answerText && answerText !== question.correctAnswer ? ` — ${answerText}` : ''}**.`
}

const questions = questionsData as JuneQuestion[]

function buildQuestion(question: JuneQuestion): SATQuestion {
  const section = sectionFor(question.moduleId)
  const [domain, skill] = section === 'reading-writing'
    ? readingSkill(question.prompt)
    : mathSkill(question.prompt)

  return {
    ...question,
    section,
    domain,
    skill,
    difficulty: difficulty(question.moduleId, question.number),
    explanation: explanationFor(question),
  }
}

export const SAT_JUNE_2026_INTL_MODULES: SATModule[] = MODULE_META.map((module) => ({
  ...module,
  questions: questions
    .filter((question) => question.moduleId === module.id)
    .sort((first, second) => first.number - second.number)
    .map(buildQuestion),
}))

export const SAT_JUNE_2026_INTL = {
  id: 'june-2026-intl-v1' as const,
  title: 'Digital SAT Practice Test 7',
  subtitle: 'June 2026 International · Version 1',
  questionCount: 98,
  totalDurationSeconds: SAT_JUNE_2026_INTL_MODULES.reduce(
    (total, module) => total + module.durationSeconds,
    0,
  ),
  modules: SAT_JUNE_2026_INTL_MODULES,
}
