import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'postgresql://fixture:fixture@127.0.0.1:1/nova_v2_fixture'
process.env.ACCESS_TOKEN_SECRET = 'nova-v2-access-secret-fixture-only'
process.env.REFRESH_TOKEN_SECRET = 'nova-v2-refresh-secret-fixture-only'
for (const key of ['GEMINI_API_KEY', 'GEMINI_API_KEY_2', 'GEMINI_API_KEY_3', 'GEMINI_API_KEY_4', 'GEMINI_API_KEY_5', 'OPENAI_API_KEY', 'HF_ACCESS_TOKEN']) process.env[key] = ''
const { groundedObservations, validateDeliverySegments } = await import('../dist/services/novaLearning.js')
const { summarizeSkillEvidence, saveLearningEvidence } = await import('../dist/services/novaLearning.service.js')
const { relevantMemories, saveNovaMemories, editNovaMemory, MemoryConflict, InvalidMemory, memoryRevisionSnapshot } = await import('../dist/services/novaMemory.service.js')
const { NovaDiagnostics, summarizeSamples, configuredCostEstimate, diagnosticsSnapshotSchema } = await import('../dist/services/novaDiagnostics.js')
const { parseAssistantReply } = await import('../dist/services/assistantPolicy.js')
const { defaultNovaPerformance } = await import('../dist/services/novaPersona.js')
const { prisma } = await import('../dist/lib/prisma.js')
prisma.accountLearningData.findMany = async () => []
const { env } = await import('../dist/config/env.js')
const { answerAssistant } = await import('../dist/services/assistant.service.js')
const { assistantRequestSchema } = await import('../dist/services/assistantPolicy.js')
const { verifyArithmetic, arithmeticFacts } = await import('../dist/services/novaArithmetic.js')

test('arithmetic is independently computed, bounded and never executes user code', () => {
  for (const [input, expected] of [['2 + 3 * 4', 14], ['(2+3)*4', 20], ['2^3^2', 512], ['-2^2', -4], ['1/4 + 1/4', .5], ['2e2 / 4', 50]]) assert.equal(verifyArithmetic(input)?.result, expected)
  for (const input of ['process.exit()', '1/0', '2^1000', '2(3)', '1+abc', '('.repeat(20)+'2'+')'.repeat(20)]) assert.equal(verifyArithmetic(input), null)
  assert.equal(arithmeticFacts('Hisobla: 17 × (4 + 2).')[0]?.result, 102)
  assert.deepEqual(arithmeticFacts('IELTS 7.0 maqsadim.'), [])
})

