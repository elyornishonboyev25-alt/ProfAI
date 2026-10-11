import { Sparkles } from 'lucide-react'
import { useCopy } from '@/i18n/interface'

export default function ImprovedResponse({ text }: { text?: string }) {
  const { c } = useCopy()
  return <section className="my-4 min-w-0 rounded-2xl border border-red-200 bg-gradient-to-br from-red-50/70 to-white p-4 sm:p-5">
    <h3 className="flex items-center gap-2 text-base font-black text-red-800"><Sparkles className="h-5 w-5 shrink-0" aria-hidden="true" />{c('Your answer, improved')}</h3>
    {text?.trim() ? <><p className="mt-1 text-xs leading-5 text-slate-500">{c('Your ideas and meaning, with clearer structure, vocabulary and grammar.')}</p><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-800">{text}</p><p className="mt-3 text-xs font-medium leading-5 text-red-700">{c('Compare this with your original answer, then try expressing the same ideas yourself.')}</p></> : <p className="mt-2 text-sm leading-6 text-slate-600">{c('An improved version is unavailable for this attempt. Your original answer is preserved.')}</p>}
  </section>
}
