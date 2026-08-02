import type { IELTSTest, Section } from '../types/ieltsTypes'

const paragraphOptionsAtoG = ['A', 'B', 'C', 'D', 'E', 'F', 'G']

const explorationPeopleOptions = [
  'A. Peter Fleming',
  'B. Ran Fiennes',
  'C. Chris Bonington',
  'D. Robin Hanbury-Tenison',
  'E. Wilfred Thesiger',
]

const passage1: Section = {
  id: 'nutmeg-p1-v8',
  title: 'Reading Passage 1: Nutmeg - a valuable spice',
  paragraphs: [
    {
      label: 'A',
      content:
        "The nutmeg tree, Myristica fragrans, is a large evergreen tree native to Southeast Asia. Until the late 18th century, it only grew in one place in the world: a small group of islands in the Banda Sea, part of the Moluccas - or Spice Islands - in northeastern Indonesia. The tree is thickly branched with dense foliage of tough, dark green oval leaves, and produces small, yellow, bell-shaped flowers and pale yellow pear-shaped fruits. The fruit is encased in a fleshy husk. When the fruit is ripe, this husk splits into two halves along a ridge running the length of the fruit. Inside is a purple-brown shiny seed, 2-3 cm long by about 2 cm across, surrounded by a lacy red or crimson covering called an 'aril'. These are the sources of the two spices nutmeg and mace, the former being produced from the dried seed and the latter from the aril.",
    },
    {
      label: 'B',
      content:
        'Nutmeg was a highly prized and costly ingredient in European cuisine in the Middle Ages, and was used as a flavouring, medicinal, and preservative agent. Throughout this period, the Arabs were the exclusive importers of the spice to Europe. They sold nutmeg for high prices to merchants based in Venice, but they never revealed the exact location of the source of this extremely valuable commodity. The Arab-Venetian dominance of the trade finally ended in 1512, when the Portuguese reached the Banda Islands and began exploiting its precious resources.',
    },
    {
      label: 'C',
      content:
        'Always in danger of competition from neighbouring Spain, the Portuguese began subcontracting their spice distribution to Dutch traders. Profits began to flow into the Netherlands, and the Dutch commercial fleet swiftly grew into one of the largest in the world. The Dutch quietly gained control of most of the shipping and trading of spices in Northern Europe. Then, in 1580, Portugal fell under Spanish rule, and by the end of the 16th century the Dutch found themselves locked out of the market. As prices for pepper, nutmeg, and other spices soared across Europe, they decided to fight back.',
    },
    {
      label: 'D',
      content:
        'In 1602, Dutch merchants founded the VOC, a trading corporation better known as the Dutch East India Company. By 1617, the VOC was the richest commercial operation in the world. The company had 50,000 employees worldwide, with a private army of 30,000 men and a fleet of 200 ships. At the same time, thousands of people across Europe were dying of the plague, a highly contagious and deadly disease. Doctors were desperate for a way to stop the spread of this disease, and they decided nutmeg held the cure. Everybody wanted nutmeg, and many were willing to spare no expense to have it. Nutmeg bought for a few pennies in Indonesia could be sold for 68,000 times its original cost on the streets of London. The only problem was the short supply. And that is where the Dutch found their opportunity.',
    },
    {
      label: 'E',
      content:
        'The Banda Islands were ruled by local sultans who insisted on maintaining a neutral trading policy towards foreign powers. This allowed them to avoid the presence of Portuguese or Spanish troops on their soil, but it also left them unprotected from other invaders. In 1621, the Dutch arrived and took over. Once securely in control of the Bandas, the Dutch went to work protecting their new investment. They concentrated all nutmeg production into a few easily guarded areas, uprooting and destroying any trees outside the plantation zones. Anyone caught growing a nutmeg seedling or carrying seeds without the proper authority was severely punished. In addition, all exported nutmeg was covered with lime to make sure there was no chance a fertile seed which could be grown elsewhere would leave the islands. There was only one obstacle to Dutch domination. One of the Banda Islands, a sliver of land called Run, only 3 km long by less than 1 km wide, was under the control of the British. After decades of fighting for control of this tiny island, the Dutch and British arrived at a compromise settlement, the Treaty of Breda, in 1667. Intent on securing their hold over every nutmeg-producing island, the Dutch offered a trade: if the British would give them the island of Run, they would in turn give Britain a distant and much less valuable island in North America. The British agreed. That other island was Manhattan, which is how New Amsterdam became New York. The Dutch now had a monopoly over the nutmeg trade which would last for another century.',
    },
    {
      label: 'F',
      content:
        'Then, in 1770, a Frenchman named Pierre Poivre successfully smuggled nutmeg plants to safety in Mauritius, an island off the coast of Africa. Some of these were later exported to the Caribbean where they thrived, especially on the island of Grenada. Next, in 1778, a volcanic eruption in the Banda region caused a tsunami that wiped out half the nutmeg groves. Finally, in 1809, the British returned to Indonesia and seized the Banda Islands by force. They returned the islands to the Dutch in 1817, but not before transplanting hundreds of nutmeg seedlings to plantations in several locations across southern Asia. The Dutch nutmeg monopoly was over.',
    },
    {
      label: 'G',
      content:
        'Today, nutmeg is grown in Indonesia, the Caribbean, India, Malaysia, Papua New Guinea and Sri Lanka, and world nutmeg production is estimated to average between 10,000 and 12,000 tonnes per year.',
    },
  ],
  questions: [
    {
      id: 'nutmeg-v8-q1',
      number: 1,
      type: 'note-completion',
      groupTitle: 'Questions 1-4',
      instruction: 'Choose ONE WORD ONLY from the passage for each answer.',
      text: 'the leaves of the tree are ______ in shape',
      correctAnswer: 'oval',
      location: 'Paragraph A',
    },
    {
      id: 'nutmeg-v8-q2',
      number: 2,
      type: 'note-completion',
      text: 'the ______ surrounds the fruit and breaks open when the fruit is ripe',
      correctAnswer: 'husk',
      location: 'Paragraph A',
    },
    {
      id: 'nutmeg-v8-q3',
      number: 3,
      type: 'note-completion',
      text: 'the ______ is used to produce the spice nutmeg',
      correctAnswer: 'seed',
      location: 'Paragraph A',
    },
    {
      id: 'nutmeg-v8-q4',
      number: 4,
      type: 'note-completion',
      text: 'the covering known as the aril is used to produce ______',
      correctAnswer: 'mace',
      location: 'Paragraph A',
    },
    {
      id: 'nutmeg-v8-q5',
      number: 5,
      type: 'true-false-not-given',
      groupTitle: 'Questions 5-7',
      instruction:
        'Choose TRUE if the statement agrees with the information, FALSE if the statement contradicts the information, or NOT GIVEN if there is no information on this.',
      text: 'In the Middle Ages, most Europeans knew where nutmeg was grown.',
      correctAnswer: 'FALSE',
      location: 'Paragraph B',
    },
    {
      id: 'nutmeg-v8-q6',
      number: 6,
      type: 'true-false-not-given',
      text: "The VOC was the world's first major trading company.",
      correctAnswer: 'NOT GIVEN',
      location: 'Paragraph D',
    },
    {
      id: 'nutmeg-v8-q7',
      number: 7,
      type: 'true-false-not-given',
      text: 'Following the Treaty of Breda, the Dutch had control of all the islands where nutmeg grew.',
      correctAnswer: 'TRUE',
      location: 'Paragraph E',
    },
    {
      id: 'nutmeg-v8-q8',
      number: 8,
      type: 'note-completion',
      groupTitle: 'Questions 8-13',
      instruction: 'Complete the table below. Write ONLY ONE WORD from the passage.',
      text: 'Nutmeg was brought to Europe by the ______',
      correctAnswer: 'Arabs',
      location: 'Paragraph B',
    },
    {
      id: 'nutmeg-v8-q9',
      number: 9,
      type: 'note-completion',
      text: 'Demand for nutmeg grew, as it was believed to be effective against the disease known as the ______',
      correctAnswer: 'plague',
      location: 'Paragraph D',
    },
    {
      id: 'nutmeg-v8-q10',
      number: 10,
      type: 'note-completion',
      text: 'The Dutch put ______ on nutmeg to avoid it being cultivated outside the islands',
      correctAnswer: 'lime',
      location: 'Paragraph E',
    },
    {
      id: 'nutmeg-v8-q11',
      number: 11,
      type: 'note-completion',
      text: 'The Dutch finally obtained the island of ______ from the British',
      correctAnswer: 'Run',
      location: 'Paragraph E',
    },
    {
      id: 'nutmeg-v8-q12',
      number: 12,
      type: 'note-completion',
      text: '1770 - nutmeg plants were secretly taken to ______',
      correctAnswer: 'Mauritius',
      location: 'Paragraph F',
    },
    {
      id: 'nutmeg-v8-q13',
      number: 13,
      type: 'note-completion',
      text: "1778 - half the Banda Islands' nutmeg plantations were destroyed by a ______",
      correctAnswer: 'tsunami',
      location: 'Paragraph F',
    },
  ],
}

