// Builds a compact snapshot of the learner's study state so the AI assistant can act
// like a real teacher: it knows which Reading/Listening tests are LIVE, which ones the
// learner has already finished, and therefore which test is "one they haven't done yet".
//
// Everything is read from the same localStorage the catalog page writes to
// (smarttest:ielts-track-dashboard:v2) plus the scored Reading analysis history, so the
// snapshot always matches what the user sees in the UI — no backend round-trip needed.

import {
  getIeltsFullTestCatalog,
  getIeltsPassageCatalog,
  isAvailableIeltsTrackTest,
  type IeltsTrackType,
} from '@/utils/ieltsTrackCatalog'
import { getReadingAnalysisHistory } from '@/utils/readingAnalysisStorage'

const TRACK_ENGAGEMENT_STORAGE_KEY = 'smarttest:ielts-track-dashboard:v2'

export type StudyTestEntry = {
  /** Catalog row id, e.g. "reading-day-1" or "reading-full-1". */
  id: string
  /** The id the test runner resolves, e.g. "reading-day-1" or "ielts-reading-full-vol1". */
  testId: string
  title: string
  durationMinutes: number
  completed: boolean
}

export type TrackStudySnapshot = {
  track: IeltsTrackType
  available: StudyTestEntry[]
  completedCount: number
  streakDays: number
  /** First live test the learner has NOT completed yet (in roadmap order). */
  nextUnfinished: StudyTestEntry | null
  lastVisitedTestId: string | null
}

export type StudySnapshot = {
  reading: TrackStudySnapshot
  listening: TrackStudySnapshot
}

type StoredTrackEngagement = {
  completedIds?: unknown
  dismissedCompletedIds?: unknown
  lastVisitedTestId?: unknown
  streakDays?: unknown
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function readEngagement(track: IeltsTrackType): StoredTrackEngagement {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(TRACK_ENGAGEMENT_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, StoredTrackEngagement> | null
    return (parsed?.[track] as StoredTrackEngagement) ?? {}
  } catch {
    return {}
  }
}

// Pull every LIVE catalog test for a track, in the same passage→full-test order the
// roadmap shows, each tagged with the testId the runner needs.
function liveCatalogEntries(track: IeltsTrackType): Array<Omit<StudyTestEntry, 'completed'>> {
  const trackLabel = track === 'reading' ? 'Reading' : 'Listening'
  const passages = getIeltsPassageCatalog(track)
    .filter((entry) => isAvailableIeltsTrackTest(track, entry.testId))
    .map((entry) => ({
      id: entry.id,
      testId: entry.testId,
      title: entry.title,
      durationMinutes: entry.passageNumber === null ? 60 : 20,
    }))

  const fullTests = getIeltsFullTestCatalog(track)
    .filter((entry) => isAvailableIeltsTrackTest(track, entry.testId))
    .map((entry) => ({
      id: entry.id,
      testId: entry.testId,
      title: `${trackLabel} Full Test ${entry.index}`,
      durationMinutes: track === 'reading' ? 60 : 30,
    }))

  return [...passages, ...fullTests]
}

function buildTrackSnapshot(track: IeltsTrackType, userId: string | null): TrackStudySnapshot {
  const engagement = readEngagement(track)
  const dismissed = new Set(readStringArray(engagement.dismissedCompletedIds))
  const completedRowIds = new Set(readStringArray(engagement.completedIds).filter((id) => !dismissed.has(id)))

  // Scored Reading attempts also count as "completed" (matches the catalog logic).
  const scoredTestIds = new Set<string>()
  if (track === 'reading') {
    getReadingAnalysisHistory(userId ?? undefined)
      .filter((entry) => entry.correctAnswers > 0 && entry.totalQuestions > 0)
      .forEach((entry) => scoredTestIds.add(entry.testId))
  }

  const entries: StudyTestEntry[] = liveCatalogEntries(track).map((entry) => ({
    ...entry,
    completed: completedRowIds.has(entry.id) || scoredTestIds.has(entry.testId),
  }))

  const nextUnfinished = entries.find((entry) => !entry.completed) ?? null
  const lastVisitedTestId =
    typeof engagement.lastVisitedTestId === 'string' ? engagement.lastVisitedTestId : null
  const streakDays =
    typeof engagement.streakDays === 'number' && Number.isFinite(engagement.streakDays)
      ? Math.max(0, Math.round(engagement.streakDays))
      : 0

  return {
    track,
    available: entries,
    completedCount: entries.filter((entry) => entry.completed).length,
    streakDays,
    nextUnfinished,
    lastVisitedTestId,
  }
}

export function buildStudySnapshot(userId: string | null): StudySnapshot {
  return {
    reading: buildTrackSnapshot('reading', userId),
    listening: buildTrackSnapshot('listening', userId),
  }
}

// Resolve a test the learner asked for. Accepts:
//  - a concrete testId ("ielts-listening-2") or catalog id ("listening-full-2")
//  - a track + ordinal ("listening test 2" → 2nd full/available listening test)
//  - "unfinished"/"next" → first live test not completed yet
export function resolveStudyTest(
  snapshot: StudySnapshot,
  track: IeltsTrackType,
  selector: { testId?: string; ordinal?: number; unfinished?: boolean },
): StudyTestEntry | null {
  const trackSnapshot = snapshot[track]
  const list = trackSnapshot.available

  if (selector.unfinished) {
    return trackSnapshot.nextUnfinished ?? list[0] ?? null
  }

  if (selector.testId) {
    const wanted = selector.testId.trim()
    const direct = list.find((entry) => entry.testId === wanted || entry.id === wanted)
    if (direct) return direct
  }

  if (typeof selector.ordinal === 'number' && selector.ordinal > 0) {
    // "Listening test 2" most naturally means the 2nd full test; fall back to the
    // nth available entry overall when there are not enough full tests.
    const fullTests = list.filter((entry) => entry.id.includes('-full-'))
    const byFull = fullTests[selector.ordinal - 1]
    if (byFull) return byFull
    const byIndex = list[selector.ordinal - 1]
    if (byIndex) return byIndex
  }

  return null
}

// A short human-readable digest the AI receives every turn, so its replies and choices
// are grounded in the learner's real progress. Kept compact to save tokens.
export function describeStudySnapshot(snapshot: StudySnapshot): string {
  const lines: string[] = []

  for (const track of ['reading', 'listening'] as const) {
    const trackSnapshot = snapshot[track]
    const label = track === 'reading' ? 'READING' : 'LISTENING'
    const liveList = trackSnapshot.available
      .map((entry) => `${entry.title} [${entry.testId}]${entry.completed ? ' ✔done' : ''}`)
      .join(', ')

    lines.push(
      `${label}: ${trackSnapshot.completedCount}/${trackSnapshot.available.length} completed · streak ${trackSnapshot.streakDays}d` +
        (trackSnapshot.nextUnfinished
          ? ` · next unfinished = ${trackSnapshot.nextUnfinished.title} [${trackSnapshot.nextUnfinished.testId}]`
          : ' · all live tests done'),
    )
    lines.push(`${label} live tests: ${liveList || '(none live yet)'}`)
  }

  return lines.join('\n')
}
