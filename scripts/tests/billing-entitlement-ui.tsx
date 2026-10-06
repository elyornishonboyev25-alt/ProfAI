import assert from 'node:assert/strict'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { AccessStatusCard } from '@/features/billing/AccountAccessCard'
import AccessGate from '@/features/billing/AccessGate'
import { currentAccess } from '@/features/billing/useAccountAccess'
import { apiClient } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import { describeAccess } from '../../backend/src/utils/accessEntitlement'
import i18n from '@/i18n'

export async function run() {
  await i18n.changeLanguage('uz')
  const element = document.getElementById('root')!
  const root = createRoot(element)
  const previousUser = useAuthStore.getState().user
  const previousGet = apiClient.get
  const startsAt = new Date('2026-10-06T09:00:00Z')
  const expiresAt = new Date('2026-10-20T09:00:00Z')
  const trial = describeAccess({ plan: 'TRIAL_14', source: 'SELECTED_ACCESS', startsAt, expiresAt }, false, startsAt)
  try {
    await act(async () => root.render(<MemoryRouter><AccessStatusCard access={trial} /></MemoryRouter>))
    assert.ok(element.textContent?.includes('14 KUN BEPUL'))
    assert.ok(element.textContent?.includes('Siz hozir sinov muddatidasiz.'))
    assert.equal(element.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow'), '14')
    assert.equal(element.querySelector('time[datetime="2026-10-20T09:00:00.000Z"]')?.textContent?.includes('14:00'), true, 'expiry is shown in Tashkent time')
    assert.ok(element.querySelector('time[datetime="2026-10-20T09:00:00.000Z"]')?.textContent?.includes('oktabr'), 'Uzbek month names do not depend on browser locale support')
    const expired = currentAccess(trial, expiresAt.getTime())!
    await act(async () => root.render(<MemoryRouter><AccessStatusCard access={expired} /></MemoryRouter>))
    assert.ok(element.textContent?.includes('Bepul sinov muddati tugadi.'))
    assert.equal(element.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow'), '0')
    await act(async () => root.render(<MemoryRouter><AccessStatusCard access={describeAccess({ plan: 'UNLIMITED', source: 'SELECTED_ACCESS', startsAt, expiresAt: null }, false, startsAt)} /></MemoryRouter>))
    assert.equal(element.querySelector('.billing-entitlement'), null, 'unlimited access has no large banner')
    assert.equal(element.querySelector('[role="progressbar"]'), null)
    useAuthStore.setState({ user: { id: 'trial-ui', email: 'trial@example.com', fullName: 'Trial', role: 'USER' } as NonNullable<typeof previousUser> })
    let checks = 0
    let expiry = 0
    apiClient.get = async <T,>() => {
      checks++
      if (!expiry) expiry = Date.now() + 700
      return { unlocked: Date.now() < expiry, expiresAt: new Date(expiry).toISOString(), balance: 0, cost: 10 } as T
    }
    await act(async () => {
      root.render(<MemoryRouter><AccessGate feature="test" resource="test:reading:trial"><p>Included trial test</p></AccessGate></MemoryRouter>)
      await new Promise(resolve => setTimeout(resolve, 10))
    })
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)) })
    assert.ok(element.textContent?.includes('Included trial test'))
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 850)) })
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)) })
    assert.ok(checks >= 2, 'an open test rechecks access when its trial ends')
    assert.equal(element.textContent?.includes('Included trial test'), false)
    assert.ok(element.querySelector('a[href="/premium"]'))
    console.log('PASS: Uzbek trial/unlimited cards, Tashkent expiry, expired state and open-test access recheck')
  } finally {
    await act(async () => root.unmount())
    apiClient.get = previousGet
    useAuthStore.setState({ user: previousUser })
  }
}
