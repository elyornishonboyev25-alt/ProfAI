import type { IELTSTest, ListeningOption, Question, Section } from '../types/ieltsTypes'

// Family presents / Historical sites / Work experience programme /
// Theories of intelligence. The complete recording and final answer review
// were supplied by the user and checked against the repository before release.
const AUDIO_URL = '/audio/ielts-listening/listening-full-test-7.mp3'

function q(
  number: number,
  type: Question['type'],
  text: string,
  correctAnswer: string,
  options?: string[],
): Question {
  return { id: `lt7-q${number}`, number, type, text, correctAnswer, options }
}

const part1: Section = {
  id: 'lt7-part1',
  title: 'Family presents',
  partLabel: 'Part 1',
  partInstruction: 'Listen and answer questions 1 - 10.',
  groups: [{
    range: 'Questions 1 - 10',
    instruction: 'Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer.',
    blocks: [
      { kind: 'title', text: 'Family presents' },
      { kind: 'subhead', text: 'Company specialises in educational toys' },
      { kind: 'text', text: 'Presents for Peter:' },
      { kind: 'note', segments: ['A wooden ', { blank: 1, width: 'lg' }, ' (a model)'] },
      { kind: 'note', indent: true, segments: ['includes a sheet of stickers'] },
      { kind: 'note', indent: true, segments: ['helps children to understand basic ', { blank: 2, width: 'lg' }] },
      { kind: 'note', indent: true, segments: ['price: £17.50'] },
      { kind: 'note', segments: ['A ', { blank: 3, width: 'lg' }, ' feeder'] },
      { kind: 'note', indent: true, segments: ['includes paints and brush'] },
      { kind: 'note', indent: true, segments: ['price: £', { blank: 4, width: 'md' }] },
      { kind: 'subhead', text: 'Present for Natalie:' },
      { kind: 'text', text: 'A chocolate pack' },
      { kind: 'note', indent: true, segments: ['kit includes chocolate, moulds and some small ', { blank: 5, width: 'lg' }] },
      { kind: 'note', indent: true, segments: ['develops artistic skills'] },
      { kind: 'note', indent: true, segments: ['helps children to understand effects of ', { blank: 6, width: 'lg' }] },
      { kind: 'note', indent: true, segments: ['price: £6.00'] },
      { kind: 'subhead', text: 'Ordering toys' },
      { kind: 'note', segments: ['web address - www.', { blank: 7, width: 'lg' }, '.com'] },
      { kind: 'note', segments: ['order before Friday to get free ', { blank: 8, width: 'lg' }] },
      { kind: 'text', text: 'can be wrapped and sent straight to children' },
      { kind: 'note', segments: ["under 'Packaging options' choose ", { blank: 9, width: 'lg' }] },
      { kind: 'note', segments: ['possible to include a ', { blank: 10, width: 'lg' }] },
    ],
  }],
  questions: [
    q(1, 'note-completion', 'A wooden ___ (a model)', 'truck'),
    q(2, 'note-completion', 'Helps children to understand basic ___', 'technology'),
    q(3, 'note-completion', 'A ___ feeder', 'bird'),
    q(4, 'note-completion', 'Price of the feeder', '8.99'),
    q(5, 'note-completion', 'The kit includes some small ___', 'boxes'),
    q(6, 'note-completion', 'Helps children to understand effects of ___', 'temperature'),
    q(7, 'note-completion', 'Website name', 'rimona'),
    q(8, 'note-completion', 'Order before Friday to get free ___', 'postage'),
    q(9, 'note-completion', "Under 'Packaging options' choose ___", 'gift'),
    q(10, 'note-completion', 'Possible to include a ___', 'message'),
  ],
}

const historicalSites = [
  'limited viewing space',
  'free movie',
  'limited touring time',
  'advance reservations only',
  'old paintings',
  'best seen at night',
  'unusual architectural details',
]

const historicalSiteOptions: ListeningOption[] = historicalSites.map((text, index) => ({
  letter: String.fromCharCode(65 + index),
  text,
}))

const part2Mcq: Record<number, string[]> = {
  16: ['watch a movie.', 'see a live performance.', 'enjoy local food.'],
  17: ['extra summer events.', 'popular activities for kids.', 'better public transport.'],
  18: ['find a discount shop.', 'visit a museum.', 'attend a university lecture.'],
  19: ['have a picnic.', 'rent a bicycle.', 'take a guided tour.'],
  20: ['visit all the sites.', 'carry water.', 'use public transport.'],
}

