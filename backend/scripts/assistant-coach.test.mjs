import assert from 'node:assert/strict'
import test from 'node:test'
import express from 'express'
import { WebSocketServer } from 'ws'

process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.ACCESS_TOKEN_SECRET = 'assistant-test-access-secret-000'
process.env.REFRESH_TOKEN_SECRET = 'assistant-test-refresh-secret-000'
for (const key of ['GEMINI_API_KEY', 'GEMINI_API_KEY_2', 'GEMINI_API_KEY_3', 'GEMINI_API_KEY_4', 'GEMINI_API_KEY_5', 'OPENAI_API_KEY', 'HF_ACCESS_TOKEN']) process.env[key] = ''
const { app } = await import('../dist/app.js')
const { env } = await import('../dist/config/env.js')
const { prisma } = await import('../dist/lib/prisma.js')
const { signAccessToken } = await import('../dist/utils/jwt.js')
const { parseAssistantReply, partialAssistantReply, boundedHistory, buildCoachPrompt, assistantContextSchema } = await import('../dist/services/assistantPolicy.js')
const { validateAudioAssessment } = await import('../dist/services/speakingAssessment.service.js')
const { voiceInstructions } = await import('../dist/services/realtimeCoach.service.js')
const { generateAiText } = await import('../dist/services/aiProvider.service.js')
const { readEventStream } = await import('../dist/utils/eventStream.js')

test('stream decoding preserves split Unicode and incomplete JSON escapes', async () => {
  const value = JSON.stringify({ reply: 'Salom! O‘zbekcha 😊\n“Misol”', actions: [] })
  let previous = ''
  for (let i = 1; i <= value.length; i++) {
    const partial = partialAssistantReply(value.slice(0, i))
    assert.ok(partial.startsWith(previous), `reply regressed at ${i}`)
    previous = partial
  }
  assert.equal(previous, 'Salom! O‘zbekcha 😊\n“Misol”')
  assert.equal(partialAssistantReply('{"reply":"A\\u0'), 'A')
  assert.equal(partialAssistantReply('{"actions":[]'), '')
  const bytes = new TextEncoder().encode('data: {"text":"O‘zbek 😊"}\r\n\r\ndata: [DONE]\n\n')
  const body = new ReadableStream({ start(controller) { for (const byte of bytes) controller.enqueue(Uint8Array.of(byte)); controller.close() } })
  const events = []
  for await (const event of readEventStream(body)) events.push(event)
  assert.deepEqual(events, ['{"text":"O‘zbek 😊"}', '[DONE]'])
})

test('only valid actions and useful memories survive; Listening never gets a timer', () => {
  const result = parseAssistantReply(JSON.stringify({ reply: 'Ready.', actions: [
    { type: 'navigate', target: 'https://evil.invalid' },
    { type: 'open_test', payload: { track: 'listening', ordinal: 2, timerEnabled: true, durationMinutes: 30 } },
    { type: 'save_word', payload: { term: 'resilient', definition: 'Able to recover.' } },
  ], memoryUpdates: [{ key: 'api_key', value: 'private credential' }, { key: 'target_score', value: 'IELTS 7.5' }] }))
  assert.equal(result.actions.length, 2)
  assert.equal(result.actions[0].payload.timerEnabled, false)
  assert.equal(result.actions[0].payload.durationMinutes, undefined)
  assert.deepEqual(result.memoryUpdates, [{ key: 'target_score', value: 'IELTS 7.5' }])
  assert.throws(() => parseAssistantReply('{"reply":"unfinished'))
})

test('voice and text share grounding, language and honest assessment rules', () => {
  const context = assistantContextSchema.parse({ language: 'uz', workspace: 'ielts' })
  assert.match(buildCoachPrompt(context), /natural Uzbek/)
  assert.match(buildCoachPrompt(context), /Never infer pronunciation from text/)
  assert.match(buildCoachPrompt(context, 'voice'), /1-3 short sentences/)
  assert.match(voiceInstructions({ ...context, mode: 'examiner' }, {}), /Never correct, praise, coach or score/)
  const history = Array.from({ length: 100 }, (_, i) => ({ role: 'user', content: String(i).padEnd(1000, '.') }))
  assert.equal(boundedHistory(history, 2500).length, 2)
  assert.ok(boundedHistory(history)[0].content.startsWith('76'))
})

test('audio grades use equal weights and reject invented answer evidence', () => {
  const history = [{ role: 'candidate', text: 'I enjoy reading books.' }]
  const result = { fluencyBand: 6, lexicalBand: 7, grammarBand: 6, pronunciationBand: 7, summary: 'Practice estimate.', strengths: ['Clear idea'], weaknesses: ['Develop the reason'], improvementPriorities: [{ area: 'Grammar', target: 7, action: 'Extend the answer.' }], evidence: [{ criterion: 'pronunciation', answerIndex: 0, quote: 'reading books', explanation: 'Stress was clear in this sample.', exercise: 'Repeat with natural rhythm.' }] }
  assert.equal(validateAudioAssessment(JSON.stringify(result), history, [0]).overallBand, 6.5)
  assert.throws(() => validateAudioAssessment(JSON.stringify(result), history, [1]))
  assert.throws(() => validateAudioAssessment(JSON.stringify({ ...result, evidence: [{ ...result.evidence[0], quote: 'invented sentence' }] }), history, [0]))
})

