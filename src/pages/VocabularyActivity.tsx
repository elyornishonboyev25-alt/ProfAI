import UiText from '@/components/common/UiText'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, BookOpenCheck, RotateCcw, Sparkles, Trophy, X } from 'lucide-react'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { Link, Navigate, useLocation, useParams, useSearchParams } from 'react-router-dom'
import VocabularyTestReturn from '@/components/vocab/VocabularyTestReturn'
import { getIeltsVocabularyReturnTo, withVocabularyReturnTo } from '@/utils/ieltsTestVocabulary'
import { vocabularyCollections, type VocabularyEntry } from '@/data/vocabularyCollections'
import { getArticleBySlug } from '@/data/articles'
import { getSavedWords, type VocabContext } from '@/utils/myVocabularyStore'
import {
  ActivityPicker,
  FlashcardsActivity,
  MatchingActivity,
  QuizActivity,
  TypingActivity,
  type ActivityMode,
} from '@/components/vocab/activities'
import { WordSaveProvider } from '@/components/vocab/SaveWordButton'
import VocabularyInlineLibrary from '@/components/vocab/VocabularyInlineLibrary'
import { useAuthStore } from '@/store/authStore'
import { recordXpActivity, type XpActivitySource } from '@/lib/xpApi'
import { READING_ROADMAP_FULL_TEST_DAYS } from '@/utils/ieltsTrackCatalog'

type Selection = {
  title: string
  subtitle: string
  entries: VocabularyEntry[]
  basePath: string
  trackPath: string
  trackLabel: string
  rewardKey: string
  masteryKey: string
  accent: 'red' | 'blue'
}

const ACTIVITY_LABELS: Record<ActivityMode, string> = {
  flashcards: 'Flashcards', matching: 'Matching Game', quiz: 'Quiz', typing: 'Typing Drill',
}

function resolveActivity(activity?: string): ActivityMode | null {
  if (activity === 'flashcards' || activity === 'matching' || activity === 'quiz' || activity === 'typing') return activity
  return null
}

function contextLabel(context: VocabContext) {
  if (context === 'sat') return 'SAT'
  if (context === 'reading') return 'Reading'
  if (context === 'listening') return 'Listening'
  if (context === 'writing') return 'Writing'
  if (context === 'speaking') return 'Speaking'
  return 'Article'
}

