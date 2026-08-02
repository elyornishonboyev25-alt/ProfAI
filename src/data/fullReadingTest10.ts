import type { IELTSTest, Section } from '../types/ieltsTypes'

const stepPyramidHeadingOptions = [
  'A. The areas and artefacts within the pyramid itself',
  'B. A difficult task for those involved',
  'C. A king who saved his people',
  'D. A single certainty among other less definite facts',
  'E. An overview of the external buildings and areas',
  'F. A pyramid design that others copied',
  'G. An idea for changing the design of burial structures',
  'H. An incredible experience despite the few remains',
  'I. The answers to some unexpected questions',
]

const futureWorkPeopleOptions = [
  'A. Stella Pachidi',
  'B. Hamish Low',
  'C. Ewan McGaughey',
]

const passage1: Section = {
  id: 'polar-bears-p1-v10',
  title: 'Reading Passage 1: Why we need to protect polar bears',
  paragraphs: [
    {
      label: 'A',
      content:
        'Polar bears are being increasingly threatened by the effects of climate change, but their disappearance could have far-reaching consequences. They are uniquely adapted to the extreme conditions of the Arctic Circle, where temperatures can reach -40C. One reason for this is that they have up to 11 centimetres of fat underneath their skin. Humans with comparative levels of adipose tissue would be considered obese and would be likely to suffer from diabetes and heart disease. Yet the polar bear experiences no such consequences.',
    },
    {
      label: 'B',
      content:
        "A 2014 study by Shi Ping Liu and colleagues sheds light on this mystery. They compared the genetic structure of polar bears with that of their closest relatives from a warmer climate, the brown bears. This allowed them to determine the genes that have allowed polar bears to survive in one of the toughest environments on Earth. Liu and his colleagues found the polar bears had a gene known as APoB, which reduces levels of low-density lipoproteins (LDLs) - a form of bad cholesterol. In humans, mutations of this gene are associated with increased risk of heart disease. Polar bears may therefore be an important study model to understand heart disease in humans.",
    },
    {
      label: 'C',
      content:
        'The genome of the polar bear may also provide the solution for another condition, one that particularly affects our older generation: osteoporosis. This is a disease where bones show reduced density, usually caused by insufficient exercise, reduced calcium intake or food starvation. Bone tissue is constantly being remodelled, meaning that bone is added or removed, depending on nutrient availability and the stress that the bone is under. Female polar bears, however, undergo extreme conditions during every pregnancy. Once autumn comes around, these females will dig maternity dens in the snow and will remain there throughout the winter, both before and after the birth of their cubs. This process results in about six months of fasting, where the female bears have to keep themselves and their cubs alive, depleting their own calcium and calorie reserves. Despite this, their bones remain strong and dense.',
    },
    {
      label: 'D',
      content:
        'Physiologists Alanda Lennox and Allen Goodship found an explanation for this paradox in 2008. They discovered that pregnant bears were able to increase the density of their bones before they started to build their dens. In addition, six months later, when they finally emerged from the den with their cubs, there was no evidence of significant loss of bone density. Hibernating brown bears do not have this capacity and must therefore resort to major bone reformation in the following spring. If the mechanism of bone remodelling in polar bears can be understood, many bedridden humans, and even astronauts, could potentially benefit.',
    },
    {
      label: 'E',
      content:
        'The medical benefits of the polar bear for humanity certainly have their importance in our conservation efforts, but these should not be the only factors taken into consideration. We tend to want to protect animals we think are intelligent and possess emotions, such as elephants and primates. Bears, on the other hand, seem to be perceived as stupid and in many cases violent. And yet anecdotal evidence from the field challenges those assumptions, suggesting for example that polar bears have good problem-solving abilities. A male bear called GoGo in Tennoji Zoo, Osaka, has even been observed making use of a tool to manipulate his environment. The bear used a tree branch on multiple occasions to dislodge a piece of meat hung out of his reach. Problem-solving ability has also been witnessed in wild polar bears, although not as obviously as with Gogo. A calculated move by a male bear involved running and jumping onto barrels in an attempt to get to a photographer standing on a platform four metres high.',
    },
    {
      label: 'F',
      content:
        'In other studies, such as one by Alison Ames in 2008, polar bears showed deliberate and focused manipulation. For example, Ames observed bears putting objects in piles and then knocking them over in what appeared to be a game. The study demonstrates that bears are capable of agile and thought-out behaviours. These examples suggest bears have greater creativity and problem-solving abilities than previously thought.',
    },
    {
      label: 'G',
      content:
        'As for emotions, while the evidence is once again anecdotal, many bears have been seen to hit out at ice and snow - seemingly out of frustration - when they have just missed out on a kill. Moreover, polar bears can form unusual relationships with other species, including playing with the dogs used to pull sleds in the Arctic. Remarkably, one hand-raised polar bear called Agee has formed a close relationship with her owner Mark Dumas to the point where they even swim together. This is even more astonishing since polar bears are known to actively hunt humans in the wild.',
    },
    {
      label: 'H',
      content:
        'If climate change were to lead to their extinction, this would mean not only the loss of potential breakthroughs in human medicine, but more importantly, the disappearance of an intelligent, majestic animal.',
    },
  ],
  questions: [
    {
      id: 'polar-v10-q1',
      number: 1,
      type: 'true-false-not-given',
      groupTitle: 'Questions 1-7',
      instruction:
        'Choose TRUE if the statement agrees with the information in the text, choose FALSE if the statement contradicts the information, or choose NOT GIVEN if there is no information on this.',
      text: 'Polar bears suffer from various health problems due to the build-up of fat under their skin.',
      correctAnswer: 'FALSE',
      location: 'Paragraph A',
    },
    {
      id: 'polar-v10-q2',
      number: 2,
      type: 'true-false-not-given',
      text: 'The study done by Liu and his colleagues compared different groups of polar bears.',
      correctAnswer: 'FALSE',
      location: 'Paragraph B',
    },
    {
      id: 'polar-v10-q3',
      number: 3,
      type: 'true-false-not-given',
      text: 'Liu and colleagues were the first researchers to compare polar bears and brown bears genetically.',
      correctAnswer: 'NOT GIVEN',
      location: 'Paragraph B',
    },
    {
      id: 'polar-v10-q4',
      number: 4,
      type: 'true-false-not-given',
      text: "Polar bears are able to control their levels of bad cholesterol by genetic means.",
      correctAnswer: 'TRUE',
      location: 'Paragraph B',
    },
    {
      id: 'polar-v10-q5',
      number: 5,
      type: 'true-false-not-given',
      text: 'Female polar bears are able to survive for about six months without food.',
      correctAnswer: 'TRUE',
      location: 'Paragraph C',
    },
    {
      id: 'polar-v10-q6',
      number: 6,
      type: 'true-false-not-given',
      text: 'It was found that the bones of female polar bears were very weak when they came out of their dens in spring.',
      correctAnswer: 'FALSE',
      location: 'Paragraph D',
    },
    {
      id: 'polar-v10-q7',
      number: 7,
      type: 'true-false-not-given',
      text: "The polar bear's mechanism for increasing bone density could also be used by people one day.",
      correctAnswer: 'TRUE',
      location: 'Paragraph D',
    },
    {
      id: 'polar-v10-q8',
      number: 8,
      type: 'note-completion',
      groupTitle: 'Questions 8-13',
      instruction: 'Complete the notes below. Choose ONE WORD ONLY from the passage for each answer.',
      text: 'People think of bears as unintelligent and ______.',
      correctAnswer: 'violent',
      location: 'Paragraph E',
    },
    {
      id: 'polar-v10-q9',
      number: 9,
      type: 'note-completion',
      text: 'In Tennoji Zoo, a bear has been seen using a branch as a ______.',
      correctAnswer: 'tool',
      location: 'Paragraph E',
    },
    {
      id: 'polar-v10-q10',
      number: 10,
      type: 'note-completion',
      text: 'This allowed him to knock down some ______.',
      correctAnswer: 'meat',
      location: 'Paragraph E',
    },
    {
      id: 'polar-v10-q11',
      number: 11,
      type: 'note-completion',
      text: 'A wild polar bear worked out a method of reaching a platform where a ______ was located.',
      correctAnswer: 'photographer',
      location: 'Paragraph E',
    },
    {
      id: 'polar-v10-q12',
      number: 12,
      type: 'note-completion',
      text: 'Polar bears have displayed behaviour such as conscious manipulation of objects and activity similar to a ______.',
      correctAnswer: 'game',
      location: 'Paragraph F',
    },
    {
      id: 'polar-v10-q13',
      number: 13,
      type: 'note-completion',
      text: 'They may make movements suggesting ______ if disappointed when hunting.',
      correctAnswer: 'frustration',
      location: 'Paragraph G',
    },
  ],
}

