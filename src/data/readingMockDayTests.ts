import type { IELTSTest, Question, Section } from '@/types/ieltsTypes'
import importedContent from './readingMockDaysContent.json'

type MockContent = {
  title: string
  showParagraphLabels: boolean
  paragraphs: Array<{ label: string; content: string }>
}

const content = importedContent as Record<string, MockContent>

const q = (
  id: string,
  number: number,
  type: Question['type'],
  text: string,
  correctAnswer: Question['correctAnswer'],
  extra: Partial<Question> = {},
): Question => ({ id, number, type, text, correctAnswer, ...extra })

const headingOptions = (...items: string[]) => items
const letteredOptions = (...items: string[]) => items.map((item, index) => `${String.fromCharCode(65 + index)}. ${item}`)

function section(
  day: 10 | 20 | 30,
  passage: 1 | 2 | 3,
  sourceKey: string,
  questions: Question[],
): Section {
  const source = content[sourceKey]
  return {
    id: `reading-day-${day}-passage-${passage}`,
    title: `Reading Passage ${passage}: ${source.title}`,
    paragraphs: source.paragraphs,
    showParagraphLabels: source.showParagraphLabels,
    premiumQuestionGroups: true,
    questions,
  }
}

const eTrainingHeadings = headingOptions(
  'i. Overview of the benefits of applying e-training',
  "ii. IBM's successful choice of training",
  'iii. Future directions and a new style of teaching',
  "iv. Learners' achievement and advanced teaching materials",
  'v. Limitations of e-training compared with traditional classes',
  'vi. Multimedia over the Internet can be a solution',
  'vii. Technology can be a huge financial burden',
  'viii. Distance learners outperformed traditional university learners worldwide',
  'ix. Other advantages besides economic considerations',
  'x. Training offered to help people learn using computers',
)

const eTrainingQuestions: Question[] = [
  ...(['i', 'ix', 'iv', 'vii', 'v', 'iii'] as const).map((answer, index) =>
    q(`day10-etraining-q${index + 1}`, index + 1, 'matching-headings', `Paragraph ${String.fromCharCode(65 + index)}`, answer, {
      groupTitle: 'Questions 1-6',
      instruction: 'Choose the correct heading for paragraphs A-F from the list below.',
      options: eTrainingHeadings,
      location: `Paragraph ${String.fromCharCode(65 + index)}`,
    }),
  ),
  ...[
    ['The Basic Blue project at IBM achieved great success.', 'A'],
    ['E-learning became a priority for many corporations because of its flexibility.', 'B'],
    ['A combination of traditional and e-training environments may become prevalent.', 'F'],
    ["An example of fast electronic delivery of a company's products to its customers.", 'D'],
  ].map(([text, answer], index) =>
    q(`day10-etraining-q${index + 7}`, index + 7, 'matching-information', text, answer, {
      groupTitle: 'Questions 7-10',
      instruction: 'Which paragraph contains the following information? You may use any letter more than once.',
      options: letteredOptions('Paragraph A', 'Paragraph B', 'Paragraph C', 'Paragraph D', 'Paragraph E', 'Paragraph F'),
      location: `Paragraph ${answer}`,
    }),
  ),
  q('day10-etraining-q11', 11, 'five-true-statements', 'Which THREE limitations of e-training are mentioned in the passage?', ['B', 'C', 'E'], {
    groupTitle: 'Questions 11-13',
    instruction: 'Choose THREE letters, A-E.',
    options: letteredOptions(
      'Technical facilities are difficult to obtain.',
      'Presenting multimedia over the Internet is restricted by bandwidth limits.',
      'It is ineffective for imparting a unique corporate culture to new employees.',
      'Employees must spend a long time away from their jobs to attend training.',
      'More preparation time is needed to keep a course at a suitable level.',
    ),
    location: 'Paragraph E',
  }),
]

const insectHeadings = headingOptions(
  'i. The effect of man-made imitations on insects',
  'ii. The need to instruct additional insect guides',
  'iii. Signals used by certain insects to indicate a discovery',
  'iv. How urgency can affect the process of finding a new home',
  'v. The use of trained insects in testing scientific theories',
  'vi. The use of virtual scenarios in the study of insect behaviour',
  'vii. How the number of decision-makers affects the decision',
)

