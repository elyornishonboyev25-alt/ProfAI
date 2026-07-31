import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ArrowLeft, BookOpen, BookOpenCheck, Bookmark, ChevronDown, Gem, Sparkles, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { vocabularyCollections, type VocabularyTrack } from '@/data/vocabularyCollections'
import { articles } from '@/data/articles'
import { countSavedWords } from '@/utils/myVocabularyStore'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { CountUp, Reveal, Stagger, StaggerItem, Tilt3D } from '@/components/fx'

const fastTransition = { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const }
const collapseDurationMs = 320

type CollapsiblePanelProps = {
  isOpen: boolean
  minimalMotion: boolean
  className?: string
  children: ReactNode | ((mounted: boolean) => ReactNode)
  lazy?: boolean
}

function CollapsiblePanel({ isOpen, minimalMotion, className, children, lazy = false }: CollapsiblePanelProps) {
  const [shouldRender, setShouldRender] = useState(() => !lazy || isOpen)

  useEffect(() => {
    if (!lazy) {
      setShouldRender(true)
      return
    }

    if (isOpen) {
      setShouldRender(true)
      return
    }

    if (minimalMotion) {
      setShouldRender(false)
      return
    }

    const timeoutId = window.setTimeout(() => {
      setShouldRender(false)
    }, collapseDurationMs)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [isOpen, lazy, minimalMotion])

  if (minimalMotion) {
    if (!isOpen || (lazy && !shouldRender)) return null

    return (
      <div className={className} aria-hidden={!isOpen}>
        {typeof children === 'function' ? children(true) : children}
      </div>
    )
  }

  return (
    <div
      className={`accordion-collapse ${isOpen ? 'is-open' : ''} ${className ?? ''}`.trim()}
      aria-hidden={!isOpen}
    >
      <div
        className="accordion-collapse-inner"
        style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
      >
        {shouldRender ? (typeof children === 'function' ? children(true) : children) : null}
      </div>
    </div>
  )
}

function resolveTrack(trackParam?: string): VocabularyTrack | null {
  if (!trackParam) return null
  const normalized = trackParam.toLowerCase()
  if (normalized === 'ielts') return 'IELTS'
  if (normalized === 'sat') return 'SAT'
  return null
}

export default function Vocabulary() {
  const navigate = useNavigate()
  const { track: trackParam } = useParams<{ track?: string }>()
  const routeTrack = resolveTrack(trackParam)
  const { reducedMotion, allowHoverMotion } = useMotionPreferences()
  const minimalMotion = reducedMotion

  const [openIeltsBookId, setOpenIeltsBookId] = useState<string | null>(vocabularyCollections.ielts[0]?.id ?? null)
  const [openIeltsTestKey, setOpenIeltsTestKey] = useState<string | null>(null)
  const [openSatPackId, setOpenSatPackId] = useState<string | null>(vocabularyCollections.sat[0]?.id ?? null)

  const ieltsStats = useMemo(() => {
    const books = vocabularyCollections.ielts.length
    const tests = vocabularyCollections.ielts.reduce((sum, book) => sum + book.tests.length, 0)
    const passages = vocabularyCollections.ielts.reduce(
      (sum, book) => sum + book.tests.reduce((testSum, test) => testSum + test.sections.length, 0),
      0,
    )
    const words = vocabularyCollections.ielts.reduce(
      (sum, book) =>
        sum +
        book.tests.reduce(
          (testSum, test) => testSum + test.sections.reduce((sectionSum, section) => sectionSum + section.entries.length, 0),
          0,
        ),
      0,
    )
    return { books, tests, passages, words }
  }, [])

  const satStats = useMemo(() => {
    const packs = vocabularyCollections.sat.length
    const sections = vocabularyCollections.sat.reduce((sum, pack) => sum + pack.sections.length, 0)
    const words = vocabularyCollections.sat.reduce(
      (sum, pack) => sum + pack.sections.reduce((sectionSum, section) => sectionSum + section.entries.length, 0),
      0,
    )
    return { packs, sections, words }
  }, [])

  const toggleIeltsBook = (bookId: string) => {
    if (openIeltsBookId === bookId) {
      setOpenIeltsBookId(null)
      setOpenIeltsTestKey(null)
      return
    }
    setOpenIeltsBookId(bookId)
    setOpenIeltsTestKey(null)
  }

  const toggleIeltsTest = (bookId: string, testId: string) => {
    const key = `${bookId}::${testId}`
    setOpenIeltsTestKey((previous) => (previous === key ? null : key))
  }

  const toggleSatPack = (packId: string) => {
    setOpenSatPackId((previous) => (previous === packId ? null : packId))
  }

  const goBack = () => {
    navigate('/dashboard')
  }

  if (trackParam && !routeTrack) {
    return <Navigate to="/vocabulary" replace />
  }

  // SAT Vocabulary now lives inside the unified SAT command center. The
  // standalone vocabulary entry opens the IELTS track directly.
  if (!trackParam) {
    return <Navigate to="/vocabulary/ielts" replace />
  }

  if (!routeTrack) {
    return (
      <div className="workspace-page relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-10">

        <div className="relative mx-auto w-full max-w-6xl space-y-6">
          <Reveal>
            <section className="rounded-[2rem] border border-red-100 bg-white/90 p-6 shadow-[0_30px_70px_rgba(15,23,42,0.14)] backdrop-blur-xl sm:p-9">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="premium-top-controls">
                    <motion.button
                      onClick={goBack}
                      whileHover={allowHoverMotion ? { y: -2, x: -1 } : undefined}
                      whileTap={allowHoverMotion ? { scale: 0.99 } : undefined}
                      transition={fastTransition}
                      className="premium-back-btn group"
                    >
                      <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" />
                      Back
                    </motion.button>
                    <span className="premium-top-chip gap-1">
                      <Sparkles className="h-3.5 w-3.5" />
                      Vocabulary Lab
                    </span>
                  </div>
                  <h1 className="mt-4 text-4xl font-black leading-tight text-[#0f172a] sm:text-5xl">
                    Choose your <span className="bg-gradient-to-r from-red-700 via-rose-600 to-orange-500 bg-clip-text text-transparent">Vocabulary Arena</span>
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                    IELTS and SAT now run as separate immersive pages. Each track includes smooth accordion navigation and passage-level activity views.
                  </p>
                </div>
                <div className="relative overflow-hidden rounded-3xl border border-red-200 bg-gradient-to-br from-white via-rose-50/70 to-red-100/65 px-5 py-4 text-right shadow-[0_18px_38px_rgba(220,38,38,0.18)]">
                  <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-red-200/55 blur-2xl" />
                  <div className="pointer-events-none absolute -left-8 bottom-0 h-20 w-20 rounded-full bg-orange-200/45 blur-2xl" />
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-600">Total Terms</p>
                  <p className="mt-1 text-4xl font-black text-slate-900">
                    <CountUp value={ieltsStats.words + satStats.words} />
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-semibold">
                    <div className="rounded-xl border border-red-100 bg-white/90 px-2 py-1.5 text-red-700">{ieltsStats.words} IELTS</div>
                    <div className="rounded-xl border border-blue-100 bg-white/90 px-2 py-1.5 text-blue-700">{satStats.words} SAT</div>
                  </div>
                </div>
              </div>
            </section>
          </Reveal>

          <Stagger className="grid gap-5 md:grid-cols-2">
            <StaggerItem className="h-full">
              <Tilt3D className="h-full rounded-[1.8rem]" max={6}>
                <button
                  onClick={() => navigate('/vocabulary/ielts')}
                  className="interactive-lift group h-full w-full rounded-[1.8rem] border border-red-200 bg-gradient-to-br from-white via-rose-50 to-red-100/70 p-6 text-left shadow-[0_18px_36px_rgba(244,63,94,0.16)]"
                >
                  <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-700">
                    <BookOpen className="h-3.5 w-3.5" />
                    IELTS Academic Track
                  </div>
                  <h2 className="mt-4 text-3xl font-black text-slate-900">IELTS Vocabulary</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Reading-focused roadmap with Day 1-30 plus Full Test 1-20. Full tests open by Passage 1, 2, and 3.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-white px-3 py-1 text-slate-700">{ieltsStats.books} books</span>
                    <span className="rounded-full bg-white px-3 py-1 text-slate-700">{ieltsStats.tests} tests</span>
                    <span className="rounded-full bg-white px-3 py-1 text-slate-700">{ieltsStats.passages} passages</span>
                  </div>
                  <p className="mt-6 text-sm font-semibold text-red-700 transition group-hover:translate-x-1">Open IELTS page -&gt;</p>
                </button>
              </Tilt3D>
            </StaggerItem>

            <StaggerItem className="h-full">
              <Tilt3D className="h-full rounded-[1.8rem]" max={6}>
                <button
                  onClick={() => navigate('/vocabulary/sat')}
                  className="interactive-lift group h-full w-full rounded-[1.8rem] border border-blue-200 bg-gradient-to-br from-white via-blue-50 to-indigo-100/75 p-6 text-left shadow-[0_18px_36px_rgba(59,130,246,0.16)]"
                >
                  <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-blue-700">
                    <Star className="h-3.5 w-3.5" />
                    SAT Advanced Track
                  </div>
                  <h2 className="mt-4 text-3xl font-black text-slate-900">SAT Vocabulary</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    10 packs, each with 4 sections. Each section opens on its own activity page with group-based matching rewards.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-white px-3 py-1 text-slate-700">{satStats.packs} packs</span>
                    <span className="rounded-full bg-white px-3 py-1 text-slate-700">{satStats.sections} sections</span>
                    <span className="rounded-full bg-white px-3 py-1 text-slate-700">{satStats.words} words</span>
                  </div>
                  <p className="mt-6 text-sm font-semibold text-blue-700 transition group-hover:translate-x-1">Open SAT page -&gt;</p>
                </button>
              </Tilt3D>
            </StaggerItem>

            <StaggerItem className="h-full">
              <Tilt3D className="h-full rounded-[1.8rem]" max={6}>
                <button
                  onClick={() => navigate('/vocabulary/articles')}
                  className="interactive-lift group h-full w-full rounded-[1.8rem] border border-amber-200 bg-gradient-to-br from-white via-amber-50 to-orange-100/70 p-6 text-left shadow-[0_18px_36px_rgba(245,158,11,0.16)]"
                >
                  <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold text-amber-700">
                    <BookOpenCheck className="h-3.5 w-3.5" />
                    Articles Track
                  </div>
                  <h2 className="mt-4 text-3xl font-black text-slate-900">Articles Vocabulary</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    The key words from every article in the Reading Library — study each set with the same flashcards, matching, quiz, and typing drills.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-white px-3 py-1 text-slate-700">{articles.length} articles</span>
                    <span className="rounded-full bg-white px-3 py-1 text-slate-700">{articles.reduce((s, a) => s + a.vocabulary.length, 0)} terms</span>
                  </div>
                  <p className="mt-6 text-sm font-semibold text-amber-700 transition group-hover:translate-x-1">Open Articles page -&gt;</p>
                </button>
              </Tilt3D>
            </StaggerItem>

            <StaggerItem className="h-full">
              <Tilt3D className="h-full rounded-[1.8rem]" max={6}>
                <button
                  onClick={() => navigate('/vocabulary/my-words')}
                  className="interactive-lift group h-full w-full rounded-[1.8rem] border border-emerald-200 bg-gradient-to-br from-white via-emerald-50 to-teal-100/70 p-6 text-left shadow-[0_18px_36px_rgba(16,185,129,0.16)]"
                >
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-700">
                    <Bookmark className="h-3.5 w-3.5" />
                    Personal Track
                  </div>
                  <h2 className="mt-4 text-3xl font-black text-slate-900">My Words</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Words you asked the AI about while reading, listening, or reading articles — plus any you add yourself. Grouped and ready to study.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-white px-3 py-1 text-slate-700">Reading · Listening · Article</span>
                    <span className="rounded-full bg-white px-3 py-1 text-slate-700">
                      {countSavedWords('reading') + countSavedWords('listening') + countSavedWords('article')} saved
                    </span>
                  </div>
                  <p className="mt-6 text-sm font-semibold text-emerald-700 transition group-hover:translate-x-1">Open My Words -&gt;</p>
                </button>
              </Tilt3D>
            </StaggerItem>
          </Stagger>
        </div>
      </div>
    )
  }

  if (routeTrack === 'IELTS') {
    return (
      <div className="workspace-page relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-10">

        <div className="relative mx-auto w-full max-w-6xl space-y-6">
          <Reveal>
            <section className="rounded-[2rem] border border-red-100 bg-white/90 p-6 shadow-[0_30px_70px_rgba(15,23,42,0.14)] backdrop-blur-xl sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="premium-top-controls">
                    <button
                      onClick={() => navigate('/vocabulary')}
                      className="premium-back-btn"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Back
                    </button>
                    <span className="premium-top-chip">IELTS Vocabulary Track</span>
                  </div>
                  <h1 className="mt-4 text-4xl font-black leading-tight text-slate-900 sm:text-5xl">IELTS Reading Vocabulary Studio</h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                    Reading vocabulary by roadmap: Day 1-30 and Full Test 1-20. Opening one test automatically closes the previous one.
                  </p>
                </div>
                <div className="rounded-2xl border border-red-100 bg-gradient-to-br from-red-50 to-white px-4 py-3 text-right shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-600">IELTS Stats</p>
                  <p className="mt-1 text-lg font-extrabold text-slate-900">{ieltsStats.tests} tests / {ieltsStats.passages} passages</p>
                  <p className="text-sm font-semibold text-red-700">
                    <CountUp value={ieltsStats.words} /> terms
                  </p>
                </div>
              </div>
            </section>
          </Reveal>

          <Stagger className="space-y-3">
            {vocabularyCollections.ielts.map((book) => {
              const bookOpen = openIeltsBookId === book.id
              return (
                <StaggerItem
                  key={book.id}
                  className="overflow-hidden rounded-[1.4rem] border border-red-100 bg-white/90 shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
                >
                  <button
                    onClick={() => toggleIeltsBook(book.id)}
                    className={`group flex w-full items-center justify-between px-5 py-4 text-left transition-[background-color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${bookOpen ? 'bg-gradient-to-r from-red-50 to-rose-50' : 'bg-white hover:bg-red-50/55'}`}
                  >
                    <div>
                      <p className="text-xl font-bold text-slate-900">{book.title}</p>
                      <p className="text-xs font-semibold text-slate-500">{book.tests.length} tests available</p>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 text-red-700 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${bookOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  <CollapsiblePanel
                    isOpen={bookOpen}
                    minimalMotion={minimalMotion}
                    lazy
                    className="bg-gradient-to-b from-white via-red-50/30 to-red-50/45"
                  >
                    <div className="space-y-2 border-t border-red-100 px-3 py-3">
                      {book.tests.map((test) => {
                        const testKey = `${book.id}::${test.id}`
                        const testOpen = openIeltsTestKey === testKey
                        return (
                          <div
                            key={test.id}
                            className="overflow-hidden rounded-xl border border-red-100 bg-white"
                          >
                            <button
                              onClick={() => toggleIeltsTest(book.id, test.id)}
                              className={`flex w-full items-center justify-between px-4 py-3 text-left transition-[background-color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${testOpen ? 'bg-red-50' : 'hover:bg-red-50/65'}`}
                            >
                              <div>
                                <p className="text-base font-bold text-slate-900">{test.title}</p>
                                <p className="text-xs text-slate-500">
                                  {test.available === false
                                    ? 'Coming soon'
                                    : book.id === 'reading_days_track'
                                      ? `${test.sections[0]?.title ?? 'Passage'} available`
                                      : 'Click to choose one passage'}
                                </p>
                              </div>
                              <ChevronDown
                                className={`h-4 w-4 text-red-700 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${testOpen ? 'rotate-180' : ''}`}
                              />
                            </button>

                            <CollapsiblePanel isOpen={testOpen} minimalMotion={minimalMotion} lazy className="bg-white">
                              {() => (
                                <div className="grid gap-3 border-t border-red-100 p-3 sm:grid-cols-3">
                                  {test.sections.map((section, sectionIndex) => (
                                    <div
                                      key={section.id}
                                      className={`rounded-xl border border-red-100 bg-gradient-to-br from-white to-red-50/70 p-3 shadow-sm transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${allowHoverMotion ? 'hover:-translate-y-0.5 hover:shadow-md' : ''}`}
                                    >
                                      <p className="text-sm font-bold text-slate-900">{section.title}</p>
                                      <p className="mt-1 text-xs text-slate-500">{section.entries.length} terms</p>
                                      <button
                                        onClick={() => {
                                          if (test.available === false) return
                                          navigate(`/vocabulary/ielts/${book.id}/${test.id}/${section.id}`)
                                        }}
                                        disabled={test.available === false}
                                        className={`mt-3 inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold shadow-[0_8px_20px_rgba(239,68,68,0.32)] ${
                                          test.available === false
                                            ? 'cursor-not-allowed border border-amber-300 bg-amber-100 text-amber-800 shadow-none'
                                            : 'bg-gradient-to-r from-red-600 to-rose-600 text-white'
                                        }`}
                                      >
                                        {test.available === false ? 'Coming soon' : `Start Passage ${sectionIndex + 1}`}
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </CollapsiblePanel>
                          </div>
                        )
                      })}
                    </div>
                  </CollapsiblePanel>
                </StaggerItem>
              )
            })}
          </Stagger>
        </div>
      </div>
    )
  }

  return (
    <div className="workspace-page relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-10">

      <div className="relative mx-auto w-full max-w-6xl space-y-6">
        <Reveal>
          <section className="rounded-[2rem] border border-blue-100 bg-white/95 p-6 shadow-[0_30px_70px_rgba(30,64,175,0.13)] backdrop-blur-xl sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="premium-top-controls">
                  <button
                    onClick={() => navigate('/vocabulary')}
                    className="premium-back-btn-blue"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back
                  </button>
                  <span className="premium-top-chip-blue">SAT Vocabulary Track</span>
                </div>
                <h1 className="mt-4 text-4xl font-black leading-tight text-slate-900 sm:text-5xl">SAT Vocabulary Collection</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  Each pack opens independently. Choose a section to enter its activity page. The matching game uses group-level diamond rewards.
                </p>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white px-4 py-3 text-right shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">SAT Stats</p>
                <p className="mt-1 text-lg font-extrabold text-slate-900">{satStats.packs} packs / {satStats.sections} sections</p>
                <p className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700">
                  <Gem className="h-4 w-4" />
                  <CountUp value={satStats.words} /> terms
                </p>
              </div>
            </div>
          </section>
        </Reveal>

        <Stagger className="space-y-3">
          {vocabularyCollections.sat.map((pack) => {
            const isOpen = openSatPackId === pack.id
            return (
              <StaggerItem
                key={pack.id}
                className="overflow-hidden rounded-[1.4rem] border border-blue-100 bg-white/95 shadow-[0_12px_30px_rgba(30,64,175,0.09)]"
              >
                <button
                  onClick={() => toggleSatPack(pack.id)}
                  className={`flex w-full items-center justify-between px-5 py-4 text-left transition-[background-color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isOpen ? 'bg-gradient-to-r from-blue-50 to-indigo-50' : 'bg-white hover:bg-blue-50/60'}`}
                >
                  <div>
                    <p className="text-xl font-bold text-slate-900">{pack.title}</p>
                    <p className="text-xs font-semibold text-slate-500">{pack.sections.length} sections</p>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-blue-700 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                <CollapsiblePanel
                  isOpen={isOpen}
                  minimalMotion={minimalMotion}
                  lazy
                  className="bg-gradient-to-b from-white to-blue-50/45"
                >
                  {() => (
                    <div className="grid gap-3 border-t border-blue-100 p-3 sm:grid-cols-2 lg:grid-cols-4">
                      {pack.sections.map((section, sectionIndex) => (
                        <div
                          key={section.id}
                          className={`rounded-xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/80 p-3 shadow-sm transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${allowHoverMotion ? 'hover:-translate-y-0.5 hover:shadow-md' : ''}`}
                        >
                          <p className="text-sm font-bold text-slate-900">{section.title}</p>
                          <p className="mt-1 text-xs text-slate-500">{section.entries.length} terms</p>
                          <button
                            onClick={() => navigate(`/vocabulary/sat/${pack.id}/${section.id}`)}
                            className="mt-3 inline-flex items-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.35)]"
                          >
                            Start Section {sectionIndex + 1}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </CollapsiblePanel>
              </StaggerItem>
            )
          })}
        </Stagger>
      </div>
    </div>
  )
}
