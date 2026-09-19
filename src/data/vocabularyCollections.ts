import { satVocabularyPacks } from './satVocabulary'
import {
  readingVocabularyByTest,
  type ReadingVocabularySeed,
} from './ieltsReadingVocabularySource'
import { readingVocabularyByTest4 } from './ieltsReadingVocabularyTest4'
import { readingVocabularyByTest5 } from './ieltsReadingVocabularyTest5'
import { readingVocabularyByTest6 } from './ieltsReadingVocabularyTest6'
import { readingVocabularyByTest7 } from './ieltsReadingVocabularyTest7'
import { readingVocabularyByTest8 } from './ieltsReadingVocabularyTest8'
import { readingVocabularyByTest9 } from './ieltsReadingVocabularyTest9'
import { readingVocabularyByTest10 } from './ieltsReadingVocabularyTest10'
import { readingDayVocabularySeeds } from './readingDayVocabularySeeds'
import { readingDayVocabularyByPassage } from './readingDayVocabularyByPassage'
import { isAvailableIeltsTrackTest } from '../utils/ieltsTrackCatalog'

export type VocabularyTrack = 'IELTS' | 'SAT'

export type VocabularyEntry = {
  id: string
  term: string
  uzbek?: string
  definition: string
  example: string
  exampleUzbek?: string
  synonym: string
  sourceQuestionId?: string
}

export type VocabularySection = {
  id: string
  title: string
  entries: VocabularyEntry[]
}

export type IeltsTest = {
  id: string
  title: string
  sections: VocabularySection[]
  available?: boolean
}

export type IeltsBook = {
  id: string
  title: string
  tests: IeltsTest[]
}

export type SatPack = {
  id: string
  title: string
  sections: VocabularySection[]
}

export type VocabularyCollections = {
  ielts: IeltsBook[]
  sat: SatPack[]
}

const DAY_TRACK_COUNT = 30
const FULL_TRACK_COUNT = 20
const LIVE_FULL_TEST_COUNT = 10
const PASSAGES_PER_FULL_TEST = 3
const MOCK_READING_DAYS = new Set([10, 20, 30])

function firstSynonymLine(raw: string): string {
  const first = raw.split(',')[0]?.trim()
  return first && first.length > 0 ? first : raw.trim()
}

function toEntry(seed: ReadingVocabularySeed, id: string): VocabularyEntry {
  return {
    id,
    term: seed.term.trim(),
    uzbek: seed.uzbek?.trim(),
    definition: seed.definition.trim(),
    example: seed.example.trim(),
    exampleUzbek: seed.exampleUzbek?.trim(),
    synonym: firstSynonymLine(seed.synonyms),
  }
}

function getPassageSeeds(testNumber: number, passageNumber: number): ReadingVocabularySeed[] {
  const testKey = String(testNumber)
  const passageKey = String(passageNumber)
  return (
    readingVocabularyByTest[testKey]?.[passageKey] ??
    readingVocabularyByTest4[testKey]?.[passageKey] ??
    readingVocabularyByTest5[testKey]?.[passageKey] ??
    readingVocabularyByTest6[testKey]?.[passageKey] ??
    readingVocabularyByTest7[testKey]?.[passageKey] ??
    readingVocabularyByTest8[testKey]?.[passageKey] ??
    readingVocabularyByTest9[testKey]?.[passageKey] ??
    readingVocabularyByTest10[testKey]?.[passageKey] ??
    []
  )
}

const realFullSeeds = Array.from({ length: LIVE_FULL_TEST_COUNT }, (_, testOffset) => {
  const testNumber = testOffset + 1
  return {
    testNumber,
    passages: Array.from({ length: PASSAGES_PER_FULL_TEST }, (_, passageOffset) => {
      const passageNumber = passageOffset + 1
      return {
        passageNumber,
        seeds: getPassageSeeds(testNumber, passageNumber),
      }
    }),
  }
})

const flattenedLiveSeeds: ReadingVocabularySeed[] = realFullSeeds.flatMap((test) =>
  test.passages.flatMap((passage) => passage.seeds),
)

function buildComingSoonSection(sectionId: string, title: string, fallbackIndex: number): VocabularySection {
  const fallback = flattenedLiveSeeds[fallbackIndex % Math.max(1, flattenedLiveSeeds.length)]

  return {
    id: sectionId,
    title,
    entries: [
      toEntry(
        fallback ?? {
          term: 'Coming soon',
          definition: 'This vocabulary set will unlock in the next update.',
          synonyms: 'upcoming',
          example: 'New IELTS reading vocabulary will be published here soon.',
        },
        `${sectionId}_preview`,
      ),
    ],
  }
}

