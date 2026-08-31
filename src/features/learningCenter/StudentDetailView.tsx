import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, BookOpenCheck, BrainCircuit, CalendarClock, CheckCircle2, Clock3, Flame, RefreshCw, Send, Sparkles, Target, TrendingUp } from 'lucide-react'
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAsyncData } from '@/hooks/useAsyncData'
import { learningCenterApi } from './api'
import { Avatar, CenterPanel, CenterSkeleton, ErrorState, inputClass, MetricCard, primaryButton, secondaryButton, StatusBadge, Trend } from './components'
import type { LearningResult, PerformanceInsight } from './types'

export default function StudentDetailView({ slug, studentId, canManage }: { slug: string; studentId: string; canManage: boolean }) {
  const navigate = useNavigate()
  const { data, loading, error, refetch } = useAsyncData(() => learningCenterApi.student(slug, studentId), [slug, studentId])
  const [insight, setInsight] = useState<PerformanceInsight | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [note, setNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  if (loading && !data) return <CenterSkeleton blocks={8} />
  if (error && !data) return <ErrorState message={error} onRetry={() => void refetch()} />
  if (!data) return null

  const student = data.student
  const activeInsight = insight ?? data.insight

  async function analyze() {
    setAnalyzing(true)
    try { setInsight((await learningCenterApi.analyzeStudent(slug, studentId)).insight) } finally { setAnalyzing(false) }
  }

  async function saveNote(event: React.FormEvent) {
    event.preventDefault()
    if (!note.trim()) return
    setSavingNote(true)
    try { await learningCenterApi.addNote(slug, studentId, note); setNote(''); await refetch() } finally { setSavingNote(false) }
  }

  return (
    <div className="space-y-6">
      <button type="button" onClick={() => navigate(`/learning-center/${slug}/students`)} className="inline-flex items-center gap-2 text-xs font-black text-slate-500 transition hover:text-blue-700"><ArrowLeft className="h-4 w-4" /> Back to students</button>

      <CenterPanel className="overflow-hidden">
        <div className="relative bg-[linear-gradient(120deg,#0f172a,#172554_55%,#1d4ed8)] px-5 py-7 text-white sm:px-7">
          <div className="pointer-events-none absolute -right-12 -top-24 h-72 w-72 rounded-full border border-white/10 bg-blue-400/10" />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4"><Avatar name={student.fullName} url={student.avatarUrl} size="lg" /><div><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-black tracking-[-.04em] sm:text-3xl">{student.fullName}</h1><StatusBadge status={student.status} /></div><p className="mt-1 text-sm font-semibold text-blue-100/70">{data.groups.map((group) => group.name).join(' · ') || 'Not assigned to a group'} · {student.targetExam} track</p></div></div>
            <div className="flex flex-wrap gap-2"><span className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold"><Flame className="mr-1.5 inline h-4 w-4 text-orange-300" />{student.currentStreak} day streak</span><span className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold"><Target className="mr-1.5 inline h-4 w-4 text-red-300" />Target {student.targetSat ?? student.targetIelts ?? student.targetScore ?? 'not set'}</span></div>
          </div>
        </div>
      </CenterPanel>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Current result" value={student.currentSat ? `SAT ${student.currentSat}` : student.currentIelts ? `IELTS ${student.currentIelts.toFixed(1)}` : '—'} note="Latest measured score" icon={BookOpenCheck} accent="blue" />
        <MetricCard label="Highest result" value={student.highestSat ?? student.highestIelts?.toFixed(1) ?? '—'} note={`${student.attempts} completed assessments`} icon={TrendingUp} accent="emerald" trend={student.improvement} />
        <MetricCard label="Assignment delivery" value={`${student.completionRate}%`} note="Across center assignments" icon={CheckCircle2} accent="violet" />
        <MetricCard label="Gap to target" value={gapLabel(student.currentSat, student.targetSat, student.currentIelts, student.targetIelts)} note="Focused work remaining" icon={Target} accent="red" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,.8fr)]">
        <ProgressChart results={data.results} />
        <CenterPanel className={`p-5 sm:p-6 ${activeInsight.tone === 'warning' ? 'ring-1 ring-red-100' : ''}`}>
          <div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20"><BrainCircuit className="h-5 w-5" /></span><button type="button" disabled={analyzing} onClick={() => void analyze()} className="inline-flex items-center gap-1.5 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-blue-700 hover:bg-blue-100 disabled:opacity-60"><RefreshCw className={`h-3.5 w-3.5 ${analyzing ? 'animate-spin' : ''}`} />{analyzing ? 'Analyzing' : 'Refresh AI'}</button></div>
          <p className="mt-5 text-[10px] font-black uppercase tracking-[.2em] text-blue-600">ProfAI performance analysis</p>
          <h2 className="mt-1 text-xl font-black tracking-[-.03em] text-slate-950">{activeInsight.headline}</h2>
          <p className="mt-3 text-sm font-medium leading-6 text-slate-600">{activeInsight.summary}</p>
          <div className="mt-5 space-y-2">{activeInsight.priorities.map((priority, index) => <div key={priority} className="flex gap-3 rounded-xl bg-slate-50 px-3.5 py-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-blue-600 text-[10px] font-black text-white">{index + 1}</span><p className="text-xs font-bold leading-5 text-slate-700">{priority}</p></div>)}</div>
        </CenterPanel>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <SkillBreakdown skills={student.skills} />
        <Assignments assignments={data.assignments} onOpen={(route, assignmentId) => navigate(`${route}${route.includes('?') ? '&' : '?'}assignmentId=${assignmentId}`)} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <RecentResults results={data.results} />
        <CenterPanel className="p-5 sm:p-6">
          <div><p className="text-[10px] font-black uppercase tracking-[.18em] text-blue-600">Private coaching log</p><h2 className="mt-1 text-xl font-black text-slate-950">Teacher notes</h2></div>
          {canManage ? <form onSubmit={saveNote} className="mt-4"><textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} className={`${inputClass} h-auto py-3`} placeholder="Record an observation, follow-up or coaching decision..." /><div className="mt-2 flex justify-end"><button disabled={savingNote || !note.trim()} className={primaryButton}><Send className="h-4 w-4" />{savingNote ? 'Saving...' : 'Save note'}</button></div></form> : null}
          <div className="mt-4 space-y-3">{data.notes.length ? data.notes.map((entry) => <article key={entry.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4"><p className="text-sm font-medium leading-6 text-slate-700">{entry.note}</p><div className="mt-3 flex items-center justify-between text-[10px] font-bold text-slate-400"><span>{entry.author.fullName}</span><span>{new Date(entry.createdAt).toLocaleDateString()}</span></div></article>) : <p className="py-8 text-center text-sm font-semibold text-slate-400">No coaching notes yet.</p>}</div>
        </CenterPanel>
      </div>
    </div>
  )
}

function gapLabel(currentSat: number | null, targetSat: number | null, currentIelts: number | null, targetIelts: number | null) {
  if (currentSat && targetSat) return `${Math.max(0, targetSat - currentSat)} pts`
  if (currentIelts && targetIelts) return `${Math.max(0, targetIelts - currentIelts).toFixed(1)} bands`
  return '—'
}

function ProgressChart({ results }: { results: LearningResult[] }) {
  const [skill, setSkill] = useState('ALL')
  const skillOptions = [...new Set(results.map((result) => result.skill))]
  const chart = useMemo(() => results.filter((result) => skill === 'ALL' || result.skill === skill).slice().reverse().map((result) => ({
    date: new Date(result.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: Math.round((result.score / result.maxScore) * 1000) / 10,
    native: result.score,
    title: result.title,
  })), [results, skill])
  return (
    <CenterPanel className="p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-blue-600">Score growth</p><h2 className="mt-1 text-xl font-black text-slate-950">Performance trajectory</h2></div><select value={skill} onChange={(event) => setSkill(event.target.value)} className={`${inputClass} w-auto min-w-36`}><option value="ALL">All skills</option>{skillOptions.map((option) => <option key={option} value={option}>{option.replace(/_/g, ' ')}</option>)}</select></div>
      <div className="mt-5 h-72">{chart.length ? <ResponsiveContainer width="100%" height="100%"><LineChart data={chart} margin={{ left: -22, right: 14, top: 12 }}><CartesianGrid strokeDasharray="4 6" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} /><YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} /><Tooltip formatter={(value, _name, props) => [`${value}% · native ${props.payload.native}`, props.payload.title]} contentStyle={{ borderRadius: 14, border: '1px solid #dbeafe', boxShadow: '0 16px 40px rgba(15,23,42,.12)', fontSize: 12 }} /><Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#fff', strokeWidth: 3 }} activeDot={{ r: 6 }} /></LineChart></ResponsiveContainer> : <div className="grid h-full place-items-center text-sm font-semibold text-slate-400">Complete an assessment to start the progress curve.</div>}</div>
    </CenterPanel>
  )
}

function SkillBreakdown({ skills }: { skills: Array<{ key: string; label: string; score: number; maxScore: number; attempts: number; change: number }> }) {
  return <CenterPanel className="p-5 sm:p-6"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-blue-600">Skill map</p><h2 className="mt-1 text-xl font-black text-slate-950">Strengths & growth areas</h2></div><div className="mt-5 space-y-4">{skills.length ? skills.map((item) => { const percent = Math.round((item.score / item.maxScore) * 100); return <div key={item.key}><div className="flex items-center justify-between"><div><p className="text-sm font-black text-slate-800">{item.label}</p><p className="text-[10px] font-semibold text-slate-400">{item.attempts} attempts</p></div><div className="flex items-center gap-2"><Trend value={item.change} compact /><strong className="min-w-10 text-right text-sm text-slate-950">{item.score}</strong></div></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" style={{ width: `${percent}%` }} /></div></div> }) : <p className="py-8 text-center text-sm font-semibold text-slate-400">Skill-level analytics will appear after section tests.</p>}</div></CenterPanel>
}

