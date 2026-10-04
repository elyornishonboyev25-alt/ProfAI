import test from 'node:test'
import assert from 'node:assert/strict'
import { awardActivityXp, calculateActivityXp } from '../dist/services/xpRewards.service.js'

const sources = ['VOCAB_FLASHCARDS', 'VOCAB_MATCHING', 'VOCAB_QUIZ', 'VOCAB_TYPING']

test('every vocabulary game requires at least 80%, without rounding up', () => {
  for (const source of sources) {
    for (const accuracy of [undefined, 0, 79, 79.9, NaN]) {
      assert.equal(calculateActivityXp({ source, accuracy }), 0)
    }
    assert.ok(calculateActivityXp({ source, accuracy: 80 }) > 0)
  }
})

test('failed attempts keep eligibility; each game awards once across days', async () => {
  const events = new Map()
  const user = { xp: 0, level: 1 }
  const client = {
    xpEvent: {
      findUnique: async ({ where }) => events.get(where.userId_eventKey.eventKey),
      findMany: async () => [...events.values()],
      create: async ({ data }) => { events.set(data.eventKey, data); return data },
    },
    user: {
      findUnique: async () => ({ ...user }),
      update: async ({ data }) => {
        if (data.xp) user.xp += data.xp.increment
        if (data.level) user.level = data.level
        return { ...user }
      },
    },
    notification: { create: async () => {} },
  }
  for (const source of sources) {
    const params = { userId: 'learner', eventKey: `topic:${source}`, source, earnedAt: new Date('2026-10-04T12:00:00Z') }
    const failed = await awardActivityXp(client, { ...params, accuracy: 79.9 })
    assert.equal(failed.xpEarned, 0)
    assert.equal(events.size, sources.indexOf(source))
    const first = await awardActivityXp(client, { ...params, accuracy: 80 })
    assert.equal(first.duplicate, false)
    assert.equal(first.xpEarned, calculateActivityXp({ source, accuracy: 80 }))
    const replay = await awardActivityXp(client, { ...params, accuracy: 100, earnedAt: new Date('2026-10-05T12:00:00Z') })
    assert.equal(replay.duplicate, true)
    assert.equal(replay.xpEarned, 0)
    assert.equal(replay.totalXp, first.totalXp)
  }
  assert.equal(events.size, 4)
  assert.equal(user.xp, 12 + 20 + 26 + 30)
})
