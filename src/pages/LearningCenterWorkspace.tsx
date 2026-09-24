import '@/features/learningCenter/learning-center.css'
import { ErrorState, secondaryButton } from '@/features/learningCenter/components'
import UiText from '@/components/common/UiText'
import { useEffect, useRef, useState, type ComponentType } from 'react'
import { createPortal } from 'react-dom'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { BarChart3, Building2, ChevronDown, ClipboardCheck, GraduationCap, LayoutDashboard, LogOut, Menu, Trophy, UserRoundCheck, Users, X } from 'lucide-react'
import { BrandMark } from '@/components/brand/BrandLogo'
import BrandPageLoader from '@/components/common/BrandPageLoader'
import { cn } from '@/components/ui/utils'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useAuthStore } from '@/store/authStore'
import { learningCenterApi } from '@/features/learningCenter/api'
import type { CenterWorkspace } from '@/features/learningCenter/types'
import OverviewView from '@/features/learningCenter/OverviewView'
import StudentsView from '@/features/learningCenter/StudentsView'
import StudentDetailView from '@/features/learningCenter/StudentDetailView'
import GroupsView from '@/features/learningCenter/GroupsView'
import AssignmentsView from '@/features/learningCenter/AssignmentsView'
import LeaderboardView from '@/features/learningCenter/LeaderboardView'
import TeamView from '@/features/learningCenter/TeamView'

type NavItem = { key: string; label: string; icon: ComponentType<{ className?: string }>; managerOnly?: boolean; staffOnly?: boolean }

const NAV_ITEMS: NavItem[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'students', label: 'Students', icon: Users },
  { key: 'groups', label: 'Groups', icon: GraduationCap },
  { key: 'assignments', label: 'Assignments', icon: ClipboardCheck },
  { key: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { key: 'team', label: 'Team & roles', icon: UserRoundCheck, staffOnly: true },
]

export default function LearningCenterWorkspacePage() {
  const { workspaceSlug = '' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { data, loading, error, refetch } = useAsyncData(() => learningCenterApi.workspaces(), [user?.id])
  const workspace = data?.workspaces.find((item) => item.slug === workspaceSlug)
  const pathAfterSlug = location.pathname.split('/').filter(Boolean).slice(2)
  const section = pathAfterSlug[0] || 'overview'
  const detailId = section === 'students' ? pathAfterSlug[1] : undefined

  useEffect(() => setMobileOpen(false), [location.pathname])
  if (loading && !data) return <div className="grid min-h-screen place-items-center bg-slate-50"><BrandPageLoader label="Opening Learning Center" /></div>
  if (error) return <div className="learning-center grid min-h-screen place-items-center bg-slate-50 p-5"><div className="w-full max-w-lg"><ErrorState message={error} onRetry={() => void refetch()} /><button type="button" onClick={() => navigate('/learning-center')} className={secondaryButton + ' mt-4'}>Back to portal</button></div></div>
  if (!workspace) return <Navigate to="/learning-center" replace />

  const manager = workspace.role === 'OWNER' || workspace.role === 'ADMIN'
  const staff = manager || workspace.role === 'TEACHER'
  const nav = NAV_ITEMS.filter((item) => (!item.managerOnly || manager) && (!item.staffOnly || staff))
  if (!nav.some((item) => item.key === section)) return <Navigate to={`/learning-center/${workspaceSlug}`} replace />

  return (
    <div className="learning-center min-h-screen bg-[#f8fafc] text-slate-900">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(59,130,246,.12),transparent_25%),radial-gradient(circle_at_94%_8%,rgba(239,68,68,.07),transparent_22%)]" />
      <CenterSidebar workspace={workspace} section={section} nav={nav} open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="relative min-h-screen lg:pl-[17.5rem]">
        <header className="sticky top-0 z-30 flex h-[4.75rem] items-center justify-between border-b border-white/80 bg-white/75 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3"><button type="button" onClick={() => setMobileOpen(true)} aria-label="Open navigation" aria-expanded={mobileOpen} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 lg:hidden"><Menu className="h-5 w-5" /></button><div className="min-w-0"><p className="truncate text-[9px] font-black uppercase tracking-[.18em] text-blue-600">{workspace.name}</p><h2 className="mt-0.5 text-base font-black tracking-tight text-slate-950">{detailId ? 'Student analytics' : nav.find((item) => item.key === section)?.label ?? 'Center workspace'}</h2></div></div>
          <div className="flex items-center gap-2"><button type="button" onClick={() => navigate('/learning-center')} className="hidden min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-600 transition hover:border-blue-200 hover:text-blue-700 sm:inline-flex"><Building2 className="h-4 w-4" /> Switch workspace</button><button type="button" onClick={() => navigate('/dashboard')} className="flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-left text-white"><span className="grid h-7 w-7 place-items-center rounded-lg bg-white/10 text-[10px] font-black">{user?.fullName?.[0] ?? 'P'}</span><span className="hidden max-w-28 truncate text-xs font-black md:block">{user?.fullName ?? 'ProfAI'}</span></button></div>
        </header>
        <main className="relative mx-auto max-w-[100rem] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <AnimatePresence mode="wait" initial={false}><motion.div key={`${workspaceSlug}-${section}-${detailId ?? ''}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: .18 }}>{renderSection(section, detailId, workspaceSlug, manager, staff)}</motion.div></AnimatePresence>
        </main>
      </div>
    </div>
  )
}

