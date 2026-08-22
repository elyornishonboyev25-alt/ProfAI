import type { IELTSTest, ListeningOption, Question, Section } from '../types/ieltsTypes'

// Music Alive Agency / Albany Fishing Competition / End-of-year art exhibition /
// The Mangrove Regeneration Project. The question set and final answer review
// were supplied by the user and checked against the live repository catalogue.
const AUDIO_URL = '/audio/ielts-listening/listening-full-test-8.mp3'
const ALBANY_MAP_URL = '/images/ielts-listening/test8-albany-fishing-map.png'

function q(
  number: number,
  type: Question['type'],
  text: string,
  correctAnswer: string,
  options?: string[],
): Question {
  return { id: `lt8-q${number}`, number, type, text, correctAnswer, options }
}

const part1: Section = {
  id: 'lt8-part1',
  title: 'Music Alive Agency Enquiry Form',
  partLabel: 'Part 1',
  partInstruction: 'Listen and answer questions 1 - 10.',
  groups: [{
    range: 'Questions 1 - 10',
    instruction: 'Complete the notes below. Write ONE WORD OR A NUMBER for each answer.',
    blocks: [
      { kind: 'title', text: 'Music Alive Agency Enquiry Form' },
      { kind: 'example', segments: ['Contact person: Jim Granley'] },
      { kind: 'note', segments: ["Members' details are on a ", { blank: 1, width: 'lg' }] },
      { kind: 'note', segments: ['Type of music represented: modern music (', { blank: 2, width: 'lg' }, ' and jazz)'] },
      { kind: 'note', segments: ['Newsletter comes out once a ', { blank: 3, width: 'lg' }] },
      { kind: 'note', segments: ['Cost of adult membership: £', { blank: 4, width: 'md' }] },
      { kind: 'note', segments: ['Current number of members: ', { blank: 5, width: 'lg' }] },
      { kind: 'note', segments: ['Facilities include: rehearsal rooms and a ', { blank: 6, width: 'lg' }] },
      { kind: 'note', segments: ['There is no charge for ', { blank: 7, width: 'lg' }, ' advice.'] },
      { kind: 'subhead', text: 'To become a member, send:' },
      { kind: 'note', bullet: true, segments: ['a letter with contact details'] },
      { kind: 'note', bullet: true, segments: ['a recent ', { blank: 8, width: 'lg' }] },
      { kind: 'note', segments: ['Address: 707, ', { blank: 9, width: 'lg' }, ' Street, Marbury'] },
      { kind: 'note', segments: ['Contact email: music.', { blank: 10, width: 'lg' }, '@bsu.co.uk'] },
    ],
  }],
  questions: [
    q(1, 'note-completion', "Members' details are on a ___", 'database'),
    q(2, 'note-completion', 'Type of modern music represented', 'rock'),
    q(3, 'note-completion', 'Newsletter comes out once a ___', 'month'),
    q(4, 'note-completion', 'Cost of adult membership', '45'),
    q(5, 'note-completion', 'Current number of members', '750'),
    q(6, 'note-completion', 'Facilities include rehearsal rooms and a ___', 'studio'),
    q(7, 'note-completion', 'There is no charge for ___ advice', 'legal'),
    q(8, 'note-completion', 'A recent item must be sent with the letter', 'recording'),
    q(9, 'note-completion', 'Street name at the agency address', 'Kippax'),
    q(10, 'note-completion', 'Missing word in the contact email', 'talent'),
  ],
}

const part2Mcq: Record<number, string[]> = {
  11: ['a form of identification', 'a competitor number', 'cash for the entrance fee'],
  12: ['equipment for fishing', 'all food for both days', 'fuel for the fishing'],
  13: ['at the registration desk.', 'over the phone.', 'on the internet.'],
  14: ['The time allocated for fishing will end.', 'The fish caught will be judged.', 'The prizes will be awarded to the winners.'],
}

