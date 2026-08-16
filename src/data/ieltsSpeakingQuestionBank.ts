import {
  CUE_CARDS as BASE_CUE_CARDS,
  PART1_TOPICS as BASE_PART1_TOPICS,
  PART3_THEMES as BASE_PART3_THEMES,
  PART_LABELS,
  pickRandom,
  type Part1Topic,
  type Part2Card,
  type Part3Theme,
} from '@/data/ieltsSpeakingBank'
import {
  EXTRA_CUE_CARDS,
  EXTRA_PART1_TOPICS,
  EXTRA_PART3_THEMES,
} from '@/data/ieltsSpeakingBankExtra'

/**
 * The single source of truth for IELTS Speaking content used across the app.
 * Keep the base/extra split for manageable source files, but never import those
 * arrays directly from a feature. This module also rejects duplicate prompts and
 * malformed sets as soon as the bank is loaded.
 */
export const PART1_TOPICS: readonly Part1Topic[] = [
  ...BASE_PART1_TOPICS,
  ...EXTRA_PART1_TOPICS,
]

export const CUE_CARDS: readonly Part2Card[] = [
  ...BASE_CUE_CARDS,
  ...EXTRA_CUE_CARDS,
]

export const PART3_THEMES: readonly Part3Theme[] = [
  ...BASE_PART3_THEMES,
  ...EXTRA_PART3_THEMES,
]

export { PART_LABELS, pickRandom }
export type { Part1Topic, Part2Card, Part3Theme }

export type IeltsSpeakingBankStats = {
  part1Topics: number
  part1Questions: number
  part2Cards: number
  part3Themes: number
  part3Questions: number
}

const MINIMUM_SETS_PER_PART = 30

function normalizePrompt(value: string): string {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9']+/g, ' ')
    .trim()
}

function assertUniqueIds(label: string, items: readonly { id: string }[]) {
  const seen = new Set<string>()
  for (const item of items) {
    if (!item.id.trim()) throw new Error(`${label} contains an empty id.`)
    if (seen.has(item.id)) throw new Error(`${label} contains duplicate id "${item.id}".`)
    seen.add(item.id)
  }
}

function validateQuestionBank(): IeltsSpeakingBankStats {
  if (PART1_TOPICS.length < MINIMUM_SETS_PER_PART) {
    throw new Error(`IELTS Speaking Part 1 requires at least ${MINIMUM_SETS_PER_PART} topics.`)
  }
  if (CUE_CARDS.length < MINIMUM_SETS_PER_PART) {
    throw new Error(`IELTS Speaking Part 2 requires at least ${MINIMUM_SETS_PER_PART} cue cards.`)
  }
  if (PART3_THEMES.length < MINIMUM_SETS_PER_PART) {
    throw new Error(`IELTS Speaking Part 3 requires at least ${MINIMUM_SETS_PER_PART} themes.`)
  }

  assertUniqueIds('IELTS Speaking Part 1', PART1_TOPICS)
  assertUniqueIds('IELTS Speaking Part 2', CUE_CARDS)
  assertUniqueIds('IELTS Speaking Part 3', PART3_THEMES)

  const seenPrompts = new Map<string, string>()
  const registerPrompt = (location: string, prompt: string) => {
    const normalized = normalizePrompt(prompt)
    if (!normalized) throw new Error(`${location} contains an empty prompt.`)
    const existing = seenPrompts.get(normalized)
    if (existing) {
      throw new Error(`Duplicate IELTS Speaking question found in ${existing} and ${location}.`)
    }
    seenPrompts.set(normalized, location)
  }

  for (const topic of PART1_TOPICS) {
    if (topic.questions.length < 4) {
      throw new Error(`Part 1 topic "${topic.id}" must contain at least four questions.`)
    }
    topic.questions.forEach((question, index) => {
      if (!question.sample.trim()) throw new Error(`Part 1 ${topic.id} question ${index + 1} has no sample answer.`)
      registerPrompt(`Part 1/${topic.id}/${index + 1}`, question.q)
    })
  }

  for (const card of CUE_CARDS) {
    if (card.bullets.length !== 4 || card.bullets.some((bullet) => !bullet.trim())) {
      throw new Error(`Part 2 cue card "${card.id}" must contain exactly four speaking points.`)
    }
    if (!card.sample.trim()) throw new Error(`Part 2 cue card "${card.id}" has no sample answer.`)
    registerPrompt(`Part 2/${card.id}`, card.title)
    registerPrompt(`Part 2/${card.id}/follow-up`, card.followUp)
  }

  for (const theme of PART3_THEMES) {
    if (theme.questions.length < 4) {
      throw new Error(`Part 3 theme "${theme.id}" must contain at least four questions.`)
    }
    theme.questions.forEach((question, index) => {
      if (!question.sample.trim()) throw new Error(`Part 3 ${theme.id} question ${index + 1} has no sample answer.`)
      registerPrompt(`Part 3/${theme.id}/${index + 1}`, question.q)
    })
  }

  return {
    part1Topics: PART1_TOPICS.length,
    part1Questions: PART1_TOPICS.reduce((total, topic) => total + topic.questions.length, 0),
    part2Cards: CUE_CARDS.length,
    part3Themes: PART3_THEMES.length,
    part3Questions: PART3_THEMES.reduce((total, theme) => total + theme.questions.length, 0),
  }
}

export const IELTS_SPEAKING_BANK_STATS = validateQuestionBank()
