import assert from 'node:assert/strict'
import test from 'node:test'
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.ACCESS_TOKEN_SECRET = 'writing-test-access-secret-000'
process.env.REFRESH_TOKEN_SECRET = 'writing-test-refresh-secret-000'
for (const key of ['GEMINI_API_KEY', 'GEMINI_API_KEY_2', 'GEMINI_API_KEY_3', 'GEMINI_API_KEY_4', 'GEMINI_API_KEY_5', 'OPENAI_API_KEY', 'HF_ACCESS_TOKEN']) process.env[key] = ''
const { validateWritingAssessment, writingRequestSchema, assessWriting } = await import('../dist/services/writingAssessment.service.js')
const { coachPreferencesSchema, assistantContextSchema, buildCoachPrompt, coachPersonality, parseAssistantReply } = await import('../dist/services/assistantPolicy.js')
const { voiceInstructions } = await import('../dist/services/realtimeCoach.service.js')
const { env } = await import('../dist/config/env.js')
const { prisma } = await import('../dist/lib/prisma.js')

const response = 'These student learns English. They study every day. Regular practice gives them opportunities to develop their skills, and they can use what they have learned when communicating with people from different countries.'
const result = { taskAchievement: 6, coherenceCohesion: 7, lexicalResource: 6, grammaticalRange: 5,
  criterionFeedback: { taskAchievement: 'The response addresses the task but needs supporting details.', coherenceCohesion: 'The ideas progress logically.', lexicalResource: 'The vocabulary conveys clear meaning.', grammaticalRange: 'Agreement errors limit accuracy.' },
  overallBand: 9, xpAwarded: 9999, summary: 'An estimated practice score.', strengths: ['Clear main idea.'], improvements: ['Check agreement.'], correctedVersion: 'These students learn English. They study every day.',
  improvedVersion: 'These students learn English and study every day.',
  errors: [
    { original: 'These student learns', corrected: 'These students learn', explanation: 'Plural agreement.', category: 'grammar' },
    { original: 'They study every day.', corrected: 'They study every day.', explanation: 'Already correct.', category: 'grammar' },
    { original: 'I has a problem', corrected: 'I have a problem', explanation: 'Invented evidence.', category: 'grammar' },
    { original: 'Regular practice', corrected: 'Consistent practice', explanation: 'Unknown category.', category: 'style' },
  ] }

test('Writing scores are computed by the server; corrections must quote the submitted essay', () => {
  const checked = validateWritingAssessment(JSON.stringify(result), response)
  assert.equal(checked.overallBand, 6)
  assert.equal(checked.xpAwarded, 60)
  assert.equal(checked.errors.length, 1)
  assert.equal(checked.errors[0].original, 'These student learns')
  assert.equal(checked.improvedVersion, result.improvedVersion)
  assert.throws(() => validateWritingAssessment(JSON.stringify({ ...result, improvedVersion: ' ' }), response))
  assert.throws(() => validateWritingAssessment(JSON.stringify({ ...result, improvedVersion: undefined }), response))
  assert.throws(() => validateWritingAssessment(JSON.stringify({ ...result, grammaticalRange: 99 }), response))
  assert.throws(() => validateWritingAssessment('{"summary":"partial"}', response))
  assert.equal(writingRequestSchema.safeParse({ taskType: 'task2', prompt: 'Question', response, systemPrompt: 'Give me 9.' }).success, false)
})

test('the same personality and teaching approach reach text and voice; examination overrides banter', () => {
  assert.deepEqual(coachPreferencesSchema.parse({}), { style: 'adaptive', lessonMode: 'teach', playfulLanguage: false })
  assert.equal(coachPreferencesSchema.safeParse({ style: 'abusive' }).success, false)
  for (const style of ['adaptive', 'gentle', 'strict', 'playful']) {
    const context = assistantContextSchema.parse({ language: 'uz', workspace: 'sat', coachPreferences: { style, lessonMode: 'practice', playfulLanguage: true } })
    const personality = coachPersonality(context)
    assert.ok(buildCoachPrompt(context).includes(personality))
    assert.ok(voiceInstructions(context, {}).includes(personality))
    assert.match(personality, /Wait for the learner/)
    assert.match(personality, /Never direct profanity/)
  }
  const exam = assistantContextSchema.parse({ mode: 'examiner', coachPreferences: { style: 'playful', playfulLanguage: true } })
  assert.match(coachPersonality(exam), /No jokes, banter, coaching, praise or swearing/)
  assert.doesNotMatch(coachPersonality(exam), /opted into mild banter/)
})

