import { useCopy } from '@/i18n/interface'
import UiText from '@/components/common/UiText'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { ArrowRight, ChevronLeft, ChevronRight, RefreshCw, Search, UserPlus, Users } from 'lucide-react'
import { useAsyncData } from '@/hooks/useAsyncData'
import { learningCenterApi } from './api'
import { Avatar, CenterPageHeading, CenterPanel, CenterSkeleton, EmptyState, ErrorState, inputClass, InvitationLink, Modal, primaryButton, secondaryButton, StatusBadge } from './components'
import { ExamScores, ResultDate, ResultScore, skillLabel } from './resultPresentation'

export default function StudentsView({ slug, canManage }: { slug: string; canManage: boolean }) {
  const { c: uiCopy } = useCopy()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('search') ?? ''
  const [draftSearch, setDraftSearch] = useState(search)
  const exam = searchParams.get('exam') ?? ''
  const status = searchParams.get('status') ?? ''
  const groupId = searchParams.get('groupId') ?? ''
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const pageSize = [25, 50, 100].includes(Number(searchParams.get('pageSize'))) ? Number(searchParams.get('pageSize')) : 25
  const [inviteOpen, setInviteOpen] = useState(false)
  const setFilter = useCallback((key: string, value: string) => {
    setSearchParams(previous => {
      const next = new URLSearchParams(previous)
      if (value) next.set(key, value); else next.delete(key)
      if (key !== 'page') next.delete('page')
      return next
    }, { replace: key === 'search' })
  }, [setSearchParams])
  useEffect(() => { setDraftSearch(search) }, [search])
  useEffect(() => {
    if (draftSearch === search) return
    const timer = window.setTimeout(() => setFilter('search', draftSearch.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [draftSearch, search, setFilter])
  const { data, loading, error, refetch } = useAsyncData(
    () => learningCenterApi.students(slug, { search, exam, status, groupId, days: 0, page, pageSize }),
    [slug, search, exam, status, groupId, page, pageSize],
  )
  const groups = useAsyncData(() => learningCenterApi.groupOptions(slug), [slug])
  const pagination = data?.pagination ?? { total: data?.students.length ?? 0, page: 1, pages: 1, pageSize }
  const from = location.pathname + location.search
  const filtered = Boolean(search || exam || status || groupId)

  return (
    <div className="lc-directory space-y-5">
      <CenterPageHeading eyebrow="Learner progress" title={uiCopy('Students')} description={uiCopy('See each learner’s latest test, score and next step. IELTS and SAT stay on their own scales.')} action={canManage ? <button type="button" onClick={() => setInviteOpen(true)} className={primaryButton}><UserPlus className="h-4 w-4" /><UiText text="Add student" /></button> : undefined} />
      <CenterPanel className="p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(15rem,1.6fr)_repeat(3,minmax(9rem,1fr))]">
          <label className="relative"><span className="sr-only"><UiText text="Search students" /></span><Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" /><input type="search" maxLength={120} value={draftSearch} onChange={event => setDraftSearch(event.target.value)} aria-label={uiCopy('Search students')} placeholder={uiCopy('Search name, nickname or email')} className={`${inputClass} pl-10`} /></label>
          <select aria-label={uiCopy('Filter exam')} value={exam} onChange={event => setFilter('exam', event.target.value)} className={inputClass}><option value=""><UiText text="All exams" /></option><option value="IELTS">IELTS</option><option value="SAT">SAT</option><option value="BOTH"><UiText text="Both tracks" /></option></select>
          <select aria-label={uiCopy('Filter group')} value={groupId} onChange={event => setFilter('groupId', event.target.value)} className={inputClass}><option value=""><UiText text="All groups" /></option>{groups.data?.groups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}</select>
          <select aria-label={uiCopy('Filter status')} value={status} onChange={event => setFilter('status', event.target.value)} className={inputClass}><option value=""><UiText text="All signals" /></option><option value="ON_TRACK"><UiText text="On track" /></option><option value="WATCH"><UiText text="Watch" /></option><option value="NEEDS_ATTENTION"><UiText text="Needs attention" /></option></select>
        </div>
        {groups.error && <p role="alert" className="mt-3 text-xs text-red-700"><UiText text="Groups could not be loaded." /> <button type="button" onClick={() => void groups.refetch()} className="font-bold underline"><UiText text="Try again" /></button></p>}
        {filtered && <button type="button" className="mt-3 text-xs font-bold text-red-700 underline" onClick={() => { setDraftSearch(''); setSearchParams({}) }}><UiText text="Reset filters" /></button>}
      </CenterPanel>
      {loading && !data ? <CenterSkeleton blocks={4} /> : error ? <ErrorState message={error} onRetry={() => void refetch()} /> : <CenterPanel>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 px-5 py-4">
          <div className="flex items-center gap-2"><Users className="h-5 w-5 text-red-700" /><h2 className="font-bold text-slate-950"><UiText text="Student directory" /></h2><span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-bold text-slate-600">{pagination.total}</span></div>
          <button type="button" disabled={loading} className={secondaryButton} onClick={() => void refetch()}><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /><UiText text="Refresh" /></button>
        </div>
        {data?.students.length ? <>
          <div className="lc-directory-table-wrap"><table className="lc-directory-table">
            <caption className="sr-only"><UiText text="Student directory" /></caption>
            <thead><tr>{['Student', 'Latest test', 'Latest result', 'Exam scores', 'Assignments', 'Activity', 'Progress'].map(label => <th key={label} scope="col"><UiText text={label} /></th>)}</tr></thead>
            <tbody>{data.students.map(student => <tr key={student.id}>
              <td className="lc-directory-identity"><Link to={`/learning-center/${slug}/students/${student.id}`} state={{ from }} className="flex min-w-0 items-center gap-3"><Avatar name={student.fullName} url={student.avatarUrl} /><div className="min-w-0"><strong className="block break-words text-sm text-slate-950">{student.fullName}</strong><span className="mt-1 block break-all text-xs text-slate-500">{student.nickname ? `@${student.nickname}` : student.email}</span>{student.nickname && student.email && <span className="mt-1 block break-all text-[11px] text-slate-500">{student.email}</span>}</div></Link>{student.groups?.length ? <p className="mt-2 text-[11px] text-slate-500">{student.groups.map(group => group.name).join(' · ')}</p> : null}</td>
              <td><span className="lc-mobile-label"><UiText text="Latest test" /></span>{student.latestResult ? <div><p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-red-700">{student.latestResult.examType} · {skillLabel(student.latestResult.skill)}</p><p className="break-words text-xs font-semibold leading-5 text-slate-800">{student.latestResult.title}</p><p className="mt-1 text-[11px] text-slate-500"><ResultDate date={student.latestResult.completedAt} /></p></div> : <span className="text-xs text-slate-500"><UiText text="No test results yet." /></span>}</td>
              <td><span className="lc-mobile-label"><UiText text="Latest result" /></span>{student.latestResult ? <ResultScore result={student.latestResult} /> : <span className="text-slate-400">—</span>}</td>
              <td><span className="lc-mobile-label"><UiText text="Exam scores" /></span><ExamScores student={student} /></td>
              <td><span className="lc-mobile-label"><UiText text="Assignments" /></span>{student.assignmentTotal ? <div><strong className="text-sm text-slate-800">{student.assignmentsCompleted ?? 0} / {student.assignmentTotal}</strong><div className="mt-2 h-1.5 w-20 max-w-full overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-red-600" style={{ width: `${student.completionRate}%` }} /></div></div> : <span className="text-xs text-slate-500"><UiText text="No assignments" /></span>}</td>
              <td><span className="lc-mobile-label"><UiText text="Activity" /></span><StatusBadge status={student.status} />{student.activityNote && <p className="mt-2 text-[11px] text-slate-500"><UiText text={student.activityNote} /></p>}<p className="mt-2 text-[11px] text-slate-500"><UiText text="{{count}} saved attempts" values={{ count: student.attempts }} /></p>{student.pendingAttempts ? <p className="mt-1 text-[11px] font-semibold text-amber-700"><UiText text="{{count}} without verified scores" values={{ count: student.pendingAttempts }} /></p> : null}</td>
              <td className="lc-directory-action"><Link to={`/learning-center/${slug}/students/${student.id}`} state={{ from }} aria-label={uiCopy("Open {{value1}}'s progress", { value1: student.fullName })} className="inline-flex min-h-10 items-center gap-1.5 text-xs font-bold text-red-700"><UiText text="View progress" /><ArrowRight className="h-4 w-4" /></Link></td>
            </tr>)}</tbody>
          </table></div>
          <div className="lc-directory-footer">
            <p role="status" className="text-xs font-semibold text-slate-500"><UiText text="{{start}}–{{end}} of {{total}} students" values={{ start: (pagination.page - 1) * pagination.pageSize + 1, end: Math.min(pagination.page * pagination.pageSize, pagination.total), total: pagination.total }} /></p>
            <div className="flex flex-wrap items-center gap-2"><select aria-label={uiCopy('Students per page')} value={pageSize} onChange={event => setFilter('pageSize', event.target.value)} className={`${inputClass} !w-auto !text-xs`}>{[25, 50, 100].map(size => <option key={size} value={size}>{uiCopy('{{count}} per page', { count: size })}</option>)}</select><button type="button" aria-label={uiCopy('Previous page')} disabled={loading || pagination.page <= 1} className={secondaryButton} onClick={() => setFilter('page', String(pagination.page - 1))}><ChevronLeft className="h-4 w-4" /></button><span className="px-1 text-xs font-bold text-slate-600">{pagination.page} / {pagination.pages}</span><button type="button" aria-label={uiCopy('Next page')} disabled={loading || pagination.page >= pagination.pages} className={secondaryButton} onClick={() => setFilter('page', String(pagination.page + 1))}><ChevronRight className="h-4 w-4" /></button></div>
          </div>
        </> : <EmptyState title={uiCopy('No students match these filters')} description={uiCopy('Adjust filters or add a learner using their Ivygoo account email or an invitation link.')} />}
      </CenterPanel>}
      <p className="px-1 text-xs leading-5 text-slate-500"><UiText text="Only verified scores affect progress. Profile scores, section estimates and practice percentages are labelled separately." /></p>
      {inviteOpen && <InviteStudentModal open={inviteOpen} onClose={() => setInviteOpen(false)} slug={slug} groups={groups.data?.groups ?? []} onDone={() => { setInviteOpen(false); void refetch() }} />}
    </div>
  )
}

function InviteStudentModal({ open, onClose, slug, groups, onDone }: { open: boolean; onClose: () => void; slug: string; groups: Array<{ id: string; name: string }>; onDone: () => void }) {
  const { c: uiCopy } = useCopy()
  const [email, setEmail] = useState('')
  const [groupId, setGroupId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [invitePath, setInvitePath] = useState('')
  const absoluteLink = useMemo(() => invitePath ? `${window.location.origin}${invitePath}` : '', [invitePath])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (busy) return
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
    <Modal open={open} onClose={onClose} busy={busy} title={uiCopy("Add a student")} description={uiCopy("Connect an existing Ivygoo learner or create a secure seven-day invitation link.")}>
      {invitePath ? <InvitationLink link={absoluteLink} /> : (
        <form onSubmit={submit} className="space-y-4">
          <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-700"><UiText text={"Student email"} /> <span className="font-semibold text-slate-400"><UiText text={"(optional for open link)"} /></span></span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} placeholder="student@example.com" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-700"><UiText text={"Assign to group"} /></span><select aria-label={uiCopy("Filter group")} value={groupId} onChange={(event) => setGroupId(event.target.value)} className={inputClass}><option value=""><UiText text={"No group yet"} /></option>{groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label>
          {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{error}</p> : null}
          <div className="flex justify-end gap-2"><button type="button" disabled={busy} onClick={onClose} className={secondaryButton}><UiText text={"Cancel"} /></button><button disabled={busy} className={primaryButton}><UserPlus className="h-4 w-4" />{busy ? <UiText text={"Connecting..."} /> : <UiText text={"Add or invite"} />}</button></div>
        </form>
      )}
    </Modal>
  )
}