function Assignments({ assignments, onOpen }: { assignments: StudentDetailAssignments; onOpen: (route: string, assignmentId: string) => void }) {
  return <CenterPanel className="p-5 sm:p-6"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-blue-600">Learning plan</p><h2 className="mt-1 text-xl font-black text-slate-950">Assignments</h2></div><div className="mt-4 space-y-3">{assignments.length ? assignments.slice(0, 6).map((item) => <article key={item.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${item.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : item.status === 'OVERDUE' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{item.status === 'COMPLETED' ? <CheckCircle2 className="h-5 w-5" /> : <CalendarClock className="h-5 w-5" />}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-slate-900">{item.title}</p><p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.status.replace('_', ' ')} · due {new Date(item.dueAt).toLocaleDateString()}</p></div>{item.status !== 'COMPLETED' ? <button type="button" onClick={() => onOpen(item.routePath, item.assignmentId)} className={secondaryButton}>Open</button> : null}</article>) : <p className="py-8 text-center text-sm font-semibold text-slate-400">No assignments have been issued.</p>}</div></CenterPanel>
}

function RecentResults({ results }: { results: LearningResult[] }) {
  return <CenterPanel className="p-5 sm:p-6"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-blue-600">Assessment history</p><h2 className="mt-1 text-xl font-black text-slate-950">Recent results</h2></div><div className="mt-4 divide-y divide-slate-100">{results.length ? results.slice(0, 8).map((result) => <div key={`${result.source}-${result.id}`} className="flex items-center gap-3 py-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600"><Sparkles className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-slate-900">{result.title}</p><p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{result.skill.replace(/_/g, ' ')} · {new Date(result.completedAt).toLocaleDateString()}</p></div><div className="text-right"><strong className="text-lg font-black text-slate-950">{result.score}</strong><p className="text-[9px] font-bold text-slate-400">/ {result.maxScore}</p></div><span className="hidden text-[10px] font-semibold text-slate-400 sm:flex"><Clock3 className="mr-1 h-3.5 w-3.5" />{Math.round(result.durationSec / 60)}m</span></div>) : <p className="py-8 text-center text-sm font-semibold text-slate-400">No test results yet.</p>}</div></CenterPanel>
}

type StudentDetailAssignments = Awaited<ReturnType<typeof learningCenterApi.student>>['assignments']
