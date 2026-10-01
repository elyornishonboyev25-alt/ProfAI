import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

function loadDataModule(file) {
  const source = fs.readFileSync(file, 'utf8')
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText
  const module = { exports: {} }
  vm.runInNewContext(output, { module, exports: module.exports }, { filename: file })
  return module.exports
}

function normalizePrompt(value) {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9']+/g, ' ')
    .trim()
}

function assertUniqueIds(label, items) {
  const seen = new Set()
  for (const item of items) {
    if (!item.id?.trim()) throw new Error(`${label} contains an empty id.`)
    if (seen.has(item.id)) throw new Error(`${label} contains duplicate id "${item.id}".`)
    seen.add(item.id)
  }
}

const base = loadDataModule('src/data/ieltsSpeakingBank.ts')
const extra = loadDataModule('src/data/ieltsSpeakingBankExtra.ts')
const mock21to30 = loadDataModule('src/data/ieltsSpeakingBankMocks21to30.ts')

const part1 = [...base.PART1_TOPICS, ...extra.EXTRA_PART1_TOPICS, ...mock21to30.MOCK_21_TO_30_PART1]
const part2 = [...base.CUE_CARDS, ...extra.EXTRA_CUE_CARDS, ...mock21to30.MOCK_21_TO_30_PART2]
const part3 = [...base.PART3_THEMES, ...extra.EXTRA_PART3_THEMES, ...mock21to30.MOCK_21_TO_30_PART3]

for (const [label, items] of [
  ['Part 1', mock21to30.MOCK_21_TO_30_PART1],
  ['Part 2', mock21to30.MOCK_21_TO_30_PART2],
  ['Part 3', mock21to30.MOCK_21_TO_30_PART3],
]) {
  if (items.length !== 10) throw new Error(`Full Mocks 21–30 need exactly ten ${label} sets.`)
}

if (part1.length < 40 || part2.length < 40 || part3.length < 40) {
  throw new Error('IELTS Speaking requires at least 40 complete sets for every part.')
}

assertUniqueIds('Part 1', part1)
assertUniqueIds('Part 2', part2)
assertUniqueIds('Part 3', part3)

const seenPrompts = new Map()
const duplicatePrompts = []
function register(location, prompt) {
  const normalized = normalizePrompt(prompt)
  if (!normalized) throw new Error(`${location} contains an empty prompt.`)
  const existing = seenPrompts.get(normalized)
  if (existing) {
    duplicatePrompts.push(`${existing} and ${location}: ${prompt}`)
    return
  }
  seenPrompts.set(normalized, location)
}

for (const topic of part1) {
  if (topic.questions.length < 4) throw new Error(`Part 1/${topic.id} needs at least four questions.`)
  topic.questions.forEach((question, index) => {
    if (!question.sample?.trim()) throw new Error(`Part 1/${topic.id}/${index + 1} has no sample answer.`)
    register(`Part 1/${topic.id}/${index + 1}`, question.q)
  })
}

for (const card of part2) {
  if (card.bullets.length !== 4 || card.bullets.some((bullet) => !bullet.trim())) {
    throw new Error(`Part 2/${card.id} must have exactly four speaking points.`)
  }
  if (!card.sample?.trim()) throw new Error(`Part 2/${card.id} has no sample answer.`)
  register(`Part 2/${card.id}`, card.title)
  register(`Part 2/${card.id}/follow-up`, card.followUp)
}

for (const theme of part3) {
  if (theme.questions.length < 4) throw new Error(`Part 3/${theme.id} needs at least four questions.`)
  theme.questions.forEach((question, index) => {
    if (!question.sample?.trim()) throw new Error(`Part 3/${theme.id}/${index + 1} has no sample answer.`)
    register(`Part 3/${theme.id}/${index + 1}`, question.q)
  })
}

if (duplicatePrompts.length) {
  throw new Error(`Duplicate questions:\n${duplicatePrompts.join('\n')}`)
}

for (let index = 0; index < 10; index += 1) {
  if (mock21to30.MOCK_21_TO_30_PART1[index]?.questions.length !== 4) {
    throw new Error(`Full Mock ${index + 21} must have four Part 1 questions.`)
  }
  if (mock21to30.MOCK_21_TO_30_PART3[index]?.questions.length !== 4) {
    throw new Error(`Full Mock ${index + 21} must have four Part 3 questions.`)
  }
}

for (let index = 10; index < 30; index += 1) {
  if (part1[index]?.questions.length !== 4 || part3[index]?.questions.length !== 4) {
    throw new Error(`Full Mock ${index - 9} no longer follows the four-question baseline.`)
  }
}

const part1QuestionCount = part1.reduce((total, topic) => total + topic.questions.length, 0)
const part3QuestionCount = part3.reduce((total, theme) => total + theme.questions.length, 0)
console.log(
  `Speaking bank valid: ${part1.length} Part 1 topics (${part1QuestionCount} questions), ` +
    `${part2.length} Part 2 cards, ${part3.length} Part 3 themes (${part3QuestionCount} questions), no duplicates.`,
)
