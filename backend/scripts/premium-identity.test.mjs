import assert from 'node:assert/strict'
import test from 'node:test'
import { hasPremiumIdentity } from '../dist/utils/premiumIdentity.js'

const now = new Date('2026-10-11T12:00:00Z')
const before = new Date(now.getTime() - 1000)
const after = new Date(now.getTime() + 1000)
const user = { role: 'USER', email: 'learner@example.test', nickname: 'learner', premiumGrant: null, billingSubscriptions: [] }

test('Premium identity follows active paid access, excluding trials, future and expired plans', () => {
  assert.equal(hasPremiumIdentity(user, now), false)
  assert.equal(hasPremiumIdentity({ ...user, role: 'ADMIN' }, now), true)
  assert.equal(hasPremiumIdentity({ ...user, nickname: 'firdavs' }, now), true)
  for (const [startsAt, expiresAt, expected] of [[before, after, true], [before, now, false], [after, after, false]]) {
    assert.equal(hasPremiumIdentity({ ...user, billingSubscriptions: [{ startsAt, expiresAt }] }, now), expected)
    assert.equal(hasPremiumIdentity({ ...user, premiumGrant: { plan: 'PREMIUM', source: 'ADMIN', startsAt, expiresAt } }, now), expected)
  }
  const trial = { plan: 'TRIAL_7', source: 'SELECTED_ACCESS', startsAt: before, expiresAt: after }
  assert.equal(hasPremiumIdentity({ ...user, premiumGrant: trial }, now), false)
  assert.equal(hasPremiumIdentity({ ...user, nickname: 'firdavs', premiumGrant: trial }, now), false)
  assert.equal(hasPremiumIdentity({ ...user, premiumGrant: trial, billingSubscriptions: [{ startsAt: before, expiresAt: after }] }, now), true)
  assert.equal(hasPremiumIdentity({ ...user, premiumGrant: { ...trial, plan: 'UNLIMITED', expiresAt: null } }, now), true)
})
