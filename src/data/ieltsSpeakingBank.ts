// Original IELTS Speaking question bank with model sample answers.
// Every question and every sample answer here is original content written for this
// app (the standard IELTS topics are public; the wording and answers are our own).
// Sample answers aim for a Band 8 register — natural, well-organised, with a range
// of vocabulary and structures — so learners can see what a strong response sounds
// like. They stay hidden until the learner taps "Show sample answer".

export type SpeakingPart = 1 | 2 | 3

export type Part1QA = { q: string; sample: string }
export type Part1Topic = { id: string; topic: string; icon: string; questions: Part1QA[] }

export type Part2Card = {
  id: string
  title: string
  bullets: string[]
  followUp: string
  theme: string
  sample: string
}

export type Part3QA = { q: string; sample: string }
export type Part3Theme = { id: string; theme: string; questions: Part3QA[] }

// ── PART 1 ──────────────────────────────────────────────────────────────────
export const PART1_TOPICS: Part1Topic[] = [
  {
    id: 'hometown',
    topic: 'Hometown',
    icon: '🏙️',
    questions: [
      { q: 'Where is your hometown and what is it like?', sample: 'I’m originally from Samarkand, a historic city in the east of Uzbekistan. It’s famous for its ancient architecture and the turquoise domes of the old town, so it has a wonderful mix of history and everyday modern life.' },
      { q: 'What do you like most about your hometown?', sample: 'What I appreciate most is the sense of community. People genuinely look out for one another, and there’s always something happening — markets, festivals, or just neighbours chatting in the courtyard.' },
      { q: 'Has your hometown changed much in recent years?', sample: 'Quite a lot, actually. A number of new cafés and business centres have sprung up, and the transport has improved noticeably. That said, the historic core has been carefully preserved, which I think strikes a nice balance.' },
      { q: 'Would you like to live there in the future?', sample: 'Possibly, yes. I’d love to spend a few years abroad first to gain experience, but I can easily picture myself settling back there eventually because of the lifestyle and my family ties.' },
    ],
  },
  {
    id: 'accommodation',
    topic: 'Home & Accommodation',
    icon: '🏠',
    questions: [
      { q: 'Do you live in a house or an apartment?', sample: 'I live in a fairly spacious apartment on the fourth floor. It has two bedrooms and a small balcony where I like to have my morning coffee and watch the city wake up.' },
      { q: 'What is your favourite room in your home?', sample: 'Definitely my study. It’s where I do most of my work and reading, and I’ve set it up exactly the way I like — a comfortable chair, good lighting, and a shelf full of books I keep meaning to finish.' },
      { q: 'Would you like to change anything about your home?', sample: 'If I could, I’d add more natural light. The flat faces north, so it can feel a little dim in winter. A skylight or larger windows would make a real difference to the mood of the place.' },
      { q: 'Do you prefer living in a quiet or a lively area?', sample: 'I lean towards somewhere quiet, to be honest. After a busy day I value being able to relax without constant noise, though I do like having shops and a park within walking distance.' },
    ],
  },
  {
    id: 'work-study',
    topic: 'Work & Studies',
    icon: '💼',
    questions: [
      { q: 'Do you work or are you a student?', sample: 'I’m currently a student, studying computer science at university. Alongside my degree I take on small freelance projects, which helps me apply what I learn in a practical setting.' },
      { q: 'Why did you choose your subject or job?', sample: 'I’ve always been fascinated by how software can solve real problems. Choosing this field felt natural because it combines logical thinking with creativity, and the opportunities in it are expanding rapidly.' },
      { q: 'What do you find most challenging about it?', sample: 'The pace of change is the toughest part. Technologies evolve so quickly that you have to keep learning constantly, otherwise your skills can become outdated within just a couple of years.' },
      { q: 'What would you like to do in the future?', sample: 'Ideally, I’d like to work as a product engineer at a company that’s building something meaningful, and in the long run perhaps start my own venture once I’ve gained enough experience.' },
    ],
  },
  {
    id: 'free-time',
    topic: 'Free Time',
    icon: '🎯',
    questions: [
      { q: 'What do you usually do in your free time?', sample: 'It varies, but I tend to read, go for a run, or meet friends for a coffee. When I want to switch off completely, I’ll watch a film or listen to a podcast about history.' },
      { q: 'Do you prefer spending free time alone or with others?', sample: 'It really depends on my mood. After a hectic week I often crave some solitude to recharge, but I equally enjoy the energy of being around friends at the weekend.' },
      { q: 'Has the way you spend your free time changed?', sample: 'A fair bit. As a child I was outdoors constantly, whereas now a lot of my downtime involves screens. I’m trying to redress that balance by getting back into hiking.' },
      { q: 'Is there a new activity you would like to try?', sample: 'I’d love to learn to play the piano. There’s something deeply rewarding about creating music, and I think it would be a great way to relax and exercise a different part of my brain.' },
    ],
  },
  {
    id: 'music',
    topic: 'Music',
    icon: '🎵',
    questions: [
      { q: 'What kind of music do you enjoy?', sample: 'I have quite eclectic taste, but I gravitate towards indie and classical. The former lifts my mood, while the latter helps me concentrate when I’m working or studying.' },
      { q: 'When do you usually listen to music?', sample: 'Pretty much throughout the day — on my commute, while cooking, and especially when I exercise, because the right playlist gives me a real boost of motivation.' },
      { q: 'Have your music tastes changed over time?', sample: 'They’ve broadened considerably. As a teenager I only listened to pop, but as I’ve grown older I’ve developed an appreciation for genres I used to dismiss, like jazz and folk.' },
      { q: 'Would you like to learn a musical instrument?', sample: 'Absolutely. I’ve always wanted to play the guitar. It’s portable, sociable, and you can pick up the basics fairly quickly, which makes it really appealing.' },
    ],
  },
  {
    id: 'food',
    topic: 'Food & Cooking',
    icon: '🍽️',
    questions: [
      { q: 'What kind of food do you like to eat?', sample: 'I’m a big fan of home-cooked meals, particularly traditional dishes from my region. I also love trying cuisines from around the world — Italian and Korean food are current favourites.' },
      { q: 'Do you prefer eating at home or in restaurants?', sample: 'Mostly at home, since it’s healthier and more economical, and I genuinely enjoy cooking. But going out is a nice treat, especially for catching up with friends.' },
      { q: 'Can you cook? Who taught you?', sample: 'I can manage a decent range of dishes. My grandmother taught me the basics when I was young, and I’ve since picked up plenty of recipes from online videos and a fair amount of trial and error.' },
      { q: 'Is there a dish you would recommend to a visitor?', sample: 'Without hesitation, I’d recommend plov — a fragrant rice dish cooked with carrots, meat and spices. It’s the centrepiece of any celebration here, and it really captures the local flavour.' },
    ],
  },
  {
    id: 'technology',
    topic: 'Technology & Phones',
    icon: '📱',
    questions: [
      { q: 'How often do you use your phone?', sample: 'Probably more than I’d like to admit. I rely on it for messaging, navigation, and reading the news, though I do try to put it away during meals and before I sleep.' },
      { q: 'What apps do you use the most?', sample: 'Messaging and maps are the essentials, but I also spend a fair amount of time on a language-learning app and a podcast platform, both of which I find genuinely useful.' },
      { q: 'Do you think you spend too much time online?', sample: 'Honestly, sometimes I do. It’s easy to lose an hour scrolling without really noticing. I’ve started setting screen-time limits, which has helped me be more intentional about it.' },
      { q: 'How has technology changed your daily life?', sample: 'Enormously. Tasks that once took hours — banking, booking tickets, even learning a skill — can now be done in minutes from my phone. The convenience is remarkable, even if it has downsides.' },
    ],
  },
  {
    id: 'reading',
    topic: 'Reading & Books',
    icon: '📚',
    questions: [
      { q: 'Do you enjoy reading?', sample: 'Very much so. Reading is my main way of unwinding. I usually have a couple of books on the go — one fiction and one non-fiction — depending on what mood I’m in.' },
      { q: 'What kind of books do you prefer?', sample: 'I’m drawn to science fiction and popular science. I love stories that stretch the imagination, but I also enjoy non-fiction that helps me understand how the world actually works.' },
      { q: 'Do you prefer paper books or e-books?', sample: 'I appreciate both. E-books are practical for travelling since I can carry an entire library on one device, but nothing quite beats the feel of a physical book on a lazy Sunday.' },
      { q: 'Did you read a lot as a child?', sample: 'I did, mostly adventure stories and comics. My parents encouraged the habit by taking me to the library every week, and I’m really grateful for that now.' },
    ],
  },
  {
    id: 'travel',
    topic: 'Travel & Holidays',
    icon: '✈️',
    questions: [
      { q: 'Do you like travelling?', sample: 'I love it. Travelling broadens your perspective in a way nothing else can. Experiencing different cultures, foods and landscapes always leaves me with fresh ideas and lasting memories.' },
      { q: 'What kind of places do you like to visit?', sample: 'I’m particularly drawn to historic cities and coastal towns. I enjoy wandering through old streets and museums, but I also need a bit of nature and water to feel truly relaxed.' },
      { q: 'Do you prefer travelling alone or with others?', sample: 'Travelling with close friends is usually my preference, because shared experiences are more fun. Still, I think everyone should try solo travel at least once — it’s surprisingly empowering.' },
      { q: 'Where would you like to go in the future?', sample: 'Japan is at the top of my list. The blend of cutting-edge technology and deep-rooted tradition fascinates me, and I’ve heard the food and hospitality are second to none.' },
    ],
  },
  {
    id: 'sport',
    topic: 'Sport & Exercise',
    icon: '⚽',
    questions: [
      { q: 'Do you play any sports?', sample: 'I play football regularly with friends at the weekend, and during the week I go to the gym a few times. Staying active keeps me energised and clears my head.' },
      { q: 'How important is exercise to you?', sample: 'It’s essential, both physically and mentally. When I exercise consistently I sleep better, feel calmer and concentrate more easily, so I treat it as non-negotiable in my routine.' },
      { q: 'Did you play sports as a child?', sample: 'Constantly. I was part of a local football team and also tried swimming and basketball. Those early years gave me a love of teamwork that has stayed with me.' },
      { q: 'Do you prefer watching or playing sports?', sample: 'Playing, without a doubt. Watching can be entertaining, especially big matches, but actually being on the pitch and competing is far more satisfying for me.' },
    ],
  },
  {
    id: 'weather',
    topic: 'Weather & Seasons',
    icon: '🌤️',
    questions: [
      { q: 'What’s the weather usually like where you live?', sample: 'We have a continental climate, so summers are hot and dry while winters can be quite cold. The spring and autumn are gloriously mild, which makes them my favourite times of year.' },
      { q: 'What is your favourite season?', sample: 'Autumn, definitely. The temperature is perfect for being outdoors, the colours are beautiful, and there’s a certain cosy atmosphere that I find really comforting.' },
      { q: 'Does the weather affect your mood?', sample: 'It does, more than I’d expect. A bright, sunny morning instantly lifts my spirits, whereas a string of grey, rainy days can make me feel a bit sluggish and unmotivated.' },
      { q: 'Do you prefer hot or cold weather?', sample: 'I’d choose mild over either extreme, but if I had to pick, I prefer cooler weather. You can always add a layer when it’s cold, whereas there’s only so much you can do in intense heat.' },
    ],
  },
  {
    id: 'friends',
    topic: 'Friends',
    icon: '🧑‍🤝‍🧑',
    questions: [
      { q: 'Do you have a large group of friends or a few close ones?', sample: 'I’d say a small circle of close friends. I value depth over quantity — having a handful of people I can rely on completely matters far more to me than knowing lots of people superficially.' },
      { q: 'How do you usually keep in touch with friends?', sample: 'Mostly through messaging and the occasional video call, especially with those who live abroad. But I make a point of meeting up in person whenever we can, because that’s irreplaceable.' },
      { q: 'What do you think makes a good friend?', sample: 'Trust and honesty, above all. A good friend is someone who supports you genuinely, tells you the truth even when it’s difficult, and is there for you in the tough moments, not just the good ones.' },
      { q: 'Is it easy for you to make new friends?', sample: 'Reasonably, yes. I’m fairly outgoing, so I find it easy to start conversations. Turning acquaintances into real friendships takes more time, but I enjoy that process.' },
    ],
  },
  {
    id: 'daily-routine',
    topic: 'Daily Routine',
    icon: '⏰',
    questions: [
      { q: 'Can you describe a typical day for you?', sample: 'My days are fairly structured. I get up early, exercise or read for a bit, then study or work through the morning. Afternoons are for classes and projects, and I keep evenings free to relax and see people.' },
      { q: 'Are you a morning person or a night owl?', sample: 'Very much a morning person. My mind is sharpest in the first few hours of the day, so I schedule my most demanding tasks then and ease off as the evening approaches.' },
      { q: 'How do you usually relax after a busy day?', sample: 'A combination of things — a walk, some music, or a chapter of a good book. Switching off my phone for a while helps me wind down and sleep more soundly.' },
      { q: 'Would you like to change anything about your routine?', sample: 'I’d like to be more consistent with sleep. I tend to stay up too late when I’m absorbed in something, and I know a steadier schedule would do wonders for my focus.' },
    ],
  },
  {
    id: 'shopping',
    topic: 'Shopping',
    icon: '🛍️',
    questions: [
      { q: 'Do you enjoy shopping?', sample: 'It depends on what for. I find shopping for books or gadgets genuinely enjoyable, but browsing for clothes can feel like a chore, so I usually do that quickly and online.' },
      { q: 'Do you prefer shopping online or in stores?', sample: 'Mostly online, because of the convenience and the easy price comparison. For certain things, though — shoes or fresh food — I still prefer going in person so I can check the quality.' },
      { q: 'How often do you go shopping?', sample: 'For groceries, a couple of times a week. For anything else, only when I genuinely need it. I try to avoid impulse buying, which keeps my spending in check.' },
      { q: 'Have your shopping habits changed recently?', sample: 'They have. I’ve become a lot more conscious about buying less but better quality, partly for environmental reasons and partly because it just makes more financial sense in the long run.' },
    ],
  },
  {
    id: 'sleep',
    topic: 'Sleep',
    icon: '😴',
    questions: [
      { q: 'How many hours do you usually sleep?', sample: 'Around seven hours on a good night. I’ve noticed that anything less and I struggle to concentrate the next day, so I really try to protect that time.' },
      { q: 'Do you ever take naps during the day?', sample: 'Occasionally, if I’ve had a poor night. A short twenty-minute nap can be remarkably restorative, but I avoid longer ones because they tend to leave me groggy.' },
      { q: 'What do you do if you can’t sleep?', sample: 'I get up and read something light, or I’ll do some slow breathing. Lying there frustrated only makes it worse, so giving my mind a gentle distraction usually does the trick.' },
      { q: 'Do you think people sleep enough nowadays?', sample: 'I don’t think they do, frankly. Between work pressures and endless screens, a lot of people sacrifice sleep, and I suspect we underestimate just how much that affects our health and mood.' },
    ],
  },
]

