import { useMemo } from 'react'
import { ArrowLeft, BookOpenCheck, RotateCcw, Sparkles, Volume2 } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { vocabularyCollections, type VocabularyEntry } from '@/data/vocabularyCollections'
import { getArticleBySlug } from '@/data/articles'
import { getSavedWords, type VocabContext } from '@/utils/myVocabularyStore'
import {
  ActivityPicker,
  FlashcardsActivity,
  MatchingActivity,
  QuizActivity,
  TypingActivity,
  usePronunciation,
  type ActivityMode,
} from '@/components/vocab/activities'
import { useAuthStore } from '@/store/authStore'
import { recordXpActivity, type XpActivitySource } from '@/lib/xpApi'

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

function resolveActivity(activity?: string): ActivityMode | null {
  if (activity === 'flashcards' || activity === 'matching' || activity === 'quiz' || activity === 'typing') return activity
  return null
}

function contextLabel(context: VocabContext) {
  if (context === 'reading') return 'Reading'
  if (context === 'listening') return 'Listening'
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
  if (wordsContext === 'reading' || wordsContext === 'listening' || wordsContext === 'article') {
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

  // ---- IELTS reading sets ----
  if (bookId && testId && sectionId) {
    const book = vocabularyCollections.ielts.find((b) => b.id === bookId)
    const test = book?.tests.find((t) => t.id === testId)
    if (!book || !test || test.available === false) return null
    const section = test.sections.find((s) => s.id === sectionId)
    if (!section) return null
    return {
      title: `${test.title} · ${section.title}`,
      subtitle: `${book.title} · ${section.entries.length} terms`,
      entries: section.entries,
      basePath: `/vocabulary/ielts/${book.id}/${test.id}/${section.id}`,
      trackPath: '/vocabulary/ielts',
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

function TermPreview({ entries }: { entries: VocabularyEntry[] }) {
  const { speak } = usePronunciation()
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {entries.slice(0, 12).map((entry) => (
        <div key={entry.id} className="flex items-start justify-between gap-2 rounded-xl border border-blue-100 bg-white px-3.5 py-2.5">
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900">{entry.term}</p>
            <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{entry.uzbek ?? entry.definition}</p>
          </div>
          <button onClick={() => speak(entry.term)} className="shrink-0 rounded-md p-1 text-slate-400 hover:text-blue-600" aria-label="Pronounce">
            <Volume2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}

export default function VocabularyActivity() {
  const params = useParams()
  const user = useAuthStore((state) => state.user)
  const updateUserProgress = useAuthStore((state) => state.updateUserProgress)
  const activity = resolveActivity(params.activity)
  const selection = useMemo(() => findSelection(params), [params])

  if (!selection) return <Navigate to="/vocabulary" replace />
  if (params.activity && !activity) return <Navigate to={selection.basePath} replace />

  const { title, subtitle, entries, basePath, trackPath, trackLabel, rewardKey, masteryKey, accent } = selection
  const isBlue = accent === 'blue'
  const backClass = isBlue ? 'premium-back-btn-sm-blue' : 'premium-back-btn-sm'
  const chipClass = isBlue ? 'premium-top-chip-blue' : 'premium-top-chip'
  const awardVocabulary = (mode: ActivityMode, accuracy: number) => {
    if (!user) return
    const sources: Record<ActivityMode, XpActivitySource> = {
      flashcards: 'VOCAB_FLASHCARDS',
      matching: 'VOCAB_MATCHING',
      quiz: 'VOCAB_QUIZ',
      typing: 'VOCAB_TYPING',
    }
    void recordXpActivity({
      source: sources[mode],
      eventKey: `${rewardKey}:${mode}`,
      accuracy,
      metadata: { rewardKey, mode, terms: entries.length },
    }).then((reward) => updateUserProgress({ xp: reward.totalXp, level: reward.level })).catch(() => {})
  }

  // My Words sets can be empty — guide the learner instead of showing a broken activity.
  if (entries.length === 0) {
    return (
      <div className="workspace-page relative min-h-screen overflow-hidden px-4 py-10 sm:px-6 lg:px-10">
        <div className="relative mx-auto w-full max-w-2xl rounded-[1.8rem] border border-blue-100 bg-white p-8 text-center shadow-[0_24px_54px_rgba(15,23,42,0.1)]">
          <BookOpenCheck className="mx-auto h-10 w-10 text-blue-500" />
          <h3 className="mt-3 text-2xl font-black text-slate-900">{title}</h3>
          <p className="mt-2 text-sm text-slate-600">No words here yet. Select a word while studying and tap “Ask AI”, or add one manually.</p>
          <Link to={trackPath} className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="workspace-page relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-10">

      <div className="relative mx-auto w-full max-w-5xl space-y-5">
        {/* hero */}
        <section className={`relative overflow-hidden rounded-[1.8rem] border bg-white/90 p-5 shadow-[0_24px_54px_rgba(15,23,42,0.1)] backdrop-blur-xl sm:p-7 ${isBlue ? 'border-blue-100' : 'border-blue-100'}`}>
          <div className="premium-top-controls">
            <Link to={activity ? basePath : trackPath} className={`${backClass} group`}>
              <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
              {activity ? 'Activities' : 'Back'}
            </Link>
            <span className={`${chipClass} gap-1`}>
              <Sparkles className="h-3.5 w-3.5" />
              {trackLabel}
            </span>
            {activity ? (
              <Link to={trackPath} className={backClass}>
                <RotateCcw className="mr-1 h-4 w-4" />
                Track
              </Link>
            ) : null}
          </div>
          <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p>
        </section>

        {!activity ? (
          <>
            <section className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-white p-5">
              <h2 className="text-xl font-black text-slate-900">Choose how to study</h2>
              <p className="mt-1 text-sm text-slate-600">Four focused drills — flip, match, quiz, and type — with audio, instant feedback, and diamond rewards.</p>
            </section>
            <ActivityPicker basePath={basePath} entriesCount={entries.length} />
            <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-slate-400">Terms preview</p>
              <TermPreview entries={entries} />
            </section>
          </>
        ) : (
          <section className="rounded-[1.6rem] border border-blue-100 bg-white/70 p-3 shadow-[0_16px_40px_rgba(15,23,42,0.08)] sm:p-5">
            {activity === 'flashcards' ? <FlashcardsActivity entries={entries} masteryKey={masteryKey} onComplete={(accuracy) => awardVocabulary('flashcards', accuracy)} /> : null}
            {activity === 'matching' ? <MatchingActivity entries={entries} rewardKey={rewardKey} onComplete={(accuracy) => awardVocabulary('matching', accuracy)} /> : null}
            {activity === 'quiz' ? <QuizActivity entries={entries} onComplete={(accuracy) => awardVocabulary('quiz', accuracy)} /> : null}
            {activity === 'typing' ? <TypingActivity entries={entries} onComplete={(accuracy) => awardVocabulary('typing', accuracy)} /> : null}
          </section>
        )}
      </div>
    </div>
  )
}
