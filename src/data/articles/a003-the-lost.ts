import type { Article } from './types'

// Source: user-supplied "ARTICLES365 (2)" PDF, written by Edoardo Albert.
// Channel branding and page furniture are intentionally omitted; the editorial body,
// practical guidance, and study vocabulary are preserved in the site's article format.
export const theLostArticle: Article = {
  id: 'a003',
  slug: 'the-lost',
  title: 'The Lost',
  teaser:
    'Millions of people go missing around the world each year. Explore why they disappear, what families face, and what to do when someone is missing.',
  category: 'Society',
  tags: ['missing people', 'society', 'mental health', 'public safety', 'families', 'jouhatsu'],
  readMinutes: 8,
  publishedLabel: 'New',
  cover: {
    theme: 'ocean-teal',
    icon: 'Compass',
    motif: 'MISSING PEOPLE',
  },
  blocks: [
    {
      type: 'lead',
      text: 'Every year about 170,000 people go missing in the UK. Worldwide, researchers estimate that eight million children disappear each year — no one really knows how many adults go missing. It is clearly a large problem, but it is a complex issue too, with many different reasons for these disappearances.',
    },
    { type: 'heading', text: 'The numbers' },
    {
      type: 'paragraph',
      text: 'In the UK, of those 170,000 people reported missing annually, roughly 100,000 are adults and 70,000 are children. Thankfully, the vast majority of missing people are quickly found. Among missing adults, 75% are found within 24 hours and 85% within 48 hours. However, 5% of missing adults will still be missing after a week.',
    },
    {
      type: 'paragraph',
      text: 'In the case of missing children, 80% are found within 24 hours and 90% within 48 hours. However, 2% of missing children will still be missing after a week has passed.',
    },
    {
      type: 'paragraph',
      text: 'But although the vast majority of people are found within a relatively short time, a small proportion of the lost remain missing for a year or longer. However, since so many people go missing each year, this small proportion is quite a large number. In Britain, there are about 5,000 people who have been missing for longer than a year. Of these, about 1,700 are children and 3,300 adults.',
    },
    {
      type: 'paragraph',
      text: 'Equivalent statistics do not exist worldwide. Countries have widely differing definitions of what constitutes a missing person and in some places privacy laws mean that unless the police have reason to believe that someone has gone missing because a crime has been committed, they will not investigate further.',
    },
    {
      type: 'quote',
      text: 'Countries have widely differing definitions of what constitutes a missing person.',
    },
    { type: 'heading', text: 'Why do people go missing?' },
    {
      type: 'paragraph',
      text: 'There is no single reason. There is, however, a difference between the reasons children go missing and why adults disappear. However, there has been much more work done on the reasons for children and young people going missing than on why adults disappear, so it is possible that some of the factors making adults walk out of their lives have not yet been discovered.',
    },
    {
      type: 'paragraph',
      text: "With children and young people, a major cause of disappearances, reported in more than half of cases, is trouble at home. Neglect, abuse or conflict with parents lie behind the young person's decision to leave. Mental health issues also played a role in about 20% of the cases, with 10% of missing children reporting that they had self-harmed and 4% being at risk of suicide.",
    },
    {
      type: 'paragraph',
      text: 'Sexual exploitation also leads to many children and young people going missing. Among these are many who are in care. Children and young people are trafficked across borders by organised gangs for use in prostitution and other criminal activities. Many of these run away and are then placed into care. But even there, marked by their experiences, they still tend to run away. In fact, children who have been placed into care for whatever reason are markedly more likely to go missing than those living with their families.',
    },
    {
      type: 'paragraph',
      text: 'With respect to adults, much less work has been done to understand why they go missing. But the research we do have suggests that mental health issues play a large part in the majority of the cases. This can be ongoing chronic mental illness or a sudden acute episode. For instance, someone might be under so much stress that they start the process of leaving, switching off their phone and communications, and keep going until the stress has lessened sufficiently for them to return.',
    },
    {
      type: 'paragraph',
      text: 'The other major factor, mentioned in 30% of adult cases, is the breakdown of a relationship. With older people, dementia is a factor, confusion leading to them becoming disoriented and lost. Smaller numbers of people, in the region of 1 in 50, report that money worries or the fear of violence played a part in their decision to disappear.',
    },
    { type: 'heading', text: 'What to do if someone has gone missing' },
    {
      type: 'paragraph',
      text: "It is not necessary to wait 24 hours before reporting a missing person to the police. In particular, if the person missing is a child or an adult you think is at real risk, then report them missing straight away, calling your country's emergency line. Otherwise, report the missing person at the nearest police station.",
    },
    {
      type: 'paragraph',
      text: "With adults, unless you have immediate cause for concern, try searching for them yourself first, remembering to check for messages and their most recent posts on social media. Leave a message on their phone explaining how worried you are, but adding that there will be no ramifications for them when they come back. Be sure to contact friends and other family members to see if anyone else knows the missing person's location or intentions. Try to keep a record of where you have looked. Should you have to report the person as missing to the police, this will be useful information.",
    },
    {
      type: 'paragraph',
      text: 'Police forces around the world emphasise how important the first 24 to 48 hours are in tracing a missing person. The memories of witnesses are still fresh and other traces are easier to find. This is even more important in the case of missing children.',
    },
    { type: 'heading', text: 'Why do some people never come back?' },
    {
      type: 'paragraph',
      text: 'In some cases, the person is not able to come back. Sadly, they may have died and their body has not been discovered or it has remained unidentified. But in other cases, people can feel overwhelmed by guilt at the distress they have caused and not feel able to face the people they abandoned. Some adults have simply decided to walk out of their old life and, having left it, do not wish to return to it. Some people who go missing are convinced that they are a burden or problem to their families and therefore decide not to return to them.',
    },
    { type: 'heading', text: 'The effect on the people left behind' },
    {
      type: 'paragraph',
      text: 'A missing person is not the same as a dead person. When someone dies, however tragically, there is a clear legal process to go through and we have social and religious rituals to lay the dead person to rest. There is an ending.',
    },
    {
      type: 'paragraph',
      text: "But when someone goes missing there is no ending. It's like a story cutting off halfway through. The people left behind are stuck, caught in a loop of hope, worry and despair. For the people left behind, the experience is isolating and almost uniquely unsettling.",
    },
    {
      type: 'paragraph',
      text: "There are also major practical issues involved that make dealing with the missing person's estate a legal minefield. In most countries around the world, someone can be declared dead in absentia between seven and ten years after their last-known appearance. There is also provision for people to be declared dead without a body being found when it can be reasonably presumed that the person is dead but their body will not be recovered. For example, passengers and crew missing from the Titanic were declared dead soon after the ship's sinking.",
    },
    {
      type: 'paragraph',
      text: 'The reasons why people go missing and what we can do to stop it happening has received relatively little attention from researchers when compared with other public health issues, such as suicide. It remains stuck in a grey place between policing and public health because the reasons for which people go missing often involve both of these as well as other factors. As an issue, it urgently requires further attention.',
    },
    {
      type: 'quote',
      text: 'It remains stuck in a grey place between policing and public health.',
    },
    {
      type: 'paragraph',
      text: 'If you know someone who has gone missing, fear that someone will go missing or are struggling against the urge to walk out of your life, then contact Missing People at www.missingpeople.org.uk or phone them on 116 000. In Australia, contact Missing Persons at www.missingpersons.gov.au. In the US, call local law enforcement. If the missing person is a child, call the National Center for Missing & Exploited Children on 800-THE-LOST (800-843-5678).',
    },
    { type: 'heading', text: 'Jouhatsu: The Disappeared' },
    {
      type: 'paragraph',
      text: "In Japan, there is a name for people who voluntarily disappear: jouhatsu. The word first came into use in the 1960s when it was applied to people who disappeared to escape unhappy marriages, as divorce proceedings were difficult and attracted social opprobrium. It has since widened to include people who leave their old lives for a wider variety of reasons: unhappy marriages remain a major cause but falling into debt, escaping the stress of being a salaryman and a host of other problems are also reasons.",
    },
    {
      type: 'paragraph',
      text: "What is unique to Japan, however, is that companies have sprung up to help jouhatsu escape their old lives and start new ones. These businesses are called yonige-ya ('fly-by-night shops'). Yonige-ya charge jouhatsu according to the amount of help their client requires, the exact bill being determined by how far the client wants to move, what he or she wants to take from the old life, and evading debt collectors among other things. Japan's strict privacy laws prevent police from trying to trace missing people unless there is reasonable suspicion of accident or crime, so jouhatsu may remain undiscovered for the rest of their new lives.",
    },
  ],
  vocabulary: [
    {
      id: 'a003-v1',
      term: 'Constitute',
      definition: 'To be regarded as, or to form, a particular thing.',
      example: 'Different countries disagree on what circumstances constitute a missing-person case.',
      synonym: 'amount to',
    },
    {
      id: 'a003-v2',
      term: 'Neglect',
      definition: 'Failure to give someone the care or attention they need.',
      example: 'Neglect at home can place a young person at serious risk.',
      synonym: 'lack of care',
    },
    {
      id: 'a003-v3',
      term: 'Exploitation',
      definition: 'The unfair use of someone for another person’s benefit.',
      example: 'Authorities work across borders to prevent the exploitation of children.',
      synonym: 'abuse',
    },
    {
      id: 'a003-v4',
      term: 'Trafficked',
      definition: 'Illegally transported or controlled for forced labour or another exploitative purpose.',
      example: 'Some vulnerable young people are trafficked across national borders.',
      synonym: 'illegally transported',
    },
    {
      id: 'a003-v5',
      term: 'Chronic',
      definition: 'Continuing for a long time or repeatedly occurring.',
      example: 'Chronic stress can have a serious effect on mental health.',
      synonym: 'long-term',
    },
    {
      id: 'a003-v6',
      term: 'Disoriented',
      definition: 'Confused about where you are or what is happening.',
      example: 'The disoriented traveller could not remember how to get home.',
      synonym: 'confused',
    },
    {
      id: 'a003-v7',
      term: 'Ramifications',
      definition: 'The complicated and often unwelcome consequences of an action.',
      example: 'The decision could have legal ramifications for the whole family.',
      synonym: 'consequences',
    },
    {
      id: 'a003-v8',
      term: 'In absentia',
      definition: 'While the person involved is not present.',
      example: 'After the legal waiting period, a missing person may be declared dead in absentia.',
      synonym: 'in one’s absence',
    },
    {
      id: 'a003-v9',
      term: 'Opprobrium',
      definition: 'Strong public criticism or social disapproval.',
      example: 'At the time, divorce could attract considerable social opprobrium.',
      synonym: 'condemnation',
    },
  ],
}
