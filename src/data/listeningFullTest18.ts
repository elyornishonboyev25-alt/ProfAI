import type { IELTSTest, Question, Section } from '../types/ieltsTypes'

// Question sheets and answer key supplied by the user. See docs/LISTENING_FULL_TEST_18_SOURCE.md.
function q(number: number, type: Question['type'], text: string, correctAnswer: string, explanation: string, options?: string[]): Question {
  return { id: `lt18-q${number}`, number, type, text, correctAnswer, strictAnswerMatch: true, explanation, location: `Part ${Math.ceil(number / 10)}, Question ${number}`, options }
}

const part1: Section = {
  id: 'lt18-part1', title: "Pearson's Estate Agency", partLabel: 'Part 1',
  partInstruction: 'Listen and answer questions 1 - 10.',
  groups: [{ range: 'Questions 1 - 10', instruction: 'Complete the form below. Write NO MORE THAN THREE WORDS AND/OR A NUMBER for each answer.', blocks: [
    { kind: 'title', text: "Pearson's Estate Agency" },
    { kind: 'title', text: 'Registration Form for House Purchase' },
    { kind: 'example', segments: ['Area where property required: Huddersfield'] },
    { kind: 'subhead', text: 'Personal details:' },
    { kind: 'text', text: 'Name: Mary King' },
    { kind: 'note', segments: ['Address: ', { blank: 1 }, ' Avenue Barnsley'] },
    { kind: 'note', segments: ['Postcode: ', { blank: 2 }] },
    { kind: 'note', segments: ['Phone no.: ', { blank: 3 }, ' (between 8.00 am and 3.30 pm)'] },
    { kind: 'subhead', text: 'Details of property wanted:' },
    { kind: 'note', segments: ['Type: house (', { blank: 4 }, ' style)'] },
    { kind: 'text', text: 'Size: minimum 3 bedrooms' },
    { kind: 'subhead', text: 'Other requirement(s):' },
    { kind: 'note', segments: ['Inside: must have ', { blank: 5 }] },
    { kind: 'note', segments: ['Outside: must have a ', { blank: 6 }] },
    { kind: 'note', segments: ['Location: in a ', { blank: 7 }] },
    { kind: 'subhead', text: 'Purchase details:' },
    { kind: 'note', segments: ['Maximum price: £ ', { blank: 8 }] },
    { kind: 'text', text: 'Finances: Bank loan already approved' },
    { kind: 'subhead', text: 'Bank:' },
    { kind: 'text', text: 'Name: York Bank' },
    { kind: 'note', segments: ['Branch location: ', { blank: 9 }] },
    { kind: 'subhead', text: 'Other information:' },
    { kind: 'note', segments: ['Customer will ', { blank: 10 }, ' the house details'] },
  ] }],
  questions: [
    q(1, 'note-completion', 'Address: ___ Avenue Barnsley', '59 Franklyn', 'Include both the house number 59 and the name Franklyn. Avenue is already printed.'),
    q(2, 'note-completion', 'Postcode: ___', 'TY1260S / TY12 60S / TY 1260 S', 'The postcode is TY1260S, with a zero before the final S. Spacing does not change the code.'),
    q(3, 'note-completion', 'Phone no.: ___', '019488536', 'Keep every digit of the telephone number, including the initial zero.'),
    q(4, 'note-completion', 'Type: house (___ style)', 'traditional', 'Traditional describes the required style of house.'),
    q(5, 'note-completion', 'Inside: must have ___', 'central heating', 'The indoor requirement is central heating; both words are needed.'),
    q(6, 'note-completion', 'Outside: must have a ___', 'garage', 'Garage completes the outside requirement after the printed article a.'),
    q(7, 'note-completion', 'Location: in a ___', 'village', 'Village specifies the kind of location wanted.'),
    q(8, 'note-completion', 'Maximum price: £ ___', '120000 / 120,000 / 120 000', 'The maximum price is £120,000. The pound sign is already supplied.'),
    q(9, 'note-completion', 'Bank branch location: ___', 'Park Square', 'Park Square is the branch location; York Bank is already given as the bank name.'),
    q(10, 'note-completion', 'Customer will ___ the house details', 'collect', 'Collect is the action the customer will take to obtain the house details.'),
  ],
}

