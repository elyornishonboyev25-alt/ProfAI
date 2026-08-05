import { IELTSTest, Section, Question } from '../types/ieltsTypes'
import { listeningFullTest2 } from './listeningFullTest2'
import { listeningFullTest3 } from './listeningFullTest3'
import { listeningFullTest4 } from './listeningFullTest4'

const AUDIO_BASE = '/audio/ielts-listening'
const IMAGE_BASE = '/images/ielts-listening'

function createQuestion(
  id: string,
  number: number,
  text: string,
  type: Question['type'],
  correctAnswer: string | string[],
  options?: string[],
): Question {
  return {
    id,
    number,
    text,
    type,
    options,
    correctAnswer,
  }
}

const listeningPart1: Section = {
  id: 'ielts-listening-test1-part1',
  title: 'Cycling Holiday in Austria',
  audioUrl: `${AUDIO_BASE}/test1-part1.mp3`,
  visualAidUrl: `${IMAGE_BASE}/test1-part1.png`,
  duration: 380,
  partLabel: 'Part 1',
  partInstruction: 'Listen and answer questions 1 - 10.',
  groups: [
    {
      range: 'Questions 1 - 10',
      instruction: 'Complete the notes below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.',
      blocks: [
        { kind: 'title', text: 'Cycling Holiday in Austria' },
        { kind: 'note', segments: ['Holiday begins on ', { blank: 1, width: 'md' }] },
        { kind: 'note', segments: ['No more than ', { blank: 2, width: 'sm' }, ' people in cycling group'] },
        { kind: 'note', segments: ['Each day, group cycles ', { blank: 3, width: 'md' }, ' on average'] },
        { kind: 'note', segments: ['Some of the hotels have a ', { blank: 4, width: 'lg' }] },
        { kind: 'note', segments: ['Holiday costs GBP ', { blank: 5, width: 'sm' }, ' per person without flights'] },
        { kind: 'note', segments: ['All food included except ', { blank: 6, width: 'md' }] },
        { kind: 'note', segments: ['Essential to bring a ', { blank: 7, width: 'lg' }] },
        { kind: 'note', segments: ['Discount possible on equipment at www.', { blank: 8, width: 'md' }, '.com'] },
        { kind: 'note', segments: ['Possible that the ', { blank: 9, width: 'md' }, ' may change'] },
        { kind: 'note', segments: ['Guided tour of a ', { blank: 10, width: 'md' }, ' is arranged'] },
      ],
    },
  ],
  questions: [
    createQuestion('ls1-q1', 1, 'Holiday begins on', 'note-completion', 'Saturday'),
    createQuestion('ls1-q2', 2, 'No more than ____ people in cycling group', 'note-completion', '12'),
    createQuestion('ls1-q3', 3, 'Each day, group cycles ____ on average', 'note-completion', '35 km'),
    createQuestion('ls1-q4', 4, 'Some of the hotels have a', 'note-completion', 'swimming pool'),
    createQuestion('ls1-q5', 5, 'Holiday costs GBP ____ per person without flights', 'note-completion', '760'),
    createQuestion('ls1-q6', 6, 'All food included except', 'note-completion', 'lunch'),
    createQuestion('ls1-q7', 7, 'Essential to bring a', 'note-completion', 'waterproof jacket'),
    createQuestion('ls1-q8', 8, 'Discount possible on equipment at www.____.com', 'note-completion', 'bikeplus'),
    createQuestion('ls1-q9', 9, 'Possible that the ____ may change', 'note-completion', 'route'),
    createQuestion('ls1-q10', 10, 'Guided tour of a ____ is arranged', 'note-completion', 'castle'),
  ],
}

const harbourAdvantageOptions = [
  { letter: 'A', text: 'great views' },
  { letter: 'B', text: 'private booths' },
  { letter: 'C', text: 'good for vegetarians' },
  { letter: 'D', text: 'reasonable prices' },
  { letter: 'E', text: 'tables outside' },
  { letter: 'F', text: 'serves food all day' },
  { letter: 'G', text: 'live music' },
  { letter: 'H', text: 'specialises in seafood' },
]

