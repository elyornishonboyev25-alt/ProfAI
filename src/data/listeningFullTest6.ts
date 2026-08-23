import type { IELTSTest, Question, Section } from '../types/ieltsTypes'

// Listening Full Test 6 — Problems with flat / Queensland Festival /
// Presentation and feedback / Research in child psychology.
// The continuous recording, complete question set, and answer key were supplied by the user.
const AUDIO_URL = '/audio/ielts-listening/listening-full-test-6.mp3'

function q(
  number: number,
  type: Question['type'],
  text: string,
  correctAnswer: string,
  options?: string[],
): Question {
  return { id: `lt6-q${number}`, number, type, text, correctAnswer, options }
}

const part1Options: Record<number, string[]> = {
  7: ['The glass may be cracked', 'The lock may be broken', 'The frame may need repainting'],
  8: ['after the washing machine is examined.', 'when the lights are being repaired.', 'before the main switch is renewed.'],
  9: ['checked.', 'replaced.', 'renewed.'],
  10: ['the paintwork', 'the glue', 'the carpet'],
}

const part1: Section = {
  id: 'lt6-part1',
  title: 'Problems with flat',
  partLabel: 'Part 1',
  partInstruction: 'Listen and answer questions 1 - 10.',
  groups: [{
    range: 'Questions 1 - 6',
    instruction: 'Complete the sentences below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.',
    blocks: [
      { kind: 'title', text: 'Problems with flat' },
      { kind: 'text', text: 'Elinor has been in the flat for 3 months.' },
      { kind: 'note', segments: ['Elinor shares the flat with her ', { blank: 1, width: 'lg' }] },
      { kind: 'note', segments: ["Elinor must contact the landlord's ", { blank: 2, width: 'lg' }, ' about the repairs.'] },
      { kind: 'text', text: 'The repairs cannot be started until next week.' },
      { kind: 'note', segments: ['Elinor may have to pay £', { blank: 3, width: 'md' }, ' towards some repairs.'] },
      { kind: 'note', segments: ['The agent suggests that Elinor should contact a ', { blank: 4, width: 'lg' }, ' for urgent repairs.'] },
      { kind: 'note', segments: ['Elinor can be contacted on her ', { blank: 5, width: 'lg' }, ' number.'] },
      { kind: 'note', segments: ['Elinor will need to sign the ', { blank: 6, width: 'lg' }, ' after repairs are completed.'] },
    ],
  }, {
    range: 'Questions 7 - 10',
    instruction: 'Choose the correct letter, A, B or C.',
    blocks: [
      { kind: 'mcq', blank: 7, prompt: 'According to the agent, what may be the problem with the bathroom window?', options: part1Options[7] },
      { kind: 'mcq', blank: 8, prompt: 'The agent says that the electricity should be checked', options: part1Options[8] },
      { kind: 'mcq', blank: 9, prompt: 'The agent thinks the central heating system should be', options: part1Options[9] },
      { kind: 'mcq', blank: 10, prompt: 'What was the problem in the hall?', options: part1Options[10] },
    ],
  }],
  questions: [
    q(1, 'note-completion', 'Elinor shares the flat with her', 'cousin'),
    q(2, 'note-completion', "Elinor must contact the landlord's ___ about the repairs", 'service manager'),
    q(3, 'note-completion', 'Amount Elinor may have to pay towards some repairs', '50'),
    q(4, 'note-completion', 'Who Elinor should contact for urgent repairs', 'private company'),
    q(5, 'note-completion', 'Type of contact number', 'mobile'),
    q(6, 'note-completion', 'What Elinor must sign after repairs are completed', 'agreement'),
    q(7, 'multiple-choice', 'Possible problem with the bathroom window', 'B', part1Options[7]),
    q(8, 'multiple-choice', 'When the electricity should be checked', 'A', part1Options[8]),
    q(9, 'multiple-choice', 'What should happen to the central heating system', 'A', part1Options[9]),
    q(10, 'multiple-choice', 'Problem in the hall', 'C', part1Options[10]),
  ],
}

const part2Options: Record<number, string[]> = {
  11: ['there will be free entry', 'there will be fewer people', 'there will be special classes'],
  12: ['weekends only', 'every evening', 'every afternoon'],
  13: ['the tickets will be cheaper there', 'you can get tickets in advance there', "it's easier to get tickets there than in the city"],
  14: ['its gardens', 'its architecture', 'its location'],
  15: ['it will be much larger than before.', 'there will be free entertainment.', 'the food will be cooked by international chefs.'],
  16: ['see a steam engine working', "dress up in a railway worker's uniform", 'have a meal inside an old train'],
}

const steamTrainOptions = [
  'an educational talk',
  "a children's book",
  'a short film',
  'a flag',
  'a tour of the Ipswich Museum',
]

const votingOptions = [
  'People of any age may vote',
  'You may send in your vote by email',
  'Only local residents may vote',
  'You may vote several times',
  'Voting ends at midnight on Saturday',
]

