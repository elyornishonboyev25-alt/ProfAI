import { randomBytes, createHash } from 'node:crypto'
import type { Server } from 'node:http'
import WebSocket, { WebSocketServer } from 'ws'
import { z } from 'zod'
import { env } from '../config/env.js'
import { prisma } from '../lib/prisma.js'
import { AiGenerationError } from './aiProvider.service.js'
import { assistantContextSchema, assistantRequestSchema, boundedHistory, type AssistantContext } from './assistantPolicy.js'
import { answerAssistant, assistantData, loadAssistantRecords } from './assistant.service.js'
import { reserveVoiceTime, settleVoiceTime, requireVoiceReservation, onVoiceReservationReplaced } from './voiceAllowance.service.js'
import { voiceInstructions } from './voiceInstructions.js'
import { geminiLiveKeys, naturalVoiceProvider } from './voiceProvider.js'
import { onAccountDeleted } from './accountLifecycle.js'
import { openGeminiLive } from './geminiLiveTransport.js'

type History = Array<{ role: 'user' | 'assistant'; content: string }>
type Call = {
  id: string; userId: string; provider: WebSocket; client: WebSocket | null; ticketHash: string | null
  context: AssistantContext; history: History; timer: NodeJS.Timeout; abort: AbortController
  expiresAt: Date
  input: string; output: string; tools: Set<string>; cancelledTools: Set<string>; greeted: boolean
}
const calls = new Map<string, Call>()
const digest = (value: string) => createHash('sha256').update(value).digest('hex')
export const GEMINI_VOICE_PATH = '/ws/ai-coach'

/** A deployment smoke check uses the same endpoint and model as real calls. */
export async function probeGeminiLive() {
  if (naturalVoiceProvider() !== 'gemini') return
  const started = Date.now()
  try {
    const socket = await openGeminiLive(geminiLiveSetup(assistantContextSchema.parse({}), {}), geminiLiveKeys(), AbortSignal.timeout(18000))
    socket.on('error', () => {}); socket.close()
    console.info('voice.gemini.readiness', { ready: true, model: env.GEMINI_LIVE_MODEL, durationMs: Date.now() - started })
  } catch {
    console.error('voice.gemini.readiness', { ready: false, model: env.GEMINI_LIVE_MODEL, code: 'GEMINI_LIVE_CONNECTION_FAILED' })
  }
}
export const geminiVoiceFrame = z.discriminatedUnion('type', [
  z.object({ type: z.literal('audio'), data: z.string().min(4).max(44000).regex(/^[A-Za-z0-9+/]+={0,2}$/) }).strict(),
  z.object({ type: z.literal('interrupt') }).strict(),
  z.object({ type: z.literal('mute'), muted: z.boolean() }).strict(),
  z.object({ type: z.literal('feedback') }).strict(),
  z.object({ type: z.literal('ping') }).strict(),
  z.object({ type: z.literal('start') }).strict(),
])

export function geminiLiveSetup(context: AssistantContext, data: unknown) {
  return { setup: {
    model: `models/${env.GEMINI_LIVE_MODEL.replace(/^models\//, '')}`,
    generationConfig: { responseModalities: ['AUDIO'], maxOutputTokens: 2048,
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } },
    systemInstruction: { parts: [{ text: voiceInstructions(context, data) }] },
    inputAudioTranscription: {}, outputAudioTranscription: {},
    realtimeInputConfig: { automaticActivityDetection: { disabled: false, silenceDurationMs: context.mode === 'examiner' ? 1400 : 650, prefixPaddingMs: 300 }, activityHandling: 'START_OF_ACTIVITY_INTERRUPTS' },
    contextWindowCompression: { slidingWindow: {} },
    tools: [{ functionDeclarations: [{ name: 'ask_coach', description: 'Get checked written coaching, practice feedback, a study plan, a saved preference or an app navigation proposal.',
      parameters: { type: 'OBJECT', properties: { request: { type: 'STRING' } }, required: ['request'] } }] }],
  } }
}

function send(socket: WebSocket | null, message: unknown) {
  if (socket?.readyState !== WebSocket.OPEN) return
  if (socket.bufferedAmount > 1_000_000) { socket.close(1013, 'Connection too slow'); return }
  socket.send(JSON.stringify(message))
}

function rememberTurn(call: Call, role: 'user' | 'assistant', text: string) {
  if (text.trim()) call.history = boundedHistory([...call.history, { role, content: text.trim().slice(0, 12000) }])
}

export async function endGeminiVoiceCall(userId: string, id: string, failed = false) {
  const call = calls.get(id)
  if (!call || call.userId !== userId) return false
  calls.delete(id); clearTimeout(call.timer); call.abort.abort()
  call.provider.close(); call.client?.close(1000, 'Session ended')
  await settleVoiceTime(userId, id, failed || !call.client)
  return true
}

