import type { IELTSTest, ListeningOption, Question, Section } from '../types/ieltsTypes'

// The four parts and 40 answers follow the user's scans and answer sheet.
// The recording is the complete four-part 20232110 audio used for this paper.
const audioUrl = '/audio/ielts-listening/listening-full-test-21.mp3'
const mapId = '/images/ielts-listening-test21-brightwater-park.svg'

function q(number: number, type: Question['type'], text: string, answer: string, explanation: string, options?: string[]): Question {
  return { id: `lt21-q${number}`, number, type, text, correctAnswer: answer, strictAnswerMatch: true,
    location: `Part ${Math.ceil(number / 10)} · Question ${number}`, explanation, options }
}

const part1: Section = {
  id: 'lt21-part1', title: 'Information about School Registration', partLabel: 'Part 1',
  partInstruction: 'Listen and answer questions 1 - 10.',
  groups: [{ range: 'Questions 1 - 10', instruction: 'Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer.', blocks: [
    { kind: 'title', text: 'Information about School Registration' },
    { kind: 'text', text: 'Grade Level: kindergarten' },
    { kind: 'note', segments: ['School: ', { blank: 1 }, ' Heights Elementary School'] },
    { kind: 'subhead', text: 'Registration' },
    { kind: 'text', text: 'Monday to Thursday from 9.00 to 1.30' },
    { kind: 'note', segments: ['Can pick up packet from the school ', { blank: 2 }, ' any afternoon up to 5.00'] },
    { kind: 'subhead', text: 'Forms' },
    { kind: 'text', text: 'Immunisation records' },
    { kind: 'note', segments: ['Health forms from doctor and ', { blank: 3 }] },
    { kind: 'text', text: 'Emergency contact information' },
    { kind: 'text', text: 'Residency verification form' },
    { kind: 'text', text: 'Original birth certificate' },
    { kind: 'subhead', text: 'Childcare' },
    { kind: 'note', segments: ['No ', { blank: 4 }, ' is provided'] },
    { kind: 'note', segments: ['There is on-site licensed daycare for working ', { blank: 5 }] },
    { kind: 'note', segments: ['This is organised by the City ', { blank: 6 }, ' Council'] },
    { kind: 'subhead', text: 'Orientation' },
    { kind: 'note', segments: ["Open house in July – details provided through the ", { blank: 7 }, " and on the school's website"] },
    { kind: 'note', segments: ['Will tour the school, meet the ', { blank: 8 }, ' and schedule entrance testing'] },
    { kind: 'subhead', text: 'Schedule' },
    { kind: 'note', segments: ['First day of school will be on ', { blank: 9 }] },
    { kind: 'text', text: 'First week is 8.00 to 12.30' },
    { kind: 'note', segments: ['Regular schedule is 8.00 to ', { blank: 10 }] },
  ] }],
  questions: [
    q(1, 'note-completion', '___ Heights Elementary School', 'Monterey', 'The school name begins with Monterey.'),
    q(2, 'note-completion', 'Pick up packet from the school ___', 'library', 'The packet can be collected from the school library.'),
    q(3, 'note-completion', 'Health forms from doctor and ___', 'dentist', 'Both the doctor and the dentist supply health forms.'),
    q(4, 'note-completion', 'No ___ is provided', 'transportation', 'The school does not provide transportation.'),
    q(5, 'note-completion', 'On-site daycare for working ___', 'parents', 'The daycare is for working parents.'),
    q(6, 'note-completion', 'City ___ Council', 'Youth', 'The organiser is the City Youth Council.'),
    q(7, 'note-completion', 'Open house details provided through the ___', 'mail', 'Open-house details arrive through the mail and appear on the website.'),
    q(8, 'note-completion', 'Tour the school and meet the ___', 'teacher', 'The orientation includes meeting the teacher.'),
    q(9, 'note-completion', 'First day of school', 'August 19 / 19 August / August 19th / 19th August', 'The stated first day is August 19; equivalent date forms are accepted.'),
    q(10, 'note-completion', 'Regular schedule: 8.00 to ___', '2.05 / 2:05 / 2.05pm / 2.05 pm', 'The regular end time is 2.05.'),
  ],
}

const parkQuestions = [
  { n: 15, prompt: "On the 'Flying Tigers' ride, children have to be", options: ['over 1.1 metres tall.', 'over 1.3 metres tall.', 'over 1.5 metres tall.'], answer: 'A' },
  { n: 16, prompt: 'Visitors should be warned that the Hidden Cove ride involves', options: ['being in darkness.', 'going underground.', 'getting slightly wet.'], answer: 'A' },
  { n: 17, prompt: 'The speaker recommends the picnic area for families because', options: ['there is plenty of space for children to run around.', "it has a children's playground.", "children's entertainment is provided there."], answer: 'C' },
  { n: 18, prompt: "What change to this Saturday night's programme has been made?", options: ['The fireworks will start one hour later.', 'The barbecue will be by the forest.', 'The live band will play rock music.'], answer: 'A' },
  { n: 19, prompt: 'This month, as a special deal, visitors can get', options: ['two photos for the price of one.', 'a discount on tickets for future visits.', 'a free soft drink when they buy lunch.'], answer: 'B' },
  { n: 20, prompt: 'The supervisor advises new employees to carry', options: ['bus timetables.', 'maps of the park.', 'the park rules.'], answer: 'C' },
] as const

