import { useCopy } from '@/i18n/interface'
import UiText from '@/components/common/UiText'
import type { QuestionRow } from '@/features/sat/bankPractice'
import { practiceLevel, type HardProgress } from '@/features/sat/hardQuestions'
import { isSATAnswerCorrect } from '@/features/sat/practiceTest4'

export default function PracticeProgressSummary({ rows, progress }: { rows: QuestionRow[]; progress: HardProgress }) {
  const { c: uiCopy } = useCopy()
  const solved = (row: QuestionRow) => progress[row.key]?.checked && isSATAnswerCorrect(row.question, progress[row.key].answer)
  const count = rows.filter(solved).length
  const circumference = 2 * Math.PI * 34
  return <section className="practice-progress-summary" aria-label={uiCopy("Practice progress")}>
    <div className="practice-progress-ring"><svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="34" className="practice-ring-track" /><circle cx="40" cy="40" r="34" className="practice-ring-value" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - (rows.length ? count / rows.length : 0))} /></svg><div><strong>{count}<small>/{rows.length}</small></strong><span><UiText text={"solved"} /></span></div></div>
    <div className="practice-progress-copy"><h3><UiText text={"Your practice, at a glance"} /></h3><p><UiText text={"Build your record one correct answer at a time."} /></p></div>
    <div className="practice-level-progress">{(['easy','medium','hard'] as const).map(level => {
      const questions = rows.filter(row => practiceLevel(row.question.difficulty) === level)
      const completed = questions.filter(solved).length
      return <div className={`is-${level}`} key={level}><span>{level}<strong>{completed} / {questions.length}</strong></span><i><b style={{ width: `${questions.length ? completed / questions.length * 100 : 0}%` }} /></i></div>
    })}</div>
  </section>
}
