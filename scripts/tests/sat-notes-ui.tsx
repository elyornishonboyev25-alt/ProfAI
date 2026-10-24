import React, { act } from 'react'
import assert from 'node:assert/strict'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import SATMockRun from '../../src/pages/SATMockRun'
import { getSATSectionTest } from '../../src/features/sat/catalog'
import { createSATAttempt } from '../../src/features/sat/practiceTest4'
import { loadSATAttempt, saveSATAttempt, loadSATAttemptHistory, saveSATAttemptToHistory } from '../../src/features/sat/attemptStorage'
import { readSATNotes } from '../../src/features/sat/notes'
import { useAuthStore } from '../../src/store/authStore'
import '../../src/i18n'

export async function run() {
  localStorage.clear()
  useAuthStore.setState({ user: null })
  const test = getSATSectionTest('1', null)
  const attempt = createSATAttempt(test.id, test.modules, 'practice')
  const first = test.modules[0].questions[0].id
  const second = test.modules[0].questions[1].id
  attempt.notes[first] = 'Existing legacy note'
  attempt.notes[second] = 'Other question note'
  saveSATAttempt(attempt)
  const container = document.getElementById('root')!
  let root = createRoot(container)
  const render = async () => act(async () => root.render(
    <MemoryRouter initialEntries={['/sat/mock/1/run']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes><Route path="/sat/mock/:mockId/run" element={<SATMockRun />} /></Routes>
    </MemoryRouter>,
  ))
  const click = async (label: string) => {
    const node = [...container.querySelectorAll('button')].find(button => button.textContent?.trim() === label || button.getAttribute('aria-label') === label)
    assert.ok(node, `Missing button: ${label}`)
    await act(async () => node.click())
  }
  const type = async (value: string) => {
    const node = container.querySelector<HTMLTextAreaElement>('#sat-note-text')!
    assert.ok(node)
    await act(async () => {
      Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')!.set!.call(node, value)
      node.dispatchEvent(new Event('input', { bubbles: true }))
    })
  }
  await render()
  await click('Highlights & Notes')
  assert.match(container.textContent!, /Existing legacy note/, 'Popover shows saved text without editing')
  await click('Manage notes (1)')
  assert.equal(container.querySelector('textarea'), null, 'Opening notes shows cards rather than an editor')
  await click('Add note')
  assert.equal([...container.querySelectorAll('button')].find(button => button.textContent === 'Save note')!.disabled, true)
  await type('Second note\nwith a new line')
  await click('Save note')
  assert.match(container.querySelector('[aria-labelledby="sat-note-title"]')!.textContent!, /Existing legacy note.*Second note/s)
  assert.equal(readSATNotes(loadSATAttempt(test.id)!.notes[first]).length, 2)
  await click('Edit note 1')
  await type('Updated first note')
  await click('Save note')
  assert.deepEqual(readSATNotes(loadSATAttempt(test.id)!.notes[first]).map(note => note.text), ['Updated first note', 'Second note\nwith a new line'])
  await click('Add note')
  await type('Discarded draft')
  await click('Cancel')
  assert.equal(readSATNotes(loadSATAttempt(test.id)!.notes[first]).length, 2)
  await click('Close notes')
  await act(async () => root.unmount())
  root = createRoot(container)
  await render()
  await click('Highlights & Notes')
  assert.match(container.textContent!, /Updated first note.*Second note/s, 'All notes survive reload')
  await click('Manage notes (2)')
  await click('Delete note 1')
  assert.deepEqual(readSATNotes(loadSATAttempt(test.id)!.notes[first]).map(note => note.text), ['Second note\nwith a new line'])
  assert.equal(loadSATAttempt(test.id)!.notes[second], 'Other question note', 'Edits are scoped to their question')
  const saved = loadSATAttempt(test.id)!
  saved.status = 'submitted'
  saved.submittedAt = Date.now()
  saveSATAttemptToHistory(saved, 'submitted')
  assert.deepEqual(loadSATAttemptHistory()[0].attempt.notes[first], saved.notes[first])
  await act(async () => root.unmount())
  saveSATAttempt(saved)
  root = createRoot(container)
  await render()
  await act(async () => container.querySelector<HTMLButtonElement>('#sat-result-tab-questions')!.click())
  await act(async () => [...container.querySelectorAll<HTMLButtonElement>('.sr-review-view button')][1].click())
  assert.match(container.textContent!, /Your test-day notes.*Second note/s, 'Submitted review renders saved note cards')
  await act(async () => root.unmount())
  console.log('SAT notes: legacy compatibility, visible cards, multiple notes, edit, delete, cancel, reload, question isolation and submitted review passed.')
}
