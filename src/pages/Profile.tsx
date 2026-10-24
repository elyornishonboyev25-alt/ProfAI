import UiText from '@/components/common/UiText'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  ArrowDownWideNarrow,
  ArrowUpRight,
  ArrowUpWideNarrow,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  ChevronRight,
  Clock3,
  FileSearch,
  Headphones,
  Layers3,
  Mic,
  PenLine,
  Search,
  Sigma,
  Trophy,
} from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { useAsyncData } from '@/hooks/useAsyncData'
import type { ProfileOverview } from '@/types/platform'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { useSpeakingStore } from '@/store/speakingStore'
import { Reveal } from '@/components/fx'
import { useCopy } from '@/i18n/interface'
import WritingResultModal from '@/components/WritingResultModal'
import SpeakingResult from '@/components/speaking/SpeakingResult'
import type { WritingAnalysisEntry } from '@/utils/writingAnalysisStorage'
import type { SpeakingSessionRecord } from '@/store/speakingStore'
import { getResultsHistory, type ResultRecord, type ResultSkill } from '@/utils/resultsHistory'
import '@/styles/my-results.css'

type FilterKey = 'all' | ResultSkill

const SKILL_FILTERS: Array<{ key: FilterKey; exam: string; label: string; icon: typeof BookOpen }> = [
  { key: 'all', exam: 'IELTS + SAT', label: 'All results', icon: Layers3 },
  { key: 'reading', exam: 'IELTS', label: 'Reading', icon: BookOpen },
  { key: 'listening', exam: 'IELTS', label: 'Listening', icon: Headphones },
  { key: 'writing', exam: 'IELTS', label: 'Writing', icon: PenLine },
  { key: 'speaking', exam: 'IELTS', label: 'Speaking', icon: Mic },
  { key: 'sat', exam: 'SAT', label: 'Digital SAT', icon: Sigma },
]

const SKILL_ICONS: Record<ResultSkill, typeof BookOpen> = {
  reading: BookOpen,
  listening: Headphones,
  writing: PenLine,
  speaking: Mic,
  sat: Sigma,
}

const UZ_MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']

function formatDuration(seconds: number | null) {
  if (!seconds) return null
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours) return `${hours}h ${String(minutes).padStart(2, '0')}m`
  if (minutes) return `${minutes}m ${String(Math.round(seconds % 60)).padStart(2, '0')}s`
  return `${Math.round(seconds)}s`
}

function bestScore(records: ResultRecord[]) {
  return records.reduce<ResultRecord | null>((best, record) => (
    record.score && (!best?.score || Number(record.score.value) > Number(best.score.value)) ? record : best
  ), null)
}

