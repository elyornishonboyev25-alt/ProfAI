import assert from 'node:assert/strict'
import { act, useState } from 'react'
import { createRoot } from 'react-dom/client'
import SourceQuestionLayout from '../../src/components/ielts/SourceQuestionLayout'
import { telegramListeningTests, telegramReadingTests } from '../../src/data/telegramIeltsPapers'
import { evaluateReadingAnswers } from '../../src/utils/ieltsUtils'
import type { Section } from '../../src/types/ieltsTypes'

export async function run() {
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  let saved: Record<string, string | string[]> = {}
  let tick = () => {}
  let focused = ''
  function Harness({ section, initial = {}, review = false, show = false }: { section: Section; initial?: Record<string, string | string[]>; review?: boolean; show?: boolean }) {
    const [answers, setAnswers] = useState(initial)
    const [flags, setFlags] = useState(new Set<string>())
    const [, setVersion] = useState(0)
    saved = answers
    tick = () => setVersion(previous => previous + 1)
    const analysis = evaluateReadingAnswers([section], answers)
    const results = new Map(analysis.questionResults.map(question => [question.questionId, { status: question.status, correctAnswer: question.correctAnswer }]))
    return <SourceQuestionLayout html={section.sourceQuestionsHtml!} questions={section.questions} answers={answers}
      onAnswer={(id, value) => { assert.ok(!review); setAnswers(previous => ({ ...previous, [id]: value })) }}
      onQuestionFocus={id => { focused = id }} flaggedQuestionIds={flags}
      onFlagQuestion={id => setFlags(previous => { const next = new Set(previous); if (next.has(id)) next.delete(id); else next.add(id); return next })}
      review={review} showCorrectAnswers={show} reviewQuestions={results} />
  }
  let version = 0
  const mount = (section: Section, initial: Record<string, string | string[]> = {}, review = false, show = false) => act(async () => {
    root.render(<Harness key={++version} section={section} initial={initial} review={review} show={show} />)
  })
  const enter = async (input: HTMLInputElement, value: string) => act(async () => {
    input.focus()
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!.call(input, value)
    input.dispatchEvent(new window.Event('input', { bubbles: true }))
  })

  for (const test of [...telegramListeningTests, ...telegramReadingTests]) for (const section of test.sections) {
    await mount(section)
    for (const question of section.questions) assert.equal(host.querySelectorAll(`[id="question-card-${question.id}"]`).length, 1, `${question.id}: one navigation anchor`)
    const source = document.createElement('template')
    source.innerHTML = section.sourceQuestionsHtml!
    assert.equal(host.querySelector('.ielts-source-paper')!.textContent, source.content.textContent, `${section.id}: saved highlight/note text offsets stay unchanged`)
    assert.equal(host.querySelectorAll('script,[style]:not(.source-map-canvas,.source-map-answer)').length, 0, 'Source inline styles cannot override the shared theme')
  }

  const library = telegramListeningTests[3].sections[1]
  await mount(library)
  assert.equal(host.querySelector('.source-map-image')?.getAttribute('src'), '/images/ielts-telegram-16428-image-1.png')
  assert.equal(host.querySelectorAll('[data-diagram-answer] input').length, 5)
  const word = host.querySelector<HTMLInputElement>('[data-map-question="tg-l34-q16"]')!
  await enter(word, 'Conference Centre')
  assert.equal(saved['tg-l34-q16'], 'Conference Centre')
  assert.equal(focused, 'tg-l34-q16')
  word.setSelectionRange(3, 3)
  await act(async () => tick())
  assert.equal(host.querySelector('[data-map-question="tg-l34-q16"]'), word, 'Audio clock updates preserve the real input node')
  assert.equal(document.activeElement, word)
  assert.equal(word.selectionStart, 3)
  const flag = host.querySelector<HTMLButtonElement>('[aria-label="Flag question 16"]')!
  await act(async () => flag.click())
  assert.equal(flag.getAttribute('aria-pressed'), 'true')
  const restored = JSON.parse(JSON.stringify(saved))
  await mount(JSON.parse(JSON.stringify(library)), restored, true, true)
  assert.equal(host.querySelector<HTMLInputElement>('[data-map-question="tg-l34-q16"]')!.value, 'Conference Centre')
  assert.ok([...host.querySelectorAll<HTMLInputElement>('input')].every(input => input.disabled))
  assert.match(host.querySelector('.source-map-review-list')!.textContent!, /Conference Centre/)
  assert.equal(host.querySelector('[data-map-question="tg-l34-q16"]')!.getAttribute('data-review-status'), 'correct')

  const centre = telegramListeningTests[4].sections[1]
  await mount(centre)
  const pin = (letter: string) => host.querySelector<HTMLInputElement>(`[data-map-location-input="${letter}"]`)!
  const letter = (number: number) => host.querySelector<HTMLSelectElement>(`select[data-source-question="tg-l35-q${number}"]`)!
  assert.equal(host.querySelectorAll('[data-map-location-input]').length, 9)
  assert.ok([...host.querySelectorAll<HTMLInputElement>('[data-map-location-input]')].every(input => !input.value), 'Empty map never reveals answer locations')
  await enter(pin('A'), '15')
  assert.equal(saved['tg-l35-q15'], 'A', 'The chosen location is stored even when it is incorrect')
  assert.equal(letter(15).value, 'A')
  await act(async () => { letter(15).focus(); letter(15).value = 'C'; letter(15).dispatchEvent(new window.Event('change', { bubbles: true })) })
  assert.equal(pin('A').value, '')
  assert.equal(pin('C').value, '15', 'Question list and map synchronize both ways')
  await enter(pin('C'), '1')
  assert.equal(saved['tg-l35-q15'], 'C', 'Partial input does not erase a saved answer')
  await act(async () => pin('C').blur())
  assert.equal(pin('C').value, '15')
  await enter(pin('B'), '16')
  await enter(pin('D'), '16')
  assert.equal(saved['tg-l35-q16'], 'D')
  assert.equal(pin('B').value, '')
  await enter(pin('D'), '99')
  await act(async () => pin('D').blur())
  assert.equal(pin('D').value, '16')
  assert.ok(host.querySelector('[role="alert"]'))
  await enter(pin('A'), '15, 16')
  assert.equal(saved['tg-l35-q15'], 'A')
  assert.equal(saved['tg-l35-q16'], 'A')
  await enter(pin('A'), '17')
  assert.equal(saved['tg-l35-q15'], '')
  assert.equal(saved['tg-l35-q16'], '')
  assert.equal(saved['tg-l35-q17'], 'A')
  await enter(pin('A'), '')
  assert.equal(saved['tg-l35-q17'], '')
  const answers = { 'tg-l35-q15': 'A', 'tg-l35-q16': 'E' }
  await mount(JSON.parse(JSON.stringify(centre)), answers, true, true)
  assert.equal(pin('A').value, '15')
  assert.equal(pin('A').getAttribute('data-review-status'), 'incorrect')
  assert.match(host.querySelector('[data-map-location="C"] .source-map-correct')!.textContent!, /15/)
  assert.equal(pin('E').getAttribute('data-review-status'), 'correct')
  assert.ok([...host.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input,select')].every(control => control.disabled))
  await mount(centre, answers, true, false)
  assert.equal(host.querySelector('.source-map-correct'), null, 'Hidden-answer review never reveals the key')
  assert.equal(pin('A').getAttribute('data-review-status'), null)

  await act(async () => root.unmount())
  host.remove()
  console.log('PASS: 35 source sections; original maps, word entry, location matching, flags, stable focus, persisted review and hidden answers')
}
