import assert from 'node:assert/strict'
import test from 'node:test'

process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.ACCESS_TOKEN_SECRET = 'ielts-test-access-secret-0000'
process.env.REFRESH_TOKEN_SECRET = 'ielts-test-refresh-secret-0000'
for (const key of ['GEMINI_API_KEY', 'GEMINI_API_KEY_2', 'GEMINI_API_KEY_3', 'GEMINI_API_KEY_4', 'GEMINI_API_KEY_5', 'OPENAI_API_KEY', 'HF_ACCESS_TOKEN']) process.env[key] = ''
const { validateWritingAssessment } = await import('../dist/services/writingAssessment.service.js')
const { validateAudioAssessment, speakingAssessmentSchema, assessSpeakingAudio, assessSpeakingTranscript } = await import('../dist/services/speakingAssessment.service.js')
const { env } = await import('../dist/config/env.js')
const { prisma } = await import('../dist/lib/prisma.js')
const { validateSpeakingRewrites } = await import('../dist/services/speakingRewrites.js')

const answer = 'Although I used to prefer studying alone, working with my classmates has helped me understand difficult topics because we can explain our different approaches to each other.'
const writing = {
  taskAchievement: 8, coherenceCohesion: 8, lexicalResource: 8, grammaticalRange: 9,
  criterionFeedback: { taskAchievement: 'Relevant, developed response.', coherenceCohesion: 'Clear logical progression.', lexicalResource: 'Precise vocabulary.', grammaticalRange: 'Flexible, accurate structures.' },
  summary: 'A strong practice response.', strengths: ['Clear explanation.'], improvements: [], errors: [], correctedVersion: answer, improvedVersion: answer,
}
const history = Array.from({ length: 6 }, () => [{ role: 'examiner', text: 'How do you prefer to study?' }, { role: 'candidate', text: answer }]).flat()
const audio = history.filter(turn => turn.role === 'candidate').map((_, answerIndex) => ({ answerIndex, data: Buffer.from(`sample-${answerIndex}`.repeat(20)).toString('base64'), mimeType: 'audio/webm' }))
const speaking = {
  fluencyBand: 8, lexicalBand: 8, grammarBand: 9, pronunciationBand: 8,
  summary: 'Strong coherent answers with mostly accurate language.', strengths: ['Clear development.'], weaknesses: [], improvementPriorities: [],
  evidence: ['fluency', 'lexical', 'grammar', 'pronunciation'].map(criterion => ({ criterion, answerIndex: 0, quote: criterion === 'pronunciation' ? '' : 'working with my classmates', explanation: criterion === 'pronunciation' ? 'Clear word stress and intelligible connected speech in the recording.' : 'This phrase supports the assessed language level.', exercise: 'Practise another topic.' })),
  improvedAnswers: history.filter(turn => turn.role === 'candidate').map((turn, answerIndex) => ({ answerIndex, original: turn.text, improved: turn.text })),
}

test('high bands remain available; criterion means and half-band boundaries are deterministic', () => {
  assert.equal(validateWritingAssessment(JSON.stringify(writing), answer).overallBand, 8.5)
  assert.equal(validateAudioAssessment(JSON.stringify(speaking), history, audio.map(clip => clip.answerIndex)).overallBand, 8.5)
  for (const [last, expected] of [[6, 6], [7, 6.5], [9, 7]]) {
    assert.equal(validateAudioAssessment(JSON.stringify({ ...speaking, fluencyBand: 6, lexicalBand: 6, grammarBand: 6, pronunciationBand: last }), history, [0]).overallBand, expected)
  }
})

test('Writing applies the published very-short-answer rule without contaminating longer responses', () => {
  assert.equal(validateWritingAssessment(JSON.stringify(writing), 'I agree.').overallBand, 1)
  assert.match(validateWritingAssessment(JSON.stringify(writing), 'I agree.').criterionFeedback.grammaticalRange, /20 words or fewer/)
  assert.equal(validateWritingAssessment(JSON.stringify(writing), '').overallBand, 0)
  assert.equal(validateWritingAssessment(JSON.stringify(writing), answer).grammaticalRange, 9)
})

