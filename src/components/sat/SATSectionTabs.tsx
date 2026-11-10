import { useCopy } from '@/i18n/interface'
import UiText from '@/components/common/UiText'
import { useEffect, useRef, type KeyboardEvent } from 'react'
import { BookOpenText, Calculator, Layers3, Flame, FolderClock, FileSearch, ChartNoAxesCombined, ArrowUpRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import '@/styles/exam-catalog.css'

export const SAT_SECTION_TABS = [
  { id: 'mocks', label: 'Full Mocks', detail: 'Both sections together', icon: Layers3 },
  { id: 'reading-writing', label: 'Reading & Writing', detail: 'Evidence and expression', icon: BookOpenText },
  { id: 'math', label: 'Math', detail: 'Problem solving', icon: Calculator },
  { id: 'question-bank', label: 'Question Bank', detail: 'Both sections together', icon: FileSearch },
  { id: 'hard-questions', label: 'Hard Questions', detail: '100 English · 100 Math', icon: Flame },
  { id: 'in-process', label: 'In process', detail: 'Continue your saved tests', icon: FolderClock },
] as const


type TabId = (typeof SAT_SECTION_TABS)[number]['id']
export default function SATSectionTabs({ section }: { section: TabId }) {
  const { c: uiCopy } = useCopy()
  const navigate = useNavigate()
  const list = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const reveal = () => {
      const current = document.getElementById(`sat-tab-${section}`)
      if (list.current && current) list.current.scrollLeft = current.offsetLeft - list.current.offsetLeft
    }
    reveal()
    window.addEventListener('resize', reveal)
    return () => window.removeEventListener('resize', reveal)
  }, [section])
  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, tab: TabId) => {
    const index = SAT_SECTION_TABS.findIndex((item) => item.id === tab)
    const nextIndex = event.key === 'ArrowRight' ? (index + 1) % SAT_SECTION_TABS.length
      : event.key === 'ArrowLeft' ? (index - 1 + SAT_SECTION_TABS.length) % SAT_SECTION_TABS.length
        : event.key === 'Home' ? 0
          : event.key === 'End' ? SAT_SECTION_TABS.length - 1 : -1
    if (nextIndex < 0) return
    event.preventDefault()
    const nextTab = SAT_SECTION_TABS[nextIndex].id
    navigate(`/sat/${nextTab}`)
    document.getElementById(`sat-tab-${nextTab}`)?.focus()
  }

  return (
    <>
      <div className="sat-catalog-results"><Link to="/profile" className="exam-library-results"><ChartNoAxesCombined size={16} aria-hidden="true" /><UiText text="My Results" /><ArrowUpRight size={14} aria-hidden="true" /></Link></div>
        <div className="exam-library-nav sticky top-2 z-20">
          <div ref={list} role="tablist" aria-label={uiCopy("SAT test sections")} className="exam-section-tabs">
            {SAT_SECTION_TABS.map(({ id, label, detail, icon: Icon }) => (
              <button key={id} id={`sat-tab-${id}`} type="button" role="tab" tabIndex={section === id ? 0 : -1}
                aria-selected={section === id} aria-controls="sat-test-panel"
                onKeyDown={(event) => handleTabKeyDown(event, id)} onClick={() => navigate(`/sat/${id}`)}>
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span><strong><UiText text={label} /></strong><small><UiText text={detail} /></small></span>
              </button>
            ))}
          </div>
        </div>
    </>
  )
}
