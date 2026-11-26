import { useCopy } from '@/i18n/interface'
import UiText from '@/components/common/UiText'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, BrainCircuit, CalendarClock, CheckCircle2, ChevronDown, RefreshCw } from 'lucide-react'
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAsyncData } from '@/hooks/useAsyncData'
import { learningCenterApi } from './api'
import { assignmentDestination, startAssignment } from './assignmentNavigation'
import { Avatar, CenterPanel, CenterSkeleton, ErrorState, inputClass, secondaryButton, StatusBadge } from './components'
import type { CenterStudent, LearningResult, PerformanceInsight } from './types'
import { isMeasured, isPractice, ResultDate, ResultScore, seriesKey, skillLabel } from './resultPresentation'
import TeacherNotesPanel from './TeacherNotesPanel'
import StudentResults from './StudentResults'

export default function StudentDetailView({ slug, studentId, canManage }: { slug: string; studentId: string; canManage: boolean }) {
  const { c: uiCopy } = useCopy()
  const navigate = useNavigate()
  const location = useLocation()
  const { data, loading, error, refetch } = useAsyncData(() => learningCenterApi.student(slug, studentId), [slug, studentId])
  const [insight, setInsight] = useState<PerformanceInsight | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisNote, setAnalysisNote] = useState('Based on recorded results')
  const [actionError, setActionError] = useState('')
  const [opening, setOpening] = useState(false)
  const [showInsights, setShowInsights] = useState(false)
  const currentStudent = useRef('')
  currentStudent.current = `${slug}:${studentId}`
  useEffect(() => { setInsight(null); setAnalysisNote('Based on recorded results'); setActionError(''); setAnalyzing(false); setShowInsights(false) }, [slug, studentId])

  if (loading && !data) return <CenterSkeleton blocks={8} />
  if (error) return <ErrorState message={error} onRetry={() => void refetch()} />
  if (!data) return null

  const student = data.student
  const activeInsight = insight ?? data.insight
  function insightCopy(text: string) {
    const focus = text.match(/^Focus the next 7 days on (.+)$/)
    if (focus) return uiCopy('Focus the next 7 days on {{skill}}', { skill: focus[1] })
    const growth = text.match(/^Growth is ([+-]?[\d.]+) percentage points across comparable sections\./)
    if (growth) return uiCopy('Growth is {{growth}} percentage points across comparable sections. IELTS and SAT scores are kept on their own scales; unverified scores are excluded.', { growth: growth[1] })
    return uiCopy(text)
  }

  async function analyze() {
    if (analyzing || !canManage) return
    const key = `${slug}:${studentId}`
    setAnalyzing(true); setActionError('')
    try {
      const response = await learningCenterApi.analyzeStudent(slug, studentId)
      if (currentStudent.current !== key) return
      setInsight(response.insight)
      setAnalysisNote(response.engine === 'data-analysis' ? 'Based on recorded results' : 'AI analysis of recorded results')
    }
    catch (failure) { if (currentStudent.current === key) setActionError(failure instanceof Error ? failure.message : 'Could not refresh analysis. Please try again.') }
    finally { if (currentStudent.current === key) setAnalyzing(false) }
  }

  async function openAssignment(item: StudentDetailAssignments[number]) {
    if (opening) return
    setOpening(true); setActionError('')
    try {
      // Staff preview the material without changing a learner's submission.
      navigate(canManage ? assignmentDestination(item.routePath) : await startAssignment(slug, item))
    } catch (failure) { setActionError(failure instanceof Error ? failure.message : 'Could not open assignment.') }
    finally { setOpening(false) }
  }

  return (
    <div className="lc-student-detail space-y-6">
      {actionError && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{actionError}</p>}
      <button type="button" onClick={() => navigate(typeof location.state?.from === 'string' && location.state.from.startsWith(`/learning-center/${slug}/students?`) ? location.state.from : `/learning-center/${slug}/students`)} className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 transition hover:text-red-700"><ArrowLeft className="h-4 w-4" /> <UiText text={"Back to students"} /></button>

      <CenterPanel className="overflow-hidden">
        <div className="lc-student-hero relative px-5 py-7 text-slate-950 sm:px-7">
          <div className="pointer-events-none absolute -right-12 -top-24 h-72 w-72 rounded-full border border-white/10 bg-red-300/10" />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-4"><Avatar name={student.fullName} url={student.avatarUrl} size="lg" /><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="break-words text-2xl font-bold tracking-[-.04em] sm:text-3xl">{student.fullName}</h2><StatusBadge status={student.status} /></div><p className="mt-1 text-sm font-semibold text-slate-600">{data.groups.map((group) => group.name).join(' · ') || <UiText text={"Not assigned to a group"} />} · <UiText text={student.targetExam === 'UNSET' ? 'Exam not set' : student.targetExam} /> <UiText text={"track"} /></p>{student.nickname && <p className="mt-1 text-xs text-slate-500">@{student.nickname}</p>}{student.email && <p className="mt-1 break-all text-xs text-slate-500">{student.email}</p>}</div></div>
            <div className="shrink-0 text-xs text-slate-500"><p className="font-semibold"><UiText text="{{count}} saved attempts" values={{ count: student.attempts }} /></p>{data.results[0] && <p className="mt-2"><ResultDate date={data.results[0].completedAt} /></p>}</div>
          </div>
        </div>
      </CenterPanel>

      <div className="lc-exam-summary">
        {(student.targetExam !== 'SAT' || student.currentIelts !== null || data.results.some(result => result.examType === 'IELTS')) && <ExamSummary student={student} exam="IELTS" />}
        {(student.targetExam !== 'IELTS' || student.currentSat !== null || data.results.some(result => result.examType === 'SAT')) && <ExamSummary student={student} exam="SAT" />}
      </div>
      <div className={`grid items-start gap-5 ${canManage ? 'xl:grid-cols-[minmax(0,1.5fr)_minmax(18rem,.85fr)]' : ''}`}>
        <StudentResults results={data.results} />
        {canManage && <TeacherNotesPanel key={`${slug}:${studentId}`} slug={slug} studentId={studentId} notes={data.notes} onSent={refetch} />}
      </div>
      {data.assignments.length > 0 && <Assignments assignments={data.assignments} opening={opening} canManage={canManage} onOpen={(item) => void openAssignment(item)} />}
      <div className="lc-optional-insights">
        <button type="button" aria-expanded={showInsights} aria-controls="lc-student-insights" onClick={() => setShowInsights(!showInsights)} className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/60 px-5 py-4 text-left text-sm font-bold text-slate-700"><UiText text="Progress and teacher insights" /><ChevronDown className={`h-4 w-4 transition ${showInsights ? 'rotate-180' : ''}`} /></button>
        {showInsights && <div id="lc-student-insights" className="mt-4 grid items-start gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(18rem,.8fr)]">
          <ProgressChart results={data.results} />
        <CenterPanel className={`p-5 sm:p-6 ${activeInsight.tone === 'warning' ? 'ring-1 ring-red-100' : ''}`}>
          <div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-red-800 to-red-500 text-white shadow-lg shadow-red-500/20"><BrainCircuit className="h-5 w-5" /></span>{canManage && <button type="button" disabled={analyzing} onClick={() => void analyze()} className="inline-flex items-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-red-700 hover:bg-red-100 disabled:opacity-60"><RefreshCw className={`h-3.5 w-3.5 ${analyzing ? 'animate-spin' : ''}`} />{analyzing ? <UiText text={"Analyzing"} /> : <UiText text={"Refresh AI"} />}</button>}</div>
          <p className="mt-5 text-[10px] font-bold uppercase tracking-[.2em] text-red-700"><UiText text={"Ivygoo performance analysis"} /></p>
          <h2 className="mt-1 text-xl font-bold tracking-[-.03em] text-slate-950">{insightCopy(activeInsight.headline)}</h2>
          <p aria-live="polite" className="mt-2 text-xs font-semibold text-slate-500">{uiCopy(analysisNote)}</p>
          <p className="mt-3 text-sm font-medium leading-6 text-slate-600">{insightCopy(activeInsight.summary)}</p>
          <div className="mt-5 space-y-2">{activeInsight.priorities.map((priority, index) => <div key={priority} className="flex gap-3 rounded-xl bg-slate-50 px-3.5 py-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-red-700 text-[10px] font-bold text-white">{index + 1}</span><p className="text-xs font-bold leading-5 text-slate-700">{insightCopy(priority)}</p></div>)}</div>
        </CenterPanel>
        </div>}
      </div>
    </div>
  )
}

