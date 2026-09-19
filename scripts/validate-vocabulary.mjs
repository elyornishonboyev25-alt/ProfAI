import assert from 'node:assert/strict'
import { build } from 'esbuild'

// Bundle in memory so validation uses the actual catalog (including content
// corrections), without writing generated files into the repository.
async function load(entryPoint) {
  const result = await build({ entryPoints: [entryPoint], bundle: true, platform: 'node', format: 'esm', write: false })
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`)
}

async function main() {
  const { SAT_TEST_CATALOG } = await load('src/features/sat/catalog.ts')
  const { vocabularyCollections } = await load('src/data/vocabularyCollections.ts')
  const tests = Object.values(SAT_TEST_CATALOG).sort((a, b) => a.mockId - b.mockId)
  assert.equal(vocabularyCollections.sat.length, tests.length, 'Every live mock needs a curated vocabulary set')
  const ids = new Set()
  for (const [index, pack] of vocabularyCollections.sat.entries()) {
    const test = tests[index]
    assert.equal(pack.title, `SAT Full Mock ${test.mockId}`)
    assert.equal(pack.id, `sat_full_mock_${test.mockId}`)
    assert.equal(pack.sections.length, 2)
    for (const [moduleIndex, section] of pack.sections.entries()) {
      const module = test.modules.find((item) => item.id === `rw${moduleIndex + 1}`)
      assert.ok(module)
      assert.equal(section.title, `English Module ${moduleIndex + 1}`)
      assert.equal(section.entries.length, 20, `${pack.title} ${section.title}`)
      assert.equal(new Set(section.entries.map((entry) => entry.term.toLowerCase())).size, 20)
      assert.equal(new Set(section.entries.map((entry) => entry.definition)).size, 20, 'Quiz meanings must differ')
      for (const entry of section.entries) {
        const label = `${pack.title}, ${section.title}: ${entry.term}`
        assert.ok(!ids.has(entry.id), `Duplicate ID: ${label}`)
        ids.add(entry.id)
        assert.ok(entry.uzbek && entry.definition && entry.synonym && entry.example, label)
        assert.doesNotMatch(entry.term, /^SAT /)
        const question = module.questions.find((item) => item.id === entry.sourceQuestionId)
        assert.ok(question, `Missing source question: ${label}`)
        const source = [question.prompt, ...question.choices.map((choice) => choice.text)].join(' ')
        const word = new RegExp(`\\b${entry.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
        assert.match(source, word, `Word is not in its attributed module: ${label}`)
        assert.match(entry.example, word, `Example must use the term: ${label}`)
      }
    }
  }

  // Existing personal words survive, repeated saves merge sources, and removals
  // update subscribers. No browser or live account is needed for these checks.
  const memory = new Map()
  const events = new EventTarget()
  globalThis.window = {
    localStorage: { getItem: (key) => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) },
    dispatchEvent: events.dispatchEvent.bind(events),
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
  }
  const store = await load('src/utils/myVocabularyStore.ts')
  const legacy = { id: 'legacy', term: 'legacy', definition: 'Inherited from the past.', example: '', synonym: '', context: 'reading', source: 'manual', createdAt: '2025-01-01' }
  memory.set('smarttest_my_vocabulary_v1', JSON.stringify([legacy]))
  let changes = 0
  const unsubscribe = store.subscribeSavedWords(() => changes++)
  const entry = vocabularyCollections.sat[0].sections[0].entries[0]
  const origin = { label: 'SAT Full Mock 1 · English Module 1', path: '/vocabulary/sat/sat_full_mock_1/sat_full_mock_1_rw1', questionId: entry.sourceQuestionId }
  const first = store.addSavedWord({ ...entry, source: 'studio', context: 'sat', origins: [origin] })
  store.addSavedWord({ ...entry, term: ` ${entry.term.toUpperCase()} `, source: 'studio', context: 'sat', origins: [origin] })
  assert.equal(store.countSavedWords('sat'), 1)
  assert.equal(store.getSavedWords('sat')[0].id, first.id)
  assert.equal(store.getSavedWords('sat')[0].origins.length, 1)
  assert.equal(store.getSavedWords('sat')[0].uzbek, entry.uzbek)
  assert.deepEqual(store.getSavedWords('reading'), [legacy])
  store.addSavedWord({ ...entry, source: 'studio', context: 'sat', origins: [{ ...origin, path: '/another-module', label: 'Another module' }] })
  assert.equal(store.getSavedWords('sat')[0].origins.length, 2)
  store.addSavedWord({ ...entry, source: 'ai', context: 'sat', origin: 'AI explanation' })
  assert.equal(store.getSavedWords('sat')[0].origins.length, 2, 'AI updates must retain module provenance')
  store.removeSavedWord(first.id)
  assert.equal(store.countSavedWords('sat'), 0)
  assert.equal(changes, 5)
  unsubscribe()

  // Exercise the real server reward policy and event deduplication without a DB.
  const { calculateActivityXp, awardActivityXp } = await load('backend/src/services/xpRewards.service.ts')
  assert.equal(calculateActivityXp({ source: 'VOCAB_FLASHCARDS' }), 12)
  assert.equal(calculateActivityXp({ source: 'VOCAB_MATCHING' }), 20)
  for (const [source, maximum] of [['VOCAB_QUIZ', 30], ['VOCAB_TYPING', 35]]) {
    assert.equal(calculateActivityXp({ source, accuracy: 0 }), 10)
    assert.equal(calculateActivityXp({ source, accuracy: 100 }), maximum)
  }
  const rewardEvents = []
  const user = { xp: 0, level: 1 }
  const client = {
    xpEvent: {
      findUnique: async ({ where }) => rewardEvents.find((event) => event.eventKey === where.userId_eventKey.eventKey),
      findMany: async () => rewardEvents,
      create: async ({ data }) => { rewardEvents.push(data) },
    },
    user: {
      findUnique: async () => ({ ...user }),
      update: async ({ data }) => { if (data.xp) user.xp += data.xp.increment; if (data.level) user.level = data.level; return { ...user } },
    },
    notification: { create: async () => {} },
  }
  const award = (source, eventKey) => awardActivityXp(client, { userId: 'test-user', source, eventKey, accuracy: 100, timeZone: 'Asia/Tashkent' })
  assert.equal((await award('VOCAB_MATCHING', 'mock1:rw1:matching')).xpEarned, 20)
  assert.equal((await award('VOCAB_MATCHING', 'mock1:rw1:matching')).duplicate, true)
  assert.equal(user.xp, 20, 'A replay must not award XP twice')
  assert.equal((await award('VOCAB_MATCHING', 'mock1:rw2:matching')).xpEarned, 20)
  assert.equal((await award('VOCAB_TYPING', 'mock1:rw1:typing')).xpEarned, 35)
  assert.equal((await award('VOCAB_QUIZ', 'mock1:rw1:quiz')).xpEarned, 30)
  assert.equal((await award('VOCAB_FLASHCARDS', 'mock1:rw1:flashcards')).xpEarned, 12)
  assert.equal((await award('VOCAB_QUIZ', 'mock1:rw2:quiz')).xpEarned, 3)
  assert.equal((await award('VOCAB_TYPING', 'mock1:rw2:typing')).xpEarned, 0)
  assert.equal(user.xp, 120, 'Vocabulary activities share the daily cap')
  console.log(`Validated ${tests.length} SAT mocks, ${ids.size} source-linked words, My Words persistence, and vocabulary XP.`)
}

main().catch((error) => { console.error(error); process.exitCode = 1 })
