import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { build } from 'esbuild'

const questions = JSON.parse(readFileSync(new URL('../src/data/sat/may2026UsQuestions.json', import.meta.url), 'utf8'))
// Transcribed independently from the three supplied answer-key photographs.
const suppliedKeys = {
  rw1: 'C A D C A A A C D A D A D D C A A A C B A C B C A B A'.split(' '),
  rw2: 'D C D C D A B B A B C C C C A A D D B C D B B A A A A'.split(' '),
  math1: 'B D D B 174 A B D B A C B 28500 C C D C A C B B 20'.split(' '),
}
assert.equal(questions.length, 76)
assert.equal(new Set(questions.map((q) => q.id)).size, 76)
for (const [moduleId, keys] of Object.entries(suppliedKeys)) {
  const module = questions.filter((q) => q.moduleId === moduleId)
  assert.deepEqual(module.map((q) => q.number), keys.map((_, index) => index + 1))
  assert.deepEqual(module.map((q) => q.correctAnswer), keys)
  for (const q of module) {
    assert.equal(q.id, `${moduleId}-${q.number}`)
    assert.ok(q.prompt.trim().endsWith('?'), `${q.id}: missing question`)
    assert.doesNotMatch(q.prompt, /Mark for Review|SCHOLARS ACADEMY|Enter your answer|�/)
    assert.ok(q.rationale.length > 40 && q.domain && q.skill)
    assert.ok(q.assetWidth > 0 && q.assetHeight > 0)
    assert.equal(q.asset, `/sat/may-2026-us/questions/${moduleId}-${String(q.number).padStart(2, '0')}.webp`)
    if (q.kind === 'multiple-choice') {
      assert.deepEqual(q.choices.map((c) => c.key), ['A', 'B', 'C', 'D'])
      assert.equal(new Set(q.choices.map((c) => c.text)).size, 4)
      assert.ok(q.choices.some((c) => c.key === q.correctAnswer))
    } else {
      assert.equal(q.kind, 'student-response')
      assert.equal(q.choices.length, 0)
      assert.ok(q.acceptedAnswers.includes(q.correctAnswer))
    }
    for (const text of [q.prompt, q.rationale, ...q.choices.map((c) => c.text)]) {
      assert.equal((text.match(/\$/g) ?? []).length % 2, 0, `${q.id}: math delimiters`)
      assert.equal((text.match(/<u>/g) ?? []).length, (text.match(/<\/u>/g) ?? []).length)
    }
    if (/completes the text/.test(q.prompt)) assert.match(q.prompt, /_____/, q.id)
    if (/underlined/.test(q.prompt)) assert.match(q.prompt, /<u>.+<\/u>/s, q.id)
  }
}
const byId = new Map(questions.map((q) => [q.id, q]))
assert.match(byId.get('math1-10').sourceImage, /21\.01\.47/)
assert.match(byId.get('math1-10').prompt, /Adriana/)
assert.match(byId.get('math1-10').visual.alt, /0\.18 and 9/)
assert.equal(9 / 0.18, 50)
assert.equal(Number(byId.get('math1-5').correctAnswer), 3 * 145 * 2 / 5)
assert.equal(Number(byId.get('math1-13').correctAnswer), 7500 * 3.8)
assert.equal(Number(byId.get('math1-22').correctAnswer), 4 * Math.sqrt(3 * 125 / 15))
// The original +12 in Q7 B fails the supplied point. The reviewed B is exact.
assert.match(byId.get('math1-7').choices[1].text, /\\frac\{59\}\{5\}/)
assert.ok(Math.abs(-6 / 5 * 4 + 59 / 5 - 7) < 1e-12)
assert.match(byId.get('math1-7').rationale, /Source correction/)
assert.deepEqual(questions.filter((q) => q.visual).map((q) => q.id), ['rw1-11', 'rw1-13', 'rw2-8', 'rw2-9', 'rw2-10', 'rw2-11', 'math1-7', 'math1-10', 'math1-11', 'math1-14'])
assert.match(byId.get('rw1-12').choices[3].text, /usefulness of irrigation/)
assert.match(byId.get('rw1-15').choices[3].text, /Both direct guidance/)
assert.match(byId.get('rw2-13').choices[3].text, /Professor Serebrakoff says to Helena/)
assert.match(byId.get('rw2-2').prompt, /artistic style has been _____ by her time/)

async function load(entry) {
  const result = await build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'esm', write: false })
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`)
}
const { getSATTest, getSATSectionTest, isSATTestComplete, satAvailabilityNote, getSATReviewTests } = await load('src/features/sat/catalog.ts')
const { createSATAttempt, scoreSATModules, isSATAnswerCorrect } = await load('src/features/sat/practiceTest4.ts')
const test = getSATTest(9)
assert.equal(test.mockId, 9)
assert.equal(test.difficulty, 'Easy')
assert.equal(test.questionCount, 98)
assert.equal(test.totalDurationSeconds, 134 * 60)
assert.deepEqual(test.modules.map((m) => m.id), ['rw1', 'rw2', 'math1', 'math2'])
assert.equal(isSATTestComplete(test), true)
assert.equal(satAvailabilityNote(test), null)
const rw = getSATSectionTest(9, 'reading-writing')
assert.equal(rw.questionCount, 54)
assert.equal(rw.totalDurationSeconds, 64 * 60)
assert.equal(isSATTestComplete(rw), true)
assert.equal(satAvailabilityNote(rw), null)
const math = getSATSectionTest(9, 'math')
assert.equal(math.questionCount, 44)
assert.equal(math.totalDurationSeconds, 70 * 60)
assert.equal(isSATTestComplete(math), true)
assert.equal(isSATTestComplete(getSATTest(8)), true)
const attempt = createSATAttempt(test.id, test.modules, 'exam')
assert.equal(attempt.moduleDeadlines.__test__ - attempt.startedAt, 134 * 60 * 1000)
const answers = Object.fromEntries(test.modules.flatMap((m) => m.questions).map((q) => [q.id, q.correctAnswer]))
assert.equal(scoreSATModules(test.modules, answers).correct, 98)
assert.equal(scoreSATModules(test.modules, {}).unanswered, 98)
assert.equal(scoreSATModules(rw.modules, answers).readingWritingRaw, 54)
assert.ok(isSATAnswerCorrect(math.modules[0].questions[4], '174.0'))
assert.ok(!isSATAnswerCorrect(math.modules[0].questions[4], '175'))
const legacy = getSATReviewTests().find((entry) => entry.id === 'may-2026-us-v1')
assert.ok(legacy)
assert.equal(legacy.questionCount, 76)
assert.equal(legacy.totalDurationSeconds, 99 * 60)
assert.equal(isSATTestComplete(legacy), false)
assert.equal(scoreSATModules(legacy.modules, answers).correct, 76)
assert.equal(test.id, 'may-2026-us-v2')
console.log('SAT Test 9 valid: 76 original answers preserved, 22 supplemental Math 2 questions, full timing/scoring, and legacy 76-question review.')
