import assert from 'node:assert/strict'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import BillingBoundary from '@/features/billing/BillingBoundary'
import { getSATSectionTest } from '@/features/sat/catalog'
import { createSATAttempt } from '@/features/sat/practiceTest4'
import { saveSATAttempt, clearSATAttempt } from '@/features/sat/attemptStorage'
import { apiClient } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import '@/i18n'

export async function run() {
  const originalGet = apiClient.get
  const originalUser = useAuthStore.getState().user
  const requests: string[] = []
  apiClient.get = async <T,>(path: string) => {
    requests.push(path)
    return path.startsWith('/billing/access') ? { unlocked: false, tier: 'FREE', used: 1, limit: 1, remaining: 0 } as T : { access: { kind: 'FREE', tier: 'FREE', active: false, startsAt: null, expiresAt: null, trialDays: null, daysRemaining: null }, canJoinClass: false, canCreateClass: false, subscriptions: [], orders: [] } as T
  }
  useAuthStore.setState({ user: { id: 'billing-ui', email: 'billing@example.com', fullName: 'Billing', role: 'USER' } as NonNullable<typeof originalUser> })
  const test = getSATSectionTest('1', null)
  saveSATAttempt({ ...createSATAttempt(test.id, test.modules, 'practice'), status: 'submitted', submittedAt: Date.now() })
  function TestPage() {
    const navigate = useNavigate()
    const location = useLocation()
    return location.pathname.startsWith('/mock/') ? <div>Saved review<button onClick={() => {
      clearSATAttempt(test.id)
      navigate('/sat/mock/1/run')
    }}>Restart test</button></div> : <p>Paid test content</p>
  }
  const element = document.getElementById('root')!
  const root = createRoot(element)
  try {
    await act(async () => {
      root.render(<MemoryRouter initialEntries={['/mock/sat/1']}><BillingBoundary><TestPage /></BillingBoundary></MemoryRouter>)
      await new Promise(resolve => setTimeout(resolve, 20))
    })
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)) })
    assert.ok(element.textContent?.includes('Saved review'), 'saved results remain open on the Free plan')
    assert.equal(requests.length, 0, 'review does not request a paid unlock')
    await act(async () => {
      element.querySelector('button')!.click()
      await new Promise(resolve => setTimeout(resolve, 20))
    })
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)) })
    assert.ok(requests.some(path => path.includes('feature=mock')), 'restart rechecks server access')
    assert.equal(element.textContent?.includes('Paid test content'), false, 'saved review cannot carry free access into a new attempt')
    assert.ok(element.querySelector('a[href="/premium"]'), 'a used-up monthly allowance offers the plans')
    console.log('PASS: free SAT saved review, restart access recheck and monthly-limit protection')
  } finally {
    await act(async () => root.unmount())
    apiClient.get = originalGet
    useAuthStore.setState({ user: originalUser })
    clearSATAttempt(test.id)
  }
}
