import type { Question, Section } from '../types/ieltsTypes'

const paragraphOptionsAtoG = ['A', 'B', 'C', 'D', 'E', 'F', 'G']

const day14PagodaTypeOptions = [
  'A. both Chinese and Japanese pagodas',
  'B. only Chinese pagodas',
  'C. only Japanese pagodas',
]

const day16HeadingOptions = [
  'A. MIRTP as a future model',
  'B. Identifying the main transport problems',
  'C. Preference for motorised vehicles',
  "D. Government authorities' instructions",
  'E. Initial improvements in mobility and transport modes',
  'F. Request for improved transport in Makete',
  'G. Transport improvements in the northern part of the district',
  'H. Improvements in the rail network',
  'I. Effects of initial MIRTP measures',
  'J. Co-operation of district officials',
  'K. Role of wheelbarrows and donkeys',
]

const day16SentenceEndingOptions = [
  'A. provided the people of Makete with experience in running bus and truck services.',
  'B. was especially successful in the northern part of the district.',
  'C. differed from earlier phases in that the community became less actively involved.',
  'D. improved paths used for transport up and down hillsides.',
  'E. was no longer a problem once the roads had been improved.',
  'F. cost less than locally made wheelbarrows.',
  'G. was done only at the request of local people who were willing to lend a hand.',
  'H. was at first considered by MIRTP to be affordable for the people of the district.',
  'I. hindered attempts to make the existing transport services more efficient.',
  'J. was thought to be the most important objective of Phase III.',
]

const day18SentenceEndingOptions = [
  'A. be discouraged by difficulties.',
  'B. travel on open land where they can look out for predators.',
  'C. eat more than they need for immediate purposes.',
  'D. be repeated daily.',
  'E. ignore distractions.',
  'F. be governed by the availability of water.',
  'G. follow a straight line.',
]

const day22ParagraphOptions = ['A', 'B', 'C', 'D', 'E', 'F', 'G']

const day22SentenceOptions = [
  'A their ability to identify and exploit new ideas.',
  'B their increasing share of global markets.',
  'C being unable to retain the creative staff they acquire.',
  'D the difficulty of creating a culture that supports innovation.',
]

const day14Questions: Question[] = [
  {
    id: 'day14-q1',
    number: 1,
    type: 'yes-no-not-given',
    groupTitle: 'Questions 1-4',
    instruction:
      'Choose YES if the statement agrees with the information in the text, choose NO if the statement contradicts the information, or choose NOT GIVEN if there is no information on this.',
    text: 'Only two Japanese pagodas have collapsed in 1400 years.',
    correctAnswer: 'YES',
    location: 'Paragraph A',
  },
  {
    id: 'day14-q2',
    number: 2,
    type: 'yes-no-not-given',
    text: 'The Hanshin earthquake of 1995 destroyed the pagoda at the Toji temple.',
    correctAnswer: 'NO',
    location: 'Paragraph A',
  },
  {
    id: 'day14-q3',
    number: 3,
    type: 'yes-no-not-given',
    text: 'The other buildings near the Toji pagoda had been built in the last 30 years.',
    correctAnswer: 'NOT GIVEN',
    location: 'Paragraph A',
  },
  {
    id: 'day14-q4',
    number: 4,
    type: 'yes-no-not-given',
    text: 'The builders of pagodas knew how to absorb some of the power produced by severe weather conditions.',
    correctAnswer: 'YES',
    location: 'Paragraphs E-F',
  },
  {
    id: 'day14-q5',
    number: 5,
    type: 'matching-information',
    groupTitle: 'Questions 5-10',
    instruction: 'Classify the following as typical of A, B or C.',
    text: 'easy interior access to top',
    options: day14PagodaTypeOptions,
    correctAnswer: 'B',
    location: 'Paragraph C',
  },
  {
    id: 'day14-q6',
    number: 6,
    type: 'matching-information',
    text: 'tiles on eaves',
    options: day14PagodaTypeOptions,
    correctAnswer: 'A',
    location: 'Paragraph D',
  },
  {
    id: 'day14-q7',
    number: 7,
    type: 'matching-information',
    text: 'use as observation post',
    options: day14PagodaTypeOptions,
    correctAnswer: 'B',
    location: 'Paragraph C',
  },
  {
    id: 'day14-q8',
    number: 8,
    type: 'matching-information',
    text: "size of eaves up to half the width of the building",
    options: day14PagodaTypeOptions,
    correctAnswer: 'C',
    location: 'Paragraph D',
  },
  {
    id: 'day14-q9',
    number: 9,
    type: 'matching-information',
    text: 'original religious purpose',
    options: day14PagodaTypeOptions,
    correctAnswer: 'A',
    location: 'Paragraph C',
  },
  {
    id: 'day14-q10',
    number: 10,
    type: 'matching-information',
    text: 'floors fitting loosely over each other',
    options: day14PagodaTypeOptions,
    correctAnswer: 'C',
    location: 'Paragraph F',
  },
  {
    id: 'day14-q11',
    number: 11,
    type: 'multiple-choice',
    groupTitle: 'Question 11',
    instruction: 'Choose the correct answer.',
    text: 'In a Japanese pagoda, the shinbashira',
    options: [
      'bears the full weight of the building.',
      'bends under pressure like a tree.',
      'connects the floors with the foundations.',
      'stops the floors moving too far.',
    ],
    correctAnswer: 'D',
    location: 'Paragraph F',
  },
  {
    id: 'day14-q12',
    number: 12,
    type: 'multiple-choice',
    groupTitle: 'Question 12',
    instruction: 'Choose the correct answer.',
    text: 'Shuzo Ishida performs experiments in order to',
    options: [
      'improve skyscraper design.',
      'be able to build new pagodas.',
      'learn about the dynamics of pagodas.',
      'understand ancient mathematics.',
    ],
    correctAnswer: 'C',
    location: 'Paragraph F',
  },
  {
    id: 'day14-q13',
    number: 13,
    type: 'multiple-choice',
    groupTitle: 'Question 13',
    instruction: 'Choose the correct answer.',
    text: 'The storeys of a Japanese pagoda are',
    options: [
      'linked only by wood.',
      'fastened only to the central pillar.',
      'fitted loosely on top of each other.',
      'joined by special weights.',
    ],
    correctAnswer: 'C',
    location: 'Paragraph G',
  },
]

const day15Questions: Question[] = [
  {
    id: 'day15-q14',
    number: 14,
    type: 'matching-information',
    groupTitle: 'Questions 14-17',
    instruction:
      'Reading Passage 2 has seven paragraphs. Which paragraph contains the following information? NB You may use any letter more than once.',
    text: 'a cost involved in purifying domestic water',
    options: paragraphOptionsAtoG,
    correctAnswer: 'E',
    location: 'Paragraph E',
  },
  {
    id: 'day15-q15',
    number: 15,
    type: 'matching-information',
    text: 'the stages in the development of the farming industry',
    options: paragraphOptionsAtoG,
    correctAnswer: 'B',
    location: 'Paragraph B',
  },
  {
    id: 'day15-q16',
    number: 16,
    type: 'matching-information',
    text: 'the term used to describe hidden costs',
    options: paragraphOptionsAtoG,
    correctAnswer: 'C',
    location: 'Paragraph C',
  },
  {
    id: 'day15-q17',
    number: 17,
    type: 'matching-information',
    text: 'one effect of chemicals on water sources',
    options: paragraphOptionsAtoG,
    correctAnswer: 'B',
    location: 'Paragraph B',
  },
  {
    id: 'day15-q18',
    number: 18,
    type: 'yes-no-not-given',
    groupTitle: 'Questions 18-21',
    instruction:
      'Choose YES if the statement agrees with the information in the text, choose NO if the statement contradicts the information, or choose NOT GIVEN if there is no information on this.',
    text: 'Several species of wildlife in the British countryside are declining.',
    correctAnswer: 'YES',
    location: 'Paragraph B',
  },
  {
    id: 'day15-q19',
    number: 19,
    type: 'yes-no-not-given',
    text: 'The taste of food has deteriorated in recent years.',
    correctAnswer: 'NOT GIVEN',
    location: 'Paragraphs A-G',
  },
  {
    id: 'day15-q20',
    number: 20,
    type: 'yes-no-not-given',
    text: 'The financial costs of environmental damage are widely recognised.',
    correctAnswer: 'NO',
    location: 'Paragraph C',
  },
  {
    id: 'day15-q21',
    number: 21,
    type: 'yes-no-not-given',
    text: 'One of the costs calculated by Professor Pretty was illness caused by food.',
    correctAnswer: 'YES',
    location: 'Paragraph E',
  },
  {
    id: 'day15-q22',
    number: 22,
    type: 'summary-completion',
    groupTitle: 'Questions 22-26',
    instruction: 'Complete the summary below. Choose NO MORE THAN THREE WORDS from the passage for each answer.',
    text: 'Professor Pretty concludes that our ______ are higher than most people realise, because we make three different types of payment.',
    correctAnswer: 'food bills',
    location: 'Paragraph E',
  },
  {
    id: 'day15-q23',
    number: 23,
    type: 'summary-completion',
    text: 'He feels it is realistic to suggest that Britain should reduce its reliance on ______.',
    correctAnswer: 'intensive farming',
    location: 'Paragraph F',
  },
  {
    id: 'day15-q24',
    number: 24,
    type: 'summary-completion',
    text: 'Although most farmers would be unable to adapt to ______, Professor Pretty wants the government to initiate change.',
    correctAnswer: 'organic farming',
    location: 'Paragraph G',
  },
  {
    id: 'day15-q25',
    number: 25,
    type: 'summary-completion',
    text: "He recommends establishing what he refers to as a ______.",
    correctAnswer: 'Greener Food Standard',
    location: 'Paragraph G',
  },
  {
    id: 'day15-q26',
    number: 26,
    type: 'summary-completion',
    text: 'He feels this would help to change the attitudes of both farmers and ______.',
    correctAnswer: 'consumers',
    location: 'Paragraph G',
  },
]

