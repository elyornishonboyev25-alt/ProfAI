import type { IELTSTest, ListeningOption, Question, Section } from '../types/ieltsTypes'

// Amateur Dramatic Society / Clifton Bird Park / Geology field trip to Iceland /
// Crisis Communication Theory. The supplied recording is IELTS Listening 59435;
// the question set and answer key were cross-checked against the recording transcript
// and the live repository catalogue before release.
const AUDIO_URL = '/audio/ielts-listening/listening-full-test-9.mp3'
const CLIFTON_BIRD_PARK_MAP_URL = '/images/ielts-listening/test9-clifton-bird-park-map.png'

function q(
  number: number,
  type: Question['type'],
  text: string,
  correctAnswer: string,
  options?: string[],
): Question {
  return { id: `lt9-q${number}`, number, type, text, correctAnswer, options }
}

const part1: Section = {
  id: 'lt9-part1',
  title: 'Amateur Dramatic Society',
  partLabel: 'Part 1',
  partInstruction: 'Listen and answer questions 1 - 10.',
  groups: [{
    range: 'Questions 1 - 10',
    instruction: 'Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer.',
    blocks: [
      { kind: 'title', text: 'Amateur Dramatic Society' },
      { kind: 'text', text: 'Secretary: Jane Caulifield' },
      { kind: 'text', text: 'Mailing address: 117 Garden Road, Prestwin' },
      { kind: 'note', segments: ['Location for rehearsals: The ', { blank: 1, width: 'lg' }, ' House, Wynn'] },
      { kind: 'text', text: 'No experience necessary' },
      { kind: 'note', segments: ['They need actors and ', { blank: 2, width: 'lg' }, ' singers'] },
      { kind: 'note', segments: ['Also need people who can ', { blank: 3, width: 'lg' }] },
      { kind: 'note', segments: ['Meetings 6–8 p.m. every ', { blank: 4, width: 'lg' }] },
      { kind: 'note', segments: ['Closed in ', { blank: 5, width: 'lg' }, ' (for 2 weeks)'] },
      { kind: 'subhead', text: 'Membership costs:' },
      { kind: 'text', text: 'Standard: £40' },
      { kind: 'note', segments: ['(includes a ', { blank: 6, width: 'lg' }, ' once a year)'] },
      { kind: 'note', segments: ['Over 60s or unemployed: £', { blank: 7, width: 'lg' }] },
      { kind: 'note', segments: ['Youth group: for people aged ', { blank: 8, width: 'lg' }, ' years old and under'] },
      { kind: 'subhead', text: 'Shows:' },
      { kind: 'note', bullet: true, segments: ['mostly plays by ', { blank: 9, width: 'lg' }, ' authors'] },
      { kind: 'note', bullet: true, segments: ['Family show in December'] },
      { kind: 'note', segments: ["(raises money for children's ", { blank: 10, width: 'lg' }, ')'] },
    ],
  }],
  questions: [
    q(1, 'note-completion', 'Location for rehearsals: The ___ House, Wynn', 'club'),
    q(2, 'note-completion', 'They need actors and ___ singers', 'male'),
    q(3, 'note-completion', 'They also need people who can ___', 'drive'),
    q(4, 'note-completion', 'Meetings are held every ___', 'Tuesday'),
    q(5, 'note-completion', 'The society is closed for two weeks in ___', 'August'),
    q(6, 'note-completion', 'Standard membership includes a ___ once a year', 'dinner'),
    q(7, 'note-completion', 'Membership cost for over 60s or unemployed people', '25'),
    q(8, 'note-completion', 'Maximum age for the youth group', '16'),
    q(9, 'note-completion', 'Most plays are by ___ authors', 'modern'),
    q(10, 'note-completion', "The family show raises money for the children's ___", 'hospital'),
  ],
}

const part2Mcq: Record<number, string[]> = {
  11: ['birds that are now endangered.', 'birds from all over the world.', 'birds that are common in the local area.'],
  12: ['must work at weekends.', 'need to come at least once a month.', 'will only be required in the busy season.'],
  13: ['someone who can work independently', 'someone who is willing to work in any weather', 'someone who knows a lot about plants'],
  14: ['international visitors.', 'local people from Clifton.', 'school groups.'],
  15: ['food and drink', 'transport', 'tools'],
}

