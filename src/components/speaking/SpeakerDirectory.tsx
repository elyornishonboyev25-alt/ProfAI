import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flame, Gauge, Mic, Search, UserRound } from 'lucide-react'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { fetchCommunity, type CommunitySpeaker } from '@/lib/speakingApi'
import { initialsOf } from '@/store/speakerSocialStore'

export function lastSeenLabel(iso: string | null): string {
  if (!iso) return 'Never seen'
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'Just now'
  if (min < 60) return `${min} min ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} hr ago`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day} day${day > 1 ? 's' : ''} ago`
  return new Date(iso).toLocaleDateString()
}

// Community directory — real users who have used the speaking studio, sourced from
// the backend. Shows nicknames + live presence; never an email. Search by nickname.
export default function SpeakerDirectory() {
  const navigate = useNavigate()
  const user = useAuthStore((state: AuthState) => state.user)
  const [speakers, setSpeakers] = useState<CommunitySpeaker[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!user) return
    let active = true
    setLoading(true)
    fetchCommunity()
      .then((list) => active && setSpeakers(list))
      .catch((e) => active && setError(e instanceof Error ? e.message : 'Failed to load speakers.'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [user])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? speakers.filter((s) => s.displayName.toLowerCase().includes(q) || (s.nickname ?? '').toLowerCase().includes(q)) : speakers
  }, [speakers, query])

  const openProfile = (s: CommunitySpeaker) => {
    if (s.nickname) navigate(`/speaker/${s.nickname}`)
  }

  if (!user) {
    return (
      <div className="surface-card flex flex-col items-center p-8 text-center">
        <UserRound className="h-10 w-10 text-red-300" />
        <h3 className="mt-3 text-lg font-black text-slate-900">Discover speakers</h3>
        <p className="mt-1 max-w-sm text-sm text-slate-600">Sign in to find other learners by nickname, see who’s online and view their speaking profiles.</p>
        <button onClick={() => navigate('/login')} className="arena-primary-btn mt-4">Sign in</button>
      </div>
    )
  }

  return (
    <div className="surface-card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 text-xl font-black text-slate-900">
          <UserRound className="h-5 w-5 text-red-600" /> Community Speakers
        </h2>
        <button
          onClick={() => (user.nickname ? navigate(`/speaker/${user.nickname}`) : navigate('/speaker/me'))}
          className="arena-secondary-btn text-sm"
        >
          My profile
        </button>
      </div>

      <div className="relative mt-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search speakers by nickname…"
          className="input w-full pl-9"
        />
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      {loading ? <p className="mt-4 text-sm text-slate-500">Loading speakers…</p> : null}

      <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((s) => (
          <button
            key={s.id}
            onClick={() => openProfile(s)}
            disabled={!s.nickname}
            className="flex items-center gap-3 rounded-2xl border border-red-50 bg-white p-3 text-left transition hover:border-red-200 hover:shadow-[0_10px_24px_rgba(220,38,38,0.1)] disabled:cursor-default disabled:opacity-70"
          >
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red-50 to-rose-100 text-sm font-bold text-red-700">
              {initialsOf(s.displayName)}
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${s.online ? 'bg-emerald-500' : 'bg-slate-300'}`}
                title={s.online ? 'Online now' : lastSeenLabel(s.lastSeen)}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-900">
                {s.displayName}
                {user.nickname && s.nickname === user.nickname ? (
                  <span className="ml-1.5 rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-700">YOU</span>
                ) : null}
              </p>
              <p className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-500">
                <span className="inline-flex items-center gap-0.5"><Gauge className="h-3 w-3 text-red-500" />{s.averageBand.toFixed(1)}</span>
                <span className="inline-flex items-center gap-0.5"><Mic className="h-3 w-3 text-rose-500" />{s.totalMinutes}m</span>
                {s.streak > 0 ? <span className="inline-flex items-center gap-0.5"><Flame className="h-3 w-3 text-orange-500" />{s.streak}d</span> : null}
                <span className={s.online ? 'text-emerald-600' : 'text-slate-400'}>{s.online ? '● online' : lastSeenLabel(s.lastSeen)}</span>
              </p>
            </div>
          </button>
        ))}
        {!loading && filtered.length === 0 ? (
          <p className="col-span-full py-6 text-center text-sm text-slate-500">
            {query ? 'No speakers match your search.' : 'No one has used the speaking studio yet — be the first!'}
          </p>
        ) : null}
      </div>
    </div>
  )
}
