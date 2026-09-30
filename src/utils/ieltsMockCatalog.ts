// Full Mock catalog. Each Full Mock N bundles the four IELTS sections —
// Listening N, Reading N, Writing N, Speaking N — into one exam package, in the
// official exam order (Listening → Reading → Writing → Speaking).
//
// Content is NOT duplicated here: every section reuses the existing per-track
// catalogs and runners, so a section is only "available" when real content for
// it already exists. Missing slots surface as "coming soon" instead of fake
// questions. Launch paths mirror exactly what the section pages already navigate
// to, so the existing runners resolve each test id without changes.

import { getIeltsFullTestCatalog, getIeltsReadingUnifiedCatalog, isAvailableIeltsTrackTest } from './ieltsTrackCatalog'
import { getIeltsSpeakingFullMockCatalog } from './ieltsSpeakingCatalog'
import { getWritingFullTestCatalog } from '@/data/writingTestData'
import type { TestResult } from '@/types/ieltsTypes'

export type MockSectionKey = 'listening' | 'reading' | 'writing' | 'speaking'

export type MockSection = {
  key: MockSectionKey
  /** 1-based position in the official exam order. */
  order: number
  title: string
  durationMinutes: number
  meta: string
  available: boolean
  /** Route to launch this section; null while the section is coming soon. */
  launchPath: string | null
}

export type FullMockEntry = {
  id: string
  index: number
  title: string
  totalMinutes: number
  sections: MockSection[]
  /** How many of the four sections have live content right now. */
  readyCount: number
  fullyReady: boolean
}

// A mock needs four distinct, runnable tests. The Reading catalog currently has
// 22 complete tests, so later Speaking/Writing content does not create empty mocks.
export const TOTAL_FULL_MOCKS = Math.min(
  getIeltsFullTestCatalog('listening').filter((entry) => isAvailableIeltsTrackTest('listening', entry.testId)).length,
  getIeltsReadingUnifiedCatalog().filter((entry) => isAvailableIeltsTrackTest('reading', entry.testId)).length,
  getWritingFullTestCatalog().filter((entry) => entry.available).length,
  getIeltsSpeakingFullMockCatalog().filter((entry) => entry.available).length,
)
export const MOCK_SECTION_COUNT = 4

function buildSections(index: number): MockSection[] {
  const readingEntry = getIeltsReadingUnifiedCatalog()[index - 1]
  const listeningEntry = getIeltsFullTestCatalog('listening')[index - 1]
  const speakingEntry = getIeltsSpeakingFullMockCatalog()[index - 1]
  const writingEntry = getWritingFullTestCatalog()[index - 1]

  const listeningAvailable = listeningEntry
    ? isAvailableIeltsTrackTest('listening', listeningEntry.testId)
    : false
  const readingAvailable = readingEntry
    ? isAvailableIeltsTrackTest('reading', readingEntry.testId)
    : false
  const speakingAvailable = Boolean(speakingEntry?.available)
  const writingAvailable = Boolean(writingEntry?.available)

  return [
    {
      key: 'listening',
      order: 1,
      title: 'Listening',
      durationMinutes: 30,
      meta: '4 parts · 40 questions',
      available: listeningAvailable,
      launchPath: listeningAvailable && listeningEntry ? `/test/listening/${listeningEntry.testId}` : null,
    },
    {
      key: 'reading',
      order: 2,
      title: 'Reading',
      durationMinutes: 60,
      meta: '3 passages · 40 questions',
      available: readingAvailable,
      launchPath: readingAvailable && readingEntry ? `/test/reading/${readingEntry.testId}` : null,
    },
    {
      key: 'writing',
      order: 3,
      title: 'Writing',
      durationMinutes: 60,
      meta: 'Task 1 + Task 2',
      available: writingAvailable,
      launchPath: writingAvailable ? `/ielts/writing/test/writing-full-${index}` : null,
    },
    {
      key: 'speaking',
      order: 4,
      title: 'Speaking',
      durationMinutes: 14,
      meta: 'Parts 1–3 · AI examiner',
      available: speakingAvailable,
      launchPath: speakingAvailable ? `/ielts/speaking/test/speaking-full-${index}` : null,
    },
  ]
}

export function buildFullMock(index: number): FullMockEntry {
  const sections = buildSections(index)
  const readyCount = sections.filter((section) => section.available).length
  const totalMinutes = sections.reduce((sum, section) => sum + section.durationMinutes, 0)

  return {
    id: `full-mock-${index}`,
    index,
    title: `Full Mock ${index}`,
    totalMinutes,
    sections,
    readyCount,
    fullyReady: readyCount === sections.length,
  }
}

