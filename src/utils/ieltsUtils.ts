import type {
  Question,
  ReadingAnalysisReport,
  ReadingLocationInsight,
  ReadingQuestionResult,
  ReadingSectionSummary,
  ReadingTypeInsight,
  Section,
} from '../types/ieltsTypes'

type RawAnswer = string | number | string[] | null | undefined

const OPTION_CODE_PATTERN = /^([a-z0-9]+)\s*(?:[.)\]:-])(?:\s|$)/i
const ANSWER_SEPARATOR_PATTERN = /\s*(?:\||;|\/)\s*/

const NUMBER_WORD_MAP: Record<string, string> = {
  zero: '0',
  one: '1',
  two: '2',
  three: '3',
  four: '4',
  five: '5',
  six: '6',
  seven: '7',
  eight: '8',
  nine: '9',
  ten: '10',
  eleven: '11',
  twelve: '12',
}

const QUESTION_TYPE_LABELS: Record<Question['type'], string> = {
  'multiple-choice': 'Multiple Choice',
  'true-false-not-given': 'True / False / Not Given',
  'yes-no-not-given': 'Yes / No / Not Given',
  'matching-headings': 'Matching Headings',
  'matching-information': 'Matching Information',
  'summary-completion': 'Summary Completion',
  'note-completion': 'Note Completion',
  'short-answer': 'Short Answer',
  'five-true-statements': 'Five True Statements',
  'drag-drop-summary': 'Drag-and-Drop Summary',
}

export const calculateBandScore = (correctCount: number): number => {
  if (correctCount >= 39) return 9.0
  if (correctCount >= 37) return 8.5
  if (correctCount >= 35) return 8.0
  if (correctCount >= 32) return 7.5
  if (correctCount >= 30) return 7.0
  if (correctCount >= 27) return 6.5
  if (correctCount >= 23) return 6.0
  if (correctCount >= 19) return 5.5
  if (correctCount >= 15) return 5.0
  if (correctCount >= 12) return 4.5
  if (correctCount >= 9) return 4.0
  if (correctCount >= 7) return 3.5
  if (correctCount >= 5) return 3.0
  if (correctCount >= 3) return 2.5
  return 2.0
}

export const formatQuestionTypeLabel = (type: Question['type']): string => {
  return QUESTION_TYPE_LABELS[type] ?? type
}

export const extractParagraphLabel = (location?: string): string | undefined => {
  if (!location) return undefined
  const match = location.match(/paragraph\s*([a-z0-9]+)/i)
  if (!match?.[1]) return undefined
  return match[1].toUpperCase()
}

export const formatQuestionNumberRange = (numbers: number[]): string => {
  if (!numbers.length) return '-'
  if (numbers.length === 1) return String(numbers[0])
  return `${numbers[0]}-${numbers[numbers.length - 1]}`
}

export const checkAnswer = (
  userAnswer: string | number | string[] | undefined,
  correctAnswer: string | string[],
  options?: string[],
  strictAnswerMatch = false,
): boolean | number => {
  if (Array.isArray(correctAnswer)) {
    const userSelections = Array.isArray(userAnswer) ? userAnswer : []
    const normalizedCorrect = new Set(
      correctAnswer
        .map((entry) => normalizeSelectionValue(String(entry)))
        .filter((entry) => entry.length > 0),
    )
    const normalizedUser = new Set(
      userSelections
        .map((entry) => normalizeSelectionValue(String(entry)))
        .filter((entry) => entry.length > 0),
    )

    let correctCount = 0
    normalizedUser.forEach((value) => {
      if (normalizedCorrect.has(value)) {
        correctCount += 1
      }
    })
    const wrongCount = Math.max(0, normalizedUser.size - correctCount)
    return clamp(correctCount - wrongCount, 0, normalizedCorrect.size)
  }

  if (isSkipped(userAnswer)) return false

  const correctCandidates = splitAnswerCandidates(correctAnswer)
  const userCandidates = toUserCandidates(userAnswer, options)

  return userCandidates.some((candidate) =>
    correctCandidates.some((expected) => strictAnswerMatch
      ? normalizeText(candidate) === normalizeText(expected)
      : areEquivalentAnswers(candidate, expected)),
  )
}

