import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Bookmark,
  Calculator,
  CheckCircle2,
  Filter,
  History,
  RotateCcw,
  Target,
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import DesmosDrawer from '@/components/sat/DesmosDrawer'
import SATQuestionCanvas from '@/components/sat/SATQuestionCanvas'
import SATRichText from '@/components/sat/SATRichText'
import { getSATReviewTests, SAT_TEST_CATALOG } from '@/features/sat/catalog'
import { loadSATAttempt, loadSATAttemptHistory } from '@/features/sat/attemptStorage'
import {
  isSATAnswerCorrect,
  type SATQuestion,
} from '@/features/sat/practiceTest4'
import { useAuthStore } from '@/store/authStore'
import './SATQuestionBank.css'

type QuestionRow = { key: string; question: SATQuestion; testNumber: number }
type Result = {
  key: string
  section: string
  domain: string
  skill: string
  correct: boolean
  at: string
  answer?: string
  setId?: string
  flagged?: boolean
}
type ReviewFilter = 'all' | 'incorrect' | 'correct' | 'skipped' | 'marked'
const difficulty = (value: SATQuestion['difficulty']) =>
  value === 'Foundation' ? 'Easy' : value === 'Advanced' ? 'Hard' : value
const historyKey = (userId: string) => `profai:sat:question-bank:${userId}:v1`
function readHistory(userId: string): Result[] {
  try {
    const data: unknown = JSON.parse(
      window.localStorage.getItem(historyKey(userId)) ?? '[]',
    )
    return Array.isArray(data)
      ? data.filter((row): row is Result =>
          Boolean(
            row &&
            typeof row.key === 'string' &&
            typeof row.section === 'string' &&
            typeof row.domain === 'string' &&
            typeof row.skill === 'string' &&
            typeof row.correct === 'boolean' &&
            typeof row.at === 'string' &&
            Number.isFinite(Date.parse(row.at)) &&
            (row.answer === undefined || typeof row.answer === 'string') &&
            (row.setId === undefined || typeof row.setId === 'string') &&
            (row.flagged === undefined || typeof row.flagged === 'boolean'),
          ),
        ).map((row) => ({ ...row, key: reviewQuestions.get(row.key)?.key ?? row.key }))
      : []
  } catch {
    return []
  }
}
const questionKey = (question: SATQuestion, testId: string) =>
  `${question.section}:${question.sourceQuestionId ?? `${testId.replace(/-(math|reading-writing)$/, '')}:${question.id}`}`
const allQuestions: QuestionRow[] = (() => {
  const used = new Set<string>()
  return Object.values(SAT_TEST_CATALOG)
    .sort((a, b) => a.mockId - b.mockId)
    .flatMap((test) =>
      test.modules.flatMap((module) =>
        module.questions.flatMap((question) => {
          const key = questionKey(question, test.id)
          if (used.has(key)) return []
          used.add(key)
          return [{ key, question, testNumber: test.mockId }]
        }),
      ),
    )
})()
// Include retired catalog questions when reopening older practice sets.
const reviewQuestions = new Map(
  getSATReviewTests().flatMap((test) =>
    test.modules.flatMap((module) =>
      module.questions.map(
        (question) =>
          [
            questionKey(question, test.id),
            { key: questionKey(question, test.id), question, testNumber: test.mockId },
          ] as const,
      ),
    ),
  ),
)
allQuestions.forEach((row) => reviewQuestions.set(row.key, row))
// Older bank sets used module positions as keys. They selected the first
// catalog occurrence, so preserve that exact question when reopening them.
allQuestions.forEach((row) => {
  const legacyKey = `${row.question.section}:${row.question.sourceQuestionId ?? row.question.id}`
  if (!reviewQuestions.has(legacyKey)) reviewQuestions.set(legacyKey, row)
})
const outcome = (result: Result): Exclude<ReviewFilter, 'all' | 'marked'> =>
  result.correct ? 'correct' : result.answer === '' ? 'skipped' : 'incorrect'
const outcomeLabel = {
  correct: 'Correct',
  incorrect: 'Incorrect',
  skipped: 'Skipped',
  marked: 'Marked for Review',
}
const dateLabel = (at: string) =>
  new Date(at).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

