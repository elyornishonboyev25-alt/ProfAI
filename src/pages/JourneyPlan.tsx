import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, BookOpenCheck, CalendarDays, Check, CheckCircle2,
  ChevronRight, Clock3, Compass, GraduationCap, Loader2, RotateCcw,
  ShieldCheck, Sparkles, Target, TrendingUp, WandSparkles,
} from 'lucide-react'
import { claimStoredGuestDiagnostic } from '@/lib/guestDiagnostic'
import { studyPlanApi, syncLocalStudyEvidence, type ProgressStatus, type StudyAnswers, type StudyDay, type StudyPlanResponse, type StudyTask } from '@/lib/studyPlan'
import { useAuthStore } from '@/store/authStore'
import './JourneyPlan.css'
import './JourneyPlanHistory.css'

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const STEPS = ['Destination', 'Exams', 'Your week', 'Application']
const MILESTONES: Array<{ key: keyof StudyAnswers['applicationProgress']; label: string; hint: string }> = [
  { key: 'shortlist', label: 'University shortlist', hint: 'Programs and requirements compared' },
  { key: 'transcripts', label: 'Academic documents', hint: 'Grades and transcripts ready' },
  { key: 'essay', label: 'Personal statement', hint: 'Draft or final version prepared' },
  { key: 'recommendations', label: 'Recommendations', hint: 'Recommenders contacted' },
  { key: 'activities', label: 'Activities and achievements', hint: 'Evidence collected' },
  { key: 'funding', label: 'Scholarship research', hint: 'Funding options checked' },
]
const STATUS_OPTIONS: Array<{ value: ProgressStatus; label: string }> = [
  { value: 'NOT_STARTED', label: 'Not started' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'DONE', label: 'Done' },
]