const passage2: Section = {
  id: 'step-pyramid-p2-v10',
  title: 'Reading Passage 2: The Step Pyramid of Djoser',
  paragraphs: [
    {
      label: 'A',
      content:
        "The pyramids are the most famous monuments of ancient Egypt and still hold enormous interest for people in the present day. These grand, impressive tributes to the memory of the Egyptian kings have become linked with the country even though other cultures, such as the Chinese and Mayan, also built pyramids. The evolution of the pyramid form has been written and argued about for centuries. However, there is no question that, as far as Egypt is concerned, it began with one monument to one king designed by one brilliant architect: the Step Pyramid of Djoser at Saqqara.",
    },
    {
      label: 'B',
      content:
        'Djoser was the first king of the Third Dynasty of Egypt and the first to build in stone. Prior to Djosers reign, tombs were rectangular monuments made of dried clay brick, which covered underground passages where the deceased person was buried. For reasons which remain unclear, Djosers main official, whose name was Imhotep, conceived of building a taller, more impressive tomb for his king by stacking stone slabs on top of one another, progressively making them smaller, to form the shape now known as the Step Pyramid. Djoser is thought to have reigned for 19 years, but some historians and scholars attribute a much longer time for his rule, owing to the number and size of the monuments he built.',
    },
    {
      label: 'C',
      content:
        'The Step Pyramid has been thoroughly examined and investigated over the last century, and it is now known that the building process went through many different stages. Historian Marc Van de Mieroop comments on this, writing: Much experimentation was involved, which is especially clear in the construction of the pyramid in the center of the complex. It had several plans before it became the first Step Pyramid in history, piling six levels on top of one another. The weight of the enormous mass was a challenge for the builders, who placed the stones at an inward incline in order to prevent the monument breaking up.',
    },
    {
      label: 'D',
      content:
        'When finally completed, the Step Pyramid rose 62 metres high and was the tallest structure of its time. The complex in which it was built was the size of a city in ancient Egypt and included a temple, courtyards, shrines, and living quarters for the priests. It covered a region of 16 hectares and was surrounded by a wall 10.5 meters high. The wall had 13 false doors cut into it with only one true entrance cut into the south-east corner; the entire wall was then ringed by a trench 750 meters long and 40 meters wide. The false doors and the trench were incorporated into the complex to discourage unwanted visitors. If someone wished to enter, he or she would have needed to know in advance how to find the location of the true opening in the wall. Djoser was so proud of his accomplishment that he broke the tradition of having only his own name on the monument and had Imhoteps name carved on it as well.',
    },
    {
      label: 'E',
      content:
        'The burial chamber of the tomb, where the kings body was laid to rest, was dug beneath the base of the pyramid, surrounded by a vast maze of long tunnels that had rooms off them to discourage robbers. One of the most mysterious discoveries found inside the pyramid was a large number of stone vessels. Over 40,000 of these vessels, of various forms and shapes, were discovered in storerooms off the pyramids underground passages. They are inscribed with the names of rulers from the First and Second Dynasties of Egypt and made from different kinds of stone. There is no agreement among scholars and archaeologists on why the vessels were placed in the tomb of Djoser or what they were supposed to represent. The archaeologist Jean-Philippe Lauer, who excavated most of the pyramid and complex, believes they were originally stored and then given a proper burial by Djoser in his pyramid to honor his predecessors. There are other historians, however, who claim the vessels were dumped into the shafts as yet another attempt to prevent grave robbers from getting to the kings burial chamber.',
    },
    {
      label: 'F',
      content:
        'Unfortunately, all of the precautions and intricate design of the underground network did not prevent ancient robbers from finding a way in. Djosers grave goods, and even his body, were stolen at some point in the past and all archaeologists found were a small number of his valuables overlooked by the thieves. There was enough left throughout the pyramid and its complex, however, to astonish and amaze the archaeologists who excavated it.',
    },
    {
      label: 'G',
      content:
        'Egyptologist Miroslav Verner writes, Few monuments hold a place in human history as significant as that of the Step Pyramid in Saqqara. It can be said without exaggeration that this pyramid complex constitutes a milestone in the evolution of monumental stone architecture in Egypt and in the world as a whole. The Step Pyramid was a revolutionary advance in architecture and became the archetype which all the other great pyramid builders of Egypt would follow.',
    },
  ],
  questions: [
    {
      id: 'step-v10-q14',
      number: 14,
      type: 'matching-headings',
      groupTitle: 'Questions 14-20',
      instruction:
        'Reading Passage 2 has seven paragraphs. Choose the correct heading for each paragraph from the list of headings below.',
      text: 'Paragraph A',
      options: stepPyramidHeadingOptions,
      correctAnswer: 'D',
      location: 'Paragraph A',
    },
    {
      id: 'step-v10-q15',
      number: 15,
      type: 'matching-headings',
      text: 'Paragraph B',
      options: stepPyramidHeadingOptions,
      correctAnswer: 'G',
      location: 'Paragraph B',
    },
    {
      id: 'step-v10-q16',
      number: 16,
      type: 'matching-headings',
      text: 'Paragraph C',
      options: stepPyramidHeadingOptions,
      correctAnswer: 'B',
      location: 'Paragraph C',
    },
    {
      id: 'step-v10-q17',
      number: 17,
      type: 'matching-headings',
      text: 'Paragraph D',
      options: stepPyramidHeadingOptions,
      correctAnswer: 'E',
      location: 'Paragraph D',
    },
    {
      id: 'step-v10-q18',
      number: 18,
      type: 'matching-headings',
      text: 'Paragraph E',
      options: stepPyramidHeadingOptions,
      correctAnswer: 'A',
      location: 'Paragraph E',
    },
    {
      id: 'step-v10-q19',
      number: 19,
      type: 'matching-headings',
      text: 'Paragraph F',
      options: stepPyramidHeadingOptions,
      correctAnswer: 'H',
      location: 'Paragraph F',
    },
    {
      id: 'step-v10-q20',
      number: 20,
      type: 'matching-headings',
      text: 'Paragraph G',
      options: stepPyramidHeadingOptions,
      correctAnswer: 'F',
      location: 'Paragraph G',
    },
    {
      id: 'step-v10-q21',
      number: 21,
      type: 'note-completion',
      groupTitle: 'Questions 21-24',
      instruction: 'Complete the notes below. Choose ONE WORD ONLY from the passage for each answer.',
      text: 'The complex that includes the Step Pyramid and its surroundings is considered to be as big as an Egyptian ______ of the past.',
      correctAnswer: 'city',
      location: 'Paragraph D',
    },
    {
      id: 'step-v10-q22',
      number: 22,
      type: 'note-completion',
      text: 'The area outside the pyramid included accommodation that was occupied by ______.',
      correctAnswer: 'priests',
      location: 'Paragraph D',
    },
    {
      id: 'step-v10-q23',
      number: 23,
      type: 'note-completion',
      text: 'In addition, a long ______ encircled the wall.',
      correctAnswer: 'trench',
      location: 'Paragraph D',
    },
    {
      id: 'step-v10-q24',
      number: 24,
      type: 'note-completion',
      text: 'As a result, any visitors who had not been invited were prevented from entering unless they knew the ______ of the real entrance.',
      correctAnswer: 'location',
      location: 'Paragraph D',
    },
    {
      id: 'step-v10-q25',
      number: 25,
      type: 'five-true-statements',
      groupTitle: 'Questions 25-26',
      instruction: 'Choose TWO correct answers.',
      text: 'Which TWO of the following points does the writer make about King Djoser?',
      options: [
        'A. initially he had to be persuaded to build in stone rather than clay.',
        'B. There is disagreement concerning the length of his reign.',
        "C. He failed to appreciate Imhotep's part in the design of the Step Pyramid.",
        'D. A few of his possessions were still in his tomb when archaeologists found it.',
        'E. He criticised the design and construction of other pyramids in Egypt.',
      ],
      correctAnswer: ['B', 'D'],
      location: 'Paragraphs B and F',
    },
  ],
}

