import {
  SAT_PRACTICE_TEST_4,
  SAT_PRACTICE_TEST_4_MODULES,
  type SATModule,
  type SATSection,
} from './practiceTest4'
import { SAT_PAPER_17, SAT_PAPER_17_MODULES } from './paper17'

export type SATTestDefinition = {
  mockId: number
  id: string
  title: string
  subtitle: string
  questionCount: number
  totalDurationSeconds: number
  modules: SATModule[]
  badge: string
}

export const SAT_TEST_CATALOG: Record<number, SATTestDefinition> = {
  4: {
    mockId: 4,
    ...SAT_PRACTICE_TEST_4,
    modules: SAT_PRACTICE_TEST_4_MODULES,
    badge: 'College Board Practice Test 04',
  },
  17: {
    mockId: 17,
    ...SAT_PAPER_17,
    modules: SAT_PAPER_17_MODULES,
    badge: 'Free Test · Paper 17',
  },
}

export function getSATTest(mockId?: string | number): SATTestDefinition {
  const parsed = Number(mockId)
  return SAT_TEST_CATALOG[parsed] ?? SAT_TEST_CATALOG[4]
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
