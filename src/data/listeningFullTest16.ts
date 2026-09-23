import type { IELTSTest, ListeningOption, Question, Section } from '../types/ieltsTypes'

// User-supplied questions and key, checked against two public sources.
// Audio provenance and verification: docs/LISTENING_FULL_TEST_16_SOURCE.md.
function q(number: number, type: Question['type'], text: string, correctAnswer: string, explanation: string, options?: string[]): Question {
  return { id: `lt16-q${number}`, number, type, text, correctAnswer, strictAnswerMatch: true, explanation, location: `Part ${Math.ceil(number / 10)}, Question ${number}`, options }
}

const facilities = ['childcare', 'playroom', 'parking', 'gym', 'laundry', 'cleaning', 'sauna/spa']
const travelQuestions = [
  { number: 5, prompt: "According to the client, the children's favourite theme park will be", options: ['Movieworld', 'Dreamworld', 'Waterworld'], answer: 'C', explanation: 'Swimming appeals most to the children.' },
  { number: 6, prompt: 'At the wildlife sanctuary they will be able to take close-up photographs of', options: ['the crocodiles', 'the kangaroos', 'the koalas'], answer: 'A', explanation: 'Crocodiles can be photographed nearby.' },
  { number: 7, prompt: 'The client wants the accommodation to be near the', options: ['beach', 'nightclubs', 'shopping facilities'], answer: 'C', explanation: 'Food shops must be within walking distance.' },
]
const part1: Section = {
  id: 'lt16-part1', title: 'Travel Agency Client Quotation Form', partLabel: 'Part 1',
  partInstruction: 'Listen and answer questions 1 - 10.',
  groups: [
    { range: 'Questions 1 - 4', instruction: 'Complete the form below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.', blocks: [
      { kind: 'title', text: 'Travel Agency Client Quotation Form' },
      { kind: 'text', text: 'Country of destination: Australia' },
      { kind: 'note', segments: ['Surname: ', { blank: 1 }] },
      { kind: 'text', text: 'Month of travel: July' },
      { kind: 'note', segments: ['Length of stay: ', { blank: 2 }] },
      { kind: 'text', text: 'Possible dates of travel: within first fortnight' },
      { kind: 'text', text: 'Airport: Brisbane' },
      { kind: 'note', segments: ['Area of destination: the ', { blank: 3 }, ' (near Brisbane)'] },
      { kind: 'note', segments: ['Type of accommodation: ', { blank: 4 }] },
    ] },
    { range: 'Questions 5 - 7', instruction: 'Choose the correct letter, A, B or C.', blocks: travelQuestions.map(({ number, prompt, options }) => ({ kind: 'mcq', blank: number, prompt, options })) },
    { range: 'Questions 8 - 10', instruction: 'Choose THREE letters, A-G.', blocks: [
      { kind: 'multi-mcq', blanks: [8, 9, 10], prompt: 'Which THREE facilities does the client want at their accommodation?', options: facilities, selectionLimit: 3 },
    ] },
  ],
  questions: [
    q(1, 'note-completion', 'Surname: ___', 'Thorn', 'Spell the surname Thorn, without a final e.'),
    q(2, 'note-completion', 'Length of stay: ___', '5 days / five days', 'Include days: the blank requires a length of stay.'),
    q(3, 'note-completion', 'Area of destination: the ___ (near Brisbane)', 'Gold Coast', 'Gold Coast uses the permitted two words. The is already printed.'),
    q(4, 'note-completion', 'Type of accommodation: ___', 'apartment / an apartment', 'Use the singular accommodation type: apartment.'),
    ...travelQuestions.map(({ number, prompt, options, answer, explanation }) => q(number, 'multiple-choice', prompt, answer, explanation, options)),
    ...[8, 9, 10].map(number => q(number, 'multiple-choice', 'Which THREE facilities does the client want at their accommodation?', 'B / E / F', 'Select playroom, laundry and cleaning in any order. Each choice scores once.', facilities)),
  ],
}

