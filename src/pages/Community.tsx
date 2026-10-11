import UiText from '@/components/common/UiText'
import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowUpDown,
  CircleHelp,
  Crown,
  Award,
  ArrowUpRight,
  Flame,
  Globe2,
  GraduationCap,
  Loader2,
  MessageCircleMore,
  Mic,
  Radio,
  Search,
  RefreshCw,
  Sparkles,
  Target,
  Users,
  X,
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

const COMMUNITY_SECTIONS = [
  { id: 'voice', name: 'Voice rooms', detail: 'Conversation & team debate', icon: Mic },
  { id: 'partner', name: 'Partner', detail: 'One-to-one voice practice', icon: MessageCircleMore },
  { id: 'questions', name: 'Hard Questions', detail: 'Ask and solve together', icon: CircleHelp },
  { id: 'admissions', name: 'Study Abroad Lounge', detail: 'Applications and university life', icon: GraduationCap },
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
  const [sort, setSort] = useState<'recommended' | 'xp'>('recommended')
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
    if (normalizeScore(account?.profile.targetScore) === null || !account?.profile.targetExam) {
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
  }, [hub.connected])

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    const request = ++requestRef.current
    setLoading(true)
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
      ? results.filter((learner) => normalizeScore(learner.targetScore) === ownTarget && learner.targetExam === account?.profile.targetExam)
      : results

    // Keep the global champion first when they match the current filters.
    return [...filtered].sort(
      (left, right) => Number(right.dailyChampion === true) - Number(left.dailyChampion === true),
    )
  }, [account?.profile.targetScore, account?.profile.targetExam, results, sameBandActive])

  const ranked = useMemo(
    () => [...visibleResults].sort((a, b) => Number(b.dailyChampion === true) - Number(a.dailyChampion === true) || (sort === 'xp' ? b.xp - a.xp : matchScore(b, account) - matchScore(a, account) || b.xp - a.xp)),
    [account, visibleResults, sort],
  )
  const hasFilters = query.trim() !== '' || exam !== 'ALL' || smartFilters.length > 0
  const clearFilters = () => {
    setQuery('')
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
          <div className="community-brand-row"><BrandLockup className="community-brand" /><span className="community-brand-caption">{t('Speaking community')}</span></div>
          <div className="community-status" role="status"><span className={cn('hub-connection', hub.connected && 'is-live')}>{t(hub.connected ? 'Live' : 'Connecting...')}</span><span>{hub.online} {t('online in community')}</span></div>
        </header>
        <nav className="community-main-nav" aria-label={t('Community navigation')}>
          {([{ id: 'people', name: 'Explore', icon: Users, detail: 'Find your speaking circle' }, ...COMMUNITY_SECTIONS] as const).map(item => {
            const Icon = item.icon
            return <button type="button" key={item.id} aria-pressed={mode === item.id} className={cn(mode === item.id && 'is-active')} onClick={() => selectMode(item.id)}><span className="community-nav-icon"><Icon size={19} /></span><span><b>{t(item.name)}</b><small>{t(item.detail)}</small></span>{item.id === 'voice' || item.id === 'partner' ? <span className="community-nav-count">{item.id === 'voice' ? hub.rooms.length : hub.available.filter(name => name !== hub.selfName).length}</span> : null}</button>
          })}
        </nav>

        <SpeakingHub hub={hub} invitedRoom={searchParams.get('room')} view={mode === 'partner' ? 'partner' : mode === 'voice' ? 'rooms' : 'hidden'} />
        {!hub.room && (mode === 'questions' || mode === 'admissions') ? <section className="community-speaking-workspace"><DiscussionRoom key={mode} roomId={mode === 'questions' ? 'hard-questions' : 'study-abroad'} title={mode === 'questions' ? 'Hard Questions' : 'Study Abroad Lounge'} description={mode === 'questions' ? 'Ask difficult questions and work through answers together.' : 'A shared room for applications, scholarships, visas and university life.'} /></section> : null}

        {mode === 'people' && !hub.room ? <section className="community-layout">
          <div className="community-feed-heading">
            <div><span className="community-eyebrow"><Sparkles size={15} />{t('Find your speaking circle')}</span><h1>{t('Real people.')} <em>{t('Better conversations.')}</em></h1><p>{t('Find a learner, share a goal and start speaking together.')}</p></div>
            {champion ? <div className="hub-champion community-champion"><button type="button" className="community-champion-profile" onClick={() => navigate('/u/' + encodeURIComponent(champion.nickname), { state: { from: '/community' } })}><span className="community-champion-portrait"><ProfileAvatar src={champion.avatarUrl} name={champion.nickname} alt="" /><Crown size={15} /></span><span className="community-champion-copy"><b>{t('Top learner')}</b><strong>@{champion.nickname}</strong><small>{t('Highest earned XP')}</small></span><span className="community-champion-score"><Zap size={15} />{champion.xp.toLocaleString()}<small>XP</small><ArrowUpRight size={14} /></span></button><details><summary>{t('How it works')}</summary><p>{t('Highest total earned XP among learners with a public profile and visible leaderboard. Ties use streak, then join date. Updates every 30 seconds.')}</p></details></div> : null}
          </div>
          <div className="community-search-bar">
            <label className="community-search-field"><Search size={20} /><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={t('Find study partners...')} aria-label={t('Find study partners by nickname')} />{loading ? <Loader2 size={18} className="animate-spin" /> : null}</label>
            <label className="community-exam-filter"><GraduationCap size={18} /><select aria-label={t('Exam goal')} value={exam} onChange={event => setExam(event.target.value as ExamFilter)}><option value="ALL">{t('All learners')}</option><option value="IELTS">{t('IELTS learners')}</option><option value="SAT">{t('SAT learners')}</option></select></label>
          </div>
          <div className="community-filter-row">
            <div className="community-header-filters"><FilterPill active={sameBandActive} icon={Target} label={t('Same target band')} onClick={toggleBandFilter} /><FilterPill active={sameCountryActive} icon={Globe2} label={t('Same country')} onClick={toggleCountryFilter} /><FilterPill active={onlineActive} icon={Radio} label={t('Online now')} onClick={() => toggleFilter('online')} />{hasFilters ? <button type="button" className="community-clear-filters" onClick={clearFilters}><X size={14} />{t('Clear filters')}</button> : null}</div>
            <label className="community-sort"><ArrowUpDown size={15} /><select value={sort} aria-label={t('Sort learners')} onChange={event => setSort(event.target.value as 'recommended' | 'xp')}><option value="recommended">{t('Best matches')}</option><option value="xp">{t('Most XP')}</option></select></label>
          </div>
          <div className="community-feed-meta" role="status"><span><Users size={15} />{visibleResults.length} {t('learners')}</span><span>{t('Scroll to discover more')}</span></div>
          <div className="community-card-viewport" role="region" aria-label={t('Study partner profiles')} aria-busy={loading} tabIndex={0}>
            {error ? <div className="community-error" role="alert"><p>{error}</p><button type="button" onClick={() => setRefresh(value => value + 1)}><RefreshCw size={16} />{t('Try again')}</button></div> : null}
            {!loading && !error && ranked.length === 0 ? <div className="community-empty"><Users size={36} /><h2>{t('No matching learners yet')}</h2><p>{t('Remove one or two filters to discover more study partners.')}</p><button type="button" onClick={clearFilters}>{t('Show all learners')}</button></div> : null}
            <div className="community-card-grid">{loading && results.length === 0 ? Array.from({ length: 6 }, (_, index) => <LearnerSkeleton key={index} />) : ranked.map((learner, index) => <LearnerCard key={learner.nickname ?? [learner.xp,learner.level,index].join('-')} learner={learner} score={matchScore(learner, account)} featured={learner.nickname === champion?.nickname} index={index} available={!!learner.nickname && learner.nickname !== hub.selfName && hub.available.includes(learner.nickname)} canTalk={hub.connected && !hub.room && !hub.busy && !hub.invitation && !!learner.nickname && learner.nickname !== hub.selfName && hub.available.includes(learner.nickname)} onTalk={() => learner.nickname && void hub.invite(learner.nickname)} onOpen={() => learner.nickname && navigate('/u/' + encodeURIComponent(learner.nickname), { state: { from: '/community' } })} />)}</div>
          </div>
        </section> : null}
      </div>
    </main>
  )
}

