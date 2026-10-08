import { BookOpen, Check, GraduationCap, ShieldCheck, Sparkles } from 'lucide-react'
import { BrandMark } from '@/components/brand/BrandLogo'
import { useCopy } from '@/i18n/interface'

export default function AccountShowcase() {
  const { c } = useCopy()
  return <aside className="account-showcase" aria-label={c('Your learning workspace')}>
    <div className="account-showcase-brand"><BrandMark size={45} /><span>Prof<span>AI</span></span></div>
    <div className="account-showcase-copy">
      <span className="account-showcase-eyebrow"><Sparkles size={15} />{c('Your next chapter')}</span>
      <h2>{c('One account.')}<br /><span>{c('Every next step.')}</span></h2>
      <p>{c('Practice IELTS and SAT. Review your results. Build your next chapter.')}</p>
    </div>
    <div className="account-showcase-exams">
      <article><span className="account-showcase-icon"><BookOpen size={26} /></span><div><h3>IELTS</h3><p>{c('Listening, Reading, Writing and Speaking.')}</p></div><Check size={18} /></article>
      <article><span className="account-showcase-icon"><GraduationCap size={26} /></span><div><h3>SAT</h3><p>{c('Reading & Writing and Math.')}</p></div><Check size={18} /></article>
    </div>
    <div className="account-showcase-footer"><ShieldCheck size={19} /><p>{c('Your practice, results and saved work. All in one place.')}</p></div>
  </aside>
}
