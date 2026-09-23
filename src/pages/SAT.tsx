import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Check, ChevronDown, FileSearch } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { loadOnboardingProfile } from '@/utils/weeklyPlanner'
import { isSATTestComplete, SAT_TEST_CATALOG } from '@/features/sat/catalog'
import { loadSATAttempt, loadSATAttemptHistory } from '@/features/sat/attemptStorage'
import { scoreSATModules } from '@/features/sat/practiceTest4'
import { useCopy } from '@/i18n/interface'
import StudyObject from '@/components/visuals/StudyObject'

export default function SAT() {
  const { c } = useCopy()
  const user = useAuthStore(s => s.user)
  const profile = loadOnboardingProfile(user?.id)
  const [catalogOpen,setCatalogOpen] = useState(false)
  const tests = useMemo(()=>Object.values(SAT_TEST_CATALOG).sort((a,b)=>a.mockId-b.mockId),[])
  const attempts = useMemo(()=>tests.map(test=>({test,attempt:loadSATAttempt(test.id)})).filter(item=>item.attempt).sort((a,b)=>b.attempt!.updatedAt-a.attempt!.updatedAt),[tests,user?.id])
  const active = attempts.find(item=>item.attempt?.status==='active')
  const completed = useMemo(() => {
    const history = loadSATAttemptHistory().filter(entry => entry.attempt.status === 'submitted').sort((a,b) => a.savedAt - b.savedAt)
    return tests.flatMap(test => {
      const attempt = history.find(entry => entry.attempt.testId === test.id)?.attempt
        ?? attempts.find(item => item.test.id === test.id && item.attempt?.status === 'submitted')?.attempt
      return attempt ? [{ test, attempt }] : []
    })
  }, [tests, attempts])
  const scores = completed.filter(item => isSATTestComplete(item.test)).map(item=>scoreSATModules(item.test.modules,item.attempt.answers).midpoint)
  const best = scores.length ? Math.max(...scores) : null
  return <div className="workspace-page liquid-page">
    <header className="liquid-page-heading liquid-heading-with-tabs"><div><Link className="liquid-text-link" to="/test-preparation">{c('Preparation')}</Link><h1>{c('SAT preparation')}</h1><p>{c('Build confidence in Math and Reading & Writing.')}</p></div><div className="glass-control liquid-track-tabs"><Link to="/ielts">IELTS</Link><Link to="/sat" aria-current="page">SAT</Link></div></header>
    {active && <Link className="glass-surface liquid-resource-row mb-6" to={`/mock/sat/${active.test.mockId}`}><div><p className="liquid-eyebrow">{c('Continue test')}</p><h3>{active.test.title}</h3></div><ArrowRight size={20} /></Link>}
    <div className="liquid-skill-grid">
      <Link to="/sat/math" className="glass-surface liquid-skill-card"><div><p className="liquid-eyebrow">SAT</p><h2>{c('Math')}</h2><p>{c('Algebra, advanced math and problem solving.')}</p><span className="liquid-text-link">{c('Open tests')}<ArrowRight size={17} /></span></div><StudyObject kind="calculator" /></Link>
      <Link to="/sat/reading-writing" className="glass-surface liquid-skill-card"><div><p className="liquid-eyebrow">SAT</p><h2>{c('Reading & Writing')}</h2><p>{c('Evidence, grammar and clear expression.')}</p><span className="liquid-text-link">{c('Open tests')}<ArrowRight size={17} /></span></div><StudyObject kind="book" /></Link>
    </div>
    <section className="glass-surface liquid-catalog"><button className="liquid-catalog-toggle" onClick={()=>setCatalogOpen(!catalogOpen)} aria-expanded={catalogOpen} aria-controls="sat-mock-catalog"><span><span className="liquid-eyebrow">{c('Full mock tests')}</span><strong>{c('Digital SAT practice tests')}</strong><small>{tests.length} {c('available tests')}</small></span><ChevronDown size={22} className={catalogOpen ? 'rotate-180' : ''} /></button>
      {catalogOpen && <div id="sat-mock-catalog" className="liquid-test-list">{tests.map(test=><Link key={test.id} to={`/mock/sat/${test.mockId}`}><span><strong>{test.title}</strong><small>{Math.round(test.totalDurationSeconds/60)} {c('minutes')} · {test.questionCount} {c('questions')}</small>{!isSATTestComplete(test) && <small>{c('Some modules are unavailable.')}</small>}</span>{completed.some(item=>item.test.id===test.id) ? <Check size={19} /> : <ArrowRight size={19} />}</Link>)}</div>}
    </section>
    <div className="liquid-exam-grid"><Link to="/sat/mistakes" className="glass-surface liquid-resource-row"><div><h3>{c('Review mistakes')}</h3><p>{c('Review your answers and see what to work on next.')}</p></div><FileSearch size={22} /></Link><Link to="/vocabulary/sat" state={{ from: '/sat' }} className="glass-surface liquid-resource-row"><div><h3>{c('Vocabulary')}</h3><p>{c('Review saved words and build lasting recall.')}</p></div><BookOpen size={22} /></Link></div>
    <details className="glass-surface liquid-progress-details"><summary>{c('My Results')}<ChevronDown size={18} /></summary><div className="liquid-score-list"><div><span>{c('Target score')}</span><strong>{profile?.targetSatScore || '—'}</strong></div><div><span>{c('Best score')}</span><strong>{best || '—'}</strong></div><div><span>{c('Completed practices')}</span><strong>{completed.length}</strong></div></div>{!scores.length && <p>{c('Scores appear after completed practice.')}</p>}<Link to="/profile" className="liquid-text-link">{c('View all results')}<ArrowRight size={16} /></Link></details>
  </div>
}
