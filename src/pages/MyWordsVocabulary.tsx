import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  BookOpenCheck,
  Bot,
  FileText,
  Headphones,
  Plus,
  Sparkles,
  Trash2,
  Volume2,
  Wand2,
} from 'lucide-react'
import { CountUp, Reveal } from '@/components/fx'
import { ActivityPicker, usePronunciation } from '@/components/vocab/activities'
import { explainWord } from '@/services/geminiAI'
import {
  addSavedWord,
  countSavedWords,
  getSavedWords,
  removeSavedWord,
  subscribeSavedWords,
  type SavedWord,
  type VocabContext,
} from '@/utils/myVocabularyStore'

const CONTEXTS: Array<{ key: VocabContext; label: string; icon: typeof BookOpen; desc: string; siteLink?: { to: string; label: string } }> = [
  { key: 'reading', label: 'Reading', icon: BookOpen, desc: 'Words you met in reading passages.', siteLink: { to: '/vocabulary/ielts', label: 'IELTS reading sets' } },
  { key: 'listening', label: 'Listening', icon: Headphones, desc: 'Words you met while listening.' },
  { key: 'article', label: 'Article', icon: FileText, desc: 'Words you met inside articles.', siteLink: { to: '/vocabulary/articles', label: 'Article sets' } },
]

type Filter = 'all' | 'ai' | 'manual'

