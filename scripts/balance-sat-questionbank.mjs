// Redistribute the selected, deduplicated stock without changing source content.
// Same-domain swaps preserve every module's blueprint and reading/writing split.
import { readFileSync, writeFileSync } from 'node:fs'
import assert from 'node:assert/strict'

const file = new URL('../src/data/sat/questionBankMocks.json', import.meta.url)
const inventoryFile = new URL('../src/data/sat/questionBankInventory.json', import.meta.url)
const data = JSON.parse(readFileSync(file, 'utf8'))
const skills = ['Words in Context', 'Text Structure and Purpose', 'Cross-Text Connections', 'Central Ideas and Details', 'Command of Evidence', 'Inferences', 'Boundaries', 'Form, Structure, and Sense', 'Transitions', 'Rhetorical Synthesis']
const domains = ['Algebra', 'Advanced Math', 'Problem-Solving and Data Analysis', 'Geometry and Trigonometry']
const levels = ['Foundation', 'Medium', 'Advanced']
let seed = 20260920
const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32)

for (const section of ['reading-writing', 'math']) {
  const modules = data.tests.flatMap((test) => (section === 'math' ? ['math1', 'math2'] : ['rw1', 'rw2']).map((id) => ({
    mockId: test.mockId, id, questions: test.questions.filter((q) => q.moduleId === id),
  })))
  const stock = modules.flatMap((m) => m.questions)
  const allSkills = [...new Set(stock.map((q) => q.skill))]
  const targets = Object.fromEntries(allSkills.map((skill) => [skill, stock.filter((q) => q.skill === skill).length / modules.length]))
  const levelTargets = Object.fromEntries(levels.map((level) => [level, stock.filter((q) => q.difficulty === level).length / modules.length]))
  // Canonical starting order makes reruns reproducible even after IDs move.
  for (const domain of new Set(stock.map((q) => q.domain))) {
    const pool = stock.filter((q) => q.domain === domain).sort((a, b) => a.sourceQuestionId.localeCompare(b.sourceQuestionId))
    let i = 0
    for (const module of modules) module.questions = module.questions.map((q) => q.domain === domain ? pool[i++] : q)
  }
  function cost(module) {
    const counts = {}, difficulty = {}
    let spr = 0
    for (const q of module.questions) {
      counts[q.skill] = (counts[q.skill] || 0) + 1
      difficulty[q.difficulty] = (difficulty[q.difficulty] || 0) + 1
      spr += q.kind === 'student-response' ? 1 : 0
    }
    return allSkills.reduce((n, skill) => n + (section === 'math' ? 1 : 8) * ((counts[skill] || 0) - targets[skill]) ** 2, 0)
      + levels.reduce((n, level) => n + 3 * ((difficulty[level] || 0) - levelTargets[level]) ** 2, 0)
      + (section === 'math' ? 100 * (spr - 5) ** 2 : 0)
  }
  const costs = modules.map(cost)
  for (let iteration = 0; iteration < 600000; iteration++) {
    const a = Math.floor(random() * modules.length), b = Math.floor(random() * modules.length)
    if (a === b) continue
    const left = modules[a].questions, right = modules[b].questions
    const i = Math.floor(random() * left.length)
    const candidates = right.flatMap((q, j) => q.domain === left[i].domain ? [j] : [])
    const j = candidates[Math.floor(random() * candidates.length)]
    ;[left[i], right[j]] = [right[j], left[i]]
    const nextA = cost(modules[a]), nextB = cost(modules[b])
    const delta = nextA + nextB - costs[a] - costs[b]
    const temperature = iteration < 400000 ? 3 * (1 - iteration / 400000) : 0
    if (delta <= 0 || (temperature && random() < Math.exp(-delta / temperature))) {
      costs[a] = nextA; costs[b] = nextB
    } else [left[i], right[j]] = [right[j], left[i]]
  }
  for (const module of modules) {
    module.questions.sort((a, b) => section === 'math'
      ? levels.indexOf(a.difficulty) - levels.indexOf(b.difficulty) || domains.indexOf(a.domain) - domains.indexOf(b.domain) || a.sourceQuestionId.localeCompare(b.sourceQuestionId)
      : skills.indexOf(a.skill) - skills.indexOf(b.skill) || levels.indexOf(a.difficulty) - levels.indexOf(b.difficulty) || a.sourceQuestionId.localeCompare(b.sourceQuestionId))
    module.questions = module.questions.map((q, i) => ({ ...q, id: `${module.id}-${i + 1}`, moduleId: module.id, number: i + 1 }))
    for (const level of levels) assert.ok(module.questions.filter((q) => q.difficulty === level).length >= (section === 'math' ? 6 : 7))
    if (section === 'math') assert.equal(module.questions.filter((q) => q.kind === 'student-response').length, 5)
    else assert.ok(new Set(module.questions.map((q) => q.skill)).size >= 9)
  }
  for (const test of data.tests) test.questions = [
    ...test.questions.filter((q) => q.section !== section),
    ...modules.filter((m) => m.mockId === test.mockId).flatMap((m) => m.questions),
  ]
  console.log(`${section}: balanced ${modules.length} modules, all ${stock.length} source questions retained.`)
}
const rows = JSON.parse(readFileSync(inventoryFile, 'utf8'))
const rowById = new Map(rows.map((row) => [row.sourceId, row]))
for (const test of data.tests) {
  test.questions.sort((a, b) => ['rw1', 'rw2', 'math1', 'math2'].indexOf(a.moduleId) - ['rw1', 'rw2', 'math1', 'math2'].indexOf(b.moduleId) || a.number - b.number)
  for (const q of test.questions) Object.assign(rowById.get(q.sourceQuestionId), { mockId: test.mockId, moduleId: q.moduleId, number: q.number })
}
if (process.argv.includes('--write')) {
  writeFileSync(file, JSON.stringify(data) + '\n')
  writeFileSync(inventoryFile, JSON.stringify(rows, null, 2) + '\n')
}
