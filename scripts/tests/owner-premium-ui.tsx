import assert from 'node:assert/strict'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import OwnerPremiumUser, { type ManagedUser, type PremiumGrantInput } from '@/components/owner/OwnerPremiumUser'

const event = { id: 'gift', source: 'LAUNCH_GIFT', plan: 'PRO_1', months: 1, days: null,
  createdAt: '2026-11-10T14:05:00Z', startsAt: '2026-11-10T14:05:00Z', expiresAt: '2026-12-10T14:05:00Z', expiryKnown: true, historical: false,
  actorId: null, actorName: null, actorEmail: null, promoCode: null, giftRank: 181, currency: null, amountMinor: null, discountPercent: null, promoDiscountMinor: null, wheelSpinId: null, method: null, revokedAt: null }
const learner: ManagedUser = { id: 'u', fullName: 'Learner', email: 'learner@example.test', nickname: null, createdAt: '2026-11-10T14:00:00Z', fixedPremium: false,
  access: { active: true, tier: 'PRO', startsAt: event.startsAt, expiresAt: event.expiresAt }, premiumStatus: 'ACTIVE', premiumPeriods: [{ plan: 'PRO_1', startsAt: event.startsAt, expiresAt: event.expiresAt }], premiumHistory: [event], launchGift: null }

export async function run() {
  const element = document.getElementById('root')!
  const root = createRoot(element)
  const grants: PremiumGrantInput[] = []
  let revoked = 0
  const render = async (person = learner, language: 'en' | 'uz' | 'ru' = 'en') => {
    await act(async () => root.render(<div className="owner-dashboard"><OwnerPremiumUser person={person} language={language} busy={false} onGrant={(_, input) => grants.push(input)} onRevoke={() => { revoked++ }} /></div>))
  }
  const select = async (label: string, value: string) => {
    const node = element.querySelector<HTMLSelectElement>(`select[aria-label="${label}"]`)!
    assert.ok(node)
    await act(async () => { node.value = value; node.dispatchEvent(new Event('change', { bubbles: true })) })
  }
  const submit = async () => { await act(async () => element.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))) }
  try {
    await render()
    assert.match(element.querySelector('.owner-premium-status')!.textContent!, /Premium active/)
    assert.doesNotMatch(element.textContent!, /No Premium/)
    assert.match(element.textContent!, /Automatic gift #181/)
    assert.match(element.querySelector('.owner-premium-summary')!.textContent!, /Nov 10, 2026, 7:05 PM/, 'timestamps use Tashkent time')
    assert.match(element.textContent!, /Dec 10, 2026/)
    const options = [...element.querySelectorAll<HTMLSelectElement>('select')[0].options]
    assert.equal(options.length, 7, 'six distinct plan/duration choices plus unlimited')
    assert.deepEqual(options.map(option => option.textContent), ['Pro · 1 month', 'Pro · 3 months', 'Pro · 12 months', 'Elite · 1 month', 'Elite · 3 months', 'Elite · 12 months', 'Elite · Indefinitely'])
    assert.ok(options.every(option => !/PRO_|MAX_|\$/.test(option.textContent!)))
    await submit(); assert.deepEqual(grants.pop(), { plan: 'PRO_1', source: 'OWNER' })
    await select('Premium duration for learner@example.test', 'MAX_3')
    await select('Grant type for learner@example.test', 'PAYMENT')
    assert.equal(element.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled, true)
    const amount = element.querySelector<HTMLInputElement>('input[type="number"]')!
    await act(async () => {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!.call(amount, '150000')
      amount.dispatchEvent(new Event('input', { bubbles: true }))
    })
    assert.equal(element.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled, false)
    await submit(); assert.deepEqual(grants.pop(), { plan: 'MAX_3', source: 'PAYMENT', amountUzs: 150000 })
    await act(async () => [...element.querySelectorAll('button')].find(node => node.textContent === 'Revoke')!.click())
    assert.equal(revoked, 1)
    const paid: ManagedUser = { ...learner, access: { ...learner.access, tier: 'MAX' }, premiumHistory: [{ ...event, id: 'paid', source: 'PAYMENT', plan: 'MAX_3', months: 3, actorId: 'admin', actorName: 'Premium Admin', actorEmail: 'admin@example.test', promoCode: 'SAVE20', discountPercent: 28, promoDiscountMinor: 600, wheelSpinId: 'wheel-10', currency: 'USD', amountMinor: 2399, method: 'CARD_TRANSFER' }, event] }
    await render(paid)
    for (const text of ['Paid subscription', 'Premium Admin', 'admin@example.test', 'SAVE20', '28%', 'USD 6.00', 'USD 23.99', 'wheel-10', 'Earlier Premium history']) assert.ok(element.textContent!.includes(text), text)
    assert.equal(element.querySelectorAll('.owner-premium-event').length, 2)
    await render(paid, 'uz')
    for (const text of ['Premium faol', 'Pullik obuna', 'Berilgan:', 'Kim bergan:', 'Promokod chegirmasi', 'Elite · 3 oy']) assert.ok(element.textContent!.includes(text), text)
    await render({ ...learner, access: { ...learner.access, active: false, tier: 'FREE' }, premiumStatus: 'EXPIRED' })
    assert.match(element.querySelector('.owner-premium-status')!.textContent!, /Premium expired/)
    assert.equal([...element.querySelectorAll('button')].some(node => node.textContent === 'Revoke'), false)
    await render({ ...learner, access: { active: false, tier: 'FREE', startsAt: null, expiresAt: null }, premiumStatus: 'NONE', premiumHistory: [], premiumPeriods: [], launchGift: { rank: 190, claimedAt: null } })
    assert.match(element.textContent!, /No Premium/); assert.match(element.textContent!, /Gift #190 reserved, not claimed/)
    assert.match(element.querySelector('.owner-premium-summary')!.textContent!, /Free/)
    console.log('PASS premium management: accurate status, distinct durations, gift rank, Tashkent dates, admin identity, paid grants, promo and wheel discounts, history, expired and reserved accounts, Uzbek')
  } finally { await act(async () => root.unmount()) }
}
