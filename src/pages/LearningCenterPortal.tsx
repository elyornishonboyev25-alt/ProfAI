import { useCopy } from '@/i18n/interface'
import UiText from '@/components/common/UiText'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, BookOpen, Building2, GraduationCap, Link2, MapPin, Plus, Search, ShieldCheck, Users, X } from 'lucide-react'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { useAsyncData } from '@/hooks/useAsyncData'
import { learningCenterApi } from '@/features/learningCenter/api'
import { CenterPanel, EmptyState, ErrorState, inputClass, Modal, primaryButton, secondaryButton } from '@/features/learningCenter/components'
import type { CenterWorkspace } from '@/features/learningCenter/types'
import { useAuthStore } from '@/store/authStore'
import ClassCoverEditor from '@/features/learningCenter/ClassCoverEditor'
import '@/features/learningCenter/learning-center.css'
import '@/features/learningCenter/portal.css'
import { useBillingStore } from '@/features/billing/store'
import { useBillingText } from '@/features/billing/copy'
import '@/features/billing/billing.css'

type ClassView = 'all' | 'teaching' | 'learning'
const roleLabels = { OWNER: 'Owner', ADMIN: 'Administrator', TEACHER: 'Teacher', STUDENT: 'Student' }

export default function LearningCenterPortal() {
  const { c: uiCopy } = useCopy()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const { wallet, refresh } = useBillingStore()
  useEffect(() => { void refresh() }, [user?.id, refresh])
  const text = useBillingText()
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
  const create = () => !user ? navigate('/login', { state: { from: { pathname: '/learning-center' } } }) : wallet?.canCreateClass || user.canCreateClass ? setOpen(true) : navigate('/premium')
  const clearFilters = () => { setSearch(''); setView('all') }

  return (
    <div className="learning-center lc-portal workspace-page min-h-screen text-slate-900">
      {!user && <header className="lc-guest-header"><Link to="/dashboard" className="flex items-center gap-3" aria-label={uiCopy("Ivygoo home")}><BrandLogo height={46} /></Link><Link to="/dashboard" className={secondaryButton}><UiText text={"Student platform"} /> <ArrowUpRight className="h-4 w-4" /></Link></header>}
      <main className="lc-portal-main mx-auto max-w-[1640px] px-4 pb-20 pt-5 sm:px-6 lg:px-8 lg:pt-8">
        <header className="lc-portal-header">
          <div className="lc-portal-heading-copy">
            <span className="lc-eyebrow"><GraduationCap size={15} /> <UiText text={"YOUR LEARNING SPACE"} /></span>
            <h1><UiText text={"Your"} /> <span><UiText text={"classes"} /></span></h1>
            <p><UiText text={"Your team, assignments and progress. All together."} /></p>
            {user && workspaces.length > 0 && <div className="lc-portal-summary" aria-label={uiCopy("Your class summary")}>
              <span><GraduationCap size={14} /><strong>{workspaces.length}</strong> {workspaces.length === 1 ? <UiText text={"class"} /> : <UiText text={"classes"} />}</span>
              <span><Users size={14} /><strong>{memberCount}</strong> <UiText text={"members"} /></span>
              <span><BookOpen size={14} /><strong>{groupCount}</strong> {groupCount === 1 ? <UiText text={"group"} /> : <UiText text={"groups"} />}</span>
            </div>}
          </div>
          <div className="lc-portal-actions">
            <button type="button" onClick={() => setJoinOpen(true)} className="lc-portal-button lc-portal-button-secondary"><Link2 size={17} /> <UiText text={"Join class"} /></button>
            <button type="button" onClick={create} className="lc-portal-button lc-portal-button-primary"><Plus size={18} /> <UiText text={"Create class"} /></button>
          </div>
        </header>

        {user && !wallet?.canCreateClass && !user.canCreateClass && <section className="billing-glass billing-teacher-banner"><GraduationCap size={25} /><div><strong>{text('Create your class with Max', 'Max tarifi bilan class yarating', 'Создайте класс с Max')}</strong><p>{text('Max: $11.99/month — create classes and track students. Pro: $5.99/month for practice and joining classes. Local payment amounts appear at checkout.', 'Max: $11.99/oy — class yaratish va o‘quvchilarni kuzatish. Pro: mashq va classga qo‘shilish uchun $5.99/oy. So‘mdagi summa to‘lov bo‘limida ko‘rinadi.', 'Max: $11.99/мес. — создание классов и контроль учеников. Pro: $5.99/мес. для практики и участия в классах. Местная сумма — при оплате.')}</p></div><Link className="billing-primary" to="/premium">{text('View plans', 'Tariflarni ko‘rish', 'Посмотреть тарифы')}<ArrowRight size={16} /></Link></section>}
        <section aria-labelledby="classes-list-title" className="lc-portal-section">
          <h2 id="classes-list-title" className="sr-only"><UiText text={"Your classrooms"} /></h2>
          {workspaces.length > 0 && <div className="lc-portal-toolbar">
            <div className="lc-portal-filters" role="group" aria-label={uiCopy("Filter classes by your role")}>
              {([{ key: 'all', label: 'All classes', count: workspaces.length }, { key: 'teaching', label: 'Teaching', count: teachingCount }, { key: 'learning', label: 'Learning', count: workspaces.length - teachingCount }] as const).map((filter) => (
                <button key={filter.key} type="button" aria-pressed={view === filter.key} onClick={() => setView(filter.key)} className={view === filter.key ? 'is-active' : ''}><UiText text={filter.label} /><span>{filter.count}</span></button>
              ))}
            </div>
            <label className="lc-portal-search"><Search size={18} /><input type="search" aria-label={uiCopy("Search classes")} value={search} onChange={(event) => setSearch(event.target.value)} placeholder={uiCopy("Search by name or city")} />{search && <button type="button" aria-label={uiCopy("Clear search")} onClick={() => setSearch('')}><X size={16} /></button>}</label>
          </div>}

          {loading && user ? <div className="lc-portal-card-grid" role="status" aria-label={uiCopy("Loading your classes")}>{Array.from({ length: 3 }, (_, index) => <div key={index} className="lc-portal-skeleton animate-pulse"><div /><span /><span /><span /></div>)}</div> : error && user ? <ErrorState message={error} onRetry={() => void refetch()} /> : workspaces.length ? (
            filtered.length ? <div className="lc-portal-card-grid">
              {filtered.map((workspace) => <ClassCard key={workspace.id} workspace={workspace} />)}
              {!search.trim() && view !== 'learning' && <button type="button" onClick={create} className="lc-portal-create-card"><span><Plus size={26} /></span><strong><UiText text={"Create a classroom"} /></strong><small><UiText text={"A new space for your next goal."} /></small><span className="lc-portal-create-label"><UiText text={"Get started"} /> <ArrowRight size={16} /></span></button>}
            </div> : <CenterPanel><EmptyState title={uiCopy("No matching classes")} description={uiCopy("Try another name, city or role filter.")} action={<button type="button" onClick={clearFilters} className={secondaryButton}><UiText text={"Reset filters"} /> <ArrowRight size={16} /></button>} /></CenterPanel>
          ) : <CenterPanel className="lc-portal-empty"><div className="lc-portal-empty-icon" aria-hidden="true"><Building2 size={32} /></div><span className="lc-eyebrow"><UiText text={"YOUR NEXT CHAPTER"} /></span><h3>{user ? <UiText text={"Start with your first classroom"} /> : <UiText text={"Your classroom is one step away"} />}</h3><p>{user ? <UiText text={"Create a class for your team, or join an existing one with your teacher’s invitation."} /> : <UiText text={"Sign in to find your classes, meet your team and continue learning."} />}</p><div className="lc-portal-empty-actions"><button type="button" onClick={create} className="lc-portal-button lc-portal-button-primary">{user ? <Plus size={18} /> : <ArrowRight size={18} />}{user ? <UiText text={"Create your first class"} /> : <UiText text={"Sign in to get started"} />}</button><button type="button" onClick={() => setJoinOpen(true)} className="lc-portal-button lc-portal-button-secondary"><Link2 size={17} /> <UiText text={"I have an invitation"} /></button></div></CenterPanel>}
        </section>
        <footer className="lc-portal-footnote"><ShieldCheck size={15} /><span><UiText text={"Your team, assignments and results. Connected in every classroom."} /></span></footer>
      </main>
      {open && <CreateWorkspaceModal onClose={() => setOpen(false)} onCreated={(slug) => navigate(`/learning-center/${slug}`)} />}
      {joinOpen && <JoinWorkspaceModal onClose={() => setJoinOpen(false)} />}
    </div>
  )
}

