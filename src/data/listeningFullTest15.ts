import type { IELTSTest, ListeningOption, Question, Section } from '../types/ieltsTypes'
import raceVillageMap from '../assets/ielts/listening-test15-race-village.png?inline'

// Questions: user screenshots. Answers: user-supplied version 54768 transcript.
// Source comparisons and original asset checksums: docs/LISTENING_FULL_TEST_15_SOURCE.md.
function q(number: number, type: Question['type'], text: string, correctAnswer: string, explanation: string, time: string, options?: string[]): Question {
  return { id: `lt15-q${number}`, number, type, text, correctAnswer, strictAnswerMatch: true, explanation, location: `54768 transcript, ${time}`, options }
}

const part1: Section = {
  id: 'lt15-part1', title: 'Holiday rental', partLabel: 'Part 1',
  partInstruction: 'Listen and answer questions 1 - 10.',
  groups: [{ range: 'Questions 1 - 10', instruction: 'Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer.', blocks: [
    { kind: 'title', text: 'Holiday rental' },
    { kind: 'example', segments: ['Owners’ name: Carol and Dave Marriott'] },
    { kind: 'subhead', text: 'Aster cottage' },
    { kind: 'note', bullet: true, segments: ['Available for week beginning ', { blank: 1 }] },
    { kind: 'note', bullet: true, segments: ['Cost for the week: $', { blank: 2 }] },
    { kind: 'subhead', text: 'Periwinkle Cottage' },
    { kind: 'text', text: '• The same price as Aster Cottage last year' },
    { kind: 'note', bullet: true, segments: ['Part of a building that was first used as a ', { blank: 3 }] },
    { kind: 'note', bullet: true, segments: ['The living room leads out to the ', { blank: 4 }] },
    { kind: 'note', bullet: true, segments: ['View of the ', { blank: 5 }, ' from the bedroom'] },
    { kind: 'note', bullet: true, segments: ['Bring our own ', { blank: 6 }] },
    { kind: 'note', bullet: true, segments: ['Doesn’t have a ', { blank: 7 }] },
    { kind: 'subhead', text: 'The town' },
    { kind: 'note', bullet: true, segments: ['The owner recommends the ', { blank: 8 }, ' restaurant'] },
    { kind: 'text', text: '• The town is well known for its antique shops' },
    { kind: 'subhead', text: 'Payment' },
    { kind: 'note', bullet: true, segments: ['Deposit: $', { blank: 9 }] },
    { kind: 'note', bullet: true, segments: ['Deadline for final payment: final day of ', { blank: 10 }] },
  ] }],
  questions: [
    q(1, 'note-completion', 'Available for week beginning ___', '14 September / September 14 / 14th September / September 14th', 'September 21 is already booked. Dave offers the previous week, beginning September 14, and the caller agrees. Include the month because it is not printed beside the blank.', '02:55–03:17'),
    q(2, 'note-completion', 'Cost for the week: $___', '835', 'Aster Cottage costs 835 dollars this year. 790 dollars was the price paid by the caller’s friends last year.', '03:17–03:31'),
    q(3, 'note-completion', 'Part of a building that was first used as a ___', 'school', 'The building was originally a school, then a post office, before it was divided into cottages.', '04:04–04:20'),
    q(4, 'note-completion', 'The living room leads out to the ___', 'deck', 'The living room opens onto the deck, where guests can eat when the weather is nice.', '04:34–04:41'),
    q(5, 'note-completion', 'View of the ___ from the bedroom', 'river', 'The caller asks about the river, and Dave confirms that it can be seen from the bedroom.', '04:41–04:50'),
    q(6, 'note-completion', 'Bring our own ___', 'towels', 'Bedding is provided, but towels cost extra unless guests bring their own. The recording uses the plural towels.', '04:50–05:02'),
    q(7, 'note-completion', 'Doesn’t have a ___', 'garage', 'There is no garage. Guests can usually park on the street in front of the cottage.', '05:02–05:20'),
    q(8, 'note-completion', 'The owner recommends the ___ restaurant', 'Chinese', 'Other people like the fish restaurant, but Dave personally recommends the Chinese restaurant.', '06:04–06:19'),
    q(9, 'note-completion', 'Deposit: $___', '200', 'Dave asks for a deposit of 200 dollars, separate from the final payment.', '06:36–06:52'),
    q(10, 'note-completion', 'Deadline for final payment: final day of ___', 'July', 'Because the owners will be away for much of August, Dave sets the deadline at the last day of July.', '06:36–06:52'),
  ],
}