const listeningPart2: Section = {
  id: 'ielts-listening-test1-part2',
  title: 'Harbour Area and Restaurants',
  audioUrl: `${AUDIO_BASE}/test1-part2.mp3`,
  visualAidUrl: `${IMAGE_BASE}/test1-part2.png`,
  duration: 420,
  partLabel: 'Part 2',
  partInstruction: 'Listen and answer questions 11 - 20.',
  groups: [
    {
      range: 'Questions 11 - 14',
      instruction: 'Choose the correct answer.',
      blocks: [
        { kind: 'mcq', blank: 11, prompt: 'The market is now situated', options: ['under a car park.', 'beside the cathedral.', 'near the river.'] },
        { kind: 'mcq', blank: 12, prompt: 'On only one day a week the market sells', options: ['antique furniture.', 'local produce.', 'hand-made items.'] },
        { kind: 'mcq', blank: 13, prompt: 'The area is well known for', options: ['ice cream.', 'a cake.', 'a fish dish.'] },
        { kind: 'mcq', blank: 14, prompt: 'What change has taken place in the harbour area?', options: ['Fish can now be bought from the fishermen.', 'The restaurants have moved to a different part.', 'There are fewer restaurants than there used to be.'] },
      ],
    },
    {
      range: 'Questions 15 - 20',
      instruction: 'What advantage is mentioned for each of the following restaurants? Choose SIX answers from the box and write the correct letter A-H next to each restaurant.',
      blocks: [
        {
          kind: 'grid',
          columns: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
          rows: [
            { blank: 15, label: 'Merrivales' },
            { blank: 16, label: 'The Lobster Pot' },
            { blank: 17, label: 'Elliots' },
            { blank: 18, label: 'The Cabin' },
            { blank: 19, label: 'The Olive Tree' },
            { blank: 20, label: 'The Old School Restaurant' },
          ],
          options: harbourAdvantageOptions,
        },
      ],
    },
  ],
  questions: [
    createQuestion('ls1-q11', 11, 'The market is now situated', 'multiple-choice', 'C', ['under a car park.', 'beside the cathedral.', 'near the river.']),
    createQuestion('ls1-q12', 12, 'On only one day a week the market sells', 'multiple-choice', 'C', ['antique furniture.', 'local produce.', 'hand-made items.']),
    createQuestion('ls1-q13', 13, 'The area is well known for', 'multiple-choice', 'B', ['ice cream.', 'a cake.', 'a fish dish.']),
    createQuestion('ls1-q14', 14, 'What change has taken place in the harbour area?', 'multiple-choice', 'B', ['Fish can now be bought from the fishermen.', 'The restaurants have moved to a different part.', 'There are fewer restaurants than there used to be.']),
    createQuestion('ls1-q15', 15, 'Merrivales', 'matching-information', 'C'),
    createQuestion('ls1-q16', 16, 'The Lobster Pot', 'matching-information', 'F'),
    createQuestion('ls1-q17', 17, 'Elliots', 'matching-information', 'B'),
    createQuestion('ls1-q18', 18, 'The Cabin', 'matching-information', 'G'),
    createQuestion('ls1-q19', 19, 'The Olive Tree', 'matching-information', 'H'),
    createQuestion('ls1-q20', 20, 'The Old School Restaurant', 'matching-information', 'A'),
  ],
}

const filmTaskOptions = [
  { letter: 'A', text: 'sponsors' },
  { letter: 'B', text: 'costumes' },
  { letter: 'C', text: 'lighting' },
  { letter: 'D', text: 'locations' },
  { letter: 'E', text: 'council' },
  { letter: 'F', text: 'schedule' },
  { letter: 'G', text: 'actors' },
  { letter: 'H', text: 'crew' },
  { letter: 'I', text: 'equipment' },
]

const listeningPart3: Section = {
  id: 'ielts-listening-test1-part3',
  title: 'Film Project Planning',
  audioUrl: `${AUDIO_BASE}/test1-part3.mp3`,
  visualAidUrl: `${IMAGE_BASE}/test1-part3.png`,
  duration: 470,
  partLabel: 'Part 3',
  partInstruction: 'Listen and answer questions 21 - 30.',
  groups: [
    {
      range: 'Questions 21 - 26',
      instruction: 'What needs to be done for each stage of the film project? Choose SIX answers from the box A-I.',
      blocks: [
        {
          kind: 'grid',
          columns: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'],
          rows: [
            { blank: 21, label: 'Visit locations and discuss' },
            { blank: 22, label: 'Contact the ____ about roadworks' },
            { blank: 23, label: 'Plan the' },
            { blank: 24, label: 'Hold auditions and recheck availability of the' },
            { blank: 25, label: 'Choose the ____ from the volunteers' },
            { blank: 26, label: 'Collect ____ and organise food and transport' },
          ],
          options: filmTaskOptions,
        },
      ],
    },
    {
      range: 'Questions 27 - 30',
      instruction: 'Label the map below. Choose four answers from the box A-G and write the correct letter next to questions 27-30.',
      blocks: [
        {
          kind: 'grid',
          columns: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
          rows: [
            { blank: 27, label: 'Storage room' },
            { blank: 28, label: 'Editing suite' },
            { blank: 29, label: 'Sound studio' },
            { blank: 30, label: 'Green room' },
          ],
        },
      ],
    },
  ],
  questions: [
    createQuestion('ls1-q21', 21, 'Visit locations and discuss', 'matching-information', 'D'),
    createQuestion('ls1-q22', 22, 'Contact the ____ about roadworks', 'matching-information', 'E'),
    createQuestion('ls1-q23', 23, 'Plan the', 'matching-information', 'F'),
    createQuestion('ls1-q24', 24, 'Hold auditions and recheck availability of the', 'matching-information', 'B'),
    createQuestion('ls1-q25', 25, 'Choose the ____ from the volunteers', 'matching-information', 'H'),
    createQuestion('ls1-q26', 26, 'Collect ____ and organise food and transport', 'matching-information', 'I'),
    createQuestion('ls1-q27', 27, 'Storage room', 'matching-information', 'B'),
    createQuestion('ls1-q28', 28, 'Editing suite', 'matching-information', 'E'),
    createQuestion('ls1-q29', 29, 'Sound studio', 'matching-information', 'D'),
    createQuestion('ls1-q30', 30, 'Green room', 'matching-information', 'F'),
  ],
}

