import { QS_EDITION, universities } from '@/data/admission'

const UNIVERSITY_HINTS = [
  'university', 'universitet', 'college', 'admission', 'requirement', 'talab', 'rank',
  'ielts score', 'sat score', 'tuition', 'scholarship', 'grant', 'qabul', 'topshirish',
]

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function mentionsUniversityTopic(message: string) {
  const value = normalize(message)
  return UNIVERSITY_HINTS.some((hint) => value.includes(hint))
}

export function describeRelevantSiteKnowledge(message: string): string {
  if (!mentionsUniversityTopic(message)) return ''

  const query = normalize(message)
  const matches = universities.filter((university) => {
    const aliases = [university.name, university.shortName, university.slug.replace(/-/g, ' ')]
    return aliases.some((alias) => {
      const normalizedAlias = normalize(alias)
      return normalizedAlias.length >= 3 && (query.includes(normalizedAlias) || normalizedAlias.includes(query))
    })
  })

  if (matches.length === 0) {
    return [
      `INTERNAL UNIVERSITY CATALOG (${QS_EDITION}):`,
      universities.map((university) => `#${university.rank} ${university.name} (${university.city}, ${university.country})`).join('; '),
      'No exact catalog match was found for the learner’s wording. Do not invent a profile or requirement. Say when the requested university is not yet in ProfAI’s catalog and offer general guidance or the closest listed match.',
    ].join('\n')
  }

  return matches.slice(0, 3).map((university) => {
    const requirements = university.admission?.bachelor?.length
      ? university.admission.bachelor.map((item) => `${item.label}: ${item.value}`).join(', ')
      : 'No entry scores stored in ProfAI'
    const annualLiving = university.costOfLiving
      ? Object.entries(university.costOfLiving)
          .filter(([key, value]) => key !== 'currency' && typeof value === 'number')
          .reduce((sum, [, value]) => sum + Number(value), 0)
      : null

    return [
      `VERIFIED PROFai CATALOG RECORD — ${university.name}`,
      `Edition: ${QS_EDITION}; rank #${university.rank}; overall ${university.overallScore}/100.`,
      `Location: ${university.city}, ${university.country}; type: ${university.type}; founded: ${university.founded}.`,
      `Profile: ${university.about}`,
      `Stored undergraduate indicators: ${requirements}.`,
      university.admission?.note ? `Catalog note: ${university.admission.note}` : '',
      annualLiving !== null ? `Stored annual living-cost estimate: ${annualLiving} ${university.costOfLiving?.currency ?? 'USD'} (not tuition).` : '',
      `Official website: ${university.website}`,
      'Accuracy rule: present these as ProfAI catalog data, not a guaranteed current offer. Requirements vary by programme and cycle; explicitly recommend confirming consequential details on the official website. Never add a deadline, acceptance rate, tuition, scholarship or score that is absent above.',
    ].filter(Boolean).join('\n')
  }).join('\n\n')
}
