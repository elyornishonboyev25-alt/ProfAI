import React, { act, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import assert from 'node:assert/strict'
import TestVocabulary from '../../src/components/vocab/TestVocabulary'
import IELTSReadingInterface from '../../src/components/IELTSReadingInterface'
import IELTSWritingFullTestInterface from '../../src/components/IELTSWritingFullTestInterface'
import IELTSSpeakingTest from '../../src/pages/IELTSSpeakingTest'
import IeltsVocabularyStudio from '../../src/components/vocab/IeltsVocabularyStudio'
import MockIELTSRun from '../../src/pages/MockIELTSRun'
import { getIeltsTestVocabulary, speakingVocabularyTestId } from '../../src/utils/ieltsTestVocabulary'
import { getIeltsFullTestCatalog, getIeltsReadingUnifiedCatalog } from '../../src/utils/ieltsTrackCatalog'
import { getIeltsSpeakingFullMockCatalog } from '../../src/utils/ieltsSpeakingCatalog'
import { getWritingFullTestCatalog } from '../../src/data/writingTestData'
import { resolveIeltsTestById } from '../../src/utils/ieltsTestCatalog'
import { getFullMockById, saveFullMockSectionResult } from '../../src/utils/ieltsMockCatalog'
import { useAuthStore } from '../../src/store/authStore'

const container = document.getElementById('root')!
let root: ReturnType<typeof createRoot> | null = null
async function render(node: React.ReactNode, path = '/') {
  if (root) await act(async () => root!.unmount())
  root = createRoot(container)
  await act(async () => root!.render(<StrictMode><MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{node}</MemoryRouter></StrictMode>))
}
const reminder = () => container.querySelector('[data-test-vocabulary="reminder"]')
const link = () => container.querySelector('[data-test-vocabulary="link"] a') as HTMLAnchorElement
const click = async (element: HTMLElement | null) => {
  assert.ok(element)
  await act(async () => element!.click())
}
const clear = () => { window.localStorage.clear(); window.sessionStorage.clear() }
const wait = async (ms: number) => act(async () => { await new Promise((resolve) => setTimeout(resolve, ms)) })

export async function run() {
  const catalogs = {
    listening: getIeltsFullTestCatalog('listening').map((entry) => entry.testId),
    reading: getIeltsReadingUnifiedCatalog().map((entry) => entry.testId),
    writing: getWritingFullTestCatalog().map((entry) => entry.id),
    speaking: getIeltsSpeakingFullMockCatalog().map((entry) => entry.id),
  }
  for (const [skill, ids] of Object.entries(catalogs)) {
    assert.equal(ids.length, 30)
    ids.forEach((id, index) => {
      const vocabulary = getIeltsTestVocabulary(id)!
      assert.ok(vocabulary, `${skill} ${id} has vocabulary`)
      assert.equal(vocabulary.test.sourceTestId, id)
      assert.equal(vocabulary.href, `/vocabulary/ielts?skill=${skill}&test=${index + 1}`)
      assert.ok(vocabulary.wordCount > 0)
    })
  }
  assert.equal(getIeltsTestVocabulary('speaking-day-1'), null, 'Daily questions must not link to an unrelated full mock')
  assert.equal(getIeltsTestVocabulary('missing-test'), null)
  assert.equal(speakingVocabularyTestId('Speaking Full Mock 23'), 'speaking-full-23')
  assert.equal(speakingVocabularyTestId('Speaking Full Test 23'), '')
  console.log('PASS: all 120 live full tests resolve their exact vocabulary')

  clear()
  const cards = (testId: string) => <><TestVocabulary testId={testId} variant="reminder" /><TestVocabulary testId={testId} variant="link" /><TestVocabulary testId={testId} variant="review" /></>
  await render(cards(catalogs.listening[0]))
  assert.ok(reminder())
  await click(container.querySelector('[aria-label="Dismiss for now"]'))
  assert.equal(reminder(), null)
  assert.ok(link())
  await render(cards(catalogs.listening[0]))
  assert.equal(reminder(), null, 'Temporary dismissal survives returning to the same test')
  await render(cards(catalogs.reading[0]))
  assert.ok(reminder(), 'Temporary dismissal does not suppress another test')
  await click([...container.querySelectorAll('button')].find((button) => button.textContent === 'Never show reminders again')!)
  for (const ids of Object.values(catalogs)) {
    await render(cards(ids[1]))
    assert.equal(reminder(), null, 'Never show covers all four skills')
    assert.ok(link(), 'Permanent practice link survives suppression')
    assert.ok(container.querySelector('[data-test-vocabulary="review"]'), 'Review is never suppressed')
  }
  await act(async () => useAuthStore.setState({ user: { id: 'another-learner' } as never }))
  assert.ok(reminder(), 'Preferences are scoped to the learner')
  await act(async () => useAuthStore.setState({ user: null }))
  console.log('PASS: dismissal scope, learner preferences and persistent links')

  clear()
  const storagePrototype = Object.getPrototypeOf(window.sessionStorage)
  const setItem = storagePrototype.setItem
  try {
    storagePrototype.setItem = () => { throw new Error('Storage quota exceeded') }
    await render(cards(catalogs.listening[0]))
    await click(container.querySelector('[aria-label="Dismiss for now"]'))
    assert.equal(reminder(), null, 'Dismiss works even if preferences cannot be stored')
    assert.ok(link())
  } finally { storagePrototype.setItem = setItem }

  clear()
  for (const skill of ['listening', 'reading'] as const) {
    const test = resolveIeltsTestById(catalogs[skill][0])!
    await render(<IELTSReadingInterface test={test} onComplete={() => {}} onExit={() => {}} />)
    assert.ok(reminder())
    assert.equal(link().getAttribute('href'), getIeltsTestVocabulary(test.id)!.href)
    assert.equal(link().target, '_blank')
    await act(async () => link().dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true })))
    assert.doesNotMatch(container.textContent!, /Practice Setup/, 'Vocabulary click must not launch practice')
    await render(<IELTSReadingInterface test={test} onComplete={() => {}} onExit={() => {}} reviewPayload={{ result: { testId: test.id, answers: {}, score: 0, totalQuestions: 40, correctAnswers: 0, completedAt: new Date().toISOString() } as never }} />)
    assert.equal(reminder(), null)
    assert.ok(container.querySelector('[data-test-vocabulary="review"]'))
  }
  const writing = getWritingFullTestCatalog()[0]
  await render(<IELTSWritingFullTestInterface fullTest={writing} onExit={() => {}} />)
  assert.ok(reminder())
  assert.ok(link())
  assert.equal(container.querySelector('button a'), null, 'Vocabulary links cannot nest inside mode buttons')
  await render(<Routes><Route path="/speaking/:id" element={<IELTSSpeakingTest />} /></Routes>, '/speaking/speaking-full-1')
  await wait(2000)
  assert.ok(reminder())
  assert.ok(link())
  await click([...container.querySelectorAll('button')].find((button) => button.textContent === 'Launch Final Simulation')!)
  assert.equal(container.querySelector('[data-test-vocabulary]'), null, 'Simulation preflight must not show vocabulary')
  console.log('PASS: all four skill launch screens and objective review')

  // Deep links select the correct source test even when Reading uses regrouped numbering.
  for (const skill of Object.keys(catalogs) as (keyof typeof catalogs)[]) {
    const vocabulary = getIeltsTestVocabulary(catalogs[skill][12])!
    await render(<IeltsVocabularyStudio />, vocabulary.href)
    assert.ok(container.textContent!.includes(vocabulary.test.title))
    assert.ok(container.textContent!.includes(vocabulary.test.sections[0].entries[0].term))
    assert.ok([...container.querySelectorAll('a')].some((anchor) => anchor.getAttribute('href')?.includes(`/${vocabulary.test.id}/`)), 'Activities use the selected test')
  }
  console.log('PASS: vocabulary deep links open the selected full test and activities')

  clear()
  const mock = getFullMockById('full-mock-1')
  assert.ok(mock)
  for (const section of mock.sections) {
    const testId = section.launchPath!.split('/').pop()!
    await act(async () => saveFullMockSectionResult(mock.id, section.key, { testId, band: 6, summary: 'Completed', completedAt: new Date().toISOString() }))
    await render(<Routes><Route path="/mock/:mockId" element={<MockIELTSRun />} /></Routes>, `/mock/${mock.id}`)
    const reviews = container.querySelectorAll('[data-test-vocabulary="review"]')
    assert.equal(reviews.length, section.key === 'speaking' ? 4 : 0, 'Full mock vocabulary unlocks only after all four sections')
  }
  console.log('PASS: full mock review unlocks vocabulary after the entire exam')
  if (root) await act(async () => root!.unmount())
}
