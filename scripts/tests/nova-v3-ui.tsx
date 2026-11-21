import assert from 'node:assert/strict'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import '@/i18n'
import { usePushToTalk } from '@/components/ai/usePushToTalk'
import NovaLessonBoard from '@/components/ai/NovaLessonBoard'
import { NovaTurnGate } from '@/lib/novaTurnGate'
import { useNovaLanguage } from '@/components/ai/useNovaLanguage'
import { useAiAssistantStore } from '@/store/aiAssistantStore'
import { apiClient } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import { persistAiMessage, fetchAiThreads } from '@/services/aiWorkspacePersistence'

export async function run() {
  const events: string[] = [], gate = new NovaTurnGate({ start: () => events.push('start'), audio: () => events.push('audio'), end: () => events.push('end') })
  const silence = new Uint8Array(3200), speech = new Uint8Array(3200); for (let n = 0; n < speech.length; n += 2) new DataView(speech.buffer).setInt16(n, n % 4 ? 3000 : -3000, true)
  gate.hold(); gate.hold(); for (let n = 0; n < 5; n++) gate.push(silence); gate.release(); gate.push(silence)
  assert.deepEqual(events, [], 'An empty held turn neither opens activity nor asks the provider for a response')
  gate.hold(); gate.push(speech); for (let n = 0; n < 30; n++) gate.push(silence)
  assert.equal(events.filter(e => e === 'end').length, 0, 'Thinking pauses cannot end a held turn')
  gate.release(); gate.push(speech); gate.push(silence); gate.push(silence)
  assert.equal(events.filter(e => e === 'start').length, 1); assert.equal(events.filter(e => e === 'end').length, 1)
  gate.cancel(); gate.push(silence); assert.equal(events.filter(e => e === 'end').length, 1)

  const host = document.getElementById('root')!, root = createRoot(host), calls: string[] = []
  function Ptt({ enabled = true }) { const ptt = usePushToTalk(enabled, () => calls.push('start'), cancel => calls.push(cancel ? 'cancel' : 'end')); return <div><input aria-label="Typing"/><textarea/><button onPointerDown={ptt.press} onPointerUp={() => ptt.release()}>Hold</button><span>{String(ptt.held)}</span></div> }
  const keyboard = (type: string, target: EventTarget = window, repeat = false) => { const event = new window.KeyboardEvent(type, { code: 'Space', key: ' ', repeat, bubbles: true, cancelable: true }); target.dispatchEvent(event); return event }
  try {
    await act(async () => root.render(<Ptt/>))
    await act(async () => { assert.equal(keyboard('keydown').defaultPrevented, true); assert.equal(keyboard('keydown', window, true).defaultPrevented, true) })
    assert.deepEqual(calls, ['start']); await act(async () => { keyboard('keyup') }); assert.deepEqual(calls, ['start', 'end'])
    await act(async () => { assert.equal(keyboard('keydown', host.querySelector('input')!).defaultPrevented, false); assert.equal(keyboard('keydown', host.querySelector('textarea')!).defaultPrevented, false); assert.equal(keyboard('keydown', host.querySelector('button')!).defaultPrevented, false) })
    assert.equal(calls.length, 2)
    await act(async () => { keyboard('keydown'); window.dispatchEvent(new Event('blur')); keyboard('keyup') }); assert.deepEqual(calls.slice(-2), ['start', 'cancel'])
    await act(async () => { keyboard('keydown') }); await act(async () => root.render(<Ptt enabled={false}/>)); assert.equal(calls.at(-1), 'cancel')

    let state: any
    function Language({ owner }: { owner: string }) { state = useNovaLanguage(owner, 'thread', 'uz'); return <span>{state.selection}:{state.lastReliable}</span> }
    await act(async () => root.render(<Language owner="a"/>)); await act(async () => state.choose('ru'))
    assert.equal(state.language, 'ru'); await act(async () => state.observe('okay')); assert.equal(state.language, 'ru')
    await act(async () => root.render(<Language owner="b"/>)); assert.equal(state.language, 'uz', 'Language settings are account scoped')
    assert.equal(useAiAssistantStore.getState().conversationLanguages['a:thread'].selection, 'ru')

    const lesson: any = { version: 1, id: 'fixture', language: 'uz', title: 'Kasrlarni o‘rganamiz', blocks: [
      { id: 'f', title: 'Formula', type: 'formula', latex: '\\frac{1}{2}+\\frac{1}{2}=1', explanation: 'Bu yerda teng qismlarni qo‘shamiz.', symbols: [] },
      { id: 'ex', title: 'Misol', type: 'worked_example', problem: 'Bir xil maxrajlar.', steps: [{ id: 's1', text: 'Avval suratni qo‘shamiz.' }, { id: 's2', text: 'Keyin maxrajni saqlaymiz.' }] },
      { id: 'try', title: 'Mashq', type: 'exercise', prompt: 'Endi mustaqil urinib ko‘ring.', hint: 'Maxraj o‘zgarmaydi.' },
    ] }
    let progress: any; const oldPost = apiClient.post; let generatedAudio = 0
    apiClient.post = (async () => { generatedAudio++; return {} }) as any
    try {
      await act(async () => root.render(<NovaLessonBoard lesson={lesson} progress={{ activeBlockId: 'ex', revealedSteps: {}, answers: { try: '1/2' } }} onProgress={value => { progress = value }} />))
      assert.equal(generatedAudio, 0, 'Reopening a lesson never autoplays old audio')
      assert.ok(host.querySelector('.katex')); assert.equal(host.querySelectorAll('script').length, 0)
      assert.equal(host.querySelector('[data-active=true]')?.getAttribute('data-block-id'), 'ex')
      const next = [...host.querySelectorAll('button')].find(button => button.textContent?.includes('Keyingi qadam'))!
      await act(async () => next.click()); assert.equal(progress.revealedSteps.ex, 2)
      assert.equal((host.querySelector('textarea') as HTMLTextAreaElement).value, '1/2')
      await act(async () => window.dispatchEvent(new Event('nova:interrupt')))
      assert.equal(host.querySelector('[data-active=true]')?.getAttribute('data-block-id'), 'ex', 'Interruption freezes the board at its current section')
      const oldGet = apiClient.get, oldPatch = apiClient.patch
      let body: any, savedProgress: any
      useAuthStore.setState({ user: { id: 'lesson-owner', role: 'USER' } as any })
      apiClient.post = (async (_path, input) => { body = input; return {} }) as any
      apiClient.patch = (async (_path, input) => { savedProgress = input; return {} }) as any
      const annotated: any = { id: 'saved-board', role: 'assistant', content: 'Bu yerda dars bor.', createdAt: '2026-11-21', lesson, lessonProgress: { activeBlockId: 'ex', revealedSteps: { ex: 2 }, answers: { try: '1/2' } }, language: { selection: 'uz', response: 'uz', lastReliable: 'uz' } }
      try {
        await persistAiMessage('owned-lesson', annotated, 'uz', 'lesson-owner')
        apiClient.get = (async () => ({ items: [{ id: 'owned-lesson', title: 'Board', messages: [{ ...body, metadata: { ...body.metadata, lessonProgress: savedProgress }, createdAt: annotated.createdAt }] }] })) as any
        const restored = (await fetchAiThreads())[0].messages[0]
        assert.equal(restored.lesson?.blocks.length, 3)
        assert.deepEqual(restored.lessonProgress, annotated.lessonProgress)
        assert.deepEqual(restored.language, annotated.language)
      } finally { apiClient.get = oldGet; apiClient.patch = oldPatch }
    } finally { apiClient.post = oldPost }
    console.log('PASS: held-space repeat/typing/blur/disable, blank speech, automatic and held activity, per-account language, safe formula rendering, lesson steps, saved attempts and frozen board')
  } finally { await act(async () => root.unmount()) }
}
