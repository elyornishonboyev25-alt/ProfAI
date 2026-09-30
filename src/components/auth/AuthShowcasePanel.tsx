import { BookOpen, ChartNoAxesCombined, GraduationCap, Sparkles } from 'lucide-react'
import { useCopy } from '@/i18n/interface'
import { BrandMark } from '@/components/brand/BrandLogo'

export default function AuthShowcasePanel({ mode }: { mode: 'login' | 'register' }) {
  const { c } = useCopy()
  const features = [
    { icon: BookOpen, title: 'Practice with purpose', detail: 'IELTS and Digital SAT practice, full tests, and answer review.' },
    { icon: ChartNoAxesCombined, title: 'See your progress', detail: 'Keep your results and score goals together in one profile.' },
    { icon: GraduationCap, title: 'Plan what comes next', detail: 'Explore universities and prepare for applications.' },
  ]

  return <aside id="auth-showcase" className="auth-cinema-showcase" aria-label={mode === 'register' ? 'ProfAI account features' : 'ProfAI sign in features'}>
    <div className="auth-arena-orb auth-arena-orb-red" aria-hidden="true" />
    <div className="auth-arena-orb auth-arena-orb-blue" aria-hidden="true" />
    <div className="auth-cinema-brand"><span className="auth-cinema-brand-icon"><BrandMark size={38} /></span><div><strong>Prof<span>AI</span></strong><small>{c('Your next chapter')}</small></div></div>

    <div className="auth-arena-main">
      <span className="auth-arena-eyebrow"><Sparkles size={14} /> {c('Your preparation space')}</span>
      <h2>{c('A clear path to your goals.')}</h2>
      <p>{c('Everything you need to practice, understand your results, and plan your next step in one place.')}</p>
      <div className="auth-arena-features">
        {features.map(({ icon: Icon, title, detail }) => <div className="auth-arena-feature" key={title}>
          <span className="auth-arena-feature-icon"><Icon size={20} /></span>
          <span><strong>{c(title)}</strong><small>{c(detail)}</small></span>
        </div>)}
      </div>
    </div>
  </aside>
}
