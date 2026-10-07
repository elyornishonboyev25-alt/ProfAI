import type { IELTSTest, Question, Section } from '../types/ieltsTypes'

// IELTS Listening Full Test 1 - retained original Cycling Holiday paper.
const AUDIO_URL = '/audio/ielts-listening/test1-part1.mp3'

function q(
  number: number,
  type: Question['type'],
  text: string,
  correctAnswer: string | string[],
  options?: string[],
): Question {
  return { id: `ls1-q${number}`, number, type, text, correctAnswer, options }
}

const part1: Section = {
  id: 'ielts-listening-test1-part1',
  title: 'Cycling Holiday in Austria',
  partLabel: 'Part 1',
  partInstruction: 'Listen and answer questions 1 - 10.',
  groups: [{
    range: 'Questions 1 - 10',
    instruction: 'Complete the notes below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.',
    blocks: [
      { kind: 'title', text: 'Cycling holiday in Austria' },
      { kind: 'example', segments: ['Most suitable holiday lasts ', '10 days'] },
      { kind: 'space' },
      { kind: 'note', segments: ['Holiday begins on ', { blank: 1, width: 'md' }] },
      { kind: 'note', segments: ['No more than ', { blank: 2, width: 'sm' }, ' people in cycling group.'] },
      { kind: 'note', segments: ['Each day, group cycles ', { blank: 3, width: 'md' }, ' on average.'] },
      { kind: 'note', segments: ['Some of the hotels have a ', { blank: 4, width: 'lg' }] },
      { kind: 'note', segments: ['Holiday costs £ ', { blank: 5, width: 'sm' }, ' per person without flights.'] },
      { kind: 'note', segments: ['All food included except ', { blank: 6, width: 'md' }] },
      { kind: 'note', segments: ['Essential to bring a ', { blank: 7, width: 'md' }] },
      { kind: 'note', segments: ['Discount possible on equipment at www. ', { blank: 8, width: 'md' }, '.com'] },
      { kind: 'note', segments: ['Possible that the ', { blank: 9, width: 'md' }, ' may change.'] },
      { kind: 'note', segments: ['Guided tour of a ', { blank: 10, width: 'md' }, ' is arranged.'] },
    ],
  }],
  questions: [
    q(1, 'note-completion', 'Holiday begins on', ['17th April', '17 April', 'April 17', 'April 17th']),
    q(2, 'note-completion', 'Maximum number of people in the cycling group', '16 / sixteen'),
    q(3, 'note-completion', 'Average distance cycled each day', ['45 km', '45 kilometres', '45 kilometers', '45km', 'forty-five km']),
    q(4, 'note-completion', 'Some hotels have a', 'swimming pool / pool'),
    q(5, 'note-completion', 'Holiday cost per person without flights', ['1013', '1,013', '£1013', '£1,013']),
    q(6, 'note-completion', 'Food not included', 'snacks'),
    q(7, 'note-completion', 'Essential item to bring', 'helmet / cycle helmet'),
    q(8, 'note-completion', 'Equipment discount website', 'ballantyne'),
    q(9, 'note-completion', 'Item that may change', 'route'),
    q(10, 'note-completion', 'Guided tour destination', 'theatre / theater'),
  ],
}

const restaurantOptions = [
  { letter: 'A', text: 'the decoration' },
  { letter: 'B', text: 'easy parking' },
  { letter: 'C', text: 'entertainment' },
  { letter: 'D', text: 'excellent service' },
  { letter: 'E', text: 'good value' },
  { letter: 'F', text: 'good views' },
  { letter: 'G', text: 'quiet location' },
  { letter: 'H', text: 'wide menu' },
]

