import assert from 'node:assert/strict'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import CoachMascot from '@/components/ai/CoachMascot'
import { useAiAssistantStore } from '@/store/aiAssistantStore'
import { useAuthStore } from '@/store/authStore'
import { NovaPlayback } from '@/lib/novaPlayback'
import { defaultNovaPerformance, novaExpressions } from '@/lib/novaPersona'
import { fetchAiThreads, persistAiMessage } from '@/services/aiWorkspacePersistence'
import { apiClient } from '@/lib/apiClient'

export async function run() {
  const published: any[] = []
  const playback = new NovaPlayback((value, id) => published.push({ value, id }))
  playback.cue('old', defaultNovaPerformance('playful_angry'))
  assert.equal(published.length, 0, 'Queued audio must not change the face')
  playback.start('old')
  assert.equal(published.at(-1).value.expression, 'playful_angry')
  playback.cue('next', defaultNovaPerformance('supportive'))
  assert.equal(published.at(-1).id, 'old')
  playback.finish('old'); playback.start('next')
  const count = published.length
  playback.cue('old', defaultNovaPerformance('delighted')); playback.start('old'); playback.finish('old')
  assert.equal(published.length, count, 'Late events from a cancelled turn cannot change the new expression')
  playback.cue('next', { intensity: 100 })
  assert.equal(published.length, count, 'Malformed provider metadata is ignored')
  playback.reset()
  assert.equal(published.at(-1).value, null)

  const host = document.getElementById('root')!
  const root = createRoot(host)
  const user = { id: 'nova-owner-a', fullName: 'Learner', role: 'USER' } as any
  useAuthStore.setState({ user })
  const state = useAiAssistantStore.getState(), owner = `user:${user.id}`
  const threadId = state.startNewThread(owner)
  const performance = defaultNovaPerformance('affectionate')
  const oldGet = apiClient.get, oldPost = apiClient.post
  try {
    await act(async () => root.render(<CoachMascot />))
    await act(async () => state.pushMessage(owner, threadId, { id: 'a', role: 'assistant', content: 'An explanation.', createdAt: '2026-11-21', expression: 'affectionate', performance }))
    assert.equal(host.querySelector('[data-expression]')?.getAttribute('data-expression'), 'affectionate')
    await act(async () => state.pushMessage(owner, threadId, { id: 'u', role: 'user', content: 'Now be serious.', createdAt: '2026-11-21' }))
    assert.equal(host.querySelector('[data-expression]')?.getAttribute('data-expression'), 'warm', 'A new question clears the preceding reply performance')
    await act(async () => { state.setVoiceState('speaking'); state.setVoicePresentation({ owner, threadId, responseId: 'live', performance: defaultNovaPerformance('focused') }) })
    assert.equal(host.querySelector('[data-expression]')?.getAttribute('data-expression'), 'focused')
    await act(async () => state.syncThread(owner, threadId, { id: 'saved-live-thread', title: 'Live chat', createdAt: '2026-11-21', updatedAt: '2026-11-21', synced: true, messages: [] }))
    assert.equal(useAiAssistantStore.getState().voicePresentation?.threadId, 'saved-live-thread')
    assert.equal(host.querySelector('[data-expression]')?.getAttribute('data-expression'), 'focused', 'Saving a local draft preserves the active playback face')
    await act(async () => useAuthStore.setState({ user: { ...user, id: 'nova-owner-b' } }))
    assert.equal(host.querySelector('[data-expression]')?.getAttribute('data-expression'), 'warm', 'Account switching never leaks a live expression')
    for (const expression of novaExpressions) {
      await act(async () => root.render(<CoachMascot expression={expression} state="idle" />))
      assert.equal(host.querySelector('[data-expression]')?.getAttribute('data-expression'), expression)
      assert.ok(host.querySelector('svg .nova-brow'))
    }
    assert.equal(host.querySelector('[data-reduced-motion]')?.getAttribute('data-reduced-motion'), 'true')
    let stored: any
    apiClient.post = (async (_path, body) => { stored = JSON.parse(JSON.stringify(body)); return {} }) as any
    await persistAiMessage('owned', { id: 'saved', role: 'assistant', content: 'We can take it slowly.', createdAt: '2026-11-21', delivery: 'voice', performance, expression: 'affectionate', status: 'interrupted' }, 'uz')
    apiClient.get = (async () => ({ items: [{ id: 'owned', title: 'Nova', messages: [{ ...stored, createdAt: '2026-11-21' }] }] })) as any
    const restored = (await fetchAiThreads())[0].messages[0]
    assert.deepEqual(restored.performance, performance)
    assert.equal(restored.status, 'interrupted'); assert.equal(restored.delivery, 'voice')
    assert.equal(restored.expression, 'affectionate')
    console.log('PASS: playback-scoped expression, queue/cancellation/late events, account isolation, all vector faces, reduced motion and history metadata round trip')
  } finally {
    apiClient.get = oldGet; apiClient.post = oldPost
    await act(async () => { state.setVoicePresentation(null); state.setVoiceState('idle'); root.unmount() })
  }
}
