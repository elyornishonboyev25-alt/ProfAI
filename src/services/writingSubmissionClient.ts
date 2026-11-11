import { ApiError, apiClient } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import type { WritingEvaluation } from '@/services/geminiAI'

export type WritingProgress = { stage: 'saving' | 'queued' | 'processing' | 'waiting' | 'reconnecting'; saved: boolean }
export type WritingSubmissionOptions = { signal?: AbortSignal; onProgress?: (progress: WritingProgress) => void }
type Submission = { id: string; status: string; result?: WritingEvaluation; retryAfterMs?: number }
type Input = { taskType: 'task1' | 'task2'; prompt: string; response: string; visualContext?: string }

function wait(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const abort = () => { clearTimeout(timer); signal?.removeEventListener('abort', abort); reject(signal?.reason ?? new DOMException('Aborted', 'AbortError')) }
    const timer = setTimeout(() => { signal?.removeEventListener('abort', abort); resolve() }, ms)
    if (signal?.aborted) abort()
    else signal?.addEventListener('abort', abort, { once: true })
  })
}

export async function waitForWritingAssessment(input: Input, options: WritingSubmissionOptions = {}): Promise<WritingEvaluation> {
  const owner = useAuthStore.getState().user?.id
  let submission: Submission | undefined
  let failures = 0
  const progress = (stage: WritingProgress['stage']) => options.onProgress?.({ stage, saved: Boolean(submission?.id) })
  for (;;) {
    options.signal?.throwIfAborted()
    if (useAuthStore.getState().user?.id !== owner) throw new ApiError('Account changed.', 409)
    try {
      if (!submission) progress('saving')
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 20_000)
      const abort = () => controller.abort(options.signal?.reason)
      options.signal?.addEventListener('abort', abort, { once: true })
      try {
        submission = submission
          ? await apiClient.get<Submission>(`/ai/generate/writing/submissions/${encodeURIComponent(submission.id)}`, { signal: controller.signal, expectedUserId: owner })
          : await apiClient.post<Submission>('/ai/generate/writing/submissions', input, { signal: controller.signal, expectedUserId: owner })
      } finally { clearTimeout(timeout); options.signal?.removeEventListener('abort', abort) }
      failures = 0
      if (submission.status === 'COMPLETED' && submission.result) return submission.result
      progress(submission.status === 'PROCESSING' ? 'processing' : submission.status === 'WAITING_CONFIGURATION' ? 'waiting' : 'queued')
      await wait(Math.max(1000, Math.min(30_000, submission.retryAfterMs ?? 3000)), options.signal)
    } catch (error) {
      options.signal?.throwIfAborted()
      // Authentication, changed accounts and invalid input require an explicit
      // action. Network outages, capacity and HTTP 429/5xx keep saved work alive.
      if (error instanceof ApiError && error.status < 500 && ![408, 429].includes(error.status)) throw error
      progress('reconnecting')
      await wait(Math.min(30_000, 2000 * 2 ** Math.min(failures++, 4)), options.signal)
    }
  }
}
