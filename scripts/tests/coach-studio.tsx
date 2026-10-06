import assert from 'node:assert/strict'
import '@/i18n'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import CoachMascot from '@/components/ai/CoachMascot'
import CoachControls from '@/components/ai/CoachControls'
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
    await act(async () => root.render(<><CoachMascot state="speaking" level={.1}/><CoachMascot state="speaking" level={.8}/><CoachControls/></>))
    const mouth = [...host.querySelectorAll('[data-mouth-open]')].map((element) => Number(element.getAttribute('data-mouth-open')))
    assert.ok(mouth[1] > mouth[0], 'The mouth follows audio amplitude')
    const ids = [...host.querySelectorAll('[id]')].map((element) => element.id)
    assert.equal(new Set(ids).size, ids.length, 'Multiple companions never collide on SVG gradient IDs')
    const strict = [...host.querySelectorAll('button')].find((button) => /Focused|Talabchan|Требовательный/.test(button.textContent!))!
    await act(async () => strict.click())
    const practice = [...host.querySelectorAll('button')].find((button) => /Challenge me|Mashq qildir|Дай задание/.test(button.textContent!))!
    await act(async () => practice.click())
    const preferences = useAiAssistantStore.getState().coachPreferencesByOwner['user:coach-a']
    assert.equal(preferences.style, 'strict')
    assert.equal(preferences.lessonMode, 'practice')
    await act(async () => useAuthStore.setState({ user: { id: 'coach-b', fullName: 'Other Learner', role: 'USER' } as any }))
    assert.equal(host.querySelector('input')?.checked, false)
    assert.equal(useAiAssistantStore.getState().coachPreferencesByOwner['user:coach-b'], undefined)
    assert.deepEqual(DEFAULT_COACH_PREFERENCES, { style: 'adaptive', lessonMode: 'teach', playfulLanguage: false })
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
      return new Response(JSON.stringify({ overallBand: 6, errors: [] }))
    }
    await chatWithAssistant('Give me a challenge.', [], '/ai-tutor', { coachPreferences: preferences })
    await evaluateWriting('task1', 'Describe the chart.', 'A sample essay.', 999999, 'The chart shows 10 then 20.')
    assert.ok(calledWriting && calledChat)
    await act(async () => root.render(<CoachMascot state="listening" level={.9}/>))
    assert.equal(host.querySelector('[data-mouth-open]'), null, 'Listening never animates a speaking mouth')
    console.log('PASS: amplitude mouth, unique SVG IDs, account-isolated controls, chat preferences and server Writing route')
  } finally { globalThis.fetch = originalFetch; await act(async () => root.unmount()) }
}
