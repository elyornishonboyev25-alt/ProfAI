import React, { act } from 'react'
import assert from 'node:assert/strict'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, useLocation } from 'react-router-dom'
import SATSectionTabs from '../../src/components/sat/SATSectionTabs'
import { getSATSectionTest, SAT_TEST_CATALOG } from '../../src/features/sat/catalog'
import { createSATAttempt } from '../../src/features/sat/practiceTest4'
import { loadSATAttempt, saveSATAttempt } from '../../src/features/sat/attemptStorage'
import { useAuthStore } from '../../src/store/authStore'

const container = document.getElementById('root')!
function Location() {
  const location = useLocation()
  return <output data-location>{location.pathname}{location.search}</output>
}

export async function run() {
  localStorage.clear()
  useAuthStore.setState({ user: { id: 'sat-resume-user' } as never })
  const root = createRoot(container)
  const originalConfirm = window.confirm
  const refresh = async () => act(async () => { await new Promise(resolve => setTimeout(resolve, 100)) })
  const links = () => [...container.querySelectorAll<HTMLAnchorElement>('aside[aria-label="Unfinished SAT tests"] a')]
  try {
    await act(async () => root.render(<MemoryRouter initialEntries={['/sat/math']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SATSectionTabs section="math" /><Location /></MemoryRouter>))
    assert.equal(links().length, 0, 'No resume banner before starting a test')

    const full = SAT_TEST_CATALOG[1]
    const math = getSATSectionTest(2, 'math')
    const reading = getSATSectionTest(3, 'reading-writing')
    const attempts = [full, math, reading].map(test => createSATAttempt(test.id, test.modules, 'practice'))
    attempts[1].answers[math.modules[0].questions[0].id] = '42'
    attempts[1].currentQuestionIndex = 3
    attempts.forEach(attempt => saveSATAttempt(attempt))
    const finished = createSATAttempt(SAT_TEST_CATALOG[4].id, SAT_TEST_CATALOG[4].modules, 'practice')
    saveSATAttempt({ ...finished, status: 'submitted', submittedAt: Date.now() })
    const terminated = createSATAttempt(SAT_TEST_CATALOG[5].id, SAT_TEST_CATALOG[5].modules, 'exam')
    saveSATAttempt({ ...terminated, status: 'terminated' })
    await refresh()
    assert.equal(links().length, 3, 'Only active attempts appear, including all section types')
    assert.deepEqual(new Set(links().map(link => link.getAttribute('href'))), new Set([
      '/sat/mock/1/run', '/sat/mock/2/run?section=math', '/sat/mock/3/run?section=reading-writing',
    ]))
    assert.ok(container.querySelector('aside')!.compareDocumentPosition(container.querySelector('[role="tablist"]')!) & Node.DOCUMENT_POSITION_FOLLOWING, 'Resume appears above the section tabs')
    await act(async () => links().find(link => link.textContent === 'Resume · SAT Math 2')!.click())
    assert.equal(container.querySelector('[data-location]')!.textContent, '/sat/mock/2/run?section=math')
    assert.equal(loadSATAttempt(math.id)!.answers[math.modules[0].questions[0].id], '42')
    assert.equal(loadSATAttempt(math.id)!.currentQuestionIndex, 3, 'Resume preserves the saved question')

    window.confirm = () => false
    const dismiss = () => container.querySelector<HTMLButtonElement>('[aria-label="Delete unfinished test: SAT Math 2"]')!
    await act(async () => dismiss().click())
    assert.ok(loadSATAttempt(math.id), 'Cancelling keeps saved progress')
    window.confirm = () => true
    await act(async () => dismiss().click())
    await refresh()
    assert.equal(loadSATAttempt(math.id), null)
    assert.equal(links().length, 2)
    assert.ok(loadSATAttempt(full.id), 'Removing one attempt preserves the others')
    await act(async () => useAuthStore.setState({ user: { id: 'another-sat-user' } as never }))
    assert.equal(links().length, 0, 'Other accounts cannot see the saved attempts')
    await act(async () => useAuthStore.setState({ user: { id: 'sat-resume-user' } as never }))
    assert.equal(links().length, 2, 'Returning to the owner restores their resume buttons')
    console.log('SAT resume: empty state, active statuses, section URLs, saved progress, dismissal and account isolation passed.')
  } finally {
    window.confirm = originalConfirm
    await act(async () => root.unmount())
  }
}
