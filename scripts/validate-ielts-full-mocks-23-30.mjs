import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

const listening = JSON.parse(readFileSync('src/data/listeningFullTests23to30.json', 'utf8'))
const reading = JSON.parse(readFileSync('src/data/readingFullTests23to30.json', 'utf8'))
const manifest = JSON.parse(readFileSync('scripts/fixtures/ielts-full-mocks-23-30-integrity.json', 'utf8'))
const code = ts.transpileModule(readFileSync('src/utils/ieltsUtils.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText
const module = { exports: {} }
vm.runInNewContext(code, { module, exports: module.exports })
const { evaluateReadingAnswers } = module.exports

function slots(test) {
  return test.sections.flatMap(section => section.questions.flatMap(question =>
    Array.isArray(question.correctAnswer)
      ? question.correctAnswer.map((_, index) => [question.number + index, question, index])
      : [[question.number, question, 0]],
  ))
}

function controls(test) {
  return test.sections.flatMap(section => (section.groups ?? []).flatMap(group => group.blocks.flatMap(block => {
    if (block.kind === 'note' || block.kind === 'example') return block.segments.filter(item => typeof item === 'object').map(item => item.blank)
    if (block.kind === 'mcq') return [block.blank]
    if (block.kind === 'multi-mcq') return block.blanks
    if (block.kind === 'grid') return block.rows.map(row => row.blank)
    if (block.kind === 'table') return block.rows.flatMap(row => row.flatMap(cell => cell.segments.filter(item => typeof item === 'object').map(item => item.blank)))
    return []
  })))
}

function verify(kind, tests) {
  assert.equal(tests.length, 8, `${kind}: eight papers`)
  const seenTitles = new Set()
  for (const [offset, test] of tests.entries()) {
    const number = offset + 23
    const source = manifest[kind][number]
    assert.ok(source?.source, `${kind} ${number}: source URL`)
    assert.equal(test.id, kind === 'reading' ? `ielts-reading-full-vol${number}` : `ielts-listening-${number}`)
    assert.equal(test.totalQuestions, 40)
    assert.equal(test.sections.length, kind === 'reading' ? 3 : 4)
    const allSlots = slots(test)
    assert.deepEqual(allSlots.map(([n]) => n), Array.from({ length: 40 }, (_, i) => i + 1), `${kind} ${number}: numbered slots`)
    assert.equal(Object.keys(source.answers).length, 40)
    const answerMap = {}
    for (const [n, question, position] of allSlots) {
      const sourceValues = Array.isArray(source.answers[n]) ? source.answers[n] : [source.answers[n]]
      const variants = sourceValues.map(value => String(value).toLowerCase()).sort()
      const actual = Array.isArray(question.correctAnswer)
        ? [String(question.correctAnswer[position]).toLowerCase()]
        : String(question.correctAnswer).split(/\s+\/\s+/).map(value => value.toLowerCase()).sort()
      assert.deepEqual(actual, variants, `${kind} ${number} Q${n}: source answer key`)
      assert.ok(question.text?.trim().length >= 6, `${kind} ${number} Q${n}: question text`)
      if (Array.isArray(question.correctAnswer)) {
        answerMap[question.id] ??= []
        answerMap[question.id].push(sourceValues[0])
      } else answerMap[question.id] = sourceValues[0]
      if (question.type === 'multiple-choice' || question.type.startsWith('matching') || question.type === 'five-true-statements') {
        if (kind === 'reading') assert.ok(question.options?.length >= 2, `${kind} ${number} Q${n}: answer choices`)
        if (kind === 'reading' && question.type === 'five-true-statements')
          assert.ok(question.options.every((option, index) => option.startsWith(`${String.fromCharCode(65 + index)}. `)), `Reading ${number} Q${n}: choices retain letters`)
      }
    }
    const report = evaluateReadingAnswers(test.sections, answerMap)
    assert.equal(report.summary.correctAnswers, 40, `${kind} ${number}: application scores source key 40/40`)
    assert.equal(evaluateReadingAnswers(test.sections, {}).summary.skippedAnswers, 40, `${kind} ${number}: unanswered score`)
    if (kind === 'listening') {
      assert.deepEqual(test.sections.map(section => section.questions.length), [10, 10, 10, 10])
      assert.deepEqual(controls(test), Array.from({ length: 40 }, (_, i) => i + 1), `Listening ${number}: visible controls`)
      for (const [partIndex, section] of test.sections.entries()) {
        const audio = source.audio[partIndex]
        assert.equal(section.audioUrl, `/audio/ielts-listening/${audio.filename}`)
        const bytes = readFileSync(`public${section.audioUrl}`)
        assert.equal(bytes.length, audio.bytes)
        assert.equal(createHash('sha256').update(bytes).digest('hex'), audio.sha256, `Listening ${number} part ${partIndex + 1}: exact paired audio`)
        assert.equal(section.visualAidUrl, undefined)
        assert.ok(!section.groups.some(group => group.blocks.some(block => block.kind === 'image')), `Listening ${number}: no unrepresented source diagram`)
      }
    } else {
      for (const section of test.sections) {
        assert.ok(section.content?.split(/\s+/).length > 400, `Reading ${number}: full passage`)
        const key = section.title.trim().toLowerCase()
        assert.ok(!seenTitles.has(key), `Reading ${number}: duplicate passage title`)
        seenTitles.add(key)
        for (const question of section.questions) {
          if (!question.options) continue
          assert.ok(question.options.every(option => !/^(?:[A-Z]|[ivx]+)\. \1$/i.test(option)), `Reading ${number}: missing option label`)
        }
      }
    }
    console.log(`${kind} ${number}: 40 keys and controls, source-aligned${kind === 'listening' ? ', four audio checksums' : ', three passages'}`)
  }
}

verify('listening', listening)
verify('reading', reading)
const catalog = readFileSync('src/utils/ieltsTrackCatalog.ts', 'utf8')
for (let number = 23; number <= 30; number++) {
  assert.ok(catalog.includes(`'ielts-listening-${number}'`))
  assert.ok(catalog.includes(`'ielts-reading-full-vol${number}'`))
}
