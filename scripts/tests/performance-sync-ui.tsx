import { getResultsHistory } from '../../src/utils/resultsHistory'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { useProfileIdentitySync } from '../../src/hooks/useProfileIdentitySync'
import assert from 'node:assert/strict'
import { useAuthStore } from '../../src/store/authStore'
import { useSpeakingStore, type SpeakingSessionRecord } from '../../src/store/speakingStore'
import { accountStorageFor } from '../../src/utils/accountStorage'
import { syncSavedPerformance } from '../../src/utils/savedPerformanceSync'

export async function run() {
  useAuthStore.setState({ user: { id: 'owner', fullName: 'Owner', email: 'owner@example.test', role: 'USER', xp: 781, level: 4, currentStreak: 1 }, accessToken: 'test' })
  const storage = accountStorageFor('owner')
  const entry = { savedAt: '2026-10-08T00:00:00.000Z', testId: 'essay', testTitle: 'Essay', taskType: 'task1', overallBand: 7, timeSpent: 1200, wordCount: 200 }
  storage.setItem('smarttest-writing-analysis-v1:owner', JSON.stringify([
    { ...entry, attemptKey: 'full-task1', fullTest: { id: 'full-1', overallBand: 7.5 } },
    { ...entry, taskType: 'task2', attemptKey: 'full-task2', fullTest: { id: 'full-1', overallBand: 7.5 } },
    { ...entry, attemptKey: 'single-writing' },
  ]))
  accountStorageFor('other').setItem('smarttest-writing-analysis-v1:other', JSON.stringify([{ ...entry, attemptKey: 'private-writing' }]))
  const session = (id: string, userId: string, kind: SpeakingSessionRecord['kind']): SpeakingSessionRecord => ({
    id, userId, kind, modeLabel: id, overallBand: 8, durationSec: 840, date: entry.savedAt,
    fluencyBand: 8, lexicalBand: 8, grammarBand: 8, pronunciationBand: 8, wordCount: 100, fillerCount: 0, summary: '',
  })
  useSpeakingStore.setState({ sessions: [
    session('my-mock', 'owner', 'examiner'),
    session('other-mock', 'other', 'examiner'),
    session('live', 'owner', 'live'),
  ] })
  const writes: Array<Record<string, unknown>> = []
  let failSingle = true
  globalThis.fetch = async (url, options) => {
    assert.ok(String(url).endsWith('/learning-centers/results/recover'), 'Recovery uses the assessment endpoint, without estimating or awarding XP')
    const input = JSON.parse(String(options?.body))
    writes.push(input)
    if (input.sourceKey === 'single-writing' && failSingle) return Response.json({ message: 'Offline' }, { status: 503 })
    return Response.json({ result: input })
  }
  const first = syncSavedPerformance('owner')
  const second = syncSavedPerformance('owner')
  assert.equal(first, second, 'Concurrent recovery calls share one request sequence')
  await first
  assert.deepEqual(writes.map((input) => input.sourceKey), ['writing-full-full-1-full-task1', 'single-writing', 'speaking-my-mock'])
  assert.equal(writes[0].score, 7.5, 'A full Writing paper counts once at its overall band')
  assert.ok(writes.every((input) => input.preserveExisting === true), 'Backfill preserves newer server reports and detailed criteria')
  assert.equal(useAuthStore.getState().user!.xp, 781)
  failSingle = false
  await syncSavedPerformance('owner')
  assert.equal(writes.length, 4, 'Successful writes are acknowledged; failed writes are retried')
  assert.equal(writes[3].sourceKey, 'single-writing')
  await syncSavedPerformance('owner')
  assert.equal(writes.length, 4, 'Repeated recovery is idempotent on this device')
  useAuthStore.setState({ user: { ...useAuthStore.getState().user!, id: 'other' } })
  await syncSavedPerformance('owner')
  assert.equal(writes.length, 4, 'A changed account cannot upload the previous learner’s history')
  const remoteUser = { ...useAuthStore.getState().user!, id: 'remote-only' }
  useAuthStore.setState({ user: remoteUser })
  const remoteRecords = getResultsHistory(remoteUser.id, [], [{
    id: 'assessment:essay', finalScore: 66.67, percentage: 66.67, xpEarned: 0, completedAt: entry.savedAt,
    assessment: { sourceKey: 'remote-writing', skill: 'IELTS_WRITING', score: 6, maxScore: 9 },
    test: { id: 'essay', title: 'An essay without a skill in its title', category: 'IELTS', difficulty: 'HARD' },
  }, {
    id: 'assessment:sat', finalScore: 40, percentage: 40, xpEarned: 0, completedAt: entry.savedAt,
    assessment: { sourceKey: 'remote-sat', skill: 'SAT_OVERALL', score: 1200, maxScore: 1600 },
    test: { id: 'sat', title: 'Digital SAT', category: 'SAT', difficulty: 'HARD' },
  }])
  assert.equal(remoteRecords.length, 2, 'Distinct tests completed at the same time are both retained')
  assert.equal(remoteRecords[0].skill, 'writing', 'A synced Writing result uses its saved skill rather than guessing from the title')
  assert.equal(remoteRecords[0].score!.value, '6.0')
  assert.equal(remoteRecords[1].score!.value, '1200', 'SAT points retain their native scale')
  assert.equal(remoteRecords[1].stats[0].value, '40%', 'Scaled SAT points are never mislabeled as question accuracy')

  const root = createRoot(document.getElementById('root')!)
  function IdentitySync() { useProfileIdentitySync(); return null }
  const savedUser = { ...useAuthStore.getState().user!, xp: 1500, level: 5, currentStreak: 7 }
  globalThis.fetch = async () => Response.json({ user: savedUser })
  await act(async () => root.render(<IdentitySync />))
  assert.equal(useAuthStore.getState().user!.xp, 1500, 'Cached account XP refreshes from the server')
  assert.equal(useAuthStore.getState().user!.level, 5)
  assert.equal(useAuthStore.getState().user!.currentStreak, 7)
  await act(async () => root.render(null))
  let respond!: (response: Response) => void
  globalThis.fetch = () => new Promise<Response>((resolve) => { respond = resolve })
  await act(async () => root.render(<IdentitySync />))
  await act(async () => useAuthStore.getState().updateUserProgress({ xp: 1700, level: 5, currentStreak: 8 }))
  await act(async () => respond(Response.json({ user: savedUser })))
  assert.equal(useAuthStore.getState().user!.xp, 1700, 'A delayed identity response cannot overwrite a newer confirmed award')
  assert.equal(useAuthStore.getState().user!.currentStreak, 8)
  await act(async () => root.unmount())
  console.log('PASS: saved-result recovery, original keys, full Writing deduplication, retry, existing report preservation and account isolation')
}
