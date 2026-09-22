import type { IELTSTest, ListeningOption, Question, Section } from '../types/ieltsTypes'

// Questions and answer key: user-supplied 53834 copy.pdf screenshots.
// Audio provenance and duplicate review: docs/LISTENING_FULL_TEST_11_SOURCE.md.
const AUDIO_URL = '/audio/ielts-listening/listening-full-test-11.mp3'

function q(number: number, type: Question['type'], text: string, correctAnswer: string, options?: string[]): Question {
  return { id: `lt11-q${number}`, number, type, text, correctAnswer, options }
}

const part1: Section = {
  id: 'lt11-part1',
  title: 'Ohope Holiday Park: Accommodation',
  partLabel: 'Part 1',
  partInstruction: 'Listen and answer questions 1 - 10.',
  groups: [
    {
      range: 'Questions 1 - 5',
      instruction: 'Complete the table below. Write ONE WORD AND/OR A NUMBER for each answer.',
      blocks: [
        { kind: 'title', text: 'Ohope Holiday Park: Accommodation' },
        { kind: 'table', columns: ['Type of cabin', 'Location', 'Facilities', 'Cost and charges'], rows: [
          [
            { segments: ['Basic'] },
            { segments: ['next to the pool'] },
            { segments: ['kitchen has a fridge and a ', { blank: 1 }] },
            { segments: ['$35 per night'] },
          ],
          [
            { segments: ['Standard'] },
            { segments: ['close to ', { blank: 2 }] },
            { segments: ['fully-equipped kitchen and a ', { blank: 3 }] },
            { segments: ['$55 per night'] },
          ],
          [
            { segments: ['Standard Plus'] },
            { segments: ['facing the ', { blank: 4 }] },
            { segments: ['comes with own spa'] },
            { segments: ['discount of ', { blank: 5, width: 'sm' }, '% for bookings over ten nights'] },
          ],
        ] },
      ],
    },
    {
      range: 'Questions 6 - 10',
      instruction: 'Complete the notes below. Write ONE WORD ONLY for each answer.',
      blocks: [
        { kind: 'title', text: 'General information about the holiday park and the Ohope area' },
        { kind: 'note', segments: ['The children can play ', { blank: 6 }, ' for free.'] },
        { kind: 'note', segments: ['It’s possible to hire equipment for ', { blank: 7 }, ' for an afternoon.'] },
        { kind: 'note', segments: ['The children could visit the local ', { blank: 8 }, ' on Saturday and Sunday.'] },
        { kind: 'note', segments: ['There are guided tours of the ', { blank: 9 }, ' every evening to see the birds.'] },
        { kind: 'note', segments: ['Contact ', { blank: 10 }, ' to confirm the booking.'] },
      ],
    },
  ],
  questions: [
    q(1, 'note-completion', 'Basic cabin: kitchen has a fridge and a ___', 'microwave'),
    q(2, 'note-completion', 'Standard cabin: close to ___', 'reception'),
    q(3, 'note-completion', 'Standard cabin: fully-equipped kitchen and a ___', 'shower'),
    q(4, 'note-completion', 'Standard Plus cabin: facing the ___', 'lake'),
    q(5, 'note-completion', 'Standard Plus: percentage discount for bookings over ten nights', '18 / eighteen'),
    q(6, 'note-completion', 'The children can play ___ for free', 'tennis'),
    q(7, 'note-completion', 'Equipment available to hire for an afternoon', 'fishing'),
    q(8, 'note-completion', 'Local place the children could visit at the weekend', 'farm'),
    q(9, 'note-completion', 'Location of evening guided bird tours', 'forest'),
    q(10, 'note-completion', 'Contact to confirm the booking', 'Arataki'),
  ],
}

