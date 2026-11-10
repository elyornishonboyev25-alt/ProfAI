import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, BookOpenText, Calculator, CalendarDays, Check, Headphones, Mic2, PenLine, Target, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import UiText from '@/components/common/UiText'
import { useCopy } from '@/i18n/interface'
import { interfaceLocale } from '@/i18n/locale'
import { useSpeakingStore } from '@/store/speakingStore'
import { ACCOUNT_DATA_EVENT, accountStorageFor } from '@/utils/accountStorage'
import { getIeltsHubScores } from '@/utils/ieltsHubScores'
import { loadOnboardingProfile, saveOnboardingProfile } from '@/utils/weeklyPlanner'
import { getSATReviewTests, isSATTestComplete } from '@/features/sat/catalog'
import { loadSATAttempt, loadSATAttemptHistory } from '@/features/sat/attemptStorage'
import { scoreSATModules } from '@/features/sat/practiceTest4'

// Read both current and archived attempts: starting a retake must not erase a score.
export function dashboardSatSections() {
  const tests = getSATReviewTests().filter(test => test.modules.length === 4 && isSATTestComplete(test))
  const history = loadSATAttemptHistory()
  let best: { total: number; reading: number; math: number } | null = null
  for (const test of tests) {
    const latest = loadSATAttempt(test.id)
    const attempts = [...history.filter(entry => entry.attempt.testId === test.id).map(entry => entry.attempt), ...(latest ? [latest] : [])]
    for (const attempt of attempts) {
      if (attempt.status !== 'submitted') continue
      const report = scoreSATModules(test.modules, attempt.answers)
      if (!best || report.midpoint > best.total) best = {
        total: report.midpoint,
        reading: Math.round((report.readingWritingRange[0] + report.readingWritingRange[1]) / 20) * 10,
        math: Math.round((report.mathRange[0] + report.mathRange[1]) / 20) * 10,
      }
    }
  }
  return best
}

function today() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function ExamPlan({ exam, owner, revision }: { exam: 'IELTS' | 'SAT'; owner: string; revision: number }) {
  const { c } = useCopy()
  const kind = exam.toLowerCase()
  const dateKey = `smarttest:${kind}-exam-date:${owner}`
  const timeKey = `smarttest:${kind}-exam-time:${owner}`
  const storage = accountStorageFor(owner)
  const profile = loadOnboardingProfile(owner)
  const date = storage.getItem(dateKey) ?? (exam === 'IELTS' ? profile?.ieltsExamDate : profile?.satExamDate) ?? ''
  const time = storage.getItem(timeKey) || '08:00'
  const [draftDate, setDraftDate] = useState(date)
  const [draftTime, setDraftTime] = useState(time)
  const [now, setNow] = useState(Date.now())
  const details = useRef<HTMLDetailsElement>(null)
  useEffect(() => { const id = window.setInterval(() => setNow(Date.now()), 60_000); return () => window.clearInterval(id) }, [])
  useEffect(() => { if (details.current) details.current.open = false }, [owner])
  // revision subscribes this footer to changes restored from another session.
  void revision
  const deadline = date ? new Date(`${date}T${time}:00`) : null
  const valid = deadline && Number.isFinite(deadline.getTime())
  const days = valid ? Math.max(0, Math.ceil((deadline.getTime() - now) / 86_400_000)) : null
  return <details ref={details} className="dashboard-exam-plan" onToggle={event => {
    if (event.currentTarget.open) { setDraftDate(date); setDraftTime(time) }
  }}>
    <summary aria-label={`${exam}: ${c(date ? 'Change date' : 'Set exam date')}`}>
      <CalendarDays size={16} aria-hidden="true" />
      <span>{valid ? deadline.toLocaleDateString(interfaceLocale(), { day: 'numeric', month: 'short', year: 'numeric' }) : <UiText text="Set exam date" />}</span>
      {days !== null ? <small>{days} <UiText text="days to go" /></small> : null}
    </summary>
    <form className="dashboard-exam-date-form" onSubmit={event => {
      event.preventDefault()
      if (!draftDate || draftDate < today()) return
      storage.setItem(dateKey, draftDate)
      storage.setItem(timeKey, draftTime || '08:00')
      if (profile) saveOnboardingProfile({
        ...profile,
        [exam === 'IELTS' ? 'ieltsExamDate' : 'satExamDate']: draftDate,
        ...(exam === 'IELTS' ? { daysToExam: Math.max(0, Math.ceil((new Date(`${draftDate}T${draftTime || '08:00'}:00`).getTime() - Date.now()) / 86_400_000)) } : {}),
      }, owner)
      setNow(Date.now())
      if (details.current) details.current.open = false
    }}>
      <label><span>{exam} <UiText text="Exam date" /></span><input aria-label={`${exam} ${c('Exam date')}`} required type="date" min={today()} value={draftDate} onChange={event => setDraftDate(event.target.value)} /></label>
      <label><span><UiText text="Time" /></span><input aria-label={`${exam} ${c('Time')}`} required type="time" value={draftTime} onChange={event => setDraftTime(event.target.value)} /></label>
      <button type="submit"><Check size={15} /><UiText text="Save" /></button>
      <button type="button" aria-label={c('Cancel')} onClick={() => { if (details.current) details.current.open = false }}><X size={15} /></button>
    </form>
  </details>
}

