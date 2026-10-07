import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, Volume2, X } from 'lucide-react'
import type { VocabularyEntry } from '@/data/vocabularyCollections'
import { isSourceExample } from './VocabularyExample'
import { SaveWordButton } from './SaveWordButton'
import { usePronunciation } from './activities'
import { useVocabularyLanguage, VocabularyTranslation, VocabularyLanguageToggle } from './VocabularyLanguage'
import { getVocabularyTranslation } from '@/utils/vocabularyTranslation'

/** Measure text against the available space, keeping every character accessible. */
function PagedText({ text, label }: { text: string; label: string }) {
  const body = useRef<HTMLDivElement>(null)
  const measurement = useRef<HTMLParagraphElement>(null)
  const [pages, setPages] = useState([text])
  const [page, setPage] = useState(0)
  useLayoutEffect(() => {
    setPages([text])
    setPage(0)
    const container = body.current, copy = measurement.current
    if (!container || !copy) return
    let active = true
    const measure = () => {
      if (!active) return
      if (container.clientHeight < 20 || container.clientWidth === 0) return
      const next: string[] = []
      let offset = 0
      while (offset < text.length) {
        let low = 1, high = text.length - offset, length = 1
        while (low <= high) {
          const middle = Math.floor((low + high) / 2)
          copy.textContent = text.slice(offset, offset + middle)
          if (copy.offsetHeight <= container.clientHeight) { length = middle; low = middle + 1 }
          else high = middle - 1
        }
        if (offset + length < text.length) {
          const boundary = text.slice(offset, offset + length).search(/\s+\S*$/)
          if (boundary > length / 2) length = boundary + 1
          // Never divide a surrogate pair.
          if (/[\uD800-\uDBFF]/.test(text[offset + length - 1])) length = length === 1 ? 2 : length - 1
        }
        next.push(text.slice(offset, offset + length))
        offset += length
      }
      setPages(next.length ? next : [''])
      setPage(0)
      copy.textContent = ''
    }
    measure()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    observer?.observe(container)
    document.fonts?.ready.then(measure)
    return () => { active = false; observer?.disconnect() }
  }, [text])
  return <div className="vocab-paged-text">
    <div ref={body} className="vocab-paged-body">
      <p className="vocab-page-copy" aria-live="polite">{pages[page] ?? pages[0]}</p>
      <p ref={measurement} aria-hidden="true" className="vocab-page-copy vocab-text-measure" />
    </div>
    <div className="vocab-text-pagination">
      <button type="button" aria-label={`Previous ${label} page`} disabled={page === 0} onClick={() => setPage((value) => value - 1)}><ArrowLeft size={14} /></button>
      <span>{page + 1} / {pages.length}</span>
      <button type="button" aria-label={`Next ${label} page`} disabled={page >= pages.length - 1} onClick={() => setPage((value) => value + 1)}><ArrowRight size={14} /></button>
    </div>
  </div>
}

export function TextDetailsButton({ text, label = 'Read full meaning' }: { text: string; label?: string }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const headingId = useId()
  return <><button type="button" aria-label={label} className="vocab-text-details" onClick={() => dialog.current?.showModal()}><BookOpen size={13} /></button><dialog ref={dialog} aria-labelledby={headingId} className="vocab-detail-dialog"><div className="vocab-dialog-shell"><header><h2 id={headingId}>{label}</h2><button type="button" aria-label="Close meaning" onClick={() => dialog.current?.close()}><X size={18} /></button></header><section className="vocab-detail-content"><PagedText text={text} label="meaning" /></section></div></dialog></>
}

