import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useIsPresent } from 'framer-motion'
import { ArrowUpRight, BookOpen, Headphones, Mic, PenLine, Sparkles, X } from 'lucide-react'
import { useCopy } from '@/i18n/interface'
import UiText from '@/components/common/UiText'
import { useAuthStore } from '@/store/authStore'
import { getIeltsTestVocabulary, getIeltsVocabularyReturnTo, getIeltsVocabularyTestPath, withVocabularyReturnTo } from '@/utils/ieltsTestVocabulary'
import type { IeltsVocabularySkill } from '@/data/ieltsFullTestVocabulary'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import '@/styles/test-vocabulary.css'

const preferenceEvent = 'profai:ielts-vocabulary-reminders'

const skillIcons = { listening: Headphones, reading: BookOpen, writing: PenLine, speaking: Mic }
const easing = [0.22, 1, 0.36, 1] as const
type Props = { testId: string; skill?: IeltsVocabularySkill; variant: 'reminder' | 'link' | 'review'; compact?: boolean; ready?: boolean }

/** Exiting controls leave keyboard navigation while the card animates away. */
function VocabularyPresence({ children, variant }: { children: ReactNode; variant: Props['variant'] }) {
  const present = useIsPresent()
  const notification = variant === 'reminder'
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { if (ref.current) ref.current.inert = !present }, [present])
  return (
    <motion.div ref={ref} aria-hidden={!present || undefined} data-test-vocabulary={variant} className={`test-vocab-presence ${notification ? 'test-vocab-notification' : ''}`}
      initial={notification ? { opacity: 0, y: 20, scale: 0.96 } : { opacity: 0, height: 0 }}
      animate={notification ? { opacity: 1, y: 0, scale: 1 } : { opacity: 1, height: 'auto' }}
      exit={notification ? { opacity: 0, y: 12, scale: 0.97 } : { opacity: 0, height: 0 }}
      transition={{ duration: 0.36, ease: easing }}>
      {children}
    </motion.div>
  )
}

