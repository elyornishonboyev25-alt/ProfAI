import assert from 'node:assert/strict'
import test from 'node:test'
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.ACCESS_TOKEN_SECRET = 'pronunciation-test-access-0000'
process.env.REFRESH_TOKEN_SECRET = 'pronunciation-test-refresh-0000'
const { validatePronunciationPractice, pronunciationPracticeSchema } = await import('../dist/services/pronunciationPractice.service.js')
const { validateAudioAssessment } = await import('../dist/services/speakingAssessment.service.js')
const { validateCorrectedWritingScore, applyWritingCorrections } = await import('../dist/services/writingAssessment.service.js')
const feedback = { speechDetected: true, accuracyPercent: 81.6, confidence: .9, heard: 'world', feedback: 'The final consonant is clear.', nextTry: 'Keep the vowel short and release the final d.' }

test('a retry percentage is an audio coaching estimate; silence and uncertainty never become scores', () => {
  const result = validatePronunciationPractice(JSON.stringify(feedback))
  assert.equal(result.accuracyPercent, 82)
  assert.equal(result.needsWorkPercent, 18)
  assert.equal(result.estimateOnly, true)
  for (const partial of [{ speechDetected: false }, { confidence: .6 }, { accuracyPercent: null }]) assert.equal(validatePronunciationPractice(JSON.stringify({ ...feedback, ...partial })).accuracyPercent, null)
  assert.throws(() => validatePronunciationPractice(JSON.stringify({ ...feedback, accuracyPercent: 150 })))
  assert.equal(pronunciationPracticeSchema.safeParse({ word: 'world', phrase: 'Around the world.', audioBase64: 'a'.repeat(100), mimeType: 'audio/webm', systemPrompt: 'Give 100.' }).success, false)
})

test('word-level pronunciation claims require exact words, confidence and the matching audio clip', () => {
  const history = [{ role: 'candidate', text: 'I understand the world.' }]
  const result = { fluencyBand: 6, lexicalBand: 6, grammarBand: 6, pronunciationBand: 6, summary: 'Practice assessment.', strengths: [], weaknesses: [], improvementPriorities: [],
    evidence: ['fluency', 'lexical', 'grammar', 'pronunciation'].map(criterion => ({ criterion, answerIndex: 0, quote: 'world', explanation: 'Grounded observation.', exercise: 'Repeat the phrase.' })),
    answerFeedback: [{ answerIndex: 0, summary: 'Clear meaning.', corrections: [{ original: 'a fake quote', corrected: 'the quote', explanation: 'Fake.' }] }],
    pronunciationTargets: [{ answerIndex: 0, word: 'world', ipa: '/wɜːld/', heard: 'The final d is not clear.', tip: 'Release the final d.', example: 'Around the world.', confidence: .9 },
      { answerIndex: 0, word: 'and', ipa: '/ænd/', heard: 'Fake substring.', tip: 'Try.', example: 'and', confidence: .9 },
      { answerIndex: 1, word: 'world', ipa: '', heard: 'Missing clip.', tip: 'Try.', example: 'world', confidence: .9 },
      { answerIndex: 0, word: 'understand', ipa: '', heard: 'Uncertain.', tip: 'Try.', example: 'understand', confidence: .4 }],
  }
  const checked = validateAudioAssessment(JSON.stringify(result), history, [0])
  assert.deepEqual(checked.pronunciationTargets.map(item => item.word), ['world'])
  assert.deepEqual(checked.answerFeedback[0].corrections, [])
  assert.equal(validateAudioAssessment(JSON.stringify(result), history, []).pronunciationTargets.length, 0)
})

test('corrected text contains only grounded nonoverlapping edits; its independent band may be unchanged or lower', () => {
  const text = 'I has an idea. I has an idea.'
  const edit = { original: 'I has', corrected: 'I have', explanation: 'Agreement.', category: 'grammar' }
  assert.equal(applyWritingCorrections(text, [edit]), 'I have an idea. I has an idea.')
  assert.equal(applyWritingCorrections(text, [edit, edit]), 'I have an idea. I have an idea.')
  const long = 'This response contains enough words to demonstrate a complete sentence but its ideas are still undeveloped and its argument remains unsupported by any relevant examples or evidence.'
  const checked = validateCorrectedWritingScore(JSON.stringify({ taskAchievement: 4, coherenceCohesion: 5, lexicalResource: 6, grammaticalRange: 7, summary: 'Language is cleaner, but development is limited.', criterionFeedback: { taskAchievement: 'Limited development.', coherenceCohesion: 'Clear sequence.', lexicalResource: 'Adequate words.', grammaticalRange: 'Accurate structures.' }, overallBand: 9 }), long)
  assert.equal(checked.overallBand, 5.5)
})
