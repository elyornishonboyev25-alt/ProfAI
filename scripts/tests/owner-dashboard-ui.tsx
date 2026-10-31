import assert from 'node:assert/strict'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import OwnerDashboard from '@/pages/OwnerDashboard'
import i18n from '@/i18n'
import { installOwnerDashboardFixture } from './owner-dashboard-fixture'

export async function run() {
  await i18n.changeLanguage('en')
  const element = document.getElementById('root')!
  const { fixture, restore } = installOwnerDashboardFixture()
  const root = createRoot(element)
  const settle = async () => { await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)) }) }
  const nav = (index: number) => element.querySelectorAll<HTMLButtonElement>('.owner-navigation button')[index]
  const click = async (button: HTMLButtonElement) => { assert.ok(button); await act(async () => button.click()); await settle() }
  const metric = (index: number) => element.querySelectorAll<HTMLButtonElement>('button.owner-metric')[index]
  const select = async (label: string, value: string) => {
    const node = element.querySelector<HTMLSelectElement>(`select[aria-label="${label}"]`)!
    assert.ok(node, label)
    await act(async () => { node.value = value; node.dispatchEvent(new Event('change', { bubbles: true })) }); await settle()
  }
  const mount = async () => { await act(async () => root.render(<MemoryRouter><OwnerDashboard /></MemoryRouter>)); await settle() }
  try {
    localStorage.removeItem('owner-updates:v1:owner-ui')
    await mount()
    assert.equal(nav(3).querySelector('.owner-update-badge')?.textContent, '1')
    await click(nav(1))
    assert.equal(nav(1).querySelector('.owner-update-badge'), null)
    assert.ok(nav(3).querySelector('.owner-update-badge'))
    assert.equal(JSON.parse(localStorage.getItem('owner-updates:v1:owner-ui')!).users, fixture.checkedAt)
    assert.match(element.querySelector('.owner-users-list')?.textContent ?? '', /All Learner/)
    await click(metric(2))
    assert.match(element.querySelector('.owner-users-list')?.textContent ?? '', /Week Learner 1/)
    const next = [...element.querySelectorAll<HTMLButtonElement>('button')].find(node => node.textContent === 'Next' && !node.closest('[hidden]'))!
    await click(next)
    assert.match(element.querySelector('.owner-users-list')?.textContent ?? '', /Week Learner 2/)
    await click(metric(1))
    assert.match(element.querySelector('.owner-users-list')?.textContent ?? '', /Today Learner/)
    assert.ok(fixture.requests.some(path => path.includes('userPage=1&userPeriod=TODAY')))
    await select('User activity type', 'ACTIVE')
    assert.match(element.querySelector('.owner-users-list')?.textContent ?? '', /Returning Learner/)
    assert.ok(element.querySelector('.owner-users-list')?.textContent?.includes('Last active:'))
    await select('User activity type', 'JOINED')
    fixture.holdPeriod = 'WEEK'
    await click(metric(2))
    assert.equal(element.querySelector('.owner-users-list'), null, 'old rows must not appear under a new period while it loads')
    assert.ok(fixture.finishOverview)
    await click(metric(1))
    await act(async () => fixture.finishOverview!())
    assert.match(element.querySelector('.owner-users-list')?.textContent ?? '', /Today Learner/, 'a late response must not replace the selected period')
    fixture.holdPeriod = ''
    await click(nav(2))
    const payments = element.querySelector('section[aria-labelledby="payment-requests-title"]')!
    assert.match(payments.textContent ?? '', /Amount to payUSD 3.00/)
    assert.match(payments.textContent ?? '', /Discount50%/)
    assert.match(payments.textContent ?? '', /spin-fifty/)
    assert.match(payments.textContent ?? '', /Account promo code: IVYACCOUNT/)
    assert.equal([...payments.querySelectorAll('button')].some(node => node.textContent === 'Approve payment'), false)
    assert.match(element.querySelector('.owner-promotions-list')?.textContent ?? '', /IVYEXAMPLE/)
    assert.match(element.querySelector('.owner-promotions-list')?.textContent ?? '', /7 free days/)
    assert.match(element.querySelector('.owner-promotions-list')?.textContent ?? '', /No payment order yet/)
    await select('Promotion filter', 'DISCOUNTED')
    assert.ok(fixture.requests.some(path => path.includes('promotion=DISCOUNTED')))
    await select('Payment request status', 'APPROVED')
    assert.match(payments.textContent ?? '', /Paid amount39,000 UZS/)
    fixture.checkedAt = '2026-10-31T05:00:00.000Z'
    await act(async () => document.dispatchEvent(new Event('visibilitychange'))); await settle()
    assert.equal(nav(2).querySelector('.owner-update-badge')?.textContent, '2', 'a new event appears without manually refreshing')
    await click(nav(2))
    assert.equal(nav(2).querySelector('.owner-update-badge'), null)
    const cursors = JSON.parse(localStorage.getItem('owner-updates:v1:owner-ui')!)
    assert.equal(cursors.users, '2026-10-31T04:00:00.000Z'); assert.equal(cursors.payments, fixture.checkedAt)
    await act(async () => root.render(<MemoryRouter><OwnerDashboard key="reloaded" /></MemoryRouter>)); await settle()
    assert.equal(nav(2).querySelector('.owner-update-badge'), null, 'read cursors survive remount/reload')
    assert.ok(nav(1).querySelector('.owner-update-badge'), 'other sections retain their own new events')
    await click(nav(2)); await act(async () => i18n.changeLanguage('uz')); await settle()
    assert.match(element.querySelector('.owner-promotions-list')?.textContent ?? '', /Promokod: IVYEXAMPLE/)
    fixture.failOverview = true
    await click(nav(1))
    assert.equal(element.querySelector('.owner-users-list'), null, 'failed filters must not display stale users')
    assert.ok(element.querySelector('[role="alert"]'))
    console.log('PASS owner dashboard: period pagination and late responses, returning users, independent persistent event badges, promo users, recorded USD/UZS discounted amounts, Uzbek and failed-load handling')
  } finally { await act(async () => root.unmount()); restore(); localStorage.removeItem('owner-updates:v1:owner-ui') }
}
