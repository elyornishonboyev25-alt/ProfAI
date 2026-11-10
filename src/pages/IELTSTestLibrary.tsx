import { useCopy } from '@/i18n/interface'
import UiText from '@/components/common/UiText'
import { lazy, Suspense, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowUpRight, BookOpenText, ChartNoAxesCombined, Headphones, Layers3, Mic2, PenLine, FolderClock } from 'lucide-react'
import InProcessPanel from '@/components/tests/InProcessPanel'
import BrandPageLoader from '@/components/common/BrandPageLoader'
import { Link } from 'react-router-dom'
import '@/styles/exam-catalog.css'
const IELTSSectionTests = lazy(() => import('./IELTSSectionTests'))
const IELTSWritingTests = lazy(() => import('./IELTSWritingTests'))
const IELTSSpeakingTests = lazy(() => import('./IELTSSpeakingTests'))
const MockIELTS = lazy(() => import('./MockIELTS'))

const skills = [
  { id: 'listening', label: 'Listening', icon: Headphones, detail: 'Audio and attention' },
  { id: 'reading', label: 'Reading', icon: BookOpenText, detail: 'Evidence and speed' },
  { id: 'writing', label: 'Writing', icon: PenLine, detail: 'Task 1 and Task 2' },
  { id: 'speaking', label: 'Speaking', icon: Mic2, detail: 'Fluency and feedback' },
  { id: 'mocks', label: 'Full mocks', icon: Layers3, detail: 'All four skills together' },
  { id: 'in-process', label: 'In process', icon: FolderClock, detail: 'Continue your saved tests' },
] as const

type TabId = (typeof skills)[number]['id']

function skillFromLocation(pathname: string, hash: string, section?: string): TabId {
  for (const requested of [hash.slice(1), section, pathname.split('/')[2]]) {
    const match = skills.find((skill) => skill.id === requested)
    if (match) return match.id
  }
  return 'listening'
}

export default function IELTSTestLibrary() {
  const { c: uiCopy } = useCopy()
  const location = useLocation()
  const navigate = useNavigate()
  const { section } = useParams<{ section?: string }>()
  const [activeSkill, setActiveSkill] = useState<TabId>(() => skillFromLocation(location.pathname, location.hash, section))
  const tabList = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setActiveSkill(skillFromLocation(location.pathname, location.hash, section))
  }, [location.hash, location.pathname, section])

  useEffect(() => {
    const reveal = () => {
      const current = document.getElementById(`ielts-tab-${activeSkill}`)
      const list = tabList.current
      if (!current || !list) return
      const left = current.offsetLeft - list.offsetLeft
      if (left < list.scrollLeft) list.scrollLeft = left
      else if (left + current.offsetWidth > list.scrollLeft + list.clientWidth) list.scrollLeft = left + current.offsetWidth - list.clientWidth
    }
    reveal()
    window.addEventListener('resize', reveal)
    return () => window.removeEventListener('resize', reveal)
  }, [activeSkill])

  const selectTab = (id: TabId) => {
    setActiveSkill(id)
    navigate({ pathname: '/ielts/tests', hash: `#${id}` }, { replace: true, state: location.state, preventScrollReset: true })
  }

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, skill: TabId) => {
    const index = skills.findIndex((item) => item.id === skill)
    const nextIndex = event.key === 'ArrowRight' ? (index + 1) % skills.length
      : event.key === 'ArrowLeft' ? (index - 1 + skills.length) % skills.length
        : event.key === 'Home' ? 0
          : event.key === 'End' ? skills.length - 1 : -1
    if (nextIndex < 0) return
    event.preventDefault()
    const nextSkill = skills[nextIndex].id
    selectTab(nextSkill)
    document.getElementById(`ielts-tab-${nextSkill}`)?.focus()
  }

  return (
    <main className="workspace-page exam-library-page relative min-h-screen px-4 pb-20 pt-3 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1480px]">
        <header className="exam-library-heading">
          <div><span>IELTS Academic</span><h1><UiText text="Test library" /></h1></div>
          <Link to="/profile" className="exam-library-results"><ChartNoAxesCombined size={17} /><UiText text="My Results" /><ArrowUpRight size={15} /></Link>
        </header>
        <div id="ielts-skill-tabs" className="exam-library-nav sticky top-2 z-20">
          <div ref={tabList} role="tablist" aria-label={uiCopy("IELTS skills")} className="exam-section-tabs">
            {skills.map(({ id, label, icon: Icon, detail }) => <button key={id} id={`ielts-tab-${id}`} type="button" role="tab" tabIndex={activeSkill === id ? 0 : -1} aria-selected={activeSkill === id} aria-controls="ielts-test-panel" onKeyDown={(event) => handleTabKeyDown(event, id)} onClick={() => selectTab(id)}><Icon className="h-5 w-5" aria-hidden="true" /><span><strong><UiText text={label} /></strong><small><UiText text={detail} /></small></span></button>)}
          </div>
        </div>
        <div id="ielts-test-panel" role="tabpanel" tabIndex={0} aria-labelledby={`ielts-tab-${activeSkill}`} className="mt-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
          <Suspense fallback={<BrandPageLoader compact label={uiCopy("Opening page")} />}>
            {activeSkill === 'listening' && <IELTSSectionTests sectionOverride="listening" embedded />}
            {activeSkill === 'reading' && <IELTSSectionTests sectionOverride="reading" embedded />}
            {activeSkill === 'writing' && <IELTSWritingTests embedded />}
            {activeSkill === 'speaking' && <IELTSSpeakingTests embedded />}
            {activeSkill === 'mocks' && <MockIELTS embedded />}
            {activeSkill === 'in-process' && <InProcessPanel exam="IELTS" showEmpty />}
          </Suspense>
        </div>
      </div>
    </main>
  )
}
