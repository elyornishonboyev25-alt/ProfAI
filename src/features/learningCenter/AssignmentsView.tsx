import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpenCheck, CalendarClock, FileText, Mic2, Plus, Target, Users } from 'lucide-react'
import { useAsyncData } from '@/hooks/useAsyncData'
import { learningCenterApi } from './api'
import { Avatar, CenterPageHeading, CenterPanel, CenterSkeleton, EmptyState, ErrorState, inputClass, Modal, primaryButton, secondaryButton } from './components'
import type { CenterAssignment, CenterExamTrack } from './types'

export default function AssignmentsView({ slug, canManage }: { slug: string; canManage: boolean }) {
  const navigate = useNavigate()
  const [createOpen, setCreateOpen] = useState(false)
  const [filter, setFilter] = useState('ALL')
  const { data, loading, error, refetch } = useAsyncData(() => learningCenterApi.assignments(slug), [slug])
  const groups = useAsyncData(() => learningCenterApi.groups(slug), [slug])
  const students = useAsyncData(() => learningCenterApi.students(slug), [slug])
  const assignments = data?.assignments.filter((assignment) => {
    if (filter === 'ALL') return true
    if (filter === 'OVERDUE') return assignment.pipeline.overdue > 0
    if (filter === 'COMPLETED') return assignment.pipeline.completed === assignment.submissions.length && assignment.submissions.length > 0
    return assignment.examTrack === filter
  }) ?? []

  async function openAssignment(assignment: CenterAssignment) {
    const ownSubmission = assignment.submissions[0]
    if (ownSubmission && ownSubmission.status === 'ASSIGNED') {
      await learningCenterApi.updateSubmission(slug, ownSubmission.id, { status: 'IN_PROGRESS', progress: 10 }).catch(() => {})
    }
    navigate(`${assignment.routePath}${assignment.routePath.includes('?') ? '&' : '?'}assignmentId=${assignment.id}`)
  }

  return (
    <div className="space-y-6">
      <CenterPageHeading eyebrow="Execution engine" title="Assignments that close skill gaps" description="Turn performance signals into accountable SAT and IELTS work with clear deadlines and live delivery status." action={canManage ? <button type="button" onClick={() => setCreateOpen(true)} className={primaryButton}><Plus className="h-4 w-4" /> New assignment</button> : undefined} />
      <div className="flex flex-wrap gap-2">{['ALL', 'SAT', 'IELTS', 'OVERDUE', 'COMPLETED'].map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-xl px-4 py-2.5 text-xs font-black transition ${filter === item ? 'bg-slate-950 text-white shadow-lg' : 'border border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:text-blue-700'}`}>{item === 'ALL' ? 'All assignments' : item.toLowerCase().replace(/^./, (value) => value.toUpperCase())}</button>)}</div>
      {loading && !data ? <CenterSkeleton blocks={6} /> : error && !data ? <ErrorState message={error} onRetry={() => void refetch()} /> : assignments.length ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {assignments.map((assignment) => <AssignmentCard key={assignment.id} assignment={assignment} canManage={canManage} onOpen={() => void openAssignment(assignment)} />)}
        </div>
      ) : <CenterPanel><EmptyState title="No assignments in this view" description="Create focused work from ProfAI's SAT, IELTS, Writing, Speaking and vocabulary experiences." action={canManage ? <button type="button" onClick={() => setCreateOpen(true)} className={primaryButton}>Create first assignment</button> : undefined} /></CenterPanel>}
      <CreateAssignmentModal open={createOpen} onClose={() => setCreateOpen(false)} slug={slug} groups={groups.data?.groups ?? []} students={students.data?.students ?? []} onDone={() => { setCreateOpen(false); void refetch() }} />
    </div>
  )
}

function AssignmentCard({ assignment, canManage, onOpen }: { assignment: CenterAssignment; canManage: boolean; onOpen: () => void }) {
  const total = assignment.submissions.length || 1
  const completePercent = Math.round((assignment.pipeline.completed / total) * 100)
  const Icon = assignment.kind === 'WRITING' ? FileText : assignment.kind === 'SPEAKING' ? Mic2 : BookOpenCheck
  return (
    <CenterPanel className="p-5 sm:p-6">
      <div className="flex items-start gap-4"><span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${assignment.examTrack === 'SAT' ? 'bg-violet-100 text-violet-700' : 'bg-red-100 text-red-700'}`}><Icon className="h-6 w-6" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-slate-500">{assignment.examTrack} · {assignment.kind}</span>{assignment.pipeline.overdue ? <span className="rounded-full bg-red-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-red-600">{assignment.pipeline.overdue} overdue</span> : null}</div><h2 className="mt-2 truncate text-lg font-black text-slate-950">{assignment.title}</h2><p className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-slate-500">{assignment.description || 'Focused ProfAI practice assignment.'}</p></div></div>
      <div className="mt-5 grid grid-cols-4 gap-2"><Pipeline label="Assigned" value={assignment.pipeline.assigned} /><Pipeline label="Working" value={assignment.pipeline.inProgress} tone="blue" /><Pipeline label="Done" value={assignment.pipeline.completed} tone="green" /><Pipeline label="Overdue" value={assignment.pipeline.overdue} tone="red" /></div>
      <div className="mt-4"><div className="flex justify-between text-[10px] font-bold text-slate-500"><span>Completion</span><span>{completePercent}%</span></div><div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500" style={{ width: `${completePercent}%` }} /></div></div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4"><div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-500"><span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{assignment.group?.name ?? 'Individual'}</span><span className="flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5" />Due {new Date(assignment.dueAt).toLocaleDateString()}</span>{assignment.targetScore ? <span className="flex items-center gap-1.5"><Target className="h-3.5 w-3.5" />{assignment.targetScore}</span> : null}</div>{!canManage ? <button type="button" onClick={onOpen} className={primaryButton}>Open assignment</button> : <span className="text-[10px] font-bold text-slate-400">Created by {assignment.createdBy.fullName}</span>}</div>
      {canManage && assignment.submissions.length ? <div className="mt-4 flex -space-x-2">{assignment.submissions.slice(0, 8).map((submission) => <Avatar key={submission.id} name={submission.student.fullName} url={submission.student.avatarUrl} size="sm" />)}{assignment.submissions.length > 8 ? <span className="grid h-8 w-8 place-items-center rounded-xl bg-slate-900 text-[9px] font-black text-white ring-2 ring-white">+{assignment.submissions.length - 8}</span> : null}</div> : null}
    </CenterPanel>
  )
}

