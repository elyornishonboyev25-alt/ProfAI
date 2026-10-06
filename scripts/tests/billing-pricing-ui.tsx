import assert from 'node:assert/strict'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import Membership from '@/features/billing/Membership'
import { Sidebar } from '@/components/layout/Sidebar'
import { BILLING_PRODUCTS } from '@/features/billing/catalog'
import { useBillingStore, type WalletOverview } from '@/features/billing/store'
import { useAuthStore } from '@/store/authStore'
import { apiClient } from '@/lib/apiClient'
import i18n from '@/i18n'

export async function run() {
  await i18n.changeLanguage('en')
  const element = document.getElementById('root')!
  const root = createRoot(element)
  const previousUser = useAuthStore.getState().user
  const previousGet = apiClient.get, previousPost = apiClient.post
  const wallet: WalletOverview = { balance: 150, canCreateClass: false, centerEligible: true, legacyAccess: false, subscriptions: [], orders: [], entries: [],
    access: { kind: 'COINS', active: false, startsAt: null, expiresAt: null, trialDays: null, daysRemaining: null } }
  let requests = 0, failQuote = false
  const purchases: unknown[] = []
  useAuthStore.setState({ user: { id: 'pricing-ui', email: 'pricing@example.com', fullName: 'Pricing', role: 'USER', access: wallet.access } as NonNullable<typeof previousUser> })
  apiClient.get = async <T,>(path: string) => {
    if (path === '/billing/plans') return { products: BILLING_PRODUCTS, providers: [{ code: 'PAYME', currency: 'UZS', enabled: true }, { code: 'CLICK', currency: 'UZS', enabled: true }, { code: 'STRIPE', currency: 'USD', enabled: true }] } as T
    if (path.startsWith('/billing/quote')) {
      requests++
      if (failQuote) throw new Error('No rate')
      const product = BILLING_PRODUCTS.find(p => p.code === new URL(path, 'http://localhost').searchParams.get('product'))!
      return { product: product.code, amountUsd: product.amountUsd, amountUzs: Math.round(product.amountUsd * 13100 / 100), rate: 13100, date: '2026-10-06', expiresAt: Date.now() + 900000, token: 'signed-' + product.code } as T
    }
    return wallet as T
  }
  apiClient.post = async <T,>(_path: string, body?: unknown) => { purchases.push(body); throw new Error('Payment intercepted for test') }
  const settle = async () => { await act(async () => { await new Promise(resolve => setTimeout(resolve, 30)) }) }
  const click = async (selector: string) => { const button = element.querySelector<HTMLButtonElement>(selector)!; assert.ok(button, selector); await act(async () => button.click()); await settle() }
  try {
    await act(async () => root.render(<MemoryRouter><Sidebar onToggle={() => {}} /><Membership /></MemoryRouter>))
    await settle()
    assert.equal(element.querySelectorAll('.billing-plan').length, 3)
    assert.deepEqual([...element.querySelectorAll('.billing-plan h3')].map(node => node.textContent), ['Individual', 'Classes', 'Teacher'])
    assert.deepEqual([...element.querySelectorAll('.billing-plan-price strong')].map(node => node.textContent), ['$6.00', '$4.00', '$8.00'])
    assert.deepEqual([...element.querySelectorAll('.billing-topup>p')].map(node => node.textContent), ['$1.99', '$3.49', '$6.99'])
    assert.equal(requests, 0, 'conversion is requested only after a product is chosen')
    assert.equal(element.textContent?.includes('UZS'), false)
    await click('.billing-segment button:last-child')
    assert.deepEqual([...element.querySelectorAll('.billing-plan-price strong')].map(node => node.textContent), ['$57.60', '$38.40', '$76.80'])
    await click('.billing-plan:first-child button')
    assert.ok(element.querySelector('.billing-checkout-amount strong')?.textContent?.includes('754 560 UZS'))
    await click('.billing-checkout .billing-primary')
    assert.deepEqual(purchases[0], { product: 'LEARNER_12', currency: 'UZS', provider: 'PAYME', quote: 'signed-LEARNER_12' })
    const select = element.querySelector<HTMLSelectElement>('.billing-provider-label select')!
    await act(async () => { select.value = 'STRIPE'; select.dispatchEvent(new Event('change', { bubbles: true })) })
    await settle()
    assert.equal(element.querySelector('.billing-checkout-amount strong')?.textContent, '$57.60')
    await click('.billing-checkout .billing-primary')
    assert.deepEqual(purchases[1], { product: 'LEARNER_12', currency: 'USD', provider: 'STRIPE', quote: undefined })
    failQuote = true
    await click('.billing-topup:first-child button')
    assert.equal(element.querySelector<HTMLButtonElement>('.billing-checkout .billing-primary')?.disabled, true, 'no UZS payment without a rate')
    assert.ok(element.textContent?.includes('Rate unavailable'))
    failQuote = false
    await click('.billing-checkout-amount button')
    assert.equal(element.querySelector('.billing-checkout-amount strong')?.textContent, '26 069 UZS')
    assert.equal(element.querySelector<HTMLButtonElement>('.billing-checkout .billing-primary')?.disabled, false)
    wallet.access = { kind: 'UNLIMITED', active: true, startsAt: null, expiresAt: null, trialDays: null, daysRemaining: null }
    await act(async () => { useBillingStore.setState({ wallet: { ...wallet } }) })
    assert.equal(element.querySelector('.billing-entitlement'), null)
    assert.equal(element.querySelector('.liquid-upgrade-link')?.textContent, 'Unlimited')
    assert.equal(element.querySelector('.liquid-upgrade-link')?.getAttribute('aria-label'), 'Unlimited')
    assert.equal(element.querySelector('.liquid-upgrade-link small'), null)
    wallet.access = { ...wallet.access, active: false }
    await act(async () => { useBillingStore.setState({ wallet: { ...wallet } }) })
    assert.equal(element.querySelector('.liquid-upgrade-link')?.textContent, 'Plans', 'ended access restores the plans label')
    console.log('PASS: USD-only pricing, full annual totals, checkout conversion and signed quote, USD payment, failed rate retry, compact entitlement')
  } finally {
    await act(async () => root.unmount())
    apiClient.get = previousGet; apiClient.post = previousPost
    useAuthStore.setState({ user: previousUser })
  }
}
