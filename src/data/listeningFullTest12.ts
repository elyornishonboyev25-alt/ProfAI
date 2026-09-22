import type { IELTSTest, ListeningOption, Question, Section } from '../types/ieltsTypes'

// Questions: user screenshots. Answers: user-supplied 56658_eng.pdf.
// Source evidence and audio provenance: docs/LISTENING_FULL_TEST_12_SOURCE.md.
function q(number: number, type: Question['type'], text: string, correctAnswer: string, explanation: string, page: number, options?: string[]): Question {
  return { id: `lt12-q${number}`, number, type, text, correctAnswer, explanation, location: `56658 script, page ${page}`, options }
}

const part1: Section = {
  id: 'lt12-part1', title: 'Film Club', partLabel: 'Part 1',
  partInstruction: 'Listen and answer questions 1 - 10.',
  groups: [{ range: 'Questions 1 - 10', instruction: 'Write ONE WORD AND/OR A NUMBER for each answer.', blocks: [
    { kind: 'title', text: 'Film Club' },
    { kind: 'subhead', text: 'Membership information' },
    { kind: 'text', text: 'Club meets every 2 weeks' },
    { kind: 'note', segments: ['No ', { blank: 1 }, ' limit'] },
    { kind: 'note', segments: ['Student membership costs £', { blank: 2 }, ' per season'] },
    { kind: 'text', text: 'Members get:' },
    { kind: 'text', text: '• free entry to club films' },
    { kind: 'note', bullet: true, segments: ['£', { blank: 3 }, ' reduction on other films at cinema'] },
    { kind: 'note', segments: ["Members are entitled to 3 hours’ free ", { blank: 4 }] },
    { kind: 'subhead', text: 'Films to be shown:' },
    { kind: 'subhead', text: 'Oct 14: Pablo' },
    { kind: 'note', bullet: true, segments: ['about a child in ', { blank: 5 }, ' who runs away from home and wins a ', { blank: 6 }, ' competition on TV'] },
    { kind: 'subhead', text: 'Oct 28: The Soldier' },
    { kind: 'note', bullet: true, segments: ['with live ', { blank: 7 }, ' accompaniment'] },
    { kind: 'note', bullet: true, segments: ['made in the year ', { blank: 8 }] },
    { kind: 'note', bullet: true, segments: ['type of film: a ', { blank: 9 }] },
    { kind: 'subhead', text: 'Nov 11: Tiger' },
    { kind: 'text', text: '• cartoon aimed at adults' },
    { kind: 'note', bullet: true, segments: ['followed by a ', { blank: 10 }, ' by the director'] },
  ] }],
  questions: [
    q(1, 'note-completion', 'No ___ limit', 'age', 'People of any age can join, including the sixteen-year-old caller.', 2),
    q(2, 'note-completion', 'Student membership costs £___ per season', '21.50', 'Students pay the concession rate of £21.50, not the basic £24 rate.', 2),
    q(3, 'note-completion', '£___ reduction on other films at cinema', '2 / two', 'Members get two pounds off other cinema tickets. £4.50 is the discounted ticket price, not the reduction.', 2),
    q(4, 'note-completion', 'Members are entitled to three hours of free ___', 'parking', 'Membership includes three hours of complimentary parking when a film is on.', 2),
    q(5, 'note-completion', 'Pablo: a child in ___', 'Argentina', 'The caller identifies Argentina as the setting, and the staff member agrees.', 3),
    q(6, 'note-completion', 'Pablo: wins a ___ competition on TV', 'singing', 'The initial suggestion of a dance competition is corrected to a singing competition.', 3),
    q(7, 'note-completion', 'The Soldier: live ___ accompaniment', 'piano', 'This screening has a piano accompaniment. The organ is mentioned only as a historical alternative.', 4),
    q(8, 'note-completion', 'The Soldier: year of production', '1922', 'The film was made in 1922. The other years refer to the development of films with sound.', 4),
    q(9, 'note-completion', 'The Soldier: type of film', 'comedy', 'It is billed as a comedy, despite its title suggesting a war film.', 4),
    q(10, 'note-completion', 'Tiger: followed by a ___ by the director', 'talk', 'The director will give a talk after the film.', 4),
  ],
}