const day16Questions: Question[] = [
  {
    id: 'day16-q27',
    number: 27,
    type: 'matching-headings',
    groupTitle: 'Questions 27-30',
    instruction: 'Reading Passage 3 has six sections. Choose the correct heading for each section from the list of headings below.',
    text: 'Section B',
    options: day16HeadingOptions,
    correctAnswer: 'B',
    location: 'Section B',
  },
  {
    id: 'day16-q28',
    number: 28,
    type: 'matching-headings',
    text: 'Section C',
    options: day16HeadingOptions,
    correctAnswer: 'E',
    location: 'Section C',
  },
  {
    id: 'day16-q29',
    number: 29,
    type: 'matching-headings',
    text: 'Section E',
    options: day16HeadingOptions,
    correctAnswer: 'J',
    location: 'Section E',
  },
  {
    id: 'day16-q30',
    number: 30,
    type: 'matching-headings',
    text: 'Section F',
    options: day16HeadingOptions,
    correctAnswer: 'A',
    location: 'Section F',
  },
  {
    id: 'day16-q31',
    number: 31,
    type: 'yes-no-not-given',
    groupTitle: 'Questions 31-35',
    instruction:
      'Choose YES if the statement agrees with the information in the text, choose NO if the statement contradicts the information, or choose NOT GIVEN if there is no information on this.',
    text: 'MIRTP was divided into five phases.',
    correctAnswer: 'NO',
    location: 'Sections A-D',
  },
  {
    id: 'day16-q32',
    number: 32,
    type: 'yes-no-not-given',
    text: 'Prior to the start of MIRTP the Makete district was almost inaccessible during the rainy season.',
    correctAnswer: 'YES',
    location: 'Section B',
  },
  {
    id: 'day16-q33',
    number: 33,
    type: 'yes-no-not-given',
    text: 'Phase I of MIRTP consisted of a survey of household expenditure on transport.',
    correctAnswer: 'NO',
    location: 'Section B',
  },
  {
    id: 'day16-q34',
    number: 34,
    type: 'yes-no-not-given',
    text: 'The survey concluded that one-fifth or 20% of the household transport requirement was outside the local area.',
    correctAnswer: 'YES',
    location: 'Section B',
  },
  {
    id: 'day16-q35',
    number: 35,
    type: 'yes-no-not-given',
    text: "MIRTP hoped to improve the movement of goods from Makete district to the country's capital.",
    correctAnswer: 'NOT GIVEN',
    location: 'Sections A-F',
  },
  {
    id: 'day16-q36',
    number: 36,
    type: 'matching-information',
    groupTitle: 'Questions 36-39',
    instruction: 'Complete each sentence with the correct ending, A-J, below.',
    text: 'Construction of footbridges, steps and handrails',
    options: day16SentenceEndingOptions,
    correctAnswer: 'D',
    location: 'Section C',
  },
  {
    id: 'day16-q37',
    number: 37,
    type: 'matching-information',
    text: 'Frequent breakdown of buses and trucks in Makete',
    options: day16SentenceEndingOptions,
    correctAnswer: 'I',
    location: 'Section D',
  },
  {
    id: 'day16-q38',
    number: 38,
    type: 'matching-information',
    text: 'The improvement of secondary roads and paths',
    options: day16SentenceEndingOptions,
    correctAnswer: 'G',
    location: 'Section D',
  },
  {
    id: 'day16-q39',
    number: 39,
    type: 'matching-information',
    text: 'The isolation of Makete for part of year',
    options: day16SentenceEndingOptions,
    correctAnswer: 'E',
    location: 'Section D',
  },
  {
    id: 'day16-q40',
    number: 40,
    type: 'multiple-choice',
    groupTitle: 'Question 40',
    instruction: 'Choose the correct answer.',
    text: 'Which of the following phrases best describes the main aim of Reading Passage 3?',
    options: [
      'to suggest that projects such as MIRTP are needed in other countries',
      'to describe how MIRTP was implemented and how successful it was',
      'to examine how MIRTP promoted the use of donkeys',
      'to warn that projects such as MIRTP are likely to have serious problems',
    ],
    correctAnswer: 'B',
    location: 'Whole passage',
  },
]

const day17Questions: Question[] = [
  {
    id: 'day17-q1',
    number: 1,
    type: 'note-completion',
    groupTitle: 'Questions 1-9',
    instruction: 'Complete the notes below. Choose ONE WORD ONLY from the passage for each answer.',
    text: "Silkworm cocoon fell into emperor's wife's ______.",
    correctAnswer: 'tea',
    location: 'Paragraph A',
  },
  {
    id: 'day17-q2',
    number: 2,
    type: 'note-completion',
    text: "Emperor's wife invented a ______ to pull out silk fibres.",
    correctAnswer: 'reel',
    location: 'Paragraph A',
  },
  {
    id: 'day17-q3',
    number: 3,
    type: 'note-completion',
    text: 'Only ______ were allowed to produce silk.',
    correctAnswer: 'women',
    location: 'Paragraph B',
  },
  {
    id: 'day17-q4',
    number: 4,
    type: 'note-completion',
    text: 'Only ______ were allowed to wear silk.',
    correctAnswer: 'royalty',
    location: 'Paragraph B',
  },
  {
    id: 'day17-q5',
    number: 5,
    type: 'note-completion',
    text: 'Silk was used as a form of ______.',
    correctAnswer: 'currency',
    location: 'Paragraph B',
  },
  {
    id: 'day17-q6',
    number: 6,
    type: 'note-completion',
    text: 'Evidence found of ______ made from silk around 168 AD.',
    correctAnswer: 'paper',
    location: 'Paragraph B',
  },
  {
    id: 'day17-q7',
    number: 7,
    type: 'note-completion',
    text: 'Merchants used the Silk Road to take silk westward and bring back ______ and precious metals.',
    correctAnswer: 'wool',
    location: 'Paragraph C',
  },
  {
    id: 'day17-q8',
    number: 8,
    type: 'note-completion',
    text: '550 AD: ______ hid silkworm eggs in canes and took them to Constantinople.',
    correctAnswer: 'monks',
    location: 'Paragraph D',
  },
  {
    id: 'day17-q9',
    number: 9,
    type: 'note-completion',
    text: '20th century: ______ and other manmade fibres caused decline in silk production.',
    correctAnswer: 'nylon',
    location: 'Paragraph F',
  },
  {
    id: 'day17-q10',
    number: 10,
    type: 'true-false-not-given',
    groupTitle: 'Questions 10-13',
    instruction:
      'Choose TRUE if the statement agrees with the information in the text, choose FALSE if the statement contradicts the information, or choose NOT GIVEN if there is no information on this.',
    text: 'Gold was the most valuable material transported along the Silk Road.',
    correctAnswer: 'FALSE',
    location: 'Paragraph C',
  },
  {
    id: 'day17-q11',
    number: 11,
    type: 'true-false-not-given',
    text: 'Most tradesmen only went along certain sections of the Silk Road.',
    correctAnswer: 'TRUE',
    location: 'Paragraph C',
  },
  {
    id: 'day17-q12',
    number: 12,
    type: 'true-false-not-given',
    text: 'The Byzantines spread the practice of silk production across the West.',
    correctAnswer: 'FALSE',
    location: 'Paragraph D',
  },
  {
    id: 'day17-q13',
    number: 13,
    type: 'true-false-not-given',
    text: 'Silk yarn makes up the majority of silk currently exported from China.',
    correctAnswer: 'NOT GIVEN',
    location: 'Paragraph F',
  },
]

const day18Questions: Question[] = [
  {
    id: 'day18-q14',
    number: 14,
    type: 'true-false-not-given',
    groupTitle: 'Questions 14-18',
    instruction:
      'Choose TRUE if the statement agrees with the information in the text, choose FALSE if the statement contradicts the information, or choose NOT GIVEN if there is no information on this.',
    text: 'Local gulls and migrating arctic terns behave in the same way when offered food.',
    correctAnswer: 'FALSE',
    location: 'Paragraph B',
  },
  {
    id: 'day18-q15',
    number: 15,
    type: 'true-false-not-given',
    text: "Experts' definitions of migration tend to vary according to their area of study.",
    correctAnswer: 'TRUE',
    location: 'Paragraph D',
  },
  {
    id: 'day18-q16',
    number: 16,
    type: 'true-false-not-given',
    text: 'Very few experts agree that the movement of aphids can be considered migration.',
    correctAnswer: 'NOT GIVEN',
    location: 'Paragraph E',
  },
  {
    id: 'day18-q17',
    number: 17,
    type: 'true-false-not-given',
    text: "Aphids' journeys are affected by changes in the light that they perceive.",
    correctAnswer: 'TRUE',
    location: 'Paragraph F',
  },
  {
    id: 'day18-q18',
    number: 18,
    type: 'true-false-not-given',
    text: "Dingle's aim is to distinguish between the migratory behaviours of different species.",
    correctAnswer: 'FALSE',
    location: 'Paragraph F',
  },
  {
    id: 'day18-q19',
    number: 19,
    type: 'matching-information',
    groupTitle: 'Questions 19-22',
    instruction: 'Complete each sentence with the correct ending, A-G, below.',
    text: 'According to Dingle, migratory routes are likely to',
    options: day18SentenceEndingOptions,
    correctAnswer: 'G',
    location: 'Paragraph A',
  },
  {
    id: 'day18-q20',
    number: 20,
    type: 'matching-information',
    text: 'To prepare for migration, animals are likely to',
    options: day18SentenceEndingOptions,
    correctAnswer: 'C',
    location: 'Paragraph F',
  },
  {
    id: 'day18-q21',
    number: 21,
    type: 'matching-information',
    text: 'During migration, animals are unlikely to',
    options: day18SentenceEndingOptions,
    correctAnswer: 'A',
    location: 'Paragraph A',
  },
  {
    id: 'day18-q22',
    number: 22,
    type: 'matching-information',
    text: "Arctic terns illustrate migrating animals' ability to",
    options: day18SentenceEndingOptions,
    correctAnswer: 'E',
    location: 'Paragraph B',
  },
  {
    id: 'day18-q23',
    number: 23,
    type: 'summary-completion',
    groupTitle: 'Questions 23-26',
    instruction: 'Complete the summary below. Choose ONE WORD ONLY from the passage for each answer.',
    text: 'Pronghorns rely on their eyesight and ______ to avoid predators.',
    correctAnswer: 'speed',
    location: 'Paragraph G',
  },
  {
    id: 'day18-q24',
    number: 24,
    type: 'summary-completion',
    text: 'Their winter home is on the ______, where they avoid deep snow.',
    correctAnswer: 'plains',
    location: 'Paragraph G',
  },
  {
    id: 'day18-q25',
    number: 25,
    type: 'summary-completion',
    text: 'Their route between the two homes contains three ______.',
    correctAnswer: 'bottlenecks',
    location: 'Paragraph G',
  },
  {
    id: 'day18-q26',
    number: 26,
    type: 'summary-completion',
    text: 'One problem is construction of new homes in a narrow ______ of land on the route.',
    correctAnswer: 'corridor|passageway',
    location: 'Paragraph G',
  },
]

