import type { IELTSTest, ListeningBlock, Question, Section } from '../types/ieltsTypes'

// User screenshots: IELTS Mock Test 2026 January, Listening Practice Test 1.
// Source recording and solution evidence: docs/LISTENING_FULL_TEST_3_SOURCE.md.
const AUDIO_URL = '/audio/ielts-listening/listening-full-test-3.mp3'

function q(number: number, text: string, correctAnswer: string, explanation: string, options?: string[]): Question {
  return {
    // Distinct IDs prevent answers from the replaced paper entering this paper.
    id: `lt3-jan2026-q${number}`, number,
    type: options ? 'multiple-choice' : 'note-completion', text, correctAnswer,
    ...(options ? { options } : { strictAnswerMatch: true }), explanation,
    location: `Part ${Math.ceil(number / 10)}, Question ${number}`,
  }
}

function mcqs(questions: Question[]): ListeningBlock[] {
  return questions.map(question => ({ kind: 'mcq', blank: question.number, prompt: question.text, options: question.options! }))
}

const part1Questions = [
  q(1, 'The centre has enough accommodation for', 'C', 'The centre accommodates 38 people in total. The smaller numbers concern the room arrangements.', ['18 people.', '20 people.', '38 people.']),
  q(2, 'The meeting room is currently', 'A', 'The meeting room is unavailable following flood damage. Its present availability is the question.', ['unavailable', 'flooded', 'booked']),
  q(3, 'Visitors must tell the centre in advance if they want to', 'B', 'Advance notice is required when the centre is to prepare meals for visitors.', ["use the centre\'s kitchen.", 'have meals cooked for them.', 'eat at restaurants outside']),
  q(4, 'All visitors on the tour of the farm can', 'B', 'Helping to feed the animals is available to all visitors on the farm tour.', ['get information about organic farming', 'help to feed the animals', 'watch a tractor demonstration']),
  q(5, 'On the survival course people have to', 'B', 'Finding their own food is a requirement of the survival course.', ['learn to use a map', 'find their own food.', 'run through woodland']),
  q(6, 'From the centre it is easy to walk to', 'C', 'The cycling route is easily reached on foot from the centre.', ['Exmoor National Park.', 'the beach', 'a cycling route']),
  q(7, 'If the weather is bad visitors can go to a', 'C', 'The museum is the suggested activity for bad weather.', ['cinema', 'theatre', 'museum']),
  q(8, 'Groups who wish to stay at the centre must pay', 'A', 'Groups pay part of the cost in advance.', ['part of the cost in advance', 'all of the cost in advance.', 'all of the cost on arrival.']),
  q(9, 'Winsham Farm: road name', 'COTEHELE', 'The road name is Cotehele. Rd is already printed after the blank.'),
  q(10, 'Winsham Farm: postcode near Sherborne', 'SH12 1LQ / SH121LQ', 'The postcode is SH12 1LQ. Keep every letter and digit, including the final Q.'),
]

const part1: Section = {
  id: 'lt3-jan2026-part1', title: 'Winsham Farm', partLabel: 'Part 1',
  partInstruction: 'Listen and answer questions 1 - 10.',
  groups: [
    { range: 'Questions 1 - 8', instruction: 'Choose the correct letter, A, B or C.', blocks: mcqs(part1Questions.slice(0, 8)) },
    {
      range: 'Questions 9 - 10', instruction: 'Complete the notes below. Write ONE WORD AND/OR NUMBERS for each answer.',
      blocks: [
        { kind: 'subhead', text: 'Address:' }, { kind: 'text', text: 'Winsham Farm' },
        { kind: 'note', segments: [{ blank: 9, width: 'md' }, ' Rd'] },
        { kind: 'text', text: 'Near Sherborne' }, { kind: 'note', segments: [{ blank: 10, width: 'md' }] },
      ],
    },
  ], questions: part1Questions,
}

