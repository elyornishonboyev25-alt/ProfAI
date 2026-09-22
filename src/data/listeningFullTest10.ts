import type { IELTSTest, ListeningOption, Question, Section } from '../types/ieltsTypes'

const AUDIO_URL = '/audio/ielts-listening/listening-full-test-10.mp3'

function q(number: number, type: Question['type'], text: string, correctAnswer: string, options?: string[]): Question {
  return { id: `lt10-q${number}`, number, type, text, correctAnswer, options }
}

const part1: Section = {
  id: 'lt10-part1', title: 'Poppy Reserve', partLabel: 'Part 1', partInstruction: 'Listen and answer questions 1 - 10.',
  groups: [
    { range: 'Questions 1 - 5', instruction: 'Complete the notes below. Write ONE WORD ONLY for each answer.', blocks: [
      { kind: 'title', text: 'Poppy Reserve' }, { kind: 'subhead', text: 'Almond Valley Poppy Reserve is a nature reserve.' },
      { kind: 'note', segments: ['The poppies will be at their best at the end of the ', { blank: 1, width: 'lg' }] },
      { kind: 'note', segments: ['The poppies on the hills are ', { blank: 2, width: 'lg' }, ' in colour.'] },
      { kind: 'note', segments: ['The reserve is located to the ', { blank: 3, width: 'lg' }, ' of Lakeside.'] },
      { kind: 'text', text: 'The best time for photography is mid-afternoon.' },
      { kind: 'note', segments: ['Wear ', { blank: 4, width: 'lg' }, ' because of rattlesnakes.'] },
      { kind: 'note', segments: ['The reserve is a ', { blank: 5, width: 'lg' }, ' park.'] },
    ] },
    { range: 'Questions 6 - 10', instruction: 'Complete the table below. Write ONE WORD AND/OR A NUMBER for each answer.', blocks: [
      { kind: 'table', columns: ['Tour', 'Start time', 'Duration', 'Highlights', 'Photography'], rows: [
        [
          { segments: ['The ', { blank: 6 }, ' tour'] },
          { segments: ['Every hour from 7:30 a.m.'] },
          { segments: ['30 minutes'] },
          { segments: ['viewpoints, film and the ', { blank: 7 }] },
          { segments: ['panoramic pictures'] },
        ],
        [
          { segments: ['The Wildflower tour'] },
          { segments: ['Every two hours from 8:00 a.m.'] },
          { segments: [{ blank: 8 }] },
          { segments: ['poppy, cream cup, and sage'] },
          { segments: ['close-up tips'] },
        ],
        [
          { segments: ['The Wildlife tour'] },
          { segments: [{ blank: 9 }, ' a.m. or 7:00 p.m.'] },
          { segments: ['1.5 hours'] },
          { segments: ['coyote, quail, roadrunners'] },
          { segments: ['bring a tripod and a ', { blank: 10 }, ' lens'] },
        ],
      ] },
    ] },
  ],
  questions: [
    q(1, 'note-completion', 'Poppies are at their best at the end of the ___', 'month'), q(2, 'note-completion', 'Colour of the poppies on the hills', 'orange'), q(3, 'note-completion', 'Location of the reserve from Lakeside', 'east'), q(4, 'note-completion', 'What visitors should wear because of rattlesnakes', 'trousers'), q(5, 'note-completion', 'Type of park', 'state'),
    q(6, 'note-completion', 'Name of the first tour', 'general'), q(7, 'note-completion', 'Other highlight of the general tour', 'museum'), q(8, 'note-completion', 'Duration of the Wildflower tour', 'one hour / 1 hour'), q(9, 'note-completion', 'Morning start time of the Wildlife tour', '5:30 / 5.30'), q(10, 'note-completion', 'Lens recommended for the Wildlife tour', 'zoom'),
  ],
}

