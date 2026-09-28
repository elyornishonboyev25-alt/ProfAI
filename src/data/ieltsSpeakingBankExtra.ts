// Extra original IELTS Speaking material that extends the base bank so the Day
// roadmap and the full mocks never reuse the same topic/question. All content here
// is original (standard public IELTS topics, our own wording and model answers).
// The catalog maps Days to the first 10 of each part and Mocks to the next 20, so
// with 30 of each there is zero overlap anywhere.

import type { Part1Topic, Part2Card, Part3Theme } from '@/data/ieltsSpeakingBank'

// ── EXTRA PART 1 (15 more topics → 30 total) ────────────────────────────────
export const EXTRA_PART1_TOPICS: Part1Topic[] = [
  {
    id: 'family',
    topic: 'Family',
    icon: '👨‍👩‍👧',
    questions: [
      { q: 'Do you have a large or a small family?', sample: 'I’d say it’s medium-sized — my parents, a younger sister and me, plus a big network of cousins we see at weekends.' },
      { q: 'Who are you closest to in your family?', sample: 'Probably my sister. We’re only two years apart, so we grew up sharing everything and we still tell each other almost anything.' },
      { q: 'Do you spend a lot of time with your family?', sample: 'As much as I can. We always have dinner together in the evenings, and that hour of catching up is something I really value.' },
      { q: 'What do you usually do when you spend time with your family?', sample: 'We often have dinner together and talk about our day. At weekends, we sometimes visit relatives or go for a walk.' },
    ],
  },
  {
    id: 'films',
    topic: 'Films & TV',
    icon: '🎬',
    questions: [
      { q: 'Do you enjoy watching films?', sample: 'I love them. A good film is the perfect way to switch off, and I particularly enjoy science fiction and clever thrillers.' },
      { q: 'Do you prefer watching films at home or at the cinema?', sample: 'For big, spectacular films the cinema is unbeatable, but for everyday viewing I prefer the comfort and flexibility of home.' },
      { q: 'What kind of TV programmes do you watch?', sample: 'Mostly documentaries and the occasional drama series. I find documentaries relaxing and I usually learn something at the same time.' },
      { q: 'Have your viewing habits changed recently?', sample: 'Definitely — I’ve almost completely switched to streaming, which means I watch on my own schedule rather than waiting for something to be broadcast.' },
    ],
  },
  {
    id: 'clothes',
    topic: 'Clothes & Fashion',
    icon: '👕',
    questions: [
      { q: 'What kind of clothes do you usually wear?', sample: 'I tend to keep it simple and comfortable — jeans, a plain shirt and trainers — but I’ll dress more smartly when the occasion calls for it.' },
      { q: 'Do you prefer comfortable or fashionable clothes?', sample: 'Comfort wins for me, though I do think you can be both. I’d rather feel relaxed and confident than follow a trend that doesn’t suit me.' },
      { q: 'Where do you usually buy your clothes?', sample: 'Mostly online these days, because of the choice and the prices, but I still try shoes and jackets on in person to get the fit right.' },
      { q: 'Are clothes important to you?', sample: 'To a degree. I don’t obsess over fashion, but I do believe that dressing neatly affects how you feel and how others respond to you.' },
    ],
  },
  {
    id: 'animals',
    topic: 'Animals & Pets',
    icon: '🐾',
    questions: [
      { q: 'Do you have any pets?', sample: 'I have a cat called Misha. She’s independent and a bit mischievous, but she’s wonderful company after a long day.' },
      { q: 'Did you have pets as a child?', sample: 'Yes, we had a dog for years. Looking after him taught me a lot about responsibility and unconditional affection.' },
      { q: 'What is your favourite animal?', sample: 'I’ve always been fascinated by elephants. They’re intelligent and surprisingly emotional creatures, and I find their family bonds remarkable.' },
      { q: 'Do you think keeping pets is good for people?', sample: 'Absolutely. Pets reduce stress and loneliness, and for children especially, they’re a gentle way to learn empathy and routine.' },
    ],
  },
  {
    id: 'nature',
    topic: 'Nature & Outdoors',
    icon: '🌳',
    questions: [
      { q: 'Do you like spending time in nature?', sample: 'Very much. Being outdoors clears my head like nothing else, so I try to get out into the hills or a park most weekends.' },
      { q: 'Is there much green space where you live?', sample: 'There are a few good parks within walking distance, which I’m grateful for, though I’d always welcome more in a busy city.' },
      { q: 'What outdoor activities do you enjoy?', sample: 'Mainly hiking and cycling. I love the feeling of covering distance under my own power and seeing somewhere new along the way.' },
      { q: 'Did you spend more time outdoors as a child?', sample: 'Far more — I was outside constantly, playing in the street and exploring. Children today seem to spend much more time on screens.' },
    ],
  },
  {
    id: 'festivals',
    topic: 'Holidays & Festivals',
    icon: '🎉',
    questions: [
      { q: 'What is the most important festival in your country?', sample: 'Navruz, the spring new year, is the biggest. Families gather, cook special dishes and celebrate the renewal that comes with the season.' },
      { q: 'How do people usually celebrate it?', sample: 'With huge family meals, music, and visiting relatives and neighbours. Communities often hold events with traditional food and games.' },
      { q: 'Do you enjoy festivals?', sample: 'I really do. They’re a rare chance to slow down, reconnect with family, and feel part of something bigger than daily routine.' },
      { q: 'Have festivals changed over the years?', sample: 'Some traditions have faded and celebrations have become a bit more commercial, but the core idea of bringing people together has stayed the same.' },
    ],
  },
  {
    id: 'transport',
    topic: 'Transport',
    icon: '🚌',
    questions: [
      { q: 'How do you usually get around?', sample: 'Mostly by public transport — the bus and metro are cheap and reliable — and I walk for shorter trips whenever the weather allows.' },
      { q: 'Do you prefer public transport or driving?', sample: 'Public transport, honestly. I can read or relax instead of concentrating on the road, and it’s far better for the environment.' },
      { q: 'Has transport in your city improved?', sample: 'It has, noticeably. New metro lines and clearer schedules have made journeys quicker, though traffic at rush hour is still a problem.' },
      { q: 'How could transport be made better?', sample: 'I’d invest in more frequent buses and protected cycle lanes, which would encourage people to leave their cars at home and ease congestion.' },
    ],
  },
  {
    id: 'languages',
    topic: 'Languages',
    icon: '🗣️',
    questions: [
      { q: 'How many languages can you speak?', sample: 'Three, to different levels — my mother tongue fluently, English confidently, and enough Russian to get by in everyday situations.' },
      { q: 'Why are you learning English?', sample: 'Mainly for opportunities. So much of the internet, business and study happens in English, so it opens doors that would otherwise stay closed.' },
      { q: 'What’s the hardest part of learning a language?', sample: 'For me it’s speaking confidently. You can know the grammar perfectly, but overcoming the fear of making mistakes out loud is the real challenge.' },
      { q: 'Would you like to learn another language?', sample: 'I’d love to learn Spanish one day. It’s spoken across so many countries, and I find the sound of it really warm and expressive.' },
    ],
  },
  {
    id: 'art',
    topic: 'Art & Drawing',
    icon: '🎨',
    questions: [
      { q: 'Are you good at art?', sample: 'Not especially, but I enjoy it. I doodle to relax, and even if the result isn’t a masterpiece, the process itself is satisfying.' },
      { q: 'Did you learn art at school?', sample: 'We had art lessons every week, and although I wasn’t the most talented, those classes gave me a lasting appreciation for creativity.' },
      { q: 'Do you like visiting art galleries?', sample: 'I do, now and then. Standing in front of a famous painting in person has a power that no photograph or screen can really capture.' },
      { q: 'Is art important for children?', sample: 'Hugely. Art lets children express feelings they can’t yet put into words and develops imagination, which feeds into every other area of learning.' },
    ],
  },
  {
    id: 'photographs',
    topic: 'Photographs',
    icon: '📷',
    questions: [
      { q: 'Do you like taking photos?', sample: 'I do — I’m always snapping things on my phone, from interesting buildings to a nice meal, partly to remember moments and partly just for fun.' },
      { q: 'What do you usually take photos of?', sample: 'Mostly landscapes when I travel, and the people I’m with. Those candid shots of friends laughing are the ones I treasure most.' },
      { q: 'Do you prefer taking photos or being in them?', sample: 'Taking them, definitely. I’m a little camera-shy, so I’m much happier capturing the scene than being the subject of it.' },
      { q: 'Do you keep printed photos?', sample: 'A few special ones, yes. There’s something about holding a printed photo, or seeing it on the wall, that a phone gallery can’t match.' },
    ],
  },
  {
    id: 'gifts',
    topic: 'Giving Gifts',
    icon: '🎁',
    questions: [
      { q: 'Do you enjoy giving gifts?', sample: 'I really do. Finding something that suits a person perfectly, and seeing their reaction when they open it, is genuinely rewarding.' },
      { q: 'How do you choose a gift for someone?', sample: 'I think about what they actually enjoy rather than what’s expensive. A thoughtful, well-chosen gift always means more than a costly, generic one.' },
      { q: 'Do you prefer giving or receiving gifts?', sample: 'Giving, surprisingly. The effort of picking something meaningful and the joy of watching someone unwrap it are more satisfying than receiving.' },
      { q: 'Are gifts important in your culture?', sample: 'Very much so. We bring something whenever we visit someone’s home, and gift-giving is an important way of showing respect and affection.' },
    ],
  },
  {
    id: 'neighbours',
    topic: 'Neighbours',
    icon: '🏘️',
    questions: [
      { q: 'Do you know your neighbours well?', sample: 'Fairly well, yes. We’re not in and out of each other’s homes, but we chat regularly and help one another out when it’s needed.' },
      { q: 'What makes a good neighbour?', sample: 'Being considerate, mainly — keeping the noise down, being friendly, and being willing to lend a hand without being intrusive.' },
      { q: 'Do people help their neighbours where you live?', sample: 'Generally they do. People will accept a parcel for you or keep an eye on your flat when you’re away, which I really appreciate.' },
      { q: 'Have neighbourly relationships changed over time?', sample: 'I think they’ve weakened a little, especially in cities where people are busier and move more often, but the sense of community is still there.' },
    ],
  },
  {
    id: 'childhood',
    topic: 'Childhood',
    icon: '🧸',
    questions: [
      { q: 'What did you enjoy doing as a child?', sample: 'I spent endless hours playing football in the yard with the other kids and building imaginary worlds out of whatever I could find.' },
      { q: 'Where did you grow up?', sample: 'I grew up in a quiet neighbourhood on the edge of the city, where everyone knew everyone, which gave my childhood a real sense of safety.' },
      { q: 'What is your happiest childhood memory?', sample: 'Long summers at my grandparents’ house in the countryside — the freedom, the food, and the feeling that the days would never end.' },
      { q: 'Do you think childhood is the best time of a person’s life?', sample: 'In many ways, yes. You have freedom from responsibility and a sense of wonder, though I think every stage of life has its own rewards.' },
    ],
  },
  {
    id: 'health',
    topic: 'Health & Fitness',
    icon: '💪',
    questions: [
      { q: 'Do you do much to stay healthy?', sample: 'I try to. I exercise a few times a week, watch what I eat most of the time, and make a real effort to get enough sleep.' },
      { q: 'How do you usually relax when you feel stressed?', sample: 'I tend to go for a long walk or listen to music, and switching my phone off for a while helps me unwind far more than I’d expect.' },
      { q: 'Has your diet changed in recent years?', sample: 'It has improved a lot. I cook from scratch more often now and rely far less on processed food, which has made a noticeable difference.' },
      { q: 'Do you think people are healthier now than in the past?', sample: 'It’s mixed. We know far more about health and medicine, yet sedentary lifestyles and fast food have created new problems of their own.' },
    ],
  },
  {
    id: 'news',
    topic: 'News & Media',
    icon: '📰',
    questions: [
      { q: 'How do you usually get the news?', sample: 'Mostly through a couple of news apps on my phone, with a quick scroll in the morning and at lunch to stay roughly up to date.' },
      { q: 'Are you interested in local or international news?', sample: 'Both, really. Local news affects my daily life directly, but I like keeping an eye on world events to understand the bigger picture.' },
      { q: 'Do you think the news is always reliable?', sample: 'Not entirely. There’s a lot of misinformation around, so I try to check important stories against more than one trusted source.' },
      { q: 'Has the way people get news changed?', sample: 'Enormously. Most people now read short updates on social media instead of newspapers, which is convenient but can be shallow and one-sided.' },
    ],
  },
]