const volunteerQuestions = [
  { number: 11, prompt: 'Stephen says the founders of extrahands.com originally needed help in', options: ['preparing their fields for planting.', 'harvesting their organic crops.', 'constructing their farm buildings.'], answer: 'A', explanation: 'They needed help clearing the fields for cultivation, before growing their crops.', page: 5 },
  { number: 12, prompt: 'To remain an active member of extrahands.com, you must', options: ['update your form on the website every year.', 'pay a subscription of $25 every year.', 'use the scheme as a host or volunteer every year.'], answer: 'A', explanation: 'Every twelve months members must check and update their website form. The subscription is paid only once.', page: 5 },
  { number: 13, prompt: 'Most extrahands.com volunteers search for jobs on the website according to', options: ['the type of work available.', 'the geographical location.', 'the length of time required.'], answer: 'B', explanation: 'Most volunteers search by country or region; only a few search by length of placement.', page: 5 },
  { number: 14, prompt: 'Stephen recommends that the host and volunteer should', options: ['confirm details of the arrangement in writing.', 'draw up a formal written contract.', 'meet each other before setting terms.'], answer: 'A', explanation: 'Both parties need a written record before arrival, but no formal legal documents are required.', page: 6 },
  { number: 15, prompt: 'To deal with members’ problems, extrahands.com have a system', options: ['for checking each new member online.', 'for allowing online feedback.', 'for inspecting work and accommodation.'], answer: 'B', explanation: 'An online message board lets members report difficulties; the organisation cannot investigate every member.', page: 6 },
]
const jobOptions: ListeningOption[] = [
  { letter: 'A', text: 'cook' }, { letter: 'B', text: 'gardener' },
  { letter: 'C', text: 'construction worker' }, { letter: 'D', text: 'tour guide' },
  { letter: 'E', text: 'farm labourer' }, { letter: 'F', text: 'Editor' },
  { letter: 'G', text: 'swimming pool cleaner' },
]
const countries = ['Portugal', 'Australia', 'South Korea', 'USA', 'Italy']
const part2: Section = {
  id: 'lt12-part2', title: 'extrahands.com', partLabel: 'Part 2',
  partInstruction: 'Listen and answer questions 11 - 20.',
  groups: [
    { range: 'Questions 11 - 15', instruction: 'Choose the correct letter, A, B or C.', blocks: [
      { kind: 'title', text: 'extrahands.com' },
      ...volunteerQuestions.map(({ number, prompt, options }) => ({ kind: 'mcq' as const, blank: number, prompt, options })),
    ] },
    { range: 'Questions 16 - 20', instruction: 'Which job did Stephen do on his placement in each of the following countries? Choose FIVE answers from the box and write the correct letter, A-G, next to questions 16-20.', blocks: [
      { kind: 'subhead', text: 'Jobs' },
      { kind: 'grid', columns: jobOptions.map(option => option.letter), options: jobOptions, inputMode: true, rows: countries.map((label, index) => ({ blank: index + 16, label })) },
    ] },
  ],
  questions: [
    ...volunteerQuestions.map(({ number, prompt, options, answer, explanation, page }) => q(number, 'multiple-choice', prompt, answer, explanation, page, options)),
    q(16, 'matching-information', 'Portugal', 'F', 'He corrected the English and suggested improvements to a guidebook, working as an editor.', 6),
    q(17, 'matching-information', 'Australia', 'A', 'Although the placement was on a farm, he cooked meals for thirty sheep shearers.', 6),
    q(18, 'matching-information', 'South Korea', 'D', 'He showed visiting Americans around, working as a tour guide.', 6),
    q(19, 'matching-information', 'USA', 'B', 'He dug and planted flowers and vegetables. The swimming pool describes the location, not his job.', 6),
    q(20, 'matching-information', 'Italy', 'C', 'He helped a family build an additional room onto their house.', 7),
  ],
}

