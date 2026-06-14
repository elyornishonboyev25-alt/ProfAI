// Full Mock catalog (1–30). Each Full Mock N bundles the four IELTS sections —
// Listening N, Reading N, Writing N, Speaking N — into one exam package, in the
// official exam order (Listening → Reading → Writing → Speaking).
//
// Content is NOT duplicated here: every section reuses the existing per-track
// catalogs and runners, so a section is only "available" when real content for
// it already exists. Missing slots surface as "coming soon" instead of fake
// questions. Launch paths mirror exactly what the section pages already navigate
// to, so the existing runners resolve each test id without changes.

import { getIeltsFullTestCatalog, isAvailableIeltsTrackTest } from './ieltsTrackCatalog'
import { getIeltsSpeakingFullMockCatalog } from './ieltsSpeakingCatalog'
import { getWritingFullTestCatalog } from '@/data/writingTestData'

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

export const TOTAL_FULL_MOCKS = 30
export const MOCK_SECTION_COUNT = 4

function buildSections(index: number): MockSection[] {
  const readingEntry = getIeltsFullTestCatalog('reading')[index - 1]
  const listeningEntry = getIeltsFullTestCatalog('listening')[index - 1]
  const speakingEntry = getIeltsSpeakingFullMockCatalog()[index - 1]
  const writingEntry = getWritingFullTestCatalog()[index - 1]

  const listeningAvailable = listeningEntry
    ? isAvailableIeltsTrackTest('listening', listeningEntry.testId)
    : false
  const readingAvailable = readingEntry
    ? isAvailableIeltsTrackTest('reading', readingEntry.testId)
    : false
  const speakingAvailable = Boolean(speakingEntry)
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
