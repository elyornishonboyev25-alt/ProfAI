import { useCopy } from '@/i18n/interface'
import UiText from '@/components/common/UiText'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, BrainCircuit, CalendarClock, CheckCircle2, Clock3, Flame, RefreshCw, Target } from 'lucide-react'
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAsyncData } from '@/hooks/useAsyncData'
import { learningCenterApi } from './api'
import { assignmentDestination, startAssignment } from './assignmentNavigation'
import { Avatar, CenterPanel, CenterSkeleton, ErrorState, inputClass, secondaryButton, StatusBadge, Trend } from './components'
import type { CenterStudent, LearningResult, PerformanceInsight } from './types'
import { isMeasured, nativeScore, ResultDate, ResultScore, seriesKey, skillLabel } from './resultPresentation'
import TeacherNotesPanel from './TeacherNotesPanel'

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
  const currentStudent = useRef('')
  currentStudent.current = `${slug}:${studentId}`
  useEffect(() => { setInsight(null); setAnalysisNote('Based on recorded results'); setActionError(''); setAnalyzing(false) }, [slug, studentId])

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
            <div className="flex flex-wrap gap-2"><span className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold"><Flame className="mr-1.5 inline h-4 w-4 text-orange-300" />{student.currentStreak} <UiText text={"day streak"} /></span><span className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold"><Target className="mr-1.5 inline h-4 w-4 text-red-300" /><UiText text={"Target"} /> {[student.targetIelts !== null ? `IELTS ${student.targetIelts.toFixed(1)}` : '', student.targetSat !== null ? `SAT ${student.targetSat}` : ''].filter(Boolean).join(' · ') || student.targetScore || <UiText text="not set" />}</span></div>
          </div>
        </div>
      </CenterPanel>

      <div className="lc-exam-summary">
        {(student.targetExam !== 'SAT' || student.currentIelts !== null || data.results.some(result => result.examType === 'IELTS')) && <ExamSummary student={student} exam="IELTS" />}
        {(student.targetExam !== 'IELTS' || student.currentSat !== null || data.results.some(result => result.examType === 'SAT')) && <ExamSummary student={student} exam="SAT" />}
      </div>
      <CenterPanel className="grid gap-4 p-5 sm:grid-cols-3">
        <div><p className="text-xs font-semibold text-slate-500"><UiText text="Latest test" /></p>{student.latestResult ? <><p className="mt-2 text-sm font-bold text-slate-900">{student.latestResult.examType} · {student.latestResult.title}</p><div className="mt-1"><ResultScore result={student.latestResult} /></div><p className="mt-1 text-xs text-slate-500"><ResultDate date={student.latestResult.completedAt} /></p></> : <p className="mt-2 text-sm text-slate-500"><UiText text="No test results yet." /></p>}</div>
        <div><p className="text-xs font-semibold text-slate-500"><UiText text="Assessment activity" /></p><p className="mt-2 text-2xl font-bold text-slate-900">{student.attempts}</p><p className="mt-1 text-xs text-slate-500"><UiText text="{{count}} verified scores" values={{ count: student.scoredAttempts ?? student.attempts }} /></p>{student.pendingAttempts ? <p className="mt-1 text-xs font-semibold text-amber-700"><UiText text="{{count}} without verified scores" values={{ count: student.pendingAttempts }} /></p> : null}</div>
        <div><p className="text-xs font-semibold text-slate-500"><UiText text="Assignment delivery" /></p><p className="mt-2 text-2xl font-bold text-slate-900">{student.assignmentTotal ? `${student.assignmentsCompleted} / ${student.assignmentTotal}` : '—'}</p><p className="mt-1 text-xs text-slate-500">{student.assignmentTotal ? `${student.completionRate}%` : <UiText text="No assignments" />}</p></div>
      </CenterPanel>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,.8fr)]">
        <ProgressChart results={data.results} />
        <CenterPanel className={`p-5 sm:p-6 ${activeInsight.tone === 'warning' ? 'ring-1 ring-red-100' : ''}`}>
          <div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-red-800 to-red-500 text-white shadow-lg shadow-red-500/20"><BrainCircuit className="h-5 w-5" /></span>{canManage && <button type="button" disabled={analyzing} onClick={() => void analyze()} className="inline-flex items-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-red-700 hover:bg-red-100 disabled:opacity-60"><RefreshCw className={`h-3.5 w-3.5 ${analyzing ? 'animate-spin' : ''}`} />{analyzing ? <UiText text={"Analyzing"} /> : <UiText text={"Refresh AI"} />}</button>}</div>
          <p className="mt-5 text-[10px] font-bold uppercase tracking-[.2em] text-red-700"><UiText text={"Ivygoo performance analysis"} /></p>
          <h2 className="mt-1 text-xl font-bold tracking-[-.03em] text-slate-950">{insightCopy(activeInsight.headline)}</h2>
          <p aria-live="polite" className="mt-2 text-xs font-semibold text-slate-500">{uiCopy(analysisNote)}</p>
          <p className="mt-3 text-sm font-medium leading-6 text-slate-600">{insightCopy(activeInsight.summary)}</p>
          <div className="mt-5 space-y-2">{activeInsight.priorities.map((priority, index) => <div key={priority} className="flex gap-3 rounded-xl bg-slate-50 px-3.5 py-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-red-700 text-[10px] font-bold text-white">{index + 1}</span><p className="text-xs font-bold leading-5 text-slate-700">{insightCopy(priority)}</p></div>)}</div>
        </CenterPanel>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <SkillBreakdown skills={student.skills} />
        <Assignments assignments={data.assignments} opening={opening} canManage={canManage} onOpen={(item) => void openAssignment(item)} />
      </div>

      <div className={`grid gap-5 ${canManage ? 'xl:grid-cols-[1.15fr_.85fr]' : ''}`}>
        <RecentResults results={data.results} />
        {canManage && <TeacherNotesPanel key={`${slug}:${studentId}`} slug={slug} studentId={studentId} notes={data.notes} onSent={refetch} />}
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
  const { c: uiCopy } = useCopy()
  const [selection, setSelection] = useState('')
  const measured = useMemo(() => results.filter(isMeasured), [results])
  const keys = [...new Set(measured.map(seriesKey))]
  const selected = keys.includes(selection) ? selection : keys[0]
  const allPoints = measured.filter(result => seriesKey(result) === selected).slice().sort((a, b) => Date.parse(a.completedAt) - Date.parse(b.completedAt))
  const points = allPoints.slice(-60).map(result => ({ ...result, timestamp: Date.parse(result.completedAt) }))
  const first = points[0]
  const max = first?.maxScore ?? 9
  const min = first?.examType === 'SAT' && max !== 100 ? max === 1600 ? 400 : 200 : 0
  return <CenterPanel className="p-5 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-red-700"><UiText text="Score growth" /></p><h2 className="mt-1 text-xl font-bold text-slate-950"><UiText text="Performance trajectory" /></h2></div>{keys.length > 0 && <select aria-label={uiCopy('Filter progress by skill')} value={selected} onChange={event => setSelection(event.target.value)} className={`${inputClass} lc-chart-filter min-w-0`}>{keys.map(key => { const result = measured.find(item => seriesKey(item) === key)!; return <option key={key} value={key}>{result.examType} · {skillLabel(result.skill)} · / {result.maxScore}{result.scoreKind === 'ESTIMATED' ? ` · ${uiCopy('Estimated')}` : ''}</option> })}</select>}</div>
    <p className="mt-3 text-xs leading-5 text-slate-500"><UiText text="Verified results from one section and one score scale. Unverified scores are excluded." /></p>
    <div className="mt-5 h-64">{points.length ? <ResponsiveContainer width="100%" height="100%"><LineChart data={points} margin={{ left: -16, right: 16, top: 12, bottom: 4 }}><CartesianGrid strokeDasharray="4 6" vertical={false} stroke="#dce2ea" /><XAxis dataKey="timestamp" type="number" domain={['dataMin', 'dataMax']} tickFormatter={value => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} minTickGap={36} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} /><YAxis domain={[min, max]} allowDataOverflow axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} /><Tooltip content={({ active, payload }) => { const result = payload?.[0]?.payload as LearningResult | undefined; return active && result ? <div className="max-w-64 rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-xl"><p className="font-bold">{result.title}</p><p className="mt-1">{result.examType} · {skillLabel(result.skill)} · {nativeScore(result)} / {result.maxScore}</p><p className="mt-1 text-slate-500"><ResultDate date={result.completedAt} /></p></div> : null }} /><Line type="linear" dataKey="score" stroke="#b92d43" strokeWidth={2.5} dot={{ r: points.length > 25 ? 2 : 4, fill: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} isAnimationActive={false} /></LineChart></ResponsiveContainer> : <div className="grid h-full place-items-center text-center text-sm font-semibold text-slate-400"><UiText text="Complete an assessment to start the progress curve." /></div>}</div>
    {points.length > 0 && <p className="mt-2 text-xs text-slate-500"><UiText text="Showing {{shown}} of {{total}} comparable results" values={{ shown: points.length, total: allPoints.length }} /></p>}
  </CenterPanel>
}

