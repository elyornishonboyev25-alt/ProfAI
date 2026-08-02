import { IELTSTest, Section } from '../types/ieltsTypes'

const paragraphOptionsAtoF = ['A', 'B', 'C', 'D', 'E', 'F']

const passage2DragOptions = [
  'Susanna Tol',
  'Greg Spotts',
  'Yanira Pineda',
  'Elizabeth English',
  'Raisa Chowdhury',
]

const passage1: Section = {
  id: 'georgia-okeeffe-p1',
  title: "Reading Passage 1: Georgia O'Keeffe",
  paragraphs: [
    {
      label: 'A',
      content:
        "For seven decades, Georgia O'Keeffe (1887-1986) was a major figure in American art. Remarkably, she remained independent from shifting art trends and her work stayed true to her own vision, which was based on finding the essential, abstract forms in nature. With exceptionally keen powers of observation and great finesse with a paintbrush, she recorded subtle nuances of colour, shape, and light that enlivened her paintings and attracted a wide audience.",
    },
    {
      label: 'B',
      content:
        "Born in 1887 near Sun Prairie, Wisconsin to cattle breeders Francis and Ida O'Keeffe, Georgia was raised on their farm along with her six siblings. By the time she graduated from high school in 1905, she had determined to make her way as an artist. She studied the techniques of traditional painting at the Art Institute of Chicago school (1905) and the Art Students League of New York (1907-8). After attending university and then training college, she became an art teacher and taught in elementary schools, high schools, and colleges in Virginia, Texas, and South Carolina from 1911 to 1918.",
    },
    {
      label: 'C',
      content:
        "During this period, O'Keeffe began to experiment with creating abstract compositions in charcoal, and produced a series of innovative drawings that led her art in a new direction. She sent some of these drawings to a friend in New York, who showed them to art collector and photographer Alfred Stieglitz in January 1916. Stieglitz was impressed, and exhibited the drawings later that year at his gallery on Fifth Avenue, New York City, where the works of many avant-garde artists and photographers were introduced to the American public.",
    },
    {
      label: 'D',
      content:
        "With Stieglitz's encouragement and promise of financial support, O'Keeffe arrived in New York in June 1918 to begin a career as an artist. For the next three decades, Stieglitz vigorously promoted her work in twenty-two solo exhibitions and numerous group installations. The two were married in 1924. The ups and downs of their personal and professional relationship were recorded in Stieglitz's celebrated black-and-white portraits of O'Keeffe, taken over the course of twenty years (1917-37).",
    },
    {
      label: 'E',
      content:
        "By the mid-1920s, O'Keeffe was recognized as one of America's most important and successful artists, widely known for the architectural pictures that dramatically depict the soaring skyscrapers of New York. But most often, she painted botanical subjects, inspired by annual trips to the Stieglitz family summer home. In her magnified images depicting flowers, begun in 1924, O'Keeffe brings the viewer right into the picture.",
    },
    {
      label: 'F',
      content:
        "Enlarging the tiniest details to fill an entire metre-wide canvas emphasized their shapes and lines and made them appear abstract. Such daring compositions helped establish O'Keeffe's reputation as an innovative modernist.",
    },
    {
      label: 'G',
      content:
        "In 1929, O'Keeffe made her first extended trip to the state of New Mexico. It was a visit that had a lasting impact on her life, and an immediate effect on her work. Over the next two decades she made almost annual trips to New Mexico, staying up to six months there, painting in relative solitude, then returning to New York each winter to exhibit the new work at Stieglitz's gallery. This pattern continued until she moved permanently to New Mexico in 1949.",
    },
    {
      label: 'H',
      content:
        "There, O'Keeffe found new inspiration: at first, it was the numerous sun-bleached bones she came across in the state's rugged terrain that sparked her imagination. Two of her earliest and most celebrated Southwestern paintings exquisitely reproduce a cow skull's weathered surfaces, jagged edges, and irregular openings. Later, she also explored another variation on this theme in her large series of Pelvis pictures, which focused on the contrasts between convex and concave surfaces, and solid and open spaces. However, it was the region's spectacular landscape, with its unusual geological formations, vivid colours, clarity of light, and exotic vegetation, that held the artist's imagination for more than four decades. Often, she painted the rocks, cliffs, and mountains in striking close-up, just as she had done with her botanical subjects.",
    },
    {
      label: 'I',
      content:
        "O'Keeffe eventually owned two homes in New Mexico - the first, her summer retreat at Ghost Ranch, was nestled beneath 200-metre cliffs, while the second, used as her winter residence, was in the small town of Abiquiu. While both locales provided a wealth of imagery for her paintings, one feature of the Abiquiu house - the large walled patio with its black door - was particularly inspirational. In more than thirty pictures between 1946 and 1960, she reinvented the patio into an abstract arrangement of geometric shapes.",
    },
    {
      label: 'J',
      content:
        "From the 1950s into the 1970s, O'Keeffe travelled widely, making trips to Asia, the Middle East, and Europe. Flying in planes inspired her last two major series - aerial views of rivers and expansive paintings of the sky viewed from just above clouds. In both series, O'Keeffe increased the size of her canvases, sometimes to mural proportions, reflecting perhaps her newly expanded view of the world. When in 1965 she successfully translated one of her cloud motifs to a monumental canvas measuring 6 metres in length (with the help of assistants), it was an enormous challenge and a special feat for an artist nearing eighty years of age.",
    },
    {
      label: 'K',
      content:
        "The last two decades of the artist's life were relatively unproductive as ill health and blindness hindered her ability to work. O'Keeffe died in 1986 at the age of ninety-eight, but her rich legacy of some 900 paintings has continued to attract subsequent generations of artists and art lovers who derive inspiration from these very American images.",
    },
  ],
  questions: [
    {
      id: 'gok-q1',
      number: 1,
      type: 'summary-completion',
      groupTitle: 'Questions 1-7',
      instruction: 'Complete the notes. Write ONE WORD ONLY from the text for each answer.',
      text: "The life and work of Georgia O'Keeffe: studied art, then worked as a ______ in various places in the USA.",
      correctAnswer: 'teacher',
      location: 'Paragraph B',
    },
    {
      id: 'gok-q2',
      number: 2,
      type: 'summary-completion',
      text: 'created drawings using ______ which were exhibited in New York City.',
      correctAnswer: 'charcoal',
      location: 'Paragraph C',
    },
    {
      id: 'gok-q3',
      number: 3,
      type: 'summary-completion',
      text: "moved to New York and became famous for her paintings of the city's ______.",
      correctAnswer: 'skyscrapers',
      location: 'Paragraph E',
    },
    {
      id: 'gok-q4',
      number: 4,
      type: 'summary-completion',
      text: 'produced a series of innovative close-up paintings of ______.',
      correctAnswer: 'flowers',
      location: 'Paragraph E',
    },
    {
      id: 'gok-q5',
      number: 5,
      type: 'summary-completion',
      text: 'went to New Mexico and was initially inspired to paint the many ______ that could be found there.',
      correctAnswer: 'bones',
      location: 'Paragraph H',
    },
    {
      id: 'gok-q6',
      number: 6,
      type: 'summary-completion',
      text: 'continued to paint various features that together formed the dramatic ______ of New Mexico for over forty years.',
      correctAnswer: 'landscape',
      location: 'Paragraph H',
    },
    {
      id: 'gok-q7',
      number: 7,
      type: 'summary-completion',
      text: 'travelled widely by plane in later years, and painted pictures of clouds and ______ seen from above.',
      correctAnswer: 'rivers',
      location: 'Paragraph J',
    },
    {
      id: 'gok-q8',
      number: 8,
      type: 'true-false-not-given',
      groupTitle: 'Questions 8-13',
      instruction:
        'Choose TRUE if the statement agrees with the information in the text, choose FALSE if the statement contradicts the information, or choose NOT GIVEN if there is no information on this.',
      text: "Georgia O'Keeffe's style was greatly influenced by the changing fashions in art over the seven decades of her career.",
      correctAnswer: 'FALSE',
      location: 'Paragraph A',
    },
    {
      id: 'gok-q9',
      number: 9,
      type: 'true-false-not-given',
      text: "When O'Keeffe finished high school, she had already made her mind up about the career that she wanted.",
      correctAnswer: 'TRUE',
      location: 'Paragraph B',
    },
    {
      id: 'gok-q10',
      number: 10,
      type: 'true-false-not-given',
      text: "Alfred Stieglitz first discovered O'Keeffe's work when she sent some abstract drawings to his gallery in New York City.",
      correctAnswer: 'FALSE',
      location: 'Paragraph C',
    },
    {
      id: 'gok-q11',
      number: 11,
      type: 'true-false-not-given',
      text: "O'Keeffe was the subject of Stieglitz's photographic work for many years.",
      correctAnswer: 'TRUE',
      location: 'Paragraph D',
    },
    {
      id: 'gok-q12',
      number: 12,
      type: 'true-false-not-given',
      text: "O'Keeffe's paintings of the patio of her house in Abiquiu were among the artist's favourite works.",
      correctAnswer: 'NOT GIVEN',
      location: 'Paragraph I',
    },
    {
      id: 'gok-q13',
      number: 13,
      type: 'true-false-not-given',
      text: "O'Keeffe produced a greater quantity of work during the 1950s to 1970s than at any other time in her life.",
      correctAnswer: 'NOT GIVEN',
      location: 'Paragraphs J-K',
    },
  ],
}

