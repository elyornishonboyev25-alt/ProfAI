import type { WritingFullTest, WritingTask } from './writingTestData'
import { ORIGINAL_TASK_VISUALS } from './writingFullTestOriginalVisuals'

// Task 1 images are the original source exports listed in the source ledger.
const ESSAYS = [["Local libraries","Some people believe public libraries should focus mainly on books, while others think they should provide digital services and community spaces. Discuss both views and give your opinion."],["Remote work","Working from home has become common in many professions. Do the advantages of remote work for employees and employers outweigh its disadvantages?"],["Public transport","In large cities, governments should make public transport free to reduce traffic and pollution. To what extent do you agree or disagree?"],["School subjects","Some people think schools should devote more time to practical life skills than to traditional academic subjects. Discuss both views and give your opinion."],["Food waste","Large amounts of food are thrown away by households and businesses. What are the main causes of this problem, and what measures could reduce it?"],["Tourism limits","Some popular destinations limit visitor numbers to protect local communities and natural sites. Is this a positive or negative development?"],["University funding","Should governments pay the full cost of university education for all students? Discuss both views and give your opinion."],["Children and screens","Children are spending more time using screens for leisure. What effects might this have, and how can families respond?"],["City green space","Cities should give more land to parks and trees even when housing is in short supply. To what extent do you agree or disagree?"],["International study","Increasing numbers of students choose to study in another country. Do the benefits of this choice outweigh the drawbacks?"],["Advertising to children","Advertising aimed at children should be restricted. To what extent do you agree or disagree?"],["Working age","In some countries, people are encouraged to work beyond the traditional retirement age. What are the advantages and disadvantages for individuals and society?"],["Heritage buildings","When old buildings are costly to maintain, should cities replace them with modern buildings? Discuss both views and give your opinion."],["Health and exercise","Some people say individuals are responsible for staying healthy, while others believe governments should take a larger role. Discuss both views and give your opinion."],["News on social media","More people now get news from social media than from newspapers or television. Is this a positive or negative development?"],["Waste packaging","Manufacturers produce too much disposable packaging. Who should be responsible for reducing it: producers, shops, or consumers? Give reasons for your answer."],["Artificial intelligence at work","As artificial intelligence takes over routine work, what skills should schools and employers help people develop?"],["Sports funding","Some people think public money should support elite athletes, while others prefer funding local sports facilities. Discuss both views and give your opinion."],["Language learning","Learning a foreign language should be compulsory throughout school. To what extent do you agree or disagree?"],["Electric vehicles","Governments should encourage electric vehicles through subsidies and charging infrastructure. Do the advantages of this policy outweigh the costs?"],["Flexible school hours","Some schools are considering later start times for teenagers. What could be the benefits and drawbacks of this change?"],["Online shopping","Online shopping is replacing many physical stores. What effects does this have on towns and consumers?"],["Water use","Households and industry both use large amounts of water. What measures can reduce waste without limiting essential activities?"],["Scientific research","Some argue that scientific research should be directed mainly by governments rather than private companies. Discuss both views and give your opinion."],["Public art","Should cities spend public money on art in shared spaces when they also need to improve basic services? Discuss both views and give your opinion."],["Animal habitats","Protecting wildlife habitats sometimes restricts farming or construction. How should governments balance these interests?"]] as const

const TASK_1_INSTRUCTIONS = 'Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.'
const TASK_2_INSTRUCTIONS = 'Give reasons for your answer and include any relevant examples from your own knowledge or experience. Write at least 250 words.'

export const WRITING_TESTS_5_TO_30: WritingFullTest[] = Array.from({ length: 26 }, (_, offset) => {
  const index = offset + 5
  const original = ORIGINAL_TASK_VISUALS[index]
  const imageUrl = '/images/ielts-writing/full-writing-test-' + index + '-original.' + original.extension
  const task1: WritingTask = {
    id: 'writing-full-' + index + '-task-1', day: null, fullTestIndex: index, taskType: 'task1',
    title: 'Full Writing Test ' + index,
    subtitle: 'Task 1 · ' + original.kind + ' · ' + original.title,
    prompt: original.lead + '\n\n' + TASK_1_INSTRUCTIONS,
    promptLead: original.lead,
    instructions: TASK_1_INSTRUCTIONS,
    suggestedWordCount: { min: 150, max: 180 }, maxWordCount: 500, durationMinutes: 20,
    imageUrl, imageAlt: original.kind + ': ' + original.title,
    visualContext: original.context,
    available: true,
  }
  const essayQuestion = ESSAYS[offset][1]
  const task2: WritingTask = {
    id: 'writing-full-' + index + '-task-2', day: null, fullTestIndex: index, taskType: 'task2',
    title: 'Full Writing Test ' + index,
    subtitle: 'Task 2 · Essay · ' + ESSAYS[offset][0],
    prompt: essayQuestion + '\n\n' + TASK_2_INSTRUCTIONS,
    promptLead: essayQuestion,
    instructions: TASK_2_INSTRUCTIONS,
    suggestedWordCount: { min: 250, max: 280 }, maxWordCount: 800, durationMinutes: 40,
    available: true,
  }
  return {
    id: 'writing-full-' + index, index, title: 'Full Writing Test ' + index, available: true,
    tasks: [task1, task2],
  }
})
