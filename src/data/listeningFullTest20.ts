import type { IELTSTest, ListeningOption, Question, Section } from '../types/ieltsTypes'

// Version 55124. Questions follow the user's scans; evidence follows their
// timestamped transcript. Source comparisons and the Q23 correction are documented
// in docs/LISTENING_FULL_TEST_20_SOURCE.md.
function q(number: number, type: Question['type'], text: string, correctAnswer: string, time: string, explanation: string, options?: string[]): Question {
  return { id: `lt20-q${number}`, number, type, text, correctAnswer, strictAnswerMatch: true,
    location: `Part ${Math.ceil(number / 10)} · ${time}`, explanation, options }
}

const part1: Section = {
  id: 'lt20-part1', title: 'Insurance Claim Form', partLabel: 'Part 1', partInstruction: 'Listen and answer questions 1 - 10.',
  groups: [{ range: 'Questions 1 - 10', instruction: 'Complete the form below. Write ONE WORD AND/OR A NUMBER for each answer.', blocks: [
    { kind: 'title', text: 'Insurance Claim Form' },
    { kind: 'text', text: 'Client name: John Turner' },
    { kind: 'note', segments: ['Client reference: ', { blank: 1 }] },
    { kind: 'note', segments: ['Client address: 23, ', { blank: 2 }, ' Drive, Browns Bay'] },
    { kind: 'note', segments: ['Client phone number: ', { blank: 3 }] },
    { kind: 'text', text: 'Cause of damage: Severe storm' },
    { kind: 'text', text: 'Date of incident: 18th May' },
    { kind: 'subhead', text: 'Description of damage:' },
    { kind: 'text', text: 'Inside the house' },
    { kind: 'note', bullet: true, segments: ['A ', { blank: 4 }, ' used by the children no longer works.'] },
    { kind: 'note', bullet: true, segments: ['Rain water has damaged the ', { blank: 5 }, ' by the door in the living room.'] },
    { kind: 'text', text: 'In the garage' },
    { kind: 'note', bullet: true, segments: ['A large ', { blank: 6 }, ' was affected by the water.'] },
    { kind: 'note', bullet: true, segments: ['Some new items of ', { blank: 7 }, ' equipment may need replacing.'] },
    { kind: 'text', text: 'Outside the house' },
    { kind: 'note', bullet: true, segments: ['A builder has already been contacted to inspect damage to the ', { blank: 8 }, ' of the house.'] },
    { kind: 'note', bullet: true, segments: ["The neighbour’s aerial has damaged a small ", { blank: 9 }] },
    { kind: 'subhead', text: 'Inspection:' },
    { kind: 'note', bullet: true, segments: ['Julia Lockhead will call the client to arrange a visit.'] },
    { kind: 'note', bullet: true, segments: ['The client has been advised to send some ', { blank: 10 }, ' as soon as possible.'] },
  ] }],
  questions: [
    q(1, 'note-completion', 'Client reference', 'TCJ700785 / TCJ 700785', '02:06–02:13', 'John gives the three letters TCJ followed by 700785. The spoken “O” represents zero in the numeric part of the reference.'),
    q(2, 'note-completion', '23, ___ Drive, Browns Bay', 'Ocean', '02:13–02:26', 'The agent confirms Ocean Drive. Write only Ocean because the number and Drive are already printed.'),
    q(3, 'note-completion', 'Client phone number', '0718849923 / 071 884 9923 / 07188 49923', '02:31–02:38', 'The confirmed cell phone number is 0718849923. Keep the initial zero and all ten digits.'),
    q(4, 'note-completion', 'A ___ used by the children no longer works', 'computer', '03:02–03:22', 'The children’s computer cannot operate. Their television still works, so television is a distractor.'),
    q(5, 'note-completion', 'Rain water has damaged the ___ by the door', 'carpet', '03:30–03:40', 'The carpet is particularly wet by the living-room door. The furniture was safe.'),
    q(6, 'note-completion', 'A large ___ was affected by the water', 'suitcase', '03:43–03:54', 'The big suitcase soaked up water and can no longer be used. The tools were not reached by the water.'),
    q(7, 'note-completion', 'Some new items of ___ equipment may need replacing', 'camping', '03:57–04:12', 'The recently bought equipment was intended for camping.'),
    q(8, 'note-completion', 'Inspect damage to the ___ of the house', 'roof', '04:55–05:04', 'Water is entering through the roof, so a builder has been contacted to inspect it.'),
    q(9, 'note-completion', 'The neighbour’s aerial has damaged a small ___', 'window', '05:05–05:21', 'The aerial broke a small window in the side wall of the kitchen.'),
    q(10, 'note-completion', 'Send some ___ as soon as possible', 'photographs / photos', '05:21–05:55', 'The agent asks for photographs of all damaged items to be emailed. Use a plural noun after some; receipts were mentioned earlier for a different purpose.'),
  ],
}

