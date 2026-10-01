import type { Part1Topic, Part2Card, Part3Theme } from './ieltsSpeakingBank'

// Full Mocks 21–30 follow the ten topics supplied by the user. The source lists
// more possible prompts than one sitting needs; each mock uses four Part 1
// questions, one four-point cue card and four related Part 3 questions.
export const MOCK_21_TO_30_PART1: Part1Topic[] = [
  { id: 'm21-animals', topic: 'Animals', icon: '🐾', questions: [
    { q: 'What is a popular pet in your country?', sample: 'Cats and dogs are both common, but cats are particularly popular in cities because they adapt well to smaller homes.' },
    { q: 'What problems do people have with pets?', sample: 'The main challenge is finding enough time for daily care, especially when a pet needs exercise or regular veterinary visits.' },
    { q: 'Have you ever seen a wild animal?', sample: 'Yes, I once saw a fox at the edge of a forest. I kept my distance and watched it disappear into the trees.' },
    { q: 'Are there many wild animals in your country?', sample: 'There is a surprising variety in the mountains and rural areas, although people in cities rarely encounter them.' },
  ] },
  { id: 'm22-art', topic: 'Art', icon: '🎨', questions: [
    { q: 'What kind of art do you enjoy?', sample: 'I enjoy landscape paintings because they can capture the atmosphere of a place as well as its appearance.' },
    { q: 'Do you have any paintings or pictures on your walls at home?', sample: 'Yes, I have a landscape print above my desk. It makes the room feel more personal.' },
    { q: 'Can you draw or paint?', sample: 'I can make a simple sketch, but I need a lot more practice before I could call myself a painter.' },
    { q: 'Do you like visiting museums or art galleries?', sample: 'I do. Seeing a work in person lets me notice its scale and texture in a way a screen cannot.' },
  ] },
  { id: 'm23-apps', topic: 'Apps', icon: '📱', questions: [
    { q: 'Do you often use apps?', sample: 'Yes, several times a day. I mainly use them for messages, travel information and organising my tasks.' },
    { q: 'What are the most popular apps in your country?', sample: 'Messaging and payment apps seem especially popular because people use them for everyday plans and purchases.' },
    { q: 'Would you ever spend money on an app?', sample: 'I would pay for one that saves me time or helps me learn, provided I can try it before subscribing.' },
    { q: 'Have you ever deleted an app?', sample: 'Yes. I removed a game when I realised I was opening it out of habit rather than enjoying it.' },
  ] },
  { id: 'm24-books', topic: 'Books', icon: '📚', questions: [
    { q: 'Do you ever read e-books?', sample: 'Yes, particularly while travelling. They let me carry several books without adding weight to my bag.' },
    { q: 'What children’s story is popular in your country?', sample: 'A traditional tale about a clever child is widely known. Families often retell it in their own words.' },
    { q: 'What type of books are most popular in your country?', sample: 'Fiction and practical self-improvement books both seem popular, judging by what local bookshops display.' },
    { q: 'What other reading materials do you enjoy?', sample: 'I like long magazine articles about science and history because they explore one subject in more depth than a short post.' },
  ] },
  { id: 'm25-buildings', topic: 'Buildings', icon: '🏛️', questions: [
    { q: 'Are there many old buildings where you live?', sample: 'A few historic buildings remain in the centre, though most streets have been redeveloped over time.' },
    { q: 'Is there a building in a foreign country you would like to visit?', sample: 'I would like to see a historic library abroad because its architecture and collection would tell two different stories.' },
    { q: 'Did you ever visit a historical building when you were at school?', sample: 'Yes, our class visited an old fortress. Walking through it made the history lesson much easier to imagine.' },
    { q: 'Would you like to live in an old or modern house?', sample: 'I would choose a modern house for its comfort, although I admire the character of older homes.' },
  ] },
  { id: 'm26-challenges', topic: 'Challenges', icon: '🧗', questions: [
    { q: 'When was the last time you tried something new?', sample: 'I tried a climbing class recently. I was nervous at first, but learning the basic moves was rewarding.' },
    { q: 'Do you enjoy stepping out of your comfort zone?', sample: 'Sometimes. I prefer a manageable challenge that teaches me something over taking a risk just for excitement.' },
    { q: 'What did you find most challenging at school?', sample: 'Speaking in front of the class was hardest for me, although regular presentations gradually helped.' },
    { q: 'When was the last time you found something too difficult?', sample: 'A complicated recipe defeated me last month. I simplified it and tried again the next day.' },
  ] },
  { id: 'm27-clothes', topic: 'Clothes', icon: '👕', questions: [
    { q: 'When was the last time you bought an item of clothing?', sample: 'I bought a light jacket a few weeks ago because my old one had worn out.' },
    { q: 'Did you wear a school uniform as a child?', sample: 'Yes. It made getting ready in the morning simple, although I sometimes wished I could choose my own clothes.' },
    { q: 'Do you have any traditional clothes?', sample: 'I have an outfit for family celebrations. I do not wear it often, but it connects me with local customs.' },
    { q: 'What kind of bag do you often use?', sample: 'I usually carry a small backpack because it keeps my hands free and has room for a book and water.' },
  ] },
  { id: 'm28-confidence', topic: 'Confidence', icon: '✨', questions: [
    { q: 'Would you describe yourself as a confident person?', sample: 'I am confident in familiar situations, but I still get nervous when I have to speak to a large group.' },
    { q: 'Were you a confident child?', sample: 'Not particularly. I was quiet at first, though I became more comfortable once I knew the people around me.' },
    { q: 'What made you nervous as a child at school?', sample: 'Being asked to answer without preparation made me nervous because I worried about making a mistake.' },
    { q: 'What do you do to help you build confidence?', sample: 'I prepare carefully and set small goals. Each time I manage one, the next task feels less intimidating.' },
  ] },
  { id: 'm29-education', topic: 'Education', icon: '🎓', questions: [
    { q: 'Did you enjoy school as a child?', sample: 'Mostly, yes. I enjoyed learning new things and spending time with classmates, even when some lessons were demanding.' },
    { q: 'What was your favourite subject?', sample: 'History was my favourite because the teacher connected past events to places we knew.' },
    { q: 'Did you ever do any extra-curricular activities?', sample: 'I joined a debate club for a year. It helped me organise my thoughts and listen to other views.' },
    { q: 'Are you currently learning anything new?', sample: 'I am learning basic photography. Practising with ordinary scenes has taught me to notice light more carefully.' },
  ] },
  { id: 'm30-food', topic: 'Food', icon: '🍲', questions: [
    { q: 'What’s your favourite meal of the day?', sample: 'Dinner is my favourite because I can slow down and talk with my family after a busy day.' },
    { q: 'Were you a fussy eater when you were younger?', sample: 'A little. I avoided vegetables with strong flavours, but I enjoy most of them now.' },
    { q: 'When was the last time you tried a new dish?', sample: 'I tried a spicy noodle dish at a small restaurant last weekend and liked its balance of flavours.' },
    { q: 'Do you ever skip meals?', sample: 'I try not to, because I find it harder to concentrate when I have not eaten properly.' },
  ] },
]