const day19Questions: Question[] = [
  {
    id: 'day19-q27',
    number: 27,
    type: 'matching-information',
    groupTitle: 'Questions 27-34',
    instruction: 'Reading Passage 3 has seven sections. Which section contains the following information? NB You may use any letter more than once.',
    text: 'a reference to books that assume a lack of mathematical knowledge',
    options: paragraphOptionsAtoG,
    correctAnswer: 'D',
    location: 'Section D',
  },
  {
    id: 'day19-q28',
    number: 28,
    type: 'matching-information',
    text: 'the way in which this is not a typical book about mathematics',
    options: paragraphOptionsAtoG,
    correctAnswer: 'B',
    location: 'Section B',
  },
  {
    id: 'day19-q29',
    number: 29,
    type: 'matching-information',
    text: 'personal examples of being helped by mathematics',
    options: paragraphOptionsAtoG,
    correctAnswer: 'G',
    location: 'Section G',
  },
  {
    id: 'day19-q30',
    number: 30,
    type: 'matching-information',
    text: 'examples of people who each had abilities that seemed incompatible',
    options: paragraphOptionsAtoG,
    correctAnswer: 'C',
    location: 'Section C',
  },
  {
    id: 'day19-q31',
    number: 31,
    type: 'matching-information',
    text: 'mention of different focuses of books about mathematics',
    options: paragraphOptionsAtoG,
    correctAnswer: 'B',
    location: 'Section B',
  },
  {
    id: 'day19-q32',
    number: 32,
    type: 'matching-information',
    text: 'a contrast between reading this book and reading other kinds of publication',
    options: paragraphOptionsAtoG,
    correctAnswer: 'E',
    location: 'Section E',
  },
  {
    id: 'day19-q33',
    number: 33,
    type: 'matching-information',
    text: 'a claim that the whole of the book is accessible to everybody',
    options: paragraphOptionsAtoG,
    correctAnswer: 'A',
    location: 'Section A',
  },
  {
    id: 'day19-q34',
    number: 34,
    type: 'matching-information',
    text: 'a reference to different categories of intended readers of this book',
    options: paragraphOptionsAtoG,
    correctAnswer: 'F',
    location: 'Section F',
  },
  {
    id: 'day19-q35',
    number: 35,
    type: 'summary-completion',
    groupTitle: 'Questions 35-40',
    instruction: 'Complete the sentences below. Choose ONE WORD ONLY from the passage for each answer.',
    text: 'Some areas of both music and mathematics are suitable for someone who is a ______.',
    correctAnswer: 'beginner',
    location: 'Section A',
  },
  {
    id: 'day19-q36',
    number: 36,
    type: 'summary-completion',
    text: 'It is sometimes possible to understand advanced mathematics using no more than a limited knowledge of ______.',
    correctAnswer: 'arithmetic',
    location: 'Section A',
  },
  {
    id: 'day19-q37',
    number: 37,
    type: 'summary-completion',
    text: 'The writer intends to show that mathematics requires ______ thinking, as well as analytical skills.',
    correctAnswer: 'intuitive',
    location: 'Section C',
  },
  {
    id: 'day19-q38',
    number: 38,
    type: 'summary-completion',
    text: 'Some books written by ______ have had to leave out the mathematics that is central to their theories.',
    correctAnswer: 'scientists',
    location: 'Section D',
  },
  {
    id: 'day19-q39',
    number: 39,
    type: 'summary-completion',
    text: 'The writer advises non-mathematical readers to perform ______ while reading the book.',
    correctAnswer: 'experiments',
    location: 'Section E',
  },
  {
    id: 'day19-q40',
    number: 40,
    type: 'summary-completion',
    text: 'A lawyer found that studying ______ helped even more than other areas of mathematics in the study of law.',
    correctAnswer: 'theorems',
    location: 'Section G',
  },
]

const day21Questions: Question[] = [
  {
    id: 'day21-q1',
    number: 1,
    type: 'true-false-not-given',
    groupTitle: 'Questions 1-6',
    instruction:
      'Do the following statements agree with the information given in the passage? Choose TRUE if the statement agrees with the information, FALSE if the statement contradicts the information, or NOT GIVEN if there is no information on this.',
    text: 'The palace was built at the same time as the Roman conquest of Britain.',
    correctAnswer: 'FALSE',
    location: 'Paragraph A',
  },
  {
    id: 'day21-q2',
    number: 2,
    type: 'true-false-not-given',
    text: 'Roman remains at Fishbourne were initially found by accident.',
    correctAnswer: 'TRUE',
    location: 'Paragraph B',
  },
  {
    id: 'day21-q3',
    number: 3,
    type: 'true-false-not-given',
    text: 'All of the formal gardens of the palace have been reconstructed.',
    correctAnswer: 'FALSE',
    location: 'Paragraph A',
  },
  {
    id: 'day21-q4',
    number: 4,
    type: 'true-false-not-given',
    text: 'The palace was the largest known Roman residence north of the European Alps.',
    correctAnswer: 'TRUE',
    location: 'Paragraph C',
  },
  {
    id: 'day21-q5',
    number: 5,
    type: 'true-false-not-given',
    text: 'Professor Cunliffe and Dr Miles Russell agree on when the palace was built.',
    correctAnswer: 'FALSE',
    location: 'Paragraphs D-E',
  },
  {
    id: 'day21-q6',
    number: 6,
    type: 'true-false-not-given',
    text: 'More tourists visit the palace today than any other Roman site in Britain.',
    correctAnswer: 'NOT GIVEN',
    location: 'Paragraph G',
  },
  {
    id: 'day21-q7',
    number: 7,
    type: 'summary-completion',
    groupTitle: 'Questions 7-13',
    instruction:
      'Complete the summary below. Choose NO MORE THAN TWO WORDS AND/OR A NUMBER from the passage for each answer.',
    text: 'The palace was built on the site of ______ grain stores.',
    correctAnswer: 'Roman army',
    location: 'Paragraph A',
  },
  {
    id: 'day21-q8',
    number: 8,
    type: 'summary-completion',
    text: 'The rectangular palace was built around formal ______.',
    correctAnswer: 'gardens',
    location: 'Paragraph A',
  },
  {
    id: 'day21-q9',
    number: 9,
    type: 'summary-completion',
    text: 'Many of the original black and white mosaic ______ were later replaced with coloured ones.',
    correctAnswer: 'floors',
    location: 'Paragraph A',
  },
  {
    id: 'day21-q10',
    number: 10,
    type: 'summary-completion',
    text: 'The palace was discovered when workmen uncovered a ______ while laying a water main.',
    correctAnswer: 'wall',
    location: 'Paragraph B',
  },
  {
    id: 'day21-q11',
    number: 11,
    type: 'summary-completion',
    text: 'Lucullus was executed by the Emperor Domitian in or shortly after ______ AD.',
    correctAnswer: '93',
    location: 'Paragraph E',
  },
  {
    id: 'day21-q12',
    number: 12,
    type: 'summary-completion',
    text: 'Tiberius Claudius Catuarus has been linked to the palace following the discovery of a ______ belonging to him.',
    correctAnswer: 'gold ring',
    location: 'Paragraph F',
  },
  {
    id: 'day21-q13',
    number: 13,
    type: 'summary-completion',
    text: 'A ______ has been built to preserve some of the visible remains.',
    correctAnswer: 'modern museum',
    location: 'Paragraph G',
  },
]

