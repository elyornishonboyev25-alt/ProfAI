import assert from 'node:assert/strict'
import test from 'node:test'

process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'postgresql://fixture:fixture@127.0.0.1:1/nova_fixture'
process.env.ACCESS_TOKEN_SECRET = 'nova-test-access-secret-only-000'
process.env.REFRESH_TOKEN_SECRET = 'nova-test-refresh-secret-only-000'
for (const key of ['GEMINI_API_KEY', 'GEMINI_API_KEY_2', 'GEMINI_API_KEY_3', 'GEMINI_API_KEY_4', 'GEMINI_API_KEY_5', 'OPENAI_API_KEY', 'HF_ACCESS_TOKEN']) process.env[key] = ''
const { defaultNovaPerformance, novaPerformanceSchema, novaExpressions } = await import('../dist/services/novaPersona.js')
const { parseAssistantReply, assistantContextSchema, assistantRequestSchema } = await import('../dist/services/assistantPolicy.js')
const { messageMetadataSchema } = await import('../dist/routes/aiWorkspace.routes.js')
const { assistantData, answerAssistant } = await import('../dist/services/assistant.service.js')
const { prisma } = await import('../dist/lib/prisma.js')
prisma.novaSkillEvidence.findMany = async () => []
prisma.novaSessionDiagnostics.upsert = async () => ({})
const { env } = await import('../dist/config/env.js')
const { generateExaminerAudio } = await import('../dist/services/speakingAudio.service.js')

test('performance is bounded, typed and backward compatible without swallowing bad values', () => {
  for (const expression of novaExpressions) {
    const performance = defaultNovaPerformance(expression)
    assert.deepEqual(novaPerformanceSchema.parse(performance), performance)
    const reply = parseAssistantReply(JSON.stringify({ reply: 'An actual explanation.', expression: 'warm', performance }))
    assert.equal(reply.expression, expression, 'The same validated value drives speech and face')
    assert.deepEqual(reply.performance, performance)
  }
  const performance = defaultNovaPerformance()
  for (const patch of [{ intensity: -1 }, { intensity: 1.01 }, { intensity: NaN }, { expression: 'rage' }, { gesture: 'diagnose' }, { delivery: { pace: 'warp' } }, { secret: 'unexpected' }]) {
    assert.equal(novaPerformanceSchema.safeParse({ ...performance, ...patch }).success, false)
  }
  assert.equal(parseAssistantReply('{"reply":"Older saved response"}').performance.expression, 'warm')
  const recovered = parseAssistantReply(JSON.stringify({ reply: 'Keep the useful explanation.', performance: { ...performance, intensity: 20 } }))
  assert.equal(recovered.reply, 'Keep the useful explanation.')
  assert.equal(recovered.performance.intensity, .3, 'Invalid optional model metadata falls back without losing the answer')
})

test('exam mode overrides provider performance in both written and spoken coaching', async t => {
  const originalFetch = globalThis.fetch
  const original = { user: prisma.user.findUnique, memory: prisma.aiMemory.findMany, usage: prisma.aiUsageEvent.create }
  const config = { key: env.OPENAI_API_KEY, provider: env.AI_CHAT_PROVIDER, model: env.AI_CHAT_MODEL }
  env.OPENAI_API_KEY = 'fixture-key'; env.AI_CHAT_PROVIDER = 'openai'; env.AI_CHAT_MODEL = 'gpt-4.1-mini'
  prisma.user.findUnique = async () => ({ fullName: 'Synthetic learner', assessmentResults: [] })
  prisma.aiMemory.findMany = async () => []
  prisma.aiUsageEvent.create = async () => ({})
  globalThis.fetch = async () => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ reply: 'What do you enjoy studying?', performance: defaultNovaPerformance('affectionate') }) } }] }))
  t.after(() => {
    globalThis.fetch = originalFetch; prisma.user.findUnique = original.user; prisma.aiMemory.findMany = original.memory; prisma.aiUsageEvent.create = original.usage
    env.OPENAI_API_KEY = config.key; env.AI_CHAT_PROVIDER = config.provider; env.AI_CHAT_MODEL = config.model
  })
  for (const delivery of ['text', 'voice']) {
    const result = await answerAssistant('fixture', assistantRequestSchema.parse({ message: 'Hello.', mode: 'examiner', delivery }))
    assert.equal(result.expression, 'focused'); assert.equal(result.performance.tone, 'serious')
    assert.equal(result.performance.intensity, .2)
  }
})

test('message metadata survives JSON storage and rejects transient draft status', () => {
  const metadata = { performance: defaultNovaPerformance('supportive'), expression: 'supportive', delivery: 'voice', status: 'interrupted' }
  assert.deepEqual(messageMetadataSchema.parse(JSON.parse(JSON.stringify(metadata))), metadata)
  assert.equal(messageMetadataSchema.safeParse({ ...metadata, status: 'streaming' }).success, false)
  assert.equal(messageMetadataSchema.safeParse({ performance: { ...metadata.performance, intensity: 8 } }).success, false)
})

test('current preferences and verified memories both reach the shared tutor as distinct data', () => {
  const context = assistantContextSchema.parse({ coachPreferences: { playfulLanguage: false } })
  const records = { learner: { assessmentResults: [] }, memories: [{ key: 'humour_preference', value: 'Previously enjoyed banter' }] }
  const data = assistantData(context, records)
  assert.equal(data.coachPreferences.playfulLanguage, false)
  assert.equal(data.memories[0].value, 'Previously enjoyed banter')
  const answer = parseAssistantReply(JSON.stringify({ reply: 'A serious explanation.', memoryUpdates: [
    { key: 'temporary_anger', value: 'Mock angry' }, { key: 'emotion', value: 'happy' },
    { key: 'address_preference', value: 'Use siz when I ask you to remember this.' },
  ] }))
  assert.deepEqual(answer.memoryUpdates.map(entry => entry.key), ['address_preference'])
})

test('Nova English TTS receives expressive delivery while IELTS retains its examiner profile', async t => {
  const originalFetch = globalThis.fetch
  env.OPENAI_API_KEY = 'fixture-key'
  t.after(() => { globalThis.fetch = originalFetch; env.OPENAI_API_KEY = '' })
  const requests = []
  globalThis.fetch = async (_url, options) => { requests.push(JSON.parse(options.body)); return new Response(new Uint8Array([1, 2, 3])) }
  const performance = { ...defaultNovaPerformance('playful_angry'), tone: 'playful', intensity: .45, delivery: { pace: 'brisk', warmth: 'high', emphasis: 'light' } }
  assert.ok(await generateExaminerAudio('Try one focused step.', 'marin', 'en', { performance }))
  assert.ok(await generateExaminerAudio('What do you enjoy studying?', 'marin', 'en'))
  assert.equal(requests[0].voice, requests[1].voice, 'Delivery never switches the selected voice')
  assert.match(requests[0].instructions, /pace brisk; warmth high/)
  assert.doesNotMatch(requests[0].instructions, /professional IELTS Speaking examiner/)
  assert.match(requests[1].instructions, /professional IELTS Speaking examiner/)
  assert.equal(requests[0].input, 'Try one focused step.', 'Metadata is instructions, never spoken input')
})
