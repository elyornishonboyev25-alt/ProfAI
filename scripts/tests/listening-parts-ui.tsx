import React, { act, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import assert from 'node:assert/strict'
import IELTSReadingInterface from '../../src/components/IELTSReadingInterface'
import { listeningFullTest10 } from '../../src/data/listeningFullTest10'
import { evaluateReadingAnswers } from '../../src/utils/ieltsUtils'

const container = document.getElementById('root')!
const sessionKey = 'ielts_test_session_ielts-listening-10'
const legacy = { testMode: 'practice', selectedParts: [0, 1, 2], customTime: 60, answers: { 'lt10-q1': 'month' } }

export async function run() {
  for (const scenario of [
    { name: 'fresh', session: null, count: 4 },
    { name: 'legacy three-part default', session: legacy, count: 4 },
    { name: 'explicit new three-part choice', session: { ...legacy, partsSelectionVersion: 2 }, count: 3 },
    { name: 'legacy single-part choice', session: { ...legacy, selectedParts: [3] }, count: 1 },
  ]) {
    localStorage.clear()
    if (scenario.session) localStorage.setItem(sessionKey, JSON.stringify(scenario.session))
    const root = createRoot(container)
    await act(async () => root.render(<StrictMode><IELTSReadingInterface test={listeningFullTest10} onComplete={() => {}} onExit={() => {}} /></StrictMode>))
    const practice = [...container.querySelectorAll('h3')].find((element) => element.textContent === 'Practice Mode')
    assert.ok(practice)
    await act(async () => practice.click())
    assert.ok(container.textContent!.includes(`${scenario.count} Selected`), scenario.name)
    if (scenario.name === 'legacy three-part default') {
      const migrated = JSON.parse(localStorage.getItem(sessionKey)!)
      assert.deepEqual(migrated.selectedParts, [0, 1, 2, 3])
      assert.equal(migrated.answers['lt10-q1'], 'month')
      const start = [...container.querySelectorAll('button')].find((element) => element.textContent?.includes('Start Training Session'))
      assert.ok(start)
      await act(async () => start.click())
      await act(async () => { await new Promise((resolve) => setTimeout(resolve, 2400)) })
      assert.match(container.textContent!, /0\/40 answered/)
      const part4 = [...container.querySelectorAll('span')].find((element) => element.textContent === 'Part 4')
      assert.ok(part4, 'Part 4 navigation is present')
      await act(async () => part4.click())
      assert.match(container.textContent!, /After Action Review Process/)
      for (let number = 31; number <= 40; number++) {
        assert.ok(container.querySelector(`input[placeholder="${number}"]`), `Question ${number} renders`)
      }
      const saved = JSON.parse(localStorage.getItem(sessionKey)!)
      assert.equal(saved.partsSelectionVersion, 2)
      assert.deepEqual(saved.selectedParts, [0, 1, 2, 3])
    }
    await act(async () => root.unmount())
    console.log(`PASS: ${scenario.name}`)
  }
  for (const preset of [
    { mode: 'practice' as const },
    { mode: 'simulation' as const },
    { mode: 'practice' as const, partIndex: 4 },
  ]) {
    localStorage.setItem(sessionKey, JSON.stringify({ ...legacy, partsSelectionVersion: 2 }))
    const root = createRoot(container)
    await act(async () => root.render(<StrictMode><IELTSReadingInterface test={listeningFullTest10} launchPreset={preset} onComplete={() => {}} onExit={() => {}} /></StrictMode>))
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 2400)) })
    assert.match(container.textContent!, preset.partIndex ? /0\/10 answered/ : /0\/40 answered/)
    assert.ok([...container.querySelectorAll('span')].some((element) => element.textContent === 'Part 4'))
    await act(async () => root.unmount())
  }
  console.log('PASS: full-test launch ignores stale subsets; explicit Part 4 practice stays selectable')
  const answers = Object.fromEntries(listeningFullTest10.sections.flatMap((section) => section.questions.map((q) => [q.id, String(q.correctAnswer).split(' / ')[0]])))
  const result = evaluateReadingAnswers(listeningFullTest10.sections, answers)
  assert.equal(result.summary.totalQuestions, 40)
  assert.equal(result.summary.correctAnswers, 40)
  console.log('PASS: all four sections contribute to 40/40 analysis')
}
