import { createHash } from 'node:crypto'
import { prisma } from '../lib/prisma.js'
import { groundedObservations, type LearningObservation } from './novaLearning.js'

type Evidence = Omit<LearningObservation, 'misconception' | 'nextExercise' | 'outcome' | 'assistance'> & { outcome: string; assistance: string; misconception?: string | null; nextExercise?: string | null } & { id?: string; sourceTurnId: string; observedAt: Date | string }
export function summarizeSkillEvidence(rows: Evidence[]) {
  const grouped = new Map<string, Evidence[]>()
  for (const row of rows) {
    const group = grouped.get(row.topicKey) ?? []
    if (!group.some(entry => entry.sourceTurnId === row.sourceTurnId)) group.push(row)
    grouped.set(row.topicKey, group)
  }
  return [...grouped].map(([topicKey, entries]) => {
    const recent = entries.sort((a, b) => +new Date(b.observedAt) - +new Date(a.observedAt)).slice(0, 12)
    const independent = recent.filter(entry => entry.assistance === 'independent')
    const successes = independent.filter(entry => entry.outcome === 'correct').length
    const mistakes = new Map<string, number>()
    for (const row of recent) if (row.outcome === 'incorrect' && row.misconception) {
      const key = row.misconception.toLowerCase().trim(); mistakes.set(key, (mistakes.get(key) ?? 0) + 1)
    }
    const repeatedMistakes = [...mistakes].filter(([, count]) => count >= 2).map(([description, count]) => ({ description, count }))
    return { topicKey, topic: recent[0].topic, evidenceCount: recent.length, independentAttempts: independent.length,
      status: successes >= 3 && successes / independent.length >= .75 && recent[0].outcome === 'correct' ? 'consistent' : repeatedMistakes.length ? 'needs_practice' : 'developing',
      confidence: Math.min(.85, recent.reduce((sum, row) => sum + row.confidence, 0) / recent.length * Math.min(1, recent.length / 4)),
      repeatedMistakes, lastPractice: recent[0], nextExercise: recent[0].nextExercise ?? null,
      provenance: 'model_assessment_of_quoted_work',
    }
  })
}

export function sourceTurnId(userId: string, threadId: string | undefined, turnId: string | undefined, message: string, history: unknown = []) {
  return createHash('sha256').update(JSON.stringify([userId, threadId ?? null, turnId ?? [message, history]])).digest('hex')
}
export async function saveLearningEvidence(userId: string, source: string, observations: unknown,
  context: { threadId?: string; turnId?: string; history?: unknown; signal?: AbortSignal } = {}, db = prisma) {
  const grounded = groundedObservations(observations, source)
  context.signal?.throwIfAborted()
  const id = sourceTurnId(userId, context.threadId, context.turnId, source, context.history)
  const rows = []
  const observedAt = new Date()
  for (const observation of grounded) {
    context.signal?.throwIfAborted()
    rows.push(await db.novaSkillEvidence.upsert({
      where: { userId_sourceTurnId_topicKey: { userId, sourceTurnId: id, topicKey: observation.topicKey } },
      create: { userId, sourceTurnId: id, sourceThreadId: context.threadId, observedAt, ...observation }, update: {},
    }))
  }
  return rows
}
export async function loadSkillEvidence(userId: string, db = prisma) {
  return db.novaSkillEvidence.findMany({ where: { userId }, orderBy: { observedAt: 'desc' }, take: 80 })
}
export function relevantSkills(rows: Evidence[], query: string, topic = '') {
  const tokens = `${query} ${topic}`.toLowerCase().match(/[\p{L}\p{N}_]{3,}/gu) ?? []
  return summarizeSkillEvidence(rows).map(skill => ({ skill, score: tokens.filter(token => `${skill.topicKey} ${skill.topic}`.toLowerCase().includes(token)).length }))
    .sort((a, b) => b.score - a.score).filter(entry => entry.score > 0).slice(0, 6).map(entry => entry.skill)
}
