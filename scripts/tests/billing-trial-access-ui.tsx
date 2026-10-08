import assert from 'node:assert/strict'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import BillingBoundary from '@/features/billing/BillingBoundary'
import { useBillingStore, type WalletOverview } from '@/features/billing/store'
import { useAuthStore } from '@/store/authStore'
import { apiClient } from '@/lib/apiClient'
import i18n from '@/i18n'
export async function run() {
  await i18n.changeLanguage('en')
  const element = document.getElementById('root')!
  const previousUser = useAuthStore.getState().user, previousGet = apiClient.get
  let account: WalletOverview = { canCreateClass: false, canJoinClass: false, subscriptions: [], orders: [],
    access: { kind: 'TRIAL', active: true, startsAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 604800000).toISOString(), trialDays: 7, daysRemaining: 7 } }
  apiClient.get = async <T,>(path: string) => (path.startsWith('/billing/access') ? { unlocked: account.access?.active } : account) as T
  let root = createRoot(element)
  const mount = async (path: string) => {
    await act(async () => root.unmount()); root = createRoot(element)
    await act(async () => { useBillingStore.setState({ userId: useAuthStore.getState().user?.id ?? null, wallet: account, error: '' }); root.render(<MemoryRouter initialEntries={[path]}><BillingBoundary><div data-testid="activity">Study activity</div></BillingBoundary></MemoryRouter>); await new Promise(resolve => setTimeout(resolve, 20)) })
  }
  const visible = () => !!element.querySelector('[data-testid="activity"]')
  try {
    useAuthStore.setState({ user: null })
    await mount('/ai-tutor'); assert.equal(visible(), false); assert.ok(element.textContent?.includes('Start for free'))
    useAuthStore.setState({ user: { id: 'access-ui', email: 'trial@example.com', role: 'USER', access: account.access } as NonNullable<typeof previousUser> })
    for (const path of ['/ielts', '/sat', '/ai-tutor', '/writing-lab', '/speaking-lab']) { await mount(path); assert.equal(visible(), true, path) }
    for (const path of ['/learning-center', '/learning-center/join/ABC', '/learning-center/class']) { await mount(path); assert.equal(visible(), false, path); assert.ok(element.textContent?.includes('Classes are not included')) }
    account.access = { ...account.access!, expiresAt: new Date(Date.now() - 1).toISOString() }
    for (const path of ['/ielts', '/sat/question-bank', '/ai-tutor']) { await mount(path); assert.equal(visible(), false, path) }
    for (const path of ['/results/1/review', '/vocabulary', '/sat/mistakes']) { await mount(path); assert.equal(visible(), true, path) }
    account = { ...account, canJoinClass: true, access: { kind: 'PREMIUM', active: true, startsAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 3600000).toISOString(), trialDays: null, daysRemaining: null } }
    await mount('/learning-center/join/ABC'); assert.equal(visible(), true)
    account.access = { ...account.access!, expiresAt: new Date(Date.now() - 1).toISOString() }
    await mount('/learning-center/class'); assert.equal(visible(), false)
    console.log('PASS: study trial access, exact expiry, paid Classes, and saved review/vocabulary access')
  } finally { await act(async () => root.unmount()); apiClient.get = previousGet; useAuthStore.setState({ user: previousUser }) }
}
