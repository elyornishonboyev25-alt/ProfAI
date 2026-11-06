import assert from 'node:assert/strict'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import SATMockRun from '@/pages/SATMockRun'
import { SAT_TEST_CATALOG, getSATSectionTest } from '@/features/sat/catalog'
import { createSATAttempt, type SATAttempt } from '@/features/sat/practiceTest4'
import { loadSATAttempt, saveSATAttempt } from '@/features/sat/attemptStorage'
import { beginSATModuleTransition, completeSATModuleTransition, needsSATModuleTransition, SAT_MODULE_TRANSITION_MS } from '@/features/sat/moduleTransition'
import { moduleSeconds, pauseModule, resumeModule, totalTime } from '@/features/sat/timing'
import { useAuthStore } from '@/store/authStore'
import i18n from '@/i18n'

export async function run() {
  await i18n.changeLanguage('en')
  localStorage.clear(); window.sessionStorage.clear(); useAuthStore.setState({ user: null })
  const originalNow = Date.now
  let clock = originalNow()
  Date.now = () => clock
  const test = getSATSectionTest(1, null)
  const container = document.getElementById('root')!
  let root = createRoot(container)
  const tick = async (milliseconds: number) => { clock += milliseconds; await act(async () => { await new Promise(resolve => setTimeout(resolve, 300)) }) }
  const render = () => act(async () => root.render(<MemoryRouter initialEntries={[{ pathname: '/sat/mock/1/run', state: { resumeIntent: true } }]}><Routes><Route path="/sat/mock/:mockId/run" element={<SATMockRun />} /></Routes></MemoryRouter>))
  const mount = async (attempt?: SATAttempt) => { await act(async () => root.unmount()); root = createRoot(container); if (attempt) saveSATAttempt(attempt); await render() }
  const saved = () => loadSATAttempt(test.id)!
  const click = async (label: string) => {
    const button = [...container.querySelectorAll('button')].find(node => node.textContent?.trim() === label || node.getAttribute('aria-label') === label)
    assert.ok(button, `Missing ${label}`)
    await act(async () => button.click())
  }
  try {
    for (const paper of Object.values(SAT_TEST_CATALOG)) {
      const attempt = createSATAttempt(paper.id, paper.modules, 'exam')
      assert.deepEqual(paper.modules.flatMap((_, index) => needsSATModuleTransition({ ...attempt, currentModuleIndex: index }, paper.modules) ? [index] : []), [0, 2], paper.id)
    }
    for (const section of ['math', 'reading-writing'] as const) {
      const paper = getSATSectionTest(1, section)
      assert.equal(needsSATModuleTransition(createSATAttempt(paper.id, paper.modules, 'practice'), paper.modules), true)
    }
    const draft = createSATAttempt(test.id, test.modules, 'exam')
    clock += 4000
    draft.currentQuestionIndex = test.modules[0].questions.length - 1
    draft.answers = { [test.modules[0].questions[0].id]: 'B' }
    draft.flagged = [test.modules[0].questions[1].id]
    await mount(draft)
    await click('Review module'); await click('Continue to next module')
    assert.ok(container.querySelector('.sat-module-transition [role="status"]'))
    assert.equal(document.activeElement?.textContent, 'Moving to Module 2')
    assert.equal(container.querySelector('.sat-exam-viewport'), null, 'Questions are inaccessible while switching modules')
    const pending = saved(), deadline = pending.moduleTransition!.endsAt, elapsed = totalTime(pending, test.modules)
    assert.equal(deadline, clock + SAT_MODULE_TRANSITION_MS)
    assert.equal(pending.currentModuleIndex, 0)
    assert.equal(pending.moduleTimerStartedAt, undefined)
    assert.equal(pending.moduleStartedAt[test.modules[1].id], undefined)
    assert.equal(pending.moduleDeadlines[test.modules[1].id], undefined)
    assert.equal(pauseModule(pending, test.modules), pending)
    assert.equal(resumeModule(pending, test.modules), pending)
    assert.equal(beginSATModuleTransition(pending, test.modules), pending, 'Repeated starts keep the original transition deadline')
    assert.equal(completeSATModuleTransition(pending, test.modules, deadline - 1), pending)
    await act(async () => window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'A' })))
    assert.deepEqual(saved().answers, draft.answers, 'Loading ignores answer shortcuts')
    for (const [language, expected] of [['uz', '2-modulga o‘tilmoqda'], ['ru', 'Переход к модулю 2'], ['en', 'Moving to Module 2']]) {
      await act(async () => { await i18n.changeLanguage(language) })
      assert.equal(container.querySelector('h1')?.textContent, expected)
    }
    await tick(500); await mount()
    assert.equal(saved().moduleTransition?.endsAt, deadline, 'Reload does not restart the loading screen')
    assert.ok(container.querySelector('.sat-module-transition'))
    await tick(1000)
    assert.equal(saved().currentModuleIndex, 1)
    assert.equal(saved().currentQuestionIndex, 0)
    assert.equal(saved().moduleTransition, undefined)
    assert.equal(moduleSeconds(saved(), test.modules), test.modules[1].durationSeconds)
    assert.equal(totalTime(saved(), test.modules), elapsed, 'Loading time never counts as exam time')
    assert.deepEqual(saved().answers, draft.answers)
    assert.deepEqual(saved().flagged, draft.flagged)
    assert.ok(saved().adaptiveRoutes?.[test.modules[1].id], 'Adaptive routing is retained')
    await tick(1000)
    assert.equal(moduleSeconds(saved(), test.modules), test.modules[1].durationSeconds - 1)

    // The same screen is automatic at expiry and also works in untimed practice.
    const expired = createSATAttempt(test.id, test.modules, 'exam')
    expired.moduleDeadlines[test.modules[0].id] = clock - 1
    await mount(expired)
    assert.ok(container.querySelector('.sat-module-transition'))
    await tick(SAT_MODULE_TRANSITION_MS)
    assert.equal(saved().currentModuleIndex, 1)
    assert.equal(moduleSeconds(saved(), test.modules), test.modules[1].durationSeconds)

    const practice = createSATAttempt(test.id, test.modules, 'practice')
    practice.currentModuleIndex = 2
    practice.moduleTimerStartedAt = clock
    practice.moduleStartedAt[test.modules[2].id] = clock
    practice.currentQuestionIndex = test.modules[2].questions.length - 1
    await mount(practice)
    await click('Review module'); await click('Continue to next module')
    assert.ok(container.querySelector('.sat-module-transition'))
    const late = saved()
    await act(async () => root.unmount()); root = createRoot(container)
    clock += 20_000
    saveSATAttempt(late); await render()
    assert.equal(saved().currentModuleIndex, 3, 'An expired saved transition completes immediately on reload')
    assert.equal(moduleSeconds(saved(), test.modules), 0, 'Practice starts at zero elapsed time')
    assert.equal(saved().moduleStartedAt[test.modules[3].id], clock)
    console.log('PASS: all 40 mocks, section tests, manual/automatic transitions, exam/practice timing, reload, duplicate starts, keyboard isolation, saved answers, adaptive routing and translations')
  } finally { await act(async () => root.unmount()); Date.now = originalNow }
}
