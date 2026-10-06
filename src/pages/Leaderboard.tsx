import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Crown,
  Flame,
  Minus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trophy,
  Users,
  Zap,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import UiText from '@/components/common/UiText'
import { Skeleton } from '@/components/common/Skeleton'
import LeaderboardAvatar from '@/components/leaderboard/LeaderboardAvatar'
import { apiClient } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import { syncSavedSATAttemptResults } from '@/features/sat/resultSync'
import type { LeaderboardResponse, LeaderboardRow } from '@/types/platform'
import '@/styles/leaderboard.css'
import { useCopy } from '@/i18n/interface'

const PERIODS = [
  { value: 'week', label: 'Last 7 days' },
  { value: 'month', label: 'Last 30 days' },
  { value: 'all', label: 'All Time' },
] as const
const PAGE_SIZE = 20
const number = (value: number) => value.toLocaleString('en-US')
const resultLabel = (row: LeaderboardRow) =>
  row.testsCompleted > 0 ? `${row.accuracy.toFixed(1)}%` : '—'

function Movement({ row }: { row: LeaderboardRow }) {
  const { c } = useCopy()
  const Icon =
    row.rankTrend === 'up'
      ? ArrowUpRight
      : row.rankTrend === 'down'
        ? ArrowDownRight
        : Minus
  return (
    <span
      className={`leaderboard-movement is-${row.rankTrend}`}
      title={c('Since the previous board update')}
      aria-label={`${c('Movement')}: ${row.rankDelta > 0 ? '+' : ''}${row.rankDelta}. ${c('Since the previous board update')}`}
    >
      <Icon size={14} aria-hidden="true" />
      {row.rankDelta === 0
        ? '—'
        : `${row.rankDelta > 0 ? '+' : '−'}${Math.abs(row.rankDelta)}`}
    </span>
  )
}