const passage2: Section = {
  id: 'climate-adaptation-p2',
  title: 'Reading Passage 2: Adapting to the effects of climate change',
  paragraphs: [
    {
      label: 'A',
      content:
        "All around the world, nations are already preparing for, and adapting to, climate change and its impacts. Even if we stopped all CO2 emissions tomorrow, we would continue to see the impact of the CO2 already released since industrial times, with scientists forecasting that global warming would continue for around 40 years. In the meantime, ice caps would continue to melt and sea levels rise. Some countries and regions will suffer more extreme impacts from these changes than others. It's in these places that innovation is thriving.",
    },
    {
      label: 'B',
      content:
        "In Miami Beach, Florida, USA, seawater isn't just breaching the island city's walls, it's seeping up through the ground, so the only way to save the city is to lift it up above sea level. Starting in the lowest and most vulnerable neighbourhoods, roads have been raised by as much as 61 centimetres. The elevation work was carried out as part of Miami Beach's ambitious but much-needed stormwater-management programme. In addition to the road adaptations, the city has set up new pumps that can remove up to 75,000 litres of water per minute. In the face of floods, climate-mitigation strategies have often been overlooked, says Yanira Pineda, a senior sustainability coordinator. She knows that they're essential and that the job is far from over. 'We know that in 20, 30, 40 years, we'll need to go back in there and adjust to the changing environment,' she says.",
    },
    {
      label: 'C',
      content:
        "Seawalls are a staple strategy for many coastal communities, but on the soft, muddy northern shores of Java, Indonesia, they frequently collapse, further exacerbating coastal erosion. There have been many attempts to restore the island's coastal mangroves: ecosystems of trees and shrubs that help defend coastal areas by trapping sediment in their net-like root systems, elevating the sea bed and dampening the energy of waves and tidal currents. But Susanna Tol of the not-for-profit organisation Wetlands International says that, while hugely popular, the majority of mangrove-planting projects fail. So, Wetlands International started out with a different approach, building semi-permeable dams, made from bamboo poles and brushwood, to mimic the role of mangrove roots and create favourable conditions for mangroves to grow back naturally. The programme has seen moderate success, mainly in areas with less subsidence. 'Unfortunately, traditional infrastructure is often single-solution focused,' says Tol. 'For long-term success, it's critical that we transition towards multifunctional approaches that embed natural processes and that engage and benefit communities and local decision-makers.'",
    },
    {
      label: 'D',
      content:
        "As the floodwaters rose in the rice fields of the Mekong Delta in September 2018, four small houses rose with them. Homes in this part of Vietnam are traditionally built on stilts but these ones had been built to float. The modifications were made by the Buoyant Foundation Project, a not-for-profit organisation that has been researching and retrofitting amphibious houses since 2006. 'When I started this,' explains founder Elizabeth English, 'climate change was not on the tip of everybody's tongue, but this technology is becoming necessary in places that didn't previously need it.' It's much cheaper than permanently elevating houses, English explains - about a third of what it would cost to completely replace a building's foundations. It also avoids the problem of taller houses being at greater risk from wind damage. Another plus comes from the fact that amphibious structures can be sensitively adapted to meet cultural needs and match the kind of houses that are already common in a community.",
    },
    {
      label: 'E',
      content:
        "Bangladesh is especially vulnerable to climate change. Most of the country is less than a metre above sea level and 80 per cent of its land lies on floodplains. 'Almost 35 million people living on the coastal belt of Bangladesh are currently affected by soil and water salinity,' says Raisa Chowdhury of the international development organisation ICCO Cooperation. Rather than fighting against it, one project is helping communities adapt to salt-affected soils. ICCO Cooperation has been working with 10,000 farmers in Bangladesh to start cultivating naturally salt-tolerant crops in the region. Certain varieties of carrot, potato, kohlrabi, cabbage and beetroot have been found to be better suited to salty soil than the rice and wheat that is typically grown there. Chowdhury says that the results are very visible, comparing a barren plot of land to the 'beautiful, lush green vegetable garden' sitting beside it, in which he and his team have been working with the farmers. Since the project began, farmers trained in saline agriculture have reported increases of two to three more harvests per year.",
    },
    {
      label: 'F',
      content:
        "Greg Spotts from Los Angeles (LA) in the USA is chief sustainability officer of the city's street services department. He leads the Cool Streets LA programme, a series of pilot projects, which include the planting of trees and the installation of a 'cool pavement' system, designed to help reach the city's goal of bringing down its average temperature by 1.5C. 'Urban cooling is literally a matter of life and death for our future in LA,' says Spotts. Using a Geographic Information System data mapping tool, the programme identified streets with low tree canopy cover in three of the city's neighbourhoods and covered them with a light-grey, light-reflecting coating, which had already been shown to lower road surface temperature in Los Angeles by 6C. Spotts says one of these streets, in the Winnetka neighbourhood of San Fernando Valley, can now be seen as a pale crescent, the only cool spot on an otherwise red thermal image, from the International Space Station.",
    },
  ],
  questions: [
    {
      id: 'cca-q14',
      number: 14,
      type: 'matching-information',
      groupTitle: 'Questions 14-17',
      instruction:
        'The text has six sections A-F. Which section contains the following information? Choose the correct paragraph A-F.',
      text: 'how a type of plant functions as a natural protection for coastlines',
      options: paragraphOptionsAtoF,
      correctAnswer: 'C',
      location: 'Paragraph C',
    },
    {
      id: 'cca-q15',
      number: 15,
      type: 'matching-information',
      text: 'a prediction about how long it could take to stop noticing the effects of climate change',
      options: paragraphOptionsAtoF,
      correctAnswer: 'A',
      location: 'Paragraph A',
    },
    {
      id: 'cca-q16',
      number: 16,
      type: 'matching-information',
      text: 'a reference to the fact that a solution is particularly cost-effective',
      options: paragraphOptionsAtoF,
      correctAnswer: 'D',
      location: 'Paragraph D',
    },
    {
      id: 'cca-q17',
      number: 17,
      type: 'matching-information',
      text: 'a mention of a technology used to locate areas most in need of intervention',
      options: paragraphOptionsAtoF,
      correctAnswer: 'F',
      location: 'Paragraph F',
    },
    {
      id: 'cca-q18',
      number: 18,
      type: 'summary-completion',
      groupTitle: 'Questions 18-22',
      instruction: 'Complete the sentences. Write ONE WORD ONLY from the text for each answer.',
      text: 'The stormwater-management programme in Miami Beach has involved the installation of efficient ______.',
      correctAnswer: 'pumps',
      location: 'Paragraph B',
    },
    {
      id: 'cca-q19',
      number: 19,
      type: 'summary-completion',
      text: 'The construction of ______ was the first stage of a project to ensure the success of mangroves in Indonesia.',
      correctAnswer: 'dams',
      location: 'Paragraph C',
    },
    {
      id: 'cca-q20',
      number: 20,
      type: 'summary-completion',
      text: 'As a response to rising floodwaters in the Mekong Delta, a not-for-profit organisation has been building houses that can ______.',
      correctAnswer: 'float',
      location: 'Paragraph D',
    },
    {
      id: 'cca-q21',
      number: 21,
      type: 'summary-completion',
      text: 'Rising sea levels in Bangladesh have made it necessary to introduce various ______ that are suitable for areas of high salt content.',
      correctAnswer: 'crops',
      location: 'Paragraph E',
    },
    {
      id: 'cca-q22',
      number: 22,
      type: 'summary-completion',
      text: "A project in LA has increased the number of ______ on the city's streets.",
      correctAnswer: 'trees',
      location: 'Paragraph F',
    },
    {
      id: 'cca-q23',
      number: 23,
      type: 'drag-drop-summary',
      groupTitle: 'Questions 23-26',
      instruction: 'Complete the summary by dragging the correct words into the gaps.',
      text: 'It is essential to adopt strategies which involve and help residents of the region.\nInterventions which reduce heat are absolutely vital for our survival in this location.\nMore work will need to be done in future decades to deal with the impact of rising water levels.\nThe number of locations requiring action to adapt to flooding has grown in recent years.',
      options: passage2DragOptions,
      correctAnswer: ['Susanna Tol', 'Greg Spotts', 'Yanira Pineda', 'Elizabeth English'],
      location: 'Paragraphs B, C, D, F',
    },
  ],
}