const insectQuestions: Question[] = [
  ...(['vii', 'iii', 'vi', 'i', 'iv', 'ii'] as const).map((answer, index) =>
    q(`day10-insects-q${index + 14}`, index + 14, 'matching-headings', `Paragraph ${String.fromCharCode(65 + index)}`, answer, {
      groupTitle: 'Questions 14-19',
      instruction: 'Choose the correct heading for each paragraph from the list below.',
      options: insectHeadings,
      location: `Paragraph ${String.fromCharCode(65 + index)}`,
    }),
  ),
  ...[
    ['Certain members can influence the rest of the group to alter a previous decision.', 'C'],
    ['Individual verification of a proposed choice is important for a successful decision.', 'B'],
    ['The more individuals taking part in a decision, the better the decision will be.', 'A'],
    ['The decision-making process of certain insects produces excellent results even when fine distinctions are required.', 'B'],
  ].map(([text, answer], index) =>
    q(`day10-insects-q${index + 20}`, index + 20, 'matching-information', text, answer, {
      groupTitle: 'Questions 20-23',
      instruction: 'Match each finding with the correct academic, A-D. You may use any letter more than once.',
      options: letteredOptions('Nicolas de Condorcet', 'Christian List and colleagues', 'José Halloy', 'Nigel Franks and colleagues'),
    }),
  ),
  q('day10-insects-q24', 24, 'summary-completion', "A Bristol University study examined how insects make decisions when their home has been ______.", 'threatened', {
    groupTitle: 'Questions 24-26', instruction: 'Complete the summary. Choose ONE WORD ONLY from the passage.', location: 'Paragraph E',
  }),
  q('day10-insects-q25', 25, 'summary-completion', 'The ants relied on individuals called ______ to find a new nest and direct the others.', 'scouts', { location: 'Paragraph E' }),
  q('day10-insects-q26', 26, 'summary-completion', 'The study emphasised the need for active ______ to execute decisions successfully.', 'leaders', { location: 'Paragraph F' }),
]

const intelligenceSummaryOptions = letteredOptions('adult', 'practical', 'verbal', 'spatial', 'inquisitive', 'uncertain', 'academic', 'plentiful', 'unfamiliar')
const intelligenceQuestions: Question[] = [
  q('day10-intelligence-q27', 27, 'multiple-choice', 'Most researchers accept that one feature of intelligence is the ability to', 'A', {
    groupTitle: 'Questions 27-30', instruction: 'Choose the correct letter, A, B, C or D.',
    options: letteredOptions('change our behaviour according to our situation.', "react to others' behaviour patterns.", 'experiment with environmental features.', 'cope with unexpected setbacks.'), location: 'Paragraph A',
  }),
  q('day10-intelligence-q28', 28, 'multiple-choice', 'What have psychometricians used statistics for?', 'B', {
    options: letteredOptions('to find out if cooperative tasks are useful for measuring certain skills', 'to explore whether several abilities are involved in intelligence', 'to show that mathematical models can predict results for different skills', "to discover whether common sense is fundamental to children's abilities"), location: 'Paragraph B',
  }),
  q('day10-intelligence-q29', 29, 'multiple-choice', 'Why are Horn and Cattell mentioned?', 'D', {
    options: letteredOptions('They disagreed about different intelligence tests.', 'Their research concerned linguistic and mathematical abilities.', 'They first proved intelligence can be measured through special skills.', "Their work exemplified research into how cognitive skills vary with age."), location: 'Paragraph C',
  }),
  q('day10-intelligence-q30', 30, 'multiple-choice', "What was innovative about Piaget's research?", 'B', {
    options: letteredOptions('He rejected the idea that children develop in a set pattern.', 'He emphasised how children thought rather than how well they performed.', 'He used visually appealing materials instead of traditional tests.', 'He studied children of all ages and intelligence levels.'), location: 'Paragraph E',
  }),
  ...[
    ['A surprising number of academics have reached the same conclusion about what intelligence means.', 'NO', 'A'],
    ['A general intelligence test is unlikely to indicate performance in every type of task.', 'YES', 'B'],
    ['Older people perform less well on comprehension tests than young adults.', 'NO', 'C'],
    ['We must consider which skills are tested when comparing intelligence at different ages.', 'YES', 'D'],
    ["Piaget's work influenced theoretical studies more than practical research.", 'NOT GIVEN', 'E'],
    ["Piaget's emphasis on active learning has been discredited by later researchers.", 'NO', 'F'],
  ].map(([text, answer, paragraph], index) =>
    q(`day10-intelligence-q${index + 31}`, index + 31, 'yes-no-not-given', text, answer, {
      groupTitle: 'Questions 31-36',
      instruction: 'Choose YES if the statement agrees with the claims, NO if it contradicts them, or NOT GIVEN if there is no information.',
      location: `Paragraph ${paragraph}`,
    }),
  ),
  q('day10-intelligence-q37', 37, 'matching-information', '______ skills become more significant with age.', 'C', {
    groupTitle: 'Questions 37-40', instruction: 'Complete the summary using the list of words, A-I.', options: intelligenceSummaryOptions, location: 'Paragraph D',
  }),
  q('day10-intelligence-q38', 38, 'matching-information', 'One good predictor of ______ intelligence is how young children respond to novelty.', 'A', { options: intelligenceSummaryOptions, location: 'Paragraph D' }),
  q('day10-intelligence-q39', 39, 'matching-information', 'Young children should be ______ about their surroundings.', 'E', { options: intelligenceSummaryOptions, location: 'Paragraph D' }),
  q('day10-intelligence-q40', 40, 'matching-information', 'They should show interest when they encounter an ______ setting.', 'I', { options: intelligenceSummaryOptions, location: 'Paragraph D' }),
]

