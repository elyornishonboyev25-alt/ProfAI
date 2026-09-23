import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, CalendarDays, Check, ChevronDown, FileSearch } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { getReadingAnalysisHistory } from '@/utils/readingAnalysisStorage'
import { getWritingAnalysisHistory } from '@/utils/writingAnalysisStorage'
import { selectUserSessions, useSpeakingStore } from '@/store/speakingStore'
import { loadOnboardingProfile, saveOnboardingProfile } from '@/utils/weeklyPlanner'
import { useCopy } from '@/i18n/interface'
import StudyObject, { type StudyObjectKind } from '@/components/visuals/StudyObject'

const skills: { id: 'listening' | 'reading' | 'writing' | 'speaking'; title: string; description: string; object: StudyObjectKind }[] = [
  { id: 'listening', title: 'Listening', description: 'Conversations, monologues and academic talks.', object: 'headphones' },
  { id: 'reading', title: 'Reading', description: 'Understand passages and find the evidence.', object: 'book' },
  { id: 'writing', title: 'Writing', description: 'Develop clear answers for Task 1 and Task 2.', object: 'notebook' },
  { id: 'speaking', title: 'Speaking', description: 'Practice interviews, long turns and discussions.', object: 'microphone' },
]
function localToday() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }
function stored(key: string, fallback = '') { try { return localStorage.getItem(key) || fallback } catch { return fallback } }
function validBand(value: unknown) { return typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= 9 ? value : null }
export default function IELTS() {
  const { c, language } = useCopy()
  const user = useAuthStore(s => s.user)
  const sessions = useSpeakingStore(s => s.sessions)
  const navigate = useNavigate()
  const { state } = useLocation()
  const profile = loadOnboardingProfile(user?.id)
  const dateKey = `smarttest:ielts-exam-date:${user?.id || 'guest'}`
  const timeKey = `smarttest:ielts-exam-time:${user?.id || 'guest'}`
  const [date, setDate] = useState(() => stored(dateKey, profile?.ieltsExamDate))
  const [time, setTime] = useState(() => stored(timeKey, '08:00'))
  const [draft, setDraft] = useState(date)
  const [draftTime, setDraftTime] = useState(time)
  const [editing, setEditing] = useState(false)
  const [saveError, setSaveError] = useState(false)
  useEffect(() => { const next = stored(dateKey, loadOnboardingProfile(user?.id)?.ieltsExamDate); setDate(next); setDraft(next); setTime(stored(timeKey,'08:00')); setDraftTime(stored(timeKey,'08:00')) }, [dateKey,timeKey,user?.id])
  const scores = useMemo(() => {
    const history = getReadingAnalysisHistory(user?.id)
    const listening = history.find(item => /listening/i.test(item.testId + item.testTitle))
    const reading = history.find(item => !/listening/i.test(item.testId + item.testTitle))
    const speaking = selectUserSessions(sessions, user?.id ?? null).slice(-1)[0]
    return { listening: validBand(listening?.bandScore), reading: validBand(reading?.bandScore), writing: validBand(getWritingAnalysisHistory(user?.id)[0]?.overallBand), speaking: validBand(speaking?.overallBand) }
  }, [sessions,user?.id])
  function saveDate() {
    if (!draft || draft < localToday()) return
    try {
      localStorage.setItem(dateKey,draft); localStorage.setItem(timeKey,draftTime)
      if (profile) saveOnboardingProfile({ ...profile, ieltsExamDate: draft, daysToExam: Math.max(0,Math.ceil((new Date(draft+'T'+draftTime).getTime()-Date.now())/86400000)) },user?.id)
      setDate(draft); setTime(draftTime); setEditing(false); setSaveError(false)
    } catch { setSaveError(true) }
  }
  return <div className="workspace-page liquid-page">
    <header className="liquid-page-heading liquid-heading-with-tabs"><div><Link className="liquid-text-link" to="/test-preparation">{c('Preparation')}</Link><h1>{c('IELTS preparation')}</h1><p>{c('One skill at a time. One step closer.')}</p></div><div className="glass-control liquid-track-tabs"><Link to="/ielts" aria-current="page">IELTS</Link><Link to="/sat">SAT</Link></div></header>
    <div className="liquid-skill-grid">{skills.map(skill => <button key={skill.id} className="glass-surface liquid-skill-card" onClick={() => navigate(`/ielts/${skill.id}/tests`, { state: state?.entry === 'mock-ielts' ? state : { entry: 'ielts-hub' } })}>
      <div><p className="liquid-eyebrow">IELTS</p><h2>{c(skill.title)}</h2><p>{c(skill.description)}</p><span className="liquid-text-link">{c('Open tests')}<ArrowRight size={17} /></span></div><StudyObject kind={skill.object} />
    </button>)}</div>
    <Link to="/mock/ielts" state={{ from: 'ielts' }} className="glass-surface liquid-resource-row"><div><p className="liquid-eyebrow">{c('Full mock tests')}</p><h3>{c('Practice all four skills in one flow')}</h3></div><ArrowRight /></Link>
    <div className="liquid-exam-grid"><Link to="/academic-skills" className="glass-surface liquid-resource-row"><div><h3>{c('Additional practice')}</h3><p>{c('Audio, articles, vocabulary and pronunciation.')}</p></div><ArrowRight size={19} /></Link><Link to="/analyze-mistakes" className="glass-surface liquid-resource-row"><div><h3>{c('Review mistakes')}</h3><p>{c('Review your answers and see what to work on next.')}</p></div><FileSearch size={20} /></Link></div>
    <details className="glass-surface liquid-progress-details"><summary>{c('My Results')} &amp; {c('Exam plan')}<ChevronDown size={18} /></summary><div className="liquid-exam-grid">
      <section><h2>{c('Your IELTS overview')}</h2><div className="liquid-score-list">{skills.map(skill => <div key={skill.id}><span>{c(skill.title)}</span><strong>{scores[skill.id]?.toFixed(1) || '—'}</strong></div>)}</div><p>{c('Scores appear after completed practice.')}</p></section>
      <section><h2><CalendarDays size={18} />{c('Exam plan')}</h2><p>{date ? new Intl.DateTimeFormat(language === 'ru' ? 'ru-RU' : 'en-GB',{dateStyle:'medium',timeStyle:'short'}).format(new Date(date+'T'+time)) : c('Use the date from your official booking.')}</p>
        {editing ? <div><label className="liquid-form-field">{c('Exam date')}<input className="input" type="date" min={localToday()} value={draft} onChange={e=>setDraft(e.target.value)} /></label><label className="liquid-form-field">{c('Exam time')}<input className="input" type="time" value={draftTime} onChange={e=>setDraftTime(e.target.value)} /></label><div className="liquid-actions"><button className="liquid-button primary" disabled={!draft || draft < localToday() || !draftTime} onClick={saveDate}><Check size={17} />{c('Save')}</button><button className="liquid-text-link" onClick={()=>setEditing(false)}>{c('Cancel')}</button></div>{saveError && <p role="alert">{c('We could not save your choices. Please try again.')}</p>}</div> : <button className="liquid-text-link" onClick={()=>setEditing(true)}>{c(date ? 'Change date' : 'Set exam date')}</button>}
      </section></div></details>
  </div>
}
