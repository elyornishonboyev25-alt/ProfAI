import paper17QuestionsData from '@/data/sat/paper17Questions.json'
import type { SATModule, SATModuleId, SATQuestion, SATSection } from './practiceTest4'
import type { SATStructuredChoice } from './practiceTest4QuestionCorrections'

type Paper17Question = {
  id: string
  moduleId: SATModuleId
  number: number
  prompt: string
  kind: SATQuestion['kind']
  correctAnswer: string
  acceptedAnswers?: string[]
  tolerance?: number
  choices: SATStructuredChoice[]
  visual?: { asset: string; alt: string }
  domain: string
  explanation: string
}

const MODULE_META: Array<Omit<SATModule, 'questions'>> = [
  { id: 'rw1', title: 'Reading and Writing · Module 1', shortTitle: 'R&W Module 1', section: 'reading-writing', durationSeconds: 32 * 60 },
  { id: 'rw2', title: 'Reading and Writing · Module 2', shortTitle: 'R&W Module 2', section: 'reading-writing', durationSeconds: 32 * 60 },
  { id: 'math1', title: 'Math · Module 1', shortTitle: 'Math Module 1', section: 'math', durationSeconds: 35 * 60 },
  { id: 'math2', title: 'Math · Module 2', shortTitle: 'Math Module 2', section: 'math', durationSeconds: 35 * 60 },
]

const DOMAIN_SKILLS: Record<string, string> = {
  'Craft and Structure': 'Words, Structure & Purpose',
  'Information and Ideas': 'Evidence & Inference',
  'Expression of Ideas': 'Rhetorical Synthesis & Transitions',
  'Standard English Conventions': 'Grammar & Usage',
  Algebra: 'Linear Equations & Functions',
  'Advanced Math': 'Nonlinear Equations & Functions',
  'Problem Solving and Data Analysis': 'Ratios, Data & Probability',
  'Geometry and Trigonometry': 'Geometry & Trigonometry',
}

function difficulty(moduleId: SATModuleId, number: number): SATQuestion['difficulty'] {
  const moduleBoost = moduleId === 'rw2' || moduleId === 'math2' ? 3 : 0
  const level = number + moduleBoost
  if (level <= 8) return 'Foundation'
  if (level <= 18) return 'Medium'
  return 'Advanced'
}

function sectionFor(moduleId: SATModuleId): SATSection {
  return moduleId.startsWith('rw') ? 'reading-writing' : 'math'
}

const questions = paper17QuestionsData as Paper17Question[]

function buildQuestion(question: Paper17Question): SATQuestion {
  return {
    ...question,
    section: sectionFor(question.moduleId),
    skill: DOMAIN_SKILLS[question.domain] ?? question.domain,
    difficulty: difficulty(question.moduleId, question.number),
    asset: '',
    assetWidth: 0,
    assetHeight: 0,
  }
}

export const SAT_PAPER_17_MODULES: SATModule[] = MODULE_META.map((module) => ({
  ...module,
  questions: questions
    .filter((question) => question.moduleId === module.id)
    .sort((a, b) => a.number - b.number)
    .map(buildQuestion),
}))

export const SAT_PAPER_17 = {
  id: 'paper-17' as const,
  title: 'Digital SAT Paper 17',
  subtitle: 'DSATuz Free Test · May 2026 (Hard)',
  questionCount: 98,
  totalDurationSeconds: SAT_PAPER_17_MODULES.reduce((sum, module) => sum + module.durationSeconds, 0),
  modules: SAT_PAPER_17_MODULES,
}
