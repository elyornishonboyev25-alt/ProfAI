import React, { act, useState } from 'react'
import { createRoot } from 'react-dom/client'
import assert from 'node:assert/strict'
import i18n from '../../src/i18n'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import SATMockRun from '../../src/pages/SATMockRun'
import { getSATSectionTest } from '../../src/features/sat/catalog'
import { createSATAttempt } from '../../src/features/sat/practiceTest4'
import { loadSATAttempt, saveSATAttempt } from '../../src/features/sat/attemptStorage'
import { useAuthStore } from '../../src/store/authStore'
import { accountStorage } from '../../src/utils/accountStorage'
import SATQuestionCanvas from '../../src/components/sat/SATQuestionCanvas'
import SATSubmissionScreen, { useSATSubmission } from '../../src/components/sat/SATSubmissionScreen'
import { allQuestions } from '../../src/features/sat/bankPractice'
import type { HighlightStroke } from '../../src/features/sat/practiceTest4'

export async function run() {
  await i18n.changeLanguage('en')
  const element = document.getElementById('root')!
  const root = createRoot(element)
  // jsdom has no text geometry; the real-browser suite checks highlight painting.
  const originalRects = window.Range.prototype.getClientRects
  const originalBounds = window.Range.prototype.getBoundingClientRect
  window.Range.prototype.getClientRects = () => [] as unknown as DOMRectList
  window.Range.prototype.getBoundingClientRect = () => ({ x: 0, y: 0, left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0, toJSON: () => ({}) })
  const reading = allQuestions.find(row => row.question.section === 'reading-writing' && row.question.kind === 'multiple-choice')!.question
  const numeric = allQuestions.find(row => row.question.section === 'math' && row.question.kind !== 'multiple-choice')!.question
  let saved: HighlightStroke[] = []
  function Question({ math = false }: { math?: boolean }) {
    const [strokes, setStrokes] = useState<HighlightStroke[]>([
      { id: 'first', color: 'rgba(251,191,36,.45)', width: 0, points: [], textRange: { block: 'task', start: 0, end: 5, text: 'Which' } },
      { id: 'second', color: 'rgba(56,189,248,.4)', width: 0, points: [], textRange: { block: 'task', start: 6, end: 12, text: 'choice' } },
    ])
    const [answer, setAnswer] = useState('')
    return <SATQuestionCanvas question={math ? numeric : reading} answer={answer} onAnswer={setAnswer}
      strokes={strokes} onChange={next => { saved = next; setStrokes(next) }} flagged={false} onToggleFlag={() => {}} />
  }
  try {
    await act(async () => root.render(<Question />))
    const summary = element.querySelector<HTMLElement>('summary[aria-label="Highlights"]')!
    assert.ok(summary, 'The highlight control is discoverable without making a selection')
    await act(async () => summary.click())
    assert.ok(element.querySelector('details')?.open)
    await act(async () => element.querySelector<HTMLButtonElement>('[aria-label="Remove highlight: Which"]')!.click())
    assert.deepEqual(saved.map(stroke => stroke.id), ['second'], 'Removing one saved highlight preserves the other')
    const undo = [...element.querySelectorAll('button')].find(button => button.textContent === 'Undo')!
    await act(async () => undo.click())
    assert.deepEqual(saved, [])
    await act(async () => document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' })))
    assert.equal(element.querySelector('details')?.open, false)
    assert.equal(document.activeElement, summary, 'Escape returns focus to the highlight control')
    await act(async () => root.render(<Question key="numeric" math />))
    assert.ok(element.querySelector('[aria-label="Student-produced response directions"] table'))
    assert.ok(element.querySelector('[data-sat-highlight-block="task"]')?.textContent?.trim(), 'Numeric directions do not replace the question')
    const input = element.querySelector<HTMLInputElement>('#student-response')!
    assert.ok(input.labels?.length)
    assert.equal(input.getAttribute('aria-describedby'), 'sat-response-help')
    assert.ok(element.querySelector('summary[aria-label="Highlights"]'), 'Math supports the same highlight controls')

    let calls = 0
    let fail = false
    function Submission() {
      const submission = useSATSubmission()
      const [done, setDone] = useState(false)
      return <><button onClick={() => submission.run(() => { calls++; if (fail) throw Error('storage full'); setDone(true) })}>Submit fixture</button>
        {submission.pending && <SATSubmissionScreen />}{submission.error && <p role="alert">Retry available</p>}{done && <p>Saved results</p>}</>
    }
    await act(async () => root.render(<Submission key="success" />))
    const submit = element.querySelector('button')!
    act(() => { submit.click(); submit.click() })
    assert.ok(document.querySelector('.sat-submission-screen[aria-busy="true"]'), 'Saving immediately announces a status')
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)) })
    assert.equal(calls, 1, 'Repeated submission does not save twice')
    assert.ok(element.textContent?.includes('Saved results'))
    assert.equal(document.querySelector('.sat-submission-screen'), null, 'The real completion reveals results without an artificial delay')
    fail = true
    await act(async () => root.render(<Submission key="failure" />))
    await act(async () => { element.querySelector('button')!.click(); await new Promise(resolve => setTimeout(resolve, 20)) })
    assert.ok(element.querySelector('[role="alert"]'), 'A failed save can be retried')
    assert.equal(document.querySelector('.sat-submission-screen'), null)
    fail = false
    await act(async () => { element.querySelector('button')!.click(); await new Promise(resolve => setTimeout(resolve, 20)) })
    assert.ok(element.textContent?.includes('Saved results'))

    // Exercise the real mock's final submission, including a storage failure.
    useAuthStore.setState({ user: null })
    const paper = getSATSectionTest('1', null)
    const attempt = createSATAttempt(paper.id, paper.modules, 'practice')
    attempt.currentModuleIndex = paper.modules.length - 1
    const last = paper.modules[attempt.currentModuleIndex]
    attempt.currentQuestionIndex = last.questions.length - 1
    const question = last.questions[attempt.currentQuestionIndex]
    attempt.answers[question.id] = question.correctAnswer
    saveSATAttempt(attempt)
    await act(async () => root.render(<MemoryRouter initialEntries={[{ pathname: '/sat/mock/1/run', state: { resumeIntent: true } }]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes><Route path="/sat/mock/:mockId/run" element={<SATMockRun />} /></Routes>
    </MemoryRouter>))
    const action = (text: string) => [...element.querySelectorAll('button')].find(button => button.textContent?.trim() === text)!
    assert.ok(action('Review module'))
    await act(async () => action('Review module').click())
    const setItem = accountStorage.setItem
    try {
      accountStorage.setItem = function(key, value) {
        if (key.includes(paper.id) && key.endsWith(':attempt:v1')) throw Error('quota exceeded')
        return setItem(key, value)
      }
      await act(async () => { action('Submit & score').click(); await new Promise(resolve => setTimeout(resolve, 30)) })
      assert.ok(element.querySelector('[role="alert"]')?.textContent?.includes('Your answers are still here'))
      assert.equal(loadSATAttempt(paper.id)?.status, 'active', 'A failed final save keeps the attempt resumable')
      assert.deepEqual(loadSATAttempt(paper.id)?.answers, attempt.answers)
    } finally { accountStorage.setItem = setItem }
    await act(async () => { action('Try again').click(); await new Promise(resolve => setTimeout(resolve, 50)) })
    assert.equal(loadSATAttempt(paper.id)?.status, 'submitted')
    assert.deepEqual(loadSATAttempt(paper.id)?.answers, attempt.answers, 'Real scoring preserves the submitted answers')
    assert.equal(document.querySelector('.sat-submission-screen'), null)
    console.log('PASS SAT paper: visible highlight management, independent removal, keyboard focus, numeric directions, submission status, duplicate protection and save recovery')
  } finally {
    await act(async () => root.unmount())
    window.Range.prototype.getClientRects = originalRects
    window.Range.prototype.getBoundingClientRect = originalBounds
  }
}
