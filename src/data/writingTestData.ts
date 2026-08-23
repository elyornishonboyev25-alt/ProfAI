export type WritingTaskType = 'task1' | 'task2'

export type ChartDataPoint = {
  year: number
  value: number
}

export type ChartSeries = {
  label: string
  data: ChartDataPoint[]
  style: 'solid' | 'dashed'
}

export type LineChartData = {
  type: 'line'
  title: string
  yAxisLabel: string
  series: ChartSeries[]
}

export type WritingChartData = LineChartData

export type WritingTask = {
  id: string
  day: number | null
  fullTestIndex: number | null
  taskType: WritingTaskType
  title: string
  subtitle: string
  prompt: string
  suggestedWordCount: { min: number; max: number }
  maxWordCount: number
  durationMinutes: number
  chart?: WritingChartData
  imageUrl?: string
  promptLead?: string
  promptQuestion?: string
  instructions?: string
  available: boolean
}

export type WritingFullTest = {
  id: string
  index: number
  title: string
  tasks: WritingTask[]
  available: boolean
}

function getTaskTypeForDay(day: number): WritingTaskType {
  const cyclePosition = (day - 1) % 3
  return cyclePosition === 0 ? 'task1' : 'task2'
}

const DAY_1_TASK: WritingTask = {
  id: 'writing-day-1',
  day: 1,
  fullTestIndex: null,
  taskType: 'task1',
  title: 'Day 1',
  subtitle: 'Task 1 · Line Graph · Shop closures and openings',
  prompt:
    'The graph below shows the number of shops that closed and the number of new shops that opened in one country between 2011 and 2018.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.',
  suggestedWordCount: { min: 150, max: 180 },
  maxWordCount: 500,
  durationMinutes: 20,
  chart: {
    type: 'line',
    title: 'Number of shop closures and openings 2011–2018',
    yAxisLabel: '',
    series: [
      {
        label: 'Closures',
        style: 'solid',
        data: [
          { year: 2011, value: 6300 },
          { year: 2012, value: 5900 },
          { year: 2013, value: 7100 },
          { year: 2014, value: 6500 },
          { year: 2015, value: 600 },
          { year: 2016, value: 5200 },
          { year: 2017, value: 5000 },
          { year: 2018, value: 5200 },
        ],
      },
      {
        label: 'Openings',
        style: 'dashed',
        data: [
          { year: 2011, value: 8500 },
          { year: 2012, value: 3900 },
          { year: 2013, value: 5000 },
          { year: 2014, value: 6100 },
          { year: 2015, value: 4000 },
          { year: 2016, value: 4000 },
          { year: 2017, value: 4200 },
          { year: 2018, value: 3000 },
        ],
      },
    ],
  },
  available: true,
}

const FULL_TEST_1_TASKS: WritingTask[] = [
  {
    id: 'writing-full-1-task-1',
    day: null,
    fullTestIndex: 1,
    taskType: 'task1',
    title: 'Full Writing Test 1',
    subtitle: 'Task 1 · Process Diagram · Smoked fish',
    prompt:
      'The diagram details the process of making smoked fish.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
    promptLead: 'The diagram details the process of making smoked fish.',
    instructions:
      'Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
    suggestedWordCount: { min: 150, max: 180 },
    maxWordCount: 500,
    durationMinutes: 20,
    imageUrl: '/images/ielts-writing/full-writing-test-1-smoked-fish-exact.png',
    available: true,
  },
  {
    id: 'writing-full-1-task-2',
    day: null,
    fullTestIndex: 1,
    taskType: 'task2',
    title: 'Full Writing Test 1',
    subtitle: 'Task 2 · Essay · Advertising and consumers',
    prompt:
      'Consumers are faced with increasing numbers of advertisements from competing companies.\n\nTo what extent do you think are consumers influenced by advertisements?\nWhat measures can be taken to protect them?\n\nGive reasons for your answer and include any relevant examples from your own knowledge and experience. Write at least 250 words.',
    promptLead:
      'Consumers are faced with increasing numbers of advertisements from competing companies',
    promptQuestion:
      'To what extent do you think are consumers influenced by advertisements?\nWhat measures can be taken to protect them?',
    instructions:
      'Give reasons for your answer and include any relevant examples from your own knowledge and experience. Write at least 250 words.',
    suggestedWordCount: { min: 250, max: 280 },
    maxWordCount: 800,
    durationMinutes: 40,
    available: true,
  },
]

const FULL_TEST_1: WritingFullTest = {
  id: 'writing-full-1',
  index: 1,
  title: 'Full Writing Test 1',
  tasks: FULL_TEST_1_TASKS,
  available: true,
}

export function getWritingDayCatalog(): WritingTask[] {
  const days: WritingTask[] = []

  for (let day = 1; day <= 30; day++) {
    if (day === 1) {
      days.push(DAY_1_TASK)
      continue
    }

    const taskType = getTaskTypeForDay(day)
    days.push({
      id: `writing-day-${day}`,
      day,
      fullTestIndex: null,
      taskType,
      title: `Day ${day}`,
      subtitle: `${taskType === 'task1' ? 'Task 1 · Visual Report' : 'Task 2 · Essay'} · Coming soon`,
      prompt: '',
      suggestedWordCount: taskType === 'task1' ? { min: 150, max: 180 } : { min: 250, max: 280 },
      maxWordCount: taskType === 'task1' ? 500 : 800,
      durationMinutes: taskType === 'task1' ? 20 : 40,
      available: false,
    })
  }

  return days
}

export function getWritingFullTestCatalog(): WritingFullTest[] {
  const tests: WritingFullTest[] = []

  for (let i = 1; i <= 30; i++) {
    if (i === 1) {
      tests.push(FULL_TEST_1)
      continue
    }

    tests.push({
      id: `writing-full-${i}`,
      index: i,
      title: `Full Writing Test ${i}`,
      tasks: [],
      available: false,
    })
  }

  return tests
}

export function getWritingTaskById(id: string): WritingTask | null {
  if (id === 'writing-day-1') return DAY_1_TASK

  const fullTestTask = FULL_TEST_1_TASKS.find((task) => task.id === id)
  if (fullTestTask) return fullTestTask

  const dayCatalog = getWritingDayCatalog()
  return dayCatalog.find((task) => task.id === id) ?? null
}

export function getWritingFullTestById(id: string): WritingFullTest | null {
  return getWritingFullTestCatalog().find((test) => test.id === id) ?? null
}
