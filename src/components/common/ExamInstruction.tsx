import { Fragment } from 'react'
import '@/styles/exam-instructions.css'

// Preserve the original wording while making answer limits easy to spot.
import { answerLimit } from '@/utils/examInstructions'

export default function ExamInstruction({ text }: { text?: string }) {
  return <>{(text ?? '').split(answerLimit).map((part, index) => index % 2
    ? <strong className="exam-answer-limit" key={index}>{part}</strong>
    : <Fragment key={index}>{part}</Fragment>)}</>
}