const day22Questions: Question[] = [
  {
    id: 'day22-q1',
    number: 1,
    type: 'matching-information',
    groupTitle: 'Questions 1-7',
    instruction:
      'The passage has seven paragraphs, A-G. Which paragraph contains the following information?',
    text: 'Small innovative companies can now get financial backing more easily.',
    options: day22ParagraphOptions,
    correctAnswer: 'F',
    location: 'Paragraph F',
  },
  {
    id: 'day22-q2',
    number: 2,
    type: 'matching-information',
    text: 'An example of a company that provides virtual expert advice.',
    options: day22ParagraphOptions,
    correctAnswer: 'A',
    location: 'Paragraph A',
  },
  {
    id: 'day22-q3',
    number: 3,
    type: 'matching-information',
    text: 'The connection between innovation and company profits.',
    options: day22ParagraphOptions,
    correctAnswer: 'C',
    location: 'Paragraph C',
  },
  {
    id: 'day22-q4',
    number: 4,
    type: 'matching-information',
    text: 'Innovation is now considered essential for business success.',
    options: day22ParagraphOptions,
    correctAnswer: 'B',
    location: 'Paragraph B',
  },
  {
    id: 'day22-q5',
    number: 5,
    type: 'matching-information',
    text: 'Why large companies find it hard to be creative.',
    options: day22ParagraphOptions,
    correctAnswer: 'E',
    location: 'Paragraph E',
  },
  {
    id: 'day22-q6',
    number: 6,
    type: 'matching-information',
    text: 'Strategies large firms use to encourage innovation internally.',
    options: day22ParagraphOptions,
    correctAnswer: 'G',
    location: 'Paragraph G',
  },
  {
    id: 'day22-q7',
    number: 7,
    type: 'matching-information',
    text: 'Entrepreneurs sometimes sell early-stage research to larger firms.',
    options: day22ParagraphOptions,
    correctAnswer: 'F',
    location: 'Paragraph F',
  },
  {
    id: 'day22-q8',
    number: 8,
    type: 'true-false-not-given',
    groupTitle: 'Questions 8-11',
    instruction:
      'Do the following statements agree with the information given in the passage? Choose TRUE if the statement agrees with the information, FALSE if the statement contradicts the information, or NOT GIVEN if there is no information on this.',
    text: 'According to the passage, Amazon and Wal-Mart produced completely new ideas that changed their industries.',
    correctAnswer: 'TRUE',
    location: 'Paragraph B',
  },
  {
    id: 'day22-q9',
    number: 9,
    type: 'true-false-not-given',
    text: 'Most employees in large companies prefer working on existing products.',
    correctAnswer: 'NOT GIVEN',
    location: 'Paragraph G',
  },
  {
    id: 'day22-q10',
    number: 10,
    type: 'true-false-not-given',
    text: 'Peter Chemin believes that large studios are more effective at producing creative work.',
    correctAnswer: 'FALSE',
    location: 'Paragraph E',
  },
  {
    id: 'day22-q11',
    number: 11,
    type: 'true-false-not-given',
    text: 'Banks now provide special financial help for people starting new businesses.',
    correctAnswer: 'TRUE',
    location: 'Paragraph F',
  },
  {
    id: 'day22-q12',
    number: 12,
    type: 'multiple-choice',
    groupTitle: 'Questions 12-14',
    instruction: 'Complete each sentence below with the best ending A-D.',
    text: 'Some large companies are concerned about...',
    options: day22SentenceOptions,
    correctAnswer: 'C',
    location: 'Paragraph G',
  },
  {
    id: 'day22-q13',
    number: 13,
    type: 'multiple-choice',
    text: 'Small firms and individuals are getting more rewards for...',
    options: day22SentenceOptions,
    correctAnswer: 'A',
    location: 'Paragraph D',
  },
  {
    id: 'day22-q14',
    number: 14,
    type: 'multiple-choice',
    text: 'The biggest challenge for innovation in big firms is...',
    options: day22SentenceOptions,
    correctAnswer: 'D',
    location: 'Paragraph G',
  },
]

const day23Questions: Question[] = [
  {
    id: 'day23-q1',
    number: 1,
    type: 'summary-completion',
    groupTitle: 'Questions 1-6',
    instruction:
      'Complete the summary below. Choose ONE WORD ONLY from the passage for each answer.',
    text: 'Colorful dots on the map display the specific ______ of each food store.',
    correctAnswer: 'location',
    location: 'Paragraph A',
  },
  {
    id: 'day23-q2',
    number: 2,
    type: 'summary-completion',
    text: 'The project also aims to assist government officials in forming future ______ about food.',
    correctAnswer: 'policies',
    location: 'Paragraph B',
  },
  {
    id: 'day23-q3',
    number: 3,
    type: 'summary-completion',
    text: 'Citizen map makers sometimes create maps because there is no good ______ map available.',
    correctAnswer: 'government',
    location: 'Paragraph C',
  },
  {
    id: 'day23-q4',
    number: 4,
    type: 'summary-completion',
    text: 'People at higher risk of chronic disease frequently receive minimal ______ for their work.',
    correctAnswer: 'incomes',
    location: 'Paragraph D',
  },
  {
    id: 'day23-q5',
    number: 5,
    type: 'summary-completion',
    text: 'Supermarkets often cannot afford the amount of ______ required for their stores in cities.',
    correctAnswer: 'land',
    location: 'Paragraph E',
  },
  {
    id: 'day23-q6',
    number: 6,
    type: 'summary-completion',
    text: 'Smaller urban groceries tend to close due to competition from ______ supermarkets.',
    correctAnswer: 'suburban',
    location: 'Paragraph E',
  },
  {
    id: 'day23-q7',
    number: 7,
    type: 'true-false-not-given',
    groupTitle: 'Questions 7-13',
    instruction:
      'Do the following statements agree with the information given in the passage? Choose TRUE if the statement agrees with the information, FALSE if the statement contradicts the information, or NOT GIVEN if there is no information on this.',
    text: 'The Brooklyn Food Association uses trained academic researchers to gather data.',
    correctAnswer: 'FALSE',
    location: 'Paragraph G',
  },
  {
    id: 'day23-q8',
    number: 8,
    type: 'true-false-not-given',
    text: 'The Brooklyn volunteers use pre-printed surveys when they visit stores.',
    correctAnswer: 'TRUE',
    location: 'Paragraph G',
  },
  {
    id: 'day23-q9',
    number: 9,
    type: 'true-false-not-given',
    text: 'More people in Brooklyn eat healthily now than five years ago.',
    correctAnswer: 'NOT GIVEN',
    location: 'Paragraph H',
  },
  {
    id: 'day23-q10',
    number: 10,
    type: 'true-false-not-given',
    text: 'Michele Ver Ploeg thinks the Brooklyn map is currently complete enough.',
    correctAnswer: 'FALSE',
    location: 'Paragraph H',
  },
  {
    id: 'day23-q11',
    number: 11,
    type: 'true-false-not-given',
    text: 'Karen Ansel believes the map has the potential to be very helpful to consumers.',
    correctAnswer: 'TRUE',
    location: 'Paragraph H',
  },
  {
    id: 'day23-q12',
    number: 12,
    type: 'true-false-not-given',
    text: 'The majority of Brooklyn residents support the mapping project.',
    correctAnswer: 'NOT GIVEN',
    location: 'Paragraph I',
  },
  {
    id: 'day23-q13',
    number: 13,
    type: 'true-false-not-given',
    text: 'A significant number of Brooklyn residents do not have internet access at home.',
    correctAnswer: 'TRUE',
    location: 'Paragraph I',
  },
]

const day14Section: Section = {
  id: 'day14-pagodas-p1',
  title: "Day 14 Passage 1: Why pagodas don't fall down",
  paragraphs: [
    {
      label: 'A',
      content:
        "In a land swept by typhoons and shaken by earthquakes, how have Japan's tallest and seemingly flimsiest old buildings - 500 or so wooden pagodas - remained standing for centuries? Records show that only two have collapsed during the past 1400 years. Those that have disappeared were destroyed by fire as a result of lightning or civil war. The disastrous Hanshin earthquake in 1995 killed 6,400 people, toppled elevated highways, flattened office blocks and devastated the port area of Kobe. Yet it left the magnificent five-storey pagoda at the Toji temple in nearby Kyoto unscathed, though it levelled a number of buildings in the neighbourhood.",
    },
    {
      label: 'B',
      content:
        "Japanese scholars have been mystified for ages about why these tall, slender buildings are so stable. It was only thirty years ago that the building industry felt confident enough to erect office blocks of steel and reinforced concrete that had more than a dozen floors. With its special shock absorbers to dampen the effect of sudden sideways movements from an earthquake, the thirty-six-storey Kasumigaseki building in central Tokyo - Japan's first skyscraper - was considered a masterpiece of modern engineering when it was built in 1968. Yet in 826, with only pegs and wedges to keep his wooden structure upright, the master builder Kobodaishi had no hesitation in sending his majestic Toji pagoda soaring fifty-five meters into the sky - nearly half as high as the Kasumigaseki skyscraper built some eleven centuries later. Clearly, Japanese carpenters of the day knew a few tricks about allowing a building to sway and settle itself rather than fight nature's forces. But what sort of tricks?",
    },
    {
      label: 'C',
      content:
        "The multi-storey pagoda came to Japan from China in the sixth century. As in China, they were first introduced with Buddhism and were attached to important temples. The Chinese built their pagodas in brick or stone, with inner staircases, and used them in later centuries mainly as watchtowers. When the pagoda reached Japan, however, its architecture was freely adapted to local conditions - they were built less high, typically five rather than nine storeys, made mainly of wood and the staircase was dispensed with because the Japanese pagoda did not have any practical use but became more of an art object. Because of the typhoons that batter Japan in the summer, Japanese builders learned to extend the eaves of buildings further beyond the walls. This prevents rainwater gushing down the walls.",
    },
    {
      label: 'D',
      content:
        "Pagodas in China and Korea have nothing like the overhang that is found on pagodas in Japan. The roof of a Japanese temple building can be made to overhang the sides of the structure by fifty percent or more of the building's overall width. For the same reason, the builders of Japanese pagodas seem to have further increased their weight by choosing to cover these extended eaves not with the porcelain tiles of many Chinese pagodas but with much heavier earthenware tiles.",
    },
    {
      label: 'E',
      content:
        "But this does not totally explain the great resilience of Japanese pagodas. Is the answer that, like a tall pine tree, the Japanese pagoda - with its massive trunk-like central pillar known as shinbashira - simply flexes and sways during a typhoon or earthquake? For centuries, many thought so. But the answer is not so simple because the startling thing is that the shinbashira actually carries no load at all. In fact, in some pagoda designs, it does not even rest on the ground, but is suspended from the top of the pagoda - hanging loosely down through the middle of the building. The weight of the building is supported entirely by twelve outer and four inner columns.",
    },
    {
      label: 'F',
      content:
        "And what is the role of the shinbashira, the central pillar? The best way to understand the shinbashira's role is to watch a video made by Shuzo Ishida, a structural engineer at Kyoto Institute of Technology. Mr Ishida, known to his students as 'Professor Pagoda' because of his passion to understand the pagoda, has built a series of models and tested them on a shake-table in his laboratory. In short, the shinbashira was acting like an enormous stationary pendulum. The ancient craftsmen, apparently without the assistance of very advanced mathematics, seemed to grasp the principles that were, more than a thousand years later, applied in the construction of Japan's first skyscraper. What those early craftsmen had found by trial and error was that under pressure a pagoda's loose stack of floors could be made to slither to and fro independent of one another. Viewed from the side, the pagoda seemed to be doing a snake dance - with each consecutive floor moving in the opposite direction to its neighbours above and below. The shinbashira, running up through a hole in the centre of the building, constrained individual storeys from moving too far because, after moving a certain distance, they banged into it, transmitting energy away along the column.",
    },
    {
      label: 'G',
      content:
        'Another strange feature of the Japanese pagoda is that, because the building tapers, with each successive floor plan being smaller than the one below, none of the vertical pillars that carry the weight of the building is connected to its corresponding pillar above. In other words, a five-storey pagoda contains not even one pillar that travels right up through the building to carry the structural loads from the top to the bottom. More surprising is the fact that the individual storeys of a Japanese pagoda, unlike their counterparts elsewhere, are not actually connected to each other. They are simply stacked one on top of another like a pile of hats. Interestingly, such a design would not be permitted under current Japanese building regulations. And the extra-wide eaves? Think of them as a tightrope walker\'s balancing pole. The bigger the mass at each end of the pole, the easier it is for the tightrope walker to maintain his or her balance. The same holds true for a pagoda. "With the eaves extending out on all sides like balancing poles," says Mr Ishida, "the building responds to even the most powerful jolt of an earthquake with a graceful swaying, never an abrupt shaking." Here again, Japanese master builders of a thousand years ago anticipated concepts of modern structural engineering.',
    },
  ],
  questions: day14Questions,
}

