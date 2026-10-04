import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { build } from 'esbuild'
import ts from 'typescript'

const bundle = await build({
  stdin: { contents: 'export {mockListeningTests} from "./src/data/listeningPassages"; export {evaluateReadingAnswers} from "./src/utils/ieltsUtils";', resolveDir: process.cwd() },
  bundle: true, write: false, platform: 'node', format: 'cjs', loader: { '.png': 'dataurl', '.jpg': 'dataurl' },
})
const module = { exports: {} }
new Function('module', 'exports', bundle.outputFiles[0].text)(module, module.exports)
const { mockListeningTests: tests, evaluateReadingAnswers: evaluate } = module.exports
const variants = value => (Array.isArray(value) ? value : value.split(/[\/;|]/)).map(value => value.trim())
const numbers = (count, start = 1) => Array.from({ length: count }, (_, i) => i + start)
const ids = new Set()
const audioHashes = new Map()
const sourceKeys = JSON.parse(readFileSync('scripts/fixtures/listening-audit-source-keys.json', 'utf8'))
const nativeDiagrams = new Map([
  ['/images/ielts-listening-test17-college-plan.svg', 'CollegePlanDiagram'],
  ['/images/ielts-listening-test18-pennyfield-plan.svg', 'PennyfieldPlanDiagram'],
  ['/images/ielts-listening-test20-rivermead-campus.svg', 'RivermeadCampusDiagram'],
  ['/images/ielts-listening-test21-brightwater-park.svg', 'BrightwaterAdventureParkDiagram'],
])

function controls(block) {
  const segments = values => values.filter(value => typeof value === 'object').map(value => value.blank)
  switch (block.kind) {
    case 'note': case 'example': return segments(block.segments)
    case 'flow': return block.boxes.flatMap(box => segments(box.segments))
    case 'table': return block.rows.flatMap(row => row.flatMap(cell => segments(cell.segments)))
    case 'grid': return block.rows.map(row => row.blank)
    case 'mcq': return [block.blank]
    case 'multi-mcq': return block.blanks
    case 'diagram': assert.equal(block.diagram, 'education-house'); return numbers(6, 21)
    default: return []
  }
}

// Read the independent user-supplied answer sheets already transcribed by the
// per-paper regression suites, rather than deriving their expected keys here.
function sourceKey(number) {
  if (sourceKeys[number === 1 ? 3 : number]) return sourceKeys[number === 1 ? 3 : number].answers
  if (number >= 23) {
    const source = JSON.parse(readFileSync('scripts/fixtures/ielts-full-mocks-23-30-integrity.json', 'utf8')).listening[number]
    return numbers(40).map(n => {
      const value = source.acceptedAnswerCorrections?.[n]?.accepted ?? source.answers[n]
      return Array.isArray(value) ? value[0] : value
    })
  }
  const path = number === 22 ? 'scripts/validate-listening-full-test22.mjs' : `scripts/tests/listening-full-test${number}.tsx`
  if (!existsSync(path)) return null
  const ast = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  let key, originalKey, retained
  const visit = node => {
    if (ts.isVariableDeclaration(node) && node.name.getText(ast) === 'key' && node.initializer && ts.isArrayLiteralExpression(node.initializer)) {
      key = node.initializer.elements.map(item => { assert.ok(ts.isStringLiteral(item)); return item.text })
    }
    if (ts.isVariableDeclaration(node) && node.initializer && ts.isArrayLiteralExpression(node.initializer)) {
      if (node.name.getText(ast) === 'originalKey') originalKey = node.initializer.elements.map(item => item.text)
      if (node.name.getText(ast) === 'retained') retained = node.initializer.elements.map(item => Number(item.text))
    }
    ts.forEachChild(node, visit)
  }
  visit(ast)
  return key ?? (originalKey && retained ? retained.map(number => originalKey[number - 1]) : null)
}