const part2: Section = {
  id: 'lt8-part2',
  title: 'Information for participants in the Albany fishing competition',
  partLabel: 'Part 2',
  partInstruction: 'Listen and answer questions 11 - 20.',
  visualAidUrl: ALBANY_MAP_URL,
  groups: [{
    range: 'Questions 11 - 14',
    instruction: 'Choose the correct letter, A, B or C.',
    blocks: [
      { kind: 'title', text: 'Information for participants in the Albany fishing competition' },
      { kind: 'mcq', blank: 11, prompt: 'What do participants need to take to the registration desk?', options: part2Mcq[11] },
      { kind: 'mcq', blank: 12, prompt: 'What does the entrance fee to the competition include?', options: part2Mcq[12] },
      { kind: 'mcq', blank: 13, prompt: 'Participants without a fishing licence are recommended to apply for one', options: part2Mcq[13] },
      { kind: 'mcq', blank: 14, prompt: 'What will happen at 6pm on Sunday?', options: part2Mcq[14] },
    ],
  }, {
    range: 'Questions 15 - 20',
    instruction: 'Label the map below. Write the correct letter, A-I, next to questions 15-20.',
    blocks: [
      { kind: 'image', src: ALBANY_MAP_URL, alt: 'Albany Fishing Competition Map labelled A to I.' },
      {
        kind: 'grid',
        columns: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'],
        inputMode: true,
        rows: [
          { blank: 15, label: 'Registration area' },
          { blank: 16, label: 'Shore fishing area' },
          { blank: 17, label: 'Boat launching area' },
          { blank: 18, label: 'Judging area' },
          { blank: 19, label: 'Dining area' },
          { blank: 20, label: 'Prize-giving area' },
        ],
      },
    ],
  }],
  questions: [
    q(11, 'multiple-choice', 'What participants need to take to the registration desk', 'A', part2Mcq[11]),
    q(12, 'multiple-choice', 'What the entrance fee includes', 'B', part2Mcq[12]),
    q(13, 'multiple-choice', 'Where to apply for a fishing licence', 'C', part2Mcq[13]),
    q(14, 'multiple-choice', 'What happens at 6pm on Sunday', 'B', part2Mcq[14]),
    q(15, 'matching-information', 'Registration area on the map', 'G'),
    q(16, 'matching-information', 'Shore fishing area on the map', 'A'),
    q(17, 'matching-information', 'Boat launching area on the map', 'C'),
    q(18, 'matching-information', 'Judging area on the map', 'H'),
    q(19, 'matching-information', 'Dining area on the map', 'D'),
    q(20, 'matching-information', 'Prize-giving area on the map', 'B'),
  ],
}

const part3Mcq: Record<number, string[]> = {
  21: ['showing people their work.', 'getting feedback from their tutor.', 'talking to other students about their displays.'],
  22: ['a set of metal sculptures.', 'a series of wooden models.', 'a collection of textile designs.'],
  23: ['Mother Nature', 'Views of Farmland', 'Seasons'],
  24: ['having enough time to set it up', 'choosing which pieces to show', 'filling up all the available space'],
  25: ["She isn't sure whether people will read it.", 'It will be difficult to keep it short enough.', 'It will be hard to clarify the reasons for her work.'],
  26: ['arranging the lighting', 'inviting local journalists', 'providing comment forms'],
}

const exhibitionFeatures = [
  'the realistic colours',
  'the sense of space',
  'the unusual interpretation of the theme',
  'the painting technique',
  'the variety of materials used',
  'the use of light and shade',
]

const exhibitionFeatureOptions: ListeningOption[] = exhibitionFeatures.map((text, index) => ({
  letter: String.fromCharCode(65 + index),
  text,
}))

const part3: Section = {
  id: 'lt8-part3',
  title: 'Preparing for the end-of-year art exhibition',
  partLabel: 'Part 3',
  partInstruction: 'Listen and answer questions 21 - 30.',
  groups: [{
    range: 'Questions 21 - 26',
    instruction: 'Choose the correct letter, A, B or C.',
    blocks: [
      { kind: 'title', text: 'Preparing for the end-of-year art exhibition' },
      { kind: 'mcq', blank: 21, prompt: 'Max and Abby agree that in the art exhibition they are looking forward to', options: part3Mcq[21] },
      { kind: 'mcq', blank: 22, prompt: "In last year's exhibition, both students were impressed by", options: part3Mcq[22] },
      { kind: 'mcq', blank: 23, prompt: 'What has Max decided to call his display?', options: part3Mcq[23] },
      { kind: 'mcq', blank: 24, prompt: 'What does Abby think will be difficult about preparing for their displays?', options: part3Mcq[24] },
      { kind: 'mcq', blank: 25, prompt: 'What does Abby say about the summary they have to write?', options: part3Mcq[25] },
      { kind: 'mcq', blank: 26, prompt: 'What aspect of the display will the students organise themselves?', options: part3Mcq[26] },
    ],
  }, {
    range: 'Questions 27 - 30',
    instruction: 'Which feature do the speakers identify as particularly interesting for each of the following exhibitions they saw? Choose FOUR answers from the box and write the correct letter, A-F, next to questions 27-30.',
    blocks: [{
      kind: 'grid',
      columns: ['A', 'B', 'C', 'D', 'E', 'F'],
      inputMode: true,
      rows: [
        { blank: 27, label: 'On the Water' },
        { blank: 28, label: 'City Life' },
        { blank: 29, label: 'Faces' },
        { blank: 30, label: 'Moods' },
      ],
      options: exhibitionFeatureOptions,
    }],
  }],
  questions: [
    q(21, 'multiple-choice', 'What Max and Abby are looking forward to', 'A', part3Mcq[21]),
    q(22, 'multiple-choice', 'What impressed both students in the previous exhibition', 'B', part3Mcq[22]),
    q(23, 'multiple-choice', "Max's chosen display title", 'A', part3Mcq[23]),
    q(24, 'multiple-choice', 'What Abby thinks will be difficult', 'A', part3Mcq[24]),
    q(25, 'multiple-choice', 'What Abby says about the summary', 'B', part3Mcq[25]),
    q(26, 'multiple-choice', 'What the students will organise themselves', 'C', part3Mcq[26]),
    q(27, 'matching-information', 'Interesting feature of On the Water', 'D', exhibitionFeatures),
    q(28, 'matching-information', 'Interesting feature of City Life', 'B', exhibitionFeatures),
    q(29, 'matching-information', 'Interesting feature of Faces', 'A', exhibitionFeatures),
    q(30, 'matching-information', 'Interesting feature of Moods', 'C', exhibitionFeatures),
  ],
}

