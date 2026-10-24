import assert from 'node:assert/strict'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import MockIELTS from '@/pages/MockIELTS'
import FullMockSectionGate from '@/components/ielts/FullMockSectionGate'
import { getFullMockById, getFullMockCompletedSections, getFullMockResults, saveFullMockSectionResult } from '@/utils/ieltsMockCatalog'
import { accountStorageFor } from '@/utils/accountStorage'
import { useAuthStore } from '@/store/authStore'

export async function run() {
  localStorage.clear()
  const element = document.getElementById('root')!
  const root = createRoot(element)
  const mock = getFullMockById('full-mock-1')!
  const storage = accountStorageFor('guest')
  let state: unknown
  function Runner() { state = useLocation().state; return <div data-runner>Fresh test</div> }
  try {
    for (const item of mock.sections) {
      saveFullMockSectionResult(mock.id, item.key, { band: 7, testId: item.launchPath!.split('/').pop()!, completedAt: '2026-10-12' })
      storage.setItem(`profai:full-mock:intro:v1:${mock.id}:${item.key}`, 'started')
    }
    saveFullMockSectionResult('full-mock-2', 'listening', { band: 8, testId: 'untouched', completedAt: '2026-10-12' })
    const listeningId = mock.sections[0].launchPath!.split('/').pop()!
    const readingId = mock.sections[1].launchPath!.split('/').pop()!
    const writingId = mock.sections[2].launchPath!.split('/').pop()!
    const listeningKey = `ielts_test_session_${listeningId}:mock:${mock.id}`
    storage.setItem(listeningKey, JSON.stringify({ isTestActive: true, audioDone: true, audioFinishedAt: Date.now() - 120000, answers: { old: 'Answer' } }))
    storage.setItem(`ielts_test_session_${readingId}:mock:${mock.id}`, JSON.stringify({ isTestActive: true, deadline: Date.now() - 1000 }))
    storage.setItem(`profai:writing:draft:guest:${writingId}:mock:${mock.id}:session`, 'old-deadline')
    storage.setItem(`ielts_test_session_${listeningId}`, 'standalone-session')
    accountStorageFor('another-account').setItem('smarttest:full-mock-results:v1', 'other-account-results')
    await act(async () => root.render(<MemoryRouter initialEntries={['/mock/ielts']}><Routes>
      <Route path="/mock/ielts" element={<MockIELTS embedded />} />
      <Route path="/test/:type/:id" element={<FullMockSectionGate><Runner /></FullMockSectionGate>} />
    </Routes></MemoryRouter>))
    const completedCard = element.querySelector('.mock-ielts-glass-card')!
    assert.equal(completedCard.tagName, 'ARTICLE', 'No invalid nested interactive buttons')
    assert.equal(completedCard.querySelector('[aria-label="Review Full Mock 1"]'), null, 'Completed cards launch a retake; review belongs in Mistake Lab')
    assert.ok(completedCard.textContent?.includes('4/4 completed'))
    const retake = completedCard.querySelector<HTMLButtonElement>('[aria-label="Retake Full Mock 1"]')!
    assert.ok(retake)
    await act(async () => retake.click())
    assert.ok(element.querySelector('video'), 'Retake returns to Listening instructions')
    assert.equal(element.querySelector('[data-runner]'), null, 'Retake does not consume exam time before Start')
    assert.deepEqual(getFullMockCompletedSections(mock.id), [])
    assert.equal(getFullMockResults('full-mock-2').listening?.band, 8)
    assert.equal(storage.getItem(listeningKey), null, 'Previous final-audio countdown cannot submit a retake')
    assert.equal(storage.getItem(`ielts_test_session_${readingId}:mock:${mock.id}`), null)
    assert.equal(storage.getItem(`profai:writing:draft:guest:${writingId}:mock:${mock.id}:session`), null)
    assert.equal(storage.getItem(`ielts_test_session_${listeningId}`), 'standalone-session')
    assert.equal(accountStorageFor('another-account').getItem('smarttest:full-mock-results:v1'), 'other-account-results')
    const history = JSON.parse(storage.getItem(`smarttest:full-mock-history:v1:${mock.id}`)!)
    assert.equal(history.length, 1)
    assert.equal(history[0].overallBand, 7)
    assert.equal(Object.keys(history[0].sections).length, 4)
    await act(async () => element.querySelector<HTMLButtonElement>('.full-mock-intro-start')!.click())
    assert.equal((state as { mock: { section: string } }).mock.section, 'listening')
    console.log('PASS: Retake archives all four scores, clears only the selected mock, resets expired timers and intro gates, preserves practice and other accounts')
  } finally { await act(async () => root.unmount()); localStorage.clear(); useAuthStore.setState({ user: null }) }
}
