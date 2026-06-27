// TOEFL iBT practice content. The test has four sections — Reading, Listening,
// Speaking and Writing — each scaled 0–30 for a total of 0–120. Reading and
// Listening are objectively scored here (multiple choice); Speaking and Writing
// are timed practice with model-answer guidance (graded by AI/teacher, like the
// real test). Listening "audio" is provided as a transcript so it works offline.

export type ToeflChoiceQuestion = {
  id: string
  prompt: string
  options: string[]
  answerIndex: number
  explanation?: string
}

export type ToeflReadingSection = {
  title: string
  source: string
  passage: string[]
  questions: ToeflChoiceQuestion[]
}

export type ToeflListeningSection = {
  title: string
  context: string
  transcript: string[]
  questions: ToeflChoiceQuestion[]
}

export type ToeflSpeakingTask = {
  id: string
  kind: 'Independent' | 'Integrated'
  title: string
  prompt: string
  prepSeconds: number
  responseSeconds: number
  tips: string[]
}

export type ToeflWritingTask = {
  id: string
  kind: 'Integrated' | 'Academic Discussion'
  title: string
  prompt: string
  minutes: number
  minWords: number
  tips: string[]
}

export type ToeflTest = {
  id: string
  title: string
  level: 'Foundation' | 'Intermediate' | 'Advanced'
  blurb: string
  durationMin: number
  reading: ToeflReadingSection
  listening: ToeflListeningSection
  speaking: ToeflSpeakingTask[]
  writing: ToeflWritingTask[]
}

