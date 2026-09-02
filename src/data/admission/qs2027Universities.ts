import type { QSIndicators, University, UniversityBrand } from './types'
import {
  QS_2027_RANKED_UNIVERSITY_COUNT,
  QS_2027_UNIVERSITY_CATALOG,
  type Qs2027CatalogRow,
} from './qs2027UniversityCatalog'

const QS_RANKING_URL = 'https://www.topuniversities.com/world-university-rankings'

const COUNTRY_ALIASES: Record<string, string> = {
  'Brunei Darussalam': 'Brunei',
  'Hong Kong SAR, China': 'Hong Kong SAR',
  'Iran (Islamic Republic of)': 'Iran',
  'Macao SAR, China': 'Macau SAR',
  Palestine: 'Palestinian Territories',
  'Republic of Korea': 'South Korea',
  'Russian Federation': 'Russia',
  'Syrian Arab Republic': 'Syria',
  'United States of America': 'United States',
  'Venezuela (Bolivarian Republic of)': 'Venezuela',
  'Viet Nam': 'Vietnam',
}

// These profiles were first published with shorter names. Preserve their URLs
// while showing QS's final official display names.
const LEGACY_SLUGS: Record<string, string> = {
  'University of Canterbury | Te Whare Wānanga o Waitaha': 'university-of-canterbury',
  'IPB University (aka Bogor Agricultural University)': 'ipb-university-bogor-agricultural-university',
  'Toronto Metropolitan University (formerly Ryerson University)': 'toronto-metropolitan-university',
  'Saveetha Institute of Medical And Technical Sciences (SIMATS) , Tamil Nadu,India': 'saveetha-institute-of-medical-and-technical-sciences-simats',
  'University of Colorado Denver | Anschutz Medical Campus': 'university-of-colorado-denver',
}

const COUNTRY_CODES: Record<string, string> = {
  Argentina: 'AR', Armenia: 'AM', Australia: 'AU', Austria: 'AT', Azerbaijan: 'AZ', Bahrain: 'BH', Bangladesh: 'BD', Belarus: 'BY', Belgium: 'BE',
  'Bosnia and Herzegovina': 'BA', Brazil: 'BR', Brunei: 'BN', Bulgaria: 'BG', Canada: 'CA', Chile: 'CL', 'China (Mainland)': 'CN', Colombia: 'CO',
  'Costa Rica': 'CR', Croatia: 'HR', Cuba: 'CU', Cyprus: 'CY', Czechia: 'CZ', Denmark: 'DK', 'Dominican Republic': 'DO', Ecuador: 'EC', Egypt: 'EG',
  Estonia: 'EE', Ethiopia: 'ET', Finland: 'FI', France: 'FR', Georgia: 'GE', Germany: 'DE', Ghana: 'GH', Greece: 'GR', Guatemala: 'GT', Honduras: 'HN',
  'Hong Kong SAR': 'HK', Hungary: 'HU', Iceland: 'IS', India: 'IN', Indonesia: 'ID', Iran: 'IR', Iraq: 'IQ', Ireland: 'IE', Israel: 'IL', Italy: 'IT',
  Japan: 'JP', Jordan: 'JO', Kazakhstan: 'KZ', Kenya: 'KE', Kuwait: 'KW', Kyrgyzstan: 'KG', Latvia: 'LV', Lebanon: 'LB', Lithuania: 'LT', Luxembourg: 'LU',
  'Macau SAR': 'MO', Malaysia: 'MY', Malta: 'MT', Mexico: 'MX', Morocco: 'MA', Netherlands: 'NL', 'New Zealand': 'NZ', Nigeria: 'NG', 'Northern Cyprus': 'CY',
  Norway: 'NO', Oman: 'OM', Pakistan: 'PK', 'Palestinian Territories': 'PS', Panama: 'PA', Paraguay: 'PY', Peru: 'PE', Philippines: 'PH', Poland: 'PL',
  Portugal: 'PT', 'Puerto Rico': 'PR', Qatar: 'QA', Romania: 'RO', Russia: 'RU', 'Saudi Arabia': 'SA', Serbia: 'RS', Singapore: 'SG', Slovakia: 'SK',
  Slovenia: 'SI', 'South Africa': 'ZA', 'South Korea': 'KR', Spain: 'ES', 'Sri Lanka': 'LK', Sudan: 'SD', Sweden: 'SE', Switzerland: 'CH', Syria: 'SY',
  Taiwan: 'TW', Tanzania: 'TZ', Thailand: 'TH', Tunisia: 'TN', Türkiye: 'TR', Uganda: 'UG', Ukraine: 'UA', 'United Arab Emirates': 'AE',
  'United Kingdom': 'GB', 'United States': 'US', Uruguay: 'UY', Uzbekistan: 'UZ', Venezuela: 'VE', Vietnam: 'VN',
}

const BRAND_PALETTES: UniversityBrand[] = [
  { monogram: '', gradient: 'linear-gradient(150deg,#172554,#1d4ed8 60%,#60a5fa)', accent: '#2563EB', ink: '#ffffff' },
  { monogram: '', gradient: 'linear-gradient(150deg,#3f0d12,#9f1239 60%,#fb7185)', accent: '#BE123C', ink: '#ffffff' },
  { monogram: '', gradient: 'linear-gradient(150deg,#052e2b,#0f766e 60%,#5eead4)', accent: '#0F766E', ink: '#ffffff' },
  { monogram: '', gradient: 'linear-gradient(150deg,#2e1065,#6d28d9 60%,#c4b5fd)', accent: '#6D28D9', ink: '#ffffff' },
  { monogram: '', gradient: 'linear-gradient(150deg,#422006,#b45309 60%,#fbbf24)', accent: '#B45309', ink: '#ffffff' },
  { monogram: '', gradient: 'linear-gradient(150deg,#082f49,#0369a1 60%,#7dd3fc)', accent: '#0369A1', ink: '#ffffff' },
]

