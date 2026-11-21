import assert from 'node:assert/strict'
import test from 'node:test'
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'postgresql://fixture:fixture@127.0.0.1:1/nova_v3_fixture'
process.env.ACCESS_TOKEN_SECRET = 'nova-v3-fixture-access-secret'
process.env.REFRESH_TOKEN_SECRET = 'nova-v3-fixture-refresh-secret'
const language = await import('../dist/services/novaLanguage.js')
const { readNovaLesson, graphSamples, polynomial } = await import('../dist/services/novaLesson.js')
const { banterOpening, roastOpenings } = await import('../dist/services/novaBanter.js')
const { defaultNovaPerformance } = await import('../dist/services/novaPersona.js')
const { assistantRequestSchema, parseAssistantReply } = await import('../dist/services/assistantPolicy.js')
const { geminiLiveSetup } = await import('../dist/services/geminiLive.service.js')
const { safeMemory } = await import('../dist/services/novaMemory.service.js')

test('Uzbek terms, names, informal writing, Cyrillic and apostrophes retain the actual language', () => {
  for (const message of ['Menga Present Simple’ni tushuntir.', 'Jonim, bu formulani yana bir marta ko‘rsat.', 'Men Toshkentdanman, IELTS’ga tayyorlanyapman.', 'Yo‘q, men boshqa narsani aytdim.', 'менга бу қоидани яна тушунтир', "menga sodda qilib tushuntirib ber"]) assert.equal(language.resolveNovaLanguage(message, 'auto', 'en').language, 'uz', message)
  assert.equal(language.latinUzbekTranscript('Менга қоидани тушунтир.'), 'Menga qoidani tushuntir.')
  assert.equal(language.latinUzbekTranscript('مرحبا كيف حالك'), 'مرحبا كيف حالك', 'An Arabic transcript cannot be repaired by relabelling/transliteration')
})
test('short acknowledgements and loanword banter never replace the last reliable language', () => {
  for (const message of ['ha', 'okay', 'davom et', 'E, sen tvar…', 'Elyor', 'IELTS', '2 + 2']) assert.equal(language.resolveNovaLanguage(message, 'auto', 'uz').language, 'uz', message)
  assert.equal(language.resolveNovaLanguage('okay', 'auto', 'ru').language, 'ru')
})
test('explicit switches update selection but quoted study text is not a language switch', () => {
  assert.equal(language.resolveNovaLanguage('Endi inglizcha tushuntir.', 'uz', 'uz').selection, 'en')
  assert.equal(language.resolveNovaLanguage('Теперь по-русски', 'uz', 'uz').language, 'ru')
  assert.equal(language.resolveNovaLanguage('O‘zbekcha davom et', 'en', 'en').language, 'uz')
  assert.equal(language.resolveNovaLanguage('Menga "I love you" bilan misol ko‘rsat.', 'auto', 'uz').language, 'uz')
  assert.equal(language.resolveNovaLanguage('Что значит имя Elyor? Объясни мне.', 'auto', 'uz').language, 'ru')
})
test('unsupported script/Turkish triggers clarification without invented confidence', () => {
  for (const text of ['مرحبا كيف حالك اليوم', 'Merhaba, lütfen bana bunu anlat.']) assert.equal(language.inspectLanguage(text).status, 'unsupported')
  assert.equal(language.inspectLanguage('').status, 'ambiguous')
  assert.equal('confidence' in language.inspectLanguage('ha'), false)
  assert.equal(language.languageViolation('This is the answer. You can use this rule.', 'uz'), true)
  assert.equal(language.languageViolation('Menga mos misol: "This is the answer."', 'uz'), false)
})
export const lesson = { version: 1, id: 'square', language: 'uz', title: 'Kvadrat funksiya', blocks: [
  { id: 'f', type: 'formula', title: 'Formula', latex: 'y=x^2', explanation: 'Bu formula bilan y qiymatini topamiz.', narration: 'Bu formula bilan y qiymatini topamiz.', symbols: [{ symbol: 'x', meaning: 'Argument' }] },
  { id: 'g', type: 'graph', title: 'Grafik', xLabel: 'x', yLabel: 'y', domain: [-2, 2], coefficients: [0, 0, 1], points: [{ x: 1, y: 1, label: '(1,1)' }], caption: 'Grafikda shu nuqtani ko‘ramiz.' },
  { id: 'e', type: 'exercise', title: 'Mashq', prompt: 'Endi x = 2 uchun hisoblang.', hint: 'Sonni kvadratga oshiring.' },
] }
test('structured lessons derive graphs from bounded coefficients and reject mismatched points/scripts/duplicate ids', () => {
  const valid = readNovaLesson(lesson, 'uz'); assert.ok(valid)
  assert.equal(graphSamples(valid.blocks[1]).length, 81); assert.equal(polynomial([1, 2, 3], 2), 17)
  assert.equal(readNovaLesson({ ...lesson, blocks: [lesson.blocks[1], lesson.blocks[1]] }), undefined)
  assert.equal(readNovaLesson({ ...lesson, blocks: [{ ...lesson.blocks[1], points: [{ x: 1, y: 7 }] }] }), undefined)
  assert.equal(readNovaLesson({ ...lesson, blocks: [{ ...lesson.blocks[1], coefficients: ['process.exit()'] }] }), undefined)
  assert.equal(readNovaLesson({ ...lesson, blocks: [{ id: 'bad', title: 'Bad', type: 'html', html: '<script>bad()</script>' }] }), undefined)
  assert.equal(readNovaLesson(lesson, 'ru'), undefined)
  const answer = parseAssistantReply(JSON.stringify({ reply: 'Bu yerda foydali tushuntirish bor.', lesson: { broken: true } }))
  assert.equal(answer.lesson, undefined); assert.ok(answer.reply.includes('foydali'))
})
test('requested comebacks require opt-in, respect age setting, examiner mode and immediate boundaries', () => {
  const angry = defaultNovaPerformance('playful_angry')
  assert.equal(banterOpening({}, angry, 'A harmless challenge'), null)
  assert.equal(banterOpening({ banter: 'light' }, angry, 'ChatGPT sendan aqlliroq.'), roastOpenings.ahmoq)
  for (const phrase of Object.keys(roastOpenings)) assert.equal(banterOpening({ banter: 'sharp', adultConfirmed: true, roastPhrase: phrase }, angry, 'A harmless challenge'), roastOpenings[phrase])
  assert.equal(banterOpening({ banter: 'sharp', adultConfirmed: false, roastPhrase: 'dalbayop' }, angry, 'A harmless challenge'), roastOpenings.ahmoq)
  for (const text of ['Jiddiy gapir', 'To‘xta', 'Bunday dema', 'Tushunmadim, qiynalyapman']) assert.equal(banterOpening({ banter: 'sharp', adultConfirmed: true }, angry, text), null)
  assert.equal(banterOpening({ banter: 'light' }, angry, 'A challenge', true), null)
})
test('Gemini native configuration uses documented transcription hints and manual activity only when requested', () => {
  const auto = geminiLiveSetup(assistantRequestSchema.parse({ message: 'Hello' }), {}).setup
  assert.equal(auto.realtimeInputConfig.automaticActivityDetection.disabled, false)
  const manual = geminiLiveSetup(assistantRequestSchema.parse({ message: 'Menga dars ber', language: 'uz', inputControl: 'hybrid' }), {}).setup
  assert.equal(manual.realtimeInputConfig.automaticActivityDetection.disabled, true)
  assert.deepEqual(manual.inputAudioTranscription.languageCodes, ['uz'])
  assert.ok(manual.inputAudioTranscription.customVocabulary.includes('Toshkent'))
  assert.equal(manual.generationConfig.speechConfig.languageCode, undefined)
  assert.equal(manual.enableAffectiveDialog, undefined)
})
test('ephemeral push-to-talk and speaking state never become long-term memory', () => {
  for (const key of ['space_pressed', 'ptt', 'speaking', 'voice_state', 'current_tone']) assert.equal(safeMemory({ key, value: 'true' }), null)
})
test('text output is withheld until checked, repairs once and does not translate unsupported input', async t => {
  const { prisma } = await import('../dist/lib/prisma.js'), { env } = await import('../dist/config/env.js'), { answerAssistant } = await import('../dist/services/assistant.service.js')
  const original = { fetch: globalThis.fetch, user: prisma.user.findUnique, memory: prisma.aiMemory.findMany, evidence: prisma.novaSkillEvidence.findMany, usage: prisma.aiUsageEvent.create, key: env.OPENAI_API_KEY, provider: env.AI_CHAT_PROVIDER }
  t.after(() => { globalThis.fetch = original.fetch; prisma.user.findUnique = original.user; prisma.aiMemory.findMany = original.memory; prisma.novaSkillEvidence.findMany = original.evidence; prisma.aiUsageEvent.create = original.usage; env.OPENAI_API_KEY = original.key; env.AI_CHAT_PROVIDER = original.provider })
  prisma.user.findUnique = async () => ({ fullName: 'Fixture', assessmentResults: [] }); prisma.aiMemory.findMany = async () => []; prisma.novaSkillEvidence.findMany = async () => []; prisma.aiUsageEvent.create = async () => ({})
  env.OPENAI_API_KEY = 'fixture'; env.AI_CHAT_PROVIDER = 'openai'
  let calls = 0; const visible = []
  globalThis.fetch = async (_url, options) => { calls++; const content = JSON.stringify({ reply: calls === 1 ? 'مرحبا كيف حالك اليوم' : 'Bu misol bilan qoidani tushuntiramiz.', language: calls === 1 ? 'ar' : 'uz' }); return JSON.parse(options.body).stream ? new Response(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\ndata: [DONE]\n\n`, { headers: { 'Content-Type': 'text/event-stream' } }) : new Response(JSON.stringify({ choices: [{ message: { content } }] })) }
  const result = await answerAssistant('fixture', assistantRequestSchema.parse({ message: 'Menga qoidani tushuntir.', language: 'uz' }), undefined, reply => visible.push(reply))
  assert.equal(calls, 2); assert.equal(result.meta.languageRepaired, true); assert.deepEqual(visible, ['Bu misol bilan qoidani tushuntiramiz.'])
  calls = 0
  const unsupported = await answerAssistant('fixture', assistantRequestSchema.parse({ message: 'مرحبا كيف حالك اليوم', language: 'uz' }))
  assert.equal(calls, 0); assert.equal(unsupported.replyLanguage, 'uz')
  globalThis.fetch = async () => { calls++; return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ reply: 'Mayli, endi foydali misolni ko‘ramiz.', performance: defaultNovaPerformance('playful_angry') }) } }] })) }
  const roast = await answerAssistant('fixture', assistantRequestSchema.parse({ message: 'ChatGPT sendan aqlliroq.', language: 'uz', coachPreferences: { banter: 'light' } }))
  assert.equal(calls, 1); assert.ok(roast.reply.startsWith(roastOpenings.ahmoq), 'An opted-in mock-angry text reply contains one of the requested openings')
})