const katherineQuestions: Question[] = [
  ...[
    ["The name Katherine Mansfield printed on the writer's books was exactly the same as her original name.", 'FALSE', 'Paragraph 1'],
    ['Mansfield won a prize for a story she wrote for the High School Reporter.', 'NOT GIVEN', 'Paragraph 2'],
    ['How Pearl Button Was Kidnapped portrayed Māori people favourably.', 'TRUE', 'Paragraph 2'],
    ["While at Queen's College, Mansfield planned to become a professional writer.", 'FALSE', 'Paragraph 3'],
    ["Mansfield was unpopular with the other students at Queen's College.", 'FALSE', 'Paragraph 3'],
    ['In London, Mansfield showed little interest in politics.', 'NOT GIVEN', 'Paragraph 3'],
  ].map(([text, answer, location], index) =>
    q(`day20-katherine-q${index + 1}`, index + 1, 'true-false-not-given', text, answer, {
      groupTitle: 'Questions 1-6', instruction: 'Choose TRUE, FALSE or NOT GIVEN.', location,
    }),
  ),
  ...[
    ['In ______, Mansfield moved from England back to New Zealand.', '1906', 'Paragraph 4'],
    ['Her first paid writing work appeared in a publication based in ______.', 'Australia', 'Paragraph 4'],
    ['Her ______ and the New Zealand way of life made her feel dissatisfied.', 'family', 'Paragraph 5'],
    ['______ prevented Mansfield and Murry from remaining together in Paris.', 'bankruptcy', 'Paragraph 6'],
    ['She spent time with distinguished ______.', 'writers', 'Paragraph 7'],
    ['Her ______ was consolidated when Bliss and Other Stories was published.', 'reputation', 'Paragraph 7'],
    ["Mansfield's ______ published more of her work after her death.", 'husband', 'Paragraph 9'],
  ].map(([text, answer, location], index) =>
    q(`day20-katherine-q${index + 7}`, index + 7, 'note-completion', text, answer, {
      groupTitle: 'Questions 7-13', instruction: 'Complete the notes. Choose ONE WORD AND/OR A NUMBER from the passage.', location,
    }),
  ),
]

