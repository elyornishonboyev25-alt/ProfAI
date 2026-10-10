import UiText from '@/components/common/UiText'
import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BadgeCheck,
  ChevronDown,
  CircleHelp,
  Crown,
  Flame,
  Globe2,
  GraduationCap,
  Loader2,
  MapPin,
  MessageCircleMore,
  Mic,
  Radio,
  Search,
  SlidersHorizontal,
  Sparkles,
  Target,
  Users,
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
import DiscussionRoom from '@/components/community/DiscussionRoom'
import { ProfileAvatar } from '@/components/profile/ProfileAvatar'
import SpeakingHub from '@/components/community/SpeakingHub'
import { useSpeakingCommunity } from '@/hooks/useSpeakingCommunity'
import { useCommunityCopy } from '@/i18n/community'
import type { CommunityChampion } from '@/lib/profileApi'
import '@/styles/community.css'
import '@/styles/speaking-hub.css'

type ExamFilter = 'ALL' | 'IELTS' | 'SAT'
type SmartFilter = 'sameBand' | 'sameCountry' | 'online'
export type CommunityMode = 'people' | 'voice' | 'partner' | 'questions' | 'admissions'

const COMMUNITY_MODES: CommunityMode[] = ['people', 'voice', 'partner', 'questions', 'admissions']

