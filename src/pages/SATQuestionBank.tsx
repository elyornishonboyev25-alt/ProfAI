import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpenCheck, CheckCircle2, Filter, RotateCcw, Target } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import SATQuestionCanvas from '@/components/sat/SATQuestionCanvas'
import SATRichText from '@/components/sat/SATRichText'
import { getSATReviewTests, SAT_TEST_CATALOG } from '@/features/sat/catalog'
import { loadSATAttemptHistory } from '@/features/sat/attemptStorage'
import { isSATAnswerCorrect, type SATQuestion } from '@/features/sat/practiceTest4'
import { useAuthStore } from '@/store/authStore'
import { apiClient } from '@/lib/apiClient'
import './SATQuestionBank.css'

type QuestionRow = { key: string; question: SATQuestion; testNumber: number }
type Result = { key: string; section: string; domain: string; skill: string; correct: boolean; at: string; planKey?: string }
const difficulty = (value: SATQuestion['difficulty']) => value === 'Foundation' ? 'Easy' : value === 'Advanced' ? 'Hard' : value
const historyKey = (userId: string) => `profai:sat:question-bank:${userId}:v1`
function readHistory(userId: string): Result[] {
  try { const data = JSON.parse(window.localStorage.getItem(historyKey(userId)) ?? '[]'); return Array.isArray(data) ? data as Result[] : [] }
  catch { return [] }
}
function readPlannedSession(userId: string, planKey: string | null): { quiz: QuestionRow[]; answers: Record<string, string> } | null {
  if (!planKey) return null
  try {
    const saved = JSON.parse(window.localStorage.getItem(`profai:sat:question-bank:session:${userId}:${planKey}`) ?? 'null') as { keys?: string[]; answers?: Record<string, string> } | null
    if (!saved?.keys?.length || !saved.answers) return null
    const rows = saved.keys.map(key => allQuestions.find(row => row.key === key)).filter((row): row is QuestionRow => Boolean(row))
    return rows.length ? { quiz: rows, answers: saved.answers } : null
  } catch { return null }
}
const allQuestions: QuestionRow[] = (() => {
  const used = new Set<string>()
  return Object.values(SAT_TEST_CATALOG).sort((a, b) => a.mockId - b.mockId).flatMap(test => test.modules.flatMap(module => module.questions.flatMap(question => {
    const key = `${question.section}:${question.sourceQuestionId ?? question.id}`
    if (used.has(key)) return []
    used.add(key)
    return [{ key, question, testNumber: test.mockId }]
  })))
})()

function mockResults(): Result[] {
  const tests = new Map(getSATReviewTests().map(test => [test.id, test]))
  return loadSATAttemptHistory().flatMap(({ attempt }) => {
    if (attempt.status !== 'submitted') return []
    const test = tests.get(attempt.testId)
    if (!test) return []
    const at = new Date(attempt.submittedAt ?? attempt.updatedAt).toISOString()
    return test.modules.flatMap(module => module.questions.map(question => ({ key: `${question.section}:${question.sourceQuestionId ?? question.id}`, section: question.section, domain: question.domain, skill: question.skill, correct: isSATAnswerCorrect(question, attempt.answers[question.id]), at })))
  })
}

