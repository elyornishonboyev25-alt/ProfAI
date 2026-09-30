import type { Part1Topic, Part2Card, Part3Theme } from './ieltsSpeakingBank'

// Original exam-style material reserved for full mocks 21–30. The questions
// and model answers are written for this app; they are not past IELTS papers.
export const MOCK_21_TO_30_PART1: Part1Topic[] = [
  { id: 'm21-puzzles', topic: 'Puzzles', icon: '🧩', questions: [
    { q: 'Did you enjoy doing puzzles when you were a child?', sample: 'Yes. I used to do jigsaws with my grandfather, and finishing one felt like a small achievement.' },
    { q: 'What kinds of puzzles do you do nowadays?', sample: 'I sometimes solve word puzzles on the train because they help me pass the time without scrolling through my phone.' },
    { q: 'Do you prefer solving a puzzle alone or with other people?', sample: 'I prefer working alone at first, though it is fun to compare ideas with a friend when I get stuck.' },
    { q: 'Would you give a puzzle as a present?', sample: 'I would, if I knew the person liked a challenge. It feels more thoughtful than buying something generic.' },
  ] },
  { id: 'm22-museums', topic: 'Museums', icon: '🏛️', questions: [
    { q: 'When did you last visit a museum?', sample: 'I visited a local history museum a few months ago and spent most of the afternoon looking at old photographs.' },
    { q: 'What do you usually look at first in a museum?', sample: 'I read the introductory display first. It gives me enough context to understand the objects that follow.' },
    { q: 'Are museums popular with young people where you live?', sample: 'Some are, especially when they run interactive exhibitions, although many young people still see them as school trip destinations.' },
    { q: 'Is there a museum you would like to visit?', sample: 'I would love to visit a science museum with working demonstrations, as I learn more easily by seeing an idea in action.' },
  ] },
  { id: 'm23-houseplants', topic: 'Houseplants', icon: '🪴', questions: [
    { q: 'Do you keep any plants inside your home?', sample: 'I keep a few small plants on the windowsill. They make the room feel more welcoming.' },
    { q: 'How did you learn to look after plants?', sample: 'My aunt gave me some basic advice, and after that I learned by observing which spots had enough light.' },
    { q: 'Have you ever given someone a plant?', sample: 'Yes, I gave a friend a small herb plant when she moved into a new flat because she enjoys cooking.' },
    { q: 'Would you like to grow more plants in the future?', sample: 'Definitely. If I had a balcony, I would try growing tomatoes and herbs in containers.' },
  ] },
  { id: 'm24-stationery', topic: 'Pens and stationery', icon: '✏️', questions: [
    { q: 'What do you normally use to write a quick note?', sample: 'I usually use a pen and a small notebook because I can find the note quickly later.' },
    { q: 'Do you enjoy buying stationery?', sample: 'Occasionally. A good notebook is pleasant to use, but I try to finish the ones I already own first.' },
    { q: 'Did you use a lot of stationery at school?', sample: 'Yes, particularly coloured pens for diagrams. They helped me organise information when I was revising.' },
    { q: 'Is handwriting still useful to you?', sample: 'It is useful for planning. Writing an idea by hand often makes it easier for me to remember.' },
  ] },
  { id: 'm25-bridges', topic: 'Bridges', icon: '🌉', questions: [
    { q: 'Is there a bridge near where you live?', sample: 'There is a pedestrian bridge over a busy road near my neighbourhood, and I use it quite often.' },
    { q: 'Do you notice the design of bridges?', sample: 'I do when a bridge has an unusual shape. It is interesting to see how a practical structure can also look elegant.' },
    { q: 'Have you ever crossed a very long bridge?', sample: 'I crossed one while travelling by train. The view over the river was memorable, even though the journey lasted only a minute.' },
    { q: 'Would you like to walk across a famous bridge?', sample: 'Yes. Walking would give me time to appreciate the view and the details of its construction.' },
  ] },
  { id: 'm26-queues', topic: 'Waiting in queues', icon: '⌛', questions: [
    { q: 'Where do you most often have to wait in a queue?', sample: 'Usually at the supermarket after work, when many other people are shopping at the same time.' },
    { q: 'What do you do while you are waiting?', sample: 'I check my shopping list or listen to a short podcast if the queue is moving slowly.' },
    { q: 'Are you patient when you have to wait?', sample: 'Most of the time, yes. I get impatient only when nobody explains the cause of a long delay.' },
    { q: 'Have queues changed in your area in recent years?', sample: 'Digital booking has reduced queues at some offices, though busy shops still have them.' },
  ] },
  { id: 'm27-maps', topic: 'Maps', icon: '🗺️', questions: [
    { q: 'When did you last use a map?', sample: 'I used one last weekend to find a walking route through an unfamiliar part of the city.' },
    { q: 'Do you find paper maps easy to read?', sample: 'Generally, yes, although it takes me a moment to work out which direction I am facing.' },
    { q: 'Did anyone teach you how to read a map?', sample: 'My father showed me how to use a scale and a compass on a family hike.' },
    { q: 'Would you rely on a map when visiting a new city?', sample: 'Certainly. It helps me plan the day and notice places that I might miss if I followed directions blindly.' },
  ] },
  { id: 'm28-crafts', topic: 'Making things by hand', icon: '🧵', questions: [
    { q: 'Did you make things by hand when you were younger?', sample: 'Yes, I made simple paper models at school and enjoyed turning a flat sheet into something three dimensional.' },
    { q: 'What would you like to learn to make?', sample: 'I would like to learn basic woodworking so I could build a small shelf for my room.' },
    { q: 'Do people in your area buy handmade products?', sample: 'They do at local markets, especially when the maker can explain how an item was produced.' },
    { q: 'Is it difficult to make time for a craft?', sample: 'It can be, but even half an hour at the weekend is enough to make progress on a small project.' },
  ] },
  { id: 'm29-libraries', topic: 'Public libraries', icon: '📚', questions: [
    { q: 'Is there a public library near your home?', sample: 'There is one about fifteen minutes away. It has a quiet reading area and a useful collection of local history books.' },
    { q: 'What do you usually do in a library?', sample: 'I look for books that I cannot easily find online, and sometimes I work there when I need a quiet place.' },
    { q: 'Did you visit libraries as a child?', sample: 'I did. My school arranged regular visits, which helped me discover books beyond the classroom reading list.' },
    { q: 'What could make libraries more useful?', sample: 'Longer evening hours and more places to work in groups would help people who study or work during the day.' },
  ] },
  { id: 'm30-repairs', topic: 'Repairing things', icon: '🔧', questions: [
    { q: 'Do you try to repair things that break?', sample: 'I try simple repairs, such as replacing a loose handle, before I decide whether something needs a professional.' },
    { q: 'Who taught you to fix small problems at home?', sample: 'My mother showed me how to diagnose a problem carefully and check the instructions before touching anything.' },
    { q: 'What was the last item you repaired?', sample: 'I repaired a desk lamp by replacing its damaged plug. It was satisfying to use it again.' },
    { q: 'Are repair services easy to find where you live?', sample: 'For phones and bicycles, yes. It is harder to find someone willing to fix a small household appliance.' },
  ] },
]

