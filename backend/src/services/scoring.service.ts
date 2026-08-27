import { Difficulty } from '@prisma/client'

type QuestionInput = {
  id: string
  weight: number
  options: Array<{
    id: string
    isCorrect: boolean
  }>
}

type AnswerInput = {
  questionId: string
  optionId: string | null
}

export type ComputedAnswer = {
  questionId: string
  selectedOptionId: string | null
  correctOptionId: string | null
  isCorrect: boolean
  weight: number
}

export type ScoreComputationResult = {
  totalQuestions: number
  correctAnswers: number
  rawScore: number
  weightedScore: number
  percentage: number
  timeBonus: number
  finalScore: number
  timeEfficiency: number
  baseXp: number
  computedAnswers: ComputedAnswer[]
}

const BASE_XP_BY_DIFFICULTY: Record<Difficulty, number> = {
  EASY: 45,
  MEDIUM: 75,
  HARD: 110,
}

export function calculateAttemptScore(params: {
  difficulty: Difficulty
  durationSec: number
  timeSpentSec: number
  questions: QuestionInput[]
  answers: AnswerInput[]
  xpRewardOverride?: number | null
}): ScoreComputationResult {
  const answerMap = new Map(params.answers.map((answer) => [answer.questionId, answer.optionId]))

  const totalQuestions = params.questions.length
  const totalWeight = params.questions.reduce((acc, question) => acc + question.weight, 0)

  let correctAnswers = 0
  let weightedCorrect = 0

  const computedAnswers = params.questions.map((question) => {
    const correctOptionId = question.options.find((option) => option.isCorrect)?.id ?? null
    const selectedOptionId = answerMap.get(question.id) ?? null
    const isCorrect = question.options.some((option) => option.id === selectedOptionId && option.isCorrect)

    if (isCorrect) {
      correctAnswers += 1
      weightedCorrect += question.weight
    }

    return {
      questionId: question.id,
      selectedOptionId,
      correctOptionId,
      isCorrect,
      weight: question.weight,
    }
  })

  const rawScore = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0
  const weightedScore = totalWeight > 0 ? (weightedCorrect / totalWeight) * 100 : 0
  const percentage = weightedScore

  const safeDuration = Math.max(1, params.durationSec)
  const boundedTimeSpent = Math.max(0, Math.min(params.timeSpentSec, safeDuration))
  const timeEfficiency = Math.max(0, safeDuration - boundedTimeSpent) / safeDuration
  const timeBonus = Math.min(5, timeEfficiency * 10)

  const finalScore = Math.max(0, Math.min(100, weightedScore + timeBonus))

  return {
    totalQuestions,
    correctAnswers,
    rawScore,
    weightedScore,
    percentage,
    timeBonus,
    finalScore,
    timeEfficiency,
    baseXp: params.xpRewardOverride ?? BASE_XP_BY_DIFFICULTY[params.difficulty],
    computedAnswers,
  }
}
