import { apiClient } from '@/lib/apiClient'

// Thin client for the extended profile backend: account fields, avatar, skill
// badges, learner search and public profiles. Public endpoints return nicknames
// only and never expose another learner's email.

export type SkillTrackKey =
  | 'IELTS_LISTENING'
  | 'IELTS_READING'
  | 'IELTS_WRITING'
  | 'IELTS_SPEAKING'
  | 'SAT_MATH'
  | 'SAT_ENGLISH'
  | 'SAT_OVERALL'

export type ExamTargetKey = 'IELTS' | 'SAT' | 'BOTH'

export type AccountProfileFields = {
  gender: string | null
  gradeLevel: string | null
  phone: string | null
  country: string | null
  timezone: string | null
  targetExam: ExamTargetKey | null
  targetScore: string | null
  examDate: string | null
  targetCountries: string[]
  currentIeltsScore: number | null
  targetIeltsScore: number | null
  currentSatScore: number | null
  targetSatScore: number | null
  dailyStudyHours: number | null
  onboardingCompletedAt: string | null
  bio: string | null
  fieldOfStudy: string | null
  gpa: string | null
  degreeLevel: string | null
  budgetUsd: number | null
  targetUniversitySlug: string | null
  isPublic: boolean
  showResults: boolean
  showLeaderboard: boolean
  showUniversity: boolean
  showBadges: boolean
}

export type AccountResponse = {
  fullName: string
  email: string
  nickname: string | null
  avatarUrl: string | null
  level: number
  xp: number
  memberSince: string
  profile: AccountProfileFields
}

export type SkillBadgeRecord = {
  id: string
  userId: string
  track: SkillTrackKey
  tier: number
  band: number
  pinned: boolean
  source: string | null
  unlockedAt: string
  updatedAt: string
}

export type LearnerSearchResult = {
  nickname: string | null
  avatarUrl: string | null
  level: number
  xp: number
  streak: number
  badgeCount: number
  country: string | null
  targetExam: 'IELTS' | 'SAT' | null
  targetScore: number | null
  targetUniversitySlug: string | null
  online: boolean
  /** True for the current or last confirmed weekly community champion. */
  weeklyChampion?: boolean
  weeklyScore?: number
}

export type PublicProfilePayload = {
  profile: {
    nickname: string | null
    displayName: string
    avatarUrl: string | null
    level: number
    xp: number
    streak: number
    longestStreak: number
    memberSince: string
    online: boolean
    lastSeen: string | null
    isSelf: boolean
    bio: string | null
    country: string | null
    fieldOfStudy: string | null
  }
  visibility: {
    showResults: boolean
    showLeaderboard: boolean
    showUniversity: boolean
    showBadges: boolean
  }
  stats: {
    totalAttempts: number
    averageScore: number
    averageAccuracy: number
  } | null
  skillAnalytics: PublicSkillAnalytics | null
  competitive: {
    rank: number
    division: string
    divisionLabel: string
    rankingScore: number
  } | null
  university: { slug: string | null } | null
  badges: SkillBadgeRecord[]
}

export type PublicSkillAnalytics = {
  overall?: { skillPower: number; percentile: number }
  radar: Array<{ category: string; label: string; skillPower: number; accuracy: number }>
  trackBreakdown: Array<{ key: string; label: string; group: string; skillPower: number; accuracy: number }>
}

export async function fetchAccount(): Promise<AccountResponse> {
  return apiClient.get<AccountResponse>('/profile/account', { auth: true })
}

export async function updateAccount(
  patch: Partial<AccountProfileFields> & { fullName?: string },
): Promise<{ fullName?: string; profile: AccountProfileFields }> {
  return apiClient.put<{ fullName?: string; profile: AccountProfileFields }>('/profile/account', patch, { auth: true })
}

export async function uploadAvatar(dataUrl: string): Promise<{ avatarUrl: string | null }> {
  return apiClient.post<{ avatarUrl: string | null }>('/profile/avatar', { dataUrl }, { auth: true })
}

export async function removeAvatar(): Promise<void> {
  await apiClient.delete('/profile/avatar', { auth: true })
}

export async function fetchBadges(): Promise<SkillBadgeRecord[]> {
  const res = await apiClient.get<{ badges: SkillBadgeRecord[] }>('/profile/badges', { auth: true })
  return res.badges ?? []
}

export async function upsertBadge(input: {
  track: SkillTrackKey
  band: number
  source?: string
}): Promise<{ badge: SkillBadgeRecord; isNew: boolean }> {
  return apiClient.post<{ badge: SkillBadgeRecord; isNew: boolean }>('/profile/badges', input, { auth: true })
}

export async function pinBadge(id: string, pinned: boolean): Promise<{ badge: SkillBadgeRecord }> {
  return apiClient.patch<{ badge: SkillBadgeRecord }>('/profile/badges/pin', { id, pinned }, { auth: true })
}

export async function deleteBadge(id: string): Promise<void> {
  await apiClient.delete(`/profile/badges/${encodeURIComponent(id)}`, { auth: true })
}

export async function searchLearners(
  q = '',
  filters: { targetExam?: 'IELTS' | 'SAT'; country?: string; online?: boolean } = {},
): Promise<LearnerSearchResult[]> {
  const params = new URLSearchParams()
  if (q.trim()) params.set('q', q.trim())
  if (filters.targetExam) params.set('targetExam', filters.targetExam)
  if (filters.country) params.set('country', filters.country)
  if (filters.online) params.set('online', 'true')
  const res = await apiClient.get<{ results: LearnerSearchResult[] }>(
    `/profile/search?${params.toString()}`,
    { auth: true },
  )
  return res.results ?? []
}

export async function fetchPublicProfile(nickname: string): Promise<PublicProfilePayload> {
  return apiClient.get<PublicProfilePayload>(`/profile/public/${encodeURIComponent(nickname)}`, { auth: true })
}
