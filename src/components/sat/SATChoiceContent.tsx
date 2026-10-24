import type { SATStructuredChoice } from '@/features/sat/practiceTest4QuestionCorrections'
import SATRichText from './SATRichText'
import SATSourceContent from './SATSourceContent'
import './SATChoiceContent.css'

/** Keep answer notation aligned with its letter in both tests and saved review. */
export default function SATChoiceContent({ choice }: { choice: SATStructuredChoice }) {
  return <div className="sat-choice-content">
    {choice.image ? <img src={choice.image} alt={`Choice ${choice.key}`} className="mb-2 max-h-56 max-w-full rounded-lg object-contain" /> : null}
    {choice.html ? <SATSourceContent html={choice.html} /> : <SATRichText text={choice.text} inlineMath />}
  </div>
}
