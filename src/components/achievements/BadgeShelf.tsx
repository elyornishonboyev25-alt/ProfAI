import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Sparkles, Star, Trash2 } from 'lucide-react'
import {
  deleteBadge,
  fetchBadges,
  pinBadge,
  type SkillBadgeRecord,
} from '@/lib/profileApi'
import { useToastStore, type ToastState } from '@/store/toastStore'
import { useBadgeStore } from '@/store/badgeStore'
import { useAuthStore, type AuthState } from '@/store/authStore'
import SkillBadge from './SkillBadge'
import { TIER_NAME, TRACK_META, formatAchievementScore } from './badgeMeta'

// Owner-facing badge manager: shows every earned badge and lets the learner pin the
// ones they want on their public profile (or remove an old, lower one). Falls back to
// the local mirror when the backend is unreachable so badges are never invisible.
export default function BadgeShelf() {
  const pushToast = useToastStore((s: ToastState) => s.pushToast)
  const userId = useAuthStore((s: AuthState) => s.user?.id ?? null)
  const localRecords = useBadgeStore((s) => s.records)

  const [badges, setBadges] = useState<SkillBadgeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [offline, setOffline] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    fetchBadges()
      .then((list) => {
        if (!active) return
        setBadges(list)
        setOffline(false)
      })
      .catch(() => {
        if (!active) return
        // Fall back to the local mirror (read-only — ids are synthetic).
        const local = localRecords
          .filter((r) => r.userId === userId)
          .map<SkillBadgeRecord>((r) => ({
            id: `local-${r.track}-${r.tier}`,
            userId: userId ?? '',
            track: r.track,
            tier: r.tier,
            band: r.band,
            pinned: false,
            source: null,
            unlockedAt: r.unlockedAt,
            updatedAt: r.unlockedAt,
          }))
        setBadges(local)
        setOffline(true)
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [userId, localRecords])

  const togglePin = async (badge: SkillBadgeRecord) => {
    if (offline) {
      pushToast({ type: 'info', title: 'Reconnect to manage', message: 'Pinning needs a connection to the server.' })
      return
    }
    setBusyId(badge.id)
    try {
      const res = await pinBadge(badge.id, !badge.pinned)
      setBadges((prev) => prev.map((b) => (b.id === badge.id ? res.badge : b)))
    } catch (e) {
      pushToast({ type: 'error', title: 'Could not update', message: e instanceof Error ? e.message : 'Try again.' })
    } finally {
      setBusyId(null)
    }
  }

  const removeBadge = async (badge: SkillBadgeRecord) => {
    if (offline) {
      pushToast({ type: 'info', title: 'Reconnect to manage', message: 'Removing needs a connection to the server.' })
      return
    }
    setBusyId(badge.id)
    try {
      await deleteBadge(badge.id)
      setBadges((prev) => prev.filter((b) => b.id !== badge.id))
    } catch (e) {
      pushToast({ type: 'error', title: 'Could not remove', message: e instanceof Error ? e.message : 'Try again.' })
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    )
  }

  if (badges.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-blue-200 bg-blue-50/40 px-4 py-10 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
          <Sparkles className="h-6 w-6" />
        </span>
        <p className="mt-3 text-sm font-bold text-slate-700">No badges yet</p>
        <p className="mt-1 max-w-xs text-xs text-slate-500">
          Reach IELTS band 7.0+ or score 1400+ in a complete Digital SAT mock to earn your first professional badge.
        </p>
      </div>
    )
  }

  return (
    <div>
      <p className="mb-3 text-xs font-medium text-slate-500">
        <Star className="mr-1 inline h-3.5 w-3.5 -translate-y-0.5 fill-amber-400 text-amber-500" />
        Pinned badges appear on your public profile. Pin a higher band and unpin the old one — or keep both.
      </p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {badges.map((badge) => (
          <motion.div
            key={badge.id}
            layout
            className={`group relative flex flex-col items-center rounded-2xl border p-3 transition ${
              badge.pinned ? 'border-amber-300 bg-amber-50/60 shadow-[0_8px_20px_rgba(245,158,11,0.18)]' : 'border-slate-100 bg-white'
            }`}
          >
            {badge.pinned ? (
              <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-amber-400 px-1.5 py-0.5 text-[9px] font-black uppercase text-slate-900">
                <Star className="h-2.5 w-2.5 fill-slate-900" /> Pinned
              </span>
            ) : null}

            <SkillBadge track={badge.track} band={badge.band} size={104} showBand />
            <p className="mt-1 text-xs font-bold text-slate-800">{TRACK_META[badge.track]?.short}</p>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              {TIER_NAME[badge.tier]} · {formatAchievementScore(badge.track, badge.band)}
            </p>

            <div className="mt-2 flex items-center gap-1.5">
              <button
                onClick={() => void togglePin(badge)}
                disabled={busyId === badge.id}
                className={`inline-flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] font-bold transition disabled:opacity-50 ${
                  badge.pinned ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Star className={`h-3 w-3 ${badge.pinned ? 'fill-amber-500 text-amber-600' : ''}`} />
                {badge.pinned ? 'Unpin' : 'Pin'}
              </button>
              <button
                onClick={() => void removeBadge(badge)}
                disabled={busyId === badge.id}
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-blue-100 hover:text-blue-600 disabled:opacity-50"
                title="Remove badge"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
