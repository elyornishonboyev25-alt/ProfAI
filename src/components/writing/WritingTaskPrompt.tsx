import type { WritingTask } from '@/data/writingTestData'

/** Keep the same question hierarchy in full tests and individual practice. */
export default function WritingTaskPrompt({ task }: { task: WritingTask }) {
  return <article className="writing-exam-card writing-prompt-card">
    <div className="writing-prompt-heading">
      <span className="writing-exam-label">Writing {task.taskType === 'task1' ? 'Task 1' : 'Task 2'}</span>
      <span className="writing-minimum-chip">{task.suggestedWordCount.min} words minimum</span>
    </div>
    <p className="writing-prompt-lead">{task.promptLead ?? task.prompt}</p>
    {task.promptQuestion && <div className="writing-prompt-question">{task.promptQuestion}</div>}
    {task.instructions && <p className="writing-prompt-instructions">{task.instructions}</p>}
  </article>
}
