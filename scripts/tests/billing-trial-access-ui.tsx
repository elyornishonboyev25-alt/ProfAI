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
    access: { kind: 'FREE', tier: 'FREE', active: false, startsAt: null, expiresAt: null, trialDays: null, daysRemaining: null } }
  apiClient.get = async <T,>(path: string) => (path.startsWith('/billing/access') ? { unlocked: true } : account) as T
  let root = createRoot(element)
  const mount = async (path: string) => {
    await act(async () => root.unmount()); root = createRoot(element)
    await act(async () => { useBillingStore.setState({ userId: useAuthStore.getState().user?.id ?? null, wallet: account, error: '' }); root.render(<MemoryRouter initialEntries={[path]}><BillingBoundary><div data-testid="activity">Study activity</div></BillingBoundary></MemoryRouter>); await new Promise(resolve => setTimeout(resolve, 20)) })
  }
  const visible = () => !!element.querySelector('[data-testid="activity"]')
  try {
    useAuthStore.setState({ user: null })
    await mount('/ai-tutor'); assert.equal(visible(), false); assert.ok(element.textContent?.includes('Start for free'))
    useAuthStore.setState({ user: { id: 'access-ui', email: 'free@example.com', role: 'USER', access: account.access } as NonNullable<typeof previousUser> })
    // The Free plan never expires; its monthly limits apply when a test or AI request starts.
    for (const path of ['/ielts', '/sat', '/sat/question-bank', '/ai-tutor', '/writing-lab', '/speaking-lab', '/results/1/review', '/vocabulary', '/sat/mistakes']) { await mount(path); assert.equal(visible(), true, path) }
    for (const path of ['/learning-center', '/learning-center/join/ABC', '/learning-center/class']) { await mount(path); assert.equal(visible(), false, path); assert.ok(element.textContent?.includes('Classes are not part of the Free plan')) }
    account = { ...account, canJoinClass: true, access: { kind: 'PREMIUM', tier: 'PRO', active: true, startsAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 3600000).toISOString(), trialDays: null, daysRemaining: null } }
    await mount('/learning-center/join/ABC'); assert.equal(visible(), true)
    account.access = { ...account.access!, expiresAt: new Date(Date.now() - 1).toISOString() }
    await mount('/learning-center/class'); assert.equal(visible(), false)
    await mount('/ielts'); assert.equal(visible(), true, 'an ended paid plan falls back to Free study access')
    console.log('PASS: permanent Free study access, guest sign-up prompt, paid Classes with exact expiry, saved review/vocabulary access')
  } finally { await act(async () => root.unmount()); apiClient.get = previousGet; useAuthStore.setState({ user: previousUser }) }
}
