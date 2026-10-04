import UiText from '@/components/common/UiText'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, BookOpenCheck, Bookmark, ChevronDown, Search, Sparkles, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { vocabularyCollections, type VocabularyTrack } from '@/data/vocabularyCollections'
import IeltsVocabularyStudio, { VocabularyPanel } from '@/components/vocab/IeltsVocabularyStudio'
import { useCopy } from '@/i18n/interface'
import { articles } from '@/data/articles'
import { countSavedWords, subscribeSavedWords } from '@/utils/myVocabularyStore'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { CountUp, Reveal, Stagger, StaggerItem, Tilt3D } from '@/components/fx'

const fastTransition = { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const }

function resolveTrack(trackParam?: string): VocabularyTrack | null {
  if (!trackParam) return null
  const normalized = trackParam.toLowerCase()
  if (normalized === 'ielts') return 'IELTS'
  if (normalized === 'sat') return 'SAT'
  return null
}

export default function Vocabulary() {
  const { c } = useCopy()
  const navigate = useNavigate()
  const location = useLocation()
  const [, refreshSavedCount] = useState(0)
  useEffect(() => subscribeSavedWords(() => refreshSavedCount((n) => n + 1)), [])
  const { track: trackParam } = useParams<{ track?: string }>()
  const routeTrack = resolveTrack(trackParam)
  const fromSatArena = routeTrack === 'SAT' && (location.state as { from?: string } | null)?.from === '/sat'
  const satNavigationState = fromSatArena ? { from: '/sat' } : undefined
  const { reducedMotion, allowHoverMotion } = useMotionPreferences()
  const [openSatPackId, setOpenSatPackId] = useState<string | null>(vocabularyCollections.sat[0]?.id ?? null)
  const [satQuery, setSatQuery] = useState('')
  const satSearch = satQuery.trim().toLowerCase()
  const visibleSatPacks = vocabularyCollections.sat.filter((pack) =>
    `${pack.title} ${pack.sections.map((section) => `${section.title} ${section.entries.map((entry) => entry.term).join(' ')}`).join(' ')}`.toLowerCase().includes(satSearch),
  )

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

  const toggleSatPack = (packId: string) => {
    setOpenSatPackId((previous) => (previous === packId ? null : packId))
  }

  const goBack = () => {
    navigate(routeTrack ? '/vocabulary' : '/academic-skills')
  }

  if (trackParam && !routeTrack) {
    return <Navigate to="/vocabulary" replace />
  }

  if (!routeTrack) {
    return (
      <div className="workspace-page relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-10">

        <div className="relative mx-auto w-full max-w-6xl space-y-6">
          <Reveal>
            <section className="rounded-[2rem] border border-blue-100 bg-white/90 p-6 shadow-[0_30px_70px_rgba(15,23,42,0.14)] backdrop-blur-xl sm:p-9">
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
                       <UiText text={"Back to Academic Skills"} /> </motion.button>
                    <span className="premium-top-chip gap-1">
                      <Sparkles className="h-3.5 w-3.5" />
                       <UiText text={"Vocabulary Arena"} /> </span>
                  </div>
                  <h1 className="mt-4 text-4xl font-black leading-tight text-[#0f172a] sm:text-5xl">
                     <UiText text={"Build a stronger"} /> <span className="bg-gradient-to-r from-blue-700 via-indigo-600 to-red-500 bg-clip-text text-transparent"> <UiText text={"vocabulary."} /> </span>
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                     <UiText text={"Four focused tracks. Choose one and start practising."} /> </p>
                </div>
                <div className="relative overflow-hidden rounded-3xl border border-blue-200 bg-gradient-to-br from-white via-indigo-50/70 to-blue-100/65 px-5 py-4 text-right shadow-[0_18px_38px_rgba(37,99,235,0.18)]">
                  <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-200/55 blur-2xl" />
                  <div className="pointer-events-none absolute -left-8 bottom-0 h-20 w-20 rounded-full bg-red-200/45 blur-2xl" />
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600"> <UiText text={"Total Terms"} /> </p>
                  <p className="mt-1 text-4xl font-black text-slate-900">
                    <CountUp value={ieltsStats.words + satStats.words} />
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-semibold">
                    <div className="rounded-xl border border-blue-100 bg-white/90 px-2 py-1.5 text-blue-700">{ieltsStats.words} IELTS</div>
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
                  className="interactive-lift group h-full w-full rounded-[1.8rem] border border-blue-200 bg-gradient-to-br from-white via-indigo-50 to-blue-100/70 p-6 text-left shadow-[0_18px_36px_rgba(99,102,241,0.16)]"
                >
                  <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-blue-700">
                    <BookOpen className="h-3.5 w-3.5" />
                     <UiText text={"IELTS Academic Track"} /> </div>
                  <h2 className="mt-4 text-3xl font-black text-slate-900"> <UiText text={"IELTS Vocabulary"} /> </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                     <UiText text={"Full Tests 1–30 for Listening, Reading, Writing and Speaking, with vocabulary matched to each passage and topic."} /> </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-white px-3 py-1 text-slate-700"><UiText text={"Four skills"} /> </span>
                    <span className="rounded-full bg-white px-3 py-1 text-slate-700">{ieltsStats.tests}  <UiText text={"tests"} /> </span>
                    <span className="rounded-full bg-white px-3 py-1 text-slate-700">{ieltsStats.passages}  <UiText text={"sets"} /> </span>
                  </div>
                  <p className="mt-6 text-sm font-semibold text-blue-700 transition group-hover:translate-x-1"> <UiText text={"Open IELTS page ->"} /> </p>
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
                     <UiText text={"SAT Advanced Track"} /> </div>
                  <h2 className="mt-4 text-3xl font-black text-slate-900"> <UiText text={"SAT Vocabulary"} /> </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {satStats.packs} full mocks, each with 2 English modules and 20 challenging words per module.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-white px-3 py-1 text-slate-700">{satStats.packs} mocks</span>
                    <span className="rounded-full bg-white px-3 py-1 text-slate-700">{satStats.sections}  <UiText text={"modules"} /> </span>
                    <span className="rounded-full bg-white px-3 py-1 text-slate-700">{satStats.words}  <UiText text={"words"} /> </span>
                  </div>
                  <p className="mt-6 text-sm font-semibold text-blue-700 transition group-hover:translate-x-1"> <UiText text={"Open SAT page ->"} /> </p>
                </button>
              </Tilt3D>
            </StaggerItem>

            <StaggerItem className="h-full">
              <Tilt3D className="h-full rounded-[1.8rem]" max={6}>
                <button
                  onClick={() => navigate('/vocabulary/articles')}
                  className="interactive-lift group h-full w-full rounded-[1.8rem] border border-red-200 bg-gradient-to-br from-white via-red-50/60 to-blue-100/55 p-6 text-left shadow-[0_18px_36px_rgba(220,38,38,0.12)]"
                >
                  <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-700">
                    <BookOpenCheck className="h-3.5 w-3.5" />
                     <UiText text={"Articles Track"} /> </div>
                  <h2 className="mt-4 text-3xl font-black text-slate-900"> <UiText text={"Articles Vocabulary"} /> </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                     <UiText text={"The key words from every article in the Reading Library — study each set with the same flashcards, matching, quiz, and typing drills."} /> </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-white px-3 py-1 text-slate-700">{articles.length}  <UiText text={"articles"} /> </span>
                    <span className="rounded-full bg-white px-3 py-1 text-slate-700">{articles.reduce((s, a) => s + a.vocabulary.length, 0)}  <UiText text={"terms"} /> </span>
                  </div>
                  <p className="mt-6 text-sm font-semibold text-red-700 transition group-hover:translate-x-1"> <UiText text={"Open Articles page ->"} /> </p>
                </button>
              </Tilt3D>
            </StaggerItem>

            <StaggerItem className="h-full">
              <Tilt3D className="h-full rounded-[1.8rem]" max={6}>
                <button
                  onClick={() => navigate('/vocabulary/my-words')}
                  className="interactive-lift group h-full w-full rounded-[1.8rem] border border-blue-200 bg-gradient-to-br from-white via-blue-50 to-red-100/45 p-6 text-left shadow-[0_18px_36px_rgba(37,99,235,0.13)]"
                >
                  <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-blue-700">
                    <Bookmark className="h-3.5 w-3.5" />
                     <UiText text={"Personal Track"} /> </div>
                  <h2 className="mt-4 text-3xl font-black text-slate-900"> <UiText text={"My Words"} /> </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Words saved from Vocabulary Studio, AI explanations, and your own additions — with links back to their sources.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-white px-3 py-1 text-slate-700">SAT · IELTS · Articles</span>
                    <span className="rounded-full bg-white px-3 py-1 text-slate-700">
                      {countSavedWords('sat') + countSavedWords('reading') + countSavedWords('listening') + countSavedWords('article') + countSavedWords('writing') + countSavedWords('speaking')}  <UiText text={"saved"} /> </span>
                  </div>
                  <p className="mt-6 text-sm font-semibold text-blue-700 transition group-hover:translate-x-1"> <UiText text={"Open My Words ->"} /> </p>
                </button>
              </Tilt3D>
            </StaggerItem>
          </Stagger>
        </div>
      </div>
    )
  }

  if (routeTrack === 'IELTS') return <IeltsVocabularyStudio />

  return (
    <div className={`sat-vocab-studio workspace-page min-h-screen px-4 py-8 sm:px-6 lg:px-10 ${reducedMotion ? 'ielts-vocab-reduced-motion' : ''}`}>
      <div className="mx-auto max-w-[1440px] space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-5 rounded-[2rem] border border-white/90 bg-white/80 p-6 shadow-[0_20px_60px_rgba(30,64,175,0.08)] backdrop-blur-xl sm:p-8">
          <div>
            <button type="button" onClick={() => navigate(fromSatArena ? '/sat' : '/vocabulary')} className="premium-back-btn">
              <ArrowLeft className="h-4 w-4" />
              <UiText text={fromSatArena ? 'Back to SAT Arena' : 'Back to Vocabulary'} />
            </button>
            <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.22em] text-blue-600"><UiText text="SAT Vocabulary Track" /></p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl"><UiText text="SAT Vocabulary" /></h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              Choose a SAT Full Mock and study 20 challenging words from each English module.
            </p>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/70 px-6 py-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-500"><UiText text="SAT Stats" /></p>
            <p className="mt-1 text-2xl font-black text-slate-950">{satStats.packs} mocks / {satStats.sections} <UiText text="modules" /></p>
            <p className="mt-1 text-sm font-semibold text-slate-500">{satStats.words.toLocaleString()} <UiText text="terms" /></p>
          </div>
        </header>

        <section className="rounded-[2rem] border border-white/90 bg-white/25 p-4 shadow-[0_20px_65px_rgba(30,64,175,0.06)] sm:p-6 lg:p-8">
          <div className="mb-7 flex flex-wrap items-center justify-between gap-5">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-500"><UiText text="SAT Vocabulary Track" /></p>
              <h2 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">SAT Full Mocks</h2>
              <p className="mt-2 text-sm font-medium text-slate-500">{satStats.packs} mocks · {satStats.words.toLocaleString()} <UiText text="terms" /></p>
            </div>
            <label className="flex w-full items-center gap-3 rounded-full border border-white bg-white/95 px-5 py-4 text-slate-400 sm:w-80">
              <Search className="h-5 w-5" />
              <span className="sr-only"><UiText text="Search tests or vocabulary" /></span>
              <input type="search" value={satQuery} onChange={(event) => setSatQuery(event.target.value)} placeholder={c('Search test, topic or word…')} className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400" />
            </label>
          </div>
          <div className="ielts-vocab-enter space-y-3">
            {visibleSatPacks.map((pack) => {
              const isOpen = openSatPackId === pack.id
              const count = pack.sections.reduce((sum, section) => sum + section.entries.length, 0)
              return (
                <div key={pack.id} className={`ielts-vocab-test ${isOpen ? 'is-open' : ''}`}>
                  <button type="button" aria-label={`Open ${pack.title}`} aria-expanded={isOpen} aria-controls={`${pack.id}-sections`} onClick={() => toggleSatPack(pack.id)} className="ielts-vocab-test-toggle flex w-full items-center justify-between gap-4 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-400">
                    <span className="min-w-0">
                      <span className="block text-base font-bold text-slate-900 sm:text-lg">{pack.title}</span>
                      <span className="mt-1 block text-xs font-medium text-slate-500">{count} <UiText text="words" /> · {pack.sections.length} <UiText text="modules" /></span>
                    </span>
                    <span className="ielts-vocab-chevron"><ChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform duration-300 motion-reduce:transition-none ${isOpen ? 'rotate-180' : ''}`} /></span>
                  </button>
                  <VocabularyPanel id={`${pack.id}-sections`} open={isOpen}>
                    <div className="ielts-vocab-parts grid gap-2.5 p-3 sm:grid-cols-2">
                      {pack.sections.map((section, sectionIndex) => (
                        <button key={section.id} type="button" aria-label={`Start Module ${sectionIndex + 1}`} onClick={() => navigate(`/vocabulary/sat/${pack.id}/${section.id}`, { state: satNavigationState })} className="ielts-vocab-part group flex min-w-0 items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2">
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <span className="ielts-vocab-part-label">{section.title}</span>
                              <span className="text-[11px] font-medium text-slate-500">{section.entries.length} <UiText text="terms" /></span>
                            </span>
                          </span>
                          <span className="ielts-vocab-part-arrow"><ArrowRight aria-hidden="true" className="h-4 w-4" /></span>
                        </button>
                      ))}
                    </div>
                  </VocabularyPanel>
                </div>
              )
            })}
          </div>
          {visibleSatPacks.length === 0 ? <p role="status" className="py-12 text-center text-slate-500"><UiText text="No matching tests. Try another topic or word." /></p> : null}
        </section>
      </div>
    </div>
  )
}