const schoolQuestions = [
  { number: 11, prompt: 'What is the main aim of the school’s new theatre?', options: ['to gain an international reputation', 'to give local people access to good performances', 'to provide support for talented amateur actors'], answer: 'B', time: '08:17–08:45', explanation: 'The mission is to give local audiences access to high-quality productions. Hosting international companies is a means of doing this, not the main aim.' },
  { number: 12, prompt: 'The first season’s theatre programme will include', options: ['plays by modern writers.', 'displays by Chinese acrobats.', 'concerts performed by schoolchildren.'], answer: 'A', time: '08:56–09:21', explanation: 'Modern drama is included. The Chinese acrobatic troupe cancelled; shows aimed at children are not concerts performed by children.' },
  { number: 13, prompt: 'Most of the theatre’s funding will come from', options: ['sponsors.', 'government grants.', 'ticket sales.'], answer: 'C', time: '09:22–09:51', explanation: 'The bulk of the revenue will come from ticket sales. Government subsidies are limited and sponsorship is additional.' },
  { number: 14, prompt: 'Which facility at the school is open to the public on a limited basis only?', options: ['the sports hall', 'the museum', 'the cafeteria'], answer: 'A', time: '10:17–10:40', explanation: 'The sports hall is reserved for students during term time and opens to everyone only during school holidays.' },
]
const mapAnswers = [
  { blank: 15, label: 'Theatre', answer: 'C', time: '11:26–11:39', explanation: 'The theatre is opposite car park P2, on its south side: location C.' },
  { blank: 16, label: 'New car park', answer: 'E', time: '11:40–12:30', explanation: 'The new car park is at the most northern end of the campus: E, above the existing car parks.' },
  { blank: 17, label: 'Bus stop', answer: 'G', time: '11:40–12:30', explanation: 'The bus stops and turns at the roundabout. G is beside the roundabout; it does not continue to Park Road.' },
  { blank: 18, label: 'Sports hall', answer: 'H', time: '11:40–12:30', explanation: 'Take the right fork from the entrance, pass the classroom block and cross the roundabout. H is further along on the right.' },
  { blank: 19, label: 'Cafeteria', answer: 'F', time: '12:31–12:43', explanation: 'The cafeteria is at the junction of Park Road and Rennies Drive, on the north side of Park Road: F.' },
  { blank: 20, label: 'Museum', answer: 'B', time: '12:44–13:03', explanation: 'Turn left after the main entrance and take the first right. At the junction the museum faces you: B.' },
]
const part2: Section = {
  id: 'lt20-part2', title: 'Rivermead School: facilities open to the public', partLabel: 'Part 2', partInstruction: 'Listen and answer questions 11 - 20.',
  groups: [
    { range: 'Questions 11 - 14', instruction: 'Choose the correct letter, A, B or C.', blocks: [
      { kind: 'title', text: 'Rivermead School: facilities open to the public' },
      ...schoolQuestions.map(({ number, prompt, options }) => ({ kind: 'mcq' as const, blank: number, prompt, options })),
    ] },
    { range: 'Questions 15 - 20', instruction: 'Label the map below. Write the correct letter, A-J, next to questions 15-20.', blocks: [
      { kind: 'image', src: '/images/ielts-listening-test20-rivermead-campus.svg', alt: 'Rivermead School Campus: locations A to J, main entrance, Park Road, Rennies Drive, car parks P1 and P2, classroom block and compass' },
      { kind: 'grid', columns: 'ABCDEFGHIJ'.split(''), inputMode: true, rows: mapAnswers.map(({ blank, label }) => ({ blank, label })) },
    ] },
  ],
  questions: [
    ...schoolQuestions.map(({ number, prompt, answer, time, explanation, options }) => q(number, 'multiple-choice', prompt, answer, time, explanation, options)),
    ...mapAnswers.map(({ blank, label, answer, time, explanation }) => q(blank, 'matching-information', label, answer, time, explanation)),
  ],
}

