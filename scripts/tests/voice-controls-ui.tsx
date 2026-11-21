import assert from 'node:assert/strict'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import i18n from '@/i18n'
import { TalkOverlay } from '@/components/ai/TalkOverlay'
import { useAuthStore } from '@/store/authStore'
import { useAiAssistantStore } from '@/store/aiAssistantStore'
import { apiClient } from '@/lib/apiClient'

export async function run() {
  const get = apiClient.get, post = apiClient.post
  const host = document.getElementById('root')!
  const root = createRoot(host)
  useAuthStore.setState({ user: { id: 'voice-controls', fullName: 'Learner', email: 'fixture@example.invalid', role: 'ADMIN', access: { kind: 'UNLIMITED', active: true, expiresAt: null } } as any, accessToken: 'fixture-token' })
  apiClient.get = (async path => path.endsWith('/capabilities') ? { naturalVoice: false, voiceProvider: 'gemini' } : { items: [] }) as typeof apiClient.get
  apiClient.post = (async () => ({})) as typeof apiClient.post
  try {
    await i18n.changeLanguage('en')
    await act(async () => { useAiAssistantStore.getState().openTalk(); root.render(<MemoryRouter><TalkOverlay /></MemoryRouter>) })
    const dialog = document.querySelector('[role="dialog"]')!
    assert.ok(dialog, 'The real voice dialog is rendered')
    assert.ok(!dialog.textContent?.includes('Personal coach'))
    assert.ok(!dialog.textContent?.includes('IELTS examiner'))
    assert.equal(dialog.querySelector('[aria-label="Conversation mode"]'), null)
    assert.equal(dialog.querySelector('[aria-label="Speech speed"]'), null)
    assert.equal(dialog.querySelector('[aria-label="Language"]'), null)
    assert.equal(dialog.querySelector('select'), null, 'Voice opens directly without language or comeback selectors')
    for (const name of ['English', 'Uzbek', 'Russian', '0.9×', '1.1×', '1.25×']) assert.ok(![...dialog.querySelectorAll('button')].some(button => button.textContent === name), `${name} is not a voice setting`)
    assert.ok(dialog.textContent?.includes('Return to chat'), 'Conversation navigation remains available')
    assert.ok(dialog.querySelector('button[aria-label="End voice"]'), 'The voice dialog can still be closed')
    console.log('PASS: voice opens without mode/language/comeback controls and retains its navigation')
  } finally { await act(async () => root.unmount()); apiClient.get = get; apiClient.post = post }
}