test('each Speaking score needs grounded evidence; text cannot fabricate acoustic evidence', () => {
  for (const criterion of ['fluency', 'lexical', 'grammar', 'pronunciation']) {
    assert.throws(() => validateAudioAssessment(JSON.stringify({ ...speaking, evidence: speaking.evidence.filter(item => item.criterion !== criterion) }), history, [0]))
  }
  assert.throws(() => validateAudioAssessment(JSON.stringify(speaking), history, [1]))
  const textEvidence = speaking.evidence.filter(item => item.criterion !== 'pronunciation')
  assert.throws(() => validateAudioAssessment(JSON.stringify({ ...speaking, evidence: textEvidence.map(item => ({ ...item, quote: '' })) }), history, []))
})

test('missing Speaking coaching does not discard grounded scores; rewrites tolerate whitespace and order only', () => {
  const partial = validateAudioAssessment(JSON.stringify({ ...speaking, improvedAnswers: [speaking.improvedAnswers[0]] }), history, [0])
  assert.equal(partial.overallBand, 8.5)
  assert.equal(partial.improvedAnswers.length, 1)
  const candidates = [{ text: 'I like\nreading.' }, { text: '' }, { text: 'At home.' }]
  const rewrites = [{ answerIndex: 2, original: 'At home.', improved: 'I read at home.' }, { answerIndex: 0, original: 'I like reading.', improved: 'I enjoy reading.' }]
  assert.deepEqual(validateSpeakingRewrites(rewrites, candidates).map(item => [item.answerIndex, item.original]), [[0, 'I like\nreading.'], [2, 'At home.']])
  assert.throws(() => validateSpeakingRewrites([{ ...rewrites[0], original: 'Someone else.' }, rewrites[1]], candidates))
  assert.throws(() => validateSpeakingRewrites([rewrites[0], rewrites[0], rewrites[1]], candidates))
})

test('missing improved answers are repaired in small batches without changing the audio band', async (t) => {
  const nativeFetch = globalThis.fetch, originalUsage = prisma.aiUsageEvent.create
  env.GEMINI_API_KEY = 'fake-repair-key'; env.GEMINI_MODELS = 'gemini-2.5-flash'
  prisma.aiUsageEvent.create = async ({ data }) => data
  let calls = 0
  globalThis.fetch = async (_url, options) => {
    calls++
    const body = JSON.parse(options.body)
    const submitted = JSON.parse(body.contents[0].parts[0].text)
    const output = calls === 1 ? { ...speaking, improvedAnswers: [] } : { improvedAnswers: submitted.history.map((turn, answerIndex) => ({ answerIndex, original: turn.text, improved: `Improved: ${turn.text}` })) }
    if (calls > 1) assert.ok(submitted.history.length <= 4, 'Long mocks use bounded coaching batches')
    return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(output) }] } }] })
  }
  t.after(() => { globalThis.fetch = nativeFetch; prisma.aiUsageEvent.create = originalUsage; env.GEMINI_API_KEY = '' })
  const result = await assessSpeakingAudio('repair-user', speakingAssessmentSchema.parse({ modeLabel: 'Full Mock', history, durationSec: 200, audio }))
  assert.equal(result.overallBand, 8.5)
  assert.equal(result.improvedAnswers.length, 6)
  assert.deepEqual(result.improvedAnswers.map(item => item.answerIndex), [0, 1, 2, 3, 4, 5])
  assert.equal(calls, 3)
})

