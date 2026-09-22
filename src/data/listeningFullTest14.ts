import type { IELTSTest, ListeningOption, Question, Section } from '../types/ieltsTypes'
import educationHouseDiagram from '../assets/ielts/listening-test14-education-house.jpg?inline'

// User-supplied questions and timed transcript, IELTS version 57262.
// Source comparisons (including the corrected Q29 key): docs/LISTENING_FULL_TEST_14_SOURCE.md.
function q(number: number, type: Question['type'], text: string, correctAnswer: string, explanation: string, time: string, options?: string[]): Question {
  return { id: `lt14-q${number}`, number, type, text, correctAnswer, explanation, location: `57262 transcript, ${time}`, options }
}

const part1: Section = {
  id: 'lt14-part1', title: 'Getting a job with an airline', partLabel: 'Part 1',
  partInstruction: 'Listen and answer questions 1 - 10.',
  groups: [{ range: 'Questions 1 - 10', instruction: 'Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer.', blocks: [
    { kind: 'title', text: 'Getting a job with an airline' },
    { kind: 'example', segments: ['Job: cabin crew attendant'] },
    { kind: 'subhead', text: 'Duties include' },
    { kind: 'text', text: '• giving the safety demonstration' },
    { kind: 'note', bullet: true, segments: ['some responsibility for ', { blank: 1 }, ' from sales during the flight'] },
    { kind: 'text', text: '• serving food' },
    { kind: 'subhead', text: 'Requirements' },
    { kind: 'note', bullet: true, segments: ['must be over age 19 and at least ', { blank: 2 }, ' cm tall'] },
    { kind: 'note', bullet: true, segments: ['basic academic requirements: English and ', { blank: 3 }] },
    { kind: 'note', bullet: true, segments: ['at least one other ', { blank: 4 }, ' is desirable'] },
    { kind: 'note', bullet: true, segments: ['must be able to ', { blank: 5 }] },
    { kind: 'subhead', text: 'Training will include' },
    { kind: 'note', bullet: true, segments: ['what to do in case of ', { blank: 6 }, ' during a flight'] },
    { kind: 'note', bullet: true, segments: ['awareness of different ', { blank: 7 }] },
    { kind: 'subhead', text: 'Application' },
    { kind: 'note', bullet: true, segments: ['the airline is called ', { blank: 8 }] },
    { kind: 'text', text: '• can download application form from website' },
    { kind: 'text', text: '• mention experience of:' },
    { kind: 'note', indent: true, segments: ['— dealing with questions from supermarket customers'] },
    { kind: 'note', indent: true, segments: ['— working in a ', { blank: 9 }, ' (voluntary work)'] },
    { kind: 'subhead', text: 'Other information' },
    { kind: 'note', bullet: true, segments: ["you don't have to buy a ", { blank: 10 }] },
  ] }],
  questions: [
    q(1, 'note-completion', 'Some responsibility for ___ from sales during the flight', 'money', 'Ellie asks whether she would be dealing with money; Greg confirms that she would be responsible for it.', '03:35–03:44'),
    q(2, 'note-completion', 'Must be at least ___ cm tall', '168', 'The minimum height is 168 centimetres. 169 centimetres is Ellie’s own height, not the requirement.', '03:47–04:04'),
    q(3, 'note-completion', 'Basic academic requirements: English and ___', 'maths / math / mathematics', 'Greg specifies a good level of written and spoken English and also maths.', '04:07–04:13'),
    q(4, 'note-completion', 'At least one other ___ is desirable', 'language', 'Speaking another language is an advantage, although it is not essential for cabin crew.', '04:17–04:24'),
    q(5, 'note-completion', 'Must be able to ___', 'swim', 'Greg asks if Ellie can swim and confirms that this is another requirement.', '04:35–04:42'),
    q(6, 'note-completion', 'What to do in case of ___ during a flight', 'illness', 'Training covers what action to take if a passenger suddenly has an illness while in the air.', '05:30–05:43'),
    q(7, 'note-completion', 'Awareness of different ___', 'cultures', 'Training develops awareness of the variety of cultures passengers may come from.', '05:47–05:59'),
    q(8, 'note-completion', 'The airline is called ___', 'Eurontas', 'Greg spells the name E-U-R-O-N-T-A-S and clarifies that the middle letter is N for November.', '06:06–06:21'),
    q(9, 'note-completion', 'Working in a ___ (voluntary work)', 'team', 'Ellie did voluntary work as part of a team. Greg says the airline values being able to work with others.', '06:48–07:02'),
    q(10, 'note-completion', "You don't have to buy a ___", 'uniform', 'Unlike some airlines, this airline provides the uniform, so employees do not pay for it.', '07:03–07:10'),
  ],
}