export const evaluateReadingAnswers = (
  sections: Section[],
  answers: Record<string, RawAnswer>,
): ReadingAnalysisReport => {
  const questionResults: ReadingQuestionResult[] = []
  const sectionSummaries: ReadingSectionSummary[] = []
  const locationMap = new Map<
    string,
    {
      sectionId: string
      sectionTitle: string
      partNumber: number
      paragraphLabel: string
      questionNumbers: Set<number>
      correctNumbers: Set<number>
      incorrectNumbers: Set<number>
      skippedNumbers: Set<number>
    }
  >()

  for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex += 1) {
    const section = sections[sectionIndex]
    const partNumber = sectionIndex + 1
    const sectionQuestionResults: ReadingQuestionResult[] = []
    let sectionTotal = 0
    let sectionCorrect = 0
    let sectionSkipped = 0
    const multiChoiceScores = new Map<string, number>()

    // Listening's numbered slots share an unordered answer pool. Each correct
    // choice earns one mark, including when the other choice is wrong or empty.
    for (const group of section.groups ?? []) {
      for (const block of group.blocks) {
        if (block.kind !== 'multi-mcq') continue
        const questions = block.blanks
          .map((number) => section.questions.find((question) => question.number === number))
          .filter((question): question is Question => Boolean(question))
        const remainingChoices = new Set(questions.flatMap((question) =>
          (Array.isArray(question.correctAnswer)
            ? question.correctAnswer
            : splitAnswerCandidates(question.correctAnswer)
          ).map(normalizeSelectionValue),
        ))
        for (const question of questions) {
          const candidates = toUserCandidates(answers[question.id], question.options)
          const match = [...remainingChoices].find((expected) =>
            candidates.some((candidate) => areEquivalentAnswers(candidate, expected)),
          )
          multiChoiceScores.set(question.id, match === undefined ? 0 : 1)
          if (match !== undefined) remainingChoices.delete(match)
        }
      }
    }

    for (const question of section.questions) {
      const userAnswer = answers[question.id]
      const questionNumbers = getQuestionNumbers(question)
      const maxScore = Math.max(1, questionNumbers.length)
      const skipped = isSkipped(userAnswer)

      let score = 0
      if (!skipped) {
        if (multiChoiceScores.has(question.id)) {
          score = multiChoiceScores.get(question.id)!
        } else if (question.type === 'drag-drop-summary' && Array.isArray(question.correctAnswer)) {
          score = evaluateOrderedSlotScore(userAnswer, question.correctAnswer)
        } else {
          const checked = checkAnswer(
            userAnswer as string | number | string[] | undefined,
            question.correctAnswer,
            question.options,
            question.strictAnswerMatch,
          )
          score =
            typeof checked === 'number' ? clamp(checked, 0, maxScore) : checked ? maxScore : 0
        }
      }

      const status =
        skipped ? 'skipped' : score >= maxScore ? 'correct' : 'incorrect'
      const paragraphLabel = extractParagraphLabel(question.location)

      const questionResult: ReadingQuestionResult = {
        questionId: question.id,
        questionType: question.type,
        sectionId: section.id,
        sectionTitle: section.title,
        partNumber,
        questionNumbers,
        displayNumber: formatQuestionNumberRange(questionNumbers),
        prompt: question.text,
        location: question.location,
        paragraphLabel,
        userAnswer: userAnswer as string | number | string[] | undefined,
        correctAnswer: question.correctAnswer,
        score,
        maxScore,
        status,
      }

      questionResults.push(questionResult)
      sectionQuestionResults.push(questionResult)

      sectionTotal += maxScore
      sectionCorrect += score
      sectionSkipped += skipped ? maxScore : 0

      if (paragraphLabel) {
        const mapKey = `${section.id}::${paragraphLabel}`
        const current =
          locationMap.get(mapKey) ??
          {
            sectionId: section.id,
            sectionTitle: section.title,
            partNumber,
            paragraphLabel,
            questionNumbers: new Set<number>(),
            correctNumbers: new Set<number>(),
            incorrectNumbers: new Set<number>(),
            skippedNumbers: new Set<number>(),
          }

        questionNumbers.forEach((number) => {
          current.questionNumbers.add(number)
          if (status === 'correct') current.correctNumbers.add(number)
          if (status === 'incorrect') current.incorrectNumbers.add(number)
          if (status === 'skipped') current.skippedNumbers.add(number)
        })

        locationMap.set(mapKey, current)
      }
    }

    const sectionIncorrect = Math.max(0, sectionTotal - sectionCorrect - sectionSkipped)
    const sectionSummary: ReadingSectionSummary = {
      sectionId: section.id,
      sectionTitle: section.title,
      partNumber,
      totalQuestions: sectionTotal,
      correctAnswers: sectionCorrect,
      incorrectAnswers: sectionIncorrect,
      skippedAnswers: sectionSkipped,
      accuracy: toPercent(sectionCorrect, sectionTotal),
      questions: sectionQuestionResults,
    }

    sectionSummaries.push(sectionSummary)
  }

  const totalQuestions = sectionSummaries.reduce((sum, item) => sum + item.totalQuestions, 0)
  const correctAnswers = sectionSummaries.reduce((sum, item) => sum + item.correctAnswers, 0)
  const skippedAnswers = sectionSummaries.reduce((sum, item) => sum + item.skippedAnswers, 0)
  const incorrectAnswers = Math.max(0, totalQuestions - correctAnswers - skippedAnswers)

  const typeMap = new Map<
    Question['type'],
    {
      type: Question['type']
      label: string
      totalQuestions: number
      correctAnswers: number
      skippedAnswers: number
    }
  >()

  questionResults.forEach((result) => {
    const current =
      typeMap.get(result.questionType) ??
      {
        type: result.questionType,
        label: formatQuestionTypeLabel(result.questionType),
        totalQuestions: 0,
        correctAnswers: 0,
        skippedAnswers: 0,
      }

    current.totalQuestions += result.maxScore
    current.correctAnswers += result.score
    if (result.status === 'skipped') {
      current.skippedAnswers += result.maxScore
    }

    typeMap.set(result.questionType, current)
  })

  const typeInsights: ReadingTypeInsight[] = Array.from(typeMap.values())
    .map((entry) => {
      const incorrect = Math.max(
        0,
        entry.totalQuestions - entry.correctAnswers - entry.skippedAnswers,
      )

      return {
        type: entry.type,
        label: entry.label,
        totalQuestions: entry.totalQuestions,
        correctAnswers: entry.correctAnswers,
        incorrectAnswers: incorrect,
        skippedAnswers: entry.skippedAnswers,
        accuracy: toPercent(entry.correctAnswers, entry.totalQuestions),
      }
    })
    .sort((a, b) => b.incorrectAnswers - a.incorrectAnswers || a.label.localeCompare(b.label))

  const locationInsights: ReadingLocationInsight[] = Array.from(locationMap.values())
    .map((entry) => ({
      sectionId: entry.sectionId,
      sectionTitle: entry.sectionTitle,
      partNumber: entry.partNumber,
      paragraphLabel: entry.paragraphLabel,
      questionNumbers: sortNumbers(entry.questionNumbers),
      correctQuestionNumbers: sortNumbers(entry.correctNumbers),
      incorrectQuestionNumbers: sortNumbers(entry.incorrectNumbers),
      skippedQuestionNumbers: sortNumbers(entry.skippedNumbers),
    }))
    .sort((a, b) => {
      if (a.partNumber !== b.partNumber) return a.partNumber - b.partNumber
      return compareParagraphLabels(a.paragraphLabel, b.paragraphLabel)
    })

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalQuestions,
      correctAnswers,
      incorrectAnswers,
      skippedAnswers,
      accuracy: toPercent(correctAnswers, totalQuestions),
    },
    sectionSummaries,
    questionResults,
    locationInsights,
    typeInsights,
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function isSkipped(answer: RawAnswer): boolean {
  if (answer === undefined || answer === null) return true
  if (typeof answer === 'string') return answer.trim().length === 0
  if (Array.isArray(answer)) {
    if (answer.length === 0) return true
    return answer.every((entry) => String(entry ?? '').trim().length === 0)
  }
  return false
}