export default function Leaderboard() {
  const { c } = useCopy()
  const navigate = useNavigate()
  const userId = useAuthStore((state) => state.user?.id)
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week')
  const [data, setData] = useState<LeaderboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [syncWarning, setSyncWarning] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    setData(null)
    setUpdatedAt(null)
    setError(null)
    setSyncWarning(false)
    setLoading(true)
    const load = async () => {
      if (!userId) {
        setError('Sign in required to view the leaderboard.')
        setLoading(false)
        return
      }
      try {
        const payload = await apiClient.get<LeaderboardResponse>(
          `/leaderboard?period=${period}`,
          { auth: true, signal: controller.signal },
        )
        if (!active) return
        setData(payload)
        setUpdatedAt(new Date())
        // A partial backfill can still change ranks. Refresh successful saves
        // even if another saved attempt failed to sync.
        void syncSavedSATAttemptResults(userId)
          .then(async (sync) => {
            if (!active || useAuthStore.getState().user?.id !== userId) return
            setSyncWarning(sync.failed > 0)
            try {
              const latest = await apiClient.get<LeaderboardResponse>(
                `/leaderboard?period=${period}`,
                { auth: true, signal: controller.signal },
              )
              if (active) {
                setData(latest)
                setUpdatedAt(new Date())
              }
            } catch {
              if (active) setSyncWarning(true)
            }
          })
          .catch(() => {
            if (active) setSyncWarning(true)
          })
      } catch (fetchError) {
        if (active)
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : 'Failed to load leaderboard.',
          )
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => {
      active = false
      controller.abort()
    }
  }, [userId, period, reloadKey])

  // Never display the previous window under the newly selected label.
  const board = data?.period === period ? data : null
  const rows = useMemo(() => board?.rows ?? [], [board])
  const current = rows.find((row) => row.isCurrentUser) ?? null
  const leader = rows[0] ?? null
  const next = current
    ? rows.find((row) => row.rank === current.rank - 1)
    : null
  const gap =
    next && current ? Math.max(0, next.totalXp - current.totalXp + 1) : 0
  const progress =
    next && current
      ? Math.min(100, (current.totalXp / Math.max(1, next.totalXp + 1)) * 100)
      : current?.rank === 1
        ? 100
        : 0
  const podium = rows.slice(0, 3)
  const summary = useMemo(() => {
    const tested = rows.filter((row) => row.testsCompleted > 0)
    return {
      xp: rows.reduce((sum, row) => sum + row.totalXp, 0),
      average: tested.length
        ? tested.reduce((sum, row) => sum + row.accuracy, 0) / tested.length
        : null,
    }
  }, [rows])
  const filtered = useMemo(
    () =>
      rows.filter((row) =>
        row.fullName
          .toLocaleLowerCase()
          .includes(query.trim().toLocaleLowerCase()),
      ),
    [rows, query],
  )
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const visiblePage = Math.min(page, pageCount)
  const visibleRows = filtered.slice(
    (visiblePage - 1) * PAGE_SIZE,
    visiblePage * PAGE_SIZE,
  )
  const currentVisible = visibleRows.some((row) => row.isCurrentUser)
  const selectPeriod = (value: typeof period) => {
    setPeriod(value)
    setPage(1)
  }
  const refresh = () => setReloadKey((key) => key + 1)

  return (
    <div className="workspace-page leaderboard-studio">
      <div className="leaderboard-content">
        <header className="leaderboard-hero leaderboard-glass">
          <div className="leaderboard-heading">
            <p className="leaderboard-eyebrow">
              <span className="leaderboard-brand-mark">
                <Trophy size={15} />
              </span>
              <UiText text="Learning leaderboard" />
              <span className="leaderboard-track">IELTS + SAT</span>
            </p>
            <h1>
              <UiText text="Global" />{' '}
              <span>
                <UiText text="Leaderboard" />
              </span>
            </h1>
            <p className="leaderboard-intro">
              <UiText text="Every learning session moves you forward. See your progress, meet the leaders and find your next milestone." />
            </p>
            <div
              className="leaderboard-periods"
              role="group"
              aria-label={c('Leaderboard period')}
            >
              {PERIODS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => selectPeriod(value)}
                  aria-pressed={period === value}
                >
                  <UiText text={label} />
                </button>
              ))}
            </div>
            <p className="leaderboard-window">
              <ShieldCheck size={14} aria-hidden="true" />
              <UiText
                text={
                  period === 'all'
                    ? 'Profile XP · All rewarded activities'
                    : 'Rolling window · Midnight UTC · Awarded XP'
                }
              />
            </p>
          </div>
          <div className="leaderboard-personal-card">
            <div className="leaderboard-personal-top">
              <span>
                <UiText text="Your position" />
              </span>
              <span className="leaderboard-personal-icon">
                <Zap size={19} />
              </span>
            </div>
            {loading ? (
              <Skeleton className="my-4 h-20 w-full rounded-xl" />
            ) : (
              <>
                <p className="leaderboard-personal-rank">
                  {current ? `#${current.rank}` : '—'}
                  <span>
                    {current ? (
                      <>
                        <UiText text="of" /> {number(rows.length)}{' '}
                        <UiText text="learners" />
                      </>
                    ) : (
                      <UiText
                        text={
                          error
                            ? 'Rankings unavailable'
                            : 'No ranked activity yet'
                        }
                      />
                    )}
                  </span>
                </p>
                <div className="leaderboard-personal-bottom">
                  <span>
                    <strong>
                      {board ? number(current?.totalXp ?? 0) : '—'}
                    </strong>{' '}
                    XP
                  </span>
                  {current ? (
                    <Movement row={current} />
                  ) : (
                    <ShieldCheck size={18} aria-hidden="true" />
                  )}
                </div>
              </>
            )}
          </div>
        </header>

        <div className="leaderboard-statusbar">
          <p aria-live="polite">
            {loading ? (
              <UiText text="Loading rankings…" />
            ) : updatedAt ? (
              <>
                <span className="leaderboard-status-dot" />
                <UiText text="Updated" />{' '}
                {updatedAt.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                <span className="leaderboard-status-note">
                  <UiText text="Updates may take up to 45 seconds" />
                </span>
              </>
            ) : (
              <UiText text="Rankings unavailable" />
            )}
          </p>
          <button
            className="leaderboard-text-button"
            type="button"
            disabled={loading || !userId}
            onClick={refresh}
          >
            <RefreshCw
              size={14}
              className={loading ? 'leaderboard-spin' : ''}
            />
            <UiText text="Refresh" />
          </button>
        </div>

        {error ? (
          <div className="leaderboard-message is-error" role="alert">
            <ShieldCheck size={20} />
            <p>
              <UiText text={error} />
            </p>
            <button
              type="button"
              onClick={
                userId
                  ? refresh
                  : () =>
                      navigate('/login', {
                        state: { from: { pathname: '/leaderboard' } },
                      })
              }
            >
              <UiText text={userId ? 'Retry' : 'Sign in'} />
            </button>
          </div>
        ) : (
          <>
            {syncWarning && (
              <div className="leaderboard-message" role="status">
                <p>
                  <UiText text="Some saved results could not sync. This board shows the results already saved on the server." />
                </p>
                <button type="button" onClick={refresh}>
                  <UiText text="Retry" />
                </button>
              </div>
            )}

            <section
              className="leaderboard-podium-section"
              aria-labelledby="podium-heading"
              aria-busy={loading}
            >
              <div className="leaderboard-section-heading">
                <div>
                  <p className="leaderboard-eyebrow">
                    <UiText text="THE FRONT RUNNERS" />
                  </p>
                  <h2 id="podium-heading">
                    <UiText text="Leading the way" />
                  </h2>
                </div>
                <span>
                  <UiText text="Top 3" />
                  <Trophy size={17} />
                </span>
              </div>
              {loading ? (
                <div className="leaderboard-podium">
                  {[1, 2, 3].map((rank) => (
                    <Skeleton key={rank} className="h-64 w-full rounded-3xl" />
                  ))}
                </div>
              ) : podium.length ? (
                <div className="leaderboard-podium">
                  {podium.map((row) => (
                    <article
                      key={row.userId}
                      className={`leaderboard-podium-card leaderboard-glass is-rank-${row.rank}`}
                    >
                      <div className="leaderboard-podium-top">
                        <span className="leaderboard-place">
                          <Crown size={14} />
                          <UiText
                            text={
                              row.rank === 1
                                ? 'First place'
                                : row.rank === 2
                                  ? 'Second place'
                                  : 'Third place'
                            }
                          />
                        </span>
                        <Movement row={row} />
                      </div>
                      <div className="leaderboard-podium-person">
                        <div className="leaderboard-podium-avatar">
                          <LeaderboardAvatar row={row} size="lg" />
                          <span className="leaderboard-medallion">
                            {row.rank.toString().padStart(2, '0')}
                          </span>
                        </div>
                        <div className="leaderboard-podium-name">
                          <h3 title={row.fullName}>{row.fullName}</h3>
                          <span>
                            {row.isCurrentUser ? (
                              <UiText text="YOU" />
                            ) : (
                              <UiText text="Learner" />
                            )}
                          </span>
                        </div>
                      </div>
                      <p className="leaderboard-podium-xp">
                        {number(row.totalXp)} <span>XP</span>
                        <Zap size={20} aria-hidden="true" />
                      </p>
                      <div className="leaderboard-podium-stats">
                        <span>
                          <UiText text="Avg. result" />
                          <strong>{resultLabel(row)}</strong>
                        </span>
                        <span>
                          <UiText text="Tests" />
                          <strong>{number(row.testsCompleted)}</strong>
                        </span>
                        <span>
                          <UiText text="Streak" />
                          <strong>
                            <Flame size={13} />
                            {row.streak}d
                          </strong>
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="leaderboard-empty leaderboard-glass">
                  <Trophy size={30} />
                  <h3>
                    <UiText text="Your next session could put you on the board" />
                  </h3>
                  <p>
                    <UiText text="Earn XP from learning activities to claim a place in this period." />
                  </p>
                  <button
                    type="button"
                    className="leaderboard-primary-button"
                    onClick={() => navigate('/ielts')}
                  >
                    <UiText text="Start practicing" />
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </section>

            <div className="leaderboard-main-grid">
              <section
                className="leaderboard-table-panel leaderboard-glass"
                aria-labelledby="rankings-heading"
                aria-busy={loading}
              >
                <div className="leaderboard-table-title">
                  <div>
                    <p className="leaderboard-eyebrow">
                      <UiText text="THE FULL PICTURE" />
                    </p>
                    <h2 id="rankings-heading">
                      <UiText text="Rankings" />
                    </h2>
                  </div>
                  <span className="leaderboard-count">
                    <Users size={15} />
                    {loading ? '—' : number(rows.length)}{' '}
                    <UiText text="learners" />
                  </span>
                </div>
                <label className="leaderboard-search">
                  <Search size={17} aria-hidden="true" />
                  <span className="sr-only">
                    <UiText text="Search learners" />
                  </span>
                  <input
                    type="search"
                    placeholder={c('Search learners')}
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value)
                      setPage(1)
                    }}
                    disabled={loading}
                  />
                </label>
                {loading ? (
                  <div className="leaderboard-table-loading">
                    {[1, 2, 3, 4, 5].map((key) => (
                      <Skeleton key={key} className="h-16 w-full rounded-xl" />
                    ))}
                  </div>
                ) : visibleRows.length ? (
                  <>
                    <table className="leaderboard-table">
                      <caption className="sr-only">
                        {PERIODS.find((item) => item.value === period)?.label}{' '}
                        leaderboard, ordered by XP
                      </caption>
                      <thead>
                        <tr>
                          <th scope="col">
                            <UiText text="Rank" />
                          </th>
                          <th scope="col">
                            <UiText text="Learner" />
                          </th>
                          <th scope="col">
                            <UiText text="Avg. result" />
                          </th>
                          <th scope="col">XP</th>
                          <th scope="col">
                            <UiText text="Movement" />
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleRows.map((row) => (
                          <tr
                            key={row.userId}
                            className={row.isCurrentUser ? 'is-current' : ''}
                          >
                            <td>
                              <span
                                className={`leaderboard-rank ${row.rank <= 3 ? 'is-top' : ''}`}
                              >
                                {row.rank.toString().padStart(2, '0')}
                              </span>
                            </td>
                            <th scope="row">
                              <div className="leaderboard-learner">
                                <LeaderboardAvatar row={row} />
                                <div>
                                  <p title={row.fullName}>
                                    {row.fullName}
                                    {row.isCurrentUser && (
                                      <span className="leaderboard-you">
                                        <UiText text="YOU" />
                                      </span>
                                    )}
                                  </p>
                                  <small>
                                    {row.testsCompleted} <UiText text="tests" />
                                    <span className="leaderboard-mobile-result">
                                      {' '}
                                      · {resultLabel(row)}
                                    </span>
                                  </small>
                                </div>
                              </div>
                            </th>
                            <td className="leaderboard-result">
                              {resultLabel(row)}
                            </td>
                            <td className="leaderboard-table-xp">
                              {number(row.totalXp)}
                              <small>XP</small>
                            </td>
                            <td className="leaderboard-table-movement">
                              <Movement row={row} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="leaderboard-pagination">
                      <p>
                        {(visiblePage - 1) * PAGE_SIZE + 1}–
                        {Math.min(visiblePage * PAGE_SIZE, filtered.length)}{' '}
                        <UiText text="of" /> {number(filtered.length)}
                      </p>
                      <div>
                        <button
                          type="button"
                          aria-label={c('Previous page')}
                          disabled={visiblePage === 1}
                          onClick={() => setPage(visiblePage - 1)}
                        >
                          <ChevronLeft size={17} />
                        </button>
                        <span>
                          {visiblePage} / {pageCount}
                        </span>
                        <button
                          type="button"
                          aria-label={c('Next page')}
                          disabled={visiblePage === pageCount}
                          onClick={() => setPage(visiblePage + 1)}
                        >
                          <ChevronRight size={17} />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="leaderboard-empty is-compact">
                    <Search size={24} />
                    <h3>
                      <UiText
                        text={
                          query.trim() ? 'No learners found' : 'No rankings yet'
                        }
                      />
                    </h3>
                    <p>
                      <UiText
                        text={
                          query.trim()
                            ? 'Try another name or clear your search.'
                            : 'Ranked learners will appear here after earning XP.'
                        }
                      />
                    </p>
                    {query.trim() && (
                      <button
                        type="button"
                        className="leaderboard-text-button"
                        onClick={() => {
                          setQuery('')
                          setPage(1)
                        }}
                      >
                        <UiText text="Clear search" />
                      </button>
                    )}
                  </div>
                )}
                {!loading && current && !currentVisible && (
                  <div className="leaderboard-pinned">
                    <span className="leaderboard-rank">#{current.rank}</span>
                    <div>
                      <strong>
                        <UiText text="Your position" />
                      </strong>
                      <small>{current.fullName}</small>
                    </div>
                    <b>{number(current.totalXp)} XP</b>
                  </div>
                )}
                <p className="leaderboard-table-note">
                  <UiText text="Average result combines test percentages and normalized IELTS bands. Movement is since the previous board update." />
                </p>
              </section>

              <aside
                className="leaderboard-rail"
                aria-label={c('Your progress and ranking rules')}
              >
                <section className="leaderboard-progress-card leaderboard-glass">
                  <div className="leaderboard-card-heading">
                    <span className="leaderboard-red-icon">
                      <Zap size={19} />
                    </span>
                    <h2>
                      <UiText text="Your next milestone" />
                    </h2>
                  </div>
                  {loading ? (
                    <Skeleton className="mt-5 h-32 w-full rounded-xl" />
                  ) : (
                    <>
                      <p className="leaderboard-goal-number">
                        {current?.rank === 1 ? (
                          <Trophy size={36} />
                        ) : next ? (
                          number(gap)
                        ) : (
                          '—'
                        )}
                        <span>
                          <UiText
                            text={
                              current?.rank === 1
                                ? 'You lead this board'
                                : next
                                  ? 'XP to move ahead'
                                  : 'Your ranking starts with XP'
                            }
                          />
                        </span>
                      </p>
                      <div
                        className="leaderboard-progress-track"
                        role="progressbar"
                        aria-label={c('XP toward the next position')}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(progress)}
                      >
                        <span style={{ width: `${progress}%` }} />
                      </div>
                      <p className="leaderboard-goal-copy">
                        {next ? (
                          <>
                            <UiText text="Next position" />{' '}
                            <strong>#{next.rank}</strong> ·{' '}
                            {number(next.totalXp)} XP
                          </>
                        ) : (
                          <UiText
                            text={
                              current?.rank === 1
                                ? 'Keep learning to build on your lead.'
                                : 'Practice IELTS or SAT to earn your first points.'
                            }
                          />
                        )}
                      </p>
                      <button
                        className="leaderboard-primary-button"
                        type="button"
                        onClick={() => navigate('/ielts')}
                      >
                        <UiText text="Practice IELTS" />
                        <ArrowRight size={16} />
                      </button>
                      <button
                        className="leaderboard-secondary-button"
                        type="button"
                        onClick={() => navigate('/sat')}
                      >
                        <UiText text="Practice SAT" />
                        <ArrowRight size={16} />
                      </button>
                    </>
                  )}
                </section>
                <section className="leaderboard-rules-card leaderboard-glass">
                  <div className="leaderboard-card-heading">
                    <span className="leaderboard-silver-icon">
                      <ShieldCheck size={19} />
                    </span>
                    <h2>
                      <UiText text="How rankings work" />
                    </h2>
                  </div>
                  <p className="leaderboard-rule-intro">
                    <UiText text="Clear rules. Real progress." />
                  </p>
                  {loading ? (
                    <Skeleton className="mt-4 h-36 w-full rounded-xl" />
                  ) : (
                    <ol>
                      {(board?.antiCheatRules ?? []).map((rule, index) => (
                        <li key={rule}>
                          <span>{index + 1}</span>
                          <p>
                            <UiText text={rule} />
                          </p>
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
                {board && rows.length > 0 && (
                  <section className="leaderboard-snapshot leaderboard-glass">
                    <p className="leaderboard-eyebrow">
                      <UiText text="Board Snapshot" />
                    </p>
                    <div>
                      <span>
                        <UiText text="Total XP" />
                        <strong>{number(summary.xp)}</strong>
                      </span>
                      <span>
                        <UiText text="Avg. result" />
                        <strong>
                          {summary.average === null
                            ? '—'
                            : `${summary.average.toFixed(1)}%`}
                        </strong>
                      </span>
                    </div>
                    <p>
                      <UiText text="Result average includes learners with recorded tests only." />
                    </p>
                    {leader && (
                      <p className="leaderboard-snapshot-leader">
                        <Trophy size={13} />
                        <span>{leader.fullName}</span>
                        <b>#1</b>
                      </p>
                    )}
                  </section>
                )}
              </aside>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
