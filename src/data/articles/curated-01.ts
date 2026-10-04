import type { Article } from './types'

// Licensed reading editions. Original authors, citations and adaptation notices accompany every article.
export const curatedArticles1: Article[] = [
  {
    "id": "a005",
    "slug": "birds-and-their-extraordinary-sense-of-smell",
    "title": "Birds and Their Extraordinary Sense of Smell",
    "teaser": "Smell is one of the five senses we use to experience the world. It allows humans and other animals to find their food, avoid danger, and even recognize family members.",
    "category": "Science",
    "tags": [
      "biodiversity",
      "science",
      "olfactory system",
      "olfactory receptors",
      "genome",
      "ornithologist",
      "short read genome"
    ],
    "readMinutes": 9,
    "publishedLabel": "New",
    "cover": {
      "theme": "forest-emerald",
      "icon": "Compass",
      "motif": "SCIENCE"
    },
    "blocks": [
      {
        "type": "lead",
        "text": "Smell is one of the five senses we use to experience the world. It allows humans and other animals to find their food, avoid danger, and even recognize family members. Animals detect smells with olfactory receptors, special proteins that sit on the surface of the nose cells. These interact with odor molecules (small particles that have a smell) and send signals to the brain so the animal can perceive the smell. We know mammals have hundreds of olfactory receptors and can detect tens of thousands of smells, but what about birds? For decades, many people thought that birds did not use smell in their daily lives, but recent studies have shown that birds respond to smell. We show that many birds have a large number of olfactory receptors similar to mammals, strengthening the case for smell playing an important role in the life of birds."
      },
      {
        "type": "heading",
        "text": "What is Smell?"
      },
      {
        "type": "paragraph",
        "text": "Smell is one of the five senses that we use to perceive the world. An ancient sense shared by all animals, smell is a key way animals receive information about their environments. Animals detect and interpret odors using the olfactory system, which consists of the nose and the nasal cavities."
      },
      {
        "type": "paragraph",
        "text": "How does the olfactory system work? Imagine this scenario: you have been toiling away at your homework for 5 h. Exhausted, you lean back in your chair, keen on taking a break, when the promising smell of freshly oven-baked pizza wafts across your nose. Identifying the pizza via its smell seems like second nature to your famished self, but how did your brain do this in the first place? First the pizza smell is taken in by the nose. In the nose, there are proteins called olfactory receptors that detect odors. Olfactory receptors come in various shapes, allowing each receptor to match to and detect its own unique set of smells. For example, you can differentiate the smell of pizza from pancakes because the pizza odor molecule interacts with a different receptor than that of a pancake. Each receptor’s shape is determined by a unique DNA sequence or a “code”. DNA codes for olfactory receptors can be found within an organism’s entire set of genes, which is called the genome."
      },
      {
        "type": "paragraph",
        "text": "Different species have many different olfactory receptors in their noses. Humans have about 400 and other mammals have hundreds of olfactory receptors, too. Some mammals, such as elephants, can have over two thousand different kinds of olfactory receptors! This makes olfactory receptors the most numerous group of genes in all of vertebrates. Most studies of olfactory receptors have been done in mammals, like mice and humans. However, what about in other animals?"
      },
      {
        "type": "heading",
        "text": "Do Birds Have a Sense of Smell?"
      },
      {
        "type": "paragraph",
        "text": "For a long time, it was thought that most birds could not smell many odors. After all, birds are colorful, are often active during daylight hours, and some species sing beautiful songs. Therefore, people thought that birds do not use smell but instead have better vision and hearing. Early experiments on bird behavior agreed with this idea. For example, the famous ornithologist John James Audubon conducted an experiment on turkey vultures and concluded they could not smell meat. Increasingly though, we are learning the opposite: birds may use smell. For example, finches preferred the smell of their own egg instead of the egg of another finch, hinting that birds may use smell to recognize family members. Similarly, other birds showed a preference for vanilla-scented nesting materials, showing that birds may use smell as a guide when building nests. When scientists placed food for albatrosses in the ocean, the albatrosses successfully navigated many miles across the ocean directly to the source of the food, suggesting that birds use smell while foraging. Why did Audubon’s vultures seem to not be able to smell, then? The meat Audubon used may have been too rotten to be appealing to the vultures."
      },
      {
        "type": "paragraph",
        "text": "Adding to the evidence that birds can smell, birds were also discovered to have olfactory receptors. Previous research found few olfactory receptors in birds—in a study of 48 bird species, it was found that 45 species had fewer than 75 olfactory receptors. However, given that birds engage in many behaviors involving smell, the question remains: how can birds do so if they have so few olfactory receptors?"
      },
      {
        "type": "heading",
        "text": "New Findings in Bird Olfactory Receptors"
      },
      {
        "type": "paragraph",
        "text": "In our investigation, we tested the accuracy of previously reported olfactory receptor counts in birds. Olfactory receptor counts are generated by scanning the complete bird genome. However, laboratory machines cannot get the code of an entire genome at once, so researchers get the DNA code in puzzle-like pieces, then build it back together. In so-called short read genomes, each puzzle piece is small, and in long read genomes, each piece is much larger. While short read genomes are less expensive to build, they are also more difficult to build. For example, imagine a puzzle with many small pieces compared to a puzzle with a few large pieces. The puzzle with a few large pieces would be easier to complete than the puzzle with many small pieces."
      },
      {
        "type": "paragraph",
        "text": "Pretend you are in class and your teacher gives you an assignment in which you must identify the number of unique dogs in a puzzle. She gives full dog images to one half of the class. Then she cuts up the rest of the images into smaller pieces and gives them to the other half, including you. Excited for a challenge, you begin assembling the pieces, only to quickly realize that several fragments seem redundant and look like they belong to the same dog. You end up assembling two dogs while the other half of the class, with the more complete pictures, easily identifies four dogs. This illustrates one of the shortcomings of a short read genome vs. a long read genome: with very similar small puzzle pieces, a short read genome cannot distinguish between two similar DNA segments. On the other hand, in long read genomes, puzzle pieces are larger and have a greater number of distinct features, so they can be identified more easily. The long read genome enables scientists to better identify that two DNA segments are unique sequences and not redundant, like how four dogs instead of two could be identified in the puzzle when the images were whole."
      },
      {
        "type": "paragraph",
        "text": "In the previous study reporting fewer than 75 olfactory receptors in 45 bird genomes, all 45 of the bird genomes were short read genomes. Olfactory receptors have many similar sequences to each other and are often found right next to each other in the genome puzzle. The very problem described above arises: since small puzzle pieces could be mistakenly identified as redundant in short read genomes, could they be affecting the olfactory receptor counts found in birds?"
      },
      {
        "type": "paragraph",
        "text": "For our study, we looked at bird species that had both short and long read genomes available: the emu, a hummingbird, and a manakin. We chose birds that were different from each other in size, habitat, and diet, to see if we would find similar patterns across such diverse bird lifestyles. Emus are large flightless birds found in Australia. Hummingbirds live in the Americas, are the smallest birds, and hover over flowers to drink their nectar. Manakins are fruit-eating birds found in Central and South America, best known for their elaborate dances. We scanned these genomes and counted the number of olfactory receptors in the short and long read genomes. We found more olfactory receptors in the long read genomes compared to the short read genomes in all three birds. For example, we found 27 olfactory receptors in the short read genome of the hummingbird but 109 in the long read genome. In another example, we found nine olfactory receptors in the short read genomes of the manakin, but 117 olfactory receptors in the long read genome. Likewise, the emu short read genome contained 57 olfactory receptors compared to 296 in the long read genome."
      },
      {
        "type": "heading",
        "text": "Smell is Important in Birds!"
      },
      {
        "type": "paragraph",
        "text": "Our study showed that birds have more olfactory receptors than previously thought. Prior to our findings, scientists thought that most birds had fewer than 100 olfactory receptors in their genomes. This is a small number of olfactory receptors compared to other mammals, suggesting that birds may not have enough diversity in their olfactory receptors for smell to be important in their lives. However, recent behavioral studies show that birds may use smell for recognizing family members, nest building, and foraging. We showed that some bird species actually have hundreds of olfactory receptors in their genomes, which is similar to some mammals, including humans. This DNA evidence for bird smell will support future behavioral studies that reveal the exciting possibility that birds use smell in their daily lives, more than scientists had once thought possible. Hopefully, future investigations will test the olfactory receptors to discover which types of odors birds can smell."
      }
    ],
    "vocabulary": [
      {
        "id": "a005-v01",
        "term": "Olfactory System",
        "definition": "Body parts that are used for smell. Olfactory receptors are a crucial part of this system.",
        "example": "Animals detect and interpret odors using the olfactory system, which consists of the nose and the nasal cavities.",
        "synonym": ""
      },
      {
        "id": "a005-v02",
        "term": "Olfactory Receptors",
        "definition": "Proteins on the cell surface that directly attach to odor molecules. After attaching, the receptor sends signals to the brain, which then interprets the odor.",
        "example": "Animals detect smells with olfactory receptors, special proteins that sit on the surface of the nose cells.",
        "synonym": ""
      },
      {
        "id": "a005-v03",
        "term": "Genome",
        "definition": "The full genetic material of an organism, containing the “code” that makes up all of the organism’s genes.",
        "example": "DNA codes for olfactory receptors can be found within an organism’s entire set of genes, which is called the genome.",
        "synonym": ""
      },
      {
        "id": "a005-v04",
        "term": "Ornithologist",
        "definition": "A scientist who studies birds. The study of birds is called ornithology.",
        "example": "For example, the famous ornithologist John James Audubon conducted an experiment on turkey vultures and concluded they could not smell meat.",
        "synonym": ""
      },
      {
        "id": "a005-v05",
        "term": "Short Read Genome",
        "definition": "The full genetic material of an organism, put together from small pieces. Two small pieces that are very similar may be difficult to distinguish from one another.",
        "example": "This illustrates one of the shortcomings of a short read genome vs. a long read genome: with very similar small puzzle pieces, a short read genome cannot distinguish between two similar DNA segments.",
        "synonym": ""
      },
      {
        "id": "a005-v06",
        "term": "Long Read Genome",
        "definition": "The full genetic material of an organism, put together from larger pieces. Two large pieces have enough unique qualities to be distinguished from each other and labeled as unique.",
        "example": "This illustrates one of the shortcomings of a short read genome vs. a long read genome: with very similar small puzzle pieces, a short read genome cannot distinguish between two similar DNA segments.",
        "synonym": ""
      },
      {
        "id": "a005-v07",
        "term": "Redundant",
        "definition": "An item or object that is unnecessary because it is already present. An extra copy of something, where the extra copy does not provide any additional value.",
        "example": "Excited for a challenge, you begin assembling the pieces, only to quickly realize that several fragments seem redundant and look like they belong to the same dog.",
        "synonym": ""
      }
    ],
    "source": {
      "publisher": "Frontiers for Young Minds",
      "url": "https://kids.frontiersin.org/articles/10.3389/frym.2024.1332305",
      "authors": [
        "Renee Li",
        "Nivritti Mantha",
        "Ichie Ojiro",
        "Hiroaki Matsunami",
        "Robert Driver"
      ],
      "citation": "Li R, Mantha N, Ojiro I, Matsunami H and Driver R (2024) Birds and Their Extraordinary Sense of Smell. Front. Young Minds. 12:1332305. doi: 10.3389/frym.2024.1332305",
      "copyright": "Copyright © 2024 Li, Mantha, Ojiro, Matsunami and Driver",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "adaptationNote": "Text adapted for reading practice: illustrations, figure pointers and reference markers omitted; glossary definitions retained. The original illustrated article is linked above."
    }
  },
  {
    "id": "a006",
    "slug": "group-cohesion-the-glue-that-helps-teams-stick-together",
    "title": "Group Cohesion: The Glue That Helps Teams Stick Together",
    "teaser": "Playing together with other people can be an extremely fun aspect of taking part in sports. It can also be challenging when some people are not team players.",
    "category": "Society",
    "tags": [
      "neuroscience and psychology explore the collection",
      "society",
      "cohesion",
      "group integration",
      "task cohesion",
      "social cohesion"
    ],
    "readMinutes": 10,
    "publishedLabel": "New",
    "cover": {
      "theme": "sunrise-rose",
      "icon": "BookOpen",
      "motif": "SOCIETY"
    },
    "blocks": [
      {
        "type": "lead",
        "text": "Playing together with other people can be an extremely fun aspect of taking part in sports. It can also be challenging when some people are not team players. This article focuses on the topic of group cohesion, which we describe as the glue that helps teammates to stick together. We might also define cohesion as the amount of unity or harmony in a team. Sport teams can be cohesive in terms of how well they play together during practices and games (i.e., task cohesion) as well as how well they get along away from their sport (i.e., social cohesion). Both types of cohesion are important because they lead to better individual and team performance, and athletes are more likely to be happy with playing on the team and to continue taking part. We suggest simple strategies that you and your coaches can use to help your team become more cohesive over time."
      },
      {
        "type": "heading",
        "text": "What Is Group Cohesion?"
      },
      {
        "type": "paragraph",
        "text": "Many popular sport accomplishments have been celebrated because a group of individuals was able to work together to overcome major obstacles. Playing together with other people can be an extremely fun and rewarding aspect of taking part in sport. That special feeling of harmony in a team is called cohesion, and it helps teams succeed. For example, cohesion was a major factor in the success of the underdog Icelandic men’s football/soccer team at the Euro 2016 championships. As their manager explained, “If you have been around this team, you see it is fantastic how everybody has a part to play, everybody is friends, everybody is willing to work with each other. That is a mentality you need for a small country to achieve things. You can not do it with individuals. We are a family.”1 Also, USA women’s basketball coach Dawn Staley reinforced the importance of having the time to bring players together to successfully unite the group. In her words, “This program gives us an opportunity to keep a core group of players together and to build chemistry and cohesion.”2"
      },
      {
        "type": "paragraph",
        "text": "Cohesion is not something you can touch and it is also not something you can do. Rather, it is a set of beliefs that team members hold about the group and their membership in it. Researchers propose that athletes hold two sets of beliefs related to cohesion. First, athletes have beliefs about the degree to which their teammates are unified. This is called group integration, and it could be thought of as the glue that helps teammates stick together. Athletes also have beliefs about how much each athlete wants to be a part of the team. This is called attraction to the group, and you could envision this as a magnet that initially draws each member in and keeps members interested in what the team is doing."
      },
      {
        "type": "paragraph",
        "text": "Furthermore, there are two contexts that draw people in (the magnet) and motivate them to work together (the glue). First, sport teams can be cohesive during practices and games. How well a team plays together is called task cohesion. Second, athletes may interact with one another away from the sport environment, and they may develop relationships and friendships. The way athletes get along outside of sport is called social cohesion. The two beliefs (group integration and attraction to the group) and the two contexts for cohesion (task and social) interact to create four dimensions of cohesion by which researchers can examine sport teams."
      },
      {
        "type": "heading",
        "text": "Why Is Cohesion Important?"
      },
      {
        "type": "paragraph",
        "text": "Many researchers have attempted to understand how athletes think about group cohesion. To do so, they can give questionnaires to the athletes. Other researchers have tried to estimate the level of group cohesion by examining members’ interactions via social media, or through observing and documenting team behaviors. Regardless of which research method is used, there is evidence that cohesion is associated with improved individual and team performance, and with continued participation in sport. Team cohesion and performance have a circular relationship. In other words, higher levels of task and social cohesion contribute to better performances, but better team performances also lead to increased feelings of task and social cohesion. Interestingly, cohesion is not just important for team sports—it is also important for individual sports, like cross-country running. Athletes in individual sports spend a lot of time together, train with the same coaches, and share the same training space and equipment. This requires them to get along as much as (or more than) team-sport athletes."
      },
      {
        "type": "paragraph",
        "text": "People who feel like they are part of a group, who are close with group members, and who are attracted to the group’s task and social activities will have a stronger desire to remain with the group and may show longer commitment to a group or a sport. If a group is cohesive and a person enjoys being a member, the likelihood of experiencing positive emotions increases. Finally, cohesion can also reduce attendance issues, such lateness or missing practices and games, and it can encourage greater effort."
      },
      {
        "type": "paragraph",
        "text": "Although cohesion enhances the group experience, it can sometimes create negative consequences. On one hand, high levels of social cohesion can sometimes cause group members to have difficulty focusing or committing to performance-related goals. This may happen because group members who really like each other may spend more time socializing than focusing on the task at hand. Additionally, communication problems within a team might arise when friends avoid having tough, sport-related conversations with one another, possibly because they do not want to hurt someone’s feelings. Some team members can also become isolated outside of the main group, or feel pressure to fit in, if they are new to the team or if they see themselves as different. On the other hand, teams with very high levels of task cohesion can become overly focused on achieving their goals, which may make social relationships very tense. Players may not experience as much personal enjoyment, or they may feel excessive pressure to perform."
      },
      {
        "type": "paragraph",
        "text": "Even though cohesion can have negative consequences in certain situations, the performance benefits and happiness generated by cohesion outweigh any potential disadvantages that may arise."
      },
      {
        "type": "heading",
        "text": "Putting the “Team” Into Team Building Activities!"
      },
      {
        "type": "paragraph",
        "text": "Now that we know what cohesion is and why it is important, the next step is to learn how to help teams become more cohesive. In sport, coaches, sport psychologists, and athletes use team-building activities to help teams become cohesive. Team-building activities take many forms and can include games played with teammates, puzzles the team must solve together, or activities that involve sharing feelings or ideas with teammates. All team-building activities involve working with teammates to build the skills needed to create united sport groups. We will describe three easy-to-use team-building activities to help build group cohesion."
      },
      {
        "type": "paragraph",
        "text": "The first team-building activity is called the birthday balance beam. In this challenge, all athletes stand on a small balance beam and work together to avoid falling off, as they move around each other to line up from oldest to youngest. This may just seem like a fun game to do with your teammates, but it also builds cohesion. To move around the balance beam and end up in the right order without anyone falling off, teammates need to listen, talk to each other, and work together to win. These are all skills that athletes can transfer to sport to build a united team."
      },
      {
        "type": "paragraph",
        "text": "Group goal setting is a second team-building activity. When a team works together to create goals for the season that everyone agrees on, they get excited to complete those goals. There are several steps to setting team goals. First, a team chooses their long-term (season) goals, for example to win a championship. Then, as a team, athletes plan shorter-term goals by which, step-by-step, they can achieve their long-term goal. Shorter-term goals help a team track its success and gain confidence along the way! For example, in basketball, a short-term goal could include all team members shooting 50 extra free throws at the end of practice. Teams should put their goals on a poster in their locker room or other common area, where the goals can be seen frequently. Once a week, the team should come together to talk about their progress, what is going well, and where they could improve. This activity helps athletes practice sharing ideas and reaching agreement regarding goals. These skills are important for cohesion because teammates can use them to work as a unit."
      },
      {
        "type": "paragraph",
        "text": "A third team-building activity is to develop a distinct team identity. Some teams have special team gear or create routines that are unique to them. This may be as simple as working together to create a special and creative cheer for the team. A team cheer should be fun, exciting, and use words that are important to the team. For example, in the team huddle before a game in the 2013 National Basketball Association finals, the Miami Heat chanted, “nothing’s difficult, everything’s a challenge, through adversity, to the stars!”3 (Video). Having a team cheer to say before or after practices and games is a great way to practice teamwork, and it gets everyone excited to play. A fun and special cheer also makes a team unique from other teams; the cheer is something that all teammates can share and that helps all athletes feel like a part of the team."
      },
      {
        "type": "heading",
        "text": "Conclusion"
      },
      {
        "type": "paragraph",
        "text": "Overall, participating in a cohesive sport team is a very rewarding experience. Also, being united around the goals of the group (task cohesion) and developing positive bonds and friendships (social cohesion) can have important consequences for the team. It is worthwhile to try to develop these bonds, and team building activities are a fun way to build cohesion. These activities get athletes working together and thinking together, all the while making them excited to play as a team. An important point to remember with team-building activities is that practice makes perfect! The more teams value and practice working together, the more cohesive—and successful—they become."
      }
    ],
    "vocabulary": [
      {
        "id": "a006-v01",
        "term": "Cohesion",
        "definition": "The unity and harmony within a team.",
        "example": "This article focuses on the topic of group cohesion, which we describe as the glue that helps teammates to stick together.",
        "synonym": ""
      },
      {
        "id": "a006-v02",
        "term": "Group Integration",
        "definition": "Group integration beliefs about the degree to which teammates are unified.",
        "example": "This is called group integration, and it could be thought of as the glue that helps teammates stick together.",
        "synonym": ""
      },
      {
        "id": "a006-v03",
        "term": "Task Cohesion",
        "definition": "How united team members are during practices and games.",
        "example": "Sport teams can be cohesive in terms of how well they play together during practices and games (i.e., task cohesion) as well as how well they get along away from their sport (i.e., social cohesion).",
        "synonym": ""
      },
      {
        "id": "a006-v04",
        "term": "Social Cohesion",
        "definition": "How united team members are outside of practices and games, such that they develop friendships and relationships.",
        "example": "Sport teams can be cohesive in terms of how well they play together during practices and games (i.e., task cohesion) as well as how well they get along away from their sport (i.e., social cohesion).",
        "synonym": ""
      }
    ],
    "source": {
      "publisher": "Frontiers for Young Minds",
      "url": "https://kids.frontiersin.org/articles/10.3389/frym.2022.685318",
      "authors": [
        "Mark Eys",
        "Taylor Coleman",
        "Travis Crickard"
      ],
      "citation": "Eys M, Coleman T and Crickard T (2022) Group Cohesion: The Glue That Helps Teams Stick Together. Front. Young Minds. 10:685318. doi: 10.3389/frym.2022.685318",
      "copyright": "Copyright © 2022 Eys, Coleman and Crickard",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "adaptationNote": "Text adapted for reading practice: illustrations, figure pointers and reference markers omitted; glossary definitions retained. The original illustrated article is linked above."
    }
  },
  {
    "id": "a007",
    "slug": "from-zzzs-to-aaas-why-sleep-is-an-important-part-of-your-study-schedule",
    "title": "From ZZZs to AAAs: Why Sleep Is an Important Part of Your Study Schedule",
    "teaser": "All of us sleep. While adults spend about one-third of their time asleep, the younger you are, the more you sleep.",
    "category": "Psychology",
    "tags": [
      "neuroscience and psychology explore the collection",
      "psychology",
      "neurons",
      "sleep spindles",
      "slow-wave sleep",
      "neocortex",
      "hippocampus"
    ],
    "readMinutes": 10,
    "publishedLabel": "New",
    "cover": {
      "theme": "royal-violet",
      "icon": "Brain",
      "motif": "PSYCHOLOGY"
    },
    "blocks": [
      {
        "type": "lead",
        "text": "All of us sleep. While adults spend about one-third of their time asleep, the younger you are, the more you sleep. However, this does not mean that children and teenagers are being lazy by spending too much time in bed. In fact, not getting enough sleep usually makes people feel tired, less effective, and unable to concentrate. Not only should you avoid these consequences of bad sleep, but you should also prioritize good sleep. Good sleep restores your body and brain, and offers an opportunity for your brain to reorganize itself after a busy day. In this article, we consider why sleep is especially important for supporting memory. Your ability to learn, remember, and refine your brain is extraordinary during childhood and adolescence, so sleep is particularly important during these stages. We explain the links between brain and sleep changes as you grow older, and why sleep should be an important part of your study schedule."
      },
      {
        "type": "paragraph",
        "text": "As you get nearer and nearer to a test at school, sometimes it feels like there is so much to learn in so little time. So why waste time in bed when you could use that time to study? Staying up late to cram in some extra learning time might seem a tempting thought, but sleep is vital for your body and brain. It keeps you healthy and restores your energy so you feel alert and active the next day. Sleep also provides a time for the brain to remodel and refine its structure and function to your individual needs and experiences. The sleeping brain is not only important for general brain development but—fortunately—also does some pretty important work on your memories. Scientists have shown that the brain’s activities during sleep help to save new knowledge to memory as well as prepare for new learning the next day. This means that spending time asleep is much better than trying to pull an “all-nighter” in the run-up to exams. While this is important throughout life, the ability to reshape your brain and your capacity to learn is extraordinary across childhood and adolescence, and so is your sleep across this period."
      },
      {
        "type": "heading",
        "text": "The Sleeping Brain"
      },
      {
        "type": "paragraph",
        "text": "The sleeping brain is not always doing the same thing. A good night’s sleep cycles through different sleep stages, determined by muscle and eye movements, and the activity of tiny nerve cells in the brain (called neurons). Scientists can measure this activity by placing small sensors beside a person’s eyes, on the chin, and on the head while the person sleeps. Sometimes the neurons act very quickly and chaotically, similar to when the brain is awake and busy. This is the case during rapid eye movement sleep (REM), a sleep stage during which the eyes are moving very quickly, muscles are extremely relaxed, and the brain is engaging in very vivid dreams. The remaining sleep stages are referred to together as non-rapid eye movement sleep (non-REM). During light non-REM sleep, we see short bursts of brain activity called sleep spindles. During deep non-REM sleep, neurons in the brain show slow rhythmic activity similar to gigantic waves in the ocean, called slow waves. Because of this, deep non-REM sleep is often referred to as slow-wave sleep. Both sleep spindles and slow waves are specialists in remodeling the brain, meaning that the more they are present, the more the brain is being shaped."
      },
      {
        "type": "heading",
        "text": "The Brain Under Reconstruction"
      },
      {
        "type": "paragraph",
        "text": "As a newborn, you spent more time asleep than awake. But the older you get, the less you sleep. It is not just the amount of sleep that changes during development but, importantly, the balance between different sleep stages also changes. Generally, as you grow older, you get less and less slow-wave sleep, while the proportion of light non-REM sleep increases. Scientists believe that these changes in sleep may tell us about the brain’s potential to reconstruct itself."
      },
      {
        "type": "paragraph",
        "text": "From infancy to adolescence, your brain undergoes major reorganization and optimization to deal with your daily needs and experiences. New connections between brain cells are built, connections you do not need are removed, and the communication of information along important neuron tracks speeds up. Crucially, when a specific part of the brain is under reconstruction, the neurons in that region show more slow rhythmic activity during slow-wave sleep. For example, scientists in Switzerland recorded the sleep of 40 children and young adults, and also measured their performance on certain tasks. Interestingly, they found that sleep slow waves were most powerful in the brain region responsible for the skills participants were learning at each age, and the slow waves in those brain regions got weaker once the skill was better developed. For instance, in late childhood when children get really good at performing complex movements, like riding a bike—maybe even hands-free—slow waves were most powerful in the brain region responsible for performing movements. The scientists also saw this optimization in the brain’s structure when the participants went in the brain scanner: the brain’s outer layer, the neocortex, was thinner in these regions, reflecting “fine-tuning” of the brain to perform tasks more efficiently. These relationships between slow waves, skills, and brain structure lead researchers to think that looking at slow rhythms during sleep might help us to learn how the brain is developing."
      },
      {
        "type": "paragraph",
        "text": "Unlike slow waves, which decline as the brain matures, the sleep spindles that characterize light non-REM sleep get more numerous and faster throughout childhood and adolescence. Some scientists think that the speeding up of sleep spindles during childhood and adolescence reflects faster and more efficient communication between different parts of the brain. In one of our studies, we found that children who showed the biggest increases in the number of spindles over a seven-year period performed better on tests of general mental ability at ages 14–18. Unfortunately, we do not yet know exactly how spindles are helping brain development, and this is an exciting area that scientists are still trying to understand."
      },
      {
        "type": "heading",
        "text": "Slow and Steady Wins the Race"
      },
      {
        "type": "paragraph",
        "text": "By looking at sleep, we can understand how the brain changes as children grow older and learn new skills, like riding a bike. However, sleep performs another important task. It helps you to form long-lasting memories of new facts, like information you learn at school."
      },
      {
        "type": "paragraph",
        "text": "Lots of experiments have shown that sleep can help you to remember the new things that you learn. Some studies have even shown that memories can get better with sleep, without any extra studying! For example, researchers at the University of York taught 7- to 12-year-old children new words in either the morning or the evening. When the researchers tested the memory of the children 12 hours later, those who had learned in the evening and then gone to sleep could remember more words than the children who stayed awake all day. In fact, they could recall more of the words than they could before they went to bed. How can that be?"
      },
      {
        "type": "paragraph",
        "text": "Scientists believe that the brain has two different learning systems, a fast one and a slow one. These two learning systems can be thought of like the slow tortoise and the speedy hare in the old fable. In the tale, the hare speeds off very rapidly in his race against the tortoise. Pleased with his progress and confident of winning, he takes a nap midway that allows the slow and steady tortoise to overtake and win the race. One learning system in the brain works like the speedy hare: it helps you to learn new information very quickly during the day and gives the information a head start in memory. However, the second learning system is much slower and wiser, like the tortoise, and carefully links the new information to things that we already know. This slower learning system wins out in the long-term, helping you to remember new information in the future. Much like in the tale, the “tortoise” memory system can take over when you give your brain an opportunity to sleep."
      },
      {
        "type": "paragraph",
        "text": "Studies show that a region deep in the brain (the hippocampus) gets the head start in learning like the speedy hare, while the outer layers of the brain (the neocortex) act like the slow tortoise. During slow-wave sleep, the speedy hippocampus repeats the information it has learned during the day and communicates it to the slow-learning neocortex. Many scientists think that the brain is acting out a very specific sequence of slow waves, sleep spindles, and very fast waves in the hippocampus, which allow the two learning systems to talk to each other. This communication strengthens fragile memories for the longer term and links them with older knowledge already stored in the neocortex. Scientists in Belgium showed that this memory-strengthening process can happen even during a nap. They taught children aged 8–12 some “magical” meanings for made-up objects (for example, one object could see through doors, another object could stop the rain), and then tested their memory for these associations while measuring brain activity. Immediately after learning, the hippocampus responded to the learned meanings. Half the children then took a 90-min nap, whereas the other half stayed awake. In a second memory test, only children who had slept showed greater brain activity in the neocortex when remembering the meanings. So, even after a short nap, the slow tortoise system can win the memory race."
      },
      {
        "type": "heading",
        "text": "So Sleep Tight, Wake Up Bright!"
      },
      {
        "type": "paragraph",
        "text": "Now you know that sleeping definitely is not a waste of time. Rather, sleep allows your memories to become as good and long-lasting as possible. Sleep is essential for allowing your brain to reorganize as you grow up and experience the world, and for helping you to remember all the new things that you learn. In the long run, children who get more sleep perform better at school, and even do better in exams than children who stay awake late to do extra studying. So, be sure to make sleep an important part of your study schedule, and let your brain do the hard work while you relax for the night."
      }
    ],
    "vocabulary": [
      {
        "id": "a007-v01",
        "term": "Neurons",
        "definition": "Tiny nerve cells in the brain that store and transfer signals and information.",
        "example": "A good night’s sleep cycles through different sleep stages, determined by muscle and eye movements, and the activity of tiny nerve cells in the brain (called neurons).",
        "synonym": ""
      },
      {
        "id": "a007-v02",
        "term": "Sleep Spindles",
        "definition": "Short periods of increased activity in the brain that we believe help with efficient communication between different parts of the brain.",
        "example": "During light non-REM sleep, we see short bursts of brain activity called sleep spindles.",
        "synonym": ""
      },
      {
        "id": "a007-v03",
        "term": "Slow-wave Sleep",
        "definition": "The deepest phase of non-REM sleep, during which the neurons in the brain show slow rhythmic activity (slow waves), thought to be important for the storage of lasting memories.",
        "example": "Because of this, deep non-REM sleep is often referred to as slow-wave sleep.",
        "synonym": ""
      },
      {
        "id": "a007-v04",
        "term": "Neocortex",
        "definition": "The outer layers of the brain that are thought to store knowledge for the longer term.",
        "example": "The scientists also saw this optimization in the brain’s structure when the participants went in the brain scanner: the brain’s outer layer, the neocortex, was thinner in these regions, reflecting “fine-tuning” of the brain to perform tasks more efficiently.",
        "synonym": ""
      },
      {
        "id": "a007-v05",
        "term": "Hippocampus",
        "definition": "A brain structure deep inside the brain that helps to support fast learning of new information.",
        "example": "Studies show that a region deep in the brain (the hippocampus) gets the head start in learning like the speedy hare, while the outer layers of the brain (the neocortex) act like the slow tortoise.",
        "synonym": ""
      }
    ],
    "source": {
      "publisher": "Frontiers for Young Minds",
      "url": "https://kids.frontiersin.org/articles/10.3389/frym.2020.00051",
      "authors": [
        "Emma James",
        "Ann-Kathrin Joechner",
        "Beate E. Muehlroth"
      ],
      "citation": "James E, Joechner AK and Muehlroth BE (2020) From ZZZs to AAAs: Why Sleep Is an Important Part of Your Study Schedule. Front. Young Minds. 8:51. doi: 10.3389/frym.2020.00051",
      "copyright": "Copyright © 2020 James, Joechner and Muehlroth",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "adaptationNote": "Text adapted for reading practice: illustrations, figure pointers and reference markers omitted; glossary definitions retained. The original illustrated article is linked above."
    }
  },
  {
    "id": "a008",
    "slug": "why-didnt-the-bird-cross-the-road",
    "title": "Why Didn’t the Bird Cross the Road?",
    "teaser": "Roads are very useful: we build them so we can travel to the grocery store, see our friends, and take day trips to the beach. However, when we clear land to build our roads, we destroy the homes of other animals.",
    "category": "Science",
    "tags": [
      "biodiversity explore the collection",
      "science",
      "habitat",
      "habitat fragmentation",
      "ecosystem services",
      "ecosystem",
      "keystone species"
    ],
    "readMinutes": 11,
    "publishedLabel": "New",
    "cover": {
      "theme": "forest-emerald",
      "icon": "Compass",
      "motif": "SCIENCE"
    },
    "blocks": [
      {
        "type": "lead",
        "text": "Roads are very useful: we build them so we can travel to the grocery store, see our friends, and take day trips to the beach. However, when we clear land to build our roads, we destroy the homes of other animals. If your home was destroyed, what would you do? Find a new home of course! But roads make this very difficult for other animals, at least for larger animals. Not many studies have looked into the impacts of roads on smaller animals, such as birds. So, we decided to investigate this ourselves. Why birds? They have wings and can fly, right? Surprisingly, we found fewer birds crossed as roads became wider. We also found that the small birds that need forests to survive were the ones most impacted by roads. These findings show us that, despite appearances, birds are as vulnerable as other animals to human activities."
      },
      {
        "type": "heading",
        "text": "How Do Roads Affect Birds?"
      },
      {
        "type": "paragraph",
        "text": "What is it that is so awesome about birds? If you ask people that question, chances are they will likely respond with “they can fly!” Birds can fly away when chased by a dog, they can catch food in the air (some are even quite acrobatic), and they can even fly above and around obstacles, such as buildings and trees. It appears that there is not much a bird cannot do (other than use a computer). Unfortunately, because many people have thought this in the past, very few studies have looked at birds in situations where they must move between habitat patches. However, recent studies have shown that birds may find it very difficult to cross even small open spaces like roads when moving between forest patches."
      },
      {
        "type": "paragraph",
        "text": "Scientists have suggested several reasons to explain why building roads may be bad for some birds. One theory is that, by building a road, we separate forests and reduce the area of habitat available for animals to live in, a process that we call habitat fragmentation. Habitat fragmentation is a big problem for many species, because conditions may change very quickly within the remaining habitat fragments and become unsuitable for the species, particularly around the edges (in this case, the areas nearby the road). Try to imagine waking up one morning to find that the roof of your house is gone, and for some reason you are unable to replace it. Let us say you decide to stick around for a bit. You will soon notice that nothing stays dry when it rains, it gets too hot in summer and too cold in winter (and you have no air conditioning), you have to share your house with some of the other local creatures (and you may not always get along), there never seems to be enough food in the pantry, and your friends would not come around because the place is a mess. You may be able to continue living in your old home for a while, but sooner or later you will want to move elsewhere! This is what it might be like to be a bird living in an area through which a road is built."
      },
      {
        "type": "paragraph",
        "text": "Other studies have found that when roads are heavy with traffic and noise, birds in the surrounding habitats are more likely to experience stress. Exposure to loud noises is also known to mask the calls and songs of some birds. For example, imagine you are trying to have a conversation with your friend out in front of your school and you are interrupted by a loud passing truck. This is very problematic for birds, because they use their songs to communicate with other birds and to defend their territories. So, if a bird species is unable to change the sound of its calls, then that species will be more likely to move to a quieter area where it can be heard. The end result will be that the area near road will be left with only a few species—those that are noise tolerant."
      },
      {
        "type": "paragraph",
        "text": "However, all of this information comes from only a few studies. In fact, most studies have focused on the effects of roads on larger animals, such as bears, moose, and elephants. Of the few instances in which birds were studied, most were performed in the northern hemisphere, where both the forests and the birds are very different to those found in Australia. In Australia, for example (where our study was performed), many of the birds can fly great distances, sometimes across the whole of Australia, often because of unpredictable weather. Birds in other parts of the world where the weather is more predictable, such as England and America, do not have to fly such long distances. No previous studies of the effects of roads on birds had been performed in Australia, and so this got us thinking, “maybe our birds are different from those in the other studies.” With this in mind, we asked three questions:"
      },
      {
        "type": "paragraph",
        "text": "1. Do different road sizes change the number of bird species found in the forests nearby?"
      },
      {
        "type": "paragraph",
        "text": "2. Do different road sizes change to the number of bird species crossing the roads?"
      },
      {
        "type": "paragraph",
        "text": "3. Are the types of birds crossing the roads different from the types found in the forest nearby?"
      },
      {
        "type": "heading",
        "text": "Designing the Experiment"
      },
      {
        "type": "paragraph",
        "text": "We used a simple study design: good old-fashioned bird watching and carefully recording what we saw. To be a little more specific, we:"
      },
      {
        "type": "paragraph",
        "text": "1. Found 12 roads that were suitable for our study: four small, four medium, and four large;"
      },
      {
        "type": "paragraph",
        "text": "2. Sat at each road for 20 min, counting the numbers and types of birds crossing from one side of the road to the other;"
      },
      {
        "type": "paragraph",
        "text": "3. Walked 100 m off the road from both sides at each site and counted the types of birds living there, for 20 min; and"
      },
      {
        "type": "paragraph",
        "text": "4. Revisited each site and repeated the counts eight times, between August 2015 and February 2016."
      },
      {
        "type": "paragraph",
        "text": "What made our study different from other related studies was that we decided to try something new: we looked at roads of different sizes (two, four, and six lanes) and analyzed the road-crossing abilities for species of different body sizes (<19, 20–29, >30 cm) and life-history traits (small forest-dependent, large forest-dependent, honeyeater, and urban-tolerant bird species). We also used some assessment tools and mathematical methods to ensure that we had similar forests and birds at each of our study sites."
      },
      {
        "type": "heading",
        "text": "Fewer Birds Crossed Wider Roads"
      },
      {
        "type": "paragraph",
        "text": "Would you be willing to cross a small street to get to your friend’s house? Now, what if we replaced that street with a busy highway, would you still be willing to cross that road to get to your friend? It turns out that birds also do not like to cross wider, busier roads. Fewer species of bird were able to cross wider roads in our study. What was even more surprising was that we also saw this pattern in the forests nearby these roads—fewer birds were present in the forests near large roads than in the forests near small roads. Astoundingly, it turns out that different types of birds are differently affected. We found that the birds most unlikely to cross roads (of any size) were birds that were small and loved to live in forests, whereas large birds did not seem to mind crossing roads all that much. Importantly, the results we found in this experiment are similar to those found in other studies."
      },
      {
        "type": "heading",
        "text": "Okay, So Fewer Birds Crossed Roads. But Why?"
      },
      {
        "type": "paragraph",
        "text": "Why do you think the small forest birds were the most affected by roads? For starters, this group of birds really likes to live in areas with dense plant cover, where there is plenty of food and space available for their families (and enough for other birds, too), and shelter to hide from hungry predators. Road construction often results in changes to the surrounding environment. For example, the dense forest next to the road may become a more open forest (something that we saw a lot of near our roads), and food and space that was previously there becomes harder to find, so many different animals may be fighting over it. Traffic noise may also make life more difficult. Some of the birds may have trouble calling to and being heard by others and the traffic noise also helps the hungry predators that do not want to be heard when hunting. To make matters worse, the new lights, powerlines, and gardens that often come along with new roads are perfect for some of the bigger and meaner birds, such as the noisy miner and magpie, and these large birds will happily kick the small birds out, to keep these areas for themselves."
      },
      {
        "type": "paragraph",
        "text": "These are some of the things that the small birds must deal with in the forest near the road. Even if these small birds do manage to survive these challenges, they still need to cross the road. Similar to the results of many previous studies, we counted many more large birds crossing roads than small birds, especially the larger roads. The wings of small forest birds are generally suited for short flights in dense tree cover, so a wide treeless gap, such as a road may be impossible for them to cross in a single flight, and therefore they avoid crossing roads. Predator activity also makes crossing more perilous for small forest birds, because they are very easy for predators to catch when they are outside of tree cover."
      },
      {
        "type": "heading",
        "text": "Why Are Our Findings Important?"
      },
      {
        "type": "paragraph",
        "text": "Habitat fragmentation is currently recognized as one of the greatest threats to the survival of many of Earth’s species, birds included. What is even more worrying is that humans benefit from the many vital services, called ecosystem services that birds provide. For example, many birds are important predators of “pest” species, such as mosquitos and rodents, and birds can also be pollinators of many plant species. In fact, one study found 33% of birds to be involved in spreading the seeds of plants that are medically and economically importance to humans. There are even some birds that are so critical to the functioning of the ecosystems they live in that, without them, these ecosystems fall apart. We call these critical species that hold ecosystems together keystone species."
      },
      {
        "type": "paragraph",
        "text": "Unfortunately, as the human population continues to grow, so too does our demand for more houses and better roads. This has resulted in the widespread destruction and fragmentation of forests, which in turn threatens the survival of birds and the ecosystem services the birds provide us. It is therefore important to better understand how birds behave when they encounter man-made changes to the environment, such as roads."
      },
      {
        "type": "paragraph",
        "text": "We hope that our findings will help bring birds into the focus of future research. For example, it will be interesting to compare the way birds react to more natural openings in forest cover, such as clearings in the forest, or rivers. Our work, along with these future studies, will hopefully give us a better chance at protecting our wildlife while we still meet our need to move from one place to another using roads."
      }
    ],
    "vocabulary": [
      {
        "id": "a008-v01",
        "term": "Habitat",
        "definition": "The natural home or environment of an animal, plant, or other organism.",
        "example": "Unfortunately, because many people have thought this in the past, very few studies have looked at birds in situations where they must move between habitat patches.",
        "synonym": ""
      },
      {
        "id": "a008-v02",
        "term": "Habitat Fragmentation",
        "definition": "The breakdown of a large, continuous habitat into several smaller, separate habitats.",
        "example": "One theory is that, by building a road, we separate forests and reduce the area of habitat available for animals to live in, a process that we call habitat fragmentation.",
        "synonym": ""
      },
      {
        "id": "a008-v03",
        "term": "Ecosystem Services",
        "definition": "The direct and indirect contributions of ecosystems to human well-being.",
        "example": "What is even more worrying is that humans benefit from the many vital services, called ecosystem services that birds provide.",
        "synonym": ""
      },
      {
        "id": "a008-v04",
        "term": "Ecosystem",
        "definition": "A biological community of interacting organisms and their physical environment.",
        "example": "What is even more worrying is that humans benefit from the many vital services, called ecosystem services that birds provide.",
        "synonym": ""
      },
      {
        "id": "a008-v05",
        "term": "Keystone Species",
        "definition": "A species that plays a unique and critical role in maintaining the health and function of an ecosystem; without this species, the ecosystem would be very different.",
        "example": "We call these critical species that hold ecosystems together keystone species.",
        "synonym": ""
      }
    ],
    "source": {
      "publisher": "Frontiers for Young Minds",
      "url": "https://kids.frontiersin.org/articles/10.3389/frym.2019.00109",
      "authors": [
        "Christopher D. Johnson",
        "Daryl Evans",
        "Darryl Jones"
      ],
      "citation": "Johnson CD, Evans D and Jones D (2019) Why Didn’t the Bird Cross the Road?. Front. Young Minds. 7:109. doi: 10.3389/frym.2019.00109",
      "copyright": "Copyright © 2019 Johnson, Evans and Jones",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "adaptationNote": "Text adapted for reading practice: illustrations, figure pointers and reference markers omitted; glossary definitions retained. The original illustrated article is linked above."
    }
  },
  {
    "id": "a009",
    "slug": "do-monkeys-care-what-is-fair",
    "title": "Do Monkeys Care What Is Fair?",
    "teaser": "Scientists study fairness in humans, apes, and monkeys to understand the evolutionary origins of our own behavior and to better understand the behavior of other primates.",
    "category": "Psychology",
    "tags": [
      "neuroscience and psychology",
      "psychology",
      "inequity aversion",
      "cooperative breeding",
      "inequity",
      "advantageous inequity"
    ],
    "readMinutes": 9,
    "publishedLabel": "New",
    "cover": {
      "theme": "royal-violet",
      "icon": "Brain",
      "motif": "PSYCHOLOGY"
    },
    "blocks": [
      {
        "type": "lead",
        "text": "Scientists study fairness in humans, apes, and monkeys to understand the evolutionary origins of our own behavior and to better understand the behavior of other primates. Scientists studying monkeys have found that, sometimes, monkeys will share food equally with others, but their choices often depend on their species and the specific circumstances. Monkeys are more likely to help friends, but even then, monkeys rarely go out of their way to act fairly. Furthermore, while monkeys appear to recognize unfair outcomes, they only seem concerned by inequity when they receive less than others, not when they receive more."
      },
      {
        "type": "heading",
        "text": "Why Do We Want to Know If Monkeys Have a Sense of Fairness?"
      },
      {
        "type": "paragraph",
        "text": "Imagine that you are celebrating your friend’s birthday. Together with a group of friends, you have worked together to bake and frost a delicious birthday cake. Your friend has just blown out the candles and is slicing the cake to share with all the guests. The first three guests are handed large slices of cake, and then it is your turn. You are handed a teeny-tiny, skinny slice of birthday cake. How would you feel? Is this fair? Most of us have a clear sense of what is fair and what is not, but where does this come from? Fairness is the idea that people are treated equally, and rewarded fairly for the effort they have put in."
      },
      {
        "type": "paragraph",
        "text": "Scientists tend to study fairness in humans, apes, and monkeys to understand the evolutionary origins of this behavior. By studying a range of primate species, scientists can start to understand how fairness came about. In this article, we discuss whether monkeys have a sense of fairness. Scientists also study fairness in species even more distant from humans, such as domestic dogs and elephants, to better understand how fairness emerges in the animal kingdom."
      },
      {
        "type": "heading",
        "text": "Sharing Your Candy: Fairness Often Involves Equal Outcomes"
      },
      {
        "type": "paragraph",
        "text": "Suppose you and your friend find four pieces of candy on the kitchen table. You might pick up the candy and share one piece with your friend. That would be very kind of you! However, you would still have three pieces of candy while your friend would only have one. This decision does not lead to equal outcomes. To be fair, you would need to give two pieces of candy to your friend so that you each have two pieces. Your friend would likely be happier in this case, because s/he would have the same number of pieces of candy as you. People typically do not like getting less than someone else; this is called inequity aversion."
      },
      {
        "type": "paragraph",
        "text": "Do monkeys behave in ways that lead to equal outcomes? To find out, scientists give monkeys choices about how to divvy up rewards, generally small pieces of food that they really like. Scientists will ask a monkey to choose between two options—one that provides a piece of food just to themselves, and another option that provides an equal reward to another monkey nearby, as well as to themselves. If monkeys are seeking to create equal outcomes, they would choose the option that provides a piece of food to both themselves and another. Do they? Sometimes."
      },
      {
        "type": "heading",
        "text": "Species and Friendships Influence Fairness"
      },
      {
        "type": "paragraph",
        "text": "Whether monkeys favor equal outcomes seems to depend on the species (there are more than 200 species of monkeys, and so far, scientists have studied fairness in about a dozen species). One idea that scientists have considered to explain species differences is the called the cooperative breeding hypothesis. This hypothesis predicts that species, such as marmosets and tamarins, which live in family groups and help raise babies that are not their own, will be more tuned in to fairness. In some cases, monkeys that are cooperative breeders choose the equal outcome in the experiment, but not all the time. Also, sometimes species that are not cooperative breeders, such as capuchin monkeys, make the equal choice, so there seems to be a bit more going on."
      },
      {
        "type": "paragraph",
        "text": "What else might be influencing whether monkeys seek equal outcomes? It seems like monkeys are more likely to make the equal choice when they have a good friendship with the other monkey who will benefit. It also seems that monkeys are more likely to make the equal choice when they cannot see the food they are divvying up. Monkeys, like other animals, get very excited by the sight of food they like, and have a harder time making decisions when food is in front of them. For that reason, some scientists have used touchscreen computers that show images instead of actual food items, or have asked monkeys to make choices using symbolic representations of food, such as tokens."
      },
      {
        "type": "paragraph",
        "text": "All in all, a lot of different things seem to influence whether a monkey makes the equal choice. However, even in the cases where monkeys do make equal choices, they seem to do less frequently or consistently than humans do. Even scientists who have shown that monkeys prefer the equal choice find that the monkeys do not make that choice as often as they could if fairness was very important to them. This might mean that monkeys are capable of recognizing fairness, and creating fairness, but they do not think it is important all of the time."
      },
      {
        "type": "heading",
        "text": "But Wait, Does Effort Matter?"
      },
      {
        "type": "paragraph",
        "text": "Let us return to the candy scenario. We considered the situation to be equitable, or fair, if you and your friend each had two pieces of the candy. We focused on the results being equal. But what if you earned that candy by doing chores around the house? Is the fairest outcome still for you and your friend, who did not do any chores, to end up with two pieces of candy each? Probably not, because people tend to consider the effort involved when considering what is fair. What if you and your friend both complete chores, but only you get candy? That also would not seem fair. Scientists have also considered how monkeys’ choices are impacted by how much each monkey had to work for the rewards."
      },
      {
        "type": "paragraph",
        "text": "Scientists have developed a way to test whether monkeys prefer everyone to be paid equally for doing the same amount of work. In these studies, monkeys are trained to work for rewards by exchanging small plastic tokens with a scientist. Every time the monkey exchanges a token, it gets a small piece of food. To determine if, and how, monkeys respond to inequity, scientists have two monkeys take turns exchanging tokens. Each time, the scientist gives one monkey a food that monkeys really like (like a slice of banana) but gives the second monkey a less-preferred food (like a piece of cucumber). So, while both monkeys are working equally hard by exchanging tokens, they are rewarded differently."
      },
      {
        "type": "paragraph",
        "text": "If the monkey getting the less-preferred food refuses to keep exchanging tokens or to eat the food it is given, scientists conclude the monkeys are averse to inequity—they are aware they are getting less than the other monkey, which is not fair, and they quit. In contrast, if the monkey getting the better food refuses to exchange or take rewards, scientists conclude that the monkeys are sensitive to advantageous inequity (for example, getting more than the other monkey for the same work, which is also unfair)."
      },
      {
        "type": "paragraph",
        "text": "Scientists have run these kinds of inequity aversion tests with a few different monkey species, including rhesus macaques, capuchin monkeys, squirrel monkeys, night monkeys (also called owl monkeys), and marmosets. Like the sharing studies described earlier, these studies have revealed that there are differences across monkey species. Generally, monkeys that are cooperative breeders (such as marmosets) do not respond to inequity. In contrast, other monkeys (such as capuchins) do respond to inequity: when they are getting a less-preferred food than another monkey for the same work, they refuse to keep working and/or reject the food they are offered. Monkeys do not appear to respond to advantageous inequity, however. That is, they do not tend to mind if they get a better reward than others."
      },
      {
        "type": "heading",
        "text": "What About Wild Monkeys?"
      },
      {
        "type": "paragraph",
        "text": "The research we have discussed has taken place in zoos and laboratories. But do we see evidence of fairness in monkey behavior in the wild? We certainly see monkeys acting in ways that help each other out. For example, vervet monkeys give alarm calls to warn their group about nearby predators, cottontop tamarins chirp and alert others to the presence of good food, and baboons form coalitions to support each other in fights. Yet, in other contexts, we see monkeys acting selfishly and sometimes even deceiving one another to ensure they get the most for themselves. Whether the monkeys understand the amount of benefits they each gain and the amount of work they each contribute is not clear from these observations. That is why the experiments discussed above can help scientists understand to what degree fairness plays a role in the behaviors we observe."
      },
      {
        "type": "heading",
        "text": "Conclusions"
      },
      {
        "type": "paragraph",
        "text": "Ultimately, monkeys’ sense of fairness does not seem to be as well-developed as our own, but by studying monkeys’ preferences for fairness, and their responses to unfair situations, we can learn more about how these values evolved in humans. People are inherently interested in knowing why we are the way we are, and if we are unique from other animals. When we learn about other primates, and how their minds work, we learn more about ourselves. We also learn more about the monkeys—whether they pay attention to what others get, what they find unfair, how these responses depend on relationships, and how monkey species differ from one another. This helps us to understand the natural world, and can sometimes help us better understand how to care for them in captivity as well."
      }
    ],
    "vocabulary": [
      {
        "id": "a009-v01",
        "term": "Inequity Aversion",
        "definition": "When an individual responds negatively to receiving a different reward than they deserve, typically shown by rejecting the reward they are offered or by refusing to participate in the activity further.",
        "example": "People typically do not like getting less than someone else; this is called inequity aversion.",
        "synonym": ""
      },
      {
        "id": "a009-v02",
        "term": "Cooperative Breeding",
        "definition": "When members of the social group other than the biological parents help raise the offspring in the group.",
        "example": "One idea that scientists have considered to explain species differences is the called the cooperative breeding hypothesis.",
        "synonym": ""
      },
      {
        "id": "a009-v03",
        "term": "Inequity",
        "definition": "An unfair outcome in which one individual receives a different reward than they deserve, such as unequal pay for equal work.",
        "example": "Furthermore, while monkeys appear to recognize unfair outcomes, they only seem concerned by inequity when they receive less than others, not when they receive more.",
        "synonym": ""
      },
      {
        "id": "a009-v04",
        "term": "Advantageous Inequity",
        "definition": "An unfair outcome in which one individual receives more than other individual for doing the same amount of work (opposite: disadvantageous inequity).",
        "example": "In contrast, if the monkey getting the better food refuses to exchange or take rewards, scientists conclude that the monkeys are sensitive to advantageous inequity (for example, getting more than the other monkey for the same work, which is also unfair).",
        "synonym": ""
      }
    ],
    "source": {
      "publisher": "Frontiers for Young Minds",
      "url": "https://kids.frontiersin.org/articles/10.3389/frym.2020.550299",
      "authors": [
        "Katherine A. Cronin",
        "Lydia M. Hopper"
      ],
      "citation": "Cronin KA and Hopper LM (2020) Do Monkeys Care What Is Fair?. Front. Young Minds. 8:550299. doi: 10.3389/frym.2020.550299",
      "copyright": "Copyright © 2020 Cronin and Hopper",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "adaptationNote": "Text adapted for reading practice: illustrations, figure pointers and reference markers omitted; glossary definitions retained. The original illustrated article is linked above."
    }
  },
  {
    "id": "a010",
    "slug": "hero-from-the-east-how-zero-came-to-the-west",
    "title": "Hero From the East: How Zero Came to the West",
    "teaser": "While the Babylonians, Greeks, and Romans were able to do remarkably sophisticated calculations, mathematical development was limited until introduction of a true zero. In this article, we will explain why zero was such an important development.",
    "category": "Learning",
    "tags": [
      "mathematics and economics",
      "learning",
      "placeholder",
      "whole numbers",
      "middle ages",
      "radiocarbon dating"
    ],
    "readMinutes": 11,
    "publishedLabel": "New",
    "cover": {
      "theme": "midnight-gold",
      "icon": "GraduationCap",
      "motif": "LEARNING"
    },
    "blocks": [
      {
        "type": "lead",
        "text": "While the Babylonians, Greeks, and Romans were able to do remarkably sophisticated calculations, mathematical development was limited until introduction of a true zero. In this article, we will explain why zero was such an important development. We try to answer the question: where did zero come from and how old is the concept of zero? There is strong evidence that zero is an Eastern development that came to the West from India or a civilization with roots in India, such as Cambodia. This would mean that zero is not a Greek or Western invention, as scholars had long thought. Mathematics is a wonderful mystery—many questions remain about how and why zero developed in the East and how it likely traveled to Europe."
      },
      {
        "type": "heading",
        "text": "Zero, a Hard-Working Hero!"
      },
      {
        "type": "paragraph",
        "text": "Imagine for a minute what your life would be like without that little circle we use to represent zero!"
      },
      {
        "type": "paragraph",
        "text": "While we take zero for granted, it is a relatively recent invention. The Babylonians and Romans did not have a way to represent zero with a distinct symbol; nor did the Greeks, who did not think “nothing” was a number. The Mayans living in Central America used the idea of zero 1 in their calendar system, but because they were isolated from other people, their zero did not travel beyond their own civilization. To find the source of zero, we must look elsewhere."
      },
      {
        "type": "paragraph",
        "text": "Let us look at numerals used in ancient Babylon, where there was a sophisticated mathematical system over 5,000 years ago. This system was developed and refined from even older systems of writing numbers and making calculations! We know a lot about the Babylonian system, because they wrote on clay tablets that have survived. The Babylonians were good mathematicians and astronomers who used a complicated base 60 system, rather than our base 10 system2. In modern mathematics, we still use base 60 for certain functions. For example, think of how we keep time: 60 s in a minute, 60 min in an hour. The Babylonians, like us, used positions (like our base 10 ones, tens, hundreds, thousands) to represent numbers. But using the base 60 system meant that calculations and keeping track of places was exceedingly complicated. In the base 60 system, positions become sixes, sixties, six hundreds, six thousands. Imagine that you are trying to keep track of positions with no symbol for zero to mark the space. That little symbol for zero is very helpful. The Babylonians eventually began to mark the empty column with a space, but just think how easy it must have been to miss a space in columns of numbers. With their complicated system, the Babylonians had to rely on context to understand the meaning of a number. As an example of using context, if someone tells you that something costs four-fifty, you could assume $4.50, if you were thinking about ordering an ice cream, rather than $450, which might seem logical if you were buying an airline ticket."
      },
      {
        "type": "paragraph",
        "text": "The Greeks knew of zero as a concept but did not think of it as a number with the same usefulness in mathematics as the numbers 1–9. According to Aristotle, it was not possible to divide by 0 and get a meaningful result, so the Greek system was based on 9 numbers—no zero."
      },
      {
        "type": "paragraph",
        "text": "The Romans did not use numerals for calculations, so they did not have the need for a zero to hold a place or keep a column empty. The Roman numeral system was used for trade and they did not need to represent zero with a special symbol. They used a counting board for computations and their numerals were used only for writing down the results. This does not mean they did not understand nothingness. They had a word to mean nothing but no symbol."
      },
      {
        "type": "heading",
        "text": "Super Zero!"
      },
      {
        "type": "paragraph",
        "text": "Why do we care about zero? Zero can be used as a placeholder, with no value on its own, or as a mathematical number. For example, when we name a year, such as 2019, each numeral has its own well-defined place. We call the zero a placeholder, as it tells us that there are zero 100s. We can represent our system, in base 10, with columns as seen below:"
      },
      {
        "type": "paragraph",
        "text": "That 0 keeps the 1s on either side “in place” so we know their value. Take that placeholder away, and it is no longer clear what number we mean."
      },
      {
        "type": "paragraph",
        "text": "Zero can be more than a placeholder. Zero also marks the dividing point between positive numbers and negative numbers. If we count backwards with whole numbers, we reach zero. Similarly, if we count forward with negative numbers, we also arrive at 0."
      },
      {
        "type": "paragraph",
        "text": "As long as you only want to count and measure, you can do it without zero. But with no zero, advanced mathematics would be impossible: no algebra, no calculus. And we would not have computers, because computers use a binary, or base 2 system, meaning that information is recorded and read as a series of 0s and 1s."
      },
      {
        "type": "heading",
        "text": "Who Invented Zero?"
      },
      {
        "type": "paragraph",
        "text": "Arabs in the Middle Ages—centuries after the greatest age of Greek mathematics—were both remarkable mathematicians and important transmitters of ancient knowledge, including mathematics. Muhammad ibn Musa al-Khwarizmi was a famous Persian mathematician, astronomer, and geographer who contributed much to our modern understanding of mathematics, especially in the areas of algebra and trigonometry. His name—Al-Khwarizmi—eventually became Algorithmi when translated into Latin. From that Latinized version of his name, we got the word algorithm, which means the set of rules we follow when we do calculations. In the early ninth century CE, Al-Khwarizmi was head astronomer and librarian in the famous House of Wisdom in Baghdad, where he studied scientific and mathematical manuscripts, including those of the ancient Greeks and Hindus."
      },
      {
        "type": "paragraph",
        "text": "In Al’Khwarizmi on the Hindu Art of Reckoning, he describes a Hindu, or Indian, number system, based on 10 numerals: 1–9, and 0. He gives credit for this zero, saying that he had discovered it when he translated the mathematical works of the seventh century CE Indian scholar Brahmabgupta. This useful system was soon adopted by the Arab world."
      },
      {
        "type": "heading",
        "text": "Zero Travels a Long Road to Europe"
      },
      {
        "type": "paragraph",
        "text": "Europeans in the Middle Ages were still conducting business using Roman numerals. But trade routes did more than move silks and spices from the East to the West—they also moved knowledge. Fibonacci, the son of an Italian merchant, often traveled for his father’s business. In North Africa he discovered that Arab traders were using an accounting system based on 10 numbers, 1–9 + 0. He quickly understood that this system could improve bookkeeping and accounting in Europe. In 1202, he published a book called Liber Abaci, which spread the idea of this new number system that had a zero “to keep the rows.” The book talked about the system’s practical applications: how to convert one currency to another, calculations of profits and losses, and other important business needs."
      },
      {
        "type": "heading",
        "text": "The Search Moves to India and Cambodia"
      },
      {
        "type": "paragraph",
        "text": "Georges Cœdès was in his early 20s when he visited the Near East Collection at the Louvre, the famous museum in Paris near where he lived. He was intrigued an ancient Babylonian inscription in a display. This early experience led him to study ancient languages and to spend his life uncovering ancient mysteries contained in inscriptions from Southeast Asia."
      },
      {
        "type": "paragraph",
        "text": "Cœdès had an intriguing theory. He believed that numerals had originated in civilizations throughout Asia that shared a common culture based in the religions of Buddhism or Hinduism. Other scholars at the time assumed that numbers had to have come from Greece or Arabia, but Cœdès felt that this belief failed to value the intellectual developments of the East. At this point, Cœdès had no proof for his theory. Then, in the course of his work, he came across an untranslated inscription found on a stone that he called K-127, from an ancient temple at Sambor on Mekong in Cambodia. Translating the writing, he was stunned to discover that it contained the elusive zero that he had hoped to find!."
      },
      {
        "type": "paragraph",
        "text": "The inscription describes a merchant’s transactions and includes a date with a zero—a placeholding zero—represented as a small dot! Whoever carved the inscription conveniently added the date: 605 of the çaka era. Converting the çaka date to our own calendar system was not difficult. Cœdès knew that the first king of the çaka era began his rule in the year 78, so by adding 78 to the 605 on the stone he knew that the inscription had been made in the year 683 CE. Cœdès had his proof, which he published in a 1931 scientific paper. This proved that zero had originated in the East, because this zero found in Cambodia was carved before the work of Arab mathematicians. This early finding proved that our written digits and the zero had an Eastern, Asian origin."
      },
      {
        "type": "heading",
        "text": "Another Twist to Our Number Theory"
      },
      {
        "type": "paragraph",
        "text": "About 40 years before Cœdès translated K-127, a manuscript written on birch bark, called the Bakhshali Manuscript, was found in Bakhshali, in what is now Pakistan. This text contained an ancient zero represented by a small circle. The age of this zero was not known, but some experts believed it was very old. Unlike K-127, this manuscript did not conveniently include a date in the text, so it was hard to determine when it was written. Also, scholars believed that parts of the manuscript had been written at different times."
      },
      {
        "type": "paragraph",
        "text": "Today, the Bakhshali is in the Bodleian Library of Oxford University. In 2017, the Bodleian permitted a small piece of the bark material to be removed for radiocarbon dating. Results indicated that the portion containing the zero dates from the third or fourth century. If this is correct, the Bakhshali manuscript is older than K-127, and older than any inscription containing zero yet discovered. Some experts are not convinced. Their argument is that the section removed for testing did not contain any writing—and because the pages are believed to have been written at different times, this presents a problem. Scientists are hoping the Bodleian Library will conduct further tests on other parts of the manuscript. Many questions remain—how accurate is the method of dating used on the manuscript? Will other, older zeros be discovered? And finally, how did the idea of zero move from India to Cambodia and Indonesia and then spread to the rest of the world? What we do know is that the zero we use today was born in Southern Asia! We hope future historians of mathematics will fill in more pieces of this intriguing puzzle."
      },
      {
        "type": "heading",
        "text": "End of Story?"
      },
      {
        "type": "paragraph",
        "text": "So why did an Indians civilization invent zero? While the Greeks believed zero was nothing, nothingness was very important in certain religions of the East, including Buddhism and Hinduism. Perhaps Indian religion and philosophy hold a clue. In any event, mathematics—and the numbers—have many questions just waiting for you to explore."
      }
    ],
    "vocabulary": [
      {
        "id": "a010-v01",
        "term": "Placeholder",
        "definition": "A number with no value on its own, used in decimals and number lines to show the value of other numbers.",
        "example": "Zero can be used as a placeholder, with no value on its own, or as a mathematical number.",
        "synonym": ""
      },
      {
        "id": "a010-v02",
        "term": "Whole Numbers",
        "definition": "Non-decimal or non-fraction numbers, such as 1, 2, 3 onwards.",
        "example": "If we count backwards with whole numbers, we reach zero.",
        "synonym": ""
      },
      {
        "id": "a010-v03",
        "term": "Middle Ages",
        "definition": "The time period in European history from the fall of the Roman Empire in the West (around 1100) to the fall of Constantinople (1453).",
        "example": "Arabs in the Middle Ages—centuries after the greatest age of Greek mathematics—were both remarkable mathematicians and important transmitters of ancient knowledge, including mathematics.",
        "synonym": ""
      },
      {
        "id": "a010-v04",
        "term": "Radiocarbon Dating",
        "definition": "A scientific method used to determine the age of an object based on a radioactive isotope of carbon.",
        "example": "In 2017, the Bodleian permitted a small piece of the bark material to be removed for radiocarbon dating.",
        "synonym": ""
      }
    ],
    "source": {
      "publisher": "Frontiers for Young Minds",
      "url": "https://kids.frontiersin.org/articles/10.3389/frym.2019.00128",
      "authors": [
        "Miriam R. Aczel",
        "Debra Aczel",
        "Marina Ville"
      ],
      "citation": "Aczel MR, Aczel D and Ville M (2019) Hero From the East: How Zero Came to the West. Front. Young Minds. 7:128. doi: 10.3389/frym.2019.00128",
      "copyright": "Copyright © 2019 Aczel, Aczel and Ville",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "adaptationNote": "Text adapted for reading practice: illustrations, figure pointers and reference markers omitted; glossary definitions retained. The original illustrated article is linked above."
    }
  },
  {
    "id": "a011",
    "slug": "is-throwing-an-apple-core-out-of-the-car-littering-microbial-communities-in-natural-composting",
    "title": "Is Throwing an Apple Core Out of the Car Littering?—Microbial Communities in Natural Composting",
    "teaser": "Have you ever thrown an apple core or an orange peel out of the car window? Is this littering?",
    "category": "Science",
    "tags": [
      "earth sciences",
      "science",
      "decomposition",
      "carbon cycle",
      "nutrients",
      "microbial communities",
      "mass"
    ],
    "readMinutes": 9,
    "publishedLabel": "New",
    "cover": {
      "theme": "forest-emerald",
      "icon": "Compass",
      "motif": "SCIENCE"
    },
    "blocks": [
      {
        "type": "lead",
        "text": "Have you ever thrown an apple core or an orange peel out of the car window? Is this littering? What happens if it lands on the pavement? Is it the same as if it lands in a patch of soil on the side of the road? Apple cores, orange peels, leaves, and other plant materials are made up of complex carbon compounds, which get broken down over time into simpler forms of carbon in a process called decomposition. Decomposition is a key part of the carbon cycle. And decomposition is largely done by microbial communities, groups of tiny living organisms, invisible cities that live everywhere on Earth. Can you imagine these invisible cities, eating the apple core that you threw away or a pile of leaves on the ground? How quickly do the dead plants decompose? And where is the carbon going?"
      },
      {
        "type": "heading",
        "text": "What is Decomposition?"
      },
      {
        "type": "paragraph",
        "text": "Composting, creating a pile or bin of food scraps and yard clippings and allowing this waste to decompose to create soil, is one example of decomposition. Decomposition is the process by which compounds such as plant tissue, which are made of complex carbon, are broken down into simpler forms of carbon. The element carbon (C) is the basis of all life on Earth and is part of the ocean, air, rocks, and even us. Carbon moves between different forms through the carbon cycle. In the atmosphere, carbon is attached to oxygen and makes a gas called carbon dioxide (CO2). Plants use CO2, water, nutrients, and sunlight to grow. The carbon is incorporated into the plants in the form of complex compounds. Eventually, plants die and decompose. As part of the decomposition process, some of carbon is released into the air as CO2 and some of the carbon is stored in the soil. Other nutrients, such as nitrogen and phosphorous, are also released from the dead plants, fertilizing the soil."
      },
      {
        "type": "heading",
        "text": "Do You Know How Dead Plants Decompose?"
      },
      {
        "type": "paragraph",
        "text": "Microbes, which are tiny living organisms such as bacteria and fungi, break down plant tissue, using it as food, an energy source. Microbes live on every part of the Earth. When different types of microbes are found together in the same place, scientists refer to them as microbial communities. These communities, even though they are made up of millions of individual microbes, are so small that we cannot see them; they are like invisible cities living among us. But, just because they are small does not mean that they are not important. Microbial communities are crucial for life on Earth. One of the important roles of microbial communities is to decompose dead plants and animals, in order to help to move carbon through the carbon cycle and release nutrients into the soil. As microbes use the carbon from the dead plants, they release some into the air as CO2 and they store some carbon in the soil. This soil carbon takes many forms. For example, some carbon is incorporated into microbial cells as they grow, and some carbon helps to form new soil particles or attaches to older soil particles."
      },
      {
        "type": "paragraph",
        "text": "Composting speeds up the natural process of decomposition by creating conditions that allow the microbial communities to work extra efficiently. But decomposition does not only happen in compost, it is essential in the natural environment as well. What happens when leaves fall off trees? Well, in your yard, you might rake them up and jump in them. But what if you did not? They would not just pile up higher and higher year after year. They would eventually be decomposed by microbes, just like the material in a compost pile."
      },
      {
        "type": "heading",
        "text": "How Do Scientists Measure Decomposition?"
      },
      {
        "type": "paragraph",
        "text": "While we cannot see decomposition as it occurs, we can measure its effects by weighing decomposing material to see how much mass is lost over time. Tools that scientists often use to measure the decomposition of plants are called litterbags. Litterbags are containers that are constructed out of mesh, a material that is permeable enough to let water, air, and nutrients through. Litterbags are filled with plant material, weighed, left outside in the field for some amount of time, and then collected and re-weighed. The amount of mass lost can be used to calculate a decomposition rate (mass loss per time). The decomposition rate tells us how quickly or slowly material is being decomposed. Litterbags allow scientists to test which factors affect decomposition rates in an ecosystem. The factors scientists are interested in testing include the amount of moisture present, soil pH, the types of plants that are decomposing, and microbial diversity, which means the different types and numbers of microbes present in the soil."
      },
      {
        "type": "heading",
        "text": "Do Different Microbial Communities Decompose Plant Material More Slowly or Quickly?"
      },
      {
        "type": "paragraph",
        "text": "One example that showed the importance of microbes in decomposition was an accidental experiment, the Chernobyl disaster, a catastrophic nuclear accident that occurred in 1986 in what is now Ukraine. The accident released massive amounts of radioactive material from a nuclear plant, impacting humans and the environment. In terms of the microbes, the accident sterilized the soil, killing the microbial communities. Almost 30 years later, the site of this accident has accumulated tall piles of fallen leaves and many dead trees; the dead plant material is not decaying. When scientists conducted litterbag experiments to determine why, they found that the really slow decomposition was mostly due to the lack of microbes."
      },
      {
        "type": "paragraph",
        "text": "Scientists can set up field experiments when they have questions they want to answer. For example, how will climate change impact decomposition rates? In one study, to answer this question, researchers added different microbial communities, one from a dry grassland environment and one from a wet grassland environment, to litterbags containing sterilized grassland plant material. These litterbags were made out of mesh with really, really small holes, to make a cage for the microbes so they could not get in or out. The litterbags were weighed and then placed outside in a grassland and collected after many months. The researchers found that the litterbags containing the microbial communities from the dry conditions had slower decomposition rates than those from the wetter conditions, even though the litterbags were placed in the same environment during the experiment. This example shows that the kinds of microorganisms that are present in the community influence the rate of decomposition. The researchers hypothesized that the microbial community from the dry environment worked slower, because those microbes were specialized for surviving in harsher conditions, while the microbes from the wet environment were better at decomposing dead plants more quickly. More experiments are continuing to test this hypothesis."
      },
      {
        "type": "heading",
        "text": "Why are Scientists Interested in Learning More about Decomposition?"
      },
      {
        "type": "paragraph",
        "text": "Decomposition is part of nature’s recycling process. It is not just an ending, but also a beginning. It is part of the global carbon cycle, which is critical to life on Earth. For plant material in particular, in natural ecosystems, researchers want to know how decomposition affects soil quality and how decomposition might change with a changing climate. Will warmer temperatures speed up decomposition, putting more CO2 into the atmosphere? Maybe, but microbial communities might not work as quickly in warmer climates, or they might switch what they like to eat. Many complex pieces work together to drive the decomposition process and we do not yet know how they all work together."
      },
      {
        "type": "paragraph",
        "text": "Decomposition has many other important functions. Decomposition is a key to better fuels made from plant materials. In order to use agricultural crops, such as corn or soybeans, for fuel, scientists need to figure out how to break down plant material more efficiently. One possible solution is figuring out which microbes or microbial communities might do the job. And decomposition happens inside of us. Microbial communities that are living in the gut help us to decompose and digest the food that we eat. There remains a lot to be learned about how these microbial communities affect us and our health."
      },
      {
        "type": "heading",
        "text": "How Can You Learn More about Decomposition?"
      },
      {
        "type": "paragraph",
        "text": "Guess what? You can experiment with decomposition, too! The starting tools are as simple as a piece of cloth and glue to construct litterbags, plant material, and a scale to measure changes in weight over time. What is your question? What factors do you want to investigate? Or, the next time you are about to throw something out your car window, think about this question: how quickly will it decompose? If it lands in a patch of soil, which could have high microbial diversity, it might decompose faster than if it lands on the pavement, where the microbial diversity is probably lower. And if the thing that you throw out is something that is easier for microbes to eat, like an apple core, decomposition might be faster than if you throw out something harder to break down, like an orange peel. But either way, what you throw out might still take months to decompose. You can even start exploring decomposition by making a compost pile with kitchen vegetable scraps and grass clippings and watch as it turns into soil. Yay for decay!"
      }
    ],
    "vocabulary": [
      {
        "id": "a011-v01",
        "term": "Decomposition",
        "definition": "The process by which compounds such as plant materials, which are made of complex carbon, are broken down into simpler forms of carbon; also called decay or rotting.",
        "example": "Apple cores, orange peels, leaves, and other plant materials are made up of complex carbon compounds, which get broken down over time into simpler forms of carbon in a process called decomposition.",
        "synonym": ""
      },
      {
        "id": "a011-v02",
        "term": "Carbon Cycle",
        "definition": "A series of processes by which carbon compounds change form in the environment. Two key components include uptake of carbon dioxide (CO 2 ) from the atmosphere by plants and return of carbon (C) to the atmosphere during decomposition.",
        "example": "Decomposition is a key part of the carbon cycle.",
        "synonym": ""
      },
      {
        "id": "a011-v03",
        "term": "Nutrients",
        "definition": "Substances that provide the nourishment needed for growth and life.",
        "example": "Plants use CO2, water, nutrients, and sunlight to grow.",
        "synonym": ""
      },
      {
        "id": "a011-v04",
        "term": "Microbial Communities",
        "definition": "Groups of microorganisms (life forms often too small to see), such as bacteria and fungi, that share a common living space.",
        "example": "And decomposition is largely done by microbial communities, groups of tiny living organisms, invisible cities that live everywhere on Earth.",
        "synonym": ""
      },
      {
        "id": "a011-v05",
        "term": "Mass",
        "definition": "A measurement of the amount of matter something contains. On Earth, mass and weight are the same, but on the moon, where gravity is different, an object would have the same mass as on earth but a different weight.",
        "example": "While we cannot see decomposition as it occurs, we can measure its effects by weighing decomposing material to see how much mass is lost over time.",
        "synonym": ""
      },
      {
        "id": "a011-v06",
        "term": "Litterbag",
        "definition": "A container, usually made of cloth or mesh and filled with plant material, that scientists use to measure changes in the weight of the plant material over time (decomposition rate).",
        "example": "When scientists conducted litterbag experiments to determine why, they found that the really slow decomposition was mostly due to the lack of microbes.",
        "synonym": ""
      },
      {
        "id": "a011-v07",
        "term": "Microbial Diversity",
        "definition": "Variety and variability in the abundance and types of microorganisms.",
        "example": "The factors scientists are interested in testing include the amount of moisture present, soil pH, the types of plants that are decomposing, and microbial diversity, which means the different types and numbers of microbes present in the soil.",
        "synonym": ""
      }
    ],
    "source": {
      "publisher": "Frontiers for Young Minds",
      "url": "https://kids.frontiersin.org/articles/10.3389/frym.2018.00013",
      "authors": [
        "Michaeline B. N. Albright",
        "Jennifer B. H. Martiny"
      ],
      "citation": "Albright MBN and Martiny JBH (2018) Is Throwing an Apple Core Out of the Car Littering?—Microbial Communities in Natural Composting. Front. Young Minds. 6:13. doi: 10.3389/frym.2018.00013",
      "copyright": "Copyright © 2018 Albright and Martiny",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "adaptationNote": "Text adapted for reading practice: illustrations, figure pointers and reference markers omitted; glossary definitions retained. The original illustrated article is linked above."
    }
  },
  {
    "id": "a012",
    "slug": "can-plants-be-engineers",
    "title": "Can Plants Be Engineers?",
    "teaser": "When we think of engineers, we think of making a machine, like a car. Are there engineers for ecosystems?",
    "category": "Science",
    "tags": [
      "biodiversity explore the collection",
      "science",
      "ecosystem engineer",
      "wetland",
      "introduced species",
      "native species",
      "invasive species"
    ],
    "readMinutes": 9,
    "publishedLabel": "New",
    "cover": {
      "theme": "forest-emerald",
      "icon": "Compass",
      "motif": "SCIENCE"
    },
    "blocks": [
      {
        "type": "lead",
        "text": "When we think of engineers, we think of making a machine, like a car. Are there engineers for ecosystems? When an organism can make big changes to its environment, we call it an ecosystem engineer. In aquatic ecosystems like the San Francisco Estuary, underwater plants can be important ecosystem engineers because they can change water flow and water clarity. In the Estuary, a plant called Brazilian waterweed, which was introduced by humans, is one of the most important ecosystem engineers. With its leaves and stems, this plant traps tiny particles floating in the water, making the water clearer. Clearer water has made it easier for more plants to grow and these changes helped some non-native fish species to increase in number, while some native species declined. Introduction of Brazilian waterweed has led to an entirely different ecosystem, which has also affected how people use and take care of the Estuary."
      },
      {
        "type": "heading",
        "text": "What Are Ecosystem Engineers?"
      },
      {
        "type": "paragraph",
        "text": "What do you think an engineer does? Human engineers make things, like machines or buildings. So, what would it mean for an animal or a plant to be an ecosystem engineer? Scientists that study animal and plant communities use this term to describe living organisms that make big changes in their own environments."
      },
      {
        "type": "paragraph",
        "text": "Beavers are a great example of ecosystem engineers. Beavers have sharp teeth that they use to cut down entire trees! They pile the cut wood on streams and rivers, making a dam. Once they finish, the water level above the dams rises, creating a pond. The edges of the pond also flood, creating a new habitat called a wetland. These new ponds and wetlands attract new species of fish, insects, and even birds. Is that not incredible? There are many other examples of ecosystem engineers, like termites and ants that build mounds and tunnels in the soil. While engineering these mounds and tunnels, they change how water drains through the soil and even the types of plants that can grow in that area."
      },
      {
        "type": "heading",
        "text": "What Are Invasive Ecosystem Engineers?"
      },
      {
        "type": "paragraph",
        "text": "You now know that ecosystem engineers can be very powerful. Now, let us think about what happens when an ecosystem-engineering species comes to a place where it has never been before. In general, introduced species are brought by humans, either on purpose or by accident, to an ecosystem that is different from where they originally evolved. When the introduced species is also an ecosystem engineer, it can change how the ecosystem works, and even which other species will live there."
      },
      {
        "type": "paragraph",
        "text": "Many species are introduced to a new ecosystem, but never thrive in it. Some, however, can become quite at home and spread throughout the ecosystem, competing for food and space with the native species that already live there. When this happens, these introduced species are called invasive species."
      },
      {
        "type": "paragraph",
        "text": "When invasive species are also ecosystem engineers, they can change the basic parts of an ecosystem and cause harm to native species. Crayfish are a good example. Crayfish are ecosystem engineers because they burrow in the sediment to find food. When they invade rivers and lakes that have underwater plants, their digging destroys plant roots, and the plants die. When those plants die, other tiny plant species that float in the water, called phytoplankton, start thriving because the larger plants are no longer in the way. Through their extensive burrowing, crayfish can be invasive ecosystem engineers because they cause underwater plants to disappear and allow the phytoplankton to increase. Imagine how these changes might affect animals that were used to feeding on or living on the underwater plants. They might not be able to live in their home lake or river anymore. In general, once an invasive ecosystem engineer has made its home in a new place, it is likely that the ecosystem will never be the same again."
      },
      {
        "type": "heading",
        "text": "Plants Can Also Be Engineers"
      },
      {
        "type": "paragraph",
        "text": "In rivers and estuaries, underwater plants (called aquatic plants) are some of the best-studied invasive ecosystem engineers. The leaves and stems of aquatic plants slow the movement of water and trap tiny floating particles of silt or clay. When these particles encounter a patch of aquatic plants, some will get stuck on the plants or fall to the bottom, becoming part of the sediment. This trapping of particles makes the water clearer. The clearer the water is, the more sunlight that can penetrate. More sunlight is good for the plants because they need it to grow."
      },
      {
        "type": "paragraph",
        "text": "When a new aquatic plant arrives in an ecosystem, it will trap just some of these floating particles. The water will clear up in a small area around the plant. Slowly, as the water clears, the plant will get more sunlight, grow more, and a small patch of the plant will begin to spread out to cover a larger area, even a whole river from one side to the other in some cases! The more plants there are, the more sediment will build up on the bottom, eventually reducing the water depth. Brazilian waterweed is one invasive ecosystem engineer that creates sediment, clears up the water, and reduces water depth. Let us look at what happens when this plant comes to a new ecosystem."
      },
      {
        "type": "heading",
        "text": "Invasive Aquatic Plant Ecosystem Engineers of the San Francisco Estuary"
      },
      {
        "type": "paragraph",
        "text": "In the San Francisco Estuary, Brazilian waterweed was introduced before 1950, probably because people threw away the fish and plants from their aquariums right into the Estuary waters (which is illegal to do now). Today, Brazilian waterweed has spread throughout the Estuary, and even though other aquatic plant species have been introduced, it is still the most dominant one. Some areas that had few plants 30 years ago are now nearly entirely covered with invasive plants. The invasion of Brazilian waterweed and other aquatic plants into the San Francisco Estuary has made the water clearer than it used to be. Scientists estimate that, in some areas, more than two-thirds of the increased clarity may be due to the spread of invasive ecosystem engineering plants! In beds of Brazilian waterweed, sediment can accumulate twice as fast as it did before in shallow areas of the San Francisco Estuary."
      },
      {
        "type": "paragraph",
        "text": "Brazilian waterweed in the San Francisco Estuary has also changed the fish species that live in shallow areas. Previously, shallow areas had native fishes such as perch and minnows. Baby salmon also used shallow areas to feed, as they traveled through the Estuary to get to the ocean. Today, it is much more common to see introduced fish species such as largemouth bass and sunfish. What is the connection between Brazilian waterweed and the change in the most common species of fish?"
      },
      {
        "type": "paragraph",
        "text": "Largemouth bass and sunfish were introduced into the San Francisco Estuary over a 100 years ago, long before Brazilian waterweed. For many years, these fish were not very common. However, once the invasive plants became widespread, the numbers of largemouth bass and sunfish increased. These fish do well in clear water with lots of plants around them, and this is exactly the habitat that Brazilian waterweed creates. The clear water helps these fish to see and capture their prey. The plants offer hiding places to help small fish avoid deadly encounters with larger fish. Native fishes were accustomed to using murky water to hide from predators, but with the clear water created by the plants, native fish have nowhere to hide. So, with more predators such as largemouth bass, their chances of being eaten are much higher than they used to be. Unfortunately, the number of native fish has declined dramatically in the San Francisco Estuary."
      },
      {
        "type": "heading",
        "text": "Plant Engineers Also Changed the Estuary for People"
      },
      {
        "type": "paragraph",
        "text": "When the plant ecosystem engineers changed the type of fish living in the San Francisco Estuary, they also changed people’s lives. For example, it has become popular to fish for largemouth bass in the Estuary. There are now competitions to catch the biggest largemouth bass, and the reward for the winners can be a lot of money! But Brazilian waterweed is so thick in some areas it has made it hard for boats to move through the waterways. The California government has worked to control the plant using chemicals that keep it from growing. However, the plants have become so widespread that they are difficult to control, and they will probably always exist in the San Francisco Estuary. Scientists are working hard to understand which chemicals are safe and work best, and if there are other ways of controlling the plants."
      },
      {
        "type": "paragraph",
        "text": "There are many opinions about whether the changes brought by invasive ecosystem-engineering plants are “good” or “bad.” It all depends on what we value in the ecosystem: whether we value having historical habitats like wetlands and native fish species, or whether we value fishing for largemouth bass. It is up to the people living in and using the San Francisco Estuary, as well as the governments in charge of managing it, as to whether the invasive populations of plants and fishes should be diminished. Despite these differences in opinion, we can all agree that, when invasive plants are ecosystem engineers, they can have widespread effects on the rest of the ecosystem, from fish to people!"
      }
    ],
    "vocabulary": [
      {
        "id": "a012-v01",
        "term": "Ecosystem Engineer",
        "definition": "Any organism that changes its environment through its actions (such as beavers cutting down trees) or its physical structure (such as underwater plants trapping tiny particles in the water).",
        "example": "When an organism can make big changes to its environment, we call it an ecosystem engineer.",
        "synonym": ""
      },
      {
        "id": "a012-v02",
        "term": "Wetland",
        "definition": "Land that is saturated with water. Marshes and bogs are all types of wetlands.",
        "example": "The edges of the pond also flood, creating a new habitat called a wetland.",
        "synonym": ""
      },
      {
        "id": "a012-v03",
        "term": "Introduced Species",
        "definition": "Species brought to an ecosystem by humans, either on purpose or by accident. In aquatic ecosystems, humans can accidentally bring new species on the outside of their boats.",
        "example": "In general, introduced species are brought by humans, either on purpose or by accident, to an ecosystem that is different from where they originally evolved.",
        "synonym": ""
      },
      {
        "id": "a012-v04",
        "term": "Native Species",
        "definition": "Species that are living in a region where they originally evolved. Another term with the same meaning is “indigenous species.”",
        "example": "Clearer water has made it easier for more plants to grow and these changes helped some non-native fish species to increase in number, while some native species declined.",
        "synonym": ""
      },
      {
        "id": "a012-v05",
        "term": "Invasive Species",
        "definition": "Species that are introduced to a new to an ecosystem and cause harm to it, such as outcompeting and displacing the species that were already living there.",
        "example": "When this happens, these introduced species are called invasive species.",
        "synonym": ""
      },
      {
        "id": "a012-v06",
        "term": "Sediment",
        "definition": "Solid material that settles to the bottom of a lake, river, or any waterway. Sediment can consist of particles of rock, minerals, and the remains of plants or animals.",
        "example": "Crayfish are ecosystem engineers because they burrow in the sediment to find food.",
        "synonym": ""
      },
      {
        "id": "a012-v07",
        "term": "Phytoplankton",
        "definition": "Tiny, microscopic organisms living in the water that get their energy from the sun, just like plants.",
        "example": "When those plants die, other tiny plant species that float in the water, called phytoplankton, start thriving because the larger plants are no longer in the way.",
        "synonym": ""
      },
      {
        "id": "a012-v08",
        "term": "Estuary",
        "definition": "The body of water where a river connects with the ocean and the waters are affected by the rise and fall the ocean tides.",
        "example": "In aquatic ecosystems like the San Francisco Estuary, underwater plants can be important ecosystem engineers because they can change water flow and water clarity.",
        "synonym": ""
      }
    ],
    "source": {
      "publisher": "Frontiers for Young Minds",
      "url": "https://kids.frontiersin.org/articles/10.3389/frym.2021.625070",
      "authors": [
        "J. Louise Conrad"
      ],
      "citation": "Conrad JL (2021) Can Plants Be Engineers?. Front. Young Minds. 9:625070. doi: 10.3389/frym.2021.625070",
      "copyright": "Copyright © 2021 Conrad",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "adaptationNote": "Text adapted for reading practice: illustrations, figure pointers and reference markers omitted; glossary definitions retained. The original illustrated article is linked above."
    }
  },
  {
    "id": "a013",
    "slug": "earthworms-of-the-world",
    "title": "Earthworms of the World",
    "teaser": "For decades, scientists have known where the highest numbers of species that live aboveground are found. So, they made maps of the world showing these patterns.",
    "category": "Science",
    "tags": [
      "biodiversity explore the collection",
      "science",
      "nature reserves",
      "survey",
      "statistical models",
      "ecosystem services",
      "ph"
    ],
    "readMinutes": 8,
    "publishedLabel": "New",
    "cover": {
      "theme": "forest-emerald",
      "icon": "Compass",
      "motif": "SCIENCE"
    },
    "blocks": [
      {
        "type": "lead",
        "text": "For decades, scientists have known where the highest numbers of species that live aboveground are found. So, they made maps of the world showing these patterns. For most of the aboveground groups, the highest numbers of species occur in the tropics and numbers decrease toward the poles. However, until recently, we did not understand such global patterns for many organisms living in the soil. We decided to create global maps of earthworm species richness. Earthworms provide humans with many useful services, such as moving the soils and improving their quality, which can increase the amount of food that is grown. If we want to protect earthworms and the services they provide, these global maps of earthworms are important because we need to understand where they are and why they live there."
      },
      {
        "type": "heading",
        "text": "Mapping the World’s Animals"
      },
      {
        "type": "paragraph",
        "text": "There is around 150 million km2 of land on earth. That is an area so huge that it is hard to imagine. With so much land, how do we know where the animals are, and how many there are? Why would we even want to know about the numbers of animals and their patterns across the world? Well, for example, we may want to know where to create nature reserves to protect the most species. Or maybe we are simply interested in knowing what the general pattern of animal and plant populations are, and whether that pattern is consistent across lots of different species. For example, tropical forests are known for having many different species of birds, but is that true for other animals?"
      },
      {
        "type": "paragraph",
        "text": "To learn about the numbers of animals, people (both scientists and non-scientists) usually do surveys. A survey is simply counting the number of species (or number of individuals present) using a suitable technique for that species. For example, if we want to survey butterflies, we use a hand-held net and try to capture as many butterflies as possible using consistent methods, surveying a certain area of land for a given amount of time. However, doing surveys takes time, and it can also cost a lot of money. Additionally, we will never be able to do a survey at every location in the entire world. So, how do we know how many animals there are across the world?"
      },
      {
        "type": "paragraph",
        "text": "We can use math! Specifically, we can use something scientists call statistical models, or just models for simplicity. For many decades, scientists have been creating models to estimate how many species of birds, plants, and other aboveground species there are across the globe. Unfortunately, this method has never been used for many of the organisms beneath our feet. So, we decided to create a model for earthworms. Earthworms are particularly cool. These soil organisms provide humans with many ecosystem services. They help break down the fallen leaves so that the nutrients go back into the soil, they help make our crops grow better, and they help keep our climate the way we need it. Also, for a soil organism, earthworms are quite easy to survey because we can see them! Besides, there is quite a lot of information available about earthworms."
      },
      {
        "type": "heading",
        "text": "What Did We Do to Understand Global Patterns of Earthworms?"
      },
      {
        "type": "paragraph",
        "text": "To create a model to estimate the number of earthworms across the world, we needed data specifically about earthworms. Earthworm data consists of the numbers of earthworm species, collected using surveys. One person cannot survey everywhere, but we wanted to get as many surveys from across the globe as possible. So, we asked lots of other scientists to send us data from their surveys. These people were earthworm scientists that we knew, or who had already published the results of their surveys in scientific journals. We were confident that the data were trustworthy, especially the data that had already been analyzed and published. When scientists publish papers, their data are always checked and critiqued by other scientists. The surveys were often done using slightly different methods, but many scientists simply dug a square hole in the ground, searched the soil for earthworms, and counted the numbers of earthworm species they removed. In total, we gathered data from 180 researchers across the globe, containing just over 9,000 surveys of earthworms."
      },
      {
        "type": "paragraph",
        "text": "The number of earthworm species scientists counted in their surveys ranged from no species in several surveys to 12 species found in another. We also needed information about the climate (for example, the temperature and rainfall) and the soil (such as the pH) at the location of each survey. We got this type of information from freely available databases."
      },
      {
        "type": "paragraph",
        "text": "Models ultimately use a certain factor (such as climate, soil pH) to estimate the number of earthworm species in an area. To understand how models work, imagine this: we survey lots of beaches and ask ice cream sellers how many ice cream cones they have sold. We then get information on the average temperature at each beach. We could then create a model showing how temperature affects the number of ice cream cones sold at each beach. As you might expect, the hotter the temperature, the more ice cream cones are sold. Using this model, we could then estimate how many ice creams will be sold at any temperature, which gives us an idea about ice cream cone sales on beaches where we cannot survey. We can do something similar for earthworms to see how the numbers of species found in a survey changes with an environmental factor like temperature."
      },
      {
        "type": "paragraph",
        "text": "Our earthworm model contains many details about the environment−12 different aspects in total—but the basic principle remains the same. The 12 environmental details included information about the soil, the type of vegetation covering the ground, and the climate. Using our model, we then estimated how many species of earthworms there are for all points in the world, and we made a map of that."
      },
      {
        "type": "heading",
        "text": "What We Found Out About Earthworms"
      },
      {
        "type": "paragraph",
        "text": "As we mentioned at the beginning of this article, we usually expect the tropics to have the highest numbers of species. This is because, typically, we find more species in places that have higher temperatures. What our maps show is that this is not the case for earthworms. Our model indicates that, if you were to do a survey in a tropical region and one in a temperate region, you would find more earthworm species in the temperate region."
      },
      {
        "type": "paragraph",
        "text": "Why might this be? There are many aspects of the environment that shape the number of earthworm species found in a survey. And although the soil is important, we found that climate (for example, temperature and amount of rain) was the most important factor determining the number of species. As earthworms prefer to live in moist, warm conditions, the temperate region is much more suitable for them. There are more earthworm species where the environmental conditions are ideal. As long as the environment is not too extreme—too dry, too wet, too hot, too cold—it is very likely that there will be earthworms. Some species of earthworms may like conditions that are slightly different from most other earthworms. Alternatively, some species of earthworms may tolerate living in regions that are less than ideal, because there are fewer species to compete with for food, for instance, but this is an area scientist are still studying."
      },
      {
        "type": "heading",
        "text": "Earthworm Models Can Broaden Conservation Efforts"
      },
      {
        "type": "paragraph",
        "text": "Earthworms are really important for many ecosystem services that humans need, such as increasing food production. With the new knowledge gained from our model, we hope that earthworms will now be considered when scientists and conservationists think about creating nature reserves. Typically, nature reserves are established based on the number of species of plants or other aboveground organisms. But, since high numbers of earthworm species do not exist in the tropics (unlike many aboveground plants and animals), we need to think about earthworms and other soil organisms separately, and potentially establish nature reserves just for them."
      },
      {
        "type": "paragraph",
        "text": "Also, as we found that climate is the main aspect of the environment correlated with the numbers of earthworms, the fact that our climate is changing is concerning. Our future research will establish how the numbers of earthworms change as the climate changes, since some species may respond positively to changes in climate, whereas others may not. We need to understand how climate change will affect earthworms and other soil organisms, so that we can prepare to protect these valuable organisms for the future."
      }
    ],
    "vocabulary": [
      {
        "id": "a013-v01",
        "term": "Nature Reserves",
        "definition": "Areas where the animals, plants, and the environment are protected.",
        "example": "Well, for example, we may want to know where to create nature reserves to protect the most species.",
        "synonym": ""
      },
      {
        "id": "a013-v02",
        "term": "Survey",
        "definition": "Counting the number of species (or number of individuals present) using a suitable technique for that species.",
        "example": "A survey is simply counting the number of species (or number of individuals present) using a suitable technique for that species.",
        "synonym": ""
      },
      {
        "id": "a013-v03",
        "term": "Statistical Models",
        "definition": "The process of trying to use known factors (such as temperature) to predict a factor that we may not be able to measure (such as the number of earthworm species).",
        "example": "Specifically, we can use something scientists call statistical models, or just models for simplicity.",
        "synonym": ""
      },
      {
        "id": "a013-v04",
        "term": "Ecosystem Services",
        "definition": "Benefits to humans provided by the natural environment and the organisms in it. Ecosystem services can include increasing food production, breaking down fallen leaves, and helping to keep our climate the way we need it.",
        "example": "These soil organisms provide humans with many ecosystem services.",
        "synonym": ""
      },
      {
        "id": "a013-v05",
        "term": "pH",
        "definition": "The scale used to specify how acidic (lemon juice is acidic) or how alkali (baking soda is alkali) something is.",
        "example": "We also needed information about the climate (for example, the temperature and rainfall) and the soil (such as the pH) at the location of each survey.",
        "synonym": ""
      },
      {
        "id": "a013-v06",
        "term": "Temperate Region",
        "definition": "The earth’s middle latitudes, which span between the tropics and the polar regions. The temperate region typically has more distinct seasons (spring, summer, autumn, and winter) compared to tropical climates.",
        "example": "Our model indicates that, if you were to do a survey in a tropical region and one in a temperate region, you would find more earthworm species in the temperate region.",
        "synonym": ""
      }
    ],
    "source": {
      "publisher": "Frontiers for Young Minds",
      "url": "https://kids.frontiersin.org/articles/10.3389/frym.2021.547660",
      "authors": [
        "Helen R. P. Phillips",
        "Erin K. Cameron",
        "Nico Eisenhauer"
      ],
      "citation": "Phillips HRP, Cameron EK and Eisenhauer N (2021) Earthworms of the World. Front. Young Minds. 9:547660. doi: 10.3389/frym.2021.547660",
      "copyright": "Copyright © 2021 Phillips, Cameron and Eisenhauer",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "adaptationNote": "Text adapted for reading practice: illustrations, figure pointers and reference markers omitted; glossary definitions retained. The original illustrated article is linked above."
    }
  },
  {
    "id": "a014",
    "slug": "blind-humans-can-develop-the-superpower-of-bats",
    "title": "Blind Humans Can Develop the Superpower of Bats!",
    "teaser": "In comic books, the superheroes have fascinating powers and abilities that help them to deal with all kinds of challenges that arise in their daily lives. Take Superman as an example.",
    "category": "Psychology",
    "tags": [
      "neuroscience and psychology",
      "psychology",
      "echolocation",
      "neurons",
      "primary visual cortex",
      "topographic maps",
      "echo"
    ],
    "readMinutes": 10,
    "publishedLabel": "New",
    "cover": {
      "theme": "royal-violet",
      "icon": "Brain",
      "motif": "PSYCHOLOGY"
    },
    "blocks": [
      {
        "type": "lead",
        "text": "In comic books, the superheroes have fascinating powers and abilities that help them to deal with all kinds of challenges that arise in their daily lives. Take Superman as an example. He uses his super-hearing ability to know what is going on in the city. Curiously, some of these exceptional abilities can be found where we least expect them—in animals like bats. Bats have an ability called echolocation that helps them to perceive obstacles, food, and potential dangers in the dark. Humans can also learn the superpower of echolocation. Scientists have found that some blind people can echolocate, and that they still use the vision area of the brain to understand the environment! In other words, they can “see with their ears”! Keep reading to find out what happens in the brain to allow humans to have an echolocation superpower like bats!"
      },
      {
        "type": "heading",
        "text": "Introduction"
      },
      {
        "type": "paragraph",
        "text": "Our senses are like superpowers that help us to perceive the world, plan, decide, and react to everything we encounter. Sometimes we plan our reactions; other times, we react so quickly that we do not even think about it. This variety of responses is due to the way that the brain is organized. Vision is a precious power that allows us to interpret the world. Vision shows us a world of countless colors and shapes, rich in clues that allow us to understand our location and the orientation of our bodies, to move around obstacles safely, and to avoid danger."
      },
      {
        "type": "paragraph",
        "text": "The powers of comic book superheroes are often beyond human abilities. Some of them are skills that we do not have, but other animals do have, such as flying, super strength, and heightened or new senses. Have you ever wondered how Superman knows exactly where and when someone is facing danger? Superman’s most important superpower is super-hearing! He can hear a cry for help, a bomb ticking, and even a runaway car, no matter how far away they are. Imagine being able to listen for sounds over great distances and know precisely where they are coming from! In real life, bats have a version of this superpower, too!"
      },
      {
        "type": "paragraph",
        "text": "Bats are the second largest group of mammals, and the only mammals capable of flying. Bats navigate using a special ability called echolocation. They emit sounds and use the echoes that come back to locate the obstacles around them. If we could learn this ability, how would our brains readjust? How could we decide which actions to take or even detect objects in our surroundings without visual cues? Could humans and bats have more in common than one might think?"
      },
      {
        "type": "heading",
        "text": "Train Tracks Maps the Brain"
      },
      {
        "type": "paragraph",
        "text": "The brain is responsible for storing, interpreting, and organizing all the information we receive from the world through our senses. Almost immediately, this information can be transformed into a reaction, movement, or behavior. For instance, our brains can capture visual cues and move our bodies to dodge something that is coming toward us, often without us even thinking about it. How does this happen?"
      },
      {
        "type": "paragraph",
        "text": "The retina, a layer at the back of our eyeballs that is sensitive to light, captures visual information from the environment and transforms it into electrical activity. This electrical activity passes along cells called neurons, to the brain. You can imagine the brain as a large train network. The passengers are the electrical energy from the retina that will travel along tracks made of neurons, past various train stations—areas of the brain where different levels of processing take place. The last stop for visual information is a part of the brain called the primary visual cortex, which allows us to become conscious of what we are seeing. Each of our senses has its own rail lines and stations in the brain. Occasionally, these lines intersect, and the interactions between our senses and our memories can complement the visual information taken in through our eyes."
      },
      {
        "type": "paragraph",
        "text": "The human brain has a very particular organization: the train rails are very precise, so that they tightly regulate the transport of information through the proper brain stations on the way to its final stop. This organization is called topographic maps. This is like each passenger on a specific train needing a train ticket with a predetermined destination, so no one can mistakenly go to the wrong place. The brain is organized this way so that information from the senses does not get mixed up and can be extremely specific and detailed. For example, the proper flow of electrical activity through the different stations in the brain enables us to see colors, borders, perspectives, and depths, and to perceive shapes and movement extremely precisely."
      },
      {
        "type": "heading",
        "text": "Echolocation: The Superpower of Bats"
      },
      {
        "type": "paragraph",
        "text": "About 200 years ago, a researcher named Lazaro Spallanzani was the first to study echolocation in bats. He noticed that, even in the total absence of light, bats never collided with obstacles. Today we know that bats, dolphins, and whales use echolocation. These animals can emit sounds at frequencies that are either higher (bats) or lower (dolphins and whales) that those humans can hear. These sounds travel through the environment and, when they encounter obstacles, they bounce off and return to the animals’ ears, to help them to understand the surrounding environment. The sounds emitted by these animals are called vocalizations and the sounds that returns are called the echoes."
      },
      {
        "type": "paragraph",
        "text": "Sound behaves differently in environments with different obstacles. One characteristic of sound that changes according to the environment is called geometric propagation. Geometric propagation refers to the distance over which the sound spreads out. The farther away the sound travels through the air, the weaker it becomes. Objects also absorb and reflect sound differently. For instance, if you knock on a wooden door and then on a metal one, you can notice that the sound is different. Imagine being able to tell apart the echoes that bounce off a tree, a fly, or even a bird! That is exactly what bats can do! They vocalize so that, upon hearing the echo, they know exactly what is ahead. They can determine how far away objects are, as well the height and size of objects."
      },
      {
        "type": "paragraph",
        "text": "Echolocation is an important tool that helps bats navigate around obstacles, communicate, and find food. Bats have had this skill for millions of years and they have developed structures, like large ears, that help them to interpret the echoes. Each bat species vocalizes at a different rate, intonation, and frequency and it is related to the type of food they eat. There are bats that feed on fruits, insects, nectar, fish, and blood, as well as small vertebrates such as mice and lizards. But what about humans? Can humans use echolocation?"
      },
      {
        "type": "heading",
        "text": "Blind Humans Use Echolocation!"
      },
      {
        "type": "paragraph",
        "text": "Studies have reported that blind humans can use echolocation to avoid obstacles. According to one study, two blind people who lost their sight at a young age learned to detect surrounding objects using mouth-clicks as echolocators! The scientists measured the brain function of these individuals while they were echolocating objects in front of them. The scientists compared the results of the two blind people to results from two people with normal vision. The scientists found that the two blind participants showed higher brain activity within the brain’s visual cortex when compared to sighted participants while they were hearing echoes and locating the objects. However, no differences in brain activity were observed within the auditory (hearing) areas of the brain between sighted and blind participants."
      },
      {
        "type": "paragraph",
        "text": "Noises such as mouth clicks, talking, whistling, humming, footsteps, or a tapping cane allow blind people to use echolocation and detect objects with a distance accuracy of 40 cm. They can notice angle changes of 4° or more. So, people who can echolocate can detect if an object is moved closer, farther away, to the left or to the right. They can also pinpoint targets and tell the difference between objects of different sizes!"
      },
      {
        "type": "heading",
        "text": "Blindness Changes the “Maps” in the Brain"
      },
      {
        "type": "paragraph",
        "text": "Throughout life, people with normal sight build special maps in their brains, specifically to the primary visual cortex. This means that the neurons are connected in ways that map out a particular direction for the electrical signals generated from light to travel. Likewise, by using our hearing, we also build specific maps in our brains, to bring sound information to another region called the primary auditory cortex. Previously, scientists thought these neural maps could only be formed when we put those specific senses to use. However, in the absence of one sense, such as happens in blindness, those brain maps remodel themselves so that the brain can adapt. This process of remodeling the neuronal pathways in the brain is known as neuroplasticity. For example, blind people who have the incredible ability to echolocate use sound to build a brain map for vision. Think of this like the hearing rail network building new tracks to reach the primary visual cortex—the final station on the vision rail line! As a result, this newly created brain rail line can make a “picture” of the surrounding space by using the echoes of emitted sounds. Scientists found that the visual map constructed in blind individuals using sound is very similar to the visual maps that are formed from visual information in people with normal sight. The greater a blind person’s ability to echolocate, the greater the similarity of their visual map to that of sighted individuals."
      },
      {
        "type": "heading",
        "text": "Conclusion"
      },
      {
        "type": "paragraph",
        "text": "Scientific research on bats has brought many improvements to our everyday lives, from medicines that stop blood from clotting to the discovery of sonars These discoveries highlight the importance of preserving and protecting bats and their habitats. The study of bats’ echolocation superpower has helped to improve the lives of blind people, and it has also contributed to our understanding of the changes that happen in the brain when the sense of vision is not available. The remodeling of the neural tracks in the brain starts to happen shortly after blind people lose their sight, when they start using sound to navigate their environments. In fact, echolocation can even be learned by people who can see. All we need is some practice and attention, and we can remodel the tracks in our brains, too!"
      }
    ],
    "vocabulary": [
      {
        "id": "a014-v01",
        "term": "Echolocation",
        "definition": "The bats’ ability to use sounds to map the surrounding environment.",
        "example": "Bats have an ability called echolocation that helps them to perceive obstacles, food, and potential dangers in the dark.",
        "synonym": ""
      },
      {
        "id": "a014-v02",
        "term": "Neurons",
        "definition": "Brain cells that transmits electrical information between different parts of the brain.",
        "example": "This electrical activity passes along cells called neurons, to the brain.",
        "synonym": ""
      },
      {
        "id": "a014-v03",
        "term": "Primary Visual Cortex",
        "definition": "A brain area, located in the back of the brain, that is essential for processing visual information.",
        "example": "The last stop for visual information is a part of the brain called the primary visual cortex, which allows us to become conscious of what we are seeing.",
        "synonym": ""
      },
      {
        "id": "a014-v04",
        "term": "Topographic Maps",
        "definition": "The brain’s precise organization where neurons target specific brain regions to construct the brain maps.",
        "example": "This organization is called topographic maps.",
        "synonym": ""
      },
      {
        "id": "a014-v05",
        "term": "Echo",
        "definition": "The reflection of the sound after hitting an obstacle.",
        "example": "They vocalize so that, upon hearing the echo, they know exactly what is ahead.",
        "synonym": ""
      },
      {
        "id": "a014-v06",
        "term": "Geometric Propagation",
        "definition": "The distance that a sound travels in space.",
        "example": "One characteristic of sound that changes according to the environment is called geometric propagation.",
        "synonym": ""
      },
      {
        "id": "a014-v07",
        "term": "Neuroplasticity",
        "definition": "The ability of neurons in the brain to remodel themselves and make different connections.",
        "example": "This process of remodeling the neuronal pathways in the brain is known as neuroplasticity.",
        "synonym": ""
      }
    ],
    "source": {
      "publisher": "Frontiers for Young Minds",
      "url": "https://kids.frontiersin.org/articles/10.3389/frym.2022.628440",
      "authors": [
        "Luana da Silva Chagas",
        "Daniel de Abreu Damasceno Júnior"
      ],
      "citation": "da Silva Chagas L and de Abreu Damasceno Júnior D (2022) Blind Humans Can Develop the Superpower of Bats!. Front. Young Minds. 10:628440. doi: 10.3389/frym.2022.628440",
      "copyright": "Copyright © 2022 da Silva Chagas and de Abreu Damasceno Júnior",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "adaptationNote": "Text adapted for reading practice: illustrations, figure pointers and reference markers omitted; glossary definitions retained. The original illustrated article is linked above."
    }
  },
  {
    "id": "a015",
    "slug": "picture-a-scientistdiverse-role-models-show-that-science-is-for-everyone",
    "title": "Picture a Scientist—Diverse Role Models Show that Science is for Everyone",
    "teaser": "Who do you picture when you think of the word “scientist”? Do you fit that image?",
    "category": "Learning",
    "tags": [
      "neuroscience and psychology explore the collection",
      "learning",
      "psychology",
      "cognitive science",
      "cognition",
      "self-concept",
      "role models"
    ],
    "readMinutes": 8,
    "publishedLabel": "New",
    "cover": {
      "theme": "midnight-gold",
      "icon": "GraduationCap",
      "motif": "LEARNING"
    },
    "blocks": [
      {
        "type": "lead",
        "text": "Who do you picture when you think of the word “scientist”? Do you fit that image? Although science should be for everyone, some groups, including girls, people of color, the LGBTQ+ community, people with disabilities, and more are often discouraged from becoming scientists. Research shows that girls in particular start to lose interest in pursuing science careers during middle school. But part of the problem for every group is that you cannot be what you cannot see. So how do we change who students picture as scientists? We tested whether a playful STEAM (science, technology, engineering, art, math) program that uses comic books, trading cards featuring a variety of female role models, games, and outdoor exploration could change students’ minds. Our data shows that after the In Their Eyes: Conservation + Comics program, more students think that girls can be scientists, too!"
      },
      {
        "type": "heading",
        "text": "Learning, Belief, and Ideas About Who Can Be a Scientist"
      },
      {
        "type": "paragraph",
        "text": "Picture a scientist: who do you imagine? Go ahead and draw your scientist on a piece of paper or in a journal. Once you are finished, put your pencil down and read on. We will come back to your drawing later."
      },
      {
        "type": "paragraph",
        "text": "Have you ever wondered how you know what you know? How does your brain understand that, by combining certain letters together, you spell a specific word? Or how do you know how to make a bowl of cereal in the morning? Have you ever wondered why you think the way you do? Scientists in the fields of psychology and cognitive science are working hard to answer questions like these. They study something called cognition, which is the process of learning and understanding through thought, experiences, and using the senses (touch, taste, sound, smell, sight, kinesthetic, proprioceptive, etc.). Humans know what they know because of cognition, and our brains use various cognitive processes to help us understand ourselves and the world around us. Some examples of cognitive processes are solving problems, making decisions, or using memory. The processes used by our brains to learn things like math or language are different than the brain processes used to form the beliefs we hold about ourselves—these beliefs are called our self-concept."
      },
      {
        "type": "paragraph",
        "text": "Science shows us that there is a link between people’s self-concepts and who they grow up to be. How do we know what we can be if we never see anyone like us doing the job? How do we believe we belong somewhere without role models that we identify with? One area of scientific study involves people’s beliefs about who can be a scientist. Historically, only white men were allowed to be scientists and women, people of color, individuals with disabilities, and other minority groups (like people in the LGBTQ+ community) were intentionally excluded from science. This caused two problems: first, there were very few scientists who were not white and male; and second, because there was a lack of diverse scientists, the belief that a person must be white and male to be a scientist was reinforced. In other words, there were very few diverse scientific role models, which reinforced people’s beliefs that women, people of color, and others did not belong in science."
      },
      {
        "type": "paragraph",
        "text": "We wanted to see if providing diverse scientific role models to students could influence their beliefs about who a scientist could be."
      },
      {
        "type": "heading",
        "text": "STEM to STEAM"
      },
      {
        "type": "paragraph",
        "text": "Research shows that girls start to lose interest in science around middle school, and that interest in a subject is a strong predictor of career choice. So, we created a STEM (science, technology, engineering, math) lesson for middle school students, called the In Their Eyes: Conservation + Comics program. Teaching STEM in creative ways—such as with comic books—has been shown to be a fun and effective way to learn. To do so, our lesson added art to change STEM to STEAM (science, technology, engineering, ART, math)!"
      },
      {
        "type": "paragraph",
        "text": "Every part of our lesson featured diverse, real-world scientists as role models: first, there was a classroom lesson in which students read scientific comic books and won scientist trading cards through a vocabulary game. Next, students took a virtual fieldtrip to a national park, for a lesson on biology and conservation taught by a female scientist. After learning about these topics, the students made their own scientific comic books to tell their conservation stories. Lastly, the students took everything they learned and created posters to show to their classes, friends, teachers, families, and 16 diverse guest scientists."
      },
      {
        "type": "heading",
        "text": "Did They Change Their Minds?"
      },
      {
        "type": "paragraph",
        "text": "To understand if people’s ideas have changed over time, scientists must gather information both before the experiment (like our STEAM lesson) and after the experiment. Then, they compare before (pre-experiment) to after (post-experiment). This tells them if their experiment had any impact on what the person thought, knew, or believed. To test whether our lesson changed the students’ ideas about who could be a scientist, we used something called the Draw a Scientist Test (DAST) both before and after the lesson."
      },
      {
        "type": "paragraph",
        "text": "The DAST is a method that has been used by scientists and education researchers to study people’s perceptions of scientists since the 1980s. It has been updated many times over the years and is widely respected. The DAST asks students to “draw a picture of a scientist”. The student is also asked follow-up questions, such as: “Was the scientist you drew a man or woman?”, “Was the scientist working outdoors or indoors?”, and “What was the scientist doing in your picture?”."
      },
      {
        "type": "paragraph",
        "text": "The drawings and answers from this study were collected and examined to uncover stereotypical ideas of scientists. A stereotype is an oversimplified belief about a person that is often wrong, such as “only men can be scientists”. Stereotypes like this demonstrate a limited idea of who can be a scientist and what a scientist does. For example, a drawing with facial hair indicates a male scientist, and a person wearing a white lab coat shows only one type of scientist (many scientists do not wear lab coats at all). After analyzing the DASTs, we then compared the number of stereotypes pre-experiment and post-experiment to see if there was a change."
      },
      {
        "type": "heading",
        "text": "Mind Detectives"
      },
      {
        "type": "paragraph",
        "text": "Studying people’s beliefs, thoughts, and knowledge is like being a mind detective! So, did we solve the mystery about how to change people’s perceptions about who can be scientists by using diverse role models?"
      },
      {
        "type": "paragraph",
        "text": "After reviewing the pre-DASTs and the post-DASTs, we found that students drew fewer stereotypic images in the post-DASTs. Out of the 33 students that completed both pre- and post-DASTS, 22 of them drew traditional scientific equipment (such as beakers and flasks) before the lesson, yet only 12 of them drew this type of equipment after the lesson. In addition, 14 students drew protective gear like lab coats before the lesson, and only 6 students drew protective gear afterward. Lastly, before the lesson, an equal number of students drew men and women as scientists; but after the lesson, 19 students drew women, 10 students drew men, and three students drew non-binary scientists."
      },
      {
        "type": "paragraph",
        "text": "We also found that students shifted some of their ideas about science. Our lesson featured diverse women in the field of biology, and the number of drawings that featured biologists increased from 16 to 25. In fact, six students drew scientists they had been introduced to from the lesson!"
      },
      {
        "type": "heading",
        "text": "Picture a Scientist"
      },
      {
        "type": "paragraph",
        "text": "Why does all of this matter? These numbers show us that our lesson could be breaking harmful stereotypes about what a scientist is and who a scientist can be! By peeking into students’ beliefs about science and scientists, we were able to determine one part of a solution to the lack of diversity in STEM fields. It will take a lot of work to make STEM equal for everyone, but this could be one important step toward future success."
      },
      {
        "type": "paragraph",
        "text": "Now, picture a scientist again—who do you imagine this time?"
      }
    ],
    "vocabulary": [
      {
        "id": "a015-v01",
        "term": "Psychology",
        "definition": "The field of science that studies human minds and behaviors.",
        "example": "Scientists in the fields of psychology and cognitive science are working hard to answer questions like these.",
        "synonym": ""
      },
      {
        "id": "a015-v02",
        "term": "Cognitive Science",
        "definition": "The field of science that studies specific processes in the brain, like memory, perception, and language.",
        "example": "Scientists in the fields of psychology and cognitive science are working hard to answer questions like these.",
        "synonym": ""
      },
      {
        "id": "a015-v03",
        "term": "Cognition",
        "definition": "The mental action or process of gaining knowledge and understanding through thought, experience, and the senses.",
        "example": "They study something called cognition, which is the process of learning and understanding through thought, experiences, and using the senses (touch, taste, sound, smell, sight, kinesthetic, proprioceptive, etc.).",
        "synonym": ""
      },
      {
        "id": "a015-v04",
        "term": "Self-Concept",
        "definition": "The image we have of ourselves and our behaviors.",
        "example": "The processes used by our brains to learn things like math or language are different than the brain processes used to form the beliefs we hold about ourselves—these beliefs are called our self-concept.",
        "synonym": ""
      },
      {
        "id": "a015-v05",
        "term": "Role Models",
        "definition": "People looked up to by others as examples to be imitated.",
        "example": "We tested whether a playful STEAM (science, technology, engineering, art, math) program that uses comic books, trading cards featuring a variety of female role models, games, and outdoor exploration could change students’ minds.",
        "synonym": ""
      },
      {
        "id": "a015-v06",
        "term": "Perceptions",
        "definition": "Ways of thinking, understanding, or believing something; mental impressions.",
        "example": "The DAST is a method that has been used by scientists and education researchers to study people’s perceptions of scientists since the 1980s.",
        "synonym": ""
      },
      {
        "id": "a015-v07",
        "term": "Stereotypical",
        "definition": "A widely held, oversimplified idea that is often biased, prejudiced, or wrong.",
        "example": "The drawings and answers from this study were collected and examined to uncover stereotypical ideas of scientists.",
        "synonym": ""
      }
    ],
    "source": {
      "publisher": "Frontiers for Young Minds",
      "url": "https://kids.frontiersin.org/articles/10.3389/frym.2024.1374307",
      "authors": [
        "Samantha Wynns",
        "Clara L. Meaders",
        "Jaye C. Gardiner",
        "Sankalp Nigam",
        "Jillian Harris"
      ],
      "citation": "Wynns S, Meaders CL, Gardiner JC, Nigam S and Harris J (2024) Picture a Scientist—Diverse Role Models Show that Science is for Everyone. Front. Young Minds. 12:1374307. doi: 10.3389/frym.2024.1374307",
      "copyright": "Copyright © 2024 Wynns, Meaders, Gardiner, Nigam and Harris",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "adaptationNote": "Text adapted for reading practice: illustrations, figure pointers and reference markers omitted; glossary definitions retained. The original illustrated article is linked above."
    }
  },
  {
    "id": "a016",
    "slug": "plants-can-speak-to-each-other",
    "title": "Plants Can “Speak” to Each Other",
    "teaser": "When we think about plants, we do not normally imagine them “speaking” to each other. But they do communicate—in many different ways.",
    "category": "Science",
    "tags": [
      "biodiversity",
      "science",
      "root tip",
      "pheromones",
      "frequency",
      "subsonic",
      "ultrasonic"
    ],
    "readMinutes": 8,
    "publishedLabel": "New",
    "cover": {
      "theme": "forest-emerald",
      "icon": "Compass",
      "motif": "SCIENCE"
    },
    "blocks": [
      {
        "type": "lead",
        "text": "When we think about plants, we do not normally imagine them “speaking” to each other. But they do communicate—in many different ways. More than a century ago, the eminent biologist Charles Darwin suggested that plants have a brain-like structure at their root tips! In this case, Darwin’s root-brain hypothesis was wrong, but more modern research shows that plants can communicate. They speak with other plants as well as with animals and even people. They do this primarily using chemicals and sound."
      },
      {
        "type": "heading",
        "text": "Introduction"
      },
      {
        "type": "paragraph",
        "text": "All communication between living things requires the exchange of information (signals) between partners. We know that animals constantly communicate with each other as they move around their habitats. Think of birds singing or lions roaring. In contrast, plants are often regarded as unmoving organisms that are incapable of such communication. One of the first scientists to challenge this notion was none other than Charles Darwin."
      },
      {
        "type": "heading",
        "text": "Darwin’s Early Research on Plant Behavior"
      },
      {
        "type": "paragraph",
        "text": "In the 1880’s, Charles Darwin and his son Francis conducted a series of experiments on roots, which showed that the tip of the root is the most important part of the plant. Root tips sense and respond to stimuli such as light, gravity, chemicals, and sound. The root tip transmits messages that function as signals to activate processes such as growth, directional movement, and the production and release of special gases. Animal and human brains do similar things, so the two Darwins suggested that the root tip could function as the plant’s “brain”. Here are some of their own words:"
      },
      {
        "type": "paragraph",
        "text": "It is hardly an exaggeration to say that the tip of the radicle [a young root]… having the power of directing the movements of the adjoining parts, acts like the brain…; receiving impressions from the sense organs, and directing the several movements."
      },
      {
        "type": "paragraph",
        "text": "Charles Darwin also showed the importance of chemicals as communication signals in plants. Some of the earliest reports of plant chemical signaling came from his experiments in the 1870’s. Darwin showed that soluble substances produced at the tip of the growing shoot of barley seedlings were transported down through the stems, where they caused cell division and curvature of the stem. We now know that these chemical signals are hormones called auxins, which move throughout the plant bodies and play many important roles in their growth pattern and overall shape."
      },
      {
        "type": "heading",
        "text": "Plants Communicate Using Chemicals and Sound"
      },
      {
        "type": "paragraph",
        "text": "One of Darwin’s key insights was that plants are highly active organisms. We now know that, although they are normally anchored in one place by their root systems, plants are still capable of movement. For example, by using sophisticated measuring devices, we can see that plant leaves, roots, and tendrils are in constant rhythmic motion as they respond to external factors such as daylight, gravity, temperature, water, nutrients, and threats. Plants do not just move randomly; they move in a purposeful manner. Plants move to detect key information about their environments, to respond appropriately, and to communicate this information to other plants, using easily understood signals."
      },
      {
        "type": "paragraph",
        "text": "Unlike animals, plants normally stay in one place during their lifetimes (except for the roots, which can move through the soil), but sometimes that location can turn out to be far from ideal. For example, there might be too little light or water, or too few nutrients for efficient growth. Other competing plants may already be present to crowd out the new plant, or pests and pathogens might attack it, not to mention grazing animals. In evolutionary terms, it makes sense that a plant facing these threats could signal its distress to other plants, so that they could avoid the dangers or better defend themselves against threats. Recent research shows that the two most important plant communication methods are chemicals and sound."
      },
      {
        "type": "heading",
        "text": "Chemical Signals—the Importance of VOCs"
      },
      {
        "type": "paragraph",
        "text": "Volatile organic compounds (VOCs) are the most common type of chemical signals released by plants. VOCs are small molecules released as gases that readily diffuse through the air, away from the plant that produces them. Some of these plant VOCs are chemically similar to the pheromones that are used by many animals. For example, the world of ants is largely controlled by pheromones that allow them to find food and identify their nestmates. One of the most common plant VOCs is called methyl jasmonate (MeJA), which is produced and released by plants that are under attack. MeJA is formed inside a wounded plant, for example when an animal tries to eat it. Once released by the attacked plant, MeJA moves through the air to the non-damaged parts of the same plant and to the neighboring plants, where it activates defense mechanisms in non-attacked neighbors. Another defense-related VOC made by plants is methyl salicylate, which is chemically similar to the human painkiller, aspirin."
      },
      {
        "type": "paragraph",
        "text": "Plants release VOCs into the air to alert their neighbors to threats, and the neighboring plants respond to these signals by preparing to defend themselves even before they are attacked. For example, within seconds, plants that detect VOCs will start making anti-fungal compounds or anti-insect toxins to protect themselves. In some cases, VOCs can also travel long distances underground, via the root system. This means that plants can stimulate root cells to mount defense responses against invading fungi or bacteria in the soil. Other VOCs are released from root cells to attract beneficial fungi or bacteria. Examples include fungi that help plant roots to absorb soil nutrients more efficiently, or bacteria that convert nitrogen gas from the atmosphere into nutrients that help the plants to grow faster. So, plants use certain VOCs to warn their neighbors about threats, while other VOCs allow them to attract more useful organisms."
      },
      {
        "type": "heading",
        "text": "Sound Signals"
      },
      {
        "type": "paragraph",
        "text": "We humans use sound waves to communicate with each other, but not all sound waves are detectable by human ears. One of the main properties of sound waves is their frequency, which is measured in Hertz (Hz). Humans can hear only sound frequencies ranging from 20 to 20,000 Hz. Sounds with frequencies below 20 Hz are commonly called subsonic, while those with frequencies more than 20,000 Hz are called ultrasonic."
      },
      {
        "type": "paragraph",
        "text": "The sound signals used by plants tend to be at a frequency that cannot be heard by the human ear, but they can be picked up by other plants and animals. In the wild, plants might grow well with some neighbors but not with others. For example, a 2013 study in Australia clearly showed the beneficial effects of basil plants on the growth of chili plants, which confirms what many gardeners had previously observed in their gardens. Chili seedlings grow less well in the presence of fennel plants, however. These authors speculate that tiny vibrations in the cells of each plant might produce “sounds” of frequencies that can be detected by other plants, telling them whether they are growing near a “bad” or a “good” neighbor."
      },
      {
        "type": "paragraph",
        "text": "In other experiments, young maize roots were found to make tiny clicking sounds that are at the lower end of the human hearing range (about 220 Hz). When the roots were suspended in water so that they could move more easily, they leaned toward these sounds. Other sounds include what sounds like fizzy bubble bursts in the xylem tissue of plants, but these are ultrasonic and are only detectable by insects and some other animals, so perhaps these plants are communicating with animals. The technology to hear plant bubbles explode is actually quite simple. Acoustic sensors designed to detect cracks in bridges and buildings can catch the ultrasonic pops."
      },
      {
        "type": "paragraph",
        "text": "Researchers in China have shown they can increase plant yields by broadcasting sound waves of certain frequencies. So, maybe there is some truth in the old gardener’s advice to talk to your plants! Other researchers have investigated how different frequencies and intensities of sounds change plant gene expression. Their results show that acoustic vibrations really do affect the basic chemical reactions happening within plant cells."
      },
      {
        "type": "heading",
        "text": "The Importance of Plant Communication"
      },
      {
        "type": "paragraph",
        "text": "The bottom line is that plants are really great communicators. They are constantly releasing lots of useful information into the environment, especially using chemicals and sounds. We are only just beginning to understand how this information is produced and how it is then picked up by other plants and animals who can use it for their own benefit. So, the next time you tread on some grass or pick a flower, remember that the poor injured plant might be screaming out to its neighbors—but we humans just cannot hear it!"
      }
    ],
    "vocabulary": [
      {
        "id": "a016-v01",
        "term": "Root Tip",
        "definition": "The growing tip or “apex” of a root, known also as “a root cap.”",
        "example": "The root tip transmits messages that function as signals to activate processes such as growth, directional movement, and the production and release of special gases.",
        "synonym": ""
      },
      {
        "id": "a016-v02",
        "term": "Pheromones",
        "definition": "Chemicals secreted by some animals that help them communicate with others of their species.",
        "example": "Some of these plant VOCs are chemically similar to the pheromones that are used by many animals.",
        "synonym": ""
      },
      {
        "id": "a016-v03",
        "term": "Frequency",
        "definition": "The number of occurrences of a repeating event per unit of time. Frequency is measured in hertz (Hz) which is equal to one event per second.",
        "example": "One of the main properties of sound waves is their frequency, which is measured in Hertz (Hz).",
        "synonym": ""
      },
      {
        "id": "a016-v04",
        "term": "Subsonic",
        "definition": "Sound waves with frequency <20 Hz. Humans cannot hear these frequencies.",
        "example": "Sounds with frequencies below 20 Hz are commonly called subsonic, while those with frequencies more than 20,000 Hz are called ultrasonic.",
        "synonym": ""
      },
      {
        "id": "a016-v05",
        "term": "Ultrasonic",
        "definition": "Sound waves with frequency more than 20,000 Hz. Humans cannot hear these frequencies.",
        "example": "Sounds with frequencies below 20 Hz are commonly called subsonic, while those with frequencies more than 20,000 Hz are called ultrasonic.",
        "synonym": ""
      },
      {
        "id": "a016-v06",
        "term": "Xylem",
        "definition": "Network of tiny “pipes” in plants that transports water and minerals from the roots to the rest of the plant.",
        "example": "Other sounds include what sounds like fizzy bubble bursts in the xylem tissue of plants, but these are ultrasonic and are only detectable by insects and some other animals, so perhaps these plants are communicating with animals.",
        "synonym": ""
      }
    ],
    "source": {
      "publisher": "Frontiers for Young Minds",
      "url": "https://kids.frontiersin.org/articles/10.3389/frym.2022.658692",
      "authors": [
        "Abdulsami Hanano",
        "Colette Murphy",
        "Denis J. Murphy"
      ],
      "citation": "Hanano A, Murphy C and Murphy DJ (2022) Plants Can “Speak” to Each Other. Front. Young Minds. 10:658692. doi: 10.3389/frym.2022.658692",
      "copyright": "Copyright © 2022 Hanano, Murphy and Murphy",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "adaptationNote": "Text adapted for reading practice: illustrations, figure pointers and reference markers omitted; glossary definitions retained. The original illustrated article is linked above."
    }
  },
  {
    "id": "a017",
    "slug": "satellite-images-selfies-for-preserving-earths-environment",
    "title": "Satellite Images: Selfies for Preserving Earth’s Environment",
    "teaser": "Photographs are not just keepsakes. Images from outer space help us keep track of planet Earth and its resources.",
    "category": "Science",
    "tags": [
      "earth sciences",
      "science",
      "natural resource management",
      "earth observation",
      "drought",
      "wavelength",
      "infrared"
    ],
    "readMinutes": 9,
    "publishedLabel": "New",
    "cover": {
      "theme": "forest-emerald",
      "icon": "Compass",
      "motif": "SCIENCE"
    },
    "blocks": [
      {
        "type": "lead",
        "text": "Photographs are not just keepsakes. Images from outer space help us keep track of planet Earth and its resources. Satellites are equipped with special sensors (like eyes) that can see “colors” of light that human eyes cannot see. These satellites orbit really high above us, and travel around Earth frequently. This birds-eye view and speedy revisit time means that they can help inform us about natural disasters, climate change, and the weather. This article gives an overview of how satellites observe the Earth, and some of the important applications of this technique to the conservation of Earth’s invaluable natural resources."
      },
      {
        "type": "heading",
        "text": "Introduction"
      },
      {
        "type": "paragraph",
        "text": "The number of humans on Earth is constantly growing. A larger population means that more people need access to natural resources, such as water, land, and minerals. However, these resources are finite, meaning there is only a certain amount of them. Because more people need access to the same number of resources, it has become increasingly important to quickly and accurately map and monitor these resources. Governments and communities monitor resources at global, national, and local levels. We need to know which natural resources are available, how much there are of them, and whether they are healthy or have changed recently. When countries have this information, they can limit their use of resources that are in short supply, so the resources are not overused (see this Frontiers for Young Minds article). Think about forests. Many years ago, humans chopped down trees for fuel, timber for furniture and houses, and to build railways. In the 1700’s, 1800’s, and much of the 1990’s, people did not stop to think about how much forest (especially tropical forests with trees that take hundreds of years to grow) was left to protect the soil against erosion or serve as habitat for birds and other wildlife. Our thinking has changed—we now realize that forests are the lungs of the Earth, and governments and many organizations work to protect forests, limit tree clearing, and replant trees in some areas. To do this, people must first know where trees have been cleared over the years, how much clearing has occured, and where valuable trees still exist and need protection. This is called natural resource management, and pictures taken from above Earth at various timepoints can provide information about where, when, and how many trees have been cleared."
      },
      {
        "type": "paragraph",
        "text": "If we want to know how many resources we can use and how fast we can develop an area, we need frequent, consistent, and accurate information captured over large areas of the Earth. Once we have this information we can better understand how lifeforms are interacting with their environments, and then we can reliably monitor and predict how healthy the lands, coasts, and oceans are and what objects or substances are present in those areas (for more information, see this Frontiers for Young Minds article). Fortunately, the technology available to provide this information, called Earth observation, has become more sophisticated over time."
      },
      {
        "type": "heading",
        "text": "What Is Earth Observation?"
      },
      {
        "type": "paragraph",
        "text": "The first successful unmanned aerial photo of the Earth was taken using a kite, back in 1887. Later, in 1907, a German pharmacist named Dr. Neubronner came up with the idea of mounting a camera to a dove. Over time, Earth observation technology has become more advanced. Humans have learned to launch satellites equipped with cameras. These satellites orbit Earth and take regular pictures of the planet. Approximately 2,200 satellites orbit the Earth, and 446 of those perform Earth observation. Data from these satellites has helped scientists to map many natural phenomena, like drought, floods, and the melting of glaciers. Scientists use this information to better understand the state of the Earth’s natural resources. Satellites can also help scientists spot areas where human activities are damaging the environment, through activities like deforestation, illegal mining, or overgrazing of farmlands."
      },
      {
        "type": "heading",
        "text": "Satellites Detect Colors We Cannot See"
      },
      {
        "type": "paragraph",
        "text": "A satellite image is similar to a photograph—kind of like a picture taken with a smartphone and posted on Instagram. Satellite images are created by looking at both light that human eyes can see and light that they cannot see. Our eyes can only see light of certain wavelengths—those that correspond to the colors red, green, and blue—while satellites can see light of many wavelengths. Imagine that your ears could only listen to FM radio, while satellites could listen to both FM and AM radio. Satellites have sensors—kind of like eyes—that can detect certain wavelengths of light that we cannot see. Scientists transform the light information obtained by satellites into images that give them information about the Earth."
      },
      {
        "type": "paragraph",
        "text": "Some satellite images, like the ones used as a layer in Google Maps, use the blue, green, and red colors that our eyes can see. Other satellites can take pictures using infrared light, which is invisible to the human eye. Even though we cannot see it, we use infrared light in our everyday lives. For example, the little glass eye at the top of a TV remote uses infrared light to communicate with the television."
      },
      {
        "type": "paragraph",
        "text": "On Instagram, when you look at a photo on which a filter was used to brighten or alter the colors, you might think that it is very artful, or it might look fake. If you see a satellite image with a bright red forest, you might think the same thing—that it must be a fake image. But a red forest is just as real as a dark green one! The difference is that these satellite images are made from wavelengths of light that we cannot see, such infrared, so they do not look real to us. We call these false-color images, and to know what they mean, it is necessary to understand what a satellite image is."
      },
      {
        "type": "heading",
        "text": "What Does a Satellite Measure to Produce an Image?"
      },
      {
        "type": "paragraph",
        "text": "Each of a satellite’s sensors are tuned to detect a narrow range of wavelengths—just blue light, for instance. Images made from only one wavelength appear in shades of gray. Objects on Earth that produce a lot of that particular wavelength of light appear as bright spots, while objects that reflect or produce little (or none) of that wavelength appear as dark grays or even black. The information captured by all the satellite’s sensors is stored in images called multi-spectral remote sensing data."
      },
      {
        "type": "paragraph",
        "text": "For example, to the human eye, healthy plants appear green because plant pigments reflect more green light than other wavelengths, and they absorb more red and blue light. But special types of sensors in satellites are designed to pick up infrared light, and healthy vegetation reflects a large amount of infrared light from the sun. Therefore, healthy plants appear red via remote sensing."
      },
      {
        "type": "heading",
        "text": "Distance From Earth Matters"
      },
      {
        "type": "paragraph",
        "text": "Satellites can orbit at various distances from Earth—from about 36,000 km away to only 800 km away. Satellites that orbit at 36,000 km above Earth are called geostationary, and they can help with weather forecasts. Geostationary satellites look at just one of Earth’s hemispheres, and they can take pictures approximately every 10 min. They help scientists map how clouds and hurricanes move, and they can even collect information on how volcanoes erupt! But because they are so high, they give low-quality pictures of Earth, like old movies. The smallest objects they can see are 500–1,000 m in size."
      },
      {
        "type": "paragraph",
        "text": "Satellites that orbit closer to Earth can take pictures using the both visible (to humans) and invisible wavelengths of light. These satellites can see objects as small as 0.5–30 m in size—ranging from the size of a car to an average backyard! Because they orbit around Earth, they take pictures of the same location every 5–16 days, or even less often if several satellites are working together as a team (for an example, see Planet Labs)."
      },
      {
        "type": "heading",
        "text": "Protecting Earth’s Resources"
      },
      {
        "type": "paragraph",
        "text": "Satellites are like Earth’s bodyguards. Observing Earth from satellites has many advantages. They can cover large regions such as the entire American continent, even the whole earth. Monitoring the Earth’s resources can be systematic and continuous using satellite images. For instance, Global Forest Watch uses images from satellites to monitor the amount of forest clearance in places like the Amazonia or the Congo."
      },
      {
        "type": "paragraph",
        "text": "Satellite observations give consistent data that can be shared by many users for different purposes. These data provide information needed to identify problems, make decisions and take actions to protect the natural environment, to plan for help after disasters, and detect and predict changes to safeguard our planet’s precious resources. Did glaciers melt last year? How much damage did the wildfires cause? How many hectares of forest were cleared over the last 12 months? Thanks to the hundreds of Earth observing satellites that orbit our planet we can answer questions like these, and learn about the status of land, water, and the atmosphere. Satellite Earth observation keep a watching eye over our invaluable natural resources and give us information to manage better our world now and in the future."
      }
    ],
    "vocabulary": [
      {
        "id": "a017-v01",
        "term": "Natural Resource Management",
        "definition": "Integrated management of the natural resources that make up Earth’s natural landscapes, such as land, water, soil, plants, and animals.",
        "example": "This is called natural resource management, and pictures taken from above Earth at various timepoints can provide information about where, when, and how many trees have been cleared.",
        "synonym": ""
      },
      {
        "id": "a017-v02",
        "term": "Earth Observation",
        "definition": "Looking down at the Earth from aircraft or satellites using various sensors that create images used to study what is happening on or near Earth’s surface.",
        "example": "Fortunately, the technology available to provide this information, called Earth observation, has become more sophisticated over time.",
        "synonym": ""
      },
      {
        "id": "a017-v03",
        "term": "Drought",
        "definition": "A long period of time of abnormally low rainfall, leading to a shortage of water.",
        "example": "Data from these satellites has helped scientists to map many natural phenomena, like drought, floods, and the melting of glaciers.",
        "synonym": ""
      },
      {
        "id": "a017-v04",
        "term": "Wavelength",
        "definition": "The distance between the tops of the waves, like light waves. The wavelength of light determines the colors we see.",
        "example": "Images made from only one wavelength appear in shades of gray.",
        "synonym": ""
      },
      {
        "id": "a017-v05",
        "term": "Infrared",
        "definition": "Infrared light is part of the electromagnetic radiation spectrum. Infrared waves are longer than visible light waves, but not as long as radio waves.",
        "example": "Other satellites can take pictures using infrared light, which is invisible to the human eye.",
        "synonym": ""
      },
      {
        "id": "a017-v06",
        "term": "Multi-Spectral Remote Sensing Data",
        "definition": "Acquisition of visible, near infrared, and short-wave infrared images in several broad wavelength bands.",
        "example": "The information captured by all the satellite’s sensors is stored in images called multi-spectral remote sensing data.",
        "synonym": ""
      },
      {
        "id": "a017-v07",
        "term": "Infrared Light",
        "definition": "The part of the invisible wavelenghts that is next to the red end of the visible light.",
        "example": "Other satellites can take pictures using infrared light, which is invisible to the human eye.",
        "synonym": ""
      },
      {
        "id": "a017-v08",
        "term": "Remote Sensing",
        "definition": "The process of detecting and monitoring the physical characteristics of an area by measuring its reflected and emitted light at a distance, typically from satellites or aircraft.",
        "example": "The information captured by all the satellite’s sensors is stored in images called multi-spectral remote sensing data.",
        "synonym": ""
      },
      {
        "id": "a017-v09",
        "term": "Geostationary",
        "definition": "A satellite that appears nearly stationary in the sky as seen by a ground-based observer.",
        "example": "Satellites that orbit at 36,000 km above Earth are called geostationary, and they can help with weather forecasts.",
        "synonym": ""
      }
    ],
    "source": {
      "publisher": "Frontiers for Young Minds",
      "url": "https://kids.frontiersin.org/articles/10.3389/frym.2022.886767",
      "authors": [
        "Graciela Metternicht",
        "Bronwyn L. Teece"
      ],
      "citation": "Metternicht G and Teece BL (2023) Satellite Images: Selfies for Preserving Earth’s Environment. Front. Young Minds. 11:886767. doi: 10.3389/frym.2022.886767",
      "copyright": "Copyright © 2023 Metternicht and Teece",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "adaptationNote": "Text adapted for reading practice: illustrations, figure pointers and reference markers omitted; glossary definitions retained. The original illustrated article is linked above."
    }
  },
  {
    "id": "a018",
    "slug": "left-out-in-the-gamebetter-understanding-anxiety",
    "title": "Left Out in the Game—Better Understanding Anxiety",
    "teaser": "Children can feel scared sometimes, and some might feel scared more often than others. We wanted to understand why people who feel scared as babies often still feel scared as teenagers, while others no longer do.",
    "category": "Psychology",
    "tags": [
      "neuroscience and psychology",
      "psychology",
      "anxiety",
      "fearful temperament",
      "rejection",
      "rumination",
      "social interactions"
    ],
    "readMinutes": 7,
    "publishedLabel": "New",
    "cover": {
      "theme": "royal-violet",
      "icon": "Brain",
      "motif": "PSYCHOLOGY"
    },
    "blocks": [
      {
        "type": "lead",
        "text": "Children can feel scared sometimes, and some might feel scared more often than others. We wanted to understand why people who feel scared as babies often still feel scared as teenagers, while others no longer do. Therefore, we followed more than 2,700 babies as they grew up. The parents told us how scared their kids were as babies and then again as teenagers. We also studied how kids responded during an online ball-throwing game, which they thought they played with others (but it was actually the computer). We found that kids who were very scared as babies were more likely to feel scared as teenagers. This was especially true for kids who felt bad after being excluded by others during the game. This tells us that maybe we can help those kids feel less scared by teaching them how to deal with feeling left out."
      },
      {
        "type": "heading",
        "text": "What is Anxiety?"
      },
      {
        "type": "paragraph",
        "text": "Have you ever felt a little scared or nervous about something new or different? Maybe you felt this way when you started at a new school or had to talk in front of a lot of people. Maybe your tummy did flips, or your palms got sweaty, or maybe your heart was beating super-fast. That feeling is anxiety! Anxiety is a feeling of worry that just will not quit. It can make it hard to sleep, pay attention in school, or even have fun with friends. But anxiety is not all bad—it can also be helpful sometimes. Anxiety makes you more alert, like when you look both ways before crossing the street. It is a completely normal feeling that everyone gets from time to time, and it is the body’s way of saying, “Hey, pay attention! Something important is happening”!"
      },
      {
        "type": "paragraph",
        "text": "Even though it is a normal feeling, did you know that some kids feel scared quite often? Even as babies, they are very scared of new things, like a new toy that makes a lot of noise. We call this a fearful temperament."
      },
      {
        "type": "heading",
        "text": "The Case of Leo"
      },
      {
        "type": "paragraph",
        "text": "Scientists like us are curious about how young kids with a fearful temperament feel when they grow up. Some research has already shown that these kids may grow up to be more anxious, depressed, or shy. Imagine a friend named Leo. When Leo was little, he was scared of loud noises and of trying new things. He would not go down the slide at the park or join in games with other kids. These are all normal fears, but some kids seem to experience them more intensely than others. Did Leo grow up to be anxious and scared of everything?"
      },
      {
        "type": "paragraph",
        "text": "Our study looked at 2,730 kids: we asked their parents how anxious the kids were as babies (e.g., by asking if their baby would refuse to go to a person they did not know). Some of the kids were scared like Leo, and some were not as scared. Then, we checked in with them again when they were 13 years old. We found that most kids who were easily scared as babies were also more scared as teenagers. But here is the interesting part: not all kids who felt scared a lot as babies grew up to be anxious. So, why do some kids develop anxiety while others do not?"
      },
      {
        "type": "heading",
        "text": "Friends Matter"
      },
      {
        "type": "paragraph",
        "text": "We discovered that how kids interact with other kids can play a role in how anxious they feel as they get older. This is not surprising: as kids grow up, their friendships become super important. Kids generally spend a lot of time with their friends, and friends can really influence how kids feel about themselves and the world around them."
      },
      {
        "type": "paragraph",
        "text": "In our study, we focused on friendship and peer relations by asking the 13-year-old kids to play a ball-throwing game with other kids on the computer. But there was a trick: they were not actually playing with other kids! We just made them think they were, so we could see how they would react. The computer decided who the “other kids” would throw the ball to, and at some point, the real kids in our study did not get any ball anymore."
      },
      {
        "type": "paragraph",
        "text": "After the game, we asked the kids how they felt after being rejected by the “other kids” (which, remember, was really just the computer). We found that teenagers who felt bad after rejection were more likely to feel anxious, especially if they were also scared a lot as babies. It makes sense: if you are already anxious about new things, getting rejected by somebody might make you feel even worse. It could make you want to hide instead of trying again."
      },
      {
        "type": "paragraph",
        "text": "Feeling bad during the game about being excluded did not seem to make fearful babies more anxious as teenagers, but feeling bad after being left out did. This could be because these kids kept thinking about what happened over and over again. This is called rumination, and it is something that can make teenagers anxious."
      },
      {
        "type": "paragraph",
        "text": "This research shows that how kids interact with others affects how anxious they feel as they grow up. Kids who are naturally more scared might be more sensitive to how others treat them. If they have friends who make them feel good about themselves, they might feel less anxious. But if they are bullied or feel left out, they might feel more anxious."
      },
      {
        "type": "paragraph",
        "text": "When it comes to friends, it is not just about how good the friendships are, but also about the type of friends you have. Some friends can help you feel less scared or anxious by showing you how to make friends and talk to people. By studying how friendships and social interactions affect our feelings of fear and anxiety, researchers can learn how to help kids feel happier and more confident as they grow up."
      },
      {
        "type": "heading",
        "text": "Do Not Worry, Be a Friend!"
      },
      {
        "type": "paragraph",
        "text": "So, if you are a teenager who feels anxious, what can you do? First, remember you can learn how to cope with rejection. This is like learning a new skill, such as riding a bike! The more you practice dealing with situations where you feel left out, the better you will get at handling them. Also, practice facing your fears. Start small! Even if you are scared to try something new, give it a shot anyway. The more you do it, the easier it gets. For example, if you are scared of dogs, maybe ask a friend whose dog you know is friendly if you can pet it for a short time."
      },
      {
        "type": "paragraph",
        "text": "Another thing you can do to help your anxiety is to learn relaxation techniques. Deep breathing exercises or mindfulness (focusing on the present moment) can help calm your mind and body and make you feel less afraid. Lastly, talk it out. If you are feeling worried or anxious, sharing how you feel with a trusted friend or grown-up can be a big help. They can help you figure out ways to feel better."
      },
      {
        "type": "paragraph",
        "text": "What can you do to help other kids who feel shy or scared? Be a friend! If you see someone who seems shy or scared, reach out and say hi! Invite them to play a game or have lunch with you."
      },
      {
        "type": "paragraph",
        "text": "If you feel anxious, remember you are not alone. Feeling scared or anxious sometimes is totally normal. But if you worry a lot and it is affecting your daily life, like making it hard to have fun or make friends, there are people who can help and there are things you can do to feel braver and happier!"
      }
    ],
    "vocabulary": [
      {
        "id": "a018-v01",
        "term": "Anxiety",
        "definition": "A worried or scared feeling everyone sometimes gets.",
        "example": "That feeling is anxiety!",
        "synonym": ""
      },
      {
        "id": "a018-v02",
        "term": "Fearful Temperament",
        "definition": "Being scared of and avoiding new or unfamiliar things frequently.",
        "example": "We call this a fearful temperament.",
        "synonym": ""
      },
      {
        "id": "a018-v03",
        "term": "Rejection",
        "definition": "When someone does not choose you or include you in something.",
        "example": "We found that teenagers who felt bad after rejection were more likely to feel anxious, especially if they were also scared a lot as babies.",
        "synonym": ""
      },
      {
        "id": "a018-v04",
        "term": "Rumination",
        "definition": "Thinking about the same thing again and again, even when you do not want to.",
        "example": "This is called rumination, and it is something that can make teenagers anxious.",
        "synonym": ""
      },
      {
        "id": "a018-v05",
        "term": "Social Interactions",
        "definition": "How people communicate and play with others, like making friends, talking, and having fun together.",
        "example": "By studying how friendships and social interactions affect our feelings of fear and anxiety, researchers can learn how to help kids feel happier and more confident as they grow up.",
        "synonym": ""
      },
      {
        "id": "a018-v06",
        "term": "Relaxation Techniques",
        "definition": "Activities that help you calm your mind and body, like deep breathing.",
        "example": "Another thing you can do to help your anxiety is to learn relaxation techniques.",
        "synonym": ""
      },
      {
        "id": "a018-v07",
        "term": "Mindfulness",
        "definition": "A relaxation technique in which you focus on the present moment and your thoughts and feelings, without judging them.",
        "example": "Deep breathing exercises or mindfulness (focusing on the present moment) can help calm your mind and body and make you feel less afraid.",
        "synonym": ""
      }
    ],
    "source": {
      "publisher": "Frontiers for Young Minds",
      "url": "https://kids.frontiersin.org/articles/10.3389/frym.2026.1597631",
      "authors": [
        "Stephanie Schildknecht",
        "Rosa H. Mulder",
        "Matthias J. Wieser",
        "Pauline Jansen",
        "Anita Harrewijn"
      ],
      "citation": "Schildknecht S, Mulder RH, Wieser MJ, Jansen P and Harrewijn A (2026) Left Out in the Game—Better Understanding Anxiety. Front. Young Minds. 14:1597631. doi: 10.3389/frym.2026.1597631",
      "copyright": "Copyright © 2026 Schildknecht, Mulder, Wieser, Jansen and Harrewijn",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "adaptationNote": "Text adapted for reading practice: illustrations, figure pointers and reference markers omitted; glossary definitions retained. The original illustrated article is linked above."
    }
  },
  {
    "id": "a019",
    "slug": "playing-with-new-friends",
    "title": "Playing With New Friends",
    "teaser": "Making friends is fun! But for some children, it is hard and even scary.",
    "category": "Society",
    "tags": [
      "neuroscience and psychology",
      "society",
      "temperament",
      "behavioral inhibition",
      "mobile eye-tracking",
      "two-way mirror",
      "behavior coding"
    ],
    "readMinutes": 10,
    "publishedLabel": "New",
    "cover": {
      "theme": "sunrise-rose",
      "icon": "BookOpen",
      "motif": "SOCIETY"
    },
    "blocks": [
      {
        "type": "lead",
        "text": "Making friends is fun! But for some children, it is hard and even scary. Children who are shy (behaviorally inhibited) are nervous about meeting new people. Happy feelings help people make friends. Looking at people to talk to them also helps people make friends. We wanted to know more about what happens when children play together for the first time. We found that children mostly look at toys when they are playing with a new friend. But when children show happy feelings, they are more likely to look at a new friend! Sharing happy feelings helps children make friends. But children who are higher in behavioral inhibition are less likely to share happy feelings with new friends. Children can help friends who are nervous about meeting new friends by giving them time to get comfortable and even helping them meet new people."
      },
      {
        "type": "heading",
        "text": "What Helps Children Make New Friends?"
      },
      {
        "type": "paragraph",
        "text": "Do you like meeting new friends? Some children find meeting new friends to be really hard and scary. We often call these children shy. Some children tend to be shyer than others because of their temperament. Temperament describes how children respond to the people, places, and things around them. Some children’s temperaments mean that they are really excited to meet new people or try new things. For other children, their temperaments mean they have trouble with new people and new activities. We say that these shy children are high in behavioral inhibition. New people make children who are higher in behavioral inhibition nervous. Being nervous makes it harder to meet new friends."
      },
      {
        "type": "paragraph",
        "text": "Children higher in behavioral inhibition often feel more unhappy feelings (for more information on why some children have more unhappy feelings than others, please see this Frontiers for Young Minds article). Unhappy feelings make it hard to meet new friends because people often want to be alone when they are unhappy. Happy feelings help people meet friends. People often want to do new things when they are happy and that means they often interact with other people. Looking at others also helps people make friends because they can see what their new friends are feeling and react in ways that helps the two friends get to know each other."
      },
      {
        "type": "paragraph",
        "text": "Scientists can measure how long children look at people. Older studies used to count how long children looked at faces on computer screens. Shy children might look more at unhappy faces on computer screens. But when children play with friends, they do not just look at pictures on a computer screen. Newer studies use mobile eye-tracking to count how long children look at people in real life. Eye-trackers are cameras that record where a person’s eyes are looking. Mobile means that the cameras can move around with the person, usually by having the cameras inside glasses a person can wear. So, mobile eye-trackers let scientists see where people are looking when they move around—like when children are playing with friends. These newer studies say children look at toys more than at faces when they are playing. In our research, we wanted to know more about what happens when children play with new friends."
      },
      {
        "type": "heading",
        "text": "How Did We Study Children While They Play?"
      },
      {
        "type": "paragraph",
        "text": "A total of 42 children (5–7 years old) came to our lab to play. Children played in pairs. That means we had 21 play sessions! When we paired children, we made sure they were the same age. We also had boys play with boys and girls play with girls. We did this because often children are more comfortable playing in boy-boy and girl-girl pairs. We also made sure they did not already know each other. All children spoke English while doing the study."
      },
      {
        "type": "paragraph",
        "text": "When the children first got to our lab, we had them put on our mobile eye-trackers. They then went into a special room filled with toys. We told them they should play however they wanted to. Our special room had a two-way mirror, so we could watch the children playing, but they could not see us. We also videotaped the play session. Children played together for 5 min. Parents or caregivers filled out surveys telling us if their children showed a lot of behavioral inhibition, or shyness."
      },
      {
        "type": "paragraph",
        "text": "We used behavior coding to count happy feelings, which means we counted how often each child showed happy feelings, like excited talking, smiling, or laughing. We also counted how long children looked at toys, friends, or anywhere else. Counting took a long time! We ended up with over 4,000 data points—that is a lot of data! Because we had so much data, we could ask exciting questions."
      },
      {
        "type": "heading",
        "text": "Do Children Look At Toys More Than At Friends?"
      },
      {
        "type": "paragraph",
        "text": "Our first question was: Do children look more at toys than friends while playing? We asked this question to see if we would get the same answer as other studies. Scientists like to do this because it shows there is a pattern and not just a one-time result. Because of the results of other studies, we expected that children would mostly look at toys. Do you think we found what we expected? We did! Children spent more time looking at toys than at friends or anywhere else. That means our study showed a pattern with other studies. That is important to know, especially since older studies counted how long children looked at faces on computers. Our mobile eye-tracking study told us about how children look at friends in the real world."
      },
      {
        "type": "heading",
        "text": "Do Happy Feelings Make Children Look At New Friends?"
      },
      {
        "type": "paragraph",
        "text": "Our second question was: Do happy feelings make children look at new friends? Happy feelings help us make friends, so we expected that happy feelings would make children look at friends. Do you think we found what we expected? We did! When children showed happy feelings, they were more likely to look at their new friend. It did not matter if the new friend was showing happy feelings. Only a child’s own happy feelings made them more likely to look at their new friend."
      },
      {
        "type": "paragraph",
        "text": "Children higher in behavioral inhibition looked at new friends the same amount as other children. Does this surprise you? We were a little surprised. New mobile eye-tracking research shows that how scary something is might change how often children look at that thing. Meeting new friends can be scary for shy children, but it might not be so scary that it changes how children look at each other. We also found that happy feelings came before looking at a friend! If happy feelings came after looking at a friend, that would mean looking at friends made the children feel happy. But happy feelings came before looking at a friend. That means happy feelings made children want to connect with new friends!"
      },
      {
        "type": "heading",
        "text": "Do Children Share Happy Feelings With New Friends?"
      },
      {
        "type": "paragraph",
        "text": "Our third question was: Do children share happy feelings with new friends? We expected that children higher in behavioral inhibition would be less likely to share happy feelings with friends because these children feel more unhappy feelings. Do you think we found what we expected? We did! Children higher in behavioral inhibition were less likely to show happy feelings when friends were showing happy feelings. Happy feelings help us make friends. Sharing happy feelings can show we are having fun. But when children have more unhappy feelings, they might have trouble showing happy feelings. That might make it hard to make new friends. Children higher in behavioral inhibition might feel nervous feelings that make it harder for them to share happy feelings with new friends."
      },
      {
        "type": "heading",
        "text": "What Do We Still Have To Learn?"
      },
      {
        "type": "paragraph",
        "text": "Mobile eye-tracking is new! There is still so much to learn. Next, we should study children meeting friends at different ages. For the children in our study (5–7 years old), only a child’s own happy feelings made them more likely to look at their new friend. Do you think this would be the same for older kids? Maybe teenagers are more likely to look at friends who are showing happy feelings. As we get older, we learn more about people, how they feel, and how they think. So, we might pay more attention to friends’ feelings as we grow up!"
      },
      {
        "type": "paragraph",
        "text": "Our study looked at boy-boy and girl-girl pairs. But sometimes boys and girls play together! New studies could see if children look at friends in girl-boy groups the same as they do in girl-girl and boy-boy groups. Our study also had children play for only a short time, but a new study could have children play for a longer time. This may give shy children time to get comfortable, and maybe we would see shy children showing more happy feelings if they had more time. What do you think we should study next?"
      },
      {
        "type": "heading",
        "text": "To Sum It All Up…"
      },
      {
        "type": "paragraph",
        "text": "In our study, we asked what happens when children play with new friends. Children played in pairs while wearing mobile eye-trackers. Caregivers reported their children’s behavioral inhibition levels. We counted happy feelings and we counted when children were looking at toys, friends, or anywhere else. We found that children mostly looked at toys. But, when children were showing happy feelings, they were more likely to look at their new friend. Children higher in behavioral inhibition were less likely to share happy feelings with new friends. We can use what we learned to plan more studies."
      },
      {
        "type": "paragraph",
        "text": "The most important thing we learned from this study is that children have different experiences when meeting new friends. For some children, it is a piece of cake! For other children, it can be scary. When children meet new friends, they might expect those new friends to show happy feelings. But it might be hard for some children to show happy feelings right away. Even if a new friend is nervous, they might turn out to be a great friend! So, we should all try to give new friends time. We can also help friends we know who are nervous about meeting new people. Sometimes just having a friend with you when you meet someone new makes all the difference!"
      }
    ],
    "vocabulary": [
      {
        "id": "a019-v01",
        "term": "Temperament",
        "definition": "How children experience and respond to the world.",
        "example": "Some children tend to be shyer than others because of their temperament.",
        "synonym": ""
      },
      {
        "id": "a019-v02",
        "term": "Behavioral Inhibition",
        "definition": "Fear of new people and new places. Children high in behavioral inhibition are nervous, especially in new places. We often say that children with behavioral inhibition are shy.",
        "example": "But children who are higher in behavioral inhibition are less likely to share happy feelings with new friends.",
        "synonym": ""
      },
      {
        "id": "a019-v03",
        "term": "Mobile Eye-tracking",
        "definition": "Glasses a person can wear that keep track of where they are looking. Mobile eye-tracking is special because the glasses can be worn anywhere.",
        "example": "Newer studies use mobile eye-tracking to count how long children look at people in real life.",
        "synonym": ""
      },
      {
        "id": "a019-v04",
        "term": "Two-way Mirror",
        "definition": "A mirror that is a window on one side and a mirror on the other side. Researchers use two-way mirrors to watch people without being seen.",
        "example": "Our special room had a two-way mirror, so we could watch the children playing, but they could not see us.",
        "synonym": ""
      },
      {
        "id": "a019-v05",
        "term": "Behavior Coding",
        "definition": "Making a count of the ways a person acts. In this study, we counted the times that children showed happy feelings, like smiling or laughing.",
        "example": "We used behavior coding to count happy feelings, which means we counted how often each child showed happy feelings, like excited talking, smiling, or laughing.",
        "synonym": ""
      }
    ],
    "source": {
      "publisher": "Frontiers for Young Minds",
      "url": "https://kids.frontiersin.org/articles/10.3389/frym.2023.1089129",
      "authors": [
        "Alicia Vallorani",
        "Koraly Pérez-Edgar"
      ],
      "citation": "Vallorani A and Pérez-Edgar K (2023) Playing With New Friends. Front. Young Minds. 11:1089129. doi: 10.3389/frym.2023.1089129",
      "copyright": "Copyright © 2023 Vallorani and Pérez-Edgar",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "adaptationNote": "Text adapted for reading practice: illustrations, figure pointers and reference markers omitted; glossary definitions retained. The original illustrated article is linked above."
    }
  },
  {
    "id": "a020",
    "slug": "proteinnot-just-a-food-group",
    "title": "Protein—Not Just a Food Group!",
    "teaser": "Eating protein is important to help us grow strong and stay healthy. However, protein is more than just a food group!",
    "category": "Science",
    "tags": [
      "human health",
      "science",
      "proteins",
      "amino acids",
      "dna code",
      "myosin",
      "channel protein"
    ],
    "readMinutes": 6,
    "publishedLabel": "New",
    "cover": {
      "theme": "sunrise-rose",
      "icon": "Sparkles",
      "motif": "SCIENCE"
    },
    "blocks": [
      {
        "type": "lead",
        "text": "Eating protein is important to help us grow strong and stay healthy. However, protein is more than just a food group! Proteins are the workers inside of our busy cells. These proteins have some amazing jobs to do, and thousands of proteins work together every day to keep our bodies healthy. In this article, we will discuss how proteins are made and why we need protein to keep our bodies running smoothly."
      },
      {
        "type": "paragraph",
        "text": "You have probably heard an adult in your life tell you that protein is brain food or say something like, “Eating protein makes you strong!” Protein is an important part of our diets. There is even a section on the food pyramid called “Protein,” full of meat, beans, peanut butter, and eggs. Protein is all around us, but do you know what a protein is? Are proteins only found in the foods we eat? Why do we need to eat protein to stay healthy?"
      },
      {
        "type": "heading",
        "text": "What is a Protein?"
      },
      {
        "type": "paragraph",
        "text": "You may already know that your body is made up of trillions of smaller units called cells. Each cell is like a tiny factory. Inside these factories, cells are hard at work doing everything your body needs to stay healthy. For example, cells can turn the food you eat into energy, protect you from germs, and send signals from your brain to the rest of your body. These are just a few of the hundreds of jobs that your cells are doing every second of the day! These action-packed cells are very busy places. Luckily, factories and cells both have workers to get the jobs done."
      },
      {
        "type": "paragraph",
        "text": "Proteins are the workers inside of cells. Every protein has its own special job to do. These jobs are what keep cells running smoothly. Some proteins move around inside the cell. Some proteins grab on to other proteins. Some proteins are even like shapeshifters—they can change size and shape to do their jobs! These thousands of proteins all work together to power those busy cells. Each and every one of these proteins makes the factory run and keeps your body healthy."
      },
      {
        "type": "heading",
        "text": "How Are Proteins Made?"
      },
      {
        "type": "paragraph",
        "text": "Imagine using a pile of building blocks, like Legos®, to build a castle. You can follow the instructions to build a tower, or you can make your own design. You can even combine the blocks in different ways to make a car or a bridge. It is up to your imagination—one set of building blocks can be used in a million different ways!"
      },
      {
        "type": "paragraph",
        "text": "The cells in your body do not build towers out of blocks, but they do build proteins out of amino acids. Just like Legos® are the building blocks for your castle, amino acids are the building blocks for your proteins. The same basic set of amino acids can be combined to make lots of different proteins. Cells learn how to combine the amino acids into proteins by following an instruction manual called the DNA code. The DNA code tells the cell how to combine amino acids in the correct order. Special machinery inside the cell reads the DNA code and uses it to combine amino acids into a pattern. The pattern of amino acids is what gives the protein its unique shape and size, just like your pattern of Legos® makes a unique shape. The end result is a protein ready to do one of the many interesting jobs inside the cell."
      },
      {
        "type": "heading",
        "text": "Some Proteins Use Movement to Do Their Jobs"
      },
      {
        "type": "paragraph",
        "text": "Have you ever thought about what makes your muscles move? Your brain tells your muscles to move, but your muscles need help to spring into action. This help comes from an important protein called myosin. Myosin is an example of a protein that uses movement to do its job. Myosin has just the right shape to grab onto your muscle. Then, the myosin protein holds tight and pulls hard on the muscle. When enough myosin proteins are working together, this pull is strong enough to make the muscle move! This amazing protein gives you motion when you run and jump."
      },
      {
        "type": "heading",
        "text": "Some Proteins Have the Right Shapes to Do Their Jobs"
      },
      {
        "type": "paragraph",
        "text": "Cells do not get to take a break from their hard work. The cell factories are running all the time, and all that work takes a lot of energy! Cells need extra supplies to power the constant action. Your body is full of supplies like water and nutrients, but they are stuck outside of the cell. Those supplies need to get into the cell to give the cell energy. A special type of protein called a channel protein is perfect for this job. Channel proteins are shaped like a tunnel. This tunnel connects the inside of the cell to the outside environment, so supplies can pass right through the tunnel and into the cell. This job is extremely important because cells need those supplies to power that busy factory!"
      },
      {
        "type": "heading",
        "text": "What Happens When You Eat Protein?"
      },
      {
        "type": "paragraph",
        "text": "Remember those amino acids? Your body uses amino acids as building blocks to make proteins. Your cells build thousands of proteins every day. That means you need a lot of blocks! There are 22 types of amino acids. You need all of them to build proteins, but there are nine of them that the body cannot make. These are called the essential amino acids because you can only get them from food. When you eat foods with lots of protein, like meat or beans, your body breaks those proteins apart into amino acids. Then, your body can use those amino acids to build other proteins. Imagine taking apart your Lego® castle to have the parts you need to build an airplane. Your body does the same thing, by taking apart the proteins you eat and using the parts to build new proteins that you need."
      },
      {
        "type": "paragraph",
        "text": "Now you may have a better understanding of why it is important to get plenty of protein in your diet. The essential amino acids from the proteins in foods help you to build all the cellular proteins that keep your body running smoothly! Meat-eaters will find lots of protein in foods like chicken, beef, pork, fish, dairy, and eggs. Vegetarians can find protein in peanut butter, beans, nuts, seeds, and green vegetables like broccoli. No matter what your favorite kind of protein is, remember: proteins are more than a food group!"
      }
    ],
    "vocabulary": [
      {
        "id": "a020-v01",
        "term": "Proteins",
        "definition": "Molecules that act as “workers,” doing the various jobs inside cells.",
        "example": "Proteins are the workers inside of our busy cells.",
        "synonym": ""
      },
      {
        "id": "a020-v02",
        "term": "Amino Acids",
        "definition": "The basic building blocks that make up proteins.",
        "example": "The cells in your body do not build towers out of blocks, but they do build proteins out of amino acids.",
        "synonym": ""
      },
      {
        "id": "a020-v03",
        "term": "DNA Code",
        "definition": "Information that acts like an instruction book, telling the cellular machinery how to combine amino acids into proteins.",
        "example": "Cells learn how to combine the amino acids into proteins by following an instruction manual called the DNA code.",
        "synonym": ""
      },
      {
        "id": "a020-v04",
        "term": "Myosin",
        "definition": "A protein that attaches to muscle fibers and helps our muscles to move.",
        "example": "This help comes from an important protein called myosin.",
        "synonym": ""
      },
      {
        "id": "a020-v05",
        "term": "Channel Protein",
        "definition": "A type of protein that acts like a tunnel into the cell.",
        "example": "A special type of protein called a channel protein is perfect for this job.",
        "synonym": ""
      },
      {
        "id": "a020-v06",
        "term": "Essential Amino Acids",
        "definition": "The nine amino acids that the human body cannot make. We can only get these amino acids through the foods we eat.",
        "example": "These are called the essential amino acids because you can only get them from food.",
        "synonym": ""
      }
    ],
    "source": {
      "publisher": "Frontiers for Young Minds",
      "url": "https://kids.frontiersin.org/articles/10.3389/frym.2021.581068",
      "authors": [
        "Stephanie Batalis",
        "Thomas Hollis"
      ],
      "citation": "Batalis S and Hollis T (2021) Protein—Not Just a Food Group!. Front. Young Minds. 9:581068. doi: 10.3389/frym.2021.581068",
      "copyright": "Copyright © 2021 Batalis and Hollis",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "adaptationNote": "Text adapted for reading practice: illustrations, figure pointers and reference markers omitted; glossary definitions retained. The original illustrated article is linked above."
    }
  },
  {
    "id": "a021",
    "slug": "making-schools-better",
    "title": "Making Schools Better",
    "teaser": "What makes a good school? How can schools be improved?",
    "category": "Learning",
    "tags": [
      "mathematics and economics explore the collection",
      "learning",
      "econometrics",
      "omitted variables bias",
      "natural experiments",
      "maimonides’ rule"
    ],
    "readMinutes": 7,
    "publishedLabel": "New",
    "cover": {
      "theme": "midnight-gold",
      "icon": "GraduationCap",
      "motif": "LEARNING"
    },
    "blocks": [
      {
        "type": "lead",
        "text": "What makes a good school? How can schools be improved? I explore these question in my research. My work looks at schools—specifically, what makes some schools teach math and reading better. I also study how schools influence students’ chances of going to college and how this affects their future earnings. In this article, I share key findings on how school systems can be improved."
      },
      {
        "type": "paragraph",
        "text": "Professor Joshua D. Angrist won the Nobel Prize in Economics in 2021, jointly with Professors David and Guido W. Imbens, for their methodological contributions to the analysis of causal relationships."
      },
      {
        "type": "heading",
        "text": "Understanding Cause and Effect"
      },
      {
        "type": "paragraph",
        "text": "My research looks at how people’s decisions shape their lives. I ask practical questions like: Do smaller classes help students get better grades? How do job markets determine wages? I always try to find the “why” behind what we see."
      },
      {
        "type": "paragraph",
        "text": "Quantitative research on economic questions is called econometrics. Econometricians look for cause-and-effect relationships in the world around us. We create tools to help find useful answers. Let me show you how I have used these tools to study schools."
      },
      {
        "type": "heading",
        "text": "Are Smaller Classes Better Than Large Classes?"
      },
      {
        "type": "paragraph",
        "text": "Do smaller classes help kids learn? That is the million-dollar question. Parents, teachers, and students often believe smaller classes create better learning environments. But smaller classes cost more. Schools need more teachers and classrooms. This means higher taxes. So we need to ask: is cutting class size worth the cost?"
      },
      {
        "type": "paragraph",
        "text": "In the 1990s, while working at Hebrew University in Jerusalem, I studied this question. I looked at how class size affected fourth and fifth graders in Israel. Israeli schools had very large classes back then. A quick look at the data shows students in bigger classes actually had higher test scores. But this is misleading. What is really going on?"
      },
      {
        "type": "paragraph",
        "text": "We call this omitted variables bias. This means we left out some important facts that can give us the wrong idea about how class size affects test scores. In this case, the largest classes were in city schools. City families tend to be wealthier and better educated. Also, children with disabilities or language problems were often put in smaller classes. These kids typically had lower test scores. So students in large and small classes are not comparable. The city kids tend to do well regardless of class size. So how can we tell if smaller classes really help?"
      },
      {
        "type": "heading",
        "text": "Comparing Apples to Apples"
      },
      {
        "type": "paragraph",
        "text": "The ideal research strategy is a randomized trial. This means assigning students to different class sizes by chance, so the groups are similar in every other way. This way, students in both groups have similar family backgrounds, learning abilities, and language skills. No hidden factors mess up our results. But in real life, randomly assigning kids like this faces strong objections from parents and schools."
      },
      {
        "type": "paragraph",
        "text": "Here is where I got lucky. In Israel, some students ended up in different class sizes almost by chance. Finding these natural experiments is one of my specialties as an econometrician. I look for real-world situations that mimic the random experiments we would like to run but cannot."
      },
      {
        "type": "paragraph",
        "text": "My colleague Victor Lavy and I discovered a perfect natural experiment in Israeli schools. They followed a rule limiting classes to forty students maximum. We called this Maimonides’ rule after a 12th-century scholar. The rule worked like this: If a school had forty fifth-graders, they would be in one big class. But add just one more kid, and the class had to split in two, dropping the average size to twenty students per class. This forty-student cutoff created a great research opportunity. It gave us our natural experiment."
      },
      {
        "type": "paragraph",
        "text": "This rule lets us compare “apples to apples”—similar kids who just happen to be in different size classes, typically about 20–25 pupils in the smaller classes and 35–40 pupils in the larger classes. Our results show clearly: smaller classes produce higher test scores. Is this improvement worth the extra cost? No definite answer exists. We cannot measure the full costs vs. long-term benefits for society. But because schools can reduce class size relatively easily, it is worth considering."
      },
      {
        "type": "heading",
        "text": "Improving Schooling Quality"
      },
      {
        "type": "paragraph",
        "text": "At MIT, my colleagues and I run a research center called Blueprint Labs where we tackle ambitious projects. One project involves New York City’s school system, which serves about one million students. New York publishes basic school quality measures: average test scores, graduation rates, and college attendance. Families use this information to choose schools across the city."
      },
      {
        "type": "paragraph",
        "text": "The problem is that measuring school quality is tricky. Schools serving wealthy families look better because these students tend to do well anywhere. This creates the same bias problem we saw with class sizes. Our project develops better ways for New York to measure school quality. We are creating methods to solve the bias problem and give more accurate estimates. Then we test how families use this information to choose schools."
      },
      {
        "type": "paragraph",
        "text": "This project excites me because it applies ideas I have developed over 30 years to a real-world situation. We will start with middle schools, giving hundreds of thousands of families new information about school quality. This improves schooling especially for low-income children. As an economist, I believe better schools are the best way to reduce poverty."
      },
      {
        "type": "heading",
        "text": "Recommendations For Young Minds"
      },
      {
        "type": "paragraph",
        "text": "My career rewards me. I do work that I love. But it was not always easy. In high school, I was a poor student. I disliked homework and left school in 11th grade with minimal credentials. When I got to college, I barely knew any math. This made my first economics courses challenging. But I found economics so interesting that I worked hard to catch up."
      },
      {
        "type": "paragraph",
        "text": "Math continued to trouble me throughout college and graduate school. At the start of my PhD, I struggled with advanced math. I failed exams, which was frustrating and exhausting. My love for economics drove me to put in the time and eventually close the gap. Based on this experience, my advice is simple: do not worry too much if you are falling behind. If you find something interesting, that interest will drive you to get the tools you need."
      },
      {
        "type": "paragraph",
        "text": "Later in my career, I faced different challenges. I became interested in natural experiments for studying cause and effect. My colleague Guido Imbens and I developed a theory about extracting information from these situations. We thought our work was important, but many colleagues disagreed. Our early papers were rejected by journals, which was frustrating."
      },
      {
        "type": "paragraph",
        "text": "We pushed forward. About 10 years later, people started to see our theory’s value. It took another decade for the approach to become widely used. Eventually, in 2021, Guido and I won a Nobel Prize for this work. We proved our critics wrong, but it took persistence. My message to aspiring scholars: academic success requires playing the long game!"
      }
    ],
    "vocabulary": [
      {
        "id": "a021-v01",
        "term": "Econometrics",
        "definition": "The economics branch using math and statistics to study economic questions. Econometrics helps find cause-and-effect relationships, like how education affects earnings or how class size affects student performance.",
        "example": "Quantitative research on economic questions is called econometrics.",
        "synonym": ""
      },
      {
        "id": "a021-v02",
        "term": "Omitted Variables Bias",
        "definition": "When a study misses an important factor that affects the results, leading to wrong conclusions.",
        "example": "We call this omitted variables bias.",
        "synonym": ""
      },
      {
        "id": "a021-v03",
        "term": "Natural Experiments",
        "definition": "Real-world situations that econometricians can use to mimic controlled experiments when actual experiments are not possible.",
        "example": "Finding these natural experiments is one of my specialties as an econometrician.",
        "synonym": ""
      },
      {
        "id": "a021-v04",
        "term": "Maimonides’ Rule",
        "definition": "A rule named after a 12th-century scholar who stated that class size should not exceed forty students.",
        "example": "We called this Maimonides’ rule after a 12th-century scholar.",
        "synonym": ""
      }
    ],
    "source": {
      "publisher": "Frontiers for Young Minds",
      "url": "https://kids.frontiersin.org/articles/10.3389/frym.2026.1662646",
      "authors": [
        "Joshua Angrist"
      ],
      "citation": "Angrist J (2026) Making Schools Better. Front. Young Minds. 14:1662646. doi: 10.3389/frym.2026.1662646",
      "copyright": "Copyright © 2026 Angrist",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "adaptationNote": "Text adapted for reading practice: illustrations, figure pointers and reference markers omitted; glossary definitions retained. The original illustrated article is linked above."
    }
  },
  {
    "id": "a022",
    "slug": "the-arctic-ocean-is-becoming-less-salty",
    "title": "The Arctic Ocean is Becoming Less Salty",
    "teaser": "The Arctic Ocean is the smallest and coldest ocean on Earth, located around the North Pole. Right now, the Arctic Ocean is becoming less salty.",
    "category": "Science",
    "tags": [
      "earth sciences explore the collection",
      "science",
      "arctic ocean",
      "freshening",
      "freshwater",
      "sea ice",
      "currents"
    ],
    "readMinutes": 9,
    "publishedLabel": "New",
    "cover": {
      "theme": "ocean-teal",
      "icon": "Compass",
      "motif": "SCIENCE"
    },
    "blocks": [
      {
        "type": "lead",
        "text": "The Arctic Ocean is the smallest and coldest ocean on Earth, located around the North Pole. Right now, the Arctic Ocean is becoming less salty. Scientists call this process freshening. Freshening happens because more freshwater flows into the ocean from melting ice, rivers, rain, and snow. Freshening can change how tiny ocean plants grow and affect the animals that live in the Arctic. It can even change global ocean currents that help control Earth’s climate. In this article, you will learn where the freshwater comes from, how it changes the Arctic Ocean, and why these changes matter for the whole planet."
      },
      {
        "type": "heading",
        "text": "A Changing Arctic"
      },
      {
        "type": "paragraph",
        "text": "Have you ever made lemonade that was too sour, and then tried to fix it by adding more water? Believe it or not, something similar is happening to the Arctic Ocean. But instead of lemon juice getting diluted, it is the salty seawater itself becoming less concentrated."
      },
      {
        "type": "paragraph",
        "text": "The Arctic Ocean is the northernmost ocean of the planet. While it is the smallest of the world’s oceans, it is still as large as all of Europe. The Arctic Ocean is cold and covered by ice for most of the year. This makes it important to the whole globe because it keeps Earth’s climate balanced. In recent years, scientists have discovered that the Arctic Ocean is freshening. This means there is less salt in the water. But why is that happening? And why does it matter?"
      },
      {
        "type": "heading",
        "text": "What Does “Freshening” Mean?"
      },
      {
        "type": "paragraph",
        "text": "Everyone knows the ocean is salty. But did you know that some parts of the ocean are actually saltier than others? How salty seawater is depends on the climate and on how much freshwater is being added."
      },
      {
        "type": "paragraph",
        "text": "When the climate is hot, more seawater evaporates and turns into vapor. As the water leaves the ocean, the salt stays behind, making the ocean saltier. In other places, lots of freshwater is added by rain, rivers, or melting ice. This makes the water less salty. You can think of each ocean like a big bathtub. Some bathtubs are hot and steamy, which leaves more salt behind. Other bathtubs have giant faucets pouring in freshwater that dilutes the salt."
      },
      {
        "type": "paragraph",
        "text": "When scientists talk about the freshening of the Arctic Ocean, they mean that more and more freshwater is mixing into the salty seawater—just like if you were to open up the faucet and add more freshwater to a salty bathtub."
      },
      {
        "type": "heading",
        "text": "Where is All This Freshwater Coming From?"
      },
      {
        "type": "paragraph",
        "text": "More freshwater is being added to the Arctic Ocean now than there was in the past. But where is all this water coming from?"
      },
      {
        "type": "paragraph",
        "text": "One source is the melting of sea ice and glaciers. As the Arctic gets warmer, ice melts faster than it used to. All that melted ice turns into liquid freshwater that flows into the ocean. Both sea ice and glaciers act as sources of freshwater when they melt, but only melting glaciers cause sea levels to rise. That is because glaciers sit on land, so when they melt, they add new water to the ocean. Since sea ice is already floating in the water and taking up space, when it melts it does not change sea level. But melting sea ice still makes the top layer of the ocean fresher."
      },
      {
        "type": "paragraph",
        "text": "Another source of freshwater is the huge rivers that flow northward and drain into the Arctic Ocean. These include the Mackenzie River in Canada, the Lena River in Russia, and the Yukon River in Alaska. These rivers carry a lot of freshwater from the land into the ocean, and this amount has been increasing. The Arctic is also getting more rain and snow as the climate changes. When rain falls or snow melts, it adds even more freshwater to the ocean."
      },
      {
        "type": "heading",
        "text": "Not Every Part of the Arctic Feels the Same"
      },
      {
        "type": "paragraph",
        "text": "In reality, the Earth’s oceans are not like separate bathtubs. Instead, they are all connected, like big swimming pools joined together in a water park. The water moves around between these pools in pathways called currents. Currents carry salt and heat to different places."
      },
      {
        "type": "paragraph",
        "text": "The Arctic Ocean is connected to two other oceans: the Pacific Ocean and the Atlantic Ocean. Water comes into the Arctic from both of these oceans, bringing extra salt and heat. At the same time, cold, fresher water from the Arctic flows back out into the Atlantic. Because of these currents, the water in the Arctic Ocean is not the same everywhere. Some parts are warmer or saltier, and other parts are colder or fresher."
      },
      {
        "type": "paragraph",
        "text": "One important region of the Arctic Ocean is called the Beaufort Gyre. It is a large, spinning circle of water in the western Arctic that collects and holds a lot of freshwater from melting ice and rivers. Over time, this freshwater builds up, making the water there less salty. In the eastern Arctic, warm and salty water flows in from the Atlantic Ocean. This makes that part of the ocean warmer and saltier than other areas. Scientists study these different ocean areas and how they are connected, to learn how the Arctic Ocean is changing."
      },
      {
        "type": "heading",
        "text": "Freshening Changes with the Seasons"
      },
      {
        "type": "paragraph",
        "text": "The Arctic Ocean does not stay the same all year round. It has some of the most extreme seasons on Earth! In winter, the Arctic is very cold and dark. Most of the ocean is covered by thick sea ice. Then, in summer, the sun shines all day and night, and much of that ice melts. This freezing and melting cycle changes how much freshwater is in the ocean. In winter when the water freezes, the salt is left behind, making the remaining water saltier. Then when ice melts in summer, it adds a lot of freshwater, making the water less salty."
      },
      {
        "type": "paragraph",
        "text": "Rivers also change with the seasons. In spring, when the snow and ice on land start to melt, rivers rush more freshwater to the Arctic Ocean. But because the Arctic is warming, this rush of river water is starting earlier. Sometimes this is starting in May instead of June and July. All these changes mean that Arctic Ocean freshening changes with the seasons too. Scientists watch these seasonal shifts closely to understand how the Arctic is changing over time."
      },
      {
        "type": "heading",
        "text": "Why Does Freshening Matter?"
      },
      {
        "type": "paragraph",
        "text": "Freshening might sound harmless, but it can cause some big changes in the ocean. When freshwater pours into the Arctic Ocean, it forms layers because freshwater is lighter than salty water. Scientists call this layering stratification. This means the freshwater stays on top and does not mix well with the saltier water below. Have you ever been swimming and felt warm water near your neck but cold water near your toes? That is one way you can feel stratification."
      },
      {
        "type": "paragraph",
        "text": "This layering stops the ocean from mixing properly, keeping the surface water separated from deeper water. Deeper waters often have more nutrients because dead plants and animals sink downward, where they slowly break down and release nutrients. Normally, ocean mixing brings these nutrients back up toward the surface. However, when the water does not mix, important nutrients cannot rise to the surface. Tiny plants in the ocean, called phytoplankton, need these nutrients to grow. Phytoplankton are super important because they are the base of the ocean food web. If they do not grow, animals that eat them will struggle. This includes everything from tiny shrimp, to fish, and even larger seals and whales higher up the food chain."
      },
      {
        "type": "paragraph",
        "text": "Freshwater from rivers can also carry mud and dirt that block sunlight. Like plants on land, phytoplankton need sunlight to grow. So, muddy water can make it harder for them to get enough light."
      },
      {
        "type": "paragraph",
        "text": "Freshening might even affect global ocean currents. These are slow-moving rivers of water that flow through the oceans all around the Earth. These currents help keep our planet’s climate balanced by moving heat and moisture between the equator and the poles. Some scientists worry that too much freshwater in the Arctic could slow down or even stop these currents. That would change weather and climate worldwide."
      },
      {
        "type": "heading",
        "text": "The Future Arctic Ocean"
      },
      {
        "type": "paragraph",
        "text": "In the future, the Earth’s climate is likely to get even warmer. This means that more freshwater from rivers, ice melt, and precipitation will enter the Arctic Ocean, making it less salty than it is today. A fresher Arctic Ocean will be more stratified. This can make it more difficult for deeper, nutrient-rich ocean waters to mix up to the surface where they feed the tiny plants at the base of the food web. This means there may be changes in who is living in the Arctic Ocean ecosystem. Not only does Arctic Ocean freshening impact the food chain, but it might also slow down the global ocean currents that move heat around our planet. This makes it important for scientists to study how freshwater in the Arctic Ocean is changing so we can better prepare for the future."
      }
    ],
    "vocabulary": [
      {
        "id": "a022-v01",
        "term": "Arctic Ocean",
        "definition": "The smallest and coldest of Earth’s oceans, located at the North Pole.",
        "example": "The Arctic Ocean is the smallest and coldest ocean on Earth, located around the North Pole.",
        "synonym": ""
      },
      {
        "id": "a022-v02",
        "term": "Freshening",
        "definition": "The process of ocean water becoming less salty.",
        "example": "Scientists call this process freshening.",
        "synonym": ""
      },
      {
        "id": "a022-v03",
        "term": "Freshwater",
        "definition": "Natural water without any salt.",
        "example": "Freshening happens because more freshwater flows into the ocean from melting ice, rivers, rain, and snow.",
        "synonym": ""
      },
      {
        "id": "a022-v04",
        "term": "Sea Ice",
        "definition": "Ice floating on the ocean’s surface, made from frozen seawater.",
        "example": "One source is the melting of sea ice and glaciers.",
        "synonym": ""
      },
      {
        "id": "a022-v05",
        "term": "Currents",
        "definition": "Slow-moving rivers of water that flow through the ocean and move heat around the Earth.",
        "example": "It can even change global ocean currents that help control Earth’s climate.",
        "synonym": ""
      },
      {
        "id": "a022-v06",
        "term": "Stratification",
        "definition": "When layers of water form and do not mix well.",
        "example": "Scientists call this layering stratification.",
        "synonym": ""
      },
      {
        "id": "a022-v07",
        "term": "Phytoplankton",
        "definition": "Tiny ocean plants that are the base of the food chain.",
        "example": "Tiny plants in the ocean, called phytoplankton, need these nutrients to grow.",
        "synonym": ""
      }
    ],
    "source": {
      "publisher": "Frontiers for Young Minds",
      "url": "https://kids.frontiersin.org/articles/10.3389/frym.2026.1670543",
      "authors": [
        "Henry C. Henson",
        "Kristina Brown"
      ],
      "citation": "Henson HC and Brown K (2026) The Arctic Ocean is Becoming Less Salty. Front. Young Minds. 14:1670543. doi: 10.3389/frym.2026.1670543",
      "copyright": "Copyright © 2026 Henson and Brown",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "adaptationNote": "Text adapted for reading practice: illustrations, figure pointers and reference markers omitted; glossary definitions retained. The original illustrated article is linked above."
    }
  },
  {
    "id": "a023",
    "slug": "the-magic-of-mindfulness-in-sport",
    "title": "The Magic of Mindfulness in Sport",
    "teaser": "Top-level athletes are not only strong and fast, but they also look totally focused as if, in the moment of performance, the world around them does not exist. In the early days of sport psychology, this led to two misconceptions.",
    "category": "Psychology",
    "tags": [
      "neuroscience and psychology explore the collection",
      "psychology",
      "3r process",
      "mindfulness",
      "formal mindfulness training",
      "attention",
      "awareness"
    ],
    "readMinutes": 10,
    "publishedLabel": "New",
    "cover": {
      "theme": "royal-violet",
      "icon": "Brain",
      "motif": "PSYCHOLOGY"
    },
    "blocks": [
      {
        "type": "lead",
        "text": "Top-level athletes are not only strong and fast, but they also look totally focused as if, in the moment of performance, the world around them does not exist. In the early days of sport psychology, this led to two misconceptions. First, we thought that when athletes looked calm and confident, their minds were quiet and positive. Second, we thought these people were born with extraordinary minds. Today, sport psychologists know better. We know the mind is busy and even the best athletes experience unpleasant thoughts and doubt at times. We also know that athletes can learn to refocus on the task at hand. They can do so by practicing mindfulness, which is training their attention to stay in the present moment, by bringing it back when it wanders. It is like taking the mind to the gym. In this article, I will explain how mindfulness training helps athletes perform at their best."
      },
      {
        "type": "heading",
        "text": "Inside the Mind of a World-Class Athlete"
      },
      {
        "type": "paragraph",
        "text": "Let me start by inviting you inside the mind of a world-class athlete. Imagine an Olympic sailor. Over the last 10 years, she has trained hard in pursuit of one goal: Olympic glory. Now she is at the Olympics and the dream is within reach."
      },
      {
        "type": "paragraph",
        "text": "The competition takes place over 6 days, with two races every day. The first 5 days have gone well. She is in the lead, but the other sailors are close behind, and a medal is by no means guaranteed. The morning of the final, she knows exactly what she must do in today’s race. She must observe the winds closely and sail with good technique—then she can win. Winning will require her to be totally focused on the present moment, concentrated on the task."
      },
      {
        "type": "paragraph",
        "text": "She knows this, but she is nervous. Two times this year she has been in the lead, only to be overtaken in the final. As today’s race begins, her start is not very good. Inevitably, thoughts about her previous losses come creeping in. Her attention wanders from the present moment to the past (“What did I do wrong?”) and on to the future (“What if it happens again?”). While her mind wanders, she is not focused on the present moment. She misses a good puff of wind and forgets about technique. Luckily, she notices that her focus is not right and brings her attention back to where it needs to be."
      },
      {
        "type": "paragraph",
        "text": "She manages to reach the top mark as one of the first sailors. Back in the front group, she can almost taste the sweetness of success. Her mind wanders off to the future—to victory and national celebration. Daydreaming, she almost misses a very windy patch on the water. Again, however, she notices her mind is wandering and brings her attention back to the task. This happens many times during the race. At times she is almost celebrating, convinced that victory is in hand. At other times, panic, anxiety, and memories of previous defeats cloud her mind. Every time, she notices her wandering mind and brings it back to the present moment. This is something she has been training intensely. She continually reminds herself of her strategy and she goes on to win a medal."
      },
      {
        "type": "heading",
        "text": "Always Focused: An Unreachable Goal"
      },
      {
        "type": "paragraph",
        "text": "You may be surprised to learn that even a world-class athlete and Olympic medal-winner struggles to stay focused. This is not actually so surprising. The human mind is equipped with extraordinary powers, which are also a weakness. Humans can evaluate their mistakes to make sure they do not happen again. Unfortunately, it is hard for us not to constantly evaluate our performance. Humans can foresee problems before they occur, which is why we can do things like build safe bridges. Unfortunately, it is hard for us not to worry about all the things that could go wrong."
      },
      {
        "type": "paragraph",
        "text": "Athletes are human beings. Just like the rest of us, they are born with minds that are prone to wandering. Sometimes the mind wanders off to the past (“Why did I make that mistake?) Other times, it wanders off into the future (“If I win the next point, I will be world champion!”)."
      },
      {
        "type": "paragraph",
        "text": "The mind wanders easily during moments of intense pressure. Often, in sport, the outcome is highly uncertain. At the same time, that outcome has significant personal meaning. The Olympic games are a good example. For most athletes, success at the Olympics can mean financial rewards and eternal glory. At the same time, all the competitors are well-prepared and eager to win. No wonder athletes get nervous and find it hard to stay in the present moment."
      },
      {
        "type": "paragraph",
        "text": "Although the sailor we described is often distracted, she manages, again and again, to put her mind where it needs to be—on the task. She does this using the 3R process. Her mind wanders, but the ability to refocus is a skill she has trained and perfected, like all her other sailing skills. Mindfulness is a good tool for the job."
      },
      {
        "type": "heading",
        "text": "What Is Mindfulness?"
      },
      {
        "type": "paragraph",
        "text": "Let us do a short mindfulness exercise. Read this description first and then try it."
      },
      {
        "type": "paragraph",
        "text": "Sit comfortably. Close your eyes. Notice your breath. You do not need to slow it down or change it in any way—just notice it. You may notice how your belly expands and contracts, or the feeling of air passing through your nose. Whenever a thought pops into your head, just notice it. Remember, “Why do I have so many thoughts?” or “This exercise is stupid!” are also thoughts. Try not to judge whether the thought is good or bad—just notice. When you notice thoughts, gently bring your attention back to your breath. Go ahead and do this for 1 min."
      },
      {
        "type": "paragraph",
        "text": "How often did your attention wander from your breath? How often were you distracted? If you are like the rest of us, probably quite often. This is also true for athletes. And, the more pressure a person is under, the more the mind tends to wander."
      },
      {
        "type": "paragraph",
        "text": "Mindfulness has been described as paying attention on purpose, in the present moment, without judgment. That means being aware of what is going on both inside and outside of yourself, without getting lost in the thoughts that are always in your mind. Mindfulness is an ancient Eastern concept, and back then it had a religious purpose. Today it is also very popular in the West, but without any ties to religion."
      },
      {
        "type": "paragraph",
        "text": "In sport psychology, mindfulness is the ability to put attention where it needs to be. It is a very important skill that must be practiced so that it can be used when performing under pressure. Mindfulness training is an essential tool to help athletes develop the skill of mindfulness. Mindfulness training has been gaining popularity as sport psychologists have seen how even the best athletes experience intruding negative thoughts during their most important events."
      },
      {
        "type": "heading",
        "text": "What Does Mindfulness Do for Athletes?"
      },
      {
        "type": "paragraph",
        "text": "Although athletes in competition look totally focused, as if the world around them does not exist, we know that their minds are busy. Even the best athletes experience doubt and worry. Luckily, they can learn to refocus on the task at hand. This ability to take charge of their attention in crucial moments of a performance is the most important psychological skill for athletes. Gandalf would say it is the one ring to rule them all."
      },
      {
        "type": "paragraph",
        "text": "If an athlete is not fully focused, their performance will suffer. A sailor may miss a windy patch. A football player may miss an opportunity for a brilliant pass because he does not see that a teammate is free. A boxer may react a second too slowly and be punched in the face. Tobias Lundgren and his colleagues taught mindfulness to a group of ice hockey players in Sweden and found that these players performed better at goals, assists, and shots taken, and that they were rated by their coaches as being more focused and committed. Mindfulness simply helps athletes do their best."
      },
      {
        "type": "paragraph",
        "text": "At the same time, training mindfulness regularly is good for wellbeing. Through mindfulness training, athletes get to know their minds, accept how the mind works, and engage with what is important to them. As a result, they are less stressed and experience higher wellbeing. Athletes with high wellbeing are more likely to stay in sport."
      },
      {
        "type": "heading",
        "text": "How Can Athletes Train Mindfulness?"
      },
      {
        "type": "paragraph",
        "text": "Like any other skill, mastering mindfulness requires training. Athletes can train the ability to keep their attention in the present moment, bringing it back each time it wanders. It is like taking the mind to the gym. Mindfulness can be practiced formally and informally."
      },
      {
        "type": "paragraph",
        "text": "Formal mindfulness training means setting aside time for training, like going to the gym for a workout. It often takes the form of meditation exercises. Athletes will lie down and listen to a voice telling them what to focus on, typically for between 5 and 20 min. Exercises vary, but they always have an element of practicing attention (focusing on the breath, a sound, or a sensation) and awareness (noticing when attention wanders and bringing it back)."
      },
      {
        "type": "paragraph",
        "text": "Informal mindfulness training means training awareness and attention while you are engaged in another task, like exercising by biking to school. For example, a sailor polishing his boat may bring all his attention to the sensation of polishing. Every time he thinks about what is for dinner, he gently brings his attention back to polishing. Or imagine a cyclist practicing mindfulness on her bike. She focuses all her attention on a smooth pedal stroke and practices her ability to bring her attention back every time a distracting thought pops up."
      },
      {
        "type": "heading",
        "text": "Conclusion"
      },
      {
        "type": "paragraph",
        "text": "Like the rest of us, athletes’ minds are prone to wandering and losing focus. Teaching athletes to be fully present in the moment of performance and to maintain their attention on the task at hand can help them to perform better. Mindfulness training is an invaluable method for training athletes—and others—to keep their attention on the present moment, which helps them to attain maximum performance and wellbeing."
      }
    ],
    "vocabulary": [
      {
        "id": "a023-v01",
        "term": "3R Process",
        "definition": "A mindfulness in action process that consists of (1) registering that the mind has wandered, (2) releasing from the difficult thoughts or emotions and (3) refocusing on the task.",
        "example": "She does this using the 3R process.",
        "synonym": ""
      },
      {
        "id": "a023-v02",
        "term": "Mindfulness",
        "definition": "The ability to pay attention, on purpose, to the present moment, without judgment or reaction.",
        "example": "They can do so by practicing mindfulness, which is training their attention to stay in the present moment, by bringing it back when it wanders.",
        "synonym": ""
      },
      {
        "id": "a023-v03",
        "term": "Formal Mindfulness Training",
        "definition": "Setting aside time to train, for example through a meditation exercise.",
        "example": "Formal mindfulness training means setting aside time for training, like going to the gym for a workout.",
        "synonym": ""
      },
      {
        "id": "a023-v04",
        "term": "Attention",
        "definition": "The ability to focus on one thing (often the task at hand).",
        "example": "They can do so by practicing mindfulness, which is training their attention to stay in the present moment, by bringing it back when it wanders.",
        "synonym": ""
      },
      {
        "id": "a023-v05",
        "term": "Awareness",
        "definition": "The ability to notice when attention wanders and bring it back.",
        "example": "Exercises vary, but they always have an element of practicing attention (focusing on the breath, a sound, or a sensation) and awareness (noticing when attention wanders and bringing it back).",
        "synonym": ""
      },
      {
        "id": "a023-v06",
        "term": "Informal Mindfulness Training",
        "definition": "Training while engaged in another task.",
        "example": "Informal mindfulness training means training awareness and attention while you are engaged in another task, like exercising by biking to school.",
        "synonym": ""
      }
    ],
    "source": {
      "publisher": "Frontiers for Young Minds",
      "url": "https://kids.frontiersin.org/articles/10.3389/frym.2022.683827",
      "authors": [
        "Kristoffer Henriksen"
      ],
      "citation": "Henriksen K (2022) The Magic of Mindfulness in Sport. Front. Young Minds. 10:683827. doi: 10.3389/frym.2022.683827",
      "copyright": "Copyright © 2022 Henriksen",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "adaptationNote": "Text adapted for reading practice: illustrations, figure pointers and reference markers omitted; glossary definitions retained. The original illustrated article is linked above."
    }
  },
  {
    "id": "a024",
    "slug": "speech-prosody-the-musical-magical-quality-of-speech",
    "title": "Speech Prosody: The Musical, Magical Quality of Speech",
    "teaser": "When we speak, we can vary how we use our voices. Our speech can be high or low (pitch), loud or soft (loudness), and fast or slow (duration).",
    "category": "Psychology",
    "tags": [
      "neuroscience and psychology explore the collection",
      "psychology",
      "speech prosody",
      "stress pattern",
      "rhythm",
      "intonation",
      "pitch"
    ],
    "readMinutes": 9,
    "publishedLabel": "New",
    "cover": {
      "theme": "royal-violet",
      "icon": "Brain",
      "motif": "PSYCHOLOGY"
    },
    "blocks": [
      {
        "type": "lead",
        "text": "When we speak, we can vary how we use our voices. Our speech can be high or low (pitch), loud or soft (loudness), and fast or slow (duration). This variation in pitch, loudness, and duration is called speech prosody. It is a bit like making music. Varying our voices when we speak can express sarcasm or emotion and can even change the meaning of what we are saying. So, speech prosody is a crucial part of spoken language. But how do speakers produce prosody? How do listeners hear and understand these variations? Is it possible to hear and interpret prosody in other languages? And what about people whose hearing is not so good? Can they hear and understand prosodic patterns at all? Let’s find out!"
      },
      {
        "type": "paragraph",
        "text": "During their first year at Hogwarts, Harry Potter and his friends learn the levitation charm “Wingardium Leviosa”. While practicing, Harry’s best friend, Ron, has a hard time making the feather on his desk obey his command and lift into the air. Hermione knows exactly why: “You’re saying it wrong. It’s Levi-o-sa, not Levio-sa”. “You do it, then, if you’re so clever. Go on, go on!”, replies Ron. With a swish and a flick of her wand, Hermione speaks the charm “Win-gar-dium Levi-o-sa!” and her feather slowly rises from her desk. It turns out that the levitation charm only works if you say the magic words properly. In other words, what you say matters, but how you say it also makes a big difference. Hermione actually uses speech prosody to convince her feather to levitate."
      },
      {
        "type": "heading",
        "text": "What Is Speech Prosody?"
      },
      {
        "type": "paragraph",
        "text": "Speech prosody is often described as the musical quality of speech. If you think of vowels and consonants as the sounds of language that make up what you say, then prosody is related to how you say these sounds. When Hermione corrects Ron’s pronunciation, she does not correct any vowels or consonants. In fact, the vowels and consonants in “Levi-o-sa” and “Levio-sa” are the same. What Hermione corrects instead is the stress pattern. Ron mistakenly places emphasis on “sa” in “Leviosa” when he is supposed to place it on “o”. Without the correct stress pattern, the words “Wingardium Leviosa” no longer have the intended meaning and the levitation charm does not work. Now, you might think: “great example, but the Harry Potter stories are fictional, and I could never make an object fly”. This may be true, but speech prosody works just as well in our Muggle (non-magic) world. Have you ever thought about how “object” can be pronounced in two ways? When we mentioned “object” a few sentences ago, we meant the noun that refers to a thing that can be seen and touched. In this context, you would pronounce “object” with stress on the first part of the word, like “ob-ject”. But if you were to stress the second part, instead, it takes on a new meaning. The verb “ob-ject” describes someone expressing disagreement. Think of how Hermione ob-jects to Ron’s pronunciation of the levitation charm. So, by simply changing the stress pattern, the word changes from a noun to a verb. Now that really is magic!"
      },
      {
        "type": "paragraph",
        "text": "Speech prosody is more than just changing stress patterns though. When you speak, everything you do with your voice that is not directly related to pronouncing vowels and consonants is prosodic. Think of the rhythm and intonation of speech. Prosody makes speech sound less monotonous and boring. It can also change the meaning of speech—the meaning of a whole sentence can change by emphasizing different words! You can also make serious sentences sound sarcastic, or make happy stories sound sad, when you change the tone of your voice. Or you can turn statements into questions by changing the prosodic pattern. Try saying this sentence aloud: “See you tomorrow!”. Now say the sentence again, but this time turn it into a question: “See you tomorrow?” Notice how your voice goes up in pitch at the end of the sentence? This is speech prosody!"
      },
      {
        "type": "heading",
        "text": "How Do We Use and Understand Prosody?"
      },
      {
        "type": "paragraph",
        "text": "When we speak, we can (and do!) vary how high or low, how loud or soft, and how fast or slow our speech is. This variation in pitch, loudness, and duration is what creates the prosodic patterns of speech. Everyone uses prosody when they speak. Even Ron uses prosody when he says “Levio-sa” by pronouncing “sa” slightly higher, louder, and longer than the other parts of the word. Compare this to when Hermione says “Levi-o-sa”. She pronounces “o” higher, louder, and longer than the other parts of the word. Whatever the prosodic pattern may be, it is always described in terms of the relative increase or decrease in pitch, loudness, and duration."
      },
      {
        "type": "paragraph",
        "text": "When we listen to speech, we can usually hear the variation in pitch, loudness, and duration that a speaker produces. These prosodic patterns help us understand what was said. Over time, we learn to recognize commonly used prosodic patterns and attach meaning to them. For example, when you were very young, you learned that someone is asking a question if their voice rises in pitch at the end of the sentence. But you may not always be aware of such connections. As a Muggle, you might never have realized how important the correct stress pattern is in “Levi-o-sa”, since these magic words have no function in the Muggle world. Ron, on the other hand, must learn the correct stress pattern if he wants to make objects fly. As a wizard, he has to make the connection between the stress pattern “Levi-o-sa” and its function: producing a proper levitation charm."
      },
      {
        "type": "heading",
        "text": "How Does Our Native Language Influence Prosody?"
      },
      {
        "type": "paragraph",
        "text": "When Harry, Ron, and Hermione are in their fourth year, students from Durmstrang and Beauxbatons visit Hogwarts to compete in the Triwizard Tournament. These international students speak English, but English is not their native language. Now, imagine that Hermione wants to teach one of these international students the levitation charm. You might think that the difference between “Levi-o-sa” and “Levio-sa” would be obvious to everyone, but in fact, people who speak another language might not be able to tell the difference as easily as you or Ron can. This is because not all languages use the same prosodic patterns. Have you, for instance, ever noticed how English or German sound very different from French or Italian? We have seen that, in English, a word can change meaning if you change the stress pattern (like in “ob-ject” and “ob-ject”), but in some other languages, stress patterns are always fixed. In French, for instance, stress is always on the final part of a word. So, Fleur, a student from the French wizarding school Beauxbatons, will probably say “Levio-sa”, just like Ron does. But the question is: would Fleur realize that the correct pronunciation has a different stress pattern? Listeners tend to stick to what they know, and their native languages may influence how they perceive speech in another language. If Fleur listens to Hermione teaching her the spell, she might be able to hear that “Levi-o-sa” is different from “Levio-sa”, but she will probably not realize how important the stress contrast is for the meaning of the word because stress contrasts do not exist in French. So, she may not recognize the stress contrast for what it is. But do not worry, she can still learn to recognize it and if anyone can teach her, it is Hermione!"
      },
      {
        "type": "heading",
        "text": "How Does Our Hearing Ability Influence Prosody Perception?"
      },
      {
        "type": "paragraph",
        "text": "Good hearing is important for understanding prosody. After all, it would be hard to link prosodic patterns to their function if you could not hear the patterns in the first place. This is the case for listeners who hear very little or are completely deaf. Fortunately, a device called a cochlear implant can bring back some hearing for these listeners. A surgeon implants a wire with tiny electrodes into part of the inner ear called the cochlea. This is the place where healthy ears transform soundwaves into electrical signals that are then sent to the brain via the auditory nerve. For listeners with cochlear implants, the transformation of soundwaves into electrical signals happens via the device and the electrodes send these signals to the auditory nerve directly. Listening with a cochlear implant is sometimes called electric hearing. In a sense, it is magical that this device can bring back some hearing, but electric hearing is far from perfect. Listeners with cochlear implants have difficulty hearing pitch differences. If Ron had a cochlear implant, it would have been very hard for him to hear that Hermione pronounces “o” slightly higher in pitch than the other parts of the word “Levi-o-sa”. However, he would still be able to hear it as louder and longer, so there is a chance he would be able to learn the correct stress pattern with practice. In time, he would probably still be able to make sense of the prosodic pattern based on what he could hear, although this would be much harder work than if his hearing was not impaired."
      },
      {
        "type": "heading",
        "text": "What Is the Magic of Speech Prosody?"
      },
      {
        "type": "paragraph",
        "text": "The fact that speech prosody can make objects fly is pretty magical. But do you know what is even more magical? That you now know how important speech prosody is! It is like you have been waiting for a Hogwarts letter announcing you are off to Wizarding school so you can finally learn all about the magical powers of speech prosody. Well, here it is. Your letter has arrived. So, what are you waiting for? Get ready to go out into the Muggle world and use your speech prosody magic!"
      }
    ],
    "vocabulary": [
      {
        "id": "a024-v01",
        "term": "Speech Prosody",
        "definition": "The musical quality of speech, like stress, rhythm, and intonation. It can express sarcasm and emotions, and it can also change the meaning of speech.",
        "example": "This variation in pitch, loudness, and duration is called speech prosody.",
        "synonym": ""
      },
      {
        "id": "a024-v02",
        "term": "Stress Pattern",
        "definition": "The way parts of a word or sentence are stressed or unstressed. Stressed parts are emphasized by increasing the relative pitch, loudness, and duration.",
        "example": "What Hermione corrects instead is the stress pattern.",
        "synonym": ""
      },
      {
        "id": "a024-v03",
        "term": "Rhythm",
        "definition": "The structured organization of speech parts over time, like the beat of a song. Speech usually has a rhythm that you can tap along to.",
        "example": "Think of the rhythm and intonation of speech.",
        "synonym": ""
      },
      {
        "id": "a024-v04",
        "term": "Intonation",
        "definition": "The way pitch varies over time, like the melody of a song.",
        "example": "Think of the rhythm and intonation of speech.",
        "synonym": ""
      },
      {
        "id": "a024-v05",
        "term": "Pitch",
        "definition": "How high or low speech is. What we hear as pitch can be measured as the frequency of a voice—when the frequency goes up, the perceived pitch goes up.",
        "example": "Our speech can be high or low (pitch), loud or soft (loudness), and fast or slow (duration).",
        "synonym": ""
      },
      {
        "id": "a024-v06",
        "term": "Loudness",
        "definition": "How loud or soft speech is. What we hear as loudness can be measured as the intensity of a voice—when the intensity goes up, the perceived loudness goes up.",
        "example": "Our speech can be high or low (pitch), loud or soft (loudness), and fast or slow (duration).",
        "synonym": ""
      },
      {
        "id": "a024-v07",
        "term": "Duration",
        "definition": "How long or short speech is. The duration of speech is measured over time.",
        "example": "Our speech can be high or low (pitch), loud or soft (loudness), and fast or slow (duration).",
        "synonym": ""
      },
      {
        "id": "a024-v08",
        "term": "Cochlear Implant",
        "definition": "An electronic device that can bring back hearing for deaf individuals. It uses electrodes to send sound-like electrical signals to the auditory nerve directly.",
        "example": "Fortunately, a device called a cochlear implant can bring back some hearing for these listeners.",
        "synonym": ""
      }
    ],
    "source": {
      "publisher": "Frontiers for Young Minds",
      "url": "https://kids.frontiersin.org/articles/10.3389/frym.2021.698575",
      "authors": [
        "Marita K. Everhardt",
        "Anastasios Sarampalis",
        "Matt Coler",
        "Deniz Başkent",
        "Wander Lowie"
      ],
      "citation": "Everhardt MK, Sarampalis A, Coler M, Başkent D and Lowie W (2022) Speech Prosody: The Musical, Magical Quality of Speech. Front. Young Minds. 10:698575. doi: 10.3389/frym.2021.698575",
      "copyright": "Copyright © 2022 Everhardt, Sarampalis, Coler, Başkent and Lowie",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "adaptationNote": "Text adapted for reading practice: illustrations, figure pointers and reference markers omitted; glossary definitions retained. The original illustrated article is linked above."
    }
  },
  {
    "id": "a025",
    "slug": "with-a-little-help-from-friendshow-algae-help-corals-survive-temperature-stress",
    "title": "With a Little Help From Friends—How Algae Help Corals Survive Temperature Stress",
    "teaser": "Have you ever been in the ocean and admired the many fish living on the reef? Did you notice the colorful rock-like structures?",
    "category": "Science",
    "tags": [
      "biodiversity explore the collection",
      "science",
      "anemone",
      "algae",
      "symbiodiniaceae",
      "symbiosis"
    ],
    "readMinutes": 9,
    "publishedLabel": "New",
    "cover": {
      "theme": "ocean-teal",
      "icon": "Compass",
      "motif": "SCIENCE"
    },
    "blocks": [
      {
        "type": "lead",
        "text": "Have you ever been in the ocean and admired the many fish living on the reef? Did you notice the colorful rock-like structures? Those colorful rocks are actually animals called corals. Corals are the building blocks of reefs and provide homes for many marine species. However, corals are very sensitive to changes in the environment. Human impact has caused our oceans to become warmer. Corals are struggling to survive. But there is hope: some corals have learned to live in warm waters, such as the Red Sea, and in places with hot summers. This shows us that there is a chance for corals to survive. We studied Red Sea corals and found that they have adapted to warmer waters using specific mechanisms, and some help from their algae friends. By learning what makes some corals stronger, we can hopefully figure out a way to help the weaker corals."
      },
      {
        "type": "heading",
        "text": "The Sensitive Life of Corals"
      },
      {
        "type": "paragraph",
        "text": "Corals are invertebrate animals that belong to the same group as jellyfish and anemones. Corals have a bone-like skeleton that sets them apart from their other family members. Corals live together with small algae, called Symbiodiniaceae. The coral and algae help each other survive. This is known as living in symbiosis. The coral gives the algae protection and the algae gives the coral the energy to build a large skeleton."
      },
      {
        "type": "paragraph",
        "text": "When there are too many changes in the environment, the coral and algae get stress and cannot communicate well. They then stop helping each other and the algae will leave the coral. Because the beautiful colors of coral come from algae, when the algae leave, the coral turns white. This is what we know as coral bleaching. One of the main reasons for coral and algae breaking up is warmer temperatures. Warmer water temperatures stress out the coral and the algae and lead to bleaching. Climate change and other human impacts have increased ocean temperatures worldwide. Every year, coral reefs are experiencing hotter summers. How much heat can our coral reefs survive?"
      },
      {
        "type": "heading",
        "text": "Looking Inside Cells to Find Coral’s Secrets"
      },
      {
        "type": "paragraph",
        "text": "Before corals bleach, they do not show many other signs of feeling stressed. So, if we want to understand a coral’s health, we have to study its cells. Inside cells we have a lot of information, including DNA, RNA, and proteins. These molecules can help us find clues about the communication between the coral and the algae. But also, these molecules can teach us how to know when corals are stressed."
      },
      {
        "type": "paragraph",
        "text": "When an organism is stressed, every cell in its body will react. Everything will do its best to survive! In response to stress, the cell will use its DNA to make RNA, so that it can then make proteins that will fight off the stress. If an organism has been stressed before, it can respond to the stress faster and better. Think of it like visiting a city: the first time you visit, you will need a map to find your hotel. The more often you visit the city, the less you will need the map because you will remember, and you will get back to the hotel faster. Corals that have been in hot water before remember how to best survive. We can see this memory in the cells. The cells that have been stressed in the past will begin making different proteins and make the right proteins faster. So, they respond in a way that is different from corals that have never been in hot water before. Studying these difference lets us see what makes certain corals able to survive heat while others cannot."
      },
      {
        "type": "heading",
        "text": "Studying Corals That Are Good at Coping With Higher Temperatures"
      },
      {
        "type": "paragraph",
        "text": "Corals can have different resistance to warm temperatures. The environment the corals grow up in can influence their behavior. Many species of coral have learned to live in the world’s warmest waters, such as the Red Sea or the Arabian Gulf. This shows that corals are able to adapt to more stressful environments. To learn what makes some corals tougher than others, we used a model organism: the small sea anemone Aiptasia. Anemones are related to coral, but Aiptasia is easier to study than coral, because it grows fast and has no skeleton. We wanted to understand what allows some animals to deal better than others with warm temperatures. What do those animals do differently to survive the heat? For this we studied Aiptasia from different places around the world: North Carolina, Hawaii, and the Red Sea."
      },
      {
        "type": "paragraph",
        "text": "We took anemones from each location and kept them at the same temperature of 25°C for more than 1 year. Then, for some anemones, we slowly heated the water to 32°C. Anemones were heat stressed for 24 h. After that, we took cells from all anemones to compare their stress levels and responses. Studying the RNA and proteins in the anemones’ cells allowed us to compare how different anemones cope with temperature."
      },
      {
        "type": "heading",
        "text": "Removing Toxic Chemicals to Survive Heat Stress"
      },
      {
        "type": "paragraph",
        "text": "When organisms become stressed, they produce a number of toxic chemicals. Most of the time, each cell in the body can remove the chemicals before they become dangerous. Sometimes, especially when there is too much stress, cells will fail to remove the stress chemicals. Then, those chemicals will build up until they become toxic and cause serious damage to the cells. One common chemical that increases in response to stress is called reactive oxygen species (ROS)."
      },
      {
        "type": "paragraph",
        "text": "ROS is a normal side product of cellular respiration, which is scientific term for the way cells generate the energy they need to live. Stress increases the amount of energy generated by cells, which also increases the levels of ROS. Because too much ROS is so toxic, ROS has been linked to bleaching of the anemones, just like in corals. An even bigger problem is that the anemone not only has to deal with its own ROS, but also ROS from the algae that live with it. The algae can pass their ROS on to anemones. This increases the overall toxic level of ROS in the anemones. An anemone that can properly remove ROS even when it is stressed can cope better with high temperatures than anemones that have trouble removing ROS. We compared the ROS levels between our three anemones before and after heat stress. The Red Sea anemone had the lowest ROS levels. This result told us that Red Sea anemones can survive in the warm waters because they can remove toxic chemicals, like ROS, faster than other anemones can. Since anemones are related to corals, it is very likely that this process of removing toxic chemicals can keep corals healthy in warmer waters, too."
      },
      {
        "type": "heading",
        "text": "Algae Help Anemones Adapt to Temperature"
      },
      {
        "type": "paragraph",
        "text": "We know that the algae can pass ROS to anemones. So, the more stressed the algae are, the more stressed the anemone will be. In complex system like the coral reef, we cannot study one partner without the other."
      },
      {
        "type": "paragraph",
        "text": "We saw that the Red Sea anemones survived in warmer water because they were able to quickly remove toxic chemicals. Next, we needed to understand if the algae were helping the anemones or harming them. We measured the concentration of ROS produced by the algae when it was living inside the anemone vs. when it was living outside the anemone."
      },
      {
        "type": "paragraph",
        "text": "In the Red Sea anemones, we saw less ROS in the algae living both inside and outside of the anemones. This meant that the algae from the Red Sea were less stressed by the warm temperatures than were algae that lived with the anemones from North Carolina or Hawaii. By dealing with the stress better, the algae produced less ROS. That meant that less ROS was sent to the anemone, and so both organisms had fewer toxic chemicals to deal with, overall. The Red Sea anemone therefore experienced less stress than the anemones from the other regions. The levels of ROS from the algae in other anemones showed us that other algae are more sensitive to heat. We can see that algae can help the anemones, and therefore also corals, cope better with high temperatures."
      },
      {
        "type": "heading",
        "text": "Anemones and Algae Are in This Together"
      },
      {
        "type": "paragraph",
        "text": "Studying the response of both partners that are under stress, both anemones and algae, showed us how important each of them is to the other. If the algae do not cope well with the heat stress, the anemones will also suffer. Our results show us that the Red Sea anemones are not that different from the other anemones from cold water. Instead, they just get a little more help from their algae friends. We believe, since anemones and coral are related, that this result will hold true for corals, too. This shows how specific coral-algae partnerships can lead to a higher survival success for corals in warm water environments. By understanding the coral-algae relationship better, we can hopefully find ways to help coral reefs survive in the future."
      }
    ],
    "vocabulary": [
      {
        "id": "a025-v01",
        "term": "Anemone",
        "definition": "Is a close relative of corals. Anemones have a similar structures and lifestyle as corals but are squishier. Aiptasia is an anemone.",
        "example": "To learn what makes some corals tougher than others, we used a model organism: the small sea anemone Aiptasia.",
        "synonym": ""
      },
      {
        "id": "a025-v02",
        "term": "Algae",
        "definition": "A very simple, water-based plant, like seaweed.",
        "example": "We studied Red Sea corals and found that they have adapted to warmer waters using specific mechanisms, and some help from their algae friends.",
        "synonym": ""
      },
      {
        "id": "a025-v03",
        "term": "Symbiodiniaceae",
        "definition": "Is a type of algae.",
        "example": "Corals live together with small algae, called Symbiodiniaceae.",
        "synonym": ""
      },
      {
        "id": "a025-v04",
        "term": "Symbiosis",
        "definition": "The interaction or relationship between two different organisms living closely together, typically providing an advantage to both.",
        "example": "This is known as living in symbiosis.",
        "synonym": ""
      }
    ],
    "source": {
      "publisher": "Frontiers for Young Minds",
      "url": "https://kids.frontiersin.org/articles/10.3389/frym.2019.00028",
      "authors": [
        "Maha Joana Cziesielski",
        "Manuel Aranda"
      ],
      "citation": "Cziesielski MJ and Aranda M (2019) With a Little Help From Friends—How Algae Help Corals Survive Temperature Stress. Front. Young Minds. 7:28. doi: 10.3389/frym.2019.00028",
      "copyright": "Copyright © 2019 Cziesielski and Aranda",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "adaptationNote": "Text adapted for reading practice: illustrations, figure pointers and reference markers omitted; glossary definitions retained. The original illustrated article is linked above."
    }
  },
  {
    "id": "a026",
    "slug": "how-do-scientists-use-sound-to-count-fish-in-the-deep-sea",
    "title": "How do Scientists Use Sound to Count Fish in The Deep Sea?",
    "teaser": "Humans love to eat fish, but we must be careful not to catch too many. To make the right rules about how many fish can be caught without decreasing the population too much, it is helpful to know how many fish are in the sea.",
    "category": "Science",
    "tags": [
      "earth sciences explore the collection",
      "science",
      "sustainable",
      "transmitter",
      "receiver",
      "acoustic signal",
      "echogram"
    ],
    "readMinutes": 10,
    "publishedLabel": "New",
    "cover": {
      "theme": "ocean-teal",
      "icon": "Compass",
      "motif": "SCIENCE"
    },
    "blocks": [
      {
        "type": "lead",
        "text": "Humans love to eat fish, but we must be careful not to catch too many. To make the right rules about how many fish can be caught without decreasing the population too much, it is helpful to know how many fish are in the sea. It is difficult for scientists to go underwater to count fish, but technology can help. Animals like dolphins can use sound to “see” the world around them. Just like dolphins, scientists can send a sound into the ocean and measure the echo that comes back. They can even use the unique echoes of fish to get an idea of how many fish are in the sea. Scientists are now testing whether this technology can help them to explore the deep sea. While it is not always easy to see with sound, the challenges we face and the mistakes we make often lead to new discoveries!"
      },
      {
        "type": "heading",
        "text": "Are There Plenty of Fish in the Sea?"
      },
      {
        "type": "paragraph",
        "text": "Humans love to eat fish. We have become so good at catching them that we must be careful not to catch too many. We can protect the fish we like to eat by making rules about how many can be caught each year. If we leave enough fish behind, they will reproduce naturally so that there will be plenty to catch next time. If we have good rules to prevent overfishing, fish can be a valuable and sustainable food source."
      },
      {
        "type": "paragraph",
        "text": "To make the right rules about how many fish can be caught sustainably, it is important to know how many fish are in the sea. The ocean covers over 70% of the planet, so it is an enormous area to study. If you have ever looked at the ocean or a lake, you may have noticed that it is difficult to see far beneath the surface. For that reason, scientists have come up with methods to help them learn about the underwater world. For instance, they can catch fish with nets, they can scuba dive underwater, and they can ask fishers what they have caught. Sound is another tool scientists can use. But how can scientists use sound to “see” what is happening underwater?"
      },
      {
        "type": "heading",
        "text": "Looking With Our Ears: Using Sound to See"
      },
      {
        "type": "paragraph",
        "text": "Sound travels in waves of energy. Like a wave of water, sound can get reflected by a surface and travel in another direction. Think of an echo in a big empty room. The sound travels in waves away from the transmitter, which can be your voice or a loudspeaker. Sound becomes an echo when it reflects off something and travels back to a receiver, which can be your ears or a microphone. The sound that gets reflected back will not be a perfect copy of what you transmitted. Scientists call this an acoustic signal. Depending on the shape of the object, the echo will scatter in different ways, producing a different acoustic signal."
      },
      {
        "type": "paragraph",
        "text": "Some animals have learned how to use sound to “see” the world around them. For example, dolphins transmit high-pitched sounds as they navigate their way around the sea. They then listen to the returning echoes and their brains process the echoes into an image of the world around them. This helps dolphins to catch fish and avoid obstacles, even in pitch darkness."
      },
      {
        "type": "heading",
        "text": "“Disappearing” Sea Floors: How a Mistake Helped Scientists Learn to Use a New Technology"
      },
      {
        "type": "paragraph",
        "text": "Scientists have learned that, like dolphins, we can use sound to see objects underwater. Dolphins use their brains to process sound into a mental map. Our brains are not adapted to “seeing” with our ears, so we use technology to process sounds into images on paper or computers. We call these images echograms. The word “echogram” is a combination of the ancient Greek words for “sound” (echo) and “that is drawn” (-gram)—so, literally, an echogram is a “sound drawing.” The shapes and colors on echograms reflect the strength and location of an acoustic signal. These echograms help us to “see” the sea floor, hundreds of meters below."
      },
      {
        "type": "paragraph",
        "text": "Interpreting echograms takes a lot of experience and sometimes scientists make mistakes. For example, echograms were used to make ocean maps to help prevent ships from running aground on the seafloor. Sometimes an echogram would show that a part of the sea was shallow enough to be dangerous for boats. These shallow areas were marked on a map so that other boats could avoid them. However, another captain returning to the same area would find that the water was much deeper than the map showed. Scientists later learned that some areas that were mapped as having shallow sea floors actually contained dense layers of sea life, made up of fish and jellyfish. There was so much marine life in the water that the echo from all the animals together sounded the same as the echo from the sea floor! While scientists knew that they could use sound to locate fish in the water, they did not expect to find so many animals so close together. Luckily, mistakes in science can lead to new discoveries. In this case, scientists learned that what they thought was the sea floor was actually dense clusters of marine animals!"
      },
      {
        "type": "heading",
        "text": "How Is a Fish Like a Drum?"
      },
      {
        "type": "paragraph",
        "text": "Scientists are constantly improving the quality of their instruments and learning more about how to use acoustic technology to observe fish. While acoustic signals were first used to simply measure depth, modern echograms can return much more detailed information. Today, scientists can often tell what type of fish is in a school by interpreting the details of an echogram. Scientists can do this because of the unique biology of fish. Fish have many similar organs to humans such as eyes, a brain, stomach, liver, and kidneys. They also have some different ones that are adapted to their environment. Gills are one example, which help fish to breathe underwater. Another adaptation that they have is something called an air bladder (also called a swim bladder). This is a sack of air that helps fish control their depth in the water. If they fill up the air bladder, they will float closer to the surface, and if they release some of the gas, they will stay deeper underwater."
      },
      {
        "type": "paragraph",
        "text": "Air bladders reflect sound particularly well. Just like a drum, an air bladder is an empty space filled with air. When it is hit by a sound wave, the air bladder produces a strong echo. The strength of the echo depends on the size and shape of the air bladder. This is the same with drums: a small drum will produce a short, high-pitched sound, and a large drum will produce a long, low-pitched sound. As you know, different species of fish have different shapes and sizes. Luckily for scientists, the shapes and sizes of their air bladders are also different. This causes fish to produce unique echoes, which appear quite different on an echogram."
      },
      {
        "type": "paragraph",
        "text": "For this technique to work, scientists must match the acoustic signal in the echogram with a particular species of fish. They do this by catching a small number of the fish with nets and recording what the echogram looks like when sound is reflected off them. The next time they see a similar signal on the echogram, they will know which fish species are swimming below them in the water—without having to catch them in a net!"
      },
      {
        "type": "heading",
        "text": "Going Deeper: Using Sound to Explore the Mesopelagic Zone"
      },
      {
        "type": "paragraph",
        "text": "Scientists are interested in a deep part of the ocean known as the mesopelagic zone. This is the part of the ocean that is 200–1,000 m deep. Very little sunlight can penetrate the water at this depth. Because of the lack of light, it is sometimes referred to as the ocean’s “twilight zone.” Lots of fascinating creatures live there. However, because it is so difficult to reach, we do not know a lot about the mesopelagic zone of the ocean. To help imagine how deep the mesopelagic zone is, consider this: an Olympic swimming pool is 50 m long. To get to 1,000 m deep, you would have to swim 20 laps—straight down! This would take an average scientist around 45 minutes."
      },
      {
        "type": "paragraph",
        "text": "Luckily, sound travels much faster than a swimming scientist. Sound can get to 1,000 m and back in less than two seconds. Thanks to this, scientists can create lots of echograms telling them what is happening deep below their boats. This helps them to count how many fish live in the mesopelagic zone. Knowing how many fish are down there will be important in the future, if humans want to catch these fish."
      },
      {
        "type": "paragraph",
        "text": "As you have learned so far, it is not always easy to “see” using sound, especially not in the deep ocean. Trying to count fish here means overcoming many obstacles. For example, along with lots of fish, we can find siphonophores in the deep sea. Siphonophores are alien-looking animals similar to jellyfish. Like fish, they have air-filled organs that help them to move up and down in the water. Because of these organs, siphonophores produce echoes like those of fish. To tell the difference between fish and siphonophores in echograms, scientists need to collect more detailed acoustic signals. To do so, they work with engineers to try to develop new acoustic instruments."
      },
      {
        "type": "heading",
        "text": "Acoustic Technology Helps Us Maintain a Sustainable Ocean"
      },
      {
        "type": "paragraph",
        "text": "Acoustic technology uses sound to help scientists estimate how many fish are in the sea. This knowledge is important for governments and other decision-makers because it helps them to create rules about how many fish can be caught. Limiting the number of fish that can be caught has helped many fish species recover from overfishing in the past. Scientists are working to collect information about fish that live in the deep sea, so that we can avoid overfishing them in the first place. Seeing with sound, using acoustic technology, can help deep-sea fishing to be more sustainable from the very beginning!"
      }
    ],
    "vocabulary": [
      {
        "id": "a026-v01",
        "term": "Sustainable",
        "definition": "Able to be used in a way that makes a resource available for future generations.",
        "example": "If we have good rules to prevent overfishing, fish can be a valuable and sustainable food source.",
        "synonym": ""
      },
      {
        "id": "a026-v02",
        "term": "Transmitter",
        "definition": "Something that sends out sound, like a voice or a loudspeaker.",
        "example": "The sound travels in waves away from the transmitter, which can be your voice or a loudspeaker.",
        "synonym": ""
      },
      {
        "id": "a026-v03",
        "term": "Receiver",
        "definition": "Something that receives or listens to sound, like your ears or a microphone.",
        "example": "Sound becomes an echo when it reflects off something and travels back to a receiver, which can be your ears or a microphone.",
        "synonym": ""
      },
      {
        "id": "a026-v04",
        "term": "Acoustic Signal",
        "definition": "Sound that gets reflected back from an object.",
        "example": "Scientists call this an acoustic signal.",
        "synonym": ""
      },
      {
        "id": "a026-v05",
        "term": "Echogram",
        "definition": "Literally a “sound drawing;” a picture made by processing acoustic signals into an image.",
        "example": "The word “echogram” is a combination of the ancient Greek words for “sound” (echo) and “that is drawn” (-gram)—so, literally, an echogram is a “sound drawing.” The shapes and colors on echograms reflect the strength and location of an acoustic signal.",
        "synonym": ""
      },
      {
        "id": "a026-v06",
        "term": "Air Bladder",
        "definition": "A small organ that fish and siphonophores can fill with air, to help them float and move up and down in the water.",
        "example": "Another adaptation that they have is something called an air bladder (also called a swim bladder).",
        "synonym": ""
      },
      {
        "id": "a026-v07",
        "term": "Mesopelagic Zone",
        "definition": "The part of the ocean that is 200–1,000 m deep.",
        "example": "Scientists are interested in a deep part of the ocean known as the mesopelagic zone.",
        "synonym": ""
      }
    ],
    "source": {
      "publisher": "Frontiers for Young Minds",
      "url": "https://kids.frontiersin.org/articles/10.3389/frym.2021.598169",
      "authors": [
        "Alina M. Wieczorek",
        "Amanda Schadeberg",
        "David G. Reid"
      ],
      "citation": "Wieczorek AM, Schadeberg A and Reid DG (2021) How do Scientists Use Sound to Count Fish in The Deep Sea?. Front. Young Minds. 9:598169. doi: 10.3389/frym.2021.598169",
      "copyright": "Copyright © 2021 Wieczorek, Schadeberg and Reid",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "adaptationNote": "Text adapted for reading practice: illustrations, figure pointers and reference markers omitted; glossary definitions retained. The original illustrated article is linked above."
    }
  },
  {
    "id": "a027",
    "slug": "emperor-penguins-on-thin-sea-ice",
    "title": "Emperor Penguins on Thin Sea Ice",
    "teaser": "Emperor penguins are tough birds that breed on sea ice, which is the frozen surface of the ocean. They are famous for walking across the sea ice, to and from the open ocean, to get food for their chicks.",
    "category": "Science",
    "tags": [
      "biodiversity explore the collection",
      "science",
      "sea ice",
      "greenhouse gasses",
      "extinction",
      "rookery",
      "colony"
    ],
    "readMinutes": 10,
    "publishedLabel": "New",
    "cover": {
      "theme": "ocean-teal",
      "icon": "Compass",
      "motif": "SCIENCE"
    },
    "blocks": [
      {
        "type": "lead",
        "text": "Emperor penguins are tough birds that breed on sea ice, which is the frozen surface of the ocean. They are famous for walking across the sea ice, to and from the open ocean, to get food for their chicks. Their bodies and behaviors help them live in the cold, dark winters of Antarctica. However, though they live far away from people, human actions are not always good for emperor penguins. Humans are causing the world to warm. With warmer temperatures, sea ice around Antarctica will melt. For emperor penguins, this means their homes might disappear. We know so much about emperor penguins because scientists and explorers have been studying them for over 70 years. In this article, we will tell you about what is likely to happen to emperor penguins—and what their future can tell us about our own future."
      },
      {
        "type": "heading",
        "text": "Living on Sea Ice: A Vital Habitat Under Threat"
      },
      {
        "type": "paragraph",
        "text": "Emperor penguins breed on sea ice, which is the frozen surface of the ocean. These birds are specialized to survive in cold conditions that would be too harsh for humans. Emperor penguins have some specific requirements. If there is not enough sea ice, they do not have a place to live. If there is too much sea ice, they have a long walk to get to the open ocean, where they hunt for food for themselves and their chicks. So, the sea ice must be just right for emperor penguins to live, get food, and raise their chicks."
      },
      {
        "type": "paragraph",
        "text": "We know the world is getting warmer and that there might be less sea ice for emperor penguins in the future. The world is warming because humans are producing greenhouse gasses (such as carbon dioxide) that trap the sun’s heat near the Earth. Greenhouse gasses come from human activities such as burning oil, gas, and coal. The faster the world warms, the less likely emperor penguins are to have sea ice. Will Emperor penguins march to extinction?"
      },
      {
        "type": "heading",
        "text": "Surviving the Unimaginable"
      },
      {
        "type": "paragraph",
        "text": "About 250 years ago James Cook, a captain in the British Navy, was sailing around the world. He and his crew may have been the first people to see emperor penguins. What we know for sure is that later, someone noticed that emperor penguins were a different species than king penguins. In the early part of the 1900s, Robert Falcon Scott, another captain in the British Navy, sailed to Antarctica. He found the first rookery of emperor penguins. Now, using pictures of the world taken from satellites in space, we know that there are 61 colonies of emperor penguins in Antarctica."
      },
      {
        "type": "paragraph",
        "text": "Even though we have been studying emperor penguins for about 100 years, we still have a lot to learn. These penguins live in dangerous places, and that makes them hard to study. But that has not stopped people from trying. Around 70 years ago, two famous scientists, Bernard Stonehouse and Jean Prévost, visited Antarctica to study emperor penguins. These scientists learned how important sea ice is to these penguins. In the winter when it gets cold, the surface of the ocean freezes. These icy spots on the sea are where emperor penguins gather in special groups to take care of their baby chicks. Those areas are called rookeries or colonies. After forming colonies, the emperor penguins choose their mates in March/ April. The females lay one egg each in May or early June, and the males keep the eggs warm by holding them on the tops of their feet. Males do this for nearly 3 months—and it is not easy! Wintertime in Antarctica is dangerously cold and stormy—temperatures can get down to -50°C, and winds can blow at over 150 km per hour. The males must huddle together to keep warm and to survive. The penguins take turns being in the middle of the huddle, where temperatures can reach 37°C. The penguin dads keep the eggs warm and cozy while the mommies search for food."
      },
      {
        "type": "paragraph",
        "text": "When the females have eaten enough squid, fish, and krill (shrimp-like creatures), they come back to feed the newborn chicks. The males, which have not eaten in 4 months, are starving by this time. The females take over keeping the chicks warm, while the males search for their own food. Then, mommy and daddy penguins take turns feeding their chick, so the chicks grow up fast and strong. In early spring, the chicks are twice as big as when they hatched, and they can be left on their own. Chicks huddle together to keep warm and to defend each other against other birds species that might attack them, while the parents search for food for a few days at a time. It is hard work raising an emperor penguin chick! Chicks must grow enough to get their waterproof adult feathers before the sea ice melts away for the year. The soft, fluffy feathers the chicks have when they are born are not waterproof, so if chicks get wet, they can freeze. From early November, chicks begin to get their adult feathers, and they leave the colony in early summer, from December to January. Without their parents, the chicks hang out together on the ice."
      },
      {
        "type": "heading",
        "text": "Troubling Trends"
      },
      {
        "type": "paragraph",
        "text": "Even though emperor penguins are difficult to study, we have a few clues from a colony found at Pointe Géologie, where they have been studied for a long time. This is where the movie March of the Penguins was filmed! There is a mystery at Pointe Géologie. In the 1970s, the number of emperor penguins decreased from about 12,000 birds to about 6,000 birds. Scientists think that many of the adults were dying, and the sea ice was a clue to this mystery. More males died when there was not enough sea ice. Emperor penguins eat animals that live under the sea ice (fish, squid, and krill), and less sea ice probably meant less food. Males need more food than females because they go without eating for 4 months during winter."
      },
      {
        "type": "paragraph",
        "text": "Another mystery is that the population of emperor penguins at Pointe Géologie has not yet returned to 12,000 birds. Scientists observed that, in years with too much sea ice, fewer chicks survived. Too much sea ice means penguins must travel longer distances to reach open water, where they can find food. So, there is a sea-ice “Goldilocks zone.” Too much sea ice means adults take too long to get food, so both adults and chicks may starve. Not enough sea ice means less food for penguins, and chicks may not grow their waterproof feathers before the sea ice melts away."
      },
      {
        "type": "paragraph",
        "text": "Today, Antarctica is changing because of greenhouse gasses. Warmer temperatures around the world will cause the sea ice to melt and break up earlier in the spring. Scientists have created computer models to see what would happen to emperor penguin populations if these penguins have less ice to live on. If we do not change the way we make and use energy, penguins at Pointe Géologie will be at risk of extinction by 2100."
      },
      {
        "type": "paragraph",
        "text": "Scientists want to see what will happen to all other emperor penguin colonies, too. Some colonies, such as those in the Ross Sea, might be OK in the future because sea ice declines are less severe at those locations. Sadly, if we continue to put greenhouse gases into the air, all emperor penguin colonies will probably decrease by the year 2100. If we keep warming the air, the temperatures around the world will be much higher than we want them to be (increase of 4.3°C above the temperature in 1850), and most emperor penguin colonies will disappear. If we can limit global warming to only 1.5°C, emperor penguins will still exist in Antarctica by 2100."
      },
      {
        "type": "paragraph",
        "text": "Recently, scientists wondered what would happen to emperor penguin colonies if extreme weather events happened. For example, at Halley Bay, an estimated 10,000 chicks or more died in one year because of very low sea ice. Halley Bay was the world’s second- largest emperor penguin colony before this extreme event. Scientists can observe these rare extreme weather events using satellites. At Halley Bay, such satellite images showed that, in 2016, the sea ice broke up early, before the chicks could swim. By better understanding how extreme weather events affect penguins, scientists now think that 98% of colonies will be disappear by 2100 if we do not control greenhouse gas emissions—this means that almost all the emperor penguins in the world will be gone. Emperor penguins will only stand a chance if greenhouse gas emissions are slowed from their current course."
      },
      {
        "type": "paragraph",
        "text": "Satellite images have also helped us understand how colonies might change as penguins move from one spot to another. Does moving between homes mean penguins could find new places to live as the sea ice melts? Scientists initially thought that penguins might leave places that were not good homes and would search for better locations so they could survive. But sadly, it seems that moving between homes does not help, and emperor penguins will still face a risk of extinction if we do not stop releasing greenhouse gasses."
      },
      {
        "type": "heading",
        "text": "Living on Thin Ice"
      },
      {
        "type": "paragraph",
        "text": "Emperor penguins cannot change the way they live fast enough to deal with climate change. So, to save them, humans should reduce greenhouse gas emissions. If we can keep the increase in air temperature around the world to <1.5°C, emperor penguins will have a better chance of surviving. In 2015, people from 195 countries met in Paris, France and agreed to limit global warming to well below 2°C. This meeting led to a legal document known as the Paris Agreement. This agreement represents the first time that all nations have joined the common cause to fight climate change. Governments must take actions now to reduce greenhouse gas emissions, to protect the Earth and its species for today’s and future generations. You can find out more about whether governments are meeting the 1.5°C Paris Agreement by looking at the Climate Action Tracker."
      },
      {
        "type": "paragraph",
        "text": "Climate change affects everyone. Today, emperor penguins serve as a signal to show us whether we are effectively controlling greenhouse gas emissions. They can tell us if we are in danger. We are all on thin ice. The future of emperor penguins, humans, and all other life on Earth as we know it depends upon the decisions we make today."
      }
    ],
    "vocabulary": [
      {
        "id": "a027-v01",
        "term": "Sea Ice",
        "definition": "Sea ice is frozen water that forms on the surface of the ocean. It is like a big icy blanket that covers parts of the sea when the weather gets really cold. Sea ice is important because it gives some animals a place to rest and hunt, and it also affects the weather and the whole Earth’s environment.",
        "example": "Emperor penguins are tough birds that breed on sea ice, which is the frozen surface of the ocean.",
        "synonym": ""
      },
      {
        "id": "a027-v02",
        "term": "Greenhouse Gasses",
        "definition": "Gasses like carbon dioxide that trap the sun’s heat in Earth’s atmosphere, like a blanket of gasses that surrounds our planet and heats it up.",
        "example": "The world is warming because humans are producing greenhouse gasses (such as carbon dioxide) that trap the sun’s heat near the Earth.",
        "synonym": ""
      },
      {
        "id": "a027-v03",
        "term": "Extinction",
        "definition": "The end of a species’ existence on Earth. Once a species becomes extinct, no more individuals exist and it is gone forever.",
        "example": "Will Emperor penguins march to extinction?",
        "synonym": ""
      },
      {
        "id": "a027-v04",
        "term": "Rookery",
        "definition": "A breeding colony or nesting area of birds, particularly seabirds. It is a location where birds gather in significant numbers to build nests, lay eggs, raise their young (chicks), and engage in various reproductive activities. The term is commonly used in the context of penguins, seals, and other marine birds and mammals.",
        "example": "He found the first rookery of emperor penguins.",
        "synonym": ""
      },
      {
        "id": "a027-v05",
        "term": "Colony",
        "definition": "Animals living together for mutual benefit, such as stronger defense against predators. For emperor penguins, living in colonies is a great defense against the cold and wind.",
        "example": "From early November, chicks begin to get their adult feathers, and they leave the colony in early summer, from December to January.",
        "synonym": ""
      },
      {
        "id": "a027-v06",
        "term": "Computer Models",
        "definition": "Computer-based versions of a natural system, which scientists can use to understand the system and the way that various factors might change the system in the future.",
        "example": "Scientists have created computer models to see what would happen to emperor penguin populations if these penguins have less ice to live on.",
        "synonym": ""
      },
      {
        "id": "a027-v07",
        "term": "Paris Agreement",
        "definition": "A plan to reduce greenhouse gas emissions to limit the average global temperature increase. It was signed by 195 nations that agreed to the importance of fighting climate change.",
        "example": "This meeting led to a legal document known as the Paris Agreement.",
        "synonym": ""
      }
    ],
    "source": {
      "publisher": "Frontiers for Young Minds",
      "url": "https://kids.frontiersin.org/articles/10.3389/frym.2023.1052262",
      "authors": [
        "Stephanie Jenouvrier",
        "Michelle La Rue",
        "Philip Trathan",
        "Christophe Barbraud"
      ],
      "citation": "Jenouvrier S, La Rue M, Trathan P and Barbraud C (2023) Emperor Penguins on Thin Sea Ice. Front. Young Minds. 11:1052262. doi: 10.3389/frym.2023.1052262",
      "copyright": "Copyright © 2023 Jenouvrier, La Rue, Trathan and Barbraud",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "adaptationNote": "Text adapted for reading practice: illustrations, figure pointers and reference markers omitted; glossary definitions retained. The original illustrated article is linked above."
    }
  },
  {
    "id": "a028",
    "slug": "the-rise-and-fall-of-continents",
    "title": "The Rise and Fall of Continents",
    "teaser": "Continents are constantly moving, and sometimes they collide. When continents collide, they crumple, and thicken.",
    "category": "Science",
    "tags": [
      "earth sciences",
      "science",
      "continent",
      "continent collision",
      "metamorphic rock"
    ],
    "readMinutes": 9,
    "publishedLabel": "New",
    "cover": {
      "theme": "forest-emerald",
      "icon": "Compass",
      "motif": "SCIENCE"
    },
    "blocks": [
      {
        "type": "lead",
        "text": "Continents are constantly moving, and sometimes they collide. When continents collide, they crumple, and thicken. Mountain ranges form in this “crash zone.” Deep rocks at the bottom of a crash zone are hot because they are so deep. Hot materials—even rocks—become weak. Hot rocks deep underground can move by flowing, even though they are mostly solid. First, they flow sideways and then upwards in large blobs. When upward-moving blobs are only a few kilometers below the surface of the Earth, they cool and harden into bell shapes (domes). Flowing rocks cause the crash zone to collapse and spread out. Continents go back to their pre-collision thickness. They are not exactly the same as before collision, though: some rocks that used to be at the bottom of the continents are now at the top! We can see these formerly deep parts of continents in rock domes all over the world."
      },
      {
        "type": "heading",
        "text": "Crashing Continents"
      },
      {
        "type": "paragraph",
        "text": "Recent research has proposed that many rocks that we see on the outermost surface of continents used to be deep underground. How did they get to the surface—that is, the part of the Earth that we live on? What can we learn from these rocks about the formation of continents and mountain ranges?"
      },
      {
        "type": "paragraph",
        "text": "To answer these questions, we must first understand what happens when continents collide with each other. The continents slowly move around the planet as part of tectonic plates. Sometimes continents collide with each other. Continent collision forms large mountain ranges in the “crash zones” where the two continents impact each other. Away from crash zones, continents are about 30 kilometers thick. In crash zones such as the Himalayas, the crust is more than 70 kilometers thick. Continents double in thickness in crash zones!"
      },
      {
        "type": "paragraph",
        "text": "Now let us consider what happens in the deep parts of the crash zones of colliding continents."
      },
      {
        "type": "heading",
        "text": "Rocks Under Pressure"
      },
      {
        "type": "paragraph",
        "text": "Temperature increases with depth inside the Earth. Why? Because the center of the Earth is extremely hot, and the surface of the Earth is much cooler. In between, temperatures are cooler near the surface and hotter in the deeper parts. So, the rocks in the deep underground parts of crash zones are much hotter than the outermost parts of the Earth that we walk around on. The rocks in the deep parts of crash zones are also under a lot of pressure from the weight of all the rocks above them. This type of deep, hot rock is called metamorphic rock."
      },
      {
        "type": "paragraph",
        "text": "Metamorphism means change. Metamorphic rocks are rocks that have changed by being heated and pressed. That is exactly what happens in crash zones: rocks are buried (pressed) and heated. Many buildings have metamorphic rocks on their walls, floors, countertops, and columns. So, you may not have to travel very far to see some beautiful metamorphic rocks. Some examples of metamorphic rocks and their starting materials are:"
      },
      {
        "type": "paragraph",
        "text": "• slate: metamorphosed shale or mudstone;"
      },
      {
        "type": "paragraph",
        "text": "• marble: metamorphosed limestone; and"
      },
      {
        "type": "paragraph",
        "text": "• quartzite: metamorphosed sandstone."
      },
      {
        "type": "heading",
        "text": "Why Are Metamorphic Rocks Interesting to Study?"
      },
      {
        "type": "paragraph",
        "text": "There are practical reasons why it is important and interesting to study the composition and conditions of metamorphic rocks. How hot and how deep the rocks were affects which minerals form. Minerals in metamorphic rocks are used for building materials, technologies (computers, phones), and many other things. Understanding how and where metamorphic rocks formed also helps us figure out how the planet works. We will explore this aspect in the rest of the article."
      },
      {
        "type": "paragraph",
        "text": "Metamorphism occurs at temperatures hotter than even the very hottest day on the surface of the Earth. And, as you have learned, it occurs underground. So, when we see metamorphic rocks at the Earth’s surface, we know that they have moved and cooled down. This raises a lot of questions about what happened to the rocks before they got to the Earth’s surface. Geologists study metamorphic rocks to answer questions such as: How deep were the rocks at their very deepest and how hot did they get? When were the rocks deep underground and when did they get to the Earth’s surface? How quickly did they move (flow) from deep underground to the surface? How far can rocks travel underground? Why do metamorphic rocks flow? And how much of the continent used to be at great depth but is now exposed at Earth’s surface?"
      },
      {
        "type": "paragraph",
        "text": "These questions can be answered by identifying the minerals that make up the rocks and analyzing the amounts of the various elements they contain. For example, in some minerals, the ratio of iron and magnesium is an indicator of how hot the rocks were during metamorphism. The ratio of uranium and lead in some minerals is an indicator of age. From these methods, we know that many metamorphic rocks at the Earth’s surface today came from the very deepest and hottest parts of continents. So, we have an answer to the “how deep” question: some rocks now at the Earth’s surface came from near the base of the thickest regions of continental crash zones: approximately 70 kilometers down. We also know the answer to the “how hot” question. Knowing the temperature is important because it helps us understand where the rocks were and how weak they were. That tells us how far the rocks could have flowed. Some metamorphic rocks reached temperatures of 800°C. This is hot enough for most types of rocks to start to melt."
      },
      {
        "type": "heading",
        "text": "Rocks in Motion"
      },
      {
        "type": "paragraph",
        "text": "Hot rocks are weak and can move by flowing. These hot rocks are not lava; they move as mostly solid rock. They may have a small amount of melted rock in them, which makes the rocks even weaker and helps them flow. Why do they move? Imagine what would happen if you made a big pile of something weak like jam or porridge. It would flow out and away from the pile. Something similar happens with thick crash zones that have hot, weak rocks under them. Some of the flow of hot rocks is sideways, that is, it stays at about the same depth. Some of the flow is upward. Rocks can flow upward if they are less dense than the rocks around them. Hot rocks can flow very fast —for rocks. “Fast” for metamorphic rocks is very slow for a human. A metamorphic rock that moves a centimeter or two in a year is racing along!"
      },
      {
        "type": "heading",
        "text": "Rock Domes: Clues to Flowing Rocks"
      },
      {
        "type": "paragraph",
        "text": "Hot rocks flow upward in large blobs toward the outer surface of the Earth. To picture these blobs of rock, imagine the rising blobs in a lava lamp or giant balloons floating upwards. When hot rocks flow upwards in blobs, the blobs do not flow all the way to the Earth’s surface. They cool down too much when they start to get near the surface. When they get too cold, they cannot flow anymore. However, the rising blobs can get within a few kilometers of the Earth’s surface. With time, erosion wears away the soil and rock on top of the rock blobs. Then we can finally see them!"
      },
      {
        "type": "paragraph",
        "text": "The domes of rocks that we see on the Earth’s surface are called gneiss domes. Gneiss, pronounced “nice,” is a very common kind of metamorphic rock that experiences a lot of heat and pressure. “Dome” refers to the blob shape that forms as the gneiss flows upward. Gneiss domes can be seen in continents all over the world. They contain clues about what happens deep underground when continents collide and form large mountain ranges."
      },
      {
        "type": "paragraph",
        "text": "One way to study the deep parts of continents is to find places where these rock blobs have flowed upwards and been exposed. This allows us to see rocks that formed deep underground where continents collided to form mountain ranges. We have learned a number of things from gneiss domes—here are just a few. First, many rocks at the surface of continents today were originally very deep underground. Second, gneiss domes may not look dome-shaped if erosion has carved the land surface into peaks and valleys. However, geologists can still recognize gneiss domes by looking at how rock layers are tilted away from each other to form a dome. Third, we have learned that the rocks in some gneiss domes flow upwards from near the base of a continent to near the surface. They travel upward for nearly the entire thickness of a continent—from approximately 70 kilometers to within a few kilometers of the Earth’s surface! Finally, before the rocks in gneiss domes flow upward, they may flow horizontally in large sheets for tens to hundreds of kilometers. Picture a wide and deep underground river of flowing rock."
      },
      {
        "type": "heading",
        "text": "Summary"
      },
      {
        "type": "paragraph",
        "text": "Metamorphic rocks are the key to learning what happens in the deep parts of the collision zones between continents. Recent studies show that rocks that used to be deep underground and very hot moved rapidly in blobs toward the Earth’s surface. The blobs flowed as mostly solid rock. In many places around the world today, we can see these blobs as domes made of metamorphic rocks. They have traveled very far from deep underground. Rock (gneiss) domes help us understand how deep rocks get to the Earth’s surface. By studying gneiss domes, we can understand how continents form and change with time."
      }
    ],
    "vocabulary": [
      {
        "id": "a028-v01",
        "term": "Continent",
        "definition": "A large region of land above sea level; there are six continents today but there have been many different continents in the past.",
        "example": "Continent collision forms large mountain ranges in the “crash zones” where the two continents impact each other.",
        "synonym": ""
      },
      {
        "id": "a028-v02",
        "term": "Continent Collision",
        "definition": "When two continents move toward each other and smash together, forming a mountain range.",
        "example": "Continent collision forms large mountain ranges in the “crash zones” where the two continents impact each other.",
        "synonym": ""
      },
      {
        "id": "a028-v03",
        "term": "Metamorphic Rock",
        "definition": "A type of rock that forms at temperatures and pressures higher than those found at the Earth’s surface; metamorphism occurs in solid rocks, without melting.",
        "example": "This type of deep, hot rock is called metamorphic rock.",
        "synonym": ""
      }
    ],
    "source": {
      "publisher": "Frontiers for Young Minds",
      "url": "https://kids.frontiersin.org/articles/10.3389/frym.2023.1114471",
      "authors": [
        "Donna L. Whitney",
        "Jonas Vanardois",
        "Jennifer M. Taylor",
        "Christian Teyssier"
      ],
      "citation": "Whitney DL, Vanardois J, Taylor JM and Teyssier C (2023) The Rise and Fall of Continents. Front. Young Minds. 11:1114471. doi: 10.3389/frym.2023.1114471",
      "copyright": "Copyright © 2023 Whitney, Vanardois, Taylor and Teyssier",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "adaptationNote": "Text adapted for reading practice: illustrations, figure pointers and reference markers omitted; glossary definitions retained. The original illustrated article is linked above."
    }
  },
  {
    "id": "a029",
    "slug": "freezing-in-the-sun",
    "title": "Freezing in the Sun",
    "teaser": "When the air is very cold, water at the surface of the ocean freezes, forming sea ice. Parts of the Arctic Ocean are covered by sea ice during the entire year.",
    "category": "Science",
    "tags": [
      "earth sciences explore the collection",
      "science",
      "sea ice",
      "brine pockets",
      "photosynthesis",
      "molecules"
    ],
    "readMinutes": 10,
    "publishedLabel": "New",
    "cover": {
      "theme": "forest-emerald",
      "icon": "Compass",
      "motif": "SCIENCE"
    },
    "blocks": [
      {
        "type": "lead",
        "text": "When the air is very cold, water at the surface of the ocean freezes, forming sea ice. Parts of the Arctic Ocean are covered by sea ice during the entire year. Often, snow falls onto the sea ice. Despite the cold, many plants and animals can live in the Arctic Ocean, some in the water, and some even in the sea ice. Particularly, algae can live in small bubbles in the sea ice. Like other plants, algae need energy to grow. This energy comes from food and sunlight. But how can the sunlight reach these little algae living inside the sea ice? From the sun, the light must pass through the atmosphere, the snow, and finally the sea ice itself. In this article, we describe how ice algae can live in this special environment and we explain what influences how much light reaches the algae to make them grow."
      },
      {
        "type": "heading",
        "text": "Sea Ice: The House of Algae"
      },
      {
        "type": "paragraph",
        "text": "If you think about an ice cube, like the ones in a cold drink in summer, you can hardly believe that something could live inside it. But the sea ice, which is ice formed from freezing sea water, can indeed be the home for little organisms. How is this possible, and where do these organisms live? Ocean water contains both salt and algae. When the water freezes, some of these salt grains, and some algae, remain trapped in the ice. The salt grains melt some of the ice around them and create little bubbles filled with salty water. These bubbles are called brine pockets. The brine pockets can be up to 5 mm in size, the diameter of a pencil, and they grow larger during the spring and summer seasons. Since algae are smaller than 1 mm, they can comfortably live inside the brine pockets. As the sea ice grows thicker, the brine pockets are pushed toward the bottom of the sea ice. Thus, algae live mainly in the bottom layer of the sea ice."
      },
      {
        "type": "heading",
        "text": "How Big is Algae’s House?"
      },
      {
        "type": "paragraph",
        "text": "An ice cube in your drink is relatively small; you can easily take it in your hand. But how big is sea ice? Sea ice covers large parts of the Arctic Ocean. It starts to form in autumn, when the air gets increasingly colder, and it reaches its maximum extent in late winter (February to March). The sea ice starts to decrease its extent again in late spring when the sun warms up the atmosphere and the surface of the ice, causing the ice to melt. We can imagine sea ice as a large blanket covering the Arctic Ocean. This blanket gets larger when it is cold and shrinks again when it is warmer. The sea ice also becomes thicker in winter and thinner again in summer. Sometimes the ice wrinkles and it can also break into pieces of varying sizes, from small pieces with a diameter of just a few meters up to large pieces of several kilometers. In winter the ice is the thickest, the blanket is the largest, and the most wrinkles are present."
      },
      {
        "type": "paragraph",
        "text": "The extent of sea ice in winter can reach 14 million km2, an area of about 2 billion football fields, and it can easily be 2 m thick, same as the height of a basketball player. When it crumples, the ice can create wrinkles that are 3 or 4 m high above the water and that reach down 10–15 m into the water. Moreover, in winter, snow accumulates on top of the sea ice. The snow is usually 20–30 cm thick. If you imagine the Arctic sea ice as a house inhabited by algae, the algae would live in the basement, at the bottom of the sea ice, often covered by a “roof” of snow."
      },
      {
        "type": "heading",
        "text": "Algae Need to Eat… and to be Eaten"
      },
      {
        "type": "paragraph",
        "text": "Having a house, of course, is not all that algae need to live; they also need food. Algae are plants, so they need sunlight and carbon to perform photosynthesis, to create the energy they need to grow. Carbon is usually contained in sea water, so each brine pocket has a bit of carbon that can be used by the algae. What about sunlight? In the Arctic during the summer, days become so long that there is no night for about 2 months. On the other hand, in winter, the nights are so long that there is no light at all. Thus, algae can grow only in summer, when there is sunlight, and they die in winter, when it is dark. Dead algae are broken down and their nutrients are recycled, the same way plants that grown on land are. Algae are important because they are food for animals. As on land, the ocean is populated by small animals that eat plants. These animals are similar to shrimps or insects, but very small. The animals that eat plants are then eaten by bigger animals, like fish. Fish are eaten by birds and seals, which are then eaten by the biggest predator in the Arctic: the polar bear. Thus, sea-ice algae are important in the Polar regions because they are the first link in the Arctic marine food chain."
      },
      {
        "type": "heading",
        "text": "A Long Way From the Sun to the Earth"
      },
      {
        "type": "paragraph",
        "text": "The light that we receive every day on the Earth originates from the Sun, our very own star. This light, which is sent permanently by the Sun in the form of rays, has to make a long journey through the solar system to reach the Earth. Once the sun rays reach our planet, they still need to get through the atmosphere before they can provide us with energy and warm us up. The atmosphere is the huge layer of air around the Earth’s surface that allows us to breathe. It is composed of a lot of tiny molecules of different gases. When the sun’s rays cross the atmosphere, some of them are reflected back into space by the gas molecules and also by the little water droplets that form the clouds. Other rays are absorbed by the particles. So, only a little more than half of the sun’s rays (~55%) will reach the Earth’s surface."
      },
      {
        "type": "heading",
        "text": "The Difficult Journey of Sunlight Through the Sea Ice"
      },
      {
        "type": "paragraph",
        "text": "We learned that algae live at the bottom of sea ice, which can be covered by snow. We also learned that, as plants, algae need sunlight to grow. But how is the sunlight capable of making it through the thick ice and snow to finally reach the little algae, to give them energy? The layer of snow is made of a large number of snowflakes packed together. Most of the sunlight that hits the snow is reflected back to the atmosphere, because the snow almost acts like a mirror. This is why it is always hard to look at the bright snow when the sun shines. Just like in the atmosphere, some of the sunlight is absorbed by the snowflakes, warming up the snow and contributing to its melting. It is much more difficult for the sunlight to pass through snow than to pass through the atmosphere though, because the snowflakes are more densely packed than the tiny gas molecules in the atmosphere. However, some rays find their way through. Those sun rays that make it through the snow layer will then encounter the sea ice below. Sea ice is ten times easier for the sun rays to cross than the snow is, since the ice is usually clearer than snow, with fewer particles and no snowflakes. But the sea ice is usually thicker than the snow, which again makes it harder for the sunlight to reach the algae’s living place. Eventually, some of the sun’s rays reach the bubbles where the algae live, making it possible for the algae to enjoy a bit of sunlight. But that is not the end! Once the sun’s rays have filled the algae with energy, some leftover rays continue their journey deeper into the ocean water, giving their energy to other plants and animals until all the light rays are used up."
      },
      {
        "type": "heading",
        "text": "What About the Future of Algae?"
      },
      {
        "type": "paragraph",
        "text": "Many activities that we do as humans have led to pollution, resulting in a heating of the atmosphere called climate change or climate warming. Climate warming can already be measured today and will continue for a long time into the future. It is important for us to understand what this warming will mean for the different regions of the planet, including the Arctic. As it turns out, the Arctic is warming faster than the rest of planet, leading to less snow cover and thinner sea ice. As a consequence, it is easier for the sunlight to find its way through the ice to reach the algae. For the algae, this means that, in the future, there will most likely be more light available, and thus more energy to use to grow. But, scientists from all around the world have calculated that, sometime in the future, the sea ice will very likely disappear completely each summer. If the sea ice disappears each summer, there will be no housing for the sea-ice algae to live in. This means that climate change is a big threat to sea-ice algae."
      },
      {
        "type": "paragraph",
        "text": "Arctic research tries to understand the consequences of climate change for the Arctic, the atmosphere, the sea ice, the ocean, the plants and animals, and the humans. Our focus is on the sea-ice algae and the place they live, which is the sea-ice cover of the Arctic Ocean. We tell many people about our work and what we have discovered about the changes in the Arctic, so that people, including politicians, can have a better idea of what is happening now and what might happen in future. This knowledge will help us to make the proper decisions for the future of our planet."
      }
    ],
    "vocabulary": [
      {
        "id": "a029-v01",
        "term": "Sea Ice",
        "definition": "Frozen ocean water.",
        "example": "When the air is very cold, water at the surface of the ocean freezes, forming sea ice.",
        "synonym": ""
      },
      {
        "id": "a029-v02",
        "term": "Brine Pockets",
        "definition": "Small bubbles of salty water inside the sea ice.",
        "example": "These bubbles are called brine pockets.",
        "synonym": ""
      },
      {
        "id": "a029-v03",
        "term": "Photosynthesis",
        "definition": "A process by which plants use sunlight to produce food and energy.",
        "example": "Algae are plants, so they need sunlight and carbon to perform photosynthesis, to create the energy they need to grow.",
        "synonym": ""
      },
      {
        "id": "a029-v04",
        "term": "Molecules",
        "definition": "Very small particles that are the material from which every solid, liquid, or gaseous material is made.",
        "example": "It is composed of a lot of tiny molecules of different gases.",
        "synonym": ""
      }
    ],
    "source": {
      "publisher": "Frontiers for Young Minds",
      "url": "https://kids.frontiersin.org/articles/10.3389/frym.2020.509101",
      "authors": [
        "Giulia Castellani",
        "Gaelle Veyssiere",
        "Frank Kauker",
        "Michael Karcher",
        "Julienne Stroeve",
        "Jeremy P. Wilkinson",
        "Hauke Flores",
        "Marcel Nicolaus"
      ],
      "citation": "Castellani G, Veyssiere G, Kauker F, Karcher M, Stroeve J, Wilkinson JP, Flores H and Nicolaus M (2020) Freezing in the Sun. Front. Young Minds. 8:509101. doi: 10.3389/frym.2020.509101",
      "copyright": "Copyright © 2020 Castellani, Veyssiere, Kauker, Karcher, Stroeve, Wilkinson, Flores and Nicolaus",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "adaptationNote": "Text adapted for reading practice: illustrations, figure pointers and reference markers omitted; glossary definitions retained. The original illustrated article is linked above."
    }
  },
  {
    "id": "a030",
    "slug": "does-the-heart-age-faster-in-space",
    "title": "Does the Heart Age Faster in Space?",
    "teaser": "Living in space is not as simple as living on Earth. The environment in space is harmful for humans.",
    "category": "Science",
    "tags": [
      "astronomy and physics explore the collection",
      "science",
      "radiation",
      "organoid",
      "stem cells",
      "differentiation",
      "bioink"
    ],
    "readMinutes": 9,
    "publishedLabel": "New",
    "cover": {
      "theme": "slate-azure",
      "icon": "Rocket",
      "motif": "SCIENCE"
    },
    "blocks": [
      {
        "type": "lead",
        "text": "Living in space is not as simple as living on Earth. The environment in space is harmful for humans. Astronauts experience weightlessness and are exposed to dangerous radiation. On top of that, astronauts live in a tiny area, far from their loved ones. All our organs are harmed by these factors. The heart, for example, starts to age much quicker in space than on Earth. This means that astronauts have a higher risk of heart disease after going to space. It is therefore important that we investigate why this happens so that we can prevent it. In the past, these studies were based on experiments using animals or humans. Today, we can create mini-hearts in the lab for our experiments instead. In this article, we will explain how we make mini-hearts and how they help us understand and prevent the heart’s aging in space."
      },
      {
        "type": "heading",
        "text": "Space Ages Our Hearts"
      },
      {
        "type": "paragraph",
        "text": "Many people think it is exciting to go into space! Imagine swimming weightlessly on the International Space Station, cruising in a spaceship, or just seeing our home, planet Earth, from above. In the next few years, we will build a new space station around the moon and send the first humans to the moon since 1972. As if that was not enough, before 2040, the first human ever will set foot on Mars, and soon anyone who wants to go to space will be able to! But it is not risk free to stay in space. The deeper into space we go, the more dangerous it gets."
      },
      {
        "type": "paragraph",
        "text": "The heart is an important human organ. It is responsible for pumping the blood, which delivers energy to all the body’s parts. Naturally, the older we become, the less efficient and weaker our hearts get, and the slower we become. You might have noticed this in your grandparents. In space, this phenomenon is accelerated, meaning that our hearts become weaker more quickly in space compared to on Earth. It seems that the heart ages quicker in space."
      },
      {
        "type": "heading",
        "text": "Why Does Space Age the Heart?"
      },
      {
        "type": "paragraph",
        "text": "There are several ways that space causes the heart to age. The first and most important reason is radiation. Radiation is invisible to our eyes but can be very dangerous. While not all radiation is dangerous (we use radiation to connect to the internet or make phone calls, for example) radiation in space is quite harmful, making it dangerous to stay in space for even a short time. When our cells are exposed to space radiation, they become damaged—particularly their DNA. When heart cells are damaged in this way, the risk of many heart diseases increases. Because of this, astronauts exposed to space radiation suffer from more cardiovascular diseases."
      },
      {
        "type": "paragraph",
        "text": "The second reason is weightlessness. While it might seem like a lot of fun to swim in the air or do effortless backflips, it is actually harmful to the body and organs. Being weightless means that the muscles do not need to work to support the body’s weight. This causes the astronaut’s muscles to slowly break down. The heart is also a muscle, so when gravity is not pulling the blood down toward the feet, the heart does not need to work as much to pump the blood around the body. This causes more blood to stay in the upper body compared to on Earth. Because of this, the heart’s shape becomes rounder and more similar to a ball. Some parts of the heart also become smaller and lose muscle tone."
      },
      {
        "type": "paragraph",
        "text": "The third reason space ages the heart is the loneliness and stress. It is difficult to send help into space, so astronauts are lonely and can usually only get help from each other, which can make them stressed. On top of that, spacecrafts are usually very small, with little space to move around, which makes them very stressful environments to be in. Being stressed and lonely for a long time can cause astronauts to become less motivated, weaker, and worse at teamwork. Astronauts are carefully selected to ensure that they can handle this stressful environment as best as possible."
      },
      {
        "type": "paragraph",
        "text": "Together, these three reasons cause the heart to age quicker in space. If we want to send more humans into space and explore further into the galaxy, we must know how to stop this sped-up aging. Unfortunately, we still know very little about what happens to the heart deep in space, so we need to do more research on this topic."
      },
      {
        "type": "heading",
        "text": "How Can Researchers Study Aging in Space?"
      },
      {
        "type": "paragraph",
        "text": "One common way to study organs is to perform experiments on animals. You can, for example, test medicines on animals or study what happens to a mouse’s heart when it goes into space. This does not work so well to study aging, for two main reasons. The first and most important reason is that animals’ organs are different from human organs. As you can imagine, a mouse heart is not the same as a human heart. This means that much of the research done on animals does not match what happens in the human body. For example, a medicine that treats heart disease in rats may not work for humans or may even be dangerous. Secondly, animal experiments can sometimes cause the animals to suffer."
      },
      {
        "type": "paragraph",
        "text": "To fix this, researchers can now create miniature human organs in a lab. We call these mini-organs organoids. Organoids represent real human organs better than animal organs do. Because of that, we can be more certain that a medicine that works on an organoid also works for humans. Researchers can also make organoids personalized. Since all humans are different, each person might react differently to a certain medication or environment. With personalized organoids, we can customize medication specifically for you, or tell you exactly how much your heart will age in space."
      },
      {
        "type": "heading",
        "text": "How to Build an Organoid"
      },
      {
        "type": "paragraph",
        "text": "To build an organoid, researchers start with the smallest building blocks of the body, cells. When building a mini-heart, either heart cells or stem cells can be used. Stem cells are special cells that can turn into the different cell types of the body, so researchers can “program” them to become all the cells necessary to build a mini-heart. By instructing the stem cells to become heart cells, researchers can eventually form a mini-heart that beats. These beating mini-hearts are also called heart organoids."
      },
      {
        "type": "paragraph",
        "text": "The process of stem cells turning into other cells, such as brain cells or heart cells, is called differentiation. Differentiation is done in the lab by giving the stem cells specific nutrients and molecules. The specific combination they are given determines what type of cells the stem cells will turn into. So, researchers follow a very precise recipe of nutrients and molecules to form heart cells and mini-hearts."
      },
      {
        "type": "paragraph",
        "text": "First, researchers put stem cells together into a tiny ball. This ball is just a few hair strands wide but contains a few thousand stem cells. After the stem cell ball has formed, the very precise recipe of nutrients and molecules is followed. After a few days, hollow pockets form inside the ball and, at the same time, stem cells slowly turn into heart cells, which eventually start to beat. Within 1–2 weeks, a hollow beating ball of heart cells has formed. This is the mini-heart, and it is about 1–3 mm wide."
      },
      {
        "type": "paragraph",
        "text": "Mini-hearts can also be created using 3D printing. Functional heart cells can be mixed into a liquid that can turn into a gel. The combination of cells and this liquid is called a bioink. By combining different cells with different liquids, different bioinks are created. Bioinks are then 3D printed in a specific shape and order to build a mini-heart."
      },
      {
        "type": "paragraph",
        "text": "The mini-hearts can also be placed into a training device that functions like a mini-gym. When mini-hearts are first formed, they are very weak. By putting pressure on the cells when they beat and giving them tiny electric shocks, the mini-heart can be trained to become stronger, just like our real hearts when we exercise. This is important if researchers want the mini-heart to mimic the human heart."
      },
      {
        "type": "heading",
        "text": "How Can Mini-Hearts Make Space Travel Safer?"
      },
      {
        "type": "paragraph",
        "text": "By sending mini-hearts into space, researchers can study how the space environment affects human hearts and why the heart ages quicker in space. They can study how and why the ability of the heart to beat changes in space. They can also simulate space conditions (weightlessness, radiation, and stress) using machines and drugs on Earth. Space missions are very expensive and not very common, so performing an experiment on Earth before performing it in space can give researchers a lot of additional information."
      },
      {
        "type": "paragraph",
        "text": "Today, there is no specific way to prevent the heart’s quicker aging in space. With the help of organoids, mini-hearts in this case, researchers can study why our hearts age more quickly in space and how this aging might be prevented. With personalized mini-hearts, researchers will also be able to determine how much each person’s heart will age in space and how to best treat each individual. This research will help to make space travel safer for everyone in the future!"
      }
    ],
    "vocabulary": [
      {
        "id": "a030-v01",
        "term": "Radiation",
        "definition": "Invisible particles or waves that transfer energy. Highly energetic radiation can cause damage to our bodies.",
        "example": "Astronauts experience weightlessness and are exposed to dangerous radiation.",
        "synonym": ""
      },
      {
        "id": "a030-v02",
        "term": "Organoid",
        "definition": "A mini organ grown in the lab, often created from stem cells.",
        "example": "Because of that, we can be more certain that a medicine that works on an organoid also works for humans.",
        "synonym": ""
      },
      {
        "id": "a030-v03",
        "term": "Stem Cells",
        "definition": "Cells that have the capability to develop into several different cell types.",
        "example": "When building a mini-heart, either heart cells or stem cells can be used.",
        "synonym": ""
      },
      {
        "id": "a030-v04",
        "term": "Differentiation",
        "definition": "The process of a cell becoming more specialized. For example a stem cell turning into a heart cell.",
        "example": "The process of stem cells turning into other cells, such as brain cells or heart cells, is called differentiation.",
        "synonym": ""
      },
      {
        "id": "a030-v05",
        "term": "Bioink",
        "definition": "The combination of cells and a 3D printable liquid material that can solidify. This material needs to be able to support the growth and survival of the cells.",
        "example": "The combination of cells and this liquid is called a bioink.",
        "synonym": ""
      }
    ],
    "source": {
      "publisher": "Frontiers for Young Minds",
      "url": "https://kids.frontiersin.org/articles/10.3389/frym.2024.1232530",
      "authors": [
        "Emil Rehnberg",
        "Bjorn Baselet",
        "Lorenzo Moroni",
        "Sarah Baatout",
        "Kevin Tabury"
      ],
      "citation": "Rehnberg E, Baselet B, Moroni L, Baatout S and Tabury K (2024) Does the Heart Age Faster in Space?. Front. Young Minds. 12:1232530. doi: 10.3389/frym.2024.1232530",
      "copyright": "Copyright © 2024 Rehnberg, Baselet, Moroni, Baatout and Tabury",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "adaptationNote": "Text adapted for reading practice: illustrations, figure pointers and reference markers omitted; glossary definitions retained. The original illustrated article is linked above."
    }
  },
  {
    "id": "a031",
    "slug": "shielding-fish-to-protect-whales-and-fishers-income",
    "title": "Shielding Fish to Protect Whales and Fishers Income",
    "teaser": "Some toothed whale species have gotten used to stealing or damaging fish that have been captured by the fishing equipment of fishers. This stealing is called depredation, and it is a problem for both fishers and toothed whales in all the oceans of the world.",
    "category": "Science",
    "tags": [
      "biodiversity explore the collection",
      "science",
      "toothed whales",
      "depredation",
      "drifting longline fishing",
      "mainline",
      "branchline"
    ],
    "readMinutes": 7,
    "publishedLabel": "New",
    "cover": {
      "theme": "ocean-teal",
      "icon": "Compass",
      "motif": "SCIENCE"
    },
    "blocks": [
      {
        "type": "lead",
        "text": "Some toothed whale species have gotten used to stealing or damaging fish that have been captured by the fishing equipment of fishers. This stealing is called depredation, and it is a problem for both fishers and toothed whales in all the oceans of the world. Fishers lose their catch and must work harder, and the whales can get injured and forget how to hunt. It is important to develop a solution to prevent toothed whales from stealing fish captured by fishers. Our group of scientists is developing a system that can protect captured fish from being stolen. Basically, our innovation is like Spider-man© throwing a spiderweb over the fish, to hide them from toothed whales! In the near future, we are hopeful that this system will both help the fishers by protecting their catch and help to protect toothed whales."
      },
      {
        "type": "heading",
        "text": "What Is Depredation and Why Is It a Problem?"
      },
      {
        "type": "paragraph",
        "text": "You probably already know that fish are an important part of the human food supply. But did you know that toothed whales have learned to steal fish from fishers in all the oceans of the world? When fish are captured in fishing gear, some species of toothed whales have gotten used to eating them before the fish are hauled onto the fishing boat. This is called depredation. Depredation by toothed whales happens frequently, and it is bad for both the toothed whales and the fishers."
      },
      {
        "type": "paragraph",
        "text": "Why is depredation bad for toothed whales? Well, instead of hunting wild fish as they should naturally do, these whales would rather eat fish that have already been caught. By doing so, they save energy and easily get a large amount of nutritious food. Depredation can lead whales to forget their own natural hunting strategies, and they might lose the ability to obtain food by themselves. Toothed whales can also be injured by fishing gear—they can get entangled or hooked as they try to remove the fish. All marine mammal species are classified as endangered, and several laws exist to protect these species from human threats, including threats posed by the fishing industry. This is one reason depredation should be prevented."
      },
      {
        "type": "paragraph",
        "text": "In terms of the fishers, they cannot sell damaged fish, so to replace the fish lost to depredation, they must do more fishing! This is a waste of time and money because the fishers must use more fuel, deploy more hooks, invest more hours, and fix the equipment damaged by toothed whales. Depredation also has consequences for the total number of fish available to be harvested as human food. Fish are a limited resource. Depredated fish are not counted by the fishers and therefore are not reported in fishery statistics. Consequently, fishery scientists might incorrectly calculate how many fish are left to catch in the ocean."
      },
      {
        "type": "heading",
        "text": "What Kind of Fishing Do We Study?"
      },
      {
        "type": "paragraph",
        "text": "For our work, we focus on a fishing technique called drifting longline fishing. Fishers use this method to catch large fish such as tuna or swordfish in the ocean. They sail a type of boat called longliner and set a fishing line called a mainline in the water. This mainline is suspended at the surface thanks to large buoys attached at regular intervals. The mainline, which can be as long as 150 km, is attached to vertical secondary lines called branchlines, each one with a hook at its end. Each hook is baited with a squid or a mackerel. The branchlines are left to hang down in the water to attract and catch fish. This entire fishing apparatus is called a longline. Fishers can set up to 3,000 hooks on the same longline. The longline is left to drift for about 6–7 h before being hauled onboard to harvest the captured fish."
      },
      {
        "type": "heading",
        "text": "Which Toothed Whales Engage in Depredation?"
      },
      {
        "type": "paragraph",
        "text": "In tropical waters, two species of toothed whales—the false killer whale and the short-finned pilot whale—are commonly involved in depredation of fish caught on longlines. Can you guess how big tuna and swordfish captured by longliners are? Tuna can exceed one meter in length, and swordfish can measure 2–3 m in length. However, false killer whales and short-finned pilot whales can be up to 6 m long. When depredating a fish, they tear the flesh off, leaving only the fish’s head on the hook."
      },
      {
        "type": "paragraph",
        "text": "To locate and hunt their prey, toothed whales emit calls. Then, they listen to the echoes of those calls that bounce off the objects surrounding them. This technique is called echolocation. Toothed whales and other animals, like bats, use this hunting technique to locate and identify their prey, based on the specific echoes that return to them. Toothed whales use echolocation to spot the hooked fish, and the noises of the boat in the distance also attract the whales. Since hooked fish cannot swim away, it is very easy for the whales to feed on them: it is like a ready-to-eat meal in an all-you-can-eat restaurant! It is so easy that toothed whales sometimes swim along the mainline and steal every single captured fish, making the fishers to feel desperate."
      },
      {
        "type": "heading",
        "text": "Paradep: A Potential Solution"
      },
      {
        "type": "paragraph",
        "text": "So far, several techniques have been tested worldwide to decrease depredation, but none of them work very well. We run a project called PARADEP1, to find an innovative way to reduce depredation by toothed whales. The aim of the project is to design a shield that can hide and protect the captured fish. How does it work? First, picture Spider-man©: his super power allows him to shoot an adhesive spiderweb through a small barrel located on his wrist, right? Our device is similar to this barrel. Two protection nets (which look like Superman’s© cape) are stored inside a small case. These cases are attached to the tops of every branchline. When the fish bites the bait and pulls on the hook, the case opens. Then, the protection nets are ejected, slide down the branchline, and wrap the fish up. Then the fish is protected by a shield, as if it were wearing an invisibility cloak. The net shield makes it harder for toothed whales to see and eat the fish, so the net avoids whales from depredating the fish until the line is hauled back onboard. This way, the fisher can harvest undamaged fish, even if toothed whales are swimming near the boat."
      },
      {
        "type": "paragraph",
        "text": "Our device will keep fishers from both losing income and working overtime to compensate for the loss of fish. The device is reusable, so it is environmentally friendly and economically attractive for fishers. It will also help protect the toothed whales, because it will reduce their risk of injury and they will have to use their natural hunting skills again."
      },
      {
        "type": "heading",
        "text": "Take-Home Message"
      },
      {
        "type": "paragraph",
        "text": "Depredation of fish caught by drifting longliners causes conflicts between fishers and toothed whales. This interaction needs to change, so that fishers and toothed whales can share the same feeding/fishing grounds without harming each other. By creating a shield around a hooked fish until it is hauled onboard, the PARADEP device may be the solution we are looking for, both for protecting toothed whales and preventing fish from being stolen. We are working with fishers because they want something to help them decrease depredation. They are playing an important role in testing the PARADEP device. After several months of PARADEP testing and collection of feedback from the fishers who are using it, we will know whether PARADEP works well-enough to help reduce depredation by toothed whales throughout the world’s oceans."
      }
    ],
    "vocabulary": [
      {
        "id": "a031-v01",
        "term": "Toothed Whales",
        "definition": "A group of marine mammals, including killer whales or dolphins, that have pointy teeth and feed on fish or squids.",
        "example": "This stealing is called depredation, and it is a problem for both fishers and toothed whales in all the oceans of the world.",
        "synonym": ""
      },
      {
        "id": "a031-v02",
        "term": "Depredation",
        "definition": "The act of damaging or stealing plants or animals grown or bred by humans. For instance, coyotes or foxes sneaking into a farm to eat chickens is depredation.",
        "example": "This stealing is called depredation, and it is a problem for both fishers and toothed whales in all the oceans of the world.",
        "synonym": ""
      },
      {
        "id": "a031-v03",
        "term": "Drifting Longline Fishing",
        "definition": "A technique involving a floating mainline set in the ocean, with hundreds of vertical baited branchlines attached to it. This longline drifts for hours to catch fish.",
        "example": "For our work, we focus on a fishing technique called drifting longline fishing.",
        "synonym": ""
      },
      {
        "id": "a031-v04",
        "term": "Mainline",
        "definition": "A horizontal fishing line set in the water and suspended at the surface thanks to large buoys attached at regular intervals. It can be as long as 150 km.",
        "example": "They sail a type of boat called longliner and set a fishing line called a mainline in the water.",
        "synonym": ""
      },
      {
        "id": "a031-v05",
        "term": "Branchline",
        "definition": "A vertical secondary line attached at regular intervals to the mainline, with a baited hook at its end. Fishers can set up to 3,000 branchlines on the same mainline to capture fish.",
        "example": "These cases are attached to the tops of every branchline.",
        "synonym": ""
      },
      {
        "id": "a031-v06",
        "term": "Echolocation",
        "definition": "A hunting technique used by bats or marine mammals. They emit calls and they listen to their echoes. They use this technique to locate, identify, and hunt their prey.",
        "example": "This technique is called echolocation.",
        "synonym": ""
      }
    ],
    "source": {
      "publisher": "Frontiers for Young Minds",
      "url": "https://kids.frontiersin.org/articles/10.3389/frym.2022.692106",
      "authors": [
        "Njaratiana Rabearisoa",
        "Alice Arnau",
        "Manon Bodin",
        "Constance Hanse",
        "Marin Portalez",
        "Pascal Bach"
      ],
      "citation": "Rabearisoa N, Arnau A, Bodin M, Hanse C, Portalez M and Bach P (2022) Shielding Fish to Protect Whales and Fishers Income. Front. Young Minds. 10:692106. doi: 10.3389/frym.2022.692106",
      "copyright": "Copyright © 2022 Rabearisoa, Arnau, Bodin, Hanse, Portalez and Bach",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "adaptationNote": "Text adapted for reading practice: illustrations, figure pointers and reference markers omitted; glossary definitions retained. The original illustrated article is linked above."
    }
  },
  {
    "id": "a032",
    "slug": "can-helping-someone-ever-be-a-bad-thing",
    "title": "Can Helping Someone Ever Be a Bad Thing?",
    "teaser": "People think that helping others is nice. Teachers and parents often tell children to help others, for example in the classroom.",
    "category": "Society",
    "tags": [
      "neuroscience and psychology",
      "society",
      "peers",
      "indirect help",
      "direct help",
      "competence"
    ],
    "readMinutes": 9,
    "publishedLabel": "New",
    "cover": {
      "theme": "sunrise-rose",
      "icon": "BookOpen",
      "motif": "SOCIETY"
    },
    "blocks": [
      {
        "type": "lead",
        "text": "People think that helping others is nice. Teachers and parents often tell children to help others, for example in the classroom. I discovered that sometimes children help in a way that is not nice. In two studies, children (7–9 years old) got to help peers solve puzzles. Children gave more correct answers to someone who was struggling with the puzzles, but they gave more hints to someone who was already good at the puzzles. If you simply give someone the answers, they cannot learn new skills—and people who do not learn new skills can keep struggling. Children in my studies thus helped their struggling peers in a way that causes them to keep struggling, while the way they helped the peers who could already solve the puzzles made these children become even better at them. Thus, sometimes help can lead to outcomes that are not so positive."
      },
      {
        "type": "heading",
        "text": "Different Types of Help"
      },
      {
        "type": "paragraph",
        "text": "We often help others because we care about them, or we see that they need help. We frequently help others because we think it is a nice thing to do. But is helping always nice? In my research, I discovered that sometimes the help that children provide to peers can be harmful."
      },
      {
        "type": "paragraph",
        "text": "Not all help is the same. Imagine that you are doing a word puzzle that you like and are good at, and one of your classmates asks you for help on the same puzzle. How will you help them? You could decide to give your classmate a hint. This is often called indirect help. It is indirect because such help allows your classmate to learn to figure out the answers on their own. Maybe the next time they work on a similar puzzle they will not need help because they now know how to solve it."
      },
      {
        "type": "paragraph",
        "text": "But you could also decide to help by simply giving your classmate the correct answer. This is called direct help. Direct help will make doing the word puzzle easier for your classmate, of course, but it also takes away their opportunity to learn something new or figure the puzzle out by themselves. And when they do a similar word puzzle again, they will still need help because they did not learn how to solve it on their own."
      },
      {
        "type": "paragraph",
        "text": "Which type of help do you think is better? In most cases it is probably better to give indirect help, especially because it actually helps others learn more in the long run. After all, indirect help teaches others to become better at something, so the next time they do the task they will not need as much help. It is like an old saying you might have heard: “give a man a fish and you feed him for a day; teach a man to fish and you feed him for a lifetime”."
      },
      {
        "type": "heading",
        "text": "How Do Children Help?"
      },
      {
        "type": "paragraph",
        "text": "How do children help others? Do they give more indirect help or direct help when they are helping their peers? I tested this with children who were 7–9 years old, by conducting two similar experiments in the Netherlands. In the first experiment I tested 80 children (63.7% boys, 36.3% girls, 75% of the children were native Dutch), and in the second experiment I tested 41 children (61% boys, 39% girls, 80.5% were native Dutch). Children participated in the experiments at school, at their after-school daycare, when visiting a science museum, or at home. Children were always tested in a quiet room, and they sat in front of a computer. I told the children they were going to be quizmasters and were supposed to help two peers who were taking a quiz. They saw these children on the computer screen. In reality, these peers were not actually there, but the children believed that they were (and afterwards we told them this was not true)."
      },
      {
        "type": "paragraph",
        "text": "The children then listened to these peers receiving instructions on how to take the quiz. We recorded these messages beforehand. In this message the experimenter also told the children how their peers did on another quiz they took earlier. To one peer, the experimenter said: “I heard you did not do so well last time, you answered a lot of questions incorrectly, right?”. To the other peer, the experimenter said: “I heard you did really well last time and answered a lot of questions correct, right?”. The children we were testing overheard these remarks so they could form an impression of each peers’ competence at the quiz. We wanted the children to think that one peer was good at the quiz and the other one was not. This way, we could test if children give different types of help when they think others are good at something or struggle with it. And they did!"
      },
      {
        "type": "paragraph",
        "text": "In both studies, children gave more hints (indirect help) to peers who were competent, and they gave more correct answers (direct help) to peers that were not competent. In the first study, the peers worked on puzzles, and in the second study, the peers worked on a math quiz. The children gave more direct help to peers that were not competent even when we told them the peers needed to practice their skills for the final round. So, children knew it was important for all children to learn how to do the quiz. Yet, they made peers who already did well practice more than children who struggled. Children’s gender did not influence the results, meaning boys and girls both provided more indirect help to peers who did not struggle and more direct help to peers who struggled."
      },
      {
        "type": "paragraph",
        "text": "Overall, the results showed that when children think others struggle, they are more likely to give them direct help. However, this means that those peers do not learn new skills. So, if the peers were not good at the task to start with, they could not get better from the help they received. Giving indirect help to already competent peers means these peers can get even better at the task because they practice even more."
      },
      {
        "type": "heading",
        "text": "Does It Matter How Children Help?"
      },
      {
        "type": "paragraph",
        "text": "So, if children help this way, what happens in the end? The children who do well get better, and the children who struggle keep struggling. This also means that the difference in competence between struggling and non-struggling children gets bigger."
      },
      {
        "type": "paragraph",
        "text": "That is not all. When some children get more direct help, it might also make them feel worse about themselves. They might think that others do not have confidence in their ability to solve challenges on their own. Feeling bad about how well they do at school tasks can make kids less motivated to do schoolwork and can make them feel unhappy."
      },
      {
        "type": "paragraph",
        "text": "One more reason that the type of help matters is that others in the classroom might also start thinking differently about the children who get more direct help. We know this because we also asked children what they think it means when others get direct help or indirect help. Our data showed that children think peers who get more direct help are less smart. So, if some children receive more direct help, their classmates might start to think less positively about them."
      },
      {
        "type": "paragraph",
        "text": "In summary, it matters a great deal how children help peers. When children give more direct help to peers who they think struggle, these peers do not improve their skills, might feel badly about themselves, and others might think they are less smart. This can set up a negative cycle—when children think others are less smart, and they may again give them more direct help!"
      },
      {
        "type": "paragraph",
        "text": "More research is needed, however. Children in my studies, for example, did not actually see or know the children they helped, and all the children were living in the Netherlands and were 7–9 years of age. It would be interesting to go to real classrooms in different parts of the world to observe how children of different ages help their classmates. Perhaps all children help classmates who struggle differently from classmates they think do not struggle. But maybe children’s helping is influenced by whether they are friends with the classmates or not. Or maybe children help others differently because they live in cultures where teachers or parents often provide direct help, so they think that is the best helping strategy."
      },
      {
        "type": "heading",
        "text": "Solutions"
      },
      {
        "type": "paragraph",
        "text": "So, what can we do about this? Many people think helping others is always nice and we should all do it. But if you look more closely, you see that this is not always the case. We could make sure teachers know about how helping can lead to negative effects. Then maybe teachers can make sure that if they assign children to help each other, they also look at how they help and make sure it does not lead to bad outcomes for some children. Another solution is to teach children about the different types of help and make sure they help in ways that are not harmful. That is why I wrote this article—the next time you offer to help someone, I hope you remember to make sure to give them the right kind of help!"
      }
    ],
    "vocabulary": [
      {
        "id": "a032-v01",
        "term": "Peers",
        "definition": "Refers to a person that is of the same age (a classmate, for example).",
        "example": "In two studies, children (7–9 years old) got to help peers solve puzzles.",
        "synonym": ""
      },
      {
        "id": "a032-v02",
        "term": "Indirect Help",
        "definition": "The sort of help that helps others figure something out themselves. For example, when someone is doing a puzzle, you could give them a hint to help them solve it.",
        "example": "This is often called indirect help.",
        "synonym": ""
      },
      {
        "id": "a032-v03",
        "term": "Direct Help",
        "definition": "The sort of help that provides an immediate solution to the problem, such as giving someone the correct answer to a test question.",
        "example": "This is called direct help.",
        "synonym": ""
      },
      {
        "id": "a032-v04",
        "term": "Competence",
        "definition": "How good you are at something.",
        "example": "The children we were testing overheard these remarks so they could form an impression of each peers’ competence at the quiz.",
        "synonym": ""
      }
    ],
    "source": {
      "publisher": "Frontiers for Young Minds",
      "url": "https://kids.frontiersin.org/articles/10.3389/frym.2024.1370947",
      "authors": [
        "Jellie Sierksma"
      ],
      "citation": "Sierksma J (2024) Can Helping Someone Ever Be a Bad Thing?. Front. Young Minds. 12:1370947. doi: 10.3389/frym.2024.1370947",
      "copyright": "Copyright © 2024 Sierksma",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "adaptationNote": "Text adapted for reading practice: illustrations, figure pointers and reference markers omitted; glossary definitions retained. The original illustrated article is linked above."
    }
  },
  {
    "id": "a033",
    "slug": "fish-ear-stones-offer-climate-change-clues-in-alaskas-lakes",
    "title": "Fish Ear Stones Offer Climate Change Clues In Alaska’s Lakes",
    "teaser": "Otoliths, also known as ear stones, are small body parts that help fish with hearing and balance. Like tree rings, otoliths form one light and one dark band per year, creating rings.",
    "category": "Science",
    "tags": [
      "earth sciences explore the collection",
      "science",
      "nutrients",
      "otoliths",
      "ectothermic",
      "spawn",
      "data"
    ],
    "readMinutes": 10,
    "publishedLabel": "New",
    "cover": {
      "theme": "ocean-teal",
      "icon": "Compass",
      "motif": "SCIENCE"
    },
    "blocks": [
      {
        "type": "lead",
        "text": "Otoliths, also known as ear stones, are small body parts that help fish with hearing and balance. Like tree rings, otoliths form one light and one dark band per year, creating rings. These rings can be measured to understand fish growth. The wider the ring, the greater the growth. In our study, we used otoliths to understand how one fish species—lake trout—responds to rising temperature in the state of Alaska. We found that warmer spring air temperature and earlier lake ice melt were related to faster lake trout growth. This finding is consistent with other studies that link warmer water temperature and earlier lake ice melt to increased plankton in Alaska’s lakes. Together, these findings suggest that climate-driven increases at the bottom of the food web might benefit top predators like lake trout. However, the relationship between warmer temperature and faster growth may not last."
      },
      {
        "type": "heading",
        "text": "Things With Rings"
      },
      {
        "type": "paragraph",
        "text": "Have you ever noticed the rings on a cross-cut tree trunk? Counting those rings can tell you the age of a tree. This is because each ring is made of two parts: a light-colored band of wood that formed in the spring and early summer, and a dark-colored band of wood that formed in late summer and fall. Therefore, a light band and a neighboring dark band represent 1 year of life for a tree."
      },
      {
        "type": "paragraph",
        "text": "But age is not the only thing revealed by tree rings. The width of the rings contains information about the growth of a tree and the environmental conditions it experienced. This is because trees respond to conditions like temperature, moisture, and nutrients. In warmer, wetter years, trees tend to grow more, and their rings are wider than in colder, drier years. Similarly, trees tend to grow more in years when nutrients like fertilizers are plentiful in the soil. Because trees stay in one place and grow for many years, their rings offer a record of conditions in that place over time."
      },
      {
        "type": "paragraph",
        "text": "Believe it or not, other organisms also form rings every year that they live. For example, corals and clams create yearly growth rings in their skeletons and shells. Some fish also do so, within their scales and ear stones. Ear stones—also called otoliths—are small, flat structures that help fish with hearing and balance. They are located just under the brain in a fish’s skull. Like tree rings, otoliths form one light and one dark band per year, creating a ring. These rings can be counted to determine fish age. They can also be measured to understand fish growth. The wider the ring, the greater the growth in a single year."
      },
      {
        "type": "heading",
        "text": "What Controls Fish Growth?"
      },
      {
        "type": "paragraph",
        "text": "Fish grow faster or slower depending on how old they are and how well their environment meets their needs. Like humans, fish grow more slowly as they age. They also grow more slowly when they lack nutrients and energy from food. Unlike humans, fish grow more slowly in cold temperatures. The reason for this is simple. Most fish are ectothermic or cold-blooded, so their body temperatures are controlled by the water temperatures around them. When water temperatures are cold, everything in an ectotherm’s body slows down, including its breathing, digestion, and growth."
      },
      {
        "type": "paragraph",
        "text": "In our study, we used otoliths to explore the growth of one fish species—lake trout. We wanted to know how lake trout growth responds to temperature and nutrients. We were particularly interested in lake trout from Lake Clark National Park & Preserve in southwest Alaska, USA."
      },
      {
        "type": "heading",
        "text": "Why Study Lake Trout in Lake Clark?"
      },
      {
        "type": "paragraph",
        "text": "Lake trout are top predators that thrive in cold, deep lakes. We focused on this species for two main reasons. First, we chose lake trout because they are common in Alaska. This makes them easier to find than rarer species. Second, we chose lake trout because they have long lifespans (20+ years). This means their otoliths contain a longer record of growth than other common fish species in Alaska, like sockeye salmon."
      },
      {
        "type": "paragraph",
        "text": "Lake Clark National Park & Preserve is known for its cold, deep lakes and surrounding wilderness. Human impacts, like buildings and roads, are scarce inside park boundaries. However, like the rest of Alaska, the park is experiencing climate change. Average annual air temperature in Alaska is warming about twice as fast as the world-wide pace. Warmer air temperature is shortening the number of days that lakes have ice in winter. Both air temperature and lake ice affect the conditions experienced by fish."
      },
      {
        "type": "paragraph",
        "text": "The park is also known for the thousands of sockeye salmon that spawn there. Salmon begin and end their lives in fresh water. Between those endpoints, they gain most of their body weight in the ocean, where the waters are high in nutrients. When salmon return to fresh water to spawn and die, their bodies are like bundles of nutrients delivered from the ocean. Some scientists think that those bundles of salmon nutrients help other freshwater fish grow faster."
      },
      {
        "type": "heading",
        "text": "What Was Our Question and Approach?"
      },
      {
        "type": "paragraph",
        "text": "Lake trout are long-lived fish that prefer cold, deep lakes. Lake Clark National Park & Preserve has lots of cold, deep lakes, plus nutrients from dead salmon. However, Alaska’s changing climate is warming its lakes. Therefore, we asked whether lake trout grow faster or slower in warmer years, and whether sockeye salmon nutrients affect lake trout growth as well."
      },
      {
        "type": "paragraph",
        "text": "To study this, we caught 240 lake trout from 7 lakes, during the summers of 2004, 2011, 2012, and 2013. All the lakes had cool waters with low levels of nutrients. However, they differed in one basic trait: only 4 lakes were accessible to salmon. The other 3 lakes were upstream of barriers to salmon migration, like waterfalls."
      },
      {
        "type": "paragraph",
        "text": "After catching the lake trout, we removed their otoliths by dissection. We then used a multi-step process to count and measure the otolith rings. First, we covered each otolith with a gel that dried to a hard, clear block. Next, we cut the blocks with a special saw, to obtain a slice about as thick as a fingernail from the middle of each otolith. Then, we glued the otolith slices to glass microscope slides and photographed the slides using a camera attached to a microscope. The microscope made each otolith slice look 40 times bigger in the photograph than in real life."
      },
      {
        "type": "paragraph",
        "text": "Using the magnified photographs, we counted the otolith rings to age each fish. We also assigned a year of formation to each ring by counting backward from the year we caught the fish. Then, we measured the ring widths on the photographs. By the end of this multi-step process, we had measured 964 otolith rings. Although 964 seems like a lot, it is fewer than expected because only 80 of the 240 fish had distinct otolith rings."
      },
      {
        "type": "paragraph",
        "text": "Next, we used statistical models to summarize the 964 ring widths from the 80 lake trout into a single width per year, applicable to all lake trout in our study. We called that summarized version our master growth record because it applied to many different fish, like a master key that opened many different locks. The master growth record showed years when fish grew less than average, about average, and more than average. It included years from 1990 to 2011."
      },
      {
        "type": "paragraph",
        "text": "Finally, we compared the master growth record to temperature, ice, and salmon data from the same years. This was challenging because these types of data were not measured at each of our study lakes that far back in time. Therefore, we used the best available data from other sources. For temperature, we used monthly average air temperature at a weather station near one study lake (Lake Clark). For ice, we used the date when lake ice melted at another study lake (Telaquana Lake). For salmon, we used the number of adult sockeye salmon returning to spawn downstream of those two lakes. Using these datasets, we analyzed the relationships between lake trout growth, temperature, ice, and salmon."
      },
      {
        "type": "heading",
        "text": "What Did We Find?"
      },
      {
        "type": "paragraph",
        "text": "We found that lake trout grew faster in warmer years. In particular, lake trout grew faster in years with warmer air temperatures in April. This pattern existed in February and July too but was not as strong. Lake trout also grew faster in years with earlier dates of lake ice melt. However, we did not see a pattern between lake trout growth and salmon. Lake trout did not grow faster in lakes with salmon compared to lakes without salmon. In lakes with salmon, lake trout did not grow faster in years with more spawning salmon."
      },
      {
        "type": "heading",
        "text": "How Do Our Findings Fit Within the “Big Picture”?"
      },
      {
        "type": "paragraph",
        "text": "Our study found that lake trout grow faster in years with warmer air temperature in April because warmer air causes earlier lake ice melt. Warmer air and earlier melt probably increase spring water temperature at the lake surface toward the 9°C preferred by lake trout. At this preferred temperature, lake trout can eat more and grow more without overheating, if food is available."
      },
      {
        "type": "paragraph",
        "text": "Interestingly, more food might be available in warmer years. Other studies in nearby lakes have shown that plankton counts increase with warmer surface water and earlier spring melt. Warmer springs are also linked to higher counts and faster growth of small plankton-eating fish, like young sockeye salmon. And guess what likes to eat young sockeye salmon as prey? Lake trout!"
      },
      {
        "type": "paragraph",
        "text": "These results suggest that lake trout in Lake Clark National Park & Preserve might be climate change winners. They can benefit from the increased food linked to warmer water near the lake surface, while still having the option to use cooler water at deeper depths if they need to slow down their bodies to conserve food. These results hold true with or without the added nutrients from salmon. Whether these results will hold true over time, as climate warming continues, remains a question."
      }
    ],
    "vocabulary": [
      {
        "id": "a033-v01",
        "term": "Nutrients",
        "definition": "Chemicals that provide materials needed by living things to survive, grow, and reproduce. The nutrients that often limit growth at the bottom of lake food webs are nitrogen and phosphorus.",
        "example": "This is because trees respond to conditions like temperature, moisture, and nutrients.",
        "synonym": ""
      },
      {
        "id": "a033-v02",
        "term": "Otoliths",
        "definition": "Small structures used by vertebrates for balance and hearing. In fish, otoliths grow by adding new layers of seashell-like material year after year, throughout life.",
        "example": "Otoliths, also known as ear stones, are small body parts that help fish with hearing and balance.",
        "synonym": ""
      },
      {
        "id": "a033-v03",
        "term": "Ectothermic",
        "definition": "Cold-blooded. An ectothermic animal is one whose internal body temperature depends on external heat sources for warmth.",
        "example": "Most fish are ectothermic or cold-blooded, so their body temperatures are controlled by the water temperatures around them.",
        "synonym": ""
      },
      {
        "id": "a033-v04",
        "term": "Spawn",
        "definition": "Reproduce, by adult salmon, through building a gravel nest, laying eggs in the nest, and fertilizing the eggs.",
        "example": "The park is also known for the thousands of sockeye salmon that spawn there.",
        "synonym": ""
      },
      {
        "id": "a033-v05",
        "term": "Data",
        "definition": "A group of facts, like numbers, measurements, or observations. The word “data” is the plural form of the word “datum,” which is a single fact.",
        "example": "Finally, we compared the master growth record to temperature, ice, and salmon data from the same years.",
        "synonym": ""
      },
      {
        "id": "a033-v06",
        "term": "Plankton",
        "definition": "Tiny organisms that drift near the surface of a body of water, like a lake or ocean. These organisms may be plant-like phytoplankton or animal-like zooplankton. Zooplankton eat phytoplankton.",
        "example": "This finding is consistent with other studies that link warmer water temperature and earlier lake ice melt to increased plankton in Alaska’s lakes.",
        "synonym": ""
      }
    ],
    "source": {
      "publisher": "Frontiers for Young Minds",
      "url": "https://kids.frontiersin.org/articles/10.3389/frym.2022.726495",
      "authors": [
        "Krista K. Bartz",
        "Vanessa R. von Biela",
        "Bryan A. Black",
        "Daniel B. Young",
        "Peter van der Sleen",
        "Christian E. Zimmerman"
      ],
      "citation": "Bartz KK, von Biela VR, Black BA, Young DB, van der Sleen P and Zimmerman CE (2022) Fish Ear Stones Offer Climate Change Clues In Alaska’s Lakes. Front. Young Minds. 10:726495. doi: 10.3389/frym.2022.726495",
      "copyright": "Copyright © 2022 Bartz, von Biela, Black, Young, van der Sleen and Zimmerman",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "adaptationNote": "Text adapted for reading practice: illustrations, figure pointers and reference markers omitted; glossary definitions retained. The original illustrated article is linked above."
    }
  },
  {
    "id": "a034",
    "slug": "aquaponics-a-promising-tool-for-environmentally-friendly-farming",
    "title": "Aquaponics: A Promising Tool for Environmentally Friendly Farming",
    "teaser": "Nowadays, agriculture must face a new challenge: produce more food with fewer natural resources. To achieve this goal, scientists are testing a technique called aquaponics.",
    "category": "Science",
    "tags": [
      "earth sciences explore the collection",
      "science",
      "paddy fields",
      "raft aquaponics",
      "substrate aquaponics",
      "channel aquaponics",
      "transport footprint"
    ],
    "readMinutes": 7,
    "publishedLabel": "New",
    "cover": {
      "theme": "forest-emerald",
      "icon": "Compass",
      "motif": "SCIENCE"
    },
    "blocks": [
      {
        "type": "lead",
        "text": "Nowadays, agriculture must face a new challenge: produce more food with fewer natural resources. To achieve this goal, scientists are testing a technique called aquaponics. Aquaponics was introduced many years ago by ancient Chinese and Mexican populations. In aquaponics, fish and plants are farmed together. How is this possible? Bacteria change the fish poop into nutrients useful for the plants. The plants take up these nutrients and clean the water, which can then be reused to farm the fish, and the cycle restarts! Aquaponics allows farmers to obtain two products at once, and to recycle the same water many times. Almost no wastewater is released into the environment! Aquaponics systems can have different sizes and do not need soil. They can be installed in both outdoor and indoor environments. Big aquaponic systems are used for commercial purposes, while small aquaponic systems can be used for urban farming—growing food within cities."
      },
      {
        "type": "heading",
        "text": "What Is Aquaponics?"
      },
      {
        "type": "paragraph",
        "text": "The population of the world is increasing rapidly, and there is not enough food to feed this growing population! Scientists have an important mission: they must find a method for producing more food without stressing the environment. Traditional farming techniques damage the environment in many ways. They harm natural resources and pose health risks to humans and wildlife. A technique called aquaponics could be a solution to this problem. The “aqua” part of this word comes from aquaculture, which is the practice of raising fish, shrimp, algae, and other seafood. The “ponics” part comes from hydroponics, which is the cultivation of plants in water, without soil. Aquaculture and hydroponics can exist separately, but when we combine them, we obtain aquaponics!"
      },
      {
        "type": "paragraph",
        "text": "Aquaponics is a miniature version of a natural ecosystem. It works the way Mother Nature normally works in every aquatic environment! First, in aquaponics, we put the fish to work. By working, we mean eating and pooping. This results in water that is rich in nutrients—yes, the fish poop! Then, bacteria come into play. Bacteria convert the fish poop into a perfect fertilizer for plant growth. The plants take up this fertilizer with their roots and, in doing so, also clean the water. The clean water is reused for farming the fish. The cycle restarts!"
      },
      {
        "type": "paragraph",
        "text": "In an aquaponics system, fish, plants, and bacteria work together as a team. This teamwork allows farmers to obtain two food products, fish and vegetables, using the same amount of water that would normally be used to obtain just one product. In this closed cycle, water is not wasted—the wastewater released into the environment is almost zero!"
      },
      {
        "type": "heading",
        "text": "Aquaponics, Past and Present"
      },
      {
        "type": "paragraph",
        "text": "The idea of aquaponics is quite old. The first forms of aquaponics were used about 1,500 years ago, in South China, Indonesia, and Thailand. The farmers there grew rice in paddy fields that also had fish in them. The fish poop served as fertilizer for the growth of the rice plants."
      },
      {
        "type": "paragraph",
        "text": "Five hundred years later, a population in central Mexico invented another form of aquaponics. This population, known as the Aztecs, created a big empire. The capital of the empire, called Tenochtitlán, was built on the shores of Lake Texcoco. In that wetland, the Aztecs did not have fertile lands to cultivate their food. For this reason, they built gardens floating in the lake, called chinampas. These floating islands were made of mud and dried plant residue. On the chinampas, farmers cultivated maize, squash, tomatoes, and other crops. The plants could take up nutrients from the lake water, which was rich in fish poop."
      },
      {
        "type": "paragraph",
        "text": "Although the concept of aquaponics is ancient, it was not until the 1970’s that scientists rediscovered its potential. Nowadays, aquaponics is becoming quite advanced, and it provides a sustainable solution for agriculture, that will reduce the use of natural resources. Aquaponics uses up to 90% less water than traditional agriculture and the plants grow much faster! Aquaponics also reduces pollutants coming from the use of tractors and field chemicals."
      },
      {
        "type": "paragraph",
        "text": "Aquaponics systems can be installed both outdoors and in indoor, greenhouse-like environments. Indoors systems can allow food to be produced throughout the year! This is a great advantage in areas where the climate is not favorable for agriculture, for example, places with low temperatures, short daylight, and an absence of rain or freshwater for irrigation."
      },
      {
        "type": "heading",
        "text": "Types of Aquaponics"
      },
      {
        "type": "paragraph",
        "text": "There are three main aquaponics systems in use today. In raft aquaponics, the plants are grown on floating rafts. The rafts float in tanks filled with the wastewater from the fish culture. The plant roots dip into the water where they can absorb the nutrients from the fish poop. This method is most appropriate for small plants like salad greens, basil, spinach, chard, and others. In substrate aquaponics, the plants grow in a substrate that mimics the soil. This substrate sustains the plant roots and helps the bacteria to filter the water. This kind of system is suitable for all types of plants, but it is most often used for cabbage, broccoli, onions, fennel, carrots, tomatoes, peppers, cucumbers, beans, peas, squash, and melons. Last, in channel aquaponics, the wastewater from the fish flows through narrow pipes with holes, into which the plants are placed. The roots dip into the stream of water within the pipe, where they can uptake the nutrients from the fish poop. This growing method works well for plants that need little support, such as strawberries, leafy greens, and herbs. The pipes can also be placed vertically to save space."
      },
      {
        "type": "paragraph",
        "text": "There are many fish species that can be used in aquaponics systems. These systems can incorporate large, small, edible, or ornamental fish, it depends on the ultimate purpose of the system. The most common species of fish in aquaponics systems are tilapia, bluegill, catfish, carp koi, fancy goldfish, shrimp, and pacu."
      },
      {
        "type": "heading",
        "text": "Benefits of Aquaponics in Cities"
      },
      {
        "type": "paragraph",
        "text": "Nowadays, there is a growing interest in small-scale aquaponics systems. These systems can be located within cities; for example, they can be located in parks, urban gardens, buildings, houses, courtyards, and on rooftops. Introducing small aquaponics systems into cities can bring many benefits. Aquaponics can provide a large variety of organic and seasonal fresh produce. These vegetables are environmentally friendly because they have a reduced transport footprint—they do not need to be transported far before reaching our tables. Urban aquaponics systems can also encourage social initiatives. For example, they can promote cohousing and educational workshops, both of which provide people with a greater chance of meeting their neighbors. Aquaponics can also provide a shelter for birds and beneficial insects, which increases the city’s biodiversity. Last, urban aquaponics can help to create jobs for people in cities."
      },
      {
        "type": "paragraph",
        "text": "In summary, aquaponics is a circular soilless production system. It allows producing fish and vegetables together with the same amount of water, helping to save water. By participating in aquaponics, people can learn more about the lives of plants and fish. They can become more aware of how the foods they buy in grocery stores have been produced. This is especially important for younger people in cities and suburban areas, who are at risk of losing touch with the farming world. And one more important thing—participating in aquaponics is also a lot of fun!"
      }
    ],
    "vocabulary": [
      {
        "id": "a034-v01",
        "term": "Paddy Fields",
        "definition": "A flooded field used to grow rice.",
        "example": "The farmers there grew rice in paddy fields that also had fish in them.",
        "synonym": ""
      },
      {
        "id": "a034-v02",
        "term": "Raft Aquaponics",
        "definition": "System in which plants are placed in holes drilled in rafts. The rafts float within tanks filled with fish wastewater. Plant roots dip in the water where they absorb nutrients.",
        "example": "In raft aquaponics, the plants are grown on floating rafts.",
        "synonym": ""
      },
      {
        "id": "a034-v03",
        "term": "Substrate Aquaponics",
        "definition": "System in which plants are placed in holes drilled within pipes where continuously the fish effluent water flows. The roots dip into the water stream, where they can uptake the nutrients.",
        "example": "In substrate aquaponics, the plants grow in a substrate that mimics the soil.",
        "synonym": ""
      },
      {
        "id": "a034-v04",
        "term": "Channel Aquaponics",
        "definition": "System in which plants are placed within a substrate that mimics the soil. This substrate also contains bacteria that help the plant to uptake nutrients from the fish wastewater.",
        "example": "Last, in channel aquaponics, the wastewater from the fish flows through narrow pipes with holes, into which the plants are placed.",
        "synonym": ""
      },
      {
        "id": "a034-v05",
        "term": "Transport Footprint",
        "definition": "Greenhouse gas emissions from transportation (trucks, airplanes, railways, etc.).",
        "example": "These vegetables are environmentally friendly because they have a reduced transport footprint—they do not need to be transported far before reaching our tables.",
        "synonym": ""
      },
      {
        "id": "a034-v06",
        "term": "Cohousing",
        "definition": "Communities in which people have their own residences but share common spaces such as rooftops, courtyards, and balconies.",
        "example": "For example, they can promote cohousing and educational workshops, both of which provide people with a greater chance of meeting their neighbors.",
        "synonym": ""
      },
      {
        "id": "a034-v07",
        "term": "Biodiversity",
        "definition": "Set of all living forms that are on Earth—plants, animals, insects, fungi and micro-organisms, and their habitats.",
        "example": "Aquaponics can also provide a shelter for birds and beneficial insects, which increases the city’s biodiversity.",
        "synonym": ""
      }
    ],
    "source": {
      "publisher": "Frontiers for Young Minds",
      "url": "https://kids.frontiersin.org/articles/10.3389/frym.2022.707801",
      "authors": [
        "Roberta Calone",
        "Francesco Orsini"
      ],
      "citation": "Calone R and Orsini F (2022) Aquaponics: A Promising Tool for Environmentally Friendly Farming. Front. Young Minds. 10:707801. doi: 10.3389/frym.2022.707801",
      "copyright": "Copyright © 2022 Calone and Orsini",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "adaptationNote": "Text adapted for reading practice: illustrations, figure pointers and reference markers omitted; glossary definitions retained. The original illustrated article is linked above."
    }
  },
  {
    "id": "a035",
    "slug": "whats-mine-whats-ours-how-the-brain-thinks-about-shared-resources",
    "title": "What’s Mine? What’s Ours? How the Brain Thinks About Shared Resources",
    "teaser": "Why do people not always choose to take care of the Earth? This study looked at how people’s brains decide to take care of nature, like fish in the ocean.",
    "category": "Society",
    "tags": [
      "neuroscience and psychology",
      "society",
      "private resource",
      "common resource",
      "fmri",
      "ventral striatum",
      "social comparison"
    ],
    "readMinutes": 9,
    "publishedLabel": "New",
    "cover": {
      "theme": "sunrise-rose",
      "icon": "BookOpen",
      "motif": "SOCIETY"
    },
    "blocks": [
      {
        "type": "lead",
        "text": "Why do people not always choose to take care of the Earth? This study looked at how people’s brains decide to take care of nature, like fish in the ocean. The scientists made a game that was like going fishing, and they used brain-scanning technology to see what was happening in people’s brains while they played. The scientists discovered that when people thought they were fishing with other people, they took more fish than when they were alone. The brain scan showed that a part of the brain was working differently, too. This study helps us understand how people’s brains work when they make decisions about nature. If we know more about how our brains think about nature, we can find better ways to protect our planet. This study also shows how different types of science, like Earth science and brain science, can work together to help solve important problems for the world."
      },
      {
        "type": "heading",
        "text": "The Things We Share"
      },
      {
        "type": "paragraph",
        "text": "Have you ever noticed, in a classroom, that kids usually sharpen their own pencils, but the jar of “classroom pencils” that anyone can use does not get sharpened very often by anyone? Or maybe you have seen that people will pick up trash around their own houses but not in a public park? It seems that the brain works differently when it makes decisions about taking care of things that everyone uses. A recent study helped us understand more about this."
      },
      {
        "type": "paragraph",
        "text": "A private resource means something that belongs to one person, and that person does not have to share it. It could be something like your own house or your own pencil. But when something is available for everyone to use, like public parks, libraries, forests, playgrounds, oceans, rivers, and even the air we breathe, it is called a common resource. Sadly, people do not always take as much care of common resources as they do their own private resources, but we are learning ways to make it easier for people to care for these common resources."
      },
      {
        "type": "heading",
        "text": "Common Resources Can Be Overused"
      },
      {
        "type": "paragraph",
        "text": "Sometimes, even when everyone wants to take care of a common resource and agrees to protect it, it can still get damaged or destroyed. For example, in 1992, fishermen in the Atlantic caught so many wild cod fish to sell as food that there were almost no cod left in the ocean. The ocean is a common resource because everyone can use it. The fishermen took out so many cod from the ocean so quickly that these fish did not have a chance to have babies and replenish their populations the next year. Of course, it is not good for anyone if cod become extinct, even for the fishermen! If cod are extinct, the fishermen cannot catch and sell them anymore. But, interestingly, fishermen who raised cod in their own private farms took out the right number of fish, so that their cod populations remained stable. They did not take too many cod from their private resource. So, why do you think people over-fished in the ocean but not in their own farms?"
      },
      {
        "type": "paragraph",
        "text": "This issue does not just happen with fish—it happens with other common resources that people share, too. It happens when people cut down rainforests that cannot grow back, or when they let cows eat too much grass on common fields that everyone shares, or when they take more water from a river than the rain can replace. It even happens when factories release smog into the air that we all breathe."
      },
      {
        "type": "paragraph",
        "text": "Of course, it would be better if everyone took good care of common resources. Humans need natural resources to survive. But to help people learn how to take good care of common resources, we need to know how people use their brains to make that decision. Scientists have tried to understand why people treat shared things differently from things they own privately, by studying the brain with a machine called an fMRI. fMRI is like a camera that can see inside a person’s head. It can show what part of the brain a person is using."
      },
      {
        "type": "heading",
        "text": "The Brain Helps Make Decisions"
      },
      {
        "type": "paragraph",
        "text": "In one study, four scientists worked together to look at some people’s brains while the people played a special video game. In the game, the people pretended to go fishing in a lake. The goal was to catch as many fish as possible. The people knew they were playing a video game, but they still decided to catch fish in the same way actual fishermen do in real life. Each round, they had a choice to take out a lot of fish from the lake or just a few. If they took only a few fish, there would be more fish left for the next round, and they could catch even more fish. But if they took too many fish each turn, there would be no fish left, and the game would end early, before they got enough fish to win."
      },
      {
        "type": "paragraph",
        "text": "The scientists watched a part of the brain called the ventral striatum. The ventral striatum helps people predict if something good is about to happen, and that can help people make a decision. Have you ever decided to do something because you thought it would be fun? Your ventral striatum helped you decide if a decision would lead to something that felt good. The scientists found that the people used the ventral striatum to make decisions about taking more or less fish in the game. But it is complicated."
      },
      {
        "type": "heading",
        "text": "What Happens in the Brain When Deciding to Take a Resource?"
      },
      {
        "type": "paragraph",
        "text": "When people played the fishing game by themselves, their brains worked differently than when they played with other people. When they played by themselves, the fMRI images showed that the ventral striatum expected that they would feel good when they took only a few fish. So, when they played by themselves, they made decisions to ensure the fish would be able to have babies and keep the lake full. This was good for them and good for the lake."
      },
      {
        "type": "paragraph",
        "text": "But when other players were also fishing in the game, the lake was a common resource for the players. In this case, the person’s brain did not make a decision that kept the lake full of fish. Instead, if the other players took many fish, then the person also decided to take extra fish, and the lake ran out of fish quickly. Even though they did not get as many fish this way, they still did it!"
      },
      {
        "type": "paragraph",
        "text": "When the scientists looked at the brain scans, they saw that the ventral striatum was working differently—almost like it switched to a different mode when other players were in the game. When other players were fishing from the same lake, the ventral striatum did not expect it would feel good to keep the lake full of fish. Instead, the ventral striatum showed that the players expected they would feel good if they took more fish than the other players did, even if it meant the lake would run out of fish. The person’s ventral striatum was comparing what they were getting from the lake to what the other players were getting. It tried to catch up with the other players, instead of doing what was best to keep the lake full of fish."
      },
      {
        "type": "paragraph",
        "text": "This is just like what happened with cod in the real ocean in 1992. Many people were fishing and took too many fish. But now we know more about how the brain decides how many fish to take. The fMRI brain imaging showed us that, when other people are sharing a resource, the ventral striatum “switches modes” to focus on what other people are doing, and that can lead to a decision to take too much of the resource."
      },
      {
        "type": "paragraph",
        "text": "Before this study, it might have been easy to think that people were just extra greedy sometimes, or maybe just careless and forgetful about taking too many fish. But the way the ventral striatum helps make the decision suggests that the motivation to take too much may come from social comparison in the brain. This means that people do not take extra just because they want extra, but they take extra when part of the brain is comparing what they took to what other people took."
      },
      {
        "type": "heading",
        "text": "How Does Your Brain Decide?"
      },
      {
        "type": "paragraph",
        "text": "Even though this study used a video game for fishing, the brain probably works the same way when deciding about other common resources such as forests, rivers, or even when to sharpen common pencils in the classroom. The more we know about how the brain makes these decisions for common resources, the better we can help people’s brains make good decisions that take care of natural resources in the real world. This study used both brain science and Earth Science to learn something new. More studies will be needed to find real-world ways to help people make better decisions, but this new discovery is a step in the right direction."
      },
      {
        "type": "paragraph",
        "text": "In the meantime, you can notice how your own brain is making decisions. Do you ever compare yourself to other people? Do you ever let what someone else is doing or what someone else has influence your decisions? In those situations, can you think of ways to keep focused on what is really important when you make decisions?"
      }
    ],
    "vocabulary": [
      {
        "id": "a035-v01",
        "term": "Private Resource",
        "definition": "A resource owned and controlled by one person or a small group of people.",
        "example": "A private resource means something that belongs to one person, and that person does not have to share it.",
        "synonym": ""
      },
      {
        "id": "a035-v02",
        "term": "Common Resource",
        "definition": "A resource that provides users with benefits but is open for anybody to use and nobody in particular controls it.",
        "example": "But when something is available for everyone to use, like public parks, libraries, forests, playgrounds, oceans, rivers, and even the air we breathe, it is called a common resource.",
        "synonym": ""
      },
      {
        "id": "a035-v03",
        "term": "fMRI",
        "definition": "A machine that can show what parts of the brain are being used.",
        "example": "Scientists have tried to understand why people treat shared things differently from things they own privately, by studying the brain with a machine called an fMRI. fMRI is like a camera that can see inside a person’s head.",
        "synonym": ""
      },
      {
        "id": "a035-v04",
        "term": "Ventral Striatum",
        "definition": "A brain region that helps with learning and making decisions, by figuring out if something will feel good later.",
        "example": "The scientists watched a part of the brain called the ventral striatum.",
        "synonym": ""
      },
      {
        "id": "a035-v05",
        "term": "Social Comparison",
        "definition": "Social comparison is when people decide whether something is good or not by looking at what other people have or are doing.",
        "example": "But the way the ventral striatum helps make the decision suggests that the motivation to take too much may come from social comparison in the brain.",
        "synonym": ""
      }
    ],
    "source": {
      "publisher": "Frontiers for Young Minds",
      "url": "https://kids.frontiersin.org/articles/10.3389/frym.2024.1151409",
      "authors": [
        "Ashley Zappe",
        "Mario Martinez-Saito",
        "Sandra Andraszewicz"
      ],
      "citation": "Zappe A, Martinez-Saito M and Andraszewicz S (2024) What’s Mine? What’s Ours? How the Brain Thinks About Shared Resources. Front. Young Minds. 12:1151409. doi: 10.3389/frym.2024.1151409",
      "copyright": "Copyright © 2024 Zappe, Martinez-Saito and Andraszewicz",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "adaptationNote": "Text adapted for reading practice: illustrations, figure pointers and reference markers omitted; glossary definitions retained. The original illustrated article is linked above."
    }
  },
  {
    "id": "a036",
    "slug": "what-is-a-leaf",
    "title": "What Is a Leaf?",
    "teaser": "When thinking of plants, the color green inevitably comes to mind. As perhaps the most noticeable and easily recognizable part of the natural world, leaves decorate the world green.",
    "category": "Science",
    "tags": [
      "biodiversity",
      "science",
      "petiole",
      "base",
      "blade",
      "chlorophyll",
      "stomata"
    ],
    "readMinutes": 9,
    "publishedLabel": "New",
    "cover": {
      "theme": "forest-emerald",
      "icon": "Compass",
      "motif": "SCIENCE"
    },
    "blocks": [
      {
        "type": "lead",
        "text": "When thinking of plants, the color green inevitably comes to mind. As perhaps the most noticeable and easily recognizable part of the natural world, leaves decorate the world green. If you take a close look at the plants in your yard or on your street, it is likely that you will not find two that are exactly the same. This is largely thanks to the enormous amount of diversity that exists in leaf shapes, textures, and even colors! All leaves share general characteristics that we will review in this article, but some have taken on special abilities. Some leaves are modified to look like flowers, others are modified to help the plant climb, to protect the plant from potential threats, or even to act as insect traps. We want to share with you the extraordinary world of leaves: keep reading, and you will learn the many shapes, structures, and incredible functions of leaves."
      },
      {
        "type": "heading",
        "text": "What Constitutes a Leaf?"
      },
      {
        "type": "paragraph",
        "text": "Leaves are constructed of three major parts: the petiole, the base, and the blade. Generally, the largest portion of the leaf is the blade. The base is the region of the blade that attaches to the petiole, a stalk-like structure that connects the blade of the leaf to the stem of the plant. Some leaves lack petioles and are known as sessile (immobile) leaves."
      },
      {
        "type": "paragraph",
        "text": "The leaf blade is formed of multiple cell layers. Plant cells are relatively big, and enclosed by a cell wall. Leaf cells are filled with chloroplasts, structures that contain specialized pigments called chlorophylls. Chlorophylls absorb light, allowing plants to collect energy from the sun. Leaves are green because chlorophylls absorb every color of UV light except for green. By not absorbing green, they reflect it instead, which our eyes then see. Leaves have a waxy outer layer covered with stomata, which are like mouths that open and close to allow gas exchange with the environment. Leaves must strike a balance between opening their stomata enough to allow for gas exchange and keeping them closed to prevent water loss."
      },
      {
        "type": "paragraph",
        "text": "Leaves have veins that run through the petiole to the rest of the plant. These veins are made of vascular tissues, which are the structural tissues that transport water and nutrients to all parts of the plant. If you forget to water your plant for a few weeks, you may notice the leaves start to wilt. If you add some water to the soil, however, the water will be transported all the way to the leaves, making them upright again."
      },
      {
        "type": "paragraph",
        "text": "Leaves can be large or small, symmetrical or asymmetrical, have jagged or smooth edges, and appear glossy or rough. Leaves are broadly classified into two types. Simple leaves are composed of a single blade. Compound leaves are composed of multiple blades, which are called leaflets. Leaf arrangement on the stem can be opposite, such as when two leaves grow directly across from each other, or alternating, when leaves alternate sides, one after the other."
      },
      {
        "type": "heading",
        "text": "The Life Cycle of a Leaf"
      },
      {
        "type": "paragraph",
        "text": "Many leaves develop in protected structures called leaf buds. New leaves are enclosed by protective scales that allow the fragile leaves to rest until they are ready to expand. These scales are modified leaves that do not photosynthesize. Some buds lack these protective scales and are called naked buds."
      },
      {
        "type": "paragraph",
        "text": "Throughout their lives, leaves expand in size and may also change color. In some parts of the world, the fall season is known for piles of orange, yellow, red, and brown leaves. In the fall, leaf cells accumulate more light-absorbing pigments called carotenoids. Carotenoids reflect colors such as yellow and orange. These pigments are normally at lower concentrations than chlorophyll, so they are usually masked by the green color. Trees can assess temperature and the length of daylight. As both decrease during the fall, chlorophyll starts to degrade, and the yellows and oranges of the carotenoids can shine through."
      },
      {
        "type": "paragraph",
        "text": "When trees lose their leaves, they are not dying. Before the leaves fall, trees shuttle nutrients away from the leaves to other parts of the plant, to store those nutrients for later use. Changes in the leaves weaken the bond between the petiole and the stem, and eventually the leaves naturally part with the tree. You may have heard the term “evergreen tree,” referring to trees that stay green during the winter. Some evergreen conifers (such as pine trees) keep their leaves for at least an entire year before gradually shedding older needles to make way for new ones."
      },
      {
        "type": "heading",
        "text": "Leaf Function"
      },
      {
        "type": "paragraph",
        "text": "As plants cannot move, they cannot go to the kitchen and make a sandwich when they feel hungry. Instead, they produce their own food. Organisms that do this are called “autotrophs.” Leaves serve as the main location for food production through a process called photosynthesis, which occurs in the chloroplasts. During photosynthesis, light, water, and carbon dioxide from the atmosphere are absorbed and converted into energy in the form of sugars. As a result of photosynthesis, water is split into hydrogen and oxygen. Plants release the extra oxygen through the stomata, which contributes to the air we breathe. The structure of the leaf is perfectly engineered for its role in photosynthesis. The blade is composed of cells filled with chloroplasts that capture light during the day. In most plants, stomata are more numerous on the underside of the leaf, to reduce water loss while performing gas exchange."
      },
      {
        "type": "paragraph",
        "text": "Plants release many other molecules that interact with the environment. Some plants release signals when they have been damaged. For example, the sweet scent of freshly mowed grass is a signal of distress as well as a defense mechanism to herbivore attacks. Signals like these can either attract predatory species for the herbivores, attract beneficial insects (like parasitic wasps that fend off the herbivores), or warn neighboring plants to build up their chemical defenses."
      },
      {
        "type": "paragraph",
        "text": "Some leaves are modified for functions other than photosynthesis. For instance, in climbing plants like cucumbers, some leaves coil and form tendrils, which help the plant attach to a support as it climbs. Sometimes leaves trick us into thinking that they are part of the flower, by doing an excellent job impersonating petals. An example of this is found in hydrangea blooms. Referred to as bracts, these modified leaves extend under the true flower. Their showy color attracts pollinators to the flowers they are supporting. Next time you see a hydrangea, see if you can distinguish the bracts from the true flowers. Cacti spines are also leaves that have been severely reduced to protect the plant with their sharp and pointed shapes. In cacti, photosynthesis occurs in the green stems. In carnivorous plants, rolled leaves act as insect traps, either by creating a long pitcher shape that contains enzymes or bacteria that digest insects, or by rapidly snapping shut around an insect. The leaves of carnivorous plants are usually vibrantly colored to attract insects."
      },
      {
        "type": "heading",
        "text": "Evolution of the Leaf"
      },
      {
        "type": "paragraph",
        "text": "The first plants on land more than 400 million years ago were bryophytes, which include mosses, hornworts, and liverworts. These small plants lack vascular tissues completely and they do not have leaves or roots. For example, if you look really closely at moss, you may observe small, green, leaf-like structures; however, these are not true leaves because they lack vascular tissues. True leaves first evolved in vascular plants, which include the lycophytes, ferns, and seed plants. There are several hypotheses as to how leaves evolved. They may have evolved from plant branches that became flattened and fused, leading to the structure we now know as the leaf; or leaves may have evolved from plant reproductive structures. It is now accepted that leaves have evolved independently in several plant families. By studying fossils and DNA, evolutionary biologists are still investigating how many times leaves evolved independently."
      },
      {
        "type": "heading",
        "text": "Distinctive Leaves"
      },
      {
        "type": "paragraph",
        "text": "Some plants have very unique leaf structures. For example, some plants have only one solitary leaf. Amorphophallus konjac develops a single compound leaf each year, with the petiole extending into the ground, such that the leaf appears like a small tree. Another distinctive leaf is from Raphia regalis, one of the longest leaves in the world, with one leaf having a recorded measurement of 28 m (91 feet). Imagine a leaf about the same length as a basketball court! Another unique leaf is from Ruscus hypoglossum, which has its flowers located on top of the leaf blade."
      },
      {
        "type": "heading",
        "text": "Let Us Observe Together!"
      },
      {
        "type": "paragraph",
        "text": "Now you know that there is lots of diversity in leaf structure and function that contributes to keeping plants alive and healthy: leaves come in many shapes and sizes, and their role extends beyond just performing photosynthesis. It is always a great time to go outside and collect leaves, even in the winter! We created a leaf bingo for you to use the next time you go outside. How many different types of leaves can you find? Have fun!"
      }
    ],
    "vocabulary": [
      {
        "id": "a036-v01",
        "term": "Petiole",
        "definition": "The stalk that connects the leaf blade to the stem or meristem of the plant.",
        "example": "Leaves are constructed of three major parts: the petiole, the base, and the blade.",
        "synonym": ""
      },
      {
        "id": "a036-v02",
        "term": "Base",
        "definition": "The region of the leaf blade that connects to the petiole.",
        "example": "Leaves are constructed of three major parts: the petiole, the base, and the blade.",
        "synonym": ""
      },
      {
        "id": "a036-v03",
        "term": "Blade",
        "definition": "The broad portion of the leaf, which is also sometimes referred to as the lamina.",
        "example": "Leaves are constructed of three major parts: the petiole, the base, and the blade.",
        "synonym": ""
      },
      {
        "id": "a036-v04",
        "term": "Chlorophyll",
        "definition": "The pigment that absorbs and captures energy from the sun.",
        "example": "These pigments are normally at lower concentrations than chlorophyll, so they are usually masked by the green color.",
        "synonym": ""
      },
      {
        "id": "a036-v05",
        "term": "Stomata",
        "definition": "Pores on the surface of plant tissues (such as leaves) that allow gas exchange with the environment.",
        "example": "Leaves have a waxy outer layer covered with stomata, which are like mouths that open and close to allow gas exchange with the environment.",
        "synonym": ""
      },
      {
        "id": "a036-v06",
        "term": "Vascular Tissues",
        "definition": "Plant tissues that transport water up and down the plant body.",
        "example": "These veins are made of vascular tissues, which are the structural tissues that transport water and nutrients to all parts of the plant.",
        "synonym": ""
      },
      {
        "id": "a036-v07",
        "term": "Photosynthesis",
        "definition": "The process by which energy from the sun, carbon dioxide, and water are converted into plant food.",
        "example": "Organisms that do this are called “autotrophs.” Leaves serve as the main location for food production through a process called photosynthesis, which occurs in the chloroplasts.",
        "synonym": ""
      }
    ],
    "source": {
      "publisher": "Frontiers for Young Minds",
      "url": "https://kids.frontiersin.org/articles/10.3389/frym.2022.659623",
      "authors": [
        "Ellie Mendelson",
        "Cecilia Zumajo-Cardona",
        "Barbara A. Ambrose"
      ],
      "citation": "Mendelson E, Zumajo-Cardona C and Ambrose BA (2022) What Is a Leaf?. Front. Young Minds. 10:659623. doi: 10.3389/frym.2022.659623",
      "copyright": "Copyright © 2022 Mendelson, Zumajo-Cardona and Ambrose",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "adaptationNote": "Text adapted for reading practice: illustrations, figure pointers and reference markers omitted; glossary definitions retained. The original illustrated article is linked above."
    }
  },
  {
    "id": "a037",
    "slug": "how-trees-make-tea",
    "title": "How Trees Make Tea",
    "teaser": "Tea is a mix of natural plant chemicals dissolved in water. You should not drink it, but a weak tea drips through a tree’s branches and runs down its trunk when it is raining.",
    "category": "Science",
    "tags": [
      "earth sciences explore the collection",
      "science",
      "carbon cycle",
      "photosynthesis",
      "organic",
      "respiration",
      "tree tea"
    ],
    "readMinutes": 10,
    "publishedLabel": "New",
    "cover": {
      "theme": "forest-emerald",
      "icon": "Compass",
      "motif": "SCIENCE"
    },
    "blocks": [
      {
        "type": "lead",
        "text": "Tea is a mix of natural plant chemicals dissolved in water. You should not drink it, but a weak tea drips through a tree’s branches and runs down its trunk when it is raining. The main ingredients in both tea and tree tea are organic molecules. Some, like tannins, are colorful and give tea and tree tea their brownish colors. Others, including sugars, are clear and loaded with energy. Some molecules build up on the tree’s surface as it sweats. Other molecules are deposited on the tree by the wind, building up like grime on a car. When it rains, the built up sweat and dirt are washed away as tree tea. Tree tea is an energy drink that bacteria on the forest floor crave! Tree tea is also a flow of carbon from trees to soils that researchers are just beginning to understand."
      },
      {
        "type": "heading",
        "text": "The Role of Trees in the Carbon Cycle and Climate"
      },
      {
        "type": "paragraph",
        "text": "Humans are changing the Earth. Our use of fossil fuels has increased the concentration of the greenhouse gas carbon dioxide in the atmosphere, which is warming the planet. Scientists recognized over 100 years ago that global warming would be a side effect of fossil fuel use. This led researchers to study the natural carbon cycle, to see how human use of fossil fuel carbon and the natural carbon cycle interact to shape our climate. Today we have a good understanding of how carbon cycles around the world. Trees on land take carbon dioxide out of the atmosphere, using a process called photosynthesis. Photosynthesis uses the sun’s energy to make sugars and other organic carbon molecules from carbon dioxide. Humans, other animals, and bacteria use the organic carbon molecules created by trees for energy. When we eat a sandwich or add sugar to our tea, the energy we gain was originally from the sun. When we and other organisms use the organic carbon and energy in foods, we convert the organic carbon back to carbon dioxide, which is released when we breathe out. Scientists call this process of using organic carbon for energy and releasing carbon dioxide respiration. The carbon dioxide produced by respiration goes back into the atmosphere. When scientists study the carbon cycle, they are interested in how much of the carbon taken from the atmosphere by photosynthesis is converted back to carbon dioxide by respiration. To understand this on land, they need to follow organic carbon from where it is created in trees out into the wider world."
      },
      {
        "type": "paragraph",
        "text": "Often, when trees and forests are in the news, they are mentioned as important carbon stores. To store carbon, trees take carbon dioxide from the air and use it to build their leaves, branches, trunks, and roots. As trees can live a long time and grow to be big, they can store lots of carbon. When forests are burnt by people or wildfires, the carbon the trees worked so long to store is sent back into the atmosphere as carbon dioxide. Adding this carbon dioxide back into the atmosphere adds to climate warming. Although the best way to reduce climate change is to reduce the use of fossil fuels, protecting and regrowing Earth’s forests is also important."
      },
      {
        "type": "paragraph",
        "text": "Trees are the architects and the architecture of forests. As well as building the forests, trees and other plants provide most of the organic carbon and energy for all the other creatures on the land and in freshwater like rivers, and even for some of the creatures in the ocean. To feed the organisms in these different environments, organic carbon from trees must be transported from the trees to these other places. There is a general flow of organic carbon from trees to the soil, into rivers, and eventually out into the oceans. Most of the organic carbon from trees makes its way to the soil when leaves fall from trees or when trees die. However, there is another way for organic carbon to reach the forest floor: as tree tea."
      },
      {
        "type": "heading",
        "text": "Preparing to Make Tree Tea"
      },
      {
        "type": "paragraph",
        "text": "When it is dry, trees sweat. The name for this sweat is evapo-transpiration. As trees sweat, they get dirty, just like us. Some of this dirt is organic carbon. When it is dry, trees also pick up organic carbon, and other dirt from the air. This is like the grime we might find on our skin after we exercise somewhere dusty or that we find building up on cars and windows. The organisms that live in trees can also add organic substances to the mix. Then, when it rains, all these different types of organic carbon are washed off trees and fall to the forest floor as tree tea: a wonderful molecular mix that fuels forest floor microbial tea parties."
      },
      {
        "type": "heading",
        "text": "How Trees Brew Weaker and Stronger Teas"
      },
      {
        "type": "paragraph",
        "text": "There are two main flow paths rain can take to the forest floor, and each creates a different strength of tea. The largest flow is as throughfall. Throughfall is the rain that drips through leaves and branches, bouncing from leaf to branch and then falling on your head if you walk under a tree. Throughfall tea is a lightly colored brew. The other, much smaller flow path is called stemflow. Stemflow is the rainwater that flows along the tree’s branches and then down the trunk of the tree to the forest floor. This water spends more time in contact with the tree’s surface. Just like letting a tea bag soak, the long, close contact between stemflow and the tree makes for a rich, dark brown tea. So throughfall makes a light tea and stemflow a dark tea. Although throughfall is a lighter tea, much more rain reaches the forest floor as throughfall compared to stemflow. Thus, throughfall supplies 5–400 times more carbon to the forest floor than stemflow does."
      },
      {
        "type": "heading",
        "text": "How Trees Make Different Teas"
      },
      {
        "type": "paragraph",
        "text": "If we make tea from black tea leaves, we get a brown, caffeinated brew. If we make tea from mint leaves, we get a light green, minty tea. It is the same for tree tea—different trees make different teas. Live oak trees in Savannah, Georgia, USA, are covered in other small plants and mosses called epiphytes. The sweaty limbs of these oak trees result in rich, brown teas when washed clean by rainwater. In Vermont, USA, rain falling on sugar maple trees makes a golden, syrup-colored tea, while a yellower brew washes off yellow birch trees. Although the sugar maple stemflow may look sweet, the molecules that give tree tea its color may not be sweet at all, and you should not drink them. The same way tea, coffee, and orange juice have different colors and chemistries, different tree tea colors are also due to chemical differences in the molecules made and released by different trees."
      },
      {
        "type": "heading",
        "text": "Who Drinks Tree Tea?"
      },
      {
        "type": "paragraph",
        "text": "You should not drink tree tea because it may contain potentially unhealthy ingredients. So, who does drink it? Although other organisms on the forest floor, like fungi and animals, may use the organic carbon in tree tea, bacteria are its most important and voracious consumers. Although we cannot see them, these tiny microbes are critical for the health of forest soils and for carbon cycling. Just like us, bacteria need food and water. Laboratory experiments have shown that bacteria can use the organic carbon in tree tea. When it is dry under the trees, they can survive. But when it rains, they really come alive. Stemflow runs down the tree trunk and throughfall drips from drip points in the branches, piping tree tea energy drinks to fuel hotspots of bacterial activity. While we may like to sip tea in the sunshine, the tea shops of the forest floor open in a downpour."
      },
      {
        "type": "heading",
        "text": "Bacteria, The Tiny Consumers That Drive the Carbon Cycle"
      },
      {
        "type": "paragraph",
        "text": "As well as being lovers of tree tea, bacteria are one of the most important groups of organisms on Earth. There are about 8 billion people on the Earth today and collectively we add up to about 0.06 billion tons of carbon. Trees are the largest living store of carbon on Earth, totaling 450 billion tons of carbon. Although they are so tiny we cannot see them, bacteria are so numerous that they add up to an estimated 70 billion tons of carbon. So, bacteria are not just numerous, they are a major store of carbon globally and they are one of the main users of organic carbon on Earth. Bacteria have a mixed diet. They can consume almost all forms of organic carbon, including the organics in soils, in sea and fresh water, and in decaying plants and animals. Bacteria in your stomach also help digest what you eat, so both you and they can access the organic carbon in your food."
      },
      {
        "type": "heading",
        "text": "How Will Tree Tea Shops Change as the World Warms?"
      },
      {
        "type": "paragraph",
        "text": "Tree tea is important to forest soils, forest bacteria, and to ecosystems downstream of forests, such as rivers and the ocean. Natural patterns drive the delivery of tree tea to the forest floor. Where trees grow and when they lose their leaves influence when and where organic carbon is available to make tree tea. Patterns in rainfall influence when and where rain washes trees clean and carries tree tea to the forest floor. People are changing when and where tree tea is made. Deforestation, agriculture, and urbanization have altered the distribution of trees across the planet. Climate change is altering where certain trees can live, as well as when trees grow their leaves in spring, when they flower, and when they lose their leaves in fall. Climate change is also altering when, where, and how strongly it rains. All these factors need to be understood to predict how the delivery of tree tea will change in the future and whether changes in the amount and flavors of tree tea available will affect how downstream ecosystems function. There is plenty still to discover about tree tea. Grab a coat and a cup, and help make the next breakthrough in understanding forest brewing."
      }
    ],
    "vocabulary": [
      {
        "id": "a037-v01",
        "term": "Carbon Cycle",
        "definition": "The study of how carbon moves around the world and is transformed from one form of molecule to another. Understanding the carbon cycle is critical to predicting our future climate.",
        "example": "This led researchers to study the natural carbon cycle, to see how human use of fossil fuel carbon and the natural carbon cycle interact to shape our climate.",
        "synonym": ""
      },
      {
        "id": "a037-v02",
        "term": "Photosynthesis",
        "definition": "The process by which green plants and some other organisms use sunlight to synthesize organic molecules from carbon dioxide and water.",
        "example": "Trees on land take carbon dioxide out of the atmosphere, using a process called photosynthesis.",
        "synonym": ""
      },
      {
        "id": "a037-v03",
        "term": "Organic",
        "definition": "Containing hydrogen and carbon. This is different from “organic” produce in the supermarket. Examples of organic molecules include sugars, oils, proteins, and wood.",
        "example": "The main ingredients in both tea and tree tea are organic molecules.",
        "synonym": ""
      },
      {
        "id": "a037-v04",
        "term": "Respiration",
        "definition": "The use of organic molecules by organisms for energy. When we, trees and most bacteria respire, we use up organic carbon and oxygen, producing carbon dioxide, water and energy.",
        "example": "Scientists call this process of using organic carbon for energy and releasing carbon dioxide respiration.",
        "synonym": ""
      },
      {
        "id": "a037-v05",
        "term": "Tree Tea",
        "definition": "The solution made when it rains on trees. Tree tea contains a mix of organic molecules that bacteria consume, but you should not drink.",
        "example": "The main ingredients in both tea and tree tea are organic molecules.",
        "synonym": ""
      },
      {
        "id": "a037-v06",
        "term": "Evapo-transpiration",
        "definition": "The combined loss of water to the air from plants and is the sum of evaporation from and transpiration (sweating) by plants.",
        "example": "The name for this sweat is evapo-transpiration.",
        "synonym": ""
      },
      {
        "id": "a037-v07",
        "term": "Throughfall",
        "definition": "The portion of rain that makes it to the forest floor by dripping through leaves and branches.",
        "example": "The largest flow is as throughfall.",
        "synonym": ""
      },
      {
        "id": "a037-v08",
        "term": "Stemflow",
        "definition": "The portion of rain that makes it to the forest floor by flowing down tree trunks.",
        "example": "The other, much smaller flow path is called stemflow.",
        "synonym": ""
      }
    ],
    "source": {
      "publisher": "Frontiers for Young Minds",
      "url": "https://kids.frontiersin.org/articles/10.3389/frym.2022.703704",
      "authors": [
        "Aron Stubbins",
        "Kevin A. Ryan",
        "John Van Stan"
      ],
      "citation": "Stubbins A, Ryan KA and Van Stan J (2022) How Trees Make Tea. Front. Young Minds. 10:703704. doi: 10.3389/frym.2022.703704",
      "copyright": "Copyright © 2022 Stubbins, Ryan and Van Stan",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "adaptationNote": "Text adapted for reading practice: illustrations, figure pointers and reference markers omitted; glossary definitions retained. The original illustrated article is linked above."
    }
  },
  {
    "id": "a038",
    "slug": "millions-of-monarch-butterflies-and-the-quest-to-count-them",
    "title": "Millions of Monarch Butterflies and the Quest to Count Them",
    "teaser": "Monarchs are capable of amazing feats! They transition from caterpillars to beautiful butterflies.",
    "category": "Science",
    "tags": [
      "biodiversity explore the collection",
      "science",
      "pollination",
      "migration",
      "cloud forest",
      "lidar",
      "sve"
    ],
    "readMinutes": 9,
    "publishedLabel": "New",
    "cover": {
      "theme": "forest-emerald",
      "icon": "Compass",
      "motif": "SCIENCE"
    },
    "blocks": [
      {
        "type": "lead",
        "text": "Monarchs are capable of amazing feats! They transition from caterpillars to beautiful butterflies. During migration, they fly for thousands of miles—from the northern part of the United States and southern Canada to Mexico. But monarch butterflies are in trouble. In the past 25 years, citizens and scientists have reported fewer and fewer of them. There were less than half as many monarchs in 2020 as in 2019. Parks across the United States, like Rocky Mountain and Indiana Dunes National Parks, host the monarchs along their migration paths. The park rangers are helping scientists track monarchs through “capture, tag, and release.” With this method, anyone who sees a tagged butterfly can report when and where they saw it. By tracking monarchs along their migration paths, we expect to learn where they run into problems. Scientists are also using new technology to count monarchs in their winter habitats."
      },
      {
        "type": "heading",
        "text": "Why Monarchs?"
      },
      {
        "type": "paragraph",
        "text": "Have you seen orange wings fluttering by? Or maybe you have seen a green caterpillar eating a milkweed plant? Certain caterpillars transition into the popular orange-and-black monarch butterflies. Monarchs do important work in the ecosystem. While these insects feed on nectar, they also move pollen between plants. Pollination helps plants reproduce. When pollination is successful, there is more food available for all types of animals, including people! While monarchs help create food for us, they are also a good source of food for birds, other insects, and small animals (though they have ways of defending themselves according to https://monarchwatch.org/biology/pred1.htm)."
      },
      {
        "type": "paragraph",
        "text": "There are two different populations of monarch butterflies. One population spends winters in California (United States) and travels through state and national parks west of the Rocky Mountains; the other population, called the Eastern population, stays east of the Rocky Mountains. We will focus on the much larger Eastern population. These butterflies travel thousands of miles every year, from southern Canada all the way to Mexico. This event is called migration. Imagine traveling thousands of miles (up to 4,000 km, which is 2,500 miles) under your own power! That is almost like traveling from New York to Los Angeles! Butterflies make the trip only once in their lifetimes. This makes monarchs very interesting to scientists—how do monarchs know where to go if they have never been there?"
      },
      {
        "type": "paragraph",
        "text": "Since these creatures are helpful to ecosystems across North America, it is very important to keep track of their population sizes. The best way to count Eastern monarchs is in Mexico in the winter, when all Eastern monarchs snuggle together in the trees of protected cloud forests. The rest of the year, monarchs are spread out across the United States and Canada and are too difficult to count. Mexican cloud forests have the perfect temperature and humidity for monarchs. Areas further north are too cold; monarchs can freeze to death. Areas further south are too warm for the plants monarchs depend on for food. Monarchs crowd into these few places in Mexico during the winter because conditions are just right."
      },
      {
        "type": "heading",
        "text": "Traveling to Mexico"
      },
      {
        "type": "paragraph",
        "text": "As they migrate to Mexico, monarchs must rest along the way. Some of their rest stops are in Indiana Dunes and Rocky Mountain National Parks in the United States, where staff and visitors have been monitoring monarchs for 15 years. Monarch monitors catch monarchs with butterfly nets, gently put little tags on them, and release them. This method is called “capture, tag, and release.” The tags look like little stickers with numbers on them. Anyone who sees a monarch with a tag can write down the number and report it online to an organization called Monarch Watch. The stickers work like car license plates—you can tell which state a car came from no matter where it is seen. This way, researchers can piece together the path of that specific monarch. If the butterfly does not make it to Mexico, researchers can figure out where it was last seen and maybe even why it ran into trouble. Anyone, including you, can help researchers collect this information! Whenever you see a monarch with a tag, write down the number and report it to MonarchWatch.org! On this website you can see how the number of butterflies goes up and down. The numbers go up as more monarchs are sighted, and they go down if the monarchs get caught in storms or fires."
      },
      {
        "type": "heading",
        "text": "Counting Millions of Butterflies"
      },
      {
        "type": "paragraph",
        "text": "Monarchs cluster together on fir trees high in the cloud forests of Michoacán, Mexico. Scientists have been wondering how to accurately count so many monarchs. The problem is that monarchs come in extremely large numbers, and they hang on to the trees in very dense groups. If you did not know you were among butterflies, you might think you were walking through trees with blankets tossed over them! This has made it very difficult for scientists to be sure they are getting correct numbers. Picture it this way: you are asked to estimate the number of M&Ms in a giant jar in front of you. When they are all clumped together in the jar, it is difficult! If you could line them up, it would be much easier."
      },
      {
        "type": "paragraph",
        "text": "What if you had super eyesight and could count the shapes of the hidden butterflies to get your answer? Scientists have that technology today! It is a laser-beam technology called LiDAR, for light detection and ranging. LiDAR technology uses a laser scanner, which is like a camera. But instead of making a two-dimensional image (like a drawing of a square on a piece of paper), it makes a digital, three-dimensional model (like a Rubik’s cube). To generate the model, the LiDAR scanner sends out millions of laser beams to record the positions and distances of objects in the environment. Two scientists, Louise Allen and Nickolay Hristov, decided to use LiDAR to estimate large populations of animals that cluster together. To find out how many monarch butterflies were in the forest, the scientists scanned the forest two times: first when there were no butterflies, and then when the butterflies were covering the trees. Since the laser scans show detail in three dimensions, they can be used to figure out how much space something in the image takes up (its volume). They subtracted the volume of the bare trees from the volume of the covered trees, to get the volume of just the butterflies (laser SVE). Since scientists can estimate the typical volume of one monarch, they can divide the total volume by the volume of one butterfly, to estimate the total number of monarchs in the forest."
      },
      {
        "type": "paragraph",
        "text": "Before this new method, SVE scientists estimated that, between 2000 and 2020, the monarch population was between 1.6 and 1.5 billion butterflies. That is like saying you either have $70 or $70,000, you are not sure which, but at any time the amount is somewhere in that range. That is a big range. Of course, the number of butterflies changes every year. If the techniques for estimating the numbers of monarchs are not accurate, it is difficult to tell if efforts like milkweed plantings are making a difference. We need the most accurate numbers to understand whether there is a big problem with monarch populations. In the past 2 years alone, the estimated number of monarchs dropped by half according to the area estimations."
      },
      {
        "type": "paragraph",
        "text": "With LiDAR, more accurate counts of monarchs in Mexico are possible. Using LiDAR technology, scientists can compare a baseline count taken today to future scans. If future scans show an increase in monarchs, it will tell us that whatever help we are providing for monarchs is successful."
      },
      {
        "type": "heading",
        "text": "The Challenges"
      },
      {
        "type": "paragraph",
        "text": "We know monarch butterflies face many challenges. Besides the storms and fires that kill them, monarchs only eat and lay their eggs on the leaves of the milkweed plant. Milkweeds are getting harder to find because people often kill these plants with herbicides or other chemicals. As we build more houses, stores, and parking lots, we lose space for plants and trees, including milkweeds. The same is true at the end of the monarch migration route in Mexico. More houses, stores, farms, and factories mean fewer trees where monarchs can spend the winter. Mexicans who grew up seeing thousands of monarchs are working hard to preserve the cloud forest habitats, so the monarchs have a place to go. Monarchs have also suffered the effects of changing weather patterns, like more frequent storms, sudden drops in temperature, and excessive rain."
      },
      {
        "type": "heading",
        "text": "Why We Care"
      },
      {
        "type": "paragraph",
        "text": "We all benefit from monarchs. They help us by pollinating the plants we eat. We can use new technologies to track and count monarchs, which will help us learn how best to protect them. National parks, both in the United States and Mexico, have a big role to play in protecting monarchs. We can all help decrease the dangers monarchs face by helping to preserve forest areas, limiting the use of chemicals, and leaving milkweed plants in place for monarch habitats. Let us continue the hard work so that we can see larger numbers of monarchs across North America. Help save monarchs! Visit www.monarchwatch.org or www.xerces.org/monarchs to learn more."
      }
    ],
    "vocabulary": [
      {
        "id": "a038-v01",
        "term": "Pollination",
        "definition": "Transfer of dust-like pollen particles from the flower of one plant to another (or to a reproductive part of the same plant). Pollination is essential for plant reproduction.",
        "example": "Pollination helps plants reproduce.",
        "synonym": ""
      },
      {
        "id": "a038-v02",
        "term": "Migration",
        "definition": "Movement of wildlife or people to find a location that is optimal for finding food and safety for the next generation. For birds and insects, migration is often seasonal.",
        "example": "During migration, they fly for thousands of miles—from the northern part of the United States and southern Canada to Mexico.",
        "synonym": ""
      },
      {
        "id": "a038-v03",
        "term": "Cloud Forest",
        "definition": "Cloud forests are like rain forests: they exist in tropical areas. Cloud forests are all at high elevations where low clouds filter through the trees and produce precipitation.",
        "example": "Mexicans who grew up seeing thousands of monarchs are working hard to preserve the cloud forest habitats, so the monarchs have a place to go.",
        "synonym": ""
      },
      {
        "id": "a038-v04",
        "term": "LiDAR",
        "definition": "Light detection and ranging. A technique in which a camera-like device directs a beam of light into a space and measures the distance to the first solid object it hits.",
        "example": "It is a laser-beam technology called LiDAR, for light detection and ranging.",
        "synonym": ""
      },
      {
        "id": "a038-v05",
        "term": "SVE",
        "definition": "Subtractive Volume Estimation. A method for estimating the number of animals in dense groups by analyzing the shape and volumes of these groups when scanned with LiDAR.",
        "example": "They subtracted the volume of the bare trees from the volume of the covered trees, to get the volume of just the butterflies (laser SVE).",
        "synonym": ""
      }
    ],
    "source": {
      "publisher": "Frontiers for Young Minds",
      "url": "https://kids.frontiersin.org/articles/10.3389/frym.2022.718328",
      "authors": [
        "Sophie Phillips",
        "Martha Merson",
        "Louise C. Allen",
        "Nickolay I. Hristov"
      ],
      "citation": "Phillips S, Merson M, Allen LC and Hristov NI (2022) Millions of Monarch Butterflies and the Quest to Count Them. Front. Young Minds. 10:718328. doi: 10.3389/frym.2022.718328",
      "copyright": "Copyright © 2022 Phillips, Merson, Allen and Hristov",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "adaptationNote": "Text adapted for reading practice: illustrations, figure pointers and reference markers omitted; glossary definitions retained. The original illustrated article is linked above."
    }
  },
  {
    "id": "a039",
    "slug": "how-beavers-are-changing-arctic-landscapes-and-earths-climate",
    "title": "How Beavers Are Changing Arctic Landscapes and Earth’s Climate",
    "teaser": "Beavers build dams that change the way water moves between streams, lakes, and the land. In Alaska, beavers are moving north from the forests into the Arctic tundra.",
    "category": "Science",
    "tags": [
      "earth sciences explore the collection",
      "science",
      "arctic tundra",
      "climate models",
      "permafrost",
      "thermokarst",
      "organic carbon"
    ],
    "readMinutes": 9,
    "publishedLabel": "New",
    "cover": {
      "theme": "ocean-teal",
      "icon": "Compass",
      "motif": "SCIENCE"
    },
    "blocks": [
      {
        "type": "lead",
        "text": "Beavers build dams that change the way water moves between streams, lakes, and the land. In Alaska, beavers are moving north from the forests into the Arctic tundra. When beavers build dams in the Arctic, they cause frozen soil, called permafrost, to thaw. Scientists are studying how beavers and the thawing of permafrost are impacting streams and rivers in Alaska’s national parks. For example, permafrost thaw from beavers can add harmful substances like mercury to streams. Mercury can be taken up by stream food webs, including fish, which then become unhealthy to eat. Permafrost thaw can also move carbon (from dead plants) to beaver ponds. When this carbon decomposes, it can be released from beaver ponds into the air as greenhouse gases, which cause Earth’s climate to warm. Scientists are trying to keep up with these busy beavers to better understand how they are changing Arctic landscapes and Earth’s climate."
      },
      {
        "type": "heading",
        "text": "Beavers Are Ecosystem Engineers"
      },
      {
        "type": "paragraph",
        "text": "Beavers are ecosystem engineers that build dams. The dams change the way water moves between streams, rivers, lakes, and the land around them. Beaver dams in streams block the flow of water, making ponds that flood nearby soils. Scientific studies of beaver ponds in the western United States and Canada show that beavers can impact water quality. Beavers can change the amounts of nutrients (which act like fertilizers), carbon (from dead plant material), and harmful substances (like mercury) in streams and lakes. Beavers can also cause the spread of diseases like Giardia (sometimes called beaver fever). This disease makes people sick if they drink unfiltered water from streams. Beavers also create habitats for fish and wildlife, and they can also affect landscapes by encouraging growth of vegetation and limiting the spread of wildfires. Given all of this, there is good reason why people use the phrase “busy as a beaver”!"
      },
      {
        "type": "heading",
        "text": "Beavers Are Moving North in Alaska"
      },
      {
        "type": "paragraph",
        "text": "Beavers typically live in regions with forests. They use trees, branches, mud, and rocks to build dams and lodges. In Alaska, beavers have mainly lived in the boreal forests in the lower part of the state. But scientists recently discovered that beavers are moving north, beyond Alaska’s boreal forests and into the Arctic tundra. Using satellite images, researchers can see that, over the last 30 years, beaver ponds have increased in northwest Alaska. Beavers are moving into new habitat in Alaska’s Arctic national parks, including Bering Land Bridge National Preserve, Cape Krusenstern National Monument, and Noatak National Preserve."
      },
      {
        "type": "paragraph",
        "text": "Beaver numbers have changed due to both trapping and climate change. In the 1800s, people used to trap beavers for their valuable fur, which kept the number of beavers in the region low. By the 1900s, new laws slowed beaver trapping, which caused the number of beavers to increase. In the past, the Arctic was too cold and lacked both beaver food and the large sticks needed for building their homes and dams. But the climate is warming rapidly in Alaska—much faster than in the rest of the United States. As it gets warmer, trees and shrubs can grow farther north. This new growth provides the wood beavers can use to build dams and lodges. Other mammals, like snowshoe hares and moose, are also moving north as Earth’s climate warms and shrubs grow bigger. Climate models—or computer simulations—predict that Alaska’s climate will continue to warm for tens of years into the future. As a result, scientists believe that the number of beavers will continue to increase, and they will expand throughout the Alaskan Arctic. Scientists from the US Geological Survey, the National Park Service, and the University of Alaska Fairbanks are currently studying beavers to understand how they are changing Arctic lands and waters."
      },
      {
        "type": "heading",
        "text": "Do Beavers Cause Permafrost To Thaw?"
      },
      {
        "type": "paragraph",
        "text": "Beaver ponds in the Arctic are different from beaver ponds in the rest of the US due to the presence of permafrost. Permafrost, or frozen soil, is an important feature of Arctic regions like Alaska. Permafrost forms in cold climates. Most permafrost has remained frozen for hundreds or even thousands of years. But recent climate warming in the Arctic is causing permafrost to thaw. Perhaps permafrost is not permanent after all! When permafrost thaws, the ice melts, water flows away, and the ground surface can collapse. In Arctic towns and cities, permafrost thaw can also cause houses to collapse and roads to break."
      },
      {
        "type": "paragraph",
        "text": "New beaver ponds flood the surrounding Arctic permafrost soils. During summer, the relatively warm pond water causes the permafrost to warm and rapidly thaw in a process known as thermokarst. This permafrost thaw can occur beneath ponds, making ponds deeper over time. Permafrost thaw can also happen around the edges of ponds. This increases the surface area of beaver ponds as the pond banks thaw, collapse, and erode over time. It is clear how beaver ponds can change the land and streams. How can they impact water quality and climate change?"
      },
      {
        "type": "heading",
        "text": "Beaver Effects on Water Quality and Fish"
      },
      {
        "type": "paragraph",
        "text": "Permafrost stores large amounts of organic carbon and nutrients. Think of carbon and nutrients as food for stream plants and algae. Algae grow attached to rocks and wood or they float in the water. Algae and other water plants make up the base of the food web. They support bugs, fish, and all other animals that eat plants. For example, moose are often spotted eating plants out of beaver ponds. When carbon and nutrients are frozen in permafrost, it is like storing food in a freezer. When permafrost thaws, it is like you are transferring the food from the freezer to the refrigerator. When the food thaws, it can be eaten, or it can decompose."
      },
      {
        "type": "paragraph",
        "text": "As we discussed earlier, beavers can cause permafrost soils to thaw by building ponds. In that way, beavers cause the release of carbon and nutrients from permafrost into ponds and streams. Water quality is a measure of how safe that water is for people or an ecosystem1. Scientists do not yet know the consequences of beaver ponds on water quality and stream food webs. A recent study found carbon from thawing permafrost in the muscles of Arctic fish species. Species called Arctic Grayling and Dolly Varden had permafrost carbon in their muscles because it was in their food. Permafrost carbon enters the food web through algae and moves up the food chain through bugs to fish. It is possible that beaver ponds are a great place for some fish species because permafrost carbon can support their growth and energy needs."
      },
      {
        "type": "paragraph",
        "text": "One concern of scientists, national park managers, and fishermen is the release of mercury, a metal, from thawing permafrost into beaver ponds. In addition to carbon and nutrients, permafrost stores large amounts of mercury. Some forms of mercury are toxic and can be taken up by stream food webs. To better understand this release of mercury, we visited beaver ponds in northwest Alaska to make scientific observations and collect water and fish samples. Our research on Arctic beaver ponds in national parks shows that beaver ponds can be “hotspots” for toxic mercury. For instance, we found that toxic forms of mercury can account for up to 80% of total mercury in beaver pond sediments. If people eat fish with high amounts of mercury, it can negatively affect their health. Therefore, it is important to determine if beaver ponds are causing mercury to accumulate in Arctic fish."
      },
      {
        "type": "heading",
        "text": "Can Beavers Impact Earth’s Climate?"
      },
      {
        "type": "paragraph",
        "text": "When permafrost thaws and carbon moves from the freezer to the refrigerator, this thawed carbon can also move from the soil to the air. Soil bacteria can decompose the thawed carbon, similar to the way animals chew and digest food. By doing so, these bacteria produce the greenhouse gases carbon dioxide (CO2) and methane (CH4). These greenhouse gases are the main reason why Earth’s climate has been warming so quickly over the last 40–50 years. Beaver ponds and other shallow Arctic lakes release lots of methane to the atmosphere. We expect that permafrost will continue to thaw and more carbon will be released to the atmosphere as beavers move north. By adding more greenhouse gases to Earth’s atmosphere, beavers may be contributing to Earth’s warming climate! However, scientists do not know how large of an impact beavers will have on climate. We will continue to study these ecosystems to better understand the importance of beavers to the Arctic and to Earth’s climate."
      },
      {
        "type": "paragraph",
        "text": "As ecosystem engineers, beavers have a large effect on ecosystems. Now that beavers have moved north into the Arctic tundra, their effects could be even greater. The combination of beavers and permafrost thaw makes tundra streams exciting places to study. It is important to understand the effects of these changes throughout the food web, to the climate, and to people. We are just now beginning to understand all the different things that change when beavers make a tundra stream their home. In the future, we will collect more water and fish samples to better understand the effects of beavers on mercury and greenhouse gases. Now, scientists are as busy as beavers."
      }
    ],
    "vocabulary": [
      {
        "id": "a039-v01",
        "term": "Arctic Tundra",
        "definition": "The region north of the boreal forest. Arctic tundra ecosystems are cold, with small plants (such as moss and lichen) and permafrost soils.",
        "example": "In Alaska, beavers are moving north from the forests into the Arctic tundra.",
        "synonym": ""
      },
      {
        "id": "a039-v02",
        "term": "Climate Models",
        "definition": "Complex computer programs that use math to understand Earth’s climate. Climate models can be used to study how land, air, and oceans interact to affect the climate.",
        "example": "Climate models—or computer simulations—predict that Alaska’s climate will continue to warm for tens of years into the future.",
        "synonym": ""
      },
      {
        "id": "a039-v03",
        "term": "Permafrost",
        "definition": "Soil that has remained frozen for at least two straight years, although most permafrost has been frozen for much longer.",
        "example": "When beavers build dams in the Arctic, they cause frozen soil, called permafrost, to thaw.",
        "synonym": ""
      },
      {
        "id": "a039-v04",
        "term": "Thermokarst",
        "definition": "When icy permafrost soils thaw, the ground surface can collapse. This process is known as thermokarst.",
        "example": "During summer, the relatively warm pond water causes the permafrost to warm and rapidly thaw in a process known as thermokarst.",
        "synonym": ""
      },
      {
        "id": "a039-v05",
        "term": "Organic Carbon",
        "definition": "Carbon that forms from living things, such as plant or animals. In the Arctic, soils store lots of organic carbon.",
        "example": "Permafrost stores large amounts of organic carbon and nutrients.",
        "synonym": ""
      },
      {
        "id": "a039-v06",
        "term": "Algae",
        "definition": "Simple plants that grow in streams and lakes. Unlike many land plants, algae do not have stems, roots, or leaves. “Algae” is plural, and the singular term is “alga.”",
        "example": "Think of carbon and nutrients as food for stream plants and algae.",
        "synonym": ""
      }
    ],
    "source": {
      "publisher": "Frontiers for Young Minds",
      "url": "https://kids.frontiersin.org/articles/10.3389/frym.2022.719051",
      "authors": [
        "Jonathan A. O’Donnell",
        "Michael P. Carey",
        "Brett A. Poulin",
        "Ken D. Tape",
        "Joshua C. Koch"
      ],
      "citation": "O’Donnell JA, Carey MP, Poulin BA, Tape KD and Koch JC (2022) How Beavers Are Changing Arctic Landscapes and Earth’s Climate. Front. Young Minds. 10:719051. doi: 10.3389/frym.2022.719051",
      "copyright": "Copyright © 2022 O’Donnell, Carey, Poulin, Tape and Koch",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "adaptationNote": "Text adapted for reading practice: illustrations, figure pointers and reference markers omitted; glossary definitions retained. The original illustrated article is linked above."
    }
  },
  {
    "id": "a040",
    "slug": "it-takes-a-pack-to-raise-a-pup",
    "title": "It Takes A Pack To Raise A Pup",
    "teaser": "Wolves are important to keep ecosystems healthy. For wolf populations to thrive, pups need to survive into adulthood.",
    "category": "Science",
    "tags": [
      "biodiversity explore the collection",
      "science",
      "keystone species",
      "ecosystem",
      "weaned",
      "den",
      "gps collars"
    ],
    "readMinutes": 6,
    "publishedLabel": "New",
    "cover": {
      "theme": "forest-emerald",
      "icon": "Compass",
      "motif": "SCIENCE"
    },
    "blocks": [
      {
        "type": "lead",
        "text": "Wolves are important to keep ecosystems healthy. For wolf populations to thrive, pups need to survive into adulthood. Wolf pups can be harmed, even killed, by wolves from outside their pack. To protect the pups, some wolves in the pack must stay at the den and guard the pups. But some of the adults must leave the den sometimes, to hunt for food and to keep other wolves out of the pack’s territory. By monitoring and studying wolves for many years across North America and in Alaska’s national parks, we are learning how wolves divide these tasks. We know that the mother wolves care for their pups for the first several weeks while nursing, but once the pups no longer need milk, all pack members share in taking care of the pups. We have come to understand that all wolves are important to the success of the pack."
      },
      {
        "type": "heading",
        "text": "Living In A Pack Is How Wolves Survive"
      },
      {
        "type": "paragraph",
        "text": "Wolves are considered keystone species because they have a large effect on many other species—both plants and animals—within the ecosystem. Wolves help regulate the numbers of their prey, such as deer, caribou, and moose, which helps prevent these prey animals from overgrazing the plants they need to survive."
      },
      {
        "type": "paragraph",
        "text": "Wolves are very social animals. They live and hunt together in groups called packs. A pack is usually made up of an adult male and female wolf, their offspring of various ages, and sometimes unrelated wolves, too. Pack sizes often range from 3 to 20 wolves. There are two pack leaders, one female and one male, and they are generally the only wolves in the pack that breed and produce pups. Litter sizes are often between two and six wolves. The breeding pair are not the only ones that care for the pups. In fact, all the wolves in the pack help. This is important because it takes a lot of energy to feed and care for pups."
      },
      {
        "type": "paragraph",
        "text": "As wolf pups grow, they eat different kinds of foods. Pups are born in the spring (April to May) and during the first 7 weeks of their lives, pups nurse from the mother. During that time, the mother wolf spends a lot of time feeding and caring for the pups. The pups are weaned around 7 weeks of age, which means the mother wolf no longer provides milk. Instead, the pups are fed meat, which is brought to them by pack members because the pups are too small to hunt for themselves."
      },
      {
        "type": "paragraph",
        "text": "Pack members spend a lot of time protecting and caring for the pups, too. Wolf pups can be harmed and even killed by wolves from other packs. So, it is important that a pack member stays near the den with the pups. This also gives the pack members an opportunity to interact and play with the pups, which is important for the pups’ development. By spending time with pack members, the pups learn how to socialize with other wolves and, as they get older, they learn other important lessons, like how to hunt."
      },
      {
        "type": "heading",
        "text": "Learning About Wolves"
      },
      {
        "type": "paragraph",
        "text": "Wolves have been studied across North America since 1950’s, including in national parks across the United States, such as Yukon-Charley Rivers National Preserve and Denali National Park and Preserve in Alaska, in Yellowstone National Park in Wyoming, and in Isle Royale National Park in Michigan. In Alaska’s national parks, wolves are monitored to assess the health of the park’s ecosystem. These studies count how many wolves there are and where they go. With this information, biologists can identify important areas used by wolves, like dens, and understand what kinds of food wolves need to be healthy. The studies also reveal how much time various pack members spend guarding the pups. Biologists can do this by following the movements of wolves with GPS collars. The collars record the location of each wolf over time. From this information, biologists can see how long each wolf is at the den with the pups and how long it is away."
      },
      {
        "type": "heading",
        "text": "Mom Does A Lot, But Everyone Helps"
      },
      {
        "type": "paragraph",
        "text": "To grow up and become healthy and strong pack members, pups need food, and they need to be cared for. Pack members must leave the den to hunt food for the pups and themselves. Often, they are gone for a few days. Wolves take turns hunting and guarding the pups. While some wolves are hunting, other pack members stay at the den and take care of the pups. That way, all the wolves get enough food, and the pups are kept safe."
      },
      {
        "type": "paragraph",
        "text": "From monitoring wolves in Yukon-Charley Rivers National Preserve, biologists learned that the mother wolf stayed in the den with the pups for the first 8 days of their lives, on average. She only left the den to drink water and defecate (poop). Over the first 2 weeks, the mother wolf stayed very close to the den and almost never traveled farther than 1 km (about 0.6 mi) away. After that, the mother wolf traveled farther from the den to hunt for food for herself and the pups."
      },
      {
        "type": "paragraph",
        "text": "From several other study areas, including Yellowstone National Park, biologists learned that the mother wolf spends the most time guarding and caring for the pups during the first several weeks. On average, the mother wolf spends two-thirds of her time with the pups—about 16 h a day. Once the pups no longer need milk, all pack members share more equally in the duties of guarding the pups. Most pack members spend about one quarter of their time with the pups, or on average about 6 h per day. They spend the remaining time either hunting or patrolling the pack territory."
      },
      {
        "type": "heading",
        "text": "Why Is Spending Time With Pups Important?"
      },
      {
        "type": "paragraph",
        "text": "The health and survival of wolf pups depends on pack members working together to help feed, protect, and care for pups. It takes a lot of energy to raise pups and one wolf could not do it all. When the responsibility of gathering food and patrolling the territory is shared among pack members, this allows adult wolves to spend more time bonding with the young pups and teaching them how to socialize and become helpful pack members. Strong packs help maintain a healthy wolf population which, in turn, helps maintain healthy populations of other species across the ecosystem. Ultimately, when all pack members help to raise the pups, they are also helping to protect the ecosystem and parks where the wolves live."
      }
    ],
    "vocabulary": [
      {
        "id": "a040-v01",
        "term": "Keystone Species",
        "definition": "A species on which other species in an ecosystem largely depend, such that if it were removed the ecosystem would change drastically.",
        "example": "Wolves are considered keystone species because they have a large effect on many other species—both plants and animals—within the ecosystem.",
        "synonym": ""
      },
      {
        "id": "a040-v02",
        "term": "Ecosystem",
        "definition": "A biological community of interacting organisms and their physical environment.",
        "example": "Wolves are considered keystone species because they have a large effect on many other species—both plants and animals—within the ecosystem.",
        "synonym": ""
      },
      {
        "id": "a040-v03",
        "term": "Weaned",
        "definition": "The period when wolf pups are transitioned from mothers’ milk to semi-solid foods.",
        "example": "The pups are weaned around 7 weeks of age, which means the mother wolf no longer provides milk.",
        "synonym": ""
      },
      {
        "id": "a040-v04",
        "term": "Den",
        "definition": "The location, often a hole in the ground that wolves dig, where wolf pups are birthed and raised for the first couple months of their lives.",
        "example": "To protect the pups, some wolves in the pack must stay at the den and guard the pups.",
        "synonym": ""
      },
      {
        "id": "a040-v05",
        "term": "GPS Collars",
        "definition": "Collars placed on animals that have GPS tracking so biologist know where animals are.",
        "example": "Biologists can do this by following the movements of wolves with GPS collars.",
        "synonym": ""
      }
    ],
    "source": {
      "publisher": "Frontiers for Young Minds",
      "url": "https://kids.frontiersin.org/articles/10.3389/frym.2022.735160",
      "authors": [
        "Mathew Sorum",
        "Jordan Pruszenski",
        "Bridget L. Borg"
      ],
      "citation": "Sorum M, Pruszenski J and Borg BL (2022) It Takes A Pack To Raise A Pup. Front. Young Minds. 10:735160. doi: 10.3389/frym.2022.735160",
      "copyright": "Copyright © 2022 Sorum, Pruszenski and Borg",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "adaptationNote": "Text adapted for reading practice: illustrations, figure pointers and reference markers omitted; glossary definitions retained. The original illustrated article is linked above."
    }
  },
  {
    "id": "a041",
    "slug": "kelp-in-a-changing-arctic-ocean",
    "title": "Kelp in a Changing Arctic Ocean",
    "teaser": "In the northernmost part of our planet, in the icy cold coastal waters of the Arctic Ocean, you will find underwater forests filled with fish, crabs, and sea urchins. Unlike forests found on land, these underwater forests are made up of large brown marine algae called kelp.",
    "category": "Science",
    "tags": [
      "earth sciences explore the collection",
      "science",
      "ecosystem",
      "marine algae",
      "kelp",
      "permafrost",
      "salinity"
    ],
    "readMinutes": 8,
    "publishedLabel": "New",
    "cover": {
      "theme": "ocean-teal",
      "icon": "Compass",
      "motif": "SCIENCE"
    },
    "blocks": [
      {
        "type": "lead",
        "text": "In the northernmost part of our planet, in the icy cold coastal waters of the Arctic Ocean, you will find underwater forests filled with fish, crabs, and sea urchins. Unlike forests found on land, these underwater forests are made up of large brown marine algae called kelp. The various kelp species that make up the underwater forests are important in the Arctic Ocean. As temperatures continue to rise because of climate change, the future of Arctic kelp is unknown. In this article, we will discuss how changes in the Arctic climate, from melting ice to changes in ocean saltiness, may affect these underwater worlds."
      },
      {
        "type": "heading",
        "text": "Underwater Forests"
      },
      {
        "type": "paragraph",
        "text": "Imagine walking through a forest full of trees, and seeing all the plants and animals that call the forest home. What you are imagining is an ecosystem created by the trees. Now, hold your breath and imagine a similar forest under the ocean. Not just any ocean—the icy-cold Arctic Ocean. You can stop imagining because these underwater forests exist. They are commonly found along the coasts of oceans all over the world, including the Arctic!"
      },
      {
        "type": "paragraph",
        "text": "Underwater forests are similar to forests on land but, instead of trees, there are large, brown marine algae that can be several meters tall. They are called kelp. Like trees, kelp make their own food using sunlight, carbon dioxide, water, and nutrients found in the water. This is called photosynthesis."
      },
      {
        "type": "paragraph",
        "text": "Kelp create an environment like trees do on land: they generate shade and soften not the wind, but the waves. Kelp forests provide a safe, protected place for animals to hide and reproduce. These forests are a perfect home for fish, crabs, and sea urchins."
      },
      {
        "type": "paragraph",
        "text": "The same way you can find many kinds of trees in a forest, you can find many kinds of kelp in kelp forests. Lots of kelp species have been described in the Arctic Ocean. Understanding these species is important, because it tells scientists how healthy the forest ecosystem is."
      },
      {
        "type": "heading",
        "text": "A Changing Arctic Ocean"
      },
      {
        "type": "paragraph",
        "text": "Before we discuss the kelp that are found in the Arctic Ocean, it is important to understand the environment and conditions that they live in. Kelp forests have adapted to the temperatures and light found in the areas of the world where they live. In the Arctic Ocean, kelp forests have adapted to live in freezing temperatures and long periods of darkness in the winter. They can even grow underneath the sea ice! Today, all the northern conditions that Arctic kelp have adapted to are changing."
      },
      {
        "type": "paragraph",
        "text": "What is changing in the Arctic? As a result of climate change, temperatures are getting warmer. The air temperature in the Arctic rose by 3°C over the last 50 years. This is three times higher than the rise in temperatures seen in the rest of the world! Ocean temperatures have also risen. The sea-surface temperature of the Arctic Ocean has warmed twice as fast as the sea surfaces in the rest of the world. This warming has a dramatic impact on the sea ice. In the summer, Arctic sea ice is melting more quickly than we have ever seen before. The ice is also freezing more slowly in the winter. Taken together, these changes mean that there is less sea ice in the Arctic than there used to be—up to 40% of the sea-ice cover has been lost. The glaciers and permafrost in the Arctic are melting, too. This makes the coastline more fragile."
      },
      {
        "type": "paragraph",
        "text": "These changes in the Arctic kelp’s environment affect how they grow and even whether they survive. The warmer temperatures cause other environmental factors to change too—which you will soon see, if you keep reading."
      },
      {
        "type": "heading",
        "text": "How Climate Change Affects Arctic Kelp Species"
      },
      {
        "type": "paragraph",
        "text": "So far, you know that underwater kelp forests are real and that they are important for Arctic life. You also know that climate change is changing the Arctic Ocean. Now we will tell you what we know about how kelp species are affected by the changes in the Arctic."
      },
      {
        "type": "paragraph",
        "text": "Let us start with temperature. Like temperatures on land, the ocean temperature is very important for underwater life. It also changes with seasons. In the winter, water temperatures in the Arctic Ocean average 0°C. In summer, water temperatures average 5°C, but can reach 10°C in the southern parts of the Arctic Ocean where it is warmer. Scientists that study Arctic kelp found that many species grow best between 10–15°C. So, the increasing temperatures in the Arctic Ocean are good for some kelp, helping them to grow well. Other kelp species grow better in lower temperatures and might not survive as well as the waters warm. The kelp species that prefer colder temperatures and are only found in the southern region of the Arctic Ocean today may even start growing in the northern regions of the Arctic Ocean where the water temperature is slightly colder. Even kelp species that are usually found in the Atlantic Ocean are being found more frequently in the Arctic Ocean. This is because the Arctic waters are warming enough to be suitable for them, and this may result in a lot of changes to the kelp species found in the Arctic kelp forests. Warming waters might also change which animals live in in those forests."
      },
      {
        "type": "paragraph",
        "text": "The amount of salt in seawater, called its salinity, is important as well. When ice melts on land, freshwater flows into the Arctic Ocean and dilutes the salt, therefore decreasing the salinity. The opposite happens when water freezes and salinity increases again. In the Arctic Ocean, salinity changes naturally due to the freezing and melting of ice with the seasons. But as more ice melts due to climate change, the salinity of the Arctic Ocean is decreasing. Just like with temperature, kelp species have ranges of salinity that are best for their growth. Studies have found that the growth of some kelp species can decrease if there is a strong decrease in salinity."
      },
      {
        "type": "paragraph",
        "text": "Use your imagination again: pretend that the sea ice is a lid that covers the water below. When there is less ice, or when the lid is no longer there, more light can reach into the water. Because kelp need light, a loss of sea ice could be good news for kelp forests. Scientists believe that the loss of ice in the Arctic will open up new areas for kelp to grow."
      },
      {
        "type": "paragraph",
        "text": "Turbidity is the last factor to consider. Turbidity describes the clarity of the water, or how see-through it is. The turbidity of water is determined by the number of particles present. The more particles, the higher the turbidity, and the more light is blocked from traveling through the water. This is not a good thing because, as you know, kelp need light to grow. The melting of glaciers and permafrost in the Arctic region is increasing the turbidity of the water in coastal regions, by bringing more soil particles, called sediment, into the ocean. Sediments block light from reaching kelp forests. Therefore, as temperatures continue to increase and melting continues, increasing turbidity could make survival tough for Arctic kelp species."
      },
      {
        "type": "heading",
        "text": "Kelp Forests of the Future?"
      },
      {
        "type": "paragraph",
        "text": "As you can see, when it comes to kelp forests, there are positive and negative outcomes of climate change in the Arctic Ocean. The impact that climate change will have also depends on the species, the specific region of the Artic, and the elements of the environment that are affected. Many ideas have been proposed to describe what the kelp forests of the Arctic might look like in the future. One idea is that kelp species that can handle the higher temperatures and lower salinities will dominate in the region, and the other kelp species will disappear from the forests. The animals that depend on the kelp species will likely follow the same trend."
      },
      {
        "type": "paragraph",
        "text": "It is important to understand that all the environmental elements are connected, so kelp may face many changes at the same time—like changes in temperature and salinity. We call this the cumulative effect of climate change, and it is difficult to predict. For example, scientists did an experiment on one kelp species that does not like high temperatures or low salinities, and when the two negative conditions were combined, the kelp grew even slower and struggled to photosynthesize. Understanding the cumulative effect of climate change on kelp is a big challenge for scientists studying kelp today."
      }
    ],
    "vocabulary": [
      {
        "id": "a041-v01",
        "term": "Ecosystem",
        "definition": "A set of organisms that interact with each other and with their environment.",
        "example": "What you are imagining is an ecosystem created by the trees.",
        "synonym": ""
      },
      {
        "id": "a041-v02",
        "term": "Marine Algae",
        "definition": "Plants that grow in saltwater environments like oceans, seas, and estuaries. The plants come in different shapes, sizes and colors.",
        "example": "Unlike forests found on land, these underwater forests are made up of large brown marine algae called kelp.",
        "synonym": ""
      },
      {
        "id": "a041-v03",
        "term": "Kelp",
        "definition": "A type of large seaweed that belongs to the brown marine algae family.",
        "example": "Unlike forests found on land, these underwater forests are made up of large brown marine algae called kelp.",
        "synonym": ""
      },
      {
        "id": "a041-v04",
        "term": "Permafrost",
        "definition": "A thick layer of soil underneath the ground surface that remains frozen throughout the year in polar regions.",
        "example": "The glaciers and permafrost in the Arctic are melting, too.",
        "synonym": ""
      },
      {
        "id": "a041-v05",
        "term": "Salinity",
        "definition": "A measure of how salty water is, so the amount of salt that is dissolved in water. The higher the salinity, the more salt there is in the water.",
        "example": "The amount of salt in seawater, called its salinity, is important as well.",
        "synonym": ""
      },
      {
        "id": "a041-v06",
        "term": "Turbidity",
        "definition": "A measure of how murky water appears to be because of small particles that are suspended in the water. The higher the turbidity, the more particles there are in the water.",
        "example": "Turbidity is the last factor to consider.",
        "synonym": ""
      },
      {
        "id": "a041-v07",
        "term": "Cumulative Effect",
        "definition": "Changes to the environment that are caused by more than one effect, like the effects of changes in temperature, salinity, and turbidity on the kelp forests.",
        "example": "We call this the cumulative effect of climate change, and it is difficult to predict.",
        "synonym": ""
      }
    ],
    "source": {
      "publisher": "Frontiers for Young Minds",
      "url": "https://kids.frontiersin.org/articles/10.3389/frym.2023.998004",
      "authors": [
        "Megan Shipton",
        "Anaïs Lebrun",
        "Steeve Comeau"
      ],
      "citation": "Shipton M, Lebrun A and Comeau S (2023) Kelp in a Changing Arctic Ocean. Front. Young Minds. 11:998004. doi: 10.3389/frym.2023.998004",
      "copyright": "Copyright © 2023 Shipton, Lebrun and Comeau",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "adaptationNote": "Text adapted for reading practice: illustrations, figure pointers and reference markers omitted; glossary definitions retained. The original illustrated article is linked above."
    }
  },
  {
    "id": "a042",
    "slug": "interactions-between-moving-water-and-flexible-plants-at-the-coast",
    "title": "Interactions Between Moving Water and Flexible Plants at the Coast",
    "teaser": "Coastal plants like salt marsh grasses and seagrasses do not just sit still in the water—they move, bend, and interact with waves and currents. Their flexibility helps them survive changing conditions and also shapes how water flows.",
    "category": "Science",
    "tags": [
      "earth sciences",
      "science",
      "climate change",
      "hydrodynamics",
      "canopy height"
    ],
    "readMinutes": 9,
    "publishedLabel": "New",
    "cover": {
      "theme": "ocean-teal",
      "icon": "Compass",
      "motif": "SCIENCE"
    },
    "blocks": [
      {
        "type": "lead",
        "text": "Coastal plants like salt marsh grasses and seagrasses do not just sit still in the water—they move, bend, and interact with waves and currents. Their flexibility helps them survive changing conditions and also shapes how water flows. When tides and waves push against these plants, they sway and reduce the water’s energy. This helps protect coastlines and creates safe habitats for marine life. But the water affects the plants too. Moving water can bend the plants or change where they can grow. This process is like a circle: water shapes the plants, and plants shape the water, which then shapes the plants again. In this article, we will explore how that loop works. You will learn how hydrodynamics (moving water) and plant flexibility and strength (how plants bend and stay strong) come together to shape our coasts—and why these plants are powerful protectors worth saving."
      },
      {
        "type": "heading",
        "text": "Exploring Coastal Plant–Water Interactions"
      },
      {
        "type": "paragraph",
        "text": "Imagine standing at the coast and looking out to the sea. It might look like a vast, empty space, but beneath the surface, something amazing is happening: under water and along the coast, plants like salt marsh grasses and seagrasses are quietly doing something incredible. These plants help protect people from sea-level rise. They also offer homes to animals like fish, crabs, and birds, and they even help reduce climate change. Unlike most plants you can find on land, coastal plants can survive salty seawater and being under water for part, or even all, of the day. If you watered your houseplants with seawater or put them underwater all the time, they would die. These coastal plants, however, are built for this salty world. When the tide comes in, they may be completely underwater. When the tide goes out, they can be exposed to the air again. While the plants are underwater, they are affected by how the water moves."
      },
      {
        "type": "paragraph",
        "text": "At the coast, when the wind is pushing against you, you might lean into the wind to stay standing still but flexible plants like grasses cannot do that. They are more like your hair, bending, fluttering, and moving with the wind. However, the grasses can also affect the way that the water moves because they can partially block the flow of water. But how does this interaction between the moving water and flexible plants, such as grasses, work exactly?"
      },
      {
        "type": "heading",
        "text": "Hydrodynamics: How Water Moves"
      },
      {
        "type": "paragraph",
        "text": "There are two main ways that water can move at the coast, and if you have spent a whole day at the beach, you have seen both in action. The first way is through waves. Wind blows across the surface of the sea, creating ripples that grow into waves. The stronger the wind, the bigger the waves can get. Although it looks like waves travel toward the beach, the water particles only move in circles and transfer the energy of the wave from one particle to the other. The second way water can move is through the tide. The tide makes the water at the coast rise and fall, usually twice per day. When rising, the tide can flood the land with seawater, and when it falls, it pulls the water back to sea. This flow of water in and out is called the tidal currents. The water particles move along with these currents."
      },
      {
        "type": "paragraph",
        "text": "Together, waves and tides are often referred to as hydrodynamics (meaning moving water). Hydrodynamics push and pull on everything in their way, including plants. Hydrodynamics affect how coastal ecosystems look. In areas with strong wave action or fast tidal currents, plants will struggle to survive. In sheltered areas, the plants have evolved to specifically deal with and take advantage of the saltwater the tides bring in or the waves that move them around. Some plant types even rely on gentle water movement to spread their seeds or pieces of their roots to new places, helping them colonize and expand."
      },
      {
        "type": "heading",
        "text": "Flexible Plants"
      },
      {
        "type": "paragraph",
        "text": "There are many different types of coastal plants. Whether it is a salt marsh plant or a seagrass, all coastal plants have special traits that help them deal with waves and tides. Some plants are stiff and stand firmly against hydrodynamics, like trees against the wind. Others are flexible and move with the water, like a field of grass does in the wind. Under the waves, they move back and forth with the circular movement of water particles, while under tidal currents, they bend in one direction."
      },
      {
        "type": "paragraph",
        "text": "Different types of plants respond to water forces and movement in different ways. Stiff plants are good at slowing down waves but may break more easily under high waves or strong currents, like the big trees snapping in a windy forest. Flexible plants, on the other hand, can move with waves and tides, like the grasses in a field, and they break less easily. In their research, scientists look at things like how strong and flexible a plant stem is, whether the stem is hollow or solid, or whether the stem is thick or thin. These details all affect how a plant survives in the moving water. Roots are important too. Coastal plants need strong roots to stay in place when waves and tides try to wash them away. Plants with deep or wide root systems can hold on better during a storm."
      },
      {
        "type": "paragraph",
        "text": "The overall number of plants, their shapes, how close together they grow, and the total area they cover are important too. When many plants grow close together in a meadow, they form what looks like a green wide wall. Salt marshes are full of different plant types, some stiff, some flexible, some tall, and some short. This mix creates a strong team that can spread out over wide coastal areas. Seagrasses, which grow underwater all the time, are usually very flexible. They bend and sway with waves and tides, like grass in the wind. This flexibility helps them avoid breaking and allows them to thrive in constantly moving water. So, to understand how coastal ecosystems interact with waves and tides, we need to study more than just one type of plant—we need to study the teamwork between plants."
      },
      {
        "type": "heading",
        "text": "How Plants and Water Work Together"
      },
      {
        "type": "paragraph",
        "text": "What happens when waves and tides flow through a patch of coastal plants? First, the plants slow the water down. Their stems and leaves partially block water flow, reducing its speed. They do this along their full height, which is why tall plants reduce water flow more than small plants. The amount of light, the temperature, the type of soil, and other conditions can influence how plants grow and respond to flowing water. For example, a plant that gets only a little sunlight might grow larger or thinner leaves, which changes how it affects the waves and currents. If multiple plants grow in a group and there is little space between the plants, it is difficult for the water particles to move between them—a bit like cars on a narrow street compared to a wide motorway. The more plants there are, and the more space they cover, the more they slow the water down."
      },
      {
        "type": "paragraph",
        "text": "At the same time, the water affects the plants. If the current is strong, it can bend the plants or even pull them out of the ground, depending on the plants’ flexibility and strength. Many plants, like seagrasses, are flexible, so they bend with the flow instead of breaking. Bending makes plants appear smaller than they are because they do not stretch to their full length. The height of the plants in the water is called the canopy height, and plants can only slow down the water that flows below the canopy height. That is why the canopy height is more important for slowing down the flow than the actual height of the plant. So, how much the flow bends the plants also influences how much the plants reduce the water flow. In this way, the plants and the water are constantly affecting each other. Water changes the shape of the plants, and the plants change how the water flows. It is like a circle: one affects the other, and the other affects the one, over and over again."
      },
      {
        "type": "heading",
        "text": "Coastal Plant–Water Interactions Matter"
      },
      {
        "type": "paragraph",
        "text": "Along the coast, water and plants constantly influence each other. The moving water changes the shape and strength of the plants, while the plants slow the water flow. These natural processes shape the coastline and create important places for animals to live."
      },
      {
        "type": "paragraph",
        "text": "Observing these interactions is not only fascinating, but it also helps scientists and engineers understand how to protect our coasts better. By learning how nature works, we can find smarter ways to live with water. You can help by keeping these areas clean and by respecting local habitats. Small actions can make a big difference in keeping our coasts healthy. Even discussing or reading more about the benefits of plants can make a difference, because it helps people understand how important the plants at the coastline are. Next time you stand at the coast watching the waves roll in, think about the quiet power of the plants that help protect the land behind you."
      }
    ],
    "vocabulary": [
      {
        "id": "a042-v01",
        "term": "Climate Change",
        "definition": "When Earth’s temperatures and weather patterns change. This can be natural but nowadays is mainly caused by things people do, like burning fuels and cutting down trees.",
        "example": "They also offer homes to animals like fish, crabs, and birds, and they even help reduce climate change.",
        "synonym": ""
      },
      {
        "id": "a042-v02",
        "term": "Hydrodynamics",
        "definition": "The study of how water flows, for example by waves and tides.",
        "example": "You will learn how hydrodynamics (moving water) and plant flexibility and strength (how plants bend and stay strong) come together to shape our coasts—and why these plants are powerful protectors worth saving.",
        "synonym": ""
      },
      {
        "id": "a042-v03",
        "term": "Canopy Height",
        "definition": "The height of a group of plants that changes when the plants bend. If plants are not bent, the canopy height will be high; and if they are bent, the canopy height will be lower.",
        "example": "The height of the plants in the water is called the canopy height, and plants can only slow down the water that flows below the canopy height.",
        "synonym": ""
      }
    ],
    "source": {
      "publisher": "Frontiers for Young Minds",
      "url": "https://kids.frontiersin.org/articles/10.3389/frym.2026.1647950",
      "authors": [
        "Sarah Dzimballa",
        "Marte M. Stoorvogel",
        "Christina Bischoff",
        "Martin Meijer",
        "Maike Paul"
      ],
      "citation": "Dzimballa S, Stoorvogel MM, Bischoff C, Meijer M and Paul M (2026) Interactions Between Moving Water and Flexible Plants at the Coast. Front. Young Minds. 14:1647950. doi: 10.3389/frym.2026.1647950",
      "copyright": "Copyright © 2026 Dzimballa, Stoorvogel, Bischoff, Meijer and Paul",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "adaptationNote": "Text adapted for reading practice: illustrations, figure pointers and reference markers omitted; glossary definitions retained. The original illustrated article is linked above."
    }
  },
  {
    "id": "a043",
    "slug": "why-do-animals-live-in-cities",
    "title": "Why Do Animals Live in Cities?",
    "teaser": "Cities are intended to be places for people to live, but some animals survive and even thrive in cities. Animals that are smaller, have more general diets, and are more intelligent or adaptable are especially good at city life.",
    "category": "Science",
    "tags": [
      "biodiversity",
      "science",
      "habitat",
      "urban wildlife",
      "generalists",
      "specialists",
      "telemetry"
    ],
    "readMinutes": 10,
    "publishedLabel": "New",
    "cover": {
      "theme": "forest-emerald",
      "icon": "Compass",
      "motif": "SCIENCE"
    },
    "blocks": [
      {
        "type": "lead",
        "text": "Cities are intended to be places for people to live, but some animals survive and even thrive in cities. Animals that are smaller, have more general diets, and are more intelligent or adaptable are especially good at city life. Many of these wildlife species have learned special behaviors to help them survive in urban areas. Scientists use many tools to study these animals because understanding wildlife in cities can help people learn to live with them. There are many things you can do to help scientists learn more about the animals you see every day and make your neighborhood a better place for wild animals."
      },
      {
        "type": "heading",
        "text": "Wild Cities"
      },
      {
        "type": "paragraph",
        "text": "It makes sense that people live in cities. Cities have schools, stores, and lots of places to live in. But why would wild animals (often called wildlife) want to live in a city? We built cities for humans, not for animals, but animals found them anyway! Now it seems that more and more animals are showing up in places that we would not expect them to. But why? Cities can be challenging places for wildlife. Cities have a lot of buildings, cars, and roads, and less space where animals can find shelter and food. We call the places animals live their habitat, and buildings, roads, and traffic can make it hard for animals to move around to find that habitat."
      },
      {
        "type": "paragraph",
        "text": "But scientists have learned that some species do better in cities than they do in habitats outside of cities. It turns out cities can provide a lot of good food, shelter, and protection for some wildlife. These animals live longer, have more babies, and get more to eat than they would in other habitats. Peregrine falcons, for example, use tall city buildings for nesting sites, man-made lighting to hunt for prey at night, and warm air currents created when the sun beats down on city surfaces to soar with less effort. If you think about it, you probably already know a lot of wildlife species that live successfully in cities. Have you seen squirrels in your neighborhood? Pigeons? Rabbits? Maybe a raccoon? These are all examples of animals that can live in cities, which scientists call urban wildlife."
      },
      {
        "type": "heading",
        "text": "What Sorts of Animals Do Well in Cities?"
      },
      {
        "type": "paragraph",
        "text": "Some animals adjust well to city life, and some do not. For example, squirrels do amazingly well living in cities, while wolves have never seemed to get the hang of it. While a lot is still unknown, there are some patterns in the kinds of wildlife that thrive in cities. Usually, animals that eat a lot of different things, which biologists call generalists, do much better in cities than specialists, which need to eat one specific kind of food. Cities create new places for wildlife to find food, like in trash, gardens, and grassy lawns. An animal that only eats one type of food may have trouble finding it in a big city, like black-footed ferrets that only eat prairie dogs. But an animal that eats all sorts of things can do much better. Coyotes in cities eat many different kinds of meat—mice, rats, squirrels, rabbits, and deer, but they also eat fruit. Raccoons eat plants, meat, seeds, fruit, and human garbage–anything they can find! That is one reason why raccoons live in cities all across North America, while black-footed ferrets do not."
      },
      {
        "type": "paragraph",
        "text": "Smaller animals, like mice, are also more likely to live in cities than bigger animals, like moose. That is because bigger animals need a lot of room to roam, and a lot of food to eat. In cities, there is less space for wildlife. Some people think that animals that do well in cities might be generally smarter than the ones who do not, though more research is needed on this. Cities are always changing, and in some ways are more complicated than forests, or swamps, or other habitats. Cities have lots of new rules that animals must figure out because they have not adapted to buildings or garbage or traffic. For example, some animals have learned to change the time of day that they are awake to avoid people. Coyotes live in cities across North America and have learned to be active at night, when there are fewer cars. That must take a lot of brainpower!"
      },
      {
        "type": "paragraph",
        "text": "Many animals have even learned cool tricks to live in cities, and these behaviors help them find more food or mates, or avoid people. Some bird species, for example, have learned to sing at a higher pitch so other birds can hear them over city noise. Other animals, like coyotes, deer, raccoons, and even mice use storm drains, which humans built to help water move underneath roads, to move around the city and avoid cars and people."
      },
      {
        "type": "paragraph",
        "text": "So, animals do interesting things to live in cities, but how do scientists study these animals and learn about their behaviors? To learn about where animals live, we use recording devices like cameras to spot animals, or microphones to record the sounds they make. To track how animals move around, we attach tracking equipment to them, which is a process called telemetry, so we can see exactly where the animals go. Scientists use many different tools to study what animals eat, how healthy they are, how they compete with each other, how many of them there are, and more."
      },
      {
        "type": "heading",
        "text": "Why Does It Matter If Animals Live in Cities?"
      },
      {
        "type": "paragraph",
        "text": "You might think the animals in cities are not as important to understand as lions and pandas, but that is not true. Did you know most people in the world live in cities? That means that the wildlife most people will watch, hear, and interact with are urban wildlife. Connecting people to nature and wildlife is important. People feel better and are healthier when they have access to nature. Many of us like to watch animals in our neighborhoods. It brings us happiness to hear birds singing in our backyards, or even to hear a coyote howl from a nearby park. It reminds us that cities are wilder places than we thought. It reminds us that no matter where we live, we are part of nature."
      },
      {
        "type": "paragraph",
        "text": "Although nature is good for our health, sometimes animals can cause trouble for people. This is called human-wildlife conflict. Imagine the skunk that sprays your dog with that gross smell, or the rabbits that munch on your family’s garden. People can accidentally hit animals with their cars, which is not only dangerous for the animals, but can also be dangerous for us if the animal is large, like a deer. When they feel threatened, some animals can even attack us or our pets, though this is very rare. With a better understanding, we can try to stop these conflicts from happening, which is another reason why scientists study urban wildlife."
      },
      {
        "type": "paragraph",
        "text": "Fortunately, it also turns out that animals do an incredible number of things that can help humans. Bats eat moths and mosquitoes that bother us. Bees, wasps, and other insects pollinate our gardens. Bigger predators like coyotes, foxes, and hawks eat mice and rats that eat our food and might carry diseases. Scientists call these helpful actions ecosystem services, and these services are critically important to our environment."
      },
      {
        "type": "heading",
        "text": "Can Cities Protect Wildlife?"
      },
      {
        "type": "paragraph",
        "text": "You might have heard that a lot of wildlife is at risk of going extinct, and that is true. Humans are turning the planet into cities and farms, which does not leave many other places for most wildlife to live. But here is the reality: people need cities, and cities are going to keep getting bigger. So, what can we do to make our cities more welcoming to wildlife?"
      },
      {
        "type": "paragraph",
        "text": "There are several things you can do to make your home or neighborhood more wildlife-friendly. At home, you can cover your trash carefully and avoid feeding wild animals. Trash is not good for animals and they get in trouble when they start rummaging around in it, so it is better for everyone if they eat more natural foods. Do you have a yard or balcony? See if you can plant some plants that are native to your area, that wildlife might like. For example, milkweed is a flower that is easy to grow and an important food source for monarch butterflies. When you see animals in a city, you can give them space and watch them from far away. You can also identify and learn more about them using apps like eBird, iNaturalist, or Project Feeder Watch. Most of these apps also share what you learn with scientists, so you will be helping with research on urban wildlife too! There might be organizations in your area, like nature centers, universities, or zoos, that work to make or improve habitats for wildlife or research them—maybe you can ask to volunteer!"
      },
      {
        "type": "paragraph",
        "text": "Some scientists think another solution is to create cities that have more places for wildlife to live in. We could leave or build more natural spaces around our roads, houses, schools and workplaces, and we could also try some creative things like green roofs, which are roofs that have plants on them where birds and insects can live. If you put it all together, we could build wildlife-friendly cities, places built not just for people, but for wildlife too. To do that, we need to know a lot more about why some wild animals survive in cities and some do not, what kind of habitats different species need, and how to prevent human-wildlife conflict. We still have a lot to learn."
      },
      {
        "type": "paragraph",
        "text": "Why do animals live in cities? Some live in cities because they have to, but more and more live in cities because they want to. In fact, if humans and wildlife are going to learn better ways to share the planet, cities might just hold the key."
      }
    ],
    "vocabulary": [
      {
        "id": "a043-v01",
        "term": "Habitat",
        "definition": "The space where animals can find food, shelter, mates—their home.",
        "example": "We call the places animals live their habitat, and buildings, roads, and traffic can make it hard for animals to move around to find that habitat.",
        "synonym": ""
      },
      {
        "id": "a043-v02",
        "term": "Urban Wildlife",
        "definition": "Wild animals that live in cities.",
        "example": "These are all examples of animals that can live in cities, which scientists call urban wildlife.",
        "synonym": ""
      },
      {
        "id": "a043-v03",
        "term": "Generalists",
        "definition": "Species that can eat many different types of food.",
        "example": "Usually, animals that eat a lot of different things, which biologists call generalists, do much better in cities than specialists, which need to eat one specific kind of food.",
        "synonym": ""
      },
      {
        "id": "a043-v04",
        "term": "Specialists",
        "definition": "Species that focus on eating only one, or a few, kinds of food.",
        "example": "Usually, animals that eat a lot of different things, which biologists call generalists, do much better in cities than specialists, which need to eat one specific kind of food.",
        "synonym": ""
      },
      {
        "id": "a043-v05",
        "term": "Telemetry",
        "definition": "Methods used by scientists to study how animals move, by attaching devices to them that can be tracked and followed.",
        "example": "To track how animals move around, we attach tracking equipment to them, which is a process called telemetry, so we can see exactly where the animals go.",
        "synonym": ""
      },
      {
        "id": "a043-v06",
        "term": "Ecosystem Services",
        "definition": "The benefits that nature and wildlife give to humans, including cleaning our air and water, giving people food, and improving people’s health.",
        "example": "Scientists call these helpful actions ecosystem services, and these services are critically important to our environment.",
        "synonym": ""
      },
      {
        "id": "a043-v07",
        "term": "Wildlife-friendly Cities",
        "definition": "Cities that are built with wildlife well-being in mind. These cities provide shelter, food, water, and ways for animals to move throughout the city safely.",
        "example": "If you put it all together, we could build wildlife-friendly cities, places built not just for people, but for wildlife too.",
        "synonym": ""
      }
    ],
    "source": {
      "publisher": "Frontiers for Young Minds",
      "url": "https://kids.frontiersin.org/articles/10.3389/frym.2021.566272",
      "authors": [
        "Seth B. Magle",
        "Cria A. M. Kay",
        "Jacqueline Buckley",
        "Kimberly R. Fake",
        "Mason Fidino",
        "Elizabeth W. Lehrer",
        "Maureen H. Murray"
      ],
      "citation": "Magle SB, Kay CAM, Buckley J, Fake KR, Fidino M, Lehrer EW and Murray MH (2021) Why Do Animals Live in Cities?. Front. Young Minds. 9:566272. doi: 10.3389/frym.2021.566272",
      "copyright": "Copyright © 2021 Magle, Kay, Buckley, Fake, Fidino, Lehrer and Murray",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "adaptationNote": "Text adapted for reading practice: illustrations, figure pointers and reference markers omitted; glossary definitions retained. The original illustrated article is linked above."
    }
  },
  {
    "id": "a044",
    "slug": "can-computers-understand-humor",
    "title": "Can Computers Understand Humor?",
    "teaser": "Computers are very good at performing many tasks that are difficult for humans, such as solving complicated math problems or predicting the weather. But there are many things that people do better than computers.",
    "category": "Psychology",
    "tags": [
      "neuroscience and psychology",
      "psychology",
      "artificial intelligence",
      "computer programming",
      "machine learning",
      "virtual voice assistant"
    ],
    "readMinutes": 8,
    "publishedLabel": "New",
    "cover": {
      "theme": "royal-violet",
      "icon": "Brain",
      "motif": "PSYCHOLOGY"
    },
    "blocks": [
      {
        "type": "lead",
        "text": "Computers are very good at performing many tasks that are difficult for humans, such as solving complicated math problems or predicting the weather. But there are many things that people do better than computers. Humor—that is, telling jokes and knowing when something is funny—is one of the things that computers cannot do as well as humans. In this article, you will learn why it is hard for computers to understand jokes. You will also learn about artificial intelligence (AI), and how a new sub-field of AI, called machine learning, can help computers understand humor. We hope that, in the future, computers will be able to understand and generate humor, just like humans do—or even better!"
      },
      {
        "type": "heading",
        "text": "Computers Can Do Anything… Right?"
      },
      {
        "type": "paragraph",
        "text": "Computers are a big part of our lives. We all use them for games, homework, watching videos, and much more. But a computer is more than just the laptop or desktop you have at home or at school. The word computer actually means any kind of machine that uses electronic data. For example, cell phones, microwaves, elevators, cars, and even “talking” toys are all types of computers!"
      },
      {
        "type": "paragraph",
        "text": "Nowadays, the capabilities of computers are extraordinary. They can understand human speech; write music and draw; search for information on the web; diagnose diseases; and even drive a car! But humor is one task which computers still struggle with."
      },
      {
        "type": "heading",
        "text": "The Challenge: Make Your Computer Laugh"
      },
      {
        "type": "paragraph",
        "text": "From a young age, we learn to laugh when something is funny and also how to make other people laugh. Humor is an important part of human life—in every culture around the world, people tell jokes and laugh daily. Although humor is very important for humans, computers still struggle with “knowing” when something is funny, let alone being funny themselves. Why? One of the main reasons is that humor is very subjective, meaning that it is different for each person, time, and place. We ourselves often do not know what makes something funny! Sometimes a certain thing makes one person laugh, while another does not find it funny at all. For example, is the following joke funny to you?"
      },
      {
        "type": "paragraph",
        "text": "Why was 6 afraid of 7? Because 7 ate 9!"
      },
      {
        "type": "paragraph",
        "text": "Some people may laugh at this joke, and some may not. Since even individual humans may not always agree on what is funny, will computers ever get the joke?"
      },
      {
        "type": "heading",
        "text": "How Can We Explain Humor?"
      },
      {
        "type": "paragraph",
        "text": "Throughout history, people from fields including philosophy, psychology, and linguistics (the study of languages) have tried to develop scientific theories to answer the question of what makes something funny. In their research, they made some interesting discoveries. One discovery was that, for something to be funny, it must contain some element of surprise. Let us look at this joke, for example:"
      },
      {
        "type": "paragraph",
        "text": "“Mom, I do not want to go to school today!,” Danny said. “The kids are bothering me, and all the teachers hate me.”"
      },
      {
        "type": "paragraph",
        "text": "“But Danny, you must go,” Mother insisted."
      },
      {
        "type": "paragraph",
        "text": "“But why?” Danny asked."
      },
      {
        "type": "paragraph",
        "text": "“Because you’re the principal!” Mother replied."
      },
      {
        "type": "paragraph",
        "text": "The joke is funny because it is surprising—we expected Danny to be a student! So, all we need is for the computer to be able to identify a “surprise.” Sounds easy, right? Not so fast. We, as human beings, know a lot about how the world works, and we expect certain things to happen because we have experienced them. Computers, on the other hand, do not experience the world like we do. They do not know what “usually” happens and therefore cannot know what is surprising!"
      },
      {
        "type": "paragraph",
        "text": "So how can we teach a computer about the world?"
      },
      {
        "type": "heading",
        "text": "Artificial Intelligence and Machine Learning"
      },
      {
        "type": "paragraph",
        "text": "Artificial intelligence (AI) is the field of computer science that tries to make a computer “think” like a human. In the beginning of AI research, computer programmers—people who know how to write instructions for a computer—needed to give the computer very specific rules to get it to do what they wanted. Here is an example of this type of rule from the human world: “If a person goes to the doctor with a fever and cough—they should have a corona test.” Recently, programmers have started using an AI sub-field called machine learning. With machine learning, you do not need to give the computer any rules; instead, the computer learns from examples, much like humans do. This type of learning can help a computer identify surprise and humor."
      },
      {
        "type": "heading",
        "text": "How Does Machine Learning Work?"
      },
      {
        "type": "paragraph",
        "text": "Machine learning means that programmers give computers examples, each with a label, or tag, that describes it. After many examples, the computer learns to identify the examples on its own! Children learn in a similar way—when a child sees an animal (the example), an adult tells the child what kind of animal it is (the tag). With enough examples, the child will learn to identify the animals on his own."
      },
      {
        "type": "paragraph",
        "text": "So, can computers learn to understand humor? Yes, they can! With machine learning, computers can solve humor problems that were previously considered impossible."
      },
      {
        "type": "heading",
        "text": "How We Taught a Computer to Get the Joke"
      },
      {
        "type": "paragraph",
        "text": "In Professor Dafna Shahaf’s laboratory, researchers study AI, including how to teach computers to understand humor. To do this, we create machine learning models, which you are now familiar with! Professor Shahaf’s first project about computers and humor was based on a contest in an American newspaper called The New Yorker. In this contest, the newspaper publishes a cartoon without any words, and readers are asked to write a funny caption. The reader who comes up with the funniest caption wins. There is a person at the newspaper whose job it is to choose the funniest captions from the thousands that come in every week. Sounds like a fun job, right? Turns out it is not, because after a few weeks of reading so many funny captions, nothing seems funny anymore! Could a computer help the newspaper to pick the funniest submission? Professor Shahaf gave the computer examples of funny captions, and the computer learned to grade them based on how funny they were."
      },
      {
        "type": "paragraph",
        "text": "In another project, two researchers in Professor Shahaf’s laboratory—a doctoral student named Chen Shani and a master’s student named Nadav Bornstein—taught a computer to identify funny science projects. You read that right—funny science projects! This project was based on an award called the Ig Nobel Prize, which is a humorous prize given to scientific studies that “first make people laugh, then make them think.” Here are some of the studies that have won this award:"
      },
      {
        "type": "paragraph",
        "text": "• A study that found that chickens prefer beautiful people;"
      },
      {
        "type": "paragraph",
        "text": "• A study that showed that when people see chimpanzees in the zoo, the chimpanzees copy the humans, and that the humans also copy the chimpanzees;"
      },
      {
        "type": "paragraph",
        "text": "• A study that tested saliva (spit) to see if it can be used to clean a dirty surface; and"
      },
      {
        "type": "paragraph",
        "text": "• A study that showed that more people are grossed out by cheese than by any other food—even if they only smell it or see a picture of it."
      },
      {
        "type": "paragraph",
        "text": "Using machine learning, the researchers taught the computer to pick out funny scientific studies like the ones listed!"
      },
      {
        "type": "paragraph",
        "text": "Another project, led by Chen Shani together with Amazon, looked at humor and Alexa, Amazon’s virtual voice assistant. People who use Alexa tend to treat her as if she were a human being, and often try to joke with her. For example, they might say: “Hi, Alexa, do you want to build a snowman?” The problem is that Alexa and other programs like her are not designed to understand humor, but to help with daily tasks like searching the Internet or reporting the weather. Therefore, they usually do not understand or respond in the right way when someone is joking around with them, and that is no fun! To teach virtual assistants like Alexa to get the joke, the researchers collected examples of playful queries people ask Alexa, such as “Do you have eyes?;” “Want to go to a movie with me?;” “Order me a million gummy bears;” and more. They used these examples and many more to characterize users’ playfulness, toward automatically detecting it."
      },
      {
        "type": "heading",
        "text": "Summary"
      },
      {
        "type": "paragraph",
        "text": "Humor is a great example of a human trait that is still very difficult for computers to understand and use like humans do. But there is hope!"
      },
      {
        "type": "paragraph",
        "text": "We have seen that computers can understand humor when it comes to certain tasks. Our hope for the future is that we can teach computers to understand humor better and better. Want to help us? The first thing to do is learn computer programming!"
      }
    ],
    "vocabulary": [
      {
        "id": "a044-v01",
        "term": "Artificial Intelligence",
        "definition": "A field of science that aims to make a computer “think” and “behave” in ways similar to humans.",
        "example": "You will also learn about artificial intelligence (AI), and how a new sub-field of AI, called machine learning, can help computers understand humor.",
        "synonym": ""
      },
      {
        "id": "a044-v02",
        "term": "Computer Programming",
        "definition": "Writing instructions for a computer. Programmers use programming languages to write the codes, or instructions, for applications, websites, and computer software.",
        "example": "The first thing to do is learn computer programming!",
        "synonym": ""
      },
      {
        "id": "a044-v03",
        "term": "Machine Learning",
        "definition": "A kind of artificial intelligence in which a computer learns from experience, like humans. Unlike AI, programmers do not need to give the computer instructions, but instead provide examples.",
        "example": "You will also learn about artificial intelligence (AI), and how a new sub-field of AI, called machine learning, can help computers understand humor.",
        "synonym": ""
      },
      {
        "id": "a044-v04",
        "term": "Virtual Voice Assistant",
        "definition": "Software that can understand human speech and respond. Its purpose is to help users by performing tasks for them.",
        "example": "Another project, led by Chen Shani together with Amazon, looked at humor and Alexa, Amazon’s virtual voice assistant.",
        "synonym": ""
      }
    ],
    "source": {
      "publisher": "Frontiers for Young Minds",
      "url": "https://kids.frontiersin.org/articles/10.3389/frym.2022.982604",
      "authors": [
        "Chen Shani",
        "Dafna Shahaf"
      ],
      "citation": "Shani C and Shahaf D (2022) Can Computers Understand Humor?. Front. Young Minds. 10:982604. doi: 10.3389/frym.2022.982604",
      "copyright": "Copyright © 2022 Shani and Shahaf",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "adaptationNote": "Text adapted for reading practice: illustrations, figure pointers and reference markers omitted; glossary definitions retained. The original illustrated article is linked above."
    }
  },
  {
    "id": "a045",
    "slug": "a-battle-for-the-forest-spruce-castles-and-bark-beetle-attacks",
    "title": "A Battle for the Forest: Spruce Castles and Bark Beetle Attacks",
    "teaser": "Conifers, like spruce and pine, are the most common trees found in the huge boreal forest that stretches around the northern part of the world. Over their long lifetime of 500 years or more, conifers face many threats.",
    "category": "Science",
    "tags": [
      "earth sciences",
      "science",
      "constitutive defenses",
      "inducible defenses",
      "terpenes",
      "fungi",
      "methyl jasmonate"
    ],
    "readMinutes": 8,
    "publishedLabel": "New",
    "cover": {
      "theme": "forest-emerald",
      "icon": "Compass",
      "motif": "SCIENCE"
    },
    "blocks": [
      {
        "type": "lead",
        "text": "Conifers, like spruce and pine, are the most common trees found in the huge boreal forest that stretches around the northern part of the world. Over their long lifetime of 500 years or more, conifers face many threats. One deadly threat is an invasion by tree-killing insects, such as bark beetles. Like medieval castles, conifer trees have many ways to defend themselves. Still, sometimes large armies of bark beetles and their fungal partners can defeat these defenses and kill millions of trees. We found that spraying spruce trees with a natural chemical, called methyl jasmonate, can boost tree defenses and protect the trees against a bark beetle attack. Today, increasing temperatures and changing rain patterns help bark beetles be more successful in killing trees. Therefore, it is important that we understand how trees defend themselves and how we can help to protect them against insect invaders."
      },
      {
        "type": "heading",
        "text": "Conifer Forest"
      },
      {
        "type": "paragraph",
        "text": "Have you ever walked in a forest among tall trees? The boreal forest is the world’s largest forest and makes up about one-third of all forests. The boreal forest stretches around the northern part of the globe and can be found in places like Canada, Scandinavia, and Russia. This forest is home to many types of animals, like moose and bears, as well as plants, like moss and trees. Conifers are the most common trees found in boreal forests. Conifers are woody plants, such as pine, spruce, and fir trees, which produce cones with seeds. They are also commonly used as Christmas trees."
      },
      {
        "type": "paragraph",
        "text": "Conifers are amazing because they grow taller and larger than any other tree. They are also some of the oldest living organisms on earth and can live for hundreds and even thousands of years. The oldest known living conifer is a Great Basin bristlecone pine called Methuselah. Methuselah is 4,850 years old. Over their long lifetime, conifers face many threats, such as stormy weather and attacks by animals. Unlike humans, trees cannot go inside during a snowstorm or run away when something is trying to eat them. Instead, they must stand still, while they protect and defend themselves as best they can."
      },
      {
        "type": "heading",
        "text": "Conifer Castles"
      },
      {
        "type": "paragraph",
        "text": "Like medieval castles, conifer trees have several layers of defenses. Conifers and other plants have two main types of defenses: those that are always present, known as constitutive defenses, and those that appear only when the tree feels threatened, known as inducible defenses. One constitutive defense is the bark. The outer bark is a tough barrier, much like the outer walls of a fortress. An insect that attacks a tree must get through this wall to reach the tasty, nutritious parts inside."
      },
      {
        "type": "paragraph",
        "text": "A second constitutive defense that conifers have is stone cells. These hard cells act like small boulders, making it difficult for insects to chew their way through the bark. A third defense is small pipes inside the bark that are filled with chemicals called terpenes. Terpenes give pine trees their “piney” smell. Terpenes also form resin, the sticky goop that you get on your hands if you cut a conifer tree. Terpenes are poisonous to insects. In addition, resin is sticky and can trap insects and stop them from entering the tree. Some resin pipes are always present, but the tree can make many more when it is cut or attacked by an insect."
      },
      {
        "type": "heading",
        "text": "Bark Beetle Attack"
      },
      {
        "type": "paragraph",
        "text": "Did you know that tiny beetles, no bigger than grains of rice, can kill a healthy conifer tree? One beetle alone cannot kill a tree, but like an army, bark beetles work together to invade the tree. Hundreds of beetles can dig under the bark of a single tree and lay their eggs. When the eggs hatch, the larvae (baby beetles) eat the tree to help them grow into adult beetles."
      },
      {
        "type": "paragraph",
        "text": "The beetles also get help from fungi to defeat the tree’s defenses. Like a horse and rider, the bark beetle carries the fungi through the tree’s tough outer bark. Once inside the bark the fungi get off the “horse” and grow into the tree. Here the fungi eat some of the poisonous chemicals the tree has made to defend itself. By getting rid of the poison, the fungi make it easier for bark beetle larvae to grow. The fungi also make the tree weaker by killing tissues and taking nutrients from the tree. If the tree’s defenses cannot stop the beetles and the growth of the fungi, the tree will eventually die."
      },
      {
        "type": "heading",
        "text": "Helping Conifer Trees to Fortify Their Castles"
      },
      {
        "type": "paragraph",
        "text": "We have found a way to help conifer trees boost their defenses and perhaps win the battle against bark beetles. We do this by spraying trees with a natural chemical made by plants. The chemical is called methyl jasmonate (meth-ill jazz-mon-ate). Methyl jasmonate is a signal that plants release into the air to tell surrounding plants, “I am under attack!” Spraying the bark of trees with methyl jasmonate is like sending a message to the trees saying, “Get prepared to fight! The bark beetles are coming!”."
      },
      {
        "type": "paragraph",
        "text": "We worked on a conifer species called Norway spruce, which is very common in Europe. We sprayed 20 trees in a forest with methyl jasmonate and 20 trees with water, as a control treatment. We then waited 35 days for a bark beetle attack to begin. After another 30 days, we compared the trees sprayed with methyl jasmonate or water to see which trees bark beetles successfully invaded. By peeling away the outer bark, we could see that not a single bark beetle had laid eggs in trees sprayed with methyl jasmonate. This was very different from the trees sprayed with water. Most of the water-treated trees had beetle eggs in the bark and 11 of the 20 trees were killed by the beetles."
      },
      {
        "type": "heading",
        "text": "Why Are Trees Sprayed With Methyl Jasmonate Better Able to Defend Themselves?"
      },
      {
        "type": "paragraph",
        "text": "One reason trees sprayed with methyl jasmonate are better at fighting against bark beetles is that sprayed trees make more of the poisonous resin. When the bark beetles try to dig into the bark, the sticky resin flows out and trap the beetles. Another reason sprayed trees are stronger is that they can more quickly activate their defenses. This is like having back-up troops. These troops are already trained for battle and can begin to fight immediately, which is better than having to train new troops before sending them out to fight."
      },
      {
        "type": "paragraph",
        "text": "The way spruce trees respond to methyl jasmonate is similar to what happens in your body when you get a vaccination. From the vaccination, your immune system gets information and remembers which viruses to watch out for so you will not get sick. Methyl jasmonate is a signal that helps trees remember to watch out for bark beetles."
      },
      {
        "type": "heading",
        "text": "Why is Our Work Important?"
      },
      {
        "type": "paragraph",
        "text": "Most of the time, bark beetles and conifer trees live in harmony in the forest. However, higher temperatures and increased drought stresses conifer trees. This makes the trees more vulnerable to bark beetle attacks. In places like Colorado and the Czech Republic, bark beetles are killing millions of conifer trees. The death of so many trees is bad in many ways. One problem is the loss of timber needed for building houses, schools, and other buildings. This also results in the loss of money for companies that cut trees and sell timber. The death of so many trees can also be bad for the environment we all depend on. Living, growing trees provide us with oxygen to breathe and are home for many types of animals. If we can understand how conifer trees defend themselves and help them fight against bark beetles, we can protect our forests and our environment."
      },
      {
        "type": "heading",
        "text": "Conclusion"
      },
      {
        "type": "paragraph",
        "text": "Conifer trees are very important in the boreal forest. Because trees cannot run away from tree-eating insects, trees have many ways to defend themselves. Still, tiny bark beetles can get together and defeat tree defenses. These bark beetles sometimes kill millions of trees. We are trying to find ways to help conifer trees fight against bark beetles. In the future, we hope to find other tools, like methyl jasmonate, that help conifers fight bark beetle attacks and not lose the battle in the forest."
      }
    ],
    "vocabulary": [
      {
        "id": "a045-v01",
        "term": "Constitutive Defenses",
        "definition": "Are ways trees have to protect themselves that are always present.",
        "example": "Conifers and other plants have two main types of defenses: those that are always present, known as constitutive defenses, and those that appear only when the tree feels threatened, known as inducible defenses.",
        "synonym": ""
      },
      {
        "id": "a045-v02",
        "term": "Inducible Defenses",
        "definition": "Are ways trees have to protect themselves, but that the tree makes after an attack.",
        "example": "Conifers and other plants have two main types of defenses: those that are always present, known as constitutive defenses, and those that appear only when the tree feels threatened, known as inducible defenses.",
        "synonym": ""
      },
      {
        "id": "a045-v03",
        "term": "Terpenes",
        "definition": "Are toxic chemicals that conifers make to defend themselves.",
        "example": "A third defense is small pipes inside the bark that are filled with chemicals called terpenes.",
        "synonym": ""
      },
      {
        "id": "a045-v04",
        "term": "Fungi",
        "definition": "Are organisms that get their energy by breaking down other organisms, just like animals do.",
        "example": "The beetles also get help from fungi to defeat the tree’s defenses.",
        "synonym": ""
      },
      {
        "id": "a045-v05",
        "term": "Methyl Jasmonate",
        "definition": "Is a signal made by plants when they are being eaten or cut.",
        "example": "We found that spraying spruce trees with a natural chemical, called methyl jasmonate, can boost tree defenses and protect the trees against a bark beetle attack.",
        "synonym": ""
      }
    ],
    "source": {
      "publisher": "Frontiers for Young Minds",
      "url": "https://kids.frontiersin.org/articles/10.3389/frym.2020.00121",
      "authors": [
        "Melissa H. Mageroy",
        "Paal Krokene"
      ],
      "citation": "Mageroy MH and Krokene P (2020) A Battle for the Forest: Spruce Castles and Bark Beetle Attacks. Front. Young Minds. 8:121. doi: 10.3389/frym.2020.00121",
      "copyright": "Copyright © 2020 Mageroy and Krokene",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "adaptationNote": "Text adapted for reading practice: illustrations, figure pointers and reference markers omitted; glossary definitions retained. The original illustrated article is linked above."
    }
  },
  {
    "id": "a046",
    "slug": "what-happens-when-we-hear",
    "title": "What Happens When We Hear?",
    "teaser": "What happens when we hear? Where does the sound go when it enters our ears?",
    "category": "Psychology",
    "tags": [
      "neuroscience and psychology explore the collection",
      "psychology",
      "ear canal",
      "eardrum",
      "cochlea",
      "basilar membrane",
      "frequency"
    ],
    "readMinutes": 10,
    "publishedLabel": "New",
    "cover": {
      "theme": "royal-violet",
      "icon": "Brain",
      "motif": "PSYCHOLOGY"
    },
    "blocks": [
      {
        "type": "lead",
        "text": "What happens when we hear? Where does the sound go when it enters our ears? Our ears sense the vibrations of the air and convert them into electrical signals the brain can process. But that is only the start. The brain uses tens of thousands of nerve cells to hear even the quietest or simplest sound. With those nerve cells, the brain is solving a never-ending puzzle: figuring out what is going on in the world. To do that, the brain must separate out sounds that are occurring at the same time, recognize them, and describe them in lots of ways, such as how loud a sound is and where it is coming from. This article gives an overview of how the ears and brain work together, so we can live in a world of sound."
      },
      {
        "type": "heading",
        "text": "The World of Sound"
      },
      {
        "type": "paragraph",
        "text": "Imagine you are sitting by a very still lake. Now imagine you place two small toy boats on the water’s edge, about a meter apart, like the boy in the picture above. You throw a stone into the water, farther out than the boats. When the stone hits the water, it creates ripples that move outward in a circle from where the stone sank. When the waves reach your boats, the boats bob up and down. If your stone landed an equal distance from each boat, both boats will start moving at the same time. But if your stone was closer to the left boat, it will start to bob around before the boat on the right."
      },
      {
        "type": "paragraph",
        "text": "Now imagine the lake is busy. A dog splashes nearby, a jet ski whizzes past in the distance, and ducks swim around. Each moving thing creates more waves of various sizes, coming from lots of directions—and each wave will move your boats in a specific way."
      },
      {
        "type": "paragraph",
        "text": "What if you could not see the entire lake, but could only see the two boats? You might know that something is creating ripples, but it would be difficult to work out what was causing them. This is exactly what you do when you listen to sounds. When people talk, birds sing, or cars go by, they create invisible ripples of air that spread outwards like the ripples on the lake. When those ripples reach your ears, they cause moving parts inside your ears to “bob” about, just like those toy boats, and nerves inside your ears send signals about this bobbing motion to your brain. Your brain then works out what those sounds are and where they are coming from—even if you cannot see what is making the sound! Hearing can create a vivid picture of the world around you, and most of the time you do not even notice you are doing it! Scientists are still figuring out how this happens."
      },
      {
        "type": "heading",
        "text": "What Happens Inside Your Ears?"
      },
      {
        "type": "paragraph",
        "text": "If you could see air move in slow motion, you could watch sound vibrations travel from someone’s hands when they clap, through the air, to your ears. Of course air is invisible, and it vibrates much too fast for our eyes to follow, but some scientists have devised a clever way for you to see the sound waves. To learn more about the physics of sound in the air, read this Frontiers for Young Minds article."
      },
      {
        "type": "paragraph",
        "text": "Your ears are made up of several parts. The flappy bits on the sides of your head are called your outer ears. The outer ear collects the sound waves traveling through the air and funnels them into the ear canal, where they bounce against a thin piece of skin about 8 mm across (a little smaller than an M&M candy), called the eardrum, which is stretched across the end of the ear canal. Your eardrum vibrates to the sound waves that hit it. Attached to the other side of the eardrum are three tiny bones—the tiniest bones in your body. They pick up the vibrations from the eardrum, and send them into the inner ear, or cochlea. The cochlea is a spiral tube filled with salty liquid that moves rapidly back and forth based on the vibrations of the air."
      },
      {
        "type": "paragraph",
        "text": "The cochlea is divided into two sections by a skin-like layer called the basilar membrane. Sound vibrations entering the ear cause this membrane to vibrate up and down. The membrane closest to the outer ear is more sensitive to high-frequency sounds—as high as 20,000 vibrations per second or Hertz (Hz). If you are not sure what frequency is, you can read more about it here. This is far higher than even the highest musical notes, like those made by a piccolo or a whistle, which can be as high as 4,000 Hz. Generally, only young people can hear this well: most older adults aged around 60 can only hear up to about 10,000 Hz. The other end of the basilar membrane vibrates most to low-frequency sounds such as those made by a double bass, which can be as low as 40 Hz—close to the lowest we can hear (20 Hz). Speech falls mostly in the middle range of frequencies, from 100 to 2,000 Hz. So, the cochlea “sorts” sounds according to frequency. This helps us to know what frequency a sound is (e.g., what musical notes) but also to separate out sounds of different frequencies which occur at the same time!"
      },
      {
        "type": "paragraph",
        "text": "All along the basilar membrane are tiny hair cells that measure these vibrations and turn them into electrical signals. Each cell is connected to a nerve fiber, which carries the electrical signals to the brain. The brain then decodes, or interprets, these signals and works out what the sound is and where it is coming from. Of course, there is still much more to how the ear works. You can find out more in other Frontiers for Young Minds articles here, or here."
      },
      {
        "type": "heading",
        "text": "You Hear With Your Brain"
      },
      {
        "type": "paragraph",
        "text": "Your brain is like a very powerful supercomputer! It is your brain’s job to make sense of the electrical signals sent from your ears. The parts of the brain that process sounds are called auditory nuclei. Within the auditory nuclei, brain cells sense specific types of sounds. Some brain cells like low-frequency sounds, such as car engines, and others like high-frequency sounds, such as birdsong. The brain cells that like low-frequency sounds often cluster together, and those that like high-frequencies do the same. We say they are arranged into a “map” of frequency, which helps you to know what frequency of sound you are hearing."
      },
      {
        "type": "paragraph",
        "text": "Some auditory nuclei have extra special jobs that no other parts of the brain can perform. One nucleus, called the medial superior olive, compares the times that a sound arrives at each ear. Just like our example of the toy boats on the lake, sounds from the left will arrive at the left ear first and will take a little longer to arrive at the right ear. If the sound comes from in front, it will arrive at both ears at the same time. This is one of the ways that your brain can work out where the sound is coming from (for more see this Frontiers for Young Minds article)."
      },
      {
        "type": "paragraph",
        "text": "The brain does lots of other jobs to help you understand the sounds around you. For example, it can work out how loud a sound is, or spot new and unexpected sounds. It can recognize words, and can work out how an object is moving from the changes in sound waves over time. Imagine almost any aspect of sound or how it can change, and you can probably find brain cells that can measure it!"
      },
      {
        "type": "heading",
        "text": "Making Sense of Sounds"
      },
      {
        "type": "paragraph",
        "text": "The job of the brain is to turn sounds into information about the world around us that makes sense. For example, when you hear a person talking and understand the words they say, you are not just working out whether the sounds are loud, quiet, close, distant, still, or moving. Your brain is also trying to identify the sounds. It does this by drawing on all the knowledge it already has about those sounds. We understand words because we have already learned the language and know what many words sound like; so you hear not just sounds, but words that have meaning to you. So, how we understand sounds is partly dependent on what we already know! Even the things you see can affect the way you perceive sound. This is extremely important when you are listening to someone talking—seeing a person’s face makes them easier to understand (see this Frontiers for Young Minds article for more about how what we see affects our hearing)."
      },
      {
        "type": "heading",
        "text": "Untangling All The Sounds You Hear"
      },
      {
        "type": "paragraph",
        "text": "Perhaps the most amazing thing about hearing is how well it works when there are lots of sounds happening at once. Imagine you are with two friends, and they are talking at the same time. You can usually pick out one of the voices to listen to, and not get both friends’ words mixed up. The brain uses “tricks” to separate out sounds. For example, if your friends are sitting in separate places, your brain can work out where each voice is coming from by using your medial superior olives! You do not need to think about where the voices are coming from—your brain is wired to do this automatically. Choosing which of your friends to listen to is not automatic, and how you listen also helps your brain to separate out the voices. Amazingly, if you pay attention to one of the voices, your brain responds more strongly to that voice and you hear it more clearly! For more information, see this Frontiers for Young Minds article."
      },
      {
        "type": "heading",
        "text": "Hearing: A Lot More Than Meets The Ear!"
      },
      {
        "type": "paragraph",
        "text": "By now, you probably agree that there is a lot more to hearing than just your ears. Your ears convert sounds into signals your brain can deal with. That is not an easy job! But by the time you make sense of those sounds, they have passed through many thousands of brain cells. Your brain and the cells in it work hard to help you make sense of sounds and the information that sounds are telling you about the world. Understanding how we hear is critical to treating hearing problems effectively, which become worse with age. This understanding has also led to technologies such as mp3 files and innovations in artificial speech recognition by computers. If you want to learn more about the exciting world of sound and how we hear it, be sure to check out the other articles in this Collection."
      }
    ],
    "vocabulary": [
      {
        "id": "a046-v01",
        "term": "Ear Canal",
        "definition": "A tube that carries the sound to the ear drum.",
        "example": "The outer ear collects the sound waves traveling through the air and funnels them into the ear canal, where they bounce against a thin piece of skin about 8 mm across (a little smaller than an M&M candy), called the eardrum, which is stretched across the end of the ear canal.",
        "synonym": ""
      },
      {
        "id": "a046-v02",
        "term": "Eardrum",
        "definition": "A skin-like membrane that vibrates in response to sound, converting the vibrations in the air to motion of the middle ear bones.",
        "example": "The outer ear collects the sound waves traveling through the air and funnels them into the ear canal, where they bounce against a thin piece of skin about 8 mm across (a little smaller than an M&M candy), called the eardrum, which is stretched across the end of the ear canal.",
        "synonym": ""
      },
      {
        "id": "a046-v03",
        "term": "Cochlea",
        "definition": "A spiral chamber, made of bone and filled with fluid, that moves in time with the middle-ear bones and ear drum. In turn, this moves the basilar membrane.",
        "example": "They pick up the vibrations from the eardrum, and send them into the inner ear, or cochlea.",
        "synonym": ""
      },
      {
        "id": "a046-v04",
        "term": "Basilar Membrane",
        "definition": "A flexible membrane in the inner ear that moves in time with the movement of the surrounding fluid. The part that moves most depends on the frequency of the sound.",
        "example": "The cochlea is divided into two sections by a skin-like layer called the basilar membrane.",
        "synonym": ""
      },
      {
        "id": "a046-v05",
        "term": "Frequency",
        "definition": "The rate of vibration of sound waves in the air. The number of times per second that air molecules complete a cycle of being squashed together, expand out, and back.",
        "example": "The membrane closest to the outer ear is more sensitive to high-frequency sounds—as high as 20,000 vibrations per second or Hertz (Hz).",
        "synonym": ""
      },
      {
        "id": "a046-v06",
        "term": "Hair Cells",
        "definition": "Cells on the basilar membrane that convert movement into electrical signals, which are sent to the brain via nerves. They have tiny hairs that move around with the fluid.",
        "example": "All along the basilar membrane are tiny hair cells that measure these vibrations and turn them into electrical signals.",
        "synonym": ""
      },
      {
        "id": "a046-v07",
        "term": "Auditory Nuclei",
        "definition": "A collection of brain cells close together in the brain that are dedicated to processing sound. The medial superior olive and auditory cortex are examples of auditory nuclei.",
        "example": "The parts of the brain that process sounds are called auditory nuclei.",
        "synonym": ""
      },
      {
        "id": "a046-v08",
        "term": "Medial Superior Olive",
        "definition": "A nucleus of the brain that is dedicated to processing information about sound and is important for knowing where sounds come from.",
        "example": "One nucleus, called the medial superior olive, compares the times that a sound arrives at each ear.",
        "synonym": ""
      }
    ],
    "source": {
      "publisher": "Frontiers for Young Minds",
      "url": "https://kids.frontiersin.org/articles/10.3389/frym.2023.1072364",
      "authors": [
        "Christian J. Sumner",
        "Michael A. Akeroyd",
        "Joseph Sollini",
        "Caryl Hart"
      ],
      "citation": "Sumner CJ, Akeroyd MA, Sollini J and Hart C (2023) What Happens When We Hear?. Front. Young Minds. 11:1072364. doi: 10.3389/frym.2023.1072364",
      "copyright": "Copyright © 2023 Sumner, Akeroyd, Sollini and Hart",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "adaptationNote": "Text adapted for reading practice: illustrations, figure pointers and reference markers omitted; glossary definitions retained. The original illustrated article is linked above."
    }
  },
  {
    "id": "a047",
    "slug": "helping-pollinators-in-cities-by-growing-an-urban-pollinator-garden",
    "title": "Helping Pollinators in Cities By Growing an Urban Pollinator Garden",
    "teaser": "Imagine a world without green trees, fun parks, or colorful gardens. As cities grow, these green spaces often become concrete sidewalks and buildings.",
    "category": "Science",
    "tags": [
      "biodiversity",
      "science",
      "migratory",
      "residential",
      "native",
      "chrysalis"
    ],
    "readMinutes": 8,
    "publishedLabel": "New",
    "cover": {
      "theme": "forest-emerald",
      "icon": "Compass",
      "motif": "SCIENCE"
    },
    "blocks": [
      {
        "type": "lead",
        "text": "Imagine a world without green trees, fun parks, or colorful gardens. As cities grow, these green spaces often become concrete sidewalks and buildings. Lack of plants in cities can harm pollinators that rely on green spaces for food and housing. Pollinators are birds and insects that carry pollen or seeds from one plant to another, helping new plants grow every year. If you live in a city, you can help many of these plants and pollinators by building pollinator gardens in your neighborhood—whether that be in your backyard, a community garden, or even on your rooftop! A pollinator garden provides shelter, food, and connection points for important pollinators. These gardens are not only good for pollinators, but they are good for you too! Read on to see how to make your garden, what to decorate it with, and how it can help many insects, plants, and even kids like you!"
      },
      {
        "type": "heading",
        "text": "Gardens Serve as Refueling Stations for Pollinators"
      },
      {
        "type": "paragraph",
        "text": "Imagine you are in gym class, and you have to run four laps around your school’s track. You are sweating and tired by lap two. Luckily, there are fueling stations near the track, full of water and your favorite snacks! After you eat the snacks and drink the water, you have more energy and can keep running. Without the fueling stations you would not have been able to finish all those laps. The rest stations that you rely on during a long run on a hot day are like gardens that serve as stopping points for pollinators traveling across cities. Pollinator gardens act as “green stepping stones”, helping pollinators such as monarch butterflies, ants, and birds refuel and move safely through big cities throughout North America, like New York City, Los Angeles, and Mexico City."
      },
      {
        "type": "heading",
        "text": "What Is an Urban Pollinator Garden?"
      },
      {
        "type": "paragraph",
        "text": "An urban pollinator garden is a garden in a city or suburb. These gardens are refueling and resting stations that support many migratory and residential pollinators. Your pollinator garden can have native plants and flowers, birdhouses, and rocks. Native plants are important because these are the plants that pollinators in your area are used to. You might be wondering where to plant a pollinator garden. Your backyard, schoolyard, neighborhood parks, or even your rooftop can all be perfect spots. Rooftop gardens give insects and birds a place to go in the city, away from the ruckus. You have probably seen birds, butterflies, and bees flying near tall buildings, but did you know that insects like ants can also make it to the tops of city rooftops? By adding gardens throughout your city, people can help many local pollinators and plants. Visit Xerces Society for more information!"
      },
      {
        "type": "heading",
        "text": "Urban Pollinator Gardens Can Help Migratory Pollinators"
      },
      {
        "type": "paragraph",
        "text": "Imagine a monarch butterfly on its long migration. When the weather starts to get cold in North America, monarchs travel to Mexico, where it is much warmer. When they land in Mexico, they hang out together in trees and wait for spring. In the springtime, they lay eggs on milkweed. The eggs hatch as larvae commonly called caterpillars, which eat a lot of milkweed and grow very big. Then they hang upside down and form their green chrysalis, which they use to turn from caterpillars into the next generation of monarch butterflies."
      },
      {
        "type": "paragraph",
        "text": "Monarchs are fragile yet mighty! They use gardens and fields full of flowers as stopping sites to rest and eat as they travel. This is why it is so important to make sure that there are plenty of gardens and fields with milkweed and flowers, where they can stop and refuel on their long journeys. Monarchs are what is known as an indicator species, which means that they can tell us how well an ecosystem is doing. When monarch populations are high, that means the ecosystem is doing well. When their populations are low, this means the ecosystem is doing badly."
      },
      {
        "type": "paragraph",
        "text": "Monarchs also help the ecosystem by pollinating flowers. Monarch populations contribute to the biodiversity of an ecosystem and, without them, there would not be as many flowers to smell. You can help monarch butterflies and other important pollinators by planting pollinator gardens that can give these butterflies access to shelter and food as they migrate."
      },
      {
        "type": "heading",
        "text": "Urban Pollinator Gardens Can Help Residential Pollinators"
      },
      {
        "type": "paragraph",
        "text": "Ants are found in cities around the world, like Tokyo, Japan; Rio de Janeiro, Brazil; and Quito, Ecuador. Even though you may need a magnifying glass to see them, ants are important for their ecosystems because they keep the soil healthy and pollinate flowering plants. Ants differ from monarchs because they do not migrate—instead, they are residential pollinators, meaning they stay in the same ecosystem year-round. You can find ants in parks, on rooftops, and even in your backyard. You might be wondering how such tiny critters can live in big cities. They eat, sleep, and move around using pollinator gardens. See if you can find ants in the gardens at your home, school, or local park."
      },
      {
        "type": "paragraph",
        "text": "However, ants are in trouble! As cities grow, there are fewer spaces with grass and trees for pollinators, and these spaces are often separated from each other. This can lead to a decline in insect populations because there are fewer places for them to live and eat, leading to a loss of biodiversity. However, urban pollinator gardens give residential pollinators a place to live, helping to preserve biodiversity."
      },
      {
        "type": "heading",
        "text": "Urban Pollinator Gardens Help Birds"
      },
      {
        "type": "paragraph",
        "text": "Did you know that birds can also be pollinators? The hummingbird is a great pollinator that can be seen flying around in cities. These tiny birds eat the nectar from flowers and spread pollen in the process. However, in cities, hummingbirds (as well as other birds) are in danger. Tall buildings and the lack of urban green spaces puts birds at risk of getting hurt. Without proper spaces to rest and drink nectar from flowers, hummingbirds are in danger of dying from exhaustion. However, by adding pollinator gardens around the city, we can increase the spaces available for hummingbirds to visit. Pollinator gardens with beautiful flowers and birdhouses give birds places to eat and thrive."
      },
      {
        "type": "heading",
        "text": "Urban Pollinator Gardens Are Good For You, Too!"
      },
      {
        "type": "paragraph",
        "text": "Now you understand how pollinator gardens are good for pollinators, but did you know they are also good for you? Think about all the different things you like to do outside in nature, like play sports, play on playgrounds, or hang out with friends. Now, think about how that makes you feel. Spending time outside in the sun and around nature helps you feel happy, and being active outside helps you stay healthy. But imagine if you did not have any pretty flowers to look at, any green spaces to run around in, or any interesting animals to see. This would make spending time outside a lot less interesting, right?"
      },
      {
        "type": "paragraph",
        "text": "Thankfully, there are many things you can do as an environmental steward to help support the beautiful nature around you. First, gardening in an area with little green space can help you to get outside more and enjoy nature. Your pollinator garden can be a fun thing for you to do, and it can teach you more about gardening and wildlife. You can even teach your friends and family about your garden and maybe even inspire them to plant gardens of their own!"
      },
      {
        "type": "heading",
        "text": "Making an Urban Pollinator Garden"
      },
      {
        "type": "paragraph",
        "text": "Creating a pollinator garden in a city is easier than you think! Start by finding an open, sunny spot in your neighborhood or backyard. Choose the native flowers and plants that you want to grow. Different flowers and plants need certain amounts of sunlight and water, so choose ones that work best for the amount of sun and water your garden receives. Include a mix of plants that flower at different times, to support pollinators year-round. You can also choose to plant flowers called perennials, which will return to your garden every year. Many perennial plants are beloved by your favorite pollinators, including milkweed, which attracts beautiful butterflies like the monarch."
      },
      {
        "type": "paragraph",
        "text": "You can visit the Xerces Society website for plant and flower information. Finding the best flowers and plants is like a fun puzzle! You can also plant vegetables near flowers to help the veggies grow bigger. This is called companion planting. Now it is time to start building! You can build your garden using wood or even a kiddie pool! Fill it with soil, add rocks, twigs, logs, and bird feeders to help bees, ants, and birds feel at home. More information on what you can decorate your garden with can be found at Xerces Society! Once it is planted, your urban garden will support pollinators and bring nature right to you!"
      }
    ],
    "vocabulary": [
      {
        "id": "a047-v01",
        "term": "Migratory",
        "definition": "Describes animals that move from one place to another based on the seasons.",
        "example": "These gardens are refueling and resting stations that support many migratory and residential pollinators.",
        "synonym": ""
      },
      {
        "id": "a047-v02",
        "term": "Residential",
        "definition": "Describes a pollinator that lives in one general location.",
        "example": "These gardens are refueling and resting stations that support many migratory and residential pollinators.",
        "synonym": ""
      },
      {
        "id": "a047-v03",
        "term": "Native",
        "definition": "Belonging to a particular place.",
        "example": "Your pollinator garden can have native plants and flowers, birdhouses, and rocks.",
        "synonym": ""
      },
      {
        "id": "a047-v04",
        "term": "Chrysalis",
        "definition": "The protective coating made by a caterpillar to undergo metamorphosis.",
        "example": "Then they hang upside down and form their green chrysalis, which they use to turn from caterpillars into the next generation of monarch butterflies.",
        "synonym": ""
      },
      {
        "id": "a047-v05",
        "term": "Biodiversity",
        "definition": "The variety of living things in one area.",
        "example": "Monarch populations contribute to the biodiversity of an ecosystem and, without them, there would not be as many flowers to smell.",
        "synonym": ""
      },
      {
        "id": "a047-v06",
        "term": "Environmental Steward",
        "definition": "A person who helps protect the environment.",
        "example": "Thankfully, there are many things you can do as an environmental steward to help support the beautiful nature around you.",
        "synonym": ""
      },
      {
        "id": "a047-v07",
        "term": "Perennials",
        "definition": "Plants that return to your garden every year.",
        "example": "You can also choose to plant flowers called perennials, which will return to your garden every year.",
        "synonym": ""
      },
      {
        "id": "a047-v08",
        "term": "Companion Planting",
        "definition": "growing plants side-by-side so that they grow better.",
        "example": "This is called companion planting.",
        "synonym": ""
      }
    ],
    "source": {
      "publisher": "Frontiers for Young Minds",
      "url": "https://kids.frontiersin.org/articles/10.3389/frym.2026.1615745",
      "authors": [
        "Savanah Chiodi",
        "Hannah Gurholt",
        "Swanne Gordon"
      ],
      "citation": "Chiodi S, Gurholt H and Gordon S (2026) Helping Pollinators in Cities By Growing an Urban Pollinator Garden. Front. Young Minds. 14:1615745. doi: 10.3389/frym.2026.1615745",
      "copyright": "Copyright © 2026 Chiodi, Gurholt and Gordon",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "adaptationNote": "Text adapted for reading practice: illustrations, figure pointers and reference markers omitted; glossary definitions retained. The original illustrated article is linked above."
    }
  },
  {
    "id": "a048",
    "slug": "all-aboard-behind-the-scenes-of-a-scientific-research-cruise",
    "title": "All Aboard! Behind the Scenes of a Scientific Research Cruise",
    "teaser": "From our climate to the air we breathe, the ocean influences the world around us. Scientists are always looking for new ways to explore and study the ocean.",
    "category": "Science",
    "tags": [
      "biodiversity explore the collection",
      "science",
      "climate",
      "aerosol",
      "conductivity",
      "microbes",
      "zooplankton"
    ],
    "readMinutes": 10,
    "publishedLabel": "New",
    "cover": {
      "theme": "forest-emerald",
      "icon": "Compass",
      "motif": "SCIENCE"
    },
    "blocks": [
      {
        "type": "lead",
        "text": "From our climate to the air we breathe, the ocean influences the world around us. Scientists are always looking for new ways to explore and study the ocean. One way we do this is by going on specially designed ships that allow us to study the deep sea, far from land. On our latest expedition aboard the Research Vessel Sally Ride, we went out 300 miles into the North Pacific Ocean for a week. We used some of the most important ocean science tools to catch tiny marine animals, collect water from some of the deepest depths, uncover mysteries of oceans past, and study how desert dust feeds marine animals today."
      },
      {
        "type": "heading",
        "text": "Why Do Scientists Go On Research Cruises?"
      },
      {
        "type": "paragraph",
        "text": "When we think about the ocean, most of us think of crashing waves and animals like whales and dolphins. The ocean covers 70% of our planet’s surface and is incredibly important to the Earth and human life. It helps determine our weather and climate, and it absorbs some of the gasses that cause climate change. Fish from the ocean feed billions of people every day. We rely on the ocean for so much that it is important to understand how it works and how humans are changing it. Scientists have lots of tools for studying the ocean. We can use satellites to look at the ocean from space, and we can study the ocean from the coast. These methods give us a good idea about the ocean’s edges, but we also need ways to study the deep ocean, far away from land. To do so, scientists go to sea on specially designed ships with science tools for collecting all kinds of information. These research expeditions can be days or even months long."
      },
      {
        "type": "paragraph",
        "text": "Come aboard our expedition! Here is a look into our voyage on board the Research Vessel Sally Ride in the North Pacific Ocean. You can learn what we did at sea and how we used four important tools to study the ocean: the CTD, the multicorer, the tow, and aerosol samplers."
      },
      {
        "type": "heading",
        "text": "The CTD: Diving Into the Deep Ocean"
      },
      {
        "type": "paragraph",
        "text": "The CTD is named after three things it measures. “C” is for conductivity (how salty seawater is), “T” is for temperature (how hot or cold seawater is), and “D” is for depth (how deep the CTD has sunk). A CTD is shaped like a giant can with lots of smaller tubes inside it. It carries water samplers and electronic sensors. We lower the CTD off the side of the ship, and as it sinks, it collects both samples and information. We can also add more tools to the CTD to measure things like how much sunlight there is, how many living things there are, and how cloudy the water is. All this information is sent back up to the ship for the scientists to use."
      },
      {
        "type": "paragraph",
        "text": "The water samplers are bottles that can be opened and closed deep in the ocean using electronics on the ship. The water samples allow us to measure what makes up ocean water and what lives in it. By filtering the water, we can look at particles of dust, DNA and nutrients. Just for fun, we decorated styrofoam and sent it down to the deep ocean on the CTD! The weight of the ocean above it squeezed all of the air out of the styrofoam and made it a lot smaller."
      },
      {
        "type": "paragraph",
        "text": "We use information from the CTD to answer important questions about what happens in the ocean. On our cruise, Linqing used water from the CTD to explore how ocean water moves around. Tricia used the CTD to look at how food is recycled in the ocean. Kaycie used the CTD to study how microbes, or tiny organisms, get energy from the food they eat. We sent the CTD down more than 4,500 m (14,764 feet) below the ocean’s surface."
      },
      {
        "type": "heading",
        "text": "Coring: Collecting Deep Ocean Mud"
      },
      {
        "type": "paragraph",
        "text": "We have a time machine aboard. It does not carry us physically into the past, but we can use it to see what Earth was like long ago. Our time machine is a multicorer. It collects mud from the seafloor that accumulated over the past centuries of ocean history. The seafloor is constantly being rained on by mud carried into the sea by rivers, dust, pollen, and ash blown from land, and dead organisms that sink from the sea surface. All this stuff settles on the ocean bottom every hour of every day. As the centuries pass, the layers of mud thicken, preserving the history of fires, floods, and land life swept into the sea. The mud obtained by the multicorer tells the story of Earth’s past."
      },
      {
        "type": "paragraph",
        "text": "How does the multicorer work? It looks like a moon lander with four legs supporting a triangular structure attached to the ship with a cable. Heavy weights slowly shove eight plastic tubes into the seabed. The device is then hauled back to the ship with a cable. Each tube is sealed by spring-loaded doors to preserve the mud inside. The tubes of mud are called cores."
      },
      {
        "type": "paragraph",
        "text": "The layers in the cores capture information about how humans are changing the world. Looking back at what Earth was like long ago helps us predict how the Earth might change in the future. On our cruise, Cate is using cores to find out how much of the plastic that humans throw away ends up on the seafloor. She will compare the mud now to mud from decades ago, to see how it has changed. The cores are like a fat book of Earth’s history—a time machine to our past."
      },
      {
        "type": "heading",
        "text": "Tows: Catching Little Animals in Our Net"
      },
      {
        "type": "paragraph",
        "text": "We do not care only about ocean mud and ocean water—we also care about ocean life! We use a net tow to catch zooplankton, which are small ocean animals that mostly drift along with ocean currents. Most zooplankton are so tiny that you need a microscope to see them well. Some zooplankton, like jellyfish, are bigger. Zooplankton are an important part of the ocean’s food web because they get eaten by fish and other animals. Lots of large animals like tuna, squid, and crabs start out as plankton before they get big, while others remain tiny their whole lives."
      },
      {
        "type": "paragraph",
        "text": "The tow looks like a net that you might use to catch fish in a stream, but ours is so big that it takes a full team of scientists to use. Its holes are much smaller than a fishing net’s holes, so zooplankton will not float through. We hang the tow off the side of the ship into the water. We then move the boat forward, so the tow catches the zooplankton swimming through the water. After a few minutes, we bring the net back to the ship to see what we caught. We have a microscope on the ship to see what the tiny zooplankton look like. We also store some of the zooplankton to study back on land."
      },
      {
        "type": "paragraph",
        "text": "We collect zooplankton to answer all sorts of questions: How do plankton change over time? Are large or small plankton more common? What do plankton eat and where does it come from? On our cruise, Annie collected zooplankton to help answer some of these questions. Some of the zooplankton also end up in the Scripps’ Collections, where they will sit on shelves like library books alongside samples over 100 years old!"
      },
      {
        "type": "heading",
        "text": "Aerosol Sampling: Collecting Dust From Ocean Air"
      },
      {
        "type": "paragraph",
        "text": "Did you know that plankton get food from the sky? Although you might not be able to see it, there are billions of tiny pieces of rock floating around in the air all around you. These little particles are called dust. Around 500 million tons of dust fall into the ocean each year, bringing with it nutrients like iron that many organisms, like phytoplankton, need to live. This dust comes from all over the world, including the Sahara Desert in Africa and glaciers in Alaska. It floats with the wind until it eventually falls into the ocean, where it can be used by animals. The amount of dust that enters the ocean changes depending on what is happening on land. Dust helps determine how much life is in the ocean, which can affect global climate by adding or removing gasses from our atmosphere."
      },
      {
        "type": "paragraph",
        "text": "Onboard the ship, Emmet studied dust by sucking lots of air through a filter that catches the dust. To do this, he used a type of aerosol sampler called a Hi-Vol air sampler. Back on land in his lab, he can learn a lot about this dust. He hopes to learn more about the amazing ways that air transports nutrients around the world, even if we cannot see it with our eyes."
      },
      {
        "type": "heading",
        "text": "How Can I Go To Sea?"
      },
      {
        "type": "paragraph",
        "text": "There are all sorts of ways to become a scientist who goes to sea. The scientists on our cruise are from five different countries. They studied various college subjects—chemistry, biology, physics, anthropology, and even art! Some of them have always wanted to study the ocean, and some did other things before becoming ocean scientists. We all worked really hard and prepared a lot so that we could deal with the challenges of being at sea. Some of the problems we overcame during our cruise were people getting sick, tools breaking, and experiments not working the way we expected. To get a taste of what it is like to be a scientist at sea, explore websites (like this one) about ocean science. You can also get out and explore near where you live, from a park to a stream to a city block. To become a scientist, you need a sense of wonder and you must pay attention to little details, write everything down, and notice changes that happen over time. Above all, have fun!"
      }
    ],
    "vocabulary": [
      {
        "id": "a048-v01",
        "term": "Climate",
        "definition": "The weather conditions of a place over a long period of time.",
        "example": "From our climate to the air we breathe, the ocean influences the world around us.",
        "synonym": ""
      },
      {
        "id": "a048-v02",
        "term": "Aerosol",
        "definition": "Small liquid or gas particles suspended in a gas. Here, this gas is air.",
        "example": "You can learn what we did at sea and how we used four important tools to study the ocean: the CTD, the multicorer, the tow, and aerosol samplers.",
        "synonym": ""
      },
      {
        "id": "a048-v03",
        "term": "Conductivity",
        "definition": "How easy it is for electricity to pass through a material. In the ocean, we use conductivity to measure how salty seawater is.",
        "example": "The CTD is named after three things it measures. “C” is for conductivity (how salty seawater is), “T” is for temperature (how hot or cold seawater is), and “D” is for depth (how deep the CTD has sunk).",
        "synonym": ""
      },
      {
        "id": "a048-v04",
        "term": "Microbes",
        "definition": "Living things that are too small to see with just your eyes.",
        "example": "Kaycie used the CTD to study how microbes, or tiny organisms, get energy from the food they eat.",
        "synonym": ""
      },
      {
        "id": "a048-v05",
        "term": "Zooplankton",
        "definition": "A category of ocean animals that mostly drift along with ocean currents. Zooplankton include everything from big jellyfish to tiny larvae.",
        "example": "We use a net tow to catch zooplankton, which are small ocean animals that mostly drift along with ocean currents.",
        "synonym": ""
      },
      {
        "id": "a048-v06",
        "term": "Phytoplankton",
        "definition": "Microscopic organisms that live in water and get their energy from the sun, just like plants do on land.",
        "example": "Around 500 million tons of dust fall into the ocean each year, bringing with it nutrients like iron that many organisms, like phytoplankton, need to live.",
        "synonym": ""
      },
      {
        "id": "a048-v07",
        "term": "Atmosphere",
        "definition": "The layer of gases that surround our planet.",
        "example": "Dust helps determine how much life is in the ocean, which can affect global climate by adding or removing gasses from our atmosphere.",
        "synonym": ""
      }
    ],
    "source": {
      "publisher": "Frontiers for Young Minds",
      "url": "https://kids.frontiersin.org/articles/10.3389/frym.2023.1184073",
      "authors": [
        "Tricia Light",
        "Emmet Norris",
        "Dongran Zhai",
        "Ruth Varner",
        "Kaycie B. Lanpher",
        "Dante Capone",
        "Natalia G. Erazo",
        "Richard Norris"
      ],
      "citation": "Light T, Norris E, Zhai D, Varner R, Lanpher KB, Capone D, Erazo NG and Norris R (2024) All Aboard! Behind the Scenes of a Scientific Research Cruise. Front. Young Minds. 12:1184073. doi: 10.3389/frym.2023.1184073",
      "copyright": "Copyright © 2024 Light, Norris, Zhai, Varner, Lanpher, Capone, Erazo and Norris",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "adaptationNote": "Text adapted for reading practice: illustrations, figure pointers and reference markers omitted; glossary definitions retained. The original illustrated article is linked above."
    }
  },
  {
    "id": "a049",
    "slug": "are-warm-ocean-currents-melting-the-ice-in-antarctica",
    "title": "Are Warm Ocean Currents Melting the Ice in Antarctica?",
    "teaser": "We went to Antarctica on a research ship to set out instruments, which stayed in the water and took measurements for 2 years. While the instruments were out, we went to a research facility and had a swimming pool full of water turn around on a big merry-go-round for 2 months.",
    "category": "Science",
    "tags": [
      "earth sciences explore the collection",
      "science",
      "ice sheet",
      "ice shelves",
      "sea ice",
      "sea-level rise",
      "climate change"
    ],
    "readMinutes": 9,
    "publishedLabel": "New",
    "cover": {
      "theme": "ocean-teal",
      "icon": "Compass",
      "motif": "SCIENCE"
    },
    "blocks": [
      {
        "type": "lead",
        "text": "We went to Antarctica on a research ship to set out instruments, which stayed in the water and took measurements for 2 years. While the instruments were out, we went to a research facility and had a swimming pool full of water turn around on a big merry-go-round for 2 months. We did all this to understand whether warm currents are melting ice in Antarctica. What was the answer? Let us start from the beginning…"
      },
      {
        "type": "heading",
        "text": "Very Cold and Very Far Away: a Frozen Continent and Its Importance"
      },
      {
        "type": "paragraph",
        "text": "Antarctica—the huge landmass at the South Pole—is the only continent that nobody lives on permanently. It is very cold—the average temperature is -10°C (14°F) near the coast and -60°C (-76°F) in the interior. Antarctica is almost completely covered in a sheet of snow and ice. This ice sheet is up to 5 km (3 miles) thick and grows thicker as snow falls on it. The parts of an ice sheet that float on the ocean but are still attached to the ice sheet are called ice shelves. They can extend for many kilometers away from the land. There, big ice bergs break off and leave a wall of ice that reaches 250–500 m (820–1,640 ft) down into the ocean."
      },
      {
        "type": "paragraph",
        "text": "It is important to distinguish ice shelves and ice bergs from sea ice, even though all three float on the ocean. Sea ice forms when water in the ocean freezes, similar to ice that forms on lakes. When sea ice melts, it does not add extra water to the ocean, thus sea level does not change. Ice that originates on land, however, causes sea-level rise when it melts. The glaciers on Antarctica start out as an ice sheet resting on land, but their offshore parts float on the ocean. Those parts act as a stopper that keeps the rest of the ice on land. If the floating ice melts, more ice will slide from land into the ocean and cause sea-level rise."
      },
      {
        "type": "paragraph",
        "text": "The worst-case estimates predict that the sea level could rise 5 cm/year (2 in/year). This is really fast! Imagine a spot near the ocean where you get slightly wet toes right now. Forty years from now, the water level could already be above your head! It is important to be able to predict how fast sea level will rise so that we can prepare for it. Therefore, we need to understand how much ice is really melting and what causes melting."
      },
      {
        "type": "heading",
        "text": "The Ocean is Melting Antarctica’s Ice"
      },
      {
        "type": "paragraph",
        "text": "Ice has been melting faster over the last decades because of climate change, due to warmer air temperatures and because more ice is breaking off and floating away, but also because of the warmer water around Antarctica. The world’s strongest ocean current circles all around Antarctica. In some places it brings relatively warm water (1–2°C; 34–36°F) toward the ice shelves, warm enough to melt ice if water and ice contact each other. But do they?"
      },
      {
        "type": "paragraph",
        "text": "Since the sea floor around Antarctica is full of narrow, deep valleys, those canyons could funnel the warm water toward the ice, similar to water slides that funnel you down into the swimming pool. If the currents manage to flow underneath the ice shelves, this could increase melting from below. The thinner the floating ice shelves become, the faster ice will slide off Antarctica."
      },
      {
        "type": "paragraph",
        "text": "But it is difficult for warm currents to get underneath the floating ice shelves. At their thinnest parts, they still reach 250–500 m deep into the water. Imagine the ocean as a room with the ocean surface as its ceiling: the ceiling would suddenly drop by 250–500 m where the ice shelves start. This change in height makes it more difficult for currents to flow underneath. In our imaginary room, people wanting to go underneath the dropped ceiling might have to duck or even crawl, which some might be better at than others. Similarly, there are different kinds of currents—those that stay close to the ground and dive below an obstacle, and those that cannot. But which sort of currents do we have around Antarctica, and does the warm water actually get close enough to the ice to melt it? There are several ways to find out."
      },
      {
        "type": "heading",
        "text": "Figuring Out How Fast the Ice is Melting, and Why"
      },
      {
        "type": "paragraph",
        "text": "It seems like we could easily take a research ship, sail to Antarctica, and observe the currents directly. But there are several reasons why this is not easy. The weather there is bad and the ocean is covered in sea ice during winter, threatening ships, and crews. Therefore, data taken from research ships only exists in selected locations for short periods of time, and only in summer."
      },
      {
        "type": "paragraph",
        "text": "An alternative are instruments that stay in the ocean for long periods of time. Moorings are anchored to a fixed location on the ocean floor, thus giving measurements in that location specifically. Floats are drifting with the currents and therefore provide data only where the currents take them. Instruments can also be mounted on seals, giving data wherever the seals choose to swim. Gliders are like small submarines and move slowly, remotely controlled through the water, but need a research ship nearby. And, even for instruments, it is dangerous to be too close to the ice edge—there is a lot of both skill and luck involved in deploying and recovering instruments! It stays exciting until the very end: will we find the instruments again, get them back on board, and will they actually have recorded for the full period of time they were in the ocean? The data can only be read from the instruments when they are safely back on board the ship."
      },
      {
        "type": "paragraph",
        "text": "A second approach to understanding the warm currents and ice shelves is to simulate the system by building it in miniature (imagine a model railway). Then, we can change the shapes of the ice shelves or the canyons in our model, for example, to understand the impact of each change on the current’s behavior in the real world."
      },
      {
        "type": "heading",
        "text": "Measuring Directly in the Ocean"
      },
      {
        "type": "paragraph",
        "text": "We set out moorings with instruments that can tell us about water temperature and the direction and strength of ocean currents at three sites over a period of 2 years: one right at the front of the ice shelf and two along a canyon that funnels water towards the ice shelf. Data from two moorings showed water flowing toward the ice shelf. The third mooring, closest to the ice shelf, showed the current turning just before reaching the ice shelf. That means the current’s warm water does not continue straight underneath the ice shelf. Instead, it turns and flows along the front of the ice shelf before flowing back into the open ocean. Therefore, the ice is not melting as much as it would if the current went underneath the ice shelf."
      },
      {
        "type": "heading",
        "text": "Recreating Ocean Currents in a Miniature World"
      },
      {
        "type": "paragraph",
        "text": "In the lab in Grenoble, France, we found the explanation for why the current turns around. We used a 13 m diameter pool that rotates, simulating Earth’s rotation. We built a plastic canyon to represent our area of interest in Antarctica. We then pumped water into the canyon to create a current. The end of the canyon was covered by a plastic “ice shelf” that we could rise, lower, and tilt to create different conditions. We made the currents visible by mixing little plastic particles into the water and lighting them with lasers. Following where particles moved between photographs of the laser-lit particles, we could reconstruct the currents."
      },
      {
        "type": "paragraph",
        "text": "For an ice shelf that starts with a steep step, the current nibbles at the ice edge, but it is forced to turn around without flowing underneath the ice. With only very little water movement underneath the ice, there is little melting there. However, if the shape of the ice sheet is changed so that it starts at the sea surface and then gradually reaches deeper into the water, it is easier for currents to move under the ice. An ice shelf of that shape will melt faster. Also, if the structure of the current changes such that only the lower part is moving, it might behave differently, and more water might be able to get under the ice shelf."
      },
      {
        "type": "heading",
        "text": "Predicting the Future"
      },
      {
        "type": "paragraph",
        "text": "Now that we know how the shape of the ice shelves as well as the type of currents approaching them influence how fast ice melts, we can use that to help predict future sea levels. Computer models, similar to those used for weather forecasts, can accurately calculate where the ocean currents go and how much ice they melt. This information then becomes one piece in the puzzle of climate predictions that can help make policy decisions to both prevent and adapt to changing sea levels."
      }
    ],
    "vocabulary": [
      {
        "id": "a049-v01",
        "term": "Ice Sheet",
        "definition": "Large ice masses that cover Greenland and Antarctica. They form as it snows and rains and more and more ice accumulates, and can be up to 5 km thick.",
        "example": "This ice sheet is up to 5 km (3 miles) thick and grows thicker as snow falls on it.",
        "synonym": ""
      },
      {
        "id": "a049-v02",
        "term": "Ice Shelves",
        "definition": "Large ice sheets that flow off land and float on the ocean, but are still connected to the ice that is still resting on land. They can be several hundreds of meters thick.",
        "example": "The parts of an ice sheet that float on the ocean but are still attached to the ice sheet are called ice shelves.",
        "synonym": ""
      },
      {
        "id": "a049-v03",
        "term": "Sea Ice",
        "definition": "Ice that forms when sea water freezes. It floats on the ocean (see https://kids.frontiersin.org/article/10.3389/frym.2019.00079 ).",
        "example": "It is important to distinguish ice shelves and ice bergs from sea ice, even though all three float on the ocean.",
        "synonym": ""
      },
      {
        "id": "a049-v04",
        "term": "Sea-level Rise",
        "definition": "Long-term average rise of the ocean’s water level. The melting of Antarctic and Greenland ice caps is contributing to sea-level rise.",
        "example": "Ice that originates on land, however, causes sea-level rise when it melts.",
        "synonym": ""
      },
      {
        "id": "a049-v05",
        "term": "Climate Change",
        "definition": "The long-term change in climate patterns like temperatures, precipitation, ocean currents, and sea levels. Climate change occurs naturally and leads to warm and cold periods, but most recently it is caused by humans.",
        "example": "Ice has been melting faster over the last decades because of climate change, due to warmer air temperatures and because more ice is breaking off and floating away, but also because of the warmer water around Antarctica.",
        "synonym": ""
      },
      {
        "id": "a049-v06",
        "term": "Ocean Current",
        "definition": "The average motion of water in the ocean. Ocean currents can be driven by different processes, like the wind or density differences in the water (see my article https://kids.frontiersin.org/article/10.3389/frym.2019.00085 ).",
        "example": "The world’s strongest ocean current circles all around Antarctica.",
        "synonym": ""
      },
      {
        "id": "a049-v07",
        "term": "Mooring",
        "definition": "Oceanographic instruments that are anchored to the sea floor and stay in the ocean for a certain time period to collect data. Moorings can measure ocean currents and the temperature and salinity of sea water.",
        "example": "The third mooring, closest to the ice shelf, showed the current turning just before reaching the ice shelf.",
        "synonym": ""
      }
    ],
    "source": {
      "publisher": "Frontiers for Young Minds",
      "url": "https://kids.frontiersin.org/articles/10.3389/frym.2020.00124",
      "authors": [
        "Mirjam S. Glessmer",
        "Nadine Steiger",
        "Elin Darelius",
        "Anna WåHlin"
      ],
      "citation": "Glessmer MS, Steiger N, Darelius E and WåHlin A (2020) Are Warm Ocean Currents Melting the Ice in Antarctica?. Front. Young Minds. 8:124. doi: 10.3389/frym.2020.00124",
      "copyright": "Copyright © 2020 Glessmer, Steiger, Darelius and WåHlin",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "adaptationNote": "Text adapted for reading practice: illustrations, figure pointers and reference markers omitted; glossary definitions retained. The original illustrated article is linked above."
    }
  },
  {
    "id": "a050",
    "slug": "how-to-use-your-memories-to-help-yourself-learn-new-things",
    "title": "How to Use Your Memories to Help Yourself Learn New Things",
    "teaser": "Remembering is an essential brain function. Think about it—what would happen if you did not remember anything?",
    "category": "Learning",
    "tags": [
      "neuroscience and psychology explore the collection",
      "learning",
      "schema",
      "hippocampus",
      "medial prefrontal cortex",
      "method of loci",
      "misconception"
    ],
    "readMinutes": 9,
    "publishedLabel": "New",
    "cover": {
      "theme": "midnight-gold",
      "icon": "GraduationCap",
      "motif": "LEARNING"
    },
    "blocks": [
      {
        "type": "lead",
        "text": "Remembering is an essential brain function. Think about it—what would happen if you did not remember anything? You would not be able to recall the things you learn at school. Actually, you would not even know that you had to go to school, or where your school is! Many people think that memory can be compared to a closet, where you put something and later retrieve it the same way you put it in. But this is not really how it works. In fact, memory works more like news websites on the internet that keep changing content depending on what happens in the world. A good website also includes links to other websites where you can look up related information. Whether you remember something well depends on many things that happen in your brain during and after learning. One factor that is very important for learning is the knowledge that is already stored in your brain. When you already know a lot, it is easier to add new information. We will also show you how you can use this knowledge about how memories are formed to help you remember new things you learn at school."
      },
      {
        "type": "heading",
        "text": "Your Previous Knowledge Makes It Easier to Learn"
      },
      {
        "type": "paragraph",
        "text": "Take a moment to think about everything you already know. Consider life events, the people you know, books you have read, games you have played, stuff you have learned at school, et cetera… It is a lot, right? Well, it is very useful to have all this knowledge stored in your brain. This knowledge helps you to understand the world around you, but it also makes learning new information easier, since you can link the new information with what you already know. For example, when you already know some things about the brain because you have read Frontiers Young Minds Neuroscience articles before, it will probably be easier for you to remember what we are about to tell you. The neuroscience knowledge in your brain makes it more likely for new memories to “stick.” We call such a knowledge structure a schema."
      },
      {
        "type": "heading",
        "text": "How Memory Works in Your Brain"
      },
      {
        "type": "paragraph",
        "text": "In the brain, there are many regions that help to store memories. The most important one is called the hippocampus (which means seahorse, because it is shaped like a seahorse). Without your hippocampus you could not learn new information. Scientists think that the hippocampus links different parts of a memory together. For example, when you learn that fish lay eggs, the hippocampus makes a connection between “fish” and “eggs”. This means that the memory itself is not in the hippocampus, but without the help of the hippocampus, you could not link the different parts of the memory together. This happens when forget something: the different parts of the memory are still there, but they cannot be connected anymore."
      },
      {
        "type": "paragraph",
        "text": "Another brain region, called the medial prefrontal cortex, can also help you remember information, but scientists think that this region learns differently than the hippocampus. Based on your schema knowledge, the medial prefrontal cortex figures out where to best place new information and then connects it with your schema. This means that when you learn a new type of fish, like a goldfish, your medial prefrontal cortex will immediately connect that to “laying eggs,” because that is what you have remembered before. This process is called integration, which means to combine into one. The integration process helps you to uncover connections between new and old knowledge For example, if you know that fish lay eggs and that a goldfish is a fish, you could uncover that goldfish lay eggs. This is a new fact that your medial prefrontal cortex helped you discover. So, you can see that it can be helpful to use this integration process when learning new information."
      },
      {
        "type": "heading",
        "text": "Schemas at School"
      },
      {
        "type": "paragraph",
        "text": "Especially at school, it can be very helpful to actively use your schema knowledge when you learn new information. You can do this in different ways. Before starting a lesson, you can revisit what you have learned before about a certain topic (for example, that fish lay eggs). Or, while studying, you can pause often and think about what you just learned and how the new knowledge links to what you already know. This will help you to use your medial prefrontal cortex to integrate new information and remember it better for tests. In addition, such integration helps you to build better schemas so you can remember new, related information even better in the future."
      },
      {
        "type": "paragraph",
        "text": "Sometimes, we can use memory “tricks” to link new knowledge to our schema knowledge. For example, when learning a list of words, you can link these words to places in your room or another familiar environment. This is called the method of loci (loci means “places” in Latin ). It is used by many people to remember arbitrary information that is hard to connect to schema knowledge, like a long grocery list. While you look at the grocery list, you can imagine every item somewhere in your living room (for example, a box of ice cream on the couch), and when you are in the supermarket, you just have to think about your couch to remember what you wanted to buy. With a bit of training, this method will work for you too!"
      },
      {
        "type": "heading",
        "text": "Be Aware of Incorrect Memories"
      },
      {
        "type": "paragraph",
        "text": "Unfortunately, it is not all good news. Relying very strongly on schema knowledge can also lead to incorrect memories. For example, consider the “fish lay eggs” example we gave earlier. What happens when you then learn about dolphins? Because dolphins look like other fish, and you already know a lot about fish, you could think that they lay eggs as well. However, this is not true. Dolphins are mammals, so dolphins give birth to live dolphin babies, just like humans. We call such false memories misconceptions. These misconceptions can arise when your schema knowledge about something (in this case how fish make babies) is very strong. The misconception will make it very hard to remember when you learn something that does not fit (that the dolphin does not lay eggs). In this case, your medial prefrontal cortex should not integrate the dolphin with your fish schema. Instead, your hippocampus should kick in to make a separate memory. How do you do this?"
      },
      {
        "type": "heading",
        "text": "Tips"
      },
      {
        "type": "paragraph",
        "text": "Here are a few tips to help you use your schema knowledge when learning new things at school. These tips should also help you to avoid or get rid of misconceptions:"
      },
      {
        "type": "paragraph",
        "text": "Reactivate: When you learn new information, reactivate related schema knowledge. Close your eyes and take a moment to remember what you have learned about this topic before and how it connects to the new information you want to learn."
      },
      {
        "type": "paragraph",
        "text": "Elaborate: Try to link new information to different kinds of schema knowledge. For example, when you must learn in biology that dolphins are mammals, you can now link it to your memories about schemas and the example of fish that you read here. The more links you make, the better you can integrate new information and remember it well. Making strong and detailed links can also avoid the formation of misconceptions."
      },
      {
        "type": "paragraph",
        "text": "Space, repeat, and alternate: You can best create and extend schemas by learning and repeating new information in small pieces over time: hours, days, even weeks. Alternating different topics, so you do not always study the same thing, can also benefit your memory."
      },
      {
        "type": "paragraph",
        "text": "Recall and ask questions: After you have learned something, put away your book or computer and try to remember what you have just learned, just by using your brain. Or, you can ask questions about what you learned. This will help you to integrate information and you can use the questions later to quiz yourself and your classmates. To avoid misconceptions, make sure you always check whether your memory was correct!"
      },
      {
        "type": "paragraph",
        "text": "Teach others: A very good way to organize your schemas is to teach your classmates. Take turns: read something, link it to your schema knowledge, let it sink in, then try to explain it to someone else. Again, always check afterwards whether you have made mistakes and discuss things you do not really understand."
      },
      {
        "type": "paragraph",
        "text": "Sleep: Perhaps this is the odd one out because it does not happen at school, but sleep helps build strong schemas, and helps you forget less important information. Think about that when your parents tell you it is time for bed!"
      },
      {
        "type": "paragraph",
        "text": "Track misconceptions: Always be aware when information contradicts your schema knowledge or when you notice that you have formed a misconception along the way. Try to make a new, very vivid memory. For the dolphin example, think about a funny dolphin with a very big belly who is jumping out of the water and squeaking loudly. Imagine how wet you will get and how you will pat its nose and feed it a fish. The more details and senses you use for this memory, the better!"
      },
      {
        "type": "heading",
        "text": "Enjoy!"
      },
      {
        "type": "paragraph",
        "text": "Try using these tips when you are learning new things at school or at home, and you will notice that you will remember a lot better. We hope this article will help you to enjoy learning!"
      }
    ],
    "vocabulary": [
      {
        "id": "a050-v01",
        "term": "Schema",
        "definition": "Prior knowledge in your brain.",
        "example": "The neuroscience knowledge in your brain makes it more likely for new memories to “stick.” We call such a knowledge structure a schema.",
        "synonym": ""
      },
      {
        "id": "a050-v02",
        "term": "Hippocampus",
        "definition": "A brain region that helps you to remember by linking different parts of a memory together.",
        "example": "The most important one is called the hippocampus (which means seahorse, because it is shaped like a seahorse).",
        "synonym": ""
      },
      {
        "id": "a050-v03",
        "term": "Medial Prefrontal Cortex",
        "definition": "A brain region that helps you to integrate new memories with your schema knowledge.",
        "example": "Another brain region, called the medial prefrontal cortex, can also help you remember information, but scientists think that this region learns differently than the hippocampus.",
        "synonym": ""
      },
      {
        "id": "a050-v04",
        "term": "Method of Loci",
        "definition": "A memory technique in which you link things that you want to remember to a well-known place.",
        "example": "This is called the method of loci (loci means “places” in Latin ).",
        "synonym": ""
      },
      {
        "id": "a050-v05",
        "term": "Misconception",
        "definition": "A wrong memory.",
        "example": "The misconception will make it very hard to remember when you learn something that does not fit (that the dolphin does not lay eggs).",
        "synonym": ""
      }
    ],
    "source": {
      "publisher": "Frontiers for Young Minds",
      "url": "https://kids.frontiersin.org/articles/10.3389/frym.2020.00047",
      "authors": [
        "Marlieke van Kesteren",
        "Martijn Meeter"
      ],
      "citation": "van Kesteren M and Meeter M (2020) How to Use Your Memories to Help Yourself Learn New Things. Front. Young Minds. 8:47. doi: 10.3389/frym.2020.00047",
      "copyright": "Copyright © 2020 van Kesteren and Meeter",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "adaptationNote": "Text adapted for reading practice: illustrations, figure pointers and reference markers omitted; glossary definitions retained. The original illustrated article is linked above."
    }
  },
  {
    "id": "a051",
    "slug": "what-happens-to-astronauts-brains-when-they-travel-to-space",
    "title": "What Happens To Astronauts’ Brains When They Travel To Space?",
    "teaser": "For over 20 years, astronauts have lived and worked aboard the International Space Station. Astronauts face many challenges living in space, like not having Earth’s gravity.",
    "category": "Psychology",
    "tags": [
      "neuroscience and psychology",
      "psychology",
      "international space station",
      "coordination",
      "vestibular system",
      "ventricles"
    ],
    "readMinutes": 10,
    "publishedLabel": "New",
    "cover": {
      "theme": "royal-violet",
      "icon": "Brain",
      "motif": "PSYCHOLOGY"
    },
    "blocks": [
      {
        "type": "lead",
        "text": "For over 20 years, astronauts have lived and worked aboard the International Space Station. Astronauts face many challenges living in space, like not having Earth’s gravity. This means that astronauts do everything—from brushing their teeth to doing science experiments—while floating. Not having Earth’s gravity makes everything more difficult, and it changes astronauts’ brains. Over the last decade, we tested 15 astronauts before and after their space travel. We measured their walking, balance, and coordination, and collected pictures of their brains. This article talks about our results. We found that, when astronauts returned to Earth, they had problems moving, like trouble walking and balancing. We also found that spaceflight changed how astronauts’ brains look and function. We finish our article by talking about what is still left to learn. Our big goal is to keep astronauts healthy for very long missions—to Mars and beyond!"
      },
      {
        "type": "paragraph",
        "text": "The first humans traveled to space over 60 years ago. And, for over 20 years, humans have been living and working in space aboard the International Space Station. Now, we are making plans to send humans to Mars. However, to get people safely to Mars, scientists still need to understand more about how space travel impacts the human brain and body. Our lab has spent the last 10 years studying how spaceflight affects astronauts’ brains and their walking, balance, and coordination."
      },
      {
        "type": "heading",
        "text": "What Is Different in Space?"
      },
      {
        "type": "paragraph",
        "text": "Astronauts face many challenges in space. They must figure out how to live and move without Earth’s gravity. Imagine taking a shower or doing a science experiment while floating! In addition, the balance system in the inner ear, which is also known as the vestibular system, relies on Earth’s gravity to tell us which way is “up”. Astronauts often confuse “up” and “down” in space because the vestibular system does not work the same way without gravity!"
      },
      {
        "type": "paragraph",
        "text": "An astronaut’s job is also stressful. For example, astronauts living in space spend months away from their families and friends. Astronauts also do not get the best sleep. We think that all of these things cause changes to the brain that would not normally happen on Earth. So, this was our big research goal—to understand what happens to the brain when people go to space."
      },
      {
        "type": "heading",
        "text": "What Did We Do?"
      },
      {
        "type": "paragraph",
        "text": "We asked 15 astronauts to be in our study. They traveled to the International Space Station and lived there for 6 months to a year. We took pictures of each astronaut’s brain two times before they went to space and four times after they returned home. We took these pictures using a magnetic resonance imaging (MRI) scanner. The MRI scanner recorded two things: the size and shape of the astronauts’ brains, and which parts of their brains were working during various activities."
      },
      {
        "type": "paragraph",
        "text": "We also tested astronauts’ walking, balance, and coordination by having them perform activities like a timed obstacle course, standing and balancing on a platform that tilts, and putting pegs into rows of tiny holes. We wanted to compare how well the astronauts did on these tests before vs. after spaceflight."
      },
      {
        "type": "heading",
        "text": "Does Spaceflight Change How Astronauts Move?"
      },
      {
        "type": "paragraph",
        "text": "What did our research find? First, when astronauts got back to Earth, they were worse at walking, balancing, and using their hands to insert small pegs into holes than they were before they went to space. We think this is because astronauts got used to moving around in a totally different environment in space—one without gravity. Because the vestibular system did not work properly without gravity, the brain “turned down the volume” of information from this system while in space. The astronauts also did not need to use their leg muscles very much to move in space—they could just float around the space station for months! These changes made it hard for them to walk normally when they got back to Earth. The astronauts’ brains had to turn the vestibular signals back up and relearn how to move in gravity."
      },
      {
        "type": "heading",
        "text": "Does Spaceflight Change How the Brain Looks?"
      },
      {
        "type": "paragraph",
        "text": "Our next goal was to study how the brain looks after astronauts go to space. We found multiple changes. First, the brain shifts up inside of the skull during spaceflight. This shift squishes the top of the brain against the inside of the skull. We think that this squishing might play a role in some of the walking, balance, and coordination problems that astronauts have when they get back to Earth because brain areas involved in movement are the ones getting squished."
      },
      {
        "type": "paragraph",
        "text": "Second, we looked at how water in and around the brain is shifted after spaceflight. Inside the skull, the brain is surrounded by water. There are also pockets of water inside of the brain, which are called ventricles. We found that the ventricles got larger after spaceflight. In space, there is no gravity to “pull” water toward the feet. We think the lack of gravity causes extra water to stay inside the skull and makes it difficult for the extra water to drain out. The ventricles get bigger to help store this extra water. Right now, we are not sure if it is a bad thing that extra water stays in the brain during spaceflight, and we also do not yet know how long it takes for the ventricles to return to their normal size (if at all) when astronauts come home to Earth. So, this is definitely something that we want to study more."
      },
      {
        "type": "paragraph",
        "text": "Lastly, we found that astronauts who spent more time in space (like a full year) had bigger brain changes than astronauts who took shorter trips. This is important because we want to plan longer space missions—but we need to make sure that people’s brains will stay healthy. For instance, a Mars mission could take almost 3 years, which is longer than any human has ever spent in space!"
      },
      {
        "type": "heading",
        "text": "Does Spaceflight Change How the Brain Works?"
      },
      {
        "type": "paragraph",
        "text": "Our last goal was to study whether spaceflight changes how the brain works. As we mentioned, when living in space, astronauts lose their sense of “up” and “down.” Since astronauts can float, this means they do not have to stand on the floor to brush their teeth, for example. They could brush their teeth while bouncing off the ceiling if they feel like it—they would not even feel like they were upside down!"
      },
      {
        "type": "paragraph",
        "text": "We wanted to know if going to space changes the way the vestibular system works. To do this, astronauts laid in the MRI scanner, and we recorded their brain activity to see if their vestibular systems worked differently after spaceflight. When astronauts returned to Earth, we found that more sensory parts of the brain got involved to help the vestibular system process information. So, after spaceflight, brain areas responsible for understanding vision and touch still got involved to help the vestibular system work! We think this happens because the brain spends months in space getting used to not having Earth’s gravity. Then, when astronauts get home, they need more “brain power” to function in Earth’s gravity again."
      },
      {
        "type": "paragraph",
        "text": "Why is this important? These brain changes related to how well astronauts could balance after they returned home. Specifically, the astronauts who showed more brain changes could balance better post-flight. We think it is really important to understand why some astronauts adapt better than others to living in space and returning home. This could help us figure out which astronauts might need extra training before going to space or which might need the most help getting back to normal after returning home."
      },
      {
        "type": "heading",
        "text": "How Can We Study This on Earth?"
      },
      {
        "type": "paragraph",
        "text": "Not very many people go to space, so this limits who can participate in our research studies. It took us many years to study just 15 astronauts!"
      },
      {
        "type": "paragraph",
        "text": "So, scientists have come up with other ways to study spaceflight here on Earth. For instance, we have tested what happens to the bodies and brains of healthy people when they lay in bed—without standing up at all—for 2 months! These bed rest experiments let us study some effects of spaceflight, like how astronauts in space do not need to use their legs and feet to support their own body weight while standing and walking."
      },
      {
        "type": "paragraph",
        "text": "Other researchers study what happens when people fly on special airplanes that “fall” through the air for about 20 seconds at a time. This lets people on the airplane float for 20-second periods. But the problem is that 20 seconds is a really short time for researchers to study what happens without Earth’s normal gravity! So, these tests are different from tests on people who spend months in space."
      },
      {
        "type": "paragraph",
        "text": "Other scientists have studied what happens to people who spend the winter in Antarctica. These people cannot leave their research stations because of the unbearable temperatures outside. These studies help us understand how being very isolated and confined inside might affect people’s mental health and how their brains work."
      },
      {
        "type": "paragraph",
        "text": "Each of these situations can provide us with some information about how the human body might respond to spaceflight. However, nothing is as informative as actually going to space. Therefore, over the next years, scientists will need to continue studying more and more astronauts. This will give us an even better understanding of what happens to astronauts’ brains and bodies when they spend time in space."
      },
      {
        "type": "heading",
        "text": "What Is the Takeaway Message?"
      },
      {
        "type": "paragraph",
        "text": "Overall, traveling to space seems to be generally safe for humans. When astronauts return from space, they should expect to have some temporary problems moving around, like trouble walking and balancing. With an MRI scanner, we can see that certain brain changes happen when astronauts go to space. The brain shifts up, the ventricles (water pockets) get bigger, and more “brain power” is needed to process certain information. Some of these changes take a few months or more to get back to normal after astronauts return to Earth."
      },
      {
        "type": "paragraph",
        "text": "Together, all our results will be really important for planning future space missions. Studying what happens to the brain in space will help us understand how humans can safely live in space. This information can also help us to develop better training and better treatments to keep astronauts healthy as we send people on longer and longer missions."
      },
      {
        "type": "heading",
        "text": "What Is Next?"
      },
      {
        "type": "paragraph",
        "text": "There is still a lot of work to be done before we fully understand what happens to people’s brains when they go to space. But do not worry—there are a lot of people on the job! Many scientists around the world are studying how to make space travel safer."
      },
      {
        "type": "paragraph",
        "text": "For example, our team’s next research will follow astronauts for 5 years after they get home, to see just how long it takes for certain brain changes to recover. Overall, we hope that this work will help us better understand how to keep astronauts safe when they explore new frontiers—like Mars, or beyond!"
      }
    ],
    "vocabulary": [
      {
        "id": "a051-v01",
        "term": "International Space Station",
        "definition": "A space laboratory orbiting about 250 miles above Earth, where astronauts from various countries live and work in space.",
        "example": "For over 20 years, astronauts have lived and worked aboard the International Space Station.",
        "synonym": ""
      },
      {
        "id": "a051-v02",
        "term": "Coordination",
        "definition": "The ability to move parts of the body together smoothly while doing one task. The eyes and hands have trouble working together after spaceflight, but this gets better pretty quickly!",
        "example": "We measured their walking, balance, and coordination, and collected pictures of their brains.",
        "synonym": ""
      },
      {
        "id": "a051-v03",
        "term": "Vestibular System",
        "definition": "The balance system, located in the inner ear, that sends information to the brain to help us balance and keep track of which way is “up” and which way is “down”.",
        "example": "In addition, the balance system in the inner ear, which is also known as the vestibular system, relies on Earth’s gravity to tell us which way is “up”.",
        "synonym": ""
      },
      {
        "id": "a051-v04",
        "term": "Ventricles",
        "definition": "Pockets inside of the brain that are filled mostly with water.",
        "example": "There are also pockets of water inside of the brain, which are called ventricles.",
        "synonym": ""
      }
    ],
    "source": {
      "publisher": "Frontiers for Young Minds",
      "url": "https://kids.frontiersin.org/articles/10.3389/frym.2023.918925",
      "authors": [
        "Kathleen E. Hupfeld",
        "Heather R. McGregor",
        "Grant D. Tays",
        "Rachael D. Seidler"
      ],
      "citation": "Hupfeld KE, McGregor HR, Tays GD and Seidler RD (2023) What Happens To Astronauts’ Brains When They Travel To Space?. Front. Young Minds. 11:918925. doi: 10.3389/frym.2023.918925",
      "copyright": "Copyright © 2023 Hupfeld, McGregor, Tays and Seidler",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "adaptationNote": "Text adapted for reading practice: illustrations, figure pointers and reference markers omitted; glossary definitions retained. The original illustrated article is linked above."
    }
  },
  {
    "id": "a052",
    "slug": "using-math-to-protect-fish-in-the-ocean",
    "title": "Using Math to Protect Fish in the Ocean",
    "teaser": "Have you ever wondered how scientists count fish in the ocean? Fish are always moving, and the ocean is huge, so counting them is not easy!",
    "category": "Science",
    "tags": [
      "biodiversity explore the collection",
      "science",
      "stock assessments",
      "fish stock",
      "overfishing",
      "hydroacoustics",
      "computer models"
    ],
    "readMinutes": 7,
    "publishedLabel": "New",
    "cover": {
      "theme": "ocean-teal",
      "icon": "Compass",
      "motif": "SCIENCE"
    },
    "blocks": [
      {
        "type": "lead",
        "text": "Have you ever wondered how scientists count fish in the ocean? Fish are always moving, and the ocean is huge, so counting them is not easy! Scientists use stock assessments, a method that gathers clues such as how many fish are caught by fishing boats, how many are seen in surveys, and how fast fish grow. Using math and computer models, scientists predict how fish populations will change in the future. If too many fish are caught, there might not be enough left to reproduce, which is called overfishing. Stock assessments help managers decide how many fish can be safely caught. Scientists also protect special areas where fish lay eggs to help their numbers grow. By understanding stock assessments, we can help keep fish in the ocean for future generations. Thanks to ongoing work of scientists, we can enjoy fish today while making sure there are plenty left for tomorrow."
      },
      {
        "type": "heading",
        "text": "How Many Fish are Out There?"
      },
      {
        "type": "paragraph",
        "text": "You are probably familiar with some fish species, and you might even have a favorite! Scientists estimate that at least 20,000 species of fish live in the ocean, but there may be twice as many. The total number of fish in the ocean is also still a mystery. There are billions or even trillions, but the exact number depends on the species, the region, and the time of year."
      },
      {
        "type": "paragraph",
        "text": "Counting fish is a job for science detectives! Unlike counting jellybeans in a jar, fish are constantly moving, and the ocean is vast. So how do scientists figure out how many fish live in the sea? They use computers, math, and stock assessment, which help estimate fish populations as accurately as possible. In stock assessments, scientists gather clues to determine how many fish are in the ocean. This information helps them figure out how many fish can be caught while ensuring there are still enough left for the future."
      },
      {
        "type": "heading",
        "text": "Why are Healthy Fish Stocks Important?"
      },
      {
        "type": "paragraph",
        "text": "A fish stock is a group of fish of the same species that live in the same area and reproduce with one another. It is like an ocean neighborhood, but it can be huge! For example, all the Atlantic cod in the North Atlantic Ocean are considered one fish stock. Scientists study fish stocks to see if their populations are stable, growing, or shrinking over time."
      },
      {
        "type": "paragraph",
        "text": "Fish are key players in the ocean. They provide food for other animals and help keep marine life balanced. Humans also rely on fish as a food source and for jobs in fishing industries. However, if we take too many fish too quickly, stock populations can shrink, making it harder for them to recover. This is called overfishing. That is why scientists conduct stock assessments—to help manage fish populations sustainably and make sure there are enough fish for the future."
      },
      {
        "type": "heading",
        "text": "Why do Scientists Count Fish?"
      },
      {
        "type": "paragraph",
        "text": "Fish are a renewable resource, meaning they can replenish their numbers if stocks are managed properly. But if overfishing happens, their populations can drop to dangerously low levels. Stock assessments help scientists estimate the size of fish populations and understand how they are affected by fishing and environmental changes like rising sea temperatures. These assessments predict what might happen in the future if fishing practices stay the same or change. With this information, governments and fishery managers can set rules, like catch limits or temporary fishing bans, to protect fish populations while still allowing people to fish and enjoy seafood."
      },
      {
        "type": "heading",
        "text": "How do Scientists Count Fish?"
      },
      {
        "type": "paragraph",
        "text": "Counting fish in the ocean is even harder than counting stars in the sky! Instead of counting each fish one by one, scientists collect clues and use math to estimate fish numbers. They gather data from three main sources: catch data, abundance data, and biology data."
      },
      {
        "type": "heading",
        "text": "Catch Data"
      },
      {
        "type": "paragraph",
        "text": "Catch data comes from fishing boats. Scientists examine the fish that are brought back to shore, measuring how many were caught, how big they are, and what species they belong to. Fishers also record where and when they fished and what equipment they used. Sometimes, scientists ride along on fishing boats to collect data directly."
      },
      {
        "type": "heading",
        "text": "Abundance Data"
      },
      {
        "type": "paragraph",
        "text": "Abundance data tells scientists whether there are a few or many fish in an area. Research ships survey fish populations using special nets, hydroacoustics (sound waves to detect fish underwater), and underwater robots with cameras. These tools help track how fish populations change over time."
      },
      {
        "type": "heading",
        "text": "Biology Data"
      },
      {
        "type": "paragraph",
        "text": "Biology data helps scientists understand the life cycle of fish. They study fish ear bones to determine their age, just like counting rings on a tree. Scientists also measure how fast fish grow, how many eggs they lay, and how many young fish survive to adulthood. By combining all this data, scientists can make the best decisions to protect fish populations."
      },
      {
        "type": "heading",
        "text": "How do Scientists Use Math in Stock Assessments?"
      },
      {
        "type": "paragraph",
        "text": "Once all the data is collected, scientists use math to understand what it tells us. They create computer models that predict how fish populations will change in the future. These models take into account how fish grow, reproduce, and die, as well as how many are being caught. They work like a recipe, mixing data from catch, abundance, and biology to estimate how many fish are in the ocean. For example, one simple model might say:"
      },
      {
        "type": "paragraph",
        "text": "New Population = Old Population + Growth – Fish Caught."
      },
      {
        "type": "paragraph",
        "text": "This helps scientists figure out how fish populations change over time. Scientists can then predict what will happen if fishing levels stay the same, increase, or decrease. This helps them make recommendations on how to keep fishing sustainable. Did you know that scientists use similar methods to count other animals, like whales, birds, and even insects?"
      },
      {
        "type": "heading",
        "text": "How do Stock Assessments Help Protect Fish?"
      },
      {
        "type": "paragraph",
        "text": "Stock assessments help set fishing rules that balance the need for food with the need to protect fish populations. If a stock assessment shows that a fish population is shrinking, managers may lower catch limits to allow the fish stock to recover. If a population is healthy, more fishing may be allowed."
      },
      {
        "type": "paragraph",
        "text": "Some stock assessments reveal that certain areas called nurseries are especially important for fish reproduction. In these cases, managers may close the nursery areas to fishing, to allow young fish to grow. Stock assessments also help identify when fishing gear or methods need to change to reduce environmental harm. By counting fish and calculating how many can be safely caught, scientists help ensure that fishing remains sustainable for the future."
      },
      {
        "type": "heading",
        "text": "Why Does this Matter to You?"
      },
      {
        "type": "paragraph",
        "text": "The ocean contains so many kids of fish—from tiny fish half an inch long to others over 50 feet long that weigh several tons. Some are popular for eating, while others are more important for the ocean than for our plates! But all of them play a key role in supporting ocean life and human communities. Ensuring we have the right number of fish at the right time is what scientists do—and now you know how they solve the mystery! Who said math is not cool?"
      }
    ],
    "vocabulary": [
      {
        "id": "a052-v01",
        "term": "Stock Assessments",
        "definition": "A scientific method that uses data and computer models to estimate the size and health of fish populations over time.",
        "example": "Scientists use stock assessments, a method that gathers clues such as how many fish are caught by fishing boats, how many are seen in surveys, and how fast fish grow.",
        "synonym": ""
      },
      {
        "id": "a052-v02",
        "term": "Fish Stock",
        "definition": "A group of the same fish species living and reproducing in the same area.",
        "example": "A fish stock is a group of fish of the same species that live in the same area and reproduce with one another.",
        "synonym": ""
      },
      {
        "id": "a052-v03",
        "term": "Overfishing",
        "definition": "Catching too many fish too quickly, making it hard for the population to recover.",
        "example": "If too many fish are caught, there might not be enough left to reproduce, which is called overfishing.",
        "synonym": ""
      },
      {
        "id": "a052-v04",
        "term": "Hydroacoustics",
        "definition": "A way of using sound waves underwater to study fish and the sea. Scientists “listen” to echoes to find out where animals are and how many.",
        "example": "Research ships survey fish populations using special nets, hydroacoustics (sound waves to detect fish underwater), and underwater robots with cameras.",
        "synonym": ""
      },
      {
        "id": "a052-v05",
        "term": "Computer Models",
        "definition": "Digital tools that use math and data to imitate real-life processes, helping scientists test ideas, predict changes, and understand nature without always needing field experiments.",
        "example": "Using math and computer models, scientists predict how fish populations will change in the future.",
        "synonym": ""
      },
      {
        "id": "a052-v06",
        "term": "Sustainable",
        "definition": "Using resources (like fish) in a way that they can keep growing or coming back, so we do not run out.",
        "example": "This helps them make recommendations on how to keep fishing sustainable.",
        "synonym": ""
      },
      {
        "id": "a052-v07",
        "term": "Nurseries",
        "definition": "Special ocean areas where young fish grow safely before moving to adult habitats. Like underwater “kindergartens”, they provide food and shelter from predators.",
        "example": "Some stock assessments reveal that certain areas called nurseries are especially important for fish reproduction.",
        "synonym": ""
      }
    ],
    "source": {
      "publisher": "Frontiers for Young Minds",
      "url": "https://kids.frontiersin.org/articles/10.3389/frym.2025.1589436",
      "authors": [
        "Maria Grazia Pennino",
        "Francisco Izquierdo",
        "Marta Cousido-Rocha",
        "David José Nachón",
        "Anxo Paz",
        "Marta Ballesteros",
        "David Bamio",
        "Santiago Cerviño"
      ],
      "citation": "Pennino MG, Izquierdo F, Cousido-Rocha M, Nachón DJ, Paz A, Ballesteros M, Bamio D and Cerviño S (2025) Using Math to Protect Fish in the Ocean. Front. Young Minds. 13:1589436. doi: 10.3389/frym.2025.1589436",
      "copyright": "Copyright © 2025 Pennino, Izquierdo, Cousido-Rocha, Nachón, Paz, Ballesteros, Bamio and Cerviño",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "adaptationNote": "Text adapted for reading practice: illustrations, figure pointers and reference markers omitted; glossary definitions retained. The original illustrated article is linked above."
    }
  },
  {
    "id": "a053",
    "slug": "how-old-are-trees-and-how-fast-do-they-grow",
    "title": "How Old are Trees and How Fast Do They Grow?",
    "teaser": "Have you ever wondered how old a big tree is, or counted the rings in a tree stump to discover a tree’s age? Why do the rings tell us about a tree’s age anyway?",
    "category": "Science",
    "tags": [
      "biodiversity",
      "science",
      "meristems",
      "cambium",
      "phloem",
      "xylem",
      "annual growth rings"
    ],
    "readMinutes": 10,
    "publishedLabel": "New",
    "cover": {
      "theme": "forest-emerald",
      "icon": "Compass",
      "motif": "SCIENCE"
    },
    "blocks": [
      {
        "type": "lead",
        "text": "Have you ever wondered how old a big tree is, or counted the rings in a tree stump to discover a tree’s age? Why do the rings tell us about a tree’s age anyway? Trees grow taller and fatter using special cells called meristems, located at the tip of every branch and around their stems under the bark. This special way of growing means that many trees have growth rings that we can count and measure to find out how old they are and how fast they are growing. Scientists are concerned that climate change is changing how fast trees grow and even how long they can live. They have found that many trees are growing slower than they did a few decades ago. When trees grow slower, they absorb less carbon dioxide from the air. This can cause climate change to speed up, making it even worse for trees."
      },
      {
        "type": "heading",
        "text": "How Do Trees Grow?"
      },
      {
        "type": "paragraph",
        "text": "Have you ever looked up at a giant tree and wondered how old it is? Have you wondered how long it takes a little acorn to grow into a big oak tree? It turns out that we can “ask” trees how old they are and even how fast they grow. But before we can ask these questions, we first need to understand how trees grow."
      },
      {
        "type": "paragraph",
        "text": "Trees grow in two different ways at the same time—they get taller and fatter, thanks to special cells called meristems. Trees have meristems at the tips of every branch, to help the branches grow longer and the trees to grow taller. Trees also have meristems beneath their bark, to help them grow fatter. When you look at the top of a tree stump or at the end of a cut log, you can see the bark on the outside, followed by the cambium. The cambium contains three types of tissues: the bark meristem, the phloem, and the xylem meristem. The bark meristem creates new bark as the tree grows and the old bark wears off. The phloem consists of tubes that transport the sugars made in the trees’ leaves to all the cells in other parts of the tree. The xylem meristem produces new xylem, which are the tubes that transport water up from the roots to the rest of the tree. Past the cambium you can see the old xylem. The old xylem tubes and their surrounding cells are what we call wood. As the tree grows, it makes more xylem that gets added to the outside of the old xylem. This means that, as the tree grows, it is always getting fatter—and the bark always needs to grow bigger to make room for all that new wood."
      },
      {
        "type": "paragraph",
        "text": "Trees often grow in places that are seasonal, which means that the climate changes during different times of the year. In some places, there are cold winters and hot summers. In other places, the temperature stays the same all year but there are dry seasons and rainy seasons. Sometimes these seasonal changes in temperature and rainfall mean that trees can only grow during part of the year. Maybe the winter is too cold and dark for trees to grow, so they only grow in the summer. Or maybe part of the year is too dry, so trees only grow in the rainy season. This seasonal growth means that the meristems produce new xylem in distinct layers, or annual growth rings. Each ring within the tree shows us exactly how much wood was added in one year of growth."
      },
      {
        "type": "paragraph",
        "text": "The presence of annual growth rings enables scientists to investigate the age of trees and how fast trees grow. When you are looking at the cut end of a log, you can count the number of rings between the bark and the center, and that will tell you exactly how many years old that tree or branch was before it was cut. Fortunately, we can also count trees’ growth rings without cutting them down. To do this, scientists use a special drill called an increment borer to pull out a small sample of wood, about the size of a pencil, from the tree’s bark to the tree’s center. This does not hurt the tree, and it allows scientists to count the tree’s rings to find out how old it is."
      },
      {
        "type": "heading",
        "text": "Counting Rings Does Not Always Work"
      },
      {
        "type": "paragraph",
        "text": "Unfortunately, we cannot always count rings to know how old trees are. For example, in a lot of tropical rainforests it is hot and wet all year, so some of the trees do not ever need to stop growing—therefore they do not make visible growth rings. However, scientists have found that many tropical trees do in fact exhibit annual growth rings, even in the wettest rainforests of the world and under unfavorable conditions. There is evidence that growth rings in tropical rainforest trees are different for every species, so the formation of tree rings in some species are related to a lack of water, but others to an excess of water."
      },
      {
        "type": "paragraph",
        "text": "Another case in which we cannot use rings is when trees grow as superorganisms. When this happens, an entire forest may be just one tree! For example, the Pando tree is a gigantic aspen tree growing from a single root system, with almost 50,000 genetically identical trunks growing in an area as big as 80 football fields. In this case, scientists can count rings to know how old each of the individual trunks are, but that does not tell them how old the entire tree is—since it is a superorganism that is always making new trunks and losing old trunks. By using methods such as carbon 14 dating and collecting lots of trunks, branches, and buried logs, scientists estimate the Pando tree may be more than 80,000 years old!"
      },
      {
        "type": "heading",
        "text": "How Old are Trees?"
      },
      {
        "type": "paragraph",
        "text": "Scientists have counted rings to measure the ages of lots of trees. The oldest single tree that anyone has found yet is a 5,062-year-old bristlecone pine living in the White Mountains of California. In the tropics, the big trees are not usually that old. The oldest tropical tree anyone has found yet is a 1,835-year-old baobab living in an African dry forest."
      },
      {
        "type": "heading",
        "text": "Changes in Tree Growth"
      },
      {
        "type": "paragraph",
        "text": "In addition to telling us how old trees are, scientists can also measure the thickness of the annual growth rings to know how much fatter a tree grew in each year of its life. An average tropical tree grows twice as fast as an average temperate tree (about 5.0 mm per year vs. 2.5 mm per year). If scientists compare how fast trees grow each year to the climate in that year, they can figure out what types of conditions the trees like. For example, after measuring lots of tree rings, scientists might find that a species of oak grows faster in years when there is lots of rain in the summer, and that another species of pine tree grows faster when there are shorter winters."
      },
      {
        "type": "paragraph",
        "text": "Once we know what types of climates various types of trees like and do not like, we can then look at the annual growth rings of very old trees to make guesses about what the climate was like in the past. For example, if scientists find that pine trees were growing especially slow 200 years ago, they can guess that there must have been a long winter that year. Or if oak trees grew especially fast 350 years ago, they could guess that that year must have had a very rainy summer. This is one of the ways we know what the climate was like hundreds and even thousands of years ago, long before we had weather stations to record temperature and rainfall. This process of measuring tree rings, assigning calendar years to each of them, and finding common growth patterns among trees to estimate the past climate is called dendrochronology."
      },
      {
        "type": "paragraph",
        "text": "Unfortunately, global warming is making the climate worse for a lot of trees. While some trees may be better off with a new climate, scientists are finding that most trees are growing more slowly now than they did in the past. They have also found that trees do not live as long when the temperature gets too hot. This is bad news! Trees are very important for the planet and humans. Trees make food that animals (including humans) eat; they make the wood that we use to build and heat our houses; they make shade to cool down our streets; and they help to clean our air and water. If trees grow slower and die younger, they will not be able to do as many of these good things for us. In fact, if trees start growing slower and do not take as much carbon dioxide out of the air, climate change might happen even faster, since carbon dioxide is a greenhouse gas. If climate change accelerates, trees will grow slower and die younger, making climate change speed up even more… and trees will grow even slower and die even younger… and on and on!"
      },
      {
        "type": "heading",
        "text": "The Importance of Measuring Tree Ages and Growth"
      },
      {
        "type": "paragraph",
        "text": "Trees grow taller and fatter through special cells called meristems. In many trees, meristem cells are only active for part of the year. This makes trees grow in distinct pulses and causes annual growth rings to form. If we count the growth rings on a log or in a sample collected with an increment borer, we can know how old a tree is. If we measure how big each growth ring is, we will know how much the tree grew in every year of its life. Once we know how fast trees grew in particular years, we can determine what type of climate certain types of trees like, and then we can make guesses about what the climate was like in the past. Sadly, climate change is causing many trees to grow slower and die younger than they used to—and this is bad news for everyone. The good news is that if we know what type of climate the different tree species like, we can promote conservation programs to plant the right species in the right places, ensuring that trees grow fast and absorb as much carbon dioxide from the air as possible."
      }
    ],
    "vocabulary": [
      {
        "id": "a053-v01",
        "term": "Meristems",
        "definition": "Plant cells that are actively dividing or reproducing.",
        "example": "Trees grow taller and fatter using special cells called meristems, located at the tip of every branch and around their stems under the bark.",
        "synonym": ""
      },
      {
        "id": "a053-v02",
        "term": "Cambium",
        "definition": "Tissue layer producing the immature cells needed for plant growth.",
        "example": "When you look at the top of a tree stump or at the end of a cut log, you can see the bark on the outside, followed by the cambium.",
        "synonym": ""
      },
      {
        "id": "a053-v03",
        "term": "Phloem",
        "definition": "Tubes transporting sugars made in the leaves to feed the rest of the plant’s cells.",
        "example": "The cambium contains three types of tissues: the bark meristem, the phloem, and the xylem meristem.",
        "synonym": ""
      },
      {
        "id": "a053-v04",
        "term": "Xylem",
        "definition": "Tubes transporting water and nutrients from the roots to the leaves.",
        "example": "The cambium contains three types of tissues: the bark meristem, the phloem, and the xylem meristem.",
        "synonym": ""
      },
      {
        "id": "a053-v05",
        "term": "Annual Growth Rings",
        "definition": "Concentric rings found at the end of a log or tree stump, with each ring having been added during a single growth period.",
        "example": "This seasonal growth means that the meristems produce new xylem in distinct layers, or annual growth rings.",
        "synonym": ""
      },
      {
        "id": "a053-v06",
        "term": "Increment Borer",
        "definition": "A hollow drill used for cutting out from a tree a core from which increments are estimated by counting annual rings.",
        "example": "To do this, scientists use a special drill called an increment borer to pull out a small sample of wood, about the size of a pencil, from the tree’s bark to the tree’s center.",
        "synonym": ""
      },
      {
        "id": "a053-v07",
        "term": "Superorganism",
        "definition": "A group of individuals that all behave as one unified organism.",
        "example": "In this case, scientists can count rings to know how old each of the individual trunks are, but that does not tell them how old the entire tree is—since it is a superorganism that is always making new trunks and losing old trunks.",
        "synonym": ""
      },
      {
        "id": "a053-v08",
        "term": "Temperate",
        "definition": "Ecosystems outside of the tropics, often with seasonal variation in temperature between cold winters and hot summers.",
        "example": "An average tropical tree grows twice as fast as an average temperate tree (about 5.0 mm per year vs. 2.5 mm per year).",
        "synonym": ""
      },
      {
        "id": "a053-v09",
        "term": "Dendrochronology",
        "definition": "From Greek words: dendro = tree, chronos = time, logos = study. The science of measuring annual tree rings and using these measurements to study past climate.",
        "example": "This process of measuring tree rings, assigning calendar years to each of them, and finding common growth patterns among trees to estimate the past climate is called dendrochronology.",
        "synonym": ""
      }
    ],
    "source": {
      "publisher": "Frontiers for Young Minds",
      "url": "https://kids.frontiersin.org/articles/10.3389/frym.2024.1281560",
      "authors": [
        "Manuel Bernal-Escobar",
        "Kenneth J. Feeley"
      ],
      "citation": "Bernal-Escobar M and Feeley KJ (2024) How Old are Trees and How Fast Do They Grow?. Front. Young Minds. 12:1281560. doi: 10.3389/frym.2024.1281560",
      "copyright": "Copyright © 2024 Bernal-Escobar and Feeley",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "adaptationNote": "Text adapted for reading practice: illustrations, figure pointers and reference markers omitted; glossary definitions retained. The original illustrated article is linked above."
    }
  },
  {
    "id": "a054",
    "slug": "whats-the-buzz-about-native-bees",
    "title": "What’s the Buzz About Native Bees?",
    "teaser": "Most plants depend on insects for pollination. Honey bees pollinate many of the foods people eat, but did you know that wild plants, and animals like birds and bears, also depend on pollinators?",
    "category": "Science",
    "tags": [
      "biodiversity explore the collection",
      "science",
      "nectar",
      "mutualism",
      "non-native"
    ],
    "readMinutes": 9,
    "publishedLabel": "New",
    "cover": {
      "theme": "forest-emerald",
      "icon": "Compass",
      "motif": "SCIENCE"
    },
    "blocks": [
      {
        "type": "lead",
        "text": "Most plants depend on insects for pollination. Honey bees pollinate many of the foods people eat, but did you know that wild plants, and animals like birds and bears, also depend on pollinators? Native bees are the most diverse and efficient pollinators. Thousands of bee species transport pollen between plants in deserts, forests, mountains, meadows, and many other habitats. This service helps plants reproduce successfully, and the plants provide food and shelter for other animals. Bees are important for keeping our wild landscapes healthy. Scientists are discovering that climate change and other human-caused threats are changing bee populations. Therefore, it is important that we learn more about pollinators in wild places like national parks and that we support bees in our own backyards."
      },
      {
        "type": "heading",
        "text": "There is More to Bees Than Honey"
      },
      {
        "type": "paragraph",
        "text": "When you think of a bee, what kind of bee do you imagine? Most people are familiar with honey bees. These bees are important pollinators for many of the plants that farmers grow and that people like to eat, like almonds, apples, and pears. But honey bees have not always lived in North America. People brought them from Europe hundreds of years ago, to help pollinate their crops and to make honey. Before honey bees arrived in North America, there were many native bees pollinating wild plants. Native bees continue to be essential pollinators in parks and other wild landscapes today."
      },
      {
        "type": "paragraph",
        "text": "You might wonder why we need pollinators in wild places where people do not grow food. If you have ever hiked in a mountain meadow full of wildflowers, walked along a stream early in the spring when the pussy willows have just emerged, or been lucky enough to see a super bloom of flowers in the desert, you have seen the work of pollinators. Without bees and other pollinators, most of these plants would quickly disappear."
      },
      {
        "type": "paragraph",
        "text": "Not only plants benefit from pollinators. Animals like bears and birds eat seeds and fruits from pollinated plants. In Denali National Park and Preserve in Alaska, grizzly bears eat huge numbers of blueberries at the end of the summer. This helps prepare bears for their winter hibernation, when they will not eat for many months. Bumble bees pollinate blueberry plants, so without them, the bears would not have enough to eat. American robins, blue jays, and other birds eat berries too, like cherries, raspberries, and elderberries. Bees also pollinate all these plants. Without native bees and other pollinators, our wild places would lack the beautiful colors and shapes of flowers and there would be less food for many animals."
      },
      {
        "type": "heading",
        "text": "How Does Pollination Work?"
      },
      {
        "type": "paragraph",
        "text": "Pollinators are animals that carry pollen between plants. Most pollinators are insects, such as bees, butterflies, beetles, flies, and wasps. These insects feed on nectar and pollen from flowers. As the insects move between plants to feed, tiny grains of pollen stick to their bodies and then later get brushed off onto other plants. Many plants must be pollinated by insects to produce seeds that will grow into new plants. This kind of win-win relationship, in which the plants need help from the pollinators to reproduce successfully and the pollinators need the plants for food, is known as a mutualism."
      },
      {
        "type": "paragraph",
        "text": "Of all the insect pollinators, bees are the best at carrying pollen on their bodies. That is because they feed on nectar and pollen just like other pollinators, but they also carry pollen back to their nests to feed their young. So, bees have areas on their bodies designed to carry big loads of pollen. Bumble bees have little baskets on their hind legs to carry pollen balls mixed with nectar. Other bees have hairy legs or hairy bellies where pollen grains can stick. The more pollen bees carry on their bodies, the more likely it is that some will accidentally brush off on the plants they visit, and this makes them really good pollinators."
      },
      {
        "type": "heading",
        "text": "Native Bee Diversity"
      },
      {
        "type": "paragraph",
        "text": "Native bees live all over the world, in almost every habitat where plants grow. In North America, there are close to 4,000 species. That is about four times the number of bird species found on the continent! Bees come in many colors, sizes, and shapes. They also have many different nesting, feeding, and social behaviors. The kind of plant a bee prefers to visit depends on the length of the bee’s tongue. Bees with long tongues are best at getting nectar from flowers with deep necks, like blue bells. Bees with short tongues typically visit more open flowers, like sunflowers."
      },
      {
        "type": "paragraph",
        "text": "Native bees also vary in their social structure and nesting habits. Bumble bees are social bees. They live in colonies with one queen who lays all the eggs, and lots of workers who gather food from flowers and feed the young. Bumble bees have thick, long fur and can shiver their bodies to warm up. They can live in cold places like mountain tops and way up north in the Arctic. If you wanted to go to one place in the world to see a lot of bumble bees, the Himalayan mountains in Nepal and Tibet have more species than anywhere else."
      },
      {
        "type": "heading",
        "text": "Solitary Bees Build Many Kinds of Nests"
      },
      {
        "type": "paragraph",
        "text": "Most other native bees in North America live a solitary lifestyle. Each female bee makes her own nest, lays eggs, and provides each egg with all the nectar and pollen it needs to grow into an adult. Many solitary bees dig their nests in the soil or in sandy banks along rivers. These include mining bees, digger bees, sweat bees, and polyester bees. Polyester bees get their name because they protect the insides of their nests with a waterproof lining that also keeps out mold. Some soil-nesting bees live in large groups, so you might see lots of little entrance holes in the ground near each other making up a bee neighborhood."
      },
      {
        "type": "paragraph",
        "text": "Other bees nest in dead trees in tunnels made by beetles, cracks and cavities in wood and rock, hollow plant stems, and a few species even nest in empty snail shells! Some of these nests are lined with mud, chewed-up leaves, or plant resin. Leafcutter bees line their nests with almost perfectly round pieces of leaves that they cut out carefully with their huge jaws. Wool carder bees make very cozy nests, lined with soft hairs that they gather from leaves. Carpenter bees chew into dead wood to make their nests, though they do not eat the wood."
      },
      {
        "type": "paragraph",
        "text": "About one fifth of all bees have a very different lifestyle—they are known as cuckoo bees. Like cuckoo birds, the females invade the nests of other bee species and lay their eggs next to the eggs already in the nest. Once the cuckoo larvae emerge, they kill the resident eggs or larvae and eat their nectar and pollen. These greedy bees are also known as cleptoparasites. Although their lifestyle may seem underhanded, cuckoo bees are good indicators of a healthy bee community. If there are lots of cuckoo bees at a site, it means there are also lots of other bees to steal food from!"
      },
      {
        "type": "heading",
        "text": "Do not Take Bees for Granted!"
      },
      {
        "type": "paragraph",
        "text": "If you were to tour all the national parks in North America, you would find an amazing diversity of bees in every one, including the dry deserts of Mojave National Park, oak woodlands of Shenandoah National Park, alpine meadows of Rocky Mountain National Park, and sandy beaches of Cape Cod National Seashore. Fortunately, bees living in parks and other protected areas are usually safe from many threats that bees living elsewhere face. Human activities like farming, the use of pesticides, paving and building, and the introduction of non-native plants and diseases can all impact bee health. Climate change is one human-caused threat that impacts bees everywhere, even in very remote places. As temperatures rise around the planet, some bee species have been forced to move farther north or up mountainsides to seek cooler climates. In places where climate change is causing spring to warm up earlier than normal, plants and their pollinators may be affected. For example, if plants flower earlier than bees emerge from their hibernation, the mismatch in timing may result in fewer plants being pollinated and reproducing successfully."
      },
      {
        "type": "heading",
        "text": "What you can do to Help Native Bees"
      },
      {
        "type": "paragraph",
        "text": "Bees are important pollinators in the wild. They are very diverse and live in many habitats. Bee health may be impacted by human-caused threats like climate change. It is up to all of us to make sure that pollinators and the plants they visit are still around for future generations. Parks and other protected areas support bees by preserving native habitats. We can support bees in our own backyards by providing food and nesting areas. Plant native wildflowers and shrubs of various colors, shapes, and blooming times, so that bees have access to nectar and pollen through the growing season. Bees love a messy yard for nesting! Leave patches of bare soil for ground-nesting bees (they can not nest in thick green grass), dead wood and last year’s hollow berry canes for cavity-nesting bees (you can also drill holes in blocks of wood to attract cavity nesters), and thick brush piles for bumble bees."
      },
      {
        "type": "paragraph",
        "text": "Most importantly, keep learning about your local pollinators! Even though there is still a lot we do not know about native bees, we do know that without them, even our wildest places will lack the busy buzz that keeps nature thriving."
      }
    ],
    "vocabulary": [
      {
        "id": "a054-v01",
        "term": "Nectar",
        "definition": "A sugary liquid made by plants to attract pollinators. The sugar-filled nectar provides energy to pollinators.",
        "example": "These insects feed on nectar and pollen from flowers.",
        "synonym": ""
      },
      {
        "id": "a054-v02",
        "term": "Mutualism",
        "definition": "An interaction between two or more species in which each species benefits.",
        "example": "This kind of win-win relationship, in which the plants need help from the pollinators to reproduce successfully and the pollinators need the plants for food, is known as a mutualism.",
        "synonym": ""
      },
      {
        "id": "a054-v03",
        "term": "Non-native",
        "definition": "A non-native species is one that occurs in a place where it did not naturally evolve. Often non-native species are unintentionally carried to new places by humans.",
        "example": "Human activities like farming, the use of pesticides, paving and building, and the introduction of non-native plants and diseases can all impact bee health.",
        "synonym": ""
      }
    ],
    "source": {
      "publisher": "Frontiers for Young Minds",
      "url": "https://kids.frontiersin.org/articles/10.3389/frym.2022.713108",
      "authors": [
        "Jessica Rykken"
      ],
      "citation": "Rykken J (2022) What’s the Buzz About Native Bees?. Front. Young Minds. 10:713108. doi: 10.3389/frym.2022.713108",
      "copyright": "Copyright © 2022 Rykken",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "adaptationNote": "Text adapted for reading practice: illustrations, figure pointers and reference markers omitted; glossary definitions retained. The original illustrated article is linked above."
    }
  }
]
