import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, BookOpenCheck, CalendarDays, GraduationCap, Plus, Users } from 'lucide-react'
import { useAsyncData } from '@/hooks/useAsyncData'
import { learningCenterApi } from './api'
import { Avatar, CenterPageHeading, CenterPanel, CenterSkeleton, EmptyState, ErrorState, inputClass, Modal, primaryButton, secondaryButton } from './components'
import type { CenterExamTrack } from './types'

export default function GroupsView({ slug, canManage }: { slug: string; canManage: boolean }) {
  const navigate = useNavigate()
  const [createOpen, setCreateOpen] = useState(false)
  const { data, loading, error, refetch } = useAsyncData(() => learningCenterApi.groups(slug), [slug])
  const team = useAsyncData(() => learningCenterApi.team(slug), [slug])

  return (
    <div className="space-y-6">
      <CenterPageHeading eyebrow="Cohort operations" title="Groups built around outcomes" description="Give every cohort a clear target, accountable teacher and live progress signal." action={canManage ? <button type="button" onClick={() => setCreateOpen(true)} className={primaryButton}><Plus className="h-4 w-4" /> Create group</button> : undefined} />
      {loading && !data ? <CenterSkeleton blocks={6} /> : error && !data ? <ErrorState message={error} onRetry={() => void refetch()} /> : data?.groups.length ? (
        <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
          {data.groups.map((group) => (
            <CenterPanel key={group.id} className="group p-5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(30,64,175,.13)] sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <span className={`grid h-12 w-12 place-items-center rounded-2xl ${group.examTrack === 'SAT' ? 'bg-violet-100 text-violet-700' : group.examTrack === 'IELTS' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{group.examTrack === 'SAT' ? <GraduationCap className="h-6 w-6" /> : <BookOpenCheck className="h-6 w-6" />}</span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">{group.examTrack}</span>
              </div>
              <h2 className="mt-5 text-xl font-black tracking-[-.03em] text-slate-950">{group.name}</h2>
              <div className="mt-2 flex flex-wrap gap-3 text-[11px] font-semibold text-slate-500"><span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{group.studentCount} students</span><span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{group.schedule || 'Schedule not set'}</span></div>
              <div className="mt-5 grid grid-cols-3 gap-2">
                <MiniMetric label={group.examTrack === 'IELTS' ? 'Avg IELTS' : group.examTrack === 'SAT' ? 'Avg SAT' : 'Avg score'} value={group.examTrack === 'IELTS' ? group.averageIelts || '—' : group.examTrack === 'SAT' ? group.averageSat || '—' : `${group.averageScore}%`} />
                <MiniMetric label="Improving" value={group.improving} tone="good" />
                <MiniMetric label="Attention" value={group.needsAttention} tone={group.needsAttention ? 'bad' : 'default'} />
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                {group.teacher ? <div className="flex min-w-0 items-center gap-2"><Avatar name={group.teacher.fullName} url={group.teacher.avatarUrl} size="sm" /><div className="min-w-0"><p className="truncate text-xs font-black text-slate-800">{group.teacher.fullName}</p><p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Lead teacher</p></div></div> : <span className="text-xs font-bold text-amber-600">Teacher not assigned</span>}
                <button type="button" onClick={() => navigate(`/learning-center/${slug}/students?groupId=${group.id}`)} className="inline-flex items-center gap-1 text-xs font-black text-blue-700">View students <ArrowRight className="h-4 w-4" /></button>
              </div>
              {group.students.some((student) => student.status === 'NEEDS_ATTENTION') ? <div className="mt-4 rounded-xl border border-red-100 bg-red-50/70 p-3"><p className="text-[10px] font-black uppercase tracking-wider text-red-600">Intervention signal</p><div className="mt-2 flex flex-wrap gap-2">{group.students.filter((student) => student.status === 'NEEDS_ATTENTION').slice(0, 3).map((student) => <button key={student.id} type="button" onClick={() => navigate(`/learning-center/${slug}/students/${student.id}`)} className="flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 text-[10px] font-bold text-slate-700"><Avatar name={student.fullName} url={student.avatarUrl} size="sm" />{student.fullName.split(' ')[0]}</button>)}</div></div> : null}
            </CenterPanel>
          ))}
        </div>
      ) : <CenterPanel><EmptyState title="Create your first cohort" description="Groups connect teachers, students, targets, assignments and analytics into one operational view." action={canManage ? <button type="button" onClick={() => setCreateOpen(true)} className={primaryButton}>Create a group</button> : undefined} /></CenterPanel>}

      <CreateGroupModal open={createOpen} onClose={() => setCreateOpen(false)} slug={slug} teachers={team.data?.team.filter((member) => ['OWNER', 'ADMIN', 'TEACHER'].includes(member.role)) ?? []} onDone={() => { setCreateOpen(false); void refetch() }} />
    </div>
  )
}

