import React, { act, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import assert from 'node:assert/strict'
import { vocabularyCollections } from '../../src/data/vocabularyCollections'
import { FlashcardsActivity, MatchingActivity, QuizActivity, TypingActivity } from '../../src/components/vocab/activities'
import { SaveWordButton, WordSaveProvider } from '../../src/components/vocab/SaveWordButton'
import { getSavedWords } from '../../src/utils/myVocabularyStore'
import MyWordsVocabulary from '../../src/pages/MyWordsVocabulary'
import VocabularyActivity from '../../src/pages/VocabularyActivity'
import Vocabulary from '../../src/pages/Vocabulary'
import { apiClient } from '../../src/lib/apiClient'
import { useAuthStore } from '../../src/store/authStore'
import { normalizeVocabularyAnswer } from '../../src/utils/vocabularyAnswers'
import VocabularyExample from '../../src/components/vocab/VocabularyExample'

const satVocabularyPacks = vocabularyCollections.sat
const entries = satVocabularyPacks[0].sections[0].entries
const container = document.getElementById('root')!
let root: ReturnType<typeof createRoot>

async function render(node: React.ReactNode, path: string | { pathname: string; state: { from: string } } = '/') {
  if (root) await act(async () => root.unmount())
  root = createRoot(container)
  await act(async () => root.render(
    <StrictMode>
      <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        {node}
      </MemoryRouter>
    </StrictMode>,
  ))
}

const button = (text: string) => [...container.querySelectorAll('button')]
  .find((element) => element.textContent?.trim() === text || element.getAttribute('aria-label') === text) as HTMLButtonElement

async function click(element: HTMLElement | null | undefined) {
  assert.ok(element, `Button must exist; visible text: ${container.textContent?.slice(0, 600)}; links: ${[...container.querySelectorAll('a')].map((a) => a.getAttribute('href')).join(', ')}`)
  await act(async () => element.click())
}

async function wait(ms: number) {
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, ms)) })
}

async function matchAll() {
  for (let index = 0; index < entries.length; index++) {
    await click(button(entries[index].term))
    await click(button(entries[index].definition))
    if ((index + 1) % 6 === 0) await wait(660)
  }
}

