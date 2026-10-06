import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import assert from 'node:assert/strict'
import IELTSWritingFullTestInterface from '../../src/components/IELTSWritingFullTestInterface'
import WritingResultModal from '../../src/components/WritingResultModal'
import { getWritingFullTestById } from '../../src/data/writingTestData'
import { getWritingAnalysisHistory, saveWritingAnalysis } from '../../src/utils/writingAnalysisStorage'
import type { WritingEvaluation } from '../../src/services/geminiAI'

const container = document.getElementById('root')!
let root: ReturnType<typeof createRoot> | undefined
async function render(node: React.ReactNode) {
  if (root) await act(async () => root!.unmount())
  root = createRoot(container)
  await act(async () => root!.render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{node}</MemoryRouter>))
}
async function click(element: Element | null) {
  assert.ok(element)
  await act(async () => (element as HTMLElement).click())
}
const evaluation: WritingEvaluation = {
  overallBand: 7, taskAchievement: 7, coherenceCohesion: 7, lexicalResource: 7, grammaticalRange: 7,
  summary: 'Saved evaluation', strengths: [], improvements: [], errors: [], correctedVersion: '', xpAwarded: 0,
}

export async function run() {
  for (const index of [18, 19, 20]) {
    window.localStorage.clear()
    const test = getWritingFullTestById(`writing-full-${index}`)!
    // Exercise the same saved-session entry path used when a test is reopened.
    window.localStorage.setItem(`profai:writing:draft:guest:${test.id}:session`, JSON.stringify({ timerEnabled: false, deadline: null }))
    await render(<IELTSWritingFullTestInterface fullTest={test} onExit={() => {}} />)
    const visual = container.querySelector('svg[data-supplied-writing-diagram]')
    assert.ok(visual, `Test ${index} must show its supplied drawing`)
    assert.equal(visual.querySelector('image, img'), null, 'SVG cannot embed or decode a raster')
    assert.ok(visual.getAttribute('viewBox'))
    if (index === 19) assert.ok(visual.querySelector('pattern'), '2010 bars retain diagonal hatching')
    if (index === 20) {
      for (const label of ['wire cutter', 'mould', 'or', '24 - 48 hrs', '48 - 72 hrs', '200°C - 980°C', '870°C - 1300°C', 'packaging', 'delivery']) {
        assert.ok(visual.textContent?.includes(label), `Brick source detail: ${label}`)
      }
    }
    await click(container.querySelector('[aria-label="Enlarge Task 1 image"]'))
    assert.ok(container.querySelector('[role="dialog"] svg[data-supplied-writing-diagram]'), 'Enlarge must keep the vector drawing')
    await act(async () => window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' })))
    assert.equal(container.querySelector('[role="dialog"]'), null)
    await click(Array.from(container.querySelectorAll('button')).find(button => button.textContent?.includes('Next: Task 2')) ?? null)
    assert.ok(container.textContent?.includes(test.tasks[1].promptLead!))
    assert.ok(container.textContent?.includes(test.tasks[1].promptQuestion!))
    assert.equal(container.querySelector('svg[data-supplied-writing-diagram]'), null)

    const task = test.tasks[0]
    saveWritingAnalysis(undefined, task.id, task.title, task.taskType, 160, 1200, true, 'My saved response', evaluation, { id: test.id, overallBand: 7 }, task)
    const saved = getWritingAnalysisHistory()[0]
    assert.equal(saved.taskSnapshot?.diagram, task.diagram)
    // A changed catalog ID must not change the saved question or drawing.
    await render(<WritingResultModal entry={{ ...saved, testId: 'writing-full-21-task-1' }} onClose={() => {}} />)
    assert.ok(document.querySelector('svg[data-supplied-writing-diagram]'))
    assert.ok(document.body.textContent?.includes(task.promptLead!))
    assert.ok(document.body.textContent?.includes('My saved response'))
    console.log(`PASS: Full Test ${index}: resumed test, SVG details, enlargement, Task 2 navigation, saved Analyze review`)
  }
  const essay = getWritingFullTestById('writing-full-30')!.tasks[1]
  saveWritingAnalysis(undefined, essay.id, essay.title, 'task2', 260, 2400, true, 'My essay', evaluation, undefined, essay)
  await render(<WritingResultModal entry={getWritingAnalysisHistory()[0]} onClose={() => {}} />)
  assert.ok(document.body.textContent?.includes(essay.promptQuestion!))
  assert.equal(document.querySelector<HTMLAnchorElement>('a[href="' + essay.source!.url + '"]'), null, 'Source references stay out of the review UI')
  console.log('PASS: saved Task 2 review retains the full question without source links')
  // Existing attempts without snapshots remain readable.
  const legacy = { ...getWritingAnalysisHistory()[0], taskSnapshot: undefined, testId: 'writing-full-18-task-1' }
  await render(<WritingResultModal entry={legacy} onClose={() => {}} />)
  assert.ok(document.querySelector('svg[data-supplied-writing-diagram="major-sports"]'))
  await act(async () => root!.unmount())
}
