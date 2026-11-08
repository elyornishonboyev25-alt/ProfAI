import assert from 'node:assert/strict'
import { StrictMode, act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { useAiTutor, type AiTutorController } from '@/components/ai/useAiTutor'
import TalkOverlay from '@/components/ai/TalkOverlay'
import UsageBalance from '@/features/billing/UsageBalance'
import StandardLiveSession from '@/features/billing/StandardLiveSession'
import { apiClient } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import { useAiAssistantStore } from '@/store/aiAssistantStore'
import { useBillingStore, type WalletOverview } from '@/features/billing/store'
import i18n from '@/i18n'
export async function run() {
  await i18n.changeLanguage('en')
  const originalAuth = useAuthStore.getState(), originalBilling = useBillingStore.getState()
  const originalAI = useAiAssistantStore.getState()
  const originalGet = apiClient.get, originalPost = apiClient.post, originalStream = apiClient.postStream
  const free = { kind: 'FREE' as const, tier: 'FREE' as const, active: false, startsAt: null, expiresAt: null, trialDays: null, daysRemaining: null }
  const wallet: WalletOverview = { access: free, canJoinClass: false, canCreateClass: false, subscriptions: [], orders: [], usage: { ai: { used: 0, limit: 50 } } as WalletOverview['usage'] }
  useAuthStore.setState({ user: { id: 'free-ai', email: 'free@example.com', fullName: 'Free', role: 'USER', access: free } as NonNullable<typeof originalAuth.user> })
  useBillingStore.setState({ wallet, userId: 'free-ai' })
  useAiAssistantStore.setState({ talkOpen: false, isSending: false, threadsLoaded: {}, threadsLoading: {}, threadsByOwner: {}, activeThreadIds: {} })
  let textCalls = 0, voiceCalls = 0
  apiClient.get = async <T,>(path: string) => (path === '/billing/account' ? wallet : path === '/profile/ai-preferences' ? { preferredLocale: 'en', preferredName: 'Free' } : path === '/ai/voice/capabilities' ? { naturalVoice: true } : { items: [] }) as T
  apiClient.post = async <T,>(path: string, body?: unknown) => {
    if (path.startsWith('/ai/voice/')) voiceCalls++
    return { id: 'server-thread', title: 'Chat', locale: 'en', contextMode: 'general', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), messages: [], ...(body as object) } as T
  }
  apiClient.postStream = async () => {
    textCalls++; wallet.usage!.ai.used++
    const result = { reply: 'Let us work through this together.', actions: [], memoryUpdates: [], title: null }
    return new Response(`event: reply\ndata: ${JSON.stringify({ reply: result.reply })}\n\nevent: done\ndata: ${JSON.stringify(result)}\n\n`)
  }
  let tutor!: AiTutorController
  function Probe() { tutor = useAiTutor(); return <p data-chat-open>{tutor.hasPremium ? 'Text chat available' : 'Text chat locked'}</p> }
  const element = document.getElementById('root')!
  const root = createRoot(element)
  const settle = () => act(async () => { await new Promise(resolve => setTimeout(resolve, 30)) })
  try {
    await act(async () => root.render(<MemoryRouter><Probe /><UsageBalance /><TalkOverlay /></MemoryRouter>))
    await settle()
    assert.ok(element.textContent?.includes('Text chat available'), 'Free is admitted to the same tutor as paid learners')
    assert.ok(element.textContent?.includes('100%'))
    await act(async () => { await tutor.send({ text: 'Help me practise reading.' }) })
    await settle()
    assert.equal(textCalls, 1)
    assert.ok(element.textContent?.includes('98%'), 'a completed Free message refreshes the displayed balance')
    assert.equal(tutor.messages.at(-1)?.content, 'Let us work through this together.')
    await act(async () => useAiAssistantStore.getState().openTalk())
    await settle()
    assert.ok(document.querySelector('[role="dialog"]')?.textContent?.includes('IvyGoo Pro'))
    assert.equal(voiceCalls, 0, 'Free never reserves or opens a provider voice connection')
    await act(async () => useAiAssistantStore.getState().closeTalk())
    let standardStarts = 0, standardEnds = 0
    apiClient.post = async <T,>(path: string) => {
      if (path === '/ai/voice/standard/connect') { standardStarts++; return { id: 'reserved-voice-session', expiresAt: new Date(Date.now() + 60000).toISOString() } as T }
      if (path === '/ai/voice/end') standardEnds++
      return {} as T
    }
    await act(async () => root.render(<StrictMode><StandardLiveSession onEnd={() => assert.fail('session has not expired')}><p data-live-ready>Live session ready</p></StandardLiveSession></StrictMode>))
    await settle()
    assert.equal(standardStarts, 1, 'StrictMode replay cannot reserve a duplicate fallback voice session')
    assert.ok(element.querySelector('[data-live-ready]'))
    await act(async () => root.render(<p>Ended</p>))
    await settle()
    assert.equal(standardEnds, 1, 'unmount settles the reservation exactly once')
    console.log('PASS: Free text chat, successful streamed reply, percentage refresh, Live AI upgrade before provider connection')
  } finally {
    await act(async () => root.unmount())
    apiClient.get = originalGet; apiClient.post = originalPost; apiClient.postStream = originalStream
    useAuthStore.setState(originalAuth); useBillingStore.setState(originalBilling); useAiAssistantStore.setState(originalAI)
  }
}
