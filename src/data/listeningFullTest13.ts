import type { IELTSTest, ListeningOption, Question, Section } from '../types/ieltsTypes'

// Questions and answer key: user-supplied screenshots.
// Duplicate check and original 57474 recording: docs/LISTENING_FULL_TEST_13_SOURCE.md.
function q(number: number, type: Question['type'], text: string, correctAnswer: string, explanation: string, options?: string[]): Question {
  return { id: `lt13-q${number}`, number, type, text, correctAnswer, explanation, location: `Part ${Math.ceil(number / 10)}, Question ${number}`, options }
}

const part1: Section = {
  id: 'lt13-part1', title: 'Oz Campervans - Customer Quote Form', partLabel: 'Part 1',
  partInstruction: 'Listen and answer questions 1 - 10.',
  groups: [{ range: 'Questions 1 - 10', instruction: 'Complete the form below. Write ONE WORD AND/OR A NUMBER for each answer.', blocks: [
    { kind: 'title', text: 'Oz Campervans - Customer Quote Form' },
    { kind: 'subhead', text: 'Contact Details' },
    { kind: 'example', segments: ['Name: Caroline ', 'Smith'] },
    { kind: 'text', text: 'Address: 14 Grey St, Forest Hill' },
    { kind: 'note', segments: ['Tel: ', { blank: 1 }] },
    { kind: 'text', text: 'Email: caroline@easymail.com' },
    { kind: 'note', segments: ['NB: Send written quote by ', { blank: 2 }] },
    { kind: 'subhead', text: 'Booking Information' },
    { kind: 'text', text: 'Number of people in group: three' },
    { kind: 'text', text: 'Type of campervan selected:' },
    { kind: 'note', segments: ["'The Explorer' (need to supply an extra ", { blank: 3 }, ')'] },
    { kind: 'note', segments: ['Price: $', { blank: 4 }, ' per day'] },
    { kind: 'note', segments: ['NB: Price includes all bedding and ', { blank: 5 }, ' equipment'] },
    { kind: 'note', segments: ['Optional extras selected: a ', { blank: 6 }, ' and a ', { blank: 7 }] },
    { kind: 'text', text: 'Driving to: Huonville in Tasmania' },
    { kind: 'note', segments: ['Pickup from: the ', { blank: 8 }, ' branch in Hobart'] },
    { kind: 'text', text: 'Length of hire: 2 weeks' },
    { kind: 'subhead', text: 'Insurance requirements:' },
    { kind: 'note', bullet: true, segments: ['Youngest driver (Caroline): ', { blank: 9 }, ' years old'] },
    { kind: 'note', bullet: true, segments: ["Drivers' licences issued in: ", { blank: 10 }] },
  ] }],
  questions: [
    q(1, 'note-completion', 'Telephone number', '0491570156', 'The contact telephone number is 0491570156. Keep the initial zero.'),
    q(2, 'note-completion', 'Send written quote by ___', 'post', 'The written quote should be sent by post.'),
    q(3, 'note-completion', 'The Explorer: need to supply an extra ___', 'bed', 'An extra bed is required for the selected campervan.'),
    q(4, 'note-completion', 'Price: $___ per day', '39', 'The daily hire price is $39. The dollar sign is already supplied.'),
    q(5, 'note-completion', 'Price includes all bedding and ___ equipment', 'kitchen', 'Kitchen equipment is included along with the bedding.'),
    q(6, 'note-completion', 'First optional extra selected', 'heater', 'The first selected optional extra is a heater.'),
    q(7, 'note-completion', 'Second optional extra selected', 'microwave', 'The second selected optional extra is a microwave.'),
    q(8, 'note-completion', 'Pickup from the ___ branch in Hobart', 'airport', 'The booking specifies the airport branch in Hobart.'),
    q(9, 'note-completion', 'Youngest driver (Caroline): ___ years old', '49', 'Caroline, the youngest driver, is 49 years old.'),
    q(10, 'note-completion', "Drivers' licences issued in ___", 'Australia', 'The licences were issued in Australia.'),
  ],
}