const part2: Section = {
  id: 'lt16-part2', title: 'Reynolds Electrical', partLabel: 'Part 2',
  partInstruction: 'Listen and answer questions 11 - 20.',
  groups: [
    { range: 'Questions 11 - 16', instruction: 'Complete the sentences below. Write ONE WORD AND/OR A NUMBER for each answer.', blocks: [
      { kind: 'title', text: 'Reynolds Electrical' },
      { kind: 'note', segments: ["Tony Reynolds' first business produced ", { blank: 11 }] },
      { kind: 'note', segments: ['Reynolds Electrical was started in the year ', { blank: 12 }] },
      { kind: 'note', segments: ['There was previously a ', { blank: 13 }, ' where the company is now based'] },
      { kind: 'note', segments: ['The ', { blank: 14 }, ' of the products is an important factor for customers'] },
      { kind: 'note', segments: ['The company is building a new ', { blank: 15 }] },
      { kind: 'note', segments: ['The company recently won an award for its success in reducing ', { blank: 16 }] },
    ] },
    { range: 'Questions 17 - 20', instruction: 'Complete the table below. Write ONE WORD ONLY for each answer.', blocks: [
      { kind: 'table', columns: ['Day', 'Topic'], rows: [
        [{ segments: ['Monday'] }, { segments: ['possible improvements in ', { blank: 17 }] }],
        [{ segments: ['Tuesday'] }, { segments: [{ blank: 18 }, ' development'] }],
        [{ segments: ['Wednesday'] }, { segments: ['communication with ', { blank: 19 }] }],
        [{ segments: ['Thursday'] }, { segments: ['getting the right staff'] }],
        [{ segments: ['Friday'] }, { segments: ['making sure the company has enough ', { blank: 20 }] }],
      ] },
    ] },
  ],
  questions: [
    q(11, 'note-completion', "Tony Reynolds' first business produced ___", 'cars', 'Use the plural product name: cars.'),
    q(12, 'note-completion', 'Reynolds Electrical was started in the year ___', '1928', 'The required founding year is 1928.'),
    q(13, 'note-completion', 'There was previously a ___ where the company is now based', 'cinema', 'Cinema completes the sentence after a.'),
    q(14, 'note-completion', 'The ___ of the products is an important factor for customers', 'quality', 'The required product characteristic is quality.'),
    q(15, 'note-completion', 'The company is building a new ___', 'factory', 'Factory is the new building, not its equipment.'),
    q(16, 'note-completion', 'The company recently won an award for its success in reducing ___', 'waste', 'Write the uncountable noun waste.'),
    q(17, 'note-completion', 'Monday: possible improvements in ___', 'safety', 'Match safety to Monday.'),
    q(18, 'note-completion', 'Tuesday: ___ development', 'website', 'Website modifies development; write one word.'),
    q(19, 'note-completion', 'Wednesday: communication with ___', 'customers', 'Use the plural customers for the people concerned.'),
    q(20, 'note-completion', 'Friday: making sure the company has enough ___', 'money', 'Write money, the resource required to pay expenses.'),
  ],
}

const portfolioQuestions = [
  { number: 21, prompt: 'According to Sandra, what is the most important thing to demonstrate in the portfolio?', options: ['creativity', 'development', 'quality'], answer: 'B', explanation: 'She wants to demonstrate progression.' },
  { number: 22, prompt: 'What is Charlie going to include to show his understanding of design?', options: ['some photos', 'a poster', 'a publicity flyer'], answer: 'B', explanation: 'Charlie chooses his safety poster.' },
  { number: 23, prompt: 'Charlie and Sandra choose drawings of the human body to show their ability to', options: ['provide realistic detail', 'portray everyday situations', 'represent movement'], answer: 'C', explanation: 'Their running figure demonstrates action.' },
  { number: 24, prompt: 'Why does Charlie advise Sandra not to include her work on deserts?', options: ['It needs explanation', 'It will take up too much space', "It doesn't fit in with the rest of her work"], answer: 'A', explanation: 'The work requires extensive explanatory notes.' },
  { number: 25, prompt: 'What did Sandra think was the best advice from their tutor?', options: ['Save the best for the end', 'Make a strong first impression', 'Organise work in groups'], answer: 'C', explanation: 'Grouping similar pieces provides structure.' },
  { number: 26, prompt: 'Who is Sandra going to ask to look at her portfolio before she submits it?', options: ['her parents', 'an art critic', 'an artist'], answer: 'C', explanation: 'She chooses a local sculptor.' },
]
const reasons: ListeningOption[] = [
  { letter: 'A', text: 'explanation of a personal relationship' }, { letter: 'B', text: 'communication of a mood' },
  { letter: 'C', text: 'high degree of accuracy' }, { letter: 'D', text: 'evidence of originality' },
  { letter: 'E', text: 'use of lettering' }, { letter: 'F', text: 'combination of different materials' },
]
const pieces = [
  { blank: 27, label: 'a design for a book cover' }, { blank: 28, label: 'designs for jewellery' },
  { blank: 29, label: 'a wood carving' }, { blank: 30, label: 'an advertisement' },
]
const part3: Section = {
  id: 'lt16-part3', title: 'Art portfolios', partLabel: 'Part 3', partInstruction: 'Listen and answer questions 21 - 30.',
  groups: [
    { range: 'Questions 21 - 26', instruction: 'Choose the correct letter, A, B or C.', blocks: portfolioQuestions.map(({ number, prompt, options }) => ({ kind: 'mcq', blank: number, prompt, options })) },
    { range: 'Questions 27 - 30', instruction: "Which reason is given for the inclusion in Charlie's portfolio of each of the following pieces? Choose FOUR letters, A-F, next to questions 27-30.", blocks: [
      { kind: 'subhead', text: "Reasons for inclusion in Charlie's portfolio" },
      { kind: 'grid', columns: reasons.map(option => option.letter), options: reasons, inputMode: true, rows: [] },
      { kind: 'subhead', text: 'Pieces' },
      { kind: 'grid', columns: reasons.map(option => option.letter), inputMode: true, rows: pieces },
    ] },
  ],
  questions: [
    ...portfolioQuestions.map(({ number, prompt, options, answer, explanation }) => q(number, 'multiple-choice', prompt, answer, explanation, options)),
    q(27, 'matching-information', pieces[0].label, 'E', 'The cover showcases handwritten typography.'),
    q(28, 'matching-information', pieces[1].label, 'C', 'Jewellery design demanded precision.'),
    q(29, 'matching-information', pieces[2].label, 'D', 'The carving was his own idea.'),
    q(30, 'matching-information', pieces[3].label, 'B', 'The hotel advertisement conveys warmth.'),
  ],
}