function MiniMetric({ label, value, tone = 'default' }: { label: string; value: string | number; tone?: 'default' | 'good' | 'bad' }) {
  return <div className={`rounded-xl p-3 text-center ${tone === 'good' ? 'bg-emerald-50' : tone === 'bad' ? 'bg-red-50' : 'bg-slate-50'}`}><p className={`text-lg font-black ${tone === 'good' ? 'text-emerald-700' : tone === 'bad' ? 'text-red-700' : 'text-slate-950'}`}>{value}</p><p className="mt-0.5 text-[8px] font-black uppercase tracking-wider text-slate-400">{label}</p></div>
}

function CreateGroupModal({ open, onClose, slug, teachers, onDone }: { open: boolean; onClose: () => void; slug: string; teachers: Array<{ userId: string; user: { fullName: string } }>; onDone: () => void }) {
  const [name, setName] = useState('')
  const [examTrack, setExamTrack] = useState<CenterExamTrack>('SAT')
  const [teacherId, setTeacherId] = useState('')
  const [targetScore, setTargetScore] = useState('')
  const [schedule, setSchedule] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError('')
    try { await learningCenterApi.createGroup(slug, { name, examTrack, teacherId: teacherId || undefined, targetScore: targetScore || undefined, schedule: schedule || undefined }); onDone() }
    catch (submitError) { setError(submitError instanceof Error ? submitError.message : 'Could not create group.') }
    finally { setBusy(false) }
  }
  return <Modal open={open} onClose={onClose} title="Create a learning group" description="Define the cohort target and assign accountable teaching ownership."><form onSubmit={submit} className="space-y-4"><label className="block"><span className="mb-1.5 block text-xs font-black text-slate-700">Group name</span><input required minLength={2} value={name} onChange={(event) => setName(event.target.value)} className={inputClass} placeholder="SAT Advanced — Group A" /></label><div className="grid gap-4 sm:grid-cols-2"><label><span className="mb-1.5 block text-xs font-black text-slate-700">Exam track</span><select value={examTrack} onChange={(event) => setExamTrack(event.target.value as CenterExamTrack)} className={inputClass}><option value="SAT">SAT</option><option value="IELTS">IELTS</option><option value="BOTH">Both</option></select></label><label><span className="mb-1.5 block text-xs font-black text-slate-700">Target score</span><input value={targetScore} onChange={(event) => setTargetScore(event.target.value)} className={inputClass} placeholder={examTrack === 'SAT' ? '1450' : '7.5'} /></label></div><label className="block"><span className="mb-1.5 block text-xs font-black text-slate-700">Lead teacher</span><select value={teacherId} onChange={(event) => setTeacherId(event.target.value)} className={inputClass}><option value="">Assign later</option>{teachers.map((teacher) => <option key={teacher.userId} value={teacher.userId}>{teacher.user.fullName}</option>)}</select></label><label className="block"><span className="mb-1.5 block text-xs font-black text-slate-700">Schedule</span><input value={schedule} onChange={(event) => setSchedule(event.target.value)} className={inputClass} placeholder="Mon · Wed · Fri, 16:00" /></label>{error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{error}</p> : null}<div className="flex justify-end gap-2"><button type="button" onClick={onClose} className={secondaryButton}>Cancel</button><button disabled={busy} className={primaryButton}><Plus className="h-4 w-4" />{busy ? 'Creating...' : 'Create group'}</button></div></form></Modal>
}
