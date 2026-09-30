import type { IELTSTest, ListeningOption, Question, Section } from '../types/ieltsTypes'

const audioUrl = '/audio/ielts-listening/listening-full-test-22.mp3'

function q(number: number, type: Question['type'], text: string, answer: string, options?: string[]): Question {
  return {
    id: `lt22-q${number}`, number, type, text, correctAnswer: answer,
    strictAnswerMatch: true, options,
    location: `Part ${Math.ceil(number / 10)} · Question ${number}`,
    explanation: `The recording gives ${answer.split(' / ')[0]} as the answer.`,
  }
}

function notes(items: { n: number; before: string; after?: string; answer: string }[]) {
  return items.map(({ n, before, after = '' }) => ({ kind: 'note' as const, segments: [before, { blank: n }, after] }))
}

function mcqs(items: { n: number; prompt: string; options: [string, string, string]; answer: string }[]) {
  return items.map(({ n, prompt, options }) => ({ kind: 'mcq' as const, blank: n, prompt, options }))
}

const part1Notes = [
  { n: 1, before: 'A ', after: ' (normal size)', answer: 'piano' },
  { n: 2, before: 'A small ', after: ' table', answer: 'coffee' },
  { n: 3, before: 'An antique ', after: ' (2 m × 2 m)', answer: 'mirror' },
  { n: 4, before: 'Cupboard doors made of ', answer: 'glass' },
  { n: 5, before: 'Deliver to 448 ', after: ' Road, Birmingham, B17 5CB', answer: 'Harrivale' },
  { n: 6, before: 'Price quoted: £', answer: '232.50 / 232,50 / £232.50' },
  { n: 7, before: 'Price does not include ', answer: 'insurance' },
  { n: 8, before: 'Collection on 26 August in the ', answer: 'morning' },
  { n: 9, before: 'Collection parking: at the ', after: ' of the house', answer: 'side' },
  { n: 10, before: 'Delivery parking: in front of the ', after: ' of the house', answer: 'garage' },
]

const part2Choices: { n: number; prompt: string; options: [string, string, string]; answer: string }[] = [
  { n: 11, prompt: 'What does the tour guide advise visitors to do today?', options: ['see the most popular exhibits first', 'pay a brief visit to each gallery', 'go to the photography gallery last'], answer: 'A' },
  { n: 12, prompt: 'William Craven, the museum architect, also designed', options: ['a textile factory', 'the town hall', 'the railway station'], answer: 'B' },
  { n: 13, prompt: 'The museum won an award for preserving its', options: ['staircase', 'floor', 'windows'], answer: 'A' },
  { n: 14, prompt: 'Most of the project funding came from', options: ['the public', 'the government', 'local businesses'], answer: 'C' },
  { n: 15, prompt: 'Over the next five years, the museum will mainly invest in', options: ['restoring existing collections', 'developing educational programmes', 'buying new exhibits'], answer: 'A' },
  { n: 16, prompt: 'Visitors who want to learn more about the exhibits should', options: ['visit the museum website', 'read the gallery leaflets', 'attend the monthly lectures'], answer: 'C' },
]

const collectionOptions: ListeningOption[] = [
  { letter: 'A', text: 'has been shown in different museums' },
  { letter: 'B', text: 'consists of work by a local resident' },
  { letter: 'C', text: 'has exhibits from various countries' },
  { letter: 'D', text: 'is only on temporary display' },
  { letter: 'E', text: 'shows things that are no longer common' },
  { letter: 'F', text: 'is on loan from a foreign museum' },
]
const collections = [
  { n: 17, label: '18th-century paintings', answer: 'C' },
  { n: 18, label: 'Farnley collection', answer: 'B' },
  { n: 19, label: 'Kitchen appliances', answer: 'E' },
  { n: 20, label: 'Fashion gallery', answer: 'D' },
]

const analysisOptions: ListeningOption[] = [
  { letter: 'A', text: 'will save considerable business time and effort' },
  { letter: 'B', text: 'uses a visual representation' },
  { letter: 'C', text: 'does not fit the company' },
  { letter: 'D', text: 'would take too long' },
  { letter: 'E', text: 'is easy to use' },
  { letter: 'F', text: 'is difficult to apply' },
  { letter: 'G', text: 'suits companies of almost any size' },
]
const methods = [
  { n: 21, label: 'PEST', answer: 'C' },
  { n: 22, label: 'Drill Down', answer: 'D' },
  { n: 23, label: 'PMI', answer: 'E' },
  { n: 24, label: 'Pareto', answer: 'A' },
  { n: 25, label: 'SWOT', answer: 'G' },
]
const part3Choices: { n: number; prompt: string; options: [string, string, string]; answer: string }[] = [
  { n: 26, prompt: 'What does Frances consider the company’s greatest strength?', options: ['its reputation', 'its experienced employees', 'its management'], answer: 'B' },
  { n: 27, prompt: 'What did Sam overlook when considering future growth?', options: ['finding cheaper suppliers', 'opening an overseas office', 'competing with large firms'], answer: 'B' },
  { n: 28, prompt: 'Which factor could threaten the company?', options: ['increasing competition', 'outdated technology', 'new legislation'], answer: 'C' },
  { n: 29, prompt: 'What has Sam learned from his research?', options: ['how to use better tools', 'the cost of business success', 'the gap between theory and reality'], answer: 'C' },
  { n: 30, prompt: 'What does the professor suggest for the report?', options: ['reach a final conclusion', 'reorganise the structure', 'add more detail'], answer: 'A' },
]

