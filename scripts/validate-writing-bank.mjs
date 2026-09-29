import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

const source = readFileSync(new URL('../src/data/writingFullTests5to30.ts', import.meta.url), 'utf8')
const originalSource = readFileSync(new URL('../src/data/writingFullTestOriginalVisuals.ts', import.meta.url), 'utf8')
const options = { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
const originals = {}
runInNewContext(ts.transpileModule(originalSource, { compilerOptions: options }).outputText, { exports: originals })
const compiled = ts.transpileModule(source, {
  compilerOptions: options,
}).outputText
const exports = {}
runInNewContext(compiled, { exports, require: () => originals })
const tests = exports.WRITING_TESTS_5_TO_30

assert.equal(tests.length, 26)
const ids = new Set()
const prompts = new Set()
const visualKinds = new Set()
const images = new Set()
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
  assert.ok(visualTask.imageUrl, `Missing Task 1 image: ${test.id}`)
  assert.ok(visualTask.visualContext, `Missing evaluation context: ${test.id}`)
  assert.equal(visualTask.visual, undefined)
  assert.equal(visualTask.diagram, undefined)
  assert.ok(!images.has(visualTask.imageUrl), `Repeated image: ${visualTask.imageUrl}`)
  images.add(visualTask.imageUrl)
  const original = originals.ORIGINAL_TASK_VISUALS[index]
  assert.ok(original)
  assert.ok(visualTask.promptLead.includes(original.lead))
  assert.ok(visualTask.subtitle.includes(original.kind))
  visualKinds.add(original.kind)
  const image = new URL(`../public${visualTask.imageUrl}`, import.meta.url)
  assert.ok(existsSync(image), `Missing image file: ${visualTask.imageUrl}`)
  const bytes = readFileSync(image)
  const signature = bytes.subarray(0, 100).toString('utf8')
  assert.ok(original.extension === 'svg' ? signature.includes('<svg') || signature.includes('<?xml') : original.extension === 'png' ? bytes.subarray(0, 4).toString('hex') === '89504e47' : bytes.subarray(0, 2).toString('hex') === 'ffd8', `Invalid image: ${visualTask.imageUrl}`)
}
for (const kind of ['Bar chart', 'Line graph', 'Pie chart', 'Map', 'Process diagram']) {
  assert.ok(visualKinds.has(kind), `Missing Task 1 diagram variety: ${kind}`)
}
console.log('Writing bank valid: 26 full tests, 52 unique tasks, 26 Task 1 visuals.')
