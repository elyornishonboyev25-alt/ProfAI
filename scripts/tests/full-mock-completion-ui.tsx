import assert from 'node:assert/strict'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import IELTSSpeakingTest from '@/pages/IELTSSpeakingTest'
import MockIELTSRun from '@/pages/MockIELTSRun'
import { accountStorage } from '@/utils/accountStorage'
import { getFullMockById, getFullMockOverallBand, getFullMockResults, retakeFullMock, saveFullMockSectionResult, fullMockLaunchState } from '@/utils/ieltsMockCatalog'
import { findIeltsSpeakingFullMock } from '@/utils/ieltsSpeakingCatalog'
import { analyseTranscript } from '@/lib/speakingScoring'
import { apiClient } from '@/lib/apiClient'
import type { SpeakingEvaluation } from '@/services/speakingAI'
import { useBadgeStore } from '@/store/badgeStore'
import i18n from '@/i18n'

export async function run() {
  await i18n.changeLanguage('en')
  localStorage.clear()
  const element = document.getElementById('root')!
  let root: ReturnType<typeof createRoot> | undefined
  const originalPost = apiClient.post
  const originalBlob = globalThis.Blob
  const originalIndexedDB = globalThis.indexedDB
  const originalReader = globalThis.FileReader
  const originalCreateURL = URL.createObjectURL
  const originalRevokeURL = URL.revokeObjectURL
  URL.createObjectURL = () => 'blob:mock-recording'
  URL.revokeObjectURL = () => {}
  globalThis.Blob = window.Blob
  globalThis.FileReader = window.FileReader
  let missingAudio = false
  const clip = new Blob(['test recording'], { type: 'audio/webm' })
  globalThis.indexedDB = { open: () => {
    const request: any = {}
    queueMicrotask(() => {
      request.result = { close() {}, transaction: () => ({ objectStore: () => ({ get: () => {
        const read: any = {}
        queueMicrotask(() => { read.result = missingAudio ? null : clip; read.onsuccess() })
        return read
      } }) }) }
      request.onsuccess()
    })
    return request
  } } as unknown as IDBFactory
  const mock = getFullMockById('full-mock-1')!
  const speaking = findIeltsSpeakingFullMock('speaking-full-1')!
  const config = { mode: 'full_mock', mockSeed: { part1: speaking.parts.part1.questions.map(q => q.q), part2: { title: speaking.parts.part2.title, bullets: speaking.parts.part2.bullets, followUp: speaking.parts.part2.followUp }, part3: speaking.parts.part3.questions.map(q => q.q) } }
  const legacyKey = `profai:speaking:examiner:${speaking.title}:${JSON.stringify(config)}`
  const text = 'I like read books at home with my sister.'
  const transcript = [{ role: 'examiner' as const, text: 'What do you enjoy doing?' }, { role: 'candidate' as const, text }]
  const evaluation: SpeakingEvaluation = { overallBand: 7, fluencyBand: 7, lexicalBand: 7, grammarBand: 7, pronunciationBand: 7, summary: 'Grounded audio assessment.', strengths: [], weaknesses: [], improvementPriorities: [], source: 'ai', assessmentMode: 'audio', stats: analyseTranscript(text, 20), improvedAnswers: [] }
  let providerFails = true
  let path = ''
  let assessmentCalls = 0
  apiClient.post = (async (url: string) => {
    if (url.endsWith('/rewrites')) return { improvedAnswers: [{ answerIndex: 0, original: text, improved: 'I enjoy reading books at home with my sister.' }] }
    if (url.endsWith('/assess')) { assessmentCalls++; if (providerFails) throw new Error('Provider unavailable'); return evaluation }
    return { totalXp: 0, level: 1 }
  }) as typeof apiClient.post
  function Location() { path = useLocation().pathname; return null }
  async function mount(pathname: string, state?: unknown) {
    if (root) await act(async () => root!.unmount())
    root = createRoot(element)
    await act(async () => root!.render(<MemoryRouter initialEntries={[{ pathname, state }]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Location /><Routes><Route path="/ielts/speaking/test/:id" element={<IELTSSpeakingTest />} /><Route path="/mock/ielts/:mockId" element={<MockIELTSRun />} /></Routes></MemoryRouter>))
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 150)) })
  }
  async function click(label: string) {
    const button = [...element.querySelectorAll<HTMLButtonElement>('button')].find(item => item.textContent?.trim() === label)
    assert.ok(button, `Missing action: ${label}`)
    await act(async () => button.click())
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 100)) })
  }
  try {
    useBadgeStore.setState({ records: [] })
    for (const skill of ['listening', 'reading', 'writing'] as const) saveFullMockSectionResult(mock.id, skill, { band: 7, testId: skill, completedAt: '2026-10-14' })
    accountStorage.setItem('profai:full-mock:intro:v1:full-mock-1:speaking', 'started')
    accountStorage.setItem(legacyKey, JSON.stringify({ phase: 'result', chat: [], prompt: '', activePart: 3, cueCard: null, prepNotes: '', stages: [], stageIndex: 0, moveIndex: 0, answers: [evaluation.stats], history: transcript, prepDeadline: 0, speakDeadline: 0, pendingDuration: 0, audioCount: 1, audioKey: 'saved-audio' }))
    await mount(mock.sections[3].launchPath!, fullMockLaunchState(mock.id, 'speaking'))
    assert.equal(path, '/mock/ielts/full-mock-1', 'An outage still routes the completed exam to its full report')
    assert.equal(assessmentCalls, 1, 'Finished recordings restore without a new microphone or a new exam')
    assert.ok(element.querySelector('.full-mock-results'))
    assert.equal(element.querySelectorAll('.full-mock-result-review').length, 4)
    assert.equal(getFullMockResults(mock.id).speaking?.assessmentStatus, 'pending')
    assert.equal(getFullMockOverallBand(mock.id), null, 'An unavailable assessment never becomes a fabricated zero band')
    assert.equal(useBadgeStore.getState().records.length, 0, 'Pending grades award no badges')
    await click('Generate improved answer')
    assert.ok(element.textContent?.includes('I enjoy reading books at home with my sister.'))
    assert.equal(getFullMockResults(mock.id).speaking?.speaking?.evaluation.improvedAnswers?.[0].improved, 'I enjoy reading books at home with my sister.')
    await mount('/mock/ielts/full-mock-1')
    assert.ok(element.textContent?.includes('I enjoy reading books at home with my sister.'), 'The repaired answer persists after reload')
    await click('Retry Speaking assessment')
    assert.ok(element.querySelector('[role="alert"]')?.textContent?.includes('temporarily unavailable'))
    assert.equal(getFullMockOverallBand(mock.id), null)
    missingAudio = true
    await click('Retry Speaking assessment')
    assert.ok(element.querySelector('[role="alert"]')?.textContent?.includes('recordings are unavailable'))
    assert.equal(assessmentCalls, 2, 'Missing audio never falls back to a text score')
    missingAudio = false
    providerFails = false
    await click('Retry Speaking assessment')
    assert.equal(getFullMockOverallBand(mock.id), 7)
    assert.ok(element.querySelector('.mock-run-band')?.textContent?.startsWith('7.0'))
    assert.equal(element.querySelectorAll('.full-mock-result-review').length, 4)
    await mount('/mock/ielts/full-mock-1')
    assert.ok(element.querySelector('.mock-run-band')?.textContent?.startsWith('7.0'), 'The final overall persists')
    const checkpointKey = getFullMockResults(mock.id).speaking?.speaking?.sessionKey
    assert.ok(checkpointKey)
    assert.ok(accountStorage.getItem(checkpointKey))
    await act(async () => { assert.equal(retakeFullMock(mock.id), true) })
    assert.equal(accountStorage.getItem(checkpointKey), null, 'Retakes cannot restore the previous Speaking session')
    console.log('PASS: Speaking outage → full report; saved audio retry; four review actions; grounded score; improved-answer recovery/reload; isolated retake')
  } finally {
    if (root) await act(async () => root!.unmount())
    apiClient.post = originalPost
    globalThis.Blob = originalBlob
    globalThis.indexedDB = originalIndexedDB
    globalThis.FileReader = originalReader
    URL.createObjectURL = originalCreateURL
    URL.revokeObjectURL = originalRevokeURL
    localStorage.clear()
  }
}
