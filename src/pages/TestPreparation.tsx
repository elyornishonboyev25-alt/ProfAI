import { Link } from 'react-router-dom'
import { ArrowRight, Headphones, BookOpen, PenLine, Mic, Calculator } from 'lucide-react'
import StudyObject from '@/components/visuals/StudyObject'
import { useCopy } from '@/i18n/interface'

export default function TestPreparation() {
  const { c } = useCopy()
  return <div className="workspace-page liquid-page">
    <header className="liquid-page-heading"><p className="liquid-eyebrow">{c('Preparation')}</p><h1>{c('Preparation, your way.')}</h1><p>{c('Choose your exam, then focus on one skill at a time.')}</p></header>
    <div className="liquid-exam-grid">
      <article className="glass-surface liquid-exam-card"><div className="liquid-exam-art"><StudyObject kind="headphones" /></div><p className="liquid-eyebrow">{c('English proficiency')}</p><h2>IELTS</h2><p>{c('Practice the four skills, take a mock test, and learn from your mistakes.')}</p>
        <div className="liquid-skill-links">{[
          { label: 'Listening', path: '/ielts/listening', icon: Headphones }, { label: 'Reading', path: '/ielts/reading', icon: BookOpen }, { label: 'Writing', path: '/ielts/writing/tests', icon: PenLine }, { label: 'Speaking', path: '/ielts/speaking/tests', icon: Mic },
        ].map(item => <Link to={item.path} key={item.path}><item.icon size={17} />{c(item.label)}<ArrowRight size={15} /></Link>)}</div><Link to="/ielts" className="liquid-button primary">{c('Open IELTS')}<ArrowRight size={18} /></Link>
      </article>
      <article className="glass-surface liquid-exam-card"><div className="liquid-exam-art"><StudyObject kind="calculator" /></div><p className="liquid-eyebrow">{c('University readiness')}</p><h2>SAT</h2><p>{c('Focus on Math and Reading & Writing with structured practice.')}</p>
        <div className="liquid-skill-links"><Link to="/sat/math"><Calculator size={17} />{c('Math')}<ArrowRight size={15} /></Link><Link to="/sat/reading-writing"><BookOpen size={17} />{c('Reading & Writing')}<ArrowRight size={15} /></Link></div><Link to="/sat" className="liquid-button primary">{c('Open SAT')}<ArrowRight size={18} /></Link>
      </article>
    </div>
    <Link to="/academic-skills" className="liquid-resource-row glass-surface"><div><h3>{c('Additional practice')}</h3><p>{c('Audio, articles, vocabulary and pronunciation.')}</p></div><ArrowRight /></Link>
  </div>
}
