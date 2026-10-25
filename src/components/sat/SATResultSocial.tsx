import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import {
  CheckCircle2,
  ChevronDown,
  Clock3,
  Crown,
  Loader2,
  MessageSquareText,
  Reply,
  RotateCcw,
  Send,
  Trash2,
  Trophy,
  Users,
} from 'lucide-react'
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

type Post = TestDiscussionPost
type SortMode = 'newest' | 'helpful'

const BODY_LIMIT = 1500
const COLLAPSED_REPLIES = 3

function DiscussionComposer({
  id,
  userName,
  placeholder,
  submitLabel,
  initialBody = '',
  compact = false,
  autoFocus = false,
  extra,
  onSubmit,
  onCancel,
}: {
  id: string
  userName: string
  placeholder: string
  submitLabel: string
  initialBody?: string
  compact?: boolean
  autoFocus?: boolean
  extra?: ReactNode
  onSubmit: (text: string) => Promise<void>
  onCancel?: () => void
}) {
  const [body, setBody] = useState(initialBody)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const fieldRef = useRef<HTMLTextAreaElement>(null)
  const ready = body.trim().length >= 2 && !sending

  useEffect(() => {
    if (!autoFocus) return
    const field = fieldRef.current
    field?.focus()
    field?.setSelectionRange(field.value.length, field.value.length)
  }, [autoFocus])

  const submit = async (event?: FormEvent) => {
    event?.preventDefault()
    if (!ready) return
    setSending(true)
    setError('')
    try {
      await onSubmit(body.trim())
      setBody('')
    } catch (failure) {
      setError(failure instanceof Error && failure.message ? failure.message : 'Your post was not sent. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <form className={`srx-composer ${compact ? 'is-compact' : 'sr-card'}`} onSubmit={submit}>
      <SRAvatar name={userName} size={compact ? 32 : 42} />
      <div>
        <label htmlFor={id} className="srx-visually-hidden">
          {placeholder}
        </label>
        <textarea
          id={id}
          ref={fieldRef}
          value={body}
          maxLength={BODY_LIMIT}
          rows={compact ? 2 : 3}
          placeholder={placeholder}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) void submit()
            else if (event.key === 'Escape' && onCancel) onCancel()
          }}
        />
        <div className="srx-composer-foot">
          {extra}
          <span className={body.length > BODY_LIMIT - 100 ? 'is-near' : ''}>
            {body.length}/{BODY_LIMIT}
          </span>
          {onCancel && (
            <button type="button" className="sr-button srx-ghost" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button type="submit" className="sr-button sr-button-primary" disabled={!ready}>
            {sending ? <Loader2 size={15} className="srx-spin" /> : <Send size={15} />}
            {submitLabel}
          </button>
        </div>
        {error && (
          <p className="srx-form-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </form>
  )
}

function DiscussionItem({
  post,
  isReply = false,
  refLabel,
  onCheck,
  onReply,
  onDelete,
}: {
  post: Post
  isReply?: boolean
  refLabel?: string | null
  onCheck: (post: Post) => void
  onReply: (post: Post) => void
  onDelete: (post: Post) => void
}) {
  const [confirming, setConfirming] = useState(false)
  useEffect(() => {
    if (!confirming) return
    const timer = window.setTimeout(() => setConfirming(false), 4000)
    return () => window.clearTimeout(timer)
  }, [confirming])
  const replies = post.replies?.length ?? 0

  return (
    <article className={`srx-post ${isReply ? 'is-reply' : ''} ${post.mine ? 'is-mine' : ''}`}>
      <SRAvatar name={post.author.name} url={post.author.avatarUrl} size={isReply ? 32 : 40} />
      <div className="srx-post-main">
        <header className="srx-post-meta">
          <strong>{post.author.name}</strong>
          {post.mine && <em className="srx-you">You</em>}
          {post.author.nickname && <span>@{post.author.nickname}</span>}
          <span aria-hidden="true">·</span>
          <time dateTime={post.createdAt} title={new Date(post.createdAt).toLocaleString()}>
            {timeAgo(post.createdAt)}
          </time>
        </header>
        {refLabel && <span className="srx-post-ref">{refLabel}</span>}
        <p>{post.body}</p>
        <div className="srx-post-actions">
          <button
            type="button"
            className={`srx-action is-check ${post.checked ? 'is-on' : ''}`}
            aria-pressed={post.checked}
            disabled={post.mine}
            title={post.mine ? 'Learners can mark your post as helpful' : post.checked ? 'Remove your check' : 'Mark as helpful'}
            onClick={() => onCheck(post)}
          >
            <CheckCircle2 size={15} />
            <span>{post.checked ? 'Checked' : 'Helpful'}</span>
            {post.checks > 0 && <b>{post.checks}</b>}
          </button>
          <button type="button" className="srx-action" onClick={() => onReply(post)}>
            <Reply size={15} />
            <span>Reply</span>
            {!isReply && replies > 0 && <b>{replies}</b>}
          </button>
          {post.canDelete &&
            (confirming ? (
              <button type="button" className="srx-action is-danger is-confirm" onClick={() => onDelete(post)}>
                <Trash2 size={14} />
                <span>{!isReply && replies ? `Delete with ${replies} ${replies === 1 ? 'reply' : 'replies'}` : 'Confirm delete'}</span>
              </button>
            ) : (
              <button
                type="button"
                className="srx-action is-danger"
                aria-label={isReply ? 'Delete reply' : 'Delete post'}
                onClick={() => setConfirming(true)}
              >
                <Trash2 size={14} />
              </button>
            ))}
        </div>
      </div>
    </article>
  )
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
  const [posts, setPosts] = useState<Post[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [reload, setReload] = useState(0)
  const [sort, setSort] = useState<SortMode>('newest')
  const [replyTo, setReplyTo] = useState<{ threadId: string; mention: string } | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const [actionError, setActionError] = useState('')
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
        setPosts(next.map((post) => ({ ...post, replies: post.replies ?? [] })))
        setStatus('ready')
      })
      .catch(() => active && setStatus('error'))
    return () => {
      active = false
    }
  }, [reload, signedIn, testId])

  const sorted = useMemo(() => {
    if (sort === 'newest') return posts
    return [...posts].sort(
      (a, b) =>
        b.checks - a.checks ||
        (b.replies?.length ?? 0) - (a.replies?.length ?? 0) ||
        b.createdAt.localeCompare(a.createdAt),
    )
  }, [posts, sort])
  const replyTotal = posts.reduce((sum, post) => sum + (post.replies?.length ?? 0), 0)

  if (!signedIn)
    return <SignInPrompt text="Ask about a question, share a strategy, and learn from others who took this test." />

  const updatePost = (id: string, change: (post: Post) => Post | null) =>
    setPosts((current) =>
      current.flatMap((post) => {
        if (post.id === id) {
          const next = change(post)
          return next ? [next] : []
        }
        if (!post.replies?.some((reply) => reply.id === id)) return [post]
        return [
          {
            ...post,
            replies: post.replies.flatMap((reply) => {
              if (reply.id !== id) return [reply]
              const next = change(reply)
              return next ? [next] : []
            }),
          },
        ]
      }),
    )

  const createPost = async (text: string) => {
    const { post } = await examResultsApi.postDiscussion('SAT', testId, text, { questionRef: questionRef || undefined })
    setPosts((current) => [{ ...post, replies: [] }, ...current])
    onQuestionRefChange('')
    setSort('newest')
  }

  const createReply = async (threadId: string, text: string) => {
    const { post } = await examResultsApi.postDiscussion('SAT', testId, text, { parentId: threadId })
    setPosts((current) =>
      current.map((thread) =>
        thread.id === threadId ? { ...thread, replies: [...(thread.replies ?? []), post] } : thread,
      ),
    )
    setExpanded((current) => new Set(current).add(threadId))
    setReplyTo(null)
  }

  const toggleCheck = async (post: Post) => {
    if (post.mine) return
    const next = !post.checked
    setActionError('')
    updatePost(post.id, (item) => ({ ...item, checked: next, checks: Math.max(0, item.checks + (next ? 1 : -1)) }))
    try {
      const result = await examResultsApi.checkDiscussion(post.id, next)
      updatePost(post.id, (item) => ({ ...item, checked: result.checked, checks: result.checks }))
    } catch {
      updatePost(post.id, (item) => ({ ...item, checked: post.checked, checks: post.checks }))
      setActionError('Your check was not saved. Please try again.')
    }
  }

  const remove = async (post: Post) => {
    const previous = posts
    setActionError('')
    updatePost(post.id, () => null)
    if (replyTo?.threadId === post.id) setReplyTo(null)
    try {
      await examResultsApi.deleteDiscussion(post.id)
    } catch {
      setPosts(previous)
      setActionError('The post was not deleted. Please try again.')
    }
  }

  const startReply = (post: Post) => {
    const threadId = post.parentId ?? post.id
    // Replying inside a thread mentions the person you answer.
    const mention = post.parentId && !post.mine && post.author.nickname ? `@${post.author.nickname} ` : ''
    setReplyTo({ threadId, mention })
    if (post.parentId) setExpanded((current) => new Set(current).add(threadId))
  }

  return (
    <div className="srx-discussion">
      <DiscussionComposer
        id="sat-discussion-body"
        userName={userName}
        placeholder="Ask about a question or share how you solved it…"
        submitLabel="Post"
        onSubmit={createPost}
        extra={
          <>
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
          </>
        }
      />
      {status === 'ready' && posts.length > 0 && (
        <div className="srx-thread-bar">
          <p>
            <strong>{posts.length}</strong> {posts.length === 1 ? 'post' : 'posts'}
            <span aria-hidden="true">·</span>
            <strong>{replyTotal}</strong> {replyTotal === 1 ? 'reply' : 'replies'}
          </p>
          <div className="srx-sort" role="group" aria-label="Sort posts">
            {(['newest', 'helpful'] as const).map((mode) => (
              <button key={mode} type="button" aria-pressed={sort === mode} onClick={() => setSort(mode)}>
                {mode === 'newest' ? 'Newest' : 'Most helpful'}
              </button>
            ))}
          </div>
        </div>
      )}
      {actionError && (
        <p className="srx-form-error srx-action-error" role="alert">
          {actionError}
        </p>
      )}
      {status === 'loading' && (
        <ul className="srx-posts" aria-busy="true" aria-label="Loading the discussion">
          {[0, 1, 2].map((item) => (
            <li key={item} className="sr-card srx-thread srx-skeleton" aria-hidden="true">
              <span className="srx-skeleton-avatar" />
              <span className="srx-skeleton-lines">
                <i />
                <i />
                <i />
              </span>
            </li>
          ))}
        </ul>
      )}
      {status === 'error' && (
        <div className="sr-card srx-empty" role="alert">
          <MessageSquareText size={28} />
          <h3>The discussion did not load</h3>
          <p>Check your connection, then try again.</p>
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
          {sorted.map((post) => {
            const replies = post.replies ?? []
            const open = expanded.has(post.id)
            const hidden = open ? 0 : Math.max(0, replies.length - COLLAPSED_REPLIES)
            const shown = hidden ? replies.slice(-COLLAPSED_REPLIES) : replies
            const replying = replyTo?.threadId === post.id
            return (
              <li key={post.id} className={`sr-card srx-thread ${post.mine ? 'is-mine' : ''}`}>
                <DiscussionItem
                  post={post}
                  refLabel={refLabel(post.questionRef)}
                  onCheck={(item) => void toggleCheck(item)}
                  onReply={startReply}
                  onDelete={(item) => void remove(item)}
                />
                {(replies.length > 0 || replying) && (
                  <div className="srx-replies">
                    {hidden > 0 && (
                      <button
                        type="button"
                        className="srx-more-replies"
                        onClick={() => setExpanded((current) => new Set(current).add(post.id))}
                      >
                        <ChevronDown size={15} />
                        View {hidden} earlier {hidden === 1 ? 'reply' : 'replies'}
                      </button>
                    )}
                    {shown.length > 0 && (
                      <ul aria-label={`Replies to ${post.author.name}`}>
                        {shown.map((reply) => (
                          <li key={reply.id}>
                            <DiscussionItem
                              post={reply}
                              isReply
                              onCheck={(item) => void toggleCheck(item)}
                              onReply={startReply}
                              onDelete={(item) => void remove(item)}
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                    {replying && (
                      <DiscussionComposer
                        key={`${post.id}-${replyTo.mention}`}
                        id={`sat-reply-${post.id}`}
                        userName={userName}
                        placeholder={`Reply to ${post.author.name}…`}
                        submitLabel="Reply"
                        initialBody={replyTo.mention}
                        compact
                        autoFocus
                        onSubmit={(text) => createReply(post.id, text)}
                        onCancel={() => setReplyTo(null)}
                      />
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
