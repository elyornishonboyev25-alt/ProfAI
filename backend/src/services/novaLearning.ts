import { z } from 'zod'
import { novaPerformanceSchema } from './novaPersona.js'

export const turnUnderstandingSchema = z.object({
  intent: z.enum(['conversation', 'question', 'explanation', 'practice', 'attempt', 'review', 'correction', 'boundary', 'plan']),
  topic: z.string().trim().max(120).default(''),
  approach: z.enum(['direct', 'concrete_example', 'analogy', 'smaller_steps', 'hint', 'independent_retry', 'challenge', 'clarify']),
  temporaryTone: z.enum(['neutral', 'warm', 'playful', 'serious', 'supportive', 'affectionate']),
  pendingExercise: z.string().max(600).optional(),
}).strict()
export type TurnUnderstanding = z.infer<typeof turnUnderstandingSchema>
export const learningObservationSchema = z.object({
  topicKey: z.string().regex(/^[a-z][a-z0-9_]{2,79}$/),
  topic: z.string().trim().min(2).max(120),
  quote: z.string().trim().min(2).max(1000),
  outcome: z.enum(['correct', 'partial', 'incorrect', 'unclear']),
  assistance: z.enum(['independent', 'hinted', 'worked_example', 'unknown']),
  misconception: z.string().trim().max(300).optional(),
  nextExercise: z.string().trim().max(600).optional(),
  confidence: z.number().finite().min(0).max(1),
}).strict()
export type LearningObservation = z.infer<typeof learningObservationSchema>
export const learningObservationParameters = {
  type: 'object', properties: {
    topicKey: { type: 'string' }, topic: { type: 'string' }, quote: { type: 'string' },
    outcome: { type: 'string', enum: ['correct', 'partial', 'incorrect', 'unclear'] },
    assistance: { type: 'string', enum: ['independent', 'hinted', 'worked_example', 'unknown'] },
    misconception: { type: 'string' }, nextExercise: { type: 'string' }, confidence: { type: 'number', minimum: 0, maximum: 1 },
  }, required: ['topicKey', 'topic', 'quote', 'outcome', 'assistance', 'confidence'], additionalProperties: false,
}
export const deliverySegmentSchema = z.object({ text: z.string().min(1).max(4000), performance: novaPerformanceSchema }).strict()
export type DeliverySegment = z.infer<typeof deliverySegmentSchema>
export const performanceCueSchema = z.object({
  atMs: z.number().finite().min(0).max(3_600_000), performance: novaPerformanceSchema,
  alignment: z.enum(['audio_clock', 'playback_boundary', 'estimated']),
}).strict()
export type PerformanceCue = z.infer<typeof performanceCueSchema>
const compact = (text: string) => text.replace(/\s+/g, ' ').trim()
export function validateDeliverySegments(reply: string, value: unknown): DeliverySegment[] {
  const parsed = z.array(deliverySegmentSchema).min(1).max(4).safeParse(value)
  // No missing/duplicated teaching text may be introduced by a delivery plan.
  return parsed.success && compact(parsed.data.map(part => part.text).join(' ')) === compact(reply) ? parsed.data : []
}
export function groundedObservations(value: unknown, source: string): LearningObservation[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  return value.slice(0, 4).flatMap(entry => {
    const parsed = learningObservationSchema.safeParse(entry)
    if (!parsed.success || !compact(source).includes(compact(parsed.data.quote)) || seen.has(parsed.data.topicKey)) return []
    seen.add(parsed.data.topicKey)
    return [{ ...parsed.data, confidence: Math.min(.85, parsed.data.confidence) }]
  })
}

export const novaLearningInstructions = `Use the SAME response generation to understand the turn; do not call a second model to classify it.
Return optional understanding: {"intent":"attempt","topic":"Adding fractions","approach":"hint","temporaryTone":"supportive","pendingExercise":"..."}. intent: conversation/question/explanation/practice/attempt/review/correction/boundary/plan. approach: direct/concrete_example/analogy/smaller_steps/hint/independent_retry/challenge/clarify. temporaryTone: neutral/warm/playful/serious/supportive/affectionate.
This is temporary conversational state, not a lasting personality or diagnosis. A correction such as "No, I meant the other one" redirects the answer immediately. A serious next request resets earlier banter. When asked again, change representation or example instead of paraphrasing the same rule. A concise direct answer needs no exercise or closing question. Avoid stock greetings, praise and motivational speeches; vary brief reactions using the actual context.
Use supplied skill evidence cautiously: one error is not inability; one correct answer is not mastery. Distinguish independent work from a retry after your hint. For actual learner work only, return up to 4 learningObservations: {"topicKey":"fraction_addition","topic":"Adding fractions","quote":"EXACT words from the current learner utterance","outcome":"partial","assistance":"hinted","misconception":"...","nextExercise":"...","confidence":0.6}. outcome: correct/partial/incorrect/unclear; assistance: independent/hinted/worked_example/unknown. No observations for a mere question, copied worked example, greeting, or self-reported ability. These are labelled model assessments, not official scores. Never invent a quote or infer pronunciation from text.
Optionally use deliverySegments for a useful shift within a spoken reply: [{"text":"...","performance":{...}}]. At most 4 contiguous parts; joining their text must reproduce reply exactly, in order. Most replies need one performance and no segments. A playful opening may become warm, then focused teaching. Avoid rapid or decorative changes; never read these labels aloud.`

export const novaLiveLearningInstructions = `Resolve intent, corrections and the next useful teaching step in your native reasoning, without a separate classification model. A direct question needs a direct answer, practice needs room for an independent attempt, and a correction redirects the meaning immediately. If an explanation failed, change the example or representation instead of paraphrasing the same rule. Avoid stock praise, greetings and compulsory closing questions. A serious new request clears temporary banter.
Use supplied skill evidence cautiously; one correct answer is not mastery and one error is not inability. Distinguish independent work from a retry after your hint. For actual learner work you may call observe_learning with a verbatim quote and a cautious assessment; not for a greeting, copied solution, self-reported ability or mere question. Never infer pronunciation from text. This is a local record tool, not a second model request.
For a useful delivery change during a reply, call set_expression just before the next spoken portion, at most four times. It can move from playful to warm to focused. Keep changes restrained; do not generate text JSON, deliverySegments or stage directions as speech. Metadata is sent only through tools.`
