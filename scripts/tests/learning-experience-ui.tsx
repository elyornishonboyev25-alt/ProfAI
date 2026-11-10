import React, { act } from 'react'
import assert from 'node:assert/strict'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import MockIELTS from '../../src/pages/MockIELTS'
import MockIELTSRun from '../../src/pages/MockIELTSRun'
import IELTSSectionTests from '../../src/pages/IELTSSectionTests'
import { learnerLevel, LEVEL_THRESHOLDS } from '../../src/utils/learnerLevel'
import { resolveLevelFromXp, getLevelProgress, LEVEL_THRESHOLDS as serverThresholds } from '../../backend/src/config/levelConfig'
import { notifyXpAward, useXpNotificationStore } from '../../src/store/xpNotificationStore'
import { requestMicrophone, microphoneError } from '../../src/lib/microphone'
import { accountStorageFor } from '../../src/utils/accountStorage'
import { useAuthStore } from '../../src/store/authStore'
import i18n from '../../src/i18n'

export async function run() {
  localStorage.clear()
  useAuthStore.setState({ user: null })
  await i18n.changeLanguage('en')
  assert.deepEqual(LEVEL_THRESHOLDS, serverThresholds)
  for (const xp of [-10, 0, 99, ...LEVEL_THRESHOLDS.flatMap(value => [value - 1, value, value + 1]), 1_000_000, NaN]) {
    const local = learnerLevel(xp)
    assert.equal(local.level, resolveLevelFromXp(xp), `Client and server agree at ${xp} XP`)
    assert.deepEqual(getLevelProgress(xp, 20), {
      currentLevelThreshold: local.currentLevelThreshold, nextLevelThreshold: local.nextLevelThreshold,
      xpIntoCurrent: local.xpIntoCurrent, levelSpan: local.levelSpan, progressPercent: local.progressPercent,
    })
    assert.ok(local.level >= 1 && local.level <= 10)
  }
  assert.equal(learnerLevel(20200).progressPercent, 100)
  assert.equal(learnerLevel(20200).remaining, 0)
  useXpNotificationStore.getState().clear()
  notifyXpAward('learner', { xpEarned: 20, totalXp: 110 }, '/tests/submit', {})
  assert.equal(useXpNotificationStore.getState().rewards[0]?.levelUp, 2)
  notifyXpAward('learner', { xpEarned: 20, totalXp: 110, duplicate: true }, '/tests/submit', {})
  assert.equal(useXpNotificationStore.getState().rewards[0]?.amount, 20, 'Duplicate submissions do not celebrate twice')
  useXpNotificationStore.getState().clear()

  const container = document.getElementById('root')!
  const root = createRoot(container)
  try {
    await act(async () => root.render(<MemoryRouter initialEntries={['/catalog']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Routes>
      <Route path="/catalog" element={<MockIELTS embedded />} />
      <Route path="/ielts/tests" element={<p>Back in library</p>} />
      <Route path="/mock/ielts/:mockId" element={<MockIELTSRun />} />
      <Route path="/test/listening/:id" element={<p>Listening has started</p>} />
    </Routes></MemoryRouter>))
    const open = container.querySelector<HTMLButtonElement>('[aria-label="Start Full Mock 1"]')!
    assert.ok(open)
    await act(async () => open.click())
    assert.ok(container.querySelector('.mrp-header .mock-run-start'), 'Catalog opens readiness, without launching Listening')
    assert.doesNotMatch(container.textContent!, /Listening has started/)
    const back = [...container.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent?.trim() === 'All mocks')!
    await act(async () => back.click())
    assert.match(container.textContent!, /Back in library/)
    assert.equal(document.querySelector('[role="alertdialog"]'), null, 'Unstarted mock has no exit warning')
  } finally { await act(async () => root.unmount()) }

  accountStorageFor('guest').setItem('smarttest-reading-analysis-history-v1:guest', JSON.stringify([
    { attemptKey: 'older', savedAt: '2026-10-01T10:00:00Z', testId: 'ielts-listening-1', testTitle: 'Listening Full Test 1', isPartial: false, bandScore: 6, correctAnswers: 24, totalQuestions: 40, sectionSummaries: [] },
    { attemptKey: 'latest', savedAt: '2026-10-02T10:00:00Z', testId: 'ielts-listening-1', testTitle: 'Listening Full Test 1', isPartial: false, bandScore: 7.5, correctAnswers: 33, totalQuestions: 40, sectionSummaries: [] },
  ]))
  const scores = createRoot(container)
  try {
    await act(async () => scores.render(<MemoryRouter><IELTSSectionTests sectionOverride="listening" embedded /></MemoryRouter>))
    assert.match(container.querySelector('.catalog-score')?.textContent ?? '', /7\.5/)
    assert.match(container.querySelector('.catalog-score')?.textContent ?? '', /33\/40 correct/, 'Card displays the latest saved result')
  } finally { await act(async () => scores.unmount()) }

  assert.match(microphoneError(new DOMException('Denied', 'NotAllowedError')), /blocked/)
  assert.match(microphoneError(new DOMException('Missing', 'NotFoundError')), /No microphone/)
  assert.match(microphoneError(new DOMException('Busy', 'NotReadableError')), /busy/)
  const originalMedia = Object.getOwnPropertyDescriptor(navigator, 'mediaDevices')
  let requests = 0
  const track = { readyState: 'live', stop() {} }
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: async () => {
    if (++requests === 1) throw new DOMException('Constraints', 'OverconstrainedError')
    return { getAudioTracks: () => [track], getTracks: () => [track] }
  } } })
  try { assert.ok(await requestMicrophone()); assert.equal(requests, 2, 'Unsupported enhancements retry basic microphone capture') }
  finally { if (originalMedia) Object.defineProperty(navigator, 'mediaDevices', originalMedia); else Reflect.deleteProperty(navigator, 'mediaDevices') }
  localStorage.clear()
  console.log('Learning experience passed: ten-level server/client parity, max level, duplicate-safe level celebration, IELTS readiness and clean exit, latest score cards, actionable microphone errors and capture fallback.')
}
