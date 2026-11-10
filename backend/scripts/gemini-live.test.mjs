import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { once } from 'node:events'
import WebSocket, { WebSocketServer } from 'ws'

process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'postgresql://fixture:fixture@127.0.0.1:1/gemini_live_fixture'
process.env.ACCESS_TOKEN_SECRET = 'gemini-live-test-access-secret-only'
process.env.REFRESH_TOKEN_SECRET = 'gemini-live-test-refresh-secret-only'
for (const key of ['GEMINI_API_KEY', 'GEMINI_API_KEY_2', 'GEMINI_API_KEY_3', 'GEMINI_API_KEY_4', 'GEMINI_API_KEY_5', 'OPENAI_API_KEY']) process.env[key] = ''
const { env } = await import('../dist/config/env.js')
const { prisma } = await import('../dist/lib/prisma.js')
const { assistantContextSchema } = await import('../dist/services/assistantPolicy.js')
const { geminiLiveKeys, naturalVoiceProvider } = await import('../dist/services/voiceProvider.js')
const { geminiLiveSetup, geminiVoiceFrame, attachGeminiVoice, startGeminiVoiceCall, endGeminiVoiceCall, updateGeminiVoiceContext } = await import('../dist/services/geminiLive.service.js')
const { openGeminiLive, verifyGeminiLiveAudio } = await import('../dist/services/geminiLiveTransport.js')
const { attachSpeakingSignaling } = await import('../dist/realtime/speakingSignaling.js')

const reservations = new Map()
let fixtureWindowMs = null
prisma.user.findUnique = async () => ({ fullName: 'Fixture learner', profile: null, aiPreference: null })
prisma.aiMemory.findMany = async () => []
prisma.aiConversationThread.findFirst = async ({ where }) => where.id === 'owned' && where.userId === 'learner' ? { id: where.id } : null
prisma.aiUsageEvent.create = async () => ({})
prisma.voiceAllowanceSession.findMany = async () => []
prisma.voiceAllowanceSession.findFirst = async ({ where }) => [...reservations.values()].find(row => row.id === where.id && row.userId === where.userId && row.endedAt === null) ?? null
prisma.voiceAllowanceSession.create = async ({ data }) => { const row = { ...data, ...(fixtureWindowMs ? { expiresAt: new Date(Date.now() + fixtureWindowMs) } : {}), endedAt: null }; reservations.set(row.id, row); return row }
prisma.voiceAllowanceSession.update = async ({ where, data }) => Object.assign(reservations.get(where.id), data)
const tx = {
  $queryRaw: async () => [],
  user: { findUniqueOrThrow: async () => ({ role: 'ADMIN', email: 'fixture@example.invalid', nickname: null }) },
  premiumGrant: { findUnique: async () => null }, billingSubscription: { findMany: async () => [] },
  featureUsage: { findUnique: async () => null }, voiceAllowanceSession: prisma.voiceAllowanceSession,
}
prisma.$transaction = async work => work(tx)

test('Gemini-only deployments advertise native voice and keep Live separate from TTS', () => {
  assert.equal(naturalVoiceProvider(), null)
  env.GEMINI_API_KEY = 'first, second'; env.GEMINI_API_KEY_2 = 'second'
  assert.deepEqual(geminiLiveKeys(), ['first', 'second'])
  assert.equal(naturalVoiceProvider(), 'gemini')
  assert.equal(env.GEMINI_LIVE_MODEL, 'gemini-3.8-live')
  env.OPENAI_API_KEY = 'openai-fixture'
  assert.equal(naturalVoiceProvider(), 'gemini', 'Auto prefers the requested Gemini provider')
  env.AI_VOICE_PROVIDER = 'openai'; assert.equal(naturalVoiceProvider(), 'openai')
  env.AI_VOICE_PROVIDER = 'gemini'; env.GEMINI_API_KEY = ''; env.GEMINI_API_KEY_2 = ''
  assert.equal(naturalVoiceProvider(), null, 'An explicit provider cannot silently become another model')
  env.AI_VOICE_PROVIDER = 'auto'; env.GEMINI_API_KEY = 'fixture-server-secret'; env.OPENAI_API_KEY = ''
  const setup = geminiLiveSetup(assistantContextSchema.parse({ mode: 'examiner', language: 'uz' }), {}).setup
  assert.equal(setup.model, 'models/gemini-3.8-live')
  assert.deepEqual(setup.generationConfig.responseModalities, ['AUDIO'])
  assert.equal(setup.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName, 'Kore')
  assert.deepEqual(setup.inputAudioTranscription, {}); assert.deepEqual(setup.outputAudioTranscription, {})
  assert.match(setup.systemInstruction.parts[0].text, /Never correct, praise, coach or score/)
  assert.ok(!JSON.stringify(setup).includes('fixture-server-secret'))
  for (const frame of [{ type: 'setup', key: 'unsafe' }, { type: 'audio', data: 'bad bytes!' }, { type: 'audio', data: 'AAAA', model: 'another-model' }]) assert.equal(geminiVoiceFrame.safeParse(frame).success, false)
})

