import type { ComponentType, SVGProps } from 'react'
import {
  AudioLines,
  BarChart3,
  BookMarked,
  BookOpen,
  FileText,
  GraduationCap,
  Headphones,
  Headset,
  Home,
  Landmark,
  Library,
  Mic2,
  PenSquare,
  ShieldCheck,
  TriangleAlert,
  Trophy,
  Users,
} from 'lucide-react'

export type NavItem = {
  id: string
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  path: string
  aliases?: string[]
}

export type NavGroup = {
  heading: string
  items: NavItem[]
}

/**
 * Single source of truth for the primary app navigation. Consumed by both the
 * desktop Sidebar and the mobile slide-in drawer so the two never drift apart.
 * Account actions (My Profile / Sign out) live in the TopBar, not here.
 */
export const navGroups: NavGroup[] = [
  {
    heading: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
      { id: 'performance', label: 'Performance', icon: BarChart3, path: '/profile' },
      { id: 'analyze-mistakes', label: 'Analyze Mistakes', icon: TriangleAlert, path: '/analyze-mistakes' },
    ],
  },
  {
    heading: 'Practice',
    items: [
      { id: 'ielts', label: 'IELTS Prep', icon: BookOpen, path: '/ielts' },
      { id: 'sat', label: 'SAT Prep', icon: GraduationCap, path: '/sat' },
      { id: 'tests', label: 'Test Library', icon: Library, path: '/tests' },
      { id: 'mock', label: 'Mock Arena', icon: ShieldCheck, path: '/mock' },
    ],
  },
  {
    heading: 'Skills & Media',
    items: [
      { id: 'writing-lab', label: 'Writing Studio', icon: PenSquare, path: '/writing-lab' },
      { id: 'speaking-lab', label: 'Speaking Studio', icon: Mic2, path: '/speaking-lab' },
      { id: 'vocabulary', label: 'Vocabulary', icon: BookMarked, path: '/vocabulary' },
      { id: 'shadowing', label: 'Shadowing Lab', icon: AudioLines, path: '/shadowing-lab' },
      { id: 'podcast', label: 'Podcast', icon: Headphones, path: '/podcast' },
      { id: 'articles', label: 'Articles', icon: FileText, path: '/articles' },
    ],
  },
  {
    heading: 'Community & Guidance',
    items: [
      { id: 'leaderboard', label: 'Leaderboard', icon: Trophy, path: '/leaderboard' },
      { id: 'community', label: 'Community', icon: Users, path: '/community' },
      { id: 'speaking-community', label: 'Speaking Community', icon: Headset, path: '/speaking-community' },
      { id: 'admission', label: 'Admission', icon: Landmark, path: '/admission' },
    ],
  },
]

/** Routes that should treat the Dashboard nav item as active. */
export const DASHBOARD_PATHS = ['/', '/dashboard', '/about']