const part4: Section = {
  id: 'lt8-part4',
  title: 'The Mangrove Regeneration Project',
  partLabel: 'Part 4',
  partInstruction: 'Listen and answer questions 31 - 40.',
  groups: [{
    range: 'Questions 31 - 40',
    instruction: 'Complete the notes below. Write NO MORE THAN TWO WORDS for each answer.',
    blocks: [
      { kind: 'title', text: 'The Mangrove Regeneration Project' },
      { kind: 'subhead', text: 'Background:' },
      { kind: 'subhead', text: 'Mangrove forests:' },
      { kind: 'note', bullet: true, segments: ['protect coastal areas from ', { blank: 31, width: 'lg' }, ' by the sea'] },
      { kind: 'note', bullet: true, segments: ['are an important habitat for wildlife'] },
      { kind: 'subhead', text: 'Problems:' },
      { kind: 'note', bullet: true, segments: ['mangroves had been used by farmers as ', { blank: 32, width: 'lg' }] },
      { kind: 'note', bullet: true, segments: ['mangroves were poisoned by the use of ', { blank: 33, width: 'lg' }] },
      { kind: 'note', bullet: true, segments: ['local people used the mangroves as a place to put their ', { blank: 34, width: 'lg' }] },
      { kind: 'subhead', text: 'Actions taken to protect the mangroves:' },
      { kind: 'note', bullet: true, segments: ['a barrier which was made of ', { blank: 35, width: 'lg' }, ' was constructed but it failed'] },
      { kind: 'note', bullet: true, segments: ['new mangroves had to be grown from seed'] },
      { kind: 'note', bullet: true, segments: ['the seeds of the ', { blank: 36, width: 'lg' }, ' mangrove were used'] },
      { kind: 'subhead', text: 'First set of seedlings:' },
      { kind: 'note', bullet: true, segments: ['kept in small pots in a ', { blank: 37, width: 'lg' }] },
      { kind: 'note', bullet: true, segments: ['watered with ', { blank: 38, width: 'lg' }, ' water'] },
      { kind: 'note', bullet: true, segments: ['planted out on south side of a small island'] },
      { kind: 'note', bullet: true, segments: ['at risk from the large ', { blank: 39, width: 'lg' }, ' population'] },
      { kind: 'subhead', text: 'Second set of seedlings:' },
      { kind: 'note', bullet: true, segments: ['planted in the seabed near established mangrove roots'] },
      { kind: 'note', bullet: true, segments: ['the young plants were destroyed in a ', { blank: 40, width: 'lg' }] },
      { kind: 'text', text: 'Results: The first set of seedlings was successful.' },
    ],
  }],
  questions: [
    q(31, 'note-completion', 'What mangrove forests protect coastal areas from', 'flooding'),
    q(32, 'note-completion', 'What farmers used mangroves as', 'firewood'),
    q(33, 'note-completion', 'What poisoned the mangroves', 'fertilizer'),
    q(34, 'note-completion', 'What local people put in the mangroves', 'trash'),
    q(35, 'note-completion', 'Material used for the failed barrier', 'sand'),
    q(36, 'note-completion', 'Type of mangrove seed used', 'grey'),
    q(37, 'note-completion', 'Where the first seedlings were kept', 'hot house'),
    q(38, 'note-completion', 'Type of water used for the seedlings', 'salty'),
    q(39, 'note-completion', 'Population that put the seedlings at risk', 'rabbit'),
    q(40, 'note-completion', 'What destroyed the second set of seedlings', 'storm'),
  ],
}

export const listeningFullTest8: IELTSTest = {
  id: 'ielts-listening-8',
  title: 'IELTS Listening Full Test 8',
  type: 'Academic',
  module: 'Listening',
  duration: 30,
  totalQuestions: 40,
  continuousAudioUrl: AUDIO_URL,
  sections: [part1, part2, part3, part4],
}
