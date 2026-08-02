import type { Question, Section } from '../types/ieltsTypes'
import { readingDaySectionsExtra } from './readingDaySectionsExtra'
import { readingDaySectionsDay26To29 } from './readingDaySectionsDay26To29'

const paragraphOptionsAtoH = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
const paragraphOptionsAtoI = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']
const paragraphOptionsAtoG = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
const researcherOptions = ['A. James', 'B. Cooley', 'C. Lewis and Brooks-Gunn', 'D. Mead', 'E. Bronson']
const venusPeopleOptions = ['A. Edmond Halley', 'B. Johannes Kepler', 'C. Guillaume Le Gentil', 'D. Johann Franz Encke']
const classroomNoiseFactorOptions = [
  'A. current teaching methods',
  'B. echoing corridors',
  'C. cooling systems',
  'D. large class sizes',
  'E. loud-voiced teachers',
  'F. playground games',
]
const iconoclastEndingOptions = [
  'A. requires both perceptual and social intelligence skills.',
  'B. focuses on how groups decide on an action.',
  'C. works in many fields, both artistic and scientific.',
  'D. leaves one open to criticism and rejection.',
  'E. involves understanding how organizations manage people.',
]

const day1Questions: Question[] = [
  {
    id: 'day1-q1',
    number: 1,
    type: 'true-false-not-given',
    groupTitle: 'Questions 1-6',
    instruction:
      'Choose TRUE if the statement agrees with the information in the text, choose FALSE if the statement contradicts the information, or choose NOT GIVEN if there is no information on this.',
    text: "Marie Curie's husband was a joint winner of both Marie's Nobel Prizes.",
    correctAnswer: 'FALSE',
    location: 'Paragraph A',
  },
  {
    id: 'day1-q2',
    number: 2,
    type: 'true-false-not-given',
    text: 'Marie became interested in science when she was a child.',
    correctAnswer: 'NOT GIVEN',
    location: 'Paragraph B',
  },
  {
    id: 'day1-q3',
    number: 3,
    type: 'true-false-not-given',
    text: "Marie was able to attend the Sorbonne because of her sister's financial contribution.",
    correctAnswer: 'TRUE',
    location: 'Paragraph B',
  },
  {
    id: 'day1-q4',
    number: 4,
    type: 'true-false-not-given',
    text: 'Marie stopped doing research for several years when her children were born.',
    correctAnswer: 'FALSE',
    location: 'Paragraph F',
  },
  {
    id: 'day1-q5',
    number: 5,
    type: 'true-false-not-given',
    text: 'Marie took over the teaching position her husband had held.',
    correctAnswer: 'TRUE',
    location: 'Paragraph G',
  },
  {
    id: 'day1-q6',
    number: 6,
    type: 'true-false-not-given',
    text: "Marie's sister Bronia studied the medical uses of radioactivity.",
    correctAnswer: 'NOT GIVEN',
    location: 'Paragraph B',
  },
  {
    id: 'day1-q7',
    number: 7,
    type: 'summary-completion',
    groupTitle: 'Questions 7-13',
    instruction: 'Complete the notes below. Choose ONE WORD from the passage for each answer.',
    text: 'When uranium was discovered to be radioactive, Marie Curie found that the element called ______ had the same property.',
    correctAnswer: 'thorium',
    location: 'Paragraph D',
  },
  {
    id: 'day1-q8',
    number: 8,
    type: 'summary-completion',
    text: "Marie and Pierre Curie's research into the radioactivity of the mineral known as ______ led to the discovery of two new elements.",
    correctAnswer: 'pitchblende',
    location: 'Paragraph E',
  },
  {
    id: 'day1-q9',
    number: 9,
    type: 'summary-completion',
    text: 'In 1911, Marie Curie received recognition for her work on the element ______.',
    correctAnswer: 'radium',
    location: 'Paragraph G',
  },
  {
    id: 'day1-q10',
    number: 10,
    type: 'summary-completion',
    text: 'Marie and Irene Curie developed X-radiography which was used as a medical technique for ______.',
    correctAnswer: 'treatment',
    location: 'Paragraph H',
  },
  {
    id: 'day1-q11',
    number: 11,
    type: 'summary-completion',
    text: 'Marie Curie saw the importance of collecting radioactive material both for research and for cases of ______.',
    correctAnswer: 'illness',
    location: 'Paragraph J',
  },
  {
    id: 'day1-q12',
    number: 12,
    type: 'summary-completion',
    text: 'The radioactive material stocked in Paris contributed to the discoveries in the 1930s of the ______ and of what was known as artificial radioactivity.',
    correctAnswer: 'neutron',
    location: 'Paragraph K',
  },
  {
    id: 'day1-q13',
    number: 13,
    type: 'summary-completion',
    text: 'During her research, Marie Curie was exposed to radiation and as a result she suffered from ______.',
    correctAnswer: 'leukaemia',
    location: 'Paragraph K',
  },
]

