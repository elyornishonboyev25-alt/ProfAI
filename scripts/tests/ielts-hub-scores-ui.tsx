import assert from 'node:assert/strict'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import IELTS from '@/pages/IELTS'
import { useAuthStore } from '@/store/authStore'
import { useSpeakingStore, type SpeakingSessionRecord } from '@/store/speakingStore'
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
  const bands = () => [...element.querySelectorAll('h2')]
    .filter((node) => node.textContent?.startsWith('IELTS '))
    .map((node) => node.closest('button')?.querySelector('[aria-label^="Band "] strong')?.textContent ?? null)
  const assertFirstTests = (skills: string[]) => {
    for (const skill of ['Listening', 'Reading', 'Writing', 'Speaking']) {
      assert.equal(element.textContent?.includes(`Start your first ${skill} test`), skills.includes(skill))
    }
  }
  try {
    await act(async () => root.render(<MemoryRouter><IELTS /></MemoryRouter>))
    assert.deepEqual(bands(), [null, null, null, null], 'missing results stay unscored')
    assertFirstTests(['Listening', 'Reading', 'Writing', 'Speaking'])
    await act(async () => {
      saveFullMockSectionResult('full-mock-1', 'listening', { band: 7.5, completedAt: '2026-10-20T10:00:00Z', testId: 'listening-test' })
      saveFullMockSectionResult('full-mock-1', 'reading', { band: 6.5, completedAt: '2026-10-20T11:00:00Z', testId: 'reading-test' })
    })
    assert.deepEqual(bands(), ['7.5', '6.5', null, null], 'mock sections appear without visiting Results or reloading')
    assertFirstTests(['Writing', 'Speaking'])
    assert.ok(element.textContent?.includes('2/4 skills scored'))
    assert.ok(element.querySelector('[aria-label="Overall 7.0"]'), 'unplayed skills are excluded from the average')
    await act(async () => {
      // The best score wins regardless of date or storage order.
      storage.setItem(`smarttest-reading-analysis-history-v1:${owner}`, JSON.stringify([
        { attemptKey: 'old-listening', testId: 'listening-test', testTitle: 'Listening', bandScore: 8, savedAt: '2026-10-19T10:00:00Z' },
        { attemptKey: 'new-listening', testId: 'listening-test', testTitle: 'Listening', bandScore: 5, savedAt: '2026-10-21T10:00:00Z' },
        { attemptKey: 'new-reading', testId: 'reading-test', testTitle: 'Reading', bandScore: 8, savedAt: '2026-10-21T10:00:00Z' },
      ]))
      storage.setItem(`smarttest-writing-analysis-v1:${owner}`, JSON.stringify([
        { attemptKey: 'writing-task2', overallBand: 8, fullTest: { id: 'writing-full-1', overallBand: 7 }, savedAt: '2026-10-21T11:00:00Z' },
        { attemptKey: 'new-writing', overallBand: 5, savedAt: '2026-10-22T11:00:00Z' },
      ]))
      useSpeakingStore.setState({ sessions: [
        { id: 'old-speaking', userId: owner, date: '2026-10-19T11:00:00Z', overallBand: 8 },
        { id: 'new-speaking', userId: owner, date: '2026-10-22T11:00:00Z', overallBand: 4 },
        { id: 'other-speaking', userId: 'other-owner', date: '2026-10-23T11:00:00Z', overallBand: 9 },
      ] as SpeakingSessionRecord[] })
    })
    assert.deepEqual(bands(), ['8.0', '8.0', '7.0', '8.0'], 'all four skills use their highest band and full Writing uses its combined band')
    assertFirstTests([])
    assert.ok(element.querySelector('[aria-label="Overall 8.0"]'), 'overall rounds the average of the four personal bests')
    await act(async () => saveFullMockSectionResult('full-mock-2', 'listening', { band: 0, completedAt: '2026-10-22T10:00:00Z', testId: 'blank-listening' }))
    assert.deepEqual(bands(), ['8.0', '8.0', '7.0', '8.0'], 'a newer low mock score cannot replace a personal best')
    await act(async () => storage.setItem('smarttest:full-mock-history:v1:full-mock-1', JSON.stringify([
      { sections: { listening: { band: 8.5 }, reading: { band: 9 }, writing: { band: 9, assessmentStatus: 'pending' } } },
    ])))
    assert.deepEqual(bands(), ['8.5', '9.0', '7.0', '8.0'], 'archived mock attempts count, while pending assessments do not')
    assert.deepEqual(getIeltsHubScores('another-account', []), { listening: null, reading: null, writing: null, speaking: null }, 'results belong only to their account')
    await act(async () => useAuthStore.setState({ user: { id: 'another-account' } as AuthUser }))
    assert.deepEqual(bands(), [null, null, null, null], 'switching accounts clears all displayed bands')
    assertFirstTests(['Listening', 'Reading', 'Writing', 'Speaking'])
    await act(async () => saveFullMockSectionResult('full-mock-1', 'reading', { band: 0, completedAt: '2026-10-23T10:00:00Z', testId: 'blank-reading' }))
    assert.deepEqual(bands(), [null, '0.0', null, null], 'a completed zero-band test is different from an unplayed test')
    assertFirstTests(['Listening', 'Writing', 'Speaking'])
    assert.ok(element.textContent?.includes('1/4 skills scored'))
    assert.ok(element.querySelector('[aria-label="Overall 0.0"]'))
    console.log('PASS: best bands across all four skills, mock archives, combined Writing, first-test prompts, overall average, zero scores and account isolation')
  } finally {
    await act(async () => root.unmount())
    useAuthStore.setState({ user: null })
    useSpeakingStore.setState({ sessions: [] })
    localStorage.clear()
  }
}
