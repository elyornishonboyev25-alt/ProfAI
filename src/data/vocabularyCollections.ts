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

const satLeft = [
  'abstruse', 'adamant', 'adept', 'austere', 'benevolent', 'candid', 'coherent', 'concise', 'deft', 'diligent',
  'eloquent', 'emphatic', 'fervent', 'frugal', 'gregarious', 'impartial', 'lucid', 'meticulous', 'nuanced',
  'obscure', 'pragmatic', 'resolute', 'rigorous', 'sagacious', 'skeptical', 'subtle', 'tenacious', 'vigilant',
  'wary', 'zealous',
]

const satRight = [
  'advocacy', 'allusion', 'ambiguity', 'analogy', 'assertion', 'candor', 'cohesion', 'concession', 'connotation',
  'contention', 'credibility', 'deduction', 'dissonance', 'eloquence', 'fallacy', 'foresight', 'gratitude',
  'hypocrisy', 'impulse', 'inference', 'integrity', 'judgment', 'paradox', 'precision', 'premise', 'proposal',
  'rationale', 'scrutiny', 'substance', 'validity',
]

const satSynonyms = [
  'clarity', 'logic', 'insight', 'reasoning', 'judicious', 'assertive', 'balanced', 'accurate', 'objective',
  'careful', 'exact', 'factual', 'persuasive', 'credible', 'sound', 'reliable', 'refined', 'thorough',
]

function makeSatBank() {
  const terms: string[] = []
  for (const left of satLeft) {
    for (const right of satRight) {
      terms.push(`SAT ${left} ${right}`)
    }
  }
  return terms
}

const satBank = makeSatBank()

function makeSatEntry(index: number): VocabularyEntry {
  const term = satBank[index % satBank.length]
  return {
    id: `sat_${index + 1}`,
    term,
    definition: 'High-frequency SAT expression used in reading, writing, and logic tasks.',
    example: `The author used "${term}" to make the claim precise and persuasive.`,
    synonym: satSynonyms[index % satSynonyms.length],
  }
}

function buildSatPacks(): SatPack[] {
  const satPackNames = [
    'Rhetoric Foundations',
    'Precision in Context',
    'Evidence and Reasoning',
    'Advanced Inference Set',
    'Critical Reading Core',
    'Argumentation Mastery',
    'Lexical Logic Studio',
    'Analytical Language Pack',
    'High-Score Verbal Set',
    'Elite SAT Vocabulary',
  ]

  const packs: SatPack[] = []
  let cursor = 0

  satPackNames.forEach((packName, packIndex) => {
    const sections: VocabularySection[] = []

    for (let section = 1; section <= 4; section += 1) {
      const entries: VocabularyEntry[] = []
      for (let i = 0; i < 15; i += 1) {
        entries.push(makeSatEntry(cursor))
        cursor += 1
      }
      sections.push({
        id: `sat_pack_${packIndex + 1}_section_${section}`,
        title: `Section ${section}`,
        entries,
      })
    }

    packs.push({
      id: `sat_pack_${packIndex + 1}`,
      title: packName,
      sections,
    })
  })

  return packs
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
  sat: buildSatPacks(),
}