function ExamSummary({ student, exam }: { student: CenterStudent; exam: 'IELTS' | 'SAT' }) {
  const ielts = exam === 'IELTS'
  const current = ielts ? student.currentIelts : student.currentSat
  const highest = ielts ? student.highestIelts : student.highestSat
  const target = ielts ? student.targetIelts : student.targetSat
  const source = ielts ? student.currentIeltsSource : student.currentSatSource
  const bestSource = ielts ? student.highestIeltsSource : student.highestSatSource
  const score = (value: number | null) => value === null ? '—' : ielts ? value.toFixed(1) : String(value)
  return <CenterPanel className="p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><p className="text-xs font-bold uppercase tracking-widest text-red-700">{exam}</p><span className="text-xs font-semibold text-slate-500">/ {ielts ? 9 : 1600}</span></div><p className="mt-3 text-4xl font-bold tracking-tight text-slate-950">{score(current)}</p><p className="mt-2 text-xs font-semibold text-slate-500"><UiText text={source === 'PROFILE' ? 'Profile score' : source === 'COMBINED_SECTIONS' ? 'Combined sections' : source === 'FOUR_SKILLS' ? 'Four-skill estimate' : current === null ? 'Overall not available' : 'Full test'} /></p>{ielts && current === null && <p className="mt-2 text-xs leading-5 text-slate-500"><UiText text="{{count}} of 4 skills recorded" values={{ count: student.ieltsSkillCount ?? 0 }} /></p>}<dl className="lc-score-details"><div><dt><UiText text="Highest result" /></dt><dd>{score(highest)}{bestSource && <p className="mt-1 text-[10px] text-slate-500"><UiText text={bestSource === 'PROFILE' ? 'Profile score' : bestSource === 'COMBINED_SECTIONS' ? 'Combined sections' : bestSource === 'FOUR_SKILLS' ? 'Four-skill estimate' : 'Full test'} /></p>}</dd></div><div><dt><UiText text="Target" /></dt><dd>{score(target)}</dd></div><div><dt><UiText text="Gap to target" /></dt><dd>{current === null || target === null ? '—' : score(Math.max(0, target - current))}</dd></div></dl></CenterPanel>
}