// ── EXTRA PART 2 cue cards (14 more → 30 total) ─────────────────────────────
export const EXTRA_CUE_CARDS: Part2Card[] = [
  {
    id: 'old-friend',
    title: 'Describe an old friend you got back in touch with',
    bullets: ['who this person is', 'how you originally knew them', 'how you got back in touch', 'and explain how you felt about it'],
    followUp: 'Why do people lose touch with friends over time?',
    theme: 'people',
    sample: 'I’d like to talk about a school friend called Daniyar, who I’d completely lost touch with after we left for different universities. We were inseparable as teenagers, but life simply pulled us in different directions. Then, a few months ago, he found me on a messaging app and sent a message out of the blue. We arranged to meet for coffee, and honestly, it was as if no time had passed at all — we slipped straight back into the same easy conversation and laughter. I felt genuinely happy, and a little reflective too, because it reminded me how easily good friendships can slip away if you don’t make the effort. Since then we’ve made a point of staying in regular contact.',
  },
  {
    id: 'meaningful-gift',
    title: 'Describe a gift you gave that was meaningful',
    bullets: ['what the gift was', 'who you gave it to', 'why you chose it', 'and explain why it was meaningful'],
    followUp: 'Do you think expensive gifts are always the best?',
    theme: 'experiences',
    sample: 'The gift I’d like to describe is a handmade photo album I put together for my mother on her fiftieth birthday. Rather than buying something expensive, I spent weeks collecting old family photographs, many of which she hadn’t seen in years, and arranging them with little notes beside each one. I chose it because she’s the kind of person who values memories far more than possessions. When she opened it, she was moved to tears, slowly turning each page and telling me the story behind every picture. It was meaningful precisely because it cost almost nothing but my time and thought — and that, I realised, was exactly what made it priceless to her. It taught me that the best gifts come from genuine attention rather than money.',
  },
  {
    id: 'clothing-item',
    title: 'Describe a piece of clothing you enjoy wearing',
    bullets: ['what it is', 'when you got it', 'when you wear it', 'and explain why you like it'],
    followUp: 'Do you think fashion is more important to young people?',
    theme: 'experiences',
    sample: 'I’d like to talk about an old leather jacket I bought a few years ago in a small second-hand shop while travelling. It’s worn in all the right places, which only adds to its character. I tend to wear it on cooler evenings out, whenever I want to feel a bit more put-together without making an effort. The reason I like it so much goes beyond how it looks. It’s comfortable and seems to go with everything, but more than that, it carries the memory of that trip and the version of me who found it. Clothes like that become a small part of your identity, and every time I put it on I feel a quiet boost of confidence.',
  },
  {
    id: 'busy-time',
    title: 'Describe a time when you were very busy',
    bullets: ['when it was', 'why you were so busy', 'how you managed', 'and explain how you felt afterwards'],
    followUp: 'Do you think people today are busier than in the past?',
    theme: 'experiences',
    sample: 'I’d like to describe the final few weeks of my last academic year, which were easily the busiest period I’ve experienced. I had three major deadlines, exam revision, and a part-time job all colliding at once. To cope, I became almost obsessive about planning: I broke everything into small daily tasks, blocked out my time hour by hour, and learned to say no to anything that wasn’t essential. There were certainly moments when it felt overwhelming, but seeing that to-do list shrink kept me going. When it was finally over and I handed in the last piece of work, I felt an enormous wave of relief and, honestly, real pride. It taught me that I can handle far more pressure than I’d believed, as long as I stay organised.',
  },
  {
    id: 'proud-photo',
    title: 'Describe a photograph you are proud of',
    bullets: ['what is in the photo', 'when and where you took it', 'why you took it', 'and explain why you are proud of it'],
    followUp: 'How has photography changed since smartphones became common?',
    theme: 'places',
    sample: 'The photograph I’d like to talk about is one I took at sunrise from the top of a mountain after an exhausting overnight hike. It shows the first light spilling over a sea of clouds below the peak, with a couple of tiny silhouettes of my friends in the foreground. I took it almost on instinct, fumbling with my phone because I was so struck by the scene. I’m proud of it for two reasons. First, technically it just came out beautifully — the colours and the composition worked perfectly by luck. But mainly I’m proud because of what it represents: the effort of that climb, and the fact that I pushed through tiredness to witness something genuinely breathtaking. It now hangs on my wall as a reminder that the best views usually come after the hardest climbs.',
  },
  {
    id: 'memorable-film',
    title: 'Describe a film that made an impression on you',
    bullets: ['what the film was', 'what it was about', 'when you watched it', 'and explain why it made an impression on you'],
    followUp: 'Do you think films can change the way people think?',
    theme: 'experiences',
    sample: 'I’d like to talk about a film I watched a couple of years ago about an elderly man who sets off on an unlikely journey to fulfil a promise. On the surface it’s a simple road story, but it’s really about regret, second chances and the relationships we neglect. I happened to watch it alone on a quiet evening, not expecting much. By the end I was completely absorbed, and it stayed with me for days. It made such an impression because it quietly forced me to think about my own priorities — about the people I should call more often and the things I keep postponing. A really good film does that: it entertains you in the moment but leaves you seeing your own life slightly differently afterwards.',
  },
  {
    id: 'sport-game',
    title: 'Describe a sport or game you enjoy playing',
    bullets: ['what it is', 'how you learned it', 'who you play it with', 'and explain why you enjoy it'],
    followUp: 'Why is it important for people to play sport?',
    theme: 'free time',
    sample: 'The sport I’d like to describe is table tennis, which I’ve loved since I was a teenager. I first learned it almost by accident at a youth club, where an older boy patiently taught me the basics, and I was instantly hooked by how fast and tactical it is. These days I play with a small group of friends a couple of evenings a week, and our matches are competitive but full of laughter. I enjoy it for several reasons. It’s wonderfully social, it sharpens your reflexes and concentration, and you can play it almost anywhere regardless of the weather. Most of all, those fast, intense rallies completely clear my mind — for those few minutes I’m thinking about nothing but the next shot, which is brilliantly refreshing after a day of work.',
  },
  {
    id: 'nature-place',
    title: 'Describe a place in nature you like to visit',
    bullets: ['where it is', 'how often you go there', 'what you do there', 'and explain why you like it'],
    followUp: 'Should governments do more to protect natural areas?',
    theme: 'places',
    sample: 'I’d like to describe a quiet lake set among hills a couple of hours from my city. It’s surrounded by pine forest, and the water is so still in the mornings that it mirrors the sky perfectly. I manage to go a few times a year, usually with friends or family for a day trip. When I’m there, I’ll walk around the shore, swim if it’s warm enough, and mostly just sit and take in the silence. The reason I love it is that it’s a complete antidote to city life — no traffic, no notifications, nothing but birdsong and open space. Spending even a single day there seems to reset my mind, and I always come home feeling calmer, clearer and genuinely grateful.',
  },
  {
    id: 'business-idea',
    title: 'Describe a small business you would like to start',
    bullets: ['what the business would be', 'where it would be', 'who your customers would be', 'and explain why you would like to start it'],
    followUp: 'What are the difficulties of running your own business?',
    theme: 'ambition',
    sample: 'The business I’d love to start is a small, cosy café that doubles as a quiet workspace. I picture it in a residential part of my city, away from the noisy centre, with comfortable seating, good coffee, fast internet and plenty of plants. My customers would mainly be students and remote workers — people who want somewhere calmer and more welcoming than a typical busy café to study or work for a few hours. I’d like to start it because I genuinely believe there’s a need for spaces like that, and because I love the idea of creating somewhere that becomes part of people’s daily routine. There’d be real challenges, of course, from finance to long hours, but building something of my own and seeing regulars enjoy it would make the risk worthwhile.',
  },
  {
    id: 'tradition',
    title: 'Describe a tradition or custom in your country',
    bullets: ['what the tradition is', 'when it takes place', 'what people do', 'and explain why it is important'],
    followUp: 'Do you think traditions will survive in the modern world?',
    theme: 'people',
    sample: 'I’d like to describe the custom of welcoming guests with bread and a generous spread of food, which is deeply rooted in my culture. It happens whenever someone visits a home, but especially during celebrations and family gatherings. The hosts will lay out far more food than anyone could eat, pour endless cups of tea, and insist that guests help themselves again and again — refusing simply isn’t an option. It’s important because hospitality is seen as a reflection of a family’s warmth and respect; turning a guest away, or feeding them poorly, would be almost unthinkable. I value this tradition because, in a fast and increasingly digital world, it preserves something genuinely human: the idea that opening your home and sharing a meal is one of the strongest ways to show that you care.',
  },
  {
    id: 'interesting-conversation',
    title: 'Describe an interesting conversation you had',
    bullets: ['who you talked to', 'where you were', 'what you talked about', 'and explain why it was interesting'],
    followUp: 'Is it easier to talk to strangers or people you know?',
    theme: 'experiences',
    sample: 'I’d like to talk about a conversation I had on a long train journey with an elderly stranger sitting opposite me. We started with the usual small talk about the weather, but it gradually deepened into a genuinely fascinating discussion. It turned out he had travelled and worked all over the world, and he began sharing stories about how much life had changed over his lifetime. What made it so interesting was the perspective he offered — he spoke about patience, about how people used to wait for letters that took weeks, and how the pace of everything has accelerated. I came away with a head full of ideas and a reminder that some of the best conversations happen by chance, with people you’ll probably never meet again. It genuinely changed how I think about technology and time.',
  },
  {
    id: 'public-place',
    title: 'Describe a public place you have visited',
    bullets: ['where it is', 'when you went there', 'what you did', 'and explain what you thought of it'],
    followUp: 'Why are public spaces important in a city?',
    theme: 'places',
    sample: 'I’d like to describe the central library in my city, which I visited regularly while preparing for important exams. It’s a beautiful, light-filled building with row upon row of books and quiet study areas overlooking a small garden. I’d usually arrive in the morning, find a desk by the window, and spend hours reading and taking notes, broken up by coffee in the café downstairs. I thought it was wonderful — and not just as a place to study. It’s completely free and open to everyone, from schoolchildren to pensioners, which I think is something special. A space like that gives people who don’t have a quiet home a place to learn and grow, and it quietly holds the community together. I always left feeling productive and oddly peaceful.',
  },
  {
    id: 'positive-change',
    title: 'Describe a positive change you made in your life',
    bullets: ['what the change was', 'why you made it', 'how you made it', 'and explain how it affected you'],
    followUp: 'Why do many people find it hard to change their habits?',
    theme: 'experiences',
    sample: 'The change I’d like to describe is the decision to start exercising every morning before anything else in my day. I made it because I’d fallen into a sluggish, unhealthy routine, often staying up too late and feeling tired and unfocused. Rather than attempting a dramatic overhaul, I started ridiculously small — just a fifteen-minute walk or a short workout — and gradually built it into a solid habit over a couple of months. The effect has been genuinely transformative. I have far more energy, my mood is noticeably steadier, and starting the day with a small win seems to set a positive tone for everything that follows. More than the physical benefits, it taught me that lasting change comes from tiny, consistent steps rather than grand intentions, and that lesson has spilled over into other areas of my life.',
  },
  {
    id: 'good-at-job',
    title: 'Describe a person who is very good at their job',
    bullets: ['who the person is', 'what their job is', 'how you know them', 'and explain why they are good at it'],
    followUp: 'What makes someone successful in their career?',
    theme: 'people',
    sample: 'I’d like to talk about my family doctor, who I genuinely consider a master of her profession. She’s a general practitioner I’ve been seeing for years, so I’ve come to know her well through countless appointments. What makes her so good isn’t only her medical knowledge, although that’s clearly excellent. It’s the way she treats people. She never rushes you, she listens carefully, and she explains complicated things in a way that’s calm and reassuring rather than frightening. She seems to understand that being unwell is stressful, and she treats the whole person, not just the symptoms. To me, that’s the mark of someone truly skilled at their job: combining real expertise with genuine care for the people they serve. She’s set a standard for professionalism that I try to apply in my own field.',
  },
]

