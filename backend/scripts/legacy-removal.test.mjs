import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { Difficulty, TestCategory } from '@prisma/client'
import { MAX_XP_BY_DIFFICULTY } from '../dist/services/gamification.service.js'
import { DIFFICULTY_MULTIPLIERS } from '../dist/services/leaderboard.service.js'

const readRepoFile = (relativePath) =>
  readFile(new URL(`../../${relativePath}`, import.meta.url), 'utf8')

test('Prisma exposes only IELTS and SAT test categories', () => {
  assert.deepEqual(Object.values(TestCategory).sort(), ['IELTS', 'SAT'])
  assert.deepEqual(Object.values(Difficulty).sort(), ['EASY', 'HARD', 'MEDIUM'])
})

test('XP and leaderboard rules have exactly the active difficulty tiers', () => {
  assert.deepEqual(Object.keys(MAX_XP_BY_DIFFICULTY).sort(), ['EASY', 'HARD', 'MEDIUM'])
  assert.deepEqual(Object.keys(DIFFICULTY_MULTIPLIERS).sort(), ['EASY', 'HARD', 'MEDIUM'])
})

test('seed, frontend types and mock data contain no retired modules', async () => {
  const files = await Promise.all([
    readRepoFile('backend/prisma/seed.ts'),
    readRepoFile('src/types/platform.ts'),
    readRepoFile('src/types/index.ts'),
    readRepoFile('src/services/mockData.ts'),
    readRepoFile('src/utils/constants.ts'),
  ])
  const activeSource = files.join('\n')

  assert.doesNotMatch(activeSource, /\b(?:SCHOOL|OLYMPIAD|Olympiad|olympiad)\b/)
  assert.match(activeSource, /TestCategory\.SAT/)
  assert.match(activeSource, /TestCategory\.IELTS/)
})

test('destructive migration deletes legacy data before rebuilding enums', async () => {
  const migration = await readRepoFile(
    'backend/prisma/migrations/20260827160000_remove_school_olympiad/migration.sql',
  )
  const answerDelete = migration.indexOf('DELETE FROM "AttemptAnswer"')
  const testDelete = migration.indexOf('DELETE FROM "Test"')
  const categoryRebuild = migration.indexOf('CREATE TYPE "TestCategory_new"')

  assert.ok(answerDelete >= 0)
  assert.ok(testDelete > answerDelete)
  assert.ok(categoryRebuild > testDelete)
  assert.match(migration, /CREATE TYPE "TestCategory_new" AS ENUM \('SAT', 'IELTS'\)/)
  assert.match(migration, /CREATE TYPE "Difficulty_new" AS ENUM \('EASY', 'MEDIUM', 'HARD'\)/)
})

test('IELTS General Training remains supported', async () => {
  const ieltsTypes = await readRepoFile('src/types/ieltsTypes.ts')
  assert.match(ieltsTypes, /'Academic' \| 'General Training'/)
})
