import assert from 'node:assert/strict'
import test from 'node:test'
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'postgresql://fixture:fixture@127.0.0.1:1/nova_study_fixture'
process.env.ACCESS_TOKEN_SECRET = 'nova-study-access-fixture-secret'
process.env.REFRESH_TOKEN_SECRET = 'nova-study-refresh-fixture-secret'
for (const key of ['GEMINI_API_KEY', 'GEMINI_API_KEY_2', 'GEMINI_API_KEY_3', 'GEMINI_API_KEY_4', 'GEMINI_API_KEY_5', 'OPENAI_API_KEY', 'HF_ACCESS_TOKEN']) process.env[key] = ''
const { prisma } = await import('../dist/lib/prisma.js')
const { getStudyContext, publicStudyContext, novaCatalog, hasActiveExam, attemptsFromRows } = await import('../dist/services/novaStudy.service.js')
const { runNovaTool } = await import('../dist/services/novaTools.service.js')
const { validWritingAnchors, writingVersion } = await import('../dist/services/novaStudy.js')
const { inspectLanguage, resolveNovaLanguage, novaLanguageSchema } = await import('../dist/services/novaLanguage.js')
const { assistantRequestSchema, parseAssistantReply } = await import('../dist/services/assistantPolicy.js')
const catalog = await novaCatalog(), source = catalog.find(t => t.skill === 'listening' && t.questions.some(q => q.audioUrl))
assert.ok(source)
const q = source.questions.find(q => q.audioUrl)
const ref = { skill: 'listening', testId: source.id, attemptId: 'attempt-one', questionId: q.id, mode: 'analyze' }
let rows = []
const history = owner => [{ key: `smarttest-reading-analysis-history-v1:${owner}`, value: JSON.stringify([{ attemptKey: 'attempt-one', testId: source.id, testTitle: source.title, savedAt: '2026-11-20T10:00:00Z', isPartial: true, resultPayload: { answers: { [q.id]: 'student original answer' } } }]) }]
prisma.accountLearningData.findMany = async ({ where }) => where.userId === 'learner' ? rows : []

