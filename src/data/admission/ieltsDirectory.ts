import directory from './ieltsDirectoryData.json'
import type { University } from './types'

type DirectoryEntry = {
  sourceUrl: string
  website: string | null
  scores: { programme: string; minimum: number | null; detail: string }[]
}

// Snapshot of IELTS.org recognition pages, checked 9 October 2026. Records
// were matched by exact normalized institution name AND source country; no
// fuzzy matches or country-wide score defaults. Null means no numeric score
// was listed. Component notes are retained, with longer notes paraphrased.
const entries: Record<string, DirectoryEntry> = directory

export function enrichUniversityFromIeltsDirectory(university: University): University {
  const entry = entries[university.name]
  if (!entry) return university
  return {
    ...university,
    website: university.website ?? entry.website ?? undefined,
    ieltsDirectory: {
      sourceUrl: entry.sourceUrl,
      checkedAt: '2026-10-09',
      scores: entry.scores,
    },
    sources: [...(university.sources ?? []), { label: 'IELTS official recognition directory', url: entry.sourceUrl }],
  }
}

export function bachelorIeltsRequirement(university: University) {
  const requirements = university.admission?.bachelor ?? []
  return requirements.find((item) => item.comparison === 'ieltsOverall')
    ?? requirements.find((item) => item.label === 'IELTS')
}

export function universityIeltsLabel(university: University) {
  const requirement = bachelorIeltsRequirement(university)
  if (requirement) return requirement.value
  const scores = university.ieltsDirectory?.scores.flatMap((item) => item.minimum === null ? [] : [item.minimum]) ?? []
  if (!scores.length) return 'Requirement not verified'
  const minimum = Math.min(...scores)
  const maximum = Math.max(...scores)
  return `${minimum.toFixed(1)}${maximum !== minimum ? `–${maximum.toFixed(1)}` : ''} · by programme`
}

export type UniversityIeltsFilter = 'all' | 'up-to-6.5' | 'up-to-7.0' | '7.5-plus' | 'no-cutoff' | 'unverified'

export function matchesUniversityIeltsFilter(university: University, filter: UniversityIeltsFilter) {
  if (filter === 'all') return true
  const requirement = bachelorIeltsRequirement(university)
  const officialScore = requirement?.minimum ?? requirement?.recommended
  const directoryScores = university.ieltsDirectory?.scores.flatMap((item) => item.minimum === null ? [] : [item.minimum]) ?? []
  const scores = requirement ? (officialScore === undefined ? [] : [officialScore]) : directoryScores
  // An absent policy is unknown, rather than proof that no cutoff exists.
  if (filter === 'no-cutoff') return Boolean(requirement && officialScore === undefined)
  if (filter === 'unverified') return !requirement && directoryScores.length === 0
  if (filter === 'up-to-6.5') return scores.some((score) => score <= 6.5)
  if (filter === 'up-to-7.0') return scores.some((score) => score <= 7)
  return scores.some((score) => score >= 7.5)
}
