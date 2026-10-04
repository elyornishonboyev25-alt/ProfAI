import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, BookOpen, Building2, GraduationCap, Link2, MapPin, Plus, Search, ShieldCheck, Users, X } from 'lucide-react'
import { BrandMark } from '@/components/brand/BrandLogo'
import { useAsyncData } from '@/hooks/useAsyncData'
import { learningCenterApi } from '@/features/learningCenter/api'
import { CenterPanel, EmptyState, ErrorState, inputClass, Modal, primaryButton, secondaryButton } from '@/features/learningCenter/components'
import type { CenterWorkspace } from '@/features/learningCenter/types'
import { useAuthStore } from '@/store/authStore'
import ClassCoverEditor from '@/features/learningCenter/ClassCoverEditor'
import '@/features/learningCenter/learning-center.css'
import '@/features/learningCenter/portal.css'

type ClassView = 'all' | 'teaching' | 'learning'
const roleLabels = { OWNER: 'Owner', ADMIN: 'Administrator', TEACHER: 'Teacher', STUDENT: 'Student' }

export default function LearningCenterPortal() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [open, setOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<ClassView>('all')
  const { data, loading, error, refetch } = useAsyncData(
    () => user ? learningCenterApi.workspaces() : Promise.resolve({ workspaces: [] }), [user?.id],
  )
  const workspaces = user ? data?.workspaces ?? [] : []
  const teachingCount = workspaces.filter((workspace) => workspace.role !== 'STUDENT').length
  const filtered = workspaces.filter((workspace) => (
    (view === 'all' || (view === 'teaching' ? workspace.role !== 'STUDENT' : workspace.role === 'STUDENT')) &&
    `${workspace.name} ${workspace.city ?? ''}`.toLowerCase().includes(search.trim().toLowerCase())
  ))
  const memberCount = workspaces.reduce((total, workspace) => total + workspace.memberCount, 0)
  const groupCount = workspaces.reduce((total, workspace) => total + workspace.groupCount, 0)
  const create = () => user ? setOpen(true) : navigate('/login', { state: { from: { pathname: '/learning-center' } } })
  const clearFilters = () => { setSearch(''); setView('all') }

  return (
    <div className="learning-center lc-portal workspace-page min-h-screen text-slate-900">
      {!user && <header className="lc-guest-header"><Link to="/dashboard" className="flex items-center gap-3" aria-label="ProfAI home"><BrandMark size={40} /><span className="text-xl font-black tracking-tight">Prof<span className="text-red-600">AI</span></span></Link><Link to="/dashboard" className={secondaryButton}>Student platform <ArrowUpRight className="h-4 w-4" /></Link></header>}
      <main className="lc-portal-main mx-auto max-w-[1640px] px-4 pb-20 pt-5 sm:px-6 lg:px-8 lg:pt-8">
        <header className="lc-portal-header">
          <div className="lc-portal-heading-copy">
            <span className="lc-eyebrow"><GraduationCap size={15} /> YOUR LEARNING SPACE</span>
            <h1>Your <span>classes</span></h1>
            <p>Your team, assignments and progress. All together.</p>
            {user && workspaces.length > 0 && <div className="lc-portal-summary" aria-label="Your class summary">
              <span><GraduationCap size={14} /><strong>{workspaces.length}</strong> {workspaces.length === 1 ? 'class' : 'classes'}</span>
              <span><Users size={14} /><strong>{memberCount}</strong> members</span>
              <span><BookOpen size={14} /><strong>{groupCount}</strong> {groupCount === 1 ? 'group' : 'groups'}</span>
            </div>}
          </div>
          <div className="lc-portal-actions">
            <button type="button" onClick={() => setJoinOpen(true)} className="lc-portal-button lc-portal-button-secondary"><Link2 size={17} /> Join class</button>
            <button type="button" onClick={create} className="lc-portal-button lc-portal-button-primary"><Plus size={18} /> Create class</button>
          </div>
        </header>

        <section aria-labelledby="classes-list-title" className="lc-portal-section">
          <h2 id="classes-list-title" className="sr-only">Your classrooms</h2>
          {workspaces.length > 0 && <div className="lc-portal-toolbar">
            <div className="lc-portal-filters" role="group" aria-label="Filter classes by your role">
              {([{ key: 'all', label: 'All classes', count: workspaces.length }, { key: 'teaching', label: 'Teaching', count: teachingCount }, { key: 'learning', label: 'Learning', count: workspaces.length - teachingCount }] as const).map((filter) => (
                <button key={filter.key} type="button" aria-pressed={view === filter.key} onClick={() => setView(filter.key)} className={view === filter.key ? 'is-active' : ''}>{filter.label}<span>{filter.count}</span></button>
              ))}
            </div>
            <label className="lc-portal-search"><Search size={18} /><input type="search" aria-label="Search classes" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or city" />{search && <button type="button" aria-label="Clear search" onClick={() => setSearch('')}><X size={16} /></button>}</label>
          </div>}

          {loading && user ? <div className="lc-portal-card-grid" role="status" aria-label="Loading your classes">{Array.from({ length: 3 }, (_, index) => <div key={index} className="lc-portal-skeleton animate-pulse"><div /><span /><span /><span /></div>)}</div> : error && user ? <ErrorState message={error} onRetry={() => void refetch()} /> : workspaces.length ? (
            filtered.length ? <div className="lc-portal-card-grid">
              {filtered.map((workspace) => <ClassCard key={workspace.id} workspace={workspace} />)}
              {!search.trim() && view !== 'learning' && <button type="button" onClick={create} className="lc-portal-create-card"><span><Plus size={26} /></span><strong>Create a classroom</strong><small>A new space for your next goal.</small><span className="lc-portal-create-label">Get started <ArrowRight size={16} /></span></button>}
            </div> : <CenterPanel><EmptyState title="No matching classes" description="Try another name, city or role filter." action={<button type="button" onClick={clearFilters} className={secondaryButton}>Reset filters <ArrowRight size={16} /></button>} /></CenterPanel>
          ) : <CenterPanel className="lc-portal-empty"><div className="lc-portal-empty-icon" aria-hidden="true"><Building2 size={32} /></div><span className="lc-eyebrow">YOUR NEXT CHAPTER</span><h3>{user ? 'Start with your first classroom' : 'Your classroom is one step away'}</h3><p>{user ? 'Create a class for your team, or join an existing one with your teacher’s invitation.' : 'Sign in to find your classes, meet your team and continue learning.'}</p><div className="lc-portal-empty-actions"><button type="button" onClick={create} className="lc-portal-button lc-portal-button-primary">{user ? <Plus size={18} /> : <ArrowRight size={18} />}{user ? 'Create your first class' : 'Sign in to get started'}</button><button type="button" onClick={() => setJoinOpen(true)} className="lc-portal-button lc-portal-button-secondary"><Link2 size={17} /> I have an invitation</button></div></CenterPanel>}
        </section>
        <footer className="lc-portal-footnote"><ShieldCheck size={15} /><span>Your team, assignments and results. Connected in every classroom.</span></footer>
      </main>
      {open && <CreateWorkspaceModal onClose={() => setOpen(false)} onCreated={(slug) => navigate(`/learning-center/${slug}`)} />}
      {joinOpen && <JoinWorkspaceModal onClose={() => setJoinOpen(false)} />}
    </div>
  )
}