export function WordDetailsButton({ entry, label = 'Details' }: { entry: VocabularyEntry; label?: string }) {
  const language = useVocabularyLanguage()
  const translation = getVocabularyTranslation(entry, language)
  const dialog = useRef<HTMLDialogElement>(null)
  const headingId = useId()
  const [section, setSection] = useState(0)
  const sections = [
    { label: 'Meaning (EN)', text: entry.definition },
    ...(translation ? [{ label: language === 'ru' ? 'Русский' : 'O‘zbekcha', text: translation }] : []),
    ...(entry.example ? [{ label: isSourceExample(entry) ? 'From the test' : 'Example', text: entry.example }] : []),
    ...(entry.exampleUzbek ? [{ label: 'Example (UZ)', text: entry.exampleUzbek }] : []),
    ...(entry.synonym ? [{ label: 'Synonym', text: entry.synonym }] : []),
    ...(entry.sourceExcerpt ? [{ label: 'Source context', text: [entry.sourceTitle, entry.sourceExcerpt].filter(Boolean).join('\n\n') }] : []),
  ]
  return <>
    <button type="button" className="vocab-details-button" onClick={() => { setSection(0); dialog.current?.showModal() }}><BookOpen size={14} />{label}</button>
    <dialog ref={dialog} aria-labelledby={headingId} className="vocab-detail-dialog" onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close() }}>
      <div className="vocab-dialog-shell">
        <header><div><p className="vocab-content-label">WORD DETAILS</p><h2 id={headingId} title={entry.term}>{entry.term}</h2></div><button type="button" aria-label="Close word details" onClick={() => dialog.current?.close()}><X size={18} /></button></header>
        <div role="group" aria-label="Word information" className="vocab-detail-tabs">{sections.map((item, index) => <button key={item.label} type="button" aria-pressed={section === index} onClick={() => setSection(index)}>{item.label}</button>)}</div>
        <section className="vocab-detail-content"><p className="vocab-content-label">{sections[section]?.label}</p><PagedText key={`${entry.id}:${section}`} text={sections[section]?.text ?? ''} label="word details" /></section>
      </div>
    </dialog>
  </>
}

export function VocabularyLibrary({ entries, label = 'Vocabulary' }: { entries: VocabularyEntry[]; label?: string }) {
  const { speak } = usePronunciation()
  const dialog = useRef<HTMLDialogElement>(null)
  const headingId = useId()
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(() => typeof window !== 'undefined' && (window.innerWidth < 640 || window.innerHeight < 600) ? 1 : 4)
  useEffect(() => {
    const resize = () => { setSize(window.innerWidth < 640 || window.innerHeight < 600 ? 1 : 4); setPage(0) }
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])
  const pages = Math.ceil(entries.length / size)
  return <>
    <button type="button" className="vocab-word-list" onClick={() => dialog.current?.showModal()}><span><BookOpen size={17} />{label}<span className="vocab-word-count">{entries.length}</span></span><ArrowRight size={16} /></button>
    <dialog ref={dialog} aria-labelledby={headingId} className="vocab-library-dialog">
      <div className="vocab-dialog-shell">
        <header><div><p className="vocab-content-label">YOUR STUDY SET</p><h2 id={headingId}>Vocabulary · {entries.length} terms</h2></div><VocabularyLanguageToggle /><button type="button" aria-label="Close vocabulary" onClick={() => dialog.current?.close()}><X size={18} /></button></header>
        <div className="vocab-library-grid" data-size={size}>{entries.slice(page * size, (page + 1) * size).map((entry) => <article key={entry.id}><div className="vocab-library-term"><h3 title={entry.term}>{entry.term}</h3><button type="button" className="vocab-details-button" aria-label={`Pronounce ${entry.term}`} onClick={() => speak(entry.term)}><Volume2 size={14} /></button><SaveWordButton entry={entry} iconOnly /></div><VocabularyTranslation entry={entry} className="vocab-library-translation" /><div className="vocab-library-definition"><PagedText text={entry.definition} label={entry.term} /></div><WordDetailsButton entry={entry} label="Meaning, examples & source" /></article>)}</div>
        <footer><button type="button" aria-label="Previous vocabulary page" disabled={page === 0} onClick={() => setPage((value) => value - 1)}><ArrowLeft size={16} />Previous</button><span>{page + 1} / {pages}</span><button type="button" aria-label="Next vocabulary page" disabled={page >= pages - 1} onClick={() => setPage((value) => value + 1)}>Next<ArrowRight size={16} /></button></footer>
      </div>
    </dialog>
  </>
}
