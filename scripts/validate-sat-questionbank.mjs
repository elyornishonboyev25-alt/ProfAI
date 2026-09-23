import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { build } from 'esbuild'

const read = (name) => JSON.parse(readFileSync(`src/data/sat/${name}.json`, 'utf8'))
const data = read('questionBankMocks'), inventory = read('questionBankInventory')
const skills = ['Words in Context', 'Text Structure and Purpose', 'Cross-Text Connections', 'Central Ideas and Details', 'Command of Evidence', 'Inferences', 'Boundaries', 'Form, Structure, and Sense', 'Transitions', 'Rhetorical Synthesis']
const levels = ['Foundation', 'Medium', 'Advanced']
const all = [...data.test9Math2, ...data.tests.flatMap((test) => test.questions)]
assert.equal(inventory.length, 3770)
assert.equal(inventory.filter((r) => r.section === 'rw').length, 1845)
assert.equal(new Set(inventory.map((r) => r.sourceId)).size, inventory.length)
const statusCounts = Object.fromEntries(['assigned', 'reserve', 'existing-duplicate', 'source-duplicate'].map((status) => [status, inventory.filter((r) => r.status === status).length]))
assert.deepEqual(statusCounts, { assigned: 3060, reserve: 532, 'existing-duplicate': 175, 'source-duplicate': 3 })
assert.equal(new Set(all.map((q) => q.sourceQuestionId)).size, 3060, 'Never reuse a question across mocks or Test 9')
const assigned = new Map(inventory.filter((r) => r.status === 'assigned').map((r) => [r.sourceId, r]))
const hashes = new Set(), assets = new Set()
for (const q of all) {
  const label = q.sourceQuestionId
  assert.equal(assigned.get(label)?.moduleId, q.moduleId, label)
  assert.equal(assigned.get(label)?.number, q.number, label)
  assert.ok(q.domain && q.skill && levels.includes(q.difficulty), label)
  assert.ok(q.sourceContent.task.trim() && q.sourceContent.explanation.trim(), label)
  if (q.kind === 'multiple-choice') {
    assert.deepEqual(q.choices.map((c) => c.key), ['A', 'B', 'C', 'D'], label)
    assert.match(q.correctAnswer, /^[ABCD]$/, label)
    assert.ok(q.choices.every((c) => c.html.trim()), label)
  } else {
    assert.equal(q.section, 'math', label)
    assert.equal(q.choices.length, 0, label)
    assert.ok(q.acceptedAnswers.includes(q.correctAnswer), label)
  }
  const questionHTML = [q.sourceContent.context, q.sourceContent.task, ...q.choices.map((c) => c.html)].join('\n')
  const hash = createHash('sha256').update(questionHTML.replace(/\s+/g, ' ')).digest('hex')
  assert.ok(!hashes.has(hash), `Repeated full question content: ${label}`)
  hashes.add(hash)
  const html = questionHTML + q.sourceContent.explanation
  assert.doesNotMatch(html, /<(?:script|iframe|form|input|button|mfenced)\b|\bon\w+\s*=|(?:src|href)=["'](?:https?:|javascript:|data:)/i, label)
  for (const match of html.matchAll(/src="([^"]+)"/g)) {
    assert.match(match[1], /^\/sat\/question-bank\/[a-f0-9]{24}\.(png|svg)$/)
    assert.ok(existsSync(`public${match[1]}`), `${label}: missing ${match[1]}`)
    assets.add(match[1])
  }
}
assert.equal(data.tests.length, 31)
assert.deepEqual(data.tests.map((t) => t.mockId), Array.from({ length: 31 }, (_, i) => i + 10))
for (const test of data.tests) {
  assert.equal(test.questions.length, 98)
  for (const id of ['rw1', 'rw2', 'math1', 'math2']) {
    const qs = test.questions.filter((q) => q.moduleId === id), math = id.startsWith('math')
    assert.equal(qs.length, math ? 22 : 27)
    assert.deepEqual(qs.map((q) => q.id), qs.map((_, i) => `${id}-${i + 1}`))
    assert.ok(qs.every((q) => assigned.get(q.sourceQuestionId).mockId === test.mockId))
    for (const level of levels) assert.ok(qs.filter((q) => q.difficulty === level).length >= (math ? 6 : 7))
    if (math) {
      assert.equal(qs.filter((q) => q.kind === 'student-response').length, 5)
      assert.equal(new Set(qs.map((q) => q.domain)).size, 4)
    } else {
      const reading = qs.filter((q) => skills.indexOf(q.skill) < 6).length
      assert.ok(reading === 14 || reading === 15)
      assert.ok(new Set(qs.map((q) => q.skill)).size >= 9)
    }
    for (let i = 1; i < qs.length; i++) {
      const a = qs[i - 1], b = qs[i]
      if (!math) assert.ok(skills.indexOf(a.skill) <= skills.indexOf(b.skill))
      if (math || a.skill === b.skill) assert.ok(levels.indexOf(a.difficulty) <= levels.indexOf(b.difficulty))
    }
  }
}
const corrected = all.find((q) => q.sourceQuestionId === 'e3bbf2bf')
assert.ok(corrected)
assert.match(corrected.choices[3].text, /The Choctaw Code Talkers, not the Navajo Code Talkers, served in World War I/)
assert.doesNotMatch(corrected.choices[2].html, /The Choctaw Code Talkers, not the Navajo/)
// This legacy question stores its given equation separately from its stem.
const legacySalary = all.find((q) => q.sourceQuestionId === 'e53add44')
assert.match(legacySalary.sourceContent.context, /38,000 times a, to the n power/)
assert.match(legacySalary.sourceContent.context, /<img /)
assert.equal(legacySalary.correctAnswer, 'C')

const bundled = await build({ entryPoints: ['src/features/sat/catalog.ts', 'src/features/sat/practiceTest4.ts'], bundle: true, platform: 'node', format: 'esm', write: false, outdir: 'unused' })
const load = (index) => import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[index].text).toString('base64')}`)
const catalog = await load(0), scoring = await load(1)
for (let id = 9; id <= 40; id++) {
  const test = catalog.getSATTest(id)
  assert.equal(test.questionCount, 98)
  assert.equal(test.totalDurationSeconds, 134 * 60)
  assert.equal(catalog.isSATTestComplete(test), true)
  const answers = Object.fromEntries(test.modules.flatMap((m) => m.questions).map((q) => [q.id, q.correctAnswer]))
  assert.equal(scoring.scoreSATModules(test.modules, answers).correct, 98)
  assert.equal(scoring.scoreSATModules(test.modules, {}).unanswered, 98)
  for (const q of test.modules.flatMap((m) => m.questions)) {
    for (const answer of q.acceptedAnswers ?? [q.correctAnswer]) assert.ok(scoring.isSATAnswerCorrect(q, answer), q.sourceQuestionId)
    assert.equal(scoring.isSATAnswerCorrect(q, ''), false)
  }
  assert.equal(catalog.getSATSectionTest(id, 'math').questionCount, 44)
  assert.equal(catalog.getSATSectionTest(id, 'reading-writing').questionCount, 54)
}
console.log(`Question Bank valid: 31 new mocks + Test 9 Math 2, ${all.length} unique assigned questions, ${assets.size} assets, source accounting, SAT order, difficulty mix, accepted answers and scoring.`)
