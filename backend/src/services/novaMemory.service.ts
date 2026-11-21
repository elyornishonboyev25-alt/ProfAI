import { prisma } from '../lib/prisma.js'
import { z } from 'zod'

export const memoryEntrySchema = z.object({ key: z.string().trim().regex(/^[a-z][a-z0-9_]{1,63}$/), value: z.string().trim().min(1).max(600) }).strict()
const transient = /^(?:(?:current|temporary|reply)_)?(?:emotion|mood|expression|performance|anger|tone|space_pressed|ptt|speaking|listening|voice_state)$/
export function safeMemory(entry: unknown) {
  const parsed = memoryEntrySchema.safeParse(entry)
  if (parsed.success && /^(?:conversation_language|language_preference|preferred_language)$/.test(parsed.data.key)) {
    const language = ({ uz: 'uz', uzbek: 'uz', "o'zbekcha": 'uz', 'o‘zbekcha': 'uz', en: 'en', english: 'en', inglizcha: 'en', ru: 'ru', russian: 'ru', ruscha: 'ru', русский: 'ru' } as Record<string, string>)[parsed.data.value.toLowerCase()]
    if (!language) return null
    parsed.data.value = language
  }
  return parsed.success && !transient.test(parsed.data.key) && !/password|api.?key|token|secret|card_number/i.test(parsed.data.key)
    && !/(?:sk-[A-Za-z0-9_-]{12,}|AIza[A-Za-z0-9_-]{20,})/.test(parsed.data.value) ? parsed.data : null
}
export function canonicalMemoryKey(key: string, value = '') {
  if (key === 'target_score' && /ielts/i.test(value)) return 'ielts_target_score'
  if (key === 'target_score' && /sat/i.test(value)) return 'sat_target_score'
  const groups: Record<string, string> = {
    address_form: 'address_preference', preferred_address: 'address_preference', address_preference: 'address_preference',
    humour_preference: 'humor_preference', banter_preference: 'humor_preference', roast_preference: 'humor_preference',
    teaching_style: 'explanation_preference', explanation_style: 'explanation_preference',
    ielts_target: 'ielts_target_score', target_ielts_score: 'ielts_target_score',
  }
  return groups[key] ?? key
}
type MemoryRecord = { id?: string; key: string; value: string; category?: string; origin?: string; updatedAt?: Date | string; expiresAt?: Date | string | null; supersededAt?: Date | string | null; revision?: number; sourceQuote?: string | null }
export function memoryRevisionSnapshot(rows: MemoryRecord[]) {
  const result = new Map<string, number>()
  for (const row of [...rows].sort((a, b) => +new Date(b.updatedAt ?? 0) - +new Date(a.updatedAt ?? 0))) {
    const key = canonicalMemoryKey(row.key, row.value)
    if (!result.has(key)) result.set(key, row.revision ?? 1)
  }
  return result
}
export function relevantMemories(rows: MemoryRecord[], query: string, now = new Date(), limit = 8) {
  const latest = new Map<string, MemoryRecord>()
  for (const row of rows) {
    if (row.supersededAt || (row.expiresAt && +new Date(row.expiresAt) <= +now)) continue
    const key = canonicalMemoryKey(row.key, row.value), previous = latest.get(key)
    if (!previous || +new Date(row.updatedAt ?? 0) > +new Date(previous.updatedAt ?? 0)) latest.set(key, { ...row, key })
  }
  const tokens = query.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) ?? []
  const askingGoals = /maqsad|reja|goal|target|цель|цел[ьи]|план/iu.test(query)
  return [...latest.values()].map(row => {
    const preference = /preference|preferred_name|address|humor|explanation/.test(row.key) || row.category === 'preference'
    const goal = askingGoals && (row.category === 'goal' || /goal|target|exam_date/.test(row.key))
    const score = (preference ? 5 : 0) + (goal ? 3 : 0) + tokens.filter(token => `${row.key.replace(/_/g, ' ')} ${row.value}`.toLowerCase().includes(token)).length * 2
    return { row, score }
  }).filter(entry => entry.score > 0).sort((a, b) => b.score - a.score || +new Date(b.row.updatedAt ?? 0) - +new Date(a.row.updatedAt ?? 0))
    .slice(0, limit).map(({ row }) => ({ key: row.key, value: row.value, origin: row.origin ?? 'legacy_user_record', updatedAt: row.updatedAt ?? null,
      revision: row.revision ?? 1, category: row.category ?? 'fact' }))
}
export class MemoryConflict extends Error { constructor() { super('This memory changed. Reload it before saving again.') } }
export class InvalidMemory extends Error { constructor() { super('Use a study preference or fact without credentials or temporary emotions.') } }
export async function saveNovaMemories(userId: string, entries: Array<{ key: string; value: string }>,
  context: { threadId?: string; sourceQuote?: string; origin?: 'user' | 'model'; signal?: AbortSignal; expected?: Map<string, number> } = {}, db = prisma) {
  const result = []
  for (const candidate of entries) {
    const entry = safeMemory(candidate)
    if (!entry) continue
    context.signal?.throwIfAborted()
    const key = canonicalMemoryKey(entry.key, entry.value)
    const saved = await db.$transaction(async tx => {
      let existing = await tx.aiMemory.findUnique({ where: { userId_key: { userId, key } } })
      if (!existing && (context.expected?.get(key) ?? 0) > 0) existing = (await tx.aiMemory.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' }, take: 100 })).find(row => canonicalMemoryKey(row.key, row.value) === key) ?? null
      context.signal?.throwIfAborted()
      const expected = context.expected ? context.expected.get(key) ?? 0 : undefined
      if (existing && expected !== undefined && existing.revision !== expected) return null
      const data = { value: entry.value, origin: context.origin ?? 'user', category: /preference|address|humor|style/.test(key) ? 'preference' : /goal|target|exam_date/.test(key) ? 'goal' : 'fact',
        sourceThreadId: context.threadId, sourceQuote: context.sourceQuote?.slice(0, 600), supersededAt: null, expiresAt: null }
      if (!existing) {
        // A missing snapshot is distinct from an unseen later user edit.
        if (expected !== undefined && expected > 0) return null
        return tx.aiMemory.create({ data: { userId, key, ...data } })
      }
      if (existing.value === entry.value) return existing
      const history = Array.isArray(existing.previousValues) ? existing.previousValues.slice(-4) : []
      const updated = await tx.aiMemory.updateMany({ where: { id: existing.id, userId, revision: existing.revision },
        data: { ...data, revision: { increment: 1 }, previousValues: [...history, { value: existing.value, replacedAt: new Date().toISOString(), origin: existing.origin }] } })
      return updated.count ? tx.aiMemory.findUnique({ where: { id: existing.id } }) : null
    })
    if (saved) result.push(saved)
  }
  return result
}
export async function editNovaMemory(userId: string, id: string, value: string, revision: number, db = prisma) {
  return db.$transaction(async tx => {
    const memory = await tx.aiMemory.findFirst({ where: { id, userId } })
    if (!memory) return null
    if (!safeMemory({ key: memory.key, value })) throw new InvalidMemory()
    if (memory.revision !== revision) throw new MemoryConflict()
    const history = Array.isArray(memory.previousValues) ? memory.previousValues.slice(-4) : []
    const updated = await tx.aiMemory.updateMany({ where: { id, userId, revision }, data: { value, origin: 'user', revision: { increment: 1 },
      previousValues: [...history, { value: memory.value, replacedAt: new Date().toISOString(), origin: memory.origin }], supersededAt: null, expiresAt: null } })
    if (!updated.count) throw new MemoryConflict()
    return tx.aiMemory.findFirst({ where: { id, userId } })
  })
}
