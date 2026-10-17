import type { WritingEvaluation } from '@/services/geminiAI'

export default function WritingScoreExplanation({ feedback, taskType }: { feedback?: WritingEvaluation['criterionFeedback']; taskType: 'task1' | 'task2' }) {
  if (!feedback) return null
  const labels = { taskAchievement: taskType === 'task1' ? 'Task Achievement' : 'Task Response', coherenceCohesion: 'Coherence and Cohesion', lexicalResource: 'Lexical Resource', grammaticalRange: 'Grammatical Range and Accuracy' }
  return <details className="mt-4 rounded-2xl border border-slate-200 bg-white p-4" open>
    <summary className="cursor-pointer text-sm font-bold text-slate-800">Why these bands were awarded</summary>
    <dl className="mt-3 space-y-3">{(Object.keys(labels) as Array<keyof typeof labels>).map(key => <div key={key}><dt className="text-xs font-bold text-slate-800">{labels[key]}</dt><dd className="mt-1 text-sm leading-6 text-slate-600">{feedback[key]}</dd></div>)}</dl>
    <a href="https://ielts.org/cdn/ielts-guides/ielts-writing-band-descriptors.pdf" target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs font-semibold text-red-700 underline">Official IELTS Writing descriptors</a>
  </details>
}
