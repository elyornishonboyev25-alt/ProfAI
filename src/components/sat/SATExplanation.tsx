import { useMemo } from 'react'
import { getSATReviewTests } from '@/features/sat/catalog'
import { buildSATExplanation, type ExplanationPart } from '@/features/sat/explanations'
import { isSATAnswerCorrect, type SATQuestion } from '@/features/sat/practiceTest4'
import SATChoiceContent from './SATChoiceContent'
import SATRichText from './SATRichText'
import SATSourceContent from './SATSourceContent'
import './SATExplanation.css'

const signature = (question: SATQuestion) => `${question.sourceQuestionId ?? `${question.prompt}\n${question.asset}\n${question.visual?.asset ?? ''}`}\n${question.correctAnswer}`
let currentExplanations: Map<string, SATQuestion> | undefined
function reviewedQuestion(question: SATQuestion) {
  // Saved attempts can contain an old copy of the question. Resolve reviewed
  // explanations without changing the attempt's answers, choices, or scoring.
  currentExplanations ??= new Map(getSATReviewTests().flatMap((test) =>
    test.modules.flatMap((module) => module.questions.map((q) => [signature(q), q] as const))))
  return currentExplanations.get(signature(question)) ?? question
}

function Content({ part }: { part: ExplanationPart }) {
  return part.html ? <SATSourceContent html={part.content} /> : <SATRichText text={part.content} />
}

export default function SATExplanation({ question, response, className = '' }: {
  question: SATQuestion
  response?: string
  className?: string
}) {
  const reviewed = reviewedQuestion(question)
  const model = useMemo(() => buildSATExplanation(reviewed), [reviewed])
  const choice = question.choices.find((item) => item.key === question.correctAnswer)
  const hasResponse = Boolean(response?.trim())
  const correct = hasResponse && isSATAnswerCorrect(question, response!)
  const accepted = [...new Set(question.acceptedAnswers ?? [])].filter((answer) => answer !== question.correctAnswer)
  return <div className={`sat-explanation ${className}`}>
    <div className="sat-explanation-answer">
      <span className="sat-explanation-label">Correct answer</span>
      <div className="sat-explanation-answer-value">
        {choice ? <><strong className="sat-explanation-letter">{choice.key}</strong><SATChoiceContent choice={choice} /></>
          : <SATRichText text={`$${question.correctAnswer}$`} inlineMath />}
      </div>
      {question.kind === 'student-response' && accepted.length > 0 &&
        <p className="sat-explanation-accepted">Also accepted: {accepted.join(', ')}. Equivalent fractions are accepted.</p>}
      {hasResponse && <p className={`sat-explanation-response ${correct ? 'is-correct' : 'is-incorrect'}`}>
        {correct ? 'You answered correctly.' : `Your answer: ${response}. Follow the steps below to see how to reach the correct answer.`}
      </p>}
    </div>
    <h4 className="sat-explanation-heading">{question.section === 'math' ? 'Solve it step by step' : 'Follow the reasoning'}</h4>
    <ol className="sat-explanation-steps" aria-label="Solution steps">
      {model.steps.map((part, index) => <li key={index}>
        <span className="sat-explanation-number" aria-hidden="true">{index + 1}</span>
        <div className="sat-explanation-step"><Content part={part} /></div>
      </li>)}
    </ol>
    {model.alternatives.length > 0 && <section className="sat-explanation-alternatives" aria-label="Why other answers are incorrect">
      <h4 className="sat-explanation-heading">Why the other choices don’t work</h4>
      <ul>{model.alternatives.map((part, index) => <li key={index}><Content part={part} /></li>)}</ul>
    </section>}
  </div>
}
