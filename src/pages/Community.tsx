import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Award,
  BadgeCheck,
  ChevronDown,
  Crown,
  Flame,
  Globe2,
  GraduationCap,
  Loader2,
  MapPin,
  MessageCircleMore,
  Radio,
  Search,
  SlidersHorizontal,
  Sparkles,
  Target,
  Users,
  Video,
  Zap,
} from 'lucide-react'
import {
  fetchAccount,
  searchLearners,
  type AccountResponse,
  type LearnerSearchResult,
} from '@/lib/profileApi'
import { BrandLockup } from '@/components/brand/BrandLogo'
import { cn } from '@/components/ui/utils'
import '@/styles/community.css'

type ExamFilter = 'ALL' | 'IELTS' | 'SAT'
type SmartFilter = 'sameBand' | 'sameCountry' | 'online'

const STUDY_ROOMS = [
  { name: 'IELTS Band 7+ room', detail: 'Speaking practice', icon: Video, section: 'partner' },
  { name: 'Daily mock club', detail: 'Timed challenges', icon: GraduationCap, section: 'debate' },
  { name: 'University 2027', detail: 'Application peers', icon: Users, section: 'debate' },
  { name: 'Fluency builders', detail: 'Open conversation', icon: MessageCircleMore, section: 'partner' },
] as const

function initialsOf(nickname: string | null) {
  return (nickname ?? '?').slice(0, 2).toUpperCase()
}

