import assert from 'node:assert/strict'
import { build } from 'esbuild'

const bundled = await build({
  entryPoints: ['src/features/sat/catalog.ts', 'src/features/sat/practiceTest4.ts'],
  bundle: true, platform: 'node', format: 'esm', write: false, outdir: 'unused',
})
const load = index => import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[index].text).toString('base64')}`)
const catalog = await load(0)
const { isSATAnswerCorrect, scoreSATModules } = await load(1)
const numeric = answer => {
  const [numerator, denominator = '1'] = answer.replace(/[−–—]/g, '-').replace(/,/g, '').split('/')
  return Number(numerator) / Number(denominator)
}
let mathCount = 0, responseCount = 0, exampleCount = 0
for (const test of catalog.getSATReviewTests()) {
  for (const module of test.modules.filter(module => module.section === 'math')) {
    const answers = {}
    for (const question of module.questions) {
      const label = `${test.id}:${question.id}`
      mathCount++
      answers[question.id] = question.correctAnswer
      assert.ok(isSATAnswerCorrect(question, question.correctAnswer), `${label}: canonical key`)
      assert.equal(isSATAnswerCorrect(question, ''), false, label)
      if (question.kind !== 'student-response') continue
      responseCount++
      for (const answer of [question.correctAnswer, ...(question.acceptedAnswers ?? [])]) {
        const value = numeric(answer)
        assert.ok(Number.isFinite(value), `${label}: invalid key ${answer}`)
        assert.ok(isSATAnswerCorrect(question, answer), `${label}: ${answer}`)
        assert.ok(isSATAnswerCorrect(question, value.toFixed(12)), `${label}: decimal equivalent of ${answer}`)
        const parts = answer.split('/')
        const equivalent = parts.length === 2
          ? `${Number(parts[0]) * 2}/${Number(parts[1]) * 2}`
          : `${value * 1000000}/1000000`
        assert.ok(isSATAnswerCorrect(question, equivalent), `${label}: ${equivalent}`)
      }
      for (const invalid of ['NaN', 'Infinity', '1/0', '0/0', '1/2/3', '1.2.3', 'answer', '1+2']) {
        assert.equal(isSATAnswerCorrect(question, invalid), false, `${label}: ${invalid}`)
      }
      // Check plain numeric examples in explanations, avoiding unrelated MathML.
      const explanations = [question.explanation, question.sourceContent?.explanation ?? '']
      for (const text of explanations) {
        for (const match of text.matchAll(/Note that ([^<>]*?) (?:are examples|is an example) of ways to enter a correct answer/g)) {
          if (!/^[\d\s.,/+−–—-]+(?:(?:and|or)[\d\s.,/+−–—-]+)?$/.test(match[1])) continue
          const examples = match[1].replace(/[−–—]/g, '-').match(/-?(?:\d+\.?\d*|\.\d+)(?:\/\d+)?/g) ?? []
          for (const example of examples) {
            exampleCount++
            assert.ok(isSATAnswerCorrect(question, example), `${label}: explanation example ${example}`)
          }
        }
      }
    }
    assert.equal(scoreSATModules([module], answers).correct, module.questions.length, test.id)
  }
}
const question = catalog.getSATTest(2).modules.find(module => module.id === 'math1').questions.find(question => question.id === 'math1-22')
assert.equal(question.correctAnswer, '18/17')
for (const response of ['18/17', '36/34', ' 18 / 17 ', '+18/17', '-18/-17', '1.058', '1.059', '1.058823529412']) {
  assert.ok(isSATAnswerCorrect(question, response), `Screenshot regression: ${response}`)
}
for (const response of ['17/18', '18/16', '1.057', '1.060', '1.05', '1']) {
  assert.equal(isSATAnswerCorrect(question, response), false, `Wrong answer: ${response}`)
}
// Canonical answers still work when an optional acceptedAnswers list is missing or empty.
for (const acceptedAnswers of [undefined, []]) {
  assert.ok(isSATAnswerCorrect({ ...question, acceptedAnswers }, '36/34'))
}
const fractionQuestion = { ...question, correctAnswer: '5/13', acceptedAnswers: [], tolerance: 0 }
for (const response of ['.384', '.385', '.3846', '.384615384615', '10/26']) assert.ok(isSATAnswerCorrect(fractionQuestion, response), response)
for (const response of ['.38', '.383', '.386', '384/1000', '385/1000']) assert.equal(isSATAnswerCorrect(fractionQuestion, response), false, response)
const negative = { ...fractionQuestion, correctAnswer: '-49/150' }
for (const response of ['-.326', '-.327', '−49/150', '-98/300']) assert.ok(isSATAnswerCorrect(negative, response), response)
assert.equal(isSATAnswerCorrect(negative, '.327'), false)
const integer = { ...fractionQuestion, correctAnswer: '14100' }
for (const response of ['14100', '14,100', '+14,100', '28200/2']) assert.ok(isSATAnswerCorrect(integer, response), response)
for (const response of ['14,10', '14,1000', '14.100']) assert.equal(isSATAnswerCorrect(integer, response), false, response)
const zero = { ...fractionQuestion, correctAnswer: '0' }
assert.equal(isSATAnswerCorrect(zero, `1/${'9'.repeat(400)}`), false)
assert.equal(isSATAnswerCorrect(zero, `${'9'.repeat(400)}/1`), false)
const corrected = catalog.getSATTest(11).modules.flatMap(module => module.questions).find(question => question.sourceQuestionId === 'c6e85cd7')
assert.doesNotMatch(corrected.explanation + corrected.sourceContent.explanation, /0\.219/)
assert.equal(isSATAnswerCorrect(corrected, '0.219'), false)
console.log(`SAT math answers valid: ${mathCount} current/section/historical question checks, ${responseCount} student-response checks, ${exampleCount} explanation examples; equivalent fractions, decimal precision, scoring and screenshot regression.`)