const passage3: Section = {
  id: 'metropolis-p3',
  title: 'Reading Passage 3: Movie of Metropolis',
  paragraphs: [
    {
      label: 'A',
      content:
        'When German director Fritz Lang visited the United States in 1924, his first glimpse of the country was a night-time view of the New York skyline from the deck of an ocean liner. This, he later recalled, was the direct inspiration for what is still probably the most innovative and influential science-fiction film ever made - Metropolis.',
    },
    {
      label: 'B',
      content:
        "Metropolis is a bleak vision of the early twenty-first century that is at once both chilling and exhilarating. This spectacular city of the future is a technological marvel of high-rise buildings connected by elevated railways and airships. It's also a world of extreme inequality and social division. The workers live below ground and exist as machines working in an endless routine of mind-numbing 10-hour shifts while the city's elite lead lives of luxury high above. Presiding over them all is the Master of Metropolis, John Fredersen, whose sole satisfaction seems to lie in the exercise of power.",
    },
    {
      label: 'C',
      content:
        "Lang's graphic depiction of the future is conceived in almost totally abstract terms. The function of the individual machines is never defined. Instead, this mass of dials, levers and gauges symbolically stands for all machines and all industry, with the workers as slave-like extensions of the equipment they have to operate. Lang emphasizes this idea in the famous shift-change sequence at the start of the movie when the workers walk in zombie-like geometric ranks, all dressed in the same dark overalls and all exhibiting the same bowed head and dead-eyed stare. An extraordinary fantasy sequence sees one machine transformed into a huge open-jawed statue which then literally swallows them up.",
    },
    {
      label: 'D',
      content:
        "On one level the machines and the exploited workers simply provide the wealth and services which allow the elite to live their lives of leisure, but on a more profound level, the purpose of all this demented industry is to serve itself. Power, control and the continuance of the system from one 10-hour shift to the next is all that counts. The city consumes people and their labour and in the process becomes a perverse parody of a living being.",
    },
    {
      label: 'E',
      content:
        "It is enlightening, I think, to relate the film to the modern global economy in which multinational corporations now routinely close their factories in one continent so that they can take advantage of cheap labour in another. Like the industry in Metropolis, these corporations' goals of increased efficiency and profits have little to do with the welfare of the majority of their employees or that of the population at large. Instead, their aims are to sustain the momentum of their own growth and to increase the monetary rewards to a tiny elite - their executives and shareholders. Fredersen himself is the essence of the big company boss: Rupert Murdoch would probably feel perfectly at home in his huge skyscraper office with its panoramic view of the city below. And it is important that there is never any mention of government in Metropolis - the whole concept is by implication obsolete. The only people who have power are the supreme industrialist, Fredersen, and his magician/scientist cohort Rotwang.",
    },
    {
      label: 'F',
      content:
        "So far so good: when the images are allowed to speak for themselves the film is impeccable both in its symbolism and in its cynicism. The problem with Metropolis is its sentimental story-line, which sees Freder, Fredersen's son, instantly falling in love with the visionary Maria. Maria leads an underground pseudo-religious movement and preaches that the workers should not rebel but should await the arrival of a 'Mediator' between the 'Head' (capital) and the 'Hands' (labour). That mediator is the 'Heart' - love, as embodied, finally, by Freder's love of Maria and his father's love of him.",
    },
    {
      label: 'G',
      content:
        "Lang wrote the screenplay in collaboration with his then-wife Thea von Harbou. In 1933 he fled from the Nazis (and continued a very successful career in Hollywood). She stayed in Germany and continued to make films under the Hitler regime. There is a constant tension within the film between the too-tidy platitudes of von Harbou's script and the uncompromisingly caustic vigour of Lang's imagery.",
    },
    {
      label: 'H',
      content:
        "To my mind, both in Metropolis and in the real world, it's not so much that the 'Head' and 'Hands' require a 'Heart' to mediate between them but that the 'Hands' need to develop their own 'Head', their own political consciousness, and act accordingly - through the ballot box, through buying power and through a sceptical resistance to the materialistic fantasies of the Fredersens.",
    },
    {
      label: 'I',
      content:
        "All the same, Metropolis is probably more accurate now as a representation of industrial and social relations than it has been at any time since its original release. And Fredersen is certainly still the most potent movie symbol of the handful of elusive corporate figureheads who increasingly treat the world as a Metropolis-like global village.",
    },
  ],
  questions: [
    {
      id: 'met-q27',
      number: 27,
      type: 'yes-no-not-given',
      groupTitle: 'Questions 27-30',
      instruction:
        'Choose YES if the statement agrees with the information in the text, choose NO if the statement contradicts the information, or choose NOT GIVEN if there is no information on this.',
      text: "The inspiration of the movie - Metropolis - comes from the director's visit in the USA in 1924.",
      correctAnswer: 'YES',
      location: 'Paragraph A',
    },
    {
      id: 'met-q28',
      number: 28,
      type: 'yes-no-not-given',
      text: 'The Master of Metropolis, John Fredersen, is portrayed from an industrialist that the director met in the US.',
      correctAnswer: 'NOT GIVEN',
      location: 'Paragraphs A-B',
    },
    {
      id: 'met-q29',
      number: 29,
      type: 'yes-no-not-given',
      text: 'The start of the movie exhibits the workers working in full energy.',
      correctAnswer: 'NO',
      location: 'Paragraph C',
    },
    {
      id: 'met-q30',
      number: 30,
      type: 'yes-no-not-given',
      text: 'The director and his wife got divorced because his wife decided to stay in Germany.',
      correctAnswer: 'NOT GIVEN',
      location: 'Paragraph G',
    },
    {
      id: 'met-q31',
      number: 31,
      type: 'summary-completion',
      groupTitle: 'Questions 31-36',
      instruction: 'Complete the summary. Write NO MORE THAN TWO WORDS from the text for each answer.',
      text: 'The director depicts a world of inequality and ______.',
      correctAnswer: 'social division',
      location: 'Paragraph B',
    },
    {
      id: 'met-q32',
      number: 32,
      type: 'summary-completion',
      text: 'In the future, the mindless masses of workers living underground are treated as ______.',
      correctAnswer: 'machines',
      location: 'Paragraph B',
    },
    {
      id: 'met-q33',
      number: 33,
      type: 'summary-completion',
      text: 'And the master of them is ______, who is in charge of the whole city.',
      correctAnswer: 'John Fredersen',
      location: 'Paragraph B',
    },
    {
      id: 'met-q34',
      number: 34,
      type: 'summary-completion',
      text: 'The writer claims that the director, Fritz Lang, presents the movie in almost totally ______ terms.',
      correctAnswer: 'abstract',
      location: 'Paragraph C',
    },
    {
      id: 'met-q35',
      number: 35,
      type: 'summary-completion',
      text: 'In this presentation, the ______ of the individual machines is not defined.',
      correctAnswer: 'function',
      location: 'Paragraph C',
    },
    {
      id: 'met-q36',
      number: 36,
      type: 'summary-completion',
      text: 'Besides, the writer compares the film to the modern global economy in which multinational corporations care more about increased ______ and profits.',
      correctAnswer: 'efficiency',
      location: 'Paragraph E',
    },
    {
      id: 'met-q37',
      number: 37,
      type: 'multiple-choice',
      groupTitle: 'Question 37',
      instruction: 'Choose the correct answer.',
      text: 'The first sentence in paragraph B indicates',
      options: [
        "the author's fear about technology",
        'the inspiration of the director',
        'the contradictory feelings towards future',
        "the city elite's well management of the workers",
      ],
      correctAnswer: 'C',
      location: 'Paragraph B',
    },
    {
      id: 'met-q38',
      number: 38,
      type: 'multiple-choice',
      groupTitle: 'Question 38',
      instruction: 'Choose the correct letter, A, B, C, or D.',
      text: 'Why the function of the individual machines is not defined?',
      options: [
        'Because Lang sticks to the theme in a symbolic way.',
        'Because workers are more important to exploit.',
        'Because the fantasy sequence is difficult to take.',
        'Because the focus of the movie is not about machines.',
      ],
      correctAnswer: 'A',
      location: 'Paragraph C',
    },
    {
      id: 'met-q39',
      number: 39,
      type: 'multiple-choice',
      groupTitle: 'Question 39',
      instruction: 'Choose the correct letter, A, B, C, or D.',
      text: "The writer's purpose in paragraph five is to",
      options: [
        "emphasize the multinational corporations' profit-oriented goal",
        'compare the movie with the reality in the modern global economy',
        'exploit the difference between fantasy and reality',
        'enlighten the undeveloped industry',
      ],
      correctAnswer: 'B',
      location: 'Paragraph E',
    },
    {
      id: 'met-q40',
      number: 40,
      type: 'multiple-choice',
      groupTitle: 'Question 40',
      instruction: 'Choose the correct letter, A, B, C, or D.',
      text: "What is the writer's opinion about the movie?",
      options: [
        "The movie's story-line is excellent.",
        'The movie has a poor implication in symbolism.',
        'The movie is perfect in all aspects.',
        'The movie is good but could be better.',
      ],
      correctAnswer: 'D',
      location: 'Paragraph F',
    },
  ],
}