assert.equal(tests.length, 30)
for (const [index, test] of tests.entries()) {
  assert.equal(test.id, `ielts-listening-${index + 1}`)
  assert.equal(test.sections.length, 4)
  assert.equal(test.totalQuestions, 40)
  const questions = test.sections.flatMap(section => section.questions)
  assert.deepEqual(questions.map(q => q.number), numbers(40))
  const answers = Object.fromEntries(questions.map(q => [q.id, variants(q.correctAnswer)[0]]))
  for (const [part, section] of test.sections.entries()) {
    assert.equal(section.partLabel, `Part ${part + 1}`)
    assert.equal(section.questions.length, 10)
    const visible = section.groups.flatMap(group => group.blocks.flatMap(controls))
    assert.deepEqual(visible.sort((a, b) => a - b), numbers(10, part * 10 + 1), `${test.id}: exactly one control per question`)
    for (const group of section.groups) {
      const range = group.range.match(/\d+/g).map(Number)
      assert.deepEqual(group.blocks.flatMap(controls).sort((a, b) => a - b), numbers(range.at(-1) - range[0] + 1, range[0]), `${test.id}: group range ${group.range}`)
      for (const block of group.blocks) {
        if (block.kind === 'image' && block.src.startsWith('/')) {
          const native = nativeDiagrams.get(block.src)
          assert.ok(existsSync(native ? `src/components/${native}.tsx` : `public${block.src}`), `${test.id}: ${block.src}`)
        }
        if (block.kind === 'mcq') {
          const q = section.questions.find(q => q.number === block.blank)
          assert.deepEqual(q.options, block.options, `${test.id} Q${q.number}: choice order`)
          assert.ok(variants(q.correctAnswer).every(letter => /^[A-Z]$/.test(letter) && letter.charCodeAt(0) - 65 < block.options.length))
        }
        if (block.kind === 'grid') {
          if (block.options) assert.deepEqual(block.columns, block.options.map(option => option.letter))
          for (const row of block.rows) {
            const q = section.questions.find(q => q.number === row.blank)
            assert.equal(q.type, 'matching-information', `${test.id} Q${q.number}: matching task type`)
            assert.ok(variants(q.correctAnswer).every(letter => block.columns.includes(letter)), `${test.id} Q${q.number}: matching letter`)
          }
        }
        if (block.kind === 'multi-mcq') {
          assert.equal(block.selectionLimit, block.blanks.length)
          const pool = [...new Set(block.blanks.flatMap(n => variants(questions[n - 1].correctAnswer)))]
          assert.equal(pool.length, block.selectionLimit)
          block.blanks.forEach((n, i) => { answers[questions[n - 1].id] = pool[i] })
        }
      }
    }
  }
  for (const q of questions) {
    assert.ok(!ids.has(q.id), `Duplicate ID ${q.id}`); ids.add(q.id)
    assert.ok(q.text.trim() && variants(q.correctAnswer).every(Boolean))
  }
  assert.equal(evaluate(test.sections, answers).summary.correctAnswers, 40, `${test.id}: all answers score`)
  assert.equal(evaluate(test.sections, {}).summary.skippedAnswers, 40)
  for (const q of questions.filter(q => /completion|short-answer/.test(q.type))) {
    for (const variant of variants(q.correctAnswer)) {
      assert.equal(evaluate(test.sections, { ...answers, [q.id]: variant.toUpperCase() }).summary.correctAnswers, 40, `${test.id} Q${q.number}: ${variant}`)
    }
    assert.equal(evaluate(test.sections, { ...answers, [q.id]: `${answers[q.id]} incorrect` }).summary.correctAnswers, 39, `${test.id} Q${q.number}: reject extra words`)
  }
  for (const section of test.sections) {
    assert.equal(evaluate([section], answers).sectionSummaries[0].partNumber, Number(section.partLabel.slice(-1)), 'Partial review keeps original part number')
    for (const block of section.groups.flatMap(group => group.blocks).filter(block => block.kind === 'multi-mcq')) {
      const pairIds = block.blanks.map(n => questions[n - 1].id)
      const reversed = Object.fromEntries(pairIds.map((id, i) => [id, answers[pairIds.at(-i - 1)]]))
      assert.equal(evaluate(test.sections, { ...answers, ...reversed }).summary.correctAnswers, 40)
      const duplicates = Object.fromEntries(pairIds.map(id => [id, answers[pairIds[0]]]))
      assert.equal(evaluate(test.sections, { ...answers, ...duplicates }).summary.correctAnswers, 41 - pairIds.length)
    }
  }
  const key = sourceKey(index + 1)
  assert.ok(key, `${test.id}: independent source key is required`)
  if (key) {
    assert.equal(key.length, 40)
    assert.equal(evaluate(test.sections, Object.fromEntries(questions.map((q, i) => [q.id, key[i]]))).summary.correctAnswers, 40, `${test.id}: independent source key`)
  }
  const oldWrongAnswers = {
    1: [[5, '103'], [4, 'swimming']],
    3: [[5, '103'], [4, 'swimming']],
    7: [[23, 'A']],
    8: [[38, 'salty']],
    10: [[13, 'A'], [20, 'B']],
  }
  for (const [number, wrong] of oldWrongAnswers[index + 1] ?? []) {
    assert.equal(evaluate(test.sections, { ...answers, [questions[number - 1].id]: wrong }).summary.correctAnswers, 39, `${test.id} Q${number}: reject former incorrect key`)
  }
  const audio = test.continuousAudioUrl ? [test.continuousAudioUrl] : test.sections.map(section => section.audioUrl)
  const hashes = audio.map(path => {
    assert.ok(path?.startsWith('/audio/ielts-listening/'))
    const bytes = readFileSync(`public${path}`)
    assert.ok(bytes.length > 100000)
    const hash = createHash('sha256').update(bytes).digest('hex')
    audioHashes.set(path, hash)
    return hash
  })
  assert.equal(new Set(hashes).size, hashes.length, `${test.id}: playlist must not repeat the full recording`)
  assert.ok(!/\uFFFD|Ã.|â€|Â£/.test(JSON.stringify(test)), `${test.id}: corrupt text encoding`)
  console.log(`PASS ${test.id}: 40 questions/controls, all variants, grading, partial review, audio${key ? ', independent source key' : ''}`)
}
assert.equal(ids.size, 1200)
assert.equal(audioHashes.get('/audio/ielts-listening/listening-full-test-7.mp3'), 'ccce06dcb6c656465cc6aad980f22a9b037e8c29045400207f5260bf4ab4b5dc', 'Test 7: repaired MP3 metadata')
assert.equal(audioHashes.get('/audio/ielts-listening/listening-full-test-10.mp3'), '8b0a971a59282b2cfce79be3dc1365fc3807d744f140a8047bc207a28b1ea5d3', 'Test 10: repaired MP3 metadata')
console.log(`PASS: 1,200 unique question IDs; ${audioHashes.size} distinct audio paths. Tests 1 and 3 retain their pre-existing shared paper.`)
