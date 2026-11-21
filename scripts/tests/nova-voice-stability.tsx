import assert from 'node:assert/strict'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import i18n from '@/i18n'
import { useAiTutor } from '@/components/ai/useAiTutor'
import { useRealtimeCoach } from '@/components/ai/useRealtimeCoach'
import { GeminiRealtimeCoach } from '@/lib/geminiRealtimeCoach'
import { apiClient } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import { useAiAssistantStore } from '@/store/aiAssistantStore'

export async function run() {
  const prototype = GeminiRealtimeCoach.prototype
  const original = { start: prototype.start, stop: prototype.stop, update: prototype.updateContext, get: apiClient.get, post: apiClient.post }
  const sessions: any[] = [], contexts: any[] = []
  let preferenceRequests = 0
  prototype.start = async function () { sessions.push(this); (this as any).options.state('listening') }
  prototype.stop = function () {}
  prototype.updateContext = async function (context) { contexts.push(context) }
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia() {} } })
  Object.defineProperty(globalThis, 'AudioContext', { configurable: true, value: class {} })
  Object.defineProperty(globalThis, 'AudioWorkletNode', { configurable: true, value: class {} })
  Object.defineProperty(globalThis, 'WebSocket', { configurable: true, value: class {} })
  const user = { id: 'stable-voice-owner', fullName: 'Fixture', role: 'USER' } as any
  const owner = `user:${user.id}`, threadId = 'stable-voice-thread'
  useAuthStore.setState({ user, accessToken: 'fixture-token' })
  useAiAssistantStore.setState({ conversationLanguages: {}, activeThreadIds: { [owner]: threadId }, threadsLoaded: { [owner]: true }, threadsByOwner: { [owner]: [{ id: threadId, clientId: 'stable', title: 'Saved', synced: true, createdAt: '2026-11-21', updatedAt: '2026-11-21', messages: [{ id: 'saved', role: 'assistant', content: 'A saved answer.', createdAt: '2026-11-21', language: { selection: 'ru', response: 'ru', lastReliable: 'ru' } }] }] } })
  apiClient.get = (async (path: string) => { if (path === '/profile/ai-preferences') preferenceRequests++; return { items: [], preferredLocale: 'en' } }) as any
  apiClient.post = (async () => ({})) as any
  function Harness() { const tutor = useAiTutor('talk'); useRealtimeCoach(tutor, true, 'coach', 'gemini'); return <span>{tutor.conversationLanguage.selection}</span> }
  const root = createRoot(document.getElementById('root')!)
  const wait = () => act(async () => { await new Promise(resolve => setTimeout(resolve, 700)) })
  try {
    await i18n.changeLanguage('en')
    await act(async () => root.render(<MemoryRouter><Harness/></MemoryRouter>)); await wait()
    const initialSessions = sessions.length, initialContexts = contexts.length
    await act(async () => useAiAssistantStore.getState().pushMessage(owner, threadId, { id: 'preview', role: 'assistant', content: 'Partial', status: 'streaming', delivery: 'voice', createdAt: '2026-11-21' }))
    for (let n = 0; n < 3; n++) { await act(async () => useAiAssistantStore.getState().updateMessage(owner, threadId, 'preview', { content: `Partial ${n}` })); await wait() }
    const after = useAiAssistantStore.getState().threadsByOwner[owner][0].messages
    console.log(JSON.stringify({ initialSessions, afterPreviewSessions: sessions.length, contextUpdatesDuringPreview: contexts.length - initialContexts, restoredSelection: document.getElementById('root')!.textContent }))
    assert.equal(sessions.length, initialSessions, 'A transcript without language metadata cannot restart the live session')
    assert.equal(document.getElementById('root')!.textContent, 'uz', 'Legacy Russian preference migrates to Uzbek and survives streaming previews')
    assert.equal(contexts.length, initialContexts, 'Transcript tokens must not trigger provider context updates')
    assert.equal(after[after.length - 1].content, 'Partial 2')
    await act(async () => useAiAssistantStore.getState().updateMessage(owner, threadId, 'preview', { lesson: {
      version: 1, id: 'fractions', language: 'en', title: 'Fractions',
      blocks: [{ id: 'half', type: 'explanation', title: 'One half', text: 'One half is one of two equal parts.', narration: '', highlights: [] }],
    } }))
    await wait()
    assert.equal(contexts.length, initialContexts + 1, 'An actual lesson change still updates live context')
    assert.ok(contexts.at(-1).lessonContext.includes('One half'))
    assert.equal(sessions.length, initialSessions, 'Updating a lesson keeps the native audio session open')
    const initialPreferences = preferenceRequests
    await act(async () => useAuthStore.setState({ user: { ...user, xp: 10 } }))
    await wait()
    assert.equal(preferenceRequests, initialPreferences, 'Updating account progress cannot refetch voice preferences')
  } finally { await act(async () => root.unmount()); Object.assign(prototype, { start: original.start, stop: original.stop, updateContext: original.update }); apiClient.get = original.get; apiClient.post = original.post }
}
