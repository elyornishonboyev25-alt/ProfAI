import { useEffect, useState, type FormEvent } from 'react'
import { Clock3, Crown, Loader2, MessageSquareText, RotateCcw, Send, Trash2, Trophy, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { SATModule } from '@/features/sat/practiceTest4'
import { formatSATDuration } from '@/features/sat/resultAnalysis'
import {
  examResultsApi,
  type SATStanding,
  type SATStandingRow,
  type TestDiscussionPost,
} from '@/features/sat/resultInsights'

export type StandingState =
  { status: 'guest' | 'loading' | 'error' | 'unavailable' } | { status: 'ready'; data: SATStanding }

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'IG'
  )
}

export function SRAvatar({ name, url, size = 38 }: { name: string; url?: string | null; size?: number }) {
  const [failed, setFailed] = useState(false)
  return (
    <span className="srx-avatar" style={{ width: size, height: size }} aria-hidden="true">
      {url && !failed ? (
        <img src={url} alt="" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
      ) : (
        initials(name)
      )}
    </span>
  )
}

function SignInPrompt({ text }: { text: string }) {
  return (
    <div className="sr-card srx-empty">
      <Users size={30} />
      <h3>Sign in to join in</h3>
      <p>{text}</p>
      <Link className="sr-button sr-button-primary" to="/login">
        Sign in
      </Link>
    </div>
  )
}

function StandingRow({ row, sectioned }: { row: SATStandingRow; sectioned: boolean }) {
  return (
    <li className={`srx-rank-row ${row.isMe ? 'is-me' : ''} ${row.rank <= 3 ? `is-top is-top-${row.rank}` : ''}`}>
      <span className="srx-rank-number">
        {row.rank <= 3 ? <Crown size={14} aria-hidden="true" /> : null}
        {row.rank}
      </span>
      <span className="srx-rank-person">
        <SRAvatar name={row.name} url={row.avatarUrl} />
        <span>
          <strong>
            {row.name}
            {row.isMe && <em>You</em>}
          </strong>
          <small>{row.nickname ? `@${row.nickname}` : row.country || 'Ivygoo learner'}</small>
        </span>
      </span>
      {sectioned && (
        <>
          <span className="srx-rank-cell" data-label="R&W">
            {row.rw ?? '—'}
          </span>
          <span className="srx-rank-cell" data-label="Math">
            {row.math ?? '—'}
          </span>
        </>
      )}
      <span className="srx-rank-cell srx-rank-time" data-label="Time">
        <Clock3 size={12} aria-hidden="true" />
        {formatSATDuration(row.durationSec)}
      </span>
      <span className="srx-rank-total" data-label="Score">
        {row.total}
      </span>
    </li>
  )
}

export function SATLeaderboard({
  standing,
  onRetry,
  testTitle,
  sectioned,
  maximum,
}: {
  standing: StandingState
  onRetry: () => void
  testTitle: string
  sectioned: boolean
  maximum: number
}) {
  if (standing.status === 'guest')
    return <SignInPrompt text="See where your first attempt ranks among every Ivygoo learner who took this test." />
  if (standing.status === 'unavailable')
    return (
      <div className="sr-card srx-empty">
        <Trophy size={30} />
        <h3>Ranking opens with a full score</h3>
        <p>Submit the complete test to compare your score with other learners.</p>
      </div>
    )
  if (standing.status === 'loading')
    return (
      <div className="sr-card srx-empty" role="status">
        <Loader2 size={28} className="srx-spin" />
        <p>Loading the leaderboard…</p>
      </div>
    )
  if (standing.status === 'error')
    return (
      <div className="sr-card srx-empty" role="alert">
        <Trophy size={30} />
        <h3>The leaderboard did not load</h3>
        <p>Check your connection, then try again.</p>
        <button type="button" className="sr-button" onClick={onRetry}>
          <RotateCcw size={14} />
          Try again
        </button>
      </div>
    )
  if (standing.status !== 'ready') return null
  const { data } = standing
  const meInTop = data.rows.some((row) => row.isMe)
  return (
    <>
      <div className="srx-standing-cards">
        <div className="sr-card">
          <Trophy size={20} />
          <span>Your rank</span>
          <strong>{data.me ? `#${data.me.rank}` : '—'}</strong>
          <small>{data.me ? `of ${data.participants} learners` : 'Your result is still syncing'}</small>
        </div>
        <div className="sr-card">
          <Users size={20} />
          <span>Learners</span>
          <strong>{data.participants}</strong>
          <small>first attempts on this test</small>
        </div>
        <div className="sr-card">
          <Crown size={20} />
          <span>Average score</span>
          <strong>{data.average ?? '—'}</strong>
          <small>out of {maximum}</small>
        </div>
      </div>
      <section className="sr-card srx-rank-card">
        <div className="srx-rank-head" aria-hidden="true">
          <span>#</span>
          <span>Learner</span>
          {sectioned && (
            <>
              <span>R&amp;W</span>
              <span>Math</span>
            </>
          )}
          <span>Time</span>
          <span>Score</span>
        </div>
        {data.rows.length ? (
          <ol className={`srx-rank-list ${sectioned ? 'is-sectioned' : ''}`} aria-label={`${testTitle} leaderboard`}>
            {data.rows.map((row) => (
              <StandingRow key={`${row.rank}-${row.name}`} row={row} sectioned={sectioned} />
            ))}
            {data.me && !meInTop && (
              <>
                <li className="srx-rank-gap" aria-hidden="true">
                  ···
                </li>
                <StandingRow row={data.me} sectioned={sectioned} />
              </>
            )}
          </ol>
        ) : (
          <div className="srx-empty">
            <Trophy size={28} />
            <h3>Be the first on the board</h3>
            <p>Results appear here as learners finish this test.</p>
          </div>
        )}
      </section>
      <p className="sr-estimate-note">
        Ranked by each learner’s first completed attempt, like a real test day. Ties go to the faster finish. Learners
        who hide their ranking appear as “Private learner”.
      </p>
    </>
  )
}

