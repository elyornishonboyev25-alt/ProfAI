import assert from 'node:assert/strict'
import fs from 'node:fs'
import { build } from 'esbuild'

const papers = JSON.parse(fs.readFileSync('src/data/telegramIeltsSpeaking.json', 'utf8'))
const evidence = JSON.parse(fs.readFileSync('scripts/fixtures/telegram-speaking-integrity.json', 'utf8'))
const bundle = await build({ stdin: { contents: `
export { getIeltsSpeakingFullMockCatalog } from './src/utils/ieltsSpeakingCatalog';
export { PART1_TOPICS, CUE_CARDS, PART3_THEMES } from './src/data/ieltsSpeakingQuestionBank';
export { getIeltsFullTestCatalog, getIeltsReadingUnifiedCatalog, isAvailableIeltsTrackTest } from './src/utils/ieltsTrackCatalog';
export { getWritingFullTestCatalog } from './src/data/writingTestData';
`, resolveDir: process.cwd() }, bundle: true, platform: 'node', format: 'cjs', write: false, define: { 'import.meta.env': '{}' }, loader: { '.png': 'dataurl', '.jpg': 'dataurl' } })
const module = { exports: {} }
new Function('module', 'exports', bundle.outputFiles[0].text)(module, module.exports)
const c = module.exports
const normalize = value => value.normalize('NFKC').toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9']+/g, ' ').trim()
const prompts = new Set([
  ...c.PART1_TOPICS.flatMap(part => part.questions.map(question => question.q)),
  ...c.PART3_THEMES.flatMap(part => part.questions.map(question => question.q)),
  ...c.CUE_CARDS.flatMap(card => [card.title, card.followUp]),
].map(normalize))
const titles = new Set(c.CUE_CARDS.map(card => normalize(card.title)))
const catalog = c.getIeltsSpeakingFullMockCatalog()
assert.equal(papers.length, 5)
assert.equal(evidence.length, 5)
assert.equal(catalog.length, 35)
assert.equal(c.getIeltsFullTestCatalog('listening').length, 35)
assert.equal(c.getIeltsReadingUnifiedCatalog().length, 35)
assert.equal(c.getWritingFullTestCatalog().length, 35)
for (const [offset, paper] of papers.entries()) {
  const source = evidence[offset]
  assert.equal(paper.index, offset + 31)
  assert.equal(paper.id, `speaking-full-${paper.index}`)
  assert.deepEqual(catalog[paper.index - 1], paper)
  assert.deepEqual(paper.source, source.source)
  assert.match(paper.source.sha256, /^[a-f0-9]{64}$/)
  assert.match(paper.source.channelPost, /^https:\/\/t\.me\/jasurbekisaev\/\d+$/)
  for (const omitted of source.excluded) assert.ok(prompts.has(normalize(omitted.question)), 'Only repeated source questions may be omitted')
  const expectedPart1 = source.original.part1.filter(question => !source.excluded.some(omitted => omitted.part === 'part1' && omitted.question === question))
  assert.deepEqual(paper.parts.part1.questions.map(question => question.q), expectedPart1)
  assert.deepEqual(paper.parts.part2.bullets, source.original.part2.bullets)
  assert.equal(paper.parts.part2.title, source.original.part2.title)
  assert.deepEqual(paper.parts.part3.questions.map(question => question.q), source.original.part3)
  assert.equal(paper.parts.part2.followUp, '', 'Do not invent a follow-up absent from the original')
  assert.equal(paper.parts.part2.sample, '', 'Do not invent a source sample answer')
  assert.ok(paper.parts.part1.questions.length >= 4)
  assert.ok(paper.parts.part2.bullets.length >= 3)
  assert.ok(paper.parts.part3.questions.length >= 3)
  assert.ok(!titles.has(normalize(paper.parts.part2.title)), 'Repeated long-turn test')
  titles.add(normalize(paper.parts.part2.title))
  const questions = [...paper.parts.part1.questions, { q: paper.parts.part2.title, sample: '' }, ...paper.parts.part3.questions]
  for (const question of questions) {
    assert.ok(question.q.trim())
    assert.equal(question.sample, '')
    const normalized = normalize(question.q)
    assert.ok(!prompts.has(normalized), `Question already exists: ${question.q}`)
    prompts.add(normalized)
  }
  const listening = c.getIeltsFullTestCatalog('listening')[paper.index - 1]
  const reading = c.getIeltsReadingUnifiedCatalog()[paper.index - 1]
  assert.ok(c.isAvailableIeltsTrackTest('listening', listening.testId))
  assert.ok(c.isAvailableIeltsTrackTest('reading', reading.testId))
  assert.ok(c.getWritingFullTestCatalog()[paper.index - 1].available)
}
console.log('PASS: five original Speaking sets, unchanged source questions, no repeated prompts, and 35 available tests in every IELTS skill')