const part2Mcq: Record<number, string[]> = {
  11: ['he is sometimes cold at night.', 'he always gets up early.', 'he has time to himself.'],
  12: ['It takes time to prepare.', 'It is difficult to get used to.', 'It has to be eaten quickly.'],
  13: ['they are sometimes too tired to eat.', 'they mainly have fruit and berries.', "they talk about what they've done."],
  14: ['to mend broken tools and implements.', 'to maintain a good source of heat.', 'to collect sufficient firewood.'],
  15: ['do varied activities.', 'share their knowledge.', 'get a lot of exercise.'],
}
const roundhouseOptions: ListeningOption[] = [
  ['A', 'bone'], ['B', 'different'], ['C', 'equal'], ['D', 'elm'], ['E', 'hazel'], ['F', 'iron'], ['G', 'peg'], ['H', 'roof'], ['I', 'scaffold'],
].map(([letter, text]) => ({ letter, text }))
const part2: Section = {
  id: 'lt10-part2', title: 'Re-creating life in an Iron Age village', partLabel: 'Part 2', partInstruction: 'Listen and answer questions 11 - 20.',
  groups: [
    { range: 'Questions 11 - 15', instruction: 'Choose the correct letter, A, B or C.', blocks: [
      { kind: 'title', text: 'Re-creating life in an Iron Age village' },
      ...[11, 12, 13, 14, 15].map((blank) => ({ kind: 'mcq' as const, blank, prompt: [
        'Jim says that in the Iron Age village', 'What does Jim say about the food they eat in the village?', 'Jim says that at the evening meal', 'The most important job for the blacksmith is', 'Jim likes the fact that in the village, people',
      ][blank - 11], options: part2Mcq[blank] })),
    ] },
    { range: 'Questions 16 - 20', instruction: 'Complete the flow-chart below. Choose FIVE answers from the box and write the correct letter, A-I, next to questions 16-20.', blocks: [{
      kind: 'grid', columns: roundhouseOptions.map((option) => option.letter), inputMode: true, options: roundhouseOptions,
      rows: [{ blank: 16, label: 'Mark centre of planned house with a ___ around it' }, { blank: 17, label: 'Dig ground using tools made from ___' }, { blank: 18, label: 'Insert centre post and build a wooden ___ around it' }, { blank: 19, label: 'Complete roof framework using ___' }, { blank: 20, label: 'Cover roof with reed bundles of ___ length' }],
    }] },
  ],
  questions: [
    q(11, 'multiple-choice', 'Jim says that in the Iron Age village', 'B', part2Mcq[11]), q(12, 'multiple-choice', 'What Jim says about food in the village', 'A', part2Mcq[12]), q(13, 'multiple-choice', 'What happens at the evening meal', 'A', part2Mcq[13]), q(14, 'multiple-choice', 'The most important job for the blacksmith', 'B', part2Mcq[14]), q(15, 'multiple-choice', 'What Jim likes about village life', 'A', part2Mcq[15]),
    q(16, 'matching-information', 'Material used to mark the centre of the planned house', 'G', roundhouseOptions.map((option) => option.text)), q(17, 'matching-information', 'Material of the tools used to dig the ground', 'A', roundhouseOptions.map((option) => option.text)), q(18, 'matching-information', 'Wooden structure built around the centre post', 'I', roundhouseOptions.map((option) => option.text)), q(19, 'matching-information', 'Material used for the roof framework', 'E', roundhouseOptions.map((option) => option.text)), q(20, 'matching-information', 'Length of reed bundles for the roof', 'B', roundhouseOptions.map((option) => option.text)),
  ],
}

const part3Mcq: Record<number, string[]> = {
  21: ['She has attended debates in other departments.', 'She organised debates while at secondary school.', 'She has talked about debating with a friend.'],
  22: ['help students to form opinions.', "improve students' listening skills.", "develop students' self-confidence."],
  23: ['Daniel and Fiona will ask the lecturer to choose one from a list.', "The other students will select one of Daniel and Fiona's suggestions.", 'Daniel and Fiona will collect suggestions from the other students.'],
  24: ['have a topic that really involves them.', 'plan their speech carefully.', 'be given positions to defend.'],
  25: ['give everyone a chance to speak.', 'help students with less confidence.', 'share out the preparation required.'],
  26: ["make comments on students' written work.", 'help Daniel and Fiona to write a report.', 'set the students an essay on a different topic.'],
}
const debateOptions: ListeningOption[] = [['A', 'ask for suggestions'], ['B', 'give a handout of key points'], ['C', 'write on the board'], ['D', 'provide a photocopy of an article'], ['E', 'recommend a textbook'], ['F', 'give a demonstration']].map(([letter, text]) => ({ letter, text }))
const part3: Section = {
  id: 'lt10-part3', title: 'Organising a debate', partLabel: 'Part 3', partInstruction: 'Listen and answer questions 21 - 30.',
  groups: [
    { range: 'Questions 21 - 26', instruction: 'Choose the correct letter, A, B or C.', blocks: [{ kind: 'title', text: 'Organising a debate' }, ...[21, 22, 23, 24, 25, 26].map((blank) => ({ kind: 'mcq' as const, blank, prompt: ['Why is Fiona keen to organise a debate?', 'Fiona says that an advantage of debating is that it can', 'How will the debate topic be selected?', 'Daniel and Fiona think one key to a successful debate is for students to', 'Daniel thinks it would be good for the students to be in two teams because it would', 'What does the lecturer agree to do after the debate?'][blank - 21], options: part3Mcq[blank] }))] },
    { range: 'Questions 27 - 30', instruction: 'What will Daniel and Fiona do at the meeting to help students with debate? Choose FOUR answers from the box and write the correct letter, A-F, next to questions 27-30.', blocks: [{ kind: 'grid', columns: debateOptions.map((option) => option.letter), inputMode: true, options: debateOptions, rows: [{ blank: 27, label: 'understanding debating procedures' }, { blank: 28, label: 'using body language' }, { blank: 29, label: 'accessing resources' }, { blank: 30, label: 'asking and answering questions' }] }] },
  ],
  questions: [
    ...[21, 22, 23, 24, 25, 26].map((number, index) => q(number, 'multiple-choice', ['Why Fiona is keen to organise a debate', 'An advantage of debating', 'How the debate topic will be selected', 'A key to a successful debate', 'Why students should be in two teams', 'What the lecturer agrees to do after the debate'][index], ['C', 'A', 'B', 'A', 'C', 'A'][index], part3Mcq[number])),
    q(27, 'matching-information', 'Action for understanding debating procedures', 'B', debateOptions.map((option) => option.text)), q(28, 'matching-information', 'Action for using body language', 'D', debateOptions.map((option) => option.text)), q(29, 'matching-information', 'Action for accessing resources', 'A', debateOptions.map((option) => option.text)), q(30, 'matching-information', 'Action for asking and answering questions', 'C', debateOptions.map((option) => option.text)),
  ],
}