const day2Questions: Question[] = [
  {
    id: 'day2-q14',
    number: 14,
    type: 'matching-information',
    groupTitle: 'Questions 14-19',
    instruction:
      'Which paragraph contains the following information? NB You may use any letter more than once.',
    text: 'an account of the method used by researchers in a particular study',
    options: paragraphOptionsAtoH,
    correctAnswer: 'G',
    location: 'Paragraph G',
  },
  {
    id: 'day2-q15',
    number: 15,
    type: 'matching-information',
    text: 'the role of imitation in developing a sense of identity',
    options: paragraphOptionsAtoH,
    correctAnswer: 'C',
    location: 'Paragraph C',
  },
  {
    id: 'day2-q16',
    number: 16,
    type: 'matching-information',
    text: 'the age at which children can usually identify a static image of themselves',
    options: paragraphOptionsAtoH,
    correctAnswer: 'G',
    location: 'Paragraph G',
  },
  {
    id: 'day2-q17',
    number: 17,
    type: 'matching-information',
    text: "a reason for the limitations of scientific research into 'self-as-subject'",
    options: paragraphOptionsAtoH,
    correctAnswer: 'D',
    location: 'Paragraph D',
  },
  {
    id: 'day2-q18',
    number: 18,
    type: 'matching-information',
    text: 'reference to a possible link between culture and a particular form of behaviour',
    options: paragraphOptionsAtoH,
    correctAnswer: 'H',
    location: 'Paragraph H',
  },
  {
    id: 'day2-q19',
    number: 19,
    type: 'matching-information',
    text: "examples of the wide range of features that contribute to the sense of 'self-as-object'",
    options: paragraphOptionsAtoH,
    correctAnswer: 'E',
    location: 'Paragraph E',
  },
  {
    id: 'day2-q20',
    number: 20,
    type: 'matching-information',
    groupTitle: 'Questions 20-23',
    instruction: 'Match each sentence with the correct person from the list of researchers.',
    text: 'A sense of identity can never be formed without relationships with other people.',
    options: researcherOptions,
    correctAnswer: 'D',
    location: 'Paragraph F',
  },
  {
    id: 'day2-q21',
    number: 21,
    type: 'matching-information',
    text: "A child's awareness of self is related to a sense of mastery over things and people.",
    options: researcherOptions,
    correctAnswer: 'B',
    location: 'Paragraph B',
  },
  {
    id: 'day2-q22',
    number: 22,
    type: 'matching-information',
    text: "At a certain age, children's sense of identity leads to aggressive behaviour.",
    options: researcherOptions,
    correctAnswer: 'E',
    location: 'Paragraph H',
  },
  {
    id: 'day2-q23',
    number: 23,
    type: 'matching-information',
    text: "Observing their own reflection contributes to children's self-awareness.",
    options: researcherOptions,
    correctAnswer: 'C',
    location: 'Paragraph C',
  },
  {
    id: 'day2-q24',
    number: 24,
    type: 'summary-completion',
    groupTitle: 'Questions 24-26',
    instruction: 'Complete the summary below. Choose ONE WORD ONLY from the passage for each answer.',
    text: 'First, children come to realise that they can have an effect on the world around them, for example by handling objects, or causing the image to move when they face a ______.',
    correctAnswer: 'mirror',
    location: 'Paragraph C',
  },
  {
    id: 'day2-q25',
    number: 25,
    type: 'summary-completion',
    text: 'This aspect of self-awareness is difficult to research directly, because of ______ problems.',
    correctAnswer: 'communication',
    location: 'Paragraph D',
  },
  {
    id: 'day2-q26',
    number: 26,
    type: 'summary-completion',
    text: "In Western societies at least, the development of self awareness is often linked to a sense of ______ and can lead to disputes.",
    correctAnswer: 'ownership',
    location: 'Paragraph H',
  },
]

const day3Questions: Question[] = [
  {
    id: 'day3-q27',
    number: 27,
    type: 'matching-headings',
    groupTitle: 'Questions 27-30',
    instruction: 'Choose the correct heading for paragraphs B-E from the list of headings below.',
    text: 'Paragraph B',
    options: [
      'A. Commercial pressures on people in charge',
      'B. Mixed views on current changes to museums',
      'C. Interpreting the facts to meet visitor expectations',
      'D. The international dimension',
      'E. Collections of factual evidence',
      'F. Fewer differences between public attractions',
      'G. Current reviews and suggestions',
    ],
    correctAnswer: 'B',
    location: 'Paragraph B',
  },
  {
    id: 'day3-q28',
    number: 28,
    type: 'matching-headings',
    text: 'Paragraph C',
    options: paragraphOptionsAtoG,
    correctAnswer: 'F',
    location: 'Paragraph C',
  },
  {
    id: 'day3-q29',
    number: 29,
    type: 'matching-headings',
    text: 'Paragraph D',
    options: paragraphOptionsAtoG,
    correctAnswer: 'A',
    location: 'Paragraph D',
  },
  {
    id: 'day3-q30',
    number: 30,
    type: 'matching-headings',
    text: 'Paragraph E',
    options: paragraphOptionsAtoG,
    correctAnswer: 'C',
    location: 'Paragraph E',
  },
  {
    id: 'day3-q31',
    number: 31,
    type: 'multiple-choice',
    groupTitle: 'Questions 31-36',
    instruction: 'Choose the correct answer.',
    text: "Compared with today's museums, those of the past",
    options: [
      'did not present history in a detailed way.',
      'were not primarily intended for the public.',
      'were more clearly organised.',
      'preserved items with greater care.',
    ],
    correctAnswer: 'were not primarily intended for the public.',
    location: 'Paragraph A',
  },
  {
    id: 'day3-q32',
    number: 32,
    type: 'multiple-choice',
    text: 'According to the writer, current trends in the heritage industry',
    options: [
      'emphasise personal involvement.',
      'have their origins in York and London.',
      'rely on computer images.',
      'reflect minority tastes.',
    ],
    correctAnswer: 'emphasise personal involvement.',
    location: 'Paragraph B',
  },
  {
    id: 'day3-q33',
    number: 33,
    type: 'multiple-choice',
    text: 'The writer says that museums, heritage sites and theme parks',
    options: [
      'often work in close partnership.',
      'try to preserve separate identities.',
      'have similar exhibits.',
      'are less easy to distinguish than before.',
    ],
    correctAnswer: 'are less easy to distinguish than before.',
    location: 'Paragraph C',
  },
  {
    id: 'day3-q34',
    number: 34,
    type: 'multiple-choice',
    text: 'Experts must balance historical evidence with the need to present exhibits attractively.',
    options: [
      'should pursue a single objective.',
      'have to do a certain amount of language translation.',
      'should be free from commercial constraints.',
      'have to balance conflicting priorities.',
    ],
    correctAnswer: 'have to balance conflicting priorities.',
    location: 'Paragraph D',
  },
  {
    id: 'day3-q35',
    number: 35,
    type: 'multiple-choice',
    text: 'In paragraph E, the writer suggests that some museum exhibits',
    options: [
      'fail to match visitor expectations.',
      'are based on the false assumptions of professionals.',
      'reveal more about present beliefs than about the past.',
      'allow visitors to make more use of their imagination.',
    ],
    correctAnswer: 'reveal more about present beliefs than about the past.',
    location: 'Paragraph E',
  },
  {
    id: 'day3-q36',
    number: 36,
    type: 'multiple-choice',
    text: 'The passage ends by noting that our view of history is biased because',
    options: [
      'we fail to use our imagination.',
      'only very durable objects remain from the past.',
      'we tend to ignore things that displease us.',
      'museum exhibits focus too much on the local area.',
    ],
    correctAnswer: 'only very durable objects remain from the past.',
    location: 'Paragraph F',
  },
  {
    id: 'day3-q37',
    number: 37,
    type: 'yes-no-not-given',
    groupTitle: 'Questions 37-40',
    instruction:
      'Choose YES if the statement agrees with the information, choose NO if it contradicts the information, or choose NOT GIVEN if there is no information on this.',
    text: 'Consumers prefer theme parks which avoid serious issues.',
    correctAnswer: 'NOT GIVEN',
    location: 'Paragraph D',
  },
  {
    id: 'day3-q38',
    number: 38,
    type: 'yes-no-not-given',
    text: 'More people visit museums than theme parks.',
    correctAnswer: 'NOT GIVEN',
    location: 'Paragraph D',
  },
  {
    id: 'day3-q39',
    number: 39,
    type: 'yes-no-not-given',
    text: 'The boundaries of Leyden have changed little since the seventeenth century.',
    correctAnswer: 'NO',
    location: 'Paragraph F',
  },
  {
    id: 'day3-q40',
    number: 40,
    type: 'yes-no-not-given',
    text: 'Museums can give a false impression of how life used to be.',
    correctAnswer: 'YES',
    location: 'Paragraph F',
  },
]

