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
  const wallet: WalletOverview = { canCreateClass: false, canJoinClass: false, subscriptions: [], orders: [],
    access: { kind: 'FREE', tier: 'FREE', active: false, startsAt: null, expiresAt: null, trialDays: null, daysRemaining: null } }
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
    if (path === '/billing/discount') return { spun: false, discount: null } as T
    if (path === '/promo/status') return { telegramEnabled: true, botUsername: 'IvyGoo_bot', channelUrl: 'https://t.me/IvyGoo' } as T
    return wallet as T
  }
  apiClient.post = async <T,>(_path: string, body?: unknown) => { purchases.push(body); throw new Error('Payment intercepted for test') }
  const settle = async () => { await act(async () => { await new Promise(resolve => setTimeout(resolve, 30)) }) }
  const click = async (selector: string) => { const button = element.querySelector<HTMLButtonElement>(selector)!; assert.ok(button, selector); await act(async () => button.click()); await settle() }
  try {
    await act(async () => root.render(<MemoryRouter><Sidebar onToggle={() => {}} /><Membership /></MemoryRouter>))
    await settle()
    assert.equal(element.querySelectorAll('.billing-plan').length, 3)
    assert.ok(element.querySelector('.plans-table'), 'the comparison table sits below the plans')
    assert.equal(/7 days|free trial/i.test(element.textContent ?? ''), false, 'no trial copy remains')
    assert.deepEqual([...element.querySelectorAll('.billing-plan h3')].map(node => node.textContent), ['Free', 'Pro', 'Max'])
    assert.deepEqual([...element.querySelectorAll('.billing-plan-price strong')].map(node => node.textContent), ['$0', '$5.99', '$11.99'])
    assert.deepEqual([...element.querySelectorAll('.plans-table thead small')].map(node => node.textContent), ['$0', '$5.99 / month', '$11.99 / month'])
    assert.ok(element.querySelector('.plans-table')?.textContent?.includes('$4.99 / month'))
    assert.ok(element.querySelector('.plans-table')?.textContent?.includes('$9.99 / month'))
    assert.deepEqual([...element.querySelectorAll('.billing-segment button span')].map(node => node.textContent), ['Up to 16.6%', 'Up to 23.6%'])
    assert.equal(element.querySelector('.billing-topup'), null)
    assert.equal(/coins|Individual/.test(element.textContent ?? ''), false)
    assert.equal(requests, 0, 'conversion is requested only after a product is chosen')
    assert.equal(element.textContent?.includes('UZS'), false)
    await click('.billing-segment button:nth-child(2)')
    assert.deepEqual([...element.querySelectorAll('.billing-plan-price strong')].map(node => node.textContent), ['$0', '$15.99', '$29.99'])
    assert.deepEqual([...element.querySelectorAll('.billing-plan-top .billing-saving')].map(node => node.textContent), ['Free forever', 'Save 11%', 'Save 16.6%'])
    await click('.billing-segment button:last-child')
    assert.deepEqual([...element.querySelectorAll('.billing-plan-price strong')].map(node => node.textContent), ['$0', '$54.99', '$109.99'])
    assert.deepEqual([...element.querySelectorAll('.billing-plan-top .billing-saving')].map(node => node.textContent), ['Free forever', 'Save 23.5%', 'Save 23.6%'])
    await click('.billing-plan-featured button')
    assert.ok(element.querySelector('.billing-checkout-amount strong')?.textContent?.includes('720 369 UZS'))
    await click('.billing-checkout .billing-primary')
    assert.deepEqual(purchases[0], { product: 'PRO_12', currency: 'UZS', provider: 'PAYME', quote: 'signed-PRO_12' })
    const select = element.querySelector<HTMLSelectElement>('.billing-provider-label select')!
    await act(async () => { select.value = 'STRIPE'; select.dispatchEvent(new Event('change', { bubbles: true })) })
    await settle()
    assert.equal(element.querySelector('.billing-checkout-amount strong')?.textContent, '$54.99')
    await click('.billing-checkout .billing-primary')
    assert.deepEqual(purchases[1], { product: 'PRO_12', currency: 'USD', provider: 'STRIPE', quote: undefined })
    failQuote = true
    await click('.billing-plan:last-child button')
    assert.equal(element.querySelector<HTMLButtonElement>('.billing-checkout .billing-primary')?.disabled, true, 'no UZS payment without a rate')
    assert.ok(element.textContent?.includes('Rate unavailable'))
    failQuote = false
    await click('.billing-checkout-amount button')
    assert.equal(element.querySelector('.billing-checkout-amount strong')?.textContent, '1 440 869 UZS')
    assert.equal(element.querySelector<HTMLButtonElement>('.billing-checkout .billing-primary')?.disabled, false)
    wallet.access = { kind: 'UNLIMITED', tier: 'MAX', active: true, startsAt: null, expiresAt: null, trialDays: null, daysRemaining: null }
    await act(async () => { useBillingStore.setState({ wallet: { ...wallet } }) })
    assert.equal(element.querySelector('.billing-entitlement'), null)
    assert.equal(element.querySelector('.liquid-upgrade-link')?.textContent, 'Unlimited')
    assert.equal(element.querySelector('.liquid-upgrade-link')?.getAttribute('aria-label'), 'Unlimited')
    assert.equal(element.querySelector('.liquid-upgrade-link small'), null)
    wallet.access = { ...wallet.access, active: false }
    await act(async () => { useBillingStore.setState({ wallet: { ...wallet } }) })
    assert.equal(element.querySelector('.liquid-upgrade-link')?.textContent, 'Upgrade', 'ended access restores the upgrade action')
    console.log('PASS: Free/Pro/Max pricing with comparison, no coin UI, checkout conversion and signed quote, failed rate retry, compact entitlement')
  } finally {
    await act(async () => root.unmount())
    apiClient.get = previousGet; apiClient.post = previousPost
    useAuthStore.setState({ user: previousUser })
  }
}