export default function SATQuestionBank() {
  const navigate = useNavigate()
  const userId = useAuthStore(state => state.user?.id) ?? 'guest'
  const [params] = useSearchParams()
  const plannedSession = useMemo(() => readPlannedSession(userId, params.get('planKey')), [userId, params])
  const [section, setSection] = useState(params.get('section') ?? 'all')
  const [domain, setDomain] = useState('all')
  const [skill, setSkill] = useState(params.get('skill') ?? 'all')
  const [level, setLevel] = useState('all')
  const [status, setStatus] = useState('all')
  const [count, setCount] = useState(Number(params.get('count')) || 10)
  const [history, setHistory] = useState(() => readHistory(userId))
  const [quiz, setQuiz] = useState<QuestionRow[]>(plannedSession?.quiz ?? [])
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>(plannedSession?.answers ?? {})
  const [finished, setFinished] = useState(Boolean(plannedSession))
  const [syncError, setSyncError] = useState('')
  const latest = useMemo(() => {
    const result = new Map<string, Result>()
    for (const row of [...mockResults(), ...history].sort((a, b) => a.at.localeCompare(b.at))) result.set(row.key, row)
    return result
  }, [history])
  const domains = useMemo(() => [...new Set(allQuestions.filter(row => section === 'all' || row.question.section === section).map(row => row.question.domain))].sort(), [section])
  const skills = useMemo(() => [...new Set(allQuestions.filter(row => (section === 'all' || row.question.section === section) && (domain === 'all' || row.question.domain === domain)).map(row => row.question.skill))].sort(), [section, domain])
  const filtered = useMemo(() => allQuestions.filter(row => {
    const question = row.question
    const prior = latest.get(row.key)
    return (section === 'all' || question.section === section) && (domain === 'all' || question.domain === domain) && (skill === 'all' || question.skill === skill) && (level === 'all' || difficulty(question.difficulty) === level) && (status === 'all' || status === 'unanswered' && !prior || status === 'incorrect' && prior?.correct === false)
  }), [section, domain, skill, level, status, latest])
  const skillStats = useMemo(() => {
    const stats = new Map<string, { correct: number; total: number }>()
    for (const item of [...mockResults(), ...history]) {
      const key = `${item.section}:${item.skill}`
      const row = stats.get(key) ?? { correct: 0, total: 0 }
      row.total++; if (item.correct) row.correct++
      stats.set(key, row)
    }
    return [...stats].filter(([, value]) => value.total >= 4).sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total).slice(0, 5)
  }, [history])
  const start = () => {
    const priority = (row: QuestionRow) => latest.get(row.key)?.correct === false ? 0 : latest.has(row.key) ? 2 : 1
    setQuiz([...filtered].sort((a, b) => priority(a) - priority(b)).slice(0, Math.max(1, Math.min(30, count))))
    setIndex(0); setAnswers({}); setFinished(false); setSyncError('')
  }
  const complete = async () => {
    const at = new Date().toISOString()
    const plannedKey = params.get('planKey')
    const results: Result[] = quiz.map(row => ({ key: row.key, section: row.question.section, domain: row.question.domain, skill: row.question.skill, correct: isSATAnswerCorrect(row.question, answers[row.key]), at, ...(plannedKey ? { planKey: plannedKey } : {}) }))
    const next = [...history, ...results].slice(-5000)
    window.localStorage.setItem(historyKey(userId), JSON.stringify(next))
    if (plannedKey) window.localStorage.setItem(`profai:sat:question-bank:session:${userId}:${plannedKey}`, JSON.stringify({ keys: quiz.map(row => row.key), answers }))
    setHistory(next); setFinished(true)
    if (userId !== 'guest') {
      const entries = [...new Set(results.map(row => row.section))].map(section => {
        const sectionResults = results.filter(row => row.section === section)
        const grouping = new Map<string, { skill: string; correct: number; total: number }>()
        for (const result of sectionResults) { const row = grouping.get(result.skill) ?? { skill: result.skill, correct: 0, total: 0 }; row.total++; if (result.correct) row.correct++; grouping.set(result.skill, row) }
        const matchedPlan = results.every(row => row.section === section) && plannedKey?.startsWith(`sat:bank:${section}:`)
        return { sourceKey: `bank:${at}:${section}`, contentKey: matchedPlan ? plannedKey : `sat:bank:session:${section}:${at}`, skill: section === 'math' ? 'SAT_MATH' : 'SAT_READING_WRITING', title: `SAT Question Bank · ${sectionResults.length} questions`, accuracy: Math.round(sectionResults.filter(row => row.correct).length / sectionResults.length * 100), completedAt: at, skills: [...grouping.values()] }
      })
      try { await apiClient.post('/study-plan/evidence', { entries }) }
      catch { setSyncError('Your result is saved here, but the Study Plan could not sync it. Refresh the plan later.') }
    }
  }
  const current = quiz[index]
  const selected = current ? answers[current.key] ?? '' : ''
  const score = quiz.filter(row => isSATAnswerCorrect(row.question, answers[row.key])).length
  return <main className="sat-bank-page"><div className="sat-bank-wrap"><button type="button" className="sat-bank-back" onClick={() => navigate('/sat')}><ArrowLeft size={16} /> SAT Arena</button><header className="sat-bank-hero"><span><Filter size={15} /> TARGETED SAT PRACTICE</span><h1>Question Bank<span>.</span></h1><p>All available questions from this site, organized by section, domain, skill and difficulty. Your results guide your Study Plan.</p><div><strong>{allQuestions.length}</strong> questions <strong>{new Set(allQuestions.map(row => row.question.skill)).size}</strong> skills</div></header>
    {!current ? <div className="sat-bank-grid"><section className="sat-bank-panel"><div className="sat-bank-panel-title"><h2>Build a question set</h2><span>{filtered.length} matching</span></div><div className="sat-bank-filters"><label>Section<select value={section} onChange={event => { setSection(event.target.value); setDomain('all'); setSkill('all') }}><option value="all">Math + Reading & Writing</option><option value="math">Math</option><option value="reading-writing">Reading & Writing</option></select></label><label>Domain / topic<select value={domain} onChange={event => { setDomain(event.target.value); setSkill('all') }}><option value="all">All domains</option>{domains.map(value => <option key={value} value={value}>{value}</option>)}</select></label><label>Skill / question type<select value={skill} onChange={event => setSkill(event.target.value)}><option value="all">All skills</option>{skills.map(value => <option key={value} value={value}>{value}</option>)}</select></label><label>Difficulty<select value={level} onChange={event => setLevel(event.target.value)}><option value="all">All levels</option><option>Easy</option><option>Medium</option><option>Hard</option></select></label><label>Progress<select value={status} onChange={event => setStatus(event.target.value)}><option value="all">All questions</option><option value="unanswered">Not attempted</option><option value="incorrect">Previously incorrect</option></select></label><label>Questions in set<select value={count} onChange={event => setCount(Number(event.target.value))}>{[4, 6, 10, 15, 20, 30].map(value => <option key={value} value={value}>{value}</option>)}</select></label></div><button type="button" className="sat-bank-primary" onClick={start} disabled={!filtered.length}>Start {Math.min(count, filtered.length)} questions <ArrowRight size={17} /></button></section><aside className="sat-bank-panel"><div className="sat-bank-panel-title"><h2>Skills to strengthen</h2><Target size={20} /></div>{skillStats.length ? <div className="sat-bank-skills">{skillStats.map(([key, stat]) => <button key={key} type="button" onClick={() => { const [area, ...rest] = key.split(':'); setSection(area); setDomain('all'); setSkill(rest.join(':')) }}><span>{key.split(':').slice(1).join(':')}</span><strong>{stat.correct}/{stat.total} correct</strong></button>)}</div> : <p className="sat-bank-muted">Complete at least four questions in a skill to see reliable recommendations.</p>}<p className="sat-bank-muted">Questions from completed mocks and question sets contribute to this view.</p></aside></div> : <section className="sat-bank-session"><div className="sat-bank-session-top"><div><span>{finished ? 'SET COMPLETE' : `QUESTION ${index + 1} / ${quiz.length}`}</span><h2>{finished ? `${score} of ${quiz.length} correct` : `${current.question.domain} · ${current.question.skill}`}</h2></div><button type="button" onClick={() => { setQuiz([]); setFinished(false) }}><RotateCcw size={16} /> Filters</button></div>{finished ? <div className="sat-bank-finish"><CheckCircle2 size={37} /><p>Your answers are saved. Review the explanation for every question, then return to your Study Plan.</p>{syncError && <p className="sat-bank-error">{syncError}</p>}<button type="button" className="sat-bank-primary" onClick={() => navigate('/journey-plan')}>Open Study Plan <ArrowRight size={17} /></button><div className="sat-bank-review">{quiz.map((row, reviewIndex) => <article key={row.key}><strong>Question {reviewIndex + 1} · {isSATAnswerCorrect(row.question, answers[row.key]) ? "Correct" : "Review needed"}</strong><p>{row.question.domain} · {row.question.skill}</p><p>Your answer: {answers[row.key] || "Skipped"} · Correct answer: {row.question.correctAnswer}</p><SATRichText text={row.question.explanation} /></article>)}</div></div> : <><div className="sat-bank-question"><SATQuestionCanvas question={current.question} answer={selected} onAnswer={answer => setAnswers(currentAnswers => ({ ...currentAnswers, [current.key]: answer }))} strokes={[]} highlightEnabled={false} highlightColor="#facc15" onChange={() => undefined} flagged={false} onToggleFlag={() => undefined} /></div><div className="sat-bank-session-footer"><span>{difficulty(current.question.difficulty)} · Practice Test {current.testNumber}</span>{index ? <button type="button" onClick={() => setIndex(index - 1)}>Previous</button> : null}{index + 1 < quiz.length ? <button type="button" className="sat-bank-primary" onClick={() => setIndex(index + 1)}>Next <ArrowRight size={16} /></button> : <button type="button" className="sat-bank-primary" onClick={() => void complete()}>Finish set <BookOpenCheck size={16} /></button>}</div></>}{finished ? null : null}</section>}
  </div></main>
}
