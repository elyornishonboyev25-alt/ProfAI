import { Heart, Sparkles, Target, WandSparkles, ChevronDown } from 'lucide-react'
import { useCopy } from '@/i18n/interface'
import { useAuthStore } from '@/store/authStore'
import { useAiAssistantStore } from '@/store/aiAssistantStore'
import { coachCopy, DEFAULT_COACH_PREFERENCES, type CoachStyle, type LessonMode } from '@/services/ai/coachPreferences'
import './coach-studio.css'

export default function CoachControls({ compact = false }: { compact?: boolean }) {
  const { language } = useCopy()
  const text = coachCopy(language)
  const owner = useAuthStore((state) => state.user?.id ? `user:${state.user.id}` : 'guest')
  const settings = useAiAssistantStore((state) => state.coachPreferencesByOwner[owner] ?? DEFAULT_COACH_PREFERENCES)
  const update = useAiAssistantStore((state) => state.setCoachPreferences)
  const styles: Array<{ id: CoachStyle; icon: typeof Heart }> = [{ id: 'adaptive', icon: WandSparkles }, { id: 'gentle', icon: Heart }, { id: 'strict', icon: Target }, { id: 'playful', icon: Sparkles }]
  const content = <div className="coach-controls-content">
    <fieldset><legend>{text.style}</legend><div className="coach-style-grid">{styles.map(({ id, icon: Icon }) => <button key={id} type="button" aria-pressed={settings.style === id} onClick={() => update(owner, { style: id })}><Icon size={15}/><span>{text[id]}</span></button>)}</div>
      <p className="coach-setting-detail">{text[`${settings.style}Detail`]}</p></fieldset>
    <fieldset><legend>{text.lesson}</legend><div className="coach-lesson-grid">{(['teach', 'practice', 'review', 'plan'] as LessonMode[]).map((id) => <button key={id} type="button" aria-pressed={settings.lessonMode === id} onClick={() => update(owner, { lessonMode: id })}>{text[id]}</button>)}</div></fieldset>
    <label className="coach-banter-toggle"><input type="checkbox" checked={settings.playfulLanguage} onChange={(event) => update(owner, { playfulLanguage: event.target.checked })}/><span><b>{text.playfulLanguage}</b><small>{text.banterDetail}</small></span></label>
    <p className="coach-settings-note">{text.settingsNote}</p>
  </div>
  return compact ? <details className="coach-controls coach-controls--compact"><summary>{text.preferences}<ChevronDown size={14}/></summary>{content}</details>
    : <section className="coach-controls">{content}</section>
}
