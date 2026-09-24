import type { IELTSTest, Question, Section } from '../types/ieltsTypes'

// User-supplied questions/key, adapted from 49 to 40 questions (10 per part).
// Ordered original question numbers; see docs/LISTENING_FULL_TEST_19_SOURCE.md.
export const listeningTest19SourceNumbers = [
  1, 2, 3, 4, 5, 8, 9, 10, 12, 13,
  14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
  24, 25, 26, 27, 28, 29, 30, 31, 35, 36,
  37, 39, 40, 41, 42, 44, 45, 47, 48, 49,
] as const

function q(number: number, type: Question['type'], text: string, correctAnswer: string, explanation: string, options?: string[]): Question {
  return { id: `lt19-q${number}`, number, type, text, correctAnswer, strictAnswerMatch: true, explanation,
    location: `Part ${Math.ceil(number / 10)}, Question ${number} (original question ${listeningTest19SourceNumbers[number - 1]})`, options }
}

function instruction(part: number): string {
  return `Listen and answer questions ${part * 10 - 9} - ${part * 10}. This 40-question adaptation uses the original recording; spoken question numbers differ. Follow the questions on screen.`
}

const part1: Section = {
  id: 'lt19-part1', title: 'East Coast Employment Agency', partLabel: 'Part 1', partInstruction: instruction(1),
  groups: [
    { range: 'Questions 1 - 5', instruction: 'Complete the form below. Write ONE WORD AND/OR A NUMBER for each answer.', blocks: [
      { kind: 'title', text: 'East Coast Employment Agency registration form' },
      { kind: 'text', text: 'Contact person: Kevin Lock' },
      { kind: 'note', segments: ['Phone number: ', { blank: 1 }] },
      { kind: 'note', segments: ['Name of holiday park: ', { blank: 2 }, ' Holiday Park'] },
      { kind: 'note', segments: ['Address: 46 ', { blank: 3 }, ' Road'] },
      { kind: 'subhead', text: 'Business details:' },
      { kind: 'note', segments: ['has been operating for ', { blank: 4 }, ' years'] },
      { kind: 'note', segments: ['target market: ', { blank: 5 }] },
      { kind: 'text', text: 'holiday park has space for tents and twenty cabins' },
      { kind: 'text', text: 'located next to a beach' },
    ] },
    { range: 'Questions 6 - 10', instruction: 'Complete the table below. Write ONE WORD AND/OR A NUMBER for each answer.', blocks: [
      { kind: 'title', text: 'Jobs' },
      { kind: 'table', columns: ['Job', 'Duties', 'Other details'], rows: [
        [
          { segments: ['Manager'] },
          { segments: ['• welcoming guests (check-in and check-out)\n• dealing with phone calls and emails\n• responding to ', { blank: 6 }] },
          { segments: ['• full-time position (some night work)\n• free use of large ', { blank: 7 }, '\n• salary based on experience\n• starts in November'] },
        ],
        [
          { segments: ['Caretaker'] },
          { segments: ['• repairs and ', { blank: 8 }, '\n• maintaining the garden near the entrance'] },
          { segments: ['• part-time position (3–4 days a week)\n• starts in ', { blank: 9 }, '\n• starting pay: $', { blank: 10 }, ' per hour'] },
        ],
      ] },
    ] },
  ],
  questions: [
    q(1, 'note-completion', 'Phone number: ___', '0406774008 / 0406 774008 / 0406 774 008', 'The phone number is 0406774008. Keep the initial zero and all ten digits; spaces do not change the number.'),
    q(2, 'note-completion', 'Name of holiday park: ___ Holiday Park', 'Whitby', 'Whitby is the name of the park; Holiday Park is already printed.'),
    q(3, 'note-completion', 'Address: 46 ___ Road', 'Summer', 'Summer completes the street name. The house number and Road are already given.'),
    q(4, 'note-completion', 'Has been operating for ___ years', '16 / sixteen', 'The business has been operating for sixteen years.'),
    q(5, 'note-completion', 'Target market: ___', 'families', 'Families identifies the target market. Use the plural form in the supplied key.'),
    q(6, 'note-completion', 'Manager: responding to ___', 'comments', 'Comments completes the manager’s duty after responding to.'),
    q(7, 'note-completion', 'Manager: free use of large ___', 'caravan', 'The accommodation provided is a caravan.'),
    q(8, 'note-completion', 'Caretaker: repairs and ___', 'cleaning', 'Cleaning is the duty paired with repairs.'),
    q(9, 'note-completion', 'Caretaker: starts in ___', 'September', 'September is the caretaker’s starting month; November belongs to the manager’s position.'),
    q(10, 'note-completion', 'Caretaker: starting pay $___ per hour', '35.70 / 35.7', 'The hourly starting pay is $35.70. The dollar sign is already printed.'),
  ],
}

