import ConfirmDialog from '@/components/common/ConfirmDialog'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Bookmark,
  Calculator,
  Check,
  CheckCircle2,
  Clock3,
  Filter,
  Grid2X2,
  History,
  Layers3,
  PlayCircle,
  RotateCcw,
  Sparkles,
  Target,
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAccountDataRevision } from '@/hooks/useAccountDataRevision'
import { useFullscreen } from '@/hooks/useFullscreen'
import { allQuestions, bankSetReview, questionKey, readHistory, readAttemptedKeys, difficulty, loadBankSession, saveBankSession, type Result } from '@/features/sat/bankPractice'
import SATBankSelect from '@/components/sat/SATBankSelect'
import SATReview from '@/components/sat/SATReview'
import { bankDomain, bankSkill } from '@/features/sat/bankTopics'
import { getSATReviewTests } from '@/features/sat/catalog'
import { loadSATAttempt, loadSATAttemptHistory } from '@/features/sat/attemptStorage'
import { formatSATDuration } from '@/features/sat/resultAnalysis'
import { isSATAnswerCorrect } from '@/features/sat/practiceTest4'
import { useAuthStore } from '@/store/authStore'
import './SATQuestionBank.css'

const outcome = (result: Result) =>
  result.correct ? 'correct' : result.answer === '' ? 'skipped' : 'incorrect'
const dateLabel = (at: string) =>
  new Date(at).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
