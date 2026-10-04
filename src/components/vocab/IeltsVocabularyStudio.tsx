import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpen, ChevronDown, Headphones, Mic, PenLine, Search, Volume2 } from 'lucide-react'
import UiText from '@/components/common/UiText'
import { useCopy } from '@/i18n/interface'
import { vocabularyCollections, type VocabularyEntry } from '@/data/vocabularyCollections'
import type { IeltsVocabularySkill } from '@/data/ieltsFullTestVocabulary'
import { SaveWordButton, WordSaveProvider } from './SaveWordButton'
import { usePronunciation } from './activities'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import '@/styles/ielts-vocabulary.css'

const skills = [
  { id: 'listening', label: 'Listening', icon: Headphones, description: '20 words · 1-4 parts' },
  { id: 'reading', label: 'Reading', icon: BookOpen, description: '15 words · per passage' },
  { id: 'writing', label: 'Writing', icon: PenLine, description: 'Vocabulary for Tasks 1 & 2' },
  { id: 'speaking', label: 'Speaking', icon: Mic, description: 'Vocabulary for Parts 1–3' },
] as const

function VocabularyPanel({ open, id, children }: { open: boolean; id: string; children: ReactNode }) {
  const { reducedMotion } = useMotionPreferences()
  const panelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (panelRef.current) panelRef.current.inert = !open
  }, [open])
  return (
    <div ref={panelRef} id={id} aria-hidden={!open} className="ielts-vocab-panel">
      {reducedMotion ? (open ? children : null) : (
        <AnimatePresence initial={false}>
          {open ? <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >{children}</motion.div> : null}
        </AnimatePresence>
      )}
    </div>
  )
}

