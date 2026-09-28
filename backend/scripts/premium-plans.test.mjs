import test from 'node:test'
import assert from 'node:assert/strict'
import { extendPremiumExpiry, PREMIUM_PLANS } from '../dist/utils/premiumPlans.js'

test('premium prices stay positive and longer plans cost less per month', () => {
  assert.equal(PREMIUM_PLANS.MONTHLY.amountUzs, 79000)
  assert.ok(PREMIUM_PLANS.QUARTERLY.amountUzs / 3 < PREMIUM_PLANS.MONTHLY.amountUzs)
  assert.ok(PREMIUM_PLANS.YEARLY.amountUzs / 12 < PREMIUM_PLANS.QUARTERLY.amountUzs / 3)
})

test('a monthly grant clamps the final day in shorter months', () => {
  assert.equal(extendPremiumExpiry('MONTHLY', null, new Date('2027-01-31T12:00:00Z')).toISOString(), '2027-02-28T12:00:00.000Z')
})

test('a renewal extends an active grant rather than starting over', () => {
  assert.equal(extendPremiumExpiry('QUARTERLY', new Date('2027-05-15T00:00:00Z'), new Date('2027-04-01T00:00:00Z')).toISOString(), '2027-08-15T00:00:00.000Z')
})