const mapQuestions = [
  { n: 11, label: 'Toilets with baby changing facilities', answer: 'F' },
  { n: 12, label: 'Ice-cream shop', answer: 'B' },
  { n: 13, label: 'Gift shop', answer: 'I' },
  { n: 14, label: 'Film theatre', answer: 'D' },
] as const

const part2: Section = {
  id: 'lt21-part2', title: 'Brightwater Adventure Park', partLabel: 'Part 2',
  partInstruction: 'Listen and answer questions 11 - 20.',
  groups: [
    { range: 'Questions 11 - 14', instruction: 'Label the map below. Write the correct letter, A-I, next to questions 11-14.', blocks: [
      { kind: 'title', text: 'Brightwater Adventure Park' },
      { kind: 'image', src: mapId, alt: 'Brightwater Adventure Park map labelled A to I, including the station, railway, pool, lake, Young Fun, Mega Adventure, Crazy Golf and entrance.' },
      { kind: 'grid', columns: 'ABCDEFGHI'.split(''), inputMode: true, rows: mapQuestions.map(({ n, label }) => ({ blank: n, label })) },
    ] },
    { range: 'Questions 15 - 20', instruction: 'Choose the correct letter, A, B or C.', blocks: [
      ...parkQuestions.map(({ n, prompt, options }) => ({ kind: 'mcq' as const, blank: n, prompt, options: [...options] })),
    ] },
  ],
  questions: [
    ...mapQuestions.map(({ n, label, answer }) => q(n, 'matching-information', label, answer, `The location marked ${answer} is ${label.toLowerCase()}.`)),
    ...parkQuestions.map(({ n, prompt, options, answer }) => q(n, 'multiple-choice', prompt, answer, `The correct choice is ${answer}: ${options[answer.charCodeAt(0) - 65]}`, [...options])),
  ],
}

const courseQuestions = [
  { n: 21, prompt: 'Why does Katie say she will continue attending lectures on her present course?', options: ['to gain credits for part of the course', 'to get a good reference from her tutor', 'to see if she changes her mind about her decision'], answer: 'A' },
  { n: 22, prompt: 'Why is Katie going to speak to her family?', options: ['because they can give her good advice', 'because they may disapprove of her decision', 'because they are paying for the course'], answer: 'C' },
  { n: 23, prompt: 'What does Stefan say about the Sports Education course?', options: ['It has a very good reputation.', 'It would be easy to get a job afterwards.', 'Katie would enjoy it more.'], answer: 'A' },
  { n: 24, prompt: 'What problem does Katie agree to consider?', options: ['the extra financial support required', 'the amount of missed work to make up', 'the extra travelling that could be involved'], answer: 'B' },
  { n: 25, prompt: 'Katie has now decided that degrees', options: ['are only useful if you enjoy what you study.', 'are a means to getting a better job.', 'contain too little practical experience.'], answer: 'A' },
] as const

const flowOptions: ListeningOption[] = [
  { letter: 'A', text: 'administration office' }, { letter: 'B', text: 'finance department' },
  { letter: 'C', text: 'hall of residence' }, { letter: 'D', text: 'head of department' },
  { letter: 'E', text: 'library' }, { letter: 'F', text: 'tutor' },
  { letter: 'G', text: 'welfare advisor' },
]
const flowQuestions = [
  { n: 26, text: 'Speak to the ___ about requirements for the new course', answer: 'F' },
  { n: 27, text: 'Give the ___ a date for the change', answer: 'A' },
  { n: 28, text: 'Email the ___', answer: 'B' },
  { n: 29, text: 'Get the ___ to change their data', answer: 'E' },
  { n: 30, text: 'Notify the ___', answer: 'C' },
] as const

const part3: Section = {
  id: 'lt21-part3', title: 'Changing course', partLabel: 'Part 3',
  partInstruction: 'Listen and answer questions 21 - 30.',
  groups: [
    { range: 'Questions 21 - 25', instruction: 'Choose the correct letter, A, B or C.', blocks: [
      { kind: 'title', text: 'Changing course' },
      ...courseQuestions.map(({ n, prompt, options }) => ({ kind: 'mcq' as const, blank: n, prompt, options: [...options] })),
    ] },
    { range: 'Questions 26 - 30', instruction: 'Complete the flow-chart below. Choose FIVE answers from the box and write the correct letter, A-G, next to questions 26-30.', blocks: [
      { kind: 'grid', columns: flowOptions.map(option => option.letter), options: flowOptions, inputMode: true, rows: [] },
      { kind: 'title', text: 'To change courses' },
      { kind: 'flow', boxes: [
        { segments: ['Speak to the ', { blank: 26 }, ' about requirements for the new course'] },
        { segments: ['give the ', { blank: 27 }, ' a date for the change'] },
        { segments: ['email the ', { blank: 28 }] },
        { segments: ['get the ', { blank: 29 }, ' to change their data'] },
        { segments: ['notify the ', { blank: 30 }] },
      ] },
    ] },
  ],
  questions: [
    ...courseQuestions.map(({ n, prompt, options, answer }) => q(n, 'multiple-choice', prompt, answer, `The correct choice is ${answer}: ${options[answer.charCodeAt(0) - 65]}`, [...options])),
    ...flowQuestions.map(({ n, text, answer }) => q(n, 'matching-information', text, answer, `The step refers to the ${flowOptions.find(option => option.letter === answer)?.text} (${answer}).`, flowOptions.map(option => option.text))),
  ],
}

