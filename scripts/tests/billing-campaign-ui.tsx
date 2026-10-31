import assert from 'node:assert/strict'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import PromoCode from '@/features/billing/PromoCode'
import { ApiError, apiClient } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import { captureReferralFromUrl, claimPendingReferral } from '@/utils/referralCapture'
import i18n from '@/i18n'

export async function run() {
  const element = document.getElementById('root')!
  const root = createRoot(element)
  const previousUser = useAuthStore.getState().user
  const previousGet = apiClient.get, previousPost = apiClient.post
  let afterLaunchGift = true, deferred = true, alreadyUsed = false, refreshes = 0
  let kind = 'CAMPAIGN'
  const requests: Array<{ path: string; body: unknown }> = []
  useAuthStore.setState({ user: { id: 'campaign-ui', email: 'campaign@example.com', fullName: 'Campaign', role: 'USER' } as NonNullable<typeof previousUser> })
  apiClient.get = async <T,>() => ({ telegramEnabled: true, botUsername: 'IvyGoo_bot', channelUrl: 'https://t.me/IvyGoo' }) as T
  apiClient.post = async <T,>(path: string, body?: unknown) => {
    requests.push({ path, body })
    if (alreadyUsed) throw new ApiError('Already used', 409, 'ALREADY_USED')
    return { kind, months: 3, days: 3, deferred, afterLaunchGift, startsAt: '2026-11-30T10:00:00.000Z', expiresAt: '2027-02-28T10:00:00.000Z' } as T
  }
  const enter = async () => {
    await act(async () => {
      const input = element.querySelector<HTMLInputElement>('#promo-code-input')!
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'Firdavss7')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await act(async () => { element.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })) })
  }
  try {
    await i18n.changeLanguage('uz')
    await act(async () => root.render(<MemoryRouter><PromoCode wheel={{ spun: false, discount: null, refresh: async () => {} }} onRedeemed={() => { refreshes++ }} /></MemoryRouter>))
    await enter()
    const message = () => element.querySelector('[role="status"]')?.textContent ?? ''
    assert.match(message(), /Hozir PRO’dan foydalanyapsiz/)
    assert.match(message(), /1 oylik PRO tugagandan keyin amal qiladi/)
    assert.match(message(), /yana 3 oylik PRO/)
    assert.match(message(), /qayta kiritish shart emas/)
    assert.deepEqual(requests[0], { path: '/promo/redeem', body: { code: 'FIRDAVSS7' } })
    assert.equal(refreshes, 1)
    assert.equal(element.querySelector<HTMLInputElement>('#promo-code-input')!.value, '')

    afterLaunchGift = false
    await enter()
    assert.match(message(), /joriy obunangiz tugagach, yana 3 oylik PRO boshlanadi/)

    deferred = false
    await enter()
    assert.match(message(), /3 oylik PRO faollashtirildi/)

    afterLaunchGift = true; deferred = true
    await act(async () => { await i18n.changeLanguage('en') })
    await enter()
    assert.match(message(), /after your free 1-month PRO ends/)
    await act(async () => { await i18n.changeLanguage('ru') })
    await enter()
    assert.match(message(), /после окончания бесплатного месяца/)

    kind = 'REFERRAL'
    await enter()
    assert.match(message(), /Приглашение принято/)
    kind = 'PROMO'
    await enter()
    assert.match(message(), /Код применён/)
    alreadyUsed = true
    await enter()
    assert.match(element.querySelector('[role="alert"]')?.textContent ?? '', /уже использован/)
    assert.equal(refreshes, 7, 'an already-used code does not report another reward')

    alreadyUsed = false; kind = 'CAMPAIGN'
    window.history.replaceState({}, '', '/register?promo=Firdavss7')
    captureReferralFromUrl()
    assert.equal(localStorage.getItem('profai-referral-code'), 'FIRDAVSS7')
    await claimPendingReferral()
    assert.deepEqual(requests.at(-1), { path: '/promo/redeem', body: { code: 'FIRDAVSS7' } })
    assert.equal(localStorage.getItem('profai-referral-code'), null)
    window.history.replaceState({}, '', '/register?ref=FRIENDCODE')
    captureReferralFromUrl()
    await claimPendingReferral()
    assert.deepEqual(requests.at(-1), { path: '/promo/redeem', body: { code: 'FRIENDCODE' } })
    console.log('PASS: deferred and immediate campaign messages, three languages, existing code messages, duplicate handling and signup links')
  } finally {
    await act(async () => root.unmount())
    apiClient.get = previousGet; apiClient.post = previousPost
    useAuthStore.setState({ user: previousUser })
    window.history.replaceState({}, '', '/')
  }
}