function ClassCard({ workspace }: { workspace: CenterWorkspace }) {
  const { c: uiCopy } = useCopy()
  return (
    <Link to={`/learning-center/${workspace.slug}`} className="lc-portal-class-card" aria-label={uiCopy("Open {{value1}} class", { value1: String(workspace.name) })}>
      <div className="lc-portal-class-cover">
        {workspace.coverUrl ? <img src={workspace.coverUrl} alt="" loading="lazy" /> : <div className="lc-portal-class-art" aria-hidden="true"><span className="lc-class-art-ring" /><GraduationCap size={44} strokeWidth={1.4} /><span className="lc-class-art-wordmark"><UiText text={"IVYGOO CLASSROOM"} /></span></div>}
        <span className="lc-portal-role"><ShieldCheck size={12} />{roleLabels[workspace.role]}</span>
      </div>
      <div className="lc-portal-class-body">
        <div className="lc-portal-class-title-row"><span className="lc-portal-class-initial" aria-hidden="true">{workspace.name.trim().charAt(0).toUpperCase() || 'C'}</span><span className="lc-portal-class-caption"><UiText text={"YOUR CLASSROOM"} /></span></div>
        <h3>{workspace.name}</h3>
        <p className="lc-portal-class-location"><MapPin size={14} />{workspace.city || <UiText text={"Location not set"} />}</p>
        <div className="lc-portal-class-stats"><span><Users size={15} /><strong>{workspace.memberCount}</strong> {workspace.memberCount === 1 ? <UiText text={"member"} /> : <UiText text={"members"} />}</span><span><BookOpen size={15} /><strong>{workspace.groupCount}</strong> {workspace.groupCount === 1 ? <UiText text={"group"} /> : <UiText text={"groups"} />}</span></div>
        <div className="lc-portal-class-footer"><span><UiText text={"Open classroom"} /></span><span className="lc-portal-card-arrow"><ArrowUpRight size={17} /></span></div>
      </div>
    </Link>
  )
}

