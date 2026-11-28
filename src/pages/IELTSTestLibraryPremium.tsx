import { useCopy } from '@/i18n/interface'
import UiText from '@/components/common/UiText'
import { lazy, Suspense, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowUpRight, BookOpenText, ChartNoAxesCombined, Headphones, Layers3, Mic, PenLine, CirclePlay, Search } from 'lucide-react'
import InProcessPanel from '@/components/tests/InProcessPanel'
import BrandPageLoader from '@/components/common/BrandPageLoader'
import { Link } from 'react-router-dom'
import { TestLibraryContext } from '@/components/catalog/TestLibraryContext'
import '@/styles/test-library-premium.css'
const IELTSSectionTests = lazy(() => import('./IELTSSectionTests'))
const IELTSWritingTests = lazy(() => import('./IELTSWritingTests'))
const IELTSSpeakingTests = lazy(() => import('./IELTSSpeakingTests'))
const MockIELTS = lazy(() => import('./MockIELTS'))

const skills = [
  { id: 'listening', label: 'Listening', icon: Headphones, detail: 'Audio and attention' },
  { id: 'reading', label: 'Reading', icon: BookOpenText, detail: 'Evidence and speed' },
  { id: 'writing', label: 'Writing', icon: PenLine, detail: 'Task 1 and Task 2' },
  { id: 'speaking', label: 'Speaking', icon: Mic, detail: 'Fluency and feedback' },
  { id: 'mocks', label: 'Full Mocks', icon: Layers3, detail: 'All four skills together' },
  { id: 'in-process', label: 'In Progress', icon: CirclePlay, detail: 'Continue your saved tests' },
] as const

type TabId = (typeof skills)[number]['id']

function skillFromLocation(pathname: string, hash: string, section?: string): TabId {
  for (const requested of [hash.slice(1), section, pathname.split('/')[2]]) {
    const match = skills.find((skill) => skill.id === requested)
    if (match) return match.id
  }
  return 'listening'
}

export default function IELTSTestLibraryPremium() {
  const { c: uiCopy } = useCopy()
  const location = useLocation()
  const navigate = useNavigate()
  const { section } = useParams<{ section?: string }>()
  const [activeSkill, setActiveSkill] = useState<TabId>(() => skillFromLocation(location.pathname, location.hash, section))
  const tabList = useRef<HTMLDivElement>(null)
  const searchInput = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const focusSearch = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k' && searchInput.current) {
        event.preventDefault()
        searchInput.current.focus()
      }
    }
    window.addEventListener('keydown', focusSearch)
    return () => window.removeEventListener('keydown', focusSearch)
  }, [])

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
    setSearch('')
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
    <div className="tl-page">
      <div className="tl-background-waves" aria-hidden="true" />
      <div className="tl-content">
        <header className="tl-page-header">
          <div className="tl-page-title"><span>IELTS Academic</span><h1><UiText text="Test Library" /></h1><p><UiText text="Practice with real IELTS tests, build your skills, and track your progress." /></p></div>
          <div className="tl-header-tools">
            {activeSkill !== 'mocks' && activeSkill !== 'in-process' && <label className="tl-search"><Search size={21} aria-hidden="true" /><input ref={searchInput} value={search} type="search" onChange={event => setSearch(event.target.value)} placeholder={uiCopy('Search tests, parts, or skills...')} aria-label={uiCopy('Search tests')} aria-keyshortcuts="Control+k Meta+k" /><kbd>⌘ K</kbd></label>}
            <Link to="/profile" className="tl-results tl-dark"><ChartNoAxesCombined size={21} aria-hidden="true" /><UiText text="My Results" /><ArrowUpRight size={18} aria-hidden="true" /></Link>
          </div>
        </header>
        <div id="ielts-skill-tabs" className="tl-nav">
          <div ref={tabList} role="tablist" aria-label={uiCopy("IELTS skills")} className="tl-skill-tabs">
            {skills.map(({ id, label, icon: Icon, detail }) => <button key={id} id={`ielts-tab-${id}`} type="button" role="tab" tabIndex={activeSkill === id ? 0 : -1} aria-selected={activeSkill === id} aria-controls="ielts-test-panel" onKeyDown={(event) => handleTabKeyDown(event, id)} onClick={() => selectTab(id)}><Icon size={29} strokeWidth={1.65} aria-hidden="true" /><span><strong><UiText text={label} /></strong><small><UiText text={detail} /></small></span></button>)}
          </div>
        </div>
        <div id="ielts-test-panel" role="tabpanel" tabIndex={0} aria-labelledby={`ielts-tab-${activeSkill}`} className="tl-tab-panel">
          <TestLibraryContext.Provider value={{ search, onSearchChange: setSearch }}>
          <Suspense fallback={<BrandPageLoader compact label={uiCopy("Opening page")} />}>
            {activeSkill === 'listening' && <IELTSSectionTests sectionOverride="listening" embedded />}
            {activeSkill === 'reading' && <IELTSSectionTests sectionOverride="reading" embedded />}
            {activeSkill === 'writing' && <IELTSWritingTests embedded />}
            {activeSkill === 'speaking' && <IELTSSpeakingTests embedded />}
            {activeSkill === 'mocks' && <MockIELTS embedded />}
            {activeSkill === 'in-process' && <InProcessPanel exam="IELTS" showEmpty />}
          </Suspense>
          </TestLibraryContext.Provider>
        </div>
      </div>
    </div>
  )
}
