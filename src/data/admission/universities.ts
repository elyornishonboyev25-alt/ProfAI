import type { AdmissionRequirement, CostOfLiving, University } from './types'
import { qsTop50Additions } from './qsTop50Universities'
import { QS_2027_RANKINGS, QS_2027_TOP_50_IDS } from './qs2027Rankings'

// Rankings are QS World University Rankings 2027. Detailed admissions policies
// were rechecked against university sources on 5 August 2026; the top-50 additions
// and their official source links were checked on 6 August 2026. A numeric
// comparison is provided only when the university itself publishes a minimum or
// clearly-labelled competitive score.
export const QS_EDITION = 'QS World University Rankings 2027'

const verifiedAt = '2026-08-05'

function admission(note: string, bachelor: AdmissionRequirement[]) {
  return { note, bachelor, verifiedAt }
}

function livingCost(details: Omit<CostOfLiving, 'verifiedAt'>): CostOfLiving {
  return { ...details, verifiedAt }
}

const universityProfiles: University[] = [
  {
    id: 'mit', slug: 'mit', rank: 1, name: 'Massachusetts Institute of Technology (MIT)', shortName: 'MIT',
    city: 'Cambridge', country: 'United States', countryEmoji: '🇺🇸', overallScore: 100,
    type: 'Private research university', founded: 1861, website: 'https://www.mit.edu', groups: ['qs-top-50'],
    tagline: 'Education and research focused on advancing knowledge in science, technology and other fields.',
    about: 'MIT was incorporated in 1861 and is based in Cambridge, Massachusetts. Its undergraduate education combines science and technology with hands-on learning, research and study across the humanities, arts and social sciences.',
    brand: { monogram: 'MIT', gradient: 'linear-gradient(150deg,#2b070b 0%,#7a1420 48%,#a31f34 100%)', accent: '#A31F34', ink: '#ffffff' },
    indicators: { academicReputation: 100, employerReputation: 100, facultyStudentRatio: 100, citationsPerFaculty: 100, internationalFacultyRatio: 100, employmentOutcomes: 100, internationalResearchNetwork: 94.1, internationalStudentDiversity: 92.3, internationalStudentRatio: 91.6, sustainability: 93.8 },
    subjectRank: 1, sustainabilityRank: 43,
    admission: admission('SAT or ACT is required, but MIT publishes no SAT cutoff. English-test scores have official minimum and recommended values.', [
      { label: 'SAT', value: 'Required · no cutoff', policy: 'required', detail: 'SAT or ACT required; evaluated in context.', sourceUrl: 'https://mitadmissions.org/apply/firstyear/tests-scores/' },
      { label: 'IELTS', value: '7.0 min · 7.5 recommended', minimum: 7, recommended: 7.5, comparison: 'ieltsOverall', policy: 'conditional', sourceUrl: 'https://mitadmissions.org/apply/firstyear/tests-scores/' },
    ]),
    costOfLiving: livingCost({ amount: 25620, currency: 'USD', period: 'academic-year', academicYear: '2026–27', label: 'Official undergraduate non-tuition budget', includes: ['Housing', 'Food', 'Books & supplies', 'Personal expenses'], note: 'Travel and health insurance can add to this amount. Tuition and the student life fee are excluded.', sourceUrl: 'https://sfs.mit.edu/cost-of-attendance-class-of-2030/' }),
    campus: { name: 'MIT main campus', address: '77 Massachusetts Avenue, Cambridge, MA 02139, USA', mapsQuery: 'MIT, 77 Massachusetts Avenue, Cambridge MA' },
    sources: [{ label: 'Official admissions: tests and scores', url: 'https://mitadmissions.org/apply/firstyear/tests-scores/' }, { label: 'Official MIT facts', url: 'https://facts.mit.edu/' }],
  },
  {
    id: 'imperial-college-london', slug: 'imperial-college-london', rank: 2, name: 'Imperial College London', shortName: 'Imperial',
    city: 'London', country: 'United Kingdom', countryEmoji: '🇬🇧', overallScore: 99.4,
    type: 'Public research university', founded: 1907, website: 'https://www.imperial.ac.uk', groups: ['qs-top-50'],
    tagline: 'A London university specialising in science, engineering, medicine and business.',
    about: 'Imperial College London was established in 1907. Its teaching and research focus on science, engineering, medicine and business, with its main campus in South Kensington.',
    brand: { monogram: 'ICL', gradient: 'linear-gradient(150deg,#03203f 0%,#003e74 52%,#0072b8 100%)', accent: '#0072B8', ink: '#ffffff' },
    indicators: { academicReputation: 99.6, employerReputation: 100, facultyStudentRatio: 99.3, citationsPerFaculty: 95, internationalFacultyRatio: 100, internationalStudentRatio: 100 },
    admission: admission('IELTS level depends on the course: Standard or Higher. SAT is not a university-wide admission requirement.', [
      { label: 'SAT', value: 'No university-wide requirement', policy: 'not-required', sourceUrl: 'https://www.imperial.ac.uk/study/apply/undergraduate/entry-requirements/' },
      { label: 'IELTS', value: '6.5 Standard · 7.0 Higher', minimum: 6.5, comparison: 'ieltsOverall', policy: 'conditional', detail: 'Minimum components: 6.0 Standard or 6.5 Higher.', sourceUrl: 'https://www.imperial.ac.uk/study/apply/english-language/' },
    ]),
    costOfLiving: livingCost({ amount: 15470, maxAmount: 16530, currency: 'GBP', period: 'academic-year', academicYear: '2026', label: 'Official average living-cost range for 9 months', includes: ['Accommodation', 'Food', 'London travel', 'Personal & leisure'], note: 'Tuition fees and study materials are not included. Actual spending depends on housing and lifestyle.', sourceUrl: 'https://www.imperial.ac.uk/study/pg/fees-and-funding/living-costs/' }),
    campus: { name: 'South Kensington Campus', address: 'Exhibition Road, London SW7 2AZ, UK', mapsQuery: 'Imperial College London South Kensington Campus' },
    sources: [{ label: 'Official English requirements', url: 'https://www.imperial.ac.uk/study/apply/english-language/' }, { label: 'Official undergraduate entry requirements', url: 'https://www.imperial.ac.uk/study/apply/undergraduate/entry-requirements/' }],
  },
  {
    id: 'stanford-university', slug: 'stanford-university', rank: 3, name: 'Stanford University', shortName: 'Stanford',
    city: 'Stanford', country: 'United States', countryEmoji: '🇺🇸', overallScore: 98.9,
    type: 'Private research university', founded: 1885, website: 'https://www.stanford.edu', groups: ['qs-top-50'],
    tagline: 'A research university in California with seven schools and a broad undergraduate curriculum.',
    about: 'Stanford University was founded in 1885 and opened in 1891. Its campus is in Stanford, California, and its undergraduate applicants apply to the university as a whole rather than to a particular school or major.',
    brand: { monogram: 'S', gradient: 'linear-gradient(150deg,#3d0a0a 0%,#8c1515 55%,#b1040e 100%)', accent: '#8C1515', ink: '#ffffff' },
    indicators: { academicReputation: 100, employerReputation: 100, facultyStudentRatio: 100, citationsPerFaculty: 99.7, internationalFacultyRatio: 94.2, internationalStudentRatio: 73.5 },
    admission: admission('SAT or ACT is required, with no minimum score. English-proficiency exams are not required and have no published minimum.', [
      { label: 'SAT', value: 'Required · no minimum', policy: 'required', sourceUrl: 'https://admission.stanford.edu/apply/first-year/testing.html' },
      { label: 'IELTS', value: 'Not required · no minimum', policy: 'not-required', sourceUrl: 'https://admission.stanford.edu/apply/international/' },
    ]),
    costOfLiving: livingCost({ amount: 27204, currency: 'USD', period: 'academic-year', academicYear: '2026–27', label: 'Official undergraduate non-tuition budget', includes: ['Housing & food', 'Books & supplies', 'Personal expenses'], note: 'Travel varies. Student fees and international-student health insurance are excluded from this living-cost total.', sourceUrl: 'https://financialaid.stanford.edu/undergrad/budget/index.html' }),
    campus: { name: 'Stanford main campus', address: '450 Jane Stanford Way, Stanford, CA 94305, USA', mapsQuery: 'Stanford University 450 Jane Stanford Way' },
    sources: [{ label: 'Official standardized testing policy', url: 'https://admission.stanford.edu/apply/first-year/testing.html' }, { label: 'Official international applicant FAQ', url: 'https://admission.stanford.edu/apply/international/' }],
  },
  {
    id: 'university-of-oxford', slug: 'university-of-oxford', rank: 4, name: 'University of Oxford', shortName: 'Oxford',
    city: 'Oxford', country: 'United Kingdom', countryEmoji: '🇬🇧', overallScore: 97.9,
    type: 'Collegiate research university', founded: 1096, website: 'https://www.ox.ac.uk', groups: ['qs-top-50'],
    tagline: 'A collegiate university with evidence of teaching dating from 1096.',
    about: 'Oxford is a collegiate university with no single main campus. Teaching existed by 1096, and today students belong both to the University and to a college or permanent private hall.',
    brand: { monogram: 'OX', gradient: 'linear-gradient(150deg,#000d1f 0%,#002147 55%,#0b3a73 100%)', accent: '#002147', ink: '#ffffff' },
    indicators: { academicReputation: 100, employerReputation: 100, facultyStudentRatio: 100, citationsPerFaculty: 91, internationalFacultyRatio: 98.8, internationalStudentRatio: 98.6 },
    admission: admission('All undergraduate courses use Oxford’s higher English level. SAT applies only as part of Oxford’s US-qualification combinations, not as a standalone global requirement.', [
      { label: 'SAT', value: 'Up to 1480 + three AP 5s', minimum: 1480, comparison: 'satTotal', policy: 'conditional', detail: 'For US qualifications and A*A*A-equivalent courses; other course combinations differ.', sourceUrl: 'https://www.ox.ac.uk/admissions/undergraduate/courses/admissions-requirements/international-qualifications' },
      { label: 'IELTS', value: '7.5 overall · 7.0 each', minimum: 7.5, comparison: 'ieltsOverall', policy: 'conditional', sourceUrl: 'https://www.ox.ac.uk/admissions/undergraduate/applying/for-international-students/english-language-requirements-visas' },
    ]),
    costOfLiving: livingCost({ amount: 12645, maxAmount: 18945, currency: 'GBP', period: 'academic-year', academicYear: '2026–27', label: 'Official likely living-cost range for 9 months', includes: ['Accommodation & utilities', 'Food', 'Personal items', 'Social activities', 'Study costs', 'Other'], note: 'For a single full-time student with no dependants. Visa and immigration health surcharge are additional.', sourceUrl: 'https://www.ox.ac.uk/admissions/undergraduate/fees-and-funding/living-costs' }),
    campus: { name: 'University Offices', address: 'Wellington Square, Oxford OX1 2JD, UK', mapsQuery: 'University of Oxford Wellington Square' },
    sources: [{ label: 'Official English requirements', url: 'https://www.ox.ac.uk/admissions/undergraduate/applying/for-international-students/english-language-requirements-visas' }, { label: 'Official international qualifications', url: 'https://www.ox.ac.uk/admissions/undergraduate/courses/admissions-requirements/international-qualifications' }],
  },
  {
    id: 'harvard-university', slug: 'harvard-university', rank: 5, name: 'Harvard University', shortName: 'Harvard',
    city: 'Cambridge', country: 'United States', countryEmoji: '🇺🇸', overallScore: 97.7,
    type: 'Private research university', founded: 1636, website: 'https://www.harvard.edu', groups: ['qs-top-50', 'ivy-league'],
    tagline: 'The oldest institution of higher education in the United States.',
    about: 'Harvard was founded in 1636 and is based in Cambridge, Massachusetts. Harvard College provides the University’s undergraduate liberal arts and sciences education.',
    brand: { monogram: 'H', gradient: 'linear-gradient(150deg,#3a0a14 0%,#a51c30 55%,#c81e3a 100%)', accent: '#A51C30', ink: '#ffffff' },
    indicators: { academicReputation: 100, employerReputation: 100, facultyStudentRatio: 98.3, citationsPerFaculty: 100, internationalFacultyRatio: 79.1, internationalStudentRatio: 81.4 },
    admission: admission('SAT or ACT is required (alternatives are allowed only in exceptional access cases). IELTS is optional and Harvard publishes no IELTS minimum.', [
      { label: 'SAT', value: 'Required · no minimum', policy: 'required', sourceUrl: 'https://college.harvard.edu/resources/faq' },
      { label: 'IELTS', value: 'Optional · no minimum', policy: 'optional', sourceUrl: 'https://college.harvard.edu/resources/faq' },
    ]),
    costOfLiving: livingCost({ amount: 26692, maxAmount: 31692, currency: 'USD', period: 'academic-year', academicYear: '2026–27', label: 'Official undergraduate non-tuition budget range', includes: ['Housing', 'Food', 'Books', 'Personal expenses', 'Transportation'], note: 'The range reflects Harvard’s $0–$5,000 transportation estimate. Tuition and fees are excluded.', sourceUrl: 'https://college.harvard.edu/financial-aid/how-aid-works' }),
    campus: { name: 'Harvard Yard', address: '2 Kirkland Street, Cambridge, MA 02138, USA', mapsQuery: 'Harvard Yard Cambridge Massachusetts' },
    sources: [{ label: 'Official Harvard College admissions FAQ', url: 'https://college.harvard.edu/resources/faq' }, { label: 'Official Harvard history', url: 'https://www.harvard.edu/about/history/' }],
  },
  {
    id: 'university-of-cambridge', slug: 'university-of-cambridge', rank: 6, name: 'University of Cambridge', shortName: 'Cambridge',
    city: 'Cambridge', country: 'United Kingdom', countryEmoji: '🇬🇧', overallScore: 97.2,
    type: 'Collegiate research university', founded: 1209, website: 'https://www.cam.ac.uk', groups: ['qs-top-50'],
    tagline: 'A collegiate university founded in 1209.',
    about: 'The University of Cambridge was founded in 1209. It comprises academic departments and faculties alongside self-governing colleges, with undergraduate teaching shared between them.',
    brand: { monogram: 'CAM', gradient: 'linear-gradient(150deg,#062a3f 0%,#0072ce 60%,#67c7e8 100%)', accent: '#0072CE', ink: '#ffffff' },
    indicators: { academicReputation: 100, employerReputation: 100, facultyStudentRatio: 100, citationsPerFaculty: 88.6, internationalFacultyRatio: 100, internationalStudentRatio: 93.1 },
    admission: admission('Cambridge publishes an IELTS minimum. SAT is qualification- and college-specific, so there is no university-wide SAT minimum.', [
      { label: 'SAT', value: 'No university-wide minimum', policy: 'conditional', sourceUrl: 'https://www.undergraduate.study.cam.ac.uk/apply/before/accepted-qualifications' },
      { label: 'IELTS', value: '7.5 overall · usually 7.0 each', minimum: 7.5, comparison: 'ieltsOverall', policy: 'conditional', sourceUrl: 'https://www.undergraduate.study.cam.ac.uk/apply/before/entry-requirements' },
    ]),
    costOfLiving: livingCost({ amount: 11970, currency: 'GBP', period: 'academic-year', academicYear: '2027–28', label: 'Official indicative living cost for 9 months', includes: ['Accommodation', 'Food', 'Personal items', 'Social activities', 'Study costs', 'Miscellaneous'], note: 'Cambridge also publishes £15,960 for students staying 12 months. International College fees and settling-in costs are separate.', sourceUrl: 'https://www.undergraduate.study.cam.ac.uk/fees-funding/living-costs' }),
    campus: { name: 'The Old Schools', address: 'Trinity Lane, Cambridge CB2 1TN, UK', mapsQuery: 'University of Cambridge Old Schools Trinity Lane' },
    sources: [{ label: 'Official entry and English requirements', url: 'https://www.undergraduate.study.cam.ac.uk/apply/before/entry-requirements' }, { label: 'Official accepted qualifications', url: 'https://www.undergraduate.study.cam.ac.uk/apply/before/accepted-qualifications' }],
  },
  {
    id: 'eth-zurich', slug: 'eth-zurich', rank: 7, name: 'ETH Zurich', shortName: 'ETH Zurich',
    city: 'Zurich', country: 'Switzerland', countryEmoji: '🇨🇭', overallScore: 96.7,
    type: 'Public federal university', founded: 1855, website: 'https://ethz.ch', groups: ['qs-top-50'],
    tagline: 'A Swiss federal university for science and technology.',
    about: 'ETH Zurich was founded in 1855 as a federal polytechnic school. Its bachelor’s programmes are taught mainly in German, while the institution’s study and research focus on science, technology, engineering and related fields.',
    brand: { monogram: 'ETH', gradient: 'linear-gradient(150deg,#0a1c3a 0%,#215caf 58%,#3f7bd0 100%)', accent: '#215CAF', ink: '#ffffff' },
    indicators: { academicReputation: 99.7, employerReputation: 96.3, facultyStudentRatio: 71.7, citationsPerFaculty: 98.8, internationalFacultyRatio: 100, internationalStudentRatio: 99.3 },
    admission: admission('Bachelor’s admission is based on the school-leaving qualification and, where applicable, an ETH entrance exam. The language requirement is German C1—not IELTS.', [
      { label: 'SAT', value: 'Not an ETH bachelor requirement', policy: 'not-required', sourceUrl: 'https://ethz.ch/en/studium/bachelor/bewerbung/auslaendische-reifezeugnisse/zulassungsvoraussetzungen.html' },
      { label: 'IELTS', value: 'Not accepted for bachelor language proof', policy: 'not-accepted', detail: 'German C1 is required unless an official waiver applies.', sourceUrl: 'https://ethz.ch/en/studium/bachelor/bewerbung/auslaendische-reifezeugnisse/sprachanforderungen.html' },
      { label: 'German', value: 'C1 required', policy: 'conditional', sourceUrl: 'https://ethz.ch/en/studium/bachelor/bewerbung/auslaendische-reifezeugnisse/sprachanforderungen.html' },
    ]),
    costOfLiving: livingCost({ amount: 20000, maxAmount: 26000, currency: 'CHF', period: 'calendar-year', label: 'Official recommended annual living-and-study budget', includes: ['Living costs', 'Study costs'], note: 'ETH describes this as average student living and study costs. Its tuition and semester fees are shown separately on the same page.', sourceUrl: 'https://ethz.ch/en/studies/financial.html' }),
    campus: { name: 'ETH Zentrum', address: 'Rämistrasse 101, 8092 Zürich, Switzerland', mapsQuery: 'ETH Zurich Rämistrasse 101' },
    sources: [{ label: 'Official bachelor language requirements', url: 'https://ethz.ch/en/studium/bachelor/bewerbung/auslaendische-reifezeugnisse/sprachanforderungen.html' }, { label: 'Official bachelor admission prerequisites', url: 'https://ethz.ch/en/studium/bachelor/bewerbung/auslaendische-reifezeugnisse/zulassungsvoraussetzungen.html' }],
  },
  {
    id: 'national-university-of-singapore', slug: 'national-university-of-singapore', rank: 8, name: 'National University of Singapore (NUS)', shortName: 'NUS',
    city: 'Singapore', country: 'Singapore', countryEmoji: '🇸🇬', overallScore: 95.9,
    type: 'Public autonomous university', founded: 1905, website: 'https://www.nus.edu.sg', groups: ['qs-top-50'],
    tagline: 'Singapore’s flagship comprehensive university.',
    about: 'NUS traces its roots to a medical school founded in 1905. It is a comprehensive university in Singapore with undergraduate programmes across disciplines and a qualification-specific international admissions process.',
    brand: { monogram: 'NUS', gradient: 'linear-gradient(150deg,#031f40 0%,#003d7c 52%,#ef7c00 130%)', accent: '#EF7C00', ink: '#ffffff' },
    indicators: { academicReputation: 99.9, employerReputation: 98.2, facultyStudentRatio: 71.5, citationsPerFaculty: 95.9, internationalFacultyRatio: 100, internationalStudentRatio: 96.9 },
    admission: admission('Requirements depend on the applicant’s school qualification. For “other high school qualifications,” standardized tests are required; the official 2026/27 prospectus sets SAT section minimums and IELTS where English proof is required.', [
      { label: 'SAT', value: '1250 min (600 R&W + 650 Math)', minimum: 1250, comparison: 'satTotal', policy: 'conditional', detail: 'Required only for specified qualification groups and must be combined with at least three AP courses.', sourceUrl: 'https://nus.edu.sg/oam/docs/default-source/nus-publications/intlprospectus.pdf' },
      { label: 'IELTS', value: '6.5 overall, reading & writing', minimum: 6.5, comparison: 'ieltsOverall', policy: 'conditional', detail: 'Only for qualification groups required to submit English-language proof.', sourceUrl: 'https://nus.edu.sg/oam/docs/default-source/nus-publications/intlprospectus.pdf' },
    ]),
    costOfLiving: livingCost({ amount: 10000, maxAmount: 16290, currency: 'SGD', period: 'academic-year', label: 'Official estimated living cost with on-campus housing', includes: ['On-campus accommodation', 'Meals', 'Personal expenses', 'Local transport', 'Books & supplies'], note: 'Vacation is excluded. The range combines NUS’s S$6,000 non-housing estimate with its S$4,000–S$10,290 on-campus housing range.', sourceUrl: 'https://nus.edu.sg/oam/financial-aid/living-costs' }),
    campus: { name: 'Kent Ridge Campus', address: '21 Lower Kent Ridge Road, Singapore 119077', mapsQuery: 'National University of Singapore Kent Ridge Campus' },
    sources: [{ label: 'Official 2026/27 international prospectus', url: 'https://nus.edu.sg/oam/docs/default-source/nus-publications/intlprospectus.pdf' }, { label: 'Official international admission requirements', url: 'https://nus.edu.sg/oam/admissions/international-qualifications-for-foreigners/admission-requirements' }],
  },
  {
    id: 'ucl', slug: 'ucl', rank: 9, name: 'University College London (UCL)', shortName: 'UCL',
    city: 'London', country: 'United Kingdom', countryEmoji: '🇬🇧', overallScore: 95.8,
    type: 'Public research university', founded: 1826, website: 'https://www.ucl.ac.uk', groups: ['qs-top-50'],
    tagline: 'A multidisciplinary university founded in London in 1826.',
    about: 'UCL was founded in 1826 and is a multidisciplinary university based in London. Undergraduate academic and English requirements vary by programme and by the qualification an applicant presents.',
    brand: { monogram: 'UCL', gradient: 'linear-gradient(150deg,#1a0533 0%,#500778 55%,#7b2fb0 100%)', accent: '#500778', ink: '#ffffff' },
    indicators: { academicReputation: 99.9, employerReputation: 99.4, facultyStudentRatio: 94.8, citationsPerFaculty: 80.9, internationalFacultyRatio: 99.6, internationalStudentRatio: 100 },
    admission: admission('UCL has five English levels. The programme page determines which level applies. SAT is not a universal requirement and is considered only within qualification-specific entry routes.', [
      { label: 'SAT', value: 'Qualification-specific · no universal minimum', policy: 'conditional', sourceUrl: 'https://www.ucl.ac.uk/prospective-students/international/united-states-america' },
      { label: 'IELTS', value: '6.5–8.0 by programme level', minimum: 6.5, comparison: 'ieltsOverall', policy: 'conditional', detail: 'Component minimums also apply; check the selected degree page.', sourceUrl: 'https://www.ucl.ac.uk/prospective-students/undergraduate/how-apply/english-language-requirements' },
    ]),
    costOfLiving: livingCost({ amount: 16465, currency: 'GBP', period: 'academic-year', academicYear: '2026–27', label: 'Official indicative undergraduate cost for 39 weeks', includes: ['UCL self-catered halls', 'Food', 'Course materials', 'Mobile phone', 'Health & wellbeing', 'London travel'], note: 'Calculated from UCL’s £12,480 average hall rent and £3,985 other essential-cost guide. Visa, flights and tuition are separate.', sourceUrl: 'https://www.ucl.ac.uk/study/student-finances/cost-study/how-much-does-it-cost-study-ucl' }),
    campus: { name: 'UCL Bloomsbury campus', address: 'Gower Street, London WC1E 6BT, UK', mapsQuery: 'UCL Gower Street London' },
    sources: [{ label: 'Official undergraduate English requirements', url: 'https://www.ucl.ac.uk/prospective-students/undergraduate/how-apply/english-language-requirements' }, { label: 'Official undergraduate prospectus', url: 'https://www.ucl.ac.uk/prospective-students/undergraduate/' }],
  },
  {
    id: 'caltech', slug: 'caltech', rank: 10, name: 'California Institute of Technology (Caltech)', shortName: 'Caltech',
    city: 'Pasadena', country: 'United States', countryEmoji: '🇺🇸', overallScore: 94.3,
    type: 'Private research university', founded: 1891, website: 'https://www.caltech.edu', groups: ['qs-top-50'],
    tagline: 'A science and engineering institute in Pasadena, California.',
    about: 'Caltech is an independent, privately supported science and engineering institute in Pasadena. It has approximately 1,000 undergraduates and 1,400 graduate students and manages NASA’s Jet Propulsion Laboratory.',
    brand: { monogram: 'CIT', gradient: 'linear-gradient(150deg,#2a1402 0%,#b5510a 52%,#ff6c0c 110%)', accent: '#FF6C0C', ink: '#ffffff' },
    indicators: { academicReputation: 98.3, employerReputation: 99.2, facultyStudentRatio: 100, citationsPerFaculty: 100, internationalFacultyRatio: 100, internationalStudentRatio: 90.7 },
    admission: admission('SAT or ACT is required, but Caltech has no cutoff. IELTS has an official minimum for international applicants who are not exempt.', [
      { label: 'SAT', value: 'Required · no cutoff', policy: 'required', sourceUrl: 'https://www.admissions.caltech.edu/apply/first-year-applicants/standardized-tests' },
      { label: 'IELTS', value: '7.0 overall · 7.0 each', minimum: 7, comparison: 'ieltsOverall', policy: 'conditional', sourceUrl: 'https://www.admissions.caltech.edu/apply/first-year-applicants/international-applicants' },
    ]),
    costOfLiving: livingCost({ amount: 27393, currency: 'USD', period: 'academic-year', academicYear: '2026–27', label: 'Official on-campus non-tuition budget for 9 months', includes: ['Housing', 'Food', 'Books & supplies', 'Personal expenses'], note: 'Health insurance, orientation and travel may add to this amount. Tuition and mandatory fees are excluded.', sourceUrl: 'https://www.finaid.caltech.edu/Costs' }),
    campus: { name: 'Caltech campus', address: '1200 E California Boulevard, Pasadena, CA 91125, USA', mapsQuery: 'Caltech 1200 E California Boulevard Pasadena' },
    sources: [{ label: 'Official standardized testing policy', url: 'https://www.admissions.caltech.edu/apply/first-year-applicants/standardized-tests' }, { label: 'Official international applicant requirements', url: 'https://www.admissions.caltech.edu/apply/first-year-applicants/international-applicants' }],
  },
  ...qsTop50Additions,
  {
    id: 'university-of-pennsylvania', slug: 'university-of-pennsylvania', rank: 15, name: 'University of Pennsylvania', shortName: 'Penn',
    city: 'Philadelphia', country: 'United States', countryEmoji: '🇺🇸',
    type: 'Private research university', founded: 1740, website: 'https://www.upenn.edu', groups: ['qs-top-50', 'ivy-league'],
    tagline: 'An Ivy League university in Philadelphia with four undergraduate schools.',
    about: 'Penn dates its founding to 1740 and is based in Philadelphia. Undergraduate students study in the College of Arts and Sciences, Penn Engineering, the School of Nursing or the Wharton School.',
    brand: { monogram: 'PENN', gradient: 'linear-gradient(150deg,#001f3f,#011f5b 58%,#990000)', accent: '#011F5B', ink: '#ffffff' }, indicators: {},
    admission: admission('SAT or ACT is required for the published cycle, but Penn has no minimum. IELTS is required when English is neither native nor the language of instruction; 7.0 is described as competitive, not a cutoff.', [
      { label: 'SAT', value: 'Required · no minimum', policy: 'required', sourceUrl: 'https://admissions.upenn.edu/how-to-apply/preparing-your-application/testing' },
      { label: 'IELTS', value: '7.0 competitive', recommended: 7, comparison: 'ieltsOverall', policy: 'conditional', sourceUrl: 'https://admissions.upenn.edu/how-to-apply/international-applicants' },
    ]),
    costOfLiving: livingCost({ amount: 25104, currency: 'USD', period: 'academic-year', academicYear: '2026–27', label: 'Official on-campus non-tuition budget', includes: ['Housing', 'Food', 'Books & supplies', 'Local transportation', 'Personal expenses'], note: 'Tuition, mandatory fees, health insurance and travel home are excluded.', sourceUrl: 'https://srfs.upenn.edu/costs-budgeting/undergraduate-cost-attendance' }),
    campus: { name: 'Penn campus', address: 'Philadelphia, PA 19104, USA', mapsQuery: 'University of Pennsylvania Philadelphia' },
    sources: [{ label: 'Official Penn testing policy', url: 'https://admissions.upenn.edu/how-to-apply/preparing-your-application/testing' }, { label: 'Official international applicant requirements', url: 'https://admissions.upenn.edu/how-to-apply/international-applicants' }],
  },
  {
    id: 'cornell-university', slug: 'cornell-university', rank: 16, name: 'Cornell University', shortName: 'Cornell',
    city: 'Ithaca', country: 'United States', countryEmoji: '🇺🇸',
    type: 'Private research university', founded: 1865, website: 'https://www.cornell.edu', groups: ['qs-top-50', 'ivy-league'],
    tagline: 'An Ivy League land-grant university founded in Ithaca in 1865.',
    about: 'Cornell was founded in 1865 by Ezra Cornell and Andrew Dickson White. Its main campus is in Ithaca, New York, and first-year applicants apply to one of its undergraduate colleges or schools.',
    brand: { monogram: 'CU', gradient: 'linear-gradient(150deg,#4b0505,#B31B1B 62%,#d14a4a)', accent: '#B31B1B', ink: '#ffffff' }, indicators: {},
    admission: admission('For fall 2026 and beyond, first-year applicants submit SAT or ACT scores; Cornell publishes no SAT cutoff. IELTS 7.5 is the official minimum for applicants who must prove English proficiency.', [
      { label: 'SAT', value: 'Required · no published cutoff', policy: 'required', sourceUrl: 'https://admissions.cornell.edu/how-to-apply/first-year-international-applicants' },
      { label: 'IELTS', value: '7.5 minimum', minimum: 7.5, comparison: 'ieltsOverall', policy: 'conditional', sourceUrl: 'https://admissions.cornell.edu/how-to-apply/first-year-international-applicants' },
    ]),
    costOfLiving: livingCost({ amount: 24764, currency: 'USD', period: 'academic-year', academicYear: '2026–27', label: 'Official undergraduate non-tuition budget', includes: ['Housing', 'Food', 'Books & course materials', 'Personal expenses'], note: 'Transportation varies by home region. Health insurance and tuition/mandatory fees are excluded.', sourceUrl: 'https://finaid.cornell.edu/cost-to-attend' }),
    campus: { name: 'Ithaca campus', address: 'Ithaca, NY 14853, USA', mapsQuery: 'Cornell University Ithaca Campus' },
    sources: [{ label: 'Official international first-year requirements', url: 'https://admissions.cornell.edu/how-to-apply/first-year-international-applicants' }, { label: 'Official Cornell history', url: 'https://www.cornell.edu/about/timeline/' }],
  },
  {
    id: 'yale-university', slug: 'yale-university', rank: 21, name: 'Yale University', shortName: 'Yale',
    city: 'New Haven', country: 'United States', countryEmoji: '🇺🇸',
    type: 'Private research university', founded: 1701, website: 'https://www.yale.edu', groups: ['qs-top-50', 'ivy-league'],
    tagline: 'An Ivy League research university founded in 1701 in New Haven.',
    about: 'Yale was founded in 1701 and is based in New Haven, Connecticut. Yale College is its undergraduate liberal arts college and uses a residential college system.',
    brand: { monogram: 'Y', gradient: 'linear-gradient(150deg,#001a33,#00356B 62%,#286dc0)', accent: '#00356B', ink: '#ffffff' }, indicators: {},
    admission: admission('First-year applicants must submit SAT or ACT scores, with no published minimum. IELTS 7.0 is a typical competitive score for applicants who must prove English proficiency.', [
      { label: 'SAT', value: 'Required · no minimum', policy: 'required', sourceUrl: 'https://admissions.yale.edu/standardized-testing' },
      { label: 'IELTS', value: '7.0 competitive', recommended: 7, comparison: 'ieltsOverall', policy: 'conditional', sourceUrl: 'https://admissions.yale.edu/standardized-testing' },
    ]),
    costOfLiving: livingCost({ amount: 25300, currency: 'USD', period: 'academic-year', academicYear: '2026–27', label: 'Official undergraduate non-tuition budget', includes: ['Housing', 'Food', 'Books & supplies', 'Personal expenses'], note: 'Travel varies by home address. Tuition and the student activity fee are excluded.', sourceUrl: 'https://finaid.yale.edu/coa' }),
    campus: { name: 'Yale campus', address: 'New Haven, CT 06520, USA', mapsQuery: 'Yale University New Haven' },
    sources: [{ label: 'Official standardized testing policy', url: 'https://admissions.yale.edu/standardized-testing' }, { label: 'Official international applicant page', url: 'https://admissions.yale.edu/international' }],
  },
  {
    id: 'princeton-university', slug: 'princeton-university', rank: 25, rankTied: true, name: 'Princeton University', shortName: 'Princeton',
    city: 'Princeton', country: 'United States', countryEmoji: '🇺🇸',
    type: 'Private research university', founded: 1746, website: 'https://www.princeton.edu', groups: ['qs-top-50', 'ivy-league'],
    tagline: 'An Ivy League research university with a strong undergraduate focus.',
    about: 'Princeton was chartered in 1746 as the College of New Jersey and moved to Princeton in 1756. Its undergraduate programme spans the liberal arts, sciences and engineering.',
    brand: { monogram: 'PU', gradient: 'linear-gradient(150deg,#2a1600,#e77500 62%,#ff9b31)', accent: '#E77500', ink: '#ffffff' }, indicators: {},
    admission: admission('Princeton is test-optional for fall 2027 entry and returns to SAT/ACT-required admission for fall 2028. It requires English testing in specified cases but publishes no IELTS minimum.', [
      { label: 'SAT', value: 'Optional for fall 2027 · required fall 2028', policy: 'optional', sourceUrl: 'https://admission.princeton.edu/apply/standardized-testing' },
      { label: 'IELTS', value: 'Required when applicable · no minimum', policy: 'conditional', sourceUrl: 'https://admission.princeton.edu/apply/international-students' },
    ]),
    costOfLiving: livingCost({ amount: 26220, maxAmount: 31170, currency: 'USD', period: 'academic-year', academicYear: '2026–27', label: 'Official undergraduate non-tuition budget range', includes: ['Housing', 'Food', 'Books & supplies', 'Personal expenses', 'Transportation'], note: 'The range applies Princeton’s published $50–$5,000 transportation estimate. Tuition and fees are excluded.', sourceUrl: 'https://admission.princeton.edu/cost-aid/fees-payment-options' }),
    campus: { name: 'Princeton campus', address: 'Princeton, NJ 08544, USA', mapsQuery: 'Princeton University New Jersey' },
    sources: [{ label: 'Official standardized testing policy', url: 'https://admission.princeton.edu/apply/standardized-testing' }, { label: 'Official international applicant requirements', url: 'https://admission.princeton.edu/apply/international-students' }],
  },
  {
    id: 'columbia-university', slug: 'columbia-university', rank: 38, rankTied: true, name: 'Columbia University', shortName: 'Columbia',
    city: 'New York City', country: 'United States', countryEmoji: '🇺🇸',
    type: 'Private research university', founded: 1754, website: 'https://www.columbia.edu', groups: ['qs-top-50', 'ivy-league'],
    tagline: 'An Ivy League university in New York City, founded as King’s College.',
    about: 'Columbia was founded in 1754 as King’s College. Its traditional undergraduate schools are Columbia College and Columbia Engineering, based at the Morningside Heights campus in New York City.',
    brand: { monogram: 'CU', gradient: 'linear-gradient(150deg,#17384f,#6CACE4 70%,#b9dcf5)', accent: '#3D79A7', ink: '#ffffff' }, indicators: {},
    admission: admission('Columbia College and Columbia Engineering are test-optional and publish no SAT cutoff. The undergraduate admissions pages do not publish a universal IELTS threshold.', [
      { label: 'SAT', value: 'Optional · no cutoff', policy: 'optional', sourceUrl: 'https://undergrad.admissions.columbia.edu/faq' },
      { label: 'IELTS', value: 'No universal minimum published', policy: 'conditional', sourceUrl: 'https://undergrad.admissions.columbia.edu/faq' },
    ]),
    costOfLiving: livingCost({ amount: 22814, currency: 'USD', period: 'academic-year', academicYear: '2026–27', label: 'Official first-year non-tuition budget before travel', includes: ['Housing', 'Food', 'Books & supplies', 'Personal expenses'], note: 'Travel and local transportation vary. Health insurance, tuition and fees are excluded.', sourceUrl: 'https://cc-seas.financialaid.columbia.edu/eligibility/facts' }),
    campus: { name: 'Morningside Heights campus', address: '116th Street and Broadway, New York, NY 10027, USA', mapsQuery: 'Columbia University Morningside Heights' },
    sources: [{ label: 'Official undergraduate admissions FAQ', url: 'https://undergrad.admissions.columbia.edu/faq' }, { label: 'Official Columbia history', url: 'https://www.columbia.edu/content/history' }],
  },
  {
    id: 'brown-university', slug: 'brown-university', rank: 69, name: 'Brown University', shortName: 'Brown',
    city: 'Providence', country: 'United States', countryEmoji: '🇺🇸',
    type: 'Private research university', founded: 1764, website: 'https://www.brown.edu', groups: ['ivy-league'],
    tagline: 'An Ivy League university known for its undergraduate Open Curriculum.',
    about: 'Brown was founded in 1764 in Providence, Rhode Island. Its undergraduate Open Curriculum gives students broad responsibility for shaping their course of study while completing a concentration.',
    brand: { monogram: 'B', gradient: 'linear-gradient(150deg,#2b170b,#4E3629 58%,#C00404)', accent: '#C00404', ink: '#ffffff' }, indicators: {},
    admission: admission('SAT or ACT is required, but Brown has no minimum standardized-test score. For relevant international applicants, Brown says IELTS 8.0 is expected in most cases.', [
      { label: 'SAT', value: 'Required · no minimum', policy: 'required', sourceUrl: 'https://admission.brown.edu/ask/standardized-tests' },
      { label: 'IELTS', value: '8.0 expected in most cases', recommended: 8, comparison: 'ieltsOverall', policy: 'recommended', sourceUrl: 'https://admission.brown.edu/ask/standardized-tests' },
    ]),
    costOfLiving: livingCost({ amount: 22342, currency: 'USD', period: 'academic-year', academicYear: '2026–27', label: 'Official first-year living and personal budget', includes: ['Housing', 'Food', 'Miscellaneous personal expenses'], note: 'Books may add $1,300 for students outside Brown’s course-material support; travel and health insurance also vary. Tuition and fees are excluded.', sourceUrl: 'https://finaid.brown.edu/estimate-cost-aid/cost' }),
    campus: { name: 'Brown campus', address: 'Providence, RI 02912, USA', mapsQuery: 'Brown University Providence Rhode Island' },
    sources: [{ label: 'Official standardized and English testing policy', url: 'https://admission.brown.edu/ask/standardized-tests' }, { label: 'Official Brown overview', url: 'https://www.brown.edu/about' }],
  },
  {
    id: 'dartmouth-college', slug: 'dartmouth-college', rank: 247, rankTied: true, name: 'Dartmouth College', shortName: 'Dartmouth',
    city: 'Hanover', country: 'United States', countryEmoji: '🇺🇸',
    type: 'Private research university', founded: 1769, website: 'https://home.dartmouth.edu', groups: ['ivy-league'],
    tagline: 'An Ivy League institution in Hanover with a strong undergraduate focus.',
    about: 'Dartmouth was founded in 1769 in Hanover, New Hampshire. It combines an undergraduate liberal arts college with graduate schools and uses the year-round D-Plan academic calendar.',
    brand: { monogram: 'D', gradient: 'linear-gradient(150deg,#00291a,#00693E 62%,#279989)', accent: '#00693E', ink: '#ffffff' }, indicators: {},
    admission: admission('Dartmouth requires eligible international applicants to submit one of several academic test/qualification options; there is no SAT minimum. It has no IELTS minimum, but most successful applicants score above 7.', [
      { label: 'SAT', value: 'One testing option · no minimum', policy: 'conditional', sourceUrl: 'https://admissions.dartmouth.edu/apply-dartmouth' },
      { label: 'IELTS', value: 'No minimum · most successful >7', recommended: 7.5, comparison: 'ieltsOverall', policy: 'recommended', detail: 'IELTS is scored in half bands, so the next reportable overall band above 7.0 is 7.5.', sourceUrl: 'https://admissions.dartmouth.edu/glossary-question/if-english-not-my-first-language-am-i-required-submit-language-proficiency-test' },
    ]),
    costOfLiving: livingCost({ amount: 24573, currency: 'USD', period: 'academic-year', academicYear: '2026–27', label: 'Official three-term non-tuition budget', includes: ['Housing', 'Food', 'Books & supplies', 'Personal expenses'], note: 'Health insurance, computer, first-year charges and travel may add to this amount. Tuition and fees are excluded.', sourceUrl: 'https://financialaid.dartmouth.edu/cost-attendance/cost-attendance-2026-2027' }),
    campus: { name: 'Dartmouth campus', address: 'Hanover, NH 03755, USA', mapsQuery: 'Dartmouth College Hanover New Hampshire' },
    sources: [{ label: 'Official application requirements', url: 'https://admissions.dartmouth.edu/apply-dartmouth' }, { label: 'Official English proficiency FAQ', url: 'https://admissions.dartmouth.edu/glossary-question/if-english-not-my-first-language-am-i-required-submit-language-proficiency-test' }],
  },
  {
    id: 'wiut', slug: 'westminster-international-university-in-tashkent', name: 'Westminster International University in Tashkent', shortName: 'WIUT',
    city: 'Tashkent', country: 'Uzbekistan', countryEmoji: '🇺🇿',
    type: 'International university', founded: 2002, website: 'https://www.wiut.uz', groups: ['uzbekistan'],
    tagline: 'A University of Westminster partner offering UK-validated degrees in Tashkent.',
    about: 'Westminster International University in Tashkent was established in 2002. It offers University of Westminster-validated programmes taught in English, including a foundation route and undergraduate degrees.',
    brand: { monogram: 'WIUT', gradient: 'linear-gradient(150deg,#161348,#312783 60%,#e31b23)', accent: '#312783', ink: '#ffffff' }, indicators: {},
    admission: admission('For the CIFS foundation route, IELTS 6.0 and SAT Math 570 can satisfy the English and maths requirements. Direct undergraduate entry commonly requires IELTS 6.5 (writing 6.0); programme details may vary.', [
      { label: 'SAT Math', value: '570 minimum (maths alternative)', minimum: 570, policy: 'conditional', detail: 'Section score; cannot be compared with a saved SAT total score.', sourceUrl: 'https://www.wiut.uz/certificate-international-foundation-studies' },
      { label: 'IELTS', value: '6.0 CIFS · 6.5 direct entry', minimum: 6, comparison: 'ieltsOverall', policy: 'conditional', detail: 'CIFS writing minimum 5.0; direct degree writing minimum is commonly 6.0.', sourceUrl: 'https://www.wiut.uz/certificate-international-foundation-studies' },
    ]),
    costOfLiving: livingCost({ amount: 800000, currency: 'UZS', period: 'month', academicYear: '2025–26', label: 'Official dormitory rate — not a total living-cost estimate', includes: ['Dormitory accommodation'], note: 'WIUT publishes 800,000 UZS per month, payable as 3.2m for 4 months or 6.4m for 8 months. Food, transport and personal expenses are not published as one official estimate.', sourceUrl: 'https://www.wiut.uz/accommodation' }),
    campus: { name: 'WIUT campus', address: '12 Istiqbol Street, Tashkent 100047, Uzbekistan', mapsQuery: 'Westminster International University in Tashkent' },
    sources: [{ label: 'Official CIFS entry requirements', url: 'https://www.wiut.uz/certificate-international-foundation-studies' }, { label: 'Official undergraduate example and direct-entry requirements', url: 'https://www.wiut.uz/business-management' }],
  },
  {
    id: 'new-uzbekistan-university', slug: 'new-uzbekistan-university', name: 'New Uzbekistan University', shortName: 'NewUU',
    city: 'Tashkent', country: 'Uzbekistan', countryEmoji: '🇺🇿',
    type: 'Public university', founded: 2021, website: 'https://www.newuu.uz', groups: ['uzbekistan'],
    tagline: 'An English-medium public university focused on engineering, computing, science, medicine and management.',
    about: 'New Uzbekistan University was established in 2021 in Tashkent. Its undergraduate programmes are taught in English across engineering, computing, humanities and sciences, medicine and management.',
    brand: { monogram: 'NUU', gradient: 'linear-gradient(150deg,#062b3a,#007a78 58%,#50b848)', accent: '#007A78', ink: '#ffffff' }, indicators: {},
    admission: admission('Fall 2026 undergraduate applicants need IELTS 5.5 or 6.0 depending on programme and normally take the Math & Logical Thinking exam. SAT Math 780–800 can lead to exam exemption and scholarship consideration after interview; the international route also lists SAT Math 650 as an alternative entry credential.', [
      { label: 'SAT Math', value: '650 intl route · 780 exam exemption', minimum: 650, policy: 'conditional', detail: 'Section score; cannot be compared with a saved SAT total score.', sourceUrl: 'https://www.newuu.uz/en/undergraduate-admissions' },
      { label: 'IELTS', value: '5.5 or 6.0 by programme', minimum: 5.5, comparison: 'ieltsOverall', policy: 'required', sourceUrl: 'https://www.newuu.uz/en/undergraduate-admissions' },
    ]),
    costOfLiving: livingCost({ amount: 640000, currency: 'UZS', period: 'month', label: 'Official dormitory rate — not a total living-cost estimate', includes: ['Dormitory', 'Heating', 'Electricity', 'Water', 'Essential services'], note: 'NewUU publishes this monthly price for Dormitory 1. It does not publish one combined estimate for food, transport and personal spending.', sourceUrl: 'https://newuu.uz/en/menu/accommodation' }),
    campus: { name: 'New Uzbekistan University', address: '1 Movarounnahr Street, Mirzo Ulugbek District, Tashkent, Uzbekistan', mapsQuery: 'New Uzbekistan University Tashkent' },
    sources: [{ label: 'Official fall 2026 bachelor admissions', url: 'https://www.newuu.uz/en/undergraduate-admissions' }, { label: 'Official international entry requirements', url: 'https://www.newuu.uz/en/menu/entry-requirements' }],
  },
]

export const universities: University[] = universityProfiles.map((university) => {
  const ranking = QS_2027_RANKINGS[university.id]
  const groups: NonNullable<University['groups']> = (university.groups ?? []).filter(
    (group) => group !== 'qs-top-50',
  )
  if (QS_2027_TOP_50_IDS.has(university.id)) groups.unshift('qs-top-50')

  return {
    ...university,
    ...(ranking
      ? {
          rank: ranking.rank,
          rankTied: ranking.rankTied ?? false,
          overallScore: ranking.overallScore,
          // The previous indicator breakdown belonged to the 2026 edition.
          // Hide it until QS 2027 indicator values are verified independently.
          indicators: {},
        }
      : {}),
    groups,
  }
})
