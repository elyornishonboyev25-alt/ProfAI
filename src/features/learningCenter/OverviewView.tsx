import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  Target,
  TrendingUp,
  UserRoundCheck,
  Users,
} from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAsyncData } from '@/hooks/useAsyncData'
import { learningCenterApi } from './api'
import { Avatar, CenterPageHeading, CenterPanel, CenterSkeleton, ErrorState, MetricCard, StatusBadge, Trend } from './components'

export default function OverviewView({ slug }: { slug: string }) {
  const navigate = useNavigate()
  const [days, setDays] = useState(90)
  const { data, loading, error, refetch } = useAsyncData(() => learningCenterApi.overview(slug, days), [slug, days])

  if (loading && !data) return <CenterSkeleton blocks={8} />
  if (error) return <ErrorState message={error} onRetry={() => void refetch()} />
  if (!data) return null

  const chart = data.activity.map((point) => ({
    ...point,
    label: new Date(`${point.date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }))

  return (
    <div className="space-y-6">
      <CenterPageHeading
        eyebrow="Learning center overview"
        title={data.workspace.name}
        description="Live academic operations across every IELTS and SAT cohort — from first diagnostic to target score."
        action={(
          <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            {[30, 90, 180].map((value) => (
              <button key={value} type="button" onClick={() => setDays(value)} className={`rounded-lg px-3 py-2 text-xs font-bold transition ${days === value ? 'bg-gradient-to-r from-red-800 to-red-500 text-white shadow-[0_8px_18px_rgba(185,28,28,.18)]' : 'text-slate-500 hover:text-slate-900'}`}>{value}d</button>
            ))}
          </div>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total students" value={data.metrics.totalStudents} note={`${data.metrics.satStudents} SAT · ${data.metrics.ieltsStudents} IELTS`} icon={Users} accent="blue" />
        <MetricCard label="Average SAT" value={data.metrics.averageSat || '—'} note="Current center average" icon={GraduationCap} accent="violet" />
        <MetricCard label="Average IELTS" value={data.metrics.averageIelts || '—'} note="Across active IELTS learners" icon={BookOpenCheck} accent="red" />
        <MetricCard label="Students improving" value={`${data.metrics.studentsImproving}%`} note={`${data.metrics.activeTeachers} active teachers`} icon={TrendingUp} accent="emerald" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(20rem,.8fr)]">
        <CenterPanel className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-red-700">Performance pulse</p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">Learning activity</h2>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-bold text-slate-500"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-red-700" /> Test attempts</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-slate-500" /> Active students</span></div>
          </div>
          <div className="mt-5 h-72">
            {chart.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart} margin={{ left: -22, right: 8, top: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="centerAttempts" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#a92436" stopOpacity={0.28} /><stop offset="1" stopColor="#a92436" stopOpacity={0} /></linearGradient>
                    <linearGradient id="centerStudents" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8792a4" stopOpacity={0.2} /><stop offset="1" stopColor="#8792a4" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 6" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} axisLine={false} tickLine={false} minTickGap={28} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 14, border: '1px solid #d8dce2', boxShadow: '0 16px 40px rgba(15,23,42,.12)', fontSize: 12 }} />
                  <Area type="monotone" dataKey="attempts" stroke="#a92436" strokeWidth={3} fill="url(#centerAttempts)" />
                  <Area type="monotone" dataKey="activeStudents" stroke="#8792a4" strokeWidth={2} fill="url(#centerStudents)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : <div className="grid h-full place-items-center text-sm font-semibold text-slate-400">Activity appears after students complete their first test.</div>}
          </div>
        </CenterPanel>

        <CenterPanel className="bg-[radial-gradient(circle_at_90%_0%,rgba(207,214,223,.7),transparent_48%),linear-gradient(145deg,#fff,#f3f4f6_62%,#fff0f1)] p-5 text-slate-950 sm:p-6">
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-red-200/30 blur-2xl" />
          <div className="relative flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-2xl border border-red-100 bg-white/80"><BrainCircuit className="h-5 w-5 text-red-700" /></span><span className="rounded-full border border-red-100 bg-red-50/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.14em] text-red-700">Live intelligence</span></div>
          <h2 className="relative mt-5 text-2xl font-bold tracking-[-.04em]">ProfAI Performance Signal</h2>
          <p className="relative mt-2 text-sm leading-6 text-slate-600">Every score, completion and learning streak is translated into an actionable teaching signal.</p>
          <div className="relative mt-6 space-y-3">
            <Signal label="Assignment completion" value={`${data.metrics.assignmentsCompleted}%`} icon={CheckCircle2} />
            <Signal label="Groups monitored" value={String(data.metrics.groups)} icon={Activity} />
            <Signal label="Students needing attention" value={String(data.needsAttention.length)} icon={Target} />
          </div>
          <button type="button" onClick={() => navigate(`/learning-center/${slug}/students?status=NEEDS_ATTENTION`)} className="relative mt-6 inline-flex items-center gap-2 text-xs font-bold text-red-700 hover:text-red-900">Open intervention queue <ArrowRight className="h-4 w-4" /></button>
        </CenterPanel>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <StudentList title="Top improving students" eyebrow="Momentum leaders" students={data.topImproving} icon={<Sparkles className="h-5 w-5" />} empty="Progress leaders appear after at least two test results." onOpen={(id) => navigate(`/learning-center/${slug}/students/${id}`)} />
        <StudentList title="Students who need attention" eyebrow="Intervention queue" students={data.needsAttention} icon={<Target className="h-5 w-5" />} empty="No students currently require urgent attention." onOpen={(id) => navigate(`/learning-center/${slug}/students/${id}`)} />
      </div>

      {data.teacherPerformance.length ? (
        <CenterPanel className="p-5 sm:p-6">
          <div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-red-700">Team performance</p><h2 className="mt-1 text-xl font-bold text-slate-950">Teacher cohort outcomes</h2></div><UserRoundCheck className="h-6 w-6 text-red-600" /></div>
          <div className="mt-5 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {data.teacherPerformance.map((teacher) => (
              <article key={`${teacher.id}-${teacher.groupName}`} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <div className="flex items-center gap-3"><Avatar name={teacher.fullName} url={teacher.avatarUrl} /><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900">{teacher.fullName}</p><p className="truncate text-xs font-semibold text-slate-500">{teacher.groupName}</p></div></div>
                <div className="mt-4 flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Group score</p><p className="text-xl font-bold text-slate-950">{teacher.averageScore}%</p></div><p className="text-xs font-bold text-emerald-600">{teacher.improving}/{teacher.students} improving</p></div>
              </article>
            ))}
          </div>
        </CenterPanel>
      ) : null}
    </div>
  )
}

function Signal({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Activity }) {
  return <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/75 px-4 py-3"><span className="flex items-center gap-2 text-xs font-bold text-slate-700"><Icon className="h-4 w-4" />{label}</span><strong className="text-lg font-bold">{value}</strong></div>
}

function StudentList({ title, eyebrow, students, icon, empty, onOpen }: { title: string; eyebrow: string; students: CenterOverviewStudent[]; icon: React.ReactNode; empty: string; onOpen: (id: string) => void }) {
  return (
    <CenterPanel className="p-5 sm:p-6">
      <div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-red-700">{eyebrow}</p><h2 className="mt-1 text-xl font-bold text-slate-950">{title}</h2></div><span className="grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-red-700">{icon}</span></div>
      <div className="mt-4 divide-y divide-slate-100">
        {students.length ? students.map((student) => (
          <button key={student.id} type="button" onClick={() => onOpen(student.id)} className="group flex w-full items-center gap-3 py-3 text-left">
            <Avatar name={student.fullName} url={student.avatarUrl} />
            <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-bold text-slate-900">{student.fullName}</p><StatusBadge status={student.status} /></div><p className="mt-0.5 text-[11px] font-semibold text-slate-400">{student.attempts} attempts · {student.currentSat ? `SAT ${student.currentSat}` : student.currentIelts ? `IELTS ${student.currentIelts}` : 'Baseline pending'}</p></div>
            <Trend value={student.improvement} compact />
            <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-red-700" />
          </button>
        )) : <p className="py-10 text-center text-sm font-semibold text-slate-400">{empty}</p>}
      </div>
    </CenterPanel>
  )
}

type CenterOverviewStudent = Awaited<ReturnType<typeof learningCenterApi.overview>>['topImproving'][number]
