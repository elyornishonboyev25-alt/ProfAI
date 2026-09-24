import { BookOpen, Building2, ChartNoAxesCombined, LayoutDashboard, NotebookPen } from 'lucide-react'

export const WORKSPACE_NAVIGATION = [
  { label: 'Dashboard', mobile: 'Dashboard', path: '/dashboard', icon: LayoutDashboard,
    matches: (p: string) => p === '/' || p === '/dashboard' },
  { label: 'IELTS', mobile: 'IELTS', path: '/ielts', icon: BookOpen,
    matches: (p: string) => /^\/(ielts|mock\/ielts|academic-skills|writing-lab|speaking-lab|shadowing-lab|podcast|articles)(\/|$)/.test(p) },
  { label: 'SAT', mobile: 'SAT', path: '/sat', icon: NotebookPen,
    matches: (p: string) => /^\/(sat|mock\/sat|vocabulary\/sat)(\/|$)/.test(p) },
  { label: 'University Applications', mobile: 'Apply', path: '/admission', icon: Building2,
    matches: (p: string) => p.startsWith('/admission') || p === '/journey-plan' },
  { label: 'My Results', mobile: 'Results', path: '/profile', icon: ChartNoAxesCombined,
    matches: (p: string) => /^\/(profile|results|analyze-mistakes)(\/|$)/.test(p) },
]