const day4Questions: Question[] = [
  {
    id: 'day4-q1',
    number: 1,
    type: 'matching-information',
    groupTitle: 'Questions 1-6',
    instruction: 'Which section contains the following information? Choose the correct letter, A-I.',
    text: 'an account of a national policy initiative',
    options: paragraphOptionsAtoI,
    correctAnswer: 'H',
    location: 'Paragraph H',
  },
  {
    id: 'day4-q2',
    number: 2,
    type: 'matching-information',
    text: 'a description of a global team effort',
    options: paragraphOptionsAtoI,
    correctAnswer: 'C',
    location: 'Paragraph C',
  },
  {
    id: 'day4-q3',
    number: 3,
    type: 'matching-information',
    text: 'a hypothesis as to one reason behind the growth in classroom noise',
    options: paragraphOptionsAtoI,
    correctAnswer: 'B',
    location: 'Paragraph B',
  },
  {
    id: 'day4-q4',
    number: 4,
    type: 'matching-information',
    text: 'a demand for suitable worldwide regulations',
    options: paragraphOptionsAtoI,
    correctAnswer: 'I',
    location: 'Paragraph I',
  },
  {
    id: 'day4-q5',
    number: 5,
    type: 'matching-information',
    text: 'a list of medical conditions which place some children more at risk from noise than others',
    options: paragraphOptionsAtoI,
    correctAnswer: 'D',
    location: 'Paragraph D',
  },
  {
    id: 'day4-q6',
    number: 6,
    type: 'matching-information',
    text: 'the estimated proportion of children in New Zealand with auditory problems',
    options: paragraphOptionsAtoI,
    correctAnswer: 'A',
    location: 'Paragraph A',
  },
  {
    id: 'day4-q7',
    number: 7,
    type: 'short-answer',
    groupTitle: 'Questions 7-10',
    instruction: 'Choose NO MORE THAN TWO WORDS AND/OR A NUMBER from the passage for each answer.',
    text: 'For what period of time has hearing loss in schoolchildren been studied in New Zealand?',
    correctAnswer: 'two decades',
    location: 'Paragraph A',
  },
  {
    id: 'day4-q8',
    number: 8,
    type: 'short-answer',
    text: 'In addition to machinery noise, what other type of noise can upset children with autism?',
    correctAnswer: 'crowd noise',
    location: 'Paragraph E',
  },
  {
    id: 'day4-q9',
    number: 9,
    type: 'short-answer',
    text: 'What term is used to describe the hearing problems of schoolchildren which have not been diagnosed?',
    correctAnswer: 'invisible disabilities',
    location: 'Paragraph G',
  },
  {
    id: 'day4-q10',
    number: 10,
    type: 'short-answer',
    text: 'What part of the New Zealand Disability Strategy aims to give schoolchildren equal opportunity?',
    correctAnswer: 'Objective 3',
    location: 'Paragraph H',
  },
  {
    id: 'day4-q11',
    number: 11,
    type: 'five-true-statements',
    groupTitle: 'Questions 11-12',
    instruction:
      'Choose TWO letters, A-F. The list below includes factors contributing to classroom noise. Which TWO are mentioned by the writer?',
    text: 'Select TWO options.',
    options: classroomNoiseFactorOptions,
    correctAnswer: ['A', 'C'],
    location: 'Paragraph B',
  },
  {
    id: 'day4-q13',
    number: 13,
    type: 'multiple-choice',
    groupTitle: 'Question 13',
    instruction: 'Choose the correct answer.',
    text: "What is the writer's overall purpose in writing this article?",
    options: [
      'to compare different methods of dealing with auditory problems',
      'to provide solutions for overly noisy learning environments',
      'to increase awareness of the situation of children with auditory problems',
      'to promote New Zealand as a model for other countries to follow',
    ],
    correctAnswer: 'C',
    location: 'Paragraph I',
  },
]

const day5Questions: Question[] = [
  {
    id: 'day5-q14',
    number: 14,
    type: 'matching-information',
    groupTitle: 'Questions 14-17',
    instruction: 'Which paragraph contains the following information? Choose the correct letter, A-G.',
    text: 'examples of different ways in which the parallax principle has been applied',
    options: paragraphOptionsAtoG,
    correctAnswer: 'F',
    location: 'Paragraph F',
  },
  {
    id: 'day5-q15',
    number: 15,
    type: 'matching-information',
    text: 'a description of an event which prevented a transit observation',
    options: paragraphOptionsAtoG,
    correctAnswer: 'D',
    location: 'Paragraph D',
  },
  {
    id: 'day5-q16',
    number: 16,
    type: 'matching-information',
    text: 'a statement about potential future discoveries leading on from transit observations',
    options: paragraphOptionsAtoG,
    correctAnswer: 'G',
    location: 'Paragraph G',
  },
  {
    id: 'day5-q17',
    number: 17,
    type: 'matching-information',
    text: 'a description of physical states connected with Venus which early astronomical instruments failed to overcome',
    options: paragraphOptionsAtoG,
    correctAnswer: 'E',
    location: 'Paragraph E',
  },
  {
    id: 'day5-q18',
    number: 18,
    type: 'matching-information',
    groupTitle: 'Questions 18-21',
    instruction: 'Match each statement with the correct person from the list of people below.',
    text: 'He calculated the distance of the Sun from the Earth based on observations of Venus with a fair degree of accuracy.',
    options: venusPeopleOptions,
    correctAnswer: 'D',
    location: 'Paragraph F',
  },
  {
    id: 'day5-q19',
    number: 19,
    type: 'matching-information',
    text: 'He understood that the distance of the Sun from the Earth could be worked out by comparing observations of a transit.',
    options: venusPeopleOptions,
    correctAnswer: 'A',
    location: 'Paragraph B',
  },
  {
    id: 'day5-q20',
    number: 20,
    type: 'matching-information',
    text: 'He realised that the time taken by a planet to go round the Sun depends on its distance from the Sun.',
    options: venusPeopleOptions,
    correctAnswer: 'B',
    location: 'Paragraph C',
  },
  {
    id: 'day5-q21',
    number: 21,
    type: 'matching-information',
    text: 'He witnessed a Venus transit but was unable to make any calculations.',
    options: venusPeopleOptions,
    correctAnswer: 'C',
    location: 'Paragraph D',
  },
  {
    id: 'day5-q22',
    number: 22,
    type: 'true-false-not-given',
    groupTitle: 'Questions 22-26',
    instruction:
      'Choose TRUE if the statement agrees with the information in the text, choose FALSE if the statement contradicts the information, or choose NOT GIVEN if there is no information on this.',
    text: 'Halley observed one transit of the planet Venus.',
    correctAnswer: 'FALSE',
    location: 'Paragraph C',
  },
  {
    id: 'day5-q23',
    number: 23,
    type: 'true-false-not-given',
    text: 'Le Gentil managed to observe a second Venus transit.',
    correctAnswer: 'FALSE',
    location: 'Paragraph D',
  },
  {
    id: 'day5-q24',
    number: 24,
    type: 'true-false-not-given',
    text: 'The shape of Venus appears distorted when it starts to pass in front of the Sun.',
    correctAnswer: 'TRUE',
    location: 'Paragraph E',
  },
  {
    id: 'day5-q25',
    number: 25,
    type: 'true-false-not-given',
    text: 'Early astronomers suspected that the atmosphere on Venus was toxic.',
    correctAnswer: 'NOT GIVEN',
    location: 'Paragraph E',
  },
  {
    id: 'day5-q26',
    number: 26,
    type: 'true-false-not-given',
    text: 'The parallax principle allows astronomers to work out how far away distant stars are from the Earth.',
    correctAnswer: 'TRUE',
    location: 'Paragraph F',
  },
]