const ridingQuestions = [
  { number: 11, prompt: 'What does Maxine say about the Pennyfield Horse Riding Centre?', options: ['Classes do not run when the weather is bad.', 'It is the largest riding centre in the region.', 'You cannot book individual riding lessons.'], answer: 'C', explanation: 'C: individual riding lessons cannot be booked.' },
  { number: 12, prompt: 'What must riders provide when they register at the Riding Centre?', options: ['evidence of their riding ability', 'a deposit for use of equipment', 'contact details of their doctor'], answer: 'B', explanation: 'B: registration requires a deposit for the equipment.' },
  { number: 13, prompt: 'What does Maxine say about booking arrangements?', options: ['You must book lessons in blocks of ten.', 'You can pay with a credit card over the phone.', 'You can cancel two days in advance without charge.'], answer: 'C', explanation: 'C: cancellation is free when made two days in advance.' },
  { number: 14, prompt: 'Maxine advises nervous riders to', options: ['watch a lesson.', 'talk to other riders.', 'discuss needs with a teacher.'], answer: 'A', explanation: 'A: nervous riders are advised to watch a lesson.' },
  { number: 15, prompt: 'While riders are having their lesson, they are not allowed to', options: ['carry a phone.', 'take photos.', 'talk with spectators.'], answer: 'A', explanation: 'A: carrying a phone during a lesson is not allowed.' },
  { number: 16, prompt: 'What can you buy in the Riding Centre shop?', options: ['jackets', 'footwear', 'trousers'], answer: 'B', explanation: 'B: the shop sells footwear.' },
  { number: 17, prompt: 'The Equus Club is specially for riders', options: ['with a physical disability.', 'preparing for a competition.', 'wanting to learn how to care for horses.'], answer: 'A', explanation: 'A: the Equus Club is for riders with a physical disability.' },
]
const facilities = [{ blank: 18, label: 'Café' }, { blank: 19, label: 'Booking office' }, { blank: 20, label: 'Waiting area for rides' }]
const part2: Section = {
  id: 'lt18-part2', title: 'Pennyfield Horse Riding Centre', partLabel: 'Part 2',
  partInstruction: 'Listen and answer questions 11 - 20.',
  groups: [
    { range: 'Questions 11 - 17', instruction: 'Choose the correct letter, A, B or C.', blocks: [
      { kind: 'title', text: 'Pennyfield Horse Riding Centre' },
      ...ridingQuestions.map(({ number, prompt, options }) => ({ kind: 'mcq' as const, blank: number, prompt, options })),
    ] },
    { range: 'Questions 18 - 20', instruction: 'Label the plan below. Write the correct letter, A-G, next to questions 18-20.', blocks: [
      { kind: 'title', text: 'Plan of the Pennyfield Riding Centre' },
      { kind: 'image', src: '/images/ielts-listening-test18-pennyfield-plan.svg', alt: 'Plan of the Pennyfield Riding Centre with locations A-G, Car park, Storeroom, Shop, Field, Indoor Arena, Stable block and You are here arrow' },
      { kind: 'grid', columns: 'ABCDEFG'.split(''), inputMode: true, rows: facilities },
    ] },
  ],
  questions: [
    ...ridingQuestions.map(({ number, prompt, options, answer, explanation }) => q(number, 'multiple-choice', prompt, answer, explanation, options)),
    q(18, 'matching-information', 'Café', 'D', 'D is the café, beside the Storeroom and to the left of the Shop.'),
    q(19, 'matching-information', 'Booking office', 'C', 'C is the booking office, below the Car park and above the Indoor Arena.'),
    q(20, 'matching-information', 'Waiting area for rides', 'E', 'E is the waiting area, the narrow section along the left side of the Field.'),
  ],
}