function evaluateOrderedSlotScore(userAnswer: RawAnswer, correctAnswer: string[]): number {
  if (!Array.isArray(correctAnswer) || correctAnswer.length === 0) return 0
  const userSlots = Array.isArray(userAnswer) ? userAnswer : []

  let score = 0
  for (let index = 0; index < correctAnswer.length; index += 1) {
    const expected = normalizeSelectionValue(String(correctAnswer[index]))
    const actual = normalizeSelectionValue(String(userSlots[index] ?? ''))
    if (expected && actual && expected === actual) {
      score += 1
    }
  }

  return score
}

function normalizeText(input: string): string {
  const cleaned = input
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['"`]/g, '')
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!cleaned) return ''

  return cleaned
    .split(' ')
    .map((token) => NUMBER_WORD_MAP[token] ?? token)
    .join(' ')
}

function extractOptionCode(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  const withDelimiter = trimmed.match(OPTION_CODE_PATTERN)
  if (withDelimiter?.[1]) {
    return withDelimiter[1].toLowerCase()
  }

  if (/^[a-z0-9]{1,6}$/i.test(trimmed)) {
    return trimmed.toLowerCase()
  }

  return null
}

function normalizeSelectionValue(input: string): string {
  const code = extractOptionCode(input)
  return code ?? normalizeText(input)
}