function ProgressChart({ results }: { results: LearningResult[] }) {
  const { c } = useCopy()
  const [selection, setSelection] = useState('')
  const measured = useMemo(() => results.filter(isMeasured), [results])
  const keys = [...new Set(measured.map(seriesKey))]
  const selected = keys.includes(selection) ? selection : keys.find(key => measured.find(result => seriesKey(result) === key)?.maxScore !== 100) ?? keys[0]
  const allPoints = measured.filter(result => seriesKey(result) === selected).slice().sort((a, b) => Date.parse(a.completedAt) - Date.parse(b.completedAt))
  const plot = (result: LearningResult) => {
    const counts = isPractice(result) && typeof result.correctAnswers === 'number' && typeof result.totalQuestions === 'number' && result.totalQuestions > 0
    return { score: counts ? result.correctAnswers! : result.score, max: counts ? result.totalQuestions! : result.maxScore,
      unit: counts ? c('Correct answers') : result.maxScore === 100 ? c('Practice accuracy') : result.maxScore === 9 ? c('IELTS band') : c('SAT points') }
  }
  const points = allPoints.slice(-60).map(result => ({ ...result, chartScore: plot(result).score, timestamp: Date.parse(result.completedAt) }))
  const first = points[0]
  const max = first ? plot(first).max : 9
  const min = first?.examType === 'SAT' && !isPractice(first) ? max === 1600 ? 400 : 200 : 0
  return <CenterPanel className="p-5 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-bold text-slate-950"><UiText text="Performance trajectory" /></h2>{keys.length > 0 && <select aria-label={c('Filter progress by skill')} value={selected} onChange={event => setSelection(event.target.value)} className={`${inputClass} lc-chart-filter min-w-0`}>{keys.map(key => {
      const result = measured.find(item => seriesKey(item) === key)!
      const part = result.parts?.length === 1 ? ` · ${result.skill === 'IELTS_READING' ? c('Passage') : c('Part')} ${result.parts[0].partNumber}` : ''
      const scale = plot(result)
      return <option key={key} value={key}>{result.examType} · {skillLabel(result.skill)}{part} · {scale.unit}{result.maxScore === 100 && !result.totalQuestions ? ' (%)' : ` / ${scale.max}`}</option>
    })}</select>}</div>
    <div className="mt-5 h-64">{points.length ? <ResponsiveContainer width="100%" height="100%"><LineChart data={points} margin={{ left: -16, right: 16, top: 12, bottom: 4 }}><CartesianGrid strokeDasharray="4 6" vertical={false} stroke="#dce2ea" /><XAxis dataKey="timestamp" type="number" domain={['dataMin', 'dataMax']} tickFormatter={value => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} minTickGap={36} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} /><YAxis domain={[min, max]} allowDataOverflow axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} /><Tooltip content={({ active, payload }) => {
      const result = payload?.[0]?.payload as LearningResult | undefined
      return active && result ? <div className="max-w-64 rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-xl"><p className="font-bold">{result.title}</p><div className="mt-2"><ResultScore result={result} /></div><p className="mt-2 text-slate-500"><ResultDate date={result.completedAt} /></p></div> : null
    }} /><Line type="linear" dataKey="chartScore" stroke="#b92d43" strokeWidth={2.5} dot={{ r: points.length > 25 ? 2 : 4, fill: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} isAnimationActive={false} /></LineChart></ResponsiveContainer> : <div className="grid h-full place-items-center text-center text-sm text-slate-400"><UiText text="Complete an assessment to start the progress curve." /></div>}</div>
    {points.length > 0 && <p className="mt-2 text-xs text-slate-500"><UiText text="Showing {{shown}} of {{total}} comparable results" values={{ shown: points.length, total: allPoints.length }} /></p>}
  </CenterPanel>
}

