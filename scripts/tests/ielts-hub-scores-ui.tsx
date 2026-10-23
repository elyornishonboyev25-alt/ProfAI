import assert from 'node:assert/strict'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import IELTS from '@/pages/IELTS'
import { useAuthStore } from '@/store/authStore'
import type { AuthUser } from '@/types/platform'
import { accountStorageFor } from '@/utils/accountStorage'
import { saveFullMockSectionResult } from '@/utils/ieltsMockCatalog'
import { getIeltsHubScores } from '@/utils/ieltsHubScores'
import i18n from '@/i18n'

export async function run() {
  localStorage.clear()
  await i18n.changeLanguage('en')
  const owner = 'ielts-hub-test'
  useAuthStore.setState({ user: { id: owner } as AuthUser })
  const element = document.getElementById('root')!
  const root = createRoot(element)
  const storage = accountStorageFor(owner)
  const bands = () => [...element.querySelectorAll('button [aria-label^="Band "] strong')].map((node) => node.textContent)
  try {
    await act(async () => root.render(<MemoryRouter><IELTS /></MemoryRouter>))
    assert.deepEqual(bands(), ['—', '—', '—', '—'], 'missing results stay unscored')
    await act(async () => {
      saveFullMockSectionResult('full-mock-1', 'listening', { band: 7.5, completedAt: '2026-10-20T10:00:00Z', testId: 'listening-test' })
      saveFullMockSectionResult('full-mock-1', 'reading', { band: 6.5, completedAt: '2026-10-20T11:00:00Z', testId: 'reading-test' })
    })
    assert.deepEqual(bands(), ['7.5', '6.5', '—', '—'], 'mock sections appear without visiting Results or reloading')
    assert.ok(element.textContent?.includes('2/4 skills scored'))
    await act(async () => {
      // An older standalone result must not override a newer mock result.
      storage.setItem(`smarttest-reading-analysis-history-v1:${owner}`, JSON.stringify([
        { attemptKey: 'old-listening', testId: 'listening-test', testTitle: 'Listening', bandScore: 5, savedAt: '2026-10-19T10:00:00Z' },
        { attemptKey: 'new-reading', testId: 'reading-test', testTitle: 'Reading', bandScore: 8, savedAt: '2026-10-21T10:00:00Z' },
      ]))
      storage.setItem(`smarttest-writing-analysis-v1:${owner}`, JSON.stringify([
        { attemptKey: 'writing-task2', overallBand: 8, fullTest: { id: 'writing-full-1', overallBand: 7 }, savedAt: '2026-10-21T11:00:00Z' },
      ]))
    })
    assert.deepEqual(bands(), ['7.5', '8.0', '7.0', '—'], 'latest result wins and full Writing uses its combined band')
    await act(async () => saveFullMockSectionResult('full-mock-2', 'listening', { band: 0, completedAt: '2026-10-22T10:00:00Z', testId: 'blank-listening' }))
    assert.deepEqual(bands(), ['0.0', '8.0', '7.0', '—'], 'a scored zero remains visible')
    assert.ok(element.textContent?.includes('3/4 skills scored'))
    assert.deepEqual(getIeltsHubScores('another-account', []), { listening: null, reading: null, writing: null, speaking: null }, 'results belong only to their account')
    await act(async () => useAuthStore.setState({ user: { id: 'another-account' } as AuthUser }))
    assert.deepEqual(bands(), ['—', '—', '—', '—'], 'switching accounts clears all displayed bands')
    console.log('PASS: IELTS hub mock and standalone bands, live updates, latest result, combined Writing band, zero scores and account isolation')
  } finally {
    await act(async () => root.unmount())
    useAuthStore.setState({ user: null })
    localStorage.clear()
  }
}