const courseQuestions = [
  { number: 21, prompt: 'What problem is Lorna having with her report?', options: ['listing the references', 'keeping to the word limit', 'writing the evaluation'], answer: 'B', explanation: 'Lorna says evaluating the course is simple; her challenge is not going over the allowed length.', page: 7 },
  { number: 22, prompt: 'Why did Charles take the song-writing course?', options: ['to improve his job prospects', 'to increase his self-confidence', 'to develop his self-expression'], answer: 'C', explanation: 'He wanted new techniques for communicating feelings and emotions. He was already confident about singing.', page: 8 },
  { number: 23, prompt: 'Which type of work did Lorna most enjoy?', options: ['individual work', 'pair work', 'group work'], answer: 'C', explanation: 'Her favourite part was working in small groups with an expert advisor. Pair work was difficult.', page: 8 },
  { number: 24, prompt: 'Which aspect of the course content did both students find interesting?', options: ['song structure', 'writing a chorus', 'lyrical styles and forms'], answer: 'A', explanation: 'Both agree that a song needs structure or shape. The chorus was familiar and lyrical styles were tedious.', page: 8 },
  { number: 25, prompt: 'Lorna found writing a song', options: ['impossible.', 'tiring.', 'amusing.'], answer: 'B', explanation: 'She finished the song but was exhausted by the difficult collaboration.', page: 9 },
]
const workshopOptions: ListeningOption[] = [
  { letter: 'A', text: 'use of own memories' }, { letter: 'B', text: 'full use of the stage' },
  { letter: 'C', text: 'relaxation techniques' }, { letter: 'D', text: 'physical expression of character' },
  { letter: 'E', text: 'play readings' }, { letter: 'F', text: 'acting without preparation' },
  { letter: 'G', text: 'using a range of accents' }, { letter: 'H', text: 'following instructions' },
]
const teachers = ['Bob Lacey', 'Evelyn Chance', 'Ted Winter', 'Kevin Gray', 'Dorothy Thomas']
const part3: Section = {
  id: 'lt12-part3', title: 'Song-writing course for drama students', partLabel: 'Part 3',
  partInstruction: 'Listen and answer questions 21 - 30.',
  groups: [
    { range: 'Questions 21 - 25', instruction: 'Choose the correct letter, A, B or C.', blocks: [
      { kind: 'title', text: 'Song-writing course for drama students' },
      ...courseQuestions.map(({ number, prompt, options }) => ({ kind: 'mcq' as const, blank: number, prompt, options })),
    ] },
    { range: 'Questions 26 - 30', instruction: 'What is the focus of the drama workshop run by each of the following teachers? Choose FIVE answers from the box and write the correct letter, A-H, next to questions 26-30.', blocks: [
      { kind: 'subhead', text: 'Focus of drama workshop' },
      { kind: 'grid', columns: workshopOptions.map(option => option.letter), options: workshopOptions, inputMode: true, rows: teachers.map((label, index) => ({ blank: index + 26, label })) },
    ] },
  ],
  questions: [
    ...courseQuestions.map(({ number, prompt, options, answer, explanation, page }) => q(number, 'multiple-choice', prompt, answer, explanation, page, options)),
    q(26, 'matching-information', 'Bob Lacey', 'G', 'His voice coaching develops dialects and different pronunciation, corresponding to a range of accents.', 9),
    q(27, 'matching-information', 'Evelyn Chance', 'B', 'Her stage-fighting workshop teaches actors to use the whole available space.', 10),
    q(28, 'matching-information', 'Ted Winter', 'D', 'He teaches actors to convey emotions through their bodies and faces without speaking.', 10),
    q(29, 'matching-information', 'Kevin Gray', 'H', 'His workshop emphasises listening to the director and following the director’s instructions.', 10),
    q(30, 'matching-information', 'Dorothy Thomas', 'C', 'Her activities reduce stress and clear the mind, so the focus is relaxation.', 10),
  ],
}

