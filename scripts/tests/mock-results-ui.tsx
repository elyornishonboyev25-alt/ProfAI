import assert from 'node:assert/strict'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import MockIELTSRun from '@/pages/MockIELTSRun'
import { getFullMockById, getFullMockOverallBand, getFullMockResults, getFullMockSectionRedirect, saveFullMockSectionResult, setFullMockMode, type MockSectionKey } from '@/utils/ieltsMockCatalog'
import { getResultsHistory } from '@/utils/resultsHistory'
import { saveReadingAnalysisHistory } from '@/utils/readingAnalysisStorage'
import type { TestResult } from '@/types/ieltsTypes'
import i18n from '@/i18n'

export async function run() {
  await i18n.changeLanguage('en')
  localStorage.clear()
  const element = document.getElementById('root')!
  const root = createRoot(element)
  const mock = getFullMockById('full-mock-1')!
  const bands: Record<MockSectionKey, number> = { listening: 7, reading: 8, writing: 6.5, speaking: 7.5 }
  let reviewState: unknown
  function Review() { reviewState = useLocation().state; return <p>Review opened</p> }
  try {
    await act(async () => root.render(<MemoryRouter initialEntries={['/mock/ielts/full-mock-1']}><Routes><Route path="/mock/ielts/:mockId" element={<MockIELTSRun />} /><Route path="/test/:type/:id" element={<Review />} /></Routes></MemoryRouter>))
    assert.equal(element.querySelectorAll('.mock-run-section').length, 4)
    assert.equal(element.querySelectorAll('.mock-run-start').length, 1)
    assert.equal(element.querySelectorAll('.mrp-section.is-locked').length, 3)
    assert.equal(element.querySelectorAll('.mrp-section-score .mock-run-skill-band').length, 0, 'no band before any section')
    for (const [index, section] of mock.sections.entries()) {
      await act(async () => saveFullMockSectionResult(mock.id, section.key, {
        band: bands[section.key], testId: section.launchPath!.split('/').pop()!, completedAt: '2026-10-07T06:00:00Z',
        ...(section.key === 'reading' || section.key === 'listening' ? { result: { testId: section.launchPath!.split('/').pop()!, date: '2026-10-07', score: bands[section.key], correctAnswers: 32, totalQuestions: 40, answers: {}, timeSpent: 1800 } as TestResult } : { review: [{ label: section.key === 'speaking' ? 'Your answer' : 'Task 1', response: 'Saved response text', feedback: 'Saved feedback text', improvedVersion: `Improved ${section.key} response` }, ...(section.key === 'writing' ? [{ label: 'Task 2', response: 'My second essay', improvedVersion: 'Improved second essay' }] : [])] }),
      }))
      if (index < 3) {
        assert.equal(element.querySelectorAll('.mrp-section-score .mock-run-skill-band').length, 0, 'exam-mode scores stay hidden before all four sections finish')
        assert.equal(element.querySelectorAll('.mock-run-review').length, 0)
      }
    }
    assert.ok(element.querySelector('.mock-run-band')?.textContent?.startsWith('7.5'), 'overall uses existing nearest-half-band calculation')
    assert.ok(element.querySelector('.full-mock-results-calculation')?.textContent?.includes('= 7.25'), 'Calculation shows the four-score average before IELTS rounding')
    assert.deepEqual([...element.querySelectorAll('.mock-run-skill-band')].map(node => node.firstChild?.textContent), ['7.0', '8.0', '6.5', '7.5'])
    assert.equal(element.querySelectorAll('.full-mock-result-card').length, 4)
    assert.equal(element.querySelector('#full-mock-result-detail'), null, 'Overall report initially hides section details')
    assert.equal(element.querySelectorAll('[aria-expanded="true"]').length, 0)
    await act(async () => element.querySelector<HTMLButtonElement>('#result-card-listening')!.click())
    assert.equal(element.querySelectorAll('.mock-run-review').length, 1)
    assert.ok(element.querySelector('#full-mock-result-detail')?.textContent?.includes('32'))
    assert.equal(element.querySelector('a[href="/podcast"]'), null, 'Completed-test reviews retain the current design without practice promotions')
    await act(async () => element.querySelector<HTMLButtonElement>('#result-card-reading')!.click())
    assert.equal(element.querySelector('a[href="/articles"]'), null)
    await act(async () => element.querySelector<HTMLButtonElement>('#result-card-writing')!.click())
    assert.equal(element.querySelector('#full-mock-result-detail')?.getAttribute('aria-labelledby'), 'full-mock-section-title')
    assert.ok(element.textContent?.includes('Saved response text'))
    for (const text of ['Improved writing response', 'Improved second essay']) assert.ok(element.textContent?.includes(text))
    await act(async () => element.querySelector<HTMLButtonElement>('#result-card-speaking')!.click())
    assert.equal(element.querySelector('a[href="/shadowing-lab"]'), null)
    assert.ok(element.textContent?.includes('Improved speaking response'))
    assert.ok([...element.querySelectorAll('.mock-run-section-review details')].every(details => details.hasAttribute('open')))
    await act(async () => element.querySelector<HTMLButtonElement>('[aria-label="Close section review"]')!.click())
    assert.equal(element.querySelector('#full-mock-result-detail'), null)
    assert.equal(document.activeElement?.id, 'result-card-speaking', 'Closing review returns focus to its card')
    await act(async () => element.querySelector<HTMLButtonElement>('#result-card-listening')!.click())
    await act(async () => element.querySelector<HTMLButtonElement>('.mock-run-review')!.click())
    assert.ok(element.textContent?.includes('Review opened'))
    assert.ok((reviewState as { reviewPayload?: { result?: TestResult } }).reviewPayload?.result)
    assert.equal((reviewState as { mock?: { section: string } }).mock?.section, 'listening')
    saveFullMockSectionResult('full-mock-2', 'reading', {
      band: 2, testId: 'legacy-empty-reading', completedAt: '2026-10-07',
      result: { testId: 'legacy-empty-reading', date: '2026-10-07', score: 2, correctAnswers: 0, totalQuestions: 40, timeSpent: 3600, answers: { empty: [' ', ''] } },
    })
    for (const section of ['listening', 'writing', 'speaking'] as const) saveFullMockSectionResult('full-mock-2', section, { band: 7, testId: section, completedAt: '2026-10-07' })
    assert.equal(getFullMockResults('full-mock-2').reading?.band, 0, 'Legacy blank paper is corrected on restore')
    assert.equal(getFullMockResults('full-mock-2').reading?.result?.score, 0, 'Saved review uses corrected zero band')
    assert.equal(getFullMockOverallBand('full-mock-2'), 5.5, 'Legacy empty papers no longer inflate the overall band')
    // Practice mode: any order, each band shown at once; My Results groups the mock.
    const practice = getFullMockById('full-mock-3')!
    setFullMockMode(practice.id, 'practice')
    const listeningId = practice.sections[0].launchPath!.split('/').pop()!
    const listeningResult = { testId: listeningId, date: '2026-10-08T07:00:00.000Z', score: 6.5, correctAnswers: 27, totalQuestions: 40, answers: {}, timeSpent: 1700 } as TestResult
    saveFullMockSectionResult(practice.id, 'listening', { band: 6.5, testId: listeningId, completedAt: listeningResult.date, result: listeningResult })
    saveReadingAnalysisHistory({ userId: 'guest', attemptKey: `${listeningId}-${listeningResult.date}`, savedAt: listeningResult.date, testId: listeningId, testTitle: 'Listening Full Test 3', score: 6.5, bandScore: 6.5, isPartial: false, totalQuestions: 40, correctAnswers: 27, incorrectAnswers: 13, skippedAnswers: 0, accuracy: 67, timeSpent: 1700, sectionSummaries: [], focusAreas: [], incorrectQuestions: [], questionResults: [], resultPayload: listeningResult })
    assert.equal(getFullMockSectionRedirect(practice.id, 'writing', practice.sections[2].launchPath!), null, 'Practice mode opens Writing before Reading')
    assert.equal(getFullMockSectionRedirect(practice.id, 'listening', practice.sections[0].launchPath!), `/mock/ielts/${practice.id}`, 'A finished practice section cannot be retaken inside the mock')
    await act(async () => root.render(<MemoryRouter key="practice" initialEntries={[{ pathname: `/mock/ielts/${practice.id}`, state: { completedSection: 'listening' } }]}><Routes><Route path="/mock/ielts/:mockId" element={<MockIELTSRun />} /><Route path="/test/:type/:id" element={<Review />} /></Routes></MemoryRouter>))
    assert.ok(document.querySelector('.mrp-handoff-score')?.textContent?.includes('6.5'), 'Practice hand-off shows the section band')
    assert.equal(element.querySelector('.mrp-section.is-completed .mock-run-skill-band')?.textContent, '6.5')
    assert.equal(element.querySelectorAll('.mrp-section .mrp-start').length, 3, 'Every unfinished practice section can start')
    const history = getResultsHistory('guest', [])
    const mockRecord = history.find(record => record.mock?.mockId === practice.id)
    assert.ok(mockRecord, 'My Results lists the started practice mock')
    assert.equal(history.some(record => record.id === `reading-${listeningId}-${listeningResult.date}`), false, 'The mock section is not repeated as a standalone result')
    assert.deepEqual(mockRecord!.mock!.sections.map(section => section.state), ['scored', 'todo', 'todo', 'todo'])
    assert.equal(mockRecord!.mock!.sections[0].band, '6.5')
    const examRecord = history.find(record => record.mock?.mockId === 'full-mock-1')
    assert.equal(examRecord?.score?.value, '7.5', 'A finished mock shows one overall band')
    console.log('PASS: practice mode any-order sections, instant section band, grouped My Results record without duplicate section rows')
    console.log('PASS: four mock cards, hidden partial scores, saved band calculation, progress, Writing/Speaking responses and Listening review navigation')
    console.log('PASS: legacy unanswered Reading band, saved review and overall are corrected')
  } finally { await act(async () => root.unmount()); localStorage.clear() }
}