export function IeltsVocabularyWord({ entry }: { entry: VocabularyEntry }) {
  const { speak } = usePronunciation()
  const { reducedMotion } = useMotionPreferences()
  const [contextOpen, setContextOpen] = useState(false)
  const contextId = useId()
  return (
    <article className={`ielts-vocab-word flex min-w-0 flex-col gap-4 ${reducedMotion ? 'ielts-vocab-reduced-motion' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 pt-1">
          <h3 className="break-words text-base font-semibold leading-6 text-slate-900">{entry.term}</h3>
          {entry.uzbek ? <p className="mt-1 break-words text-xs font-medium leading-5 text-red-600">{entry.uzbek}</p> : null}
        </div>
        <div className="flex shrink-0 items-center">
          <button type="button" onClick={() => speak(entry.term)} aria-label={`Pronounce ${entry.term}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400">
            <Volume2 aria-hidden="true" className="h-4 w-4" />
          </button>
          <SaveWordButton entry={entry} iconOnly />
        </div>
      </div>
      <div className="space-y-3 break-words">
        <p className="text-sm leading-5 text-slate-700">{entry.definition}</p>
        {entry.synonym ? <div className="ielts-vocab-synonym">
          <span className="ielts-vocab-label"><UiText text="Synonym" /></span>
          <p className="min-w-0 text-xs font-semibold leading-5 text-red-800">{entry.synonym}</p>
        </div> : null}
      </div>
      <blockquote className="ielts-vocab-example break-words">
        <p className="ielts-vocab-label mb-1.5"><UiText text="Example" /></p>
        <p className="text-xs leading-5 text-slate-600">{entry.example}</p>
      </blockquote>
      {entry.sourceExcerpt ? (
        <div className="mt-auto border-t border-slate-100 pt-3 text-xs text-slate-500">
          <button type="button" aria-expanded={contextOpen} aria-controls={contextId} onClick={() => setContextOpen((previous) => !previous)} className="ielts-vocab-context flex w-full items-center justify-between gap-2 rounded-lg px-1 py-1 text-left font-semibold leading-5 text-red-600 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400">
            <UiText text={entry.sourceKind === 'topic' ? 'Topic connection' : 'Source context'} />
            <ChevronDown aria-hidden="true" className={`h-3.5 w-3.5 shrink-0 transition-transform duration-300 motion-reduce:transition-none ${contextOpen ? 'rotate-180' : ''}`} />
          </button>
          <VocabularyPanel id={contextId} open={contextOpen}>
            <div className="pt-3">
              <p className="break-words font-semibold text-slate-700">{entry.sourceTitle}</p>
              <p className="mt-1 whitespace-pre-line break-words leading-5">{entry.sourceExcerpt}</p>
            </div>
          </VocabularyPanel>
        </div>
      ) : null}
    </article>
  )
}

export default function IeltsVocabularyStudio() {
  const { c } = useCopy()
  const { reducedMotion } = useMotionPreferences()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [expandedTests, setExpandedTests] = useState<Partial<Record<IeltsVocabularySkill, string | null>>>({})
  const sectionRef = useRef<HTMLElement>(null)
  const skill: IeltsVocabularySkill = skills.some((item) => item.id === params.get('skill'))
    ? params.get('skill') as IeltsVocabularySkill : 'listening'
  const book = vocabularyCollections.ielts.find((item) => item.skill === skill)!
  const activeSkill = skills.find((item) => item.id === skill)!
  const selected = book.tests.find((test) => test.id === `${skill}_full_test_${params.get('test')}`)
  const selectedTestId = selected?.id
  const selectedPart = selected?.sections.find((_, index) => index + 1 === Number(params.get('part'))) ?? selected?.sections[0]
  useEffect(() => {
    if (selectedTestId) sectionRef.current?.scrollIntoView?.({ block: 'start', behavior: reducedMotion ? 'auto' : 'smooth' })
  }, [selectedTestId, reducedMotion])
  const words = book.tests.reduce((sum, test) => sum + test.sections.reduce((n, section) => n + section.entries.length, 0), 0)
  const search = query.trim().toLowerCase()
  const visible = book.tests.filter((test) => `${test.title} ${test.sections.map((section) => `${section.topic} ${section.entries.map((entry) => entry.term).join(' ')}`).join(' ')}`.toLowerCase().includes(search))
  const update = (next: Record<string, string>) => { setParams(next); setQuery('') }
  const originPath = selected && selectedPart ? `/vocabulary/ielts/${book.id}/${selected.id}/${selectedPart.id}` : ''

  return (
    <div className={`ielts-vocab-studio workspace-page min-h-screen px-4 py-8 sm:px-6 lg:px-10 ${reducedMotion ? 'ielts-vocab-reduced-motion' : ''}`}>
      <div className="mx-auto max-w-[1440px] space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-5 rounded-[2rem] border border-white/90 bg-white/80 p-6 shadow-[0_20px_60px_rgba(30,64,175,0.08)] backdrop-blur-xl sm:p-8">
          <div>
            <Link to="/vocabulary" className="premium-back-btn"><ArrowLeft className="h-4 w-4" /><UiText text="Back to Vocabulary" /></Link>
            <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.22em] text-red-600">IELTS ACADEMIC</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl"><UiText text="IELTS Vocabulary" /></h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500"><UiText text="Vocabulary matched to every Full Test, passage and topic." /></p>
          </div>
          <div className="rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/70 px-6 py-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-500"><UiText text="Four skills" /></p>
            <p className="mt-1 text-2xl font-black text-slate-950">120 <UiText text="full tests" /></p>
            <p className="mt-1 text-sm font-semibold text-slate-500">{vocabularyCollections.ielts.reduce((n, item) => n + item.tests.reduce((m, test) => m + test.sections.reduce((p, section) => p + section.entries.length, 0), 0), 0).toLocaleString()} <UiText text="terms" /></p>
          </div>
        </header>

        <nav aria-label="IELTS vocabulary skills" className="grid grid-cols-2 gap-2 rounded-[1.5rem] border border-white/90 bg-white/95 p-3 shadow-[0_14px_40px_rgba(30,64,175,0.07)] lg:grid-cols-4">
          {skills.map((item) => {
            const Icon = item.icon
            const active = item.id === skill
            return <button key={item.id} type="button" aria-label={item.label} aria-current={active ? 'page' : undefined} onClick={() => update({ skill: item.id })} className={`ielts-vocab-skill flex items-center gap-3 rounded-2xl border p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 sm:p-5 ${active ? 'border-red-200 bg-red-50/70 shadow-[0_8px_24px_rgba(239,68,68,0.06)]' : 'border-transparent hover:bg-slate-50'}`}>
              <Icon className="h-6 w-6 shrink-0 text-red-500" />
              <span><span className={`block font-extrabold ${active ? 'text-red-700' : 'text-slate-800'}`}><UiText text={item.label} /></span><span className="mt-1 block text-xs font-medium text-slate-500"><UiText text={item.description} /></span></span>
            </button>
          })}
        </nav>

        <section ref={sectionRef} className="scroll-mt-6 rounded-[2rem] border border-white/90 bg-white/25 p-4 shadow-[0_20px_65px_rgba(30,64,175,0.06)] sm:p-6 lg:p-8">
          {selected && selectedPart ? (
            <div key={selected.id} className="ielts-vocab-enter">
              <button type="button" onClick={() => update({ skill })} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-red-600"><ArrowLeft className="h-4 w-4" /><UiText text="Back to full tests" /></button>
              <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
                <div><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-red-500">IELTS {activeSkill.label.toUpperCase()}</p><h2 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">{selected.title}</h2></div>
                <span className="rounded-full border border-red-100 bg-white/80 px-4 py-2 text-xs font-bold text-slate-600"><UiText text="Advanced & essential vocabulary" /></span>
              </div>
              {selected.sections.length > 1 ? <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Vocabulary sections">
                {selected.sections.map((section, index) => <button key={section.id} type="button" aria-pressed={selectedPart.id === section.id} onClick={() => update({ skill, test: params.get('test')!, part: String(index + 1) })} className={`rounded-full border px-6 py-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 ${selectedPart.id === section.id ? 'border-red-200 bg-red-50 text-red-700' : 'border-slate-200 bg-white/80 text-slate-600 hover:border-red-200'}`}>{section.title}</button>)}
              </div> : null}
              <div className="my-6 flex flex-col items-start justify-between gap-4 rounded-2xl border border-white bg-white/70 p-5 sm:flex-row">
                <div className="min-w-0 flex-1"><h3 className="text-lg font-extrabold text-slate-900">{selectedPart.topic}</h3><p className="mt-2 text-sm text-slate-500">{selectedPart.entries.length} <UiText text="terms" /></p>
                  {selectedPart.prompt ? <details className="mt-3 text-sm text-slate-600"><summary className="cursor-pointer font-semibold"><UiText text="Test prompt" /></summary><p className="mt-2 whitespace-pre-line leading-6">{selectedPart.prompt}</p></details> : null}
                </div>
                <Link to={originPath} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-[0_8px_22px_rgba(220,38,38,0.18)] transition hover:bg-red-700"><UiText text="Practise this set" /><ArrowRight className="h-4 w-4" /></Link>
              </div>
              <WordSaveProvider value={{ context: skill, origin: { label: `${selected.title} · ${selectedPart.title}`, path: originPath } }}>
                <div key={selectedPart.id} className="ielts-vocab-enter grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">{selectedPart.entries.map((entry) => <IeltsVocabularyWord key={entry.id} entry={entry} />)}</div>
              </WordSaveProvider>
            </div>
          ) : (
            <>
              <div className="mb-7 flex flex-wrap items-center justify-between gap-5">
                <div><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-red-500">IELTS ACADEMIC</p><h2 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">{book.title}</h2><p className="mt-2 text-sm font-medium text-slate-500">{book.tests.length} <UiText text="full tests" /> · {words.toLocaleString()} <UiText text="terms" /></p></div>
                <label className="flex w-full items-center gap-3 rounded-full border border-white bg-white/95 px-5 py-4 text-slate-400 sm:w-80"><Search className="h-5 w-5" /><span className="sr-only"><UiText text="Search tests or vocabulary" /></span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={c('Search test, topic or word…')} className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400" /></label>
              </div>
              <div key={skill} className="ielts-vocab-enter space-y-3">
                {visible.map((test) => {
                  const number = test.id.split('_').slice(-1)[0]
                  const count = test.sections.reduce((n, section) => n + section.entries.length, 0)
                  const isOpen = (expandedTests[skill] === undefined ? book.tests[0]?.id : expandedTests[skill]) === test.id
                  return <div key={test.id} className={`ielts-vocab-test ${isOpen ? 'is-open' : ''}`}>
                    <button type="button" aria-label={`Open ${test.title}`} aria-expanded={isOpen} aria-controls={`${test.id}-sections`} onClick={() => setExpandedTests((previous) => ({ ...previous, [skill]: isOpen ? null : test.id }))} className="ielts-vocab-test-toggle flex w-full items-center justify-between gap-4 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-400">
                      <span className="min-w-0">
                        <span className="block text-base font-bold text-slate-900 sm:text-lg">{test.title}</span>
                        <span className="mt-1 block text-xs font-medium text-slate-500">{count} <UiText text="words" />{test.sections.length > 1 ? ` · ${test.sections.length} ${skill === 'writing' ? 'tasks' : 'parts'}` : ' · 1-4 parts'}</span>
                      </span>
                      <span className="ielts-vocab-chevron"><ChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform duration-300 motion-reduce:transition-none ${isOpen ? 'rotate-180' : ''}`} /></span>
                    </button>
                    <VocabularyPanel id={`${test.id}-sections`} open={isOpen}>
                      <div className={`ielts-vocab-parts grid gap-2.5 p-3 ${test.sections.length === 3 ? 'md:grid-cols-3' : test.sections.length > 1 ? 'sm:grid-cols-2' : ''}`}>
                        {test.sections.map((section, index) => <button key={section.id} type="button" aria-label={`View ${test.title} ${section.title}`} onClick={() => update({ skill, test: number, part: String(index + 1) })} className="ielts-vocab-part group flex min-w-0 items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2">
                          <span className="min-w-0 flex-1">
                            <span className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                              <span className="ielts-vocab-part-label">{section.title}</span>
                              <span className="text-[11px] font-medium text-slate-500">{section.entries.length} <UiText text="terms" /></span>
                            </span>
                            {section.topic ? <span className="line-clamp-2 text-xs leading-5 text-slate-600">{section.topic}</span> : null}
                          </span>
                          <span className="ielts-vocab-part-arrow"><ArrowRight aria-hidden="true" className="h-4 w-4" /></span>
                        </button>)}
                      </div>
                    </VocabularyPanel>
                  </div>
                })}
              </div>
              {visible.length === 0 ? <p role="status" className="py-12 text-center text-slate-500"><UiText text="No matching tests. Try another topic or word." /></p> : null}
            </>
          )}
        </section>
      </div>
    </div>
  )
}