function splitAnswerCandidates(correctAnswer: string): string[] {
  const trimmed = correctAnswer.trim()
  if (!trimmed) return []

  const split = trimmed
    .split(ANSWER_SEPARATOR_PATTERN)
    .map((entry) => entry.trim())
    .filter(Boolean)

  return split.length ? split : [trimmed]
}

function toUserCandidates(userAnswer: RawAnswer, options?: string[]): string[] {
  if (userAnswer === undefined || userAnswer === null) return []

  if (typeof userAnswer === 'number') {
    const candidates: string[] = []
    if (options && options[userAnswer] !== undefined) {
      candidates.push(String(options[userAnswer]))
    }
    const label = userAnswer >= 0 ? String.fromCharCode(65 + userAnswer) : ''
    if (label) candidates.push(label)
    return candidates
  }

  if (Array.isArray(userAnswer)) {
    return userAnswer.map((entry) => String(entry))
  }

  return [String(userAnswer)]
}

function toComparableTokens(input: string): Set<string> {
  const tokens = new Set<string>()
  const normalized = normalizeText(input)
  if (normalized) {
    tokens.add(normalized)
    const firstToken = normalized.split(' ')[0]
    if (firstToken) tokens.add(firstToken)
  }

  const code = extractOptionCode(input)
  if (code) tokens.add(code)

  return tokens
}

function areEquivalentAnswers(userInput: string, expectedInput: string): boolean {
  const userTokens = toComparableTokens(userInput)
  const expectedTokens = toComparableTokens(expectedInput)

  for (const token of userTokens) {
    if (expectedTokens.has(token)) return true
  }

  const userNormalized = normalizeText(userInput)
  const expectedNormalized = normalizeText(expectedInput)

  if (userNormalized && expectedNormalized) {
    if (userNormalized === expectedNormalized) return true
    if (userNormalized.length <= 8 && expectedNormalized.startsWith(`${userNormalized} `)) return true
    if (expectedNormalized.length <= 8 && userNormalized.startsWith(`${expectedNormalized} `)) return true
  }

  return false
}

function getQuestionNumbers(question: Question): number[] {
  const baseNumber = question.number
  const slotCount =
    (question.type === 'five-true-statements' || question.type === 'drag-drop-summary') &&
    Array.isArray(question.correctAnswer)
      ? Math.max(1, question.correctAnswer.length)
      : 1

  return Array.from({ length: slotCount }, (_, index) => baseNumber + index)
}

function toPercent(value: number, total: number): number {
  if (!total) return 0
  return Number(((value / total) * 100).toFixed(1))
}

function sortNumbers(values: Set<number>): number[] {
  return Array.from(values).sort((a, b) => a - b)
}

function compareParagraphLabels(a: string, b: string): number {
  const numberA = Number(a)
  const numberB = Number(b)

  const aIsNumber = !Number.isNaN(numberA)
  const bIsNumber = !Number.isNaN(numberB)

  if (aIsNumber && bIsNumber) return numberA - numberB
  if (aIsNumber) return -1
  if (bIsNumber) return 1
  return a.localeCompare(b)
}

