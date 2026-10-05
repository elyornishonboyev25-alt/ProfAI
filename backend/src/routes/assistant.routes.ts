import { Router } from 'express'
import { assistantRequestSchema } from '../services/assistantPolicy.js'
import { answerAssistant } from '../services/assistant.service.js'
import { AiGenerationError } from '../services/aiProvider.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'
const router = Router()

router.post('/chat', asyncHandler(async (req, res) => {
  const payload = assistantRequestSchema.parse(req.body)
  const controller = new AbortController()
  const close = () => { if (!res.writableEnded) controller.abort() }
  res.on('close', close)
  try {
    return res.json(await answerAssistant(req.user!.id, payload, controller.signal))
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
  res.status(200).set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', 'X-Accel-Buffering': 'no' })
  res.flushHeaders()
  const write = (event: string, data: unknown) => { if (!res.destroyed) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`) }
  const heartbeat = setInterval(() => { if (!res.destroyed) res.write(': keep-alive\n\n') }, 10000)
  try {
    const result = await answerAssistant(req.user!.id, payload, controller.signal, (reply) => write('reply', { reply }))
    write('done', result)
  } catch (error) {
    if (!controller.signal.aborted) write('error', { message: error instanceof AiGenerationError ? error.message : 'The response could not be completed. Please retry.', code: error instanceof AiGenerationError ? error.code : 'AI_RESPONSE_INCOMPLETE' })
  } finally { clearInterval(heartbeat); res.end() }
}))
export default router