function ClassCard({ workspace }: { workspace: CenterWorkspace }) {
  return (
    <Link to={`/learning-center/${workspace.slug}`} className="lc-portal-class-card" aria-label={`Open ${workspace.name} class`}>
      <div className="lc-portal-class-cover">
        {workspace.coverUrl ? <img src={workspace.coverUrl} alt="" loading="lazy" /> : <div className="lc-portal-class-art" aria-hidden="true"><span className="lc-class-art-ring" /><GraduationCap size={44} strokeWidth={1.4} /><span className="lc-class-art-wordmark">PROFAI CLASSROOM</span></div>}
        <span className="lc-portal-role"><ShieldCheck size={12} />{roleLabels[workspace.role]}</span>
      </div>
      <div className="lc-portal-class-body">
        <div className="lc-portal-class-title-row"><span className="lc-portal-class-initial" aria-hidden="true">{workspace.name.trim().charAt(0).toUpperCase() || 'C'}</span><span className="lc-portal-class-caption">YOUR CLASSROOM</span></div>
        <h3>{workspace.name}</h3>
        <p className="lc-portal-class-location"><MapPin size={14} />{workspace.city || 'Location not set'}</p>
        <div className="lc-portal-class-stats"><span><Users size={15} /><strong>{workspace.memberCount}</strong> {workspace.memberCount === 1 ? 'member' : 'members'}</span><span><BookOpen size={15} /><strong>{workspace.groupCount}</strong> {workspace.groupCount === 1 ? 'group' : 'groups'}</span></div>
        <div className="lc-portal-class-footer"><span>Open classroom</span><span className="lc-portal-card-arrow"><ArrowUpRight size={17} /></span></div>
      </div>
    </Link>
  )
}

