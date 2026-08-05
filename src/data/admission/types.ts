// Shared types for the Admission hub (Study Abroad lessons + University rankings).
//
// The whole hub reads from these two collections through the helper functions in
// `index.ts`. Keeping a single typed shape means the list pages, the detail pages
// and any future backend sync all consume the exact same data with no special casing.

/* ------------------------------------------------------------------ */
/*  Universities                                                        */
/* ------------------------------------------------------------------ */

// QS World University Rankings indicators. Every value is 0–100 as published by QS.
// Fields are optional so a university only shows the indicators we can verify — we
// never invent a score. MIT carries the full set (taken from the official profile);
// the rest carry the six core indicators QS prints on the ranking row.
export type QSIndicators = {
  academicReputation?: number
  employerReputation?: number
  facultyStudentRatio?: number
  citationsPerFaculty?: number
  internationalFacultyRatio?: number
  internationalStudentRatio?: number
  internationalResearchNetwork?: number
  employmentOutcomes?: number
  sustainability?: number
  internationalStudentDiversity?: number
}

// English-test / standardized-test entry requirements for international applicants.
export type AdmissionRequirement = {
  label: string // e.g. "IELTS", "TOEFL iBT", "SAT"
  value: string // e.g. "7.0+", "100+", "1520+"
  // Numeric comparison is intentionally opt-in. Universities that require a
  // test but publish no cutoff must never be turned into an invented target.
  minimum?: number
  recommended?: number
  comparison?: 'ieltsOverall' | 'satTotal'
  policy?: 'required' | 'recommended' | 'optional' | 'conditional' | 'not-required' | 'not-accepted'
  detail?: string
  sourceUrl?: string
}

export type UniversitySource = {
  label: string
  url: string
}

export type CostOfLiving = {
  accommodation: number
  food: number
  transport: number
  utilities: number
  currency?: string // defaults to USD
}

export type StudentBody = {
  total: number
  undergraduate?: number
  postgraduate?: number
  international?: number
  internationalUndergraduate?: number
  internationalPostgraduate?: number
  facultyStaff?: number
  domesticStaffPct?: number
  internationalStaffPct?: number
}

export type Campus = {
  name: string
  address: string
  mapsQuery: string // used to build a Google Maps link
}

// Visual identity — a self-contained, watermark-free monogram crest rendered in the
// school's brand colours (no external logo files, so nothing can break or load slowly).
export type UniversityBrand = {
  monogram: string // 1–4 letters shown on the crest, e.g. "MIT", "OX"
  gradient: string // CSS gradient for the crest tile
  accent: string // brand accent colour (rings, score bars, links)
  ink: string // text colour that sits on the gradient
}

export type University = {
  id: string
  slug: string
  rank?: number // QS World University Rankings 2026 position, when ranked
  rankTied?: boolean
  name: string
  shortName: string
  city: string
  country: string
  countryEmoji: string // flag emoji for the location chip
  overallScore?: number // QS overall score, 0–100, when published in our verified dataset
  type: string // e.g. "Private, not-for-profit"
  founded: number
  website: string
  // 1–2 sentence hook for the ranking row, plus a fuller "about" for the detail page.
  tagline: string
  about: string
  brand: UniversityBrand
  indicators: QSIndicators
  // Optional rich detail — fully populated for the flagship profile (MIT) and added
  // for others over time. Pages render whatever is present and gracefully omit the rest.
  subjectRank?: number // QS WUR Ranking by Subject
  sustainabilityRank?: number // QS Sustainability Ranking
  programmesCount?: number
  students?: StudentBody
  costOfLiving?: CostOfLiving
  admission?: {
    bachelor?: AdmissionRequirement[]
    note?: string
    verifiedAt?: string
  }
  campus?: Campus
  groups?: ('qs-top-10' | 'ivy-league' | 'uzbekistan')[]
  sources?: UniversitySource[]
  // Years the university held its current rank (or #1) — drawn as a stability timeline.
  rankHistory?: { year: number; rank: number }[]
}

/* ------------------------------------------------------------------ */
/*  Study-abroad lessons                                                */
/* ------------------------------------------------------------------ */

export type LessonBlock =
  | { type: 'lead'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'tip'; text: string }
  | { type: 'callout'; title: string; text: string }

export type LessonLevel = 'Beginner' | 'Intermediate' | 'Advanced'

// The 30 lessons are grouped into five phases that mirror the real journey from
// "should I study abroad?" all the way to "thriving on campus".
export type LessonPhase = {
  id: string
  order: number
  title: string
  subtitle: string
  icon: string // lucide-react icon name
  gradient: string // CSS gradient for the phase header / lesson accent
  accent: string
}

export type AdmissionLesson = {
  id: string
  slug: string
  order: number // 1–30, global lesson number
  phaseId: string
  title: string
  summary: string
  durationMin: number
  level: LessonLevel
  icon: string // lucide-react icon name
  blocks: LessonBlock[]
  keyTakeaways: string[]
  actionStep: string // one concrete thing to do after the lesson
}
