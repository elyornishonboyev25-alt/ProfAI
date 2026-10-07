import type { SkillBadgeRecord } from '@/lib/profileApi'
import type { LocalBadgeRecord } from '@/store/badgeStore'

/** Use the same account-scoped offline mirror on both profile views. */
export function mergeProfileBadges(
  saved: SkillBadgeRecord[],
  local: LocalBadgeRecord[],
  userId: string | null,
): SkillBadgeRecord[] {
  if (!userId) return saved
  const missing = local.filter((record) => record.userId === userId &&
    !saved.some((badge) => badge.track === record.track && badge.tier === record.tier))
  return [...saved, ...missing.map((record) => ({
    ...record, userId, id: `local-${record.track}-${record.tier}`,
    pinned: false, source: null, updatedAt: record.unlockedAt,
  }))]
}
