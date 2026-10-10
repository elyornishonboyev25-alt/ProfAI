import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import assert from 'node:assert/strict'
import IELTSWritingFullTestInterface from '../../src/components/IELTSWritingFullTestInterface'
import WritingResultModal from '../../src/components/WritingResultModal'
import { getWritingFullTestById } from '../../src/data/writingTestData'
import { getWritingAnalysisHistory, saveWritingAnalysis } from '../../src/utils/writingAnalysisStorage'
import { accountStorageFor } from '../../src/utils/accountStorage'
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
  const suppliedDetails: Record<number, string[]> = {
    6: ['International students at a UK university', '1995', '2000', '2005', '2010', '2015', 'Students', 'Year', 'Asia', 'Africa', 'Europe', 'North America', '140'],
    8: ['Comparison of Energy Production', '1995', '2005', 'Coal', 'Gas', 'Petro', 'Nuclear', 'Other', '29.80%', '29.63%', '29.27%', '6.40%', '4.90%', '30.93%', '30.31%', '19.55%', '10.10%', '9.10%'],
    11: ['Average minutes spent on reading for pleasure', 'Average minutes spent on listening to music', 'Minutes per day', 'Age groups', '15-24', '25-34', '35-44', '45-54', '55+', '90', 'Hanexenglish.edu.vn'],
    12: ['Number of patients to four clinics in one hospital', '2010', '2012', '2014', '2016', 'Birth control', 'Eye', 'Diabetic', 'Dental', '400'],
    13: ['Geothermal power plant', 'Cold', 'Hot', 'water', 'pumped', 'down', 'up', '4.5 km', 'injection', 'production', 'well', 'Condenser', 'Steam', 'Turbine', 'Generator', 'Geothermal zone (hot rocks)', '(powered by', 'electricity)', '1', '2', '3', '4', '5'],
    14: ['IELTS Task 1: Tourist Office', 'in person', 'by letter/email', 'by telephone', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', '2000'],
    21: ['Museum 1957', 'Museum 2007', 'national history', 'exhibition', 'store-', 'education', 'centre', 'car park', 'Road'],
    22: ['2003', '2006', '2013', 'Every', 'Never', '40%'],
    23: ['175.5m', '177.8m', '91.2m', '102.3m', '304.7m', '318.6m', '75%', '69%', '8%', '14%', '17%'],
    24: ['Favourite leisure activities of teenagers in Canada', 'Sports', 'Computer Games', 'Music', 'Shopping', 'Boys', 'Girls'],
    25: ['UNIVERSITY SPORTS CENTRE (present)', 'UNIVERSITY SPORTS CENTRE (future plans)', 'Leisure', '25m', 'Changing room', 'Dance', 'studio', 'Café'],
    26: ['1900', '1950', '1975', '2000', 'Agriculture', 'Manufacturing', 'Business and Financial'],
    27: ['1967', '1977', '1987', '1997', '2007', 'United Kingdom', 'Sweden', 'Italy', 'Portugal'],
    28: ['74% recycled (UK)', 'COLLECTION', 'CLEANING, SORTING,', 'SHREDDING AND', 'COMPRESSING', 'HEATING AND MELTING', '2.5mm - 6mm thick', 'RECYCLING', 'REUSING'],
    29: ['0-9', '10-19', '20-39', '40-59', '60+', '52.5', '51.2', '43.6', '25.1', '18.2', '10.8', '13.7', '9.3', '19.8', '14.6'],
    30: ['52.8', '47.7', '42.2', '48.9', '39.5', '52.5', '43.1', '53.3', '45.1', '53', '46.7', '47.1', '65 and over'],
  }
  for (const index of [6, 8, 11, 12, 13, 14, ...Array.from({ length: 13 }, (_, i) => i + 18)]) {
    window.localStorage.clear()
    const test = getWritingFullTestById(`writing-full-${index}`)!
    // Exercise the same saved-session entry path used when a test is reopened.
    accountStorageFor('guest').setItem(`profai:writing:draft:guest:${test.id}:session`, JSON.stringify({ timerEnabled: false, deadline: null }))
    await render(<IELTSWritingFullTestInterface fullTest={test} onExit={() => {}} />)
    const visual = container.querySelector('svg[data-supplied-writing-diagram]')
    assert.ok(visual, `Test ${index} must show its supplied drawing`)
    assert.equal(visual.querySelector('image, img'), null, 'SVG cannot embed or decode a raster')
    assert.ok(visual.getAttribute('viewBox'))
    for (const detail of suppliedDetails[index] ?? []) assert.ok(visual.textContent?.includes(detail), `Test ${index} source detail: ${detail}`)
    if ([22, 26, 30].includes(index)) assert.ok(visual.querySelector('pattern'), `Test ${index} retains source bar patterns`)
    if (index >= 21) assert.equal(test.tasks[0].imageUrl, undefined, 'Replacement cannot use the old practice image')
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
    for (const detail of suppliedDetails[index] ?? []) assert.ok(document.querySelector('svg[data-supplied-writing-diagram]')?.textContent?.includes(detail), `Saved review ${index} source detail: ${detail}`)
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