const netQuestions = [
  { number: 21, prompt: 'Edward heard about a type of mosquito net from', options: ['an administrator.', 'a doctor.', 'a friend.'], answer: 'A', time: '14:58–15:21', explanation: 'Edward spoke to an administrator at the medical centre. His friend spoke to a doctor.' },
  { number: 22, prompt: 'Edward believes that mosquito nets were first used in', options: ['China.', 'Japan.', 'Egypt.'], answer: 'C', time: '15:27–15:43', explanation: 'Edward mentions Cleopatra in ancient Egypt and says that was probably where nets were invented. Japan and China are mentioned but are not his answer.' },
  { number: 23, prompt: 'Chemical treatment of mosquito nets in the mid-twentieth century', options: ['was first developed by a soldier.', 'made them potentially dangerous to users.', 'was made possible by modern textiles.'], answer: 'B', time: '15:50–16:06', explanation: 'The DDT treatment was later found to be harmful to people as well as mosquitoes, so B is correct. Development for military use does not mean a soldier invented it.' },
  { number: 24, prompt: 'The owners of present-day nets', options: ['are likely to find they have an unpleasant smell.', 'should avoid using them every night.', 'may have difficulty obtaining the necessary chemical.'], answer: 'C', time: '16:09–16:33', explanation: 'Modern nets are safe and odour-free, but people in remote areas may struggle to obtain the chemical needed for re-treatment.' },
  { number: 25, prompt: 'According to Edward, Olyset nets are better than other nets because they', options: ['remain effective for longer.', 'use a greater number of chemicals.', 'give protection against more types of insects.'], answer: 'A', time: '16:38–17:06', explanation: 'Olyset nets release insecticide gradually and protect for at least five years, compared with one or two years for other nets.' },
]
const seminarOptions: ListeningOption[] = [
  { letter: 'A', text: 'workforce' }, { letter: 'B', text: 'sources of funding' },
  { letter: 'C', text: 'investment opportunities' }, { letter: 'D', text: 'unique features of the product' },
  { letter: 'E', text: 'future developments' }, { letter: 'F', text: 'production figures' },
  { letter: 'G', text: 'national economies' },
]
const part3: Section = {
  id: 'lt20-part3', title: 'Product development presentation: mosquito net', partLabel: 'Part 3', partInstruction: 'Listen and answer questions 21 - 30.',
  groups: [
    { range: 'Questions 21 - 25', instruction: 'Choose the correct letter, A, B or C.', blocks: [
      { kind: 'title', text: 'Product development presentation: mosquito net' },
      ...netQuestions.map(({ number, prompt, options }) => ({ kind: 'mcq' as const, blank: number, prompt, options })),
    ] },
    { range: 'Questions 26 - 30', instruction: 'Complete the flow-chart below. Choose FIVE answers from the box and write the correct letter, A-G, next to questions 26-30.', blocks: [
      { kind: 'grid', columns: seminarOptions.map(option => option.letter), options: seminarOptions, inputMode: true, rows: [] },
      { kind: 'title', text: 'Seminar presentation' },
      { kind: 'flow', boxes: [
        { segments: ['Context: need for anti-malarial products\nFigures relating to:\n• global incidence of the disease\n• impact on ', { blank: 26 }] },
        { segments: ['Mosquito nets\n• history\n• ', { blank: 27 }] },
        { segments: ['Production\n• information about ', { blank: 28 }, '\n• profile of manufacturer with description of ', { blank: 29 }, '\n• ', { blank: 30 }, ' (according to website)'] },
      ] },
    ] },
  ],
  questions: [
    ...netQuestions.map(({ number, prompt, answer, time, explanation, options }) => q(number, 'multiple-choice', prompt, answer, time, explanation, options)),
    q(26, 'matching-information', 'Figures relating to impact on ___', 'G', '18:32–18:47', 'The tutor requests statistics on how malaria affects countries’ economic output: national economies (G).'),
    q(27, 'matching-information', 'Mosquito nets: history and ___', 'D', '18:47–19:09', 'After the history, Edward should explain what makes Olyset different from other nets: unique features of the product (D).'),
    q(28, 'matching-information', 'Production: information about ___', 'B', '19:13–19:28', 'The tutor agrees to include where the project’s money comes from, including government and private sponsors: sources of funding (B).'),
    q(29, 'matching-information', 'Profile of manufacturer with description of ___', 'A', '19:36–19:47', 'The company profile should include staff numbers and the kinds of people employed: workforce (A).'),
    q(30, 'matching-information', '___ (according to website)', 'F', '19:55–20:14', 'The tutor asks for output figures from the company website. Edward gives over thirty million nets per year: production figures (F).'),
  ],
}