export default function Profile() {
  const navigate = useNavigate()
  const { c, language } = useCopy()
  const user = useAuthStore((state: AuthState) => state.user)
  const userId = user?.id
  const speakingSessions = useSpeakingStore((state) => state.sessions)
  const { data: overview } = useAsyncData<ProfileOverview | null>(
    () => (userId ? apiClient.get('/profile/overview') : Promise.resolve(null)),
    [userId],
  )
  const [filter, setFilter] = useState<FilterKey>('all')
  const [query, setQuery] = useState('')
  const [newestFirst, setNewestFirst] = useState(true)
  const [writingEntry, setWritingEntry] = useState<WritingAnalysisEntry | null>(null)
  const [speakingEntry, setSpeakingEntry] = useState<SpeakingSessionRecord | null>(null)
  const [historyVersion, setHistoryVersion] = useState(0)

  // Results saved in another tab or synced in the background appear without a reload.
  useEffect(() => {
    const refresh = () => setHistoryVersion((version) => version + 1)
    window.addEventListener('storage', refresh)
    window.addEventListener('smarttest:attempt-submitted', refresh)
    return () => {
      window.removeEventListener('storage', refresh)
      window.removeEventListener('smarttest:attempt-submitted', refresh)
    }
  }, [])

  const records = useMemo(
    () => getResultsHistory(userId, speakingSessions, overview?.recentAttempts ?? []),
    // historyVersion re-reads browser storage after external writes.
    [userId, speakingSessions, overview?.recentAttempts, historyVersion],
  )

  // Chrome ships without Uzbek month names (it prints "2026 M09 27"), so Uzbek
  // dates are composed from UZ_MONTHS and the 24-hour en-GB clock.
  const dateLocale = language === 'ru' ? 'ru-RU' : 'en-GB'
  const isUzbek = language === 'uz'
  const ieltsRecords = records.filter((record) => record.exam === 'IELTS')
  const satRecords = records.filter((record) => record.exam === 'SAT')
  const bestIelts = bestScore(ieltsRecords)
  const bestSat = bestScore(satRecords.filter((record) => record.score?.label === 'SAT score'))
  const latest = records[records.length - 1] ?? null

  const filterSummaries = useMemo(() => SKILL_FILTERS.map((item) => {
    const matching = item.key === 'all' ? records : records.filter((record) => record.skill === item.key)
    const lastScored = [...matching].reverse().find((record) => record.score)
    return { ...item, count: matching.length, latestScore: item.key === 'all' ? null : lastScored?.score ?? null }
  }), [records])

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const filtered = records.filter((record) => (
      (filter === 'all' || record.skill === filter)
      && (!needle || `${record.title} ${record.skillLabel} ${record.exam}`.toLowerCase().includes(needle))
    ))
    return newestFirst ? filtered.reverse() : filtered
  }, [filter, newestFirst, query, records])

  const groups = useMemo(() => {
    const byMonth = new Map<string, { label: string; items: ResultRecord[] }>()
    visible.forEach((record) => {
      const date = new Date(record.completedAt)
      const key = `${date.getFullYear()}-${date.getMonth()}`
      if (!byMonth.has(key)) {
        byMonth.set(key, {
          label: isUzbek
            ? `${UZ_MONTHS[date.getMonth()]} ${date.getFullYear()}`
            : date.toLocaleDateString(dateLocale, { month: 'long', year: 'numeric' }),
          items: [],
        })
      }
      byMonth.get(key)!.items.push(record)
    })
    return [...byMonth.values()]
  }, [dateLocale, isUzbek, visible])

  const openAnalysis = (record: ResultRecord) => {
    const target = record.analyze
    if (!target) return
    if (target.type === 'writing') setWritingEntry(target.entry)
    else if (target.type === 'speaking') setSpeakingEntry(target.entry)
    else if (target.type === 'sat') navigate(`/sat/mistakes?attempt=${encodeURIComponent(target.attemptId)}`)
    else navigate(`/results/${target.testId}`, { state: { result: target.result } })
  }

  const formatDate = (time: number) => {
    const date = new Date(time)
    return isUzbek
      ? `${date.getDate()}-${UZ_MONTHS[date.getMonth()]}, ${date.getFullYear()}`
      : date.toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' })
  }
  const formatTime = (time: number) => new Date(time).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="my-results workspace-page relative min-h-screen w-full overflow-x-clip px-4 py-8 sm:px-6 lg:px-8">
      <div className="relative mx-auto w-full max-w-7xl">
        <Reveal>
          <section className="mr-glass mr-hero">
            <div className="mr-hero-copy">
              <span className="mr-chip"><FileSearch aria-hidden="true" /><UiText text="My Results" /></span>
              <h1 className="mr-title">
                <UiText text="Every result." /> <span><UiText text="One clear record." /></span>
              </h1>
              <p className="mr-subtitle">
                <UiText text="Every IELTS and SAT test you finish is saved here in order. Open any result to analyze it question by question." />
              </p>
              <div className="mr-hero-actions">
                <button type="button" className="mr-button primary" onClick={() => navigate('/test-preparation')}>
                  <UiText text="Start practicing" /> <ArrowUpRight aria-hidden="true" />
                </button>
                <button type="button" className="mr-button" onClick={() => navigate('/review-mistakes')}>
                  <UiText text="Review mistakes" /> <BrainCircuit aria-hidden="true" />
                </button>
                <button type="button" className="mr-button ghost" onClick={() => navigate('/leaderboard')}>
                  <Trophy aria-hidden="true" /> <UiText text="Leaderboard" />
                </button>
              </div>
            </div>

            <dl className="mr-record">
              <div className="mr-record-total">
                <dt><UiText text="Tests completed" /></dt>
                <dd>{records.length}</dd>
                <span>{ieltsRecords.length} IELTS · {satRecords.length} SAT</span>
              </div>
              <div>
                <dt><UiText text="Best IELTS band" /></dt>
                <dd>{bestIelts?.score?.value ?? '—'}</dd>
                <span>{bestIelts ? c(bestIelts.skillLabel) : c('No IELTS result yet')}</span>
              </div>
              <div>
                <dt><UiText text="Best SAT score" /></dt>
                <dd>{bestSat?.score?.value ?? '—'}</dd>
                <span>{bestSat ? '/ 1600' : c('No full SAT yet')}</span>
              </div>
              <div>
                <dt><UiText text="Last test" /></dt>
                <dd className="is-date">{latest ? formatDate(latest.completedAt) : '—'}</dd>
                <span>{latest ? `${latest.exam} · ${c(latest.skillLabel)}` : c('Nothing saved yet')}</span>
              </div>
            </dl>
          </section>
        </Reveal>

        {!user ? (
          <Reveal className="mt-5">
            <button type="button" className="mr-glass mr-guest" onClick={() => navigate('/register')}>
              <span>
                <strong><UiText text="Preview mode" /></strong>
                <small><UiText text="Create an account to save every result and analyze it later." /></small>
              </span>
              <ArrowUpRight aria-hidden="true" />
            </button>
          </Reveal>
        ) : null}

        <Reveal className="mt-6">
          <div className="mr-filters" role="tablist" aria-label={c('Filter results')}>
            {filterSummaries.map((item) => {
              const Icon = item.icon
              const active = filter === item.key
              return (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`mr-glass mr-filter${active ? ' is-active' : ''}`}
                  onClick={() => setFilter(item.key)}
                >
                  <span className="mr-filter-icon"><Icon aria-hidden="true" /></span>
                  <span className="mr-filter-copy">
                    <small>{item.exam}</small>
                    <strong>{c(item.label)}</strong>
                  </span>
                  <span className="mr-filter-meta">
                    <b>{item.count}</b>
                    <small>{item.latestScore ? `${c('Latest')} ${item.latestScore.value}` : c(item.count === 1 ? 'result' : 'results')}</small>
                  </span>
                </button>
              )
            })}
          </div>
        </Reveal>

        <Reveal className="mt-6">
          <section className="mr-glass mr-list" aria-labelledby="mr-list-title">
            <header className="mr-list-head">
              <div>
                <p className="mr-eyebrow"><UiText text="Results history" /></p>
                <h2 id="mr-list-title">
                  {c(SKILL_FILTERS.find((item) => item.key === filter)?.label ?? 'All results')}
                  <span>{visible.length}</span>
                </h2>
              </div>
              <div className="mr-tools">
                <label className="mr-search">
                  <Search aria-hidden="true" />
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={c('Search tests')}
                    aria-label={c('Search tests')}
                  />
                </label>
                <button type="button" className="mr-sort" onClick={() => setNewestFirst((value) => !value)}>
                  {newestFirst ? <ArrowDownWideNarrow aria-hidden="true" /> : <ArrowUpWideNarrow aria-hidden="true" />}
                  {c(newestFirst ? 'Newest first' : 'Oldest first')}
                </button>
              </div>
            </header>

            {groups.length ? (
              <div className="mr-groups">
                {groups.map((group) => (
                  <div key={group.label} className="mr-group">
                    <h3 className="mr-group-title">
                      <CalendarDays aria-hidden="true" />
                      <span>{group.label}</span>
                      <small>{group.items.length}</small>
                    </h3>
                    <ol className="mr-rows">
                      {group.items.map((record) => {
                        const Icon = SKILL_ICONS[record.skill]
                        const duration = formatDuration(record.durationSec)
                        return (
                          <li key={record.id} className={`mr-row tone-${record.tone}`}>
                            <span className="mr-seq" aria-label={`${c('Result')} ${record.sequence}`}>#{record.sequence}</span>
                            <span className={`mr-mark is-${record.exam.toLowerCase()}`}>
                              <Icon aria-hidden="true" />
                              <small>{record.exam}</small>
                            </span>
                            <div className="mr-row-main">
                              <p className="mr-row-kind">
                                {record.exam} · {c(record.skillLabel)}
                                {record.partial ? <span className="mr-tag"><UiText text="Partial" /></span> : null}
                                {record.id.startsWith('server-') ? <span className="mr-tag is-muted"><UiText text="Synced" /></span> : null}
                              </p>
                              <h4 title={record.title}>{record.title}</h4>
                              <p className="mr-row-meta">
                                <span><CalendarDays aria-hidden="true" />{formatDate(record.completedAt)} · {formatTime(record.completedAt)}</span>
                                {duration ? <span><Clock3 aria-hidden="true" />{duration}</span> : null}
                              </p>
                            </div>
                            <ul className="mr-stats">
                              {record.stats.map((stat) => (
                                <li key={stat.label} className={stat.emphasis ? `is-${stat.emphasis}` : undefined}>
                                  <small>{c(stat.label)}</small>
                                  <b>{stat.value}</b>
                                </li>
                              ))}
                            </ul>
                            <div className="mr-score">
                              {record.score ? (
                                <>
                                  <b>{record.score.value}</b>
                                  <small>{c(record.score.label)}</small>
                                </>
                              ) : (
                                <>
                                  <b className="is-empty">—</b>
                                  <small>{c(record.partial ? 'Not scored' : 'Practice')}</small>
                                </>
                              )}
                            </div>
                            <button
                              type="button"
                              className="mr-analyze"
                              disabled={!record.analyze}
                              title={record.analyze ? undefined : c('Detailed answers are saved on the device where this test was taken.')}
                              onClick={() => openAnalysis(record)}
                            >
                              <UiText text="Analyze" />
                              <ChevronRight aria-hidden="true" />
                            </button>
                          </li>
                        )
                      })}
                    </ol>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mr-empty">
                <span><FileSearch aria-hidden="true" /></span>
                <p>{c(records.length ? 'No results match this view' : 'No results yet')}</p>
                <small>
                  {c(records.length
                    ? 'Try another skill or clear the search.'
                    : 'Finish an IELTS or SAT test and its result will appear here, ready to analyze.')}
                </small>
                {records.length ? (
                  <button type="button" className="mr-button" onClick={() => { setFilter('all'); setQuery('') }}>
                    <UiText text="Show all results" />
                  </button>
                ) : (
                  <button type="button" className="mr-button primary" onClick={() => navigate('/test-preparation')}>
                    <UiText text="Browse tests" /> <ArrowUpRight aria-hidden="true" />
                  </button>
                )}
              </div>
            )}
          </section>
        </Reveal>
      </div>

      {writingEntry ? <WritingResultModal entry={writingEntry} onClose={() => setWritingEntry(null)} /> : null}

      {speakingEntry?.evaluation ? createPortal(
        <div className="fixed inset-0 z-[250] overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-label={c('Speaking review')}>
          <div className="mx-auto max-w-5xl rounded-3xl bg-gradient-to-br from-white via-red-50 to-white py-6 shadow-2xl">
            <SpeakingResult
              evaluation={speakingEntry.evaluation}
              transcript={speakingEntry.transcript}
              modeLabel={speakingEntry.modeLabel}
              reviewMode
              onRetry={() => {}}
              onExit={() => setSpeakingEntry(null)}
            />
          </div>
        </div>,
        document.body,
      ) : null}
    </div>
  )
}