export const MOCK_21_TO_30_PART2: Part2Card[] = [
  { id: 'm21-repaired-object', title: 'Describe an object you repaired or had repaired', bullets: ['what the object was', 'how it was damaged', 'what was done to repair it', 'and explain why the repair mattered to you'], followUp: 'Would you try to repair a similar object yourself?', theme: 'Repair and reuse', sample: 'My old desk lamp stopped working just before an important project. A repair shop found a loose connection in the switch and replaced one small part. I was relieved because the lamp had belonged to my grandfather, so replacing it would have felt wasteful as well as disappointing.' },
  { id: 'm22-public-talk', title: 'Describe a public talk you found useful', bullets: ['where you heard the talk', 'who gave it', 'what the main message was', 'and explain how it affected you'], followUp: 'Would you attend another talk by this speaker?', theme: 'Public knowledge', sample: 'At our library, a local architect gave a talk about making streets safer for pedestrians. She used photographs of familiar junctions and explained how small design changes could prevent accidents. I left noticing crossings more carefully and thinking differently about how public space is planned.' },
  { id: 'm23-resolved-complaint', title: 'Describe a complaint that was handled well', bullets: ['what the problem was', 'who you contacted', 'how the person responded', 'and explain why you were satisfied with the outcome'], followUp: 'Did the experience change your opinion of the organisation?', theme: 'Customer service', sample: 'A book I ordered arrived with several pages missing. I contacted the shop and sent a photograph. The assistant apologised, arranged a replacement immediately and kept me informed. The solution was straightforward, but the clear communication made the experience memorable.' },
  { id: 'm24-unfamiliar-route', title: 'Describe a time you found your way through an unfamiliar place', bullets: ['where you were going', 'why the place was unfamiliar', 'how you chose your route', 'and explain how you felt when you arrived'], followUp: 'Would you use the same method of navigation again?', theme: 'Navigation and independence', sample: 'I had to find a small art centre in a city I had never visited. My phone signal failed, so I studied a map at the station and asked a shopkeeper which street led to the river. I reached the centre with time to spare and felt more confident about travelling independently.' },
  { id: 'm25-renovated-place', title: 'Describe a public place that improved after renovation', bullets: ['where the place is', 'what it was like before', 'what was changed', 'and explain whether people use it differently now'], followUp: 'Would you recommend this place to a visitor?', theme: 'Public spaces', sample: 'A small square near my home used to be mostly broken paving and parked cars. The council added trees, benches and safer paths. Families now stop there in the evenings, and the square feels like part of the neighbourhood rather than a shortcut through it.' },
  { id: 'm26-important-measurement', title: 'Describe a time when you needed to measure something carefully', bullets: ['what you measured', 'why accuracy was important', 'what equipment you used', 'and explain what happened as a result'], followUp: 'Do you normally check measurements twice?', theme: 'Accuracy and planning', sample: 'I measured a window before ordering a set of blinds. I used a tape measure and checked the width in three places because the frame was slightly uneven. The blinds fitted perfectly, and the experience taught me that a few extra minutes of checking can prevent an expensive mistake.' },
  { id: 'm27-kept-promise', title: 'Describe a promise you were pleased to keep', bullets: ['who you made the promise to', 'what you promised', 'what you did to keep it', 'and explain why it was important'], followUp: 'Was it difficult to keep your promise?', theme: 'Trust and responsibility', sample: 'I promised my younger cousin I would attend her school performance, even though I had a busy week. I finished my work early and travelled across town. She was delighted to see me in the audience, and I realised that being reliable can matter more than making a grand gesture.' },
  { id: 'm28-new-rule', title: 'Describe a rule that improved an activity you take part in', bullets: ['what the activity was', 'what rule was introduced', 'why the rule was needed', 'and explain what changed afterwards'], followUp: 'Did everyone accept the rule immediately?', theme: 'Rules and cooperation', sample: 'Our study group introduced a rule that everyone should send one question before each meeting. Previously, the discussions often drifted. The new routine gave us a clear starting point and helped quieter members contribute, so meetings became shorter and much more useful.' },
  { id: 'm29-handmade-item', title: 'Describe a handmade item you received', bullets: ['who made it', 'what materials were used', 'when you received it', 'and explain why you value it'], followUp: 'Would you like to learn to make something similar?', theme: 'Craft and value', sample: 'A friend gave me a small ceramic cup that she had made during a pottery course. Its shape is slightly uneven, but the blue glaze catches the light beautifully. I use it every morning because it reminds me of the time and care she put into making it.' },
  { id: 'm30-useful-instruction', title: 'Describe an instruction that helped you complete a task', bullets: ['what the task was', 'where you found the instruction', 'how you followed it', 'and explain why it was helpful'], followUp: 'Do you usually read instructions before starting?', theme: 'Clear communication', sample: 'When I assembled a bicycle stand, the printed guide was confusing, but a short video from the manufacturer showed each step from the right angle. I paused it as I worked and checked the parts against the diagram. The stand was stable on my first attempt, which rarely happens with flat-pack equipment.' },
]

