import React, { act } from 'react'
import assert from 'node:assert/strict'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import SATMockRun from '../../src/pages/SATMockRun'
import { SAT_TEST_CATALOG, getSATSectionTest } from '../../src/features/sat/catalog'
import { createSATAttempt, type SATAttempt } from '../../src/features/sat/practiceTest4'
import { loadSATAttempt, loadSATAttemptHistory, saveSATAttempt } from '../../src/features/sat/attemptStorage'
import { advanceSATModule, needsSATSectionBreak, SAT_SECTION_BREAK_SECONDS } from '../../src/features/sat/sectionBreak'
import { moduleSeconds, pauseModule, resumeModule, totalTime } from '../../src/features/sat/timing'
import { useAuthStore } from '../../src/store/authStore'
import i18n from '../../src/i18n'

export async function run() {
  localStorage.clear()
  useAuthStore.setState({ user: null })
  await i18n.changeLanguage('en')
  const container = document.getElementById('root')!
  const test = getSATSectionTest('1', null)
  const originalNow = Date.now
  let clock = originalNow()
  Date.now = () => clock
  let root = createRoot(container)
  const tick = async (milliseconds: number) => {
    clock += milliseconds
    await act(async () => new Promise(resolve => setTimeout(resolve, 300)))
  }
  const saved = () => loadSATAttempt(test.id)!
  const render = async () => act(async () => root.render(
    <MemoryRouter initialEntries={['/sat/mock/1/run']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/sat/mock/:mockId/run" element={<SATMockRun />} />
        <Route path="/sat" element={<p>SAT Arena</p>} />
      </Routes>
    </MemoryRouter>,
  ))
  const remount = async (attempt?: SATAttempt) => {
    await act(async () => root.unmount())
    root = createRoot(container)
    if (attempt) saveSATAttempt(attempt)
    await render()
  }
  const click = async (text: string) => {
    const button = [...container.querySelectorAll('button')].find(node => node.textContent?.trim() === text)
    assert.ok(button, `Missing button: ${text}`)
    await act(async () => button.click())
  }
  const reviewModule = async () => {
    const navigator = [...container.querySelectorAll('button')].find(node => /^Question \d+ of \d+$/.test(node.textContent!.trim()))!
    assert.ok(navigator, 'Question navigator is available')
    await act(async () => navigator.click())
    const count = /of (\d+)/.exec(navigator.textContent!)![1]
    await click(count)
    await act(async () => new Promise(resolve => setTimeout(resolve, 300)))
    await click('Review module')
  }
  const secondEnglish = (mode: 'exam' | 'practice' = 'exam') => {
    const attempt = createSATAttempt(test.id, test.modules, mode)
    clock += 5000
    return advanceSATModule(attempt, test.modules, clock)
  }
  try {
    // All catalog mocks have exactly one English-to-Math boundary; section-only
    // exams and practice never enter this break.
    for (const candidate of Object.values(SAT_TEST_CATALOG)) {
      const attempt = createSATAttempt(candidate.id, candidate.modules, 'exam')
      const transitions = candidate.modules.flatMap((_, index) => needsSATSectionBreak({ ...attempt, currentModuleIndex: index }, candidate.modules) ? [index] : [])
      assert.equal(transitions.length, 1, `One section break in mock ${candidate.id}`)
      assert.equal(needsSATSectionBreak({ ...attempt, currentModuleIndex: transitions[0], mode: 'practice' }, candidate.modules), false)
    }
    for (const section of ['math', 'reading-writing'] as const) {
      const sectionTest = getSATSectionTest('1', section)
      const attempt = createSATAttempt(sectionTest.id, sectionTest.modules, 'exam')
      for (let index = 0; index < sectionTest.modules.length; index++) {
        assert.equal(needsSATSectionBreak({ ...attempt, currentModuleIndex: index }, sectionTest.modules), false)
      }
    }

    const attempt = secondEnglish()
    attempt.answers[test.modules[1].questions[0].id] = 'B'
    saveSATAttempt(attempt)
    await render()
    await tick(60_000)
    await reviewModule()
    await click('Start 10-minute break')
    assert.ok(container.querySelector('#sat-break-title'))
    assert.equal(document.activeElement?.id, 'sat-break-title', 'Break heading receives focus')
    assert.equal(container.querySelector('[role="timer"]')?.textContent, '10:00')
    assert.equal(container.querySelector('iframe'), null, 'Music has no network request or autoplay before opt-in')
    assert.equal(container.querySelector('.sat-exam-viewport'), null, 'Questions are inaccessible during the break')
    const endsAt = saved().sectionBreak!.endsAt
    assert.equal(endsAt, clock + SAT_SECTION_BREAK_SECONDS * 1000)
    assert.equal(saved().moduleTimerStartedAt, undefined)
    assert.equal(saved().moduleStartedAt[test.modules[2].id], undefined, 'Math has not started')
    assert.equal(saved().moduleDeadlines[test.modules[2].id], undefined, 'Math timer is not consumed by the break')
    const elapsed = totalTime(saved(), test.modules)
    const answers = saved().answers
    await act(async () => window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'A', bubbles: true })))
    assert.deepEqual(saved().answers, answers, 'Exam keyboard shortcuts are inactive during the break')

    await click('Play relaxing music')
    assert.match(container.querySelector('iframe')!.src, /youtube-nocookie\.com\/embed\/77ZozI0rw7w/)
    assert.equal(container.querySelector('[aria-pressed="true"]')?.textContent, 'Turn music off')
    const select = container.querySelector('select')!
    await act(async () => { select.value = '1'; select.dispatchEvent(new Event('change', { bubbles: true })) })
    assert.match(container.querySelector('iframe')!.src, /QQ-WACJqc4Y/)
    // Failed external playback cannot advance, pause or reset the exam break.
    await act(async () => container.querySelector('iframe')!.dispatchEvent(new Event('error')))
    assert.equal(saved().sectionBreak!.endsAt, endsAt)
    await click('Turn music off')
    assert.equal(container.querySelector('iframe'), null, 'Off immediately removes the audio source')
    await click('Play relaxing music')

    await tick(120_000)
    assert.equal(container.querySelector('[role="timer"]')?.textContent, '08:00')
    assert.equal(totalTime(saved(), test.modules), elapsed, 'Rest is excluded from active exam time')
    await act(async () => {
      window.dispatchEvent(new Event('beforeunload'))
      window.dispatchEvent(new Event('pagehide'))
    })
    assert.equal(saved().sectionBreak!.endsAt, endsAt)
    assert.equal(saved().pausedModuleSeconds, undefined, 'Page exit does not pause the break')
    assert.equal(pauseModule(saved(), test.modules).sectionBreak!.endsAt, endsAt)
    assert.equal(resumeModule(saved(), test.modules).moduleTimerStartedAt, undefined)
    await remount()
    assert.equal(saved().sectionBreak!.endsAt, endsAt, 'Reload preserves the original break deadline')
    assert.equal(container.querySelector('[role="timer"]')?.textContent, '08:00')
    assert.equal(container.querySelector('iframe'), null, 'Reload requires a fresh music opt-in')
    await act(async () => i18n.changeLanguage('uz'))
    assert.equal(container.querySelector('h1')?.textContent, 'Tanaffus vaqti')
    await act(async () => i18n.changeLanguage('ru'))
    assert.equal(container.querySelector('h1')?.textContent, 'Время для перерыва')
    await act(async () => i18n.changeLanguage('en'))
    await click('Save and exit')
    assert.match(container.textContent!, /SAT Arena/)
    assert.equal(saved().sectionBreak!.endsAt, endsAt)
    assert.equal(loadSATAttemptHistory().find(entry => entry.id === attempt.attemptId)!.attempt.sectionBreak!.endsAt, endsAt)
    await remount()
    await tick(endsAt - clock - 1000)
    assert.equal(container.querySelector('[role="timer"]')?.textContent, '00:01')
    assert.equal(saved().currentModuleIndex, 1)
    await click('Play relaxing music')
    await tick(1000)
    assert.equal(saved().sectionBreak, undefined)
    assert.equal(saved().currentModuleIndex, 2, 'Break automatically starts Math Module 1')
    assert.equal(saved().currentQuestionIndex, 0)
    assert.equal(saved().moduleStartedAt[test.modules[2].id], endsAt)
    assert.equal(moduleSeconds(saved(), test.modules), test.modules[2].durationSeconds)
    assert.equal(totalTime(saved(), test.modules), elapsed)
    assert.equal(container.querySelector('iframe'), null, 'Music stops when Math begins')
    assert.deepEqual(saved().answers, answers)
    await reviewModule()
    await click('Continue to next module')
    assert.equal(saved().currentModuleIndex, 3, 'There is no break between Math modules')
    assert.equal(saved().sectionBreak, undefined)

    // Practice retains its original untimed transition.
    await remount(secondEnglish('practice'))
    await reviewModule()
    await click('Continue to next module')
    assert.equal(saved().currentModuleIndex, 2)
    assert.equal(saved().sectionBreak, undefined)

    // Expiration must also enter the break, including while a review dialog is open.
    await remount(secondEnglish())
    await reviewModule()
    await tick(test.modules[1].durationSeconds * 1000)
    assert.ok(container.querySelector('#sat-break-title'))
    assert.equal(saved().currentModuleIndex, 1)
    assert.equal(saved().sectionBreak!.endsAt, clock + 600_000)
    const breakAttempt = saved()
    const activeTime = totalTime(breakAttempt, test.modules)
    // An overdue reload uses the saved boundary rather than restarting ten minutes
    // or granting extra Math time after sleeping in the background.
    clock = breakAttempt.sectionBreak!.endsAt + 30_000
    await remount()
    assert.equal(saved().currentModuleIndex, 2)
    assert.equal(moduleSeconds(saved(), test.modules), test.modules[2].durationSeconds - 30)
    assert.equal(totalTime(saved(), test.modules), activeTime + 30)
    assert.equal(container.querySelector('#sat-break-title'), null)
    assert.doesNotMatch(container.textContent!, /Module ready/)
    console.log('SAT section break: manual/expired English completion, 10-minute deadline, reload/save/history, inactive shortcuts, optional YouTube tracks/off/cleanup, translations, Math timing and practice/section exclusions passed.')
  } finally {
    await act(async () => root.unmount())
    Date.now = originalNow
  }
}