const day15Section: Section = {
  id: 'day15-true-cost-food-p2',
  title: 'Day 15 Passage 2: The True Cost of Food',
  paragraphs: [
    {
      label: 'A',
      content:
        'For more than forty years the cost of food has been rising. It has now reached a point where a growing number of people believe that it is far too high, and that bringing it down will be one of the great challenges of the twenty first century. That cost, however, is not in immediate cash. In the West at least, most food is now far cheaper to buy in relative terms than it was in 1960. The cost is in the collateral damage of the very methods of food production that have made the food cheaper: in the pollution of water, the enervation of soil, the destruction of wildlife, the harm to animal welfare and the threat to human health caused by modern industrial agriculture.',
    },
    {
      label: 'B',
      content:
        'First mechanisation, then mass use of chemical fertilisers and pesticides, then monocultures, then battery rearing of livestock, and now genetic engineering - the onward march of intensive farming has seemed unstoppable in the last half-century, as the yields of produce have soared. But the damage it has caused has been colossal. In Britain, for example, many of our best-loved farmland birds, such as the skylark, the grey partridge, the lapwing and the corn bunting, have vanished from huge stretches of countryside, as have even more wild-flowers and insects. This is a direct result of the way we have produced our food in the last four decades. Thousands of miles of hedgerows, thousands of ponds have disappeared from the landscape. The faecal filth of salmon farming has driven wild salmon from many of the sea lochs and rivers of Scotland. Natural soil fertility is dropping in many areas because of continuous industrial fertiliser and pesticide use, while the growth of algae is increasing in lakes because of the fertiliser run-off.',
    },
    {
      label: 'C',
      content:
        "Put it all together and it looks like a battlefield, but consumers rarely make the connection at the dinner table. That is mainly because the costs of all this damage are what economists refer to as externalities: they are outside the main transaction, which is for example producing and selling a field of wheat, and are borne directly by neither producers nor consumers. To many, the costs may not even appear to be financial at all, but merely aesthetic - a terrible shame, but nothing to do with money. And anyway they, as consumers of food, certainly aren't paying for it, are they?",
    },
    {
      label: 'D',
      content:
        "But the costs to society can actually be quantified and, when added up, can amount to staggering sums. A remarkable exercise in doing this has been carried out by one of the world's leading thinkers on the future of agriculture, Professor Jules Pretty, Director of the Centre for Environment and Society at the University of Essex. Professor Pretty and his colleagues calculated the externalities of British agriculture for one particular year. They added up the costs of repairing the damage it caused, and came up with a total figure of £2,343m. This is equivalent to £208 for every hectare of arable land and permanent pasture, almost as much again as the total government and EU spend on British farming in that year. And according to Professor Pretty, it was a conservative estimate.",
    },
    {
      label: 'E',
      content:
        'The costs included: £120m for removal of pesticides; £16m for removal of nitrates; £55m for removal of phosphates and soil; £23m for the removal of the bug Cryptosporidium from drinking water by water companies; £125m for damage to wildlife habitats, hedgerows and dry stone walls; £1,113m from emissions of gases likely to contribute to climate change; £106m from soil erosion and organic carbon losses; £169m from food poisoning; and £607m from cattle disease. Professor Pretty draws a simple but memorable conclusion from all this: our food bills are actually threefold. We are paying for our supposedly cheaper food in three separate ways: once over the counter, secondly through our taxes, which provide the enormous subsidies propping up modern intensive farming, and thirdly to clean up the mess that modern farming leaves behind.',
    },
    {
      label: 'F',
      content:
        'So can the true cost of food be brought down? Breaking away from industrial agriculture as the solution to hunger may be very hard for some countries, but in Britain, where the immediate need to supply food is less urgent, and the costs and the damage of intensive farming have been clearly seen, it may be more feasible. The government needs to create sustainable, competitive and diverse farming and food sectors, which will contribute to a thriving and sustainable rural economy, and advance environmental, economic, health, and animal welfare goals.',
    },
    {
      label: 'G',
      content:
        "But if industrial agriculture is to be replaced, what is a viable alternative? Professor Pretty feels that organic farming would be too big a jump in thinking and in practices for many farmers. Furthermore, the price premium would put the produce out of reach of many poorer consumers. He is recommending the immediate introduction of a 'Greener Food Standard', which would push the market towards more sustainable environmental practices than the current norm, while not requiring the full commitment to organic production. Such a standard would comprise agreed practices for different kinds of farming, covering agrochemical use, soil health, land management, water and energy use, food safety and animal health. It could go a long way, he says, to shifting consumers as well as farmers towards a more sustainable system of agriculture.",
    },
  ],
  questions: day15Questions,
}

const day16Section: Section = {
  id: 'day16-makete-transport-p3',
  title: 'Day 16 Passage 3: Makete Integrated Rural Transport Project',
  paragraphs: [
    {
      label: 'A',
      content:
        "The disappointing results of many conventional road transport projects in Africa led some experts to rethink the strategy by which rural transport problems were to be tackled at the beginning of the 1980s. A request for help in improving the availability of transport within the remote Makete District of southwestern Tanzania presented the opportunity to try a new approach. The concept of 'integrated rural transport' was adopted in the task of examining the transport needs of the rural households in the district. The objective was to reduce the time and effort needed to obtain access to essential goods and services through an improved rural transport system. The underlying assumption was that the time saved would be used instead for activities that would improve the social and economic development of the communities. The Makete Integrated Rural Transport Project (MIRTP) started in 1985 with financial support from the Swiss Development Corporation and was co-ordinated with the help of the Tanzanian government.",
    },
    {
      label: 'B',
      content:
        'When the project began, Makete District was virtually totally isolated during the rainy season. The regional road was in such bad shape that access to the main towns was impossible for about three months of the year. Road traffic was extremely rare within the district, and alternative means of transport were restricted to donkeys in the north of the district. People relied primarily on the paths, which were slippery and dangerous during the rains. Before solutions could be proposed, the problems had to be understood. Little was known about the transport demands of the rural households, so Phase I, between December 1985 and December 1987, focused on research. The socio-economic survey of more than 400 households in the district indicated that a household in Makete spent, on average, seven hours a day on transporting themselves and their goods, a figure which seemed extreme but which has also been obtained in surveys in other rural areas in Africa. Interesting facts regarding transport were found: 95% was on foot; 80% was within the locality; and 70% was related to the collection of water and firewood and travelling to grinding mills.',
    },
    {
      label: 'C',
      content:
        'Having determined the main transport needs, possible solutions were identified which might reduce the time and burden. During Phase II, from January to February 1991, a number of approaches were implemented in an effort to improve mobility and access to transport. An improvement of the road network was considered necessary to ensure the import and export of goods to the district. These improvements were carried out using methods that were heavily dependent on labour. In addition to the improvement of roads, these methods provided training in the operation of a mechanical workshop and bus and truck services. However, the difference from the conventional approach was that this time consideration was given to local transport needs outside the road network. Most goods were transported along the paths that provide short-cuts up and down the hillsides, but the paths were a real safety risk and made the journey on foot even more arduous. It made sense to improve the paths by building steps, handrails and footbridges. It was uncommon to find means of transport that were more efficient than walking but less technologically advanced than motor vehicles. The use of bicycles was constrained by their high cost and the lack of available spare parts. Oxen were not used at all but donkeys were used by a few households in the northern part of the district. MIRTP focused on what would be most appropriate for the inhabitants of Makete in terms of what was available, how much they could afford and what they were willing to accept. After careful consideration, the project chose the promotion of donkeys - a donkey costs less than a bicycle - and the introduction of a locally manufacturable wheelbarrow.',
    },
    {
      label: 'D',
      content:
        "At the end of Phase II, it was clear that the selected approaches to Makete's transport problems had had different degrees of success. Phase III, from March 1991 to March 1993, focused on the refinement and institutionalisation of these activities. The road improvements and accompanying maintenance system had helped make the district centre accessible throughout the year. Essential goods from outside the district had become more readily available at the market, and prices did not fluctuate as much as they had done before. Paths and secondary roads were improved only at the request of communities who were willing to participate in construction and maintenance. However, the improved paths impressed the inhabitants, and requests for assistance greatly increased soon after only a few improvements had been completed. The efforts to improve the efficiency of the existing transport services were not very successful because most of the motorised vehicles in the district broke down and there were no resources to repair them. Even the introduction of low-cost means of transport was difficult because of the general poverty of the district. The locally manufactured wheelbarrows were still too expensive for all but a few of the households. Modifications to the original design by local carpenters cut production time and costs. Other local carpenters have been trained in the new design so that they can respond to requests. Nevertheless, a locally produced wooden wheelbarrow which costs around 5000 Tanzanian shillings (less than US$20) in Makete, and is about one quarter the cost of a metal wheelbarrow, is still too expensive for most people. Donkeys, which were imported to the district, have become more common and contribute, in particular, to the transportation of crops and goods to market. Those who have bought donkeys are mainly from richer households but, with an increased supply through local breeding, donkeys should become more affordable. Meanwhile, local initiatives are promoting the renting out of the existing donkeys. It should be noted, however, that a donkey, which at 20,000 Tanzanian shillings costs less than a bicycle, is still an investment equal to an average household's income over half a year. This clearly illustrates the need for supplementary measures if one wants to assist the rural poor.",
    },
    {
      label: 'E',
      content:
        "It would have been easy to criticise the MIRTP for using in the early phases a 'top-down' approach, in which decisions were made by experts and officials before being handed down to communities, but it was necessary to start the process from the level of the governmental authorities of the district. It would have been difficult to respond to the requests of villagers and other rural inhabitants without the support and understanding of district authorities.",
    },
    {
      label: 'F',
      content:
        'Today, nobody in the district argues about the importance of improved paths and inexpensive means of transport. But this is the result of dedicated work over a long period, particularly from the officers in charge of community development. They played an essential role in raising awareness and interest among the rural communities. The concept of integrated rural transport is now well established in Tanzania, where a major program of rural transport is just about to start. The experiences from Makete will help in this initiative, and Makete District will act as a reference for future work.',
    },
  ],
  questions: day16Questions,
}