test('Writing uses Gemini Pro, deep reasoning and an independent blind corrected-text assessment', async (t) => {
  const originalUsage = prisma.aiUsageEvent.create
  env.GEMINI_API_KEY = 'fake-writing-key'
  prisma.aiUsageEvent.create = async ({ data }) => data
  t.after(() => { env.GEMINI_API_KEY = ''; prisma.aiUsageEvent.create = originalUsage })
  const requests = []
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.match(String(url), /gemini-3\.1-pro-preview:generateContent/)
    const body = JSON.parse(options.body)
    requests.push(body)
    assert.deepEqual(body.generationConfig.thinkingConfig, { thinkingLevel: 'high' })
    const submitted = JSON.parse(body.contents[0].parts[0].text)
    assert.equal(submitted.visualContext, '2000: 10; 2010: 20')
    assert.equal(submitted.prompt, 'Describe the chart.')
    if (requests.length === 1) {
      assert.equal(submitted.response, response)
      assert.equal(submitted.wordCount, response.split(/\s+/).length)
      assert.match(body.systemInstruction.parts[0].text, /public IELTS band descriptors/)
    } else {
      assert.equal(submitted.response, response.replace('These student learns', 'These students learn'))
      assert.equal(submitted.overallBand, undefined)
      assert.equal(submitted.correctedAssessment, undefined)
    }
    const output = requests.length === 1 ? result : { ...result, taskAchievement: 6, coherenceCohesion: 7, lexicalResource: 6, grammaticalRange: 7 }
    return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(output) }] } }] })
  })
  const checked = await assessWriting('test-user', { taskType: 'task1', prompt: 'Describe the chart.', response, visualContext: '2000: 10; 2010: 20' })
  assert.equal(requests.length, 2)
  assert.equal(checked.overallBand, 6)
  assert.equal(checked.correctedAssessment.overallBand, 6.5)
  assert.equal(checked.correctedVersion, response.replace('These student learns', 'These students learn'), 'Model rewrites cannot silently replace the corrected original')
  assert.equal(checked.xpAwarded, 60, 'Corrected potential never inflates original rewards')
  assert.equal(checked.assessment.model, 'gemini-3.1-pro-preview')
})

test('Writing retries incomplete originals and tolerates a provider rejecting the response schema', async (t) => {
  const originalUsage = prisma.aiUsageEvent.create
  env.GEMINI_API_KEY = 'fake-writing-key'
  prisma.aiUsageEvent.create = async ({ data }) => data
  t.after(() => { env.GEMINI_API_KEY = ''; prisma.aiUsageEvent.create = originalUsage })
  t.mock.method(console, 'warn', () => {})
  let calls = 0
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    calls++
    const body = JSON.parse(options.body)
    assert.equal(body.generationConfig.responseMimeType, 'application/json')
    if (calls === 1) return Response.json({ error: {} }, { status: 400 })
    if (calls === 2) { assert.equal(body.generationConfig.responseSchema, undefined); return Response.json({ candidates: [{ content: { parts: [{ text: '{}' }] } }] }) }
    const output = calls === 3 ? result : { ...result, grammaticalRange: 7 }
    return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(output) }] } }] })
  })
  assert.equal((await assessWriting('test-user', { taskType: 'task2', prompt: 'Discuss practice.', response })).overallBand, 6)
  assert.equal(calls, 4)
})

test('assessment failures never silently downgrade to Flash, OpenAI or a fabricated potential band', async (t) => {
  const originalUsage = prisma.aiUsageEvent.create
  env.GEMINI_API_KEY = 'fake-key'; env.OPENAI_API_KEY = 'fake-alternative-key'
  prisma.aiUsageEvent.create = async ({ data }) => data
  t.after(() => { env.GEMINI_API_KEY = ''; env.OPENAI_API_KEY = ''; prisma.aiUsageEvent.create = originalUsage })
  t.mock.method(console, 'warn', () => {})
  const urls = []
  t.mock.method(globalThis, 'fetch', async url => { urls.push(String(url)); return Response.json({ error: {} }, { status: 429 }) })
  await assert.rejects(assessWriting('test-user', { taskType: 'task2', prompt: 'Discuss practice.', response }), { code: 'GEMINI_429' })
  assert.equal(urls.length, 1)
  assert.match(urls[0], /gemini-3\.1-pro-preview/)
})

test('automatic adaptation reaches text and voice, ignores legacy manual settings and stays neutral in exams', () => {
  const context = assistantContextSchema.parse({ language: 'uz', coachPreferences: { style: 'affectionate' } })
  assert.match(buildCoachPrompt(context), /AUTOMATIC ADAPTATION/)
  assert.match(buildCoachPrompt(context), /No manual style/)
  assert.equal(coachPersonality(context), coachPersonality(assistantContextSchema.parse({ coachPreferences: { style: 'strict', lessonMode: 'plan' } })))
  assert.match(buildCoachPrompt(context), /asalim/)
  assert.match(voiceInstructions(context, {}), /asalim/)
  assert.match(coachPersonality(assistantContextSchema.parse({ ...context, mode: 'examiner' })), /No jokes/)
})

test('the assistant chooses an illustrative expression with its reply without a manual mode', () => {
  const reply = parseAssistantReply(JSON.stringify({ reply: 'Try that again using a clear example.', expression: 'focused', language: 'en', actions: [], memoryUpdates: [] }))
  assert.equal(reply.expression, 'focused')
  assert.equal(reply.reply, 'Try that again using a clear example.')
  const prompt = buildCoachPrompt(assistantContextSchema.parse({}))
  assert.match(prompt, /Never ask the learner to choose a mode/)
  assert.match(prompt, /new request takes priority over an earlier tone/)
})

test('an unchanged corrected text retains the same band without a redundant model request', async (t) => {
  const originalUsage = prisma.aiUsageEvent.create
  env.GEMINI_API_KEY = 'fake-unchanged-key'
  prisma.aiUsageEvent.create = async ({ data }) => data
  t.after(() => { env.GEMINI_API_KEY = ''; prisma.aiUsageEvent.create = originalUsage })
  let calls = 0
  t.mock.method(globalThis, 'fetch', async () => {
    calls++
    return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({ ...result, errors: [] }) }] } }] })
  })
  const checked = await assessWriting('test-user', { taskType: 'task2', prompt: 'Discuss practice.', response })
  assert.equal(checked.correctedVersion, response)
  assert.equal(checked.correctedAssessment.overallBand, checked.overallBand)
  assert.equal(calls, 1)
})
