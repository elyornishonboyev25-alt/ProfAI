type Essay = {
  title: string
  lead: string
  question: string
  source?: { publisher: 'British Council' | 'IDP IELTS' | 'IELTS'; url: string; material: string; checkedOn: string }
}

const checkedOn = '2026-10-06'
const bcExercises = 'https://www.britishcouncil.sg/exam/ielts/blog/six-ielts-writing-sample-exercises'
const bcWorksheet = 'https://takeielts.britishcouncil.org/sites/default/files/writing_task_2_-_answer_the_questions.pdf'
const idpEssays = 'https://ielts.idp.com/prepare/article-e-is-for-essays'
const idpDiscussion = 'https://ielts.idp.com/prepare/article-simple-formula-discussing-opposing-views-ielts-essay'
const ieltsOpinion = 'https://ielts.org/news-and-insights/how-to-write-an-agree-disagree-essay-for-ielts-writing-task-2'
const idpFocus = 'https://info.ielts.idp.com/rs/561-EIU-022/images/IELTS%20Focus%20-%20AC%20Writing%20T2%20-%20Student%20updated.pdf'
const idpVocabulary = 'https://ielts.idp.com/vietnam/about/news-and-articles/article-ielts-vocabulary-writing-task-2/en-gb'
const official = (publisher: NonNullable<Essay['source']>['publisher'], url: string, material: string): NonNullable<Essay['source']> => ({ publisher, url, material, checkedOn })

