import { type ComponentType, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  AudioLines,
  BookOpenText,
  Building2,
  FileText,
  Gauge,
  GraduationCap,
  Headphones,
  Languages,
  Trophy,
  Users,
} from 'lucide-react'
import { cn } from '../ui/utils'
import { BrandMark } from '@/components/brand/BrandLogo'

type NavItem = {
  id: string
  label: string
  description?: string
  icon: ComponentType<{ className?: string }>
  path: string
  aliases?: string[]
}

const PRIMARY_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Gauge, path: '/dashboard' },
  { id: 'ielts', label: 'IELTS Mock', icon: BookOpenText, path: '/ielts', aliases: ['/mock/ielts'] },
  { id: 'sat', label: 'SAT Mock', icon: GraduationCap, path: '/sat', aliases: ['/mock/sat'] },
  {
    id: 'admission',
    label: 'Admission Hub',
    description: 'Top universities',
    icon: Building2,
    path: '/admission/universities',
    aliases: ['/admission'],
  },
]

const SECONDARY_ITEMS: NavItem[] = [
  { id: 'articles', label: 'Articles', icon: FileText, path: '/articles' },
  { id: 'podcast', label: 'Podcast', icon: Headphones, path: '/podcast' },
  { id: 'shadowing', label: 'Shadowing', icon: AudioLines, path: '/shadowing-lab' },
  { id: 'community', label: 'Community', icon: Users, path: '/community', aliases: ['/speaking-community'] },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy, path: '/leaderboard' },
  { id: 'vocabulary', label: 'Vocabulary', icon: Languages, path: '/vocabulary' },
]

export function Sidebar({ concealed = false }: { concealed?: boolean }) {
  const sidebarRef = useRef<HTMLElement>(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const element = sidebarRef.current
    if (!element) return
    if (concealed) element.setAttribute('inert', '')
    else element.removeAttribute('inert')
  }, [concealed])

  const isActive = (path: string, aliases: string[] = []) => {
    if (path === '/dashboard') return location.pathname === '/' || location.pathname === '/dashboard'
    if (location.pathname.startsWith(path)) return true
    return aliases.some((alias) => location.pathname.startsWith(alias))
  }

  const renderItem = (item: NavItem, primary: boolean) => {
    const active = isActive(item.path, item.aliases)
    const Icon = item.icon

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => navigate(item.path)}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'group relative flex w-full items-center text-left transition-all duration-200',
          primary
            ? 'min-h-[3.25rem] gap-3 rounded-[1rem] px-3 py-2.5 text-[13px] font-bold'
            : 'min-h-11 gap-3 rounded-xl px-3 py-2 text-[13px] font-semibold',
          primary && active
            ? 'sidebar-primary-active text-white'
            : primary
              ? 'text-slate-800 hover:bg-white/80 hover:shadow-[0_10px_24px_rgba(107,35,45,0.08)]'
              : active
                ? 'bg-blue-50/90 text-blue-700'
                : 'text-slate-600 hover:bg-white/70 hover:text-slate-950',
        )}
      >
        <span
          className={cn(
            'flex shrink-0 items-center justify-center transition-colors',
            primary ? 'h-9 w-9 rounded-xl' : 'h-8 w-8 rounded-lg',
            primary && active
              ? 'sidebar-primary-active-icon bg-white/12 text-white'
              : primary
                ? 'border border-slate-200/80 bg-white/85 text-slate-600 group-hover:border-blue-200 group-hover:text-blue-700'
                : active
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-400 group-hover:text-blue-500',
          )}
        >
          <Icon className={primary ? 'h-[19px] w-[19px]' : 'h-[18px] w-[18px]'} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate">{item.label}</span>
          {item.description ? (
            <span className={cn('mt-0.5 block truncate text-[10px] font-semibold', active ? 'text-blue-100/80' : 'text-slate-400')}>
              {item.description}
            </span>
          ) : null}
        </span>
      </button>
    )
  }

  return (
    <aside
      ref={sidebarRef}
      aria-hidden={concealed}
      className={cn(
        'profai-sidebar fixed bottom-5 left-5 top-5 z-40 hidden w-[17.5rem] flex-col transition-[transform,opacity] duration-300 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none lg:flex',
        concealed ? '-translate-x-[115%] opacity-0 pointer-events-none' : 'translate-x-0 opacity-100',
      )}
    >
      <div className="flex h-full min-h-0 flex-col px-4 py-5">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="flex min-h-16 items-center gap-3 rounded-2xl px-2.5 text-left transition hover:bg-white/65"
        >
          <BrandMark size={51} className="drop-shadow-[0_11px_13px_rgba(220,38,38,0.32)]" />
          <div className="min-w-0">
            <p className="truncate text-[1.55rem] font-black leading-none tracking-[-0.06em] text-slate-900">
              Prof<span className="text-red-600">AI</span>
            </p>
            <p className="mt-1 truncate text-[9px] font-bold uppercase tracking-[0.13em] text-slate-400">Learn. Practice. Achieve.</p>
          </div>
        </button>

        <nav className="no-scrollbar mt-5 min-h-0 flex-1 overflow-y-auto" aria-label="Primary navigation">
          <div className="sidebar-primary-cluster rounded-[1.55rem] p-2">
            <p className="sidebar-core-heading mb-1 px-2 pt-1 text-[9px] font-black uppercase tracking-[0.19em]">Core learning</p>
            <div className="space-y-1">{PRIMARY_ITEMS.map((item) => renderItem(item, true))}</div>
          </div>

          <div className="mx-3 my-4 flex items-center gap-2" aria-hidden="true">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-slate-200" />
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Explore</span>
            <span className="h-px flex-1 bg-gradient-to-r from-slate-200 via-slate-200 to-transparent" />
          </div>

          <div className="space-y-0.5 px-1">{SECONDARY_ITEMS.map((item) => renderItem(item, false))}</div>
        </nav>

        <div className="mt-4 rounded-2xl border border-white/80 bg-white/45 px-3 py-2.5 text-center shadow-inner">
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">Your path to</p>
          <p className="mt-0.5 text-xs font-black text-slate-700">Top universities abroad</p>
        </div>
      </div>
    </aside>
  )
}