function CreateWorkspaceModal({ onClose, onCreated }: { onClose: () => void; onCreated: (slug: string) => void }) {
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [coverPending, setCoverPending] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (busy || coverPending) return
    if (name.trim().length < 3) { setError('Enter a class name with at least 3 characters.'); return }
    setBusy(true); setError('')
    try {
      const response = await learningCenterApi.createWorkspace({ name: name.trim(), city: city.trim() || undefined, coverUrl, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Tashkent' })
      onCreated(response.workspace.slug)
    } catch (submitError) { setError(submitError instanceof Error ? submitError.message : 'Could not create class.') }
    finally { setBusy(false) }
  }
  return <Modal open onClose={onClose} busy={busy} title="Create a class" description="Give your class a name and a cover photo."><form onSubmit={submit} className="space-y-5"><label className="block"><span className="mb-2 block text-xs font-bold text-slate-700">Class name</span><input required minLength={3} maxLength={120} value={name} onChange={(event) => setName(event.target.value)} className={inputClass} placeholder="Oxford Academy" /></label><label className="block"><span className="mb-2 block text-xs font-bold text-slate-700">City <span className="font-normal text-slate-400">(optional)</span></span><input maxLength={100} value={city} onChange={(event) => setCity(event.target.value)} className={inputClass} placeholder="Tashkent" /></label><div><span className="mb-2 block text-xs font-bold text-slate-700">Class cover photo <span className="font-normal text-slate-400">(optional)</span></span><ClassCoverEditor value={coverUrl} onChange={setCoverUrl} onPendingChange={setCoverPending} onError={setError} /></div>{error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}<div className="flex justify-end gap-2"><button type="button" disabled={busy} onClick={onClose} className={secondaryButton}>Cancel</button><button disabled={busy || coverPending} className={primaryButton}>{busy ? 'Creating...' : 'Create class'}<ArrowRight className="h-4 w-4" /></button></div></form></Modal>
}

function JoinWorkspaceModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const [invitation, setInvitation] = useState('')
  const [error, setError] = useState('')
  function submit(event: React.FormEvent) {
    event.preventDefault()
    const code = invitation.trim().match(/(?:^|\/learning-center\/join\/)([A-Za-z0-9_-]+)\/?(?:[?#].*)?$/)?.[1]
    if (!code) { setError('Enter a valid invitation code or link.'); return }
    navigate(`/learning-center/join/${encodeURIComponent(code)}`)
  }
  return <Modal open onClose={onClose} title="Join a class" description="Paste the invitation link or code shared by your teacher."><form onSubmit={submit} className="space-y-4"><label className="block"><span className="mb-2 block text-xs font-bold text-slate-700">Invitation link or code</span><input required value={invitation} onChange={(event) => setInvitation(event.target.value)} className={inputClass} placeholder="Paste your invitation here" /></label>{error && <p role="alert" className="text-sm text-red-600">{error}</p>}<div className="flex justify-end gap-2"><button type="button" onClick={onClose} className={secondaryButton}>Cancel</button><button className={primaryButton}>Continue <ArrowRight className="h-4 w-4" /></button></div></form></Modal>
}
