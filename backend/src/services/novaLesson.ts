import { z } from 'zod'
import { novaLanguageSchema, languageViolation } from './novaLanguage.js'

const id = z.string().regex(/^[a-zA-Z][\w-]{0,63}$/)
const text = z.string().trim().min(1).max(1800)
const base = { id, title: z.string().max(120), narration: z.string().max(1600).default(''), source: z.object({ testId: z.string().max(240), questionId: z.string().max(240).optional(), attemptId: z.string().max(240).optional() }).strict().optional() }
const point = z.object({ x: z.number().finite().min(-10000).max(10000), y: z.number().finite().min(-10000).max(10000), label: z.string().max(60).optional() }).strict()
export const lessonBlockSchema = z.discriminatedUnion('type', [
  z.object({ ...base, type: z.literal('explanation'), text, highlights: z.array(z.string().min(1).max(160)).max(6).default([]) }).strict(),
  z.object({ ...base, type: z.literal('formula'), latex: z.string().min(1).max(1000), explanation: text, symbols: z.array(z.object({ symbol: z.string().max(40), meaning: z.string().max(200) }).strict()).max(12).default([]) }).strict(),
  z.object({ ...base, type: z.literal('worked_example'), problem: text, steps: z.array(z.object({ id, text, latex: z.string().max(1000).optional() }).strict()).min(1).max(10) }).strict(),
  z.object({ ...base, type: z.literal('graph'), xLabel: z.string().min(1).max(60), yLabel: z.string().min(1).max(60), xUnit: z.string().max(30).default(''), yUnit: z.string().max(30).default(''), domain: z.tuple([z.number().finite().min(-100).max(100), z.number().finite().min(-100).max(100)]), coefficients: z.array(z.number().finite().min(-100).max(100)).min(1).max(6), points: z.array(point).max(12).default([]), caption: text }).strict(),
  z.object({ ...base, type: z.literal('diagram'), caption: text, shapes: z.array(z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('line'), x: z.number().min(0).max(100), y: z.number().min(0).max(100), x2: z.number().min(0).max(100), y2: z.number().min(0).max(100) }).strict(),
    z.object({ kind: z.literal('circle'), x: z.number().min(0).max(100), y: z.number().min(0).max(100), radius: z.number().min(1).max(40) }).strict(),
    z.object({ kind: z.literal('label'), x: z.number().min(0).max(100), y: z.number().min(0).max(100), text: z.string().min(1).max(80) }).strict(),
  ])).min(1).max(30) }).strict(),
  z.object({ ...base, type: z.literal('comparison'), columns: z.tuple([z.string().max(80), z.string().max(80)]), rows: z.array(z.tuple([z.string().max(400), z.string().max(400)])).min(1).max(8) }).strict(),
  z.object({ ...base, type: z.literal('exercise'), prompt: text, hint: z.string().max(500).optional(), answer: z.string().max(600).optional() }).strict(),
  z.object({ ...base, type: z.literal('summary'), text }).strict(),
])
export const lessonSchema = z.object({ version: z.literal(1), id, language: novaLanguageSchema, title: z.string().min(1).max(140), blocks: z.array(lessonBlockSchema).min(1).max(12) }).strict()
export type NovaLesson = z.infer<typeof lessonSchema>
export const lessonProgressSchema = z.object({ activeBlockId: id.optional(), revealedSteps: z.record(z.string(), z.number().int().min(0).max(10)).default({}), answers: z.record(z.string(), z.string().max(2000)).default({}) }).strict()
export type LessonProgress = z.infer<typeof lessonProgressSchema>
export const lessonControlSchema = z.enum(['continue', 'restart', 'pause'])
export const lessonControlParameters = { type: 'object', properties: { action: { type: 'string', enum: ['continue', 'restart', 'pause'] } }, required: ['action'], additionalProperties: false }
export function describeLessonContext(messages: Array<{ lesson?: NovaLesson; lessonProgress?: LessonProgress }>) {
  const message = [...messages].reverse().find(message => message.lesson)
  const lesson = readNovaLesson(message?.lesson)
  if (!lesson) return ''
  const active = lesson.blocks.find(block => block.id === message?.lessonProgress?.activeBlockId) ?? lesson.blocks[0]
  return JSON.stringify({ id: lesson.id, title: lesson.title, language: lesson.language, activeBlock: active, currentAttempt: message?.lessonProgress?.answers[active.id]?.slice(0, 1000), revealedSteps: message?.lessonProgress?.revealedSteps[active.id] }).slice(0, 5000)
}
export const polynomial = (coefficients: number[], x: number) => coefficients.reduceRight((sum, coefficient) => sum * x + coefficient, 0)
export function graphSamples(block: Extract<NovaLesson['blocks'][number], { type: 'graph' }>) {
  const [min, max] = block.domain
  if (min >= max || max - min > 200) return []
  return Array.from({ length: 81 }, (_, i) => { const x = min + (max - min) * i / 80; return { x, y: polynomial(block.coefficients, x) } }).filter(p => Number.isFinite(p.y) && Math.abs(p.y) <= 10000)
}
export function readNovaLesson(value: unknown, expected?: 'uz' | 'en' | 'ru'): NovaLesson | undefined {
  const parsed = lessonSchema.safeParse(value)
  if (!parsed.success || expected && parsed.data.language !== expected) return
  const lesson = parsed.data, ids = lesson.blocks.map(block => block.id)
  if (new Set(ids).size !== ids.length || languageViolation(lesson.title, lesson.language)) return
  for (const block of lesson.blocks) {
    const prose = [block.title, block.narration, 'text' in block ? block.text : '', 'explanation' in block ? block.explanation : '', 'caption' in block ? block.caption : '', 'prompt' in block ? block.prompt : '', block.type === 'worked_example' ? [block.problem, ...block.steps.map(step => step.text)].join('\n\n') : '', block.type === 'comparison' ? [...block.columns, ...block.rows.flat()].join('\n\n') : '', block.type === 'exercise' ? block.hint ?? '' : '', block.type === 'formula' ? block.symbols.map(symbol => symbol.meaning).join('\n\n') : ''].join('\n\n')
    if (languageViolation(prose, lesson.language)) return
    if (block.type === 'graph' && (!graphSamples(block).length || block.points.some(p => Math.abs(polynomial(block.coefficients, p.x) - p.y) > .001))) return
    if (block.type === 'worked_example' && new Set(block.steps.map(step => step.id)).size !== block.steps.length) return
  }
  return lesson
}
export const novaLessonInstructions = `For a substantial teaching request you may return optional lesson, a version 1 validated lesson board. Do not create one for a greeting or simple fact. Schema: {version:1,id:"lesson-id",language:"uz|en",title,blocks:[...]}. Every block has id,title,narration (plain spoken explanation, no stage directions). Block types:
explanation: text,highlights:string[]; formula: latex,explanation,symbols:[{symbol,meaning}]; worked_example: problem,steps:[{id,text,latex?}]; graph: xLabel,yLabel,xUnit,yUnit,domain:[min,max],coefficients:[constant,x,x^2,...] (max degree5, domain -100..100),points:[{x,y,label?}],caption; diagram: caption,shapes:[{kind:"line",x,y,x2,y2}|{kind:"circle",x,y,radius}|{kind:"label",x,y,text}] (all coordinates0..100); comparison: columns:[left,right],rows:[[left,right]]; exercise: prompt,hint?,answer?; summary:text. Up to12 blocks. Formula must be valid LaTeX without HTML commands. Graph points MUST agree with the polynomial; coefficients, not executable expressions. Use a geometry diagram, grammar structure or timeline only when it teaches something. Titles/prose match the current allowed response language; foreign grammar examples may stay in quotation marks. Worked steps explain the reasoning. Narration follows block order and can be played one block at a time. Preserve a useful complete reply even if lesson metadata fails. A full lesson can include definition, rule, conditions, symbols, example, mistakes and an exercise; do not impose this template on small questions. No HTML, scripts or remote embeds.`
