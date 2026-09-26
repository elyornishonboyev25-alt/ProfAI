import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Building2, GraduationCap, Link2, MapPin, Plus, Search, ShieldCheck, Users } from 'lucide-react'
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
    <div className="learning-center lc-portal workspace-page min-h-screen text-slate-900">
      {!user && <header className="lc-guest-header"><Link to="/dashboard" className="flex items-center gap-3" aria-label="ProfAI home"><BrandMark size={40} /><span className="text-xl font-black tracking-tight">Prof<span className="text-red-600">AI</span><span className="ml-3 hidden border-l border-slate-200 pl-3 text-xs font-semibold tracking-normal text-slate-500 sm:inline">Classes</span></span></Link><Link to="/dashboard" className={secondaryButton}>Student platform <ArrowUpRight className="h-4 w-4" /></Link></header>}
      <main className="mx-auto max-w-[1500px] px-4 pb-16 pt-5 sm:px-6 lg:px-8 lg:pt-8">
        <header className="lc-classes-heading">
          <div className="relative z-10">
            <span className="lc-classes-kicker"><GraduationCap className="h-4 w-4" /> YOUR LEARNING SPACE</span>
            <h1 className="mt-4 text-4xl font-black tracking-[-.055em] text-slate-950 sm:text-5xl">Classes<span className="text-red-600">.</span></h1>
            <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-slate-600 sm:text-base">Keep your classes, people, and progress together in one place.</p>
          </div>
          <div className="relative z-10 flex flex-wrap gap-3">
            <button type="button" onClick={() => setJoinOpen(true)} className={secondaryButton}><Link2 className="h-4 w-4" /> Join with an invitation</button>
            <button type="button" onClick={create} className={primaryButton}><Plus className="h-4 w-4" /> Create class</button>
          </div>
        </header>

        <section aria-labelledby="classes-list-title" className="mt-8">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="lc-eyebrow">YOUR CLASSES</p>
              <h2 id="classes-list-title" className="mt-1 text-2xl font-black tracking-[-.04em] text-slate-950 sm:text-3xl">{user ? 'Your learning network' : 'Find your place to learn'}</h2>
              <p className="mt-1 text-sm text-slate-500">{user ? 'Open a class to pick up where you left off.' : 'Sign in to create a class or join your team.'}</p>
            </div>
            {workspaces.length > 0 && <span className="lc-count-pill">{workspaces.length} {workspaces.length === 1 ? 'class' : 'classes'}</span>}
          </div>

          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-w-0">
              {workspaces.length > 0 && <label className="lc-search relative mb-5 block"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input aria-label="Search classes" value={search} onChange={(event) => setSearch(event.target.value)} className={`${inputClass} pl-11`} placeholder="Search classes by name or city" /></label>}
              {loading && user ? <CenterSkeleton blocks={2} /> : error && user ? <ErrorState message={error} onRetry={() => void refetch()} /> : workspaces.length ? (
                filtered.length ? <div className="grid gap-4 md:grid-cols-2">{filtered.map((workspace) => <Link key={workspace.id} to={`/learning-center/${workspace.slug}`} className="lc-workspace-card group" aria-label={`Open ${workspace.name} class`}>
                  <div className="flex items-start justify-between gap-3"><span className="lc-workspace-avatar">{workspace.name.slice(0, 2).toUpperCase()}</span><span className="lc-role-pill">{workspace.role.toLowerCase()}</span></div>
                  <h3 className="mt-6 break-words text-xl font-bold tracking-[-.03em] text-slate-950">{workspace.name}</h3>
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500"><MapPin className="h-4 w-4 shrink-0" />{workspace.city || 'Location not set'}</p>
                  <div className="mt-6 flex items-center gap-4 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-500"><span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{workspace.memberCount} members</span><span>{workspace.groupCount} groups</span><span className="lc-card-arrow ml-auto"><ArrowUpRight className="h-4 w-4" /></span></div>
                </Link>)}<button type="button" onClick={create} className="lc-create-card"><span className="lc-create-icon"><Plus className="h-6 w-6" /></span><span className="text-base font-bold text-slate-900">Create another class</span><span className="text-sm text-slate-500">A new space for your next goal</span></button></div> : <CenterPanel><EmptyState title="No matching classes" description="Try another name or city." action={<button type="button" onClick={() => setSearch('')} className={secondaryButton}>Clear search</button>} /></CenterPanel>
              ) : <CenterPanel className="lc-first-workspace"><div className="lc-empty-illustration" aria-hidden="true"><Building2 className="h-9 w-9 text-red-600" /></div><h3 className="mt-5 text-xl font-bold tracking-tight">{user ? 'Create your first class' : 'Your classes will appear here'}</h3><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">{user ? 'Bring your teachers and students together, then start sharing practice and tracking progress.' : 'Sign in to create a class or use an invitation from your teaching team.'}</p><button type="button" onClick={create} className={`${primaryButton} mt-6`}>{user ? <Plus className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}{user ? 'Create class' : 'Sign in to get started'}</button></CenterPanel>}
            </div>
            <aside className="lc-guide"><span className="lc-guide-icon"><GraduationCap className="h-5 w-5" /></span><p className="lc-eyebrow mt-5">GET STARTED</p><h3 className="mt-2 text-xl font-bold tracking-tight text-slate-950">Make space for progress</h3><p className="mt-2 text-sm leading-6 text-slate-500">Everything your teaching team needs to stay connected.</p><ol className="lc-guide-steps mt-6">{[{ title: 'Create a class', text: 'Give your space a name and a home.' }, { title: 'Bring people together', text: 'Invite teachers and students into groups.' }, { title: 'Follow every result', text: 'Share practice and see how learners improve.' }].map((step, index) => <li key={step.title} className="flex gap-3"><span className="lc-step-number">{index + 1}</span><div><p className="text-sm font-bold text-slate-900">{step.title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{step.text}</p></div></li>)}</ol><div className="mt-7 flex gap-2 border-t border-slate-200 pt-5 text-xs leading-5 text-slate-500"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />Each team member sees the tools for their role.</div></aside>
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
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (busy) return
    if (name.trim().length < 3) { setError('Enter a class name with at least 3 characters.'); return }
    setBusy(true); setError('')
    try {
      const response = await learningCenterApi.createWorkspace({ name: name.trim(), city: city.trim() || undefined, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Tashkent' })
      onCreated(response.workspace.slug)
    } catch (submitError) { setError(submitError instanceof Error ? submitError.message : 'Could not create class.') }
    finally { setBusy(false) }
  }
  return <Modal open onClose={onClose} busy={busy} title="Create a class" description="Start with a name. You can invite your team next."><form onSubmit={submit} className="space-y-5"><label className="block"><span className="mb-2 block text-xs font-bold text-slate-700">Class name</span><input required minLength={3} maxLength={120} value={name} onChange={(event) => setName(event.target.value)} className={inputClass} placeholder="Oxford Academy" /></label><label className="block"><span className="mb-2 block text-xs font-bold text-slate-700">City <span className="font-normal text-slate-400">(optional)</span></span><input maxLength={100} value={city} onChange={(event) => setCity(event.target.value)} className={inputClass} placeholder="Tashkent" /></label>{error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}<div className="flex justify-end gap-2"><button type="button" disabled={busy} onClick={onClose} className={secondaryButton}>Cancel</button><button disabled={busy} className={primaryButton}>{busy ? 'Creating...' : 'Create class'}<ArrowRight className="h-4 w-4" /></button></div></form></Modal>
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