const passage3: Section = {
  id: 'future-work-p3-v10',
  title: 'Reading Passage 3: The future of work',
  paragraphs: [
    {
      label: 'A',
      content:
        "According to a leading business consultancy, 3-14% of the global workforce will need to switch to a different occupation within the next 10-15 years, and all workers will need to adapt as their occupations evolve alongside increasingly capable machines. Automation - or embodied artificial intelligence (AI) - is one aspect of the disruptive effects of technology on the labour market. Disembodied AI, like the algorithms running in our smartphones, is another.",
    },
    {
      label: 'B',
      content:
        "Dr Stella Pachidi from Cambridge Judge Business School believes that some of the most fundamental changes are happening as a result of the algorithmication of jobs that are dependent on data rather than on production - the so-called knowledge economy. Algorithms are capable of learning from data to undertake tasks that previously needed human judgement, such as reading legal contracts, analysing medical scans and gathering market intelligence.",
    },
    {
      label: 'C',
      content:
        'In many cases, they can outperform humans, says Pachidi. Organisations are attracted to using algorithms because they want to make choices based on what they consider is perfect information, as well as to reduce costs and enhance productivity.',
    },
    {
      label: 'D',
      content:
        'But these enhancements are not without consequences, says Pachidi. If routine cognitive tasks are taken over by AI, how do professions develop their future experts? she asks. One way of learning about a job is legitimate peripheral participation - a novice stands next to experts and learns by observation. If this is not happening, then you need to find new ways to learn.',
    },
    {
      label: 'E',
      content:
        'Another issue is the extent to which the technology influences or even controls the workforce. For over two years, Pachidi monitored a telecommunications company. The way telecoms salespeople work is through personal and frequent contact with clients, using the benefit of experience to assess a situation and reach a decision. However, the company had started using an algorithm that defined when account managers should contact certain customers about which kinds of campaigns and what to offer them.',
    },
    {
      label: 'F',
      content:
        "The algorithm - usually built by external designers - often becomes the keeper of knowledge, she explains. In cases like this, Pachidi believes, a short-sighted view begins to creep into working practices whereby workers learn through the algorithms eyes and become dependent on its instructions. Alternative explorations - where experimentation and human instinct lead to progress and new ideas - are effectively discouraged.",
    },
    {
      label: 'G',
      content:
        'Pachidi and colleagues even observed people developing strategies to make the algorithm work to their own advantage. We are seeing cases where workers feed the algorithm with false data to reach their targets, she reports.',
    },
    {
      label: 'H',
      content:
        "It is scenarios like these that many researchers are working to avoid. Their objective is to make AI technologies more trustworthy and transparent, so that organisations and individuals understand how AI decisions are made. In the meantime, says Pachidi, We need to make sure we fully understand the dilemmas that this new world raises regarding expertise, occupational boundaries and control.",
    },
    {
      label: 'I',
      content:
        'Economist Professor Hamish Low believes that the future of work will involve major transitions across the whole life course for everyone: The traditional trajectory of full-time education followed by full-time work followed by a pensioned retirement is a thing of the past, says Low. Instead, he envisages a multistage employment life: one where retraining happens across the life course, and where multiple jobs and no job happen by choice at different stages.',
    },
    {
      label: 'J',
      content:
        'On the subject of job losses, Low believes the predictions are founded on a fallacy: It assumes that the number of jobs is fixed. If in 30 years, half of 100 jobs are being carried out by robots, that does not mean we are left with just 50 jobs for humans. The number of jobs will increase: we would expect there to be 150 jobs.',
    },
    {
      label: 'K',
      content:
        "Dr Ewan McGaughey, at Cambridges Centre for Business Research and Kings College London, agrees that apocalyptic views about the future of work are misguided. It is the laws that restrict the supply of capital to the job market, not the advent of new technologies that causes unemployment.",
    },
    {
      label: 'L',
      content:
        "His recently published research answers the question of whether automation, AI and robotics will mean a jobless future by looking at the causes of unemployment. History is clear that change can mean redundancies. But social policies can tackle this through retraining and redeployment.",
    },
    {
      label: 'M',
      content:
        "He adds: If there is going to be change to jobs as a result of AI and robotics then Id like to see governments seizing the opportunity to improve policy to enforce good job security. We can reprogramme the law to prepare for a fairer future of work and leisure. McGaughey's findings are a call to arms to leaders of organisations, governments and banks to pre-empt the coming changes with bold new policies that guarantee full employment, fair incomes and a thriving economic democracy.",
    },
    {
      label: 'N',
      content:
        'The promises of these new technologies are astounding. They deliver humankind the capacity to live in a way that nobody could have once imagined, he adds. Just as the industrial revolution brought people past subsistence agriculture, and the corporate revolution enabled mass production, a third revolution has been pronounced. But it will not only be one of technology. The next revolution will be social.',
    },
  ],
  questions: [
    {
      id: 'future-v10-q27',
      number: 27,
      type: 'multiple-choice',
      groupTitle: 'Question 27',
      instruction: 'Choose the correct answer.',
      text: 'The first paragraph tells us about',
      options: [
        'the kinds of jobs that will be most affected by the growth of AI',
        'the extent to which AI will alter the nature of the work that people do',
        "the proportion of the world's labour force who will have jobs in AI in the future",
        'the difference between ways that embodied and disembodied AI will impact on workers',
      ],
      correctAnswer: 'B',
      location: 'Paragraph A',
    },
    {
      id: 'future-v10-q28',
      number: 28,
      type: 'multiple-choice',
      groupTitle: 'Question 28',
      instruction: 'Choose the correct answer.',
      text: "According to the second paragraph, what is Stella Pachidi's view of the knowledge economy?",
      options: [
        'It is having an influence on the number of jobs available.',
        "It is changing people's attitudes towards their occupations.",
        'It is the main reason why the production sector is declining.',
        'It is a key factor driving current developments in the workplace.',
      ],
      correctAnswer: 'D',
      location: 'Paragraph B',
    },
    {
      id: 'future-v10-q29',
      number: 29,
      type: 'multiple-choice',
      groupTitle: 'Question 29',
      instruction: 'Choose the correct answer.',
      text: 'What did Pachidi observe at the telecommunications company?',
      options: [
        'staff disagreeing with the recommendations of AI',
        'staff feeling resentful about the intrusion of AI in their work',
        'staff making sure that AI produces the results that they want',
        'staff allowing AI to carry out tasks they ought to do themselves',
      ],
      correctAnswer: 'C',
      location: 'Paragraph G',
    },
    {
      id: 'future-v10-q30',
      number: 30,
      type: 'multiple-choice',
      groupTitle: 'Question 30',
      instruction: 'Choose the correct answer.',
      text: 'In his recently published research, Ewan McGaughey',
      options: [
        'challenges the idea that redundancy is a negative thing',
        'shows the profound effect of mass unemployment on society',
        'highlights some differences between past and future job losses',
        'illustrates how changes in the job market can be successfully handled',
      ],
      correctAnswer: 'D',
      location: 'Paragraph L',
    },
    {
      id: 'future-v10-q31',
      number: 31,
      type: 'drag-drop-summary',
      groupTitle: 'Questions 31-34',
      instruction: 'Complete the summary by dragging the correct words into the gaps.',
      text:
        "Stella Pachidi of Cambridge Judge Business School has been focusing on the algorithmication of jobs which rely not on production but on ______.\nWhile monitoring a telecommunications company, Pachidi observed a growing ______ on the recommendations made by AI, as workers begin to learn through the algorithm's eyes.\nMeanwhile, staff are deterred from experimenting and using their own ______, and are therefore prevented from achieving innovation.\nTo avoid the kind of situations which Pachidi observed, researchers are trying to make AI's decision-making process easier to comprehend, and to increase users' ______ with regard to the technology.",
      options: ['pressure', 'satisfaction', 'intuition', 'promotion', 'reliance', 'confidence', 'information'],
      correctAnswer: ['information', 'reliance', 'intuition', 'confidence'],
      location: 'Paragraphs B-H',
    },
    {
      id: 'future-v10-q35',
      number: 35,
      type: 'matching-information',
      groupTitle: 'Questions 35-40',
      instruction: 'Match each statement with the correct person. NB You may use any letter more than once.',
      text: 'Greater levels of automation will not result in lower employment.',
      options: futureWorkPeopleOptions,
      correctAnswer: 'B',
      location: 'Paragraph J',
    },
    {
      id: 'future-v10-q36',
      number: 36,
      type: 'matching-information',
      text: 'There are several reasons why AI is appealing to businesses.',
      options: futureWorkPeopleOptions,
      correctAnswer: 'A',
      location: 'Paragraph C',
    },
    {
      id: 'future-v10-q37',
      number: 37,
      type: 'matching-information',
      text: "AI's potential to transform people's lives has parallels with major cultural shifts which occurred in previous eras.",
      options: futureWorkPeopleOptions,
      correctAnswer: 'C',
      location: 'Paragraph N',
    },
    {
      id: 'future-v10-q38',
      number: 38,
      type: 'matching-information',
      text: 'It is important to be aware of the range of problems that AI causes.',
      options: futureWorkPeopleOptions,
      correctAnswer: 'A',
      location: 'Paragraph H',
    },
    {
      id: 'future-v10-q39',
      number: 39,
      type: 'matching-information',
      text: 'People are going to follow a less conventional career path than in the past.',
      options: futureWorkPeopleOptions,
      correctAnswer: 'B',
      location: 'Paragraph I',
    },
    {
      id: 'future-v10-q40',
      number: 40,
      type: 'matching-information',
      text: 'Authorities should take measures to ensure that there will be adequately paid work for everyone.',
      options: futureWorkPeopleOptions,
      correctAnswer: 'C',
      location: 'Paragraph M',
    },
  ],
}

export const fullReadingTest10: IELTSTest = {
  id: 'ielts-reading-full-vol10',
  title: 'IELTS Reading Full Test 10 - Polar bears, Step Pyramid of Djoser, The future of work',
  type: 'Academic',
  module: 'Reading',
  duration: 60,
  totalQuestions: 40,
  sections: [passage1, passage2, passage3],
}
