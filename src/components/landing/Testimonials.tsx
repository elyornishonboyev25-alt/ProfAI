import { type FormEvent, type TouchEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight, MessageSquareText, Pause, Play, Quote, Star, X } from 'lucide-react'
import { useCopy } from '@/i18n/interface'
import { loadReviews, submitReview, type LandingReview, type ReviewExam } from '@/lib/reviewsApi'

const GAP = 18

function columnsForWidth(width: number) {
  return width < 700 ? 1 : width < 1050 ? 2 : 3
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toLocaleUpperCase()).join('') || '?'
}

function ReviewCard({ review, hidden = false }: { review: LandingReview; hidden?: boolean }) {
  const { c, language } = useCopy()
  const [expanded, setExpanded] = useState(false)
  const long = review.text.length > 260
  const text = long && !expanded ? `${review.text.slice(0, 260).trimEnd()}…` : review.text
  const date = new Date(review.createdAt)
  const formattedDate = Number.isNaN(date.getTime()) ? null : new Intl.DateTimeFormat(language === 'uz' ? 'uz-UZ' : language === 'ru' ? 'ru-RU' : 'en-US', { dateStyle: 'medium' }).format(date)
  const rating = typeof review.rating === 'number' && review.rating >= 1 && review.rating <= 5 ? review.rating : null

  return <article className="landing-review-card" aria-hidden={hidden || undefined}>
    <div className="landing-review-card-top"><Quote size={24} aria-hidden="true" /><span>{review.exam}</span></div>
    {rating !== null && <div className="landing-review-stars" aria-label={c('Rated {rating} out of 5 stars').replace('{rating}', String(rating))}>{Array.from({ length: rating }, (_, index) => <Star key={index} size={15} fill="currentColor" aria-hidden="true" />)}</div>}
    <p className="landing-review-text">{text}</p>
    {long && !hidden && <button type="button" className="landing-review-more" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>{c(expanded ? 'Read less' : 'Read more')}</button>}
    <div className="landing-review-author"><span className="landing-review-avatar" aria-hidden="true">{initials(review.name)}</span><div><strong>{review.name}</strong>{formattedDate && <small>{formattedDate}</small>}</div></div>
  </article>
}

function CommentDialog({ onClose, onSubmitted }: { onClose: () => void; onSubmitted: (review: LandingReview) => void }) {
  const { c } = useCopy()
  const dialogRef = useRef<HTMLDivElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const sendingRef = useRef(false)
  const [name, setName] = useState('')
  const [exam, setExam] = useState<ReviewExam>('General')
  const [rating, setRating] = useState('')
  const [comment, setComment] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

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
    if (cleanName.length < 2 || cleanName.length > 60) { setError(c('Enter a name between 2 and 60 characters.')); nameRef.current?.focus(); return }
    if (cleanComment.length < 8 || cleanComment.length > 600) { setError(c('Your comment must be between 8 and 600 characters.')); return }
    sendingRef.current = true
    setSending(true)
    setError('')
    try {
      const review = await submitReview({ name: cleanName, exam, rating: rating ? Number(rating) : undefined, text: cleanComment })
      onSubmitted(review)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : c('Your comment could not be sent. Please try again.'))
    } finally {
      sendingRef.current = false
      setSending(false)
    }
  }

  return createPortal(<div className="landing-comment-backdrop" onMouseDown={event => { if (event.target === event.currentTarget && !sending) onClose() }}>
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="landing-comment-title" aria-describedby="landing-comment-description" className="landing-comment-dialog">
      <button type="button" className="landing-icon-button landing-comment-close" aria-label={c('Close comment form')} onClick={onClose} disabled={sending}><X size={20} /></button>
      <span className="landing-section-kicker"><MessageSquareText size={15} /> {c('YOUR VOICE MATTERS')}</span>
      <h2 id="landing-comment-title">{c('Leave a comment')}</h2>
      <p id="landing-comment-description">{c('Tell us about your experience with ProfAI. Your words will appear here when they are public.')}</p>
      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="landing-comment-name">{c('Display name')}</label>
        <input ref={nameRef} id="landing-comment-name" type="text" autoComplete="name" maxLength={60} required value={name} onChange={event => setName(event.target.value)} placeholder={c('Your name')} />
        <div className="landing-comment-row"><div><label htmlFor="landing-comment-exam">{c('Preparation area')}</label><select id="landing-comment-exam" value={exam} onChange={event => setExam(event.target.value as ReviewExam)}><option value="General">{c('General')}</option><option value="IELTS">IELTS</option><option value="SAT">Digital SAT</option></select></div><div><label htmlFor="landing-comment-rating">{c('Rating (optional)')}</label><select id="landing-comment-rating" value={rating} onChange={event => setRating(event.target.value)}><option value="">{c('No rating')}</option>{[5, 4, 3, 2, 1].map(value => <option key={value} value={value}>{value} / 5</option>)}</select></div></div>
        <label htmlFor="landing-comment-text">{c('Your comment')}</label>
        <textarea id="landing-comment-text" required minLength={8} maxLength={600} rows={5} value={comment} onChange={event => setComment(event.target.value)} placeholder={c('What was helpful? What could be better?')} />
        <span className="landing-comment-count">{comment.length}/600</span>
        {error && <p className="landing-comment-error" role="alert">{error}</p>}
        <button type="submit" className="landing-button landing-button-primary landing-comment-submit" disabled={sending} aria-busy={sending}>{sending ? c('Sending…') : c('Send comment')} <ArrowRight size={18} /></button>
      </form>
    </div>
  </div>, document.body)
}

