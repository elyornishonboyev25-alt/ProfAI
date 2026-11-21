import {banterOpening} from './novaBanter.js'
import { assertNovaVoiceStudyAllowed } from './novaStudy.service.js'
import { lessonControlSchema, lessonControlParameters } from './novaLesson.js'
import { NovaDiagnostics } from './novaDiagnostics.js'
import { novaVocabulary } from './novaLanguage.js'
import { inspectLanguage } from './novaLanguage.js'
import { saveVoiceDiagnostics } from './novaDiagnostics.service.js'
import { saveLearningEvidence } from './novaLearning.service.js'
import { learningObservationParameters } from './novaLearning.js'
import { novaPerformanceParameters, readNovaPerformance, examPerformance } from './novaPersona.js'
import { onAccountDeleted } from './accountLifecycle.js'
import { createHash } from 'node:crypto'
import WebSocket from 'ws'
import { env } from '../config/env.js'
import { voiceInstructions } from './voiceInstructions.js'
import { prisma } from '../lib/prisma.js'
import { AiGenerationError } from './aiProvider.service.js'
import { assistantContextSchema, assistantRequestSchema, boundedHistory, type AssistantContext } from './assistantPolicy.js'
import { answerAssistant, assistantData, loadAssistantRecords } from './assistant.service.js'
import { reserveVoiceTime, settleVoiceTime, requireVoiceReservation, onVoiceReservationReplaced } from './voiceAllowance.service.js'
import { BillingError } from './billing.service.js'
import { endGeminiVoiceCall, updateGeminiVoiceContext } from './geminiLive.service.js'

type VoiceCall = { diagnostics: NovaDiagnostics; toolAborts: Map<string, AbortController>; id: string; userId: string; callId: string; socket: WebSocket; timer: NodeJS.Timeout; abort: AbortController; context: AssistantContext; contextVersion: number; history: Array<{ role: 'user' | 'assistant'; content: string }> }
const calls = new Map<string, VoiceCall>()
function contextSignature(context: AssistantContext) {
  return JSON.stringify(context, (_key, value) => value && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b))) : value)
}
onAccountDeleted(async (userId) => {
  await Promise.all([...calls.values()].filter(call => call.userId === userId).map(call => endVoiceCall(userId, call.id)))
})

export { voiceInstructions } from './voiceInstructions.js'

