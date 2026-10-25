import assert from 'node:assert/strict'
import { act, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import i18n from '@/i18n'
import TestInterface from '@/pages/TestInterface'
import IELTSWritingTest from '@/pages/IELTSWritingTest'
import IELTSSpeakingTest from '@/pages/IELTSSpeakingTest'
import IELTSSectionTests from '@/pages/IELTSSectionTests'
import FullMockSectionGate from '@/components/ielts/FullMockSectionGate'
import IeltsTestExitGuard from '@/components/ielts/IeltsTestExitGuard'
import FullMockAttemptHistory from '@/components/ielts/FullMockAttemptHistory'
import WritingTaskImage from '@/components/writing/WritingTaskImage'
import { useActiveTest } from '@/hooks/useActiveTest'
import { accountStorageFor } from '@/utils/accountStorage'
import { getIeltsAttemptResumes } from '@/utils/ieltsAttemptResume'
import { saveActiveTestPaper } from '@/utils/activeTestPaper'
import { saveIeltsObjectiveAttempt } from '@/utils/saveIeltsObjectiveAttempt'
import { getReadingAnalysisHistory } from '@/utils/readingAnalysisStorage'
import { resolveIeltsTestById } from '@/utils/ieltsTestCatalog'
import { getIeltsReadingUnifiedCatalog } from '@/utils/ieltsTrackCatalog'
import { getFullMockAttempts, getFullMockById, saveFullMockSectionResult, retakeFullMock } from '@/utils/ieltsMockCatalog'
import { getWritingFullTestById } from '@/data/writingTestData'
import { getIeltsSpeakingDayCatalog, getIeltsSpeakingFullMockCatalog } from '@/utils/ieltsSpeakingCatalog'
import { fullReadingTest } from '@/data/fullReadingTest'
import { listeningFullTest15 } from '@/data/listeningFullTest15'
import { readTestAudio, saveTestAudio } from '@/utils/testAudioStorage'

export async function run() {
  await i18n.changeLanguage('en')
  localStorage.clear()
  const element = document.getElementById('root')!
  const storage = accountStorageFor('guest')
  let root = createRoot(element)
  const remount = async (node: React.ReactNode) => {
    await act(async () => root.unmount())
    root = createRoot(element)
    await act(async () => root.render(<StrictMode>{node}</StrictMode>))
  }
  const click = async (label: string, within: ParentNode = document) => {
    const button = Array.from(within.querySelectorAll<HTMLButtonElement>('button')).find(item => item.textContent?.trim() === label)
    assert.ok(button, `Button available: ${label}`)
    await act(async () => button.click())
  }
  const mountRoute = async (path: string) => remount(<MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/test/:type/:id" element={<TestInterface />} />
    <Route path="/ielts/writing/test/:id" element={<IELTSWritingTest />} />
    <Route path="/ielts/speaking/test/:id" element={<IELTSSpeakingTest />} />
    <Route path="*" element={<p data-exited>Catalog</p>} />
  </Routes></MemoryRouter>)
  const confirmCycle = async (back: string) => {
    await act(async () => (element.querySelector(back) as HTMLButtonElement).click())
    let dialog = document.querySelector('[role="alertdialog"]')!
    assert.ok(dialog, 'Every running IELTS test asks before exiting')
    assert.ok(element.querySelector('.ielts-writing-workspace, .reading-shell, .ielts-speaking-workspace'), 'The test stays mounted during confirmation')
    await click('Continue test', dialog)
    assert.equal(document.querySelector('[role="alertdialog"]'), null)
    await act(async () => (element.querySelector(back) as HTMLButtonElement).click())
    dialog = document.querySelector('[role="alertdialog"]')!
    await click('Save & exit', dialog)
    assert.ok(element.querySelector('[data-exited]'))
  }
  try {
    for (const [skill, test] of [['reading', fullReadingTest], ['listening', listeningFullTest15]] as const) {
      const key = `ielts_test_session_${test.id}`
      const deadline = Date.now() + 900_000
      storage.setItem(key, JSON.stringify({ isTestActive: true, testMode: 'practice', partsSelectionVersion: 2, selectedParts: [0], timeRemaining: 900, deadline, answers: { [test.sections[0].questions[0].id]: 'Preserved response' } }))
      saveActiveTestPaper(key, test, 'guest')
      await mountRoute(`/test/${skill}/${test.id}`)
      assert.ok(getIeltsAttemptResumes('guest').some(item => item.sessionKey === key), 'An active test is discoverable from IELTS')
      const unload = new Event('beforeunload', { cancelable: true })
      window.dispatchEvent(unload)
      assert.equal(unload.defaultPrevented, true, 'Refresh/tab close requests native confirmation')
      await confirmCycle('.premium-back-btn-sm')
      assert.ok(storage.getItem(key), 'Confirming exit preserves the session instead of clearing answers')
      await mountRoute(`/test/${skill}/${test.id}`)
      assert.equal(JSON.parse(storage.getItem(key)!).answers[test.sections[0].questions[0].id], 'Preserved response')
      if (skill === 'reading') assert.equal(JSON.parse(storage.getItem(key)!).deadline, deadline)
    }
    console.log('PASS: Reading/Listening exit confirmation, cancel, saved answers, resume discovery, original deadline and native refresh protection')

    const writing = getWritingFullTestById('writing-full-1')!
    for (const id of [writing.id, writing.tasks[0].id]) {
      const key = `profai:writing:draft:guest:${id}:session`
      const full = id === writing.id
      storage.setItem(key, JSON.stringify({ timerEnabled: false, deadline: null, activeTaskIndex: 0,
        ...(full ? { answers: { [writing.tasks[0].id]: 'Newest atomic answer' } } : { answer: 'Newest atomic answer' }),
      }))
      storage.setItem(key.replace(':session', ''), full ? JSON.stringify({ [writing.tasks[0].id]: 'Stale legacy draft' }) : 'Stale legacy draft')
      await mountRoute(`/ielts/writing/test/${id}`)
      assert.equal(element.querySelector('textarea')?.value, 'Newest atomic answer', 'The atomic session takes priority over a stale split draft')
      await confirmCycle('.ielts-writing-header button')
      await mountRoute(`/ielts/writing/test/${id}`)
      assert.equal(element.querySelector('textarea')?.value, 'Newest atomic answer')
    }
    const day = getIeltsSpeakingDayCatalog()[0]
    await mountRoute(`/ielts/speaking/test/${day.id}`)
    await confirmCycle('[aria-label="Back to roadmap"]')
    assert.ok(storage.getItem(`profai:speaking:day:${day.id}`))
    console.log('PASS: single/full Writing atomic drafts and Speaking daily sessions survive confirmed exits, including tests with no answers')

    const retired = { ...writing, id: 'retired-writing-paper' }
    const retiredKey = `profai:writing:draft:guest:${retired.id}:session`
    storage.setItem(retiredKey, JSON.stringify({ timerEnabled: false, answers: { [writing.tasks[0].id]: 'Answer from before deployment' } }))
    saveActiveTestPaper(retiredKey, retired, 'guest')
    await mountRoute(`/ielts/writing/test/${retired.id}`)
    assert.equal(element.querySelector('textarea')?.value, 'Answer from before deployment', 'Saved Writing papers survive removal from the live catalog')
    const speaking = getIeltsSpeakingFullMockCatalog()[0]
    storage.setItem(`profai:speaking:launch:${speaking.id}`, 'simulation')
    storage.setItem(`profai:speaking:examiner:test:${speaking.id}`, JSON.stringify({ phase: 'awaiting_answer', examiner: { name: 'Alex', voice: 'cedar', gender: 'male' } }))
    await mountRoute(`/ielts/speaking/test/${speaking.id}`)
    assert.ok(element.textContent?.includes('Resume speaking test'), 'Speaking restores the selected mode and finds its stable session key')
    console.log('PASS: Writing survives catalog removal; Speaking reload restores the selected mode and saved examiner session')

    // The shared guard also catches navigation from controls outside the runner.
    function Active() {
      useActiveTest(true)
      const navigate = useNavigate()
      return <button onClick={() => navigate('/catalog')}>Leave</button>
    }
    await remount(<MemoryRouter initialEntries={['/active']}><IeltsTestExitGuard><Routes>
      <Route path="/active" element={<Active />} /><Route path="*" element={<p data-exited>Catalog</p>} />
    </Routes></IeltsTestExitGuard></MemoryRouter>)
    await click('Leave')
    assert.ok(document.querySelector('[role="alertdialog"]'))
    await act(async () => document.querySelector('[role="alertdialog"]')!.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })))
    assert.equal(document.querySelector('[role="alertdialog"]'), null)
    await click('Leave')
    await click('Save & exit', document.querySelector('[role="alertdialog"]')!)
    assert.ok(element.querySelector('[data-exited]'))

    const mock = getFullMockById('full-mock-1')!
    let context: unknown
    function RestoredMock() { context = useLocation().state; return <div data-restored>Resumed mock</div> }
    storage.setItem(`profai:full-mock:intro:v1:${mock.id}:listening`, 'started')
    await remount(<MemoryRouter initialEntries={[`${mock.sections[0].launchPath}?mock=${mock.id}`]}><Routes>
      <Route path="/test/:type/:id" element={<FullMockSectionGate><RestoredMock /></FullMockSectionGate>} />
    </Routes></MemoryRouter>)
    assert.ok(element.querySelector('[data-restored]'), 'A mock URL survives missing history state')
    // Runners resolve the URL themselves; the gate need not mutate private history state.
    assert.equal(context, null)
    console.log('PASS: external navigation and Escape use the same confirmation; full mocks restore from URLs without history state')

    const paper = { ...fullReadingTest, sections: [{ ...fullReadingTest.sections[0], paragraphs: [{ label: 'A', content: 'Original paper retained after deployment' }], questions: [fullReadingTest.sections[0].questions[0]] }] }
    for (let index = 0; index < 35; index++) saveIeltsObjectiveAttempt(paper, {
      testId: paper.id, date: new Date(1_790_000_000_000 + index * 1000).toISOString(), score: 0,
      correctAnswers: 0, totalQuestions: 1, timeSpent: 1200, answers: {}, isPartial: false,
    })
    const history = getReadingAnalysisHistory()
    assert.equal(history.length, 35, 'Completed attempts do not silently disappear after 30 submissions')
    assert.equal(resolveIeltsTestById(paper.id, history[0].resultPayload)?.sections[0].paragraphs?.[0].content, 'Original paper retained after deployment')
    await remount(<MemoryRouter><IELTSSectionTests sectionOverride="reading" embedded /></MemoryRouter>)
    const row = getIeltsReadingUnifiedCatalog().find(item => item.testId === paper.id)!
    const card = Array.from(element.querySelectorAll('.ielts-catalog-card')).find(item => item.querySelector('h3')?.textContent === row.title)!
    assert.ok(card?.textContent?.includes('Completed'), 'A zero-correct completed test still counts as completed')
    assert.ok(card?.textContent?.includes('Retake'))
    console.log('PASS: all 35 attempts remain reviewable with original papers; zero-score cards show Completed and Retake')

    for (const section of mock.sections) saveFullMockSectionResult(mock.id, section.key, { band: 7, testId: section.key, completedAt: '2026-10-24T10:00:00Z' })
    assert.equal(retakeFullMock(mock.id), true)
    assert.equal(getFullMockAttempts('guest').filter(item => item.mockId === mock.id).length, 1)
    await remount(<MemoryRouter><FullMockAttemptHistory /></MemoryRouter>)
    await act(async () => element.querySelector<HTMLButtonElement>('button')!.click())
    assert.ok(document.querySelector('[role="dialog"]')?.textContent?.includes('Your overall result.'))
    await click('Close review')
    assert.equal(document.querySelector('[role="dialog"]'), null)
    assert.equal(getFullMockAttempts('different-account').length, 0)
    console.log('PASS: retaken full mocks retain four-section review in Mistake Lab and stay account scoped')

    const imageTask = { ...writing.tasks[0], imageUrl: '/images/test-source.png', fullTestIndex: null }
    await remount(<WritingTaskImage task={imageTask} />)
    await act(async () => element.querySelector('img')!.dispatchEvent(new Event('error')))
    assert.ok(element.querySelector('[role="alert"]'))
    await click('Retry image')
    assert.match(element.querySelector('img')!.src, /retry=1/)
    await act(async () => element.querySelector('img')!.dispatchEvent(new Event('load')))
    assert.equal(element.querySelector('[role="alert"]'), null)
    console.log('PASS: failed Writing images offer retry and recover without touching drafts')

    const originalIndexedDB = globalThis.indexedDB
    const blobs = new Map<string, Blob>()
    let opens = 0
    Object.defineProperty(globalThis, 'indexedDB', { configurable: true, value: {
      open: () => {
        const number = ++opens
        const request: any = {}
        setTimeout(() => {
          request.result = { close() {}, transaction: () => {
            const tx: any = { objectStore: () => ({ put: (blob: Blob, key: string) => {
              blobs.set(key, blob); setTimeout(() => tx.oncomplete?.(), 0)
            } }) }
            return tx
          } }
          request.onsuccess?.()
        }, number === 1 ? 25 : 0)
        return request
      },
    } })
    try {
      const first = saveTestAudio('audio-qa', 'answer', new Blob(['first']))
      await Promise.resolve()
      const finalBlob = new Blob(['first and final chunk'])
      const last = saveTestAudio('audio-qa', 'answer', finalBlob)
      assert.equal((await readTestAudio('audio-qa', 'answer'))?.size, finalBlob.size)
      await Promise.all([first, last])
      assert.equal(blobs.get('answer')?.size, finalBlob.size, 'A slow old IndexedDB open cannot overwrite final audio')
    } finally { Object.defineProperty(globalThis, 'indexedDB', { configurable: true, value: originalIndexedDB }) }
    console.log('PASS: concurrent audio checkpoints retain the final recording despite delayed storage')
  } finally { await act(async () => root.unmount()); localStorage.clear() }
}