const day6Questions: Question[] = [
  {
    id: 'day6-q27',
    number: 27,
    type: 'multiple-choice',
    groupTitle: 'Questions 27-31',
    instruction: 'Choose the correct answer.',
    text: 'Neuroeconomics is a field of study which seeks to',
    options: [
      'cause a change in how scientists understand brain chemistry.',
      'understand how good decisions are made in the brain.',
      'understand how the brain is linked to achievement in competitive fields.',
      'trace the specific firing patterns of neurons in different areas of the brain.',
    ],
    correctAnswer: 'C',
    location: 'Paragraph A',
  },
  {
    id: 'day6-q28',
    number: 28,
    type: 'multiple-choice',
    text: 'According to the writer, iconoclasts are distinctive because',
    options: [
      'they create unusual brain circuits.',
      'their brains function differently.',
      'their personalities are distinctive.',
      'they make decisions easily.',
    ],
    correctAnswer: 'B',
    location: 'Paragraph B',
  },
  {
    id: 'day6-q29',
    number: 29,
    type: 'multiple-choice',
    text: 'According to the writer, the brain works efficiently because',
    options: [
      'it uses the eyes quickly.',
      'it interprets data logically.',
      'it generates its own energy.',
      'it relies on previous events.',
    ],
    correctAnswer: 'D',
    location: 'Paragraph C',
  },
  {
    id: 'day6-q30',
    number: 30,
    type: 'multiple-choice',
    text: 'The writer says that perception is',
    options: [
      'a combination of photons and sound waves.',
      'a reliable product of what your senses transmit.',
      'a result of brain processes.',
      'a process we are usually conscious of.',
    ],
    correctAnswer: 'C',
    location: 'Paragraph C',
  },
  {
    id: 'day6-q31',
    number: 31,
    type: 'multiple-choice',
    text: 'According to the writer, an iconoclastic thinker',
    options: [
      'centralises perceptual thinking in one part of the brain.',
      'avoids cognitive traps.',
      'has a brain that is hardwired for learning.',
      'has more opportunities than the average person.',
    ],
    correctAnswer: 'B',
    location: 'Paragraph D',
  },
  {
    id: 'day6-q32',
    number: 32,
    type: 'yes-no-not-given',
    groupTitle: 'Questions 32-37',
    instruction:
      'Choose YES if the statement agrees with the claims of the writer, NO if it contradicts the claims, or NOT GIVEN if there is no information on this.',
    text: 'Exposure to different events forces the brain to think differently.',
    correctAnswer: 'YES',
    location: 'Paragraph E',
  },
  {
    id: 'day6-q33',
    number: 33,
    type: 'yes-no-not-given',
    text: 'Iconoclasts are unusually receptive to new experiences.',
    correctAnswer: 'YES',
    location: 'Paragraph E',
  },
  {
    id: 'day6-q34',
    number: 34,
    type: 'yes-no-not-given',
    text: 'Most people are too shy to try different things.',
    correctAnswer: 'NOT GIVEN',
    location: 'Paragraph E',
  },
  {
    id: 'day6-q35',
    number: 35,
    type: 'yes-no-not-given',
    text: 'If you think in an iconoclastic way, you can easily overcome fear.',
    correctAnswer: 'NO',
    location: 'Paragraph F',
  },
  {
    id: 'day6-q36',
    number: 36,
    type: 'yes-no-not-given',
    text: 'When concern about embarrassment matters less, other fears become irrelevant.',
    correctAnswer: 'NOT GIVEN',
    location: 'Paragraph F',
  },
  {
    id: 'day6-q37',
    number: 37,
    type: 'yes-no-not-given',
    text: 'Fear of public speaking is a psychological illness.',
    correctAnswer: 'NO',
    location: 'Paragraph F',
  },
  {
    id: 'day6-q38',
    number: 38,
    type: 'matching-information',
    groupTitle: 'Questions 38-40',
    instruction: 'Match each statement with the correct ending, A-E.',
    text: 'Thinking like a successful iconoclast is demanding because it',
    options: iconoclastEndingOptions,
    correctAnswer: 'A',
    location: 'Paragraph H',
  },
  {
    id: 'day6-q39',
    number: 39,
    type: 'matching-information',
    text: 'The concept of the social brain is useful to iconoclasts because it',
    options: iconoclastEndingOptions,
    correctAnswer: 'B',
    location: 'Paragraph H',
  },
  {
    id: 'day6-q40',
    number: 40,
    type: 'matching-information',
    text: 'Iconoclasts are generally an asset because their way of thinking',
    options: iconoclastEndingOptions,
    correctAnswer: 'C',
    location: 'Paragraph I',
  },
]

