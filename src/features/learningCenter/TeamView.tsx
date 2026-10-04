import { useState } from 'react'
import { Mail, Plus, Search, ShieldCheck, UserRoundCheck, Users } from 'lucide-react'
import { useAsyncData } from '@/hooks/useAsyncData'
import { learningCenterApi } from './api'
import { Avatar, CenterPageHeading, CenterPanel, CenterSkeleton, EmptyState, ErrorState, inputClass, InvitationLink, Modal, primaryButton, secondaryButton } from './components'
import type { CenterRole } from './types'

export default function TeamView({ slug, canManage }: { slug: string; canManage: boolean }) {
  const [open, setOpen] = useState(false)
  const [roleError, setRoleError] = useState('')
  const [search, setSearch] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)
  const { data, loading, error, refetch } = useAsyncData(() => learningCenterApi.team(slug), [slug])
  const adminCount = data?.team.filter((member) => member.role === 'ADMIN').length ?? 0
  const members = data?.team.filter((member) => `${member.user.fullName} ${member.user.nickname ?? ''} ${member.user.email ?? ''}`.toLowerCase().includes(search.trim().toLowerCase())) ?? []
  return <div className="space-y-6">
    <CenterPageHeading eyebrow="Class people" title="Members" description="Everyone in this class can see its members. Only the owner can add people or assign roles." action={canManage ? <button type="button" onClick={() => setOpen(true)} className={primaryButton}><Plus className="h-4 w-4" /> Add member</button> : undefined} />
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="flex items-center gap-2 text-sm font-semibold text-slate-500"><Users className="h-4 w-4 text-red-700" />{data?.team.length ?? 0} members{canManage ? ` · ${adminCount} of 2 administrator places used` : ''}</p>
      <label className="relative w-full sm:w-72"><Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search members..." aria-label="Search members" className={`${inputClass} pl-10`} /></label>
    </div>
    {roleError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{roleError}</p>}
    {loading && !data ? <CenterSkeleton blocks={6} /> : error ? <ErrorState message={error} onRetry={() => void refetch()} /> : members.length ? <div className="space-y-3">{members.map((member) => <CenterPanel key={member.id} className="p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-4 sm:gap-5">
        <Avatar name={member.user.fullName} url={member.user.avatarUrl} size="lg" />
        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="break-words text-base font-bold text-slate-950 sm:text-lg">{member.user.fullName}</h2><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${member.role === 'OWNER' ? 'bg-slate-100 text-slate-700' : member.role === 'ADMIN' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{member.role}</span></div><p className="mt-1 text-xs font-semibold text-slate-500">{member.user.nickname ? `@${member.user.nickname}` : 'ProfAI member'}</p>{member.user.email && <p className="mt-1 flex items-center gap-1.5 break-all text-xs text-slate-500"><Mail className="h-3.5 w-3.5 shrink-0" />{member.user.email}</p>}</div>
        <div className="flex min-w-[8rem] flex-col gap-1 text-xs text-slate-500"><span><strong className="text-sm text-slate-900">{member.groupCount}</strong> assigned groups</span><span>Joined {new Date(member.joinedAt).toLocaleDateString()}</span></div>
        {canManage && member.role !== 'OWNER' && <label className="w-full text-xs font-bold text-slate-600 sm:w-44">Role<select aria-label={`Role for ${member.user.fullName}`} value={member.role} disabled={savingId !== null} className={`${inputClass} mt-1`} onChange={async (event) => { setRoleError(''); setSavingId(member.id); try { await learningCenterApi.updateMemberRole(slug, member.id, event.target.value as 'ADMIN' | 'TEACHER' | 'STUDENT'); await refetch() } catch (failure) { setRoleError(failure instanceof Error ? failure.message : 'Could not update role.') } finally { setSavingId(null) } }}><option value="STUDENT">Student</option><option value="TEACHER">Teacher</option><option value="ADMIN" disabled={adminCount >= 2 && member.role !== 'ADMIN'}>Administrator</option></select></label>}
      </div>
    </CenterPanel>)}</div> : <CenterPanel><EmptyState title={search ? 'No matching members' : 'No members yet'} description={search ? 'Try another name or nickname.' : 'The class owner can add people using email or nickname.'} /></CenterPanel>}
    {open && <InviteTeamModal open={open} onClose={() => setOpen(false)} slug={slug} onDone={() => { setOpen(false); void refetch() }} />}
  </div>
}

function InviteTeamModal({ open, onClose, slug, onDone }: { open: boolean; onClose: () => void; slug: string; onDone: () => void }) {
  const [email, setEmail] = useState('')
  const [nickname, setNickname] = useState('')
  const [role, setRole] = useState<Exclude<CenterRole, 'OWNER'>>('STUDENT')
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [invitePath, setInvitePath] = useState('')
  async function submit(event: React.FormEvent) { event.preventDefault(); if (busy) return; if (email && nickname) { setError('Use an email or a nickname.'); return }; setBusy(true); setError(''); try { const response = await learningCenterApi.invite(slug, { email: email || undefined, nickname: nickname || undefined, role, title: title || undefined }); if (response.status === 'MEMBER_ADDED') onDone(); else setInvitePath(response.invitation?.joinPath ?? '') } catch (submitError) { setError(submitError instanceof Error ? submitError.message : 'Could not invite member.') } finally { setBusy(false) } }
  const link = invitePath ? `${window.location.origin}${invitePath}` : ''
  return <Modal open={open} onClose={onClose} busy={busy} title="Add a member" description="Add an existing ProfAI user by email or nickname. A student can also join themselves with an invitation.">{invitePath ? <InvitationLink link={link} /> : <form onSubmit={submit} className="space-y-4"><label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-700">Gmail or email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} placeholder="student@gmail.com" /></label><label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-700">Nickname</span><input value={nickname} onChange={(event) => setNickname(event.target.value)} className={inputClass} placeholder="@nickname" /></label><div className="grid gap-3 sm:grid-cols-2"><label><span className="mb-1.5 block text-xs font-bold text-slate-700">Class role</span><select value={role} onChange={(event) => setRole(event.target.value as typeof role)} className={inputClass}><option value="STUDENT">Student</option><option value="TEACHER">Teacher</option><option value="ADMIN">Administrator</option></select></label><label><span className="mb-1.5 block text-xs font-bold text-slate-700">Title (optional)</span><input value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} placeholder="SAT Teacher" /></label></div><div className="rounded-2xl border border-red-100 bg-red-50/70 p-4"><div className="flex gap-3"><ShieldCheck className="h-5 w-5 shrink-0 text-red-700" /><p className="text-xs font-semibold leading-5 text-red-800">Only the owner can add members and assign up to two administrators. Leave email and nickname empty to create a student invitation link.</p></div></div>{error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{error}</p> : null}<div className="flex justify-end gap-2"><button type="button" disabled={busy} onClick={onClose} className={secondaryButton}>Cancel</button><button disabled={busy} className={primaryButton}><UserRoundCheck className="h-4 w-4" />{busy ? 'Adding...' : 'Add member'}</button></div></form>}</Modal>
}
