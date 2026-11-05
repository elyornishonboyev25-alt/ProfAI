import UiText from '@/components/common/UiText'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowDownWideNarrow,
  ArrowUpRight,
  ArrowUpWideNarrow,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  FileSearch,
  Headphones,
  Layers3,
  Lock,
  Mic,
  PenLine,
  PlayCircle,
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
import FullMockResults from '@/components/ielts/FullMockResults'
import type { WritingAnalysisEntry } from '@/utils/writingAnalysisStorage'
import type { ExaminerTurn, SpeakingEvaluation } from '@/services/speakingAI'
import { getResultsHistory, type MockResultDetail, type MockSectionAnalyze, type ResultRecord, type ResultSkill } from '@/utils/resultsHistory'
import { getFullMockById, getFullMockResultGroups, type MockSectionKey } from '@/utils/ieltsMockCatalog'
import { ACCOUNT_DATA_EVENT } from '@/utils/accountStorage'
import { getSATReviewTests } from '@/features/sat/catalog'
import { loadSATAttempt } from '@/features/sat/attemptStorage'
import '@/styles/my-results.css'

type FilterKey = 'all' | ResultSkill

const SKILL_FILTERS: Array<{ key: FilterKey; exam: string; label: string; icon: typeof BookOpen }> = [
  { key: 'all', exam: 'IELTS + SAT', label: 'All results', icon: Layers3 },
  { key: 'reading', exam: 'IELTS', label: 'Reading', icon: BookOpen },
  { key: 'listening', exam: 'IELTS', label: 'Listening', icon: Headphones },
  { key: 'writing', exam: 'IELTS', label: 'Writing', icon: PenLine },
  { key: 'speaking', exam: 'IELTS', label: 'Speaking', icon: Mic },
  { key: 'mock', exam: 'IELTS', label: 'Full mocks', icon: Trophy },
  { key: 'sat', exam: 'SAT', label: 'Digital SAT', icon: Sigma },
]

const SKILL_ICONS: Record<ResultSkill, typeof BookOpen> = {
  reading: BookOpen,
  listening: Headphones,
  writing: PenLine,
  speaking: Mic,
  mock: Trophy,
  sat: Sigma,
}

const MOCK_SECTION_ICONS: Record<MockSectionKey, typeof BookOpen> = {
  listening: Headphones,
  reading: BookOpen,
  writing: PenLine,
  speaking: Mic,
}