function buildDayTrackTests(): IeltsTest[] {
  return Array.from({ length: DAY_TRACK_COUNT }, (_, dayIndex) => {
    const day = dayIndex + 1
    const passageNumber = (dayIndex % PASSAGES_PER_FULL_TEST) + 1
    const sourceTest = Math.floor(dayIndex / PASSAGES_PER_FULL_TEST) + 1

    const fallbackRotationIndex = dayIndex % (LIVE_FULL_TEST_COUNT * PASSAGES_PER_FULL_TEST)
    const fallbackSourceTest = Math.floor(fallbackRotationIndex / PASSAGES_PER_FULL_TEST) + 1
    const fallbackSourcePassage = (fallbackRotationIndex % PASSAGES_PER_FULL_TEST) + 1

    const customDaySeeds = readingDayVocabularySeeds[day] ?? []
    const customPassageSeeds = readingDayVocabularyByPassage[day]
    const primarySeeds = getPassageSeeds(sourceTest, passageNumber)
    const seeds =
      customDaySeeds.length > 0
        ? customDaySeeds
        : primarySeeds.length > 0
          ? primarySeeds
          : getPassageSeeds(fallbackSourceTest, fallbackSourcePassage)

    const entries = seeds.map((seed, entryIndex) =>
      toEntry(seed, `reading_day_${day}_entry_${entryIndex + 1}`),
    )
    const isAvailable = isAvailableIeltsTrackTest('reading', `reading-day-${day}`)
    const sectionId = `reading_day_${day}_passage_${passageNumber}`
    const sectionTitle = `Passage ${passageNumber}`

    return {
      id: `reading_day_${day}`,
      title: MOCK_READING_DAYS.has(day) ? `Day ${day} (Mock)` : `Day ${day}`,
      available: isAvailable,
      sections: isAvailable
        ? customPassageSeeds
          ? Object.entries(customPassageSeeds)
              .sort(([left], [right]) => Number(left) - Number(right))
              .map(([customPassageNumber, passageSeeds]) => ({
                id: `reading_day_${day}_passage_${customPassageNumber}`,
                title: `Passage ${customPassageNumber}`,
                entries: passageSeeds.map((seed, entryIndex) =>
                  toEntry(seed, `reading_day_${day}_passage_${customPassageNumber}_entry_${entryIndex + 1}`),
                ),
              }))
          : [
            {
              id: sectionId,
              title: sectionTitle,
              entries,
            },
          ]
        : [buildComingSoonSection(sectionId, sectionTitle, dayIndex)],
    }
  })
}

function buildFullTrackTests(): IeltsTest[] {
  return Array.from({ length: FULL_TRACK_COUNT }, (_, index) => {
    const testIndex = index + 1
    const isAvailable = isAvailableIeltsTrackTest('reading', `ielts-reading-full-vol${testIndex}`)

    if (isAvailable) {
      const sections = Array.from({ length: PASSAGES_PER_FULL_TEST }, (_, passageOffset) => {
        const passageNumber = passageOffset + 1
        const seeds = getPassageSeeds(testIndex, passageNumber)
        return {
          id: `reading_full_test_${testIndex}_passage_${passageNumber}`,
          title: `Passage ${passageNumber}`,
          entries: seeds.map((seed, entryIndex) =>
            toEntry(
              seed,
              `reading_full_test_${testIndex}_passage_${passageNumber}_entry_${entryIndex + 1}`,
            ),
          ),
        }
      })

      return {
        id: `reading_full_test_${testIndex}`,
        title: `Full Test ${testIndex}`,
        available: true,
        sections,
      }
    }

    return {
      id: `reading_full_test_${testIndex}`,
      title: `Full Test ${testIndex}`,
      available: false,
      sections: [
        buildComingSoonSection(`reading_full_test_${testIndex}_passage_1`, 'Passage 1', testIndex + 1),
        buildComingSoonSection(`reading_full_test_${testIndex}_passage_2`, 'Passage 2', testIndex + 2),
        buildComingSoonSection(`reading_full_test_${testIndex}_passage_3`, 'Passage 3', testIndex + 3),
      ],
    }
  })
}

export const vocabularyCollections: VocabularyCollections = {
  ielts: [
    {
      id: 'reading_days_track',
      title: 'Reading Days 1-30',
      tests: buildDayTrackTests(),
    },
    {
      id: 'reading_full_track',
      title: 'Reading Full Tests 1-20',
      tests: buildFullTrackTests(),
    },
  ],
  sat: satVocabularyPacks,
}
