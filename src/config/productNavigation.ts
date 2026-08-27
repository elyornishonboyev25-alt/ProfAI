import type { ComponentType } from 'react'
import {
  BookOpenCheck,
  Bot,
  Building2,
  ClipboardCheck,
  Languages,
  type LucideProps,
} from 'lucide-react'

export type ProductPillarId =
  | 'test-preparation'
  | 'academic-skills'
  | 'universities'
  | 'applications'
  | 'ai-coach'

export type ProductNavigationItem = {
  id: ProductPillarId
  label: string
  mobileLabel: string
  description: string
  path: string
  icon: ComponentType<LucideProps>
  matches: (pathname: string) => boolean
}

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

export const PRODUCT_NAVIGATION: ProductNavigationItem[] = [
  {
    id: 'test-preparation',
    label: 'Test Preparation',
    mobileLabel: 'Prep',
    description: 'IELTS & SAT',
    path: '/test-preparation',
    icon: BookOpenCheck,
    matches: (pathname) => [
      '/test-preparation',
      '/ielts',
      '/sat',
      '/mock',
      '/tests',
      '/test',
      '/results',
      '/analyze-mistakes',
    ].some((prefix) => matchesPrefix(pathname, prefix)),
  },
  {
    id: 'academic-skills',
    label: 'Academic Skills',
    mobileLabel: 'Skills',
    description: 'English for study',
    path: '/academic-skills',
    icon: Languages,
    matches: (pathname) => [
      '/academic-skills',
      '/vocabulary',
      '/articles',
      '/podcast',
      '/shadowing-lab',
      '/writing-lab',
      '/speaking-lab',
    ].some((prefix) => matchesPrefix(pathname, prefix)),
  },
  {
    id: 'universities',
    label: 'Universities',
    mobileLabel: 'Universities',
    description: 'Research & shortlist',
    path: '/admission/universities',
    icon: Building2,
    matches: (pathname) => matchesPrefix(pathname, '/admission/universities'),
  },
  {
    id: 'applications',
    label: 'Applications',
    mobileLabel: 'Applications',
    description: 'Plan every step',
    path: '/admission',
    icon: ClipboardCheck,
    matches: (pathname) =>
      pathname === '/admission' ||
      matchesPrefix(pathname, '/admission/lessons') ||
      matchesPrefix(pathname, '/admission/shortlist'),
  },
  {
    id: 'ai-coach',
    label: 'AI Coach',
    mobileLabel: 'AI Coach',
    description: 'Personal guidance',
    path: '/ai-tutor',
    icon: Bot,
    matches: (pathname) => matchesPrefix(pathname, '/ai-tutor'),
  },
]

export function findActiveProductPillar(pathname: string) {
  return PRODUCT_NAVIGATION.find((item) => item.matches(pathname))
}