export async function updateGeminiVoiceContext(userId: string, id: string, context: AssistantContext) {
  const call = calls.get(id)
  if (!call || call.userId !== userId) return false
  const next = { ...context, threadId: call.context.threadId ?? context.threadId }
  // Validate account ownership before adopting a server-backed thread ID.
  await loadAssistantRecords(userId, next.threadId)
  if (call.abort.signal.aborted) return false
  call.context = next
  // Gemini setup is immutable. Page context is data, delivered with the next
  // checked coach request rather than interrupting live speech on every route.
  return true
}

async function runTool(call: Call, tool: { id?: string; name?: string; args?: { request?: string } }) {
  const id = tool.id
  if (!id || call.tools.has(id)) return
  call.tools.add(id)
  if (call.tools.size > 100) { await endGeminiVoiceCall(call.userId, call.id); return }
  const respond = (response: unknown) => {
    if (!call.abort.signal.aborted && !call.cancelledTools.has(id)) send(call.provider, { toolResponse: { functionResponses: [{ id, name: tool.name, response }] } })
  }
  if (tool.name !== 'ask_coach' || typeof tool.args?.request !== 'string' || !tool.args.request.trim()) { respond({ error: 'Unsupported request.' }); return }
  try {
    const request = assistantRequestSchema.parse({ ...call.context, message: tool.args.request, history: boundedHistory(call.history), delivery: 'voice' })
    const result = await answerAssistant(call.userId, request, call.abort.signal)
    if (call.abort.signal.aborted || call.cancelledTools.has(id)) return
    send(call.client, { type: 'coach', id, result })
    respond(result)
  } catch { respond({ error: 'The written coach could not finish. Ask the learner to retry; do not invent results.' }) }
}

export async function startGeminiVoiceCall(userId: string, context: AssistantContext, history: History, signal?: AbortSignal, connectProvider = openGeminiLive, clientId?: string) {
  const keys = geminiLiveKeys()
  if (!keys.length) throw new AiGenerationError(503, 'VOICE_NOT_CONFIGURED', 'Gemini Live is not configured on this server.')
  const records = await loadAssistantRecords(userId, context.threadId)
  signal?.throwIfAborted()
  const reservation = await reserveVoiceTime(userId, env.AI_VOICE_MAX_MINUTES * 60, new Date(), clientId)
  const startedAt = Date.now()
  let provider: WebSocket | undefined
  try {
    // The credential stays on the server, including when multiple keys rotate.
    // A setup acknowledgement is required before returning a browser ticket.
    provider = await connectProvider(geminiLiveSetup(context, assistantData(context, records)), keys, signal)
    signal?.throwIfAborted()
    await requireVoiceReservation(userId, reservation.id)
    const ticket = randomBytes(32).toString('base64url')
    const call: Call = { id: reservation.id, userId, provider, client: null, ticketHash: digest(ticket), context, history: boundedHistory(history), expiresAt: reservation.expiresAt, abort: new AbortController(), input: '', output: '', tools: new Set(), cancelledTools: new Set(), greeted: false,
      timer: setTimeout(() => { void endGeminiVoiceCall(userId, reservation.id, true).catch(() => {}) }, 25000) }
    call.timer.unref(); calls.set(call.id, call)
    provider.on('message', raw => {
      let event: any
      try { event = JSON.parse(String(raw)) } catch { return }
      if (event.error) { send(call.client, { type: 'error', message: 'Gemini Live could not complete this turn. Please retry.' }); void endGeminiVoiceCall(userId, call.id).catch(() => {}); return }
      const content = event.serverContent
      if (content) {
        if (content.inputTranscription?.text) call.input = (call.input + content.inputTranscription.text).slice(-12000)
        if (content.outputTranscription?.text) call.output = (call.output + content.outputTranscription.text).slice(-12000)
        if (content.interrupted || content.turnComplete) {
          rememberTurn(call, 'user', call.input); rememberTurn(call, 'assistant', call.output)
          call.input = ''; call.output = ''
        }
        // Forward the audio/transcript envelope only, never credentials or context.
        send(call.client, { type: 'content', content })
      }
      if (event.toolCallCancellation?.ids) for (const id of event.toolCallCancellation.ids) call.cancelledTools.add(id)
      if (event.toolCall?.functionCalls) for (const tool of event.toolCall.functionCalls) void runTool(call, tool)
      if (event.usageMetadata) void prisma.aiUsageEvent.create({ data: { userId, purpose: 'assistant_voice', provider: 'gemini', model: env.GEMINI_LIVE_MODEL, status: 'success', requestChars: 0, latencyMs: Math.max(0, Date.now() - startedAt), inputTokens: event.usageMetadata.promptTokenCount ?? null, outputTokens: event.usageMetadata.responseTokenCount ?? null } }).catch(() => {})
    })
    provider.once('close', () => { send(call.client, { type: 'error', message: 'The live voice session ended. Retry to reconnect; your chat is saved.' }); void endGeminiVoiceCall(userId, call.id).catch(() => {}) })
    provider.on('error', () => { void endGeminiVoiceCall(userId, call.id).catch(() => {}) })
    return { id: call.id, ticket, expiresAt: reservation.expiresAt.toISOString(), provider: 'gemini' as const, model: env.GEMINI_LIVE_MODEL, streamPath: GEMINI_VOICE_PATH }
  } catch (error) {
    provider?.close(); await settleVoiceTime(userId, reservation.id, true); throw error
  }
}

