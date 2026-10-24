import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Target,
  Trash2,
  TrendingUp,
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import MistakeLabNavigation from '@/components/results/MistakeLabNavigation'
import SATReview from '@/components/sat/SATReview'
import {
  clearSATAttempt,
  deleteSATAttemptHistoryEntry,
  loadSATAttempt,
  loadSATAttemptHistory,
  saveSATAttemptToHistory,
  type SATAttemptHistoryEntry,
} from '@/features/sat/attemptStorage'
import {
  getSATReviewTests,
  isSATTestComplete,
  type SATTestDefinition,
} from '@/features/sat/catalog'
import { scoreSATModules } from '@/features/sat/practiceTest4'

const SAT_TESTS = getSATReviewTests()
const SAT_TESTS_BY_ID = new Map(SAT_TESTS.map((test) => [test.id, test]))

function loadHistoryWithLegacyResults() {
  // Loading the slots migrates completed attempts. Keep unfinished attempts
  // from the original Question Bank allocation available for accurate review.
  SAT_TESTS.forEach((test) => {
    const attempt = loadSATAttempt(test.id)
    if (test.id.startsWith('question-bank-2026-09-20-') && attempt?.status === 'active') {
      saveSATAttemptToHistory(attempt, 'exit')
    }
  })
  return loadSATAttemptHistory()
}

function scoreFor(test: SATTestDefinition, entry: SATAttemptHistoryEntry) {
  const report = scoreSATModules(test.modules, entry.attempt.answers)
  const onlySection = test.modules.every((module) => module.section === test.modules[0]?.section)
  const range = onlySection
    ? test.modules[0]?.section === 'math' ? report.mathRange : report.readingWritingRange
    : report.totalRange

  return {
    accuracy: report.percent,
    correct: report.correct,
    incorrect: report.incorrect,
    unanswered: report.unanswered,
    total: report.correct + report.incorrect + report.unanswered,
    scoreRange: `${range[0]}–${range[1]}`,
    scoreLabel: onlySection
      ? test.modules[0]?.section === 'math' ? 'Estimated Math' : 'Estimated R&W'
      : 'Estimated SAT total',
    maxScore: onlySection ? 800 : 1600,
  }
}

