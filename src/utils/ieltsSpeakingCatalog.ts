// Speaking practice catalog (1–30) + Full Mock catalog (1–20). Practice tests
// cycle through Part 1 → Part 2 (cue card) → Part 3, then repeat from Part 1.
//
// The bank now holds 30 of each part. To guarantee NO question is ever reused, the
// 10 Days of each part use indices 0–9, and the 20 mocks use indices 10–29 — so the
// The practice catalog and every full mock have completely distinct questions.

import {
  CUE_CARDS,
  PART1_TOPICS,
  PART3_THEMES,
  type Part1Topic,
  type Part2Card,
  type Part3Theme,
} from '@/data/ieltsSpeakingQuestionBank'

// 30 of each part: first 10 feed the Days, the remaining 20 feed the mocks.
const DAY_BANK_SIZE = 10

export type SpeakingPart = 1 | 2 | 3

export type SpeakingDayPart1 = {
  kind: 'part1'
  topic: Part1Topic
}

export type SpeakingDayPart2 = {
  kind: 'part2'
  card: Part2Card
}

export type SpeakingDayPart3 = {
  kind: 'part3'
  theme: Part3Theme
}

export type SpeakingDayContent = SpeakingDayPart1 | SpeakingDayPart2 | SpeakingDayPart3

export type SpeakingDayEntry = {
  id: string
  day: number
  part: SpeakingPart
  title: string
  subtitle: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  durationMinutes: number
  available: boolean
  premiumOnly: boolean
  content: SpeakingDayContent
}

export type SpeakingFullMockEntry = {
  id: string
  index: number
  title: string
  subtitle: string
  durationMinutes: number
  available: boolean
  premiumOnly: boolean
  /** One Part 1 topic + one Part 2 cue card + one Part 3 theme. */
  parts: {
    part1: Part1Topic
    part2: Part2Card
    part3: Part3Theme
  }
}

const TOTAL_DAYS = 30
const TOTAL_FULL_MOCKS = 20

/** Cycle position: 1 (Part 1), 2 (Part 2), or 3 (Part 3). */
export function partForDay(day: number): SpeakingPart {
  return (((day - 1) % 3) + 1) as SpeakingPart
}

/** Slot inside its own part-rotation (0-based): how many times we've seen this part already. */
function slotForDay(day: number): number {
  return Math.floor((day - 1) / 3)
}

function difficultyForDay(day: number): 'Easy' | 'Medium' | 'Hard' {
  if (day <= 10) return 'Easy'
  if (day <= 20) return 'Medium'
  return 'Hard'
}

function buildDayContent(day: number): SpeakingDayContent {
  const part = partForDay(day)
  // Days only ever use the first 10 of each part (indices 0–9).
  const slot = slotForDay(day) % DAY_BANK_SIZE
  if (part === 1) {
    return { kind: 'part1', topic: PART1_TOPICS[slot] }
  }
  if (part === 2) {
    return { kind: 'part2', card: CUE_CARDS[slot] }
  }
  return { kind: 'part3', theme: PART3_THEMES[slot] }
}

function dayTitle(day: number): string {
  return `Speaking Full Test ${day}`
}

function daySubtitle(content: SpeakingDayContent): string {
  if (content.kind === 'part1') return `Part 1 · ${content.topic.topic}`
  if (content.kind === 'part2') return `Part 2 · ${content.card.title.replace(/^Describe /, '')}`
  return `Part 3 · ${content.theme.theme}`
}

function dayDuration(part: SpeakingPart): number {
  if (part === 1) return 5
  if (part === 2) return 4
  return 8
}

export function getIeltsSpeakingDayCatalog(): SpeakingDayEntry[] {
  return Array.from({ length: TOTAL_DAYS }, (_, index) => {
    const day = index + 1
    const part = partForDay(day)
    const content = buildDayContent(day)
    return {
      id: `speaking-day-${day}`,
      day,
      part,
      title: dayTitle(day),
      subtitle: daySubtitle(content),
      difficulty: difficultyForDay(day),
      durationMinutes: dayDuration(part),
      available: true,
      premiumOnly: false,
      content,
    }
  })
}

export function getIeltsSpeakingFullMockCatalog(): SpeakingFullMockEntry[] {
  return Array.from({ length: TOTAL_FULL_MOCKS }, (_, index) => {
    const i = index + 1
    return {
      id: `speaking-full-${i}`,
      index: i,
      title: `Speaking Full Mock ${i}`,
      subtitle: 'Part 1 → 2 → 3 · graded by the AI examiner',
      durationMinutes: 14,
      available: true,
      premiumOnly: false,
      // Mocks use indices 10–29 of each part — completely separate from the Days
      // (0–9) and distinct from one another, so no question is ever reused.
      parts: {
        part1: PART1_TOPICS[DAY_BANK_SIZE + (i - 1)],
        part2: CUE_CARDS[DAY_BANK_SIZE + (i - 1)],
        part3: PART3_THEMES[DAY_BANK_SIZE + (i - 1)],
      },
    }
  })
}

export function findIeltsSpeakingDay(id: string): SpeakingDayEntry | null {
  return getIeltsSpeakingDayCatalog().find((d) => d.id === id) ?? null
}

export function findIeltsSpeakingFullMock(id: string): SpeakingFullMockEntry | null {
  return getIeltsSpeakingFullMockCatalog().find((m) => m.id === id) ?? null
}

function speakingCompletionKey(userId?: string) {
  return `smarttest-speaking-completed-v1:${userId?.trim() || 'guest'}`
}

export function getCompletedSpeakingTestIds(userId?: string): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const stored = JSON.parse(window.localStorage.getItem(speakingCompletionKey(userId)) ?? '[]')
    return new Set(Array.isArray(stored) ? stored.filter((id): id is string => typeof id === 'string') : [])
  } catch {
    return new Set()
  }
}

export function markSpeakingTestCompleted(testId: string, userId?: string) {
  if (typeof window === 'undefined' || !testId) return
  const completed = getCompletedSpeakingTestIds(userId)
  completed.add(testId)
  window.localStorage.setItem(speakingCompletionKey(userId), JSON.stringify([...completed]))
}