function SkillBreakdown({ skills }: { skills: CenterStudent['skills'] }) {
  return <CenterPanel className="p-5 sm:p-6"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-red-700"><UiText text="Skill map" /></p><h2 className="mt-1 text-xl font-bold text-slate-950"><UiText text="Strengths & growth areas" /></h2><div className="mt-5 space-y-5">{skills.length ? skills.map(item => <div key={item.key}><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-bold text-slate-800"><UiText text={item.label} /></p><p className="mt-1 text-[11px] text-slate-500"><UiText text="{{count}} verified scores" values={{ count: item.attempts }} />{item.maxScore === 100 ? <> · <UiText text="Practice percentage" /></> : item.key.endsWith(':ESTIMATED') ? <> · <UiText text="Estimated" /></> : null}</p></div><div className="flex flex-wrap items-center gap-2">{item.attempts > 1 ? <Trend value={item.change} compact unit={item.maxScore === 100 ? 'pp' : item.key.startsWith('SAT') ? 'pts' : 'bands'} /> : <span className="text-[10px] text-slate-500"><UiText text="Baseline" /></span>}<strong className="text-sm text-slate-950">{item.maxScore === 9 ? item.score.toFixed(1) : item.score} <span className="text-[11px] font-medium text-slate-500">/ {item.maxScore}</span></strong></div></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-gradient-to-r from-red-800 to-red-400" style={{ width: `${Math.max(0, Math.min(100, item.score / item.maxScore * 100))}%` }} /></div></div>) : <p className="py-8 text-center text-sm text-slate-500"><UiText text="Skill-level analytics will appear after section tests." /></p>}</div></CenterPanel>
}