test('source catalog contains real IELTS/SAT/Speaking/Writing questions and safe original recordings', () => {
  for (const skill of ['reading', 'listening', 'speaking', 'writing', 'sat-math', 'sat-rw']) assert.ok(catalog.some(t => t.skill === skill && t.questions.length), skill)
  assert.ok(q.id && q.text && q.audioUrl)
  assert.ok(catalog.every(t => t.route.startsWith('/') && !t.route.startsWith('//')))
  assert.ok(catalog.filter(t => t.skill === 'speaking').every(t => t.questions.every(q => typeof q.text === 'string' && q.text && !q.text.includes('"sample"'))))
})
test('existing timestamp cues retain their actual source, without a sentence-alignment claim', async () => {
  rows = []
  const test = catalog.find(t => t.id === 'ielts-listening-20'), question = test.questions.find(q => q.id === 'lt20-q1')
  assert.deepEqual(question.sourceRange, { start: 126, end: 133, provenance: 'catalog_cue', reference: 'Part 1 · 02:06–02:13' })
  const result = await runNovaTool('learner', { id: 'catalog-cue', name: 'get_listening_segment', args: { skill: 'listening', testId: test.id, questionId: question.id, mode: 'practice' } })
  assert.equal(result.data.start, 126); assert.equal(result.data.end, 133); assert.equal(result.data.alignment, 'source_cue')
})
test('Analyze is owned, exact attempt/test/question matched; partial completed subset remains reviewable', async () => {
  rows = history('learner')
  const context = await getStudyContext('learner', ref)
  assert.equal(context.question.userAnswer, 'student original answer')
  assert.equal(context.reference.attemptId, 'attempt-one')
  assert.equal('evidence' in publicStudyContext(context), false)
  assert.deepEqual(context.evidence.answer, q.answer)
  assert.equal(attemptsFromRows(rows, 'learner')[0].completed, true)
  await assert.rejects(getStudyContext('other', ref), { code: 'ATTEMPT_NOT_FOUND' })
  await assert.rejects(getStudyContext('learner', { ...ref, testId: 'different-test' }), { code: 'ATTEMPT_TEST_MISMATCH' })
  await assert.rejects(getStudyContext('learner', { ...ref, questionId: 'foreign-question' }), { code: 'QUESTION_NOT_FOUND' })
})
test('Practice reads source without mutating original result; page/exam cannot retrieve keys', async () => {
  rows = history('learner'); const before = JSON.stringify(rows)
  const result = await getStudyContext('learner', { ...ref, mode: 'practice', attemptId: undefined })
  assert.equal(result.attempt, undefined); assert.equal(JSON.stringify(rows), before)
  for (const mode of ['page', 'exam']) await assert.rejects(getStudyContext('learner', { ...ref, mode }))
})
test('server rejects all answer tools during a synced active timed test, including fabricated practice mode', async () => {
  rows = [...history('learner'), { key: 'ielts_test_session_current', value: JSON.stringify({ isTestActive: true, testMode: 'simulation' }) }]
  assert.equal(hasActiveExam(rows), true)
  for (const name of ['get_question_context', 'get_answer_evidence', 'play_listening_segment']) {
    const result = await runNovaTool('learner', { id: `exam-${name}`, name, args: { ...ref, mode: 'practice' } })
    assert.equal(result.ok, false); assert.equal(result.error.code, 'ACTIVE_EXAM')
  }
  rows = history('learner')
  assert.equal((await getStudyContext('learner', ref)).reference.mode, 'analyze')
})
test('typed tool errors, cancellation, replay IDs, source segments and navigation stay bounded', async () => {
  rows = history('learner')
  const nav = await runNovaTool('learner', { id: 'nav-one', name: 'open_page', args: { page: 'reading' } })
  assert.equal(nav.ok, true); assert.equal(nav.effect.path, '/ielts/reading/tests'); assert.equal(nav.effect.confirmation, false)
  const invalid = await runNovaTool('learner', { id: 'nav-invalid', name: 'open_page', args: { page: 'https://attacker.test' } })
  assert.equal(invalid.error.code, 'INVALID_ARGUMENTS')
  const mismatch = await runNovaTool('learner', { id: 'nav-one', name: 'open_page', args: { page: 'writing' } })
  assert.equal(mismatch.error.code, 'TOOL_ID_REUSED')
  const segment = await runNovaTool('learner', { id: 'source-segment', name: 'get_listening_segment', args: ref })
  assert.equal(segment.data.audioUrl, q.audioUrl); assert.equal(segment.data.alignment, 'unavailable'); assert.equal(segment.data.start, 0)
  const controller = new AbortController(); controller.abort()
  await assert.rejects(runNovaTool('learner', { id: 'cancelled', name: 'open_page', args: { page: 'sat' } }, {}, controller.signal))
})
test('vocabulary save is a proposal until browser success, explicit term consent avoids redundant confirmation', async () => {
  rows = []
  const word = { term: 'resilient', definition: 'Able to recover after difficulties', uzbek: 'Qiyinchilikdan keyin o‘zini tiklay oladigan', example: 'She remained resilient.', context: 'speaking', origin: 'Nova practice' }
  const one = await runNovaTool('learner', { id: 'vocab-one', name: 'save_vocabulary', args: word })
  assert.equal(one.effect.confirmation, true)
  const two = await runNovaTool('learner', { id: 'vocab-two', name: 'save_vocabulary', args: word }, { learnerMessage: 'resilient so‘zini qo‘sh' })
  assert.equal(two.effect.confirmation, false)
  assert.equal(two.data.status, 'awaiting_browser_save')
  assert.deepEqual(await runNovaTool('learner', { id: 'vocab-one', name: 'save_vocabulary', args: word }), one)
})
test('writing anchors survive Unicode, reject stale edits and never change student text', async () => {
  rows = []
  const text = '😊 O‘zbekcha: I has a plan.', start = text.indexOf('has'), annotations = [{ id: 'grammar-one', version: writingVersion(text), start, end: start + 3, quote: 'has', kind: 'grammar', message: 'Check subject–verb agreement.', hint: 'I …' }]
  assert.equal(validWritingAnchors(text, annotations).length, 1)
  assert.equal(validWritingAnchors('new ' + text, annotations).length, 0)
  assert.equal(validWritingAnchors(text.replace('has', 'have'), annotations).length, 0)
  assert.equal(validWritingAnchors(text, [{ ...annotations[0], quote: 'have' }]).length, 0)
  const result = await runNovaTool('learner', { id: 'annotate', name: 'annotate_writing', args: { annotations } }, { writingDraft: text })
  assert.equal(result.ok, true); assert.equal(result.effect.text, text)
})
test('Nova speaks only Uzbek/English with legacy migration and code-switching stability', () => {
  assert.equal(novaLanguageSchema.parse('ru'), 'uz')
  assert.equal(resolveNovaLanguage('Menga Present Simple haqida tushuntir', 'auto', 'en').language, 'uz')
  for (const text of ['ha', 'yo‘q', 'davom et', 'okay']) assert.equal(resolveNovaLanguage(text, 'auto', 'uz').language, 'uz')
  assert.equal(inspectLanguage('Теперь говори по-русски').status, 'unsupported')
  assert.equal(resolveNovaLanguage('Endi inglizcha tushuntir', 'uz', 'uz').language, 'en')
  assert.equal(assistantRequestSchema.parse({ message: 'hi', language: 'ru' }).language, 'uz')
  assert.equal(parseAssistantReply(JSON.stringify({ toolCalls: [{ id: 'a', name: 'list_user_attempts', args: { skill: 'listening' } }] })).toolCalls.length, 1)
})
test('lesson commands use the current owned source, preserve exam guards and avoid model calls', async () => {
  const { readStudyCommand } = await import('../dist/services/novaStudy.js')
  assert.equal(readStudyCommand('Yana eshittir!'), 'replay')
  assert.equal(readStudyCommand('oldingi savol'), 'previous_question')
  assert.equal(readStudyCommand('The phrase means continue working'), null, 'A student answer is not a control command')
  const { answerAssistant } = await import('../dist/services/assistant.service.js')
  prisma.user.findUnique = async () => ({ fullName: 'Fixture learner', assessmentResults: [] })
  prisma.aiMemory.findMany = async () => []; prisma.novaSkillEvidence.findMany = async () => []
  rows = history('learner')
  const ref = { skill: source.skill, testId: source.id, attemptId: 'attempt-one', questionId: q.id, mode: 'analyze' }
  const result = await answerAssistant('learner', assistantRequestSchema.parse({ turnId: 'direct-control', message: 'yana eshittir', language: 'uz', studyReference: ref }))
  assert.equal(result.meta.modelRequests, 0)
  assert.equal(result.toolResults[0].effect.action, 'replay')
  assert.deepEqual(result.toolResults[0].effect.reference, ref)
  rows = [{ key: 'ielts_test_session_active', value: JSON.stringify({ isTestActive: true, testMode: 'simulation' }) }]
  const blocked = await answerAssistant('learner', assistantRequestSchema.parse({ turnId: 'blocked-control', message: 'yana eshittir', studyReference: ref }))
  assert.equal(blocked.meta.model, 'exam_guard'); assert.deepEqual(blocked.toolResults, [])
  rows = []
})
test('shared assistant executes bounded real tool rounds before returning effects; failed tools cannot invent success', async t => {
  const { env } = await import('../dist/config/env.js'), { answerAssistant } = await import('../dist/services/assistant.service.js')
  const previous = { fetch: globalThis.fetch, provider: env.AI_CHAT_PROVIDER, key: env.OPENAI_API_KEY }
  t.after(() => { globalThis.fetch = previous.fetch; env.AI_CHAT_PROVIDER = previous.provider; env.OPENAI_API_KEY = previous.key })
  env.AI_CHAT_PROVIDER = 'openai'; env.OPENAI_API_KEY = 'fixture'
  prisma.user.findUnique = async () => ({ fullName: 'Fixture learner', assessmentResults: [] })
  prisma.aiMemory.findMany = async () => []; prisma.novaSkillEvidence.findMany = async () => []; prisma.aiUsageEvent.create = async () => ({})
  rows = history('learner')
  let generation = 0
  globalThis.fetch = async (_url, input) => {
    generation++
    if (generation > 1) assert.ok(input.body.includes('attempt-one'), 'The actual owned attempt must be returned to the model')
    const answer = generation === 1 ? { toolCalls: [{ id: 'history', name: 'list_user_attempts', args: { skill: 'listening' } }] }
      : generation === 2 ? { toolCalls: [{ id: 'analyze', name: 'open_attempt_analysis', args: { attemptId: 'attempt-one' } }] }
        : { reply: 'The saved Listening attempt is ready to open. What does the first question ask you to find?', language: 'en' }
    return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(answer) } }] }))
  }
  const result = await answerAssistant('learner', assistantRequestSchema.parse({ turnId: 'actual-tool-flow', language: 'en', message: 'Open my last completed Listening attempt.' }))
  assert.equal(generation, 3); assert.equal(result.toolResults.length, 2)
  assert.equal(result.toolResults[1].effect.reference.attemptId, 'attempt-one')
  assert.equal(result.meta.modelRequests, 3)
  generation = 0
  globalThis.fetch = async () => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(++generation === 1 ? { toolCalls: [{ id: 'foreign', name: 'open_attempt_analysis', args: { attemptId: 'other-person' } }] } : { reply: 'That attempt is not in your account history.', language: 'en' }) } }] }))
  const failed = await answerAssistant('learner', assistantRequestSchema.parse({ turnId: 'failed-tool-flow', language: 'en', message: 'Open that attempt.' }))
  assert.equal(failed.toolResults[0].ok, false); assert.equal(failed.toolResults[0].error.code, 'ATTEMPT_NOT_FOUND')
  assert.equal(failed.toolResults.some(result => result.effect), false)
})