const part2: Section = {
  id: 'lt9-part2',
  title: 'Information for Volunteers at Clifton Bird Park',
  partLabel: 'Part 2',
  partInstruction: 'Listen and answer questions 11 - 20.',
  visualAidUrl: CLIFTON_BIRD_PARK_MAP_URL,
  groups: [{
    range: 'Questions 11 - 15',
    instruction: 'Choose the correct letter, A, B or C.',
    blocks: [
      { kind: 'title', text: 'Information for Volunteers at Clifton Bird Park' },
      { kind: 'mcq', blank: 11, prompt: 'The speaker stresses the importance to Clifton Bird Park of', options: part2Mcq[11] },
      { kind: 'mcq', blank: 12, prompt: 'People who volunteer to help with gardening at the park', options: part2Mcq[12] },
      { kind: 'mcq', blank: 13, prompt: 'According to the speaker, who would be the ideal gardening volunteer?', options: part2Mcq[13] },
      { kind: 'mcq', blank: 14, prompt: 'Volunteer guides will mainly be working with', options: part2Mcq[14] },
      { kind: 'mcq', blank: 15, prompt: 'What is still required for the Maintenance Day at the bird park?', options: part2Mcq[15] },
    ],
  }, {
    range: 'Questions 16 - 20',
    instruction: 'Label the map below. Write the correct letter, A-H, next to questions 16-20.',
    blocks: [
      {
        kind: 'image',
        src: CLIFTON_BIRD_PARK_MAP_URL,
        alt: 'Original Clifton Bird Park map labelled A to H.',
      },
      {
        kind: 'grid',
        columns: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
        inputMode: true,
        rows: [
          { blank: 16, label: 'Wooden bridge' },
          { blank: 17, label: 'Observation tower' },
          { blank: 18, label: 'Visitor cabins' },
          { blank: 19, label: 'Nesting boxes' },
          { blank: 20, label: 'Boat sheds' },
        ],
      },
    ],
  }],
  questions: [
    q(11, 'multiple-choice', 'The speaker stresses the importance to Clifton Bird Park of', 'A', part2Mcq[11]),
    q(12, 'multiple-choice', 'People who volunteer to help with gardening at the park', 'B', part2Mcq[12]),
    q(13, 'multiple-choice', 'The ideal gardening volunteer', 'B', part2Mcq[13]),
    q(14, 'multiple-choice', 'Volunteer guides will mainly be working with', 'A', part2Mcq[14]),
    q(15, 'multiple-choice', 'What is still required for the Maintenance Day', 'B', part2Mcq[15]),
    q(16, 'matching-information', 'Wooden bridge on the map', 'F'),
    q(17, 'matching-information', 'Observation tower on the map', 'H'),
    q(18, 'matching-information', 'Visitor cabins on the map', 'C'),
    q(19, 'matching-information', 'Nesting boxes on the map', 'E'),
    q(20, 'matching-information', 'Boat sheds on the map', 'B'),
  ],
}

const part3Mcq: Record<number, string[]> = {
  21: ['it is the most relevant to their field trip', 'it also applies to caves', 'it covers the whole country'],
  22: ['they fail to recognize rare species of plant', "they don't realize how fragile the environment is", 'they get too absorbed in their tasks'],
  23: ['Leave the area in its natural state', 'Avoid removing fossils', 'Keep collecting to a minimum'],
  24: ['taking them from private land', 'taking them from rock faces', 'taking them from man-made structures'],
  25: ['falling rock', 'tidal movements', 'unstable sand'],
}

const readingPackTopics = [
  'unique geological features of Iceland',
  'replacement of fossil fuels',
  'negative changes due to human activity',
  'energy for agriculture',
  'health risks of eruptions',
  'risk of flooding',
  'long-term effects of volcanoes',
]

const readingPackTopicOptions: ListeningOption[] = readingPackTopics.map((text, index) => ({
  letter: String.fromCharCode(65 + index),
  text,
}))

const part3: Section = {
  id: 'lt9-part3',
  title: 'Geology field trip to Iceland',
  partLabel: 'Part 3',
  partInstruction: 'Listen and answer questions 21 - 30.',
  groups: [{
    range: 'Questions 21 - 25',
    instruction: 'Choose the correct letter, A, B or C.',
    blocks: [
      { kind: 'title', text: 'Geology field trip to Iceland' },
      { kind: 'mcq', blank: 21, prompt: 'Why do Andrew and Sarah decide to mention the Mountain Code?', options: part3Mcq[21] },
      { kind: 'mcq', blank: 22, prompt: 'Andrew suggests some field trip participants harm the environment because', options: part3Mcq[22] },
      { kind: 'mcq', blank: 23, prompt: 'Which rule about taking samples is most important?', options: part3Mcq[23] },
      { kind: 'mcq', blank: 24, prompt: 'Which aspect of taking samples do they still have to find out about?', options: part3Mcq[24] },
      { kind: 'mcq', blank: 25, prompt: 'What danger in coastal areas do they decide to emphasise?', options: part3Mcq[25] },
    ],
  }, {
    range: 'Questions 26 - 30',
    instruction: 'Which topics does each of the following reading packs focus on? Choose FIVE answers from the box and write the correct letter, A-G, next to questions 26-30.',
    blocks: [{
      kind: 'grid',
      columns: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
      inputMode: true,
      rows: [
        { blank: 26, label: 'Geothermal Fields' },
        { blank: 27, label: 'The Hot Spot' },
        { blank: 28, label: 'Glaciers' },
        { blank: 29, label: 'Basalt Rock' },
        { blank: 30, label: 'Geothermal Power Plants' },
      ],
      options: readingPackTopicOptions,
    }],
  }],
  questions: [
    q(21, 'multiple-choice', 'Why Andrew and Sarah decide to mention the Mountain Code', 'A', part3Mcq[21]),
    q(22, 'multiple-choice', 'Why some field trip participants harm the environment', 'C', part3Mcq[22]),
    q(23, 'multiple-choice', 'The most important rule about taking samples', 'C', part3Mcq[23]),
    q(24, 'multiple-choice', 'The aspect of taking samples they still need to investigate', 'C', part3Mcq[24]),
    q(25, 'multiple-choice', 'The coastal danger they decide to emphasise', 'B', part3Mcq[25]),
    q(26, 'matching-information', 'Topic of the Geothermal Fields reading pack', 'D', readingPackTopics),
    q(27, 'matching-information', 'Topic of The Hot Spot reading pack', 'A', readingPackTopics),
    q(28, 'matching-information', 'Topic of the Glaciers reading pack', 'F', readingPackTopics),
    q(29, 'matching-information', 'Topic of the Basalt Rock reading pack', 'G', readingPackTopics),
    q(30, 'matching-information', 'Topic of the Geothermal Power Plants reading pack', 'B', readingPackTopics),
  ],
}