const desertQuestions = [
  { number: 11, prompt: 'What first attracted Naomi to deserts?', options: ['a beautiful sight she once saw', 'hearing about her husband’s travels', 'an exciting event which happened to her'], answer: 'A' },
  { number: 12, prompt: 'What does Naomi advise about travelling in the desert?', options: ['keep an open mind', 'take detailed maps', 'bring plenty of clothing'], answer: 'A' },
  { number: 13, prompt: 'Naomi thinks the best thing about travelling in the same group for a long time is', options: ['the chance to exchange life experiences', 'the fun company in the evenings', 'the feeling of trust which builds up'], answer: 'B' },
]
const activities = [
  { letter: 'A', text: 'stay in tented accommodation' }, { letter: 'B', text: 'go horseback riding' },
  { letter: 'C', text: 'go mountain climbing' }, { letter: 'D', text: 'take trips to see wildlife' },
]
const deserts = [
  { blank: 14, label: 'Atacama', answer: 'B' }, { blank: 15, label: 'Skeleton Coast', answer: 'C' },
  { blank: 16, label: 'Moroccan Sahara', answer: 'A' }, { blank: 17, label: 'Almeria', answer: 'B' },
  { blank: 18, label: 'Gobi', answer: 'D' }, { blank: 19, label: 'Thar', answer: 'D' },
  { blank: 20, label: 'Uluru-Kata', answer: 'A' },
]
const part2: Section = {
  id: 'lt19-part2', title: 'Desert Holidays', partLabel: 'Part 2', partInstruction: instruction(2),
  groups: [
    { range: 'Questions 11 - 13', instruction: 'Choose the correct letter, A, B or C.', blocks: [
      { kind: 'title', text: 'Desert Holidays' },
      ...desertQuestions.map(({ number, prompt, options }) => ({ kind: 'mcq' as const, blank: number, prompt, options })),
    ] },
    { range: 'Questions 14 - 20', instruction: 'What can you do on holiday in the following deserts? Write the correct letter, A, B, C or D, next to questions 14-20.', blocks: [
      { kind: 'grid', columns: activities.map(option => option.letter), options: activities, inputMode: true, rows: deserts.map(({ blank, label }) => ({ blank, label })) },
    ] },
  ],
  questions: [
    ...desertQuestions.map(({ number, prompt, options, answer }) => q(number, 'multiple-choice', prompt, answer, `${answer}: ${options[answer.charCodeAt(0) - 65]}.`, options)),
    ...deserts.map(({ blank, label, answer }) => q(blank, 'matching-information', label, answer, `${label}: ${activities.find(option => option.letter === answer)!.text}.`)),
  ],
}

const eucalyptusChoices = [
  { blanks: [21, 22], prompt: 'Which TWO factors about eucalyptus do the students decide to mention in their introduction?',
    options: ['They are descended from a very old group of trees', 'They are a famous national symbol', 'They spread around the country with the help of fire', 'They have few other species to compete against', 'They are quick to adapt to new environments'], answers: ['C', 'E'] },
  { blanks: [23, 24], prompt: 'Which TWO issues with eucalyptus plantations in Australia are the students worried about?',
    options: ['the small number of species currently grown', 'the amount of support from the government', 'the need to use the land for other purposes', 'the amount of maintenance they require', 'the resulting loss of large amounts of soil'], answers: ['B', 'D'] },
  { blanks: [25, 26], prompt: 'Which TWO points do the students want to make about future plans to use eucalyptus oil as jet fuel?',
    options: ['Faster growing trees would be used', 'Very little processing would be required', 'The oil would need to be combined with other substances', 'The production of oil would become more efficient', 'High quality fuel would be produced'], answers: ['A', 'D'] },
]
const reasons = [
  'its popularity around the world', 'the environmental problems it causes', 'its importance in dry areas',
  'its role in mineral exploration', 'the quality and uses of its timber', 'the reduction in its numbers',
  'its failure as a commercial product', 'its benefits for people’s health', 'the use of technology in its cultivation',
].map((text, index) => ({ letter: String.fromCharCode(65 + index), text }))
const trees = [
  { blank: 27, label: 'Salmon Gum', answer: 'D' }, { blank: 28, label: 'Tasmanian Blue Gum', answer: 'B' },
  { blank: 29, label: 'Blue Mallee', answer: 'I' }, { blank: 30, label: 'Mountain Ash', answer: 'E' },
]
const part3: Section = {
  id: 'lt19-part3', title: 'Eucalyptus Research', partLabel: 'Part 3', partInstruction: instruction(3),
  groups: [
    ...eucalyptusChoices.map(({ blanks, prompt, options }) => ({
      range: `Questions ${blanks[0]} and ${blanks[1]}`, instruction: 'Choose TWO letters, A-E.',
      blocks: [{ kind: 'multi-mcq' as const, blanks, prompt, options, selectionLimit: 2 }],
    })),
    { range: 'Questions 27 - 30', instruction: 'What reason is given by the students for the inclusion of each of the following species of eucalyptus trees in their presentation? Choose FOUR answers from the box and write the correct letter, A-I, next to questions 27-30.', blocks: [
      { kind: 'title', text: 'Reasons' },
      { kind: 'grid', columns: reasons.map(option => option.letter), options: reasons, inputMode: true, rows: trees.map(({ blank, label }) => ({ blank, label })) },
    ] },
  ],
  questions: [
    ...eucalyptusChoices.flatMap(({ blanks, prompt, options, answers }) => blanks.map((number, index) => q(number, 'multiple-choice', prompt, answers[index], `Choose ${answers.join(' and ')} in either order: ${answers.map(answer => options[answer.charCodeAt(0) - 65]).join('; ')}. Each distinct correct choice earns one mark.`, options))),
    ...trees.map(({ blank, label, answer }) => q(blank, 'matching-information', label, answer, `${label}: ${reasons.find(option => option.letter === answer)!.text}.`)),
  ],
}

