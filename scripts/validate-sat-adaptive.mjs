import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { build } from 'esbuild'

const bundled = await build({ entryPoints: ['src/features/sat/catalog.ts', 'src/features/sat/practiceTest4.ts', 'src/features/sat/sectionBreak.ts'], bundle: true, platform: 'node', format: 'esm', write: false, outdir: 'unused' })
const load = index => import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[index].text).toString('base64')}`)
const catalog = await load(0), scoring = await load(1), timing = await load(2)
const { SAT_TEST_CATALOG, LEGACY_SAT_TEST_CATALOG, getSATReviewTests, getSATSectionTest, resolveSATTest } = catalog
const { createSATAttempt, scoreSATModules } = scoring
const bank = JSON.parse(readFileSync('src/data/sat/questionBankMocks.json', 'utf8'))
const source = new Map([...bank.tests.flatMap(test => test.questions), ...bank.test9Math2].map(q => [q.sourceQuestionId, q]))
// Preserve the existing reviewed correction to a decimal example in the source.
const corrected = source.get('c6e85cd7')
source.set('c6e85cd7', { ...corrected, sourceContent: { ...corrected.sourceContent,
  explanation: corrected.sourceContent.explanation.replace(/0\.219/g, '0.291'),
} })
const labels = ['Foundation', 'Medium', 'Advanced']
const counts = (questions, key) => Object.fromEntries([...new Set(questions.map(q => q[key]))].sort().map(value => [value, questions.filter(q => q[key] === value).length]))
const signatures = new Map()
const routeAnswers = (module, count) => Object.fromEntries(module.questions.slice(0, count).map(q => [q.id, q.correctAnswer]))
assert.equal(Object.keys(SAT_TEST_CATALOG).length, 40)
for (const test of Object.values(SAT_TEST_CATALOG)) {
  assert.equal(test.questionCount, 98)
  assert.equal(test.totalDurationSeconds, 134 * 60)
  assert.equal(test.difficulty, 'Medium')
  assert.match(test.id, /^adaptive-2026-11-02-v1-\d+$/)
  assert.deepEqual(test.modules.map(m => m.id), ['rw1', 'rw2', 'math1', 'math2'])
  const used = new Set()
  for (const module of test.modules) {
    const branches = module.adaptive ? ['lower', 'higher'].map(route => [route, module.adaptive[route]]) : [['first', module.questions]]
    for (const [branch, questions] of branches) {
      assert.equal(questions.length, module.section === 'math' ? 22 : 27)
      assert.equal(module.durationSeconds, module.section === 'math' ? 35 * 60 : 32 * 60)
      assert.deepEqual(questions.map(q => q.id), questions.map((_, i) => `${module.id}-${i + 1}`))
      for (const q of questions) {
        assert.ok(!used.has(q.sourceQuestionId), `${test.id}: no repeated question, even across alternatives`)
        used.add(q.sourceQuestionId)
        const original = source.get(q.sourceQuestionId)
        for (const field of ['prompt', 'sourceContent', 'choices', 'correctAnswer', 'acceptedAnswers', 'difficulty', 'domain', 'skill']) assert.deepEqual(q[field], original[field], `${q.sourceQuestionId}: preserve original ${field}`)
      }
      const signature = JSON.stringify([counts(questions, 'difficulty'), counts(questions, 'domain'), counts(questions, 'kind'),
        module.section === 'reading-writing' ? counts(questions, 'skill') : null])
      const key = `${module.id}:${branch}`
      if (!signatures.has(key)) signatures.set(key, signature)
      assert.equal(signature, signatures.get(key), `${test.id}: identical blueprint for ${key}`)
      if (module.section === 'math') {
        assert.equal(questions.filter(q => q.kind === 'student-response').length, 5)
        for (let i = 1; i < questions.length; i++) assert.ok(labels.indexOf(questions[i - 1].difficulty) <= labels.indexOf(questions[i].difficulty))
      }
    }
  }
  assert.equal(used.size, 147)
  for (const [rwCorrect, mathCorrect] of [[0,0],[17,14],[18,13],[27,22]]) {
    let attempt = createSATAttempt(test.id, test.modules, 'exam')
    attempt.answers = { ...routeAnswers(test.modules[0], rwCorrect), ...routeAnswers(test.modules[2], mathCorrect) }
    attempt = timing.advanceSATModule(attempt, test.modules, attempt.startedAt + 1)
    assert.equal(attempt.adaptiveRoutes.rw2, rwCorrect >= 18 ? 'higher' : 'lower')
    attempt = timing.advanceSATModule({ ...attempt, currentModuleIndex: 2 }, test.modules, attempt.startedAt + 2)
    assert.equal(attempt.adaptiveRoutes.math2, mathCorrect >= 14 ? 'higher' : 'lower')
    const resolved = resolveSATTest(test, attempt)
    assert.equal(resolved.modules[1].questions, test.modules[1].adaptive[attempt.adaptiveRoutes.rw2])
    assert.equal(resolved.modules[3].questions, test.modules[3].adaptive[attempt.adaptiveRoutes.math2])
    const report = scoreSATModules(resolved.modules, attempt.answers)
    assert.equal(report.correct, rwCorrect + mathCorrect)
    assert.equal(report.correct + report.incorrect + report.unanswered, 98)
    assert.ok(report.midpoint >= 400 && report.midpoint <= 1600)
    if (attempt.adaptiveRoutes.rw2 === 'lower') assert.ok(report.readingWritingRange[1] <= 650)
    if (attempt.adaptiveRoutes.math2 === 'lower') assert.ok(report.mathRange[1] <= 650)
  }
  const perfect = Object.fromEntries(test.modules.flatMap(m => m.questions).map(q => [q.id, q.correctAnswer]))
  assert.equal(scoreSATModules(test.modules, perfect).midpoint, 1600)
  assert.equal(scoreSATModules(test.modules, {}).midpoint, 400)
  for (const section of ['math', 'reading-writing']) {
    const paper = getSATSectionTest(test.mockId, section)
    assert.equal(paper.modules.length, 2)
    const attempt = timing.advanceSATModule(createSATAttempt(paper.id, paper.modules, 'practice'), paper.modules)
    assert.equal(attempt.adaptiveRoutes[paper.modules[1].id], 'lower')
    assert.equal(attempt.sectionBreak, undefined)
  }
}
// Every previous full/section version is still addressable under its exact ID.
const reviews = getSATReviewTests()
assert.equal(new Set(reviews.map(test => test.id)).size, reviews.length)
for (const test of Object.values(LEGACY_SAT_TEST_CATALOG)) {
  assert.equal(reviews.find(saved => saved.id === test.id), test)
  assert.ok(!test.modules.some(module => module.adaptive))
  for (const section of ['math', 'reading-writing']) assert.ok(reviews.find(saved => saved.id === `${test.id}-${section}`))
}
assert.ok(reviews.find(test => test.id === 'may-2026-us-v1'))
for (let id = 10; id <= 40; id++) assert.ok(reviews.find(test => test.id === `question-bank-2026-09-20-${id}`))
console.log('Adaptive SAT: all 40 forms match exact difficulty/domain/English-skill/format blueprints; 147 distinct sources per form; independent routing at cutoffs; both modes and section practice; route-aware estimates; all historical versions preserved.')