export const fullReadingTest: IELTSTest = {
  id: 'ielts-reading-full-vol1',
  title: "IELTS Reading Full Test 1 - Georgia O'Keeffe, Climate Change, Metropolis",
  type: 'Academic',
  module: 'Reading',
  duration: 60,
  totalQuestions: 40,
  sections: [passage1, passage2, passage3],
}

export const fullReadingTests = [
  {
    id: 1,
    title: "IELTS Reading Full Test 1 - Georgia O'Keeffe, Climate Change, Metropolis",
    description: 'Official 3-passage full IELTS reading set with 40 questions and answer mapping.',
    level: 'HARD',
    duration: '60 minutes',
    questions: 40,
    rating: 5.0,
    year: 2026,
    tags: ['ACADEMIC', 'FULL MOCK', 'PASSAGE 1-2-3'],
  },
  {
    id: 2,
    title: 'IELTS Reading Full Test 2 - Kakapo, Return of the Elm, Stress and Judgement',
    description: 'Official 3-passage full IELTS reading set with 40 questions and answer mapping.',
    level: 'HARD',
    duration: '60 minutes',
    questions: 40,
    rating: 5.0,
    year: 2026,
    tags: ['ACADEMIC', 'FULL MOCK', 'PASSAGE 1-2-3'],
  },
  {
    id: 3,
    title: 'IELTS Academic Reading: Money Transfers & Social Impact',
    description: 'Full 3-passage test on fintech, road policy, and rural lighting.',
    level: 'HARD',
    duration: '60 minutes',
    questions: 40,
    rating: 4.9,
    year: 2026,
    tags: ['ACADEMIC', 'FULL TEST'],
  },
  {
    id: 4,
    title: 'IELTS Reading Full Test 4 - William Gilbert, Pacific Navigation, The Dingo Debate',
    description: 'Official 3-passage full IELTS reading set with 40 questions and answer mapping.',
    level: 'HARD',
    duration: '60 minutes',
    questions: 40,
    rating: 5.0,
    year: 2026,
    tags: ['ACADEMIC', 'FULL MOCK', 'PASSAGE 1-2-3'],
  },
  {
    id: 5,
    title: 'IELTS Reading Full Test 5 - Frozen Food, Coral Reefs, Robots and us',
    description: 'Official 3-passage full IELTS reading set with 40 questions and answer mapping.',
    level: 'HARD',
    duration: '60 minutes',
    questions: 40,
    rating: 5.0,
    year: 2026,
    tags: ['ACADEMIC', 'FULL MOCK', 'PASSAGE 1-2-3'],
  },
  {
    id: 6,
    title: "IELTS Reading Full Test 6 - Georgia O'Keeffe, Climate Change Adaptation, Guard Dogs",
    description: 'Official 3-passage full IELTS reading set with 40 questions and answer mapping.',
    level: 'HARD',
    duration: '60 minutes',
    questions: 40,
    rating: 5.0,
    year: 2026,
    tags: ['ACADEMIC', 'FULL MOCK', 'PASSAGE 1-2-3'],
  },
  {
    id: 7,
    title: 'IELTS Reading Full Test 7 - The coconut palm, Baby talk, Harappan Civilisation',
    description: 'Official 3-passage full IELTS reading set with 40 questions and answer mapping.',
    level: 'HARD',
    duration: '60 minutes',
    questions: 40,
    rating: 5.0,
    year: 2026,
    tags: ['ACADEMIC', 'FULL MOCK', 'PASSAGE 1-2-3'],
  },
  {
    id: 8,
    title: 'IELTS Reading Full Test 8 - Nutmeg, Driverless cars, What is exploration?',
    description: 'Official 3-passage full IELTS reading set with 40 questions and answer mapping.',
    level: 'HARD',
    duration: '60 minutes',
    questions: 40,
    rating: 5.0,
    year: 2026,
    tags: ['ACADEMIC', 'FULL MOCK', 'PASSAGE 1-2-3'],
  },
  {
    id: 9,
    title: 'IELTS Reading Full Test 9 - Dead Sea Scrolls, Tomato domestication, Insight or evolution?',
    description: 'Official 3-passage full IELTS reading set with 40 questions and answer mapping.',
    level: 'HARD',
    duration: '60 minutes',
    questions: 40,
    rating: 5.0,
    year: 2026,
    tags: ['ACADEMIC', 'FULL MOCK', 'PASSAGE 1-2-3'],
  },
  {
    id: 10,
    title: 'IELTS Reading Full Test 10 - Polar bears, Step Pyramid of Djoser, The future of work',
    description: 'Official 3-passage full IELTS reading set with 40 questions and answer mapping.',
    level: 'HARD',
    duration: '60 minutes',
    questions: 40,
    rating: 5.0,
    year: 2026,
    tags: ['ACADEMIC', 'FULL MOCK', 'PASSAGE 1-2-3'],
  },
]

