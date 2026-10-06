import type { WritingFullTest, WritingTask } from './writingTestData'
import { PRACTICE_TASK_VISUALS } from './writingFullTestPracticeVisuals'
import { SOURCE_TASK_VISUALS } from './writingFullTestSourceVisuals'
import { SUPPLIED_TASK_VISUALS } from './writingSuppliedTaskVisuals'
import { WRITING_FULL_TEST_ESSAYS } from './writingFullTestEssays'

// Supplied native SVG diagrams override the previous practice visuals.

const TASK_1_INSTRUCTIONS = 'Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.'
const TASK_2_INSTRUCTIONS = 'Give reasons for your answer and include any relevant examples from your own knowledge or experience. Write at least 250 words.'

export const WRITING_TESTS_5_TO_30: WritingFullTest[] = Array.from({ length: 26 }, (_, offset) => {
  const index = offset + 5
  const sourceVisual = SOURCE_TASK_VISUALS[index]
  const practiceVisual = PRACTICE_TASK_VISUALS[index]
  const suppliedVisual = SUPPLIED_TASK_VISUALS[index]
  const visual = suppliedVisual ?? sourceVisual ?? practiceVisual
  const task1Instructions = suppliedVisual?.instructions ?? TASK_1_INSTRUCTIONS
  const imageUrl = sourceVisual
    ? `/images/ielts-writing/full-writing-test-${index}-source.${sourceVisual.extension}`
    : `/images/ielts-writing/full-writing-test-${index}-practice.svg`
  const visualContext = suppliedVisual ? suppliedVisual.context : sourceVisual ? sourceVisual.context : practiceVisual.series && practiceVisual.categories
    ? practiceVisual.title + '; unit: ' + practiceVisual.unit + '. ' + practiceVisual.categories.map((category, categoryIndex) =>
      category + ': ' + practiceVisual.series!.map((series) => series.label + ' ' + series.values[categoryIndex]).join(', ')).join('; ') + '.'
    : practiceVisual.context
  const task1: WritingTask = {
    id: 'writing-full-' + index + '-task-1', day: null, fullTestIndex: index, taskType: 'task1',
    title: 'Full Writing Test ' + index,
    subtitle: 'Task 1 · ' + visual.kind + ' · ' + visual.title,
    prompt: visual.lead + '\n\n' + task1Instructions,
    promptLead: visual.lead,
    instructions: task1Instructions,
    suggestedWordCount: { min: 150, max: 180 }, maxWordCount: 500, durationMinutes: 20,
    ...(suppliedVisual ? { diagram: suppliedVisual.diagram } : { imageUrl }),
    imageAlt: visual.kind + ': ' + visual.title,
    visualContext,
    available: true,
  }
  const essay = WRITING_FULL_TEST_ESSAYS[index]
  const essayQuestion = essay.lead + '\n\n' + essay.question
  const task2: WritingTask = {
    id: 'writing-full-' + index + '-task-2', day: null, fullTestIndex: index, taskType: 'task2',
    title: 'Full Writing Test ' + index,
    subtitle: 'Task 2 · Essay · ' + essay.title,
    prompt: essayQuestion + '\n\n' + TASK_2_INSTRUCTIONS,
    promptLead: essay.lead,
    promptQuestion: essay.question,
    source: essay.source,
    instructions: TASK_2_INSTRUCTIONS,
    suggestedWordCount: { min: 250, max: 280 }, maxWordCount: 800, durationMinutes: 40,
    available: true,
  }
  return {
    id: 'writing-full-' + index, index, title: 'Full Writing Test ' + index, available: true,
    tasks: [task1, task2],
  }
})
