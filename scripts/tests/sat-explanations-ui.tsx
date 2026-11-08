import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import assert from 'node:assert/strict'
import DOMPurify from 'dompurify'
import SATExplanation from '../../src/components/sat/SATExplanation'
import { LEGACY_SAT_TEST_CATALOG as SAT_TEST_CATALOG, getSATReviewTests } from '../../src/features/sat/catalog'
import { buildSATExplanation } from '../../src/features/sat/explanations'
import type { SATQuestion } from '../../src/features/sat/practiceTest4'

const rootElement = document.getElementById('root')!
const question = (test: number, id: string) => SAT_TEST_CATALOG[test].modules.flatMap(module => module.questions).find(q => q.id === id)!
const fragments = (html: string, selector: string) => {
  const template = document.createElement('template')
  template.innerHTML = DOMPurify.sanitize(html, { USE_PROFILES: { html: true, mathMl: true } })
  return [...template.content.querySelectorAll(selector)].map(node => node.outerHTML)
}

export async function run() {
  const rows = Object.values(SAT_TEST_CATALOG).flatMap(test => test.modules.flatMap(module => module.questions.map(q => ({ test: test.mockId, q }))))
  assert.equal(rows.length, 3942)
  let sourceCount = 0
  const seen = new Set<string>()
  for (const [index, { test, q }] of rows.entries()) {
    if (index % 50 === 0) await new Promise(resolve => setTimeout(resolve, 0))
    seen.add(q.explanation + q.sourceContent?.explanation)
    const label = `${test}:${q.id}`
    const model = buildSATExplanation(q)
    assert.ok(model.steps.length, `${label}: substantive solution required`)
    const combined = [...model.steps, ...model.alternatives].map(part => part.content).join('\n')
    assert.doesNotMatch(combined, /[\uE000-\uE002\uF000-\uF8FF]|supplied June 2026 answer key|Identify the quantities, evidence|Read the notation in the question/, label)
    assert.doesNotMatch(combined, /\*\*Step \d|Correct Answer Identification|Distractor Analysis/, label)
    if (q.sourceContent?.explanation.trim()) {
      sourceCount++
      // MathML, formula images and tables must survive prose restructuring
      // exactly, including the fractions and superscripts that OCR loses.
      assert.deepEqual(fragments(combined, 'math, img, table'), fragments(q.sourceContent.explanation, 'math, img, table'), label)
    }
  }
  for (const test of getSATReviewTests()) for (const module of test.modules) for (const q of module.questions) {
    const key = q.explanation + q.sourceContent?.explanation
    if (!seen.has(key)) {
      seen.add(key)
      assert.ok(buildSATExplanation(q).steps.length, `${test.id}:${q.id}: historical/section review`)
    }
  }

  const root = createRoot(rootElement)
  async function render(q: SATQuestion, response?: string) {
    await act(async () => root.render(<SATExplanation question={q} response={response} />))
  }
  const reported = question(1, 'math1-12')
  await render({ ...reported, explanation: 'Choice C is correct. y mx b=+ 8yx=- -.' }, 'A')
  assert.ok(rootElement.querySelectorAll('.sat-explanation-steps > li').length >= 4)
  assert.ok(rootElement.querySelector('mfrac'), 'Reported slope is a real fraction')
  assert.match(rootElement.textContent!, /Your answer: A/)
  assert.match(rootElement.textContent!, /slope is.*\+1/)
  assert.doesNotMatch(rootElement.textContent!, /mx b|8yx/)

  await render(question(1, 'math1-21'), '361/8')
  assert.ok(rootElement.querySelector('mroot'))
  assert.ok(rootElement.querySelector('msup'))
  assert.match(rootElement.textContent!, /You answered correctly/)
  await render(question(1, 'math2-6'), '-5')
  assert.match(rootElement.textContent!, /Also accepted: -5/)
  assert.match(rootElement.textContent!, /You answered correctly/)

  const rich = rows.find(row => row.q.section === 'math' && row.q.sourceContent?.explanation.includes('<mfrac>'))!.q
  await render(rich)
  assert.ok(rootElement.querySelector('.sat-explanation-step math mfrac'))
  const reading = rows.find(row => row.q.section === 'reading-writing' && row.q.sourceContent?.explanation.includes('Choice B is incorrect'))!.q
  await render(reading)
  assert.match(rootElement.querySelector('.sat-explanation-steps')!.textContent!, /This works because/)
  assert.ok(rootElement.querySelector('.sat-explanation-alternatives'))
  assert.doesNotMatch(rootElement.querySelector('.sat-explanation-steps')!.textContent!, /Choice B is incorrect/)

  const unknown = { ...reported, prompt: 'Unique security fixture', sourceContent: {
    context: '', task: '', explanation: '<p>Use <math><mfrac><mn>1</mn><mn>2</mn></mfrac></math>. Then multiply.</p><img src="x" onerror="alert(1)"><script>alert(1)</script>',
  } }
  await render(unknown)
  assert.equal(rootElement.querySelector('script, [onerror]'), null)
  assert.ok(rootElement.querySelector('mfrac'))
  await act(async () => root.unmount())
  console.log(`PASS ${rows.length} SAT explanations, ${sourceCount} rich sources retain all notation, historical reviews, saved snapshot repair, screenshot regression, numeric answers and sanitized HTML.`)
}