const day1Section: Section = {
  id: 'day1-curie-p1',
  title: 'Day 1 Passage 1: The life and work of Marie Curie',
  paragraphs: [
    {
      label: 'A',
      content:
        'Marie Curie is probably the most famous woman scientist who has ever lived. Born Maria Sklodowska in Poland in 1867, she is famous for her work on radioactivity, and was twice a winner of the Nobel Prize. With her husband, Pierre Curie, and Henri Becquerel, she was awarded the 1903 Nobel Prize for Physics, and was then sole winner of the 1911 Nobel Prize for Chemistry. She was the first woman to win a Nobel Prize.',
    },
    {
      label: 'B',
      content:
        "From childhood, Marie was remarkable for her prodigious memory, and at the age of 16 won a gold medal on completion of her secondary education. Because her father lost his savings through bad investment, she then had to take work as a teacher. From her earnings she was able to finance her sister Bronia's medical studies in Paris, on the understanding that Bronia would, in turn, later help her to get an education.",
    },
    {
      label: 'C',
      content:
        'In 1891 this promise was fulfilled and Marie went to Paris and began to study at the Sorbonne (the University of Paris). She often worked far into the night and lived on little more than bread and butter and tea. She came first in the examination in the physical sciences in 1893, and in 1894 was placed second in the examination in mathematical sciences. It was not until the spring of that year that she was introduced to Pierre Curie.',
    },
    {
      label: 'D',
      content:
        "Their marriage in 1895 marked the start of a partnership that was soon to achieve results of world significance. Following Henry Becquerel's discovery in 1896 of a new phenomenon, which Marie later called 'radioactivity', Marie Curie decided to find out if the radioactivity discovered in uranium was to be found in other elements. She discovered that this was true for thorium.",
    },
    {
      label: 'E',
      content:
        "Turning her attention to minerals, she found her interest drawn to pitchblende, a mineral whose radioactivity, superior to that of pure uranium, could be explained only by the presence in the ore of small quantities of an unknown substance of very high activity. Pierre Curie joined her in the work that she had undertaken to resolve this problem, and that led to the discovery of the new elements, polonium and radium. While Pierre Curie devoted himself chiefly to the physical study of the new radiations, Marie Curie struggled to obtain pure radium in the metallic state. This was achieved with the help of the chemist Andre-Louis Debierne, one of Pierre Curie's pupils. Based on the results of this research, Marie Curie received her Doctorate of Science, and in 1903 Marie and Pierre shared with Becquerel the Nobel Prize for Physics for the discovery of radioactivity.",
    },
    {
      label: 'F',
      content:
        "The births of Marie's two daughters, Irene and Eve, in 1897 and 1904 failed to interrupt her scientific work. She was appointed lecturer in physics at the Ecole Normale Superieure for girls in Sevres, France (1900), and introduced a method of teaching based on experimental demonstrations. In December 1904 she was appointed chief assistant in the laboratory directed by Pierre Curie.",
    },
    {
      label: 'G',
      content:
        "The sudden death of her husband in 1906 was a bitter blow to Marie Curie, but was also a turning point in her career. Henceforth she was to devote all her energy to completing alone the scientific work that they had undertaken. On May 13, 1906, she was appointed to the professorship that had been left vacant on her husband's death, becoming the first woman to teach at the Sorbonne. In 1911 she was awarded the Nobel Prize for Chemistry for the isolation of a pure form of radium.",
    },
    {
      label: 'H',
      content:
        "During World War I, Marie Curie, with the help of her daughter Irene, devoted herself to the development of the use of X-radiography, including the mobile units which came to be known as 'Little Curies', used for the treatment of wounded soldiers. In 1918 the Radium Institute, whose staff Irene had joined, began to operate in earnest, and became a centre for nuclear physics and chemistry. Marie Curie, now at the highest point of her fame and, from 1922, a member of the Academy of Medicine, researched the chemistry of radioactive substances and their medical applications.",
    },
    {
      label: 'I',
      content:
        'In 1921, accompanied by her two daughters, Marie Curie made a triumphant journey to the United States to raise funds for research on radium. Women there presented her with a gram of radium for her campaign. Marie also gave lectures in Belgium, Brazil, Spain and Czechoslovakia and, in addition, had the satisfaction of seeing the development of the Curie Foundation in Paris, and the inauguration in 1932 in Warsaw of the Radium Institute, where her sister Bronia became director.',
    },
    {
      label: 'J',
      content:
        'One of Marie Curie\'s outstanding achievements was to have understood the need to accumulate intense radioactive sources, not only to treat illness but also to maintain an abundant supply for research.',
    },
    {
      label: 'K',
      content:
        'The existence in Paris at the Radium Institute of a stock of 1.5 grams of radium made a decisive contribution to the success of the experiments undertaken in the years around 1930. This work prepared the way for the discovery of the neutron by Sir James Chadwick and, above all, for the discovery in 1934 by Irene and Frederic Joliot-Curie of artificial radioactivity. A few months after this discovery, Marie Curie died as a result of leukaemia caused by exposure to radiation. She had often carried test tubes containing radioactive isotopes in her pocket, remarking on the pretty blue-green light they gave off.',
    },
    {
      label: 'L',
      content:
        'Her contribution to physics had been immense, not only in her own work, the importance of which had been demonstrated by her two Nobel Prizes, but because of her influence on subsequent generations of nuclear physicists and chemists.',
    },
  ],
  questions: day1Questions,
}

const day2Section: Section = {
  id: 'day2-identity-p2',
  title: "Day 2 Passage 2: Young children's sense of identity",
  paragraphs: [
    {
      label: 'A',
      content:
        'A sense of self develops in young children by degrees. The process can usefully be thought of in terms of the gradual emergence of two somewhat separate features: the self as a subject, and the self as an object. William James introduced the distinction in 1892, and contemporaries of his, such as Charles Cooley, added to the developing debate. Ever since then psychologists have continued building on the theory.',
    },
    {
      label: 'B',
      content:
        "According to James, a child's first step on the road to self-understanding can be seen as the recognition that he or she exists. This is an aspect of the self that he labelled 'self-as-subject', and he gave it various elements. These included an awareness of one's own agency and an awareness of one's distinctiveness from other people. Cooley suggested that a sense of the self-as-subject was primarily concerned with being able to exercise power. He proposed that the earliest examples of this are an infant's attempts to control physical objects, followed by attempts to affect the behaviour of other people.",
    },
    {
      label: 'C',
      content:
        "Another powerful source of information for infants about the effects they can have on the world around them is provided when others mimic them. Many parents spend a lot of time copying their infant's vocalizations and expressions. In addition, young children enjoy looking in mirrors, where the movements they can see are dependent on their own movements. Lewis and Brooks-Gunn suggest that this growing understanding leads to an awareness that infants are distinct from other people.",
    },
    {
      label: 'D',
      content:
        "This understanding that children gain of themselves as active agents continues to develop in their attempts to co-operate with others in play. Dunn points out that it is in day-to-day relationships and interactions that a child's understanding of self emerges. Empirical investigations of the self-as-subject in young children are, however, rather scarce because of difficulties of communication.",
    },
    {
      label: 'E',
      content:
        "Once children have acquired a certain level of self-awareness, they begin to place themselves in a whole series of categories. This second step in the development of a full sense of self is what James called the self-as-object. It has been seen by many to be the aspect of the self most influenced by social elements, made up of social roles and characteristics which derive meaning from comparison or interaction with other people.",
    },
    {
      label: 'F',
      content:
        "Cooley and other researchers suggested a close connection between a person's own understanding of identity and other people's understanding of it. Cooley believed that people build up identity from the reactions of others. Mead went even further and saw the self and the social world as inextricably bound together, arguing that it is impossible to conceive of a self arising outside social experience.",
    },
    {
      label: 'G',
      content:
        'Lewis and Brooks-Gunn argued that an important development milestone is reached when children become able to recognize themselves visually without the support of contingent movement. This recognition occurs around their second birthday. In one experiment they put red powder on the noses of children playing in front of a mirror and then observed how often they touched their noses. They also found that children of 15 to 18 months are generally not able to recognize themselves unless cues such as movement are present.',
    },
    {
      label: 'H',
      content:
        "Displays of rage are common from 18 months to 3 years of age. In a longitudinal study, Bronson found that the intensity of frustration and anger in children's disagreements increased sharply between the ages of 1 and 2 years. These disagreements often involved disputes over ownership rather than a wish to play with the toy itself. Although this may be less marked in other societies, the link between the sense of self and ownership is notable in Western childhood.",
    },
  ],
  questions: day2Questions,
}