// ── EXTRA PART 3 themes (20 more → 30 total) ────────────────────────────────
export const EXTRA_PART3_THEMES: Part3Theme[] = [
  {
    id: 'family-relationships',
    theme: 'Family & Relationships',
    questions: [
      { q: 'How have family roles changed in recent decades?', sample: 'They’ve become far more equal. In the past responsibilities were sharply divided by gender, whereas today both partners increasingly share earning, housework and raising children, which I think is a healthier and fairer arrangement.' },
      { q: 'Is it better for children to grow up in a large or small family?', sample: 'Both have advantages. A large family teaches sharing and resilience and is rarely lonely, while a smaller one often means more individual attention and resources. Ultimately the warmth of the relationships matters more than the size.' },
      { q: 'Why do some people choose to live far from their families?', sample: 'Usually it’s for work or study, since the best opportunities are often in big cities or abroad. Technology helps them stay connected, but it inevitably weakens the day-to-day closeness that comes from living nearby.' },
      { q: 'Should grandparents be involved in raising children?', sample: 'I think it’s valuable when possible. Grandparents offer experience, stability and a link to the past that parents can’t always provide. The key is supporting the parents rather than overriding them.' },
    ],
  },
  {
    id: 'media-news',
    theme: 'Media & News',
    questions: [
      { q: 'How has the way people consume news changed?', sample: 'It’s shifted dramatically from newspapers and scheduled broadcasts to a constant stream of short updates on phones. That’s far more convenient, but it also encourages skimming headlines rather than understanding stories in depth.' },
      { q: 'Is it a problem that so much news comes through social media?', sample: 'It’s a real concern. Social media spreads information instantly, but it also spreads misinformation just as fast, and its algorithms tend to show people only what they already agree with, which deepens division.' },
      { q: 'Should the news be more positive?', sample: 'There’s an argument for more balance, because a relentless focus on disasters can leave people anxious and hopeless. However, the role of the news is to report reality honestly, not to comfort people by hiding it.' },
      { q: 'How can people tell if news is trustworthy?', sample: 'The best approach is to check important stories against several reputable sources and to be sceptical of anything designed to provoke a strong emotional reaction. Media literacy is becoming an essential skill.' },
    ],
  },
  {
    id: 'money-spending',
    theme: 'Money & Spending',
    questions: [
      { q: 'Is it important to teach children about money?', sample: 'Absolutely. Understanding saving, budgeting and the value of money is one of the most practical life skills, yet it’s often neglected. Children who learn it early tend to avoid serious financial mistakes as adults.' },
      { q: 'Do you think people spend more than they used to?', sample: 'Generally yes. Easy credit, online shopping and constant advertising make it effortless to spend, and there’s strong social pressure to keep up with others, which encourages buying things people don’t really need.' },
      { q: 'Is saving money always a good thing?', sample: 'Saving is sensible and provides security, but it can be taken too far. Money is ultimately a tool, and spending sensibly on experiences, health or education can be a far better investment than simply hoarding it.' },
      { q: 'Does having more money make people happier?', sample: 'Up to a point, yes — it removes the stress of meeting basic needs. Beyond that, though, research suggests relationships, purpose and health matter far more to happiness than additional wealth.' },
    ],
  },
  {
    id: 'health-lifestyle',
    theme: 'Health & Lifestyle',
    questions: [
      { q: 'Why do many people live unhealthy lifestyles?', sample: 'Often it’s a mix of convenience and time pressure. Fast food is cheap and quick, modern jobs are sedentary, and busy schedules leave little energy for cooking or exercise, so unhealthy habits form almost by default.' },
      { q: 'Whose responsibility is public health — the individual or the government?', sample: 'It has to be shared. Individuals are responsible for their own choices, but governments shape the environment those choices are made in, through things like food regulation, sports facilities and health education.' },
      { q: 'How can people be encouraged to exercise more?', sample: 'Making it convenient and enjoyable is key — safe cycle lanes, accessible parks and affordable sports facilities all help. Framing exercise as something social and fun, rather than a chore, also makes a big difference.' },
      { q: 'Is mental health taken seriously enough today?', sample: 'It’s improving, with far more openness than a generation ago, but there’s still stigma and a shortage of support in many places. Treating mental health as seriously as physical health is essential.' },
    ],
  },
  {
    id: 'food-culture',
    theme: 'Food & Culture',
    questions: [
      { q: 'How important is food to a country’s culture?', sample: 'It’s central. Traditional dishes carry history and identity, and shared meals are how families and communities bond. You can learn an enormous amount about a culture simply through its food and the rituals around it.' },
      { q: 'Are traditional eating habits disappearing?', sample: 'To some extent. Busy lifestyles and the spread of fast food mean fewer people cook traditional dishes from scratch, but there’s also a growing movement to rediscover and protect local cuisine, which gives me hope.' },
      { q: 'Why has fast food become so popular?', sample: 'It’s cheap, quick and consistent, which suits busy modern life perfectly. Aggressive marketing and convenience have made it the default choice for many, even though most people know it isn’t the healthiest option.' },
      { q: 'Should governments discourage unhealthy eating?', sample: 'I think they have a legitimate role, through clear labelling, education and perhaps taxes on very unhealthy products. The aim should be to inform and nudge people, though, rather than to ban or lecture.' },
    ],
  },
  {
    id: 'art-creativity',
    theme: 'Art & Creativity',
    questions: [
      { q: 'Why is art important in society?', sample: 'Art expresses ideas and emotions that ordinary language can’t, and it helps a society reflect on itself. It also brings beauty and meaning into everyday life, which is easy to undervalue but genuinely important for wellbeing.' },
      { q: 'Should governments fund the arts?', sample: 'I believe they should, at least partly. Left entirely to the market, only commercially popular art survives, and much valuable culture would be lost. Public funding keeps the arts accessible to everyone, not just the wealthy.' },
      { q: 'Is creativity something people are born with or can learn?', sample: 'Both. Some people are naturally more imaginative, but creativity is largely a skill that grows with practice, curiosity and the freedom to experiment and fail, which is why education matters so much.' },
      { q: 'Will technology replace human artists?', sample: 'It will change how art is made and may automate some tasks, but I doubt it will replace artists. Art is about human experience and meaning, and audiences ultimately care about the person and story behind a work.' },
    ],
  },
  {
    id: 'sport-competition',
    theme: 'Sport & Competition',
    questions: [
      { q: 'Why do people enjoy watching sport?', sample: 'Sport offers drama, unpredictability and a sense of belonging. Supporting a team gives people a shared identity and emotional release, and watching elite athletes perform is genuinely inspiring and entertaining.' },
      { q: 'Is competition healthy for children?', sample: 'In moderation, yes. Healthy competition teaches effort, resilience and how to cope with losing. The danger is when winning is over-emphasised, which can damage confidence and make children afraid to take part at all.' },
      { q: 'Should top athletes be paid so much?', sample: 'It’s controversial. Their careers are short and they generate huge revenue, which justifies high pay to a degree. Still, the gap between their earnings and those of essential workers does raise uncomfortable questions about society’s priorities.' },
      { q: 'How does sport benefit a society?', sample: 'Beyond physical health, sport builds community, teaches teamwork and discipline, and can unite people across divisions. Major events also create a powerful sense of shared pride and identity.' },
    ],
  },
  {
    id: 'communication',
    theme: 'Communication & Language',
    questions: [
      { q: 'How has technology changed the way people communicate?', sample: 'It’s made communication instant and global, which is remarkable, but also more fragmented. We send quick messages constantly yet have fewer deep, face-to-face conversations, so the quantity has risen while the quality is sometimes lower.' },
      { q: 'Is it important for everyone to learn a second language?', sample: 'I’d say it’s increasingly valuable. A second language opens up career opportunities and cultures, and the process itself sharpens the mind. In a connected world, being able to communicate across borders is a real advantage.' },
      { q: 'Will some languages disappear in the future?', sample: 'Sadly, many smaller languages are already dying out as speakers shift to dominant global languages. That’s a real loss, because each language carries unique knowledge and identity, which is why preservation efforts matter.' },
      { q: 'Are communication skills as important as technical skills?', sample: 'In most jobs they’re just as important. You can be brilliant technically, but if you can’t explain your ideas, collaborate or listen well, your impact is limited. The two together are what make people truly effective.' },
    ],
  },
  {
    id: 'tradition-change',
    theme: 'Tradition & Change',
    questions: [
      { q: 'Why is it important to preserve traditions?', sample: 'Traditions give people a sense of identity and continuity, linking them to their ancestors and community. They carry values and wisdom across generations, and losing them can leave a society feeling rootless and disconnected.' },
      { q: 'Do you think globalisation threatens local cultures?', sample: 'It does pose a risk, as global brands and media can make cultures feel increasingly similar. However, globalisation also lets cultures share and celebrate their uniqueness more widely, so the picture isn’t entirely negative.' },
      { q: 'Should young people follow old customs?', sample: 'I think they should understand and respect them, but not feel trapped by them. The healthiest approach is to keep the customs that still hold meaning while letting outdated ones evolve or fade naturally.' },
      { q: 'How do societies balance tradition and progress?', sample: 'The best balance comes from being selective — embracing change that genuinely improves life while consciously protecting the traditions that give a community its character. It requires ongoing, thoughtful negotiation rather than choosing one extreme.' },
    ],
  },
  {
    id: 'housing-cities',
    theme: 'Housing & Cities',
    questions: [
      { q: 'Why are so many people moving to cities?', sample: 'Cities concentrate jobs, education, healthcare and entertainment, so they offer opportunities that rural areas often can’t. For young people especially, the energy and possibilities of city life are a powerful draw.' },
      { q: 'What problems does rapid urban growth cause?', sample: 'It strains housing, transport and services, driving up prices and creating congestion and pollution. If growth outpaces planning, you also get overcrowding and a widening gap between those who can afford the city and those who can’t.' },
      { q: 'What makes a city a good place to live?', sample: 'Affordable housing, efficient transport, green spaces and a sense of safety and community. A truly liveable city meets people’s practical needs while still leaving room to relax and connect with others.' },
      { q: 'Should governments control where people can live?', sample: 'Heavy control feels wrong in a free society, but governments can shape things sensibly through planning and investment — for instance, by developing smaller towns so that not everyone is forced into a few overcrowded cities.' },
    ],
  },
  {
    id: 'wildlife-nature',
    theme: 'Wildlife & Nature',
    questions: [
      { q: 'Why is it important to protect wild animals?', sample: 'Beyond their right to exist, wild animals are vital parts of ecosystems that we ultimately depend on for things like clean air, water and food. Losing them can trigger damage that’s impossible to reverse.' },
      { q: 'Whose responsibility is conservation?', sample: 'It’s genuinely everyone’s, but the heaviest responsibility lies with governments and large companies, since they control policy and industry. Individuals matter too, through their choices and by pressuring those in power to act.' },
      { q: 'Do zoos play a useful role?', sample: 'Good modern zoos do — they support breeding programmes for endangered species and educate the public, which builds support for conservation. The concern is older zoos that keep animals in poor conditions purely for entertainment.' },
      { q: 'How can ordinary people help protect nature?', sample: 'By reducing waste and consumption, supporting responsible businesses, and getting involved locally, whether that’s planting trees or cleaning up green spaces. Collectively, those small actions add up and shift what’s considered normal.' },
    ],
  },
  {
    id: 'consumerism',
    theme: 'Shopping & Consumerism',
    questions: [
      { q: 'Why do people buy things they don’t need?', sample: 'A lot of it is emotional rather than practical. Advertising links products to status and happiness, shopping can be a way to relieve boredom or stress, and easy online buying removes the friction that once made us pause.' },
      { q: 'Is online shopping a positive development?', sample: 'It’s largely positive — it’s convenient, offers huge choice and lets people compare prices easily. The downsides are its impact on traditional shops and the environmental cost of constant deliveries and returns.' },
      { q: 'Should people consume less?', sample: 'I think many of us should, both for our finances and for the planet. The throwaway culture of buying cheap things and quickly discarding them is unsustainable, and a shift towards fewer, better-quality goods would benefit everyone.' },
      { q: 'How does advertising affect society?', sample: 'It informs people about products, but it also shapes desires and values, often making people feel dissatisfied with what they have. Its influence is so powerful that I think it needs sensible limits, especially around children.' },
    ],
  },
  {
    id: 'community-society',
    theme: 'Community & Society',
    questions: [
      { q: 'Is a sense of community weaker than it used to be?', sample: 'In many places, yes. People move more often, work longer hours and socialise online, so they know their neighbours less well. That said, communities still form around shared interests, just in different ways than before.' },
      { q: 'How can people be encouraged to help their communities?', sample: 'Making it easy and visible helps — local events, volunteering schemes and shared spaces all give people a reason to get involved. People are generally willing to help; they often just need the opportunity and a small nudge.' },
      { q: 'Do you think people are more selfish today?', sample: 'I’m not convinced they are at heart, but modern life can encourage individualism. When people are stressed and time-poor, they naturally focus inward, even though most still respond generously when others genuinely need help.' },
      { q: 'What role do older people play in society?', sample: 'A vital one. They pass on experience, skills and history, often hold families and communities together, and contribute enormously through caring and volunteering. Societies that value their older members tend to be stronger and wiser.' },
    ],
  },
  {
    id: 'wellbeing-happiness',
    theme: 'Wellbeing & Happiness',
    questions: [
      { q: 'What makes people happy?', sample: 'Research consistently points to relationships, good health, a sense of purpose and a degree of autonomy over your life — far more than money or possessions once basic needs are met. Happiness is built on connection and meaning.' },
      { q: 'Is modern life more stressful than in the past?', sample: 'In some ways, yes. The pace is faster, we’re always reachable, and there’s constant pressure to keep up. On the other hand, we enjoy comforts and freedoms previous generations could only dream of, so it’s a trade-off.' },
      { q: 'Can governments do anything to improve people’s happiness?', sample: 'They can, by securing the foundations of wellbeing — good healthcare, education, job security and green public spaces. They can’t manufacture happiness, but they can remove many of the stresses that undermine it.' },
      { q: 'Why do some wealthy people seem unhappy?', sample: 'Because wealth doesn’t address the deeper drivers of happiness, like meaningful relationships and purpose. People can also fall into endless comparison, always wanting more, which makes contentment surprisingly hard to reach regardless of income.' },
    ],
  },
  {
    id: 'science-progress',
    theme: 'Science & Progress',
    questions: [
      { q: 'Has scientific progress always improved people’s lives?', sample: 'Overwhelmingly it has, through medicine, communication and a higher standard of living. But progress has a darker side too — pollution and powerful weapons, for example — so the benefits depend on how wisely we choose to use it.' },
      { q: 'Should governments invest more in science?', sample: 'I think they should. Many of the biggest challenges we face, from disease to climate change, can only be solved through research. Science is also a long-term investment that drives the economy and improves life for future generations.' },
      { q: 'Are people too dependent on technology?', sample: 'In some respects, yes. We’ve outsourced memory, navigation and even social interaction to devices, which is convenient but leaves us vulnerable and can erode basic skills. The aim should be to use technology as a tool, not a crutch.' },
      { q: 'Should there be limits on scientific research?', sample: 'Some limits are wise, particularly in sensitive areas like genetics or artificial intelligence, where the consequences could be serious and irreversible. The challenge is regulating responsibly without stifling the curiosity that drives progress.' },
    ],
  },
  {
    id: 'globalisation',
    theme: 'Globalisation & Culture',
    questions: [
      { q: 'What are the main benefits of globalisation?', sample: 'It has lifted millions out of poverty, spread knowledge and technology, and let people experience other cultures, foods and ideas as never before. Economically and culturally, the world is far more connected and, in many ways, richer for it.' },
      { q: 'Does globalisation make cultures too similar?', sample: 'There’s a real risk of that, as global brands and media dominate and local distinctiveness fades. At the same time, globalisation lets minority cultures reach wider audiences, so it both threatens and spreads cultural diversity.' },
      { q: 'Is English becoming too dominant?', sample: 'It’s undeniably dominant, which is convenient as a shared global language but does put pressure on others. The ideal is for English to act as a useful bridge while people continue to value and protect their own languages.' },
      { q: 'Do the benefits of globalisation outweigh the drawbacks?', sample: 'On balance I think they do, given the gains in prosperity and understanding. But the benefits are unevenly shared, so the real task is managing globalisation so that more people benefit and fewer are left behind.' },
    ],
  },
  {
    id: 'growing-up',
    theme: 'Childhood & Growing Up',
    questions: [
      { q: 'How is childhood today different from the past?', sample: 'Children today grow up surrounded by technology and structured activities, with less unsupervised outdoor play than previous generations. They have more information and opportunities, but arguably less freedom and a faster, more pressured pace of life.' },
      { q: 'Do children grow up too quickly now?', sample: 'In some ways they do. Exposure to social media and adult content online means they encounter grown-up pressures earlier, and the competitiveness around school can rob them of some of the carefree quality childhood should have.' },
      { q: 'What is the best age to start school?', sample: 'There’s good evidence that very early formal schooling isn’t necessarily better, and that play is how young children learn best. Starting structured academics around six or seven, after plenty of play-based learning, seems sensible to me.' },
      { q: 'How much freedom should children be given?', sample: 'They need a careful balance — enough freedom to explore, make mistakes and build independence, but within safe boundaries. Over-protecting children can leave them anxious and unprepared for the real world.' },
    ],
  },
  {
    id: 'leadership',
    theme: 'Leadership & Society',
    questions: [
      { q: 'What qualities make a good leader?', sample: 'A good leader combines a clear vision with integrity and genuine empathy. They listen, take responsibility for mistakes, and bring out the best in others rather than simply giving orders. Trust, in the end, is what real leadership is built on.' },
      { q: 'Are leaders born or made?', sample: 'Mostly made, in my view. Some people have natural confidence, but the core skills of leadership — communication, judgement, emotional intelligence — are developed through experience, mentoring and learning from failure.' },
      { q: 'Should young people be given leadership roles?', sample: 'I think so, with support. Young people bring fresh energy and ideas, and giving them responsibility early helps them grow. Pairing their enthusiasm with the guidance of experienced mentors usually produces the best results.' },
      { q: 'Why do people lose trust in their leaders?', sample: 'Usually because of broken promises, dishonesty, or a sense that leaders serve themselves rather than the people. Once trust is lost it’s extremely hard to rebuild, which is why consistency and honesty matter so much.' },
    ],
  },
  {
    id: 'transport-future',
    theme: 'Transport & the Future',
    questions: [
      { q: 'How can cities reduce traffic problems?', sample: 'The most effective approach is making good public transport, cycling and walking genuinely convenient, so people don’t feel they need a car. Measures like congestion charges and car-free zones also help, provided alternatives are in place.' },
      { q: 'Will electric and self-driving cars change cities?', sample: 'Potentially a great deal. Electric vehicles would cut pollution significantly, and self-driving cars could improve safety and free up space currently used for parking, though they also raise tricky questions about jobs and regulation.' },
      { q: 'Should governments discourage car use?', sample: 'Gently, yes, given the environmental and health costs. The fair way is to invest heavily in attractive alternatives first, so that leaving the car at home becomes the easy, sensible choice rather than a sacrifice.' },
      { q: 'How might we travel in the future?', sample: 'I imagine cleaner, more connected and increasingly automated transport — widespread electric vehicles, smarter public systems, and perhaps more remote working that reduces the need to travel at all. The direction is towards efficiency and lower emissions.' },
    ],
  },
  {
    id: 'future-of-work',
    theme: 'The Future of Work',
    questions: [
      { q: 'How is technology changing the workplace?', sample: 'It’s automating routine tasks, enabling remote work, and demanding new digital skills. This makes many jobs more flexible and efficient, but it also means workers must keep learning constantly to stay relevant.' },
      { q: 'Will automation cause widespread unemployment?', sample: 'It will certainly displace some jobs, particularly repetitive ones, but history suggests it also creates entirely new roles we can’t yet imagine. The real challenge is helping people reskill quickly enough to make that transition.' },
      { q: 'Is working from home a good thing?', sample: 'For many it’s been positive — it saves commuting time and offers flexibility and autonomy. The downsides are isolation and a blurred line between work and home life, so a hybrid model often works best.' },
      { q: 'What skills will be most valuable in the future?', sample: 'Adaptability and the ability to keep learning will be crucial, alongside distinctly human strengths like creativity, communication and emotional intelligence — precisely the things machines find hardest to replicate.' },
    ],
  },
]
