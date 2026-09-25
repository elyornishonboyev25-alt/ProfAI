import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowDown, ArrowRight, ArrowUpRight, BarChart3, BookOpen, Building2, Check, GraduationCap, Link2, MapPin, Plus, Search, ShieldCheck, Sparkles, Users } from 'lucide-react'
import { BrandMark } from '@/components/brand/BrandLogo'
import { useAsyncData } from '@/hooks/useAsyncData'
import { learningCenterApi } from '@/features/learningCenter/api'
import { CenterPanel, CenterSkeleton, EmptyState, ErrorState, inputClass, Modal, primaryButton, secondaryButton } from '@/features/learningCenter/components'
import { useAuthStore } from '@/store/authStore'
import '@/features/learningCenter/learning-center.css'

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
  const create = () => user ? setOpen(true) : navigate('/login', { state: { from: { pathname: '/learning-center' } } })

  return (
    <div className="learning-center lc-portal min-h-screen text-slate-900">
      {!user ? <header className="lc-portal-header">
        <Link to="/dashboard" className="flex items-center gap-3" aria-label="ProfAI student platform"><BrandMark size={40} /><span className="text-xl font-black tracking-tight">Prof<span className="text-red-600">AI</span><span className="ml-3 hidden border-l border-slate-200 pl-3 text-xs font-semibold tracking-normal text-slate-500 sm:inline">Learning Center</span></span></Link>
        <div className="flex items-center gap-3"><span className="hidden text-xs font-medium text-slate-500 md:block">A better space to teach.</span><Link to="/dashboard" className={secondaryButton}>Student platform <ArrowUpRight className="h-4 w-4" /></Link></div>
      </header> : null}
      <main className="mx-auto max-w-[1320px] px-4 pb-12 pt-5 sm:px-6 lg:px-8 lg:pt-8">
        <section className="lc-hero">
          <div className="relative z-10 min-w-0 py-2 lg:py-6">
            <span className="lc-eyebrow"><span className="lc-eyebrow-dot" /> PROFAI LEARNING CENTER</span>
            <h1 className="mt-6 max-w-2xl text-[2.7rem] font-black leading-[1.07] tracking-[-.06em] text-slate-950 sm:text-[3.5rem] 2xl:text-[4.2rem]">Lead every learner.<br /><span className="lc-gradient-text">See every win.</span></h1>
            <p className="mt-6 max-w-lg text-base font-medium leading-7 text-slate-600">One connected place for IELTS and SAT teaching: organize your people, assign practice and turn progress into clear next steps.</p>
            <div className="mt-8 flex flex-wrap gap-3">{workspaces.length ? <Link to={`/learning-center/${workspaces[0].slug}`} className={`${primaryButton} min-h-12 px-5`}>Open your workspace <ArrowRight className="h-4 w-4" /></Link> : <button type="button" onClick={create} className={`${primaryButton} min-h-12 px-5`}><Plus className="h-4 w-4" /> Create a workspace</button>}<a href="#workspaces" className={`${secondaryButton} min-h-12 px-5`}>Explore workspaces <ArrowDown className="h-4 w-4" /></a></div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">{['IELTS & SAT', 'Teacher & student roles', 'Progress insights'].map((label) => <span key={label} className="flex items-center gap-1.5"><Check className="h-4 w-4 text-blue-600" />{label}</span>)}</div>
          </div>
          <WorkspacePreview />
        </section>
        <div className="lc-feature-strip">
          {[{ icon: Users, title: 'People, connected', text: 'Students, teachers and groups in one place.' }, { icon: BookOpen, title: 'Practice with purpose', text: 'Set assignments and follow their completion.' }, { icon: BarChart3, title: 'Progress you can see', text: 'Spot improvement and know who needs help.' }].map(({ icon: Icon, title, text }) => <div key={title} className="flex items-start gap-4"><span className="lc-feature-icon"><Icon className="h-5 w-5" /></span><div><h2 className="text-sm font-bold text-slate-900">{title}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{text}</p></div></div>)}
        </div>
        <section id="workspaces" className="scroll-mt-6 pt-10 sm:pt-14">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="lc-eyebrow text-blue-600">YOUR LEARNING NETWORK</p><h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{user ? 'Welcome to your centers' : 'Your next chapter starts here'}</h2><p className="mt-2 text-sm text-slate-500">{user ? 'Pick up where you left off, or build something new.' : 'Sign in to manage your center or join your teaching team.'}</p></div><button type="button" onClick={() => setJoinOpen(true)} className={secondaryButton}><Link2 className="h-4 w-4" /> Join with an invitation</button></div>
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-w-0">
              {workspaces.length > 0 && <label className="relative mb-5 block"><Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" /><input aria-label="Search workspaces" value={search} onChange={(event) => setSearch(event.target.value)} className={`${inputClass} bg-white pl-11`} placeholder="Find a workspace by name or city..." /></label>}
              {loading && user ? <CenterSkeleton blocks={2} /> : error && user ? <ErrorState message={error} onRetry={() => void refetch()} /> : workspaces.length ? (
                filtered.length ? <div className="grid gap-4 md:grid-cols-2">{filtered.map((workspace) => <Link key={workspace.id} to={`/learning-center/${workspace.slug}`} className="lc-workspace-card group"><div className="flex items-start justify-between gap-3"><span className="lc-workspace-avatar">{workspace.name.slice(0, 2).toUpperCase()}</span><span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-bold capitalize text-blue-700">{workspace.role.toLowerCase()}</span></div><h3 className="mt-5 break-words text-xl font-bold tracking-tight">{workspace.name}</h3><p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500"><MapPin className="h-3.5 w-3.5" />{workspace.city || 'Location not set'}</p><div className="mt-6 flex items-center gap-4 border-t border-slate-100 pt-4 text-xs font-medium text-slate-500"><span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{workspace.memberCount} members</span><span>{workspace.groupCount} groups</span><ArrowUpRight className="ml-auto h-5 w-5 text-blue-600 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></div></Link>)}<button type="button" onClick={create} className="lc-create-card"><Plus className="h-6 w-6" /><span className="text-sm font-bold">Create another workspace</span><span className="text-xs text-slate-500">A new space for your next big goal</span></button></div> : <CenterPanel><EmptyState title="No matching workspaces" description="Try another name or city." action={<button type="button" onClick={() => setSearch('')} className={secondaryButton}>Clear search</button>} /></CenterPanel>
              ) : <CenterPanel className="lc-first-workspace"><div className="lc-empty-illustration" aria-hidden="true"><Building2 className="h-9 w-9 text-blue-600" /></div><h3 className="mt-5 text-xl font-bold tracking-tight">{user ? 'Make room for better learning' : 'Your center. Your people. Their potential.'}</h3><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">{user ? 'Create your first workspace, invite your team and start bringing every learner closer to their goal.' : 'Connect your existing ProfAI account to a center. All your workspaces will appear here.'}</p><button type="button" onClick={create} className={`${primaryButton} mt-6`}>{user ? <Plus className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}{user ? 'Create your first workspace' : 'Sign in to get started'}</button></CenterPanel>}
            </div>
            <aside className="lc-guide"><span className="lc-eyebrow text-blue-600">A SIMPLE START</span><h3 className="mt-2 text-lg font-bold tracking-tight">From setup to success</h3><ol className="mt-6 space-y-6">{[{ title: 'Create your center', text: 'Give your workspace a name and a home.' }, { title: 'Bring everyone together', text: 'Invite teachers and students, then create your groups.' }, { title: 'Make progress visible', text: 'Assign practice and follow each learner’s results.' }].map((step, index) => <li key={step.title} className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-blue-100 bg-white text-xs font-bold text-blue-600">{index + 1}</span><div><p className="text-sm font-bold">{step.title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{step.text}</p></div></li>)}</ol><div className="mt-7 flex gap-2 border-t border-blue-100 pt-4 text-xs leading-5 text-slate-500"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />Workspace roles keep access aligned with each team member’s responsibilities.</div></aside>
          </div>
        </section>
        <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/70 pt-6 text-xs text-slate-400"><span>ProfAI Learning Center</span><span>Built around people. Focused on progress.</span></footer>
      </main>
      {open && <CreateWorkspaceModal onClose={() => setOpen(false)} onCreated={(slug) => navigate(`/learning-center/${slug}`)} />}
      {joinOpen && <JoinWorkspaceModal onClose={() => setJoinOpen(false)} />}
    </div>
  )
}

function WorkspacePreview() {
  return <div className="lc-preview-wrap"><div className="lc-preview"><div className="flex items-center justify-between border-b border-slate-100 pb-4"><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-600 text-white"><GraduationCap className="h-4 w-4" /></span><span className="text-sm font-bold">Your center, at a glance</span></div><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">Preview</span></div><div className="lc-preview-banner"><span className="text-[10px] font-semibold uppercase tracking-[.16em] text-blue-200">LESS ADMIN. MORE IMPACT.</span><h2 className="mt-3 text-2xl font-semibold leading-tight tracking-tight">A little clarity.<br />A lot of potential.</h2><div className="mt-5 flex gap-2"><span className="rounded-md bg-white/10 px-2.5 py-1 text-[10px] font-bold">IELTS</span><span className="rounded-md bg-white/10 px-2.5 py-1 text-[10px] font-bold">SAT</span></div><GraduationCap className="absolute bottom-6 right-5 h-20 w-20 rotate-[-12deg] text-blue-300/25" strokeWidth={1} /></div><div className="mt-5 flex items-center justify-between"><h3 className="text-xs font-bold">A clear path for every learner</h3><BarChart3 className="h-4 w-4 text-blue-600" /></div><div className="lc-preview-path">{[{ label: 'Connect', icon: Users }, { label: 'Practice', icon: BookOpen }, { label: 'Improve', icon: Sparkles }].map(({ label, icon: Icon }) => <div key={label}><span><Icon className="h-5 w-5" /></span><p>{label}</p></div>)}</div><div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-white text-emerald-600"><Check className="h-4 w-4" /></span><div><p className="text-xs font-bold text-emerald-900">Every step counts</p><p className="mt-0.5 text-[11px] text-emerald-700">Turn learning activity into useful insights.</p></div></div></div><div className="lc-preview-note"><ShieldCheck className="h-5 w-5 text-blue-600" /><div><p className="text-xs font-bold">One connected team</p><p className="mt-0.5 text-[10px] text-slate-500">A dedicated space for every role</p></div></div></div>
}

function CreateWorkspaceModal({ onClose, onCreated }: { onClose: () => void; onCreated: (slug: string) => void }) {
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (busy) return
    if (name.trim().length < 3) { setError('Enter a center name with at least 3 characters.'); return }
    setBusy(true); setError('')
    try {
      const response = await learningCenterApi.createWorkspace({ name: name.trim(), city: city.trim() || undefined, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Tashkent' })
      onCreated(response.workspace.slug)
    } catch (submitError) { setError(submitError instanceof Error ? submitError.message : 'Could not create workspace.') }
    finally { setBusy(false) }
  }
  return <Modal open onClose={onClose} busy={busy} title="A new home for your center" description="Start with the basics. Your team and groups come next."><form onSubmit={submit} className="space-y-5"><label className="block"><span className="mb-2 block text-xs font-bold text-slate-700">Learning center name</span><input required minLength={3} maxLength={120} value={name} onChange={(event) => setName(event.target.value)} className={inputClass} placeholder="Oxford Learning Center" /></label><label className="block"><span className="mb-2 block text-xs font-bold text-slate-700">City <span className="font-normal text-slate-400">(optional)</span></span><input maxLength={100} value={city} onChange={(event) => setCity(event.target.value)} className={inputClass} placeholder="Tashkent" /></label>{error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}<div className="flex justify-end gap-2"><button type="button" disabled={busy} onClick={onClose} className={secondaryButton}>Cancel</button><button disabled={busy} className={primaryButton}>{busy ? 'Creating...' : 'Create workspace'}<ArrowRight className="h-4 w-4" /></button></div></form></Modal>
}

function JoinWorkspaceModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const [invitation, setInvitation] = useState('')
  const [error, setError] = useState('')
  function submit(event: React.FormEvent) {
    event.preventDefault()
    const code = invitation.trim().match(/(?:^|\/learning-center\/join\/)([A-Za-z0-9_-]+)\/?(?:[?#].*)?$/)?.[1]
    if (!code) { setError('Enter a valid invitation code or Learning Center invitation link.'); return }
    navigate(`/learning-center/join/${encodeURIComponent(code)}`)
  }
  return <Modal open onClose={onClose} title="Join your learning center" description="Paste the invitation link or code shared by your center."><form onSubmit={submit} className="space-y-4"><label className="block"><span className="mb-2 block text-xs font-bold text-slate-700">Invitation link or code</span><input required value={invitation} onChange={(event) => setInvitation(event.target.value)} className={inputClass} placeholder="Paste your invitation here" /></label>{error && <p role="alert" className="text-sm text-red-600">{error}</p>}<div className="flex justify-end gap-2"><button type="button" onClick={onClose} className={secondaryButton}>Cancel</button><button className={primaryButton}>Continue <ArrowRight className="h-4 w-4" /></button></div></form></Modal>
}