const routineOptions = {
  11: ['5.30 a.m.', '6.30 a.m.', '7.30 a.m.'],
  12: ['clean the horses.', 'organize her son.', 'do farm work.'],
}
const activityOptions: ListeningOption[] = [
  { letter: 'A', text: 'She really likes it.' },
  { letter: 'B', text: 'She doesn’t mind it.' },
  { letter: 'C', text: 'She hates it.' },
]
const improvementOptions = [
  'giving special training.',
  'making fund-raising more effective.',
  'opening more RDA centres.',
  'providing more helpers.',
  'recognizing difficulties of disabled riders.',
]
const part2: Section = {
  id: 'lt11-part2',
  title: 'Riding for the Disabled',
  partLabel: 'Part 2',
  partInstruction: 'Listen and answer questions 11 - 20.',
  groups: [
    { range: 'Questions 11 and 12', instruction: 'Choose the correct letter, A, B or C.', blocks: [
      { kind: 'mcq', blank: 11, prompt: 'Joan normally gets up at', options: routineOptions[11] },
      { kind: 'mcq', blank: 12, prompt: 'Joan’s first task of the day is to', options: routineOptions[12] },
    ] },
    { range: 'Questions 13 and 14', instruction: 'Complete the summary below. Write ONE WORD AND/OR A NUMBER for each answer.', blocks: [
      { kind: 'note', segments: ['Joan’s official title in Riding for the Disabled (RDA) is chairperson. In her local district there are at present twenty-two riders and ', { blank: 13 }, ' helpers on the volunteer list, out of whom ', { blank: 14 }, ' come regularly.'] },
    ] },
    { range: 'Questions 15 - 18', instruction: 'How much does Joan like doing each of the following activities? Write the correct letter, A, B or C, next to questions 15 - 18.', blocks: [
      { kind: 'subhead', text: 'Activities' },
      { kind: 'grid', columns: ['A', 'B', 'C'], inputMode: true, options: activityOptions, rows: [
        { blank: 15, label: 'correspondence' },
        { blank: 16, label: 'fund-raising' },
        { blank: 17, label: 'calling riders' },
        { blank: 18, label: 'organizing accounts' },
      ] },
    ] },
    { range: 'Questions 19 and 20', instruction: 'Choose TWO letters, A-E.', blocks: [
      { kind: 'multi-mcq', blanks: [19, 20], prompt: 'Joan says the TWO ways the RDA needs to improve are by', options: improvementOptions, selectionLimit: 2 },
    ] },
  ],
  questions: [
    q(11, 'multiple-choice', 'Joan normally gets up at', 'B', routineOptions[11]),
    q(12, 'multiple-choice', 'Joan’s first task of the day', 'B', routineOptions[12]),
    q(13, 'summary-completion', 'Number of helpers on the volunteer list', '40 / forty'),
    q(14, 'summary-completion', 'Number of helpers who come regularly', '25'),
    q(15, 'matching-information', 'Joan’s attitude to correspondence', 'B', activityOptions.map(({ text }) => text)),
    q(16, 'matching-information', 'Joan’s attitude to fund-raising', 'C', activityOptions.map(({ text }) => text)),
    q(17, 'matching-information', 'Joan’s attitude to calling riders', 'A', activityOptions.map(({ text }) => text)),
    q(18, 'matching-information', 'Joan’s attitude to organizing accounts', 'C', activityOptions.map(({ text }) => text)),
    q(19, 'multiple-choice', 'One of TWO ways the RDA needs to improve', 'B / E', improvementOptions),
    q(20, 'multiple-choice', 'The other way the RDA needs to improve', 'B / E', improvementOptions),
  ],
}

const outdoorReasons = [
  'concerns about traffic',
  'limited outdoor play facilities',
  'increased time spent online',
  'preference for indoor play',
  'reduction in free time',
]
const assignmentOptions = [
  'how it helps children to evaluate risk',
  'how it broadens their horizons',
  'how it aids children’s muscular development',
  'how it improves children’s digestion',
  'how it teaches children about the environment',
]
const playChanges = [
  'They are less dangerous.',
  'They involve fewer children.',
  'They usually last a shorter time.',
  'They include fewer made-up games.',
  'They involve fewer chasing games.',
]
const researchOptions = {
  27: ['it affects family relationships.', 'it leads to health problems later in life.', 'it makes childhood less enjoyable.'],
  28: ['revise their aims', 'spend more money on it', 'listen to the views of parents'],
  29: ['They tend not to be allowed on farmland.', 'They receive more supervision out of doors.', 'They spend more time outdoors than city children.'],
  30: ['Its findings are inconclusive.', 'It is too old to be useful.', 'Its focus is limited.'],
}
const part3: Section = {
  id: 'lt11-part3',
  title: 'Children’s outdoor play',
  partLabel: 'Part 3',
  partInstruction: 'Listen and answer questions 21 - 30.',
  groups: [
    { range: 'Questions 21 and 22', instruction: 'Choose TWO letters, A-E.', blocks: [
      { kind: 'multi-mcq', blanks: [21, 22], prompt: 'What do the speakers agree are the TWO reasons why children play outdoors less now than in the past?', options: outdoorReasons, selectionLimit: 2 },
    ] },
    { range: 'Questions 23 and 24', instruction: 'Choose TWO letters, A-E.', blocks: [
      { kind: 'multi-mcq', blanks: [23, 24], prompt: 'In his assignment, which TWO aspects of outdoor play does Ravi want to focus on?', options: assignmentOptions, selectionLimit: 2 },
    ] },
    { range: 'Questions 25 and 26', instruction: 'Choose TWO letters, A-E.', blocks: [
      { kind: 'multi-mcq', blanks: [25, 26], prompt: 'According to Ravi, in which TWO ways are children’s periods of outdoor play now different from a generation ago?', options: playChanges, selectionLimit: 2 },
    ] },
    { range: 'Questions 27 - 30', instruction: 'Choose the correct letter, A, B or C.', blocks: [
      { kind: 'mcq', blank: 27, prompt: 'Ravi thinks parents should be more concerned about the decline of outdoor play because', options: researchOptions[27] },
      { kind: 'mcq', blank: 28, prompt: 'What does Ravi say that schools should do with regard to outdoor play?', options: researchOptions[28] },
      { kind: 'mcq', blank: 29, prompt: 'What did Smith and Barker say about children in rural areas?', options: researchOptions[29] },
      { kind: 'mcq', blank: 30, prompt: 'What problem does Dr Chang highlight about Smith and Barker’s research?', options: researchOptions[30] },
    ] },
  ],
  questions: [
    q(21, 'multiple-choice', 'One of TWO reasons children play outdoors less now', 'A / E', outdoorReasons),
    q(22, 'multiple-choice', 'The other reason children play outdoors less now', 'A / E', outdoorReasons),
    q(23, 'multiple-choice', 'One of TWO aspects Ravi wants to focus on', 'A / D', assignmentOptions),
    q(24, 'multiple-choice', 'The other aspect Ravi wants to focus on', 'A / D', assignmentOptions),
    q(25, 'multiple-choice', 'One of TWO changes to children’s periods of outdoor play', 'C / D', playChanges),
    q(26, 'multiple-choice', 'The other change to children’s periods of outdoor play', 'C / D', playChanges),
    q(27, 'multiple-choice', 'Why parents should be more concerned about the decline of outdoor play', 'B', researchOptions[27]),
    q(28, 'multiple-choice', 'What schools should do about outdoor play', 'A', researchOptions[28]),
    q(29, 'multiple-choice', 'Smith and Barker’s finding about children in rural areas', 'A', researchOptions[29]),
    q(30, 'multiple-choice', 'Problem with Smith and Barker’s research', 'C', researchOptions[30]),
  ],
}

