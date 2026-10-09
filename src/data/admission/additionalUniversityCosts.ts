import type { CostOfLiving, University } from './types'

// University-published budgets checked on 9 October 2026. Tuition is excluded.
const costs: Record<string, CostOfLiving> = {
  'Arizona State University': {
    amount: 24132, currency: 'USD', period: 'academic-year', academicYear: '2026–27',
    label: 'Official undergraduate non-tuition budget',
    includes: ['Housing & meals', 'Books & supplies', 'Travel', 'Personal expenses'],
    note: 'Sum of the university’s published living and study expenses. Tuition and university fees are excluded. Health insurance is extra; the page still lists its 2025–26 insurance rate.',
    sourceUrl: 'https://admission.asu.edu/cost-aid/international', verifiedAt: '2026-10-09',
  },
  'The University of Arizona': {
    amount: 23370, currency: 'USD', period: 'academic-year', academicYear: '2026–27',
    label: 'Official undergraduate non-tuition budget',
    includes: ['Housing & food', 'Books & course materials', 'Travel & miscellaneous expenses'],
    note: 'Sum of the published on-campus housing/food, books and travel/miscellaneous amounts. Tuition and fees are excluded; actual costs vary by housing and personal circumstances.',
    sourceUrl: 'https://financialaid.arizona.edu/cost/incoming', verifiedAt: '2026-10-09',
  },
  'University of Liverpool': {
    amount: 900, maxAmount: 1350, currency: 'GBP', period: 'month',
    label: 'Official estimated monthly living expenses',
    includes: ['Accommodation', 'Food', 'Local travel', 'Household & personal expenses'],
    note: 'Student spending estimate, not the visa proof-of-funds requirement. Tuition is excluded. Housing choice and lifestyle can change the total.',
    sourceUrl: 'https://www.liverpool.ac.uk/international/scholarships-and-fees/living-costs/', verifiedAt: '2026-10-09',
  },
  'University of Exeter': {
    amount: 1300, maxAmount: 2000, currency: 'GBP', period: 'month', academicYear: 'April 2026 estimate',
    label: 'Official monthly living-cost estimate for a single student',
    includes: ['Accommodation', 'Transport', 'Food & drink', 'Utilities', 'Clothing & leisure'],
    note: 'Applies to Exeter or Cornwall; spending varies with lifestyle. Tuition and visa costs are separate.',
    sourceUrl: 'https://www.exeter.ac.uk/international-students/living-in-the-uk/budgeting/', verifiedAt: '2026-10-09',
  },
}

export function enrichUniversityWithLivingCosts(university: University): University {
  const cost = costs[university.name]
  if (!cost || university.costOfLiving) return university
  return {
    ...university,
    costOfLiving: cost,
    sources: [...(university.sources ?? []), { label: 'Official student living costs', url: cost.sourceUrl }],
  }
}