const day17Section: Section = {
  id: 'day17-story-of-silk-p1',
  title: 'Day 17 Passage 1: The Story of Silk',
  paragraphs: [
    {
      label: 'A',
      content:
        "Silk is a fine, smooth material produced from the cocoons - soft protective shells - that are made by mulberry silkworms (insect larvae). Legend has it that it was Lei Tzu, wife of the Yellow Emperor, ruler of China in about 3000 BC, who discovered silkworms. One account of the story goes that as she was taking a walk in her husband's gardens, she discovered that silkworms were responsible for the destruction of several mulberry trees. She collected a number of cocoons and sat down to have a rest. It just so happened that while she was sipping some tea, one of the cocoons that she had collected landed in the hot tea and started to unravel into a fine thread. Lei Tzu found that she could wind this thread around her fingers. Subsequently, she persuaded her husband to allow her to rear silkworms on a grove of mulberry trees. She also devised a special reel to draw the fibres from the cocoon into a single thread so that they would be strong enough to be woven into fabric. While it is unknown just how much of this is true, it is certainly known that silk cultivation has existed in China for several millennia.",
    },
    {
      label: 'B',
      content:
        'Originally, silkworm farming was solely restricted to women, and it was they who were responsible for the growing, harvesting and weaving. Silk quickly grew into a symbol of status, and originally, only royalty were entitled to have clothes made of silk. The rules were gradually relaxed over the years until finally during the Qing Dynasty (1644-1911 AD), even peasants, the lowest caste, were also entitled to wear silk. Sometime during the Han Dynasty (206 BC-220 AD), silk was so prized that it was also used as a unit of currency. Government officials were paid their salary in silk, and farmers paid their taxes in grain and silk. Silk was also used as diplomatic gifts by the emperor. Fishing lines, bowstrings, musical instruments and paper were all made using silk. The earliest indication of silk paper being used was discovered in the tomb of a noble who is estimated to have died around 168 AD.',
    },
    {
      label: 'C',
      content:
        'Demand for this exotic fabric eventually created the lucrative trade route now known as the Silk Road, taking silk westward and bringing gold, silver and wool to the East. It was named the Silk Road after its most precious commodity, which was considered to be worth more than gold. The Silk Road stretched over 6,000 kilometres from Eastern China to the Mediterranean Sea, following the Great Wall of China, climbing the Pamir mountain range, crossing modern-day Afghanistan and going on to the Middle East, with a major trading market in Damascus. From there, the merchandise was shipped across the Mediterranean Sea. Few merchants travelled the entire route; goods were handled mostly by a series of middlemen.',
    },
    {
      label: 'D',
      content:
        "With the mulberry silkworm being native to China, the country was the world's sole producer of silk for many hundreds of years. The secret of silk-making eventually reached the rest of the world via the Byzantine Empire, which ruled over the Mediterranean region of southern Europe, North Africa and the Middle East during the period 330-1453 AD. According to another legend, monks working for the Byzantine emperor Justinian smuggled silkworm eggs to Constantinople (Istanbul in modern-day Turkey) in 550 AD, concealed inside hollow bamboo walking canes. The Byzantines were as secretive as the Chinese, however, and for many centuries the weaving and trading of silk fabric was a strict imperial monopoly. Then in the seventh century, the Arabs conquered Persia, capturing their magnificent silks in the process. Silk production thus spread through Africa, Sicily and Spain as the Arabs swept through these lands. Andalusia in southern Spain was Europe's main silk-producing centre in the tenth century. By the thirteenth century, however, Italy had become Europe's leader in silk production and export. Venetian merchants traded extensively in silk and encouraged silk growers to settle in Italy. Even now, silk processed in the province of Como in northern Italy enjoys an esteemed reputation.",
    },
    {
      label: 'E',
      content:
        "The nineteenth century and industrialisation saw the downfall of the European silk industry. Cheaper Japanese silk, trade in which was greatly facilitated by the opening of the Suez Canal, was one of the many factors driving the trend. Then in the twentieth century, new manmade fibres, such as nylon, started to be used in what had traditionally been silk products, such as stockings and parachutes. The two world wars, which interrupted the supply of raw material from Japan, also stifled the European silk industry. After the Second World War, Japan's silk production was restored, with improved production and quality of raw silk. Japan was to remain the world's biggest producer of raw silk, and practically the only major exporter of raw silk, until the 1970s.",
    },
    {
      label: 'F',
      content:
        "However, in more recent decades, China has gradually recaptured its position as the world's biggest producer and exporter of raw silk and silk yarn. Today, around 125,000 metric tons of silk are produced in the world, and almost two thirds of that production takes place in China.",
    },
  ],
  questions: day17Questions,
}

const day18Section: Section = {
  id: 'day18-great-migrations-p2',
  title: 'Day 18 Passage 2: Great Migrations',
  paragraphs: [
    {
      label: 'A',
      content:
        'Animal migration, however it is defined, is far more than just the movement of animals. It can loosely be described as travel that takes place at regular intervals - often in an annual cycle - that may involve many members of a species, and is rewarded only after a long journey. It suggests inherited instinct. The biologist Hugh Dingle has identified five characteristics that apply, in varying degrees and combinations, to all migrations. They are prolonged movements that carry animals outside familiar habitats; they tend to be linear, not zigzaggy; they involve special behaviours concerning preparation (such as overfeeding) and arrival; they demand special allocations of energy. And one more: migrating animals maintain an intense attentiveness to the greater mission, which keeps them undistracted by temptations and undeterred by challenges that would turn other animals aside.',
    },
    {
      label: 'B',
      content:
        "An arctic tern, on its 20,000 km flight from the extreme south of South America to the Arctic circle, will take no notice of a nice smelly herring offered from a bird-watcher's boat along the way. While local gulls will dive voraciously for such handouts, the tern flies on. Why? The arctic tern resists distraction because it is driven at that moment by an instinctive sense of something we humans find admirable: larger purpose. In other words, it is determined to reach its destination. The bird senses that it can eat, rest and mate later. Right now it is totally focused on the journey; its undivided intent is arrival.",
    },
    {
      label: 'C',
      content:
        'Reaching some gravelly coastline in the Arctic, upon which other arctic terns have converged, will serve its larger purpose as shaped by evolution: finding a place, a time, and a set of circumstances in which it can successfully hatch and rear offspring.',
    },
    {
      label: 'D',
      content:
        "But migration is a complex issue, and biologists define it differently, depending in part on what sorts of animals they study. Joel Berger, of the University of Montana, who works on the American pronghorn and other large terrestrial mammals, prefers what he calls a simple, practical definition suited to his beasts: movements from a seasonal home area away to another home area and back again. Generally, the reason for such seasonal back-and-forth movement is to seek resources that aren't available within a single area year-round.",
    },
    {
      label: 'E',
      content:
        'But daily vertical movements by zooplankton in the ocean - upward by night to seek food, downward by day to escape predators - can also be considered migration. So can the movement of aphids when, having depleted the young leaves on one food plant, their offspring then fly onward to a different host plant, with no one aphid ever returning to where it started.',
    },
    {
      label: 'F',
      content:
        "Dingle is an evolutionary biologist who studies insects. His definition is more intricate than Berger's, citing those five features that distinguish migration from other forms of movement. They allow for the fact that, for example, aphids will become sensitive to blue light (from the sky) when it's time for takeoff on their big journey, and sensitive to yellow light (reflected from tender young leaves) when it's appropriate to land. Birds will fatten themselves with heavy feeding in advance of a long migrational flight. The value of his definition, Dingle argues, is that it focuses attention on what the phenomenon of wildebeest migration shares with the phenomenon of the aphids, and therefore helps guide researchers towards understanding how evolution has produced them all.",
    },
    {
      label: 'G',
      content:
        "Human behaviour, however, is having a detrimental impact on animal migration. The pronghorn, which resembles an antelope, though they are unrelated, is the fastest land mammal of the New World. One population, which spends the summer in the mountainous Grand Teton National Park of the western USA, follows a narrow route from its summer range in the mountains, across a river, and down onto the plains. Here they wait out the frozen months, feeding mainly on sagebrush blown clear of snow. These pronghorn are notable for the invariance of their migration route and the severity of its constriction at three bottlenecks. If they cannot pass through each of the three during their spring migration, they cannot reach their bounty of summer grazing; if they cannot pass through again in autumn, escaping south onto those windblown plains, they are likely to die trying to overwinter in the deep snow. Pronghorn, dependent on distance vision and speed to keep safe from predators, traverse high, open shoulders of land, where they can see and run. At one of the bottlenecks, forested hills rise to form a V, leaving a corridor of open ground only about 150 metres wide, filled with private homes. Increasing development is leading toward a crisis for the pronghorn, threatening to choke off their passageway.",
    },
    {
      label: 'H',
      content:
        "Conservation scientists, along with some biologists and land managers within the USA's National Park Service and other agencies, are now working to preserve migrational behaviours, not just species and habitats. A National Forest has recognised the path of the pronghorn, much of which passes across its land, as a protected migration corridor. But neither the Forest Service nor the Park Service can control what happens on private land at a bottleneck. And with certain other migrating species, the challenge is complicated further - by vastly greater distances traversed, more jurisdictions, more borders, more dangers along the way. We will require wisdom and resoluteness to ensure that migrating species can continue their journeying a while longer.",
    },
  ],
  questions: day18Questions,
}

