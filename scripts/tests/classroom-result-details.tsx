import assert from 'node:assert/strict'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import i18n from '@/i18n'
import { useAuthStore } from '@/store/authStore'
import { accountStorageFor } from '@/utils/accountStorage'
import { apiClient } from '@/lib/apiClient'
import { learningCenterApi } from '@/features/learningCenter/api'
import { syncIeltsClassResult } from '@/features/learningCenter/ieltsResultSync'
import { ieltsDetailsSyncKey, ieltsResultDetails } from '@/features/learningCenter/ieltsResultDetails'
import { syncSavedPerformance } from '@/utils/savedPerformanceSync'
import { ResultScore } from '@/features/learningCenter/resultPresentation'
import StudentResults from '@/features/learningCenter/StudentResults'
import type { IELTSTest, TestResult } from '@/types/ieltsTypes'
import type { LearningResult } from '@/features/learningCenter/types'

const date = '2026-11-26T18:00:00.000Z'
const parts = [[8,1,1], [7,3,0], [9,1,0], [8,1,1]].map(([correctAnswers, incorrectAnswers, skippedAnswers], index) => ({
  partNumber: index + 1, sectionTitle: `Listening part ${index + 1}`, totalQuestions: 10, correctAnswers, incorrectAnswers, skippedAnswers,
}))
const paper = { id: 'ielts-listening-1', title: 'IELTS Listening Full Test 1', module: 'Listening', duration: 30, totalQuestions: 40 } as IELTSTest
const result: TestResult = { testId: paper.id, date, score: 7.5, correctAnswers: 32, totalQuestions: 40, timeSpent: 1800, answers: {}, isPartial: false,
  detailedBreakdown: { activeSectionIds: [], readingAnalysis: { generatedAt: date, summary: { totalQuestions: 40, correctAnswers: 32, incorrectAnswers: 6, skippedAnswers: 2, accuracy: 80 },
    sectionSummaries: parts.map(part => ({ ...part, sectionId: String(part.partNumber), accuracy: part.correctAnswers * 10, questions: [] })), questionResults: [], locationInsights: [], typeInsights: [] } } }

