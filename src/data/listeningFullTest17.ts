import type { IELTSTest, ListeningOption, Question, Section } from '../types/ieltsTypes'

// Questions and answers supplied by the user; Q10 verified against Test 73.
// Audio and source verification: docs/LISTENING_FULL_TEST_17_SOURCE.md.
function q(number: number, type: Question['type'], text: string, correctAnswer: string, explanation: string, options?: string[]): Question {
  return { id: `lt17-q${number}`, number, type, text, correctAnswer, strictAnswerMatch: true, explanation, location: `Part ${Math.ceil(number / 10)}, Question ${number}`, options }
}

const part1: Section = {
  id: 'lt17-part1', title: 'Friedberg Insurance Accident Claim Form', partLabel: 'Part 1',
  partInstruction: 'Listen and answer questions 1 - 10.',
  groups: [{ range: 'Questions 1 - 10', instruction: 'Complete the form below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.', blocks: [
    { kind: 'title', text: 'Friedberg Insurance' },
    { kind: 'title', text: 'Accident Claim Form' },
    { kind: 'subhead', text: 'Policy details' },
    { kind: 'example', segments: ['Type of insurance: household'] },
    { kind: 'note', segments: ['Policy reference: ', { blank: 1 }] },
    { kind: 'note', segments: ['Time since previous claim: ', { blank: 2 }] },
    { kind: 'subhead', text: 'Policy holder details' },
    { kind: 'note', segments: ['Postcode: ', { blank: 3 }] },
    { kind: 'note', segments: ['Address: 120, ', { blank: 4 }] },
    { kind: 'text', text: 'Gosport' },
    { kind: 'text', text: 'Name: Rose Maynard' },
    { kind: 'subhead', text: 'Current claim' },
    { kind: 'note', segments: ['Damage to: floor covering (material: ', { blank: 5 }, ')'] },
    { kind: 'note', segments: ['Cause of damage: ', { blank: 6 }, ' from washing machine'] },
    { kind: 'subhead', text: 'Action taken' },
    { kind: 'note', segments: ['Client ', { blank: 7 }, ' the washing machine'] },
    { kind: 'note', segments: ['After mopping the floor she called the ', { blank: 8 }] },
    { kind: 'subhead', text: 'Arrangements for inspection' },
    { kind: 'note', segments: ['Day: on ', { blank: 9 }, ' next week'] },
    { kind: 'note', segments: ['Special instructions (if any): house is opposite the ', { blank: 10 }, ' (number on gate)'] },
  ] }],
  questions: [
    q(1, 'note-completion', 'Policy reference: ___', 'CWX576884 / CWX 576884 / CWX-576884', 'The reference contains the letters CWX followed by 576884. Preserve every letter and digit.'),
    q(2, 'note-completion', 'Time since previous claim: ___', '9 months / nine months', 'Include the unit months; a bare number does not give the requested length of time.'),
    q(3, 'note-completion', 'Postcode: ___', 'GO194KE / GO19 4KE', 'The postcode is GO19 4KE. A space between the two parts is optional.'),
    q(4, 'note-completion', 'Address: 120, ___, Gosport', 'Middle Street / Middle St / Middle St.', 'Write the street name. The house number 120 is already printed.'),
    q(5, 'note-completion', 'Floor covering (material): ___', 'wood', 'Name the material of the damaged floor: wood.'),
    q(6, 'note-completion', 'Cause of damage: ___ from washing machine', 'water', 'Water is the cause of the damage; the washing machine is already named in the form.'),
    q(7, 'note-completion', 'Client ___ the washing machine', 'switched off', 'Use the two-word action in the past tense: switched off.'),
    q(8, 'note-completion', 'After mopping the floor she called the ___', 'engineer', 'Engineer names the person contacted after the floor was mopped.'),
    q(9, 'note-completion', 'Day: on ___ next week', 'Tuesday', 'Only the weekday belongs in the blank; next week is already supplied.'),
    q(10, 'note-completion', 'House is opposite the ___ (number on gate)', 'post office', 'The landmark opposite the house is the post office. This is within the two-word limit.'),
  ],
}

