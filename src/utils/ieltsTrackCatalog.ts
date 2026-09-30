export type IeltsTrackType = 'reading' | 'listening'

export type PassageDifficulty = 'Easy' | 'Medium' | 'Hard'

export type IeltsPassageEntry = {
  id: string
  day: number
  title: string
  difficulty: PassageDifficulty
  premiumOnly: boolean
  testId: string
  passageNumber: number | null
}

export type IeltsFullTestEntry = {
  id: string
  index: number
  title: string
  premiumOnly: boolean
  testId: string
}

export type IeltsReadingUnifiedEntry = IeltsFullTestEntry & {
  source: 'roadmap' | 'library'
}

const READING_FULL_TEST_SOURCE_IDS: Record<number, string> = {
  1: 'ielts-reading-full-vol1',
  2: 'ielts-reading-full-vol2',
  3: 'ielts-reading-full-vol3',
  4: 'ielts-reading-full-vol4',
  5: 'ielts-reading-full-vol5',
  6: 'ielts-reading-full-vol6',
  7: 'ielts-reading-full-vol7',
  8: 'ielts-reading-full-vol8',
  9: 'ielts-reading-full-vol9',
  10: 'ielts-reading-full-vol10',
  23: 'ielts-reading-full-vol23',
  24: 'ielts-reading-full-vol24',
  25: 'ielts-reading-full-vol25',
  26: 'ielts-reading-full-vol26',
  27: 'ielts-reading-full-vol27',
  28: 'ielts-reading-full-vol28',
  29: 'ielts-reading-full-vol29',
  30: 'ielts-reading-full-vol30',
}

const LISTENING_FULL_TEST_SOURCE_IDS: Record<number, string> = {
  1: 'ielts-listening-1',
  2: 'ielts-listening-2',
  3: 'ielts-listening-3',
  4: 'ielts-listening-4',
  5: 'ielts-listening-5',
  6: 'ielts-listening-6',
  7: 'ielts-listening-7',
  8: 'ielts-listening-8',
  9: 'ielts-listening-9',
  10: 'ielts-listening-10',
  11: 'ielts-listening-11',
  12: 'ielts-listening-12',
  13: 'ielts-listening-13',
  14: 'ielts-listening-14',
  15: 'ielts-listening-15',
  16: 'ielts-listening-16',
  17: 'ielts-listening-17',
  18: 'ielts-listening-18',
  19: 'ielts-listening-19',
  20: 'ielts-listening-20',
  21: 'ielts-listening-21',
  22: 'ielts-listening-22',
  23: 'ielts-listening-23',
  24: 'ielts-listening-24',
  25: 'ielts-listening-25',
  26: 'ielts-listening-26',
  27: 'ielts-listening-27',
  28: 'ielts-listening-28',
  29: 'ielts-listening-29',
  30: 'ielts-listening-30',
}

const MOCK_READING_DAYS = new Set([10, 20, 30])

export const READING_ROADMAP_FULL_TEST_DAYS: readonly (readonly number[])[] = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
  [10],
  [11, 12, 13],
  [14, 15, 16],
  [17, 18, 19],
  [20],
  [21, 22, 23],
  [24, 25, 26],
  [27, 28, 29],
  [30],
] as const

const CURRENTLY_AVAILABLE_TRACK_TESTS: Record<IeltsTrackType, Set<string>> = {
  reading: new Set([
    'reading-roadmap-full-1',
    'reading-roadmap-full-2',
    'reading-roadmap-full-3',
    'reading-roadmap-full-4',
    'reading-roadmap-full-5',
    'reading-roadmap-full-6',
    'reading-roadmap-full-7',
    'reading-roadmap-full-8',
    'reading-roadmap-full-9',
    'reading-roadmap-full-10',
    'reading-roadmap-full-11',
    'reading-roadmap-full-12',
    'reading-day-1',
    'reading-day-2',
    'reading-day-3',
    'reading-day-4',
    'reading-day-5',
    'reading-day-6',
    'reading-day-7',
    'reading-day-8',
    'reading-day-9',
    'reading-day-10',
    'reading-day-14',
    'reading-day-15',
    'reading-day-16',
    'reading-day-17',
    'reading-day-18',
    'reading-day-19',
    'reading-day-20',
    'reading-day-21',
    'reading-day-22',
    'reading-day-23',
    'reading-day-24',
    'reading-day-25',
    'reading-day-26',
    'reading-day-27',
    'reading-day-28',
    'reading-day-29',
    'reading-day-30',
    'reading-day-11',
    'reading-day-12',
    'reading-day-13',
    'ielts-reading-full-vol1',
    'ielts-reading-full-vol2',
    'ielts-reading-full-vol3',
    'ielts-reading-full-vol4',
    'ielts-reading-full-vol5',
    'ielts-reading-full-vol6',
    'ielts-reading-full-vol7',
    'ielts-reading-full-vol8',
    'ielts-reading-full-vol9',
    'ielts-reading-full-vol10',
    'ielts-reading-full-vol23',
    'ielts-reading-full-vol24',
    'ielts-reading-full-vol25',
    'ielts-reading-full-vol26',
    'ielts-reading-full-vol27',
    'ielts-reading-full-vol28',
    'ielts-reading-full-vol29',
    'ielts-reading-full-vol30',
  ]),
  listening: new Set([
    'ielts-listening-1',
    'ielts-listening-2',
    'ielts-listening-3',
    'ielts-listening-4',
    'ielts-listening-5',
    'ielts-listening-6',
    'ielts-listening-7',
    'ielts-listening-8',
    'ielts-listening-9',
    'ielts-listening-10',
    'ielts-listening-11',
    'ielts-listening-12',
    'ielts-listening-13',
    'ielts-listening-14',
    'ielts-listening-15',
    'ielts-listening-16',
    'ielts-listening-17',
    'ielts-listening-18',
    'ielts-listening-19',
    'ielts-listening-20',
    'ielts-listening-21',
    'ielts-listening-22',
    'ielts-listening-23',
    'ielts-listening-24',
    'ielts-listening-25',
    'ielts-listening-26',
    'ielts-listening-27',
    'ielts-listening-28',
    'ielts-listening-29',
    'ielts-listening-30',
  ]),
}

