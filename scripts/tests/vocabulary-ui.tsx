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
  .find((element) => element.textContent?.trim() === text) as HTMLButtonElement

async function click(element: HTMLElement | null | undefined) {
  assert.ok(element, 'Button must exist')
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
      await click([...container.querySelectorAll('button')].find((element) => element.querySelector('h2')?.textContent === 'SAT Vocabulary'))
    }
    assert.ok(button(backLabel))
    await click(button(backLabel))
    assert.match(container.textContent!, fromArena ? /SAT Arena destination/ : /Vocabulary Arena/)

    for (const mode of ['flashcards', 'matching', 'quiz', 'typing']) {
      await render(navigationRoutes, entry)
      if (!fromArena) {
        await click([...container.querySelectorAll('button')].find((element) => element.querySelector('h2')?.textContent === 'SAT Vocabulary'))
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
  console.log('UI passed: SAT catalog, save/source links, StrictMode matching + replay, flashcards, quiz accuracy, typing accuracy/no answer leak, XP failure + retry + profile update.')
}