export function attachGeminiVoice(server: Server) {
  const wss = new WebSocketServer({ noServer: true, maxPayload: 64000 })
  server.on('upgrade', (req, socket, head) => {
    if (req.url?.split('?')[0] !== GEMINI_VOICE_PATH) return
    wss.handleUpgrade(req, socket, head, client => wss.emit('connection', client))
  })
  wss.on('connection', client => {
    let active: Call | undefined
    let alive = true
    let windowStart = Date.now(), bytes = 0, frames = 0
    const authTimer = setTimeout(() => client.close(1008, 'Session ticket required'), 5000)
    authTimer.unref()
    const heartbeat = setInterval(() => { if (!alive) { client.terminate(); return } alive = false; client.ping() }, 15000)
    heartbeat.unref()
    client.on('pong', () => { alive = true })
    client.on('message', raw => {
      try {
        const event = JSON.parse(String(raw))
        if (!active) {
          if (typeof event.ticket !== 'string' || event.ticket.length !== 43) { client.close(1008, 'Invalid ticket'); return }
          const hash = digest(event.ticket)
          const call = [...calls.values()].find(item => item.ticketHash === hash && !item.client)
          if (!call || call.abort.signal.aborted) { client.close(1008, 'Expired ticket'); return }
          active = call; call.client = client; call.ticketHash = null
          clearTimeout(authTimer); clearTimeout(call.timer)
          // Keep the original database reservation deadline; attaching the
          // transport cannot extend time or reset the learner's allowance.
          if (call.expiresAt.getTime() <= Date.now()) { void endGeminiVoiceCall(call.userId, call.id).catch(() => {}); return }
          call.timer = setTimeout(() => { void endGeminiVoiceCall(call.userId, call.id).catch(() => {}) }, call.expiresAt.getTime() - Date.now()); call.timer.unref()
          send(client, { type: 'ready' })
          return
        }
        if (Date.now() - windowStart >= 1000) { windowStart = Date.now(); bytes = 0; frames = 0 }
        bytes += Buffer.byteLength(String(raw)); frames++
        if (bytes > 100000 || frames > 60) { client.close(1008, 'Audio rate exceeded'); return }
        const frame = geminiVoiceFrame.parse(event)
        if (frame.type === 'audio') {
          const data = Buffer.from(frame.data, 'base64')
          if (data.length % 2 || data.length > 32000) { client.close(1008, 'Invalid PCM audio'); return }
          send(active.provider, { realtimeInput: { audio: { data: frame.data, mimeType: 'audio/pcm;rate=16000' } } })
        } else if (frame.type === 'start' && !active.greeted) {
          active.greeted = true
          send(active.provider, { clientContent: { turns: [...active.history.map(turn => ({ role: turn.role === 'assistant' ? 'model' : 'user', parts: [{ text: turn.content }] })), { role: 'user', parts: [{ text: active.context.mode === 'examiner' ? 'Begin the IELTS Speaking mock. Ask one question in English.' : 'Greet me briefly in the selected language and invite my next question.' }] }], turnComplete: true } })
        } else if (frame.type === 'mute' && frame.muted) send(active.provider, { realtimeInput: { audioStreamEnd: true } })
        else if (frame.type === 'interrupt') send(active.provider, { clientContent: { turns: [{ role: 'user', parts: [{ text: 'Please stop speaking and listen to my next question.' }] }], turnComplete: false } })
        else if (frame.type === 'feedback') send(active.provider, { clientContent: { turns: [{ role: 'user', parts: [{ text: 'End this examiner practice and call ask_coach for written feedback on my actual answers. Do not invent a pronunciation score from a text transcript.' }] }], turnComplete: true } })
      } catch { client.close(1008, 'Invalid voice frame') }
    })
    const close = () => {
      clearTimeout(authTimer); clearInterval(heartbeat)
      if (active) void endGeminiVoiceCall(active.userId, active.id).catch(() => {})
    }
    client.on('close', close); client.on('error', close)
  })
  server.on('close', () => { for (const call of calls.values()) void endGeminiVoiceCall(call.userId, call.id).catch(() => {}); wss.close() })
  return wss
}

onAccountDeleted(async userId => { await Promise.all([...calls.values()].filter(call => call.userId === userId).map(call => endGeminiVoiceCall(userId, call.id))) })
onVoiceReservationReplaced((userId, id) => endGeminiVoiceCall(userId, id))
export { assistantContextSchema }
