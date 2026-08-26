import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  FileSearch,
  Flag,
  Headphones,
  Mic2,
  PenLine,
  Sparkles,
  Target,
  X,
} from 'lucide-react'
import { FeatureIllustration, type FeatureIllustrationKind } from '@/components/ui/FeatureIllustration'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { getReadingAnalysisHistory } from '@/utils/readingAnalysisStorage'
import { getWritingAnalysisHistory } from '@/utils/writingAnalysisStorage'
import { selectUserSessions, useSpeakingStore } from '@/store/speakingStore'
import { loadActivityLog, loadOnboardingProfile, saveOnboardingProfile } from '@/utils/weeklyPlanner'

type SkillId = 'listening' | 'reading' | 'writing' | 'speaking'
type SkillScore = Record<SkillId, number>

const DAY_MS = 86_400_000
const SKILLS: Array<{
  id: SkillId
  title: string
  topics: string[]
  tests: number
  illustration: FeatureIllustrationKind
  icon: typeof Headphones
}> = [
  { id: 'listening', title: 'IELTS Listening', topics: ['Conversations', 'Monologues', 'Academic talks'], tests: 15, illustration: 'listening', icon: Headphones },
  { id: 'reading', title: 'IELTS Reading', topics: ['Evidence', 'Vocabulary', 'Comprehension'], tests: 12, illustration: 'reading', icon: Target },
  { id: 'writing', title: 'IELTS Writing', topics: ['Task 1', 'Task 2', 'Coherence'], tests: 10, illustration: 'writing', icon: PenLine },
  { id: 'speaking', title: 'IELTS Speaking', topics: ['Interview', 'Long turn', 'Discussion'], tests: 8, illustration: 'speaking', icon: Mic2 },
]

const GLASS = 'relative overflow-hidden rounded-[2rem] border border-white/90 bg-white/88 shadow-[0_24px_64px_rgba(30,41,59,.1),inset_0_1px_0_rgba(255,255,255,.98)]'

function localToday() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function examDateKey(userId?: string) { return `smarttest:ielts-exam-date:${userId?.trim() || 'guest'}` }
function examTimeKey(userId?: string) { return `smarttest:ielts-exam-time:${userId?.trim() || 'guest'}` }

function loadExamDate(userId?: string) {
  if (typeof window === 'undefined') return ''
  const value = window.localStorage.getItem(examDateKey(userId)) ?? loadOnboardingProfile(userId)?.ieltsExamDate ?? ''
  return value >= localToday() ? value : ''
}

function loadExamTime(userId?: string) {
  if (typeof window === 'undefined') return '08:00'
  return window.localStorage.getItem(examTimeKey(userId)) || '08:00'
}

function saveExam(date: string, time: string, userId?: string) {
  window.localStorage.setItem(examDateKey(userId), date)
  window.localStorage.setItem(examTimeKey(userId), time)
  const profile = loadOnboardingProfile(userId)
  if (!profile) return
  const distance = new Date(`${date}T${time}:00`).getTime() - Date.now()
  saveOnboardingProfile({ ...profile, ieltsExamDate: date, daysToExam: Math.max(0, Math.ceil(distance / DAY_MS)) }, userId)
}

function validBand(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= 9 ? value : 0
}

function formatBand(value: number) { return value > 0 ? value.toFixed(1) : '—' }

function ProgressRing({ band, label = 'Band' }: { band: number; label?: string }) {
  const percent = Math.round((band / 9) * 100)
  const radius = 45
  const circumference = Math.PI * 2 * radius
  return (
    <div className="relative h-[7.25rem] w-[7.25rem] shrink-0" aria-label={`${label} ${formatBand(band)}`}>
      <svg className="h-full w-full -rotate-90" viewBox="0 0 110 110" aria-hidden="true">
        <circle cx="55" cy="55" r={radius} fill="none" stroke="rgba(148,163,184,.23)" strokeWidth="11" />
        <circle cx="55" cy="55" r={radius} fill="none" stroke="url(#ielts-ring)" strokeWidth="11" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference - (percent / 100) * circumference} />
        <defs><linearGradient id="ielts-ring"><stop stopColor="#ef353d" /><stop offset="1" stopColor="#a91f29" /></linearGradient></defs>
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center leading-none text-slate-900">
        <small className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500">{label}</small>
        <strong className="mt-1 text-2xl font-black tracking-[-.05em]">{formatBand(band)}</strong>
      </span>
    </div>
  )
}