const sportsQuestions = [
  { number: 11, prompt: 'The sports centre has just opened a new', options: ['dance studio.', 'swimming pool.', 'cafe.'], answer: 'A', explanation: 'The newly opened facility is the dance studio.' },
  { number: 12, prompt: 'The sports facilities are used most', options: ['at weekends.', 'on weekday evenings.', 'during the day from Monday to Friday.'], answer: 'B', explanation: 'Weekday evenings are the busiest time for the facilities.' },
  { number: 13, prompt: 'Classes are cheaper if you pay', options: ['in cash.', 'for several in advance.', 'by credit card.'], answer: 'B', explanation: 'Paying for several classes in advance gives the lower price.' },
  { number: 14, prompt: 'The sports centre recently won an award for', options: ['the range of training in different sports.', 'the amount of information on its website.', 'the quality of the advice offered by its instructors.'], answer: 'C', explanation: 'The award recognises the quality of advice from the instructors.' },
  { number: 15, prompt: 'Today the sports department is offering', options: ['a free hour with a personal trainer.', 'a free ticket to the cup final.', 'free membership for 20 people.'], answer: 'A', explanation: 'The offer is a free hour with a personal trainer.' },
  { number: 16, prompt: 'According to the speaker, why do many people stop exercising?', options: ['Their friends do not share the experience with them.', 'Their job or studies take up too much of their time.', 'They cannot see any results.'], answer: 'A', explanation: 'The identified reason is that friends do not share the exercise experience.' },
]
const benefitOptions: ListeningOption[] = [
  { letter: 'A', text: 'better reaction times' }, { letter: 'B', text: 'improved concentration' },
  { letter: 'C', text: 'increased arm power' }, { letter: 'D', text: 'increased leg power' },
  { letter: 'E', text: 'increased speed' }, { letter: 'F', text: 'reduced stress' },
]
const part2: Section = {
  id: 'lt13-part2', title: 'Bexter Sports Centre', partLabel: 'Part 2',
  partInstruction: 'Listen and answer questions 11 - 20.',
  groups: [
    { range: 'Questions 11 - 16', instruction: 'Choose the correct letter, A, B or C.', blocks: [
      { kind: 'title', text: 'Bexter Sports Centre' },
      ...sportsQuestions.map(({ number, prompt, options }) => ({ kind: 'mcq' as const, blank: number, prompt, options })),
    ] },
    { range: 'Questions 17 - 20', instruction: 'Which benefit does each of the following sports activities bring? Choose FOUR answers from the box and write the correct letter, A-F, next to questions 17-20.', blocks: [
      { kind: 'subhead', text: 'Benefits' },
      { kind: 'grid', columns: benefitOptions.map(option => option.letter), options: benefitOptions, inputMode: true, rows: [
        { blank: 17, label: 'general training' }, { blank: 18, label: 'weight training' },
        { blank: 19, label: 'aerobics class' }, { blank: 20, label: 'squash' },
      ] },
    ] },
  ],
  questions: [
    ...sportsQuestions.map(({ number, prompt, options, answer, explanation }) => q(number, 'multiple-choice', prompt, answer, explanation, options)),
    q(17, 'matching-information', 'general training', 'D', 'General training brings increased leg power (D).'),
    q(18, 'matching-information', 'weight training', 'B', 'Weight training improves concentration (B).'),
    q(19, 'matching-information', 'aerobics class', 'F', 'The aerobics class reduces stress (F).'),
    q(20, 'matching-information', 'squash', 'A', 'Squash improves reaction times (A).'),
  ],
}

