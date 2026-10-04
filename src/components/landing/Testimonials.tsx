import { type FormEvent, type TouchEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useReducedMotion } from 'framer-motion'
import { ArrowRight, ChevronDown, MessageSquareText, Quote, Star, X } from 'lucide-react'
import { useCopy } from '@/i18n/interface'
import { loadReviews, submitReview, type LandingReview, type ReviewExam } from '@/lib/reviewsApi'
import { publicApiUrl } from '@/lib/apiClient'
import { featuredTestimonials, type DisplayReview } from './featuredTestimonials'

const GAP = 18
const FLOW_SPEED = 42

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toLocaleUpperCase()).join('') || '?'
}

function scoreChange(review: DisplayReview, c: (source: string) => string) {
  if (!review.bandBefore || !review.bandAfter) return null
  const change = Number(review.bandAfter) - Number(review.bandBefore)
  if (!Number.isFinite(change)) return null
  const amount = `${change > 0 ? '+' : ''}${review.exam === 'IELTS' ? change.toFixed(1) : change}`
  const unit = review.exam === 'IELTS' ? c('IELTS band points') : c('SAT points')
  return c('Score change: {change}').replace('{change}', `${amount} ${unit}`)
}

function ReviewAvatar({ review }: { review: DisplayReview }) {
  const [failed, setFailed] = useState(false)
  const featured = review.id.startsWith('featured-')
  if (!featured || failed) return <span className="landing-review-avatar" aria-hidden="true">{initials(review.name)}</span>

  return <img
    className="landing-review-avatar"
    src={publicApiUrl(`/reviews/featured-avatar/${encodeURIComponent(review.id)}`)}
    alt=""
    loading="lazy"
    decoding="async"
    referrerPolicy="no-referrer"
    onError={() => setFailed(true)}
  />
}

function ReviewCard({ review, hidden = false, onRead }: { review: DisplayReview; hidden?: boolean; onRead: (review: DisplayReview) => void }) {
  const { c, language } = useCopy()
  const long = review.text.length > 135
  const cut = review.text.slice(0, 135)
  const text = long ? `${cut.slice(0, cut.lastIndexOf(' ')).trimEnd()}…` : review.text
  const date = review.createdAt ? new Date(review.createdAt) : null
  const formattedDate = date && !Number.isNaN(date.getTime()) ? new Intl.DateTimeFormat(language === 'uz' ? 'uz-UZ' : language === 'ru' ? 'ru-RU' : 'en-US', { dateStyle: 'medium' }).format(date) : null
  const rating = typeof review.rating === 'number' && review.rating >= 1 && review.rating <= 5 ? review.rating : null
  const change = scoreChange(review, c)

  return <article className="landing-review-card" aria-hidden={hidden || undefined}>
    <div className="landing-review-card-top"><Quote size={24} aria-hidden="true" /><span>{review.exam}</span></div>
    {rating !== null && <div className="landing-review-stars" aria-label={c('Rated {rating} out of 5 stars').replace('{rating}', String(rating))}>{Array.from({ length: rating }, (_, index) => <Star key={index} size={15} fill="currentColor" aria-hidden="true" />)}</div>}
    <p className="landing-review-text">{text}</p>
    {long && <button type="button" className="landing-review-more" tabIndex={hidden ? -1 : 0} onClick={() => onRead(review)}>{c('Read more')}</button>}
    {review.bandBefore && review.bandAfter && <div className="landing-review-progress" aria-label={`${review.exam}: ${review.bandBefore} to ${review.bandAfter}${change ? `, ${change}` : ''}`}><span>{review.bandBefore}</span><ArrowRight size={17} aria-hidden="true" /><strong>{review.bandAfter}</strong>{change && <small>{change}</small>}</div>}
    <div className="landing-review-author"><ReviewAvatar review={review} /><div><strong>{review.name}</strong>{formattedDate && <small>{formattedDate}</small>}</div></div>
  </article>
}