export function getFullMockCatalog(): FullMockEntry[] {
  return Array.from({ length: TOTAL_FULL_MOCKS }, (_, i) => buildFullMock(i + 1))
}

export function getFullMockById(id: string): FullMockEntry | null {
  const match = id.match(/^full-mock-(\d{1,2})$/)
  if (!match) return null
  const index = Number(match[1])
  if (index < 1 || index > TOTAL_FULL_MOCKS) return null
  return buildFullMock(index)
}

export function formatMockDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes}m`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}

// The legacy progress key is still written for dashboard metrics. The result
// store below is authoritative for exam progress, bands, and review.

export const FULL_MOCK_PROGRESS_STORAGE_KEY = 'smarttest:full-mock-progress:v1'
export const FULL_MOCK_PROGRESS_EVENT = 'smarttest:full-mock-progress'

type FullMockProgressStore = Record<string, string[]>

function isMockSectionKey(value: unknown): value is MockSectionKey {
  return value === 'listening' || value === 'reading' || value === 'writing' || value === 'speaking'
}

function readProgressStore(): FullMockProgressStore {
  if (typeof window === 'undefined') return {}
  try {
    const cached = window.localStorage.getItem(FULL_MOCK_PROGRESS_STORAGE_KEY)
    const parsed = cached ? (JSON.parse(cached) as unknown) : null
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as FullMockProgressStore
  } catch {
    return {}
  }
}

function writeProgressStore(store: FullMockProgressStore): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(FULL_MOCK_PROGRESS_STORAGE_KEY, JSON.stringify(store))
  window.dispatchEvent(new CustomEvent(FULL_MOCK_PROGRESS_EVENT))
}

export function getFullMockCompletedSections(mockId: string): MockSectionKey[] {
  return Object.keys(getFullMockResults(mockId)).filter(isMockSectionKey)
}

/** Mark a section finished. Idempotent; only the runners should call this. */
export function markFullMockSectionComplete(mockId: string, section: MockSectionKey): void {
  if (!/^full-mock-\d{1,2}$/.test(mockId)) return
  const store = readProgressStore()
  const current = new Set((store[mockId] ?? []).filter(isMockSectionKey))
  if (current.has(section)) return
  current.add(section)
  writeProgressStore({ ...store, [mockId]: Array.from(current) })
}

export type FullMockSectionResult = {
  band: number
  completedAt: string
  testId: string
  result?: TestResult
  summary?: string
  review?: { label: string; response: string; feedback?: string }[]
}

const RESULT_STORAGE_KEY = 'smarttest:full-mock-results:v1'
type FullMockResults = Record<string, Partial<Record<MockSectionKey, FullMockSectionResult>>>

function readResults(): FullMockResults {
  if (typeof window === 'undefined') return {}
  try {
    const parsed = JSON.parse(window.localStorage.getItem(RESULT_STORAGE_KEY) ?? '{}')
    return parsed && typeof parsed === 'object' ? parsed as FullMockResults : {}
  } catch { return {} }
}

export function getFullMockResults(mockId: string): Partial<Record<MockSectionKey, FullMockSectionResult>> {
  return readResults()[mockId] ?? {}
}

export function saveFullMockSectionResult(mockId: string, section: MockSectionKey, result: FullMockSectionResult): void {
  if (!getFullMockById(mockId) || !Number.isFinite(result.band) || result.band < 0 || result.band > 9) return
  const store = readResults()
  try {
    window.localStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify({
      ...store,
      [mockId]: { ...store[mockId], [section]: result },
    }))
    markFullMockSectionComplete(mockId, section)
    window.dispatchEvent(new CustomEvent(FULL_MOCK_PROGRESS_EVENT))
  } catch { /* Keep the exam flow usable if browser storage is full. */ }
}

export function getFullMockOverallBand(mockId: string): number | null {
  const results = getFullMockResults(mockId)
  const bands = (['listening', 'reading', 'writing', 'speaking'] as const).map((key) => results[key]?.band)
  if (bands.some((band) => typeof band !== 'number' || !Number.isFinite(band))) return null
  const average = bands.reduce<number>((sum, band) => sum + (band ?? 0), 0) / MOCK_SECTION_COUNT
  // IELTS overall scores round to the nearest half band; .25 and .75 round up.
  return Math.round(average * 2) / 2
}

export function getNextFullMockSection(mockId: string, section: MockSectionKey): MockSection | null {
  const mock = getFullMockById(mockId)
  const index = mock?.sections.findIndex((entry) => entry.key === section) ?? -1
  return index >= 0 ? mock?.sections[index + 1] ?? null : null
}