const scholarshipOptions = ['people working as temporary staff', 'people with management experience', 'people straight from college', "people with at least three years’ experience", 'people with or without qualifications']
const industryOptions = ['It mainly attracts UK tourists.', 'It pays high wages.', 'It is very important for the Scottish economy.', 'It is highly regarded by visitors.', 'It is attracting a lot of investment.']
const hotelQuestions = [
  { number: 15, prompt: 'Why did Marie start working at the Rock Hotel?', options: ['It was the only job available.', 'She needed a job with flexible working hours.', 'She wanted a job working with people.'], answer: 'B', time: '11:39–12:02', explanation: 'She needed work that fitted around her young family, including time off during school holidays. She discovered that she enjoyed working with people after starting.' },
  { number: 16, prompt: 'What did the scholarship application process involve?', options: ['giving a presentation', 'writing a report about the Rock Hotel', 'researching the role of hotel manager'], answer: 'B', time: '12:02–12:31', explanation: 'Applicants produce a report about their current workplace and how they could improve it. Marie had worried about giving a presentation, but this was not required.' },
  { number: 17, prompt: 'What does Marie say about the other winners she met?', options: ['They were not as old as she expected.', 'They were doing a variety of jobs in the hotel sector.', 'Most of them had applied for scholarships before.'], answer: 'A', time: '12:32–13:01', explanation: 'Marie expected to be one of the youngest, but at least half of the winners were younger than her. Different types of workplaces are mentioned, not a variety of hotel jobs.' },
  { number: 18, prompt: 'Marie says that at the Florida Beach Hotel, every member of staff', options: ['takes part in annual customer service training sessions.', 'is responsible for providing an efficient service.', 'is expected to interact with visitors.'], answer: 'C', time: '13:01–13:26', explanation: 'All staff are encouraged to chat with guests, even when clearing tables. Marie contrasts this personal approach with hotels that focus on efficiency.' },
  { number: 19, prompt: "What did Marie find out about people's attitude to visiting Scotland?", options: ['Most people would be interested in visiting it.', 'People knew a surprising amount about it.', 'People only wanted to see a limited number of places.'], answer: 'C', time: '13:28–13:52', explanation: 'People considering a visit were interested only in Edinburgh and St Andrews. The majority had never considered a holiday in Scotland.' },
  { number: 20, prompt: 'What improvement has Marie introduced at the Rock Hotel?', options: ['getting better feedback from customers', 'providing more information for customers', 'making contact with more customers'], answer: 'A', time: '13:53–14:21', explanation: 'She redesigned the customer survey and emails it after guests return home so that they have time to give more detailed opinions.' },
]
const part2: Section = {
  id: 'lt14-part2', title: 'Hospitality scholarships in Scotland', partLabel: 'Part 2',
  partInstruction: 'Listen and answer questions 11 - 20.',
  groups: [
    { range: 'Questions 11 and 12', instruction: 'Choose TWO letters, A-E.', blocks: [
      { kind: 'multi-mcq', blanks: [11, 12], prompt: 'Which TWO kinds of people are the scholarships intended for?', options: scholarshipOptions, selectionLimit: 2 },
    ] },
    { range: 'Questions 13 and 14', instruction: 'Choose TWO letters, A-E.', blocks: [
      { kind: 'multi-mcq', blanks: [13, 14], prompt: 'Which TWO things does Marie say about the hospitality industry in Scotland?', options: industryOptions, selectionLimit: 2 },
    ] },
    { range: 'Questions 15 - 20', instruction: 'Choose the correct letter, A, B or C.', blocks: hotelQuestions.map(({ number, prompt, options }) => ({ kind: 'mcq', blank: number, prompt, options })) },
  ],
  questions: [
    q(11, 'multiple-choice', 'First kind of person the scholarships are intended for', 'D', 'Applicants must have worked in hospitality for three years, although not necessarily for the same organisation. D and E may be selected in either order.', '09:13–09:59', scholarshipOptions),
    q(12, 'multiple-choice', 'Second kind of person the scholarships are intended for', 'E', 'There are no minimum qualifications required. Applicants with or without qualifications can apply. D and E may be selected in either order.', '09:13–09:59', scholarshipOptions),
    q(13, 'multiple-choice', 'First statement about the Scottish hospitality industry', 'C', 'Around ten percent of people in Scotland depend on hospitality for their income, showing its importance to the economy. C and D may be selected in either order.', '10:00–10:24', industryOptions),
    q(14, 'multiple-choice', 'Second statement about the Scottish hospitality industry', 'D', 'Marie refers to Scotland’s reputation as a quality destination and visitors continuing to have a positive experience. C and D may be selected in either order.', '10:25–10:36', industryOptions),
    ...hotelQuestions.map(({ number, prompt, options, answer, explanation, time }) => q(number, 'multiple-choice', prompt, answer, explanation, time, options)),
  ],
}

