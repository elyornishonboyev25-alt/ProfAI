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
import SkillBadge from './SkillBadge'
import { TRACK_META, TRACK_ORDER, formatAchievementScore } from './badgeMeta'

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
          Finish an IELTS section or full mock with band 7.0+, a SAT section with 700+, or a full SAT mock with 1400+.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-5 rounded-2xl border border-amber-200/70 bg-[linear-gradient(115deg,#fff9e9,#fff,#f6f9ff)] p-4 sm:p-5">
        <p className="flex items-center gap-2 text-sm font-black text-slate-900"><Sparkles className="h-4 w-4 text-amber-500" /> Your honors collection</p>
        <p className="mt-1 text-xs leading-5 text-slate-600">Each medal marks a complete section or full mock. All badges appear on your public profile. Pin your favorites to highlight them.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[...badges].sort((a, b) => Number(b.pinned) - Number(a.pinned) || TRACK_ORDER.indexOf(a.track) - TRACK_ORDER.indexOf(b.track) || b.tier - a.tier).map((badge) => (
          <motion.div
            key={badge.id}
            layout
            className={`group relative flex flex-col items-center overflow-hidden rounded-[1.5rem] border px-4 pb-5 pt-3 text-center transition hover:-translate-y-1 ${
              badge.pinned ? 'border-amber-300 bg-[radial-gradient(circle_at_50%_35%,#fff2c8,#fffaf0_55%,#fff)] shadow-[0_14px_28px_rgba(153,104,23,0.17)]' : 'border-slate-200 bg-[radial-gradient(circle_at_50%_35%,#fff8e9,#fff_60%)] shadow-[0_9px_24px_rgba(24,33,53,0.07)]'
            }`}
          >
            {badge.pinned ? (
              <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-amber-400 px-1.5 py-0.5 text-[9px] font-black uppercase text-slate-900">
                <Star className="h-2.5 w-2.5 fill-slate-900" /> Pinned
              </span>
            ) : null}

            <SkillBadge track={badge.track} band={badge.band} size={168} showBand />
            <p className="mt-1 font-serif text-lg font-bold text-slate-900">{TRACK_META[badge.track]?.title}</p>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Tier {badge.tier} · {TRACK_META[badge.track]?.group === 'SAT' ? 'Score' : 'Band'} {formatAchievementScore(badge.track, badge.band)}
            </p>

            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={() => void togglePin(badge)}
                disabled={busyId === badge.id || badge.id.startsWith('local-')}
                className={`inline-flex h-9 items-center gap-1 rounded-xl px-3 text-xs font-bold transition disabled:opacity-50 ${
                  badge.pinned ? 'bg-amber-200 text-amber-900 hover:bg-amber-300' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                <Star className={`h-3 w-3 ${badge.pinned ? 'fill-amber-500 text-amber-600' : ''}`} />
                {badge.id.startsWith('local-') ? 'Syncing' : badge.pinned ? 'Unpin' : 'Pin'}
              </button>
              <button
                onClick={() => void removeBadge(badge)}
                disabled={busyId === badge.id || badge.id.startsWith('local-')}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
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
