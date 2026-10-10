import assert from 'node:assert/strict'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import TestInterface from '@/pages/TestInterface'
import IELTSWritingTest from '@/pages/IELTSWritingTest'
import IELTSSpeakingTest from '@/pages/IELTSSpeakingTest'
import MockIELTSRun from '@/pages/MockIELTSRun'
import { getWritingFullTestById } from '@/data/writingTestData'
import { accountStorage } from '@/utils/accountStorage'
import { fullMockLaunchState, getFullMockCatalog, getFullMockPendingSection, getFullMockResults, getFullMockSectionRedirect, saveFullMockSectionResult } from '@/utils/ieltsMockCatalog'
import { useAuthStore } from '@/store/authStore'
import { useBadgeStore } from '@/store/badgeStore'
import i18n from '@/i18n'

export async function run() {
  await i18n.changeLanguage('en')
  const originalFetch = globalThis.fetch
  const originalTimeout = globalThis.setTimeout
  const originalWindowTimeout = window.setTimeout.bind(window)
  const fast = (ms?: number) => [1200, 1900, 2200, 3000].includes(ms ?? 0) ? 0 : ms
  globalThis.setTimeout = ((fn: (...args: unknown[]) => void, ms?: number, ...args: unknown[]) => originalTimeout(fn, fast(ms), ...args)) as typeof setTimeout
  window.setTimeout = ((fn: () => void, ms?: number, ...args: unknown[]) => originalWindowTimeout(fn, fast(ms), ...args)) as typeof window.setTimeout
  let failWriting = false
  globalThis.fetch = async (input) => new Response(JSON.stringify(String(input).includes('/writing/evaluate')
    ? failWriting ? { message: 'Temporary evaluation outage' } : { overallBand: 7, taskAchievement: 7, coherenceCohesion: 7, lexicalResource: 7, grammaticalRange: 7, summary: 'QA evaluation', strengths: [], improvements: [], errors: [], correctedVersion: '', xpAwarded: 0 }
    : { totalXp: 0, level: 1 }), { status: failWriting && String(input).includes('/writing/evaluate') ? 503 : 200, headers: { 'Content-Type': 'application/json' } })
  const element = document.getElementById('root')!
  let root: ReturnType<typeof createRoot> | undefined
  let path = ''
  function Location() { path = useLocation().pathname; return null }
  const flush = () => act(async () => { await new Promise(resolve => originalTimeout(resolve, 35)) })
  const mount = async (pathname: string, state: unknown) => {
    if (root) await act(async () => root!.unmount())
    root = createRoot(element)
    await act(async () => root!.render(<MemoryRouter initialEntries={[{ pathname, state }]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Location /><Routes>
        <Route path="/test/:type/:id" element={<TestInterface />} />
        <Route path="/ielts/writing/test/:id" element={<IELTSWritingTest />} />
        <Route path="/ielts/speaking/test/:id" element={<IELTSSpeakingTest />} />
        <Route path="/mock/ielts/:mockId" element={<MockIELTSRun />} />
      </Routes>
    </MemoryRouter>))
    await flush()
  }
  const click = async (label: string) => {
    const button = [...element.querySelectorAll<HTMLButtonElement>('button')].find(node => node.textContent?.trim() === label)
    assert.ok(button, `Missing button: ${label} on ${path}`)
    await act(async () => button.click())
    await flush()
  }
  const submitObjective = async () => { await click('Submit'); await click('Submit test'); await click('Check score') }
  const type = async (value: string) => {
    const input = element.querySelector('textarea')!
    assert.ok(input)
    await act(async () => {
      Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')!.set!.call(input, value)
      input.dispatchEvent(new window.Event('input', { bubbles: true }))
    })
  }
  try {
    localStorage.clear()
    useAuthStore.getState().setSession({ user: { id: 'mock-flow-qa', fullName: 'QA', email: 'qa@example.test', role: 'USER', premium: true, xp: 0, level: 1, currentStreak: 0, onboardingCompleted: true }, accessToken: 'local-qa', refreshToken: 'local-qa' })
    const catalog = getFullMockCatalog()
    assert.equal(catalog.length, 30)
    for (const mock of catalog) {
      assert.equal(mock.fullyReady, true, mock.id)
      assert.deepEqual(mock.sections.map(section => section.key), ['listening', 'reading', 'writing', 'speaking'])
      useBadgeStore.setState({ records: [] })
      const writing = getWritingFullTestById(`writing-full-${mock.index}`)!
      const practiceKey = `profai:writing:draft:mock-flow-qa:${writing.id}`
      accountStorage.setItem(practiceKey, JSON.stringify({ [writing.tasks[0].id]: 'Old practice response' }))
      accountStorage.setItem(`${practiceKey}:session`, JSON.stringify({ timerEnabled: true, deadline: Date.now() - 60_000 }))
      await mount(mock.sections[0].launchPath!, fullMockLaunchState(mock.id, 'listening'))
      await click('Play')
      assert.equal(element.querySelector('.ielts-exam-timer'), null)
      await submitObjective()
      assert.equal(path, mock.sections[1].launchPath, `${mock.id}: Listening → Reading`)
      assert.equal(getFullMockResults(mock.id).listening?.band, 0, 'Unanswered Listening has band 0')
      assert.ok(element.querySelector('.ielts-exam-timer')?.textContent?.includes('60:00'), 'Reading starts with its own full time')
      await submitObjective()
      assert.equal(path, mock.sections[2].launchPath, `${mock.id}: Reading → Writing, never Speaking`)
      assert.equal(getFullMockResults(mock.id).reading?.band, 0, 'Unanswered Reading has band 0')
      assert.ok(element.querySelector('textarea'), 'Writing opens automatically')
      assert.equal(element.querySelector('textarea')!.value, '', 'Old practice does not leak into the full mock')
      assert.equal(getFullMockResults(mock.id).writing, undefined, 'Expired practice cannot submit mock Writing')
      assert.equal(getFullMockSectionRedirect(mock.id, 'speaking', mock.sections[3].launchPath!), mock.sections[2].launchPath, 'Speaking is blocked until Writing finishes')
      await type('Task one response for this mock exam.')
      await click('Next: Task 2')
      await type('Task two response for this mock exam.')
      if (mock.index === 1) failWriting = true
      await click('Submit Full Test')
      await click('Submit full test')
      if (failWriting) {
        assert.equal(path, mock.sections[2].launchPath, 'AI failure must keep the candidate in Writing')
        assert.equal(getFullMockResults(mock.id).writing, undefined)
        assert.ok(accountStorage.getItem(`${practiceKey}:mock:${mock.id}`)?.includes('Task one response'))
        failWriting = false
        await click('Retry')
      }
      assert.equal(path, mock.sections[3].launchPath, `${mock.id}: Writing → Speaking`)
      assert.equal(getFullMockResults(mock.id).writing?.review?.length, 2)
      assert.equal(getFullMockResults(mock.id).writing?.band, 7)
      assert.equal(useBadgeStore.getState().records.length, 0, 'No skill band badge before all four sections finish')
      assert.ok(accountStorage.getItem(practiceKey)?.includes('Old practice response'), 'Practice draft remains independent')
      console.log(`PASS: ${mock.id}: Listening → Reading → Writing → Speaking; isolated Writing; blank band 0; hidden badges`)
    }
    // An older Speaking result must not mask a missing Writing section.
    saveFullMockSectionResult('full-mock-30', 'speaking', { band: 7, testId: 'speaking-full-30', completedAt: new Date().toISOString() })
    await mount('/mock/ielts/full-mock-30', {})
    assert.ok(element.querySelector('.mock-run-band')?.textContent?.startsWith('3.5'))
    assert.equal(useBadgeStore.getState().recordsForUser('mock-flow-qa').some(record => record.track === 'IELTS_WRITING'), true, 'Skill badges appear after the whole mock finishes')
    const older = getFullMockResults('full-mock-30')
    delete older.writing
    accountStorage.setItem('smarttest:full-mock-results:v1', JSON.stringify({ 'full-mock-30': older }))
    assert.equal(getFullMockPendingSection('full-mock-30')?.key, 'writing')
    await mount('/ielts/speaking/test/speaking-full-30', fullMockLaunchState('full-mock-30', 'speaking'))
    assert.equal(path, '/ielts/writing/test/writing-full-30', 'Stale Speaking history redirects to unfinished Writing')
    console.log('PASS: all 30 real mock routes; AI failure/retry; delayed awards; stale Speaking history repairs Writing gap')
  } finally {
    if (root) await act(async () => root!.unmount())
    globalThis.fetch = originalFetch
    globalThis.setTimeout = originalTimeout
    window.setTimeout = originalWindowTimeout
    useAuthStore.getState().clearSession()
    localStorage.clear()
  }
}