function SkillCard({ skill, score, onOpen }: { skill: (typeof SKILLS)[number]; score: number; onOpen: () => void }) {
  return (
    <article className={`${GLASS} group min-h-[22rem] min-w-0 p-6 sm:p-7`}>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(116deg,rgba(255,255,255,.58),rgba(255,255,255,.05)_48%,rgba(219,234,254,.18)_49%,transparent)]" />
      <div className="relative flex h-full flex-col">
        <h2 className="text-[1.65rem] font-black tracking-[-.045em] text-[#12131f] sm:text-[1.9rem]">{skill.title}</h2>
        <div className="mt-5 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Skills</h3>
            <ul className="mt-1 space-y-1 text-base font-medium leading-6 text-slate-700">
              {skill.topics.map((topic) => <li key={topic}>{topic}</li>)}
            </ul>
          </div>
          <ProgressRing band={score} />
        </div>
        <div className="mt-auto flex min-w-0 items-end justify-between gap-1 pt-4 sm:gap-3">
          <FeatureIllustration kind={skill.illustration} />
          <button type="button" onClick={onOpen} className="group/button mb-1 inline-flex min-w-[7rem] items-center justify-center gap-2 rounded-full border border-red-300/70 bg-gradient-to-b from-[#ee4248] to-[#d5222c] px-4 py-3 text-sm font-extrabold text-white shadow-[0_12px_24px_rgba(220,38,38,.28),inset_0_2px_3px_rgba(255,255,255,.5)] transition hover:-translate-y-0.5 sm:min-w-[8.5rem] sm:px-6 sm:text-base">
            Practice <ArrowRight className="h-4 w-4 transition-transform group-hover/button:translate-x-1" />
          </button>
        </div>
      </div>
    </article>
  )
}

