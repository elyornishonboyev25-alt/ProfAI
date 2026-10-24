import { saveBankSession, loadBankSession, reviewQuestions } from '@/features/sat/bankPractice'
import TestRunner from '@/pages/TestRunner'
import type { TestDetails } from '@/types/platform'
import { createSATAttempt } from '@/features/sat/practiceTest4'
import { loadSATAttempt, saveSATAttempt } from '@/features/sat/attemptStorage'
import { getSATSectionTest } from '@/features/sat/catalog'
import { moduleSeconds } from '@/features/sat/timing'
import assert from 'node:assert/strict'
import { StrictMode, act, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { hasActiveTest, useActiveTest } from '@/hooks/useActiveTest'
import { useReadingAnnotations } from '@/hooks/useReadingAnnotations'
import { accountStorageFor } from '@/utils/accountStorage'
import { saveActiveTestPaper, readActiveTestPaper } from '@/utils/activeTestPaper'
import { recoverFromStaleBuild } from '@/utils/staleBuildRecovery'
import { fullReadingTest } from '@/data/fullReadingTest'
import { getWritingFullTestById } from '@/data/writingTestData'
import TestInterface from '@/pages/TestInterface'
import IELTSWritingFullTestInterface from '@/components/IELTSWritingFullTestInterface'
import i18n from '@/i18n'

export async function run() {
  await i18n.changeLanguage('en')
  localStorage.clear()
  const container = document.getElementById('root')!
  const storage = accountStorageFor('guest')
  let root = createRoot(container)
  const mount = async (content: React.ReactNode) => {
    await act(async () => root.render(<StrictMode><MemoryRouter>{content}</MemoryRouter></StrictMode>))
  }
  const unmount = async () => {
    await act(async () => root.unmount())
    root = createRoot(container)
  }
  try {
    const sessionKey = `ielts_test_session_${fullReadingTest.id}`
    const deadline = Date.now() + 900_000
    storage.setItem(sessionKey, JSON.stringify({ isTestActive: true, testMode: 'practice', selectedParts: [0], partsSelectionVersion: 2, timeRemaining: 900, deadline, answers: { [fullReadingTest.sections[0].questions[0].id]: 'saved answer' }, flaggedQuestions: [1], currentSectionIndex: 0, lastActiveQuestionIndex: 0, contrastMode: 'sepia', textSizeMode: 'large', readingFont: 'serif' }))
    const marker = 'Saved passage from the previous deployment'
    const oldPaper = { ...fullReadingTest, sections: fullReadingTest.sections.map((section, index) => index ? section : { ...section, paragraphs: [{ label: 'A', content: marker }] }) }
    saveActiveTestPaper(sessionKey, oldPaper, 'guest')
    await act(async () => root.render(<StrictMode><MemoryRouter initialEntries={[`/test/reading/${fullReadingTest.id}`]}><Routes><Route path="/test/:type/:id" element={<TestInterface />} /></Routes></MemoryRouter></StrictMode>))
    assert.ok(container.textContent?.includes(marker), 'Reload uses the saved version of the paper')
    assert.equal(container.querySelector<HTMLInputElement>('input:not([type="range"])')?.value, 'saved answer')
    assert.equal(JSON.parse(storage.getItem(sessionKey)!).testMode, 'practice')
    assert.equal(JSON.parse(storage.getItem(sessionKey)!).deadline, deadline)
    assert.deepEqual(JSON.parse(storage.getItem(sessionKey)!).flaggedQuestions, [1])
    assert.ok(container.querySelector('.reading-contrast-sepia'))
    assert.ok(hasActiveTest())
    assert.equal(await recoverFromStaleBuild(new Error('Failed to fetch dynamically imported module')), false)
    assert.equal(window.sessionStorage.getItem('profai:stale-build-recovery'), null, 'Deployment errors cannot start reload recovery during a test')
    await unmount()
    assert.equal(hasActiveTest(), false, 'Unmount releases the deployment guard in StrictMode')
    storage.setItem('ielts_test_route_reading_random', sessionKey)
    await act(async () => root.render(<StrictMode><MemoryRouter initialEntries={['/test/reading/random']}><Routes><Route path="/test/:type/:id" element={<TestInterface />} /></Routes></MemoryRouter></StrictMode>))
    assert.ok(container.textContent?.includes(marker), 'Random tests reload their original paper instead of generating another')
    await unmount()
    assert.equal(readActiveTestPaper(sessionKey, 'another-user'), null, 'Saved papers are account scoped')
    storage.removeItem(sessionKey)
    assert.equal(readActiveTestPaper(sessionKey, 'guest'), null, 'An inactive paper cannot replace a new attempt')
    console.log('PASS: Reading reload retains practice, answers, flags, original deadline, appearance, and old paper; active deploy recovery is blocked')

    function Annotated({ section }: { section: string }) {
      const shell = useRef<HTMLDivElement>(null)
      useActiveTest(true)
      useReadingAnnotations(shell, `annotations:${section}`, 'guest', true)
      return <div ref={shell}><div key={section} data-reading-markable="1">Alpha beta gamma</div></div>
    }
    await mount(<Annotated section="one" />)
    await act(async () => {
      const pane = container.querySelector('[data-reading-markable]')!
      const text = pane.firstChild as Text
      const selected = text.splitText(6)
      selected.splitText(4)
      const mark = document.createElement('span')
      mark.dataset.readingMark = '1'
      mark.dataset.markType = 'note'
      mark.dataset.markGroup = 'saved-note'
      mark.dataset.note = '<script>stored as plain text</script>'
      pane.insertBefore(mark, selected)
      mark.appendChild(selected)
    })
    await mount(<Annotated section="two" />)
    assert.equal(container.querySelector('[data-reading-mark]'), null, 'Notes stay within their own section')
    await mount(<Annotated section="one" />)
    assert.equal(container.querySelector<HTMLElement>('[data-reading-mark]')?.dataset.note, '<script>stored as plain text</script>')
    assert.equal(container.querySelector('[data-reading-mark]')?.textContent, 'beta')
    assert.equal(container.querySelector('script'), null, 'Saved notes do not execute HTML')
    await unmount()
    await mount(<Annotated section="one" />)
    assert.equal(container.querySelectorAll('[data-reading-mark]').length, 1, 'StrictMode/reload never duplicates marks')
    await unmount()
    console.log('PASS: Notes survive section navigation and remount, stay isolated, and restore safely as text')

    const writing = getWritingFullTestById('writing-full-1')!
    assert.ok(writing)
    const draftKey = `profai:writing:draft:guest:${writing.id}`
    storage.setItem(draftKey, JSON.stringify({ [writing.tasks[0].id]: 'First task draft', [writing.tasks[1].id]: 'Second task draft' }))
    storage.setItem(`${draftKey}:session`, JSON.stringify({ timerEnabled: false, deadline: null, activeTaskIndex: 1, bookmarks: { [writing.tasks[1].id]: true } }))
    await mount(<IELTSWritingFullTestInterface fullTest={writing} onExit={() => {}} />)
    assert.equal(container.querySelector('textarea')?.value, 'Second task draft', 'Writing resumes its active task')
    assert.equal(JSON.parse(storage.getItem(`${draftKey}:session`)!).timerEnabled, false, 'Untimed practice stays untimed')
    assert.equal(JSON.parse(storage.getItem(`${draftKey}:session`)!).bookmarks[writing.tasks[1].id], true)
    assert.ok(readActiveTestPaper(`${draftKey}:session`, 'guest'))
    await unmount()
    storage.setItem(`${draftKey}:session`, JSON.stringify({ timerEnabled: true, deadline, activeTaskIndex: 1, bookmarks: {} }))
    await mount(<IELTSWritingFullTestInterface fullTest={writing} onExit={() => {}} />)
    assert.equal(JSON.parse(storage.getItem(`${draftKey}:session`)!).deadline, deadline, 'Exam resume never extends the deadline')
    assert.equal(container.querySelector('textarea')?.value, 'Second task draft')
    console.log('PASS: Writing resumes the active task, both drafts, bookmarks, practice/exam mode, and original deadline')
    await unmount()
    const test: TestDetails = { id: 'saved-server-test', slug: 'saved', title: 'Paper saved before a deployment', description: '', category: 'IELTS', difficulty: 'EASY', durationSec: 1800, premium: false, xpReward: null, subjects: [], questions: [{ id: 'q1', text: 'Saved question from the server', order: 1, weight: 1, options: [{ id: 'a1', text: 'Selected option', order: 1 }] }] }
    const genericKey = `profai:test-runner:${test.id}:`
    storage.setItem(genericKey, JSON.stringify({ test, answers: { q1: 'a1' }, deadline }))
    await act(async () => root.render(<StrictMode><MemoryRouter initialEntries={[`/tests/${test.id}`]}><Routes><Route path="/tests/:id" element={<TestRunner />} /></Routes></MemoryRouter></StrictMode>))
    assert.ok(container.textContent?.includes(test.title), 'Server tests can reload their saved paper without refetching')
    assert.equal(JSON.parse(storage.getItem(genericKey)!).answers.q1, 'a1')
    assert.equal(JSON.parse(storage.getItem(genericKey)!).deadline, deadline)
    await unmount()
    console.log('PASS: Server test reload restores its paper, selected answer and deadline without a network request')

    const sat = getSATSectionTest('1', null)
    for (const mode of ['practice', 'exam'] as const) {
      const attempt = createSATAttempt(sat.id, sat.modules, mode)
      const question = sat.modules[0].questions[0]
      attempt.answers[question.id] = 'B'
      attempt.flagged = [question.id]
      attempt.notes[question.id] = 'Preserved note'
      attempt.currentQuestionIndex = 2
      attempt.eliminatedChoices = { [question.id]: ['A'] }
      saveSATAttempt(attempt)
      saveActiveTestPaper(`profai:sat:${sat.id}:attempt:v1`, sat)
      const resumed = loadSATAttempt(sat.id)!
      assert.equal(resumed.mode, mode)
      assert.equal(resumed.answers[question.id], 'B')
      assert.deepEqual(resumed.flagged, [question.id])
      assert.equal(resumed.notes[question.id], 'Preserved note')
      assert.equal(resumed.currentQuestionIndex, 2)
      assert.deepEqual(resumed.eliminatedChoices, attempt.eliminatedChoices)
      assert.equal(moduleSeconds(resumed, sat.modules, attempt.startedAt + 5000), moduleSeconds(attempt, sat.modules, attempt.startedAt + 5000))
      assert.equal(readActiveTestPaper<typeof sat>(`profai:sat:${sat.id}:attempt:v1`)?.modules[0].questions[0].prompt, question.prompt)
    }
    console.log('PASS: SAT practice/exam preserves answers, flags, notes, eliminated options, current question, timing and original paper')
    const row = reviewQuestions.values().next().value!
    saveBankSession('guest', { id: 'persistent-bank-set', keys: [row.key], index: 0, answers: { [row.key]: 'C' }, flagged: [row.key], highlights: {}, createdAt: new Date().toISOString() })
    reviewQuestions.delete(row.key)
    try {
      const resumed = loadBankSession('guest')!
      assert.ok(resumed, 'A bank update cannot discard an active set whose question was removed')
      assert.equal(resumed.questions?.[row.key].question.prompt, row.question.prompt)
      assert.equal(resumed.answers[row.key], 'C')
    } finally { reviewQuestions.set(row.key, row) }
    console.log('PASS: SAT bank sets retain the original questions across catalog updates/removals')


  } finally {
    await act(async () => root.unmount())
  }
}
