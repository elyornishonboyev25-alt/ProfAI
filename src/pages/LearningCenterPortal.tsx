import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, BookOpen, Building2, ClipboardCheck, GraduationCap, Link2, MapPin, Plus, Search, ShieldCheck, Sparkles, Users } from 'lucide-react'
import { BrandMark } from '@/components/brand/BrandLogo'
import { useAsyncData } from '@/hooks/useAsyncData'
import { learningCenterApi } from '@/features/learningCenter/api'
import { CenterPanel, CenterSkeleton, EmptyState, ErrorState, inputClass, Modal, primaryButton, secondaryButton } from '@/features/learningCenter/components'
import { useAuthStore } from '@/store/authStore'
import ClassCoverEditor from '@/features/learningCenter/ClassCoverEditor'
import '@/features/learningCenter/learning-center.css'
import '@/features/learningCenter/portal.css'

export default function LearningCenterPortal() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [open, setOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)
  const [search, setSearch] = useState('')
  const { data, loading, error, refetch } = useAsyncData(
    () => user ? learningCenterApi.workspaces() : Promise.resolve({ workspaces: [] }), [user?.id],
  )
  const workspaces = user ? data?.workspaces ?? [] : []
  const filtered = workspaces.filter((workspace) => `${workspace.name} ${workspace.city ?? ''}`.toLowerCase().includes(search.trim().toLowerCase()))
  const memberCount = workspaces.reduce((total, workspace) => total + workspace.memberCount, 0)
  const groupCount = workspaces.reduce((total, workspace) => total + workspace.groupCount, 0)
  const create = () => user ? setOpen(true) : navigate('/login', { state: { from: { pathname: '/learning-center' } } })

  return (
    <div className="learning-center lc-portal workspace-page min-h-screen text-slate-900">
      {!user && <header className="lc-guest-header"><Link to="/dashboard" className="flex items-center gap-3" aria-label="ProfAI home"><BrandMark size={40} /><span className="text-xl font-black tracking-tight">Prof<span className="text-red-600">AI</span><span className="ml-3 hidden border-l border-slate-200 pl-3 text-xs font-semibold tracking-normal text-slate-500 sm:inline">Classes</span></span></Link><Link to="/dashboard" className={secondaryButton}>Student platform <ArrowUpRight className="h-4 w-4" /></Link></header>}
      <main className="lc-portal-main mx-auto max-w-[1640px] px-4 pb-20 pt-5 sm:px-6 lg:px-8 lg:pt-8">
        <header className="lc-portal-hero">
          <div className="lc-portal-hero-copy">
            <span className="lc-portal-kicker"><Sparkles size={15} /> YOUR LEARNING SPACE</span>
            <h1>Learn better,<br /><span>together.</span></h1>
            <p>Bring classes, people and progress into one place. Your next step starts here.</p>
            <div className="lc-portal-actions">
              <button type="button" onClick={create} className="lc-portal-button lc-portal-button-primary"><Plus size={19} /> Create class <ArrowRight size={18} /></button>
              <button type="button" onClick={() => setJoinOpen(true)} className="lc-portal-button lc-portal-button-secondary"><Link2 size={18} /> Join class</button>
            </div>
            <div className="lc-portal-hero-note"><span className="lc-portal-note-icon"><ShieldCheck size={15} /></span> One space for every teacher, student and group</div>
          </div>
          <div className="lc-portal-visual" aria-hidden="true">
            <div className="lc-visual-orbit lc-visual-orbit-outer" />
            <div className="lc-visual-orbit lc-visual-orbit-inner" />
            <div className="lc-visual-core"><span className="lc-visual-core-icon"><GraduationCap size={42} strokeWidth={1.7} /></span><small>PROFAI CLASSES</small><strong>One shared<br />place to grow.</strong></div>
            <div className="lc-visual-float lc-visual-float-people"><span><Users size={18} /></span><b>People</b></div>
            <div className="lc-visual-float lc-visual-float-practice"><span><BookOpen size={18} /></span><b>Practice</b></div>
            <div className="lc-visual-float lc-visual-float-progress"><span><ClipboardCheck size={18} /></span><b>Progress</b></div>
          </div>
        </header>

        {user && workspaces.length > 0 && <section className="lc-portal-metrics" aria-label="Your class summary">
          <div><span className="lc-portal-metric-icon"><GraduationCap size={20} /></span><span><strong>{workspaces.length}</strong><small>{workspaces.length === 1 ? 'Classroom' : 'Classrooms'}</small></span></div>
          <div><span className="lc-portal-metric-icon"><Users size={20} /></span><span><strong>{memberCount}</strong><small>Members across classes</small></span></div>
          <div><span className="lc-portal-metric-icon"><BookOpen size={20} /></span><span><strong>{groupCount}</strong><small>Learning groups</small></span></div>
        </section>}

        <section aria-labelledby="classes-list-title" className="lc-portal-section">
          <div className="lc-portal-section-heading">
            <div><p className="lc-eyebrow">YOUR CLASSES</p><h2 id="classes-list-title">{user ? 'Your classrooms' : 'Find your place to learn'}</h2><p>{user ? 'Open a class and continue where you left off.' : 'Sign in to create a class or join your team.'}</p></div>
            {workspaces.length > 0 && <span className="lc-portal-count"><span /> {workspaces.length} {workspaces.length === 1 ? 'class' : 'classes'}</span>}
          </div>

          <div className="lc-portal-content">
            <div className="lc-portal-list">
              {workspaces.length > 0 && <label className="lc-portal-search"><Search size={20} /><input type="search" aria-label="Search classes" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search your classes by name or city" /></label>}
              {loading && user ? <CenterSkeleton blocks={2} /> : error && user ? <ErrorState message={error} onRetry={() => void refetch()} /> : workspaces.length ? (
                filtered.length ? <div className="lc-portal-card-grid">{filtered.map((workspace) => <Link key={workspace.id} to={`/learning-center/${workspace.slug}`} className="lc-portal-class-card" aria-label={`Open ${workspace.name} class`}>
                  <div className="lc-portal-class-cover">
                    {workspace.coverUrl ? <img src={workspace.coverUrl} alt="" /> : <div className="lc-portal-class-art" aria-hidden="true"><span className="lc-class-art-ring" /><GraduationCap size={58} strokeWidth={1.35} /></div>}
                    <span className="lc-portal-role">{workspace.role.toLowerCase()}</span>
                  </div>
                  <div className="lc-portal-class-body"><div className="lc-portal-class-title-row"><span className="lc-portal-class-initial" aria-hidden="true">{workspace.name.trim().charAt(0).toUpperCase() || 'C'}</span><span className="lc-portal-open-label">Open class <ArrowUpRight size={16} /></span></div><h3>{workspace.name}</h3><p className="lc-portal-class-location"><MapPin size={16} /> {workspace.city || 'Location not set'}</p><div className="lc-portal-class-footer"><span><Users size={16} /> {workspace.memberCount} members</span><span><BookOpen size={16} /> {workspace.groupCount} groups</span></div></div>
                </Link>)}<button type="button" onClick={create} className="lc-portal-create-card"><span><Plus size={25} /></span><strong>Create another class</strong><small>Build a new space for your next goal</small><ArrowRight className="lc-portal-create-arrow" size={19} /></button></div> : <CenterPanel><EmptyState title="No matching classes" description="Try another name or city." action={<button type="button" onClick={() => setSearch('')} className={secondaryButton}>Clear search</button>} /></CenterPanel>
              ) : <CenterPanel className="lc-portal-empty"><div className="lc-portal-empty-icon" aria-hidden="true"><Building2 size={34} /></div><h3>{user ? 'Your first class starts here' : 'Your classes will appear here'}</h3><p>{user ? 'Create a space for your teachers and students, then share practice and see progress together.' : 'Sign in to create a class or use an invitation from your teaching team.'}</p><button type="button" onClick={create} className="lc-portal-button lc-portal-button-primary">{user ? <Plus size={18} /> : <ArrowRight size={18} />}{user ? 'Create class' : 'Sign in to get started'}</button></CenterPanel>}
            </div>
            <aside className="lc-portal-guide"><div className="lc-portal-guide-mark"><GraduationCap size={24} /></div><span className="lc-eyebrow">BUILT FOR YOUR TEAM</span><h3>One space.<br />More progress.</h3><p>Everything your class needs to learn, practice and grow together.</p><ol>{[{ icon: Plus, title: 'Create a class', text: 'Give your learning space a home.' }, { icon: Users, title: 'Bring people together', text: 'Invite teachers and students into groups.' }, { icon: ClipboardCheck, title: 'See the progress', text: 'Share practice and follow results.' }].map((step, index) => <li key={step.title}><span className="lc-portal-step-icon"><step.icon size={18} /></span><div><small>0{index + 1}</small><strong>{step.title}</strong><p>{step.text}</p></div></li>)}</ol><div className="lc-portal-guide-foot"><ShieldCheck size={17} /><span>Each person sees the tools for their role.</span></div></aside>
          </div>
        </section>
      </main>
      {open && <CreateWorkspaceModal onClose={() => setOpen(false)} onCreated={(slug) => navigate(`/learning-center/${slug}`)} />}
      {joinOpen && <JoinWorkspaceModal onClose={() => setJoinOpen(false)} />}
    </div>
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