const day3Section: Section = {
  id: 'day3-museums-p3',
  title: 'Day 3 Passage 3: The Development of Museums',
  paragraphs: [
    {
      label: 'A',
      content:
        "The conviction that historical relics provide infallible testimony about the past is rooted in the nineteenth and early twentieth centuries, when science was regarded as objective and value free. As one writer observes: 'Although it is now evident that artefacts are as easily altered as chronicles, public faith in their veracity endures: a tangible relic seems ipso facto real.' Such conviction was, until recently, reflected in museum displays. Museums used to look - and some still do - much like storage rooms of objects packed together in showcases: good for scholars who wanted to study the subtle differences in design, but not for the ordinary visitor, to whom it all looked alike. Similarly, the information accompanying the objects often made little sense to the lay visitor. The content and format of explanations dated back to a time when the museum was the exclusive domain of the scientific researcher.",
    },
    {
      label: 'B',
      content:
        "Recently, however, attitudes towards history and the way it should be presented have altered. The key word in heritage display is now 'experience', the more exciting the better and, if possible, involving all the senses. Good examples of this approach in the UK are the Jorvik Centre in York; the National Museum of Photography, Film and Television in Bradford; and the Imperial War Museum in London. In the US the trend emerged much earlier: Williamsburg has been a prototype for many heritage developments in other parts of the world. No one can predict where the process will end. On so-called heritage sites the re-enactment of historical events is increasingly popular, and computers will soon provide virtual reality experiences, which will present visitors with a vivid image of the period of their choice, in which they themselves can act as if part of the historical environment. Such developments have been criticised as an intolerable vulgarisation, but the success of many historical theme parks and similar locations suggests that the majority of the public does not share this opinion.",
    },
    {
      label: 'C',
      content:
        "In a related development, the sharp distinction between museum and heritage sites on the one hand, and theme parks on the other, is gradually evaporating. They already borrow ideas and concepts from one another. For example, museums have adopted story lines for exhibitions, sites have accepted 'theming' as a relevant tool, and theme parks are moving towards more authenticity and research-based presentations. In zoos, animals are no longer kept in cages, but in great spaces, either in the open air or in enormous greenhouses, such as the jungle and desert environments in Burgers' Zoo in Holland. This particular trend is regarded as one of the major developments in the presentation of natural history in the twentieth century.",
    },
    {
      label: 'D',
      content:
        "Theme parks are undergoing other changes, too, as they try to present more serious social and cultural issues, and move away from fantasy. This development is a response to market forces and, although museums and heritage sites have a special, rather distinct, role to fulfil, they are also operating in a very competitive environment, where visitors make choices on how and where to spend their free time. Heritage and museum experts do not have to invent stories and recreate historical environments to attract their visitors: their assets are already in place. However, exhibits must be both based on artefacts and facts as we know them, and attractively presented. Those who are professionally engaged in the art of interpreting history are thus in a difficult position, as they must steer a narrow course between the demands of 'evidence' and 'attractiveness', especially given the increasing need in the heritage industry for income-generating activities.",
    },
    {
      label: 'E',
      content:
        "It could be claimed that in order to make everything in heritage more 'real', historical accuracy must be increasingly altered. For example, Pithecanthropus erectus is depicted in an Indonesian museum with Malay facial features, because this corresponds to public perceptions. Similarly, in the Museum of Natural History in Washington, Neanderthal man is shown making a dominant gesture to his wife. Such presentations tell us more about contemporary perceptions of the world than about our ancestors. There is one compensation, however, for the professionals who make these interpretations: if they did not provide the interpretation, visitors would do it for themselves, based on their own ideas, misconceptions and prejudices. And no matter how exciting the result, it would contain a lot more bias than the presentations provided by experts.",
    },
    {
      label: 'F',
      content:
        "Human bias is inevitable, but another source of bias in the representation of history has to do with the transitory nature of the materials themselves. The simple fact is that not everything from history survives the historical process. Castles, palaces and cathedrals have a longer lifespan than the dwellings of ordinary people. The same applies to the furnishings and other contents of the premises. In a town like Leyden in Holland, which in the seventeenth century was occupied by approximately the same number of inhabitants as today, people lived within the walled town, an area more than five times smaller than modern Leyden. In most of the houses several families lived together in circumstances beyond our imagination. Yet in museums, fine period rooms give only an image of the lifestyle of the upper class of that era. No wonder that people who stroll around exhibitions are filled with nostalgia; the evidence in museums indicates that life was so much better in the past. This notion is induced by the bias in its representation in museums and heritage centres.",
    },
  ],
  questions: day3Questions,
}