export async function run() {
  await i18n.changeLanguage('en')
  const root = createRoot(document.getElementById('root')!)
  const originalPost = apiClient.post, originalSync = learningCenterApi.syncResult
  const requests: any[] = []
  let supportsDetails = false
  useAuthStore.setState({ user: { id: 'parts-owner', fullName: 'Parts fixture', xp: 50 } as any, accessToken: 'fixture-access', refreshToken: 'fixture-refresh' })
  const storage = accountStorageFor('parts-owner')
  apiClient.post = (async (path: string, input: unknown) => { requests.push({ path, input }); return { classBreakdownSaved: supportsDetails } }) as typeof apiClient.post
  learningCenterApi.syncResult = async input => { requests.push({ path: 'partial', input }); return {} }
  try {
    await syncIeltsClassResult('listening', paper, result)
    assert.equal(storage.getItem(ieltsDetailsSyncKey('listening', result)), null, 'An older API response cannot acknowledge part details it ignored')
    const body = requests[0].input
    assert.equal(body.breakdown.bandScore, 7.5)
    assert.equal(body.breakdown.sectionSummaries.length, 4)
    assert.equal(body.breakdown.incorrect, 6); assert.equal(body.breakdown.skipped, 2)
    assert.equal(JSON.stringify(body.breakdown).includes('questions"'), false, 'Only statistics, never per-question answers or assets, are uploaded')
    supportsDetails = true
    const one = syncIeltsClassResult('listening', paper, result)
    const two = syncIeltsClassResult('listening', paper, result)
    assert.equal(one, two, 'Concurrent saves share the original attempt sync')
    await one
    assert.ok(storage.getItem(ieltsDetailsSyncKey('listening', result)))

    const part = { partNumber: 2, sectionTitle: 'Second passage', totalQuestions: 13, correctAnswers: 8, incorrectAnswers: 3, skippedAnswers: 2 }
    const practice = { ...result, testId: 'reading-paper', date: '2026-11-26T18:30:00.000Z', score: 0, correctAnswers: 8, totalQuestions: 13, isPartial: true, detailedBreakdown: undefined }
    await syncIeltsClassResult('reading', { ...paper, id: practice.testId, module: 'Reading' }, practice, 'assigned-full-paper', [part])
    const partial = requests.at(-1).input
    assert.equal(storage.getItem(`smarttest-reading-sync:parts-owner:${practice.testId}-${practice.date}`), 'ok', 'Partial recovery acknowledges the original key and does not upload it every visit')
    assert.equal(partial.maxScore, 100); assert.equal(partial.assignmentId, undefined)
    assert.equal(partial.breakdown.sectionSummaries[0].partNumber, 2)
    assert.equal(partial.breakdown.bandScore, undefined, 'A 13-question passage never invents an overall IELTS band')

    storage.removeItem(ieltsDetailsSyncKey('listening', result))
    storage.setItem('smarttest-reading-analysis-history-v1:parts-owner', JSON.stringify([{ attemptKey: `${paper.id}-${date}`, savedAt: date, testId: paper.id, testTitle: paper.title, isPartial: false, sectionSummaries: parts, resultPayload: result }]))
    const beforeRepair = requests.length
    await syncSavedPerformance('parts-owner')
    assert.equal(requests.length, beforeRepair + 1, 'Already-synced attempts still recover missing part details')
    await syncSavedPerformance('parts-owner')
    assert.equal(requests.length, beforeRepair + 1, 'Acknowledged detailed history is not sent repeatedly')

    const full: LearningResult = { id: 'full', title: paper.title, examType: 'IELTS', skill: 'IELTS_LISTENING', score: 7.5, maxScore: 9, scoreKind: 'BAND', accuracy: 80, completedAt: date, durationSec: 1800, source: 'TEST_ATTEMPT', correctAnswers: 32, totalQuestions: 40, parts }
    const partialRow: LearningResult = { ...full, id: 'partial', title: 'IELTS Reading Full Test 1', skill: 'IELTS_READING', score: 0, maxScore: 100, scoreKind: 'PERCENT', correctAnswers: 0, totalQuestions: 13, parts: [{ ...part, correctAnswers: 0, incorrectAnswers: 10, skippedAnswers: 3 }], partial: true }
    await act(async () => root.render(<ResultScore result={partialRow} />))
    assert.match(document.body.textContent!, /0.*13.*correct/)
    assert.doesNotMatch(document.body.textContent!, /100|IELTS band/)
    await act(async () => root.render(<StudentResults results={[full, partialRow, { ...partialRow, id: 'legacy', parts: [] }]} />))
    assert.equal(document.querySelectorAll('.lc-parts-table tbody tr').length, 5)
    assert.deepEqual([...document.querySelector('.lc-parts-table tbody tr')!.querySelectorAll('td')].map(cell => cell.textContent), ['8', '1', '1', '10'])
    assert.match(document.body.textContent!, /IELTS band/)
    assert.match(document.body.textContent!, /Part breakdown was not recorded/)
    const toggle = document.querySelector<HTMLButtonElement>('.lc-parts-toggle')!
    await act(async () => toggle.click())
    assert.equal(toggle.getAttribute('aria-expanded'), 'false')
    await act(async () => toggle.click())
    assert.equal(toggle.getAttribute('aria-expanded'), 'true')
    await act(async () => i18n.changeLanguage('uz'))
    assert.match(document.body.textContent!, /Part mashqi/)
    assert.match(document.body.textContent!, /Matn/)
    assert.equal(ieltsResultDetails(paper, { ...result, totalQuestions: 39 }), undefined, 'Inconsistent local details are not presented as verified part marks')
    console.log('PASS: native IELTS bands, 13-question practices, exact part marks, missing-history labels, API rollout acknowledgement, repair without duplicate attempts and Uzbek copy.')
  } finally {
    apiClient.post = originalPost; learningCenterApi.syncResult = originalSync
    await act(async () => root.unmount())
  }
}
