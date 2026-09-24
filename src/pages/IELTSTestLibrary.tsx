import { useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpenText, Headphones, Mic2, PenLine, Sparkles } from 'lucide-react'
import IELTSSectionTests from './IELTSSectionTests'
import IELTSWritingTests from './IELTSWritingTests'
import IELTSSpeakingTests from './IELTSSpeakingTests'

const skills = [
  { id: 'listening', label: 'Listening', icon: Headphones, detail: 'Audio and attention' },
  { id: 'reading', label: 'Reading', icon: BookOpenText, detail: 'Evidence and speed' },
  { id: 'writing', label: 'Writing', icon: PenLine, detail: 'Task 1 and Task 2' },
  { id: 'speaking', label: 'Speaking', icon: Mic2, detail: 'Fluency and feedback' },
] as const

export default function IELTSTestLibrary() {
  const navigate = useNavigate()
  const location = useLocation()
  const { section } = useParams<{ section?: string }>()
  const entry = location.state as { entry?: string; from?: string } | null
  const fromMock = entry?.entry === 'mock-ielts'

  useEffect(() => {
    const requestedSkill = section || location.pathname.split('/')[2]
    const target = location.hash.slice(1) || (skills.some((skill) => skill.id === requestedSkill) ? requestedSkill : '')
    if (!target) return
    const frame = window.requestAnimationFrame(() => document.getElementById(target)?.scrollIntoView({ block: 'start' }))
    return () => window.cancelAnimationFrame(frame)
  }, [location.hash, location.pathname, section])

  return (
    <main className="workspace-page relative min-h-screen px-4 pb-20 pt-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1480px]">
        <header className="relative overflow-hidden rounded-[2.25rem] border border-white bg-[linear-gradient(120deg,#fff4f4_0%,#fff_48%,#e7f0ff_100%)] p-6 shadow-[0_28px_70px_rgba(30,64,175,.1)] sm:p-9 lg:p-12">
          <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full border border-blue-200/50" />
          <div className="pointer-events-none absolute right-28 top-10 h-32 w-32 rounded-full bg-blue-200/30 blur-3xl" />
          <button type="button" onClick={() => navigate(fromMock ? '/mock/ielts' : '/ielts', fromMock ? { state: { from: entry?.from } } : undefined)} className="relative mb-6 inline-flex items-center gap-2 rounded-full border border-white bg-white/85 px-5 py-3 text-sm font-black text-slate-700 shadow-[0_8px_24px_rgba(30,41,59,.08)] transition hover:-translate-y-0.5 hover:text-red-700"><ArrowLeft className="h-4 w-4" /> {fromMock ? 'Full Mock' : 'IELTS'}</button>
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-white/75 px-3 py-1.5 text-[11px] font-black uppercase tracking-[.18em] text-red-700"><Sparkles className="h-4 w-4" /> IELTS Academic</p>
              <h1 className="mt-5 text-4xl font-black leading-[1.02] tracking-[-.06em] text-slate-950 sm:text-6xl lg:text-7xl">One library. <span className="bg-gradient-to-r from-red-700 via-red-500 to-blue-600 bg-clip-text text-transparent">Four skills.</span></h1>
              <p className="mt-4 max-w-3xl text-base font-medium leading-7 text-slate-600 sm:text-lg">Listening, Reading, Writing and Speaking tests together. Your progress and every familiar test card stay in one place.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-[27rem] lg:grid-cols-2">
              {skills.map(({ id, label, icon: Icon }) => <a key={id} href={`#${id}`} className="flex items-center gap-2 rounded-2xl border border-white bg-white/75 px-4 py-3 text-sm font-black text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:text-red-700"><Icon className="h-5 w-5 text-red-600" /> {label}</a>)}
            </div>
          </div>
        </header>
        <nav aria-label="IELTS skills" className="sticky top-2 z-20 mt-5 flex gap-2 overflow-x-auto rounded-2xl border border-white bg-white/90 p-2 shadow-[0_12px_35px_rgba(15,23,42,.09)] backdrop-blur-xl">
          {skills.map(({ id, label, icon: Icon, detail }) => <a key={id} href={`#${id}`} className="flex min-w-[10rem] flex-1 items-center gap-3 rounded-xl px-4 py-3 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"><Icon className="h-5 w-5 shrink-0 text-red-600" /><span><strong className="block text-sm text-slate-900">{label}</strong><small className="block whitespace-nowrap text-[11px] font-semibold text-slate-500">{detail}</small></span></a>)}
        </nav>
        <div className="mt-5 space-y-6">
          <IELTSSectionTests sectionOverride="listening" embedded />
          <IELTSSectionTests sectionOverride="reading" embedded />
          <IELTSWritingTests embedded />
          <IELTSSpeakingTests embedded />
        </div>
      </div>
    </main>
  )
}