export const TOEFL_TESTS: ToeflTest[] = [
  {
    id: 'toefl-practice-1',
    title: 'TOEFL iBT Practice Test 1',
    level: 'Intermediate',
    blurb: 'A full academic set: a biology reading passage, a history lecture, four speaking tasks and two writing tasks.',
    durationMin: 95,
    reading: {
      title: 'Reading — Academic Passage',
      source: 'Environmental Science',
      passage: [
        'Coral reefs are among the most biologically productive ecosystems on Earth, yet they occupy less than one percent of the ocean floor. Built over thousands of years by tiny animals called polyps, reefs depend on a partnership between the coral and microscopic algae known as zooxanthellae. The algae live inside the coral tissue and, through photosynthesis, supply the coral with most of the energy it needs to grow. In return, the coral provides the algae with shelter and the compounds required for photosynthesis.',
        'This partnership, however, is remarkably sensitive to temperature. When ocean water warms by even one or two degrees Celsius above the normal summer maximum, the relationship breaks down. The coral expels the algae, losing both its color and its main food source — an event known as bleaching. A bleached coral is not yet dead; if cooler conditions return quickly, the algae can recolonize the tissue. But if high temperatures persist for weeks, the coral starves and dies, leaving behind a bare limestone skeleton.',
        'The consequences of widespread bleaching extend far beyond the reef itself. Roughly a quarter of all marine species rely on reefs for food or shelter at some stage of their lives. When reefs collapse, fish populations decline, and the coastal communities that depend on those fish for protein and income suffer as well. Reefs also act as natural breakwaters, absorbing much of the energy of incoming waves and protecting shorelines from erosion and storm damage.',
        'Scientists have proposed several responses. Some focus on reducing local stresses — limiting pollution, overfishing and coastal construction — so that reefs are healthier and better able to recover from heat events. Others are experimenting with "assisted evolution," selectively breeding corals that tolerate warmer water, then transplanting them onto damaged reefs. Critics caution that such interventions treat symptoms rather than the underlying cause, and that without limits on the greenhouse gases driving ocean warming, even heat-tolerant corals may eventually be overwhelmed.',
      ],
      questions: [
        {
          id: 'r1',
          prompt: 'According to the passage, what does the coral receive from the zooxanthellae?',
          options: ['A limestone skeleton', 'Most of its energy', 'Protection from waves', 'Cooler water temperatures'],
          answerIndex: 1,
          explanation: 'Paragraph 1: the algae "supply the coral with most of the energy it needs to grow."',
        },
        {
          id: 'r2',
          prompt: 'The word "expels" in paragraph 2 is closest in meaning to',
          options: ['absorbs', 'feeds', 'drives out', 'protects'],
          answerIndex: 2,
          explanation: '"Expels the algae" means it forces the algae out of its tissue.',
        },
        {
          id: 'r3',
          prompt: 'Which of the following is true of a bleached coral?',
          options: [
            'It has already died and cannot recover.',
            'It can survive if cooler conditions return quickly.',
            'It contains more algae than a healthy coral.',
            'It grows faster than a healthy coral.',
          ],
          answerIndex: 1,
          explanation: 'Paragraph 2: "if cooler conditions return quickly, the algae can recolonize the tissue."',
        },
        {
          id: 'r4',
          prompt: 'Why does the author mention that reefs act as "natural breakwaters"?',
          options: [
            'To explain how polyps build reefs',
            'To illustrate a benefit reefs provide to coastlines',
            'To argue that reefs cannot be saved',
            'To describe the process of photosynthesis',
          ],
          answerIndex: 1,
          explanation: 'Paragraph 3 lists shoreline protection as one of the wider benefits of reefs.',
        },
        {
          id: 'r5',
          prompt: 'What is "assisted evolution" as described in paragraph 4?',
          options: [
            'Reducing pollution near reefs',
            'Breeding heat-tolerant corals and transplanting them',
            'Removing all fish from damaged reefs',
            'Cooling the ocean artificially',
          ],
          answerIndex: 1,
          explanation: 'It is "selectively breeding corals that tolerate warmer water, then transplanting them."',
        },
        {
          id: 'r6',
          prompt: 'What concern do critics raise about interventions like assisted evolution?',
          options: [
            'They are too expensive for most countries.',
            'They address symptoms but not the underlying cause of warming.',
            'They harm the fish that depend on reefs.',
            'They make corals more sensitive to heat.',
          ],
          answerIndex: 1,
          explanation: 'Critics say such efforts "treat symptoms rather than the underlying cause."',
        },
        {
          id: 'r7',
          prompt: 'What is the main idea of the passage?',
          options: [
            'Coral reefs are dangerous to coastal communities.',
            'Reefs are valuable but vulnerable, and saving them requires addressing warming.',
            'Zooxanthellae are harmful to coral.',
            'Bleaching has no effect on marine life.',
          ],
          answerIndex: 1,
          explanation: 'The passage explains the value of reefs, the threat of bleaching, and proposed responses.',
        },
      ],
    },
    listening: {
      title: 'Listening — Academic Lecture',
      context: 'Listen to part of a lecture in a history class. The professor is discussing the printing press.',
      transcript: [
        'Professor: So today I want to talk about a piece of technology that, arguably, reshaped Europe more than almost any other — the printing press, developed by Johannes Gutenberg around 1440. Now, you might assume Gutenberg invented printing itself. He did not. Block printing had existed in East Asia for centuries. What Gutenberg created was something more specific: a system of movable metal type that made printing fast, cheap, and repeatable on a large scale.',
        'Before the press, books in Europe were copied by hand, usually by monks. A single Bible could take a scribe well over a year to produce, which made books extraordinarily expensive — owned mainly by the church, universities, and the wealthy. Within fifty years of Gutenberg\'s press, that changed completely. By the year 1500, print shops had appeared in more than two hundred and fifty European cities, and millions of books were in circulation.',
        'Here\'s where it gets interesting for historians. Cheaper books meant more people learned to read, and more readers created demand for even more books — a self-reinforcing cycle. But the effects went beyond literacy. Ideas could now spread faster than any authority could control them. When Martin Luther posted his criticisms of the church in 1517, printed copies spread across Germany in weeks, not years. Many scholars argue the Reformation simply could not have happened the way it did without the press.',
        'There\'s a lesson here that applies to technology in general. Gutenberg\'s goal was modest — he wanted to produce Bibles more efficiently. He had no plan to transform religion, science, or politics. Yet the unintended consequences of his invention were enormous. So when we evaluate a new technology, we shouldn\'t only ask what it was designed to do. We should ask what it makes newly possible.',
      ],
      questions: [
        {
          id: 'l1',
          prompt: 'What is the main topic of the lecture?',
          options: [
            'How monks copied books by hand',
            'The printing press and its wider effects on Europe',
            'The life of Johannes Gutenberg',
            'The history of reading in East Asia',
          ],
          answerIndex: 1,
          explanation: 'The professor focuses on the press and how it "reshaped Europe."',
        },
        {
          id: 'l2',
          prompt: 'According to the professor, what did Gutenberg actually invent?',
          options: [
            'Printing itself',
            'Block printing',
            'A system of movable metal type',
            'The first European book',
          ],
          answerIndex: 2,
          explanation: '"What Gutenberg created was... a system of movable metal type."',
        },
        {
          id: 'l3',
          prompt: 'Why does the professor mention that block printing existed in East Asia?',
          options: [
            'To prove Gutenberg copied his idea',
            'To clarify that Gutenberg did not invent printing itself',
            'To explain why books were expensive',
            'To describe the Reformation',
          ],
          answerIndex: 1,
          explanation: 'He corrects the assumption that Gutenberg "invented printing itself."',
        },
        {
          id: 'l4',
          prompt: 'What does the professor say about books before the press?',
          options: [
            'They were printed in over 250 cities.',
            'They were copied by hand and very expensive.',
            'They were owned mainly by ordinary workers.',
            'They could be produced in a few days.',
          ],
          answerIndex: 1,
          explanation: 'Books were "copied by hand, usually by monks" and "extraordinarily expensive."',
        },
        {
          id: 'l5',
          prompt: 'How does the professor connect the press to the Reformation?',
          options: [
            'The press was invented during the Reformation.',
            "Luther's printed criticisms spread quickly because of the press.",
            'The church used the press to stop Luther.',
            'The Reformation reduced the number of books.',
          ],
          answerIndex: 1,
          explanation: "Printed copies of Luther's criticisms \"spread across Germany in weeks.\"",
        },
        {
          id: 'l6',
          prompt: 'What broader lesson does the professor draw at the end?',
          options: [
            'Technology should only be judged by its intended purpose.',
            'We should ask what a technology makes newly possible, not just what it was designed to do.',
            'Most inventions fail to change society.',
            'Religion always resists new technology.',
          ],
          answerIndex: 1,
          explanation: 'He concludes we should ask "what it makes newly possible."',
        },
      ],
    },
    speaking: [
      {
        id: 's1',
        kind: 'Independent',
        title: 'Task 1 — Personal preference',
        prompt:
          'Some students prefer to study alone, while others prefer to study in groups. Which do you prefer, and why? Use specific reasons and examples to support your answer.',
        prepSeconds: 15,
        responseSeconds: 45,
        tips: [
          'State your preference clearly in the first sentence.',
          'Give two reasons, each with a short example.',
          'Aim to keep speaking for the full 45 seconds.',
        ],
      },
      {
        id: 's2',
        kind: 'Integrated',
        title: 'Task 2 — Campus situation',
        prompt:
          'Reading: The university announces it will close the library two hours earlier each night to save energy. Listening (summary): A student disagrees — she says many students study late and the change will hurt those who work during the day. Now, state the student\'s opinion and explain the reasons she gives.',
        prepSeconds: 30,
        responseSeconds: 60,
        tips: [
          'First state the announcement, then the student\'s opinion.',
          'Report BOTH reasons the student gives — do not add your own opinion.',
          'Use reporting language: "She thinks...", "She points out that...".',
        ],
      },
      {
        id: 's3',
        kind: 'Integrated',
        title: 'Task 3 — Academic concept',
        prompt:
          'Reading (summary): "Diminishing returns" means that adding more of one input eventually produces smaller and smaller increases in output. Listening (summary): A professor gives the example of studying — the first hours of review help a lot, but after many hours, each extra hour adds little. Explain diminishing returns using the professor\'s example.',
        prepSeconds: 30,
        responseSeconds: 60,
        tips: [
          'Define the concept in one clear sentence.',
          'Then explain the example step by step.',
          'Connect the example back to the definition at the end.',
        ],
      },
      {
        id: 's4',
        kind: 'Integrated',
        title: 'Task 4 — Academic lecture',
        prompt:
          'Listening (summary): A biology professor explains two ways animals stay warm in cold climates: behavioral (huddling together, migrating) and physical (thick fur, layers of fat). Using points and examples from the lecture, explain the two ways animals adapt to the cold.',
        prepSeconds: 20,
        responseSeconds: 60,
        tips: [
          'Organize your answer around the two categories.',
          'Give at least one example for each.',
          'Keep your summary objective — report what the professor said.',
        ],
      },
    ],
    writing: [
      {
        id: 'w1',
        kind: 'Integrated',
        title: 'Task 1 — Integrated Writing',
        prompt:
          'Reading (summary): A passage argues that switching the campus to a four-day class week would (1) save energy, (2) give students more study time, and (3) reduce commuting costs. Listening (summary): A professor challenges each point — energy use barely changes because buildings stay open, longer daily classes reduce real study time, and most students live on campus so commuting savings are tiny. Summarize the points made in the lecture, explaining how they cast doubt on the points in the reading.',
        minutes: 20,
        minWords: 150,
        tips: [
          'Do NOT give your own opinion — only report the relationship between the lecture and the reading.',
          'Organize into three body paragraphs, one per point.',
          'Use contrast language: "However, the professor argues...".',
        ],
      },
      {
        id: 'w2',
        kind: 'Academic Discussion',
        title: 'Task 2 — Writing for an Academic Discussion',
        prompt:
          'Your professor is teaching a class on education. Write a post responding to the question: "Should universities require all students to take at least one course outside their major (for example, an engineering student taking a history course)? Why or why not?" State your opinion and support it. A strong response is usually 100+ words.',
        minutes: 10,
        minWords: 100,
        tips: [
          'State a clear position in your first sentence.',
          'Give a specific reason and a concrete example.',
          'You may briefly acknowledge another classmate\'s likely view, then extend the discussion.',
        ],
      },
    ],
  },
  {
    id: 'toefl-practice-2',
    title: 'TOEFL iBT Practice Test 2',
    level: 'Advanced',
    blurb: 'A second full set with an astronomy reading passage, a business lecture, and four speaking and two writing tasks.',
    durationMin: 95,
    reading: {
      title: 'Reading — Academic Passage',
      source: 'Astronomy',
      passage: [
        'For most of human history, the planets were the only worlds anyone could imagine orbiting a star other than the Sun, yet no one had ever detected one. The difficulty is fundamental: planets do not produce their own light, and they sit beside stars that are millions of times brighter. Trying to see a planet next to its star has been compared to spotting a firefly next to a searchlight from thousands of kilometers away. For decades, "extrasolar planets," or exoplanets, remained purely theoretical.',
        'The breakthrough came not from seeing planets directly but from measuring their effects. A planet and its star both orbit their shared center of mass, so a star with a planet wobbles slightly. As the star moves toward Earth and then away, the wavelength of its light is compressed and then stretched — a shift astronomers can measure with great precision. In 1995, this "radial velocity" method revealed a planet orbiting the star 51 Pegasi, the first confirmed exoplanet around a Sun-like star.',
        'A second, even more productive technique soon followed: the transit method. If a planet\'s orbit happens to pass between its star and Earth, the planet blocks a tiny fraction of the star\'s light, causing a small, regular dip in brightness. By staring at hundreds of thousands of stars at once, space telescopes such as Kepler detected thousands of planets this way. The depth of the dip reveals the planet\'s size, and the time between dips reveals the length of its year.',
        'These discoveries overturned long-held assumptions. Astronomers had expected other solar systems to resemble our own, with small rocky worlds close to the star and giants farther out. Instead, they found enormous planets orbiting their stars in just a few days, and systems packed far more tightly than ours. The sheer variety suggested that planet formation is far more chaotic and diverse than the tidy model based on a single example — our own — had implied.',
      ],
      questions: [
        {
          id: 'r1',
          prompt: 'Why were exoplanets so difficult to detect directly?',
          options: [
            'They move too quickly across the sky.',
            'They produce no light and sit beside far brighter stars.',
            'They are smaller than asteroids.',
            'They orbit too far from any star.',
          ],
          answerIndex: 1,
          explanation: 'Paragraph 1: planets "do not produce their own light" and sit beside very bright stars.',
        },
        {
          id: 'r2',
          prompt: 'The comparison to "a firefly next to a searchlight" is used to emphasize',
          options: [
            'how fast planets move',
            'how hard it is to see a faint planet beside a bright star',
            'how hot stars are',
            'how large exoplanets can be',
          ],
          answerIndex: 1,
          explanation: 'It illustrates the difficulty of detecting a dim object beside a brilliant one.',
        },
        {
          id: 'r3',
          prompt: 'How does the radial velocity method detect a planet?',
          options: [
            'By photographing the planet directly',
            'By measuring the slight wobble of the star and the resulting shift in its light',
            'By measuring the planet\'s temperature',
            'By detecting radio signals from the planet',
          ],
          answerIndex: 1,
          explanation: 'The star "wobbles," shifting the wavelength of its light, which can be measured.',
        },
        {
          id: 'r4',
          prompt: 'What does the depth of the brightness dip in the transit method reveal?',
          options: ['The planet\'s temperature', 'The planet\'s size', 'The star\'s age', 'The planet\'s color'],
          answerIndex: 1,
          explanation: 'Paragraph 3: "The depth of the dip reveals the planet\'s size."',
        },
        {
          id: 'r5',
          prompt: 'According to the passage, what had astronomers expected other solar systems to look like?',
          options: [
            'Completely empty of planets',
            'Similar to our own, with rocky worlds near the star and giants farther out',
            'Made entirely of gas giants',
            'Without any large planets',
          ],
          answerIndex: 1,
          explanation: 'They expected systems to "resemble our own."',
        },
        {
          id: 'r6',
          prompt: 'What did the actual discoveries suggest about planet formation?',
          options: [
            'It is identical in every system.',
            'It is far more chaotic and diverse than expected.',
            'It only occurs around Sun-like stars.',
            'It always produces small planets.',
          ],
          answerIndex: 1,
          explanation: 'The "sheer variety suggested that planet formation is far more chaotic and diverse."',
        },
        {
          id: 'r7',
          prompt: 'What is the best summary of the passage?',
          options: [
            'Exoplanets cannot be detected with current technology.',
            'Indirect methods let astronomers find many exoplanets and revealed surprising diversity.',
            'Our solar system is typical of all others.',
            'The transit method is the only way to find planets.',
          ],
          answerIndex: 1,
          explanation: 'The passage explains detection methods and the surprising diversity they revealed.',
        },
      ],
    },
    listening: {
      title: 'Listening — Academic Lecture',
      context: 'Listen to part of a lecture in a business class. The professor is discussing brand loyalty.',
      transcript: [
        'Professor: When we talk about why companies are so valuable, we often focus on their products. But some of the most valuable things a company owns aren\'t physical at all. Today I want to look at one of them: brand loyalty. Brand loyalty is the tendency of customers to keep buying from the same company, even when competitors offer similar products, sometimes at lower prices.',
        'Now, why would a rational customer pay more for essentially the same thing? Part of the answer is trust. Choosing a product takes effort and carries risk — what if it\'s low quality? A familiar brand reduces that uncertainty. The customer has been satisfied before, so they expect to be satisfied again. In a sense, the brand is a promise, and loyalty is the customer betting that the promise will be kept.',
        'There\'s also an emotional dimension. Companies work hard to associate their brands with identities and feelings — adventure, sophistication, belonging. When customers feel that a brand reflects who they are, switching to a competitor feels like giving up part of their identity, not just changing products. That emotional bond can be far stronger than any price difference.',
        'But here\'s the catch, and it\'s an important one. Loyalty is fragile. It is built slowly, over many positive experiences, but it can be destroyed quickly by a single serious failure — a safety scandal, a data breach, poor treatment of customers. And once trust is broken, it is far harder and more expensive to rebuild than it was to create in the first place. So for a company, brand loyalty is a powerful asset, but it is one that has to be protected constantly.',
      ],
      questions: [
        {
          id: 'l1',
          prompt: 'What is the main topic of the lecture?',
          options: ['How companies set prices', 'Brand loyalty and why it matters', 'The cost of advertising', 'How to design a product'],
          answerIndex: 1,
          explanation: 'The professor announces the topic is brand loyalty.',
        },
        {
          id: 'l2',
          prompt: 'How does the professor define brand loyalty?',
          options: [
            'Buying the cheapest available product',
            'The tendency to keep buying from the same company even when competitors are similar or cheaper',
            'Switching brands frequently',
            'Owning physical assets',
          ],
          answerIndex: 1,
          explanation: 'That is the definition given in the first paragraph.',
        },
        {
          id: 'l3',
          prompt: 'According to the professor, how does a familiar brand reduce risk for customers?',
          options: [
            'By always being the cheapest',
            'By acting as a promise based on past satisfaction',
            'By offering free products',
            'By preventing competitors from existing',
          ],
          answerIndex: 1,
          explanation: 'The brand is "a promise," and past satisfaction reduces uncertainty.',
        },
        {
          id: 'l4',
          prompt: 'What is the "emotional dimension" of brand loyalty the professor describes?',
          options: [
            'Customers feel angry when prices rise.',
            'Customers feel a brand reflects their identity, so switching feels like a loss.',
            'Customers enjoy comparing many brands.',
            'Customers ignore brands entirely.',
          ],
          answerIndex: 1,
          explanation: 'Switching "feels like giving up part of their identity."',
        },
        {
          id: 'l5',
          prompt: 'What does the professor say is the "catch" with brand loyalty?',
          options: [
            'It is illegal in some countries.',
            'It is fragile and can be destroyed quickly by a serious failure.',
            'It only works for cheap products.',
            'It cannot be measured.',
          ],
          answerIndex: 1,
          explanation: 'Loyalty "can be destroyed quickly by a single serious failure."',
        },
        {
          id: 'l6',
          prompt: 'What does the professor imply companies should do about brand loyalty?',
          options: [
            'Ignore it and focus only on price.',
            'Protect it constantly because rebuilding lost trust is hard and expensive.',
            'Sell it to competitors.',
            'Replace it with advertising.',
          ],
          answerIndex: 1,
          explanation: 'He concludes loyalty "has to be protected constantly."',
        },
      ],
    },
    speaking: [
      {
        id: 's1',
        kind: 'Independent',
        title: 'Task 1 — Personal preference',
        prompt:
          'Do you agree or disagree with the following statement? "It is better to have a few close friends than many casual ones." Use specific reasons and examples to support your answer.',
        prepSeconds: 15,
        responseSeconds: 45,
        tips: ['Pick one side clearly.', 'Two reasons with examples.', 'Use the whole 45 seconds.'],
      },
      {
        id: 's2',
        kind: 'Integrated',
        title: 'Task 2 — Campus situation',
        prompt:
          'Reading: The university plans to replace printed course catalogs with an online-only system to cut costs. Listening (summary): A student supports it — he says the online version can be updated instantly and is easier to search. State the student\'s opinion and the reasons he gives.',
        prepSeconds: 30,
        responseSeconds: 60,
        tips: ['State the proposal, then the opinion.', 'Report both reasons.', 'Use reporting verbs.'],
      },
      {
        id: 's3',
        kind: 'Integrated',
        title: 'Task 3 — Academic concept',
        prompt:
          'Reading (summary): "The bystander effect" is the tendency for people to be less likely to help someone in trouble when other people are present. Listening (summary): A professor describes an experiment in which people in a crowded room were slower to react to smoke than people who were alone. Explain the bystander effect using the experiment.',
        prepSeconds: 30,
        responseSeconds: 60,
        tips: ['Define it first.', 'Explain the experiment.', 'Link the example to the definition.'],
      },
      {
        id: 's4',
        kind: 'Integrated',
        title: 'Task 4 — Academic lecture',
        prompt:
          'Listening (summary): A professor explains two strategies plants use to survive drought: reducing water loss (small, waxy leaves) and storing water (thick stems, deep roots). Using the lecture, explain the two strategies and give an example of each.',
        prepSeconds: 20,
        responseSeconds: 60,
        tips: ['Use the two categories.', 'One example each.', 'Stay objective.'],
      },
    ],
    writing: [
      {
        id: 'w1',
        kind: 'Integrated',
        title: 'Task 1 — Integrated Writing',
        prompt:
          'Reading (summary): A passage claims that introducing wolves back into a national park would be harmful: (1) wolves would kill too many deer, (2) they would threaten nearby livestock, and (3) they would scare away tourists. Listening (summary): A professor responds — deer numbers are currently too high and damaging the forest, ranchers can be compensated and use guard animals, and in other parks wolves have actually attracted more tourists. Summarize the professor\'s points and explain how they respond to the reading.',
        minutes: 20,
        minWords: 150,
        tips: ['No personal opinion.', 'Three body paragraphs, one per point.', 'Use contrast language.'],
      },
      {
        id: 'w2',
        kind: 'Academic Discussion',
        title: 'Task 2 — Writing for an Academic Discussion',
        prompt:
          'Your professor is teaching a class on technology and society. Write a post responding to: "Some people believe smartphones should be banned in schools; others believe they are useful learning tools. What is your view?" State your opinion and support it. A strong response is usually 100+ words.',
        minutes: 10,
        minWords: 100,
        tips: ['Clear position first.', 'Specific reason + example.', 'Acknowledge and extend a likely opposing view.'],
      },
    ],
  },
]

export function getToeflTest(id: string): ToeflTest | undefined {
  return TOEFL_TESTS.find((t) => t.id === id)
}
