import { ExternalLink, Headphones } from 'lucide-react'
import { useCopy } from '@/i18n/interface'

export default function VideoPlaybackError({ youtubeId }: { youtubeId: string }) {
  const { c } = useCopy()
  return <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-slate-950 px-6 text-center text-white" role="alert">
    <Headphones className="h-8 w-8 text-rose-400" />
    <p className="max-w-sm text-sm leading-6">{c('Playback could not load. Check your connection or choose another lesson.')}</p>
    <a href={`https://www.youtube.com/watch?v=${youtubeId}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold">{c('Open on YouTube')}<ExternalLink size={14} /></a>
  </div>
}