const assignmentOptions = ['choice of company', 'accuracy of information', 'lack of research', 'late submission', 'poor planning', 'presentation', 'repetition', 'writing style']
const coffeeQuestions = [
  { number: 24, prompt: 'Lena should have added that JustCoffee offers', options: ['technical help.', 'financial aid.', 'agricultural advice.'], answer: 'B', explanation: 'B: Lena should have included the financial aid offered by JustCoffee.' },
  { number: 25, prompt: 'JustCoffee pays its suppliers', options: ['standard market rates.', 'twice as much as other companies.', 'three times the global average.'], answer: 'C', explanation: 'C: suppliers receive three times the global average.' },
  { number: 26, prompt: 'Lena should have found out more about', options: ['farming methods.', 'market expansion.', 'producer countries.'], answer: 'A', explanation: 'A: farming methods needed further research.' },
]
const part3: Section = {
  id: 'lt18-part3', title: 'JustCoffee assignment', partLabel: 'Part 3', partInstruction: 'Listen and answer questions 21 - 30.',
  groups: [
    { range: 'Questions 21 - 23', instruction: 'Choose THREE letters, A-H.', blocks: [
      { kind: 'multi-mcq', blanks: [21, 22, 23], prompt: 'Which THREE aspects of her assignment caused Lena to lose marks?', options: assignmentOptions, selectionLimit: 3 },
    ] },
    { range: 'Questions 24 - 26', instruction: 'Choose the correct letter, A, B or C.', blocks: coffeeQuestions.map(({ number, prompt, options }) => ({ kind: 'mcq', blank: number, prompt, options })) },
    { range: 'Questions 27 - 30', instruction: 'Complete the sentences below. Write NO MORE THAN TWO WORDS for each answer.', blocks: [
      { kind: 'title', text: 'Follow-up work' },
      { kind: 'note', segments: ['The tutor asks Lena to write a ', { blank: 27 }, ' document for the university’s files.'] },
      { kind: 'note', segments: ['Lena should describe the company’s eight ', { blank: 28 }, '.'] },
      { kind: 'note', segments: ['Lena will state that some of the profit is spent on equipment such as ', { blank: 29 }, ' for the community.'] },
      { kind: 'note', segments: ['Lena will add that what is known as “', { blank: 30 }, '” is the most significant benefit to JustCoffee’s suppliers.'] },
    ] },
  ],
  questions: [
    ...[21, 22, 23].map((number, index) => q(number, 'multiple-choice', 'Which THREE aspects of her assignment caused Lena to lose marks?', ['D', 'F', 'A'][index], 'Choose A (choice of company), D (late submission) and F (presentation), in any order. Each distinct correct choice earns one mark.', assignmentOptions)),
    ...coffeeQuestions.map(({ number, prompt, options, answer, explanation }) => q(number, 'multiple-choice', prompt, answer, explanation, options)),
    q(27, 'note-completion', 'Write a ___ document for the university’s files', 'reference', 'Reference describes the document to be kept in the university’s files.'),
    q(28, 'note-completion', 'Describe the company’s eight ___', 'products', 'Use the plural products after eight.'),
    q(29, 'note-completion', 'Equipment such as ___ for the community', 'computers', 'Computers are the example of community equipment funded by some of the profit.'),
    q(30, 'note-completion', 'The most significant benefit to suppliers is ___', 'knowledge sharing', 'The two-word phrase knowledge sharing names the most significant benefit.'),
  ],
}

