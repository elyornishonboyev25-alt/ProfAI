import type { IELTSTest, Question, Section } from '../types/ieltsTypes'

// IELTS Trainer 1 Academic, Listening Test 6 — Hostels / Selmore Public Library /
// John Chapman / Investigating Taste. The continuous recording and question set
// were supplied together and the answer key was verified before publication.
const AUDIO_URL = '/audio/ielts-listening/listening-full-test-5.mp3'
const LIBRARY_MAP_URL = '/images/ielts-listening/test5-selmore-public-library.jpg'

function q(
  number: number,
  type: Question['type'],
  text: string,
  correctAnswer: string | string[],
  options?: string[],
): Question {
  return { id: `lt5-q${number}`, number, type, text, correctAnswer, options }
}

const part1: Section = {
  id: 'lt5-part1',
  title: 'Hostels',
  partLabel: 'Part 1',
  partInstruction: 'Listen and answer questions 1 - 10.',
  groups: [{
    range: 'Questions 1 - 10',
    instruction: 'Complete the table below. Write ONE WORD AND/OR A NUMBER for each answer.',
    blocks: [
      { kind: 'title', text: 'HOSTELS' },
      { kind: 'subhead', text: 'Name: Hostelling International West End' },
      { kind: 'example', segments: ['Location: 10 minutes from downtown by ', 'bus'] },
      { kind: 'note', segments: ['Cost of double room: $50 per night but only $', { blank: 1, width: 'sm' }, ' for members'] },
      { kind: 'note', segments: ['Notes: Membership card offers discount on entry to ', { blank: 2, width: 'lg' }, '; Internet access costs $3 per ', { blank: 3, width: 'md' }] },
      { kind: 'space' },
      { kind: 'subhead', text: 'Second hostel' },
      { kind: 'note', segments: ['Name: ', { blank: 4, width: 'lg' }, ' Hostel'] },
      { kind: 'note', segments: ['Location: Near beach; two-minute walk to ', { blank: 5, width: 'lg' }] },
      { kind: 'note', segments: ['Cost of double room: $62 (Meals extra but only available in ', { blank: 6, width: 'md' }, ')'] },
      { kind: 'note', segments: ['Notes: Was built as a hotel in ', { blank: 7, width: 'md' }, '; Can hire ', { blank: 8, width: 'lg' }, ' from hostel'] },
      { kind: 'space' },
      { kind: 'subhead', text: 'Name: Backpackers Hostel' },
      { kind: 'note', segments: ['Location: In ', { blank: 9, width: 'lg' }, ' district'] },
      { kind: 'note', segments: ['Cost of double room: $45 plus $5 for breakfast'] },
      { kind: 'note', segments: ['Notes: A ', { blank: 10, width: 'lg' }, ' on every floor for guests to use'] },
    ],
  }],
  questions: [
    q(1, 'note-completion', 'Member price per night', '41'),
    q(2, 'note-completion', 'Membership card discount', 'museums'),
    q(3, 'note-completion', 'Internet access period for $3', 'hour'),
    q(4, 'note-completion', 'Name of the second hostel', 'Elliscoat'),
    q(5, 'note-completion', 'Two-minute walk from Elliscoat Hostel', 'ferry'),
    q(6, 'note-completion', 'Season when meals are available', 'summer'),
    q(7, 'note-completion', 'Year the hotel was built', '1887'),
    q(8, 'note-completion', 'Transport available to hire', 'scooter/scooters'),
    q(9, 'note-completion', 'Backpackers Hostel district', 'entertainment'),
    q(10, 'note-completion', 'Facility on every floor', 'kitchen'),
  ],
}

const libraryMapOptions = [
  'A) biography',
  'B) fiction',
  'C) magazines',
  'D) newspapers',
  'E) non-fiction',
  'F) photocopiers',
  'G) reference books',
  'H) study area',
]

const libraryMcqOptions: Record<number, string[]> = {
  16: ['show proof of their current address.', 'pay for a new membership card.', 'bring a passport or identity card into the library.'],
  17: ['It will be available after five days.', 'You can collect it a week later.', 'You will be contacted when it is available.'],
  18: ['some reference books', 'CD-ROMs', "children's DVDs"],
  19: ['Wednesday', 'Saturday', 'Sunday'],
  20: ['first floor.', 'second floor.', 'third floor.'],
}