const observation = { topicKey: 'fraction_addition', topic: 'Adding fractions', quote: '1/4 + 1/4 = 1/2', outcome: 'correct', assistance: 'independent', confidence: .95, nextExercise: 'Add 1/3 and 1/6.' }
test('learning observations quote only current learner work and cannot become fabricated evidence', () => {
  assert.equal(groundedObservations([observation], 'How do fractions work?').length, 0)
  const rows = groundedObservations([observation, observation], 'I got 1/4 + 1/4 = 1/2 by myself.')
  assert.equal(rows.length, 1); assert.equal(rows[0].confidence, .85)
  assert.equal(groundedObservations([{ ...observation, outcome: 'mastered' }], observation.quote).length, 0)
})
test('learning writes are idempotent per actual turn and remain isolated by account', async () => {
  const saved = new Map()
  const db = { novaSkillEvidence: { upsert: async ({ where, create }) => {
    const key = JSON.stringify(where); if (!saved.has(key)) saved.set(key, create); return saved.get(key)
  } } }
  for (const user of ['a', 'a', 'b']) await saveLearningEvidence(user, observation.quote, [observation], { turnId: 'turn-1' }, db)
  assert.equal(saved.size, 2)
  assert.deepEqual(new Set([...saved.values()].map(row => row.userId)), new Set(['a', 'b']))
  const controller = new AbortController(); controller.abort()
  await assert.rejects(saveLearningEvidence('a', observation.quote, [observation], { signal: controller.signal }, db), { name: 'AbortError' })
})
test('one correct, one wrong, or assisted successes do not imply mastery', () => {
  const row = (id, patch = {}) => ({ ...observation, sourceTurnId: id, observedAt: new Date(2026, 10, 20, 12, Number(id)), ...patch })
  assert.equal(summarizeSkillEvidence([row('1')])[0].status, 'developing')
  assert.ok(summarizeSkillEvidence([row('1')])[0].confidence < .3)
  assert.equal(summarizeSkillEvidence([row('1', { outcome: 'incorrect' })])[0].status, 'developing')
  assert.equal(summarizeSkillEvidence([row('1'), row('2', { assistance: 'hinted' }), row('3', { assistance: 'worked_example' })])[0].status, 'developing')
  assert.equal(summarizeSkillEvidence([row('1'), row('2'), row('3')])[0].status, 'consistent')
  const repeated = summarizeSkillEvidence([row('1', { outcome: 'incorrect', misconception: 'Adds denominators' }), row('2', { outcome: 'incorrect', misconception: 'Adds denominators' })])[0]
  assert.equal(repeated.status, 'needs_practice'); assert.equal(repeated.repeatedMistakes[0].count, 2)
})
test('delivery segments preserve every word and reject gaps, repetition and excessive changes', () => {
  const performance = defaultNovaPerformance('warm')
  const segments = [{ text: 'A small joke.', performance }, { text: 'Now the explanation.', performance: defaultNovaPerformance('focused') }]
  assert.deepEqual(validateDeliverySegments('A small joke. Now the explanation.', segments), segments)
  assert.deepEqual(validateDeliverySegments('A small joke. Now the explanation.', [segments[0]]), [])
  assert.deepEqual(validateDeliverySegments('A small joke.', Array(5).fill(segments[0])), [])
  const parsed = parseAssistantReply(JSON.stringify({ reply: observation.quote, understanding: { intent: 'attempt', topic: 'Fractions', approach: 'challenge', temporaryTone: 'warm' }, learningObservations: [observation] }), observation.quote)
  assert.equal(parsed.learningObservations.length, 1)
})
test('memory relevance selects current preferences, removes contradictions and respects expiry', () => {
  const rows = [
    { key: 'preferred_address', value: 'Use sen', updatedAt: '2026-09-01' },
    { key: 'address_preference', value: 'Use siz', updatedAt: '2026-11-20', origin: 'user' },
    { key: 'favorite_university', value: 'Toronto', updatedAt: '2026-11-20' },
    { key: 'target_score', value: 'IELTS 7.0', updatedAt: '2026-11-18' },
    { key: 'ielts_target_score', value: 'IELTS 7.5', updatedAt: '2026-11-20' },
    { key: 'exam_date', value: 'Old exam', expiresAt: '2026-01-01' },
  ]
  assert.deepEqual(relevantMemories(rows, 'fractions', new Date('2026-11-21')).map(row => row.value), ['Use siz'])
  assert.deepEqual(relevantMemories(rows, 'IELTS', new Date('2026-11-21')).map(row => row.value), ['Use siz', 'IELTS 7.5'])
  assert.deepEqual(relevantMemories(rows, 'Maqsadimni eslat', new Date('2026-11-21')).map(row => row.value), ['Use siz', 'IELTS 7.5'])
})

