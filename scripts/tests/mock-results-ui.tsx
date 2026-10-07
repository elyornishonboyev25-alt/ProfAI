import assert from 'node:assert/strict'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import MockIELTSRun from '@/pages/MockIELTSRun'
import { getFullMockById, saveFullMockSectionResult, type MockSectionKey } from '@/utils/ieltsMockCatalog'
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
    assert.equal(element.querySelectorAll('.is-locked').length, 3)
    assert.equal(element.querySelector('.mock-run-band')?.textContent?.includes('—'), true)
    for (const [index, section] of mock.sections.entries()) {
      await act(async () => saveFullMockSectionResult(mock.id, section.key, {
        band: bands[section.key], testId: section.launchPath!.split('/').pop()!, completedAt: '2026-10-07T06:00:00Z',
        ...(section.key === 'reading' || section.key === 'listening' ? { result: { testId: section.launchPath!.split('/').pop()!, date: '2026-10-07', score: bands[section.key], correctAnswers: 32, totalQuestions: 40, answers: {}, timeSpent: 1800 } as TestResult } : { review: [{ label: 'Your response', response: 'Saved response text', feedback: 'Saved feedback text' }] }),
      }))
      if (index < 3) {
        assert.ok(element.querySelector('.mock-run-band')?.textContent?.includes('—'), 'scores stay hidden before all four sections finish')
        assert.equal(element.querySelectorAll('.mock-run-review').length, 0)
      }
    }
    assert.ok(element.querySelector('.mock-run-band')?.textContent?.startsWith('7.5'), 'overall uses existing nearest-half-band calculation')
    assert.deepEqual([...element.querySelectorAll('.mock-run-skill-band')].map(node => node.firstChild?.textContent), ['7.0', '8.0', '6.5', '7.5'])
    assert.equal(element.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow'), '100')
    assert.equal(element.querySelectorAll('.mock-run-review').length, 2)
    assert.equal(element.querySelectorAll('.mock-run-section-review details').length, 2)
    assert.ok(element.textContent?.includes('Saved response text'))
    await act(async () => element.querySelector<HTMLButtonElement>('.mock-run-review')!.click())
    assert.ok(element.textContent?.includes('Review opened'))
    assert.ok((reviewState as { reviewPayload?: { result?: TestResult } }).reviewPayload?.result)
    assert.equal((reviewState as { mock?: { section: string } }).mock?.section, 'listening')
    console.log('PASS: four mock cards, hidden partial scores, saved band calculation, progress, Writing/Speaking responses and Listening review navigation')
  } finally { await act(async () => root.unmount()); localStorage.clear() }
}
