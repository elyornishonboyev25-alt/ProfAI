export type CountryOption = {
  code: string
  name: string
  flag: string
}

// ISO 3166-1 alpha-2 countries and territories, plus the widely supported XK
// code for Kosovo. DisplayNames localises labels while keeping autocomplete complete.
const ISO_COUNTRY_CODES = `
AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ
CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR
GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO
JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR
MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO
RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV
TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW
`.trim().split(/\s+/)

type DisplayNamesConstructor = new (
  locales?: string | string[],
  options?: { type: 'region' },
) => { of(code: string): string | undefined }

const DisplayNames = (Intl as typeof Intl & { DisplayNames?: DisplayNamesConstructor }).DisplayNames
const regionNames = DisplayNames ? new DisplayNames(['en'], { type: 'region' }) : null

function countryFlag(code: string) {
  return code
    .toUpperCase()
    .split('')
    .map((letter) => String.fromCodePoint(127397 + letter.charCodeAt(0)))
    .join('')
}

export const WORLD_COUNTRIES: CountryOption[] = ISO_COUNTRY_CODES
  .map((code) => ({
    code,
    name: regionNames?.of(code) ?? code,
    flag: countryFlag(code),
  }))
  .sort((a, b) => a.name.localeCompare(b.name, 'en'))

export const POPULAR_STUDY_FIELDS = [
  'Business Administration',
  'Economics',
  'Finance',
  'Accounting',
  'Computer Science',
  'Data Science',
  'Artificial Intelligence',
  'Software Engineering',
  'Engineering',
  'Medicine',
  'Law',
  'International Relations',
  'Marketing',
  'Psychology',
  'Architecture',
  'Mathematics',
  'Biology',
  'Political Science',
] as const