const day19Section: Section = {
  id: 'day19-math-reasoning-preface-p3',
  title: "Day 19 Passage 3: Preface to 'How the other half thinks: Adventures in mathematical reasoning'",
  paragraphs: [
    {
      label: 'A',
      content:
        "Occasionally, in some difficult musical compositions, there are beautiful, but easy parts - parts so simple a beginner could play them. So it is with mathematics as well. There are some discoveries in advanced mathematics that do not depend on specialized knowledge, not even on algebra, geometry, or trigonometry. Instead, they may involve, at most, a little arithmetic, such as 'the sum of two odd numbers is even', and common sense. Each of the eight chapters in this book illustrates this phenomenon. Anyone can understand every step in the reasoning. The thinking in each chapter uses at most only elementary arithmetic, and sometimes not even that. Thus all readers will have the chance to participate in a mathematical experience, to appreciate the beauty of mathematics, and to become familiar with its logical, yet intuitive, style of thinking.",
    },
    {
      label: 'B',
      content:
        "One of my purposes in writing this book is to give readers who haven't had the opportunity to see and enjoy real mathematics the chance to appreciate the mathematical way of thinking. I want to reveal not only some of the fascinating discoveries, but, more importantly, the reasoning behind them. In that respect, this book differs from most books on mathematics written for the general public. Some present the lives of colorful mathematicians. Others describe important applications of mathematics. Yet others go into mathematical procedures, but assume that the reader is adept in using algebra.",
    },
    {
      label: 'C',
      content:
        'I hope this book will help bridge that notorious gap that separates the two cultures: the humanities and the sciences, or should I say the right brain (intuitive) and the left brain (analytical, numerical). As the chapters will illustrate, mathematics is not restricted to the analytical and numerical; intuition plays a significant role. The alleged gap can be narrowed or completely overcome by anyone, in part because each of us is far from using the full capacity of either side of the brain. To illustrate our human potential, I cite a structural engineer who is an artist, an electrical engineer who is an opera singer, an opera singer who published mathematical research, and a mathematician who publishes short stories.',
    },
    {
      label: 'D',
      content:
        'Other scientists have written books to explain their fields to non-scientists, but have necessarily had to omit the mathematics, although it provides the foundation of their theories. The reader must remain a tantalized spectator rather than an involved participant, since the appropriate language for describing the details in much of science is mathematics, whether the subject is expanding universe, subatomic particles, or chromosomes. Though the broad outline of a scientific theory can be sketched intuitively, when a part of the physical universe is finally understood, its description often looks like a page in a mathematics text.',
    },
    {
      label: 'E',
      content:
        'Still, the non-mathematical reader can go far in understanding mathematical reasoning. This book presents the details that illustrate the mathematical style of thinking, which involves sustained, step-by-step analysis, experiments, and insights. You will turn these pages much more slowly than when reading a novel or a newspaper. It may help to have a pencil and paper ready to check claims and carry out experiments.',
    },
    {
      label: 'F',
      content:
        'As I wrote, I kept in mind two types of readers: those who enjoyed mathematics until they were turned off by an unpleasant episode, usually around fifth grade, and mathematics aficionados, who will find much that is new throughout the book. This book also serves readers who simply want to sharpen their analytical skills. Many careers, such as law and medicine, require extended, precise analysis. Each chapter offers practice in following a sustained and closely argued line of thought. That mathematics can develop this skill is shown by these two testimonials.',
    },
    {
      label: 'G',
      content:
        'A physician wrote, "The discipline of analytical thought processes in mathematics prepared me extremely well for medical school. In medicine one is faced with a problem which must be thoroughly analyzed before a solution can be found. The process is similar to doing mathematics." A lawyer made the same point, "Although I had no background in law - not even one political science course - I did well at one of the best law schools. I attribute much of my success there to having learned, through the study of mathematics, and, in particular, theorems, how to analyze complicated principles. Lawyers who have studied mathematics can master the legal principles in a way that most others cannot."',
    },
  ],
  questions: day19Questions,
}

const day21Section: Section = {
  id: 'day21-fishbourne-palace-p1',
  title: 'Day 21 Passage 1: Fishbourne Roman Palace',
  paragraphs: [
    {
      label: 'A',
      content:
        'Fishbourne Roman Palace is in the village of Fishbourne in West Sussex, England. This large palace was built in the 1st century AD, around thirty years after the Roman conquest of Britain, on the site of Roman army grain stores which had been established after the invasion, in the reign of the Roman Emperor Claudius in 43 AD. The rectangular palace was built around formal gardens, the northern half of which have been reconstructed. There were extensive alterations in the 2nd and 3rd centuries AD, with many of the original black and white mosaic floors being overlaid with more sophisticated coloured ones, including a perfectly preserved mosaic of a dolphin in the north wing. More alterations were in progress when the palace burnt down in around 270 AD, after which it was abandoned.',
    },
    {
      label: 'B',
      content:
        'Local people had long believed that a Roman palace once existed in the area. However, it was not until 1960 that the archaeologist Barry Cunliffe, of Oxford University, first systematically excavated the site, after workmen had accidentally uncovered a wall while they were laying a water main. The Roman villa excavated by Cunliffe\'s team was so grand that it became known as Fishbourne Roman Palace, and a museum was erected to preserve some of the remains. This is administered by the Sussex Archaeological Society.',
    },
    {
      label: 'C',
      content:
        'In its day, the completed palace would have comprised four large wings with colonnaded fronts. The north and east wings consisted of suites of private rooms built around courtyards, with a monumental entrance in the middle of the east wing. In the north-east corner there was an assembly hall. The west wing contained state rooms, a large ceremonial reception room, and a gallery. The south wing contained the owner\'s private apartments. The palace included as many as 50 mosaic floors, under-floor central heating and a bathhouse. In size, Fishbourne Palace would have been approximately equivalent to some of the great Roman palaces of Italy, and was by far the largest known Roman residence north of the European Alps, at about 500 feet (150m) square. A team of volunteers and professional archaeologists are involved in an ongoing archaeological excavation on the site of nearby, possibly military, buildings.',
    },
    {
      label: 'D',
      content:
        'The first buildings to be erected on the site were constructed in the early part of the conquest in 43 AD. Later, two timber buildings were constructed, one with clay and mortar floors and plaster walls, which appears to have been a house of some comfort. These buildings were demolished in the 60s AD and replaced by a substantial stone house, which included colonnades, and a bath suite. It has been suggested that the palace itself, incorporating the previous house in its south-east corner, was constructed around 73-75 AD. However, Dr Miles Russell, of Bournemouth University, reinterpreted the ground plan and the collection of objects found and has suggested that, given the extremely close parallels with the imperial palace of Domitian in Rome, its construction may more plausibly date to after 92 AD.',
    },
    {
      label: 'E',
      content:
        'With regard to who lived in Fishbourne Palace, there are a number of theories; for example, one proposed by Professor Cunliffe is that, in its early phase, the palace was the residence of Tiberius Claudius Cogidubnus, a local chieftain who supported the Romans, and who may have been installed as king of a number of territories following the first stage of the conquest. Cogidubnus is known from a reference to his loyalty in Agricola, a work by the Roman writer Tacitus, and from an inscription commemorating a temple dedicated to the gods Neptune and Minerva found in the nearby city of Chichester. Another theory is that it was built for Sallustius Lucullus, a Roman governor of Britain of the late 1st century, who may have been the son of the British prince Adminius. Two inscriptions recording the presence of Lucullus have been found in Chichester, and the redating by Miles Russell of the palace construction to the 90s would be consistent with Lucullus\'s governorship. If the palace was designed for Lucullus, then it may have only been in use for a few years, as the Roman historian Suetonius records that Lucullus was executed by the Emperor Domitian in or shortly after 93 AD.',
    },
    {
      label: 'F',
      content:
        'Additional theories suggest that either Verica, a British king of the Roman Empire in the years preceding the Claudian invasion, was owner of the palace, or Tiberius Claudius Catuarus, following the recent discovery of a gold ring belonging to him. The palace outlasted the original owner, whoever he was, and was extensively re-planned early in the 2nd century AD, and subdivided into a series of lesser apartments. Further redevelopment was begun in the late 3rd century AD, but these alterations were incomplete when the north wing was destroyed in a fire in around 270 AD. The damage was too great to repair, and the palace was abandoned and later dismantled.',
    },
    {
      label: 'G',
      content:
        'A modern museum has been built by the Sussex Archaeological Society, incorporating most of the visible remains, including one wing of the palace. The gardens have been re-planted using authentic plants from the Roman period.',
    },
  ],
  questions: day21Questions,
}

