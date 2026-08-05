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

export type MatchClassification = 'reach' | 'match' | 'safety'

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

export function scoreUniversity(uni: University, input: MatchInput): UniversityMatch {
  const req = estimateRequirements(uni)
  const reasons: string[] = []
  const scores: number[] = []

  if (typeof input.satTotal === 'number' && input.satTotal > 0 && req.sat !== null) {
    const s = metricScore(input.satTotal, req.sat, 160)
    scores.push(s)
    const verb = input.satTotal >= req.sat ? 'meets' : input.satTotal >= req.sat - 80 ? 'is near' : 'is below'
    reasons.push(`SAT ${input.satTotal} ${verb} the official ${req.sat} published benchmark`)
  } else if (typeof input.satTotal === 'number' && input.satTotal > 0) {
    reasons.push('No numeric SAT cutoff is published, so no SAT gap was invented')
  }

  if (typeof input.ieltsOverall === 'number' && input.ieltsOverall > 0 && req.ielts !== null) {
    const s = metricScore(input.ieltsOverall, req.ielts, 1)
    scores.push(s)
    const verb = input.ieltsOverall >= req.ielts ? 'meets' : input.ieltsOverall >= req.ielts - 0.5 ? 'is near' : 'is below'
    reasons.push(`IELTS ${input.ieltsOverall.toFixed(1)} ${verb} the official ${req.ielts.toFixed(1)} published benchmark`)
  } else if (typeof input.ieltsOverall === 'number' && input.ieltsOverall > 0) {
    reasons.push('No numeric IELTS cutoff is published, so no IELTS gap was invented')
  }

  if (typeof input.gpa === 'number' && input.gpa > 0 && req.gpa !== null) {
    const s = metricScore(input.gpa, req.gpa, 0.4)
    scores.push(s)
    const verb = input.gpa >= req.gpa ? 'meets' : input.gpa >= req.gpa - 0.2 ? 'is near' : 'is below'
    reasons.push(`GPA ${input.gpa.toFixed(2)} ${verb} the ~${req.gpa.toFixed(2)} (est.) target`)
  }

  let avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : typeof uni.rank === 'number' ? clamp(0.5 + (50 - uni.rank) / 100, 0.2, 0.8) : 0.5

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

  avg = clamp(avg, 0, 1)
  const classification: MatchClassification = avg >= 0.62 ? 'safety' : avg >= 0.42 ? 'match' : 'reach'

  if (scores.length === 0) {
    const hasUserTestScore = (typeof input.satTotal === 'number' && input.satTotal > 0) || (typeof input.ieltsOverall === 'number' && input.ieltsOverall > 0)
    reasons.unshift(
      hasUserTestScore
        ? 'This university publishes no comparable numeric cutoff for the scores you entered'
        : typeof uni.rank === 'number'
          ? 'Add your scores for a more precise fit — this fallback uses QS rank only'
          : 'Add your scores for a more precise fit',
    )
  }

  return {
    university: uni,
    fitPercent: Math.round(avg * 100),
    classification,
    reasons,
    requirements: req,
  }
}

export function matchUniversities(input: MatchInput): UniversityMatch[] {
  return universities
    .map((uni) => scoreUniversity(uni, input))
    .sort((a, b) => b.fitPercent - a.fitPercent || (a.university.rank ?? Number.MAX_SAFE_INTEGER) - (b.university.rank ?? Number.MAX_SAFE_INTEGER))
}
