import assert from 'node:assert/strict'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import ResumeIeltsAttempts from '@/components/ielts/ResumeIeltsAttempts'
import IELTSReadingInterface from '@/components/IELTSReadingInterface'
import { listeningMapLayoutFor } from '@/components/ielts/listeningMapLayouts'
import { mockListeningTests } from '@/data/listeningPassages'
import { accountStorageFor } from '@/utils/accountStorage'
import { discardIeltsAttempt, getIeltsAttemptResumes, saveIeltsAttemptResume } from '@/utils/ieltsAttemptResume'
import { readTestAudio, saveTestAudio } from '@/utils/testAudioStorage'
import { textOffsets, textRange } from '@/utils/textRanges'
import i18n from '@/i18n'

export async function run() {
  await i18n.changeLanguage('en')
  localStorage.clear()
  const host = document.getElementById('root')!
  let root = createRoot(host)
  const storage = accountStorageFor('guest')
  const reset = async () => { await act(async () => root.unmount()); root = createRoot(host) }
  try {
    const renderBoundary = (revision: number) => act(async () => root.render(<ErrorBoundary resetKey={revision}><input aria-label="Retained answer" defaultValue="draft" /></ErrorBoundary>))
    await renderBoundary(0)
    const input = host.querySelector('input')!
    input.focus(); input.value = 'newest answer'
    for (let revision = 1; revision < 6; revision++) await renderBoundary(revision)
    assert.equal(host.querySelector('input'), input, 'Account synchronization retains the mounted test')
    assert.equal(document.activeElement, input)
    assert.equal(input.value, 'newest answer')
    console.log('PASS: repeated account updates retain the workspace, input identity, focus and newest answer')

    await reset()
    const key = 'profai:writing:draft:guest:deletion-test:session'
    const attempt = { sessionKey: key, title: 'Delete me', pathname: '/ielts/writing/test/deletion-test', search: '', state: null }
    storage.setItem(key, JSON.stringify({ phase: 'writing', answers: { one: 'draft' }, audioKey: 'discarded-recording' }))
    storage.setItem(key.slice(0, -8), 'legacy essay')
    storage.setItem(`${key}:paper`, JSON.stringify({ sections: [{ id: 'part' }] }))
    storage.setItem(`${key}:annotations:part`, 'notes')
    storage.setItem(`${key}:annotations:part:scroll`, 'position')
    storage.setItem('completed-results', 'keep completed history')
    accountStorageFor('another-account').setItem(key, 'other account draft')
    await saveTestAudio('guest', 'discarded-recording:0', new Blob(['discard']))
    await saveTestAudio('guest', 'retained-recording:0', new Blob(['keep']))
    saveIeltsAttemptResume('guest', attempt)
    await act(async () => root.render(<MemoryRouter><ResumeIeltsAttempts /></MemoryRouter>))
    const remove = () => host.querySelector<HTMLButtonElement>('[aria-label="Delete unfinished test: Delete me"]')!
    await act(async () => remove().click())
    let dialog = document.querySelector('[role="alertdialog"]')!
    assert.ok(dialog.textContent?.includes('permanently deleted'))
    assert.ok(storage.getItem(key), 'Opening the warning does not delete anything')
    await act(async () => [...dialog.querySelectorAll('button')].find(button => button.textContent === 'Cancel')!.click())
    assert.equal(document.querySelector('[role="alertdialog"]'), null)
    assert.ok(storage.getItem(key), 'Cancel preserves the entire attempt')
    assert.equal(document.activeElement, remove())
    await act(async () => remove().click())
    dialog = document.querySelector('[role="alertdialog"]')!
    await act(async () => { [...dialog.querySelectorAll('button')].find(button => button.textContent === 'Delete test')!.click(); await new Promise(resolve => setTimeout(resolve, 80)) })
    for (const removed of [key, key.slice(0, -8), `${key}:paper`, `${key}:annotations:part`, `${key}:annotations:part:scroll`]) assert.equal(storage.getItem(removed), null)
    assert.equal(host.querySelector('a'), null, 'The Resume card disappears')
    assert.equal(getIeltsAttemptResumes('guest').length, 0)
    assert.equal(accountStorageFor('another-account').getItem(key), 'other account draft')
    assert.equal(storage.getItem('completed-results'), 'keep completed history')
    assert.equal(await readTestAudio('guest', 'discarded-recording:0'), null)
    assert.ok(await readTestAudio('guest', 'retained-recording:0'))
    storage.setItem('day-session', JSON.stringify({ finished: true }))
    saveIeltsAttemptResume('guest', { ...attempt, sessionKey: 'day-session', pathname: '/ielts/speaking/test/day' })
    assert.equal(getIeltsAttemptResumes('guest').length, 0, 'Completed Speaking days never become Resume cards')
    await discardIeltsAttempt('another-account', 'unknown')
    console.log('PASS: Resume deletion warning, cancel/focus, confirmed removal, annotations/audio cleanup, completed history and account isolation')

    let maps = 0
    for (const test of mockListeningTests) for (const [index, section] of test.sections.entries()) {
      const image = section.groups?.flatMap(group => group.blocks).find(block => block.kind === 'image' && listeningMapLayoutFor(block.src, block.alt))
      if (!image || image.kind !== 'image') continue
      const layout = listeningMapLayoutFor(image.src, image.alt)!
      const sessionKey = `ielts_test_session_${test.id}`
      const first = section.questions.find(question => question.number === layout.numbers[0])!
      storage.setItem(sessionKey, JSON.stringify({ isTestActive: true, testMode: 'practice', selectedParts: [index], partsSelectionVersion: 2, timeRemaining: -1, answers: {} }))
      await reset()
      await act(async () => root.render(<MemoryRouter><IELTSReadingInterface test={test} onExit={() => {}} onComplete={() => {}} /></MemoryRouter>))
      assert.ok(host.querySelector('.source-map'), `${test.id}: map overlay renders in the actual runner`)
      for (const number of layout.numbers) {
        const question = section.questions.find(item => item.number === number)!
        assert.equal(host.querySelectorAll(`[id="question-card-${question.id}"]`).length, 1, 'Each map question has exactly one navigation anchor')
      }
      if (layout.kind === 'locations') {
        assert.equal(host.querySelectorAll('[data-map-question-key]').length, layout.numbers.length)
        await act(async () => host.querySelector<HTMLButtonElement>(`[data-map-question-key="${first.id}"]`)!.click())
        await act(async () => host.querySelector<HTMLInputElement>(`[data-map-location-input="${layout.points[0].label}"]`)!.focus())
      } else {
        const input = host.querySelector<HTMLInputElement>(`[data-map-question="${first.id}"]`)!
        await act(async () => {
          input.focus()
          Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'B')
          input.dispatchEvent(new Event('input', { bubbles: true }))
        })
      }
      await act(async () => window.dispatchEvent(new Event('pagehide')))
      const answer = JSON.parse(storage.getItem(sessionKey)!).answers[first.id]
      assert.equal(answer, layout.kind === 'locations' ? layout.points[0].label : 'B')
      maps++
    }
    assert.equal(maps, 9, 'Every remaining map uses the same in-map answer interaction')
    console.log('PASS: all nine additional Listening maps retain one answer surface, navigation anchors and persisted in-map answers')

    const text = document.createElement('div')
    text.innerHTML = 'Before <svg data-annotation-ignore><text>Map label</text></svg>after'
    const range = document.createRange(); range.selectNodeContents(text.lastChild!)
    assert.deepEqual(textOffsets(text, range), { start: 7, end: 12 })
    assert.equal(textRange(text, 7, 12)?.toString(), 'after', 'Original annotation offsets ignore added map labels')
  } finally { await act(async () => root.unmount()); localStorage.clear() }
}
