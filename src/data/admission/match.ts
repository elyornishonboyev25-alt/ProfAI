import type { University } from './types'
import { universities } from './universities'

// Profile-based university matching. Test thresholds come only from official
// university policies; a missing cutoff stays missing instead of being estimated.

export type DegreeLevel = 'bachelor' | 'master' | 'phd'

export type MatchInput = {
  satTotal?: number | null // 400–1600
  ieltsOverall?: number | null // 0–9
  gpa?: number | null // 0–4
  fieldOfStudy?: string | null
  degreeLevel?: DegreeLevel
  budgetUsdPerYear?: number | null
  preferredCountry?: string | null
}

export type MatchClassification = 'reach' | 'match'

export type EstimatedRequirements = { sat: number | null; ielts: number | null; gpa: number | null; satExplicit: boolean; ieltsExplicit: boolean }

export type UniversityMatch = {
  university: University
  fitPercent: number
  classification: MatchClassification
  reasons: string[]
  requirements: EstimatedRequirements
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function estimateRequirements(uni: University): EstimatedRequirements {
  const bachelor = uni.admission?.bachelor ?? []
  const satRequirement = bachelor.find((req) => req.comparison === 'satTotal')
  const ieltsRequirement = bachelor.find((req) => req.comparison === 'ieltsOverall')
  return {
    sat: satRequirement?.minimum ?? satRequirement?.recommended ?? null,
    ielts: ieltsRequirement?.minimum ?? ieltsRequirement?.recommended ?? null,
    gpa: null,
    satExplicit: Boolean(satRequirement),
    ieltsExplicit: Boolean(ieltsRequirement),
  }
}

function livingCost(uni: University): number | null {
  const c = uni.costOfLiving
  // The saved budget is USD/year. Never compare it with an unconverted local
  // currency or with a monthly housing-only rate.
  if (!c || c.currency !== 'USD' || c.period !== 'academic-year') return null
  return c.maxAmount ?? c.amount
}

// metricScore: 0.5 means "meets requirement", 1 means "comfortably above",
// 0 means "well below". `spread` is how far above/below shifts the score fully.
function metricScore(user: number, req: number, spread: number) {
  return clamp(0.5 + (user - req) / (2 * spread), 0, 1)
}

// These terms only identify subjects explicitly mentioned in the catalog overview.
// An overview match is a research lead, not proof that a particular degree is offered.
const SUBJECT_TERMS: Record<string, string[]> = {
  'Computer Science': ['computer science', 'computing', 'informatics'],
  'Business Management': ['business', 'management'],
  Economics: ['economics', 'economic'],
  Engineering: ['engineering'],
  Medicine: ['medicine', 'medical'],
  Law: ['law', 'legal'],
  Psychology: ['psychology'],
  'Data Science': ['data science', 'data analytics'],
  'Artificial Intelligence': ['artificial intelligence', 'machine learning'],
  Finance: ['finance', 'financial'],
  Accounting: ['accounting'],
  Marketing: ['marketing'],
  Architecture: ['architecture'],
  'International Relations': ['international relations', 'political science'],
  'Political Science': ['political science', 'politics'],
  'Biology / Life Sciences': ['biology', 'life sciences'],
  Chemistry: ['chemistry'],
  Physics: ['physics'],
  Mathematics: ['mathematics', 'maths'],
  Education: ['education', 'teaching'],
  'Public Health': ['public health'],
  Nursing: ['nursing'],
  'Media & Communications': ['media', 'communications', 'journalism'],
  'Art & Design': ['art', 'design'],
}

// Confirmed on the official undergraduate subject lists:
// https://majors.stanford.edu/opportunities/computer-science
// https://economics.stanford.edu/undergraduate/major
// https://college.harvard.edu/academics/liberal-arts-sciences/concentrations
const VERIFIED_BACHELOR_SUBJECTS: Record<string, string[]> = {
  'stanford-university': ['Computer Science', 'Economics', 'Engineering'],
  'harvard-university': ['Computer Science', 'Economics', 'Engineering'],
}

function subjectEvidence(uni: University, field: string, bachelor: boolean): 'official listing' | 'overview' | null {
  if (bachelor && VERIFIED_BACHELOR_SUBJECTS[uni.id]?.includes(field)) return 'official listing'
  const terms = SUBJECT_TERMS[field] ?? [field.toLowerCase()]
  const overview = `${uni.tagline} ${uni.about}`.toLowerCase()
  return terms.some((term) => new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(overview)) ? 'overview' : null
}

function selectiveFitCap(uni: University): number {
  // QS is a broad planning signal, not an acceptance rate. Conservative caps
  // prevent a test threshold from presenting a prominent university as safe.
  if (uni.groups?.includes('ivy-league')) return 38
  if (typeof uni.rank !== 'number') return 100
  if (uni.rank <= 10) return 32
  if (uni.rank <= 25) return 38
  if (uni.rank <= 50) return 45
  if (uni.rank <= 100) return 52
  return 100
}

export function scoreUniversity(uni: University, input: MatchInput): UniversityMatch {
  const req = estimateRequirements(uni)
  const reasons: string[] = []
  const scores: number[] = []

  const hasBachelorRequirements = (input.degreeLevel ?? 'bachelor') === 'bachelor'
  const satPolicy = uni.admission?.bachelor?.find((item) => item.comparison === 'satTotal')?.policy
  if (hasBachelorRequirements && typeof input.satTotal === 'number' && input.satTotal > 0 && req.sat !== null && satPolicy !== 'conditional') {
    const s = metricScore(input.satTotal, req.sat, 160)
    scores.push(s)
    const verb = input.satTotal >= req.sat ? 'meets' : input.satTotal >= req.sat - 80 ? 'is near' : 'is below'
    reasons.push(`SAT ${input.satTotal} ${verb} the official ${req.sat} published benchmark`)
  } else if (hasBachelorRequirements && typeof input.satTotal === 'number' && input.satTotal > 0) {
    reasons.push(satPolicy === 'conditional'
      ? 'The published SAT figure applies only to specific qualification routes; check your route'
      : 'No numeric SAT cutoff is published, so no SAT gap was invented')
  }

  if (hasBachelorRequirements && typeof input.ieltsOverall === 'number' && input.ieltsOverall > 0 && req.ielts !== null) {
    const s = metricScore(input.ieltsOverall, req.ielts, 1)
    scores.push(s)
    const verb = input.ieltsOverall >= req.ielts ? 'meets' : input.ieltsOverall >= req.ielts - 0.5 ? 'is near' : 'is below'
    reasons.push(`IELTS ${input.ieltsOverall.toFixed(1)} ${verb} the published ${req.ielts.toFixed(1)} benchmark where applicable`)
  } else if (hasBachelorRequirements && typeof input.ieltsOverall === 'number' && input.ieltsOverall > 0) {
    reasons.push('No numeric IELTS cutoff is published, so no IELTS gap was invented')
  }

  let avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0.5

  if (typeof input.gpa === 'number' && input.gpa > 0) {
    avg += clamp((input.gpa - 3) * 0.08, -0.08, 0.08)
    reasons.push('GPA is a planning signal; course rigor and grading systems also matter')
  }

  const field = input.fieldOfStudy?.trim()
  if (field) {
    const evidence = subjectEvidence(uni, field, hasBachelorRequirements)
    if (evidence) {
      avg += 0.08
      reasons.unshift(evidence === 'official listing'
        ? `${field} appears in the official undergraduate subject list; verify this year’s entry route`
        : `${field} is mentioned in this university’s overview; verify the exact degree`)
    } else {
      reasons.push(`Check whether ${field} is offered for your degree level`)
    }
  }

  if (!hasBachelorRequirements) {
    reasons.unshift('Graduate admission is programme-specific; undergraduate test policies were not used')
  }

  // Country preference
  if (input.preferredCountry) {
    if (uni.country === input.preferredCountry) {
      avg += 0.05
      reasons.push(`In your preferred country (${uni.country})`)
    } else {
      avg -= 0.04
    }
  }

  // Budget
  const cost = livingCost(uni)
  if (typeof input.budgetUsdPerYear === 'number' && input.budgetUsdPerYear > 0 && cost) {
    if (cost > input.budgetUsdPerYear) {
      avg -= 0.05
      reasons.push(`Living cost ~$${cost.toLocaleString('en-US')}/yr is above your budget`)
    } else {
      reasons.push(`Living cost ~$${cost.toLocaleString('en-US')}/yr fits your budget`)
    }
  }

  const cap = selectiveFitCap(uni)
  const fitPercent = Math.min(Math.round(clamp(avg, 0, 1) * 100), cap)
  if (cap < 100) reasons.unshift('Highly competitive option; meeting test benchmarks does not make admission likely')
  const classification: MatchClassification = cap <= 45 || fitPercent < 42 ? 'reach' : 'match'

  if (scores.length === 0) {
    const hasUserTestScore = (typeof input.satTotal === 'number' && input.satTotal > 0) || (typeof input.ieltsOverall === 'number' && input.ieltsOverall > 0)
    reasons.unshift(
      !hasBachelorRequirements
        ? 'Check the exact graduate programme’s academic and language requirements'
        : hasUserTestScore
        ? 'This university publishes no comparable numeric cutoff for the scores you entered'
        : 'Add your scores and check the programme requirements for a more useful fit',
    )
  }

  return {
    university: uni,
    fitPercent,
    classification,
    reasons,
    requirements: req,
  }
}

export function matchUniversities(input: MatchInput): UniversityMatch[] {
  const ranked = universities
    .map((uni) => scoreUniversity(uni, input))
    .sort((a, b) => b.fitPercent - a.fitPercent || (a.university.rank ?? Number.MAX_SAFE_INTEGER) - (b.university.rank ?? Number.MAX_SAFE_INTEGER))

  const field = input.fieldOfStudy?.trim()
  if (!field) return ranked

  // Keep a few supported dream options visible in the initial results even
  // though their intentionally conservative fit score is lower.
  const dreams = ranked.filter((item) => item.classification === 'reach'
    && typeof item.university.rank === 'number' && item.university.rank <= 50
    && subjectEvidence(item.university, field, (input.degreeLevel ?? 'bachelor') === 'bachelor'))
    .sort((a, b) => {
      const aVerified = subjectEvidence(a.university, field, (input.degreeLevel ?? 'bachelor') === 'bachelor') === 'official listing'
      const bVerified = subjectEvidence(b.university, field, (input.degreeLevel ?? 'bachelor') === 'bachelor') === 'official listing'
      return Number(bVerified) - Number(aVerified) || b.fitPercent - a.fitPercent
    }).slice(0, 3)
  const dreamIds = new Set(dreams.map((item) => item.university.id))
  const others = ranked.filter((item) => !dreamIds.has(item.university.id))
  return [...others.slice(0, 9), ...dreams, ...others.slice(9)]
}
