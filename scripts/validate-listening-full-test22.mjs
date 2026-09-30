import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

function loadData(file) {
  const source = readFileSync(file, 'utf8')
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText
  const module = { exports: {} }
  vm.runInNewContext(code, { module, exports: module.exports }, { filename: file })
  return module.exports
}

const { listeningFullTest22: test } = loadData('src/data/listeningFullTest22.ts')
const { evaluateReadingAnswers } = loadData('src/utils/ieltsUtils.ts')
const key = [
  'piano', 'coffee', 'mirror', 'glass', 'Harrivale', '232.50', 'insurance', 'morning', 'side', 'garage',
  'A', 'B', 'A', 'C', 'A', 'C', 'C', 'B', 'E', 'D',
  'C', 'D', 'E', 'A', 'G', 'B', 'B', 'C', 'C', 'A',
  'business management', 'phone interview', 'qualification', 'public', 'salary',
  'team', 'problem solving', 'presentation', 'essay writing', 'job',
]

assert.equal(test.sections.length, 4)
assert.deepEqual(Array.from(test.sections, part => part.questions.length), [10, 10, 10, 10])
const questions = Array.from(test.sections, part => part.questions).flat()
assert.deepEqual(Array.from(questions, question => question.number), Array.from({ length: 40 }, (_, i) => i + 1))
const answerMap = Object.fromEntries(key.map((answer, i) => [`lt22-q${i + 1}`, answer]))
assert.equal(evaluateReadingAnswers(test.sections, answerMap).summary.correctAnswers, 40)
assert.equal(evaluateReadingAnswers(test.sections, {}).summary.skippedAnswers, 40)
for (const [number, wrong] of [[6, '232.05'], [12, 'C'], [17, 'B'], [26, 'A'], [31, 'business studies']] ) {
  assert.equal(evaluateReadingAnswers(test.sections, { ...answerMap, [`lt22-q${number}`]: wrong }).summary.correctAnswers, 39)
}
assert.equal(evaluateReadingAnswers(test.sections, { ...answerMap, 'lt22-q32': 'phone interviews', 'lt22-q37': 'problem-solving' }).summary.correctAnswers, 40)

for (const section of test.sections) {
  const blanks = section.groups.flatMap(group => group.blocks.flatMap(block => {
    if (block.kind === 'note') return block.segments.filter(segment => typeof segment === 'object').map(segment => segment.blank)
    if (block.kind === 'mcq') return [block.blank]
    if (block.kind === 'grid') return block.rows.map(row => row.blank)
    return []
  }))
  assert.deepEqual(blanks, section.questions.map(question => question.number))
}

const audio = readFileSync(`public${test.continuousAudioUrl}`)
assert.equal(audio.length, 19727982)
assert.equal(createHash('sha256').update(audio).digest('hex'), '9fe36ef61ea84479919218cc9c05943a3bf979b18294a962c562f67de2cc9995')
assert.match(readFileSync('src/data/listeningPassages.ts', 'utf8'), /listeningFullTest22/)
assert.match(readFileSync('src/utils/ieltsTrackCatalog.ts', 'utf8'), /22: 'ielts-listening-22'/)
console.log('Listening Full Test 22 valid: 40 aligned answers, controls, catalog registration and original audio checksum.')
