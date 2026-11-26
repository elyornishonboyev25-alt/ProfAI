import { z } from 'zod'

const resourceId = z.string().min(1).max(240)
export const novaSkill = z.enum(['listening', 'reading', 'speaking', 'writing', 'sat-math', 'sat-rw', 'vocabulary'])
export const studyReferenceSchema = z.object({
  skill: novaSkill, testId: resourceId.optional(), attemptId: resourceId.optional(), questionId: resourceId.optional(),
  mode: z.enum(['page', 'analyze', 'practice', 'exam']).default('page'),
  selectedText: z.string().max(2400).optional(),
}).strict()
export type StudyReference = z.infer<typeof studyReferenceSchema>
export const writingAnchorSchema = z.object({
  id: resourceId, version: z.string().max(100), start: z.number().int().min(0), end: z.number().int().min(1),
  quote: z.string().min(1).max(2000), kind: z.enum(['grammar', 'meaning', 'coherence', 'style']),
  message: z.string().min(1).max(1000), hint: z.string().max(500).default(''),
}).strict()
export type WritingAnchor = z.infer<typeof writingAnchorSchema>
export const studyControlSchema = z.enum(['replay', 'previous_segment', 'next_segment', 'slower', 'normal_speed', 'pause', 'resume', 'next_question', 'previous_question', 'continue'])
export type StudyControl = z.infer<typeof studyControlSchema>
export function readStudyCommand(text: string): StudyControl | null {
  const value = text.toLowerCase().replace(/[‘’ʻ`]/g, "'").replace(/[.!?,]+$/g, '').trim().replace(/\s+/g, ' ')
  const commands: Record<string, StudyControl> = {
    'yana eshittir': 'replay', 'qayta eshittir': 'replay', 'yana eshitay': 'replay', 'replay': 'replay', 'play again': 'replay',
    'keyingi gap': 'next_segment', 'next sentence': 'next_segment', 'oldingi gap': 'previous_segment', 'previous sentence': 'previous_segment',
    'sekinroq': 'slower', 'slower': 'slower', 'oddiy tezlik': 'normal_speed', 'normal speed': 'normal_speed',
    'pauza': 'pause', 'pause': 'pause', "to'xtat": 'pause', 'resume': 'resume', 'davom et': 'continue', 'continue': 'continue',
    'keyingi savol': 'next_question', 'next question': 'next_question', 'oldingi savol': 'previous_question', 'previous question': 'previous_question',
  }
  return commands[value] ?? null
}
/** UTF-16 offsets deliberately match browser selection APIs, including emoji. */
export function writingVersion(text: string) {
  let hash = 2166136261
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619)
  return `${text.length}:${(hash >>> 0).toString(36)}`
}
export function validWritingAnchors(text: string, values: unknown): WritingAnchor[] {
  const list = z.array(writingAnchorSchema).max(30).safeParse(values)
  if (!list.success) return []
  const version = writingVersion(text), seen = new Set<string>()
  return list.data.filter(anchor => {
    if (seen.has(anchor.id) || anchor.version !== version || anchor.end > text.length || text.slice(anchor.start, anchor.end) !== anchor.quote) return false
    seen.add(anchor.id); return true
  })
}

export const toolCallSchema = z.object({
  id: resourceId,
  name: z.enum(['control_study', 'get_page_context', 'list_available_tests', 'list_user_attempts', 'open_page', 'open_attempt_analysis', 'start_practice', 'get_question_context', 'get_answer_evidence', 'get_listening_segment', 'play_listening_segment', 'get_speaking_question_set', 'get_speaking_recording', 'save_vocabulary', 'start_vocabulary_review', 'annotate_writing', 'show_whiteboard', 'update_whiteboard']),
  args: z.record(z.unknown()).default({}),
}).strict()
export type NovaToolCall = z.infer<typeof toolCallSchema>
export function parseNovaToolCalls(raw: unknown): NovaToolCall[] {
  const parsed = z.array(toolCallSchema).max(4).safeParse(raw)
  return parsed.success ? parsed.data : []
}
export type StudyQuestion = { id: string; number: number; text: string; type: string; sectionId: string; instruction?: string; options?: unknown[]; answer: unknown; explanation?: string; evidence?: Array<{ quote: string; paragraphLabel?: string }>; passage?: string; audioUrl?: string; transcript?: string; duration?: number; visual?: unknown; sourceRange?: { start: number; end: number; provenance: 'catalog_cue'; reference: string } }
export type StudyTest = { id: string; title: string; skill: z.infer<typeof novaSkill>; route: string; questions: StudyQuestion[]; premium?: boolean }
export type StudyAttempt = { id: string; testId: string; skill: StudyTest['skill']; title: string; completedAt: string; completed: boolean; answers: Record<string, unknown>; provenance: 'account_sync'; questionStatuses?: Record<string, 'correct' | 'incorrect' | 'skipped'>; writing?: string; transcript?: unknown[]; recordingKey?: string; speakingEvaluation?: unknown }
export type NovaEffect =
  | { type: 'study_control'; action: StudyControl; reference: StudyReference }
  | { type: 'navigate'; path: string; state?: Record<string, unknown>; confirmation: boolean }
  | { type: 'study'; reference: StudyReference }
  | { type: 'vocabulary'; word: { term: string; definition: string; uzbek: string; example: string; synonym: string; context: 'reading' | 'listening' | 'writing' | 'speaking' | 'sat'; origin: string; sourceQuestionId?: string }; confirmation: boolean }
  | { type: 'annotations'; text: string; anchors: WritingAnchor[] }
  | { type: 'play_segment'; reference?: StudyReference; audioUrl: string; start: number; end?: number; label: string }
export type NovaToolResult = { id: string; name: NovaToolCall['name']; ok: true; data: unknown; effect?: NovaEffect } | { id: string; name: NovaToolCall['name']; ok: false; error: { code: string; message: string } }
export const tutorProgressSchema = z.object({
  reference: studyReferenceSchema, questionIndex: z.number().int().min(0).max(1000).default(0),
  step: z.enum(['understand', 'listen', 'attempt', 'hint', 'evidence', 'reinforce']).default('understand'),
  hint: z.number().int().min(0).max(4).default(0), transcriptRevealed: z.boolean().default(false),
  segment: z.object({ start: z.number().finite().min(0), end: z.number().finite().positive().optional(), rate: z.number().min(.5).max(1.5).default(1) }).refine(segment => segment.end === undefined || segment.end > segment.start, 'Audio end must follow start').optional(),
  answers: z.record(z.string().max(5000)).default({}), words: z.array(z.string().max(100)).max(100).default([]),
}).strict()
export type TutorProgress = z.infer<typeof tutorProgressSchema>
