import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Headphones, Loader2, Mic } from 'lucide-react'
import { publicApiUrl } from '@/lib/apiClient'
import { formatClock } from '@/lib/youtube'
import { getSharedShadowingRecording, type SharedShadowingRecording } from '@/services/shadowing'
import { useCopy } from '@/i18n/interface'

/** A public, standalone listening page. No account or workspace navigation. */
export default function SharedShadowing() {
  const { shareId = '' } = useParams()
  const { c } = useCopy()
  const [recording, setRecording] = useState<SharedShadowingRecording | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [showOriginal, setShowOriginal] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  useEffect(() => {
    const controller = new AbortController()
    setRecording(null)
    setShowOriginal(false)
    setStatus('loading')
    void getSharedShadowingRecording(shareId, controller.signal).then(({ recording: saved }) => {
      if (!controller.signal.aborted) { setRecording(saved); setStatus('ready') }
    }).catch(() => { if (!controller.signal.aborted) setStatus('error') })
    return () => controller.abort()
  }, [shareId])
  return <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-4 py-10">
    <div className="mb-5 flex items-center justify-between"><span className="text-xl font-black text-slate-900">ProfAI</span><span className="flex items-center gap-2 text-sm font-semibold text-red-600"><Mic size={17} />{c('Shadowing Lab')}</span></div>
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8">
      {status === 'loading' ? <div role="status" className="flex items-center gap-3 text-slate-600"><Loader2 className="animate-spin" size={22} />{c('Opening shadowing recording…')}</div> : status === 'error' || !recording ? <div role="alert"><h1 className="text-xl font-bold">{c('This recording is unavailable')}</h1><p className="mt-3 text-sm text-slate-600">{c('Check the link and try opening it again.')}</p></div> : <>
        <span className="flex items-center gap-2 text-sm font-semibold text-red-600"><Headphones size={19} />{c('Shared shadowing practice')}</span>
        <h1 className="mt-4 text-2xl font-bold leading-tight text-slate-900">{recording.title}</h1>
        <p className="mb-5 mt-3 text-sm text-slate-600">{c('Listen to the recording.')} · {formatClock(recording.durationSec)}</p>
        <audio ref={audioRef} key={recording.id} onPlay={() => setShowOriginal(false)} controls crossOrigin="anonymous" preload="metadata" src={publicApiUrl(`/shadowing-recordings/${encodeURIComponent(recording.id)}/audio`)} className="w-full" onError={() => setStatus('error')} />
        <button type="button" onClick={() => { if (!showOriginal) audioRef.current?.pause(); setShowOriginal(value => !value) }} aria-expanded={showOriginal} className="mt-6 text-sm font-semibold text-red-600 hover:underline">{c(showOriginal ? 'Hide original video' : 'Watch original video')}</button>
        {showOriginal && <iframe className="mt-4 aspect-video w-full rounded-xl border-0" title={recording.title} src={`https://www.youtube.com/embed/${encodeURIComponent(recording.youtubeId)}?rel=0&cc_load_policy=1&end=120`} allow="encrypted-media; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />}
      </>}
    </section>
  </main>
}
