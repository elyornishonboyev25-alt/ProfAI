import type { ReactNode } from 'react'

export default function QuestionNumber({ children }: { children: ReactNode }) {
  return <span className="exam-question-number">{children}</span>
}