export default function TestVocabulary({ testId, skill, variant, compact = false, ready = true }: Props) {
  const { c } = useCopy()
  const location = useLocation()
  const { reducedMotion, allowHoverMotion } = useMotionPreferences()
  const userId = useAuthStore((state) => state.user?.id) ?? 'guest'
  const preferenceKey = `profai:ielts:vocabulary-reminders:${userId}`
  const visitKey = `${preferenceKey}:${testId}`
  const [hidden, setHidden] = useState(() => {
    try { return window.localStorage.getItem(preferenceKey) === 'never' || window.sessionStorage.getItem(visitKey) === 'hidden' }
    catch { return false }
  })
  const headingId = useId()
  const [enteredTest, setEnteredTest] = useState<string | null>(null)
  useEffect(() => {
    setEnteredTest(null)
    if (variant !== 'reminder' || !ready) return
    const timer = window.setTimeout(() => setEnteredTest(testId), 650)
    return () => window.clearTimeout(timer)
  }, [ready, testId, variant])
  useEffect(() => {
    const update = () => {
      try {
        setHidden(window.localStorage.getItem(preferenceKey) === 'never' || window.sessionStorage.getItem(visitKey) === 'hidden')
      } catch { /* Reminders still work when browser storage is unavailable. */ }
    }
    setHidden(false)
    update()
    window.addEventListener(preferenceEvent, update)
    window.addEventListener('storage', update)
    return () => {
      window.removeEventListener(preferenceEvent, update)
      window.removeEventListener('storage', update)
    }
  }, [preferenceKey, visitKey])

  const vocabulary = getIeltsTestVocabulary(testId, skill)
  const visible = ready && Boolean(vocabulary) && (variant !== 'reminder' || (!hidden && enteredTest === testId))
  const dismiss = (forever: boolean) => {
    setHidden(true)
    try {
      if (forever) window.localStorage.setItem(preferenceKey, 'never')
      else window.sessionStorage.setItem(visitKey, 'hidden')
      window.dispatchEvent(new Event(preferenceEvent))
    } catch { /* Dismiss locally even when storage is unavailable. */ }
  }
  const review = variant === 'review'
  let content: ReactNode = null
  if (vocabulary) {
    const SkillIcon = skillIcons[vocabulary.skill]
    const currentPath = `${location.pathname}${location.search}${location.hash}`
    const returnTo = getIeltsVocabularyReturnTo(currentPath)
      ?? getIeltsVocabularyTestPath(vocabulary.test.sourceTestId ?? testId, vocabulary.skill)
    const link = (
      <motion.a href={withVocabularyReturnTo(vocabulary.href, returnTo)} target="_blank" rel="opener" onClick={(event) => event.stopPropagation()}
        title={c('Opens in a new tab')} aria-label={`${c("Practise this test's vocabulary")}: ${vocabulary.test.title}`}
        className={`test-vocab-cta ${variant === 'link' ? 'test-vocab-cta--secondary' : ''}`}
        whileHover={allowHoverMotion ? { y: -2 } : undefined} whileTap={reducedMotion ? undefined : { scale: 0.98 }}>
        <BookOpen aria-hidden="true" className="h-4 w-4 shrink-0" /><span><UiText text="Practise vocabulary" /></span>
        <ArrowUpRight aria-hidden="true" className="test-vocab-cta-arrow h-4 w-4 shrink-0" />
      </motion.a>
    )
    content = variant === 'link' ? link : (
      <motion.aside aria-labelledby={headingId} role={variant === 'reminder' ? 'status' : undefined}
        className={`test-vocab-card ${review ? 'test-vocab-card--review' : 'test-vocab-card--reminder'} ${compact ? 'test-vocab-card--compact' : ''} ${reducedMotion ? 'test-vocab-card--still' : ''}`}
        initial={reducedMotion ? false : { opacity: 0, y: 14, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.48, delay: 0.16, ease: easing }}>
        <div aria-hidden="true" className="test-vocab-glow" />
        <div className="test-vocab-icon"><SkillIcon aria-hidden="true" className="h-5 w-5" /><span className="test-vocab-icon-badge"><Sparkles aria-hidden="true" className="h-2.5 w-2.5" /></span></div>
        <div className="test-vocab-copy">
          <p className="test-vocab-eyebrow"><UiText text={review ? 'Your next step' : 'Before you practise'} /></p>
          <h2 id={headingId} className="test-vocab-heading"><UiText text={review ? 'Build on what you learned' : 'Meet the words in this test'} /></h2>
          {!compact ? <p className="test-vocab-description"><UiText text={review ? 'Practise these words in context before your next attempt.' : 'Review these words before you start the test.'} /></p> : null}
          <div className="test-vocab-meta"><span>{vocabulary.test.title}</span><span className="test-vocab-count">{vocabulary.wordCount} <UiText text="words" /></span></div>
          {!compact ? <div className="test-vocab-words">{vocabulary.preview.slice(0, 3).map((entry, index) => (
            <motion.span key={entry.id} className="test-vocab-word" initial={reducedMotion ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.28 + index * 0.06, ease: easing }}>{entry.term}</motion.span>
          ))}</div> : null}
        </div>
        <div className="test-vocab-actions">{link}{!review ? <button type="button" onClick={() => dismiss(true)} className="test-vocab-never"><UiText text="Never show reminders again" /></button> : null}</div>
        {!review ? <button type="button" onClick={() => dismiss(false)} aria-label={c('Dismiss for now')} title={c('Dismiss for now')} className="test-vocab-dismiss"><X aria-hidden="true" className="h-4 w-4" /></button> : null}
      </motion.aside>
    )
  }
  const result = reducedMotion ? (visible ? <div className={`test-vocab-slot test-vocab-slot--${variant} ${variant === 'reminder' ? 'test-vocab-notification' : ''}`} data-test-vocabulary={variant}>{content}</div> : null) : (
    <AnimatePresence>
      {visible ? <VocabularyPresence key={`${variant}:${testId}`} variant={variant}><div className={`test-vocab-slot test-vocab-slot--${variant}`}>{content}</div></VocabularyPresence> : null}
    </AnimatePresence>
  )
  return variant === 'reminder' ? createPortal(result, document.body) : result
}