function findSelection(params: Record<string, string | undefined>): Selection | null {
  const { bookId, testId, sectionId, packId, articleSlug, wordsContext } = params

  // ---- Article vocabulary (the PDF's hard words) ----
  if (articleSlug) {
    const article = getArticleBySlug(articleSlug)
    if (!article) return null
    return {
      title: article.title,
      subtitle: `Key vocabulary · ${article.vocabulary.length} terms`,
      entries: article.vocabulary,
      basePath: `/vocabulary/articles/${article.slug}`,
      trackPath: '/vocabulary/articles',
      trackLabel: 'Articles Vocabulary',
      rewardKey: `article:${article.slug}`,
      masteryKey: `article:${article.slug}`,
      accent: 'red',
    }
  }

  // ---- My Words (AI-asked + manually added) per context ----
  if (wordsContext === 'reading' || wordsContext === 'listening' || wordsContext === 'writing' || wordsContext === 'speaking' || wordsContext === 'article' || wordsContext === 'sat') {
    const entries = getSavedWords(wordsContext)
    return {
      title: `My ${contextLabel(wordsContext)} Words`,
      subtitle: `${entries.length} saved terms`,
      entries,
      basePath: `/vocabulary/my-words/${wordsContext}`,
      trackPath: `/vocabulary/my-words/${wordsContext}`,
      trackLabel: 'My Words',
      rewardKey: `mywords:${wordsContext}`,
      masteryKey: `mywords:${wordsContext}`,
      accent: 'red',
    }
  }

  // ---- IELTS Full Test sets for all four skills ----
  if (bookId && testId && sectionId) {
    let resolvedBook = bookId
    let resolvedTest = testId
    let resolvedSection = sectionId
    // Keep saved-word origin links working after removing the old Day catalog
    // and replacing library numbering with the site's visible Full Test order.
    const legacyLibrary = sectionId.match(/^reading_full_test_(\d+)_passage_(\d+)$/)
    const legacyDay = sectionId.match(/^reading_day_(\d+)_passage_(\d+)$/)
    if (bookId === 'reading_full_track' && legacyLibrary && testId === `reading_full_test_${legacyLibrary[1]}` && Number(legacyLibrary[1]) <= 10) {
      const number = Number(legacyLibrary[1]) + 12
      resolvedTest = `reading_full_test_${number}`
      resolvedSection = `${resolvedTest}_part_${legacyLibrary[2]}`
    } else if (bookId === 'reading_days_track' && legacyDay && testId === `reading_day_${legacyDay[1]}`) {
      const day = Number(legacyDay[1])
      const index = READING_ROADMAP_FULL_TEST_DAYS.findIndex((days) => days.includes(day))
      if (index >= 0) {
        const days = READING_ROADMAP_FULL_TEST_DAYS[index]
        const part = days.length === 1 ? Number(legacyDay[2]) : days.indexOf(day) + 1
        resolvedBook = 'reading_full_track'
        resolvedTest = `reading_full_test_${index + 1}`
        resolvedSection = `${resolvedTest}_part_${part}`
      }
    }
    const book = vocabularyCollections.ielts.find((b) => b.id === resolvedBook)
    const test = book?.tests.find((t) => t.id === resolvedTest)
    if (!book || !test || test.available === false) return null
    const section = test.sections.find((s) => s.id === resolvedSection)
    if (!section) return null
    return {
      title: `${test.title} · ${section.title}`,
      subtitle: `${book.title} · ${section.entries.length} terms`,
      entries: section.entries,
      basePath: `/vocabulary/ielts/${book.id}/${test.id}/${section.id}`,
      trackPath: `/vocabulary/ielts?skill=${book.skill}&test=${book.tests.indexOf(test) + 1}&part=${test.sections.indexOf(section) + 1}`,
      trackLabel: 'IELTS Vocabulary Track',
      rewardKey: `ielts:${book.id}:${test.id}:${section.id}`,
      masteryKey: `ielts:${book.id}:${test.id}:${section.id}`,
      accent: 'red',
    }
  }

  // ---- SAT packs ----
  if (packId && sectionId) {
    const pack = vocabularyCollections.sat.find((p) => p.id === packId)
    const section = pack?.sections.find((s) => s.id === sectionId)
    if (!pack || !section) return null
    return {
      title: `${pack.title} · ${section.title}`,
      subtitle: `${section.entries.length} terms`,
      entries: section.entries,
      basePath: `/vocabulary/sat/${pack.id}/${section.id}`,
      trackPath: '/vocabulary/sat',
      trackLabel: 'SAT Vocabulary Track',
      rewardKey: `sat:${pack.id}:${section.id}`,
      masteryKey: `sat:${pack.id}:${section.id}`,
      accent: 'blue',
    }
  }

  return null
}