const miteOptions: ListeningOption[] = [
  { letter: 'A', text: 'the blood' }, { letter: 'B', text: 'a flower' },
  { letter: 'C', text: 'the hive' }, { letter: 'D', text: 'the honey' },
  { letter: 'E', text: 'a honeycomb cell' }, { letter: 'F', text: 'the queen bee' },
  { letter: 'G', text: 'a virus' },
]
const problemOptions: ListeningOption[] = [
  { letter: 'A', text: 'could introduce pests' }, { letter: 'B', text: 'needs a warm climate' },
  { letter: 'C', text: 'not much is known about it' }, { letter: 'D', text: 'numbers are too few to help farmers' },
  { letter: 'E', text: 'spreads weeds' }, { letter: 'F', text: 'too aggressive' },
  { letter: 'G', text: 'unable to produce honey' },
]
const part3: Section = {
  id: 'lt13-part3', title: 'How the Varroa mite attacks', partLabel: 'Part 3',
  partInstruction: 'Listen and answer questions 21 - 30.',
  groups: [
    { range: 'Questions 21 - 25', instruction: 'Complete the flow-chart below. Choose FIVE answers from the box and write the correct letter, A-G, next to questions 21-25.', blocks: [
      { kind: 'grid', columns: miteOptions.map(option => option.letter), options: miteOptions, inputMode: true, rows: [] },
      { kind: 'title', text: 'How the Varroa mite attacks' },
      { kind: 'flow', boxes: [
        { segments: ['The mite moves from the bee to ', { blank: 21, width: 'sm' }, '.'] },
        { segments: ['The mite travels to ', { blank: 22, width: 'sm' }, ' on a new host.'] },
        { segments: ['Inside, the mite enters the honeycomb cell.'] },
        { segments: ['The mite uses ', { blank: 23, width: 'sm' }, ' to hide its smell.'] },
        { segments: ['The mite feeds on ', { blank: 24, width: 'sm' }, ' of the bee larva.'] },
        { segments: ['The mite reproduces and moves on.'] },
        { segments: ['The bee is left weakened and with ', { blank: 25, width: 'sm' }, '.'] },
      ] },
    ] },
    { range: 'Questions 26 - 30', instruction: 'What problem do the speakers identify with each of the following types of bee? Choose FIVE answers from the box and write the correct letter, A-G, next to questions 26-30.', blocks: [
      { kind: 'subhead', text: 'Problems' },
      { kind: 'grid', columns: problemOptions.map(option => option.letter), options: problemOptions, inputMode: true, rows: [
        { blank: 26, label: 'European Bumblebee' }, { blank: 27, label: 'Blue Banded Bee' },
        { blank: 28, label: 'Africanised Bee' }, { blank: 29, label: 'Australian Stingless Bee' },
        { blank: 30, label: 'Canadian Leafcutter Bee' },
      ] },
    ] },
  ],
  questions: [
    q(21, 'matching-information', 'The mite moves from the bee to ___', 'B', 'The first destination is a flower (B). Enter the option letter.'),
    q(22, 'matching-information', 'The mite travels to ___ on a new host', 'C', 'The new host carries the mite to the hive (C).'),
    q(23, 'matching-information', 'The mite uses ___ to hide its smell', 'D', 'The mite uses the honey to hide its smell (D).'),
    q(24, 'matching-information', 'The mite feeds on ___ of the bee larva', 'A', 'The flow-chart identifies the blood as its food (A).'),
    q(25, 'matching-information', 'The bee is left weakened and with ___', 'G', 'The final stage leaves the bee with a virus (G).'),
    q(26, 'matching-information', 'European Bumblebee', 'E', 'The identified problem is that this bee spreads weeds (E).'),
    q(27, 'matching-information', 'Blue Banded Bee', 'C', 'Not much is known about this type of bee (C).'),
    q(28, 'matching-information', 'Africanised Bee', 'F', 'This type of bee is too aggressive (F).'),
    q(29, 'matching-information', 'Australian Stingless Bee', 'B', 'This bee needs a warm climate (B).'),
    q(30, 'matching-information', 'Canadian Leafcutter Bee', 'D', 'Its numbers are too few to help farmers (D).'),
  ],
}