function mockResults(): Result[] {
  const definitions = getSATReviewTests()
  const tests = new Map(definitions.map((test) => [test.id, test]))
  // Include old per-test slots and answers in mocks that were saved on exit.
  const slots = definitions.flatMap((test) => {
    const attempt = loadSATAttempt(test.id)
    return attempt ? [attempt] : []
  })
  const attempts = new Map(
    [...loadSATAttemptHistory().map((entry) => entry.attempt), ...slots]
      .sort((left, right) => (left.submittedAt ?? left.updatedAt) - (right.submittedAt ?? right.updatedAt))
      .map((attempt) => [attempt.attemptId, attempt] as const),
  )
  return [...attempts.values()].flatMap((attempt) => {
    const test = tests.get(attempt.testId)
    if (!test) return []
    const timestamp = attempt.submittedAt ?? attempt.updatedAt
    if (!Number.isFinite(timestamp)) return []
    const at = new Date(timestamp).toISOString()
    return test.modules.flatMap((module) =>
      module.questions.flatMap((question) => {
        const answer = attempt.answers?.[question.id]?.trim() ?? ''
        if (attempt.status !== 'submitted' && !answer) return []
        return [{
          key: questionKey(question, test.id),
          section: question.section,
          domain: question.domain,
          skill: question.skill,
          correct: isSATAnswerCorrect(question, answer),
          answer,
          at,
        }]
      }),
    )
  })
}

