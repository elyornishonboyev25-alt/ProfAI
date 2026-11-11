import assert from 'node:assert/strict'
import test from 'node:test'
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.ACCESS_TOKEN_SECRET = 'writing-queue-test-access-0000'
process.env.REFRESH_TOKEN_SECRET = 'writing-queue-test-refresh-000'
for (const key of ['GEMINI_API_KEY', 'GEMINI_API_KEY_2', 'GEMINI_API_KEY_3', 'GEMINI_API_KEY_4', 'GEMINI_API_KEY_5', 'OPENAI_API_KEY', 'HF_ACCESS_TOKEN']) process.env[key] = ''
const { prisma } = await import('../dist/lib/prisma.js')
const { env } = await import('../dist/config/env.js')
const { AiGenerationError, geminiFailure } = await import('../dist/services/aiProvider.service.js')
const { submitWriting, getWritingSubmission, drainWritingSubmissions, writingRetry } = await import('../dist/services/writingSubmission.service.js')

const input = { taskType: 'task2', prompt: 'Why is learning English useful?', response: 'These student learns English. They practise every day because English helps them communicate with people from different countries and gives them access to useful information about the world.' }
const feedback = { taskAchievement: 'The position is clear but needs development.', coherenceCohesion: 'The ideas progress logically.', lexicalResource: 'Vocabulary is appropriate.', grammaticalRange: 'Agreement needs correction.' }
const result = { taskAchievement: 6, coherenceCohesion: 6, lexicalResource: 6, grammaticalRange: 6, criterionFeedback: feedback, summary: 'Estimated practice band.', strengths: ['Clear position.'], improvements: ['Develop one example.'], errors: [{ original: 'These student learns', corrected: 'These students learn', explanation: 'Use plural agreement.', category: 'grammar' }], correctedVersion: '', improvedVersion: 'These students learn English. They practise daily to communicate with people from other countries and access useful information.' }

function database(t) {
  const rows = new Map()
  const patch = (target, key, value) => { const original = target[key]; target[key] = value; t.after(() => { target[key] = original }) }
  const due = row => row.status === 'PROCESSING' ? row.leaseUntil <= new Date() : ['QUEUED', 'WAITING_CONFIGURATION'].includes(row.status) && row.nextAttemptAt <= new Date()
  patch(prisma.writingSubmission, 'upsert', async ({ where, create }) => {
    let row = [...rows.values()].find(r => r.userId === where.userId_fingerprint.userId && r.fingerprint === where.userId_fingerprint.fingerprint)
    if (!row) { row = { id: `submission-${rows.size}`, ...create, status: 'QUEUED', result: null, checkpoint: null, attempts: 0, nextAttemptAt: new Date(), leaseUntil: null, lockToken: null, createdAt: new Date(), updatedAt: new Date() }; rows.set(row.id, row) }
    return structuredClone(row)
  })
  patch(prisma.writingSubmission, 'findFirst', async ({ where }) => { const row = rows.get(where.id); return row?.userId === where.userId ? structuredClone(row) : null })
  patch(prisma.writingSubmission, 'findMany', async () => [...rows.values()].filter(due).map(row => structuredClone(row)))
  patch(prisma.writingSubmission, 'updateMany', async ({ where, data }) => {
    let count = 0
    for (const row of rows.values()) {
      if (where.id && row.id !== where.id || where.lockToken && row.lockToken !== where.lockToken || where.status && row.status !== where.status || where.OR && !due(row)) continue
      const attempts = data.attempts ? row.attempts + data.attempts.increment : row.attempts
      Object.assign(row, structuredClone(data), { attempts }); count++
    }
    return { count }
  })
  patch(prisma.aiUsageEvent, 'create', async ({ data }) => data)
  t.mock.method(console, 'warn', () => {})
  env.GEMINI_API_KEY = 'writing-durable-test-key'
  t.after(() => { env.GEMINI_API_KEY = ''; env.OPENAI_ASSESSMENT_MODEL = ''; env.OPENAI_API_KEY = '' })
  return rows
}
async function until(check) { for (let i = 0; i < 100; i++) { if (check()) return; await new Promise(resolve => setTimeout(resolve, 10)) } assert.fail('Worker did not settle') }

test('identical submissions reuse one durable job and are isolated by owner', async t => {
  const rows = database(t)
  const [a, b] = await Promise.all([submitWriting('student-a', input), submitWriting('student-a', input)])
  assert.equal(a.id, b.id)
  assert.equal(rows.size, 1)
  assert.equal(await getWritingSubmission('student-b', a.id), null)
  assert.equal((await getWritingSubmission('student-a', a.id)).result, undefined)
  assert.equal('input' in a, false)
  await assert.rejects(submitWriting('student-a', { ...input, response: '' }))
})

test('zero quota waits for configuration without fabricating a band or losing the submitted essay', async t => {
  const rows = database(t)
  t.mock.method(globalThis, 'fetch', async () => Response.json({ error: { message: 'Quota exceeded, limit: 0' } }, { status: 429 }))
  const submitted = await submitWriting('student-a', input)
  await drainWritingSubmissions()
  await until(() => rows.get(submitted.id).status === 'WAITING_CONFIGURATION')
  const row = rows.get(submitted.id)
  assert.equal(row.input.response, input.response)
  assert.equal(row.result, null)
  assert.equal(row.lastErrorCode, 'GEMINI_QUOTA_UNAVAILABLE')
  assert.ok(row.nextAttemptAt > new Date())
  assert.equal((await getWritingSubmission('student-a', submitted.id)).result, undefined)
})

test('a corrected-score outage resumes from the original checkpoint, including after an expired worker lease', async t => {
  const rows = database(t)
  let originals = 0, corrected = 0, available = false
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    const sent = JSON.parse(JSON.parse(options.body).contents[0].parts[0].text)
    if (sent.response === input.response) originals++
    else { corrected++; if (!available) return Response.json({ error: { message: 'limit: 0' } }, { status: 429 }) }
    return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(result) }] } }] })
  })
  const job = await submitWriting('student-a', input)
  await drainWritingSubmissions()
  await until(() => rows.get(job.id).status === 'WAITING_CONFIGURATION')
  const row = rows.get(job.id)
  assert.equal(row.checkpoint.assessment.overallBand, 6)
  assert.equal(row.result, null, 'The original is not presented as a complete two-score report')
  available = true
  Object.assign(row, { status: 'PROCESSING', lockToken: 'dead-process', leaseUntil: new Date(0) })
  await Promise.all([drainWritingSubmissions(), drainWritingSubmissions()])
  await until(() => row.status === 'COMPLETED')
  assert.equal(originals, 1, 'A restart must not pay for the original assessment again')
  assert.equal(corrected, 2)
  assert.equal(row.result.correctedVersion, input.response.replace('These student learns', 'These students learn'))
  assert.equal(row.result.correctedAssessment.overallBand, 6)
  assert.equal(row.lockToken, null)
})

test('retry scheduling distinguishes permanent setup problems from overload and honors provider RetryInfo', async () => {
  const error = await geminiFailure(Response.json({ error: { message: 'Temporary overload', details: [{ retryDelay: '62.5s' }] } }, { status: 429 }))
  assert.equal(error.retryAfterMs, 62_500)
  const retry = writingRetry(new AiGenerationError(503, 'GEMINI_429', 'Busy', error.retryAfterMs), 1)
  assert.equal(retry.status, 'QUEUED')
  assert.ok(retry.delayMs >= 62_500)
  assert.equal(writingRetry(new AiGenerationError(503, 'AI_NOT_CONFIGURED', 'Missing key'), 1).status, 'WAITING_CONFIGURATION')
})
