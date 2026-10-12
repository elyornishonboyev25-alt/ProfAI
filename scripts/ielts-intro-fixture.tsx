// Build-time screen recording only. Reuses the live IELTS component and catalog;
// no illustrative paper or recording helper is shipped in the application.
import React from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import MockIELTSRun from '../src/pages/MockIELTSRun'
import IELTSReadingInterface from '../src/components/IELTSReadingInterface'
import { getFullMockById, saveFullMockSectionResult } from '../src/utils/ieltsMockCatalog'
import { resolveIeltsTestById } from '../src/utils/ieltsTestCatalog'
import { accountStorageFor } from '../src/utils/accountStorage'
import i18n from '../src/i18n'

const root = createRoot(document.getElementById('root')!)
let revision = 0
const storage = accountStorageFor('guest')
await i18n.changeLanguage('en')
// Only tutorial narration belongs on the soundtrack. The actual test audio
// controls remain functional, using a silent local clip during screen capture.
HTMLMediaElement.prototype.play = function () { this.dispatchEvent(new Event('play')); return Promise.resolve() }
HTMLMediaElement.prototype.pause = function () { this.dispatchEvent(new Event('pause')) }
const helpers = window as unknown as { show: (section: 'listening' | 'reading', review?: boolean) => void; finishAudio: () => void }
helpers.show = (section, review = false) => {
  localStorage.clear()
  const mock = getFullMockById('full-mock-1')!
  const route = mock.sections.find(item => item.key === section)!
  const original = resolveIeltsTestById(route.launchPath!.split('/').pop()!)!
  const test = section === 'listening' ? { ...original, continuousAudioUrl: '/demo-audio.wav' } : original
  const key = `ielts_test_session_${test.id}:mock:${mock.id}`
  storage.setItem(key, JSON.stringify({ isTestActive: true, testMode: 'simulation', selectedParts: test.sections.map((_, n) => n), partsSelectionVersion: 2, currentSectionIndex: 0, answers: {}, startedAt: Date.now() - 3600000, timeRemaining: section === 'reading' ? 3600 : -1, deadline: section === 'reading' ? Date.now() + 3600000 : null, timestamp: Date.now(), audioStarted: false }))
  const reviewPayload = review ? { result: { testId: test.id, date: '2026-10-12', score: 0, correctAnswers: 0, totalQuestions: 40, timeSpent: 3600, answers: {} }, showCorrectAnswers: false } : undefined
  root.render(<MemoryRouter key={++revision}><IELTSReadingInterface test={test} fullMockId={mock.id} reviewPayload={reviewPayload} onComplete={result => {
    if (section === 'reading') saveFullMockSectionResult(mock.id, 'listening', { band: 0, testId: 'tutorial', completedAt: new Date().toISOString() })
    saveFullMockSectionResult(mock.id, section, { band: result.score, testId: test.id, completedAt: result.date, result })
    root.render(<MemoryRouter key={++revision} initialEntries={['/mock/ielts/'+mock.id]}><Routes><Route path="/mock/ielts/:mockId" element={<MockIELTSRun />} /></Routes></MemoryRouter>)
  }} onExit={() => {}} /></MemoryRouter>)
}
helpers.finishAudio = () => {
  const audio = document.querySelector('audio')!
  Object.defineProperty(audio, 'duration', { configurable: true, value: 1 })
  audio.currentTime = 1
  audio.dispatchEvent(new Event('loadedmetadata'))
  audio.dispatchEvent(new Event('ended'))
}
helpers.show('reading')
