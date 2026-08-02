import { fullReadingTest } from '@/data/fullReadingTest'
import { fullReadingTest2 } from '@/data/fullReadingTest2'
import { fullReadingTest3 } from '@/data/fullReadingTest3'
import { fullReadingTest4 } from '@/data/fullReadingTest4'
import { fullReadingTest5 } from '@/data/fullReadingTest5'
import { fullReadingTest6 } from '@/data/fullReadingTest6'
import { fullReadingTest7 } from '@/data/fullReadingTest7'
import { fullReadingTest8 } from '@/data/fullReadingTest8'
import { fullReadingTest9 } from '@/data/fullReadingTest9'
import { fullReadingTest10 } from '@/data/fullReadingTest10'
import { readingDaySections } from '@/data/readingDaySections'
import { readingMockDayTests } from '@/data/readingMockDayTests'
import { mockListeningTests } from '@/data/listeningPassages'
import type { IELTSTest, Section } from '@/types/ieltsTypes'

export type GeneratedIeltsTrack = 'reading' | 'listening'
const MOCK_READING_DAYS = new Set([10, 20, 30])

function cloneSection(section: Section): Section {
  return {
    ...section,
    paragraphs: section.paragraphs ? section.paragraphs.map((item) => ({ ...item })) : undefined,
    questions: section.questions.map((question) => ({
      ...question,
      options: question.options ? [...question.options] : undefined,
      correctAnswer: Array.isArray(question.correctAnswer) ? [...question.correctAnswer] : question.correctAnswer,
    })),
  }
}

function getQuestionSlotCount(section: Section): number {
  return section.questions.reduce(
    (total, question) => total + (Array.isArray(question.correctAnswer) ? Math.max(1, question.correctAnswer.length) : 1),
    0,
  )
}

export function buildReadingDayTest(day: number): IELTSTest {
  const normalizedDay = Math.max(1, day)
  const isMockDay = MOCK_READING_DAYS.has(normalizedDay)
  if (isMockDay) {
    const mock = readingMockDayTests[normalizedDay as 10 | 20 | 30]
    if (mock) return { ...mock, sections: mock.sections.map((section) => cloneSection(section)) }
  }
  const seededDaySection = readingDaySections[normalizedDay]
  const section = seededDaySection
    ? cloneSection(seededDaySection)
    : cloneSection(fullReadingTest.sections[(normalizedDay - 1) % fullReadingTest.sections.length])
  const totalQuestions = getQuestionSlotCount(section)

  return {
    ...fullReadingTest,
    id: `reading-day-${normalizedDay}`,
    title: isMockDay ? `IELTS Reading Day ${normalizedDay} (Mock)` : `IELTS Reading Day ${normalizedDay}`,
    duration: 20,
    sections: [section],
    totalQuestions,
  }
}

export function buildReadingFullTest(index: number): IELTSTest {
  const readingRotation = [
    fullReadingTest,
    fullReadingTest2,
    fullReadingTest3,
    fullReadingTest4,
    fullReadingTest5,
    fullReadingTest6,
    fullReadingTest7,
    fullReadingTest8,
    fullReadingTest9,
    fullReadingTest10,
  ]
  const base = readingRotation[(Math.max(1, index) - 1) % readingRotation.length]
  return {
    ...base,
    id: `reading-full-${index}`,
    title: `IELTS Reading Full Test ${index}`,
    sections: base.sections.map((section) => cloneSection(section)),
  }
}

export function buildListeningDayTest(day: number): IELTSTest {
  const seed = mockListeningTests[(Math.max(1, day) - 1) % mockListeningTests.length]
  const sectionIndex = (Math.max(1, day) - 1) % Math.min(3, seed.sections.length)
  const section = cloneSection(seed.sections[sectionIndex])

  return {
    ...seed,
    id: `listening-day-${day}`,
    title: `IELTS Listening Day ${day}`,
    duration: 20,
    sections: [section],
    totalQuestions: section.questions.length,
  }
}

export function buildListeningFullTest(index: number): IELTSTest {
  const base = mockListeningTests[(Math.max(1, index) - 1) % mockListeningTests.length]
  return {
    ...base,
    id: `listening-full-${index}`,
    title: `IELTS Listening Full Test ${index}`,
    sections: base.sections.map((section) => cloneSection(section)),
  }
}

export function resolveGeneratedTrackTest(type: GeneratedIeltsTrack, id: string): IELTSTest | null {
  const dayMatch = id.match(/^(reading|listening)-day-(\d{1,2})$/)
  if (dayMatch) {
    const day = Number(dayMatch[2])
    if (day >= 1 && day <= 30) {
      return type === 'reading' ? buildReadingDayTest(day) : buildListeningDayTest(day)
    }
  }

  const fullMatch = id.match(/^(reading|listening)-full-(\d{1,2})$/)
  if (fullMatch) {
    const index = Number(fullMatch[2])
    if (index >= 1 && index <= 20) {
      return type === 'reading' ? buildReadingFullTest(index) : buildListeningFullTest(index)
    }
  }

  return null
}

export function resolveGeneratedTestById(testId: string): IELTSTest | null {
  if (!testId) return null
  if (testId.startsWith('reading-')) {
    return resolveGeneratedTrackTest('reading', testId)
  }
  if (testId.startsWith('listening-')) {
    return resolveGeneratedTrackTest('listening', testId)
  }
  return null
}



