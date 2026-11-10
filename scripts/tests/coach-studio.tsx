import assert from 'node:assert/strict'
import '@/i18n'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import CoachMascot from '@/components/ai/CoachMascot'
import { useAiAssistantStore } from '@/store/aiAssistantStore'
import { useAuthStore } from '@/store/authStore'
import { chatWithAssistant, evaluateWriting } from '@/services/geminiAI'
import { DEFAULT_COACH_PREFERENCES } from '@/services/ai/coachPreferences'

export async function run() {
  const host = document.getElementById('root')!
  const root = createRoot(host)
  const originalFetch = globalThis.fetch
  useAuthStore.setState({ user: { id: 'coach-a', fullName: 'Learner', email: 'test@example.invalid', role: 'USER' } as any, accessToken: 'fake-test-token' })
  try {
    await act(async () => root.render(<><CoachMascot state="speaking" level={.1}/><CoachMascot state="speaking" level={.8}/></>))
    const mouth = [...host.querySelectorAll('[data-mouth-open]')].map((element) => Number(element.getAttribute('data-mouth-open')))
    assert.ok(mouth[1] > mouth[0], 'The mouth follows audio amplitude')
    const ids = [...host.querySelectorAll('[id]')].map((element) => element.id)
    assert.equal(new Set(ids).size, ids.length, 'Multiple companions never collide on SVG gradient IDs')
    const preferences = DEFAULT_COACH_PREFERENCES
    const owner = 'user:coach-a'
    const threadId = useAiAssistantStore.getState().startNewThread(owner)
    await act(async () => useAiAssistantStore.getState().pushMessage(owner, threadId, { id: 'reply', role: 'assistant', content: 'Try this again.', expression: 'focused', createdAt: new Date().toISOString() }))
    assert.equal(host.querySelector('[data-expression]')?.getAttribute('data-expression'), 'focused')
    assert.equal(host.querySelector('fieldset'), null, 'The tutor has no manual style or lesson panel')
    await act(async () => useAuthStore.setState({ user: { id: 'coach-b', fullName: 'Other Learner', role: 'USER' } as any }))
    assert.equal(host.querySelector('[data-expression]')?.getAttribute('data-expression'), 'warm', 'Another account never inherits the previous conversation tone')
    let calledWriting = false, calledChat = false
    globalThis.fetch = async (url, options) => {
      const body = JSON.parse(String(options?.body))
      if (String(url).endsWith('/ai/assistant/chat')) {
        assert.deepEqual(body.coachPreferences, preferences); calledChat = true
        return new Response(JSON.stringify({ reply: 'Let’s practise.', actions: [], memoryUpdates: [], title: null }))
      }
      assert.ok(String(url).endsWith('/ai/generate/writing/evaluate'))
      assert.equal(body.systemPrompt, undefined); assert.equal(body.wordCount, undefined)
      assert.equal(body.visualContext, 'The chart shows 10 then 20.'); calledWriting = true
      return new Response(JSON.stringify({ overallBand: 6, taskAchievement: 6, coherenceCohesion: 6, lexicalResource: 6, grammaticalRange: 6, summary: 'Practice assessment.', errors: [] }))
    }
    await chatWithAssistant('Give me a challenge.', [], '/ai-tutor', { coachPreferences: preferences })
    await evaluateWriting('task1', 'Describe the chart.', 'A sample essay.', 999999, 'The chart shows 10 then 20.')
    assert.ok(calledWriting && calledChat)
    await act(async () => root.render(<CoachMascot state="listening" level={.9}/>))
    assert.equal(host.querySelector('[data-mouth-open]'), null, 'Listening never animates a speaking mouth')
    console.log('PASS: amplitude mouth, unique SVG IDs, account-isolated automatic expression, chat context and server Writing route')
  } finally { globalThis.fetch = originalFetch; await act(async () => root.unmount()) }
}
