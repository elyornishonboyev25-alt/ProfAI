import type { Question } from '@/types/ieltsTypes'

/** Multi-answer cards still represent multiple numbered answer-sheet slots. */
export function getQuestionSlotCount(question: Pick<Question, 'type' | 'correctAnswer'>): number {
  return (question.type === 'five-true-statements' || question.type === 'drag-drop-summary') && Array.isArray(question.correctAnswer)
    ? Math.max(1, question.correctAnswer.length) : 1
}