async function hangup(callId: string) {
  await fetch(`${env.OPENAI_API_BASE.replace(/\/$/, '')}/realtime/calls/${encodeURIComponent(callId)}/hangup`, {
    method: 'POST', headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` }, signal: AbortSignal.timeout(8000),
  }).catch(() => {})
}
export async function endVoiceCall(userId: string, id: string) {
  if (await endGeminiVoiceCall(userId, id)) return true
  const call = calls.get(id)
  if (!call) {
    const saved = await prisma.voiceAllowanceSession.findFirst({ where: { id, userId, endedAt: null } })
    if (!saved) return false
    if (saved.providerCallId) await hangup(saved.providerCallId)
    await settleVoiceTime(userId, id)
    return true
  }
  if (call.userId !== userId) return false
  calls.delete(id)
  clearTimeout(call.timer)
  call.abort.abort()
  for (const controller of call.toolAborts.values()) controller.abort()
  void saveVoiceDiagnostics(userId, id, 'server', 'openai', env.AI_VOICE_MODEL, call.diagnostics.snapshot()).catch(() => {})
  call.socket.close()
  await hangup(call.callId)
  await settleVoiceTime(userId, id)
  return true
}

export async function updateVoiceContext(userId: string, id: string, context: AssistantContext) {
  if (await updateGeminiVoiceContext(userId, id, context)) return true
  const call = calls.get(id)
  if (!call || call.userId !== userId) return false
  await assertNovaVoiceStudyAllowed(userId, context)
  // The call remains attached to its original chat even when the learner navigates.
  const next = { ...context, threadId: call.context.threadId ?? context.threadId }
  const version = ++call.contextVersion
  if (contextSignature(next) === contextSignature(call.context)) return true
  const records = await loadAssistantRecords(userId, next.threadId)
  if (call.abort.signal.aborted) return false
  if (version !== call.contextVersion) return true
  call.context = next
  if (call.socket.readyState === WebSocket.OPEN) call.socket.send(JSON.stringify({ type: 'session.update', session: { type: 'realtime', instructions: voiceInstructions(next, assistantData(next, records)) } }))
  return true
}

export async function startVoiceCall(userId: string, sdp: string, context: AssistantContext, history: VoiceCall['history'], signal?: AbortSignal, clientId?: string) {
  await assertNovaVoiceStudyAllowed(userId, context)
  if (!env.OPENAI_API_KEY) throw new AiGenerationError(503, 'VOICE_NOT_CONFIGURED', 'Natural voice is not connected yet. You can use standard voice or type in chat.')
  const started = performance.now()
  // Read only this authenticated learner's records while reserving allowance.
  // No provider connection starts until both checks have succeeded.
  const [reserved, loaded] = await Promise.allSettled([
    reserveVoiceTime(userId, env.AI_VOICE_MAX_MINUTES * 60, new Date(), clientId),
    loadAssistantRecords(userId, context.threadId),
  ])
  if (reserved.status === 'rejected') throw reserved.reason
  const reservation = reserved.value
  try {
    if (loaded.status === 'rejected') throw loaded.reason
    signal?.throwIfAborted()
    await requireVoiceReservation(userId, reservation.id)
    return await startReservedVoiceCall(userId, sdp, context, history, reservation.id, reservation.expiresAt, loaded.value, started, signal)
  } catch (error) {
    const saved = await prisma.voiceAllowanceSession.findFirst({ where: { id: reservation.id, userId } })
    if (saved?.providerCallId) await hangup(saved.providerCallId)
    await settleVoiceTime(userId, reservation.id, true)
    throw error
  }
}

async function startReservedVoiceCall(userId: string, sdp: string, context: AssistantContext, history: VoiceCall['history'], id: string, expiresAt: Date, records: Awaited<ReturnType<typeof loadAssistantRecords>>, started: number, signal?: AbortSignal) {
  const prepared = performance.now()
  const session = {
    type: 'realtime', model: env.AI_VOICE_MODEL, instructions: voiceInstructions(context, assistantData(context, records)),
    output_modalities: ['audio'], max_output_tokens: 2400,
    audio: { input: { noise_reduction: { type: 'near_field' }, transcription: { model: 'gpt-4o-transcribe', ...(context.language !== 'auto' ? { language: context.language } : {}), prompt: `Transcribe verbatim. Conversation languages: Uzbek and English; current language ${context.language === 'auto' ? context.lastReliableLanguage ?? 'uz' : context.language}. Preserve mixed terminology and Uzbek Latin names: ${novaVocabulary.join(', ')}. Do not translate or invent speech. Uzbek is not Turkish or Arabic.` },
      turn_detection: { type: 'semantic_vad', eagerness: context.mode === 'examiner' ? 'low' : 'medium', create_response: true, interrupt_response: true } }, output: { voice: 'marin', speed: context.mode === 'examiner' ? 1 : 1.1 } },
    tools: [{type:'function',name:'control_lesson',description:'Continue, restart or pause the existing lesson board on explicit request.',parameters:lessonControlParameters}, { type: 'function', name: 'observe_learning', description: 'Record a quoted actual learner attempt; never assess a mere question.', parameters: learningObservationParameters }, { type: 'function', name: 'set_expression', description: 'Choose the illustrative avatar delivery for your upcoming spoken reply.', parameters: novaPerformanceParameters }, { type: 'function', name: 'ask_coach', description: 'Ask the shared tutor for accurate detailed coaching, current official research, a saved memory or an app action proposal. Returns a written answer plus actions for the learner to approve.',
      parameters: { type: 'object', properties: { request: { type: 'string', description: 'The learner\'s actual request, including relevant wording.' } }, required: ['request'], additionalProperties: false } }],
    tool_choice: 'auto',
  }
  const form = new FormData()
  form.set('sdp', sdp); form.set('session', JSON.stringify(session))
  const response = await fetch(`${env.OPENAI_API_BASE.replace(/\/$/, '')}/realtime/calls`, {
    method: 'POST', body: form, signal: AbortSignal.any([AbortSignal.timeout(30000), ...(signal ? [signal] : [])]),
    headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, 'OpenAI-Safety-Identifier': createHash('sha256').update(userId).digest('hex') },
  })
  if (!response.ok) throw new AiGenerationError(502, 'VOICE_CONNECTION_FAILED', 'Natural voice could not connect. Retry or use standard voice.')
  const answer = await response.text()
  const negotiated = performance.now()
  const location = response.headers.get('location')
  const callId = location?.split('/').pop()?.split('?')[0]
  if (!answer.startsWith('v=') || !callId || !/^[A-Za-z0-9_-]+$/.test(callId)) throw new AiGenerationError(502, 'VOICE_INVALID_SESSION', 'Voice returned an invalid session. Please retry.')
  await prisma.voiceAllowanceSession.update({ where: { id }, data: { providerCallId: callId } })
  const socketUrl = new URL(env.OPENAI_API_BASE.replace(/\/$/, '') + '/realtime')
  socketUrl.protocol = socketUrl.protocol === 'https:' ? 'wss:' : 'ws:'
  socketUrl.searchParams.set('call_id', callId)
  const socket = new WebSocket(socketUrl, { headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` } })
  const abort = new AbortController()
  const call: VoiceCall = { id, userId, callId, socket, abort, diagnostics: new NovaDiagnostics(), toolAborts: new Map(), context, contextVersion: 0, history: boundedHistory(history), timer: setTimeout(() => { void endVoiceCall(userId, id).catch(() => {}) }, Math.max(0, expiresAt.getTime() - Date.now())) }
  call.timer.unref()
  const handledTools = new Set<string>()
  let speechVersion = 0
  let responding = false
  let activeResponseId = ''
  const cancelledResponses = new Set<string>()
  const responseStarts = new Map<string, number>()
  let pendingToolVersion: number | null = null
  const observed = new Set<string>()
  const send = (value: unknown) => { if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(value)) }
  const continueAfterTool = () => {
    if (!abort.signal.aborted && pendingToolVersion === speechVersion && !responding) {
      pendingToolVersion = null
      send({ type: 'response.create' })
    }
  }
  socket.on('message', (raw) => {
    let event: any
    try { event = JSON.parse(String(raw)) } catch { return }
    if (event.event_id && observed.has(event.event_id)) return
    if (event.event_id) { observed.add(event.event_id); if (observed.size > 500) observed.delete(observed.values().next().value!) }
    const manualStop = ['conversation.item.created', 'conversation.item.added'].includes(event.type) && event.item?.role === 'user' && event.item?.content?.some((part: any) => part.type === 'input_text' && part.text === '[Nova control] Stop this reply and wait for my next question.')
    if (event.type === 'input_audio_buffer.speech_started' || manualStop) {
      speechVersion++; pendingToolVersion = null
      for (const controller of call.toolAborts.values()) controller.abort()
      if (activeResponseId) cancelledResponses.add(activeResponseId)
    }
    if (event.type === 'response.function_call_arguments.done' && cancelledResponses.has(event.response_id)) return
    if (event.type === 'response.created') { call.diagnostics.count('modelCalls'); responding = true; activeResponseId = event.response?.id ?? ''; if (event.response?.id) responseStarts.set(event.response.id, Date.now()) }
    if (event.type === 'conversation.item.input_audio_transcription.completed' && event.transcript?.trim()) {
      if (inspectLanguage(event.transcript).status === 'unsupported') { send({ type: 'conversation.item.delete', item_id: event.item_id }); return }
      call.history.push({ role: 'user', content: event.transcript }); call.history = boundedHistory(call.history)
    }
    if (event.type === 'response.output_audio_transcript.done' && event.transcript?.trim() && !cancelledResponses.has(event.response_id)) {
      call.history.push({ role: 'assistant', content: event.transcript }); call.history = boundedHistory(call.history)
    }
    if (event.type === 'response.done') {
      if (event.response?.status === 'cancelled') {
        cancelledResponses.add(event.response.id); speechVersion++; pendingToolVersion = null
      }
      if (!event.response?.id || event.response.id === activeResponseId) responding = false
      continueAfterTool()
      const usage = event.response?.usage
      const responseStarted = responseStarts.get(event.response?.id) ?? Date.now()
      responseStarts.delete(event.response?.id)
      if (usage) call.diagnostics.tokens(usage.input_tokens, usage.output_tokens, 'response_totals')
      if (usage) void prisma.aiUsageEvent.create({ data: { userId, purpose: 'assistant_voice', provider: 'openai', model: env.AI_VOICE_MODEL, status: event.response?.status === 'failed' ? 'FAILED' : 'SUCCESS', requestChars: 0, responseChars: 0, inputTokens: usage.input_tokens, outputTokens: usage.output_tokens, latencyMs: Date.now() - responseStarted, fallbackUsed: false } }).catch(() => {})
    }
    if (event.type === 'response.function_call_arguments.done' && event.name === 'control_lesson' && !handledTools.has(event.call_id)) {
      handledTools.add(event.call_id)
      let action; try { action = lessonControlSchema.safeParse(JSON.parse(event.arguments).action) } catch {}
      send({ type: 'conversation.item.create', item: { type: 'function_call_output', call_id: event.call_id, output: JSON.stringify({ nova_lesson_control: call.context.mode !== 'examiner' && Boolean(action?.success), action: action?.success ? action.data : null }) } })
      pendingToolVersion = speechVersion; continueAfterTool(); return
    }
    if (event.type === 'response.function_call_arguments.done' && event.name === 'observe_learning' && !handledTools.has(event.call_id)) {
      handledTools.add(event.call_id); call.diagnostics.count('toolCalls')
      const version = speechVersion
      void (async () => {
        let recorded = false
        try {
          const args = JSON.parse(event.arguments)
          const source = call.history.filter(turn => turn.role === 'user').at(-1)?.content ?? ''
          if (call.context.mode !== 'examiner') recorded = (await saveLearningEvidence(userId, source, [args], { threadId: call.context.threadId, turnId: `voice:${id}:${speechVersion}`, signal: abort.signal })).length > 0
        } catch {}
        if (abort.signal.aborted || version !== speechVersion) return
        send({ type: 'conversation.item.create', item: { type: 'function_call_output', call_id: event.call_id, output: JSON.stringify({ recorded }) } })
        pendingToolVersion = version; continueAfterTool()
      })(); return
    }
    if (event.type === 'response.function_call_arguments.done' && event.name === 'set_expression' && !handledTools.has(event.call_id)) {
      handledTools.add(event.call_id); call.diagnostics.count('toolCalls')
      let performance
      try { performance = readNovaPerformance(JSON.parse(event.arguments)) } catch {}
      send({ type: 'conversation.item.create', item: { type: 'function_call_output', call_id: event.call_id, output: JSON.stringify(performance ? { nova_expression: true, speechOpening: banterOpening(call.context.coachPreferences, performance, call.history.filter(turn => turn.role === 'user').at(-1)?.content ?? '', call.context.mode === 'examiner'), responseId: event.response_id, performance: call.context.mode === 'examiner' ? examPerformance() : performance } : { error: 'Invalid performance metadata.' }) } })
      pendingToolVersion = speechVersion; continueAfterTool(); return
    }
    if (event.type !== 'response.function_call_arguments.done' || event.name !== 'ask_coach' || handledTools.has(event.call_id)) return
    handledTools.add(event.call_id)
    call.diagnostics.count('toolCalls')
    const controller = new AbortController(); call.toolAborts.set(event.call_id, controller)
    const toolStarted = performance.now()
    const toolSpeechVersion = speechVersion
    const toolContextVersion = call.contextVersion
    void (async () => {
      try {
        const argumentsValue = JSON.parse(event.arguments)
        // Save complete written detail; the realtime model speaks a short summary.
        const request = assistantRequestSchema.parse({ ...call.context, turnId: `voice:${id}:${speechVersion}`, message: argumentsValue.request, history: call.history, delivery: 'text' })
        const result = await answerAssistant(userId, request, AbortSignal.any([abort.signal, controller.signal]), undefined, call.diagnostics, call.history.filter(turn => turn.role === 'user').at(-1)?.content ?? '')
        if (abort.signal.aborted || toolSpeechVersion !== speechVersion || toolContextVersion !== call.contextVersion) return
        send({ type: 'conversation.item.create', item: { type: 'function_call_output', call_id: event.call_id, output: JSON.stringify({ profai_coach_result: true, ...result }) } })
      } catch {
        if (abort.signal.aborted || toolSpeechVersion !== speechVersion || toolContextVersion !== call.contextVersion) return
        send({ type: 'conversation.item.create', item: { type: 'function_call_output', call_id: event.call_id, output: JSON.stringify({ error: 'The coach is temporarily unavailable. Do not invent a result; ask the learner to retry.' }) } })
      }
      finally { call.toolAborts.delete(event.call_id); call.diagnostics.sample('tool_wait', performance.now() - toolStarted, 'server_clock') }
      if (!abort.signal.aborted && toolSpeechVersion === speechVersion && toolContextVersion === call.contextVersion) {
        pendingToolVersion = toolSpeechVersion
        continueAfterTool()
      }
    })()
  })
  socket.on('error', () => { void endVoiceCall(userId, id) })
  socket.on('close', () => { if (calls.has(id)) void endVoiceCall(userId, id) })
  try {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Voice control connection timed out.')), 10000)
      socket.once('open', () => { clearTimeout(timer); resolve() })
      socket.once('error', () => { clearTimeout(timer); reject(new Error('Voice control connection failed.')) })
    })
    signal?.throwIfAborted()
    if (expiresAt.getTime() <= Date.now()) throw new BillingError('PREMIUM_REQUIRED', 'The Live AI time window ended. Your unused reservation will be returned; try again after your allowance renews.')
    await requireVoiceReservation(userId, id)
    for (const previous of calls.values()) if (previous.userId === userId) await endVoiceCall(userId, previous.id)
    calls.set(id, call)
    const timings = { preparationMs: Math.round(prepared - started), providerMs: Math.round(negotiated - prepared), controlMs: Math.round(performance.now() - negotiated), totalMs: Math.round(performance.now() - started) }
    console.info('voice.performance', { stage: 'setup', ...timings, model: env.AI_VOICE_MODEL })
    return { id, model: env.AI_VOICE_MODEL, sdp: answer, expiresAt: expiresAt.toISOString(), maxMinutes: Math.max(0, (expiresAt.getTime() - Date.now()) / 60000), timings }
  } catch (error) {
    clearTimeout(call.timer); socket.close(); await hangup(callId)
    throw error
  }
}
export { assistantContextSchema }
onVoiceReservationReplaced(async (userId, id) => { if (calls.get(id)?.userId === userId) await endVoiceCall(userId, id) })

// Reclaim provider calls after a process restart or a missed browser disconnect.
const allowanceCleanup = setInterval(() => {
  void prisma.voiceAllowanceSession.findMany({ where: { endedAt: null, OR: [{ expiresAt: { lte: new Date() } }, { leaseExpiresAt: { lte: new Date() } }, { leaseExpiresAt: null }] }, take: 50 })
    .then(rows => Promise.allSettled(rows.map(row => endVoiceCall(row.userId, row.id)))).catch(() => {})
}, 15000)
allowanceCleanup.unref()