const day22Section: Section = {
  id: 'day22-fear-unknown-p2',
  title: 'Day 22 Passage 2: Fear of the Unknown',
  paragraphs: [
    {
      label: 'A',
      content:
        "In the small Umagic office in midtown Manhattan, a team of 30 computer programmers are working on setting up websites that will allow subscribers to feed in details about themselves and their problems and to receive advice from 'virtual' versions of personalities regarded as experts in their fields: for example, a well-known dietician, a celebrity fitness trainer, a psychologist well known in the media for her work on parent-child relationships. Umagic Systems is a young firm and it's hard to predict how far they'll go. In ten years' time, consulting a computer about your diet problems might seem natural or it might seem absurd. But the company and others like it are beginning to seriously worry large American firms, who see such half-crazy new and innovative ideas as a threat to their own future success.",
    },
    {
      label: 'B',
      content:
        'Innovation has become a major concern of American management. Firms have found that it is increasingly difficult to redesign existing products or to produce them more economically. The stars of American business tend today to be innovators such as Amazon (the internet bookstore) and Wal-Mart (the supermarket chain) which have produced completely new ideas or products that have changed their industries.',
    },
    {
      label: 'C',
      content:
        "Over the past 15 years, the firms which have achieved the greatest profits have been the ones which have had the most innovations. But such profits aren't easy to come by. One of the reasons for the increasing number of mergers between companies is a desperate search for new ideas. And a fortune is spent nowadays on identifying and protecting intellectual property: other people's ideas.",
    },
    {
      label: 'D',
      content:
        'According to the Pasadena-based Patent & License Exchange in the United States, trading in intangible assets such as intellectual property rose from $15 billion in 1990 to $100 billion in 1998, with an increasing proportion of the rewards going to small firms and individuals.',
    },
    {
      label: 'E',
      content:
        "And therein lies the terror for big companies: that innovation seems to work best outside them. Many of the large established companies have been struggling to come up with new products recently. 'In the management of creativity, size is your enemy,' argues Peter Chemin, who runs Fox TV and film empire for News Corporation. 'One person managing 20 movies is never going to be as involved as one doing five movies.' He has thus tried to break down the studio into smaller units, even at the risk of incurring higher costs.",
    },
    {
      label: 'F',
      content:
        'It is easier for ideas to develop outside big firms these days. In the past, if a clever scientist had an idea he wanted to commercialise, he would take it first to a big company. Now, with the banks encouraging individuals to set up new businesses through offering special loans, innovators are more likely to set up on their own. Umagic has already raised $5 million and is about to raise $25 million more. Even in capital-intensive businesses such as pharmaceuticals, entrepreneurs can conduct profitable, early-stage research, selling out to the big firms when they reach expensive, risky clinical trials.',
    },
    {
      label: 'G',
      content:
        "Some giants, including General Electric and Cisco, have been remarkably successful at buying up and integrating scores of small companies. But many others worry about the prices they have to pay and the difficulty in keeping hold of the people who dreamt up the ideas. Everybody would like to develop more ideas in-house. Procter & Gamble is now changing the entire direction of its business from global expansion to product development; one of its new aims is to get innovations accepted across the company. Elsewhere, the search for innovation has led to a craze for 'intrapreneurship' - giving more power to individuals in the company and setting up internal ideas-factories so that talented staff will not leave. And yet innovation does not happen just because the chief executive wills it. Indeed, it is extremely difficult to come up with new ideas year in, year out, especially brilliant ones. Underneath all experts' diagrams, lists and charts, most of the available answers seem to focus on two strengths that are difficult to impose: a culture that looks for new ideas, and leaders who know which ones to back. Companies have to discredit the widespread view that jobs working on new products are for 'those who can't cope in the real business'. They have to change the culture by introducing hard incentives, such as giving more generous bonuses to those who come up with successful new ideas and, particularly, not punishing those whose experiments fail. Will all this reorganization and culture tweaking make big firms more creative? David Post, the founder of Umagic, isn't so sure. He also recalls with glee the looks of total incomprehension when he tried to sell his 'virtual experts' idea three years ago to firms such as IBM, though, as he cheerfully adds, 'of course, they could have been right'. Apparently, innovation - unlike diet, fitness and parenting - is one area where a computer cannot tell you what to do.",
    },
  ],
  questions: day22Questions,
}

const day23Section: Section = {
  id: 'day23-food-desert-p3',
  title: 'Day 23 Passage 3: How to find your way out of a food desert',
  paragraphs: [
    {
      label: 'A',
      content:
        "Over the last few months, a survey has been carried out of over 200 greengrocers and convenience stores in Crown Heights, a neighborhood in Brooklyn, New York. As researchers from the Brooklyn Food Association enter the details, colorful dots appear on their online map, which display the specific location of each of the food stores in a handful of central Brooklyn neighborhoods. Clicking on a dot will show you the store's name and whether it carries fresh fruit and vegetables, wholegrain bread, low-fat dairy and other healthy options.",
    },
    {
      label: 'B',
      content:
        "The researchers plan eventually to survey the entire borough of Brooklyn. 'We want to get to a more specific and detailed description of what that looks like', says Jeffrey Heehs, who leads the project. He hopes it will help residents find fresh food in urban areas where the stores sell mostly packaged snacks or fast food, areas otherwise known as food deserts. The aim of the project is also to assist government officials in assessing food availability, and in forming future policies about what kind of food should be sold and where.",
    },
    {
      label: 'C',
      content:
        'In fact, the Brooklyn project represents the intersection of two growing trends: mapping fresh food markets in US cities, and private citizens creating online maps of local neighborhood features. According to Michael Goodchild, a geographer at the University of California at Santa Barbara, citizen map makers may make maps because there is no good government map, or to record problems such as burned-out traffic lights.',
    },
    {
      label: 'D',
      content:
        'According to recent studies, people at higher risk of chronic disease and who receive minimal incomes for the work they do, frequently live in neighborhoods located in food deserts. But how did these food deserts arise? Linda Alwitt and Thomas Donley, marketing researchers at DePaul University in Chicago, found that supermarkets often can’t afford the amount of land required for their stores in cities. City planning researcher Cliff Guy and colleagues at the University of Leeds in the UK found in 2004 that smaller urban groceries tend to close due to competition from suburban supermarkets.',
    },
    {
      label: 'E',
      content:
        'As fresh food stores leave a neighborhood, residents find it harder to eat well and stay healthy. Food deserts are linked with lower local health outcomes, and they may be a driving force in the health disparities between lower-income and affluent people in the US. Until recently, the issue attracted little national attention, and received no ongoing funding for research.',
    },
    {
      label: 'F',
      content:
        'Now, more US cities are becoming aware of their food landscapes. Last year, the United States Department of Agriculture launched a map of where food stores are located in all the US counties. Mari Gallagher, who runs a private consulting firm, says her researchers have mapped food stores and related them to health statistics for the cities of Detroit, Chicago, Cincinnati and Washington, D.C. These maps help cities identify where food deserts are and, occasionally, have documented that people living in food deserts have higher rates of diet-related diseases.',
    },
    {
      label: 'G',
      content:
        "The Brooklyn project differs in that it's run by a local core of five volunteers who have worked on the project for the past year, rather than trained, academic researchers. To gather data, they simply go to individual stores with pre-printed surveys in hand, and once the storekeeper's permission has been obtained, check off boxes on their list against the products for sale in the store. Their approach to data collection and research has been made possible by technologies such as mapping software and GPS-related smart phones, Google Maps and OpenStreetMap, an open-source online map with a history of involvement in social issues. Like Brooklyn Food Association volunteers, many citizen online map makers use maps to bring local problems to official attention, Goodchild says. Heehs, the mapping project leader, says that after his group gathers more data, it will compare neighborhoods, come up with solutions to address local needs, and then present them to New York City officials. Their website hasn't caught them much local or official attention yet, however. It was launched only recently, but its creators haven't yet set up systems to see who's looking at it.",
    },
    {
      label: 'H',
      content:
        "Experts who visited the Brooklyn group's site were optimistic but cautious. 'This kind of detailed information could be very useful' says Michele Ver Ploeg, an economist for the Department of Agriculture. To make the map more helpful to both residents and policy makers, she would like to see price data for healthy products, too. Karen Ansel, a registered dietician and a spokesperson for the American Dietetic Association, found the site confusing to navigate. 'That said, with this information in place the group has the tools to build a more user-friendly site that could be ... very helpful to consumers', she says. 'The group also should ensure their map is available to those who don't have internet access at home', she adds.",
    },
    {
      label: 'I',
      content:
        "In fact, a significant proportion of Brooklyn residents don't have internet access at home and 8 percent rely on dial-up service, instead of high-speed internet access, according to Gretchen Maneval, director of Brooklyn College's Center for the Study of Brooklyn. 'It's still very much a work in progress', Heehs says of the online map. They'll start advertising it online and by email to other community groups, such as urban food garden associations, next month. He also hopes warmer days in the spring will draw out fresh volunteers to spread awareness and to finish surveying, as they have about two-thirds of Brooklyn left to cover.",
    },
  ],
  questions: day23Questions,
}

export const readingDaySectionsDay14To23: Record<number, Section> = {
  14: day14Section,
  15: day15Section,
  16: day16Section,
  17: day17Section,
  18: day18Section,
  19: day19Section,
  21: day21Section,
  22: day22Section,
  23: day23Section,
}
