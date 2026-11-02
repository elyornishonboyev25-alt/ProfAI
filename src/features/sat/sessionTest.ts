import { readActiveTestPaper } from '@/utils/activeTestPaper'
import { loadSATAttempt } from './attemptStorage'
import { getSATReviewTests, getSATSectionTest, type SATTestDefinition } from './catalog'

function sameSection(test: SATTestDefinition, section?: string | null) {
  return section ? test.modules.every(module => module.section === section)
    : test.modules.some(module => module.section === 'math') && test.modules.some(module => module.section === 'reading-writing')
}

/** A route number can outlive several content releases. Resume its actual paper. */
export function getSATSessionTest(mockId: string | number, section?: string | null, testId?: string | null): SATTestDefinition {
  const current = getSATSectionTest(mockId, section)
  const versions = getSATReviewTests().filter(test => test.mockId === current.mockId && sameSection(test, section))
  const explicit = testId ? versions.find(test => test.id === testId) : undefined
  const active = !explicit ? versions.flatMap(test => {
    const attempt = loadSATAttempt(test.id)
    return attempt?.status === 'active' ? [{ test, at: attempt.updatedAt }] : []
  }).sort((a, b) => b.at - a.at)[0]?.test : undefined
  const selected = explicit ?? active ?? current
  const paper = readActiveTestPaper<SATTestDefinition>(`profai:sat:${selected.id}:attempt:v1`)
  return paper?.id === selected.id ? paper : selected
}

export function satRunSearch(test: SATTestDefinition, section?: string | null, diagnostic = false) {
  const params = new URLSearchParams({ testId: test.id })
  if (section) params.set('section', section)
  if (diagnostic) params.set('diagnostic', '1')
  return `?${params}`
}
