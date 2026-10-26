import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { build } from 'esbuild'

const { JSDOM } = createRequire(new URL('../backend/package.json', import.meta.url))('jsdom')
const papers = JSON.parse(fs.readFileSync('src/data/telegramIeltsPapers.json', 'utf8'))
const evidence = JSON.parse(fs.readFileSync('scripts/fixtures/telegram-ielts-integrity.json', 'utf8'))
const bundled = await build({ stdin: { contents: `
export { evaluateReadingAnswers } from './src/utils/ieltsUtils';
export { listKnownIeltsTests, resolveIeltsTestById } from './src/utils/ieltsTestCatalog';
export { readingDaySections } from './src/data/readingDaySections';
export { readingMockDayTests } from './src/data/readingMockDayTests';
export { getWritingFullTestCatalog, getWritingTaskById } from './src/data/writingTestData';
export { getIeltsFullTestCatalog, getIeltsReadingUnifiedCatalog, isAvailableIeltsTrackTest } from './src/utils/ieltsTrackCatalog';
`, resolveDir: process.cwd() }, bundle: true, write: false, platform: 'node', format: 'cjs', define: { 'import.meta.env': '{}' }, loader: { '.jpg': 'dataurl', '.png': 'dataurl' } })
const module = { exports: {} }
new Function('module', 'exports', bundled.outputFiles[0].text)(module, module.exports)
const c = module.exports
const normalize = value => String(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const slots = question => Array.isArray(question.correctAnswer) ? question.correctAnswer.length : 1
const sourceAnswer = answer => Array.isArray(answer) ? answer[0] : answer
const known = c.listKnownIeltsTests()
const oldReading = [...known.filter(t => t.module === 'Reading' && !t.sections.some(s => s.sourceQuestionsHtml)).flatMap(t => t.sections), ...Object.values(c.readingDaySections), ...Object.values(c.readingMockDayTests).flatMap(t => t.sections)]
const seenPassages = new Set(oldReading.map(s => normalize(s.title)))
const seenOpening = new Set(oldReading.map(s => normalize(s.content ?? s.paragraphs?.map(p => p.content).join(' ') ?? '').split(' ').slice(0, 60).join(' ')))
const baseline = known.filter(t => t.module === 'Listening' && !t.sections.some(s => s.sourceQuestionsHtml))
const seenListeningKeys = new Set(baseline.map(t => t.sections.flatMap(s => s.questions.flatMap(q => Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer])).map(normalize).join('|')))
const mediaHashes = new Set()

assert.equal(papers.listening.length, evidence.length)
assert.equal(papers.reading.length, evidence.length)
assert.equal(papers.writing.length, evidence.length)
for (const [offset, source] of evidence.entries()) {
  const index = offset + 31
  assert.equal(source.index, index)
  assert.match(source.post, /^https:\/\/t\.me\/jasurbekisaev\/\d+$/)
  assert.ok(!mediaHashes.has(source.audio.sha256), 'Repeated source recording')
  mediaHashes.add(source.audio.sha256)
  if (source.audio.url.startsWith('/')) {
    const bytes = fs.readFileSync(`public${source.audio.url}`)
    assert.equal(bytes.length, source.audio.bytes)
    assert.equal(createHash('sha256').update(bytes).digest('hex'), source.audio.sha256)
  }
  for (const image of source.images) {
    const bytes = fs.readFileSync(`public${image.path}`)
    assert.equal(bytes.length, image.bytes)
    assert.equal(createHash('sha256').update(bytes).digest('hex'), image.sha256, 'Original image bytes')
  }
  for (const kind of ['listening', 'reading']) {
    const test = papers[kind][offset]
    assert.equal(c.resolveIeltsTestById(test.id)?.id, test.id)
    assert.equal(c.isAvailableIeltsTrackTest(kind, test.id), true)
    assert.equal((kind === 'reading' ? c.getIeltsReadingUnifiedCatalog() : c.getIeltsFullTestCatalog('listening'))[index - 1].testId, test.id)
    assert.equal(test.sections.length, kind === 'reading' ? 3 : 4)
    const numbered = test.sections.flatMap(s => s.questions.flatMap(q => Array.from({ length: slots(q) }, (_, i) => q.number + i)))
    assert.deepEqual(numbered, Array.from({ length: 40 }, (_, i) => i + 1))
    const answers = {}
    for (const section of test.sections) {
      const dom = new JSDOM(section.sourceQuestionsHtml)
      const controls = [...dom.window.document.querySelectorAll('input,select')]
      assert.ok(controls.length >= section.questions.length)
      const allowed = new Set(section.questions.map(q => q.id))
      for (const control of controls) assert.ok(allowed.has(control.dataset.sourceQuestion))
      assert.equal(new Set(controls.map(el => el.dataset.sourceQuestion)).size, section.questions.length)
      assert.equal(dom.window.document.querySelectorAll('script,iframe,[onclick],[onerror]').length, 0)
      for (const img of dom.window.document.querySelectorAll('img')) assert.ok(source.images.some(record => record.path === img.getAttribute('src')))
      dom.window.close()
      for (const question of section.questions) {
        if (Array.isArray(question.correctAnswer)) {
          const original = question.correctAnswer.map((_, i) => sourceAnswer(source.answers[kind][question.number + i]))
          assert.deepEqual(question.correctAnswer.map(normalize), original.map(normalize))
          answers[question.id] = original
        } else {
          const expected = source.answers[kind][question.number]
          assert.deepEqual(question.correctAnswer.split(' / ').map(normalize), (Array.isArray(expected) ? expected : [expected]).map(normalize))
          answers[question.id] = sourceAnswer(expected)
        }
      }
      if (kind === 'reading') {
        assert.ok(!seenPassages.has(normalize(section.title)), `Duplicate passage ${section.title}`)
        seenPassages.add(normalize(section.title))
        const opening = normalize(section.content).split(' ').slice(0, 60).join(' ')
        assert.ok(!seenOpening.has(opening), `Repeated passage opening ${section.title}`)
        seenOpening.add(opening)
        assert.ok(section.content.split(/\s+/).length > 400)
      }
    }
    assert.equal(c.evaluateReadingAnswers(test.sections, answers).summary.correctAnswers, 40, `${test.id}: source key 40/40`)
    assert.equal(c.evaluateReadingAnswers(test.sections, {}).summary.skippedAnswers, 40)
    for (const question of test.sections.flatMap(s => s.questions).filter(q => Array.isArray(q.correctAnswer))) {
      assert.equal(c.evaluateReadingAnswers(test.sections, { ...answers, [question.id]: [...answers[question.id]].reverse() }).summary.correctAnswers, 40, 'Choices work in either order')
    }
    if (kind === 'listening') {
      assert.equal(test.continuousAudioUrl, source.audio.url)
      const key = test.sections.flatMap(s => s.questions.flatMap(q => Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer])).map(normalize).join('|')
      assert.ok(!seenListeningKeys.has(key), 'Repeated full Listening key')
      seenListeningKeys.add(key)
    }
  }
  const writing = c.getWritingFullTestCatalog().find(t => t.id === `writing-full-${index}`)
  assert.equal(writing?.tasks.length, 2)
  for (const task of writing.tasks) assert.equal(c.getWritingTaskById(task.id)?.id, task.id)
  assert.ok(source.images.some(image => image.path === writing.tasks[0].imageUrl))
}
console.log(`PASS: ${evidence.length} original Telegram Listening, Reading and Writing papers; source keys, 40 numbered slots, live routes, image hashes, recording evidence and duplicate checks`)