const listeningPart4: Section = {
  id: 'ielts-listening-test1-part4',
  title: 'Exotic Pests',
  audioUrl: `${AUDIO_BASE}/test1-part4.mp3`,
  visualAidUrl: `${IMAGE_BASE}/test1-part4.png`,
  duration: 520,
  partLabel: 'Part 4',
  partInstruction: 'Listen and answer questions 31 - 40.',
  groups: [
    {
      range: 'Questions 31 - 40',
      instruction: 'Complete the table below. Write NO MORE THAN TWO WORDS for each answer.',
      blocks: [
        {
          kind: 'table',
          columns: ['Pest', 'Origin', 'New habitat / notes'],
          rows: [
            [
              { segments: ['Rabbit'] },
              { segments: ['England (for ', { blank: 32, width: 'md' }, ')'] },
              { segments: ['Even on island in middle of ', { blank: 31, width: 'md' }, '; parks in Brisbane (', { blank: 33, width: 'md' }, ')'] },
            ],
            [
              { segments: [{ blank: 34, width: 'md' }] },
              { segments: ['Australia'] },
              { segments: ['Introduced to improve ', { blank: 35, width: 'lg' }] },
            ],
            [
              { segments: [{ blank: 38, width: 'md' }] },
              { segments: ['Japan'] },
              { segments: [{ blank: 36, width: 'md' }, ' Europe; arrived inside imported ', { blank: 37, width: 'md' }] },
            ],
            [
              { segments: ['Budgerigar'] },
              { segments: ['—'] },
              { segments: ['Urban areas of south-east ', { blank: 39, width: 'md' }, '; smaller flocks after arrival of ', { blank: 40, width: 'md' }] },
            ],
          ],
        },
      ],
    },
  ],
  questions: [
    createQuestion('ls1-q31', 31, 'Even on island in middle of', 'note-completion', 'Pacific'),
    createQuestion('ls1-q32', 32, 'Imported into England to be used for', 'note-completion', 'food'),
    createQuestion('ls1-q33', 33, 'New habitat: ____ in Brisbane', 'note-completion', 'parks'),
    createQuestion('ls1-q34', 34, 'Origin: Australia. Name:', 'note-completion', 'cane toad'),
    createQuestion('ls1-q35', 35, 'Introduced to improve', 'note-completion', 'sugar cane'),
    createQuestion('ls1-q36', 36, 'New habitat: ____ Europe', 'note-completion', 'north-west'),
    createQuestion('ls1-q37', 37, 'Accidental introduction inside imported', 'note-completion', 'plants'),
    createQuestion('ls1-q38', 38, 'Origin: Japan. Name:', 'note-completion', 'starfish'),
    createQuestion('ls1-q39', 39, 'Budgerigar new habitat: urban areas of south-east', 'note-completion', 'England'),
    createQuestion('ls1-q40', 40, 'Smaller flocks because of arrival of', 'note-completion', 'cats'),
  ],
}

const listeningFullTest1Sections: Section[] = [
  listeningPart1,
  listeningPart2,
  listeningPart3,
  listeningPart4,
]

const listeningFullTest1: IELTSTest = {
  id: 'ielts-listening-1',
  title: 'IELTS Listening Full Test 1',
  type: 'Academic',
  module: 'Listening',
  duration: 32,
  totalQuestions: 40,
  sections: listeningFullTest1Sections,
}

export const mockListeningTests: IELTSTest[] = [
  listeningFullTest1,
  listeningFullTest2,
  listeningFullTest3,
  listeningFullTest4,
]
