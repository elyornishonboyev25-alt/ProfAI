import { BookOpen, Check, PenLine, Sigma } from 'lucide-react'
import CoachMascot from './CoachMascot'
import { useAiAssistantStore } from '@/store/aiAssistantStore'
import { useCopy } from '@/i18n/interface'
import { coachCopy } from '@/services/ai/coachPreferences'

const SUBJECTS = [
  { id: 'ielts', icon: PenLine },
  { id: 'sat', icon: Sigma },
  { id: 'english', icon: BookOpen },
] as const

export default function NovaWelcome({ preferredName }: { preferredName: string | null }) {
  const { language } = useCopy()
  const text = coachCopy(language)
  const state = useAiAssistantStore((store) => store.voiceState)
  const level = useAiAssistantStore((store) => store.voiceLevel)
  const workspace = useAiAssistantStore((store) => store.activeWorkspace)
  const setWorkspace = useAiAssistantStore((store) => store.setActiveWorkspace)
  const openTalk = useAiAssistantStore((store) => store.openTalk)

  return <div className="nova-welcome">
    <button type="button" className="nova-showcase" onClick={openTalk} aria-label={text.voice} data-state={state}>
      <span className="nova-showcase-orbit" aria-hidden="true"/>
      <span className="nova-showcase-platform" aria-hidden="true"/>
      <CoachMascot state={state} level={level} size={240}/>
      <span className="nova-showcase-voice" aria-hidden="true"><span/><span/><span/><span/><span/></span>
    </button>
    <span className="nova-welcome-name">Nova <span>· ProfAI</span></span>
    <h2>{preferredName ? `${preferredName}, ` : ''}{text.welcome}</h2>
    {state !== 'idle' ? <p className="nova-live-state" role="status">{text[state]}</p> : null}
    <div className="nova-subjects" role="group" aria-label={text.focus}>
      {SUBJECTS.map(({ id, icon: Icon }) => <button key={id} type="button" aria-pressed={workspace === id} onClick={() => setWorkspace(id)}>
        <span className="nova-subject-icon"><Icon size={21}/></span>
        <span>{text[id]}</span>
        {workspace === id ? <Check className="nova-subject-check" size={13}/> : null}
      </button>)}
    </div>
  </div>
}
