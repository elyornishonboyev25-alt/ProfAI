import type { University, QSIndicators, AdmissionLesson, LessonPhase } from './types'
import { universities } from './universities'
import { QS_2027_TOP_50_IDS } from './qs2027Rankings'
import { QS_2027_RANKED_UNIVERSITY_COUNT } from './qs2027Universities'
import { lessons, lessonPhases } from './lessons'

export type {
  University,
  QSIndicators,
  AdmissionRequirement,
  CostOfLiving,
  StudentBody,
  Campus,
  UniversityBrand,
  UniversitySource,
  AdmissionLesson,
  LessonBlock,
  LessonLevel,
  LessonPhase,
} from './types'

export { universities, QS_EDITION } from './universities'
export { lessons, lessonPhases } from './lessons'

export const LESSON_COUNT = lessons.length
export const UNIVERSITY_COUNT = universities.length
export const QS_TOP_50_COUNT = universities.filter((university) => university.groups?.includes('qs-top-50')).length
export { QS_2027_RANKED_UNIVERSITY_COUNT }

function validateUniversityCatalog() {
  const ids = new Set<string>()
  const slugs = new Set<string>()

  for (const university of universities) {
    if (ids.has(university.id)) throw new Error(`Duplicate university id: ${university.id}`)
    if (slugs.has(university.slug)) throw new Error(`Duplicate university slug: ${university.slug}`)
    ids.add(university.id)
    slugs.add(university.slug)
  }

  const top50 = universities.filter((university) => university.groups?.includes('qs-top-50'))
  if (
    QS_2027_TOP_50_IDS.size !== 50 ||
    top50.length !== 50 ||
    top50.some(
      (university) =>
        !QS_2027_TOP_50_IDS.has(university.id) ||
        typeof university.rank !== 'number' ||
        university.rank > 50 ||
        typeof university.overallScore !== 'number',
    )
  ) {
    throw new Error('QS 2027 top-50 catalog must contain exactly 50 ranked universities')
  }

  const rankCounts = new Map<number, number>()
  for (const university of top50) {
    rankCounts.set(university.rank!, (rankCounts.get(university.rank!) ?? 0) + 1)
  }
  if (top50.some((university) => university.rankTied !== ((rankCounts.get(university.rank!) ?? 0) > 1))) {
    throw new Error('QS 2027 tied-rank markers do not match the catalog positions')
  }

  const ranked = universities.filter((university) => typeof university.rank === 'number')
  if (ranked.length !== QS_2027_RANKED_UNIVERSITY_COUNT) {
    throw new Error(`QS 2027 catalog must contain exactly ${QS_2027_RANKED_UNIVERSITY_COUNT} ranked universities`)
  }

  if (
    top50.some((university) => {
      const requirements = university.admission?.bachelor ?? []
      return !requirements.some((requirement) => requirement.label.startsWith('SAT')) ||
        !requirements.some((requirement) => requirement.label === 'IELTS')
    })
  ) {
    throw new Error('Every QS 2027 top-50 profile must include explicit SAT and IELTS policies')
  }
}

validateUniversityCatalog()

/* ------------------------------------------------------------------ */
/*  University access — the single seam the whole hub reads through.    */
/*  Today it returns the local QS 2027 dataset. To wire a live backend  */
/*  sync later, this is the only function that needs to change.         */
/* ------------------------------------------------------------------ */

export function getUniversities(): University[] {
  return [...universities].sort((a, b) => (a.rank ?? Number.MAX_SAFE_INTEGER) - (b.rank ?? Number.MAX_SAFE_INTEGER) || a.name.localeCompare(b.name))
}

export function formatUniversityRank(university: Pick<University, 'rank' | 'rankLabel' | 'rankTied'>, prefix = '') {
  if (university.rankLabel) return `${prefix}${university.rankLabel}`
  if (typeof university.rank !== 'number') return '—'
  return `${prefix}${university.rankTied ? '=' : ''}${university.rank}`
}

export function getUniversityBySlug(slug: string): University | undefined {
  return universities.find((u) => u.slug === slug)
}

/* ------------------------------------------------------------------ */
/*  Lessons                                                             */
/* ------------------------------------------------------------------ */

export function getLessons(): AdmissionLesson[] {
  return [...lessons].sort((a, b) => a.order - b.order)
}

export function getLessonBySlug(slug: string): AdmissionLesson | undefined {
  return lessons.find((l) => l.slug === slug)
}

export function getPhaseById(id: string): LessonPhase | undefined {
  return lessonPhases.find((p) => p.id === id)
}

export function getLessonsByPhase(phaseId: string): AdmissionLesson[] {
  return getLessons().filter((l) => l.phaseId === phaseId)
}

export function getAdjacentLessons(slug: string): {
  prev?: AdmissionLesson
  next?: AdmissionLesson
} {
  const ordered = getLessons()
  const index = ordered.findIndex((l) => l.slug === slug)
  if (index === -1) return {}
  return {
    prev: index > 0 ? ordered[index - 1] : undefined,
    next: index < ordered.length - 1 ? ordered[index + 1] : undefined,
  }
}

export const totalLessonMinutes = lessons.reduce((sum, l) => sum + l.durationMin, 0)

/* ------------------------------------------------------------------ */
/*  QS indicator presentation — one source of truth for labels + order  */
/*  so the ranking row and the detail page always agree.                */
/* ------------------------------------------------------------------ */

export type IndicatorMeta = {
  key: keyof QSIndicators
  label: string
  short: string
}

// Full QS indicator order, exactly as QS lists them on a university profile.
export const indicatorOrder: IndicatorMeta[] = [
  { key: 'academicReputation', label: 'Academic Reputation', short: 'Academic Rep.' },
  { key: 'employerReputation', label: 'Employer Reputation', short: 'Employer Rep.' },
  { key: 'facultyStudentRatio', label: 'Faculty Student Ratio', short: 'Faculty/Student' },
  { key: 'citationsPerFaculty', label: 'Citations per Faculty', short: 'Citations' },
  { key: 'internationalFacultyRatio', label: 'International Faculty Ratio', short: 'Int’l Faculty' },
  { key: 'internationalStudentRatio', label: 'International Student Ratio', short: 'Int’l Students' },
  { key: 'internationalResearchNetwork', label: 'International Research Network', short: 'Research Network' },
  { key: 'employmentOutcomes', label: 'Employment Outcomes', short: 'Employment' },
  { key: 'internationalStudentDiversity', label: 'International Student Diversity', short: 'Student Diversity' },
  { key: 'sustainability', label: 'Sustainability', short: 'Sustainability' },
]

// Only the indicators a given university actually has a value for, in QS order.
export function presentIndicators(indicators: QSIndicators): { meta: IndicatorMeta; value: number }[] {
  return indicatorOrder
    .filter((meta) => typeof indicators[meta.key] === 'number')
    .map((meta) => ({ meta, value: indicators[meta.key] as number }))
}

// The two headline metrics QS prints under each ranking row.
export const rowIndicators: (keyof QSIndicators)[] = ['citationsPerFaculty', 'academicReputation']