const undergroundPeople = letteredOptions('Scott Klara', 'Intergovernmental Panel on Climate Change', 'International Energy Agency', 'Klaus Lackner', 'David Hawkins', 'World Wide Fund for Nature Australia')
const undergroundQuestions: Question[] = [
  ...[
    ['The cost implications of fitting plants with the necessary equipment.', 'D'],
    ['The effects sequestration could have on sea creatures.', 'E'],
    ['Why products such as oil and gas remain popular energy sources.', 'D'],
    ['The need for industrialised countries to assist less wealthy countries.', 'E'],
    ['The significant rise in atmospheric carbon dioxide over the last century.', 'A'],
    ['The potential for sequestration to harm human life.', 'F'],
  ].map(([text, answer], index) =>
    q(`day20-underground-q${index + 14}`, index + 14, 'matching-information', text, answer, {
      groupTitle: 'Questions 14-19', instruction: 'Match each issue with the correct person or organisation, A-F. You may use any letter more than once.', options: undergroundPeople,
    }),
  ),
  ...[
    ['Examples of sequestration already in use in different parts of the world.', 'H'],
    ['An example of carbon dioxide emissions being used in the food and beverage industry.', 'F'],
    ['Examples of environmental harm currently attributed to airborne carbon dioxide.', 'C'],
  ].map(([text, answer], index) =>
    q(`day20-underground-q${index + 20}`, index + 20, 'matching-information', text, answer, {
      groupTitle: 'Questions 20-22', instruction: 'Which paragraph contains the following information?', options: letteredOptions(...'ABCDEFGHIJ'.split('').map((letter) => `Paragraph ${letter}`)), location: `Paragraph ${answer}`,
    }),
  ),
  ...[
    ['Both developing and developed nations have agreed to investigate carbon dioxide sequestration.', 'TRUE', 'B'],
    ['A growing economy will use more power.', 'TRUE', 'D'],
    ['Capturing carbon dioxide has become financially attractive.', 'FALSE', 'F'],
    ['More forests need to be planted to improve the atmosphere.', 'NOT GIVEN', 'G'],
  ].map(([text, answer, paragraph], index) =>
    q(`day20-underground-q${index + 23}`, index + 23, 'true-false-not-given', text, answer, {
      groupTitle: 'Questions 23-26', instruction: 'Choose TRUE, FALSE or NOT GIVEN.', location: `Paragraph ${paragraph}`,
    }),
  ),
]

const willpowerQuestions: Question[] = [
  ...[
    ['Willpower is the most significant factor in determining success in life.', 'TRUE', 'A'],
    ['People with more free time typically have stronger willpower.', 'FALSE', 'A'],
    ['Willpower mostly applies to matters of diet and exercise.', 'FALSE', 'B'],
    ['The strongest indicator of willpower is choosing long-term rather than short-term rewards.', 'TRUE', 'B'],
    ['Researchers have established the genetic basis of willpower.', 'NOT GIVEN', 'C'],
    ['Levels of willpower usually remain consistent throughout our lives.', 'TRUE', 'C'],
    ['Regular physical exercise improves our capacity for willpower.', 'NOT GIVEN', 'C'],
  ].map(([text, answer, paragraph], index) =>
    q(`day20-willpower-q${index + 27}`, index + 27, 'true-false-not-given', text, answer, {
      groupTitle: 'Questions 27-33', instruction: 'Choose TRUE, FALSE or NOT GIVEN.', location: `Paragraph ${paragraph}`,
    }),
  ),
  ...[
    ['identified a key factor necessary for willpower to function.', 'E'],
    ['suggested that willpower is affected by our beliefs.', 'D'],
    ['examined how the body responds to the use of willpower.', 'A'],
    ['discovered the importance of making and tracking goals.', 'C'],
    ['found that taking action to please others decreases willpower.', 'C'],
    ['found that willpower can increase through simple positive thoughts.', 'B'],
  ].map(([text, answer], index) =>
    q(`day20-willpower-q${index + 34}`, index + 34, 'matching-information', `This researcher ${text}`, answer, {
      groupTitle: 'Questions 34-39', instruction: 'Match each statement with the correct researcher, A-E.',
      options: letteredOptions('Matthew Gailliot', 'Gregory M. Walton', 'Mark Muraven', 'Veronika Job', 'Roy Baumeister'),
    }),
  ),
  q('day20-willpower-q40', 40, 'multiple-choice', 'Which factor affecting willpower is NOT mentioned?', 'C', {
    groupTitle: 'Question 40', instruction: 'Choose the correct letter, A, B, C or D.',
    options: letteredOptions('physical factors such as tiredness', 'our basic ability to delay gratification', 'levels of particular chemicals in the brain', 'environmental cues such as the availability of a trigger'),
  }),
]