test('authenticated chat streams, keeps memory private and refuses foreign threads', async (t) => {
  const nativeFetch = globalThis.fetch
  const originals = { user: prisma.user.findUnique, memory: prisma.aiMemory.findMany, thread: prisma.aiConversationThread.findFirst, usage: prisma.aiUsageEvent.create }
  prisma.user.findUnique = async () => ({ fullName: 'Test Learner', profile: null, aiPreference: null })
  prisma.aiMemory.findMany = async () => [{ key: 'target_score', value: 'IELTS 7.5' }]
  prisma.aiConversationThread.findFirst = async ({ where }) => where.id === 'own-thread' ? { id: where.id } : null
  prisma.aiUsageEvent.create = async ({ data }) => data
  env.OPENAI_API_KEY = 'fake-test-key'
  env.AI_CHAT_PROVIDER = 'openai'
  env.AI_CHAT_MODEL = 'gpt-4.1-mini'
  const server = app.listen(0)
  const base = `http://127.0.0.1:${server.address().port}`
  let modelCalls = 0
  globalThis.fetch = async (url, options) => {
    if (String(url).startsWith(base)) return nativeFetch(url, options)
    modelCalls++
    const body = JSON.parse(options.body)
    assert.match(body.messages[0].content, /natural Uzbek/)
    assert.match(body.messages[1].content, /IELTS 7.5/)
    const text = JSON.stringify({ reply: 'Salom! Maqsadingizga mos mashq qilamiz.', actions: [], memoryUpdates: [] })
    const deltas = [text.slice(0, 14), text.slice(14)]
    return new Response(deltas.map((delta) => `data: ${JSON.stringify({ choices: [{ delta: { content: delta } }] })}\n\n`).join('') + 'data: [DONE]\n\n', { headers: { 'Content-Type': 'text/event-stream' } })
  }
  t.after(() => {
    globalThis.fetch = nativeFetch; env.OPENAI_API_KEY = ''; env.AI_CHAT_PROVIDER = 'auto'; env.AI_CHAT_MODEL = ''
    prisma.user.findUnique = originals.user; prisma.aiMemory.findMany = originals.memory; prisma.aiConversationThread.findFirst = originals.thread; prisma.aiUsageEvent.create = originals.usage
    server.closeAllConnections(); server.close()
  })
  const post = (path, body, auth = true) => nativeFetch(`${base}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: `Bearer ${signAccessToken({ sub: 'test-user', role: 'USER' })}` } : {}) }, body: typeof body === 'string' ? body : JSON.stringify(body) })
  for (const path of ['/api/v1/ai/assistant/stream', '/api/v1/ai/voice/connect', '/api/v1/ai/speaking-audio/assess']) assert.equal((await post(path, '{bad-json', false)).status, 401)
  const body = { message: 'Salom', language: 'uz', workspace: 'ielts', threadId: 'own-thread' }
  const streamed = await post('/api/v1/ai/assistant/stream', body)
  const response = await streamed.text()
  assert.match(response, /event: reply/)
  assert.match(response, /event: done/)
  assert.match(response, /Salom! Maqsadingizga/)
  const refused = await post('/api/v1/ai/assistant/chat', { ...body, threadId: 'foreign-thread' })
  assert.equal(refused.status, 404)
  assert.equal(modelCalls, 1)
})

test('a partial streamed answer never falls through to a second provider', async (t) => {
  const nativeFetch = globalThis.fetch
  const usage = prisma.aiUsageEvent.create
  prisma.aiUsageEvent.create = async ({ data }) => data
  env.OPENAI_API_KEY = 'fake-test-key'; env.HF_ACCESS_TOKEN = 'fake-fallback-key'; env.AI_CHAT_PROVIDER = 'openai'
  let calls = 0
  globalThis.fetch = async () => { calls++; return new Response('data: {"choices":[{"delta":{"content":"partial"}}]}\n\ndata: {"error":{"message":"disconnected"}}\n\n') }
  t.after(() => { globalThis.fetch = nativeFetch; prisma.aiUsageEvent.create = usage; env.OPENAI_API_KEY = ''; env.HF_ACCESS_TOKEN = ''; env.AI_CHAT_PROVIDER = 'auto' })
  const text = []
  await assert.rejects(generateAiText({ userId: 'test-user', purpose: 'assistant_chat', systemPrompt: 'test', userMessage: 'test', maxOutputTokens: 100, onText: (value) => text.push(value) }))
  assert.deepEqual(text, ['partial']); assert.equal(calls, 1)
})

test('voice uses protected SDP negotiation, executes shared coaching and hangs up only its owner’s call', async (t) => {
  const fake = express()
  let sessionConfig
  const nativeFetch = globalThis.fetch
  const originals = { user: prisma.user.findUnique, memory: prisma.aiMemory.findMany, usage: prisma.aiUsageEvent.create }
  prisma.user.findUnique = async () => ({ fullName: 'Test Learner', profile: null, aiPreference: null })
  prisma.aiMemory.findMany = async () => []
  prisma.aiUsageEvent.create = async ({ data }) => data
  let ended = 0
  fake.post('/v1/realtime/calls/:id/hangup', (_req, res) => { ended++; res.sendStatus(200) })
  const fakeServer = fake.listen(0)
  const fakeBase = `http://127.0.0.1:${fakeServer.address().port}`
  const ws = new WebSocketServer({ server: fakeServer })
  let socket
  const received = []
  ws.on('connection', (connection) => { socket = connection; connection.on('message', (data) => received.push(JSON.parse(String(data)))) })
  env.OPENAI_API_KEY = 'fake-voice-key'; env.OPENAI_API_BASE = `${fakeBase}/v1`
  globalThis.fetch = async (url, options) => {
    if (String(url) === `${fakeBase}/v1/realtime/calls`) {
      assert.equal(options.headers.Authorization, 'Bearer fake-voice-key')
      sessionConfig = JSON.parse(options.body.get('session'))
      return new Response('v=0\r\ns=mock\r\n', { headers: { Location: `${fakeBase}/v1/realtime/calls/call_test` } })
    }
    if (String(url) === `${fakeBase}/v1/chat/completions`) return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ reply: 'The rule is clear.', actions: [], memoryUpdates: [] }) } }] }))
    return nativeFetch(url, options)
  }
  const server = app.listen(0)
  const base = `http://127.0.0.1:${server.address().port}`
  const post = (path, body, user = 'voice-user') => nativeFetch(`${base}/api/v1/ai/voice${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${signAccessToken({ sub: user, role: 'USER' })}` }, body: JSON.stringify(body) })
  t.after(() => { globalThis.fetch = nativeFetch; env.OPENAI_API_KEY = ''; env.OPENAI_API_BASE = 'https://api.openai.com/v1'; prisma.user.findUnique = originals.user; prisma.aiMemory.findMany = originals.memory; prisma.aiUsageEvent.create = originals.usage; ws.clients.forEach((client) => client.terminate()); ws.close(); fakeServer.closeAllConnections(); fakeServer.close(); server.closeAllConnections(); server.close() })
  const response = await post('/connect', { sdp: 'v=0\r\ns=local-offer\r\n', context: { language: 'uz' } })
  assert.equal(response.status, 201)
  const call = await response.json()
  assert.equal(call.session, undefined); assert.equal(call.client_secret, undefined)
  assert.equal(sessionConfig.audio.input.turn_detection.type, 'semantic_vad')
  assert.equal(sessionConfig.audio.input.turn_detection.interrupt_response, true)
  assert.equal(sessionConfig.tools[0].name, 'ask_coach')
  assert.equal((await post('/context', { id: call.id, context: { pathname: '/vocabulary', language: 'uz' } }, 'other-user')).status, 404)
  assert.equal((await post('/context', { id: call.id, context: { pathname: '/vocabulary', language: 'uz' } })).status, 204)
  for (let i = 0; i < 50 && !received.some((event) => event.type === 'session.update'); i++) await new Promise((resolve) => setTimeout(resolve, 10))
  assert.match(received.find((event) => event.type === 'session.update').session.instructions, /\/vocabulary/)
  socket.send(JSON.stringify({ type: 'response.created', response: { id: 'tool_response' } }))
  socket.send(JSON.stringify({ type: 'response.function_call_arguments.done', name: 'ask_coach', call_id: 'tool_test', arguments: JSON.stringify({ request: 'Explain this grammar.' }) }))
  for (let i = 0; i < 50 && !received.some((event) => event.item?.type === 'function_call_output'); i++) await new Promise((resolve) => setTimeout(resolve, 10))
  const result = received.find((event) => event.item?.type === 'function_call_output')
  assert.equal(JSON.parse(result.item.output).profai_coach_result, true)
  assert.equal(received.filter((event) => event.type === 'response.create').length, 0, 'Tool output must wait for the active response to finish')
  socket.send(JSON.stringify({ type: 'response.done', response: { id: 'tool_response', status: 'completed' } }))
  for (let i = 0; i < 50 && !received.some((event) => event.type === 'response.create'); i++) await new Promise((resolve) => setTimeout(resolve, 10))
  assert.equal(received.filter((event) => event.type === 'response.create').length, 1, 'Fast tool output must resume speaking after response.done')
  await post('/end', { id: call.id }, 'other-user'); assert.equal(ended, 0)
  await post('/end', { id: call.id }); assert.equal(ended, 1)
})