// Supplied wording is preserved for 5, 6, 8 and 9. Screenshots 6 and 7 are
// identical, so test 7 retains its current question pending a replacement.
// 10–30 are published official preparation examples, not predicted exam papers.
export const WRITING_FULL_TEST_ESSAYS: Record<number, Essay> = {
  5: {
    title: 'Car ownership and alternative transport',
    lead: 'The first car appeared on British roads in 1888. By the year 2000 there may be as many as 29 million vehicles on British roads.\n\nAlternative forms of transport should be encouraged and international laws introduced to control car ownership and use.',
    question: 'To what extent do you agree or disagree?',
  },
  6: {
    title: 'Paying for elderly care',
    lead: 'In Britain, when someone gets old they often go to live in a home with other old people where there are nurses to look after them. Sometimes the government has to pay for this care.',
    question: 'Who do you think should pay for this care, the government or the family?',
  },
  7: {
    title: 'Public transport',
    lead: 'In large cities, governments should make public transport free to reduce traffic and pollution.',
    question: 'To what extent do you agree or disagree?',
  },
  8: {
    title: 'Health in the future',
    lead: "The average standard of people's health is likely to be lower in the future than it is now.",
    question: 'To what extent do you agree or disagree with this statement?',
  },
  9: {
    title: 'The changing world of work',
    lead: 'The world of work is changing rapidly and employees cannot depend on having the same job or the same working conditions for life.',
    question: 'Discuss the possible causes for this rapid change, and suggest ways of preparing people for the world of work in the future.',
  },
  10: {
    title: 'Support for poorer countries',
    lead: 'Some countries have become much richer than others. Richer countries should now help poorer countries.',
    question: 'To what extent do you agree or disagree with this opinion?',
    source: official('British Council', bcExercises, 'Writing Task 2 examples, example 1'),
  },
  11: {
    title: 'The purpose of education',
    lead: 'Some people think that the main purpose of school and university education should be to prepare people for work. Others, however, think that the true role of education is to make us better citizens.',
    question: 'Discuss both these views and give your own opinion.',
    source: official('British Council', bcExercises, 'Writing Task 2 examples, example 2'),
  },
  12: {
    title: 'Increasing city pollution',
    lead: 'In many cities around the world pollution levels have risen in recent years.',
    question: 'Why are some cities becoming more polluted? What effects does this have?',
    source: official('British Council', bcExercises, 'Writing Task 2 examples, example 3'),
  },
  13: {
    title: 'Teaching children healthy habits',
    lead: 'Some people think that parents should teach their children how to be healthy and have a balanced diet. Others, however, believe that school is the best place to learn this.',
    question: 'Discuss both these views and give your own opinion.',
    source: official('British Council', bcWorksheet, 'Answer the question, Worksheet 1, question 1; verified in indexed official PDF text'),
  },
  14: {
    title: 'Solving city traffic problems',
    lead: 'Encouraging people to use public transport is the best way to solve traffic problems in cities.',
    question: 'To what extent do you agree or disagree?\n\nWhat other measures do you think might be effective?',
    source: official('British Council', bcWorksheet, 'Answer the question, Worksheet 1, question 2; verified in indexed official PDF text'),
  },
  15: {
    title: 'The effects of working from home',
    lead: 'An increasing number of people work from home these days and stay in touch with their office using computer technology.',
    question: 'What are the effects on employees of working from home?',
    source: official('British Council', bcWorksheet, 'Answer the question, Worksheet 1, question 3; verified in indexed official PDF text'),
  },
  16: {
    title: 'Rapid urban growth',
    lead: 'These days, many cities have problems when they grow quickly, such as accidents and traffic jams.',
    question: 'Why do these problems occur?\n\nHow do these problems impact people who travel for work or study?',
    source: official('IDP IELTS', idpEssays, 'Two separate prompts, example A'),
  },
  17: {
    title: 'Work messages outside company hours',
    lead: 'A trend in current times is the need for many workers to spend time outside of company hours on answering text and e-mail messages for their job.',
    question: 'What problems does this cause for the worker?\n\nWhat can be done to reduce the impact of these problems?',
    source: official('IDP IELTS', idpEssays, 'Two separate prompts, example B'),
  },
  18: {
    title: 'Internet courses',
    lead: 'It is becoming very common these days for students to take courses over the Internet instead of in face-to-face classrooms.',
    question: 'Why are more students choosing this way of learning?\n\nIs this a positive or a negative development?',
    source: official('IDP IELTS', idpEssays, 'Two separate prompts, example C'),
  },
  19: {
    title: 'The internet as an invention',
    lead: 'Some people believe the internet is the most important invention in modern history.',
    question: 'To what extent do you agree or disagree?',
    source: official('IDP IELTS', idpDiscussion, 'Essay Types and Example Questions, Agree/Disagree'),
  },
  20: {
    title: 'Testing products on animals',
    lead: 'Some people believe that testing products on animals should be banned but others think that this is necessary.',
    question: 'Discuss both views and give your opinion.',
    source: official('IDP IELTS', idpDiscussion, 'Essay Types and Example Questions, Discussion'),
  },
  21: {
    title: 'Professionals leaving poorer countries',
    lead: 'More and more professionals, such as engineers and doctors, are leaving their own poorer countries to work in developed countries.',
    question: 'What problems does this cause?\n\nWhat solutions can you suggest to deal with this?',
    source: official('IDP IELTS', idpDiscussion, 'Essay Types and Example Questions, Problem/Solution'),
  },
  22: {
    title: 'Cosmetic surgery',
    lead: 'These days more and more people are choosing to improve their appearance with cosmetic surgery.',
    question: 'Do the advantages of this trend outweigh any disadvantages?',
    source: official('IDP IELTS', idpDiscussion, 'Essay Types and Example Questions, Advantage/Disadvantage'),
  },
  23: {
    title: 'Wild animals in zoos',
    lead: 'Some people think that wild animals should not be kept in zoos. Others believe that there are good reasons for having zoos.',
    question: 'Discuss both these views and give your own opinion.',
    source: official('IDP IELTS', 'https://ielts.idp.com/iraq/prepare/article-ielts-writing-task-2-7-steps-to-band-7', 'Step 1, example question'),
  },
  24: {
    title: 'Too many choices',
    lead: 'Some people believe that nowadays we have too many choices.',
    question: 'To what extent do you agree or disagree with this statement?',
    source: official('IELTS', ieltsOpinion, 'Typical agree/disagree question 1'),
  },
  25: {
    title: 'Living with a foreign language',
    lead: 'Living in a country where you have to speak a foreign language can cause serious social problems as well as practical problems.',
    question: 'To what extent do you agree or disagree with this statement?',
    source: official('IELTS', ieltsOpinion, 'Typical agree/disagree question 2'),
  },
  26: {
    title: 'Banning tobacco products',
    lead: 'Smoking is a major cause of serious illness and death throughout the world today. In the interest of public health, governments should ban cigarettes and other tobacco products.',
    question: 'Do you agree or disagree?',
    source: official('IDP IELTS', 'https://ielts.idp.com/vietnam/prepare/article-agree-or-disagree-ielts-writing-task-2/en-gb', 'Opening Agree/Disagree example'),
  },
  27: {
    title: 'STEM education funding',
    lead: 'Governments should spend more money on providing STEM* education in schools than on music and art because employers need more people with a STEM background than music or art.',
    question: 'To what extent do you agree or disagree with this opinion?\n\n*STEM = Science, Technology, Engineering and Mathematics',
    source: official('IDP IELTS', idpFocus + '#page=21', 'IELTS Focus Academic Writing Task 2, student book page 20'),
  },
  28: {
    title: 'Family-run businesses',
    lead: 'Many businesses in the world today are run by family members.',
    question: 'Do the advantages of family-run businesses outweigh the disadvantages?',
    source: official('IDP IELTS', idpFocus + '#page=23', 'IELTS Focus Academic Writing Task 2, student book page 22'),
  },
  29: {
    title: 'Social media and personal interaction',
    lead: 'Social media platforms like Facebook and Twitter are replacing face to face interaction.',
    question: 'Do the advantages outweigh the disadvantages?',
    source: official('IDP IELTS', idpVocabulary, 'Effective Communication, sample question 1'),
  },
  30: {
    title: 'Consumption of natural resources',
    lead: 'Natural resources are being consumed at an increasing rate.',
    question: 'What are the dangers of this situation?\n\nWhat should we do?',
    source: official('IDP IELTS', idpVocabulary, 'The Energy Crisis, sample question 3'),
  },
}
