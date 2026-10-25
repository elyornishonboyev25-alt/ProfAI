import type { WritingTask } from '@/data/writingTestData'

/** Available while grading is pending too, so feedback never hides the work. */
export default function SubmittedWritingAnswers({ tasks, answers }: { tasks: WritingTask[]; answers: Record<string, string> }) {
  return <div className="mx-auto mt-6 w-full max-w-3xl space-y-3 text-left" data-submitted-writing>
    {tasks.map(task => <details key={task.id} open className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <summary className="cursor-pointer font-bold text-slate-900">{task.title} · Your submitted response</summary>
      <p className="mt-3 text-sm leading-6 text-slate-500">{task.prompt}</p>
      <p className="mt-4 max-h-80 overflow-y-auto whitespace-pre-wrap break-words text-sm leading-7 text-slate-800">{answers[task.id]?.trim() || 'No response submitted.'}</p>
    </details>)}
  </div>
}
