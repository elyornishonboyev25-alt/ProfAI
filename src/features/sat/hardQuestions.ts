import { allQuestions, type QuestionRow } from './bankPractice'
import { accountStorageFor } from '@/utils/accountStorage'
import type { SATSection } from './practiceTest4'

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
export type HardProgress = Record<string, { answer: string; checked: boolean; bookmarked: boolean }>
export const hardProgressKey = 'profai:sat:hard-questions:v1'
export function loadHardProgress(userId: string): HardProgress {
  try {
    const data = JSON.parse(accountStorageFor(userId).getItem(hardProgressKey) ?? '{}')
    if (!data || typeof data !== 'object' || Array.isArray(data)) return {}
    const keys = new Set(Object.values(HARD_QUESTIONS).flat().map(row => row.key))
    return Object.fromEntries(Object.entries(data).filter(([key, value]) => {
      const row = value as HardProgress[string] | null
      return keys.has(key) && row && typeof row.answer === 'string' &&
        typeof row.checked === 'boolean' && typeof row.bookmarked === 'boolean' && (!row.checked || row.answer.trim())
    })) as HardProgress
  } catch { return {} }
}