const STUDY_ROOMS = [
  { id: 'voice', name: 'Voice rooms', detail: 'Conversation & team debate', icon: Mic, section: 'voice' },
  { id: 'questions', name: 'Hard Questions', detail: 'Ask and solve together', icon: CircleHelp, section: 'questions' },
  { id: 'admissions', name: 'Study Abroad Lounge', detail: 'Applications and university life', icon: GraduationCap, section: 'admissions' },
  { id: 'partner', name: 'Partner', detail: 'One-to-one voice practice', icon: MessageCircleMore, section: 'partner' },
] as const

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
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedMode = searchParams.get('mode')
  const mode: CommunityMode = requestedMode === 'debate' ? 'voice' : COMMUNITY_MODES.includes(requestedMode as CommunityMode) ? requestedMode as CommunityMode : 'people'
  const hub = useSpeakingCommunity(true)
  const t = useCommunityCopy()
  const [champion, setChampion] = useState<CommunityChampion | null>(null)
  const [refresh, setRefresh] = useState(0)
  const requestRef = useRef(0)
  const [query, setQuery] = useState('')
  const [exam, setExam] = useState<ExamFilter>('ALL')
  const [smartFilters, setSmartFilters] = useState<SmartFilter[]>([])
  const [filtersOpen, setFiltersOpen] = useState(() => window.innerWidth > 760)
  const [roomsOpen, setRoomsOpen] = useState(() => window.innerWidth > 760)
  const [suggestionsOpen, setSuggestionsOpen] = useState(true)
  const [results, setResults] = useState<LearnerSearchResult[]>([])
  const [account, setAccount] = useState<AccountResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const debounceRef = useRef<number | null>(null)

  useEffect(() => {
    if (requestedMode === 'ai') navigate('/ielts/speaking/tests?coach=1', { replace: true })
    if (requestedMode === 'debate') setSearchParams({ mode: 'voice' }, { replace: true })
    if (requestedMode === 'progress') setSearchParams({}, { replace: true })
  }, [navigate, requestedMode, setSearchParams])

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
    const request = ++requestRef.current
    if (!results.length) setLoading(true)
    debounceRef.current = window.setTimeout(async () => {
      try {
        const list = await searchLearners(query, {
          targetExam: exam === 'ALL' ? undefined : exam,
          country: sameCountryActive ? account?.profile.country ?? undefined : undefined,
          online: onlineActive || undefined,
        }, value => { if (request === requestRef.current) setChampion(value) })
        if (request !== requestRef.current) return
        setResults(list)
        setError('')
      } catch (requestError) {
        if (request !== requestRef.current) return
        setResults([])
        setError(requestError instanceof Error ? requestError.message : 'Learners could not be loaded.')
      } finally {
        if (request === requestRef.current) setLoading(false)
      }
    }, 260)
    return () => {
      requestRef.current += 1
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [account?.profile.country, exam, onlineActive, query, sameCountryActive, refresh])

  useEffect(() => {
    const update = () => { if (!document.hidden) setRefresh(value => value + 1) }
    const timer = window.setInterval(update, 30_000)
    window.addEventListener('focus', update)
    document.addEventListener('visibilitychange', update)
    return () => { window.clearInterval(timer); window.removeEventListener('focus', update); document.removeEventListener('visibilitychange', update) }
  }, [])

  const visibleResults = useMemo(() => {
    const ownTarget = normalizeScore(account?.profile.targetScore)
    const filtered = sameBandActive && ownTarget !== null
      ? results.filter((learner) => normalizeScore(learner.targetScore) === ownTarget)
      : results

    // Keep the global champion first when they match the current filters.
    return [...filtered].sort(
      (left, right) => Number(right.dailyChampion === true) - Number(left.dailyChampion === true),
    )
  }, [account?.profile.targetScore, results, sameBandActive])

  const ranked = useMemo(
    () => [...visibleResults].sort((a, b) => matchScore(b, account) - matchScore(a, account) || b.xp - a.xp),
    [account, visibleResults],
  )
  const suggested = ranked.slice(0, 3)
  const clearFilters = () => {
    setExam('ALL')
    setSmartFilters([])
  }

  const selectMode = (nextMode: CommunityMode) => {
    const next = new URLSearchParams(searchParams)
    if (nextMode === 'people') next.delete('mode')
    else next.set('mode', nextMode)
    setSearchParams(next, { replace: true })
  }

  return (
    <main className={cn('workspace-page community-page min-h-screen', hub.room && 'has-live-room')}>
      <div className="community-shell">
        <header className="community-header">
          <div className="community-brand-row"><BrandLockup className="community-brand" /></div>
          <nav className="community-main-nav" aria-label={t('Community navigation')}>
            {([{ id: 'people', name: 'Explore', icon: Sparkles }, ...STUDY_ROOMS] as const).map(item => {
              const Icon = item.icon
              return <button type="button" key={item.id} aria-pressed={mode === item.id} className={cn(mode === item.id && 'is-active')} onClick={() => selectMode(item.id)}><Icon size={17} />{t(item.name)}</button>
            })}
          </nav>
        </header>

        <SpeakingHub hub={hub} champion={champion} invitedRoom={searchParams.get('room')} view={mode === 'partner' ? 'partner' : mode === 'questions' || mode === 'admissions' ? 'hidden' : 'rooms'} onFindPartner={() => selectMode('partner')} />
        {!hub.room && (mode === 'questions' || mode === 'admissions') ? <SpeakingWorkspace mode={mode} onModeChange={selectMode} /> : null}

        {(mode === 'people' || mode === 'partner') && !hub.room ? <div className="community-search-bar">
          <label className="community-search-field">
            <Search className="h-7 w-7" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("Find study partners...")}
              aria-label="Find study partners by nickname"
            />
            {loading ? <Loader2 className="h-5 w-5 animate-spin text-red-500" /> : null}
          </label>
          <div className="community-header-filters" aria-label="Quick partner filters">
            <FilterPill active={sameBandActive} icon={Target} label={t("Same target band")} onClick={toggleBandFilter} />
            <FilterPill active={sameCountryActive} icon={Globe2} label={t("Same country")} onClick={toggleCountryFilter} />
            <FilterPill active={onlineActive} icon={Radio} label={t("Online now")} onClick={() => toggleFilter('online')} />
          </div>
        </div> : null}

        {(mode === 'people' || mode === 'partner') && !hub.room ? <section className={cn('community-layout', suggestionsOpen && 'has-suggestions-open')}>
          <aside className="community-left-column">
            <GlassPanel title={t("Quick filters")} open={filtersOpen} onToggle={() => setFiltersOpen((value) => !value)}>
              <nav className="community-side-list" aria-label="Learner filters">
                <SideFilter active={exam === 'ALL' && smartFilters.length === 0} icon={SlidersHorizontal} label="All learners" onClick={clearFilters} />
                <SideFilter active={sameBandActive} icon={Target} label={normalizeScore(account?.profile.targetScore) === null ? 'Add target band' : 'Same target band'} onClick={toggleBandFilter} />
                <SideFilter active={exam === 'IELTS'} icon={MapPin} label="IELTS learners" onClick={() => setExam((value) => (value === 'IELTS' ? 'ALL' : 'IELTS'))} />
                <SideFilter active={exam === 'SAT'} icon={GraduationCap} label="SAT learners" onClick={() => setExam((value) => (value === 'SAT' ? 'ALL' : 'SAT'))} />
              </nav>
            </GlassPanel>

            <GlassPanel title={t("Study rooms")} open={roomsOpen} onToggle={() => setRoomsOpen((value) => !value)}>
              <nav className="community-room-list" aria-label="Study rooms">
                {STUDY_ROOMS.map((room) => {
                  const Icon = room.icon
                  const liveLabel = room.id === 'voice' ? `${hub.rooms.length} ${t('Live rooms')}` : room.id === 'partner' ? `${hub.available.filter(name => name !== hub.selfName).length} ${t('Available to talk')}` : t('Join')
                  return (
                    <button type="button" key={room.name} onClick={() => selectMode(room.section)} className="community-room-link" aria-label={`${t("Open room")}: ${t(room.name)}`}>
                      <span className="community-room-icon"><Icon className="h-4 w-4" /></span>
                      <span><b>{t(room.name)}</b><small>{t(room.detail)}</small></span>
                      <i className={hub.connected && (room.id === 'voice' || room.id === 'partner') ? 'is-live' : ''}>{liveLabel}<ArrowRight /></i>
                    </button>
                  )
                })}
              </nav>
            </GlassPanel>
          </aside>

          <div className="community-feed">
            <div className="community-feed-heading">
              <div>
                <span className="community-eyebrow"><Sparkles className="h-3.5 w-3.5" />  <UiText text={"Smart matching"} /> </span>
                <h1> <UiText text={"Find your next"} /> <em> <UiText text={"study partner."} /> </em></h1>
                <p> <UiText text={"Connect with learners who share your target, country and momentum."} /> </p>
              </div>
              <div className="community-feed-meta"><span className="community-live-dot" />{loading ? 'Matching learners...' : `${visibleResults.length} profiles found`}</div>
            </div>

            <div className="community-card-viewport" role="region" aria-label="Study partner profiles" tabIndex={0}>
              {error ? <div className="community-error">{error}</div> : null}
              {!loading && !error && visibleResults.length === 0 ? (
                <div className="community-empty">
                  <span><Users className="h-8 w-8" /></span>
                  <h2> <UiText text={"No matching learners yet"} /> </h2>
                  <p> <UiText text={"Remove one or two filters to discover more study partners."} /> </p>
                  <button type="button" onClick={clearFilters}> <UiText text={"Show all learners"} /> </button>
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
                        featured={learner.dailyChampion === true}
                        index={index}
                        canTalk={hub.connected && !hub.room && !hub.busy && !!learner.nickname && learner.nickname !== hub.selfName && hub.available.includes(learner.nickname)}
                        onTalk={() => learner.nickname && void hub.invite(learner.nickname)}
                        onOpen={() => learner.nickname && navigate(`/u/${learner.nickname}`, { state: { from: '/community' } })}
                      />
                    ))}
              </div>
            </div>
          </div>

          <aside className="community-suggestions">
            <div className="community-glass-panel community-suggestion-panel">
              <button
                type="button"
                className="community-suggestions-toggle"
                onClick={() => setSuggestionsOpen((open) => !open)}
                aria-expanded={suggestionsOpen}
                aria-controls="community-suggestions-content"
              >
                <span className="community-suggestions-copy">
                  <span><Sparkles className="h-4 w-4" /> <UiText text={"Recommended"} /></span>
                  <strong><UiText text={"Suggested partners"} /></strong>
                  <small><UiText text={"Best matches from your active filters and study goals."} /></small>
                </span>
                <span className="community-suggestions-action">
                  <BadgeCheck className="h-5 w-5" />
                  <span>{suggested.length}</span>
                  <span>{suggestionsOpen ? 'Hide' : 'Show'}</span>
                  <ChevronDown className={cn('h-5 w-5', suggestionsOpen && 'is-open')} />
                </span>
              </button>
              <div id="community-suggestions-content" hidden={!suggestionsOpen}>
                <div className="community-suggestion-list">
                  {suggested.map((learner) => (
                    <SuggestedPartner key={`suggested-${learner.nickname}`} learner={learner} score={matchScore(learner, account)} onOpen={() => learner.nickname && navigate(`/u/${learner.nickname}`, { state: { from: '/community' } })} />
                  ))}
                  {!loading && suggested.length === 0 ? <p className="community-suggestion-empty"> <UiText text={"Suggestions will appear when a learner matches."} /> </p> : null}
                </div>
                <div className="community-suggestion-legend">
                  <span><Zap /><small> <UiText text={"ACTIVE"} /> </small></span><span><Flame /><small> <UiText text={"STREAK"} /> </small></span><span><Award /><small> <UiText text={"BADGES"} /> </small></span>
                </div>
              </div>
            </div>
          </aside>
        </section> : null}
      </div>
    </main>
  )
}

