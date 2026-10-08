import React, { act, StrictMode } from 'react'
import assert from 'node:assert/strict'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import IeltsVocabularyStudio, { IeltsVocabularyWord } from '../../src/components/vocab/IeltsVocabularyStudio'
import { VocabularyLanguageToggle } from '../../src/components/vocab/VocabularyLanguage'
import { getVocabularyTranslation } from '../../src/utils/vocabularyTranslation'
import { vocabularyCollections } from '../../src/data/vocabularyCollections'
import { SaveWordButton, WordSaveProvider } from '../../src/components/vocab/SaveWordButton'
import { FlashcardsActivity } from '../../src/components/vocab/activities'
import Vocabulary from '../../src/pages/Vocabulary'
import VocabularyActivity from '../../src/pages/VocabularyActivity'
import MyWordsVocabulary from '../../src/pages/MyWordsVocabulary'
import { getSavedWords, addSavedWord } from '../../src/utils/myVocabularyStore'

const container = document.getElementById('root')!
let root: ReturnType<typeof createRoot> | null = null
async function render(node: React.ReactNode, path = '/') {
  if (root) await act(async () => root!.unmount())
  root = createRoot(container)
  await act(async () => root!.render(<StrictMode><MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{node}</MemoryRouter></StrictMode>))
}
const toggle = () => container.querySelector('[aria-label="Vocabulary translation language"]')!
async function choose(language: 'uz' | 'ru') {
  const button = toggle().querySelector(`button[lang="${language}"]`) as HTMLButtonElement
  assert.ok(button)
  await act(async () => button.click())
  assert.equal(button.getAttribute('aria-pressed'), 'true')
}

export async function run() {
  window.localStorage.clear()
  const entry = { id: 'legacy-equipment', term: 'equipment', uzbek: 'jihozlar', definition: 'Tools needed for an activity.', synonym: 'gear', example: 'We checked the equipment.' }
  const fixture = <><VocabularyLanguageToggle /><IeltsVocabularyWord entry={entry} /></>
  await render(fixture)
  assert.equal(container.querySelector('article [lang="uz"]')?.textContent, 'jihozlar')
  await choose('ru')
  assert.equal(container.querySelector('article [lang="ru"]')?.textContent, 'оборудование')
  assert.equal(container.querySelector('article [lang="uz"]'), null)
  assert.ok(container.textContent!.includes(entry.definition))
  assert.ok(container.textContent!.includes(entry.synonym))
  await render(fixture)
  assert.equal(container.querySelector('article [lang="ru"]')?.textContent, 'оборудование', 'Preference survives remounting')

  const listening = vocabularyCollections.ielts[0].tests[0].sections[0].entries
  await render(<IeltsVocabularyStudio />, '/vocabulary/ielts?skill=listening&test=1')
  assert.equal(container.querySelector('article [lang="ru"]')?.textContent, getVocabularyTranslation(listening[0], 'ru'))
  await choose('uz')
  assert.equal(container.querySelector('article [lang="uz"]')?.textContent, listening[0].uzbek)

  const pack = vocabularyCollections.sat[0]
  const section = pack.sections[0]
  await render(<Routes><Route path="/vocabulary/:track" element={<Vocabulary />} /></Routes>, `/vocabulary/sat?mock=${pack.id}&module=${section.id}`)
  await choose('ru')
  assert.equal(container.querySelector('article [lang="ru"]')?.textContent, getVocabularyTranslation(section.entries[0], 'ru'))
  assert.equal(container.querySelectorAll('article').length, section.entries.length, 'Language selection preserves word count')

  await render(<><VocabularyLanguageToggle /><FlashcardsActivity entries={[entry]} masteryKey="translation-test" /></>)
  assert.equal(container.querySelector('.vocab-flash-definition[lang="ru"]')?.textContent, 'оборудование')
  await choose('uz')
  assert.equal(container.querySelector('.vocab-flash-definition[lang="uz"]')?.textContent, 'jihozlar')

  await render(<WordSaveProvider value={{ context: 'listening', origin: { label: 'Listening Test', path: '/vocabulary/ielts' } }}><SaveWordButton entry={entry} /></WordSaveProvider>)
  await act(async () => (container.querySelector('button') as HTMLButtonElement).click())
  assert.equal(getSavedWords('listening')[0].russian, 'оборудование')
  // An old saved word without a Russian field also uses the offline dictionary.
  addSavedWord({ ...entry, term: 'habitat', uzbek: 'yashash muhiti', source: 'studio', context: 'reading' })
  await render(<Routes><Route path="/vocabulary/my-words/:wordsContext" element={<MyWordsVocabulary />} /></Routes>, '/vocabulary/my-words/reading')
  await choose('ru')
  assert.ok(container.querySelector('.my-vocabulary-word [lang="ru"]')?.textContent)

  const test = vocabularyCollections.ielts[0].tests[0]
  await render(<Routes><Route path="/vocabulary/ielts/:bookId/:testId/:sectionId" element={<VocabularyActivity />} /></Routes>, `/vocabulary/ielts/${vocabularyCollections.ielts[0].id}/${test.id}/${test.sections[0].id}`)
  assert.equal(toggle().querySelector('button[lang="ru"]')?.getAttribute('aria-pressed'), 'true')
  await choose('uz')

  const storagePrototype = Object.getPrototypeOf(window.localStorage)
  const setItem = storagePrototype.setItem
  try {
    storagePrototype.setItem = () => { throw new Error('Storage disabled') }
    await render(fixture)
    await choose('ru')
    assert.equal(container.querySelector('article [lang="ru"]')?.textContent, 'оборудование')
  } finally { storagePrototype.setItem = setItem }
  await choose('uz')
  await act(async () => {
    window.localStorage.setItem('profai_vocabulary_language', 'ru')
    window.dispatchEvent(new window.StorageEvent('storage', { key: 'profai_vocabulary_language', newValue: 'ru' }))
  })
  assert.equal(container.querySelector('article [lang="ru"]')?.textContent, 'оборудование', 'Other tabs synchronize the preference')
  await act(async () => root!.unmount())
  console.log('PASS: Uzbek/Russian cards, IELTS and SAT routes, flashcards, saved words, persistence and unavailable storage')
}
