import assert from 'node:assert/strict'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import i18n from '@/i18n'
import { apiClient } from '@/lib/apiClient'
import { withAssessmentDeadline } from '@/utils/assessmentDeadline'
import { calculateFullMockOverallBand, type FullMockSectionResult, type MockSectionKey } from '@/utils/ieltsMockCatalog'
import { accountStorageFor } from '@/utils/accountStorage'
import { getIeltsAttemptResumes, saveIeltsAttemptResume } from '@/utils/ieltsAttemptResume'
import { getWritingFullTestById } from '@/data/writingTestData'
import IELTSWritingFullTestInterface from '@/components/IELTSWritingFullTestInterface'
import IELTSWritingTestInterface from '@/components/IELTSWritingTestInterface'
import ExaminerSession from '@/components/speaking/ExaminerSession'
import { analyseTranscript } from '@/lib/speakingScoring'
import { evaluateWriting, type WritingEvaluation } from '@/services/geminiAI'
import type { SpeakingEvaluation } from '@/services/speakingAI'

export async function run() {
  const container = document.getElementById('root')!
  let root = createRoot(container)
  const originalPost = apiClient.post
  const storage = accountStorageFor('guest')
  const writing = getWritingFullTestById('writing-full-1')!
  const responses = Object.fromEntries(writing.tasks.map((task, index) => [task.id, `Original essay for task ${index + 1}.`]))
  const evaluation: WritingEvaluation = { overallBand: 6.5, taskAchievement: 6, coherenceCohesion: 6, lexicalResource: 7, grammaticalRange: 7, summary: 'Assessment of the original essay.', strengths: [], improvements: [], errors: [], correctedVersion: 'Corrected response.', xpAwarded: 0 }
  const mount = async (node: React.ReactNode) => {
    await act(async () => root.unmount())
    root = createRoot(container)
    await act(async () => root.render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{node}</MemoryRouter>))
  }
  const click = async (label: string) => {
    const button = [...document.querySelectorAll('button')].find(node => node.textContent?.trim() === label)
    assert.ok(button, `Missing button: ${label}`)
    await act(async () => button.click())
  }
  try {
    await i18n.changeLanguage('en')
    localStorage.clear()
    let signal: AbortSignal | undefined
    await assert.rejects(withAssessmentDeadline(current => { signal = current; return new Promise(() => {}) }, 5), /too long/)
    assert.equal(signal?.aborted, true, 'A stalled operation terminates even if the transport ignores cancellation')
    assert.equal(await withAssessmentDeadline(async () => 7, 50), 7)

    const keys = ['listening', 'reading', 'writing', 'speaking'] as const
    for (const [bands, expected] of [[[6.5, 6.5, 5, 7], 6.5], [[6.5, 6.5, 5.5, 6], 6], [[7, 7, 6, 7], 7]] as const) {
      const sections = Object.fromEntries(keys.map((key, index) => [key, { band: bands[index], completedAt: '', testId: key }]))
      assert.equal(calculateFullMockOverallBand(sections), expected)
    }
    const sections: Partial<Record<MockSectionKey, FullMockSectionResult>> = Object.fromEntries(keys.map(key => [key, { band: 7, completedAt: '', testId: key }]))
    assert.equal(calculateFullMockOverallBand({ ...sections, writing: undefined }), null)
    assert.equal(calculateFullMockOverallBand({ ...sections, speaking: { ...sections.speaking!, assessmentStatus: 'pending' } }), null)
    assert.equal(calculateFullMockOverallBand({ ...sections, speaking: { ...sections.speaking!, band: NaN } }), null)

    let requests = 0
    apiClient.post = (async () => { requests++; return { ...evaluation, overallBand: 9, errors: null, strengths: null, improvements: null } }) as typeof apiClient.post
    const normalized = await evaluateWriting('task2', 'Prompt', 'Original response', 2)
    assert.equal(normalized.overallBand, 6.5, 'Criterion average determines the band')
    assert.deepEqual(normalized.errors, [])
    apiClient.post = (async () => ({ ...evaluation, grammaticalRange: NaN })) as typeof apiClient.post
    await assert.rejects(evaluateWriting('task2', 'Prompt', 'Original response', 2), /incomplete/)

    const sessionKey = `profai:writing:draft:guest:${writing.id}:session`
    storage.setItem(sessionKey, JSON.stringify({ phase: 'submitted', answers: responses, evaluations: { [writing.tasks[0].id]: evaluation }, timeRemaining: 1200, timerEnabled: true, deadline: Date.now() - 1000 }))
    saveIeltsAttemptResume('guest', { sessionKey, title: writing.title, pathname: `/ielts/writing/test/${writing.id}`, search: '', state: null })
    requests = 0
    apiClient.post = (async (_path: string, body: { response: string }) => { requests++; assert.equal(body.response, responses[writing.tasks[1].id], 'A successful task is not billed or assessed again'); return evaluation }) as typeof apiClient.post
    await mount(<IELTSWritingFullTestInterface fullTest={writing} onExit={() => {}} />)
    assert.ok(container.querySelector('[role="alert"]'))
    for (const response of Object.values(responses)) assert.ok(container.textContent?.includes(response), 'Saved essays remain visible while assessment is unavailable')
    assert.equal(requests, 0, 'Restoring submitted answers does not start a paid request')
    await click('Retry')
    assert.equal(requests, 1)
    assert.ok(container.textContent?.includes('Estimated Overall Band 6.5'))
    assert.equal(JSON.parse(storage.getItem(sessionKey)!).phase, 'submitted')
    assert.equal(getIeltsAttemptResumes('guest').some(item => item.sessionKey === sessionKey), false, 'Completed reviews are not advertised as unfinished tests')
    await mount(<IELTSWritingFullTestInterface fullTest={writing} onExit={() => {}} />)
    assert.ok(container.textContent?.includes('Estimated Overall Band 6.5'))
    assert.equal(requests, 1, 'Reload displays the saved report without new grading')
    await click('Try Again')
    assert.equal(storage.getItem(sessionKey), null)

    const task = writing.tasks[0]
    const singleKey = `profai:writing:draft:guest:${task.id}:session`
    storage.setItem(singleKey, JSON.stringify({ phase: 'submitted', answer: responses[task.id], evaluation, timeRemaining: 900, timerEnabled: false }))
    await mount(<IELTSWritingTestInterface task={task} onExit={() => {}} />)
    assert.ok(container.textContent?.includes('Band 6.5'))
    assert.ok(container.textContent?.includes(responses[task.id]))
    await click('Try Again')
    assert.equal(storage.getItem(singleKey), null)

    const history = [{ role: 'examiner', text: 'What do you enjoy?' }, { role: 'candidate', text: 'I enjoy reading books at home.' }] as const
    const speaking: SpeakingEvaluation = { overallBand: 7, fluencyBand: 7, lexicalBand: 7, grammarBand: 7, pronunciationBand: 7, source: 'ai', assessmentMode: 'audio', summary: 'Saved speaking feedback.', strengths: [], weaknesses: [], improvementPriorities: [], stats: analyseTranscript(history[1].text, 20) }
    storage.setItem('profai:speaking:examiner:test:review-recovery', JSON.stringify({ phase: 'result', evaluation: speaking, history, answers: [speaking.stats], chat: [], stages: [], stageIndex: 0, moveIndex: 0, audioKey: 'saved-audio' }))
    apiClient.post = (async () => { throw new Error('A saved Speaking review must not need the network') }) as typeof apiClient.post
    await mount(<ExaminerSession sessionId="review-recovery" modeLabel="Speaking Full Test 1" config={{ mode: 'full_mock' }} onExit={() => {}} onSaved={() => { throw new Error('Reload must not duplicate progress rewards') }} />)
    assert.ok(container.textContent?.includes(speaking.summary))
    assert.ok(container.textContent?.includes(history[1].text))
    assert.equal(container.textContent?.includes('Connecting your microphone'), false)
    console.log('PASS: bounded assessments, criterion bands, IELTS rounding, partial Writing retries, reload recovery, retakes and saved Speaking review without network or microphone')
  } finally {
    apiClient.post = originalPost
    await act(async () => root.unmount())
    localStorage.clear()
  }
}