const longLifeQuestions: Question[] = [
  ...[
    ['The greatest growth in the global centenarian population is in the UK.', 'NOT GIVEN', 'Paragraph 1'],
    ['Fewer families today are caring for their elderly members.', 'NOT GIVEN', 'Paragraph 2'],
    ['People who live beyond 90 are likely to be in good health.', 'TRUE', 'Paragraph 3'],
    ['Centenarians tend to be in better physical health than supercentenarians.', 'FALSE', 'Paragraph 3'],
    ["None of the oldest survivors in Christensen's study could care for themselves.", 'FALSE', 'Paragraph 4'],
    ["Research from Cambridge and China conflicted with Christensen's findings in Denmark.", 'FALSE', 'Paragraph 5'],
    ['Centenarians may feel more isolated than people a generation younger.', 'NOT GIVEN', 'Paragraph 5'],
  ].map(([text, answer, location], index) =>
    q(`day30-longevity-q${index + 1}`, index + 1, 'true-false-not-given', text, answer, {
      groupTitle: 'Questions 1-7', instruction: 'Choose TRUE, FALSE or NOT GIVEN.', location,
    }),
  ),
  ...[
    ['What term did Jessica Evert use for centenarians who reach 100 without serious disease?', 'escapers', 'Paragraph 6'],
    ['What factor is most likely to contribute to longevity in men?', 'genetics', 'Paragraph 6'],
    ['Which place has the largest proportion of centenarians in the world?', 'Okinawa', 'Paragraph 7'],
    ['According to gerontologists, what should people not neglect if they wish to reach old age?', 'exercise', 'Paragraph 7'],
    ['Which social influence on longevity decreases as people age?', 'wealth', 'Paragraph 7'],
    ['In which organisms, apart from humans, have longevity genes been reliably identified?', 'worms', 'Paragraph 8'],
  ].map(([text, answer, location], index) =>
    q(`day30-longevity-q${index + 8}`, index + 8, 'short-answer', text, answer, {
      groupTitle: 'Questions 8-13', instruction: 'Answer the questions. Choose ONE WORD ONLY from the passage.', location,
    }),
  ),
]

const mindMusicQuestions: Question[] = [
  ...[
    ['A description of characteristics common to songs that become earworms.', 'G'],
    ['A justification for conducting research into earworms.', 'A'],
    ["A description of the brain's response to familiar and unfamiliar songs.", 'F'],
    ['Details of proposed research into how often different age groups experience earworms.', 'H'],
  ].map(([text, answer], index) =>
    q(`day30-mindmusic-q${index + 14}`, index + 14, 'matching-information', text, answer, {
      groupTitle: 'Questions 14-17', instruction: 'Which paragraph contains the following information?', options: letteredOptions(...'ABCDEFGH'.split('').map((letter) => `Paragraph ${letter}`)), location: `Paragraph ${answer}`,
    }),
  ),
  ...[
    ['Volunteers recorded the rhythm of imagined music using a monitor on their ______.', 'wrist', 'B'],
    ['People who hear earworms frequently may process ______ differently.', 'emotions', 'B'],
    ['Dr Stewart believes the brain is kept ______ by earworms when it is not focused on a task.', 'unoccupied', 'C'],
    ['Earworms occurred less often as a task became more ______.', 'challenging', 'C'],
  ].map(([text, answer, paragraph], index) =>
    q(`day30-mindmusic-q${index + 18}`, index + 18, 'summary-completion', text, answer, {
      groupTitle: 'Questions 18-21', instruction: 'Complete the summary. Choose ONE WORD ONLY from the passage.', location: `Paragraph ${paragraph}`,
    }),
  ),
  ...[
    ['Some musicians deliberately create music that is easy to remember.', 'D'],
    ['People cannot completely regulate their own thought processes.', 'A'],
    ['We can remember songs without realising that we have heard them.', 'B'],
    ['Imagining music affects the brain in a similar way to hearing it.', 'C'],
    ['Earworms persist when only a short section of a song is replayed repeatedly.', 'B'],
  ].map(([text, answer], index) =>
    q(`day30-mindmusic-q${index + 22}`, index + 22, 'matching-information', text, answer, {
      groupTitle: 'Questions 22-26', instruction: 'Match each statement with the correct researcher, A-D. You may use any letter more than once.',
      options: letteredOptions('Lauren Stewart', 'Ira Hyman', 'Andrea Halpern', 'John Seabrook'),
    }),
  ),
]