function Assignments({ assignments, opening, canManage, onOpen }: { assignments: StudentDetailAssignments; opening: boolean; canManage: boolean; onOpen: (item: StudentDetailAssignments[number]) => void }) {
  const [expanded, setExpanded] = useState(false)
  return <CenterPanel className="p-5 sm:p-6"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-red-700"><UiText text={"Learning plan"} /></p><h2 className="mt-1 text-xl font-bold text-slate-950"><UiText text={"Assignments"} /></h2></div><div className="mt-4 space-y-3">{assignments.length ? assignments.slice(0, expanded ? undefined : 6).map((item) => <article key={item.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${item.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : item.status === 'OVERDUE' ? 'bg-red-100 text-red-700' : 'bg-red-100 text-red-700'}`}>{item.status === 'COMPLETED' ? <CheckCircle2 className="h-5 w-5" /> : <CalendarClock className="h-5 w-5" />}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-900">{item.title}</p><p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.status.replace('_', ' ')} <UiText text={"· due"} /> {new Date(item.dueAt).toLocaleDateString()}</p></div>{item.status !== 'COMPLETED' ? <button type="button" disabled={opening} onClick={() => onOpen(item)} className={secondaryButton}>{opening ? <UiText text={"Opening..."} /> : canManage ? <UiText text={"Preview"} /> : <UiText text={"Open"} />}</button> : null}</article>) : <p className="py-8 text-center text-sm font-semibold text-slate-400"><UiText text={"No assignments have been issued."} /></p>}</div>{assignments.length > 6 && <button type="button" className={`${secondaryButton} mt-4`} onClick={() => setExpanded(!expanded)}><UiText text={expanded ? "Show less" : "Show all assignments"} /></button>}</CenterPanel>
}


type StudentDetailAssignments = Awaited<ReturnType<typeof learningCenterApi.student>>['assignments']
