import assert from 'node:assert/strict'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import IELTSReadingInterface from '@/components/IELTSReadingInterface'
import ExamInstruction from '@/components/common/ExamInstruction'
import { listKnownIeltsTests } from '@/utils/ieltsTestCatalog'
import { accountStorageFor } from '@/utils/accountStorage'
import { useAuthStore } from '@/store/authStore'
import { buildReadingRoadmapFullTest } from '@/utils/generatedIeltsTests'
const fullReadingTest2 = buildReadingRoadmapFullTest(2)!
import { apiClient } from '@/lib/apiClient'
import { syncIeltsClassResult } from '@/features/learningCenter/ieltsResultSync'
import type { IELTSTest, TestResult } from '@/types/ieltsTypes'

export async function run() {
  localStorage.clear()
  const owner = 'ielts-workspace-audit'
  useAuthStore.setState({ user: { id: owner } as never })
  const storage = accountStorageFor(owner)
  const element = document.getElementById('root')!
  let root = createRoot(element)
  const mount = async (paper: IELTSTest, part: number, mode: 'practice' | 'simulation' = 'practice', complete: (result: TestResult) => void = () => {}) => {
    await act(async () => root.unmount()); root = createRoot(element)
    storage.setItem(`ielts_test_session_${paper.id}`, JSON.stringify({ isTestActive: true, testMode: mode,
      selectedParts: paper.sections.map((_, index) => index), partsSelectionVersion: 2, currentSectionIndex: part,
      elapsedSeconds: 70, customTime: -1, timeRemaining: -1, answers: {} }))
    await act(async () => root.render(<MemoryRouter initialEntries={[`/test/${paper.module.toLowerCase()}/${paper.id}`]}><IELTSReadingInterface test={paper} onExit={() => {}} onComplete={complete} /></MemoryRouter>))
  }
  try {
    const papers = [...new Map(listKnownIeltsTests().filter(test => test.module === 'Listening' && test.sections.length === 4).map(test => [test.id, test])).values()]
    assert.ok(papers.length >= 20, 'Audit the live Listening catalog, including source-format papers')
    for (const paper of papers) {
      await mount(paper, 3)
      assert.ok(element.querySelector('.ielts-listening-workspace'), paper.title)
      for (const question of paper.sections[3].questions) {
        assert.ok(element.querySelector(`[id="question-card-${question.id}"]`) || element.querySelector(`[data-source-question="${question.id}"]`), `${paper.title}: question ${question.number} renders in Part 4`)
      }
      assert.ok(element.querySelector('input, select'), `${paper.title}: answer controls remain available`)
    }
    console.log(`PASS: Part 4 rendering and answer controls across ${papers.length} Listening papers`)
    await mount(fullReadingTest2, 0)
    assert.ok(element.querySelector('.ielts-short-answer-group'))
    assert.equal(element.querySelectorAll('.ielts-short-answer-group .ielts-short-answer-row').length, 4)
    assert.ok([...element.querySelectorAll('.ielts-short-answer-row')].every(row => row.querySelector('.exam-question-number')))
    assert.ok(element.querySelector('.ielts-matching-options.is-letters'), 'Single-letter options have a compact shared layout')
    assert.ok(element.querySelector('.exam-answer-limit')?.textContent)
    await act(async () => root.unmount()); root = createRoot(element)
    await act(async () => root.render(<p><ExamInstruction text="Write NO MORE THAN TWO WORDS AND/OR A NUMBER. Choose ONLY ONE WORD. Choose TWO LETTERS." /></p>))
    assert.deepEqual([...element.querySelectorAll('strong')].map(node => node.textContent), ['NO MORE THAN TWO WORDS AND/OR A NUMBER', 'ONLY ONE WORD', 'Choose TWO LETTERS'])
    const post = apiClient.post
    let called = false
    apiClient.post = (async () => { called = true; return {} }) as typeof post
    try {
      await syncIeltsClassResult('reading', fullReadingTest2, { leaderboardEligible: false } as TestResult)
      assert.equal(called, false, 'Too-fast attempts cannot enter leaderboard sync through the class path')
    } finally { apiClient.post = post }
    console.log('PASS: continuous short answers, shared number badges, compact matching, instruction emphasis and leaderboard exclusion')
    let submitted: TestResult | undefined
    await mount(fullReadingTest2, 0, 'practice', result => { submitted = result })
    const click = async (label: string) => {
      const button = [...document.querySelectorAll<HTMLButtonElement>('button')].find(node => node.textContent?.trim() === label)!
      assert.ok(button, label)
      await act(async () => button.click())
    }
    await click('Submit'); await click('Submit test')
    assert.ok(document.querySelector('[role=alertdialog]'))
    const realNow = Date.now
    try {
      Date.now = () => realNow() + 3600000
      await click('OK, view results')
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 3200)) })
      assert.ok(submitted && submitted.timeSpent >= 70 && submitted.timeSpent < 300, 'Time spent excludes waiting at the notice and result animation')
      assert.equal(submitted.eligibilityNoticeAcknowledged, true)
    } finally { Date.now = realNow }
    console.log('PASS: waiting at the eligibility notice does not inflate the recorded test duration')

  } finally { await act(async () => root.unmount()) }
}