const part4: Section = {
  id: 'lt11-part4',
  title: 'Field trial – heat pump technology',
  partLabel: 'Part 4',
  partInstruction: 'Listen and answer questions 31 - 40.',
  groups: [{ range: 'Questions 31 - 40', instruction: 'Complete the notes below. Write ONE WORD ONLY for each answer.', blocks: [
    { kind: 'title', text: 'Field trial – heat pump technology' },
    { kind: 'subhead', text: 'Background' },
    { kind: 'note', segments: ['Aim in UK is to reduce carbon emissions from energy consumed in ', { blank: 31 }, ' by approximately 25%'] },
    { kind: 'note', segments: ['Most popular ‘green’ energy: ', { blank: 32 }] },
    { kind: 'note', segments: ['Little investment in heat pumps in UK due to lack of ', { blank: 33 }, ' in using them'] },
    { kind: 'subhead', text: 'What is a heat pump?' },
    { kind: 'note', segments: ['Heat pumps serve the same purpose as a ', { blank: 34 }] },
    { kind: 'note', segments: ['Most heat pumps get heat from the earth or the ', { blank: 35 }] },
    { kind: 'note', segments: ['Water is heated to 60°C to destroy ', { blank: 36 }] },
    { kind: 'subhead', text: 'The field trial' },
    { kind: 'text', text: '83 sites across the UK' },
    { kind: 'note', segments: ['Central heating systems monitored: ', { blank: 37 }, ' and under-floor heating'] },
    { kind: 'subhead', text: 'Key conclusions' },
    { kind: 'note', bullet: true, segments: ['Installation: need to provide improved ', { blank: 38 }, ' in pump-fitting technique'] },
    { kind: 'note', bullet: true, segments: [{ blank: 39 }, ' designs performed best'] },
    { kind: 'text', text: '• Customers needed to be told about regulating the controls' },
    { kind: 'note', bullet: true, segments: ['Need for a ', { blank: 40 }, ' to co-ordinate the installation'] },
  ] }],
  questions: [
    q(31, 'note-completion', 'Where the energy is consumed', 'homes'),
    q(32, 'note-completion', 'Most popular green energy', 'solar'),
    q(33, 'note-completion', 'What is lacking in using heat pumps in the UK', 'experience'),
    q(34, 'note-completion', 'What serves the same purpose as a heat pump', 'boiler'),
    q(35, 'note-completion', 'Source of heat besides the earth', 'air'),
    q(36, 'note-completion', 'What heating water to 60°C destroys', 'bacteria'),
    q(37, 'note-completion', 'Central heating systems monitored alongside under-floor heating', 'radiators'),
    q(38, 'note-completion', 'What needs improving in pump-fitting technique', 'training'),
    q(39, 'note-completion', 'Designs that performed best', 'simple'),
    q(40, 'note-completion', 'Who should co-ordinate installation', 'supervisor'),
  ],
}

export const listeningFullTest11: IELTSTest = {
  id: 'ielts-listening-11',
  title: 'IELTS Listening Full Test 11',
  type: 'Academic',
  module: 'Listening',
  duration: 30,
  totalQuestions: 40,
  continuousAudioUrl: AUDIO_URL,
  sections: [part1, part2, part3, part4],
}
