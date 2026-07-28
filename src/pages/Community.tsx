import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, AtSign, Award, Flame, Loader2, Search, Sparkles, Users, Zap } from 'lucide-react'
import { searchLearners, type LearnerSearchResult } from '@/lib/profileApi'
import { AmbientBackdrop, Reveal, Stagger, StaggerItem } from '@/components/fx'

function initialsOf(nickname: string | null) {
  return (nickname ?? '?').slice(0, 2).toUpperCase()
}

export default function Community() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<LearnerSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const debounceRef = useRef<number | null>(null)

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    const q = query.trim()
    if (q.length < 1) {
      setResults([])
      setSearched(false)
      return
    }
    setLoading(true)
    debounceRef.current = window.setTimeout(async () => {
      try {
        const list = await searchLearners(q)
        setResults(list)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
        setSearched(true)
      }
    }, 350)
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [query])

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-10">
      <AmbientBackdrop variant="red" />
      <div className="relative mx-auto w-full max-w-5xl space-y-6">
        <Reveal>
          <section className="premium-hero p-6 sm:p-9">
            <div className="premium-top-controls">
              <button onClick={() => navigate('/tests')} className="premium-back-btn">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Test Library
              </button>
              <span className="premium-top-chip">
                <Users className="h-3.5 w-3.5" />
                Community
              </span>
            </div>
            <h1 className="premium-section-title mt-4">
              Find <span className="arena-title-accent-red">learners</span> by nickname
            </h1>
            <p className="premium-section-subtitle max-w-2xl">
              Search any learner by their public handle to see their skill averages, achievement badges, leaderboard
              rank and target university. Emails are always private.
            </p>

            <div className="mt-5 flex items-center gap-2 rounded-2xl border border-red-200 bg-white px-4 shadow-sm focus-within:border-red-400">
              <Search className="h-5 w-5 text-red-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value.replace(/\s/g, ''))}
                placeholder="Search by nickname, e.g. alex_ielts"
                className="w-full bg-transparent py-3 text-sm font-semibold text-slate-900 outline-none"
              />
              {loading ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" /> : null}
            </div>
          </section>
        </Reveal>

        {searched && !loading && results.length === 0 ? (
          <div className="surface-card flex flex-col items-center p-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <AtSign className="h-6 w-6" />
            </span>
            <p className="mt-3 text-sm font-bold text-slate-700">No learners found</p>
            <p className="mt-1 text-xs text-slate-500">Try a different nickname. Private profiles do not appear in search.</p>
          </div>
        ) : null}

        {results.length > 0 ? (
          <Stagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((r) => (
              <StaggerItem key={r.nickname ?? Math.random()}>
                <motion.button
                  whileHover={{ y: -3 }}
                  onClick={() => r.nickname && navigate(`/u/${r.nickname}`)}
                  className="group flex w-full items-center gap-3 rounded-2xl border border-red-100 bg-white p-4 text-left shadow-sm transition hover:border-red-200 hover:shadow-[0_12px_28px_rgba(220,38,38,0.12)]"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 to-rose-600 text-lg font-black text-white ring-2 ring-red-200/70 ring-offset-2 transition group-hover:ring-red-400/80">
                    {r.avatarUrl ? <img src={r.avatarUrl} alt="" className="h-full w-full object-cover" /> : initialsOf(r.nickname)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1 truncate text-sm font-black text-slate-900">
                      <AtSign className="h-3.5 w-3.5 text-red-500" />
                      {r.nickname}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-slate-500">
                      <span className="inline-flex items-center gap-1"><Sparkles className="h-3 w-3 text-amber-500" /> Lvl {r.level}</span>
                      <span className="inline-flex items-center gap-1"><Zap className="h-3 w-3 text-amber-500" /> {r.xp} XP</span>
                      <span className="inline-flex items-center gap-1"><Flame className="h-3 w-3 text-orange-500" /> {r.streak}</span>
                      <span className="inline-flex items-center gap-1"><Award className="h-3 w-3 text-red-500" /> {r.badgeCount}</span>
                    </div>
                  </div>
                </motion.button>
              </StaggerItem>
            ))}
          </Stagger>
        ) : null}
      </div>
    </div>
  )
}