function Pipeline({ label, value, tone = 'default' }: { label: string; value: number; tone?: 'default' | 'blue' | 'green' | 'red' }) {
  const color = tone === 'blue' ? 'text-blue-700 bg-blue-50' : tone === 'green' ? 'text-emerald-700 bg-emerald-50' : tone === 'red' ? 'text-red-700 bg-red-50' : 'text-slate-700 bg-slate-50'
  return <div className={`rounded-xl p-2.5 text-center ${color}`}><p className="text-lg font-black">{value}</p><p className="text-[8px] font-black uppercase tracking-wider opacity-70">{label}</p></div>
}

function CreateAssignmentModal({ open, onClose, slug, groups, students, onDone }: { open: boolean; onClose: () => void; slug: string; groups: Array<{ id: string; name: string; examTrack: CenterExamTrack }>; students: Array<{ id: string; fullName: string }>; onDone: () => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [kind, setKind] = useState<CenterAssignment['kind']>('TEST')
  const [examTrack, setExamTrack] = useState<CenterExamTrack>('SAT')
  const [audience, setAudience] = useState<'GROUP' | 'STUDENT'>('GROUP')
  const [audienceId, setAudienceId] = useState('')
  const [routePath, setRoutePath] = useState('/sat')
  const [targetScore, setTargetScore] = useState('')
  const [dueAt, setDueAt] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  function chooseTrack(value: CenterExamTrack) { setExamTrack(value); setRoutePath(value === 'IELTS' ? '/ielts' : '/sat') }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError('')
    try {
      await learningCenterApi.createAssignment(slug, { title, description: description || undefined, kind, examTrack, routePath, targetScore: targetScore || undefined, dueAt: new Date(dueAt).toISOString(), ...(audience === 'GROUP' ? { groupId: audienceId } : { studentId: audienceId }) })
      onDone()
    } catch (submitError) { setError(submitError instanceof Error ? submitError.message : 'Could not create assignment.') }
    finally { setBusy(false) }
  }
  return <Modal open={open} onClose={onClose} title="Create an assignment" description="Translate an insight into measurable student action."><form onSubmit={submit} className="space-y-4"><label className="block"><span className="mb-1.5 block text-xs font-black text-slate-700">Assignment title</span><input required value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} placeholder="30 Advanced Math Questions" /></label><label className="block"><span className="mb-1.5 block text-xs font-black text-slate-700">Teacher brief</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={2} className={`${inputClass} h-auto py-3`} placeholder="Focus on geometry errors from the last diagnostic." /></label><div className="grid gap-3 sm:grid-cols-2"><label><span className="mb-1.5 block text-xs font-black text-slate-700">Track</span><select value={examTrack} onChange={(event) => chooseTrack(event.target.value as CenterExamTrack)} className={inputClass}><option value="SAT">SAT</option><option value="IELTS">IELTS</option><option value="BOTH">Both</option></select></label><label><span className="mb-1.5 block text-xs font-black text-slate-700">Type</span><select value={kind} onChange={(event) => setKind(event.target.value as CenterAssignment['kind'])} className={inputClass}><option value="TEST">Full test</option><option value="PRACTICE">Practice</option><option value="WRITING">Writing</option><option value="SPEAKING">Speaking</option><option value="VOCABULARY">Vocabulary</option></select></label></div><div className="grid gap-3 sm:grid-cols-[.55fr_1fr]"><label><span className="mb-1.5 block text-xs font-black text-slate-700">Audience</span><select value={audience} onChange={(event) => { setAudience(event.target.value as 'GROUP' | 'STUDENT'); setAudienceId('') }} className={inputClass}><option value="GROUP">Group</option><option value="STUDENT">One student</option></select></label><label><span className="mb-1.5 block text-xs font-black text-slate-700">Select {audience.toLowerCase()}</span><select required value={audienceId} onChange={(event) => setAudienceId(event.target.value)} className={inputClass}><option value="">Choose...</option>{audience === 'GROUP' ? groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>) : students.map((student) => <option key={student.id} value={student.id}>{student.fullName}</option>)}</select></label></div><label className="block"><span className="mb-1.5 block text-xs font-black text-slate-700">ProfAI destination</span><input required value={routePath} onChange={(event) => setRoutePath(event.target.value)} className={inputClass} placeholder="/sat or /ielts/writing/tests" /></label><div className="grid gap-3 sm:grid-cols-2"><label><span className="mb-1.5 block text-xs font-black text-slate-700">Deadline</span><input required type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} className={inputClass} /></label><label><span className="mb-1.5 block text-xs font-black text-slate-700">Target score</span><input value={targetScore} onChange={(event) => setTargetScore(event.target.value)} className={inputClass} placeholder={examTrack === 'SAT' ? '1400' : '7.0'} /></label></div>{error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{error}</p> : null}<div className="flex justify-end gap-2"><button type="button" onClick={onClose} className={secondaryButton}>Cancel</button><button disabled={busy} className={primaryButton}><Plus className="h-4 w-4" />{busy ? 'Publishing...' : 'Publish assignment'}</button></div></form></Modal>
}