const passage2: Section = {
  id: 'driverless-cars-p2-v8',
  title: 'Reading Passage 2: Driverless cars',
  paragraphs: [
    {
      label: 'A',
      content:
        "The automotive sector is well used to adapting to automation in manufacturing. The implementation of robotic car manufacture from the 1970s onwards led to significant cost savings and improvements in the reliability and flexibility of vehicle mass production. A new challenge to vehicle production is now on the horizon and, again, it comes from automation. However, this time it is not to do with the manufacturing process, but with the vehicles themselves.\n\nResearch projects on vehicle automation are not new. Vehicles with limited self-driving capabilities have been around for more than 50 years, resulting in significant contributions towards driver assistance systems. But since Google announced in 2010 that it had been trialling self-driving cars on the streets of California, progress in this field has quickly gathered pace.",
    },
    {
      label: 'B',
      content:
        "There are many reasons why technology is advancing so fast. One frequently cited motive is safety; indeed, research at the UK's Transport Research Laboratory has demonstrated that more than 90 percent of road collisions involve human error as a contributory factor, and it is the primary cause in the vast majority. Automation may help to reduce the incidence of this.\n\nAnother aim is to free the time people spend driving for other purposes. If the vehicle can do some or all of the driving, it may be possible to be productive, to socialise or simply to relax while automation systems have responsibility for safe control of the vehicle. If the vehicle can do the driving, those who are challenged by existing mobility models - such as older or disabled travellers - may be able to enjoy significantly greater travel autonomy.",
    },
    {
      label: 'C',
      content:
        'Beyond these direct benefits, we can consider the wider implications for transport and society, and how manufacturing processes might need to respond as a result. At present, the average car spends more than 90 percent of its life parked. Automation means that initiatives for car-sharing become much more viable, particularly in urban areas with significant travel demand. If a significant proportion of the population choose to use shared automated vehicles, mobility demand can be met by far fewer vehicles.',
    },
    {
      label: 'D',
      content:
        'The Massachusetts Institute of Technology investigated automated mobility in Singapore, finding that fewer than 30 percent of the vehicles currently used would be required if fully automated car sharing could be implemented. If this is the case, it might mean that we need to manufacture far fewer vehicles to meet demand. However, the number of trips being taken would probably increase, partly because empty vehicles would have to be moved from one customer to the next.\n\nModelling work by the University of Michigan Transportation Research Institute suggests automated vehicles might reduce vehicle ownership by 43 percent, but that vehicles\' average annual mileage would double as a result. As a consequence, each vehicle would be used more intensively, and might need replacing sooner. This faster rate of turnover may mean that vehicle production will not necessarily decrease.',
    },
    {
      label: 'E',
      content:
        'Automation may prompt other changes in vehicle manufacture. If we move to a model where consumers are tending not to own a single vehicle but to purchase access to a range of vehicles through a mobility provider, drivers will have the freedom to select one that best suits their needs for a particular journey, rather than making a compromise across all their requirements.\n\nSince, for most of the time, most of the seats in most cars are unoccupied, this may boost production of a smaller, more efficient range of vehicles that suit the needs of individuals. Specialised vehicles may then be available for exceptional journeys, such as going on a family camping trip or helping a son or daughter move to university.',
    },
    {
      label: 'F',
      content:
        'There are a number of hurdles to overcome in delivering automated vehicles to our roads. These include the technical difficulties in ensuring that the vehicle works reliably in the infinite range of traffic, weather and road situations it might encounter; the regulatory challenges in understanding how liability and enforcement might change when drivers are no longer essential for vehicle operation; and the societal changes that may be required for communities to trust and accept automated vehicles as being a valuable part of the mobility landscape.',
    },
    {
      label: 'G',
      content:
        "It is clear that there are many challenges that need to be addressed but, through robust and targeted research, these can most probably be conquered within the next 10 years. Mobility will change in such potentially significant ways and in association with so many other technological developments, such as telepresence and virtual reality, that it is hard to make concrete predictions about the future. However, one thing is certain: change is coming, and the need to be flexible in response to this will be vital for those involved in manufacturing the vehicles that will deliver future mobility.",
    },
  ],
  questions: [
    {
      id: 'driverless-v8-q14',
      number: 14,
      type: 'matching-information',
      groupTitle: 'Questions 14-18',
      instruction: 'Which paragraph contains the following information? Choose the correct letter, A-G.',
      text: 'reference to the amount of time when a car is not in use',
      options: paragraphOptionsAtoG,
      correctAnswer: 'C',
      location: 'Paragraph C',
    },
    {
      id: 'driverless-v8-q15',
      number: 15,
      type: 'matching-information',
      text: 'mention of several advantages of driverless vehicles for individual road-users',
      options: paragraphOptionsAtoG,
      correctAnswer: 'B',
      location: 'Paragraph B',
    },
    {
      id: 'driverless-v8-q16',
      number: 16,
      type: 'matching-information',
      text: 'reference to the opportunity of choosing the most appropriate vehicle for each trip',
      options: paragraphOptionsAtoG,
      correctAnswer: 'E',
      location: 'Paragraph E',
    },
    {
      id: 'driverless-v8-q17',
      number: 17,
      type: 'matching-information',
      text: 'an estimate of how long it will take to overcome a number of problems',
      options: paragraphOptionsAtoG,
      correctAnswer: 'G',
      location: 'Paragraph G',
    },
    {
      id: 'driverless-v8-q18',
      number: 18,
      type: 'matching-information',
      text: 'a suggestion that the use of driverless cars may have no effect on the number of vehicles manufactured',
      options: paragraphOptionsAtoG,
      correctAnswer: 'D',
      location: 'Paragraph D',
    },
    {
      id: 'driverless-v8-q19',
      number: 19,
      type: 'summary-completion',
      groupTitle: 'Questions 19-22',
      instruction: 'Choose NO MORE THAN TWO WORDS from the passage for each answer.',
      text: 'Figures from the Transport Research Laboratory indicate that most motor accidents are partly due to ______.',
      correctAnswer: 'human error',
      location: 'Paragraph B',
    },
    {
      id: 'driverless-v8-q20',
      number: 20,
      type: 'summary-completion',
      text: 'In addition to the direct benefits of automation, schemes for ______ will be more workable, especially in towns and cities.',
      correctAnswer: 'car sharing',
      location: 'Paragraph C',
    },
    {
      id: 'driverless-v8-q21',
      number: 21,
      type: 'summary-completion',
      text: 'According to the University of Michigan Transportation Research Institute, there could be a 43 percent drop in ______ of cars.',
      correctAnswer: 'ownership',
      location: 'Paragraph D',
    },
    {
      id: 'driverless-v8-q22',
      number: 22,
      type: 'summary-completion',
      text: 'However, this would mean that the yearly ______ of each car would, on average, be twice as high as it is currently.',
      correctAnswer: 'mileage',
      location: 'Paragraph D',
    },
    {
      id: 'driverless-v8-q23',
      number: 23,
      type: 'five-true-statements',
      groupTitle: 'Questions 23-24',
      instruction: 'Choose TWO letters, A-E.',
      text: 'Which TWO benefits of automated vehicles does the writer mention?',
      options: [
        'A. Car travellers could enjoy considerable cost savings.',
        'B. It would be easier to find parking spaces in urban areas.',
        'C. Travellers could spend journeys doing something other than driving.',
        'D. People who find driving physically difficult could travel independently.',
        'E. A reduction in the number of cars would mean a reduction in pollution.',
      ],
      correctAnswer: ['C', 'D'],
      location: 'Paragraph B',
    },
    {
      id: 'driverless-v8-q25',
      number: 25,
      type: 'five-true-statements',
      groupTitle: 'Questions 25-26',
      instruction: 'Choose TWO letters, A-E.',
      text: 'Which TWO challenges to automated vehicle development does the writer mention?',
      options: [
        'A. making sure the general public has confidence in automated vehicles',
        'B. managing the pace of transition from conventional to automated vehicles',
        'C. deciding how to compensate professional drivers who become redundant',
        'D. setting up the infrastructure to make roads suitable for automated vehicles',
        'E. getting automated vehicles to adapt to various different driving conditions',
      ],
      correctAnswer: ['A', 'E'],
      location: 'Paragraph F',
    },
  ],
}

