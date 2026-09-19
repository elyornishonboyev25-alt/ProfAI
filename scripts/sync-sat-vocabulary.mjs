import { syncSatVocabulary } from './lib/sat-vocabulary-sync.mjs'

syncSatVocabulary().then(({ packs, generatedModules }) => {
  console.log(`SAT vocabulary synchronized: ${packs.length} mocks, ${generatedModules} new modules.`)
}).catch((error) => { console.error(error.message); process.exitCode = 1 })