// ── PART 2 (Cue Cards) ──────────────────────────────────────────────────────
export const CUE_CARDS: Part2Card[] = [
  {
    id: 'inspiring-person',
    title: 'Describe a person who has inspired you',
    bullets: ['who this person is', 'how you know them', 'what they have done', 'and explain why they inspired you'],
    followUp: 'Do you think young people today have enough positive role models?',
    theme: 'people',
    sample: 'I’d like to talk about my first programming teacher, Mr Karimov, who taught me at a coding club when I was about fifteen. He wasn’t a typical teacher — he treated us like junior colleagues rather than students. What he did that struck me most was give up his weekends to mentor anyone who was genuinely curious, completely free of charge. He had this remarkable ability to make even the most intimidating topics feel approachable, breaking them down step by step until everything clicked. He inspired me for two main reasons. First, his patience showed me that intelligence isn’t fixed — it’s built through persistence. And second, his generosity made me realise that the best way to grow is to help others grow too. To this day, whenever I feel like giving up on a difficult problem, I remember his calm encouragement, and it pushes me to keep going.',
  },
  {
    id: 'skill-learned',
    title: 'Describe a skill you learned that was useful',
    bullets: ['what the skill is', 'how you learned it', 'how long it took', 'and explain how it has been useful'],
    followUp: 'Is it better to learn practical skills or academic knowledge?',
    theme: 'learning',
    sample: 'The skill I’d like to describe is touch typing — being able to type quickly without looking at the keyboard. I picked it up a few years ago when I realised how much time I was wasting hunting for keys. I learned it using a free online program that turned practice into a series of games, and I committed to just fifteen minutes a day. It took me roughly two months to become genuinely comfortable, and a little longer to reach a fast, accurate speed. It has been incredibly useful ever since. Because I can type as quickly as I think, writing essays and code feels far more fluid, and I’m no longer distracted by the mechanics of it. More broadly, the experience taught me a valuable lesson: that consistent, small efforts compound into a skill that pays off for the rest of your life. It’s probably one of the most practical things I’ve ever taught myself.',
  },
  {
    id: 'favourite-place',
    title: 'Describe a place where you like to spend your time',
    bullets: ['where it is', 'how often you go there', 'what you do there', 'and explain why you like it'],
    followUp: 'Why do people in cities need quiet places?',
    theme: 'places',
    sample: 'I’d like to talk about a small riverside park not far from where I live. It’s tucked away behind a row of old trees, so even though it’s in the city, it feels wonderfully secluded. I try to go there at least two or three times a week, usually in the early morning or just before sunset when the light is soft and the crowds have thinned out. When I’m there, I either go for a slow walk along the water, read on a bench, or simply sit and let my thoughts settle. The reason I love it so much is that it offers a genuine escape from the noise and pace of daily life. There’s something about being near water and greenery that resets my mind almost instantly. In a way, it’s become my thinking spot — whenever I have a difficult decision to make, that’s where I go to clear my head.',
  },
  {
    id: 'memorable-journey',
    title: 'Describe a memorable journey you have taken',
    bullets: ['where you went', 'who you went with', 'what happened', 'and explain why it was memorable'],
    followUp: 'How has the way people travel changed over the years?',
    theme: 'travel',
    sample: 'One journey that has really stayed with me was a trip to the mountains with three close friends a couple of summers ago. We travelled by an old, rattling bus that wound its way up endless hairpin bends, and then hiked the final stretch to a remote village. What made it eventful was that the weather turned dramatically halfway up — a thick mist rolled in and we briefly lost the trail. For a short while it was genuinely nerve-racking, but we kept calm, retraced our steps, and eventually found our way. The reason it’s so memorable isn’t really the destination, beautiful as it was; it’s the feeling of having faced a small challenge together and come through it. That shared sense of relief and achievement, sitting around a fire that night, created a bond that we still talk about today. It taught me that the best journeys are often the ones that don’t go entirely to plan.',
  },
  {
    id: 'important-decision',
    title: 'Describe an important decision you made',
    bullets: ['what the decision was', 'when you made it', 'how you decided', 'and explain how it affected you'],
    followUp: 'Should young people make their own decisions or follow their parents’ advice?',
    theme: 'experiences',
    sample: 'A particularly important decision I made was choosing to study computer science rather than economics, which is what my family had originally expected. I made this choice at eighteen, right at the point of applying to university. It wasn’t easy, because there was a lot of pressure to take the safer, more traditional route. In the end, I decided by being honest with myself about what genuinely excited me, and by talking to people already working in both fields to understand the day-to-day reality. The decision affected me profoundly. It gave me a real sense of ownership over my future, because for the first time I had chosen a path rather than simply following one. Although it was daunting at the time, it turned out to be exactly right — I’m far more motivated studying something I’m passionate about. Looking back, that decision taught me to trust my own judgement, which is a lesson I’ve applied many times since.',
  },
  {
    id: 'useful-technology',
    title: 'Describe a piece of technology you find useful',
    bullets: ['what it is', 'how you use it', 'how often you use it', 'and explain why it is useful'],
    followUp: 'Which everyday skills should people keep practising without technology?',
    theme: 'technology',
    sample: 'The piece of technology I’d like to describe is my pair of noise-cancelling headphones, which have honestly transformed how I work and study. I use them mainly to create a pocket of silence in noisy environments — on public transport, in busy cafés, or even at home when there’s a lot going on around me. I’d say I use them almost daily, often for several hours at a stretch. The reason they’re so useful is that focus is increasingly hard to come by, and these headphones effectively give me a switch to turn the world’s distractions off. When I put them on, my concentration deepens almost immediately, and tasks that would normally take ages get done far more efficiently. Beyond productivity, they’re also a small luxury that makes long commutes far more pleasant, letting me lose myself in music or a podcast. For a relatively simple device, the difference they’ve made to my daily life is genuinely significant.',
  },
  {
    id: 'enjoyed-book',
    title: 'Describe a book you have enjoyed reading',
    bullets: ['what the book is', 'what it is about', 'when you read it', 'and explain why you enjoyed it'],
    followUp: 'What makes a book worth recommending to another person?',
    theme: 'books',
    sample: 'I’d like to talk about a popular science book about the history of the human species, which I read last year during a long holiday. Broadly, it traces how our ancestors went from being a fairly unremarkable animal to the dominant force on the planet, weaving together history, biology and psychology in a really accessible way. I read it over the course of about two weeks, often staying up far later than I’d intended because I couldn’t put it down. What I enjoyed most was how it completely shifted my perspective; ideas I’d always taken for granted, like money or nations, were reframed as shared stories that only work because we all believe in them. The author has a gift for making complex arguments feel like a gripping narrative. By the end, I felt I understood the world — and my own place in it — a little more clearly, and that, to me, is the mark of a truly great book.',
  },
  {
    id: 'hobby',
    title: 'Describe a hobby you enjoy',
    bullets: ['what the hobby is', 'how you got into it', 'how often you do it', 'and explain why you enjoy it'],
    followUp: 'Why is it important for people to have hobbies?',
    theme: 'free time',
    sample: 'A hobby I genuinely love is photography, specifically street photography. I got into it almost by accident a few years ago when I borrowed a friend’s camera on a trip and became fascinated by trying to capture ordinary moments in an interesting way. Since then it’s grown into a real passion. I try to head out with my camera at least once a week, usually wandering around the city with no fixed plan, just looking for light, expressions and little scenes that tell a story. The reason I enjoy it so much is that it’s changed the way I see the world; even on the most ordinary day, I notice details I’d previously have walked straight past. It’s also a wonderful counterbalance to screen-based work — it gets me outside, walking for hours, fully present in the moment. On top of that, building up a collection of images I’m proud of gives me a quiet but lasting sense of satisfaction.',
  },
  {
    id: 'goal',
    title: 'Describe a goal you would like to achieve',
    bullets: ['what the goal is', 'why you want to achieve it', 'what you need to do', 'and explain how you would feel if you achieved it'],
    followUp: 'Are long-term or short-term goals more important?',
    theme: 'ambition',
    sample: 'A goal I’m really determined to achieve is to become fluent enough in English to work comfortably in an international team. I want this partly for career reasons — so many opportunities open up once you can communicate confidently across borders — and partly for personal growth, because language is a doorway to other cultures and ideas. To get there, I know I need to keep practising consistently: speaking every day, even when it’s uncomfortable, expanding my vocabulary, and putting myself in situations where I’m forced to use the language under pressure. It’s a gradual process with no shortcuts. If I do achieve it, I think I’d feel an enormous sense of pride and freedom. Fluency wouldn’t just be a line on my CV; it would be proof that sustained effort really does pay off, and it would give me the confidence to pursue goals I currently consider out of reach. That, more than anything, is what keeps me motivated.',
  },
  {
    id: 'challenge',
    title: 'Describe a difficult challenge you completed',
    bullets: ['what the challenge was', 'why it was difficult', 'how you dealt with it', 'and explain how you felt afterwards'],
    followUp: 'Do difficult experiences make people stronger?',
    theme: 'experiences',
    sample: 'The challenge I’d like to describe was preparing a major presentation for a competition while juggling my regular studies. It was difficult for a few reasons: the topic was complex, I had only two weeks, and — being quite shy — public speaking genuinely terrified me at the time. I dealt with it by breaking the task into small, manageable pieces and tackling one each day, rather than letting the sheer size of it overwhelm me. To conquer the nerves, I rehearsed relentlessly, first alone, then in front of patient friends who gave me honest feedback. When the day finally came, although my heart was pounding, the preparation carried me through and the presentation went far better than I’d dared hope. Afterwards, I felt an incredible mix of relief and pride. More importantly, the experience permanently changed my relationship with public speaking; what had once seemed impossible now felt merely difficult, and that shift in mindset has stayed with me ever since.',
  },
  {
    id: 'special-meal',
    title: 'Describe a special meal you remember',
    bullets: ['what the meal was', 'where you had it', 'who you were with', 'and explain why it was special'],
    followUp: 'How important are family meals in your culture?',
    theme: 'food',
    sample: 'A meal that has a special place in my memory was a large family dinner we held to celebrate my grandparents’ wedding anniversary. It took place at my grandparents’ home, around an enormous table that could barely contain all the dishes. Almost the entire extended family was there — aunts, uncles, cousins I rarely get to see — so the house was full of noise and laughter. The centrepiece was a beautifully prepared plov, cooked the traditional way over an open flame, surrounded by salads, fresh bread and endless cups of tea. What made it so special wasn’t really the food, exceptional though it was; it was the rare sense of the whole family being together in one place, sharing stories and celebrating two people who had spent a lifetime together. In our culture, gathering around a meal is how we express love and belonging, and that evening captured that feeling perfectly. It’s a memory I treasure.',
  },
  {
    id: 'influential-teacher',
    title: 'Describe a teacher who influenced you',
    bullets: ['who the teacher was', 'what subject they taught', 'what they were like', 'and explain how they influenced you'],
    followUp: 'What qualities make a good teacher?',
    theme: 'learning',
    sample: 'I’d like to talk about my secondary-school literature teacher, Ms Ahmedova, who had a profound influence on me. She taught English literature, a subject I initially found rather dull. What set her apart was her sheer enthusiasm; she spoke about books as though they were the most exciting things in the world, and that energy was contagious. Rather than making us memorise facts, she encouraged us to question, to argue, and to form our own interpretations, treating our opinions as if they genuinely mattered. She influenced me in a way that went far beyond the subject itself. Through her, I discovered a love of reading that has stayed with me ever since, and more importantly, she taught me how to think critically and express my ideas with confidence. Those are skills I draw on every single day. Looking back, she didn’t just teach a subject; she helped shape the way I see the world, which is the highest praise I can give a teacher.',
  },
  {
    id: 'helped-someone',
    title: 'Describe a time you helped someone',
    bullets: ['who you helped', 'what the situation was', 'how you helped them', 'and explain how you felt about it'],
    followUp: 'Do you think people help each other less than in the past?',
    theme: 'people',
    sample: 'I’d like to describe a time I helped a younger student at university who was really struggling with a programming course. We met by chance in the library, and I could see he was on the verge of giving up entirely, convinced he simply “wasn’t a coder”. The situation reminded me strongly of my own early frustrations, so I offered to walk him through the material. Over the following weeks, I spent a couple of hours with him each week, not just explaining the concepts but trying to rebuild his confidence by showing him that everyone finds it hard at first. Gradually, things started to click, and by the end of the term he passed the course comfortably. Helping him was genuinely one of the most rewarding things I’ve done. Seeing his confidence grow gave me a deep sense of satisfaction, and it reminded me that sometimes the most valuable thing you can offer someone isn’t the answer, but the belief that they’re capable of finding it.',
  },
  {
    id: 'city-visit',
    title: 'Describe a city you would like to visit',
    bullets: ['which city it is', 'how you know about it', 'what you would do there', 'and explain why you want to visit it'],
    followUp: 'Why do some cities attract more tourists than others?',
    theme: 'places',
    sample: 'A city I’m absolutely longing to visit is Kyoto in Japan. I first became fascinated by it through documentaries and the photographs of friends who’ve travelled there, and the more I learn, the stronger the pull becomes. If I went, I’d spend my days exploring its ancient temples and traditional gardens, wandering the old wooden streets, and of course sampling as much local food as possible. I’d also love to experience a traditional tea ceremony to understand the philosophy behind it. The reason I want to visit so badly is the city’s extraordinary blend of the old and the new — it has preserved centuries of tradition while sitting within one of the world’s most advanced societies. That contrast intrigues me deeply. I think travelling there wouldn’t just be a holiday; it would be a chance to step into a completely different way of seeing beauty, time and craftsmanship. It’s firmly at the top of my travel list.',
  },
  {
    id: 'advice',
    title: 'Describe a piece of advice you received',
    bullets: ['what the advice was', 'who gave it to you', 'when they gave it', 'and explain why it was useful'],
    followUp: 'Is it always wise to follow other people’s advice?',
    theme: 'experiences',
    sample: 'The most valuable piece of advice I’ve ever received came from my father, who told me, quite simply, to “focus on getting a little better, not on being the best.” He said this to me when I was a teenager, at a point when I was so afraid of failing that I’d often avoid trying difficult things altogether. The advice was useful because it completely reframed how I approached challenges. Instead of measuring myself against others and feeling discouraged, I started comparing myself only to who I’d been the day before, which made progress feel achievable and even enjoyable. Over the years, that small shift in mindset has had an enormous effect — it’s how I’ve learned languages, picked up skills, and pushed through setbacks that might otherwise have stopped me. What I appreciate most is its versatility; it applies to almost everything in life. I often pass it on to friends now, because I genuinely believe it’s some of the wisest advice anyone could follow.',
  },
  {
    id: 'website-app',
    title: 'Describe a website or app you use often',
    bullets: ['what it is', 'how you found it', 'what you use it for', 'and explain why you like it'],
    followUp: 'How have apps changed the way people learn?',
    theme: 'technology',
    sample: 'An app I use almost every day is a language-learning platform that turns studying into a series of short, game-like lessons. I came across it through a recommendation in an online forum when I was looking for a way to keep my English sharp without it feeling like a chore. I mainly use it for a quick ten-minute session each morning, reviewing vocabulary and grammar, and it sends me gentle reminders so I don’t break my streak. The reason I like it so much is that it has cleverly solved the hardest part of learning anything: staying consistent. By breaking lessons into tiny, rewarding chunks, it makes daily practice feel almost effortless, even enjoyable. Over time, those small sessions have genuinely added up to noticeable progress. Beyond the learning itself, I admire how thoughtfully it’s designed — it understands human psychology and uses it to build a positive habit rather than just delivering content. For me, it’s a perfect example of technology being used to make self-improvement accessible.',
  },
]