const raceQuestions = [
  { number: 11, prompt: 'On the day of the race the speaker recommends parking', options: ['in the sports ground.', 'by the river.', 'in the shopping centre.'], answer: 'A', time: '08:41–09:15', explanation: 'The Jack Gray Sports Field is recommended. The riverside is reserved for emergency vehicles, and non-customers risk being towed at the shopping complex.' },
  { number: 12, prompt: 'The timing chip should be attached to', options: ['the shirt or singlet.', 'a shoe.', 'the wristband.'], answer: 'B', time: '09:17–09:38', explanation: 'The timing chip clips onto a shoe. The race number goes on the front of the shirt; the wristband is a separate item.' },
  { number: 13, prompt: 'Which group will run first?', options: ['yellow', 'red', 'purple'], answer: 'A', time: '09:40–10:09', explanation: 'The yellow group consists of elite athletes and starts first. The red group and strollers start at the back.' },
  { number: 14, prompt: 'The race organisers still need to find volunteers to help with', options: ['giving first aid.', 'handing out water.', 'starting the race.'], answer: 'B', time: '10:10–10:34', explanation: 'Volunteers are still needed to distribute water along the course. The start is covered, and St John’s Ambulance will provide first aid.' },
]
const mapRows = [
  { blank: 15, label: 'Stage' }, { blank: 16, label: 'T-shirt Stand' },
  { blank: 17, label: 'Bag Collection Area' }, { blank: 18, label: 'Information Centre' },
  { blank: 19, label: 'Prize Draw Box' }, { blank: 20, label: 'Water Station' },
]
const part2: Section = {
  id: 'lt15-part2', title: 'Bridge to Brisbane Fun Run', partLabel: 'Part 2',
  partInstruction: 'Listen and answer questions 11 - 20.',
  groups: [
    { range: 'Questions 11 - 14', instruction: 'Choose the correct letter, A, B or C.', blocks: [
      { kind: 'title', text: 'Bridge to Brisbane Fun Run' },
      ...raceQuestions.map(({ number, prompt, options }) => ({ kind: 'mcq' as const, blank: number, prompt, options })),
    ] },
    { range: 'Questions 15 - 20', instruction: 'Label the map below. Write the correct letter, A-I, next to questions 15-20.', blocks: [
      { kind: 'image', src: raceVillageMap, alt: 'Map of Race Village. Original A–I buildings, Bowen Road, Gregory Terrace, all exits, train station exit, finish line, two paths, shade tents, corporate catering and race village entry are retained.' },
      { kind: 'grid', columns: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'], inputMode: true, rows: mapRows },
    ] },
  ],
  questions: [
    ...raceQuestions.map(({ number, prompt, options, answer, explanation, time }) => q(number, 'multiple-choice', prompt, answer, explanation, time, options)),
    q(15, 'matching-information', 'Stage', 'F', 'After entering at the bottom right and following the course, the stage is on the runners’ right: building F.', '11:23–11:42'),
    q(16, 'matching-information', 'T-shirt Stand', 'A', 'Both paths after the finish line lead to the T-shirt stand at their far left end, marked A.', '11:44–12:47'),
    q(17, 'matching-information', 'Bag Collection Area', 'B', 'Bags are kept in the building on Bowen Road near the top-left exit, marked B.', '11:44–12:47'),
    q(18, 'matching-information', 'Information Centre', 'H', 'The information centre is in the middle of the map, just below the finish line. That building is H, not G.', '11:44–12:47'),
    q(19, 'matching-information', 'Prize Draw Box', 'G', 'The entry box is between the shade tents and corporate catering, which is position G.', '11:44–12:47'),
    q(20, 'matching-information', 'Water Station', 'I', 'The water station is beside the Gregory Terrace exit, to the left of corporate catering: position I.', '11:44–12:51'),
  ],
}

const farmQuestions = [
  { number: 21, prompt: 'What does Dr Owen advise Joel to include in the title of his project?', options: ['the location of the farms', 'the number of farmers', 'the types of farming'], answer: 'A', time: '15:18–15:55', explanation: 'The farms are all in the same region, so Dr Owen tells Joel to specify where they are. Joel agrees to amend the title.' },
  { number: 22, prompt: 'Why has Joel decided to do face-to-face interviews?', options: ['to see the farmers’ workplaces', 'to limit the time he spends on the project', 'to get fuller answers'], answer: 'C', time: '15:55–16:29', explanation: 'Joel expects farmers to speak more freely in person. He does not need to see their workplaces and acknowledges that interviews take more time.' },
  { number: 23, prompt: 'Joel agrees to investigate how farmers get information on new developments', options: ['by showing them a series of pictures.', 'by asking them open questions.', 'by sending them a checklist in advance.'], answer: 'B', time: '16:31–17:19', explanation: 'Joel first suggests a checklist, but accepts Dr Owen’s advice to ask open questions for spontaneous responses.' },
  { number: 24, prompt: 'Concerning government communication with farmers, the speakers agree that', options: ['much of it is irrelevant.', 'it is often insufficient for farmers’ needs.', 'the wording is sometimes unclear.'], answer: 'A', time: '17:24–17:50', explanation: 'The same information goes to all kinds of farmers, so much of it does not apply to the recipients. Both speakers agree on this.' },
  { number: 25, prompt: 'According to Joel’s reading about the cost of making changes, many British farmers', options: ['leave investment decisions to their accountants.', 'have too little time to calculate the costs of new methods.', 'are reluctant to spend money on improvements.'], answer: 'B', time: '17:50–18:23', explanation: 'Farmers are not opposed to investment, but are too busy to work out its financial implications. Many do not seek advice from accountants either.' },
  { number: 26, prompt: 'A survey of Australian sheep farmers found that most of them', options: ['are usually reluctant to make changes.', 'make changes based on limited research.', 'want plenty of evidence before they make changes.'], answer: 'B', time: '18:23–19:00', explanation: 'Most are willing to adopt new practices after only a few pieces of research, without waiting for overwhelming evidence.' },
]
const bookOptions: ListeningOption[] = [
  { letter: 'A', text: 'It’s badly organised.' }, { letter: 'B', text: 'It’s out of date.' },
  { letter: 'C', text: 'It’s clear.' }, { letter: 'D', text: 'It’s essential reading.' },
  { letter: 'E', text: 'It’s inaccurate.' }, { letter: 'F', text: 'It’s well illustrated.' },
  { letter: 'G', text: 'It’s boring.' },
]
const part3: Section = {
  id: 'lt15-part3', title: 'Farmers’ attitudes to new developments in agriculture', partLabel: 'Part 3',
  partInstruction: 'Listen and answer questions 21 - 30.',
  groups: [
    { range: 'Questions 21 - 26', instruction: 'Choose the correct letter, A, B or C.', blocks: [
      { kind: 'title', text: 'Farmers’ attitudes to new developments in agriculture' },
      ...farmQuestions.map(({ number, prompt, options }) => ({ kind: 'mcq' as const, blank: number, prompt, options })),
    ] },
    { range: 'Questions 27 - 30', instruction: 'What opinion is expressed about each of the following books? Choose FOUR answers from the box and write the correct letter, A-G, next to questions 27-30.', blocks: [
      { kind: 'subhead', text: 'Opinions' },
      { kind: 'grid', columns: bookOptions.map(option => option.letter), options: bookOptions, inputMode: true, rows: [] },
      { kind: 'subhead', text: 'Books' },
      { kind: 'grid', columns: bookOptions.map(option => option.letter), inputMode: true, rows: [
        { blank: 27, label: 'Contemporary Farming Manual' }, { blank: 28, label: 'Running a Small Farm' },
        { blank: 29, label: 'Agriculture and Economics' }, { blank: 30, label: 'How to Survive in Farming' },
      ] },
    ] },
  ],
  questions: [
    ...farmQuestions.map(({ number, prompt, options, answer, explanation, time }) => q(number, 'multiple-choice', prompt, answer, explanation, time, options)),
    q(27, 'matching-information', 'Contemporary Farming Manual', 'G', 'Although current and comprehensive, the book is described as dull and hard to get through: it is boring.', '19:44–20:06'),
    q(28, 'matching-information', 'Running a Small Farm', 'E', 'Much of its information is misleading or wrong: it is inaccurate, despite being entertaining.', '20:06–20:30'),
    q(29, 'matching-information', 'Agriculture and Economics', 'D', 'Its underlying theories apply universally, and it is a required textbook for agriculture students: essential reading.', '20:31–21:03'),
    q(30, 'matching-information', 'How to Survive in Farming', 'B', 'It was written years ago, farming has changed, and a new edition is needed: it is out of date.', '21:05–21:25'),
  ],
}

const part4: Section = {
  id: 'lt15-part4', title: 'Aboriginal Textile Design', partLabel: 'Part 4',
  partInstruction: 'Listen and answer questions 31 - 40.',
  groups: [{ range: 'Questions 31 - 40', instruction: 'Complete the notes below. Write ONE WORD ONLY for each answer.', blocks: [
    { kind: 'title', text: 'Aboriginal Textile Design' },
    { kind: 'subhead', text: 'Ernabella Arts Centre' },
    { kind: 'text', text: '• Artists produce craft and learn new techniques' },
    { kind: 'note', bullet: true, segments: ['Initially, artists produced rugs made from ', { blank: 31 }] },
    { kind: 'text', text: '• Later artists made batik and screen-printed fabrics' },
    { kind: 'subhead', text: 'Tiwi Designs' },
    { kind: 'note', bullet: true, segments: ['Early designs included ', { blank: 32 }, ' images'] },
    { kind: 'note', bullet: true, segments: ['Designs are linked to traditional beliefs, e.g. some designs are believed to bring ', { blank: 33 }] },
    { kind: 'subhead', text: 'Jimmy Pike' },
    { kind: 'note', bullet: true, segments: ['Inspired by the Australian landscape, especially the ', { blank: 34 }] },
    { kind: 'note', bullet: true, segments: ['Started creating art when he was in ', { blank: 35 }] },
    { kind: 'note', bullet: true, segments: ['His textiles were used to make ', { blank: 36 }] },
    { kind: 'subhead', text: 'Bronwyn Bancroft' },
    { kind: 'note', bullet: true, segments: ['Her work is a modern look at ', { blank: 37 }, ', and nature'] },
    { kind: 'note', bullet: true, segments: ['1995 - painted a successful Aboriginal athlete’s jeans with lizards and a ', { blank: 38 }] },
    { kind: 'note', bullet: true, segments: ['2001 - designed a ‘Journey of a Nation’ parade outfit with part of a ', { blank: 39 }, ' on it'] },
    { kind: 'subhead', text: 'Copyright Issues' },
    { kind: 'note', bullet: true, segments: ['Exploiting Aboriginal imagery affects the artists and the cultural group, e.g. ‘The ', { blank: 40 }, ' Case’'] },
  ] }],
  questions: [
    q(31, 'note-completion', 'Initially, artists produced rugs made from ___', 'wool', 'For the first thirty years, Ernabella artists made rugs using wool before moving into batik and screen printing.', '23:50–24:05'),
    q(32, 'note-completion', 'Early designs included ___ images', 'bird', 'Tiwi Designs incorporated bird motifs into its early designs. The singular bird modifies images.', '24:07–25:00'),
    q(33, 'note-completion', 'Some designs are believed to bring ___', 'rain', 'Some Tiwi textile patterns are chosen because they are believed to cause rain.', '25:01–25:18'),
    q(34, 'note-completion', 'Inspired by the Australian landscape, especially the ___', 'desert', 'Jimmy Pike’s work is particularly influenced by the desert landscape.', '25:26–25:42'),
    q(35, 'note-completion', 'Started creating art when he was in ___', 'prison', 'Pike began his life as an artist in prison, where teachers recognised his talent.', '25:50–26:06'),
    q(36, 'note-completion', 'His textiles were used to make ___', 'clothing', 'His designs were transferred onto textiles used to produce clothing. Cotton is the fabric, not the finished product.', '26:07–26:33'),
    q(37, 'note-completion', 'Her work is a modern look at ___ and nature', 'family', 'Bancroft’s work presents a contemporary view of family and the natural environment.', '26:34–27:44'),
    q(38, 'note-completion', 'Painted jeans with lizards and a ___', 'rainbow', 'She added a rainbow to Cathy Freeman’s jeans to represent optimism, alongside the lizards.', '26:34–27:44'),
    q(39, 'note-completion', 'Parade outfit with part of a ___ on it', 'snake', 'The parade outfit featured a snake without a head or tail, representing an ongoing culture.', '26:34–27:44'),
    q(40, 'note-completion', 'The ___ Case', 'carpet', 'The copyright dispute over rugs using stolen Aboriginal imagery became known as the Carpet Case.', '28:11–28:27'),
  ],
}

export const listeningFullTest15: IELTSTest = {
  id: 'ielts-listening-15', title: 'IELTS Listening Full Test 15',
  // Preserve the complete 31:49 source recording without truncation or speed changes.
  type: 'Academic', module: 'Listening', duration: 32, totalQuestions: 40,
  continuousAudioUrl: '/audio/ielts-listening/listening-full-test-15.mp3',
  sections: [part1, part2, part3, part4],
}