function SpeakingWorkspace({ mode, onModeChange }: { mode: 'questions' | 'admissions'; onModeChange: (mode: CommunityMode) => void }) {
  const t = useCommunityCopy()
  return <section className="community-speaking-workspace">
    <div className="community-speaking-heading"><span className="community-eyebrow"><MessageCircleMore size={16} />{t('Community room')}</span><h1>{t(mode === 'questions' ? 'Hard Questions' : 'Study Abroad Lounge')}</h1><p>{t(mode === 'questions' ? 'Ask and solve together' : 'Applications and university life')}</p><button type="button" onClick={() => onModeChange('people')} className="community-back-btn"><ArrowLeft size={16} />{t('Back to Community')}</button></div>
    <div className="community-speaking-surface">{mode === 'questions' ? <DiscussionRoom roomId="hard-questions" title="Hard Questions" description="Ask difficult questions and work through answers together." /> : <DiscussionRoom roomId="study-abroad" title="Study Abroad Lounge" description="A shared room for applications, scholarships, visas and university life." />}</div>
  </section>
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

function LearnerCard({ learner, score, featured, index, onOpen, canTalk, onTalk }: { learner: LearnerSearchResult; score: number; featured: boolean; index: number; onOpen: () => void; canTalk: boolean; onTalk: () => void }) {
  const t = useCommunityCopy()
  return (
    <motion.article
      initial={{ opacity: 1, y: 22, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: Math.min(index * 0.045, 0.25), duration: 0.45 }}
      whileHover={{ y: -8, scale: 1.012 }}
      className={cn('community-learner-card', featured && 'is-featured')}
    >
      {featured ? (
        <span className="community-top-badge">
          <span className="community-crown-emblem" aria-hidden="true"><Crown className="h-5 w-5" /></span>
          <span> {t('Top learner today')} </span>
        </span>
      ) : null}
      <div className="community-avatar-ring">
        <div className="community-avatar"><ProfileAvatar src={learner.avatarUrl} name={learner.nickname} alt="" /></div>
        <span className={cn('community-presence', learner.online && 'is-online')} />
      </div>
      <h2>@{learner.nickname ?? 'learner'}</h2>
      <p className="community-country"><Globe2 className="h-3.5 w-3.5" /> {learner.country || 'Global learner'}</p>
      <div className="community-goal-row"><span>{targetLabel(learner)}</span><span>{learner.targetUniversitySlug || `Level ${learner.level}`}</span></div>
      <div className="community-stat-row">
        <span><b>{learner.xp.toLocaleString()}</b><small> <UiText text={"XP earned"} /> </small></span>
        <span><b>{learner.streak}</b><small> <UiText text={"day streak"} /> </small></span>
        <span><b>{learner.badgeCount}</b><small>{t('badges')}</small></span>
      </div>
      {canTalk ? <button type="button" className="community-speak-button" onClick={onTalk}><Mic size={17} />{t('Speak together')}<span /></button> : null}
      <div className="community-card-footer">
        <span className="community-match-mini"><i style={{ '--match': `${score * 3.6}deg` } as React.CSSProperties} />{score}%</span>
        <button type="button" disabled={!learner.nickname} onClick={onOpen}> <UiText text={"View profile"} /> </button>
      </div>
    </motion.article>
  )
}

function SuggestedPartner({ learner, score, onOpen }: { learner: LearnerSearchResult; score: number; onOpen: () => void }) {
  return (
    <button type="button" disabled={!learner.nickname} onClick={onOpen} className="community-suggested-card">
      <span className="community-suggested-avatar"><ProfileAvatar src={learner.avatarUrl} name={learner.nickname} alt="" /></span>
      <span className="community-suggested-name"><b>@{learner.nickname ?? 'learner'}</b><small>{targetLabel(learner)}</small><em> <UiText text={"View match"} /> </em></span>
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
