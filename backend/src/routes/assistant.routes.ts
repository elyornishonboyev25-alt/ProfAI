import { Router } from 'express'
import { z } from 'zod'
import { novaCatalog, novaAccountRows, attemptsFromRows, getStudyContext, publicStudyContext } from '../services/novaStudy.service.js'
import { studyReferenceSchema, toolCallSchema } from '../services/novaStudy.js'
import { runNovaTool } from '../services/novaTools.service.js'
import { assistantRequestSchema } from '../services/assistantPolicy.js'
import { answerAssistant } from '../services/assistant.service.js'
import { AiGenerationError } from '../services/aiProvider.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { withStudyAccess, BillingError } from '../services/billing.service.js'
import { requireLiveSession } from '../services/voiceAllowance.service.js'
async function withAssistantAccess<T>(userId: string, delivery: string | undefined, operation: () => Promise<T>) {
  if (delivery === 'voice') { await requireLiveSession(userId); return operation() }
  return withStudyAccess(userId, 'ai', operation)
}
const router = Router()
router.get('/study/catalog', asyncHandler(async (_req, res) => {
  const tests = await novaCatalog()
  res.set('Cache-Control', 'private, no-store').json({ items: tests.map(({ questions, ...test }) => ({ ...test, questionCount: questions.length })) })
}))
router.get('/study/attempts', asyncHandler(async (req, res) => {
  const items = attemptsFromRows(await novaAccountRows(req.user!.id), req.user!.id).map(({ answers, writing, transcript, speakingEvaluation, ...summary }) => summary)
  res.set('Cache-Control', 'private, no-store').json({ items })
}))
router.post('/study/context', asyncHandler(async (req, res) => {
  const input = z.object({ reference: studyReferenceSchema, reveal: z.boolean().default(false), pathname: z.string().max(240).default('') }).strict().parse(req.body)
  const context = await getStudyContext(req.user!.id, input.reference, input.pathname)
  res.set('Cache-Control', 'private, no-store').json(input.reveal ? context : publicStudyContext(context))
}))
router.post('/study/tool', asyncHandler(async (req, res) => {
  const input = z.object({ call: toolCallSchema, reference: studyReferenceSchema.optional(), pathname: z.string().max(240).optional(), writingDraft: z.string().max(16000).optional() }).strict().parse(req.body)
  const controller = new AbortController()
  res.on('close', () => { if (!res.writableEnded) controller.abort() })
  res.json(await runNovaTool(req.user!.id, input.call, input, controller.signal))
}))

router.post('/chat', asyncHandler(async (req, res) => {
  const payload = assistantRequestSchema.parse(req.body)
  const controller = new AbortController()
  const close = () => { if (!res.writableEnded) controller.abort() }
  res.on('close', close)
  try {
    return res.json(await withAssistantAccess(req.user!.id, payload.delivery, () => answerAssistant(req.user!.id, payload, controller.signal)))
  } catch (error) {
    if (controller.signal.aborted) return
    if (error instanceof AiGenerationError) return res.status(error.statusCode).json({ message: error.message, code: error.code })
    throw error
  } finally { res.off('close', close) }
}))

router.post('/stream', asyncHandler(async (req, res) => {
  const payload = assistantRequestSchema.parse(req.body)
  const controller = new AbortController()
  res.on('close', () => { if (!res.writableEnded) controller.abort() })
  const write = (event: string, data: unknown) => { if (!res.destroyed) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`) }
  const heartbeat = setInterval(() => { if (!res.destroyed) res.write(': keep-alive\n\n') }, 10000)
  try {
    const result = await withAssistantAccess(req.user!.id, payload.delivery, async () => {
      res.status(200).set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', 'X-Accel-Buffering': 'no' })
      res.flushHeaders()
      return answerAssistant(req.user!.id, payload, controller.signal, (reply) => write('reply', { reply }))
    })
    write('done', result)
  } catch (error) {
    if (!res.headersSent && error instanceof BillingError) { res.status(error.statusCode).json({ message: error.message, code: error.code }); return }
    if (!controller.signal.aborted) write('error', { message: error instanceof AiGenerationError ? error.message : 'The response could not be completed. Please retry.', code: error instanceof AiGenerationError ? error.code : 'AI_RESPONSE_INCOMPLETE' })
  } finally { clearInterval(heartbeat); res.end() }
}))
export default router
