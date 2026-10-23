import { selectUserSessions, type SpeakingSessionRecord } from '@/store/speakingStore'
import { getFullMockCatalog, getFullMockResults, type MockSectionKey } from '@/utils/ieltsMockCatalog'
import { resolveIeltsTestById } from '@/utils/ieltsTestCatalog'
import { getReadingAnalysisHistory } from '@/utils/readingAnalysisStorage'
import { getWritingAnalysisHistory } from '@/utils/writingAnalysisStorage'
import { accountStorageFor } from '@/utils/accountStorage'

export type IeltsHubScores = Record<MockSectionKey, number | null>

export function getIeltsHubScores(userId: string | undefined, speakingSessions: SpeakingSessionRecord[]): IeltsHubScores {
  const scores: IeltsHubScores = { listening: null, reading: null, writing: null, speaking: null }
  const consider = (skill: MockSectionKey, band: unknown) => {
    if (typeof band !== 'number' || !Number.isFinite(band) || band < 0 || band > 9) return
    scores[skill] = Math.max(scores[skill] ?? 0, band)
  }

  for (const entry of getReadingAnalysisHistory(userId)) {
    const module = resolveIeltsTestById(entry.testId, entry.resultPayload)?.module
    const listening = module === 'Listening' || `${entry.testId} ${entry.testTitle}`.toLowerCase().includes('listening')
    consider(listening ? 'listening' : 'reading', entry.bandScore)
  }
  for (const entry of getWritingAnalysisHistory(userId)) {
    consider('writing', entry.fullTest?.overallBand ?? entry.overallBand)
  }
  for (const session of selectUserSessions(speakingSessions, userId ?? null)) {
    consider('speaking', session.overallBand)
  }
  // Mock objective sections advance directly to the next section, without
  // visiting Results (which writes the standalone analysis history).
  for (const mock of getFullMockCatalog()) {
    const results = getFullMockResults(mock.id, userId ?? 'guest')
    for (const skill of ['listening', 'reading', 'writing', 'speaking'] as const) {
      const result = results[skill]
      if (result && !('assessmentStatus' in result && result.assessmentStatus === 'pending')) consider(skill, result.band)
    }
    // Retaking a mock archives its previous results before clearing the paper.
    // Include those attempts so a retake cannot erase a personal best.
    try {
      const history = JSON.parse(accountStorageFor(userId ?? 'guest').getItem(`smarttest:full-mock-history:v1:${mock.id}`) ?? '[]')
      if (!Array.isArray(history)) continue
      for (const attempt of history) {
        for (const skill of ['listening', 'reading', 'writing', 'speaking'] as const) {
          const result = attempt?.sections?.[skill]
          if (result && result.assessmentStatus !== 'pending') consider(skill, result.band)
        }
      }
    } catch { /* A malformed archive must not hide other scored attempts. */ }
  }
  return scores
}