const part2: Section = {
  id: 'lt5-part2',
  title: 'Selmore Public Library',
  partLabel: 'Part 2',
  partInstruction: 'Listen and answer questions 11 - 20.',
  visualAidUrl: LIBRARY_MAP_URL,
  groups: [{
    range: 'Questions 11 - 15',
    instruction: 'Label the map below. Choose FIVE answers from the box and write the correct letter, A-H, next to questions 11-15.',
    blocks: [
      { kind: 'image', src: LIBRARY_MAP_URL, alt: 'First-floor map of Selmore Public Library with locations 11 to 15.', caption: 'Selmore Public Library — first floor' },
      { kind: 'text', text: libraryMapOptions.join('     ') },
      { kind: 'grid', columns: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], inputMode: true, rows: [
        { blank: 11, label: 'Location 11' },
        { blank: 12, label: 'Location 12' },
        { blank: 13, label: 'Location 13' },
        { blank: 14, label: 'Location 14' },
        { blank: 15, label: 'Location 15' },
      ] },
    ],
  }, {
    range: 'Questions 16 - 20',
    instruction: 'Choose the correct letter, A, B or C.',
    blocks: [
      { kind: 'mcq', blank: 16, prompt: 'After two years, library members have to', options: libraryMcqOptions[16] },
      { kind: 'mcq', blank: 17, prompt: 'What happens if you reserve a book?', options: libraryMcqOptions[17] },
      { kind: 'mcq', blank: 18, prompt: 'Which materials can be borrowed for one week only?', options: libraryMcqOptions[18] },
      { kind: 'mcq', blank: 19, prompt: 'On which day does the library stay open later than it used to?', options: libraryMcqOptions[19] },
      { kind: 'mcq', blank: 20, prompt: 'Large bags should be left on the', options: libraryMcqOptions[20] },
    ],
  }],
  questions: [
    q(11, 'matching-information', 'Location 11 on the library map', 'B'),
    q(12, 'matching-information', 'Location 12 on the library map', 'H'),
    q(13, 'matching-information', 'Location 13 on the library map', 'C'),
    q(14, 'matching-information', 'Location 14 on the library map', 'E'),
    q(15, 'matching-information', 'Location 15 on the library map', 'A'),
    q(16, 'multiple-choice', 'After two years, library members have to', 'A', libraryMcqOptions[16]),
    q(17, 'multiple-choice', 'What happens if you reserve a book?', 'C', libraryMcqOptions[17]),
    q(18, 'multiple-choice', 'Which materials can be borrowed for one week only?', 'C', libraryMcqOptions[18]),
    q(19, 'multiple-choice', 'On which day does the library stay open later than it used to?', 'B', libraryMcqOptions[19]),
    q(20, 'multiple-choice', 'Large bags should be left on the', 'B', libraryMcqOptions[20]),
  ],
}

const johnChapmanMcqOptions: Record<number, string[]> = {
  21: ["He was Lee's childhood hero.", 'They wanted to talk about the USA.', 'He was relevant to the topic of their studies.'],
  22: ['on their laptops', 'on a handout', 'on a database'],
  23: ['apples grew in America before Europeans arrived.', 'the Native Americans had always eaten apples.', 'American apples were first bred in Europe.'],
  24: ['grafting techniques in ancient China.', 'the cultivation of apples in Kazakhstan.', 'the spread of apples along the Silk Route.'],
  25: ['on the department website', 'as a paper', 'as a poster'],
}

const part3: Section = {
  id: 'lt5-part3',
  title: 'Presentation about John Chapman',
  partLabel: 'Part 3',
  partInstruction: 'Listen and answer questions 21 - 30.',
  groups: [{
    range: 'Questions 21 - 25',
    instruction: 'Choose the correct letter, A, B or C.',
    blocks: [
      { kind: 'mcq', blank: 21, prompt: 'Why did Anita and Lee choose to talk about John Chapman?', options: johnChapmanMcqOptions[21] },
      { kind: 'mcq', blank: 22, prompt: 'Where did the students record their sources of information?', options: johnChapmanMcqOptions[22] },
      { kind: 'mcq', blank: 23, prompt: 'The tutor claims she does not understand whether', options: johnChapmanMcqOptions[23] },
      { kind: 'mcq', blank: 24, prompt: 'The tutor says the audience was particularly interested to hear about', options: johnChapmanMcqOptions[24] },
      { kind: 'mcq', blank: 25, prompt: 'How will Anita and Lee present their follow-up work?', options: johnChapmanMcqOptions[25] },
    ],
  }, {
    range: 'Questions 26 - 30',
    instruction: 'What do Lee and Anita agree about their presentation skills with their tutor? Write the correct letter, A, B or C, next to questions 26-30.',
    blocks: [
      { kind: 'text', text: 'A) excellent' },
      { kind: 'text', text: 'B) acceptable' },
      { kind: 'text', text: 'C) poor' },
      { kind: 'grid', columns: ['A', 'B', 'C'], inputMode: true, rows: [
        { blank: 26, label: 'use of equipment' },
        { blank: 27, label: 'handling software' },
        { blank: 28, label: 'timing of sections' },
        { blank: 29, label: 'design of handout' },
        { blank: 30, label: 'clarity of speech' },
      ] },
    ],
  }],
  questions: [
    q(21, 'multiple-choice', 'Why did Anita and Lee choose to talk about John Chapman?', 'C', johnChapmanMcqOptions[21]),
    q(22, 'multiple-choice', 'Where did the students record their sources of information?', 'B', johnChapmanMcqOptions[22]),
    q(23, 'multiple-choice', 'What the tutor did not understand', 'A', johnChapmanMcqOptions[23]),
    q(24, 'multiple-choice', 'What the audience was particularly interested to hear about', 'C', johnChapmanMcqOptions[24]),
    q(25, 'multiple-choice', 'How Anita and Lee will present their follow-up work', 'A', johnChapmanMcqOptions[25]),
    q(26, 'matching-information', 'Use of equipment', 'A'),
    q(27, 'matching-information', 'Handling software', 'B'),
    q(28, 'matching-information', 'Timing of sections', 'C'),
    q(29, 'matching-information', 'Design of handout', 'B'),
    q(30, 'matching-information', 'Clarity of speech', 'A'),
  ],
}