export default function IELTS() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state: AuthState) => state.user)
  const speakingSessions = useSpeakingStore((state) => state.sessions)
  const [examDate, setExamDate] = useState(() => loadExamDate(user?.id))
  const [examTime, setExamTime] = useState(() => loadExamTime(user?.id))
  const [editingDate, setEditingDate] = useState(false)
  const [draftDate, setDraftDate] = useState(examDate)
  const [draftTime, setDraftTime] = useState(examTime)
  const [now, setNow] = useState(Date.now())
  const entry = location.state as { entry?: string; from?: string } | null
  const fromMock = entry?.entry === 'mock-ielts'

  const scores = useMemo<SkillScore>(() => {
    const objective = getReadingAnalysisHistory(user?.id)
    const listening = objective.find((item) => `${item.testId} ${item.testTitle}`.toLowerCase().includes('listening'))
    const reading = objective.find((item) => !`${item.testId} ${item.testTitle}`.toLowerCase().includes('listening'))
    const writing = getWritingAnalysisHistory(user?.id)[0]
    const userSpeaking = selectUserSessions(speakingSessions, user?.id ?? null)
    const speaking = userSpeaking[userSpeaking.length - 1]
    return { listening: validBand(listening?.bandScore), reading: validBand(reading?.bandScore), writing: validBand(writing?.overallBand), speaking: validBand(speaking?.overallBand) }
  }, [speakingSessions, user?.id])

  const completed = Object.values(scores).filter(Boolean)
  const overall = completed.length ? Math.round((completed.reduce((sum, value) => sum + value, 0) / completed.length) * 2) / 2 : 0
  const profile = loadOnboardingProfile(user?.id)
  const target = profile?.targetIeltsScore ?? 8
  const activity = loadActivityLog(user?.id)
  const studyMinutes = Object.values(activity).reduce((sum, day) => sum + Object.entries(day).filter(([key]) => key.startsWith('ielts') || key === 'mock').reduce((daily, [, value]) => daily + value, 0), 0)
  const remainingMs = examDate ? Math.max(0, new Date(`${examDate}T${examTime}:00`).getTime() - now) : null
  const remainingDays = remainingMs === null ? null : Math.ceil(remainingMs / DAY_MS)

  useEffect(() => {
    setExamDate(loadExamDate(user?.id))
    setExamTime(loadExamTime(user?.id))
  }, [user?.id])

  useEffect(() => {
    if (!examDate) return
    const id = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(id)
  }, [examDate])

  const openSkill = (id: SkillId) => {
    const path = id === 'writing' ? '/ielts/writing/tests' : id === 'speaking' ? '/ielts/speaking/tests' : `/ielts/${id}`
    navigate(path, { state: fromMock ? { entry: 'mock-ielts', from: entry?.from ?? 'tests' } : { entry: 'ielts-hub' } })
  }

  return (
    <main className="workspace-page min-h-screen overflow-x-clip px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[112rem]">
        <button type="button" onClick={() => navigate(fromMock ? '/mock/ielts' : '/dashboard')} className="inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/65 px-4 py-2 text-xs font-extrabold text-slate-600 shadow-sm backdrop-blur-md hover:text-red-600">
          <ArrowLeft className="h-4 w-4" /> {fromMock ? 'Mock IELTS' : 'Dashboard'}
        </button>

        <header className="pb-8 pt-5 text-center sm:pb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[.18em] text-red-600 backdrop-blur-md">
            <Sparkles className="h-3 w-3" /> IELTS command center
          </div>
          <h1 className="mt-3 text-[2.55rem] font-extrabold tracking-[-.065em] text-[#11121c] sm:text-6xl lg:text-[5.2rem]">IELTS <span className="text-red-600">Arena</span></h1>
          <p className="mx-auto mt-3 max-w-5xl text-sm font-medium tracking-[-.025em] text-[#262733] sm:text-xl lg:text-[1.65rem]">Listening + Reading + Writing + Speaking — your path to Band {target}+</p>
        </header>

        <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(18rem,.62fr)]">
          {SKILLS.slice(0, 2).map((skill) => <SkillCard key={skill.id} skill={skill} score={scores[skill.id]} onOpen={() => openSkill(skill.id)} />)}
          <aside className="grid gap-5 sm:grid-cols-2 xl:row-span-2 xl:grid-cols-1">
            <article className={`${GLASS} p-6`}>
              <h2 className="text-2xl font-black tracking-[-.045em] text-slate-900">Your IELTS overview</h2>
              <div className="mt-5 flex items-center justify-between gap-4 rounded-[1.5rem] border border-white/90 bg-white/45 p-4">
                <div><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Overall band</p><p className="mt-2 text-4xl font-black text-slate-900">{formatBand(overall)}</p><p className="mt-1 text-xs font-semibold text-slate-500">{completed.length}/4 skills scored</p></div>
                <ProgressRing band={overall} label="Overall" />
              </div>
              <div className="mt-5 space-y-3">{SKILLS.map((skill) => <div key={skill.id} className="grid grid-cols-[5rem_1fr_2rem] items-center gap-2 text-xs font-bold"><span className="text-slate-600">{skill.title.replace('IELTS ', '')}</span><span className="h-2 overflow-hidden rounded-full bg-slate-200"><i className="block h-full rounded-full bg-gradient-to-r from-red-700 to-red-400" style={{ width: `${(scores[skill.id] / 9) * 100}%` }} /></span><b className="text-right text-slate-900">{formatBand(scores[skill.id])}</b></div>)}</div>
            </article>

            <article className={`${GLASS} p-6`}>
              <div className="flex items-center justify-between"><div><p className="text-xs font-extrabold uppercase tracking-wider text-red-600">Exam plan</p><h2 className="mt-1 text-2xl font-black text-slate-900">{remainingDays === null ? 'Set your test date' : remainingDays === 0 ? 'Exam day' : `${remainingDays} days to go`}</h2></div><CalendarDays className="h-7 w-7 text-blue-600" /></div>
              <p className="mt-2 text-sm font-medium text-slate-500">{examDate ? new Date(`${examDate}T${examTime}:00`).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Use the date from your official booking.'}</p>
              {editingDate ? <div className="mt-4 grid gap-2"><input type="date" min={localToday()} value={draftDate} onChange={(event) => setDraftDate(event.target.value)} className="input" /><input type="time" value={draftTime} onChange={(event) => setDraftTime(event.target.value)} className="input" /><div className="flex gap-2"><button type="button" disabled={!draftDate} onClick={() => { saveExam(draftDate, draftTime, user?.id); setExamDate(draftDate); setExamTime(draftTime); setEditingDate(false) }} className="ui-action ui-action-primary flex-1"><Check className="h-4 w-4" /> Save</button><button type="button" onClick={() => setEditingDate(false)} className="ui-action ui-action-secondary" aria-label="Cancel"><X className="h-4 w-4" /></button></div></div> : <button type="button" onClick={() => { setDraftDate(examDate); setDraftTime(examTime); setEditingDate(true) }} className="ui-action ui-action-secondary mt-4 w-full">{examDate ? 'Change date' : 'Set exam date'}</button>}
            </article>
          </aside>

          {SKILLS.slice(2).map((skill) => <SkillCard key={skill.id} skill={skill} score={scores[skill.id]} onOpen={() => openSkill(skill.id)} />)}
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[1.25fr_1fr]">
          <article className={`${GLASS} flex flex-col justify-between gap-6 p-6 sm:flex-row sm:items-center sm:p-7`}>
            <div><p className="text-xs font-extrabold uppercase tracking-[.16em] text-red-600">Full IELTS mock</p><h2 className="mt-2 text-2xl font-black tracking-[-.04em] text-slate-900">Practice all four skills in one flow</h2><p className="mt-1 text-sm font-medium text-slate-500">Use verified results to update your overview.</p></div>
            <button type="button" onClick={() => navigate('/mock/ielts', { state: { from: 'ielts' } })} className="ui-action ui-action-primary shrink-0 rounded-full px-6">Start full mock <ArrowRight className="h-4 w-4" /></button>
          </article>
          <div className="grid grid-cols-3 gap-3">
            {[{ label: 'Target band', value: `${target}+`, icon: Flag }, { label: 'Completed', value: `${completed.length}/4`, icon: Check }, { label: 'Study time', value: studyMinutes >= 60 ? `${Math.round(studyMinutes / 60)}h` : `${studyMinutes}m`, icon: Clock3 }].map(({ label, value, icon: Icon }) => <article key={label} className={`${GLASS} flex min-h-[9rem] flex-col justify-center p-4`}><Icon className="mb-3 h-5 w-5 text-red-500" /><p className="text-[11px] font-semibold text-slate-500">{label}</p><strong className="mt-1 text-2xl font-black tracking-[-.05em] text-slate-900">{value}</strong></article>)}
          </div>
        </section>

        <button type="button" onClick={() => navigate('/analyze-mistakes')} className={`${GLASS} mt-5 flex w-full items-center justify-between gap-4 p-5 text-left`}><span className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-red-50 text-red-600"><FileSearch className="h-5 w-5" /></span><span><b className="block text-base font-black text-slate-900">Mistake lab</b><small className="text-slate-500">Review weak skills and missed answers</small></span></span><ArrowRight className="h-5 w-5 text-red-600" /></button>
      </div>
    </main>
  )
}
