import { ArrowUpRight, BookOpen, GraduationCap, Sparkles, Target } from 'lucide-react'
import { useCopy } from '@/i18n/interface'
import { BrandMark } from '@/components/brand/BrandLogo'

export default function AuthShowcasePanel({ quote = 'Your journey abroad starts here.' }: { quote?: string }) {
  const { c } = useCopy()

  return (
    <aside className="auth-cinema-showcase" aria-label="ProfAI">
      <div className="auth-cinema-showcase-grid" aria-hidden="true" />
      <div className="auth-cinema-brand">
        <span className="auth-cinema-brand-icon"><BrandMark size={42} /></span>
        <div><strong>Prof<span>AI</span></strong><small>{c('Your next chapter')}</small></div>
      </div>

      <div className="auth-cinema-art" aria-hidden="true">
        <div className="auth-cinema-art-halo" />
        <div className="auth-cinema-orbit auth-cinema-orbit-outer" />
        <div className="auth-cinema-orbit auth-cinema-orbit-inner" />
        <div className="auth-cinema-mark"><BrandMark size={280} /></div>
        <i className="auth-cinema-spark auth-cinema-spark-one" />
        <i className="auth-cinema-spark auth-cinema-spark-two" />
        <i className="auth-cinema-spark auth-cinema-spark-three" />
        <i className="auth-cinema-spark auth-cinema-spark-four" />
        <span className="auth-cinema-art-caption">PROFAI / YOUR FUTURE STARTS HERE</span>
      </div>

      <div className="auth-cinema-copy">
        <p className="auth-cinema-eyebrow"><Sparkles size={15} /> {c('A clearer path starts here')}</p>
        <h2>{c(quote)}</h2>
        <p className="auth-cinema-description">{c('Prepare for IELTS, SAT, and university applications in one connected space.')}</p>
        <div className="auth-cinema-path" aria-label="Learning paths">
          <span><BookOpen size={17} /> IELTS</span>
          <span><Target size={17} /> SAT</span>
          <span><GraduationCap size={18} /> {c('Universities')}</span>
          <ArrowUpRight className="auth-cinema-path-arrow" size={18} />
        </div>
      </div>
    </aside>
  )
}