test('all six recordings reach the provider; transcript scores exclude missing pronunciation', async (t) => {
  const nativeFetch = globalThis.fetch, originalUsage = prisma.aiUsageEvent.create
  env.GEMINI_API_KEY = 'fake-ielts-key'; env.GEMINI_MODELS = 'gemini-2.5-flash'
  prisma.aiUsageEvent.create = async ({ data }) => data
  let calls = 0
  globalThis.fetch = async (_url, options) => {
    const body = JSON.parse(options.body)
    const submitted = JSON.parse(body.contents[0].parts[0].text)
    assert.deepEqual(submitted.history, history)
    assert.match(body.systemInstruction.parts[0].text, /Do not anchor to a typical learner band/)
    calls++
    if (calls === 1) {
      for (const part of body.contents[0].parts.slice(1)) {
        assert.deepEqual(Object.keys(part.inlineData).sort(), ['data', 'mimeType'], 'Gemini inlineData must not contain application metadata such as answerIndex')
      }
      assert.deepEqual(body.contents[0].parts.slice(1).map(part => part.inlineData.data), audio.map(clip => clip.data))
      return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(speaking) }] } }] })
    }
    assert.equal(body.contents[0].parts.length, 1)
    return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({ ...speaking, fluencyBand: 7, lexicalBand: 8, grammarBand: 8, pronunciationBand: 1, evidence: speaking.evidence.filter(item => item.criterion !== 'pronunciation') }) }] } }] })
  }
  t.after(() => { globalThis.fetch = nativeFetch; prisma.aiUsageEvent.create = originalUsage; env.GEMINI_API_KEY = '' })
  const request = speakingAssessmentSchema.parse({ modeLabel: 'Speaking Full Mock', history, durationSec: 200, audio })
  assert.equal((await assessSpeakingAudio('ielts-user', request)).overallBand, 8.5)
  const text = await assessSpeakingTranscript('ielts-user', { modeLabel: 'Typed practice', history, durationSec: 0 })
  assert.equal(text.pronunciationBand, 0)
  assert.equal(text.overallBand, 7.5)
  assert.equal(text.assessmentMode, 'transcript')
})

test('malformed or ungrounded audio feedback is regenerated once using every original recording', async (t) => {
  const nativeFetch = globalThis.fetch, originalUsage = prisma.aiUsageEvent.create
  env.GEMINI_API_KEY = 'fake-validation-key'; env.GEMINI_MODELS = 'gemini-2.5-flash'
  prisma.aiUsageEvent.create = async ({ data }) => data
  t.after(() => { globalThis.fetch = nativeFetch; prisma.aiUsageEvent.create = originalUsage; env.GEMINI_API_KEY = '' })
  const request = speakingAssessmentSchema.parse({ modeLabel: 'Speaking Full Mock 11', history, durationSec: 200, audio })
  for (const incomplete of ['{"fluencyBand":8', JSON.stringify({ ...speaking, evidence: speaking.evidence.filter(item => item.criterion !== 'pronunciation') })]) {
    let calls = 0
    globalThis.fetch = async (_url, options) => {
      const body = JSON.parse(options.body)
      calls++
      assert.deepEqual(body.contents[0].parts.slice(1).map(part => part.inlineData), audio.map(({ data, mimeType }) => ({ data, mimeType })))
      assert.deepEqual(JSON.parse(body.contents[0].parts[0].text).history, history)
      if (calls > 1) assert.match(body.systemInstruction.parts[0].text, /previous response did not pass validation/)
      return Response.json({ candidates: [{ content: { parts: [{ text: calls === 1 ? incomplete : JSON.stringify(speaking) }] } }] })
    }
    assert.equal((await assessSpeakingAudio('recovery-user', request)).overallBand, 8.5)
    assert.equal(calls, 2)
  }
})

test('repeated invalid feedback remains unassessed and regeneration respects cancellation', async (t) => {
  const nativeFetch = globalThis.fetch, originalUsage = prisma.aiUsageEvent.create
  env.GEMINI_API_KEY = 'fake-invalid-key'; env.GEMINI_MODELS = 'gemini-2.5-flash'
  prisma.aiUsageEvent.create = async ({ data }) => data
  t.after(() => { globalThis.fetch = nativeFetch; prisma.aiUsageEvent.create = originalUsage; env.GEMINI_API_KEY = '' })
  let calls = 0
  const controller = new AbortController()
  globalThis.fetch = async () => {
    calls++
    if (calls === 3) controller.abort()
    return Response.json({ candidates: [{ content: { parts: [{ text: '{}' }] } }] })
  }
  const request = speakingAssessmentSchema.parse({ modeLabel: 'Full Mock', history, durationSec: 200, audio })
  await assert.rejects(assessSpeakingAudio('invalid-user', request), { code: 'SPEAKING_RESULT_INCOMPLETE' })
  assert.equal(calls, 2, 'Invalid evidence cannot cause an unbounded regeneration loop')
  await assert.rejects(assessSpeakingAudio('cancel-user', request, controller.signal))
  assert.equal(calls, 3, 'Cancelled evaluation does not regenerate')
})