const part4: Section = {
  id: 'lt10-part4', title: 'After Action Review Process', partLabel: 'Part 4', partInstruction: 'Listen and answer questions 31 - 40.',
  groups: [{ range: 'Questions 31 - 40', instruction: 'Complete the notes below. Write ONE WORD ONLY for each answer.', blocks: [
    { kind: 'title', text: 'After Action Review Process' }, { kind: 'subhead', text: 'Background' }, { kind: 'text', text: 'A way of evaluating during a project in order to make improvements.' }, { kind: 'note', segments: ['Developed by the ', { blank: 31, width: 'lg' }] },
    { kind: 'subhead', text: 'Benefits' }, { kind: 'text', text: 'Not just for large projects – can also be used after:' }, { kind: 'text', text: '• a staff meeting' }, { kind: 'note', bullet: true, segments: ['a ', { blank: 32, width: 'lg' }, ' incident'] }, { kind: 'note', segments: ['Develops better team communication because of the emphasis on ', { blank: 33, width: 'lg' }] },
    { kind: 'subhead', text: 'What is an After Action Review?' }, { kind: 'text', text: "It's a meeting that:" }, { kind: 'note', bullet: true, segments: ['concentrates on results and the ', { blank: 34, width: 'lg' }] }, { kind: 'text', text: '• encourages participation' }, { kind: 'note', bullet: true, segments: ['stresses the need to ', { blank: 35, width: 'lg' }, ' each other'] },
    { kind: 'subhead', text: 'Things to remember when conducting an After Action Review:' }, { kind: 'text', text: '• Use an external facilitator (so stronger team members cannot dominate)' }, { kind: 'note', bullet: true, segments: ["To encourage participation, get the group's thoughts in ", { blank: 36, width: 'lg' }] }, { kind: 'note', bullet: true, segments: ['Remember to use ', { blank: 37, width: 'lg' }, ' questions'] }, { kind: 'note', bullet: true, segments: ['Give any recommendations to other team ', { blank: 38, width: 'lg' }] }, { kind: 'note', bullet: true, segments: ['Make sure you follow up on ideas and provide ', { blank: 39, width: 'lg' }, ' for employees'] }, { kind: 'note', bullet: true, segments: ['Remember to check the ', { blank: 40, width: 'lg' }, ' often'] },
  ] }],
  questions: [
    q(31, 'note-completion', 'Organisation that developed the review process', 'army'), q(32, 'note-completion', 'Type of incident after which a review can be used', 'safety'), q(33, 'note-completion', 'Focus that improves team communication', 'learning'), q(34, 'note-completion', 'What the review considers alongside results', 'reasons'), q(35, 'note-completion', 'What team members need to do with each other', 'trust'), q(36, 'note-completion', 'How the group should give its thoughts', 'writing'), q(37, 'note-completion', 'Type of questions to use', 'open'), q(38, 'note-completion', 'People who should receive recommendations', 'leaders'), q(39, 'note-completion', 'What employees should be provided with', 'training'), q(40, 'note-completion', 'What should be checked often', 'time'),
  ],
}

export const listeningFullTest10: IELTSTest = { id: 'ielts-listening-10', title: 'IELTS Listening Full Test 10', type: 'Academic', module: 'Listening', duration: 30, totalQuestions: 40, continuousAudioUrl: AUDIO_URL, sections: [part1, part2, part3, part4] }
