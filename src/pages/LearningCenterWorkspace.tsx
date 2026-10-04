import '@/features/learningCenter/learning-center.css'
import { ErrorState, secondaryButton } from '@/features/learningCenter/components'
import { useEffect, useRef, type ComponentType } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowUpRight, ClipboardCheck, GraduationCap, LayoutDashboard, Settings2, Trophy, UserRoundCheck, Users } from 'lucide-react'
import BrandPageLoader from '@/components/common/BrandPageLoader'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useAuthStore } from '@/store/authStore'
import { learningCenterApi } from '@/features/learningCenter/api'
import OverviewView from '@/features/learningCenter/OverviewView'
import StudentsView from '@/features/learningCenter/StudentsView'
import StudentDetailView from '@/features/learningCenter/StudentDetailView'
import GroupsView from '@/features/learningCenter/GroupsView'
import AssignmentsView from '@/features/learningCenter/AssignmentsView'
import LeaderboardView from '@/features/learningCenter/LeaderboardView'
import TeamView from '@/features/learningCenter/TeamView'
import SettingsView from '@/features/learningCenter/SettingsView'

type NavItem = { key: string; label: string; icon: ComponentType<{ className?: string }>; managerOnly?: boolean; staffOnly?: boolean }

const NAV_ITEMS: NavItem[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'team', label: 'Members', icon: UserRoundCheck },
  { key: 'groups', label: 'Groups', icon: GraduationCap },
  { key: 'assignments', label: 'Assignments', icon: ClipboardCheck },
  { key: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { key: 'students', label: 'Students', icon: Users },
  { key: 'settings', label: 'Settings', icon: Settings2, managerOnly: true },
]

export default function LearningCenterWorkspacePage() {
  const { workspaceSlug = '' } = useParams()
  const location = useLocation()
  const reducedMotion = useReducedMotion()
  const user = useAuthStore((state) => state.user)
  const { data, loading, error, refetch } = useAsyncData(() => learningCenterApi.workspaces(), [user?.id])
  const workspace = data?.workspaces.find((item) => item.slug === workspaceSlug)
  const pathAfterSlug = location.pathname.split('/').filter(Boolean).slice(2)
  const section = pathAfterSlug[0] || 'overview'
  const detailId = section === 'students' ? pathAfterSlug[1] : undefined
  const navigation = useRef<HTMLElement>(null)
  useEffect(() => {
    const active = navigation.current?.querySelector<HTMLElement>('[aria-current="page"]')
    if (active) navigation.current?.scrollTo({ left: Math.max(0, active.offsetLeft - 12), behavior: reducedMotion ? 'auto' : 'smooth' })
  }, [section, workspaceSlug, reducedMotion, loading])

  if (loading && !data) return <div className="learning-center grid min-h-screen place-items-center"><BrandPageLoader label="Opening Classes" /></div>
  if (error) return <div className="learning-center mx-auto max-w-2xl px-5 py-12"><ErrorState message={error} onRetry={() => void refetch()} /><Link to="/learning-center" className={`${secondaryButton} mt-4`}>Back to Classes</Link></div>
  if (!workspace) return <Navigate to="/learning-center" replace />

  const manager = workspace.role === 'OWNER' || workspace.role === 'ADMIN'
  const staff = manager || workspace.role === 'TEACHER'
  const nav = NAV_ITEMS.filter((item) => (!item.managerOnly || (item.key === 'settings' ? workspace.role === 'OWNER' : manager)) && (!item.staffOnly || staff))
  if (!nav.some((item) => item.key === section)) return <Navigate to={`/learning-center/${workspaceSlug}`} replace />

  return (
    <div className="learning-center lc-workspace-shell min-h-screen text-slate-900">
      <main className="lc-workspace-container mx-auto max-w-[100rem] px-4 pb-12 pt-6 sm:px-6 lg:px-8 lg:pt-8">
        <section className={`lc-workspace-banner ${workspace.coverUrl ? 'has-cover' : ''}`}>
          {workspace.coverUrl && <img className="lc-workspace-banner-image" src={workspace.coverUrl} alt="" />}
          <div className="relative z-10 min-w-0">
            <Link to="/learning-center" className="lc-banner-back"><ArrowLeft className="h-4 w-4" /> Back to Classes</Link>
            <p className="lc-banner-eyebrow"><GraduationCap className="h-4 w-4" /> {workspace.role} CLASS</p>
            <h1 className="mt-4 break-words text-3xl font-black tracking-[-.055em] text-slate-950 sm:text-4xl">{workspace.name}</h1>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-600 sm:text-base">{workspace.city || 'Your learning space'} · {workspace.memberCount} members · {workspace.groupCount} groups</p>
          </div>
          <div className="relative z-10 flex flex-wrap gap-2">
            <Link to="/dashboard" className={secondaryButton}>Dashboard <ArrowUpRight className="h-4 w-4" /></Link>
          </div>
        </section>

        <nav ref={navigation} aria-label="Class sections" className="lc-section-nav">
          {nav.map((item) => {
            const Icon = item.icon
            const active = section === item.key
            return <Link key={item.key} to={`/learning-center/${workspace.slug}${item.key === 'overview' ? '' : `/${item.key}`}`} aria-current={active ? 'page' : undefined} className={`lc-section-link ${active ? 'is-active' : ''}`}><Icon className="h-[18px] w-[18px]" /><span>{item.label}</span></Link>
          })}
        </nav>

        <div className="lc-section-content">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={`${workspaceSlug}-${section}-${detailId ?? ''}`} initial={reducedMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reducedMotion ? { opacity: 1 } : { opacity: 0, y: -5 }} transition={{ duration: reducedMotion ? 0 : .18 }}>
              {section === 'settings' && workspace.role === 'OWNER' ? <SettingsView workspace={workspace} onSaved={() => void refetch()} /> : renderSection(section, detailId, workspaceSlug, manager, staff, workspace.role === 'OWNER')}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

function renderSection(section: string, detailId: string | undefined, slug: string, manager: boolean, staff: boolean, owner: boolean) {
  if (section === 'students' && detailId) return <StudentDetailView slug={slug} studentId={detailId} canManage={staff} />
  if (section === 'students') return <StudentsView slug={slug} canManage={owner} />
  if (section === 'groups') return <GroupsView slug={slug} canManage={manager} />
  if (section === 'assignments') return <AssignmentsView slug={slug} canManage={staff} />
  if (section === 'leaderboard') return <LeaderboardView slug={slug} />
  if (section === 'team') return <TeamView slug={slug} canManage={owner} />
  return <OverviewView slug={slug} />
}