function FilterPill({ active, icon: Icon, label, onClick }: { active: boolean; icon: typeof Target; label: string; onClick: () => void }) {
  return <button type="button" aria-pressed={active} onClick={onClick} className={cn('community-filter-pill', active && 'is-active')}><Icon className="h-5 w-5" />{label}</button>
}

function LearnerCard({ learner, score, featured, index, onOpen, available, canTalk, onTalk }: { learner: LearnerSearchResult; score: number; featured: boolean; index: number; onOpen: () => void; available: boolean; canTalk: boolean; onTalk: () => void }) {
  const t = useCommunityCopy()
  const reducedMotion = useReducedMotion()
  return (
    <motion.article
      initial={reducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: Math.min(index * 0.025, 0.15), duration: reducedMotion ? 0 : 0.3 }}
      className={cn('community-learner-card', featured && 'is-featured')}
    >
      <div className="community-card-cover" aria-hidden="true"><span /><span /></div>
      <div className="community-card-topline"><span className={cn('community-availability', available ? 'is-ready' : learner.online && 'is-online')}><i />{t(available ? 'Ready to talk' : learner.online ? 'Online now' : 'Offline')}</span><span className="community-level">{t('Level')} {learner.level}</span></div>
      {featured ? (
        <span className="community-top-badge">
          <span className="community-crown-emblem" aria-hidden="true"><Crown className="h-5 w-5" /></span>
          <span> {t('Top learner')} </span>
        </span>
      ) : null}
      <div className="community-avatar-ring">
        <div className="community-avatar"><ProfileAvatar src={learner.avatarUrl} name={learner.nickname} alt="" /></div>
        <span className={cn('community-presence', learner.online && 'is-online')} title={t(learner.online ? 'Online now' : 'Offline')} />
      </div>
      <h2>@{learner.nickname ?? 'learner'}</h2>
      <p className="community-country"><Globe2 className="h-3.5 w-3.5" /> {learner.country || t('Global learner')}</p>
      <div className="community-goal-row"><span><Target size={12} />{learner.targetExam ? targetLabel(learner) : t('Open study goal')}</span>{learner.targetUniversitySlug ? <span><GraduationCap size={12} />{learner.targetUniversitySlug.replace(/-/g, ' ')}</span> : null}</div>
      <div className="community-stat-row">
        <span><Zap size={14} /><b>{learner.xp.toLocaleString()}</b><small> <UiText text={"XP earned"} /> </small></span>
        <span><Flame size={14} /><b>{learner.streak}</b><small> <UiText text={"day streak"} /> </small></span>
        <span><Award size={14} /><b>{learner.badgeCount}</b><small>{t('badges')}</small></span>
      </div>
      {available ? <button type="button" className="community-speak-button" disabled={!canTalk} onClick={onTalk}><Mic size={17} />{t('Speak together')}<ArrowUpRight size={15} /></button> : null}
      <div className="community-card-footer">
        <span className="community-match-mini" title={t('Based on shared study goals, country and activity')}><i style={{ '--match': `${score * 3.6}deg` } as React.CSSProperties} /><span>{score}%<small>{t('Match')}</small></span></span>
        <button type="button" disabled={!learner.nickname} onClick={onOpen}> <UiText text={"View profile"} /><ArrowUpRight size={15} /></button>
      </div>
    </motion.article>
  )
}

function LearnerSkeleton() {
  return (
    <div className="community-learner-card community-skeleton" aria-hidden="true">
      <span className="community-skeleton-avatar" /><span className="community-skeleton-line is-short" /><span className="community-skeleton-line" /><span className="community-skeleton-block" /><span className="community-skeleton-button" />
    </div>
  )
}
