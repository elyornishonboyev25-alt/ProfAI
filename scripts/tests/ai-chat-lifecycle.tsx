import assert from 'node:assert/strict'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import i18n from '@/i18n'
import { useAiTutor, type AiTutorController } from '@/components/ai/useAiTutor'
import { useRealtimeCoach } from '@/components/ai/useRealtimeCoach'
import { RealtimeCoach } from '@/lib/realtimeCoach'
import AIChatWindow from '@/components/ai/AIChatWindow'
import { TalkOverlay } from '@/components/ai/TalkOverlay'
import LanguageSelector from '@/components/layout/LanguageSelector'
import UiText from '@/components/common/UiText'
import { useAiAssistantStore } from '@/store/aiAssistantStore'
import { useAuthStore } from '@/store/authStore'

export async function run() {
  HTMLElement.prototype.scrollTo = () => {}
  const nativeFetch = globalThis.fetch
  const host = document.getElementById('root')!
  const root = createRoot(host)
  const owner = 'user:chat-lifecycle'
  const date = new Date().toISOString()
  const empty = { id: 'old-empty', title: 'Yangi chat', createdAt: date, updatedAt: date, messages: [], synced: true }
  const conversation = { ...empty, id: 'saved', messages: [{ id: 'past', role: 'user' as const, content: 'Bu mening asl suhbatim.', createdAt: date }] }
  let creates = 0
  let voiceTest = false
  const requests: any[] = []
  let tutor: AiTutorController
  function Harness() { tutor = useAiTutor(); return null }
  useAuthStore.setState({ user: { id: 'chat-lifecycle', role: 'ADMIN', fullName: 'Learner', email: 'test@example.invalid' } as any, accessToken: 'test-token' })
  globalThis.fetch = async (url, options) => {
    const path = String(url)
    const method = options?.method ?? 'GET'
    let result: unknown = { items: [] }
    if (path.endsWith('/ai-workspace/threads') && method === 'GET') result = { items: [empty, conversation] }
    if (path.endsWith('/ai-workspace/threads') && method === 'POST') {
      creates++
      const payload = JSON.parse(String(options?.body))
      assert.equal(payload.title, 'New chat')
      assert.equal(payload.locale, voiceTest ? 'uz' : 'en', 'Text metadata uses interface language; voice retains its spoken language')
      result = { ...empty, id: `created-${creates}`, title: payload.title }
    }
    if (path.endsWith('/profile/ai-preferences')) result = { preferredLocale: 'uz', preferredName: null }
    if (path.endsWith('/ai/voice/capabilities')) result = { naturalVoice: false }
    if (path.endsWith('/ai/assistant/stream')) {
      const payload = JSON.parse(String(options?.body)); requests.push(payload)
      if (payload.message === 'Simulate connection failure') throw new Error('Offline test fixture')
      const replyLanguage = payload.message === 'Grammatikani tushuntirib ber.' ? 'uz' : payload.message === 'Объясни грамматику.' ? 'ru' : 'en'
      const reply = replyLanguage === 'uz' ? 'Albatta, grammatikani o‘rganamiz.' : replyLanguage === 'ru' ? 'Конечно, разберём грамматику.' : 'Let’s work on it.'
      result = { reply, replyLanguage, title: 'Writing practice', actions: [], memoryUpdates: [] }
      return new Response(`event: done\ndata: ${JSON.stringify(result)}\n\n`, { headers: { 'Content-Type': 'text/event-stream' } })
    }
    return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } })
  }
  try {
    localStorage.setItem('profai-ai-chat', JSON.stringify({ version: 4, state: { threadsByOwner: { [owner]: [empty, conversation] }, activeThreadIds: { [owner]: empty.id }, voiceLang: 'uz' } }))
    await useAiAssistantStore.persist.rehydrate()
    assert.deepEqual(useAiAssistantStore.getState().threadsByOwner[owner].map(thread => thread.id), ['saved'], 'Migration removes old empty records without losing actual conversations')
    await act(async () => {
      await i18n.changeLanguage('en')
      root.render(<MemoryRouter><Harness/><AIChatWindow variant="page"/><LanguageSelector/><UiText text="Yangi chat"/><TalkOverlay/></MemoryRouter>)
    })
    assert.equal(creates, 0, 'Opening chat never creates a server conversation')
    assert.ok(host.textContent!.includes('Bu mening asl suhbatim.'), 'Conversation content is preserved in its original language')
    assert.ok(!host.textContent!.includes('Yangi chat'), 'English UI normalizes cached Uzbek system labels')
    const menu = host.querySelector<HTMLButtonElement>('[aria-haspopup="dialog"]')!
    await act(async () => menu.click())
    assert.ok(host.textContent!.includes('New chat'))
    assert.ok(!host.textContent!.includes('Yangi chat'))
    assert.ok(!host.textContent!.includes('0 messages'))
    await act(async () => tutor!.createNewChat())
    const draftId = tutor!.activeThreadId
    await act(async () => { await tutor!.createNewChat(); await tutor!.createNewChat() })
    assert.equal(tutor!.activeThreadId, draftId, 'Repeated new-chat clicks reuse the blank draft')
    assert.equal(creates, 0)
    const persisted = JSON.parse(localStorage.getItem('profai-ai-chat')!)
    assert.equal(persisted.state.threadsByOwner[owner].length, 1, 'Blank drafts never enter local storage')
    await act(async () => tutor!.send({ text: 'Help me practise writing.' }))
    assert.equal(creates, 1, 'Only the first message creates the conversation')
    assert.equal(requests[0].language, 'auto', 'Text language detection does not inherit Uzbek microphone preference')
    assert.equal(tutor!.messages.length, 2)
    assert.equal(tutor!.activeThread?.title, 'Writing practice', 'First-turn titles persist on the promoted server thread')
    await act(async () => tutor!.send({ text: 'What should I improve?' }))
    assert.equal(creates, 1, 'Follow-up messages stay in the same conversation')
    for (const [text, reply] of [['Grammatikani tushuntirib ber.', 'Albatta, grammatikani o‘rganamiz.'], ['Объясни грамматику.', 'Конечно, разберём грамматику.']]) {
      await act(async () => tutor!.send({ text }))
      assert.equal(requests.at(-1).language, 'auto', 'Every new turn requests automatic language detection')
      assert.equal(tutor!.messages.at(-1)?.content, reply, 'The reply keeps its detected language while the interface stays English')
    }
    await act(async () => { useAiAssistantStore.getState().setPendingActions([{ id: 'action', action: { type: 'navigate', target: '/ielts' }, label: 'old label' }]); await i18n.changeLanguage('uz') })
    assert.equal(tutor!.pendingActions[0].label, 'Tavsiya qilingan sahifani ochish')
    await act(async () => tutor!.send({ text: 'Simulate connection failure' }))
    assert.ok(tutor!.error?.startsWith('So‘rovingizni'))
    assert.equal(tutor!.messages.at(-1)?.role, 'user', 'Connection failures use an interface notice rather than a fabricated saved assistant reply')
    await act(async () => i18n.changeLanguage('en'))
    assert.equal(tutor!.error, 'Unable to process your request. Please try again.', 'Existing error notices also follow the newly selected interface language')
    assert.equal(tutor!.pendingActions[0].label, 'Open the suggested page', 'Pending action labels react to interface language changes')
    await act(async () => useAiAssistantStore.getState().openTalk())
    assert.ok(document.body.textContent!.includes('This browser cannot start natural voice.'), 'Voice dialog interface stays English with an Uzbek microphone')
    assert.ok(!document.body.textContent!.includes('Bu brauzer tabiiy ovozli suhbatni ocholmaydi.'))
    voiceTest = true
    let voiceOptions: any
    let voiceStarts = 0
    const originalStart = RealtimeCoach.prototype.start
    const originalStop = RealtimeCoach.prototype.stop
    const originalUpdate = RealtimeCoach.prototype.updateContext
    const originalPeer = globalThis.RTCPeerConnection
    const originalMedia = navigator.mediaDevices
    Object.defineProperty(globalThis, 'RTCPeerConnection', { configurable: true, value: class {} })
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: async () => ({ getTracks: () => [] }) } })
    RealtimeCoach.prototype.start = async function () { voiceStarts++; voiceOptions = (this as any).options }
    RealtimeCoach.prototype.stop = () => {}
    RealtimeCoach.prototype.updateContext = async () => {}
    function VoiceHarness() { useRealtimeCoach(useAiTutor(), true, 'coach'); return null }
    try {
      await act(async () => { useAiAssistantStore.getState().closeTalk(); await tutor!.createNewChat() })
      await act(async () => root.render(<MemoryRouter><Harness/><VoiceHarness/></MemoryRouter>))
      assert.equal(creates, 1, 'Opening a voice session also leaves its draft unsaved')
      await act(async () => {
        voiceOptions.message('user', 'Salom, mashq qilamiz.', 'voice-user')
        voiceOptions.message('assistant', 'Albatta, boshlaymiz.', 'voice-answer')
      })
      assert.equal(creates, 2, 'The first actual voice transcript creates one server conversation')
      assert.equal(tutor!.messages.length, 2, 'Messages arriving while a voice draft is saving are retained')
      assert.ok(tutor!.activeThread?.synced)
      assert.equal(voiceStarts, 1, 'Saving the first voice turn never interrupts or reconnects the ongoing call')
    } finally {
      await act(async () => root.render(<MemoryRouter><Harness/></MemoryRouter>))
      RealtimeCoach.prototype.start = originalStart; RealtimeCoach.prototype.stop = originalStop; RealtimeCoach.prototype.updateContext = originalUpdate
      Object.defineProperty(globalThis, 'RTCPeerConnection', { configurable: true, value: originalPeer })
      Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: originalMedia })
    }
    console.log('PASS: empty-chat migration, deferred persistence, draft reuse, automatic language payload, preserved content and reactive interface language')
  } finally {
    await act(async () => root.unmount())
    globalThis.fetch = nativeFetch
  }
}
