import type { IELTSTest, Section } from '../types/ieltsTypes'

const paragraphOptionsAtoE = ['A', 'B', 'C', 'D', 'E']

const tomatoResearcherOptions = [
  'A. Jorg Kudla',
  'B. Caixia Gao',
  'C. Joyce Van Eck',
  'D. Jonathan Jones',
]

const passage1: Section = {
  id: 'dead-sea-scrolls-p1-v9',
  title: 'Reading Passage 1: The Dead Sea Scrolls',
  paragraphs: [
    {
      label: 'A',
      content:
        'In late 1946 or early 1947, three Bedouin teenagers were tending their goats and sheep near the ancient settlement of Qumran, located on the northwest shore of the Dead Sea in what is now known as the West Bank. One of these young shepherds tossed a rock into an opening on the side of a cliff and was surprised to hear a shattering sound. He and his companions later entered the cave and stumbled across a collection of large clay jars, seven of which contained scrolls with writing on them. The teenagers took the seven scrolls to a nearby town where they were sold for a small sum to a local antiquities dealer. Word of the find spread, and Bedouins and archaeologists eventually unearthed tens of thousands of additional scroll fragments from 10 nearby caves; together they make up between 800 and 900 manuscripts. It soon became clear that this was one of the greatest archaeological discoveries ever made.',
    },
    {
      label: 'B',
      content:
        'The origin of the Dead Sea Scrolls, which were written around 2,000 years ago between 150 BCE and 70 CE, is still the subject of scholarly debate even today. According to the prevailing theory, they are the work of a population that inhabited the area until Roman troops destroyed the settlement around 70 CE. The area was known as Judea at that time, and the people are thought to have belonged to a group called the Essenes, a devout Jewish sect.',
    },
    {
      label: 'C',
      content:
        'The majority of the texts on the Dead Sea Scrolls are in Hebrew, with some fragments written in an ancient version of its alphabet thought to have fallen out of use in the fifth century BCE. But there are other languages as well. Some scrolls are in Aramaic, the language spoken by many inhabitants of the region from the sixth century BCE to the siege of Jerusalem in 70 CE. In addition, several texts feature translations of the Hebrew Bible into Greek.',
    },
    {
      label: 'D',
      content:
        'The Dead Sea Scrolls include fragments from every book of the Old Testament of the Bible except for the Book of Esther. The only entire book of the Hebrew Bible preserved among the manuscripts from Qumran is Isaiah; this copy, dated to the first century BCE, is considered the earliest biblical manuscript still in existence. Along with biblical texts, the scrolls include documents about sectarian regulations and religious writings that do not appear in the Old Testament.',
    },
    {
      label: 'E',
      content:
        "The writing on the Dead Sea Scrolls is mostly in black or occasionally red ink, and the scrolls themselves are nearly all made of either parchment (animal skin) or an early form of paper called papyrus. The only exception is the scroll numbered 3Q15, which was created out of a combination of copper and tin. Known as the Copper Scroll, this curious document features letters chiselled onto metal - perhaps, as some have theorized, to better withstand the passage of time. One of the most intriguing manuscripts from Qumran, this is a sort of ancient treasure map that lists dozens of gold and silver caches. Using an unconventional vocabulary and odd spelling, it describes 64 underground hiding places that supposedly contain riches buried for safekeeping. None of these hoards have been recovered, possibly because the Romans pillaged Judea during the first century CE. According to various hypotheses, the treasure belonged to local people or was rescued from the Second Temple before its destruction or never existed to begin with.",
    },
    {
      label: 'F',
      content:
        'Some of the Dead Sea Scrolls have been on interesting journeys. In 1948, a Syrian Orthodox archbishop known as Mar Samuel acquired four of the original seven scrolls from a Jerusalem shoemaker and part-time antiquity dealer, paying less than $100 for them. He then travelled to the United States and unsuccessfully offered them to a number of universities, including Yale. Finally, in 1954, he placed an advertisement in the business newspaper The Wall Street Journal - under the category Miscellaneous Items for Sale - that read: Biblical Manuscripts dating back to at least 200 B.C. are for sale. This would be an ideal gift to an educational or religious institution by an individual or group. Fortunately, Israeli archaeologist and statesman Yigael Yadin negotiated their purchase and brought the scrolls back to Jerusalem, where they remain to this day.',
    },
    {
      label: 'G',
      content:
        "In 2017, researchers from the University of Haifa restored and deciphered one of the last untranslated scrolls. The university's Eshbal Ratson and Jonathan Ben-Dov spent one year reassembling the 60 fragments that make up the scroll. Deciphered from a band of coded text on parchment, the find provides insight into the community of people who wrote it and the 364-day calendar they would have used. The scroll names celebrations that indicate shifts in seasons and details two yearly religious events known from another Dead Sea Scroll. Only one more known scroll remains untranslated.",
    },
  ],
  questions: [
    {
      id: 'dss-v9-q1',
      number: 1,
      type: 'note-completion',
      groupTitle: 'Questions 1-5',
      instruction: 'Complete the notes below. Choose ONE WORD ONLY from the passage for each answer.',
      text: 'heard a noise of breaking when one teenager threw a ______',
      correctAnswer: 'rock',
      location: 'Paragraph A',
    },
    {
      id: 'dss-v9-q2',
      number: 2,
      type: 'note-completion',
      text: 'teenagers went into the ______ and found a number of containers',
      correctAnswer: 'cave',
      location: 'Paragraph A',
    },
    {
      id: 'dss-v9-q3',
      number: 3,
      type: 'note-completion',
      text: 'containers were made of ______',
      correctAnswer: 'clay',
      location: 'Paragraph A',
    },
    {
      id: 'dss-v9-q4',
      number: 4,
      type: 'note-completion',
      text: 'thought to have been written by a group of people known as the ______',
      correctAnswer: 'Essenes',
      location: 'Paragraph B',
    },
    {
      id: 'dss-v9-q5',
      number: 5,
      type: 'note-completion',
      text: 'written mainly in the ______ language',
      correctAnswer: 'Hebrew',
      location: 'Paragraph C',
    },
    {
      id: 'dss-v9-q6',
      number: 6,
      type: 'true-false-not-given',
      groupTitle: 'Questions 6-13',
      instruction:
        'Choose TRUE if the statement agrees with the information given in the text, choose FALSE if the statement contradicts the information, or choose NOT GIVEN if there is no information on this.',
      text: 'The Bedouin teenagers who found the scrolls were disappointed by how little money they received for them.',
      correctAnswer: 'NOT GIVEN',
      location: 'Paragraph A',
    },
    {
      id: 'dss-v9-q7',
      number: 7,
      type: 'true-false-not-given',
      text: 'There is agreement among academics about the origin of the Dead Sea Scrolls.',
      correctAnswer: 'FALSE',
      location: 'Paragraph B',
    },
    {
      id: 'dss-v9-q8',
      number: 8,
      type: 'true-false-not-given',
      text: 'Most of the books of the Bible written on the scrolls are incomplete.',
      correctAnswer: 'TRUE',
      location: 'Paragraph D',
    },
    {
      id: 'dss-v9-q9',
      number: 9,
      type: 'true-false-not-given',
      text: 'The information on the Copper Scroll is written in an unusual way.',
      correctAnswer: 'TRUE',
      location: 'Paragraph E',
    },
    {
      id: 'dss-v9-q10',
      number: 10,
      type: 'true-false-not-given',
      text: 'Mar Samuel was given some of the scrolls as a gift.',
      correctAnswer: 'FALSE',
      location: 'Paragraph F',
    },
    {
      id: 'dss-v9-q11',
      number: 11,
      type: 'true-false-not-given',
      text: 'In the early 1950s, a number of educational establishments in the US were keen to buy scrolls from Mar Samuel.',
      correctAnswer: 'FALSE',
      location: 'Paragraph F',
    },
    {
      id: 'dss-v9-q12',
      number: 12,
      type: 'true-false-not-given',
      text: 'The scroll that was pieced together in 2017 contains information about annual occasions in the Qumran area 2,000 years ago.',
      correctAnswer: 'TRUE',
      location: 'Paragraph G',
    },
    {
      id: 'dss-v9-q13',
      number: 13,
      type: 'true-false-not-given',
      text: 'Academics at the University of Haifa are currently researching how to decipher the final scroll.',
      correctAnswer: 'NOT GIVEN',
      location: 'Paragraph G',
    },
  ],
}