function Assignments({ assignments, opening, canManage, onOpen }: { assignments: StudentDetailAssignments; opening: boolean; canManage: boolean; onOpen: (item: StudentDetailAssignments[number]) => void }) {
  const [expanded, setExpanded] = useState(false)
  return <CenterPanel className="p-5 sm:p-6"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-red-700"><UiText text={"Learning plan"} /></p><h2 className="mt-1 text-xl font-bold text-slate-950"><UiText text={"Assignments"} /></h2></div><div className="mt-4 space-y-3">{assignments.length ? assignments.slice(0, expanded ? undefined : 6).map((item) => <article key={item.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${item.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : item.status === 'OVERDUE' ? 'bg-red-100 text-red-700' : 'bg-red-100 text-red-700'}`}>{item.status === 'COMPLETED' ? <CheckCircle2 className="h-5 w-5" /> : <CalendarClock className="h-5 w-5" />}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-900">{item.title}</p><p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.status.replace('_', ' ')} <UiText text={"· due"} /> {new Date(item.dueAt).toLocaleDateString()}</p></div>{item.status !== 'COMPLETED' ? <button type="button" disabled={opening} onClick={() => onOpen(item)} className={secondaryButton}>{opening ? <UiText text={"Opening..."} /> : canManage ? <UiText text={"Preview"} /> : <UiText text={"Open"} />}</button> : null}</article>) : <p className="py-8 text-center text-sm font-semibold text-slate-400"><UiText text={"No assignments have been issued."} /></p>}</div>{assignments.length > 6 && <button type="button" className={`${secondaryButton} mt-4`} onClick={() => setExpanded(!expanded)}><UiText text={expanded ? "Show less" : "Show all assignments"} /></button>}</CenterPanel>
}

function RecentResults({ results }: { results: LearningResult[] }) {
  const { c: uiCopy } = useCopy()
  const [exam, setExam] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const filtered = results.filter(result => (!exam || result.examType === exam) && `${result.title} ${result.skill}`.toLowerCase().includes(search.toLowerCase()))
  const pages = Math.max(1, Math.ceil(filtered.length / 10))
  const currentPage = Math.min(page, pages)
  return <CenterPanel className="p-5 sm:p-6"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-red-700"><UiText text="Assessment history" /></p><h2 className="mt-1 text-xl font-bold text-slate-950"><UiText text="Recent results" /> <span className="text-sm text-slate-500">({results.length})</span></h2><div className="mt-4 flex flex-wrap gap-2"><input type="search" aria-label={uiCopy('Search test history')} value={search} onChange={event => { setSearch(event.target.value); setPage(1) }} placeholder={uiCopy('Search tests...')} className={`${inputClass} min-w-0 flex-1`} /><select aria-label={uiCopy('Filter result exam')} value={exam} onChange={event => { setExam(event.target.value); setPage(1) }} className={`${inputClass} !w-auto`}><option value=""><UiText text="All exams" /></option><option value="IELTS">IELTS</option><option value="SAT">SAT</option></select></div><div className="lc-result-history">{filtered.length ? filtered.slice((currentPage - 1) * 10, currentPage * 10).map(result => <article key={`${result.source}-${result.id}`}><div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-wide text-red-700">{result.examType} · {skillLabel(result.skill)}</p><p className="mt-1 break-words text-sm font-bold text-slate-900">{result.title}</p><div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500"><ResultDate date={result.completedAt} />{result.durationSec > 0 ? <span><Clock3 className="mr-1 inline h-3 w-3" />{result.durationSec < 60 ? `${result.durationSec}s` : `${Math.round(result.durationSec / 60)}m`}</span> : <UiText text="Time not recorded" />}{typeof result.accuracy === 'number' && isMeasured(result) && <span><UiText text="Accuracy" /> {result.accuracy}%</span>}</div></div><div className="max-w-[40%] shrink-0 text-right"><ResultScore result={result} /></div></article>) : <p className="py-8 text-center text-sm text-slate-500"><UiText text="No test results yet." /></p>}</div>{pages > 1 && <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><button type="button" disabled={currentPage <= 1} className={secondaryButton} onClick={() => setPage(currentPage - 1)}><UiText text="Previous" /></button><span className="text-xs text-slate-500">{currentPage} / {pages}</span><button type="button" disabled={currentPage >= pages} className={secondaryButton} onClick={() => setPage(currentPage + 1)}><UiText text="Next" /></button></div>}</CenterPanel>
}

type StudentDetailAssignments = Awaited<ReturnType<typeof learningCenterApi.student>>['assignments']