function normalizedIdentity(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/^the\s+/, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '')
}

function identityKeys(value: string) {
  const keys = new Set([normalizedIdentity(value)])
  const withoutParenthetical = value.replace(/\s*\([^)]*\)\s*/g, ' ').trim()
  if (withoutParenthetical) keys.add(normalizedIdentity(withoutParenthetical))
  for (const match of value.matchAll(/\(([^)]+)\)/g)) {
    if (match[1]) keys.add(normalizedIdentity(match[1]))
  }
  return keys
}

function slugify(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function shortName(name: string) {
  const abbreviations = [...name.matchAll(/\(([^)]+)\)/g)].map((match) => match[1].trim())
  const abbreviation = abbreviations.find((value) => value.length <= 18 && /[A-Z]/.test(value))
  if (abbreviation) return abbreviation
  const withoutArticle = name.replace(/^The\s+/, '')
  if (withoutArticle.length <= 34) return withoutArticle
  return withoutArticle.split(/\s+/).slice(0, 4).join(' ')
}

function monogram(name: string) {
  const compact = shortName(name).replace(/[^A-Za-z0-9]/g, '')
  if (compact.length <= 5) return compact.toUpperCase()
  const initials = name
    .replace(/\([^)]*\)/g, '')
    .split(/[^A-Za-z0-9]+/)
    .filter((part) => part && !['the', 'of', 'and', 'in'].includes(part.toLowerCase()))
    .map((part) => part[0])
    .join('')
  return (initials || compact).slice(0, 4).toUpperCase()
}

function brandFor(name: string): UniversityBrand {
  const hash = [...name].reduce((total, character) => total + character.charCodeAt(0), 0)
  return { ...BRAND_PALETTES[hash % BRAND_PALETTES.length], monogram: monogram(name) }
}

function flagFor(country: string) {
  const code = COUNTRY_CODES[country]
  if (!code) return '🌍'
  return [...code].map((character) => String.fromCodePoint(127397 + character.charCodeAt(0))).join('')
}

function institutionType(status: string | null) {
  if (status === 'Public') return 'Public university'
  if (status === 'Private not for Profit') return 'Private not-for-profit university'
  if (status === 'Private for Profit') return 'Private for-profit university'
  return 'University'
}

function indicatorsFromRow(row: Qs2027CatalogRow): QSIndicators {
  const values: Array<[keyof QSIndicators, number | null]> = [
    ['academicReputation', row[7]],
    ['employerReputation', row[8]],
    ['facultyStudentRatio', row[9]],
    ['citationsPerFaculty', row[10]],
    ['internationalFacultyRatio', row[11]],
    ['internationalStudentRatio', row[12]],
    ['internationalResearchNetwork', row[13]],
    ['employmentOutcomes', row[14]],
    ['sustainability', row[15]],
  ]
  return Object.fromEntries(values.filter((entry): entry is [keyof QSIndicators, number] => typeof entry[1] === 'number'))
}

const exactRankCounts = new Map<number, number>()
for (const row of QS_2027_UNIVERSITY_CATALOG) {
  if (row[1] === null) exactRankCounts.set(row[0], (exactRankCounts.get(row[0]) ?? 0) + 1)
}

function universityFromRow(row: Qs2027CatalogRow): University {
  const [rank, rankLabel, name, city, sourceCountry, status, overallScore] = row
  const country = COUNTRY_ALIASES[sourceCountry] ?? sourceCountry
  const type = institutionType(status)
  const location = city ? `${city}, ${country}` : country
  const slug = LEGACY_SLUGS[name] ?? slugify(name)

  return {
    id: slug,
    slug,
    rank,
    rankLabel: rankLabel ?? undefined,
    rankTied: rankLabel === null && (exactRankCounts.get(rank) ?? 0) > 1,
    name,
    shortName: shortName(name),
    city: city || country,
    country,
    countryEmoji: flagFor(country),
    overallScore: overallScore ?? undefined,
    type,
    tagline: `${type} in ${location}, listed in the ${QS_2027_RANKED_UNIVERSITY_COUNT.toLocaleString('en-US')}-institution QS 2027 ranking.`,
    about: `${name} is located in ${location}. This catalog profile includes its published QS World University Rankings 2027 position and indicator scores; admission requirements and costs should be checked with the institution directly.`,
    brand: brandFor(name),
    indicators: indicatorsFromRow(row),
    sources: [{ label: 'QS World University Rankings 2027', url: QS_RANKING_URL }],
  }
}

export function buildMissingQs2027Universities(existingUniversities: University[]) {
  const existingKeys = new Set<string>()
  for (const university of existingUniversities) {
    for (const value of [university.name, university.shortName]) {
      for (const key of identityKeys(value)) existingKeys.add(key)
    }
  }

  return QS_2027_UNIVERSITY_CATALOG
    .filter((row) => [...identityKeys(row[2])].every((key) => !existingKeys.has(key)))
    .map(universityFromRow)
}

export { QS_2027_RANKED_UNIVERSITY_COUNT }
