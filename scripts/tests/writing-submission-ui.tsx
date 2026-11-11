import assert from 'node:assert/strict'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { apiClient, ApiError } from '@/lib/apiClient'
import { evaluateWriting } from '@/services/geminiAI'
import { waitForWritingAssessment } from '@/services/writingSubmissionClient'
import WritingSubmissionPending from '@/components/writing/WritingSubmissionPending'
import i18n from '@/i18n'

export async function run() {
  const originalPost = apiClient.post, originalGet = apiClient.get
  const root = createRoot(document.getElementById('root')!)
  const input = { taskType: 'task2' as const, prompt: 'A question', response: 'The original submitted response.' }
  const result = { overallBand: 9, taskAchievement: 6, coherenceCohesion: 6, lexicalResource: 7, grammaticalRange: 7, summary: 'Evidence-based practice assessment.', errors: [], strengths: [], improvements: [], correctedVersion: input.response, xpAwarded: 0 }
  try {
    await i18n.changeLanguage('en')
    let posts = 0, polls = 0
    apiClient.post = (async (path: string) => { posts++; assert.equal(path, '/ai/generate/writing/submissions'); return { id: 'saved-job', status: 'QUEUED', retryAfterMs: 0 } }) as typeof apiClient.post
    apiClient.get = (async (path: string) => {
      polls++; assert.equal(path, '/ai/generate/writing/submissions/saved-job')
      return polls === 1 ? { id: 'saved-job', status: 'WAITING_CONFIGURATION', retryAfterMs: 0 } : { id: 'saved-job', status: 'COMPLETED', result }
    }) as typeof apiClient.get
    const progress: string[] = []
    const checked = await evaluateWriting('task2', input.prompt, input.response, 4, undefined, { onProgress: p => progress.push(p.stage) })
    assert.equal(checked.overallBand, 6.5, 'A completed job still validates and computes the criterion average')
    assert.equal(posts, 1, 'Polling cannot resubmit or spend a second assessment')
    assert.equal(polls, 2)
    assert.ok(progress.includes('queued') && progress.includes('waiting'))

    const controller = new AbortController()
    apiClient.post = (async () => { throw new ApiError('Unavailable', 503) }) as typeof apiClient.post
    await assert.rejects(waitForWritingAssessment(input, { signal: controller.signal, onProgress: p => { if (p.stage === 'reconnecting') controller.abort() } }), error => (error as Error).name === 'AbortError')

    apiClient.post = (async () => { throw new ApiError('Login required', 401) }) as typeof apiClient.post
    await assert.rejects(waitForWritingAssessment(input), { status: 401 }, 'Authentication problems must not spin forever')

    await act(async () => root.render(<WritingSubmissionPending progress={{ stage: 'reconnecting', saved: false }} onLeave={() => {}} />))
    assert.equal(document.querySelector('button'), null, 'Leaving is only offered after server acceptance')
    assert.ok(document.body.textContent?.includes('Keep this page open'))
    await act(async () => root.render(<WritingSubmissionPending progress={{ stage: 'waiting', saved: true }} onLeave={() => {}} />))
    assert.ok(document.body.textContent?.includes('Your Writing is safely saved'))
    assert.ok(document.querySelector('button'))
    assert.equal(document.body.textContent?.includes('6.5'), false, 'Queued work has no invented band')
    console.log('PASS: accepted submissions, configuration waiting, polling without resubmission, cancellation, authentication and honest pending UI')
  } finally { apiClient.post = originalPost; apiClient.get = originalGet; await act(async () => root.unmount()) }
}