export const MOCK_21_TO_30_PART2: Part2Card[] = [
  { id: 'm21-interesting-animal', title: 'Describe an interesting animal', bullets: ['what it is', 'where it lives', 'where you first saw it', 'and explain why you find it interesting'], followUp: 'Would you like to see this animal again?', theme: 'Animals', sample: 'I find the snow leopard fascinating. It lives in high mountain regions, and I first saw one in a wildlife documentary. Its thick fur and long tail help it survive in a harsh climate, while its ability to move quietly across steep rocks is remarkable. I would love to see one from a safe distance in its natural habitat.' },
  { id: 'm22-work-of-art', title: 'Describe a work of art you like', bullets: ['what it is', 'where you saw it', 'what it shows', 'and explain why you like it'], followUp: 'Would you like to own a copy of this work?', theme: 'Art', sample: 'I like a large landscape painting in a local gallery. It shows a quiet street just after rain, with reflections from the shop lights on the pavement. I first noticed it during a school visit. The artist made an ordinary scene feel calm and memorable, and each time I see it I notice a different detail.' },
  { id: 'm23-useful-app', title: 'Describe a useful app', bullets: ['what it is', 'how you heard about it', 'what it does', 'and explain why you find it useful'], followUp: 'Would you recommend this app to someone else?', theme: 'Apps', sample: 'A friend recommended a public transport app when I started commuting across the city. It shows routes, live arrival times and service changes. I use it before leaving home so I can choose the quickest connection. It is useful because it removes much of the uncertainty from a journey, especially when a bus is delayed.' },
  { id: 'm24-childhood-story', title: 'Describe a childhood story you enjoyed', bullets: ['what type of story it was', 'which characters were in it', 'what happened in the story', 'and explain why you enjoyed it'], followUp: 'Would you tell this story to a child today?', theme: 'Books', sample: 'My grandmother used to tell me a folk story about a child who outsmarted a greedy merchant. The child solved a riddle and helped the villagers keep their harvest. I enjoyed the clever ending, but I remember my grandmother’s lively way of telling it even more. It made me look forward to reading other stories.' },
  { id: 'm25-historical-building', title: 'Describe a historical building in your country', bullets: ['where it is', 'what it looks like', 'what it is used for today', 'and explain why you think it is important'], followUp: 'Would you take a visitor to this building?', theme: 'Buildings', sample: 'An old observatory in my country is a building I would choose. It has a modest entrance and a large dome that stands above the surrounding streets. Today it welcomes visitors and hosts exhibitions about astronomy. I think it matters because it preserves both the architecture and the history of scientific work carried out there.' },
  { id: 'm26-adventurous-person', title: 'Describe someone who is adventurous', bullets: ['who the person is', 'how you know them', 'what they enjoy doing', 'and explain why you consider them adventurous'], followUp: 'Would you join this person on an adventure?', theme: 'Challenges', sample: 'My cousin enjoys taking on activities she has never tried before, from hiking new trails to learning to sail. I have known her all my life, and I admire how thoroughly she prepares before going somewhere unfamiliar. She is adventurous because she is willing to face uncertainty and learn from the experience, rather than simply seeking a thrill.' },
  { id: 'm27-useful-bag', title: 'Describe a useful bag you own', bullets: ['what kind of bag it is', 'what it looks like', 'what you use it for', 'and explain why you find it useful'], followUp: 'Would you buy the same bag again?', theme: 'Clothes and accessories', sample: 'I own a simple dark backpack with a padded section for my laptop. I bought it before starting a new course and use it almost every day. Its pockets keep small items easy to find, and the straps are comfortable on longer walks. I value it for its practical design rather than its brand.' },
  { id: 'm28-confident-person', title: 'Describe a person you know who is confident', bullets: ['who they are', 'how you know them', 'what they are like', 'and explain why you think they are confident'], followUp: 'Has this person influenced your confidence?', theme: 'Confidence', sample: 'My former colleague speaks calmly even when a meeting becomes difficult. I worked with her for two years and saw how she listened before offering a clear view. She is friendly and well prepared, but she is also willing to admit when she does not know something. That honesty makes her confidence seem grounded rather than boastful.' },
  { id: 'm29-favourite-subject', title: 'Describe a subject you enjoyed at school', bullets: ['what it was', 'who taught you', 'what you learned', 'and explain why you enjoyed it'], followUp: 'Would you study this subject again?', theme: 'Education', sample: 'Geography was a subject I enjoyed at school. Our teacher used maps and local examples to explain how landscapes and cities change. We studied rivers, climates and how people adapt to their surroundings. I liked it because each lesson helped me understand a real place, rather than just remember a set of facts.' },
  { id: 'm30-foreign-food', title: 'Describe a foreign food you would like to try', bullets: ['what it is', 'where it comes from', 'how you heard about it', 'and explain why you would like to try it'], followUp: 'Would you try making this food at home?', theme: 'Food', sample: 'I would like to try a traditional Ethiopian meal served with injera. I learned about it from a friend who described the soft flatbread and the shared dishes eaten with it. I am curious about the different spices and the way the meal brings people around one table. I would prefer to try it first at a restaurant that prepares it traditionally.' },
]

