import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, RotateCcw, Sparkles, Target, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import TodayPlan from '@/components/study/TodayPlan'
import { studyPlanApi, syncExactStudyEvidence, type StudyAnswers, type StudyDay, type StudyPlanResponse } from '@/lib/studyPlan'
import { useAuthStore } from '@/store/authStore'
import './ExamStudyPlan.css'

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const dateLabel = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
const count = (days: StudyDay[]) => {
  const tasks = days.flatMap(day => day.tasks)
  return { done: tasks.filter(task => task.status === 'DONE').length, total: tasks.length, minutes: tasks.reduce((sum, task) => sum + task.minutes, 0), doneMinutes: tasks.filter(task => task.status === 'DONE').reduce((sum, task) => sum + task.minutes, 0) }
}

function Setup({ initial, onCancel, onSave, editing }: { initial: StudyAnswers; onCancel: () => void; onSave: (answers: StudyAnswers) => Promise<void>; editing: boolean }) {
  const [answers, setAnswers] = useState(initial)
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const hasIelts = answers.examTrack !== 'SAT'
  const hasSat = answers.examTrack !== 'IELTS'
  const set = <K extends keyof StudyAnswers>(key: K, value: StudyAnswers[K]) => setAnswers(current => ({ ...current, [key]: value }))
  const advance = async () => {
    setError('')
    if (step === 0) {
      if (hasIelts && answers.targetIeltsScore === null) return setError('Choose your IELTS target band.')
      if (hasSat && answers.targetSatScore === null) return setError('Choose your SAT target score.')
      return setStep(1)
    }
    if (!answers.weeklyAvailability.some(minutes => minutes >= 30)) return setError('Choose at least one day with 30 minutes or more.')
    setSaving(true)
    try { await onSave(answers) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save the plan.') }
    finally { setSaving(false) }
  }
  return <div className="exam-plan-page"><div className="exam-plan-heading"><div><span className="exam-plan-eyebrow"><Sparkles size={15} /> PERSONAL EXAM ROADMAP</span><h1>{editing ? 'Adjust your plan.' : 'Build your study plan.'}</h1><p>A realistic week shaped by your exam goals, available time, and completed work.</p></div></div>
    <section className="exam-plan-setup"><div className="exam-plan-setup-aside"><Target size={31} /><h2>One clear task at a time.</h2><p>Your next IELTS or SAT test will follow the work you have actually completed. Practice and analysis stay together.</p><div><strong>{answers.weeklyAvailability.reduce((sum, value) => sum + value, 0)} min</strong><span>available each week</span></div></div><div className="exam-plan-setup-main"><div className="exam-plan-steps"><span className={step === 0 ? 'active' : ''}>01 · Exams & targets</span><span className={step === 1 ? 'active' : ''}>02 · Your real schedule</span></div>
      {step === 0 ? <><h2>What are you preparing for?</h2><div className="exam-plan-choices">{(['IELTS', 'SAT', 'BOTH'] as const).map(track => <button type="button" key={track} className={answers.examTrack === track ? 'selected' : ''} aria-pressed={answers.examTrack === track} onClick={() => set('examTrack', track)}>{track === 'BOTH' ? 'IELTS + SAT' : track}</button>)}</div><div className="exam-plan-fields">{hasIelts && <><label>IELTS target band<select value={answers.targetIeltsScore ?? ''} onChange={event => set('targetIeltsScore', event.target.value ? Number(event.target.value) : null)}><option value="">Choose a target</option>{[4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9].map(score => <option key={score} value={score}>{score}</option>)}</select></label><label>IELTS exam date <small>optional</small><input type="date" value={answers.ieltsExamDate ?? ''} onChange={event => set('ieltsExamDate', event.target.value || null)} /></label><label>Current IELTS band <small>optional</small><select value={answers.currentIeltsScore ?? ''} onChange={event => set('currentIeltsScore', event.target.value ? Number(event.target.value) : null)}><option value="">Use my site results</option>{[4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9].map(score => <option key={score} value={score}>{score}</option>)}</select></label></>}{hasSat && <><label>SAT target score<input type="number" min="400" max="1600" step="10" placeholder="e.g. 1450" value={answers.targetSatScore ?? ''} onChange={event => set('targetSatScore', event.target.value ? Number(event.target.value) : null)} /></label><label>SAT exam date <small>optional</small><input type="date" value={answers.satExamDate ?? ''} onChange={event => set('satExamDate', event.target.value || null)} /></label><label>Current SAT score <small>optional</small><input type="number" min="400" max="1600" step="10" placeholder="Use my site results" value={answers.currentSatScore ?? ''} onChange={event => set('currentSatScore', event.target.value ? Number(event.target.value) : null)} /></label></>}</div></> : <><h2>When can you study?</h2><p className="exam-plan-helper">A full mock is scheduled only when your available time also covers its analysis. Shorter days receive shorter tasks.</p><div className="exam-plan-availability">{weekdays.map((day, index) => <label key={day}><span>{day}</span><select aria-label={`${day} available time`} value={answers.weeklyAvailability[index]} onChange={event => set('weeklyAvailability', answers.weeklyAvailability.map((value, item) => item === index ? Number(event.target.value) : value))}>{[0, 30, 45, 60, 90, 120, 150, 180, 210, 240, 300, 360].map(value => <option key={value} value={value}>{value ? `${value} min` : 'Rest day'}</option>)}</select></label>)}</div></>}
      {error && <p className="exam-plan-error" role="alert">{error}</p>}<div className="exam-plan-actions"><button type="button" onClick={() => step ? setStep(0) : onCancel()}>{step ? 'Previous' : 'Cancel'}</button><button type="button" className="primary" disabled={saving} onClick={() => void advance()}>{saving ? 'Creating…' : step ? editing ? 'Save changes' : 'Create my plan' : 'Continue'} <ArrowRight size={16} /></button></div></div></section></div>
}

function History({ data }: { data: StudyPlanResponse }) {
  const plan = data.plan!
  const today = data.today
  const elapsed = plan.currentWeek?.days.filter(day => day.date <= today) ?? []
  const weeks = [{ weekStart: plan.currentWeek?.weekStart ?? '', days: elapsed, legacy: false }, ...plan.history]
  return <section className="exam-plan-history"><div className="exam-plan-section-heading"><div><span className="exam-plan-eyebrow"><TrendingUp size={14} /> PROGRESS TRACKER</span><h2>How your days went</h2><p>Only elapsed days are shown. Unfinished work stays recorded on its original date.</p></div></div><div className="exam-plan-history-weeks">{weeks.filter(week => week.weekStart && !week.legacy).map(week => { const totals = count(week.days); return <article key={week.weekStart} className="exam-plan-history-week"><header><strong>Week of {dateLabel(week.weekStart)}</strong><span>{totals.done}/{totals.total} tasks · {totals.doneMinutes}/{totals.minutes} planned min completed</span></header><div className="exam-plan-history-days">{week.days.map(day => { const daily = count([day]); return <div className="exam-plan-history-day" key={day.date}><div><strong>{dateLabel(day.date)}</strong><span>{!daily.total ? 'Rest day' : `${daily.done}/${daily.total} tasks · ${daily.doneMinutes}/${daily.minutes} planned min`}</span></div>{daily.total > 0 && <div className="exam-plan-history-task-list">{day.tasks.map(task => <p key={task.id} className={task.status === 'DONE' ? 'done' : ''}>{task.status === 'DONE' ? <CheckCircle2 size={14} /> : <Clock3 size={14} />}{task.title}{typeof task.resultPercent === "number" ? ` · ${task.resultPercent}% accuracy` : ""}</p>)}</div>}</div> })}</div></article> })}</div></section>
}

export default function JourneyPlan() {
  const navigate = useNavigate()
  const userId = useAuthStore(state => state.user?.id)
  const [data, setData] = useState<StudyPlanResponse | null>(null)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true); setError('')
    try { try { await syncExactStudyEvidence(userId) } catch { /* Show the saved plan while offline evidence can be retried later. */ }; setData(await studyPlanApi.get()) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load the plan.') }
    finally { setLoading(false) }
  }, [userId])
  useEffect(() => { void load() }, [load])
  const initial = useMemo(() => data?.plan?.answers ?? data?.defaults ?? null, [data])
  const save = async (answers: StudyAnswers) => { setData(await studyPlanApi.save(answers)); setEditing(false) }
  if (loading && !data) return <div className="exam-plan-loading">Preparing your Study Plan…</div>
  if (!data) return <div className="exam-plan-loading"><p>{error}</p><button type="button" onClick={() => void load()}>Try again</button></div>
  if (editing || !data.plan) return <Setup initial={initial!} editing={Boolean(data.plan)} onCancel={() => data.plan ? setEditing(false) : navigate('/dashboard')} onSave={save} />
  const past = data.plan.currentWeek?.days.filter(day => day.date <= data.today) ?? []
  const totals = count(past)
  return <main className="exam-plan-page"><div className="exam-plan-heading"><div><span className="exam-plan-eyebrow"><Sparkles size={15} /> IELTS & SAT PREPARATION</span><h1>Your Study Plan<span>.</span></h1><p>Today’s exact actions. A weekly plan that learns from your results.</p></div><div className="exam-plan-heading-actions"><button type="button" onClick={() => void load()} aria-label="Refresh plan"><RotateCcw size={17} /></button><button type="button" onClick={() => setEditing(true)}>Adjust my plan</button></div></div>
    <section className="exam-plan-hero"><div><span>YOUR EXAM FOCUS</span><h2>{data.plan.answers.examTrack === 'BOTH' ? 'IELTS + SAT' : data.plan.answers.examTrack}</h2><p><CalendarDays size={16} /> This week is prepared. Tomorrow’s tasks unlock tomorrow.</p></div><div className="exam-plan-hero-stat"><strong>{totals.total ? Math.round(totals.done / totals.total * 100) : 0}%</strong><span>elapsed week complete</span></div></section>
    <TodayPlan initial={data} onChange={setData} />
    <div className="exam-plan-insights"><article><span>THIS WEEK SO FAR</span><strong>{totals.done} / {totals.total}</strong><p>planned tasks completed</p></article><article><span>COMPLETED PLAN TIME</span><strong>{totals.doneMinutes} min</strong><p>of {totals.minutes} planned minutes</p></article><article><span>CURRENT FOCUS</span><strong>{data.plan.currentWeek?.review.focusSkill?.replace(/_/g, ' ') ?? 'Building baseline'}</strong><p>chosen from recent results</p></article></div>
    <section className="exam-plan-reason"><h2>{data.plan.currentWeek?.review.headline}</h2>{data.plan.currentWeek?.review.reasons.map((reason, index) => <p key={index}><span>{String(index + 1).padStart(2, '0')}</span>{reason}</p>)}</section>
    <History data={data} />
  </main>
}
