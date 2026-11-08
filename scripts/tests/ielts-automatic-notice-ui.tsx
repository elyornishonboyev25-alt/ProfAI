import assert from 'node:assert/strict'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Results from '@/pages/Results'
import { fullReadingTest2 as paper } from '@/data/fullReadingTest2'
import { loadReviewState } from '@/utils/resultsReviewState'
import { useAuthStore } from '@/store/authStore'
import type { TestResult } from '@/types/ieltsTypes'
import i18n from '@/i18n'

export async function run() {
  localStorage.clear(); await i18n.changeLanguage('en')
  useAuthStore.setState({ user:null })
  const result: TestResult = { testId:paper.id, date:'2026-10-31T10:00:00Z', score:0, correctAnswers:0, totalQuestions:40, timeSpent:120,
    answers:{}, leaderboardEligible:false, eligibilityNoticeAcknowledged:false, leaderboardMinimumSeconds:1800 }
  const root = createRoot(document.getElementById('root')!)
  try {
    await act(async () => root.render(<MemoryRouter initialEntries={[{ pathname:`/results/${paper.id}`, state:{ result, test:paper, returnTo:'/profile' } }]}><Routes><Route path="/results/:testId" element={<Results />} /></Routes></MemoryRouter>))
    assert.ok(document.querySelector('[role=alertdialog]'))
    assert.equal(document.querySelector('.ir-answer-grid'), null, 'Automatic submission is saved before its score is displayed')
    const action = [...document.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent?.includes('OK, view results'))!
    await act(async () => action.click())
    assert.equal(document.querySelector('[role=alertdialog]'), null)
    assert.ok(document.querySelector('.ir-answer-grid'))
    assert.equal(loadReviewState(paper.id)?.result.eligibilityNoticeAcknowledged, true)
    console.log('PASS: automatic IELTS submissions keep the deadline and show the eligibility notice before the saved result')
  } finally { await act(async () => root.unmount()) }
}
