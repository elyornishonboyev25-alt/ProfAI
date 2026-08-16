import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { BookmarkPlus, Check, Languages, Loader2, Sparkles, Volume2, X } from 'lucide-react'
import { explainWord, type WordExplanation } from '@/services/geminiAI'
import { addSavedWord, isWordSaved, type VocabContext } from '@/utils/myVocabularyStore'

type LanguageChip = { code: string; label: string }

const LANGUAGE_CHIPS: LanguageChip[] = [
  { code: 'en', label: 'English' },
  { code: 'uz', label: "O'zbekcha" },
  { code: 'ru', label: 'Русский' },
  { code: 'tr', label: 'Türkçe' },
]

export type WordLookupRequest = {
  word: string
  sentence?: string
  context: VocabContext
  origin?: string
}

type WordLookupModalProps = WordLookupRequest & {
  open: boolean
  onClose: () => void
}

function speak(text: string) {
  try {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-US'
    u.rate = 0.92
    window.speechSynthesis.speak(u)
  } catch {
    /* ignore */
  }
}

export function WordLookupModal({ open, word, sentence, context, origin, onClose }: WordLookupModalProps) {
  const [language, setLanguage] = useState('en')
  const [customLang, setCustomLang] = useState('')
  const [result, setResult] = useState<WordExplanation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const reqIdRef = useRef(0)

  const contextLabel = useMemo(() => {
    if (context === 'reading') return 'Reading'
    if (context === 'listening') return 'Listening'
    return 'Article'
  }, [context])

  // Fetch (and re-fetch when the language changes) while the modal is open.
  useEffect(() => {
    if (!open || !word) return
    const id = ++reqIdRef.current
    setLoading(true)
    setError(null)
    explainWord(word, sentence ?? '', language)
      .then((res) => {
        if (reqIdRef.current !== id) return
        setResult(res)
        setSaved(isWordSaved(context, res.term))
      })
      .catch((err: unknown) => {
        if (reqIdRef.current !== id) return
        setError(err instanceof Error ? err.message : 'Could not reach the AI. Please try again.')
      })
      .finally(() => {
        if (reqIdRef.current === id) setLoading(false)
      })
  }, [open, word, sentence, language, context])

  // Reset transient state each time a new word opens.
  useEffect(() => {
    if (open) {
      setLanguage('en')
      setCustomLang('')
      setResult(null)
      setError(null)
      setSaved(false)
    }
  }, [open, word])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const handleSave = () => {
    if (!result || !result.definition) return
    addSavedWord({
      term: result.term || word,
      definition: result.definition,
      example: result.example,
      synonym: result.synonym,
      source: 'ai',
      context,
      origin,
    })
    setSaved(true)
  }

  const applyCustomLanguage = () => {
    const value = customLang.trim()
    if (value) setLanguage(value)
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[120] flex items-end justify-center p-3 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button className="absolute inset-0 cursor-default bg-slate-900/45 backdrop-blur-sm" onClick={onClose} aria-label="Close" />

          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ y: 28, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 24, scale: 0.97, opacity: 0 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-[1.6rem] border border-blue-100 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.32)]"
          >
            {/* header */}
            <div className="relative overflow-hidden border-b border-blue-100 bg-gradient-to-br from-blue-600 via-indigo-600 to-orange-500 px-5 py-4 text-white">
              <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/20 blur-2xl" />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white/85">
                    <Sparkles className="h-3.5 w-3.5" />
                    AI Word Helper · {contextLabel}
                  </p>
                  <h3 className="mt-1 break-words text-2xl font-black leading-tight">{result?.term || word}</h3>
                  {result?.partOfSpeech ? (
                    <span className="mt-1 inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold">
                      {result.partOfSpeech}
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => speak(result?.term || word)}
                    className="rounded-lg p-2 text-white/90 transition hover:bg-white/15"
                    aria-label="Pronounce"
                  >
                    <Volume2 className="h-4.5 w-4.5" />
                  </button>
                  <button onClick={onClose} className="rounded-lg p-2 text-white/90 transition hover:bg-white/15" aria-label="Close">
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* language switcher */}
            <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 bg-slate-50/70 px-5 py-2.5">
              <span className="mr-1 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                <Languages className="h-3.5 w-3.5" />
                Explain in
              </span>
              {LANGUAGE_CHIPS.map((chip) => (
                <button
                  key={chip.code}
                  onClick={() => setLanguage(chip.code)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    language === chip.code
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
              <div className="flex items-center gap-1">
                <input
                  value={customLang}
                  onChange={(e) => setCustomLang(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') applyCustomLanguage()
                  }}
                  placeholder="Other…"
                  className="h-7 w-20 rounded-full border border-slate-200 bg-white px-3 text-xs outline-none focus:border-blue-300"
                />
              </div>
            </div>

            {/* body */}
            <div className="max-h-[52vh] overflow-y-auto px-5 py-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                  <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
                  <p className="text-sm font-medium text-slate-500">AI is explaining this word…</p>
                </div>
              ) : error ? (
                <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">{error}</div>
              ) : result ? (
                <div className="space-y-3.5">
                  {result.explanation ? (
                    <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-white px-4 py-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-600">Simple explanation</p>
                      <p className="mt-1.5 text-[15px] leading-7 text-slate-800">{result.explanation}</p>
                    </div>
                  ) : null}

                  {result.definition ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Definition</p>
                        <p className="mt-1 text-sm leading-6 text-slate-800">{result.definition}</p>
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Synonym</p>
                        <p className="mt-1 text-sm font-semibold leading-6 text-blue-700">{result.synonym || '—'}</p>
                      </div>
                    </div>
                  ) : null}

                  {result.example ? (
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Example</p>
                      <p className="mt-1 text-sm italic leading-6 text-slate-700">“{result.example}”</p>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            {/* footer */}
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-white px-5 py-3">
              <p className="text-[11px] text-slate-400">{origin ? `From: ${origin}` : 'Saved words appear in Vocabulary Arena'}</p>
              <button
                onClick={handleSave}
                disabled={!result?.definition || saved}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  saved
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_10px_22px_rgba(37,99,235,0.28)] hover:brightness-110 disabled:opacity-40'
                }`}
              >
                {saved ? <Check className="h-4 w-4" /> : <BookmarkPlus className="h-4 w-4" />}
                {saved ? 'Saved to My Words' : 'Save word'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}

export default WordLookupModal