const diagramOptions: ListeningOption[] = [
  { letter: 'A', text: 'fresh air is removed' }, { letter: 'B', text: 'fresh air is pulled in' },
  { letter: 'C', text: 'heat loss is reduced' }, { letter: 'D', text: 'rainwater is checked' },
  { letter: 'E', text: 'rainwater is used' }, { letter: 'F', text: 'old air is removed' },
  { letter: 'G', text: 'temperature is checked' }, { letter: 'H', text: 'water temperature is reduced' },
  { letter: 'I', text: 'water is stored' },
]
const houseQuestions = [
  { number: 27, prompt: 'What do John and Debbie think will surprise visitors to the Education House building?', options: ['how high the building is', 'where the main entrance is', 'what is on the outside walls'], answer: 'B', time: '19:17–19:42', explanation: 'The unusual entrance is through a shopping arcade behind a small cafe. The building’s height and vegetation on its walls are not considered surprising.' },
  { number: 28, prompt: 'What is their reaction to the findings on staff productivity in the building?', options: ['They think the findings are predictable.', 'They believe more research should be done.', 'They suggest the findings are reported in the media.'], answer: 'A', time: '19:42–20:08', explanation: 'They regard the calming effect of greenery as obvious and say newspapers have reported it for years. They do not call for further research or publicity.' },
  { number: 29, prompt: "What do they think about the 'edge space' in the building?", options: ['It might be unpopular with staff.', 'It is a surprising part of the design.', 'It is an area for managers.'], answer: 'B', time: '20:07–20:29', explanation: 'The speaker is amazed that management allowed this social space and says the staff must love it. This supports B; A contradicts the transcript, and the space is for workers, not managers.' },
  { number: 30, prompt: "What could be a problem for the building's water system?", options: ['the reaction of the staff', 'the completion date', 'the possible health hazards'], answer: 'A', time: '20:28–20:56', explanation: 'They expect staff to respond badly to recycled water. The project is on schedule and the water has been proven to pose no health risks.' },
]
const part3: Section = {
  id: 'lt14-part3', title: 'Education House', partLabel: 'Part 3',
  partInstruction: 'Listen and answer questions 21 - 30.',
  groups: [
    { range: 'Questions 21 - 26', instruction: 'Label the diagram below. Choose SIX answers from the box and write the correct letter, A-I, next to questions 21-26.', blocks: [
      { kind: 'grid', columns: diagramOptions.map(option => option.letter), options: diagramOptions, inputMode: true, rows: [] },
      { kind: 'image', src: educationHouseDiagram, alt: 'Education House diagram: cooling tower (21) at the left of the roof, weather station (22) at the right of the roof, shower tower (23) on the right wall, tank (24) in the basement, balcony (25) below the light shelf and windows (26) above it. Timber shutters, light shelf, basement, trees, arrows and all six original numbered spaces are retained.' },
      { kind: 'grid', columns: diagramOptions.map(option => option.letter), inputMode: true, rows: [
        { blank: 21, label: 'Cooling Tower' }, { blank: 22, label: 'Weather Station' },
        { blank: 23, label: 'Shower Tower' }, { blank: 24, label: 'Tank' },
        { blank: 25, label: 'Balcony' }, { blank: 26, label: 'Windows' },
      ] },
    ] },
    { range: 'Questions 27 - 30', instruction: 'Choose the correct letter, A, B or C.', blocks: houseQuestions.map(({ number, prompt, options }) => ({ kind: 'mcq', blank: number, prompt, options })) },
  ],
  questions: [
    q(21, 'matching-information', 'Cooling Tower', 'F', 'Hot, stale air rises through a chimney and roof fans push it outside: old air is removed.', '16:36–16:50'),
    q(22, 'matching-information', 'Weather Station', 'G', 'The weather station monitors how cool the outside air is before computers activate heating or cooling: temperature is checked.', '16:50–17:07'),
    q(23, 'matching-information', 'Shower Tower', 'B', 'Water falling through the tube sucks in air from outside: fresh air is pulled in.', '17:10–17:27'),
    q(24, 'matching-information', 'Tank', 'H', 'Metal balls absorb heat as water passes through the tank: water temperature is reduced. Storage is not the function described.', '17:26–17:48'),
    q(25, 'matching-information', 'Balcony', 'E', 'Rainwater from the roof waters the plants covering the outside wall: rainwater is used.', '17:49–18:00'),
    q(26, 'matching-information', 'Windows', 'C', 'Smaller upper windows waste less heat and save energy: heat loss is reduced.', '18:00–18:20'),
    ...houseQuestions.map(({ number, prompt, options, answer, explanation, time }) => q(number, 'multiple-choice', prompt, answer, explanation, time, options)),
  ],
}

