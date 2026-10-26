import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Bookmark,
  Calculator,
  Check,
  CheckCircle2,
  Filter,
  Grid2X2,
  History,
  RotateCcw,
  Target,
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import DesmosDrawer from '@/components/sat/DesmosDrawer'
import { useAccountDataRevision } from '@/hooks/useAccountDataRevision'
import { useFullscreen } from '@/hooks/useFullscreen'
import { allQuestions, reviewQuestions, questionKey, readHistory, readAttemptedKeys, difficulty, loadBankSession, saveBankSession, type Result } from '@/features/sat/bankPractice'
import SATQuestionCanvas from '@/components/sat/SATQuestionCanvas'
import SATBankSelect from '@/components/sat/SATBankSelect'
import { bankDomain, bankSkill } from '@/features/sat/bankTopics'
import SATRichText from '@/components/sat/SATRichText'
import SATSourceContent from '@/components/sat/SATSourceContent'
import { getSATReviewTests } from '@/features/sat/catalog'
import { loadSATAttempt, loadSATAttemptHistory } from '@/features/sat/attemptStorage'
import { isSATAnswerCorrect } from '@/features/sat/practiceTest4'
import { useAuthStore } from '@/store/authStore'
import './SATQuestionBank.css'

type ReviewFilter = 'all' | 'incorrect' | 'correct' | 'skipped' | 'marked'
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
      : 'math',
  )
  const [domain, setDomain] = useState('all')
  const [skill, setSkill] = useState(() => {
    const requested = params.get('skill')
    const question = allQuestions.find(row => row.question.section === section &&
      (row.question.skill === requested || bankSkill(row.question) === requested))?.question
    return question ? bankSkill(question) : 'all'
  })
  const [level, setLevel] = useState('all')
  const [status, setStatus] = useState(
    ['unanswered', 'incorrect', 'marked'].includes(params.get('status') ?? '') ? params.get('status')! : 'all',
  )
  const [count, setCount] = useState(
    [4, 6, 10, 15, 20, 30].includes(Number(params.get('count')))
      ? Number(params.get('count'))
      : 10,
  )
  const [history, setHistory] = useState(() => readHistory(userId))
  const [activeSet, setActiveSet] = useState(() => loadBankSession(userId))
  const [attemptedKeys, setAttemptedKeys] = useState(() => readAttemptedKeys(userId))
  const accountRevision = useAccountDataRevision()
  const { enter } = useFullscreen()
  const [calculatorOpen, setCalculatorOpen] = useState(false)
  const [calculatorDocked, setCalculatorDocked] = useState(true)
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
      setActiveSet(loadBankSession(userId))
      setAttemptedKeys(readAttemptedKeys(userId))
    }
    refresh()
    window.addEventListener('focus', refresh)
    return () => {
      window.removeEventListener('focus', refresh)
    }
  }, [userId, accountRevision])
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
  const reviewHeading = useRef<HTMLHeadingElement>(null)
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
    if (!reviewId) window.scrollTo({ top: 0, behavior: 'instant' })
  }, [reviewId])
  useLayoutEffect(() => {
    reviewHeading.current?.focus({ preventScroll: true })
    reviewHeading.current?.scrollIntoView?.({ block: 'start', behavior: 'instant' })
  }, [reviewId, reviewIndex, reviewFilter, review?.result.key])
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
              (row) => row.question.section === section,
            )
            .map((row) => bankDomain(row.question.domain)),
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
                (row.question.section === section) &&
                (domain === 'all' || bankDomain(row.question.domain) === domain),
            )
            .map((row) => bankSkill(row.question)),
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
          question.section === section &&
          (domain === 'all' || bankDomain(question.domain) === domain) &&
          (skill === 'all' || bankSkill(question) === skill) &&
          (level === 'all' || difficulty(question.difficulty) === level) &&
          (status === 'all' ||
            (status === 'unanswered' && !prior && !attemptedKeys.has(row.key)) ||
            (status === 'incorrect' && prior?.correct === false && prior.answer !== '') ||
            (status === 'marked' && markedKeys.has(row.key)))
        )
      }),
    [section, domain, skill, level, status, latest, markedKeys, attemptedKeys],
  )
  const skillStats = useMemo(() => {
    const stats = new Map<string, { correct: number; total: number }>()
    for (const item of [...mockHistory, ...history]) {
      const key = `${item.section}:${bankSkill({ section: item.section as 'math' | 'reading-writing', domain: item.domain, skill: item.skill })}`
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
    if (!filtered.length) return
    if (activeSet && !window.confirm('Start a new set and replace your unfinished practice?')) return
    const priority = (row: (typeof allQuestions)[number]) =>
      latest.get(row.key)?.correct === false ? 0 : latest.has(row.key) ? 2 : 1
    const rows = [...filtered].sort((a, b) => priority(a) - priority(b)).slice(0, count)
    const session = {
      id: crypto.randomUUID(),
      keys: rows.map((row) => row.key),
      index: 0,
      answers: {},
      highlights: {},
      flagged: rows.filter((row) => markedKeys.has(row.key)).map((row) => row.key),
      createdAt: new Date().toISOString(),
    }
    try {
      saveBankSession(userId, session)
      void enter()
      navigate(`/sat/question-bank/run/${session.id}`)
    } catch {
      setError('Your practice could not be started. Free up browser storage and try again.')
    }
  }
  const mathVisible = historyView && review?.row?.question.section === 'math'
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
    setDomain('all')
    setSkill('all')
    setLevel('all')
    setStatus('all')
    setError('')
  }
  return (
    <main className="workspace-page sat-bank-page">
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
                    <nav className="sat-bank-review-pagination" aria-label="Review question navigation">
                      <button
                        type="button"
                        disabled={reviewIndex === 0}
                        onClick={() => setReviewIndex((value) => value - 1)}
                      >
                        <ArrowLeft size={16} /> Previous
                      </button>
                      <span aria-live="polite">
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
                    </nav>
                    <div className="sat-bank-detail-title">
                      <h3 ref={reviewHeading} tabIndex={-1}>Question {review.number}</h3>
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
                            practiceLayout
                            key={`${reviewId}-${review.number}`}
                            question={{ ...review.row.question, number: review.number }}
                            answer={review.result.answer ?? ''}
                            onAnswer={() => {}}
                            strokes={review.result.highlights ?? []}
                            eliminatedChoices={review.result.eliminatedChoices ?? []}
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
                          {review.row.question.sourceContent?.explanation ? (
                            <SATSourceContent html={review.row.question.sourceContent.explanation} />
                          ) : (
                            <SATRichText text={review.row.question.explanation} />
                          )}
                        </section>
                      </>
                    ) : (
                      <p role="status" className="sat-bank-muted">
                        This question is no longer in the catalog. Its saved
                        result is still available.
                      </p>
                    )}
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
        ) : (
          <div className="sat-bank-grid">
            <section className="sat-bank-panel">
              <div className="sat-bank-panel-title">
                <h2>Build a question set</h2>
                <span className="sat-bank-matching" role="status" aria-live="polite">{filtered.length} matching</span>
              </div>
              <p className="sat-bank-builder-intro">Choose your focus. Make this practice your own.</p>
              {activeSet ? (
                <div className="sat-bank-resume" role="status">
                  <p>You have an unfinished {activeSet.keys.length}-question set. Your answers are saved.</p>
                  <button type="button" className="sat-bank-primary" onClick={() => {
                    void enter()
                    navigate(`/sat/question-bank/run/${activeSet.id}`)
                  }}>Resume practice <ArrowRight size={17} /></button>
                </div>
              ) : null}
              {error ? <p role="alert" className="sat-bank-alert">{error}</p> : null}
              <div className="sat-bank-filters">
                <fieldset className="sat-bank-choice-field sat-bank-section-field" aria-label="Section">
                  <legend>Section</legend>
                  <div className="sat-bank-section-options">
                    {[
                      { value: 'math', label: 'Math', detail: 'Equations, data & problem solving', Icon: Calculator },
                      { value: 'reading-writing', label: 'Reading & Writing', detail: 'Comprehension, grammar & expression', Icon: BookOpenCheck },
                    ].map(({ value, label, detail, Icon }) => (
                      <label key={value} className="sat-bank-section-option">
                        <input type="radio" name="bank-section" value={value} checked={section === value}
                          aria-label={label} onChange={() => { setSection(value); setDomain('all'); setSkill('all'); setError('') }} />
                        <Icon size={21} aria-hidden="true" />
                        <span><strong>{label}</strong><small>{detail}</small></span>
                        <Check size={16} className="sat-bank-choice-check" aria-hidden="true" />
                      </label>
                    ))}
                  </div>
                </fieldset>
                <SATBankSelect label="Domain / topic" value={domain}
                  options={[{ value: 'all', label: 'All domains' }, ...domains.map(value => ({ value, label: value }))]}
                  onChange={value => { setDomain(value); setSkill('all') }} />
                <SATBankSelect label="Skill / question type" value={skill}
                  options={[{ value: 'all', label: 'All skills' }, ...skills.map(value => ({ value, label: value }))]}
                  onChange={setSkill} />
                <fieldset className="sat-bank-choice-field sat-bank-difficulty-field" aria-label="Difficulty">
                  <legend>Difficulty</legend>
                  <div className="sat-bank-difficulty-options">
                    {['all', 'Easy', 'Medium', 'Hard'].map((value, index) => (
                      <label key={value}>
                        <input type="radio" name="bank-difficulty" value={value} checked={level === value}
                          aria-label={value === 'all' ? 'All levels' : value} onChange={() => setLevel(value)} />
                        {index ? <span className="sat-bank-level-bars" aria-hidden="true">
                          {[1, 2, 3].map(bar => <i key={bar} data-filled={bar <= index} />)}
                        </span> : <Grid2X2 size={16} aria-hidden="true" />}
                        <span>{value === 'all' ? 'All levels' : value}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <fieldset className="sat-bank-choice-field sat-bank-progress-field" aria-label="Progress">
                  <legend>Progress</legend>
                  <div className="sat-bank-progress-options">
                    {[
                      { value: 'all', label: 'All questions', Icon: Grid2X2 },
                      { value: 'unanswered', label: 'Not attempted', Icon: BookOpenCheck },
                      { value: 'incorrect', label: 'Previously incorrect', Icon: RotateCcw },
                      { value: 'marked', label: 'Marked for Review', Icon: Bookmark },
                    ].map(({ value, label, Icon }) => (
                      <label key={value}>
                        <input type="radio" name="bank-progress" value={value} checked={status === value}
                          aria-label={label} onChange={() => setStatus(value)} />
                        <Icon size={16} aria-hidden="true" /><span>{label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <fieldset className="sat-bank-choice-field sat-bank-count-field" aria-label="Questions in set">
                  <legend>Questions in set</legend>
                  <div className="sat-bank-count-options">
                    {[4, 6, 10, 15, 20, 30].map(value => (
                      <label key={value}>
                        <input type="radio" name="bank-count" value={value} checked={count === value}
                          aria-label={String(value)} onChange={() => setCount(value)} />
                        <span>{value}</span>
                      </label>
                    ))}
                  </div>
                  {filtered.length > 0 && filtered.length < count ? (
                    <p className="sat-bank-count-note" role="status">Only {filtered.length} {filtered.length === 1 ? 'question matches' : 'questions match'} your filters. Your set will include {filtered.length === 1 ? 'it' : 'all of them'}.</p>
                  ) : null}
                </fieldset>
              </div>
              {!filtered.length ? (
                <p role="status" className="sat-bank-alert">
                  No questions match these filters.{' '}
                  <button type="button" onClick={reset}>
                    Reset filters
                  </button>
                </p>
              ) : null}
              <div className="sat-bank-set-summary" aria-live="polite">
                <BookOpenCheck size={18} aria-hidden="true" />
                <span><strong>{Math.min(count, filtered.length)} {Math.min(count, filtered.length) === 1 ? 'question' : 'questions'}</strong> · {section === 'math' ? 'Math' : 'Reading & Writing'} · {level === 'all' ? 'Mixed difficulty' : level}</span>
              </div>
              <div className="sat-bank-build-actions">
              <button
                type="button"
                className="sat-bank-primary"
                onClick={start}
                disabled={!filtered.length}
              >
                Start {Math.min(count, filtered.length)} {Math.min(count, filtered.length) === 1 ? 'question' : 'questions'}{' '}
                <ArrowRight size={17} />
              </button>
              <button type="button" className="sat-bank-reset" onClick={reset}><RotateCcw size={14} aria-hidden="true" /> Reset filters</button>
              </div>
              <p className="sat-bank-muted">Untimed practice · Answers save automatically · Review explanations after finishing</p>
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
