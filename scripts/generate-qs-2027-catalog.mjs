import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const inputPath = resolve(process.argv[2] ?? '/private/tmp/qs2027.csv')
const outputPath = resolve(process.argv[3] ?? 'src/data/admission/qs2027UniversityCatalog.ts')

function parseCsvLine(line) {
  const values = []
  let value = ''
  let quoted = false

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"'
        index += 1
      } else {
        quoted = !quoted
      }
    } else if (character === ',' && !quoted) {
      values.push(value)
      value = ''
    } else {
      value += character
    }
  }

  values.push(value)
  return values
}

function numeric(value) {
  if (!value || value === 'None') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

// The normalized CSV predates a handful of display-name and country-label
// corrections in QS's final workbook. Keep these aliases here so regenerating
// the catalog stays semantically aligned with the official release while
// removing accidental leading, trailing and repeated whitespace.
const OFFICIAL_NAME_OVERRIDES = new Map([
  ['University of Canterbury', 'University of Canterbury | Te Whare Wānanga o Waitaha'],
  ['IPB University (Bogor Agricultural University)', 'IPB University (aka Bogor Agricultural University)'],
  ['Toronto Metropolitan University', 'Toronto Metropolitan University (formerly Ryerson University)'],
  ['Saveetha Institute of Medical And Technical Sciences (SIMATS)', 'Saveetha Institute of Medical And Technical Sciences (SIMATS) , Tamil Nadu,India'],
  ['University of Colorado Denver', 'University of Colorado Denver | Anschutz Medical Campus'],
])

const OFFICIAL_COUNTRY_OVERRIDES = new Map([
  ['Iran', 'Iran (Islamic Republic of)'],
  ['Venezuela', 'Venezuela (Bolivarian Republic of)'],
])

function officialName(value) {
  const normalized = value.trim().replace(/\s{2,}/g, ' ')
  return OFFICIAL_NAME_OVERRIDES.get(normalized) ?? normalized
}

const rows = readFileSync(inputPath, 'utf8')
  .replace(/^\uFEFF/, '')
  .trim()
  .split(/\r?\n/)
  .slice(1)
  .map(parseCsvLine)

if (rows.length !== 1504) {
  throw new Error(`Expected 1,504 QS 2027 institutions, received ${rows.length}`)
}

const records = rows.map((row) => {
  const rankLabel = row[1]
  const exactRank = /^\d+$/.test(rankLabel)
  const rank = Number(rankLabel.match(/^\d+/)?.[0])
  if (!Number.isFinite(rank)) throw new Error(`Invalid QS rank: ${rankLabel}`)

  return [
    rank,
    exactRank ? null : rankLabel,
    officialName(row[3]),
    row[29],
    OFFICIAL_COUNTRY_OVERRIDES.get(row[4]) ?? row[4],
    row[9] || null,
    numeric(row[28]),
    numeric(row[10]),
    numeric(row[12]),
    numeric(row[14]),
    numeric(row[16]),
    numeric(row[18]),
    numeric(row[20]),
    numeric(row[22]),
    numeric(row[24]),
    numeric(row[26]),
  ]
})

const header = `// Ranking data matches the official QS World University Rankings 2027 workbook published 18 June 2026.\n// City labels are display metadata and are not fields in the official QS workbook.\n// Regenerate with: node scripts/generate-qs-2027-catalog.mjs <input.csv>\n// Source: https://www.qs.com/insights/qs-world-university-rankings-2027-results-table-excel\n\nexport type Qs2027CatalogRow = readonly [\n  rank: number,\n  rankLabel: string | null,\n  name: string,\n  city: string,\n  country: string,\n  institutionType: string | null,\n  overallScore: number | null,\n  academicReputation: number | null,\n  employerReputation: number | null,\n  facultyStudentRatio: number | null,\n  citationsPerFaculty: number | null,\n  internationalFacultyRatio: number | null,\n  internationalStudentRatio: number | null,\n  internationalResearchNetwork: number | null,\n  employmentOutcomes: number | null,\n  sustainability: number | null,\n]\n\nexport const QS_2027_RANKED_UNIVERSITY_COUNT = 1504\n\nexport const QS_2027_UNIVERSITY_CATALOG: readonly Qs2027CatalogRow[] = [\n`

const body = records.map((record) => `  ${JSON.stringify(record)},`).join('\n')
writeFileSync(outputPath, `${header}${body}\n]\n`)

console.log(`Wrote ${records.length} QS 2027 institutions to ${outputPath}`)
