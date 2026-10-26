import assert from 'node:assert/strict'
import { act, useState } from 'react'
import { createRoot } from 'react-dom/client'
import SourceQuestionLayout from '../../src/components/ielts/SourceQuestionLayout'
import { telegramListeningTests, telegramReadingTests } from '../../src/data/telegramIeltsPapers'

export async function run() {
  Object.assign(globalThis, { HTMLSelectElement: window.HTMLSelectElement })
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  let saved: Record<string, string | string[]> = {}
  const section = telegramListeningTests[0].sections[0]
  function Harness() {
    const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
    saved = answers
    return <SourceQuestionLayout html={section.sourceQuestionsHtml!} questions={section.questions} answers={answers}
      onAnswer={(id, value) => setAnswers(previous => ({ ...previous, [id]: value }))} />
  }
  await act(async () => root.render(<Harness />))
  const input = host.querySelector<HTMLInputElement>('input[data-source-question]')!
  assert.ok(input)
  await act(async () => { input.value = 'test answer'; input.dispatchEvent(new Event('input', { bubbles: true })) })
  assert.equal(saved[input.dataset.sourceQuestion!], 'test answer')
  assert.equal(input.value, 'test answer')

  const multi = telegramListeningTests.find(test => test.sections.some(part => part.questions.some(q => Array.isArray(q.correctAnswer))))!
  const part = multi.sections.find(p => p.questions.some(q => Array.isArray(q.correctAnswer)))!
  let selections: string[] = []
  function Multiple() {
    const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
    return <SourceQuestionLayout html={part.sourceQuestionsHtml!} questions={part.questions} answers={answers}
      onAnswer={(id, value) => { selections = value as string[]; setAnswers(previous => ({ ...previous, [id]: value })) }} />
  }
  await act(async () => root.render(<Multiple />))
  const checkboxes = [...host.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')]
  const id = checkboxes[0].dataset.sourceQuestion
  const choices = checkboxes.filter(control => control.dataset.sourceQuestion === id)
  await act(async () => { choices[0].click(); choices[1].click() })
  assert.equal(selections.length, 2)
  await act(async () => choices[2].click())
  assert.equal(selections.length, 2)
  assert.equal(choices[2].checked, false)

  const reading = JSON.parse(JSON.stringify(telegramReadingTests[0].sections[0]))
  const correct = Object.fromEntries(reading.questions.map((q: { id: string; correctAnswer: string | string[] }) => [q.id, { status: 'correct' as const, correctAnswer: q.correctAnswer }]))
  const restored = { [reading.questions[0].id]: 'white' }
  await act(async () => root.render(<SourceQuestionLayout html={reading.sourceQuestionsHtml} questions={reading.questions} answers={restored}
    onAnswer={() => assert.fail('Review cannot change answers')} review showCorrectAnswers reviewQuestions={new Map(Object.entries(correct))} />))
  assert.ok([...host.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input,select')].every(control => control.disabled))
  assert.ok(host.querySelector('[data-source-feedback]')?.textContent?.includes('Correct:'))
  assert.ok(host.querySelector(`#question-card-${reading.questions[0].id}`))
  await act(async () => root.render(<SourceQuestionLayout html='<script>window.bad=true</script><img src="/test.png" onerror="window.bad=true"><input data-source-question="x">' questions={[]} answers={{}} onAnswer={() => {}} />))
  assert.equal(host.querySelectorAll('script,[onerror]').length, 0)
  await act(async () => root.unmount())
  host.remove()
  console.log('PASS: original source inputs, multi-choice limits, persisted-paper review, navigation anchors and HTML sanitization')
}
