import type { IELTSTest, Section } from '../types/ieltsTypes'

const paragraphOptionsAtoF = ['A', 'B', 'C', 'D', 'E', 'F']
const paragraphOptionsAtoH = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

const babyTalkPeopleOptions = [
  'A. Mark VanDam',
  'B. Nairan Ramirez-Esparza',
  'C. Patricia Kuhl',
]

const harappanPeopleOptions = [
  'A. Cameron Petrie',
  'B. Ravindanath Singh',
  'C. Yama Dixit',
  'D. David Hodell',
]

const passage1: Section = {
  id: 'coconut-palm-p1-v7',
  title: 'Reading Passage 1: The coconut palm',
  paragraphs: [
    {
      label: 'A',
      content:
        "For millennia, the coconut has been central to the lives of Polynesian and Asian peoples. In the western world, on the other hand, coconuts have always been exotic and unusual, sometimes rare. The Italian merchant traveller Marco Polo apparently saw coconuts in South Asia in the late 13th century, and among the mid-14th-century travel writings of Sir John Mandeville there is mention of 'great Notes of Ynde' (great Nuts of India). Today, images of palm-fringed tropical beaches are cliches in the west to sell holidays, chocolate bars, fizzy drinks and even romance.",
    },
    {
      label: 'B',
      content:
        'Typically, we envisage coconuts as brown cannonballs that, when opened, provide sweet white flesh. But we see only part of the fruit and none of the plant from which they come. The coconut palm has a smooth, slender, grey trunk, up to 30 metres tall. This is an important source of timber for building houses, and is increasingly being used as a replacement for endangered hardwoods in the furniture construction industry. The trunk is surmounted by a rosette of leaves, each of which may be up to six metres long. The leaves have hard veins in their centres which, in many parts of the world, are used as brushes after the green part of the leaf has been stripped away. Immature coconut flowers are tightly clustered together among the leaves at the top of the trunk. The flower stems may be tapped for their sap to produce a drink, and the sap can also be reduced by boiling to produce a type of sugar used for cooking.',
    },
    {
      label: 'C',
      content:
        "Coconut palms produce as many as seventy fruits per year, weighing more than a kilogram each. The wall of the fruit has three layers: a waterproof outer layer, a fibrous middle layer and a hard, inner layer. The thick fibrous middle layer produces coconut fibre, 'coir', which has numerous uses and is particularly important in manufacturing ropes. The woody innermost layer, the shell, with its three prominent 'eyes', surrounds the seed. An important product obtained from the shell is charcoal, which is widely used in various industries as well as in the home as a cooking fuel. When broken in half, the shells are also used as bowls in many parts of Asia.",
    },
    {
      label: 'D',
      content:
        "Inside the shell are the nutrients (endosperm) needed by the developing seed. Initially, the endosperm is a sweetish liquid, coconut water, which is enjoyed as a drink, but also provides the hormones which encourage other plants to grow more rapidly and produce higher yields. As the fruit matures, the coconut water gradually solidifies to form the brilliant white, fat-rich, edible flesh or meat. Dried coconut flesh, 'copra', is made into coconut oil and coconut milk, which are widely used in cooking in different parts of the world, as well as in cosmetics. A derivative of coconut fat, glycerine, acquired strategic importance in a quite different sphere, as Alfred Nobel introduced the world to his nitroglycerine-based invention: dynamite.",
    },
    {
      label: 'E',
      content:
        'Their biology would appear to make coconuts the great maritime voyagers and coastal colonizers of the plant world. The large, energy-rich fruits are able to float in water and tolerate salt, but cannot remain viable indefinitely; studies suggest after about 110 days at sea they are no longer able to germinate. Literally cast onto desert island shores, with little more than sand to grow in and exposed to the full glare of the tropical sun, coconut seeds are able to germinate and root. The air pocket in the seed, created as the endosperm solidifies, protects the embryo. In addition, the fibrous fruit wall that helped it to float during the voyage stores moisture that can be taken up by the roots of the coconut seedling as it starts to grow.',
    },
    {
      label: 'F',
      content:
        'There have been centuries of academic debate over the origins of the coconut. There were no coconut palms in West Africa, the Caribbean or the east coast of the Americas before the voyages of the European explorers Vasco da Gama and Columbus in the late 15th and early 16th centuries. 16th century trade and human migration patterns reveal that Arab traders and European sailors are likely to have moved coconuts from South and Southeast Asia to Africa and then across the Atlantic to the east coast of America.',
    },
    {
      label: 'G',
      content:
        'But the origin of coconuts discovered along the west coast of America by 16th century sailors has been the subject of centuries of discussion. Two diametrically opposed origins have been proposed: that they came from Asia, or that they were native to America. Both suggestions have problems. In Asia, there is a large degree of coconut diversity and evidence of millennia of human use - but there are no relatives growing in the wild. In America, there are close coconut relatives, but no evidence that coconuts are indigenous. These problems have led to the intriguing suggestion that coconuts originated on coral islands in the Pacific and were dispersed from there.',
    },
  ],
  questions: [
    {
      id: 'coco-v7-q1',
      number: 1,
      type: 'note-completion',
      groupTitle: 'Questions 1-8',
      instruction: 'Choose ONE WORD ONLY from the passage for each answer.',
      text: 'trunk: timber for houses and the making of ______',
      correctAnswer: 'furniture',
      location: 'Paragraph B',
    },
    {
      id: 'coco-v7-q2',
      number: 2,
      type: 'note-completion',
      text: 'flower stems provide sap, used as a drink or a source of ______',
      correctAnswer: 'sugar',
      location: 'Paragraph B',
    },
    {
      id: 'coco-v7-q3',
      number: 3,
      type: 'note-completion',
      text: 'middle layer (coir fibres): used for ______',
      correctAnswer: 'ropes',
      location: 'Paragraph C',
    },
    {
      id: 'coco-v7-q4',
      number: 4,
      type: 'note-completion',
      text: 'inner layer (shell): a source of ______',
      correctAnswer: 'charcoal',
      location: 'Paragraph C',
    },
    {
      id: 'coco-v7-q5',
      number: 5,
      type: 'note-completion',
      text: 'inner layer (shell), when halved: used for ______',
      correctAnswer: 'bowls',
      location: 'Paragraph C',
    },
    {
      id: 'coco-v7-q6',
      number: 6,
      type: 'note-completion',
      text: 'coconut water: a source of ______ for other plants',
      correctAnswer: 'hormones',
      location: 'Paragraph D',
    },
    {
      id: 'coco-v7-q7',
      number: 7,
      type: 'note-completion',
      text: 'coconut flesh: oil and milk for cooking and ______',
      correctAnswer: 'cosmetics',
      location: 'Paragraph D',
    },
    {
      id: 'coco-v7-q8',
      number: 8,
      type: 'note-completion',
      text: 'glycerine (an ingredient in ______)',
      correctAnswer: 'dynamite',
      location: 'Paragraph D',
    },
    {
      id: 'coco-v7-q9',
      number: 9,
      type: 'true-false-not-given',
      groupTitle: 'Questions 9-13',
      instruction:
        'Choose TRUE if the statement agrees with the information, FALSE if the statement contradicts the information, or NOT GIVEN if there is no information on this.',
      text: 'Coconut seeds need shade in order to germinate.',
      correctAnswer: 'FALSE',
      location: 'Paragraph E',
    },
    {
      id: 'coco-v7-q10',
      number: 10,
      type: 'true-false-not-given',
      text: 'Coconuts were probably transported to Asia from America in the 16th century.',
      correctAnswer: 'FALSE',
      location: 'Paragraph F',
    },
    {
      id: 'coco-v7-q11',
      number: 11,
      type: 'true-false-not-given',
      text: 'Coconuts found on the west coast of America were a different type from those found on the east coast.',
      correctAnswer: 'NOT GIVEN',
      location: 'Paragraphs F-G',
    },
    {
      id: 'coco-v7-q12',
      number: 12,
      type: 'true-false-not-given',
      text: 'All the coconuts found in Asia are cultivated varieties.',
      correctAnswer: 'TRUE',
      location: 'Paragraph G',
    },
    {
      id: 'coco-v7-q13',
      number: 13,
      type: 'true-false-not-given',
      text: 'Coconuts are cultivated in different ways in America and the Pacific.',
      correctAnswer: 'NOT GIVEN',
      location: 'Paragraphs F-G',
    },
  ],
}