const part2: Section = {
  id: 'lt6-part2',
  title: 'Queensland Festival',
  partLabel: 'Part 2',
  partInstruction: 'Listen and answer questions 11 - 20.',
  groups: [{
    range: 'Questions 11 - 16',
    instruction: 'Choose the correct letter, A, B or C.',
    blocks: [
      { kind: 'title', text: 'Queensland Festival' },
      { kind: 'mcq', blank: 11, prompt: 'Why does Jane recommend visiting the Music Tent on Tuesday?', options: part2Options[11] },
      { kind: 'mcq', blank: 12, prompt: 'When do the educational workshops take place in the Music Tent?', options: part2Options[12] },
      { kind: 'mcq', blank: 13, prompt: 'Why does Jane recommend going to the library to buy a ticket?', options: part2Options[13] },
      { kind: 'mcq', blank: 14, prompt: 'What will history lovers find interesting about Macquarie House?', options: part2Options[14] },
      { kind: 'mcq', blank: 15, prompt: 'The Big Barbecue is different this year because', options: part2Options[15] },
      { kind: 'mcq', blank: 16, prompt: 'What can you do at the Railway Museum?', options: part2Options[16] },
    ],
  }, {
    range: 'Questions 17 - 20',
    instruction: 'Choose TWO letters, A-E, for each question.',
    blocks: [
      { kind: 'multi-mcq', blanks: [17, 18], prompt: 'Which TWO free things does the family ticket on the steam train include?', options: steamTrainOptions, selectionLimit: 2 },
      { kind: 'multi-mcq', blanks: [19, 20], prompt: 'Which TWO things apply when voting for Our Favourite Place?', options: votingOptions, selectionLimit: 2 },
    ],
  }],
  questions: [
    q(11, 'multiple-choice', 'Why Jane recommends Tuesday at the Music Tent', 'B', part2Options[11]),
    q(12, 'multiple-choice', 'When educational workshops take place', 'C', part2Options[12]),
    q(13, 'multiple-choice', 'Why Jane recommends buying a ticket at the library', 'A', part2Options[13]),
    q(14, 'multiple-choice', 'What history lovers will find interesting about Macquarie House', 'C', part2Options[14]),
    q(15, 'multiple-choice', 'Why the Big Barbecue is different this year', 'B', part2Options[15]),
    q(16, 'multiple-choice', 'What visitors can do at the Railway Museum', 'C', part2Options[16]),
    q(17, 'multiple-choice', 'First free item included with the family steam-train ticket', 'B', steamTrainOptions),
    q(18, 'multiple-choice', 'Second free item included with the family steam-train ticket', 'D', steamTrainOptions),
    q(19, 'multiple-choice', 'First rule for voting for Our Favourite Place', 'A', votingOptions),
    q(20, 'multiple-choice', 'Second rule for voting for Our Favourite Place', 'D', votingOptions),
  ],
}

const part3: Section = {
  id: 'lt6-part3',
  title: 'Notes on Presentation and Feedback',
  partLabel: 'Part 3',
  partInstruction: 'Listen and answer questions 21 - 30.',
  groups: [{
    range: 'Questions 21 - 30',
    instruction: 'Complete the notes below. Write NO MORE THAN THREE WORDS for each answer.',
    blocks: [
      { kind: 'title', text: 'NOTES ON PRESENTATION AND FEEDBACK' },
      { kind: 'subhead', text: 'Timing' },
      { kind: 'text', text: 'Likely period of presentation: 14th – 24th June' },
      { kind: 'note', segments: ['Time of day: ', { blank: 21, width: 'lg' }] },
      { kind: 'subhead', text: 'Format' },
      { kind: 'note', segments: ['First part: 40-minute presentation to the ', { blank: 22, width: 'lg' }] },
      { kind: 'text', text: 'Second part: 20-minute interview with Dr Brown' },
      { kind: 'subhead', text: 'Requirements' },
      { kind: 'text', text: 'Must bring to discussion:' },
      { kind: 'note', bullet: true, segments: ['material used in presentation'] },
      { kind: 'note', bullet: true, segments: [{ blank: 23, width: 'lg' }] },
      { kind: 'note', bullet: true, segments: [{ blank: 24, width: 'lg' }] },
      { kind: 'note', bullet: true, segments: ['book list'] },
      { kind: 'subhead', text: 'Feedback (given during interview)' },
      { kind: 'text', text: 'Students will receive:' },
      { kind: 'note', bullet: true, segments: [{ blank: 25, width: 'lg' }] },
      { kind: 'note', bullet: true, segments: ["'thinking questions'"] },
      { kind: 'subhead', text: 'Criteria' },
      { kind: 'text', text: 'Good projects will show the student:' },
      { kind: 'note', bullet: true, segments: ['has done ', { blank: 26, width: 'lg' }] },
      { kind: 'note', bullet: true, segments: ['has ability to ', { blank: 27, width: 'lg' }] },
      { kind: 'note', bullet: true, segments: ['has ability to present ', { blank: 28, width: 'lg' }] },
      { kind: 'subhead', text: 'Next stage' },
      { kind: 'note', segments: ['Stage Two: produce ', { blank: 29, width: 'lg' }] },
      { kind: 'note', bullet: true, segments: ['do data analysis'] },
      { kind: 'subhead', text: 'Further information from website:' },
      { kind: 'note', segments: ['www.', { blank: 30, width: 'lg' }, '.com'] },
    ],
  }],
  questions: [
    q(21, 'note-completion', 'Time of day', 'early evening'),
    q(22, 'note-completion', 'Audience for the 40-minute presentation', 'seminar group'),
    q(23, 'note-completion', 'First additional item required for the discussion', 'list of objectives'),
    q(24, 'note-completion', 'Second additional item required for the discussion', 'project outline'),
    q(25, 'note-completion', 'Feedback item students will receive', 'checklist'),
    q(26, 'note-completion', 'What good projects show the student has done', 'wide reading'),
    q(27, 'note-completion', 'Research ability shown by a good project', 'design research'),
    q(28, 'note-completion', 'What the student can present', 'a clear argument'),
    q(29, 'note-completion', 'What students produce in Stage Two', 'theory chapters'),
    q(30, 'note-completion', 'Website name', 'studentlink'),
  ],
}