const part4: Section = {
  id: 'lt13-part4', title: 'Using natural building materials', partLabel: 'Part 4',
  partInstruction: 'Listen and answer questions 31 - 40.',
  groups: [{ range: 'Questions 31 - 40', instruction: 'Complete the notes below. Write ONE WORD ONLY for each answer.', blocks: [
    { kind: 'title', text: 'Using natural building materials' },
    { kind: 'note', segments: ['With all methods of building using natural materials, a good ', { blank: 31 }, ' is needed.'] },
    { kind: 'subhead', text: 'Rammed earth' },
    { kind: 'text', text: '• A framework made from wood filled with soil' },
    { kind: 'note', bullet: true, segments: ['The best soil has large quantities of ', { blank: 32 }] },
    { kind: 'subhead', text: 'Adobe (mud brick)' },
    { kind: 'note', bullet: true, segments: ['The most suitable soil for adobe bricks contains lots of ', { blank: 33 }] },
    { kind: 'text', text: '• Advantages' },
    { kind: 'note', bullet: true, segments: ['cheap and ', { blank: 34 }] },
    { kind: 'note', bullet: true, segments: ['little ', { blank: 35 }, ' is needed for brick-making'] },
    { kind: 'text', text: '• Disadvantage' },
    { kind: 'note', bullet: true, segments: ['a lot of water, time and ', { blank: 36 }, ' are required'] },
    { kind: 'subhead', text: 'Straw bales' },
    { kind: 'text', text: '• Bales — large rectangular blocks of straw' },
    { kind: 'note', bullet: true, segments: ['A ', { blank: 37 }, ' needs to be constructed first'] },
    { kind: 'note', bullet: true, segments: ['The bales are covered with plaster for protection against ', { blank: 38 }] },
    { kind: 'text', text: '• Advantage: the bales act as efficient insulation' },
    { kind: 'subhead', text: 'Bamboo' },
    { kind: 'text', text: '• This is a versatile material' },
    { kind: 'text', text: '• Advantage' },
    { kind: 'note', bullet: true, segments: ['the shape of the bamboo stalks gives them ', { blank: 39 }] },
    { kind: 'text', text: '• Disadvantages' },
    { kind: 'text', text: '• not widely available' },
    { kind: 'note', bullet: true, segments: ['risk of ', { blank: 40 }] },
  ] }],
  questions: [
    q(31, 'note-completion', 'A good ___ is needed for all methods', 'foundation', 'All the natural building methods need a good foundation.'),
    q(32, 'note-completion', 'Rammed earth: best soil has large quantities of ___', 'sand', 'Sand is the required component of the soil for rammed earth.'),
    q(33, 'note-completion', 'Adobe: most suitable soil contains lots of ___', 'clay', 'The soil used for adobe bricks should contain lots of clay.'),
    q(34, 'note-completion', 'Adobe: cheap and ___', 'convenient', 'Convenient completes the pair of advantages: cheap and convenient.'),
    q(35, 'note-completion', 'Adobe: little ___ is needed for brick-making', 'training', 'Little training is needed to make these bricks.'),
    q(36, 'note-completion', 'Adobe: a lot of water, time and ___ are required', 'labour / labor', 'Labour is the third resource required. Both British and American spellings are accepted.'),
    q(37, 'note-completion', 'Straw bales: a ___ needs to be constructed first', 'roof', 'A roof must be constructed before building the straw-bale walls.'),
    q(38, 'note-completion', 'Plaster protects the bales against ___', 'insects', 'The plaster protects the straw bales against insects.'),
    q(39, 'note-completion', 'The shape of bamboo stalks gives them ___', 'strength', 'The shape of the stalks gives bamboo its strength.'),
    q(40, 'note-completion', 'Bamboo: risk of ___', 'fire', 'Fire is the risk identified for bamboo.'),
  ],
}

export const listeningFullTest13: IELTSTest = {
  id: 'ielts-listening-13', title: 'IELTS Listening Full Test 13',
  type: 'Academic', module: 'Listening', duration: 30, totalQuestions: 40,
  continuousAudioUrl: '/audio/ielts-listening/listening-full-test-13.mp3',
  sections: [part1, part2, part3, part4],
}