const passage2: Section = {
  id: 'baby-talk-p2-v7',
  title: 'Reading Passage 2: How baby talk gives infant brains a boost',
  paragraphs: [
    {
      label: 'A',
      content:
        "The typical way of talking to a baby - high-pitched, exaggerated and repetitious - is a source of fascination for linguists who hope to understand how 'baby talk' impacts on learning. Most babies start developing their hearing while still in the womb, prompting some hopeful parents to play classical music to their pregnant bellies. Some research even suggests that infants are listening to adult speech as early as 10 weeks before being born, gathering the basic building blocks of their family's native tongue.",
    },
    {
      label: 'B',
      content:
        "Early language exposure seems to have benefits to the brain - for instance, studies suggest that babies raised in bilingual homes are better at learning how to mentally prioritize information. So how does the sweet if sometimes absurd sound of infant-directed speech influence a baby's development? Here are some recent studies that explore the science behind baby talk.",
    },
    {
      label: 'C',
      content:
        `Fathers don't use baby talk as often or in the same ways as mothers - and that's perfectly OK, according to a new study. Mark VanDam of Washington State University at Spokane and colleagues equipped parents with recording devices and speech-recognition software to study the way they interacted with their youngsters during a normal day. "We found that moms do exactly what you'd expect and what's been described many times over," VanDam explains. "But we found that dads aren't doing the same thing. Dads didn't raise their pitch or fundamental frequency when they talked to kids." Their role may be rooted in what is called the bridge hypothesis, which dates back to 1975. It suggests that fathers use less familial language to provide their children with a bridge to the kind of speech they'll hear in public. "The idea is that a kid gets to practice a certain kind of speech with mom and another kind of speech with dad, so the kid then has a wider repertoire of kinds of speech to practice," says VanDam.`,
    },
    {
      label: 'D',
      content:
        `Scientists from the University of Washington and the University of Connecticut collected thousands of 30-second conversations between parents and their babies, fitting 26 children with audio-recording vests that captured language and sound during a typical eight-hour day. The study found that the more baby talk parents used, the more their youngsters began to babble. And when researchers saw the same babies at age two, they found that frequent baby talk had dramatically boosted vocabulary, regardless of socioeconomic status. "Those children who listened to a lot of baby talk were talking more than the babies that listened to more adult talk or standard speech," says Nairan Ramirez-Esparza of the University of Connecticut. "We also found that it really matters whether you use baby talk in a one-on-one context," she adds. "The more parents use baby talk one-on-one, the more babies babble, and the more they babble, the more words they produce later in life."`,
    },
    {
      label: 'E',
      content:
        `Another study suggests that parents might want to pair their youngsters up so they can babble more with their own kind. Researchers from McGill University and Universite du Quebec a Montreal found that babies seem to like listening to each other rather than to adults - which may be why baby talk is such a universal tool among parents. They played repeating vowel sounds made by a special synthesizing device that mimicked sounds made by either an adult woman or another baby. This way, only the impact of the auditory cues was observed. The team then measured how long each type of sound held the infants' attention. They found that the 'infant' sounds held babies' attention nearly 40 percent longer. The baby noises also induced more reactions in the listening infants, like smiling or lip moving, which approximates sound making. The team theorizes that this attraction to other infant sounds could help launch the learning process that leads to speech. "It may be some property of the sound that is just drawing their attention," says study co-author Linda Polka. "Or maybe they are really interested in that particular type of sound because they are starting to focus on their own ability to make sounds. We are speculating here but it might catch their attention because they recognize it as a sound they could possibly make."`,
    },
    {
      label: 'F',
      content:
        `In a study published in Proceedings of the National Academy of Sciences, a total of 57 babies from two slightly different age groups - seven months and eleven and a half months - were played a number of syllables from both their native language (English) and a non-native tongue (Spanish). The infants were placed in a brain-activation scanner that recorded activity in a brain region known to guide the motor movements that produce speech. The results suggest that listening to baby talk prompts infant brains to start practicing their language skills. "Finding activation in motor areas of the brain when infants are simply listening is significant, because it means the baby brain is engaged in trying to talk back right from the start, and suggests that seven-month-olds' brains are already trying to figure out how to make the right movements that will produce words," says co-author Patricia Kuhl. Another interesting finding was that while the seven-month-olds responded to all speech sounds regardless of language, the brains of the older infants worked harder at the motor activations of non-native sounds compared to native sounds. The study may have also uncovered a process by which babies recognize differences between their native language and other tongues.`,
    },
  ],
  questions: [
    {
      id: 'baby-v7-q14',
      number: 14,
      type: 'matching-information',
      groupTitle: 'Questions 14-17',
      instruction: 'Match each statement with the correct person.',
      text: 'the importance of adults giving babies individual attention when talking to them',
      options: babyTalkPeopleOptions,
      correctAnswer: 'B',
      location: 'Paragraph D',
    },
    {
      id: 'baby-v7-q15',
      number: 15,
      type: 'matching-information',
      text: 'the connection between what babies hear and their own efforts to create speech',
      options: babyTalkPeopleOptions,
      correctAnswer: 'C',
      location: 'Paragraph F',
    },
    {
      id: 'baby-v7-q16',
      number: 16,
      type: 'matching-information',
      text: 'the advantage for the baby of having two parents each speaking in a different way',
      options: babyTalkPeopleOptions,
      correctAnswer: 'A',
      location: 'Paragraph C',
    },
    {
      id: 'baby-v7-q17',
      number: 17,
      type: 'matching-information',
      text: 'the connection between the amount of baby talk babies hear and how much vocalising they do themselves',
      options: babyTalkPeopleOptions,
      correctAnswer: 'B',
      location: 'Paragraph D',
    },
    {
      id: 'baby-v7-q18',
      number: 18,
      type: 'summary-completion',
      groupTitle: 'Questions 18-23',
      instruction: 'Choose NO MORE THAN TWO WORDS from the passage for each answer.',
      text: 'Researchers at Washington State University used ______, together with specialised computer programs, to analyse how parents interacted with their babies during a normal day.',
      correctAnswer: 'recording devices',
      location: 'Paragraph C',
    },
    {
      id: 'baby-v7-q19',
      number: 19,
      type: 'summary-completion',
      text: 'The study revealed that ______ tended not to modify their ordinary speech patterns when interacting with their babies.',
      correctAnswer: 'fathers|dads',
      location: 'Paragraph C',
    },
    {
      id: 'baby-v7-q20',
      number: 20,
      type: 'summary-completion',
      text: 'According to an idea known as the ______, they may use a more adult type of speech to prepare infants for the language they will hear outside the family home.',
      correctAnswer: 'bridge hypothesis',
      location: 'Paragraph C',
    },
    {
      id: 'baby-v7-q21',
      number: 21,
      type: 'summary-completion',
      text: "According to the researchers, hearing baby talk from one parent and 'normal' language from the other expands the baby's ______ of types of speech which they can practise.",
      correctAnswer: 'repertoire',
      location: 'Paragraph C',
    },
    {
      id: 'baby-v7-q22',
      number: 22,
      type: 'summary-completion',
      text: 'Scientists from the University of Washington and the University of Connecticut recorded speech and sound using special ______ that the babies were equipped with.',
      correctAnswer: 'audio-recording vests|vests',
      location: 'Paragraph D',
    },
    {
      id: 'baby-v7-q23',
      number: 23,
      type: 'summary-completion',
      text: 'When they studied the babies again at age two, they found that those who had heard a lot of baby talk in infancy had a much larger ______ than those who had not.',
      correctAnswer: 'vocabulary',
      location: 'Paragraph D',
    },
    {
      id: 'baby-v7-q24',
      number: 24,
      type: 'matching-information',
      groupTitle: 'Questions 24-26',
      instruction: 'Which paragraph contains the following information? Choose the correct letter, A-F.',
      text: "a reference to a change which occurs in babies' brain activity before the end of their first year",
      options: paragraphOptionsAtoF,
      correctAnswer: 'F',
      location: 'Paragraph F',
    },
    {
      id: 'baby-v7-q25',
      number: 25,
      type: 'matching-information',
      text: "an example of what some parents do for their baby's benefit before birth",
      options: paragraphOptionsAtoF,
      correctAnswer: 'A',
      location: 'Paragraph A',
    },
    {
      id: 'baby-v7-q26',
      number: 26,
      type: 'matching-information',
      text: "a mention of babies' preference for the sounds that other babies make",
      options: paragraphOptionsAtoF,
      correctAnswer: 'E',
      location: 'Paragraph E',
    },
  ],
}

