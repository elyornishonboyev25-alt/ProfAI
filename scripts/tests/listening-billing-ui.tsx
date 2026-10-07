import assert from 'node:assert/strict'
import { StrictMode, act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, useLocation } from 'react-router-dom'
import BillingBoundary from '@/features/billing/BillingBoundary'
import { useListeningStartAccess } from '@/features/billing/useListeningStartAccess'
import Interface from '@/components/IELTSReadingInterface'
import { listeningFullTest3 } from '@/data/listeningFullTest3'
import { ApiError, apiClient } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import i18n from '@/i18n'

export async function run() {
  const element = document.getElementById('root')!
  const previousUser = useAuthStore.getState().user
  const previousGet = apiClient.get
  const previousPost = apiClient.post
  const previousTimeout = globalThis.setTimeout
  globalThis.setTimeout = ((callback, delay, ...args) => previousTimeout(callback, delay === 2200 ? 0 : delay, ...args)) as typeof setTimeout
  useAuthStore.setState({ user: { id: 'listening-coins', email: 'coins@example.com', fullName: 'Coins', role: 'USER' } as NonNullable<typeof previousUser> })
  await i18n.changeLanguage('uz')
  let posts = 0
  let accept!: () => void
  let reject!: (error: Error) => void
  apiClient.get = async <T,>(path: string) => {
    assert.ok(!path.startsWith('/billing/access'), 'Listening entry never mounts the separate coin gate')
    return {} as T
  }
  apiClient.post = async <T,>(path: string, body: unknown) => {
    assert.equal(path, '/billing/access')
    assert.deepEqual(body, { feature: 'test', resource: `test:listening:${listeningFullTest3.id}` })
    posts++
    await new Promise<void>((resolve, fail) => { accept = resolve; reject = fail })
    return { charged: 10, balance: 140 } as T
  }
  function Page({ preset = false }: { preset?: boolean }) {
    const location = useLocation()
    const access = useListeningStartAccess(`test:listening:${listeningFullTest3.id}`)
    if (location.pathname === '/premium') return <p>Premium</p>
    return <Interface test={listeningFullTest3} startAccess={access} launchPreset={preset ? { mode: 'simulation' } : undefined} onComplete={() => assert.fail('Audio has not ended')} onExit={() => {}} />
  }
  const settle = () => act(async () => { await new Promise(resolve => previousTimeout(resolve, 35)) })
  const click = async (label: string) => {
    const button = [...element.querySelectorAll('button')].find(item => item.textContent?.trim() === label)
    assert.ok(button, label)
    await act(async () => button.click())
  }
  let root = createRoot(element)
  const mount = async (preset = false) => {
    await act(async () => root.render(<StrictMode><MemoryRouter initialEntries={[`/test/listening/${listeningFullTest3.id}`]}><BillingBoundary><Page preset={preset} /></BillingBoundary></MemoryRouter></StrictMode>))
    await settle()
  }
  try {
    await mount()
    assert.equal(posts, 0, 'opening the mode screen costs nothing')
    assert.equal(element.querySelector('.billing-access-panel'), null)
    assert.equal([...element.querySelectorAll('span')].filter(item => item.textContent === '10 tanga').length, 2)
    await click('Enter Practice Library')
    assert.equal(posts, 0, 'selecting practice parts costs nothing')
    await click('Start Training Session')
    assert.equal(posts, 1)
    assert.equal(element.querySelector('audio'), null, 'test cannot start until access succeeds')
    await act(async () => reject(new Error('Connection failed')))
    assert.ok(element.querySelector('[role="alert"]')?.textContent?.includes('Connection failed'))
    assert.equal(element.querySelector('audio'), null)
    await click('Start Training Session')
    assert.equal(posts, 2, 'a failed start can be retried')
    await act(async () => accept())
    await settle()
    assert.ok(element.querySelector('audio'), 'authorized practice starts normally')
    await act(async () => root.unmount())
    localStorage.clear()
    root = createRoot(element)
    await mount()
    await click('Launch Final Simulation')
    assert.equal(posts, 3)
    await act(async () => reject(new ApiError('Insufficient coins', 402, 'INSUFFICIENT_COINS')))
    await settle()
    assert.equal(element.textContent, 'Premium')
    assert.equal(element.querySelector('audio'), null, 'insufficient coins cannot start an exam')
    await act(async () => root.unmount())
    root = createRoot(element)
    await mount(true)
    assert.equal(posts, 4, 'preset launches authorize once under StrictMode')
    await act(async () => accept())
    await settle()
    assert.ok(element.querySelector('audio'), 'preset launch is not stranded by StrictMode')
    console.log('PASS: no Listening coin-page flash, two simple prices, charge on Start, blocked and retryable failures, StrictMode preset launch')
  } finally {
    await act(async () => root.unmount())
    apiClient.get = previousGet
    apiClient.post = previousPost
    globalThis.setTimeout = previousTimeout
    useAuthStore.setState({ user: previousUser })
  }
}
