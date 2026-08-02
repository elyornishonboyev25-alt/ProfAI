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

function cloneAndRenumberSection(section: Section, offset: number, partNumber: number): Section {
  const cloned = cloneSection(section)
  return {
    ...cloned,
    id: `reading-day-30-passage-${partNumber}`,
    title: cloned.title.replace(/^Day \d+ Passage \d+:/, `Reading Passage ${partNumber}:`),
    questions: cloned.questions.map((question) => ({
      ...question,
      id: `day30-${question.id}`,
      number: question.number + offset,
      groupTitle: question.groupTitle?.replace(/Questions (\d+)-(\d+)/i, (_, start: string, end: string) =>
        `Questions ${Number(start) + offset}-${Number(end) + offset}`,
      ),
    })),
  }
}

export function buildReadingDayTest(day: number): IELTSTest {
  const normalizedDay = Math.max(1, day)
  const isMockDay = MOCK_READING_DAYS.has(normalizedDay)
  if (normalizedDay === 30) {
    const passage1 = readingDaySections[27]
    const passage2 = readingDaySections[28]
    const passage3 = readingDaySections[29]
    if (passage1 && passage2 && passage3) {
      return {
        ...fullReadingTest,
        id: 'reading-day-30',
        title: 'IELTS Reading Day 30 (Mock)',
        duration: 60,
        sections: [
          cloneAndRenumberSection(passage1, 0, 1),
          cloneAndRenumberSection(passage2, 13, 2),
          cloneAndRenumberSection(passage3, 26, 3),
        ],
        totalQuestions: 40,
      }
    }
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