const hospitalityQuestions = [
  { number: 11, prompt: 'What has the speaker enjoyed most about working in hospitality?', options: ['the range of jobs available', 'the range of countries he has visited', 'the range of people he has worked with'], answer: 'C', explanation: 'Choose the variety of people he has worked with.' },
  { number: 12, prompt: 'What point does the speaker make about kitchen assistants?', options: ['the long hours will not suit everyone', 'their work is sometimes quite boring', 'the pay is not particularly good'], answer: 'A', explanation: 'The concern is the long working hours.' },
  { number: 13, prompt: 'According to the speaker, which job is sometimes undervalued?', options: ['porter', 'cleaner', 'Dishwasher'], answer: 'A', explanation: 'Porter is the job described as sometimes undervalued.' },
  { number: 14, prompt: 'Experience in reception may help employees', options: ['to learn foreign languages', 'to manage successfully situations', 'to get a better job eventually'], answer: 'C', explanation: 'Reception experience can help employees progress to a better job.' },
  { number: 15, prompt: 'The speaker says that interview skills', options: ['are particularly important in hospitality', 'easy to learn if you have some practice', 'are understood better now than in the past'], answer: 'B', explanation: 'Practice makes interview skills easier to learn.' },
]
const workshops = [
  { blank: 16, label: 'Restaurant Service' }, { blank: 17, label: 'Kitchen Hands' },
  { blank: 18, label: 'Porters, Cleaners, Dishwasher' }, { blank: 19, label: 'Receptionists' },
  { blank: 20, label: 'Interview Skills' },
]
const part2: Section = {
  id: 'lt17-part2', title: 'Training courses for workers in the hospitality industry', partLabel: 'Part 2',
  partInstruction: 'Listen and answer questions 11 - 20.',
  groups: [
    { range: 'Questions 11 - 15', instruction: 'Choose the correct letter, A, B or C.', blocks: [
      { kind: 'title', text: 'Information day: Training courses for workers in the hospitality industry' },
      ...hospitalityQuestions.map(({ number, prompt, options }) => ({ kind: 'mcq' as const, blank: number, prompt, options })),
    ] },
    { range: 'Questions 16 - 20', instruction: 'Label the plan below. Write the correct letter, A-J, next to questions 16-20.', blocks: [
      { kind: 'image', src: '/images/ielts-listening-test17-college-plan.svg', alt: 'College plan with rooms A-J, Gym, First Aid Room, Square, Library, Hall and Office' },
      { kind: 'subhead', text: 'Workshops' },
      { kind: 'grid', columns: 'ABCDEFGHIJ'.split(''), inputMode: true, rows: workshops },
    ] },
  ],
  questions: [
    ...hospitalityQuestions.map(({ number, prompt, options, answer, explanation }) => q(number, 'multiple-choice', prompt, answer, explanation, options)),
    q(16, 'matching-information', workshops[0].label, 'J', 'Restaurant Service is in J, the room immediately to the right of the Office.'),
    q(17, 'matching-information', workshops[1].label, 'C', 'Kitchen Hands is in C, the left room in the two-room building below the Gym row.'),
    q(18, 'matching-information', workshops[2].label, 'B', 'This workshop is in B, at the right-hand end of the top row.'),
    q(19, 'matching-information', workshops[3].label, 'E', 'Receptionists is in E, at the top of the building containing the Library.'),
    q(20, 'matching-information', workshops[4].label, 'F', 'Interview Skills is in F, the tall building on the left of the Square.'),
  ],
}