const part4: Section = {
  id: 'lt18-part4', title: 'Insects as a food source', partLabel: 'Part 4', partInstruction: 'Listen and answer questions 31 - 40.',
  groups: [{ range: 'Questions 31 - 40', instruction: 'Complete the notes below. Write ONE WORD ONLY for each answer.', blocks: [
    { kind: 'title', text: 'Insects as a food source' },
    { kind: 'subhead', text: 'Why insects should be considered as a food source' },
    { kind: 'note', bullet: true, segments: ['They have a lot of protein and contain ', { blank: 31 }, '.'] },
    { kind: 'note', bullet: true, segments: ['Their waste products don’t harm the soil or the ', { blank: 32 }, ' on farmland.'] },
    { kind: 'note', bullet: true, segments: ['Their production requires less expense and little ', { blank: 33 }, ' compared to other animals.'] },
    { kind: 'note', bullet: true, segments: ['Some can be added to animal feed as a kind of ', { blank: 34 }, '.'] },
    { kind: 'subhead', text: 'Sourcing insects as a food supply: the wild versus farming' },
    { kind: 'text', text: 'If insects are taken from the wild:' },
    { kind: 'note', bullet: true, segments: ['it could lead to the loss of a species'] },
    { kind: 'note', bullet: true, segments: ['people may be harmed by the ', { blank: 35 }, ' they contain.'] },
    { kind: 'text', text: 'When insects are bred on insect farms:' },
    { kind: 'note', bullet: true, segments: ['this can supply the growing demand in the ', { blank: 36 }, ' of some countries'] },
    { kind: 'note', bullet: true, segments: ['the ', { blank: 37 }, ' of the insects may be affected.'] },
    { kind: 'subhead', text: 'The challenges facing insect farmers' },
    { kind: 'note', bullet: true, segments: ['Different kinds of insect require a different temperature to breed.'] },
    { kind: 'note', bullet: true, segments: ['Farmers and researchers are unclear how to deal with ', { blank: 38 }, '.'] },
    { kind: 'note', bullet: true, segments: ['Better tanks need to be developed so ', { blank: 39 }, ' is faster.'] },
    { kind: 'note', bullet: true, segments: ['Farmers need to develop a strategy for ', { blank: 40 }, ' the insects.'] },
  ] }],
  questions: [
    q(31, 'note-completion', 'They have a lot of protein and contain ___', 'vitamins', 'Vitamins are the nutrients mentioned alongside protein.'),
    q(32, 'note-completion', 'Waste products don’t harm the soil or the ___ on farmland', 'rivers', 'Rivers completes the second environmental feature that is not harmed.'),
    q(33, 'note-completion', 'Production requires less expense and little ___', 'space', 'Space is the resource required in small amounts.'),
    q(34, 'note-completion', 'Added to animal feed as a kind of ___', 'antibiotic', 'The singular antibiotic completes a kind of.'),
    q(35, 'note-completion', 'People may be harmed by the ___ they contain', 'bacteria', 'Bacteria are the harmful organisms that wild insects may contain.'),
    q(36, 'note-completion', 'Growing demand in the ___ of some countries', 'cities', 'Cities identifies where demand is growing.'),
    q(37, 'note-completion', 'The ___ of the insects may be affected', 'taste', 'Taste is the quality of farmed insects that may change.'),
    q(38, 'note-completion', 'Unclear how to deal with ___', 'disease', 'Disease names the problem facing farmers and researchers.'),
    q(39, 'note-completion', 'Better tanks so ___ is faster', 'cleaning', 'Cleaning is the process that better tanks should speed up.'),
    q(40, 'note-completion', 'Develop a strategy for ___ the insects', 'marketing', 'Marketing names the activity for which farmers need a strategy.'),
  ],
}

export const listeningFullTest18: IELTSTest = {
  id: 'ielts-listening-18', title: 'IELTS Listening Full Test 18',
  // Recording: 39:07.47; shared Listening submission follows its final end by 20 seconds.
  type: 'Academic', module: 'Listening', duration: 40, totalQuestions: 40,
  continuousAudioUrl: '/audio/ielts-listening/listening-full-test-18.mp3',
  sections: [part1, part2, part3, part4],
}
