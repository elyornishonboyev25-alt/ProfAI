import { apiClient } from '@/lib/apiClient'

export type Curriculum = 'NATIONAL' | 'IB' | 'A_LEVELS' | 'AP' | 'OTHER'
export type AcademicBand = 'BELOW_70' | 'BETWEEN_70_79' | 'BETWEEN_80_89' | 'NINETY_PLUS'
export type TestPlan = 'IELTS' | 'SAT' | 'BOTH' | 'UNSURE' | 'NONE'
export type BudgetRange = 'UNDER_10K' | 'BETWEEN_10K_25K' | 'BETWEEN_25K_50K' | 'ABOVE_50K' | 'UNSURE'
export type ApplicationStage = 'EXPLORING' | 'RESEARCHING' | 'SHORTLISTING' | 'PREPARING' | 'READY'

export type GuestDiagnosticAnswers = {
  applicantCountry: string
  intendedMajor: string
  destinations: string[]
  intakeYear: number
  curriculum: Curriculum
  academicBand: AcademicBand
  testPlan: TestPlan
  currentIeltsScore: number | null
  targetIeltsScore: number | null
  currentSatScore: number | null
  targetSatScore: number | null
  budgetRange: BudgetRange
  needsAid: boolean
  applicationStage: ApplicationStage
  weeklyHours: number
}

export type DiagnosticCategory = {
  key: 'academics' | 'tests' | 'research' | 'application'
  label: string
  score: number
  status: string
  summary: string
}

export type GuestDiagnosticResult = {
  schemaVersion: 1
  overallScore: number
  readinessLabel: string
  summary: string
  categories: DiagnosticCategory[]
  priorities: Array<{
    key: DiagnosticCategory['key']
    title: string
    body: string
    actionLabel: string
    actionPath: string
  }>
}

export type DiagnosticRecord = {
  id: string
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CLAIMED'
  answers: Partial<GuestDiagnosticAnswers>
  result: GuestDiagnosticResult | null
  expiresAt: string
  completedAt: string | null
  claimedAt: string | null
}

const TOKEN_KEY = 'profai-guest-diagnostic-token-v1'
const HANDOFF_KEY = 'profai-guest-diagnostic-handoff-v1'
const DESTINATION_KEY = 'profai-guest-diagnostic-destination-v1'
const INVITATION_DISMISSED_KEY = 'profai-guest-diagnostic-invitation-v1'
const INVITATION_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000

function tokenHeaders(token: string) {
  return { 'x-guest-diagnostic-token': token }
}

function readToken() {
  try { return window.localStorage.getItem(TOKEN_KEY) } catch { return null }
}

export function hasGuestDiagnosticSession() {
  return Boolean(readToken())
}

export function shouldShowGuestDiagnosticInvitation() {
  try {
    const dismissedAt = Number(window.localStorage.getItem(INVITATION_DISMISSED_KEY) ?? 0)
    return !dismissedAt || Date.now() - dismissedAt >= INVITATION_COOLDOWN_MS
  } catch {
    return true
  }
}

export function dismissGuestDiagnosticInvitation() {
  try { window.localStorage.setItem(INVITATION_DISMISSED_KEY, String(Date.now())) } catch { /* no-op */ }
}

export function rememberGuestDiagnosticDestination() {
  try { window.sessionStorage.setItem(DESTINATION_KEY, '/journey-plan') } catch { /* no-op */ }
}

export function takeGuestDiagnosticDestination(fallback = '/dashboard') {
  try {
    const destination = window.sessionStorage.getItem(DESTINATION_KEY)
    window.sessionStorage.removeItem(DESTINATION_KEY)
    return destination === '/journey-plan' ? destination : fallback
  } catch {
    return fallback
  }
}

export function peekGuestDiagnosticDestination() {
  try { return window.sessionStorage.getItem(DESTINATION_KEY) === '/journey-plan' ? '/journey-plan' : null } catch { return null }
}

function saveToken(token: string) {
  try { window.localStorage.setItem(TOKEN_KEY, token) } catch { /* Storage is a progressive enhancement. */ }
}

export function clearGuestDiagnosticToken() {
  try { window.localStorage.removeItem(TOKEN_KEY) } catch { /* no-op */ }
}

export function saveGuestDiagnosticHandoff(answers: GuestDiagnosticAnswers) {
  try { window.localStorage.setItem(HANDOFF_KEY, JSON.stringify(answers)) } catch { /* no-op */ }
}

export function loadGuestDiagnosticHandoff(): GuestDiagnosticAnswers | null {
  try {
    const raw = window.localStorage.getItem(HANDOFF_KEY)
    return raw ? JSON.parse(raw) as GuestDiagnosticAnswers : null
  } catch { return null }
}

export function clearGuestDiagnosticHandoff() {
  try { window.localStorage.removeItem(HANDOFF_KEY) } catch { /* no-op */ }
}

export async function openGuestDiagnosticSession(initialAnswers: Partial<GuestDiagnosticAnswers> = {}) {
  const existingToken = readToken()
  if (existingToken) {
    try {
      const existing = await apiClient.get<{ diagnostic: DiagnosticRecord }>('/guest-diagnostic/session', { auth: false, headers: tokenHeaders(existingToken) })
      return { token: existingToken, diagnostic: existing.diagnostic }
    } catch {
      clearGuestDiagnosticToken()
    }
  }
  const created = await apiClient.post<{ token: string; diagnostic: DiagnosticRecord }>('/guest-diagnostic/session', { answers: initialAnswers }, { auth: false })
  saveToken(created.token)
  return created
}

export async function saveGuestDiagnosticDraft(token: string, answers: Partial<GuestDiagnosticAnswers>) {
  return apiClient.patch<{ diagnostic: DiagnosticRecord }>('/guest-diagnostic/session', { answers }, { auth: false, headers: tokenHeaders(token) })
}

export async function completeGuestDiagnostic(token: string, answers: GuestDiagnosticAnswers) {
  saveGuestDiagnosticHandoff(answers)
  return apiClient.post<{ diagnostic: DiagnosticRecord }>('/guest-diagnostic/complete', { answers }, { auth: false, headers: tokenHeaders(token) })
}

export async function claimGuestDiagnostic(token: string) {
  const response = await apiClient.post<{ diagnostic: DiagnosticRecord }>('/guest-diagnostic/claim', undefined, { headers: tokenHeaders(token) })
  clearGuestDiagnosticToken()
  return response.diagnostic
}

export async function claimStoredGuestDiagnostic() {
  const token = readToken()
  if (!token) return false
  try {
    await claimGuestDiagnostic(token)
    return true
  } catch {
    return false
  }
}

export async function getMyJourneyPlan() {
  const response = await apiClient.get<{ diagnostic: DiagnosticRecord | null }>('/guest-diagnostic/mine')
  return response.diagnostic
}
