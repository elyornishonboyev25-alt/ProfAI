import type { IELTSTest, Question, Section } from '../types/ieltsTypes'

// IELTS Listening Full Test 4 — Prime Recruitment / Cityscope Sports and Leisure.
// The questions, answer key and the continuous recording were supplied for this test.
const AUDIO_URL = '/audio/ielts-listening/listening-full-test-4.mp3'
const CITYSCOPE_MAP_URL = '/images/ielts-listening/test4-cityscope-sports-and-leisure.png'

function q(
  number: number,
  type: Question['type'],
  text: string,
  correctAnswer: string | string[],
  options?: string[],
): Question {
  return { id: `lt4-q${number}`, number, type, text, correctAnswer, options }
}

const part1: Section = {
  id: 'lt4-part1',
  title: 'Prime Recruitment',
  partLabel: 'Part 1',
  partInstruction: 'Listen and answer questions 1 - 10.',
  groups: [{
    range: 'Questions 1 - 6',
    instruction: 'Complete the form below. Write NO MORE THAN TWO WORDS for each answer.',
    blocks: [
      { kind: 'title', text: 'PRIME RECRUITMENT' },
      { kind: 'subhead', text: 'Employee record' },
      { kind: 'example', segments: ['Surname: ', 'Riley'] },
      { kind: 'note', segments: ['Email: ', { blank: 1, width: 'lg' }, '@worldnet.com'] },
      { kind: 'note', segments: ['Nationality: ', { blank: 2, width: 'lg' }] },
      { kind: 'space' },
      { kind: 'subhead', text: 'Reference (professional)' },
      { kind: 'note', segments: ['Name: John Keen'] },
      { kind: 'note', segments: ['Job: manager of ', { blank: 3, width: 'lg' }] },
      { kind: 'space' },
      { kind: 'subhead', text: 'Reference (personal)' },
      { kind: 'note', segments: ['Name: Eileen Dorsini'] },
      { kind: 'note', segments: ['Job: ', { blank: 4, width: 'lg' }] },
      { kind: 'space' },
      { kind: 'subhead', text: 'Special qualifications' },
      { kind: 'note', segments: ['current ', { blank: 5, width: 'md' }, ' certificate'] },
      { kind: 'note', segments: ['certificate of competence in ', { blank: 6, width: 'lg' }] },
    ],
  }, {
    range: 'Questions 7 - 10',
    instruction: 'Complete the table below. Write NO MORE THAN ONE WORD for each answer.',
    blocks: [{
      kind: 'table',
      columns: ['Location', 'Name', 'Children', 'Special requirements'],
      rows: [
        [{ segments: ['London'] }, { segments: ['Benton'] }, { segments: ['girl and boy'] }, { segments: ['be keen on ', { blank: 7, width: 'md' }] }],
        [{ segments: ['near Oxford'] }, { segments: ['Granger'] }, { segments: [{ blank: 8, width: 'sm' }, ' boys'] }, { segments: ['be animal-lover'] }],
        [{ segments: [{ blank: 9, width: 'md' }] }, { segments: ['Campbell'] }, { segments: ['four girls'] }, { segments: ['be willing to ', { blank: 10, width: 'md' }, ' when camping'] }],
      ],
    }],
  }],
  questions: [
    q(1, 'note-completion', 'Email address', 'edwinari'),
    q(2, 'note-completion', 'Nationality', 'New Zealander'),
    q(3, 'note-completion', 'John Keen is manager of', 'play centre'),
    q(4, 'note-completion', 'Eileen Dorsini is a', 'professor'),
    q(5, 'note-completion', 'Current certificate', 'first aid'),
    q(6, 'note-completion', 'Certificate of competence in', 'sailing'),
    q(7, 'note-completion', 'Benton family requirement', 'sport'),
    q(8, 'note-completion', 'Number of boys in the Granger family', 'twin'),
    q(9, 'note-completion', 'Campbell family location', 'Scotland'),
    q(10, 'note-completion', 'Camping requirement', 'cook'),
  ],
}