const siliconQuestions: Question[] = [
  ...[
    ['Gave a brief history of the established method for manufacturing silicon cells.', 'B'],
    ['Made a joint prediction with a national agency.', 'C'],
    ['Established a company with a meaningful name.', 'A'],
    ['Pioneered ways to reduce cost while raising solar-cell efficiency.', 'A'],
    ['Expects to cut solar-cell costs enough to compete with conventional electricity generation.', 'A'],
  ].map(([text, answer], index) =>
    q(`day30-silicon-q${index + 27}`, index + 27, 'matching-information', text, answer, {
      groupTitle: 'Questions 27-31', instruction: 'Match each statement with the correct person or company, A-C. You may use any letter more than once.',
      options: letteredOptions('Emanuel Sachs', 'Michael Rogol', 'Solarbuzz'),
    }),
  ),
  ...[
    ['The main weakness of single-crystal cells is their high cost.', 'TRUE', 'B'],
    ['Multicrystalline silicon cells are ideal substitutes for single-crystal cells.', 'FALSE', 'B'],
    ['Emanuel Sachs knows exactly how a low-cost copper diffusion barrier should be produced.', 'NOT GIVEN', 'F'],
    ['Demand for solar panels has risen sharply in recent years.', 'TRUE', 'G'],
  ].map(([text, answer, paragraph], index) =>
    q(`day30-silicon-q${index + 32}`, index + 32, 'true-false-not-given', text, answer, {
      groupTitle: 'Questions 32-35', instruction: 'Choose TRUE, FALSE or NOT GIVEN.', location: `Paragraph ${paragraph}`,
    }),
  ),
  ...[
    ['Emanuel Sachs made two major changes to the manufacture of a ______.', 'multi-crystalline silicon cell', 'C'],
    ['One change uses a ______ to produce finer wires.', 'proprietary wet process', 'D'],
    ['The finer wires draw more current from the ______.', 'neighbouring active material|neighboring active material', 'D'],
    ['The other change places ______ on interconnect wires.', 'textured mirror surfaces', 'E'],
    ['These surfaces retain incoming light through ______.', 'total internal reflection', 'E'],
  ].map(([text, answer, paragraph], index) =>
    q(`day30-silicon-q${index + 36}`, index + 36, 'summary-completion', text, answer, {
      groupTitle: 'Questions 36-40', instruction: 'Complete the summary. Choose NO MORE THAN THREE WORDS from the passage.', location: `Paragraph ${paragraph}`,
    }),
  ),
]

export const readingMockDayTests: Record<10 | 20 | 30, IELTSTest> = {
  10: {
    id: 'reading-day-10', title: 'IELTS Reading Day 10 (Mock)', type: 'Academic', module: 'Reading', duration: 60, totalQuestions: 40,
    sections: [section(10, 1, 'day10p1', eTrainingQuestions), section(10, 2, 'day10p2', insectQuestions), section(10, 3, 'day10p3', intelligenceQuestions)],
  },
  20: {
    id: 'reading-day-20', title: 'IELTS Reading Day 20 (Mock)', type: 'Academic', module: 'Reading', duration: 60, totalQuestions: 40,
    sections: [section(20, 1, 'day20p1', katherineQuestions), section(20, 2, 'day20p2', undergroundQuestions), section(20, 3, 'day20p3', willpowerQuestions)],
  },
  30: {
    id: 'reading-day-30', title: 'IELTS Reading Day 30 (Mock)', type: 'Academic', module: 'Reading', duration: 60, totalQuestions: 40,
    sections: [section(30, 1, 'day30p1', longLifeQuestions), section(30, 2, 'day30p2', mindMusicQuestions), section(30, 3, 'day30p3', siliconQuestions)],
  },
}