const part2: Section = {
  id: 'lt7-part2',
  title: 'Several places of interest in the area',
  partLabel: 'Part 2',
  partInstruction: 'Listen and answer questions 11 - 20.',
  groups: [{
    range: 'Questions 11 - 15',
    instruction: 'What information is given about each of the following historical sites? Choose FIVE answers from the box and write the correct letter, A-G, next to questions 11-15.',
    blocks: [
      { kind: 'title', text: 'Historical sites' },
      {
        kind: 'grid',
        columns: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
        rows: [
          { blank: 11, label: 'Chamber Museum' },
          { blank: 12, label: 'Harris Park' },
          { blank: 13, label: 'State Building' },
          { blank: 14, label: 'High Court' },
          { blank: 15, label: 'Castle Mount' },
        ],
        options: historicalSiteOptions,
        inputMode: true,
      },
    ],
  }, {
    range: 'Questions 16 - 20',
    instruction: 'Choose the correct letter, A, B or C.',
    blocks: [
      { kind: 'mcq', blank: 16, prompt: 'At the King Centre, you can', options: part2Mcq[16] },
      { kind: 'mcq', blank: 17, prompt: "The 'T Park' attendance has recently improved because of", options: part2Mcq[17] },
      { kind: 'mcq', blank: 18, prompt: 'In Marytown, you may be able to', options: part2Mcq[18] },
      { kind: 'mcq', blank: 19, prompt: 'At the canal, you can', options: part2Mcq[19] },
      { kind: 'mcq', blank: 20, prompt: 'The speaker concludes by recommending visitors to', options: part2Mcq[20] },
    ],
  }],
  questions: [
    q(11, 'multiple-choice', 'Information given about Chamber Museum', 'B', historicalSites),
    q(12, 'multiple-choice', 'Information given about Harris Park', 'F', historicalSites),
    q(13, 'multiple-choice', 'Information given about State Building', 'C', historicalSites),
    q(14, 'multiple-choice', 'Information given about High Court', 'A', historicalSites),
    q(15, 'multiple-choice', 'Information given about Castle Mount', 'E', historicalSites),
    q(16, 'multiple-choice', 'At the King Centre, you can', 'B', part2Mcq[16]),
    q(17, 'multiple-choice', "Why the 'T Park' attendance has recently improved", 'C', part2Mcq[17]),
    q(18, 'multiple-choice', 'What you may be able to do in Marytown', 'C', part2Mcq[18]),
    q(19, 'multiple-choice', 'What you can do at the canal', 'A', part2Mcq[19]),
    q(20, 'multiple-choice', 'What the speaker recommends visitors do', 'B', part2Mcq[20]),
  ],
}

const part3Mcq: Record<number, string[]> = {
  21: ['is very expensive.', 'takes too long.', "doesn't earn credit."],
  22: ['setting personal goals', 'creating a professional curriculum vitae', 'attending an interview workshop'],
  23: [
    'He will spend the entire time on the help desk.',
    'He will get the chance to design computer software.',
    'He will be able to do work appropriate to his area of study.',
  ],
  24: [
    'they cannot expect to receive the same wage as recent graduates.',
    'their employers are not required to pay them.',
    'they are not allowed to work for charity organisations.',
  ],
}

const workExperienceOptions = [
  'health and safety',
  'record of work',
  'application',
  'contract',
  'job description',
  'feedback',
  'payment',
  'contact details',
  'permission',
]

const workExperienceGridOptions: ListeningOption[] = workExperienceOptions.map((text, index) => ({
  letter: String.fromCharCode(65 + index),
  text,
}))

const part3: Section = {
  id: 'lt7-part3',
  title: 'Work experience programme',
  partLabel: 'Part 3',
  partInstruction: 'Listen and answer questions 21 - 30.',
  groups: [{
    range: 'Questions 21 - 24',
    instruction: 'Choose the correct letter, A, B or C.',
    blocks: [
      { kind: 'title', text: 'Work experience programme' },
      { kind: 'mcq', blank: 21, prompt: 'John is unhappy because the work experience programme', options: part3Mcq[21] },
      { kind: 'mcq', blank: 22, prompt: 'What part of the preparation course do Emma and John agree is unnecessary?', options: part3Mcq[22] },
      { kind: 'mcq', blank: 23, prompt: 'What does Emma say about the work experience role John might take on?', options: part3Mcq[23] },
      { kind: 'mcq', blank: 24, prompt: 'According to John, when students are doing work experience after their second year', options: part3Mcq[24] },
    ],
  }, {
    range: 'Questions 25 - 30',
    instruction: 'Complete the flow-chart below. Choose SIX answers from the box and write the correct letter, A-I, next to questions 25-30.',
    blocks: [
      { kind: 'title', text: 'The process for getting and doing work experience' },
      {
        kind: 'grid',
        columns: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'],
        rows: [
          { blank: 25, label: 'The student gets a simple ______ form.' },
          { blank: 26, label: 'The college looks at a short ______ and confirms whether the work is suitable.' },
          { blank: 27, label: 'The college obtains the relevant ______ from the employer.' },
          { blank: 28, label: 'A meeting is arranged to discuss ______ issues.' },
          { blank: 29, label: 'The student must complete a ______ form while doing the work experience.' },
          { blank: 30, label: 'Employers are provided with a voluntary ______ form.' },
        ],
        options: workExperienceGridOptions,
        inputMode: true,
      },
    ],
  }],
  questions: [
    q(21, 'multiple-choice', 'Why John is unhappy with the work experience programme', 'C', part3Mcq[21]),
    q(22, 'multiple-choice', 'The unnecessary part of the preparation course', 'A', part3Mcq[22]),
    q(23, 'multiple-choice', 'What Emma says about the role John might take on', 'A', part3Mcq[23]),
    q(24, 'multiple-choice', 'What John says about work experience after the second year', 'B', part3Mcq[24]),
    q(25, 'multiple-choice', 'The student gets a simple ___ form', 'C', workExperienceOptions),
    q(26, 'multiple-choice', 'The college looks at a short ___', 'E', workExperienceOptions),
    q(27, 'multiple-choice', 'The college obtains the relevant ___ from the employer', 'H', workExperienceOptions),
    q(28, 'multiple-choice', 'A meeting is arranged to discuss ___ issues', 'A', workExperienceOptions),
    q(29, 'multiple-choice', 'The student must complete a ___ form', 'B', workExperienceOptions),
    q(30, 'multiple-choice', 'Employers receive a voluntary ___ form', 'F', workExperienceOptions),
  ],
}