const part2: Section = {
  id: 'ielts-listening-test1-part2',
  title: 'The Market and Harbour Restaurants',
  partLabel: 'Part 2',
  partInstruction: 'Listen and answer questions 11 - 20.',
  groups: [
    {
      range: 'Questions 11 - 14',
      instruction: 'Choose the correct letter, A, B or C.',
      blocks: [
        { kind: 'mcq', blank: 11, prompt: 'The market is now situated', options: ['under a car park.', 'beside the cathedral.', 'near the river.'] },
        { kind: 'mcq', blank: 12, prompt: 'On only one day a week the market sells', options: ['antique furniture.', 'local produce.', 'hand-made items.'] },
        { kind: 'mcq', blank: 13, prompt: 'The area is well known for', options: ['ice cream.', 'a cake.', 'a fish dish.'] },
        { kind: 'mcq', blank: 14, prompt: 'What change has taken place in the harbour area?', options: ['Fish can now be bought from the fishermen.', 'The restaurants have moved to a different part.', 'There are fewer restaurants than there used to be.'] },
      ],
    },
    {
      range: 'Questions 15 - 20',
      instruction: 'Which advantage is mentioned for each of the following restaurants? Choose SIX answers from the box and write the correct letter, A-H, next to questions 15-20.',
      blocks: [{
        kind: 'grid',
        columns: restaurantOptions.map((option) => option.letter),
        rows: [
          { blank: 15, label: 'Merrivales' },
          { blank: 16, label: 'The Lobster Pot' },
          { blank: 17, label: 'Elliots' },
          { blank: 18, label: 'The Cabin' },
          { blank: 19, label: 'The Olive Tree' },
          { blank: 20, label: 'The Old School Restaurant' },
        ],
        options: restaurantOptions,
      }],
    },
  ],
  questions: [
    q(11, 'multiple-choice', 'The market is now situated', 'A', ['under a car park.', 'beside the cathedral.', 'near the river.']),
    q(12, 'multiple-choice', 'On only one day a week the market sells', 'C', ['antique furniture.', 'local produce.', 'hand-made items.']),
    q(13, 'multiple-choice', 'The area is well known for', 'B', ['ice cream.', 'a cake.', 'a fish dish.']),
    q(14, 'multiple-choice', 'What change has taken place in the harbour area?', 'B', ['Fish can now be bought from the fishermen.', 'The restaurants have moved to a different part.', 'There are fewer restaurants than there used to be.']),
    q(15, 'matching-information', 'Merrivales', 'D'),
    q(16, 'matching-information', 'The Lobster Pot', 'H'),
    q(17, 'matching-information', 'Elliots', 'F'),
    q(18, 'matching-information', 'The Cabin', 'G'),
    q(19, 'matching-information', 'The Olive Tree', 'C'),
    q(20, 'matching-information', 'The Old School Restaurant', 'A'),
  ],
}

const filmOptions = [
  { letter: 'A', text: 'actors' },
  { letter: 'B', text: 'furniture' },
  { letter: 'C', text: 'background noise' },
  { letter: 'D', text: 'costumes' },
  { letter: 'E', text: 'local council' },
  { letter: 'F', text: 'equipment' },
  { letter: 'G', text: 'shooting schedule' },
  { letter: 'H', text: 'understudies' },
  { letter: 'I', text: 'shopowners' },
]

const mapOptions = [
  { letter: 'A', text: 'lights' },
  { letter: 'B', text: 'fixed camera' },
  { letter: 'C', text: 'mirror' },
  { letter: 'D', text: 'torches' },
  { letter: 'E', text: 'wooden screen' },
  { letter: 'F', text: 'bike' },
  { letter: 'G', text: 'large box' },
]

const part3: Section = {
  id: 'ielts-listening-test1-part3',
  title: 'Film Project',
  partLabel: 'Part 3',
  partInstruction: 'Listen and answer questions 21 - 30.',
  groups: [
    {
      range: 'Questions 21 - 26',
      instruction: 'Choose SIX answers from the box and write the correct letter, A-I, next to questions 21-26.',
      blocks: [
        { kind: 'title', text: 'FILM PROJECT' },
        { kind: 'grid', columns: filmOptions.map((option) => option.letter), rows: [
          { blank: 21, label: 'Visit locations and discuss' },
          { blank: 22, label: 'Contact the ____ about roadworks' },
          { blank: 23, label: 'Plan the' },
          { blank: 24, label: 'Hold auditions and recheck availability of the' },
          { blank: 25, label: 'Choose the ____ from the volunteers' },
          { blank: 26, label: 'Collect ____ and organise food and transport' },
        ], options: filmOptions },
      ],
    },
    {
      range: 'Questions 27 - 30',
      instruction: 'Choose four answers from the box and write the correct letter, A-G, next to questions 27-30.',
      blocks: [
        { kind: 'diagram', diagram: 'old-water-mill' },
      ],
    },
  ],
  questions: [
    q(21, 'matching-information', 'Visit locations and discuss', 'C'),
    q(22, 'matching-information', 'Contact the ____ about roadworks', 'E'),
    q(23, 'matching-information', 'Plan the', 'G'),
    q(24, 'matching-information', 'Hold auditions and recheck availability of the', 'A'),
    q(25, 'matching-information', 'Choose the ____ from the volunteers', 'H'),
    q(26, 'matching-information', 'Collect ____ and organise food and transport', 'B'),
    q(27, 'matching-information', 'Location 27 on the old water-mill plan', 'B', mapOptions.map(option => `${option.letter} ${option.text}`)),
    q(28, 'matching-information', 'Location 28 on the old water-mill plan', 'A', mapOptions.map(option => `${option.letter} ${option.text}`)),
    q(29, 'matching-information', 'Location 29 on the old water-mill plan', 'E', mapOptions.map(option => `${option.letter} ${option.text}`)),
    q(30, 'matching-information', 'Location 30 on the old water-mill plan', 'G', mapOptions.map(option => `${option.letter} ${option.text}`)),
  ],
}