function CreateWorkspaceModal({ onClose, onCreated }: { onClose: () => void; onCreated: (slug: string) => void }) {
  const { c: uiCopy } = useCopy()
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
  return <Modal open onClose={onClose} busy={busy} title={uiCopy("Create a class")} description={uiCopy("Give your class a name and a cover photo.")}><form onSubmit={submit} className="space-y-5"><label className="block"><span className="mb-2 block text-xs font-bold text-slate-700"><UiText text={"Class name"} /></span><input required minLength={3} maxLength={120} value={name} onChange={(event) => setName(event.target.value)} className={inputClass} placeholder="Oxford Academy" /></label><label className="block"><span className="mb-2 block text-xs font-bold text-slate-700"><UiText text={"City"} /> <span className="font-normal text-slate-400"><UiText text={"(optional)"} /></span></span><input maxLength={100} value={city} onChange={(event) => setCity(event.target.value)} className={inputClass} placeholder="Tashkent" /></label><div><span className="mb-2 block text-xs font-bold text-slate-700"><UiText text={"Class cover photo"} /> <span className="font-normal text-slate-400"><UiText text={"(optional)"} /></span></span><ClassCoverEditor value={coverUrl} onChange={setCoverUrl} onPendingChange={setCoverPending} onError={setError} /></div>{error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}<div className="flex justify-end gap-2"><button type="button" disabled={busy} onClick={onClose} className={secondaryButton}><UiText text={"Cancel"} /></button><button disabled={busy || coverPending} className={primaryButton}>{busy ? <UiText text={"Creating..."} /> : <UiText text={"Create class"} />}<ArrowRight className="h-4 w-4" /></button></div></form></Modal>
}

function JoinWorkspaceModal({ onClose }: { onClose: () => void }) {
  const { c: uiCopy } = useCopy()
  const navigate = useNavigate()
  const [invitation, setInvitation] = useState('')
  const [error, setError] = useState('')
  function submit(event: React.FormEvent) {
    event.preventDefault()
    const code = invitation.trim().match(/(?:^|\/learning-center\/join\/)([A-Za-z0-9_-]+)\/?(?:[?#].*)?$/)?.[1]
    if (!code) { setError('Enter a valid invitation code or link.'); return }
    navigate(`/learning-center/join/${encodeURIComponent(code)}`)
  }
  return <Modal open onClose={onClose} title={uiCopy("Join a class")} description={uiCopy("Paste the invitation link or code shared by your teacher.")}><form onSubmit={submit} className="space-y-4"><label className="block"><span className="mb-2 block text-xs font-bold text-slate-700"><UiText text={"Invitation link or code"} /></span><input required value={invitation} onChange={(event) => setInvitation(event.target.value)} className={inputClass} placeholder={uiCopy("Paste your invitation here")} /></label>{error && <p role="alert" className="text-sm text-red-600">{error}</p>}<div className="flex justify-end gap-2"><button type="button" onClick={onClose} className={secondaryButton}><UiText text={"Cancel"} /></button><button className={primaryButton}><UiText text={"Continue"} /> <ArrowRight className="h-4 w-4" /></button></div></form></Modal>
}
