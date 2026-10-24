import { Link } from 'react-router-dom'
import { ArrowUpRight, BookOpen, Headphones, Mic } from 'lucide-react'
import { useCopy } from '@/i18n/interface'

const resources = {
  listening: { path: '/podcast', icon: Headphones, title: 'Build your Listening with podcasts', action: 'Open podcasts', description: 'Listen once for the main idea, then use the transcript to check missed words. Listen again without the transcript.' },
  reading: { path: '/articles', icon: BookOpen, title: 'Build your Reading with articles', action: 'Open articles', description: 'Skim an article for its main idea, find evidence for key details, then summarise it in your own words.' },
  speaking: { path: '/shadowing-lab', icon: Mic, title: 'Build your Speaking with shadowing', action: 'Open shadowing', description: 'Listen to a short clip, repeat it aloud, then record yourself. Compare stress, rhythm and pronunciation before trying again.' },
} as const

export default function ReviewPracticeLink({ skill, compact = false }: { skill: keyof typeof resources; compact?: boolean }) {
  const { c } = useCopy()
  const resource = resources[skill]
  const Icon = resource.icon
  return <Link to={resource.path} className={`group my-4 flex min-w-0 flex-wrap items-center gap-3 rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-4 text-left shadow-sm transition hover:border-red-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 ${compact ? '' : 'sm:p-5'}`}>
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600"><Icon className="h-5 w-5" aria-hidden="true" /></span>
    <div className="min-w-0 flex-1 basis-40"><h2 className="text-sm font-black text-slate-900 sm:text-base">{c(resource.title)}</h2>{!compact && <p className="mt-1 text-sm leading-6 text-slate-600">{c(resource.description)}</p>}</div>
    <span className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white group-hover:bg-red-700">{c(resource.action)}<ArrowUpRight className="h-4 w-4" aria-hidden="true" /></span>
  </Link>
}