function timeAgo(value: string) {
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000)
  const format = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  const steps: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['week', 604_800],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ]
  for (const [unit, size] of steps)
    if (Math.abs(seconds) >= size) return format.format(Math.round(seconds / size), unit)
  return 'just now'
}

export function SATDiscussion({
  testId,
  modules,
  signedIn,
  userName,
  questionRef,
  onQuestionRefChange,
}: {
  testId: string
  modules: SATModule[]
  signedIn: boolean
  userName: string
  questionRef: string
  onQuestionRefChange: (value: string) => void
}) {
  const [posts, setPosts] = useState<TestDiscussionPost[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [reload, setReload] = useState(0)
  const refLabel = (ref: string | null) => {
    if (!ref) return null
    const [moduleId, number] = ref.split(':')
    const module = modules.find((m) => m.id === moduleId)
    return module ? `${module.shortTitle} · Question ${number}` : null
  }

  useEffect(() => {
    if (!signedIn) return
    let active = true
    setStatus('loading')
    examResultsApi
      .discussion('SAT', testId)
      .then(({ posts: next }) => {
        if (!active) return
        setPosts(next)
        setStatus('ready')
      })
      .catch(() => active && setStatus('error'))
    return () => {
      active = false
    }
  }, [reload, signedIn, testId])

  if (!signedIn)
    return <SignInPrompt text="Ask about a question, share a strategy, and learn from others who took this test." />

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const text = body.trim()
    if (text.length < 2 || sending) return
    setSending(true)
    setSendError('')
    try {
      const { post } = await examResultsApi.postDiscussion('SAT', testId, text, questionRef || undefined)
      setPosts((current) => [post, ...current])
      setBody('')
      onQuestionRefChange('')
    } catch (error) {
      setSendError(
        error instanceof Error && error.message ? error.message : 'Your post was not sent. Please try again.',
      )
    } finally {
      setSending(false)
    }
  }
  const remove = async (id: string) => {
    const previous = posts
    setPosts((current) => current.filter((post) => post.id !== id))
    try {
      await examResultsApi.deleteDiscussion(id)
    } catch {
      setPosts(previous)
    }
  }

  return (
    <div className="srx-discussion">
      <form className="sr-card srx-composer" onSubmit={submit}>
        <SRAvatar name={userName} size={42} />
        <div>
          <label htmlFor="sat-discussion-body" className="srx-visually-hidden">
            Your post
          </label>
          <textarea
            id="sat-discussion-body"
            value={body}
            maxLength={1500}
            rows={3}
            placeholder="Ask about a question or share how you solved it…"
            onChange={(event) => setBody(event.target.value)}
          />
          <div className="srx-composer-foot">
            <label className="srx-visually-hidden" htmlFor="sat-discussion-question">
              Question
            </label>
            <select
              id="sat-discussion-question"
              value={questionRef}
              onChange={(event) => onQuestionRefChange(event.target.value)}
            >
              <option value="">General discussion</option>
              {modules.map((module) => (
                <optgroup key={module.id} label={module.shortTitle}>
                  {module.questions.map((question) => (
                    <option key={question.id} value={`${module.id}:${question.number}`}>
                      {module.shortTitle} · Question {question.number}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <span>{body.length}/1500</span>
            <button type="submit" className="sr-button sr-button-primary" disabled={body.trim().length < 2 || sending}>
              {sending ? <Loader2 size={15} className="srx-spin" /> : <Send size={15} />}
              Post
            </button>
          </div>
          {sendError && (
            <p className="srx-form-error" role="alert">
              {sendError}
            </p>
          )}
        </div>
      </form>
      {status === 'loading' && (
        <div className="sr-card srx-empty" role="status">
          <Loader2 size={26} className="srx-spin" />
          <p>Loading the discussion…</p>
        </div>
      )}
      {status === 'error' && (
        <div className="sr-card srx-empty" role="alert">
          <MessageSquareText size={28} />
          <h3>The discussion did not load</h3>
          <button type="button" className="sr-button" onClick={() => setReload((value) => value + 1)}>
            <RotateCcw size={14} />
            Try again
          </button>
        </div>
      )}
      {status === 'ready' && !posts.length && (
        <div className="sr-card srx-empty">
          <MessageSquareText size={30} />
          <h3>Start the conversation</h3>
          <p>No posts yet. Ask the first question about this test.</p>
        </div>
      )}
      {status === 'ready' && posts.length > 0 && (
        <ul className="srx-posts">
          {posts.map((post) => (
            <li key={post.id} className={`sr-card srx-post ${post.mine ? 'is-mine' : ''}`}>
              <SRAvatar name={post.author.name} url={post.author.avatarUrl} />
              <div>
                <div className="srx-post-meta">
                  <strong>{post.author.name}</strong>
                  {post.author.nickname && <span>@{post.author.nickname}</span>}
                  <time dateTime={post.createdAt}>{timeAgo(post.createdAt)}</time>
                  {post.canDelete && (
                    <button type="button" aria-label="Delete post" onClick={() => void remove(post.id)}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                {refLabel(post.questionRef) && <span className="srx-post-ref">{refLabel(post.questionRef)}</span>}
                <p>{post.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
