import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import ts from 'typescript'

const source = readFileSync(new URL('../src/components/achievements/badgeMeta.ts', import.meta.url), 'utf8')
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText
const { tierForAchievement, nextAchievementThreshold, formatAchievementScore, isCompleteIeltsObjectiveSection } = await import(
  `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`
)

test('IELTS honors require band 7.0 and have separate full mock tiers', () => {
  assert.equal(isCompleteIeltsObjectiveSection('IELTS_READING', 3, 1), false)
  assert.equal(isCompleteIeltsObjectiveSection('IELTS_READING', 1, 1), false)
  assert.equal(isCompleteIeltsObjectiveSection('IELTS_READING', 3, 3), true)
  assert.equal(isCompleteIeltsObjectiveSection('IELTS_LISTENING', 4, 3), false)
  assert.equal(isCompleteIeltsObjectiveSection('IELTS_LISTENING', 4, 4), true)
  for (const track of ['IELTS_LISTENING', 'IELTS_READING', 'IELTS_WRITING', 'IELTS_SPEAKING', 'IELTS_OVERALL']) {
    assert.equal(tierForAchievement(track, 6.5), null)
    assert.equal(tierForAchievement(track, 7), 7)
    assert.equal(tierForAchievement(track, 8.5), 8)
    assert.equal(tierForAchievement(track, 9), 9)
    assert.equal(tierForAchievement(track, 9.5), null)
  }
  assert.equal(nextAchievementThreshold('IELTS_READING', 7), 8)
  assert.equal(formatAchievementScore('IELTS_OVERALL', 7), '7.0')
})

test('SAT section and full mock honors use their own score scales', () => {
  for (const track of ['SAT_MATH', 'SAT_ENGLISH']) {
    assert.equal(tierForAchievement(track, 699), null)
    assert.equal(tierForAchievement(track, 700), 7)
    assert.equal(tierForAchievement(track, 750), 8)
    assert.equal(tierForAchievement(track, 790), 9)
    assert.equal(tierForAchievement(track, 801), null)
    assert.equal(nextAchievementThreshold(track, 7), 750)
  }
  assert.equal(tierForAchievement('SAT_OVERALL', 1390), null)
  assert.equal(tierForAchievement('SAT_OVERALL', 1400), 7)
  assert.equal(tierForAchievement('SAT_OVERALL', 1550), 8)
  assert.equal(tierForAchievement('SAT_OVERALL', 1600), 9)
  assert.equal(formatAchievementScore('SAT_MATH', 740), '740')
})
