import assert from 'node:assert/strict'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import SATMockRun from '@/pages/SATMockRun'
import SATReview from '@/components/sat/SATReview'
import MockSAT from '@/pages/MockSAT'
import SATModuleReview from '@/components/sat/SATModuleReview'
import { SAT_TEST_CATALOG } from '@/features/sat/catalog'
import { createSATAttempt } from '@/features/sat/practiceTest4'
import { loadSATAttempt, saveSATAttempt } from '@/features/sat/attemptStorage'
import { useAuthStore } from '@/store/authStore'
import i18n from '@/i18n'

export async function run() {
  localStorage.clear(); window.sessionStorage.clear(); await i18n.changeLanguage('en')
  useAuthStore.setState({ user: null })
  const test = SAT_TEST_CATALOG[1], first = test.modules[0]
  const attempt = createSATAttempt(test.id, test.modules, 'practice')
  attempt.currentQuestionIndex = first.questions.length - 1
  attempt.answers = { [first.questions[0].id]: 'A', [first.questions[1].id]: 'B' }
  attempt.flagged = [first.questions[1].id, first.questions[2].id]
  saveSATAttempt(attempt)
  const container = document.getElementById('root')!, root = createRoot(container)
  const click = async (label: string) => {
    const button = [...container.querySelectorAll<HTMLButtonElement>('button')].find(node => node.textContent?.trim() === label || node.getAttribute('aria-label') === label)
    assert.ok(button, `Missing button: ${label}`)
    await act(async () => { button.click(); await new Promise(resolve => setTimeout(resolve, 20)) })
  }
  const mountRunner = () => act(async () => root.render(<MemoryRouter initialEntries={[{ pathname:'/sat/mock/1/run', state:{ resumeIntent:true } }]}><Routes><Route path="/sat/mock/:mockId/run" element={<SATMockRun />} /></Routes></MemoryRouter>))
  try {
    await mountRunner(); await click('Review module')
    assert.ok(container.querySelector('.sat-module-review'))
    assert.deepEqual([...container.querySelectorAll('.sat-module-review__stats strong')].map(node => node.textContent), ['2', '2', '25'])
    assert.equal(container.querySelectorAll('.sat-module-review__grid > button').length, 27)
    await act(async () => window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'D' })))
    assert.equal(loadSATAttempt(test.id)?.answers[first.questions[26].id], undefined, 'Review keyboard cannot change the hidden question')
    await click('2Marked for Review')
    assert.equal(container.querySelectorAll('.sat-module-review__grid > button').length, 2)
    await click('Question 3, Unanswered, Marked for Review')
    assert.equal(loadSATAttempt(test.id)?.currentQuestionIndex, 2)
    assert.deepEqual(loadSATAttempt(test.id)?.answers, attempt.answers)
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 400)) })
    await click('Open question navigator'); await click('Finish module')
    await click('Continue to next module')
    assert.ok(container.querySelector('.sat-module-transition'))
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 1800)) })
    assert.equal(loadSATAttempt(test.id)?.currentModuleIndex, 1)
    assert.equal(loadSATAttempt(test.id)?.currentQuestionIndex, 0)
    await act(async () => root.render(<MemoryRouter key="results"><SATReview test={test} attempt={{...attempt,status:'submitted',submittedAt:Date.now()}} /></MemoryRouter>))
    assert.ok(container.querySelector('.srx-score-stage'))
    assert.equal(container.querySelector('.sr-summary-strip'), null)
    assert.equal(container.querySelector('.sr-insight-grid'), null)
    assert.equal(container.querySelector('.sr-next-steps'), null)
    assert.equal(container.querySelector('.sr-footer'), null)
    assert.equal(container.querySelector('.srx-disclosure'), null)
    assert.equal(container.querySelectorAll('[role="tab"]').length, 6)
    assert.equal(container.querySelector('#sat-result-tab-scores')?.getAttribute('aria-selected'), 'true')
    await click('Performance')
    assert.ok(container.querySelector('#sat-result-panel-performance'))
    assert.equal(container.querySelector('.srx-score-stage'), null, 'Tabs display one result section at a time')
    await click('Performance')
    assert.ok(container.querySelector('#sat-result-panel-performance'), 'Clicking the selected tab keeps it open')
    await click('Scores')
    assert.ok(container.querySelector('.srx-score-stage'))
    await act(async () => container.querySelector('#sat-result-tab-scores')!.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })))
    assert.equal(document.activeElement?.id, 'sat-result-tab-performance')
    assert.equal(container.querySelectorAll('[role="tabpanel"]').length, 1)
    await act(async () => document.activeElement!.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'End', bubbles: true })))
    assert.equal(document.activeElement?.id, 'sat-result-tab-discussion')
    assert.ok(container.querySelector('#sat-result-panel-discussion'))
    await act(async () => document.activeElement!.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Home', bubbles: true })))
    assert.equal(document.activeElement?.id, 'sat-result-tab-scores')
    assert.ok(container.querySelector('.srx-score-stage'))
    await click('Leaderboard')
    assert.ok(container.querySelector('#sat-result-panel-leaderboard'))
    await click('Question Review')
    assert.ok(container.querySelector('#sat-result-panel-questions'))
    assert.equal(container.querySelector('#sat-result-panel-leaderboard'), null)
    function Location() { const location = useLocation(); return <output data-location>{location.pathname}{location.search}</output> }
    await act(async () => root.render(<MemoryRouter key="entry" initialEntries={['/mock/sat/1?section=math']}><Location /><Routes><Route path="/mock/sat/:mockId" element={<MockSAT />} /></Routes></MemoryRouter>))
    await click('Discussion')
    assert.equal(container.querySelector('[data-location]')?.textContent, '/mock/sat/1?section=math&view=discussion')
    assert.ok(container.querySelector('[aria-label="Test discussion"]'))
    assert.equal(container.querySelector('.sat-start-page'), null)
    await click('Back to test')
    assert.equal(container.querySelector('[data-location]')?.textContent, '/mock/sat/1?section=math')
    assert.ok(container.querySelector('.sat-start-page'))
    await act(async () => root.render(<SATModuleReview module={first} attempt={attempt} time="31:00" final={false} continueLabel="Continue to next module" onQuestion={() => {}} onBack={() => {}} onContinue={() => {}} />))
    for (const [language, backLabel, filterLabel] of [
      ['uz', 'Savollarga qaytish', 'Savollar holati bo‘yicha filtrlar'],
      ['ru', 'Вернуться к вопросам', 'Фильтры статуса вопросов'],
    ]) {
      await act(async () => { await i18n.changeLanguage(language) })
      assert.equal(container.querySelector('.sat-module-review__top button')?.textContent, backLabel)
      assert.equal(container.querySelector('[role="group"]')?.getAttribute('aria-label'), filterLabel)
    }
    console.log('PASS: module counts, filters, timing, restored result tabs, single active panel, keyboard navigation, removed extras, discussion navigation and translations')
  } finally { await act(async () => root.unmount()) }
}
