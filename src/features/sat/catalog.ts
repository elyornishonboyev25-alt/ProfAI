import {
  SAT_PRACTICE_TEST_4,
  SAT_PRACTICE_TEST_4_MODULES,
  type SATModule,
  type SATSection,
} from './practiceTest4'
import { SAT_PAPER_17, SAT_PAPER_17_MODULES } from './paper17'
import {
  SAT_DECEMBER_2025_INTL,
  SAT_DECEMBER_2025_INTL_MODULES,
} from './december2025Intl'
import { SAT_MAY_2026_INTL, SAT_MAY_2026_INTL_MODULES } from './may2026Intl'

export type SATTestDefinition = {
  mockId: number
  id: string
  title: string
  subtitle: string
  questionCount: number
  totalDurationSeconds: number
  modules: SATModule[]
  badge: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
}

export const SAT_TEST_CATALOG: Record<number, SATTestDefinition> = {
  1: {
    mockId: 1,
    ...SAT_PRACTICE_TEST_4,
    modules: SAT_PRACTICE_TEST_4_MODULES,
    badge: 'College Board Practice Test 1',
    difficulty: 'Hard',
  },
  2: {
    mockId: 2,
    ...SAT_PAPER_17,
    modules: SAT_PAPER_17_MODULES,
    badge: 'Free Test · Practice Test 2',
    difficulty: 'Medium',
  },
  3: {
    mockId: 3,
    ...SAT_DECEMBER_2025_INTL,
    modules: SAT_DECEMBER_2025_INTL_MODULES,
    badge: 'December 2025 International · Version 1',
    difficulty: 'Easy',
  },
  4: {
    mockId: 4,
    ...SAT_MAY_2026_INTL,
    modules: SAT_MAY_2026_INTL_MODULES,
    badge: 'May 2026 International · Version 1',
    difficulty: 'Medium',
  },
}

export function getSATTest(mockId?: string | number): SATTestDefinition {
  const parsed = Number(mockId)
  return SAT_TEST_CATALOG[parsed] ?? SAT_TEST_CATALOG[1]
}

export function hasSATTest(mockId?: string | number): boolean {
  return Boolean(SAT_TEST_CATALOG[Number(mockId)])
}

export function isSATSection(value: string | null | undefined): value is SATSection {
  return value === 'math' || value === 'reading-writing'
}

export function getSATSectionTest(
  mockId?: string | number,
  section?: string | null,
): SATTestDefinition {
  const test = getSATTest(mockId)
  if (!isSATSection(section)) return test

  const modules = test.modules.filter((module) => module.section === section)
  const sectionTitle = section === 'math' ? 'Math' : 'Reading & Writing'

  return {
    ...test,
    id: `${test.id}-${section}`,
    title: `${test.title} · ${sectionTitle}`,
    subtitle: `${sectionTitle} section practice`,
    questionCount: modules.reduce((total, module) => total + module.questions.length, 0),
    totalDurationSeconds: modules.reduce((total, module) => total + module.durationSeconds, 0),
    modules,
    badge: `${test.badge} · ${sectionTitle}`,
  }
}