function ReviewDetailDialog({ review, onClose }: { review: DisplayReview; onClose: () => void }) {
  const { c } = useCopy()
  const change = scoreChange(review, c)
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose() }
      if (event.key === 'Tab') { event.preventDefault(); closeRef.current?.focus() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', onKeyDown); previousFocus?.focus() }
  }, [onClose])
  return createPortal(<div className="landing-comment-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <div role="dialog" aria-modal="true" aria-labelledby="landing-review-detail-title" className="landing-comment-dialog landing-review-detail-dialog">
      <button ref={closeRef} type="button" className="landing-icon-button landing-comment-close" aria-label={c('Close')} onClick={onClose}><X size={20} /></button>
      <span className="landing-section-kicker"><Quote size={15} /> {review.exam}</span>
      <h2 id="landing-review-detail-title">{review.name}</h2>
      <p className="landing-review-detail-text">{review.text}</p>
      {review.bandBefore && review.bandAfter && <div className="landing-review-progress"><span>{review.bandBefore}</span><ArrowRight size={17} aria-hidden="true" /><strong>{review.bandAfter}</strong>{change && <small>{change}</small>}</div>}
    </div>
  </div>, document.body)
}

function CommentDialog({ onClose, onSubmitted }: { onClose: () => void; onSubmitted: (review: LandingReview) => void }) {
  const { c } = useCopy()
  const dialogRef = useRef<HTMLDivElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const sendingRef = useRef(false)
  const [name, setName] = useState('')
  const [exam, setExam] = useState<ReviewExam>('General')
  const [rating, setRating] = useState('')
  const [bandBefore, setBandBefore] = useState('')
  const [bandAfter, setBandAfter] = useState('')
  const [comment, setComment] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [errorField, setErrorField] = useState<'name' | 'comment' | 'scores' | 'submit' | null>(null)

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    nameRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !sendingRef.current) { event.preventDefault(); onClose(); return }
      if (event.key !== 'Tab') return
      const controls = [...(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])') ?? [])]
      const first = controls[0]
      const last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', onKeyDown); previousFocus?.focus() }
  }, [onClose])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (sendingRef.current) return
    const cleanName = name.trim()
    const cleanComment = comment.trim()
    if (cleanName.length < 2 || cleanName.length > 60) { setErrorField('name'); setError(c('Enter a name between 2 and 60 characters.')); nameRef.current?.focus(); return }
    const cleanBefore = bandBefore.trim()
    const cleanAfter = bandAfter.trim()
    if ((cleanBefore && !cleanAfter) || (!cleanBefore && cleanAfter)) { setErrorField('scores'); setError(c('Enter both scores to show your progress.')); document.getElementById('landing-comment-score-before')?.focus(); return }
    if (cleanBefore && cleanAfter) {
      const before = Number(cleanBefore)
      const after = Number(cleanAfter)
      const valid = exam === 'IELTS'
        ? [before, after].every(score => Number.isFinite(score) && score >= 0 && score <= 9 && Number.isInteger(score * 2))
        : exam === 'SAT'
          ? [before, after].every(score => Number.isInteger(score) && score >= 400 && score <= 1600 && score % 10 === 0)
          : false
      if (!valid) {
        setErrorField('scores')
        setError(c(exam === 'IELTS' ? 'Enter valid IELTS band scores from 0 to 9 in 0.5 steps.' : 'Enter SAT scores from 400 to 1600 in steps of 10.'))
        document.getElementById('landing-comment-score-before')?.focus()
        return
      }
    }
    if (cleanComment.length < 8 || cleanComment.length > 600) { setErrorField('comment'); setError(c('Your comment must be between 8 and 600 characters.')); document.getElementById('landing-comment-text')?.focus(); return }
    sendingRef.current = true
    setSending(true)
    setErrorField(null)
    setError('')
    try {
      const review = await submitReview({ name: cleanName, exam, rating: rating ? Number(rating) : undefined, bandBefore: cleanBefore || undefined, bandAfter: cleanAfter || undefined, text: cleanComment })
      onSubmitted(review)
    } catch (cause) {
      setErrorField('submit')
      setError(cause instanceof Error ? cause.message : c('Your comment could not be sent. Please try again.'))
    } finally {
      sendingRef.current = false
      setSending(false)
    }
  }

  return createPortal(<div className="landing-comment-backdrop" onMouseDown={event => { if (event.target === event.currentTarget && !sending) onClose() }}>
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="landing-comment-title" aria-describedby="landing-comment-description" className="landing-comment-dialog landing-comment-form-dialog">
      <button type="button" className="landing-icon-button landing-comment-close" aria-label={c('Close comment form')} onClick={onClose} disabled={sending}><X size={20} /></button>
      <div className="landing-comment-dialog-header">
        <span className="landing-comment-header-icon" aria-hidden="true"><MessageSquareText size={22} /></span>
        <span className="landing-section-kicker">{c('YOUR VOICE MATTERS')}</span>
        <h2 id="landing-comment-title">{c('Leave a comment')}</h2>
        <p id="landing-comment-description">{c('Tell us about your experience with ProfAI. Your words will appear here when they are public.')}</p>
      </div>
      <form onSubmit={handleSubmit} noValidate>
        <div className="landing-comment-field">
          <label htmlFor="landing-comment-name">{c('Display name')}</label>
          <input ref={nameRef} id="landing-comment-name" type="text" autoComplete="name" maxLength={60} required aria-invalid={errorField === 'name'} aria-describedby={errorField === 'name' ? 'landing-comment-name-error' : undefined} value={name} onChange={event => { setName(event.target.value); if (errorField === 'name') { setError(''); setErrorField(null) } }} placeholder={c('Your name')} />
          {errorField === 'name' && error && <p id="landing-comment-name-error" className="landing-comment-field-error" role="alert">{error}</p>}
        </div>
        <div className="landing-comment-row">
          <div className="landing-comment-field"><label htmlFor="landing-comment-exam">{c('Preparation area')}</label><div className="landing-comment-select"><select id="landing-comment-exam" value={exam} onChange={event => { setExam(event.target.value as ReviewExam); setBandBefore(''); setBandAfter(''); if (errorField === 'scores') { setError(''); setErrorField(null) } }}><option value="General">{c('General')}</option><option value="IELTS">IELTS</option><option value="SAT">Digital SAT</option></select><ChevronDown size={17} aria-hidden="true" /></div></div>
          <div className="landing-comment-field"><label htmlFor="landing-comment-rating">{c('Rating (optional)')}</label><div className="landing-comment-select"><select id="landing-comment-rating" value={rating} onChange={event => setRating(event.target.value)}><option value="">{c('No rating')}</option>{[5, 4, 3, 2, 1].map(value => <option key={value} value={value}>{value} / 5</option>)}</select><ChevronDown size={17} aria-hidden="true" /></div></div>
        </div>
        {(exam === 'IELTS' || exam === 'SAT') && <div className="landing-comment-score-group">
          <p className="landing-comment-score-heading">{c('Share your score progress (optional)')}</p>
          <div className="landing-comment-row landing-comment-score-row">
            <div className="landing-comment-field"><label htmlFor="landing-comment-score-before">{c('Starting score')}</label><input id="landing-comment-score-before" type="number" inputMode="decimal" min={exam === 'IELTS' ? 0 : 400} max={exam === 'IELTS' ? 9 : 1600} step={exam === 'IELTS' ? 0.5 : 10} aria-invalid={errorField === 'scores'} aria-describedby={errorField === 'scores' ? 'landing-comment-scores-error' : undefined} value={bandBefore} onChange={event => { setBandBefore(event.target.value); if (errorField === 'scores') { setError(''); setErrorField(null) } }} placeholder={exam === 'IELTS' ? 'e.g. 6.0' : 'e.g. 1180'} /></div>
            <div className="landing-comment-field"><label htmlFor="landing-comment-score-after">{c('Latest score')}</label><input id="landing-comment-score-after" type="number" inputMode="decimal" min={exam === 'IELTS' ? 0 : 400} max={exam === 'IELTS' ? 9 : 1600} step={exam === 'IELTS' ? 0.5 : 10} aria-invalid={errorField === 'scores'} aria-describedby={errorField === 'scores' ? 'landing-comment-scores-error' : undefined} value={bandAfter} onChange={event => { setBandAfter(event.target.value); if (errorField === 'scores') { setError(''); setErrorField(null) } }} placeholder={exam === 'IELTS' ? 'e.g. 7.5' : 'e.g. 1450'} /></div>
          </div>
          {errorField === 'scores' && error && <p id="landing-comment-scores-error" className="landing-comment-field-error" role="alert">{error}</p>}
        </div>}
        <div className="landing-comment-field landing-comment-text-field">
          <div className="landing-comment-label-row"><label htmlFor="landing-comment-text">{c('Your comment')}</label><span className="landing-comment-count">{comment.length}/600</span></div>
          <textarea id="landing-comment-text" required minLength={8} maxLength={600} rows={4} aria-invalid={errorField === 'comment'} aria-describedby={errorField === 'comment' ? 'landing-comment-text-error' : undefined} value={comment} onChange={event => { setComment(event.target.value); if (errorField === 'comment') { setError(''); setErrorField(null) } }} placeholder={c('What was helpful? What could be better?')} />
          {errorField === 'comment' && error && <p id="landing-comment-text-error" className="landing-comment-field-error" role="alert">{error}</p>}
        </div>
        {errorField === 'submit' && error && <p className="landing-comment-error" role="alert">{error}</p>}
        <button type="submit" className="landing-button landing-button-primary landing-comment-submit" disabled={sending} aria-busy={sending}>{sending ? c('Sending…') : c('Send comment')} <ArrowRight size={18} aria-hidden="true" /></button>
      </form>
    </div>
  </div>, document.body)
}