const part4Options = ['the influence of the mother.', 'early speech patterns.', 'development before birth.']

const part4: Section = {
  id: 'lt6-part4',
  title: 'Research in Child Psychology',
  partLabel: 'Part 4',
  partInstruction: 'Listen and answer questions 31 - 40.',
  groups: [{
    range: 'Questions 31 - 39',
    instruction: 'Complete the notes below. Write NO MORE THAN TWO WORDS for each answer.',
    blocks: [
      { kind: 'title', text: 'Research in child psychology' },
      { kind: 'subhead', text: 'Developmental Aspects' },
      { kind: 'text', text: 'Past: Three aspects of development: social, cognitive, emotional.' },
      { kind: 'note', segments: ['Present: These aspects now regarded as being ', { blank: 31, width: 'lg' }] },
      { kind: 'subhead', text: 'Context of Behaviour' },
      { kind: 'note', segments: ['Past: Behaviour was studied in artificial contexts. Example: ', { blank: 32, width: 'lg' }, ' (was related to behaviour of animals in ', { blank: 33, width: 'lg' }, ').'] },
      { kind: 'note', segments: ["Present: Awareness that child's behaviour is influenced by his/her ", { blank: 34, width: 'lg' }, ' and the situation he/she is in.'] },
      { kind: 'subhead', text: 'Developmental Influence' },
      { kind: 'note', segments: ['Past: Child was seen as being ', { blank: 35, width: 'lg' }, '. Parents were held responsible for way child developed.'] },
      { kind: 'note', segments: ["Present: No direct link between early influences and child's ", { blank: 36, width: 'lg' }] },
      { kind: 'subhead', text: 'Major Influences' },
      { kind: 'note', segments: ['Past: Influence of Piaget. Young children were believed to be ', { blank: 37, width: 'lg' }] },
      { kind: 'text', text: 'Present: Influence of Harriet Reingold: Examples show that children are aware of other people.' },
      { kind: 'subhead', text: 'Cultural Factors' },
      { kind: 'note', segments: ['Past: Psychologists did not take culture into account. Example: importance of ', { blank: 38, width: 'lg' }, ' for babies.'] },
      { kind: 'note', segments: ['Present: Guatemalan study — babies are kept in the ', { blank: 39, width: 'lg' }, ' for first year. No effect on later development.'] },
    ],
  }, {
    range: 'Question 40',
    instruction: 'Choose the correct letter, A, B or C.',
    blocks: [
      { kind: 'mcq', blank: 40, prompt: 'The speaker thinks that one topic which will be examined closely in future is', options: part4Options },
    ],
  }],
  questions: [
    q(31, 'note-completion', 'How the three aspects of development are now regarded', 'connected'),
    q(32, 'note-completion', 'Example of behaviour studied in an artificial context', 'learning'),
    q(33, 'note-completion', 'Where animal behaviour was studied', 'laboratories'),
    q(34, 'note-completion', "What influences a child's behaviour", 'background'),
    q(35, 'note-completion', 'How a child was seen in the past', 'passive'),
    q(36, 'note-completion', 'What has no direct link with early influences', 'personality'),
    q(37, 'note-completion', 'How young children were believed to be', 'self-centered/self-centred'),
    q(38, 'note-completion', 'Cultural factor important for babies', 'stimulation'),
    q(39, 'note-completion', 'Where Guatemalan babies are kept for the first year', 'house'),
    q(40, 'multiple-choice', 'Topic expected to be examined closely in future', 'C', part4Options),
  ],
}

export const listeningFullTest6: IELTSTest = {
  id: 'ielts-listening-6',
  title: 'IELTS Listening Full Test 6',
  type: 'Academic',
  module: 'Listening',
  duration: 30,
  totalQuestions: 40,
  continuousAudioUrl: AUDIO_URL,
  sections: [part1, part2, part3, part4],
}