const part4: Section = {
  id: 'lt16-part4', title: 'Hospital gardens', partLabel: 'Part 4', partInstruction: 'Listen and answer questions 31 - 40.',
  groups: [{ range: 'Questions 31 - 40', instruction: 'Complete the notes below. Write ONE WORD ONLY for each answer.', blocks: [
    { kind: 'title', text: 'Hospital gardens' },
    { kind: 'text', text: 'A recent survey found that gardens are important in the design of hospitals.' },
    { kind: 'subhead', text: '1984 Schwartz study found that' },
    { kind: 'note', bullet: true, segments: ['looking at gardens may speed recovery from surgery and from ', { blank: 31 }] },
    { kind: 'note', bullet: true, segments: ['patients with views of nature recovered much faster than patients with views of a ', { blank: 32 }] },
    { kind: 'subhead', text: 'European studies' },
    { kind: 'note', bullet: true, segments: ['hospitals were a source of ', { blank: 33 }] },
    { kind: 'subhead', text: 'Looking at nature' },
    { kind: 'note', bullet: true, segments: ['can affect electrical activity in the body, especially the ', { blank: 34 }] },
    { kind: 'note', bullet: true, segments: ['can be beneficial to the ', { blank: 35 }, ' system'] },
    { kind: 'subhead', text: '1995 Cooper and Bennett study' },
    { kind: 'note', bullet: true, segments: ['research methods included analysis, observation and ', { blank: 36 }] },
    { kind: 'note', bullet: true, segments: ['gardens with a ', { blank: 37 }, ' were particularly popular'] },
    { kind: 'subhead', text: "'Behavioural maps' studies" },
    { kind: 'text', text: 'showed gardens need' },
    { kind: 'note', bullet: true, indent: true, segments: ['areas for private conversation and flat paths'] },
    { kind: 'note', bullet: true, indent: true, segments: ['easily moved ', { blank: 38 }] },
    { kind: 'note', bullet: true, indent: true, segments: ['landscaping that attracts ', { blank: 39 }] },
    { kind: 'text', text: 'middle-aged patients prefer peace and quiet' },
    { kind: 'note', bullet: true, segments: ['elderly patients want to feel a part of ', { blank: 40 }] },
  ] }],
  questions: [
    q(31, 'note-completion', 'Looking at gardens may speed recovery from surgery and from ___', 'infection', 'Infection is the second recovery context.'),
    q(32, 'note-completion', 'Patients with views of a ___', 'wall', 'Use the singular noun wall after a.'),
    q(33, 'note-completion', 'Hospitals were a source of ___', 'stress', 'Stress completes the phrase a source of.'),
    q(34, 'note-completion', 'Electrical activity in the body, especially the ___', 'heart', 'Name the organ: heart.'),
    q(35, 'note-completion', 'Can be beneficial to the ___ system', 'immune', 'System is supplied; only immune belongs in the blank.'),
    q(36, 'note-completion', 'Research methods included analysis, observation and ___', 'interviews', 'Use the plural research method: interviews.'),
    q(37, 'note-completion', 'Gardens with a ___ were particularly popular', 'fountain', 'Use the singular feature fountain after a.'),
    q(38, 'note-completion', 'Easily moved ___', 'furniture', 'Furniture is uncountable; do not add s.'),
    q(39, 'note-completion', 'Landscaping that attracts ___', 'birds', 'Use the plural birds for the animals attracted.'),
    q(40, 'note-completion', 'Elderly patients want to feel a part of ___', 'society', 'Society completes the phrase a part of.'),
  ],
}

export const listeningFullTest16: IELTSTest = {
  id: 'ielts-listening-16', title: 'IELTS Listening Full Test 16',
  // The unmodified recording lasts 37:06.8; allow the entire audio to finish.
  type: 'Academic', module: 'Listening', duration: 38, totalQuestions: 40,
  continuousAudioUrl: '/audio/ielts-listening/listening-full-test-16.mp3',
  sections: [part1, part2, part3, part4],
}