function todayISO() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}
function displayDate(value: string) {
  return new Date(`${value}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}
function blankAnswers(defaults: StudyPlanResponse['defaults']): StudyAnswers {
  return {
    universities: defaults.universities ?? [], destinationCountry: defaults.destinationCountry ?? '', intendedMajor: defaults.intendedMajor ?? '',
    intakeYear: Math.max(new Date().getFullYear(), defaults.intakeYear), applicationDeadline: null,
    examTrack: defaults.examTrack ?? 'UNSURE', ieltsExamDate: null, satExamDate: null,
    currentIeltsScore: defaults.currentIeltsScore ?? null, currentSatScore: defaults.currentSatScore ?? null,
    targetIeltsScore: defaults.targetIeltsScore ?? null, targetSatScore: defaults.targetSatScore ?? null,
    weeklyAvailability: [60, 60, 60, 60, 60, 90, 0].map((value) => value && defaults.dailyStudyHours > 1 ? Math.min(240, Math.round(defaults.dailyStudyHours * 60)) : value),
    applicationProgress: { shortlist: 'NOT_STARTED', transcripts: 'NOT_STARTED', essay: 'NOT_STARTED', recommendations: 'NOT_STARTED', activities: 'NOT_STARTED', funding: 'NOT_STARTED' },
    needsFunding: false,
  }
}
function countTasks(days: StudyDay[]) {
  const tasks = days.flatMap((day) => day.tasks)
  return { total: tasks.length, done: tasks.filter((task) => task.status === 'DONE').length, minutes: tasks.reduce((sum, task) => sum + task.minutes, 0) }
}

function Intro({ onStart }: { onStart: () => void }) {
  const reduceMotion = Boolean(useReducedMotion())
  return <div className="sp-page sp-intro-page">
    <motion.section className="sp-intro-hero" initial={reduceMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55 }}>
      <div className="sp-intro-glow" aria-hidden="true" />
      <div className="sp-intro-content">
        <span className="sp-eyebrow"><Sparkles size={14} /> YOUR UNIVERSITY JOURNEY</span>
        <h1>Build a plan for <em>where you want to go.</em></h1>
        <p>Turn your university goal, exam results and available time into a clear roadmap. Get a focused week today, then a better one as you make progress.</p>
        <button className="sp-primary sp-intro-cta" type="button" onClick={onStart}>Create your Study Plan <ArrowRight size={18} /></button>
        <span className="sp-intro-footnote"><ShieldCheck size={15} /> Private to your account · Adapted every week</span>
      </div>
      <div className="sp-hero-art" aria-hidden="true"><div className="sp-orbit sp-orbit-one" /><div className="sp-orbit sp-orbit-two" /><div className="sp-orbit-core"><GraduationCap size={46} strokeWidth={1.5} /></div><div className="sp-float-card sp-float-one"><span>01 / DIRECTION</span><strong>University goal</strong><small>Requirements & milestones</small></div><div className="sp-float-card sp-float-two"><span>02 / MOMENTUM</span><strong>Weekly focus</strong><small>Built around your time</small></div><div className="sp-float-card sp-float-three"><span>03 / GROWTH</span><strong>Measured progress</strong><small>Results shape the next week</small></div></div>
    </motion.section>
    <div className="sp-intro-features"><article><span className="sp-feature-icon"><Compass size={21} /></span><h2>One clear direction</h2><p>Connect test preparation, university research and application work in one place.</p></article><article><span className="sp-feature-icon"><CalendarDays size={21} /></span><h2>Tasks you can finish</h2><p>See exactly what to do each day, how long it should take and where to start.</p></article><article><span className="sp-feature-icon"><TrendingUp size={21} /></span><h2>Improves with you</h2><p>Completed work and measured results guide each new week.</p></article></div>
  </div>
}

function BaselineFields({ answers, ielts, sat, onChange }: {
  answers: StudyAnswers; ielts: boolean; sat: boolean; onChange: (key: 'currentIeltsScore' | 'currentSatScore', value: number | null) => void
}) {
  return <div className="sp-two-col sp-baseline-fields">
    {ielts && <label className="sp-field"><span>Current IELTS band <small>optional, if known</small></span><select value={answers.currentIeltsScore ?? ''} onChange={(event) => onChange('currentIeltsScore', event.target.value ? Number(event.target.value) : null)}><option value="">I have not taken a test yet</option>{[0, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9].map((score) => <option value={score} key={score}>{score}</option>)}</select></label>}
    {sat && <label className="sp-field"><span>Current SAT score <small>optional, if known</small></span><input type="number" min="400" max="1600" step="10" value={answers.currentSatScore ?? ''} onChange={(event) => onChange('currentSatScore', event.target.value ? Number(event.target.value) : null)} placeholder="I have not taken a test yet" /></label>}
  </div>
}

function Wizard({ initial, evidence, editing, onCancel, onSave }: { initial: StudyAnswers; evidence: StudyPlanResponse['evidence']; editing: boolean; onCancel: () => void; onSave: (answers: StudyAnswers) => Promise<void> }) {
  const [answers, setAnswers] = useState(initial)
  const [step, setStep] = useState(0)
  const [universityInput, setUniversityInput] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const hasIelts = answers.examTrack === 'IELTS' || answers.examTrack === 'BOTH'
  const hasSat = answers.examTrack === 'SAT' || answers.examTrack === 'BOTH'
  const needsIeltsBaseline = hasIelts && !evidence.some((item) => item.skill.startsWith('IELTS'))
  const needsSatBaseline = hasSat && !evidence.some((item) => item.skill.startsWith('SAT'))
  const weeklyMinutes = answers.weeklyAvailability.reduce((sum, minutes) => sum + minutes, 0)
  const setField = <K extends keyof StudyAnswers>(key: K, value: StudyAnswers[K]) => setAnswers((current) => ({ ...current, [key]: value }))
  const addUniversity = () => {
    const value = universityInput.trim()
    if (value && answers.universities.length < 5 && !answers.universities.some((item) => item.toLowerCase() === value.toLowerCase())) setField('universities', [...answers.universities, value])
    setUniversityInput('')
  }
  const advance = async () => {
    setError('')
    if (step === 0 && universityInput.trim()) addUniversity()
    if (step === 0 && !answers.universities.length && !universityInput.trim() && !answers.destinationCountry.trim()) return setError('Add a university or a destination country so the roadmap has a direction.')
    if (step === 1 && hasIelts && answers.targetIeltsScore === null) return setError('Choose your IELTS target score.')
    if (step === 1 && hasSat && answers.targetSatScore === null) return setError('Choose your SAT target score.')
    if (step === 1 && hasSat && answers.targetSatScore !== null && (answers.targetSatScore < 400 || answers.targetSatScore > 1600)) return setError('SAT target must be between 400 and 1600.')
    if (step === 1 && hasSat && answers.currentSatScore !== null && (answers.currentSatScore < 400 || answers.currentSatScore > 1600)) return setError('Current SAT score must be between 400 and 1600.')
    if (step === 1 && hasIelts && answers.currentIeltsScore !== null && answers.targetIeltsScore !== null && answers.currentIeltsScore > answers.targetIeltsScore) return setError('IELTS target must be at least your current score.')
    if (step === 1 && hasSat && answers.currentSatScore !== null && answers.targetSatScore !== null && answers.currentSatScore > answers.targetSatScore) return setError('SAT target must be at least your current score.')
    if (step === 2 && weeklyMinutes < 20) return setError('Choose at least one day with 20 minutes or more.')
    if (step < 3) return setStep((value) => value + 1)
    setSaving(true)
    try { await onSave(answers) } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save your plan. Please try again.') } finally { setSaving(false) }
  }
  return <div className="sp-page sp-wizard-page"><div className="sp-wizard-top"><button type="button" className="sp-text-button" onClick={onCancel}><ArrowLeft size={17} /> {editing ? 'Back to plan' : 'Back'}</button><span>STUDY PLAN SETUP</span></div><section className="sp-wizard-shell">
    <aside className="sp-wizard-aside"><span className="sp-eyebrow"><WandSparkles size={14} /> PERSONAL ROADMAP</span><h1>{editing ? 'Refine your direction.' : 'Let’s build your path.'}</h1><p>Only the details that shape your plan. Your saved exam results will be used automatically when available.</p><div className="sp-wizard-preview"><span>YOUR WEEK AT A GLANCE</span><strong>{Math.round(weeklyMinutes / 60 * 10) / 10} hours</strong><small>{answers.weeklyAvailability.filter(Boolean).length} study days · {answers.examTrack === 'UNSURE' ? 'Exam focus to decide' : answers.examTrack}</small></div><span className="sp-aside-footer"><ShieldCheck size={15} /> Your plan stays private to your account</span></aside>
    <div className="sp-wizard-main"><div className="sp-steps" aria-label="Setup progress">{STEPS.map((label, index) => <div key={label} className={`sp-step ${index === step ? 'active' : ''} ${index < step ? 'done' : ''}`}><span>{index < step ? <Check size={13} /> : `0${index + 1}`}</span><small>{label}</small></div>)}</div>
      {step === 0 && <div className="sp-form-section"><span className="sp-form-kicker">01 / DESTINATION</span><h2>What are you working toward?</h2><p>Pick a university if you know it. A country is enough to start if you are still exploring.</p><label className="sp-label">Target universities <small>up to five</small></label><div className="sp-input-row"><input value={universityInput} onChange={(event) => setUniversityInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addUniversity() } }} placeholder="e.g. University of Oxford" maxLength={100} /><button type="button" onClick={addUniversity} disabled={!universityInput.trim() || answers.universities.length >= 5}>Add</button></div><div className="sp-chip-row">{answers.universities.map((name) => <button className="sp-chip" type="button" key={name} onClick={() => setField('universities', answers.universities.filter((item) => item !== name))}>{name} <span aria-label={`Remove ${name}`}>×</span></button>)}</div><div className="sp-two-col"><label className="sp-field"><span>Destination country</span><input value={answers.destinationCountry} onChange={(event) => setField('destinationCountry', event.target.value)} placeholder="e.g. United Kingdom" maxLength={80} /></label><label className="sp-field"><span>Intended major <small>optional</small></span><input value={answers.intendedMajor} onChange={(event) => setField('intendedMajor', event.target.value)} placeholder="e.g. Computer Science" maxLength={100} /></label><label className="sp-field"><span>Intake year</span><select value={answers.intakeYear} onChange={(event) => setField('intakeYear', Number(event.target.value))}>{Array.from({ length: 8 }, (_, index) => new Date().getFullYear() + index).map((year) => <option key={year} value={year}>{year}</option>)}</select></label><label className="sp-field"><span>Application deadline <small>if known</small></span><input type="date" value={answers.applicationDeadline ?? ''} onChange={(event) => setField('applicationDeadline', event.target.value || null)} /></label></div><p className="sp-form-note">Check requirements and official deadlines on each university’s website.</p></div>}
      {step === 1 && <div className="sp-form-section"><span className="sp-form-kicker">02 / EXAMS</span><h2>Which tests are part of your path?</h2><p>Saved results help identify the skills that need the most work.</p><div className="sp-choice-grid">{([{ value: 'IELTS', label: 'IELTS', detail: 'English proficiency' }, { value: 'SAT', label: 'SAT', detail: 'University entrance' }, { value: 'BOTH', label: 'IELTS + SAT', detail: 'A combined schedule' }, { value: 'NONE', label: 'No exam', detail: 'Focus on applications' }, { value: 'UNSURE', label: 'Not sure yet', detail: 'Explore requirements first' }] as const).map((choice) => <button type="button" key={choice.value} className={`sp-choice ${answers.examTrack === choice.value ? 'selected' : ''}`} onClick={() => setField('examTrack', choice.value)} aria-pressed={answers.examTrack === choice.value}><span><BookOpenCheck size={20} /></span><strong>{choice.label}</strong><small>{choice.detail}</small></button>)}</div><div className="sp-two-col">{hasIelts && <><label className="sp-field"><span>IELTS target band</span><select value={answers.targetIeltsScore ?? ''} onChange={(event) => setField('targetIeltsScore', event.target.value ? Number(event.target.value) : null)}><option value="">Choose a target</option>{[4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9].map((score) => <option value={score} key={score}>{score}</option>)}</select></label><label className="sp-field"><span>IELTS exam date <small>if booked</small></span><input type="date" value={answers.ieltsExamDate ?? ''} onChange={(event) => setField('ieltsExamDate', event.target.value || null)} /></label></>}{hasSat && <><label className="sp-field"><span>SAT target score</span><input type="number" min="400" max="1600" step="10" value={answers.targetSatScore ?? ''} onChange={(event) => setField('targetSatScore', event.target.value ? Number(event.target.value) : null)} placeholder="e.g. 1450" /></label><label className="sp-field"><span>SAT exam date <small>if booked</small></span><input type="date" value={answers.satExamDate ?? ''} onChange={(event) => setField('satExamDate', event.target.value || null)} /></label></>}</div>{(hasIelts || hasSat) && <p className="sp-form-note">No result yet? The first week establishes a baseline; later weeks use measured progress.</p>}</div>}
      {step === 2 && <div className="sp-form-section"><span className="sp-form-kicker">03 / YOUR TIME</span><h2>Make the plan fit real life.</h2><p>Choose your available time. We will never schedule more than you set.</p><div className="sp-availability">{WEEKDAYS.map((day, index) => <label className={`sp-availability-row ${answers.weeklyAvailability[index] ? 'selected' : ''}`} key={day}><span className="sp-day-circle">{day.slice(0, 2)}</span><strong>{day}</strong><select aria-label={`Available minutes on ${day}`} value={answers.weeklyAvailability[index]} onChange={(event) => setField('weeklyAvailability', answers.weeklyAvailability.map((value, dayIndex) => dayIndex === index ? Number(event.target.value) : value))}>{[0, 30, 45, 60, 90, 120, 150, 180, 240, 300, 360].map((minutes) => <option key={minutes} value={minutes}>{minutes ? `${minutes} min` : 'Rest day'}</option>)}</select></label>)}</div></div>}
      {step === 3 && <div className="sp-form-section"><span className="sp-form-kicker">04 / APPLICATION</span><h2>What have you already done?</h2><p>Completed milestones will not return as new work.</p><label className="sp-funding-toggle"><input type="checkbox" checked={answers.needsFunding} onChange={(event) => setField('needsFunding', event.target.checked)} /><span><strong>I need scholarship or funding support</strong><small>Include funding research in my roadmap</small></span></label><div className="sp-progress-list">{MILESTONES.filter((item) => item.key !== 'funding' || answers.needsFunding).map((item) => <label className="sp-progress-row" key={item.key}><span><strong>{item.label}</strong><small>{item.hint}</small></span><select aria-label={`${item.label} status`} value={answers.applicationProgress[item.key]} onChange={(event) => setField('applicationProgress', { ...answers.applicationProgress, [item.key]: event.target.value as ProgressStatus })}>{STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>)}</div></div>}
      {step === 1 && (needsIeltsBaseline || needsSatBaseline) && <BaselineFields answers={answers} ielts={needsIeltsBaseline} sat={needsSatBaseline} onChange={setField} />}
      {error && <p className="sp-error" role="alert">{error}</p>}<div className="sp-wizard-actions"><button className="sp-secondary" type="button" onClick={() => step ? (setError(''), setStep(step - 1)) : onCancel()}>{step ? 'Previous' : 'Cancel'}</button><button className="sp-primary" type="button" disabled={saving} onClick={() => void advance()}>{saving ? <><Loader2 className="sp-spin" size={18} /> Building your plan</> : step === 3 ? <><WandSparkles size={18} /> {editing ? 'Update my plan' : 'Create my Study Plan'}</> : <>Continue <ArrowRight size={18} /></>}</button></div>
    </div></section></div>
}

function TaskCard({ task, onOpen, onComplete, busy }: { task: StudyTask; onOpen: (path: string) => void; onComplete: (task: StudyTask) => void; busy: boolean }) {
  return <article className={`sp-task ${task.status === 'DONE' ? 'completed' : ''}`}><div className={`sp-task-icon ${task.category.toLowerCase()}`}>{task.status === 'DONE' ? <Check size={19} /> : task.category === 'APPLICATION' ? <GraduationCap size={19} /> : <BookOpenCheck size={19} />}</div><div className="sp-task-body"><div className="sp-task-tags"><span>{task.category === 'APPLICATION' ? 'UNIVERSITY' : task.category}</span><span><Clock3 size={12} /> {task.minutes} min</span></div><h3>{task.title}</h3><p>{task.outcome}</p><small>{task.completionMode === 'ASSESSMENT' ? 'Completes after a matching test submitted on this day' : 'Mark complete when you finish this work'}</small></div><div className="sp-task-actions"><button className="sp-task-open" type="button" onClick={() => onOpen(task.route)}>Open workspace <ArrowRight size={14} /></button>{task.completionMode === 'MANUAL' && <button type="button" className={`sp-check ${task.status === 'DONE' ? 'checked' : ''}`} onClick={() => onComplete(task)} disabled={busy} aria-label={task.status === 'DONE' ? `Mark ${task.title} incomplete` : `Complete ${task.title}`} aria-pressed={task.status === 'DONE'}>{task.status === 'DONE' ? <Check size={17} /> : <span />}</button>}</div></article>
}

function StudyHistory({ data }: { data: StudyPlanResponse }) {
  const lastWeek = data.plan?.history[0]
  if (!lastWeek) return null
  const tasks = lastWeek.days.flatMap((day) => day.tasks)
  const completed = tasks.filter((task) => task.status === 'DONE')
  const unfinished = tasks.filter((task) => task.status !== 'DONE')
  return <section className="sp-panel sp-history-panel"><div className="sp-panel-heading"><div><span className="sp-section-kicker">PREVIOUS SAVED WEEK</span><h2>What moved forward</h2><p>Week of {displayDate(lastWeek.weekStart)} · {completed.length} of {tasks.length} tasks completed</p></div><TrendingUp size={24} /></div><div className="sp-history-columns"><div><h3><CheckCircle2 size={16} /> Completed</h3>{completed.length ? completed.slice(0, 5).map((task) => <p key={task.id}>{task.title}</p>) : <p>No tasks completed in this saved week.</p>}</div><div><h3><Clock3 size={16} /> Unfinished</h3>{unfinished.length ? unfinished.slice(0, 5).map((task) => <p key={task.id}>{task.title}</p>) : <p>Every planned task was completed.</p>}</div></div></section>
}

function MilestoneTracker({ data, onChange, busy }: { data: StudyPlanResponse; onChange: (key: keyof StudyAnswers['applicationProgress'], status: ProgressStatus) => void; busy: string | null }) {
  const plan = data.plan!
  const items = plan.roadmap.filter((item) => item.key in plan.answers.applicationProgress)
  return <section className="sp-panel sp-milestone-tracker"><div className="sp-panel-heading"><div><span className="sp-section-kicker">KEEP YOUR ROADMAP HONEST</span><h2>Milestone status</h2><p>A finished daily task can move a milestone forward. Mark the full milestone done only when it is ready.</p></div><CheckCircle2 size={24} /></div><div className="sp-milestone-controls">{items.map((item) => { const key = item.key as keyof StudyAnswers['applicationProgress']; return <label key={key}><span>{item.title}</span><select aria-label={`${item.title} progress`} value={plan.answers.applicationProgress[key]} disabled={busy !== null} onChange={(event) => onChange(key, event.target.value as ProgressStatus)}>{STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label> })}</div></section>
}

function PlanDashboard({ data, selectedDate, setSelectedDate, onEdit, onRefresh, onComplete, onMilestone, busyTask, busyMilestone, error }: {
  data: StudyPlanResponse; selectedDate: string; setSelectedDate: (date: string) => void; onEdit: () => void; onRefresh: () => void; onComplete: (task: StudyTask) => void; onMilestone: (key: keyof StudyAnswers['applicationProgress'], status: ProgressStatus) => void; busyTask: string | null; busyMilestone: string | null; error: string
}) {
  const navigate = useNavigate()
  const plan = data.plan!
  const week = plan.currentWeek
  const days = week?.days ?? []
  const selected = days.find((day) => day.date === selectedDate) ?? days.find((day) => day.tasks.length) ?? days[0]
  const totals = countTasks(days)
  const percentage = totals.total ? Math.round(totals.done / totals.total * 100) : 0
  const roadmapDone = plan.roadmap.filter((item) => item.status === 'DONE').length
  const destination = plan.answers.universities.length ? plan.answers.universities.slice(0, 2).join(' · ') : plan.answers.destinationCountry || 'Your university destination'
  const weeklyHours = Math.round(plan.answers.weeklyAvailability.reduce((sum, value) => sum + value, 0) / 60 * 10) / 10
  return <div className="sp-page sp-dashboard"><div className="sp-dashboard-heading"><div><span className="sp-page-kicker">YOUR PERSONAL ROADMAP</span><h1>Study Plan<span className="sp-title-dot">.</span></h1><p>One destination. A clear next step, every day.</p></div><div className="sp-heading-actions"><button type="button" className="sp-icon-button" onClick={onRefresh} aria-label="Refresh progress" title="Refresh progress"><RotateCcw size={17} /></button><button type="button" className="sp-secondary" onClick={onEdit}>Adjust my plan</button></div></div>
    <section className="sp-plan-hero"><div className="sp-plan-hero-content"><span className="sp-eyebrow"><Target size={14} /> THE BIG PICTURE</span><h2>{destination}</h2><p>{plan.answers.intendedMajor || 'Explore your course direction'} <span>·</span> {plan.answers.intakeYear} intake</p><div className="sp-hero-pills"><span><BookOpenCheck size={14} /> {plan.answers.examTrack === 'NONE' ? 'Application focus' : plan.answers.examTrack === 'UNSURE' ? 'Exploring exam requirements' : plan.answers.examTrack}</span><span><Clock3 size={14} /> {weeklyHours}h available / week</span>{plan.answers.applicationDeadline && <span><CalendarDays size={14} /> Entered deadline: {displayDate(plan.answers.applicationDeadline)}</span>}</div></div><div className="sp-progress-orb" style={{ '--sp-progress': `${percentage}%` } as React.CSSProperties}><div><strong>{percentage}%</strong><span>THIS WEEK</span></div></div></section>
    <div className="sp-metrics"><article><span>THIS WEEK</span><strong>{totals.done}<small> / {totals.total}</small></strong><p>tasks completed</p></article><article><span>PLANNED PRACTICE</span><strong>{Math.round(totals.minutes / 60 * 10) / 10}<small> h</small></strong><p>across your available days</p></article><article><span>ROADMAP</span><strong>{roadmapDone}<small> / {plan.roadmap.length}</small></strong><p>milestones ready</p></article></div>
    {error && <p className="sp-error" role="alert">{error}</p>}
    <div className="sp-dashboard-grid"><div className="sp-main-column"><section className="sp-panel sp-week-panel"><div className="sp-panel-heading"><div><span className="sp-section-kicker">YOUR SEVEN DAYS</span><h2>This week’s focus</h2><p>{week ? `Week of ${displayDate(week.weekStart)}` : 'Building your first week'}</p></div><span className="sp-live-label"><span /> ADAPTIVE PLAN</span></div><div className="sp-day-tabs" role="tablist" aria-label="Choose a study day">{days.map((day) => { const daily = countTasks([day]); const active = selected?.date === day.date; return <button key={day.date} id={`sp-tab-${day.date}`} role="tab" aria-selected={active} aria-controls="sp-day-tasks" className={`sp-day-tab ${active ? 'active' : ''} ${day.date === todayISO() ? 'today' : ''}`} onClick={() => setSelectedDate(day.date)}><strong>{new Date(`${day.date}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })}</strong><span>{day.date.slice(-2)}</span><small>{daily.total ? `${daily.done}/${daily.total} done` : 'Rest'}</small></button> })}</div><div className="sp-day-content" id="sp-day-tasks" role="tabpanel" aria-labelledby={selected ? `sp-tab-${selected.date}` : undefined}><div className="sp-day-header"><div><span className="sp-section-kicker">{selected?.date === todayISO() ? 'TODAY’S ACTIONS' : 'YOUR ACTIONS'}</span><h3>{selected ? new Date(`${selected.date}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' }) : 'Study day'}</h3></div><span>{selected?.tasks.reduce((sum, task) => sum + task.minutes, 0) ?? 0} min planned</span></div>{selected?.tasks.length ? <div className="sp-task-list">{selected.tasks.map((task) => <TaskCard key={task.id} task={task} onOpen={navigate} onComplete={onComplete} busy={busyTask === task.id} />)}</div> : <div className="sp-rest-day"><Sparkles size={23} /><strong>A clear day to recharge.</strong><p>Your schedule keeps this day open. Adjust availability whenever life changes.</p></div>}</div></section><section className="sp-panel sp-roadmap-panel"><div className="sp-panel-heading"><div><span className="sp-section-kicker">FROM GOAL TO APPLICATION</span><h2>Your university roadmap</h2><p>Planning milestones, with official requirements to verify.</p></div><GraduationCap size={25} /></div><div className="sp-roadmap-list">{plan.roadmap.map((item, index) => <article className={`sp-roadmap-item ${item.status.toLowerCase()}`} key={item.key}><div className="sp-roadmap-marker">{item.status === 'DONE' ? <Check size={16} /> : String(index + 1).padStart(2, '0')}</div><div><span>{item.timing}</span><h3>{item.title}</h3><p>{item.detail}</p></div><button type="button" onClick={() => navigate(item.route)} aria-label={`Open ${item.title}`}><ChevronRight size={18} /></button></article>)}</div></section></div><aside className="sp-side-column"><section className="sp-panel sp-review-panel"><span className="sp-section-kicker">WHY THIS WEEK LOOKS DIFFERENT</span><h2>{week?.review.headline ?? 'A plan shaped around you'}</h2><div className="sp-review-reasons">{week?.review.reasons.map((reason, index) => <p key={index}><span>{String(index + 1).padStart(2, '0')}</span>{reason}</p>)}</div>{week?.review.total ? <div className="sp-review-footer"><CheckCircle2 size={17} /> Last week: {week.review.completed} of {week.review.total} tasks finished</div> : null}</section><section className="sp-panel sp-evidence-panel"><span className="sp-section-kicker">MEASURED PERFORMANCE</span><h2>Your skill signals</h2>{data.evidence.length ? <div className="sp-skill-list">{data.evidence.map((item) => <div className="sp-skill-row" key={item.skill}><div><strong>{item.skill.replace(/_/g, ' ')}</strong><span>{item.attempts} recent result{item.attempts === 1 ? '' : 's'}</span></div><b>{item.accuracy}%</b><div className="sp-skill-bar"><span style={{ width: `${item.accuracy}%` }} /></div></div>)}</div> : <div className="sp-evidence-empty"><BookOpenCheck size={25} /><strong>No measured skill results yet</strong><p>Finish a practice test to give next week a more precise focus.</p></div>}</section><section className="sp-trust-note"><ShieldCheck size={19} /><p>Application dates come from your answers. Check each university’s official admissions page before relying on a deadline.</p></section></aside></div>
    <MilestoneTracker data={data} onChange={onMilestone} busy={busyMilestone} />
    <StudyHistory data={data} />
  </div>
}

export default function JourneyPlan() {
  const userId = useAuthStore((state) => state.user?.id)
  const syncRef = useRef<Promise<void> | null>(null)
  const [data, setData] = useState<StudyPlanResponse | null>(null)
  const [view, setView] = useState<'intro' | 'wizard' | 'plan'>('intro')
  const [selectedDate, setSelectedDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyTask, setBusyTask] = useState<string | null>(null)
  const [busyMilestone, setBusyMilestone] = useState<string | null>(null)
  const applyData = useCallback((response: StudyPlanResponse) => {
    setData(response)
    setView(response.plan ? 'plan' : 'intro')
    const days = response.plan?.currentWeek?.days ?? []
    setSelectedDate((current) => days.some((day) => day.date === current) ? current : days.find((day) => day.date >= response.today && day.tasks.length)?.date ?? days.find((day) => day.tasks.length)?.date ?? days[0]?.date ?? '')
  }, [])
  const load = useCallback(async () => {
    setError('')
    try {
      await claimStoredGuestDiagnostic()
      applyData(await studyPlanApi.get())
      if (userId) {
        syncRef.current = syncLocalStudyEvidence(userId).then(async () => {
          const refreshed = await studyPlanApi.get()
          setData((current) => current ? { ...current, evidence: refreshed.evidence, plan: refreshed.plan ?? current.plan } : refreshed)
        }).catch(() => undefined)
      }
    }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load your Study Plan.') }
    finally { setLoading(false) }
  }, [applyData, userId])
  useEffect(() => { void load() }, [load])
  const initial = useMemo(() => data?.plan?.answers ?? (data ? blankAnswers(data.defaults) : null), [data])
  const save = async (answers: StudyAnswers) => { await syncRef.current; applyData(await studyPlanApi.save(answers)) }
  const complete = async (task: StudyTask) => {
    setBusyTask(task.id); setError('')
    try { applyData(await studyPlanApi.complete(task.id, task.status !== 'DONE')) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not update this task.') }
    finally { setBusyTask(null) }
  }
  const changeMilestone = async (key: keyof StudyAnswers['applicationProgress'], status: ProgressStatus) => {
    setBusyMilestone(key); setError('')
    try { applyData(await studyPlanApi.milestone(key, status)) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not update this milestone.') }
    finally { setBusyMilestone(null) }
  }
  if (loading) return <div className="sp-loading"><Loader2 className="sp-spin" size={27} /><strong>Preparing your Study Plan</strong></div>
  if (!data) return <div className="sp-page"><div className="sp-load-error"><Compass size={31} /><h1>We couldn’t open your plan</h1><p>{error}</p><button type="button" className="sp-primary" onClick={() => { setLoading(true); void load() }}>Try again <ArrowRight size={17} /></button></div></div>
  if (view === 'wizard' && initial) return <Wizard initial={initial} evidence={data.evidence} editing={Boolean(data.plan)} onCancel={() => setView(data.plan ? 'plan' : 'intro')} onSave={save} />
  if (!data.plan) return <Intro onStart={() => setView('wizard')} />
  return <PlanDashboard data={data} selectedDate={selectedDate} setSelectedDate={setSelectedDate} onEdit={() => setView('wizard')} onRefresh={() => void load()} onComplete={(task) => void complete(task)} onMilestone={(key, status) => void changeMilestone(key, status)} busyTask={busyTask} busyMilestone={busyMilestone} error={error} />
}
