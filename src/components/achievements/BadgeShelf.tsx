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
import { mergeProfileBadges } from '@/utils/profileBadges'
import AchievementCard from './AchievementCard'
import { TRACK_ORDER } from './badgeMeta'

// Owner-facing badge manager: shows every earned badge and lets the learner pin the
// favorites on their public profile (or remove an old, lower one). Falls back to
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
    const local = mergeProfileBadges([], localRecords, userId)
    const refresh = () => fetchBadges().then((list) => {
      if (!active) return
      setBadges(mergeProfileBadges(list, localRecords, userId))
      setOffline(false)
    })
    const onSynced = () => { void refresh().catch(() => { if (active) setOffline(true) }) }
    window.addEventListener('smarttest:badges-synced', onSynced)
    refresh()
      .catch(() => {
        if (!active) return
        // Fall back to the local mirror (read-only — ids are synthetic).
        setBadges(local)
        setOffline(true)
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
      window.removeEventListener('smarttest:badges-synced', onSynced)
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
      useBadgeStore.setState((state) => ({ records: state.records.filter((record) => !(record.userId === userId && record.track === badge.track && record.tier === badge.tier)) }))
    } catch (e) {
      pushToast({ type: 'error', title: 'Could not remove', message: e instanceof Error ? e.message : 'Try again.' })
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return (
      <div role="status" aria-label="Loading achievements" className="achievement-glass flex items-center justify-center rounded-2xl py-10 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    )
  }

  if (badges.length === 0) {
    return (
      <div className="achievement-glass flex flex-col items-center justify-center rounded-3xl px-4 py-10 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
          <Sparkles className="h-6 w-6" />
        </span>
        <p className="mt-3 text-sm font-bold text-slate-700">Your first honor awaits</p>
        <p className="mt-1 max-w-xs text-xs text-slate-500">
          Finish an IELTS section or full mock with band 7.0+, a SAT section with 700+, or a full SAT mock with 1400+.
        </p>
      </div>
    )
  }

  return (
    <div className="achievement-collection">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3 px-1">
        <div>
          <p className="flex items-center gap-2 text-sm font-black text-slate-900"><Sparkles className="h-4 w-4 text-red-600" /> Your honors collection</p>
          <p className="mt-1 max-w-md text-xs leading-5 text-slate-600">Real results. Lasting recognition. All earned medals appear on your public profile. Pin your favorites to highlight them.</p>
        </div>
        <span className="rounded-full border border-white bg-white/60 px-3 py-1.5 text-[11px] font-bold text-slate-600">{badges.length} earned</span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[...badges].sort((a, b) => Number(b.pinned) - Number(a.pinned) || TRACK_ORDER.indexOf(a.track) - TRACK_ORDER.indexOf(b.track) || b.tier - a.tier).map((badge) => (
          <motion.div
            key={badge.id}
            layout
            className="min-w-0"
          >
            <AchievementCard track={badge.track} band={badge.band} tier={badge.tier} pinned={badge.pinned}>
            {badge.pinned ? (
              <span className="achievement-pin">
                <Star className="h-2.5 w-2.5 fill-current" /> Pinned
              </span>
            ) : null}

            <div className="achievement-card__actions">
              <button
                onClick={() => void togglePin(badge)}
                disabled={busyId === badge.id || badge.id.startsWith('local-')}
                className="achievement-btn achievement-btn--red"
                aria-pressed={badge.pinned}
              >
                {busyId === badge.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Star className={`h-3.5 w-3.5 ${badge.pinned ? 'fill-current' : ''}`} />}
                {badge.id.startsWith('local-') ? 'Syncing' : badge.pinned ? 'Unpin' : 'Pin'}
              </button>
              <button
                onClick={() => void removeBadge(badge)}
                disabled={busyId === badge.id || badge.id.startsWith('local-')}
                className="achievement-btn !w-11 !px-0 hover:text-red-600"
                aria-label="Remove badge"
                title="Remove badge"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            </AchievementCard>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