const part4: Section = {
  id: 'lt12-part4', title: 'Office Design', partLabel: 'Part 4',
  partInstruction: 'Listen and answer questions 31 - 40.',
  groups: [{ range: 'Questions 31 - 40', instruction: 'Complete the notes below. Write ONE WORD ONLY for each answer.', blocks: [
    { kind: 'title', text: 'Office Design' },
    { kind: 'subhead', text: 'Early 20th Century' },
    { kind: 'note', bullet: true, segments: ['workers employed to do ', { blank: 31 }, ' were arranged in rows'] },
    { kind: 'subhead', text: '1960s to present' },
    { kind: 'text', text: 'Variations in design of open-plan offices:' },
    { kind: 'note', bullet: true, segments: ['first, workers had individual ', { blank: 32 }] },
    { kind: 'note', bullet: true, segments: ['later, they had cubicles with high or low ', { blank: 33 }] },
    { kind: 'note', bullet: true, segments: ['nowadays, workers may have to ', { blank: 34 }, ' a work area'] },
    { kind: 'subhead', text: 'Survey results' },
    { kind: 'text', text: 'Attitudes of employees to open-plan designs:' },
    { kind: 'note', bullet: true, segments: ['there is a lack of ', { blank: 35 }, ' and ', { blank: 36 }] },
    { kind: 'note', bullet: true, segments: ['they pose a risk to our ', { blank: 37 }, ' (staff records support this)'] },
    { kind: 'text', text: 'Attitudes of employers to open-plan designs:' },
    { kind: 'note', bullet: true, segments: ['they significantly reduce rent and ', { blank: 38 }, ' costs'] },
    { kind: 'text', text: '• they improve teamwork and communication' },
    { kind: 'note', bullet: true, segments: ['they can make ', { blank: 39 }, ' staff easier'] },
    { kind: 'note', segments: ['In reality, employees are unhappy and they are often distracted by the ', { blank: 40 }, ' in the office.'] },
  ] }],
  questions: [
    q(31, 'note-completion', 'Workers employed to do ___ were arranged in rows', 'typing', 'Early open-plan offices employed large numbers of people to do typing.', 11),
    q(32, 'note-completion', 'First, workers had individual ___', 'desks', 'The early designs featured separate desks.', 11),
    q(33, 'note-completion', 'Cubicles with high or low ___', 'screens', 'Cubicle screens could be high or low enough to see the manager.', 11),
    q(34, 'note-completion', 'Workers may have to ___ a work area', 'share', 'Hot desking asks employees on different shifts to share the same workstation.', 11),
    q(35, 'note-completion', 'There is a lack of ___ and security', 'privacy', 'Employees feel open-plan offices take away their privacy.', 11),
    q(36, 'note-completion', 'There is a lack of privacy and ___', 'security', 'Employees carry valuables with them because they feel there is less security.', 11),
    q(37, 'note-completion', 'Open-plan designs pose a risk to our ___', 'health', 'Staff records support the complaint that open-plan offices are bad for health.', 11),
    q(38, 'note-completion', 'They reduce rent and ___ costs', 'energy', 'Employers save both rent and energy costs.', 11),
    q(39, 'note-completion', 'They can make ___ staff easier', 'training', 'New employees can observe other workers, which helps in training staff.', 11),
    q(40, 'note-completion', 'Employees are distracted by the ___ in the office', 'noise', 'Workers are distracted by the noise around them.', 12),
  ],
}

export const listeningFullTest12: IELTSTest = {
  id: 'ielts-listening-12', title: 'IELTS Listening Full Test 12',
  type: 'Academic', module: 'Listening', duration: 30, totalQuestions: 40,
  continuousAudioUrl: '/audio/ielts-listening/listening-full-test-12.mp3',
  sections: [part1, part2, part3, part4],
}
