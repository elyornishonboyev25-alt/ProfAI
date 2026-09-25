import { useEffect, useState, type KeyboardEvent } from 'react'
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

type SkillId = (typeof skills)[number]['id']

function skillFromLocation(pathname: string, hash: string, section?: string): SkillId {
  for (const requested of [hash.slice(1), section, pathname.split('/')[2]]) {
    const match = skills.find((skill) => skill.id === requested)
    if (match) return match.id
  }
  return 'listening'
}

export default function IELTSTestLibrary() {
  const navigate = useNavigate()
  const location = useLocation()
  const { section } = useParams<{ section?: string }>()
  const entry = location.state as { entry?: string; from?: string } | null
  const fromMock = entry?.entry === 'mock-ielts'
  const [activeSkill, setActiveSkill] = useState<SkillId>(() => skillFromLocation(location.pathname, location.hash, section))

  useEffect(() => {
    setActiveSkill(skillFromLocation(location.pathname, location.hash, section))
  }, [location.hash, location.pathname, section])

  useEffect(() => {
    const hasRequestedSkill = [location.hash.slice(1), section, location.pathname.split('/')[2]]
      .some((requested) => skills.some((skill) => skill.id === requested))
    if (!hasRequestedSkill) return
    const frame = window.requestAnimationFrame(() => document.getElementById('ielts-skill-tabs')?.scrollIntoView({ block: 'start' }))
    return () => window.cancelAnimationFrame(frame)
  }, [location.hash, location.pathname, section])

  const selectSkill = (skill: SkillId) => {
    setActiveSkill(skill)
    document.getElementById('ielts-skill-tabs')?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    })
  }

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, skill: SkillId) => {
    const index = skills.findIndex((item) => item.id === skill)
    const nextIndex = event.key === 'ArrowRight' ? (index + 1) % skills.length
      : event.key === 'ArrowLeft' ? (index - 1 + skills.length) % skills.length
        : event.key === 'Home' ? 0
          : event.key === 'End' ? skills.length - 1 : -1
    if (nextIndex < 0) return
    event.preventDefault()
    const nextSkill = skills[nextIndex].id
    setActiveSkill(nextSkill)
    document.getElementById(`ielts-tab-${nextSkill}`)?.focus()
  }

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
              {skills.map(({ id, label, icon: Icon }) => <button key={id} type="button" aria-pressed={activeSkill === id} onClick={() => selectSkill(id)} className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-left text-sm font-black shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:text-red-700 ${activeSkill === id ? 'border-red-200 bg-white text-red-700' : 'border-white bg-white/75 text-slate-800'}`}><Icon className="h-5 w-5 text-red-600" /> {label}</button>)}
            </div>
          </div>
        </header>
        <div id="ielts-skill-tabs" className="sticky top-2 z-20 mt-5 scroll-mt-2 rounded-2xl border border-white bg-white/90 p-2 shadow-[0_12px_35px_rgba(15,23,42,.09)] backdrop-blur-xl">
          <div role="tablist" aria-label="IELTS skills" className="flex gap-2 overflow-x-auto">
            {skills.map(({ id, label, icon: Icon, detail }) => <button key={id} id={`ielts-tab-${id}`} type="button" role="tab" tabIndex={activeSkill === id ? 0 : -1} aria-selected={activeSkill === id} aria-controls="ielts-test-panel" onKeyDown={(event) => handleTabKeyDown(event, id)} onClick={() => setActiveSkill(id)} className={`flex min-w-[10rem] flex-1 items-center gap-3 rounded-xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 ${activeSkill === id ? 'border-red-200 bg-gradient-to-br from-white to-red-50 text-red-700 shadow-[0_6px_18px_rgba(185,28,28,.08)]' : 'border-transparent text-slate-800 hover:bg-red-50/70'}`}><Icon className="h-5 w-5 shrink-0 text-red-600" /><span><strong className="block text-sm">{label}</strong><small className="block whitespace-nowrap text-[11px] font-semibold text-slate-500">{detail}</small></span></button>)}
          </div>
        </div>
        <div id="ielts-test-panel" role="tabpanel" tabIndex={0} aria-labelledby={`ielts-tab-${activeSkill}`} className="mt-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300">
          {activeSkill === 'listening' && <IELTSSectionTests sectionOverride="listening" embedded />}
          {activeSkill === 'reading' && <IELTSSectionTests sectionOverride="reading" embedded />}
          {activeSkill === 'writing' && <IELTSWritingTests embedded />}
          {activeSkill === 'speaking' && <IELTSSpeakingTests embedded />}
        </div>
      </div>
    </main>
  )
}