const passage2: Section = {
  id: 'tomato-domestication-p2-v9',
  title: 'Reading Passage 2: A second attempt at domesticating the tomato',
  paragraphs: [
    {
      label: 'A',
      content:
        'It took at least 3,000 years for humans to learn how to domesticate the wild tomato and cultivate it for food. Now two separate teams in Brazil and China have done it all over again in less than three years. And they have done it better in some ways, as the re-domesticated tomatoes are more nutritious than the ones we eat at present. This approach relies on the revolutionary CRISPR genome editing technique, in which changes are deliberately made to the DNA of a living cell, allowing genetic material to be added, removed or altered. The technique could not only improve existing crops, but could also be used to turn thousands of wild plants into useful and appealing foods. In fact, a third team in the US has already begun to do this with a relative of the tomato called the groundcherry.',
    },
    {
      label: 'B',
      content:
        'This fast-track domestication could help make the worlds food supply healthier and far more resistant to diseases, such as the rust fungus devastating wheat crops. This could transform what we eat, says Jorg Kudla at the University of Munster in Germany, a member of the Brazilian team. There are 50,000 edible plants in the world, but 90 percent of our energy comes from just 15 crops. We can now mimic the known domestication course of major crops like rice, maize, sorghum or others, says Caixia Gao of the Chinese Academy of Sciences in Beijing. Then we might try to domesticate plants that have never been domesticated.',
    },
    {
      label: 'C',
      content:
        'Wild tomatoes, which are native to the Andes region in South America, produce pea-sized fruits. Over many generations, peoples such as the Aztecs and Incas transformed the plant by selecting and breeding plants with mutations in their genetic structure, which resulted in desirable traits such as larger fruit. But every time a single plant with a mutation is taken from a larger population for breeding, much genetic diversity is lost. And sometimes the desirable mutations come with less desirable traits. For instance, the tomato strains grown for supermarkets have lost much of their flavour. By comparing the genomes of modern plants to those of their wild relatives, biologists have been working out what genetic changes occurred as plants were domesticated.',
    },
    {
      label: 'D',
      content:
        'The teams in Brazil and China have now used this knowledge to reintroduce these changes from scratch while maintaining or even enhancing the desirable traits of wild strains. Kudlas team made six changes altogether. For instance, they tripled the size of fruit by editing a gene called FRUIT WEIGHT, and increased the number of tomatoes per truss by editing another called MULTIFLORA. While the historical domestication of tomatoes reduced levels of the red pigment lycopene - thought to have potential health benefits - the team in Brazil managed to boost it instead. The wild tomato has twice as much lycopene as cultivated ones; the newly domesticated one has five times as much. They are quite tasty, says Kudla. A little bit strong. And very aromatic.',
    },
    {
      label: 'E',
      content:
        'The team in China re-domesticated several strains of wild tomatoes with desirable traits lost in domesticated tomatoes. In this way they managed to create a strain resistant to a common disease called bacterial spot race, which can devastate yields. They also created another strain that is more salt tolerant - and has higher levels of vitamin C. Meanwhile, Joyce Van Eck at the Boyce Thompson Institute in New York state decided to use the same approach to domesticate the groundcherry or goldenberry (Physalis pruinosa) for the first time. Groundcherries are already sold to a limited extent in the US but they are hard to produce. Van Eck says there is potential for this to be a commercial crop, but adds that taking the work further would be expensive because of licensing and regulatory approval. Jonathan Jones of the Sainsbury Lab says the approach could boost many obscure plants, but it will be hard for new foods to become major staple crops. By choosing wild plants that are drought or heat tolerant, says Gao, we could create crops that will thrive even as the planet warms. Kudla did not want to reveal which species were in his teams sights because CRISPR has made the process so easy.',
    },
  ],
  questions: [
    {
      id: 'tomato-v9-q14',
      number: 14,
      type: 'matching-information',
      groupTitle: 'Questions 14-18',
      instruction:
        'Reading Passage 2 has five sections. Which section contains the following information? NB You may use any letter more than once.',
      text: 'a reference to a type of tomato that can resist a dangerous infection',
      options: paragraphOptionsAtoE,
      correctAnswer: 'C',
      location: 'Section C',
    },
    {
      id: 'tomato-v9-q15',
      number: 15,
      type: 'matching-information',
      text: 'an explanation of how problems can arise from focusing only on a certain type of tomato plant',
      options: paragraphOptionsAtoE,
      correctAnswer: 'B',
      location: 'Section B',
    },
    {
      id: 'tomato-v9-q16',
      number: 16,
      type: 'matching-information',
      text: 'a number of examples of plants that are not cultivated at present but could be useful as food sources',
      options: paragraphOptionsAtoE,
      correctAnswer: 'E',
      location: 'Section E',
    },
    {
      id: 'tomato-v9-q17',
      number: 17,
      type: 'matching-information',
      text: 'a comparison between the early domestication of the tomato and more recent research',
      options: paragraphOptionsAtoE,
      correctAnswer: 'A',
      location: 'Section A',
    },
    {
      id: 'tomato-v9-q18',
      number: 18,
      type: 'matching-information',
      text: 'a personal reaction to the flavour of a tomato that has been genetically edited',
      options: paragraphOptionsAtoE,
      correctAnswer: 'C',
      location: 'Section C',
    },
    {
      id: 'tomato-v9-q19',
      number: 19,
      type: 'matching-information',
      groupTitle: 'Questions 19-23',
      instruction: 'Match each statement with the correct researcher. NB You may use any letter more than once.',
      text: 'Domestication of certain plants could allow them to adapt to future environmental challenges.',
      options: tomatoResearcherOptions,
      correctAnswer: 'B',
      location: 'Section E',
    },
    {
      id: 'tomato-v9-q20',
      number: 20,
      type: 'matching-information',
      text: 'The idea of growing and eating unusual plants may not be accepted on a large scale.',
      options: tomatoResearcherOptions,
      correctAnswer: 'D',
      location: 'Section E',
    },
    {
      id: 'tomato-v9-q21',
      number: 21,
      type: 'matching-information',
      text: 'It is not advisable for the future direction of certain research to be made public.',
      options: tomatoResearcherOptions,
      correctAnswer: 'A',
      location: 'Section E',
    },
    {
      id: 'tomato-v9-q22',
      number: 22,
      type: 'matching-information',
      text: 'Present efforts to domesticate one wild fruit are limited by the costs involved.',
      options: tomatoResearcherOptions,
      correctAnswer: 'C',
      location: 'Section E',
    },
    {
      id: 'tomato-v9-q23',
      number: 23,
      type: 'matching-information',
      text: 'Humans only make use of a small proportion of the plant food available on Earth.',
      options: tomatoResearcherOptions,
      correctAnswer: 'A',
      location: 'Section B',
    },
    {
      id: 'tomato-v9-q24',
      number: 24,
      type: 'summary-completion',
      groupTitle: 'Questions 24-26',
      instruction: 'Complete the sentences below. Choose ONE WORD ONLY from the passage for each answer.',
      text: 'An undesirable trait such as loss of ______ may be caused by a mutation in a tomato gene.',
      correctAnswer: 'flavour|flavor',
      location: 'Section C',
    },
    {
      id: 'tomato-v9-q25',
      number: 25,
      type: 'summary-completion',
      text: 'By modifying one gene in a tomato plant, researchers made the tomato three times its original ______.',
      correctAnswer: 'size',
      location: 'Section D',
    },
    {
      id: 'tomato-v9-q26',
      number: 26,
      type: 'summary-completion',
      text: 'A type of tomato which was not badly affected by ______, and was rich in vitamin C, was produced by a team of researchers in China.',
      correctAnswer: 'salt',
      location: 'Section E',
    },
  ],
}