const part4: Section = {
  id: 'lt21-part4', title: 'Translating ancient Mayan', partLabel: 'Part 4',
  partInstruction: 'Listen and answer questions 31 - 40.',
  groups: [{ range: 'Questions 31 - 40', instruction: 'Complete the notes below. Write ONE WORD ONLY for each answer.', blocks: [
    { kind: 'title', text: 'Translating ancient Mayan' },
    { kind: 'subhead', text: '16th to early 20th centuries' },
    { kind: 'text', text: 'Spanish colonists in Central America tried to destroy the written Mayan language.' },
    { kind: 'note', bullet: true, segments: ['They thought it represented a ', { blank: 31 }, ' to their control.'] },
    { kind: 'text', text: 'Researchers found ancient handbooks which were written for priests.' },
    { kind: 'note', bullet: true, segments: ['They identified some numbers and sections of the text relating to ', { blank: 32 }, '.'] },
    { kind: 'text', text: 'However, the rest could not be translated.' },
    { kind: 'subhead', text: 'Developments in the 1950s and 1960s' },
    { kind: 'note', bullet: true, segments: ["Heinrich Berlin found that certain ‘glyphs’ in the writing referred to some well-known ", { blank: 33 }, ' in the Mayan Empire.'] },
    { kind: 'note', bullet: true, segments: ["Yuri Knorozov found that some ‘glyphs’ referred to a ", { blank: 34 }, ' rather than a word.'] },
    { kind: 'subhead', text: 'A new approach in the 1980s' },
    { kind: 'note', bullet: true, segments: ['Young academics immersed themselves in present-day Mayan art, ', { blank: 35 }, ' and religion.'] },
    { kind: 'note', bullet: true, segments: ['They found many of the manuscripts described the success of Mayan kings in ', { blank: 36 }, '.'] },
    { kind: 'note', bullet: true, segments: ['Academics had to learn the ', { blank: 37 }, ' of each writer.'] },
    { kind: 'text', text: 'The process was very time-consuming.' },
    { kind: 'subhead', text: 'The Maya Decipherment project' },
    { kind: 'note', bullet: true, segments: ['In 2003, David Stuart created a ', { blank: 38 }, ' that developed into a project for translating Mayan texts.'] },
    { kind: 'note', bullet: true, segments: ['Now, feedback on translations can be provided with great ', { blank: 39 }, ' by translators around the world.'] },
    { kind: 'note', bullet: true, segments: ['This led to new understanding – previously Mayans were believed to be only interested in ', { blank: 40 }, '.'] },
  ] }],
  questions: [
    q(31, 'note-completion', 'Threat to Spanish control', 'threat', 'The written language was seen as a threat to colonial control.'),
    q(32, 'note-completion', 'Sections of the text relating to ___', 'astronomy', 'The sections concerned astronomy.'),
    q(33, 'note-completion', 'Well-known ___ in the Mayan Empire', 'cities', 'Some glyphs named well-known cities.'),
    q(34, 'note-completion', 'Glyphs referred to a ___ rather than a word', 'sound', 'The glyphs represented a sound.'),
    q(35, 'note-completion', 'Present-day Mayan art, ___ and religion', 'culture', 'The academics also studied Mayan culture.'),
    q(36, 'note-completion', 'Success of Mayan kings in ___', 'wars', 'The manuscripts described kings’ success in wars.'),
    q(37, 'note-completion', 'Learn the ___ of each writer', 'style', 'Each writer’s style had to be learned.'),
    q(38, 'note-completion', 'David Stuart created a ___', 'blog', 'The project grew from a blog.'),
    q(39, 'note-completion', 'Feedback can be provided with great ___', 'speed', 'Translators can now exchange feedback with great speed.'),
    q(40, 'note-completion', 'Mayans believed to be only interested in ___', 'ceremony', 'The former interpretation focused on ceremony.'),
  ],
}

export const listeningFullTest21: IELTSTest = {
  id: 'ielts-listening-21', title: 'IELTS Listening Full Test 21', type: 'Academic', module: 'Listening',
  duration: 30, totalQuestions: 40, continuousAudioUrl: audioUrl,
  sections: [part1, part2, part3, part4],
}
