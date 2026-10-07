import assert from 'node:assert/strict'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import AccessGate from '@/features/billing/AccessGate'
import { apiClient } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import i18n from '@/i18n'

export async function run() {
  await i18n.changeLanguage('uz')
  const element = document.getElementById('root')!
  const root = createRoot(element)
  const previousUser = useAuthStore.getState().user
  const previousGet = apiClient.get
  try {
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
    console.log('PASS: open-test access recheck after trial expiry')
  } finally {
    await act(async () => root.unmount())
    apiClient.get = previousGet
    useAuthStore.setState({ user: previousUser })
  }
}