const part4Notes = [
  { n: 31, before: 'Graduates interviewed had studied ', answer: 'business management' },
  { n: 32, before: 'Research methods: email questionnaires and ', answer: 'phone interview / phone interviews' },
  { n: 33, before: '32% of students obtained another ', answer: 'qualification' },
  { n: 34, before: 'Most graduates work in the ', after: ' sector', answer: 'public' },
  { n: 35, before: 'Most graduates are satisfied with their ', answer: 'salary' },
  { n: 36, before: 'Useful skill: working as a ', after: ' member', answer: 'team' },
  { n: 37, before: 'Useful skill: ', after: ' ability', answer: 'problem solving / problem-solving' },
  { n: 38, before: 'Insufficient training in ', answer: 'presentation' },
  { n: 39, before: 'Advice on ', after: ' was unnecessary', answer: 'essay writing' },
  { n: 40, before: 'Insufficient advice on finding a ', answer: 'job' },
]

const sections: Section[] = [
  {
    id: 'lt22-part1', title: 'A1 Furniture Removals', partLabel: 'Part 1',
    partInstruction: 'Listen and answer questions 1–10.',
    groups: [{ range: 'Questions 1–10', instruction: 'Complete the notes. Write ONE WORD AND/OR A NUMBER for each answer.', blocks: [
      { kind: 'title', text: 'A1 Furniture Removals' },
      { kind: 'subhead', text: 'Items to move' }, ...notes(part1Notes.slice(0, 4)),
      { kind: 'subhead', text: 'Delivery and payment' }, ...notes(part1Notes.slice(4, 7)),
      { kind: 'subhead', text: 'Collection and parking' }, ...notes(part1Notes.slice(7)),
    ] }],
    questions: part1Notes.map(({ n, before, after, answer }) => q(n, 'note-completion', `${before}___${after ?? ''}`, answer)),
  },
  {
    id: 'lt22-part2', title: 'Museum Tour', partLabel: 'Part 2',
    partInstruction: 'Listen and answer questions 11–20.',
    groups: [
      { range: 'Questions 11–16', instruction: 'Choose the correct letter, A, B or C.', blocks: [
        { kind: 'title', text: 'Museum Tour' }, ...mcqs(part2Choices),
      ] },
      { range: 'Questions 17–20', instruction: 'Match each collection with the information A–F.', blocks: [
        { kind: 'grid', columns: collectionOptions.map(option => option.letter), options: collectionOptions, inputMode: true,
          rows: collections.map(({ n, label }) => ({ blank: n, label })) },
      ] },
    ],
    questions: [
      ...part2Choices.map(({ n, prompt, options, answer }) => q(n, 'multiple-choice', prompt, answer, options)),
      ...collections.map(({ n, label, answer }) => q(n, 'matching-information', label, answer)),
    ],
  },
  {
    id: 'lt22-part3', title: 'Research Analysis Methods', partLabel: 'Part 3',
    partInstruction: 'Listen and answer questions 21–30.',
    groups: [
      { range: 'Questions 21–25', instruction: 'Match each analysis method with a characteristic A–G.', blocks: [
        { kind: 'title', text: 'Research Analysis Methods' },
        { kind: 'grid', columns: analysisOptions.map(option => option.letter), options: analysisOptions, inputMode: true,
          rows: methods.map(({ n, label }) => ({ blank: n, label })) },
      ] },
      { range: 'Questions 26–30', instruction: 'Choose the correct letter, A, B or C.', blocks: mcqs(part3Choices) },
    ],
    questions: [
      ...methods.map(({ n, label, answer }) => q(n, 'matching-information', label, answer)),
      ...part3Choices.map(({ n, prompt, options, answer }) => q(n, 'multiple-choice', prompt, answer, options)),
    ],
  },
  {
    id: 'lt22-part4', title: 'Employment Survey on Graduates', partLabel: 'Part 4',
    partInstruction: 'Listen and answer questions 31–40.',
    groups: [{ range: 'Questions 31–40', instruction: 'Complete the notes. Write NO MORE THAN TWO WORDS for each answer.', blocks: [
      { kind: 'title', text: 'Employment Survey on Graduates' },
      { kind: 'subhead', text: 'Overview' }, ...notes(part4Notes.slice(0, 2)),
      { kind: 'subhead', text: 'Findings' }, ...notes(part4Notes.slice(2, 5)),
      { kind: 'subhead', text: 'Feedback' }, ...notes(part4Notes.slice(5)),
    ] }],
    questions: part4Notes.map(({ n, before, after, answer }) => q(n, 'note-completion', `${before}___${after ?? ''}`, answer)),
  },
]

export const listeningFullTest22: IELTSTest = {
  id: 'ielts-listening-22', title: 'IELTS Listening Full Test 22',
  type: 'Academic', module: 'Listening', duration: 30, totalQuestions: 40,
  continuousAudioUrl: audioUrl, sections,
}