// ── PART 3 (Discussion) ─────────────────────────────────────────────────────
export const PART3_THEMES: Part3Theme[] = [
  {
    id: 'role-models',
    theme: 'People & Role Models',
    questions: [
      { q: 'Why are role models important for young people?', sample: 'Role models give young people a concrete sense of what’s possible. Rather than chasing a vague idea of success, they can see real examples of how qualities like discipline and resilience lead to results, which makes their own goals feel far more attainable.' },
      { q: 'Do you think celebrities make good role models?', sample: 'Some do, but it’s a mixed picture. Many celebrities achieve fame for talent and hard work, which is genuinely inspiring; however, others are admired purely for their wealth or image, and that can promote rather shallow values to impressionable audiences.' },
      { q: 'How has the idea of a role model changed over time?', sample: 'It’s broadened enormously. In the past, role models tended to be local or historical figures, whereas social media now means a teenager might look up to a creator on the other side of the world. The downside is that this can blur the line between genuine merit and mere popularity.' },
      { q: 'Should parents be the main role models for children?', sample: 'Ideally they should be among the most important ones, since children naturally imitate the people closest to them. That said, it’s healthy for young people to draw inspiration from a range of sources too, as no single person can embody every quality worth admiring.' },
    ],
  },
  {
    id: 'learning-skills',
    theme: 'Learning & Skills',
    questions: [
      { q: 'Is it better to learn a skill alone or with a teacher?', sample: 'Both have their place. A good teacher can accelerate learning by correcting mistakes early and providing structure, which is invaluable for complex skills. However, learning independently builds problem-solving ability and self-reliance, so the ideal is probably a blend of the two.' },
      { q: 'What skills do you think will be most important in the future?', sample: 'I’d argue that adaptability and the ability to learn quickly will matter most, because technology is changing the job market so rapidly. Alongside that, distinctly human skills like creativity, communication and emotional intelligence will become more valuable precisely because machines struggle to replicate them.' },
      { q: 'Why do some people find it hard to learn new things as adults?', sample: 'Partly it’s practical — adults have less free time and more responsibilities than children. But there’s also a psychological barrier: adults are often afraid of looking foolish, so they avoid the very mistakes that learning requires. Children, by contrast, aren’t held back by that fear.' },
      { q: 'Should schools teach more practical skills?', sample: 'I think there’s a strong case for it. Many people leave school lacking everyday skills like managing money or basic problem-solving. While academic knowledge remains essential, a greater emphasis on applying that knowledge to real situations would better prepare students for adult life.' },
    ],
  },
  {
    id: 'places-cities',
    theme: 'Places & Cities',
    questions: [
      { q: 'Why do people in cities need quiet, green spaces?', sample: 'Urban life is fast-paced and often stressful, so green spaces act as a vital release valve. They give residents somewhere to relax, exercise and reconnect with nature, which research consistently links to better mental health. Without them, cities would feel relentless and far less liveable.' },
      { q: 'How can cities be made more pleasant to live in?', sample: 'A great deal comes down to thoughtful planning — efficient public transport, pedestrian-friendly streets, and plenty of parks all make an enormous difference. Mixing residential, commercial and green areas so that daily needs are within walking distance also helps create a real sense of community.' },
      { q: 'Do you think people prefer living in cities or the countryside?', sample: 'It largely depends on their stage of life. Younger people are often drawn to cities for the opportunities and energy, whereas families and older people may prefer the space and calm of the countryside. Increasingly, though, remote work is letting people enjoy the best of both.' },
      { q: 'What are the disadvantages of living in a big city?', sample: 'The obvious ones are the high cost of living, pollution and congestion. Beyond that, cities can feel surprisingly isolating despite the crowds, as the fast pace leaves little time for genuine connection. These pressures explain why many people eventually seek a quieter life elsewhere.' },
    ],
  },
  {
    id: 'travel-tourism',
    theme: 'Travel & Tourism',
    questions: [
      { q: 'How has the way people travel changed in recent decades?', sample: 'Travel has become far more accessible and independent. Budget airlines and online booking have made international trips affordable for ordinary people, while smartphones mean travellers can navigate, translate and plan on the move, reducing the need for guides or agencies that were once essential.' },
      { q: 'What are the benefits of travelling to other countries?', sample: 'The greatest benefit is the broadening of perspective. Experiencing different cultures first-hand challenges your assumptions and fosters tolerance in a way no book can. It also builds practical confidence and independence, and often gives people a renewed appreciation for their own home as well.' },
      { q: 'Does tourism always benefit local communities?', sample: 'Not necessarily. Tourism can bring valuable income and jobs, but if it’s poorly managed it can also drive up local prices, strain resources and erode the very culture visitors came to see. The key is sustainable tourism that genuinely shares the benefits with local people.' },
      { q: 'Do you think virtual travel could replace real travel?', sample: 'I doubt it will ever fully replace it. Virtual technology can offer a convenient preview and is wonderful for those unable to travel, but it can’t reproduce the smells, tastes and spontaneous human encounters that make real travel transformative. At best, it’s a complement rather than a substitute.' },
    ],
  },
  {
    id: 'technology-society',
    theme: 'Technology & Society',
    questions: [
      { q: 'Is technology making communication better or worse?', sample: 'It’s genuinely both. On one hand, technology lets us stay connected with people across the globe instantly, which is remarkable. On the other, it can encourage shallow, constant contact at the expense of deeper face-to-face conversation, so the quality of our communication doesn’t always match the quantity.' },
      { q: 'Do you think people rely too much on technology?', sample: 'In many ways, yes. We’ve outsourced so much — from remembering directions to doing mental arithmetic — that some basic skills are starting to fade. While this convenience is mostly positive, it does leave us rather vulnerable whenever the technology fails, which is a real concern.' },
      { q: 'How might artificial intelligence change the job market?', sample: 'AI is likely to automate many routine tasks, which will inevitably displace some jobs, particularly repetitive ones. However, history suggests it will also create entirely new roles we can’t yet imagine. The crucial challenge will be helping workers reskill quickly enough to keep pace with that shift.' },
      { q: 'What are the risks of children using social media?', sample: 'The main risks are to mental health and development. Constant comparison with carefully curated images can damage self-esteem, while excessive screen time can crowd out sleep, exercise and real friendships. There are also genuine concerns around privacy and exposure to inappropriate content, which makes parental guidance essential.' },
    ],
  },
  {
    id: 'books-reading',
    theme: 'Books & Reading',
    questions: [
      { q: 'Do you think people read less than they used to?', sample: 'In terms of books, possibly, since there’s so much competition for our attention from video and social media. But it’s worth noting that people probably read more text overall than ever before — just in shorter, fragmented forms. The concern is that this trains us for skimming rather than deep, sustained reading.' },
      { q: 'Why is reading important for children?', sample: 'Reading is fundamental to a child’s development. It builds vocabulary and concentration, and crucially, fiction develops empathy by letting children experience the world through other people’s eyes. Children who read widely also tend to perform better across all subjects, because reading underpins nearly all learning.' },
      { q: 'Will printed books disappear in the future?', sample: 'I don’t think they’ll disappear entirely, even if e-books continue to grow. Many people have a strong emotional attachment to physical books — the feel, the smell, the act of turning pages. Printed books may well become more of a premium, cherished object rather than the default, but they’ll endure.' },
      { q: 'How can people be encouraged to read more?', sample: 'It starts in childhood, by making reading enjoyable rather than a duty and by surrounding children with books. For adults, libraries, reading groups and well-designed apps can all help. Ultimately, the trick is to remove the friction and let people discover that reading is a pleasure, not a chore.' },
    ],
  },
  {
    id: 'work-success',
    theme: 'Work & Success',
    questions: [
      { q: 'What does it mean to be successful?', sample: 'I think success is deeply personal, but at its core it means living in line with your own values rather than someone else’s. For some that’s career achievement, for others it’s raising a happy family or simply having the freedom to spend time as they choose. Defining it for yourself is half the battle.' },
      { q: 'Is a high salary more important than job satisfaction?', sample: 'In my view, satisfaction matters more in the long run. A high salary loses its appeal quickly if you dread every working day, whereas meaningful work sustains your motivation and wellbeing. That said, financial security can’t be ignored, so the ideal is a job that offers a reasonable balance of both.' },
      { q: 'How important is teamwork in the modern workplace?', sample: 'It’s absolutely central. Most significant achievements today are too complex for any one person, so the ability to collaborate, communicate clearly and resolve disagreements has become as valuable as technical expertise. Employers increasingly prize people who can bring out the best in those around them.' },
      { q: 'Should the government do more to reduce unemployment?', sample: 'I believe it has an important role, particularly in providing retraining and supporting industries during difficult transitions. However, governments can’t solve the problem alone; the most effective approach combines public investment in education and infrastructure with conditions that allow private businesses to grow and create jobs.' },
    ],
  },
  {
    id: 'goals-ambition',
    theme: 'Goals & Ambition',
    questions: [
      { q: 'Are short-term or long-term goals more important?', sample: 'They serve different purposes, so both are necessary. Long-term goals give your life direction and meaning, but they can feel overwhelming on their own. Short-term goals break that journey into achievable steps and provide the regular motivation that keeps you moving forward, so the two work best together.' },
      { q: 'Why do some people achieve their goals while others don’t?', sample: 'Often the difference isn’t talent but consistency and resilience. Those who succeed tend to keep going after setbacks and adjust their approach instead of giving up. Having a clear, realistic plan and the discipline to follow it daily usually matters far more than a sudden burst of motivation.' },
      { q: 'Should people share their goals with others?', sample: 'It can cut both ways. Sharing goals can create helpful accountability and attract support and advice. On the other hand, talking about a goal can sometimes give a false sense of progress, reducing the drive to actually do the work. The wisest approach is to share selectively, with people who’ll genuinely hold you to it.' },
      { q: 'How do people’s ambitions change as they get older?', sample: 'They tend to shift from external to internal measures. Younger people are often driven by status, money or recognition, whereas with age and experience many come to value health, relationships and a sense of purpose more highly. It’s less that ambition fades and more that it matures into something deeper.' },
    ],
  },
  {
    id: 'education',
    theme: 'Education',
    questions: [
      { q: 'How has education changed compared with the past?', sample: 'The biggest change is access. Information that was once locked away in universities is now freely available online to anyone with a connection. Teaching styles have also shifted from rote memorisation towards critical thinking and collaboration, although the pace of that change varies enormously between countries.' },
      { q: 'Will online learning replace traditional classrooms?', sample: 'I think it will complement rather than replace them. Online learning is unbeatable for flexibility and reaching remote learners, but classrooms offer social interaction, discipline and hands-on guidance that screens struggle to match. The most likely future is a blended model that draws on the strengths of both.' },
      { q: 'What role should parents play in their children’s education?', sample: 'Parents play a crucial supporting role. They can’t and shouldn’t replace teachers, but by encouraging curiosity, creating a calm space to study and showing that they value learning, they set the foundation. A child whose parents are genuinely involved tends to be far more motivated and confident.' },
      { q: 'Should education focus more on exams or practical skills?', sample: 'There needs to be a rebalancing. Exams have their uses for measuring progress, but an excessive focus on them encourages memorising rather than understanding. Giving more weight to practical skills, projects and the ability to apply knowledge would produce graduates who are better prepared for the real world.' },
    ],
  },
  {
    id: 'environment',
    theme: 'Environment',
    questions: [
      { q: 'Whose responsibility is it to protect the environment?', sample: 'It has to be a shared responsibility. Individuals can make meaningful choices in how they consume and travel, but the largest impact comes from governments and corporations, which control policy and industry. Real progress depends on all three acting together rather than each waiting for the others to move first.' },
      { q: 'Are people willing to change their lifestyle for the environment?', sample: 'Willingness is growing, but it’s often limited to changes that are cheap and convenient, like recycling. Most people hesitate when protecting the environment requires real sacrifice or extra cost. That’s why making the sustainable option the easy and affordable one is so important for driving genuine change.' },
      { q: 'What is the most serious environmental problem today?', sample: 'Climate change is arguably the gravest, because it amplifies almost every other problem — from extreme weather to food and water shortages. What makes it so challenging is that it’s global and gradual, so the costs of acting feel immediate while the benefits seem distant, which weakens the urgency to respond.' },
      { q: 'How can young people help the environment?', sample: 'Beyond everyday habits like reducing waste and using public transport, young people have two especially powerful tools: their voices and their choices. By raising awareness, supporting responsible businesses, and pressuring decision-makers, they can drive change on a scale that individual actions alone could never achieve.' },
    ],
  },
]

export const PART_LABELS: Record<SpeakingPart, string> = {
  1: 'Part 1 — Introduction & Interview',
  2: 'Part 2 — Individual Long Turn (Cue Card)',
  3: 'Part 3 — Two-way Discussion',
}

export function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}
