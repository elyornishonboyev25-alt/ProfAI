import assert from 'node:assert/strict'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import '@/i18n'
import NovaMemoryCard from '@/components/ai/NovaMemoryCard'
import NovaLearningNotes from '@/components/ai/NovaLearningNotes'
import { useAuthStore } from '@/store/authStore'
import { useAiAssistantStore, type AiAssistantMessage } from '@/store/aiAssistantStore'
import { apiClient, ApiError } from '@/lib/apiClient'
import { persistAiMessage, fetchAiThreads } from '@/services/aiWorkspacePersistence'
import { NovaPlayback } from '@/lib/novaPlayback'
import { defaultNovaPerformance } from '@/lib/novaPersona'

export async function run() {
  const events: any[] = [], playback = new NovaPlayback((value, id) => events.push({ value, id }))
  playback.cue('r', defaultNovaPerformance('warm')); playback.begin('r', 10)
  playback.schedule('r', defaultNovaPerformance('focused'), 11)
  playback.advance(9.9); assert.equal(events.length, 0)
  playback.advance(10); assert.equal(events.at(-1).value.expression, 'warm')
  playback.advance(10); assert.equal(events.at(-1).value.expression, 'warm', 'Wall time without audio progress cannot change delivery')
  playback.advance(11); assert.equal(events.at(-1).value.expression, 'focused')
  assert.deepEqual(playback.timeline('r').map(cue => cue.atMs), [0, 1000])
  playback.finish('r'); const count = events.length
  playback.schedule('r', defaultNovaPerformance('playful_angry'), 12); playback.advance(20)
  assert.equal(events.length, count, 'A cancelled cue cannot leak into the next response')

  const host = document.getElementById('root')!, root = createRoot(host)
  const oldPost = apiClient.post, oldGet = apiClient.get, oldConfirm = window.confirm
  const user = { id: 'nova-v2-a', fullName: 'Learner', role: 'USER' } as any
  useAuthStore.setState({ user, accessToken: 'fixture-token' })
  const owner = `user:${user.id}`, store = useAiAssistantStore.getState()
  const localId = store.startNewThread(owner)
  store.syncThread(owner, localId, { id: 'nova-v2-thread', title: 'Saved', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), synced: true, messages: [] })
  const message: AiAssistantMessage = { id: 'finalized', role: 'user', content: 'My completed question.', createdAt: new Date().toISOString() }
  store.pushMessage(owner, 'nova-v2-thread', message)
  let calls = 0
  try {
    apiClient.post = (async () => { calls++; throw new ApiError('Offline', 503) }) as any
    await assert.rejects(persistAiMessage('nova-v2-thread', message, 'en', user.id))
    assert.equal(calls, 2, 'Persistence retries are bounded')
    assert.equal(useAiAssistantStore.getState().threadsByOwner[owner][0].messages[0].pendingSync, true)
    apiClient.get = (async () => ({ items: [] })) as any
    await act(async () => { const fromServer = await fetchAiThreads(); store.setThreads(owner, fromServer) })
    assert.equal(useAiAssistantStore.getState().threadsByOwner[owner][0].messages[0].content, message.content, 'Reloading an empty server catalog cannot erase an unsynced finalized turn')
    apiClient.post = (async () => { calls++; return {} }) as any
    await persistAiMessage('nova-v2-thread', message, 'en', user.id)
    assert.equal(useAiAssistantStore.getState().threadsByOwner[owner][0].messages[0].pendingSync, false)
    useAuthStore.setState({ user: { ...user, id: 'nova-v2-b' } })
    const before = calls
    await assert.rejects(persistAiMessage('nova-v2-thread', message, 'en', user.id))
    assert.equal(calls, before, 'A delayed save is rejected before any request in the new account')
    useAuthStore.setState({ user })
    let captured: any
    apiClient.post = (async (_url, body) => { captured = JSON.parse(JSON.stringify(body)); return {} }) as any
    const delivery = defaultNovaPerformance('focused')
    const annotated: AiAssistantMessage = { id: 'annotated', role: 'assistant', content: 'A checked example.', createdAt: '2026-11-21', performance: delivery,
      understanding: { intent: 'explanation', topic: 'Fractions', approach: 'concrete_example', temporaryTone: 'serious' },
      deliverySegments: [{ text: 'A checked example.', performance: delivery }], performanceTimeline: [{ atMs: 0, performance: delivery, alignment: 'audio_clock' }] }
    await persistAiMessage('nova-v2-thread', annotated, 'uz', user.id)
    apiClient.get = (async () => ({ items: [{ id: 'nova-v2-thread', title: 'Saved', messages: [{ ...captured, createdAt: '2026-11-21' }] }] })) as any
    const reloaded = (await fetchAiThreads())[0].messages[0]
    assert.deepEqual(reloaded.understanding, annotated.understanding)
    assert.deepEqual(reloaded.deliverySegments, annotated.deliverySegments)
    assert.deepEqual(reloaded.performanceTimeline, annotated.performanceTimeline)
    assert.equal(reloaded.locale, 'uz', 'Reload preserves the reply language as well as delivery metadata')

    const memory = { id: 'memory', key: 'address_preference', value: 'Use siz', revision: 1, origin: 'user', createdAt: '2026-11-21', updatedAt: '2026-11-21' }
    await act(async () => root.render(<NovaMemoryCard memory={memory} onSave={async () => { throw new Error('revision conflict') }} onDelete={async () => { throw new Error('offline') }} />))
    await act(async () => (host.querySelectorAll('button')[0] as HTMLButtonElement).click())
    await act(async () => host.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
    assert.ok(host.querySelector('[role=alert]'), 'A failed edit stays visible and recoverable')
    assert.ok(host.querySelector('textarea'), 'An edit error does not silently discard the editor')
    await act(async () => (host.querySelectorAll('button')[1] as HTMLButtonElement).click())
    window.confirm = () => true
    await act(async () => (host.querySelectorAll('button')[1] as HTMLButtonElement).click())
    assert.ok(host.textContent?.includes('Use siz'), 'A failed delete keeps the original memory visible')
    assert.ok(host.querySelector('[role=alert]'))
    useAuthStore.setState({ user })
    let practice = ''
    apiClient.get = (async () => ({ items: [{ topicKey: 'fractions', topic: 'Adding fractions', status: 'developing', confidence: .2, evidenceCount: 1, independentAttempts: 0, nextExercise: 'Add 1/3 and 1/6.', lastPractice: { quote: 'I used your hint.', assistance: 'hinted', observedAt: '2026-11-21' } }] })) as any
    await act(async () => root.render(<NovaLearningNotes userId={user.id} onPractice={text => { practice = text }} />))
    assert.ok(host.textContent?.includes('Adding fractions'))
    assert.ok(host.textContent?.includes('I used your hint.'))
    await act(async () => (host.querySelector('button') as HTMLButtonElement).click())
    assert.equal(practice, 'Add 1/3 and 1/6.', 'The proposed exercise is available for an independent attempt')
    apiClient.get = (async () => ({ items: [] })) as any
    useAuthStore.setState({ user: { ...user, id: 'nova-v2-b' } })
    await act(async () => root.render(<NovaLearningNotes userId="nova-v2-b" onPractice={() => {}} />))
    assert.ok(!host.textContent?.includes('Adding fractions'), 'Learning notes clear when the account changes')
    console.log('PASS: audio-clock segments, cancellation, bounded offline outbox, reopen survival, account fencing and visible memory edit/delete errors')
  } finally {
    apiClient.post = oldPost; apiClient.get = oldGet; window.confirm = oldConfirm
    await act(async () => root.unmount())
  }
}