const musicQuestions = [
  { number: 21, prompt: 'According to the students, the incorrect reporting of the Mozart experiment led to', options: ['A reassessment of music in education', 'A journalist losing his job', 'Increased sales of classical music worldwide'], answer: 'A', explanation: 'The reported experiment prompted a reassessment of music in education.' },
  { number: 22, prompt: 'What were the findings of the elephant experiment?', options: ['The music helped the elephants to respond to the zookeepers', 'It was not clear why the elephants responded to the music', 'The elephants’ behavior was not affected by the music'], answer: 'B', explanation: 'The reason for the elephants’ response was unclear.' },
  { number: 23, prompt: 'The students decide not to use the elephant experiment in their talk because', options: ['They think it was poorly designed', 'Another group is using the research', 'The article is not from an academic source'], answer: 'C', explanation: 'They reject the article because its source is not academic.' },
  { number: 24, prompt: 'What kind of music had the biggest effect on the tamarin monkeys?', options: ['Classical music played at a faster speed than normal', 'Human music combined with monkey calls', 'Any music played at a high volume'], answer: 'B', explanation: 'The effective music combined human music with monkey calls.' },
  { number: 25, prompt: 'What impressed the students most about Taylor?', options: ['The speed with which he got results', 'The hard work and determination', 'The film about his work'], answer: 'B', explanation: 'The students were most impressed by his hard work and determination.' },
]
const problems: ListeningOption[] = [
  { letter: 'A', text: 'It will take too much time' }, { letter: 'B', text: 'There is too much preparation' },
  { letter: 'C', text: 'It’s too similar to other lessons' }, { letter: 'D', text: 'It won’t last long enough' },
  { letter: 'E', text: 'It may be difficult to control the class' }, { letter: 'F', text: 'It will be too easy' },
  { letter: 'G', text: 'The students might be bored' },
]
const lessons = [
  { blank: 26, label: 'Making musical instruments' }, { blank: 27, label: 'Musical survey' },
  { blank: 28, label: 'Music word games' }, { blank: 29, label: 'Music and painting' }, { blank: 30, label: 'Music quiz' },
]
const part3: Section = {
  id: 'lt17-part3', title: 'Music Experiment', partLabel: 'Part 3', partInstruction: 'Listen and answer questions 21 - 30.',
  groups: [
    { range: 'Questions 21 - 25', instruction: 'Choose the correct letter, A, B or C.', blocks: [
      { kind: 'title', text: 'Music Experiment' },
      ...musicQuestions.map(({ number, prompt, options }) => ({ kind: 'mcq' as const, blank: number, prompt, options })),
    ] },
    { range: 'Questions 26 - 30', instruction: 'What problem do the speakers identify for each of the following lesson ideas? Choose FIVE answers from the box and write the correct letter, A-G, next to questions 26-30.', blocks: [
      { kind: 'subhead', text: 'Problems' },
      { kind: 'grid', columns: problems.map(option => option.letter), options: problems, inputMode: true, rows: [] },
      { kind: 'subhead', text: 'Lesson ideas' },
      { kind: 'grid', columns: problems.map(option => option.letter), inputMode: true, rows: lessons },
    ] },
  ],
  questions: [
    ...musicQuestions.map(({ number, prompt, options, answer, explanation }) => q(number, 'multiple-choice', prompt, answer, explanation, options)),
    q(26, 'matching-information', lessons[0].label, 'E', 'Making musical instruments may make the class difficult to control.'),
    q(27, 'matching-information', lessons[1].label, 'C', 'A musical survey is too similar to other lessons.'),
    q(28, 'matching-information', lessons[2].label, 'G', 'Music word games might bore the students.'),
    q(29, 'matching-information', lessons[3].label, 'B', 'Music and painting requires too much preparation.'),
    q(30, 'matching-information', lessons[4].label, 'D', 'A music quiz would not last long enough.'),
  ],
}

