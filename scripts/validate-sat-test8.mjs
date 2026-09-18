import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const questions = JSON.parse(readFileSync(new URL('../src/data/sat/june2026UsQuestions.json', import.meta.url), 'utf8'))

// Independently transcribed from the user's answer-key screenshot, by question
// number. PDF page order is NOT question order for English Module 1, Q26–27.
const suppliedKeys = {
  rw1: 'A D A C A B B C B C D D D B D B B A C A D D B B A A C'.split(' '),
  rw2: 'D C A D C C D B D D C D D A B C A C D C D A D D D B C'.split(' '),
  math1: 'C A D D 62 B 6 35 A A 51 C 89 D 49 324 C B C D D B'.split(' '),
  math2: 'B B A B D D A 4.8 A D 19.6 A C C A 11 A C 1360 B D -13'.split(' '),
}

assert.equal(questions.length, 98)
assert.equal(new Set(questions.map((question) => question.id)).size, 98)
const byId = new Map(questions.map((question) => [question.id, question]))

for (const [moduleId, keys] of Object.entries(suppliedKeys)) {
  const module = questions.filter((question) => question.moduleId === moduleId)
  assert.deepEqual(module.map((question) => question.number), keys.map((_, index) => index + 1))
  assert.deepEqual(module.map((question) => question.correctAnswer), keys, `${moduleId}: answer-key mismatch`)

  for (const question of module) {
    const label = `${moduleId} Q${question.number}`
    assert.equal(question.id, `${moduleId}-${question.number}`)
    assert.ok(['Foundation', 'Medium', 'Advanced'].includes(question.difficulty), label)
    assert.ok(question.domain && question.skill && question.rationale.length > 20, label)
    assert.ok(question.prompt.length > 50 && question.prompt.includes('?'), label)
    assert.doesNotMatch(question.prompt, /Mark for Review|SCHOLARS ACADEMY|Enter your answer|�/, label)
    assert.ok(question.assetWidth > 0 && question.assetHeight > 0, label)
    assert.ok(question.sourcePages.length > 0, label)
    assert.equal(question.asset, `/sat/june-2026-us/questions/${moduleId}-${String(question.number).padStart(2, '0')}.webp`)

    if (question.kind === 'multiple-choice') {
      assert.deepEqual(question.choices.map((choice) => choice.key), ['A', 'B', 'C', 'D'], label)
      assert.equal(new Set(question.choices.map((choice) => choice.text)).size, 4, label)
      assert.ok(question.choices.every((choice) => choice.text.trim()), label)
      assert.ok(question.choices.some((choice) => choice.key === question.correctAnswer), label)
    } else {
      assert.equal(question.kind, 'student-response', label)
      assert.equal(question.choices.length, 0, label)
      assert.ok(Number.isFinite(Number(question.correctAnswer)), label)
      assert.ok(question.acceptedAnswers.includes(question.correctAnswer), label)
    }

    for (const text of [question.prompt, question.rationale, ...question.choices.map((choice) => choice.text)]) {
      assert.equal((text.match(/\$/g) ?? []).length % 2, 0, `${label}: unbalanced math delimiters`)
      assert.equal((text.match(/<u>/g) ?? []).length, (text.match(/<\/u>/g) ?? []).length, label)
    }
  }
}

// Guard the source defects repaired during import.
assert.deepEqual(byId.get('rw1-26').sourcePages, [29])
assert.match(byId.get('rw1-26').prompt, /contrast dichloromethane and tetradecafluorohexane/)
assert.deepEqual(byId.get('rw1-27').sourcePages, [28])
assert.match(byId.get('rw1-27').prompt, /explain whom the award is named for/)
assert.deepEqual(byId.get('math1-2').sourcePages, [5, 6])
assert.deepEqual(byId.get('math1-19').sourcePages, [23, 24])
assert.equal(byId.get('math1-18').choices.find((choice) => choice.key === 'B').text, 'I only')
for (const id of ['rw1-4', 'rw1-9', 'rw2-6']) assert.match(byId.get(id).prompt, /<u>.+<\/u>/s)
const visualIds = ['rw1-10', 'rw1-11', 'rw2-10', 'rw2-12', 'math1-8', 'math1-18', 'math1-19', 'math2-7', 'math2-8', 'math2-12', 'math2-16', 'math2-20']
assert.deepEqual(questions.filter((question) => question.visual).map((question) => question.id), visualIds)

// Recompute the non-graph student responses instead of trusting only the key.
const numericSolutions = {
  'math1-5': 7 * 2 ** 3 + 6,
  'math1-7': 9 - 3,
  'math1-11': 40 * 1.7 * 0.75,
  'math1-13': 89 * Math.PI / Math.PI,
  'math1-15': 42 / (6 / 7),
  'math1-16': 36 * 9,
  'math2-8': 24 / 5,
  'math2-11': 0.48 * 23.5 + 0.52 * 16,
  'math2-19': -410 + 3 * (180 + 410),
  'math2-22': Math.floor(-Math.sqrt(4 * 49)) + 1,
}
for (const [id, result] of Object.entries(numericSolutions)) {
  assert.ok(Math.abs(Number(byId.get(id).correctAnswer) - result) < 1e-9, `${id}: incorrect calculation`)
}

console.log('SAT Test 8 valid: 98 questions, all supplied keys, source ordering, restored choices, visuals, and numeric solutions.')
