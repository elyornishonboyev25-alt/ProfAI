import { ArrowUpRight, BookOpenCheck, GraduationCap, Headphones, Sparkles, Target } from 'lucide-react'
import { useCopy } from '@/i18n/interface'
import { BrandMark } from '@/components/brand/BrandLogo'

const tracks = [
  { label: 'IELTS practice', detail: 'Four skills, one plan', icon: Headphones, tone: 'bg-rose-50 text-rose-600' },
  { label: 'Digital SAT', detail: 'Practice and review', icon: Target, tone: 'bg-blue-50 text-blue-600' },
  { label: 'University path', detail: 'Research and prepare', icon: GraduationCap, tone: 'bg-emerald-50 text-emerald-600' },
] as const

export default function AuthShowcasePanel({ quote = 'Your university journey continues here.' }: { quote?: string }) {
  const { c } = useCopy()
  return (
    <aside className="liquid-auth-showcase auth-journey-showcase">
      <div className="auth-journey-glow" aria-hidden="true" />
      <div className="liquid-auth-brand"><BrandMark size={45} /><strong>ProfAI</strong></div>
      <div className="auth-journey-content">
        <div className="auth-journey-eyebrow"><Sparkles size={15} /> {c('A clearer path starts here')}</div>
        <div className="auth-journey-board">
          <div className="auth-journey-board-head"><span><BookOpenCheck size={17} /> YOUR JOURNEY</span><ArrowUpRight size={18} /></div>
          <h3>Everything you need,<br /><em>moving together.</em></h3>
          <div className="auth-journey-track-list">{tracks.map(({ label, detail, icon: Icon, tone }, index) => <div className="auth-journey-track" key={label}><span className={`auth-journey-track-icon ${tone}`}><Icon size={21} /></span><span><strong>{c(label)}</strong><small>{c(detail)}</small></span><b>0{index + 1}</b></div>)}</div>
          <div className="auth-journey-progress"><span>YOUR NEXT CHAPTER</span><span className="auth-journey-progress-line"><i /></span><span>STARTS HERE</span></div>
        </div>
        <div className="auth-journey-copy"><p>{c('Your path to studying abroad')}</p><h2>{c(quote)}</h2><span>{c('Prepare for IELTS, SAT, and university applications in one connected space.')}</span></div>
      </div>
    </aside>
  )
}
