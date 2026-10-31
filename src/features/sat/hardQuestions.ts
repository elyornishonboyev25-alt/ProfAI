import { allQuestions, type QuestionRow } from './bankPractice'
import { accountStorageFor } from '@/utils/accountStorage'
import type { HighlightStroke, SATSection } from './practiceTest4'

// Use the catalog's reviewed Question Bank taxonomy and Advanced rating.
// Round-robin selection covers every skill instead of letting large topics dominate.
export function selectHardQuestions(section: SATSection): QuestionRow[] {
  const groups = new Map<string, QuestionRow[]>()
  const seen = new Set<string>()
  allQuestions.filter(({ question, testNumber }) =>
    testNumber >= 10 && question.section === section && question.difficulty === 'Advanced' &&
    question.sourceContent?.explanation.trim() && question.correctAnswer.trim(),
  ).sort((a, b) => a.key.localeCompare(b.key, 'en')).forEach((row) => {
    const fingerprint = JSON.stringify([row.question.sourceContent?.context, row.question.sourceContent?.task, row.question.choices])
    if (seen.has(fingerprint)) return
    seen.add(fingerprint)
    const list = groups.get(row.question.skill) ?? []
    list.push(row)
    groups.set(row.question.skill, list)
  })
  const ordered = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b, 'en'))
  const selected: QuestionRow[] = []
  for (let round = 0; selected.length < 100; round++) {
    let added = false
    for (const [, rows] of ordered) {
      if (rows[round] && selected.length < 100) { selected.push(rows[round]); added = true }
    }
    if (!added) throw new Error(`Not enough reviewed hard SAT questions for ${section}`)
  }
  return selected.sort((a, b) => a.question.skill.localeCompare(b.question.skill, 'en') || a.key.localeCompare(b.key, 'en'))
}
export const HARD_QUESTIONS = {
  'reading-writing': selectHardQuestions('reading-writing'),
  math: selectHardQuestions('math'),
}
export type PracticeLevel = 'easy' | 'medium' | 'hard'
export const practiceLevel = (rating: string): PracticeLevel => rating === 'Foundation' ? 'easy' : rating === 'Advanced' ? 'hard' : 'medium'

// Keep the original hard collection stable so saved links and answers still match.
// Additional levels use reviewed source questions, with balanced topic coverage.
function selectLevel(section: SATSection, level: PracticeLevel): QuestionRow[] {
  if (level === 'hard') return HARD_QUESTIONS[section]
  const groups = new Map<string, QuestionRow[]>()
  const seen = new Set<string>()
  allQuestions.filter(row => row.testNumber >= 10 && row.question.section === section && practiceLevel(row.question.difficulty) === level &&
    row.question.correctAnswer.trim() && row.question.sourceContent?.explanation.trim())
    .sort((a, b) => a.key.localeCompare(b.key, 'en')).forEach(row => {
      const fingerprint = JSON.stringify([row.question.sourceContent?.context, row.question.sourceContent?.task, row.question.choices])
      if (seen.has(fingerprint)) return
      seen.add(fingerprint)
      groups.set(row.question.skill, [...(groups.get(row.question.skill) ?? []), row])
    })
  const ordered = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b, 'en'))
  const selected: QuestionRow[] = []
  for (let round = 0; selected.length < 100; round++) {
    let added = false
    for (const [, rows] of ordered) {
      if (rows[round] && selected.length < 100) { selected.push(rows[round]); added = true }
    }
    if (!added) break
  }
  return selected.sort((a, b) => a.question.skill.localeCompare(b.question.skill, 'en') || a.key.localeCompare(b.key, 'en'))
}
export const PRACTICE_QUESTIONS = Object.fromEntries((['reading-writing', 'math'] as const).map(section => [section,
  [...selectLevel(section, 'easy'), ...selectLevel(section, 'medium'), ...selectLevel(section, 'hard')]
    .sort((a, b) => a.question.skill.localeCompare(b.question.skill, 'en') || a.key.localeCompare(b.key, 'en')),
])) as Record<SATSection, QuestionRow[]>

export type PracticeAttempt = { answer: string; correct: boolean; at: string; seconds: number }
export type QuestionProgress = {
  answer: string; checked: boolean; bookmarked: boolean; flagged?: boolean
  elapsedSeconds?: number; eliminatedChoices?: string[]; highlights?: HighlightStroke[]
  attempts?: PracticeAttempt[]
}
export type HardProgress = Record<string, QuestionProgress>
export const hardProgressKey = 'profai:sat:hard-questions:v1'
export function loadHardProgress(userId: string): HardProgress {
  try {
    const data = JSON.parse(accountStorageFor(userId).getItem(hardProgressKey) ?? '{}')
    if (!data || typeof data !== 'object' || Array.isArray(data)) return {}
    const keys = new Set(Object.values(PRACTICE_QUESTIONS).flat().map(row => row.key))
    return Object.fromEntries(Object.entries(data).flatMap(([key, value]) => {
      const row = value as HardProgress[string] | null
      if (!keys.has(key) || !row || typeof row.answer !== 'string' ||
        typeof row.checked !== 'boolean' || typeof row.bookmarked !== 'boolean' || (row.checked && !row.answer.trim())) return []
      return [[key, { answer: row.answer, checked: row.checked, bookmarked: row.bookmarked, flagged: row.flagged === true,
        elapsedSeconds: Number.isFinite(row.elapsedSeconds) ? Math.max(0, Number(row.elapsedSeconds)) : 0,
        eliminatedChoices: Array.isArray(row.eliminatedChoices) ? row.eliminatedChoices.filter(key => typeof key === 'string' && /^[A-D]$/.test(key)) : [],
        highlights: Array.isArray(row.highlights) ? row.highlights.filter(mark => mark && typeof mark.id === 'string' && mark.textRange && typeof mark.textRange.text === 'string' && Number.isInteger(mark.textRange.start) && mark.textRange.start >= 0 && mark.textRange.end > mark.textRange.start && mark.textRange.end - mark.textRange.start === mark.textRange.text.length) : [],
        attempts: Array.isArray(row.attempts) ? row.attempts.filter(attempt => attempt && typeof attempt.answer === 'string' && typeof attempt.correct === 'boolean' && Number.isFinite(Date.parse(attempt.at)) && Number.isFinite(attempt.seconds) && attempt.seconds >= 0).slice(-30) : [],
      }]]
    })) as HardProgress
  } catch { return {} }
}
