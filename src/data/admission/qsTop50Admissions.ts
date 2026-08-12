import type { AdmissionRequirement } from './types'

type AdmissionProfile = {
  note: string
  bachelor: AdmissionRequirement[]
}

const test = (
  label: 'SAT' | 'IELTS',
  value: string,
  options: Omit<AdmissionRequirement, 'label' | 'value'>,
): AdmissionRequirement => ({ label, value, ...options })

// Undergraduate policies for the universities whose core profiles live in
// qsTop50Universities.ts. Scores are only numeric when the university publishes
// a university-wide minimum or an explicitly labelled competitive benchmark.
// Qualification- and programme-specific SAT tables intentionally stay textual.
export const QS_TOP_50_ADMISSIONS: Record<string, AdmissionProfile> = {
  'university-of-hong-kong': {
    note: 'HKU accepts SAT as one route for applicants with international qualifications. English proof is required unless another accepted qualification or exemption applies.',
    bachelor: [
      test('SAT', '1380 + 3 AP scores of 3+', { minimum: 1380, comparison: 'satTotal', policy: 'conditional', detail: 'One published international-qualification route; programme selection remains competitive.', sourceUrl: 'https://admissions.hku.hk/apply/international-qualifications' }),
      test('IELTS', '6.5 overall', { minimum: 6.5, comparison: 'ieltsOverall', policy: 'conditional', sourceUrl: 'https://admissions.hku.hk/apply/international-qualifications' }),
    ],
  },
  'nanyang-technological-university': {
    note: 'NTU assesses applicants by their school qualification. SAT or IELTS is compulsory only for the qualification and English-background groups identified in the official guide.',
    bachelor: [
      test('SAT', '1250 minimum when required', { minimum: 1250, comparison: 'satTotal', policy: 'conditional', detail: 'An English-proof option for specified qualification groups; not required from every applicant.', sourceUrl: 'https://www.ntu.edu.sg/admissions/undergraduate/admission-guide/international-qualifications' }),
      test('IELTS', '6.0 overall, writing & speaking', { minimum: 6, comparison: 'ieltsOverall', policy: 'conditional', detail: 'An English-proof option for specified qualification groups.', sourceUrl: 'https://www.ntu.edu.sg/admissions/undergraduate/admission-guide/international-qualifications' }),
    ],
  },
  'university-of-chicago': {
    note: 'UChicago is test-optional under its No Harm policy. International applicants may submit an English-proficiency test, but the College publishes no IELTS cutoff.',
    bachelor: [
      test('SAT', 'Optional · no minimum', { policy: 'optional', sourceUrl: 'https://collegeadmissions.uchicago.edu/apply/application/required-materials/' }),
      test('IELTS', 'Accepted · no minimum', { policy: 'conditional', detail: 'English-proficiency evidence may be required depending on the applicant’s schooling.', sourceUrl: 'https://collegeadmissions.uchicago.edu/apply/international-applicants/' }),
    ],
  },
  'peking-university': {
    note: 'PKU’s 2026 international route without a written examination publishes an SAT/AP threshold and requires Chinese proficiency. English-taught programmes can set separate rules.',
    bachelor: [
      test('SAT', '1400 + three AP scores of 4+', { minimum: 1400, comparison: 'satTotal', policy: 'conditional', detail: 'For the published 2026 route without PKU’s written examination.', sourceUrl: 'https://www.isd.pku.edu.cn/en/detail.php?id=816' }),
      test('IELTS', 'Not used for the main Chinese-taught route', { policy: 'not-accepted', detail: 'That route requires HSK 6 (210+); English-taught programmes publish separate requirements.', sourceUrl: 'https://www.isd.pku.edu.cn/en/detail.php?id=816' }),
    ],
  },
  'tsinghua-university': {
    note: 'Tsinghua reviews international academic tests and language ability by application route and programme; it does not publish one SAT or IELTS minimum for all bachelor applicants.',
    bachelor: [
      test('SAT', 'Accepted · route-specific', { policy: 'conditional', sourceUrl: 'https://international.join-tsinghua.edu.cn/Admission1/Undergraduate_Programs.htm' }),
      test('IELTS', 'Programme-specific · no universal minimum', { policy: 'conditional', sourceUrl: 'https://international.join-tsinghua.edu.cn/Admission1/Undergraduate_Programs.htm' }),
    ],
  },
  'uc-berkeley': {
    note: 'UC Berkeley is test-free and does not use SAT or ACT scores in admission. Applicants educated in a non-English-language setting can satisfy English proficiency with IELTS.',
    bachelor: [
      test('SAT', 'Not considered for admission', { policy: 'not-accepted', sourceUrl: 'https://admissions.berkeley.edu/apply-to-berkeley/freshmen/requirements/' }),
      test('IELTS', '6.5 overall', { minimum: 6.5, comparison: 'ieltsOverall', policy: 'conditional', sourceUrl: 'https://admissions.berkeley.edu/apply-to-berkeley/international-students/' }),
    ],
  },
  'university-of-melbourne': {
    note: 'Melbourne accepts SAT as an academic qualification for relevant applicants, with course-specific entry scores. Most direct-entry bachelor degrees use the standard IELTS level.',
    bachelor: [
      test('SAT', 'Accepted · course-specific score', { policy: 'conditional', sourceUrl: 'https://study.unimelb.edu.au/how-to-apply/undergraduate-study/international-applications/entry-requirements' }),
      test('IELTS', '6.5 overall · 6.0 each', { minimum: 6.5, comparison: 'ieltsOverall', policy: 'conditional', detail: 'Most bachelor degrees; some courses require 7.0.', sourceUrl: 'https://study.unimelb.edu.au/how-to-apply/english-language-requirements/undergraduate-english-language-requirements' }),
    ],
  },
  'unsw-sydney': {
    note: 'UNSW accepts SAT for international direct entry, but the required total changes by degree. IELTS also varies, with 6.5 as the standard undergraduate baseline.',
    bachelor: [
      test('SAT', 'Accepted · degree-specific minimum', { policy: 'conditional', detail: 'Use the official direct-entry table for the selected degree and intake.', sourceUrl: 'https://www.unsw.edu.au/study/international-students/sat-admission' }),
      test('IELTS', '6.5 overall · 6.0 each', { minimum: 6.5, comparison: 'ieltsOverall', policy: 'conditional', detail: 'Some programmes, including Business and Law, require 7.0.', sourceUrl: 'https://www.unsw.edu.au/study/how-to-apply/english-language-requirements' }),
    ],
  },
  epfl: {
    note: 'EPFL bachelor programmes are taught mainly in French. Admission is based on the school-leaving qualification or EPFL entrance route, not a universal SAT or IELTS score.',
    bachelor: [
      test('SAT', 'Not a bachelor requirement', { policy: 'not-required', sourceUrl: 'https://www.epfl.ch/education/admission/admission-2/bachelor-admission-criteria-and-application/' }),
      test('IELTS', 'Not used for bachelor language proof', { policy: 'not-accepted', detail: 'French B2 is required and C1 is strongly recommended.', sourceUrl: 'https://www.epfl.ch/education/admission/admission-2/bachelor-admission-criteria-and-application/' }),
    ],
  },
  'technical-university-of-munich': {
    note: 'TUM admission is driven by the recognised school qualification, programme aptitude process and the programme’s teaching language. There is no university-wide SAT or IELTS minimum.',
    bachelor: [
      test('SAT', 'Not a university-wide requirement', { policy: 'not-required', sourceUrl: 'https://www.tum.de/en/studies/application/application-info-portal/admission-requirements' }),
      test('IELTS', 'Programme-specific language proof', { policy: 'conditional', detail: 'Many bachelor programmes require German; English-taught options publish their own accepted proof.', sourceUrl: 'https://www.tum.de/en/studies/application/application-info-portal/language-certificates' }),
    ],
  },
  'johns-hopkins-university': {
    note: 'Johns Hopkins requires SAT or ACT for first-year admission but publishes no cutoff. English testing is recommended in the circumstances described by Undergraduate Admissions.',
    bachelor: [
      test('SAT', 'Required · no minimum', { policy: 'required', sourceUrl: 'https://apply.jhu.edu/how-to-apply/application-deadlines-requirements/standardized-testing/' }),
      test('IELTS', 'Recommended · no minimum', { policy: 'recommended', detail: 'Recommended when English is not the primary language or the last three school years were not in English.', sourceUrl: 'https://apply.jhu.edu/how-to-apply/application-deadlines-requirements/standardized-testing/' }),
    ],
  },
  'university-of-sydney': {
    note: 'Sydney accepts SAT as one recognised secondary qualification; the required score changes by course. The standard IELTS level applies to many bachelor degrees.',
    bachelor: [
      test('SAT', 'Accepted · course-specific score', { policy: 'conditional', sourceUrl: 'https://www.sydney.edu.au/study/applying/how-to-apply/international-students.html' }),
      test('IELTS', '6.5 overall · 6.0 each', { minimum: 6.5, comparison: 'ieltsOverall', policy: 'conditional', detail: 'Some courses have higher English requirements.', sourceUrl: 'https://www.sydney.edu.au/study/applying/how-to-apply/english-language-requirements.html' }),
    ],
  },
  'mcgill-university': {
    note: 'McGill’s SAT policy depends on the applicant’s school curriculum and intake. Fall 2026 applicants to most programmes using a US high-school diploma may opt out.',
    bachelor: [
      test('SAT', 'Test-optional for most Fall 2026 programmes', { policy: 'optional', detail: 'Applies to applicants using a US high-school diploma; future-cycle policy may change.', sourceUrl: 'https://www.mcgill.ca/undergraduate-admissions/apply/requirements/us/faq2026' }),
      test('IELTS', '6.5 overall · 6.0 each', { minimum: 6.5, comparison: 'ieltsOverall', policy: 'conditional', sourceUrl: 'https://www.mcgill.ca/undergraduate-admissions/apply/english-proficiency' }),
    ],
  },
  'universite-psl': {
    note: 'PSL bachelor admission is handled by individual member schools and programmes, so there is no institution-wide SAT or IELTS cutoff.',
    bachelor: [
      test('SAT', 'Optional or programme-specific', { policy: 'conditional', detail: 'For example, the English-taught I-BE3 bachelor accepts optional SAT evidence.', sourceUrl: 'https://psl.eu/en/education/bachelors-degrees' }),
      test('IELTS', 'Programme-specific · no universal minimum', { policy: 'conditional', detail: 'The I-BE3 bachelor asks for English B2 but does not mandate an IELTS score.', sourceUrl: 'https://www.minesparis.psl.eu/en/education/i-be3/' }),
    ],
  },
  'university-of-toronto': {
    note: 'U of T evaluates academic qualifications by curriculum and does not set a universal SAT requirement. Applicants who need English proof can use the published IELTS minimum.',
    bachelor: [
      test('SAT', 'Curriculum-specific · no universal minimum', { policy: 'conditional', sourceUrl: 'https://future.utoronto.ca/apply/requirements/international-high-school-secondary/' }),
      test('IELTS', '6.5 overall · 6.0 each', { minimum: 6.5, comparison: 'ieltsOverall', policy: 'conditional', sourceUrl: 'https://future.utoronto.ca/english-language-requirements' }),
    ],
  },
  'fudan-university': {
    note: 'Fudan’s international bachelor requirements are published per programme and teaching language. SAT and IELTS can be submitted where the selected programme requests them.',
    bachelor: [
      test('SAT', 'Accepted · programme-specific', { policy: 'conditional', detail: 'No university-wide minimum is published for all international bachelor programmes.', sourceUrl: 'https://iso.fudan.edu.cn/isoenglish/16210/list.htm' }),
      test('IELTS', 'Programme-specific · no universal minimum', { policy: 'conditional', sourceUrl: 'https://iso.fudan.edu.cn/isoenglish/16210/list.htm' }),
    ],
  },
  'kings-college-london': {
    note: 'King’s sets English bands and academic-equivalency requirements by course. SAT can form part of a US-qualification combination, not a standalone global requirement.',
    bachelor: [
      test('SAT', 'Accepted in US qualification combinations', { policy: 'conditional', detail: 'Required scores and supporting AP/Honors qualifications vary by course.', sourceUrl: 'https://www.kcl.ac.uk/study/undergraduate/how-to-apply/entry-requirements' }),
      test('IELTS', '6.0–7.5 by course band', { policy: 'conditional', detail: 'Check the course’s assigned English band and component minimums; there is no single score to compare across King’s.', sourceUrl: 'https://www.kcl.ac.uk/study/undergraduate/how-to-apply/english-language-requirements' }),
    ],
  },
  'australian-national-university': {
    note: 'ANU converts recognised international qualifications, including SAT, into programme entry ranks. Its standard English requirement applies unless a programme sets a higher level.',
    bachelor: [
      test('SAT', 'Accepted · programme-specific score', { policy: 'conditional', sourceUrl: 'https://study.anu.edu.au/apply/international-applications/indicative-entry-requirement' }),
      test('IELTS', '6.5 overall · 6.0 each', { minimum: 6.5, comparison: 'ieltsOverall', policy: 'conditional', sourceUrl: 'https://policies.anu.edu.au/ppl/document/ANUP_000408' }),
    ],
  },
  'chinese-university-of-hong-kong': {
    note: 'CUHK lists SAT as one international academic-qualification route and separately publishes its English-language minimum.',
    bachelor: [
      test('SAT', '1190 + two AP scores of 3+', { minimum: 1190, comparison: 'satTotal', policy: 'conditional', detail: 'Applies to the published SAT/AP qualification route.', sourceUrl: 'https://admission.cuhk.edu.hk/application/overseas-other-qualifications-non-local-international-team/requirements/' }),
      test('IELTS', '6.0 overall', { minimum: 6, comparison: 'ieltsOverall', policy: 'conditional', sourceUrl: 'https://admission.cuhk.edu.hk/application/overseas-other-qualifications-non-local-international-team/requirements/' }),
    ],
  },
  'university-of-edinburgh': {
    note: 'Edinburgh’s English level varies by degree. SAT is accepted only within specified US-qualification combinations.',
    bachelor: [
      test('SAT', '1290 + two AP scores of 4+', { minimum: 1290, comparison: 'satTotal', policy: 'conditional', detail: 'Published US high-school route: 650+ Reading and Writing and 620+ Math; subject requirements still apply.', sourceUrl: 'https://www.ed.ac.uk/studying/international/country/americas/united-states-of-america' }),
      test('IELTS', 'Degree-specific', { policy: 'conditional', detail: 'Use the degree finder for the exact overall and component minimums.', sourceUrl: 'https://www.ed.ac.uk/studying/undergraduate/entry-requirements/english-language' }),
    ],
  },
  'university-of-manchester': {
    note: 'Manchester publishes academic and English requirements by course and applicant country; it has no single university-wide SAT cutoff.',
    bachelor: [
      test('SAT', 'Qualification- and course-specific', { policy: 'conditional', sourceUrl: 'https://www.manchester.ac.uk/study/international/country-specific-information/usa/entry-requirements/' }),
      test('IELTS', 'Usually 6.0–7.0 by course', { policy: 'conditional', detail: 'Foundation courses can start at 5.5; individual degree pages control, so there is no single comparable cutoff.', sourceUrl: 'https://www.manchester.ac.uk/study/international/admissions/undergraduate-application-process/undergraduate-entry-requirements/' }),
    ],
  },
  'monash-university': {
    note: 'Monash uses course-specific academic qualification scores. Its standard undergraduate English level is IELTS 6.5, while some degrees require a higher band.',
    bachelor: [
      test('SAT', 'Accepted · course-specific score', { policy: 'conditional', sourceUrl: 'https://www.monash.edu/admissions/entry-requirements/international' }),
      test('IELTS', '6.5 overall · 6.0 each', { minimum: 6.5, comparison: 'ieltsOverall', policy: 'conditional', sourceUrl: 'https://www.monash.edu/admissions/entry-requirements/english-language' }),
    ],
  },
  'university-of-tokyo': {
    note: 'UTokyo’s undergraduate routes and faculties set different academic and language tests; no SAT or IELTS score applies across the whole university.',
    bachelor: [
      test('SAT', 'Route-specific · no universal minimum', { policy: 'conditional', detail: 'English-taught and Japanese-taught selection routes use different examinations.', sourceUrl: 'https://www.u-tokyo.ac.jp/en/prospective-students/undergraduate_english.html' }),
      test('IELTS', 'Route-specific · no universal minimum', { policy: 'conditional', sourceUrl: 'https://www.u-tokyo.ac.jp/en/prospective-students/undergraduate_english.html' }),
    ],
  },
  'seoul-national-university': {
    note: 'SNU requires eligible international applicants to show Korean or English proficiency. SAT is supplementary academic evidence, not a universal requirement.',
    bachelor: [
      test('SAT', 'Optional supplementary material', { policy: 'optional', sourceUrl: 'https://en.snu.ac.kr/admission/undergraduate/application' }),
      test('IELTS', '6.0 overall', { minimum: 6, comparison: 'ieltsOverall', policy: 'conditional', detail: 'One accepted way to meet the English-proficiency requirement.', sourceUrl: 'https://en.snu.ac.kr/admission/overview/faq/admission' }),
    ],
  },
  'university-of-british-columbia': {
    note: 'UBC assesses applicants using their school curriculum. SAT may be additional evidence for some applicants, while IELTS has a published direct-entry minimum.',
    bachelor: [
      test('SAT', 'Not a universal requirement', { policy: 'optional', sourceUrl: 'https://you.ubc.ca/applying-ubc/requirements/international-high-schools/' }),
      test('IELTS', '6.5 overall · 6.0 each', { minimum: 6.5, comparison: 'ieltsOverall', policy: 'conditional', sourceUrl: 'https://you.ubc.ca/applying-ubc/requirements/english-language-competency/' }),
    ],
  },
  'institut-polytechnique-de-paris': {
    note: 'IP Paris bachelor admission is programme-specific. The Bachelor of Science uses its own academic and English criteria rather than a university-wide SAT or IELTS cutoff.',
    bachelor: [
      test('SAT', 'Not a university-wide requirement', { policy: 'not-required', sourceUrl: 'https://www.ip-paris.fr/en/education/bachelors' }),
      test('IELTS', 'English B2 · no IELTS cutoff', { policy: 'conditional', detail: 'Accepted proof depends on the selected bachelor programme.', sourceUrl: 'https://www.ip-paris.fr/en/education/bachelors' }),
    ],
  },
  'northwestern-university': {
    note: 'Northwestern is test-optional for first-year applicants. English-proficiency testing is required for specified international applicants, with no published IELTS cutoff.',
    bachelor: [
      test('SAT', 'Optional · no minimum', { policy: 'optional', sourceUrl: 'https://admissions.northwestern.edu/faqs/standardized-testing-policy/' }),
      test('IELTS', 'Required in specified cases · no minimum', { policy: 'conditional', detail: 'Applies when English is not the first language and high-school courses were not taught in English.', sourceUrl: 'https://admissions.northwestern.edu/apply/international-students/' }),
    ],
  },
  'university-of-queensland': {
    note: 'UQ accepts recognised international qualifications, including SAT where applicable, using programme-specific entry scores. Most degrees use the standard English minimum.',
    bachelor: [
      test('SAT', 'Accepted · programme-specific score', { policy: 'conditional', sourceUrl: 'https://study.uq.edu.au/admissions/undergraduate/consider-your-entry-score' }),
      test('IELTS', '6.5 overall · 6.0 each', { minimum: 6.5, comparison: 'ieltsOverall', policy: 'conditional', detail: 'Some programmes require higher scores.', sourceUrl: 'https://study.uq.edu.au/admissions/english-language-requirements' }),
    ],
  },
  hkust: {
    note: 'HKUST lists SAT/AP as one recognised American-pattern qualification route and IELTS as one way to meet its English-language requirement.',
    bachelor: [
      test('SAT', '1190 + two AP scores of 3+', { minimum: 1190, comparison: 'satTotal', policy: 'conditional', sourceUrl: 'https://join.hkust.edu.hk/admissions/international-qualifications' }),
      test('IELTS', '6.0 overall', { minimum: 6, comparison: 'ieltsOverall', policy: 'conditional', sourceUrl: 'https://join.hkust.edu.hk/oas/elar.pdf' }),
    ],
  },
  'hong-kong-polytechnic-university': {
    note: 'PolyU publishes both a SAT/AP international-qualification route and a separate English-language minimum for non-local applicants.',
    bachelor: [
      test('SAT', '1190 + two AP scores of 3+', { minimum: 1190, comparison: 'satTotal', policy: 'conditional', detail: 'The route also requires a high-school diploma average of at least 80%.', sourceUrl: 'https://www.polyu.edu.hk/study/ug/admissions/international-other-qualifications/international-other-qualifications-general' }),
      test('IELTS', '6.0 overall', { minimum: 6, comparison: 'ieltsOverall', policy: 'conditional', sourceUrl: 'https://www.polyu.edu.hk/study/ug/admissions/international-other-qualifications/international-other-qualifications-english' }),
    ],
  },
  ucla: {
    note: 'UCLA is test-free and does not consider SAT or ACT for admission or scholarships. It publishes a competitive IELTS recommendation for applicants who need English proof.',
    bachelor: [
      test('SAT', 'Not considered for admission', { policy: 'not-accepted', sourceUrl: 'https://admission.ucla.edu/apply/first-year/first-year-requirements' }),
      test('IELTS', '7.5 competitive', { recommended: 7.5, comparison: 'ieltsOverall', policy: 'recommended', sourceUrl: 'https://admission.ucla.edu/apply/international-applicants' }),
    ],
  },
  'delft-university-of-technology': {
    note: 'TU Delft bachelor entry is based on diploma equivalence, programme selection and teaching language. SAT is not a general requirement; IELTS applies only where the programme asks for English proof.',
    bachelor: [
      test('SAT', 'Not a university-wide requirement', { policy: 'not-required', sourceUrl: 'https://www.tudelft.nl/en/education/admission-and-application/bsc-international-diploma' }),
      test('IELTS', 'Programme-specific language proof', { policy: 'conditional', sourceUrl: 'https://www.tudelft.nl/en/education/admission-and-application/bsc-international-diploma' }),
    ],
  },
  'shanghai-jiao-tong-university': {
    note: 'SJTU requirements vary by international undergraduate programme. Global College publishes an IELTS minimum and a competitive SAT range, while other routes can differ.',
    bachelor: [
      test('SAT', '1350–1450 middle 50% (Global College)', { recommended: 1350, comparison: 'satTotal', policy: 'recommended', detail: 'SAT is one possible academic test; CSCA or another accepted route may apply.', sourceUrl: 'https://gc.sjtu.edu.cn/admission/international-undergraduate-admission/application-requirements/' }),
      test('IELTS', '6.0 minimum (Global College)', { minimum: 6, comparison: 'ieltsOverall', policy: 'conditional', sourceUrl: 'https://gc.sjtu.edu.cn/admission/international-undergraduate-admission/application-requirements/' }),
    ],
  },
  'zhejiang-university': {
    note: 'Zhejiang requires language proof by teaching language and CSCA for 2026/27 international bachelor admission. SAT is optional supporting material, not a substitute for CSCA.',
    bachelor: [
      test('SAT', 'Optional supporting material', { policy: 'optional', sourceUrl: 'https://iczu.zju.edu.cn/admissionsen/2024/1030/c68988a2981659/page.htm' }),
      test('IELTS', 'Required for English-taught routes · programme-specific', { policy: 'conditional', detail: 'The university-wide guide names IELTS as accepted proof but does not set one score for every programme.', sourceUrl: 'https://iczu.zju.edu.cn/admissionsen/2024/1030/c68988a2981659/page.htm' }),
    ],
  },
  'yonsei-university': {
    note: 'Yonsei’s international undergraduate tracks evaluate language and standardised-test evidence by college and track; no university-wide SAT or IELTS cutoff is published.',
    bachelor: [
      test('SAT', 'Optional or track-specific', { policy: 'conditional', sourceUrl: 'https://admission.yonsei.ac.kr/seoul/admission/html/international/guide.asp' }),
      test('IELTS', 'Accepted · no universal minimum', { policy: 'conditional', sourceUrl: 'https://admission.yonsei.ac.kr/seoul/admission/html/international/guide.asp' }),
    ],
  },
}