type ManualMove = { startedAt: number; top: number; bottom: number; topDelta: number; bottomDelta: number }

function wrap(value: number, width: number) {
  return width > 0 ? ((value % width) + width) % width : 0
}

function TestimonialMarquee({ reviews, dialogOpen }: { reviews: DisplayReview[]; dialogOpen: boolean }) {
  const { c } = useCopy()
  const reducedMotion = useReducedMotion()
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [interacting, setInteracting] = useState(false)
  const [detail, setDetail] = useState<DisplayReview | null>(null)
  const [pageVisible, setPageVisible] = useState(() => typeof document === 'undefined' || !document.hidden)
  const topTrack = useRef<HTMLDivElement>(null)
  const bottomTrack = useRef<HTMLDivElement>(null)
  const topGroup = useRef<HTMLDivElement>(null)
  const bottomGroup = useRef<HTMLDivElement>(null)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const interactionTimer = useRef<number | null>(null)
  const phase = useRef<{ top: number; bottom: number; last: number; manual: ManualMove | null }>({ top: 0, bottom: 0, last: 0, manual: null })
  const flowing = reviews.length >= 4 && !reducedMotion
  const active = !hovered && !focused && !interacting && pageVisible && !dialogOpen && !detail
  const middle = Math.ceil(reviews.length / 2)
  const rows = [reviews.slice(0, middle), reviews.slice(middle)]

  useEffect(() => {
    const update = () => setPageVisible(!document.hidden)
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])
  useEffect(() => () => { if (interactionTimer.current !== null) window.clearTimeout(interactionTimer.current) }, [])

  useEffect(() => {
    if (!flowing) return
    const top = topTrack.current
    const bottom = bottomTrack.current
    const firstTop = topGroup.current
    const firstBottom = bottomGroup.current
    if (!top || !bottom || !firstTop || !firstBottom) return

    let topWidth = 0
    let bottomWidth = 0
    const measure = () => {
      topWidth = firstTop.getBoundingClientRect().width
      bottomWidth = firstBottom.getBoundingClientRect().width
      phase.current.top = wrap(phase.current.top, topWidth)
      phase.current.bottom = wrap(phase.current.bottom, bottomWidth)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(firstTop)
    observer.observe(firstBottom)
    measure()

    let frame = 0
    const tick = (now: number) => {
      const current = phase.current
      const elapsed = current.last ? Math.min((now - current.last) / 1000, .05) : 0
      current.last = now
      if (topWidth && bottomWidth) {
        if (current.manual) {
          const move = current.manual
          const progress = Math.min((now - move.startedAt) / 550, 1)
          const eased = 1 - (1 - progress) ** 3
          current.top = wrap(move.top + move.topDelta * eased, topWidth)
          current.bottom = wrap(move.bottom + move.bottomDelta * eased, bottomWidth)
          if (progress === 1) current.manual = null
        } else if (active) {
          current.top = wrap(current.top + FLOW_SPEED * elapsed, topWidth)
          current.bottom = wrap(current.bottom - FLOW_SPEED * elapsed, bottomWidth)
        }
        top.style.transform = `translate3d(${-current.top}px, 0, 0)`
        bottom.style.transform = `translate3d(${-current.bottom}px, 0, 0)`
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(frame); observer.disconnect(); phase.current.last = 0 }
  }, [active, flowing, reviews.length])

  function nudge(direction: number) {
    const topCard = topGroup.current?.querySelector<HTMLElement>('.landing-reviews-marquee-card')
    const bottomCard = bottomGroup.current?.querySelector<HTMLElement>('.landing-reviews-marquee-card')
    if (!topCard || !bottomCard) return
    const current = phase.current
    current.manual = {
      startedAt: performance.now(), top: current.top, bottom: current.bottom,
      topDelta: direction * (topCard.offsetWidth + GAP),
      bottomDelta: -direction * (bottomCard.offsetWidth + GAP),
    }
    setInteracting(true)
    if (interactionTimer.current !== null) window.clearTimeout(interactionTimer.current)
    interactionTimer.current = window.setTimeout(() => setInteracting(false), 6000)
  }

  function onTouchStart(event: TouchEvent<HTMLDivElement>) {
    touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }
  }
  function onTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const start = touchStart.current
    touchStart.current = null
    if (!start) return
    const dx = event.changedTouches[0].clientX - start.x
    const dy = event.changedTouches[0].clientY - start.y
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) nudge(dx < 0 ? 1 : -1)
  }

  if (!flowing) return <><div className="landing-reviews-static">{reviews.map(review => <ReviewCard key={review.id} review={review} onRead={setDetail} />)}</div>{detail && <ReviewDetailDialog review={detail} onClose={() => setDetail(null)} />}</>

  return <div className="landing-reviews-marquee" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setFocused(false) }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onKeyDown={event => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); nudge(event.key === 'ArrowRight' ? 1 : -1) } }}>
    {rows.map((row, rowIndex) => <div className="landing-reviews-marquee-lane" key={rowIndex} role="group" aria-label={`${c('What learners are saying')} ${rowIndex + 1}`}>
      <div className="landing-reviews-marquee-track" ref={rowIndex === 0 ? topTrack : bottomTrack}>
        {[false, true].map(duplicate => <div key={String(duplicate)} className="landing-reviews-marquee-group" ref={!duplicate ? rowIndex === 0 ? topGroup : bottomGroup : undefined} aria-hidden={duplicate || undefined}>
          {row.map(review => <div className="landing-reviews-marquee-card" key={`${review.id}-${duplicate}`}><ReviewCard review={review} hidden={duplicate} onRead={setDetail} /></div>)}
        </div>)}
      </div>
    </div>)}
    <div className="landing-reviews-marquee-controls"><span className="landing-reviews-marquee-count">{String(reviews.length).padStart(2, '0')} · {c('Comments')}</span></div>
    {detail && <ReviewDetailDialog review={detail} onClose={() => setDetail(null)} />}
  </div>
}