// ----------------------------------------------------------------- overview
function Overview() {
  const navigate = useNavigate()
  const [, force] = useState(0)
  useEffect(() => subscribeSavedWords(() => force((n) => n + 1)), [])

  const total = CONTEXTS.reduce((sum, c) => sum + countSavedWords(c.key), 0)

  return (
    <div className="workspace-page relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-10">
      <div className="relative mx-auto w-full max-w-5xl space-y-6">
        <Reveal>
          <section className="rounded-[2rem] border border-blue-100 bg-white/90 p-6 shadow-[0_30px_70px_rgba(15,23,42,0.14)] backdrop-blur-xl sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="premium-top-controls">
                  <button onClick={() => navigate('/dashboard')} className="premium-back-btn">
                    <ArrowLeft className="h-3.5 w-3.5" /> Back
                  </button>
                  <span className="premium-top-chip gap-1"><Sparkles className="h-3.5 w-3.5" /> My Words</span>
                </div>
                <h1 className="mt-4 text-4xl font-black leading-tight text-slate-900 sm:text-5xl">My Vocabulary</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  Every word you ask the AI about — while reading, listening, or reading an article — is collected here, plus
                  any words you add yourself. Study them just like the arena sets.
                </p>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white px-4 py-3 text-right shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Collected</p>
                <p className="mt-1 text-3xl font-black text-slate-900"><CountUp value={total} /></p>
                <p className="text-xs font-semibold text-slate-500">words saved</p>
              </div>
            </div>
          </section>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-3">
          {CONTEXTS.map((c) => {
            const Icon = c.icon
            const ai = countSavedWords(c.key, 'ai')
            const manual = countSavedWords(c.key, 'manual')
            return (
              <button
                key={c.key}
                onClick={() => navigate(`/vocabulary/my-words/${c.key}`)}
                className="group flex flex-col rounded-[1.5rem] border border-blue-100 bg-white p-6 text-left shadow-[0_16px_40px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_24px_50px_rgba(37,99,235,0.14)]"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md">
                  <Icon className="h-6 w-6" />
                </span>
                <h2 className="mt-3 text-xl font-black text-slate-900">{c.label}</h2>
                <p className="mt-1 text-sm text-slate-600">{c.desc}</p>
                <div className="mt-4 flex gap-2 text-xs font-semibold">
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-blue-700"><Bot className="h-3 w-3" /> {ai} AI</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-600"><Plus className="h-3 w-3" /> {manual} added</span>
                </div>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-blue-600 transition group-hover:gap-2">Open <ArrowLeft className="h-3.5 w-3.5 rotate-180" /></span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------- add form
function AddWordForm({ context, onAdded }: { context: VocabContext; onAdded: () => void }) {
  const [term, setTerm] = useState('')
  const [definition, setDefinition] = useState('')
  const [example, setExample] = useState('')
  const [synonym, setSynonym] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const autofill = async () => {
    if (!term.trim()) return
    setBusy(true); setErr(null)
    try {
      const res = await explainWord(term.trim(), '', 'en')
      setDefinition(res.definition)
      setExample(res.example)
      setSynonym(res.synonym)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'AI autofill failed.')
    } finally {
      setBusy(false)
    }
  }

  const save = () => {
    if (!term.trim() || !definition.trim()) return
    addSavedWord({ term, definition, example, synonym, source: 'manual', context })
    setTerm(''); setDefinition(''); setExample(''); setSynonym('')
    onAdded()
  }

  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
      <h3 className="inline-flex items-center gap-2 text-lg font-black text-slate-900"><Plus className="h-5 w-5 text-blue-600" /> Add your own word</h3>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="flex gap-2 sm:col-span-2">
          <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Word or phrase" className="h-10 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100" />
          <button onClick={autofill} disabled={!term.trim() || busy} className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100 disabled:opacity-40">
            <Wand2 className="h-3.5 w-3.5" /> {busy ? 'AI…' : 'AI fill'}
          </button>
        </div>
        <input value={definition} onChange={(e) => setDefinition(e.target.value)} placeholder="Definition" className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 sm:col-span-2" />
        <input value={example} onChange={(e) => setExample(e.target.value)} placeholder="Example (optional)" className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100" />
        <input value={synonym} onChange={(e) => setSynonym(e.target.value)} placeholder="Synonym (optional)" className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100" />
      </div>
      {err ? <p className="mt-2 text-xs font-medium text-blue-600">{err}</p> : null}
      <button onClick={save} disabled={!term.trim() || !definition.trim()} className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">
        <Plus className="h-4 w-4" /> Add to set
      </button>
    </div>
  )
}

// ----------------------------------------------------------------- collection
function Collection({ context }: { context: VocabContext }) {
  const navigate = useNavigate()
  const meta = CONTEXTS.find((c) => c.key === context)!
  const Icon = meta.icon
  const { speak } = usePronunciation()
  const [filter, setFilter] = useState<Filter>('all')
  const [tick, setTick] = useState(0)
  const refresh = () => setTick((n) => n + 1)
  useEffect(() => subscribeSavedWords(refresh), [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const words = useMemo(() => getSavedWords(context), [context, tick])
  const filtered = words.filter((w) => (filter === 'all' ? true : w.source === filter))
  const aiCount = words.filter((w) => w.source === 'ai').length
  const manualCount = words.filter((w) => w.source === 'manual').length

  return (
    <div className="workspace-page relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-10">

      <div className="relative mx-auto w-full max-w-5xl space-y-5">
        <section className="rounded-[1.8rem] border border-blue-100 bg-white/90 p-5 shadow-[0_24px_54px_rgba(15,23,42,0.1)] backdrop-blur-xl sm:p-7">
          <div className="premium-top-controls">
            <button onClick={() => navigate('/vocabulary/my-words')} className="premium-back-btn-sm">
              <ArrowLeft className="h-4 w-4" /> My Words
            </button>
            <span className="premium-top-chip gap-1"><Icon className="h-3.5 w-3.5" /> {meta.label}</span>
          </div>
          <h1 className="mt-4 text-2xl font-black text-slate-900 sm:text-3xl">My {meta.label} Words</h1>
          <p className="mt-1 text-sm text-slate-500">{words.length} saved · {aiCount} from AI · {manualCount} added by you</p>

          {/* the 3 parts: site vocab link + study + add */}
          <div className="mt-4 flex flex-wrap gap-2">
            {meta.siteLink ? (
              <Link to={meta.siteLink.to} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700">
                <BookOpenCheck className="h-4 w-4" /> {meta.siteLink.label}
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-400">
                <BookOpenCheck className="h-4 w-4" /> No built-in set for listening
              </span>
            )}
          </div>
        </section>

        {/* study activities */}
        {words.length > 0 ? (
          <section className="space-y-3">
            <h2 className="px-1 text-lg font-black text-slate-900">Study these words</h2>
            <ActivityPicker basePath={`/vocabulary/my-words/${context}`} entriesCount={words.length} />
          </section>
        ) : null}

        <AddWordForm context={context} onAdded={refresh} />

        {/* list */}
        <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-black text-slate-900">Saved words</h2>
            <div className="inline-flex overflow-hidden rounded-lg border border-slate-200 text-xs font-bold">
              {(['all', 'ai', 'manual'] as Filter[]).map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 capitalize transition ${filter === f ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                  {f === 'ai' ? 'AI' : f}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              No words yet. Select a word while studying and tap “Ask AI”, or add one above.
            </p>
          ) : (
            <div className="grid gap-2.5 sm:grid-cols-2">
              {filtered.map((w) => (
                <WordCard key={w.id} word={w} onSpeak={() => speak(w.term)} onRemove={() => removeSavedWord(w.id)} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function WordCard({ word, onSpeak, onRemove }: { word: SavedWord; onSpeak: () => void; onRemove: () => void }) {
  return (
    <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/40 p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-black text-slate-900">{word.term}</p>
            <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${word.source === 'ai' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
              {word.source === 'ai' ? 'AI' : 'You'}
            </span>
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-600">{word.definition}</p>
          {word.example ? <p className="mt-1 text-xs italic leading-5 text-slate-400">“{word.example}”</p> : null}
          {word.synonym ? <p className="mt-1 text-[11px] font-semibold text-blue-600">≈ {word.synonym}</p> : null}
        </div>
        <div className="flex shrink-0 flex-col gap-1">
          <button onClick={onSpeak} className="rounded-md p-1 text-slate-400 hover:text-blue-600" aria-label="Pronounce"><Volume2 className="h-3.5 w-3.5" /></button>
          <button onClick={onRemove} className="rounded-md p-1 text-slate-400 hover:text-blue-600" aria-label="Remove"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      </div>
    </div>
  )
}

export default function MyWordsVocabulary() {
  const { wordsContext } = useParams<{ wordsContext?: string }>()
  if (!wordsContext) return <Overview />
  if (wordsContext === 'reading' || wordsContext === 'listening' || wordsContext === 'article') {
    return <Collection context={wordsContext} />
  }
  return <Navigate to="/vocabulary/my-words" replace />
}
