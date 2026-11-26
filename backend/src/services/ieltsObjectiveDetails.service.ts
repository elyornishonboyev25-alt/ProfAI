import { z } from 'zod'
import { ieltsBandForCorrect } from './ieltsStanding.service.js'

const partSchema = z.object({
  partNumber: z.number().int().min(1).max(4),
  sectionTitle: z.string().trim().max(180),
  totalQuestions: z.number().int().min(1).max(200),
  correctAnswers: z.number().int().min(0).max(200),
  incorrectAnswers: z.number().int().min(0).max(200),
  skippedAnswers: z.number().int().min(0).max(200),
}).refine(part => part.correctAnswers + part.incorrectAnswers + part.skippedAnswers === part.totalQuestions, 'Part counts must add up to its question total.')

/** Only aggregate marks are stored here; no student answer text or paper assets. */
export const ieltsObjectiveDetailsSchema = z.object({
  version: z.literal(1),
  testId: z.string().min(3).max(120),
  partial: z.boolean(),
  correct: z.number().int().min(0).max(200),
  total: z.number().int().min(1).max(200),
  incorrect: z.number().int().min(0).max(200),
  skipped: z.number().int().min(0).max(200),
  bandScore: z.number().min(0).max(9).multipleOf(0.5).optional(),
  sectionSummaries: z.array(partSchema).min(1).max(4),
}).superRefine((details, context) => {
  const sum = (key: 'totalQuestions' | 'correctAnswers' | 'incorrectAnswers' | 'skippedAnswers') => details.sectionSummaries.reduce((total, part) => total + part[key], 0)
  if (new Set(details.sectionSummaries.map(part => part.partNumber)).size !== details.sectionSummaries.length
    || sum('totalQuestions') !== details.total || sum('correctAnswers') !== details.correct
    || sum('incorrectAnswers') !== details.incorrect || sum('skippedAnswers') !== details.skipped) {
    context.addIssue({ code: 'custom', message: 'Part breakdown must match the attempt totals without duplicate parts.' })
  }
  if (details.partial && details.bandScore !== undefined) context.addIssue({ code: 'custom', message: 'Part practice has no IELTS band.' })
  if (!details.partial) {
    const band = details.skipped === details.total ? 0 : details.correct === 0 ? 2 : ieltsBandForCorrect(details.correct)
    if (details.total !== 40 || details.bandScore !== band) context.addIssue({ code: 'custom', message: 'A full paper needs 40 questions and a band consistent with its answer counts.' })
  }
})

export function validateObjectiveDetails(payload: { externalTestId: string; totalQuestions: number; correctAnswers: number; isPartial: boolean; breakdown?: z.infer<typeof ieltsObjectiveDetailsSchema> }, context: z.RefinementCtx, maxPart: number) {
  if (payload.correctAnswers > payload.totalQuestions) context.addIssue({ code: 'custom', path: ['correctAnswers'], message: 'Correct answers cannot exceed the question total.' })
  const details = payload.breakdown
  if (details && (details.testId !== payload.externalTestId || details.total !== payload.totalQuestions
    || details.correct !== payload.correctAnswers || details.partial !== payload.isPartial
    || details.sectionSummaries.some(part => part.partNumber > maxPart))) {
    context.addIssue({ code: 'custom', path: ['breakdown'], message: 'Breakdown must describe this test, skill and attempt.' })
  }
}

export function objectiveParts(value: unknown, total?: number | null, correct?: number | null) {
  const details = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  const parsed = z.array(partSchema).min(1).max(4).safeParse(details.sectionSummaries)
  if (!parsed.success) return []
  const parts = parsed.data
  if (new Set(parts.map(part => part.partNumber)).size !== parts.length
    || typeof total === 'number' && parts.reduce((sum, part) => sum + part.totalQuestions, 0) !== total
    || typeof correct === 'number' && parts.reduce((sum, part) => sum + part.correctAnswers, 0) !== correct) return []
  return parts.sort((a, b) => a.partNumber - b.partNumber)
}