test('provider setup rotates keys, requires acknowledgement and can be cancelled', async t => {
  const provider = new WebSocketServer({ port: 0 })
  await once(provider, 'listening')
  t.after(() => { for (const client of provider.clients) client.terminate(); provider.close() })
  const attempts = []
  provider.on('connection', (client, request) => {
    attempts.push(request.headers['x-goog-api-key'])
    client.on('message', raw => {
      assert.equal(JSON.parse(String(raw)).setup.model, 'models/gemini-3.8-live')
      if (request.headers['x-goog-api-key'] === 'bad-key') client.send(JSON.stringify({ error: { code: 403 } }))
      else if (request.headers['x-goog-api-key'] !== 'slow-key') client.send(JSON.stringify({ setupComplete: {} }))
    })
  })
  const socketFactory = (_url, options) => new WebSocket(`ws://127.0.0.1:${provider.address().port}`, options)
  const socket = await openGeminiLive({ setup: { model: 'models/gemini-3.8-live' } }, ['bad-key', 'good-key'], undefined, socketFactory)
  assert.equal(socket.readyState, WebSocket.OPEN); socket.close()
  assert.deepEqual(attempts, ['bad-key', 'good-key'])
  const controller = new AbortController()
  const aborted = openGeminiLive({ setup: { model: 'models/gemini-3.8-live' } }, ['slow-key'], controller.signal, socketFactory)
  setTimeout(() => controller.abort(), 20)
  await assert.rejects(aborted, { name: 'AbortError' })
})

test('the authenticated ticket owns PCM streaming, transcripts, expiry and settlement', async t => {
  const provider = new WebSocketServer({ port: 0 })
  await once(provider, 'listening')
  const frames = [], providerSockets = []
  provider.on('connection', client => {
    providerSockets.push(client)
    client.on('message', raw => {
      const event = JSON.parse(String(raw)); frames.push(event)
      if (event.setup) client.send(JSON.stringify({ setupComplete: {} }))
    })
  })
  const connect = (setup, keys, signal) => openGeminiLive(setup, keys, signal, (_url, options) => new WebSocket(`ws://127.0.0.1:${provider.address().port}`, options))
  const http = createServer()
  const gateway = attachGeminiVoice(http)
  const speaking = attachSpeakingSignaling(http)
  await new Promise(resolve => http.listen(0, '127.0.0.1', resolve))
  const clients = []
  t.after(async () => {
    for (const call of [...reservations.values()]) if (!call.endedAt) await endGeminiVoiceCall(call.userId, call.id)
    for (const client of [...clients, ...provider.clients, ...speaking.clients]) client.terminate()
    gateway.close(); speaking.close(); provider.close(); http.close()
  })
  const call = await startGeminiVoiceCall('learner', assistantContextSchema.parse({ threadId: 'owned' }), [{ role: 'user', content: 'My name is Elyor.' }], undefined, connect)
  assert.equal(call.ticket.length, 43)
  assert.ok(!JSON.stringify(call).includes('fixture-server-secret'))
  assert.equal(call.model, 'gemini-3.8-live')
  assert.equal(await endGeminiVoiceCall('another-user', call.id), false)
  await assert.rejects(startGeminiVoiceCall('learner', assistantContextSchema.parse({ threadId: 'foreign' }), [], undefined, connect), /Chat not found/)
  assert.equal(await updateGeminiVoiceContext('learner', call.id, assistantContextSchema.parse({ threadId: 'foreign' })), true, 'An established call stays attached to its original owned conversation')
  assert.equal(await updateGeminiVoiceContext('another-user', call.id, assistantContextSchema.parse({})), false)
  const client = new WebSocket(`ws://127.0.0.1:${http.address().port}/ws/ai-coach`); clients.push(client)
  const events = []
  client.on('message', raw => events.push(JSON.parse(String(raw))))
  await once(client, 'open'); client.send(JSON.stringify({ ticket: call.ticket }))
  await waitFor(() => events.some(event => event.type === 'ready'))
  const replay = new WebSocket(`ws://127.0.0.1:${http.address().port}/ws/ai-coach`); clients.push(replay)
  await once(replay, 'open'); replay.send(JSON.stringify({ ticket: call.ticket }))
  const [code] = await once(replay, 'close'); assert.equal(code, 1008, 'Tickets cannot be replayed')
  client.send(JSON.stringify({ type: 'start' }))
  client.send(JSON.stringify({ type: 'audio', data: Buffer.alloc(3200).toString('base64') }))
  await waitFor(() => frames.some(frame => frame.realtimeInput?.audio))
  assert.equal(frames.find(frame => frame.realtimeInput?.audio).realtimeInput.audio.mimeType, 'audio/pcm;rate=16000')
  const beforeBurst = frames.filter(frame => frame.realtimeInput?.audio).length
  for (let index = 0; index < 30; index++) client.send(JSON.stringify({ type: 'audio', data: Buffer.alloc(3200).toString('base64') }))
  await waitFor(() => frames.filter(frame => frame.realtimeInput?.audio).length === beforeBurst + 30)
  assert.equal(client.readyState, WebSocket.OPEN, 'Brief delivery bursts do not terminate a normal live conversation')
  assert.match(JSON.stringify(frames.find(frame => frame.clientContent)), /My name is Elyor/)
  providerSockets[0].send(JSON.stringify({ serverContent: { inputTranscription: { text: 'Hello Nova.', finished: true }, outputTranscription: { text: 'Hello Elyor.' }, modelTurn: { parts: [{ inlineData: { mimeType: 'audio/pcm;rate=24000', data: Buffer.alloc(4800).toString('base64') } }] }, turnComplete: true } }))
  await waitFor(() => events.some(event => event.content?.inputTranscription?.text === 'Hello Nova.'))
  assert.equal(events.find(event => event.type === 'content').content.outputTranscription.text, 'Hello Elyor.')
  client.send(JSON.stringify({ type: 'mute', muted: true }))
  await waitFor(() => frames.some(frame => frame.realtimeInput?.audioStreamEnd))
  // Existing partner-speaking upgrades must remain independent of the AI socket.
  const partner = new WebSocket(`ws://127.0.0.1:${http.address().port}/ws/speaking`); clients.push(partner)
  await once(partner, 'open'); partner.close()
  client.close(); await waitFor(() => reservations.get(call.id).endedAt !== null)
  assert.equal(await endGeminiVoiceCall('learner', call.id), false, 'Settlement and teardown are idempotent')
  fixtureWindowMs = 150
  const shortCall = await startGeminiVoiceCall('learner', assistantContextSchema.parse({}), [], undefined, connect)
  const expiring = new WebSocket(`ws://127.0.0.1:${http.address().port}/ws/ai-coach`); clients.push(expiring)
  await once(expiring, 'open'); expiring.send(JSON.stringify({ ticket: shortCall.ticket }))
  await once(expiring, 'close'); assert.ok(reservations.get(shortCall.id).endedAt, 'The server enforces the original allowance deadline')
  fixtureWindowMs = null
  await assert.rejects(startGeminiVoiceCall('learner', assistantContextSchema.parse({}), [], undefined, async () => { throw new Error('Fixture rejected setup') }), /Fixture rejected/)
  assert.ok([...reservations.values()].every(row => row.endedAt), 'A provider failure releases the reservation')
})