export default function Testimonials() {
  const { c } = useCopy()
  const [apiReviews, setApiReviews] = useState<LandingReview[]>([])
  const reviews = useMemo(() => {
    const featuredText = new Set(featuredTestimonials.map(review => review.text.trim().toLocaleLowerCase()))
    return [...featuredTestimonials, ...apiReviews.filter(review => !featuredText.has(review.text.trim().toLocaleLowerCase()))]
  }, [apiReviews])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [message, setMessage] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const refresh = useCallback(async () => {
    try { setApiReviews(await loadReviews()); setLoadError(false) }
    catch { setLoadError(true) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void refresh() }, [refresh])

  const onSubmitted = (review: LandingReview) => {
    setDialogOpen(false)
    setMessage(review.approved === false ? c('Thank you. Your comment was submitted for review.') : c('Thank you. Your comment was submitted.'))
    if (review.approved !== false) void refresh()
  }

  return <section id="comments" className="landing-reviews-section landing-arena-section" aria-labelledby="landing-reviews-title">
    <div className="landing-reviews-heading"><div><span className="landing-section-kicker"><MessageSquareText size={15} /> {c('COMMUNITY VOICES')}</span><h2 id="landing-reviews-title">{c('What learners are saying')}</h2><p>{c('Real comments shared by people using ProfAI.')}</p></div><button type="button" className="landing-button landing-button-primary" onClick={() => setDialogOpen(true)}>{c('Leave a comment')} <ArrowRight size={18} /></button></div>
    {message && <p className="landing-review-message" role="status">{message}</p>}
    {loading && reviews.length === 0 ? <div className="landing-reviews-state" role="status">{c('Loading comments…')}</div> : loadError && reviews.length === 0 ? <div className="landing-reviews-state"><p>{c('Comments could not be loaded right now.')}</p><button type="button" className="landing-button landing-button-secondary" onClick={() => void refresh()}>{c('Try again')}</button></div> : reviews.length === 0 ? <div className="landing-reviews-state"><Quote size={29} aria-hidden="true" /><h3>{c('Be the first to share your experience.')}</h3><p>{c('Your comment could help another learner take the next step.')}</p><button type="button" className="landing-button landing-button-secondary" onClick={() => setDialogOpen(true)}>{c('Leave a comment')} <ArrowRight size={17} /></button></div> : <TestimonialMarquee reviews={reviews} dialogOpen={dialogOpen} />}
    {dialogOpen && <CommentDialog onClose={() => setDialogOpen(false)} onSubmitted={onSubmitted} />}
  </section>
}
