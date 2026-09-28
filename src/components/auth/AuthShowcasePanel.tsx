import { ArrowUpRight, BookOpen, Check, Headphones, Sparkles, Target } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCopy } from '@/i18n/interface'
import { BrandMark } from '@/components/brand/BrandLogo'
import { StudyIllustration } from '@/components/visuals/ArenaVisuals'

export default function AuthShowcasePanel({ mode }: { mode: 'login' | 'register' }) {
  const { c } = useCopy()

  return <aside className="auth-cinema-showcase" aria-label="ProfAI preparation">
    <div className="auth-arena-orb auth-arena-orb-red" aria-hidden="true" />
    <div className="auth-arena-orb auth-arena-orb-blue" aria-hidden="true" />
    <div className="auth-cinema-brand"><span className="auth-cinema-brand-icon"><BrandMark size={38} /></span><div><strong>Prof<span>AI</span></strong><small>{c('Your next chapter')}</small></div></div>

    <div className="auth-arena-main">
      <span className="auth-arena-eyebrow"><Sparkles size={14} /> {c('YOUR PREPARATION SPACE')}</span>
      <h2>{c(mode === 'register' ? 'A clearer path to your next score.' : 'Your progress is waiting for you.')}</h2>
      <p>{c('Prepare for IELTS and the Digital SAT in one workspace designed to help every session move you forward.')}</p>

      <div className="auth-arena-cards" aria-label="Exam paths">
        <div className="auth-arena-card auth-arena-card-ielts">
          <div className="auth-arena-card-top"><span><Headphones size={15} /> IELTS ARENA</span><ArrowUpRight size={17} /></div>
          <div className="auth-arena-card-body"><div><strong>Four skills.<br />One direction.</strong><small>Practice · Tests · Review</small></div><StudyIllustration variant="ielts-listening" compact /></div>
        </div>
        <div className="auth-arena-card auth-arena-card-sat">
          <div className="auth-arena-card-top"><span><Target size={15} /> DIGITAL SAT</span><ArrowUpRight size={17} /></div>
          <div className="auth-arena-card-body"><div><strong>Build a stronger<br />test day.</strong><small>Math · Reading & Writing</small></div><StudyIllustration variant="sat-math" compact /></div>
        </div>
      </div>
      <div className="auth-arena-note"><BookOpen size={18} /><span>{c('One account for practice, results and your university plan.')}</span><Check size={17} /></div>
    </div>

    <Link to="/" className="auth-arena-home">{c('Explore ProfAI')} <ArrowUpRight size={16} /></Link>
  </aside>
}