const part4: Section = {
  id: 'lt9-part4',
  title: 'Crisis Communication Theory',
  partLabel: 'Part 4',
  partInstruction: 'Listen and answer questions 31 - 40.',
  groups: [{
    range: 'Questions 31 - 40',
    instruction: 'Complete the notes below. Write ONE WORD ONLY for each answer.',
    blocks: [
      { kind: 'title', text: 'Crisis Communication Theory' },
      { kind: 'subhead', text: 'Why do we need theory?' },
      { kind: 'note', segments: ['Some people think using ', { blank: 31, width: 'lg' }, ' is better than theory'] },
      { kind: 'note', segments: ['But a lot of advice is simply a ', { blank: 32, width: 'lg' }] },
      { kind: 'subhead', text: 'Type of crisis' },
      { kind: 'note', segments: ['The organization can be a victim, e.g. due to a ', { blank: 33, width: 'lg' }] },
      { kind: 'text', text: 'Crisis can be accidental – caused by external factors in the organization' },
      { kind: 'note', segments: ['Crisis can be preventable – resulting from a ', { blank: 34, width: 'lg' }] },
      { kind: 'subhead', text: 'Suggested response for all crises' },
      { kind: 'text', text: 'Give information to prevent any more damage' },
      { kind: 'note', segments: ['Communicate what ', { blank: 35, width: 'lg' }, ' is to be taken'] },
      { kind: 'subhead', text: "Strategies to influence people's thinking" },
      { kind: 'text', text: 'Diminish the crisis' },
      { kind: 'note', bullet: true, segments: ['provide ', { blank: 36, width: 'lg' }, ' that the crisis is not so bad'] },
      { kind: 'subhead', text: 'Give excuses for the crisis' },
      { kind: 'note', bullet: true, segments: ['highlight that it was not intentional'] },
      { kind: 'subhead', text: "Protecting the organization's reputation" },
      { kind: 'note', segments: ['Initial objective is to lessen ', { blank: 37, width: 'lg' }, ' opinions'] },
      { kind: 'subhead', text: "'Rebuild strategies' are important when:" },
      { kind: 'note', bullet: true, segments: ['there is a serious ', { blank: 38, width: 'lg' }, " to the organization's reputation"] },
      { kind: 'note', bullet: true, segments: ['the impact of the crisis needs lessening'] },
      { kind: 'note', segments: ['Things can be improved by providing an ', { blank: 39, width: 'lg' }] },
      { kind: 'note', segments: ['In serious cases, ', { blank: 40, width: 'lg' }, ' is usually offered'] },
    ],
  }],
  questions: [
    q(31, 'note-completion', 'What some people think is better than theory', 'logic'),
    q(32, 'note-completion', 'What a lot of advice is simply', 'guess'),
    q(33, 'note-completion', 'What can cause an organization to be a victim', 'rumour / rumor'),
    q(34, 'note-completion', 'What a preventable crisis can result from', 'mistake'),
    q(35, 'note-completion', 'What is to be taken', 'action'),
    q(36, 'note-completion', 'What shows that the crisis is not so bad', 'proof'),
    q(37, 'note-completion', 'What kind of opinions should be lessened', 'negative'),
    q(38, 'note-completion', "What can seriously affect the organization's reputation", 'threat'),
    q(39, 'note-completion', 'What can improve things', 'apology'),
    q(40, 'note-completion', 'What is usually offered in serious cases', 'compensation'),
  ],
}

export const listeningFullTest9: IELTSTest = {
  id: 'ielts-listening-9',
  title: 'IELTS Listening Full Test 9',
  type: 'Academic',
  module: 'Listening',
  duration: 30,
  totalQuestions: 40,
  continuousAudioUrl: AUDIO_URL,
  sections: [part1, part2, part3, part4],
}