const passage3: Section = {
  id: 'what-is-exploration-p3-v8',
  title: 'Reading Passage 3: What is exploration?',
  paragraphs: [
    {
      label: 'A',
      content:
        "We are all explorers. Our desire to discover, and then share that new-found knowledge, is part of what makes us human - indeed, this has played an important part in our success as a species. Long before the first caveman slumped down beside the fire and grunted news that there were plenty of wildebeest over yonder, our ancestors had learnt the value of sending out scouts to investigate the unknown. This questing nature of ours undoubtedly helped our species spread around the globe, just as it nowadays no doubt helps the last nomadic Penan maintain their existence in the depleted forests of Borneo, and a visitor negotiate the subways of New York.",
    },
    {
      label: 'B',
      content:
        "Over the years, we have come to think of explorers as a peculiar breed - different from the rest of us, different from those of us who are merely 'well travelled', even; and perhaps there is a type of person more suited to seeking out the new, a type of caveman more inclined to risk venturing out. That, however, does not take away from the fact that we all have this enquiring instinct, even today; and that in all sorts of professions - whether artist, marine biologist or astronomer - borders of the unknown are being tested each day.",
    },
    {
      label: 'C',
      content:
        'Thomas Hardy set some of his novels in Egdon Heath, a fictional area of uncultivated land, and used the landscape to suggest the desires and fears of his characters. He is delving into matters we all recognise because they are common to humanity. This is surely an act of exploration, and into a world as remote as the author chooses. Explorer and travel writer Peter Fleming talks of the moment when the explorer returns to the existence he has left behind with his loved ones. The traveller "who has for weeks or months seen himself only as a puny and irrelevant alien crawling laboriously over a country in which he has no roots and no background, suddenly encounters his other self, a relatively solid figure, with a place in the minds of certain people".',
    },
    {
      label: 'D',
      content:
        "In this book about the exploration of the earth's surface, I have confined myself to those whose travels were real and who also aimed at more than personal discovery. But that still left me with another problem: the word 'explorer' has become associated with a past era. We think back to a golden age, as if exploration peaked somehow in the 19th century - as if the process of discovery is now on the decline, though the truth is that we have named only one and a half million of this planet's species, and there may be more than 10 million - and that is not including bacteria. We have studied only 5 percent of the species we know. We have scarcely mapped the ocean floors, and know even less about ourselves; we fully understand the workings of only 10 percent of our brains.",
    },
    {
      label: 'E',
      content:
        `Here is how some of today's "explorers" define the word. Ran Fiennes, dubbed the "greatest living explorer", said, "An explorer is someone who has done something that no human has done before - and also done something scientifically useful." Chris Bonington, a leading mountaineer, felt exploration was to be found in the act of physically touching the unknown: "You have to have gone somewhere new." Then Robin Hanbury-Tenison, a campaigner on behalf of remote so-called "tribal" peoples, said, "A traveller simply records information about some far-off world, and reports back; but an explorer 'changes' the world." Wilfred Thesiger, who crossed Arabia's Empty Quarter in 1946, and belongs to an era of unmechanised travel now lost to the rest of us, told me, "If I had gone across by camel when I could have gone by car, it would have been a stunt." To him, exploration meant bringing back information from a remote place regardless of any great self-discovery.`,
    },
    {
      label: 'F',
      content:
        'Each definition is slightly different - and tends to reflect the field of endeavour of each pioneer. It was the same whoever I asked: the prominent historian would say exploration was a thing of the past, the cutting-edge scientist would say it was of the present. And so on. They each set their own particular criteria; the common factor in their approach being that they all had, unlike many of us who simply enjoy travel or discovering new things, both a very definite objective from the outset and also a desire to record their findings.',
    },
    {
      label: 'G',
      content:
        "I had best declare my own bias. As a writer, I am interested in the exploration of ideas. I have done a great many expeditions and each one was unique. I have lived for months alone with isolated groups of people all around the world, even two 'uncontacted tribes'. But none of these things is of the slightest interest to anyone unless, through my books, I have found a new slant, explored a new idea.",
    },
    {
      label: 'H',
      content:
        'Why? Because the world has moved on. The time has long passed for the great continental voyages - another walk to the poles, another crossing of the Empty Quarter. We know how the land surface of our planet lies; exploration of it is now down to the details - the habits of microbes, say, or the grazing behaviour of buffalo. Aside from the deep sea and deep underground, it is the era of specialists. However, this is to disregard the role the human mind has in conveying remote places; and this is what interests me: how a fresh interpretation, even of a well-travelled route, can give its readers new insights.',
    },
  ],
  questions: [
    {
      id: 'explore-v8-q27',
      number: 27,
      type: 'multiple-choice',
      groupTitle: 'Question 27',
      instruction: 'Choose the correct letter, A, B, C or D.',
      text: 'The writer refers to visitors to New York to illustrate the point that',
      options: [
        'exploration is an intrinsic element of being human.',
        'most people are enthusiastic about exploring.',
        'exploration can lead to surprising results.',
        'most people find exploration daunting.',
      ],
      correctAnswer: 'A',
      location: 'Paragraph A',
    },
    {
      id: 'explore-v8-q28',
      number: 28,
      type: 'multiple-choice',
      groupTitle: 'Question 28',
      instruction: 'Choose the correct letter, A, B, C or D.',
      text: "According to the second paragraph, what is the writer's view of explorers?",
      options: [
        'Their discoveries have brought both benefits and disadvantages.',
        'Their main value is in teaching others.',
        'They act on an urge that is common to everyone.',
        'They tend to be more attracted to certain professions than to others.',
      ],
      correctAnswer: 'C',
      location: 'Paragraph B',
    },
    {
      id: 'explore-v8-q29',
      number: 29,
      type: 'multiple-choice',
      groupTitle: 'Question 29',
      instruction: 'Choose the correct letter, A, B, C or D.',
      text: 'The writer refers to a description of Egdon Heath to suggest that',
      options: [
        'Hardy was writing about his own experience of exploration.',
        'Hardy was mistaken about the nature of exploration.',
        "Hardy's aim was to investigate people's emotional states.",
        "Hardy's aim was to show the attraction of isolation.",
      ],
      correctAnswer: 'C',
      location: 'Paragraph C',
    },
    {
      id: 'explore-v8-q30',
      number: 30,
      type: 'multiple-choice',
      groupTitle: 'Question 30',
      instruction: 'Choose the correct letter, A, B, C or D.',
      text: "In the fourth paragraph, the writer refers to 'a golden age' to suggest that",
      options: [
        'the amount of useful information produced by exploration has decreased.',
        'fewer people are interested in exploring than in the 19th century.',
        'recent developments have made exploration less exciting.',
        'we are wrong to think that exploration is no longer necessary.',
      ],
      correctAnswer: 'D',
      location: 'Paragraph D',
    },
    {
      id: 'explore-v8-q31',
      number: 31,
      type: 'multiple-choice',
      groupTitle: 'Question 31',
      instruction: 'Choose the correct letter, A, B, C or D.',
      text: 'In the sixth paragraph, when discussing the definition of exploration, the writer argues that',
      options: [
        'certain people are likely to misunderstand the nature of exploration.',
        'exploration can lead to surprising results.',
        'most people find exploration daunting.',
        'people tend to relate exploration to their own professional interests.',
      ],
      correctAnswer: 'D',
      location: 'Paragraph F',
    },
    {
      id: 'explore-v8-q32',
      number: 32,
      type: 'multiple-choice',
      groupTitle: 'Question 32',
      instruction: 'Choose the correct letter, A, B, C or D.',
      text: 'In the last paragraph, the writer explains that he is interested in',
      options: [
        "how someone's personality is reflected in their choice of places to visit.",
        'the human ability to cast new light on places that may be familiar.',
        'how travel writing has evolved to meet changing demands.',
        'the feelings that writers develop about the places that they explore.',
      ],
      correctAnswer: 'B',
      location: 'Paragraph H',
    },
    {
      id: 'explore-v8-q33',
      number: 33,
      type: 'matching-information',
      groupTitle: 'Questions 33-37',
      instruction: 'Choose the correct letter. NB You may use any letter more than once.',
      text: 'He referred to the relevance of the form of transport used.',
      options: explorationPeopleOptions,
      correctAnswer: 'E',
      location: 'Paragraph E',
    },
    {
      id: 'explore-v8-q34',
      number: 34,
      type: 'matching-information',
      text: 'He described feelings on coming back home after a long journey.',
      options: explorationPeopleOptions,
      correctAnswer: 'A',
      location: 'Paragraph C',
    },
    {
      id: 'explore-v8-q35',
      number: 35,
      type: 'matching-information',
      text: 'He worked for the benefit of specific groups of people.',
      options: explorationPeopleOptions,
      correctAnswer: 'D',
      location: 'Paragraph E',
    },
    {
      id: 'explore-v8-q36',
      number: 36,
      type: 'matching-information',
      text: 'He did not consider learning about oneself an essential part of exploration.',
      options: explorationPeopleOptions,
      correctAnswer: 'E',
      location: 'Paragraph E',
    },
    {
      id: 'explore-v8-q37',
      number: 37,
      type: 'matching-information',
      text: 'He defined exploration as being both unique and of value to others.',
      options: explorationPeopleOptions,
      correctAnswer: 'B',
      location: 'Paragraph E',
    },
    {
      id: 'explore-v8-q38',
      number: 38,
      type: 'summary-completion',
      groupTitle: 'Questions 38-40',
      instruction: 'Choose NO MORE THAN TWO WORDS from the passage for each answer.',
      text: 'The writer has encountered a wide variety of ______.',
      correctAnswer: 'expeditions|unique expeditions',
      location: 'Paragraph G',
    },
    {
      id: 'explore-v8-q39',
      number: 39,
      type: 'summary-completion',
      text: 'He was the first outsider many previously ______ individuals had met.',
      correctAnswer: 'uncontacted|isolated',
      location: 'Paragraph G',
    },
    {
      id: 'explore-v8-q40',
      number: 40,
      type: 'summary-completion',
      text: "He believes there is no need to further explore Earth's ______, except to address specific questions.",
      correctAnswer: 'land surface|surface',
      location: 'Paragraph H',
    },
  ],
}

export const fullReadingTest8: IELTSTest = {
  id: 'ielts-reading-full-vol8',
  title: 'IELTS Reading Full Test 8 - Nutmeg, Driverless cars, What is exploration?',
  type: 'Academic',
  module: 'Reading',
  duration: 60,
  totalQuestions: 40,
  sections: [passage1, passage2, passage3],
}