function memoryDatabase() {
  const rows = new Map(), keyOf = where => [...rows.values()].find(row => where.id ? row.id === where.id : row.userId === where.userId_key.userId && row.key === where.userId_key.key)
  const aiMemory = {
    findUnique: async ({ where }) => keyOf(where) ?? null,
    findMany: async ({ where }) => [...rows.values()].filter(row => row.userId === where.userId).sort((a, b) => +b.updatedAt - +a.updatedAt),
    findFirst: async ({ where }) => [...rows.values()].find(row => row.id === where.id && row.userId === where.userId) ?? null,
    create: async ({ data }) => { const row = { id: `m${rows.size}`, revision: 1, origin: 'legacy', updatedAt: new Date(), ...data }; rows.set(row.id, row); return row },
    updateMany: async ({ where, data }) => { const row = keyOf(where); if (!row || row.userId !== where.userId || row.revision !== where.revision) return { count: 0 }; Object.assign(row, { ...data, revision: row.revision + (data.revision?.increment ?? 0), updatedAt: new Date() }); return { count: 1 } },
  }
  return { rows, aiMemory, $transaction: async fn => fn({ aiMemory }) }
}
test('memory edits have provenance, bounded history, revision conflicts and owner checks', async () => {
  const db = memoryDatabase()
  const [saved] = await saveNovaMemories('a', [{ key: 'address_form', value: 'Use siz' }], { sourceQuote: 'Please remember to use siz.' }, db)
  assert.equal(saved.key, 'address_preference'); assert.equal(saved.origin, 'user')
  await assert.rejects(editNovaMemory('a', saved.id, 'sk-this-is-a-secret-fixture-value', 1, db), InvalidMemory)
  assert.equal(await editNovaMemory('b', saved.id, 'Use sen', 1, db), null)
  await editNovaMemory('a', saved.id, 'Use sen', 1, db)
  await assert.rejects(editNovaMemory('a', saved.id, 'Use siz', 1, db), MemoryConflict)
  assert.equal(db.rows.get(saved.id).value, 'Use sen')
  for (let index = 0; index < 8; index++) await editNovaMemory('a', saved.id, `Preference ${index}`, db.rows.get(saved.id).revision, db)
  assert.ok(db.rows.get(saved.id).previousValues.length <= 5)
})
test('a late model cannot overwrite a newer user memory edit or a newly created preference', async () => {
  const db = memoryDatabase()
  const [row] = await saveNovaMemories('a', [{ key: 'humor_preference', value: 'Light jokes' }], {}, db)
  const oldRevision = row.revision
  await editNovaMemory('a', row.id, 'No jokes', oldRevision, db)
  const result = await saveNovaMemories('a', [{ key: 'humor_preference', value: 'Sharp jokes' }], { expected: new Map([['humor_preference', oldRevision]]) }, db)
  assert.deepEqual(result, []); assert.equal(db.rows.get(row.id).value, 'No jokes')
  assert.deepEqual(await saveNovaMemories('a', [{ key: 'humor_preference', value: 'More jokes' }], { expected: new Map() }, db), [])
})
test('legacy aliases use the latest canonical revision and retain model-extraction provenance', async () => {
  const db = memoryDatabase()
  const row = await db.aiMemory.create({ data: { userId: 'a', key: 'preferred_address', value: 'Use sen', revision: 4 } })
  const snapshot = memoryRevisionSnapshot([row, { key: 'address_form', value: 'Use siz', revision: 1, updatedAt: '2000-01-01' }])
  assert.equal(snapshot.get('address_preference'), 4)
  const saved = await saveNovaMemories('a', [{ key: 'address_preference', value: 'Use siz' }], { expected: snapshot, origin: 'model', sourceQuote: 'Please remember to use siz.' }, db)
  assert.equal(saved.length, 1); assert.equal(saved[0].revision, 5); assert.equal(saved[0].origin, 'model')
})
test('diagnostics exclude transcripts, use real samples and withhold p95 without sufficient data', () => {
  const metrics = new NovaDiagnostics()
  metrics.sample('reply', -5, 'audio_clock'); metrics.sample('reply', NaN, 'audio_clock')
  for (let index = 1; index <= 19; index++) metrics.sample('reply', index * 10, 'transcript_proxy')
  let summary = summarizeSamples(metrics.snapshot().samples)
  assert.equal(summary.reply.count, 19); assert.equal(summary.reply.p95Ms, null)
  metrics.sample('reply', 200, 'transcript_proxy')
  summary = summarizeSamples(metrics.snapshot().samples)
  assert.equal(summary.reply.p50Ms, 100); assert.equal(summary.reply.p95Ms, 190)
  assert.equal(diagnosticsSnapshotSchema.safeParse({ ...metrics.snapshot(), transcript: 'private' }).success, false)
})
test('cost stays unknown without explicit rates and known usage; snapshots are detached', () => {
  const metrics = new NovaDiagnostics()
  assert.equal(configuredCostEstimate('fixture', metrics.snapshot(), '{}'), null)
  metrics.tokens(100, 20, 'response_totals'); metrics.tokens(50, 10, 'response_totals')
  metrics.count('modelCalls', 2)
  const snapshot = metrics.snapshot(); snapshot.counts.modelCalls = 100
  assert.equal(metrics.snapshot().counts.modelCalls, 2)
  const estimate = configuredCostEstimate('fixture', metrics.snapshot(), JSON.stringify({ fixture: { inputPerMillion: 1, outputPerMillion: 2, currency: 'USD', source: 'synthetic test rates, not market prices' } }))
  assert.equal(estimate.amount, .00021)
  assert.equal(estimate.coverage, 'response_totals')
})
test('quality suite contains at least 50 unique new scenarios and independent review criteria', async () => {
  const suite = JSON.parse(await readFile(new URL('./fixtures/nova-quality-v2.json', import.meta.url)))
  const rubric = JSON.parse(await readFile(new URL('./fixtures/nova-quality-rubric.json', import.meta.url)))
  const old = JSON.parse(await readFile(new URL('./fixtures/nova-evaluation.json', import.meta.url)))
  assert.ok(suite.filter(row => !row.driver).length >= 50)
  assert.equal(new Set(suite.map(row => row.message)).size, suite.length)
  assert.ok(suite.every(row => !old.some(previous => previous.message === row.message)))
  assert.ok(suite.every(row => rubric.categories[row.category]))
  assert.equal(rubric.dimensions.length, 9)
})

