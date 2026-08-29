import { z } from 'zod'

const currentYear = new Date().getUTCFullYear()

export const guestDiagnosticAnswersSchema = z.object({
  applicantCountry: z.string().trim().min(2).max(80),
  intendedMajor: z.string().trim().min(2).max(120),
  destinations: z.array(z.string().trim().min(2).max(80)).min(1).max(5),
  intakeYear: z.coerce.number().int().min(currentYear).max(currentYear + 7),
  curriculum: z.enum(['NATIONAL', 'IB', 'A_LEVELS', 'AP', 'OTHER']),
  academicBand: z.enum(['BELOW_70', 'BETWEEN_70_79', 'BETWEEN_80_89', 'NINETY_PLUS']),
  testPlan: z.enum(['IELTS', 'SAT', 'BOTH', 'UNSURE', 'NONE']),
  currentIeltsScore: z.number().min(0).max(9).multipleOf(0.5).nullable(),
  targetIeltsScore: z.number().min(4).max(9).multipleOf(0.5).nullable(),
  currentSatScore: z.number().int().min(400).max(1600).nullable(),
  targetSatScore: z.number().int().min(400).max(1600).nullable(),
  budgetRange: z.enum(['UNDER_10K', 'BETWEEN_10K_25K', 'BETWEEN_25K_50K', 'ABOVE_50K', 'UNSURE']),
  needsAid: z.boolean(),
  applicationStage: z.enum(['EXPLORING', 'RESEARCHING', 'SHORTLISTING', 'PREPARING', 'READY']),
  weeklyHours: z.coerce.number().int().min(1).max(30),
}).superRefine((answers, context) => {
  if (['IELTS', 'BOTH'].includes(answers.testPlan) && answers.targetIeltsScore === null) {
    context.addIssue({ code: 'custom', path: ['targetIeltsScore'], message: 'Add your IELTS target.' })
  }
  if (['SAT', 'BOTH'].includes(answers.testPlan) && answers.targetSatScore === null) {
    context.addIssue({ code: 'custom', path: ['targetSatScore'], message: 'Add your SAT target.' })
  }
  if (answers.currentIeltsScore !== null && answers.targetIeltsScore !== null && answers.currentIeltsScore > answers.targetIeltsScore) {
    context.addIssue({ code: 'custom', path: ['targetIeltsScore'], message: 'IELTS target must be at least the current score.' })
  }
  if (answers.currentSatScore !== null && answers.targetSatScore !== null && answers.currentSatScore > answers.targetSatScore) {
    context.addIssue({ code: 'custom', path: ['targetSatScore'], message: 'SAT target must be at least the current score.' })
  }
})

export const guestDiagnosticDraftSchema = z.object({
  applicantCountry: z.string().trim().min(2).max(80).optional(),
  intendedMajor: z.string().trim().min(2).max(120).optional(),
  destinations: z.array(z.string().trim().min(2).max(80)).max(5).optional(),
  intakeYear: z.coerce.number().int().min(currentYear).max(currentYear + 7).optional(),
  curriculum: z.enum(['NATIONAL', 'IB', 'A_LEVELS', 'AP', 'OTHER']).optional(),
  academicBand: z.enum(['BELOW_70', 'BETWEEN_70_79', 'BETWEEN_80_89', 'NINETY_PLUS']).optional(),
  testPlan: z.enum(['IELTS', 'SAT', 'BOTH', 'UNSURE', 'NONE']).optional(),
  currentIeltsScore: z.number().min(0).max(9).multipleOf(0.5).nullable().optional(),
  targetIeltsScore: z.number().min(4).max(9).multipleOf(0.5).nullable().optional(),
  currentSatScore: z.number().int().min(400).max(1600).nullable().optional(),
  targetSatScore: z.number().int().min(400).max(1600).nullable().optional(),
  budgetRange: z.enum(['UNDER_10K', 'BETWEEN_10K_25K', 'BETWEEN_25K_50K', 'ABOVE_50K', 'UNSURE']).optional(),
  needsAid: z.boolean().optional(),
  applicationStage: z.enum(['EXPLORING', 'RESEARCHING', 'SHORTLISTING', 'PREPARING', 'READY']).optional(),
  weeklyHours: z.coerce.number().int().min(1).max(30).optional(),
}).strict()

export type GuestDiagnosticAnswers = z.infer<typeof guestDiagnosticAnswersSchema>
export type GuestDiagnosticDraft = z.infer<typeof guestDiagnosticDraftSchema>

type CategoryKey = 'academics' | 'tests' | 'research' | 'application'

export type GuestDiagnosticResult = {
  schemaVersion: 1
  overallScore: number
  readinessLabel: string
  summary: string
  categories: Array<{ key: CategoryKey; label: string; score: number; status: string; summary: string }>
  priorities: Array<{ key: CategoryKey; title: string; body: string; actionLabel: string; actionPath: string }>
}

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)))