const part2Questions = [
  q(11, 'Stocktaking: main advantage', 'travelling / traveling', 'Travelling is the advantage identified for stocktaking.'),
  q(12, 'Stocktaking: recommendation', 'get good shoes', 'Good shoes are recommended because stocktaking involves tiring work on your feet.'),
  q(13, 'Office work: main disadvantage', 'wearing formal clothes', 'Having to wear formal clothes is the disadvantage of office work.'),
  q(14, 'Office work: choose a', 'large office', 'Choose a large office. The article a is already printed before the blank.'),
  q(15, 'Theme park attendant: main advantage', 'good pay', 'Good pay is the advantage of working as a theme park attendant.'),
  q(16, 'Theme park attendant: recommendation', 'live nearby', 'Living nearby is recommended for this vacation job.'),
  q(17, 'Peter learned about the job', 'B', 'Peter found the job on the computer.', ['from a college friend', 'on the computer', 'from a student job centre']),
  q(18, 'Peter mainly enjoyed the job because it was', 'C', 'Peter enjoyed the unusual nature of the job.', ['easy', 'challenging', 'unusual']),
  q(19, "The job's most interesting aspect was", 'B', 'Working with children was the most interesting aspect for Peter.', ['learning about the environment', 'working with children', 'caring for the animals']),
  q(20, 'Peter has decided that next vacation he', 'A', 'Peter has decided not to take a job during his next vacation.', ["won't take a job", 'will work at the zoo.', 'will work elsewhere']),
]

const part2: Section = {
  id: 'lt3-jan2026-part2', title: 'Vacation Jobs', partLabel: 'Part 2',
  partInstruction: 'Listen and answer questions 11 - 20.',
  groups: [
    {
      range: 'Questions 11 - 16', instruction: 'Complete the table below. Write NO MORE THAN THREE WORDS AND/OR A NUMBER for each answer.',
      blocks: [{ kind: 'table', columns: ['Vacation Job', 'Main advantage', 'Main disadvantage', 'Recommendation'], rows: [
        [{ segments: ['Stocktaking'] }, { segments: [{ blank: 11, width: 'md' }] }, { segments: ['Tiring'] }, { segments: [{ blank: 12, width: 'lg' }] }],
        [{ segments: ['Office work'] }, { segments: ['Air-conditioning'] }, { segments: [{ blank: 13, width: 'lg' }] }, { segments: ['Choose a ', { blank: 14, width: 'md' }] }],
        [{ segments: ['Theme park attendant'] }, { segments: [{ blank: 15, width: 'md' }] }, { segments: ['Rude customers'] }, { segments: [{ blank: 16, width: 'md' }] }],
      ] }],
    },
    { range: 'Questions 17 - 20', instruction: 'Choose the correct letter, A, B or C.', blocks: mcqs(part2Questions.slice(6)) },
  ], questions: part2Questions,
}

