import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowRight, BookOpenCheck, Check, Circle, Clock3, RefreshCw, Route, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { studyPlanApi, syncExactStudyEvidence, type StudyPlanResponse, type StudyTask } from '@/lib/studyPlan'
import { useAuthStore } from '@/store/authStore'
import './TodayPlan.css'

type Props = { initial?: StudyPlanResponse | null; onChange?: (value: StudyPlanResponse) => void; compact?: boolean }

export default function TodayPlan({ initial, onChange, compact = false }: Props) {
  const navigate = useNavigate()
  const userId = useAuthStore(state => state.user?.id)
  const [data, setData] = useState<StudyPlanResponse | null>(initial ?? null)
  const [busy, setBusy] = useState<string | null>(null)
  const [loading, setLoading] = useState(!initial)
  const [error, setError] = useState('')
  const update = useCallback((value: StudyPlanResponse) => { setData(value); onChange?.(value) }, [onChange])
  const refresh = useCallback(async () => {
    if (!userId) return
    setLoading(true); setError('')
    try {
      try { await syncExactStudyEvidence(userId) } catch { /* The saved plan remains available if an attempt cannot sync now. */ }
      update(await studyPlanApi.get())
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load your plan.') }
    finally { setLoading(false) }
  }, [update, userId])
  useEffect(() => { if (initial) setData(initial) }, [initial])
  useEffect(() => { if (!initial && userId) void refresh() }, [initial, userId, refresh])
  const today = useMemo(() => data?.plan?.currentWeek?.days.find(day => day.date === data.today), [data])
  const tasks = today?.tasks ?? []
  const done = tasks.filter(task => task.status === 'DONE').length
  const minutes = tasks.reduce((sum, task) => sum + task.minutes, 0)
  const mark = async (task: StudyTask) => {
    setBusy(task.id); setError('')
    try { update(await studyPlanApi.complete(task.id, task.status !== 'DONE')) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save this task.') }
    finally { setBusy(null) }
  }
  if (!userId) return null
  return <section className={`today-plan ${compact ? 'today-plan-compact' : ''}`} aria-label="Today’s study plan">
    <header className="today-plan-header"><div><span className="today-plan-kicker"><Sparkles size={14} /> YOUR DAILY STUDY PLAN</span><h2>Today’s focus<span>.</span></h2><p>{data?.today ? new Date(`${data.today}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' }) : 'Your exam preparation, one clear day at a time'}</p></div><div className="today-plan-header-actions"><button type="button" onClick={() => void refresh()} title="Refresh plan" aria-label="Refresh plan" disabled={loading}><RefreshCw size={17} /></button><button type="button" onClick={() => navigate('/journey-plan')} className="today-plan-details">Study Plan <ArrowRight size={16} /></button></div></header>
    {loading && !data ? <p className="today-plan-state">Loading your plan…</p> : !data?.plan ? <div className="today-plan-empty"><Route size={25} /><div><strong>Build your IELTS or SAT plan</strong><p>Set your goal and available time. Your first week will be ready immediately.</p></div><button type="button" onClick={() => navigate('/journey-plan')}>Create plan <ArrowRight size={16} /></button></div> : <>
      <div className="today-plan-summary"><span><Check size={15} /> {done} of {tasks.length} finished</span><span><Clock3 size={15} /> {minutes} min planned</span><span>{data.plan.answers.examTrack === 'BOTH' ? 'IELTS + SAT' : data.plan.answers.examTrack}</span></div>
      <div className="today-plan-progress"><span style={{ width: `${tasks.length ? done / tasks.length * 100 : 0}%` }} /></div>
      {tasks.length ? <div className="today-plan-list">{tasks.map(task => {
        const reviewLocked = Boolean(task.reviewOf && tasks.some(practice => practice.contentKey === task.reviewOf && practice.status !== 'DONE'))
        return <article className={`today-plan-task ${task.status === 'DONE' ? 'is-done' : ''}`} key={task.id}>
          <div className="today-plan-task-status">{task.status === 'DONE' ? <Check size={17} /> : <Circle size={17} />}</div>
          <div className="today-plan-task-main"><div className="today-plan-task-meta"><span className={task.category.toLowerCase()}>{task.category}</span><span>{task.kind === 'REVIEW' ? 'ANALYZE' : task.kind === 'ENRICHMENT' ? 'STUDY TOOL' : 'PRACTICE'}</span><span>{task.minutes} min</span>{typeof task.resultPercent === 'number' && <span>{task.resultPercent}% accuracy</span>}</div><h3>{task.title}</h3><p>{task.outcome}</p><small>{task.completionMode === 'ASSESSMENT' ? 'Automatically completed when you submit this exact practice' : reviewLocked ? 'Finish the matching practice first' : 'Mark done after finishing'}</small></div>
          <div className="today-plan-task-actions"><button type="button" className="today-plan-open" onClick={() => navigate(task.route)}>Open <ArrowRight size={15} /></button>{task.completionMode === 'MANUAL' && <button type="button" className={`today-plan-check ${task.status === 'DONE' ? 'checked' : ''}`} aria-label={`${task.status === 'DONE' ? 'Undo' : 'Complete'} ${task.title}`} aria-pressed={task.status === 'DONE'} disabled={busy === task.id || reviewLocked} onClick={() => void mark(task)}>{task.status === 'DONE' ? <Check size={17} /> : <span />}</button>}</div>
        </article>
      })}</div> : <div className="today-plan-rest"><BookOpenCheck size={23} /><strong>Rest day</strong><p>Your next study day is already prepared and will appear on its date.</p></div>}
    </>}
    {error && <p className="today-plan-error" role="alert">{error}</p>}
  </section>
}