const day4Section: Section = {
  id: 'day4-auditory-problems-p1',
  title: 'Day 4 Passage 1: Classroom Noise and Auditory Function Deficits in Children',
  paragraphs: [
    {
      label: 'A',
      content:
        'Hearing impairment or other auditory function deficit in young children can have a major impact on their development of speech and communication, resulting in a detrimental effect on their ability to learn at school. This is likely to have major consequences for the individual and the population as a whole. The New Zealand Ministry of Health has found from research carried out over two decades that 6-10% of children in that country are affected by hearing loss.',
    },
    {
      label: 'B',
      content:
        "A preliminary study in New Zealand has shown that classroom noise presents a major concern for teachers and pupils. Modern teaching practices, the organisation of desks in the classroom, poor classroom acoustics, and mechanical means of ventilation such as air-conditioning units all contribute to the number of children unable to comprehend the teacher's voice. Education researchers Nelson and Soli have also suggested that recent trends in learning often involve collaborative interaction of multiple minds and tools as much as individual possession of information. This all amounts to heightened activity and noise levels, which have the potential to be particularly serious for children experiencing auditory function deficit. Noise in classrooms can only exacerbate their difficulty in comprehending and processing verbal communication with other children and instructions from the teacher.",
    },
    {
      label: 'C',
      content:
        'Children with auditory function deficit are potentially failing to learn to their maximum potential because of noise levels generated in classrooms. The effects of noise on the ability of children to learn effectively in typical classroom environments are now the subject of increasing concern. The International Institute of Noise Control Engineering (I-INCE), on the advice of the World Health Organization, has established an international working party, which includes New Zealand, to evaluate noise and reverberation control for school rooms.',
    },
    {
      label: 'D',
      content:
        'While the detrimental effects of noise in classroom situations are not limited to children experiencing disability, those with a disability that affects their processing of speech and verbal communication could be extremely vulnerable. The auditory function deficits in question include hearing impairment, autistic spectrum disorders (ASD) and attention deficit disorders (ADD/ADHD).',
    },
    {
      label: 'E',
      content:
        'Autism is considered a neurological and genetic life-long disorder that causes discrepancies in the way information is processed. This disorder is characterised by interlinking problems with social imagination, social communication and social interaction. According to Janzen, this affects the ability to understand and relate in typical ways to people, understand events and objects in the environment, and understand or respond to sensory stimuli. Autism does not allow learning or thinking in the same ways as in children who are developing normally. Autistic spectrum disorders often result in major difficulties in comprehending verbal information and speech processing. Those experiencing these disorders often find sounds such as crowd noise and the noise generated by machinery painful and distressing. This is difficult to scientifically quantify as such extra-sensory stimuli vary greatly from one autistic individual to another. But a child who finds any type of noise in their classroom or learning space intrusive is likely to be adversely affected in their ability to process information.',
    },
    {
      label: 'F',
      content:
        'The attention deficit disorders are indicative of neurological and genetic disorders and are characterised by difficulties with sustaining attention, effort and persistence, organisation skills and disinhibition. Children experiencing these disorders find it difficult to screen out unimportant information, and focus on everything in the environment rather than attending to a single activity. Background noise in the classroom becomes a major distraction, which can affect their ability to concentrate.',
    },
    {
      label: 'G',
      content:
        "Children experiencing an auditory function deficit can often find speech and communication very difficult to isolate and process when set against high levels of background noise. These levels come from outside activities that penetrate the classroom structure, from teaching activities, and other noise generated inside, which can be exacerbated by room reverberation. Strategies are needed to obtain the optimum classroom construction and perhaps a change in classroom culture and methods of teaching. In particular, the effects of noisy classrooms and activities on those experiencing disabilities in the form of auditory function deficit need thorough investigation. It is probable that many undiagnosed children exist in the education system with 'invisible' disabilities. Their needs are less likely to be met than those of children with known disabilities.",
    },
    {
      label: 'H',
      content:
        "The New Zealand Government has developed a New Zealand Disability Strategy and has embarked on a wide-ranging consultation process. The strategy recognises that people experiencing disability face significant barriers in achieving a full quality of life in areas such as attitude, education, employment and access to services. Objective 3 of the New Zealand Disability Strategy is to 'Provide the Best Education for Disabled People' by improving education so that all children, youth learners and adult learners will have equal opportunities to learn and develop within their already existing local school. For a successful education, the learning environment is vitally significant, so any effort to improve this is likely to be of great benefit to all children, but especially to those with auditory function disabilities.",
    },
    {
      label: 'I',
      content:
        'A number of countries are already in the process of formulating their own standards for the control and reduction of classroom noise. New Zealand will probably follow their example. The literature to date on noise in school rooms appears to focus on the effects on schoolchildren in general, their teachers and the hearing impaired. Only limited attention appears to have been given to those students experiencing the other disabilities involving auditory function deficit. It is imperative that the needs of these children are taken into account in the setting of appropriate international standards to be promulgated in future.',
    },
  ],
  questions: day4Questions,
}

const day5Section: Section = {
  id: 'day5-venus-transit-p2',
  title: 'Day 5 Passage 2: Venus in Transit',
  paragraphs: [
    {
      label: 'A',
      content:
        "On 8 June 2004, more than half the population of the world were treated to a rare astronomical event. For over six hours, the planet Venus steadily inched its way over the surface of the Sun. This 'transit' of Venus was the first since 6 December 1882. On that occasion, the American astronomer Professor Simon Newcomb led a party to South Africa to observe the event. They were based at a girls' school, where - it is alleged - the combined forces of three schoolmistresses outperformed the professionals with the accuracy of their observations.",
    },
    {
      label: 'B',
      content:
        "For centuries, transits of Venus have drawn explorers and astronomers alike to the four corners of the globe. And you can put it all down to the extraordinary polymath Edmond Halley. In November 1677, Halley observed a transit of the innermost planet, Mercury, from the desolate island of St Helena in the south Pacific. He realized that, from different latitudes, the passage of the planet across the Sun's disc would appear to differ. By timing the transit from two widely-separated locations, teams of astronomers could calculate the parallax angle - the apparent difference in position of an astronomical body due to a difference in the observer's position. Calculating this angle would allow astronomers to measure what was then the ultimate goal: the distance of the Earth from the Sun. This distance is known as the astronomical unit (AU).",
    },
    {
      label: 'C',
      content:
        "Halley was aware that the AU was one of the most fundamental of all astronomical measurements. Johannes Kepler, in the early 17th century, had shown that the distances of the planets from the Sun governed their orbital speeds, which were easily measurable. But no-one had found a way to calculate accurate distances to the planets from the Earth. The goal was to measure the AU; then, knowing the orbital speeds of all the other planets round the Sun, the scale of the Solar System would fall into place. However, Halley realised that Mercury was so far away that its parallax angle would be very difficult to determine. As Venus was closer to the Earth, its parallax angle would be larger, and Halley worked out that by using Venus it would be possible to measure the Sun's distance to 1 part in 500. But there was a problem: transits of Venus, unlike those of Mercury, are rare, occurring in pairs roughly eight years apart every hundred or so years. Nevertheless, he accurately predicted that Venus would cross the face of the Sun in both 1761 and 1769 - though he didn't survive to see either.",
    },
    {
      label: 'D',
      content:
        "Inspired by Halley's suggestion of a way to pin down the scale of the Solar System, teams of British and French astronomers set out on expeditions to places as diverse as India and Siberia. But things weren't helped by Britain and France being at war. The person who deserves most sympathy is the French astronomer Guillaume Le Gentil. He was thwarted by the fact that the British were besieging his observation site at Pondicherry in India. Fleeing on a French warship crossing the Indian Ocean, Le Gentil saw a wonderful transit - but the ship's pitching and rolling ruled out any attempt at making accurate observations. Undaunted, he remained south of the equator, keeping himself busy by studying the islands of Mauritius and Madagascar before setting off to observe the next transit in the Philippines. Ironically, after travelling nearly 50,000 kilometres, his view was clouded out at the last moment, a very dispiriting experience.",
    },
    {
      label: 'E',
      content:
        "While the early transit timings were as precise as instruments would allow, the measurements were dogged by the 'black drop' effect. When Venus begins to cross the Sun's disc, it looks smeared, not circular - which makes it difficult to establish timings. This is due to diffraction of light. The second problem is that Venus exhibits a halo of light when it is seen just outside the Sun's disc. While this showed astronomers that Venus was surrounded by a thick layer of gases refracting sunlight around it, both effects made it impossible to obtain accurate timings.",
    },
    {
      label: 'F',
      content:
        "But astronomers laboured hard to analyse the results of these expeditions to observe Venus transits. Johann Franz Encke, Director of the Berlin Observatory, finally determined a value for the AU based on all these parallax measurements: 153,340,000km. Reasonably accurate for the time, that is quite close to today's value of 149,597,870km. The AU is a cosmic measuring rod, and the basis of how we scale the Universe today. The parallax principle can be extended to measure the distances to the stars. If we look at a star in January - when Earth is at one point in its orbit - it will seem to be in a different position from where it appears six months later. Knowing the width of Earth's orbit, the parallax shift lets astronomers calculate the distance.",
    },
    {
      label: 'G',
      content:
        "June 2004's transit of Venus was thus more of an astronomical spectacle than a scientifically important event. But such transits have paved the way for what might prove to be one of the most vital breakthroughs in the cosmos - detecting Earth-sized planets orbiting other stars.",
    },
  ],
  questions: day5Questions,
}