export const MOCK_21_TO_30_PART3: Part3Theme[] = [
  { id: 'm21-animals-discussion', theme: 'Animals and conservation', questions: [
    { q: 'How can elderly people benefit from having a pet?', sample: 'A pet can provide companionship and a daily routine, although the person needs support if caring for it becomes physically difficult.' },
    { q: 'Should the government protect wild animals?', sample: 'Yes. Protecting habitats and enforcing wildlife laws help species survive when private decisions alone would not be enough.' },
    { q: 'Why are some animals endangered?', sample: 'Habitat loss, pollution and illegal hunting are major causes, and climate change adds pressure to species with narrow ranges.' },
    { q: 'What are the advantages and disadvantages of zoos?', sample: 'Good zoos can support research and conservation, but keeping wild animals in limited spaces raises serious welfare concerns.' },
  ] },
  { id: 'm22-art-discussion', theme: 'Art in society', questions: [
    { q: 'What role does art play in society?', sample: 'Art helps people express experiences, preserve cultural memory and see familiar issues from a new perspective.' },
    { q: 'What role do museums and galleries play?', sample: 'They preserve works, make them accessible to the public and provide context that helps visitors understand them.' },
    { q: 'How can children benefit from art?', sample: 'Making and discussing art gives children a way to experiment, express feelings and pay attention to detail.' },
    { q: 'Should the government support the arts?', sample: 'I think so, especially where funding gives schools and communities access to work they could not otherwise afford.' },
  ] },
  { id: 'm23-apps-discussion', theme: 'Apps and everyday life', questions: [
    { q: 'Are apps useful or are they a distraction?', sample: 'They can be either. Their value depends on the task they support and whether people can control the time they spend on them.' },
    { q: 'How do people stop themselves getting distracted by apps on their phone?', sample: 'Turning off unnecessary notifications and setting specific times to check an app can make a real difference.' },
    { q: 'Why do older people sometimes struggle with apps?', sample: 'Unfamiliar layouts and frequent updates can be confusing, particularly when instructions assume prior experience.' },
    { q: 'How do you think apps will develop in the future?', sample: 'They will probably become more personalised, but developers will need to make privacy choices clearer to users.' },
  ] },
  { id: 'm24-books-discussion', theme: 'Books and children', questions: [
    { q: 'What do children gain from reading books?', sample: 'Books introduce new words and ideas, while stories let children imagine how other people experience the world.' },
    { q: 'How can children be encouraged to read more?', sample: 'Giving them a choice of enjoyable books and making time to read together works better than treating reading as a punishment.' },
    { q: 'Why do some adults read children’s books?', sample: 'Some read them with young relatives, while others appreciate the storytelling or return to books they loved earlier.' },
    { q: 'How do people’s reading tastes differ as they grow older?', sample: 'Their interests often broaden with experience, though a favourite genre from childhood can remain appealing.' },
  ] },
  { id: 'm25-buildings-discussion', theme: 'Historical buildings', questions: [
    { q: 'Do you think it is important to conserve all old buildings?', sample: 'It is important to assess their historical value and condition, since preserving every structure may be impossible.' },
    { q: 'Why do people enjoy visiting historical buildings?', sample: 'They offer a physical connection to the past and show how people once lived, worked or designed public spaces.' },
    { q: 'Can people learn things from old buildings?', sample: 'Yes. Their materials and layout can reveal the skills, needs and values of the period in which they were built.' },
    { q: 'Do you think old buildings attract tourists? Why?', sample: 'They often do, because distinctive architecture and the stories behind it give visitors a reason to explore a place.' },
  ] },
  { id: 'm26-challenges-discussion', theme: 'Challenges and resilience', questions: [
    { q: 'Why do some people relish a challenge?', sample: 'They may enjoy testing their abilities and feel a strong sense of progress when they master something difficult.' },
    { q: 'Why do some people avoid challenges?', sample: 'Fear of failure or a lack of time and support can make a new task feel more threatening than rewarding.' },
    { q: 'Should we protect children from difficult situations?', sample: 'Children need protection from harm, but age-appropriate difficulties can help them learn to solve problems.' },
    { q: 'What skills can help people face difficult times?', sample: 'Planning, asking for help and adjusting expectations are useful skills when a first approach does not work.' },
  ] },
  { id: 'm27-clothes-discussion', theme: 'Clothing and fashion', questions: [
    { q: 'Do you think fashion is important?', sample: 'It can be a way to express identity, although comfort and affordability matter more to many people.' },
    { q: 'Can you tell a lot about a person from what they wear?', sample: 'Clothes may hint at a situation or preference, but they rarely tell us much about a person’s character.' },
    { q: 'What traditional clothes are there in your country?', sample: 'There are embroidered garments worn at celebrations, with patterns and materials that vary by region.' },
    { q: 'How have clothing trends changed over the last few decades?', sample: 'Everyday styles have become more casual, and social media has made trends spread much faster.' },
  ] },
  { id: 'm28-confidence-discussion', theme: 'Building confidence', questions: [
    { q: 'Why is confidence important?', sample: 'It helps people share ideas and attempt unfamiliar tasks, even when success is not guaranteed.' },
    { q: 'How can people develop confidence?', sample: 'Preparation and gradual practice help, especially when people reflect on progress rather than expect immediate perfection.' },
    { q: 'Can someone ever be over-confident?', sample: 'Yes. If confidence stops a person from listening to evidence or advice, it can lead to poor decisions.' },
    { q: 'Do you think social media makes people more or less confident?', sample: 'It can provide encouragement, but constant comparison with carefully selected images may undermine confidence.' },
  ] },
  { id: 'm29-education-discussion', theme: 'Schools and learning', questions: [
    { q: 'Do you think education in schools has changed a lot in the last few decades?', sample: 'Technology has changed access to materials and assignments, while many schools now give more attention to discussion and projects.' },
    { q: 'How could teachers in schools improve their lessons?', sample: 'They can use clear examples, invite questions and check whether students can apply an idea rather than repeat it.' },
    { q: 'Do you think parents sometimes pressure their children to learn too much?', sample: 'Some do. Encouragement is valuable, but children also need rest and space to develop their own interests.' },
    { q: 'What makes a good teacher?', sample: 'A good teacher understands the subject, explains it patiently and adapts when students are struggling.' },
  ] },
  { id: 'm30-food-discussion', theme: 'Food and society', questions: [
    { q: 'Do you think food plays an important role in society?', sample: 'Yes. Shared meals bring people together, and recipes can carry family and cultural traditions across generations.' },
    { q: 'How has popular food changed in your country over the last few decades?', sample: 'People have more access to international dishes now, although traditional meals remain popular at home and celebrations.' },
    { q: 'Do schools in your country provide children with healthy meals?', sample: 'Provision varies, but a healthy meal should include a balance of vegetables, protein and filling staple foods.' },
    { q: 'What is a balanced diet?', sample: 'It is a varied pattern of eating that provides enough nutrients and energy without relying too heavily on one food group.' },
  ] },
]
