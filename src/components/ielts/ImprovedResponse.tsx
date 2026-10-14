import { useEffect, useRef, useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { useCopy } from '@/i18n/interface'
import { improveSpeakingAnswer } from '@/services/speakingAI'
import { accountStorageFor } from '@/utils/accountStorage'
import { useAuthStore } from '@/store/authStore'

function cacheKey(answer: string) {
  let hash = 2166136261
  for (let index = 0; index < answer.length; index++) hash = Math.imul(hash ^ answer.charCodeAt(index), 16777619)
  return `profai:speaking:improved:v1:${hash >>> 0}`
}

export default function ImprovedResponse({ text, speakingAnswer, onImproved }: { text?: string; speakingAnswer?: string; onImproved?: (text: string) => void }) {
  const { c } = useCopy()
  const owner = useAuthStore(state => state.user?.id ?? 'guest')
  const [generated, setGenerated] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const version = useRef(0)
  useEffect(() => {
    version.current++
    let cached = ''
    try {
      const saved = speakingAnswer ? JSON.parse(accountStorageFor(owner).getItem(cacheKey(speakingAnswer)) ?? 'null') : null
      if (saved?.original === speakingAnswer && typeof saved?.improved === 'string') cached = saved.improved
    } catch { /* Optional coaching cache. */ }
    setGenerated(cached); setLoading(false); setError('')
    return () => { version.current++ }
  }, [speakingAnswer, owner])
  const improved = text?.trim() || generated
  const generate = async () => {
    if (loading || !speakingAnswer?.trim()) return
    const current = version.current
    setLoading(true)
    setError('')
    try {
      const result = await improveSpeakingAnswer(speakingAnswer)
      if (current !== version.current) return
      setGenerated(result)
      try { accountStorageFor(owner).setItem(cacheKey(speakingAnswer), JSON.stringify({ original: speakingAnswer, improved: result })) } catch { /* Keep the generated answer visible in memory. */ }
      onImproved?.(result)
    } catch { if (current === version.current) setError('Could not improve this answer. Please try again.') }
    finally { if (current === version.current) setLoading(false) }
  }
  return <section className="my-4 min-w-0 rounded-2xl border border-red-200 bg-gradient-to-br from-red-50/70 to-white p-4 sm:p-5">
    <h3 className="flex items-center gap-2 text-base font-black text-red-800"><Sparkles className="h-5 w-5 shrink-0" aria-hidden="true" />{c('Your answer, improved')}</h3>
    {improved ? <><p className="mt-1 text-xs leading-5 text-slate-500">{c('Your ideas and meaning, with clearer structure, vocabulary and grammar.')}</p><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-800">{improved}</p><p className="mt-3 text-xs font-medium leading-5 text-red-700">{c('Compare this with your original answer, then try expressing the same ideas yourself.')}</p></> : <><p className="mt-2 text-sm leading-6 text-slate-600">{c('An improved version is unavailable for this attempt. Your original answer is preserved.')}</p>{speakingAnswer?.trim() && <button type="button" disabled={loading} onClick={() => void generate()} className="arena-secondary-btn mt-3 disabled:opacity-60">{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}{loading ? 'Improving your answer…' : 'Generate improved answer'}</button>}{error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}</>}
  </section>
}
