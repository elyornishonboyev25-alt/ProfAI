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
    const preserved = host.querySelector('.ielts-source-paper')!.cloneNode(true) as HTMLElement
    preserved.querySelectorAll('[data-annotation-ignore]').forEach(node => node.remove())
    assert.equal(preserved.textContent, source.content.textContent, `${section.id}: saved highlight/note text offsets stay unchanged`)
    assert.equal(host.querySelectorAll('script,[style]:not(.source-map-canvas,.source-map-answer)').length, 0, 'Source inline styles cannot override the shared theme')
  }

  const library = telegramListeningTests[3].sections[1]
  await mount(library)
  assert.ok(host.querySelector('svg.source-map-image'), 'Supplied maps use native SVG, including saved attempts')
  assert.equal(host.querySelector('.source-map img'), null, 'No raster decoder is needed')
  assert.ok(!host.querySelector('.source-map')!.textContent?.includes('MORE THAN THREE WORDS'), 'The source image instruction is not duplicated in the map')
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
  assert.equal(host.querySelector('.source-map-review-list')!.querySelector('input,select'), null)
  assert.equal(host.querySelector('[data-map-question="tg-l34-q16"]')!.getAttribute('data-review-status'), 'correct')

  const centre = telegramListeningTests[4].sections[1]
  await mount(centre)
  const select = (number: number) => host.querySelector<HTMLSelectElement>(`[data-map-answer-select="tg-l35-q${number}"]`)!
  const choose = (number: number, value: string) => act(async () => {
    select(number).focus(); select(number).value = value
    select(number).dispatchEvent(new window.Event('change', { bubbles: true }))
  })
  assert.ok(host.querySelector('svg.source-map-image'), 'The original drawing is retained')
  assert.equal(host.querySelectorAll('.source-map-answer,[data-map-location-input],[data-map-question-key]').length, 0, 'Community Centre has no in-map marking controls')
  assert.equal(host.querySelectorAll('[data-map-answer-select]').length, 6)
  assert.ok([...host.querySelectorAll<HTMLSelectElement>('[data-map-answer-select]')].every(control => !control.value), 'Empty questions never reveal answers')
  await choose(15, 'A')
  assert.equal(saved['tg-l35-q15'], 'A', 'The chosen letter is stored even when incorrect')
  assert.equal(host.querySelector('select[data-source-question="tg-l35-q15"]'), null, 'No duplicate answer fields under the map')
  assert.equal(focused, 'tg-l35-q15')
  const control = select(15)
  await act(async () => tick())
  assert.equal(select(15), control, 'Timer ticks retain the same select and focus')
  assert.equal(document.activeElement, control)
  await choose(15, 'C')
  assert.equal(saved['tg-l35-q15'], 'C')
  await choose(15, '')
  assert.equal(saved['tg-l35-q15'], '', 'Answers can be cleared')
  const answers = { 'tg-l35-q15': 'A', 'tg-l35-q16': 'E' }
  await mount(JSON.parse(JSON.stringify(centre)), answers, true, true)
  assert.equal(select(15).value, 'A')
  assert.equal(select(15).getAttribute('data-review-status'), 'incorrect')
  assert.match(select(15).closest('.source-map-question-answer')!.textContent!, /Correct: C/)
  assert.equal(select(16).getAttribute('data-review-status'), 'correct')
  assert.ok([...host.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input,select')].every(control => control.disabled))
  assert.equal(host.querySelector('.source-map-answer'), null, 'Saved review also keeps the drawing free of overlays')
  await mount(centre, answers, true, false)
  assert.equal(host.querySelector('.source-map-question-correct'), null, 'Hidden-answer review never reveals the key')
  assert.equal(select(15).getAttribute('data-review-status'), null)

  await act(async () => root.unmount())
  host.remove()
  console.log('PASS: 35 source sections; original maps, word entry, location matching, flags, stable focus, persisted review and hidden answers')
}
