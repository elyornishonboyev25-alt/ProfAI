import React, { act, useState } from 'react'
import { createRoot } from 'react-dom/client'
import assert from 'node:assert/strict'
import SATTextHighlights, { rangeForHighlight } from '../../src/components/sat/SATTextHighlights'
import type { HighlightStroke } from '../../src/features/sat/practiceTest4'
import { saveSATAttemptToHistory, loadSATAttemptHistory } from '../../src/features/sat/attemptStorage'
import { createSATPracticeTest4Attempt } from '../../src/features/sat/practiceTest4'

export async function run() {
  const rect = { left: 100, top: 100, width: 80, height: 20, right: 180, bottom: 120, x: 100, y: 100, toJSON() {} }
  window.Range.prototype.getBoundingClientRect = () => rect
  window.Range.prototype.getClientRects = () => [rect] as unknown as DOMRectList
  let saved: HighlightStroke[] = []
  function Harness() {
    const [strokes, setStrokes] = useState<HighlightStroke[]>([])
    return <SATTextHighlights strokes={strokes} onChange={next => { saved = next; setStrokes(next) }}>
      <div data-sat-highlight-block="context">repeat <strong>repeat</strong> end</div>
      <div data-sat-highlight-block="task">Second paragraph.</div>
    </SATTextHighlights>
  }
  const container = document.getElementById('root')!
  const root = createRoot(container)
  await act(async () => root.render(<Harness />))
  const select = async (range: Range) => {
    await act(async () => {
      window.getSelection()!.removeAllRanges()
      window.getSelection()!.addRange(range)
      document.dispatchEvent(new window.Event('mouseup', { bubbles: true }))
      await new Promise(resolve => setTimeout(resolve, 25))
    })
  }
  const context = container.querySelector<HTMLElement>('[data-sat-highlight-block="context"]')!
  const repeatedWord = document.createRange()
  repeatedWord.selectNodeContents(context.querySelector('strong')!)
  await select(repeatedWord)
  assert.equal(document.querySelectorAll('[data-sat-highlight-menu] button').length, 4)
  await act(async () => (document.querySelector('[aria-label="Highlight sky"]') as HTMLElement).click())
  assert.equal(saved[0].textRange?.start, 7, 'The second repeated word keeps its exact offset')
  assert.equal(rangeForHighlight(context, saved[0].textRange!)?.toString(), 'repeat')
  assert.equal(window.getSelection()!.rangeCount, 0)
  const restored = JSON.parse(JSON.stringify(saved)) as HighlightStroke[]
  await act(async () => root.render(<SATTextHighlights strokes={restored} enabled={false}><div data-sat-highlight-block="context">repeat <strong>repeat</strong> end</div></SATTextHighlights>))
  assert.equal(container.querySelectorAll('[data-sat-highlight-id]').length, 1, 'Saved highlights render in read-only review')
  await act(async () => root.render(<Harness />))
  const blocks = container.querySelectorAll('[data-sat-highlight-block]')
  const multi = document.createRange()
  multi.setStart(blocks[0].firstChild!, 3)
  multi.setEnd(blocks[1].firstChild!, 6)
  await select(multi)
  await act(async () => (document.querySelector('[aria-label="Highlight amber"]') as HTMLElement).click())
  assert.equal(saved.length, 2, 'Cross-paragraph selection persists each block')
  await act(async () => (container.querySelector('[data-sat-highlight-id]') as HTMLElement).click())
  assert.equal(document.querySelectorAll('[data-sat-highlight-menu] button').length, 1)
  assert.equal(saved.length, 2, 'Clicking a highlight opens a menu without deleting it')
  await act(async () => (document.querySelector('[data-sat-highlight-menu] button') as HTMLElement).click())
  assert.equal(saved.length, 1, 'Only the chosen highlight is removed')
  const attempt = createSATPracticeTest4Attempt('practice')
  attempt.highlights = { question: [...saved, { id: 'old', color: '#fff', width: 28, points: [{ x: 1, y: 1 }] }] }
  saveSATAttemptToHistory(attempt, 'submitted')
  assert.equal(loadSATAttemptHistory()[0].attempt.highlights.question.length, 1, 'History keeps text highlights and omits legacy drawing arrays')
  await act(async () => root.unmount())
  console.log('SAT highlight UI checks passed')
}