const part4: Section = {
  id: 'lt7-part4',
  title: 'Theories of intelligence',
  partLabel: 'Part 4',
  partInstruction: 'Listen and answer questions 31 - 40.',
  groups: [{
    range: 'Questions 31 - 40',
    instruction: 'Complete the notes below. Write ONE WORD ONLY for each answer.',
    blocks: [
      { kind: 'title', text: 'Theories of intelligence' },
      { kind: 'subhead', text: '1st theory (developed by psychologists such as Spearman, 1920s)' },
      { kind: 'text', text: 'Everyone has a particular intelligence quotient (IQ).' },
      { kind: 'note', segments: ["There is no change during a person's ", { blank: 31, width: 'lg' }] },
      { kind: 'text', text: 'Intelligence is seen as genetic in origin.' },
      { kind: 'note', segments: ['This theory is supported by research into the intelligence of ', { blank: 32, width: 'lg' }] },
      { kind: 'subhead', text: '2nd theory (based on the same research)' },
      { kind: 'text', text: 'Intelligence is due to environmental factors.' },
      { kind: 'note', segments: ['Two children from the same family are likely to have similar ', { blank: 33, width: 'lg' }, ', affecting their intelligence.'] },
      { kind: 'subhead', text: 'Evidence:' },
      { kind: 'text', text: "- The Raven's test is used to assess people's ability to reason in an abstract way." },
      { kind: 'note', segments: ['- It found that after moving to a different culture there was an ', { blank: 34, width: 'lg' }, " in children's intelligence."] },
      { kind: 'subhead', text: '3rd theory (Howard Gardner, 1990s)' },
      { kind: 'note', segments: ['People have multiple intelligences, including traditional ones (e.g. linguistic), and non-traditional (e.g. ', { blank: 35, width: 'lg' }, ').'] },
      { kind: 'note', segments: ['It is based on research that suggests specific parts of the ', { blank: 36, width: 'lg' }, ' control specific cognitive abilities.'] },
      { kind: 'note', segments: ['It is supported by the fact that some people have problems identifying a ', { blank: 37, width: 'lg' }, ' but no problems in other related areas.'] },
      { kind: 'note', segments: ["According to Gardner's theory, there is ", { blank: 38, width: 'lg' }, ' between the different intelligences.'] },
      { kind: 'subhead', text: 'This can be used to improve learning:' },
      { kind: 'note', segments: ['Surprisingly, improvements in rhythm may affect ', { blank: 39, width: 'lg' }] },
      { kind: 'note', segments: ['Scientific facts may be easier to remember if learnt as a ', { blank: 40, width: 'lg' }] },
    ],
  }],
  questions: [
    q(31, 'note-completion', "No change during a person's ___", 'life'),
    q(32, 'note-completion', 'Research into the intelligence of ___', 'twins'),
    q(33, 'note-completion', 'Children from the same family have similar ___', 'experiences'),
    q(34, 'note-completion', "There was an ___ in children's intelligence", 'improvement'),
    q(35, 'note-completion', 'A non-traditional intelligence', 'musical'),
    q(36, 'note-completion', 'Specific parts of the ___ control cognitive abilities', 'brain'),
    q(37, 'note-completion', 'Some people have problems identifying a ___', 'face'),
    q(38, 'note-completion', 'There is ___ between different intelligences', 'interaction'),
    q(39, 'note-completion', 'Improvements in rhythm may affect ___', 'spelling'),
    q(40, 'note-completion', 'Scientific facts may be easier to remember as a ___', 'song'),
  ],
}

export const listeningFullTest7: IELTSTest = {
  id: 'ielts-listening-7',
  title: 'IELTS Listening Full Test 7',
  type: 'Academic',
  module: 'Listening',
  duration: 30,
  totalQuestions: 40,
  continuousAudioUrl: AUDIO_URL,
  sections: [part1, part2, part3, part4],
}
