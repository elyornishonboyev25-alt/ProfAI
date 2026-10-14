// Paraphrased calibration notes, verified against IELTS.org on 2026-10-11.
// Keep assessment anchored to performance, never a user's target or population average.
export const IELTS_SOURCES = {
  scoring: 'https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail',
  writing: 'https://ielts.org/cdn/ielts-guides/ielts-writing-band-descriptors.pdf',
  speaking: 'https://ielts.org/cdn/ielts-guides/ielts-speaking-band-descriptors.pdf',
} as const

export const FAIR_ASSESSMENT_POLICY = `Judge the original response against descriptors, criterion by criterion. Award the best-supported level after weighing both strengths and limitations. Do not anchor to a typical learner band, target band, a default 5-6.5 range, or an artificially conservative ceiling. Bands 7, 8 and 9 are available when the evidence supports them; do not inflate weak responses. An occasional error does not automatically rule out a high band. Assess error frequency, consistency and effect on meaning, not just the number of corrections. Separate optional style improvements from errors. Do not require unusual vocabulary or idioms where they would be unnatural. Explain each score with actual response evidence and a relevant descriptor distinction. Missing technical evidence is uncertainty, not poor English. Do not invent limitations to fill a feedback quota.`

export const WRITING_CALIBRATION = `Calibration (paraphrased from the public Writing descriptors):
9: exceptionally complete task fulfilment; effortless organisation; precise, natural lexical breadth and flexible grammar with only very rare slips.
8: sufficiently developed task coverage, easy logical progression, broad precise language; most sentences accurate, occasional minor lapses acceptable.
7: clear task coverage and position/overview; organised development; flexible vocabulary and complex structures; some errors acceptable when meaning stays clear.
6: main requirements covered, development uneven; generally coherent; adequate vocabulary; mixed structures with errors seldom obscuring meaning.
5: incomplete development, uneven organisation, limited expression and recurrent errors that sometimes trouble the reader.
4: minimal task coverage, weak progression, basic repetitive language; frequent errors may obscure meaning.
3-2: increasingly irrelevant or disconnected content and severely restricted language.
1: virtually no communicative writing; the descriptors assign this level to responses of 20 words or fewer.
0: no attempt, wholly non-English, or proven wholly memorised response. Never assume memorisation merely because an answer is polished.
For Task 1 distinguish an overview of main features from isolated details; for Task 2 distinguish supported ideas from assertions. Assess each language criterion independently of task coverage.`

export const SPEAKING_CALIBRATION = `Calibration (paraphrased from the public Speaking descriptors):
9: effortless coherent development, precise flexible vocabulary and grammar, subtle and readily intelligible delivery; very rare slips.
8: sustained coherent speech, broad flexible wording and grammar, mostly accurate sentences, easily understood delivery; occasional lapses allowed.
7: sustained turns, effective linking/paraphrase, flexible structures and frequent accurate sentences; hesitation and some errors can occur without damaging coherence. Pronunciation combines secure band-6 features with some band-8 features.
6: willing extended speech, occasionally disrupted coherence, sufficient vocabulary, mixed structures with errors rarely blocking meaning; generally intelligible pronunciation despite uneven control.
5: repetition or language-search limits continuity, restricted flexibility, basic grammar stronger than complex forms; pronunciation between 4 and 6.
4: broken continuity/coherence, basic vocabulary and repetitive structures; frequent errors and pronunciation sometimes demand listener effort.
3-2: severe communication limits, isolated/simple language and frequent breakdowns.
1: almost no meaningful connected communication.
0: absent or incomplete test.
Rate performance across the available parts, not the weakest answer. Short identification answers are appropriate. No Speaking word minimum or fixed pace threshold determines a band. Spoken grammar allows natural ellipsis and informal forms. Do not assess transcription punctuation/spelling, specialist knowledge or accent conformity as Speaking criteria.`

export const roundIeltsBand = (value: number) => Math.round(value * 2) / 2