const part3: Section = {
  id: 'lt3-jan2026-part3', title: 'Study Syndicates', partLabel: 'Part 3',
  partInstruction: 'Listen and answer questions 21 - 30.',
  groups: [
    {
      range: 'Questions 21 - 22', instruction: 'Complete the notes below. Write NO MORE THAN THREE WORDS for each answer.',
      blocks: [
        { kind: 'subhead', text: 'Reasons for having Study Syndicates:' },
        { kind: 'note', bullet: true, segments: ['teaching one another is a good way to learn'] },
        { kind: 'note', bullet: true, segments: ['it gives the opportunity to ', { blank: 21, width: 'md' }] },
        { kind: 'note', bullet: true, segments: ['shared reading means fuller notes'] },
        { kind: 'note', bullet: true, segments: ['You can do ', { blank: 22, width: 'lg' }] },
      ],
    },
    {
      range: 'Questions 23 - 25', instruction: 'Complete the table below. Write NO MORE THAN THREE WORDS AND/OR A NUMBER for each answer.',
      blocks: [
        { kind: 'subhead', text: 'PLAN FOR STUDY SYNDICATE' },
        { kind: 'table', columns: ['Date', 'Geology Topic', 'Name of Presenter'], rows: [
          [{ segments: ['9th May'] }, { segments: [{ blank: 23, width: 'lg' }] }, { segments: ['Bob'] }],
          [{ segments: [{ blank: 24, width: 'md' }] }, { segments: ['glaciated areas'] }, { segments: ['Andy'] }],
          [{ segments: ['23rd May'] }, { segments: ['rock formation'] }, { segments: ['Helen and John'] }],
          [{ segments: [{ blank: 25, width: 'md' }] }, { segments: ['Volcanoes'] }, { segments: ['John'] }],
        ] },
      ],
    },
    {
      range: 'Questions 26 - 30', instruction: 'Complete the notes below. Write NO MORE THAN THREE WORDS AND/OR A NUMBER for each answer.',
      blocks: [
        { kind: 'note', bullet: true, segments: ['Presentations should last for ', { blank: 26, width: 'lg' }] },
        { kind: 'note', segments: ['(plus time for ', { blank: 27, width: 'lg' }, ' )'] }, { kind: 'space' },
        { kind: 'note', bullet: true, segments: ['Sources of information'] },
        { kind: 'note', bullet: true, indent: true, segments: ['bibliography'] },
        { kind: 'note', bullet: true, indent: true, segments: ['library books'] },
        { kind: 'note', bullet: true, indent: true, segments: [{ blank: 28, width: 'lg' }] },
        { kind: 'note', bullet: true, indent: true, segments: [{ blank: 29, width: 'md' }] }, { kind: 'space' },
        { kind: 'note', bullet: true, segments: ['For the presentations, use:'] },
        { kind: 'note', bullet: true, indent: true, segments: ['overhead projector'] },
        { kind: 'note', bullet: true, indent: true, segments: ['whiteboard'] },
        { kind: 'note', bullet: true, indent: true, segments: [{ blank: 30, width: 'md' }] },
      ],
    },
  ], questions: [
    q(21, 'Study syndicates give the opportunity to', 'share ideas', 'Sharing ideas is one reason for forming a study syndicate.'),
    q(22, 'In a study syndicate you can do', 'deeper research / much deeper research', 'Members can carry out deeper research by working together.'),
    q(23, 'Geology topic presented by Bob on 9th May', 'Mountain building', 'Bob will present mountain building on 9th May.'),
    q(24, "Date of Andy's presentation on glaciated areas", '17th May / 17 May / May 17 / May 17th', 'Glaciated areas is scheduled for 17th May.'),
    q(25, "Date of John's presentation on volcanoes", '29th May / 29 May / May 29 / May 29th', 'The volcanoes presentation is scheduled for 29th May.'),
    q(26, 'Presentations should last for', '30-40 minutes / 30 to 40 minutes', 'The presentation itself should last 30 to 40 minutes, with additional time afterwards.'),
    q(27, 'Additional time should be allowed for', 'question(s); discussion / questions / question / questions and discussion / question and discussion', 'The source accepts questions or discussion; the notes leave space for both activities.'),
    q(28, 'Source of information besides bibliography and library books', 'articles (from journal) / articles / journal articles / articles from journal', 'Journal articles are another information source. The source key makes the journal qualifier optional.'),
    q(29, 'Another source of information', 'internet / the internet', 'The internet is also suggested as an information source.'),
    q(30, 'Presentation material besides the overhead projector and whiteboard', 'photocopy', 'The source answer for the additional presentation material is photocopy.'),
  ],
}

