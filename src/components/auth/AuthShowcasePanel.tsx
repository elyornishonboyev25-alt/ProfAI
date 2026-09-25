import { Sparkles } from 'lucide-react'
import { useCopy } from '@/i18n/interface'
import { BrandMark } from '@/components/brand/BrandLogo'

export default function AuthShowcasePanel({ quote = 'Your journey abroad starts here.' }: { quote?: string }) {
  const { c } = useCopy()

  return (
    <aside className="auth-cinema-showcase" aria-label="ProfAI">
      <div className="auth-cinema-brand">
        <BrandMark size={48} />
        <strong>Prof<span>AI</span></strong>
      </div>

      <div className="auth-cinema-art" aria-hidden="true">
        <div className="auth-cinema-orbit auth-cinema-orbit-outer" />
        <div className="auth-cinema-orbit auth-cinema-orbit-inner" />
        <div className="auth-cinema-mark"><BrandMark size={244} /></div>
        <i className="auth-cinema-spark auth-cinema-spark-one" />
        <i className="auth-cinema-spark auth-cinema-spark-two" />
        <i className="auth-cinema-spark auth-cinema-spark-three" />
        <i className="auth-cinema-spark auth-cinema-spark-four" />
      </div>

      <div className="auth-cinema-copy">
        <p><Sparkles size={15} /> {c('A clearer path starts here')}</p>
        <h2>{c(quote)}</h2>
        <span>{c('Prepare for IELTS, SAT, and university applications in one connected space.')}</span>
      </div>
    </aside>
  )
}