export interface ReadingDiagnosticInsight {
  headline: string
  detail: string
  severity: 'low' | 'medium' | 'high'
}

const WORD_LIMIT_MAP: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
}

function parseWordLimit(instruction?: string): number | null {
  if (!instruction) return null
  const match = instruction.match(/NO MORE THAN\s+([A-Z0-9]+)\s+WORDS?/i)
  if (!match?.[1]) return null
  const token = match[1].toLowerCase()
  const numeric = Number(token)
  if (!Number.isNaN(numeric)) return numeric
  return WORD_LIMIT_MAP[token] ?? null
}

function countWords(value: string): number {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

function stringifyAnswer(answer: string | string[]): string {
  return Array.isArray(answer) ? answer.join(', ') : answer
}

function normalizedComparable(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function inferReadingDiagnosticInsight(
  result: ReadingQuestionResult,
  question?: Question,
): ReadingDiagnosticInsight {
  if (result.status === 'correct') {
    return {
      headline: 'Accurate response',
      detail: 'Answer format and passage evidence align correctly.',
      severity: 'low',
    }
  }

  if (result.status === 'skipped') {
    return {
      headline: 'Question left blank',
      detail:
        'No response was recorded. Add a final 2-3 minute unanswered scan before submission.',
      severity: 'high',
    }
  }

  const userAnswerText = formatUserAnswerForDiagnostic(result.userAnswer, question?.options)
  const correctAnswerText = stringifyAnswer(result.correctAnswer)
  const userNormalized = normalizedComparable(userAnswerText)
  const correctNormalized = normalizedComparable(correctAnswerText)
  const wordLimit = parseWordLimit(question?.instruction)

  if (wordLimit && userAnswerText !== 'Skipped' && countWords(userAnswerText) > wordLimit) {
    return {
      headline: 'Format rule mismatch',
      detail: `Your answer exceeds the "${wordLimit} word" limit required by the instruction.`,
      severity: 'high',
    }
  }

  if (
    (result.questionType === 'multiple-choice' ||
      result.questionType === 'matching-headings' ||
      result.questionType === 'matching-information' ||
      result.questionType === 'five-true-statements' ||
      result.questionType === 'drag-drop-summary') &&
    userAnswerText !== 'Skipped'
  ) {
    return {
      headline: 'Distractor selected',
      detail:
        'The selected option likely matched a nearby keyword but not the core idea from the passage evidence.',
      severity: 'medium',
    }
  }

  if (
    (result.questionType === 'summary-completion' ||
      result.questionType === 'note-completion' ||
      result.questionType === 'short-answer') &&
    userAnswerText !== 'Skipped'
  ) {
    const hasPartialOverlap =
      userNormalized.length > 2 &&
      correctNormalized.length > 2 &&
      (userNormalized.includes(correctNormalized) ||
        correctNormalized.includes(userNormalized) ||
        userNormalized.split(' ').some((token) => token.length > 2 && correctNormalized.includes(token)))

    if (hasPartialOverlap) {
      return {
        headline: 'Close but imprecise wording',
        detail:
          'Your answer is near the target phrase, but key wording/order did not match the accepted answer.',
        severity: 'medium',
      }
    }

    return {
      headline: 'Evidence-word mismatch',
      detail:
        'Important keyword(s) from the passage were missed. Re-read the linked paragraph and match exact phrasing.',
      severity: 'high',
    }
  }

  if (
    result.questionType === 'true-false-not-given' ||
    result.questionType === 'yes-no-not-given'
  ) {
    return {
      headline: 'Claim polarity confusion',
      detail:
        'The statement polarity was misread. Separate "stated opposite" from "not mentioned" before choosing.',
      severity: 'high',
    }
  }

  return {
    headline: 'Evidence alignment issue',
    detail:
      'Your response did not match the required evidence point for this question. Re-check paragraph mapping first.',
    severity: 'medium',
  }
}

function formatUserAnswerForDiagnostic(answer: RawAnswer, options?: string[]): string {
  if (answer === undefined || answer === null || answer === '') return 'Skipped'
  if (Array.isArray(answer)) return answer.join(', ')
  if (typeof answer === 'number' && options?.[answer]) {
    const label = String.fromCharCode(65 + answer)
    return `${label}. ${options[answer]}`
  }
  return String(answer)
}