export default function SATMistakes() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [history, setHistory] = useState(loadHistoryWithLegacyResults)

  const attempts = useMemo(() => history.flatMap((entry) => {
    const test = SAT_TESTS_BY_ID.get(entry.attempt.testId)
    return test ? [{ entry, test, result: scoreFor(test, entry) }] : []
  }), [history])

  const completedAttempts = attempts.filter(({ entry }) => entry.attempt.status === 'submitted')
  const averageAccuracy = completedAttempts.length
    ? completedAttempts.reduce((sum, attempt) => sum + attempt.result.accuracy, 0) / completedAttempts.length
    : 0
  const recoveryQueue = completedAttempts.reduce((sum, attempt) => sum + attempt.result.incorrect + attempt.result.unanswered, 0)

  const deleteAttempt = (entry: SATAttemptHistoryEntry, title: string) => {
    const timestamp = new Date(entry.savedAt).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    if (!window.confirm(`Delete “${title}” saved on ${timestamp}? This cannot be undone.`)) return
    const currentAttempt = loadSATAttempt(entry.attempt.testId)
    if (currentAttempt?.attemptId === entry.id) clearSATAttempt(entry.attempt.testId)
    deleteSATAttemptHistoryEntry(entry.id)
    setHistory(loadSATAttemptHistory())
  }

  const selectedAttemptId = searchParams.get('attempt')
  const selectedAttempt = attempts.find(({ entry }) => entry.id === selectedAttemptId)
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [selectedAttemptId])
  const closeReview = () => {
    setSearchParams((params) => {
      params.delete('attempt')
      return params
    })
  }

  if (selectedAttempt) {
    return (
      <SATReview
        key={selectedAttempt.entry.id}
        attempt={selectedAttempt.entry.attempt}
        test={selectedAttempt.test}
        onBack={closeReview}
        backLabel="SAT Mistake Lab"
        historyReview
      />
    )
  }

  const savedAtLabel = (savedAt: string | number) => new Date(savedAt).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="workspace-page mlab">
      <div className="mlab-shell">
        <section className="mlab-card mlab-hero">
          <div className="mlab-hero-top">
            <button type="button" onClick={() => navigate('/sat')} className="mlab-back">
              <ArrowLeft aria-hidden="true" /> Back to SAT Prep
            </button>
            <MistakeLabNavigation />
          </div>
          <div className="mlab-hero-body">
            <div>
              <span className="mlab-eyebrow">SAT-only workspace</span>
              <h1>SAT Mistake Lab</h1>
              <p>Every submitted full mock, individual section, and unfinished Exit &amp; Save attempt stays here as a separate dated result.</p>
            </div>
            <span className="mlab-hero-mark" aria-hidden="true"><BrainCircuit /></span>
          </div>
        </section>

        <section className="mlab-stats" aria-label="SAT review summary">
          {[
            { label: 'Saved attempts', value: attempts.length.toString(), icon: CheckCircle2 },
            { label: 'Average accuracy', value: completedAttempts.length ? `${averageAccuracy.toFixed(0)}%` : '—', icon: Target },
            { label: 'Mistakes to review', value: recoveryQueue.toString(), icon: TrendingUp },
          ].map((metric) => {
            const Icon = metric.icon
            return (
              <article key={metric.label} className="mlab-card mlab-stat">
                <span className="mlab-stat-icon"><Icon aria-hidden="true" /></span>
                <div>
                  <p className="mlab-stat-label">{metric.label}</p>
                  <p className="mlab-stat-value">{metric.value}</p>
                </div>
              </article>
            )
          })}
        </section>

        <section className="mlab-card mlab-section">
          <div className="mlab-section-head">
            <div>
              <span className="mlab-eyebrow"><Clock3 size={14} aria-hidden="true" />Attempt history</span>
              <h2>Your SAT review queue</h2>
              <p>Full mock: 400–1600 total. Individual sections: 200–800 each.</p>
            </div>
            {attempts.length ? <span className="mlab-count">{attempts.length}</span> : null}
          </div>

          {selectedAttemptId ? (
            <p role="status" className="mlab-alert is-warning">This saved attempt is no longer available. Choose another result below.</p>
          ) : null}
          <div className="mlab-list">
            {attempts.length ? (
              attempts.map(({ entry, test, result }) => {
                const completed = entry.attempt.status === 'submitted'
                return (
                  <article key={entry.id} className="mlab-row">
                    <button
                      type="button"
                      onClick={() => setSearchParams({ attempt: entry.id })}
                      aria-label={`Review ${test.title} attempt saved ${new Date(entry.savedAt).toLocaleString('en-GB')}`}
                      className="mlab-row-main"
                    >
                      <div>
                        <div className="mlab-row-title">
                          <strong>{test.title}</strong>
                          <span className={`mlab-status ${completed ? 'is-done' : 'is-saved'}`}>
                            {completed ? 'Completed' : 'Saved incomplete'}
                          </span>
                        </div>
                        <p className="mlab-row-meta">
                          <Clock3 aria-hidden="true" />
                          {savedAtLabel(entry.savedAt)}
                          {' · '}{entry.attempt.mode === 'exam' ? 'Exam mode' : 'Practice mode'}
                        </p>
                        <span className="mlab-row-cta">Review answers <ChevronRight aria-hidden="true" /></span>
                      </div>
                      <div className="mlab-metrics">
                        <div className="mlab-metric is-accent">
                          <small>{isSATTestComplete(test) ? result.scoreLabel : 'Accuracy'}</small>
                          <b>{completed ? (isSATTestComplete(test) ? `${result.scoreRange} / ${result.maxScore}` : `${result.accuracy}% accuracy`) : '—'}</b>
                        </div>
                        <div className="mlab-metric">
                          <small>Correct answers</small>
                          <b>{result.correct}/{result.total}</b>
                          <span>{result.incorrect} incorrect · {result.unanswered} unanswered</span>
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteAttempt(entry, test.title)}
                      aria-label={`Delete ${test.title} attempt`}
                      title="Delete result"
                      className="mlab-icon-button"
                    >
                      <Trash2 aria-hidden="true" />
                    </button>
                  </article>
                )
              })
            ) : (
              <div className="mlab-empty">
                <span className="mlab-empty-icon"><BrainCircuit aria-hidden="true" /></span>
                <h3>No saved SAT attempts yet</h3>
                <p>Submit any full mock or section test, or use Exit &amp; Save during an unfinished attempt.</p>
                <button type="button" onClick={() => navigate('/sat')} className="mlab-button is-primary">Choose a SAT test</button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
