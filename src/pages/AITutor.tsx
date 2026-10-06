import { AudioLines, BookOpen, BrainCircuit, Check, GraduationCap, Mic2, PenLine, ShieldCheck, Sigma } from 'lucide-react'
import AIChatWindow from '@/components/ai/AIChatWindow'
import CoachMascot from '@/components/ai/CoachMascot'
import CoachControls from '@/components/ai/CoachControls'
import CoachConnectionStatus from '@/components/ai/CoachConnectionStatus'
import { useAiAssistantStore } from '@/store/aiAssistantStore'
import { useCopy } from '@/i18n/interface'
import { coachCopy } from '@/services/ai/coachPreferences'
import { AI_WORKSPACES, type AiWorkspaceId } from '@/services/ai/workspaces'
import '@/components/ai/coach-studio.css'

const ICONS: Record<AiWorkspaceId, typeof BrainCircuit> = { general: BrainCircuit, ielts: PenLine, sat: Sigma, english: BookOpen, admission: GraduationCap }

export default function AITutor() {
  const { language } = useCopy()
  const text = coachCopy(language)
  const openTalk = useAiAssistantStore((state) => state.openTalk)
  const voiceState = useAiAssistantStore((state) => state.voiceState)
  const voiceLevel = useAiAssistantStore((state) => state.voiceLevel)
  const focus = useAiAssistantStore((state) => state.activeWorkspace)
  const setFocus = useAiAssistantStore((state) => state.setActiveWorkspace)
  const status = text[voiceState === 'idle' ? 'ready' : voiceState]
  return <main className="workspace-page coach-studio flex h-full !min-h-0 overflow-hidden px-3 py-3 sm:px-5 sm:py-4 lg:px-6 lg:py-5">
    <div className="coach-studio-frame">
      <header className="coach-studio-header">
        <div><span className="coach-studio-eyebrow">{text.studio}</span><h1>{text.title}</h1><p>{text.subtitle}</p></div>
        <button type="button" onClick={openTalk} className="coach-primary-button" aria-label={text.voice}><Mic2 size={17}/><span>{text.voice}</span></button>
      </header>
      <CoachConnectionStatus/>
      <div className="coach-studio-grid">
        <aside className="coach-studio-sidebar">
          <section className="coach-glass coach-companion-card">
            <CoachMascot state={voiceState} level={voiceLevel} size={164}/>
            <h2>{text.companion}</h2><p>{text.companionDetail}</p>
            <span className="coach-status-pill" role="status"><span className="coach-status-dot"/>{status}</span>
          </section>
          <section className="coach-glass coach-focus-card"><h2><AudioLines size={14}/>{text.focus}</h2>
            <div className="coach-focus-list">{AI_WORKSPACES.map(({ id }) => {
              const Icon = ICONS[id]
              return <button key={id} type="button" className="coach-focus-button" aria-pressed={focus === id} onClick={() => setFocus(id)}>
                <span className="coach-focus-icon"><Icon size={16}/></span><span className="min-w-0 flex-1"><b>{text[id]}</b><small>{text[`${id}Detail`]}</small></span>
                {focus === id ? <Check size={13} className="hidden shrink-0 text-red-600 lg:block"/> : null}
              </button>
            })}</div>
          </section>
          <CoachControls/>
          <p className="coach-private-note"><ShieldCheck size={13}/>{text.private}</p>
        </aside>
        <section className="coach-glass coach-chat-shell"><AIChatWindow variant="page"/></section>
      </div>
    </div>
  </main>
}