const part4: Section = {
  id: 'lt14-part4', title: 'Textiles with Business Studies', partLabel: 'Part 4',
  partInstruction: 'Listen and answer questions 31 - 40.',
  groups: [{ range: 'Questions 31 - 40', instruction: 'Complete the notes below. Write NO MORE THAN TWO WORDS for each answer.', blocks: [
    { kind: 'title', text: 'Textiles with Business Studies' },
    { kind: 'subhead', text: 'New development' },
    { kind: 'note', bullet: true, segments: ['Now possible to work with the ', { blank: 31 }, ' Faculty to widen learning opportunities'] },
    { kind: 'subhead', text: 'Aims of course' },
    { kind: 'text', text: '• To cover three areas of textiles' },
    { kind: 'note', indent: true, segments: ['– knitted'] },
    { kind: 'note', indent: true, segments: ['– ', { blank: 32 }] },
    { kind: 'note', indent: true, segments: ['– woven'] },
    { kind: 'text', text: '• To focus on related business operations' },
    { kind: 'note', bullet: true, segments: ['Work placement: focus on studio work in the context of the ', { blank: 33 }] },
    { kind: 'subhead', text: 'Course content' },
    { kind: 'subhead', text: 'Year One: experimentation' },
    { kind: 'note', segments: ['Visual research with ', { blank: 34 }, ' and suggestions for its application'] },
    { kind: 'subhead', text: 'Year Two: relating skills to the real world' },
    { kind: 'note', segments: ['Optional course: ', { blank: 35 }, ' design processes'] },
    { kind: 'note', segments: ['Three- or four-year course? Students are offered ', { blank: 36 }, ' to help them make their decision.'] },
    { kind: 'subhead', text: 'Year Three: consolidation' },
    { kind: 'note', segments: ['Learning style: ', { blank: 37 }, ' practice'] },
    { kind: 'text', text: 'Students produce:' },
    { kind: 'note', indent: true, segments: ['– a dissertation'] },
    { kind: 'note', indent: true, segments: ['– a portfolio'] },
    { kind: 'note', indent: true, segments: ['– a ', { blank: 38 }] },
    { kind: 'subhead', text: 'Career opportunities' },
    { kind: 'text', text: 'Within textile business – e.g. stylists, retail managers' },
    { kind: 'note', segments: ['Further opportunities – jobs in ', { blank: 39 }, ' and trend forecasting'] },
    { kind: 'note', segments: ['If interested – come back tomorrow for a short ', { blank: 40 }] },
  ] }],
  questions: [
    q(31, 'note-completion', 'Now possible to work with the ___ Faculty', 'engineering', 'The new opportunity comes from the Faculty of Engineering. Arts and Architecture and Business are the existing partners.', '23:16–23:44'),
    q(32, 'note-completion', 'Three areas: knitted, ___ and woven textiles', 'printed', 'The lecturer lists knitted, printed and woven textiles.', '23:45–24:05'),
    q(33, 'note-completion', 'Studio work in the context of the ___', 'global market', 'The integrated work placement focuses on the global market and locates studio work in that context.', '24:21–24:32'),
    q(34, 'note-completion', 'Visual research with ___ and suggestions for its application', 'documentation', 'First-year visual research must be supported by documentation and proposals for its application.', '24:34–24:58'),
    q(35, 'note-completion', 'Optional course: ___ design processes', 'traditional', 'The optional extra module covers traditional processes of design and provides a historical perspective before computer-aided design.', '24:58–25:20'),
    q(36, 'note-completion', 'Students are offered ___ to help them choose a three- or four-year course', 'tutorials', 'Students can have tutorials to help decide whether to finish with a BA after year three or continue to a master’s degree in year four.', '25:21–25:44'),
    q(37, 'note-completion', 'Learning style: ___ practice', 'reflective', 'Reflective practice involves looking back, analysing and evaluating work in academic and professional contexts.', '25:49–26:08'),
    q(38, 'note-completion', 'Students produce a dissertation, a portfolio and a ___', 'business plan', 'Students also prepare a business plan to support the commercial aspect of the course.', '26:08–26:23'),
    q(39, 'note-completion', 'Further opportunities: jobs in ___ and trend forecasting', 'journalism', 'Journalism is suggested for graduates with a flair for words, followed by trend forecasting for those with an eye on the future.', '26:23–26:55'),
    q(40, 'note-completion', 'Come back tomorrow for a short ___', 'interview', 'Interested students can return the next day for a brief interview to assess their aptitude before the usual application process.', '26:57–27:24'),
  ],
}

export const listeningFullTest14: IELTSTest = {
  id: 'ielts-listening-14', title: 'IELTS Listening Full Test 14',
  type: 'Academic', module: 'Listening', duration: 30, totalQuestions: 40,
  continuousAudioUrl: '/audio/ielts-listening/listening-full-test-14.mp3',
  sections: [part1, part2, part3, part4],
}
