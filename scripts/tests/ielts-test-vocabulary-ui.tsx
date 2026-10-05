import React, { act, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import assert from 'node:assert/strict'
import TestVocabulary from '../../src/components/vocab/TestVocabulary'
import IELTSReadingInterface from '../../src/components/IELTSReadingInterface'
import IELTSWritingFullTestInterface from '../../src/components/IELTSWritingFullTestInterface'
import IELTSSpeakingTest from '../../src/pages/IELTSSpeakingTest'
import IeltsVocabularyStudio from '../../src/components/vocab/IeltsVocabularyStudio'
import VocabularyActivity from '../../src/pages/VocabularyActivity'
import MockIELTSRun from '../../src/pages/MockIELTSRun'
import { getIeltsTestVocabulary, getIeltsVocabularyReturnTo, getIeltsVocabularyTestPath, speakingVocabularyTestId, withVocabularyReturnTo } from '../../src/utils/ieltsTestVocabulary'
import { getIeltsFullTestCatalog, getIeltsReadingUnifiedCatalog } from '../../src/utils/ieltsTrackCatalog'
import { getIeltsSpeakingFullMockCatalog } from '../../src/utils/ieltsSpeakingCatalog'
import { getWritingFullTestCatalog } from '../../src/data/writingTestData'
import { resolveIeltsTestById } from '../../src/utils/ieltsTestCatalog'
import { getFullMockById, saveFullMockSectionResult } from '../../src/utils/ieltsMockCatalog'
import { useAuthStore } from '../../src/store/authStore'

const container = document.getElementById('root')!
let root: ReturnType<typeof createRoot> | null = null
async function render(node: React.ReactNode, path = '/', settle = true) {
  if (root) await act(async () => root!.unmount())
  root = createRoot(container)
  await act(async () => root!.render(<StrictMode><MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{node}</MemoryRouter></StrictMode>))
  if (settle) await wait(700)
}
const reminder = () => document.querySelector('[data-test-vocabulary="reminder"]')
const link = () => container.querySelector('[data-test-vocabulary="link"] a') as HTMLAnchorElement
const click = async (element: HTMLElement | null) => {
  assert.ok(element)
  await act(async () => element!.click())
}
const clear = () => { window.localStorage.clear(); window.sessionStorage.clear() }
const wait = async (ms: number) => act(async () => { await new Promise((resolve) => setTimeout(resolve, ms)) })
function ReturnedTest() {
  const location = useLocation()
  return <p data-returned-test>{location.pathname}{location.search}{location.hash}</p>
}

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

  for (const unsafe of ['https://example.com', '//example.com', '/vocabulary/ielts', '/test/listening/missing-test', '/test/listening/ielts-listening-1\\evil']) {
    assert.equal(getIeltsVocabularyReturnTo(unsafe), null)
  }

  clear()
  const cards = (testId: string) => <><TestVocabulary testId={testId} variant="reminder" /><TestVocabulary testId={testId} variant="link" /><TestVocabulary testId={testId} variant="review" /></>
  await render(cards(catalogs.listening[0]), '/', false)
  assert.equal(reminder(), null, 'Reminder waits until after entering the test')
  await wait(700)
  assert.ok(reminder())
  await render(<TestVocabulary testId={catalogs.listening[0]} variant="reminder" ready={false} />)
  assert.equal(reminder(), null, 'Loading screens do not show reminders')
  await render(cards(catalogs.listening[0]))
  assert.ok(reminder())
  await click(document.querySelector('[aria-label="Dismiss for now"]'))
  assert.equal(reminder(), null)
  assert.ok(link())
  await render(cards(catalogs.listening[0]))
  assert.equal(reminder(), null, 'Temporary dismissal survives returning to the same test')
  await render(cards(catalogs.reading[0]))
  assert.ok(reminder(), 'Temporary dismissal does not suppress another test')
  await click([...document.querySelectorAll('button')].find((button) => button.textContent === 'Never show reminders again')!)
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
    await click(document.querySelector('[aria-label="Dismiss for now"]'))
    assert.equal(reminder(), null, 'Dismiss works even if preferences cannot be stored')
    assert.ok(link())
  } finally { storagePrototype.setItem = setItem }

  clear()
  for (const skill of ['listening', 'reading'] as const) {
    const test = resolveIeltsTestById(catalogs[skill][0])!
    await render(<IELTSReadingInterface test={test} onComplete={() => {}} onExit={() => {}} />)
    assert.ok(reminder(), `${skill}: reminder is visible after entering the launch screen`)
    assert.equal(link().getAttribute('href'), withVocabularyReturnTo(getIeltsTestVocabulary(test.id)!.href, getIeltsVocabularyTestPath(test.id, skill)))
    assert.equal(link().target, '_blank')
    await act(async () => link().dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true })))
    assert.doesNotMatch(container.textContent!, /Practice Setup/, 'Vocabulary click must not launch practice')
    await render(<IELTSReadingInterface test={test} onComplete={() => {}} onExit={() => {}} reviewPayload={{ result: { testId: test.id, answers: {}, score: 0, totalQuestions: 40, correctAnswers: 0, completedAt: new Date().toISOString() } as never }} />)
    assert.equal(reminder(), null)
    assert.ok(container.querySelector('[data-test-vocabulary="review"]'))
  }
  const writing = getWritingFullTestCatalog()[0]
  await render(<IELTSWritingFullTestInterface fullTest={writing} onExit={() => {}} />)
  assert.ok(reminder(), 'Writing reminder is visible after entering the launch screen')
  assert.ok(link())
  assert.equal(container.querySelector('button a'), null, 'Vocabulary links cannot nest inside mode buttons')
  await render(<Routes><Route path="/speaking/:id" element={<IELTSSpeakingTest />} /></Routes>, '/speaking/speaking-full-1')
  await wait(2700)
  await wait(700)
  assert.ok(reminder(), 'Speaking reminder appears after the preparation screen finishes')
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

  for (const skill of Object.keys(catalogs) as (keyof typeof catalogs)[]) {
    const testId = catalogs[skill][12]
    const vocabulary = getIeltsTestVocabulary(testId)!
    const returnTo = `${getIeltsVocabularyTestPath(testId, skill)}?assignmentId=lesson-13#setup`
    await render(cards(testId), returnTo)
    const href = link().getAttribute('href')!
    assert.equal(href, withVocabularyReturnTo(vocabulary.href, returnTo))
    await render(<Routes>
      <Route path="/vocabulary/ielts" element={<IeltsVocabularyStudio />} />
      <Route path="/vocabulary/ielts/:bookId/:testId/:sectionId" element={<VocabularyActivity />} />
      <Route path="/vocabulary/ielts/:bookId/:testId/:sectionId/:activity" element={<VocabularyActivity />} />
      <Route path="/test/:skill/:id" element={<ReturnedTest />} />
      <Route path="/ielts/:skill/test/:id" element={<ReturnedTest />} />
    </Routes>, href)
    const back = () => container.querySelector('[data-vocabulary-test-return]') as HTMLAnchorElement
    assert.equal(back().getAttribute('href'), returnTo, `${skill}: returns to source test with query and hash`)
    if (vocabulary.test.sections.length > 1) {
      await click(container.querySelectorAll('[aria-label="Vocabulary sections"] button')[1] as HTMLElement)
      assert.equal(back().getAttribute('href'), returnTo, 'Section changes retain the original test')
    }
    await click([...container.querySelectorAll('a')].find((anchor) => anchor.textContent === 'Practise this set')!)
    assert.equal(back().getAttribute('href'), returnTo, 'Activity picker retains the original test')
    const activityLinks = [...container.querySelectorAll('a')].filter((anchor) => /\/(flashcards|matching|quiz|typing)\?/.test(anchor.getAttribute('href') ?? ''))
    assert.equal(activityLinks.length, 4)
    for (const anchor of activityLinks) assert.ok(anchor.getAttribute('href')!.endsWith(`returnTo=${encodeURIComponent(returnTo)}`))
    await click(activityLinks[0])
    assert.equal(back().getAttribute('href'), returnTo, 'Study activities retain the original test')
    await click([...container.querySelectorAll('a')].find((anchor) => anchor.textContent!.trim() === 'Activities')!)
    assert.equal(back().getAttribute('href'), returnTo, 'Returning from an activity retains the original test')
    await click(back())
    assert.equal(container.querySelector('[data-returned-test]')?.textContent, returnTo, 'An unavailable original tab falls back to the exact test route')
  }
  await render(<IeltsVocabularyStudio />, '/vocabulary/ielts?skill=listening&test=1&returnTo=https%3A%2F%2Fexample.com')
  assert.equal(container.querySelector('[data-vocabulary-test-return]'), null, 'External return URLs are rejected')
  console.log('PASS: all four skills keep their exact source test across sections, activity pickers and study drills')

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
