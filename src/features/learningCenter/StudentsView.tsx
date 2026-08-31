import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Copy, Search, UserPlus, Users } from 'lucide-react'
import { useAsyncData } from '@/hooks/useAsyncData'
import { learningCenterApi } from './api'
import { Avatar, CenterPageHeading, CenterPanel, CenterSkeleton, EmptyState, ErrorState, inputClass, Modal, primaryButton, secondaryButton, StatusBadge, Trend } from './components'

export default function StudentsView({ slug, canManage }: { slug: string; canManage: boolean }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [exam, setExam] = useState('')
  const [status, setStatus] = useState(searchParams.get('status') ?? '')
  const [groupId, setGroupId] = useState(searchParams.get('groupId') ?? '')
  const [inviteOpen, setInviteOpen] = useState(false)
  const { data, loading, error, refetch } = useAsyncData(
    () => learningCenterApi.students(slug, { search, exam, status, groupId, days: 180 }),
    [slug, search, exam, status, groupId],
  )
  const groups = useAsyncData(() => learningCenterApi.groups(slug), [slug])

  return (
    <div className="space-y-6">
      <CenterPageHeading eyebrow="Student intelligence" title="Every learner, clearly understood" description="Track score trajectory, skill gaps, engagement and assignment delivery without switching tools." action={canManage ? <button type="button" onClick={() => setInviteOpen(true)} className={primaryButton}><UserPlus className="h-4 w-4" /> Add student</button> : undefined} />

      <CenterPanel className="p-3 sm:p-4">
        <div className="grid gap-2 md:grid-cols-[minmax(14rem,1fr)_repeat(3,minmax(9rem,.45fr))]">
          <label className="relative"><Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search students..." className={`${inputClass} pl-10`} /></label>
          <select value={exam} onChange={(event) => setExam(event.target.value)} className={inputClass}><option value="">All exams</option><option value="SAT">SAT</option><option value="IELTS">IELTS</option><option value="BOTH">Both tracks</option></select>
          <select value={groupId} onChange={(event) => setGroupId(event.target.value)} className={inputClass}><option value="">All groups</option>{groups.data?.groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className={inputClass}><option value="">All signals</option><option value="ON_TRACK">On track</option><option value="WATCH">Watch</option><option value="NEEDS_ATTENTION">Needs attention</option></select>
        </div>
      </CenterPanel>

      {loading && !data ? <CenterSkeleton blocks={8} /> : error && !data ? <ErrorState message={error} onRetry={() => void refetch()} /> : (
        <CenterPanel>
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div className="flex items-center gap-2"><Users className="h-5 w-5 text-blue-600" /><h2 className="font-black text-slate-950">Student directory</h2></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">{data?.students.length ?? 0} learners</span></div>
          {data?.students.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead><tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-black uppercase tracking-[.13em] text-slate-400"><th className="px-5 py-3">Student</th><th className="px-4 py-3">Current score</th><th className="px-4 py-3">Target</th><th className="px-4 py-3">Growth</th><th className="px-4 py-3">Assignments</th><th className="px-4 py-3">Signal</th><th className="px-5 py-3" /></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {data.students.map((student) => (
                    <tr key={student.id} onClick={() => navigate(`/learning-center/${slug}/students/${student.id}`)} className="group cursor-pointer transition hover:bg-blue-50/40">
                      <td className="px-5 py-4"><div className="flex items-center gap-3"><Avatar name={student.fullName} url={student.avatarUrl} /><div><p className="text-sm font-black text-slate-900">{student.fullName}</p><p className="mt-0.5 text-[11px] font-semibold text-slate-400">{student.attempts} tests · {student.currentStreak} day streak</p></div></div></td>
                      <td className="px-4 py-4"><Score student={student} /></td>
                      <td className="px-4 py-4 text-sm font-black text-slate-700">{student.targetSat ? `SAT ${student.targetSat}` : student.targetIelts ? `IELTS ${student.targetIelts}` : student.targetScore ?? 'Not set'}</td>
                      <td className="px-4 py-4"><Trend value={student.improvement} /></td>
                      <td className="px-4 py-4"><div className="w-28"><div className="flex justify-between text-[10px] font-bold text-slate-500"><span>Completion</span><span>{student.completionRate}%</span></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${student.completionRate}%` }} /></div></div></td>
                      <td className="px-4 py-4"><StatusBadge status={student.status} /></td>
                      <td className="px-5 py-4"><ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyState title="No students match these filters" description="Adjust filters or add a learner using their ProfAI account email or an invitation link." action={canManage ? <button type="button" onClick={() => setInviteOpen(true)} className={primaryButton}>Add first student</button> : undefined} />}
        </CenterPanel>
      )}

      <InviteStudentModal open={inviteOpen} onClose={() => setInviteOpen(false)} slug={slug} groups={groups.data?.groups ?? []} onDone={() => { setInviteOpen(false); void refetch() }} />
    </div>
  )
}

function Score({ student }: { student: NonNullable<Awaited<ReturnType<typeof learningCenterApi.students>>>['students'][number] }) {
  if (student.currentSat) return <div><p className="text-lg font-black text-slate-950">{student.currentSat}</p><p className="text-[10px] font-bold uppercase tracking-wider text-violet-500">SAT</p></div>
  if (student.currentIelts) return <div><p className="text-lg font-black text-slate-950">{student.currentIelts.toFixed(1)}</p><p className="text-[10px] font-bold uppercase tracking-wider text-red-500">IELTS</p></div>
  return <span className="text-xs font-bold text-slate-400">Baseline pending</span>
}

function InviteStudentModal({ open, onClose, slug, groups, onDone }: { open: boolean; onClose: () => void; slug: string; groups: Array<{ id: string; name: string }>; onDone: () => void }) {
  const [email, setEmail] = useState('')
  const [groupId, setGroupId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [invitePath, setInvitePath] = useState('')
  const absoluteLink = useMemo(() => invitePath ? `${window.location.origin}${invitePath}` : '', [invitePath])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true); setError('')
    try {
      const response = await learningCenterApi.invite(slug, { email: email || undefined, groupId: groupId || undefined, role: 'STUDENT' })
      if (response.status === 'MEMBER_ADDED') onDone()
      else setInvitePath(response.invitation?.joinPath ?? '')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not add student.')
    } finally { setBusy(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add a student" description="Connect an existing ProfAI learner or create a secure seven-day invitation link.">
      {invitePath ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-xs font-black uppercase tracking-wider text-emerald-700">Invitation ready</p><p className="mt-2 break-all text-sm font-semibold text-emerald-900">{absoluteLink}</p><button type="button" onClick={() => void navigator.clipboard.writeText(absoluteLink)} className={`${secondaryButton} mt-4`}><Copy className="h-4 w-4" /> Copy secure link</button></div> : (
        <form onSubmit={submit} className="space-y-4">
          <label className="block"><span className="mb-1.5 block text-xs font-black text-slate-700">Student email <span className="font-semibold text-slate-400">(optional for open link)</span></span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} placeholder="student@example.com" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-black text-slate-700">Assign to group</span><select value={groupId} onChange={(event) => setGroupId(event.target.value)} className={inputClass}><option value="">No group yet</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label>
          {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{error}</p> : null}
          <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className={secondaryButton}>Cancel</button><button disabled={busy} className={primaryButton}><UserPlus className="h-4 w-4" />{busy ? 'Connecting...' : 'Add or invite'}</button></div>
        </form>
      )}
    </Modal>
  )
}
