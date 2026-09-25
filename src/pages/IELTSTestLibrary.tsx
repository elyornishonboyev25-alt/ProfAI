import { lazy, Suspense, useEffect, useState, type KeyboardEvent } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { BookOpenText, Headphones, Mic2, PenLine } from 'lucide-react'
const IELTSSectionTests = lazy(() => import('./IELTSSectionTests'))
const IELTSWritingTests = lazy(() => import('./IELTSWritingTests'))
const IELTSSpeakingTests = lazy(() => import('./IELTSSpeakingTests'))

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
  const location = useLocation()
  const { section } = useParams<{ section?: string }>()
  const [activeSkill, setActiveSkill] = useState<SkillId>(() => skillFromLocation(location.pathname, location.hash, section))

  useEffect(() => {
    setActiveSkill(skillFromLocation(location.pathname, location.hash, section))
  }, [location.hash, location.pathname, section])

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
    <main className="workspace-page relative min-h-screen px-4 pb-20 pt-3 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1480px]">
        <div id="ielts-skill-tabs" className="sticky top-2 z-20 rounded-2xl border border-white bg-white/95 p-2 shadow-[0_12px_35px_rgba(15,23,42,.09)]">
          <div role="tablist" aria-label="IELTS skills" className="flex gap-2 overflow-x-auto">
            {skills.map(({ id, label, icon: Icon, detail }) => <button key={id} id={`ielts-tab-${id}`} type="button" role="tab" tabIndex={activeSkill === id ? 0 : -1} aria-selected={activeSkill === id} aria-controls="ielts-test-panel" onKeyDown={(event) => handleTabKeyDown(event, id)} onClick={() => setActiveSkill(id)} className={`flex min-w-[10rem] flex-1 items-center gap-3 rounded-xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 ${activeSkill === id ? 'border-red-200 bg-gradient-to-br from-white to-red-50 text-red-700 shadow-[0_6px_18px_rgba(185,28,28,.08)]' : 'border-transparent text-slate-800 hover:bg-red-50/70'}`}><Icon className="h-5 w-5 shrink-0 text-red-600" /><span><strong className="block text-sm">{label}</strong><small className="block whitespace-nowrap text-[11px] font-semibold text-slate-500">{detail}</small></span></button>)}
          </div>
        </div>
        <div id="ielts-test-panel" role="tabpanel" tabIndex={0} aria-labelledby={`ielts-tab-${activeSkill}`} className="mt-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300">
          <Suspense fallback={<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Loading IELTS tests">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-40 animate-pulse rounded-[1.5rem] border border-white bg-white/75" />)}</div>}>
            {activeSkill === 'listening' && <IELTSSectionTests sectionOverride="listening" embedded />}
            {activeSkill === 'reading' && <IELTSSectionTests sectionOverride="reading" embedded />}
            {activeSkill === 'writing' && <IELTSWritingTests embedded />}
            {activeSkill === 'speaking' && <IELTSSpeakingTests embedded />}
          </Suspense>
        </div>
      </div>
    </main>
  )
}