const part2: Section = {
  id: 'lt4-part2',
  title: 'Cityscope Sports and Leisure',
  partLabel: 'Part 2',
  partInstruction: 'Listen and answer questions 11 - 20.',
  groups: [{
    range: 'Questions 11 - 14',
    instruction: 'Choose TWO letters, A-E, for each question.',
    blocks: [
      { kind: 'multi-mcq', blanks: [11, 12], prompt: 'Which TWO sources of funding helped build the facility?', options: ['the central government', 'local government', 'a multinational company', 'a national company', 'city residents'], selectionLimit: 2 },
      { kind: 'multi-mcq', blanks: [13, 14], prompt: 'Which TWO pre-existing features of the site are now part of the new facilities?', options: ['football stadium', 'playing fields', 'passenger hall', 'control tower', 'aircraft hangars'], selectionLimit: 2 },
    ],
  }, {
    range: 'Questions 15 - 20',
    instruction: 'Label the map below. Write the correct letter, A-H, next to questions 15-20.',
    blocks: [
      { kind: 'image', src: CITYSCOPE_MAP_URL, alt: 'Cityscope Sports and Leisure map, labelled A to H.', caption: 'Cityscope Sports and Leisure' },
      { kind: 'grid', columns: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], inputMode: true, rows: [
        { blank: 15, label: 'hotel' },
        { blank: 16, label: 'transport hub' },
        { blank: 17, label: 'cinema' },
        { blank: 18, label: 'fitness centre' },
        { blank: 19, label: 'shops' },
        { blank: 20, label: 'restaurant' },
      ] },
    ],
  }],
  questions: [
    q(11, 'multiple-choice', 'First source of funding', 'D', ['the central government', 'local government', 'a multinational company', 'a national company', 'city residents']),
    q(12, 'multiple-choice', 'Second source of funding', 'E', ['the central government', 'local government', 'a multinational company', 'a national company', 'city residents']),
    q(13, 'multiple-choice', 'First retained feature', 'B', ['football stadium', 'playing fields', 'passenger hall', 'control tower', 'aircraft hangars']),
    q(14, 'multiple-choice', 'Second retained feature', 'C', ['football stadium', 'playing fields', 'passenger hall', 'control tower', 'aircraft hangars']),
    q(15, 'matching-information', 'Hotel location on the Cityscope map', 'E'),
    q(16, 'matching-information', 'Transport hub location on the Cityscope map', 'B'),
    q(17, 'matching-information', 'Cinema location on the Cityscope map', 'A'),
    q(18, 'matching-information', 'Fitness centre location on the Cityscope map', 'D'),
    q(19, 'matching-information', 'Shops location on the Cityscope map', 'F'),
    q(20, 'matching-information', 'Restaurant location on the Cityscope map', 'C'),
  ],
}

const part3: Section = {
  id: 'lt4-part3',
  title: 'Business Study Course',
  partLabel: 'Part 3',
  partInstruction: 'Listen and answer questions 21 - 30.',
  groups: [{
    range: 'Questions 21 - 25',
    instruction: 'Choose the correct letter, A, B or C.',
    blocks: [
      { kind: 'mcq', blank: 21, prompt: 'What is Chloe concerned about?', options: ['her knowledge of maths', 'her ability to write essays', 'her lack of business experience'] },
      { kind: 'mcq', blank: 22, prompt: 'Which of the following does Ivan feel he has improved?', options: ['his computer skills', 'his presentation skills', 'his time management'] },
      { kind: 'mcq', blank: 23, prompt: 'What does Chloe especially like about the course?', options: ['She won’t have to do a final examination.', 'She can spend time working in a business.', 'She can study a foreign language.'] },
      { kind: 'mcq', blank: 24, prompt: 'Ivan is pleased that the university is going to have', options: ['more lecture rooms.', 'a larger library.', 'more courses.'] },
      { kind: 'mcq', blank: 25, prompt: 'What does Ivan advise Chloe to do?', options: ['contact his tutor', 'read about some other universities', 'visit the university'] },
    ],
  }, {
    range: 'Questions 26 - 30',
    instruction: 'What does Chloe decide about the following subjects? Write the correct letter, A, B or C, next to questions 26-30.',
    blocks: [
      { kind: 'text', text: 'A) She will study it.' },
      { kind: 'text', text: 'B) She won’t study it.' },
      { kind: 'text', text: 'C) She might study it.' },
      { kind: 'subhead', text: 'Subjects' },
      { kind: 'grid', columns: ['A', 'B', 'C'], inputMode: true, rows: [
        { blank: 26, label: 'Public relations' },
        { blank: 27, label: 'Marketing' },
        { blank: 28, label: 'Taxation' },
        { blank: 29, label: 'Human resources' },
        { blank: 30, label: 'Information systems' },
      ] },
    ],
  }],
  questions: [
    q(21, 'multiple-choice', 'What Chloe is concerned about', 'B', ['her knowledge of maths', 'her ability to write essays', 'her lack of business experience']),
    q(22, 'multiple-choice', 'Skill Ivan feels he has improved', 'C', ['his computer skills', 'his presentation skills', 'his time management']),
    q(23, 'multiple-choice', 'What Chloe especially likes about the course', 'A', ['She won’t have to do a final examination.', 'She can spend time working in a business.', 'She can study a foreign language.']),
    q(24, 'multiple-choice', 'University improvement Ivan is pleased about', 'C', ['more lecture rooms.', 'a larger library.', 'more courses.']),
    q(25, 'multiple-choice', 'Ivan’s advice to Chloe', 'A', ['contact his tutor', 'read about some other universities', 'visit the university']),
    q(26, 'matching-information', 'Public relations', 'C'),
    q(27, 'matching-information', 'Marketing', 'A'),
    q(28, 'matching-information', 'Taxation', 'A'),
    q(29, 'matching-information', 'Human resources', 'B'),
    q(30, 'matching-information', 'Information systems', 'C'),
  ],
}