// A keyed workspace keeps practice and history isolated when the account changes.
export default function SATQuestionBank() {
  const userId = useAuthStore((state) => state.user?.id) ?? 'guest'
  return <QuestionBankWorkspace key={userId} userId={userId} />
}
function QuestionBankWorkspace({ userId }: { userId: string }) {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [section, setSection] = useState(
    ['math', 'reading-writing'].includes(params.get('section') ?? '')
      ? params.get('section')!
      : 'all',
  )
  const [domain, setDomain] = useState('all')
  const [skill, setSkill] = useState(params.get('skill') ?? 'all')
  const [level, setLevel] = useState('all')
  const [status, setStatus] = useState(
    ['unanswered', 'incorrect'].includes(params.get('status') ?? '') ? params.get('status')! : 'all',
  )
  const [count, setCount] = useState(
    [4, 6, 10, 15, 20, 30].includes(Number(params.get('count')))
      ? Number(params.get('count'))
      : 10,
  )
  const [history, setHistory] = useState(() => readHistory(userId))
  const [quiz, setQuiz] = useState<QuestionRow[]>([])
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [flagged, setFlagged] = useState<string[]>([])
  const [calculatorOpen, setCalculatorOpen] = useState(false)
  const [calculatorDocked, setCalculatorDocked] = useState(false)
  const [error, setError] = useState('')
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('all')
  const [reviewIndex, setReviewIndex] = useState(0)
  const reviewId = params.get('review')
  const historyView = params.get('view') === 'history' || Boolean(reviewId)
  const [mockHistory, setMockHistory] = useState(mockResults)
  useEffect(() => {
    const refresh = () => {
      setHistory(readHistory(userId))
      setMockHistory(mockResults())
    }
    window.addEventListener('focus', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('focus', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [userId])
  const latest = useMemo(() => {
    const result = new Map<string, Result>()
    for (const row of [...mockHistory, ...history].sort((a, b) =>
      a.at.localeCompare(b.at),
    ))
      result.set(row.key, row)
    return result
  }, [history, mockHistory])
  const markedKeys = useMemo(() => {
    const marks = new Map<string, boolean>()
    for (const row of [...history].sort((a, b) => a.at.localeCompare(b.at))) {
      marks.set(row.key, row.flagged === true)
    }
    return new Set([...marks].filter(([, marked]) => marked).map(([key]) => key))
  }, [history])
  const sets = useMemo(() => {
    const grouped = new Map<string, Result[]>()
    history.forEach((row) => {
      const id = row.setId ?? row.at
      grouped.set(id, [...(grouped.get(id) ?? []), row])
    })
    return [...grouped]
      .map(([id, results]) => ({
        id,
        results,
        at: results[0].at,
        correct: results.filter((row) => row.correct).length,
      }))
      .sort((a, b) => b.at.localeCompare(a.at))
  }, [history])
  const reviewSet = sets.find((set) => set.id === reviewId)
  const reviewRows =
    reviewSet?.results
      .map((result, number) => ({
        result,
        number: number + 1,
        row: reviewQuestions.get(result.key),
      }))
      .filter(
        (item) =>
          reviewFilter === 'all' ||
          (reviewFilter === 'marked'
            ? item.result.flagged
            : outcome(item.result) === reviewFilter),
      ) ?? []
  const review =
    reviewRows[Math.min(reviewIndex, Math.max(0, reviewRows.length - 1))]
  useEffect(() => {
    setReviewIndex(0)
    setReviewFilter('all')
    window.scrollTo(0, 0)
  }, [reviewId])
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [index, reviewIndex])
  const goTo = (view: 'practice' | 'history', id?: string) => {
    setParams((current) => {
      current.delete('review')
      current.delete('view')
      if (view === 'history') current.set('view', 'history')
      if (id) current.set('review', id)
      return current
    })
  }
  const domains = useMemo(
    () =>
      [
        ...new Set(
          allQuestions
            .filter(
              (row) => section === 'all' || row.question.section === section,
            )
            .map((row) => row.question.domain),
        ),
      ].sort(),
    [section],
  )
  const skills = useMemo(
    () =>
      [
        ...new Set(
          allQuestions
            .filter(
              (row) =>
                (section === 'all' || row.question.section === section) &&
                (domain === 'all' || row.question.domain === domain),
            )
            .map((row) => row.question.skill),
        ),
      ].sort(),
    [section, domain],
  )
  const filtered = useMemo(
    () =>
      allQuestions.filter((row) => {
        const question = row.question
        const prior = latest.get(row.key)
        return (
          (section === 'all' || question.section === section) &&
          (domain === 'all' || question.domain === domain) &&
          (skill === 'all' || question.skill === skill) &&
          (level === 'all' || difficulty(question.difficulty) === level) &&
          (status === 'all' ||
            (status === 'unanswered' && !prior) ||
            (status === 'incorrect' && prior?.correct === false) ||
            (status === 'marked' && markedKeys.has(row.key)))
        )
      }),
    [section, domain, skill, level, status, latest, markedKeys],
  )
  const skillStats = useMemo(() => {
    const stats = new Map<string, { correct: number; total: number }>()
    for (const item of [...mockHistory, ...history]) {
      const key = `${item.section}:${item.skill}`
      const row = stats.get(key) ?? { correct: 0, total: 0 }
      row.total++
      if (item.correct) row.correct++
      stats.set(key, row)
    }
    return [...stats]
      .filter(([, value]) => value.total >= 4)
      .sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total)
      .slice(0, 5)
  }, [history, mockHistory])
  const start = () => {
    const priority = (row: QuestionRow) =>
      latest.get(row.key)?.correct === false ? 0 : latest.has(row.key) ? 2 : 1
    setQuiz(
      [...filtered].sort((a, b) => priority(a) - priority(b)).slice(0, count),
    )
    setIndex(0)
    setAnswers({})
    setFlagged(
      filtered.filter((row) => markedKeys.has(row.key)).map((row) => row.key),
    )
    setError('')
  }
  const complete = () => {
    const at = new Date().toISOString()
    const setId = crypto.randomUUID()
    const results: Result[] = quiz.map((row) => ({
      key: row.key,
      section: row.question.section,
      domain: row.question.domain,
      skill: row.question.skill,
      correct: isSATAnswerCorrect(row.question, answers[row.key]),
      answer: answers[row.key]?.trim() ?? '',
      at,
      setId,
      flagged: flagged.includes(row.key),
    }))
    const next = [...history, ...results]
    try {
      window.localStorage.setItem(historyKey(userId), JSON.stringify(next))
      setHistory(next)
      setQuiz([])
      setError('')
      goTo('history', setId)
    } catch {
      setError(
        'Your results could not be saved. Free up browser storage and try Finish set again. Your answers are still here.',
      )
    }
  }
  const current = quiz[index]
  const mathVisible =
    (historyView ? review?.row?.question.section : current?.question.section) === 'math'
  useEffect(() => {
    setCalculatorOpen(false)
  }, [mathVisible, historyView, reviewId])
  const calculatorButton = mathVisible ? (
    <button
      type="button"
      className="sat-bank-calculator"
      aria-expanded={calculatorOpen}
      aria-label={calculatorOpen ? 'Close Desmos calculator' : 'Open Desmos calculator'}
      onClick={() => setCalculatorOpen((value) => !value)}
    >
      <Calculator size={18} /> Desmos
    </button>
  ) : null
  const reset = () => {
    setSection('all')
    setDomain('all')
    setSkill('all')
    setLevel('all')
    setStatus('all')
  }
  return (
    <main className="sat-bank-page">
      <div className={`sat-bank-wrap ${mathVisible && calculatorOpen && calculatorDocked ? 'sat-bank-calculator-docked' : ''}`}>
        <button
          type="button"
          className="sat-bank-back"
          onClick={() => navigate('/sat')}
        >
          <ArrowLeft size={16} /> SAT Arena
        </button>
        <header className="sat-bank-hero">
          <span>
            <Filter size={15} /> TARGETED SAT PRACTICE
          </span>
          <h1>
            Question Bank<span>.</span>
          </h1>
          <p>
            Practice at your pace. Keep your results, revisit every question and
            turn mistakes into progress.
          </p>
          <div>
            <strong>{allQuestions.length}</strong> questions{' '}
            <strong>{sets.length}</strong> saved sets
          </div>
        </header>
        <nav className="sat-bank-tabs" aria-label="Question bank views">
          <button
            type="button"
            aria-current={!historyView ? 'page' : undefined}
            onClick={() => goTo('practice')}
          >
            <BookOpenCheck size={18} /> Practice
          </button>
          <button
            type="button"
            aria-current={historyView ? 'page' : undefined}
            onClick={() => goTo('history')}
          >
            <History size={18} /> History & review <span>{sets.length}</span>
          </button>
        </nav>
        {historyView ? (
          reviewSet ? (
            <section className="sat-bank-panel">
              <button
                type="button"
                className="sat-bank-back"
                onClick={() => goTo('history')}
              >
                <ArrowLeft size={16} /> All saved sets
              </button>
              <div className="sat-bank-review-heading">
                <div>
                  <p className="sat-bank-eyebrow">
                    SET REVIEW · {dateLabel(reviewSet.at)}
                  </p>
                  <h2>
                    {reviewSet.correct} of {reviewSet.results.length} correct
                  </h2>
                  <p className="sat-bank-muted">
                    Read the original question, compare answers and understand
                    the explanation.
                  </p>
                </div>
                <strong className="sat-bank-score">
                  {Math.round(
                    (reviewSet.correct / reviewSet.results.length) * 100,
                  )}
                  %
                </strong>
              </div>
              <div
                className="sat-bank-review-filters"
                aria-label="Filter reviewed questions"
              >
                {(['all', 'incorrect', 'correct', 'skipped', 'marked'] as const).map(
                  (value) => (
                    <button
                      type="button"
                      key={value}
                      aria-pressed={reviewFilter === value}
                      onClick={() => {
                        setReviewFilter(value)
                        setReviewIndex(0)
                      }}
                    >
                      {value === 'all' ? 'All questions' : outcomeLabel[value]}{' '}
                      <span>
                        {
                          reviewSet.results.filter(
                            (row) => value === 'all' ||
                              (value === 'marked' ? row.flagged : outcome(row) === value),
                          ).length
                        }
                      </span>
                    </button>
                  ),
                )}
              </div>
              {review ? (
                <div className="sat-bank-review-layout">
                  <aside
                    className="sat-bank-navigator"
                    aria-label="Saved question navigator"
                  >
                    <p>Questions</p>
                    <div>
                      {reviewRows.map((item, position) => (
                        <button
                          type="button"
                          key={`${item.result.key}-${item.number}`}
                          className={`sat-bank-number ${outcome(item.result)}`}
                          aria-label={`Review question ${item.number}: ${outcomeLabel[outcome(item.result)]}${item.result.flagged ? ', Marked for Review' : ''}`}
                          aria-current={review === item ? 'step' : undefined}
                          onClick={() => setReviewIndex(position)}
                        >
                          {item.number}
                          {item.result.flagged ? <Bookmark size={12} className="sat-bank-mark-icon" aria-hidden="true" /> : null}
                        </button>
                      ))}
                    </div>
                  </aside>
                  <article className="sat-bank-review-detail">
                    <div className="sat-bank-detail-title">
                      <h3>Question {review.number}</h3>
                      {calculatorButton}
                      <span
                        className={`sat-bank-outcome ${outcome(review.result)}`}
                      >
                        {outcomeLabel[outcome(review.result)]}
                      </span>
                    </div>
                    {review.row ? (
                      <>
                        <p className="sat-bank-question-meta">
                          {review.row.question.domain} ·{' '}
                          {review.row.question.skill}
                        </p>
                        <div className="sat-bank-question">
                          <SATQuestionCanvas
                            key={`${reviewId}-${review.number}`}
                            question={review.row.question}
                            answer={review.result.answer ?? ''}
                            onAnswer={() => {}}
                            strokes={[]}
                            highlightAvailable={false}
                            onChange={() => {}}
                            flagged={review.result.flagged ?? false}
                            onToggleFlag={() => {}}
                            readOnly
                            answerState={
                              review.result.correct ? 'correct' : 'incorrect'
                            }
                          />
                        </div>
                        <div className="sat-bank-answer-summary">
                          <div>
                            <span>Your answer</span>
                            <strong>
                              {review.result.answer === undefined
                                ? 'Not recorded in older results'
                                : review.result.answer || 'Skipped'}
                            </strong>
                          </div>
                          <div>
                            <span>Correct answer</span>
                            <strong>{review.row.question.correctAnswer}</strong>
                          </div>
                        </div>
                        <section className="sat-bank-explanation">
                          <h4>Explanation</h4>
                          <SATRichText text={review.row.question.explanation} />
                        </section>
                      </>
                    ) : (
                      <p role="status" className="sat-bank-muted">
                        This question is no longer in the catalog. Its saved
                        result is still available.
                      </p>
                    )}
                    <div className="sat-bank-review-pagination">
                      <button
                        type="button"
                        disabled={reviewIndex === 0}
                        onClick={() => setReviewIndex((value) => value - 1)}
                      >
                        <ArrowLeft size={16} /> Previous
                      </button>
                      <span>
                        {Math.min(reviewIndex + 1, reviewRows.length)} /{' '}
                        {reviewRows.length}
                      </span>
                      <button
                        type="button"
                        disabled={reviewIndex >= reviewRows.length - 1}
                        onClick={() => setReviewIndex((value) => value + 1)}
                      >
                        Next <ArrowRight size={16} />
                      </button>
                    </div>
                  </article>
                </div>
              ) : (
                <div className="sat-bank-empty">
                  <CheckCircle2 size={30} />
                  <h3>No {reviewFilter} questions in this set</h3>
                  <p>Choose another filter to continue reviewing.</p>
                </div>
              )}
            </section>
          ) : (
            <section className="sat-bank-panel">
              <div className="sat-bank-panel-title">
                <h2>Your practice history</h2>
                <History size={22} />
              </div>
              <p className="sat-bank-muted">
                Open any saved set to review its questions and explanations.
                Results are saved in this browser.
              </p>
              {reviewId ? (
                <p role="status" className="sat-bank-alert">
                  This saved set is unavailable. Choose a result below.
                </p>
              ) : null}
              <div className="sat-bank-history">
                {sets.length ? (
                  sets.map((set) => (
                    <button
                      type="button"
                      key={set.id}
                      className="sat-bank-history-card"
                      onClick={() => goTo('history', set.id)}
                      aria-label={`Review set saved ${dateLabel(set.at)}`}
                    >
                      <span className="sat-bank-history-icon">
                        <BookOpenCheck size={22} />
                      </span>
                      <span className="sat-bank-history-info">
                        <strong>
                          {set.results.length}-question practice set
                        </strong>
                        <small>{dateLabel(set.at)}</small>
                        <span>
                          {set.correct} correct ·{' '}
                          {
                            set.results.filter(
                              (row) => outcome(row) === 'incorrect',
                            ).length
                          }{' '}
                          incorrect ·{' '}
                          {
                            set.results.filter(
                              (row) => outcome(row) === 'skipped',
                            ).length
                          }{' '}
                          skipped
                        </span>
                      </span>
                      <span className="sat-bank-history-action">
                        <strong>
                          {Math.round((set.correct / set.results.length) * 100)}
                          %
                        </strong>
                        <span>
                          Review answers <ArrowRight size={16} />
                        </span>
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="sat-bank-empty">
                    <History size={32} />
                    <h3>Your next result starts here</h3>
                    <p>
                      Finish a practice set to save your answers and review them
                      anytime.
                    </p>
                    <button
                      type="button"
                      className="sat-bank-primary"
                      onClick={() => goTo('practice')}
                    >
                      Build a question set <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </div>
              <button
                type="button"
                className="sat-bank-mock-link"
                onClick={() => navigate('/sat/mistakes')}
              >
                Looking for full mock or section results? Open SAT Mistake Lab{' '}
                <ArrowRight size={16} />
              </button>
            </section>
          )
        ) : !current ? (
          <div className="sat-bank-grid">
            <section className="sat-bank-panel">
              <div className="sat-bank-panel-title">
                <h2>Build a question set</h2>
                <span>{filtered.length} matching</span>
              </div>
              <div className="sat-bank-filters">
                <label>
                  Section
                  <select
                    value={section}
                    onChange={(event) => {
                      setSection(event.target.value)
                      setDomain('all')
                      setSkill('all')
                    }}
                  >
                    <option value="all">Math + Reading & Writing</option>
                    <option value="math">Math</option>
                    <option value="reading-writing">Reading & Writing</option>
                  </select>
                </label>
                <label>
                  Domain / topic
                  <select
                    value={domain}
                    onChange={(event) => {
                      setDomain(event.target.value)
                      setSkill('all')
                    }}
                  >
                    <option value="all">All domains</option>
                    {domains.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Skill / question type
                  <select
                    value={skill}
                    onChange={(event) => setSkill(event.target.value)}
                  >
                    <option value="all">All skills</option>
                    {skills.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Difficulty
                  <select
                    value={level}
                    onChange={(event) => setLevel(event.target.value)}
                  >
                    <option value="all">All levels</option>
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </label>
                <label>
                  Progress
                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                  >
                    <option value="all">All questions</option>
                    <option value="unanswered">Not attempted</option>
                    <option value="incorrect">Previously incorrect</option>
                    <option value="marked">Marked for Review</option>
                  </select>
                </label>
                <label>
                  Questions in set
                  <select
                    value={count}
                    onChange={(event) => setCount(Number(event.target.value))}
                  >
                    {[4, 6, 10, 15, 20, 30].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {!filtered.length ? (
                <p role="status" className="sat-bank-alert">
                  No questions match these filters.{' '}
                  <button type="button" onClick={reset}>
                    Reset filters
                  </button>
                </p>
              ) : null}
              <button
                type="button"
                className="sat-bank-primary"
                onClick={start}
                disabled={!filtered.length}
              >
                Start {Math.min(count, filtered.length)} questions{' '}
                <ArrowRight size={17} />
              </button>
            </section>
            <aside className="sat-bank-panel">
              <div className="sat-bank-panel-title">
                <h2>Skills to strengthen</h2>
                <Target size={20} />
              </div>
              {skillStats.length ? (
                <div className="sat-bank-skills">
                  {skillStats.map(([key, stat]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        const [area, ...rest] = key.split(':')
                        setSection(area)
                        setDomain('all')
                        setSkill(rest.join(':'))
                        setLevel('all')
                        setStatus('all')
                      }}
                    >
                      <span>{key.split(':').slice(1).join(':')}</span>
                      <strong>
                        {stat.correct}/{stat.total} correct
                      </strong>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="sat-bank-muted">
                  Complete at least four questions in a skill to see reliable
                  recommendations.
                </p>
              )}
              <p className="sat-bank-muted">
                Completed mocks and question sets contribute to this view.
              </p>
              <button
                type="button"
                className="sat-bank-mock-link"
                onClick={() => goTo('history')}
              >
                Review past question sets <ArrowRight size={16} />
              </button>
            </aside>
          </div>
        ) : (
          <section className="sat-bank-session">
            <div className="sat-bank-session-top">
              <div>
                <span>
                  QUESTION {index + 1} / {quiz.length}
                </span>
                <h2>{current.question.skill}</h2>
              </div>
              {calculatorButton}
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      'Leave this unfinished set? Your current answers have not been saved.',
                    )
                  ) {
                    setQuiz([])
                    setError('')
                  }
                }}
              >
                <RotateCcw size={16} /> Filters
              </button>
            </div>
            <div
              className="sat-bank-progress"
              role="progressbar"
              aria-label="Questions answered"
              aria-valuemin={0}
              aria-valuemax={quiz.length}
              aria-valuenow={
                quiz.filter((row) => answers[row.key]?.trim()).length
              }
            >
              <span
                style={{
                  width: `${(quiz.filter((row) => answers[row.key]?.trim()).length / quiz.length) * 100}%`,
                }}
              />
            </div>
            <nav className="sat-bank-practice-navigator sat-bank-navigator" aria-label="Practice question navigator">
              <p>Questions · {quiz.filter((row) => flagged.includes(row.key)).length} marked for review</p>
              <div>
                {quiz.map((row, position) => (
                  <button
                    type="button"
                    key={row.key}
                    className={`sat-bank-number ${answers[row.key]?.trim() ? 'answered' : ''}`}
                    aria-label={`Go to question ${position + 1}${flagged.includes(row.key) ? ', Marked for Review' : ''}${answers[row.key]?.trim() ? ', Answered' : ', Unanswered'}`}
                    aria-current={index === position ? 'step' : undefined}
                    onClick={() => setIndex(position)}
                  >
                    {position + 1}
                    {flagged.includes(row.key) ? <Bookmark size={12} className="sat-bank-mark-icon" aria-hidden="true" /> : null}
                  </button>
                ))}
              </div>
            </nav>
            <div className="sat-bank-question">
              <SATQuestionCanvas
                question={current.question}
                answer={answers[current.key] ?? ''}
                onAnswer={(answer) =>
                  setAnswers((currentAnswers) => ({
                    ...currentAnswers,
                    [current.key]: answer,
                  }))
                }
                strokes={[]}
                highlightAvailable={false}
                onChange={() => {}}
                flagged={flagged.includes(current.key)}
                onToggleFlag={() =>
                  setFlagged((values) =>
                    values.includes(current.key)
                      ? values.filter((key) => key !== current.key)
                      : [...values, current.key],
                  )
                }
              />
            </div>
            {error ? (
              <p role="alert" className="sat-bank-alert">
                {error}
              </p>
            ) : null}
            <div className="sat-bank-session-footer">
              <span>
                {difficulty(current.question.difficulty)} · Practice Test{' '}
                {current.testNumber}
              </span>
              {index ? (
                <button type="button" onClick={() => setIndex(index - 1)}>
                  Previous
                </button>
              ) : null}
              {index + 1 < quiz.length ? (
                <button
                  type="button"
                  className="sat-bank-primary"
                  onClick={() => setIndex(index + 1)}
                >
                  Next <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  className="sat-bank-primary"
                  onClick={complete}
                >
                  Finish set <BookOpenCheck size={16} />
                </button>
              )}
            </div>
            <p className="sat-bank-muted">
              {quiz.filter((row) => answers[row.key]?.trim()).length} of{' '}
              {quiz.length} answered. Unanswered questions will be marked as
              skipped when you finish.
            </p>
          </section>
        )}
      </div>
      <DesmosDrawer
        open={mathVisible && calculatorOpen}
        preload={mathVisible}
        docked={calculatorDocked}
        onDockedChange={setCalculatorDocked}
        onClose={() => setCalculatorOpen(false)}
      />
    </main>
  )
}
