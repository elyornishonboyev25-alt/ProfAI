import assert from 'node:assert/strict'
import { useAiAssistantStore, type AiAssistantThread } from '@/store/aiAssistantStore'

export async function run() {
  localStorage.clear()
  window.sessionStorage.clear()
  useAiAssistantStore.setState({ threadsByOwner: {}, activeThreadIds: {}, threadsLoaded: {}, threadsLoading: {} })
  const owner = 'user:session-owner'
  const other = 'user:other-owner'
  const store = () => useAiAssistantStore.getState()
  const message = { id: 'old-message', role: 'user' as const, content: 'Saved conversation', createdAt: '2026-01-01T08:00:00.000Z' }
  const saved: AiAssistantThread = { id: 'saved-conversation', title: 'Saved chat', createdAt: message.createdAt, updatedAt: message.createdAt, messages: [message], synced: true }

  store().setThreads(owner, [saved])
  const initialDraft = store().ensureActiveThread(owner)
  assert.notEqual(initialDraft, saved.id, 'Loading history must not select an old conversation')
  assert.equal(store().ensureActiveThread(owner), initialDraft, 'Multiple chat surfaces share the same blank draft')
  store().setThreads(owner, [saved])
  assert.equal(store().activeThreadIds[owner], initialDraft, 'History arriving late never replaces the welcome draft')

  store().setActiveThread(owner, saved.id)
  assert.equal(store().ensureActiveThread(owner), saved.id, 'Returning from another site page continues the selected conversation')
  await useAiAssistantStore.persist.rehydrate()
  assert.equal(store().ensureActiveThread(owner), saved.id, 'Reloading the same open tab continues the conversation')

  window.sessionStorage.clear()
  await useAiAssistantStore.persist.rehydrate()
  assert.equal(store().ensureActiveThread(owner), initialDraft, 'Reopening the site reuses its existing blank composer')
  assert.ok(store().threadsByOwner[owner].some((thread) => thread.id === saved.id), 'Previous conversations remain available in history')
  for (let visit = 0; visit < 3; visit++) {
    window.sessionStorage.clear()
    await useAiAssistantStore.persist.rehydrate()
    assert.equal(store().ensureActiveThread(owner), initialDraft, 'An unused draft survives later visits without multiplying')
  }
  assert.equal(store().threadsByOwner[owner].filter((thread) => thread.messages.length === 0).length, 1)

  store().pushMessage(owner, initialDraft, { ...message, id: 'first-turn', content: 'Start a new conversation' })
  store().syncThread(owner, initialDraft, { ...saved, id: 'promoted-conversation', messages: [] })
  await useAiAssistantStore.persist.rehydrate()
  assert.equal(store().ensureActiveThread(owner), 'promoted-conversation', 'A text or voice draft promoted to a server ID still resumes after reload')
  assert.equal(store().threadsByOwner[owner].find((thread) => thread.id === 'promoted-conversation')?.messages.length, 1)
  window.sessionStorage.clear()
  await useAiAssistantStore.persist.rehydrate()
  const nextDraft = store().ensureActiveThread(owner)
  assert.notEqual(nextDraft, 'promoted-conversation', 'A used conversation is not reopened on a fresh visit')
  assert.equal(store().startNewThread(owner), nextDraft, 'New chat also reuses the one empty composer')

  store().setActiveThread(owner, 'promoted-conversation')
  window.dispatchEvent(new window.PageTransitionEvent('pageshow', { persisted: false }))
  assert.equal(store().activeThreadIds[owner], 'promoted-conversation', 'An ordinary page show does not interrupt the current conversation')
  window.dispatchEvent(new window.PageTransitionEvent('pageshow', { persisted: true }))
  assert.equal(store().ensureActiveThread(owner), nextDraft, 'Returning from an external site through back/forward cache opens the blank composer')

  const otherDraft = store().ensureActiveThread(other)
  assert.notEqual(otherDraft, nextDraft, 'Each account has its own draft')
  store().setActiveThread(owner, saved.id)
  store().endChatSession(owner)
  assert.equal(store().ensureActiveThread(owner), nextDraft, 'Signing out ends automatic conversation restoration')
  assert.equal(store().activeThreadIds[other], otherDraft, 'Ending one account session leaves other accounts isolated')
  store().setActiveThread(owner, saved.id)
  store().removeThread(owner, saved.id)
  assert.equal(store().ensureActiveThread(owner), nextDraft, 'Deleting the active chat returns to the blank composer')
  store().clearMessages(owner)
  assert.equal(store().threadsByOwner[owner], undefined, 'Account deletion clears its drafts and history')
  assert.equal(store().activeThreadIds[other], otherDraft)

  console.log('PASS: fresh visits, same-tab navigation and reload, one reusable blank draft, server promotion, account isolation and history retention')
}