const part4: Section = {
  id: 'lt4-part4',
  title: 'History of Weather Forecasting',
  partLabel: 'Part 4',
  partInstruction: 'Listen and answer questions 31 - 40.',
  groups: [{
    range: 'Questions 31 - 35',
    instruction: 'Complete the notes below. Write NO MORE THAN TWO WORDS for each answer.',
    blocks: [
      { kind: 'title', text: 'History of weather forecasting' },
      { kind: 'subhead', text: 'Early methods' },
      { kind: 'note', bullet: true, segments: ['Almanacs connected the weather with the positions of different ', { blank: 31, width: 'lg' }, ' at particular times.'] },
      { kind: 'subhead', text: 'Invention of weather instruments' },
      { kind: 'note', bullet: true, segments: ['A hygrometer showed levels of ', { blank: 32, width: 'lg' }, ' (Nicholas Cusa 1450)'] },
      { kind: 'note', bullet: true, segments: ['Temperature variations first measured by a thermometer containing ', { blank: 33, width: 'lg' }, ' (Galileo Galilei 1593)'] },
      { kind: 'note', bullet: true, segments: ['A barometer indicated air pressure (Evangelista Torricelli 1643)'] },
      { kind: 'subhead', text: 'Transmitting weather information' },
      { kind: 'note', bullet: true, segments: ['The use of the ', { blank: 34, width: 'lg' }, ' allowed information to be passed around the world.'] },
      { kind: 'note', bullet: true, segments: ['Daily ', { blank: 35, width: 'lg' }, ' were produced by the French from 1863.'] },
    ],
  }, {
    range: 'Questions 36 - 40',
    instruction: 'Complete the sentences below. Write NO MORE THAN TWO WORDS for each answer.',
    blocks: [
      { kind: 'subhead', text: 'Producing a weather forecast' },
      { kind: 'note', segments: ['Weather observation stations are found mostly at ', { blank: 36, width: 'lg' }, ' around the country.'] },
      { kind: 'note', segments: ['Satellite images use the colour orange to show ', { blank: 37, width: 'lg' }, '.'] },
      { kind: 'note', segments: ['The satellites give so much detail that meteorologists can distinguish a particular ', { blank: 38, width: 'lg' }, '.'] },
      { kind: 'note', segments: ['Information about the upper atmosphere is sent from instruments attached to a ', { blank: 39, width: 'lg' }, '.'] },
      { kind: 'note', segments: ['Radar is particularly useful for following the movement of ', { blank: 40, width: 'lg' }, '.'] },
    ],
  }],
  questions: [
    q(31, 'note-completion', 'Celestial objects used in early forecasting', 'planets'),
    q(32, 'note-completion', 'Level measured by a hygrometer', 'humidity'),
    q(33, 'note-completion', 'Liquid in Galileo’s thermometer', 'water'),
    q(34, 'note-completion', 'Technology that passed weather information around the world', 'telegraph/electric telegraph'),
    q(35, 'note-completion', 'Daily publications produced by the French from 1863', 'maps/weather maps'),
    q(36, 'note-completion', 'Where weather observation stations are mostly found', 'airports'),
    q(37, 'note-completion', 'What orange represents on satellite images', 'dry air'),
    q(38, 'note-completion', 'Individual feature satellites can distinguish', 'cloud'),
    q(39, 'note-completion', 'What carries instruments into the upper atmosphere', 'balloon'),
    q(40, 'note-completion', 'Weather event whose movement radar follows', 'hurricanes'),
  ],
}

export const listeningFullTest4: IELTSTest = {
  id: 'ielts-listening-4',
  title: 'IELTS Listening Full Test 4',
  type: 'Academic',
  module: 'Listening',
  duration: 30,
  totalQuestions: 40,
  continuousAudioUrl: AUDIO_URL,
  sections: [part1, part2, part3, part4],
}