test('readiness requires two generated audio turns with PCM input and reports a post-setup provider rejection', async t => {
  const provider = new WebSocketServer({ port: 0 })
  await once(provider, 'listening')
  t.after(() => { for (const socket of provider.clients) socket.terminate(); provider.close() })
  let audioIn = 0
  provider.on('connection', (socket, request) => socket.on('message', raw => {
    const event = JSON.parse(String(raw))
    if (event.setup) socket.send(JSON.stringify({ setupComplete: {} }))
    if (event.realtimeInput?.audio) audioIn++
    if (event.clientContent) {
      if (request.headers['x-goog-api-key'] === 'reject-generation') { socket.close(1008, 'Fixture rejects generation after setup'); return }
      setTimeout(() => socket.send(JSON.stringify({ serverContent: { modelTurn: { parts: [{ inlineData: { mimeType: 'audio/pcm;rate=24000', data: Buffer.alloc(4800).toString('base64') } }] }, turnComplete: true } })), 160)
    }
  }))
  const factory = (_url, options) => new WebSocket(`ws://127.0.0.1:${provider.address().port}`, options)
  const socket = await openGeminiLive({ setup: {} }, ['audio-generation'], undefined, factory)
  const result = await verifyGeminiLiveAudio(socket, AbortSignal.timeout(2000))
  assert.equal(result.turns, 2); assert.equal(result.audioFrames, 2); assert.ok(audioIn >= 2)
  socket.close()
  const rejected = await openGeminiLive({ setup: {} }, ['reject-generation'], undefined, factory)
  await assert.rejects(verifyGeminiLiveAudio(rejected, AbortSignal.timeout(2000)), error => error.providerCloseCode === 1008)
})

async function waitFor(check) {
  for (let index = 0; index < 200; index++) { if (check()) return; await new Promise(resolve => setTimeout(resolve, 10)) }
  throw new Error('Fixture timed out')
}
