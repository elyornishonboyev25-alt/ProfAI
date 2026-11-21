import { z } from 'zod'
import { AiGenerationError } from './aiProvider.service.js'
import { getStudyContext, publicStudyContext, novaAccountRows, novaCatalog, attemptsFromRows, hasActiveExam } from './novaStudy.service.js'
import { novaSkill, studyReferenceSchema, toolCallSchema, validWritingAnchors, writingVersion, type NovaToolCall, type NovaToolResult, type StudyReference } from './novaStudy.js'

const empty = z.object({}).strict()
const questionArgs = studyReferenceSchema.omit({ selectedText: true })
const pages = { dashboard: '/dashboard', listening: '/ielts/listening/tests', reading: '/ielts/reading/tests', speaking: '/ielts/speaking/tests', writing: '/ielts/writing/tests', sat: '/sat', vocabulary: '/vocabulary/my-words', results: '/profile', universities: '/admission/universities' } as const
const vocabularyArgs = z.object({ term: z.string().trim().min(1).max(100), definition: z.string().trim().min(1).max(800), uzbek: z.string().trim().min(1).max(800), example: z.string().trim().min(1).max(800), synonym: z.string().max(200).default(''), context: z.enum(['reading', 'listening', 'writing', 'speaking', 'sat']), origin: z.string().max(240), sourceQuestionId: z.string().max(240).optional() }).strict()
export const toolArgumentSchemas = {
  get_page_context: empty, list_available_tests: z.object({ skill: novaSkill.optional(), query: z.string().max(120).optional() }).strict(),
  list_user_attempts: z.object({ skill: novaSkill.optional(), testId: z.string().max(240).optional() }).strict(),
  open_page: z.object({ page: z.enum(Object.keys(pages) as [keyof typeof pages, ...(keyof typeof pages)[]]) }).strict(),
  open_attempt_analysis: z.object({ attemptId: z.string().min(1).max(240) }).strict(),
  start_practice: z.object({ skill: novaSkill, testId: z.string().min(1).max(240) }).strict(),
  get_question_context: questionArgs, get_answer_evidence: questionArgs, get_listening_segment: questionArgs, play_listening_segment: questionArgs,
  get_speaking_question_set: z.object({ testId: z.string().min(1).max(240) }).strict(),
  get_speaking_recording: z.object({ attemptId: z.string().min(1).max(240) }).strict(), save_vocabulary: vocabularyArgs,
  start_vocabulary_review: z.object({ context: z.enum(['reading', 'listening', 'writing', 'speaking', 'sat']).default('speaking') }).strict(),
  annotate_writing: z.object({ annotations: z.array(z.unknown()).max(30) }).strict(), show_whiteboard: empty, update_whiteboard: empty,
}
type Environment = { reference?: StudyReference; pathname?: string; writingDraft?: string; learnerMessage?: string; vocabularyAutoSave?: boolean }
const finished = new Map<string, { fingerprint: string; result: NovaToolResult; expires: number }>()
export async function runNovaTool(userId: string, raw: unknown, environment: Environment = {}, signal?: AbortSignal): Promise<NovaToolResult> {
  const call = toolCallSchema.parse(raw), key = `${userId}:${call.id}`
  const fingerprint = JSON.stringify({ call, environment })
  signal?.throwIfAborted()
  const old = finished.get(key)
  if (old && old.expires > Date.now()) {
    if (old.fingerprint !== fingerprint) return { id: call.id, name: call.name, ok: false, error: { code: 'TOOL_ID_REUSED', message: 'Use a new call ID for different arguments or context.' } }
    return old.result
  }
  let result: NovaToolResult
  try {
    // Validate even read-only calls. Never accept model URL, SQL, shell or JS input.
    const args = toolArgumentSchemas[call.name].parse(call.args) as Record<string, any>
    const rows = await novaAccountRows(userId)
    signal?.throwIfAborted()
    if (hasActiveExam(rows) || environment.reference?.mode === 'exam') throw new AiGenerationError(409, 'ACTIVE_EXAM', 'Finish the active timed attempt before using study tools.')
    const attempts = attemptsFromRows(rows, userId)
    let data: unknown, effect: Extract<NovaToolResult, { ok: true }>['effect']
    switch (call.name) {
      case 'get_page_context': data = environment.reference ? publicStudyContext(await getStudyContext(userId, environment.reference, environment.pathname)) : { pathname: environment.pathname, selectedContext: null }; break
      case 'list_available_tests': data = (await novaCatalog()).filter(test => (!args.skill || args.skill === test.skill) && (!args.query || `${test.title} ${test.id}`.toLowerCase().includes(args.query.toLowerCase()))).slice(0, 60).map(({ questions, ...test }) => ({ ...test, questionCount: questions.length })); break
      case 'list_user_attempts': data = attempts.filter(a => (!args.skill || a.skill === args.skill) && (!args.testId || a.testId === args.testId)).slice(0, 40).map(({ answers, writing, transcript, speakingEvaluation, ...summary }) => summary); break
      case 'open_page': effect = { type: 'navigate', path: pages[args.page as keyof typeof pages], confirmation: false }; data = { status: 'ready_to_open' }; break
      case 'open_attempt_analysis': {
        const a = attempts.find(a => a.id === args.attemptId)
        if (!a) throw new AiGenerationError(404, 'ATTEMPT_NOT_FOUND', 'Attempt not found in your synced history.')
        const reference: StudyReference = { skill: a.skill, testId: a.testId, attemptId: a.id, mode: 'analyze' }
        await getStudyContext(userId, reference, environment.pathname)
        effect = { type: 'study', reference }; data = { status: 'ready_to_open', ...a, answers: undefined, writing: undefined, transcript: undefined }; break
      }
      case 'start_practice': {
        const reference: StudyReference = { skill: args.skill, testId: args.testId, mode: 'practice' }
        await getStudyContext(userId, reference, environment.pathname)
        effect = { type: 'study', reference }; data = { status: 'ready_to_practice', originalAttemptUnchanged: true }; break
      }
      case 'get_question_context': case 'get_answer_evidence': case 'get_listening_segment': case 'play_listening_segment': {
        const context = await getStudyContext(userId, args, environment.pathname)
        if (call.name === 'get_question_context') { data = publicStudyContext(context); break }
        if (call.name === 'get_answer_evidence') { data = context.evidence; break }
        if (!context.question.audioUrl) throw new AiGenerationError(404, 'SOURCE_AUDIO_UNAVAILABLE', 'The original source audio is unavailable for this question.')
        // The catalog supplies source recordings, not invented sentence timestamps.
        const range = context.question.sourceRange
        data = { audioUrl: context.question.audioUrl, start: range?.start ?? 0, end: range?.end ?? context.question.duration, alignment: range ? 'source_cue' : 'unavailable', scope: range ? 'catalog_timestamp_range' : 'original_recording', provenance: range?.reference, message: range ? 'Existing catalog timestamp cue, not newly verified sentence alignment. Adjust boundaries if needed.' : 'Sentence alignment is not available. Select a range in the original recording.' }
        if (call.name === 'play_listening_segment') effect = { type: 'play_segment', audioUrl: context.question.audioUrl, start: range?.start ?? 0, end: range?.end ?? context.question.duration, label: range ? 'Original recording — catalog cue' : 'Original recording — unaligned' }
        break
      }
      case 'get_speaking_question_set': {
        const test = (await novaCatalog()).find(t => t.id === args.testId && t.skill === 'speaking')
        if (!test) throw new AiGenerationError(404, 'TEST_NOT_FOUND', 'Speaking set not found in the source catalog.')
        data = { ...test, recordedAttempts: attempts.filter(a => a.testId === test.id).map(a => ({ id: a.id, completed: a.completed, date: a.completedAt })), historyScope: 'synced_records_only' }; break
      }
      case 'get_speaking_recording': {
        const a = attempts.find(a => a.id === args.attemptId && a.skill === 'speaking' && a.completed)
        if (!a) throw new AiGenerationError(404, 'ATTEMPT_NOT_FOUND', 'Speaking attempt not found.')
        data = { transcript: a.transcript ?? [], recordingAvailableOnServer: false, pronunciationAssessable: false, message: 'Original recordings remain in the browser audio store. Text alone cannot establish pronunciation.' }; break
      }
      case 'save_vocabulary': {
        const word = vocabularyArgs.parse(args)
        const explicit = /(?:qo[‘’'ʻ]?sh|saqla|add|save)/i.test(environment.learnerMessage ?? '') && (environment.learnerMessage ?? '').toLowerCase().includes(word.term.toLowerCase())
        const allowed = explicit || environment.vocabularyAutoSave === true
        effect = { type: 'vocabulary', word, confirmation: !allowed }; data = { status: allowed ? 'awaiting_browser_save' : 'awaiting_browser_consent_and_save' }; break
      }
      case 'start_vocabulary_review': effect = { type: 'navigate', path: `/vocabulary/my-words/${args.context}/flashcards`, confirmation: false }; data = { status: 'ready_to_open' }; break
      case 'annotate_writing': {
        const text = environment.writingDraft
        if (!text) throw new AiGenerationError(409, 'WRITING_DRAFT_REQUIRED', 'Select the current writing paragraph first.')
        const anchors = validWritingAnchors(text, args.annotations)
        if (!anchors.length) throw new AiGenerationError(409, 'STALE_WRITING_ANCHOR', 'Annotations must quote the exact current draft version and offsets.')
        effect = { type: 'annotations', text, anchors }; data = { version: writingVersion(text), annotations: anchors }; break
      }
      case 'show_whiteboard': case 'update_whiteboard': data = { useStructuredLesson: true, reference: environment.reference ?? null }; if (environment.reference) effect = { type: 'study', reference: environment.reference }; break
    }
    signal?.throwIfAborted()
    result = { id: call.id, name: call.name, ok: true, data, ...(effect ? { effect } : {}) }
  } catch (error) {
    signal?.throwIfAborted()
    result = { id: call.id, name: call.name, ok: false, error: { code: error instanceof AiGenerationError ? error.code : error instanceof z.ZodError ? 'INVALID_ARGUMENTS' : 'TOOL_FAILED', message: error instanceof AiGenerationError ? error.message : 'The study tool could not finish. Retry with valid source context.' } }
  }
  // Effects are browser proposals, not server mutations. Replay IDs cannot repeat a save.
  finished.set(key, { fingerprint, result, expires: Date.now() + 300_000 })
  for (const [id, entry] of finished) if (entry.expires < Date.now() || finished.size > 2000) finished.delete(id)
  return result
}
