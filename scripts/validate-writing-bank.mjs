import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

const options = { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
const modules = new Map()
function loadData(name) {
  if (modules.has(name)) return modules.get(name)
  assert.match(name, /^writing\w+$/)
  const exports = {}
  modules.set(name, exports)
  const source = readFileSync(new URL(`../src/data/${name}.ts`, import.meta.url), 'utf8')
  runInNewContext(ts.transpileModule(source, { compilerOptions: options }).outputText, {
    exports, require: (moduleName) => loadData(moduleName.replace('./', '')),
  })
  return exports
}
const practice = loadData('writingFullTestPracticeVisuals')
const supplied = loadData('writingFullTestSourceVisuals')
const native = loadData('writingSuppliedTaskVisuals')
const tests = loadData('writingFullTests5to30').WRITING_TESTS_5_TO_30
const catalog = loadData('writingTestData').getWritingFullTestCatalog()
assert.equal(catalog.length, 30)
// Check the complete live catalog, including the first four full tests.
const essayPrompts = new Set()
const normalize = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
for (const test of catalog) {
  const essay = test.tasks.find(task => task.taskType === 'task2')
  const text = normalize(essay.promptLead + ' ' + essay.promptQuestion)
  assert.ok(!essayPrompts.has(text), `Duplicate Task 2 in full catalog: ${test.id}`)
  essayPrompts.add(text)
}

assert.equal(tests.length, 26)
const ids = new Set()
const prompts = new Set()
const visualKinds = new Set()
const images = new Set()
const kindCounts = new Map()
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
  assert.ok(visualTask.visualContext, `Missing evaluation context: ${test.id}`)
  assert.equal(visualTask.visual, undefined)
  const essay = test.tasks[1]
  if (index >= 10) {
    assert.ok(essay.source, `Missing official Task 2 source: ${test.id}`)
    const host = new URL(essay.source.url).hostname
    assert.ok(['www.britishcouncil.sg', 'takeielts.britishcouncil.org', 'ielts.idp.com', 'info.ielts.idp.com', 'ielts.org'].includes(host), `Unofficial source: ${test.id}`)
    assert.ok(essay.source.material)
    assert.equal(essay.source.checkedOn, '2026-10-06')
    assert.ok(essay.promptQuestion)
  }
  const nativeVisual = native.SUPPLIED_TASK_VISUALS[index]
  if (nativeVisual) {
    assert.equal(visualTask.imageUrl, undefined, `Supplied diagram must use native SVG: ${test.id}`)
    assert.equal(visualTask.diagram, nativeVisual.diagram)
    assert.equal(visualTask.promptLead, nativeVisual.lead)
    assert.equal(visualTask.visualContext, nativeVisual.context)
    visualKinds.add(nativeVisual.kind)
    kindCounts.set(nativeVisual.kind, (kindCounts.get(nativeVisual.kind) ?? 0) + 1)
    continue
  }
  assert.ok(visualTask.imageUrl, `Missing Task 1 image: ${test.id}`)
  assert.equal(visualTask.diagram, undefined)
  assert.ok(!images.has(visualTask.imageUrl), `Repeated image: ${visualTask.imageUrl}`)
  images.add(visualTask.imageUrl)
  const sourceVisual = supplied.SOURCE_TASK_VISUALS[index]
  const visual = sourceVisual ?? practice.PRACTICE_TASK_VISUALS[index]
  assert.ok(visual)
  assert.equal(visualTask.promptLead, visual.lead)
  assert.ok(visualTask.subtitle.includes(visual.kind))
  assert.equal(visualTask.imageUrl, sourceVisual
    ? `/images/ielts-writing/full-writing-test-${index}-source.${sourceVisual.extension}`
    : `/images/ielts-writing/full-writing-test-${index}-practice.svg`)
  visualKinds.add(visual.kind)
  kindCounts.set(visual.kind, (kindCounts.get(visual.kind) ?? 0) + 1)
  if (sourceVisual) {
    assert.ok(sourceVisual.sourceUrl.startsWith('https://'))
    assert.ok(sourceVisual.context.length > 120)
    assert.equal(visualTask.visualContext, sourceVisual.context)
  } else if (visual.series) {
    assert.ok(visual.categories.length >= 3 && visual.categories.length <= 6)
    for (const series of visual.series) {
      assert.equal(series.values.length, visual.categories.length)
      assert.ok(series.values.every((value) => Number.isFinite(value) && value >= 0))
    }
    if (visual.chartType === 'pie') {
      for (const series of visual.series) assert.equal(series.values.reduce((sum, value) => sum + value, 0), 100)
    }
    if (visual.chartType === 'stacked') {
      for (let category = 0; category < visual.categories.length; category++) {
        assert.equal(visual.series.reduce((sum, series) => sum + series.values[category], 0), 100)
      }
    }
    assert.ok(visual.categories.every((category) => visualTask.visualContext.includes(category)))
  } else {
    assert.ok(visual.context?.length > 120)
  }
  const image = new URL(`../public${visualTask.imageUrl}`, import.meta.url)
  assert.ok(existsSync(image), `Missing image file: ${visualTask.imageUrl}`)
  const bytes = readFileSync(image)
  const signature = bytes.subarray(0, 100).toString('utf8')
  if (!sourceVisual) assert.ok(signature.includes('<svg'), `Invalid image: ${visualTask.imageUrl}`)
  else if (sourceVisual.extension === 'png') assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
  else if (sourceVisual.extension === 'jpg') assert.equal(bytes.subarray(0, 3).toString('hex'), 'ffd8ff')
  else assert.equal(bytes.subarray(0, 4).toString('utf8'), 'RIFF')
}
for (const kind of ['Bar chart', 'Line graph', 'Pie charts', 'Maps', 'Process diagram', 'Table', 'Charts']) {
  assert.ok(visualKinds.has(kind), `Missing Task 1 diagram variety: ${kind}`)
}
assert.equal(Object.keys(supplied.SOURCE_TASK_VISUALS).length, 13)
assert.equal(Object.keys(practice.PRACTICE_TASK_VISUALS).length, 10)
assert.equal(Object.keys(native.SUPPLIED_TASK_VISUALS).length, 3)
assert.equal(tests[13].tasks[0].diagram, 'major-sports-1997-2017')
assert.equal(tests[14].tasks[0].diagram, 'school-travel-1990-2010')
assert.equal(tests[15].tasks[0].diagram, 'supplied-brick-manufacturing')
assert.ok(kindCounts.get('Maps') >= 2)
assert.ok(kindCounts.get('Process diagram') >= 2)
execFileSync(process.execPath, [fileURLToPath(new URL('./generate-writing-practice-images.mjs', import.meta.url)), '--check'])
console.log('Writing bank valid: 30 full tests, 30 unique essays, 21 official Task 2 replacements, 3 supplied native SVG diagrams.')
