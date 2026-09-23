import { useCopy } from '@/i18n/interface'
import { BrandMark } from '@/components/brand/BrandLogo'
export default function AuthShowcasePanel({ quote = 'Your university journey continues here.' }: { quote?: string }) {
  const { c }=useCopy()
  return <aside className="liquid-auth-showcase"><img src="/assets/auth/students-collaborating.webp" alt="" /><div className="liquid-auth-brand"><BrandMark size={45} /><strong>ProfAI</strong></div><div className="liquid-auth-story"><p>{c('Your path to studying abroad')}</p><h2>{c(quote)}</h2><span>{c('Prepare for IELTS, SAT, and university applications in one connected space.')}</span></div></aside>
}
