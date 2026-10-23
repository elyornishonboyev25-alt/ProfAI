import { selectUserSessions, type SpeakingSessionRecord } from '@/store/speakingStore'
import { getFullMockCatalog, getFullMockResults, type MockSectionKey } from '@/utils/ieltsMockCatalog'
import { resolveIeltsTestById } from '@/utils/ieltsTestCatalog'
import { getReadingAnalysisHistory } from '@/utils/readingAnalysisStorage'
import { getWritingAnalysisHistory } from '@/utils/writingAnalysisStorage'

export type IeltsHubScores = Record<MockSectionKey, number | null>

export function getIeltsHubScores(userId: string | undefined, speakingSessions: SpeakingSessionRecord[]): IeltsHubScores {
  const scores: IeltsHubScores = { listening: null, reading: null, writing: null, speaking: null }
  const dates: Record<MockSectionKey, number> = { listening: -Infinity, reading: -Infinity, writing: -Infinity, speaking: -Infinity }
  const consider = (skill: MockSectionKey, band: unknown, completedAt: string) => {
    const date = Date.parse(completedAt)
    if (typeof band !== 'number' || !Number.isFinite(band) || band < 0 || band > 9 || !Number.isFinite(date)) return
    if (date <= dates[skill]) return
    scores[skill] = band
    dates[skill] = date
  }

  for (const entry of getReadingAnalysisHistory(userId)) {
    const module = resolveIeltsTestById(entry.testId, entry.resultPayload)?.module
    const listening = module === 'Listening' || `${entry.testId} ${entry.testTitle}`.toLowerCase().includes('listening')
    consider(listening ? 'listening' : 'reading', entry.bandScore, entry.savedAt)
  }
  for (const entry of getWritingAnalysisHistory(userId)) {
    consider('writing', entry.fullTest?.overallBand ?? entry.overallBand, entry.savedAt)
  }
  for (const session of selectUserSessions(speakingSessions, userId ?? null)) {
    consider('speaking', session.overallBand, session.date)
  }
  // Mock objective sections advance directly to the next section, without
  // visiting Results (which writes the standalone analysis history).
  for (const mock of getFullMockCatalog()) {
    const results = getFullMockResults(mock.id, userId ?? 'guest')
    for (const skill of ['listening', 'reading', 'writing', 'speaking'] as const) {
      const result = results[skill]
      if (result) consider(skill, result.band, result.completedAt)
    }
  }
  return scores
}