export default function VocabularyActivity() {
  const params = useParams()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const returnTo = params.bookId ? getIeltsVocabularyReturnTo(searchParams.get('returnTo')) : null
  const navigationState = params.packId && (location.state as { from?: string } | null)?.from === '/sat'
    ? { from: '/sat' }
    : undefined
  const user = useAuthStore((state) => state.user)
  const updateUserProgress = useAuthStore((state) => state.updateUserProgress)
  const activity = resolveActivity(params.activity)
  const [xpStatus, setXpStatus] = useState<{ key: string; message: string; retry?: () => void } | null>(null)
  const [expandedLibrary, setExpandedLibrary] = useState<string | null>(null)
  const pageRef = useRef<HTMLDivElement>(null)
  const pendingXp = useRef(new Set<string>())
  const { reducedMotion } = useMotionPreferences()
  const [celebration, setCelebration] = useState<{ key: string; amount: number; mode: ActivityMode } | null>(null)
  useEffect(() => {
    if (!celebration) return
    const timer = window.setTimeout(() => setCelebration(null), 3200)
    return () => window.clearTimeout(timer)
  }, [celebration])
  const selection = useMemo(() => findSelection(params), [params])
  const libraryOpen = !activity && expandedLibrary === selection?.basePath

  useLayoutEffect(() => {
    const page = pageRef.current
    const shell = page?.querySelector<HTMLElement>('.vocab-practice-shell')
    if (!page || !shell || activity) return
    // Keep the activity cards at their fitted viewport height when words unfold.
    const measure = () => {
      const pageStyle = getComputedStyle(page)
      const gap = parseFloat(getComputedStyle(shell).rowGap) || 0
      const children = ([...shell.children] as HTMLElement[]).filter((child) =>
        !['absolute', 'fixed'].includes(getComputedStyle(child).position),
      )
      const reserved = children.reduce((height, child) => {
        if (child.matches('.vocab-activity-picker')) return height
        const row = child.querySelector<HTMLElement>('.vocab-word-list') ?? child
        return height + row.getBoundingClientRect().height
      }, 0)
      const height = page.clientHeight - parseFloat(pageStyle.paddingTop) - parseFloat(pageStyle.paddingBottom)
        - reserved - gap * (children.length - 1)
      shell.style.setProperty('--vocab-picker-height', `${Math.max(0, height)}px`)
    }
    measure()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    observer?.observe(page)
    for (const child of shell.children) {
      if (!child.matches('.vocab-activity-picker, .vocab-inline-library')) observer?.observe(child)
    }
    window.addEventListener('resize', measure)
    return () => { observer?.disconnect(); window.removeEventListener('resize', measure) }
  }, [activity, selection?.basePath, xpStatus])

  if (!selection) return <Navigate to="/vocabulary" replace />
  if (params.activity && !activity) return <Navigate to={selection.basePath} state={navigationState} replace />

  const { title, subtitle, entries, basePath, trackPath, trackLabel, rewardKey, masteryKey, accent } = selection
  const isBlue = accent === 'blue'
  const backClass = isBlue ? 'premium-back-btn-sm-blue' : 'premium-back-btn-sm'
  const chipClass = isBlue ? 'premium-top-chip-blue' : 'premium-top-chip'
  const awardVocabulary = (mode: ActivityMode, accuracy: number) => {
    if (useAuthStore.getState().user?.id !== user?.id) return
    setCelebration(null)
    if (accuracy < 80) {
      setXpStatus({ key: rewardKey, message: 'Reach at least 80% to earn XP. Try again!' })
      return
    }
    if (!user) {
      setXpStatus({ key: rewardKey, message: 'Sign in to earn XP for completed activities.' })
      return
    }
    const sources: Record<ActivityMode, XpActivitySource> = {
      flashcards: 'VOCAB_FLASHCARDS',
      matching: 'VOCAB_MATCHING',
      quiz: 'VOCAB_QUIZ',
      typing: 'VOCAB_TYPING',
    }
    const eventKey = `${rewardKey}:${mode}`
    if (pendingXp.current.has(eventKey)) return
    pendingXp.current.add(eventKey)
    setXpStatus({ key: rewardKey, message: 'Saving XP…' })
    void recordXpActivity({
      source: sources[mode],
      eventKey,
      accuracy,
      metadata: { rewardKey, mode, terms: entries.length },
    }).then((reward) => {
      if (useAuthStore.getState().user?.id !== user.id) return
      updateUserProgress({ xp: reward.totalXp, level: reward.level, currentStreak: reward.currentStreak })
      if (!reward.duplicate && reward.xpEarned > 0) {
        setCelebration({ key: eventKey, amount: reward.xpEarned, mode })
      }
      setXpStatus({ key: rewardKey, message: reward.duplicate
        ? 'XP for this activity has already been collected.'
        : reward.xpEarned > 0 ? `+${reward.xpEarned} XP earned!` : 'Daily vocabulary XP limit reached (120 XP).' })
    }).catch(() => {
      setXpStatus({ key: rewardKey, message: 'XP could not be saved. Retry to collect your reward.', retry: () => awardVocabulary(mode, accuracy) })
    }).finally(() => pendingXp.current.delete(eventKey))
  }

  // My Words sets can be empty — guide the learner instead of showing a broken activity.
  if (entries.length === 0) {
    return (
      <div className="workspace-page relative min-h-screen overflow-hidden px-4 py-10 sm:px-6 lg:px-10">
        <div className="relative mx-auto w-full max-w-2xl rounded-[1.8rem] border border-blue-100 bg-white p-8 text-center shadow-[0_24px_54px_rgba(15,23,42,0.1)]">
          <BookOpenCheck className="mx-auto h-10 w-10 text-blue-500" />
          <h3 className="mt-3 text-2xl font-black text-slate-900">{title}</h3>
          <p className="mt-2 text-sm text-slate-600">No words here yet. Select a word while studying and tap “Ask AI”, or add one manually.</p>
          <Link to={trackPath} state={navigationState} className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white">
            <ArrowLeft className="h-4 w-4" />  <UiText text={"Back"} /> </Link>
        </div>
      </div>
    )
  }

  const saveContext = params.wordsContext ? null : {
    context: (params.packId ? 'sat' : params.articleSlug ? 'article' : vocabularyCollections.ielts.find((book) => book.id === params.bookId)?.skill ?? 'reading') as VocabContext,
    origin: { label: params.bookId ? `${selection.subtitle.split(' · ')[0]} · ${title}` : title, path: basePath },
  }

  return (
    <WordSaveProvider value={saveContext}>
      <div ref={pageRef} className="workspace-page vocab-practice" data-mode={activity ?? 'picker'} data-accent={accent} data-library-open={libraryOpen}>

        <div className="vocab-practice-shell">
          {/* hero */}
          <header className="vocab-practice-header">
            <div className="premium-top-controls">
              <Link to={withVocabularyReturnTo(activity ? basePath : trackPath, returnTo)} state={navigationState} className={`${backClass} group`}>
                <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
                {activity ? 'Activities' : 'Back'}
              </Link>
              <span className={`${chipClass} gap-1`}>
                <Sparkles className="h-3.5 w-3.5" />
                {trackLabel}
              </span>
              {activity ? (
                <Link to={withVocabularyReturnTo(trackPath, returnTo)} state={navigationState} className={backClass}>
                  <RotateCcw className="mr-1 h-4 w-4" />
                   <UiText text={"Track"} /> </Link>
              ) : null}
              <VocabularyTestReturn returnTo={returnTo} />
            </div>
            <div className="vocab-practice-heading">
              <p className="vocab-header-eyebrow">YOUR VOCABULARY WORKSPACE</p>
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
            <div className="vocab-header-stamp" aria-hidden="true"><BookOpenCheck size={26} strokeWidth={1.4} /><span>SMALL STEPS<br /><strong>LASTING KNOWLEDGE</strong></span></div>
          </header>

          {xpStatus?.key === rewardKey ? (
            <div role="status" className="vocab-xp-status flex flex-wrap items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 p-2 text-xs font-semibold text-blue-800">
              {xpStatus.message}
              {xpStatus.retry ? <button onClick={xpStatus.retry} className="rounded-lg bg-blue-600 px-3 py-1.5 text-white">Retry XP</button> : null}
              <button type="button" onClick={() => setXpStatus(null)} aria-label="Close XP notification" className="ml-auto rounded-lg p-1.5"><X className="h-4 w-4" /></button>
            </div>
          ) : null}
          {!activity ? (
            <>
              <section className="vocab-practice-intro">
                <div>
                  <h2>Choose how to study</h2>
                  <p>Flip, match, quiz, and type — build confidence one word at a time.</p>
                </div>
                <p className="vocab-reward-note">80% to earn XP · Once per activity · 120 XP daily limit</p>
              </section>
              <ActivityPicker basePath={basePath} entriesCount={entries.length} navigationState={navigationState} previewEntry={entries[0]} returnTo={returnTo} />
              <VocabularyInlineLibrary key={basePath} entries={entries} accent={accent} open={libraryOpen} onToggle={() => setExpandedLibrary(libraryOpen ? null : basePath)} />
            </>
          ) : (
            <section className={`vocab-game-stage vocab-game-stage-${activity}`} aria-label={ACTIVITY_LABELS[activity]}>
              {activity === 'flashcards' ? <FlashcardsActivity key={basePath} entries={entries} masteryKey={masteryKey} onComplete={(accuracy) => awardVocabulary('flashcards', accuracy)} /> : null}
              {activity === 'matching' ? <MatchingActivity key={basePath} entries={entries} rewardKey={rewardKey} onComplete={(accuracy) => awardVocabulary('matching', accuracy)} /> : null}
              {activity === 'quiz' ? <QuizActivity key={basePath} entries={entries} onComplete={(accuracy) => awardVocabulary('quiz', accuracy)} /> : null}
              {activity === 'typing' ? <TypingActivity key={basePath} entries={entries} onComplete={(accuracy) => awardVocabulary('typing', accuracy)} /> : null}
            </section>
          )}
        </div>
        <AnimatePresence>
          {celebration && celebration.key === `${rewardKey}:${activity}` ? (
            <motion.div key={celebration.key} role="status" aria-label={`+${celebration.amount} XP earned`} className="pointer-events-none fixed inset-0 z-[130] flex items-center justify-center px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="absolute inset-0 bg-slate-900/25 backdrop-blur-[2px]" />
              <motion.div initial={reducedMotion ? false : { scale: 0.7, y: 30 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }} className="relative rounded-[2rem] border border-amber-200 bg-gradient-to-br from-white via-amber-50 to-orange-100 px-12 py-10 text-center shadow-2xl">
                <Trophy className="mx-auto h-12 w-12 text-amber-500" />
                <p className="mt-4 text-5xl font-black text-slate-900">+{celebration.amount} XP</p>
                <p className="mt-3 font-bold text-amber-700">{ACTIVITY_LABELS[celebration.mode]} complete!</p>
                {!reducedMotion ? Array.from({ length: 8 }, (_, i) => (
                  <motion.span key={i} aria-hidden="true" className="absolute text-amber-400" style={{ left: `${10 + (i % 4) * 25}%`, top: i < 4 ? '15%' : '80%' }} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: [0, 1, 0], scale: [0, 1.3, 0.5], y: [0, -45, -90], rotate: [0, 90] }} transition={{ duration: 2, delay: i * 0.1 }}><Sparkles className="h-6 w-6" /></motion.span>
                )) : null}
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </WordSaveProvider>
  )
}