const part4: Section = {
  id: 'lt17-part4', title: 'Early Migration to America', partLabel: 'Part 4', partInstruction: 'Listen and answer questions 31 - 40.',
  groups: [{ range: 'Questions 31 - 40', instruction: 'Complete the notes below. Write ONE WORD ONLY for each answer.', blocks: [
    { kind: 'title', text: 'Early Migration to America' },
    { kind: 'text', text: 'Humans migrated from Northern Asia to Alaska via a land bridge' },
    { kind: 'text', text: 'The area consists of a dry grassland plain up to 2000 km²' },
    { kind: 'note', segments: ['The winter is cold and long with strong winds but free from ', { blank: 31 }] },
    { kind: 'note', segments: ['The earliest group of humans followed ', { blank: 32 }, ' to Alaska'] },
    { kind: 'note', segments: ['Anthropologists found similar shaped ', { blank: 33 }, ' in people in Northern Asia and in North America'] },
    { kind: 'note', segments: ['The land is covered with glaciers, which makes it difficult to find ', { blank: 34 }] },
    { kind: 'note', segments: ['The other evidence was in the form of ', { blank: 35 }, ' for hunting'] },
    { kind: 'text', text: 'Some scientists believe first settlers moved from north to south' },
    { kind: 'note', segments: ['But no ', { blank: 36 }, ' have been found to support the theory'] },
    { kind: 'text', text: 'Excavations revealed dozens of people living in some huts by a stream' },
    { kind: 'note', segments: ['Scientists found a variety of ', { blank: 37 }, ' in the sea, such as seaweed'] },
    { kind: 'text', text: 'However, some archaeologists did not believe the first humans arrived via Alaska.' },
    { kind: 'note', segments: ['They thought the ', { blank: 38 }, ' was too bad for humans to survive in'] },
    { kind: 'note', segments: ['They doubt the ', { blank: 39 }, ' skills of the early people for such a long voyage'] },
    { kind: 'note', segments: ['People believe the theory due to there is a strong ', { blank: 40 }, ' in the Pacific Ocean'] },
  ] }],
  questions: [
    q(31, 'note-completion', 'The winter is cold and long with strong winds but free from ___', 'ice', 'Ice completes the phrase free from.'),
    q(32, 'note-completion', 'The earliest group of humans followed ___ to Alaska', 'animals', 'Write the plural animals for what the people followed.'),
    q(33, 'note-completion', 'Anthropologists found similar shaped ___', 'teeth', 'Teeth is the plural noun for the physical feature compared.'),
    q(34, 'note-completion', 'Glaciers make it difficult to find ___', 'resources', 'Use the plural resources for what is difficult to find.'),
    q(35, 'note-completion', 'Other evidence was in the form of ___ for hunting', 'weapons', 'Weapons names the hunting objects found as evidence.'),
    q(36, 'note-completion', 'But no ___ have been found to support the theory', 'boats', 'The plural boats agrees with have been found.'),
    q(37, 'note-completion', 'A variety of ___ in the sea, such as seaweed', 'plants', 'Seaweed is given as an example of plants.'),
    q(38, 'note-completion', 'They thought the ___ was too bad for humans to survive in', 'climate', 'Climate names the conditions that made survival difficult.'),
    q(39, 'note-completion', 'They doubt the ___ skills of the early people', 'navigational', 'Navigational describes the skills needed for a long voyage. Write only the missing word.'),
    q(40, 'note-completion', 'There is a strong ___ in the Pacific Ocean', 'current', 'Write the singular noun current after a strong.'),
  ],
}

export const listeningFullTest17: IELTSTest = {
  id: 'ielts-listening-17', title: 'IELTS Listening Full Test 17',
  // Recording: 24:27.98. The shared player submits 20 seconds after its final end.
  type: 'Academic', module: 'Listening', duration: 25, totalQuestions: 40,
  continuousAudioUrl: '/audio/ielts-listening/listening-full-test-17.mp3',
  sections: [part1, part2, part3, part4],
}
