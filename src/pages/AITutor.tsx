import { Mic2 } from 'lucide-react'
import AIChatWindow from '@/components/ai/AIChatWindow'
import CoachConnectionStatus from '@/components/ai/CoachConnectionStatus'
import { useAiAssistantStore } from '@/store/aiAssistantStore'
import { useCopy } from '@/i18n/interface'
import { coachCopy } from '@/services/ai/coachPreferences'
import '@/components/ai/coach-studio.css'

export default function AITutor() {
  const { language } = useCopy()
  const text = coachCopy(language)
  const openTalk = useAiAssistantStore((state) => state.openTalk)
  return <main className="workspace-page coach-studio coach-studio--minimal flex h-full !min-h-0 overflow-hidden px-3 py-3 sm:px-5 sm:py-4 lg:px-6 lg:py-5">
    <div className="coach-studio-frame">
      <header className="coach-studio-header">
        <div><span className="coach-studio-eyebrow">ProfAI / AI</span><h1>{text.title}</h1></div>
        <button type="button" onClick={openTalk} className="coach-primary-button" aria-label={text.voice}><Mic2 size={17}/><span>{text.voice}</span></button>
      </header>
      <CoachConnectionStatus/>
      <section className="coach-glass coach-chat-shell"><AIChatWindow variant="page"/></section>
    </div>
  </main>
}