export async function run() {
  assert.equal(normalizeVocabularyAnswer('  O‘BRIEN  '), normalizeVocabularyAnswer("o'brien"))
  assert.equal(normalizeVocabularyAnswer('well–known'), normalizeVocabularyAnswer('well-known'))
  assert.notEqual(normalizeVocabularyAnswer('habitat'), normalizeVocabularyAnswer('habbitat'))
  const firstListening = vocabularyCollections.ielts[0].tests[0].sections[0].entries
  assert.equal(firstListening.find((entry) => entry.term === 'availability')!.uzbek, 'mavjudlik')
  assert.ok(firstListening.find((entry) => entry.term === 'availability')!.exampleUzbek)
  const sourceEntry = { ...entries[0], example: 'Test extract ____', sourceExcerpt: 'Test extract ____' }
  await render(<VocabularyExample entry={sourceEntry} />)
  assert.match(container.textContent!, /From the test/)
  assert.doesNotMatch(container.textContent!, /Example sentence/)
  await render(<VocabularyExample entry={entries[0]} />)
  assert.match(container.textContent!, /Example sentence/)

  // Equal personal-word meanings are interchangeable in matching, and cannot
  // create duplicate choices or multiple correct buttons in a quiz.
  const equalEntries = [
    { ...entries[0], id: 'equal-a', term: 'first', definition: 'The same meaning.' },
    { ...entries[1], id: 'equal-b', term: 'second', definition: 'The same meaning.' },
  ]
  const equalCompletions: number[] = []
  await render(<MatchingActivity entries={equalEntries} rewardKey="equal-definitions" onComplete={(accuracy) => equalCompletions.push(accuracy)} />)
  const meaningButtons = () => [...container.querySelectorAll<HTMLButtonElement>('.vocab-matching-column:nth-child(2) button')]
  await click(button('first'))
  await click(meaningButtons()[1])
  assert.ok(meaningButtons()[1].disabled)
  assert.ok(!meaningButtons()[0].disabled)
  await click(button('second'))
  await click(meaningButtons()[0])
  assert.deepEqual(equalCompletions, [100])
  await render(<QuizActivity entries={equalEntries} />)
  assert.equal(container.querySelectorAll('.vocab-quiz-options button').length, 1)

  await render(<TypingActivity entries={[entries[0]]} />)
  await act(async () => container.querySelector('input')!.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true })))
  assert.ok(button('Check').disabled, 'Empty Enter does not submit a wrong answer')
  assert.doesNotMatch(container.textContent!, /Answer:/)
  window.localStorage.removeItem('smarttest_vocab_matching_rewards_v2')
  window.localStorage.removeItem('smarttest_vocab_diamond_bank_v1')

  const ieltsRoutes = <Routes>
    <Route path="/vocabulary/:track" element={<Vocabulary />} />
    <Route path="/vocabulary/ielts/:bookId/:testId/:sectionId" element={<VocabularyActivity />} />
    <Route path="/vocabulary/ielts/:bookId/:testId/:sectionId/:activity" element={<VocabularyActivity />} />
    <Route path="/vocabulary/my-words/:wordsContext" element={<MyWordsVocabulary />} />
  </Routes>
  for (const book of vocabularyCollections.ielts) {
    await render(ieltsRoutes, `/vocabulary/ielts?skill=${book.skill}`)
    assert.doesNotMatch(container.textContent!, /Reading Days|Day 1-30|Coming soon/)
    assert.equal(container.querySelectorAll('button[aria-label^="Open "]').length, 30)
    assert.equal(container.querySelector(`button[aria-label="Open ${book.tests[0].title}"]`)?.getAttribute('aria-expanded'), 'true')
    await click(container.querySelector(`button[aria-label="Open ${book.tests[29].title}"]`))
    assert.equal(container.querySelectorAll('button[aria-expanded="true"]').length, 1)
    assert.equal(container.querySelectorAll('button[aria-label^="View "]').length, book.tests[29].sections.length)
    await click(container.querySelector(`button[aria-label="Open ${book.tests[29].title}"]`))
    assert.equal(container.querySelectorAll('button[aria-label^="View "]').length, 0, 'Collapsing a test hides its sections')
    await click(container.querySelector(`button[aria-label="Open ${book.tests[29].title}"]`))
    assert.match(container.textContent!, new RegExp(book.tests[29].title))
    const selected = book.tests[29].sections[0]
    await click(container.querySelector(`button[aria-label="View ${book.tests[29].title} ${selected.title}"]`))
    assert.equal(container.querySelectorAll('button[aria-label^="Pronounce "]').length, selected.entries.length)
    if (book.skill === 'reading') {
      await click(button('Part 3'))
      assert.equal(container.querySelectorAll('button[aria-label^="Pronounce "]').length, 15)
      assert.ok(container.textContent!.includes(book.tests[29].sections[2].topic!))
      await click(button('Part 1'))
    }
    await click(container.querySelector(`button[aria-label="Save ${selected.entries[0].term} to My Words"]`))
    assert.equal(getSavedWords(book.skill).length, 1, 'Each skill saves to its own context')
    await click(container.querySelector('a[href*="/vocabulary/ielts/"]'))
    assert.equal(container.querySelectorAll('button[aria-label^="Pronounce "]').length, selected.entries.length)
    await click(container.querySelector('a[href$="/flashcards"]'))
    await click(button('I know it'))
    await wait(180)
    await click(container.querySelector(`a[href='/vocabulary/ielts/${book.id}/${book.tests[29].id}/${selected.id}']`))
    await click([...container.querySelectorAll('a')].find((link) => link.getAttribute('href') === `/vocabulary/ielts?skill=${book.skill}&test=30&part=1`))
    assert.ok(container.textContent!.includes(book.tests[29].title), 'Activity back navigation restores the selected test')
    await render(ieltsRoutes, `/vocabulary/my-words/${book.skill}`)
    assert.ok(container.textContent!.includes(selected.entries[0].term))
  }
  // Switch skills using the visible controls, clearing the selected test.
  await render(ieltsRoutes, '/vocabulary/ielts?skill=reading&test=30&part=3')
  await click(container.querySelector('button[aria-label="Writing"]'))
  assert.equal(container.querySelectorAll('button[aria-label^="Open Writing Full Test "]').length, 30)
  assert.equal(container.querySelectorAll('button[aria-label^="Pronounce "]').length, 0)
  await render(ieltsRoutes, '/vocabulary/ielts/reading_full_track/reading_full_test_1/reading_full_test_1_passage_1')
  assert.match(container.textContent!, /Reading Full Test 13/)
  assert.equal(container.querySelectorAll('button[aria-label^="Pronounce "]').length, 15)
  await render(ieltsRoutes, '/vocabulary/ielts/reading_days_track/reading_day_26/reading_day_26_passage_2')
  assert.match(container.textContent!, /Reading Full Test 10 · Part 3/)
  window.localStorage.clear()

  const origin = {
    label: 'SAT Full Mock 1 · English Module 1',
    path: '/vocabulary/sat/sat_full_mock_1/sat_full_mock_1_rw1',
  }
  await render(<Routes><Route path="/vocabulary/:track" element={<Vocabulary />} /></Routes>, '/vocabulary/sat')
  for (const pack of satVocabularyPacks) assert.ok(container.textContent!.includes(pack.title))
  assert.doesNotMatch(container.textContent!, /Rhetoric Foundations|Section 3/)
  assert.ok(button('Start Module 1'))
  assert.ok(button('Start Module 2'))

  const navigationRoutes = (
    <Routes>
      <Route path="/sat" element={<div>SAT Arena destination</div>} />
      <Route path="/vocabulary" element={<Vocabulary />} />
      <Route path="/vocabulary/:track" element={<Vocabulary />} />
      <Route path="/vocabulary/sat/:packId/:sectionId" element={<VocabularyActivity />} />
      <Route path="/vocabulary/sat/:packId/:sectionId/:activity" element={<VocabularyActivity />} />
    </Routes>
  )
  for (const fromArena of [true, false]) {
    const entry = fromArena ? { pathname: '/vocabulary/sat', state: { from: '/sat' } } : '/vocabulary'
    const backLabel = fromArena ? 'Back to SAT Arena' : 'Back to Vocabulary'
    await render(navigationRoutes, entry)
    if (!fromArena) {
      await click([...container.querySelectorAll('button')].find((element) => element.querySelector('h2')?.textContent?.trim() === 'SAT Vocabulary'))
    }
    assert.ok(button(backLabel))
    await click(button(backLabel))
    assert.match(container.textContent!, fromArena ? /SAT Arena destination/ : /Vocabulary Arena/)

    for (const mode of ['flashcards', 'matching', 'quiz', 'typing']) {
      await render(navigationRoutes, entry)
      if (!fromArena) {
        await click([...container.querySelectorAll('button')].find((element) => element.querySelector('h2')?.textContent?.trim() === 'SAT Vocabulary'))
      }
      await click(button('Start Module 1'))
      await click(container.querySelector(`a[href='${origin.path}/${mode}']`))
      if (mode === 'typing') {
        await click(container.querySelector("a[href='/vocabulary/sat']"))
      } else {
        await click(container.querySelector(`a[href='${origin.path}']`))
        await click(container.querySelector("a[href='/vocabulary/sat']"))
      }
      await click(button(backLabel))
      assert.match(container.textContent!, fromArena ? /SAT Arena destination/ : /Vocabulary Arena/)
    }
  }

  await render(
    <Routes><Route path="/vocabulary/sat/:packId/:sectionId" element={<VocabularyActivity />} /></Routes>,
    origin.path,
  )
  assert.equal(container.querySelectorAll('button[aria-label^="Save "]').length, 20, 'All module words must be saveable')

  await render(
    <WordSaveProvider value={{ context: 'sat', origin }}><SaveWordButton entry={entries[0]} /></WordSaveProvider>,
  )
  await click(button('Save to My Words'))
  assert.equal(getSavedWords('sat').length, 1)
  assert.ok(button('Saved to My Words').disabled)
  await render(<Routes><Route path="*" element={<MyWordsVocabulary />} /></Routes>)
  assert.match(container.textContent!, /SAT/)
  await render(
    <Routes><Route path="/vocabulary/my-words/:wordsContext" element={<MyWordsVocabulary />} /></Routes>,
    '/vocabulary/my-words/sat',
  )
  assert.match(container.textContent!, /From: SAT Full Mock 1 · English Module 1/)
  assert.ok(container.querySelector(`a[href='${origin.path}']`))

  let completions: number[] = []
  await render(
    <WordSaveProvider value={{ context: 'sat', origin }}>
      <MatchingActivity entries={entries} rewardKey="ui-matching" onComplete={(accuracy) => completions.push(accuracy)} />
    </WordSaveProvider>,
  )
  const saveHeart = container.querySelector<HTMLButtonElement>(`button[aria-label="Save ${entries[1].term} to My Words"]`)!
  assert.ok(saveHeart)
  assert.equal(saveHeart.textContent, '', 'Matching save controls must be icon-only')
  await click(saveHeart)
  assert.equal(getSavedWords('sat').length, 2)
  assert.ok(saveHeart.disabled)
  assert.equal(saveHeart.querySelector('svg')?.getAttribute('fill'), 'currentColor')
  assert.match(container.textContent!, /0 \/ 6/, 'Saving must not match a term')
  await matchAll()
  assert.deepEqual(completions, [100])
  assert.match(container.textContent!, /All groups matched/)
  const bank = window.localStorage.getItem('smarttest_vocab_diamond_bank_v1')
  assert.equal(bank, '9', 'Four groups plus the five-diamond completion bonus')
  completions = []
  await render(<MatchingActivity entries={entries} rewardKey="ui-matching" onComplete={(accuracy) => completions.push(accuracy)} />)
  await matchAll()
  assert.deepEqual(completions, [100], 'Replay still asks the server to reconcile XP')
  assert.equal(window.localStorage.getItem('smarttest_vocab_diamond_bank_v1'), bank)

  completions = []
  await render(<FlashcardsActivity entries={entries} masteryKey="ui-flashcards" onComplete={(accuracy) => completions.push(accuracy)} />)
  for (let index = 0; index < entries.length; index++) {
    await click(button('I know it'))
    await wait(180)
  }
  await click(button('I know it'))
  await wait(180)
  assert.deepEqual(completions, [100])

  completions = []
  await render(<QuizActivity entries={entries} onComplete={(accuracy) => completions.push(accuracy)} />)
  for (let index = 0; index < 10; index++) {
    const term = container.querySelector('h3 span')!.textContent!.replace(/[“”]/g, '')
    const entry = entries.find((item) => item.term === term)!
    if (index < 5) {
      await click(button(entry.definition))
    } else {
      await click([...container.querySelectorAll('button')].find((element) =>
        entries.some((item) => item.definition === element.textContent?.trim() && item.term !== term),
      ))
    }
    await click(button(index === 9 ? 'Finish' : 'Next'))
  }
  assert.deepEqual(completions, [50])

  completions = []
  await render(
    <WordSaveProvider value={{ context: 'sat', origin }}>
      <TypingActivity entries={entries} onComplete={(accuracy) => completions.push(accuracy)} />
    </WordSaveProvider>,
  )
  for (let index = 0; index < 10; index++) {
    assert.equal(container.querySelectorAll('button[aria-label^="Save "]').length, 0, 'Typing must not expose the answer via the save label')
    const entry = entries.find((item) => container.textContent!.includes(item.definition))!
    const input = container.querySelector('input')!
    await act(async () => {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!.call(input, index < 8 ? entry.term : 'wrong')
      input.dispatchEvent(new window.Event('input', { bubbles: true }))
    })
    await click(button('Check'))
    assert.ok(button('Save to My Words') || button('Saved to My Words'))
    await click(button(index === 9 ? 'Finish' : 'Next'))
  }
  assert.deepEqual(completions, [80])

  // Exercise real page submission, visible failure, retry, and profile update.
  // The transport is stubbed: these tests never write to a live user account.
  useAuthStore.setState({ user: { id: 'ui-user', xp: 0, level: 1 } as any })
  let calls = 0
  const requests: Array<{ eventKey: string }> = []
  apiClient.post = async (_path: any, body: any) => {
    requests.push(body)
    if (++calls === 1) throw new Error('offline')
    return { duplicate: false, xpEarned: 20, totalXp: 20, level: 1, currentStreak: 1 } as any
  }
  await render(
    <Routes><Route path="/vocabulary/sat/:packId/:sectionId/:activity" element={<VocabularyActivity />} /></Routes>,
    `${origin.path}/matching`,
  )
  await matchAll()
  assert.match(container.textContent!, /XP could not be saved/)
  await click(button('Retry XP'))
  assert.match(container.textContent!, /\+20 XP earned/)
  assert.equal(useAuthStore.getState().user!.xp, 20)
  assert.equal(useAuthStore.getState().user!.currentStreak, 1)
  assert.equal(requests.length, 2)
  assert.equal(requests[0].eventKey, requests[1].eventKey, 'Retry must reuse the idempotency key')
  await act(async () => root.unmount())
  console.log('UI passed: four IELTS skills, Full Tests 1–30, part counts, activity return paths, per-skill saved words, legacy Reading links, SAT catalog, matching + replay, flashcards, quiz, typing, XP failure + retry + profile update.')
}