export const MOCK_21_TO_30_PART3: Part3Theme[] = [
  { id: 'm21-repair-reuse', theme: 'Repair and reuse', questions: [
    { q: 'Why do some people replace an item instead of repairing it?', sample: 'Repairs can cost almost as much as a replacement, and people may not know where to find a reliable technician.' },
    { q: 'Should schools teach children basic repair skills?', sample: 'Yes. Simple skills build confidence and help children understand the resources behind everyday products.' },
    { q: 'How can manufacturers make products easier to repair?', sample: 'They can use standard fasteners, sell spare parts and provide clear instructions for common faults.' },
    { q: 'Could repairing products reduce environmental damage?', sample: 'It could, especially for electronics, because keeping an item in use delays both waste and the demand for new materials.' },
  ] },
  { id: 'm22-public-knowledge', theme: 'Sharing knowledge in public', questions: [
    { q: 'What makes a public speaker easy to understand?', sample: 'A clear structure, familiar examples and enough time for listeners to absorb each idea are all important.' },
    { q: 'Are free public lectures valuable to a community?', sample: 'They give people access to expertise regardless of income and can encourage discussion of local issues.' },
    { q: 'How have online talks changed access to information?', sample: 'They allow people in remote areas to hear specialists, though an online audience may ask fewer spontaneous questions.' },
    { q: 'Should experts simplify complex ideas for the general public?', sample: 'Yes, provided they keep the key evidence and uncertainty visible rather than presenting a misleadingly simple answer.' },
  ] },
  { id: 'm23-service', theme: 'Complaints and customer service', questions: [
    { q: 'Why are some people reluctant to make a complaint?', sample: 'They may expect an argument or feel that a small problem is not worth the effort.' },
    { q: 'What should a company do first when a customer reports a problem?', sample: 'It should listen carefully, confirm the facts and explain when the customer can expect a response.' },
    { q: 'Can negative feedback help an organisation?', sample: 'Certainly. Repeated complaints can reveal a flaw in a product or process that internal checks missed.' },
    { q: 'Should staff always follow a script when handling complaints?', sample: 'A script can ensure consistency, but staff also need freedom to respond to the person and the circumstances.' },
  ] },
  { id: 'm24-navigation', theme: 'Navigation and independence', questions: [
    { q: 'Why do some people enjoy exploring without a fixed route?', sample: 'It can lead to unexpected discoveries and make a place feel less like a checklist of attractions.' },
    { q: 'Are navigation apps making people less aware of their surroundings?', sample: 'Sometimes. Turn-by-turn instructions can reduce the need to remember landmarks or understand the wider area.' },
    { q: 'What information should a good city map include?', sample: 'It should show accessible routes, public transport links and recognisable landmarks, as well as street names.' },
    { q: 'Should children learn to navigate without a phone?', sample: 'Yes. Reading signs and planning a route are useful skills if a device loses power or signal.' },
  ] },
  { id: 'm25-public-spaces', theme: 'Designing public spaces', questions: [
    { q: 'What makes a public square pleasant to use?', sample: 'Shade, seating, safe crossings and room for different activities make people want to stay.' },
    { q: 'Who should be consulted before a public place is redesigned?', sample: 'Local residents, businesses and people with disabilities all see different problems and needs.' },
    { q: 'Can attractive public spaces benefit local businesses?', sample: 'Yes. If people spend longer in an area, they may also visit its shops and cafes.' },
    { q: 'How can cities keep renovated spaces in good condition?', sample: 'They need a realistic maintenance budget and a way for residents to report damage quickly.' },
  ] },
  { id: 'm26-accuracy', theme: 'Accuracy and planning', questions: [
    { q: 'In which jobs are small measurement errors especially serious?', sample: 'Construction, medicine and engineering come to mind, because a small error can affect safety or cost.' },
    { q: 'Why do people sometimes skip checking their work?', sample: 'They may be under time pressure or assume that a familiar task cannot go wrong.' },
    { q: 'Is careful planning always more useful than flexibility?', sample: 'No. Planning gives direction, while flexibility helps when new information changes what is possible.' },
    { q: 'How can teams reduce avoidable mistakes?', sample: 'Clear responsibilities and an independent final check catch many errors without creating excessive paperwork.' },
  ] },
  { id: 'm27-trust', theme: 'Trust and responsibility', questions: [
    { q: 'How do people usually decide whether someone is reliable?', sample: 'They look at a pattern of behaviour, such as whether the person arrives on time and keeps small promises.' },
    { q: 'Is it better to decline a request than to promise too much?', sample: 'Usually, yes. An honest refusal lets the other person make another plan.' },
    { q: 'How can organisations rebuild trust after a mistake?', sample: 'They should acknowledge the mistake, explain its cause and show what has changed to prevent it happening again.' },
    { q: 'Do digital reminders make people more responsible?', sample: 'They help people remember tasks, but responsibility still depends on deciding to follow through.' },
  ] },
  { id: 'm28-cooperation', theme: 'Rules and cooperation', questions: [
    { q: 'Why do groups need rules even when members get along?', sample: 'Rules make expectations clear and prevent small misunderstandings from becoming personal disputes.' },
    { q: 'When should a rule be changed?', sample: 'It should be reviewed when it repeatedly causes unfair outcomes or no longer serves its original purpose.' },
    { q: 'Are people more likely to follow rules they helped create?', sample: 'Often, because they understand the reasoning and feel their concerns were heard.' },
    { q: 'Can too many rules reduce creativity?', sample: 'Yes. Detailed restrictions can discourage people from trying sensible new approaches.' },
  ] },
  { id: 'm29-craft', theme: 'Craft and value', questions: [
    { q: 'Why are some handmade objects more expensive than factory products?', sample: 'They require skilled labour and are usually produced in small quantities rather than on automated lines.' },
    { q: 'Do handmade goods have value beyond their practical use?', sample: 'They can carry a maker’s story or a local tradition, which gives them personal and cultural meaning.' },
    { q: 'How can traditional craft skills survive?', sample: 'Apprenticeships, fair prices and opportunities to teach younger people can keep the skills viable.' },
    { q: 'Could new technology help craftspeople?', sample: 'Yes. Digital tools can help them sell work and plan designs while the making itself remains hands-on.' },
  ] },
  { id: 'm30-instructions', theme: 'Giving clear instructions', questions: [
    { q: 'What is the most common problem with written instructions?', sample: 'They often assume the reader already knows technical terms or can identify parts that look similar.' },
    { q: 'When is a video more useful than a printed guide?', sample: 'A video helps when movement or the order of physical steps is difficult to describe in words.' },
    { q: 'How should teachers check that students understood a task?', sample: 'They can ask students to explain the first step in their own words and invite specific questions.' },
    { q: 'Should instructions include an explanation of why each step matters?', sample: 'For complex or risky tasks, yes. Understanding the reason helps people adapt when conditions change.' },
  ] },
]
