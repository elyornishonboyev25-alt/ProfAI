import type { WritingEvaluation } from '@/services/geminiAI'
import type { WritingTask } from '@/data/writingTestData'

export function writingTaskMean(evaluation?: WritingEvaluation): number {
  if (!evaluation) return 0
  return (evaluation.taskAchievement + evaluation.coherenceCohesion + evaluation.lexicalResource + evaluation.grammaticalRange) / 4
}

// Preserve criterion means until the final section band is rounded.
export function writingSectionBand(task1?: WritingEvaluation, task2?: WritingEvaluation): number {
  return Math.round((writingTaskMean(task1) + 2 * writingTaskMean(task2)) / 3 * 2) / 2
}

export function writingVisualContext(task: WritingTask): string | undefined {
  if (task.visualContext) return task.visualContext
  if (task.chart) return JSON.stringify({ title: task.chart.title, unit: task.chart.yAxisLabel, series: task.chart.series.map(({ label, data }) => ({ label, data })) })
  if (task.visual) return JSON.stringify({ title: task.visual.title, unit: task.visual.unit, categories: task.visual.years, series: task.visual.series, note: task.visual.note })
  return undefined
}