const passage3: Section = {
  id: 'insight-evolution-p3-v9',
  title: 'Reading Passage 3: Insight or evolution?',
  paragraphs: [
    {
      label: 'A',
      content:
        "Scientific discovery is popularly believed to result from the sheer genius of such intellectual stars as naturalist Charles Darwin and theoretical physicist Albert Einstein. Our view of such unique contributions to science often disregards the person's prior experience and the efforts of their lesser-known predecessors. Conventional wisdom also places great weight on insight in promoting breakthrough scientific achievements, as if ideas spontaneously pop into someone's head - fully formed and functional.",
    },
    {
      label: 'B',
      content:
        'There may be some limited truth to this view. However, we believe that it largely misrepresents the real nature of scientific discovery, as well as that of creativity and innovation in many other realms of human endeavour.',
    },
    {
      label: 'C',
      content:
        "Setting aside such greats as Darwin and Einstein - whose monumental contributions are duly celebrated - we suggest that innovation is more a process of trial and error, where two steps forward may sometimes come with one step back, as well as one or more steps to the right or left. This evolutionary view of human innovation undermines the notion of creative genius and recognizes the cumulative nature of scientific progress.",
    },
    {
      label: 'D',
      content:
        "Consider one unheralded scientist: John Nicholson, a mathematical physicist working in the 1910s who postulated the existence of proto-elements in outer space. By combining different numbers of weights of these proto-elements atoms, Nicholson could recover the weights of all the elements in the then-known periodic table. These successes are all the more noteworthy given the fact that Nicholson was wrong about the presence of proto-elements: they do not actually exist. Yet, amid his often fanciful theories and wild speculations, Nicholson also proposed a novel theory about the structure of atoms. Niels Bohr, the Nobel prize-winning father of modern atomic theory, jumped off from this interesting idea to conceive his now-famous model of the atom.",
    },
    {
      label: 'E',
      content:
        'What are we to make of this story? One might simply conclude that science is a collective and cumulative enterprise. That may be true, but there may be a deeper insight to be gleaned. We propose that science is constantly evolving, much as species of animals do. In biological systems, organisms may display new characteristics that result from random genetic mutations. In the same way, random, arbitrary or accidental mutations of ideas may help pave the way for advances in science. If mutations prove beneficial, then the animal or the scientific theory will continue to thrive and perhaps reproduce.',
    },
    {
      label: 'F',
      content:
        "Support for this evolutionary view of behavioural innovation comes from many domains. Consider one example of an influential innovation in US horseracing. The so-called acey-deucy stirrup placement, in which the rider's foot in his left stirrup is placed as much as 25 centimetres lower than the right, is believed to confer important speed advantages when turning on oval tracks. It was developed by a relatively unknown jockey named Jackie Westrope. Had Westrope conducted methodical investigations or examined extensive film records in a shrewd plan to outrun his rivals? Had he foreseen the speed advantage that would be conferred by riding acey-deucy? No. He suffered a leg injury, which left him unable to fully bend his left knee. His modification just happened to coincide with enhanced left-hand turning performance. This led to the rapid and widespread adoption of riding acey-deucy by many riders, a racing style which continues in todays thoroughbred racing.",
    },
    {
      label: 'G',
      content:
        'Plenty of other stories show that fresh advances can arise from error, misadventure, and also pure serendipity - a happy accident. For example, in the early 1970s, two employees of the company 3M each had a problem: Spencer Silver had a product - a glue which was only slightly sticky - and no use for it, while his colleague Art Fry was trying to figure out how to affix temporary bookmarks in his hymn book without damaging its pages. The solution to both these problems was the invention of the brilliantly simple yet phenomenally successful Post-It note. Such examples give lie to the claim that ingenious, designing minds are responsible for human creativity and invention. Far more banal and mechanical forces may be at work; forces that are fundamentally connected to the laws of science.',
    },
    {
      label: 'H',
      content:
        'The notions of insight, creativity and genius are often invoked, but they remain vague and of doubtful scientific utility, especially when one considers the diverse and enduring contributions of individuals such as Plato, Leonardo da Vinci, Shakespeare, Beethoven, Galileo, Newton, Kepler, Curie, Pasteur and Edison. These notions merely label rather than explain the evolution of human innovations. We need another approach, and there is a promising candidate.',
    },
    {
      label: 'I',
      content:
        'The Law of Effect was advanced by psychologist Edward Thorndike in 1898, some 40 years after Charles Darwin published his groundbreaking work on biological evolution, On the Origin of Species. This simple law holds that organisms tend to repeat successful behaviors and to refrain from performing unsuccessful ones. Just like Darwins Law of Natural Selection, the Law of Effect involves an entirely mechanical process of variation and selection, without any end objective in sight.',
    },
    {
      label: 'J',
      content:
        'Of course, the origin of human innovation demands much further study. In particular, the provenance of the raw material on which the Law of Effect operates is not as clearly known as that of the genetic mutations on which the Law of Natural Selection operates. The generation of novel ideas and behaviors may not be entirely random, but constrained by prior successes and failures - of the current individual (such as Bohr) or of predecessors (such as Nicholson).',
    },
    {
      label: 'K',
      content:
        'The time seems right for abandoning the naive notions of intelligent design and genius, and for scientifically exploring the true origins of creative behavior.',
    },
  ],
  questions: [
    {
      id: 'insight-v9-q27',
      number: 27,
      type: 'multiple-choice',
      groupTitle: 'Question 27',
      instruction: 'Choose the correct letter.',
      text: 'The purpose of the first paragraph is to',
      options: [
        'defend particular ideas.',
        'compare certain beliefs.',
        'disprove a widely held view.',
        'outline a common assumption.',
      ],
      correctAnswer: 'D',
      location: 'Paragraph A',
    },
    {
      id: 'insight-v9-q28',
      number: 28,
      type: 'multiple-choice',
      groupTitle: 'Question 28',
      instruction: 'Choose the correct letter.',
      text: 'What are the writers doing in the second paragraph?',
      options: [
        'criticising an opinion',
        'justifying a standpoint',
        'explaining an approach',
        'supporting an argument',
      ],
      correctAnswer: 'A',
      location: 'Paragraph B',
    },
    {
      id: 'insight-v9-q29',
      number: 29,
      type: 'multiple-choice',
      groupTitle: 'Question 29',
      instruction: 'Choose the correct letter.',
      text: 'In the third paragraph, what do the writers suggest about Darwin and Einstein?',
      options: [
        'They represent an exception to a general rule.',
        'Their way of working has been misunderstood.',
        'They are an ideal which others should aspire to.',
        'Their achievements deserve greater recognition.',
      ],
      correctAnswer: 'A',
      location: 'Paragraph C',
    },
    {
      id: 'insight-v9-q30',
      number: 30,
      type: 'multiple-choice',
      groupTitle: 'Question 30',
      instruction: 'Choose the correct letter.',
      text: 'John Nicholson is an example of a person whose idea',
      options: [
        'established his reputation as an influential scientist.',
        'was only fully understood at a later point in history.',
        "laid the foundations for someone else's breakthrough.",
        'initially met with scepticism from the scientific community.',
      ],
      correctAnswer: 'C',
      location: 'Paragraph D',
    },
    {
      id: 'insight-v9-q31',
      number: 31,
      type: 'multiple-choice',
      groupTitle: 'Question 31',
      instruction: 'Choose the correct letter.',
      text: "What is the key point of interest about the 'acey-deucy' stirrup placement?",
      options: [
        'the simple reason why it was invented',
        'the enthusiasm with which it was adopted',
        'the research that went into its development',
        'the cleverness of the person who first used it',
      ],
      correctAnswer: 'A',
      location: 'Paragraph F',
    },
    {
      id: 'insight-v9-q32',
      number: 32,
      type: 'yes-no-not-given',
      groupTitle: 'Questions 32-36',
      instruction:
        'Choose YES if the statement agrees with the information given in the text, choose NO if the statement contradicts the information, or choose NOT GIVEN if there is no information on this.',
      text: 'Acknowledging people such as Plato or da Vinci as geniuses will help us understand the process by which great minds create new ideas.',
      correctAnswer: 'NO',
      location: 'Paragraph H',
    },
    {
      id: 'insight-v9-q33',
      number: 33,
      type: 'yes-no-not-given',
      text: 'The Law of Effect was discovered at a time when psychologists were seeking a scientific reason why creativity occurs.',
      correctAnswer: 'NOT GIVEN',
      location: 'Paragraph I',
    },
    {
      id: 'insight-v9-q34',
      number: 34,
      type: 'yes-no-not-given',
      text: 'The Law of Effect states that no planning is involved in the behaviour of organisms.',
      correctAnswer: 'YES',
      location: 'Paragraph I',
    },
    {
      id: 'insight-v9-q35',
      number: 35,
      type: 'yes-no-not-given',
      text: 'The Law of Effect sets out clear explanations about the sources of new ideas and behaviours.',
      correctAnswer: 'NO',
      location: 'Paragraph J',
    },
    {
      id: 'insight-v9-q36',
      number: 36,
      type: 'yes-no-not-given',
      text: 'Many scientists are now turning away from the notion of intelligent design and genius.',
      correctAnswer: 'NOT GIVEN',
      location: 'Paragraph K',
    },
    {
      id: 'insight-v9-q37',
      number: 37,
      type: 'drag-drop-summary',
      groupTitle: 'Questions 37-40',
      instruction: 'Complete the summary by dragging the correct words into the gaps.',
      text:
        "The traditional view of scientific discovery is that breakthroughs happen when a single great mind has sudden ______.\nAlthough this can occur, it is not often the case. Advances are more likely to be the result of a longer process. In some cases, this process involves ______, such as Nicholson's early ideas.\nIn others, simple necessity may provoke innovation, as with Westrope's decision to modify the position of his riding stirrups. There is also often an element of ______, for example, the coincidence of ideas that led to the invention of the Post-it note.\nWith both the Law of Natural Selection and the Law of Effect, there may be no clear ______ involved, but merely a process of variation and selection.",
      options: ['invention', 'goals', 'compromise', 'mistakes', 'luck', 'inspiration', 'experiments'],
      correctAnswer: ['inspiration', 'experiments', 'luck', 'goals'],
      location: 'Paragraphs A-K',
    },
  ],
}

export const fullReadingTest9: IELTSTest = {
  id: 'ielts-reading-full-vol9',
  title: 'IELTS Reading Full Test 9 - Dead Sea Scrolls, Tomato domestication, Insight or evolution?',
  type: 'Academic',
  module: 'Reading',
  duration: 60,
  totalQuestions: 40,
  sections: [passage1, passage2, passage3],
}
