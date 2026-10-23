import type { SATQuestion } from './practiceTest4'

// Group source-specific labels for practice without changing questions or saved keys.
export function bankDomain(domain: string) {
  return domain.replace('Problem Solving', 'Problem-Solving')
}

export function bankSkill(question: Pick<SATQuestion, 'section' | 'domain' | 'skill'>) {
  const skill = question.skill.toLowerCase()
  const domain = bankDomain(question.domain)
  if (question.section === 'math') {
    if (domain === 'Algebra') {
      if (skill.includes('system')) return 'Systems of linear equations'
      if (skill.includes('inequalit')) return 'Linear inequalities'
      return 'Linear equations & functions'
    }
    if (domain === 'Advanced Math') {
      if (/expression|factor|exponent/.test(skill)) return 'Equivalent expressions'
      return 'Nonlinear equations & functions'
    }
    if (domain === 'Problem-Solving and Data Analysis') {
      if (/probability/.test(skill)) return 'Ratios, data & probability'
      if (/ratio|percent|unit|conversion/.test(skill)) return 'Ratios & percentages'
      return 'Data & statistics'
    }
    return 'Geometry & trigonometry'
  }
  if (domain === 'Craft and Structure') {
    if (skill === 'words in context') return 'Words in context'
    if (skill.includes('cross-text')) return 'Cross-text connections'
    return 'Text structure & purpose'
  }
  if (domain === 'Information and Ideas') {
    return skill.includes('central') ? 'Central ideas & details' : 'Evidence & inferences'
  }
  if (domain === 'Standard English Conventions') {
    return skill === 'boundaries' ? 'Sentence boundaries' : 'Grammar & sentence structure'
  }
  return skill === 'transitions' ? 'Transitions' : 'Rhetorical synthesis'
}