function ScoreRing({ value, maximum, exam }: { value: number | null; maximum: number; exam: string }) {
  const radius = 42
  const length = 2 * Math.PI * radius
  const formatted = value === null ? '—' : maximum === 9 ? value.toFixed(1) : value
  return <div className="dashboard-exam-ring" aria-label={`${exam} ${formatted} / ${maximum}`}>
    <svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r={radius} className="ring-track" /><circle cx="50" cy="50" r={radius} className="ring-value" strokeDasharray={length} strokeDashoffset={length * (1 - Math.min(1, Math.max(0, (value ?? 0) / maximum)))} /></svg>
    <span><strong>{formatted}</strong><small>/ {maximum}</small></span>
  </div>
}

export default function DashboardExamOverview({ owner, ielts, sat, ieltsTarget, satTarget }: {
  owner: string; ielts: number; sat: number; ieltsTarget?: number | null; satTarget?: number | null
}) {
  const navigate = useNavigate()
  const sessions = useSpeakingStore(state => state.sessions)
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    const refresh = () => setRevision(value => value + 1)
    const events = [ACCOUNT_DATA_EVENT, 'storage', 'focus', 'smarttest:attempt-submitted']
    events.forEach(event => window.addEventListener(event, refresh))
    return () => events.forEach(event => window.removeEventListener(event, refresh))
  }, [])
  const skills = useMemo(() => getIeltsHubScores(owner, sessions), [owner, sessions, revision])
  const satSections = useMemo(() => dashboardSatSections(), [owner, revision])
  const assessedBands = Object.values(skills).filter((value): value is number => value !== null)
  const ieltsOverall = assessedBands.length
    ? Math.round(assessedBands.reduce((sum, value) => sum + value, 0) / assessedBands.length * 2) / 2
    : ielts > 0 ? ielts : null
  const exams = [
    { label: 'IELTS' as const, value: ieltsOverall, target: ieltsTarget, max: 9, path: '/ielts/tests', rows: [
      { label: 'Listening', value: skills.listening, icon: Headphones }, { label: 'Reading', value: skills.reading, icon: BookOpenText },
      { label: 'Writing', value: skills.writing, icon: PenLine }, { label: 'Speaking', value: skills.speaking, icon: Mic2 },
    ] },
    { label: 'SAT' as const, value: satSections?.total ?? (sat > 0 ? sat : null), target: satTarget, max: 1600, path: '/sat/mocks', rows: [
      { label: 'Reading & Writing', value: satSections?.reading ?? null, icon: BookOpenText }, { label: 'Math', value: satSections?.math ?? null, icon: Calculator },
    ] },
  ]
  return <div className="dashboard-exam-overviews">
    {exams.map(exam => <article key={exam.label} className="dashboard-exam-overview">
      <header><h2><span className="dashboard-exam-emblem"><Target size={19} aria-hidden="true" /></span>{exam.label}</h2><button type="button" onClick={() => navigate(exam.path)}>{exam.label} <UiText text="tests" /><ArrowRight size={14} aria-hidden="true" /></button></header>
      <div className="dashboard-exam-body">
        <ScoreRing value={exam.value} maximum={exam.max} exam={exam.label} />
        <div className="dashboard-exam-details">
          <div className="dashboard-exam-current"><span><UiText text="Current" /> <strong>{exam.value === null ? '—' : exam.max === 9 ? exam.value.toFixed(1) : exam.value}</strong><small> / {exam.max}</small></span><span><UiText text="Target" /> <strong>{exam.target ?? '—'}</strong></span></div>
          <div className="dashboard-exam-skills">{exam.rows.map(({ label, value, icon: Icon }) => <button type="button" key={label} onClick={() => navigate(exam.label === 'IELTS' ? `/ielts/tests#${label.toLowerCase()}` : `/sat/${label === 'Math' ? 'math' : 'reading-writing'}`)}>
            <Icon size={15} aria-hidden="true" /><span><UiText text={label} /></span><strong>{value === null ? '—' : exam.max === 9 ? value.toFixed(1) : value}</strong><span className="dashboard-skill-track" aria-hidden="true"><i style={{ width: `${Math.max(0, Math.min(100, (value ?? 0) / (exam.max === 9 ? 9 : 800) * 100))}%` }} /></span>
          </button>)}</div>
        </div>
      </div>
      <ExamPlan key={`${owner}-${exam.label}`} exam={exam.label} owner={owner} revision={revision} />
    </article>)}
  </div>
}
