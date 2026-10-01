import type { Question } from '../types/ieltsTypes'

// Require a complete label so unlabelled answers retain their first letter
// and their first word in the test and saved-answer review.
export function optionDisplayText(option: string, options?: string[]): string {
  const text = option.replace(/^(?:[A-Z]|[ivx]+|\d+)\s*[.)]\s+/i, '').trim()
  const hasSpaceLabels = options?.every((candidate, index) => candidate.startsWith(`${String.fromCharCode(65 + index)} `))
  return hasSpaceLabels ? text.replace(/^[A-Z]\s+/, '') : text
}

export function readingQuestionGroups(questions: Question[]): Question[][] {
  const groups: Question[][] = []
  let title: string | undefined
  for (const question of questions) {
    const group = groups[groups.length - 1]
    const previous = group?.[group.length - 1]
    if (!previous || question.type !== previous.type || (question.groupTitle && question.groupTitle !== title)) {
      groups.push([])
      title = question.groupTitle
    }
    groups[groups.length - 1].push(question)
  }
  return groups
}
