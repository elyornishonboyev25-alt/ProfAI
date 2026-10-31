import { useEffect, useRef, type KeyboardEvent } from 'react'
import { BookOpenText, Calculator, Layers3, Flame } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ResumeSATAttempts from './ResumeSATAttempts'

export const SAT_SECTION_TABS = [
  { id: 'mocks', label: 'Full Mocks', detail: 'Both sections together', icon: Layers3 },
  { id: 'reading-writing', label: 'Reading & Writing', detail: 'Evidence and expression', icon: BookOpenText },
  { id: 'math', label: 'Math', detail: 'Problem solving', icon: Calculator },
  { id: 'hard-questions', label: 'Hard Questions', detail: '100 English · 100 Math', icon: Flame },
] as const


type TabId = (typeof SAT_SECTION_TABS)[number]['id']
export default function SATSectionTabs({ section }: { section: TabId }) {
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
      <ResumeSATAttempts />
        <div className="sticky top-2 z-20 rounded-2xl border border-white bg-white/95 p-2 shadow-[0_12px_35px_rgba(15,23,42,.09)]">
          <div ref={list} role="tablist" aria-label="SAT test sections" className="flex gap-2 overflow-x-auto">
            {SAT_SECTION_TABS.map(({ id, label, detail, icon: Icon }) => (
              <button key={id} id={`sat-tab-${id}`} type="button" role="tab" tabIndex={section === id ? 0 : -1}
                aria-selected={section === id} aria-controls="sat-test-panel"
                onKeyDown={(event) => handleTabKeyDown(event, id)} onClick={() => navigate(`/sat/${id}`)}
                className={`flex min-w-[11rem] flex-1 items-center gap-3 rounded-xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 ${section === id ? 'border-red-200 bg-gradient-to-br from-white to-red-50 text-red-700 shadow-[0_6px_18px_rgba(185,28,28,.08)]' : 'border-transparent text-slate-800 hover:bg-red-50/70'}`}>
                <Icon className="h-5 w-5 shrink-0 text-red-600" />
                <span><strong className="block text-sm">{label}</strong><small className="block whitespace-nowrap text-[11px] font-semibold text-slate-500">{detail}</small></span>
              </button>
            ))}
          </div>
        </div>
    </>
  )
}