const part4: Section = {
  id: 'lt5-part4',
  title: 'Investigating Taste',
  partLabel: 'Part 4',
  partInstruction: 'Listen and answer questions 31 - 40.',
  groups: [{
    range: 'Questions 31 - 40',
    instruction: 'Complete the table below. Write NO MORE THAN ONE WORD for each answer.',
    blocks: [
      { kind: 'title', text: 'INVESTIGATING TASTE' },
      { kind: 'table', columns: ['Procedure', 'Result', 'Cause'], rows: [
        [
          { segments: ['more yellow added to green colour of ', { blank: 31, width: 'md' }] },
          { segments: ['subjects believed extra ', { blank: 32, width: 'md' }, ' added to drink'] },
          { segments: ['brain influenced by product presentation'] },
        ],
        [
          { segments: ['gum chewed until it is ', { blank: 33, width: 'md' }, ', then again with sugar'] },
          { segments: ['mint flavour ', { blank: 34, width: 'md' }] },
          { segments: ['sweetness necessary for mintiness'] },
        ],
        [
          { segments: ['same drink tasted cold and at room temperature'] },
          { segments: [{ blank: 35, width: 'md' }, ' drink seems sweeter'] },
          { segments: ['temperature affects sweetness'] },
        ],
        [
          { segments: ['crisps eaten in rooms which were ', { blank: 36, width: 'md' }] },
          { segments: ['with louder crunch, subjects believed crisps taste ', { blank: 37, width: 'md' }] },
          { segments: ['sound affects taste perceptions'] },
        ],
        [
          { segments: ['variety of cheese sauces prepared'] },
          { segments: ['subjects believed some sauces tasted less strong'] },
          { segments: [{ blank: 38, width: 'md' }, ' affects taste perceptions'] },
        ],
        [
          { segments: ['two different flavoured ', { blank: 39, width: 'md' }, ' tasted together'] },
          { segments: ['subjects still tasted ', { blank: 40, width: 'md' }, ' when no longer there'] },
          { segments: ["brain is filling the taste 'gap'"] },
        ],
      ] },
    ],
  }],
  questions: [
    q(31, 'note-completion', 'Green colour altered by adding yellow', 'cans'),
    q(32, 'note-completion', 'Extra flavour subjects believed was added', 'lime'),
    q(33, 'note-completion', 'State of the gum before adding sugar', 'tasteless'),
    q(34, 'note-completion', 'What happens to the mint flavour', 'returns'),
    q(35, 'note-completion', 'Temperature at which the drink seems sweeter', 'warm'),
    q(36, 'note-completion', 'Type of rooms used for the crisp experiment', 'soundproof/soundproofed'),
    q(37, 'note-completion', 'How the crisps seemed with a louder crunch', 'fresher'),
    q(38, 'note-completion', 'Property affecting taste perceptions', 'texture/thickness'),
    q(39, 'note-completion', 'Two differently flavoured items tasted together', 'liquids'),
    q(40, 'note-completion', 'Flavour still tasted after it was removed', 'strawberry'),
  ],
}

export const listeningFullTest5: IELTSTest = {
  id: 'ielts-listening-5',
  title: 'IELTS Listening Full Test 5',
  type: 'Academic',
  module: 'Listening',
  duration: 30,
  totalQuestions: 40,
  continuousAudioUrl: AUDIO_URL,
  sections: [part1, part2, part3, part4],
}
