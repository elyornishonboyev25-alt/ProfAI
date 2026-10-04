import { useEffect, useId, useState } from 'react'
import { ArrowUpRight, BookOpen, Sparkles, X } from 'lucide-react'
import { useCopy } from '@/i18n/interface'
import UiText from '@/components/common/UiText'
import { useAuthStore } from '@/store/authStore'
import { getIeltsTestVocabulary } from '@/utils/ieltsTestVocabulary'
import type { IeltsVocabularySkill } from '@/data/ieltsFullTestVocabulary'

const preferenceEvent = 'profai:ielts-vocabulary-reminders'

type Props = { testId: string; skill?: IeltsVocabularySkill; variant: 'reminder' | 'link' | 'review'; compact?: boolean }

export default function TestVocabulary({ testId, skill, variant, compact = false }: Props) {
  const { c } = useCopy()
  const userId = useAuthStore((state) => state.user?.id) ?? 'guest'
  const preferenceKey = `profai:ielts:vocabulary-reminders:${userId}`
  const visitKey = `${preferenceKey}:${testId}`
  const [hidden, setHidden] = useState(() => {
    try { return window.localStorage.getItem(preferenceKey) === 'never' || window.sessionStorage.getItem(visitKey) === 'hidden' }
    catch { return false }
  })
  const headingId = useId()
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
  if (!vocabulary || (variant === 'reminder' && hidden)) return null
  const dismiss = (forever: boolean) => {
    setHidden(true)
    try {
      if (forever) window.localStorage.setItem(preferenceKey, 'never')
      else window.sessionStorage.setItem(visitKey, 'hidden')
      window.dispatchEvent(new Event(preferenceEvent))
    } catch { /* Dismiss locally even when storage is unavailable. */ }
  }
  const link = (
    <a href={vocabulary.href} target="_blank" rel="noopener noreferrer" onClick={(event) => event.stopPropagation()}
      title={c('Opens in a new tab')}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 ${variant === 'link' ? 'w-full border border-red-200 bg-red-50/70 text-red-700 hover:bg-red-100' : 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-500/15 hover:from-red-500 hover:to-rose-500'}`}>
      <BookOpen aria-hidden="true" className="h-4 w-4 shrink-0" />
      <UiText text="Practise this test's vocabulary" />
      <ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0" />
    </a>
  )
  if (variant === 'link') return <div className="mt-4" data-test-vocabulary="link">{link}</div>
  const review = variant === 'review'
  if (review && compact) return (
    <aside aria-labelledby={headingId} data-test-vocabulary="review" className="my-2 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-gradient-to-r from-white to-rose-50 px-4 py-3">
      <div className="flex items-center gap-3">
        <BookOpen aria-hidden="true" className="h-5 w-5 shrink-0 text-red-600" />
        <div><h2 id={headingId} className="text-sm font-bold text-slate-900"><UiText text="Build on what you learned" /></h2><p className="mt-1 text-xs text-slate-500">{vocabulary.test.title} · {vocabulary.wordCount} <UiText text="words" /></p></div>
      </div>
      {link}
    </aside>
  )
  return (
    <aside aria-labelledby={headingId} data-test-vocabulary={variant}
      className="relative my-5 overflow-hidden rounded-2xl border border-red-200 bg-gradient-to-br from-white via-white to-rose-50 p-5 shadow-[0_12px_32px_-20px_rgba(220,38,38,0.3)] sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600"><Sparkles aria-hidden="true" className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-red-600"><UiText text={review ? 'Your next step' : 'Before you practise'} /></p>
          <h2 id={headingId} className="mt-1 pr-7 text-lg font-bold tracking-tight text-slate-900"><UiText text={review ? 'Build on what you learned' : 'Meet the words in this test'} /></h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600"><UiText text={review ? 'Revisit the words from this test, practise them in context and bring a stronger vocabulary to your next attempt.' : 'Preview the vocabulary from this exact test before practising. Learn the meanings, hear pronunciation and recognise words in context.'} /></p>
          <p className="mt-3 text-xs font-semibold text-slate-500">{vocabulary.test.title} <span aria-hidden="true">·</span> {vocabulary.wordCount} <UiText text="words" /></p>
          <div className="mt-3 flex flex-wrap gap-2">{vocabulary.preview.map((entry) => <span key={entry.id} className="rounded-full border border-red-100 bg-white px-3 py-1 text-xs font-medium text-red-800">{entry.term}</span>)}</div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {link}
            {!review ? <button type="button" onClick={() => dismiss(true)} className="rounded-lg px-2 py-2 text-xs font-semibold text-slate-500 underline decoration-slate-300 underline-offset-4 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"><UiText text="Never show reminders again" /></button> : null}
          </div>
        </div>
        {!review ? <button type="button" onClick={() => dismiss(false)} aria-label={c('Dismiss for now')} title={c('Dismiss for now')} className="absolute right-4 top-4 rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"><X aria-hidden="true" className="h-4 w-4" /></button> : null}
      </div>
    </aside>
  )
}
