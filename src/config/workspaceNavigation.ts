import { BookOpen, Building2, ChartNoAxesCombined, House } from 'lucide-react'

export const WORKSPACE_NAVIGATION = [
  { label: 'Home', mobile: 'Home', path: '/dashboard', icon: House,
    matches: (p: string) => p === '/' || p === '/dashboard' },
  { label: 'IELTS · SAT', mobile: 'IELTS · SAT', path: '/test-preparation', icon: BookOpen,
    matches: (p: string) => /^\/(test-preparation|academic-skills|ielts|sat|mock|tests|test|vocabulary|articles|podcast|shadowing-lab|writing-lab|speaking-lab)(\/|$)/.test(p) },
  { label: 'University Applications', mobile: 'Apply', path: '/admission', icon: Building2,
    matches: (p: string) => p.startsWith('/admission') || p === '/journey-plan' },
  { label: 'My Results', mobile: 'Results', path: '/profile', icon: ChartNoAxesCombined,
    matches: (p: string) => /^\/(profile|results|analyze-mistakes)(\/|$)/.test(p) },
]