function categoryStatus(score: number) {
  if (score >= 80) return 'Strong foundation'
  if (score >= 65) return 'On track'
  if (score >= 45) return 'Building'
  return 'Needs attention'
}

function ieltsReadiness(current: number | null, target: number | null) {
  if (target === null || current === null) return 38
  const gap = target - current
  if (gap <= 0) return 92
  if (gap <= 0.5) return 82
  if (gap <= 1) return 68
  if (gap <= 1.5) return 52
  return 34
}

function satReadiness(current: number | null, target: number | null) {
  if (target === null || current === null) return 38
  const gap = target - current
  if (gap <= 0) return 92
  if (gap <= 100) return 78
  if (gap <= 200) return 62
  if (gap <= 300) return 48
  return 32
}

const priorityCopy: Record<CategoryKey, { title: string; body: string; actionLabel: string; actionPath: string }> = {
  academics: { title: 'Strengthen your academic profile', body: 'Build the study habits and academic English that support both applications and university work.', actionLabel: 'Explore academic skills', actionPath: '/academic-skills' },
  tests: { title: 'Establish a test baseline', body: 'Use a focused IELTS or Digital SAT session to replace guesswork with a measurable starting point.', actionLabel: 'Open test preparation', actionPath: '/test-preparation' },
  research: { title: 'Turn preferences into a shortlist', body: 'Compare official program requirements, costs and destinations before committing to a university list.', actionLabel: 'Research universities', actionPath: '/admission/universities' },
  application: { title: 'Build a deadline-led plan', body: 'Break your intake goal into weekly actions for documents, tests, research and applications.', actionLabel: 'Create my journey', actionPath: '/register' },
}

export function scoreGuestDiagnostic(answers: GuestDiagnosticAnswers): GuestDiagnosticResult {
  const academics = ({ BELOW_70: 42, BETWEEN_70_79: 58, BETWEEN_80_89: 76, NINETY_PLUS: 91 } as const)[answers.academicBand]
  const tests = answers.testPlan === 'IELTS'
    ? ieltsReadiness(answers.currentIeltsScore, answers.targetIeltsScore)
    : answers.testPlan === 'SAT'
      ? satReadiness(answers.currentSatScore, answers.targetSatScore)
      : answers.testPlan === 'BOTH'
        ? Math.round((ieltsReadiness(answers.currentIeltsScore, answers.targetIeltsScore) + satReadiness(answers.currentSatScore, answers.targetSatScore)) / 2)
        : answers.testPlan === 'UNSURE' ? 35 : 45

  const stageValue = ({ EXPLORING: 18, RESEARCHING: 38, SHORTLISTING: 62, PREPARING: 78, READY: 90 } as const)[answers.applicationStage]
  const research = clamp(24 + Math.min(answers.destinations.length, 3) * 9 + (answers.intendedMajor ? 18 : 0) + (answers.budgetRange !== 'UNSURE' ? 18 : 5) + stageValue * 0.12)
  const application = clamp(stageValue + (answers.weeklyHours >= 8 ? 10 : answers.weeklyHours >= 4 ? 5 : 0))
  const categories = [
    { key: 'academics' as const, label: 'Academic foundation', score: academics, summary: academics >= 76 ? 'Your reported grades provide a solid base to build on.' : 'Your plan should include consistent academic skill development.' },
    { key: 'tests' as const, label: 'Exam readiness', score: tests, summary: tests >= 65 ? 'Your test target and current baseline are reasonably aligned.' : 'A clear baseline and focused practice should be an early priority.' },
    { key: 'research' as const, label: 'University research', score: research, summary: research >= 65 ? 'Your destination, major and funding direction are taking shape.' : 'Clarify program, destination and budget requirements before shortlisting.' },
    { key: 'application' as const, label: 'Application planning', score: application, summary: application >= 65 ? 'You have enough direction to organize concrete application tasks.' : 'Convert your intake goal into milestones and weekly actions.' },
  ].map((category) => ({ ...category, status: categoryStatus(category.score) }))
  const overallScore = clamp(academics * 0.3 + tests * 0.3 + research * 0.2 + application * 0.2)
  const readinessLabel = categoryStatus(overallScore)
  const priorities = [...categories]
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map(({ key }) => ({ key, ...priorityCopy[key] }))

  return {
    schemaVersion: 1,
    overallScore,
    readinessLabel,
    summary: overallScore >= 65
      ? 'You have a useful foundation. ProfAI can now organize the gaps into a focused university journey.'
      : 'You are early enough to make smart changes. Start with the priorities below and build evidence step by step.',
    categories,
    priorities,
  }
}