type SpeakingView = { evaluation: SpeakingEvaluation; transcript?: ExaminerTurn[]; modeLabel: string }

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
  const location = useLocation()
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
  const [speakingView, setSpeakingView] = useState<SpeakingView | null>(null)
  const returnedMock = (location.state as { fullMockReview?: { mockId: string; completedAt: string } } | null)?.fullMockReview
  const [openMock, setOpenMock] = useState<string | null>(null)
  const [archivedReport, setArchivedReport] = useState<MockResultDetail | null>(null)
  const [historyVersion, setHistoryVersion] = useState(0)

  // Results saved in another tab or synced in the background appear without a reload.
  useEffect(() => {
    const refresh = () => setHistoryVersion((version) => version + 1)
    window.addEventListener('storage', refresh)
    window.addEventListener(ACCOUNT_DATA_EVENT, refresh)
    window.addEventListener('smarttest:attempt-submitted', refresh)
    return () => {
      window.removeEventListener('storage', refresh)
      window.removeEventListener(ACCOUNT_DATA_EVENT, refresh)
      window.removeEventListener('smarttest:attempt-submitted', refresh)
    }
  }, [])

  // Keep older submitted SAT slots visible now that results no longer pass through the lab.
  useEffect(() => {
    if (!userId) return
    getSATReviewTests().forEach((test) => loadSATAttempt(test.id))
    setHistoryVersion((version) => version + 1)
  }, [userId])

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
    else if (target.type === 'speaking') {
      if (target.entry.evaluation) setSpeakingView({ evaluation: target.entry.evaluation, transcript: target.entry.transcript, modeLabel: target.entry.modeLabel })
    } else if (target.type === 'sat') navigate(`/sat/results/${encodeURIComponent(target.attemptId)}`)
    else navigate(`/results/${target.testId}`, { state: { result: target.result, returnTo: '/profile' } })
  }

  // Coming back from a section review re-opens that mock's sections.
  useEffect(() => {
    if (!returnedMock) return
    const match = records.find((record) => record.mock?.mockId === returnedMock.mockId && record.mock.completedAt === returnedMock.completedAt)
    if (match) setOpenMock(match.id)
  }, [records, returnedMock?.mockId, returnedMock?.completedAt])

  const openMockSection = (detail: MockResultDetail, target: MockSectionAnalyze, entry?: WritingAnalysisEntry) => {
    if (target.type === 'writing') setWritingEntry(entry ?? target.entries[0])
    else if (target.type === 'speaking') setSpeakingView({ evaluation: target.evaluation, transcript: target.transcript, modeLabel: target.label })
    else navigate(target.path, { state: {
      reviewPayload: { result: target.result, showCorrectAnswers: true },
      fromResults: false,
      returnTo: '/profile',
      fullMockReview: { mockId: detail.mockId, completedAt: detail.completedAt },
    } })
  }

  const openMockReport = (detail: MockResultDetail) => {
    if (detail.archived) setArchivedReport(detail)
    else navigate(`/mock/ielts/${detail.mockId}`, { state: { from: 'profile' } })
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
                <span className="mr-title-desktop"><UiText text="Every result." /> <span><UiText text="One clear record." /></span></span>
                <span className="mr-title-mobile"><UiText text="My Results" /></span>
              </h1>
              <p className="mr-subtitle">
                <UiText text="Every IELTS and SAT test you finish is saved here in order. Open any result to analyze it question by question." />
              </p>
              <div className="mr-hero-actions">
                <button type="button" className="mr-button primary" onClick={() => navigate('/dashboard')}>
                  <UiText text="Start practicing" /> <ArrowUpRight aria-hidden="true" />
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
                      <span><UiText text={group.label} /></span>
                      <small>{group.items.length}</small>
                    </h3>
                    <ol className="mr-rows">
                      {group.items.map((record) => {
                        const Icon = SKILL_ICONS[record.skill]
                        const duration = formatDuration(record.durationSec)
                        const mock = record.mock
                        if (mock) {
                          const open = openMock === record.id
                          const panelId = `mr-mock-${record.id}`
                          const toggle = () => setOpenMock(open ? null : record.id)
                          return (
                            <li key={record.id} className={`mr-row mr-mock-row tone-${record.tone}${open ? ' is-open' : ''}`}>
                              <span className="mr-seq" aria-label={`${c('Result')} ${record.sequence}`}>#{record.sequence}</span>
                              <span className="mr-mark is-mock">
                                <Icon aria-hidden="true" />
                                <small>MOCK</small>
                              </span>
                              <div className="mr-row-main">
                                <p className="mr-row-kind">
                                  IELTS · {c('Full mock')}
                                  <span className={`mr-tag${mock.mode === 'practice' ? ' is-muted' : ''}`}>{c(mock.mode === 'exam' ? 'Exam mode' : 'Practice mode')}</span>
                                  {!mock.complete ? <span className="mr-tag is-muted">{c('In progress')}</span> : null}
                                </p>
                                <h4 title={record.title}>{record.title}</h4>
                                <p className="mr-row-meta">
                                  <span><CalendarDays aria-hidden="true" />{formatDate(record.completedAt)} · {formatTime(record.completedAt)}</span>
                                  {duration ? <span><Clock3 aria-hidden="true" />{duration}</span> : null}
                                </p>
                              </div>
                              <ul className="mr-stats">
                                {record.stats.map((stat) => (
                                  <li key={stat.label}>
                                    <small>{stat.label}</small>
                                    <b>{stat.value}</b>
                                  </li>
                                ))}
                              </ul>
                              <div className="mr-score">
                                {record.score ? (
                                  <>
                                    <b>{record.score.value}</b>
                                    <small>{c('Overall')}</small>
                                  </>
                                ) : (
                                  <>
                                    <b className="is-empty">—</b>
                                    <small>{c(mock.complete ? 'Assessment pending' : 'In progress')}</small>
                                  </>
                                )}
                              </div>
                              <button type="button" className="mr-analyze mr-mock-toggle" aria-expanded={open} aria-controls={panelId} onClick={toggle}>
                                <UiText text="Sections" />
                                <ChevronDown aria-hidden="true" />
                              </button>
                              {open ? (
                                <div className="mr-mock-panel" id={panelId}>
                                  <ol className="mr-mock-sections">
                                    {mock.sections.map((section) => {
                                      const SectionIcon = MOCK_SECTION_ICONS[section.key]
                                      const analyze = section.analyze
                                      return (
                                        <li key={section.key} className={`mr-mock-section is-${section.state}`}>
                                          <span className="mr-mock-section-icon"><SectionIcon aria-hidden="true" /></span>
                                          <div className="mr-mock-section-copy">
                                            <strong>{section.title}</strong>
                                            <small>
                                              {section.state === 'scored' ? (section.detail?.includes('/') ? `${section.detail} ${c('correct')}` : section.detail)
                                                : section.state === 'pending' ? c('Assessment pending')
                                                  : section.state === 'hidden' ? c('Completed · score after Speaking')
                                                    : section.state === 'active' ? c('In progress')
                                                      : c('Not taken yet')}
                                            </small>
                                          </div>
                                          <span className="mr-mock-section-band">
                                            {section.band ? <><b>{section.band}</b><small>{c('Band')}</small></>
                                              : section.state === 'hidden' ? <Lock aria-label={c('Locked')} />
                                                : section.state === 'pending' ? <CheckCircle2 aria-hidden="true" />
                                                  : <b className="is-empty">—</b>}
                                          </span>
                                          <div className="mr-mock-section-actions">
                                            {analyze?.type === 'writing' && analyze.entries.length > 1
                                              ? analyze.entries.map((entry) => (
                                                  <button key={entry.attemptKey} type="button" className="mr-mock-analyze" onClick={() => openMockSection(mock, analyze, entry)}>
                                                    {entry.taskType === 'task1' ? 'Task 1' : 'Task 2'}<ChevronRight aria-hidden="true" />
                                                  </button>
                                                ))
                                              : analyze
                                                ? <button type="button" className="mr-mock-analyze" onClick={() => openMockSection(mock, analyze)}><UiText text="Analyze" /><ChevronRight aria-hidden="true" /></button>
                                                : null}
                                          </div>
                                        </li>
                                      )
                                    })}
                                  </ol>
                                  <div className="mr-mock-footer">
                                    <small>
                                      {c(mock.complete
                                        ? 'Overall band = the average of the four section bands, rounded to the nearest half band.'
                                        : mock.mode === 'exam'
                                          ? 'Exam mode: section scores are revealed after Speaking.'
                                          : 'Practice mode: each section shows its band as soon as you finish it.')}
                                    </small>
                                    <button type="button" className="mr-button" onClick={() => openMockReport(mock)}>
                                      {mock.complete ? <><Trophy aria-hidden="true" /> <UiText text="Full report" /></> : <><PlayCircle aria-hidden="true" /> <UiText text="Continue mock" /></>}
                                    </button>
                                  </div>
                                </div>
                              ) : null}
                            </li>
                          )
                        }
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
                  <button type="button" className="mr-button primary" onClick={() => navigate('/dashboard')}>
                    <UiText text="Browse tests" /> <ArrowUpRight aria-hidden="true" />
                  </button>
                )}
              </div>
            )}
          </section>
        </Reveal>
      </div>

      {writingEntry ? <WritingResultModal entry={writingEntry} onClose={() => setWritingEntry(null)} /> : null}

      {speakingView ? createPortal(
        <div className="fixed inset-0 z-[250] overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-label={c('Speaking review')}>
          <div className="mx-auto max-w-5xl rounded-3xl bg-gradient-to-br from-white via-red-50 to-white py-6 shadow-2xl">
            <SpeakingResult
              evaluation={speakingView.evaluation}
              transcript={speakingView.transcript}
              modeLabel={speakingView.modeLabel}
              reviewMode
              onRetry={() => {}}
              onExit={() => setSpeakingView(null)}
            />
          </div>
        </div>,
        document.body,
      ) : null}

      {archivedReport ? (() => {
        const mock = getFullMockById(archivedReport.mockId)
        const saved = getFullMockResultGroups(userId).find((group) => group.archived && group.mockId === archivedReport.mockId && group.completedAt === archivedReport.completedAt)
        if (!mock || !saved) return null
        return createPortal(
          <div role="dialog" aria-modal="true" aria-label={c('Saved full mock result')} className="fixed inset-0 z-[270] overflow-y-auto bg-white">
            <FullMockResults mock={mock} results={saved.sections} overall={saved.overallBand} readOnly
              onBack={() => setArchivedReport(null)} onReview={(section) => {
                const result = saved.sections[section.key]?.result
                if (!section.launchPath || !result) return
                setArchivedReport(null)
                openMockSection(archivedReport, { type: 'review', path: section.launchPath, result, mockId: mock.id, section: section.key })
              }} />
          </div>,
          document.body,
        )
      })() : null}
    </div>
  )
}