const day6Section: Section = {
  id: 'day6-neuroscientist-p3',
  title: 'Day 6 Passage 3: A Neuroscientist Reveals How to Think Differently',
  paragraphs: [
    {
      label: 'A',
      content:
        "In the last decade a revolution has occurred in the way that scientists think about the brain. We now know that the decisions humans make can be traced to the firing patterns of neurons in specific parts of the brain. These discoveries have led to the field known as neuroeconomics, which studies the brain's secrets to success in an economic environment that demands innovation and being able to do things differently from competitors. A brain that can do this is an iconoclastic one. Briefly, an iconoclast is a person who does something that others say can't be done.",
    },
    {
      label: 'B',
      content:
        "This definition implies that iconoclasts are different from other people, but more precisely, it is their brains that are different in three distinct ways: perception, fear response, and social intelligence. Each of these three functions utilizes a different circuit in the brain. Naysayers might suggest that the brain is irrelevant, that thinking in an original, even revolutionary, way is more a matter of personality than brain function. But the field of neuroeconomics was born out of the realization that the physical workings of the brain place limitations on the way we make decisions. By understanding these constraints, we begin to understand why some people march to a different drumbeat.",
    },
    {
      label: 'C',
      content:
        'The first thing to realize is that the brain suffers from limited resources. It has a fixed energy budget, about the same as a 40 watt light bulb, so it has evolved to work as efficiently as possible. This is where most people are impeded from being an iconoclast. For example, when confronted with information streaming from the eyes, the brain will interpret this information in the quickest way possible. Thus it will draw on both past experience and any other source of information, such as what other people say, to make sense of what it is seeing. This happens all the time. The brain takes shortcuts that work so well we are hardly ever aware of them. We think our perceptions of the world are real, but they are only biological and electrical rumblings. Perception is not simply a product of what your eyes or ears transmit to your brain. More than the physical reality of photons or sound waves, perception is a product of the brain.',
    },
    {
      label: 'D',
      content:
        "Perception is central to iconoclasm. Iconoclasts see things differently to other people. Their brains do not fall into efficiency pitfalls as much as the average person's brain. Iconoclasts, either because they were born that way or through learning, have found ways to work around the perceptual shortcuts that plague most people. Perception is not something that is hardwired into the brain. It is a learned process, which is both a curse and an opportunity for change. The brain faces the fundamental problem of interpreting physical stimuli from the senses. Everything the brain sees, hears, or touches has multiple interpretations. The one that is ultimately chosen is simply the brain's best theory. In technical terms, these conjectures have their basis in the statistical likelihood of one interpretation over another and are heavily influenced by past experience and, importantly for potential iconoclasts, what other people say.",
    },
    {
      label: 'E',
      content:
        'The best way to see things differently to other people is to bombard the brain with things it has never encountered before. Novelty releases the perceptual process from the chains of past experience and forces the brain to make new judgments. Successful iconoclasts have an extraordinary willingness to be exposed to what is fresh and different. Observation of iconoclasts shows that they embrace novelty while most people avoid things that are different.',
    },
    {
      label: 'F',
      content:
        "The problem with novelty, however, is that it tends to trigger the brain's fear system. Fear is a major impediment to thinking like an iconoclast and stops the average person in his tracks. There are many types of fear, but the two that inhibit iconoclastic thinking and people generally find difficult to deal with are fear of uncertainty and fear of public ridicule. These may seem like trivial phobias. But fear of public speaking, which everyone must do from time to time, afflicts one-third of the population. This makes it too common to be considered a mental disorder. It is simply a common variant of human nature, one which iconoclasts do not let inhibit their reactions.",
    },
    {
      label: 'G',
      content:
        'Finally, to be successful iconoclasts, individuals must sell their ideas to other people.',
    },
    {
      label: 'H',
      content:
        "This is where social intelligence comes in. Social intelligence is the ability to understand and manage people in a business setting. In the last decade there has been an explosion of knowledge about the social brain and how the brain works when groups coordinate decision making. Neuroscience has revealed which brain circuits are responsible for functions like understanding what other people think, empathy, fairness, and social identity. These brain regions play key roles in whether people convince others of their ideas. Perception is important in social cognition too. The perception of someone's enthusiasm, or reputation, can make or break a deal. Understanding how perception becomes intertwined with social decision making shows why successful iconoclasts are so rare.",
    },
    {
      label: 'I',
      content:
        "Iconoclasts create new opportunities in every area from artistic expression to technology to business. They supply creativity and innovation not easily accomplished by committees. Rules aren't important to them. Iconoclasts face alienation and failure, but can also be a major asset to any organization. It is crucial for success in any field to understand how the iconoclastic mind works.",
    },
  ],
  questions: day6Questions,
}

export const readingDaySections: Record<number, Section> = {
  1: day1Section,
  2: day2Section,
  3: day3Section,
  4: day4Section,
  5: day5Section,
  6: day6Section,
  ...readingDaySectionsExtra,
  ...readingDaySectionsDay26To29,
}
