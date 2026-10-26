import assert from 'node:assert/strict'
import papers from '../../src/data/telegramIeltsSpeaking.json'
import { buildStages } from '../../src/components/speaking/ExaminerSession'
import { getFullMockCatalog } from '../../src/utils/ieltsMockCatalog'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import IELTS from '../../src/pages/IELTS'

export async function run() {
  const mocks = getFullMockCatalog()
  assert.equal(mocks.length, 35)
  assert.ok(mocks.every(mock => mock.fullyReady && mock.readyCount === 4))
  for (const paper of papers) {
    const seed = {
      sourceQuestionsOnly: true,
      part1: paper.parts.part1.questions.map(question => question.q),
      part2: paper.parts.part2,
      part3: paper.parts.part3.questions.map(question => question.q),
    }
    const stages = buildStages({ mode: 'full_mock', mockSeed: seed })
    assert.deepEqual(stages.map(stage => stage.part), [1, 2, 3])
    assert.deepEqual(stages[0].moves, seed.part1.map(text => ({ type: 'seed', text })))
    assert.equal(stages[1].moves.length, 1, 'No invented or blank Part 2 follow-up')
    assert.equal(stages[1].moves[0].type, 'cuecard')
    assert.deepEqual(stages[2].moves, seed.part3.map(text => ({ type: 'seed', text })))
    assert.ok(stages.every(stage => stage.moves.every(move => move.type !== 'followup')))
    assert.deepEqual(JSON.parse(JSON.stringify(stages)), stages, 'Saved sessions retain the exact original stages')
    const mock = mocks[paper.index - 1]
    assert.equal(mock.sections[3].launchPath, `/ielts/speaking/test/${paper.id}`)
    const legacy = buildStages({ mode: 'full_mock', mockSeed: { ...seed, sourceQuestionsOnly: false } })
    assert.ok(legacy[0].moves.some(move => move.type === 'followup'), 'Existing examiner behaviour remains available')
  }
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  await act(async () => root.render(<MemoryRouter><IELTS /></MemoryRouter>))
  const cards = [...host.querySelectorAll('.ielts-skill-card')]
  assert.equal(cards.length, 4)
  assert.ok(cards.every(card => card.querySelector('.ielts-skill-mobile small')?.textContent?.startsWith('35 full tests')), 'IELTS overview shows the live count for every skill')
  await act(async () => root.unmount())
  host.remove()
  console.log('PASS: all 35 Full Mocks resolve four sections; original Speaking runs and saved stages contain no generated extra questions')
}
