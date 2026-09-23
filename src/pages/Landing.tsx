import { Link } from 'react-router-dom'
import { ArrowRight, Check, ChevronRight } from 'lucide-react'
import { BrandLockup } from '@/components/brand/BrandLogo'
import LanguageSelector from '@/components/layout/LanguageSelector'
import StudyObject from '@/components/visuals/StudyObject'
import { useCopy } from '@/i18n/interface'
import { isPublicFeatureEnabled } from '@/config/featureFlags'

export default function Landing() {
  const { c } = useCopy()
  const start = isPublicFeatureEnabled('guestDiagnostic') ? '/diagnostic' : '/register'
  const paths = [
    { title: 'IELTS', subtitle: 'English proficiency', description: 'Practice the four skills, take a mock test, and learn from your mistakes.', object: 'headphones' as const, to: '/ielts' },
    { title: 'SAT', subtitle: 'University readiness', description: 'Focus on Math and Reading & Writing with structured practice.', object: 'calculator' as const, to: '/sat' },
    { title: 'University Applications', subtitle: 'Your university journey', description: 'Explore universities, save your shortlist, and understand the application process.', object: 'globe' as const, to: '/admission' },
  ]
  return <div className="liquid-landing">
    <header className="liquid-marketing-nav glass-control">
      <Link to="/" aria-label="ProfAI"><BrandLockup iconSize={42} /></Link>
      <nav aria-label={c('Features')}><a href="#features">{c('Features')}</a><a href="#how-it-works">{c('How it works')}</a><Link to="/premium">{c('Pricing')}</Link></nav>
      <div className="liquid-nav-actions"><LanguageSelector /><Link to="/login" className="liquid-button secondary">{c('Sign in')}</Link></div>
    </header>
    <main>
      <section className="liquid-hero">
        <div className="liquid-hero-copy">
          <p className="liquid-eyebrow"><span />{c('Your path to studying abroad')}</p>
          <h1>{c('Big ambitions.')}<br /><span>{c('Clear next steps.')}</span></h1>
          <p className="liquid-lead">{c('Prepare for IELTS, SAT, and university applications in one connected space.')}</p>
          <div className="liquid-actions"><Link to={start} className="liquid-button primary">{c('Get started')}<ArrowRight size={19} /></Link><a href="#features" className="liquid-text-link">{c('Explore preparation')}<ChevronRight size={17} /></a></div>
          <div className="liquid-hero-footnote"><Check size={16} /><span>IELTS</span><i /><span>SAT</span><i /><span>{c('University Applications')}</span></div>
        </div>
        <div className="liquid-hero-art">
          <div className="liquid-hero-photo"><img src="/assets/auth/students-collaborating.webp" alt="" fetchPriority="high" /></div>
          <div className="liquid-floating-card glass-control"><StudyObject kind="headphones" /><div><small>{c('Today’s focus')}</small><strong>{c('Listening')}</strong><span>{c('Make time for practice')}</span></div><span className="liquid-mini-arrow"><ArrowRight size={18} /></span></div>
          <div className="liquid-floating-label glass-control"><span className="liquid-status-dot" />{c('Your next chapter')}</div>
        </div>
      </section>
      <section id="features" className="liquid-section">
        <div className="liquid-section-heading"><div><p className="liquid-eyebrow">{c('Keep exploring')}</p><h2>{c('Build your skills. Find your direction.')}</h2></div></div>
        <div className="liquid-path-grid">{paths.map((path, index) => <Link to={path.to} className="liquid-path-card glass-surface" key={path.to}>
          <div className="liquid-path-art"><StudyObject kind={path.object} /><span>0{index + 1}</span></div>
          <p className="liquid-eyebrow">{c(path.subtitle)}</p><h3>{c(path.title)}</h3><p>{c(path.description)}</p><span className="liquid-text-link">{c('Explore')}<ArrowRight size={17} /></span>
        </Link>)}</div>
      </section>
      <section id="how-it-works" className="liquid-section liquid-how">
        <div><p className="liquid-eyebrow">{c('How it works')}</p><h2>{c('A little practice. A bigger future.')}</h2><img src="/assets/admission/student-library.webp" alt="" loading="lazy" /></div>
        <ol>{[
          ['Choose a goal', 'Start with what matters to you. Your workspace follows your focus.'],
          ['Make time for practice', 'Find a focused exercise or return to your preparation whenever you are ready.'],
          ['Learn from each result', 'Review your answers and see what to work on next.'],
        ].map(([title, body], index) => <li key={title}><span>0{index + 1}</span><div><h3>{c(title)}</h3><p>{c(body)}</p></div></li>)}</ol>
      </section>
      <section className="liquid-final-cta glass-surface"><div><p className="liquid-eyebrow">ProfAI</p><h2>{c('Take your first step today.')}</h2></div><Link to={start} className="liquid-button primary">{c('Get started')}<ArrowRight size={19} /></Link></section>
    </main>
    <footer className="liquid-footer"><BrandLockup iconSize={32} /><span>© {new Date().getFullYear()} ProfAI</span><Link to="/premium">{c('Explore plans')}</Link><a href="mailto:support@profai.uz">{c('Support')}</a></footer>
  </div>
}