export default function Testimonials() {
  const { c } = useCopy()
  const reducedMotion = useReducedMotion()
  const [reviews, setReviews] = useState<LandingReview[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [message, setMessage] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [columns, setColumns] = useState(() => columnsForWidth(typeof window === 'undefined' ? 1200 : window.innerWidth))
  const [viewportWidth, setViewportWidth] = useState(0)
  const [position, setPosition] = useState(0)
  const [animated, setAnimated] = useState(false)
  const [sliding, setSliding] = useState(false)
  const [playing, setPlaying] = useState(true)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [interacting, setInteracting] = useState(false)
  const [pageVisible, setPageVisible] = useState(() => typeof document === 'undefined' || !document.hidden)
  const viewportRef = useRef<HTMLDivElement>(null)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const interactionTimer = useRef<number | null>(null)
  const visible = Math.min(columns, Math.max(reviews.length, 1))
  const canCycle = reviews.length > visible

  const refresh = useCallback(async () => {
    try { setReviews(await loadReviews()); setLoadError(false) }
    catch { setLoadError(true) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void refresh() }, [refresh])
  useEffect(() => {
    const update = () => setColumns(columnsForWidth(window.innerWidth))
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const observer = new ResizeObserver(() => setViewportWidth(viewport.clientWidth))
    observer.observe(viewport)
    setViewportWidth(viewport.clientWidth)
    return () => observer.disconnect()
  }, [loading, reviews.length])
  useEffect(() => {
    setAnimated(false)
    setPosition(canCycle ? visible : 0)
    setSliding(false)
    const frame = requestAnimationFrame(() => setAnimated(true))
    return () => cancelAnimationFrame(frame)
  }, [canCycle, visible, reviews.length])
  useEffect(() => {
    const update = () => setPageVisible(!document.hidden)
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])
  useEffect(() => () => { if (interactionTimer.current !== null) window.clearTimeout(interactionTimer.current) }, [])

  const noteInteraction = useCallback(() => {
    setInteracting(true)
    if (interactionTimer.current !== null) window.clearTimeout(interactionTimer.current)
    interactionTimer.current = window.setTimeout(() => setInteracting(false), 8000)
  }, [])
  const move = useCallback((direction: number) => {
    if (!canCycle || sliding) return
    if (reducedMotion) {
      setPosition(current => visible + (((current - visible + direction) % reviews.length + reviews.length) % reviews.length))
      return
    }
    setSliding(true)
    setAnimated(true)
    setPosition(current => current + direction)
  }, [canCycle, reducedMotion, reviews.length, sliding, visible])
  const manualMove = (direction: number) => { noteInteraction(); move(direction) }

  useEffect(() => {
    if (!canCycle || reducedMotion || !playing || hovered || focused || interacting || !pageVisible || dialogOpen) return
    const timer = window.setInterval(() => move(1), 5000)
    return () => window.clearInterval(timer)
  }, [canCycle, reducedMotion, playing, hovered, focused, interacting, pageVisible, dialogOpen, move])

  const slides = useMemo(() => canCycle
    ? [...reviews.slice(-visible), ...reviews, ...reviews.slice(0, visible)]
    : reviews, [canCycle, reviews, visible])
  const cardWidth = viewportWidth > 0 ? (viewportWidth - GAP * (visible - 1)) / visible : 0
  const active = canCycle ? ((position - visible) % reviews.length + reviews.length) % reviews.length : 0

  function finishSlide() {
    if (!canCycle) return
    if (position >= reviews.length + visible) { setAnimated(false); setPosition(visible) }
    else if (position < visible) { setAnimated(false); setPosition(reviews.length + visible - 1) }
    setSliding(false)
  }
  function jumpTo(index: number) {
    if (!canCycle || sliding || index === active) return
    noteInteraction()
    if (reducedMotion) { setPosition(visible + index); return }
    setAnimated(true)
    setSliding(true)
    setPosition(visible + index)
  }
  function onTouchStart(event: TouchEvent) { touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY } }
  function onTouchEnd(event: TouchEvent) {
    const start = touchStart.current
    touchStart.current = null
    if (!start) return
    const dx = event.changedTouches[0].clientX - start.x
    const dy = event.changedTouches[0].clientY - start.y
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) manualMove(dx < 0 ? 1 : -1)
  }
  const onSubmitted = (review: LandingReview) => {
    setDialogOpen(false)
    setMessage(review.approved === false ? c('Thank you. Your comment was submitted for review.') : c('Thank you. Your comment was submitted.'))
    if (review.approved !== false) void refresh()
  }

  return <section id="comments" className="landing-reviews-section landing-arena-section" aria-labelledby="landing-reviews-title">
    <div className="landing-reviews-heading"><div><span className="landing-section-kicker"><MessageSquareText size={15} /> {c('COMMUNITY VOICES')}</span><h2 id="landing-reviews-title">{c('What learners are saying')}</h2><p>{c('Real comments shared by people using ProfAI.')}</p></div><button type="button" className="landing-button landing-button-primary" onClick={() => setDialogOpen(true)}>{c('Leave a comment')} <ArrowRight size={18} /></button></div>
    {message && <p className="landing-review-message" role="status">{message}</p>}
    {loading ? <div className="landing-reviews-state" role="status">{c('Loading comments…')}</div> : loadError ? <div className="landing-reviews-state"><p>{c('Comments could not be loaded right now.')}</p><button type="button" className="landing-button landing-button-secondary" onClick={() => void refresh()}>{c('Try again')}</button></div> : reviews.length === 0 ? <div className="landing-reviews-state"><Quote size={29} aria-hidden="true" /><h3>{c('Be the first to share your experience.')}</h3><p>{c('Your comment could help another learner take the next step.')}</p><button type="button" className="landing-button landing-button-secondary" onClick={() => setDialogOpen(true)}>{c('Leave a comment')} <ArrowRight size={17} /></button></div> : <div className="landing-reviews-carousel" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setFocused(false) }} onKeyDown={event => { if (event.key === 'ArrowRight') { event.preventDefault(); manualMove(1) } else if (event.key === 'ArrowLeft') { event.preventDefault(); manualMove(-1) } }}>
      <div className="landing-reviews-viewport" style={{ maxWidth: reviews.length === 1 ? 430 : reviews.length === 2 && columns > 2 ? 820 : undefined }} ref={viewportRef} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="landing-reviews-track" aria-live="off" style={{ gap: GAP, transform: canCycle ? `translate3d(${-position * (cardWidth + GAP)}px, 0, 0)` : undefined, transitionDuration: animated && !reducedMotion ? '550ms' : '0ms', opacity: viewportWidth ? 1 : 0 }} onTransitionEnd={event => { if (event.target === event.currentTarget) finishSlide() }}>
          {slides.map((review, index) => {
            const cloned = canCycle && (index < visible || index >= visible + reviews.length)
            return <div key={`${review.id}-${index}`} className="landing-reviews-slide" style={{ width: cardWidth || undefined }}><ReviewCard review={review} hidden={cloned} /></div>
          })}
        </div>
      </div>
      {canCycle && <div className="landing-reviews-controls"><div className="landing-reviews-pagination" aria-label={c('Comment pages')}>{reviews.map((review, index) => <button key={review.id} type="button" aria-label={`${c('Go to comment')} ${index + 1}`} aria-current={index === active ? 'true' : undefined} className={index === active ? 'is-active' : ''} onClick={() => jumpTo(index)} />)}</div><div className="landing-reviews-actions"><button type="button" className="landing-icon-button" aria-label={c(playing ? 'Pause carousel' : 'Play carousel')} onClick={() => setPlaying(value => !value)}>{playing ? <Pause size={17} /> : <Play size={17} />}</button><button type="button" className="landing-icon-button" aria-label={c('Previous comment')} onClick={() => manualMove(-1)}><ArrowLeft size={19} /></button><button type="button" className="landing-icon-button" aria-label={c('Next comment')} onClick={() => manualMove(1)}><ArrowRight size={19} /></button></div></div>}
    </div>}
    {dialogOpen && <CommentDialog onClose={() => setDialogOpen(false)} onSubmitted={onSubmitted} />}
  </section>
}