const passage3: Section = {
  id: 'harappan-civilisation-p3-v7',
  title: 'Reading Passage 3: Whatever happened to the Harappan Civilisation?',
  paragraphs: [
    {
      label: 'A',
      content:
        "The Harappan Civilisation of ancient Pakistan and India flourished 5,000 years ago, but a thousand years later their cities were abandoned. The Harappan Civilisation was a sophisticated Bronze Age society who built 'megacities' and traded internationally in luxury craft products, and yet seemed to have left almost no depictions of themselves. But their lack of self-imagery - at a time when the Egyptians were carving and painting representations of themselves all over their temples - is only part of the mystery.",
    },
    {
      label: 'B',
      content:
        `"There is plenty of archaeological evidence to tell us about the rise of the Harappan Civilisation, but relatively little about its fall," explains archaeologist Dr Cameron Petrie of the University of Cambridge. "As populations increased, cities were built that had great baths, craft workshops, palaces and halls laid out in distinct sectors. Houses were arranged in blocks, with wide main streets and narrow alleyways, and many had their own wells and drainage systems. It was very much a 'thriving' civilisation." Then around 2100 BC, a transformation began. Streets went uncleaned, buildings started to be abandoned, and ritual structures fell out of use. After their final demise, a millennium passed before really large-scale cities appeared once more in South Asia.`,
    },
    {
      label: 'C',
      content:
        `Some have claimed that major glacier-fed rivers changed their course, dramatically affecting the water supply and agriculture; or that the cities could not cope with an increasing population, they exhausted their resource base, the trading economy broke down or they succumbed to invasion and conflict; and yet others that climate change caused an environmental change that affected food and water provision. "It is unlikely that there was a single cause for the decline of the civilisation. But the fact is, until now, we have had little solid evidence from the area for most of the key elements," said Petrie. "A lot of the archaeological debate has really only been well-argued speculation."`,
    },
    {
      label: 'D',
      content:
        'A research team led by Petrie, together with Dr Ravindanath Singh of Banaras Hindu University in India, found early in their investigations that many of the archaeological sites were not where they were supposed to be, completely altering understanding of the way that this region was inhabited in the past. When they carried out a survey of how the larger area was settled in relation to sources of water, they found inaccuracies in the published geographic locations of ancient settlements ranging from several hundred metres to many kilometres. They realised that any attempts to use the existing data were likely to be fundamentally flawed. Over the course of several seasons of fieldwork they carried out new surveys, finding an astonishing 198 settlement sites that were previously unknown.',
    },
    {
      label: 'E',
      content:
        `Now, research published by Dr Yama Dixit and Professor David Hodell, both from Cambridge's Department of Earth Sciences, has provided the first definitive evidence for climate change affecting the plains of north-western India, where hundreds of Harappan sites are known to have been situated. The researchers gathered shells of "Melanoides tuberculata" snails from the sediments of an ancient lake and used geochemical analysis as a means of tracing the climate history of the region. "As today, the major source of water into the lake is likely to have been the summer monsoon," says Dixit. "But we have observed that there was an abrupt change about 4,100 years ago, when the amount of evaporation from the lake exceeded the rainfall - indicative of a drought." Hodell adds: "We estimate that the weakening of the Indian summer monsoon climate lasted about 200 years before recovering to the previous conditions, which we still see today."`,
    },
    {
      label: 'F',
      content:
        `It has long been thought that other great Bronze Age civilisations also declined at a similar time, with a global-scale climate event being seen as the cause. While it is possible that these local-scale processes were linked, the real archaeological interest lies in understanding the impact of these larger-scale events on different environments and different populations. "Considering the vast area of the Harappan Civilisation with its variable weather systems," explains Singh, "it is essential that we obtain more climate data from areas close to the two great cities at Mohenjodaro and Harappa and also from the Indian Punjab."`,
    },
    {
      label: 'G',
      content:
        "Petrie and Singh's team is now examining archaeological records and trying to understand details of how people led their lives in the region five millennia ago. They are analysing grains cultivated at the time, and trying to work out whether they were grown under extreme conditions of water stress, and whether they were adjusting the combinations of crops they were growing for different weather systems. They are also looking at whether the types of pottery used, and other aspects of their material culture, were distinctive to specific regions or were more similar across larger areas. This gives us insight into the types of interactive networks that the population was involved in, and whether those changed.",
    },
    {
      label: 'H',
      content:
        'Petrie believes that archaeologists are in a unique position to investigate how past societies responded to environmental and climatic change. "By investigating responses to environmental pressures and threats, we can learn from the past to engage with the public, and the relevant governmental and administrative bodies, to be more proactive in issues such as the management and administration of water supply, the balance of urban and rural development, and the importance of preserving cultural heritage in the future."',
    },
  ],
  questions: [
    {
      id: 'har-v7-q27',
      number: 27,
      type: 'matching-information',
      groupTitle: 'Questions 27-31',
      instruction: 'Reading Passage 3 has eight paragraphs, A-H. Which paragraph contains the following information?',
      text: 'proposed explanations for the decline of the Harappan Civilisation',
      options: paragraphOptionsAtoH,
      correctAnswer: 'C',
      location: 'Paragraph C',
    },
    {
      id: 'har-v7-q28',
      number: 28,
      type: 'matching-information',
      text: 'a reference to a present-day application of some archaeological research findings',
      options: paragraphOptionsAtoH,
      correctAnswer: 'H',
      location: 'Paragraph H',
    },
    {
      id: 'har-v7-q29',
      number: 29,
      type: 'matching-information',
      text: 'a difference between the Harappan Civilisation and another culture of the same period',
      options: paragraphOptionsAtoH,
      correctAnswer: 'A',
      location: 'Paragraph A',
    },
    {
      id: 'har-v7-q30',
      number: 30,
      type: 'matching-information',
      text: 'a description of some features of Harappan urban design',
      options: paragraphOptionsAtoH,
      correctAnswer: 'B',
      location: 'Paragraph B',
    },
    {
      id: 'har-v7-q31',
      number: 31,
      type: 'matching-information',
      text: 'a reference to the discovery of errors made by previous archaeologists',
      options: paragraphOptionsAtoH,
      correctAnswer: 'D',
      location: 'Paragraph D',
    },
    {
      id: 'har-v7-q32',
      number: 32,
      type: 'summary-completion',
      groupTitle: 'Questions 32-36',
      instruction: 'Choose ONE WORD ONLY from the passage for each answer.',
      text: 'By collecting the ______ of snails and analysing them, researchers discovered evidence of a change in water levels.',
      correctAnswer: 'shells',
      location: 'Paragraph E',
    },
    {
      id: 'har-v7-q33',
      number: 33,
      type: 'summary-completion',
      text: 'They discovered evidence of a change in water levels in a ______ in the region.',
      correctAnswer: 'lake',
      location: 'Paragraph E',
    },
    {
      id: 'har-v7-q34',
      number: 34,
      type: 'summary-completion',
      text: 'This occurred when there was less ______ than evaporation.',
      correctAnswer: 'rainfall',
      location: 'Paragraph E',
    },
    {
      id: 'har-v7-q35',
      number: 35,
      type: 'summary-completion',
      text: "Petrie and Singh's team are now using archaeological records to look at ______ from five millennia ago.",
      correctAnswer: 'grains',
      location: 'Paragraph G',
    },
    {
      id: 'har-v7-q36',
      number: 36,
      type: 'summary-completion',
      text: 'They are also examining objects including ______, to find out about links between inhabitants of different parts of the region.',
      correctAnswer: 'pottery',
      location: 'Paragraph G',
    },
    {
      id: 'har-v7-q37',
      number: 37,
      type: 'matching-information',
      groupTitle: 'Questions 37-40',
      instruction: 'Match each statement with the correct person.',
      text: 'Finding further information about changes to environmental conditions in the region is vital.',
      options: harappanPeopleOptions,
      correctAnswer: 'B',
      location: 'Paragraph F',
    },
    {
      id: 'har-v7-q38',
      number: 38,
      type: 'matching-information',
      text: 'Examining previous patterns of behaviour may have long-term benefits.',
      options: harappanPeopleOptions,
      correctAnswer: 'A',
      location: 'Paragraph H',
    },
    {
      id: 'har-v7-q39',
      number: 39,
      type: 'matching-information',
      text: 'Rough calculations indicate the approximate length of a period of water shortage.',
      options: harappanPeopleOptions,
      correctAnswer: 'D',
      location: 'Paragraph E',
    },
    {
      id: 'har-v7-q40',
      number: 40,
      type: 'matching-information',
      text: 'Information about the decline of the Harappan Civilisation has been lacking.',
      options: harappanPeopleOptions,
      correctAnswer: 'A',
      location: 'Paragraph B',
    },
  ],
}

export const fullReadingTest7: IELTSTest = {
  id: 'ielts-reading-full-vol7',
  title: 'IELTS Reading Full Test 7 - The coconut palm, Baby talk, Harappan Civilisation',
  type: 'Academic',
  module: 'Reading',
  duration: 60,
  totalQuestions: 40,
  sections: [passage1, passage2, passage3],
}