// Repetition of Test 10 Part 4 explicitly approved by the user for this full test.
const part4: Section = {
  id: 'lt20-part4', title: 'After Action Review Process', partLabel: 'Part 4', partInstruction: 'Listen and answer questions 31 - 40.',
  groups: [{ range: 'Questions 31 - 40', instruction: 'Complete the notes below. Write ONE WORD ONLY for each answer.', blocks: [
    { kind: 'title', text: 'After Action Review Process' },
    { kind: 'subhead', text: 'Background' },
    { kind: 'text', text: 'A way of evaluating during a project in order to make improvements' },
    { kind: 'note', segments: ['Developed by the ', { blank: 31 }] },
    { kind: 'subhead', text: 'Benefits' },
    { kind: 'text', text: 'Not just for large projects – can also be used after:' },
    { kind: 'note', bullet: true, segments: ['a staff meeting'] },
    { kind: 'note', bullet: true, segments: ['a ', { blank: 32 }, ' incident'] },
    { kind: 'note', segments: ['Develops better team communication because of the emphasis on ', { blank: 33 }] },
    { kind: 'subhead', text: 'What is an After Action Review?' },
    { kind: 'text', text: 'It’s a meeting that:' },
    { kind: 'note', bullet: true, segments: ['concentrates on results and the ', { blank: 34 }, ' for them'] },
    { kind: 'note', bullet: true, segments: ['encourages participation'] },
    { kind: 'note', bullet: true, segments: ['stresses the need to ', { blank: 35 }, ' each other'] },
    { kind: 'subhead', text: 'Things to remember when conducting an After Action Review' },
    { kind: 'text', text: 'Use an external facilitator (so stronger team members cannot dominate)' },
    { kind: 'note', segments: ['To encourage participation, get the group’s thoughts in ', { blank: 36 }] },
    { kind: 'note', segments: ['Remember to use ', { blank: 37 }, ' questions'] },
    { kind: 'note', segments: ['Give any recommendations to other team ', { blank: 38 }] },
    { kind: 'note', segments: ['Make sure you follow up on ideas and provide ', { blank: 39 }, ' for employees'] },
    { kind: 'note', segments: ['Remember to check the ', { blank: 40 }, ' often'] },
  ] }],
  questions: [
    q(31, 'note-completion', 'Developed by the ___', 'army', '22:42–22:56', 'The Army devised this process to learn quickly from field experience.'),
    q(32, 'note-completion', 'A ___ incident', 'safety', '23:13–23:23', 'The lecturer describes a review following a safety incident, to help avoid future accidents.'),
    q(33, 'note-completion', 'Emphasis on ___', 'learning', '23:24–23:37', 'A focus on learning improves communication within working groups.'),
    q(34, 'note-completion', 'Results and the ___ for them', 'reasons', '23:43–23:51', 'The meeting considers the outcomes and the reasons for them. The recording uses the plural reasons.'),
    q(35, 'note-completion', 'Need to ___ each other', 'trust', '23:52–24:01', 'The team needs to trust one another.'),
    q(36, 'note-completion', 'Get the group’s thoughts in ___', 'writing', '24:19–24:38', 'Putting comments in writing allows shy members to contribute without being intimidated.'),
    q(37, 'note-completion', 'Use ___ questions', 'open', '24:46–25:03', 'Ask open questions so participants do not search for a single supposedly perfect answer.'),
    q(38, 'note-completion', 'Other team ___', 'leaders', '25:10–25:31', 'Recommendations should reach non-participating team leaders so other teams can learn too. Use the plural leaders.'),
    q(39, 'note-completion', 'Provide ___ for employees', 'training', '25:38–25:48', 'Organise staff training around the ideas from the review to put them into practice.'),
    q(40, 'note-completion', 'Check the ___ often', 'time', '25:49–26:05', 'Keep an eye on the time so everything is covered in one session.'),
  ],
}

export const listeningFullTest20: IELTSTest = {
  id: 'ielts-listening-20', title: 'IELTS Listening Full Test 20',
  type: 'Academic', module: 'Listening', duration: 38, totalQuestions: 40,
  continuousAudioUrl: '/audio/ielts-listening/listening-full-test-20.mp3',
  sections: [part1, part2, part3, part4],
}
