import { createHash, randomUUID } from 'node:crypto'
import { Prisma, type WritingSubmission } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { env } from '../config/env.js'
import { AiGenerationError } from './aiProvider.service.js'
import { assessWriting, writingRequestSchema, type WritingCheckpoint } from './writingAssessment.service.js'

const RUBRIC_VERSION = 'ielts-public-2023-writing-v2'
type Input = ReturnType<typeof writingRequestSchema.parse>

export function writingFingerprint(input: Input) {
  return createHash('sha256').update(JSON.stringify([RUBRIC_VERSION, input.taskType, input.prompt, input.response, input.visualContext ?? ''])).digest('hex')
}

export function writingRetry(error: unknown, attempts: number) {
  const code = error instanceof AiGenerationError ? error.code : 'WRITING_WORKER_INTERRUPTED'
  const configuration = ['AI_NOT_CONFIGURED', 'GEMINI_QUOTA_UNAVAILABLE', 'GEMINI_400', 'GEMINI_401', 'GEMINI_403', 'GEMINI_404', 'OPENAI_401', 'OPENAI_402', 'OPENAI_403', 'HF_401', 'HF_402', 'HF_403'].includes(code)
  const wait = Math.min(900_000, 5000 * 2 ** Math.min(attempts - 1, 8))
  const retryAfter = error instanceof AiGenerationError ? error.retryAfterMs : 0
  return { code, status: configuration ? 'WAITING_CONFIGURATION' : 'QUEUED', delayMs: (configuration ? 300_000 : Math.max(wait, retryAfter)) + Math.round(Math.random() * 1000) }
}

export function publicWritingSubmission(row: WritingSubmission) {
  return { id: row.id, status: row.status, createdAt: row.createdAt.toISOString(), nextAttemptAt: row.nextAttemptAt.toISOString(),
    ...(row.status === 'COMPLETED' ? { result: row.result } : {}),
    // No provider error or submitted text in polling responses.
    retryAfterMs: row.status === 'PROCESSING' ? 3000 : Math.max(3000, Math.min(30_000, row.nextAttemptAt.getTime() - Date.now())),
  }
}

export async function submitWriting(userId: string, raw: unknown) {
  const input = writingRequestSchema.parse(raw)
  // An exact resubmission reuses both work and the resulting band. Two tabs or
  // an ambiguous POST timeout cannot create duplicate paid assessments.
  const row = await prisma.writingSubmission.upsert({ where: { userId_fingerprint: { userId, fingerprint: writingFingerprint(input) } },
    create: { userId, fingerprint: writingFingerprint(input), input }, update: {},
  })
  wakeWritingWorker()
  return publicWritingSubmission(row)
}

export async function getWritingSubmission(userId: string, id: string) {
  const row = await prisma.writingSubmission.findFirst({ where: { id, userId } })
  return row ? publicWritingSubmission(row) : null
}

let interval: ReturnType<typeof setInterval> | undefined
let stopping = false
let draining = false
const running = new Map<string, { controller: AbortController; promise: Promise<void> }>()

async function runSubmission(row: WritingSubmission, token: string, signal: AbortSignal) {
  const owned = { id: row.id, lockToken: token, status: 'PROCESSING' }
  try {
    const input = writingRequestSchema.parse(row.input)
    const result = await assessWriting(row.userId, input, signal, {
      checkpoint: row.checkpoint as unknown as WritingCheckpoint | undefined,
      onCheckpoint: async checkpoint => {
        const saved = await prisma.writingSubmission.updateMany({ where: owned, data: { checkpoint: checkpoint as unknown as Prisma.InputJsonValue } })
        if (!saved.count) throw new Error('Writing assessment lease changed')
      },
    })
    await prisma.writingSubmission.updateMany({ where: owned, data: { status: 'COMPLETED', result: result as unknown as Prisma.InputJsonValue,
      checkpoint: Prisma.DbNull, lastErrorCode: null, leaseUntil: null, lockToken: null, completedAt: new Date() } })
  } catch (error) {
    const retry = writingRetry(error, row.attempts + 1)
    await prisma.writingSubmission.updateMany({ where: owned, data: { status: retry.status, nextAttemptAt: new Date(Date.now() + (signal.aborted ? 0 : retry.delayMs)),
      lastErrorCode: retry.code, leaseUntil: null, lockToken: null } })
    console.warn('Writing assessment rescheduled', { submissionId: row.id, code: retry.code, attempt: row.attempts + 1 })
  }
}

export async function drainWritingSubmissions() {
  if (stopping || draining || running.size >= env.WRITING_WORKER_CONCURRENCY) return
  draining = true
  try {
    const now = new Date()
    const eligible = { OR: [
      { status: { in: ['QUEUED', 'WAITING_CONFIGURATION'] }, nextAttemptAt: { lte: now } },
      { status: 'PROCESSING', leaseUntil: { lte: now } },
    ] }
    const rows = await prisma.writingSubmission.findMany({ where: eligible, orderBy: { nextAttemptAt: 'asc' }, take: 8 })
    for (const row of rows) {
      if (stopping || running.size >= env.WRITING_WORKER_CONCURRENCY) break
      if (running.has(row.id)) continue
      const token = randomUUID()
      // Compare-and-swap also protects against another Railway replica claiming
      // this job. Only the lease owner may checkpoint or complete it.
      const claim = await prisma.writingSubmission.updateMany({ where: { id: row.id, ...eligible }, data: {
        status: 'PROCESSING', lockToken: token, leaseUntil: new Date(Date.now() + 300_000), attempts: { increment: 1 },
      } })
      if (!claim.count) continue
      if (stopping) {
        await prisma.writingSubmission.updateMany({ where: { id: row.id, lockToken: token }, data: { status: 'QUEUED', lockToken: null, leaseUntil: null, nextAttemptAt: new Date() } })
        break
      }
      const controller = new AbortController()
      const promise = runSubmission(row, token, controller.signal)
        .catch(() => console.error('Writing worker persistence unavailable', { submissionId: row.id }))
        .finally(() => { running.delete(row.id); wakeWritingWorker() })
      running.set(row.id, { controller, promise })
    }
  } catch {
    // A temporary database outage must not crash the process or lose a lease.
    console.error('Writing queue temporarily unavailable')
  } finally { draining = false }
}

function wakeWritingWorker() { if (interval && !stopping) void drainWritingSubmissions() }

export function startWritingAssessmentWorker() {
  if (interval) return
  stopping = false
  interval = setInterval(() => void drainWritingSubmissions(), 5000)
  interval.unref()
  // New credentials on a deployment should resume configuration-blocked work.
  void prisma.writingSubmission.updateMany({ where: { status: 'WAITING_CONFIGURATION' }, data: { nextAttemptAt: new Date() } })
    .then(() => drainWritingSubmissions()).catch(() => console.error('Writing queue startup deferred'))
}

export async function stopWritingAssessmentWorker() {
  stopping = true
  clearInterval(interval); interval = undefined
  for (const job of running.values()) job.controller.abort()
  await Promise.allSettled([...running.values()].map(job => job.promise))
}