test('the same generation produces the answer, intent and grounded learning record without a classifier call', async t => {
  const fetchBefore = globalThis.fetch
  const original = { user: prisma.user.findUnique, memory: prisma.aiMemory.findMany, evidence: prisma.novaSkillEvidence.findMany, save: prisma.novaSkillEvidence.upsert, usage: prisma.aiUsageEvent.create }
  const config = { key: env.OPENAI_API_KEY, provider: env.AI_CHAT_PROVIDER, model: env.AI_CHAT_MODEL }
  let modelCalls = 0, saved = []
  env.OPENAI_API_KEY = 'fixture-key'; env.AI_CHAT_PROVIDER = 'openai'; env.AI_CHAT_MODEL = 'gpt-4.1-mini'
  prisma.user.findUnique = async () => ({ fullName: 'Synthetic learner', assessmentResults: [] })
  prisma.aiMemory.findMany = async () => []; prisma.novaSkillEvidence.findMany = async () => []
  prisma.aiUsageEvent.create = async () => ({})
  prisma.novaSkillEvidence.upsert = async ({ create }) => { saved.push(create); return create }
  globalThis.fetch = async () => { modelCalls++; return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ reply: 'Correct: the denominator stays four, so two quarters make one half.',
    understanding: { intent: 'attempt', topic: 'Fractions', approach: 'challenge', temporaryTone: 'warm' }, learningObservations: [observation] }) } }] })) }
  t.after(() => {
    globalThis.fetch = fetchBefore; prisma.user.findUnique = original.user; prisma.aiMemory.findMany = original.memory
    prisma.novaSkillEvidence.findMany = original.evidence; prisma.novaSkillEvidence.upsert = original.save; prisma.aiUsageEvent.create = original.usage
    env.OPENAI_API_KEY = config.key; env.AI_CHAT_PROVIDER = config.provider; env.AI_CHAT_MODEL = config.model
  })
  const answer = await answerAssistant('learner-a', assistantRequestSchema.parse({ turnId: 'attempt-1', message: observation.quote }))
  assert.equal(modelCalls, 1); assert.equal(answer.meta.modelRequests, 1)
  assert.equal(saved.length, 1); assert.equal(saved[0].quote, observation.quote); assert.equal(saved[0].userId, 'learner-a')
  assert.equal(answer.understanding.approach, 'challenge')
})
