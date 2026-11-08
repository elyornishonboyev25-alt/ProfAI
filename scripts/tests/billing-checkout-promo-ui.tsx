import assert from 'node:assert/strict'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import Membership from '@/features/billing/Membership'
import { BILLING_PRODUCTS } from '@/features/billing/catalog'
import { useBillingStore, type WalletOverview } from '@/features/billing/store'
import { useAuthStore } from '@/store/authStore'
import { ApiError, apiClient } from '@/lib/apiClient'
import i18n from '@/i18n'

export async function run() {
  const element = document.getElementById('root')!
  const root = createRoot(element)
  const previousUser = useAuthStore.getState().user
  const previousGet = apiClient.get, previousPost = apiClient.post
  const wallet: WalletOverview = { canCreateClass: false, canJoinClass: false, subscriptions: [], orders: [],
    access: { kind: 'FREE', tier: 'FREE', active: false, startsAt: null, expiresAt: null, trialDays: null, daysRemaining: null } }
  useAuthStore.setState({ user: { id: 'promo-ui', email: 'promo@example.com', fullName: 'Promo', role: 'USER', access: wallet.access } as NonNullable<typeof previousUser> })
  useBillingStore.setState({ userId: 'promo-ui', wallet })
  let delayed: (() => void) | undefined
  let providersEnabled = true
  const requests: URLSearchParams[] = [], purchases: Record<string, unknown>[] = []
  apiClient.get = async <T,>(path: string) => {
    if (path === '/billing/plans') return { products: BILLING_PRODUCTS, providers: [
      { code: 'PAYME', currency: 'UZS', enabled: providersEnabled }, { code: 'STRIPE', currency: 'USD', enabled: providersEnabled },
    ] } as T
    if (path === '/billing/discount') return { spun: false, discount: null } as T
    if (path === '/promo/status') return { telegramEnabled: true, botUsername: 'IvyGoo_bot', channelUrl: 'https://t.me/IvyGoo' } as T
    if (path.startsWith('/billing/quote')) {
      const query = new URL(path, 'http://localhost').searchParams
      requests.push(query)
      const promoCode = query.get('promoCode') ?? '', currency = query.get('currency') ?? 'UZS'
      const product = BILLING_PRODUCTS.find(p => p.code === query.get('product'))!
      if (promoCode === 'BADCODE') throw new ApiError('Invalid code', 400, 'INVALID_PROMO_CODE')
      if (promoCode === 'EXPIRED') throw new ApiError('Expired code', 400, 'PROMO_EXPIRED')
      if (promoCode === 'SLOW20') await new Promise<void>(resolve => { delayed = resolve })
      const amountUsd = promoCode === 'FREE100' ? 0 : promoCode ? Math.round(product.amountUsd * .8) : product.amountUsd
      return { product: product.code, currency, promoCode, amountUsd, amountUzs: amountUsd * 131,
        subtotalUsd: product.amountUsd, subtotalUzs: product.amountUsd * 131,
        promoDiscountUsd: product.amountUsd - amountUsd, promoDiscountUzs: (product.amountUsd - amountUsd) * 131,
        rate: currency === 'USD' ? 0 : 13100, date: '2026-11-08', expiresAt: Date.now() + 900000,
        token: `signed-${product.code}-${currency}-${promoCode}` } as T
    }
    return wallet as T
  }
  apiClient.post = async <T,>(path: string, body?: unknown) => {
    assert.equal(path, '/billing/checkout', 'price codes do not redeem extra access days')
    purchases.push(body as Record<string, unknown>)
    if ((body as Record<string, unknown>).promoCode === 'FREE100') return { id: 'free-order', status: 'APPROVED' } as T
    throw new Error('Payment intercepted for test')
  }
  const settle = async () => { await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)) }) }
  const click = async (selector: string) => { await act(async () => { const button = element.querySelector<HTMLButtonElement>(selector); assert.ok(button, selector); button.click() }); await settle() }
  const apply = async (code: string) => {
    await act(async () => {
      const input = element.querySelector<HTMLInputElement>('#checkout-promo-code')!
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, code)
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await act(async () => { element.querySelector('.billing-checkout-promo')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })) })
    await settle()
  }
  const total = () => element.querySelector('.billing-checkout-amount>strong')?.textContent
  const pay = () => element.querySelector<HTMLButtonElement>('.billing-checkout-pay')!
  try {
    await i18n.changeLanguage('en')
    await act(async () => root.render(<MemoryRouter><Membership /></MemoryRouter>))
    await settle()
    assert.equal(element.querySelector('#checkout-promo-code'), null, 'checkout code entry appears after selecting a plan')
    await click('.billing-segment button:last-child')
    await click('.billing-plan-featured button')
    assert.ok(element.querySelector('.billing-checkout #checkout-promo-code'))
    assert.equal(total(), '720 369 UZS')
    await apply('save-20')
    assert.equal(element.querySelector<HTMLInputElement>('#checkout-promo-code')!.value, 'SAVE20')
    assert.equal(total(), '576 269 UZS')
    assert.equal(element.querySelector('.billing-checkout-promo-saving b')?.textContent, '−144 100 UZS')
    assert.equal(pay().disabled, false)
    await click('.billing-checkout-pay')
    assert.deepEqual(purchases.at(-1), { product: 'PRO_12', currency: 'UZS', provider: 'PAYME', quote: 'signed-PRO_12-UZS-SAVE20', promoCode: 'SAVE20' })
    const select = element.querySelector<HTMLSelectElement>('.billing-provider-label select')!
    await act(async () => { select.value = 'STRIPE'; select.dispatchEvent(new Event('change', { bubbles: true })) })
    await settle()
    assert.equal(total(), '$43.99')
    await click('.billing-checkout-pay')
    assert.deepEqual(purchases.at(-1), { product: 'PRO_12', currency: 'USD', provider: 'STRIPE', quote: 'signed-PRO_12-USD-SAVE20', promoCode: 'SAVE20' })
    await click('.billing-checkout-promo-applied button')
    assert.equal(total(), '$54.99')
    assert.equal(element.querySelector('.billing-checkout-breakdown'), null)
    await apply('BADCODE')
    assert.match(element.querySelector('#checkout-promo-error')?.textContent ?? '', /not valid/)
    assert.equal(pay().disabled, true, 'a rejected code cannot submit a discounted order')
    assert.equal(total(), '—')
    await apply('EXPIRED')
    assert.match(element.querySelector('#checkout-promo-error')?.textContent ?? '', /expired/)
    await apply('SAVE20')
    await click('.billing-plan:last-child button')
    assert.equal(total(), '1 152 669 UZS', 'switching to Elite recalculates the discount for the newly selected plan')
    assert.equal(requests.at(-1)?.get('product'), 'MAX_12')
    await apply('SLOW20')
    assert.equal(pay().disabled, true, 'payment is disabled while a new promo price is loading')
    await click('.billing-checkout-promo-applied button')
    assert.equal(total(), '1 440 869 UZS')
    await act(async () => delayed!())
    await settle()
    assert.equal(total(), '1 440 869 UZS', 'a late response cannot restore a removed discount')
    for (const language of ['uz', 'ru']) {
      await act(async () => { await i18n.changeLanguage(language) })
      await apply('BADCODE')
      assert.match(element.querySelector('#checkout-promo-error')?.textContent ?? '', language === 'uz' ? /yaroqsiz/ : /не подходит/)
    }
    await act(async () => { await i18n.changeLanguage('en') })
    providersEnabled = false
    await act(async () => root.render(<MemoryRouter><Membership key="disabled-providers" /></MemoryRouter>))
    await settle()
    await click('.billing-plan-featured button')
    await apply('FREE100')
    assert.equal(total(), '0 UZS')
    assert.equal(pay().disabled, false, 'fully discounted plans do not require an enabled provider')
    assert.equal(pay().textContent, 'Activate plan')
    await click('.billing-checkout-pay')
    assert.equal(element.querySelector('.billing-checkout'), null, 'zero-cost activation completes without redirecting to a payment page')
    console.log('PASS: checkout promo entry, signed discounted UZS/USD totals, removal, errors, plan changes, late responses, translations and zero-cost activation')
  } finally {
    await act(async () => root.unmount())
    apiClient.get = previousGet; apiClient.post = previousPost
    useAuthStore.setState({ user: previousUser })
  }
}