function renderSection(section: string, detailId: string | undefined, slug: string, manager: boolean, staff: boolean) {
  if (section === 'students' && detailId) return <StudentDetailView slug={slug} studentId={detailId} canManage={staff} />
  if (section === 'students') return <StudentsView slug={slug} canManage={manager} />
  if (section === 'groups') return <GroupsView slug={slug} canManage={manager} />
  if (section === 'assignments') return <AssignmentsView slug={slug} canManage={staff} />
  if (section === 'leaderboard') return <LeaderboardView slug={slug} />
  if (section === 'team' && staff) return <TeamView slug={slug} canManage={manager} />
  return <OverviewView slug={slug} />
}

function CenterSidebar({ workspace, section, nav, open, onClose }: { workspace: CenterWorkspace; section: string; nav: NavItem[]; open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const drawerRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    if (!open) return
    const previousFocus = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    drawerRef.current?.querySelector('button')?.focus()
    function keydown(event: KeyboardEvent) {
      if (event.key === 'Escape') closeRef.current()
      if (event.key !== 'Tab') return
      const buttons = drawerRef.current?.querySelectorAll('button')
      if (!buttons?.length) return
      const first = buttons[0], last = buttons[buttons.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    const desktop = window.matchMedia('(min-width: 1024px)')
    const resize = () => { if (desktop.matches) closeRef.current() }
    desktop.addEventListener('change', resize)
    document.addEventListener('keydown', keydown)
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', keydown); desktop.removeEventListener('change', resize); previousFocus?.focus() }
  }, [open])
  const panel = (
    <aside className="flex h-full w-[17.5rem] flex-col overflow-hidden border-r border-slate-200 bg-white text-slate-900">
      <div className="flex h-[4.75rem] items-center gap-3 border-b border-slate-200 px-5"><BrandMark size={42} /><div className="min-w-0"><p className="text-lg font-black tracking-[-.05em]">Prof<span className="text-red-600">AI</span></p><p className="text-[8px] font-black uppercase tracking-[.16em] text-slate-500"> <UiText text={"Learning Center"} /> </p></div><button type="button" onClick={onClose} aria-label="Close navigation" className="ml-auto grid h-9 w-9 place-items-center rounded-xl bg-slate-100 lg:hidden"><X className="h-4 w-4" /></button></div>
      <div className="px-4 py-5"><button type="button" onClick={() => navigate('/learning-center')} className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:bg-blue-50"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-600 font-black text-white">{workspace.name[0]}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{workspace.name}</p><p className="mt-0.5 truncate text-[9px] font-bold uppercase tracking-wider text-slate-500">{workspace.role} workspace</p></div><ChevronDown className="h-4 w-4 text-slate-400" /></button></div>
      <nav aria-label="Learning center navigation" className="min-h-0 flex-1 overflow-y-auto px-3"><p className="mb-2 px-3 text-[8px] font-black uppercase tracking-[.22em] text-slate-400">Academic operations</p><div className="space-y-1">{nav.map((item) => { const Icon = item.icon; const active = section === item.key || (item.key === 'overview' && !section); return <button key={item.key} type="button" aria-current={active ? 'page' : undefined} onClick={() => navigate(`/learning-center/${workspace.slug}${item.key === 'overview' ? '' : `/${item.key}`}`)} className={cn('relative flex min-h-11 w-full items-center gap-3 overflow-hidden rounded-xl px-3 text-left text-sm font-bold transition', active ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900')}><span className={cn('grid h-8 w-8 place-items-center rounded-lg', active ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400')}><Icon className="h-[17px] w-[17px]" /></span>{item.label}{active ? <span className="absolute inset-y-2 right-0 w-1 rounded-l-full bg-red-500" /> : null}</button> })}</div></nav>
      <div className="m-4 rounded-2xl border border-blue-100 bg-blue-50 p-4"><BarChart3 className="h-5 w-5 text-blue-600" /><p className="mt-3 text-xs font-black">ProfAI Intelligence</p><p className="mt-1 text-[10px] font-medium leading-4 text-slate-500">Live signals from scores, growth and assignment behavior.</p></div>
      <button type="button" onClick={() => navigate('/dashboard')} className="m-3 mt-0 flex min-h-11 items-center gap-3 rounded-xl px-3 text-xs font-bold text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"><LogOut className="h-4 w-4" /> Return to student platform</button>
    </aside>
  )
  return <><div className="fixed inset-y-0 left-0 z-50 hidden lg:block">{panel}</div>{createPortal(<AnimatePresence>{open ? <><motion.button type="button" aria-label="Close menu" tabIndex={-1} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm lg:hidden" /><motion.div ref={drawerRef} role="dialog" aria-modal="true" aria-label="Workspace navigation" initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', stiffness: 320, damping: 32 }} className="learning-center fixed inset-y-0 left-0 z-50 lg:hidden">{panel}</motion.div></> : null}</AnimatePresence>, document.body)}</>
}
