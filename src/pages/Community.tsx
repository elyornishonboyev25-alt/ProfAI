import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  AtSign,
  Award,
  BookOpenCheck,
  Check,
  Crown,
  Flame,
  Globe2,
  Loader2,
  Radio,
  Search,
  SlidersHorizontal,
  Sparkles,
  Target,
  Users,
  Zap,
} from 'lucide-react'
import { searchLearners, type LearnerSearchResult } from '@/lib/profileApi'
import { AmbientBackdrop, Reveal, Stagger, StaggerItem } from '@/components/fx'
import { BrandLockup } from '@/components/brand/BrandLogo'
import { cn } from '@/components/ui/utils'

type ExamFilter = 'ALL' | 'IELTS' | 'SAT'

function initialsOf(nickname: string | null) {
  return (nickname ?? '?').slice(0, 2).toUpperCase()
}

function matchScore(learner: LearnerSearchResult, exam: ExamFilter, country: string) {
  let score = 76
  if (exam !== 'ALL' && learner.targetExam === exam) score += 10
  if (country && learner.country?.toLowerCase() === country.toLowerCase()) score += 9
  if (learner.online) score += 3
  if (learner.badgeCount > 0) score += 2
  return Math.min(score, 99)
}

export default function Community() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [exam, setExam] = useState<ExamFilter>('ALL')
  const [country, setCountry] = useState('')
  const [onlineOnly, setOnlineOnly] = useState(false)
  const [results, setResults] = useState<LearnerSearchResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const debounceRef = useRef<number | null>(null)

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    setLoading(true)
    debounceRef.current = window.setTimeout(async () => {
      try {
        const list = await searchLearners(query, {
          targetExam: exam === 'ALL' ? undefined : exam,
          country: country.trim() || undefined,
          online: onlineOnly || undefined,
        })
        setResults(list)
        setError('')
      } catch (requestError) {
        setResults([])
        setError(requestError instanceof Error ? requestError.message : 'Learners could not be loaded.')
      } finally {
        setLoading(false)
      }
    }, 260)
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [country, exam, onlineOnly, query])

  const suggested = useMemo(
    () =>
      [...results]
        .sort((a, b) => matchScore(b, exam, country) - matchScore(a, exam, country))
        .slice(0, 3),
    [country, exam, results],
  )

  const topLearner = results[0]?.nickname ?? null

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <AmbientBackdrop variant="red" />
      <div className="pointer-events-none absolute left-[8%] top-36 h-28 w-28 animate-float-slow rounded-full bg-gradient-to-br from-red-300/50 to-red-600/20 blur-xl" />
      <div className="pointer-events-none absolute bottom-24 right-[10%] h-40 w-40 animate-float-reverse rounded-full bg-gradient-to-br from-orange-200/45 to-red-500/20 blur-2xl" />

      <div className="relative mx-auto w-full max-w-[1500px]">
        <Reveal>
          <header className="mb-5 flex flex-col gap-4 rounded-[1.75rem] border border-white/80 bg-white/75 p-4 shadow-[0_22px_70px_rgba(127,29,29,0.12)] backdrop-blur-2xl lg:flex-row lg:items-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-2xl border border-red-100 bg-white px-4 text-sm font-extrabold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:text-red-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </button>
            <BrandLockup className="hidden shrink-0 sm:flex" subtitle="Study Partner Network" />
            <label className="flex min-h-12 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 px-4 shadow-inner focus-within:border-red-300 focus-within:ring-4 focus-within:ring-red-100/70">
              <Search className="h-5 w-5 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value.replace(/\s/g, ''))}
                placeholder="Find a study partner by nickname..."
                className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
              />
              {loading ? <Loader2 className="h-4 w-4 animate-spin text-red-500" /> : null}
            </label>
            <div className="flex flex-wrap gap-2">
              {(['ALL', 'IELTS', 'SAT'] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setExam(item)}
                  className={cn(
                    'min-h-10 rounded-xl border px-4 text-xs font-black transition',
                    exam === item
                      ? 'border-red-500 bg-red-600 text-white shadow-[0_10px_24px_rgba(220,38,38,0.28)]'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-red-200 hover:text-red-700',
                  )}
                >
                  {item === 'ALL' ? 'All learners' : item}
                </button>
              ))}
            </div>
          </header>
        </Reveal>

        <section className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)_300px]">
          <aside className="space-y-4">
            <Reveal>
              <div className="rounded-[1.65rem] border border-white/90 bg-white/78 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.09)] backdrop-blur-2xl">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-red-600" />
                  <h2 className="text-sm font-black text-slate-950">Quick filters</h2>
                </div>
                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => setOnlineOnly((value) => !value)}
                    className={cn(
                      'flex min-h-11 w-full items-center justify-between rounded-xl border px-3 text-left text-sm font-bold transition',
                      onlineOnly
                        ? 'border-red-200 bg-red-50 text-red-700'
                        : 'border-slate-200 bg-white/80 text-slate-600 hover:border-red-200',
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <Radio className="h-4 w-4" />
                      Online now
                    </span>
                    {onlineOnly ? <Check className="h-4 w-4" /> : null}
                  </button>
                  <label className="block rounded-xl border border-slate-200 bg-white/80 p-3">
                    <span className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500">
                      <Globe2 className="h-4 w-4 text-red-500" />
                      Same country
                    </span>
                    <input
                      value={country}
                      onChange={(event) => setCountry(event.target.value)}
                      placeholder="e.g. Uzbekistan"
                      className="mt-2 w-full bg-transparent text-sm font-bold text-slate-900 outline-none placeholder:font-medium placeholder:text-slate-400"
                    />
                  </label>
                </div>
                <button
                  onClick={() => {
                    setExam('ALL')
                    setCountry('')
                    setOnlineOnly(false)
                  }}
                  className="mt-4 text-xs font-extrabold text-red-600 hover:text-red-800"
                >
                  Clear all filters
                </button>
              </div>
            </Reveal>

            <Reveal delay={0.05}>
              <div className="overflow-hidden rounded-[1.65rem] bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 p-5 text-white shadow-[0_24px_60px_rgba(15,23,42,0.2)]">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                  <BookOpenCheck className="h-5 w-5 text-red-300" />
                </span>
                <h3 className="mt-4 text-lg font-black">Study better together</h3>
                <p className="mt-2 text-xs leading-5 text-slate-300">
                  Open a public learner profile, compare goals and continue into a focused speaking room.
                </p>
                <button
                  onClick={() => navigate('/speaking-community')}
                  className="mt-4 min-h-10 w-full rounded-xl bg-white text-xs font-black text-slate-950 transition hover:-translate-y-0.5"
                >
                  Open speaking community
                </button>
              </div>
            </Reveal>
          </aside>

          <div>
            <Reveal>
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-red-700">
                    <Users className="h-3.5 w-3.5" />
                    Study partner discovery
                  </span>
                  <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                    Learn with people who share your <span className="text-red-600">goal.</span>
                  </h1>
                </div>
                <p className="text-xs font-bold text-slate-500">{loading ? 'Finding learners…' : `${results.length} public profiles`}</p>
              </div>
            </Reveal>

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">{error}</div>
            ) : null}

            {!loading && !error && results.length === 0 ? (
              <div className="flex min-h-80 flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-red-200 bg-white/70 p-8 text-center backdrop-blur-xl">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                  <AtSign className="h-7 w-7" />
                </span>
                <h2 className="mt-4 text-lg font-black text-slate-900">No matching public profiles yet</h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Try a broader filter. Private profiles and email addresses never appear here.
                </p>
              </div>
            ) : null}

            <Stagger className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {results.map((learner) => {
                const score = matchScore(learner, exam, country)
                const isTop = learner.nickname === topLearner
                return (
                  <StaggerItem key={learner.nickname ?? `${learner.xp}-${learner.level}`}>
                    <motion.article
                      whileHover={{ y: -5 }}
                      className={cn(
                        'relative overflow-hidden rounded-[1.65rem] border p-5 shadow-[0_18px_45px_rgba(15,23,42,0.09)] backdrop-blur-2xl',
                        isTop
                          ? 'border-amber-300/80 bg-gradient-to-br from-amber-50/95 via-white/90 to-red-50/95'
                          : 'border-white/90 bg-white/78',
                      )}
                    >
                      {isTop ? (
                        <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-black uppercase text-amber-950 shadow-lg">
                          <Crown className="h-3 w-3" />
                          Top learner
                        </span>
                      ) : null}
                      <div className="flex items-start gap-4">
                        <div className="relative">
                          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-red-600 to-rose-900 text-xl font-black text-white ring-4 ring-red-100 ring-offset-2">
                            {learner.avatarUrl ? (
                              <img src={learner.avatarUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              initialsOf(learner.nickname)
                            )}
                          </div>
                          <span
                            className={cn(
                              'absolute bottom-0 right-0 h-4 w-4 rounded-full border-[3px] border-white',
                              learner.online ? 'bg-emerald-500' : 'bg-slate-300',
                            )}
                            title={learner.online ? 'Online now' : 'Offline'}
                          />
                        </div>
                        <div className="min-w-0 pt-2">
                          <p className="truncate text-base font-black text-slate-950">@{learner.nickname}</p>
                          <p className="mt-1 flex items-center gap-1 text-xs font-bold text-slate-500">
                            <Globe2 className="h-3.5 w-3.5" />
                            {learner.country || 'Country not shared'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-2">
                        <span className="rounded-xl border border-red-100 bg-white/85 px-3 py-2 text-center text-xs font-black text-red-700">
                          {learner.targetExam || 'Study'} {learner.targetScore ? learner.targetScore : ''}
                        </span>
                        <span className="rounded-xl border border-slate-200 bg-white/85 px-3 py-2 text-center text-xs font-black text-slate-700">
                          {learner.targetUniversitySlug || 'University explorer'}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-3 divide-x divide-slate-200 rounded-xl border border-slate-200 bg-white/75 py-2.5 text-center">
                        <span><b className="block text-sm text-slate-950">{learner.xp}</b><small className="text-[10px] font-bold text-slate-500">XP</small></span>
                        <span><b className="block text-sm text-slate-950">{learner.streak}</b><small className="text-[10px] font-bold text-slate-500">Streak</small></span>
                        <span><b className="block text-sm text-slate-950">{learner.badgeCount}</b><small className="text-[10px] font-bold text-slate-500">Badges</small></span>
                      </div>

                      <div className="mt-4 flex items-center gap-3">
                        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100">
                          <span className="text-[11px] font-black text-red-700">{score}%</span>
                          <span className="absolute inset-0 rounded-full border-2 border-red-400" style={{ clipPath: `polygon(0 0, ${score}% 0, ${score}% 100%, 0 100%)` }} />
                        </div>
                        <button
                          onClick={() => learner.nickname && navigate(`/u/${learner.nickname}`)}
                          className="cta-sheen min-h-11 flex-1 rounded-xl bg-gradient-to-r from-red-700 via-red-600 to-rose-600 px-4 text-sm font-black text-white shadow-[0_12px_26px_rgba(220,38,38,0.25)] transition hover:-translate-y-0.5"
                        >
                          View profile
                        </button>
                      </div>
                    </motion.article>
                  </StaggerItem>
                )
              })}
            </Stagger>
          </div>

          <aside className="hidden xl:block">
            <Reveal>
              <div className="sticky top-24 rounded-[1.65rem] border border-white/90 bg-white/78 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.09)] backdrop-blur-2xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-black text-slate-950">Suggested partners</h2>
                  <Sparkles className="h-4 w-4 text-red-500" />
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-500">Ranked from your active filters and shared study goals.</p>
                <div className="mt-4 space-y-3">
                  {suggested.map((learner) => (
                    <button
                      key={`suggested-${learner.nickname}`}
                      onClick={() => learner.nickname && navigate(`/u/${learner.nickname}`)}
                      className="group flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white/85 p-3 text-left transition hover:border-red-200 hover:shadow-md"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-red-600 text-xs font-black text-white">
                        {learner.avatarUrl ? <img src={learner.avatarUrl} alt="" className="h-full w-full object-cover" /> : initialsOf(learner.nickname)}
                      </div>
                      <span className="min-w-0 flex-1">
                        <b className="block truncate text-xs text-slate-900">@{learner.nickname}</b>
                        <small className="mt-0.5 flex items-center gap-1 text-[10px] font-bold text-slate-500">
                          <Target className="h-3 w-3 text-red-500" />
                          {learner.targetExam || 'Study goal'}
                        </small>
                      </span>
                      <span className="text-xs font-black text-red-600">{matchScore(learner, exam, country)}%</span>
                    </button>
                  ))}
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-200 pt-4 text-center">
                  <span><Zap className="mx-auto h-4 w-4 text-amber-500" /><small className="mt-1 block text-[9px] font-black text-slate-500">ACTIVE</small></span>
                  <span><Flame className="mx-auto h-4 w-4 text-orange-500" /><small className="mt-1 block text-[9px] font-black text-slate-500">STREAK</small></span>
                  <span><Award className="mx-auto h-4 w-4 text-red-500" /><small className="mt-1 block text-[9px] font-black text-slate-500">BADGES</small></span>
                </div>
              </div>
            </Reveal>
          </aside>
        </section>
      </div>
    </main>
  )
}