function normalizeScore(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function matchScore(learner: LearnerSearchResult, account: AccountResponse | null) {
  let score = 68
  const ownProfile = account?.profile
  if (ownProfile?.targetExam && learner.targetExam === ownProfile.targetExam) score += 9
  if (
    normalizeScore(ownProfile?.targetScore) !== null &&
    normalizeScore(learner.targetScore) === normalizeScore(ownProfile?.targetScore)
  ) score += 9
  if (ownProfile?.country && learner.country?.toLowerCase() === ownProfile.country.toLowerCase()) score += 7
  if (learner.online) score += 3
  score += Math.min(learner.badgeCount, 2)
  score += Math.min(learner.streak, 2)
  return Math.min(score, 99)
}

function targetLabel(learner: LearnerSearchResult) {
  const score = normalizeScore(learner.targetScore)
  if (!learner.targetExam) return 'Open study goal'
  return `${learner.targetExam}${score !== null ? ` ${score}` : ''}`
}

export default function Community() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [exam, setExam] = useState<ExamFilter>('ALL')
  const [smartFilters, setSmartFilters] = useState<SmartFilter[]>([])
  const [filtersOpen, setFiltersOpen] = useState(() => window.innerWidth > 760)
  const [roomsOpen, setRoomsOpen] = useState(() => window.innerWidth > 760)
  const [results, setResults] = useState<LearnerSearchResult[]>([])
  const [account, setAccount] = useState<AccountResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const debounceRef = useRef<number | null>(null)

  const sameBandActive = smartFilters.includes('sameBand')
  const sameCountryActive = smartFilters.includes('sameCountry')
  const onlineActive = smartFilters.includes('online')
  const toggleFilter = (filter: SmartFilter) => {
    setSmartFilters((current) =>
      current.includes(filter) ? current.filter((item) => item !== filter) : [...current, filter],
    )
  }
  const toggleBandFilter = () => {
    if (normalizeScore(account?.profile.targetScore) === null) {
      navigate('/profile')
      return
    }
    toggleFilter('sameBand')
  }
  const toggleCountryFilter = () => {
    if (!account?.profile.country) {
      navigate('/profile')
      return
    }
    toggleFilter('sameCountry')
  }

  useEffect(() => {
    let active = true
    fetchAccount()
      .then((profile) => {
        if (active) setAccount(profile)
      })
      .catch(() => {
        // Discovery remains usable when account enrichment is unavailable.
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    setLoading(true)
    debounceRef.current = window.setTimeout(async () => {
      try {
        const list = await searchLearners(query, {
          targetExam: exam === 'ALL' ? undefined : exam,
          country: sameCountryActive ? account?.profile.country ?? undefined : undefined,
          online: onlineActive || undefined,
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
  }, [account?.profile.country, exam, onlineActive, query, sameCountryActive])

  const visibleResults = useMemo(() => {
    if (!sameBandActive) return results
    const ownTarget = normalizeScore(account?.profile.targetScore)
    if (ownTarget === null) return results
    return results.filter((learner) => normalizeScore(learner.targetScore) === ownTarget)
  }, [account?.profile.targetScore, results, sameBandActive])

  const ranked = useMemo(
    () => [...visibleResults].sort((a, b) => matchScore(b, account) - matchScore(a, account) || b.xp - a.xp),
    [account, visibleResults],
  )
  const topNickname = ranked[0]?.nickname ?? null
  const suggested = ranked.slice(0, 3)
  const onlineCount = visibleResults.filter((learner) => learner.online).length

  const clearFilters = () => {
    setExam('ALL')
    setSmartFilters([])
  }

  return (
    <main className="community-page min-h-screen">
      <div className="community-aurora" aria-hidden="true">
        <span className="community-orb community-orb-one" />
        <span className="community-orb community-orb-two" />
        <span className="community-orb community-orb-three" />
        <span className="community-orb community-orb-four" />
      </div>

      <div className="community-shell">
        <header className="community-header">
          <div className="community-brand-row">
            <BrandLockup className="community-brand" />
            <button type="button" onClick={() => navigate('/dashboard')} className="community-back-btn">
              <ArrowLeft className="h-4 w-4" />
              <span>Dashboard</span>
            </button>
          </div>

          <div className="community-search-bar">
            <label className="community-search-field">
              <Search className="h-7 w-7" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value.replace(/\s/g, ''))}
                placeholder="Find study partners..."
                aria-label="Find study partners by nickname"
              />
              {loading ? <Loader2 className="h-5 w-5 animate-spin text-red-500" /> : null}
            </label>
            <div className="community-header-filters" aria-label="Quick partner filters">
              <FilterPill active={sameBandActive} icon={Target} label="Same target band" onClick={toggleBandFilter} />
              <FilterPill active={sameCountryActive} icon={Globe2} label="Same country" onClick={toggleCountryFilter} />
              <FilterPill active={onlineActive} icon={Radio} label="Online now" onClick={() => toggleFilter('online')} />
            </div>
          </div>
        </header>

        <section className="community-layout">
          <aside className="community-left-column">
            <GlassPanel title="Quick filters" open={filtersOpen} onToggle={() => setFiltersOpen((value) => !value)}>
              <nav className="community-side-list" aria-label="Learner filters">
                <SideFilter active={exam === 'ALL' && smartFilters.length === 0} icon={SlidersHorizontal} label="All learners" onClick={clearFilters} />
                <SideFilter active={sameBandActive} icon={Target} label={normalizeScore(account?.profile.targetScore) === null ? 'Add target band' : 'Same target band'} onClick={toggleBandFilter} />
                <SideFilter
                  active={sameCountryActive}
                  icon={Globe2}
                  label={account?.profile.country ? `Same country · ${account.profile.country}` : 'Add your country'}
                  onClick={toggleCountryFilter}
                />
                <SideFilter active={exam === 'IELTS'} icon={MapPin} label="IELTS learners" onClick={() => setExam((value) => (value === 'IELTS' ? 'ALL' : 'IELTS'))} />
                <SideFilter active={exam === 'SAT'} icon={GraduationCap} label="SAT learners" onClick={() => setExam((value) => (value === 'SAT' ? 'ALL' : 'SAT'))} />
                <SideFilter active={onlineActive} icon={Radio} label="Online now" onClick={() => toggleFilter('online')} />
              </nav>
            </GlassPanel>

            <GlassPanel title="Study rooms" open={roomsOpen} onToggle={() => setRoomsOpen((value) => !value)}>
              <nav className="community-room-list" aria-label="Study rooms">
                {STUDY_ROOMS.map((room) => {
                  const Icon = room.icon
                  return (
                    <button type="button" key={room.name} onClick={() => navigate(`/speaking-community?section=${room.section}`)} className="community-room-link">
                      <span className="community-room-icon"><Icon className="h-4 w-4" /></span>
                      <span><b>{room.name}</b><small>{room.detail}</small></span>
                      <i>{onlineCount || 'Open'}</i>
                    </button>
                  )
                })}
              </nav>
            </GlassPanel>
          </aside>

          <div className="community-feed">
            <div className="community-feed-heading">
              <div>
                <span className="community-eyebrow"><Sparkles className="h-3.5 w-3.5" /> Smart matching</span>
                <h1>Find your next <em>study partner.</em></h1>
                <p>Connect with learners who share your target, country and momentum.</p>
              </div>
              <div className="community-feed-meta"><span className="community-live-dot" />{loading ? 'Matching learners...' : `${visibleResults.length} profiles found`}</div>
            </div>

            {error ? <div className="community-error">{error}</div> : null}
            {!loading && !error && visibleResults.length === 0 ? (
              <div className="community-empty">
                <span><Users className="h-8 w-8" /></span>
                <h2>No matching learners yet</h2>
                <p>Remove one or two filters to discover more study partners.</p>
                <button type="button" onClick={clearFilters}>Show all learners</button>
              </div>
            ) : null}

            <div className="community-card-grid">
              {loading && results.length === 0
                ? Array.from({ length: 6 }, (_, index) => <LearnerSkeleton key={index} />)
                : visibleResults.map((learner, index) => (
                    <LearnerCard
                      key={learner.nickname ?? `${learner.xp}-${learner.level}-${index}`}
                      learner={learner}
                      score={matchScore(learner, account)}
                      featured={Boolean(topNickname && learner.nickname === topNickname)}
                      index={index}
                      onOpen={() => learner.nickname && navigate(`/u/${learner.nickname}`)}
                    />
                  ))}
            </div>
          </div>

          <aside className="community-suggestions">
            <div className="community-glass-panel community-suggestion-panel">
              <div className="community-suggestion-heading">
                <div><span><Sparkles className="h-4 w-4" /> Recommended</span><h2>Suggested partners</h2></div>
                <BadgeCheck className="h-6 w-6 text-red-500" />
              </div>
              <p className="community-suggestion-copy">Best matches from your active filters and study goals.</p>
              <div className="community-suggestion-list">
                {suggested.map((learner) => (
                  <SuggestedPartner key={`suggested-${learner.nickname}`} learner={learner} score={matchScore(learner, account)} onOpen={() => learner.nickname && navigate(`/u/${learner.nickname}`)} />
                ))}
                {!loading && suggested.length === 0 ? <p className="community-suggestion-empty">Suggestions will appear when a learner matches.</p> : null}
              </div>
              <div className="community-suggestion-legend">
                <span><Zap /><small>ACTIVE</small></span><span><Flame /><small>STREAK</small></span><span><Award /><small>BADGES</small></span>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  )
}

function FilterPill({ active, icon: Icon, label, onClick }: { active: boolean; icon: typeof Target; label: string; onClick: () => void }) {
  return <button type="button" aria-pressed={active} onClick={onClick} className={cn('community-filter-pill', active && 'is-active')}><Icon className="h-5 w-5" />{label}</button>
}

function GlassPanel({ title, open, onToggle, children }: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <section className="community-glass-panel community-collapsible">
      <button type="button" onClick={onToggle} className="community-panel-title" aria-expanded={open}><span>{title}</span><ChevronDown className={cn('h-5 w-5', open && 'is-open')} /></button>
      <div className={cn('community-collapse', open && 'is-open')}><div>{children}</div></div>
    </section>
  )
}

function SideFilter({ active, icon: Icon, label, onClick }: { active: boolean; icon: typeof Target; label: string; onClick: () => void }) {
  return <button type="button" aria-pressed={active} onClick={onClick} className={cn('community-side-filter', active && 'is-active')}><Icon className="h-[1.15rem] w-[1.15rem]" /><span>{label}</span></button>
}

function LearnerCard({ learner, score, featured, index, onOpen }: { learner: LearnerSearchResult; score: number; featured: boolean; index: number; onOpen: () => void }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 22, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: Math.min(index * 0.045, 0.25), duration: 0.45 }}
      whileHover={{ y: -8, scale: 1.012 }}
      className={cn('community-learner-card', featured && 'is-featured')}
    >
      {featured ? <span className="community-top-badge"><Crown className="h-5 w-5" /> Top learner this week</span> : null}
      <div className="community-avatar-ring">
        <div className="community-avatar">{learner.avatarUrl ? <img src={learner.avatarUrl} alt="" className="profile-avatar-media" /> : initialsOf(learner.nickname)}</div>
        <span className={cn('community-presence', learner.online && 'is-online')} />
      </div>
      <h2>@{learner.nickname ?? 'learner'}</h2>
      <p className="community-country"><Globe2 className="h-3.5 w-3.5" /> {learner.country || 'Global learner'}</p>
      <div className="community-goal-row"><span>{targetLabel(learner)}</span><span>{learner.targetUniversitySlug || `Level ${learner.level}`}</span></div>
      <div className="community-stat-row">
        <span><b>{learner.xp.toLocaleString()}</b><small>XP earned</small></span>
        <span><b>{learner.streak}</b><small>day streak</small></span>
        <span><b>{learner.online ? 'Live' : learner.badgeCount}</b><small>{learner.online ? 'online now' : 'badges'}</small></span>
      </div>
      <div className="community-card-footer">
        <span className="community-match-mini"><i style={{ '--match': `${score * 3.6}deg` } as React.CSSProperties} />{score}%</span>
        <button type="button" disabled={!learner.nickname} onClick={onOpen}>View profile</button>
      </div>
    </motion.article>
  )
}

function SuggestedPartner({ learner, score, onOpen }: { learner: LearnerSearchResult; score: number; onOpen: () => void }) {
  return (
    <button type="button" disabled={!learner.nickname} onClick={onOpen} className="community-suggested-card">
      <span className="community-suggested-avatar">{learner.avatarUrl ? <img src={learner.avatarUrl} alt="" className="profile-avatar-media" /> : initialsOf(learner.nickname)}</span>
      <span className="community-suggested-name"><b>@{learner.nickname ?? 'learner'}</b><small>{targetLabel(learner)}</small><em>View match</em></span>
      <span className="community-match-ring" style={{ '--match': `${score * 3.6}deg` } as React.CSSProperties}><b>{score}%</b></span>
    </button>
  )
}

function LearnerSkeleton() {
  return (
    <div className="community-learner-card community-skeleton" aria-hidden="true">
      <span className="community-skeleton-avatar" /><span className="community-skeleton-line is-short" /><span className="community-skeleton-line" /><span className="community-skeleton-block" /><span className="community-skeleton-button" />
    </div>
  )
}