const part4: Section = {
  id: 'lt19-part4', title: 'The conservation of wombats', partLabel: 'Part 4', partInstruction: instruction(4),
  groups: [{ range: 'Questions 31 - 40', instruction: 'Complete the notes below. Write ONE WORD ONLY for each answer.', blocks: [
    { kind: 'title', text: 'The conservation of wombats' },
    { kind: 'subhead', text: 'Background' },
    { kind: 'note', bullet: true, segments: ['They are marsupials, related to the koala'] },
    { kind: 'note', bullet: true, segments: ['They make burrows and tunnels underground'] },
    { kind: 'note', bullet: true, segments: ['They feed on plants, which they do frequently during the ', { blank: 31 }] },
    { kind: 'note', bullet: true, segments: ['They prefer to live in wood'] },
    { kind: 'subhead', text: 'Sydney Rewilding Project' },
    { kind: 'note', bullet: true, segments: ['Wombats are raised by humans in a reserve just outside the city'] },
    { kind: 'note', bullet: true, segments: ['The released wombats were rescued as babies'] },
    { kind: 'note', bullet: true, segments: ['Foxes were excluded to prevent ', { blank: 32 }, ' affecting the wombats'] },
    { kind: 'note', bullet: true, segments: ['The conservation area was divided into sections to monitor the impact of wombats on ', { blank: 33 }] },
    { kind: 'subhead', text: 'Results' },
    { kind: 'note', bullet: true, segments: ['92% of wombats established wild burrows within six months'] },
    { kind: 'note', bullet: true, segments: ['Burrowing increased the amount of wildlife in the area, especially ', { blank: 34 }] },
    { kind: 'note', bullet: true, segments: ['Near the city, a surprising problem for the wombats was the high ', { blank: 35 }] },
    { kind: 'note', bullet: true, segments: ['The wombats in the project were popular with the public thanks to the media'] },
    { kind: 'subhead', text: 'Northern Hairy-nosed Wombat Project (North Queensland)' },
    { kind: 'note', bullet: true, segments: ['The study focuses on an area of ', { blank: 36 }, ' in a national park'] },
    { kind: 'note', bullet: true, segments: ['Predator attacks have been reduced with the use of a ', { blank: 37 }] },
    { kind: 'note', bullet: true, segments: ['Land management software is used to control weeds'] },
    { kind: 'subhead', text: 'Results:' },
    { kind: 'note', bullet: true, segments: ['The wombats mainly burrow in soil that contains a lot of ', { blank: 38 }] },
    { kind: 'note', bullet: true, segments: ['New population monitoring method: using sticky tape to collect ', { blank: 39 }] },
    { kind: 'note', bullet: true, segments: ['To improve the breeding rate, scientists now supply extra ', { blank: 40 }] },
  ] }],
  questions: [
    q(31, 'note-completion', 'Feed on plants frequently during the ___', 'night', 'Night specifies when wombats frequently feed.'),
    q(32, 'note-completion', 'Foxes excluded to prevent ___ affecting wombats', 'illness', 'Illness is what excluding foxes aims to prevent.'),
    q(33, 'note-completion', 'Monitor the impact of wombats on ___', 'vegetation', 'Vegetation is what the project monitors for the impact of wombats.'),
    q(34, 'note-completion', 'More wildlife, especially ___', 'birds', 'The key identifies birds as the wildlife that particularly increased.'),
    q(35, 'note-completion', 'A surprising problem was the high ___', 'temperature', 'Temperature completes the problem described as high.'),
    q(36, 'note-completion', 'An area of ___ in a national park', 'forest', 'Forest is the type of area studied in the national park.'),
    q(37, 'note-completion', 'Predator attacks reduced using a ___', 'fence', 'A fence is the protection used to reduce predator attacks.'),
    q(38, 'note-completion', 'Soil containing a lot of ___', 'sand', 'Sand identifies the component of the soil used for burrows.'),
    q(39, 'note-completion', 'Sticky tape used to collect ___', 'fur', 'Fur is collected with sticky tape for population monitoring.'),
    q(40, 'note-completion', 'Scientists supply extra ___', 'water', 'Water is supplied to improve the breeding rate.'),
  ],
}

export const listeningFullTest19: IELTSTest = {
  id: 'ielts-listening-19', title: 'IELTS Listening Full Test 19',
  // Original recording: 40:33.91. Shared auto-submit follows its end by 20 seconds.
  type: 'Academic', module: 'Listening', duration: 41, totalQuestions: 40,
  continuousAudioUrl: '/audio/ielts-listening/listening-full-test-19.mp3',
  sections: [part1, part2, part3, part4],
}