const part4: Section = {
  id: 'lt3-jan2026-part4', title: 'Health on the Night Shift', partLabel: 'Part 4',
  partInstruction: 'Listen and answer questions 31 - 40.',
  groups: [{
    range: 'Questions 31 - 40', instruction: 'Complete the notes below. Write NO MORE THAN THREE WORDS for each answer.',
    blocks: [
      { kind: 'title', text: 'HEALTH ON THE NIGHT SHIFT' }, { kind: 'subhead', text: 'Background:' },
      { kind: 'note', bullet: true, segments: [{ blank: 31, width: 'lg' }, ' in number of night workers because of 24-hour shopping/services'] },
      { kind: 'note', bullet: true, segments: ['Need to examine effects of changing work and sleep habits'] },
      { kind: 'note', bullet: true, segments: ['US and British research found these lead to health problems'] }, { kind: 'space' },
      { kind: 'subhead', text: 'Main Causes:' }, { kind: 'note', segments: ['A) ', { blank: 32, width: 'md' }] },
      { kind: 'note', bullet: true, segments: ['regulates daily life'] },
      { kind: 'note', bullet: true, segments: ['connected to behavioural patterns and cycles of ', { blank: 33, width: 'md' }] },
      { kind: 'note', bullet: true, segments: ['programmes us to be awake and asleep at certain times'] },
      { kind: 'subhead', text: 'B) Sleep Debt' },
      { kind: 'note', bullet: true, segments: ['impossible to get enough sleep during daytime'] },
      { kind: 'note', segments: ['C) ', { blank: 34, width: 'md' }] },
      { kind: 'note', bullet: true, segments: ["different working/sleeping times, 'dislocation'"] }, { kind: 'space' },
      { kind: 'subhead', text: 'Effects:' }, { kind: 'subhead', text: 'A) Physical' },
      { kind: 'note', bullet: true, segments: ['higher incidence of ', { blank: 35, width: 'md' }, ' problems'] },
      { kind: 'note', bullet: true, segments: ['more minor illnesses, suggesting that immunity of shift workers is affected'] },
      { kind: 'subhead', text: 'B) Psychological' },
      { kind: 'note', bullet: true, segments: ['most common: ', { blank: 36, width: 'md' }] },
      { kind: 'note', bullet: true, segments: [{ blank: 37, width: 'md' }, ' affected, e.g. decision-making, planning, which regulate our ', { blank: 38, width: 'md' }] },
      { kind: 'subhead', text: 'C) Social' }, { kind: 'text', text: 'Night shift work can lead to:' },
      { kind: 'note', bullet: true, segments: ['destruction of ', { blank: 39, width: 'md' }, ' and other relationships, e.g. ', { blank: 40, width: 'lg' }] },
      { kind: 'note', bullet: true, segments: ['eventually, for individuals: social isolation'] },
    ],
  }], questions: [
    q(31, 'Change in the number of night workers', 'a huge increase / huge increase', 'There is a huge increase in night workers as shopping and services operate around the clock.'),
    q(32, 'Main cause A: what regulates daily life?', 'internal clock', 'The internal clock regulates daily life and the timing of waking and sleeping.'),
    q(33, 'Cycles connected to behavioural patterns', 'light dark / light and dark', 'The internal clock is linked to light and dark. Both parts of the cycle belong in this blank.'),
    q(34, 'Main cause C: different working and sleeping times', 'unsocial hours', 'Unsocial hours disrupt the alignment of working and sleeping times.'),
    q(35, 'Physical effects: higher incidence of which problems?', 'stomach', 'Physical effects include a higher incidence of stomach problems.'),
    q(36, 'Most common psychological effect', 'depression', 'Depression is identified as the most common psychological effect.'),
    q(37, 'What is affected, including decision-making and planning?', 'mental ability', 'Mental ability includes decision-making and planning, which can be affected by night work.'),
    q(38, 'Decision-making and planning regulate our', 'performance', 'Decision-making and planning help regulate performance.'),
    q(39, 'Night shift work can lead to destruction of', 'family life', 'Family life can be disrupted by night shift work.'),
    q(40, 'Examples of other relationships affected', 'peer group/friends / peer group / friends', 'Relationships with the peer group or friends are also affected. Either source alternative is accepted.'),
  ],
}

export const listeningFullTest3: IELTSTest = {
  id: 'ielts-listening-3', title: 'IELTS Listening Full Test 3', type: 'Academic', module: 'Listening',
  duration: 30, totalQuestions: 40, continuousAudioUrl: AUDIO_URL, sections: [part1, part2, part3, part4],
}
