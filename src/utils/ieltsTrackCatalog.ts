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
}

const LISTENING_FULL_TEST_SOURCE_IDS: Record<number, string> = {
  1: 'ielts-listening-1',
  2: 'ielts-listening-2',
  3: 'ielts-listening-3',
  4: 'ielts-listening-4',
  5: 'ielts-listening-5',
}

const MOCK_READING_DAYS = new Set([10, 20, 30])

const CURRENTLY_AVAILABLE_TRACK_TESTS: Record<IeltsTrackType, Set<string>> = {
  reading: new Set([
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
  ]),
  listening: new Set([
    'ielts-listening-1',
    'ielts-listening-2',
    'ielts-listening-3',
    'ielts-listening-4',
    'ielts-listening-5',
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
  const isMock = track === 'reading' && MOCK_READING_DAYS.has(day)
  const title = isMock ? `Day ${day} (Mock)` : `Day ${day}`

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

export function isIeltsTrackCatalogTest(track: IeltsTrackType, testId: string): boolean {
  if (!testId) return false

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