function resolvePassageDifficulty(day: number): PassageDifficulty {
  const rotation: PassageDifficulty[] = ['Easy', 'Medium', 'Hard']
  return rotation[(Math.max(1, day) - 1) % rotation.length]
}

// Mock days (10, 20, 30) are full tests; non-mock days cycle Passage 1 → 2 → 3.
// Formula: skip 1 mock day per 10 days, then mod-3.
function resolvePassageNumber(day: number): number | null {
  if (MOCK_READING_DAYS.has(day)) return null
  const nonMockDaysBefore = (day - 1) - Math.floor((day - 1) / 10)
  return (nonMockDaysBefore % 3) + 1
}

function createPassageEntry(track: IeltsTrackType, day: number): IeltsPassageEntry {
  const trackLabel = track === 'reading' ? 'Reading' : 'Listening'
  const title = `${trackLabel} Full Test ${day}`

  return {
    id: `${track}-day-${day}`,
    day,
    title,
    difficulty: resolvePassageDifficulty(day),
    premiumOnly: false,
    testId: `${track}-day-${day}`,
    passageNumber: track === 'reading' ? resolvePassageNumber(day) : null,
  }
}

function createFullTestEntry(track: IeltsTrackType, index: number): IeltsFullTestEntry {
  const trackLabel = track === 'reading' ? 'Reading' : 'Listening'
  const seededTestId =
    track === 'reading' ? READING_FULL_TEST_SOURCE_IDS[index] : LISTENING_FULL_TEST_SOURCE_IDS[index]

  return {
    id: `${track}-full-${index}`,
    index,
    title: `${trackLabel} Full Test ${index}`,
    premiumOnly: false,
    testId: seededTestId ?? `${track}-full-${index}`,
  }
}

export function getIeltsPassageCatalog(track: IeltsTrackType): IeltsPassageEntry[] {
  return Array.from({ length: 30 }, (_, index) => createPassageEntry(track, index + 1))
}

export function getIeltsFullTestCatalog(track: IeltsTrackType): IeltsFullTestEntry[] {
  return Array.from({ length: 30 }, (_, index) => createFullTestEntry(track, index + 1))
}

/**
 * Keeps every original roadmap passage while regrouping it into 12 complete
 * tests, then appends 10 existing library tests and eight distinct new papers.
 */
export function getIeltsReadingUnifiedCatalog(): IeltsReadingUnifiedEntry[] {
  const roadmapTests: IeltsReadingUnifiedEntry[] = READING_ROADMAP_FULL_TEST_DAYS.map((_, index) => ({
    id: `reading-unified-${index + 1}`,
    index: index + 1,
    title: `Reading Full Test ${index + 1}`,
    premiumOnly: false,
    testId: `reading-roadmap-full-${index + 1}`,
    source: 'roadmap',
  }))

  const libraryTests: IeltsReadingUnifiedEntry[] = Array.from({ length: 10 }, (_, index) => ({
    id: `reading-unified-${index + 13}`,
    index: index + 13,
    title: `Reading Full Test ${index + 13}`,
    premiumOnly: false,
    testId: READING_FULL_TEST_SOURCE_IDS[index + 1],
    source: 'library',
  }))

  const newTests: IeltsReadingUnifiedEntry[] = Array.from({ length: 8 }, (_, index) => ({
    id: `reading-unified-${index + 23}`,
    index: index + 23,
    title: `Reading Full Test ${index + 23}`,
    premiumOnly: false,
    testId: READING_FULL_TEST_SOURCE_IDS[index + 23],
    source: 'library',
  }))

  return [...roadmapTests, ...libraryTests, ...newTests]
}

export function isIeltsTrackCatalogTest(track: IeltsTrackType, testId: string): boolean {
  if (!testId) return false

  if (track === 'reading' && getIeltsReadingUnifiedCatalog().some((entry) => entry.testId === testId)) {
    return true
  }

  const inPassages = getIeltsPassageCatalog(track).some((entry) => entry.testId === testId)
  if (inPassages) return true

  return getIeltsFullTestCatalog(track).some((entry) => entry.testId === testId)
}

export function isAvailableIeltsTrackTest(track: IeltsTrackType, testId: string): boolean {
  if (!testId) return false
  return CURRENTLY_AVAILABLE_TRACK_TESTS[track].has(testId)
}

export function isPremiumIeltsTrackTest(track: IeltsTrackType, testId: string): boolean {
  void track
  void testId
  return false
}
