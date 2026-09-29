import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

const source = readFileSync(new URL('../src/data/writingFullTests5to30.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText
const exports = {}
runInNewContext(compiled, { exports, require: () => ({}) })
const tests = exports.WRITING_TESTS_5_TO_30

assert.equal(tests.length, 26)
const ids = new Set()
const prompts = new Set()
const visualKinds = new Set()
for (let offset = 0; offset < tests.length; offset++) {
  const test = tests[offset]
  const index = offset + 5
  assert.equal(test.index, index)
  assert.equal(test.id, `writing-full-${index}`)
  assert.equal(test.available, true)
  assert.equal(test.tasks.length, 2)
  for (const [taskOffset, task] of test.tasks.entries()) {
    assert.equal(task.id, `writing-full-${index}-task-${taskOffset + 1}`)
    assert.equal(task.taskType, taskOffset === 0 ? 'task1' : 'task2')
    assert.equal(task.available, true)
    assert.ok(task.prompt.length > 100)
    assert.ok(!ids.has(task.id), `Duplicate task ID: ${task.id}`)
    assert.ok(!prompts.has(task.promptLead), `Duplicate prompt: ${task.id}`)
    ids.add(task.id)
    prompts.add(task.promptLead)
  }
  const visualTask = test.tasks[0]
  assert.ok(visualTask.visual || visualTask.diagram, `Missing Task 1 visual: ${test.id}`)
  assert.ok(visualTask.visualContext, `Missing evaluation context: ${test.id}`)
  visualKinds.add(visualTask.visual?.kind ?? visualTask.diagram)
  if (visualTask.visual) {
    const visual = visualTask.visual
    assert.equal(visual.years.length, 5)
    assert.ok(visual.sourceUrl.startsWith('https://'))
    for (const series of visual.series) {
      assert.equal(series.values.length, visual.years.length)
      assert.ok(series.values.every(Number.isFinite))
      if (visual.kind === 'pie') assert.ok(series.values.every((value) => value >= 0 && value <= 100))
    }
  }
}
for (const kind of ['bar', 'line', 'pie', 'table', 'brick-making', 'riverside-park']) {
  assert.ok(visualKinds.has(kind), `Missing Task 1 diagram variety: ${kind}`)
}
console.log('Writing bank valid: 26 full tests, 52 unique tasks, 26 Task 1 visuals.')
