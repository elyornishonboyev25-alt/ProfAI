import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { build } from 'esbuild'
import { createEntryGenerator, moduleFingerprint, syncVocabulary } from './lib/sat-vocabulary-sync.mjs'

async function load(entryPoint) {
  const result = await build({ entryPoints: [entryPoint], bundle: true, platform: 'node', format: 'esm', write: false })
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`)
}

async function main() {
  const [{ SAT_TEST_CATALOG: catalog }, { satVocabularyPacks: curated }] = await Promise.all([
    load('src/features/sat/catalog.ts'), load('src/data/satVocabulary.ts'),
  ])
  const directory = await mkdtemp(join(tmpdir(), 'profai-sat-sync-'))
  const reviewedCatalog = Object.fromEntries(Object.entries(catalog).filter(([, test]) => curated.some((pack) => pack.id === `sat_full_mock_${test.mockId}`)))
  const newMockId = Math.max(...Object.values(catalog).map((test) => test.mockId)) + 1
  const options = { catalog: reviewedCatalog, curated, cacheDirectory: join(directory, 'cache'), outputPath: join(directory, 'vocabulary.json') }
  let calls = 0
  const fixture = { ...structuredClone(catalog[2]), mockId: newMockId, id: 'test-only-new-mock' }
  const generatedEntries = (module) => structuredClone(curated[1].sections.find((section) => section.id.endsWith(`_${module.id}`)).entries)
  const generateEntries = async ({ module }) => { calls++; return generatedEntries(module) }
  try {
    const existing = await syncVocabulary({ ...options, generateEntries: createEntryGenerator({}) })
    assert.deepEqual(existing.packs, curated, 'Reviewed content and IDs must remain unchanged, without API keys')
    assert.equal(existing.generatedModules, 0)
    options.catalog = { ...reviewedCatalog, [newMockId]: fixture }
    const added = await syncVocabulary({ ...options, generateEntries })
    assert.equal(calls, 2)
    assert.equal(added.generatedModules, 2)
    assert.equal(added.packs.length, curated.length + 1)
    const newPack = added.packs[curated.length]
    assert.equal(newPack.title, `SAT Full Mock ${newMockId}`)
    assert.deepEqual(newPack.sections.map((section) => section.entries.length), [20, 20])
    assert.equal(newPack.sections[0].entries[0].id, `sat_full_mock_${newMockId}_rw1_${newPack.sections[0].entries[0].term}`)
    assert.ok(newPack.sections.every((section) => section.entries.every((entry) => entry.sourceQuestionId.startsWith(section.id.endsWith('rw1') ? 'rw1-' : 'rw2-'))))
    const reused = await syncVocabulary({ ...options, generateEntries: createEntryGenerator({}) })
    assert.equal(reused.generatedModules, 0)
    assert.equal(reused.changed, false, 'No-op sync must not trigger a Vite reload')
    assert.deepEqual(reused.packs, added.packs)

    fixture.modules[0].questions[0].prompt += '\nAdditional context for this question.'
    const edited = await syncVocabulary({ ...options, generateEntries })
    assert.equal(edited.generatedModules, 1, 'Only the changed module should regenerate')
    assert.equal(calls, 3)
    assert.deepEqual(edited.packs[curated.length].sections[1], added.packs[curated.length].sections[1])

    const module = fixture.modules.find((item) => item.id === 'rw1')
    const fingerprint = moduleFingerprint(fixture, module)
    await writeFile(join(options.cacheDirectory, `${fingerprint}.json`), '{broken json')
    const recovered = await syncVocabulary({ ...options, generateEntries })
    assert.equal(recovered.generatedModules, 1)
    const goodOutput = await readFile(options.outputPath, 'utf8')
    fixture.modules[0].questions[0].prompt += '\nInvalidate cache again.'
    let attempts = 0
    await assert.rejects(syncVocabulary({ ...options, generateEntries: async ({ module }) => {
      attempts++
      const entries = generatedEntries(module)
      entries[0].term = 'inventedwordnotinthetest'
      return entries
    } }), /absent from its source/)
    assert.equal(attempts, 2, 'Invalid model output is retried only once')
    assert.equal(await readFile(options.outputPath, 'utf8'), goodOutput, 'Failure must not publish partial vocabulary')
    await assert.rejects(syncVocabulary({ ...options, generateEntries: createEntryGenerator({}) }), /needs GEMINI_API_KEY or OPENAI_API_KEY/)

    const invalidCases = [
      (entries) => entries.slice(0, 19),
      (entries) => [...entries.slice(0, 19), entries[0]],
      (entries) => entries.map((entry, index) => index ? entry : { ...entry, uzbek: '' }),
      (entries) => entries.map((entry, index) => index ? entry : { ...entry, sourceQuestionId: 'math1-1' }),
      (entries) => entries.map((entry, index) => index ? entry : { ...entry, example: 'No matching term here.' }),
    ]
    for (const invalidate of invalidCases) {
      await assert.rejects(syncVocabulary({ ...options, generateEntries: async ({ module }) => invalidate(generatedEntries(module)) }))
      assert.equal(await readFile(options.outputPath, 'utf8'), goodOutput)
    }
    const removed = await syncVocabulary({ ...options, catalog: reviewedCatalog, generateEntries: createEntryGenerator({}) })
    assert.equal(removed.packs.length, curated.length, 'Removing a mock must remove its generated pack')

    // Provider transport is fake: verify payload boundaries, fallback, and output
    // validation without exposing credentials or spending live API quota.
    const requests = []
    const provider = createEntryGenerator({ GEMINI_API_KEY: 'test-only-gemini', GEMINI_MODELS: 'test-model', OPENAI_API_KEY: 'test-only-openai' }, async (url, init) => {
      requests.push({ url, body: JSON.parse(init.body) })
      if (requests.length === 1) return { ok: false }
      return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify({ entries: generatedEntries(module) }) } }] }) }
    })
    assert.equal((await provider({ test: fixture, module })).length, 20)
    assert.equal(requests.length, 2)
    const source = JSON.parse(requests[0].body.contents[0].parts[0].text)
    assert.equal(source.module, 'rw1')
    assert.ok(source.questions.every((question) => Object.keys(question).sort().join(',') === 'choices,id,prompt'))
    assert.ok(source.questions.every((question) => question.id.startsWith('rw1-')))
    console.log('SAT auto vocabulary passed: new mock, cache reuse, edited/deleted modules, invalid output, atomic failure, missing credentials, and provider fallback.')
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1 })
