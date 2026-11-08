import test from 'node:test'
import assert from 'node:assert/strict'
process.env.DATABASE_URL ||= 'postgresql://test:test@localhost:5432/test'
process.env.ACCESS_TOKEN_SECRET ||= 'voice-test-access-secret-only'
process.env.REFRESH_TOKEN_SECRET ||= 'voice-test-refresh-secret-only'
const { prisma } = await import('../dist/lib/prisma.js')
const { reserveVoiceTime, settleVoiceTime, voiceUsageSnapshot, voiceWindow, requireLiveSession } = await import('../dist/services/voiceAllowance.service.js')
const { PLAN_QUOTAS } = await import('../dist/utils/billingCatalog.js')
const { remainingPercent } = await import('../dist/utils/studyAccess.js')
let state
const reset = (tier = 'PRO') => { state = { tier, sessions: [], usage: new Map(), expiresAt: new Date('2099-01-01') } }
reset()
const key = value => `${value.feature}:${value.period}`
const matches = (row, where) => row.userId === where.userId && (!where.id || row.id === where.id) && (where.endedAt !== null || row.endedAt === null)
  && (!where.expiresAt?.gt || row.expiresAt > where.expiresAt.gt)
const tx = {
  $queryRaw: async () => [],
  user: { findUniqueOrThrow: async () => ({ role: 'USER', email: 'voice@example.com' }) },
  premiumGrant: { findUnique: async () => null },
  billingSubscription: { findMany: async ({ where }) => state.tier === 'FREE' || state.expiresAt <= where.expiresAt.gt ? [] : [{ audience: state.tier, startsAt: new Date(0), expiresAt: state.expiresAt }] },
  featureUsage: {
    findUnique: async ({ where }) => ({ count: state.usage.get(key(where.userId_feature_period)) ?? 0 }),
    findMany: async ({ where }) => [...state.usage].map(([id, count]) => { const [feature, period] = id.split(':'); return { feature, period, count } })
      .filter(row => where.OR.some(part => part.feature === row.feature && part.period === row.period)),
    upsert: async ({ where, create, update }) => { const id = key(where.userId_feature_period); const count = state.usage.has(id) ? state.usage.get(id) + update.count.increment : create.count; state.usage.set(id, count); return { count } },
    updateMany: async ({ where, data }) => { const id = key(where); if ((state.usage.get(id) ?? 0) < where.count.gte) return { count: 0 }; state.usage.set(id, state.usage.get(id) - data.count.decrement); return { count: 1 } },
  },
  voiceAllowanceSession: {
    findFirst: async ({ where }) => state.sessions.find(row => matches(row, where)) ?? null,
    findMany: async ({ where }) => state.sessions.filter(row => matches(row, where)),
    create: async ({ data }) => { const row = { ...data, endedAt: null }; state.sessions.push(row); return { ...row } },
    update: async ({ where, data }) => Object.assign(state.sessions.find(row => row.id === where.id), data),
  },
}
for (const name of ['user', 'premiumGrant', 'billingSubscription', 'featureUsage', 'voiceAllowanceSession']) Object.assign(prisma[name], tx[name])
let queue = Promise.resolve()
prisma.$transaction = work => { const result = queue.then(() => work(tx)); queue = result.catch(() => {}); return result }
const at = new Date('2026-10-15T12:00:00Z')

