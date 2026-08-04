import type { Article } from './types'

// Source: user-supplied "@articles_in_english" PDF. Channel branding and page furniture
// are intentionally omitted; the article body and study vocabulary are preserved.
export const birthOfTheUniverseArticle: Article = {
  id: 'a002',
  slug: 'the-birth-of-the-universe',
  title: 'The Birth of the Universe',
  teaser:
    'Travel from the Big Bang and the first light to stars, planets, and the unanswered mysteries that still shape modern cosmology.',
  category: 'Science',
  tags: ['universe', 'space', 'cosmology', 'Big Bang', 'stars', 'science'],
  readMinutes: 8,
  publishedLabel: 'New',
  cover: {
    theme: 'slate-azure',
    icon: 'Rocket',
    motif: 'COSMIC ORIGINS',
  },
  blocks: [
    {
      type: 'lead',
      text: 'Every time you look up at the night sky, you are looking into the past. The light from the Moon reaches Earth in just over a second, sunlight takes about eight minutes, and the glow from some distant stars has been traveling for hundreds or even thousands of years.',
    },
    {
      type: 'paragraph',
      text: 'Even more astonishingly, powerful telescopes allow astronomers to observe galaxies whose light began its journey billions of years ago. In a sense, the universe is the only place where looking farther also means looking backward in time.',
    },
    {
      type: 'quote',
      text: 'This remarkable fact has inspired one of humanity\'s oldest questions: How did the universe begin?',
    },
    {
      type: 'paragraph',
      text: 'For thousands of years, civilizations developed their own creation stories. Ancient Egyptians believed the world emerged from a primordial ocean, while Greek philosophers debated whether the universe had always existed. Many religious traditions describe creation as the result of divine power. Today, modern cosmology approaches the question differently.',
    },
    {
      type: 'paragraph',
      text: 'Using mathematics, advanced telescopes, and observations collected over decades, scientists have constructed a compelling explanation for the origin and evolution of the observable universe. Although many mysteries remain unsolved, the story that science has uncovered is one of the most extraordinary ever told.',
    },
    { type: 'heading', text: 'The Big Bang: Not an Explosion, but an Expansion' },
    {
      type: 'paragraph',
      text: 'One of the most common misconceptions is that the Big Bang was a giant explosion that occurred somewhere in empty space. In reality, scientists describe it very differently.',
    },
    {
      type: 'paragraph',
      text: 'According to the Big Bang theory, the observable universe began approximately 13.8 billion years ago in an extremely hot and incredibly dense state. Rather than exploding into pre-existing space, space itself began expanding. Every region of the universe started moving away from every other region, and that expansion continues even today.',
    },
    {
      type: 'paragraph',
      text: 'This idea may seem difficult to imagine because we naturally think of explosions happening inside something else. However, the universe was not expanding into empty space. Space itself was growing, carrying galaxies with it much like raisins moving farther apart as bread dough rises in the oven.',
    },
    {
      type: 'paragraph',
      text: 'One of the most intriguing aspects of this theory is that scientists cannot yet explain what, if anything, existed before the Big Bang. Since our current understanding suggests that space and time both originated with this event, asking what happened “before” it may not have a meaningful scientific answer. This remains one of the greatest mysteries in modern physics.',
    },
    { type: 'heading', text: 'A Universe That Changed in an Instant' },
    {
      type: 'paragraph',
      text: 'The first moments after the Big Bang were unlike anything we experience today. Within an unimaginably tiny fraction of a second, the universe underwent an extraordinary period of rapid expansion known as cosmic inflation. During this brief interval, it grew from an incredibly small size to something vastly larger.',
    },
    {
      type: 'paragraph',
      text: 'Although researchers continue investigating exactly how inflation occurred, the theory helps explain why the universe appears remarkably uniform across enormous distances. It also accounts for the tiny fluctuations that later allowed galaxies, stars, and planets to form.',
    },
    {
      type: 'paragraph',
      text: 'As the universe expanded, it cooled rapidly. During its earliest moments, temperatures were so extreme that ordinary atoms could not exist. Instead, the cosmos consisted of an energetic sea of fundamental particles moving at tremendous speeds. Only after the universe had cooled sufficiently could these particles combine to form the first atomic nuclei.',
    },
    { type: 'heading', text: 'The First Atoms and the Birth of Light' },
    {
      type: 'paragraph',
      text: 'A few minutes after the Big Bang, hydrogen and helium—the two lightest elements in the periodic table—began to form. However, the universe remained so hot that electrons could not yet attach themselves to these nuclei.',
    },
    {
      type: 'paragraph',
      text: 'Hundreds of thousands of years later, temperatures dropped enough for stable atoms to emerge. This seemingly simple event transformed the universe. Before atoms formed, light was constantly scattered by free electrons, making the universe opaque. Once electrons became bound to atomic nuclei, light could finally travel freely through space.',
    },
    {
      type: 'paragraph',
      text: 'That ancient radiation still fills the cosmos today. Known as the cosmic microwave background, it is often described as the oldest light in the observable universe. Discovered accidentally in 1965, it provides some of the strongest evidence supporting the Big Bang theory and offers scientists a snapshot of the universe when it was still remarkably young.',
    },
    { type: 'heading', text: 'Stars' },
    {
      type: 'paragraph',
      text: 'The early universe contained enormous clouds of hydrogen and helium drifting through expanding space. Over millions of years, gravity gradually pulled these clouds together. As the gas became denser, temperatures and pressures inside the collapsing clouds increased dramatically. Eventually, nuclear fusion began, and the first stars ignited.',
    },
    {
      type: 'paragraph',
      text: 'These stars changed the universe forever. Inside their intensely hot cores, hydrogen atoms fused into heavier elements such as carbon, oxygen, silicon, and iron. When massive stars reached the ends of their lives, many exploded as spectacular supernovae, scattering these newly created elements across the cosmos.',
    },
    {
      type: 'quote',
      text: 'Without those ancient stellar explosions, Earth could never have formed. Neither could we.',
    },
    {
      type: 'paragraph',
      text: 'Every oxygen atom you breathe, every calcium atom in your bones, and every iron atom carried in your blood was forged inside stars that lived and died billions of years before the Solar System existed. As astronomer Carl Sagan famously observed, humans are literally made of “star stuff.”',
    },
    { type: 'heading', text: 'The Formation of Our Solar System' },
    {
      type: 'paragraph',
      text: 'About 4.6 billion years ago, one enormous cloud of gas and dust within the Milky Way Galaxy began collapsing under its own gravity. Most of the material formed our Sun, while the remaining dust and gas gradually combined into planets, moons, asteroids, and comets. Earth emerged from this process approximately 4.5 billion years ago.',
    },
    {
      type: 'paragraph',
      text: 'At first, our planet was an extremely hostile place, covered with molten rock and constantly bombarded by space debris. Over millions of years, however, Earth’s surface cooled, oceans formed, and conditions gradually became suitable for life.',
    },
    {
      type: 'paragraph',
      text: 'Exactly how life first appeared remains one of science’s greatest unsolved questions. Nevertheless, once simple organisms emerged, evolution slowly produced the astonishing diversity of plants, animals, and eventually human beings capable of studying the universe itself.',
    },
    { type: 'heading', text: 'How Do Scientists Know All This?' },
    {
      type: 'paragraph',
      text: 'No one witnessed the birth of the universe, so how can scientists reconstruct events that occurred billions of years ago? The answer lies in evidence.',
    },
    {
      type: 'paragraph',
      text: 'One of the most important discoveries came in 1929 when astronomer Edwin Hubble observed that distant galaxies are moving away from Earth. Even more remarkably, the farther away a galaxy is, the faster it appears to be receding. This observation demonstrated that the universe is expanding.',
    },
    {
      type: 'paragraph',
      text: 'Scientists also study the cosmic microwave background, measure the abundance of hydrogen and helium, and compare these observations with predictions made by mathematical models. Together, these independent lines of evidence strongly support the Big Bang theory.',
    },
    {
      type: 'quote',
      text: 'Science does not rely upon a single observation. It reaches conclusions by assembling many pieces of evidence into one coherent picture.',
    },
    { type: 'heading', text: 'The Greatest Mystery Continues' },
    {
      type: 'paragraph',
      text: 'Despite extraordinary progress, our understanding of the universe remains incomplete. Scientists still do not know what dark matter—the invisible substance believed to influence galaxies through gravity—actually is. They also continue investigating dark energy, the mysterious phenomenon that appears to be accelerating the universe’s expansion.',
    },
    {
      type: 'paragraph',
      text: 'Most importantly, the ultimate origin of the Big Bang itself remains unknown. These unanswered questions remind us that science is not simply a collection of facts. It is an ongoing journey of discovery in which every answer leads to new questions.',
    },
    {
      type: 'paragraph',
      text: 'The story of the universe is still being written. As more powerful telescopes peer deeper into space and new theories reshape our understanding of physics, future generations may uncover answers that seem unimaginable today.',
    },
    {
      type: 'quote',
      text: 'After nearly 13.8 billion years of cosmic evolution, the universe has produced conscious beings capable of wondering how it all began.',
    },
    {
      type: 'paragraph',
      text: 'In trying to understand the birth of the cosmos, we are also discovering our own place within it.',
    },
  ],
  vocabulary: [
    {
      id: 'a002-v1',
      term: 'Cosmology',
      definition: 'The scientific study of the origin, structure, and evolution of the universe.',
      example: 'She decided to study cosmology because she was fascinated by space.',
      synonym: 'study of the universe',
    },
    {
      id: 'a002-v2',
      term: 'Observable',
      definition: 'Able to be seen, detected, or measured.',
      example: 'The scientist recorded every observable change in the experiment.',
      synonym: 'detectable',
    },
    {
      id: 'a002-v3',
      term: 'Primordial',
      definition: 'Existing from the earliest stage of development.',
      example: 'The lake is surrounded by a primordial forest.',
      synonym: 'ancient',
    },
    {
      id: 'a002-v4',
      term: 'Expansion',
      definition: 'The process of becoming larger or increasing in size.',
      example: 'The rapid expansion of the city created new opportunities.',
      synonym: 'growth',
    },
    {
      id: 'a002-v5',
      term: 'Inflation',
      definition: 'In cosmology, the extremely rapid expansion of the universe immediately after the Big Bang.',
      example: 'Scientists continue to study cosmic inflation.',
      synonym: 'rapid expansion',
    },
    {
      id: 'a002-v6',
      term: 'Fusion',
      definition: 'A nuclear reaction in which smaller atoms combine to form larger ones, releasing energy.',
      example: 'The Sun produces energy through nuclear fusion.',
      synonym: 'combination',
    },
    {
      id: 'a002-v7',
      term: 'Abundance',
      definition: 'A very large quantity of something.',
      example: 'The garden produced an abundance of fresh vegetables.',
      synonym: 'plenty',
    },
    {
      id: 'a002-v8',
      term: 'Coherent',
      definition: 'Logical, clear, and well organized.',
      example: 'She gave a coherent explanation of the problem.',
      synonym: 'logical',
    },
    {
      id: 'a002-v9',
      term: 'Recede',
      definition: 'To move farther away.',
      example: 'The floodwaters gradually receded.',
      synonym: 'retreat',
    },
  ],
}