const part4: Section = {
  id: 'ielts-listening-test1-part4',
  title: 'Exotic Pests',
  partLabel: 'Part 4',
  partInstruction: 'Listen and answer questions 31 - 40.',
  groups: [{
    range: 'Questions 31 - 40',
    instruction: 'Complete the table below. Write NO MORE THAN TWO WORDS for each answer.',
    blocks: [{
      kind: 'table', columns: ['Origin', 'Name', 'New habitat / notes'], rows: [
        [{ segments: ['Australia'] }, { segments: ['red-backed spider'] }, { segments: ['Even on island in middle of ', { blank: 31, width: 'xl' }] }],
        [{ segments: ['England'] }, { segments: ['rabbit'] }, { segments: ['Australia; 800 years ago: imported into England to be used for ', { blank: 32, width: 'lg' }] }],
        [{ segments: ['America'] }, { segments: ['fire ants'] }, { segments: ['New habitat: ', { blank: 33, width: 'md' }, ' in Brisbane; imported by chance'] }],
        [{ segments: ['Australia'] }, { segments: [{ blank: 34, width: 'md' }] }, { segments: ['New habitat: Scotland. Deliberately introduced in order to improve ', { blank: 35, width: 'md' }, ' (not effective)'] }],
        [{ segments: ['New Zealand'] }, { segments: ['flatworm'] }, { segments: ['New habitat: ', { blank: 36, width: 'md' }, ' Europe. Accidental introduction inside imported ', { blank: 37, width: 'md' }] }],
        [{ segments: ['Japan'] }, { segments: [{ blank: 38, width: 'md' }] }, { segments: ['New habitat: Australian coastal waters; some advantages'] }],
        [{ segments: ['Australia'] }, { segments: ['budgerigar'] }, { segments: ['Urban areas of south-east ', { blank: 39, width: 'md' }, '. Smaller flocks because of arrival of ', { blank: 40, width: 'md' }, ' in recent years'] }],
      ],
    }],
  }],
  questions: [
    q(31, 'note-completion', 'Island in the middle of', 'Atlantic / Atlantic Ocean / the Atlantic'),
    q(32, 'note-completion', 'Rabbit was imported into England to be used for', 'food source / food / luxury food'),
    q(33, 'note-completion', 'Fire ants: new habitat in Brisbane', 'gardens / in gardens'),
    q(34, 'note-completion', 'Australian pest introduced to Scotland', 'earthworm / earth worm'),
    q(35, 'note-completion', 'Purpose of deliberate introduction', 'soil / soil condition'),
    q(36, 'note-completion', 'Flatworm new habitat in Europe', 'northwest / north-west / north west'),
    q(37, 'note-completion', 'Accidental introduction inside imported', 'plant pots'),
    q(38, 'note-completion', 'Japanese pest in Australian coastal waters', 'seaweed / seaweeds / sea weed / sea weeds'),
    q(39, 'note-completion', 'Budgerigar habitat in south-east', 'United States / USA'),
    q(40, 'note-completion', 'Cause of smaller flocks', 'competitors / new competitors'),
  ],
}

export const listeningFullTest1: IELTSTest = {
  id: 'ielts-listening-1',
  title: 'IELTS Listening Full Test 1',
  type: 'Academic',
  module: 'Listening',
  duration: 30,
  totalQuestions: 40,
  continuousAudioUrl: AUDIO_URL,
  sections: [part1, part2, part3, part4],
}

// Review-only copy of the replaced Test 3. It stays outside the live catalog.
export const archivedListeningFullTest3: IELTSTest = {
  ...listeningFullTest1,
  id: 'ielts-listening-3',
  title: 'IELTS Listening Full Test 3',
  sections: listeningFullTest1.sections.map((section, index) => ({
    ...section,
    id: `lt3-part${index + 1}`,
    questions: section.questions.map(question => ({ ...question, id: `lt3-q${question.number}` })),
  })),
}