test('monthly AI capacities stay private while percentages reflect the correct allowance', () => {
  assert.deepEqual(['FREE', 'PRO', 'MAX'].map(tier => PLAN_QUOTAS[tier].ai), [50, 300, 1500])
  assert.deepEqual(['PRO', 'MAX'].map(tier => PLAN_QUOTAS[tier].voice), [108000, 432000])
  assert.equal(remainingPercent(1, 50), 98)
  assert.equal(remainingPercent(150, 300), 50)
  assert.equal(remainingPercent(1500, 1500), 0)
  assert.equal(remainingPercent(9000, 50), 0)
})
test('voice time is bounded by daily, monthly, per-session and calendar deadlines', () => {
  assert.equal(voiceWindow('FREE', 0, 0, at), 0)
  assert.equal(voiceWindow('PRO', 0, 3500, at), 100)
  assert.equal(voiceWindow('PRO', 107950, 0, at), 50)
  assert.equal(voiceWindow('MAX', 0, 14000, at), 400)
  assert.equal(voiceWindow('MAX', 431999, 0, at), 1)
  assert.equal(voiceWindow('PRO', 0, 0, new Date('2026-10-31T23:59:55Z')), 5)
})
test('Free and expired subscriptions cannot reserve Live AI time', async () => {
  reset('FREE')
  await assert.rejects(reserveVoiceTime('u', 1200, at), error => error.code === 'PREMIUM_REQUIRED')
  reset(); state.expiresAt = new Date(at.getTime() - 1)
  await assert.rejects(reserveVoiceTime('u', 1200, at), error => error.code === 'PREMIUM_REQUIRED')
  assert.equal(state.sessions.length, 0)
})
test('concurrent tabs reserve only one call and the same daily/monthly seconds', async () => {
  reset()
  const results = await Promise.allSettled(Array.from({ length: 8 }, () => reserveVoiceTime('u', 1200, at)))
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1)
  assert.ok(results.filter(result => result.status === 'rejected').every(result => result.reason.code === 'VOICE_ALREADY_ACTIVE'))
  assert.equal(state.usage.get('voice:2026-10'), 1200)
  assert.equal(state.usage.get('voice_daily:2026-10-15'), 1200)
})
test('early hangup charges elapsed seconds, refunds unused time exactly once and permits reconnect', async () => {
  reset()
  const session = await reserveVoiceTime('u', 1200, at)
  const after = new Date(at.getTime() + 61000)
  const snapshot = await voiceUsageSnapshot('u', after)
  assert.equal(snapshot.daily.used, 61)
  assert.equal(snapshot.monthly.used, 61)
  await settleVoiceTime('u', session.id, false, after)
  await settleVoiceTime('u', session.id, false, after)
  assert.equal(state.usage.get('voice:2026-10'), 61)
  assert.equal(state.usage.get('voice_daily:2026-10-15'), 61)
  await reserveVoiceTime('u', 1200, after)
  assert.equal(state.usage.get('voice:2026-10'), 1261)
})
test('a failed provider connection refunds both counters fully', async () => {
  reset()
  const session = await reserveVoiceTime('u', 1200, at)
  await settleVoiceTime('u', session.id, true, new Date(at.getTime() + 8000))
  assert.equal(state.usage.get('voice:2026-10'), 0)
  assert.equal(state.usage.get('voice_daily:2026-10-15'), 0)
})
test('daily and monthly exhaustion block the next call without creating a session', async () => {
  reset(); state.usage.set('voice_daily:2026-10-15', 3600)
  await assert.rejects(reserveVoiceTime('u', 1200, at), error => error.code === 'PREMIUM_REQUIRED')
  reset('MAX'); state.usage.set('voice:2026-10', 432000)
  await assert.rejects(reserveVoiceTime('u', 1200, at), error => error.code === 'PREMIUM_REQUIRED')
  assert.equal(state.sessions.length, 0)
})
test('month rollover and plan expiry do not allow time beyond their deadlines', async () => {
  reset()
  const endOfMonth = new Date('2026-10-31T23:59:55Z')
  const session = await reserveVoiceTime('u', 1200, endOfMonth)
  assert.equal(session.reservedSeconds, 5)
  await settleVoiceTime('u', session.id, false, new Date('2026-11-01T00:00:00Z'))
  await reserveVoiceTime('u', 1200, new Date('2026-11-01T00:00:01Z'))
  assert.equal(state.usage.get('voice:2026-10'), 5)
  assert.equal(state.usage.get('voice:2026-11'), 1200)
  assert.equal(state.usage.get('voice_daily:2026-11-01'), 1200)
  reset(); state.expiresAt = new Date(at.getTime() + 30000)
  assert.equal((await reserveVoiceTime('u', 1200, at)).reservedSeconds, 30)
})
test('standard voice cannot bypass admission by posting directly without a live session', async () => {
  reset('FREE')
  await assert.rejects(requireLiveSession('u'), error => error.code === 'PREMIUM_REQUIRED')
})