const sectionLabel = (section: string) => (section === 'math' ? 'Math' : 'Reading & Writing')
const tone = (percent: number) => (percent >= 80 ? 'is-strong' : percent >= 50 ? 'is-mid' : 'is-focus')

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
  const [error, setError] = useState('')
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
        section: results[0].section,
        seconds: results[0].seconds,
        correct: results.filter((row) => row.correct).length,
        incorrect: results.filter((row) => outcome(row) === 'incorrect').length,
        skipped: results.filter((row) => outcome(row) === 'skipped').length,
        percent: Math.round((results.filter((row) => row.correct).length / results.length) * 100),
      }))
      .sort((a, b) => b.at.localeCompare(a.at))
  }, [history])
  const reviewSet = sets.find((set) => set.id === reviewId)
  const analysis = useMemo(() => (reviewSet ? bankSetReview(reviewSet.id, reviewSet.results) : null), [reviewSet])
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [reviewId])
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
            .filter((row) => row.question.section === section)
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
                row.question.section === section &&
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
  const practised = history.length
  const accuracy = practised ? Math.round((history.filter((row) => row.correct).length / practised) * 100) : null
  const sectionTotals = useMemo(() => ({
    math: allQuestions.filter((row) => row.question.section === 'math').length,
    'reading-writing': allQuestions.filter((row) => row.question.section === 'reading-writing').length,
  }), [])
  const [replaceSetOpen, setReplaceSetOpen] = useState(false)
  const resume = () => {
    if (!activeSet) return
    void enter()
    navigate(`/sat/question-bank/run/${activeSet.id}`, { state: { resumeIntent: true, returnTo: '/sat/question-bank' } })
  }
  const start = (replacementConfirmed = false) => {
    if (!filtered.length) return
    if (activeSet && !replacementConfirmed) { setReplaceSetOpen(true); return }
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
      navigate(`/sat/question-bank/run/${session.id}`, { state: { resumeIntent: true, returnTo: '/sat/question-bank' } })
    } catch {
      setError('Your practice could not be started. Free up browser storage and try again.')
    }
  }
  const reset = () => {
    setDomain('all')
    setSkill('all')
    setLevel('all')
    setStatus('all')
    setError('')
  }
  const setSize = Math.min(count, filtered.length)

  if (reviewSet && analysis) {
    return (
      <SATReview
        key={reviewSet.id}
        variant="question-bank"
        attempt={analysis.attempt}
        test={analysis.test}
        onBack={() => goTo('history')}
        backLabel="Question Bank history"
        onStartAgain={() => goTo('practice')}
      />
    )
  }

  return (
    <main className="workspace-page sat-bank-page">
      <ConfirmDialog open={replaceSetOpen} title="Replace your unfinished practice set?" description="Starting a new set deletes the answers and notes from your unfinished set. Your completed practice results are kept." confirmLabel="Replace & start again" cancelLabel="Keep saved set" destructive onClose={() => setReplaceSetOpen(false)} onConfirm={() => { setReplaceSetOpen(false); start(true) }} />
      <div className="sat-bank-wrap">
        <button type="button" className="sat-bank-back" onClick={() => navigate('/sat')}>
          <ArrowLeft size={16} /> SAT Arena
        </button>
        <header className="sat-bank-hero">
          <div className="sat-bank-hero-copy">
            <span className="sat-bank-eyebrow-pill"><Filter size={14} /> TARGETED SAT PRACTICE</span>
            <h1>Question Bank<span>.</span></h1>
            <p>Build a set around any skill, solve it in the real SAT interface and get a full analysis the moment you finish.</p>
            <div className="sat-bank-hero-tags">
              <span><CheckCircle2 size={14} /> Real SAT interface</span>
              <span><BarChart3 size={14} /> Full result analysis</span>
              <span><Clock3 size={14} /> Untimed & autosaved</span>
            </div>
          </div>
          <dl className="sat-bank-hero-stats" aria-label="Question Bank summary">
            <div><dt>Questions</dt><dd><strong>{allQuestions.length}</strong></dd></div>
            <div><dt>Saved sets</dt><dd><strong>{sets.length}</strong></dd></div>
            <div><dt>Practised</dt><dd><strong>{practised}</strong></dd></div>
            <div><dt>Accuracy</dt><dd><strong className={accuracy === null ? '' : tone(accuracy)}>{accuracy === null ? '—' : `${accuracy}%`}</strong></dd></div>
          </dl>
        </header>
        <nav className="sat-bank-tabs" aria-label="Question bank views">
          <button type="button" aria-current={!historyView ? 'page' : undefined} onClick={() => goTo('practice')}>
            <BookOpenCheck size={18} /> Practice
          </button>
          <button type="button" aria-current={historyView ? 'page' : undefined} onClick={() => goTo('history')}>
            <History size={18} /> History & review <span>{sets.length}</span>
          </button>
        </nav>
        {historyView ? (
          <section className="sat-bank-panel">
            <div className="sat-bank-panel-title">
              <div>
                <p className="sat-bank-kicker">Results</p>
                <h2>Your practice history</h2>
              </div>
              <History size={22} />
            </div>
            <p className="sat-bank-muted">
              Open any saved set for its full analysis: score, domains, skills and every question with its explanation.
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
                    <span className={`sat-bank-history-score ${tone(set.percent)}`}>
                      <strong>{set.percent}%</strong>
                      <small>{set.correct}/{set.results.length}</small>
                    </span>
                    <span className="sat-bank-history-info">
                      <span className="sat-bank-history-chips">
                        <span className={`sat-bank-chip ${set.section === 'math' ? 'is-math' : ''}`}>{sectionLabel(set.section)}</span>
                        {set.seconds !== undefined ? <span className="sat-bank-chip is-quiet"><Clock3 size={12} /> {formatSATDuration(set.seconds)}</span> : null}
                      </span>
                      <strong>{set.results.length}-question practice set</strong>
                      <small>{dateLabel(set.at)}</small>
                      <span className="sat-bank-history-bar" aria-hidden="true">
                        <i className="is-correct" style={{ width: `${(set.correct / set.results.length) * 100}%` }} />
                        <i className="is-incorrect" style={{ width: `${(set.incorrect / set.results.length) * 100}%` }} />
                        <i className="is-skipped" style={{ width: `${(set.skipped / set.results.length) * 100}%` }} />
                      </span>
                      <span className="sat-bank-history-counts">
                        {set.correct} correct · {set.incorrect} incorrect · {set.skipped} skipped
                      </span>
                    </span>
                    <span className="sat-bank-history-action">
                      View analysis <ArrowRight size={16} />
                    </span>
                  </button>
                ))
              ) : (
                <div className="sat-bank-empty">
                  <History size={32} />
                  <h3>Your next result starts here</h3>
                  <p>Finish a practice set to unlock its full analysis and review it anytime.</p>
                  <button type="button" className="sat-bank-primary" onClick={() => goTo('practice')}>
                    Build a question set <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </div>
            <button type="button" className="sat-bank-mock-link" onClick={() => navigate('/profile')}>
              Looking for full mock or section results? Open My Results <ArrowRight size={16} />
            </button>
          </section>
        ) : (
          <div className="sat-bank-grid">
            <section className="sat-bank-panel sat-bank-builder">
              <div className="sat-bank-panel-title">
                <div>
                  <p className="sat-bank-kicker">Step by step</p>
                  <h2>Build a question set</h2>
                </div>
                <span className="sat-bank-matching" role="status" aria-live="polite">{filtered.length} matching</span>
              </div>
              <p className="sat-bank-builder-intro">Choose your focus. Make this practice your own.</p>
              {error ? <p role="alert" className="sat-bank-alert">{error}</p> : null}
              <div className="sat-bank-filters">
                <fieldset className="sat-bank-choice-field sat-bank-section-field" aria-label="Section">
                  <legend><b>1</b> Section</legend>
                  <div className="sat-bank-section-options">
                    {[
                      { value: 'math', label: 'Math', detail: 'Equations, data & problem solving', Icon: Calculator },
                      { value: 'reading-writing', label: 'Reading & Writing', detail: 'Comprehension, grammar & expression', Icon: BookOpenCheck },
                    ].map(({ value, label, detail, Icon }) => (
                      <label key={value} className="sat-bank-section-option">
                        <input type="radio" name="bank-section" value={value} checked={section === value}
                          aria-label={label} onChange={() => { setSection(value); setDomain('all'); setSkill('all'); setError('') }} />
                        <span className="sat-bank-option-icon"><Icon size={20} aria-hidden="true" /></span>
                        <span><strong>{label}</strong><small>{detail} · {sectionTotals[value as 'math' | 'reading-writing']} questions</small></span>
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
                  <legend><b>2</b> Difficulty</legend>
                  <div className="sat-bank-difficulty-options">
                    {['all', 'Easy', 'Medium', 'Hard'].map((value, index) => (
                      <label key={value} className={`is-${value.toLowerCase()}`}>
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
                  <legend><b>3</b> Progress</legend>
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
                  <legend><b>4</b> Questions in set</legend>
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
                  <button type="button" onClick={reset}>Reset filters</button>
                </p>
              ) : null}
              <div className="sat-bank-launch">
                <div className="sat-bank-set-summary" aria-live="polite">
                  <BookOpenCheck size={18} aria-hidden="true" />
                  <span><strong>{setSize} {setSize === 1 ? 'question' : 'questions'}</strong> · {sectionLabel(section)} · {level === 'all' ? 'Mixed difficulty' : level}</span>
                </div>
                <div className="sat-bank-build-actions">
                  <button type="button" className="sat-bank-primary" onClick={() => start()} disabled={!filtered.length}>
                    Start {setSize} {setSize === 1 ? 'question' : 'questions'} <ArrowRight size={17} />
                  </button>
                  <button type="button" className="sat-bank-reset" onClick={reset}><RotateCcw size={14} aria-hidden="true" /> Reset filters</button>
                </div>
              </div>
              <p className="sat-bank-muted">Untimed practice · Answers save automatically · Full analysis after finishing</p>
            </section>
            <aside className="sat-bank-side">
              {activeSet ? (
                <section className="sat-bank-panel sat-bank-resume" role="status">
                  <span className="sat-bank-resume-icon"><PlayCircle size={22} /></span>
                  <div>
                    <p className="sat-bank-kicker">Saved set</p>
                    <h2>Pick up where you left off</h2>
                    <p>You have an unfinished {activeSet.keys.length}-question set. Your answers are saved.</p>
                    <span className="sat-bank-resume-meter" aria-hidden="true">
                      <i style={{ width: `${(activeSet.keys.filter((key) => activeSet.answers[key]?.trim()).length / activeSet.keys.length) * 100}%` }} />
                    </span>
                    <small>{activeSet.keys.filter((key) => activeSet.answers[key]?.trim()).length} of {activeSet.keys.length} answered</small>
                  </div>
                  <button type="button" className="sat-bank-primary" onClick={resume}>Resume practice <ArrowRight size={17} /></button>
                </section>
              ) : null}
              {sets[0] ? (
                <section className="sat-bank-panel sat-bank-last">
                  <div className="sat-bank-panel-title">
                    <div>
                      <p className="sat-bank-kicker">Latest result</p>
                      <h2>{sets[0].results.length}-question set</h2>
                    </div>
                    <span className={`sat-bank-last-score ${tone(sets[0].percent)}`}>{sets[0].percent}%</span>
                  </div>
                  <p className="sat-bank-muted">{sectionLabel(sets[0].section)} · {dateLabel(sets[0].at)}</p>
                  <button type="button" className="sat-bank-secondary" onClick={() => goTo('history', sets[0].id)}>
                    <BarChart3 size={16} /> View full analysis <ArrowRight size={15} />
                  </button>
                </section>
              ) : null}
              <section className="sat-bank-panel">
                <div className="sat-bank-panel-title">
                  <div>
                    <p className="sat-bank-kicker">Personal insight</p>
                    <h2>Skills to strengthen</h2>
                  </div>
                  <Target size={20} />
                </div>
                {skillStats.length ? (
                  <div className="sat-bank-skills">
                    {skillStats.map(([key, stat]) => {
                      const percent = Math.round((stat.correct / stat.total) * 100)
                      return (
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
                          <span className="sat-bank-skill-top">
                            <span>{key.split(':').slice(1).join(':')}</span>
                            <strong className={tone(percent)}>{percent}%</strong>
                          </span>
                          <span className="sat-bank-skill-meter"><i className={tone(percent)} style={{ width: `${percent}%` }} /></span>
                          <small>{stat.correct}/{stat.total} correct · Practise this skill <ArrowRight size={12} /></small>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="sat-bank-skills-empty">
                    <Sparkles size={20} />
                    <p>Complete at least four questions in a skill to see reliable recommendations.</p>
                  </div>
                )}
                <p className="sat-bank-muted">Completed mocks and question sets contribute to this view.</p>
                <button type="button" className="sat-bank-mock-link" onClick={() => goTo('history')}>
                  <Layers3 size={16} /> Review past question sets <ArrowRight size={16} />
                </button>
              </section>
            </aside>
          </div>
        )}
      </div>
    </main>
  )
}
